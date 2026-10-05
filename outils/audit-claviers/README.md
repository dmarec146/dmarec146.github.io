# Audit des claviers de saisie (05/10/2026)

Banc d'essai à rejouer **après toute mise à jour de MathLive** (chargé sans numéro de version
depuis unpkg : ses comportements peuvent changer sans prévenir) ou toute retouche de
`assets/js/claviers.js` ou des fonctions `inserer*` des fiches.

## Lancer

1. Démarrer le serveur statique (`preview_start site-statique`, port 8791).
2. Ouvrir `http://localhost:8791/outils/audit-claviers/index.html`.
3. Dans la console de la page : `A.audit('ecran')`, `A.audit('fumee')` ou
   `A.audit('inventaire')`, puis attendre `AUDIT_FIN === true` (≈ 2 min 30 : les 50 fiches sont
   chargées une à une dans l'iframe) et lire `AUDIT[phase]`.

| Phase | Ce qu'elle fait | Résultat attendu |
|---|---|---|
| `ecran` | Pour chaque clavier maison d'un champ mathématique à touche « ; » (intervalles, ensembles, couples), 13 séquences de clics (`{-2;3}`, `{1/2}`, `]-∞;1/2[∪]3/2;+∞[`, `]-√3;√3[`…) | tous `OK` ; `saute` seulement si une touche n'existe pas sur ce clavier |
| `fumee` | Clique chaque touche de chaque clavier (champ vide) et note le résultat ; erreurs JavaScript | aucune erreur ; une même touche donne le même résultat d'une fiche à l'autre (variantes connues : `(▢)/(▢)` ou `()/()`, `√(▢)` ou `sqrt()`, `∅` ou `\emptyset`) |
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
