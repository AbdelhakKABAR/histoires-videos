"""DÉFI en UNE question très difficile (1080x1920, ~15-20 s, voix siwis), design premium.
   Formats : "mot" (mot mystère : indices + lettres qui se retournent) et "logique" (suite logique, 4 propositions).
   3 secondes pour réfléchir, puis révélation.
   python3 defi.py <defi.json> <sortie.mp4>"""
import argparse, json, math, os, random, subprocess, sys, time
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import numpy as np
import cairo
from formats import voix, Timeline, mix, SR
from common import Encoder, W, H, FPS, ease, back, rrect

ACC, ACC2, GOOD, BAD = (0.22, 0.74, 0.97), (0.65, 0.55, 0.98), (0.13, 0.77, 0.37), (0.94, 0.27, 0.27)
FONT = "Inter Display"
THINK = 3.0


def hexc(h): h = h.lstrip("#"); return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def T(cr, s, x, y, size, col=(1, 1, 1), a=1.0, align="c", w=cairo.FONT_WEIGHT_BOLD, spacing=0, glow=None, maxw=980):
    cr.select_font_face(FONT, cairo.FONT_SLANT_NORMAL, w); cr.set_font_size(size)
    if spacing:
        total = sum(cr.text_extents(c).x_advance + spacing for c in s) - spacing
        xx = x - total / 2 if align == "c" else x
        for c in s:
            cr.set_source_rgba(*col, a); cr.move_to(xx, y); cr.show_text(c); xx += cr.text_extents(c).x_advance + spacing
        return
    e = cr.text_extents(s)
    if e.width > maxw: size *= maxw / e.width; cr.set_font_size(size); e = cr.text_extents(s)
    tx = x - (e.width / 2 + e.x_bearing) if align == "c" else (x if align == "l" else x - e.width - e.x_bearing)
    if glow:
        for r_, al in ((10, 0.10), (5, 0.18)):
            cr.set_source_rgba(*glow, al * a); cr.set_line_width(r_ * 2); cr.move_to(tx, y); cr.text_path(s); cr.stroke(); cr.new_path()
    cr.set_source_rgba(0, 0, 0, 0.35 * a); cr.move_to(tx + 2, y + 4); cr.show_text(s)
    cr.set_source_rgba(*col, a); cr.move_to(tx, y); cr.show_text(s)


def background(cr, t):
    g = cairo.LinearGradient(0, 0, 0, H)
    g.add_color_stop_rgb(0, *hexc("0A0F1F")); g.add_color_stop_rgb(0.5, *hexc("0E1530")); g.add_color_stop_rgb(1, *hexc("090D1C"))
    cr.set_source(g); cr.paint()
    for (cx, cy, r, col, al) in ((120 + 40 * math.sin(t * 0.4), 260, 900, ACC, 0.22), (980, 1600 + 40 * math.cos(t * 0.3), 1000, ACC2, 0.2)):
        rg = cairo.RadialGradient(cx, cy, 0, cx, cy, r); rg.add_color_stop_rgba(0, *col, al); rg.add_color_stop_rgba(1, *col, 0)
        cr.set_source(rg); cr.paint()
    cr.set_source_rgba(1, 1, 1, 0.045); cr.set_line_width(1)
    off = (t * 12) % 90
    for x in range(0, W + 1, 90): cr.move_to(x, 0); cr.line_to(x, H)
    y = -90 + off
    while y < H: cr.move_to(0, y); cr.line_to(W, y); y += 90
    cr.stroke()
    vg = cairo.RadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H * 0.75)
    vg.add_color_stop_rgba(0, 0, 0, 0, 0); vg.add_color_stop_rgba(0.7, 0, 0, 0, 0.15); vg.add_color_stop_rgba(1, 0, 0, 0, 0.55)
    cr.set_source(vg); cr.paint()


