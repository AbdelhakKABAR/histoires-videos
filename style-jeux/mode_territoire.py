"""JEU « territoire » — la conquête.
   Chaque bille peint le sol avec son drapeau partout où elle passe (et repeint par-dessus les autres).
   À la fin du chrono, le participant qui possède le plus grand territoire gagne. Classement en % en direct."""
import math, random
import numpy as np
import cairo
import pymunk
from common import W, H, FPS, ease

SUB = 6
X0, Y0, X1, Y1 = 60, 400, 1020, 1500          # zone de jeu (au-dessus de la description TikTok)
CELL = 24
GW, GH = (X1 - X0) // CELL, (Y1 - Y0) // CELL


class Territoire:
    ELIM = False
    titre_fin = "LE CONQUÉRANT"
    GAME = 34.0

    def __init__(self, n, seed, big=False):
        self.n, self.seed = n, seed
        rng = random.Random(seed)
        self.R = 30 if n <= 8 else (26 if n <= 12 else 22)
        if big: self.R = min(40, int(self.R * 1.3))
        self.PR = self.R + 14                       # rayon de peinture
        self.speed = rng.uniform(380, 460)
        self.boost_t = rng.uniform(22, 26)           # « turbo » : tout le monde accélère
        self.simulate(rng)

    def simulate(self, rng):
        n, R = self.n, self.R
        sp = pymunk.Space(); sp.gravity = (0, 0)
        st = sp.static_body
        for a, b in (((X0, Y0), (X1, Y0)), ((X1, Y0), (X1, Y1)), ((X1, Y1), (X0, Y1)), ((X0, Y1), (X0, Y0))):
            s = pymunk.Segment(st, a, b, 6); s.elasticity = 1.0; s.friction = 0; s.collision_type = 2; sp.add(s)
        # quelques piliers au milieu pour casser les trajectoires
        self.pillars = []
        for _ in range(rng.randint(2, 4)):
            for _try in range(50):
                x, y, r = rng.uniform(X0 + 160, X1 - 160), rng.uniform(Y0 + 160, Y1 - 160), rng.uniform(34, 52)
                if all(math.hypot(x - px, y - py) > 260 for px, py, pr in self.pillars): break
            c = pymunk.Circle(st, r, (x, y)); c.elasticity = 1.0; c.collision_type = 2; sp.add(c)
            self.pillars.append((x, y, r))
        balls = []
        cols = 4 if n <= 8 else 5
        for i in range(n):
            cx = X0 + (i % cols + 0.5) * (X1 - X0) / cols
            cy = Y0 + ((i // cols) + 0.5) * (Y1 - Y0) / ((n + cols - 1) // cols)
            b = pymunk.Body(1, pymunk.moment_for_circle(1, 0, R)); b.position = (cx + rng.uniform(-30, 30), cy + rng.uniform(-30, 30))
            va = rng.uniform(0, 6.28); b.velocity = (self.speed * math.cos(va), self.speed * math.sin(va))
            c = pymunk.Circle(b, R); c.elasticity = 1.0; c.friction = 0; c.collision_type = 1
            sp.add(b, c); balls.append(b)
        self.hits, cur = [], [0.0]

        def post(arb, s, d):
            if arb.is_first_contact: self.hits.append((cur[0], 0.5))
        sp.on_collision(1, 1, post_solve=post); sp.on_collision(1, 2, post_solve=post)
        grid = np.full((GH, GW), -1, np.int8)
        gx = (np.arange(GW) + 0.5) * CELL + X0; gy = (np.arange(GH) + 0.5) * CELL + Y0
        GX, GY = np.meshgrid(gx, gy)
        frames, t, dt = [], 0.0, 1 / (FPS * SUB)
        self.lead_changes, last_lead = [], None
        end_t = self.GAME + 2.4
        while t < end_t:
            playing = t < self.GAME
            for _ in range(SUB):
                if playing:
                    sp.step(dt)
                t += dt; cur[0] = t
                spd = self.speed * (1.35 if t > self.boost_t else 1.0)
                for b in balls:
                    v = b.velocity.length
                    if v > 1: b.velocity = b.velocity * (spd / v)
            if playing:
                order = list(range(n)); rng.shuffle(order)       # pas d'avantage pour un index
                for i in order:
                    x, y = balls[i].position
                    m = (GX - x) ** 2 + (GY - y) ** 2 < self.PR ** 2
                    grid[m] = i
            counts = np.bincount(grid[grid >= 0].astype(np.int64), minlength=n)
            share = counts / (GW * GH)
            lead = int(np.argmax(counts)) if counts.max() > 0 else None
            if playing and lead is not None and lead != last_lead and t > 3:
                self.lead_changes.append((t, lead))
            last_lead = lead
            frames.append({"t": t, "balls": [(b.position.x, b.position.y, b.angle, 1) for b in balls],
                           "grid": grid.copy(), "share": share})
        self.frames, self.nframes = frames, len(frames)
        self.decisive = min(self.nframes - 1, int(self.GAME * FPS))
        fin = frames[self.decisive]["share"]
        self.final_rank = sorted(range(n), key=lambda i: -fin[i])
        self.winner = self.final_rank[0]

    def rank(self, k):
        s = self.frames[min(k, self.nframes - 1)]["share"]
        return sorted(range(self.n), key=lambda i: -s[i])

    def score(self):
        late = [t for t, _ in self.lead_changes if t > self.GAME * 0.7]
        fin = sorted(self.frames[self.decisive]["share"], reverse=True)
        close = fin[0] - fin[1] < 0.03                       # écart serré à la fin
        sc = len(self.lead_changes) / 2 + 4 * min(2, len(late)) + (4 if close else 0)
        return len(late) >= 1, sc, self.GAME

    def camera(self, k): return 0.0

    def audio_events(self, t0):
        ev = [(t0 + t, "tick", 0.4) for t, _ in self.hits]
        last = -9
        for t, _ in self.lead_changes:          # un « boing » quand la tête change (pas plus d'un toutes les 1,5 s)
            if t - last >= 1.5: ev.append((t0 + t, "boing", 0.7)); last = t
        ev += [(t0 + self.GAME - s, "tick", 1.0) for s in (5, 4, 3, 2, 1)]       # compte à rebours final
        return ev

    # ---------- dessin ----------
    COULEURS = ["#FF3B30", "#0A84FF", "#FFD60A", "#30D158", "#BF5AF2", "#FF9F0A", "#64D2FF", "#FF375F",
                "#A2845E", "#66D4CF", "#5E5CE6", "#E5E5EA"]

    def col(self, i):
        h = self.COULEURS[i % len(self.COULEURS)].lstrip("#")
        return tuple(int(h[j:j + 2], 16) / 255 for j in (0, 2, 4))

    def _patterns(self, pt):
        if not hasattr(self, "_pat"): self._pat = [cairo.SolidPattern(*self.col(i)) for i in range(self.n)]
        return self._pat

    def draw(self, cr, pt, k, oy=0, labels=True, intro=False):
        th = pt.th
        f = self.frames[min(k, self.nframes - 1)]
        pats = self._patterns(pt)
        cr.set_source_rgba(*th["mur"], 0.9); cr.rectangle(X0, Y0, X1 - X0, Y1 - Y0); cr.fill()
        cr.set_source_rgba(1, 1, 1, 0.05); cr.set_line_width(1)
        for gx in range(GW + 1): cr.move_to(X0 + gx * CELL, Y0); cr.line_to(X0 + gx * CELL, Y1)
        for gy in range(GH + 1): cr.move_to(X0, Y0 + gy * CELL); cr.line_to(X1, Y0 + gy * CELL)
        cr.stroke()
        g = f["grid"]
        for i in range(self.n):
            ys, xs = np.nonzero(g == i)
            if len(xs) == 0: continue
            for x, y in zip(xs, ys): cr.rectangle(X0 + x * CELL, Y0 + y * CELL, CELL, CELL)
            cr.set_source_rgba(*self.col(i), 0.88); cr.fill()
        for (x, y, r) in self.pillars:
            cr.set_source_rgba(0, 0, 0, 0.4); cr.arc(x + 4, y + 6, r, 0, 6.29); cr.fill()
            cr.set_source_rgb(*th["moulin"]); cr.arc(x, y, r, 0, 6.29); cr.fill()
            cr.set_source_rgba(1, 1, 1, 0.35); cr.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, 6.29); cr.fill()
        for lw, al in ((26, 0.15), (10, 1.0)):
            cr.set_source_rgba(*th["ligne"], al); cr.set_line_width(lw); cr.rectangle(X0, Y0, X1 - X0, Y1 - Y0); cr.stroke()
        lead = self.rank(k)[0] if not intro and f["share"].max() > 0 else None
        for i in range(self.n):
            x, y, a, _ = f["balls"][i]
            if i == lead:
                cr.set_source_rgba(*th["accent"], 0.4); cr.arc(x, y, self.R + 14, 0, 6.29); cr.fill()
            cr.set_source_rgb(0.05, 0.05, 0.08); cr.arc(x, y, self.R + 9, 0, 6.29); cr.fill()
            cr.set_source_rgb(*self.col(i)); cr.arc(x, y, self.R + 6, 0, 6.29); cr.fill()
            pt.ball(cr, x, y, a, i, self.R, ring=(1, 1, 1), ringw=3)
        t = f["t"]
        if not intro and self.boost_t <= t < self.boost_t + 1.4:
            e = (t - self.boost_t) / 1.4
            pt.text(cr, "TURBO !", W / 2, (Y0 + Y1) / 2, 150 * (1 + 0.2 * e), color=th["accent2"], a=1 - ease((e - 0.6) / 0.4))

    def hud(self, cr, pt, k, a):
        th = pt.th
        f = self.frames[min(k, self.nframes - 1)]; t = f["t"]
        rk = self.rank(k); s = f["share"]
        pt.panel(cr, 50, 140, 980, 200, a)
        left = max(0.0, self.GAME - t)
        hot = left <= 5 and left > 0
        sc = 1 + (0.12 * abs(math.sin(t * 6)) if hot else 0)
        cr.save(); cr.translate(W / 2, 205); cr.scale(sc, sc)
        pt.text(cr, f"{int(math.ceil(left))} s" if left > 0 else "FIN !", 0, 0, 52,
                color=th["accent2"] if hot or left == 0 else th["accent"], a=a, font="Inter Display")
        cr.restore()
        for j in range(3):
            i = rk[j]; x0 = 80 + j * 315
            cr.set_source_rgba(*self.col(i), a); cr.rectangle(x0 - 6, 232, 64, 51); cr.fill()
            pt.flag_rect(cr, i, x0, 238, 52, 39, a)
            nm = pt.parts[i]["nom"]
            pt.text(cr, nm, x0 + 62, 268, 27 if len(nm) <= 9 else 22, a=a, align="l", font="Inter Display")
            pt.text(cr, f"{s[i] * 100:.0f}%", x0 + 290, 268, 30, color=th["accent"], a=a, align="r", font="Inter Display")
        # barre de partage du territoire
        x, wbar = 80, 920
        for i in sorted(range(self.n), key=lambda i: -s[i]):
            w = wbar * s[i]
            if w < 1: continue
            cr.set_source_rgba(*self.col(i), a); cr.rectangle(x, 296, w, 26); cr.fill()
            x += w
        cr.set_source_rgba(1, 1, 1, 0.3 * a); cr.set_line_width(2); cr.rectangle(80, 296, wbar, 26); cr.stroke()
