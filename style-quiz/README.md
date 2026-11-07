# ⚠️ DIFFICULTÉ — 6 nov. 2026 (demande de l'utilisateur : « rends les vidéos un peu faciles pour donner l'envie de continuer ») — PRIORITAIRE
Le spectateur doit trouver presque tout pour avoir envie d'aller au bout (et de commenter son score).
- Écrire 8 questions réparties 3 / 3 / 1 / 1 (facile / normal / difficile / impossible) au lieu de 2/2/2/2.
- Facile = connu de tout le monde (≈ 90 % trouvent) ; normal = culture générale courante (≈ 70 %) ;
  difficile = connu mais demande de réfléchir ; « impossible » = la seule vraie colle, à la fin (≈ 25 % trouvent), jamais obscure.
- Pas de réponse érudite (élément chimique rare, capitale peu connue, date précise, savant méconnu) : préférer ce qu'on a vu à l'école,
  à la télé, en voyage. Les 3 autres choix restent plausibles mais la bonne réponse se reconnaît.
- Intrus : raisons simples (« ce n'est pas un fruit », « elle n'est pas en Europe ») ; pas de piège technique.
- Lettre : réponses du quotidien (animaux, pays, villes, aliments, objets, personnages très connus).
- L'accroche peut rester un défi (« La dernière piège 80 % des gens »), mais la vidéo doit être réussissable.

# Format « Le grand quiz de Prune » (essai du 13 oct. 2026)

> **Hashtags et description : suivre style-quiz/HASHTAGS.md (prioritaire, 4 nov. 2026).**
> **ACCROCHE obligatoire depuis le 5 nov. 2026 : champs "accroche" + "accroche_dite" (voir HASHTAGS.md), vérifiés par verifier_episode.py.**

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

## Mise à jour (13 oct. 2026, choix de l'utilisateur)
- Voix : « voix 2 » = Piper fr_FR siwis medium (et non Kokoro), vitesse 0.95.
- Attente : 5 secondes (« wait": 5 dans le JSON). Pour rester sous 30 s : 4 questions par épisode (≈ 30 s).
  Avec 5 questions et 5 s, la vidéo ferait environ 38 s.

## Intro et abonnement (13 oct. 2026, demande de l'utilisateur)
- Intro parlée (champ "intro") : « Quatre questions, cinq secondes pour répondre ! Ton enfant trouvera-t-il toutes les bonnes réponses ? »
- Fin (champ "outro") : « Bravo ! Abonnez-vous pour plus de quiz ! » avec un bouton rouge « Abonnez-vous ! » à l'écran. Durée totale ≈ 38 s.

## Corrections (13 oct. 2026, demande de l'utilisateur)
- Titre à l'écran : « Les grandes questions » (pas « quiz »). Fin : « Bravo ! Abonnez-vous pour plus de questions ! »
- Intro en deux phrases, lue plus lentement (vitesse 0.75, champ "intro_speed"), 0,6 s de silence entre les deux. Fin à 0.85. Durée ≈ 40 s.

## Changer de personnages (demande de l'utilisateur du 13 oct. 2026 : « des fois change les personnages »)
Champ "hosts" de l'épisode : "prune-tilou" (kangourou + koala, par défaut) ou "lulu-bouba" (Lulu la lapine, qui parle, + Bouba l'ourson).
Les dessins sont dans hosts-extra.js (table HOSTPAIRS) : pour un nouveau duo, dessiner deux fonctions sur ce modèle et les ajouter à la table.
Alterner les duos d'un épisode à l'autre.

## Nouveau duo et nouveau décor (13 oct. 2026)
- "hosts": "mimi-pingo" = Mimi la petite chatte rousse (écharpe rose, elle parle) + Pingo le pingouin (écharpe bleue rayée), dans decor-extra.js.
- "decor": "neige" = banquise : montagnes enneigées, sapins, igloo, flocons qui tombent (ambiance : `ambiance.py ... vent`, mix --music-db -14).
  "decor": "colline" (défaut) = la colline au soleil.

