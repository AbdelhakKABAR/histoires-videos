# Moteur d'animation des histoires (style « Miel et le camion rouge »)

Fichiers à réutiliser pour chaque nouvelle histoire (projet motion-reel 9x16, 120 s, 96 bpm) :

- `head.js` : en-tête de film.js (imports, palette C, constantes G = sol à y 1100, P = phrases par scène).
- `kit.js` : sous-titres `subs()`, `heart`, `sparkle`, `sun`...
- `body.js` : le moteur. `shot(u, [[u0,x,y,zoom,x1,y1,zoom1],...], finScene)` = plans de caméra avec coupes ;
  `cam()` ; `say(u, 'qui')` = ouverture de bouche calée sur la voix ; `walkTo()` ;
  `critter(ctx,x,y,s,id,pose)` = personnage articulé (pose : look, lookY, mood -1..1, brow, talk, armL, armR (négatif = bras croisés sur le ventre),
  walk, stride, lean, droop (oreilles), wag (queue), sq, tilt, tear, squint, wide, cane, hold) ; table `SP` des espèces (bear, fox, badger) ;
  `truck()` ; `butterfly()` ; `sparkles()` ; `iconBub()` ; décors `room()` (chambre) et `garden()` (jardin, option warm = coucher de soleil).
- `scenes-exemple.js` : les 13 scènes de « Miel », la liste HITS (bruitages) et l'appel `M.film`. À réécrire pour chaque histoire.
- `story-exemple.json` : le texte ; chaque phrase peut porter `who` (personnage qui parle), `speed`, `pre` (silence avant, en temps).
- `vo.py` : `uv run vo.py <film> <dossier voix> 0.86` -> audio/vo.wav, timeline.js / timeline.json (scènes, phrases, `who`, enveloppe `env` à 60 i/s pour les bouches).
- `amb-exemple.py` : ambiance synthétisée -> audio/music.wav.

Assemblage : `cat head.js kit.js body.js scenes.js > film.js`.

Pour un nouvel animal : ajouter une entrée dans `SP` (kind + couleurs) et, si besoin, un nouveau `kind` dans `critter`
(oreilles, queue, marques du visage). Pour un nouvel objet ou un nouveau décor : écrire une fonction sur le modèle de `truck()`, `room()`, `garden()`.
