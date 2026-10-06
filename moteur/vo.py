# /// script
# requires-python = ">=3.10"
# dependencies = ["sherpa-onnx", "numpy", "soundfile", "scipy"]
# ///
"""Narration: one take per sentence, laid out scene by scene on the beat grid.
-> audio/vo.wav, timeline.js (scene + phrase beats for film.js), timeline.json"""
import json, sys
from pathlib import Path
import numpy as np, soundfile as sf, sherpa_onnx
from scipy.signal import resample_poly

FILM = Path(sys.argv[1]); MODEL = Path(sys.argv[2])
grid = json.loads((FILM / "beats.json").read_text()); dur = json.loads((FILM / "film.json").read_text())["duration"]
P = grid["period"]
# a phrase is a string, or {"t": text, "speed": 0.8, "pre": beats of silence before it} for suspense
NORM = lambda p: p if isinstance(p, dict) else {"t": p}
SCENES = [(x["id"], [NORM(p) for p in x["phrases"]]) for x in json.loads((FILM / "story.json").read_text())]
SPEED = float(sys.argv[3]) if len(sys.argv) > 3 else 0.9
onnx = next(MODEL.glob("*.onnx"))
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
    vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=str(onnx), tokens=str(MODEL / "tokens.txt"), data_dir=str(MODEL / "espeak-ng-data"), noise_scale=0.6, noise_scale_w=0.9), num_threads=4)))
SR = 48000


def take(ph):
    text = ph["t"]
    spoken = text.replace("«", "").replace("»", "").strip()
    a = tts.generate(spoken, sid=0, speed=ph.get("speed", SPEED))
    x = resample_poly(np.asarray(a.samples, dtype=np.float64), SR, a.sample_rate)
    idx = np.where(np.abs(x) > 0.02)[0]; x = x[max(idx[0] - 480, 0): idx[-1] + 3600]
    x[-2400:] *= np.linspace(1, 0, 2400)
    return x


takes = [[take(t) for t in ph] for _, ph in SCENES]
LEAD, GAP, TAIL, END = 1.5, 0.75, 2.0, 0   # beats: before 1st phrase, between phrases, after last; END = moral card
need = sum(LEAD + TAIL + sum(len(x) / SR / P for x in tk) + sum(q.get("pre", GAP) for q in ph[1:]) for (_, ph), tk in zip(SCENES, takes))
total = dur / P
slack = total - END - need
print(f"speech needs {need:.1f} beats of {total - END:.0f}; slack {slack:.1f} beats")
assert slack >= 0, "too long: raise SPEED"
extra = (slack - 5) / (len(SCENES) - 1)   # the moral card keeps 5 spare beats to hold
out = np.zeros(int(dur * SR)); u = 0.0; scenes = []; phrases = []
for k, ((sid, ph), tk) in enumerate(zip(SCENES, takes)):
    u0 = u; c = u0 + LEAD
    for j, (q, x) in enumerate(zip(ph, tk)):
        text = q["t"]
        if j: c += q.get("pre", GAP)
        c = round(c * 4) / 4
        i = int((grid["offset"] + c * P) * SR); out[i:i + len(x)] += x[: len(out) - i]
        e = c + len(x) / SR / P
        phrases.append({"scene": sid, "u0": round(c, 2), "u1": round(e, 2), "text": text, "who": q.get("who", "")}); c = e
    u = total - END if k == len(SCENES) - 1 else float(round(c + TAIL + extra))
    scenes.append({"id": sid, "u0": u0, "u1": u}); print(f"{sid:<11} {u0:6.1f}-{u:6.1f}  ({(u - u0) * P:4.1f}s)")
out *= 0.7 / np.max(np.abs(out))
sf.write(FILM / "audio" / "vo_raw.wav", np.stack([out, out], 1), SR)
# soften: a little warmth, less edge, a touch of room
import subprocess
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(FILM / "audio" / "vo_raw.wav"), "-af",
                "equalizer=f=210:t=q:w=1.1:g=2.5,equalizer=f=3400:t=q:w=1.4:g=-2,highshelf=f=7000:g=-3.5,aecho=0.9:0.5:38|61:0.10|0.06,alimiter=limit=0.8",
                str(FILM / "audio" / "vo.wav")], check=True)
fr = SR // 60
envv = np.sqrt(np.convolve(out ** 2, np.ones(fr * 2) / (fr * 2), mode="same"))[::fr]
envv = np.clip(envv / (np.percentile(envv[envv > 0.01], 90) + 1e-9), 0, 1)
tl = {"scenes": scenes, "phrases": phrases, "env": [round(float(v), 2) for v in envv]}
(FILM / "timeline.json").write_text(json.dumps(tl, ensure_ascii=False, indent=1))
(FILM / "timeline.js").write_text("export const TL = " + json.dumps(tl, ensure_ascii=False) + ";\n")