## Format « niveaux » (13 oct. 2026) : 12 questions, 4 niveaux
- Champs : "levels": ["facile","normal","difficile","impossible"], "level" (0 à 3) sur chaque question, "pill": "12 questions · 4 niveaux".
- Avant la 1re question de chaque niveau : annonce parlée « Niveau facile ! » + grand panneau coloré (vert, bleu, orange, rouge) avec 1 à 3 étoiles, puis 🔥 pour « impossible ».
- L'étiquette du haut affiche « Facile · 1 / 12 » dans la couleur du niveau. Les questions deviennent plus dures à chaque niveau.
- Nouveau duo "ruby-hop" : Ruby la petite renarde (nœud vert, elle parle) + Hop le grenouillon (foulard rouge). Durée ≈ 1 min 52.

## Quiz ADULTES (style pro) — une commande (16 oct. 2026)
Fond bleu nuit, police Montserrat, titre fixe en haut (cadre bordé bleu-blanc-rouge), 10 questions en 4 niveaux, démarre directement
sur la question 1 (pas d'intro, pas d'écran « Niveau facile »), voix siwis, ≈ 1 min 40.
1. Écrire `adultes/episode-<nom>.json` sur le modèle de `adultes/episode-drapeaux.json` : `q` = question lue, `qd` = version courte affichée,
   4 réponses courtes (varier la position de `ok`), `say` = réponse dite, `level` 0-3 (3 / 3 / 2 / 2 questions), `subject`, `banner`, `symbols`, `description`.
   Les faits doivent être exacts et sans ambiguïté (éviter les questions discutées). Thèmes déjà faits / à faire : `adultes/themes.json`.
2. `bash style-quiz/faire_quiz_adulte.sh style-quiz/adultes/episode-<nom>.json` -> `style-quiz/_films/livraison/<nom>.mp4` (≈ 10 min).
3. Publication : `python3 style-quiz/publier_publio.py <clone de publio> <mp4> <episode.json>`, commit + push dans publio, puis lancer
   le workflow « Publier les vidéos » (REST : POST repos/AbdelhakKABAR/publio/actions/workflows/publish.yml/dispatches, ref=main).

