# Programme du jour — voir HEURES plus bas (7 nov. 2026). Ancien texte (5 nov.) :
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
# 7 nov. 2026 (demande de l'utilisateur, remplace celle du 5 nov.) : 6 vidéos par jour sur les 4 plateformes :
# 2 défis (1 mot mystère + 1 suite logique), 2 quiz France, 2 quiz culture générale (1 Monde + 1 Monde, intrus ou lettre).
# Les heures changent selon le JOUR DE LA SEMAINE (heures de Paris), choisies d'après les études 2026
# Buffer (7,1 M de publications), Iconosquare et Gridshift (Swello, Ruche & Pollen, Meltwater). Le soir 18-23 h est fort ;
# 2 h d'écart au moins entre deux vidéos. Ordre des types tiré au hasard chaque jour ; défi placé sur la meilleure heure.
HEURES = {  # 0 = lundi … 6 = dimanche ; la 1re heure de chaque liste = meilleure heure du jour (Buffer)
    0: [13, 6, 8, 11, 18, 21],   # lundi : 13 h (Buffer), 6 h / 10 h (Iconosquare, Gridshift), 21-22 h
    1: [6, 9, 12, 16, 19, 22],   # mardi : 6 h, 22 h (Buffer), 9 h, 16 h (Iconosquare)
    2: [22, 6, 8, 12, 16, 20],   # mercredi : 22 h, 6 h, 21 h (Buffer), 7-9 h, 16 h (Iconosquare)
    3: [13, 6, 9, 16, 19, 22],   # jeudi : 13 h, 22 h, 6 h (Buffer), 9 h, 19 h (Iconosquare)
    4: [18, 7, 13, 16, 20, 22],  # vendredi : 18 h, 22 h, 20 h (Buffer), 13-16 h (Iconosquare, Gridshift)
    5: [17, 9, 11, 13, 15, 20],  # samedi (meilleur jour) : 17 h, 16 h, 15 h (Buffer), 9-11 h, 19-20 h (Iconosquare)
    6: [9, 13, 15, 17, 19, 7],   # dimanche : 9 h, 13 h (Buffer), 7-8 h, 14-16 h (Iconosquare), 17-19 h (Metricool)
}

def creer():
    r = random.SystemRandom()
    hs = HEURES[jour.weekday()]
    gen2 = r.choice(["monde", "intrus", "lettre"])
    defi_top = r.choice(["mot", "logique"])            # le défi sur la meilleure heure du jour
    reste = ["france", "france", "monde", gen2, "logique" if defi_top == "mot" else "mot"]
    for _ in range(10000):
        r.shuffle(reste); types = [defi_top] + reste
        ordre = sorted(zip(hs, types))
        if all(a[1] != b[1] for a, b in zip(ordre, ordre[1:])): break
    plan = {"date": f"{jour:%Y-%m-%d}", "videos": [{"heure": f"{h:02d}:00", "type": ty, "fait": None} for h, ty in ordre]}
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
