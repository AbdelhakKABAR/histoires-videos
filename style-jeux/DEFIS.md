# Défis « une question » — mot mystère et suite logique (≈ 38 s, voix siwis, design premium)

Une SEULE question, niveau IMPOSSIBLE (très difficile mais juste et vérifiable), 20 secondes de chrono pour réfléchir,
puis la réponse en vert et l'explication lue. Validé par l'utilisateur le 18 oct. 2026.

    bash style-jeux/setup.sh
    python3 style-jeux/defi.py style-jeux/quiz/<fichier>.json <sortie.mp4>      (≈ 1 min ; voix téléchargée la 1re fois)

Modèles : quiz/defi-mot-lascaux.json et quiz/defi-logique-conway.json. Ne jamais refaire un mot ou une suite de
quiz/defis_faits.json (l'y ajouter après chaque vidéo).

## Mot mystère ("format": "mot") — 5 indices un par un (demande de l'utilisateur, 29 oct. 2026)
- Déroulé : catégorie, puis indice 1 lu + chrono de 5 s, indice 2 + 5 s, … jusqu'à l'indice 5 + 5 s (les lettres
  données arrivent avec le dernier indice), révélation, puis « Combien d'indices as-tu utilisés ? 1, 2, 3, 4 ou 5 ? »
  (≈ 50 à 60 s). Champ optionnel "secondes_par_indice" (5 par défaut). Accroche conseillée : « Seulement un pour cent
  des gens trouvent ce mot avec un seul indice. » Le champ "fin" n'est plus utilisé pour les mots (texte de fin fixe).
- mot : 5 à 12 lettres, sans espace (accents permis), un vrai mot connu mais dur à trouver ; souvent lié à la France
  (lieu, personnage, invention, plat, mot de la langue…), parfois culture générale.
- categorie (affichée) + categorie_dite (lue), **5 indices** du plus vague au plus précis (courts, ≤ 55 caractères pour
  tenir sur une ligne, EXACTS ; le 1er très vague, le 5e presque évident), lettres_donnees : 1,
  dire (prononciation), explication (une phrase), accroche_dite.
## Suite logique ("format": "logique")
- suite : 4 à 6 éléments (nombres, lettres, mots courts), 4 options dont une seule juste (ok = index, varier la position),
  question_dite (la suite lue en toutes lettres), explication (affichée) et explication_dite (lue, nombres en lettres).
- Vraiment difficile mais avec UNE seule logique évidente une fois expliquée (vérifier qu'aucune autre option ne marche aussi).
- Toujours une description TikTok avec hashtags.
