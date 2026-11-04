# Programme du jour au hasard (demande de l'utilisateur, 3 nov. 2026) :
# 9 à 12 vidéos par jour, entre 7 h et 23 h (heure de Paris), heures et ordre des types différents chaque jour.
#   python3 planifier.py                -> crée (si absent) et affiche le programme du jour : planning/AAAA-MM-JJ.json
#   python3 planifier.py a-faire        -> les vidéos en retard du jour (retard: true), puis celle de l heure suivante (ex. lancé à 16 h 20 -> créneau jusqu à 17 h 59), pas encore faites
#   python3 planifier.py fait <heure HH:MM> <fichier>   -> marque la vidéo comme faite
import json, sys, random, datetime, pathlib, zoneinfo
TZ = zoneinfo.ZoneInfo("Europe/Paris")
now = datetime.datetime.now(TZ)
D = pathlib.Path(__file__).parent
F = D / f"{now:%Y-%m-%d}.json"
POOL = ["france"] * 3 + ["monde"] * 3 + ["intrus"] * 2 + ["lettre"] * 2 + ["mot", "logique"]

def creer():
    r = random.SystemRandom()
    first = max(7, now.hour + 1)             # créé en cours de journée : seulement les heures à venir
    hours = list(range(first, 23))           # créneaux 7 h ... 22 h (dernière vidéo avant 23 h)
    n = min(r.randint(9, 12), len(hours))
    while True:
        hs = sorted(r.sample(hours, n)); ms = [r.randint(0, 59) for _ in hs]
        t = [h * 60 + m for h, m in zip(hs, ms)]
        if all(b - a >= 45 for a, b in zip(t, t[1:])): break
    for _ in range(10000):
        types = r.sample(POOL, n)
        if all(a != b for a, b in zip(types, types[1:])): break
    plan = {"date": f"{now:%Y-%m-%d}", "videos": [{"heure": f"{h:02d}:{m:02d}", "type": ty, "fait": None} for h, m, ty in zip(hs, ms, types)]}
    F.write_text(json.dumps(plan, ensure_ascii=False, indent=1)); return plan

plan = json.loads(F.read_text()) if F.exists() else creer()
cmd = sys.argv[1] if len(sys.argv) > 1 else ""
if cmd == "a-faire":
    # Rattrapage (demande de l'utilisateur, 4 nov. 2026) : d'abord les vidéos du jour déjà passées et pas faites
    # (à envoyer tout de suite), puis celle de l'heure suivante.
    h = now.hour + 1
    t = now.hour * 60 + now.minute
    def mn(v): return int(v["heure"][:2]) * 60 + int(v["heure"][3:])
    retard = [dict(v, retard=True) for v in plan["videos"] if not v["fait"] and mn(v) < t]
    suivante = [v for v in plan["videos"] if not v["fait"] and mn(v) >= t and int(v["heure"][:2]) <= h]
    print(json.dumps(retard + suivante, ensure_ascii=False))
elif cmd == "fait":
    for v in plan["videos"]:
        if v["heure"] == sys.argv[2]: v["fait"] = sys.argv[3]
    F.write_text(json.dumps(plan, ensure_ascii=False, indent=1)); print("ok")
else:
    print(json.dumps(plan, ensure_ascii=False, indent=1))
