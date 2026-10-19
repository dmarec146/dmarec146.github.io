# Audit de la validation des réponses

Contrôle automatique, **sans crédits** (un script Node qui pilote le Chrome déjà installé), de ce que
les fiches de calcul acceptent et refusent, **en prenant le corrigé comme référence**.

## Ce qu'il contrôle

| Motif | Gravité | Sens |
|---|---|---|
| `corrige-refuse` | avertissement | le corrigé affiché, retapé dans le champ mathématique, n'est pas accepté |
| `enonce-accepte` | erreur | l'énoncé recopié tel quel (à simplifier, développer…) est accepté |
| `nombre-calcule-accepte` | erreur | le nombre calculé est accepté pour une question « une seule puissance » |
| `corrige-decimale` | erreur | le corrigé contient une valeur décimale approchée (hors réponses « approchées ») |
| `corrige-fraction-reductible` | erreur | fraction non irréductible dans le corrigé |
| `corrige-plus-moins`, `corrige-terme-nul`, `corrige-exposant-1`, `corrige-invalide` | erreur | « +-3 », « +0x », « ^1 », « NaN / undefined » |
| `corrige-signe-au-numerateur`, `corrige-multiplication-apres-fraction` | style | −a/b écrit (−a)/b ; « 3/4 × x » |
| `enonce-redondant` | style | la même consigne est répétée dans au moins 3 questions d'un calcul (elle doit figurer une fois dans le titre : `REGLES-FICHES.md` §3). Les énoncés réduits à des nombres ne sont pas concernés |
| `erreur-de-page` | erreur | une erreur JavaScript à l'ouverture de la fiche |

### Réponses structurées (ajouté le 14/10/2026)

Pour les questions qui ne se tapent pas dans un champ mathématique, le corrigé affiché est converti en ce qu'un
élève taperait (ou le tableau est rempli case par case), puis on contrôle la validation :

| Motif | Gravité | Sens |
|---|---|---|
| `intervalle-corrige-refuse` | erreur | l'intervalle / la réunion du corrigé, tapé dans le champ, n'est pas accepté |
| `intervalle-faux-accepte` | erreur | le même intervalle avec un crochet inversé ou une borne décalée de 1 est accepté ; ou, si la question exige des bornes irréductibles, une borne `p/q` écrite `2p/2q` est acceptée |
| `discussion-corrige-refuse`, `discussion-faux-acceptee` | erreur | discussion selon un paramètre : le corrigé n'est pas accepté / les deux premiers cas échangés sont acceptés |
| `tableau-corrige-refuse` | erreur | tableau de signes rempli avec la réponse attendue, refusé |
| `tableau-faux-accepte`, `tableau-incomplet-accepte`, `tableau-seuil-faux-accepte` | erreur | une case changée, une case laissée vide, un seuil décalé de 1 : le tableau est quand même accepté |

| `pourcentage-corrige-refuse` | erreur | le pourcentage du corrigé (« 25% ») tapé dans le champ n'est pas accepté |
| `pourcentage-faux-accepte`, `pourcentage-nombre-seul-accepte`, `pourcentage-calcul-accepte`, `pourcentage-enonce-accepte` | erreur | une valeur fausse, le nombre sans le signe %, un calcul non terminé (`(40)/2%`) ou l'énoncé recopié (« Écrire 0,06 en pourcentage » → `0,06`) sont acceptés |
| `points-corrige-refuse`, `points-faux-accepte`, `points-avec-pourcent-accepte` | erreur | écart en points de pourcentage : le nombre (ou « n points ») est refusé / une valeur fausse ou un nombre suivi de % est accepté |
| `tableau-croise-corrige-refuse` | erreur | tableau d'effectifs à compléter rempli juste (4 cases + pourcentage) et refusé |
| `tableau-croise-case-fausse-acceptee`, `tableau-croise-case-vide-acceptee`, `tableau-croise-pourcentage-faux-accepte`, `tableau-croise-pourcentage-vide-accepte` | erreur | une case fausse ou vide, un pourcentage faux ou vide : le tableau est quand même accepté |

