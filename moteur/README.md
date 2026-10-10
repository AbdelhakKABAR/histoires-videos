# Moteur d'animation des histoires (style « Miel et le camion rouge »)

Fichiers à réutiliser pour chaque nouvelle histoire (projet motion-reel 9x16, 120 s, 96 bpm) :

- `head.js` : en-tête de film.js (imports, palette C, constantes G = sol à y 1100, P = phrases par scène).
- `kit.js` : sous-titres `subs()`, `heart`, `sparkle`, `sun`...
- `body.js` : le moteur. `shot(u, [[u0,x,y,zoom,x1,y1,zoom1],...], finScene)` = plans de caméra avec coupes ;
  `cam()` ; `say(u, 'qui')` = ouverture de bouche calée sur la voix ; `walkTo()` ;
  `critter(ctx,x,y,s,id,pose)` = personnage articulé (pose : look, lookY, mood -1..1, brow, talk, armL, armR (négatif = bras croisés sur le ventre),
  walk, stride, lean, droop (oreilles), wag (queue), sq, tilt, tear, squint, wide, cane, hold) ; table `SP` des espèces (bear, fox, badger) ;
  `truck()` ; `butterfly()` ; `sparkles()` ; `iconBub()` ; décors `room()` (chambre) et `garden()` (jardin, option warm = coucher de soleil).
- `scenes-exemple.js` : les 13 scènes de « Miel », la liste HITS (bruitages) et l'appel `filmPro` (= `M.film` + finition). À réécrire pour chaque histoire.
- `story-exemple.json` : le texte ; chaque phrase peut porter `who` (personnage qui parle), `speed`, `pre` (silence avant, en temps).
- `rendu.mjs` : le rendu final rapide (voir « Rendu haut de gamme »).
- `vo.py` : `uv run vo.py <film> <dossier voix> 0.86` -> audio/vo.wav, timeline.js / timeline.json (scènes, phrases, `who`, enveloppe `env` à 60 i/s pour les bouches).
- `amb-exemple.py` : ambiance synthétisée -> audio/music.wav.

Assemblage : `cat head.js kit.js body.js scenes.js > film.js`.

Pour un nouvel animal : ajouter une entrée dans `SP` (kind + couleurs) et, si besoin, un nouveau `kind` dans `critter`
(oreilles, queue, marques du visage). Pour un nouvel objet ou un nouveau décor : écrire une fonction sur le modèle de `truck()`, `room()`, `garden()`.

## Rendu « haut de gamme » (demande de l'utilisateur, 9 oct. 2026) — OBLIGATOIRE
L'utilisateur a jugé l'ancien rendu en aplats « pas haut de gamme ». Le moteur peint maintenant en volume, avec lumière et profondeur. Règles :

- **Formes en volume, automatiquement** : `ell`, `box`, `limb` ombrent toutes seules les couleurs écrites `'#RRGGBB'` (lumière en haut à gauche).
  Écrire les couleurs en hexadécimal 6 chiffres. `flat(() => ...)` pour un aplat voulu. Les ombres au sol (`'rgba(20,24,50,0.2)'`) deviennent douces ; `softShadow(ctx, x, y, rx, ry, a)` en pose une sous chaque objet posé.
- **Finition** : lancer le film avec `filmPro({ grade, fonts, hits, draw })` à la place de `M.film` (voir la fin de scenes-exemple.js).
  `grade(u)` renvoie l'ambiance de l'instant : `{ warm }` soleil (0.3 par défaut), `{ cold }` pluie ou tristesse, `{ night }` nuit, ou `null` pour le carton de fin.
  Faire CHANGER la lumière avec l'histoire (froid quand le héros est triste, chaud à la réconciliation) : c'est ce qui fait « cinéma ».
- **Profondeur** dans chaque décor d'extérieur : `haze(ctx, couleurDuCiel, 0.12 à 0.3)` entre deux calques `cam()` pour éloigner le fond ;
  `foreground(ctx, u, c, { cols })` EN DERNIER pour le feuillage flou du premier plan (`cols` = feuilles rousses en automne, `{ branch: false }` ou `{ grass: false }` pour n'en garder qu'un).
  `bake(clé, w, h, flou, fn)` pré-rend une fois un calque flou (arbres lointains, nuages) : s'en servir pour les fonds des nouveaux décors.
- **Lumière** : `sunRays(ctx, u, x, y, k, 'r,g,b')` (halo + rayons, coordonnées écran), `motes(ctx, u, k, 'r,g,b')` (poussières dorées, ou lucioles vertes la nuit ; dans `cam(ctx, c, 1, ...)`).
- **Météo** : `rainFx(ctx, u, k, 'back')` derrière les personnages, `rainFx(ctx, u, k, 'front')` devant, `splashFx(ctx, u, k)` au sol (dans `cam(ctx, c, 1, ...)`).
- **Jeu des personnages** (les 12 principes, version courte) : un élan avant chaque saut ou départ (`sq` positif 0,15 s avant), un écrasement à l'atterrissage (`sq` avec `wobble`),
  ce qui pend suit avec retard (foulard, oreilles `droop`, queue `wag`), les yeux bougent AVANT la tête (`look` puis `tilt`), un clignement à chaque changement de regard,
  jamais deux personnages qui font le même geste au même instant.
