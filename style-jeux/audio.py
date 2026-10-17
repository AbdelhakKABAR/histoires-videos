"""Bande son synthétisée, différente à chaque vidéo (tempo, gamme, timbre, rythme tirés au hasard)."""
import math, wave
import numpy as np

SR = 44100
SCALES = {"mineur": [0, 2, 3, 5, 7, 8, 10], "phrygien": [0, 1, 3, 5, 7, 8, 10], "dorien": [0, 2, 3, 5, 7, 9, 10],
          "majeur": [0, 2, 4, 5, 7, 9, 11], "harmonique": [0, 2, 3, 5, 7, 8, 11]}


def build(path, dur, intro, decisive, end_main, events, seed):
    rng = np.random.default_rng(seed)
    N = int(dur * SR); out = np.zeros(N)

    def add(sig, t0, g=1.0):
        i = int(t0 * SR)
        if i >= N or i < 0: return
        j = min(N, i + len(sig)); out[i:j] += sig[:j - i] * g

    def env(n, a=0.002, d=0.1):
        t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)

    def tone(f, l, d=0.1, a=0.002, typ="sin"):
        n = int(l * SR); t = np.arange(n) / SR; ph = 2 * np.pi * f * t
        if typ == "sin": w = np.sin(ph)
        elif typ == "saw": w = 2 * (ph / (2 * np.pi) % 1) - 1
        elif typ == "tri": w = 2 * np.abs(2 * (ph / (2 * np.pi) % 1) - 1) - 1
        else: w = np.sign(np.sin(ph))
        return w * env(n, a, d)

    bpm = float(rng.integers(108, 146)); beat = 60 / bpm
    scale = SCALES[rng.choice(list(SCALES))]
    root = 55 * 2 ** (int(rng.integers(0, 7)) / 12)
    lead_t = rng.choice(["sq", "saw", "tri", "sin"])
    pattern = int(rng.integers(0, 3))
    prog = [0, int(rng.choice([3, 5])), int(rng.choice([4, 6])), int(rng.choice([2, 4]))]
    arp = rng.choice(len(scale), 8)

    def note(deg, octv):
        return root * 2 ** ((scale[deg % 7] + 12 * (octv + deg // 7)) / 12)

    kn = int(0.35 * SR); tk = np.arange(kn) / SR
    kick = np.sin(2 * np.pi * (45 + 110 * np.exp(-tk * 30)) * tk) * np.exp(-tk * 9)
    hat = np.diff(rng.standard_normal(int(0.05 * SR)) * env(int(0.05 * SR), 0.0005, 0.012), prepend=0)
    snare = rng.standard_normal(int(0.2 * SR)) * env(int(0.2 * SR), 0.001, 0.05) * 0.8 + tone(190, 0.2, 0.06) * 0.5
    b, tt = 0, 0.0
    while tt < decisive + 0.2:
        racing = tt >= intro
        p = max(0, (tt - intro) / max(1, decisive - intro))
        if racing or tt > intro - 3.2:
            if pattern == 0 or b % 2 == 0 or p > 0.5: add(kick, tt, 0.9)
        if racing:
            add(hat, tt + beat / 2, 0.35)
            if pattern == 2: add(hat, tt + beat / 4, 0.18)
            if b % 2 == 1 and p > 0.3: add(snare, tt, 0.45)
            if p > 0.75: add(hat, tt + beat / 4, 0.2); add(hat, tt + 3 * beat / 4, 0.2)
            bf = note(prog[(b // 4) % 4], 0)
            add(tone(bf, beat * 0.95, 0.25, 0.005, "saw") * 0.5 + tone(bf * 2, beat * 0.95, 0.2), tt, 0.32)
            for s in range(2):
                f = note(prog[(b // 4) % 4] + int(arp[(b * 2 + s) % 8]), 2 + (1 if p > 0.6 else 0))
                add(tone(f, beat / 2, 0.08, 0.003, lead_t) * 0.35, tt + s * beat / 2, 0.12 + 0.07 * p)
        else:
            add(tone(1800, 0.03, 0.01), tt, 0.15)
        tt += beat; b += 1
    for k in range(3): add(tone(660, 0.25, 0.12), intro - 3 + k, 0.6)
    add(tone(1320, 0.6, 0.25) + tone(660, 0.6, 0.25), intro, 0.7)
    last = -1
    for (t, kind, g) in sorted(events):
        if t > end_main: break
        if kind == "tick":
            if t - last < 0.04: continue
            last = t; add(tone(rng.uniform(900, 1600), 0.06, 0.018), t, 0.08 + 0.22 * g)
        elif kind == "boing":
            n = int(0.25 * SR); tb = np.arange(n) / SR
            add(np.sin(2 * np.pi * (300 + 500 * np.exp(-tb * 15)) * tb) * env(n, 0.001, 0.08), t, 0.5 * g + 0.15)
        elif kind == "elim":
            n = int(0.45 * SR); tb = np.arange(n) / SR
            sw = np.sin(2 * np.pi * np.cumsum(900 * np.exp(-tb * 6) + 90) / SR) * env(n, 0.002, 0.18)
            add(sw, t, 0.5); add(kick, t, 0.7)
            add(rng.standard_normal(int(0.25 * SR)) * env(int(0.25 * SR), 0.001, 0.06), t, 0.25)
    add(rng.standard_normal(int(2.5 * SR)) * env(int(2.5 * SR), 0.15, 0.9) * 0.18, decisive)
    for j, f in enumerate([523.25, 659.25, 783.99, 1046.5]):
        add(tone(f, 0.5, 0.2, 0.005, "saw") * 0.4 + tone(f, 0.5, 0.25), decisive + 0.12 * j, 0.35)
    for f in (523.25, 659.25, 783.99, 1046.5):
        add(tone(f, 3.0, 1.2, 0.01, "saw") * 0.25 + tone(f, 3.0, 1.4) * 0.6, end_main, 0.22)
    for j in range(8): add(tone(1046.5 * (1.5 if j % 2 else 1), 0.15, 0.05), end_main + 0.6 + j * 0.12, 0.12)
    out /= np.max(np.abs(out)) + 1e-9; out *= 0.9
    with wave.open(path, "wb") as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes((out * 32767).astype(np.int16).tobytes())
    return {"bpm": bpm, "timbre": str(lead_t)}
