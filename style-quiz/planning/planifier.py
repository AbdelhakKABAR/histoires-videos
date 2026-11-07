# Programme du jour (demande de l'utilisateur, 5 nov. 2026 — remplace celle du 3 nov.) :
# 10 vidéos par jour, une toutes les 2 heures à heure pile, à partir de 6 h (6 h, 8 h, … 22 h, puis 0 h) — 2 h et 4 h retirées
# (demande du 5 nov. au soir). Ordre des types tiré au hasard chaque jour. Le fichier d'une date contient 00:00, 06:00, 08:00 … 22:00.
#   python3 planifier.py                -> crée (si absent) et affiche le programme du jour : planning/AAAA-MM-JJ.json
#   python3 planifier.py a-faire        -> les vidéos en retard du jour (retard: true), puis celle de l heure suivante (ex. lancé à 16 h 20 -> créneau jusqu à 17 h 59), pas encore faites
#   python3 planifier.py fait <heure HH:MM> <fichier>   -> marque la vidéo comme faite
import json, sys, random, datetime, pathlib, zoneinfo
TZ = zoneinfo.ZoneInfo("Europe/Paris")
import os
now = datetime.datetime.fromisoformat(os.environ["PLANIF_NOW"]).replace(tzinfo=TZ) if os.environ.get("PLANIF_NOW") else datetime.datetime.now(TZ)   # PLANIF_NOW : tests seulement
D = pathlib.Path(__file__).parent
cible = now + datetime.timedelta(hours=1)          # créneau visé : l'heure suivante (lancé à 23 h 20 -> 0 h du lendemain)
jour = cible if (len(sys.argv) > 1 and sys.argv[1] in ("a-faire", "fait")) else now
F = D / f"{jour:%Y-%m-%d}.json"
# 7 nov. 2026 (demande de l'utilisateur : « fais des choses pro ») : 4 défis par jour (les vidéos qui font le plus de vues),
# lettre et intrus (les plus faibles) une fois par jour.
POOL = ["france"] * 2 + ["monde"] * 2 + ["intrus", "lettre"] + ["mot"] * 2 + ["logique"] * 2

def creer():
    r = random.SystemRandom()
    hs = [0] + list(range(6, 24, 2)); n = len(hs)   # 10 créneaux à heure pile : 0 h, puis 6 h … 22 h
    for _ in range(10000):
        types = r.sample(POOL, n)
        if all(a != b for a, b in zip(types, types[1:])): break
    plan = {"date": f"{jour:%Y-%m-%d}", "videos": [{"heure": f"{h:02d}:00", "type": ty, "fait": None} for h, ty in zip(hs, types)]}
    F.write_text(json.dumps(plan, ensure_ascii=False, indent=1)); return plan

plan = json.loads(F.read_text()) if F.exists() else creer()
cmd = sys.argv[1] if len(sys.argv) > 1 else ""
if cmd == "a-faire":
    # Rattrapage (demande de l'utilisateur, 4 nov. 2026) : d'abord les vidéos du jour déjà passées et pas faites
    # (à envoyer tout de suite), puis celle de l'heure suivante.
    def mn(v): return int(v["heure"][:2]) * 60 + int(v["heure"][3:])
    if cible.date() != now.date():          # 23 h 20 : seul le créneau de 0 h du lendemain compte
        retard = []; t = 0
    else:
        t = now.hour * 60 + now.minute
        retard = [dict(v, retard=True) for v in plan["videos"] if not v["fait"] and mn(v) < t]
    suivante = [v for v in plan["videos"] if not v["fait"] and mn(v) >= t and int(v["heure"][:2]) <= cible.hour]
    print(json.dumps(retard + suivante, ensure_ascii=False))
elif cmd == "fait":
    for v in plan["videos"]:
        if v["heure"] == sys.argv[2]: v["fait"] = sys.argv[3]
    F.write_text(json.dumps(plan, ensure_ascii=False, indent=1)); print("ok")
else:
    print(json.dumps(plan, ensure_ascii=False, indent=1))
