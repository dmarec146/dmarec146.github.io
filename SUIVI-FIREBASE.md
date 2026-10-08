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
  - `assets/js/devoir-partiel.js` (script classique, 04/10/2026) : devoir
    sur une PARTIE d'une fiche — masque les calculs non retenus, compte les
    questions retenues. `window.DevoirPartiel` sert aussi de **marqueur
    « fiche câblée »** : le formulaire d'attribution n'offre le choix des
    calculs que si la fiche, chargée dans une iframe, l'expose. **Les 50
    fiches sont câblées** (04/10/2026, par `outils/devoir-partiel/cabler-fiche.js`).
    Reconnaît « Calcul 9.4 » comme « Entraînement 25.3 » (tout mot avant le
    numéro). Une **nouvelle fiche** doit être câblée (relancer le script sur
    elle : il refuse tout motif qui ne se trouve pas exactement une fois).
  - `assets/js/widgets-saisie.js` (script classique, 04/10/2026) : aides de
    saisie des 14 fiches de Seconde à widgets (cahier 2 fiche 8, cahier 3
    fiches 9-10, cahier 5 fiches 14-17, cahier 6 fiches 18-19, cahier 7
    fiche 20, cahier 8 fiches 21-23 et 25) — message « Réponse enregistrée »
    après « Valider ce tableau » (surtout utile en devoir, où rien d'autre ne
    s'affiche), passage à la question suivante, envoi du focus sur un widget
    depuis le champ précédent (enveloppe `allerChampSuivant`, qui plantait
    sur `input-N` absent), pavé numérique sur les champs du widget. Aucune
    autre retouche des fiches que la balise `<script>`. Une nouvelle fiche à
    widget doit l'inclure.
  - `assets/js/bareme.js` (script classique, 05/10/2026) : **barème en points**
    des fiches de calcul, pilotes Première 2 et 9 (les 48 autres n'ont pas de
    `Bareme.definir`, donc inchangées). **Uniquement dans un devoir** : affiche la note de chaque question et
    « Total : N points (+ M points de calculs avancés) » en tête (rien d'autre pour
    l'élève), et rien en entraînement libre ; `Bareme.calculer`
    donne la note pondérée, les calculs avancés étant un **bonus** (bonne réponse :
    ajoutée au score et au total ; fausse ou absente : hors barème). Données,
    catégories A à E et justifications (pour l'enseignant seulement) dans
    `outils/bareme/`, voir son README ; `appliquer-bareme.js NN` régénère
    `Bareme.definir` dans la fiche. `suivi.js` (`validerFiche`) enregistre alors
    `score` et `totalExercices` en points plus `nbQuestions` (colonne
    Non-réponses du tableau de bord) ; `mes-devoirs.js` et `devoirs.js`
    affichent les quarts de point (9,25 / 24,5). **Aucun contrôle automatique** : une
    fiche à barème modifiée (question ajoutée, supprimée, renumérotée) se désynchronise sans signal ;
    outils de contrôle disponibles **à la demande de David** : `outils/bareme/controle-bareme.js` +
    `controle.html` (voir `outils/bareme/README.md`).
  - `assets/js/qcm-clic.js` (script classique, 07/10/2026) : QCM, oui/non et vrai/faux **cliquables** (le champ texte
    est masqué mais reste la source de vérité, un clic y écrit la lettre ou « vrai » / « faux » puis simule Entrée ;
    plusieurs bonnes réponses : bouton « Valider »). Branché dans 47 fiches par `outils/qcm-clic/cabler-fiches.js`
    (balise après `claviers.js`) ; **EXCLUES tant que leur devoir court : Première 1 et 2 (jusqu'au 10/10/2026 au
    soir) et Seconde 5** — à retirer de la liste `EXCLUES` de l'outil puis `--toutes` après les échéances ; audit :
    `outils/qcm-clic/audit.html` (`A.lancer()`, 15 fiches à choix, 75 cartes, 75/75 bonnes réponses par clic le 07/10/2026).
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
  - MathLive **épinglé à 0.111.0** (`unpkg.com/mathlive@0.111.0`, 05/10/2026 ; avant : sans
    numéro, donc toujours la dernière version) et MathJax. Pour changer de version : modifier
    le numéro dans les 50 fiches, relancer `outils/audit-claviers/`, puis publier.
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
  écritures échouent en silence). Dernière publication : 04/10/2026
  (`devoirsMasques`, devoirs faits retirés de la liste de l'élève ; avant :
  `statistiques`, 03/10/2026) — testées au préalable dans l'émulateur
  (`outils/verification/regles-firestore/`, 45 cas), test à relancer avant
  toute nouvelle publication.
- Collections utiles : `statistiques/{AAAA-MM-JJ}_{0-4}` (fréquentation
  anonyme : compteurs du jour, +1 seulement pour tout visiteur, lecture
  admin ; enseignant et navigateurs où il s'est connecté exclus) ;
  `devoirs/{id}` (lecture élève connecté, écriture admin) ; sous `eleves/{uid}` : `brouillons/{ficheId}`,
  `brouillonsAutomatismes/{devoirId}`, `devoirsTentatives` (journal des
  tentatives de devoir), `connexions` (journal d'audit).
  `devoirsMasques/{devoirId}` (04/10/2026 : devoir fait que l'élève a retiré de
  sa liste `/mes-devoirs/` ; marqueur `{masqueLe}`, **règle à publier** avant
  l'envoi du code — sans elle, la lecture échoue sans casser la page et le
  bouton « Supprimer » affiche « Suppression impossible »).
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
  **Supprimer un devoir (ou « Tout supprimer ») efface aussi toutes ses
  tentatives** chez tous les élèves (04/10/2026) ; le message de confirmation
  donne le nombre de tentatives. Brouillons et marqueurs « retiré de ma liste »
  ne sont pas supprimables par l'enseignant (règles) : l'élève les nettoie lui-même
  au chargement de `/mes-devoirs/`.
- Classes : `2nde-207`, `1ere-Gr 1`, `1ere-Gr 3` (groupes de spécialité,
  format `1ere-Gr N`), compte de test `demo-eleve` (classe
  `1ere-demo`). **La liste « Classe » du formulaire d'attribution
  est construite à partir des classes présentes chez les élèves** : une classe
  de test disparaît de la liste quand son dernier compte est supprimé. Élève **hors classe** (sans champ `classe`) : sentinelle
  `"hors-classe"` côté client uniquement, ciblage individuel possible par
  le champ `eleves` (tableau d'uid) du devoir.
- **Côté élève** : bloc « Devoirs » + pastille sur les 4 pages d'entrée ;
  `/mes-devoirs/` en trois colonnes : **Enregistrés** (ouvert + brouillon),
  **À faire** (ouvert, sans brouillon, avec la meilleure note si déjà
  rendu), **Faits** (essais épuisés ou échéance passée). Les brouillons
  orphelins sont supprimés.
  Depuis le 04/10/2026, chaque devoir **fait** a un bouton « Supprimer »
  (confirmation, puis « Tout supprimer » en tête de colonne) : il retire le
  devoir de la liste de l'élève (`devoirsMasques`), sans toucher au devoir ni
  aux tentatives — l'enseignant garde les résultats.
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
- **Devoir sur une partie de fiche** (04/10/2026) : champ facultatif
  `calculs` (numéros, ex. `["9.4","9.6"]`) et `calculsTitres` (tableau
  plat de chaînes ≤ 100 caractères : Firestore refuse les tableaux
  imbriqués). Le formulaire lit la liste des calculs dans la fiche
  elle-même (titres construits en JavaScript compris), avec « tout cocher »
  par section ; rien de coché = fiche entière. Les calculs non retenus sont
  **masqués** pour l'élève (classe `devoir-partiel-masque`, réappliquée
  par un `MutationObserver` après chaque reconstruction de grille) ; la
  note est « bonnes réponses / questions retenues » ; le bandeau le dit.
  Sélection **verrouillée dès qu'une tentative existe** (formulaire en
  modification). Une fiche s'ouvre sur un devoir précis par
  `?devoir=<id>` (lien de `/mes-devoirs/`) : indispensable quand une
  fiche porte plusieurs devoirs ; sans paramètre, le plus proche de son
  échéance. Brouillon d'un devoir partiel : clé
  `<ficheId encodé>~<devoirId>` + champ `devoirId` (un par devoir) ; devoir
  entier : clé historique. Essais épuisés : `retirer()`, toute la fiche
  redevient visible (entraînement libre). Aucune modification de
  `firestore.rules`.
- **Échéance / essais individuels** (04/10/2026) : en modification d'un devoir,
  case « Modifier l'échéance et le nombre d'essais pour certains élèves
  seulement » (décochée par défaut) → liste des élèves de la classe ; le
  devoir reste UN seul devoir et porte `derogations: { <uid>: { echeance,
  nbEssaisMax } }`. `assets/js/derogations.js` (`appliquerDerogation`,
  `echeanceMaxMillis`) est le point unique : appliqué dans `suivi.js`
  (fiches : `devoirsPour` ; automatismes : `devoirAutomatismeActif`, état par
  id, enregistrement de la tentative), `devoirs-eleve.js` (`/mes-devoirs/`) et
  la vue Résultats (meilleure tentative avant l'échéance DE L'ÉLÈVE, essais
  « x / ses essais », mention « échéance individuelle »). La liste « en cours /
  faits » classe un devoir par son échéance la plus lointaine (dérogations
  comprises) : un devoir échu pour la classe mais pas pour un élève reste « en
  cours » (attention à « Tout supprimer » des devoirs faits). « Rétablir les
  réglages du devoir » retire la dérogation des élèves cochés. Les élèves
  peuvent lire la table des dérogations (identifiants opaques) : sans enjeu.
  Aucune modification de `firestore.rules`. Ne concerne que l'échéance et le
  nombre d'essais (pas la fiche, les calculs, le niveau).

## 5. Comptes

- Compte enseignant (adresse réelle, `admin`).
- Élèves réels : `2nde-207` (21), `1ere-Gr 1` (27), `1ere-Gr 3` (26),
  `e.marec` (hors classe, compte réel).
- Comptes de test : `demo-eleve` (classe `1ere-demo`, utilisé par David
  pour ses essais — vidé de ses devoirs et tentatives le 30/09/2026, seul
  son journal `connexions` est conservé), identifiants dans
  `outils/creer-comptes/comptes-crees-*.csv` (non suivis par Git).
- **Tests avec connexion** : Claude ne saisit jamais de mot de passe sur un
  service d'authentification ; David se connecte lui-même dans le
  navigateur intégré, ou un compte jetable est créé puis supprimé.

## 6. Pistes ouvertes / à faire

Backlog de David pour après le travail sur les fiches : l'artefact
**« Chantiers futurs »** (https://claude.ai/artifact/D4BQtmML6BK5AtuAHRpbad :
plages de l'aléatoire, banque d'automatismes, devoirs partiels, barème
personnalisé, correction détaillée), qui remplace `CHANTIERS-FUTURS.md`
depuis le 02/10/2026 — **ne le modifier qu'à sa demande**.

- Diversifier les automatismes des fiches de Première 7 à 26 au fil des
  relectures de David (règle et modèles dans `REGLES-FICHES.md`, §2).
- Fiche 14 de Première (probabilités, ex-fiche 17 puis 19) : erreur console
  intermittente au chargement (`<svg> attribute width: "NaNex"`, SVG MathJax
  à dimensions NaN), apparue avec le trait de l'événement contraire dessiné
  dans l'arbre (`texteEvenementSVG`) ; aucun effet visible constaté, cause
  non trouvée. **Mis de côté par David (01/09/2026) : n'y revenir que sur
  sa demande.**
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
- **Claviers et champs à séparateur (05/10/2026, audit complet, voir
  `outils/audit-claviers/`)** : MathLive 0.111 **ignore les attributs**
  `smart-fence="off"` (comme `virtual-keyboard-mode`) : la propriété `smartFence`
  reste vraie. Conséquences au clavier physique : « [ » ajoutait une paire « [ ] »
  (]-2;5[ lu ]-2;5[], un « ] » en trop) et « { » une paire « { } » (accolade en
  trop après une fraction). `claviers.js` (section 4) force `smartFence = false`
  sur les champs à séparateur (touche « ; » sur leur clavier maison, ou placeholder
  contenant « ; » : couples, ensembles, intervalles). Autres défauts corrigés dans
  cette section : (1) après une fraction ou sous une racine, « [ », « ] » et « ; »
  entraient dans le dénominateur ou la racine → sortie du modèle
  (`moveAfterParent`) avant ces caractères, « } » et « ) » seulement si aucune
  accolade / parenthèse n'est ouverte dans la branche (`moveToGroupStart` +
  `getValue(début, curseur)`) ; valable au clavier physique (`keydown`,
  `beforeinput`) et à l'écran (`insererMath` **et** `inserer` enveloppées ;
  la variante `inserer` remet `boiteRacineOuverte[idx]` à faux) ; (2) « / » tapé
  juste après un « ] » d'ouverture (]3/2;5[) prenait le « ] » dans le numérateur →
  numérateur construit à la main. **L'ascii-math perd les crochets isolés** quand
  on réécrit une saisie : les brouillons mémorisent aussi le LaTeX du champ
  (`saisies[idx].latex`) et le restaurent par `setValue(latex, {format:'latex'})`
  (ancien brouillon sans `latex` : comportement d'avant). Tester la frappe
  physique avec l'action `key` de l'outil `computer` (vrais `keydown`), pas
  `type` (insertion de texte seulement). **MathLive est épinglé à 0.111.0** : relancer
  le banc avant de changer de version. Hors champs à séparateur, les champs
  algébriques gardent la fermeture automatique des parenthèses (comportement
  d'origine, aucun retour). **Touche → (05/10/2026)** : `claviers.js` l'ajoute après « ← Suppr. »
  sur tout clavier à écran muni de a/b, √ (ou ÷ en champ mathématique) : champ mathématique =
  flèche droite de MathLive (`moveToNextChar`, qui remet `boiteRacineOuverte[idx]` à faux) ; champ
  texte = case ▢ du dénominateur (« )/(▢ »), sinon sortie d'un niveau de parenthèse ;
  une pression = un niveau, dans les deux types de champ. **Réponse longue (05/10/2026)** :
  `claviers.js` (section 5) mesure chaque `math-field.q-mathfield` **au repos** (focusout, setValue,
  chargement, redimensionnement, polices chargées ; réessais pendant 3 s) : s'il déborde, il passe
  sur sa propre ligne (`q-mathfield-long`, `flex: 1 1 calc(100% - 64px)`), puis réduit sa police
  jusqu'à 12 px (téléphone) ; rien n'est modifié pendant la frappe. Limite MathLive : `setValue('')`
  n'émet pas d'événement `input`, un champ vidé par programme garde sa mise en page jusqu'à la
  sortie du champ. **Téléphone (05/10/2026)** : `claviers.js` (section 6, écrans ≤ 560 px) évite que la page
  défile horizontalement : tableaux `table-…` (police 13 px, cases compactes, défilement dans leur cadre),
  tableaux dans un énoncé (idem), formule MathJax (svg extérieur) réduite à la largeur de son bloc,
  `mjx-assistive-mml` (texte d'accessibilité caché) limité en largeur. **Ne jamais mettre `overflow` sur
  `mjx-container` ni `.q-enonce`** : rognage de 14 px des formules en bloc (sommes).
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
- Devoir partiel : la sélection est faite **par numéro de calcul**
  (`"9.4"`), pas par position. Renuméroter une fiche pendant un devoir
  partiel déplace silencieusement la sélection (si plus aucun numéro ne
  correspond, la fiche reste entière et la console avertit). Les titres
  retenus sont gardés dans `calculsTitres` pour permettre un contrôle,
  non implémenté. Un devoir qui change de type en modification doit
  nettoyer ses champs avec `deleteField()` (`calculs`, `calculsTitres`,
  `ficheId`…).
- Fiche câblée = `<script src=".../devoir-partiel.js">` après
  `claviers.js` + une dizaine de retouches (bandeau, validation et total,
  « tout saisi », champ suivant, vérifier tout, toutes les réponses,
  `verifierEtatDevoir(FICHE_ID, ?devoir)`, `appliquer`, `retirer`) : voir
  `outils/devoir-partiel/cabler-fiche.js`.
  Une fiche non câblée ignore `?devoir` et le champ `calculs` : si un
  devoir partiel y était attribué par un autre moyen, l'élève verrait la
  fiche entière notée sur toutes les questions.

**Session cloud (conteneur Linux)**
- Le proxy du conteneur bloque `unpkg.com` et `cdnjs.cloudflare.com` : une fiche s'ouvre
  sans MathLive, MathJax ni math.js (le correcteur numérique répond « faux » à tout).
  Pour tester dans le navigateur : `npm pack mathlive@0.111.0 mathjax@3.2.2 mathjs@12.4.0`
  (le registre npm passe), extraire dans un dossier neuf, puis, avec Playwright
  (`/opt/node22/lib/node_modules/playwright`, `executablePath: '/opt/pw-browsers/chromium'`),
  rediriger ces trois URL vers les fichiers locaux (`page.route`) ; `mathjax` : `es5/tex-mml-chtml.js`
  (sans `.min`) ; `mathjs` : `lib/browser/math.js`. Serveur : `python3 -m http.server 8791`.
  Lancer les scripts de test depuis un dossier hors dépôt (une capture écrite en chemin relatif
  atterrit à la racine du dépôt).

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
