# Règles de rédaction des fiches de calcul

**À lire avant de modifier une fiche** (`cahiers/{seconde|premiere}/cahier-N/fiche-NN.html`).
Ces règles ont été données par David au fil des sessions ; elles s'appliquent
sur les deux machines (PC pro et PC perso). Le détail de chaque décision est
dans `HISTORIQUE.md` ; ce fichier n'en garde que la règle et sa raison.
**À mettre à jour** dès que David donne une nouvelle consigne générale (pas
les corrections ponctuelles d'une fiche).

## 1. Longueur des fiches

- **4 exemples au maximum par calcul.** Plusieurs calculs qui traitent la même
  chose (numérotés (I)/(II), variantes de titre — entier / rationnel /
  irrationnel —, consigne identique) sont fusionnés en **un seul**, plafonné
  à 4 exemples au total (pas 4 par calcul d'origine). Seul un calcul
  qualitativement à part (autre compétence, ou nettement plus avancé que
  toute la gradation) reste séparé.
  *Exceptions : décidées par David uniquement* (ex. Première fiche 5, 5.8
  « Signe de la dérivée », 5 exemples). Ne jamais dépasser 4 de sa propre
  initiative ; si un ajout demandé fait passer à 5, le faire et le signaler.
- **Choix des exemples gardés** : un « classique », puis des « délicats » qui
  ajoutent **une seule difficulté à la fois** (écarter ceux qui en cumulent
  plusieurs) ; si les exemples couvrent des familles différentes, garder un
  représentant de chaque famille. Forcer par le tirage les variantes qu'un
  hasard pourrait sauter (signe d'un coefficient, pente fractionnaire…).
- **Problèmes à étapes** : un problème guidé en plusieurs étapes dépendantes
  (« En déduire », « à l'aide de la question précédente ») n'est pas une
  liste d'exemples — le garder entier, ne pas le fusionner. Deux problèmes
  guidés numérotés sur le même thème : n'en garder qu'un, **le plus
  complet**. Deux petits (I)/(II) ayant chacun leurs propres données : David
  a choisi de les laisser (fiches 18, 19, 20 de Première).
- Chaque réduction est expliquée dans `HISTORIQUE.md` (gardé, retiré,
  pourquoi, nouveau nombre de questions).

## 2. « Quelques automatismes »

- **6 questions au maximum** (tous calculs du bloc confondus), réparties selon
  le vrai gradient de chaque calcul, pas à parts égales par défaut.
- **Diversifiés** (règle posée sur la fiche 5 de Première, à appliquer aux
  suivantes) : pas que du calcul numérique, mais aussi équations, inéquations
  produits et quotients. Dans chaque fiche :
  - une **inéquation du premier degré**, coefficients de signe quelconque ;
  - **une seule** inéquation produit **ou** quotient (« il y en aura d'autres
    dans les fiches suivantes ») ;
  - des **équations** de types variés ;
  - du **calcul numérique**, mais de natures différentes (pas deux calculs du
    même genre).
- Faire **tourner** les types d'une fiche à l'autre. Modèles :
  - fiche 5 : inéquation degré 1 + inéquation produit ; équation produit +
    équation quotient = k ; fraction de puissances + image d'un irrationnel ;
  - fiche 6 : inéquation degré 1 (avec parenthèses) + inéquation quotient ;
    équation du second degré + équation du premier degré à fractions ; calcul
    fractionnaire avec priorités (fraction irréductible) ; développer.

## 3. Titres et énoncés

- **Forme imposée mise en valeur** : dans un titre, la seule expression qui
  impose la forme de la réponse (« sous forme de fraction irréductible »,
  « sous la forme d'un intervalle ou d'une réunion d'intervalles », « sous
  forme simplifiée lorsque cela est possible », « selon les puissances de x »…)
  est entourée de `<span class="titre-mise-en-valeur">…</span>` : **bleu foncé
  #3A36A0, même taille** que le titre (un orange agrandi a été refusé). Jamais
  le verbe d'action seul, ni un simple titre de thème. Règle CSS présente dans
  toutes les fiches : `.calcul-titre .titre-mise-en-valeur { color: #3A36A0; }`.
  Exception voulue : ce qui est déjà expliqué dans le bouton « ? » (ex.
  « l'équation réduite »).
- **Une consigne ne se répète pas, elle se factorise** : ce qui est commun à
  toutes les questions d'un calcul (« Calculer », « Déterminer α tel que »,
  « sur ℝ », « sous la forme y=ax+b »…) est dit **une fois**, dans le titre
  ou le paragraphe d'introduction — pas au début de chaque question. Le
  format de réponse est déjà expliqué par le bouton « ? » et le texte grisé
  du champ.
- **Pas de « (I) » seul** : un suffixe (I)/(II)/(III) disparaît dès qu'il ne
  reste qu'un exercice de ce type sur la fiche (un « (II) » resté seul non
  plus).
- **Notation mathématique toujours en LaTeX** `\(…\)`, titres compris :
  \(f'(x)\), \(x\in\mathbb{R}\), noms de points, droites et vecteurs, réels,
  intervalles. Intervalles et coordonnées avec un **point-virgule** :
  \(]0;1[\), \((-\frac{3}{2};9)\).
- Un calcul à **une seule question** : pas de lettre a), carte pleine largeur
  (`question-seule`) ; énoncé long : option `pleineLargeur`. Pas de « = »
  ajouté après une phrase ou une question (`sansEgal:true`).
- Le titre doit correspondre aux réponses acceptées (ex. « vraies ou
  fausses ? » si la correction attend vrai/faux).

## 4. Réponses, corrections, tirages

- **Forme imposée contrôlée**, pas seulement l'égalité numérique (ex.
  `estFractionIrreductible`, `formePuissance2`, racines simplifiées, « y= »
  exigé, forme factorisée). Hors forme imposée, toute écriture équivalente est
  acceptée.
- **Lectures graphiques : marge de ±0,2** sur toute réponse numérique lue sur
  un graphique (les élèves lisent sur téléphone) : `margeLecture:0.2`, et
  l'aide « ? » le dit. Les valeurs simplement écrites sur une figure (effectifs,
  pourcentages, probabilités d'un arbre) ne sont pas des lectures.
- **Équations : réponses sous forme d'ensemble** `{a;b}` (`{}` si aucune
  solution) ; `{2}`, `2` et `x=2` sont acceptés pour une solution unique.
  Inéquations : intervalle ou réunion d'intervalles ; **l'infini n'est jamais
  inclus** (crochets ouverts).
- **Une droite s'écrit y=mx+p** (y compris une horizontale : « y=k », pas
  « donner juste k »).
