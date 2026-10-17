"""Rendu de la course de drapeaux en 1080x1920 — images envoyées directement à ffmpeg."""
import math, random, subprocess, sys, json
import cairo
import sim

SEED = int(sys.argv[1]) if len(sys.argv) > 1 else 39
OUT = sys.argv[2] if len(sys.argv) > 2 else "course_video.mp4"
W, H, FPS = 1080, 1920, 30
INTRO = 4.6          # s : choix + compte à rebours
AFTER = 2.0          # s : course qui continue après la victoire
OUTRO = 5.5          # s : écran vainqueur

PAYS = [("fr", "France", (0.23, 0.42, 0.96)), ("it", "Italie", (0.13, 0.64, 0.35)),
        ("us", "États-Unis", (0.24, 0.36, 0.84)), ("ca", "Canada", (0.89, 0.15, 0.18)),
        ("dz", "Algérie", (0.12, 0.62, 0.34)), ("ma", "Maroc", (0.76, 0.15, 0.18)),
        ("tn", "Tunisie", (0.91, 0.0, 0.07)), ("es", "Espagne", (0.95, 0.75, 0.0)),
        ("br", "Brésil", (0.13, 0.64, 0.29)), ("de", "Allemagne", (1.0, 0.81, 0.0))]

rng = random.Random(SEED * 7 + 1)
slots = list(range(10)); rng.shuffle(slots)          # slot de départ -> pays
R = sim.simulate(10, SEED)
fr, geo, FY = R["frames"], R["geo"], R["finish_y"]
first_i = next(i for i, x in enumerate(fr) if any(p[1] > FY for p in x["balls"]))
race_frames = min(len(fr), first_i + int(AFTER * FPS))
winner = R["order"][0]

def ranking(k):
    """Ordre courant : arrivés d'abord (dans l'ordre), puis par progression."""
    f = fr[min(k, len(fr) - 1)]
    done = [i for i in R["order"] if any(x["balls"][i][1] > FY for x in fr[:k + 1][-1:])]
    arrived = [i for i in R["order"] if f["balls"][i][1] > FY]
    rest = sorted([i for i in range(10) if i not in arrived], key=lambda i: -f["balls"][i][1])
    return arrived + rest

final_rank = ranking(race_frames - 1)

flag = {c: cairo.ImageSurface.create_from_png(f"flags/{c}.png") for c, _, _ in PAYS}
flagw = {c: cairo.ImageSurface.create_from_png(f"flags/{c}_w.png") for c, _, _ in PAYS}
def P(i): return PAYS[slots[i]]

FONT = "Inter Display"
def text(cr, s, x, y, size, weight=cairo.FONT_WEIGHT_BOLD, color=(1, 1, 1), a=1, align="c", shadow=True, family=FONT):
    cr.select_font_face(family, cairo.FONT_SLANT_NORMAL, weight)
    cr.set_font_size(size)
    e = cr.text_extents(s)
    tx = x - (e.width / 2 + e.x_bearing) if align == "c" else (x if align == "l" else x - e.width - e.x_bearing)
    if shadow:
        cr.set_source_rgba(0, 0, 0, 0.55 * a); cr.move_to(tx + 3, y + 4); cr.show_text(s)
    cr.set_source_rgba(*color, a); cr.move_to(tx, y); cr.show_text(s)
    return e.width

def rrect(cr, x, y, w, h, r):
    cr.new_sub_path()
    cr.arc(x + w - r, y + r, r, -math.pi / 2, 0); cr.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    cr.arc(x + r, y + h - r, r, math.pi / 2, math.pi); cr.arc(x + r, y + r, r, math.pi, 1.5 * math.pi)
    cr.close_path()

