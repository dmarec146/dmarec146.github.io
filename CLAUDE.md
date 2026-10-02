# Cahiers interactifs

Avant toute action sur ce projet, lire **`SUIVI-FIREBASE.md`** à la racine
du dépôt — état des lieux, procédure de reprise sur une autre machine,
pièges déjà rencontrés. Ce fichier est à jour et se met à jour lui-même ;
ne pas partir de suppositions sans l'avoir lu.

Avant de modifier une fiche de calcul, lire aussi **`REGLES-FICHES.md`** :
règles de rédaction données par David (nombre d'exemples, automatismes,
titres, corrections, vérifications). Ce fichier est la référence commune aux
deux machines ; le compléter dès que David donne une nouvelle consigne
générale.

## À l'ouverture de toute session

1. **Récupérer l'état de GitHub d'abord** — le travail a pu avancer sur
   l'autre machine (PC pro ↔ PC perso) :
   - `git fetch` (sans lui, `origin/master` est l'état connu lors du dernier
     contact avec GitHub, et un retard passerait inaperçu) ;
   - `git status`, `git branch -a`, puis compter l'écart dans les deux sens :
     `git log origin/master..HEAD --oneline` (commits locaux non poussés) et
     `git log HEAD..origin/master --oneline` (commits de GitHub pas encore
     récupérés).
2. **Mettre à jour si c'est sans risque** : si la machine est en retard, sur
   `master`, sans commit local non poussé et sans modification locale de
   fichiers suivis (les fichiers non suivis ignorés par `.gitignore` ne
   comptent pas), faire `git pull --ff-only` — il ne fait qu'avancer, jamais
   de fusion ni d'écrasement. **Dans tous les autres cas** (commits locaux,
   fichiers modifiés, autre branche, `git fetch` impossible faute de réseau,
   échec du pull), ne rien forcer : s'arrêter et expliquer la situation à
   l'utilisateur.
3. **Lire ensuite** `SUIVI-FIREBASE.md` et `REGLES-FICHES.md` (dans leur
   version à jour, d'où l'ordre).
4. Écrire un court message à l'utilisateur confirmant explicitement :
   `SUIVI-FIREBASE.md` et `REGLES-FICHES.md` lus ; état du dépôt par rapport
   à GitHub (à jour, ou mis à jour par `git pull` avec le nombre de commits
   récupérés, ou l'écart restant et pourquoi il n'a pas été comblé) ; rien
   d'inhabituel (fichiers non suivis, branches inattendues, conflits).
   **Ce message doit refléter l'état réel constaté**, pas une formule
   automatique — si quelque chose ne va pas (par exemple GitHub
   injoignable), le dire clairement plutôt que de rassurer à tort.
