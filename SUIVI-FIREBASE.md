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
  (fiches 1 à 24 : l'ancienne fiche 25 « Équations de droites » du cahier 8 a été
  renumérotée 24 le 15/10/2026, faute de fiche 24 ; `assets/js/manifeste-fiches.js` est à jour).
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
    fiche 20, cahier 8 fiches 21-24) — message « Réponse enregistrée »
    après « Valider ce tableau » (surtout utile en devoir, où rien d'autre ne
    s'affiche), passage à la question suivante, envoi du focus sur un widget
    depuis le champ précédent (enveloppe `allerChampSuivant`, qui plantait
    sur `input-N` absent), pavé numérique sur les champs du widget. Aucune
    autre retouche des fiches que la balise `<script>`. Une nouvelle fiche à
    widget doit l'inclure.
  - `assets/js/bareme.js` (script classique, 05/10/2026) : **barème en points**
    des fiches de calcul, fiches à barème : Première 1 à 24 et Seconde 1, 3 à 24 (Seconde 2 et Première 25-26 n'ont pas de
    `Bareme.definir`, donc inchangées ; marche à suivre dans `outils/bareme/README.md`). **Uniquement dans un devoir** : affiche la note de chaque question et
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
    plusieurs bonnes réponses : bouton « Valider »). Branché dans **les 50 fiches** par `outils/qcm-clic/cabler-fiches.js`
    (balise après `claviers.js` ; Première 1 et 2 et Seconde 5, exclues pendant leurs devoirs, câblées le 12/10/2026 ;
    liste `EXCLUES` de l'outil vide, à remplir si une fiche doit attendre la fin d'un devoir) ; audit :
    `outils/qcm-clic/audit.html` (`A.lancer()` : une « carte à choix » est toute question de type QCM ou vrai/faux ;
    liste les non cliquables, les choix mal centrés, les lignes qui défilent ; 12/10/2026 : 50 fiches, 16 avec des choix,
    73 cartes, 73 cliquables, 73/73 bonnes réponses par clic, 0 décentré, 0 qui défile).
    **QCM sur figure (12/10/2026)** : les choix affichés dans le bloc voisin (`.qcm-bloc`, Première 1.7) sont déplacés dans la
    carte de réponse ; sans choix affichés (« 1, 2 ou 3 » en 1.8, « f1, f2 ou f3 » en 4.4/4.5), des boutons sont créés à partir
    du texte grisé du champ (« Figure n », (f_n) en MathJax). **Centrage** : les choix sont toujours centrés sur leur propre
    ligne ; une ligne qui défilait avec une flèche (`q-qcm-options--scroll`, 12 fiches de Première) passe à la ligne, centrée.
    Après construction des cartes, `rafraichirAides()` recalcule les bulles d'aide « ? » de groupe (« Cliquer sur la bonne
    réponse »), construites avant les cartes.
  - `assets/js/moteur-reponses.js` (script classique, sans dépendance, 12/10/2026) : **validation des réponses par
    forme**. La réponse est lue (LaTeX du champ mathématique, sinon texte) dans un arbre propre au moteur — convention
    `1/4(x+2)^2` = (1/4)(x+2)², contrairement à math.js qui lit 1/(4(x+2)²) — puis on contrôle la valeur ET la forme
    (`puissance` : une puissance par base, bases de la réponse attendue, pas de nombre calculé ; `monome` ; `developpe`
    : somme de termes cx^k, un par puissance, fractions irréductibles, sans parenthèse ; `canonique` : a(x−α)²+β, x une
    seule fois). Une question déclare `forme` (+ `formeOptions`) ; la fiche appelle `MoteurReponses.verifier(ex, champ,
    val)` dans `verifierUne()` et `MoteurReponses.aide(ex)` dans `aideContextuellePour()` (+ `necessiteAide`). **Câblé dans
    Première 1 (1.1, 1.4 développée ; 1.5, 1.6 canonique) et Seconde 2 (2.2 à 2.4 puissances, 2.4 c d et 2.5 b c monômes)** ;
    les autres fiches gardent leur validation numérique (à câbler fiche par fiche). Tests Node :
    `outils/verification/test-moteur-reponses.js` (~160 cas).
    **13/10/2026 : formes générales `simplifie`, `factorise`, `decimal`** (option `euler`), pilotées par une table par
    fiche `outils/moteur-reponses/formes-par-fiche.json` + câblage automatique `outils/moteur-reponses/cabler-fiches.js`
    (balise, bloc `formesCalcul()/parametresForme()/exAvecForme()`, aiguillage en tête de `verifierUne`, crochets d'aide ;
    si le moteur ne sait pas lire la réponse attendue, la fiche se rabat sur la valeur — l'audit le signale :
    `reference-illisible`). Câblées (lots 0 et 1, 13/10/2026 ; Seconde 21 à 24 recâblées au fil de leur reprise, 15-16/10/2026) : Seconde 1, 3 à 8, 10 à 24 (sauf 9) et Première 2 à 26 (calculs choisis ; Première 14 le 19/10/2026 : 14.4 en `decimal`, les calculs à fraction irréductible gardent leurs contrôles propres) (Seconde 9 : corrigés
    corrigés, fractions irréductibles). Affichage du corrigé : `adoucirAffichage()` dans chaque fiche (voir REGLES-FICHES.md §4). Depuis le 15/10/2026, `simplifie` refuse aussi un terme ou un facteur égal à 0 (`x+0`, `0*x`). Plus aucune fiche à câbler.
  - `outils/audit-reponses/` (13/10/2026) : **audit permanent de la validation des réponses**, script Node qui pilote le
    Chrome installé (playwright-core, `npm install` une fois par machine). `node outils/audit-reponses/audit.js` (fiches
    modifiées) ou `--toutes`. Corrigé retapé dans les vrais champs, énoncé recopié / nombre calculé refusés, corrigés
    décimaux ou réductibles repérés. `connues.json` = anomalies existantes à la création (liste de travail) ; seules les
    nouvelles font échouer le script. Voir son `README.md`. **Étendu le 14/10/2026** aux intervalles saisis, à la
    discussion selon un paramètre, aux tableaux de signes, aux pourcentages (dont écarts en points), aux tableaux
    d'effectifs à compléter et aux schémas d'évolution (corrigé accepté, variantes fausses refusées) ; ne couvre toujours ni QCM, ni vrai/faux à cliquer, ni vecteurs nommés ni
    combinaisons de vecteurs (liste dans le README) ; oui/non, encadrements, inégalités,
    ensembles en extension, lectures approchées, comparaisons, tableaux de programme et de variations, couples et points ajoutés les 15 et 16/10/2026. **Audit complet du 16/10/2026** : 48 fiches sur 50 sans anomalie ; deux anomalies de style connues dans `connues.json` (Première 14.2 et 15.14 c).
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
    mesure de fréquentation anonyme, écritures groupées depuis le 28/10/2026 : 1re page d'une visite tout de suite,
    les suivantes par paquet de 8 pages ou 10 minutes (voir §3 et §6). Pied de page : « Visites comptées anonymement, sans cookie. » (simplifié le 25/10/2026).
  - `assets/js/pied-droits.js` (script classique, 81 pages publiques, hors `outils/`) :
    icône sigma (`assets/img/`) à gauche du titre « Cahiers interactifs », favicon
    et ligne « © 2026 David Marec · Tous droits réservés » en pied de page (nom changé le 26/10/2026, auparavant dmarec146) (ajoutée au
    `.site-pied` existant, sinon dans un pied créé). **Toute nouvelle page publique
    doit contenir la balise avant `</body>`** ; l'auteur et l'année sont deux
    constantes en tête du script. Fichier `LICENSE` à la racine (tous droits réservés). Export PDF : mention répétée en bas de chaque page (boîte de marge `@page`, `export-cahier.js`).
  - MathLive **épinglé à 0.111.0** (`unpkg.com/mathlive@0.111.0`, 05/10/2026 ; avant : sans
    numéro, donc toujours la dernière version) et MathJax. Pour changer de version : modifier
    le numéro dans les 50 fiches, relancer `outils/audit-claviers/`, puis publier.