| `ouinon-corrige-refuse`, `ouinon-faux-accepte`, `ouinon-quelconque-accepte` | erreur | réponse oui / non : « oui » ou « non » juste (aussi en majuscule) refusé / l'inverse ou « peut-être » accepté |
| `encadrement-corrige-refuse`, `encadrement-faux-accepte`, `encadrement-ecrit-en-intervalle-accepte` | erreur | encadrement `a<=x<b` : le corrigé est refusé / un crochet inversé, une borne décalée ou l'écriture en intervalle `[a;b]` est accepté |
| `ineq-corrige-refuse`, `ineq-faux-accepte`, `ineq-ecrite-en-intervalle-acceptee` | erreur | inégalité `x>=3` : le corrigé est refusé / un sens inversé, une inclusion inversée, un seuil décalé ou l'intervalle de l'énoncé recopié (`]3;+inf[`) est accepté |
| `ensemble-corrige-refuse`, `ensemble-incomplet-accepte`, `ensemble-en-trop-accepte`, `ensemble-faux-accepte`, `ensemble-ordre-refuse` | erreur (ordre : avertissement) | ensemble en extension `{0;1;2}` (éléments entiers, fractionnaires ou irrationnels) dans un champ texte : le corrigé est refusé / un élément en moins ou en trop, un élément décalé de 1, l'ensemble des opposés (si l'ensemble n'est pas symétrique) est accepté / l'ordre inversé est refusé. Ensemble vide `{}` : le corrigé est refusé / `{0}` est accepté (ajouté le 15/10/2026) |
| `approx-corrige-refuse`, `approx-faux-accepte` ; style `lecture-tolerance-superieure-a-0,2` | erreur ; style | valeur lue ou approchée à une tolérance t (type `approx`, une ou plusieurs racines possibles) : la valeur exacte, ±t/2 (point ou virgule décimale) refusés / une valeur à plus de 2t, du texte ou un champ vide acceptés ; tolérance de plus de 0,2 signalée (règle des lectures graphiques) (ajouté le 15/10/2026) |
| `comparaison-corrige-refuse`, `comparaison-faux-accepte`, `comparaison-symbole-seul-accepte` | erreur | comparaison de deux images `f(x1)<f(x2)` : le corrigé (aussi avec espaces) est refusé / le sens inverse, `<=`, `=`, une autre fonction, ou le symbole seul est accepté (ajouté le 15/10/2026) |
| `tableau-programme-corrige-refuse`, `tableau-programme-case-fausse-acceptee`, `tableau-programme-case-vide-acceptee`, `tableau-programme-cases-echangees-acceptees` | erreur | tableau d'un programme de calcul (image à calculer, antécédent à déterminer) : le bon tableau est refusé / une case fausse, une case vide ou les deux cases échangées sont acceptées (ajouté le 15/10/2026) |
| `tableau-variations-corrige-refuse`, `tableau-variations-fleche-fausse-acceptee`, `tableau-variations-valeur-fausse-acceptee`, `tableau-variations-abscisse-fausse-acceptee`, `tableau-variations-case-vide-acceptee` | erreur | tableau de variations à compléter (abscisses des extrema, flèches ↗ ↘, valeurs de g) : le bon tableau est refusé / une flèche inversée, une valeur ou une abscisse décalée de 1, une case vide sont acceptées (ajouté le 15/10/2026) |
| `paire-corrige-refuse`, `paire-faux-accepte`, `paire-ordre-accepte`, `point-sans-parentheses-accepte`, `point-accolades-accepte`, `point-aucun-refuse`, `point-aucun-accepte-a-tort` | erreur | couple ou point `(x;y)` (type `paire`, coordonnées numériques, fractions comprises, saisies comme dans un champ mathématique) : le corrigé (avec ou sans espaces) est refusé / une coordonnée décalée de 1, l'ordre inverse, un point sans parenthèses ou entre accolades sont acceptés ; « aucun point » (`aucun`, `∅`) refusé quand il n'y a pas de point ou accepté quand il y en a un. Hors champ : vecteurs à écrire avec des noms (`formeVecteur`), racines et π (ajouté le 15/10/2026). **Le corrigé affiché des couples est aussi contrôlé** (motifs `corrige-plus-moins`, `corrige-fraction-reductible`, `corrige-terme-nul`, `corrige-signe-au-numerateur`… : un `(6+-1)/2` non terminé est une erreur) — ajouté le 15/10/2026 |
| `tuple-accolades-accepte`, `tuple-sans-parentheses-accepte`, `tuple-valeur-fausse-acceptee`, `tuple-incomplet-accepte`, `tuple-ordre-accepte` | erreur | couple ou triplet ordonné `(a;b)` saisi dans un champ mathématique : écrit entre accolades, sans parenthèses, avec une valeur fausse (+1), avec une valeur manquante, ou dans l'ordre inverse (si l'ordre inverse est un autre tuple) : accepté (ajouté le 15/10/2026) |
| `valabs-corrige-refuse`, `valabs-faux-accepte`, `valabs-hors-forme-accepte` | erreur | écrire un encadrement sous la forme `\|x-3\|<=5` : le corrigé est refusé / l'autre inclusion, le sens inverse, un centre ou un rayon décalé de 1, ou une réponse qui n'a pas la forme `x<=5` est accepté (ajouté le 15/10/2026) |
| `intervalle-tout-refuse`, `intervalle-ecrit-en-inegalite-accepte` | erreur | ℝ écrit `]-∞;+∞[`, `]-inf;+inf[` (lettres) ou `R` refusé (saisi en LaTeX : le mode ascii-math de MathLive perd le crochet fermant) / un intervalle borné écrit `a<x<b` accepté |
| `schema-corrige-refuse` | erreur | schéma d'évolutions successives (3 taux et 3 coefficients) rempli juste et refusé |
| `schema-case-fausse-acceptee`, `schema-case-vide-acceptee`, `schema-calcul-accepte` | erreur | une case fausse (taux +1 point, coefficient +0,01), une case vide, un taux écrit en calcul non terminé (`(30)/2%`) : le schéma est quand même accepté |

