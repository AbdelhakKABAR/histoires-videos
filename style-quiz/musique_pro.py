# /// script
# dependencies = ["numpy", "soundfile"]
# ///
import sys, json, numpy as np, soundfile as sf
F = sys.argv[1]; dur = json.load(open(F + "/film.json"))["duration"]; SR = 48000; t = np.arange(int(dur * SR)) / SR
chords = [[110, 164.8, 220, 261.6], [87.3, 130.8, 174.6, 220], [98, 146.8, 196, 246.9], [82.4, 123.5, 164.8, 207.7]]
L = np.zeros_like(t); R = np.zeros_like(t); seg = 8.0
for k in range(int(dur // seg) + 2):
    c = chords[k % 4]; t0 = k * seg; env = np.clip((t - t0 + 2) / 2, 0, 1) * np.clip((t0 + seg + 2 - t) / 2, 0, 1)
    for j, f in enumerate(c):
        for d, side in ((-0.15, 0), (0.15, 1)):
            w = np.sin(2 * np.pi * (f + d) * t + j) * env * (0.5 if j == 0 else 0.25)
            if side == 0: L += w
            else: R += w
pulse = (np.sin(2 * np.pi * 55 * t) * np.exp(-((t * 2) % 1) * 6)) * 0.35
L += pulse; R += pulse
fade = np.clip(t / 2, 0, 1) * np.clip((dur - t) / 2, 0, 1); x = np.stack([L * fade, R * fade], 1); x /= np.max(np.abs(x)) * 1.4
sf.write(F + "/audio/music.wav", x, SR)