- **Automatismes de Première** (séries de **12 questions** depuis le 16/10/2026, 10 avant ; fiche à deux thèmes = 6 + 6) : `automatismes/premiere/sujet-blanc.html`
  et `fiche.html` (fiche ciblée par thèmes), moteur partagé
  `automatismes/assets/moteur.js`, banques dans `automatismes/premiere/banques/` (de 6 à 13 familles par niveau depuis le
  16/10/2026) ; outil de contrôle des banques (rédaction + justesse recalculée) : `outils/automatismes-controle/`, mode d'emploi
  dans `REGLES-FICHES.md` §7.
- **Guide de l'élève** (PDF de 13 pages, mode d'emploi des fiches, des
  automatismes, des QCM de Terminale et des devoirs) : `assets/docs/guide-eleve.pdf` ; source HTML,
  captures et scripts de génération dans `outils/guide-eleve/` (voir son
  `README.md`). Lié depuis l'accueil (carte « Guide de l'élève », dernière
  section, ouverture dans un nouvel onglet).

- **Conventions d'interface** (fixées avec David le 04/09/2026) : barre de navigation identique sur toutes les pages, la couleur
  appartient à la section (pas à la page courante) — « Cahiers de calcul » en pastille rouge `#E8695E` (`.nav-vedette`),
  « QCM Terminale » (ex-« QCM Bac ») en anthracite clair `#5A6068` / texte blanc (`.nav-vedette-anthracite`, ajouté le 18/10/2026 en ambre ; renommé et recoloré le 25/10/2026 à la demande de David : **même libellé sur tous les appareils**, sous-titres longs conservés sur ordinateur et tablette ; seul le texte visible a changé : adresse `/qcm-bac/`, `cible:'qcm-bac'`, `s_qcm_bac` et dossier restent) ; « Automatismes » en vert pastel `#B4DFC5` / texte `#17492E` (`.nav-vedette-vert`, fond de bandeau `#D8EEDF`, ne pas inventer
  un autre vert) ; l'accueil ne met en vedette que deux cahiers (le reste via « Voir tous les cahiers ») ; largeur de page des
  fiches `max-width: 980px`. Pour prévisualiser accueil et pages de cahier, passer par le serveur local (`file://` ne charge pas
  `assets/css/style.css`) ; les fiches, au CSS en ligne, s'ouvrent en `file://`.
