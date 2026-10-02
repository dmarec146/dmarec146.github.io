# Cahiers interactifs

Trois fichiers à la racine du dépôt :

- **`SUIVI-FIREBASE.md`** — état actuel du site, procédure, pièges
  techniques. Court ; **à lire avant toute action**, ne pas partir de
  suppositions sans l'avoir lu. À tenir à jour quand l'état, la procédure
  ou un piège change.
- **`REGLES-FICHES.md`** — règles de rédaction des fiches données par David
  (nombre d'exemples, automatismes, titres, corrections, vérifications).
  **À lire aussi à l'ouverture** ; référence commune aux deux machines, à
  compléter dès que David donne une nouvelle consigne générale.
- **`HISTORIQUE.md`** — journal détaillé de toutes les modifications et
  décisions. **Ne pas le lire en entier** : le consulter par recherche
  quand on a besoin du pourquoi d'une décision. Chaque chantier terminé y
  ajoute une entrée datée **à la fin** (c'est là que va désormais le récit
  détaillé, plus dans `SUIVI-FIREBASE.md`).

(Et `CHANTIERS-FUTURS.md` : backlog de David pour plus tard, à ne modifier
qu'à sa demande.)

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
   version à jour, d'où l'ordre) — pas `HISTORIQUE.md`, consulté seulement
   au besoin.
4. Écrire un court message à l'utilisateur confirmant explicitement :
   `SUIVI-FIREBASE.md` et `REGLES-FICHES.md` lus ; état du dépôt par rapport
   à GitHub (à jour, ou mis à jour par `git pull` avec le nombre de commits
   récupérés, ou l'écart restant et pourquoi il n'a pas été comblé) ; rien
   d'inhabituel (fichiers non suivis, branches inattendues, conflits).
   **Ce message doit refléter l'état réel constaté**, pas une formule
   automatique — si quelque chose ne va pas (par exemple GitHub
   injoignable), le dire clairement plutôt que de rassurer à tort.
