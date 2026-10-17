"""JEUX à élimination — le dernier qui reste gagne.
   « cercle » : billes dans un ou deux anneaux qui tournent, avec une ouverture ; qui sort est éliminé.
   « arene »  : billes qui foncent sans gravité dans une arène ; une scie qui grossit et des lames en orbite les éliminent."""
import math, random
import pymunk
from common import W, H, FPS

SUB = 8
CX, CY = 540, 1030


class Elim:
    ELIM = True
    titre_fin = "LE SURVIVANT"
    R = 30

    def rank(self, k):
        """Vivants d'abord, puis éliminés du plus tard au plus tôt."""
        f = self.frames[min(k, self.nframes - 1)]
        alive = [i for i in range(self.n) if f["balls"][i][3]]
        dead = [i for (t, i) in sorted(self.elims, key=lambda e: -e[0]) if t <= f["t"]]
        return alive + dead

    def finish(self, frames):
        self.frames, self.nframes = frames, len(frames)
        last_t = max(t for t, _ in self.elims) if self.elims else frames[-1]["t"]
        self.decisive = min(self.nframes - 1, int(last_t * FPS))
        self.final_rank = self.rank(self.nframes - 1)
        self.winner = self.final_rank[0]

    def score(self):
        d = self.decisive / FPS
        ts = sorted(t for t, _ in self.elims)
        if len(ts) < self.n - 1: return False, -99, d
        first = ts[0]
        duel = ts[-1] - ts[-2] if len(ts) > 1 else 0
        gaps = [b - a for a, b in zip([0] + ts, ts)]
        evenness = -max(gaps) / 4
        ok = 24 <= d <= 42 and first >= 2.5
        return ok, evenness + min(duel, 6) - abs(d - 32) / 3, d

    def camera(self, k): return 0.0

    def hud(self, cr, pt, k, a):
        f = self.frames[min(k, self.nframes - 1)]
        pt.survivors_hud(cr, [b[3] for b in f["balls"]], a)
        for (t, i) in self.elims:
            pt.elim_popup(cr, i, f["t"] - t)

    def draw_balls(self, cr, pt, k, oy, ring_col):
        f = self.frames[min(k, self.nframes - 1)]
        for i in range(self.n):
            if not f["balls"][i][3]: continue
            col = pt.parts[i]["couleur"]
            for d in range(1, 7):
                x, y, _, al = self.frames[max(0, k - d)]["balls"][i]
                cr.set_source_rgba(*col, 0.22 * (1 - d / 7)); cr.arc(x, y - oy, self.R * (1 - d / 12), 0, 6.29); cr.fill()
        for i in range(self.n):
            x, y, a, alive = f["balls"][i]
            if alive:
                pt.ball(cr, x, y - oy, a, i, self.R, ring=(1, 1, 1))


