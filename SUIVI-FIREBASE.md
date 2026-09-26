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
- Élève hors classe (23/09/2026) : `e.marec` (Ewenn Marec), compte réel
  (pas un compte de démonstration), sans champ `classe` dans Firestore :
  rattaché à aucun niveau, travaille sur tous. Tableau de bord : groupe
  « Hors classe », onglets cahiers ET automatismes (`estHorsClasse` dans
  `tableau-de-bord.js`). Créé avec `creer-comptes.js`, qui accepte désormais
  une valeur de classe vide.

  **Attribution de devoir à un élève hors classe, corrigée le 24/09/2026**
  (David : Ewenn n'apparaissait pas dans la liste des classes au moment
  d'attribuer un devoir). Cause : un devoir vise toujours une `classe`
  (`where('classe','==', ...)`), et `e.marec` n'a précisément AUCUN champ
  `classe` — invisible à la fois dans `classesConnues()` (`devoirs.js`, qui
  ignorait toute classe vide) et dans `classeEleve()` (`suivi.js`, qui
  renvoyait `null` pour un élève hors classe, avec un garde `if (!classe)
  return` dans chaque fonction de suivi des devoirs). Corrigé en introduisant
  une valeur sentinelle `"hors-classe"` — écrite UNIQUEMENT côté client
  (jamais dans le document `eleves/{uid}` lui-même, qui reste sans champ
  `classe` comme prévu) : `classeEleve()` la renvoie désormais à la place de
  `null`, `classesConnues()` l'ajoute à la liste dès qu'au moins un élève est
  hors classe, et la vue résultats d'un devoir "Hors classe" interroge tous
  les élèves puis filtre côté client sur l'absence du champ (`where('classe',
  '==', 'hors-classe')` ne trouverait jamais personne, aucun document n'a
  littéralement cette valeur). Aucune règle Firestore à republier (la règle
  `devoirs` autorise déjà toute lecture connectée).

  **Au passage, même demande étendue aux Secondes** : la Seconde a déjà
  accès sans restriction technique à `automatismes/premiere/` (fiches et
  sujet blanc — aucune garde de classe n'existe sur ces pages), mais
  `devoirs.js` ne proposait que les classes de Première dans le select
  "Classe" pour un devoir de type "Sujet blanc d'automatismes" (filtre
  `estPremiere` retiré), et le tableau de bord n'affichait l'onglet
  Automatismes que pour la Première/hors-classe (`estSeconde` ajouté à la
  condition dans `tableau-de-bord.js`). Un élève de Seconde qui a déjà fait
  des sujets blancs verra donc directement son suivi apparaître (les
  données étaient déjà enregistrées et remontées, seul l'affichage était
  masqué).

  **Ciblage individuel au sein de "Hors classe" (24/09/2026)**, sur demande
  de David : le groupe hors classe peut mélanger des élèves de niveaux
  différents qui n'ont en commun que l'absence de `classe` — vouloir
  attribuer un devoir à un sous-ensemble précis plutôt qu'à tout le groupe
  d'office. Nouveau champ optionnel `eleves` (tableau d'uid) sur un devoir
  `classe:"hors-classe"` : absent = s'applique à tout le groupe, comportement
  inchangé (devoirs créés avant ce chantier). `devoirs.html`/`devoirs.js` :
  case à cocher par élève hors classe (`dev-champ-eleves`), affichée
  seulement pour cette classe, tout coché par défaut (`classesConnues()`
  collecte maintenant aussi la liste des élèves hors classe en même temps que
  la détection de la sentinelle, un seul passage sur `eleves`). Au moins un
  élève coché exigé à la soumission. En modification, la case bascule sur
  `devoir.eleves` existant ; si la classe est changée pour une vraie classe,
  `eleves` est explicitement effacé (`deleteField()`) plutôt que laissé
  traîner.

  Toute la chaîne de lecture mise à jour en conséquence, puisque Firestore ne
  peut pas filtrer "uid dans ce tableau" en `where()` combiné aux autres
  filtres déjà utilisés — filtre côté client après coup partout où la
  collection `devoirs` est interrogée pour une classe : `suivi.js`
  (`applicablePourEleve()`, appliqué dans `devoirsPour`,
  `devoirsPourAutomatisme`, `devoirAutomatismeActif` — un devoir sans `eleves`
  reste applicable à tout le monde), vue résultats de `devoirs.js`, et **au
  passage** `devoirs-notification.js`/`mes-devoirs.js` : ces deux-là lisaient
  `classe` brute sans la sentinelle `"hors-classe"` (bug préexistant, pas
  découvert avant faute de test réel sur un élève hors classe) — un élève
  hors classe n'a donc jamais vu le bloc "Devoirs" ni pu ouvrir
  `/mes-devoirs/` jusqu'ici (`classe` restant `null` pour lui), même si son
  suivi/blocage sur la fiche elle-même fonctionnait déjà via `suivi.js`.
  Corrigé en appliquant la même sentinelle + le même filtre `eleves` aux deux.

  **Les trois correctifs ci-dessus testés en conditions réelles le
  24/09/2026**, une fois `service-account.json` et `npm install` en place sur
  ce PC pro (voir "Procédure de reprise" plus bas) : comptes jetables créés
  via `creer-comptes.js` (un compte enseignant temporaire, deux élèves hors
  classe `c.horsun`/`c.horsdeux`, un élève `2nde-test`), pilotés dans le
  navigateur intégré, tout supprimé après coup (comptes Auth, profils
  Firestore, les deux devoirs de test — vérifié par un comptage
  `eleves`/`devoirs` avant/après, identique, et `e.marec` relu intact).
  Vérifié : le select "Classe" de `devoirs.html` propose bien "Hors classe"
  et les classes de Seconde pour un devoir d'automatismes ; un devoir "Hors
  classe" ciblant uniquement `c.horsun` (case décochée pour `c.horsdeux` et
  pour `e.marec`, le vrai compte hors classe, volontairement non touché)
  n'apparaît que dans son `/mes-devoirs/` et sa vue résultats, pas dans ceux
  de `c.horsdeux` ; le bloc "Devoirs"/`/mes-devoirs/` fonctionne désormais
  pour un élève hors classe (confirmé les 3 devoirs "Hors classe" existants
  + le devoir ciblé, 4 au total pour `c.horsun`, 3 pour `c.horsdeux` sans le
  ciblé) ; un devoir d'automatismes attribué à `2nde-test` apparaît dans son
  `/mes-devoirs/` et verrouille bien `sujet-blanc.html` sur le niveau/mode/
  durée choisis à l'attribution ("Devoir en cours — niveau et mode
  imposés").
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

  **Tableau de bord enseignant `devoirs.html` : trois listes au lieu de deux
  (24/09/2026)**, sur demande de David : la liste "Devoirs attribués"
  mélangeait tout (actifs et terminés) avec une colonne "Statut" pour les
  distinguer — remplacée par deux listes séparées, chacune derrière son
  propre bouton (troisième carte pleine couleur, gris `--gris-700`, entre
  "Attribuer un devoir" et "Devoirs faits") : "Devoirs en cours" (triée par
  échéance la plus proche) et "Devoirs faits" (triée par échéance la plus
  récente). Colonne "Statut" retirée (devenue redondante une fois les deux
  listes séparées) ; titre de chaque section complété du nombre de devoirs
  (`Devoirs en cours (3)`), même principe que `/mes-devoirs/` côté élève.
  `basculerPanneau()` généralisé de deux à trois panneaux mutuellement
  exclusifs (`PANNEAUX`, `ouvrirPanneau()`/`fermerTousLesPanneaux()`), et la
  construction d'une ligne de tableau factorisée (`construireLigneDevoir()`,
  `remplirTableauDevoirs()`) puisque les deux listes partagent exactement la
  même mécanique d'affichage. Vérifié avec un compte enseignant temporaire :
  bascule bien mutuellement exclusive entre les trois panneaux (dont
  "Modifier" depuis "Devoirs faits", qui rouvre correctement le formulaire
  d'attribution seul), comptes (3)/(5) corrects sur les 8 devoirs réels
  existants, plus aucune colonne Statut. Compte supprimé après coup, aucune
  donnée Firestore touchée (juste de la lecture/navigation).

  **Suppression groupée des devoirs faits (24/09/2026, même jour)**, sur
  demande de David, en plus de la suppression individuelle déjà existante :
  bouton "Tout supprimer" (`dev-bouton-supprimer-tous-faits`, rouge, même
  style que "Supprimer") dans l'en-tête de la liste "Devoirs faits"
  (`.dev-panneau-entete`, titre + bouton côte à côte), masqué si la liste est
  vide. Cible exactement `devoirsFaitsActuels` — les devoirs faits
  *actuellement affichés* (retenus par `chargerListeDevoirs()` en même temps
  que le rendu du tableau), confirmation `confirm()` avec le nombre exact
  avant suppression, un seul `Promise.all` de `deleteDoc()` (même principe
  que la suppression individuelle). Erreur affichée par `alert()` plutôt que
  `zoneErreurFormulaire` (qui vit dans le panneau d'attribution, invisible
  depuis ce panneau-ci). Vérifié avec un compte enseignant temporaire : deux
  devoirs de test jetables créés directement en base (échéance passée,
  classe `9999-test-bulk`, sans rapport avec les vraies classes), message de
  confirmation exact capturé (`Supprimer les 7 devoirs faits ?`, en comptant
  les 5 vrais devoirs de démo `1ere-demo` du 19/09 déjà présents),
  annulation testée sans effet — les deux devoirs de test supprimés
  directement plutôt que par le bouton, pour ne pas risquer de supprimer les
  5 vrais par la même occasion (le bouton n'a pas de sélection fine, il vide
  toute la liste "faits" d'un coup, comme demandé). Compte de test et
  documents de test supprimés après coup, compte revenu à 8 devoirs/5 faits.
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
- **Renuméroter/renommer une fiche change son `ficheId`** (= chemin du
  fichier) : brouillons, résultats, tentatives et devoirs restent attachés à
  l'ANCIEN chemin — et si ce chemin est réutilisé par une autre fiche, ils
  s'y rattachent à tort. Cas du 23/09/2026 : insertion de la fiche Seconde
  16 « Fonctions affines », fiches 16-22 renommées 17-23. Aucun élève réel
  n'avait encore d'identifiants ; seuls 6 documents `tentatives` de
  `l.testeur` visaient les anciens chemins, supprimés (aucun brouillon,
  résultat ni devoir concerné). Avant toute future renumérotation avec des
  élèves actifs : prévoir une migration des documents vers les nouveaux
  identifiants. Le manifeste des devoirs (`assets/js/manifeste-fiches.js`)
  a été complété le même jour avec les cahiers 6 à 8 de Seconde, puis la
  fiche 25 le 24/09 (52 fiches en tout) : à tenir à jour à chaque nouvelle
  fiche (la fiche 24, pas encore construite, devra y être ajoutée).
- **Un correctif peut rester oublié sur la branche d'une ancienne session
  Claude** (`.claude/worktrees/...`, branche `claude/...`) : cas repéré le
  24/09/2026 sur PC perso — l'échappement du « < » dans les réponses de
  comparaison de fonctions (« f(a)<f(b) » cassait le panneau « Voir toutes
  les réponses », les lignes suivantes disparaissant dans une balise
  fantôme), fait le 19/09 sur les fiches Seconde 14/15/16, n'avait jamais
  été fusionné dans `master`. Refait sur les 11 fiches Seconde 14 à 25 qui
  partagent ce code (seules 14 et 17 génèrent réellement des comparaisons,
  les autres par prévention), vérifié dans le navigateur, branche et
  worktree supprimés. À l'ouverture d'une session, `git branch -a` doit
  être lu jusqu'au bout : une branche `claude/...` locale = travail
  peut-être non fusionné, à vérifier avec `git cherry -v master <branche>`.
- **Réduire le nombre de questions d'un calcul change les identifiants de
  sous-questions qui suivent (même `ficheId`, piège voisin de celui
  ci-dessus)** : `resultats/{ficheId}.exercicesReussis` retient des chaînes
  comme `"1.1 e)"` (voir `ex.id`), attribuées par POSITION dans le groupe
  (`lettresEtendues[pos]`), pas par contenu. Cas du 24/09/2026 : fiche 1 de
  Première (cahier 1), calculs 1.1 à 1.4 ramenés de 6 à 4 questions chacun
  (David : fiches de Première trop longues) — les questions gardées ont été
  renommées a/b/c/d pour rester alignées avec leur nouvelle position
  affichée à l'écran (ex. l'ancienne `"1.2 e)"` devient `"1.2 d)"`). Un élève
  ayant déjà réussi une sous-question depuis supprimée ou renommée perd
  silencieusement ce crédit dans `exercicesReussis` (aucune erreur, juste un
  identifiant qui ne correspond plus à rien) — sans conséquence grave (le
  score se recalcule normalement dès la prochaine validation), mais à
  garder en tête si un score affiché semble reculer après une refonte de ce
  type sur une fiche déjà utilisée par de vrais élèves. **Confirmé par
  David le 24/09/2026 : aucun élève n'a encore travaillé sur les fiches de
  Première** — ce piège reste décrit ici pour le jour où ce ne sera plus le
  cas, mais sans risque réel pour l'instant.

- **Refonte des fiches de Première jugées trop longues, méthode à
  appliquer systématiquement (David, 24/09/2026)** : sur demande explicite
  de David (« bon travail d'analyse, fais-le à chaque fois »), toute
  réduction du nombre de questions d'un calcul doit être justifiée, pas
  un simple découpage au hasard — repérer si le groupe de questions
  d'origine relève d'un seul gradient de difficulté (garder un cas
  classique + un cas délicat testant une seule difficulté supplémentaire
  à la fois, écarter les cas qui cumulaient plusieurs difficultés en même
  temps) ou de plusieurs familles de compétences distinctes (garder un
  représentant de chaque famille plutôt que de risquer d'en perdre une
  entière), et documenter ce choix ici à chaque fois.

  Fiche 1 de Première (cahier 1) — **1.1 à 1.4 ramenées de 6 à 4
  questions chacune** (24/09/2026) : 1.1 (développer un carré, gradient
  simple) garde 2 classiques (entiers) + 2 délicates (une racine seule,
  une fraction seule), retire les 2 cas qui cumulaient deux difficultés à
  la fois (double racine, double fraction). 1.2 (factoriser, 2 familles :
  différence de carrés / carré parfait) garde un classique + un délicat
  dans chaque famille. 1.3 (résoudre x²=a, 2 familles : carré nul /
  ax²=b) même principe, retire aussi le cas x²=0 trop élémentaire pour
  rester utile seul. 1.4 (forme canonique → développée, gradient simple)
  garde le cas le plus simple (coefficient 1) et un cas à coefficient
  explicite comme classiques, un cas radical et un cas fractionnaire
  comme délicats, retire les deux versions qui cumulaient négatif,
  fraction et parfois racine à la fois.

  **1.6 à 1.9 ramenées à 2 questions chacune** (même jour, sur demande
  explicite de David). 1.6 (coefficient dominant entier, 4 items
  identiques au tirage près) : plutôt que de piocher 2 lettres au hasard
  (risque de tomber deux fois sur le même signe), le tirage impose
  désormais un coefficient positif pour la classique et un négatif pour
  la délicate — la seule vraie source de difficulté ici. 1.7 (coefficient
  dominant fractionnaire, 6 items) : gardé l'ancien b) (seul le
  coefficient dominant est une fraction, le reste simple — classique) et
  l'ancien f) (coefficient dominant, linéaire et constante tous
  fractionnaires et négatifs — délicat) ; retiré a) qui ne testait pas
  vraiment un coefficient fractionnaire (encore égal à 1, déjà couvert
  par 1.5/1.6) et les cas intermédiaires c/d/e, redondants entre b) et
  f). 1.8 (position du paramètre λ, 3 familles distinctes — λ constante,
  λ coefficient de x, λ coefficient de x²) : gardé les deux qui
  introduisent une vraie nouvelle technique (λ au carré dans β, puis λ au
  dénominateur — d'où le « λ ∈ ℝ* » du titre), retiré le cas où λ n'est
  qu'une constante additive qui ne change rien à la méthode. 1.9 (même
  idée que 1.8 mais λ toujours dans le coefficient de x, 3 items) : gardé
  a) (classique, coefficient dominant entier, λ apparaît une seule fois)
  et b) (délicat, coefficient dominant fractionnaire, λ apparaît deux
  fois — dans le coefficient de x ET dans la constante), retiré le cas
  intermédiaire c), redondant avec les deux gardés.

  Vérifié à chaque étape sur 20 régénérations aléatoires (auto-cohérence
  des réponses face à leur propre correcteur) et dans le vrai navigateur,
  aucune erreur console. Fiche passée de 53 à 37 questions au total.

  **1.14 ramenée de 4 à 2 questions** (même jour) : l'ancien b) était un
  duplicata exact de a) (même fonction génératrice `seuilConstant`, seule
  la variable changeait de nom — aucune difficulté supplémentaire), retiré
  sans hésiter. Gardées : a) (classique, comparaison directe d'une
  expression quadratique à une constante) et l'ancien c) (délicat,
  comparaison à une AUTRE expression quadratique — il faut regrouper avant
  de compléter le carré). Retirée aussi l'ancienne d) (regroupement +
  coefficient fractionnaire + comparaison à un terme linéaire — cumulait
  trois difficultés à la fois plutôt que d'en isoler une seule ; le
  regroupement est déjà couvert par c), les fractions par 1.7/1.9). Vérifié
  sur 20 régénérations, aucune erreur. Fiche passée à 35 questions au total.

  **Fiche 2 de Première (cahier 1) — fusions de calculs (24/09/2026)**, sur
  demande explicite de David (fusionner deux calculs proches en un seul, en
  gardant un nombre d'exemples réduit) :

  **2.5 « Premières racines » + 2.6 « Calculs de racines » → un seul 2.5
  « Calculs de racines », 4 exemples.** Deux familles de compétences (racines
  irrationnelles via discriminant surd, racines rationnelles via Vieta) plus
  un cas exotique (coefficient linéaire lui-même un surd) : gardé a) classique
  (A=1, surd) et b) délicat de la même famille (coefficient dominant entier
  plus grand, calculs plus lourds), c) délicat famille distincte (racines
  fractionnaires via Vieta, coefficient dominant fractionnaire) et d)
  délicat/exotique famille distincte (coefficient de x lui-même un surd).
  Écartés : l'ancien 2.5 b) (simple inversion de signe de a), aucune
  difficulté supplémentaire) et l'ancien 2.6 b) (racines rationnelles
  entières via Vieta, même technique que c) en plus simple, subsumé par lui).

  **2.10 « Inéquations (I) » + 2.11 « Inéquations (II) » → un seul 2.9
  « Inéquations », 4 exemples** (renuméroté 2.9 du fait de la fusion
  précédente). Gardé a) classique (deux racines, coefficient dominant
  positif, extérieur, forme directe), b) délicat famille distincte
  (intervalle borné, coefficient dominant 1), c) délicat même famille que a)
  (coefficient dominant négatif — même résultat extérieur mais il faut gérer
  le changement de sens) et d) délicat famille distincte (aucune racine
  réelle, « jamais vrai »). Écartés : l'ancien 2.11 a) (extérieur, même
  résultat que a)/c), simple variante de réécriture nécessitant un
  réarrangement) et l'ancien 2.11 b) (« toujours vrai », même famille que d)
  mais cas symétrique moins délicat pour un élève).

  **2.13 « Propositions paramétrées (II) » ramenée à 1 seul exemple**
  (renumérotée 2.11). Gardé le seul cas où le paramètre apparaît à la fois
  dans le coefficient linéaire ET la constante, avec un résultat non trivial
  (intervalle borné incluant 0) — le plus complet des trois. Écartés : le cas
  dégénéré « toujours aucune » (ne teste pas vraiment la technique du
  discriminant paramétré) et le cas où le résultat est une demi-droite non
  bornée (moins complet, même idée que le cas gardé).

  Fiche passée de 14 à 12 groupes de calcul, 40 à 34 questions au total. Tous
  les groupes intermédiaires renumérotés en conséquence (2.7→2.6, 2.8→2.7,
  2.9→2.8, 2.12→2.10, 2.14→2.12), y compris les trois calculs à paramètre
  partagé (2.6/2.7/2.8, textes dynamiques via `mettreAJourTextesAvances`).
  Vérifié : syntaxe des deux blocs `<script>` (`vm.Script`), 500 tirages
  auto-cohérents contre leur propre correcteur (`checkEqualNumeric`/
  `checkEnsemble` appelés directement, sans passer par le DOM — même
  précaution que l'audit `checkEqualNumeric` déjà documenté plus haut), 1000
  tirages de validité structurelle des `intervalleSpec`, et un cycle complet
  dans le navigateur (saisie de la bonne réponse dans chaque champ réel via
  MathLive, `verifierUne()`, 34/34 correctes) — comparé au même test sur
  l'ancienne fiche (40/40, mêmes échecs isolés dus à un piège déjà connu de
  MathLive avec les racines/fractions en LaTeX, voir plus bas, donc pas une
  régression). « Voir toutes les réponses » vérifié également (34/34 lignes,
  aucune erreur MathJax).

  **Fiche 3 de Première (cahier 1) — fusions de calculs (24/09/2026)**, sur
  demande explicite de David, qui pose au passage une **règle standing pour
  toutes les fiches de Première à venir : la section « Quelques automatismes »
  se limite à 6 questions au total** (David : « juste 6 automatismes »),
  quelle que soit la répartition entre les deux calculs qui la composent.

  **3.1 (4→2 questions).** Les 4 items étaient produits par la même fonction
  appelée 4 fois (mêmes coefficients aléatoires, même gabarit d'inéquation
  simple) : aucune famille distincte à perdre, réduit sans arbitrage.
  **3.2 laissée à 4 questions** : contrairement à 3.1, ses 4 items sont 4
  compétences bien distinctes (arithmétique pure des exposants ; ratio
  algébrique avec un exposant n ; factorisation d'une combinaison type suite
  géométrique ; même idée avec signes alternés, plus délicate) — aucune n'est
  redondante avec une autre, toutes gardées. Total automatismes : 2+4 = 6.

  **3.3 « Factoriser les trinômes suivants » + 3.4 + 3.5 → un seul 3.3, 6
  exemples** (les 3 groupes portaient déjà le même titre générique). a)
  classique (coefficient dominant 1, racines entières) ; b) délicat même
  famille (racines fractionnaires propres, toujours coefficient 1, ex 3.4) ;
  c) délicat famille distincte (coefficient dominant non entier, racines
  rationnelles de dénominateur lié au coefficient, ex 3.3 original) ; d)
  délicat famille distincte (racines irrationnelles via centre entier + rayon
  surd, ex 3.5) ; e) délicat plus exotique (le centre lui-même est un surd,
  ex 3.5) ; f) délicat le plus complet (coefficient dominant non entier ET
  racines irrationnelles à la fois, ex 3.5). Écarté le doublon de 3.3 (la
  même fonction « racines entières » était déjà appelée deux fois dans
  l'original, aucune difficulté supplémentaire).

  **3.6 « Factorisation avec un paramètre m » (4→2 exemples)** (renumérotée
  3.4 du fait des fusions précédentes). Gardé a) classique (racines
  linéaires en m, factorisation directe) et b) délicat de famille distincte
  (différence de deux carrés faisant apparaître √D·m). Écartés c) (cas non
  monique asymétrique, moins central pour ce calcul) et d) (même famille que
  b mais plus complexe, redondant avec lui).

  **3.7 à 3.10 « Résoudre dans ℝ... » (2×4→1×4 exemples)** (renumérotées 3.5
  à 3.8). Chaque groupe gardait déjà 2 exemples testant la même technique
  sous deux formes : un seul gardé par groupe, celui qui teste le plus
  complètement la technique visée (voir raisons dans le code) — pour 3.7 et
  3.9, le cas qui filtre explicitement les racines invalides après élévation
  au carré (réflexe essentiel sur les équations avec racine carrée, l'autre
  variante n'a par construction qu'une solution valide) ; pour 3.8, le cas
  qui combine deux fractions plutôt qu'une seule ; pour 3.10, même logique
  que 3.7/3.9 mais appliquée à la substitution \(u=\sqrt{x}\). Convention
  déjà en place pour un groupe à un seul exemple (voir 3.16/3.17 devenus
  3.13/3.14) : identifiant sans lettre.

  **3.14 « Une équation bicarrée » + 3.15 « Équations bicarrées » → un seul
  3.12, 2 exemples** (renumérotée du fait des fusions précédentes).
  L'ancienne version guidée de 3.14 (3 sous-questions : substitution
  \(y=x^2\), factoriser, conclure) est abandonnée — redondante avec le
  format guidé déjà utilisé ailleurs dans la fiche (3.9/3.10 sur la
  factorisation de degré 3) et incompatible avec une seule grille homogène à
  2 exemples. Gardé le format direct de l'ancien 3.15 (deux équations
  bicarrées résolues directement), qui a déjà un gradient naturel intégré
  (le premier facteur \(Y_1\) est toujours positif donc donne toujours deux
  racines réelles, le second \(Y_2\) est de signe aléatoire donc l'équation
  a parfois 4 solutions, parfois seulement 2).

  Fiche passée de 17 à 14 groupes, 47 à 30 questions au total. Toutes les
  clés de `FORMES_FACTORISEES` (exigence de réponse sous forme de produit)
  renumérotées en conséquence. `lettresEtendues` (utilisé pour l'affichage
  a)/b)/c)... de chaque question dans son groupe) élargi de 4 à 6 lettres
  — **piège découvert pendant la vérification** : resté à `["a","b","c","d"]`
  après la fusion, les questions e) et f) du nouveau 3.3 s'affichaient sans
  aucune lettre (chaîne vide, `lettresEtendues[pos] || ''`) plutôt que de
  planter — silencieux, à vérifier systématiquement dès qu'un groupe dépasse
  4 exemples après une fusion. Vérifié : syntaxe, 500 tirages auto-cohérents,
  cycle complet dans le navigateur (30/30, mêmes échecs isolés que
  l'original — piège MathLive déjà documenté — donc pas de régression),
  panneau « Voir toutes les réponses » (30/30 lignes, aucune erreur MathJax),
  et exigence de forme factorisée vérifiée sur les bons groupes après
  renumérotation (3.3, 3.4, 3.9 b)/c), 3.10 b)/c), 3.11).

  **Même jour, retour de David : 3.5 à 3.8 avaient exactement le même
  énoncé de groupe** (« Résoudre dans ℝ les équations suivantes. »), quatre
  sections consécutives à une seule question chacune plutôt qu'une seule
  section à quatre questions — pas une fusion de contenu cette fois (les 4
  exemples restent tels quels, un par technique), juste un regroupement
  visuel dans une seule grille a)/b)/c)/d), conforme à la règle « une
  consigne répétée ne se répète pas, elle se factorise » déjà en place sur
  le reste du site. Fiche passée de 14 à 11 groupes, toujours 30 questions
  (aucune question perdue ni ajoutée cette fois). Groupes suivants
  renumérotés en conséquence (3.9→3.6, 3.10→3.7, 3.11→3.8, 3.12→3.9,
  3.13→3.10, 3.14→3.11), `FORMES_FACTORISEES` mise à jour. Vérifié comme
  les fusions précédentes : syntaxe, 500 tirages auto-cohérents, cycle
  complet dans le navigateur (30/30, mêmes échecs isolés déjà connus),
  panneau « Voir toutes les réponses » (30/30, aucune erreur MathJax),
  capture d'écran confirmant le rendu visuel (une seule section, 4
  questions a)-d) côte à côte).

  **Même jour, même principe étendu à 3.9-3.10-3.11** : « Équations
  bicarrées » (2 exemples), « Écart entre les deux racines (I) » et « (II) »
  (1 exemple chacun) — 4 exemples au total, David demande de « garder 4
  exemples » en les regroupant en une seule section, malgré des titres
  différents cette fois (pas la répétition à l'identique de 3.5-3.8) : deux
  sujets mathématiques distincts (équations bicarrées / écart entre les
  racines d'un trinôme paramétré) réunis sous un titre composite « Équations
  bicarrées, écart entre les deux racines. ». Contenu inchangé, juste
  regroupé en a)/b)/c)/d) dans une seule grille. `genGroupe3_10_11`
  (fonction partagée, devenue inutile après la fusion) supprimée plutôt que
  laissée morte dans le fichier. Fiche passée de 11 à 9 groupes, toujours 30
  questions.

  **Bug trouvé et corrigé au passage, introduit par la fusion précédente
  (3.5-3.8) et resté invisible jusqu'ici** : `fmtConst3` et
  `unBiquadratique` étaient chacune déclarées DEUX FOIS dans le fichier
  (copier-coller en trop lors de l'assemblage du script de fusion). Une
  redéclaration de fonction en JavaScript n'est pas une erreur de syntaxe
  (la seconde écrase silencieusement la première, sans changer son
  comportement puisque les deux étaient identiques) — donc invisible à la
  vérification `vm.Script` et aux tests fonctionnels, qui portent sur le
  comportement, pas sur la présence de code mort. Repéré seulement en
  relisant la zone du fichier à la main pendant ce chantier suivant, pas par
  un test automatisé. **Leçon retenue** : après un script de fusion qui
  réassemble des blocs de fonctions extraits indépendamment, relire le
  fichier obtenu (pas seulement le tester) pour repérer une déclaration
  dupliquée — aucun outil de vérification utilisé jusqu'ici (syntaxe,
  tirages auto-cohérents, cycle navigateur) ne l'aurait signalée. Corrigé en
  supprimant le doublon des deux fonctions.

  Vérifié comme les fusions précédentes : syntaxe, 500 tirages
  auto-cohérents, cycle complet dans le navigateur (30/30, mêmes échecs
  isolés déjà connus), panneau « Voir toutes les réponses » (30/30, aucune
  erreur MathJax), capture d'écran du rendu visuel.

  **Même jour, retour de David : 3.3 (6 exemples) ramenée à 4.** Gardé a)
  classique (racines entières) ; b) délicat famille distincte (coefficient
  dominant non entier, racines rationnelles, ex-c) ; c) délicat famille
  distincte (racines irrationnelles, centre entier, ex-d) ; d) délicat le
  plus complet (non monique ET racines irrationnelles, ex-f). Écartés
  l'ancien b) (racines fractionnaires propres, redondant avec a) — même
  famille, aucune difficulté supplémentaire par rapport à un simple
  changement de forme du résultat) et l'ancien e) (centre lui-même un surd,
  redondant avec c) — même famille, variante plus exotique mais pas plus
  instructive). Fiche passée de 30 à 28 questions. Vérifié comme les
  fusions précédentes : syntaxe, 500 tirages auto-cohérents, cycle complet
  dans le navigateur (28/28), panneau « Voir toutes les réponses » (28/28,
  aucune erreur MathJax), exigence de forme factorisée toujours correcte
  sur 3.3 a) à d).

  **Fiche 4 de Première (cahier 1) — simplification complète (24/09/2026),
  David pose deux nouvelles règles standing pour toute fiche future**
  (⚠️ **règles 2 et 4 ci-dessous corrigées le jour même par David
  lui-même — « tu n'as pas compris » — voir l'entrée « Correction
  immédiate » plus bas, qui les remplace ; ne pas appliquer la version
  d'origine décrite dans ce paragraphe, gardée seulement pour l'historique**) :

  1. **Automatismes : 6 questions au total, réparties intelligemment**
  entre les calculs qui composent la section — pas un partage égal par
  défaut. Sur cette fiche : 4.1 (calcul numérique fraction) 6→4, 4.2
  (systèmes) reste à 2 — 4.1 avait un vrai gradient de difficulté
  exploitable (simple soustraction → distribution → carré → cube), 4.2
  n'avait que 2 exemples déjà distincts (système 2×2 puis 3×3), rien à
  couper. **(Cette règle 1 reste valable, seules les règles 2 et 4 ont été
  corrigées.)**
  2. ~~Quand plusieurs groupes partagent le même énoncé distingué
  seulement par (I), (II), (III)..., garder au maximum 2 exemples de
  CHAQUE groupe (pas une fusion en une seule section comme pour un
  énoncé strictement identique sans numérotation — voir plus haut le cas
  3.5-3.8 — ici chaque groupe (I)/(II)/(III) garde son propre titre et sa
  propre grille), en choisissant les 2 qui couvrent le mieux la difficulté
  (un cas courant + un cas plus délicat, jamais deux quasi-doublons).
  Appliqué ici à 4.7/4.8 (« Développer, réduire et ordonner (I)/(II) »,
  3→2 chacun) et 4.9/4.10 (« Composition de polynômes (I)/(II) », 3→2
  chacun ; 4.9 avait un doublon pur, écarté sans arbitrage) ; 4.11
  (« ...avec racines carrées », titre distinct, pas numéroté I/II/III) et
  4.12 (« ...(III) », déjà à 2) non touchés.~~ **Faux, voir correction.**

  En complément, demande explicite ponctuelle : ~~4.3 à 4.6 (« Évaluer un
  polynôme » : valeur entière / rationnelle / expression composée / valeur
  irrationnelle) ramenés à 4 exemples au total, un par groupe, en gardant
  l'ordre du simple au complexe déjà présent (les 4 titres marquent déjà
  une progression) — convention du groupe à un seul exemple (id sans
  lettre) appliquée aux quatre. Contrairement à 3.5-3.8, ces 4 groupes ont
  des titres différents : pas de fusion visuelle en une seule section,
  juste un exemple par étape.~~ **Faux aussi, voir correction : ces 4
  groupes ont finalement été fusionnés en une seule section (sauf 4.5,
  compétence distincte).**

  Fiche passée de 48 à 34 questions (avant correction). Vérifié : syntaxe, 500 tirages
  auto-cohérents, cycle complet dans le navigateur (34/34 bonnes réponses
  acceptées, seuls 3 échecs isolés dans des groupes non touchés — piège
  MathLive déjà connu), panneau « Voir toutes les réponses » (34/34,
  aucune erreur MathJax), capture d'écran confirmant le rendu.

  **Correction immédiate de David, même jour : « tu n'as pas compris ».**
  Les deux règles ci-dessus (I/II/III limités à 2 CHACUN sans fusion ;
  progression 4.3-4.6 réduite à un exemple par étape SANS fusion) étaient
  fausses. La vraie règle, unique : **dès que plusieurs groupes traitent
  exactement la même chose — numérotés (I)/(II)/(III), ou variantes de
  titre (entier/rationnel/irrationnel), ou énoncé identique — les fusionner
  en UNE seule section avec une gradation intelligente plafonnée à 4
  exemples au total** (pas 4 par groupe d'origine). Seul un groupe
  qualitativement à part (compétence différente, ou cas nettement plus
  avancé que toute la gradation réunie) reste séparé. Refait en
  conséquence :

  - **4.3 + 4.4 + 4.6 → un seul 4.3 « Évaluer un polynôme en une valeur
  donnée »**, 4 exemples gradués : a) valeur entière, b) valeur
  rationnelle, c) valeur irrationnelle (cas structuré donnant 0), d) valeur
  irrationnelle (cas général, résultat non trivial — le plus complet,
  réintègre l'ancien 4.6 itemB écarté par erreur au tour précédent). 4.5
  (expressions composées, renumérotée 4.4) reste séparée : compétence
  différente (évaluer un produit de polynômes, pas juste P).
  - **4.7 + 4.8 → un seul 4.5 « Développer, réduire et ordonner »**, 4
  exemples gradués : a) simple produit moins un terme mis à l'échelle
  (classique), b) facteur au carré × trinôme, c) produit de facteurs
  conjugués avec un surd (technique distincte), d) le plus complet
  (plusieurs produits et soustractions combinés).
  - **4.9 + 4.10 + 4.11 → un seul 4.6 « Composition de polynômes »**, 4
  exemples gradués : a) linéaire∘linéaire (classique), b) quadratique∘
  linéaire, c) quadratique∘cubique, d) composition avec un surd (le plus
  complet). 4.12 (« cas avancé », renumérotée 4.7) reste séparée : combine
  déjà produits ET surds des deux côtés, plus dur que toute la gradation
  4.9-4.11 réunie.

  Groupes suivants renumérotés en conséquence (4.13→4.8, 4.14→4.9,
  4.15→4.10, 4.16→4.11, 4.17→4.12), inchangés sinon. Fiche passée de 34 à
  33 questions (17 groupes à 12).

  **Deux bugs trouvés et corrigés en vérifiant** : (1) en renommant
  `genGroupe4_16` en `genGroupe4_11`, le nom de fonction a été changé mais
  pas les `id` internes (restés `"4.16 a)"`/`"4.16 b)"`) — repéré
  uniquement en listant les ids réellement générés (`exercices.map(e=>e.id)`),
  pas par un test de syntaxe ni par les 500 tirages auto-cohérents (qui ne
  regardent pas les ids). (2) le nouveau bloc HTML inséré recommençait par
  `<p class="section-titre">Évaluer un polynôme</p>`, alors que ce même
  titre de section précédait déjà le point de départ choisi pour le
  remplacement — doublon visible seulement à la capture d'écran, invisible
  à tous les tests fonctionnels. Les deux corrigés, revérifié en entier
  après correction (syntaxe, 500 tirages, cycle navigateur 33/33 — mêmes 3
  échecs isolés déjà connus —, panneau 33/33 sans erreur MathJax, capture
  d'écran confirmant une seule section par titre et les bonnes gradations).
  Règle générale corrigée dans la mémoire
  `feedback_simplification_fiches_premiere` pour ne pas la reproduire sur
  les fiches suivantes.

  **Même jour, David supprime 4.10 « Racine avec radical imbriqué »**
  (cas statique isolé, un seul exemple fixe, sans lien direct avec les
  groupes voisins). Groupes suivants renumérotés (4.11→4.10, 4.12→4.11).
  Fiche passée de 33 à 32 questions, 12 à 11 groupes. Vérifié : syntaxe,
  500 tirages auto-cohérents, cycle complet dans le navigateur (32/32
  bonnes réponses acceptées, mêmes 2 échecs isolés déjà connus
  renumérotés), panneau « Voir toutes les réponses » (32/32, aucune
  erreur MathJax), capture d'écran confirmant l'absence du groupe.

  **Fiche 5 de Première (cahier 1) — fusions et réductions (25/09/2026)**,
  sur PC pro cette fois, même méthode et même règle standing (fusion des
  groupes numérotés/variantes de titre à 4 exemples au total, gradient
  classique/délicat sinon) :

  **5.5 « (I) » + 5.6 « (II) » (facteurs communs et identités
  remarquables) → un seul 5.5, 4 exemples** (3+3 → 4). Gardés : ancien
  5.5 a) (classique, regroupement entier), ancien 5.5 b) (classique/
  particulier — le résultat se réduit à UN SEUL facteur, cas à part que
  l'élève doit savoir reconnaître), ancien 5.6 a) (délicat, même
  regroupement avec coefficients fractionnaires), ancien 5.6 c) (le plus
  délicat, combine différence de deux carrés et un terme linéaire
  supplémentaire). Écartés : ancien 5.5 c) (redondant avec a) et ancien
  5.6 b) (redondant avec a) du même groupe fusionné).

  **5.7 « (I) » + 5.8 « (II), avec un paramètre a » + 5.9 « (III), non
  unitaire » (une méthode fondamentale) → un seul 5.6, 4 exemples**
  (4+2+3 → 4) : répartition naturelle 2 classiques/2 délicats. a)
  classique (ex-5.7, polynôme unitaire, racines numériques), b) classique/
  escalade (ex-5.9, non unitaire — même méthode, diviser par le
  coefficient dominant), c) et d) délicats (les DEUX exemples paramétrés
  de l'ex-5.8 gardés intégralement, aucune redondance entre eux — deux
  techniques distinctes, racine substituée directement vs racine
  reconnue via une différence de deux carrés). Seuls les exemples
  numériques répétés (5.7 appelait 4 fois le même générateur, 5.9 3 fois)
  sont réduits à un représentant chacun. Les deux encadrés de rappel
  (Vieta unitaire/non unitaire) sont conservés tous les deux, empilés,
  puisque le groupe fusionné teste maintenant les deux cas.

  **Réductions internes sans fusion** (groupes à titre unique, pas de
  variante I/II/III, mais redondance interne à couper) : 5.3 (5→4,
  retire l'ancien b, simple variante de coefficient de a, sans nouvelle
  compétence) ; 5.10 ex-« avec des racines entières visibles » (6→2,
  les 6 items étaient tous le même générateur — tirage désormais forcé
  sur un signe positif et un signe négatif, comme 1.6 de la fiche 1) ;
  5.12 ex-« en degré plus élevé » (4→3, retire l'ancien a — même
  technique que b, juste un degré plus bas, aucune nouveauté) ; 5.14
  ex-« produit de deux facteurs non constants » (3→2, retire l'ancien b —
  même technique que a, degré plus élevé sans rien de neuf) ; 5.15
  ex-« formule de Bernoulli » (5→3, les items a)/b) étaient deux tirages
  indépendants de la même formule à n=3, c)/d) de même à n=5 — un seul
  gardé par degré, plus n=7 déjà unique : le degré n fournit lui-même un
  gradient de difficulté naturel). Non touchés (déjà sans redondance) :
  5.4, 5.11 (un seul problème cohérent en 3 étapes, pas 3 répétitions),
  5.13, 5.16.

  Fiche passée de 16 à 13 groupes, 53 à 37 questions. `FORMES_FACTORISEES`
  et `groupes` recalculés en conséquence (les deux groupes fusionnés sur
  la recherche de racine — nouveaux 5.6 et 5.8 — restent absents de
  `FORMES_FACTORISEES`, leurs réponses étant des nombres/expressions, pas
  des produits). Vérifié : syntaxe, 500 tirages auto-cohérents (aucun
  échec), cycle complet dans le vrai navigateur avec les vrais champs
  MathLive (37/37 acceptées, aucun échec cette fois — contrairement aux
  fiches précédentes, aucun cas connu de piège MathLive dans cette fiche),
  panneau « Voir toutes les réponses » (37/37, aucune erreur MathJax),
  capture d'écran confirmant le rendu des deux sections fusionnées (titres
  sans « (I)/(II)/(III) », les deux rappels de 5.6 empilés proprement) et
  du reste de la fiche.

  **Fiche 5 de Première (cahier 1) — deuxième passe, réduction
  supplémentaire (25/09/2026, sur PC pro, même jour)**, sur demande
  explicite de David (« 5.5, 5.8 et 5.9 juste deux exemples. Supprimer
  5.11. fusionner 5.12 et 5.13 en gardant juste 2 exemples ») :

  **5.5 (4→2)** : gardés a) (classique, regroupement entier) et l'ancien
  c) devenu b) (délicat, même regroupement avec coefficients
  fractionnaires) — un seul gradient de difficulté ajouté. Écartés
  l'ancien b) (cas particulier où le résultat se réduit à un seul
  facteur) et l'ancien d) (le plus complet, cumulait fractions ET un
  terme linéaire supplémentaire) — plus de place pour ces nuances à
  seulement 2 exemples.

  **5.8 (3→2)** : ce n'est pas un gradient de difficulté mais un même
  problème (même polynôme P) résolu en plusieurs étapes indépendantes,
  chacune aussi difficile que les autres. Gardées les deux premières
  étapes naturelles de résolution — retrouver c) via P(1), puis b) via
  P(0) — et retirée la troisième (retrouver a) via P(2)), redondante en
  termes de compétence exercée.

  **5.9 (3→2)** : gardés a) (classique : facteur x² puis différence de
  deux carrés) et l'ancien c) devenu b) (le plus délicat : reconnaître un
  carré parfait caché avant de regrouper). Retiré l'ancien b) (factoriser
  un binôme commun partagé par deux termes) — compétence déjà présente
  ailleurs dans la fiche (5.3, 5.5).

  **5.11 « produit de deux facteurs non constants » supprimée
  entièrement** (2 exemples en moins).

  **5.12 (Bernoulli, 3 exemples) + 5.13 (grande identité x¹²-1, 1
  exemple) → un seul nouveau 5.11, 2 exemples au total** : le degré n de
  la formule de Bernoulli fournit lui-même un gradient de difficulté
  (plus n est grand, plus le polynôme facteur a de termes) — gardé n=3,
  le cas le plus simple, comme classique ; n=5 et n=7 retirés (déjà une
  escalade suffisante sans eux, plus de place à 2 exemples). Gardée
  ensuite x¹²-1 comme délicat/capstone de la fiche (déjà la plus avancée,
  cas isolé sans variante de degré).

  Fiche passée de 13 à 11 groupes, 37 à 29 questions.
  `FORMES_FACTORISEES` et `groupes` recalculés en conséquence (indices de
  tous les groupes à partir de 5.5 décalés). Vérifié : syntaxe (`vm.Script`
  sur les deux blocs `<script>`, OK), 500 tirages auto-cohérents exécutés
  dans le vrai navigateur (14500 vérifications au total via
  `checkEqualNumeric`/`checkEnsemble`/`estFactorise` appelés directement,
  0 échec), liste des 29 `id` générés vérifiée contre la liste attendue
  (aucun id orphelin d'un ancien numéro de groupe), cycle complet dans le
  vrai navigateur avec les vrais champs MathLive (29/29 acceptées),
  panneau « Voir toutes les réponses » (29/29, aucune erreur MathJax),
  aucune erreur console, capture d'écran confirmant une seule section «
  Calcul 5.11 » (fusion propre, pas de doublon de titre, le rappel de
  formule de Bernoulli et la grille a)/b) bien rendus).

  **Fiche 7 de Première (cahier 2, dérivation), 25/09/2026 — faite en
  autonomie complète** (David : « je te laisse faire la fiche 7 en
  autonomie en respectant toutes nos règles intelligentes »), même méthode
  que les fiches précédentes :

  **Automatismes (7.1+7.2+7.3, 4+3+6=13) → 6, répartis intelligemment
  entre 3 calculs distincts** (pas 2 comme les fiches précédentes — les
  trois traitent des sujets différents : inéquation linéaire, simplifier
  une fraction de puissances, évaluer une fonction quadratique en une
  valeur irrationnelle). 7.1 (4→2) : même gabarit répété, aucune famille à
  perdre. 7.2 (3→2) : gardé le cas classique (deux bases premières 2 et 3)
  et le plus complet (quatre bases composites 12/10/15/8, la décomposition
  en facteurs premiers la plus complète) ; écarté le cas intermédiaire
  (une seule base composite, milieu de gradient redondant). 7.3 (6→2) :
  gardé le cas classique (évaluer en √D pur) et le plus complet
  (combinaison linéaire (p+√D)/q) ; écartés deux variantes de signe
  redondantes avec ce dernier et un doublon exact (même générateur rappelé
  deux fois).

  **Section « Dérivation de polynômes » (7.4/7.5, pas de fusion : deux
  tâches différentes — expression générale vs valeur en un point).** 7.4
  (3) laissée telle quelle : trois degrés croissants (4/5/6), un vrai
  gradient, aucun doublon. 7.5 (4→2) : les trois premiers appels étaient
  le même générateur (degré 3) rappelé à l'identique — gardé un seul
  tirage degré 3 (délicat) plus le tirage degré 2 déjà distinct
  (classique).

  **7.6 « Inverses (I) » + 7.7 « (II) » → un seul 7.6, 4 exemples
  gradués par degré** (1→2→3→5 ; le degré 3 était testé deux fois à
  l'identique entre les deux anciens groupes, gardé une seule fois).
  **7.8 « Quotients (I) » + 7.9 « (II) » → un seul 7.7, 4 exemples**
  (déjà exactement 4 sans redondance interne, juste fusionnés et
  relettrés : linéaire/linéaire → cubique/linéaire → cubique/cubique →
  quartique/quadratique).

  **7.10 « Quotients à simplifier (I) » et 7.11 « (II) » NON fusionnées,
  contrairement au motif (I)/(II) habituel** : ce ne sont pas deux
  pratiques indépendantes du même exercice, mais un problème EN DEUX
  ÉTAPES (7.11 renvoie explicitement à « 7.10 a) », utilise le résultat
  déjà simplifié pour dériver) — même situation que 3.11/3.12 en fiche 3
  (calculer P(r) → factoriser → conclure), qui étaient restées séparées
  pour la même raison. Renumérotées 7.8/7.9 sans changement de contenu ;
  la référence textuelle « À l'aide de 7.10 a) » mise à jour en « À l'aide
  de 7.8 a) ».

  **7.12 « Signe de la dérivée » (4, inchangée)** : 4 familles déjà
  distinctes (dérivée d'un quadratique, quotient au carré, homographie,
  inverse d'un quadratique), aucune redondance, renumérotée 7.10.

  **7.13 « Dériver puis factoriser (I) » + 7.14 « (II) » → un seul 7.11,
  4 exemples.** Contrairement aux autres fusions, ce ne sont pas des
  étapes d'un gradient mais DEUX techniques distinctes (racine double →
  facteur au carré, vs racines distinctes → produit de deux facteurs) —
  chaque ancien groupe appelait déjà le même générateur 4 fois à
  l'identique (aucune variation structurelle, seulement les valeurs
  tirées). Gardés 2 tirages de chaque technique plutôt qu'1+1, pour
  utiliser pleinement le budget de 4 exemples sans perdre l'exercice
  réel de chaque cas.

  **Section « Calculs plus avancés » (7.15/7.16/7.17) entièrement
  laissée telle quelle**, renumérotée 7.12/7.13/7.14 : aucune des trois
  ne contient de doublon interne. 7.15 (4) : degré 2 → degré 3 → deux cas
  statiques de complexité croissante, gradient réel. 7.16 (4) : quatre
  identités de sommes différentes (série géométrique, série alternée,
  série factorielle, série paire mise à l'échelle), aucune redondance.
  7.17 (8) : huit combinaisons symboliques du produit/quotient/racine
  toutes algébriquement distinctes (fg+gh, f²/g, (f³+g)/(gh), g-f/h³,
  f³g², f/(g/h), √(f/g), fgh) — délibérément laissée à 8 malgré sa
  taille : aucune règle ne demande de réduire un groupe déjà sans
  redondance, et c'est le cœur du chapitre « expressions formelles »
  (dérivation symbolique), pas une répétition d'exercice numérique.

  Fiche passée de 17 à 14 groupes, 61 à 47 questions.
  `FORMES_FACTORISEES` recalculée (`'7.11': 'numerateur'`, seule clé
  restante). Vérifié : syntaxe (`vm.Script`), 500 tirages auto-cohérents
  (`checkEqualNumeric`/`checkEnsemble`/validité structurelle des
  `intervalleSpec`, 0 échec), cycle complet dans le vrai navigateur avec
  les vrais champs MathLive (47/47, avec 10 échecs isolés dans des
  groupes non modifiés en contenu — 7.1/7.10/7.13 — comparés à l'ancienne
  fiche où les mêmes catégories échouaient déjà à l'identique, donc pas
  une régression), panneau « Voir toutes les réponses » (47/47, aucune
  erreur MathJax), référence croisée « À l'aide de 7.8 a) » vérifiée dans
  l'énoncé généré, capture d'écran confirmant le rendu des sections
  fusionnées (7.6 et 7.11).

  **Même jour, retours de David sur la fiche 7** :

  1. **Tous les « f'(x) »/« f'(a) » en texte brut dans les titres de
  calcul rendus en vrai LaTeX** (`\(f'(x)\)` au lieu du texte plain
  « f'(x) », l'apostrophe droite étant peu lisible comme symbole prime).
  7 titres concernés (7.4, 7.5, 7.6, 7.7, 7.9, 7.10, 7.11) ; 7.10 profite
  au passage du même traitement pour son inéquation (`\(f'(x)\geqslant
  0\)` au lieu de « f'(x)≥0 »). Vérifié que fiche 6 (Dérivation I) n'a pas
  le même défaut (occurrences de `f'(x)` toutes dans des commentaires de
  code, jamais dans un texte affiché) — pas de correction nécessaire
  là-bas.
  2. **7.12 (Avec des racines carrées) et l'ancien 7.14 (Expressions
  formelles) supprimés entièrement** (contrairement au reste du chantier,
  ce ne sont pas des fusions mais des suppressions pures — David a jugé
  ces deux groupes non nécessaires). 7.13 (Avec des sommes) renumérotée
  7.12, seule survivante de la section « Calculs plus avancés ».
  3. **7.6 (Inverses), 7.7 (Quotients) et 7.11 (Dériver puis factoriser)
  ramenées de 4 à 2 exemples chacune** : 7.6 garde les deux extrémités du
  gradient de degré (1 et 5, écarte 2 et 3) ; 7.7 garde les deux
  extrémités (linéaire/linéaire et quartique/quadratique, écarte les deux
  étapes intermédiaires) ; 7.11 garde un exemple de chacune des deux
  techniques (racine double, racines distinctes) plutôt que deux de
  chaque comme lors du chantier initial.
  4. **7.10 (Signe de la dérivée) : nouvel exemple b) obligatoire, un
  polynôme de degré 3**, à la place de l'ancien b) (quotient au carré,
  retiré). `f(x)=Ax³+Bx²+Cx+D` construit par Vieta à partir de deux
  racines choisies pour `f'(x)=3A(x-r₁)(x-r₂)` (quadratique réelle à deux
  racines) : extérieur si le coefficient dominant de `f'` est positif,
  intérieur sinon — même esprit que a) (quadratique) et c) (Möbius) déjà
  présents, mais avec `f'` elle-même une quadratique à factoriser plutôt
  qu'une expression déjà linéaire ou homographique. a) (quotient au
  carré) gardé (David a laissé le choix « b, ou c » — retiré celui des
  deux qui testait la famille la moins riche, la Möbius/homographique
  restant une technique plus généraliste et déjà bien distincte de a) et
  du nouveau b).

  **Bug réel trouvé en vérifiant le nouveau b), présent aussi dans
  l'ancien a) (itemQuadratique) depuis avant ce chantier** : les deux
  construisaient leur `intervalleSpec` avec `inclusBas`/`inclusHaut` à
  `true` du côté d'une borne infinie (`{bas:X, haut:Infinity,
  inclusHaut:true}`) — mathématiquement incohérent (l'infini n'est jamais
  « inclus »), et surtout **empêchait un élève tapant la notation
  correcte** (`[X;+∞[`, crochet fermant vers l'extérieur) **d'être
  reconnu comme juste**, puisque `checkIntervalle` exige une correspondance
  stricte des crochets. Confirmé par un test direct (contournant MathLive) :
  `checkIntervalle` avec la notation mathématiquement correcte échouait
  systématiquement tant que le bug n'était pas corrigé, réussissait à
  100% après. Le panneau « Voir toutes les réponses » affichait par
  ailleurs `[9/8\,;\,+\infty]` (crochet fermant à l'infini, notation
  fausse) avant correction. `itemMobius` et `itemUnSurQuadratique`
  (voisins du même groupe) étaient déjà corrects, servant de référence
  pour le correctif. Corrigé sur les deux items concernés (a et le
  nouveau b).

  Fiche passée de 47 à 29 questions, 14 à 12 groupes. Vérifié à nouveau
  en entier après ces changements : syntaxe, 500 tirages auto-cohérents
  (validité structurelle + test direct `checkIntervalle` avec notation
  `-inf`/`+inf`, 0 échec sur les deux), cycle complet dans le navigateur
  (29/29 bonnes réponses acceptées, mêmes échecs isolés déjà connus dans
  7.1/7.10/7.12 — piège MathLive), panneau « Voir toutes les réponses »
  (29/29, aucune erreur MathJax, notation d'intervalle désormais correcte
  aux captures), capture d'écran confirmant le rendu LaTeX des titres et
  le nouvel exemple 7.10 b).

  **Fiche 8 de Première (cahier 2, Dérivation III), 25/09/2026 — faite en
  autonomie complète** (David : « ok. commence la fiche 8 »), même méthode
  que les fiches précédentes. Architecture différente des fiches 1-7 :
  tableau plat `generateurs` (façon fiche-16/25 de Seconde) plutôt que des
  fonctions `genGroupeN()` par groupe — extraction/reconstruction adaptée
  en conséquence (bornage sur les marqueurs `{id:"X"` plutôt que sur les
  noms de fonction).

  **Automatismes (8.1+8.2, 4+4) → 6, répartis 3+3** : les deux traitent
  des combinaisons linéaires de fractions/polynômes, déjà un vrai
  gradient chacun — 8.1 perd un cas redondant (même gabarit de fractions
  rappelé deux fois), 8.2 perd le cas intermédiaire entre le plus simple
  et le plus complet.

  **8.3 « Puissances (I) » + 8.4 « (II) » → un seul 8.3, 8→4 exemples** :
  même compétence (dérivée de `(ax+b)^n`), gardé un exemple par famille
  distincte (carré, puissance 5, cube, quotient de puissance au carré),
  écartés les doublons de degré.

  **8.5 « Produits de puissances (I) » + 8.6 « (II) » → un seul 8.4,
  4 exemples** (déjà 4 sans redondance interne une fois fusionnés,
  aucune coupe nécessaire).

  **8.7 « Quotients (I) » + 8.8 « (II) » → un seul 8.5, 4 exemples**
  (même situation, fusion pure sans perte).

  **8.9/8.10/8.11 (dérivation à partir de `g(x)=f(mx+n)` ET
  `h(x)=k·f(px+q)`, 4 exemples chacun) → 8.6/8.7/8.8, 2 exemples
  chacun** : chaque groupe testait deux compétences en parallèle sur le
  même énoncé (dériver `g` ET dériver `h`) — gardés uniquement les items
  b)/c) ou c)/d) portant sur `h` (le cas avec facteur multiplicatif `k`,
  legèrement plus riche que `g` qui n'en a pas), écartés les items
  portant sur `g`. Le générateur partagé `genererParametresAvances()`
  (fonction `ligne()`) calcule déjà les paramètres de `g` et `h`
  ensemble — aucune modification nécessaire là, seulement les items
  consommateurs. `texteNote()` et `mettreAJourTextesAvances()` réécrits
  pour ne plus définir/référencer que `h` (la définition de `g`,
  désormais inutilisée, supprimée du texte introductif) ; les paragraphes
  HTML `texte-8-6`/`texte-8-7`/`texte-8-8` (anciennement `texte-8-9`
  etc.) mis à jour en conséquence.

  **8.12/8.13/8.14/8.15/8.16 (équations de tangentes, ordonnées à
  l'origine, calculs avancés) laissées inchangées**, renumérotées
  8.9/8.10/8.11/8.12/8.13 : aucune des cinq ne contient de redondance
  interne identifiée.

  Fiche passée de 16 à 13 groupes, 49 à 37 questions. **Piège rencontré
  pendant la reconstruction** : en relabelant les items conservés d'un
  groupe fusionné, deux lignes du script de fusion faisaient une
  réaffectation directe de variable (`const n4a = i5a;`) sans appeler la
  fonction `renum()` qui met à jour le champ `id` du texte — résultat :
  les items conservés affichaient encore leur ancien numéro (`8.5 a)`
  au lieu de `8.4 a)`, `8.7 a)` au lieu de `8.5 a)`). Repéré uniquement
  en listant les `id` réellement générés (pas par un test de syntaxe),
  corrigé en remplaçant les deux lignes par des appels `renum(...)`
  explicites. Vérifié après correction : syntaxe (`vm.Script` sur les
  deux blocs `<script>`, OK), 500 tirages auto-cohérents
  (`checkEqualNumeric`/`checkEnsemble`, 0 échec), liste des 37 `id`
  générés conforme au plan exact, cycle complet dans le vrai navigateur
  avec les vrais champs MathLive (**37/37 bonnes réponses acceptées,
  aucun échec** — donc pas besoin de comparaison avec une ancienne
  version pour distinguer régression et bizarrerie MathLive préexistante
  cette fois), panneau « Voir toutes les réponses » (aucune erreur
  MathJax), aucune erreur console, capture d'écran confirmant le rendu
  des sections fusionnées 8.3/8.4/8.5 et du texte introductif simplifié
  de 8.6 (`h(x)=f(3x-2)` bien rendu en LaTeX, plus de référence à `g`).

  **Même jour, deuxième passe sur fiche 8, retours de David** : « supprimer
  8.4, 8.5, 8.8. 8.9, supprimer d) et inutile d'écrire (sous la forme ...)
  à chaque question, c'est écrit dans ? Certains titres ne sont pas en
  mode LATEX. 8.10 : 2 exemples. Fusionner 8.12 et 8.13 (deux exemples.
  Un avec et un sans paramètre) ».

  1. **8.4 (Produits de puissances) et 8.5 (Quotients) supprimées
  entièrement** (pas fusionnées, retirées — David a jugé le reste de la
  fiche suffisant sans elles ; 8.3 « Puissances » reste seule dans la
  section « Dérivées de fonctions composées »).
  2. **8.8 (dérivation à partir de `f'(x)=\sqrt{2x^2+1}`) supprimée
  entièrement**, avec son texte d'intro et le paramètre partagé `g11`
  (n'était utilisé que par ce groupe) retiré de
  `genererParametresAvances()`/`mettreAJourTextesAvances()`. Restent
  8.6 et 8.7 (renumérotées 8.4/8.5), les deux seuls survivants de la
  section « Dérivation à partir de relations fondamentales ».
  3. **8.9 (Équations de tangentes) : item d) supprimé**, et la
  répétition « (sous la forme y=ax+b) » retirée des trois énoncés
  restants (a/b/c). **Réponse à la question de David** (« c'est écrit
  dans ? ») : oui — le format est déjà expliqué dans la bulle d'aide
  contextuelle du groupe (`aideContextuellePour`, branche `formeYax` :
  « Écrire l'équation complète, y compris « y= »... ») et rappelé
  visuellement par le placeholder `y=ax+b` affiché dans chaque champ
  vide — la répétition dans l'énoncé était donc purement redondante,
  conformément à la règle standing [[feedback-consigne-generale-factorisee]].
  4. **Titre 8.1 converti en LaTeX** : « Écrire sous la forme ax+by+cz »
  → « Écrire sous la forme \(ax+by+cz\) » — seul titre trouvé avec une
  vraie formule (opérateurs `+`) en dehors d'un `\(...\)` ; les autres
  titres (8.2 « puissances de x », etc.) ne contiennent que des lettres
  isolées, déjà couvertes par la convention existante (voir l'audit
  site-wide de 2026-09-01 dans [[project-premiere-fiche-randomization]]).
  5. **8.10 (Ordonnées à l'origine) réduite de 4 à 2 exemples** : les 4
  items testaient 4 techniques distinctes (somme de puissances, quotient
  de puissances, produit de puissances, puissance négative isolée) —
  gardés le quotient (b) et le produit (c), qui sont les deux règles
  de dérivation (quotient/produit) non déjà couvertes ailleurs dans la
  fiche ; écartée la somme de puissances (même famille que le d) qui
  vient d'être retiré de 8.9 par cohérence) et la puissance négative
  isolée (déjà bien représentée dans 8.3, qui inclut des exposants
  négatifs).
  6. **8.12 (Tangente passant par un point donné) + 8.13 (Avec un
  paramètre) fusionnées en une seule section, 2 exemples : un sans
  paramètre, un avec**, exactement comme demandé. Gardé 8.12 a) (fonction
  fixe `f(x)=3(1-x/2)^2`, deux valeurs de `a` à trouver — « sans
  paramètre ») et 8.13 a) (fonction avec paramètre `b`, trouver les
  valeurs de `b` pour une tangente horizontale — « avec paramètre »),
  écartés 8.12 b) (redondant avec a), même fonction et même technique,
  juste un autre point) et 8.13 b) (réponse statique `"0"`, sans aucun
  calcul réel, le plus faible exemple du groupe). Nouveau titre : «
  Tangente passant par un point donné, avec ou sans paramètre. »

  Fiche passée de 37 à 22 questions, 13 à 9 groupes. Vérifié : syntaxe
  (`vm.Script` sur les deux blocs `<script>`, OK), 500 tirages
  auto-cohérents (0 échec), liste des 22 `id` générés conforme au plan
  exact, cycle complet dans le vrai navigateur avec les vrais champs
  MathLive (**22/22 bonnes réponses acceptées, aucun échec**), panneau
  « Voir toutes les réponses » (aucune erreur MathJax), aucune occurrence
  restante de « sous la forme y=ax+b » ni de `g11` dans le fichier,
  aucune erreur console, captures d'écran confirmant le rendu LaTeX du
  titre 8.1, les sections fusionnées 8.4/8.5/8.9 et la suppression
  propre de 8.8.

  **Fiche 9 de Première (cahier 3, Généralités sur l'exponentielle I),
  25/09/2026 — faite en autonomie complète** (David : « commence la
  fiche 9 »), même méthode que les fiches précédentes. Architecture par
  fonction unique `genererExercices()` poussant séquentiellement dans un
  tableau `ex` (comme les fiches 1-7), avec un `groupes` indexé par
  position — donc les suppressions/renommages n'ont besoin de toucher
  que les items concernés, pas de réorganiser physiquement le tableau.

  **Automatismes (9.1+9.2, 3+3=6) laissés inchangés** : déjà exactement
  au total cible, chaque groupe de 3 teste 3 techniques distinctes
  (9.1 : soustraction, division emboîtée, fraction composée ; 9.2 :
  trois manipulations de puissances de 2), aucune redondance interne.

  **9.3 « Quelques calculs pour commencer » + 9.4 « D'autres calculs
  pour continuer » + 9.5 « Un peu plus compliqué » → un seul 9.3, 4
  exemples** : trois titres différents mais même compétence testée à
  complexité croissante (simplifier un produit/quotient d'exponentielles
  via les règles de calcul), motif identique au précédent fiche 4
  (4.3+4.4+4.6). Gardé un gradient de 4 sans redondance : 9.3 a) (cas
  numérique classique, produit de 3 facteurs), 9.3 f) (cas numérique le
  plus complet, quotient avec un facteur au cube), 9.4 c) (cas algébrique
  avec x, produit de 3 facteurs dont un au carré), 9.5 b) (cas algébrique
  le plus complexe, quotient avec un facteur au cube au dénominateur).
  Titre unifié : « Soit x ∈ ℝ. Simplifier les expressions suivantes. »

  **9.6 « Développer et réduire... » + 9.7 (titre mot pour mot
  identique) → un seul 9.4, 4 exemples** : signal de fusion le plus
  fort (rule 2), les deux groupes portaient littéralement le même titre.
  Gardé 9.6 a) (carré d'une somme symétrique), 9.6 c) (carré d'une
  différence avec coefficients), 9.6 d) (produit = différence de deux
  carrés, technique distincte des deux précédentes), 9.7 b) (identité
  télescopique élégante, (a+b)²-(a-b)²=4ab, bon exemple de clôture).
  Écartés 9.6 b) (carré d'une somme avec coefficients, redondant avec
  9.6 a)+9.6 c) combinés) et 9.7 a) (expression la plus complexe,
  cumule plusieurs difficultés à la fois — le genre de cas que la
  méthode dit d'écarter en priorité).

  **9.8 « Factorisations » renumérotée 9.5, contenu inchangé** : 2
  familles déjà distinctes (trinôme carré parfait a/b, différence de
  carrés c/d), 2 exemples chacune, aucune redondance.

  **9.9 « Résolutions d'équations (I) » + 9.10 « (II) » → un seul 9.6,
  4 exemples** : motif (I)/(II) explicite, fusion automatique. Gardé
  les 3 techniques déjà distinctes de 9.9 (comparaison directe des
  exposants, équation du second degré en x via exp(x²)=exp(cx), produit
  nul exploitant exp(x)>0) plus 9.10 b) (isoler l'exponentielle avant de
  comparer les exposants — technique non couverte par 9.9). Écarté
  9.10 a), redondant avec la technique de comparaison directe de 9.9 a).

  **9.11 « Résolutions d'inéquations » renumérotée 9.7, réduite de 5 à
  4 exemples** : 5 items couvraient plusieurs formes (bornée, non
  bornée, union, à isoler), mais c) (union symétrique via une racine
  carrée) était un cas particulier subsumé par e) (union générale, racines
  rationnelles quelconques via `fracSimple`, plus riche) — écarté c),
  gardés a) (comparaison directe), b) (borné), d) (isoler avant de
  comparer), e) (union générale).

  **9.12 à 9.18 renumérotées 9.8 à 9.14, contenu inchangé** : chacune
  déjà une compétence à part sans redondance interne (changement de
  variable à 3 substitutions distinctes, parité en QCM, identité
  cosh²-sinh²=1, formule de duplication à 2 résultats différents,
  formules de factorisation à 2 identités différentes en QCM, une
  équation, calcul de sommes à 2 pas différents).

  Fiche passée de 18 à 14 groupes, 52 à 38 questions. `FORMES_FACTORISEES`
  mise à jour (`'9.8'` → `'9.5'`). **Piège rencontré pendant la
  reconstruction** : plusieurs remplacements de `id="grille-9-N">` en
  `id="grille-9-M"` (renumérotation simple, sans toucher au reste de la
  balise) ont fait disparaître le `>` de fermeture par inattention —
  résultat : `<div ... id="grille-9-8"</div>` (accolade jamais fermée),
  ce qui a fait planter `construireGrilles()` avec `Cannot set properties
  of null` sur `grille-9-8` et rendu **invisibles dans le DOM tous les
  groupes suivants (9.8 à 9.14)**, alors même que le texte source HTML
  brut restait correct pour les balises elles-mêmes (confirmé en lisant
  le fichier via `fetch` depuis le navigateur) — le symptôme trompeur
  était que `document.getElementById` renvoyait `null` pour des id qui
  existaient bien dans le texte source, parce que la balise mal fermée
  avalait tout le HTML suivant comme contenu texte d'un attribut jamais
  refermé. Repéré via `Object.keys(groupes).map(id=>document.getElementById(id))`,
  corrigé par un balayage regex de tout `id="grille-9-N"</div>` restant
  dans le fichier (7 occurrences, dont une sur `grille-9-7` lui-même
  passée inaperçue au premier passage). Vérifié après correction :
  syntaxe (`vm.Script`, OK), 500 tirages auto-cohérents
  (`checkEqualNumeric`/`checkEnsemble`, 0 échec), liste des 38 `id`
  générés conforme au plan exact, cycle complet dans le vrai navigateur
  (**38/38 bonnes réponses acceptées, aucun échec** — types `qcm` et
  `vraifaux` de cette fiche utilisent un simple champ texte, pas des
  boutons radio, contrairement à une première hypothèse du test qui a dû
  être corrigée), panneau « Voir toutes les réponses » (aucune erreur
  MathJax), capture d'écran confirmant le rendu des sections fusionnées
  9.3, 9.5 et 9.6.

  **Correctif ultérieur sur la fiche 9 (26/09/2026, fait en même temps
  que la fiche 10)** : 9.3 a) (repris de l'ancien 9.3 a) lors de la
  fusion) gardait en fin d'énoncé « (écrire sous la forme exp(...)) » :
  math en texte brut hors LaTeX, et consigne répétée sur un seul item du
  groupe alors que les trois autres ne l'ont pas. Retirée : le
  vérificateur accepte toute forme équivalente, l'indication n'était pas
  nécessaire. Aucune autre occurrence de ce motif dans les fiches de
  Première.

  **Fiche 10 de Première (cahier 3, Généralités sur l'exponentielle II),
  26/09/2026 — faite en autonomie complète** (David : « commence la
  fiche 10 »). Même architecture que la fiche 9 (`genererExercices()`
  séquentiel + `groupes` indexé). Modifications faites par un script
  Node qui exige exactement une occurrence de chaque motif remplacé et
  isole chaque bloc supprimé (un seul `ex.push` par bloc), pour éviter
  le piège de la fiche 9 (balise `>` perdue en renumérotant).

  **Automatismes (10.1+10.2, 6+6=12) → 6, répartis 4+2** : 10.1
  (factorisations) couvre de vraies familles distinctes, 10.2 (fractions
  de fractions) appelle 6 fois le même générateur. 10.1 garde b) carré
  parfait, d) \(A^2x^2-B^2\), e) facteur commun caché après
  développement, f) \((Ax-B)^2-C^2\) ; écartés a) \(x^2-D^2\) (cas
  particulier de d) et c) (variante de d à coefficients fractionnaires,
  cumule deux difficultés). 10.2 ramenée à 2 tirages.

  **10.3 (6, numérique, « A entier ») + 10.4 (4, avec x) → un seul
  10.3, 4 exemples** : même compétence (écrire sous la forme
  \(\exp(A)\)), complexité croissante, même situation que 9.3-9.5 dans
  la fiche 9. 10.3 a) et b) étaient d'ailleurs un doublon exact (même
  générateur). Gardés 10.3 d) (quotient de produits), 10.3 f) (puissances
  4 et 5), 10.4 b) (carré et quotient, avec x), 10.4 d)
  (\(\exp(x/q)^n\), exposant fractionnaire). Titre unifié, « où A est
  un entier » retiré puisque A dépend désormais de x pour c) et d).

  **10.5 (identités remarquables, 1 question) → 10.4**, inchangée.

  **10.6 « Résoudre les équations et inéquations » (6) + 10.7 et 10.8
  « Résoudre les inéquations » (4+4, titres mot pour mot identiques) →
  deux groupes par compétence, 4 exemples chacun** : 10.5 « Résoudre
  dans ℝ les équations suivantes » = les 4 équations de l'ancien 10.6
  (a, c, e, f : exposant affine = 0, exposant \(x^2\) à deux solutions,
  équation rationnelle en \(\exp(x)\), puissance et inverse) ; 10.6
  « Résoudre dans ℝ les inéquations suivantes » = ancien 10.6 d)
  (comparaison directe), 10.7 a) (exposant \(x^2\), solution bornée),
  10.8 b) (double inégalité, intervalle fermé), 10.8 c) (inéquation
  rationnelle en \(\exp\), raisonnement de signe). Écartés 10.6 b)
  (même technique que d), 10.7 b) et d), 10.8 a) et d) (variantes
  de la comparaison directe après regroupement des exposants), 10.7 c)
  (même raisonnement de signe que 10.8 c), qui fait varier davantage
  la solution). Le bloc de l'ancien 10.6 d) a été déplacé physiquement
  après les équations pour que l'ordre du tableau suive l'ordre
  d'affichage (panneau « Voir toutes les réponses »).

  **Deux défauts préexistants corrigés dans cette section** :
  1. L'encadré disait « on attend les réponses sous la forme « x=a » ou
  « x⩾a » ou « x>a » » — faux : les inéquations attendent un intervalle
  (vérifié : `checkIntervalle('x>=2', …)` renvoie faux, `[2;+inf[`
  vrai). Remplacé par une consigne exacte, en LaTeX : ensemble de
  solutions pour une équation (\(\{2\}\), \(\{-1;3\}\)), intervalle ou
  réunion d'intervalles pour une inéquation.
  2. Dans un même groupe d'équations, certaines réponses étaient un
  nombre nu (anciens 10.6 a, 10.6 f, 10.9 a, b, c) et d'autres un
  ensemble (10.6 c, 10.9 d) ; la bulle d'aide du groupe demandait
  d'écrire `{5}` « s'il n'y a qu'une solution », mais `{2}` était alors
  refusé sur les réponses à nombre nu (`checkEqualNumeric('{2}','2')`
  faux). Toutes ces réponses passées au format ensemble : `checkEnsemble`
  accepte `{2}`, `2` et `x=2`, donc rien de ce qui était accepté avant
  ne devient refusé.

  **10.9 (équation auxiliaire, 4) → 10.7**, contenu inchangé à part le
  format ensemble ci-dessus (quatre cas distincts : racine double,
  substitution symétrique, une racine rejetée car négative, deux
  racines). **10.10 (système) → 10.8**, « donner (x;y) » passé en
  LaTeX. **10.11/10.12 (reconnaissance graphique) → 10.9/10.10**,
  inchangées (les `div` internes `graphique-10-11`/`graphique-10-12`
  gardent leur nom, non affiché). **10.13/10.14/10.15 (avancés) →
  10.11/10.12/10.13**, inchangées sauf 10.12 : « sous la forme
  exp(...) » passé en LaTeX (\(\exp(\ldots)\)).

  Fiche passée de 15 à 13 groupes, 50 à 32 questions. Vérifié : syntaxe
  (`vm.Script`, OK), 500 tirages auto-cohérents (0 échec), 32 `id`
  conformes au plan et dans l'ordre des grilles, cycle complet dans le
  navigateur (**32/32** acceptées, types `intervalle`, `paire`, `texte`,
  `qcm` et `vraifaux` compris), chaque équation à solution unique
  acceptée avec et sans accolades, aucune erreur MathJax ni console,
  capture d'écran de la section équations/inéquations sur un chargement
  neuf.

  **Même jour, mise en page du bloc « Calculs plus avancés » (demande de
  David : « revoir la mise en page pour les blocs des calculs
  avancés »), fiche 10 uniquement pour l'instant** : une question seule
  dans son groupe s'affichait avec un « a) » inutile et dans une carte
  d'une demi-largeur (grille à 2 colonnes dès 600 px), ce qui écrasait
  les énoncés longs sur 3 ou 4 lignes à côté d'une moitié vide.
  Corrigé dans `construireGrilles()` : classe `question-seule` ajoutée
  quand le groupe n'a qu'une question, et lettre vide dans ce cas. CSS :
  `.question-seule { grid-column: 1 / -1; }` (dans le bloc ≥ 600 px),
  `.question-seule .q-mathfield { max-width: 340px; }` (sinon le champ
  MathLive, renvoyé à la ligne, s'étirait sur toute la largeur),
  `.q-lettre:empty { display: none; }` (sinon l'emplacement vide de la
  lettre décalait le texte). Concerne les 6 questions seules de la
  fiche (10.4, 10.8, 10.10 à 10.13). Au passage, `sansEgal:true` sur
  10.12 (« … sous la forme \(\exp(\ldots)\) = ») et sur 10.9 a-d
  (« À quelle courbe correspond … ? = ») : le « = » ajouté
  automatiquement n'a pas de sens après une phrase ou une question.
  Vérifié : 6 cartes pleine largeur sans lettre, 32/32 réponses
  toujours acceptées, captures d'écran. **Même défaut présent dans 23
  autres fiches de Première** (toutes celles qui ont au moins une
  question seule ; la fiche 6 retire déjà la lettre mais garde la
  demi-largeur) : ~~non corrigé, en attente de l'accord de David~~ →
  **étendu à toutes les fiches de Première le même jour** (David :
  « oui, applique à toutes les fiches »). Script Node sur les 27 autres
  fiches, remplacements exigeant exactement une occurrence chacun.
  Particularités : la fiche 13 contient deux définitions de
  `construireGrilles()` (la première, ancienne, est masquée par la
  seconde) — seule la dernière a été modifiée ; la fiche 19 avait déjà
  sa propre version (`question-pleine-largeur`, portée depuis la
  Seconde le 22/09) — seule la limite de largeur du champ MathLive y a
  été ajoutée ; la fiche 6 retirait déjà la lettre. Vérifié : syntaxe
  des 28 fiches, puis chargement réel de chacune dans le navigateur
  (dans un `iframe`) : autant de cartes pleine largeur que de groupes à
  une question, aucune lettre affichée sur ces cartes, nombre de
  questions affichées égal au nombre d'exercices générés, aucune erreur
  console (contrôle visuel sur la fiche 21, 5 questions seules).

  **Fiches 11 à 15 faites en autonomie à la suite (26/09/2026)** (David :
  « fait les 5 prochaines fiches en autonomie. Je vérifierai
  ensuite ! »). Outillage commun : script
  `outil-fiche.js` (scratchpad de session) qui supprime un item en
  isolant son bloc `{ … }` (un seul `ex.push` par bloc exigé),
  renomme des id en passant par des id temporaires (pas de collision),
  supprime/renumérote titres et grilles, reconstruit `groupes` depuis
  l'ordre des id dans `genererExercices()` et vérifie que les lettres
  suivent la position. Chaque remplacement exige un nombre exact
  d'occurrences, sinon rien n'est écrit. Batterie de tests commune dans
  le navigateur, sur chaque fiche : 500 tirages auto-cohérents ; pour
  les fiches de dérivation, comparaison de chaque réponse stockée à une
  dérivée numérique indépendante (différences finies sur `_fAscii`) ;
  cinq cycles complets avec les vrais champs ; ordre du tableau = ordre
  des grilles ; **balayage des énoncés affichés à la recherche de
  défauts de mise en forme** (`+0`, `+-`, `--`, `1x`, `^{1}`,
  `undefined`, …) sur 500 tirages.

  **Titres en LaTeX** : dans les fiches traitées, toute notation
  mathématique des titres passe en `\(…\)` (\(x\in\mathbb{R}\),
  \(n\geqslant 2\), \(f\), \(I\), …). Fait aussi rétroactivement sur les
  titres des fiches 9 et 10 (« Soit x ∈ ℝ », « 2ᵃ », « inconnues x et
  y », « fonction f ») pour la cohérence. Piège rencontré : un premier
  passage via `node -e` dans le shell a mangé les barres obliques
  inverses (titres affichant `(xinmathbb{R})`), réparé aussitôt avec un
  script en fichier utilisant `String.raw` — à retenir : ne jamais
  passer de LaTeX par une chaîne de commande shell.

  *Fiche 11 (cahier 3, Dérivation et exponentielle I) : 58 → 34
  questions, 15 → 10 groupes.*
  - Automatismes 11.1/11.2/11.3 (4+4+4) → 2+2+2 : trois sujets
    distincts (fractions en \(n\), puissances \(2^a3^b\), radicaux).
    11.1 garde a) (somme de trois fractions) et d) (dénominateur commun
    à factoriser, le plus complet) ; 11.2 garde a) (produit) et c)
    (différence à factoriser) — b) même technique que c), d) statique
    et cumulant tout ; 11.3 garde b) et c), les deux seuls qui
    répondent vraiment au titre (dénominateur sans radical).
  - 11.4 (6) → 4 : a) et b) étaient un doublon exact ; e)
    (demi-somme) couverte par f) (combinaison de deux exponentielles).
  - 11.5 + 11.6 (titre identique, 3+3) → 11.5, 4 : 5a, 5b, 5c + 6b
    (seul à faire intervenir \(n\)) ; 6a ≈ 5a, 6c cumule.
  - 11.7/11.8/11.9 « Exponentielles et produits (I)/(II)/(III) »
    (2+4+4) → 11.6, 4 : 7a (produit de deux expressions en
    exponentielle), 8a (\(x\exp(px)\), classique), 8d (racine carrée),
    9a (polynôme × exponentielle).
  - 11.10 « quotients » (4) → 11.7, inchangée.
  - 11.11 « Équation de tangente (I) » (QCM, 4) + 11.12 « (II) »
    (équation à écrire, 4) → 11.8, les 4 de l'ancien 11.12 : même
    compétence, la version QCM en est la forme plus facile. « (sous la
    forme y=ax+b) » retiré des 4 énoncés (déjà dans le titre, « équation
    réduite », et dans la bulle d'aide — même décision que 8.6).
  - 11.13 « Variations » (QCM, 4) → 11.9, inchangée sauf options en
    LaTeX (« \(f\) est croissante sur \(I\) »).
  - 11.14 + 11.15 « Composée (I)/(II) » (4+4) → 11.10, 4 : 14a, 14c,
    15a, 15c.
  - **Défauts préexistants corrigés** : (1) ancien 11.10 c) (quotient) :
    quand \(p<0\), la réponse stockée contenait `(…)*-2*exp(-2x)` ; le
    calcul restait juste mais la conversion en LaTeX perdait la
    multiplication, si bien que le corrigé affiché (« Voir toutes les
    réponses ») montrait une soustraction, donc une formule fausse
    (échec du cycle de test 8 fois sur 15) — terme réécrit avec le signe
    explicite ; (2) ancien 11.12 a) affichait « \(4\exp(3x)+0\) » quand
    la constante tirée valait 0 ; (3) ancien 11.15 c) affichait
    « \(\dfrac{x-0}{x^2+2}\) » — constante désormais non nulle. Les deux
    derniers trouvés par le balayage automatique des énoncés.
  - Vérifié : 12 000 dérivées comparées aux différences finies (0
    écart), 0 échec sur 500 tirages, 34/34 sur 5 cycles complets, ordre
    OK, balayage d'affichage vide, rendu contrôlé à l'écran.

  *Fiche 12 (cahier 3, Dérivation et exponentielle II) : 56 → 37
  questions, 17 → 11 groupes.*
  - Automatismes « Factorisation (I) » + « (II) » (4+4) → un seul
    groupe de 6 (règle des 6 automatismes ; plafond 4 des fusions non
    appliqué ici puisque c'est toute la section automatismes) : 1a, 1b
    (facteur commun), 1d (différence de carrés cachée), 2a (identité
    puis facteur commun), 2c (\(x^4-k^4\), double identité), 2d (deux
    variables). Écartés 1c (≈ 1d avec une étape de plus) et 2b (≈ 2a).
    `FORMES_FACTORISEES` réduit à `'12.1'` (l'ancienne clé `'12.2'`
    aurait sinon imposé la forme factorisée au nouveau 12.2, les
    sommes).
  - Deux séries parallèles fusionnées par opération (même compétence,
    \(e^x\) puis \(e^{ax+b}\)) : **sommes** 12.3 + 12.6 → 12.2 (2+2,
    tout gardé) ; **produits** 12.4 + 12.7 → 12.3 (4a \(xe^x\), 4c
    \((Ax+B)e^x\), 7a \((Ax^2+B)e^{px+q}\), 7c produit de deux sommes
    d'exponentielles ; écartés 4b ≈ 7a, 4d et 7d carrés, 7b) ;
    **quotients** 12.5 + 12.8 → 12.4 (5a, 5c, 8c, 8e ; écartés 5b, 5d,
    8a trivial, 8b, 8d, 8f). Blocs déplacés physiquement pour que
    l'ordre du tableau suive l'affichage.
  - 12.9 (un quotient long, 1 question) → 12.5, gardée à part : cas
    cumulatif nettement au-dessus de la gradation des quotients.
  - 12.10 (exponentielle et racine) → 12.6, 12.11 (nombres dérivés) →
    12.7, 12.12 (tangentes) → 12.8 (« (sous la forme y=ax+b) » retiré
    des 4 énoncés, le titre dit déjà « On attend des équations de la
    forme \(y=mx+p\) »), 12.13 (QCM variations) → 12.9 : inchangées.
  - Composées (I)/(II)/(III) (4+3+4) → 12.10, 4 : 14a
    (\(e^{kx^3}\)), 14b (\(e^{k\sqrt{x}}\)), 15c (\(e^{e^{kx^2}}\),
    double composition), 16a (produit et composée). « Sur ℝ, » répété
    en tête des énoncés → une fois dans le titre (« Sauf indication
    contraire, les fonctions sont définies sur \(\mathbb{R}\) »), seul
    14b garde son domaine.
  - 12.17 (somme en trois étapes dépendantes, « En déduire ») → 12.11,
    non fusionnée (règle 3bis). La phrase « Soit x un réel strictement
    positif et n un entier… » répétait mot pour mot le titre : retirée
    de l'énoncé a).
  - Intervalles affichés passés au point-virgule (convention du site) :
    titre de 12.6, 12.10 b), options du QCM 12.9.
  - **Défauts préexistants corrigés** : (1) 12.10 c)
    (\(e^{e^{kx^2}}\)) : pour \(k=3\), une réponse juste était
    refusée environ une fois sur cent — le vérificateur teste en des
    points \(x\) pris entre −1 et 7 et \(e^{e^{3x^2}}\) déborde dès que
    \(|x|>1{,}5\), si bien qu'il ne trouve parfois pas les 6 points
    valides nécessaires ; \(k\) restreint à \(\{-3;-2;-1;1\}\) (0 échec
    sur 3 000 tirages ensuite) ; (2) 12.7 b) affichait
    « \(e^{-x}+0\) » ; (3) 12.3 b) affichait « \((-2x)e^x\) » —
    constantes désormais non nulles.
  - Vérifié : 6 300 dérivées comparées aux différences finies (0 écart),
    0 échec sur 500 tirages, 36/37 sur 5 cycles complets — la seule
    question non validée par le test automatique est 12.11 b) (réponse
    de type somme Σ) : le vérificateur l'accepte bien (appel direct à
    `checkSomme`, sous forme Σ comme sous forme fermée), c'est
    l'injection programmée d'un `\displaystyle\sum` dans MathLive qui
    ne se relit pas (limite de test déjà connue, question inchangée).
    Rendu contrôlé à l'écran.

  *Fiche 13 (cahier 4, Généralités sur les suites) : 62 → 29
  questions, 18 → 15 groupes.* Structure particulière : chaque groupe
  13.4 à 13.16 porte **sa propre suite** dans un paragraphe d'énoncé
  (`texte-13-N`, régénéré par `mettreAJourTextesAvances()`), et ses 4
  questions demandent les termes successifs (\(u_0\) à \(u_3\), ou
  \(u_1\) à \(u_4\)). Deux suites différentes ne peuvent pas partager
  une grille : même traitement que les fiches 8.6-8.8 (2 questions par
  contexte partagé), plus suppression des suites qui répètent un type
  déjà présent.
  - Automatismes 13.1 (3) + 13.2 (3) + 13.3 (2) → 3+2+1 : 13.3 a) et
    b) étaient deux tirages du même générateur (gardé un seul, titre
    passé au singulier) ; 13.2 b) (\(\frac{x}{a}+\frac{x}{b}\)) écarté,
    le plus simple des trois.
  - Suites explicites 13.4 à 13.8 : 2 questions chacune. 13.4 et 13.5 :
    \(u_1\) et \(u_3\) (\(u_0\) du polynôme = son terme constant).
    13.6 garde \(u_{n+1}\) et \(u_n+1\) (le contraste est le piège
    visé). 13.7 : \(u_{n+1}\) et \(u_{2n+1}\). 13.8 : \(v_{2n}\) et
    \(v_{2n+1}\) (contraste de parité).
  - Suites récurrentes 13.9 à 13.14 (6 suites × 4 termes = 24 questions
    de calcul de termes) → 3 suites de types distincts, 2 termes
    (\(u_2\), \(u_4\)) chacune : 13.9 affine, 13.11 \((n+k)u_n\) →
    13.10, 13.13 \(\sqrt{u_n^2+\dots}\) → 13.11. Supprimées : 13.10
    (\(-u_n+B\), cas particulier d'affine), 13.12 (\(B^nu_n\), même
    idée que \((n+k)u_n\)), 13.14 (\((n+\frac12)u_n\), idem avec des
    fractions). Leurs paramètres (`g10`, `g12`, `g14`) et leurs lignes
    dans `mettreAJourTextesAvances()` retirés, paragraphes
    `texte-13-N` renumérotés dans le HTML et dans la fonction.
  - Suites avec paramètre 13.15, 13.16 → 13.12, 13.13, 2 termes chacune
    (\(v_2\), \(v_4\) ; \(w_3\), \(w_4\) — \(w_1\) valait
    simplement \(w_0\)).
  - Avancés 13.17, 13.18 → 13.14, 13.15, inchangés.
  - **Défauts préexistants corrigés** (trouvés par le balayage) :
    « \((-1)^1\) » en 13.1 c), « \(n^2+0\) » en 13.15 b),
    « \(u_{n+1}=3u_n+0\) » dans l'énoncé de 13.9.
  - Vérifié : 0 échec sur 500 puis 2 000 tirages, 29/29 sur 5 cycles
    complets, ordre OK, balayage des énoncés **et des paragraphes de
    contexte** vide, rendu contrôlé à l'écran sur un chargement neuf.

  *Fiche 14 (cahier 4, Suites arithmétiques) : 44 → 27 questions,
  15 → 14 groupes.* Même structure que la fiche 13 (une suite par
  groupe, contexte `texte-14-N`).
  - Automatismes 14.1 (4) + 14.2 (3) + 14.3 (4) → 2+2+2 : 14.1 garde
    une somme et « entier − fraction » (b et c : doublons de signe) ;
    14.2 garde a) (\(\frac{p}{q}x=C\)) et c) (inconnue des deux
    côtés) ; 14.3 garde a) (carré égal à un non-carré, deux racines
    irrationnelles) et d) (\((x-P)^2=(x-Q)^2\)).
  - Premières suites 14.4 à 14.7 : 2 termes par suite ; 14.4 (\(u_0\)
    donné) : \(u_3\), \(u_{100}\) ; 14.5 (\(u_1\) donné, décalage
    \(n-1\)) : \(u_4\), \(u_{100}\) ; ancien 14.7 (\(u_K\) donné) →
    14.6 : \(u_1\), \(u_{101}\). **Ancien 14.6 supprimé** (premier
    terme fractionnaire : même calcul que 14.5, la difficulté ajoutée
    n'étant que l'arithmétique des fractions, déjà en automatismes).
  - Secondes suites (raison inconnue) : 14.8 → 14.7 garde \(r\) et
    \(u_0\) ; 14.9 (termes fractionnaires, 2) → 14.8 inchangée.
  - 14.10 à 14.15 → 14.9 à 14.14, inchangées (14.12 → 14.11 reste
    figée, voir la note de la fiche dans la mémoire projet).
  - **Consigne factorisée** : dans 14.4 à 14.8, chaque question
    commençait par « Calculer » ; le mot passe une seule fois à la fin
    du paragraphe de la suite (« … Calculer : »), comme dans la fiche
    13, et les questions se réduisent à \(u_3\), \(r\), etc.
  - **Défauts préexistants corrigés** : (1) 14.3 d) (« donner
    l'ensemble des solutions ») attendait un nombre nu, `{…}` y était
    refusé (même défaut que dans la fiche 10) → réponse au format
    ensemble ; (2) « \(\frac{1x}{3}\) » en 14.2 c) ; (3)
    « \((x-0)^2\) » en 14.3 d) ; (4) « \(5u_n+0\) » et « \(u_n-0\) »
    dans l'énoncé de l'ancien 14.14.
  - Note de test : dans cette fiche les réponses de type ensemble se
    saisissent dans un champ MathLive. La forme `\left\{…\right\}`
    produite par le corrigé ne se relit pas (`\{…\}` en ascii-math,
    refusé), mais une **vraie frappe clavier** de « {3/2} » donne
    `\lbrace3/2\rbrace` → `{3/2}`, accepté : vérifié en tapant
    réellement dans le champ. Le test automatique injecte donc la
    forme `\lbrace…\rbrace`.
  - Vérifié : 0 échec sur 500 puis 2 000 tirages, 27/27 au cycle
    complet, balayage énoncés et contextes vide, cohérence
    contexte/réponse recalculée à la main sur 14.6 (\(u_6=10\),
    \(r=8\) ⇒ \(u_1=-30\), \(u_{101}=770\)), rendu contrôlé à l'écran.
  - Retouche ultérieure (même jour, trouvée par le balayage des
    fractions de la fiche 15) : 14.2 b) (équation) pouvait afficher des
    coefficients réductibles comme \(\frac{3}{6}\), une simplification
    préalable sans rapport avec la question → tirés irréductibles. Les
    fractions réductibles de 14.1 (« écrire sous forme de fraction
    irréductible ») sont laissées : les réduire fait partie de
    l'exercice (même critère qu'en Seconde, fiche 3).

  *Fiche 15 (cahier 4, Suites géométriques) : 38 → 28 questions, 14
  groupes (aucun groupe supprimé).* Fiche déjà compacte (2 questions
  par suite pour l'essentiel) : la réduction porte sur les
  automatismes.
  - Automatismes 15.1 (4) + 15.2 (6) + 15.3 (2) + 15.4 (2) = 14 →
    2+2+1+1 : 15.1 garde a) (carré) et d) (forme canonique à
    développer) ; 15.2 garde b) (\((A-Bx)^2-C^2\)) et f) (facteur commun
    binôme) ; 15.3 (images) garde \(f\left(\frac{p}{q}\right)\) ; 15.4
    (antécédents) garde celui de \(-\frac{p}{q}\) (celui de 0 est
    immédiat) — paragraphe passé au singulier (« Déterminer
    l'antécédent de : »).
  - 15.11 (4) → 2 : \(q\) et \(u_{3n}\) (sous-suite, compétence
    distincte de celles de 15.8/15.9, qui demandent déjà \(q\) et
    \(u_0\)).
  - 15.5 : « Calculer » factorisé dans l'énoncé de la suite, comme en
    fiche 14.
  - 15.12 et 15.13 (étapes dépendantes, « Donner alors », « question
    précédente ») : inchangés (règle 3bis). Le reste inchangé.
  - **Défauts préexistants corrigés** : (1) 15.2 f) (devenu b) n'avait
    **aucun délimiteur LaTeX** alors que `texteLibre` est vrai : son
    expression s'affichait en texte brut ; (2) le même item pouvait
    afficher des facteurs réduits à un monôme ou une constante
    (« \((4x)\) », « \((5)\) ») → coefficients non nuls ; (3)
    « \(4u_n+-3\) » dans l'énoncé de 15.12 ; (4) fractions affichées
    réductibles : « \(\frac{4}{2}\) » en 15.1 b), « \(u_1=\frac{4}{4}\) »
    dans l'énoncé de 15.13.
  - Nouveau contrôle ajouté à la batterie à cette occasion : balayage
    des `\dfrac{p}{q}` affichés réductibles, relancé sur les fiches 11 à
    15 (seul 14.2 b) en est ressorti, voir ci-dessus).
  - Vérifié : 0 échec sur 2 000 tirages, 28/28 sur 5 cycles complets,
    balayages vides, rendu contrôlé à l'écran.

  **Bilan du lot 11-15** : 58+56+62+44+38 = 258 → 34+37+29+27+28 = 155
  questions. Rien n'est poussé : en attente de la vérification de David.
  → Poussé le même jour après son « pousse tout ».

  **Fiches 16 à 20, même jour** (David : « continue les 5 prochaines »),
  même outillage et même batterie de tests que pour 11-15, augmentée du
  balayage des fractions affichées réductibles.

  *Fiche 16 (cahier 5, Calcul de sommes I) : 46 → 30 questions, 14 →
  12 groupes.*
  - Automatismes 16.1 (3) + 16.2 (4) + 16.3 (3) → 2+2+2 : 16.1 garde
    b) (généralise a) et c) ; 16.2 garde c) et d), **les deux seuls qui
    utilisent vraiment la quantité conjuguée** annoncée par le titre
    (a et b se traitaient en multipliant par \(\sqrt{D}\)) ; 16.3 garde
    a) et c). Le titre de 16.3 excluait \(m=2\) uniquement à cause du
    dénominateur \(m-2\) de l'ancien b) : exclusion retirée.
  - 16.4 (5) → 4 : c) retiré (bornes décalées en haut ET en bas,
    cumule a et b).
  - « Utilisation du symbole de somme (I) » + « (II) » (4+4) → 16.7,
    4 : \(\frac{1}{B}+\dots+\frac{1}{B^n}\) (classique), deux bases,
    exposant multiple (\(A^{Bk}\)), somme alternée harmonique jusqu'à
    \(2n+1\). Le « Soit \(n\in\mathbb{N}\). » répété en tête de deux
    énoncés passe dans le titre.
  - 16.8 et 16.10 (même titre mot pour mot, « Soit n∈ℕ*. Calculer : »,
    6+5) → 16.8, 4 : \(\sum_{k=L}^n2^k\), \(\sum A^k\), \(\sum(A+2^k)\),
    \(\sum(Ak+q\,3^k)\). Écartés : \(\sum 1\) (immédiat), \(\sum(-1)^k\)
    (réponse 0 sans calcul), les variantes de bornes de \(2^k\) et les
    combinaisons à trois termes.
  - 16.11 (somme des impairs, titre régénéré par JavaScript) → 16.9 :
    le numéro était écrit en dur dans `mettreAJourTextesAvances()`,
    mis à jour avec l'identifiant du titre. 16.12, 16.13, 16.14 (étapes
    dépendantes) → 16.10, 16.11, 16.12, inchangés.
  - Vérifié : 0 échec sur 500 tirages, 26/26 sur 5 cycles complets
    (les 4 réponses Σ, non injectables dans MathLive, vérifiées
    directement : une somme juste écrite avec des indices décalés est
    acceptée, une fausse est refusée), balayages vides, rendu contrôlé.

  *Fiche 17 (cahier 5, Calcul de sommes II) : 54 → 41 questions, 17 →
  15 groupes.* Réduction plus modérée : la moitié avancée de la fiche
  est faite de problèmes à étapes dépendantes (règle 3bis).
  - Automatismes 17.1 + 17.2 (3+2 = 5, déjà ≤ 6) : inchangés en nombre.
  - 17.3 et 17.4 avaient **le même contexte** (« On considère deux
    réels \(a\) et \(b\) ») et la même démarche (compter les termes,
    développer, multiplier pour obtenir \(a^{N+1}\mp b^{N+1}\)) → un
    seul groupe de 4 : les trois questions de 17.3, plus la
    multiplication de 17.4 (version alternée, \(a^{N+1}+b^{N+1}\)).
    17.5 (même somme avec \(b=-1\)) supprimée.
  - Sommes arithmétiques 17.7 et 17.8 (3 chacune, contexte propre) → 2
    chacune : une somme numérique et la formule en fonction de \(N\).
    « Calculer » retiré des questions (déjà en fin de contexte).
  - Sommes géométriques 17.10 (4, avec \(u_0\), \(q\)) et 17.11 (4,
    sommes directes) → 2 + 2 : gardées les bornes décalées et
    \(\sum_{1}^{2n}\) ; \(\frac{A^k}{B^{k+1}}\) et la différence de deux
    sommes géométriques. Écartés : raison \(\sqrt{D}\) (calcul lourd),
    exposant symbolique \(A^p\), les deux cumuls.
  - Arithmético-géométriques (I) guidée et (II) sans guidage : gardées
    toutes deux (problèmes à étapes, et la seconde retire l'aide).
  - Série alternée (6) → 4 : les deux différences \(v_{n+1}-v_n\),
    \(w_{n+1}-w_n\) et les deux QCM de monotonie qui en découlent ;
    retirés \(u_3\) (échauffement) et \(w_n-v_n\).
  - Titres : notations en LaTeX (\(x\), \(1\), \(n\)).
  - **Défauts préexistants corrigés** : « \(x+-4\) » en 17.2 a) et b) ;
    en 17.1 b), fractions affichées réductibles avec le signe dans le
    numérateur (« \(\frac{-6}{6}+\frac{1}{6}x\) ») → irréductibles,
    signe sorti ; « \(\frac{6}{2}\) » en 17.1 c). **Contrôle
    d'équivalence** après ces retouches : l'énoncé affiché, relu par
    MathLive, a été comparé numériquement à la réponse stockée pour
    chaque automatisme retouché (égalité vérifiée).
  - Vérifié : 0 échec sur 500 puis 2 000 tirages, 37/37 sur 5 cycles
    hors réponses Σ (vérifiées directement), ordre OK, balayages vides
    (hormis le faux positif « \(S(0)\) »), rendu contrôlé.

  *Fiche 18 (cahier 5, Calcul de produits) : 37 → 31 questions, 14 →
  12 groupes.* Fiche déjà compacte.
  - Automatismes 18.1 + 18.2 (3+3 = 6) : inchangés.
  - « Écritures (I) » + « (II) » (4+4) → 18.3, 4 :
    \(1\times2\times\cdots\times N\), \(k^{k+D}\) (exposant décalé),
    \((k^2+C)x_k\) (indicé), \((x_k+y_{n-k})\) (indices croisés).
    Écartés : \(k^k\) (≈ \(k^{k+D}\)), produit constant \(C\times\cdots
    \times C\), et deux produits indicés plus simples.
  - « Un produit constant » + « bis » (QCM, 1+1) → 18.6, un groupe de 2.
  - Télescopage (I), guidé (\(b_1,b_2,b_3,b_{n-1}\)) → 2 questions :
    \(b_2\) et \(b_{n-1}\).
  - Reste inchangé (renumérotation), titres en LaTeX (\(a\), \(b\),
    \(c\), \(\Pi\), \(\Sigma\), \(n\geqslant 3\), \(n\in\mathbb{N}\)).
  - Formatage : cette fiche écrit `{id: "…"` (avec espace) ; normalisé
    en `{id:"…"` pour l'outillage, sans effet sur le fonctionnement.
  - **Défaut préexistant corrigé** : deux énoncés (ancien 18.4 d),
    produit \((x_0+y_n)\cdots(x_n+y_0)\), et ancien 18.5 b)) étaient
    plus larges que leur demi-carte et **coupés à droite**. Un
    défilement horizontal essayé d'abord n'était pas satisfaisant ;
    écriture raccourcie (termes intermédiaires retirés, motif intact :
    \((x_0+y_n)(x_1+y_{n-1})\times\cdots\times(x_n+y_0)\)). Contrôle
    de débordement ajouté à la batterie (position droite de chaque
    formule comparée à celle de sa carte, sur plusieurs tirages) et
    relancé sur les fiches 11 à 18 : aucun autre débordement.
  - Vérifié : 0 échec sur 500 tirages, tout le reste accepté sur 5
    cycles (dont les **deux** bonnes réponses du QCM à double réponse),
    les réponses Π/Σ vérifiées directement : formes équivalentes
    (autre nom de variable, ordre inversé, indice décalé écrit
    \(x_{k-1}\)) acceptées, formes fausses refusées.
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
- **Fiche 6 de Première (cahier 2, dérivation), 25/09/2026** : David signale
  que 6.5 et 6.6 n'ont qu'une seule question chacune, mais affichaient quand
  même la lettre « a) » — inutile. `construireGrilles()` (locale à chaque
  fiche) calcule toujours la lettre par position dans le tableau
  `lettresEtendues[pos]`, indépendamment du nombre réel de questions du
  groupe : un groupe réduit à 1 exemple (convention déjà en place ailleurs :
  id sans lettre, `{id:"6.5", ...}`) affiche quand même « a) » tant que
  `construireGrilles()` n'est pas averti. Corrigé en ne calculant la lettre
  que si `indices.length > 1` (sinon chaîne vide, et le `)` retiré avec
  elle) — corrige au passage 6.7, dans le même cas mais non signalé
  explicitement, cohérence entre les trois groupes voisins. **Ce correctif
  est local au fichier de la fiche 6** (chaque fiche a sa propre copie de
  `construireGrilles()`) : à vérifier au cas par cas sur toute autre fiche
  qui aurait le même défaut, pas un correctif de portée automatique.

  Au passage, David demande d'agrandir légèrement les graphiques de 6.5 et
  6.6. 6.5 (courbe unique de \(f'\)) : taille explicite ajoutée à son appel
  de `genererSVGCourbe` (340×260 → 380×290), sans toucher au défaut de la
  fonction (partagé avec 6.3/6.4, non concernés par la demande). 6.6 et 6.7
  partagent la même fonction `construireGraphiqueQCMCourbe` (trois petites
  courbes still), désormais paramétrée en largeur/hauteur (défaut inchangé
  240×185) : seul l'appel de 6.6 passe une taille plus grande (265×205),
  6.7 reste à la taille d'origine, non demandée.

  Vérifié : syntaxe, cycle dans le vrai navigateur (lettre absente
  confirmée sur 6.5/6.6/6.7 par lecture directe du DOM, présente sur les
  groupes à plusieurs questions comme 6.3), capture d'écran confirmant le
  rendu agrandi des deux graphiques concernés et la taille inchangée de
  6.7.

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
2. Serveur de dev local : `.claude/launch.json` référence
   `.claude/static-server.ps1` en chemin relatif — les deux sont suivis par
   git, donc ça fonctionne tel quel sur n'importe quel clone, plus besoin de
   corriger un chemin en dur par machine (piège rencontré le 17/09/2026,
   éliminé le 18/09/2026 en sortant le script du scratchpad de session pour
   le verser dans le dépôt).
3. Pour utiliser `outils/creer-comptes` ou `outils/etiquettes` : `npm install`
   dans chaque dossier, et vérifier que `outils/creer-comptes/service-account.json`
   est présent (sinon le retélécharger depuis Console Firebase → Paramètres
   du projet → Comptes de service). Ce fichier (et les CSV/PDF générés) ne
   sont jamais suivis par git, et depuis l'abandon du montage Drive ne
   voyagent plus automatiquement d'une machine à l'autre : à recopier
   manuellement sur chaque nouveau clone, ou à régénérer/retélécharger.
