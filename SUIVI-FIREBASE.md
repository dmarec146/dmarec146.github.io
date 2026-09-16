# Suivi Firebase — état des lieux et procédure de reprise

Ce fichier est tenu à jour au fil du travail sur la branche `suivi-firebase`.
Une nouvelle session Claude Code (sur une autre machine ou après une pause)
doit le lire en premier pour comprendre où en est le projet, avant de faire
quoi que ce soit.

## Avant toute chose : vérifier l'état du dépôt

`siteCahierCalcul` (dossier de travail habituel) et `siteCahierTemp` (créé
pour isoler ce travail Firebase le temps du pilote) partagent le même dépôt
GitHub, mais **`siteCahierCalcul` est littéralement le même `.git`,
synchronisé via Google Drive** — pas une copie séparée. Donc, avant d'agir :

```bash
git status
git log --oneline -5
git branch -a
```

Ne rien écraser (`checkout --`, `reset --hard`, etc.) sans comprendre ce qui
est déjà là. S'il y a un commit local non poussé ou des branches inhabituelles,
demander à l'utilisateur avant de les toucher.

## Où en est-on

Fondations Firebase complètes et testées (projet Firebase `cahiers-interactifs`) :

- Authentification : élèves via pseudo (`assets/js/connexion.js`), enseignant
  via son adresse email réelle.
- Règles de sécurité Firestore (`firestore.rules`) — **à republier manuellement
  dans Console Firebase à chaque modification** (pas de déploiement automatique).
- `outils/creer-comptes/` : script de création des comptes (élèves en masse
  depuis un CSV, ou compte enseignant admin).
- `outils/etiquettes/` : génère un PDF d'étiquettes à découper (identifiants).
- `/tableau-de-bord/` : réservé à l'enseignant — liste par classe (nom,
  fiches effectuées, connexions), détail par élève au clic (score, tentatives,
  questions faites, dernière activité), navigation élève suivant/précédent.
- Menu du site : icône connexion/déconnexion + lien tableau de bord (admin
  seulement) — chargé pour l'instant uniquement sur `index.html`, pas sur les
  fiches (hors périmètre du pilote).
- Suivi câblé en PILOTE sur une seule fiche :
  `cahiers/premiere/cahier-1/fiche-01.html` (voir `assets/js/suivi.js`).
  Score = questions réussies au moins une fois, tous passages confondus,
  rapporté au nombre total de questions de la fiche.

## Comptes existants dans Firebase

- Compte enseignant (email réel, droit `admin`).
- 21 élèves de la classe `2nde-207`.
- Compte de démonstration hors classe : `demo-eleve` / `DemoEleve2026`
  (classe `demo`), pour tester du point de vue élève sans toucher aux
  vraies données. Historique de tentatives vidé après chaque test.

## Pas encore fait

- Devoirs (brique à venir, sur demande explicite de l'utilisateur).
- Câblage du suivi sur les 42 autres fiches (attend une fusion + validation
  en conditions réelles sur la fiche pilote).
- Fusion de `suivi-firebase` vers `master` (pas encore demandée).

## Pièges déjà rencontrés

- Les fiches génèrent des exercices **aléatoires** à chaque chargement : une
  réponse figée dans un script de test peut devenir fausse au chargement
  suivant. Toujours relire `exercices[idx].reponse` dynamiquement.
- `firebase-admin` v14+ a une API modulaire
  (`require('firebase-admin/app')`, etc.) — pas l'ancien
  `admin.credential`/`admin.auth()`.
- Excel en français attend `;` comme séparateur CSV, pas `,`.
- Sur ce PC, Node.js est installé mais absent du PATH par défaut :
  `$env:PATH = "C:\Program Files\nodejs;" + $env:PATH` avant `node`/`npm`.

## Procédure de reprise sur une autre machine

1. Vérifier l'état du dépôt (section ci-dessus).
2. `git fetch origin`
3. Si `suivi-firebase` a été fusionnée dans `master` entre-temps (vérifier
   sur GitHub) : `git checkout master && git pull`.
   Sinon, pour continuer directement sur la branche de travail :
   `git checkout suivi-firebase && git pull`.
4. Lire l'artifact **"Cahier de suivi"** (action `list` des artifacts) pour
   le contexte et les choix de conception du projet.
5. Pour utiliser `outils/creer-comptes` ou `outils/etiquettes` : `npm install`
   dans chaque dossier, et vérifier que `outils/creer-comptes/service-account.json`
   est présent (sinon le retélécharger depuis Console Firebase → Paramètres
   du projet → Comptes de service).
