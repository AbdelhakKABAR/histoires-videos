# Envoie une vidéo dans la file de Publio (dépôt AbdelhakKABAR/publio, cloné à côté) :
#   python3 publier_publio.py <dossier publio> <video.mp4> <episode.json>
# Copie la vidéo dans queue/videos/, ajoute l'entrée (mode "draft" tant que l'app TikTok n'est pas validée : la vidéo
# arrive en brouillon dans la boîte de réception TikTok, sans description — l'utilisateur colle la description et publie).
import json, shutil, sys, datetime, pathlib
P, V, E = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]), json.load(open(sys.argv[3]))
(P / "queue/videos").mkdir(parents=True, exist_ok=True); dst = P / "queue/videos" / V.name; shutil.copy(V, dst)
q = json.loads((P / "queue/schedule.json").read_text())
now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=2))).replace(microsecond=0).isoformat()
q.append({"time": now, "video": f"queue/videos/{V.name}", "caption": E.get("description") or E.get("title", ""), "privacy": "SELF_ONLY", "mode": "draft"})
(P / "queue/schedule.json").write_text(json.dumps(q, ensure_ascii=False, indent=2)); print("ajouté :", dst)
