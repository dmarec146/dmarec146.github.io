# Thème pilote : les suites (Terminale) — proposition à valider

**17/10/2026 — rien n'est codé.** Ce fichier prépare le pilote : pourquoi ce thème, ce que le moteur existant
permet, et quatre exemples de conversion « affirmation → question à choix » à faire valider par David avant
d'écrire la moindre banque.

## 1. Découpage du programme en thèmes (programme officiel de Terminale, lu en entier le 17/10/2026)

Quatre parties : algèbre et géométrie, analyse, probabilités, algorithmique et programmation (Python,
transversal), plus le vocabulaire ensembliste et la logique. En thèmes de banques :

| Thème | Contenu du programme (extrait) |
|---|---|
| Dénombrement | principes additif et multiplicatif, `k`-uplets, permutations, parties, combinaisons, Pascal |
| Géométrie dans l'espace | vecteurs, droites, plans, bases ; produit scalaire, orthogonalité, projeté ; représentations paramétriques, équations cartésiennes |
| Suites | convergence, limites et comparaison, gendarmes, suite géométrique `q^n`, croissante majorée converge, récurrence, seuils |
| Limites et continuité de fonctions | limites en `±∞` et en un point, asymptotes, croissances comparées, théorème des valeurs intermédiaires, `u_{n+1}=f(u_n)` |
| Dérivation et convexité | composée, dérivée seconde, convexité, point d'inflexion |
| Logarithme | propriétés, dérivée, variations, limites, croissances comparées |
| Sinus et cosinus | dérivées, variations, équations `cos x = a`, inéquations sur `[-π, π]` |
| Primitives et équations différentielles | primitives usuelles, `(v'∘u)×u'`, `y'=ay+b`, solution particulière constante |
| Calcul intégral | aire, primitive, linéarité, Chasles, valeur moyenne, intégration par parties, encadrements |
| Probabilités | arbres, indépendance, Bernoulli et loi binomiale, linéarité de l'espérance, variance, Bienaymé-Tchebychev, concentration |
| Logique | négation, contre-exemple, réciproque, contraposée, récurrence |

Les « approfondissements possibles » du programme (suites adjacentes, récurrence linéaire d'ordre 2, Newton et
Héron, asymptotes obliques, etc.) servent de matière au **niveau 3**. Aucun n'est obligatoire.

## 2. Pourquoi les suites

- Il revient très souvent dans les exercices d'affirmations retenus (2024 à 2026), avec la géométrie dans
  l'espace ; la répartition exacte par thème reste à compter.
- Aucune figure nécessaire : tout se pose en énoncé texte et formules.
- **Contrôle indépendant facile** : une suite se recalcule terme à terme (premiers termes, monotonie, limite
  numérique pour `n` grand), ce qui répond à l'exigence de `REGLES-FICHES.md` §7 (jamais la réponse
  contrôlée par elle-même).
- La géométrie dans l'espace (autre gros thème) viendra ensuite, avec peu ou pas de 3D, comme David l'a dit
  (les QCM donnent presque toujours les coordonnées).

## 3. Ce que le moteur existant permet (`automatismes/assets/moteur.js`, lu le 17/10/2026)

Bonne nouvelle : il est déjà **générique**.
- Une banque s'enregistre par un identifiant (`enregistrerBanque`), avec des familles (`famille({…})`) à
  générer par niveau (1, 2, 3), quotas, variantes de niveau 3.
- Une question est un **QCM à quatre options** (`qcm(enonce, bonne, candidats)`), distracteurs distincts par
  « clé », explication facultative. C'est exactement le format voulu.
- Les modes fiche (thèmes tirés au sort, 12 questions) et chrono, les devoirs, le barème par table et la
  figure sont dans le moteur ; les pages `fiche.html` et `sujet-blanc.html` ne font que charger les banques.
- Ce qui est propre à la Première : les pages (`automatismes/premiere/`), les huit banques, la table de barème
  `bareme-sujet-blanc.js`, et `assets/js/mes-devoirs.js` (ligne 40) qui construit le lien d'un devoir
  d'automatismes vers `/automatismes/premiere/…` en dur. Le niveau « Terminale » demandera d'ajouter un
  paramètre de section dans les devoirs (`suivi.js`, `devoirs.js`, `mes-devoirs.js`, `devoirs-eleve.js`)
  et de nouvelles classes côté comptes.

Conclusion : pas besoin de recopier `moteur.js`. Il faudra créer un dossier de pages et de banques
pour la Terminale, un bloc « QCM Bac » (navigation, accueil) et adapter le suivi des devoirs.

## 4. Quatre exemples de conversion

Principe retenu par David : on transforme l'affirmation en **la question à laquelle sa justification répond**,
avec trois mauvaises réponses qui reprennent des erreurs classiques. Les valeurs seront aléatoires (paramètres
dans chaque famille), et chaque réponse recalculée de façon indépendante. Ce sont des **esquisses** :
les distracteurs sont à affiner avec toi.

### A. Limite d'une suite avec `(-1)^n` (Amérique du Sud J1, 21/11/2024, exo 3, affirmation 1)

*Original* : `u_n = (25 + (-1)^n)/n` pour `n ≥ 1`. Affirmation : « la suite `(u_n)` est divergente » (**fausse**).