def ball(cr, x, y, ang, i, r=sim.R, ring=(1, 1, 1), ringw=4):
    c = P(i)[0]
    cr.save()
    cr.set_source_rgba(0, 0, 0, 0.35); cr.arc(x + 5, y + 8, r, 0, 2 * math.pi); cr.fill()
    cr.translate(x, y); cr.rotate(ang)
    cr.arc(0, 0, r, 0, 2 * math.pi); cr.clip()
    s = 2 * r / 256
    cr.scale(s, s); cr.set_source_surface(flag[c], -128, -128); cr.paint()
    cr.restore()
    # reflet
    g = cairo.RadialGradient(x - r * 0.35, y - r * 0.4, 0, x - r * 0.35, y - r * 0.4, r * 1.1)
    g.add_color_stop_rgba(0, 1, 1, 1, 0.45); g.add_color_stop_rgba(0.5, 1, 1, 1, 0.0)
    g.add_color_stop_rgba(1, 0, 0, 0, 0.35)
    cr.set_source(g); cr.arc(x, y, r, 0, 2 * math.pi); cr.fill()
    cr.set_source_rgb(*ring); cr.set_line_width(ringw); cr.arc(x, y, r, 0, 2 * math.pi); cr.stroke()

def glow_line(cr, a, b, oy, w, col):
    for lw, al in ((w + 22, 0.10), (w + 10, 0.22), (w, 1.0)):
        cr.set_source_rgba(*col, al); cr.set_line_width(lw)
        cr.move_to(a[0], a[1] - oy); cr.line_to(b[0], b[1] - oy); cr.stroke()

CYAN, PINK, GOLD, WHITE = (0.35, 0.9, 1.0), (1.0, 0.25, 0.55), (1.0, 0.8, 0.2), (1, 1, 1)
bump_hits = [(t, y) for (t, y, imp, ct) in R["hits"] if ct == 3]

def background(cr, oy):
    g = cairo.LinearGradient(0, 0, 0, H)
    g.add_color_stop_rgb(0, 0.04, 0.06, 0.15); g.add_color_stop_rgb(1, 0.07, 0.04, 0.17)
    cr.set_source(g); cr.paint()
    cr.set_source_rgba(1, 1, 1, 0.045); cr.set_line_width(2)
    step = 120; off = -(oy * 0.6) % step
    y = off - step
    while y < H:
        cr.move_to(0, y); cr.line_to(W, y); y += step
    for x in range(0, W + 1, step):
        cr.move_to(x, 0); cr.line_to(x, H)
    cr.stroke()

def track(cr, oy, t, k, labels=True):
    for (zy, name) in geo["zones"]:
        if -300 < zy - oy < H + 100:
            text(cr, name, W / 2, zy - oy + 40, 92, cairo.FONT_WEIGHT_BOLD, (1, 1, 1), 0.10, shadow=False)
    # arrivée
    fy = FY - oy
    if -100 < fy < H + 100:
        sq = 25
        for j in range(int((640 - 440) / sq)):
            for r_ in range(2):
                cr.set_source_rgb(*((1, 1, 1) if (j + r_) % 2 == 0 else (0.05, 0.05, 0.08)))
                cr.rectangle(440 + j * sq, fy - sq + r_ * sq, sq, sq); cr.fill()
        if labels: text(cr, "ARRIVÉE", W / 2, fy - 330, 80, color=GOLD, a=0.95)
    for (a, b, r, kind) in geo["seg"]:
        if max(a[1], b[1]) - oy < -50 or min(a[1], b[1]) - oy > H + 50:
            continue
        if kind == "wall":
            cr.set_source_rgb(0.10, 0.13, 0.30); cr.set_line_width(26)
            cr.move_to(a[0], max(a[1] - oy, -50)); cr.line_to(b[0], min(b[1] - oy, H + 50)); cr.stroke()
            glow_line(cr, (a[0], max(a[1], oy - 50)), (b[0], min(b[1], oy + H + 50)), oy, 4, CYAN)
        else:
            cr.set_line_cap(cairo.LINE_CAP_ROUND)
            glow_line(cr, a, b, oy, 2 * r, CYAN if kind != "floor" else PINK)
    for (x, y, r) in geo["peg"]:
        if -40 < y - oy < H + 40:
            cr.set_source_rgba(*CYAN, 0.25); cr.arc(x, y - oy, r + 9, 0, 2 * math.pi); cr.fill()
            cr.set_source_rgb(0.92, 0.98, 1); cr.arc(x, y - oy, r, 0, 2 * math.pi); cr.fill()
    for (x, y, r) in geo["bump"]:
        if -80 < y - oy < H + 80:
            flash = 0
            for (ht, hy) in bump_hits:
                if 0 <= t - ht < 0.25 and abs(hy - y) < 120:
                    flash = max(flash, 1 - (t - ht) / 0.25)
            rr = r + 6 * flash
            cr.set_source_rgba(*PINK, 0.25 + 0.4 * flash); cr.arc(x, y - oy, rr + 14, 0, 2 * math.pi); cr.fill()
            cr.set_source_rgb(0.18, 0.04, 0.12); cr.arc(x, y - oy, rr, 0, 2 * math.pi); cr.fill()
            cr.set_source_rgb(*PINK); cr.set_line_width(7); cr.arc(x, y - oy, rr - 4, 0, 2 * math.pi); cr.stroke()
            cr.set_source_rgba(1, 1, 1, 0.8); cr.arc(x, y - oy, 10, 0, 2 * math.pi); cr.fill()
    for (sb, L), ang in zip(geo["spin"], fr[k]["spin"]):
        x, y = sb.position
        if -250 < y - oy < H + 250:
            cr.set_line_cap(cairo.LINE_CAP_ROUND)
            for a in range(4):
                aa = ang + a * math.pi / 2
                glow_line(cr, (x, y), (x + L * math.cos(aa), y + L * math.sin(aa)), oy, 20, GOLD)
            cr.set_source_rgb(0.1, 0.08, 0.02); cr.arc(x, y - oy, 22, 0, 2 * math.pi); cr.fill()
            cr.set_source_rgb(*GOLD); cr.arc(x, y - oy, 12, 0, 2 * math.pi); cr.fill()

