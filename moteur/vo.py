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
# Deux voix choisies par l'utilisateur (oct. 2026), en alternance d'une vidéo à l'autre :
#  - homme : fr_FR-upmc-medium, locuteur 1, lecture posée, débit fixe, sans effet, vraies pauses
#  - femme : fr_FR-siwis-medium, la voix d'origine (débit lent par phrase, timbre adouci)
# Quel que soit le dossier passé en argument, vo.py choisit et télécharge la voix lui-même. Forcer : VOIX=homme ou VOIX=femme.
import os, datetime, subprocess
from zoneinfo import ZoneInfo
now = datetime.datetime.now(ZoneInfo("Europe/Paris"))
slot = 0 if now.hour < 10 else 1 if now.hour < 14 else 2 if now.hour < 18 else 3
# 9 oct. 2026 : l'utilisateur a choisi la « voix H » comme conteur de TOUTES les vidéos : Supertonic 2, locuteur 7, en français,
# lecture lente (0.85). Licence OpenRAIL-M (usage commercial permis). Les anciennes restent accessibles : VOIX=homme, VOIX=femme ou VOIX=conteur11.
WHO = os.environ.get("VOIX") or "conteurH"
SUPER = "sherpa-onnx-supertonic-tts-int8-2026-03-06"
PROF = {"conteurH": dict(voice=SUPER, sid=7, speed=0.8, lo=0.74, hi=0.84, ns=0, nw=0, gap=1.0, fx="highpass=f=70,alimiter=limit=0.8"),
        "conteur11": dict(voice="vits-mms-fra", sid=0, speed=0.9, lo=0.84, hi=0.96, ns=0.55, nw=0.75, gap=1.0, fx="highpass=f=70,alimiter=limit=0.8"),
        "homme": dict(voice="vits-piper-fr_FR-upmc-medium", sid=1, speed=0.88, lo=0.85, hi=0.95, ns=0.5, nw=0.7, gap=1.25, fx="highpass=f=70,alimiter=limit=0.8"),
        "femme": dict(voice="vits-piper-fr_FR-siwis-medium", sid=0, speed=float(sys.argv[3]) if len(sys.argv) > 3 else 0.86, lo=0.74, hi=1.0, ns=0.6, nw=0.9, gap=0.75,
                      fx="equalizer=f=210:t=q:w=1.1:g=2.5,equalizer=f=3400:t=q:w=1.4:g=-2,highshelf=f=7000:g=-3.5,aecho=0.9:0.5:38|61:0.10|0.06,alimiter=limit=0.8")}[WHO]
print("voix :", WHO)
MODEL = MODEL.parent / PROF["voice"]
if not MODEL.exists():
    subprocess.run(f"curl -sSL https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/{PROF['voice']}.tar.bz2 | tar xj -C '{MODEL.parent}'", shell=True, check=True)
SID, SPEED = PROF["sid"], PROF["speed"]
def supertonic(d):
    f = lambda n: str(d / n)
    return sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(supertonic=sherpa_onnx.OfflineTtsSupertonicModelConfig(
        duration_predictor=f("duration_predictor.int8.onnx"), text_encoder=f("text_encoder.int8.onnx"), vector_estimator=f("vector_estimator.int8.onnx"),
        vocoder=f("vocoder.int8.onnx"), tts_json=f("tts.json"), unicode_indexer=f("unicode_indexer.bin"), voice_style=f("voice.bin")), num_threads=4)))
# --- Contrôle de la voix du conteur (demande de l'utilisateur, 10-11 oct. 2026) -------------------------------------------
# Il reprochait à la voix H d'oublier des mots, de parler trop vite et de ne pas marquer les virgules. Mesuré : elle saute
# un mot dans une phrase sur sept environ, et le résultat change d'une prise à l'autre. Donc :
#   1. chaque phrase est coupée à la ponctuation (, ; :) en morceaux d'au moins 4 mots, avec un vrai silence entre eux ;
#   2. chaque morceau est dit jusqu'à 5 fois, réécouté par reconnaissance vocale (Whisper), et on garde la première prise
#      où aucun mot ne manque (sinon la meilleure) ;
#   3. débit ralenti (0.8).
import re, unicodedata, difflib
class Take:
    def __init__(self, samples, sample_rate): self.samples, self.sample_rate = samples, sample_rate
