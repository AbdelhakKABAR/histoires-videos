"""Nouveaux formats de QUIZ (1080x1920, voix siwis) : mot mystère, l'intrus, suite logique.
   python3 formats.py <fichier.json> <sortie.mp4> [--theme nom]
   Le fichier dit quel format ("format": "mot" | "intrus" | "logique") et contient les manches (voir jeux d'essai dans quiz/)."""
import argparse, glob, hashlib, json, math, os, random, subprocess, sys, time, wave
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import numpy as np
import cairo
from common import Painter, Encoder, W, H, FPS, ease, back, rrect
from themes import THEMES

SR = 44100
VERT, ROUGE = (0.25, 0.85, 0.45), (1.0, 0.3, 0.35)

# ---------------- voix (Piper fr_FR siwis, la voix choisie par l'utilisateur) ----------------
_tts = None
def voix(text, speed=0.95):
    global _tts
    cache = os.path.expanduser("~/voix/cache"); os.makedirs(cache, exist_ok=True)
    key = os.path.join(cache, hashlib.md5(f"{text}|{speed}".encode()).hexdigest() + ".npy")
    if os.path.exists(key): return np.load(key)
    if _tts is None:
        import sherpa_onnx
        PD = os.path.expanduser("~/voix/vits-piper-fr_FR-siwis-medium")
        if not os.path.isdir(PD):
            subprocess.run(f"mkdir -p ~/voix && cd ~/voix && curl -sSL --fail https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-fr_FR-siwis-medium.tar.bz2 | tar xj", shell=True, check=True)
        _tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
            vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=glob.glob(PD + "/*.onnx")[0], tokens=PD + "/tokens.txt",
                                                       data_dir=PD + "/espeak-ng-data"), num_threads=2)))
    a = _tts.generate(text, sid=0, speed=speed)
    from scipy.signal import resample_poly
    x = resample_poly(np.asarray(a.samples, dtype=np.float64), SR, a.sample_rate)
    idx = np.where(np.abs(x) > 0.02 * np.max(np.abs(x)))[0]; x = x[max(idx[0] - 400, 0): idx[-1] + 3000]
    x[-2000:] *= np.linspace(1, 0, 2000); x = x / (np.max(np.abs(x)) + 1e-9) * 0.9
    np.save(key, x); return x


class Timeline:
    def __init__(self): self.t = 0.0; self.clips = []; self.sfx = []
    def say(self, text, speed=0.95, gap=0.25):
        x = voix(text, speed); t0 = self.t; self.clips.append((t0, x)); self.t += len(x) / SR + gap
        return t0, t0 + len(x) / SR
    def wait(self, s): t0 = self.t; self.t += s; return t0, self.t
    def fx(self, kind, at): self.sfx.append((at, kind))


