# Vérifie l'accroche et la description d'un épisode avant le rendu (5 nov. 2026, demande de l'utilisateur : plus de vues).
#   python3 style-quiz/verifier_episode.py <episode.json | defi.json>
# Sort en erreur (code 1) avec la liste des problèmes : corriger le JSON puis relancer. Règles : style-quiz/HASHTAGS.md.
import json, re, sys

INTERDITS = {"#quiztime", "#defi", "#question", "#connaissance", "#fyp", "#foryou", "#foryoupage", "#pourtoi", "#viral",
             "#tiktok", "#question", "#questions", "#piege", "#logique", "#cerveau"}
D = json.load(open(sys.argv[1])); err = []
desc = D.get("description", "").strip()
tags = re.findall(r"#\w+", desc)
texte = re.sub(r"#\w+", "", desc).strip()
acc = D.get("accroche", "")

if not acc: err.append('"accroche" manquante (phrase choc écrite à l\'écran dès la 1re seconde, 2 à 7 mots)')
elif len(acc.split()) > 8: err.append(f'"accroche" trop longue ({len(acc.split())} mots, 8 au plus) : {acc}')
if acc and "accroche_dite" not in D and re.search(r"\d", acc):
    err.append('"accroche_dite" manquante : écrire la phrase lue avec les nombres en lettres (ex. « quatre-vingt-dix-sept pour cent »)')
if not 3 <= len(tags) <= 5: err.append(f"{len(tags)} hashtags : il en faut 3 à 5")
bad = [t for t in tags if t.lower() in INTERDITS]
if bad: err.append("hashtags interdits (trop généraux ou hors sujet) : " + " ".join(bad))
if len(set(t.lower() for t in tags)) != len(tags): err.append("hashtag en double")
if len(texte) > 170: err.append(f"texte trop long ({len(texte)} caractères, 170 au plus avant les hashtags)")
if "?" not in texte: err.append("pas de question pour faire commenter (ex. « Tu as eu combien ? 👇 »)")
if re.search(r"du niveau facile à impossible|Tu arrives jusqu'où \? Donne ton score", texte):
    err.append("phrase type déjà utilisée partout : écrire une légende propre à cette vidéo")
if not re.search(r"(?i)quiz|mot mystère|trouve l'intrus|suite logique|test de qi|culture générale", texte[:80]):
    err.append("la 1re phrase doit contenir le mot-clé cherché (quiz…, mot mystère, trouve l'intrus, suite logique, culture générale)")

if err:
    print("ÉPISODE À CORRIGER (" + sys.argv[1] + ") :"); [print(" -", e) for e in err]; sys.exit(1)
print("accroche + description OK :", acc, "|", len(tags), "hashtags")
