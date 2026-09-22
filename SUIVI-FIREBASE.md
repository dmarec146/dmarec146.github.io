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

Chaque machine (PC pro, PC perso) a désormais son **propre clone Git local,
indépendant, hors de tout dossier synchronisé par Google Drive**. La seule
synchronisation entre les deux se fait via GitHub (`git push` / `git pull`)
— jamais via Drive.

Ça n'a pas toujours été le cas : jusqu'au 18/09/2026, `siteCahierCalcul`
était littéralement le même `.git`, synchronisé au niveau fichier par Google
Drive entre les deux machines. Ce montage a été abandonné car risqué : Drive
synchronise fichier par fichier, pas de façon atomique — deux machines
actives en même temps (ou une synchro pas terminée avant de rouvrir le
dossier sur l'autre PC) pouvaient créer des copies "en conflit" à l'intérieur
même des objets/index/refs Git, ou sur les fichiers de travail, et corrompre
silencieusement le dépôt. D'où le passage à un clone local par machine,
synchronisé uniquement via GitHub.

**Emplacement du clone sur PC perso** : `C:\Users\david\Documents\siteCahierCalcul`
(créé le 18/09/2026, cloné à jour sur `master`). `outils/creer-comptes/service-account.json`
et les CSV/PDF générés n'ont PAS pu être recopiés automatiquement depuis
l'ancien dossier Drive (bloqué par une classification de sécurité de l'outil
sur les fichiers d'identifiants) — à recopier manuellement par l'utilisateur
depuis `Mon Drive\Cours\siteCahierCalcul\outils\` vers ce nouveau clone.

**Emplacement du clone sur PC pro** : `C:\Users\David\Documents\siteCahierCalcul`
(hors "Mon Drive"). Les anciens dossiers `Mon Drive\siteCahierCalcul` et
`Mon Drive\siteCahierTemp` (ce dernier ayant servi à isoler le développement
du suivi Firebase avant sa fusion) ne servent plus pour ce projet — laissés
en place mais à ne plus modifier ni utiliser comme base de travail.

Avant d'agir :

```bash
git status
git log --oneline -5
git branch -a
```

Ne rien écraser (`checkout --`, `reset --hard`, etc.) sans comprendre ce qui
est déjà là. S'il y a un commit local non poussé ou des branches inhabituelles,
demander à l'utilisateur avant de les toucher.

**Fusion `suivi-firebase` → `master` effectuée le 18/09/2026** (commit de
fusion `514b847`, sur PC pro), sans conflit, poussée sur GitHub. Un tag
`pre-fusion-suivi-firebase` a été posé sur `master` juste avant, comme point
de retour en arrière si besoin. La branche `suivi-firebase` n'a pas été
supprimée (filet de sécurité supplémentaire). GitHub Pages sert cette
version : le suivi Firebase est en production.

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
- Menu du site : icône connexion/déconnexion + icône tableau de bord (admin
  seulement) — chargée désormais sur **toutes les pages** (`assets/js/nav-auth.js`) :
  `.site-nav` sur l'accueil/sommaires/automatismes/tableau de bord (style
  `nav-icone-profil`, voir `style.css`), et `.barre-navigation` sur les 44
  fiches de calcul qui n'ont pas le header standard (CSS propre à chaque
  fiche, pas de `style.css` chargé) — l'icône y reprend la classe `.nav-btn`
  déjà définie dans le `<style>` de chaque fiche, ajoutée uniquement sur la
  barre du haut (il y en a une identique en bas, volontairement pas touchée).
  **Lien "Tableau de bord" remplacé par une icône (18/09/2026)**, sur
  demande de David qui avait repéré le même décalage visible à l'affichage
  que le bouton profil avant son propre correctif (voir plus haut) : le
  lien texte n'était inséré qu'à l'intérieur du callback `onAuthStateChanged`,
  après un second aller-retour asynchrone (`getIdTokenResult` pour lire le
  droit admin) — apparaissait donc tard, décalant toute la barre. Corrigé en
  appliquant EXACTEMENT le même principe que le bouton profil : l'icône
  (`ICONE_TABLEAU_DE_BORD`, grille à 4 cases, même gabarit que l'icône
  profil) est créée et insérée tout de suite, masquée, puis seulement rendue
  visible une fois le droit admin confirmé — plus jamais de nœud inséré
  tardivement. **Piège rencontré en l'implémentant** : masquer via
  l'attribut `hidden` ne suffisait pas, `.nav-icone-profil { display:
  inline-flex }` (et, pire, le style **inline** posé par
  `styliserCommeIconeCompacte` pour la variante `.barre-navigation`)
  l'emportent tous les deux sur `[hidden] { display:none }` — même famille
  de piège que `.tdb-onglets[hidden]` déjà noté plus bas. Résolu en pilotant
  `style.display` directement (`'none'`/`'inline-flex'`) plutôt que
  l'attribut `hidden`, qui évite toute ambiguïté de cascade.

  **Décalage encore signalé par David le 19/09/2026 sur certaines pages** :
  le correctif `display:none`/`'inline-flex'` ci-dessus évite bien
  l'insertion tardive d'un nœud, mais PAS le décalage lui-même —
  `display:none` retire l'icône du flux, donc la barre se redistribue
  quand même au moment où `getIdTokenResult` confirme le droit admin et
  bascule l'icône en `inline-flex`, un instant après le premier rendu.
  Invisible sur une barre large avec de la marge, mais visible dès que la
  barre est déjà proche de son point de repli. Corrigé en réservant
  l'espace avec **`visibility`** plutôt que `display` : `visibility:
  hidden` dès la création (l'icône occupe déjà sa place, juste invisible),
  puis seulement `visibility:visible` une fois admin confirmé — aucune
  redistribution possible puisque l'espace était déjà compté au premier
  rendu. `display:none` n'intervient plus que pour l'état NON-admin
  (déconnecté ou élève), où récupérer l'espace ne gêne personne : cette
  icône n'a jamais été visible pour ces visiteurs. Vérifié avec un compte
  admin temporaire sur les deux variantes (`.site-nav` et
  `.barre-navigation`), et l'état non-admin/déconnecté (espace bien
  récupéré, `display:none`, largeur 0).
- Suivi câblé sur **les 44 fiches de calcul** (Première + Seconde) — le
  pilote (`cahiers/premiere/cahier-1/fiche-01.html`) puis les 43 autres,
  même schéma partout (voir `assets/js/suivi.js`). Score = questions
  réussies au moins une fois, tous passages confondus, rapporté au nombre
  total de questions de la fiche.
- **Nouveau modèle de suivi pour les cahiers de calcul, en cours de
  migration fiche par fiche** — motivé par le quota gratuit Firestore
  (Spark) : l'ancien modèle (`tentatives`, une écriture par question
  vérifiée) oblige le tableau de bord à relire tout l'historique de tous
  les élèves à chaque ouverture, un volume de lectures qui grandit avec le
  temps et pouvait finir par dépasser les 50 000 lectures/jour gratuites.
  Le nouveau modèle remplace ça par deux documents mis à jour en place par
  élève et par fiche :
  - `eleves/{uid}/brouillons/{ficheId}` — état courant d'une fiche en
    pause (valeurs générées + réponses déjà saisies), écrit uniquement au
    clic sur "Enregistrer mon avancement", supprimé dès que la fiche est
    validée. Permet la vraie reprise (mêmes valeurs, pas de nouvelles
    générées au hasard).
  - `eleves/{uid}/resultats/{ficheId}` — score cumulé (tous passages
    confondus), mis à jour au clic sur "Valider ma fiche" (fiche complète
    ou non — validable à tout moment).
  Ces deux boutons ("Enregistrer"/"Valider") ne s'affichent que pour un
  élève connecté (le site reste utilisable sans compte, il ne faut rien
  laisser croire à un visiteur anonyme).

  **Pour un élève connecté uniquement**, le choix de mode ("Au fur et à
  mesure" / "Tout à la fin") est masqué et rien n'est révélé (ni couleur
  verte/rouge, ni statut, ni bilan) tant que la fiche n'a pas été validée
  au moins une fois dans la session — le calcul et l'enregistrement dans
  `saisies` se font quand même silencieusement à chaque réponse tapée. Un
  clic sur "Valider ma fiche" révèle d'un coup les couleurs et le bilan sur
  tout ce qui a été répondu (en rappelant `verifierTout()` après avoir posé
  `ficheValidee = true`), en plus d'écrire le score. "Vérifier mes réponses"
  a été renommé "Corrigé des erreurs" et reste désactivé, comme "Voir toutes
  les réponses", tant que non validé (icône "?" au survol sur le bouton
  Valider pour l'expliquer). Un visiteur anonyme garde le fonctionnement
  d'origine à l'identique (choix de mode, correction immédiate).

  Boutons de bas de fiche dans l'ordre : Recommencer, Générer une nouvelle
  version, Enregistrer mon avancement, Valider ma fiche, Corrigé des
  erreurs, Voir toutes les réponses — dans une seule barre.

  Pastille "brouillon en attente" (`assets/js/brouillons-indicateur.js`,
  chargé sur `cahiers/index.html` et les 15 sommaires de cahier) : pour un
  élève connecté avec au moins une fiche enregistrée mais non validée,
  petite icône disquette à côté du lien de la fiche dans son sommaire, et
  sur la vignette du cahier dans la liste de tous les cahiers. Correspondance
  par préfixe de chemin (pas de fiche codée en dur) — se généralise tout
  seul au fur et à mesure de la migration des autres fiches.

  **Recensement avant extension aux 44 fiches** : 33 fiches partagent la
  structure simple de la fiche pilote (un seul `exercices`, auto-suffisant).
  **11 fiches ont des sections graphique/QCM dont le rendu dépend d'un état
  auxiliaire externe** (nom de variable différent d'une fiche à l'autre —
  `paramsGraphiques`, `paramsGraphique14`... — repéré en cherchant les
  fiches qui appellent, en plus de `construireGrilles()`, d'autres fonctions
  de construction au chargement) : `cahiers/premiere/cahier-1/fiche-01.html`,
  `cahier-2/fiche-06.html`, `cahier-3/fiche-10.html`, `cahier-6/fiche-19.html`,
  `cahier-7/fiche-20.html`, `cahier-7/fiche-21.html`, `cahier-7/fiche-22.html`,
  `cahier-8/fiche-24.html`, et côté Seconde `cahier-5/fiche-14.html`,
  `fiche-15.html`, `fiche-16.html` (chapitre Fonctions — courbes). Sans
  traitement particulier, restaurer un brouillon sur ces fiches afficherait
  une courbe/des options QCM différentes de celles vues au moment de
  répondre, alors que la réponse attendue (`exercices[idx].bonneReponse`,
  bien capturée) resterait celle d'origine — incohérent.

  Résolu génériquement plutôt que fiche par fiche : `enregistrerBrouillon()`
  (`assets/js/suivi.js`) accepte un 5ᵉ paramètre optionnel `extra` (un seul
  document, une seule écriture quoi qu'il arrive — pas de coût Firestore
  supplémentaire, juste quelques centaines d'octets de plus par brouillon).
  Une fiche concernée définit deux petites fonctions,
  `etatSupplementairePourBrouillon()` (retourne ses variables externes,
  ex. `{ paramsGraphiques }`) et `restaurerEtatSupplementaire(extra)` (les
  réaffecte), appelées automatiquement par `enregistrerBrouillonActuel()` et
  `initialiserFiche()`. Une fiche simple n'a rien à faire.

  **Pilotée sur deux fiches** : `cahiers/seconde/cahier-1/fiche-01.html`
  (cas simple) et `cahiers/premiere/cahier-1/fiche-01.html` (cas complexe,
  QCM + courbes 1.10-1.13) — testées de bout en bout toutes les deux
  (enregistrement, reprise à l'identique après rechargement — y compris
  `paramsGraphiques` restauré à l'identique sur la fiche complexe,
  vérifié champ par champ —, validation, révélation couleurs/bilan à la
  validation, coexistence avec l'ancien modèle, tableau de bord).

  **Étendu ensuite à 29 fiches supplémentaires** (toutes "simples", sans
  état auxiliaire) par script mécanique avec vérification stricte de
  chaque ancre avant écriture (même principe que le suivi initial : rien
  n'est écrit tant qu'une correspondance exacte n'est pas trouvée partout).
  Le script a révélé **davantage de variantes de mise en forme que prévu**
  d'une fiche à l'autre (pas seulement 2 familles Seconde/Première) —
  chacune gérée explicitement plutôt que forcée : ordre des déclarations en
  tête de `verifierUne()`, ligne vide ou non avant `let modeImmediat`, fin
  de `reinitialiser()`/`genererNouvelleFiche()` très irrégulière (résolu en
  regroupant l'insertion juste après le début de fonction, ancre stable,
  plutôt qu'en fin de fonction), barre de boutons sans "Générer une
  nouvelle version" sur certaines fiches, attributs HTML inversés sur
  d'autres, affectation d'`exercices` différée en fin de script sur une
  fiche (même motif que le pilote Première). **Leçon retenue** : la
  supposition initiale ("2 familles de template") était fausse — chaque
  fiche a pu être retouchée indépendamment au fil du temps.

  **Suite donnée aux 10 fiches à état auxiliaire recensées** : sur
  vérification individuelle (pas juste le nombre d'appels `construireX()`),
  seulement **3 avaient vraiment besoin du mécanisme `extra`** —
  `cahiers/premiere/cahier-3/fiche-10.html`, `cahier-6/fiche-19.html`,
  `cahier-7/fiche-20.html` — câblées et testées de bout en bout
  (enregistrement, reprise identique, validation), aucun souci.

  **3 autres se sont révélées statiques** (coordonnées fixes, aucun
  `Math.random` ni référence à `exercices[idx]` dans leurs
  `construireGraphiqueX()`) : `cahier-7/fiche-21.html`, `fiche-22.html`,
  `cahier-8/fiche-24.html` — pas besoin d'état auxiliaire du tout, migrées
  avec le modèle simple.

  **1 fiche (`cahier-2/fiche-06.html`) a révélé une vraie limite du
  mécanisme `extra`** : sa section graphique stocke une fonction JS *en
  direct* dans ses données (`paramsGraphiques.g6_6.ordre[i].fn`), pas
  seulement des nombres — une fonction n'est pas sérialisable en JSON/
  Firestore. Détecté par un test réel (`TypeError: fonctionJs n'est pas une
  fonction` à la restauration), pas par relecture de code — **utile
  d'insister sur les tests en conditions réelles, pas seulement la
  vérification syntaxique des ancres**. Corrigé en deux temps : (1)
  `enregistrerBrouillon()` (`assets/js/suivi.js`) fait maintenant un
  aller-retour JSON sur `exercices`/`saisies`/`extra` avant l'écriture
  (supprime silencieusement tout `undefined` isolé, protège tout le monde,
  aucun coût) ; (2) pour cette fiche précise, le mécanisme `extra` a été
  abandonné (la fonction ne peut de toute façon pas survivre à l'aller-retour
  JSON) — migrée avec le modèle simple à la place. Conséquence acceptée :
  `exercices[idx].bonneReponse` est copiée au moment de la génération (donc
  la correction reste juste), mais le graphique affiché à la reprise d'un
  brouillon peut différer de celui vu au premier passage sur les exercices
  6.3 à 6.8 — limitation cosmétique, pas un bug de notation.

  **Les 6 fiches à widget interactif custom ont ensuite toutes été migrées
  à la main** (pas par le script mécanique, structure trop spécifique à
  chacune) — `cahiers/seconde/cahier-2/fiche-08.html` (`tableauSigne`),
  `cahier-3/fiche-09.html` (`tableauCroiseRempli`), `cahier-3/fiche-10.html`
  (`schemaEvolution`), `cahier-5/fiche-14.html` (`tableauProgramme` +
  état auxiliaire `paramsGraphique14`), `fiche-15.html`
  (`tableauVariations` ×2 + état auxiliaire `paramsGraphiqueEq` et
  `paramsGraphiqueDeux`), `fiche-16.html` (`tableauVariations` ×3 + état
  auxiliaire `paramsGraphiqueAffine`). Principe commun aux 4 widgets
  (tableauSigne/tableauCroiseRempli/schemaEvolution/tableauProgramme/
  tableauVariations) : une fonction `capturerEtatXxx()` lit l'etat brut du
  DOM (rempli ou non) et alimente `saisies[idx]` a CHAQUE case modifiee
  (pas seulement au clic sur le bouton de validation dedie au widget), pour
  que "Enregistrer mon avancement" retienne la progression meme partielle ;
  une fonction `restaurerEtatXxx()` symetrique recopie cet etat dans le DOM
  au chargement, avant d'appeler `verifierUne()` pour recolorier/rescorer
  silencieusement (gating "reveler" applique aux cases du widget comme aux
  exercices classiques). Quand la structure du widget a un nombre de
  colonnes/cases VARIABLE (tableauSigne, tableauVariations), l'etat capture
  est un objet indexe par numero de colonne, jamais un tableau de tableaux
  — **Firestore rejette les tableaux imbriques** (`setDoc()` plante avec
  `invalid-argument`), piege decouvert en testant reellement fiche-08 (voir
  plus bas). Pour les 3 fiches a etat auxiliaire (14/15/16), meme mecanisme
  `extra` que sur les fiches Premiere deja migrees : necessaire uniquement
  pour que le graphique partage affiche a la reprise d'un brouillon
  corresponde a celui vu au premier passage (les reponses elles-memes
  restent justes independamment, deja copiees dans chaque exercice a la
  generation) ; `paramsVar` (mini-graphique propre a chaque tableauVariations)
  et `paramsProgramme` (14.5) n'en ont pas besoin, deja stockes dans
  l'exercice concerne, comme une reponse normale.

  **État à date : les 44 fiches de cahiers de calcul sont toutes migrées**
  vers le nouveau modèle de suivi (brouillon/valider) — plus aucune fiche
  sur l'ancien modèle (`tentatives`).

  **Phase de test systématique terminée** (demandée explicitement par
  l'utilisateur après l'extension aux 44 fiches : « je ne pourrai pas tester
  autant de fiches avec autant de questions... prendre le temps de simuler
  un grand nombre de fiches ») : chaque fiche migrée est rejouée de bout en
  bout (saisie → Enregistrer → rechargement → vérification de la
  restauration → Valider), pas juste relue. A déjà trouvé un **bug bloquant
  qu'aucune vérification d'ancre n'aurait pu détecter** :

  **`cahier-10/fiche-27.html` et `fiche-28.html` déclaraient `exercices` en
  `const`** (contenu entièrement statique, jamais random, donc jamais
  réaffecté avant la migration) — le script de câblage mécanique vérifie des
  correspondances textuelles, pas le mot-clé `let`/`const` utilisé, donc rien
  n'a signalé le problème à l'écriture. À la restauration d'un brouillon,
  `exercices = brouillon.exercices;` (ajouté par la migration) plantait avec
  `TypeError: Assignment to constant variable`, coupant `initialiserFiche()`
  en plein milieu : saisies non restaurées, puis échec de la validation qui
  suit. **Repéré uniquement par un test réel** (fiche-28, brouillon existant
  d'un test précédent) — la relecture de code avait laissé passer les deux
  fiches, y compris fiche-27 dont un test antérieur, moins poussé (pas de
  vrai cycle enregistrer→recharger avec brouillon existant), avait semblé
  passer. Corrigé en changeant `const exercices` en `let exercices` (les
  deux seules occurrences dans les 44 fiches, vérifié par grep sur tout le
  dossier `cahiers/`) — testé de bout en bout sur les deux après correction,
  restauration et validation OK. Commit `8d7cf36`, poussé sur
  `suivi-firebase`. **Leçon retenue** : un test qui ne force pas le vrai
  chemin de restauration (brouillon préexistant au chargement, pas juste
  une saisie puis sauvegarde dans la même session) peut donner un faux
  positif.

  **Les 38 fiches déjà migrées à ce moment-là ont toutes été testées de
  bout en bout** (enregistrer → recharger → vérifier la restauration des
  saisies → valider), pas seulement relues : les 12 déjà couvertes
  précédemment (2 pilotes, fiche-02 à 05 Première, les 3 fiches à état
  auxiliaire, le cas limite fiche-06, fiche-27/28 après correction) plus 26
  fiches supplémentaires, toutes propres (aucune erreur console, saisies
  bien restaurées après rechargement, validation fonctionnelle). Seul bug
  trouvé sur l'ensemble : celui décrit ci-dessus (`const exercices`), déjà
  corrigé et revérifié.

  **Un deuxième bug bloquant trouvé en migrant les 6 fiches à widget
  custom, sur fiche-08 (le premier widget migré, `tableauSigne`)** :
  Firestore refuse d'écrire un champ qui est un tableau contenant
  lui-même des tableaux (`lignes: [[...], [...]]` pour les cases du
  tableau, une ligne par facteur) — `setDoc()` échoue avec
  `invalid-argument`. Plus grave : `enregistrerBrouillon()`
  (`assets/js/suivi.js`) avalait cette erreur silencieusement
  (`console.warn` sans la remonter à l'appelant), donc la fiche affichait
  quand même "Avancement enregistré" à l'élève alors que rien n'avait été
  écrit — un problème plus large que ce seul cas (n'importe quel échec
  Firestore réel, ex. perte de connexion, aurait donné le même faux
  positif sur **les 44 fiches**). Corrigé à deux niveaux : (1)
  `enregistrerBrouillon()` relance désormais l'erreur après l'avoir
  loguée, pour que le `catch` déjà câblé sur chaque fiche affiche le bon
  message d'échec ; (2) sur fiche-08 précisément, restructuration de
  `lignes` en objet indexé par numéro de ligne plutôt qu'en tableau de
  tableaux. Repéré en testant réellement l'enregistrement (le brouillon
  revenait tronqué après rechargement), pas à la relecture de code.
  Commit `e8cbb5f`.

  **Bilan final : les 44 fiches ont toutes été testées de bout en bout**
  (35 avec le cycle enregistrer→recharger→valider complet, les 6 fiches à
  widget en plus avec un test spécifique par widget — case entièrement
  remplie ET partiellement remplie, capture avant clic sur le bouton dédié
  du widget). Deux bugs bloquants trouvés et corrigés au total (`const
  exercices`, tableaux imbriqués Firestore), tous les deux uniquement par
  test réel. Compte `l.testeur` : nettoyé après chaque session de test
  (`resultats`/`brouillons` supprimés) — laissé vide à la fin de cette
  série de migrations.

  **Bug de correction signalé le 18/09/2026, corrigé le même jour en deux
  temps (commits `b761b90` puis `76851db`, sur `master` directement, hors
  de cette branche)** : le vérificateur (`checkEqualNumeric`) évaluait
  mathématiquement la réponse tapée plutôt que d'exiger un nombre déjà
  calculé — "144-72" était accepté comme correct pour "12²-8×9" puisque
  l'expression s'évalue à la bonne valeur.

  Premier correctif (`b761b90`) : nouvelle fonction `estFormeFinaleNumerique()`
  exigeant, côté élève, une forme finale (entier, décimal, fraction simple
  `a/b`) dès qu'aucune variable n'est utilisée. **A cassé, sans le savoir sur
  le moment, tout exercice dont la réponse EST intentionnellement une
  expression non réduite** : "écrire comme une seule puissance" (`2^6`),
  simplifier une racine (`3*sqrt(31)`), valeurs exactes avec exponentielle
  (`exp(-6)`) — David a signalé le cas des puissances peu après coup ; un
  audit dynamique complet (regénérer chaque fiche des dizaines de fois et
  tester si la réponse attendue valide contre elle-même, hors types à
  vérificateur dédié) en a trouvé une trentaine d'autres, dans au moins 6
  fiches en plus de celles déjà repérées par recherche de texte — **la
  recherche de texte s'est révélée insuffisante à elle seule** (des
  helpers différemment nommés, ex. `surdTerm`, passaient au travers).

  Second correctif (`76851db`, remplace le premier) : plutôt que de
  marquer chaque exercice concerné au cas par cas (ce qui avait été
  commencé pour les puissances via un flag `formePuissance`, laissé tel
  quel dans le code, maintenant redondant mais inoffensif), la règle
  devient auto-adaptative — la forme finale n'est exigée côté élève QUE
  si la réponse correcte elle-même en est déjà une. Si la réponse est une
  expression (`2^6`, `3*sqrt(31)`, `exp(-6)`), aucune contrainte
  supplémentaire n'est imposée, comportement identique à avant le tout
  premier correctif pour ces cas précis — tout en gardant l'exigence pour
  les vrais calculs (`144-72` reste refusé pour `72`). Corrige tout d'un
  coup, sans avoir à retrouver chaque cas. La branche algébrique (réponses
  avec `x`, `t`, etc.) n'a jamais été concernée, y accepter une forme
  équivalente non simplifiée reste voulu (`2*(x+2)` pour `2x+4`).

  Vérifié par audit exhaustif sur les 44 fiches après le second correctif :
  plus aucun cas en échec. **Leçon retenue sur l'audit lui-même** : la
  première version du script d'audit (mettre la réponse dans le vrai champ
  `<math-field>` puis appeler `verifierUne()`) donnait énormément de faux
  positifs — MathLive interprète une valeur assignée en JS comme du LaTeX,
  donc `sqrt(6)` devient les quatre lettres séparées "s q r t(6)". Contourné
  en testant directement `checkEqualNumeric(reponse, reponse)` (et les
  variantes `estFactorise`/`estFractionIrreductible` avec leurs bons
  arguments), sans passer par le DOM.
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

## Décision : persistance de la session (2026-09-18)

La session Firebase reste ouverte indéfiniment après fermeture de l'onglet/du
navigateur (comportement par défaut, aucun réglage particulier dans le code) —
tant que l'élève ne clique pas sur "Se déconnecter". Risque identifié sur
poste partagé (salle informatique) : l'élève suivant resterait connecté à la
place du précédent. **David a choisi de garder ce fonctionnement** plutôt que
de forcer une déconnexion à la fermeture de l'onglet, et de simplement
rappeler aux élèves de se déconnecter en fin de séance — ne pas re-proposer
de changer ce réglage sans qu'il en reparle.

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
- **Groupes de spécialité de Première (19/09/2026)** : David envoie, PDF par
  PDF (export Index Education "Liste des élèves par groupe"), les groupes
  de sa classe de spécialité maths — les élèves viennent de classes
  physiques différentes, seul le groupe compte. Convention `classe` :
  `1ere-Gr <N>` (pas d'accent sur "1ere", un seul tiret avant "Gr" —
  contrainte technique, voir `estPremiere()`/`formaterClasseAffichee()`
  plus bas). `1ere-Gr 1` (27 élèves, groupe 1MATHS1) et `1ere-Gr 3` (26
  élèves, groupe 1MATHS3) créés et vérifiés dans Firestore. D'autres
  groupes suivront, et des groupes de Terminale sont prévus — d'où le
  préfixe de niveau dans l'affichage (voir piège plus bas).

## Pas encore fait

- Devoirs (brique en cours, sur demande explicite de l'utilisateur). Décidé
  le 18/09/2026 : la note retenue est la meilleure **tentative complète**
  de la fiche avant l'échéance (pas par exercice). Le mode chrono sera
  imposé pour les devoirs (décidé, pas encore fait).

  **Étape 1 faite (18/09/2026) : outil d'attribution.**
  `tableau-de-bord/devoirs.html` + `assets/js/devoirs.js`, réservé à
  l'enseignant (même garde admin que le reste du tableau de bord).
  Formulaire (fiche, classe, échéance, nombre d'essais) → crée un document
  `devoirs/{id}` ; liste des devoirs attribués avec statut (En cours/
  Terminé, calculé sur l'échéance) et suppression. `assets/js/
  manifeste-fiches.js` : liste statique des 44 fiches (extraite des 15
  sommaires de cahier) pour peupler le sélecteur — à tenir à jour à la main
  si une fiche est ajoutée/renommée. Règles Firestore déjà en place au
  moment d'écrire cette brique (`devoirs/{id}` : lecture par tout élève
  connecté, écriture par l'enseignant seul) — rien à republier en Console
  Firebase pour cette étape.

  Testé de bout en bout avec un compte enseignant temporaire (créé via
  `outils/creer-comptes --admin`, supprimé après coup — même principe que
  les comptes élèves fictifs) : création d'un devoir, persistance réelle
  (rechargement de page), suppression, re-vérification que Firestore est
  bien vide ensuite. Bug trouvé et corrigé pendant ce test (pas par
  relecture) : après suppression du dernier devoir de la liste,
  `chargerListeDevoirs()` sortait tôt (liste vide) sans vider
  `corpsTableau.innerHTML` — la ligne `<tr>` restait dans le DOM (juste
  masquée par `tableau.hidden`, donc invisible, mais un état incohérent en
  cas de réaffichage). Corrigé en vidant `corpsTableau` aussi dans cette
  branche.

  Node.js a dû être installé sur ce PC perso (absent jusqu'ici,
  contrairement au PC pro) pour lancer `outils/creer-comptes` — désormais
  disponible sur cette machine pour la suite.

  **Étape 3 faite (18/09/2026) : note + vue résultats par devoir**, faite
  avant l'étape 2 (limite bloquante/chrono) à la demande de David, pour
  voir un vrai rendu avant de continuer. Le modèle `resultats/{ficheId}`
  (voir plus haut) FUSIONNE les passages -- inadapté à un devoir, qui a
  besoin de la meilleure tentative INDIVIDUELLE. Nouveau journal séparé
  `eleves/{uid}/devoirsTentatives/{id}` (append-only, comme tentatives/
  connexions/automatismes) : `validerFiche()` (`assets/js/suivi.js`), en
  plus de l'écriture `resultats` existante inchangée, vérifie maintenant
  si un devoir existe pour cette fiche + la classe de l'élève (requête sur
  `devoirs`, classe lue une fois depuis `eleves/{uid}` puis mise en cache
  en mémoire) et si oui enregistre cette tentative précise (score,
  horodatage serveur) séparément. Coût Firestore maîtrisé : rien n'est
  écrit en dehors d'un devoir actif, l'immense majorité des validations
  n'en déclenchent aucune écriture supplémentaire.

  Règles Firestore mises à jour en conséquence (`devoirsTentatives`, même
  principe que tentatives/connexions/automatismes) et **republiées par
  David en Console Firebase le 18/09/2026** (nécessaire avant tout test,
  sinon échec silencieux des écritures).

  Vue résultats : sur `tableau-de-bord/devoirs.html`, bouton "Résultats"
  par devoir → tableau par élève de la classe visée (rendu/non rendu,
  meilleure note parmi les tentatives horodatées AVANT l'échéance --
  horodatage serveur, pas une valeur cliente falsifiable --, essais
  utilisés/max, dernière activité même hors délai).

  Testé de bout en bout avec deux comptes temporaires (enseignant admin +
  jeton personnalisé pour n.testeuse, sans toucher son mot de passe réel) :
  un devoir avec échéance très proche, deux tentatives avant l'échéance,
  attente que l'échéance passe reellement, verification "Rendu" + meilleure
  note (14/19 sur deux tentatives 8/19 et 14/19) + "2/3" essais -- et sur le
  premier devoir de David (échéance 22h00), tentatives faites après coup
  correctement affichées "Non rendu" avec quand même la date de dernière
  activité visible. **Piège découvert pendant ce test** : les onglets du
  navigateur integre partagent la meme session Firebase Auth (stockage par
  origine) -- se connecter sous un autre compte sur un onglet deconnecte
  tous les autres onglets ouverts sur le meme navigateur.

  **Devoirs sur les sujets blancs d'automatismes (18/09/2026)**, sur
  demande de David. Meme collection `devoirs/{id}`, distinguee par un
  champ `type` (`'fiche'` ou `'automatismes'`) : un devoir automatismes
  porte `niveau` (1/2/3, choisi par l'enseignant a l'attribution) au lieu
  de `ficheId`. Champ d'affichage renomme `ficheTitre` -> `titre`
  (generique aux deux types). `enregistrerAutomatisme()` (`assets/js/
  suivi.js`) suit exactement le meme principe que `validerFiche()` :
  verifie si un devoir `type=='automatismes'` existe pour (niveau, classe
  de l'eleve) et ecrit si oui dans le MEME journal `devoirsTentatives`
  (score = points sur 6, totalExercices = 6) -- la vue resultats de
  devoirs.js n'a pas eu besoin de distinguer les deux types. Le niveau
  n'est PAS impose a l'eleve (bouton "Niveau 1/2/3" choisi librement sur
  la page du sujet blanc, voir moteur.js/changerNiveau) : une tentative a
  un autre niveau que celui du devoir n'est simplement pas comptee, comme
  une tentative hors delai -- coherent avec l'etape 2 (limite/chrono
  imposes) pas encore faite. Formulaire d'attribution : select "Type de
  devoir" qui bascule fiche/niveau, et filtre la liste des classes sur la
  Premiere seule quand "automatismes" est choisi (seul niveau concerne par
  le suivi des automatismes). Aucune regle Firestore supplementaire
  necessaire (memes collections que les devoirs de fiches). Teste de bout
  en bout comme les devoirs de fiches (jeton n.testeuse, echeance proche,
  deux tentatives niveau 2, verification "Rendu" + meilleure note 4.2/6 +
  essais).

  **Erreur commise pendant le nettoyage de ce test** : en supprimant les
  tentatives de test de n.testeuse, la requete a vide TOUTE sa
  sous-collection `automatismes` (`getDocs` sans filtre) plutot que les
  seules entrees ajoutees pendant ce test -- a aussi supprime les deux
  sujets blancs de reference documentes ci-dessous ("un par mode fiche/
  chrono"), prevus pour tester l'onglet Automatismes du tableau de bord.
  Sans consequence reelle (compte de test jetable, dont l'historique est
  de toute facon "vidé après chaque test" par convention), mais **a
  re-semer avant de retester l'onglet Automatismes du tableau de bord**.

  Nouvelle navigation en haut des deux pages du tableau de bord (`index.html`
  et `devoirs.html`) : deux cartes cote a cote "Fiches"/"Devoirs" (icones
  SVG maison, meme forme que `.cahier-nav-btn` de style.css -- carte
  arrondie, bordure/texte `--accent`, remplissage `--accent-clair` au
  survol -- pour rester coherent avec le reste du site), celle de la page
  courante mise en evidence (fond plein, icone inversee). Remplace le
  simple lien texte "Devoirs →"/"← Tableau de bord" d'avant. CSS ajoutee
  dans `tableau-de-bord.css` (`.tdb-nav-*`).

  **Réorganisation de `devoirs.html` (18/09/2026)**, sur demande de David :
  le formulaire d'attribution et la liste "Devoirs attribués" (avant
  toujours visibles tous les deux) sont désormais repliés par défaut
  derrière deux gros boutons pleine couleur, mutuellement exclusifs
  (`basculerPanneau()` dans `devoirs.js`) — "+ Attribuer un devoir" (violet
  `--accent`) et "✓ Devoirs faits" (vert `--vert`), avec un chevron qui
  s'inverse pour indiquer l'état ouvert/fermé. Badge "Non rendu" passé de
  gris à rouge (`--rouge`/`--rouge-clair`, nouvelle classe `dev-badge-
  alerte`) pour mieux signaler visuellement qu'une action manque, bouton
  "Résultats" recoloré en `--accent-clair` (au lieu du gris neutre
  `tdb-bouton-secondaire`). Au passage : `.tdb-tableau` passé en
  `display:block; overflow-x:auto` (défilement horizontal plutôt que
  colonnes coupées sur petit écran) — bénéficie à tout le tableau de bord,
  pas seulement à cette page.

  **Mode (fiche/chrono) choisi à l'attribution pour un sujet blanc
  (18/09/2026)**, sur demande de David. Même principe que le niveau : champ
  `mode` sur le devoir, sélecteur "Mode fiche"/"Mode chrono ⏱" dans le
  formulaire (visible seulement pour le type automatismes, chrono
  sélectionné par défaut comme `modeDefaut` de `sujet-blanc.html`).
  `enregistrerTentativeDevoirAutomatismeSiApplicable()` (`suivi.js`) filtre
  maintenant sur (type, niveau, mode, classe) — requête à 4 égalités,
  vérifiée sans avoir besoin d'index composite. Ni le niveau ni le mode ne
  sont imposés à l'élève (toujours choisis librement sur la page du sujet
  blanc) : une tentative avec un autre niveau OU un autre mode que ceux du
  devoir n'est simplement pas comptée.

  **Temps par question choisi à l'attribution, en mode chrono (18/09/2026)**,
  sur demande de David. Même principe que niveau/mode : champ `duree` sur
  le devoir (mêmes 5 valeurs que le select `data-action="duree"` de
  `moteur.js` — 60/90/120/180/0 "sans limite"), sélecteur "Temps par
  question" dans le formulaire, visible seulement si type automatismes ET
  mode chrono (le champ `dev-champ-duree` dépend des DEUX autres champs,
  géré par `mettreAJourChampDuree()` appelée depuis les deux écouteurs de
  changement). Absent du document pour un devoir en mode fiche (la durée
  n'a pas de sens hors chrono, comme sur la page du sujet blanc elle-même).
  `ETAT.duree` n'était pas transmis au callback `onFinSerie` de
  `moteur.js` — ajouté (`duree: ETAT.duree`), puis relayé par
  `sujet-blanc.html` jusqu'à `enregistrerAutomatisme()` (nouveau paramètre)
  et `enregistrerTentativeDevoirAutomatismeSiApplicable()`, dont la requête
  ajoute `where('duree','==',duree)` uniquement si `mode === 'chrono'`.

  Testé de bout en bout (jeton n.testeuse) : une tentative avec une durée
  différente de celle du devoir n'est PAS comptée dans `devoirsTentatives`
  (vérifié directement — un seul document écrit sur deux tentatives
  envoyées, la non-conforme correctement ignorée), la conforme si.

  **Bandeau "devoir à faire" côté élève (18/09/2026)**, sur demande de
  David pour le test réel du 19/09/2026 avec `demo-eleve` : jusqu'ici rien
  ne prévenait l'élève qu'un devoir existait, même si l'attribution/le
  suivi fonctionnaient déjà. Nouveau `assets/js/devoirs-notification.js`,
  chargé sur les pages d'entrée du site (`index.html`, `cahiers/index.html`,
  `automatismes/index.html`, `automatismes/premiere/index.html` — pas les
  44 fiches individuelles, pour rester au niveau "dès la connexion" plutôt
  que harceler sur chaque page). Pour un élève connecté (rien pour
  l'enseignant, qui n'a pas de doc `eleves/{uid}` donc `classe` reste
  `null` — le bandeau ne peut jamais s'afficher pour un compte admin) :
  lit sa `classe`, cherche les `devoirs` de cette classe dont l'échéance
  n'est pas encore passée (filtré CÔTÉ CLIENT sur `echeance.toMillis() >
  Date.now()`, pas via une clause Firestore `>` — évite d'avoir besoin d'un
  index composite, aucun outillage CLI Firebase sur ce dépôt pour en
  déployer un), affiche un bandeau juste sous le header (`.devoir-bandeau`,
  style.css) listant chacun avec son échéance et un lien direct (`ficheId`
  pour un devoir fiche ; seule page existante `/automatismes/premiere/
  sujet-blanc.html` pour un sujet blanc, l'élève doit y resélectionner
  lui-même niveau/mode/durée). Statut "Pas encore fait"/"Déjà fait" par
  devoir (lecture de `devoirsTentatives`, purement informatif, n'empêche
  rien).

  Testé de bout en bout avec le VRAI compte `demo-eleve` (identifiants
  documentés ci-dessus, pas de compte jetable nécessaire ici) : devoir de
  test créé sur `1ere-demo`, bandeau vérifié sur `index.html` ET
  `cahiers/index.html` ("Pas encore fait"), tentative simulée puis
  rechargement ("Déjà fait — tentatives encore possibles" en vert).
  Devoir de test et tentative supprimés après coup.

  **Limite d'essais réellement bloquante — pilotée sur fiche-01.html
  Première (19/09/2026)**, sur demande de David pendant son test réel avec
  `demo-eleve` (devoir sur cette fiche, échéance le 19/09 10h00, 3 essais
  max — déjà 3 tentatives réelles enregistrées au moment de la demande).
  Nouvelle fonction `verifierEtatDevoir(ficheId)` (`suivi.js`), appelée
  dans `initialiserFiche()` : si un devoir est actif (échéance pas encore
  passée) pour la fiche+classe et que `essaisUtilises >= nbEssaisMax`,
  désactive le bouton "Valider ma fiche" dès le chargement et affiche un
  message explicite (garde-fou dans `validerFicheActuelle()` aussi, si le
  bouton est contourné). Double filtre par échéance (comme la vue
  résultats) : le blocage ET le plafonnement des écritures dans
  `enregistrerTentativeDevoirSiApplicable()` ne s'appliquent que PENDANT la
  fenêtre active — passée l'échéance, entraînement libre illimité comme
  prévu dès la conception (aucun changement de comportement post-échéance).

  Testé en conditions réelles, DIRECTEMENT avec les 3 vraies tentatives de
  `demo-eleve` (pas de tentative supplémentaire nécessaire, sur demande de
  David pour éviter de refaire tout le devoir) : bouton bien désactivé au
  chargement avec le message correct, `validerFicheActuelle()` bloqué même
  appelée directement (aucune 4ᵉ tentative écrite), `window.validerFiche()`
  bloqué même en contournant tout le code de la fiche (2ᵉ ligne de
  défense dans `suivi.js` elle-même). Un appel de test à `window.
  validerFiche()` a quand même modifié le score cumulé normal
  (`resultats/{ficheId}`, comportement voulu — cette limite ne concerne
  QUE le compteur du devoir) : `exercicesReussis`/`nbValidations`/
  `sommeQuestionsRepondues` corrigés après coup pour retrouver l'état
  exact d'avant le test.

  **Étendu aux 43 autres fiches et aux sujets blancs d'automatismes
  (19/09/2026, sur demande de David)**, sur le même principe que le pilote
  fiche-01.html ci-dessus.

  Côté fiches : les 5 mêmes modifications (déclaration `etatDevoir`,
  vérification dans `initialiserFiche()`, corps de `mettreAJourEtatBoutons()`
  et garde en tête de `validerFicheActuelle()`, id `btn-recommencer` +
  message de brouillon qui n'écrase plus le message de blocage) appliquées
  aux 43 fiches restantes par script PowerShell, texte de remplacement
  extrait **directement** de fiche-01.html/fiche-02.html (référence
  déjà testée) plutôt que retapé à la main — évite tout risque de
  divergence ou de mojibake (voir piège plus bas sur l'encodage des
  scripts PowerShell). Vérification d'uniformité préalable (comptage +
  hash MD5 des 2 fonctions) sur les 43 fichiers avant d'écrire le script :
  aucune divergence trouvée, bascule mécanique sans cas particulier. Script
  buggé une première fois (bloc de vérification du devoir inséré au
  mauvais endroit dans `initialiserFiche()`, juste après `zoneValider`
  au lieu d'après `boutonVerifier` — recopie imparfaite de la structure
  réelle de fiche-01.html) : détecté immédiatement (diff anormalement
  petit sur ce bloc), corrigé par un second script ciblé sur la bonne
  ancre. Syntaxe JS des 44 fiches revérifiée après coup (`vm.Script` sur
  les blocs `<script>` non-module extraits de chaque fichier).

  Côté automatismes : `enregistrerTentativeDevoirAutomatismeSiApplicable`
  (`suivi.js`) a maintenant le même plafond que la version fiche (skip
  silencieux si un devoir est actif et `essaisUtilises >= nbEssaisMax`) ;
  nouvelle fonction exportée `verifierEtatDevoirAutomatisme(niveau, mode,
  duree)`, même principe que `verifierEtatDevoir` mais identifie le devoir
  par (type, niveau, mode, [durée], classe) au lieu d'un `ficheId`. Filtre
  commun factorisé dans `devoirsPourAutomatisme()`, partagé entre les deux.
  Pas de bouton unique à désactiver ici (niveau/mode/durée choisis
  librement par l'élève APRÈS le chargement, via moteur.js, pas figés comme
  un `ficheId`) : approche volontairement passive plutôt que de coupler
  `moteur.js` au suivi — `sujet-blanc.html` vérifie l'état du devoir dans
  son `onFinSerie` (avec le niveau/mode/durée effectivement joués), APRÈS
  la série mais AVANT l'enregistrement, et affiche un message dédié
  (`#suivi-etat`, nouveau) si la tentative qui vient de se terminer ne
  comptera pas pour le devoir. Message masqué automatiquement au démarrage
  d'une nouvelle série (délégation d'événement sur `#app`,
  `[data-action="nouvelle"]`/`"nouvelle-memes-themes"`), pour ne pas rester
  affiché — potentiellement périmé — pendant que l'élève rejoue à un autre
  niveau/mode non bloqué.

  Testé en conditions réelles (jeton `n.testeuse`, devoirs de test à 1
  essai sur `1ere-test`, comptes admin via script direct Firestore plutôt
  que l'UI) sur 3 cas : une fiche "normale" (fiche-06 Première), une fiche
  du groupe "widget-custom" (fiche-08 Seconde, structure différente déjà
  repérée pour le correctif MathLive) et un sujet blanc d'automatismes en
  mode fiche niveau 2. Les trois : bouton/API bloqués après la limite
  atteinte, message correct, `essaisUtilises` qui ne dépasse jamais
  `nbEssaisMax` même en insistant. Toutes les données de test (devoirs,
  `devoirsTentatives`, entrées `automatismes`, `resultats` pollués par les
  clics de validation de test) supprimées après coup.

  Le bandeau "devoir à faire" reste, comme avant, chargé uniquement sur les
  4 pages d'entrée du site (pas les 44 fiches individuelles ni
  `automatismes/premiere/fiche.html`) — inchangé par ce chantier.

  **Verrouillage niveau/mode/durée pendant un devoir d'automatismes
  (19/09/2026, sur demande de David juste après ce qui précède)** : David a
  fait remarquer que c'est LUI qui choisit niveau/mode/durée à
  l'attribution — l'approche passive ci-dessus (l'élève choisit librement,
  seule une tentative correspondant au devoir est comptée) pouvait laisser
  un élève jouer "à côté" sans le savoir. `sujet-blanc.html` verrouille
  maintenant la page sur les valeurs du devoir tant que l'échéance n'est
  pas passée.

  Nouvelle fonction exportée `devoirAutomatismeActif()` (`suivi.js`) :
  contrairement à `verifierEtatDevoirAutomatisme(niveau, mode, duree)`
  (qui vérifie un COMBO précis, appelée après une série), celle-ci cherche
  le devoir actif d'automatismes de la classe de l'élève SANS connaître
  niveau/mode/durée à l'avance (seul `type`+`classe` en filtre Firestore,
  échéance filtrée côté client comme `verifierEtatDevoir`) — nécessaire ici
  puisqu'on veut justement CE devoir pour savoir sur quoi verrouiller,
  avant qu'aucune série n'ait été jouée. Renvoie aussi `niveau`/`mode`/
  `duree` (pas seulement le statut essais/blocage).

  `automatismes/assets/moteur.js` accepte un nouveau `config.verrouille =
  {niveau, mode, duree, titre, echeanceTexte}` optionnel (rétrocompatible :
  absent pour `fiche.html`, qui n'est pas concernée) : `demarrer()` applique
  ces valeurs à `ETAT` au lieu des défauts, `changerMode`/`changerNiveau`/le
  `<select>` de durée deviennent des no-op tant qu'il est présent, et
  `panneauModesHTML()` affiche un résumé non cliquable (pastille bleue,
  nouvelles classes CSS `.mode-panneau-verrouille`/`.mode-verrouille-resume`
  dans `automatismes.css`) à la place des boutons de choix habituels.
  `sujet-blanc.html` attend `DOMContentLoaded` avant d'appeler
  `Automatismes.demarrer()` (piège déjà documenté plus bas : `suivi.js` est
  un `<script type="module">`, différé, un script classique plus bas dans
  la page peut s'exécuter avant que `window.devoirAutomatismeActif` existe)
  et construit `verrouille` à partir du devoir trouvé, sinon `null` (page
  normale). `assets/js/devoirs-notification.js` : commentaire obsolète
  corrigé (disait que l'élève devait choisir lui-même en arrivant sur la
  page, plus vrai depuis ce verrouillage).

  Testé en conditions réelles (jeton `n.testeuse`, devoir de test niveau 3/
  chrono/60 s délibérément différent des défauts de la page pour bien
  distinguer un verrouillage réel d'une coïncidence, 2 essais max) :
  panneau verrouillé affiché au lieu des boutons, série lancée directement
  au niveau/mode/durée du devoir (vérifié via `Automatismes.etat`, exposé
  sur `window` par le moteur), deux séries menées à terme (minuteur
  accéléré artificiellement via `ETAT.chrono.debut`, plutôt que d'attendre
  60 s × 10 questions en réel) confirmant `essaisUtilises` à 1 puis 2,
  troisième série déclenchant bien le message "tentative qui ne compte
  plus", `essaisUtilises` resté bloqué à 2. Après passage de l'échéance
  dans le passé (modifiée directement en base) : page revenue au panneau
  normal, boutons cliquables, comme prévu. `automatismes/premiere/
  fiche.html` revérifiée séparément : aucun changement de comportement
  (jamais de `config.verrouille` fourni). Toutes les données de test
  supprimées après coup.

  **Retours de David après son PREMIER vrai test d'un devoir de sujet blanc
  (19/09/2026, devoir réel `1ere-demo`, niveau 2/chrono/3 min, 2 tentatives
  avec des questions volontairement passées)** :

  1. **Bug confirmé et corrigé** — une question passée sans réponse
     n'apparaissait nulle part dans le tableau de bord. Cause : `nbRepondues`
     recevait `total` (nombre de questions de la série, toujours 10, pas
     "combien de réponses"), et `totalExercices` valait 6 en dur —
     `devoirs.js` affichait donc "—" plutôt qu'un chiffre trompeur (déjà
     documenté au moment du "Lot de 8 retours" ci-dessous, jamais corrigé
     depuis). `moteur.js` (`verifierFinSerie`) calcule maintenant le nombre
     RÉEL de réponses données (`ETAT.reponses.filter(r => r !== null).length`)
     et le fait remonter dans le payload d'`onFinSerie` (`resultat.repondues`).
     Côté `suivi.js`, `enregistrerAutomatisme`/
     `enregistrerTentativeDevoirAutomatismeSiApplicable` reçoivent deux
     nouveaux paramètres (`repondues`, `baremeTotal`) et écrivent
     `nbQuestions` (nombre de questions, 10) SÉPARÉMENT de `totalExercices`
     (points du barème, 5 depuis le point 4) — les deux sens qui se
     partageaient auparavant le même champ ont chacun le leur.
     `devoirs.js` : colonne "Non-réponses" calcule maintenant
     `nbQuestions - nbRepondues` pour un devoir d'automatismes (comme
     `totalExercices - nbRepondues` pour une fiche), avec repli sur "—" si
     `nbQuestions` est absent (tentatives enregistrées avant ce correctif —
     les deux tentatives réelles de David sur son devoir de test restent à
     "—", sans conséquence, cette échéance-là est déjà passée).

  2. **Chrono : possibilité de revenir sur une question passée, sans
     dépasser le temps total** — refonte de `automatismes/assets/moteur.js`.
     Le chrono ne suit plus une simple séquence 0→9 mais une FILE
     (`ETAT.chrono.file`/`filePos`) : toutes les questions au premier
     passage, puis seulement les questions sans réponse lors d'une reprise.
     Un nouveau budget de temps GLOBAL (`tempsGlobalRestant()` = durée ×
     nombre de questions − temps déjà écoulé) plafonne chaque minuteur
     individuel (`lancerMinuteur` : `dureeEffective = min(duree,
     tempsGlobalRestant())`) — jamais dépassé, y compris en reprise en fin
     de temps. Une fois toutes les questions vues une première fois : écran
     "récap" (nouvelle phase `ETAT.chrono.phase === 'recap'`, pas de
     correction affichée, l'épreuve n'est pas finie) avec le nombre de
     questions sans réponse et deux boutons — "Reprendre les questions sans
     réponse" (masqué si plus de budget global ou rien à reprendre) et
     "Terminer le sujet" (toujours disponible, bouton EXPLICITE : plus de
     fin automatique sur la dernière question, le bouton "Valider et
     terminer" disparaît au profit d'un simple "Valider →" partout, comme
     demandé par David). Une question déjà répondue reste verrouillée
     (jamais proposée à nouveau, confirmé avec David) : `reponses[i] ===
     null` sert à la fois de "jamais vue" et de "passée", suffisant puisque
     la file de reprise ne contient jamais que des index encore `null`.
     Barre de progression recalculée par question D'ORIGINE (répondue ou
     non) plutôt que par position dans la file en cours, pour rester lisible
     pendant une reprise où l'ordre n'est plus 0→9.

     Testé en conditions réelles (jeton `n.testeuse`, clics simulés via
     `document.querySelector('[data-action=...]').click()` pour aller vite) :
     série avec 2 questions passées → écran récap exact (numéros corrects,
     temps restant correct) → reprise → minuteur individuel frais → série
     terminée normalement une fois tout répondu. Série avec 6 questions
     passées → "Terminer le sujet" cliqué directement (sans reprendre) →
     tentative enregistrée avec `nbQuestions: 10, nbRepondues: 4` (vérifié en
     base). Plafond du budget global vérifié en manipulant directement
     `ETAT.chrono.tempsTotal`/`debut` (sans attendre en réel) : minuteur
     individuel bien capé à ce qu'il reste du budget (`dureeEffective`
     correct), et budget épuisé en cours de reprise → fin forcée directement
     (pas de nouvel écran récap en boucle) même avec des questions encore
     sans réponse. Revérifié aussi sur `automatismes/premiere/fiche.html`
     (moteur partagé, pas de régression : récap atteint normalement, aucune
     erreur console). Données de test supprimées après coup.

  3. **Barème changé de 0,6 à 0,5 point par question (note sur 5, pas 6)** —
     décidé par David, avec l'idée d'un barème réglable devoir par devoir
     plus tard (pas fait, pas demandé pour l'instant). `sujet-blanc.html` :
     `bareme` extrait dans une variable partagée entre la config
     `Automatismes.demarrer()` et l'appel à `enregistrerAutomatisme` (évite
     tout risque de désynchronisation entre le barème affiché et celui
     enregistré) ; textes de la page (sous-titre, consigne officielle) et
     `totalExercices` stocké en base mis à jour en conséquence. Un point 3 du
     retour initial de David (texte de la page d'accueil après échéance) a
     été abandonné après clarification — fausse alerte, à revoir plus tard
     avec une autre idée de sa part.

  **Deux corrections rapides après que David a testé ce qui précède
  (19/09/2026, même jour)** :
  - Boutons "Reprendre les questions sans réponse"/"Terminer le sujet"
    désalignés : la carte `.chrono-intro` applique `.chrono-intro
    .btn-principal { width: auto; min-width: 220px; margin-top: 12px; }`,
    pensé pour le bouton unique "Démarrer" de l'écran d'introduction —
    `recapHTML()` les plaçait par erreur À L'INTÉRIEUR de cette carte, donc
    seul le bouton "Reprendre" (btn-principal) héritait de ces styles, pas
    "Terminer" (btn-secondaire). Corrigé en sortant `.barre-controle` de
    `.chrono-intro`, même structure que l'écran de fin (`score-panneau` +
    `.barre-controle` À CÔTÉ, pas dedans).
  - Décalage récurrent du bouton connexion/profil (déjà "corrigé" deux fois
    avant, dernière fois commit `d122140`) : `nav-auth.js` repassait
    l'icône Tableau de bord en `display:none` dès que l'état non-admin
    était confirmé (visiteur anonyme OU élève connecté — la quasi-totalité
    des cas), en pariant qu'"on ne regarde pas cette icône précise". Faux :
    ça retire son espace réservé de la ligne, ce qui DÉPLACE le bouton
    juste après — celui utilisé pour se connecter, donc un décalage
    remarqué justement en cliquant dessus. Corrigé en ne repassant plus
    JAMAIS par `display:none` pour un non-admin : l'espace réservé au
    chargement (`visibility:hidden`) ne bouge plus une fois posé, au prix
    d'un petit vide invisible permanent dans la barre pour la grande
    majorité des visiteurs. Vérifié sur les deux variantes (`.site-nav` et
    `.barre-navigation`, voir commentaire en tête de fichier) : aucune ne
    touche plus à `display` pour un compte non-admin.

  **Lot de 8 retours de David après son test réel du 19/09/2026** :
  1. Tooltip explicite sur le bouton "Valider" bloqué ("Tu as atteint le
     nombre maximal de tentatives pour ce devoir.") — le curseur
     `not-allowed` existait déjà via la règle CSS générale `:disabled`.
  2-3. Bandeau élève (`devoirs-notification.js`) : le texte "Déjà fait —
     tentatives encore possibles" restait affiché même une fois la limite
     atteinte (faux depuis que la limite est bloquante) et ne distinguait
     pas "1 essai fait" de "tous les essais faits". Remplacé par 3 états
     sur `essaisUtilises` réel (pas juste un booléen) : 0 → "Pas encore
     fait" (rouge) ; 1..max-1 → "X/Y tentatives" (vert) ; max atteint →
     "Tentatives épuisées (X/Y) — meilleure note retenue" (gris neutre,
     nouvelle classe `devoir-bandeau-statut-epuise`).
  4-5. En mode devoir (fiche-01.html), une fois la fiche validée dans la
     session : "Recommencer" et "Enregistrer mon avancement" se masquent
     (`mettreAJourEtatBoutons()`, condition `etatDevoir && ficheValidee`)
     — empêche de redemander la même fiche après avoir vu les corrections.
     Se réaffichent normalement au rechargement de la page ou après
     "Générer une nouvelle version" (`ficheValidee` repasse à `false`),
     comportement voulu explicitement par David, pas un oubli à corriger.
  6. Colonne "Non-réponses" dans la vue résultats de `devoirs.js` — calcul
     direct (`totalExercices - nbRepondues` de la meilleure tentative,
     déjà stockés), "—" pour un devoir automatismes (`nbRepondues` y porte
     un tout autre sens, nombre total de questions de la série, pas
     "combien de réponses" — afficher un chiffre aurait été trompeur).
  7. **Modification d'un devoir existant** depuis `devoirs.html` : bouton
     "Modifier" par ligne, réutilise le MÊME formulaire que la création
     (pré-rempli, titre et bouton changent en "Modifier ce devoir"/
     "Enregistrer les modifications", bouton "Annuler la modification").
     `updateDoc()` sur l'id existant (pas de nouveau document), sans
     toucher `creeLe`/`creePar`. Fermer le panneau par n'importe quel
     bouton pendant une édition l'annule proprement (`annulerEdition()`).
  8. `scrollbar-gutter: stable` ajouté sur `html` (style.css, global) :
     évite le décalage horizontal remarqué en ouvrant "Devoirs faits"
     quand le contenu passe de "pas de scroll" à "scroll".

  Testé en conditions réelles pour 1, 4, 5 (jeton n.testeuse, devoir de
  test à 1 essai sur `1ere-test`, fiche-01 : validée une fois, boutons
  masqués confirmés, tooltip confirmé après rechargement) et pour 6, 7
  (compte admin temporaire, devoir de test créé/modifié/vérifié en base —
  même id après modification, devoir réel de David sur `1ere-demo` jamais
  touché). Nettoyage : une pollution de tentatives factices
  (`"ex0".."ex34"`) trouvée dans `resultats/{ficheId}` de `n.testeuse`
  pour fiche-01 pendant ce nettoyage, restée d'un test antérieur dans
  cette même session (jamais nettoyée à l'époque) — document `resultats`
  de ce couple (n.testeuse, fiche-01) supprimé entièrement plutôt que
  reconstruit à la main (compte de test jetable, pas de perte réelle).

  **Tableau de bord élève : `/mes-devoirs/` (19/09/2026, demande de
  David)** : jusque-là, le seul point d'entrée élève était le bandeau
  pleine largeur listant chaque devoir en détail. Remplacé par un bloc
  compact "Devoirs" (pilule, icône cloche) avec une pastille de
  notification — le nombre de devoirs **à faire**, affichée seulement si
  non nulle — sur les 4 mêmes pages d'entrée qu'avant
  (`assets/js/devoirs-notification.js`, entièrement réécrit). Le clic mène
  à une nouvelle page `/mes-devoirs/` (`assets/js/mes-devoirs.js`) avec
  deux listes : "À faire" (triée par échéance la plus proche, tentatives
  restantes affichées, chaque ligne est un lien direct vers la fiche ou le
  sujet blanc) et "Faits" (triée par dernière activité la plus récente,
  meilleure tentative avant l'échéance affichée — "Non rendu" si aucune —
  lignes non cliquables).

  Critère à faire/fait décidé avec David : un devoir dont les tentatives
  sont épuisées bascule "fait" **dès l'épuisement**, même si l'échéance
  court encore — "à faire" ne contient que ce qui reste réellement
  actionnable (la pastille de notification suit ce même critère). Page
  réservée à un compte élève connecté (redirige vers `/connexion/` sinon,
  même garde que `tableau-de-bord.js` côté enseignant) ; si le compte n'a
  pas de `classe` (cas d'un compte admin par erreur), message dédié plutôt
  qu'une page vide silencieuse.

  Duplication assumée avec `devoirs.js` (vue "Résultats" enseignant) pour
  le calcul de la meilleure tentative avant échéance — même logique, même
  raison de ne pas coupler (fonction triviale, voir pièges plus bas) que
  pour `formaterClasseAffichee`/`lienPour`.

  Testé en conditions réelles (jeton `n.testeuse`) avec 4 devoirs de test
  couvrant les 4 cas : à faire (actif, essais restants), épuisé mais actif
  (bascule "fait" comme prévu), passé avec note, passé jamais rendu — les
  quatre affichés correctement dans la bonne section avec le bon texte.
  Pastille confirmée (1, le seul "à faire"), absente pour un visiteur
  anonyme, page `/mes-devoirs/` confirmée redirigeant vers `/connexion/`
  sans session. Données de test supprimées après coup.

  **Mise en page à deux colonnes (19/09/2026, même jour, retour de
  David après un premier test réel)** : "À faire"/"Faits" passent de deux
  sections empilées à deux colonnes côte à côte à partir de 720px (même
  seuil que `.bento` sur l'accueil), empilées en dessous (mobile) --
  `.md-colonnes` en `flex-direction: column` par défaut, `row` au-dessus du
  seuil. Chaque colonne est une carte (fond `--gris-50`) avec un titre
  souligné dans sa couleur (accent pour "À faire", vert pour "Faits") et le
  nombre de devoirs entre parenthèses. Vérifié aux deux largeurs
  (`resize_window`, 1000px et le préréglage mobile) avec 2 devoirs à faire
  + 1 fait : colonnes côte à côte en large, empilées avec "À faire" en
  premier en étroit.
- ~~Fil d'ariane des 44 fiches de calcul à agrandir à 14px~~ — **fait le
  18/09/2026** (commit `6acd7ed`, sur le nouveau clone PC perso, une fois
  la fusion effectuée).
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
- `assets/js/suivi.js` est chargé en `<script type="module">`, donc
  **différé par nature** (comme `defer`) : un script classique placé plus
  bas dans la page peut s'exécuter AVANT que ce module ait fini de tourner
  et attaché ses fonctions sur `window`. Tout code de fiche qui a besoin de
  `window.chargerBrouillon`/`estConnecte`/etc. dès le chargement (pas
  seulement en réaction à un clic plus tard) doit attendre
  `DOMContentLoaded` avant de s'exécuter — sinon `window.X` est encore
  `undefined` au moment de l'appel.
- Dans un script Node de câblage mécanique multi-fichiers, ne jamais
  construire les chemins relatifs avec `path.join()` sur ce PC (Windows) :
  ça normalise en `\` et casse tout calcul de profondeur fait ensuite par
  `chemin.split('/')`. Toujours construire les chemins avec `/` explicite
  (template literal ou concaténation), comme pour les autres scripts de
  câblage de ce projet. A cassé une premiere tentative d'ajout de
  `nav-auth.js` sur les 44 fiches (chemin relatif faux sur toutes,
  corrigé ensuite).
- Un `style="display:...` en ligne l'emporte sur l'attribut `hidden`
  (regle du navigateur, priorite plus faible) -- pas seulement une regle
  de classe comme le piege `.tdb-onglets[hidden]` deja note plus haut, un
  style en ligne aussi. Definir le `display` par une regle de CLASSE (avec
  son `[hidden]` explicite a cote) plutot qu'en ligne des qu'un element
  doit pouvoir etre masque via `.hidden`.
- `.claude/launch.json` pointait vers un script de serveur de dev stocké
  dans le scratchpad *de session* (chemin absolu, propre à une seule
  machine/session) : cassait à chaque changement de machine ou de session.
  Corrigé le 18/09/2026 en versionnant le script dans le dépôt
  (`.claude/static-server.ps1`, chemin relatif dans `launch.json`, racine
  résolue dynamiquement via `$PSScriptRoot`) — fonctionne tel quel sur
  n'importe quel clone sans retouche.
- **Bug réel en production, signalé par David le 19/09/2026** : un élève
  tapant une réponse avec racine carrée ou fraction dans un `<math-field>`,
  qui l'enregistrait (brouillon) puis rechargeait la page, voyait le texte
  brut `sqrt(...)` au lieu du symbole √ (idem fractions : `a/b` en texte
  plutôt qu'une vraie fraction). Cause : `valeurDuChamp()` lit un math-field
  en ASCII-math (`el.getValue('ascii-math')`, ex. `"sqrt(6)"`), stocké tel
  quel dans `saisies[idx].valeur` — mais la restauration du brouillon
  réinjectait cette chaîne via l'assignation brute `input.value = ...`, qui
  interprète le texte comme du **LaTeX**, pas de l'ASCII-math : `"sqrt(6)"`
  devient donc littéralement les caractères `s q r t ( 6 )` affichés côte à
  côte. Même famille que le piège déjà noté plus haut (audit
  `checkEqualNumeric`, `"sqrt(6)"` → `"s q r t(6)"`) — pensé à l'époque
  limité à un script de test, en réalité un vrai bug de production resté
  invisible jusqu'à ce qu'un élève réel enregistre puis reprenne une fiche
  avec ce type de réponse.

  Corrigé sur **les 44 fiches** (motif mécanique identique partout, vérifié
  avant d'écrire le script) : `input.value = saisie.valeur` remplacé par
  `if (input.tagName === 'MATH-FIELD') input.setValue(saisie.valeur, {
  format: 'ascii-math' }); else input.value = saisie.valeur;` — symétrique
  de la lecture (`getValue('ascii-math')` en écriture ↔ `setValue(...,
  {format:'ascii-math'})`), sans toucher au format déjà stocké partout
  ailleurs. `preparerPourImpression()`/`restaurerApresImpression()` (export
  PDF) n'ont PAS ce bug : ils lisent/écrivent `input.value` brut de façon
  symétrique (LaTeX↔LaTeX), sans passer par `valeurDuChamp()`.

  Vérifié en conditions réelles (jeton n.testeuse, pas de compte jetable) :
  racine carrée ET fraction, chacune enregistrée puis la page rechargée
  DEUX fois de suite — round-trip LaTeX confirmé (`\sqrt6`, `\frac34`) et
  rendu visuel capturé (vrai symbole √, vraie fraction empilée). Aucune
  fiche testée manuellement au-delà du pilote (fiche-03 Seconde) : le
  correctif est mécanique et identique sur les 44, mais seul un test réel
  généralisé (comme celui qui a révélé ce bug) confirmerait l'absence de
  cas particulier.
- **Écrire un texte de remplacement accentué directement dans un script
  PowerShell (.ps1) le corrompt silencieusement** (mojibake type `Â«`,
  `â€”`) : Windows PowerShell 5.1 lit un fichier `.ps1` sans BOM UTF-8 avec
  l'encodage ANSI du système, pas UTF-8, même si le script lui-même
  écrit ensuite ses fichiers cibles avec `UTF8Encoding($false)` (ça ne
  concerne que l'écriture, pas la lecture du script source). Rencontré en
  écrivant le script d'extension du blocage aux 43 fiches (19/09/2026) :
  guillemets français et tiret cadratin tapés en dur dans le `.ps1`
  cassaient le *parsing* PowerShell lui-même (jetons inattendus). Corrigé
  en ne tapant plus AUCUN caractère accentué dans le script : tout texte
  de remplacement contenant des accents/guillemets est extrait
  dynamiquement (`.IndexOf`/`.Substring`) depuis un fichier de référence
  déjà correctement encodé (ici fiche-01.html/fiche-02.html, lus via
  `[System.IO.File]::ReadAllText($chemin, $utf8)`), en bornant l'extraction
  par des ancres ASCII uniquement.
- Un `ficheId` de devoir doit avoir le **même format que
  `window.location.pathname`**, donc avec la barre oblique initiale
  (`/cahiers/premiere/...`, pas `cahiers/premiere/...`) — c'est ce que
  produit `ficheIdDepuis()` dans `manifeste-fiches.js`, utilisé par le vrai
  outil d'attribution. Un devoir de test créé à la main (script Firestore
  direct plutôt que l'UI) avec un `ficheId` sans la barre initiale ne sera
  simplement jamais trouvé par `devoirsPour()` côté fiche — aucune erreur,
  le devoir est juste invisible. Piège symétrique côté automatismes : le
  champ `niveau` d'un devoir doit être un **nombre**, pas une chaîne
  (`parseInt(selectNiveau.value, 10)` côté `devoirs.js`, et
  `ETAT.niveau` côté `moteur.js` est également numérique) — une requête
  Firestore `where('niveau', '==', ...)` est stricte sur le type, `2` et
  `"2"` ne matchent jamais le même document.
- `formaterClasseAffichee(classe)` (dupliquée dans `devoirs.js` et
  `tableau-de-bord.js`, jamais importée — voir piège d'origine) affichait
  seulement ce qui suit le DERNIER `-` d'une classe (`2nde-207` -> `207`).
  Pour un groupe de spécialité (`1ere-Gr 1`), ça donnait juste "Gr 1" —
  ambigu dès que des groupes de Terminale existeront aussi (leur "Gr 1" à
  eux serait indiscernable). Corrigé le 19/09/2026 : si le suffixe commence
  par `Gr`, le niveau est préfixé devant (`1ere - Gr 1`) ; sinon
  comportement inchangé (`207`, `demo`, `test`...).
- **Pièges rencontrés le 22/09/2026 en retravaillant les arbres pondérés SVG
  des fiches 19 (Seconde `cahiers/seconde/cahier-7/`, Première
  `cahiers/premiere/cahier-6/`)**, hors suivi Firebase à proprement parler
  mais utiles à toute fiche avec figure SVG maison :
  - Une figure partagée par tout un groupe de questions (affichée une seule
    fois via un champ `contexteFigure`, plutôt que redessinée dans chaque
    carte — voir `remplirIntrosGroupes()` côté Seconde) n'est PAS couverte
    par l'appel à `activerZoomSvg(grille)` fait pour la grille de questions
    elle-même : le zoom au clic restait silencieusement inactif sur ces
    figures-là. Il faut un appel dédié `activerZoomSvg(introDiv)` sur le
    conteneur de la figure partagée.
  - Agrandir une figure SVG en la marquant `svg-grande-figure` (classe
    pensée pour les graphiques de courbes, `max-width:100% !important`)
    l'étire à TOUTE la largeur de sa carte si l'élément a par ailleurs
    `.qcm-svg { width:100% }` (cas général) — un arbre pensé pour ~380px de
    large se retrouvait à 800px. Les arbres pondérés utilisent un mécanisme
    différent et plus simple : un style inline `max-width:380px` directement
    sur le `<svg>` (voir `svgArbrePondere`/`genererSVGArbre`), qui n'a pas
    ce problème car un style inline a la priorité sur `width:100%`.
  - Une fraction affichée sur une branche d'arbre ne doit pas être dessinée
    "à la main" en SVG (`<text>` empilés + `<line>` pour la barre) : illisible,
    surtout une fois zoomée. Utiliser un `<foreignObject>` contenant un `<div>`
    avec du LaTeX (`\(\dfrac{a}{b}\)`), puis appeler
    `MathJax.typesetPromise([...])` juste après avoir inséré le HTML dans le
    DOM — le foreignObject vit dans les mêmes coordonnées que le reste du
    SVG, donc suit son redimensionnement responsive sans calcul séparé.
  - Une étiquette de probabilité décalée seulement VERTICALEMENT par rapport
    au milieu de sa branche (au lieu d'un décalage perpendiculaire à la
    branche) ne dégage pas assez une branche pentue : la ligne finit par
    traverser le texte (repéré sur un arbre à 3 branches initiales, plus
    pentues qu'à 2). Calculer le décalage perpendiculairement à la direction
    réelle de la ligne réglait le problème quelle que soit la pente.

## Procédure de reprise sur une autre machine

Depuis le 18/09/2026, chaque machine a son propre clone local hors Drive
(voir "Avant toute chose" en tête de page) — plus de montage Drive-synced
à vérifier, juste un `git pull` classique.

1. Vérifier si un clone local existe déjà pour ce projet sur cette machine
   (PC pro : `C:\Users\David\Documents\siteCahierCalcul`. PC perso : chemin
   à choisir hors Drive lors de la première reprise là-bas, puis à noter ici).
   - S'il existe : `cd` dedans, `git status` (rien ne doit traîner), puis
     `git checkout master && git pull`.
   - S'il n'existe pas encore sur cette machine :
     `git clone https://github.com/dmarec146/dmarec146.github.io.git <chemin-hors-drive>`
     (déjà sur `master` par défaut après clonage).
2. Lire l'artifact **"Cahier de suivi"** (action `list` des artifacts) pour
   le contexte et les choix de conception du projet.
3. Serveur de dev local : `.claude/launch.json` référence
   `.claude/static-server.ps1` en chemin relatif — les deux sont suivis par
   git, donc ça fonctionne tel quel sur n'importe quel clone, plus besoin de
   corriger un chemin en dur par machine (piège rencontré le 17/09/2026,
   éliminé le 18/09/2026 en sortant le script du scratchpad de session pour
   le verser dans le dépôt).
4. Pour utiliser `outils/creer-comptes` ou `outils/etiquettes` : `npm install`
   dans chaque dossier, et vérifier que `outils/creer-comptes/service-account.json`
   est présent (sinon le retélécharger depuis Console Firebase → Paramètres
   du projet → Comptes de service). Ce fichier (et les CSV/PDF générés) ne
   sont jamais suivis par git, et depuis l'abandon du montage Drive ne
   voyagent plus automatiquement d'une machine à l'autre : à recopier
   manuellement sur chaque nouveau clone, ou à régénérer/retélécharger.