class Cercle(Elim):
    def __init__(self, n, seed):
        self.n, self.seed = n, seed
        rng = random.Random(seed)
        self.R = 34 if n <= 8 else (30 if n <= 10 else (25 if n <= 16 else 21))
        sp = pymunk.Space(); sp.gravity = (0, rng.uniform(650, 850))
        self.rings = []
        nr = rng.choice((1, 2, 2))
        radii = [440] if nr == 1 else [440, 250]
        for j, rad in enumerate(radii):
            gap = rng.uniform(0.34, 0.44) if j == 0 else rng.uniform(0.5, 0.65)
            w = rng.choice((-1, 1)) * rng.uniform(0.8, 1.4) * (1 if j == 0 else -1.3)
            b = pymunk.Body(body_type=pymunk.Body.KINEMATIC); b.position = (CX, CY); b.angular_velocity = w
            b.angle = rng.uniform(0, 6.28)
            ring = {"body": b, "rad": rad, "gap": gap, "shapes": [], "gap0": gap}
            self.rings.append(ring); sp.add(b); self.set_gap(sp, ring, 0.0)   # fermé au départ
        self.simulate(sp, rng)

    def set_gap(self, sp, ring, gap):
        if ring["shapes"]: sp.remove(*ring["shapes"])
        ring["gap"] = gap; segs = 64; sh = []
        a0, a1 = gap / 2, 2 * math.pi - gap / 2 + (0.0001 if gap == 0 else 0)
        for s in range(segs):
            u, v = a0 + (a1 - a0) * s / segs, a0 + (a1 - a0) * (s + 1) / segs
            r = ring["rad"]
            seg = pymunk.Segment(ring["body"], (r * math.cos(u), r * math.sin(u)), (r * math.cos(v), r * math.sin(v)), 9)
            seg.elasticity = 1.0; seg.friction = 0.2; seg.collision_type = 2; sh.append(seg)
        sp.add(*sh); ring["shapes"] = sh

    def simulate(self, sp, rng):
        n, R = self.n, self.R
        inner = self.rings[-1]["rad"] - 60
        balls = []
        for i in range(n):
            b = pymunk.Body(1, pymunk.moment_for_circle(1, 0, R))
            ang = 2 * math.pi * i / n; rr = inner * 0.55
            b.position = (CX + rr * math.cos(ang), CY + rr * math.sin(ang))
            b.velocity = (rng.uniform(-400, 400), rng.uniform(-500, 100))
            c = pymunk.Circle(b, R); c.elasticity = 0.92; c.friction = 0.3; c.collision_type = 1
            sp.add(b, c); balls.append(b)
        self.hits, cur = [], [0.0]

        def post(arb, s, d):
            if arb.is_first_contact and arb.total_impulse.length > 80:
                self.hits.append((cur[0], arb.total_impulse.length))
        sp.on_collision(1, 2, post_solve=post); sp.on_collision(1, 1, post_solve=post)
        alive = [1] * n; self.elims = []; frames = []
        t, dt, last_widen = 0.0, 1 / (FPS * SUB), 0.0
        while t < 75:
            for _ in range(SUB):
                sp.step(dt); t += dt; cur[0] = t
            for i, b in enumerate(balls):
                if not alive[i]: continue
                d = math.hypot(b.position.x - CX, b.position.y - CY)
                if d > self.rings[0]["rad"] + R + 20:
                    alive[i] = 0; self.elims.append((t, i))
                elif b.velocity.length < 420:
                    b.velocity = b.velocity * (420 / max(1, b.velocity.length))
            if t >= 2.0 and self.rings[0]["gap"] == 0.0:      # ouverture à 2 s
                for ring in self.rings: self.set_gap(sp, ring, ring["gap0"])
            if t > 18 and t - last_widen > 1.0:          # l'ouverture s'agrandit pour finir la partie
                last_widen = t
                for ring in self.rings:
                    self.set_gap(sp, ring, min(2.2, ring["gap"] + 0.025 + 0.004 * (t - 18)))
            frames.append({"t": t, "balls": [(b.position.x, b.position.y, b.angle, alive[i]) for i, b in enumerate(balls)],
                           "fall": [(b.position.x, b.position.y) for b in balls],
                           "rings": [(r["body"].angle, r["gap"]) for r in self.rings]})
            if sum(alive) <= 1:
                if not hasattr(self, "_end"): self._end = t
                if t > self._end + 2.2: break
        if sum(alive) > 1:          # sécurité : jamais de partie sans fin
            for i in sorted(range(n), key=lambda i: -math.hypot(balls[i].position.x - CX, balls[i].position.y - CY))[:sum(alive) - 1]:
                alive[i] = 0; self.elims.append((t, i))
        self.finish(frames)

    def audio_events(self, t0):
        ev = [(t0 + t, "tick", min(1, imp / 500)) for (t, imp) in self.hits]
        ev += [(t0 + t, "elim", 1.0) for (t, i) in self.elims]
        return ev

    def draw(self, cr, pt, k, oy=0, labels=True, intro=False):
        th = pt.th
        f = self.frames[min(k, self.nframes - 1)]
        cols = [th["ligne"], th["accent"]]
        for j, ((ang, gap), ring) in enumerate(zip(f["rings"], self.rings)):
            r = ring["rad"]
            cr.set_source_rgba(*cols[j], 0.06); cr.arc(CX, CY, r, 0, 6.29); cr.fill()
            for lw, al in ((40, 0.10), (26, 0.22), (16, 1.0)) if th["lueur"] else ((22, 0.4), (16, 1.0)):
                cr.set_source_rgba(*(cols[j] if th["lueur"] or al == 1 else (0, 0, 0)), al); cr.set_line_width(lw)
                cr.arc(CX, CY, r, ang + gap / 2, ang + 2 * math.pi - gap / 2); cr.stroke()
            for s in (-1, 1):
                aa = ang + s * gap / 2
                cr.set_source_rgb(*th["accent"]); cr.arc(CX + r * math.cos(aa), CY + r * math.sin(aa), 14, 0, 6.29); cr.fill()
        # billes éliminées qui tombent
        for (t, i) in self.elims:
            e = f["t"] - t
            if 0 <= e < 1.6:
                x, y = f["fall"][i]
                pt.ball(cr, x, y, 0, i, self.R, alpha=max(0, 1 - e / 1.6), gray=True)
        self.draw_balls(cr, pt, k, 0, (1, 1, 1))
        if labels and not intro:
            pt.text(cr, "SORS = ÉLIMINÉ", W / 2, CY + 570, 46, color=th["accent2"], a=0.6, shadow=False)


