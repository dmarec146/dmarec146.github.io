# Guide de l'enseignant (PDF)

Mode d'emploi du tableau de bord pour les enseignants invités (8 pages A4, couverture avec sommaire cliquable) :
invitation et connexion, obtention des comptes élèves, attribution des devoirs, notation, suivi des résultats, questions fréquentes.

- **PDF** : `assets/docs/guide-enseignant.pdf`, lié depuis le tableau de bord (`tableau-de-bord/devoirs.html`, sous l'introduction).
- **Source** : `guide-enseignant.html` (une `div.page` par page A4). Même feuille de style et mêmes polices que le guide de
  l'élève (`../guide-eleve/polices`) ; la feuille de style est recopiée dans le fichier, pas partagée. `corps.html` contient
  les pages seules ; pour reconstruire le fichier complet, recopier l'en-tête (jusqu'à `</style>`) de `../guide-eleve/guide-eleve.html`
  (titre et chemin des polices adaptés) devant `corps.html`.

## Régénérer le PDF

`node pdf.js` (même pilote de navigateur que le guide de l'élève : `../guide-eleve/navigateur.js`). Le script signale toute page
dont le contenu déborde sur le pied de page.

## Refaire les captures (si le tableau de bord change d'apparence)

Captures sur des données **fictives** uniquement (émulateurs, rien de réel) :

1. `node outils/test-local/lancer.js` (laisser tourner ; ports 8080, 9099, 5001, 5173 libres)
2. `node outils/guide-enseignant/seed-captures.js` (deux enseignants fictifs : `prof.martin@exemple.test` avec 8 élèves et 3 devoirs,
   `prof.nouveau@exemple.test` sans élève ; mot de passe `test1234`)
3. `node outils/guide-enseignant/captures.js` : écrit dans `img/` (en-tête connecté, boutons, formulaires, listes, résultats, encadré d'accueil).

## À tenir à jour

Ce guide décrit des règles décidées avec David : comptes élèves supprimés au 30 juin, pas d'adresse affichée pour l'administrateur
(écrire « l'administrateur du site »), les notes de chaque type de devoir. Si l'une d'elles change, adapter les pages 3, 6 et 8.
