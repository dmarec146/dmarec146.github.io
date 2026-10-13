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

(Le backlog de David pour plus tard n'est plus un fichier du dépôt : c'est
l'artefact claude.ai « Chantiers futurs »,
https://claude.ai/artifact/D4BQtmML6BK5AtuAHRpbad, à ne modifier qu'à sa
demande.)

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

## À faire à la première session sur le PC perso (inscrit le 13/10/2026 — supprimer cette section une fois fait)

Le travail du 12–13/10/2026 (moteur de validation par forme, audit automatique) a été fait sur le PC pro. Le PC perso
doit, **après la procédure d'ouverture ci-dessus** (`git fetch` puis `git pull --ff-only`), exécuter ceci, dans l'ordre,
**sans que David ait à le demander**, puis lui en rendre compte :

1. **Installer l'outil d'audit** (une fois par machine) : `cd outils/audit-reponses && npm install` (≈ 2 Mo,
   playwright-core). Il pilote le Google Chrome **déjà installé** : vérifier que Chrome est présent en lançant
   `node outils/audit-reponses/audit.js cahiers/seconde/cahier-1/fiche-02.html` (doit finir par « OK ») ; si le script
   dit que Chrome est introuvable, le dire à David (ne pas télécharger de navigateur). Le dossier `node_modules` n'est
   pas dans Git (voir `outils/audit-reponses/README.md`).
2. **Contrôler que tout fonctionne** : `node outils/verification/verifier-syntaxe-fiches.js` (0 erreur) et
   `node outils/verification/test-moteur-reponses.js` (0 échec).
3. **Fusionner les règles locales dans `REGLES-FICHES.md`** : la mémoire de Claude (dossier `memory/` du projet sur
   ce PC, hors dépôt) n'est pas synchronisée entre les deux machines. Lire ses fichiers `feedback_*` et `project_*`,
   les comparer à `REGLES-FICHES.md`, et **ajouter dans `REGLES-FICHES.md` toute règle générale qui y manque** (sans
   dupliquer ni contredire ; en cas de contradiction, demander à David). Commit et push ensuite.
4. **Retenir les nouveautés** (déjà écrites dans les fichiers du dépôt, à relire dans `REGLES-FICHES.md` §4 et §5 et
   `SUIVI-FIREBASE.md`) : pour toute fiche ou tout calcul dont le titre impose une forme, ajouter l'entrée à
   `outils/moteur-reponses/formes-par-fiche.json` puis lancer `node outils/moteur-reponses/cabler-fiches.js` ;
   avant de pousser, `node outils/audit-reponses/audit.js` (aucune nouvelle anomalie de gravité « erreur »).
5. **Première 14 (Probabilités) reste à traiter après le 16/10/2026** (devoir en cours jusqu'à cette date, elle ne
   doit pas être modifiée avant) : câbler ses calculs « Calcul numérique » et appliquer les correctifs communs
   (affichage des grands entiers, adoucissement de l'affichage du corrigé) ; vérifier d'abord dans Firestore
   (lecture seule) qu'aucun devoir n'est plus en cours sur elle.
6. Quand tout est fait : prévenir David, puis **supprimer cette section de `CLAUDE.md`** (commit + push).
