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

## Fiches à barème (contrôle obligatoire)

Les fiches qui contiennent `Bareme.definir(` ont un barème en points **fixé dans la fiche**, lié aux
identifiants de questions (« 9.6 a) »). Une question ajoutée, supprimée ou renumérotée le désynchronise
**sans aucun signal** (voir `outils/bareme/README.md`). David ne modifie les fiches que par Claude :
c'est donc à Claude de le vérifier, **sans le lui demander à chaque message** :

- **Quand** : (1) avant de commiter une modification qui touche une fiche à barème (ou `assets/js/bareme.js`) ;
  (2) **avant d'exécuter tout « pousse tout »**, même si aucune fiche à barème n'a été touchée dans
  la session (dernière barrière).
- **Comment** : `node outils/bareme/controle-bareme.js` (blocs cohérents avec `fiche-NN.json`), puis,
  dans le navigateur, `http://localhost:8791/outils/bareme/controle.html` et `Controle.lancer()`
  (génère chaque fiche 300 fois : questions sans points, points sans question). ~ 5 secondes.
- **Si tout est cohérent : ne rien dire.** S'il y a un écart : **alerter une seule fois** (au moment du
  commit ou du push, pas à chaque message) et **proposer directement le barème corrigé** (points des
  questions nouvelles ou déplacées d'après `outils/bareme/README.md`, ce qui change par rapport à
  l'ancien) ; ne pas publier tant que David n'a pas validé et que le contrôle n'est pas au vert.
- Une fiche qu'on branche au barème doit être ajoutée à la table `FICHES` de `appliquer-bareme.js`
  (le contrôle le signale sinon).