def balls_layer(cr, oy, k, leader, names=False):
    f = fr[k]
    for i in range(10):
        col = P(i)[2]
        for d in range(1, 9, 1):
            kk = max(0, k - d)
            x, y, _ = fr[kk]["balls"][i]
            cr.set_source_rgba(*col, 0.22 * (1 - d / 9)); cr.arc(x, y - oy, sim.R * (1 - d / 14), 0, 2 * math.pi); cr.fill()
    for i in sorted(range(10), key=lambda i: i == leader):
        x, y, a = f["balls"][i]
        if -60 < y - oy < H + 60:
            if i == leader:
                cr.set_source_rgba(*GOLD, 0.35); cr.arc(x, y - oy, sim.R + 16, 0, 2 * math.pi); cr.fill()
            ball(cr, x, y - oy, a, i, ring=GOLD if i == leader else WHITE, ringw=6 if i == leader else 4)
            if names:
                text(cr, P(i)[1], x, y - oy + sim.R + 34, 27, color=WHITE)

def hud(cr, k, a=1.0):
    rk = ranking(k)
    rrect(cr, 70, 150, 940, 128, 30)
    cr.set_source_rgba(0.03, 0.04, 0.10, 0.78 * a); cr.fill_preserve()
    cr.set_source_rgba(1, 1, 1, 0.12 * a); cr.set_line_width(2); cr.stroke()
    medal = [GOLD, (0.82, 0.85, 0.9), (0.85, 0.55, 0.3)]
    for j in range(3):
        i = rk[j]; x0 = 95 + j * 310
        cr.set_source_rgba(*medal[j], a); cr.arc(x0 + 26, 214, 24, 0, 2 * math.pi); cr.fill()
        text(cr, str(j + 1), x0 + 26, 225, 30, color=(0.08, 0.08, 0.1), a=a, shadow=False)
        cr.save(); cr.translate(x0 + 64, 192)
        rrect(cr, 0, 0, 58, 44, 8); cr.clip(); cr.scale(58 / 320, 44 / 240)
        cr.set_source_surface(flagw[P(i)[0]], 0, 0); cr.paint_with_alpha(a); cr.restore()
        name = P(i)[1]
        sz = 32 if len(name) <= 8 else 27
        text(cr, name, x0 + 132, 226, sz, color=WHITE, a=a, align="l")

