# Format « Le grand quiz de Prune » (essai du 13 oct. 2026)

Un épisode = 10 questions, 4 réponses (A, B, C, D) dont une seule correcte, 5 secondes pour réfléchir, puis la bonne réponse.
Hôtes : Prune la kangourou (elle parle, voix 3) et Tilou le koala. Décor de la colline au soleil. Durée ≈ 2 min 50.

## Faire un épisode
1. Écrire `episode-NNN.json` sur le modèle de `episode-001.json` : `q` (question), `show` (émoji au-dessus de la question),
   `a` = 4 × [émoji, mot] (émoji vide "" pour une réponse en chiffre), `ok` = index de la bonne réponse (varier la position), `say` = phrase de réponse.
2. `node <skill motion-reel>/scripts/scaffold.mjs q1 --duration 150 --formats 9x16`, police Fredoka en `fonts/display.woff2` et `fonts/ui.woff2`.
3. Voix : `uv run quiz_voix.py q1 episode-NNN.json <dossier des voix> 3` (quiz_voix.py doit être à côté du dossier `moteur/`).
   Écrit vo.wav, timeline.js (minutage de chaque question), film.json et beats.json : rien à régler à la main.
4. `python3 build.py q1/film.js`.
5. Les émojis viennent de la police système « Noto Color Emoji » (paquet `fonts-noto-color-emoji`) : vérifier `fc-list | grep -i emoji`.
   NE PAS utiliser @fontsource/noto-color-emoji (rien ne s'affiche dans le canvas).
6. Ambiance `jour` (ambiance.py), `sfx.mjs`, `mix.mjs q1 --music-db -8 --sfx-db -4 --vo-db 3 --no-mux`.
7. Rendu à 30 i/s (suffisant pour ce format, 3 fois plus rapide) : `node rendu.mjs --film q1 --workers 10 --fps 30`, puis ffmpeg pour ajouter mix.wav.
