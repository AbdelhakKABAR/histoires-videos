"""JEU « course » : billes qui dévalent une piste générée au hasard (sections tirées et mélangées à chaque vidéo)."""
import math, random
import pymunk
from common import W, H, FPS

WL, WR, SUB = 60, 1020, 8
SECTIONS = ["clous", "zigzag", "moulins", "entonnoir", "bumpers", "trampolines", "portes", "roue", "escalier"]
NOMS = {"clous": "CLOUS", "zigzag": "ZIGZAG", "moulins": "MOULINS", "entonnoir": "ENTONNOIR", "bumpers": "BUMPERS",
        "trampolines": "TRAMPOLINES", "portes": "PORTES", "roue": "LA ROUE", "escalier": "ESCALIER", "sprint": "SPRINT FINAL"}


class Course:
    ELIM = False
    titre_fin = "LE VAINQUEUR"

    def __init__(self, n, seed, sections=None, big=False):
        self.n, self.seed = n, seed
        rng = random.Random(seed)
        self.R = 36 if n <= 10 else (30 if n <= 14 else 26)
        if big: self.R = min(42, int(self.R * 1.25))
        self.cols = 5 if n <= 10 else (6 if n <= 14 else 7)
        self.rdy = 110 if n <= 10 else 92
        rows = (n + self.cols - 1) // self.cols
        self.GATE = int(190 + (rows - 1) * self.rdy + self.R + 44)
        self.sections = sections or rng.sample(SECTIONS, 5)
        sp = pymunk.Space(); sp.gravity = (0, 1150); sp.damping = 0.995
        self.geo = {"seg": [], "peg": [], "bump": [], "tramp": [], "kin": [], "zones": []}
        self.build(sp, rng)
        self.simulate(sp, rng)

    # ---------- piste ----------
    def build(self, sp, rng):
        st, g = sp.static_body, self.geo

        def seg(a, b, r=8, e=0.35, f=0.5, kind="seg", ct=2):
            s = pymunk.Segment(st, a, b, r); s.elasticity = e; s.friction = f; s.collision_type = ct
            sp.add(s); (g["tramp"] if kind == "tramp" else g["seg"]).append((a, b, r, kind))

        def peg(x, y, r=12):
            c = pymunk.Circle(st, r, (x, y)); c.elasticity = 0.55; c.friction = 0.3; c.collision_type = 2
            sp.add(c); g["peg"].append((x, y, r))

        def bump(x, y, r=46):
            c = pymunk.Circle(st, r, (x, y)); c.elasticity = 1.25; c.friction = 0.1; c.collision_type = 3
            sp.add(c); g["bump"].append((x, y, r))

        def spinner(x, y, L, arms, w):
            b = pymunk.Body(body_type=pymunk.Body.KINEMATIC); b.position = (x, y)
            b.angular_velocity = w; b.angle = rng.uniform(0, math.pi)
            sh = []
            for a in range(arms):
                ang = a * 2 * math.pi / arms
                s = pymunk.Segment(b, (0, 0), (L * math.cos(ang), L * math.sin(ang)), 10)
                s.elasticity = 0.6; s.friction = 0.4; s.collision_type = 2; sh.append(s)
            sp.add(b, *sh); g["kin"].append({"type": "spin", "body": b, "L": L, "arms": arms})

        def slider(x, y, L, v, lo, hi):
            b = pymunk.Body(body_type=pymunk.Body.KINEMATIC); b.position = (x, y); b.velocity = (v, 0)
            s = pymunk.Segment(b, (-L / 2, 0), (L / 2, 0), 12); s.elasticity = 0.4; s.friction = 0.5; s.collision_type = 2
            sp.add(b, s); g["kin"].append({"type": "slide", "body": b, "L": L, "lo": lo, "hi": hi})

        FIN = 0
        y = self.GATE + 90
        for name in self.sections + ["sprint"]:
            g["zones"].append((y - 30, NOMS[name]))
            y += 60
            if name == "clous":
                rows = rng.randint(7, 10); sp_x = rng.choice((140, 150, 160))
                for r_ in range(rows):
                    xs = range(WL + 75, WR - 20, sp_x) if r_ % 2 == 0 else range(WL + 75 + sp_x // 2, WR - 60, sp_x)
                    for x in xs: peg(x + rng.uniform(-6, 6), y)
                    y += 120
            elif name in ("zigzag", "sprint", "escalier"):
                k = {"zigzag": rng.randint(3, 5), "sprint": 2, "escalier": rng.randint(5, 7)}[name]
                drop = {"zigzag": rng.randint(220, 260), "sprint": 260, "escalier": 120}[name]
                length = {"zigzag": 835, "sprint": 820, "escalier": 520}[name]
                left = rng.random() < 0.5
                for i in range(k):
                    if left: seg((WL, y), (WL + length, y + drop), f=0.3)
                    else: seg((WR, y), (WR - length, y + drop), f=0.3)
                    left = not left
                    y += drop + (110 if name != "escalier" else 70)
            elif name == "moulins":
                for r_ in range(rng.randint(1, 2)):
                    if rng.random() < 0.6:
                        for j, xx in enumerate((300, 780)):
                            spinner(xx, y + 200, 165, rng.choice((3, 4)), rng.choice((-1, 1)) * rng.uniform(1.6, 2.8))
                    else:
                        spinner(540, y + 200, 200, rng.choice((4, 5)), rng.choice((-1, 1)) * rng.uniform(1.3, 2.2))
                        peg(150, y + 200, 18); peg(930, y + 200, 18)
                    y += 420
            elif name == "entonnoir":
                cx = rng.randint(300, 780)
                seg((WL, y), (cx - 62, y + 400)); seg((WR, y), (cx + 62, y + 400))
                y += 520
            elif name == "bumpers":
                rows = rng.randint(2, 3)
                for r_ in range(rows):
                    cnt = 2 if r_ % 2 == 0 else 3
                    for j in range(cnt):
                        x = WL + (j + 1) * (WR - WL) / (cnt + 1) + rng.uniform(-40, 40)
                        bump(x, y + 120)
                    y += 260
                y += 60
            elif name == "trampolines":
                for i in range(rng.randint(3, 5)):
                    cx = rng.choice((280, 540, 800)); ang = rng.choice((-1, 1)) * rng.uniform(0.25, 0.45)
                    dx, dy = 150 * math.cos(ang), 150 * math.sin(ang)
                    seg((cx - dx, y - dy), (cx + dx, y + dy), 9, e=1.05, f=0.2, kind="tramp", ct=4)
                    y += 280
            elif name == "portes":
                for i in range(rng.randint(2, 4)):
                    L = rng.choice((480, 560, 620)); v = rng.choice((-1, 1)) * rng.uniform(220, 380)
                    lo, hi = WL + L / 2 - 120, WR - L / 2 + 120
                    slider(rng.uniform(lo, hi), y + 80, L, v, lo, hi)
                    y += 300
            elif name == "roue":
                spinner(540, y + 330, 290, rng.choice((5, 6)), rng.choice((-1, 1)) * rng.uniform(1.0, 1.6))
                y += 760
            y += 60
        # arrivée
        seg((WL, y), (440, y + 200)); seg((WR, y), (640, y + 200))
        seg((440, y + 200), (440, y + 250)); seg((640, y + 200), (640, y + 250))
        self.FY = y + 250
        seg((WL, self.FY + 450), (WR, self.FY + 450), 12, kind="floor")
        seg((WL, -200), (WL, self.FY + 600), 10, kind="wall"); seg((WR, -200), (WR, self.FY + 600), 10, kind="wall")

    # ---------- simulation ----------
    def simulate(self, sp, rng):
        n = self.n
        balls = []
        for i in range(n):
            R = self.R; sx = 900 / self.cols
            b = pymunk.Body(1, pymunk.moment_for_circle(1, 0, R))
            b.position = (90 + sx / 2 + (i % self.cols) * sx + rng.uniform(-4, 4), 190 + (i // self.cols) * self.rdy)
            c = pymunk.Circle(b, R); c.elasticity = 0.55; c.friction = 0.7; c.collision_type = 1
            sp.add(b, c); balls.append(b)
        self.hits, cur = [], [0.0]

        def post(arb, s, d):
            if arb.is_first_contact:
                imp = arb.total_impulse.length
                if imp > 60: self.hits.append((cur[0], arb.shapes[0].body.position.y, imp, arb.shapes[1].collision_type))
        for ct in (1, 2, 3, 4): sp.on_collision(1, ct, post_solve=post)
        frames, order, still = [], [], [0.0] * n
        dt, t, fin = 1 / (FPS * SUB), 0.0, None
        kins = self.geo["kin"]
        while t < 90:
            for _ in range(SUB):
                for k in kins:
                    if k["type"] == "slide":
                        b = k["body"]
                        if (b.position.x < k["lo"] and b.velocity.x < 0) or (b.position.x > k["hi"] and b.velocity.x > 0):
                            b.velocity = (-b.velocity.x, 0)
                sp.step(dt); t += dt; cur[0] = t
            for i, b in enumerate(balls):
                if i in order: continue
                if b.position.y > self.FY: order.append(i)
                still[i] = still[i] + 1 / FPS if b.velocity.length < 25 else 0
                if still[i] > 1.2:
                    b.apply_impulse_at_local_point((rng.choice((-1, 1)) * 260, -320)); still[i] = 0
            frames.append({"t": t, "balls": [(b.position.x, b.position.y, b.angle, 1) for b in balls],
                           "kin": [(k["body"].position.x, k["body"].position.y, k["body"].angle) for k in kins]})
            if order and fin is None: fin = len(frames) - 1
            if fin is not None and len(frames) - 1 > fin + 2.2 * FPS: break
        self.frames, self.order = frames, order
        self.decisive = fin if fin is not None else len(frames) - 1
        self.nframes = len(frames)
        self.winner = order[0] if order else self.rank(self.nframes - 1)[0]
        self.final_rank = self.rank(self.nframes - 1)
        # caméra
        self.cam, oy = [], -700.0
        for f in frames:
            target = max(min(max(p[1] for p in f["balls"]) - 1050, self.FY + 420 - H), -700)
            oy += (target - oy) * 0.12; self.cam.append(oy)

    def rank(self, k):
        f = self.frames[min(k, len(self.frames) - 1)]
        arrived = [i for i in self.order if f["balls"][i][1] > self.FY]
        return arrived + sorted([i for i in range(self.n) if i not in arrived], key=lambda i: -f["balls"][i][1])

    def score(self):
        """Note de suspense (pour choisir la graine) et durée jusqu'à la victoire."""
        lead = [max(range(self.n), key=lambda i: f["balls"][i][1]) for f in self.frames[:self.decisive]]
        ch = sum(1 for a, b in zip(lead, lead[1:]) if a != b)
        late = lead[int(len(lead) * 0.75)] != self.winner if lead else False
        d = self.decisive / FPS
        ok = 26 <= d <= 42
        return ok, ch + (8 if late else 0) - abs(d - 33) / 3, d

    def audio_events(self, t0):
        ev = []
        for (t, y, imp, ct) in self.hits:
            k = int(t * FPS)
            if k >= self.nframes: break
            if 0 < y - self.cam[k] < H:
                ev.append((t0 + t, {2: "tick", 3: "boing", 4: "boing", 1: "tick"}[ct], min(1, imp / 400)))
        return ev

    # ---------- dessin ----------
    def camera(self, k): return self.cam[min(k, self.nframes - 1)]

    def draw(self, cr, pt, k, oy, labels=True, intro=False):
        th, g = pt.th, self.geo
        f = self.frames[min(k, self.nframes - 1)]; t = f["t"] if not intro else 0
        for (zy, name) in g["zones"]:
            if -300 < zy - oy < H + 100:
                pt.text(cr, name, W / 2, zy - oy + 40, 92, a=0.12, shadow=False)
        fy = self.FY - oy
        if -100 < fy < H + 100:
            sq = 25
            for j in range(8):
                for r_ in range(2):
                    cr.set_source_rgb(*((1, 1, 1) if (j + r_) % 2 == 0 else (0.05, 0.05, 0.08)))
                    cr.rectangle(440 + j * sq, fy - sq + r_ * sq, sq, sq); cr.fill()
            if labels: pt.text(cr, "ARRIVÉE", W / 2, fy - 340, 84, color=th["accent"])
        for (a, b, r, kind) in g["seg"]:
            if max(a[1], b[1]) - oy < -50 or min(a[1], b[1]) - oy > H + 50: continue
            if kind == "wall":
                cr.set_source_rgb(*th["mur"]); cr.set_line_width(28)
                cr.move_to(a[0], max(a[1] - oy, -50)); cr.line_to(b[0], min(b[1] - oy, H + 50)); cr.stroke()
                pt.line(cr, (a[0], max(a[1], oy - 50)), (b[0], min(b[1], oy + H + 50)), 4, th["ligne"], oy)
            else:
                pt.line(cr, a, b, 2 * r, th["ligne"] if kind != "floor" else th["accent2"], oy)
        for (a, b, r, kind) in g["tramp"]:
            if -80 < a[1] - oy < H + 80:
                pt.line(cr, a, b, 2 * r + 6, th["bump"], oy)
                cr.set_source_rgb(1, 1, 1)
                for q in (0.2, 0.5, 0.8):
                    cr.arc(a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q - oy, 4, 0, 6.29); cr.fill()
        for (x, y, r) in g["peg"]:
            if -40 < y - oy < H + 40:
                cr.set_source_rgba(*th["ligne"], 0.25); cr.arc(x, y - oy, r + 9, 0, 6.29); cr.fill()
                cr.set_source_rgb(*th["clou"]); cr.arc(x, y - oy, r, 0, 6.29); cr.fill()
        for (x, y, r) in g["bump"]:
            if -80 < y - oy < H + 80:
                fl = 0
                for (ht, hy, imp, ct) in self.hits:
                    if ct == 3 and 0 <= t - ht < 0.25 and abs(hy - y) < 120: fl = max(fl, 1 - (t - ht) / 0.25)
                rr = r + 6 * fl
                cr.set_source_rgba(*th["bump"], 0.25 + 0.4 * fl); cr.arc(x, y - oy, rr + 14, 0, 6.29); cr.fill()
                cr.set_source_rgb(*(c * 0.25 for c in th["bump"])); cr.arc(x, y - oy, rr, 0, 6.29); cr.fill()
                cr.set_source_rgb(*th["bump"]); cr.set_line_width(7); cr.arc(x, y - oy, rr - 4, 0, 6.29); cr.stroke()
                cr.set_source_rgba(1, 1, 1, 0.8); cr.arc(x, y - oy, 10, 0, 6.29); cr.fill()
        for kd, (x, y, ang) in zip(g["kin"], f["kin"]):
            if kd["type"] == "spin" and -320 < y - oy < H + 320:
                for a in range(kd["arms"]):
                    aa = ang + a * 2 * math.pi / kd["arms"]
                    pt.line(cr, (x, y), (x + kd["L"] * math.cos(aa), y + kd["L"] * math.sin(aa)), 20, th["moulin"], oy)
                cr.set_source_rgb(*(c * 0.2 for c in th["moulin"])); cr.arc(x, y - oy, 22, 0, 6.29); cr.fill()
                cr.set_source_rgb(*th["moulin"]); cr.arc(x, y - oy, 12, 0, 6.29); cr.fill()
            elif kd["type"] == "slide" and -60 < y - oy < H + 60:
                pt.line(cr, (x - kd["L"] / 2, y), (x + kd["L"] / 2, y), 24, th["moulin"], oy)
                cr.set_source_rgba(0, 0, 0, 0.5)
                for q in range(-2, 3):
                    cr.arc(x + q * kd["L"] / 6, y - oy, 4, 0, 6.29); cr.fill()
        # porte de départ
        if intro or k < 12:
            al = 1 if intro else 1 - k / 12
            cr.set_source_rgba(*th["accent2"], al); cr.set_line_width(10)
            cr.move_to(60, self.GATE - oy); cr.line_to(1020, self.GATE - oy); cr.stroke()
        # billes
        lead = self.rank(k)[0] if not intro else None
        for i in range(self.n):
            col = pt.parts[i]["couleur"]
            for d in range(1, 9):
                x, y, _, _ = self.frames[max(0, k - d)]["balls"][i]
                cr.set_source_rgba(*col, 0.22 * (1 - d / 9)); cr.arc(x, y - oy, self.R * (1 - d / 14), 0, 6.29); cr.fill()
        for i in sorted(range(self.n), key=lambda i: i == lead):
            x, y, a, _ = f["balls"][i]
            if -60 < y - oy < H + 60:
                if i == lead:
                    cr.set_source_rgba(*th["accent"], 0.35); cr.arc(x, y - oy, self.R + 16, 0, 6.29); cr.fill()
                pt.ball(cr, x, y - oy, a, i, self.R, ring=th["accent"] if i == lead else (1, 1, 1), ringw=6 if i == lead else 4)

    def hud(self, cr, pt, k, a):
        pt.podium_hud(cr, self.rank(k), a)
        top, bot, x = 360, 1500, 30
        cr.set_source_rgba(1, 1, 1, 0.15 * a); cr.set_line_width(6); cr.move_to(x, top); cr.line_to(x, bot); cr.stroke()
        cr.set_source_rgba(*pt.th["accent"], a); cr.rectangle(x - 14, bot - 3, 28, 6); cr.fill()
        f = self.frames[k]
        for i in sorted(range(self.n), key=lambda i: f["balls"][i][1]):
            p = max(0, min(1, (f["balls"][i][1] - 200) / (self.FY - 200)))
            pt.ball(cr, x, top + p * (bot - top), 0, i, 15, ringw=2, alpha=a)
