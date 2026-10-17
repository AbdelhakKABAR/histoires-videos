# Jeux « Qui va gagner ? » — vidéos à suspense (1080x1920, 35–50 s)

Le spectateur choisit un participant (pays, club…) avant le départ ; c'est la physique qui décide, rien n'est truqué.
Chaque vidéo doit être DIFFÉRENTE : autre jeu, autre habillage, autre piste, autre musique, autres participants.

## Fabriquer
    bash style-jeux/setup.sh                       # une fois par session (paquets, drapeaux, polices)
    python3 style-jeux/faire_jeu.py style-jeux/jeux/<fichier>.json <sortie.mp4>
Options : --mode course|cercle|arene, --theme <nom>, --seed N. Sans option : tirage au hasard qui évite
les 2 derniers jeux et les 5 derniers habillages (historique.json, à committer après chaque vidéo).

## Jeux (modes)
- course  : billes qui dévalent une piste ; 5 sections tirées au hasard parmi clous, zigzag, moulins, entonnoir,
            bumpers, trampolines, portes (barres mobiles), roue, escalier, puis sprint final. Classement en direct.
- cercle  : billes dans 1 ou 2 anneaux qui tournent ; l'ouverture s'agrandit ; qui sort est éliminé. Dernier = gagnant.
- arene   : sans gravité ; scie centrale qui grossit + lames en orbite ; 3 touches = éliminé. Dernier = gagnant.

## Habillages (themes.py)
neon, stade, lave, glace, bonbon, desert, espace, or, militaire — couleurs, fond animé, police propres à chacun.

## Fichier de jeu (jeux/AAAA-MM-JJ-<nom>.json)
titre1, titre2, sous_titre (facultatif), question_fin, description (TikTok + hashtags), participants (6 à 20 — varier : parfois 6, parfois 16-20),
mode / theme facultatifs ("auto" par défaut).
- Pays : {"nom": "Maroc", "drapeau": "ma"} (codes flag-icons : ISO 2 lettres, + gb-eng, gb-sct, gb-wls…)
- Bulles numérotées : mettre "numeros": 12 à la place de participants (bulles colorées 1 à 12, sans pays) ;
  ou {"numero": 7} dans la liste.
- Équipe : {"nom": "PSG", "sigle": "PSG", "couleurs": ["#0B2A5B", "#DA291C", "#FFFFFF"], "motif": "bande"}
  motifs : uni, bande, rayures, cerceaux, moitie, diagonale, col. JAMAIS de logo ni d'écusson (marques déposées).

## Ajouter une idée (nouveau jeu, nouvel obstacle, nouvel habillage)
- Nouvel habillage : une entrée dans THEMES (themes.py) ; un nouveau type de fond = une branche dans Painter.background.
- Nouvelle section de piste : une branche dans Course.build (mode_course.py) + son nom dans SECTIONS/NOMS + son dessin.
- Nouveau jeu : une classe avec frames, nframes, decisive, winner, final_rank, rank(k), score(), camera(k),
  draw(cr, pt, k, oy, labels, intro), hud(cr, pt, k, a), audio_events(t0), titre_fin — puis l'ajouter à MODES.
Toujours tester avec --mode/--theme, regarder des images extraites, et ne committer que si tout marche.
