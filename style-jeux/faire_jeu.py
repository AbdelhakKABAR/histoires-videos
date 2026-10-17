"""Fabrique une vidéo « jeu » (1080x1920) à partir d'un fichier de jeu.
   python3 faire_jeu.py <jeu.json> <sortie.mp4> [--mode course|cercle|arene] [--theme nom] [--seed N]
   Le mode et le thème viennent du fichier ("mode", "theme") ; absents ou "auto" → tirés au hasard."""
import argparse, json, os, random, subprocess, sys, time
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import badges, audio
from common import Painter, Encoder, W, H, FPS, ease
from themes import THEMES
from mode_course import Course
from mode_elim import Cercle, Arene

MODES = {"course": Course, "cercle": Cercle, "arene": Arene}
SOUS_TITRE = {"course": "Choisis le tien maintenant", "cercle": "Le dernier dans le cercle gagne",
              "arene": "Le dernier survivant gagne"}
INTRO, AFTER, OUTRO = 4.6, 2.0, 5.5

ap = argparse.ArgumentParser()
ap.add_argument("cfg"); ap.add_argument("out")
ap.add_argument("--mode"); ap.add_argument("--theme"); ap.add_argument("--seed", type=int)
a = ap.parse_args()
cfg = json.load(open(a.cfg)); out = os.path.abspath(a.out)
os.chdir(HERE)
rnd = random.Random(a.seed if a.seed is not None else time.time_ns())
HIST = os.path.join(HERE, "historique.json")
hist = json.load(open(HIST)) if os.path.exists(HIST) else []
mode = a.mode or cfg.get("mode", "auto")
if mode in (None, "auto"):       # jamais le même jeu que les 2 derniers
    recent = [h["mode"] for h in hist[-2:]]
    mode = rnd.choice([m for m in MODES if m not in recent] or list(MODES))
theme = a.theme or cfg.get("theme", "auto")
if theme in (None, "auto"):      # jamais un habillage parmi les 5 derniers
    recent = [h["theme"] for h in hist[-5:]]
    theme = rnd.choice([t for t in THEMES if t not in recent] or list(THEMES))
th = THEMES[theme]

bm = badges.build(cfg)
order = list(range(len(bm))); rnd.shuffle(order)          # placement de départ au hasard
parts = [dict(bm[j], img=f"badges/{j}.png", imgw=f"badges/{j}_w.png") for j in order]
n = len(parts)

# graine qui donne le plus de suspense
best = None
for _ in range(30 if mode == "course" else 24):
    s = rnd.randrange(10 ** 7)
    try:
        g = MODES[mode](n, s)
    except Exception as e:
        continue
    ok, sc, d = g.score()
    if ok and (best is None or sc > best[0]): best = (sc, s, g)
    if best and best[0] > 12: break
if best is None:
    raise SystemExit("Aucune partie valable trouvée")
game = best[2]

pt = Painter(th, parts, best[1])
main_n = min(game.nframes, game.decisive + int(AFTER * FPS))
n_in, n_out = int(INTRO * FPS), int(OUTRO * FPS)
enc = Encoder(os.path.join(HERE, "video_muet.mp4")); cr = enc.cr
cfg.setdefault("sous_titre", SOUS_TITRE[mode])
for gk in range(n_in + main_n + n_out):
    T = gk / FPS
    if gk < n_in:
        oy = game.camera(0) if mode != "course" else -700
        pt.background(cr, oy, T); game.draw(cr, pt, 0, oy, intro=True)
        pt.intro_overlay(cr, T, cfg, n)
    elif gk < n_in + main_n:
        k = gk - n_in; oy = game.camera(k); t = game.frames[k]["t"]
        pt.background(cr, oy, T); game.draw(cr, pt, k, oy)
        game.hud(cr, pt, k, ease(k / 15))
        if k < 25: pt.text(cr, "GO !", W / 2, 1100, 230 * (1 + k / 40), color=th["accent2"], a=1 - k / 25)
        if k >= game.decisive: pt.victory_flash(cr, k - game.decisive, "VICTOIRE !")
    else:
        e = (gk - n_in - main_n) / FPS; k = main_n - 1; oy = game.camera(k)
        pt.background(cr, oy, T); game.draw(cr, pt, k, oy, labels=False)
        pt.outro(cr, e, game.winner, game.final_rank, cfg, game.titre_fin)
    enc.push()
enc.close()

dur = (n_in + main_n + n_out) / FPS
info = audio.build("son.wav", dur + 0.3, INTRO, INTRO + game.decisive / FPS, INTRO + main_n / FPS,
                   game.audio_events(INTRO), best[1])
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", "video_muet.mp4", "-i", "son.wav", "-af",
                "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
                "-shortest", "-movflags", "+faststart", out], check=True)
for f in ("video_muet.mp4", "son.wav"):
    try: os.remove(f)
    except OSError: pass
res = {"video": out, "mode": mode, "theme": theme, "seed": best[1], "duree": round(dur, 1),
       "vainqueur": parts[game.winner]["nom"], "podium": [parts[i]["nom"] for i in game.final_rank[:3]],
       "sections": getattr(game, "sections", None), "musique": info}
hist.append({"date": time.strftime("%Y-%m-%d %H:%M"), "mode": mode, "theme": theme, "fichier": os.path.basename(a.cfg),
             "titre": cfg.get("titre1", "") + " " + cfg.get("titre2", ""), "vainqueur": res["vainqueur"],
             "sections": res["sections"]})
json.dump(hist[-300:], open(HIST, "w"), ensure_ascii=False, indent=1)
print(json.dumps(res, ensure_ascii=False))