# ---------------- son : voix + petite musique + effets ----------------
def mix(path, dur, clips, sfx, seed):
    rng = np.random.default_rng(seed); N = int(dur * SR); m = np.zeros(N); v = np.zeros(N)
    def add(buf, sig, t, g=1.0):
        i = int(t * SR)
        if 0 <= i < N: j = min(N, i + len(sig)); buf[i:j] += sig[:j - i] * g
    def tone(f, l, d, typ="sin"):
        n = int(l * SR); t = np.arange(n) / SR; ph = 2 * np.pi * f * t
        w = np.sin(ph) if typ == "sin" else (2 * (ph / (2 * np.pi) % 1) - 1)
        return w * np.minimum(1, t / 0.003) * np.exp(-t / d)
    root = 110 * 2 ** (int(rng.integers(0, 5)) / 12); bpm = float(rng.integers(92, 112)); beat = 60 / bpm
    prog = [0, 5, 3, 7] if rng.random() < 0.5 else [0, 8, 5, 7]
    t, b = 0.0, 0
    kn = int(0.3 * SR); tk = np.arange(kn) / SR; kick = np.sin(2 * np.pi * (50 + 90 * np.exp(-tk * 30)) * tk) * np.exp(-tk * 10)
    while t < dur:
        r = root * 2 ** (prog[(b // 8) % 4] / 12)
        if b % 8 == 0:
            for k in (1, 1.5, 2):
                n = int(beat * 8 * SR); tt = np.arange(n) / SR
                pad = np.sin(2 * np.pi * r * k * tt) * np.minimum(1, tt / 0.6) * np.minimum(1, (n / SR - tt) / 0.6)
                add(m, pad, t, 0.06)
        if b % 2 == 0: add(m, kick, t, 0.35)
        add(m, tone(r * 4 * (1.5 if b % 4 == 3 else 1), beat * 0.4, 0.06), t + beat / 2, 0.05)
        t += beat; b += 1
    for (t0, x) in clips: add(v, x, t0)
    for (t0, kind) in sfx:
        if kind == "tic": add(m, tone(1500, 0.05, 0.015), t0, 0.35)
        elif kind == "lettre": add(m, tone(900 + 300 * rng.random(), 0.12, 0.04), t0, 0.3)
        elif kind == "bon":
            for j, f in enumerate((660, 880, 1320)): add(m, tone(f, 0.35, 0.18), t0 + j * 0.07, 0.35)
        elif kind == "faux":
            add(m, tone(160, 0.35, 0.2, "saw"), t0, 0.25)
        elif kind == "whoosh":
            n = int(0.35 * SR); add(m, rng.standard_normal(n) * np.sin(np.linspace(0, np.pi, n)) * 0.25, t0, 0.5)
    # la musique baisse quand la voix parle
    env = np.convolve(np.abs(v), np.ones(4410) / 4410, mode="same"); duck = 1 - 0.55 * np.clip(env / 0.08, 0, 1)
    out = m * duck + v * 1.0
    out /= np.max(np.abs(out)) + 1e-9; out *= 0.9
    with wave.open(path, "wb") as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes((out * 32767).astype(np.int16).tobytes())


# ---------------- outils de dessin ----------------
def wrap(cr, pt, s, size, maxw, font="Inter Display"):
    cr.select_font_face(font, cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD); cr.set_font_size(size)
    words, lines, cur = s.replace(" ?", " ?").replace(" !", " !").replace(" :", " :").split(" "), [], ""
    for w_ in words:
        tst = (cur + " " + w_).strip()
        if cr.text_extents(tst).width > maxw and cur: lines.append(cur); cur = w_
        else: cur = tst
    lines.append(cur); return lines

def lines_text(cr, pt, s, y, size, maxw=960, color=(1, 1, 1), a=1.0, lh=1.2):
    for j, ln in enumerate(wrap(cr, pt, s, size, maxw)):
        pt.text(cr, ln, W / 2, y + j * size * lh, size, color=color, a=a, font="Inter Display")

def header(cr, pt, titre, num, nb):
    pt.panel(cr, 60, 140, 960, 110)
    pt.text(cr, titre, 100, 212, 46, color=pt.th["accent"], align="l")
    pt.text(cr, f"{num}/{nb}", 980, 212, 44, align="r", font="Inter Display")

def chrono(cr, pt, x, y, r, frac, label=None):
    cr.new_path(); cr.set_source_rgba(1, 1, 1, 0.15); cr.set_line_width(12); cr.arc(x, y, r, 0, 6.29); cr.stroke()
    cr.new_path(); cr.set_source_rgb(*pt.th["accent"]); cr.arc(x, y, r, -math.pi / 2, -math.pi / 2 + 2 * math.pi * max(0, frac)); cr.stroke()
    if label: pt.text(cr, label, x, y + 22, 64, font="Inter Display")

def card(cr, pt, x, y, w, h, txt, state=None, a=1.0, size=48):
    """state : None (neutre), 'bon' (vert), 'faux' (rouge), 'pale' (grisé)."""
    rrect(cr, x, y, w, h, 26)
    fill = {None: (0.04, 0.05, 0.11), "bon": (0.12, 0.6, 0.3), "faux": (0.75, 0.15, 0.2), "pale": (0.04, 0.05, 0.11)}[state]
    cr.set_source_rgba(*fill, 0.92 * a); cr.fill_preserve()
    cr.set_source_rgba(*(pt.th["ligne"] if state is None else (1, 1, 1)), (0.6 if state != "pale" else 0.15) * a); cr.set_line_width(3); cr.stroke()
    sz = size if len(txt) <= 12 else size * 12 / len(txt) + 6
    pt.text(cr, txt, x + w / 2, y + h / 2 + sz * 0.36, sz, a=a * (0.35 if state == "pale" else 1), font="Inter Display")


# ---------------- FORMAT 1 : MOT MYSTÈRE ----------------
def build_mot(Q, tl):
    S = []
    tl.wait(0.3); S.append(("intro", *tl.say(Q.get("intro", "Trouve le mot mystère avant la fin des indices !"), 0.9)))
    tl.wait(0.3)
    for n, m in enumerate(Q["manches"]):
        mot = m["mot"].upper(); seg = {"kind": "mot", "n": n, "m": m, "mot": mot}
        seg["t0"] = tl.t; tl.fx("whoosh", tl.t)
        tl.say(f"Mot mystère numéro {n + 1}. {m['categorie']}.", 0.95, 0.5)
        seg["indices"] = []
        for ind in m["indices"]:
            a0, a1 = tl.say(ind, 0.95, 1.4); seg["indices"].append(a0)
        seg["c0"] = tl.t; tl.wait(3.0); seg["c1"] = tl.t
        for s in range(3): tl.fx("tic", seg["c0"] + s)
        seg["rev"] = tl.t; tl.fx("bon", tl.t)
        tl.say(f"C'était : {m.get('dire', m['mot'])} !", 0.95, 1.0); seg["t1"] = tl.t
        # ordre de dévoilement des lettres : on garde toujours au moins 2 lettres cachées avant la fin
        letters = [i for i, c in enumerate(mot) if c.isalpha()]
        rng = random.Random(mot); rng.shuffle(letters)
        k = max(0, len(letters) - 2 - len(letters) // 3)
        times = np.linspace(seg["indices"][0] + 1.0, seg["c0"], k + 1)[:-1] if k else []
        seg["reveal"] = list(zip(letters[:k], times))
        for _, tt in seg["reveal"]: tl.fx("lettre", tt)
        S.append(seg)
    S.append(("outro", *tl.say(Q.get("fin", "Combien de mots as-tu trouvés ? Dis-le en commentaire !"), 0.9, 1.5)))
    return S

def draw_mot(cr, pt, seg, t, nb, titre):
    mot, m = seg["mot"], seg["m"]
    header(cr, pt, titre, seg["n"] + 1, nb)
    pt.text(cr, m["categorie"].upper(), W / 2, 380, 52, color=pt.th["accent2"], font="Inter Display")
    # tuiles
    n = len(mot); tw = min(110, 960 / n - 10); gap = 10; x0 = W / 2 - (n * (tw + gap) - gap) / 2; y0 = 470
    shown = {i for i, tt in seg["reveal"] if t >= tt}
    full = t >= seg["rev"]
    for i, c in enumerate(mot):
        x = x0 + i * (tw + gap)
        if c == " ": continue
        flip = 1.0
        rt = dict(seg["reveal"]).get(i, seg["rev"])
        if t >= rt: flip = abs(math.cos(min(1, (t - rt) / 0.35) * math.pi))
        vis = (i in shown or full) and t - rt > 0.175
        cr.save(); cr.translate(x + tw / 2, y0 + tw * 0.65); cr.scale(1, max(0.05, flip))
        rrect(cr, -tw / 2, -tw * 0.65, tw, tw * 1.3, 14)
        cr.set_source_rgb(*((0.12, 0.6, 0.3) if full and vis else (pt.th["mur"] if not vis else (0.95, 0.95, 0.98))))
        cr.fill_preserve(); cr.set_source_rgba(*pt.th["ligne"], 0.8); cr.set_line_width(3); cr.stroke()
        if vis:
            pt.text(cr, c, 0, tw * 0.25, tw * 0.75, color=(1, 1, 1) if full else (0.08, 0.08, 0.12), shadow=False, font="Inter Display")
        cr.restore()
    # indices
    for j, (ind, ta) in enumerate(zip(m["indices"], seg["indices"])):
        if t < ta: continue
        a = ease((t - ta) / 0.3); y = 760 + j * 175
        rrect(cr, 70, y, 940, 150, 24); cr.set_source_rgba(0.03, 0.04, 0.10, 0.85 * a); cr.fill()
        cr.new_path(); cr.set_source_rgba(*pt.th["accent"], a); cr.arc(130, y + 75, 34, 0, 6.29); cr.fill()
        pt.text(cr, str(j + 1), 130, y + 92, 44, color=(0.08, 0.08, 0.1), a=a, shadow=False, font="Inter Display")
        ls = wrap(cr, pt, ind, 40, 780)
        for q, ln in enumerate(ls[:3]):
            pt.text(cr, ln, 190, y + 75 + (q - (len(ls) - 1) / 2) * 46 + 14, 40, a=a, align="l", font="Inter Display")
    if seg["c0"] <= t < seg["c1"]:
        chrono(cr, pt, W / 2, 1360, 90, 1 - (t - seg["c0"]) / 3, str(3 - int(t - seg["c0"])))


# ---------------- FORMAT 2 : L'INTRUS ----------------
def build_intrus(Q, tl):
    S = []
    tl.wait(0.3); S.append(("intro", *tl.say(Q.get("intro", "Trouve l'intrus ! Attention, il y a des pièges."), 0.9)))
    tl.wait(0.3)
    for n, m in enumerate(Q["manches"]):
        seg = {"kind": "intrus", "n": n, "m": m, "t0": tl.t}; tl.fx("whoosh", tl.t)
        seg["items"] = []
        for it in m["items"]:
            a0, _ = tl.say(it, 1.0, 0.25); seg["items"].append(a0)
        seg["c0"] = tl.t; tl.wait(4.0); seg["c1"] = tl.t
        for s in range(4): tl.fx("tic", seg["c0"] + s)
        seg["rev"] = tl.t; tl.fx("faux", tl.t); tl.fx("bon", tl.t + 0.3)
        tl.say(m["explication_dite"] if "explication_dite" in m else m["explication"], 0.95, 1.2); seg["t1"] = tl.t
        S.append(seg)
    S.append(("outro", *tl.say(Q.get("fin", "Combien d'intrus as-tu trouvés ? Ton score en commentaire !"), 0.9, 1.5)))
    return S

def draw_intrus(cr, pt, seg, t, nb, titre):
    m = seg["m"]; header(cr, pt, titre, seg["n"] + 1, nb)
    pt.text(cr, m.get("consigne", "Qui est l'intrus ?"), W / 2, 390, 60, color=pt.th["accent2"], font="Inter Display")
    rev = t >= seg["rev"]
    for i, (it, ta) in enumerate(zip(m["items"], seg["items"])):
        if t < ta: continue
        s = back((t - ta) / 0.3); x = 75 + (i % 2) * 475; y = 480 + (i // 2) * 300
        state = None
        if rev: state = "faux" if i == m["intrus"] else "pale"
        cr.save(); cr.translate(x + 227, y + 130); cr.scale(s, s)
        card(cr, pt, -227, -130, 455, 260, it, state, size=56)
        cr.restore()
        if rev and i == m["intrus"]:
            e = t - seg["rev"]; sc = back(e / 0.3)
            cr.save(); cr.translate(x + 227, y + 40); cr.rotate(-0.12); cr.scale(sc, sc)
            rrect(cr, -110, -36, 220, 72, 14); cr.set_source_rgb(1, 1, 1); cr.fill()
            pt.text(cr, "INTRUS", 0, 16, 44, color=ROUGE, shadow=False, font="Inter Display"); cr.restore()
    if seg["c0"] <= t < seg["c1"]:
        chrono(cr, pt, W / 2, 1210, 90, 1 - (t - seg["c0"]) / 4, str(4 - int(t - seg["c0"])))
    if rev:
        a = ease((t - seg["rev"]) / 0.3)
        rrect(cr, 70, 1110, 940, 200, 26); cr.set_source_rgba(0.03, 0.04, 0.10, 0.88 * a); cr.fill()
        lines_text(cr, pt, m["explication"], 1185, 46, 880, a=a)


# ---------------- FORMAT 3 : SUITE LOGIQUE ----------------
def build_logique(Q, tl):
    S = []
    tl.wait(0.3); S.append(("intro", *tl.say(Q.get("intro", "Trouve la suite logique ! Seulement les plus malins vont jusqu'au bout."), 0.9)))
    tl.wait(0.3)
    for n, m in enumerate(Q["manches"]):
        seg = {"kind": "logique", "n": n, "m": m, "t0": tl.t}; tl.fx("whoosh", tl.t)
        a0, a1 = tl.say(m.get("question_dite", "Quelle est la suite ?"), 0.95, 0.4); seg["q"] = a0
        seg["tiles"] = [a0 + 0.15 * i for i in range(len(m["suite"]))]
        seg["c0"] = tl.t; tl.wait(5.0); seg["c1"] = tl.t
        for s in range(5): tl.fx("tic", seg["c0"] + s)
        seg["rev"] = tl.t; tl.fx("bon", tl.t)
        tl.say(m["explication_dite"] if "explication_dite" in m else m["explication"], 0.95, 1.2); seg["t1"] = tl.t
        S.append(seg)
    S.append(("outro", *tl.say(Q.get("fin", "Combien de suites as-tu trouvées ? Ton score en commentaire !"), 0.9, 1.5)))
    return S

def draw_logique(cr, pt, seg, t, nb, titre):
    m = seg["m"]; header(cr, pt, titre, seg["n"] + 1, nb)
    pt.text(cr, m.get("consigne", "Quelle est la suite ?"), W / 2, 390, 60, color=pt.th["accent2"], font="Inter Display")
    items = m["suite"] + ["?"]; n = len(items)
    tw = min(140, 960 / n - 12); x0 = W / 2 - (n * (tw + 12) - 12) / 2
    rev = t >= seg["rev"]
    for i, it in enumerate(items):
        ta = seg["tiles"][min(i, len(seg["tiles"]) - 1)] + (0.15 if i == n - 1 else 0)
        if t < ta: continue
        s = back((t - ta) / 0.3); x = x0 + i * (tw + 12)
        last = i == n - 1
        txt = m["options"][m["ok"]] if (last and rev) else it
        cr.save(); cr.translate(x + tw / 2, 560); cr.scale(s, s)
        rrect(cr, -tw / 2, -tw * 0.6, tw, tw * 1.2, 18)
        cr.set_source_rgb(*((0.12, 0.6, 0.3) if last and rev else (pt.th["accent"] if last else (0.06, 0.07, 0.14))))
        cr.fill_preserve(); cr.set_source_rgba(*pt.th["ligne"], 0.7); cr.set_line_width(3); cr.stroke()
        sz = tw * (0.55 if len(txt) <= 2 else 1.1 / len(txt) * 1.1)
        pt.text(cr, txt, 0, sz * 0.36, sz, color=(0.08, 0.08, 0.1) if last and not rev else (1, 1, 1), shadow=False, font="Inter Display")
        cr.restore()
    if t >= seg["q"] + 0.6:
        for i, op in enumerate(m["options"]):
            x = 75 + (i % 2) * 475; y = 760 + (i // 2) * 170
            state = ("bon" if i == m["ok"] else "pale") if rev else None
            card(cr, pt, x, y, 455, 140, f"{'ABCD'[i]}   {op}", state, a=ease((t - seg['q'] - 0.6) / 0.3), size=52)
    if seg["c0"] <= t < seg["c1"]:
        chrono(cr, pt, W / 2, 1220, 90, 1 - (t - seg["c0"]) / 5, str(5 - int(t - seg["c0"])))
    if rev:
        a = ease((t - seg["rev"]) / 0.3)
        rrect(cr, 70, 1120, 940, 190, 26); cr.set_source_rgba(0.03, 0.04, 0.10, 0.88 * a); cr.fill()
        lines_text(cr, pt, m["explication"], 1195, 46, 880, a=a)


FORMATS = {"mot": (build_mot, draw_mot), "intrus": (build_intrus, draw_intrus), "logique": (build_logique, draw_logique)}


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("fichier"); ap.add_argument("out"); ap.add_argument("--theme")
    a = ap.parse_args()
    Q = json.load(open(a.fichier)); out = os.path.abspath(a.out); os.chdir(HERE)
    rnd = random.Random(time.time_ns())
    th = THEMES[a.theme or Q.get("theme") or rnd.choice(list(THEMES))]
    pt = Painter(th, [], 1)
    build, draw = FORMATS[Q["format"]]
    tl = Timeline(); S = build(Q, tl); dur = tl.t + 0.5
    nb = len(Q["manches"]); titre = Q.get("titre", "QUIZ")
    segs = [s for s in S if isinstance(s, dict)]
    intro, outro = S[0], S[-1]
    enc = Encoder(os.path.join(HERE, "video_muet.mp4")); cr = enc.cr
    for g in range(int(dur * FPS)):
        t = g / FPS
        pt.background(cr, 0, t)
        cur = next((s for s in segs if s["t0"] <= t < s["t1"]), None)
        if t < (segs[0]["t0"] if segs else 1e9):
            e = t
            pt.text(cr, titre, W / 2, 820, 104, color=th["accent"], a=ease(e / 0.4))
            lines_text(cr, pt, Q.get("sous_titre", ""), 930, 50, a=ease((e - 0.3) / 0.4))
        elif cur is not None:
            draw(cr, pt, cur, t, nb, titre)
        elif t >= outro[1] - 0.2:
            e = t - outro[1] + 0.2
            lines_text(cr, pt, Q.get("fin_ecrite", "Combien tu en as eu ?"), 820, 80, color=th["accent"], a=ease(e / 0.4))
            pt.text(cr, f"Ton score sur {nb} en commentaire !", W / 2, 1010, 52, a=ease((e - 0.4) / 0.4), font="Inter Display")
            pt.text(cr, "Abonne-toi pour le prochain défi", W / 2, 1110, 44, color=th["accent2"], a=ease((e - 0.8) / 0.4), font="Inter Display")
        enc.push()
    enc.close()
    mix("son.wav", dur, tl.clips, tl.sfx, rnd.randrange(10 ** 6))
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", "video_muet.mp4", "-i", "son.wav", "-af",
                    "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
                    "-shortest", "-movflags", "+faststart", out], check=True)
    for f_ in ("video_muet.mp4", "son.wav"):
        try: os.remove(f_)
        except OSError: pass
    print(json.dumps({"video": out, "format": Q["format"], "theme": th["nom"], "duree": round(dur, 1)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
