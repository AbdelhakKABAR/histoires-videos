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

## Format court retenu (13 oct. 2026) : 30 s maximum, 5 questions, 3 s pour réfléchir
- Demande de l'utilisateur : vidéos de 30 s au plus, 5 questions, 3 s d'attente, et une voix qui prononce très bien le français.
- Voix : Kokoro « ff_siwis » (modèle `kokoro-multi-lang-v1_0` de sherpa-onnx, sid 30, vitesse 1.0), téléchargée depuis GitHub.
  Comparée le 13 oct. à Piper siwis, Piper tom, Piper upmc et Supertonic : c'est la plus naturelle, et Whisper entend 100 % des mots.
  Les voix en ligne (Microsoft, Google) sont bloquées par le réseau des sessions.
- Le conteur ne lit PAS les réponses : il lit la question (courte !), les 4 cartes apparaissent pendant ce temps, 3 s de compte à rebours,
  puis il dit la réponse en 1 ou 2 mots (« La vache ! »). Fin : « Bravo ! » + étoiles. Total ≈ 29 s.
- `uv run quiz_voix_court.py q2 episode-court-NNN.json <dossier des voix>` (option "wait" dans le JSON, 3 par défaut), puis comme ci-dessus.
- Questions de 4 mots environ, réponses de 1 à 2 mots, varier la position de la bonne réponse.