class Arene(Elim):
    def __init__(self, n, seed):
        self.n, self.seed = n, seed
        rng = random.Random(seed)
        self.R = 34 if n <= 8 else (30 if n <= 10 else (25 if n <= 16 else 21))
        self.AR = 480
        self.speed = rng.uniform(440, 560)
        self.grow = rng.uniform(4.5, 6.5)
        self.norb = rng.choice((1, 2, 3))
        self.orb_w = rng.choice((-1, 1)) * rng.uniform(0.7, 1.1)
        sp = pymunk.Space(); sp.gravity = (0, 0)
        st = sp.static_body; segs = 72
        for s in range(segs):
            u, v = 2 * math.pi * s / segs, 2 * math.pi * (s + 1) / segs
            sg = pymunk.Segment(st, (CX + self.AR * math.cos(u), CY + self.AR * math.sin(u)),
                                (CX + self.AR * math.cos(v), CY + self.AR * math.sin(v)), 10)
            sg.elasticity = 1.0; sg.friction = 0.0; sg.collision_type = 2; sp.add(sg)
        self.simulate(sp, rng)

    def saw_r(self, t): return min(260, 40 + self.grow * max(0, t))

    def orbs(self, t):
        if t < 8: return []
        w = self.orb_w * (1 + t / 30)
        rad = min(self.AR - 70, self.saw_r(t) + 120)
        return [(CX + rad * math.cos(w * t + j * 2 * math.pi / self.norb),
                 CY + rad * math.sin(w * t + j * 2 * math.pi / self.norb)) for j in range(self.norb)]

    def simulate(self, sp, rng):
        n, R = self.n, self.R
        self.LIVES = 3
        balls = []
        for i in range(n):
            b = pymunk.Body(1, pymunk.moment_for_circle(1, 0, R))
            ang = 2 * math.pi * i / n + rng.uniform(-0.1, 0.1); rr = 360
            b.position = (CX + rr * math.cos(ang), CY + rr * math.sin(ang))
            va = ang + math.pi / 2 + rng.uniform(-0.6, 0.6); b.velocity = (self.speed * math.cos(va), self.speed * math.sin(va))
            c = pymunk.Circle(b, R); c.elasticity = 1.0; c.friction = 0.0; c.collision_type = 1
            sp.add(b, c); balls.append((b, c))
        saw_b = pymunk.Body(body_type=pymunk.Body.KINEMATIC); saw_b.position = (CX, CY)
        saw = pymunk.Circle(saw_b, self.saw_r(0)); saw.elasticity = 1.0; saw.collision_type = 5
        sp.add(saw_b, saw)
        orb_bodies = []
        for j in range(self.norb):
            ob = pymunk.Body(body_type=pymunk.Body.KINEMATIC); ob.position = (-500, -500)
            oc = pymunk.Circle(ob, 34); oc.elasticity = 1.0; oc.collision_type = 5
            sp.add(ob, oc); orb_bodies.append(ob)
        self.hits, cur = [], [0.0]
        lives = [self.LIVES] * n; last_hit = [-9.0] * n
        idx = {id(c): i for i, (b, c) in enumerate(balls)}
        self.damage = []

        def post(arb, s, d):
            if arb.is_first_contact: self.hits.append((cur[0], 0.6))

        def hurt(arb, s, d):
            i = idx.get(id(arb.shapes[0]))
            if i is not None and cur[0] - last_hit[i] > 0.6 and lives[i] > 0:
                last_hit[i] = cur[0]; lives[i] -= 1; self.damage.append((cur[0], i))
        sp.on_collision(1, 2, post_solve=post); sp.on_collision(1, 1, post_solve=post)
        sp.on_collision(1, 5, begin=hurt)
        alive = [1] * n; self.elims = []; self.bursts = []; frames = []
        t, dt = 0.0, 1 / (FPS * SUB)
        while t < 75:
            for _ in range(SUB):
                saw.unsafe_set_radius(self.saw_r(t))
                ob_pos = self.orbs(t)
                for j, ob in enumerate(orb_bodies):
                    p = ob_pos[j] if ob_pos else (-500 - 200 * j, -500)
                    ob.velocity = ((p[0] - ob.position.x) / dt, (p[1] - ob.position.y) / dt) if ob_pos else (0, 0)
                    if not ob_pos: ob.position = p
                sp.step(dt); t += dt; cur[0] = t
                for i, (b, c) in enumerate(balls):
                    if not alive[i]: continue
                    v = b.velocity.length
                    if v > 1: b.velocity = b.velocity * (self.speed / v)
                    if lives[i] <= 0:
                        alive[i] = 0; self.elims.append((t, i)); self.bursts.append((t, b.position.x, b.position.y, i))
                        sp.remove(b, c)
            frames.append({"t": t, "balls": [(b.position.x, b.position.y, b.angle, alive[i]) for i, (b, c) in enumerate(balls)],
                           "lives": list(lives)})
            if sum(alive) <= 1:
                if not hasattr(self, "_end"): self._end = t
                if t > self._end + 2.2: break
        if sum(alive) > 1:
            for i in sorted([i for i in range(n) if alive[i]], key=lambda i: lives[i])[:sum(alive) - 1]:
                alive[i] = 0; self.elims.append((t, i)); self.bursts.append((t, *balls[i][0].position, i))
        self.finish(frames)

    def audio_events(self, t0):
        ev = [(t0 + t, "tick", 0.5) for (t, imp) in self.hits]
        ev += [(t0 + t, "boing", 0.8) for (t, i) in self.damage]
        ev += [(t0 + t, "elim", 1.0) for (t, i) in self.elims]
        return ev

    def draw(self, cr, pt, k, oy=0, labels=True, intro=False):
        th = pt.th
        f = self.frames[min(k, self.nframes - 1)]; t = f["t"] if not intro else 0
        cr.set_source_rgba(*th["mur"], 0.85); cr.arc(CX, CY, self.AR, 0, 6.29); cr.fill()
        for lw, al in ((44, 0.10), (28, 0.22), (16, 1.0)) if th["lueur"] else ((24, 0.4), (16, 1.0)):
            cr.set_source_rgba(*(th["ligne"] if th["lueur"] or al == 1 else (0, 0, 0)), al); cr.set_line_width(lw)
            cr.arc(CX, CY, self.AR + 4, 0, 6.29); cr.stroke()
        # scie centrale
        sr = self.saw_r(t); teeth = 18
        cr.save(); cr.translate(CX, CY); cr.rotate(t * 4)
        cr.move_to(sr, 0)
        for q in range(teeth * 2 + 1):
            a = q * math.pi / teeth; rr = sr if q % 2 == 0 else sr * 0.86
            cr.line_to(rr * math.cos(a), rr * math.sin(a))
        cr.close_path(); cr.set_source_rgb(*th["bump"]); cr.fill_preserve()
        cr.set_source_rgba(0, 0, 0, 0.35); cr.set_line_width(3); cr.stroke()
        cr.set_source_rgba(0, 0, 0, 0.35); cr.arc(0, 0, sr * 0.55, 0, 6.29); cr.fill()
        cr.set_source_rgb(*th["accent"]); cr.arc(0, 0, sr * 0.18, 0, 6.29); cr.fill()
        cr.restore()
        for (ox, oy_) in self.orbs(t):
            cr.save(); cr.translate(ox, oy_); cr.rotate(-t * 6)
            cr.move_to(34, 0)
            for q in range(17):
                a = q * math.pi / 8; rr = 34 if q % 2 == 0 else 20
                cr.line_to(rr * math.cos(a), rr * math.sin(a))
            cr.close_path(); cr.set_source_rgb(*th["moulin"]); cr.fill(); cr.restore()
        # explosions
        for (bt, bx, by, i) in self.bursts:
            e = t - bt
            if 0 <= e < 0.7:
                col = pt.parts[i]["couleur"]
                for q in range(14):
                    a = q * 2 * math.pi / 14; d = 30 + 260 * e
                    cr.set_source_rgba(*col, 1 - e / 0.7); cr.arc(bx + d * math.cos(a), by + d * math.sin(a), 9 * (1 - e / 0.7) + 2, 0, 6.29); cr.fill()
                cr.set_source_rgba(1, 1, 1, 0.8 * (1 - e / 0.3) if e < 0.3 else 0); cr.arc(bx, by, 60 * e + 30, 0, 6.29); cr.fill()
        self.draw_balls(cr, pt, k, 0, (1, 1, 1))
        for i, (x, y, _, al) in enumerate(f["balls"]):
            if not al: continue
            for q in range(self.LIVES):
                cr.set_source_rgb(*((1, 0.25, 0.35) if q < f["lives"][i] else (0.25, 0.25, 0.3)))
                cr.arc(x - 18 + q * 18, y - self.R - 14, 7, 0, 6.29); cr.fill()
        for (dt_, i) in self.damage:
            e = t - dt_
            if 0 <= e < 0.35 and f["balls"][i][3]:
                x, y = f["balls"][i][0], f["balls"][i][1]
                cr.set_source_rgba(1, 0.2, 0.2, 0.7 * (1 - e / 0.35)); cr.arc(x, y, self.R + 10 + 30 * e, 0, 6.29); cr.fill()
        if labels and not intro:
            pt.text(cr, "3 TOUCHES = ÉLIMINÉ", W / 2, CY + 570, 46, color=th["accent2"], a=0.6, shadow=False)
