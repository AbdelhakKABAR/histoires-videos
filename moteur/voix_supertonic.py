"""Voix des quiz et des défis (11 nov. 2026, choix de l'utilisateur après écoute du comparatif) :
Supertonic (sherpa-onnx), voix 5, 6, 13 et 14 du comparatif = sid 0, 1, 8 et 9. Chaque vidéo prend UNE de ces voix, à tour de rôle.
   from voix_supertonic import choisir_sid, parler
   sid = choisir_sid(D)          # "voix_sid" dans le JSON pour forcer, sinon rotation (programme du jour)
   x, sr = parler(texte, vitesse, sid)
Chaque morceau est contrôlé par reconnaissance vocale (whisper) et refait si des mots manquent."""
import datetime, difflib, json, os, re, subprocess, unicodedata, zoneinfo
from pathlib import Path
import numpy as np
from scipy.signal import resample_poly
import sherpa_onnx

ROTATION = [0, 1, 8, 9]          # voix 5, 6, 13, 14 du comparatif
ACCEL = 1.12                     # Supertonic parle ≈ 15 % plus lentement que siwis : on accélère pour garder les quiz à ≈ 70 s
VD = Path.home() / "voix"; SUPER = "sherpa-onnx-supertonic-tts-int8-2026-03-06"
VERIF = {"prises": 0, "refaites": 0, "restent": []}
_tts = None; _asr = None


def choisir_sid(D=None):
    """sid forcé par "voix_sid", sinon voix suivante de la rotation : (jour × 6 + vidéos déjà faites aujourd'hui) modulo 4,
    pour que deux vidéos qui se suivent n'aient jamais la même voix."""
    if D and "voix_sid" in D: return int(D["voix_sid"])
    now = datetime.datetime.now(zoneinfo.ZoneInfo("Europe/Paris")) + datetime.timedelta(hours=1)
    f = Path(__file__).resolve().parent.parent / "style-quiz" / "planning" / f"{now:%Y-%m-%d}.json"
    faites = 0
    try: faites = sum(1 for v in json.loads(f.read_text())["videos"] if v.get("fait"))
    except Exception: pass
    return ROTATION[(now.date().toordinal() * 6 + faites) % len(ROTATION)]


def _engine():
    global _tts
    if _tts is None:
        d = VD / SUPER
        if not d.exists():
            VD.mkdir(parents=True, exist_ok=True)
            subprocess.run(f"curl -sSL --fail https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/{SUPER}.tar.bz2 | tar xj -C '{VD}'", shell=True, check=True)
        f = lambda n: str(d / n)
        _tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(supertonic=sherpa_onnx.OfflineTtsSupertonicModelConfig(
            duration_predictor=f("duration_predictor.int8.onnx"), text_encoder=f("text_encoder.int8.onnx"), vector_estimator=f("vector_estimator.int8.onnx"),
            vocoder=f("vocoder.int8.onnx"), tts_json=f("tts.json"), unicode_indexer=f("unicode_indexer.bin"), voice_style=f("voice.bin")), num_threads=4)))
    return _tts


def _asr_engine():
    global _asr
    if _asr is None:
        d = VD / "sherpa-onnx-whisper-small"
        try:
            if not (d / "small-encoder.int8.onnx").exists():
                subprocess.run(f"curl -sSL --fail https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-small.tar.bz2 | tar xj -C '{VD}'", shell=True, check=True)
            _asr = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=str(d / "small-encoder.int8.onnx"), decoder=str(d / "small-decoder.int8.onnx"),
                                                              tokens=str(d / "small-tokens.txt"), language="fr", task="transcribe", num_threads=4)
        except Exception as e:
            print("ATTENTION : contrôle des mots indisponible (", str(e)[:80], ")"); _asr = False
    return _asr


def _words(t):
    t = unicodedata.normalize("NFD", t.lower().replace("œ", "oe").replace("’", "'")); t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9 ]", " ", t).split()


def _missing(text, x, sr):
    rec = _asr_engine()
    if not rec: return 0
    st = rec.create_stream(); st.accept_waveform(16000, resample_poly(x, 16000, sr).astype(np.float32)); rec.decode_stream(st)
    ref, hyp = _words(text), _words(st.result.text); ops = difflib.SequenceMatcher(None, ref, hyp).get_opcodes()
    return sum(i2 - i1 for t, i1, i2, j1, j2 in ops if t == "delete") + sum(max(0, (i2 - i1) - (j2 - j1)) for t, i1, i2, j1, j2 in ops if t == "replace")


def _chunks(text):
    parts = [p for p in re.split(r"(?<=[,;:.!?…])\s+", text.strip()) if p]; out = []
    for p in parts:
        if out and (len(out[-1].split()) < 4 or len(p.split()) < 4): out[-1] += " " + p
        else: out.append(p)
    return [(c, 0.0 if i == len(out) - 1 else 0.25 if c.rstrip()[-1] in ";:.!?…" else 0.12) for i, c in enumerate(out)]


def parler(text, speed=0.95, sid=0):
    """-> (samples float64, sample_rate). Coupe aux ponctuations, refait un morceau si la reconnaissance n'entend pas tous les mots."""
    tts = _engine(); out = []; sr = 44100
    for part, pause in _chunks(text):
        best = None
        for k in range(4 if len(part.split()) > 5 else 2):
            g = sherpa_onnx.GenerationConfig(); g.sid = sid; g.speed = speed * ACCEL; g.num_steps = 12 if k < 2 else 16; g.extra = {"lang": "fr"}
            a = tts.generate(part, g); x = np.asarray(a.samples, dtype=np.float64); sr = a.sample_rate; VERIF["prises"] += 1
            m = _missing(part, x, sr)
            if best is None or m < best[0]: best = (m, x)
            if m == 0: break
            VERIF["refaites"] += 1
        if best[0]: VERIF["restent"].append(part)
        x = best[1]; idx = np.where(np.abs(x) > 0.02 * np.max(np.abs(x)))[0]
        if len(idx): x = x[max(idx[0] - 400, 0): idx[-1] + 1800]
        out += [x, np.zeros(int(sr * pause))]
    return np.concatenate(out), sr