_asr = None
def asr_engine():
    global _asr
    if _asr is None:
        d = MODEL.parent / "sherpa-onnx-whisper-small"
        try:
            if not d.exists():
                subprocess.run(f"curl -sSL --fail https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-small.tar.bz2 | tar xj -C '{MODEL.parent}'", shell=True, check=True)
            _asr = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=str(d / "small-encoder.int8.onnx"), decoder=str(d / "small-decoder.int8.onnx"), tokens=str(d / "small-tokens.txt"), language="fr", task="transcribe", num_threads=4)
        except Exception as e:
            print("ATTENTION : contrôle des mots indisponible (", str(e)[:80], ") - prises non vérifiées"); _asr = False
    return _asr
def words(t):
    t = unicodedata.normalize("NFD", t.lower().replace("œ", "oe").replace("’", "'")); t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9 ]", " ", t).split()
def missing(text, x, sr):
    """Nombre de mots du texte que la reconnaissance vocale n'entend pas dans la prise."""
    rec = asr_engine()
    if not rec: return 0
    st = rec.create_stream(); st.accept_waveform(16000, resample_poly(np.asarray(x, dtype=np.float64), 16000, sr).astype(np.float32)); rec.decode_stream(st)
    ref, hyp = words(text), words(st.result.text); ops = difflib.SequenceMatcher(None, ref, hyp).get_opcodes()
    return sum(i2 - i1 for t, i1, i2, j1, j2 in ops if t == "delete") + sum(max(0, (i2 - i1) - (j2 - j1)) for t, i1, i2, j1, j2 in ops if t == "replace")
def chunks(text):
    """Coupe à la ponctuation en gardant des morceaux d'au moins 4 mots : [(morceau, silence après en s), ...]."""
    parts = [p for p in re.split(r"(?<=[,;:])\s+", text.strip()) if p]; out = []
    for p in parts:
        if out and (len(out[-1].split()) < 4 or len(p.split()) < 4): out[-1] += " " + p
        else: out.append(p)
    return [(c, 0.0 if i == len(out) - 1 else 0.36 if c.rstrip()[-1] in ";:" else 0.2) for i, c in enumerate(out)]
VERIF = {"prises": 0, "refaites": 0, "restent": []}
def narrate(text, speed):
    """Le conteur : renvoie l'audio généré (samples, sample_rate), quel que soit le moteur."""
    if PROF["voice"] != SUPER: return tts.generate(text, sid=SID, speed=speed)
    out = []; sr = 44100
    for part, pause in chunks(text):
        best = None
        for k in range(5 if len(part.split()) > 5 else 3):   # les très courts morceaux trompent souvent la reconnaissance : 3 essais suffisent
            g = sherpa_onnx.GenerationConfig(); g.sid = SID; g.speed = speed; g.num_steps = 10 if k < 3 else 16; g.extra = {"lang": "fr"}
            a = tts.generate(part, g); x = np.asarray(a.samples, dtype=np.float64); sr = a.sample_rate; m = missing(part, x, sr); VERIF["prises"] += 1
            if best is None or m < best[0]: best = (m, x)
            if m == 0: break
            VERIF["refaites"] += 1
        if best[0]: VERIF["restent"].append(part)
        x = best[1]; idx = np.where(np.abs(x) > 0.02 * np.max(np.abs(x)))[0]
        if len(idx): x = x[max(idx[0] - 400, 0): idx[-1] + 1800]
        out += [x, np.zeros(int(sr * pause))]
    return Take(np.concatenate(out), sr)
onnx = None if PROF["voice"] == SUPER else next(MODEL.glob("*.onnx"))
tts = supertonic(MODEL) if PROF["voice"] == SUPER else sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
    vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=str(onnx), tokens=str(MODEL / "tokens.txt"), data_dir=str(MODEL / "espeak-ng-data") if (MODEL / "espeak-ng-data").exists() else "", noise_scale=PROF["ns"], noise_scale_w=PROF["nw"]), num_threads=4)))
SR = 48000


# Voix des personnages (demande de l'utilisateur, 7 oct. 2026) : chaque réplique de story.json peut porter
# "voice" : "homme", "femme", "garcon", "fille", "papi" ou "mamie". Sans "voice", c'est la voix du conteur.
# Les voix d'enfants et de grands-parents sont obtenues en changeant la hauteur d'une voix de base (r > 1 = plus aigu).
CAST = {"homme": ("vits-piper-fr_FR-upmc-medium", 1, 1.0, 0.92), "femme": ("vits-piper-fr_FR-siwis-medium", 0, 1.0, 0.9),
        "garcon": ("vits-piper-fr_FR-upmc-medium", 0, 1.15, 0.95), "fille": ("vits-piper-fr_FR-siwis-medium", 0, 1.24, 0.95),
        "papi": ("vits-piper-fr_FR-upmc-medium", 1, 0.93, 0.86), "mamie": ("vits-piper-fr_FR-siwis-medium", 0, 0.92, 0.84)}
