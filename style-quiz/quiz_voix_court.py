# /// script
# requires-python = ">=3.10"
# dependencies = ["sherpa-onnx<2", "numpy", "soundfile", "scipy"]
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
_CACHE = {}
def say(text, speed=0.95):
    if (text, speed) in _CACHE: return _CACHE[(text, speed)]
    a = narrate(text, speed); x = resample_poly(np.asarray(a.samples, dtype=np.float64), SR, a.sample_rate)
    idx = np.where(np.abs(x) > 0.02 * np.max(np.abs(x)))[0]; x = x[max(idx[0] - 480, 0): idx[-1] + 3600]; x[-2400:] *= np.linspace(1, 0, 2400)
    x = x / np.sqrt(np.mean(x[np.abs(x) > 0.02] ** 2)); _CACHE[(text, speed)] = x; return x
clips = []; quiz = []; t = 0.5
def put(text, kind, at, speed=0.95):
    x = say(text, speed); clips.append((at, x)); ph = {"t0": round(at, 3), "t1": round(at + len(x) / SR, 3), "text": text, "who": kind}; phrases.append(ph); print(ph); return ph
# Durée maximale (demande de l'utilisateur, 4 nov. 2026) : 90 s au plus, viser 85 s -> "max_duration" (85 par défaut).
# Si l'épisode est trop long, on retire des questions (dans le niveau qui en a le plus, en gardant chaque niveau) jusqu'à tenir.
MAXD = float(Q.get("max_duration", 85)); ALLQ = list(Q["questions"])
def layout(QS):
    global clips, quiz, phrases
    clips = []; quiz = []
    phrases = []
    WAIT = float(Q.get("wait", 3)); t = 0.4
    # accroche (5 nov. 2026, demande de l'utilisateur : « plus de vues ») : phrase choc dite dès la 1re seconde
    # et écrite en grand à l'écran (champ "accroche" affiché, "accroche_dite" lue si différente).
    global HOOK; HOOK = None
    if Q.get("accroche"):
        hp = put(Q.get("accroche_dite", Q["accroche"]), "accroche", 0.12, Q.get("accroche_speed", 1.0)); HOOK = [hp["t0"], hp["t1"]]; t = hp["t1"] + 0.35
    # intro : une ou plusieurs phrases, lues plus lentement (demande de l'utilisateur : « trop rapide »), avec un silence entre elles
    if Q.get("intro"):
        for k, line in enumerate(Q["intro"] if isinstance(Q["intro"], list) else [Q["intro"]]):
            it = put(line, "intro", t, Q.get("intro_speed", 0.75)); t = it["t1"] + 0.6
        t += 0.2
    LEVELS = Q.get("levels", []); prev = None
    # "skip_first_level": pas d'annonce « Niveau facile » au début : la vidéo démarre directement sur la 1re question
    if Q.get("skip_first_level") and QS and "level" in QS[0]: prev = QS[0]["level"]; t = t if (Q.get("intro") or Q.get("accroche")) else 0.25
    for n, q in enumerate(QS):
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
    return dur
QS = list(ALLQ); dur = layout(QS)
while dur > MAXD and len(QS) > 4:
    cnt = {}
    for q in QS: cnt[q.get("level", 0)] = cnt.get(q.get("level", 0), 0) + 1
    big = max(cnt, key=lambda k: (cnt[k], -k))
    if cnt[big] < 2 and len(cnt) > 1: break
    QS.remove([q for q in QS if q.get("level", 0) == big][-1]); dur = layout(QS)
if len(QS) < len(ALLQ): print(f"trop long : {len(ALLQ)} -> {len(QS)} questions pour tenir en {MAXD:.0f} s")
Q = dict(Q, questions=QS)
if HOOK: Q["_hook"] = HOOK
N = int(dur * SR); vo = np.zeros(N)
for at, x in clips: k = int(at * SR); vo[k:k + len(x)] += x[: N - k]
vo *= 0.7 / np.max(np.abs(vo)); (FILM / "audio").mkdir(parents=True, exist_ok=True); sf.write(FILM / "audio" / "vo.wav", np.stack([vo, vo], 1), SR)
fr = SR // 60; e = np.sqrt(np.convolve(vo ** 2, np.ones(fr * 2) / (fr * 2), mode="same"))[::fr]; e = np.clip(e / (np.percentile(e[e > 0.01], 90) + 1e-9), 0, 1)
(FILM / "timeline.js").write_text("export const TL = " + json.dumps({"phrases": phrases, "env": [round(float(v), 2) for v in e], "quiz": quiz, "dur": dur, "data": Q}, ensure_ascii=False) + ";\n")
f = json.loads((FILM / "film.json").read_text()); f["duration"] = dur; (FILM / "film.json").write_text(json.dumps(f, indent=1))
beats = [k * 0.5 for k in range(int(dur * 2) + 1)]
(FILM / "beats.json").write_text(json.dumps({"bpm": 120, "period": 0.5, "offset": 0, "beats": beats, "downbeats": beats[::4], "sections": [{"name": "main", "beat": 0}], "duration": dur}))
print("durée :", dur, "s ; mots mal entendus dans :", VERIF["restent"])
