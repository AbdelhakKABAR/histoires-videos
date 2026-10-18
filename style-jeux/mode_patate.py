"""JEU « patate » — la patate chaude.
   Les billes rebondissent sans gravité dans une arène qui rétrécit. L'une d'elles porte la PATATE CHAUDE :
   à chaque contact, la patate passe à l'autre bille. Quand le temps (caché) est écoulé, celle qui la tient
   est « brûlée » et éliminée ; la patate repart au hasard. Le dernier qui reste gagne."""
import math, random
import pymunk
from common import W, H, FPS
from mode_elim import Elim, CX, CY, SUB


class Patate(Elim):
    titre_fin = "LE SURVIVANT"

    def __init__(self, n, seed, big=False):
        self.n, self.seed = n, seed
        rng = random.Random(seed)
        self.R = 38 if n <= 8 else (35 if n <= 12 else (28 if n <= 14 else 23))
        if big: self.R = min(44, int(self.R * 1.25))
        self.AR0 = 470
        self.speed = rng.uniform(430, 520)
        # durées des manches : de plus en plus longues vers la fin (suspense du duel)
        total = rng.uniform(27, 35)
        wts = [1 + 0.9 * (j / max(1, n - 2)) ** 2 + rng.uniform(-0.25, 0.25) for j in range(n - 1)]
        wts[-1] *= 1.35
        s = sum(wts)
        start = 3.0
        self.rounds = [(total - start) * w / s for w in wts]
        self.simulate(rng, start)

    def ar(self, nalive):            # l'arène rétrécit quand il reste moins de monde
        return max(250, self.AR0 * (0.55 + 0.45 * math.sqrt(nalive / self.n)))

    def simulate(self, rng, start):
        n, R = self.n, self.R
        sp = pymunk.Space(); sp.gravity = (0, 0)
        balls = []
        for i in range(n):
            b = pymunk.Body(1, pymunk.moment_for_circle(1, 0, R))
            ang = 2 * math.pi * i / n + rng.uniform(-0.12, 0.12); rr = 300
            b.position = (CX + rr * math.cos(ang), CY + rr * math.sin(ang))
            va = rng.uniform(0, 6.28); b.velocity = (self.speed * math.cos(va), self.speed * math.sin(va))
            c = pymunk.Circle(b, R); c.elasticity = 1.0; c.friction = 0.0; c.collision_type = 1
            sp.add(b, c); balls.append((b, c))
        idx = {id(c): i for i, (b, c) in enumerate(balls)}
        alive = [1] * n
        self.hits, self.passes, self.elims, self.bursts = [], [], [], []
        holder = [rng.randrange(n)]; last_pass = [-9.0]; cur = [0.0]
        self.holders = []

        def touch(arb, s, d):
            a, b = (idx.get(id(sh)) for sh in arb.shapes)
            if a is None or b is None: return
            self.hits.append((cur[0], 0.5))
            if cur[0] < start - 0.2 or cur[0] - last_pass[0] < 0.35: return
            if holder[0] in (a, b) and alive[a] and alive[b]:
                other = b if holder[0] == a else a
                holder[0] = other; last_pass[0] = cur[0]; self.passes.append((cur[0], other))
        sp.on_collision(1, 1, begin=touch)

        ends, t_acc = [], start
        for d in self.rounds: t_acc += d; ends.append(t_acc)
        rnd_i = 0; self.round_ends = ends; self.round_starts = [start] + ends[:-1]
        t, dt = 0.0, 1 / (FPS * SUB); frames = []
        while t < 75:
            nal = sum(alive); AR = self.ar(nal)
            for _ in range(SUB):
                sp.step(dt); t += dt; cur[0] = t
                for i, (b, c) in enumerate(balls):
                    if not alive[i]: continue
                    v = b.velocity.length
                    sp_i = self.speed * (1.12 if i == holder[0] else 1.0)
                    if v > 1: b.velocity = b.velocity * (sp_i / v)
                    px, py = b.position.x - CX, b.position.y - CY; dd = math.hypot(px, py)
                    if dd > AR - R:                       # mur circulaire (rebond)
                        nx, ny = px / dd, py / dd
                        b.position = (CX + nx * (AR - R), CY + ny * (AR - R))
                        vn = b.velocity.x * nx + b.velocity.y * ny
                        if vn > 0:
                            b.velocity = (b.velocity.x - 2 * vn * nx, b.velocity.y - 2 * vn * ny)
                            self.hits.append((t, 0.3))
                # le porteur se dirige un peu vers la bille la plus proche (il veut s'en débarrasser !)
                hb = balls[holder[0]][0]
                others = [balls[j][0] for j in range(n) if alive[j] and j != holder[0]]
                if others and t > start:
                    o = min(others, key=lambda ob: (ob.position - hb.position).length)
                    dv = (o.position - hb.position).normalized()
                    hb.velocity = hb.velocity + dv * 14
            if rnd_i < len(ends) and t >= ends[rnd_i]:
                i = holder[0]; alive[i] = 0; self.elims.append((t, i))
                self.bursts.append((t, balls[i][0].position.x, balls[i][0].position.y, i))
                sp.remove(*balls[i]); rnd_i += 1
                rest = [j for j in range(n) if alive[j]]
                if len(rest) > 1:
                    holder[0] = rng.choice(rest); last_pass[0] = t; self.passes.append((t + 0.01, holder[0]))
                else:
                    holder[0] = rest[0]
            rs = self.round_starts[min(rnd_i, len(ends) - 1)]; re = ends[min(rnd_i, len(ends) - 1)]
            heat = 0.0 if t < start or rnd_i >= len(ends) else max(0.0, min(1.0, (t - rs) / max(0.1, re - rs)))
            frames.append({"t": t, "balls": [(b.position.x, b.position.y, b.angle, alive[i]) for i, (b, c) in enumerate(balls)],
                           "holder": holder[0] if sum(alive) > 1 else -1, "heat": heat, "ar": AR})
            if sum(alive) <= 1:
                if not hasattr(self, "_end"): self._end = t
                if t > self._end + 2.2: break
        self.finish(frames)

    def audio_events(self, t0):
        ev = [(t0 + t, "tick", g) for (t, g) in self.hits]
        ev += [(t0 + t, "boing", 0.9) for (t, i) in self.passes]
        # tic-tac qui accélère à la fin de chaque manche
        for rs, re in zip(self.round_starts, self.round_ends):
            x = re - 1.6
            while x < re - 0.05:
                if x > rs: ev.append((t0 + x, "tick", 1.0))
                x += 0.2
        ev += [(t0 + t, "elim", 1.0) for (t, i) in self.elims]
        return ev

    def potato(self, cr, x, y, r, heat, t):
        """Patate dessinée (ovale bosselé, yeux, flammes), plus rouge quand le temps s'écoule."""
        sh = 4 * heat * math.sin(t * 60) if heat > 0.75 else 0
        cr.save(); cr.translate(x + sh, y); cr.rotate(0.3 * math.sin(t * 3))
        for q in range(5):          # flammes
            a = -math.pi / 2 + (q - 2) * 0.38; L = r * (0.9 + 0.5 * heat) * (0.75 + 0.25 * math.sin(t * 18 + q * 1.7))
            cr.move_to(r * 0.7 * math.cos(a - 0.2), r * 0.6 * math.sin(a - 0.2))
            cr.line_to((r * 0.75 + L) * math.cos(a), (r * 0.6 + L) * math.sin(a))
            cr.line_to(r * 0.7 * math.cos(a + 0.2), r * 0.6 * math.sin(a + 0.2)); cr.close_path()
            cr.set_source_rgba(1, 0.45 + 0.35 * (q % 2), 0.05, 0.9); cr.fill()
        cr.save(); cr.scale(1.0, 0.78)
        cr.move_to(r, 0)
        for q in range(1, 41):
            a = q * 2 * math.pi / 40; rr = r * (1 + 0.06 * math.sin(a * 3) + 0.04 * math.sin(a * 5))
            cr.line_to(rr * math.cos(a), rr * math.sin(a))
        cr.close_path(); cr.restore()
        cr.set_source_rgb(0.80 + 0.2 * heat, 0.58 - 0.35 * heat, 0.30 - 0.22 * heat); cr.fill_preserve()
        cr.set_source_rgb(0.35, 0.18, 0.05); cr.set_line_width(4); cr.stroke()
        cr.set_source_rgba(0.45, 0.25, 0.08, 0.6)
        for (sx, sy) in ((-0.45, 0.25), (0.4, 0.3), (0.1, -0.35)):
            cr.arc(sx * r, sy * r, r * 0.07, 0, 6.29); cr.fill()
        for s in (-1, 1):           # yeux
            cr.set_source_rgb(1, 1, 1); cr.arc(s * r * 0.3, -r * 0.08, r * 0.2, 0, 6.29); cr.fill()
            cr.set_source_rgb(0, 0, 0); cr.arc(s * r * 0.3 + r * 0.04, -r * 0.05, r * 0.1, 0, 6.29); cr.fill()
        cr.set_source_rgb(0.25, 0.08, 0.02); cr.set_line_width(4)
        cr.arc(0, r * 0.22, r * 0.18, 0.2, math.pi - 0.2); cr.stroke()
        cr.restore()

    def draw(self, cr, pt, k, oy=0, labels=True, intro=False):
        th = pt.th
        f = self.frames[min(k, self.nframes - 1)]; t = f["t"] if not intro else 0
        AR = f["ar"]; heat = f["heat"] if not intro else 0
        # sol de l'arène (chauffe avec le temps)
        cr.set_source_rgba(*th["mur"], 0.88); cr.arc(CX, CY, AR, 0, 6.29); cr.fill()
        cr.set_source_rgba(1, 0.35, 0.05, 0.10 * heat); cr.arc(CX, CY, AR, 0, 6.29); cr.fill()
        for q in range(1, 4):
            cr.set_source_rgba(*th["ligne"], 0.10); cr.set_line_width(3); cr.arc(CX, CY, AR * q / 4, 0, 6.29); cr.stroke()
        for lw, al in ((44, 0.10), (28, 0.22), (16, 1.0)) if th["lueur"] else ((24, 0.4), (16, 1.0)):
            cr.set_source_rgba(*(th["ligne"] if th["lueur"] or al == 1 else (0, 0, 0)), al); cr.set_line_width(lw)
            cr.arc(CX, CY, AR + 4, 0, 6.29); cr.stroke()
        # nuages de fumée des billes brûlées
        for (bt, bx, by, i) in self.bursts:
            e = t - bt
            if 0 <= e < 1.2:
                for q in range(9):
                    a = q * 2 * math.pi / 9 + i; d = 20 + 150 * e
                    cr.set_source_rgba(0.55, 0.55, 0.6, 0.55 * (1 - e / 1.2))
                    cr.arc(bx + d * math.cos(a), by + d * math.sin(a) - 90 * e, 26 + 30 * e, 0, 6.29); cr.fill()
                cr.set_source_rgba(1, 0.6, 0.1, max(0, 0.9 * (1 - e / 0.35))); cr.arc(bx, by, 40 + 120 * e, 0, 6.29); cr.fill()
        # traînée de feu derrière le porteur
        hd = f["holder"]
        if hd >= 0 and not intro:
            for d in range(1, 9):
                x, y, _, al = self.frames[max(0, k - d)]["balls"][hd]
                cr.set_source_rgba(1, 0.4 + 0.04 * d, 0.05, 0.35 * (1 - d / 9)); cr.arc(x, y, self.R * (1.1 - d / 14), 0, 6.29); cr.fill()
        self.draw_balls(cr, pt, k, 0, (1, 1, 1))
        if hd >= 0 and not intro:
            x, y = f["balls"][hd][0], f["balls"][hd][1]
            pulse = 1 + 0.08 * math.sin(t * (8 + 20 * heat))
            cr.set_source_rgba(1, 0.3, 0.05, 0.5 + 0.4 * heat); cr.set_line_width(7)
            cr.arc(x, y, (self.R + 9) * pulse, 0, 6.29); cr.stroke()
            self.potato(cr, x, y - self.R - 38, 44, heat, t)
        # flash « passe ! »
        for (pt_, i) in self.passes:
            e = t - pt_
            if 0 <= e < 0.3 and f["balls"][i][3]:
                x, y = f["balls"][i][0], f["balls"][i][1]
                cr.set_source_rgba(1, 0.85, 0.2, 0.8 * (1 - e / 0.3)); cr.set_line_width(5)
                cr.arc(x, y, self.R + 12 + 60 * e, 0, 6.29); cr.stroke()
        if labels and not intro:
            if hd >= 0:
                nm = pt.parts[hd]["nom"]
                pt.text(cr, "LA PATATE : " + nm.upper(), W / 2, CY + 540, 52,
                        color=(1, 0.55 + 0.3 * (1 - heat), 0.2), shadow=True)