def minimap(cr, k, a=1.0):
    top, bot, x = 360, 1500, 30
    cr.set_source_rgba(1, 1, 1, 0.15 * a); cr.set_line_width(6); cr.set_line_cap(cairo.LINE_CAP_ROUND)
    cr.move_to(x, top); cr.line_to(x, bot); cr.stroke()
    cr.set_source_rgba(*GOLD, a); cr.rectangle(x - 14, bot - 3, 28, 6); cr.fill()
    for i in sorted(range(10), key=lambda i: fr[k]["balls"][i][1]):
        y = fr[k]["balls"][i][1]
        p = max(0, min(1, (y - 200) / (FY - 200)))
        yy = top + p * (bot - top)
        cr.save(); cr.arc(x, yy, 15, 0, 2 * math.pi); cr.clip()
        cr.translate(x - 15, yy - 15); cr.scale(30 / 256, 30 / 256)
        cr.set_source_surface(flag[P(i)[0]], 0, 0); cr.paint_with_alpha(a); cr.restore()
        cr.set_source_rgba(1, 1, 1, a); cr.set_line_width(2); cr.arc(x, yy, 15, 0, 2 * math.pi); cr.stroke()

def ease(x): x = max(0, min(1, x)); return x * x * (3 - 2 * x)
def back(x):
    x = max(0, min(1, x)); c = 1.7
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2

# ---------- caméra ----------
cam = []
oy = -700.0
for k in range(race_frames):
    f = fr[k]
    lead_y = max(p[1] for p in f["balls"])
    target = min(lead_y - 1050, FY + 420 - H)
    target = max(target, -700)
    oy += (target - oy) * 0.12
    cam.append(oy)

def leader_at(k):
    return ranking(k)[0]

# confettis
conf = [(random.Random(j).uniform(0, W), random.Random(j + 99).uniform(-1600, 0),
         random.Random(j + 7).uniform(250, 520), random.Random(j + 3).uniform(0, 6.28),
         random.Random(j + 5).choice([GOLD, PINK, CYAN, WHITE, (0.4, 1, 0.5)])) for j in range(170)]

n_intro, n_out = int(INTRO * FPS), int(OUTRO * FPS)
TOTAL = n_intro + race_frames + n_out
meta = {"seed": SEED, "winner": P(winner)[1], "podium": [P(i)[1] for i in final_rank[:3]],
        "intro": INTRO, "race_frames": race_frames, "fps": FPS, "total_frames": TOTAL,
        "first_finish_s": INTRO + first_i / FPS,
        "hits": [(INTRO + t, y, imp, ct) for (t, y, imp, ct) in R["hits"]],
        "cam": cam}
json.dump(meta, open("meta.json", "w"))

surf = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H)
cr = cairo.Context(surf)
ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgra",
                       "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium",
                       "-crf", "19", "-pix_fmt", "yuv420p", "video_muet.mp4"], stdin=subprocess.PIPE)

