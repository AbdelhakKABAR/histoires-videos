import json, math, numpy as np, wave
M = json.load(open("meta.json"))
SR = 44100
dur = M["total_frames"] / M["fps"] + 0.5
N = int(dur * SR)
out = np.zeros(N)
t_all = np.arange(N) / SR
rng = np.random.default_rng(3)

def add(sig, t0, gain=1.0):
    i = int(t0 * SR)
    if i >= N: return
    j = min(N, i + len(sig)); out[i:j] += sig[:j - i] * gain

def env(n, a=0.002, d=0.1):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)

def tone(f, l, d=0.1, a=0.002, typ="sin"):
    n = int(l * SR); t = np.arange(n) / SR
    ph = 2 * np.pi * f * t
    w = np.sin(ph) if typ == "sin" else (2 * (ph / (2 * np.pi) % 1) - 1) if typ == "saw" else np.sign(np.sin(ph))
    return w * env(n, a, d)

intro, first = M["intro"], M["first_finish_s"]
end_race = intro + M["race_frames"] / M["fps"]
# ---- musique (128 bpm, la mineur) ----
bpm = 128; beat = 60 / bpm
kick_n = int(0.35 * SR); tk = np.arange(kick_n) / SR
kick = np.sin(2 * np.pi * (45 + 110 * np.exp(-tk * 30)) * tk) * np.exp(-tk * 9)
hat = rng.standard_normal(int(0.05 * SR)) * env(int(0.05 * SR), 0.0005, 0.012)
hat = np.diff(hat, prepend=0)
snare = rng.standard_normal(int(0.2 * SR)) * env(int(0.2 * SR), 0.001, 0.05) * 0.8 + tone(190, 0.2, 0.06) * 0.5
bassline = [55, 55, 65.4, 49]   # A1 A1 C2 G1
arp = [440, 523.25, 659.25, 523.25, 392, 493.88, 587.33, 493.88]
b = 0; tt = 0.0
while tt < first + 0.2:
    racing = tt >= intro
    prog = max(0, (tt - intro) / max(1, first - intro))
    if racing or tt > intro - 3.2:
        add(kick, tt, 0.9)
    if racing:
        add(hat, tt + beat / 2, 0.35)
        if b % 2 == 1 and prog > 0.35: add(snare, tt, 0.45)
        if prog > 0.75: add(hat, tt + beat / 4, 0.2); add(hat, tt + 3 * beat / 4, 0.2)
        bf = bassline[(b // 4) % 4]
        add(tone(bf, beat * 0.95, 0.25, 0.005, "saw") * 0.5 + tone(bf * 2, beat * 0.95, 0.2), tt, 0.32)
        for s in range(2):
            f = arp[(b * 2 + s) % 8] * (2 if prog > 0.6 else 1)
            add(tone(f, beat / 2, 0.08, 0.003, "sq") * 0.35, tt + s * beat / 2, 0.12 + 0.06 * prog)
    else:
        add(tone(1800, 0.03, 0.01), tt, 0.15)   # tic-tac d'attente
    tt += beat; b += 1
# ---- compte à rebours ----
for n in range(3):
    add(tone(660, 0.25, 0.12), intro - 3 + n, 0.6)
add(tone(1320, 0.6, 0.25) + tone(660, 0.6, 0.25), intro, 0.7)
# ---- chocs ----
cam = M["cam"]; fps = M["fps"]
last = -1
for (t, y, imp, ct) in M["hits"]:
    if t > end_race: break
    k = int((t - intro) * fps)
    if k < 0 or k >= len(cam): continue
    sy = y - cam[k]
    if not (0 < sy < 1920): continue
    if t - last < 0.035: continue
    last = t
    g = min(1, imp / 400)
    if ct == 3:
        n = int(0.25 * SR); tb = np.arange(n) / SR
        sig = np.sin(2 * np.pi * (300 + 500 * np.exp(-tb * 15)) * tb) * env(n, 0.001, 0.08)
        add(sig, t, 0.5 * g + 0.15)
    else:
        f = rng.uniform(900, 1600)
        add(tone(f, 0.06, 0.018), t, 0.10 + 0.25 * g)
# ---- victoire ----
add(rng.standard_normal(int(2.5 * SR)) * env(int(2.5 * SR), 0.15, 0.9) * 0.18, first)    # foule
w = int(0.5 * SR); tw = np.arange(w) / SR
add(np.sin(2 * np.pi * (2800 + 120 * np.sin(2 * np.pi * 30 * tw)) * tw) * env(w, 0.01, 0.3), first, 0.25)
for j, f in enumerate([523.25, 659.25, 783.99, 1046.5]):
    add(tone(f, 0.5, 0.2, 0.005, "saw") * 0.4 + tone(f, 0.5, 0.25), first + 0.12 * j, 0.35)
o = end_race
for f in (523.25, 659.25, 783.99, 1046.5):
    add(tone(f, 3.0, 1.2, 0.01, "saw") * 0.25 + tone(f, 3.0, 1.4) * 0.6, o, 0.22)
for j in range(8):
    add(tone(1046.5 * (1.5 if j % 2 else 1), 0.15, 0.05), o + 0.6 + j * 0.12, 0.12)
out /= np.max(np.abs(out)) + 1e-9
out *= 0.9
pcm = (out * 32767).astype(np.int16)
with wave.open("son.wav", "wb") as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes(pcm.tobytes())
print("ok", round(dur, 1))
