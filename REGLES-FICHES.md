# Règles de rédaction des fiches de calcul

**À lire avant de modifier une fiche** (`cahiers/{seconde|premiere}/cahier-N/fiche-NN.html`).
Ces règles ont été données par David au fil des sessions ; elles s'appliquent
sur les deux machines (PC pro et PC perso). L'historique détaillé de chaque
décision est dans `SUIVI-FIREBASE.md` ; ce fichier n'en garde que la règle
et sa raison. **À mettre à jour** dès que David donne une nouvelle consigne
générale (pas les corrections ponctuelles d'une fiche).

## 1. Longueur des fiches

- **4 exemples au maximum par calcul.** Plusieurs calculs qui traitent la même
  chose (numérotés (I)/(II), variantes de titre, consigne identique) sont
  fusionnés en un seul, plafonné à 4 exemples au total.
  *Exceptions : décidées par David uniquement* (ex. Première fiche 5, 5.8
  « Signe de la dérivée », 5 exemples). Ne jamais dépasser 4 de sa propre
  initiative ; si un ajout demandé fait passer à 5, le faire et le signaler.
- **Choix des exemples gardés** : un « classique », puis des « délicats » qui
  ajoutent **une seule difficulté à la fois** ; si les exemples couvrent des
  familles différentes, garder un représentant de chaque famille. Forcer par le
  tirage les variantes qu'un hasard pourrait sauter (signe d'un coefficient…).
- Un **problème guidé en plusieurs étapes** n'est pas une liste d'exemples :
  le laisser entier.
- Chaque réduction est expliquée dans `SUIVI-FIREBASE.md` (gardé, retiré,
  pourquoi, nouveau nombre de questions).

## 2. « Quelques automatismes »

- **6 questions au maximum** (tous calculs du bloc confondus).
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

## 3. Titres des calculs

- **Forme imposée mise en valeur** : dans un titre, la seule expression qui
  impose la forme de la réponse (« sous forme de fraction irréductible »,
  « sous la forme d'un intervalle ou d'une réunion d'intervalles », « sous
  forme simplifiée lorsque cela est possible », « selon les puissances de x »…)
  est entourée de `<span class="titre-mise-en-valeur">…</span>` : **bleu foncé
  #3A36A0, même taille** que le titre (un orange agrandi a été refusé). Jamais
  le verbe d'action seul. Règle CSS présente dans toutes les fiches :
  `.calcul-titre .titre-mise-en-valeur { color: #3A36A0; }`.
  Exception voulue : ce qui est déjà expliqué dans le bouton « ? » (ex.
  « l'équation réduite »).
- **Pas de « (I) » seul** : un suffixe (I)/(II)/(III) disparaît dès qu'il ne
  reste qu'un exercice de ce type sur la fiche.
- Pas de lettre a) quand un calcul n'a qu'une question (géré par
  `construireGrilles`).

## 4. Corrections et réponses

- **Lectures graphiques : marge de ±0,2** sur toute réponse numérique lue sur
  un graphique (les élèves lisent sur téléphone) : `margeLecture:0.2`, et l'aide
  « ? » le dit. En Première, le drapeau doit être **dans l'objet renvoyé par
  `gen()`** (ces fiches ne recopient que `id` et `type` du générateur).
- Une forme imposée dans le titre est **contrôlée** (ex.
  `estFractionIrreductible`, `formePuissance2`, « y= » exigé), pas seulement
  l'égalité numérique.
- **Le corrigé affiché doit être lisible** : pas de « 3/4 × x² » (écrire
  3x²/4), pas de « (−3)/2 » (écrire −3/2), pas de signe moins mis en facteur
  inutilement, pas de parenthèses inutiles (« (4x) », « (x)² »).

## 5. Vérification avant de pousser

1. Vérificateur de syntaxe des 50 fiches :
   `node outils/verification/verifier-syntaxe-fiches.js` (0 erreur attendue).
2. Plusieurs centaines de tirages comparés à un **calcul indépendant** (dérivée
   numérique, signe sur une grille + bornes exactes, racines…), pas à la
   réponse elle-même.
3. **Cycle complet dans le navigateur** : chaque corrigé affiché, retapé dans
   le vrai champ, doit être accepté (N/N) ; une réponse fausse ou mal formée
   doit être refusée.
4. **Relire le panneau « Voir toutes les réponses »** : N lignes, aucune erreur
   MathJax, écritures lisibles (voir §4).
5. Capture d'écran pour ce qui ne se voit qu'à l'œil (titres en double, lettres
   manquantes, cadre gris des calculs avancés).
6. Entrée dans `SUIVI-FIREBASE.md`, commit, push.

## 6. Pièges techniques

- Les **identifiants** de questions (`"5.3 a)"`) sont positionnels et stockés
  dans Firestore (résultats, brouillons) : après une réorganisation, renommer
  les ids, recalculer `groupes`, et exiger dans la reprise de brouillon la même
  liste d'ids (`brouillon.exercices.every((e, i) => e.id === exercices[i].id)`).
- Tout état tiré au hasard **hors** du tableau `exercices` (graphiques, textes
  d'introduction, fonction d'un titre) doit être sauvé avec le brouillon
  (`etatSupplementairePourBrouillon` / `restaurerEtatSupplementaire`), ou mis
  dans l'énoncé de la question elle-même.
- Les fiches n'ont pas toutes les mêmes outils : par exemple, les fractions
  sont une fonction `F(n, d)` en fiche 5 de Première, un objet `F.of`, `F.add`…
  en fiche 6. Ne pas copier du code d'une fiche à l'autre sans l'adapter.
- Scripts de modification contenant des antislashs : les écrire avec un
  fichier (pas un heredoc shell, qui en mange une partie).
- Les scripts de travail ponctuels restent dans `.claude/scratch/` (ignoré par
  Git) : déjà appliqués, ils ne doivent pas être relancés.
