# Contrôle des détails de correction

Contrôle automatique, **sans crédits** (un script Node qui pilote le Chrome déjà installé, comme `outils/audit-reponses/`), des
« Détails » de correction des fiches de calcul : les étapes que dévoile le bouton **Détails** dans « Voir la correction des erreurs ».
Mode d'emploi des détails et règles d'écriture : `REGLES-FICHES.md` §8.

Prérequis : `npm install` dans `outils/audit-reponses` (une fois par machine, `playwright-core` et le Chrome installé ; le
lanceur est partagé avec `outils/guide-eleve/navigateur.js`).

```
node outils/details-correction/controle.js cahiers/premiere/cahier-4/fiche-12.html
node outils/details-correction/controle.js --toutes          toutes les fiches qui portent des détails
node outils/details-correction/controle.js --couverture      tableau « exercices avec / sans détail » des 48 fiches
options : --tirages N (défaut 1500 pour une fiche nommée, 300 avec --toutes)
          --tirages-equivalences N (défaut 60 : la résolution numérique des équivalences est coûteuse)
          --regenerations K (interface, défaut 6)   --exemples N (défaut 2)   --sans-interface   --sans-autotest
```
Une fiche prend de 30 à 60 secondes. Code de sortie 1 s'il y a une anomalie de gravité « erreur ».

## Ce qu'il contrôle, pour chaque exercice qui porte `detail: { lignes, final }`

| Contrôle | Motif | Gravité |
|---|---|---|
| la dernière ligne contient `final` | `derniere-ligne-sans-final` | erreur |
| `final` égale la réponse attendue (nombres, expressions en `a`, `n`, `x`, ensembles, intervalles, couples, vecteurs, triplets), évalué en plusieurs valeurs des lettres | `final-different-de-la-reponse` | erreur |
| chaque chaîne d'égalités : deux membres numériques voisins égaux ; deux membres littéraux voisins égaux pour toute valeur des lettres (identité) | `chaine-d-egalites-fausse` | erreur |
| chaque équivalence `P ⟺ Q` entre équations ou inéquations (y compris « x = a ou x = b » et les doubles inégalités) a les mêmes solutions, par résolution numérique sur [-30 ; 30] ; une ligne qui commence par ⟺ prolonge la précédente | `equivalence-fausse` | erreur |
| le LaTeX de chaque ligne compile dans MathJax | `latex-invalide` | erreur |
| style : fraction de dénominateur 1 ou 0, `NaN`, exposant 1, signes doublés, coefficient 1 ou −1 devant une lettre (`1n`, `1\times r`), virgule nue, `<` brut, accolades ou `\left\right` déséquilibrés | `fraction-denominateur-1`, `coefficient-1`… | erreur |
| style : `\dfrac{-3}{4}` (signe devant la fraction), `fraction × lettre`, espace avant `%`, `{,}` dans du texte, ligne de plus de 170 signes | `signe-au-numerateur`… | style |
| interface, sur ordinateur (1000 px) et téléphone (375 px), après plusieurs régénérations : un bouton « Détails » par réponse fausse, les étapes s'ouvrent, aucune erreur MathJax affichée, aucune erreur de page, aucun débordement horizontal de la page | `bouton-details-manquant`, `details-ne-s-ouvrent-pas`, `erreur-de-page`, `debordement-horizontal` | erreur |
| interface : une ligne plus de 1,6 fois plus large que l'écran du téléphone (elle défile horizontalement), ou qui défile sur ordinateur | `ligne-trop-longue-telephone` | style |

## Rapports (dans ce dossier, non suivis par git)

- `rapport.txt` : anomalies par fiche, avec le nombre de contrôles réalisés et le résultat de l'auto-test.
- `phrases.txt` : **tout le texte libre** (`\text{…}`) écrit dans les étapes, phrase par phrase (les formules sont remplacées par […]),
  avec les exercices concernés et un exemple de ligne complète. Ce n'est pas la liste de ce que l'outil échoue à vérifier : il ne
  vérifie aucune phrase, donc toutes sont à relire pour leur justesse mathématique et leur formulation.
- `exemples.html` : deux exemples par exercice (énoncé, réponse attendue, étapes), à ouvrir dans un navigateur et à parcourir.
- `couverture.txt` : exercices avec et sans détail.

## Auto-test (l'outil se vérifie lui-même)

À chaque lancement, l'outil introduit des erreurs volontaires dans des copies des détails et vérifie qu'il les détecte : réponse
finale décalée, nombre modifié dans une chaîne d'égalités, nombre modifié dans une équivalence, accolade supprimée (MathJax doit
refuser), coefficient 1 ajouté. Résultat sur la fiche 12 (16/10/2026) : 100 % de détection sur les réponses finales, les accolades,
les équivalences et les coefficients 1, 99,3 % sur les chaînes d'égalités. Un taux inférieur à 90 % sur au moins 20 essais est
signalé comme erreur de l'outil.

## Ce qu'il ne garantit pas

1. **Les phrases de méthode** (zones `\text{…}`, par exemple « car u₁ + u₃ = 2u₂ ») : relecture humaine (`phrases.txt`).
2. **Une réponse attendue fausse dans la fiche** : les étapes sont comparées à elle.
3. **Un énoncé mal posé** (suite non définie, division par zéro dans la donnée…) : ce contrôle est propre à chaque fiche. Celui de
   la fiche 12 a révélé un tel défaut dans 12.8 (voir `HISTORIQUE.md`) ; à refaire pour les autres suites définies par récurrence.
4. **Les expressions qu'il ne sait pas lire** (tableaux `\begin{array}`, intervalles, ensembles, commandes inhabituelles) : comptées
   à part (« chaînes ou équivalences non lisibles » dans le rapport) et non vérifiées.
5. **Les réponses qui ne sont pas des nombres, expressions, ensembles, intervalles, couples, vecteurs ou triplets** (équations de
   droites, figures, tableaux, texte) : comptées « non vérifiables automatiquement ».
6. **La lisibilité et le sens pédagogique** : relecture de `exemples.html`.

## Étendre l'outil

Les contrôles sont dans la fonction `controlerDansLaPage` (code exécuté dans la page) ; l'interface est dans `controlerInterface`.
Un nouveau contrôle s'accompagne d'une mutation dans la section « auto-test », pour prouver qu'il détecte bien l'erreur qu'il vise.
