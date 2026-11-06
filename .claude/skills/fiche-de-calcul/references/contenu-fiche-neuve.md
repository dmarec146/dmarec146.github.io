# Ce qu'une fiche de calcul neuve doit contenir

Condensé (vérifié le 06/11/2026 sur `cahiers/terminale/cahier-3/fiche-06.html`) des conventions de structure et des
correctifs « à l'échelle du site » de la mémoire de portage de septembre 2026. Historique détaillé des correctifs :
archive `Documents\sauvegardes-site\memoire-2026-11-06\feedback_fiche_port_methodology.md` et `HISTORIQUE.md`.
Règle de départ : **partir de la dernière fiche validée du même niveau** (aujourd'hui `fiche-06.html` de Terminale) et
comparer son CSS et ses scripts à ceux de la fiche écrite avant d'écrire le corps, pas après. Une ancienne fiche peut
manquer d'un des éléments ci-dessous ; la présence d'une fonction voisine ne prouve pas qu'elle est à jour
(`necessiteAide` ne dit rien sur `injecterAideGroupe`).

## 1. En-tête de la page

- Scripts, dans cet ordre (versions `?v=` à laisser comme dans la fiche modèle) : `haut-fiche-telephone.js` (juste après
  la balise viewport) ; math.js 12.4.0 ; `suivi.js` ; MathJax 3.2.2 `tex-mml-svg` ; **MathLive épinglé `0.111.0`** (ne pas
  changer sans repasser `outils/audit-claviers/`) ; `claviers.js` ; `formules-proba.js` (seulement si type `formule`) ;
  `qcm-clic.js` ; `moteur-reponses.js` ; `devoir-partiel.js` ; `bareme.js` ; `details-correction.js` (+
  `details-second-degre.js` si second degré) ; `nav-auth.js` ; `statistiques.js` ; `pied-droits.js`.
  `widgets-saisie.js` seulement si la fiche contient un widget (tableau de signes, de variations…). → RF §4.
- **Configuration MathJax `startup: { typeset: false }`** : par défaut MathJax compose tout seul au chargement et entre en
  concurrence avec l'appel explicite de la fiche (`Cannot read properties of null (reading 'replaceChild')`, contenu non composé).
- **Clavier AZERTY** : `if (window.MathLive && window.MathLive.setKeyboardLayoutLocale) MathLive.setKeyboardLayoutLocale('fr');`
  tout en haut du script principal (avant `function alea`). Sans cela, la touche `^` (touche morte du clavier français) déclenche
  parfois une fraction au lieu d'un exposant. Présent dans la fiche 6 de Terminale ; ne jamais supposer qu'il est hérité.
- **CSS MathLive** : `--selection-background-color: rgba(75,70,199,0.18)` ET `--selection-color: #1a1a1a`
  (sans cela l'emplacement vide actif est un bloc bleu opaque, ou blanc sur blanc donc invisible) ;
  `--contains-highlight-background-color: transparent` ; touches `menu-toggle` et `virtual-keyboard-toggle` masquées
  sur `.q-mathfield`.
- **Comparer le CSS** de la fiche modèle : `.bloc-general`, `.bloc-avance`, `.picto-niveau` (conteneur vide conservé : le
  bouton « ? » d'aide y est inséré par JavaScript), `.calcul-titre{display:flex;justify-content:space-between}` +
  `.picto-niveau{margin-left:auto}`, `.titre-mise-en-valeur {color:#3A36A0}`. Pas de soulignement sous `.calcul-titre`.
  `min-width: 0` sur `.question`. Deux blocs « barre de contrôle » ne doivent pas être scindés. → RF §3.
- Une fiche non encore ouverte au public porte `noindex` ; il est retiré à la mise en ligne (voir `SUIVI-FIREBASE.md`).

## 2. Structure du corps

- Trois sections : **Automatismes** dans `<div class="bloc-general">` (fond bleu clair), **cœur** SANS conteneur (fond de
  page), **Calculs plus avancés** dans `<div class="bloc-avance">` (fond gris, court, 2 à 3 groupes en fin de fiche).
  Les envelopper dans un seul `bloc-general` étend le bleu à toute la page. (L'ancienne règle « lire la limite dans le
  remplissage de `picto-niveau` » est caduque : les triangles ont été retirés le 30/10/2026, REGLES-FICHES §3.)
- Chaque groupe : `<p class="calcul-titre">` d'abord, puis (après lui) `.rappel-formule` et paragraphes d'énoncé. → RF §3 bis.
- Titre d'un calcul : la forme imposée entourée de `titre-mise-en-valeur` ; consigne commune dite une fois. → RF §3.
- **Aide « ? » par GROUPE** (`texteAideGroupe` / `injecterAideGroupe` / `toggleAideGroupe`), jamais par question : le bouton
  va dans le `<span>` de texte du titre (`span:not(.picto-niveau)`), pas dans `.picto-niveau` ni dans le `<p>` flex ;
  `injecterAideGroupe` remonte les frères précédents pour trouver le vrai `.calcul-titre` et reste idempotent
  (garde `titre.querySelector('.q-aide-btn')`) ; `texteAideGroupe` concatène les indications de tous les types du groupe
  en disant à quelle sous-question chacune s'applique (et ne s'arrête pas à la première correspondance). L'aide dit ce
  qu'il faut écrire, jamais ce qui est refusé. → RF §4.
- Sous la grille : boutons Vérifier / Voir la correction des erreurs / **Voir toutes les réponses** (panneau
  `toutes-reponses-panneau`, **à réinitialiser** — masqué et texte du bouton rétabli — dans `reinitialiser()` ET
  `genererNouvelleFiche()`, sinon il montre les réponses du tirage précédent).
- Figures : `activerZoomSvg(conteneur)` appelé à la fin de chaque fonction qui construit un graphique (la modale retire
  `class`, `style`, `width`, `height` du clone).
- `mettreAJourTextesAvances()` présent et rappelé après chaque régénération (paragraphes et titres qui citent des données).
- Calcul à une question : sans lettre a), carte pleine largeur ; énoncé long : `pleineLargeur`. `lettresEtendues` assez
  long pour le plus grand groupe. → RF §3.
- Questions à choix : cliquables et centrées (`qcm-clic.js`, vérifié par `outils/qcm-clic/audit.html`). → RF §4.

## 3. Moteur de réponse et d'affichage

- `normaliserSaisie` (vérifié dans la fiche 6 de Terminale) : `√` → `sqrt`, `∗ × ·` → `*`, virgule décimale entre deux
  chiffres, `*` inséré entre identifiant et `(` (sauf noms de `FONCTIONS_CONNUES`), `*` inséré entre `)` et une lettre,
  `xe^` lu `x*e^`. `valeurDuChamp` (lecture du champ MathLive) normalise lettres grecques, indices, primes `f'`. À
  comparer à la fiche modèle : regroupement des noms de fonction tapés lettre à lettre (lookbehind `(?<![a-zA-Z])`),
  valeur absolue `|…|` (non lue par math.js), exposants de plusieurs caractères. Liste `vars` de `checkEqualNumeric`
  complète (`n`, `p`, `q`…).
- Aucune séparation `[;,]` ambiguë : virgule = décimale, point-virgule = séparateur.
- **Formes de réponse** : la table `outils/moteur-reponses/formes-par-fiche.json` puis `node outils/moteur-reponses/cabler-fiches.js`
  pour tout titre qui dit simplifier / développer / factoriser / calculer / « sous la forme ». → RF §4.
- **Corrigé affiché** : `formaterReponse(ex)` = `adoucirAffichage(formaterReponseBrut(ex))` (copier le bloc de la fiche
  modèle) ; branches pour chaque `type:` employé ; jamais `undefined`.
- `jsVersLatex` : passer par `math.parse(normaliserSaisie(s)).toTex({parenthesis:'auto', implicit:'hide'})` plutôt que
  par des expressions régulières ; les conventions propres au site (jetons `an`/`a1`…) se traitent sur la SORTIE de
  `toTex()`, car `_` n'est pas valide avant l'analyse ; un `;` brut serait lu comme séparateur d'instructions (traiter les
  éléments d'un ensemble un à un). Fractions toujours en `\dfrac` ; ensembles avec vraies accolades (`ensembleVersLatex`).
- Couples / triplets : `(a;b)`, parenthèses et ordre contrôlés ; point `A(x;y)` avec `formePoint` ; droite `y=mx+p` avec
  `formeYax` ; vecteurs avec `formeVecteur` (flèche `\overrightarrow{}` lue en LaTeX). → RF §3, §4.
- Détails de correction : `detail: {lignes, final}` par exercice, `Detail.preparer(ex)`, `Detail.html(ex, idx)`. → RF §8.
- Barème (uniquement en devoir) : `outils/bareme/README.md`. → RF §4.
- Une fiche d'un niveau relié au site : entrée dans `assets/js/manifeste-fiches.js` puis `verifier-manifeste.js`. → RF §5.

- Le moteur d'affichage de la fiche modèle contient déjà `protegerVariables` / `restaurerVariables` (`VARS_A_PROTEGER`),
  `collerCoefficientLettre`, `texteAideGroupe` à fusion étiquetée, `checkEquationYax` : ne pas les réécrire, les conserver
  tels quels (raisons et pièges : `bugs-generateur.md` §G).
- Tout type de réponse nouveau est un `<math-field>` (`TYPES_MATHFIELD`) ; un `<input>` simple seulement pour du texte.

## 4. Pièges de modèle de données à garder en tête

- `pa` / `pb` gardent le sens « ce qui est vérifié » partout ; un nouveau mode reçoit un champ distinct (`cibleXY`).
- Un groupe fusionné ou réduit à un exemple : id sans lettre et retrait du `...` (spread) dans `genererExercices()`.
- Les fiches ayant un devoir en cours ne sont pas modifiées sans l'accord de David.
- Équation réduite d'une droite : drapeau `equationReduite:true` + `checkEquationReduite()` (saisie commençant par `y=`, aide « ? »
  qui explique pourquoi « 2x-3 » seul est refusé, placeholder `y=mx+p`, `reponseLatex` préfixé `y=`) ; point d'intersection :
  `…, s'il existe`, `peutEtreSansPoint` / `aucunPoint` / `checkPointOuAucun16`, réponse « aucun » acceptée seulement dans ce cas
  et annoncée dans l'aide. Modèle à porter : `cahiers/seconde/cahier-5/fiche-16.html`.
