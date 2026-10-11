# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy", "soundfile", "scipy"]
# ///
"""Ambiances du film d'une minute : pluie (s1), jour (s2), nuit (s3). Bruits seulement, aucune mélodie. -> audio/music.wav"""
import sys, json
from pathlib import Path
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
FILM = Path(sys.argv[1]); MODE = sys.argv[2]; SR = 48000; dur = json.loads((FILM / "film.json").read_text())["duration"]; N = int(dur * SR); t = np.arange(N) / SR
rng = np.random.default_rng({"pluie": 3, "jour": 4, "nuit": 5}[MODE]); L = np.zeros(N); R = np.zeros(N)
bp = lambda x, lo, hi: sosfilt(butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x)
lp = lambda x, f: sosfilt(butter(2, f, btype="low", fs=SR, output="sos"), x)
hp = lambda x, f: sosfilt(butter(2, f, btype="high", fs=SR, output="sos"), x)
sm = lambda p: np.clip(p, 0, 1) ** 2 * (3 - 2 * np.clip(p, 0, 1))
def put(x, at, g, pan=0.0):
    i = int(at * SR)
    if i < 0 or i >= N: return
    x = x[: N - i]; L[i:i + len(x)] += x * g * (1 - pan); R[i:i + len(x)] += x * g * (1 + pan)
def slow(rate, seed):
    r = np.random.default_rng(seed); k = int(dur * rate) + 3; return np.interp(t, np.arange(k) / rate, r.random(k))
def steps(a, b, g=0.2):
    c = a
    while c < b:
        m = int(0.09 * SR); tt = np.arange(m) / SR; put(lp(rng.standard_normal(m), 1100) * np.exp(-tt / 0.022), c, rng.uniform(0.8, 1.2) * g, -0.3 + 0.5 * (c - a) / (b - a)); c += rng.uniform(0.2, 0.27)
def chirp():
    n = int(rng.uniform(0.05, 0.1) * SR); tt = np.arange(n) / SR; f0 = rng.uniform(2800, 4600); f1 = f0 * rng.uniform(0.75, 1.4)
    return np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f1, n)) / SR) * np.hanning(n) * (1 + 0.3 * np.sin(2 * np.pi * 38 * tt))
def birds(a, b, rate, g, env=None):
    c = a
    while c < b - 0.3:
        c += rng.exponential(rate); k = rng.integers(1, 4); pan = rng.uniform(-0.7, 0.7); q = c
        for _ in range(k): put(chirp(), q, g * (1 if env is None else float(np.interp(q, t, env))), pan); q += rng.uniform(0.08, 0.17)
w = bp(rng.standard_normal(N), 170, 650) * (0.3 + 0.7 * slow(0.6, 21) ** 2)
if MODE == "pluie":
    rain = 1 - 0.9 * sm((t - 12.3) / 3.2); sun = sm((t - 12.6) / 3.0)
    for n_, side in ((rng.standard_normal(N), L), (rng.standard_normal(N), R)):
        side += (hp(n_, 5200) * 0.030 + bp(n_, 1400, 5200) * 0.055 * (0.75 + 0.25 * slow(3, 5)) + bp(n_, 300, 900) * 0.03) * rain
    c = 0.0
    while c < dur:
        c += rng.exponential(0.035 + 0.25 * (1 - np.interp(c, t, rain))); n = int(rng.uniform(0.012, 0.04) * SR); tt = np.arange(n) / SR; f = rng.uniform(900, 3800)
        put(np.sin(2 * np.pi * f * tt * (1 + 2.5 * tt)) * np.exp(-tt / 0.006), c, rng.uniform(0.01, 0.045), rng.uniform(-0.7, 0.7))
    c = 10.7
    while c < dur:
        c += rng.exponential(0.07 + 0.5 * (1 - np.interp(c, t, rain))); n = int(0.06 * SR); tt = np.arange(n) / SR
        put(np.sin(2 * np.pi * rng.uniform(260, 420) * tt) * np.exp(-tt / 0.012), c, rng.uniform(0.04, 0.09), rng.uniform(-0.2, 0.3))
    L += w * 0.07 * (0.35 + 0.65 * rain); R += np.roll(w, 900) * 0.07 * (0.35 + 0.65 * rain)
    n = int(2.2 * SR); tt = np.arange(n) / SR; put(lp(rng.standard_normal(n), 90) * np.exp(-tt / 0.7) * np.clip(tt / 0.15, 0, 1), 0.15, 0.5, -0.2)
    steps(5.3, 7.5, 0.14); birds(13.4, dur, 0.55, 0.05, sun)
elif MODE == "jour":
    L += w * 0.035; R += np.roll(w, 700) * 0.035; birds(0.2, dur, 0.5, 0.045)
    # battements d'ailes de Plume pendant son vol (1,6 à 9,6 s) : petites bouffées d'air irrégulières
    c = 1.6
    while c < 9.6:
        m = int(0.05 * SR); put(bp(rng.standard_normal(m), 500, 2200) * np.hanning(m), c, rng.uniform(0.05, 0.09), 0.5 * np.sin(c * 1.7)); c += rng.uniform(0.085, 0.12)
else:
    for k, (f, pan, g) in enumerate([(4300, -0.6, 0.05), (4900, 0.5, 0.04), (3800, 0.1, 0.03)]):
        c = rng.uniform(0, 0.6)
        while c < dur:
            for j in range(rng.integers(2, 5)):
                m = int(0.035 * SR); tt = np.arange(m) / SR; put(np.sin(2 * np.pi * f * tt) * np.hanning(m) * (1 + 0.5 * np.sin(2 * np.pi * 60 * tt)), c + j * 0.055, g, pan)
            c += rng.uniform(0.35, 1.1)
    L += w * 0.035; R += np.roll(w, 700) * 0.035; steps(5.4, 7.5, 0.2)
out = np.stack([L, R], 1) * (np.clip(t / 0.3, 0, 1) * np.clip((dur - t) / (1.8 if MODE == "nuit" else 0.5), 0, 1))[:, None]; out *= (0.5 if MODE == "pluie" else 0.4) / np.max(np.abs(out))
sf.write(FILM / "audio" / "music.wav", out, SR); print("ambiance", MODE, "ok")
