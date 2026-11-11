# 💬 MISE À JOUR 11 nov. 2026 (demande de l'utilisateur, d'après voir_stats) — PRIORITAIRE, à lire en premier
Constat : TikTok ≈ 270 vues/vidéo (×2 depuis le 6 nov.), mais 0 à 2 commentaires. Quiz lettre = meilleur (1 278 vues Instagram),
suite logique = meilleur YouTube (483 vues). Facebook ≈ 0.
1. PROGRAMME : le 2e quiz culture générale est TOUJOURS un quiz lettre (planifier.py) -> chaque jour 2 défis (mot + logique),
   2 quiz France, 1 quiz Monde, 1 quiz lettre.
2. QUESTION BONUS obligatoire (quiz France / Monde / intrus, pas le quiz lettre ni les défis) : champ
   "bonus": {"q": "question lue", "qd": "texte affiché, 60 caractères max"}. Elle passe APRÈS la dernière réponse, SANS réponse :
   la voix dit « Question bonus ! … Ta réponse en commentaire ! » et l'écran affiche QUESTION BONUS + « Réponds en commentaire ! ».
   Une vraie question du thème, réponse exacte et unique, niveau normal (que beaucoup osent répondre). Vérifié par verifier_episode.py.
   La légende peut finir par « Et la question bonus ? 👇 ». Test du 11 nov. : vidéo de 65 s, 4 questions + bonus (OK).
3. LÉGENDE : le script retire des questions au-delà de 72 s (avec la question bonus, 4 gardées sur 8 : il retire les 3e, 6e, 2e puis 5e).
   Seules les questions 1, 4, 7 et 8 sont sûres d'être gardées. Ne citer en exemple dans la description QUE des éléments de
   ces questions-là (jamais la réponse des questions 7 et 8, ni un simple mauvais choix), ou ne citer aucun exemple.

