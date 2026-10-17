"""Fabrique une vidéo « jeu » (course de billes) à partir d'un fichier de config.
   python3 faire_jeu.py <jeu.json> <sortie.mp4>
   Choisit tout seul une graine qui donne une course à suspense (changements de tête, vainqueur tardif)."""
import json, os, random, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); os.chdir(HERE)
import sim
cfg_path, out = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])
n = len(json.load(open(cfg_path))["participants"])
rng = random.Random()
best = None
for _ in range(80):
    seed = rng.randrange(10**6)
    r = sim.simulate(n, seed)
    fr, fy = r["frames"], r["finish_y"]
    first = next((i for i, x in enumerate(fr) if any(p[1] > fy for p in x["balls"])), None)
    if first is None: continue
    lead = [max(range(n), key=lambda i: x["balls"][i][1]) for x in fr[:first]]
    ch = sum(1 for a, b in zip(lead, lead[1:]) if a != b)
    late = lead[int(first * 0.75)] != r["order"][0]
    sc = ch + (8 if late else 0) - 3 * abs(first / 30 - 33) / 3
    if 26 <= first / 30 <= 40 and (best is None or sc > best[0]):
        best = (sc, seed)
    if best and best[0] > 14: break
seed = best[1]
subprocess.run(["python3", "render.py", str(seed), "x", cfg_path], check=True)
subprocess.run(["python3", "audio.py"], check=True)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", "video_muet.mp4", "-i", "son.wav", "-af",
                "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
                "-shortest", "-movflags", "+faststart", out], check=True)
m = json.load(open("meta.json"))
print(json.dumps({"video": out, "seed": seed, "vainqueur": m["winner"], "podium": m["podium"]}, ensure_ascii=False))
