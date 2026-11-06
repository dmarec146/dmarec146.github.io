# Défauts à chasser dans une fiche de calcul (génération, réponses, affichage)

Liste condensée (une ligne par défaut) de la mémoire « méthode de portage » de septembre 2026 : plus de 70 classes de
défauts réellement rencontrées sur les 40 premières fiches. Le texte intégral, avec les fiches concernées et les cas
détaillés, est archivé dans `Documents\sauvegardes-site\memoire-2026-11-06\feedback_fiche_port_methodology.md`.
Les règles de rédaction voulues par David sont dans `REGLES-FICHES.md` (renvoi « → RF §n »).

**Principe commun** : un contrôle d'auto-cohérence (la réponse stockée acceptée par le correcteur) ne voit PAS ces
défauts. Seuls les voient : le recalcul indépendant à partir de l'énoncé affiché, le balayage de plusieurs centaines
de tirages, la saisie réelle dans le champ MathLive, et la relecture à l'œil du rendu.

## A. Tirages (générateur)

1. **Tirage dégénéré** : une différence de deux tirages (`r²−h²`, `bA−aA`) peut valoir 0 et casser une division ou un
   affichage → boucle de rejet explicite, jamais « ça n'arrivera probablement pas ».
2. **Boucle de rejet qui ne redessine rien** : les variables dont dépend la condition doivent être tirées DANS la boucle ;
   sinon la boucle ne se termine jamais (page figée, parfois pris pour une « erreur interne » de l'outil de test).
3. **Condition de rejet portant sur une valeur tirée plus haut** (ex. deux points A = B tirés avant la boucle : le
   déterminant est nul pour tout redessin) → garder le tirage amont. Pour trouver un blocage : compteur
   `window.__progress` lu depuis un autre appel d'outil.
4. **Garde du mauvais dénominateur** : copier dans la garde l'expression exacte du dénominateur utilisé (`By-Ay`, pas `Bx-Ax`).
5. **Fraction affichée à partir de deux tirages indépendants** sans `pgcd = 1` (« 8/2 », « 3/3 ») : recenser d'un coup
   tous les couples p/q de la fiche ; une capture d'écran ne montre qu'un tirage. → RF §3 bis.
6. **Réducteur maison** (`fracStr`) : ne lève pas d'erreur sur d = 0, il renvoie `"-3/0"`. Balayer toutes les
   chaînes stockées (`reponse`, `pa`, `pb`, `enonce`…) sur ~500 tirages pour `/0`, `NaN`, `Infinity`, `undefined`.
7. **`NaN` passe un test de différence** (`Math.abs(NaN−x) > seuil` est faux) : tester `Number.isFinite` des deux côtés.
8. **Forme close valable seulement sur un domaine** (racine carrée toujours ≥ 0, `u_n = n + c` seulement si `n + c ≥ 0`) :
   simuler la définition de l'énoncé sur beaucoup de tirages, pas la formule du générateur.
9. **Résoudre `x² = EXPR`** : vérifier par substitution que `EXPR ≥ 0` (le tirage peut imposer l'inégalité inverse) ;
   la racine d'un négatif ne lève pas d'erreur, elle donne un terme au signe faux.
10. **Radicande dérivé** (`D−1`) devenant un carré parfait alors que `D` n'en est pas un : exclure les carrés parfaits
    pour CHAQUE radicande calculé ; passer l'affichage par `simplifierRacine`.
11. **Intervalle imposant un seul signe** (sin/cos) : choisir d'abord le quadrant, puis déduire les DEUX signes de la
    même ligne de table, jamais un signe tiré à part.
12. **Cible à atteindre dans un ensemble fini** (vecteur entre points d'une grille) : construire par une chaîne de
    Chasles (toujours dans l'ensemble) plutôt que tirer des paramètres puis tester l'atteignabilité.
13. **Étude de signe d'un produit/quotient** : échantillonner un point-test par région entre les seuils triés, ne pas
    dériver à la main une règle de parité.
14. **Un seul pas de résolution partagé** (`résoudre ax+b = k` en fractions exactes `math.fraction`) couvre souvent
    toutes les « variantes d'habillage » d'une fiche ; pas besoin d'imposer un dénominateur commun.
15. **Variété** mesurée, pas jugée à l'œil. → RF §4 bis.
15 bis. **Deux astuces de construction** : (a) multiplier toute une identité délicate par un entier aléatoire `m` donne de
    la variété sans toucher à la partie fragile ; (b) pour « exprimer u en fonction de v », tirer les coefficients de v et
    le rapport k, puis CALCULER ceux de u (au lieu de tirer les deux en espérant la proportionnalité).

## B. Énoncé et réponse stockée

16. **Énoncé affiché et réponse construits avec des valeurs différentes** (coefficient 1 implicite dans l'un, variable
    dans l'autre ; « − » codé en dur alors que la valeur peut être négative) : suivre une même valeur dans les deux chemins.
17. **Signe collé** (`+-`, `--`, `x--7`) : calculer la valeur signée d'abord (`${-p}`), jamais `` `-${p}` `` ni
    `x-${v}` quand `v` peut être négatif. Balayage : `/(--|\+-|-\+|\+\+)/`.
18. **Coefficient 1 / −1 non omis** (`1x`, `1n`, `1exp(`) : vérifier la forme AFFICHÉE (après `jsVersLatex`), sur
    `enonce` ET `reponse`/`pa`/`pb`.
19. **Opérateur orphelin** quand l'omission d'un coefficient ne laisse rien (`exp(*x^2`, `x^2x`) : le caractère fixe
    doit être dans la branche non vide du ternaire.
20. **Coefficient collé à une base numérique** (`${k}3^{n}` se lit « k3 ») : mettre `\times` ou l'omettre.
21. **Coefficient fractionnaire devant une lettre** (`5/2x`, ambigu à l'affichage) : parenthéser ou `\times`.
22. **Somme géométrique : signe inversé** (`K·rⁿ − K` au lieu de `K − K·rⁿ`) : deux attendus exactement opposés sur tous
    les tirages = erreur de signe ; chercher alors toutes les formes écrites à la main du même type. Utiliser
    `signedFracTerm`/`joinSigned` (ou équivalent) pour assembler des termes signés.
23. **Réponse qui répète la question** (`sum(k,a,b,…)` quand on demande « calculer ») : donner la forme close.
24. **Aide ou indication qui donne la réponse** (« répondre sous la forme … » interpolant la valeur stockée ; phrase
    exacte à écrire) : un format ne doit jamais révéler le résultat. → RF §3.
25. **Paramètre d'un problème de configuration** (point D, coefficient de relation) : le résoudre à partir de
    l'équation AFFICHÉE, jamais le choisir librement à côté des autres.
26. **Même nom de champ pour deux rôles** (`pa`/`pb` = coefficients affichés ET coordonnées à vérifier) : ajouter un
    champ distinct (`cibleXY`) plutôt que supposer la réutilisation sûre.
27. **Helper copié d'une fiche précédente avec une variable codée en dur** (`'x'`) : la réponse construite avec la mauvaise
    lettre ne lève rien et ne peut jamais valider la saisie de l'élève (`n`, `a`, `α`). Balayage : `math.evaluate(reponse,
    {a, n, x…})` sans « Undefined symbol » pour toute réponse `alg`/`num` ; donner au helper un paramètre de nom de variable.
    Même famille : la liste `vars` de `checkEqualNumeric` doit contenir TOUTES les lettres utilisées par la fiche (`n`, `p`,
    `q` manquaient en Seconde : toute réponse en `n` était comptée fausse en silence) — la vérifier avant le premier exercice
    qui introduit une lettre nouvelle.
28. **Jeton interne** (`an`, `a1`…) utilisé dans `reponse` : prévoir la conversion inverse dans `jsVersLatex`
    (sinon la correction affiche `an/a1` au lieu de \(a_n/a_1\)).
29. **Helper ASCII dans un `enonce`** (`coefPrefixe`, `signedFracTerm`, `polyAsciiDesc`) : l'astérisque s'affiche. Dans un
    énoncé, toujours le jumeau LaTeX (`coefPrefixeL`, `fracTermLatex`…). Seule la relecture à l'œil le voit.
30. **Décimal LaTeX `0{,}3`** dans un texte non typographié (SVG `<text>`, cellule de tableau, titre) : afficherait les
    accolades → deux helpers (`decLatexFromFrac` pour `\(…\)`, `decPlainFromFrac` pour le texte brut).
31. **Virgule à double rôle** (séparateur de milliers `\,` puis `.replace(',', '{,}')`) : traiter les décimales avant les
    séparateurs, ou en un seul passage.
32. **Séparateur à double usage** (`;` liste et `,` décimale) : accepter la virgule décimale ET retirer la virgule
    séparateur dans TOUTES les fonctions qui découpent sur `[;,]` (`checkEnsemble`, `checkVecteur`, intervalles…).
    Coordonnées et intervalles : point-virgule, `]a;b[`. → RF §3.
33. **Double inégalité** : comparer aussi les opérateurs (`<` / `≤`), pas seulement les bornes numériques.
34. **QCM : faux distracteur** : tester sa non-équivalence à AU MOINS DEUX valeurs non dégénérées du paramètre.
35. **Réponse « texte libre »** : la tolérance à l'orthographe (Levenshtein par mot) doit exclure les mots courts, les
    quantificateurs / négations et les jetons mêlant lettres et chiffres.

## C. Rendu LaTeX / texte

36. **`texteLibre:true`** sur tout énoncé mêlant texte et `\(…\)` (sans quoi double enveloppe MathJax illisible).
    `texteLibreOption:true` insère l'option brute : envelopper soi-même le LaTeX. → RF §3 bis.
37. **Énoncé « texte libre » dont la formule est en Unicode brut** (`cos(x+π)`) : un fragment généré doit alors être en
    Unicode aussi (`√`, `π`), pas en `\sqrt`, `\pi` (barres obliques affichées). Même vérification pour un titre
    réécrit par `mettreAJourTextesAvances`. Regarder le texte d'ORIGINE de ce groupe, pas le style général de la fiche.
38. **Délimiteur `\(…\)` oublié sur un seul élément** d'un tableau d'énoncés (surtout les coordonnées entières `A(3;2)`,
    qui « ressemblent à du texte ») : chercher dans tout le fichier, pas sur deux ou trois exemples.
39. **Parenthèse fermante orpheline** après le dernier `\(…\)` d'un énoncé assemblé à la main.
40. **Lettres de vecteurs** nommées dans un titre ou un texte statique : enveloppées en `\(\vec{u}\)` / `\(\overrightarrow{AB}\)`.
41. **Texte mêlant LaTeX et nom de fonction nu** (« que vaut cos(x) ? ») : l'impression d'italique vient de là ; tout en LaTeX.
42. **`<` littéral dans un énoncé** inséré par `innerHTML` : lu comme balise, tout ce qui suit disparaît. Utiliser `\lt`.
43. **`\frac` → `\dfrac`** : balayage mécanique à faire sur toute fiche retouchée (invisible aux contrôles automatiques).
44. **Comparateur collé à une lettre** (`\geqslantx`) : MathJax avale la lettre ; balayage `mjx-merror, [data-mjx-error]`.
45. **Rappel de formule, paragraphes d'énoncé** : APRÈS le `<p class="calcul-titre">` de leur calcul. → RF §3 bis.
46. **Polynôme nommé** `P(x)=…` défini une fois. → RF §3.
47. **Consigne répétée** dans chaque item alors qu'elle est dans le titre. → RF §3.
48. **Tableau d'étiquettes `lettresEtendues`** trop court (le libellé devient vide : « ) » au lieu de « g) ») ; un groupe à
    un seul exemple : id sans lettre et retirer le `...` (spread) correspondant (sinon `TypeError`).
49. **Fiche sans `mettreAJourTextesAvances`** : les paragraphes de contexte gardent les anciens nombres tandis que les
    items n'en parlent plus. Vérifier qu'il existe et qu'il est appelé après chaque réécriture.
50. **Réécriture ultérieure de `textContent`/`innerHTML`** qui efface un bouton injecté (aide « ? ») : rendre l'injection
    idempotente et la relancer après chaque réécriture.
51. **Fonction graphique** dont un paramètre déstructuré (`([gx, lbl]) =>`) n'est jamais utilisé : étiquettes jamais tracées.
52. **`formaterReponse` sans branche** pour un `type:` réellement utilisé (`paire`, `eqcart`, `vecteur`, `triplet`, `type:'num'`
    qui ÉVALUE la réponse : détruit toute réponse dont la forme est demandée). Premier emploi d'un type = vérifier
    `formaterReponse`, `necessiteAide`, `aideContextuellePour`. Aucun `undefined` doit sortir de `formaterReponse`.

## D. Saisie (MathLive, claviers)

53. **`x(x+2)` rejeté** (math.js lit un appel de fonction) : `normaliserSaisie` insère `*` entre identifiant et `(` sauf
    nom de fonction connu (`exp, sqrt, sin, cos, tan, log, ln, abs, sum`) ; `sum` doit rester dans l'exclusion.
54. **Un identifiant de plusieurs lettres** ne survit pas à `getValue('ascii-math')` (`AB` → `A B`, `\overrightarrow{AB}` →
    chaîne vide) : lire `getValue('latex')` et écrire un contrôleur dédié.
55. **Nom de fonction tapé lettre à lettre** (`s u m(`, `e x p(`, `2s q r t(13)`) : le regroupement s'ancre avec un
    lookbehind `(?<![a-zA-Z])`, pas `\b`.
56. **`∗` Unicode** (touche `*` littérale) à reconvertir en `*` avant `math.evaluate` ; valeur absolue exportée en `|…|`
    (non lue par math.js) à traiter.
57. **Exposant de plusieurs caractères** (`2^12`) disloqué à la saisie (`2^1 2`) : prévoir exposants à un chiffre, ou
    saisie guidée / accolades.
58. **Placeholder `#@`** (« capture l'argument précédent ») avale le coefficient tapé juste avant : `#?` pour un bouton
    utilisable seul.
59. **Bouton-modèle** (Σ, Π, flèche vecteur) : tester le trajet complet bouton → champ → `getValue` → `verifierUne`,
    pas la fonction de contrôle sur une chaîne tapée à la main (trois fiches avaient 100 % d'échec).
60. **Clavier simplifié** : le comparer aux textes d'aide « ? » de la fiche (un symbole cité dans l'aide mais sans
    touche) ; lettres variables des types `paire`/`texte` (pas seulement `x`/λ). → RF §4.
61. **Politiques de parenthèses** incohérentes entre `checkPaire`, `checkTriplet`, `checkPointCoordonnees`, `checkVecteur` :
    un couple s'écrit `(a;b)`, contrôlé. → RF §3.
62. **Frappe de test** : voir `reference_audit_claviers_frappe_physique` (action `key`, pas `type`) ; remplir un champ avec
    la chaîne interne (`sqrt(`, `an/a1`, `lam`) donne de faux échecs : remplir avec le LaTeX réel.
63. **Widgets** (tableau de signes…) : câblés au contrôle « au fur et à mesure » ; aucun élément non interactif calculé
    depuis les données ne doit trahir la réponse ; règles acquises à re-vérifier après toute refonte ; anciennes gardes à
    supprimer quand le modèle de données change ; garder `input-IDX` partout où le code suppose un seul champ. → RF §3 bis.

## E. Mise en page

64. **`.question`** (flex ET élément de grille) sans `min-width: 0` : un contenu large étire la colonne.
65. **`justify-content: space-between`** : un enfant seul sur une ligne passe à gauche (titre long + pictogramme / aide).
66. **Barre de contrôle scindée en deux `<div>`** : le bouton « Voir toutes les réponses » ne suit plus le retour à la ligne.
67. **Figure** : voir `feedback_graph_visual_legibility` (contenu dans le cadre, amplitude, points du quadrillage) et
    figure non aplatie. → RF §4 bis.
68. **Zoom d'un SVG** : retirer `class`/`style`/`width`/`height` du clone ; mesurer la taille réelle du clone agrandi.

## F. Pièges d'outils (tests et modifications en masse)

69. **Rechargements répétés de la même URL** dans l'outil d'automatisation : MathJax peut rester corrompu pour cette URL
    (`replaceChild` sur null, SVG à `NaN`) ; ce n'est pas un bogue de la fiche → changer d'URL / fermer-rouvrir l'onglet.
70. **`read_console_messages`** peut renvoyer un tampon périmé : poser un écouteur `error`/`unhandledrejection`.
71. **Une expression régulière « 0 résultat »** n'est pas une preuve quand le contenu a des parenthèses imbriquées ou
    `\left(…\right)` : relire le fichier. Correction transversale : recenser par `grep` dans tout le dépôt AVANT de
    corriger, car un correctif « de mécanisme » ne remplace pas un balayage de contenu.
72. **PowerShell 5.1** lit un `.ps1` sans BOM en page ANSI : les caractères non ASCII (`√ ∗ × ·`) d'une chaîne de recherche
    sont corrompus, le remplacement ne fait rien sans erreur. Préférer un script Node ; sinon BOM UTF-8. Fins de ligne
    CRLF/LF différentes selon les fichiers : détecter par fichier. Toujours un passage à blanc (dry-run) puis un second
    passage qui doit ne rien changer. Voir aussi `feedback_sed_i_convertit_crlf`.
73. **Écrire du LaTeX dans un `sed`/`perl`/`cat <<` passé par l'outil Bash** : les antislashs sont mangés ou doublés.
    Modifier avec l'outil d'édition ou un script Node écrit dans un fichier.
74. **Un audit rétroactif** de fiches déjà validées cherche surtout les écarts de COHÉRENCE avec une règle posée après coup,
    pas de vrais bogues d'acceptation ; le dire plutôt que d'en inventer.

## G. Compléments issus de la relecture complète (détails à ne pas perdre)

75. **Sondes de prévention à relancer sur toute fiche retouchée** (grep sur le fichier ou balayage de tirages) :
    - double signe collé : `/[+\-]{2,}/` sur les énoncés rendus, après avoir retiré les jetons LaTeX innocents ;
    - `<` littéral dans un énoncé : `enonce.*[^\\]<[a-zA-Z0-9]` (écrire `\lt`, `\gt`) ;
    - commande LaTeX sans `\(` plus tôt dans la même chaîne (`\\[a-zA-Z]`) ; nom de fonction nu (`cos(`, `sin(`, `tan(`) hors
      délimiteur dans un énoncé qui contient déjà `\(` ; un `\(` resté visible ou un mot recollé juste avant dans le texte rendu
      (`/[a-zé]\\\(/`) = double enveloppement (énoncé mêlant texte et `\(…\)` sans `texteLibre:true`) ;
    - helpers ASCII dans un énoncé : `signedFracTerm(`, `joinSigned(`, `coefPrefixe(` (sans `L`) dans un `enonce:` ;
    - fuite de réponse : `répondre exactement`, `résultat est le vecteur nul`, tout indice qui interpole `reponse` ;
    - `lettresEtendues.length` ≥ `Math.max(...Object.values(groupes).map(g => g.length))` ;
    - `.question { min-width: 0 }` présent (le correctif sur `.q-enonce` ne suffit pas) ;
    - `mettreAJourTextesAvances` présent ; chaque `alea(` non signé qui alimente un coefficient directeur là où le groupe voisin
      utilise un tirage signé (un groupe qui n'affiche jamais de signe négatif n'est pas complet).
76. **« Appliqué à tous les fichiers » n'est pas « appliqué partout où le motif existe »** : un correctif de mécanisme
    (`jsVersLatex`) ne remplace pas un balayage de CONTENU (quelles fiches ont ce genre d'exercice). Chercher chaque notion sous
    ses DEUX formulations (nom et description : « équation réduite » ET « coefficient directeur / ordonnée à l'origine » ;
    « y en fonction de x »). Une consigne « on verra après » de David n'est pas une exclusion définitive : si une demande plus large
    la recouvre (« dans toutes les fiches concernées »), la reprendre.
77. **Assembler une expression à plusieurs termes** (équation cartésienne, somme de radicaux) : extraire le signe de chaque
    coefficient dans une paire `{signe, texte}` AVANT de joindre (`signeEtCorps`), jamais « le terme commence par `-` ? » sur
    un morceau composé ; `toTex()` ne fusionne pas `+` suivi de `-` (`+-6y`), et un coefficient négatif fractionnaire doit
    sortir `-\dfrac{5}{4}`, pas `\dfrac{-5}{4}`. Un helper qui formate UN terme signé ne doit pas être additionné à la main avec
    un `+`/`-` du gabarit : prendre la liste de tous les termes (`suiteSurdsLatex([[p,a],[q,b],[-r,a]])`). Toute valeur
    potentiellement négative composée avec un signe littéral (`x-${v}`) passe par un helper (`xMoinsTexte`, `affineTexte`).
    Toujours construire UNE expression complète puis l'envoyer UNE fois à `jsVersLatex`, pour que tout le nettoyage s'applique.
78. **Le `\times` entre une fraction coefficient et une lettre est porteur** (pas seulement lisible) : sans lui, `\dfrac{27}{2}{x}^{2}`
    se relit `(27)/(2)x^2` = `27/(2x²)` (la juxtaposition l'emporte sur la division). Dans `collerCoefficientLettre`, garder la
    garde `(?<!\})(\d)` ; on peut supprimer le `\times` après `\right)` ou devant `\left(` ; toute généralisation d'une règle de
    suppression de `\times` se re-valide par un REMPLISSAGE réel du champ, pas par la seule lecture du LaTeX (17 échecs ainsi
    trouvés). Côté saisie : `normaliserSaisie` force `)lettre` → `)*lettre` (fraction du clavier suivie d'une lettre, sinon
    `(5)/(2)x` est lu `5/(2x)`).
79. **Symboles d'unités de math.js** : `m, t, b, g, h, N, yt, hp` sont des unités (`math.evaluate('m')` renvoie une `Unit`, `toTex()`
    donne `\mathrm{m}` et un `\times` imposé). Protéger les variables avant `math.parse` (`protegerVariables` /
    `restaurerVariables`, liste `VARS_A_PROTEGER`) avec des jetons de largeur fixe, remplis de zéros, faits de chiffres seuls (un
    jeton sans remplissage est préfixe d'un autre ; un soulignement est échappé par `toTex()`). `lambda` est déjà rendu `\lambda` par
    `toTex()` : le remplacement maison se fait avec `(?<!\\)lambda`.
80. **Lettres grecques collées à un coefficient** (`6lambda`) : les `\b` de `valeurDuChamp` ne marchent pas entre chiffre et lettre →
    `(?<![a-zA-Z])alpha(?![a-zA-Z])` (idem `lambda`, `beta`). Deux conventions légitimes mais à ne jamais mêler dans un même
    mécanisme de saisie : « a » pour α dans un champ simple (`type:'paire'`), « lam » pour le α de MathLive.
81. **Un type de réponse nouveau est un `<math-field>` par défaut** (`TYPES_MATHFIELD`) : un `<input>` simple est réservé aux
    réponses textuelles (mots, `ouiNon`). Un `<input>` ne sait pas ouvrir un exposant (cas d'`ecritureSci`, fiche 11).
82. **`Σ` / `Π`** : `evaluerExpressionSomme` / `…Produit` reconnaissent la structure `sum(…)` AVANT `normaliserSaisie` (sinon les
    virgules deviennent des points décimaux) ; `valeurDuChamp` regroupe tout nom de fonction tapé lettre à lettre
    (`sum, prod, exp, sqrt, sin, cos, tan, log, ln, abs`), pas seulement `sum`. À contrôler à la première fiche qui emploie ces types.
83. **Valeur absolue saisie** : MathLive exporte `|…|` que math.js ne lit pas (`convertirPipesEnAbs` en tête de `normaliserSaisie`,
    présent dans la fiche 26 de Première seulement) ; à ajouter, et à chercher dans les `reponse` (`abs(`), avant toute fiche dont
    une réponse contient une valeur absolue.
84. **Équation à une solution** : `4`, `x=4`, `{4}` sont tous plausibles pour l'élève. Acceptés (RF §4), avec aide de groupe
    (drapeau posé par un ensemble d'`id` explicite, pas par un préfixe de groupe) ; `normaliserSaisie` retire une paire d'accolades
    entourant TOUTE la saisie (le modèle actuel de Terminale ne le fait pas : à comparer).
85. **Exposants de plusieurs caractères** : la frappe naïve au clavier physique ne garde que le premier caractère dans l'exposant
    (`2^12` → `2^1 2`) ; le modèle du clavier virtuel (`^{#?}`) ou les flèches les gardent. Soit plafonner l'exposant à taper à un
    caractère (boucle de rejet), soit reformuler (« donner p en fonction de n »), soit dire clairement quoi saisir. `10^-5` et
    `2^(n+1)` sont sûrs.
86. **Fonction d'affichage qui évalue** : la branche `num` de `formaterReponse` qui fait `math.evaluate(reponse)` détruit les
    réponses dont la FORME est demandée (`4^7` affiché 16384). Idem la pose de milliers (`\,`) avant `.replace(',', '{,}')` :
    produire directement le LaTeX avec les deux rôles déjà séparés. Le convertisseur du contrôle de re-dérivation doit
    absorber `\,`.
87. **« Le plus petit n tel que P(n) »** : souvent vrai dès n = 1. Viser « le plus petit n₀ tel que P(n) pour tout n ≥ n₀ » et
    contrôler la PROPRIÉTÉ (vraie jusqu'à ~80, fausse en n₀ − 1), pas le recalcul de la même quantité (une vérification qui
    réutilise la lecture du générateur est aveugle à une lecture erronée).
88. **Contrôles indépendants (exigence)** : reparser le texte rendu de l'énoncé ; reconstruire chaque case d'un widget à la main
    depuis les facteurs bruts ; tester un distracteur de QCM en AU MOINS deux valeurs non dégénérées ; pour une borne
    ouverte/fermée, vérifier que la même réponse avec l'opérateur inversé sur UNE borne est REFUSÉE ; tester les widgets avec
    de vrais `.click()` et de vrais évènements `input`, jamais en appelant `verifierUne` directement.
89. **Modèle de données qui change** (widget) : supprimer les anciennes gardes conditionnelles dans TOUTES les fonctions qui
    touchent les cases (vérification, réinitialisation, remplissage) ; tester volontairement un cas limite (`racineIndex === 0`)
    en y introduisant une erreur pour vérifier qu'elle est détectée.
90. **Générateurs en `{id, type, gen}` fusionnés par `map`** : seuls `id` et `type` survivent de l'objet extérieur ; tout autre
    drapeau (`formeYax`, etc.) se place dans l'objet RENVOYÉ par `gen()`.
91. **Formes de saisie imposées** : `formeYax` (équation complète commençant par `y=`), `formePoint` (parenthèses obligatoires),
    `formeVecteur` (flèche `\overrightarrow{}` lue en LaTeX ; deux variantes `combinaison` / `nomme`). Une aide de groupe
    étiquette `a), b)` quand un groupe mêle plusieurs indications différentes. Le clavier d'un type sans `<math-field>` doit
    afficher un indice de format et proposer les lettres de `ex.vars`.
92. **Fiche de vecteurs** : outils de la fiche 21 de Première (`pcVec`, `pcAdd`, `pcScale`, `pcToSingleVec`, `vecTerm`,
    `chaslesEnonceLatex`, `vecCombinaisonLatex`, `randomLettres`, `construireBasisMapPoints`, `checkCombinaisonVecteurs`) ;
    `vecTerm` colle le coefficient au nom (`-2AB`, `-2*a*AB`) ; un terme ajouté après un fragment fixe a besoin de son propre
    contrôle du signe de tête. Cible par chaîne de Chasles : `n` points distincts, la somme télescope sur `P0Pn`.
93. **Texte libre avec tolérance** : voir 35 ; un `̀-ͯ` écrit dans un appel d'outil peut être transcrit en vrai
    caractère combinant : préférer une table de correspondance des accents.
94. **Raccourcis de test avec MathLive** : `.insert(texte)` sans `format` lit du LaTeX ; remplir avec `jsVersLatex(reponse)` quand
    la réponse contient `sqrt(` ou un jeton indicé (`an/a1`) ; un `sqrt(` en dénominateur de fraction se disloque. Plusieurs
    « échecs » étaient des artefacts de `setValue`.

## I. Figures : lisibilité et forme (détail des mémoires « graphiques lisibles » et « figure non aplatie »)

Un test de correction à 0 échec ne dit rien de la lisibilité. Vérifier SÉPARÉMENT, par des contrôles automatiques sur beaucoup
de régénérations :
- **Contenu dans le cadre** : la courbe ne sort pas, n'explose pas au bord du domaine. Préférer un domaine en x adapté à la
  courbe (`[r1−1, r3+1]` autour de ses propres racines, racines symétriques `r1 = −r2` si l'exercice le permet) plutôt qu'un
  domaine large commun ; sur un domaine serré, calculer le cadre en y à chaque génération (`calculerPlage`) ; un cadre fixe
  dimensionné pour le pire cas d'un grand domaine écrase l'amplitude.
- **Amplitude** : les valeurs que l'élève doit comparer (F à chaque racine, g à chaque point de tangence) diffèrent assez pour se
  voir. Se donner une amplitude cible et RÉSOUDRE le coefficient qui l'atteint (division d'une ligne pour un polynôme
  `k·(primitive)`), au lieu d'un coefficient choisi à la main.
- **Leurres construits par transformation** (miroir, changement d'échelle) : vérifier qu'ils restent dans le cadre du NOUVEAU
  domaine ; préférer des leurres qui réarrangent la structure en gardant les mêmes bornes (échanger la racine du milieu). Pour un
  leurre « profil de signes », nier le coefficient dominant est un repli sûr (change tous les signes d'un coup).
- **Lecture de pente sur une tangente** : le tracé doit passer par au moins deux nœuds entiers du quadrillage. Deux conditions,
  toutes deux nécessaires : (1) la pente réduite `n/d` a un petit dénominateur (≤ 2) ; (2) la hauteur du point de tangence a une
  partie fractionnaire multiple de `1/d` (sinon la droite est décalée du réseau entier pour tout x entier). Tester en
  parcourant les x entiers du segment réellement tracé et en comptant les y entiers (≥ 2), pas par une heuristique de largeur ;
  une construction où la hauteur est exacte d'office (`f(p) = f(q) = r`) évite le problème.
- **Zoom** : mesurer la taille réelle du clone agrandi (`getBoundingClientRect().width`) ; il hérite de classes et styles en ligne
  qui peuvent plafonner sa taille.
- **Familles de courbes** : tirer parmi toutes les familles pertinentes, poids égal ou supérieur aux formes moins triviales, et
  contrôler la correction pour CHAQUE famille. Construire la seconde courbe à partir de la première (`g = f + a·Π(x−rᵢ)`).
- **Figure géométrique jamais aplatie** : exiger `|sin| = |v1 × v2| / (|v1||v2|) > 0,5` (angles entre 30° et 150°), sans
  trigonométrie ; assistants réutilisables (`vecteursAssezEcartes`, `tirerDeuxVecteursEcartes`, `triangleBienForme`,
  `tirerTriangleBienForme`) ; corriger TOUS les sites du fichier (grep `nonColineaires(`), supprimer l'ancien test devenu mort,
  borner la boucle de rejet (`tentatives < 100`), balayer des milliers de tirages.

## J. Pièges après fusion ou réduction d'un groupe

- `lettresEtendues` codé à 4 lettres dans d'anciennes fiches : l'étendre si un groupe dépasse 4 exemples.
- Groupe réduit à UN exemple : id sans lettre (`"3.5"`), la fonction renvoie un objet : retirer le `...` (spread) correspondant
  dans `genererExercices()` (sinon `TypeError`).
- Fonction de groupe renommée : relabeliser aussi les `id` DANS son corps (sinon l'ancien numéro reste affiché) ; vérifier en
  listant les `id` réellement générés.
- Un bloc HTML remplacé qui suit un `<p class="section-titre">` : ne pas le retaper (titre en double, vu seulement en capture).
- Aides de groupe : ne jamais laisser trois boutons « ? » identiques sur des items voisins (aide par GROUPE).

## H. Leçons de méthode (comment travailler)

- **Avant de construire**, chercher ce qui existe en Première / dans les fiches voisines (RF §6). Si une réimplémentation
  divergente est découverte (clavier d'intervalles ad hoc, `checkIntervalle` maison), la SUPPRIMER et reprendre l'original mot
  pour mot plutôt que de réconcilier ; et quand David interroge une décision de conception, vérifier réellement (exploration
  complète) avant de défendre le choix déjà fait.
- **Copier un mécanisme ne suffit pas** : vérifier sa portée exacte dans la source (employé partout où le sujet s'applique ?) et
  chaque convention qu'il enseigne (aide, boutons, exemples), pas seulement sa mécanique.
- **Un réglage chiffré ambigu** (« deux », « en général », « par groupe ») : écrire tout de suite la reformulation avec des
  nombres concrets (« une fiche à N groupes reçoit combien d'items ? ») ou poser la question en options avec aperçu chiffré,
  avant d'appliquer. (Exemple : la règle « 2 exemples délicats par groupe de cœur » de la phase de portage, aujourd'hui remplacée
  par le plafond de 4 exemples, REGLES-FICHES §1.)
- **Nouveau widget** : poser les décisions de conception ouvertes à David avant de coder (une question à la fois, une
  recommandation) ; reproduire exactement les conventions visuelles du manuel ; demander un EXEMPLE d'une convention jamais vue
  tracée ; après un premier retour, une seconde vague de remarques brèves sur le même widget peut cacher un désaccord de structure
  (inspecter le DOM réel avant de conclure) ; après toute refonte, dresser la liste des règles déjà validées et écrire un test par règle.
- **Calcul avancé** : plus difficile que tout le cœur, jamais contextualisé ; deux gabarits — (a) combiner DEUX techniques du cœur
  qui n'étaient jamais ensemble, ou ajouter une opération au-dessus de la plus dure du cœur ; (b) isoler l'étape clé d'une démonstration
  du programme. Comparer explicitement chaque item avec le dernier item du cœur. Pour un système de deux inéquations : intersection
  éventuellement vide, vide dans environ la moitié des tirages. Fiche de puissances : voir `contenu-fiche-neuve.md` §5.
- **Audit rétroactif** : chercher les écarts de COHÉRENCE avec une règle posée après coup ; corriger directement si le volume est
  faible, sinon demander.
