# Suivi Firebase — état des lieux et procédure de reprise

**À lire en premier**, avant toute action, par toute session Claude Code qui
reprend ce travail — que ce soit sur une autre machine (PC perso ↔ PC pro)
ou en revenant sur la même après une pause. Ce n'est pas à sens unique :
PC pro doit le lire en revenant d'une session sur PC perso, tout comme
PC perso en revenant d'une session sur PC pro.

**À mettre à jour**, par la session en cours, dès que quelque chose change
la procédure ou l'état décrits ici (nouvelle brique livrée, nouveau piège
rencontré, fusion effectuée, etc.) — sans attendre que l'utilisateur le
demande. Un petit ajout suffit ; pas besoin de tout réécrire.

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

**État vérifié le 16/09/2026** : `siteCahierCalcul` est propre — `master`
à jour avec `origin/master` (un commit local en attente, "fil d'ariane sur
les fiches", a été vérifié sans chevauchement avec ce travail puis poussé),
rien en suspens. Les branches locales `claude/adoring-engelbart-62b11c` et
`worktree-agent-a776ebf0c56aba0bc` sont des résidus d'une session/worktree
précédente, pas touchées.

Important : `master` a donc avancé d'un commit depuis la création de
`suivi-firebase`. La fusion ne sera plus un fast-forward mais une vraie
fusion à 3 — sans conflit attendu (le commit poussé touche `fiche-01.html`
mais dans des zones du fichier totalement différentes de celles modifiées
ici : fil d'ariane en tête de `<body>` et CSS vers la ligne 39, contre le
script de suivi vers la ligne 1720 et au-delà).

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
  Pour les élèves de Première : deux boutons sous le nom ("Cahiers de calcul"
  / "Automatismes — sujets blancs") pour basculer entre les deux sections
  plutôt que de les empiler (le tableau des cahiers de calcul grandira ligne
  par ligne comme pour la Seconde). Piège rencontré : `.tdb-onglets[hidden]`
  doit être explicitement redéfini en CSS (`display: none`), sinon
  `.tdb-onglets { display: flex; }` prend le dessus sur l'attribut `hidden`
  par spécificité égale et les boutons restent visibles même pour les élèves
  hors Première.
- Menu du site : icône connexion/déconnexion + lien tableau de bord (admin
  seulement) — chargée pour l'instant sur `index.html` et `/tableau-de-bord/`
  (le bouton texte "Se déconnecter" du tableau de bord a été retiré au profit
  de cette icône, pour rester cohérent avec le reste du site), pas sur les
  fiches (hors périmètre du pilote).
- Suivi câblé sur **les 44 fiches de calcul** (Première + Seconde) — le
  pilote (`cahiers/premiere/cahier-1/fiche-01.html`) puis les 43 autres,
  même schéma partout (voir `assets/js/suivi.js`). Score = questions
  réussies au moins une fois, tous passages confondus, rapporté au nombre
  total de questions de la fiche.
- Suivi des **automatismes de Première** : uniquement les sujets blancs
  (`automatismes/premiere/sujet-blanc.html`), pas les fiches thématiques
  libres (`fiche.html`, jamais suivies, même en mode chrono — non notées
  par choix). Fonctionne quel que soit le mode (fiche ou chrono) utilisé
  pour le sujet blanc lui-même, un seul enregistrement par série
  (`verifierFinSerie()` dans `automatismes/assets/moteur.js`). Tableau de
  bord : trois lignes par élève de Première (niveaux 1/2/3), note moyenne
  sur 6 et nombre de sujets par niveau. Seconde/Terminale non concernées
  (déterminé par le préfixe de `classe`, ex. "1ere-3" — aucune saisie
  supplémentaire nécessaire à la création des comptes).

## Comptes existants dans Firebase

- Compte enseignant (email réel, droit `admin`).
- 21 élèves de la classe `2nde-207`.
- Compte de démonstration hors classe : `demo-eleve` / `DemoEleve2026`
  (classe `1ere-demo`, donc reconnu Première pour le suivi automatismes),
  pour tester du point de vue élève sans toucher aux vraies données.
  Historique de tentatives/automatismes vidé après chaque test.
- Deux comptes élèves fictifs pour tester le tableau de bord avec des
  données réalistes : `l.testeur` (classe `2nde-test`, deux fiches de calcul
  travaillées) et `n.testeuse` (classe `1ere-test`, deux fiches de calcul +
  deux sujets blancs, un par mode fiche/chrono). Identifiants dans
  `outils/creer-comptes/comptes-crees-2026-09-16T09-33-55-634Z.csv`
  (jamais commité). À supprimer si plus utiles.

## Pas encore fait

- Devoirs (brique à venir, sur demande explicite de l'utilisateur). Le mode
  chrono sera imposé pour les devoirs (décidé, pas encore fait).
- Fil d'ariane des 44 fiches de calcul : existe seulement sur `master`
  (commit `02c07b7`, jamais fusionné ici), en 12px. L'utilisateur voulait
  l'agrandir légèrement (fait pour les automatismes, 14px) — à reproduire
  sur les fiches de calcul une fois la fusion faite (pas avant, pour ne pas
  créer un vrai conflit en dupliquant ce bloc ici).
- Fusion de `suivi-firebase` vers `master` — décidée : se fera une fois le
  reste du travail sur cette branche terminé (pas seulement le câblage),
  sur demande explicite de l'utilisateur le moment venu. Aucun élève n'a
  encore reçu ses identifiants, donc pas d'urgence ni de risque à continuer
  sur cette branche.

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

   **Déjà fait** : `service-account.json`, le CSV de comptes de la 207
   (`comptes-crees-2026-09-15T14-06-47-054Z.csv`) et le PDF d'étiquettes
   correspondant ont été copiés à l'avance dans
   `siteCahierCalcul/outils/creer-comptes/` et `.../outils/etiquettes/` —
   ils se synchroniseront via Drive même si `suivi-firebase` n'est pas encore
   fusionnée (ces fichiers ne sont de toute façon jamais suivis par git).
   Il ne restera que `npm install` à lancer dans chaque dossier.
