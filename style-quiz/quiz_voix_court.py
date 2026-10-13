# /// script
# requires-python = ">=3.10"
# dependencies = ["sherpa-onnx", "numpy", "soundfile", "scipy"]
# ///
"""Voix d'un épisode de quiz court (30 s) : uv run quiz_voix.py <dossier> <quiz.json> <dossier des voix>
Voix : Piper fr_FR siwis medium, choisie par l'utilisateur le 13 oct. 2026 (« voix 2 »).
Le conteur lit l'intro, chaque question, les 4 réponses, puis la bonne réponse après 5 s de réflexion. Les phrases sont
posées les unes après les autres (pas de « at » à régler) -> audio/vo.wav + timeline.js (phrases, enveloppe, minutage du quiz) + film.json."""
import json, re, sys
from pathlib import Path
import numpy as np, soundfile as sf, sherpa_onnx
from scipy.signal import resample_poly
FILM = Path(sys.argv[1]); Q = json.loads(Path(sys.argv[2]).read_text()); VD = Path(sys.argv[3]).resolve(); SR = 48000
src = (Path(__file__).resolve().parent.parent / "moteur" / "vo.py").read_text()
SUPER = "sherpa-onnx-supertonic-tts-int8-2026-03-06"; MODEL = VD / SUPER; PROF = {"voice": SUPER}
import subprocess, unicodedata, difflib
MODEL = VD / SUPER; i = src.index("_asr = None"); j = src.index("def chunks(text):"); exec(src[i:j])
# Voix choisie par l'utilisateur le 13 oct. 2026 (« voix 2 ») : Piper fr_FR siwis medium (femme, français très net).
PD = VD / "vits-piper-fr_FR-siwis-medium"
if not PD.exists(): subprocess.run(f"curl -sSL --fail https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-fr_FR-siwis-medium.tar.bz2 | tar xj -C '{VD}'", shell=True, check=True)
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=str(next(PD.glob("*.onnx"))), tokens=str(PD / "tokens.txt"), data_dir=str(PD / "espeak-ng-data")), num_threads=2)))
VERIF = {"restent": []}
def narrate(text, speed):
    a = tts.generate(text, sid=0, speed=speed)
    if missing(text, np.asarray(a.samples, dtype=np.float64), a.sample_rate): VERIF["restent"].append(text)
    return a
NUM = {"1": "un", "2": "deux", "3": "trois", "4": "quatre", "5": "cinq", "6": "six", "7": "sept", "8": "huit", "9": "neuf", "10": "dix"}
NTH = ["un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"]
def say(text, speed=0.95):
    a = narrate(text, speed); x = resample_poly(np.asarray(a.samples, dtype=np.float64), SR, a.sample_rate)
    idx = np.where(np.abs(x) > 0.02 * np.max(np.abs(x)))[0]; x = x[max(idx[0] - 480, 0): idx[-1] + 3600]; x[-2400:] *= np.linspace(1, 0, 2400)
    return x / np.sqrt(np.mean(x[np.abs(x) > 0.02] ** 2))
clips = []; quiz = []; t = 0.5
def put(text, kind, at, speed=0.95):
    x = say(text, speed); clips.append((at, x)); ph = {"t0": round(at, 3), "t1": round(at + len(x) / SR, 3), "text": text, "who": kind}; phrases.append(ph); print(ph); return ph
phrases = []
WAIT = float(Q.get("wait", 3)); t = 0.4
# intro : une ou plusieurs phrases, lues plus lentement (demande de l'utilisateur : « trop rapide »), avec un silence entre elles
if Q.get("intro"):
    for k, line in enumerate(Q["intro"] if isinstance(Q["intro"], list) else [Q["intro"]]):
        it = put(line, "intro", t, Q.get("intro_speed", 0.75)); t = it["t1"] + 0.6
    t += 0.2
LEVELS = Q.get("levels", []); prev = None
for n, q in enumerate(Q["questions"]):
    lv = None
    # niveaux (facile, normal, difficile, impossible) : une annonce parlée avant la première question de chaque niveau
    if "level" in q and q["level"] != prev:
        lp = put(f"Niveau {LEVELS[q['level']]} !", "level", t, 0.85); lv = [lp["t0"], lp["t1"], q["level"]]; t = lp["t1"] + 1.2; prev = q["level"]
    qp = put(q["q"], "q", t)
    c0 = qp["t1"] + 0.15; c1 = c0 + WAIT
    rp = put(q["say"], "r", c1 + 0.15)
    quiz.append({"q0": qp["t0"], "q1": qp["t1"], "a0": qp["t0"], "a1": qp["t1"], "c0": round(c0, 3), "c1": round(c1, 3), "r0": rp["t0"], "r1": rp["t1"], "end": round(rp["t1"] + 0.3, 3), "lv": lv, "level": q.get("level")})
    t = rp["t1"] + 0.3
op = put(Q["outro"], "outro", t, Q.get("outro_speed", 0.85)); dur = round(op["t1"] + (1.5 if len(Q["outro"].split()) > 3 else 0.4), 2)
N = int(dur * SR); vo = np.zeros(N)
for at, x in clips: k = int(at * SR); vo[k:k + len(x)] += x[: N - k]
vo *= 0.7 / np.max(np.abs(vo)); (FILM / "audio").mkdir(parents=True, exist_ok=True); sf.write(FILM / "audio" / "vo.wav", np.stack([vo, vo], 1), SR)
fr = SR // 60; e = np.sqrt(np.convolve(vo ** 2, np.ones(fr * 2) / (fr * 2), mode="same"))[::fr]; e = np.clip(e / (np.percentile(e[e > 0.01], 90) + 1e-9), 0, 1)
(FILM / "timeline.js").write_text("export const TL = " + json.dumps({"phrases": phrases, "env": [round(float(v), 2) for v in e], "quiz": quiz, "dur": dur, "data": Q}, ensure_ascii=False) + ";\n")
f = json.loads((FILM / "film.json").read_text()); f["duration"] = dur; (FILM / "film.json").write_text(json.dumps(f, indent=1))
beats = [k * 0.5 for k in range(int(dur * 2) + 1)]
(FILM / "beats.json").write_text(json.dumps({"bpm": 120, "period": 0.5, "offset": 0, "beats": beats, "downbeats": beats[::4], "sections": [{"name": "main", "beat": 0}], "duration": dur}))
print("durée :", dur, "s ; mots mal entendus dans :", VERIF["restent"])
