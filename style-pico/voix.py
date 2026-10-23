# /// script
# requires-python = ">=3.10"
# dependencies = ["sherpa-onnx<2", "numpy", "soundfile", "scipy"]
# ///
"""Voix d'une partie du film : uv run voix.py <partie> <dossier des voix> [3|7]
story.json = [{"t": texte, "voice": "conteur" | "garcon" | "fille" | "homme" | "femme", "who": "" ou nom du personnage, "at": seconde de départ}, ...]
Conteur = voix 3 ou 7 (3e argument) lente, vérifiée mot à mot (fonctions de moteur/vo.py) ; personnages = voix piper. -> audio/vo.wav + timeline.js (phrases + enveloppe des bouches).
Le script affiche t0/t1 de chaque phrase : règle les "at" pour qu'aucune phrase n'en chevauche une autre, puis relance."""
import json, subprocess, sys
from pathlib import Path
import numpy as np, soundfile as sf, sherpa_onnx
from scipy.signal import resample_poly
FILM = Path(sys.argv[1]); VD = Path(sys.argv[2]).resolve(); SR = 48000
src = (Path(__file__).resolve().parent.parent / "moteur" / "vo.py").read_text()   # le conteur vérifié (voix H) vient de moteur/vo.py
SUPER = "sherpa-onnx-supertonic-tts-int8-2026-03-06"; MODEL = VD / SUPER; PROF = {"voice": SUPER}
# Conteur (choix de l'utilisateur du 12 oct. 2026) : voix 3 (Supertonic 2, femme) quand l'héroïne est une fille,
# voix 7 (Supertonic 6, homme) quand le héros est un garçon. 3e argument : 3 ou 7 (par défaut 3).
NARR = sys.argv[3] if len(sys.argv) > 3 else "3"; SID = {"3": 2, "7": 6}[NARR]
# Personnages = voix d'ENFANTS (demande de l'utilisateur du 12 oct. 2026) : une voix Supertonic dite plus lentement puis
# accélérée d'un facteur r. Mesuré le 12 oct. 2026 (reconnaissance vocale sur 58 mots) : monter la hauteur rend les mots flous
# (9 à 13 mots perdus), alors que les deux voix les plus claires et les plus jeunes, sans changement et coupées à chaque
# ! ? . , n'en perdent que 2 ou 3. Donc : fille = Supertonic 1, garcon = Supertonic 0, r = 1 (pas de changement de hauteur),
# débit 0.75 (plus lent que le conteur : « trop rapide, on ne comprend pas »), un silence après chaque morceau, et chaque
# morceau réécouté par Whisper jusqu'à 5 prises : on garde la première où aucun mot ne manque.
SUPCAST = {"fille": (1, 1.0, 0.75), "garcon": (0, 1.0, 0.75)}
def child(text, sid, r, sp):
    out = []; sr = 44100
    for part in [p for p in re.split(r"(?<=[!?.,;:])\s+", text.strip()) if p]:
        pause = 0.3; best = None
        for k in range(5):
            g = sherpa_onnx.GenerationConfig(); g.sid = sid; g.speed = sp / r; g.num_steps = 16; g.extra = {"lang": "fr"}
            a = tts.generate(part, g); x = np.asarray(a.samples, dtype=np.float64); sr = a.sample_rate
            x = np.interp(np.arange(0, len(x) - 1, r), np.arange(len(x)), x); m = missing(part, x, sr); VERIF["prises"] += 1
            if best is None or m < best[0]: best = (m, x)
            if m == 0: break
            VERIF["refaites"] += 1
        if best[0]: VERIF["restent"].append(part)
        x = best[1]; idx = np.where(np.abs(x) > 0.02 * np.max(np.abs(x)))[0]
        if len(idx): x = x[max(idx[0] - 400, 0): idx[-1] + 1800]
        out += [x, np.zeros(int(sr * pause))]
    return np.concatenate(out), sr
CAST = {
        "homme": ("vits-piper-fr_FR-upmc-medium", 1, 1.0, 0.92), "femme": ("vits-piper-fr_FR-siwis-medium", 0, 1.0, 0.9)}
for name in [SUPER] + sorted({v[0] for v in CAST.values()}):
    if not (VD / name).exists():
        VD.mkdir(parents=True, exist_ok=True); subprocess.run(f"curl -sSL --fail https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/{name}.tar.bz2 | tar xj -C '{VD}'", shell=True, check=True)
i = src.index("def supertonic(d):"); j = src.index("onnx = None if PROF")
exec(src[i:j]); tts = supertonic(MODEL)
def piper(v):
    d = VD / v
    return sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=str(next(d.glob("*.onnx"))), tokens=str(d / "tokens.txt"), data_dir=str(d / "espeak-ng-data"), noise_scale=0.6, noise_scale_w=0.8), num_threads=2)))
dur = json.loads((FILM / "film.json").read_text())["duration"]; N = int(dur * SR); vo = np.zeros(N); phrases = []; ref = None
for ln in json.loads((FILM / "story.json").read_text()):
    if ln["voice"] == "conteur": a = narrate(ln["t"], 0.82); x = resample_poly(np.asarray(a.samples, dtype=np.float64), SR, a.sample_rate)
    elif ln["voice"] in SUPCAST:
        x, sr0 = child(ln["t"], *SUPCAST[ln["voice"]]); x = resample_poly(x, SR, sr0)
    else:
        v, sid, r, sp = CAST[ln["voice"]]; a = piper(v).generate(ln["t"], sid=sid, speed=sp / r)
        x = resample_poly(np.asarray(a.samples, dtype=np.float64), SR, a.sample_rate); x = np.interp(np.arange(0, len(x) - 1, r), np.arange(len(x)), x)
    idx = np.where(np.abs(x) > 0.02 * np.max(np.abs(x)))[0]; x = x[max(idx[0] - 480, 0): idx[-1] + 3600]; x[-2400:] *= np.linspace(1, 0, 2400)
    rms = float(np.sqrt(np.mean(x[np.abs(x) > 0.02] ** 2))); ref = ref or rms; x *= ref / rms
    k = int(ln["at"] * SR); x = x[: N - k]; vo[k:k + len(x)] += x
    phrases.append({"t0": ln["at"], "t1": round(ln["at"] + len(x) / SR, 3), "text": ln["t"], "who": ln["who"]}); print(phrases[-1])
vo *= 0.7 / np.max(np.abs(vo)); sf.write(FILM / "audio" / "vo.wav", np.stack([vo, vo], 1), SR)
fr = SR // 60; e = np.sqrt(np.convolve(vo ** 2, np.ones(fr * 2) / (fr * 2), mode="same"))[::fr]; e = np.clip(e / (np.percentile(e[e > 0.01], 90) + 1e-9), 0, 1)
(FILM / "timeline.js").write_text("export const TL = " + json.dumps({"phrases": phrases, "env": [round(float(v), 2) for v in e]}, ensure_ascii=False) + ";\n")
for p, q in zip(phrases, phrases[1:]):
    if q["t0"] < p["t1"] + 0.25: print("ATTENTION : chevauchement, recule le \"at\" de :", q["text"])
if phrases[-1]["t1"] > dur - 0.4: print("ATTENTION : la dernière phrase dépasse la fin de la partie")
print("contrôle des mots du conteur :", VERIF["prises"], "prises,", VERIF["refaites"], "refaites ; morceaux encore imparfaits :", VERIF["restent"])
