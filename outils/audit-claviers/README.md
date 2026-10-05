# Audit des claviers de saisie (05/10/2026)

Banc d'essai à rejouer **avant tout changement de version de MathLive** (épinglé à 0.111.0 depuis
le 05/10/2026 : ses comportements changent d'une version à l'autre) ou après toute retouche de
`assets/js/claviers.js` ou des fonctions `inserer*` des fiches.

## Lancer

1. Démarrer le serveur statique (`preview_start site-statique`, port 8791).
2. Ouvrir `http://localhost:8791/outils/audit-claviers/index.html`.
3. Dans la console de la page : `A.audit('ecran')`, `A.audit('fumee')`,
   `A.audit('fleches')`, `A.audit('largeur')`, `A.audit('reels')`, `A.audit('debordement')` ou `A.audit('inventaire')`, puis attendre `AUDIT_FIN === true` (≈ 2 min 30 : les 50 fiches sont
   chargées une à une dans l'iframe) et lire `AUDIT[phase]`.

| Phase | Ce qu'elle fait | Résultat attendu |
|---|---|---|
| `ecran` | Pour chaque clavier maison d'un champ mathématique à touche « ; » (intervalles, ensembles, couples), 13 séquences de clics (`{-2;3}`, `{1/2}`, `]-∞;1/2[∪]3/2;+∞[`, `]-√3;√3[`…) | tous `OK` ; `saute` seulement si une touche n'existe pas sur ce clavier |
| `fumee` | Clique chaque touche de chaque clavier (champ vide) et note le résultat ; erreurs JavaScript | aucune erreur ; une même touche donne le même résultat d'une fiche à l'autre (variantes connues : `(▢)/(▢)` ou `()/()`, `√(▢)` ou `sqrt()`, `∅` ou `\emptyset`) |
| `fleches` | Touche → : fractions et racines remplies au clavier à l'écran (`a/b 1 → 2 → + 3`, `√ 5 → + 1`, racine au numérateur), champs mathématiques et champs texte | tous `OK` ; aucune « anomalie » (clavier à fraction/racine sans →) |
| `largeur` | Met une réponse longue dans un champ mathématique ordinaire et dans un champ à séparateur, attend 2,5 s, mesure le rognage ; débordement de la page. À lancer avec `A.largeurIframe(1000)` (ordinateur) puis `A.largeurIframe(375)` (téléphone) | aucun champ rogné avec une réponse **réaliste** (une réponse volontairement énorme ne tient pas à 375 px, même à 12 px) ; les débordements de page de Première 14, 16 et 22 sont antérieurs (tableau, énoncés MathJax) |
| `reels` | Sur chaque clavier d'intervalles : `]-∞;+∞[`, ℝ, ∅ puis `]-∞;1[` saisis par les touches et passés à `checkIntervalle` | tous `OK` (ℝ et `]-∞;+∞[` acceptés pour « tout », refusés pour un intervalle ordinaire, et inversement) |
| `debordement` | Page à 375 px (`A.largeurIframe(375)`) : largeur de la page sur 4 tirages par fiche, éléments qui dépassent, formules rognées | aucune page plus large que l'écran ; aucun rognage (les énoncés sont aléatoires : un seul tirage ne suffit pas, des cas rares existent) |
| `inventaire` | Types de champs, claviers, touches, variantes de `inserer*` | 7 types de champs ; 2 variantes de `inserer`, `insererRacine` et `insererFraction` |

## Ce que le banc ne fait pas : la frappe physique

L'outil `computer` du navigateur a deux actions : `type` n'émet que des événements
`beforeinput` (le « / » reste littéral, `sqrt` n'est pas reconnu) et **ne reproduit pas un
clavier** ; **`key`** émet de vrais `keydown` (touches séparées par des espaces :
`] - 2 ; 5 [`). Pour la frappe physique, utiliser `key`, un champ à la fois : vider
(`setValue('')` + `focus()`), taper, lire `getValue('latex')` et `valeurDuChamp`. Corpus
vérifié le 05/10/2026 (champ d'ensemble/intervalle de la fiche 2 de Première, fiche 16 de
Seconde pour les couples) : `{3}`, `{-2;3}`, `{}`, `{1/2}`, `{1/2;3/4}`, `{-1/2;3}`, `]-2;5[`,
`]1/2;3[`, `]3/2;5/2]`, `]12/5;7/2[`, `[1;+2[`, `]1,5;2[`, `(3;2)`, `(1/2;3)`, `(3;1/2)`,
`(-1/2;3/4)`, `(1;(1+2)/3)`, `(1;1/(2+3))`, `(2;-3)`, plus une réponse de la question 2.5
(`{(-1-3sqrt(7))/2;(-1+3sqrt(7))/2}`) acceptée par le correcteur.
**Le premier appui après un chargement de page peut être perdu (focus) : refaire l'essai.**

## Aller-retour du brouillon

`saisies[idx].latex` + `setValue(latex, {format:'latex'})` doit redonner exactement la même
saisie ; l'ancien chemin (`setValue(valeur, {format:'ascii-math'})`) perdait le dernier
crochet de `]-∞;3/2[`, `[1;+∞[`, `]-∞;1[∪]3;+∞[`… (6 saisies sur 13).