- **Le corrigé affiché doit être lisible et exact** : pas de « 3/4 × x² »
  (écrire 3x²/4), pas de « (−3)/2 » (écrire −3/2), pas de signe moins mis en
  facteur inutilement, pas de parenthèses inutiles (« (4x) », « (x)² »), pas
  de valeur décimale approchée (écriture exacte : √, π, `correctionLatex`).
- **Énoncés propres** : fractions irréductibles et signe devant la fraction
  (sauf si réduire fait partie de l'exercice) ; jamais « +0 », « 1x »,
  « 0x », « +- », « ^{1} », expression non simplifiée par accident.
- **Tirages dégénérés exclus** : fonction constante, h(x)=f(x), réponse
  toujours nulle par construction, même expression des deux côtés, options
  de QCM en double, élément répété dans un ensemble, valeur interdite qui
  serait la solution, dénominateur qui s'annule là où la question suppose
  le contraire.

## 5. Vérification avant de pousser

1. Vérificateur de syntaxe des 50 fiches :
   `node outils/verification/verifier-syntaxe-fiches.js` (0 erreur attendue).
2. Liste des `id` générés conforme au plan, cohérente avec `groupes` et avec
   l'ordre des grilles.
3. Plusieurs centaines de tirages comparés à un **calcul indépendant** (dérivée
   numérique, signe sur une grille + bornes exactes, racines…), pas à la
   réponse elle-même ; balayage des énoncés à la recherche des défauts du §4.
4. **Cycle complet dans le navigateur** : chaque corrigé affiché, retapé dans
   le vrai champ, doit être accepté (N/N) ; une réponse fausse ou mal formée
   doit être refusée.
5. **Relire le panneau « Voir toutes les réponses »** : N lignes, aucune erreur
   MathJax, écritures lisibles (§4).
6. Capture d'écran pour ce qui ne se voit qu'à l'œil (titres en double,
   lettres manquantes, débordement d'une formule hors de sa carte, cadre gris
   des calculs avancés).
7. Entrée datée à la fin de `HISTORIQUE.md` (et mise à jour de
   `SUIVI-FIREBASE.md` si l'état ou un piège change), commit, push.

Les pièges techniques (identifiants, brouillons, MathLive, scripts…) sont
résumés dans `SUIVI-FIREBASE.md`, §7.
