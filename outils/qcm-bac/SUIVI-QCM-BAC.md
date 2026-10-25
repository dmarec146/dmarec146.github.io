# Bloc « QCM Bac » (Terminale spécialité mathématiques) — suivi du chantier

**Statut au 18/10/2026 : neuf banques codées (suites, géométrie dans l'espace, fonctions, probabilités, dénombrement, intégrales, trigonométrie, algorithmique, lectures graphiques), lien dans la navigation et sur l'accueil, fiche, sujet blanc et devoirs ; tout est fusionné dans `master` et en ligne.** Reste surtout à tester les devoirs avec Firebase (voir « Reste à faire » ci-dessous). Décisions prises avec
David lors d'une session cloud ; à tenir à jour à chaque étape (le récit détaillé
d'un chantier terminé va à la fin de `HISTORIQUE.md`).

## 0. Reste à faire (état du 18/10/2026, à lire en premier)

1. **Devoirs QCM Bac avec `demo-eleve`** : un devoir enregistré puis validé, testé par David le 18/10/2026, « cela fonctionne » (c'était un sujet blanc en mode fiche ; devoir à thèmes, mode chrono, note, « Résultats » et « Mes devoirs » : non vérifiés) ; voir §13 et §14.
2. **Comptes de Terminale** : classe `Tle-Gr 2`, à créer par David.
3. **Fréquentation** : *fait le 18/10/2026* — règles publiées (`s_qcm_bac`), `statistiques.js` et `frequentation.js` branchés sur la partie `qcm_bac` ; comptage réel non encore vérifié (voir `SUIVI-FIREBASE.md` §6).
4. **Banques** : lacunes connues (géométrie avec sphères, absente des sources ; fonction tangente en détail ; approximation d'aire par suites
   adjacentes ; trigonométrie en géométrie) ; familles plus courtes listées au §11. Le tirage des familles se règle dans chaque banque.
5. **Sujet blanc** : 12 questions sur 4 thèmes (`nbThemes`, `nb` dans `qcm-bac/sujet-blanc.html`) ; David peut vouloir 3 thèmes ou une autre longueur.
6. Entrée de `HISTORIQUE.md` du 18/10/2026 déjà écrite ; la compléter si le chantier reprend.

## 1. Décisions

- **Nouveau bloc** « QCM Bac » pour les classes de Terminale spécialité : une entrée dans la
  barre de navigation **et** une carte sur la page d'accueil, comme les automatismes.
  Couleur de la section : **à proposer à David** (le rouge des cahiers et le vert des automatismes
  sont pris), rien d'inventé sans son accord.
- **Même architecture que les automatismes de Première** : banques de données par famille,
  trois niveaux, mêmes moteurs de création et de correction (`automatismes/assets/moteur.js`),
  deux modes (fiche par thèmes / chrono ou sujet blanc), devoirs et barème branchés.
  Le moteur doit être **mutualisé, pas copié**. Pas encore lu en détail : repérer ce qui est
  propre à la Première (barème, textes, niveaux, `estPremiere()`) avant de proposer un plan.
- **Matière première** : les questions tombées au bac en Terminale (sujets 2024, 2025, 2026).
  On **ne recopie pas** : chaque question devient une **famille** à valeurs aléatoires, avec des
  mauvaises réponses qui reprennent les erreurs classiques (règles de `REGLES-FICHES.md` §7).
- **Affirmations à justifier** : les sujets récents sont surtout faits d'« affirmations à justifier »,
  que le site ne gère pas et ne doit pas gérer (aucune rédaction demandée à l'élève).
  **Méthode retenue par David** : transformer l'affirmation en **la question à laquelle sa justification
  répond**, avec 4 choix dont les mauvais correspondent aux erreurs de copie. Autres formes possibles,
  moins riches : vrai/faux puis choix de la bonne justification ; choisir l'affirmation vraie parmi quatre ;
  un simple vrai/faux (à éviter, une chance sur deux). Les affirmations qui ne s'y prêtent pas
  (récurrence, démonstration, figure trop particulière) sont **signalées avec la raison**, pas forcées.
- **Barème** : 1 point par question, sans pénalité, comme au bac. Le niveau 3 pourrait avoir des
  pénalités (à confirmer par David) ; il faudrait alors une option « je ne sais pas », et `bareme.js`
  ne gère pas de points négatifs. À trancher au moment du pilote, exemple sous les yeux.
- **Pas de rédaction** : le site ne propose aucune question à justifier.

## 2. Sources

Dans le dépôt, ne garder que **les exercices retenus** (énoncé, corrigé officiel, référence :
année, centre, numéro, lien), pas les sujets entiers. Dossier prévu : `outils/qcm-bac/sources/`.
Les sources LaTeX sont préférées aux PDF (texte et formules exacts) ; les PDF servent pour les figures.

- 2024 : https://www.apmep.fr/IMG/tex/Exercices_0_2024_FK_2.tex
- 2025 : https://www.apmep.fr/IMG/tex/Annee_spe_2025_DV.tex
- 2026 : https://www.apmep.fr/Annee-2026 (un fichier par sujet, à récupérer un par un)
- Programme officiel de Terminale spécialité (attendus et approfondissements) : **déposé le 18/10/2026** dans
  `outils/qcm-bac/sources/` (PDF et version texte, voir son `README.md`).

## 3. Prochaines étapes (dans l'ordre)

1. **Accès aux sources** — *fait le 17/10/2026* : `www.apmep.fr` était refusé par la politique réseau du
   conteneur cloud (403 du proxy) ; David a modifié l'environnement et le téléchargement fonctionne.
   Fichiers `.tex` récupérés dans le dossier temporaire de la session (non conservés dans le dépôt).
2. Programme officiel — *lu en entier le 17/10/2026* (PDF donné par David dans la session cloud, copié le
   18/10/2026 dans `outils/qcm-bac/sources/`) ; découpage en thèmes dans `outils/qcm-bac/pilote-suites.md` §1.
3. `moteur.js` — *lu le 17/10/2026* : déjà générique (banques enregistrées par identifiant, QCM à 4 options,
   niveaux 1 à 3, modes fiche et chrono, barème par table). Propre à la Première : les pages, les 8 banques,
   `bareme-sujet-blanc.js` et le lien en dur de `assets/js/mes-devoirs.js` (ligne 40). Pas de copie du moteur.
4. **Index des exercices** (année, centre, numéro, thème, type QCM / affirmation) — *brouillon fait le
   17/10/2026* : `outils/qcm-bac/index-exercices.md`, 47 exercices candidats (les vrais sujets de 2024, page
   `https://www.apmep.fr/Annee-2024`, ont été ajoutés le même jour ; le fichier donné d'abord pour 2024 était
   les « Exercices 0 », gardés en complément), **à faire valider par David**. Les affirmations isolées dans un
   exercice rédigé sont mises à part.
5. **Thème pilote : les suites** (choisi le 17/10/2026, David m'a laissé choisir). Proposition, quatre exemples
   de conversion (question d'origine à côté) et familles prévues : `outils/qcm-bac/pilote-suites.md`.
   **À valider par David avant tout code.** La géométrie dans l'espace viendra ensuite.
6. Banque pilote complète : 3 niveaux, vérificateurs indépendants testés par mutation, barème, audit de rédaction.
7. Bloc dans la navigation et sur l'accueil, comptes et classes de Terminale (le code distingue aujourd'hui
   Seconde et Première), attribution des devoirs et tableau de bord.

## 4. Points d'attention connus

- Les thèmes de Terminale sont plus conceptuels : un tirage aléatoire peut donner des énoncés dégénérés
  ou ambigus (limites, asymptotes, géométrie dans l'espace). Chaque famille a besoin d'un contrôle
  indépendant de la réponse, peut-être avec de la dérivation ou de l'intégration symbolique.
- Géométrie dans l'espace : le site n'a que des figures 2D (`graphiques.js`) ; la 3D viendrait plus tard.
- Aucune classe de Terminale n'existe encore dans Firestore ni dans les outils de création de comptes.
- Les sujets de bac sont publics ; GitHub Pages publie tout le dépôt, donc les extraits rangés ici seront en ligne
  une fois sur `master`.

## 5. Pilote codé le 17/10/2026 (après validation des quatre exemples par David)

Décisions de David : quatre propositions par question ; **séries de 10 questions** (plus qu'au bac, pour s'entraîner) ;
essai d'un **mélange de deux thèmes** (suites et géométrie dans l'espace, sans figure) ; **niveau 3 = questions plus
difficiles + pénalités**. Pénalité retenue : **0,25 point par mauvaise réponse** (une question laissée sans réponse ne
retire rien, la note ne descend pas sous 0) — valeur à confirmer par David, elle tient en un seul réglage
(`bareme.penalites` dans `qcm-bac/fiche.html`).

- **Pages et banques** : `qcm-bac/fiche.html` (page de fiche, 2 thèmes, 10 questions, trois niveaux, modes fiche et
  chrono), `qcm-bac/banques/01-suites.js` (7 familles) et `02-geometrie-espace.js` (8 familles). Elles réutilisent
  `automatismes/assets/moteur.js` et `automatismes.css`. Pas encore : page d'accueil du bloc, entrée dans la
  navigation, comptes et classes de Terminale, devoirs (aucun suivi Firebase sur la page).
- **Moteur** (`automatismes/assets/moteur.js`), deux options **facultatives**, sans effet sur la Première (vérifié) :
  `bareme.penalites` (`{3: 0.25}` : points retirés par mauvaise réponse à ce niveau) et `textesNiveau` (phrases des
  trois niveaux). Le bilan affiche alors les mauvaises réponses et leur retrait.
- **Contrôle** : `node outils/qcm-bac/controle-banques.js [--essais N] [--banque ID] [--mutation] [--apercu N]`.
  Il tire des questions brutes, contrôle la rédaction, puis **recalcule la vérité de chaque option de façon
  indépendante** (premiers termes, itérations de récurrences, modèles de suites pour les théorèmes, coordonnées) ; avec
  `--mutation`, il échange la bonne réponse avec une mauvaise et vérifie que le contrôle échoue. Résultat du
  17/10/2026 : 18 500 questions, 0 anomalie, mutation détectée 2 212 / 2 212. Il a trouvé et fait corriger : plan
  (ABC) confondu avec une équation du même plan, trois points toujours alignés quel que soit `m`, option
  « pour tout m » vraie, option fausse en double.
- **Navigateur** (Chromium, MathJax en local, voir `SUIVI-FIREBASE.md` §7) : 10 questions réparties 5 + 5, trois niveaux,
  aucune erreur MathJax ni console, pas de défilement horizontal à 390 px, note calculée (niveau 3 : 6 bonnes, 3 fausses,
  1 sans réponse → 5,25 / 10 ; niveau 2 : 6 / 10).
- **Essai en ligne sans passer par `master`** : artefact privé https://claude.ai/artifact/42e4JA2yp4B59e5CKMFvq9 (copie
  à plat de la page ; non testé dans l'artefact lui-même).
- **Limites connues** : peu d'énoncés distincts pour quelques familles de niveau 1 (≈ 17 à 40) ; la famille
  « convergence monotone » a 4 énoncés de fond (habillés par des lettres variées) ; pas d'option « je ne sais pas »
  (on laisse la question vide) ; le niveau 3 de géométrie n'a pas de question sur l'intersection de deux plans ni sur les sphères
  (approfondissements du programme) ; barème fixe à 1 point par question (pas de table par famille).
- **À valider par David** : la valeur de la pénalité, la lecture des questions des deux thèmes (surtout le niveau 3),
  l'équilibre 5 + 5, puis la suite : autres thèmes (exponentielle et logarithme, dérivation et convexité, intégration,
  probabilités et dénombrement, équations différentielles), puis navigation, accueil, comptes et devoirs.

- **Répartition par thème des affirmations et QCM (18/10/2026)** : `outils/qcm-bac/repartition-themes.md` — géométrie dans l'espace 36 %,
  suites 22 %, équations différentielles 9 %, probabilités 7 %, dénombrement 6 %, exponentielle et logarithme 6 %. Sert à ordonner
  les prochains thèmes.

## 6. Enrichissement des banques du pilote (18/10/2026)

À la demande de David : après la répartition par thème (`repartition-themes.md`), élargissement des deux banques.

- **Suites : 9 familles** (7 avant). Nouvelles : *raisonnement par récurrence* (encadrement de `u_{n+1}` à l'hérédité, suites
  affines de pente < 1 en valeur absolue et `u_{n+1}=√(2u_n+k)`, intervalle stable) et *algorithme de seuil* (fonction Python
  affichée en bloc de code, `<`, `<=`, `>`, `>=`, retour du rang ou de la valeur). Élargies : `cos(n)` et `sin(n)` en plus de
  `(-1)^n`, suites non monotones, suites `(n+c)/(n+d)`, `a·q^n` avec raisons décimales et `q=1`, comparaison pour les limites
  infinies (en plus des gendarmes), 8 situations de convergence monotone (suite croissante qui converge est majorée par sa
  limite, suite convergente bornée, suite bornée sans conclusion…), récurrences d'Héron et homographique, lettres variées.
- **Géométrie dans l'espace : 12 familles** (8 avant). Nouvelles : *deux droites* (parallèles, confondues, sécantes avec
  coordonnées, non coplanaires ; coordonnées de l'intersection), *deux plans* (parallèles, confondus, perpendiculaires,
  sécants ; représentation de la droite d'intersection), *angle* `BAC` arrondi au degré, *plan médiateur*.
- **Variété** (3 000 tirages par famille et niveau) : géométrie de 2 300 à 3 000 énoncés distincts partout ; suites au moins
  126 partout (avant : 17 à 60), sauf quelques familles de niveau 1 autour de 140 à 160.
- **Contrôle** : 92 000 questions tirées, 0 anomalie, détection des erreurs introduites volontairement 2 748 / 2 748.
  Nouveau contrôle de rédaction : un `<` suivi d'une lettre (balise HTML involontaire, par exemple `0<u_0<1`) est signalé ;
  quatre explications étaient concernées et ont été corrigées (`\lt`).
- **Familles par niveau** : suites 5 (niveau 1) puis 9 (niveaux 2 et 3) ; géométrie 5, 9 et 9. Une fiche de 5 questions par
  thème ne répète donc une famille que s'il y en a moins de 5 au niveau.
- **Restent hors banque** (idées pour plus tard) : suites d'intégrales, suites définies par une somme, démonstration d'une
  inégalité de Bernoulli ; sphères, barycentres, distance d'un point à une droite (approfondissements du programme).

## 7. Sujets de 2023 et 2022 intégrés (18/10/2026)

À la demande de David, mêmes opérations que pour 2024 à 2026 (téléchargement des intégrales de l'APMEP, index, répartition par
thème), puis alimentation des banques.

- **Constat** : en 2022 et 2023, chaque sujet contient presque toujours un exercice de **vrais QCM** (28 exercices, 130 questions),
  alors que 2024 à 2026 ne donnent que des affirmations. Les thèmes sont aussi différents : exponentielle et logarithme,
  dérivées, primitives et probabilités dominent. Détail : fin de `index-exercices.md`, mise à jour de `repartition-themes.md`
  (344 questions sur 2022 à 2026) et **catalogue des types de questions** dans `types-de-questions-2022-2023.md`.
- **Banques du pilote enrichies** (7 types repris des sujets) : suites, quotient de deux exponentielles de bases différentes,
  passage à la limite dans une inégalité large (« minorée par 3 et converge vers ℓ »), encadrements explicites (`n < u_n < n+1`,
  `1+(1/4)^n ≤ u_n ≤ 2−n/(n+1)`, `u_n ≤ u_{n+1} ≤ 1/n`), seuil en contexte (récipient à −15 % par heure, action à +3 % par
  mois, population qui double), algorithme de seuil à compléter (condition de boucle) ; géométrie, nature d'un triangle (rectangle,
  isocèle, équilatéral, quelconque) et angle `ABC` à partir de `BA·BC`, `BA` et `BC`.
- **Contrôle** : 92 000 questions, 0 anomalie, détection des erreurs volontaires 2 747 / 2 747.
- **Pas encore de banque** pour les thèmes qui dominent 2022 et 2023 : exponentielle, logarithme, dérivées, primitives, limites de
  fonctions, probabilités. C'est la suite logique (voir « Ordre conseillé révisé » dans `repartition-themes.md`).

## 8. Banque « Exponentielle et logarithme » (fonctions), codée le 18/10/2026

À la demande de David (« commence par la banque fonctions »). Fichier : `qcm-bac/banques/03-fonctions.js`, identifiant `fonctions`,
chargée par la page pilote `qcm-bac/fiche.html` (`?theme=fonctions` pour ne travailler que ce thème).

- **8 familles** : dérivées, primitives, équations et inéquations (ensemble de définition, `e^{ax+b}=k`, `ln`, équation du second degré
  en `e^x` ou en `ln x`, inéquations avec les quatre symboles), limites (croissances comparées, quotients, asymptote horizontale,
  quantité conjuguée, taux d'accroissement), tangente (équation réduite, tangente horizontale), convexité et points d'inflexion
  (affirmations, intervalle de convexité, nombre de points d'inflexion), calcul avec `ln` et `exp` (simplifications, inégalités
  classiques `e^x ≥ x+1`, `ln x ≤ x−1`…), équations différentielles `y'=ay+b` (solutions générales, condition initiale, solution
  constante, fonction donnée → équation).
- **Niveaux** : 1 = règle de base ; 2 = questions des sujets (produit, quotient, composée, croissances comparées, tangente) ;
  3 = composées imbriquées, intégration par parties, inéquations, conditions initiales. Convexité : niveaux 2 et 3 seulement.
- **Contrôle indépendant renforcé** : nouvel évaluateur LaTeX `outils/qcm-bac/latex-eval.js`. Pour cette banque, le contrôle ne se
  fie à aucune clé annexe : il **relit le LaTeX affiché** (énoncé et chaque option), l'évalue numériquement (dérivée par
  différences finies, racines par balayage, limites à trois distances, convexité par dérivée seconde, intervalles et ensembles
  analysés) et recalcule si chaque option est vraie. `controle-banques.js` : 103 500 questions (toutes banques), 0 anomalie,
  erreurs volontaires détectées 4 134 / 4 134.
- **Défauts attrapés par ce contrôle** : réponses équivalentes parmi les mauvaises (`{e^3 ; e^{-3}}` quand les deux racines sont
  opposées), tangente identique quand `f(1)=0`, intervalles « vacuously true » hors de la fenêtre testée, inégalité stricte vraie
  sauf en un point d'égalité (`e^{2x}+4 > 4e^x`), valeur à tolérance trop large (tangente horizontale).
- **Variété** (énoncés distincts sur 3 000 tirages) : de 52 (tangente N3) à plus de 1 000 ; la plupart des familles dépassent 120.
- **Essai navigateur** : 42 fiches tirées (3 niveaux), 3 402 formules, 0 erreur MathJax, pas de défilement horizontal sur
  téléphone, aucune erreur console.
- **Restent hors banque (pas de figure)** : lecture graphique (courbe de `f'`, de `f''`, tableau de variation), nombre de
  solutions de `f(x)=k`. Autres thèmes : probabilités et dénombrement (suite conseillée), intégrales, trigonométrie.

## 9. Banques « Probabilités » et « Dénombrement », codées le 18/10/2026

À la demande de David (« continue avec les probabilités et le dénombrement »). Fichiers : `qcm-bac/banques/04-probabilites.js`
(identifiant `probabilites`) et `qcm-bac/banques/05-denombrement.js` (identifiant `denombrement`), chargés par `qcm-bac/fiche.html`
(`?theme=probabilites`, `?theme=denombrement`). La page pilote tire désormais 2 thèmes parmi les 5 banques.

- **Probabilités, 6 familles** : arbres pondérés (lecture, probabilités totales, Bayes, paramètre inconnu, partition à trois branches ;
  contextes usine, test médical, lycée, abstrait) ; événements (réunion, indépendance, composants en série ou en parallèle, « le bus
  ou le train », urnes avec ou sans remise, affirmations indépendants / incompatibles / inclus) ; loi binomiale, formules
  (identification, espérance, variance, expression de `P(X=k)`, `P(X≥1)`, `P(X≤1)`, `P(a<X≤b)` par différences) ; loi binomiale,
  calculs (à la calculatrice, plus petit `n` ou `k` pour un seuil, paramètre inconnu `P(X=0)=1/125`) ; espérance et variance d'une
  loi donnée par un tableau, jeu équitable ; somme, moyenne, linéarité, `V(X−Y)`, Bienaymé-Tchebychev et taille d'échantillon.
- **Dénombrement, 7 familles** : k-listes avec contraintes (au moins un, palindromes, premier élément imposé…) ; permutations,
  arrangements et anagrammes (lettres répétées, personnes côte à côte, extrémités imposées) ; combinaisons (exactement, au moins,
  au plus ; au niveau 3 les réponses sont des expressions en coefficients binomiaux, comme au bac) ; parties d'un ensemble ;
  coefficients binomiaux (valeurs, relation de Pascal, symétrie, formules `C(n,2)`, `C(n,3)`) ; tirage simultané et probabilité ;
  chemins dans un quadrillage (avec point imposé ou interdit) et mots binaires.
- **Contrôle indépendant** : probabilités : énumération complète des issues (arbres, urnes, composants) ou loi binomiale exacte,
  comparée à la valeur lue dans chaque option affichée (les expressions avec `\binom` sont évaluées numériquement) ; dénombrement :
  on ne recalcule pas la formule, on **dénombre** (énumération de toutes les listes, permutations ou parties ; programmation
  dynamique « chaque élément est pris ou non » pour les groupes ; programmation dynamique sur la grille pour les chemins).
  `controle-banques.js` : 106 000 questions (cinq banques), 0 anomalie, erreurs volontaires détectées 6 350 / 6 350 (§10 : 81 600 questions sur sept banques, 8 149 / 8 149).
- **Défauts attrapés** : réponses fausses numériquement égales à la bonne (loi symétrique `B(n ; 1/2)`, loi à deux modes quand
  `(n+1)p` est entier, `P(X=6)=P(X=7)+P(X=8)` pour `B(13 ; 0,4)`, relation de Pascal et symétrie des coefficients binomiaux),
  affirmation « `P_A(B)=P_B(A)` » vraie aussi pour des événements incompatibles, décimaux en notation exponentielle (`1e-7`).
- **Variété** (énoncés distincts sur 3 000 tirages) : probabilités de 115 à plus de 2 000 ; dénombrement de 35 (parties, niveaux 1
  et 3) à plus de 500 ; les familles de dénombrement sur un petit univers (parties d'un ensemble à n éléments) restent limitées.
- **Essai navigateur** : 84 fiches tirées, plus de 5 000 formules, 0 erreur MathJax, pas de défilement horizontal sur téléphone.
- **Restent hors banque** : intégrales, trigonométrie, lecture graphique (figure), sommes en Python, loi géométrique et loi de
  Poisson (approfondissements).

## 10. Banques « Calcul intégral » et « Trigonométrie », codées le 18/10/2026

À la demande de David (« continue avec les intégrales et la trigonométrie »). Fichiers : `qcm-bac/banques/06-integrales.js`
(identifiant `integrales`) et `qcm-bac/banques/07-trigonometrie.js` (identifiant `trigonometrie`). La page pilote
`qcm-bac/fiche.html` charge maintenant **sept banques** (2 thèmes tirés au sort, ou `?theme=…` pour un seul).

- **Calcul intégral, 6 familles** : calcul d'intégrales (polynômes, `1/x`, `e^x`, `sin` et `cos` sur les intervalles usuels, `u'e^u`,
  `u'/u`, intégration par parties : `(ax+b)e^{±x}`, `ln x`, `x ln x`, `x sin x`…) ; valeur moyenne ; propriétés (Chasles, linéarité,
  encadrement par intégration d'une inégalité, quatorze affirmations vraies ou fausses) ; aires (entre la courbe et l'axe avec
  changement de signe, entre deux courbes, avec une unité graphique en cm²) ; suites d'intégrales (`∫ x^n e^x`, `∫ (ln x)^n`,
  `∫ x^n/(1+x)`, `∫ e^{-nx} sin x` : relation de récurrence, `I_0`, sens de variation, limite) ; dérivée d'une fonction définie
  par une intégrale, avec borne supérieure `x`, `x²`, `x+1`…
- **Trigonométrie, 7 familles** : valeurs exactes de `cos`, `sin`, `tan` (angles de la forme `kπ/6` et `kπ/4`, aussi hors de
  `[−π, π]`) ; équations et inéquations sur `[−π, π]`, `[0, 2π]` ou `[0, π]` (réponses en ensembles de réels, réunions
  d'intervalles) ; dérivées (composées, produits, quotients) ; parité et plus petite période ; extremum local, signe de `f'` et
  concavité de `f(x) = ax + b sin x`… ; limites (`sin(ax)/x`, `(1−cos x)/x²`, `x sin(a/x)`, gendarmes) ; formules (supplémentaires,
  duplication, addition, « laquelle est fausse ? ») et `sin x`, `cos 2x`, `sin 2x` connaissant `cos x` et l'intervalle.
- **Contrôle indépendant** : intégrales : l'intégrale est calculée **numériquement** (méthode de Simpson) à partir de l'intégrande et
  des bornes relus dans le LaTeX affiché, puis comparée à la valeur lue dans chaque option (`e-2`, `\dfrac{\pi}{2}-1`, `\ln 3`…) ;
  les affirmations sur les propriétés sont éprouvées sur des familles de fonctions et d'intervalles (contre-exemples numériques) ;
  les suites d'intégrales par intégration numérique de `I_n` ; trigonométrie : l'évaluateur LaTeX gère maintenant `\cos`, `\sin`,
  `\tan` ; valeurs, racines (y compris les racines tangentielles, `sin x = 1`), signe, plus petite période (minimum de l'erreur
  de périodicité raffiné) et limites sont recalculés numériquement.
- **Défauts attrapés** : valeur de l'aire entre `e^x` et `x+1` fausse (`e−3/2` au lieu de `e−5/2`, erreur de calcul à la main
  détectée par l'intégration numérique) ; base `ln 4` absente pour l'aire sous `e^x−4` ; candidats de dérivée égaux à la bonne quand
  `g(0)=0` ; ensembles `{π/3 ; −π/3}` et `{−π/3 ; π/3}` proposés comme deux réponses différentes ; période `2π/a` non réduite ;
  racines tangentielles ignorées par le contrôle ; `x ↦ tan x` proposée comme fonction impaire définie sur ℝ.
- **Variété** : intégrales de 15 (suites d'intégrales) à plus de 2 000 énoncés distincts ; trigonométrie de 25 (équations,
  limites) à plus de 800 en comptant les propositions. Plusieurs familles du niveau 3 restent à moins de 100.
- **Contrôle global** : `controle-banques.js` sur les sept banques : 81 600 questions, 0 anomalie, erreurs volontaires détectées 8 149 / 8 149.
- **Essai navigateur** : 84 fiches, plus de 5 800 formules, 0 erreur MathJax, pas de défilement horizontal sur téléphone.
- **Reste hors banque** : lecture graphique (figure), méthode d'Euler, fonction tangente en détail, approximation d'aire par suites
  adjacentes, trigonométrie en géométrie (`cos α = C'H/CH`).

## 11. Banques « Algorithmique et Python » et « Lectures graphiques », famille « sommes », élargissement (18/10/2026)

Deux nouvelles banques : `qcm-bac/banques/08-algorithmique.js` (identifiant `algorithmique`) et `qcm-bac/banques/09-lectures-graphiques.js`
(identifiant `lectures-graphiques`), plus la famille `sommes` dans `01-suites.js`. La page pilote `qcm-bac/fiche.html` charge maintenant
**neuf banques** (elle charge aussi `../automatismes/assets/graphiques.js` pour les figures ; 2 thèmes tirés au sort, ou `?theme=…`).

- **Algorithmique et Python, 4 familles** : `lecture` (que renvoie ce programme : sommes avec `for`, suites, seuils avec `while`, factorielle,
  Fibonacci, multiples, double boucle, Collatz, balayage, probabilités avec seuil…) ; `euler` (méthode d'Euler pour `y' = ay+b` :
  formule, rapport entre deux termes, code, code avec un pas `t`) ; `rectangles` (somme de rectangles : le programme calcule-t-il un
  minorant ou un majorant de l'intégrale ?) ; `completer` (condition de boucle, valeur retournée, somme, schéma d'Euler à compléter,
  les propositions étant des fragments de code). Le code s'affiche en bloc `<pre>`, les fragments en `<code>`.
- **Contrôle** : le programme Python affiché est **réellement exécuté** (`python3 -I`, délai 1,5 s, résultats mis en cache) ; pour
  « compléter », chaque proposition est insérée dans le gabarit et le programme obtenu est comparé au programme de référence sur
  plusieurs appels. Pour limiter le temps, le contrôle ne tire que 120 questions par famille et niveau pour cette banque.
- **Lectures graphiques, 2 familles** : `courbe-de-f` (nombre de solutions de `f(x)=k` avec la droite tracée, sens de variation,
  maximum ou minimum local, point d'inflexion, signe de `f`, tangente et `f'(a)`, encadrement d'une intégrale par les carreaux) ;
  `courbe-de-fp` (variations, extremum ou convexité de `f` d'après la courbe de `f'`, convexité ou point d'inflexion d'après la courbe de `f''`).
  Règle de lisibilité respectée : extremums, zéros et points d'inflexion sur des nœuds du quadrillage, courbe contenue dans la fenêtre,
  origine visible, droite de la tangente passant par deux nœuds. Les intervalles proposés comme réponse sont toujours des intervalles
  **maximaux ou sûrs** : un piège n'est jamais un sous-intervalle de la bonne réponse (ce serait une affirmation aussi vraie).
- **Contrôle des figures** : chaque question porte la formule de la fonction tracée (`drawTex`) et un échantillon des points du tracé ;
  le contrôle vérifie que le tracé suit la formule, reste dans la fenêtre, puis **recalcule** racines, signe, extremums, point
  d'inflexion, pente de la tangente (et que la droite tracée est bien la tangente), intégrale (Simpson) à partir de cette formule.
- **Famille `sommes` (suites, niveaux 1 à 3)** : valeur d'une somme géométrique ou arithmétique, forme close (`Σ q^k`, `Σ (ak+b)`,
  somme télescopique `Σ 1/(k(k+1))`), limite de `S_n` (raison `|q|<1`, `q>1`, `q=−1` sans limite), inégalité de Bernoulli et rang à
  partir duquel `1+na` dépasse un seuil. Le contrôle relit la somme **affichée** dans l'énoncé et la recalcule terme à terme.
- **Élargissement des familles courtes** (au niveau 3, 35 % des modèles viennent du niveau 2 ; au niveau 2, 25 % du niveau 1, pour
  les familles `fonctions` dérivées, primitives, limites, tangente, calcul) ; ajouts : neuf identités `ln`/`exp` (niveau 3), onze
  intégrandes et huit composées de plus pour `F(x)=∫ f(t)dt`, trois suites d'intégrales (`x^n e^{-x}`, `(1−x)^n e^x`,
  `x^n/(1+x²)`), dix modèles d'étude de `f'` en trigonométrie avec des intervalles `[0,2π]`, `[−π,π]`, `[−π/2,π/2]`, quatorze dérivées
  trigonométriques de plus, intervalles et inégalités strictes pour les équations trigonométriques.
- **Corrections au passage** : plusieurs dérivées trigonométriques étaient annoncées « définies sur ℝ » alors que la fonction ne l'est pas
  (`sin x / x`, `1/cos x`, `cos x/(1+sin x)`, `ln(sin x)`) : l'ensemble de définition est maintenant écrit.
- **Variété** (estimée sur 2 500 tirages, énoncés distincts, figure comprise ; avec les propositions différentes le nombre est plus grand) :
  la plupart des familles dépassent 100 ; restent plus courtes : `sommes` niveau 1 (96), `suites-integrales` niveau 3 (27 énoncés,
  200 avec propositions), `rectangles` niveau 3 (54 énoncés, 421 avec propositions), `formules` niveau 1 (2 énoncés mais ~700
  jeux de propositions), `valeurs` niveau 1 (36 énoncés, 358 avec propositions).
- **Contrôle global** : `controle-banques.js --mutation` sur les neuf banques : 44 160 questions, 0 anomalie, erreurs volontaires
  détectées 9 112 / 9 112. Nouveaux paramètres du contrôle : `--famille` et `--niveau`.
- **Essai navigateur** : thèmes `lectures-graphiques` et `algorithmique` : 42 fiches chacun, 0 erreur MathJax, pas de défilement horizontal
  sur téléphone, figures affichées avec leur bouton d'agrandissement.
- **Pas fait** : géométrie dans l'espace avec sphères (absentes des sources), fonction tangente en détail, approximation d'aire par suites
  adjacentes, trigonométrie en géométrie.

## 12. Mise en navigation (18/10/2026)

Sur demande de David : bloc ajouté à la barre de navigation (pastille « QCM Bac » (devenue « QCM Terminale » en anthracite clair le 25/10/2026, sur tous les appareils) dans les 26 pages à en-tête standard, CSS
`.nav-vedette-anthracite` (ex-`.nav-vedette-ambre`), resserrement des liens sous 400 px pour que les quatre liens et l'icône de profil tiennent sur une ligne à
360 px), carte anthracite (ex-ambre) sur l'accueil, page `qcm-bac/index.html` (fiche à deux thèmes tirés au sort + les neuf thèmes), fil d'Ariane et
barre « Sommaire » sur `qcm-bac/fiche.html`, `nav-auth.js` et `statistiques.js` chargés. Accès libre à tous les élèves (aucune
condition de classe ni de compte). Fusion dans `master` : à la demande de David seulement.

## 13. Devoirs (18/10/2026)

Un devoir « QCM Bac » s'attribue depuis `tableau-de-bord/devoirs.html` (type « QCM Bac ») : document `devoirs/{id}` avec `type:'automatismes'`,
`cible:'qcm-bac'`, `themes`, `niveau`, `mode`, `duree` (chrono), `nbEssaisMax`, `echeance`, `classe`. La fiche `qcm-bac/fiche.html` se verrouille
dessus (comme `automatismes/premiere/fiche.html`), enregistre la tentative en points sur 10 (1 point par bonne réponse, −0,25 point par erreur au
niveau 3, note ≥ 0) dans `eleves/{uid}/devoirsTentatives`, garde un brouillon en mode fiche et affiche les fenêtres « dernière tentative », « essais
épuisés », « échéance passée ». La vue « Résultats » et `/mes-devoirs/` affichent déjà `score / total` : sans changement. Le filtre par cible
(`devoirAutomatismeActif('qcm-bac')`) empêche un devoir QCM Bac de verrouiller une page de Première. **Non testé avec Firebase** (impossible
depuis la session cloud) : à valider avec `demo-eleve`.

## 14. Sujet blanc (18/10/2026)

Demande de David : un bouton « sujet blanc » comme pour les automatismes de Première, mêlant plusieurs thèmes mais pas tous (trois ou quatre).
`qcm-bac/sujet-blanc.html` : **12 questions, quatre thèmes tirés au sort parmi neuf (trois questions par thème)**, ordre mêlé, 1 point par
question (niveau 3 : −0,25 par erreur, note ≥ 0), note sur 12, thème et méthode de chaque question masqués jusqu'à la correction (options du moteur
`masquerEtiquette` et `detailParTheme: false`), bandeau « Ce sujet couvre : … » ; le moteur ne propose plus « Nouvelle fiche (mêmes thèmes) » quand
`masquerEtiquette` est actif. Réglages dans le script de la page : `nbThemes: 4`, `nb: 12` (pour 3 thèmes et 4 questions chacun : `nbThemes: 3`).
Devoir : type « Sujet blanc QCM Bac » du formulaire d'attribution (`cible:'qcm-bac-sujet'`, niveau, mode, durée, essais, échéance, sans choix de
thèmes : les quatre thèmes sont retirés au sort à chaque tentative), lien `/qcm-bac/sujet-blanc.html` dans « Mes devoirs ». Testé en navigateur avec
des fonctions de suivi simulées (8 bonnes sur 12 → 8 / 12 enregistré) ; non testé avec Firebase.