- **Téléphone en portrait (refonte du 25/10/2026, validée par David)** : uniquement écran de **560 px au plus ET orientation portrait**
  (ordinateur, tablette et téléphone en paysage inchangés : tout est sous `@media (max-width: 560px) and (orientation: portrait)`).
  Aucune page modifiée une à une pour la mise en page : **(1) pages à en-tête standard** (27 pages, `.site-nav`) : bloc « TELEPHONE EN PORTRAIT »
  en fin de `assets/css/style.css` — en-tête de 56 px (logo + icône de profil de 44 px) ; **barre d'onglets fixée en bas** construite avec les quatre
  liens existants de `.site-nav` (`display: contents` sur la nav, liens en `position: fixed`, icônes en SVG dans le CSS) ; l'onglet de la section en
  cours reçoit `aria-current` (posé par `pied-droits.js`, d'après le dossier de l'adresse) ; la barre disparaît pendant la saisie dans un champ
  (`body:has(input:focus…)`) ; carte « Mes devoirs » indigo pleine largeur ; **accueil** : trois grosses cartes (bloc `.accueil-tel` de `index.html`, classe
  `tel-seulement` ; la section « Automatismes et QCM Terminale » est masquée, ses sous-titres longs restent sur ordinateur/tablette) et « en vedette » en défilement
  horizontal ; **Tous les cahiers** : sélecteur Seconde / Première / Terminale (script en ligne de `cahiers/index.html`, dernier choix gardé en `localStorage`),
  lignes compactes numérotées par un compteur CSS (le numéro affiché = la position du cahier dans la liste : **à garder vrai** si on insère un cahier) ; sommaires de cahier :
  flèches ‹ › + PDF sur une ligne. **(2) Pages de travail** (50 fiches de calcul, fiche et sujet blanc d'automatismes, fiche et sujet blanc QCM Terminale, sans en-tête
  standard) : `assets/js/haut-fiche-telephone.js` (balise **juste après la balise viewport, dans le `<head>`** de ces 54 pages ; **toute nouvelle fiche doit la
  contenir**) — fil d'Ariane masqué, barre de navigation sur une ligne de cibles de 44 px (fiches de calcul : Sommaire, ‹, ›, PDF, profil), bandeau de calculatrice, consigne
  et panneaux de mode compacts (boutons en deux colonnes), bandeau « Devoir » remonté sous la barre, et en **devoir** « Enregistrer / Valider ma fiche » fixés dans une
  barre en bas (toujours visibles ; le clavier MathLive passe devant). Chaque sélecteur y est précédé de `body` car le script passe avant le `<style>` de la page.
  `maximum-scale=1` retiré des 27 pages à en-tête standard (zoom autorisé ; leurs champs ont 16 px, pas de zoom automatique sous iOS) et **conservé** sur les 54 pages
  de travail (champs MathLive). **Piège** : sous Git Bash, `sed -i` convertit les fins de ligne CRLF des pages en LF — passer par un script Node qui les préserve.
  Vérification : 50 fiches × 360/414 px sans débordement, barre sur une ligne, cibles ≥ 44 px, première question visible dans les 700 px du haut.
- **Réglages d'entrée des Automatismes et du QCM Terminale (25/10/2026, partout : téléphone, tablette, ordinateur)** : le mode (fiche / chrono), le niveau (1, 2, 3)
  et, en chrono, le temps par question se règlent **une fois sur la page d'entrée** (`automatismes/premiere/index.html`, `qcm-bac/index.html`) dans le bloc « Mes réglages »
  (`automatismes/assets/reglages-entree.js`, configuré par `window.REGLAGES_ENTREE = { cle, niveaux }` ; **les textes de niveau de la page d'entrée sont à tenir d'accord avec
  `textesNiveau` de `qcm-bac/fiche.html` et avec le texte par défaut de `moteur.js`**). Toucher une ligne (fiche, sujet blanc, thème précis) lance la série : les réglages sont ajoutés à
  l'adresse (`?mode=chrono&niveau=3&duree=90`) et lus par `moteur.js` (`demarrer`), **jamais pendant un devoir** (`verrouille` prioritaire). Valeurs par défaut fiche / niveau 2 ;
  dernier choix mémorisé en `localStorage` (`reglages-entree-auto` / `reglages-entree-qcm`). Sur la page de travail, les deux panneaux sont remplacés par une ligne
  « Mode fiche · ★★ Niveau 2 — Changer » (`recapReglagesHTML`, `ETAT.reglagesOuverts`) ; « Changer » rouvre les panneaux d'avant, absent pendant un chrono en cours.
  En devoir : panneau « niveau et mode imposés » **inchangé**. Un accès direct à `fiche.html` sans paramètre donne fiche / niveau 2.