def glass(cr, x, y, w, h, r, a=1.0, fill=None, edge=(1, 1, 1, 0.14), glow=None):
    for k in range(6, 0, -1):                                       # ombre douce
        rrect(cr, x - k * 2, y + 14 - k + k * 2, w + k * 4, h + k * 2, r + k * 2)
        cr.set_source_rgba(0, 0, 0, 0.05 * a); cr.fill()
    if glow:
        for k in (18, 10):
            rrect(cr, x - k, y - k, w + 2 * k, h + 2 * k, r + k); cr.set_source_rgba(*glow, 0.10 * a); cr.fill()
    rrect(cr, x, y, w, h, r); cr.set_source_rgba(*(fill or (0.055, 0.08, 0.16)), 0.78 * a); cr.fill()
    rrect(cr, x, y, w, h, r)
    hg = cairo.LinearGradient(0, y, 0, y + h); hg.add_color_stop_rgba(0, 1, 1, 1, 0.08 * a); hg.add_color_stop_rgba(0.5, 1, 1, 1, 0)
    cr.set_source(hg); cr.fill()
    rrect(cr, x, y, w, h, r); cr.set_source_rgba(edge[0], edge[1], edge[2], edge[3] * a); cr.set_line_width(2); cr.stroke()


def banner(cr, txt, a=1.0):
    bw, bh, bx, by = 760, 96, (W - 760) / 2, 150
    rrect(cr, bx, by, bw, bh, 48)
    g = cairo.LinearGradient(bx, 0, bx + bw, 0)
    g.add_color_stop_rgb(0, *hexc("1D4ED8")); g.add_color_stop_rgb(0.5, *hexc("F8FAFC")); g.add_color_stop_rgb(1, *hexc("DC2626"))
    cr.set_source(g); cr.paint_with_alpha(0) if a <= 0 else None
    cr.save(); cr.clip(); cr.set_source(g); cr.paint_with_alpha(a); cr.restore()
    rrect(cr, bx + 4, by + 4, bw - 8, bh - 8, 44); cr.set_source_rgba(0.04, 0.06, 0.12, 0.9 * a); cr.fill()
    T(cr, txt, W / 2, by + 64, 46, a=a, spacing=5, w=cairo.FONT_WEIGHT_BOLD)


def pill(cr, txt, y, col, a=1.0):
    cr.select_font_face(FONT, cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD); cr.set_font_size(34)
    w = cr.text_extents(txt).width + 70
    rrect(cr, W / 2 - w / 2, y - 34, w, 68, 34); cr.set_source_rgba(*col, 0.22 * a); cr.fill()
    rrect(cr, W / 2 - w / 2, y - 34, w, 68, 34); cr.set_source_rgba(*col, 0.9 * a); cr.set_line_width(3); cr.stroke()
    T(cr, txt, W / 2, y + 12, 34, col=(1, 1, 1), a=a)


def countdown(cr, t, c0, y=1330):
    if not (c0 <= t < c0 + THINK): return
    left = THINK - (t - c0); n = int(math.ceil(left)); frac = left / THINK
    pulse = 1 + 0.08 * (1 - (left % 1))
    cr.save(); cr.translate(W / 2, y); cr.scale(pulse, pulse)
    col = BAD if n == 1 else ACC
    for k, al in ((26, 0.12), (16, 0.25)):
        cr.new_path(); cr.set_source_rgba(*col, al); cr.set_line_width(k); cr.arc(0, 0, 110, -math.pi / 2, -math.pi / 2 + 2 * math.pi * frac); cr.stroke()
    cr.new_path(); cr.set_source_rgba(1, 1, 1, 0.12); cr.set_line_width(10); cr.arc(0, 0, 110, 0, 6.29); cr.stroke()
    cr.new_path(); cr.set_source_rgb(*col); cr.set_line_width(10); cr.arc(0, 0, 110, -math.pi / 2, -math.pi / 2 + 2 * math.pi * frac); cr.stroke()
    T(cr, str(n), 0, 38, 110, glow=col)
    cr.restore()


def wrap(cr, s, size, maxw):
    cr.select_font_face(FONT, cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD); cr.set_font_size(size)
    words, lines, cur = s.replace(" ?", " ?").replace(" !", " !").replace(" :", " :").split(" "), [], ""
    for w_ in words:
        tst = (cur + " " + w_).strip()
        if cr.text_extents(tst).width > maxw and cur: lines.append(cur); cur = w_
        else: cur = tst
    lines.append(cur); return lines