- Point final : nettoyage central dans `genererExercices()` (`ex.enonce.replace(/\.\s*$/, '')`) ; les consignes de groupe
  (`contexteTexte`) gardent leur point.
- Fiche de style « automatismes avec révisions » (Seconde, fiche 14 et suivantes) : vivier de révisions (`MODELES_REVISION`)
  tiré comme `MODELES_CALCUL` (`melanger(...).slice(0, N)`) en tête de `genererExercices()` ; titre neutre « Calcul X. ».
- Lire `SUIVI-FIREBASE.md` §7 pour les pièges techniques (identifiants, brouillons, MathLive, scripts).

## 5. Leçons de contenu retenues (puissances, tableaux de signes, vecteurs)

- Fiche de puissances : les exemples à une seule base sont de l'échauffement (2 ou 3), puis un groupe de simplifications à
  plusieurs bases (deux bases premières, base composée `6^m = 2^m×3^m`, puissance d'un produit littéral sur un monôme, coefficient
  mêlé à la lettre).
- Un objet standard nommé par la fiche (tableau de signes…) se CONSTRUIT par l'élève (widget) ; convention visuelle jamais
  vue tracée : demander un exemple à David avant de deviner ; poser les décisions de conception d'un widget nouveau à David
  avant de coder (`AskUserQuestion`, une recommandation par question). → RF §3 bis.
- Fiche de vecteurs : outils `pcVec` / `pcAdd` / `pcScale` / `pcToSingleVec` / `vecTerm` / `chaslesEnonceLatex` /
  `randomLettres` de la fiche 21 de Première (voir l'archive et `cahiers/premiere/` avant de réécrire quoi que ce soit).