*QCM* : « Que peut-on dire de la suite `(u_n)` définie pour `n ≥ 1` par `u_n = (25 + (-1)^n)/n` ? »
- **converge vers 0** (gendarmes : `|u_n| ≤ 26/n`) ✔
- diverge, car `(-1)^n` n'a pas de limite *(piège : oscillation = divergence)*
- tend vers `+∞`, car le numérateur est positif *(piège : numérateur borné, dénominateur ignoré)*
- converge vers 25 *(piège : `(-1)^n` négligé, dénominateur ignoré)*

*Famille* : `u_n = (a + b(-1)^n)/(n + c)`, `(-1)^n/n`, et au niveau 3 des cas de vraie divergence
(`(-1)^n + 1/n`, `n + (-1)^n n`).

### B. Suite définie par inversion (Amérique du Sud J1, 21/11/2024, exo 3, affirmation 2)

*Original* : `w_0 = 1`, `w_{n+1} = w_n / (1 + w_n)`, `w_n > 0` admis, `t_n = k / w_n` avec `k > 0`.
Affirmation : « `(t_n)` est arithmétique strictement croissante » (**vraie** : `t_{n+1} = t_n + k`).

*QCM* : « Quelle est la nature de la suite `(t_n)` ? »
- **arithmétique de raison `k`** ✔
- géométrique de raison `k` *(piège : confusion arithmétique / géométrique)*
- arithmétique de raison 1 *(piège : on garde la raison de `1/w_n` sans multiplier par `k`)*
- ni arithmétique ni géométrique *(piège : on ne voit pas l'astuce de l'inverse)*

*Famille* : `w_{n+1} = w_n/(1 + c·w_n)`, `w_0 = a` : alors `1/w_n = 1/a + c·n` et `t_n = k/w_n` est
arithmétique de raison `k·c`. Contrôle : on calcule dix termes et on vérifie les écarts.

### C. Variations d'une suite `u_{n+1} = f(u_n)` (Amérique du Sud J1, 21/11/2024, exo 3, affirmation 3)

*Original* : `v_0 = 1`, `v_{n+1} = ln(1 + v_n)`, `v_n > 0` admis. Affirmation : « `(v_n)` est décroissante »
(**vraie**, car `ln(1+x) < x` pour `x > 0`).

*QCM* : « Quelle propriété de `(v_n)` est correcte ? »
- **décroissante et minorée par 0, donc convergente** ✔
- croissante, car la fonction `ln` est croissante *(piège : monotonie de `f` confondue avec monotonie de la suite)*
- décroissante, donc elle tend vers `-∞` *(piège : le minorant est oublié)*
- ni croissante ni décroissante *(piège : on teste deux termes seulement)*

*Famille* : `f(x) = ln(1+x)`, `√x` (avec `v_0 < 1` ou `v_0 > 1`), `e^x - 1`, `x/(1+x)`… ; le sens de
variation vient du signe de `f(x) - x`. Contrôle : itération numérique sur 50 termes.

### D. Théorème des gendarmes : conditions d'application (Métropole J1, 19/06/2024, exo 1, affirmations 3 et 4)

*Original* : `u_n ≤ v_n ≤ w_n`, `(u_n)` converge vers `-1`, `(w_n)` converge vers `1`. Affirmation 3 :
« `(v_n)` converge vers un réel de `[-1 ; 1]` » (**fausse** : rien ne prouve que `(v_n)` converge).
Affirmation 4 (si `(u_n)` croît et `(w_n)` décroît) : « `u_0 ≤ v_n ≤ w_0` » (**vraie**).

*QCM* : « Que peut-on affirmer sur `(v_n)` ? »
- **on ne peut pas conclure sur la convergence de `(v_n)`** ✔ (par exemple `v_n` peut osciller entre `u_n` et `w_n`)
- `(v_n)` converge vers 0 *(piège : « milieu » des deux limites)*
- `(v_n)` converge vers un réel de `[-1 ; 1]` *(piège : l'affirmation de l'énoncé)*
- `(v_n)` converge vers `-1` ou vers `1` *(piège : une des deux limites)*

*Famille* : limites `ℓ₁ ≠ ℓ₂` (pas de conclusion) ou `ℓ₁ = ℓ₂` (on conclut), avec ou sans monotonie
des encadrantes (alors encadrement par `u_0` et `w_0`). Contrôle : on fabrique explicitement un `v_n`
qui oscille pour réfuter un « on conclut » erroné.

## 5. Autres familles prévues pour le pilote « suites »

Limite d'une suite géométrique `q^n` et d'une somme de termes d'une géométrique ; suite arithmético-géométrique
`u_{n+1} = a·u_n + b` (point fixe, `v_n = u_n - ℓ` géométrique, limite) ; théorème de la suite croissante
majorée ; croissance comparée et limites infinies ; démonstration par récurrence (quelle inégalité
à montrer au rang `n+1` ?, quel est le piège de l'hérédité ?) ; lecture d'un algorithme de seuil en Python.
Niveau 1 : les bases (limite de `q^n`, nature simple). Niveau 2 : les questions de style bac ci-dessus.
Niveau 3 : approfondissements (suites adjacentes, récurrence d'ordre 2, Newton ou Héron) et énoncés plus piégeux.

## 6. Points à valider par David

1. Le thème pilote : les suites (recommandé).
2. Les quatre exemples A à D : les questions, les trois mauvaises réponses de chacune, le niveau de difficulté.
3. Barème du niveau 3 : pénalités ou non (et option « je ne sais pas » si oui).
4. Dossier : `qcm-bac/` à la racine du site (à côté de `automatismes/`), pages et banques dedans.