def check(cr, x, y, k, col=GOOD):
    cr.save(); cr.translate(x, y); cr.scale(k, k)
    cr.new_path(); cr.arc(0, 0, 34, 0, 6.29); cr.set_source_rgb(1, 1, 1); cr.fill()
    cr.move_to(-15, 1); cr.line_to(-4, 13); cr.line_to(17, -11); cr.set_source_rgb(*col); cr.set_line_width(8)
    cr.set_line_cap(cairo.LINE_CAP_ROUND); cr.set_line_join(cairo.LINE_JOIN_ROUND); cr.stroke(); cr.restore()


# ---------------- mot mystère ----------------
def build_mot(D, tl):
    s = {}
    tl.wait(0.2); s["hook"] = tl.say(D.get("accroche_dite", "Seulement un pour cent des gens trouvent ce mot."), 0.95, 0.3)[0]
    s["cat"] = tl.say(D["categorie_dite"] if "categorie_dite" in D else D["categorie"] + ".", 0.95, 0.35)[0]
    s["ind"] = [tl.say(i, 0.97, 0.45)[0] for i in D["indices"]]
    s["c0"] = tl.t; tl.wait(THINK)
    for k in range(3): tl.fx("tic", s["c0"] + k)
    s["rev"] = tl.t; tl.fx("bon", tl.t)
    tl.say(f"C'était : {D.get('dire', D['mot'].capitalize())} !", 0.95, 0.4)
    s["fin"] = tl.t; tl.say(D.get("fin", "Tu l'avais trouvé ? Dis-le en commentaire !"), 0.95, 0.8)
    mot = D["mot"].upper(); letters = [i for i, c in enumerate(mot) if c.isalpha()]
    rng = random.Random(mot); rng.shuffle(letters)
    k = D.get("lettres_donnees", 2)
    times = np.linspace(s["ind"][0] + 0.6, s["c0"] - 0.3, k + 1)[:-1] if k else []
    s["reveal"] = list(zip(letters[:k], times))
    for _, tt in s["reveal"]: tl.fx("lettre", tt)
    return s


def draw_mot(cr, D, s, t):
    mot = D["mot"].upper()
    banner(cr, D.get("titre", "MOT MYSTÈRE"), ease(t / 0.4))
    pill(cr, D.get("niveau", "NIVEAU : IMPOSSIBLE"), 310, BAD, ease((t - 0.2) / 0.4))
    if t >= s["cat"]:
        T(cr, D["categorie"].upper(), W / 2, 430, 50, col=ACC, a=ease((t - s["cat"]) / 0.3), spacing=4)
    n = len(mot); tw = min(118, 980 / n - 12); gap = 12; x0 = W / 2 - (n * (tw + gap) - gap) / 2; y0 = 500
    rev = dict(s["reveal"]); full = t >= s["rev"]
    for i, c in enumerate(mot):
        if c == " ": continue
        x = x0 + i * (tw + gap)
        rt = rev.get(i, s["rev"] + 0.06 * i)
        flip = abs(math.cos(min(1, max(0, t - rt) / 0.35) * math.pi)) if t >= rt else 1
        vis = t >= rt + 0.175
        cr.save(); cr.translate(x + tw / 2, y0 + tw * 0.68); cr.scale(1, max(0.04, flip))
        hh = tw * 1.36
        if vis and full: glass(cr, -tw / 2, -hh / 2, tw, hh, 18, fill=(0.08, 0.55, 0.25), edge=(0.7, 1, 0.8, 0.9), glow=GOOD)
        elif vis: glass(cr, -tw / 2, -hh / 2, tw, hh, 18, fill=(0.95, 0.96, 1.0), edge=(1, 1, 1, 0.9), glow=ACC)
        else: glass(cr, -tw / 2, -hh / 2, tw, hh, 18)
        if vis: T(cr, c, 0, tw * 0.27, tw * 0.78, col=(1, 1, 1) if full else (0.06, 0.08, 0.16))
        else: T(cr, "?", 0, tw * 0.22, tw * 0.5, col=(1, 1, 1), a=0.18)
        cr.restore()
    for j, (ind, ta) in enumerate(zip(D["indices"], s["ind"])):
        if t < ta: continue
        a = ease((t - ta) / 0.35); y = 760 + j * 150 + (1 - a) * 30
        glass(cr, 70, y, 940, 128, 28, a)
        cr.new_path(); cr.arc(140, y + 64, 32, 0, 6.29); cr.set_source_rgba(*ACC, 0.18 * a); cr.fill()
        cr.new_path(); cr.arc(140, y + 64, 32, 0, 6.29); cr.set_source_rgba(*ACC, 0.8 * a); cr.set_line_width(2); cr.stroke()
        T(cr, str(j + 1), 140, y + 80, 40, col=ACC, a=a)
        ls = wrap(cr, ind, 38, 780)
        for q, ln in enumerate(ls[:2]):
            T(cr, ln, 200, y + 64 + (q - (len(ls[:2]) - 1) / 2) * 46 + 13, 38, a=a, align="l")
    countdown(cr, t, s["c0"])
    if full:
        e = t - s["rev"]
        if D.get("explication"):
            a = ease((e - 0.3) / 0.4)
            glass(cr, 70, 1240, 940, 150, 28, a, glow=GOOD)
            ls = wrap(cr, D["explication"], 38, 860)
            for q, ln in enumerate(ls[:3]):
                T(cr, ln, W / 2, 1315 + (q - (len(ls[:3]) - 1) / 2) * 46 + 13, 38, a=a)