Ces contrôles ont été testés sur des copies volontairement défectueuses des fiches 8, 9 et 10 de Seconde (case « | » ignorée,
crochets ignorés, tolérances trop larges, signe % non exigé, calcul accepté, case ignorée dans le tableau d'effectifs ou
dans le schéma d'évolution) : tous les défauts sont détectés.

**Non couvert** : les autres types (QCM, vrai/faux cliquables, vecteurs nommés, combinaisons de vecteurs,
équations de droites…) ; ni les autres
écritures possibles d'un même intervalle (seule la forme du corrigé est essayée).

**Il ne vérifie pas que le corrigé est mathématiquement juste** (recalcul indépendant à faire fiche par fiche),
ni toutes les mauvaises réponses possibles : seulement celles qu'il essaie (énoncé recopié, nombre calculé,
variations d'un intervalle ou d'un tableau).

## Utilisation

```bash
cd outils/audit-reponses && npm install        # une seule fois par machine (playwright-core, ~2 Mo)
node outils/audit-reponses/audit.js            # fiches modifiées depuis la dernière publication
node outils/audit-reponses/audit.js --toutes   # les 50 fiches
node outils/audit-reponses/audit.js cahiers/seconde/cahier-1/fiche-02.html
```

- Sans argument : les fiches modifiées par rapport à `origin/master` (commits non poussés + fichiers modifiés ou nouveaux).
  Si du **code partagé** a changé (`assets/js/…`, `automatismes/assets/…`, ce script), toutes les fiches sont auditées.
- Chaque fiche est régénérée plusieurs fois : 10 tirages saisis (30 pour une fiche modifiée ou nommée) et 100 tirages de
  corrigé ; `--tirages-saisie N` et `--tirages-corrige N` pour changer.
- **Prérequis** : Node.js et **Google Chrome** installés (aucun navigateur à télécharger). Si Chrome est absent, le script le dit.
- Rapport complet : `rapport.txt` (ignoré par Git). Code de sortie 1 s'il y a des anomalies **nouvelles** de gravité « erreur ».

## `connues.json` : la liste de travail

Les anomalies déjà présentes quand l'outil a été créé (12/10/2026) sont enregistrées dans `connues.json`
(clé `fiche|calcul|motif`). Par défaut le script n'affiche et ne sanctionne que les **nouvelles** anomalies ;
`--tout-afficher` montre aussi les connues. **`connues.json` n'est pas une liste d'exceptions acceptées mais le travail restant** :
chaque correction retire des lignes (`--enregistrer-connues` ne fait qu’ajouter ; après une correction, `--actualiser-connues` remplace les anomalies des fiches auditées par celles du lancement ;
).  Les tirages étant aléatoires, une anomalie rare peut manquer à un lancement : relancer pour confirmer qu’elle a bien disparu.

## Quand le relancer

- après toute modification d'une fiche (automatique par défaut) ;
- après toute modification du moteur de validation, des claviers ou d'un script partagé (toutes les fiches) ;
- de temps en temps en complet (changement de MathLive, de navigateur, gros chantier).
