"""QUIZ « la bonne réponse survit » (1080x1920).
   Pour chaque question, les 4 réponses sont des billes A B C D qui rebondissent dans un anneau qui tourne.
   L'anneau s'ouvre : les mauvaises réponses s'échappent une à une, la bonne reste seule → révélation.
   Le spectateur doit trouver avant que les mauvaises sortent.
   python3 quiz_elim.py <quiz.json> <sortie.mp4> [--theme nom]
   quiz.json : {"titre": "CAPITALES PIÈGES", "fin": "Combien tu en as eu ?", "description": "...",
                "questions": [{"q": "Capitale de l'Australie ?", "r": ["Sydney", "Canberra", "Melbourne", "Perth"], "ok": 1}, ...]}"""
import argparse, json, math, os, random, subprocess, sys, time
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import pymunk, cairo
import audio
from common import Painter, Encoder, W, H, FPS, ease, back, rrect
from themes import THEMES

CX, CY, RING, BR = 540, 1000, 330, 62
LET = "ABCD"
COLS = [(0.95, 0.3, 0.3), (0.2, 0.55, 1.0), (1.0, 0.75, 0.15), (0.65, 0.4, 0.95)]
T_Q, T_OPEN, T_FORCE, T_REVEAL = 10.0, 3.6, 6.8, 8.4      # timeline d'une question (s)
INTRO, OUTRO = 2.2, 4.5


def simulate(ok, seed):
    """Renvoie les positions des 4 billes à chaque image et l'heure de sortie des mauvaises."""
    rng = random.Random(seed)
    sp = pymunk.Space(); sp.gravity = (0, 650)
    ring = pymunk.Body(body_type=pymunk.Body.KINEMATIC); ring.position = (CX, CY)
    ring.angular_velocity = rng.choice((-1, 1)) * rng.uniform(1.0, 1.5); ring.angle = rng.uniform(0, 6.28)
    sp.add(ring)
    st = {"shapes": [], "gap": 0.0}
    GOOD, BAD = 0b01, 0b10

    def set_gap(g):
        if st["shapes"]: sp.remove(*st["shapes"])
        sh = []; segs = 56
        a0, a1 = g / 2, 2 * math.pi - g / 2 + (0.0001 if g == 0 else 0)
        for s in range(segs):
            u, v = a0 + (a1 - a0) * s / segs, a0 + (a1 - a0) * (s + 1) / segs
            seg = pymunk.Segment(ring, (RING * math.cos(u), RING * math.sin(u)), (RING * math.cos(v), RING * math.sin(v)), 10)
            seg.elasticity = 0.98; seg.friction = 0.2; seg.filter = pymunk.ShapeFilter(categories=0b100, mask=GOOD | BAD)
            sh.append(seg)
        sp.add(*sh); st["shapes"] = sh; st["gap"] = g
    set_gap(0.0)
    # anneau invisible complet qui ne retient QUE la bonne réponse
    inv = []
    for s in range(56):
        u, v = 2 * math.pi * s / 56, 2 * math.pi * (s + 1) / 56
        seg = pymunk.Segment(sp.static_body, (CX + RING * math.cos(u), CY + RING * math.sin(u)),
                             (CX + RING * math.cos(v), CY + RING * math.sin(v)), 10)
        seg.elasticity = 0.98; seg.filter = pymunk.ShapeFilter(categories=0b1000, mask=GOOD); inv.append(seg)
    sp.add(*inv)
    balls = []
    for i in range(4):
        b = pymunk.Body(1, pymunk.moment_for_circle(1, 0, BR))
        a = math.pi / 4 + i * math.pi / 2; b.position = (CX + 150 * math.cos(a), CY + 150 * math.sin(a))
        b.velocity = (rng.uniform(-350, 350), rng.uniform(-450, 0))
        c = pymunk.Circle(b, BR); c.elasticity = 0.95; c.friction = 0.3
        c.filter = pymunk.ShapeFilter(categories=GOOD if i == ok else BAD, mask=GOOD | BAD | 0b100 | 0b1000)
        sp.add(b, c); balls.append(b)
    frames, out_t, t, dt = [], {}, 0.0, 1 / (FPS * 8)
    hits, cur = [], [0.0]

    def post(arb, s, d):
        if arb.is_first_contact and arb.total_impulse.length > 80: hits.append(cur[0])
    sp.on_collision(0, 0, post_solve=post)
    n_fr = int(T_Q * FPS)
    for k in range(n_fr):
        for _ in range(8):
            sp.step(dt); t += dt; cur[0] = t
        if t >= T_OPEN and st["gap"] == 0.0: set_gap(rng.uniform(0.75, 0.9))
        if t >= T_FORCE and k % 6 == 0 and st["gap"] < 2.6: set_gap(st["gap"] + 0.18)   # on finit toujours à temps
        for i, b in enumerate(balls):
            d = math.hypot(b.position.x - CX, b.position.y - CY)
            if i != ok and i not in out_t and d > RING + BR + 10: out_t[i] = t
            if (i == ok or i not in out_t) and b.velocity.length < 380:
                b.velocity = b.velocity * (380 / max(1, b.velocity.length))
        frames.append({"t": t, "b": [(b.position.x, b.position.y, b.angle) for b in balls],
                       "ring": (ring.angle, st["gap"])})
    return frames, out_t, hits