# ---------------- suite logique ----------------
def build_logique(D, tl):
    s = {}
    tl.wait(0.2); s["hook"] = tl.say(D.get("accroche_dite", "Seulement un pour cent des gens trouvent la suite."), 0.95, 0.3)[0]
    s["q"] = tl.say(D.get("question_dite", "Quel nombre vient ensuite ?"), 0.95, 0.4)[0]
    s["c0"] = tl.t; tl.wait(THINK)
    for k in range(3): tl.fx("tic", s["c0"] + k)
    s["rev"] = tl.t; tl.fx("bon", tl.t)
    tl.say(D.get("explication_dite", D["explication"]), 0.95, 0.4)
    s["fin"] = tl.t; tl.say(D.get("fin", "Tu avais trouvé ? Dis-le en commentaire !"), 0.95, 0.8)
    return s


def draw_logique(cr, D, s, t):
    banner(cr, D.get("titre", "SUITE LOGIQUE"), ease(t / 0.4))
    pill(cr, D.get("niveau", "NIVEAU : IMPOSSIBLE"), 310, BAD, ease((t - 0.2) / 0.4))
    T(cr, D.get("consigne", "Quelle est la suite ?"), W / 2, 430, 54, a=ease((t - 0.3) / 0.4))
    items = D["suite"] + ["?"]; n = len(items)
    # deux rangées si la suite est longue
    per = n if n <= 5 else math.ceil(n / 2)
    rev = t >= s["rev"]
    for i, it in enumerate(items):
        row, col_ = divmod(i, per); cnt = min(per, n - row * per)
        tw = min(200, 960 / per - 16); th_ = 150
        x = W / 2 + (col_ - (cnt - 1) / 2) * (tw + 16) - tw / 2; y = 500 + row * (th_ + 22)
        ta = 0.4 + 0.12 * i; a = back((t - ta) / 0.35)
        if a <= 0: continue
        last = i == n - 1
        txt = D["options"][D["ok"]] if last and rev else it
        cr.save(); cr.translate(x + tw / 2, y + th_ / 2); cr.scale(a, a)
        if last and rev: glass(cr, -tw / 2, -th_ / 2, tw, th_, 26, fill=(0.08, 0.55, 0.25), edge=(0.7, 1, 0.8, 0.9), glow=GOOD)
        elif last: glass(cr, -tw / 2, -th_ / 2, tw, th_, 26, fill=(0.25, 0.2, 0.6), edge=(0.75, 0.7, 1, 0.9), glow=ACC2)
        else: glass(cr, -tw / 2, -th_ / 2, tw, th_, 26)
        sz = min(78, tw * 1.5 / max(1, len(txt)))
        T(cr, txt, 0, sz * 0.36, sz)
        cr.restore()
    rows = math.ceil(n / per); oy = 500 + rows * 172 + 30
    if t >= s["q"]:
        for i, op in enumerate(D["options"]):
            x = 70 + (i % 2) * 480; y = oy + (i // 2) * 150
            a = ease((t - s["q"] - 0.1 * i) / 0.35)
            ok = rev and i == D["ok"]; dim = rev and not ok
            glass(cr, x, y, 460, 128, 28, a * (0.45 if dim else 1), fill=(0.1, 0.6, 0.3) if ok else None,
                  edge=(0.7, 1, 0.8, 0.9) if ok else (1, 1, 1, 0.14), glow=GOOD if ok else None)
            rrect(cr, x + 22, y + 26, 76, 76, 18); cr.set_source_rgba(*((1, 1, 1) if ok else ACC), (0.95 if ok else 0.14) * a); cr.fill()
            T(cr, "ABCD"[i], x + 60, y + 79, 42, col=(0.08, 0.5, 0.25) if ok else ACC, a=a * (0.5 if dim else 1))
            T(cr, op, x + 128, y + 82, 54 if len(op) <= 7 else 40, a=a * (0.4 if dim else 1), align="l", maxw=310)
            if ok: check(cr, x + 410, y + 64, back((t - s["rev"]) / 0.35))
    countdown(cr, t, s["c0"], y=oy + 440)
    if rev:
        a = ease((t - s["rev"] - 0.3) / 0.4)
        glass(cr, 70, oy + 320, 940, 170, 28, a, glow=GOOD)
        ls = wrap(cr, D["explication"], 38, 860)
        for q, ln in enumerate(ls[:3]):
            T(cr, ln, W / 2, oy + 405 + (q - (len(ls[:3]) - 1) / 2) * 46 + 13, 38, a=a)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("fichier"); ap.add_argument("out"); a = ap.parse_args()
    D = json.load(open(a.fichier)); out = os.path.abspath(a.out); os.chdir(HERE)
    build, draw = {"mot": (build_mot, draw_mot), "logique": (build_logique, draw_logique)}[D["format"]]
    tl = Timeline(); s = build(D, tl); dur = tl.t + 0.6
    enc = Encoder(os.path.join(HERE, "video_muet.mp4")); cr = enc.cr
    for g in range(int(dur * FPS)):
        t = g / FPS
        background(cr, t)
        if t < s["fin"] + 0.2:
            draw(cr, D, s, t)
        else:
            e = t - s["fin"] - 0.2
            draw(cr, D, s, t)
            cr.set_source_rgba(0.02, 0.03, 0.07, 0.75 * ease(e / 0.3)); cr.paint()
            T(cr, D.get("fin_ecrite", "Tu avais trouvé ?"), W / 2, 860, 76, col=ACC, a=ease(e / 0.3), glow=ACC)
            T(cr, "Dis-le en commentaire", W / 2, 960, 52, a=ease((e - 0.2) / 0.3))
            sc = back((e - 0.4) / 0.4)
            if sc > 0:
                cr.save(); cr.translate(W / 2, 1110); cr.scale(sc, sc)
                rrect(cr, -250, -54, 500, 108, 54)
                gg = cairo.LinearGradient(0, -54, 0, 54); gg.add_color_stop_rgb(0, *hexc("F43F5E")); gg.add_color_stop_rgb(1, *hexc("DC2626"))
                cr.set_source(gg); cr.fill(); T(cr, "S'abonner", 0, 18, 50); cr.restore()
        enc.push()
    enc.close()
    mix("son.wav", dur, tl.clips, tl.sfx, random.randrange(10 ** 6))
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", "video_muet.mp4", "-i", "son.wav", "-af",
                    "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
                    "-shortest", "-movflags", "+faststart", out], check=True)
    for f_ in ("video_muet.mp4", "son.wav"):
        try: os.remove(f_)
        except OSError: pass
    print(json.dumps({"video": out, "duree": round(dur, 1)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