# 🚀 MISE À JOUR 7 nov. 2026 (demande de l'utilisateur : « fais des choses pro ») — PRIORITAIRE
D'après les guides TikTok 2026 (Hootsuite, Metricool, go-viral) et nos stats (défis 30-45 s = meilleures vues) :
1. DURÉE quiz : environ 70 s (demande de l'utilisateur ; max_duration 72 par défaut dans quiz_voix_court.py ; ≈ 6 questions gardées sur 8).
   Vérification après rendu : 62 à 76 s. Défis inchangés (30 à 45 s).
2. PROGRAMME : 6 vidéos par jour sur les 4 plateformes : 2 défis (1 mot mystère + 1 suite logique), 2 quiz France,
   2 quiz culture générale (1 Monde + 1 Monde/intrus/lettre). Heures différentes selon le jour de la semaine (HEURES dans planifier.py).
3. HASHTAGS (4 ou 5) : format (#quiz / #motmystere / #suitelogique / #trouvelintrus) + 1 tag communauté qui tourne
   parmi #culturegenerale, #apprendresurtiktok, #quizz, #testculturegenerale (jamais le même 2 fois de suite)
   + 1 à 2 tags du sujet (#football, #geographie, #cuisine, #histoire, #animaux…, #france si thème France) + #publiostudio en dernier.
4. Les 3 premières secondes : la question ou le défi doit être lisible à l'écran tout de suite (accroche), sans écran vide.
5. Le mot-clé principal (ex. « quiz foot », « mot mystère ») doit être dit par la voix, écrit à l'écran ET dans la 1re phrase de la légende.

# 📊 MISE À JOUR 6 nov. 2026 — d'après les stats réelles (outil Publio voir_stats) et les guides 2026 — PRIORITAIRE
Constat : TikTok ≈ 135 vues/vidéo, Instagram ≈ 145, YouTube 0 à 180, Facebook ≈ 2 (page sans abonné).
Presque aucun j'aime/commentaire : c'est ça qui bloque la diffusion (TikTok et YouTube élargissent l'audience
quand les gens regardent jusqu'au bout, commentent ou s'abonnent). Meilleurs sujets : sport (359 vues), boissons/cuisine
(278), défis suite logique / mot mystère (208-234). Plus faibles : quiz lettre (≈ 90).

1. LÉGENDE = aussi le TITRE YouTube (Publio coupe à 100 caractères) : la 1re phrase doit tenir en 60 caractères
   et se lire comme un titre complet (« 🏛 Quiz : le pays de chaque site antique ? »). Puis la question au public.
2. HASHTAGS (3 à 5, guides 2026 : 3-5 sur TikTok et YouTube, 3-8 sur Instagram ; la légende compte plus que les tags) :
   - 1er tag = #quiz (ou #motmystere / #trouvelintrus / #suitelogique pour les défis et intrus).
   - Faire TOURNER le tag communauté : #culturegenerale, #testculturegenerale, #apprendresurtiktok (Metricool 2026,
     catégorie éducation), #quizz — jamais le même deux vidéos de suite.
   - 1 à 2 tags du sujet précis (#sport, #football, #histoire, #geographie, #cuisine, #animaux…) + #france si thème France.
   - Toujours interdits : #fyp #foryou #pourtoi #viral #trending #reels #quiztime #defi #question #connaissance #piege #logique #cerveau #tiktok.
3. FIN DE VIDÉO : "outro" = appel au commentaire, dit ET écrit, ex. « Écris ton score en commentaire, et abonne-toi ! »
   ou « Dis-moi en commentaire laquelle t'a piégé ! » (varier). Ne plus mettre seulement « Abonnez-vous ».
4bis. TEST (6 nov. 2026, demande de l'utilisateur : avant, avec #publiostudio et la position « Tour Eiffel », ses TikTok
   dépassaient 1 000 vues, certains 10 000) : mettre #publiostudio en DERNIER hashtag de chaque vidéo (il compte dans
   les 5 max). La position ne peut pas être mise par Publio (l'API TikTok ne la propose pas). Comparer les vues avec voir_stats après 2-3 jours.
4. SUJETS : privilégier sport, cuisine/boissons, animaux, géographie « grand public » ; les listes a_faire de themes.json
   en contiennent.

# ⚠️ MISE À JOUR 5 nov. 2026 (demande de l'utilisateur : les vues ne dépassent pas 250) — PRIORITAIRE
Contrôlé automatiquement par `style-quiz/verifier_episode.py` (lancé par faire_quiz_adulte.sh et defi.py : le rendu
refuse un épisode qui ne respecte pas ces règles).

## 1. ACCROCHE obligatoire (champ "accroche") — écrite en GRAND à l'écran dès la 1re image + dite par la voix
- 2 à 7 mots, une promesse ou un défi chiffré, propre à la vidéo. Exemples :
  « 97 % ratent la dernière question », « Personne n'a eu 10/10 », « Seul 1 Français sur 50 trouve tout »,
  « La question 8 piège tout le monde », « Seulement 1 % trouvent avec 1 indice », « Un génie trouve en 10 secondes ».
- "accroche_dite" : la même phrase pour la voix, nombres EN LETTRES (« quatre-vingt-dix-sept pour cent des gens ratent la dernière question ! »).
- Optionnel : "accroche_pill" (petite étiquette rouge au-dessus, « DÉFI CULTURE G » par défaut), ex. « SPÉCIAL FRANCE », « NIVEAU EXPERT ».
- Varier les accroches d'une vidéo à l'autre (jamais la même deux fois dans la journée).

## 2. DESCRIPTION : courte, propre à la vidéo, une question
- Texte ≤ 170 caractères avant les hashtags. 1re phrase = mot-clé cherché + thème (« Quiz culture générale : les danses du monde »),
  puis une question qui fait commenter (« Tu as eu combien sur 10 ? 👇 », « Tu tombes dans quel piège ? 👇 »).
- INTERDIT : la phrase passe-partout « du niveau facile à impossible. Tu arrives jusqu'où ? Donne ton score en commentaire ».
- 3 à 5 hashtags, sans doublon. INTERDITS : #quiztime #defi #question #connaissance #fyp #foryou #pourtoi #viral #tiktok #piege #logique #cerveau.
- Exemple : « 💃 Quiz culture générale : de quel pays vient chaque danse ? La 9 piège presque tout le monde. Ton score sur 10 ? 👇 #quiz #culturegenerale #danse #geographie »

# Hashtags et description TikTok — règles (4 nov. 2026, demande de l'utilisateur : « hashtags pertinents pour plus de vues »)

PRIORITAIRE sur les listes de hashtags données ailleurs (README, DEFIS.md, tâche programmée).
Sources : guides 2026 de Sprout Social, Juicer, PostLink (TikTok conseille 3 à 5 hashtags, niche > générique,
et lit le texte de la légende pour sa recherche).

## Règle : 5 hashtags maximum, dans cet ordre
1. 1 hashtag de FORMAT (niche) : #quiz, #motmystere, #trouvelintrus, #suitelogique, #quizlettre
2. 1 hashtag de COMMUNAUTÉ (niche FR) : #culturegenerale ou #testculturegenerale (alterner)
3. 1 à 2 hashtags du SUJET précis de la vidéo : #geographie, #histoiredefrance, #aveyron, #drapeaux, #animaux,
   #sciences, #languefrancaise, #cuisine, #sport, #paris… (le thème réel, jamais un tag sans rapport)
4. 1 hashtag LARGE au plus : #france (thème France) ou #lesaviezvous / #enigme ; #pourtoi et #fyp ne servent
   presque à rien : ne plus les mettre systématiquement (au plus 1 vidéo sur 3).
Jamais de hashtag hors sujet ou « tendance » sans rapport (TikTok pénalise), jamais le même bloc de tags à chaque vidéo.

## Légende = recherche TikTok (SEO)
- La 1re phrase contient les MOTS-CLÉS que les gens tapent : « quiz culture générale », « quiz France »,
  « mot mystère », « trouve l'intrus », « test de QI », + le thème (ex. « quiz géographie France »).
- Puis un appel au commentaire (question) : « Ton score en commentaire 👇 », « Combien d'indices ? 👇 ».
- Les mots-clés de la légende doivent aussi être DITS dans la vidéo (TikTok écoute l'audio) et écrits à l'écran
  (bannière/titre) : le "banner" et la catégorie doivent reprendre le mot-clé principal.

## Exemples
- Quiz Monde : « 🌍 Quiz culture générale : les capitales du monde, 10 questions de facile à impossible. Ton score ? 👇 #quiz #culturegenerale #geographie #capitales #lesaviezvous »
- Défi mot : « 🔤 Mot mystère niveau impossible : un lieu en France en 5 indices. Combien t'en a-t-il fallu ? 👇 #motmystere #testculturegenerale #geographie #france »
- Intrus : « 🧩 Trouve l'intrus : 10 pièges de culture générale. Tu tombes dans lequel ? 👇 #trouvelintrus #quiz #culturegenerale #enigme »

## Suivi
Noter dans planning (champ libre) les vues à 48 h quand l'utilisateur les donne, et garder les tags qui marchent.