- **Couleurs rgba** : écrire l'opacité avec `AL(valeur)` (`\`rgba(255,255,255,${AL(a)})\``) — une opacité négative ou en notation 1e-7 fait planter le rendu.
- **Pas de grain** (`grain` reste à 0) : il multiplie le temps de rendu par 4 et TikTok l'efface.

### Rendu final : `rendu.mjs` (remplace `render.mjs --video-only`)
`node rendu.mjs --film <film> --workers 10` (copier rendu.mjs à côté du dossier du film, là où playwright est installé). Il capture en JPEG qualité 96 au lieu de PNG :
avec les dégradés, l'encodage PNG prenait 0,8 s par image. Durée mesurée : à peu près celle de l'ancien rendu (flou de mouvement à 6 passes, réglé dans filmPro).
Les images de contrôle (`--at`, `--strip`) se font toujours avec `render.mjs` du skill.

## Texte : TOUJOURS au présent (demande répétée de l'utilisateur, 10-11 oct. 2026) — PRIORITAIRE
Le conteur raconte au PRÉSENT de l'indicatif, comme si l'histoire se passait maintenant sous les yeux de l'enfant.
- INTERDIT : le passé simple (« arriva », « prit », « dit-il », « jouèrent », « s'en alla ») et l'imparfait de narration (« vivait », « était », « passait »).
- À écrire : « Rosie arrive. », « Miel serre son camion. », « Ils jouent ensemble. ». Le passé composé reste permis pour un fait déjà terminé (« Elle a perdu son nœud. »).
- Relis story.json avant de lancer vo.py : aucune phrase du conteur ne doit contenir un verbe au passé simple.
- Ponctuation soignée : une virgule là où le conteur doit respirer, un point à la fin de chaque idée. vo.py met un vrai silence à chaque virgule, point-virgule et deux-points.
- Phrases simples, mots courants, pas de mots rares ni d'onomatopées longues dans la bouche du conteur (la voix les prononce mal).

## Voix du conteur (choix de l'utilisateur, 9 oct. 2026 ; réglée le 11 oct. 2026)
Le conteur de TOUTES les vidéos est la « voix H » : moteur Supertonic 2 (`sherpa-onnx-supertonic-tts-int8-2026-03-06`), locuteur 7, en français.
`vo.py` la télécharge et l'utilise tout seul (il affiche « voix : conteurH »). Ne pas changer ces réglages. Licence OpenRAIL-M (usage commercial permis).
L'utilisateur lui reprochait de parler trop vite, d'oublier des mots et de ne pas marquer la ponctuation. `vo.py` corrige cela tout seul :
débit lent (0.8), silence réel à chaque virgule / point-virgule / deux-points, et chaque morceau est réécouté par reconnaissance vocale (Whisper, téléchargé tout seul, environ 640 Mo)
puis redit jusqu'à ce qu'aucun mot ne manque. À la fin, vo.py affiche « contrôle des mots du conteur » et la liste des morceaux encore imparfaits :
réécris ces phrases plus simplement (mots courants, pas d'exclamation isolée) et relance vo.py une fois. Compter 3 à 5 minutes pour vo.py.
Les anciennes voix restent possibles pour un essai : `VOIX=homme`, `VOIX=femme`, `VOIX=conteur11`.
Si vo.py dit que l'histoire est trop longue, raccourcir le texte (170 à 200 mots : la voix est plus lente qu'avant).

## Voix des personnages (demande de l'utilisateur, 7 oct. 2026)
Chaque personnage parle avec SA voix. Dans story.json, chaque réplique porte, en plus de `who`, le champ `voice` :
`"homme"` (papa, monsieur), `"femme"` (maman, dame), `"garcon"` (petit garçon), `"fille"` (petite fille), `"papi"`, `"mamie"`.
Les phrases du conteur n'ont pas de `voice`. Un même personnage garde la même voix dans toute l'histoire.
Varier le casting : héros garçon ou héroïne fille, une vidéo sur deux ; au moins deux voix de personnages différentes par histoire.

## Imagination (demande de l'utilisateur, 7 oct. 2026)
Les vidéos se ressemblaient trop (même début à la maison, même règle des parents, même déroulé). Chaque histoire doit surprendre :
autre lieu de départ, autre type d'intrigue, autre objet, autre personnage secondaire. Voir la consigne de la tâche.

## Son : éviter la mise en sourdine par TikTok (important)
Une vidéo (abeille, 7 oct. 2026) a été mise « en sourdine » par TikTok, sans doute parce que sa bande-son a été prise pour une musique protégée.
- Aucune mélodie, aucun air, aucune suite de notes qui ressemble à une musique ou à une comptine : pas de boîte à musique, pas de fredonnement, pas de bourdonnement « chanté », pas de carillon mélodique.
- Ambiance = bruits seulement (vent, pluie, eau, oiseaux courts et irréguliers, tic-tac, pas). Bruitages HITS : garder les notes isolées (une cloche, un « pop »), jamais plus de 2 ou 3 notes de suite, et pas de motif répété.
- Ne pas répéter en boucle un même motif sonore rythmé.