for g in range(TOTAL):
    T = g / FPS
    if g < n_intro:                                       # ---- INTRO ----
        k = 0; oy = -700
        background(cr, oy); track(cr, oy, 0, 0)
        # porte
        glow_line(cr, (60, 380), (1020, 380), oy, 10, PINK)
        balls_layer(cr, oy, 0, None, names=True)
        ap = ease(T / 0.35)
        text(cr, "QUEL DRAPEAU", W / 2, 470, 96, cairo.FONT_WEIGHT_BOLD, WHITE, ap)
        text(cr, "VA GAGNER ?", W / 2, 580, 96, cairo.FONT_WEIGHT_BOLD, GOLD, ap)
        text(cr, "Choisis le tien maintenant", W / 2, 680, 44, cairo.FONT_WEIGHT_NORMAL, WHITE, ap * 0.9)
        cd = T - 1.6
        if cd >= 0:
            n = int(cd)
            lab = ["3", "2", "1", "GO !"][min(n, 3)]
            frac = cd - n
            s = 1 + 0.6 * (1 - ease(frac / 0.4))
            al = 1 - ease((frac - 0.6) / 0.4) if n < 3 else 1
            cr.save(); cr.translate(W / 2, 1360); cr.scale(s, s)
            text(cr, lab, 0, 70, 230, cairo.FONT_WEIGHT_BOLD, PINK if n == 3 else WHITE, al)
            cr.restore()
    elif g < n_intro + race_frames:                       # ---- COURSE ----
        k = g - n_intro; oy = cam[k]; t = fr[k]["t"]
        background(cr, oy); track(cr, oy, t, k)
        if k < 12:
            cr.set_source_rgba(*PINK, 1 - k / 12); cr.set_line_width(10)
            cr.move_to(60, 380 - oy); cr.line_to(1020, 380 - oy); cr.stroke()
        lead = leader_at(k)
        balls_layer(cr, oy, k, lead)
        hud(cr, k, ease(k / 15))
        minimap(cr, k, ease(k / 15))
        if k < 25:
            text(cr, "GO !", W / 2, 1100, 230 * (1 + k / 40), color=PINK, a=1 - k / 25)
        if k >= first_i:
            e = k - first_i
            cr.set_source_rgba(1, 1, 1, 0.5 * max(0, 1 - e / 8)); cr.paint()
            sc = back(e / 12)
            cr.save(); cr.translate(W / 2, 1020); cr.scale(sc, sc)
            text(cr, "VICTOIRE !", 0, 0, 140, color=GOLD)
            cr.restore()
    else:                                                 # ---- VAINQUEUR ----
        e = (g - n_intro - race_frames) / FPS
        k = race_frames - 1; oy = cam[k]
        background(cr, oy); track(cr, oy, fr[k]["t"], k, labels=False)
        balls_layer(cr, oy, k, winner)
        cr.set_source_rgba(0.02, 0.02, 0.06, 0.9 * ease(e / 0.4)); cr.paint()
        # rayons
        cr.save(); cr.translate(W / 2, 760); cr.rotate(e * 0.4)
        for j in range(16):
            cr.move_to(0, 0); cr.arc(0, 0, 900, j * math.pi / 8, j * math.pi / 8 + math.pi / 16); cr.close_path()
        cr.set_source_rgba(*GOLD, 0.10 * ease(e / 0.5)); cr.fill(); cr.restore()
        text(cr, "LE VAINQUEUR", W / 2, 360, 70, color=WHITE, a=ease(e / 0.3))
        sc = back(e / 0.6)
        if sc > 0.01:
            cr.save(); cr.translate(W / 2, 760); cr.scale(sc, sc)
            cr.set_source_rgba(*GOLD, 0.35); cr.arc(0, 0, 215, 0, 2 * math.pi); cr.fill()
            ball(cr, 0, 0, math.sin(e * 2) * 0.15, winner, r=180, ring=GOLD, ringw=12)
            cr.restore()
        text(cr, P(winner)[1].upper(), W / 2, 1090, 120, color=GOLD, a=ease((e - 0.3) / 0.3))
        # podium 2 et 3
        for j, (xx, lab) in enumerate(((330, "2e"), (750, "3e"))):
            i = final_rank[j + 1]; al = ease((e - 0.8 - j * 0.2) / 0.3)
            if al > 0:
                cr.save(); cr.translate(xx, 1250)
                cr.scale(al, al); ball(cr, 0, 0, 0, i, r=62); cr.restore()
                text(cr, lab + "  " + P(i)[1], xx, 1360, 40, color=WHITE, a=al)
        al = ease((e - 1.4) / 0.4)
        text(cr, "Ton drapeau a gagné ?", W / 2, 1480, 56, color=WHITE, a=al)
        text(cr, "Dis-le en commentaire !", W / 2, 1550, 56, color=PINK, a=al)
        # confettis
        for (x0, y0, v, ph, col) in conf:
            y = y0 + v * e * 1.6
            if 0 < y < H:
                x = x0 + 40 * math.sin(e * 3 + ph)
                cr.save(); cr.translate(x, y); cr.rotate(e * 5 + ph)
                cr.set_source_rgb(*col); cr.rectangle(-9, -5, 18, 10); cr.fill(); cr.restore()
    surf.flush()
    ff.stdin.write(bytes(surf.get_data()))
ff.stdin.close(); ff.wait()
print(json.dumps({k: meta[k] for k in ("winner", "podium", "first_finish_s", "total_frames")}, ensure_ascii=False))
