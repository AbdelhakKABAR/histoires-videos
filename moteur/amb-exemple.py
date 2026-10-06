# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy", "soundfile", "scipy"]
# ///
"""Ambience bed (takes the music slot, so mix.mjs ducks it under the voice): birdsong, breeze, river,
frog, storm wind, rain, thunder, crickets, owl. Everything synthesized, seeded. -> audio/music.wav"""
import json, sys
from pathlib import Path
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

FILM = Path(sys.argv[1]); SR = 48000
tl = json.loads((FILM / "timeline.json").read_text()); grid = json.loads((FILM / "beats.json").read_text())
dur = json.loads((FILM / "film.json").read_text())["duration"]; P = grid["period"]
S = {s["id"]: (s["u0"] * P, s["u1"] * P) for s in tl["scenes"]}
PH = {}
for p in tl["phrases"]: PH.setdefault(p["scene"], []).append((p["u0"] * P, p["u1"] * P))
N = int(dur * SR); t = np.arange(N) / SR; rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)

def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x)
def lp(x, f): return sosfilt(butter(2, f, btype="low", fs=SR, output="sos"), x)
def hp(x, f): return sosfilt(butter(2, f, btype="high", fs=SR, output="sos"), x)
def env(a, b, fi=1.0, fo=1.0):
    return np.clip((t - a) / fi, 0, 1) * np.clip((b - t) / fo, 0, 1)
def put(x, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N or i < 0: return
    x = x[: N - i]; L[i:i + len(x)] += x * gain * np.sqrt((1 - pan) / 2) * 1.414; R[i:i + len(x)] += x * gain * np.sqrt((1 + pan) / 2) * 1.414
def slow(rate, seed):   # smooth random 0..1
    r = np.random.default_rng(seed); k = int(dur * rate) + 3
    return np.interp(t, np.arange(k) / rate, r.random(k))

def chirp():
    n = int(rng.uniform(0.05, 0.11) * SR); tt = np.arange(n) / SR
    f0 = rng.uniform(2600, 4600); f1 = f0 * rng.uniform(0.7, 1.45)
    ph = 2 * np.pi * np.cumsum(np.linspace(f0, f1, n)) / SR
    return np.sin(ph) * np.hanning(n) * (1 + 0.3 * np.sin(2 * np.pi * 38 * tt))
def birds(a, b, density, gain):
    tt = a
    while tt < b:
        tt += rng.exponential(1 / density)
        k = rng.integers(2, 6); pan = rng.uniform(-0.8, 0.8); c = tt
        for _ in range(k):
            put(chirp(), c, gain * rng.uniform(0.5, 1), pan); c += rng.uniform(0.07, 0.16)
def add(x, gain, pan=0.0):
    global L, R
    L += x * gain * (1 - 0.4 * pan); R += x * gain * (1 + 0.4 * pan)

noise = rng.standard_normal(N)
B = lambda u: u * P
OUT = [(0, B(8.9), 1.3), (B(93.2), S["dehors"][1], 1.3), (B(139.4), S["morale"][0], 1.5)]
for a, b, d in OUT: birds(a, b, d, 0.10)
birds(B(8.9), B(93.2), 0.25, 0.03); birds(S["malaise"][0], B(139.4), 0.2, 0.025)   # muffled, through the window
breeze = bp(noise, 250, 900) * (0.4 + 0.6 * slow(0.5, 11))
add(breeze, 0.035 * sum(env(a, b, 0.6, 0.6) for a, b, _ in OUT))
room = bp(noise, 100, 420) * (0.6 + 0.4 * slow(0.4, 51))
add(room, 0.018 * (env(B(8.9), B(93.2), 0.5, 0.5) + env(S["malaise"][0], B(139.4), 0.5, 0.5)))
# the clock: soft all through the lonely scenes
def tick(f):
    n = int(0.04 * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.006)
c = S["consequence"][1] - 2
k = 0
while c < S["seul"][1]:
    put(tick(2100 if k % 2 else 1700), c, 0.10, 0.3); c += P; k += 1
c = S["malaise"][0]
while c < S["malaise"][1]:
    put(tick(2100 if k % 2 else 1700), c, 0.06, 0.3); c += P; k += 1
# toy wheels on the floor / on the grass
def roll(a, b, g):
    add(bp(rng.standard_normal(N), 150, 600) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 7 * t))), g * env(a, b, 0.3, 0.4))
roll(B(9.2), B(15.4), 0.03); roll(B(77.5), B(82.3), 0.022); roll(B(160.3), B(170.2), 0.04)
# footsteps of the run
def step():
    n = int(0.09 * SR); tt = np.arange(n) / SR
    return lp(rng.standard_normal(n), 900) * np.exp(-tt / 0.02)
c = B(137.7)
while c < B(144.5):
    put(step(), c, 0.25, rng.uniform(-0.3, 0.3)); c += 0.21
# giggles of joy: little rising chirps (wordless)
def giggle(f0):
    n = int(0.11 * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f0 * 1.25, n)) / SR) * np.hanning(n)
for a in (B(99.2), B(100.2), B(157.2), B(158.7), B(162), B(175.2), B(176.7)):
    for j in range(4): put(giggle(820 + 90 * j + rng.uniform(-30, 30)), a + j * 0.13, 0.05, 0.3)
# master fades, peak
fade = np.clip(t / 0.5, 0, 1) * np.clip((dur - t) / 1.5, 0, 1)
out = np.stack([L, R], 1) * fade[:, None]
out *= 0.5 / np.max(np.abs(out))
sf.write(FILM / "audio" / "music.wav", out, SR)
print("ambience ->", FILM / "audio" / "music.wav")