ENG = {PROF["voice"]: tts}
def engine(voice):
    if voice not in ENG:
        d = MODEL.parent / voice
        if not d.exists():
            subprocess.run(f"curl -sSL https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/{voice}.tar.bz2 | tar xj -C '{d.parent}'", shell=True, check=True)
        ENG[voice] = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
            vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=str(next(d.glob("*.onnx"))), tokens=str(d / "tokens.txt"), data_dir=str(d / "espeak-ng-data") if (d / "espeak-ng-data").exists() else "", noise_scale=0.6, noise_scale_w=0.8), num_threads=4)))
    return ENG[voice]


def take(ph):
    text = ph["t"]
    spoken = text.replace("«", "").replace("»", "").strip()
    v = ph.get("voice")
    if v in CAST:
        voice, sid, r, sp = CAST[v]
        a = engine(voice).generate(spoken, sid=sid, speed=sp / r)   # dit plus lentement, puis accéléré de r : la hauteur change, pas le débit
        x = resample_poly(np.asarray(a.samples, dtype=np.float64), SR, a.sample_rate)
        x = np.interp(np.arange(0, len(x) - 1, r), np.arange(len(x)), x)
        x *= 0.25 / (np.sqrt(np.mean(x[np.abs(x) > 0.02] ** 2)) + 1e-9) * NARR_RMS / 0.25
    else:
        a = narrate(spoken, max(PROF["lo"], min(PROF["hi"], ph.get("speed", SPEED) + (0 if PROF["voice"] != SUPER or "speed" not in ph else -0.04))))
        x = resample_poly(np.asarray(a.samples, dtype=np.float64), SR, a.sample_rate)
    idx = np.where(np.abs(x) > 0.02)[0]; x = x[max(idx[0] - 480, 0): idx[-1] + 3600]
    x[-2400:] *= np.linspace(1, 0, 2400)
    return x


_a = narrate("Il était une fois une histoire.", SPEED)
_r = resample_poly(np.asarray(_a.samples, dtype=np.float64), SR, _a.sample_rate)
NARR_RMS = float(np.sqrt(np.mean(_r[np.abs(_r) > 0.02] ** 2)))   # les personnages parlent aussi fort que le conteur
takes = [[take(t) for t in ph] for _, ph in SCENES]
LEAD, GAP, TAIL, END = 1.5, PROF["gap"], 2.0, 0   # beats: before 1st phrase, between phrases, after last; END = moral card
need = sum(LEAD + TAIL + sum(len(x) / SR / P for x in tk) + sum(q.get("pre", GAP) for q in ph[1:]) for (_, ph), tk in zip(SCENES, takes))
total = dur / P
slack = total - END - need
print(f"speech needs {need:.1f} beats of {total - END:.0f}; slack {slack:.1f} beats")
assert slack >= 0, "histoire trop longue : raccourcis le texte de story.json (vise 180 à 210 mots), ne change pas la vitesse"
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
        phrases.append({"scene": sid, "u0": round(c, 2), "u1": round(e, 2), "text": text, "who": q.get("who", ""), "voice": q.get("voice", "")}); c = e
    u = total - END if k == len(SCENES) - 1 else float(round(c + TAIL + extra))
    scenes.append({"id": sid, "u0": u0, "u1": u}); print(f"{sid:<11} {u0:6.1f}-{u:6.1f}  ({(u - u0) * P:4.1f}s)")
out *= 0.7 / np.max(np.abs(out))
sf.write(FILM / "audio" / "vo_raw.wav", np.stack([out, out], 1), SR)
# voix naturelle, sans effet
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(FILM / "audio" / "vo_raw.wav"), "-af",
                PROF["fx"],
                str(FILM / "audio" / "vo.wav")], check=True)
fr = SR // 60
envv = np.sqrt(np.convolve(out ** 2, np.ones(fr * 2) / (fr * 2), mode="same"))[::fr]
envv = np.clip(envv / (np.percentile(envv[envv > 0.01], 90) + 1e-9), 0, 1)
tl = {"scenes": scenes, "phrases": phrases, "env": [round(float(v), 2) for v in envv]}
(FILM / "timeline.json").write_text(json.dumps(tl, ensure_ascii=False, indent=1))
(FILM / "timeline.js").write_text("export const TL = " + json.dumps(tl, ensure_ascii=False) + ";\n")

if PROF["voice"] == SUPER:
    print(f"contrôle des mots du conteur : {VERIF['prises']} prises, {VERIF['refaites']} refaites, {len(VERIF['restent'])} morceaux encore imparfaits")
    for r in VERIF["restent"]: print("   à réécrire plus simplement si possible :", r)
