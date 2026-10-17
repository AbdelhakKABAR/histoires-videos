"""Simulation physique d'une course de billes (drapeaux) — enregistre l'état à 30 i/s."""
import math, random, pymunk

W = 1080
WL, WR = 60, 1020          # murs
R = 36                     # rayon des billes
FPS = 30
SUB = 8                    # sous-pas physiques par image

def build(space, rng):
    st = space.static_body
    geo = {"seg": [], "peg": [], "bump": [], "spin": [], "zones": []}

    def seg(a, b, r=8, e=0.35, f=0.5, kind="seg"):
        s = pymunk.Segment(st, a, b, r); s.elasticity = e; s.friction = f
        s.collision_type = 2
        space.add(s); geo["seg"].append((a, b, r, kind))

    def peg(x, y, r=12):
        c = pymunk.Circle(st, r, (x, y)); c.elasticity = 0.55; c.friction = 0.3
        c.collision_type = 2
        space.add(c); geo["peg"].append((x, y, r))

    def bump(x, y, r=46):
        c = pymunk.Circle(st, r, (x, y)); c.elasticity = 1.25; c.friction = 0.1
        c.collision_type = 3
        space.add(c); geo["bump"].append((x, y, r))

    FIN = 8150
    # murs
    seg((WL, -200), (WL, FIN + 500), 10, kind="wall")
    seg((WR, -200), (WR, FIN + 500), 10, kind="wall")

    # 1. champ de clous
    geo["zones"].append((470, "CLOUS"))
    y, row = 500, 0
    while y < 1700:
        xs = range(135, 1000, 150) if row % 2 == 0 else range(210, 900, 150)
        for x in xs:
            peg(x + rng.uniform(-6, 6), y)
        y += 120; row += 1

    # 2. zigzag
    geo["zones"].append((1760, "ZIGZAG"))
    y = 1850
    for i in range(5):
        if i % 2 == 0:
            seg((WL, y), (895, y + 230), f=0.3)
        else:
            seg((WR, y), (185, y + 230), f=0.3)
        y += 340

    # 3. moulins
    geo["zones"].append((3640, "MOULINS"))
    for k, yy in enumerate((3820, 4230)):
        for j, xx in enumerate((300, 780)):
            b = pymunk.Body(body_type=pymunk.Body.KINEMATIC)
            b.position = (xx, yy)
            b.angular_velocity = (2.2 if (j + k) % 2 == 0 else -2.2)
            b.angle = rng.uniform(0, math.pi)
            arms = []
            for a in range(4):
                ang = a * math.pi / 2
                p = (165 * math.cos(ang), 165 * math.sin(ang))
                s = pymunk.Segment(b, (0, 0), p, 10); s.elasticity = 0.6; s.friction = 0.4
                s.collision_type = 2
                arms.append(s)
            space.add(b, *arms)
            geo["spin"].append((b, 165))

    # 4. entonnoir
    geo["zones"].append((4500, "ENTONNOIR"))
    seg((WL, 4560), (478, 4960))
    seg((WR, 4560), (602, 4960))

    # 5. bumpers
    geo["zones"].append((5150, "BUMPERS"))
    for (x, y) in [(300, 5350), (780, 5350), (540, 5600), (220, 5850), (860, 5850), (540, 6100)]:
        bump(x, y)
    for x in (140, 400, 680, 940):
        peg(x, 5480)
    for x in (380, 700):
        peg(x, 5980)

    # 6. dernier zigzag (plus raide)
    geo["zones"].append((6300, "SPRINT FINAL"))
    y = 6400
    for i in range(4):
        if i % 2 == 0:
            seg((WL, y), (880, y + 250), f=0.3)
        else:
            seg((WR, y), (200, y + 250), f=0.3)
        y += 330

    # 7. arrivée
    seg((WL, 7750), (440, 7950))
    seg((WR, 7750), (640, 7950))
    seg((440, 7950), (440, 8000)); seg((640, 7950), (640, 8000))
    seg((WL, FIN + 300), (WR, FIN + 300), 12, kind="floor")
    return geo, 8000   # ligne d'arrivée


def simulate(n, seed, max_s=80):
    rng = random.Random(seed)
    space = pymunk.Space()
    space.gravity = (0, 1150)
    space.damping = 0.995
    geo, finish_y = build(space, rng)

    balls = []
    start = []
    for i in range(n):
        x = 180 + (i % 5) * 180 + rng.uniform(-4, 4)
        y = 190 + (i // 5) * 110
        start.append((x, y))
        b = pymunk.Body(1, pymunk.moment_for_circle(1, 0, R))
        b.position = (x, y)
        c = pymunk.Circle(b, R); c.elasticity = 0.55; c.friction = 0.7
        c.collision_type = 1
        space.add(b, c); balls.append(b)

    hits = []
    cur_t = [0.0]
    def post(arb, sp, data):
        if arb.is_first_contact:
            imp = arb.total_impulse.length
            if imp > 60:
                b = arb.shapes[0].body
                hits.append((cur_t[0], b.position.y, imp, arb.shapes[1].collision_type))
    for ct in (1, 2, 3):
        space.on_collision(1, ct, post_solve=post)

    frames, order, still = [], [], [0.0] * n
    dt = 1.0 / (FPS * SUB)
    t, fin_done = 0.0, None
    while t < max_s:
        for _ in range(SUB):
            space.step(dt); t += dt; cur_t[0] = t
        for i, b in enumerate(balls):
            if i in order:
                continue
            if b.position.y > finish_y:
                order.append(i)
            sp = b.velocity.length
            still[i] = still[i] + 1 / FPS if sp < 25 else 0
            if still[i] > 1.2:
                b.apply_impulse_at_local_point((rng.choice((-1, 1)) * 260, -320))
                still[i] = 0
        frames.append({
            "t": t,
            "balls": [(b.position.x, b.position.y, b.angle) for b in balls],
            "spin": [s[0].angle for s in geo["spin"]],
        })
        if len(order) == n or (len(order) >= 3 and fin_done is None):
            fin_done = fin_done or t
        if fin_done and t > fin_done + 1.5:
            break
    return dict(frames=frames, order=order, geo=geo, finish_y=finish_y,
                hits=hits, start=start)


if __name__ == "__main__":
    import sys
    for seed in range(int(sys.argv[1]) if len(sys.argv) > 1 else 3):
        r = simulate(10, seed)
        f = r["frames"]
        print(seed, "durée", round(f[-1]["t"], 1), "ordre", r["order"][:3],
              "1er à", next((round(x["t"], 1) for x in f if any(p[1] > r["finish_y"] for p in x["balls"])), None))
