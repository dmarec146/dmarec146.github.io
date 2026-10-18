# Types de questions des QCM de bac 2022 et 2023, par thème

**18/10/2026.** Catalogue établi en lisant les 130 questions de QCM et les 19 affirmations de 2022 et 2023
(`index-exercices.md`, fin de fichier). Sert de cahier des charges aux familles de questions : un type = une famille
paramétrable, avec trois mauvaises réponses qui reprennent des erreurs classiques.
« Fait » = déjà dans une banque du pilote ; « Ajouté » = ajouté le 18/10/2026 ; « À faire » = banque à venir.

## Suites (28 questions)

| Type de question | Exemple du bac | Statut |
|---|---|---|
| Limite d'un quotient d'exponentielles de bases différentes | `u_n = (1+2^n)/(3+5^n)`, `a_n = (1−3^n)/(1+2^n)` : converge vers 0, tend vers −∞… | Ajouté (suites géométriques, niveau 3) |
| Limite avec `(-1)^n` | `u_n = (−1)^n/(n+1)` : bornée, convergente, croissante ? | Fait |
| Passage à la limite dans une inégalité large | « `u_n` minorée par 3 et converge vers ℓ : on peut affirmer ℓ ≥ 3 » | Ajouté (convergence monotone) |
| Suite encadrée : gendarmes, comparaison, croissante majorée | `1+(1/4)^n ≤ u_n ≤ 2−n/(n+1)` ; `n < u_n < n+1` ; `u_n ≤ u_{n+1} ≤ 1/n` | Ajouté (gendarmes et comparaison) |
| Suite auxiliaire géométrique ou arithmétique | `u_{n+1} = ½u_n + 1`, `v_n = u_n − 2` ; `v_n = u_n − n` | Fait pour `u_n − ℓ` ; variantes `u_n − an` à faire |
| Premiers termes d'une suite récurrente | « la valeur de `u_2` est égale à… » | Fait |
| Sens de variation | suite `e^{2n+1}`, `v_n = u_n + 60` | Fait |
| Modélisation et seuil | « le volume diminue de 15 % par heure : au bout de combien d'heures est-il inférieur à… ? » ; division cellulaire ; action à +3 % par mois | Ajouté (seuil en contexte) |
| Algorithme Python à compléter | « la ligne 4 est incomplète : la fonction doit renvoyer le plus petit `n` tel que `u_n > 10000` » | Ajouté (condition de boucle ; banque `algorithmique` : condition, retour, somme, schéma d'Euler) |
| Somme géométrique ou arithmétique, forme close, limite de `S_n`, inégalité de Bernoulli | `Σ 2^k`, `Σ (ak+b)`, `Σ 1/(k(k+1))`, `(1+a)^n ≥ 1+na` | Ajouté (famille `sommes`, §11) |
| Que renvoie un programme Python | `seuil(…)`, somme `1 + 1/2 + … + 1/100` | Fait (banque `algorithmique`, `SUIVI-QCM-BAC.md` §11 : seuil, sommes, factorielle, Fibonacci, Collatz…) |
| Suite définie par `u_{n+1} = u_n / n` | « la suite `(w_n)` est… » | À faire |
| Produit `v_n × v_{n+1} = k` (suite alternée ou constante) | Groupe I 19 mai 2022 | À faire |

## Géométrie dans l'espace (16 questions, souvent des exercices entiers de 5 questions)

| Type de question | Statut |
|---|---|
| Vecteur directeur, représentation paramétrique de `(AB)`, point sur une droite | Fait |
| Vecteur normal d'un plan (`x = 1`), équation cartésienne du plan `(BCD)` | Fait |
| Nature d'un triangle `ABC` (rectangle, isocèle, équilatéral) | Ajouté |
| Position relative de deux droites (sécantes, parallèles, non coplanaires) et intersection de deux plans | Fait |
| Angle `ABC` à partir d'un produit scalaire donné | Ajouté (angle) |
| Projeté orthogonal `H` de `D` sur `(ABC)` et propriétés | Fait en partie (coordonnées) ; affirmations sur `H` à faire |
| Appartenance d'un point à un plan | Fait |

## Exponentielle, logarithme, dérivation, primitives, limites (43 + 19 + 4 questions)

Thème **codé le 18/10/2026** (banque `fonctions`, voir `SUIVI-QCM-BAC.md` §8), y compris la lecture graphique (banque `lectures-graphiques`, `SUIVI-QCM-BAC.md` §11, figures dessinées par `O.graph.repere`). C'est le gros morceau des QCM de 2022 et 2023. Types rencontrés :

- Dérivée de `x²ln x`, de `(x+1)e^x`, de `ln(x²+x+1)`, de `x/e^x`, de `x e^{x²−3}`.
- Primitive de `xe^x`, `(x+1)e^x`, `x e^{x²}`, `ln x`, `e^{2x+1}` avec condition `F(0)=1`, `3e^{−x²}+2`, `x/(1−x²)`.
- Domaine de définition (`ln((x−1)/(2x+4))`, `ln(−x²−x+6)`), équations (`[ln x]²+10 ln x+21=0`, `e^{2x}+e^x−12=0`,
  `ln x + ln(x−10) = ln 3 + ln 7`), inéquation `ln(x+3) < 2 ln(x+1)`, nombre de solutions de `f(x)=k`.
- Limites : `(e^x+1)/(e^x−1)`, `ln x /(3x²+1)`, `(x+1)/e^x`, `(e^{2x}−1)/(e^x−x)`, asymptotes d'une fraction rationnelle.
- Simplification d'expressions (`ln 9 + ln(√3/3) + ln(1/9)`, `2 + (3e^{−x}−5)/(e^{−x}+1)`), inégalité `1+e^{2x} ≥ 2e^x`.
- Tangente en un point (`xe^x` en 1, `x²−4x+3ln(2x−1)`), convexité (`e^x − x`, `ln(x²+2x+2)`, `x^{1000}+x`).
- Lecture graphique : sens de variation, extrema, points d'inflexion à partir de la courbe de `f'` ou de `f''` — **codé le 18/10/2026** (banque `lectures-graphiques`).
- Équation différentielle et valeurs intermédiaires dans les affirmations.

## Probabilités (27 questions)

Thème **codé le 18/10/2026** (banque `probabilites`, voir `SUIVI-QCM-BAC.md` §9). Types : probabilité conditionnelle et intersection sur un arbre ; probabilités totales ; formule de
Bayes (`P_{R_1}(E_0)`) ; réunion `P(A∪F)` ; loi binomiale (`P(X=2)`, au moins un succès, plus petit `k` tel que
`P(X ≤ k) ≥ 0,95`) ; loi binomiale de paramètre inconnu (`P(X=0)=1/125`) ; `P(3 < X ≤ 7)` ; espérance d'un jeu à gains ;
tirages avec remise ; pannes indépendantes (« le bus ou le train »).

## Intégrales et trigonométrie

Codés le 18/10/2026 (banques `integrales` et `trigonometrie`, `SUIVI-QCM-BAC.md` §10) à partir du programme et des affirmations de 2024 à 2026
(`∫ sin x`, intégration par parties, suites `I_n = ∫ e^{-nx} sin x`, valeur moyenne, aire entre deux courbes, `f'(x)=1+cos x` et concavité,
`h'(x) = −2 sin x + cos x`, solutions `C e^x + 2 cos x + sin x`).

## Dénombrement

Très peu en 2022 et 2023 (1 question de dénombrement), mais 12 affirmations en 2024 à 2026 (`repartition-themes.md`). **Codé le 18/10/2026** (banque `denombrement`, `SUIVI-QCM-BAC.md` §9) : listes, permutations, combinaisons, parties, coefficients binomiaux, tirages simultanés, chemins.

## Remarque sur la forme

Les QCM de 2022 et 2023 donnent souvent **un contexte commun à plusieurs questions** (une fonction, un arbre) ; les familles du
site posent chaque question de façon autonome, ce qui est plus simple pour des séries aléatoires de 10 questions.