## Quiz « TROUVE L'INTRUS » (même design que les quiz adultes) — 19 oct. 2026
Même commande et même format que les quiz adultes (10 questions, niveaux 3 facile / 3 normal / 2 difficile / 2 impossible).
Modèle : `adultes/episode-intrus-essai.json`. Pour chaque question : `q` = « Quel est l'intrus : A, B, C ou D ? » (lu),
`qd` = phrase courte affichée (« L'intrus parmi ces villes ? »), les 4 propositions en réponses, `ok` = l'intrus (varier la position),
`say` = l'intrus + la raison en une phrase courte. Un seul intrus possible, raison exacte et vérifiable ; des pièges aux niveaux difficiles.
Ne jamais reprendre un intrus de `adultes/intrus_faits.json` (y ajouter chaque nouvelle série). Durée ≈ 2 min 15.

## Thèmes FRANCE (souhait de l'utilisateur, 19 oct. 2026)
Privilégier les quiz « une ville / une région → sa réponse » : numéro de département de chaque ville, plat célèbre de chaque ville,
spécialité / fromage / vin de chaque région, nom des habitants, club de foot, monument, surnom, fleuve, préfecture… Chaque question
porte sur une ville ou une région différente (ex. « Quel est le numéro du département de Marseille ? » → 13). Réponses exactes et non
discutables (pour un plat, choisir une spécialité vraiment associée à la ville : bouillabaisse → Marseille, cassoulet → Castelnaudary/Toulouse…).

## Titre plus bas + couleurs qui changent (31 oct. 2026, demande de l'utilisateur)
Tout le contenu (titre en haut compris) est décalé vers le bas (`DY` dans `quiz-pro-body.js` et `style-jeux/defi.py`) : la barre
de recherche TikTok cachait le titre. Les couleurs et le motif du fond changent d'une vidéo à l'autre (palettes nuit, émeraude,
pourpre, océan, or, corail, glace ; motifs grille, points, diagonales, losanges, cercles), choisis automatiquement selon le titre.
Pour forcer : `"palette": "<nom>"` et `"pattern": "<motif>"` dans le JSON (palette `halloween` seulement sur demande).

## Décor selon le thème + icône devant le titre (1er nov. 2026, validé par l'utilisateur)
Le décor est choisi tout seul (`DECOR` dans `quiz-pro-body.js`) : `#france` dans la description → France (titre bordé bleu-blanc-rouge,
tour Eiffel qui scintille, rubans tricolores) ; `#monde` → Monde (globe qui tourne, étoiles, étoile filante) ; peinture / art / musée →
musée doré (spots, poussière dorée, cadre doré) ; intrus → néon violet-rose (hexagones qui s'allument). Pour forcer : `"decor": "france|monde|musee|intrus|aucun"`.
Icône devant le titre : `"icon"` dans le JSON, sinon le premier émoji de `symbols`, sinon celle du décor. `"palette"` désactive le décor (ancien style).

## Quiz LETTRE (1er nov. 2026, demande de l'utilisateur) — même design, 2 par jour (13 h et 19 h)
Inspiré des vidéos « Quiz lettre J » : toutes les réponses commencent par la même lettre. À l'écran : la liste « 1. P … 10. P »
qui se remplit (la réponse s'écrit en vert), des tirets d'indice (une case par lettre) sur la question en cours, la question
dans la carte du bas avec le minuteur de 5 s, puis la liste complète + « ?/10 » + S'abonner à la fin. ≈ 1 min 40.
Modèle : `adultes/episode-lettre-p.json` — `"mode": "lettre"`, `"letter"`, `"banner": "Quiz lettre X"`, `"icon": "🧠"`, et pour chaque
question : `q` (lue), `qd` (affichée), `answer` (mot affiché, commence par la lettre ; court : 1 ou 2 mots), `say`, `level` (3/3/2/2).
Pas de `a` ni de `ok`. Au début, la voix annonce la lettre : `"intro": "Toutes les réponses commencent par la lettre X !"`, `"intro_speed": 0.9`
(à l'écran : la liste vide + la grande lettre). Dans `q` lu à voix haute, écrire les sigles/symboles en lettres séparées (« P B »).
Lettre : prendre dans `adultes/lettres_faites.json` la lettre du `pool` utilisée le moins récemment (jamais deux fois la même lettre
le même jour) ; ne jamais reprendre une réponse déjà utilisée pour cette lettre ; ajouter l'épisode à `faites`.
Fichier : `adultes/episode-lettre-<x>-<AAAA-MM-JJ-HH>.json` ; même commande `faire_quiz_adulte.sh`.

## DURÉE MAXIMALE : 90 s, viser 85 s (4 nov. 2026, demande de l'utilisateur)
**Remplacé le 7 nov. 2026 : quiz d'environ 70 s, 72 s au plus (voir HASHTAGS.md, mise à jour du 7 nov.).**
Toutes les vidéos doivent durer 85 s au plus (jamais plus de 90 s). `quiz_voix_court.py` s'en charge tout seul : si l'épisode est
trop long, il retire des questions (dans le niveau qui en a le plus, chaque niveau reste représenté) jusqu'à tenir en 85 s
(`"max_duration"` dans le JSON pour changer). En pratique : ≈ 7 questions pour un quiz France / Monde / Lettre, ≈ 5-6 pour un intrus.
On peut donc écrire directement 8 questions (2 / 2 / 2 / 2) ; les questions retirées ne sont pas publiées.
Vérification après rendu : durée entre 70 et 88 s. Les défis (30 à 45 s) ne changent pas.
