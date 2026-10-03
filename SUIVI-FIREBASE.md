# Suivi du projet — état actuel, procédure, pièges

**À lire en premier**, par toute session Claude Code, sur PC pro comme sur
PC perso (après le `git fetch` / `git pull` décrit dans `CLAUDE.md`).
Ce fichier décrit **l'état actuel** du site : il est volontairement court.

- Règles de rédaction des fiches de calcul : **`REGLES-FICHES.md`**.
- Journal détaillé de toutes les modifications et décisions (le *pourquoi*,
  les vérifications faites) : **`HISTORIQUE.md`** — à ne pas lire en entier,
  à consulter par recherche au besoin.

**À mettre à jour** dès que l'état, la procédure ou un piège change ; le
récit daté d'un chantier va à la fin de `HISTORIQUE.md` (section « Journal
depuis la réorganisation du 02/10/2026 »).

## 1. Dépôt et machines

- Un clone Git local par machine, **hors Google Drive**, synchronisé
  uniquement par GitHub (`git push` / `git pull`) :
  PC pro `C:\Users\David\Documents\siteCahierCalcul`,
  PC perso `C:\Users\david\Documents\siteCahierCalcul`.
  (Jusqu'au 18/09/2026 le dépôt était synchronisé par Drive : abandonné,
  risque de corruption. Les anciens dossiers Drive ne servent plus.)
- Branche de travail : `master` (servie par GitHub Pages, site en
  production). Branche `suivi-firebase` et tag `pre-fusion-suivi-firebase`
  conservés comme filets de sécurité, ne pas les supprimer.
- Vérification d'ouverture (faite automatiquement selon `CLAUDE.md`) :

  ```bash
  git fetch
  git status
  git log origin/master..HEAD --oneline   # commits locaux non poussés
  git log HEAD..origin/master --oneline   # commits de GitHub pas encore récupérés
  git branch -a
  ```

  Une branche `claude/...` ou un dossier `.claude/worktrees/` = travail
  d'une ancienne session peut-être non fusionné : vérifier avec
  `git cherry -v master <branche>` avant toute chose. Ne rien écraser
  (`reset --hard`, `checkout --`…) sans comprendre ce qui est là.
- `.claude/scratch/` (scripts ponctuels déjà appliqués) est ignoré par Git
  et reste local à chaque machine : ne jamais relancer ces scripts.

## 2. Le site

- **50 fiches de calcul** autonomes, `cahiers/{premiere|seconde}/cahier-N/fiche-NN.html` :
  Première 26 (fiches 1 à 26, réorganisées le 30/09/2026), Seconde 24
  (fiches 1 à 25, la 24 n'existe pas encore — à ajouter aussi dans
  `assets/js/manifeste-fiches.js` le jour où elle sera créée).
  Chaque fiche porte son propre CSS et son propre JavaScript (générateurs
  aléatoires, `groupes`, `construireGrilles()`, vérificateurs, aide « ? »,
  corrigé) : un correctif fait dans une fiche ne s'applique pas aux autres.
  Fiches 25-26 de Première (logique, ensembles) : statiques, voulu.
- Fichiers partagés :
  - `assets/js/suivi.js` (module, donc **différé**) : tout le suivi Firebase
    des devoirs (brouillons, validations, tentatives, verrouillages).
  - `assets/js/claviers.js` : claviers de saisie (accolades et intégrale à
    bornes sur le clavier MathLive, quatre opérations ajoutées à tout
    clavier simplifié, focus conservé sur les `<math-field>`, politique
    `math-virtual-keyboard-policy="manual"` pour les champs à clavier maison).
  - `assets/js/nav-auth.js` (icônes connexion / tableau de bord, espace
    réservé par `visibility` pour éviter tout décalage),
    `devoirs-notification.js` + `devoirs-eleve.js` (bloc « Devoirs » et
    pastille des pages d'entrée), `mes-devoirs.js`, `devoirs.js`
    (tableau de bord enseignant), `manifeste-fiches.js` (liste des fiches
    pour l'attribution, à tenir à jour à la main), `export-cahier.js`.
  - `assets/js/statistiques.js` (module, chargé par les 76 pages publiques) :
    mesure de fréquentation anonyme, une écriture Firestore par page vue
    (voir §3). Pied de page : « Mesure de fréquentation anonyme… ».
  - MathLive (0.110, chargé sans numéro de version depuis unpkg) et MathJax.
- **Automatismes de Première** : `automatismes/premiere/sujet-blanc.html`
  et `fiche.html` (fiche ciblée par thèmes), moteur partagé
  `automatismes/assets/moteur.js`, banques dans `automatismes/premiere/banques/`.
- **Guide de l'élève** (PDF de 11 pages, mode d'emploi des fiches, des
  automatismes et des devoirs) : `assets/docs/guide-eleve.pdf` ; source HTML,
  captures et scripts de génération dans `outils/guide-eleve/` (voir son
  `README.md`). Lié depuis l'accueil (carte « Guide de l'élève », dernière
  section, ouverture dans un nouvel onglet).

