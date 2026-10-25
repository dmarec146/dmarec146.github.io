# Guide de l'élève (PDF)

Mode d'emploi du site à distribuer aux élèves : fiches de calcul, fiches
d'automatismes, QCM de Terminale, devoirs (13 pages A4, couverture avec sommaire cliquable).

- **PDF à mettre en téléchargement** : `assets/docs/guide-eleve.pdf`
  (adresse publique une fois sur `master` :
  `https://dmarec146.github.io/assets/docs/guide-eleve.pdf`), lié depuis la
  page d'accueil (carte « Guide de l'élève »).
- **Source** : `guide-eleve.html` (une `<div class="page">` par page A4,
  couleurs du site), avec `img/` (captures réelles du site) et `polices/`
  (Inter et Source Serif 4, licence SIL Open Font License, servies en local).

## Modifier le guide

1. Modifier le texte dans `guide-eleve.html`.
2. Régénérer le PDF : `node pdf.js`. Le navigateur est choisi par `navigateur.js` : `playwright` s'il est
   installé avec son Chromium, sinon `playwright-core` et le Chrome déjà installé de l'outil d'audit (un seul
   `npm install` dans `outils/audit-reponses`, rien d'autre à télécharger). Le script
   signale toute page dont le contenu déborde sur le pied de page : réduire
   alors une capture (`style="width:80%;margin:0 auto"`) ou un texte.

## Captures du QCM Terminale (25/10/2026)

`node captures-reglages.js` (25/10/2026, mêmes prérequis) : `auto-reglages`, `auto-recap`, `chrono-intro` et `qcm-accueil`, c'est-à-dire la page d'entrée
avec « Mes réglages » et la ligne de rappel de la page de travail (pages 7 à 9 du guide).

`node captures-qcm.js` (site servi sur le port 8791, pilote de `navigateur.js`, **aucun** `node_modules` à part : les bibliothèques viennent
des CDN habituels, Firestore est coupé) : `qcm-carte-corrigee`, `qcm-bilan-niveau3` (niveau passé par l'adresse `?niveau=3`), et refait `accueil` et
`connexion` (page 2) pour montrer le bouton gris de la barre. Pages 9 et 10 du guide.

## Refaire les captures (si le site change d'apparence)

`node captures.js`, avec le site servi en local sur le port 8791 et un dossier
`node_modules` (variable `GUIDE_NODE_MODULES`, sinon `./node_modules`, non
suivi par Git) contenant `mathjax@3`, `mathjs@12.4.0`, `mathlive@0.110`,
`firebase@12.19.0` et `pngjs` : le script les sert à la place des CDN.
Les captures du mode devoir sont obtenues en simulant localement l'état d'un
élève connecté avec un devoir actif (aucun compte réel) ; la page « Mes
devoirs » et le bloc « Devoirs » sont des maquettes dessinées dans le HTML.
