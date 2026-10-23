# /// script
# requires-python = ">=3.10"
# dependencies = ["sherpa-onnx<2", "numpy", "soundfile", "scipy"]
# ///
"""Voix d'un épisode de quiz : uv run quiz_voix.py <dossier> <quiz.json> <dossier des voix> [3|7]
Le conteur lit l'intro, chaque question, les 4 réponses, puis la bonne réponse après 5 s de réflexion. Les phrases sont
posées les unes après les autres (pas de « at » à régler) -> audio/vo.wav + timeline.js (phrases, enveloppe, minutage du quiz) + film.json."""
import json, re, sys
from pathlib import Path
import numpy as np, soundfile as sf, sherpa_onnx
from scipy.signal import resample_poly
FILM = Path(sys.argv[1]); Q = json.loads(Path(sys.argv[2]).read_text()); VD = Path(sys.argv[3]).resolve(); SR = 48000
src = (Path(__file__).resolve().parent.parent / "moteur" / "vo.py").read_text()
SUPER = "sherpa-onnx-supertonic-tts-int8-2026-03-06"; MODEL = VD / SUPER; PROF = {"voice": SUPER}
NARR = sys.argv[4] if len(sys.argv) > 4 else "3"; SID = {"3": 2, "7": 6}[NARR]
i = src.index("def supertonic(d):"); j = src.index("onnx = None if PROF"); exec(src[i:j]); tts = supertonic(MODEL)
NUM = {"1": "un", "2": "deux", "3": "trois", "4": "quatre", "5": "cinq", "6": "six", "7": "sept", "8": "huit", "9": "neuf", "10": "dix"}
NTH = ["un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"]
def say(text):
    a = narrate(text, 0.82); x = resample_poly(np.asarray(a.samples, dtype=np.float64), SR, a.sample_rate)
    idx = np.where(np.abs(x) > 0.02 * np.max(np.abs(x)))[0]; x = x[max(idx[0] - 480, 0): idx[-1] + 3600]; x[-2400:] *= np.linspace(1, 0, 2400)
    return x / np.sqrt(np.mean(x[np.abs(x) > 0.02] ** 2))
clips = []; quiz = []; t = 0.5
def put(text, kind, at):
    x = say(text); clips.append((at, x)); ph = {"t0": round(at, 3), "t1": round(at + len(x) / SR, 3), "text": text, "who": kind}; phrases.append(ph); print(ph); return ph
phrases = []
it = put(Q["intro"], "intro", t); t = it["t1"] + 0.8
for n, q in enumerate(Q["questions"]):
    qp = put(f"Question {NTH[n]}. {q['q']}", "q", t)
    names = [NUM.get(a[1], a[1]) for a in q["a"]]; names = [names[0]] + [w[0].lower() + w[1:] for w in names[1:]]
    ap = put(", ".join(names[:3]) + ", ou " + names[3] + " ?", "a", qp["t1"] + 0.35)
    c0 = ap["t1"] + 0.5; c1 = c0 + 5.0
    rp = put(q["say"], "r", c1 + 0.25)
    quiz.append({"q0": qp["t0"], "q1": qp["t1"], "a0": ap["t0"], "a1": ap["t1"], "c0": round(c0, 3), "c1": round(c1, 3), "r0": rp["t0"], "r1": rp["t1"], "end": round(rp["t1"] + 0.9, 3)})
    t = rp["t1"] + 0.9
op = put(Q["outro"], "outro", t); dur = round(op["t1"] + 3.0, 2)
N = int(dur * SR); vo = np.zeros(N)
for at, x in clips: k = int(at * SR); vo[k:k + len(x)] += x[: N - k]
vo *= 0.7 / np.max(np.abs(vo)); (FILM / "audio").mkdir(parents=True, exist_ok=True); sf.write(FILM / "audio" / "vo.wav", np.stack([vo, vo], 1), SR)
fr = SR // 60; e = np.sqrt(np.convolve(vo ** 2, np.ones(fr * 2) / (fr * 2), mode="same"))[::fr]; e = np.clip(e / (np.percentile(e[e > 0.01], 90) + 1e-9), 0, 1)
(FILM / "timeline.js").write_text("export const TL = " + json.dumps({"phrases": phrases, "env": [round(float(v), 2) for v in e], "quiz": quiz, "dur": dur, "data": Q}, ensure_ascii=False) + ";\n")
f = json.loads((FILM / "film.json").read_text()); f["duration"] = dur; (FILM / "film.json").write_text(json.dumps(f, indent=1))
beats = [k * 0.5 for k in range(int(dur * 2) + 1)]
(FILM / "beats.json").write_text(json.dumps({"bpm": 120, "period": 0.5, "offset": 0, "beats": beats, "downbeats": beats[::4], "sections": [{"name": "main", "beat": 0}], "duration": dur}))
print("durée :", dur, "s ; contrôle des mots :", VERIF["prises"], "prises,", VERIF["refaites"], "refaites ; imparfaits :", VERIF["restent"])