## 3. Firebase (projet `cahiers-interactifs`)

- Authentification : élèves par pseudo (`assets/js/connexion.js`),
  enseignant par son adresse réelle (droit `admin`). La session reste
  ouverte jusqu'à « Se déconnecter » (**choix de David**, 18/09/2026 : ne
  pas proposer de changer ce réglage ; rappeler aux élèves de se
  déconnecter sur poste partagé).
- `firestore.rules` : **à republier à la main dans la Console Firebase après
  toute modification** (pas de déploiement automatique ; sinon les
  écritures échouent en silence). Dernière publication : 03/10/2026
  (`statistiques`, fréquentation anonyme) — testées au préalable dans
  l'émulateur (`outils/verification/regles-firestore/`, 29 cas), test à
  relancer avant toute nouvelle publication.
- Collections utiles : `statistiques/{AAAA-MM-JJ}_{0-4}` (fréquentation
  anonyme : compteurs du jour, +1 seulement pour tout visiteur, lecture
  admin ; enseignant et navigateurs où il s'est connecté exclus) ;
  `devoirs/{id}` (lecture élève connecté, écriture admin) ; sous `eleves/{uid}` : `brouillons/{ficheId}`,
  `brouillonsAutomatismes/{devoirId}`, `devoirsTentatives` (journal des
  tentatives de devoir), `connexions` (journal d'audit).
  **Orphelines** (plus lues depuis le 29/09/2026) : `resultats`,
  `automatismes`, `tentatives` — `enregistrerTentative()` écrit encore dans
  `tentatives` depuis 14 fiches à widget de Seconde (nettoyage possible,
  non demandé).
- **Seul le travail fait dans le cadre d'un devoir est suivi** (décision de
  David, 29/09/2026). Hors devoir, un élève connecté a exactement le
  comportement d'un visiteur anonyme (choix du mode, correction immédiate,
  « Voir toutes les réponses », pas d'Enregistrer ni de Valider).
- Outils (Node.js ; sur PC pro, Node n'est pas dans le PATH par défaut :
  `$env:PATH = "C:\Program Files\nodejs;" + $env:PATH`) :
  `outils/creer-comptes/` (comptes en masse depuis un CSV, ou `--admin`),
  `outils/etiquettes/` (PDF d'identifiants), `outils/verification/`
  (vérificateur de syntaxe des fiches, sans dépendance). Scripts
  d'administration Firestore : `firebase-admin` (API modulaire v14+),
  clé `outils/creer-comptes/service-account.json` (jamais suivie par Git).
- **Opérations destructrices sur Firestore** : uniquement avec l'accord de
  David, après inventaire en lecture seule et sauvegarde JSON.

## 4. Devoirs — fonctionnement actuel

- **Attribution** (`tableau-de-bord/devoirs.html` ; l'autre volet du tableau
  de bord est `frequentation.html`, statistiques de visites) : fiche de calcul, sujet blanc d'automatismes, ou fiche
  d'automatismes ciblée (`type:'automatismes'`, `cible:'fiche'`, `themes`) ;
  classe, échéance, nombre d'essais ; pour les automatismes niveau, mode
  (fiche/chrono) et durée par question (chrono). Trois panneaux : Attribuer,
  Devoirs en cours, Devoirs faits (« Modifier », « Supprimer », « Tout
  supprimer » pour les faits, « Résultats » par élève : meilleure tentative
  avant l'échéance, horodatage serveur, essais, non-réponses).
- Classes : `2nde-207`, `1ere-Gr 1`, `1ere-Gr 3` (groupes de spécialité,
  format `1ere-Gr N`), comptes de test `1ere-demo`, `1ere-test`,
  `2nde-test`. Élève **hors classe** (sans champ `classe`) : sentinelle
  `"hors-classe"` côté client uniquement, ciblage individuel possible par
  le champ `eleves` (tableau d'uid) du devoir.
- **Côté élève** : bloc « Devoirs » + pastille sur les 4 pages d'entrée ;
  `/mes-devoirs/` en trois colonnes : **Enregistrés** (ouvert + brouillon),
  **À faire** (ouvert, sans brouillon, avec la meilleure note si déjà
  rendu), **Faits** (essais épuisés ou échéance passée). Les brouillons
  orphelins sont supprimés.
- **Sur une fiche de calcul en devoir** : Enregistrer (reprise exacte, ne
  compte pas), Valider (compte une tentative, après confirmation dans une
  fenêtre de style « Devoir »), Recommencer masqué, « Générer une nouvelle
  version » = nouvelle tentative (confirmation), bandeau permanent
  `#devoir-info` (« X/Y tentatives, à rendre avant… »), correction cachée
  jusqu'à la validation, pop-up quand les essais sont épuisés (en direct ou
  au chargement), puis retour en entraînement libre
  (`passerEnEntrainementLibre()`). Validation après l'échéance : rien
  n'est compté (pop-up dédiée).
- **Automatismes en devoir** : page verrouillée sur niveau / mode / durée /
  thèmes du devoir (`config.verrouille` du moteur), correction bloquée
  jusqu'à la validation de la série ; mode fiche : Enregistrer / Valider ma
  série (pas d'Enregistrer en chrono, série d'une traite) ; chrono :
  reprise des questions sans réponse dans le budget de temps global (le
  temps continue de s'écouler sur l'écran de reprise), « Terminer le
  sujet » explicite ; barème 0,5 point par question (note sur 5).
- Ciblage : un seul devoir retenu quand plusieurs visent la même fiche ou
  la même cible (`choisirDevoirActif()` : le plus proche de son échéance
  parmi les ouverts) ; côté automatismes, tout se fait **par id de
  devoir** (`...ParId`).

## 5. Comptes

- Compte enseignant (adresse réelle, `admin`).
- Élèves réels : `2nde-207` (21), `1ere-Gr 1` (27), `1ere-Gr 3` (26),
  `e.marec` (hors classe, compte réel).
- Comptes de test : `demo-eleve` (classe `1ere-demo`, utilisé par David
  pour ses essais — vidé de ses devoirs et tentatives le 30/09/2026, seul
  son journal `connexions` est conservé), `l.testeur` (`2nde-test`),
  `n.testeuse` (`1ere-test`) — identifiants dans
  `outils/creer-comptes/comptes-crees-*.csv` (non suivis par Git).
- **Tests avec connexion** : Claude ne saisit jamais de mot de passe sur un
  service d'authentification ; David se connecte lui-même dans le
  navigateur intégré, ou un compte jetable est créé puis supprimé.

## 6. Pistes ouvertes / à faire

Backlog de David pour après le travail sur les fiches :
**`CHANTIERS-FUTURS.md`** (moteur robuste pour les plages de l'aléatoire,
banque d'automatismes) — **ne le modifier qu'à sa demande**.

- Diversifier les automatismes des fiches de Première 7 à 26 au fil des
  relectures de David (règle et modèles dans `REGLES-FICHES.md`, §2).
- Fiche 17 de Première (probabilités, ex-fiche 19) : erreur console
  intermittente au chargement (`<svg> attribute width: "NaNex"`, SVG MathJax
  à dimensions NaN), apparue avec le trait de l'événement contraire dessiné
  dans l'arbre (`texteEvenementSVG`) ; aucun effet visible constaté, cause
  non trouvée. **Mis de côté par David (01/09/2026) : n'y revenir que sur
  sa demande.**
- Fiche 12 de Première (suites arithmétiques, ex-fiche 14) : un groupe dont
  la condition sur \(a\) manque dans l'énoncé d'origine est laissé
  statique, **choix de David** (ne pas inventer de condition).
- Nettoyage possible des écritures orphelines (`enregistrerTentative()`
  des 14 fiches à widget de Seconde).
- Idée non demandée : barème réglable devoir par devoir (automatismes).
- Fiche 2 de Première : pas de titre de section entre les automatismes et
  2.3 (remarque, non traitée).
- Seconde fiche 24 : pas encore construite.
- `README.md` en partie périmé (annonce 3 cahiers de Seconde, il y en a 8 ;
  ne parle ni du suivi Firebase ni des devoirs) — non traité.

## 7. Pièges techniques (résumé — détails dans `HISTORIQUE.md`)

**Fiches et générateurs**
- Exercices aléatoires : toujours relire `exercices[idx]` dynamiquement
  dans un test, jamais une réponse figée.
- Identifiants de questions positionnels (`"5.3 a)"`), stockés dans
  Firestore : renuméroter = renommer les ids + recalculer `groupes` ;
  `lettresEtendues` doit couvrir le plus grand groupe (sinon lettres vides
  en silence) ; brouillon valide seulement si même liste d'ids.
- Renommer / renuméroter un **fichier** change son `ficheId` (= chemin) :
  brouillons, tentatives et devoirs restent sur l'ancien chemin → migrer
  les documents si des élèves l'ont utilisé.
- État tiré au hasard hors de `exercices` (figures, textes, titres) : à
  sauver avec le brouillon (`etatSupplementairePourBrouillon` /
  `restaurerEtatSupplementaire`) ; une fonction JS ne survit pas au JSON
  (sauver les coefficients et la reconstruire).
- En Première, les générateurs ne recopient que `id` et `type` : tout
  drapeau (`margeLecture`, `sansEgal`, `formePuissance2`…) va **dans
  l'objet renvoyé par `gen()`**.
- Les fiches n'ont pas les mêmes outils (fractions `F(n,d)` en fiche 5,
  objet `F.of/F.add` en fiche 6…) : adapter, ne pas copier.
- Après un script qui réassemble du code : relire le fichier (fonctions
  déclarées deux fois, ids non renumérotés, titre de section en double,
  `>` perdu dans une balise renumérotée — invisibles aux tests de syntaxe).
- `const exercices` interdit (la reprise d'un brouillon le réaffecte) :
  toujours `let`.

**MathLive, saisie, affichage**
- `valeurDuChamp` lit un `<math-field>` en ascii-math ; pour réécrire une
  saisie : `setValue(v, {format:'ascii-math'})`, jamais `.value =` (lu
  comme du LaTeX : `sqrt(6)` → « s q r t(6) »).
- Tests : injecter du LaTeX (`setValue(latex, {format:'latex'})`) ;
  `\displaystyle\sum` et `\left\{…\right\}` ne se relisent pas (sommes :
  `\sum_{k=1}^{n}…` comme la touche Σ ; ensembles : `\lbrace…\rbrace`) ;
  MathLive émet `input` en différé après `setValue` (relancer la
  vérification pour voir les coches).
- Couples lus en LaTeX brut dans certaines fiches de Seconde
  (`latexNombresVersAscii` avant comparaison).
- `entoureParParentheses()` avant tout retrait de parenthèses extérieures
  (ne retirer que si elles se correspondent).
- Un « < » dans une réponse affichée doit être échappé (sinon le panneau
  « Voir toutes les réponses » se tronque) ; dans un énoncé, écrire `\lt` :
  « <e^{2x} » ou « <x » ouvre une balise HTML et tronque l'énoncé (fiches 7
  et 8 de Première, 02/10/2026).

**Firebase et pages**
- `suivi.js` est un module différé : tout code qui l'utilise au chargement
  attend `DOMContentLoaded` ; une page qui en a besoin doit **inclure** la
  balise `<script type="module" src="…/suivi.js">` (oubli constaté sur
  `fiche.html`, 28/09/2026).
- Firestore refuse les tableaux imbriqués (`invalid-argument`) : objets
  indexés. `updateDoc` n'efface pas un champ absent : `deleteField()`.
  Requêtes strictes sur le type (`niveau` nombre, pas chaîne) ; `ficheId`
  au format `window.location.pathname` (avec la barre initiale). Filtrer
  les échéances côté client (pas d'index composite).
- Les onglets du navigateur partagent la même session Firebase : se
  connecter sous un autre compte déconnecte les autres onglets.
- CSS : un `display` en classe ou en ligne l'emporte sur l'attribut
  `hidden` — piloter `style.display` ou prévoir `[hidden]` explicite.

**Scripts et outils (Windows)**
- Scripts contenant des antislashs (LaTeX) : les écrire dans un fichier
  (outil Write), jamais via un heredoc shell ou `node -e` (antislashs
  mangés).
- PowerShell 5.1 lit les `.ps1` en ANSI : aucun caractère accentué tapé en
  dur ; préférer Node. Fichiers du dépôt en CRLF, blocs ajoutés parfois en
  LF : comparer sans tenir compte des fins de ligne.
- Chemins dans les scripts Node : `/` explicites (`path.join` met des `\`).
- Excel français : CSV séparé par `;`.
- `.claude/launch.json` → `.claude/static-server.ps1` (chemin relatif,
  suivi par Git) : serveur de développement sur le port 8791.

## 8. Procédure de reprise sur une autre machine

1. Clone local hors Drive. S'il existe : `git status` (rien ne doit
   traîner) puis `git checkout master && git pull`. Sinon :
   `git clone https://github.com/dmarec146/dmarec146.github.io.git <chemin-hors-drive>`.
2. Serveur de développement : `.claude/launch.json` fonctionne tel quel sur
   tout clone.
3. Outils `outils/creer-comptes` et `outils/etiquettes` : `npm install` dans
   chaque dossier ; recopier ou retélécharger `service-account.json`
   (Console Firebase → Paramètres du projet → Comptes de service) — jamais
   suivi par Git, ne voyage pas d'une machine à l'autre.
4. Avant de modifier une fiche : lire `REGLES-FICHES.md`. Vérificateur de
   syntaxe : `node outils/verification/verifier-syntaxe-fiches.js`.
