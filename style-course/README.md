# Jeux « Qui va gagner ? » (course de billes)

Vidéos 1080x1920 de ~45 s : chaque participant est une bille, le spectateur choisit la sienne avant le départ,
la physique décide du vainqueur (aucun résultat truqué). Son synthétisé (musique, chocs, fanfare), sans voix.

## Fabriquer une vidéo
    pip install --break-system-packages pymunk pycairo cairosvg numpy
    python3 style-course/faire_jeu.py style-course/jeux/<fichier>.json <sortie.mp4>
(~1 min 30 ; les drapeaux sont téléchargés tout seuls via npm `flag-icons`.)

## Fichier de jeu (style-course/jeux/AAAA-MM-JJ-<nom>.json)
- `titre1` / `titre2` (ex. « QUEL CLUB » / « VA GAGNER ? »), `sous_titre`, `question_fin`, `description` (TikTok, avec hashtags).
- `participants` : 6 à 10 éléments.
  - Pays : `{"nom": "Maroc", "drapeau": "ma"}` (code ISO à 2 lettres, minuscules).
  - Équipe : `{"nom": "PSG", "sigle": "PSG", "couleurs": ["#0B2A5B", "#DA291C", "#FFFFFF"], "motif": "bande"}`
    motifs : uni, bande, rayures, cerceaux, moitie, diagonale, col. `sigle` 2 à 4 lettres.
    JAMAIS de logo ni d'écusson de club (marques déposées) : seulement couleurs du maillot + sigle.
- Ne jamais reprendre un jeu identique : varier les participants et le thème (voir les fichiers déjà faits dans jeux/).