def wrap(pt, cr, s, size, maxw):
    words, lines, cur_ = s.replace(" ?", "\u00a0?").replace(" !", "\u00a0!").split(" "), [], ""
    cr.select_font_face(pt.th["police"], cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD if pt.th["gras"] else cairo.FONT_WEIGHT_NORMAL)
    cr.set_font_size(size)
    for w_ in words:
        tst = (cur_ + " " + w_).strip()
        if cr.text_extents(tst).width > maxw and cur_: lines.append(cur_); cur_ = w_
        else: cur_ = tst
    lines.append(cur_); return lines


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("quiz"); ap.add_argument("out"); ap.add_argument("--theme")
    a = ap.parse_args()
    Q = json.load(open(a.quiz)); out = os.path.abspath(a.out); os.chdir(HERE)
    rnd = random.Random(time.time_ns())
    th = THEMES[a.theme or Q.get("theme") or rnd.choice(list(THEMES))]
    pt = Painter(th, [], 1)
    sims = []
    for q in Q["questions"]:
        for _ in range(60):                      # garder une partie où les 3 mauvaises sortent à des moments bien espacés
            fr, out_t, hits = simulate(q["ok"], rnd.randrange(10 ** 7))
            ts = sorted(out_t.values())
            if len(ts) == 3 and ts[0] > T_OPEN + 0.5 and ts[-1] < T_REVEAL - 0.2 and min(b - a_ for a_, b in zip(ts, ts[1:])) > 0.5:
                break
        sims.append((fr, out_t, hits))
    nq = len(Q["questions"])
    n_in, n_q, n_out = int(INTRO * FPS), int(T_Q * FPS), int(OUTRO * FPS)
    total = n_in + nq * n_q + n_out
    enc = Encoder(os.path.join(HERE, "video_muet.mp4")); cr = enc.cr
    for g in range(total):
        T = g / FPS
        pt.background(cr, 0, T)
        if g < n_in:
            pt.text(cr, Q.get("titre", "QUIZ"), W / 2, 820, 110, color=th["accent"], a=ease(T / 0.4))
            pt.text(cr, f"{nq} questions", W / 2, 930, 60, a=ease((T - 0.3) / 0.4))
            pt.text(cr, "Trouve la bonne réponse", W / 2, 1060, 50, a=ease((T - 0.6) / 0.4), light=True)
            pt.text(cr, "avant que les mauvaises s'échappent !", W / 2, 1130, 50, a=ease((T - 0.6) / 0.4), light=True)
        elif g < n_in + nq * n_q:
            qi, k = divmod(g - n_in, n_q); q = Q["questions"][qi]; fr, out_t, _ = sims[qi]
            f = fr[k]; t = f["t"]; ok = q["ok"]
            # en-tête
            pt.panel(cr, 60, 140, 960, 110)
            pt.text(cr, Q.get("titre", "QUIZ"), 100, 212, 44, color=th["accent"], align="l")
            pt.text(cr, f"{qi + 1}/{nq}", 980, 212, 44, align="r", font="Inter Display")
            # question
            lines = wrap(pt, cr, q["q"], 66, 940)
            for j, ln in enumerate(lines[:3]):
                pt.text(cr, ln, W / 2, 360 + j * 80, 66, a=ease(t / 0.4))
            # anneau
            cr.new_path()
            ang, gap = f["ring"]
            for lw, al in ((40, 0.12), (24, 0.25), (16, 1.0)):
                cr.set_source_rgba(*th["ligne"], al); cr.set_line_width(lw)
                cr.arc(CX, CY, RING, ang + gap / 2, ang + 2 * math.pi - gap / 2); cr.stroke()
            # billes
            for i in range(4):
                x, y, rot = f["b"][i]
                gone = i in out_t and t > out_t[i]
                if gone and t - out_t[i] > 1.0: continue
                al = 1 - (t - out_t[i]) if gone else 1
                rv = i == ok and t >= T_REVEAL
                sc = 1 + 0.25 * back((t - T_REVEAL) / 0.4) if rv else 1
                col = (0.15, 0.8, 0.35) if rv else COLS[i]
                cr.new_path(); cr.save(); cr.translate(x, y); cr.scale(sc, sc)
                if rv:
                    cr.set_source_rgba(0.3, 1, 0.5, 0.35); cr.arc(0, 0, BR + 26, 0, 6.29); cr.fill()
                gr = cairo.RadialGradient(-BR * 0.35, -BR * 0.4, 4, 0, 0, BR)
                gr.add_color_stop_rgba(0, *(min(1, c * 1.4 + 0.15) for c in col), al); gr.add_color_stop_rgba(1, *(c * 0.65 for c in col), al)
                cr.set_source(gr); cr.arc(0, 0, BR, 0, 6.29); cr.fill()
                cr.set_source_rgba(1, 1, 1, al); cr.set_line_width(5); cr.arc(0, 0, BR, 0, 6.29); cr.stroke()
                pt.text(cr, LET[i], 0, 30, 84, a=al, font="Inter Display")
                cr.restore()
                if gone and t - out_t[i] < 0.9:
                    pt.text(cr, "✗", x, y + 40, 120, color=(1, 0.25, 0.3), a=1 - (t - out_t[i]) / 0.9, font="DejaVu Sans")
            # réponses (2 x 2)
            for i in range(4):
                xx = 75 + (i % 2) * 475; yy = 1370 + (i // 2) * 105
                gone = i in out_t and t > out_t[i]; rv = i == ok and t >= T_REVEAL
                rrect(cr, xx, yy, 455, 88, 22)
                cr.set_source_rgba(*((0.15, 0.7, 0.3) if rv else (0.03, 0.04, 0.09)), 0.92 if not gone else 0.45); cr.fill()
                cr.new_path(); cr.set_source_rgba(*COLS[i], 0.35 if gone else 1); cr.arc(xx + 46, yy + 44, 30, 0, 6.29); cr.fill()
                pt.text(cr, LET[i], xx + 46, yy + 58, 38, a=0.4 if gone else 1, font="Inter Display", shadow=False)
                rep = q["r"][i]
                pt.text(cr, rep, xx + 90, yy + 58, 38 if len(rep) <= 14 else 30, a=0.35 if gone else 1, align="l", font="Inter Display")
                if gone:
                    cr.set_source_rgba(1, 0.3, 0.35, 0.9); cr.set_line_width(5)
                    cr.move_to(xx + 85, yy + 46); cr.line_to(xx + 440, yy + 46); cr.stroke()
            # compte à rebours de lecture
            if t < T_OPEN:
                left = T_OPEN - t
                cr.new_path(); cr.set_source_rgba(1, 1, 1, 0.15); cr.set_line_width(10); cr.arc(CX, CY, 90, 0, 6.29); cr.stroke()
                cr.set_source_rgb(*th["accent"]); cr.arc(CX, CY, 90, -math.pi / 2, -math.pi / 2 + 2 * math.pi * left / T_OPEN); cr.stroke()
            if t >= T_REVEAL:
                e = t - T_REVEAL
                pt.text(cr, "✓ " + q["r"][ok], W / 2, 610, 70 * back(e / 0.35), color=(0.35, 1, 0.5), font="DejaVu Sans")
        else:
            e = (g - n_in - nq * n_q) / FPS
            pt.text(cr, Q.get("fin", "Combien tu en as eu ?"), W / 2, 860, 80, color=th["accent"], a=ease(e / 0.4))
            pt.text(cr, f"Ton score sur {nq} en commentaire !", W / 2, 980, 54, a=ease((e - 0.4) / 0.4), font="Inter Display")
            pt.text(cr, "Abonne-toi pour le prochain défi", W / 2, 1090, 46, color=th["accent2"], a=ease((e - 0.8) / 0.4), font="Inter Display")
        enc.push()
    enc.close()
    # son
    ev = []
    for qi, (fr, out_t, hits) in enumerate(sims):
        t0 = INTRO + qi * T_Q
        ev += [(t0 + h, "tick", 0.5) for h in hits]
        ev += [(t0 + t, "elim", 0.8) for t in out_t.values()]
        ev += [(t0 + T_REVEAL, "boing", 1.0)]
    dur = total / FPS
    audio.build("son.wav", dur + 0.3, INTRO, dur - OUTRO, dur - OUTRO, ev, rnd.randrange(10 ** 6))
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", "video_muet.mp4", "-i", "son.wav", "-af",
                    "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
                    "-shortest", "-movflags", "+faststart", out], check=True)
    for f_ in ("video_muet.mp4", "son.wav"):
        try: os.remove(f_)
        except OSError: pass
    print(json.dumps({"video": out, "theme": th["nom"], "duree": round(dur, 1)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