- **Numéros des fiches sur « Tous les cahiers » (28/10/2026)** : calculés **dans la page** d'après `assets/js/manifeste-fiches.js` (module importé par `cahiers/index.html` : « 3 fiches · n° 4 à 6 »,
  et le sous-titre « 26 fiches réparties en 10 cahiers » de chaque niveau). Le texte écrit dans le HTML n'est qu'un **repli** (JavaScript absent, ouverture en `file://`).
  **Une seule liste à tenir à jour : le manifeste** (déjà nécessaire à l'attribution des devoirs) ; `node outils/verification/verifier-manifeste.js` contrôle qu'il concorde avec les dossiers
  `cahiers/<niveau>/cahier-N/` et avec le repli (`--corriger` réécrit le repli). Les 18 pages de sommaire de cahier restent, elles, écrites à la main.
- **Export PDF d'une fiche** : bouton qui appelle `window.print()` (+ `@media print`). **Ne pas retenter** html2pdf / html2canvas /
  jsPDF : le navigateur se bloque sur les champs `<math-field>` (essai du 04/09/2026). L'export d'un **cahier entier** en un seul
  PDF (`assets/js/export-cahier.js`) est en pause depuis le 11/09/2026, quatre architectures tentées (voir `HISTORIQUE.md`).

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
  anonyme : compteurs du jour, ajouts seulement (1 page ou paquet de 12 au plus) pour tout visiteur, lecture
  admin ; enseignant et navigateurs où il s'est connecté exclus) ;
  `devoirs/{id}` (lecture élève connecté, écriture admin) ; sous `eleves/{uid}` : `brouillons/{ficheId}`,
  `brouillonsAutomatismes/{devoirId}`, `devoirsTentatives` (journal des
  tentatives de devoir), `connexions` (journal d'audit).
  `devoirsMasques/{devoirId}` (04/10/2026 : devoir fait que l'élève a retiré de
  sa liste `/mes-devoirs/` ; marqueur `{masqueLe}`, **règle à publier** avant
  l'envoi du code — sans elle, la lecture échoue sans casser la page et le
  bouton « Supprimer » affiche « Suppression impossible »).
  **Anciennes sous-collections supprimées le 26/10/2026** : `resultats`, `automatismes`, `tentatives` (229 documents, sauvegardés avant dans
  `Documents\sauvegardes-site\2026-10-26-avant-purge\`). La fonction `enregistrerTentative()` de `suivi.js`, qui écrivait dans `tentatives` hors devoir depuis 14 fiches de
  Seconde à tableaux, est **supprimée** (ses 35 appels sont protégés par `if (window.enregistrerTentative)` : sans effet). Les règles Firestore autorisent
  encore la création dans ces trois chemins : à retirer à la prochaine publication des règles. **Export Firestore : toujours `listDocuments()`, jamais
  `collection().get()`** : ce dernier ignore les comptes dont le profil a été supprimé (21 « fantômes » avec 193 documents, surtout des journaux de connexion) et donne
  une sauvegarde incomplète.
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
  format `1ere-Gr N`, sans accent et avec un seul tiret : `estPremiere()` teste `startsWith('1ere')` et
  `formaterClasseAffichee()` prend ce qui suit le dernier `-` ; « 1ère - Gr 3 » casserait les deux), compte de test `demo-eleve` (classe
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
  sujet » explicite ; barème 0,5 point par question (sujet blanc de 12 questions : note sur 6, 10 questions et note sur 5 avant le 16/10/2026).
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
  échéance. **Devoir supprimé puis recréé (26/10/2026)** : le brouillon d'un devoir sur la fiche entière
  n'a pas d'identifiant de devoir ; un brouillon enregistré avant la création (`creeLe`) du devoir est ignoré
  (`brouillonAnterieurAuDevoir` dans `suivi.js`, même règle dans `devoirs-eleve.js`). Brouillon d'un devoir partiel : clé
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

- Compte enseignant de David (adresse réelle, `admin`) ; **sur la branche `comptes-enseignants`** (non fusionnée, voir §6) : droits `admin` + `enseignant`,
  les collègues invités n'ont que `enseignant`.
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

- **MIGRATION EN COURS vers Firebase Hosting + nom de domaine (démarrée le 26/10/2026)** — plan pas à pas, décisions et journal dans l'artefact claude.ai privé
  « Feuille de route du site » (https://claude.ai/artifact/Hq8uwxmdaWvtCbZENxcJuh), à lire avant toute action de publication. **État** : `master` publié par GitHub Pages
  (`dmarec146.github.io`) reste la production annoncée aux élèves ; le même site est publié **en parallèle** sur Firebase Hosting, **non annoncé et non indexé**
  (`noindex`) : `https://cahiers-interactifs.fr` (OVHcloud, DNS A + TXT ; `www` en CNAME vers `cahiers-interactifs.web.app`, redirigé vers le nom principal) et
  `https://cahiers-interactifs.web.app`. Blaze activé (alerte de budget à 5 €), sauvegardes faites (`Documents\sauvegardes-site\2026-10-26\`, hors dépôt). Les deux adresses
  partagent les mêmes comptes, devoirs et brouillons (même projet Firebase) ; une session ouverte sur l'une ne l'est pas sur l'autre (reconnexion à demander à l'annonce).
  **RÈGLE : chaque `git push` du site doit être suivi de la publication sur Hosting** (sinon les deux sites divergent ; Hosting ne se met pas à jour tout seul). **David ne double-clique jamais sur
  `Publier le site.bat` : c'est la session Claude qui pousse quand il le demande** ; elle doit donc lancer **elle-même, juste après chaque `git push` du site**,
  `node outils/hosting/publier-hosting.js` (le `.bat` fait la même chose pour qui l'utiliserait) (`--construire` : contrôles sans publier ; `--canal=essai` :
  adresse de test temporaire ; `--parite` : compare tous les fichiers avec GitHub Pages). Le script publie **le dernier commit de `master`** (jamais le dossier de travail), construit
  `publication/` par **liste blanche** (**ne jamais publier un dossier par liste d'exclusion** : le contenu de `.git` est parti ainsi une fois), refuse tout fichier suspect, refuse de
  publier si des commits ne sont pas poussés, régénère `firebase.json` et `.firebaserc` (ignorés par Git) et vérifie ensuite le site en ligne (empreintes, chemins sensibles en 404).
  Prérequis par PC : Node.js, `npx firebase-tools@15.34.1 login` fait par David (compte propriétaire du projet) ; sous PowerShell, `npx` est bloqué : le script appelle `npx.cmd`.
  **Constante `INDEXATION_AUTORISEE`** en tête du script : `false` tant que le site n'est pas annoncé (en-tête `noindex`) ; à passer à `true` à l'annonce (avec sitemap, robots.txt et titres, étape 2.2).
  Après la bascule (annonce aux élèves prévue vers le 05/11/2026) : nouveau dépôt privé (option B), l'ancien dépôt public ne garde qu'une page de redirection.
  Comptes enseignants pour 10 collègues : phase 3 de la feuille de route.

- **COMPTES ENSEIGNANTS (plusieurs enseignants) — branche `comptes-enseignants` (worktree `.claude/worktrees/comptes-enseignants`), commencée le 26/10/2026, **fusionnée dans `master`, poussée et publiée le 27/10/2026 (commit `5b73a87`) ; règles resserrées publiées par David dans la Console le 27/10/2026.**
  Échéance voulue par David : ≈ 02/11/2026 (il revoit élèves et collègues). **Décisions de David (26/10)** : (1) compte test d'enseignant avec une autre adresse e-mail cette semaine ; (2) son compte = `admin` + `enseignant` ;
  (3) inscription d'un enseignant **sur invitation** uniquement (pour la suite, Claude conseille une adresse académique `@ac-xxx.fr` par défaut, exception explicite : le script le refuse sans `--adresse-libre`) ;
  (4) **seul David crée les comptes élèves des collègues**, à partir de la liste (PDF/Excel) que chacun lui envoie, avec les étiquettes ; (5) pseudos **comme pour ses propres élèves** (`d.marec`, nom et prénom dans le profil) : l'idée de pseudos aléatoires sans nom + table
  de correspondance a été étudiée puis écartée comme trop lourde au quotidien (« nous verrons plus tard ») — **les mentions légales doivent donc continuer à dire que nom et prénom sont conservés** pour tous les élèves.
  **Modèle** : claims `admin` (voit tout, fréquentation) et `enseignant` ; champ `enseignant` (uid) sur `eleves/{uid}` et `devoirs/{id}` ; règles Firestore : un enseignant lit les profils/journaux/brouillons de SES élèves seulement (`estSonEnseignant`, un `get()` du profil),
  crée/modifie/supprime seulement SES devoirs (`enseignant` = son uid, immuable), jamais d'écriture sur les profils ; **lecture des devoirs réservée à l'enseignant propriétaire et aux élèves de cet enseignant (resserrée le 27/10/2026, règles testées : 154 cas ; **à publier dans la console après le code, voir HISTORIQUE**)
  **Côté pages** : `devoirs.js` filtre toutes ses requêtes par `where('enseignant', '==', uid)` (obligatoire : Firestore refuse sinon) ; `suivi.js` et `devoirs-eleve.js` filtrent les devoirs d'un élève par son `enseignant` (deux enseignants peuvent avoir une classe du même nom) ;
  sans champ `enseignant` sur le profil, aucun filtre (comptes d'avant la migration) ; `nav-auth.js`/`statistiques.js`/`connexion.js` : l'enseignant a l'icône du tableau de bord, n'est pas compté dans la fréquentation ni dans le journal des connexions ; la carte « Fréquentation » est masquée hors admin.
  **Scripts** (`outils/creer-comptes`) : `--admin <email> [mdp]` (donne `admin`+`enseignant`) ; `--enseignant <email> [--adresse-libre]` (invitation : compte à mot de passe aléatoire inconnu + **lien** pour choisir son mot de passe, à envoyer par David) ;
  `<csv> --enseignant=<email>` (élèves rattachés ; homonymes/pseudos pris par un autre enseignant → suffixe libre ; relançable) ; `migrer-enseignant.js <email> [--oui]` (rattache élèves et devoirs existants, ignore les documents « fantômes »). `fin-annee.js` ne traite jamais un compte `enseignant` comme un élève.
  **Test local** : `node outils/test-local/lancer.js` (émulateurs Auth + Firestore + site sur `http://localhost:5173/connexion/?emulateur=1`, bandeau rouge « MODE TEST », comptes fictifs `david@exemple.test` / `collegue@exemple.test`, mot de passe `test1234`) ; le branchement sur les émulateurs
  n'agit que sur `localhost`/`127.0.0.1` (`assets/js/firebase-config.js`). **Vérifié le 26/10/2026** : règles (112 cas, `outils/verification/regles-firestore`) ; dans le navigateur, un collègue ne voit que sa classe, ses devoirs, ses résultats (même nom de classe que David), un élève ne voit que les devoirs de son enseignant, une tentative d'élève apparaît chez son enseignant ;
  scripts sur l'émulateur (invitation, élèves, homonyme, relance, migration avec document fantôme).
  **ÉTAT DE LA PRODUCTION ET ORDRE DE MISE EN PRODUCTION (27/10/2026)** : **faits** — 1) sauvegarde `Documents\sauvegardes-site\2026-10-27-avant-comptes-enseignants` (967 documents, 101 comptes) ; 2) droit `enseignant` ajouté au compte `david.marec@ac-creteil.fr` (claims `admin` + `enseignant` ; il faut se déconnecter/reconnecter pour que le jeton le contienne) ; 3) `migrer-enseignant.js --oui` : **100 élèves et 11 devoirs rattachés** à ce compte (champ `enseignant` ; relance : plus rien à rattacher ; sans effet sur l'ancien code). **Faits aussi le 27/10/2026** — 4) fusion en avance rapide dans `master`, push (`121cb89..5b73a87`) et publication Hosting (138 fichiers, 7/7 témoins identiques sur `cahiers-interactifs.fr` et GitHub Pages) ; David s'était reconnecté sur les deux adresses (jeton avec `enseignant`) et avait contrôlé son tableau de bord ; 5) **règles resserrées collées et publiées par David dans la Console Firebase** (copie des anciennes règles : `Documents\sauvegardes-site\2026-10-27-avant-comptes-enseignants\firestore.rules.AVANT`), puis vérifié par David : « tout fonctionne ». **Essai réel fait le 27/10/2026** avec `davidmrc92@gmail.com` (compte de test) : invitation par courriel Firebase (`--envoyer`), mot de passe choisi, connexion et tableau de bord vide corrects ; élèves fictifs `h.mrc` et `e.mrc` (Terminale 8) créés par `comptes-et-etiquettes.js`, fichiers dans `Documents\comptes-enseignants\davidmrc92@gmail.com\`. **Invitation depuis le tableau de bord (27/10/2026)** : carte « Inviter » (admin seulement, page `tableau-de-bord/inviter.html`) → fonction serveur `inviterEnseignant` (dossier `functions/`, région europe-west9, déployée par `node outils/hosting/deployer-fonctions.js` — à relancer SEULEMENT quand `functions/` change ; `git push` et `publier-hosting.js` ne la touchent pas) : crée le compte (droit `enseignant` seul), fait envoyer le courriel Firebase de choix du mot de passe ; adresse académique exigée sauf case « exception » ; adresse de réponse et de réception des listes = david.marec@ac-creteil.fr, contact@cahiers-interactifs.fr = contact public. Reste : configurer le courriel dans la console (domaine d'envoi noreply@cahiers-interactifs.fr + DNS OVH, objet, texte), essai réel avec davidmrc92@gmail.com. Suppression d'un enseignant et de tout ce qui lui est rattaché : `outils/creer-comptes/supprimer-enseignant.js <email> [--oui]`. **Circuit retenu pour un collègue** : il écrit à David, David valide, Claude lance `creer-comptes.js --enseignant <email> --envoyer` puis, à réception de la liste d'élèves, `comptes-et-etiquettes.js <liste.csv> --enseignant=<email>` (étiquettes à l'adresse cahiers-interactifs.fr, dossier au nom de l'adresse, à envoyer puis supprimer). **Restent** — vérifier le modèle de courriel (console, Authentication, Modèles) ; faire passer un devoir de bout en bout avec ce compte de test (attribution, élève `h.mrc`, résultat) ; supprimer le compte de test et ses élèves ; 7) inviter les collègues. **Ne jamais republier d'anciennes règles avec le nouveau code** (la lecture des devoirs reste ouverte à tout compte connecté : provisoire).
  **Règles resserrées (27/10/2026, décision de David : « je ne veux pas suivre les autres classes »)** : `admin` ne sert plus qu'à la fréquentation (statistiques) ; élèves et devoirs = uniquement via `enseignant` (les siens) ; aucune écriture de profil depuis le site ; aucun écran n'affiche les élèves d'un collègue. Les scripts et la console (SDK Admin) ignorent les règles : seule porte vers les données des collègues, volontaire (à dire dans les mentions légales / au délégué). 131 cas de test réussis.
  **Reste à faire** : essai de bout en bout en réel avec le 2ᵉ compte et les 2 élèves fictifs (David fournira noms/prénoms et classe) ; vérifier le lien d'invitation en vrai (page de choix du mot de passe, domaines autorisés d'Authentication) ; adapter les pages légales (enseignants : adresse e-mail ; élèves de collègues : créés par l'éditeur) et le message au délégué ;
  restreindre la lecture des devoirs ; étiquettes par enseignant si besoin ; voir aussi l'artefact « Feuille de route du site » (phase 3).

- **Devoirs QCM Bac testés par David avec `demo-eleve` (18/10/2026)** : un devoir enregistré puis validé, « cela fonctionne » (sa
  formule ; c'était un sujet blanc de Terminale en mode fiche ; non précisé : s'il a regardé
  la note, la vue « Résultats » et « Mes devoirs »). Le reste n'est pas vérifié : si quelque chose casse, `qcm-bac/fiche.html`,
  `qcm-bac/sujet-blanc.html`, `assets/js/devoirs.js`, `assets/js/mes-devoirs.js` (cibles `qcm-bac` et `qcm-bac-sujet`).
  **Comptage de la fréquentation du bloc : vérifié en réel le 19/10/2026** (essai automatisé, voir la puce « Fréquentation QCM Bac » plus bas ; l'essai de David, lui, était exclu par construction) ; à regarder dans le tableau de bord
  Fréquentation (partie « QCM Bac ») une fois que des élèves ou lui, hors compte enseignant, auront ouvert ces pages.
- **Comptes élèves de Terminale** : classe **`Tle-Gr 2`** (groupe 2, précisé le 18/10/2026) **déjà créée** (24 élèves relevés dans Firestore le 26/10/2026) ;
  elle apparaît dans la liste d'attribution. La carte « Terminale — Bientôt » de la page
  Automatismes est volontairement conservée (décision de David).

- **Fréquentation du bloc QCM Bac : fait (18/10/2026).** `s_qcm_bac` est dans les trois fonctions de `firestore.rules` (testé dans
  l'émulateur, 53 cas), règles **publiées par David dans la Console Firebase le 18/10/2026** ; `statistiques.js` range alors les pages
  `qcm-bac/` dans la partie `qcm_bac` et `frequentation.js` l'affiche (« QCM Bac »). Les visites faites entre l'ouverture du bloc et ce
  changement sont comptées dans « Automatismes » (clés `qcm-bac`, `qcm-bac-fiche`).

- **Fréquentation QCM Bac — comptage vérifié le 19/10/2026** : un essai automatisé (navigateur piloté, exclusion `webdriver` levée, stockage vierge, une seule visite de `qcm-bac/fiche.html` en production) a fait passer `s_qcm_bac` de 0 à 1 (pv +1, visite +1, visiteur +1, page `qcm-bac-fiche` +1) : **le comptage fonctionne**. L'essai de David, lui, n'était pas compté : un QCM ouvert « en personne libre » (sans connexion élève) n'apparaît pas dans
  le tableau de bord. Contrôles faits en lecture seule (19/10/2026) : le `statistiques.js` en ligne contient la partie `qcm_bac` ; les trois pages
  `qcm-bac/` chargent le script ; les règles publiées (18/10/2026, 19 h 16 GMT) sont **identiques** à `firestore.rules` et contiennent `s_qcm_bac` ;
  le tableau de bord a sa ligne « QCM Bac » ; les compteurs du 18/10 montrent des visites de `qcm-bac*` comptées sous « Automatismes » (avant le
  changement) et aucune après. **Cause (voulue, confirmée par l'essai ci-dessus)** : la mesure **exclut tout navigateur où l'enseignant s'est
  connecté une fois** (marque `stats-exclu` dans le localStorage) ; le tableau de bord exigeant cette connexion, le navigateur de David n'est jamais
  compté, même déconnecté. Pour tester : ouvrir `qcm-bac/` dans une **fenêtre de navigation privée** (ou sur un autre appareil jamais connecté en
  enseignant), puis regarder la partie « QCM Bac » des parties du site. Les navigateurs pilotés (`navigator.webdriver`) sont aussi exclus : un test
  automatisé ne compte pas. Limite connue : « Fiches les plus ouvertes » ne liste que les fiches de calcul (pas les pages `qcm-bac*`).

Backlog de David pour après le travail sur les fiches : l'artefact
**« Chantiers futurs »** (https://claude.ai/artifact/D4BQtmML6BK5AtuAHRpbad :
plages de l'aléatoire, banque d'automatismes, devoirs partiels, barème
personnalisé, correction détaillée), qui remplace `CHANTIERS-FUTURS.md`
depuis le 02/10/2026 — **ne le modifier qu'à sa demande**.

- **Bloc « QCM Bac » (Terminale spécialité)** — neuf banques codées les 17-18/10/2026 (`qcm-bac/banques/01…09`), page d'accueil
  `qcm-bac/index.html`, fiche `qcm-bac/fiche.html` (`?theme=<id>` pour un thème seul), contrôle
  `outils/qcm-bac/controle-banques.js`. **Lié depuis le site et fusionné dans `master` le 18/10/2026** (en ligne) : pastille « QCM Terminale » anthracite clair `#5A6068` / texte blanc (même fond que la carte `.bento-carte--anthracite` ; ambre `#FBE9B7` et « QCM Bac » jusqu'au 25/10/2026 ; adresse `/qcm-bac/`, `cible:'qcm-bac'`, `s_qcm_bac` et dossier inchangés) (`.nav-vedette-anthracite`) dans la barre de
  navigation des 26 pages à en-tête standard, carte anthracite `.bento-carte--anthracite` sur l'accueil, à côté de la carte Première dans la section « Automatismes et QCM Terminale » (carte : étiquette « QCM du baccalauréat » et titre « Terminale spécialité mathématiques », sous-titres longs voulus sur ordinateur et tablette). Les devoirs QCM déjà créés gardent leur ancien titre « QCM Bac — … » (texte enregistré) tant qu'on ne les modifie pas. Les pastilles jaune pâle du barème en points ne changent pas (autre usage). **Ouvert à tous les élèves, sans
  compte** pour la pratique libre. **Devoirs QCM Bac (18/10/2026)** : type « QCM Bac » du formulaire d'attribution (`type:'automatismes'`,
  `cible:'qcm-bac'`, thèmes de `THEMES_QCM_BAC` dans `assets/js/devoirs.js`, à tenir à jour à la main) ; `qcm-bac/fiche.html` charge
  `suivi.js` et se verrouille via `devoirAutomatismeActif('qcm-bac')` ; tentative enregistrée en points sur 10 (pénalité du niveau 3
  comprise) par `enregistrerTentativeSujetBlancSiDevoir` ; **sujet blanc QCM Bac** (`qcm-bac/sujet-blanc.html`, 18/10/2026 : 12 questions, quatre thèmes tirés au sort parmi neuf, thèmes masqués sur les cartes, note sur 12) avec son propre type de devoir `cible:'qcm-bac-sujet'` (sans thèmes choisis) ; `mes-devoirs.js` renvoie vers `/qcm-bac/fiche.html`. **Un devoir enregistré puis validé avec
  `demo-eleve` (classe `1ere-demo`) : OK (David, 18/10/2026)**. Comptes de Terminale : à créer par David (format de classe
  à utiliser : `Tle-Gr 2` (groupe 2, précisé par David le 18/10/2026 ; même règle que `1ere-Gr N`).
  Fréquentation : partie `qcm_bac` (clés de page `qcm-bac`, `qcm-bac-fiche`, `qcm-bac-sujet-blanc`). Décisions, sources, état et points à valider dans
  `outils/qcm-bac/SUIVI-QCM-BAC.md` (à lire avant d'y toucher). Le moteur des automatismes a deux options facultatives
  nouvelles : `bareme.penalites` et `textesNiveau`.
- **Première 14 (Probabilités) : traitée le 19/10/2026** (devoir échu le 17/10/2026 à 21 h, relu dans Firestore : aucune dérogation, aucun devoir ouvert) : câblage du moteur de formes, `adoucirAffichage`, grands entiers, virgule décimale du corrigé, `]a;b[` grisé retiré, corrigé de 14.4 rendu décimal, audit propre (voir `HISTORIQUE.md`).
- Diversifier les automatismes des fiches de Première 7 à 26 au fil des
  relectures de David (règle et modèles dans `REGLES-FICHES.md`, §2).
- Fiche 14 de Première (probabilités, ex-fiche 17 puis 19) : erreur console
  intermittente au chargement (`<svg> attribute width: "NaNex"`, SVG MathJax
  à dimensions NaN), apparue avec le trait de l'événement contraire dessiné
  dans l'arbre (`texteEvenementSVG`) ; aucun effet visible constaté, cause
  non trouvée. **Mis de côté par David (01/09/2026) : n'y revenir que sur
  sa demande.**
- **Pages légales PUBLIÉES le 28/10/2026 (décision de David : publier sans attendre l'avis du délégué)** : branche `pages-legales` fusionnée dans `master` ; les trois points « à compléter » levés par des formulations prudentes (responsabilités : éditeur pour la plateforme, chaque enseignant invité pour l'usage pédagogique ; garanties Google : Firebase Data Processing and Security Terms, DPF UE–États-Unis ou clauses contractuelles types ; audience : conditions CNIL + bouton « Ne plus compter mes visites » sur la page confidentialité, clé locale `stats-refus` lue par `statistiques.js`) ; `mentions-legales` et `confidentialite` ajoutées à la liste blanche de `publier-hosting.js`. **Le message au délégué reste à envoyer** (mis à jour le 28/10) et les textes sont à réajuster selon sa réponse ; le texte qui suit date d'avant la publication. Historique : **Pages légales préparées (26/10/2026)** : branche locale **`pages-legales`** (non poussée, un *worktree* dans `.claude/worktrees/pages-legales`, pour ne pas toucher à `master`) :
  `mentions-legales/index.html`, `confidentialite/index.html`, `assets/css/legal.css`, liens « Mentions légales · Politique de confidentialité » ajoutés en pied de page par `assets/js/pied-droits.js`
  (donc sur les 81 pages publiques), et garde-fou dans `outils/hosting/publier-hosting.js` : **refus de publier tant qu'une page contient `class="a-completer"`**. Texte source : document Claude Docs
  « Cahiers interactifs, mentions légales et confidentialité » (https://claude.ai/artifact/2yTXVrjUuUvkJYbSWcobSf). **RAPPEL À DAVID quand on reparle de publier ces pages** : le message au délégué (dpd@ac-creteil.fr, liste ministérielle de 2019) est rédigé dans `.claude/scratch/message-au-delegue-protection-des-donnees.txt` (local au PC perso, ignoré par Git) et n'est pas encore envoyé. **À faire avant de fusionner dans `master`** : avis du délégué à la protection des
  données de l'académie ; remplacer les trois `<mark class="a-completer">` (garanties de transfert hors Union européenne, exemption de consentement de la mesure d'audience, date de mise à jour) ;
  la ligne de droits (`AUTEUR` dans `pied-droits.js`) et `LICENSE` affichent « David Marec » **sur master et en ligne depuis le 26/10/2026** ; les textes légaux de la branche doivent dire le même nom (ordre prénom nom, décidé par David le 26/10/2026). Ne fusionner qu'à la demande de David, puis pousser et publier sur Hosting.
- **Référencement préparé, NON activé (26/10/2026)** : **fusionnée dans `master`, poussée et publiée sur les deux adresses le 26/10/2026** (commit `aa46161`, fusion `d16950a`) : meta description sur 23 pages d'entrée, titres des 18 sommaires de cahier (thème, « maths », niveau), `<meta name="robots" content="noindex">` sur connexion, mes-devoirs et le tableau de bord (**toute nouvelle page privée doit en avoir un**), `robots.txt` et `sitemap.xml` (23 adresses de `cahiers-interactifs.fr`, à compléter à la main pour toute nouvelle page publique d'entrée), ajoutés à la liste blanche de `publier-hosting.js`. **Le site reste en `noindex`** (en-tête, constante `INDEXATION_AUTORISEE = false`). **Le jour de l'annonce, dans l'ordre** : fusionner `pages-legales` (après l'avis du délégué) ; passer `INDEXATION_AUTORISEE` à `true` ; poser une balise `<link rel="canonical" href="https://cahiers-interactifs.fr/...">` sur les pages publiques (**pas avant** : tant que le nouveau domaine est en `noindex`, un canonical depuis `github.io` ferait désindexer les deux) ; publier ; déclarer le site dans Google Search Console et Bing Webmaster Tools (propriété par enregistrement DNS) et leur envoyer le `sitemap.xml`. Les 50 fiches ne sont pas visées (exercices tirés au hasard, peu de texte stable).
- **Fin d'année scolaire (décision de David, 26/10/2026 : suppression des comptes d'élèves le 30 juin, à la main)** : `outils/fin-annee/fin-annee.js` — comptage (sans option d'action), `--exporter` (sauvegarde complète + `resultats-des-devoirs.csv` pour Excel), `--supprimer --oui` (refusé sans l'export du jour) ; options `--classes=`, `--toutes`, `--garder=`, `--orphelins`, `--devoirs` (mode d'emploi en tête du script). **À lancer vers le 30/06/2027** : prévenir David en juin. Le compte `admin.jetable` (administrateur jetable jamais connecté, sans donnée) a été supprimé le 26/10/2026 après sauvegarde (`2026-10-26-avant-suppression-admin-jetable`) ; l'outil ne traite jamais un compte portant le droit admin comme un élève.
- Données orphelines des 21 comptes supprimés (journaux de connexion surtout, 117 documents après la purge) : à effacer avec l'accord de David (voir le brouillon de
  confidentialité, durées de conservation).
- **Comptage des visites : écritures groupées (28/10/2026, demande de David : « limiter le nombre d'écritures » pour ~1000 élèves, quota gratuit de 20 000 écritures/jour ; 30 pages/élève/jour = 30 000 avec l'ancien système).**
  `statistiques.js` : la 1re page d'une visite (ou du jour) est écrite tout de suite avec visite, visiteur et appareil (un passage de 30 secondes est donc toujours compté) ; les pages suivantes sont additionnées dans le navigateur (clé `stats-attente`) et envoyées en un paquet à 8 pages ou 10 minutes (minuteur si la page reste ouverte, sinon à la page suivante ou à la visite suivante, à la date d'origine). Un élève qui part sans revenir perd au plus 7 pages vues : visites et visiteurs restent exacts. Mesuré sur banc d'essai : 6 écritures/élève/jour au lieu de 30, 96 % des pages vues envoyées. Bibliothèques Firebase chargées seulement quand il y a une écriture (plus ~245 Ko sur chaque page publique). Compte enseignant/admin : l'attente est effacée, rien n'est envoyé.
  **Règles Firestore modifiées (`firestore.rules`, 167 cas de test réussis) — collées par David dans la console le 28/10/2026, *avant* la publication du code (ordre à respecter : les nouvelles règles acceptent aussi l'ancien format, l'inverse ne marche pas)** (les nouvelles règles acceptent aussi l'ancien format, l'inverse ne marche pas) : pv de +1 à +12 par écriture, chaque `s_*` de +0 à +12, au plus 12 pages touchées dans `pages`, aucune baisse ni suppression de page ; `derniere` devient facultative. **Limite assumée** : les règles ne savent pas parcourir `pages`, donc la valeur ajoutée à chaque page n'est pas bornée une à une (ni rapprochée de `pv`) : un malveillant pourrait gonfler ou remettre à zéro des compteurs de page (comme il pouvait déjà gonfler les totaux) ; rien d'autre. Politique de confidentialité : phrase ajoutée sur le stockage du nombre de pages vues en attente (à republier avec le code). Banc d'essai du script : `outils/` n'en contient pas ; il a été exécuté dans le scratchpad (faux navigateur + fausse base, 30 vérifications).
- Idée non demandée : barème réglable devoir par devoir (automatismes).
- Fiche 2 de Première : pas de titre de section entre les automatismes et
  2.3 (remarque, non traitée).
- Seconde : le cahier 8 compte les fiches 21 à 24 (l'ancienne fiche 25 « Équations de droites » a été
  renumérotée 24 le 15/10/2026, faute de fiche 24 ; aucune donnée Firestore n'y était rattachée).
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
4. Publication : `gh` (GitHub CLI) authentifié sur le compte `dmarec146` fait fonctionner `git push` sans code. Sur une
   **deuxième machine**, refaire l'installation et `gh auth login` (l'étape du code à coller dans le navigateur ne peut être
   faite que par David). `Publier le site.bat` à la racine : double-clic = add / commit / push.
5. Avant de modifier une fiche : lire `REGLES-FICHES.md`. Vérificateur de
   syntaxe : `node outils/verification/verifier-syntaxe-fiches.js`.
