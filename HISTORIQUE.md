# Historique détaillé du projet (journal)

**Ce fichier n'est pas à lire à l'ouverture d'une session.** Il conserve,
tel quel, le journal détaillé de toutes les modifications et décisions
jusqu'au 02/10/2026 (ancien contenu de `SUIVI-FIREBASE.md`, déplacé ici lors
de la réorganisation du 02/10/2026), puis les nouvelles entrées datées,
ajoutées **à la fin** du fichier.

- État actuel, procédure et pièges : `SUIVI-FIREBASE.md` (court, lu à
  chaque session).
- Règles de rédaction des fiches : `REGLES-FICHES.md`.
- Ici : le *pourquoi* d'une décision passée, le détail d'un chantier, les
  vérifications faites — à consulter par recherche (`grep`) au besoin.

⚠️ **Numérotation des fiches de Première** : toutes les entrées antérieures
au 30/09/2026 (suppression des fiches 4 et 5) parlent des **anciens**
numéros — ancienne fiche N = fiche N−2 actuelle pour N = 6 à 28 (ex.
« fiche 6 de Première » = l'actuelle fiche 4).

⚠️ Certaines parties décrivent des états depuis remplacés (ancien tableau
de bord « Fiches », suivi hors devoir, couleur orange des mises en valeur…) :
la référence à jour est toujours `SUIVI-FIREBASE.md`.

---

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
git fetch
git status
git log origin/master..HEAD --oneline   # commits locaux non poussés
git log HEAD..origin/master --oneline   # commits de GitHub pas encore récupérés
git branch -a
```

Depuis le 02/10/2026, `CLAUDE.md` fait faire ce `git fetch` à chaque
ouverture de session, puis un `git pull --ff-only` quand la machine est en
retard et que rien n'est modifié localement (sinon : arrêt et explication).
Sans `git fetch`, un retard sur GitHub passait inaperçu.

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
- `/tableau-de-bord/` : réservé à l'enseignant. **Depuis le 29/09/2026, seule
  page restante : `devoirs.html`** (suivi des devoirs donnés uniquement — voir
  l'entrée du 29/09/2026 plus bas). L'ancienne page `index.html` (liste par
  classe avec fiches effectuées/connexions hors devoir, détail par élève,
  onglets Première "Cahiers de calcul"/"Automatismes") a été supprimée à cette
  date, sur demande de David : plus de suivi enseignant en dehors des devoirs
  donnés. Le paragraphe qui suit (onglets, piège `.tdb-onglets[hidden]`)
  décrit cette page supprimée — gardé pour l'historique.
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

  *Fiche 19 (cahier 6, Probabilités) : 75 → 53 questions, 24 → 23
  groupes.* Fiche la plus chargée en dépendances (tableaux
  `table-19-N`, arbres SVG `arbre-19-N`, titres et paragraphes
  régénérés par `mettreAJourTextesAvances()`) : le moins de groupes
  possible supprimés, réduction surtout à l'intérieur des groupes. Les
  identifiants internes (`table-`, `arbre-`, `titre-`, `texte-`) gardent
  leur ancien numéro ; seuls les numéros **affichés** changent, y
  compris ceux écrits en dur dans les gabarits des cinq titres
  dynamiques.
  - Automatismes : 19.1 et 19.2 (même titre, « Calculer : », 3+2) → un
    seul groupe de 4 (produit de décimaux, produit de fractions,
    \(p\,q+(1-p)\,r\), somme pondérée), + 19.3 (2) → 19.2 : total 6.
  - Tableaux, arbres et problèmes concrets (6, 6, 6, 6, 5, 4, 4
    questions) → 3 chacun, en couvrant des notions complémentaires :
    tableau de probabilités \(P(\overline{A})\), \(P(A\cup B)\),
    \(P(\overline{A}\cap B)\) ; tableau d'effectifs \(P(B)\),
    \(P(A\cap B)\), \(P(\overline{A}\cap\overline{B})\) ; ski/randonnée :
    intersection, réunion, \(P_R(S)\) ; arbre : \(P(C\cap\overline{D})\),
    \(P(D)\) (probabilités totales), \(P_D(C)\) (inversion) ; musique :
    \(P(J\cap S)\), \(P(S)\), \(P_S(J)\) ; arbre à trois branches :
    \(P(C)\), \(P(D)\), \(P_D(A)\) ; arbre en \(x\) : les trois
    dernières. Tableau en \(n\) (4) → 2 : les deux conditionnelles.
  - Conditionnelles (II) (3) et les deux groupes « indépendants » (3+3)
    → 2 chacun ; (I) et (II) gardées séparées (données différentes dans
    le titre dynamique).
  - **Consigne factorisée** : dans 14 groupes dont l'intro dit déjà
    « Calculer les probabilités suivantes » ou « Calculer : », le mot
    « Calculer » était répété en tête de chaque question (51
    occurrences retirées), ainsi que « , sous forme de fraction
    irréductible » (4). « Simplifier » idem en 19.2. Deux questions
    recopiaient mot pour mot le contexte du groupe (ancien 19.21 a :
    « Soit \(a\in]0,1[\). Calculer P(B) » ; ancien 19.24 a : phrase
    entière du titre répétée) → réduites à \(P(B)\), \(E(X)\).
  - Math en texte brut passé en LaTeX : « Calculer m pour que
    E(X+m)=0 » (→ « Déterminer \(m\) pour que \(E(X+m)=0\) »),
    « P(B) », « E(X) », « A et B » (HTML et gabarits JS), « variable
    aléatoire X », \(p\), \(a\), \(n\in\mathbb{N}^*\), \(x>0\) ;
    intervalles \(]0;1[\) au point-virgule.
  - Vérifié : 0 échec sur 500 tirages, 53/53 sur 5 cycles complets,
    ordre OK, balayage des énoncés, titres, paragraphes et tableaux
    vide, **aucun SVG « NaN »** au chargement (bug différé de cette
    fiche, voir mémoire : non reproduit ici, code des arbres non
    touché), rendu contrôlé.

  *Fiche 20 (cahier 7, Droites du plan) : 50 → 38 questions, 21 → 19
  groupes.* Un contexte par groupe (`texte-20-N`, ici construit avec
  des variables `g5`, `g12`… et non `p5` : lignes retirées à la main).
  - Automatismes 20.1 (4) + 20.2 (4) → 3+3 : retirés 20.1 d) (quotient
    de radicaux, cumule) et 20.2 a) (le plus simple) ; « Résoudre »
    retiré des questions (déjà dans le titre).
  - Supprimés : 20.5 « Droites passant par deux points (II) »
    (coordonnées fractionnaires, entre 20.4 entiers et 20.6 radicaux ;
    le titre de 20.4 perd son « (I) ») et 20.12 (intersection avec une
    droite verticale, cas trivial de l'intersection générale).
  - Réduits : 20.6 (radicaux) 3 → 2 ; détermination graphique 4 → 3
    (l'équation cartésienne et la réduite de la même droite : gardée la
    réduite) ; calculs de coordonnées 4 → 2 ; parallèles 2 → 1 ;
    paramètres (II) 2 → 1 (la question retirée avait toujours pour
    réponse 0) ; intersections avec les axes 3 → 2 (les deux axes
    étaient symétriques).
  - 20.7 d) (droite horizontale) demandait « sous la forme y=k (donner
    juste k) » : contraire à la règle « une droite s'écrit y=mx+p »
    (mémoire) → réponse attendue sous forme d'équation réduite, comme
    les autres droites. « , sous la forme y=ax+b » retiré de 6 énoncés
    (bulle d'aide `formeYax`). « (d1) », « (d2) » des énoncés passés en
    \((d_1)\), \((d_2)\) comme dans les contextes ; point
    « (x1,y1) » de 20.9 en LaTeX et au point-virgule.
  - **Bug de correction préexistant corrigé (important)** :
    `checkPointCoordonnees` retire les parenthèses du point, puis
    `checkPaire` retirait à nouveau des « parenthèses extérieures » dès
    que la chaîne commençait par « ( » et finissait par « ) », **sans
    vérifier qu'elles se correspondent**. Pour une réponse comme
    `((-42m-20)/(m^2-8m-4);(5m+2)/(m^2-8m-4))`, il restait
    `-42m-20)/(…;(5m+2)/(m^2-8m-4` : **réponse juste refusée**, y compris
    la réponse exacte attendue. Touchait ici l'intersection à
    paramètre \(m\) et l'intersection avec radicaux (première
    coordonnée écrite avec une parenthèse). Nouvelle fonction
    `entoureParParentheses(s)` (vraie seulement si la parenthèse
    ouvrante initiale se referme sur le dernier caractère), utilisée par
    `checkVecteur`, `checkPaire` et `checkTriplet`. **Le même code
    fautif existe à l'identique dans 27 fiches de Première** (toutes
    sauf la 4) : ~~non corrigé ailleurs, en attente de l'accord de
    David~~ → **étendu le même jour** (David : « étends la correction à
    toutes les fiches (de premières et de secondes si nécessaire) »),
    voir l'entrée suivante.
  - **Défauts d'affichage préexistants corrigés** : automatismes 20.1 et
    20.2 avec fractions réductibles et signe dans le numérateur
    (« \(\frac{-9}{9}\) », « \(-\frac{-6}{5}\) ») → irréductibles, signe
    devant, facteur négatif entre parenthèses ; « \(\frac{6}{9}\) » en
    20.7 a) ; « \(a-0\) », « \(a--1\) » en 20.16 b) ; dans les
    contextes : « \(x^2+1x+1\) », « \(-6x+0\) » (parabole),
    « \((y+0)^2\) » (cercle), « \(mx-1y\) » et « \(y+0=0\) » (droites à
    paramètre), « \(+0=0\) » (droites à radicaux). Équivalence
    numérique énoncé/réponse revérifiée sur les automatismes retouchés
    (180 comparaisons, 0 écart).
  - Vérifié : 0 échec sur 2 000 tirages, 38/38 sur 8 cycles complets
    (vecteur, équation cartésienne, point, équation réduite compris),
    balayage énoncés et contextes vide, aucun débordement (fiches 19 et
    20), graphique cohérent avec les réponses attendues sur un
    chargement neuf.

  **Bilan du lot 16-20** : 46+54+37+75+50 = 262 → 30+41+31+53+38 = 193
  questions.

  **Correction des parenthèses étendue à toutes les fiches (26/09/2026)**.
  Recensement de toutes les formes de retrait de parenthèses
  extérieures dans `cahiers/` :
  - Première : `if (nettoye.startsWith('(') && nettoye.endsWith(')')) {`
    dans `checkVecteur`, `checkPaire`, `checkTriplet` de 26 fiches (toutes
    sauf la 4, qui n'a pas ce code, et la 20, déjà corrigée) ;
  - Seconde : variante sur une ligne dans `checkPaire` des fiches 16,
    21, 22, 23 et 25 (code porté depuis la Première) ;
  - Première, fiche 19 : même défaut dans l'affichage des fractions des
    arbres (`den`), sans effet sur la correction mais corrigé aussi.
  Script unique : ajout de `entoureParParentheses` une fois par fichier
  (avant la première fonction concernée), remplacement de chaque
  condition. 31 fichiers modifiés, syntaxe vérifiée, plus aucune
  occurrence de l'ancienne condition, chaque `slice(1,-1)` restant est
  bien gardé. **Laissés tels quels, volontairement** :
  `checkPointCoordonnees` (et `checkVecteurDirecteur25` en Seconde),
  qui retirent les parenthèses **du point** par expression régulière
  alors qu'elles sont exigées par la consigne — une saisie sans
  parenthèses de point y est refusée comme prévu, aucune saisie valide
  n'est refusée à tort.
  Vérifications :
  - tests unitaires dans les 31 fichiers chargés réellement (quotients
    parenthésés avec et sans parenthèses de point, paires simples,
    paramètre \(m\), réponses fausses) : tous conformes, en Première
    comme en Seconde ;
  - non-régression sur les vrais exercices point/vecteur/triplet des
    fiches concernées (20 à 26 de Première, 16, 21, 22, 23, 25 de
    Seconde) : réponse attendue saisie dans le vrai champ, tout accepté.
    Ancien bug effectivement déclenché par des réponses attendues :
    fiche 20 de Première (4 questions) ;
  - Seconde, champs MathLive : une vraie frappe « (1/2;-3/2) » est
    acceptée (dans ces fiches « / » ne crée pas de fraction empilée et
    le clavier n'a pas de touche fraction). Les formes `\left(…\,;\,…\right)`
    ou `\frac` injectées par programme sont refusées **avant comme
    après** la correction (comparé sur une copie de l'ancienne version
    servie temporairement) : ce sont des formes qu'un élève ne peut pas
    produire, pas un défaut de la correction.

  **Fiches 21 à 25, 26/09/2026** (David : « continue les 5 prochaines »),
  même outillage et même batterie de tests que pour 16-20.

  *Fiche 21 (cahier 7, Généralités sur les vecteurs) : 82 → 55
  questions, 23 → 19 groupes.*
  - Automatismes 21.1 (6) + 21.2 (6) → 3+3 : 21.1 garde la différence
    au carré, le produit conjugué et la forme composée (retirés le carré
    d'une somme, le plus simple, et deux quasi-doublons) ; 21.2 garde
    a), c) (factorisation de \(1-q^2\)) et e) (carré au dénominateur).
  - **Fusions** : « Équations vectorielles (I) » + « (II) » → une seule
    section de 4 exemples (deux à solution unique, deux à deux
    solutions) ; la consigne « déterminer l'ensemble des valeurs du réel
    \(\alpha\) pour lesquelles \(\vec{u}=\vec{0}\) » est posée une fois
    dans l'introduction et **toutes les réponses sont désormais des
    ensembles** (bulle d'aide unique ; « {2} », « 2 » et « x=2 » restent
    acceptés). 21.8 « simplifications » + 21.10 (même compétence :
    Chasles pur, résultat nul) → 4 exemples. « Exprimer un vecteur en
    fonction d'un autre (II) » (deux groupes portaient ce même titre) +
    « (III) » → une seule section de 4 exemples : un par technique
    (coefficients fractionnaires, équation à deux membres, décomposition
    sur \(\overrightarrow{AB}\), \(\overrightarrow{AC}\), équation entre
    points). Le « (I) » est resté à part dans la section Chasles : ce
    n'est pas de la colinéarité mais une simplification à paramètre
    \(\alpha\) ; retitré « Exprimer un vecteur en fonction de
    \(\overrightarrow{AB}\) », 4 → 3.
  - Réduits : combinaisons sur quadrillage 6 → 4 (\(\vec{w}\) et
    \(\vec{p}\) restent sur la figure, utilisés par les combinaisons
    gardées) ; exemples de Chasles 4 → 3 (deux chaînes de longueur 2) ;
    \(\vec{u}\) en fonction de \(\overrightarrow{AB}\),
    \(\overrightarrow{AC}\) 4 → 3 ; simplifications à coefficients
    4 → 3 ; colinéarité sur figure 4 → 3 (deux questions avaient la même
    réponse) ; avancé « \(\vec{u}\) en fonction de \(\vec{v}\) et
    \(\alpha\) » 4 → 3. Gardés entiers : 21.11 (\(\alpha\) tel que
    \(\vec{u}=\vec{0}\), 3), propriété du milieu (4), centre de gravité
    (4, théorèmes fixes), les deux problèmes à contexte.
  - Consignes factorisées : « Déterminer (le réel) α tel que » retiré
    des énoncés (déjà dans l'introduction, et α était en texte brut) ;
    introduction répétée dans 21.18 a) retirée ; définition des milieux
    \(A'\), \(B'\), \(C'\) remontée de 21.19 b) dans l'introduction (c)
    et d) s'en servaient sans l'avoir) ; « Si » orphelin (sans « alors »)
    retiré de 21.12 b) ; « … » final retiré ; « Simplifier » ajouté à
    21.18 c) et d), qui n'avaient aucune consigne.
  - Noms de points en LaTeX partout (introductions, contextes
    dynamiques, 21.3, 21.8) : \(ABC\), \([AB]\), \(G\), \(M\)…
  - Conteneurs de figure en double (`graphique-21-4`, `-5`, `-15`
    présents deux fois, le second toujours vide) : doublons retirés.
  - **Défauts de tirage préexistants corrigés** : combinaison vectorielle
    nulle possible en 21.4 c)/d) (vecteurs de la figure parfois
    colinéaires) → retirage ; « \(\alpha(\alpha+0)\) » en 21.6 b) ;
    « \(+0\overrightarrow{IA}\) » en 21.18 d) ; « \(0\overrightarrow{CG}\) »
    en 21.10 a).
  - **Mise en page** : 21.12 b), c) et 21.17 c) débordaient de leur
    carte (50 à 94 px à 728 px de large). Nouvelle option d'item
    `pleineLargeur` : si une question d'un groupe la porte, toutes les
    cartes du groupe prennent la largeur entière (classe
    `question-seule`, sans toucher aux lettres). Activée pour 21.12 et
    21.17.
  - Vérifié : 0 échec sur 2 000 tirages (réponse attendue soumise à la
    vraie correction, combinaisons de vecteurs comprises), 55/55 sur
    6 cycles complets dans l'interface, ordre des cartes = ordre du
    tableau, balayage des énoncés vide, aucun débordement sur 8 tirages,
    rendu contrôlé à l'écran.

  *Fiche 22 (cahier 7, Coordonnées des vecteurs) : 67 → 44 questions,
  20 → 15 groupes.*
  - Automatismes 22.1 (6) + 22.2 (6) → 3+3 : inéquations b), d), f)
    (retirés la plus simple et deux quasi-doublons) ; factorisations c),
    d), e) (retirées les deux identités directes et la forme qui cumule).
    « ℝ » du titre passé en \(\mathbb{R}\).
  - **Fusions** (même compétence, variantes de valeurs) :
    - coordonnées de \(\overrightarrow{AB}\) : 22.3 (entiers, fractions,
      radicaux) + 22.4 (paramètre \(n\)) + 22.5 (paramètre \(\alpha\))
      → 4 exemples (fractions, radicaux, \(n\), \(\alpha\)) ;
    - point \(M\) tel que \(\overrightarrow{MA}+\overrightarrow{MB}+\overrightarrow{MC}=\vec{0}\) :
      22.11 + 22.12 (version à \(\alpha\)) → un groupe de 2, consigne
      en introduction ;
    - normes : 22.13 + 22.14 (à \(\alpha\geqslant 1\)) → 4 exemples
      (fractions, radicaux, deux à \(\alpha\)) ; l'hypothèse
      \(\alpha\geqslant 1\) passe du titre aux questions concernées ;
    - milieux : 22.17 + 22.18 (à \(\alpha\)) → 4 exemples, titre en
      LaTeX (« Soient A et B deux points… [AB] » était en texte brut).
  - Réduits : le problème \(ABCD\) 3 → 2 (les coordonnées de
    \(\overrightarrow{DC}\) avaient exactement la réponse de
    \(\overrightarrow{AB}\)) ; « même méthode » 4 → 3 ; valeur de
    \(\alpha\) telle que \(\overrightarrow{AB}=\vec{u}\) 3 → 2 ;
    parallèles/sécantes 3 → 2 ; déterminant (avancé) 5 → 4. Gardés
    entiers : couple \((\alpha,\beta)\), somme de vecteurs (contexte),
    \(\lambda\) figés (2), Ménélienne (6, problème à étapes dépendantes).
  - Consignes : « … » final retiré des déterminants ; la dernière
    question du déterminant n'avait aucune consigne → alignée sur la
    précédente (« Valeurs de \(\alpha\) pour lesquelles \(\vec{u}\) et
    \(\vec{v}\) sont colinéaires »). Noms de points, droites et réels en
    LaTeX (\(D\), \((AB)\), \(ABC\), \(p\), \(q\), \(r\)…), y compris
    dans les options du QCM.
  - **Défauts préexistants corrigés** : « \(-4x+0\geqslant 0\) »
    (22.1 a) ; constantes nulles « \(\alpha+0\) » du couple
    \((\alpha,\beta)\) ; « \(\dfrac{1}{\alpha+0}\) » (déterminant) ;
    fractions non réduites « \(\frac44\) », « \(\frac24\) » en 22.3 a)
    (tirage de fractions irréductibles) ; « \(\frac22\) », « \(\frac64\) »
    en 22.10 d) et 22.13 c) (facteur d'échelle limité à 1 ou 3) ;
    coordonnées fractionnaires affichées « 9/2 » avec une barre oblique
    en 22.10 a) et 22.13 a) → fraction LaTeX (nouvelle fonction
    `fracL`).
  - Vérifié : 0 échec sur 6 cycles complets dans l'interface (champs
    texte des paires et intervalles remplis avec la vraie saisie
    « (a;b) », « ]-inf;2] »), balayage de 2 000 tirages vide (« +0 »,
    « -- », fractions réductibles, barres obliques), aucun débordement,
    rendu contrôlé à l'écran.

  *Fiche 23 (cahier 8, Fonctions trigonométriques I) : 52 → 31
  questions, 15 → 11 groupes.*
  - Automatismes 23.1 (4) + 23.2 (4) + 23.3 (9) → 2+2+2 : conversions
    radians → degrés 2 ; degrés → radians 2 (un multiple de 15°, le
    multiple de 22,5°) ; fractions de \(\pi\) 2 (une somme de deux
    fractions, une combinaison avec des multiples de \(\pi\)) — les
    7 retirées étaient des quasi-doublons deux à deux. « π » du titre
    en LaTeX.
  - Valeurs particulières : « Premiers angles » 6 → 4 ; « Autres
    angles » + « Derniers angles » (**même générateur, code
    identique**) → une section de 4. Les deux sections restent
    distinctes : lecture directe du tableau d'un côté, réduction modulo
    \(2\pi\) et parité de l'autre.
  - **Fusions** : les deux « Monotonie » (sur \([0;\frac{\pi}{2}]\) et
    sur \([0;\pi]\)) → une section de 4, toutes gardées (la question sur
    le sinus sur \([0;\pi]\) est la seule à réponse « les deux sont
    possibles ») ; les deux « Comparaison entre sinus et cosinus » (même
    titre) → une section de 2, « Plusieurs réponses sont possibles »
    passé dans l'introduction ; « Avec tangente (I) » + « (II) » → une
    section de 3. « sin », « cos » des énoncés en LaTeX.
  - Réduits : valeurs de la tangente 6 → 4 ; « Connaissant l'un,
    déduire l'autre » 3 → 2 (retiré l'exemple figé \(\frac{\pi}{8}\),
    calcul pur ; gardés le cas positif et le cas où le signe se déduit
    de l'intervalle).
  - Mise en page : les deux QCM de comparaison ont des options sur une
    ligne défilante ; regroupés, ils auraient perdu la pleine largeur →
    option `pleineLargeur` (même mécanisme qu'en fiche 21).
  - **Défaut préexistant corrigé** : 23.3 b) pouvait afficher
    « \(\frac{6\pi}{6}\) » (fraction tirée sans contrôle de PGCD).
  - Vérifié : 31/31 sur 10 cycles complets, balayage de 2 000 tirages
    vide (« +0 », fractions réductibles, NaN), ordre des cartes
    conforme, rendu contrôlé à l'écran.

  *Fiche 24 (cahier 8, Fonctions trigonométriques II) : 74 → 39
  questions, 16 → 14 groupes.*
  - Automatismes 24.1 (8) + 24.2 (6) + 24.3 (6) → 2+2+2 : pour chacun,
    la forme affine et la forme « carré = carré » / « |…| = |…| » (les
    formes directes \(x^2=k\), \(|x|=k\) et les variantes
    fractionnaires, quasi-doublons, retirées) ; inéquations : \(x^2>K\)
    (réunion d'intervalles) et \(|ax+b|\geqslant k\). « ℝ » des titres
    en LaTeX. Chaque item était dans sa propre fonction : les fonctions
    entières sont retirées, pas seulement la ligne.
  - Valeurs remarquables 9 → 4, valeurs particulières 9 → 4, tangente
    6 → 4 (trois sections distinctes : premier quadrant, réduction,
    tangente).
  - **Fusion** « Angles associés (I) » (QCM) + « (II) » (saisie libre),
    même compétence → une section de 4 en saisie libre (\(\sin(-x)\),
    \(\cos(\pi-x)\), \(\cos(x+\frac{\pi}{2})\), \(\sin(\frac{\pi}{2}-x)\)).
    « Tangente d'angles associés » (4, QCM) gardée à part.
  - « Formules d'addition (I) » (\(\cos 2a\), \(\sin 2a\)) + « (III) »
    (\(\cos(a-b)\), \(\sin(a-b)\)) : même compétence (exprimer une
    formule) → une section de 4, avancée avant « (II) », qui est un
    calcul numérique (\(\cos\frac{7\pi}{12}\)…) réduit à une paire
    cos/sin (4 → 2). Gardés : « avec les formules d'addition ? » (2),
    formule de la tangente (1).
  - Courbes : 3 → 2. Les formules étaient en texte brut
    (« f:x↦sin(π/2-x) ») → LaTeX ; la mention « parmi les 4 propositions
    (a),(b),(c),(d) » répétait la consigne déjà affichée au-dessus de la
    figure (insérée par le tracé lui-même) → retirée, comme « Pour la
    courbe a), choisir parmi les propositions… » répété dans « Autres
    courbes » (les questions deviennent « Courbe a) », « Courbe b) »).
  - **Défaut préexistant corrigé (affichage de la correction)** :
    \(x^2>K\) avec \(K\) non carré affichait la correction en décimal
    (« \(]-\infty;-2.828[\cup]2.828;+\infty[\) ») → `formaterUneBorne`
    reconnaît une borne de carré entier et l'écrit \(2\sqrt{2}\) (testé
    avant l'approximation fractionnaire). La correction elle-même
    acceptait déjà « sqrt(8) ».
  - Vérifié : 39/39 sur 8 cycles complets (intervalles saisis comme un
    élève, « ]-inf;-sqrt(8)[U]sqrt(8);+inf[ »), balayage de 2 000
    tirages vide (dont bornes décimales dans la correction), aucun
    débordement, rendu contrôlé à l'écran.

  *Fiche 25 (cahier 9, Produit scalaire I) : 29 → 25 questions, 12 → 9
  groupes.* Fiche déjà courte : peu de réductions, surtout des fusions
  et des corrections.
  - Automatismes (méli-mélo, 5 QCM) : inchangés (déjà sous 6).
  - **Fusions** : « orthogonaux : oui ou non ? » en deux groupes (dont
    un où la réponse était toujours « oui ») → une section de 4
    (fractions, radicaux, puissances de 10, le cas « non ») ; « Trouver
    le réel \(x\) » + « Trouver les deux réels \(x\) » → une section de
    4, **réponses toutes en ensemble** (comme en fiche 21).
  - 25.6 retiré : exactement le type de 25.7 (point + vecteur normal,
    coordonnées entières, moins intéressant que les versions
    fractionnaire et radicale gardées) ; sa mise à jour de titre
    dynamique retirée, les numéros codés en dur dans les gabarits des
    titres dynamiques (25.8 → 25.5, 25.9 → 25.6, 25.11 → 25.8) mis à
    jour.
  - Étiquettes de droites (d2)…(d7) supprimées (jamais réutilisées,
    et la numérotation aurait eu des trous) ; \((D)\), \((AB)\),
    \((BC)\), \(A\), \(C\), \(ABDC\), \(f\) en LaTeX.
  - **Défauts préexistants corrigés** : fraction « \(\frac82\) »
    (25.3 b) ; « 1x », « 0x+0 » et propositions non simplifiées alors
    que la consigne demande « l'écriture la plus simple » (25.1 d),
    tirage refait : réponse irréductible, sans terme nul, trois
    propositions distinctes) ; racine double affichée « {−1;−1} » et
    « 1x » (25.3 d) ; options de QCM en double (25.1 a et e) ; ensembles
    proposés avec élément répété (« {2;2} », ~10 % des tirages) et
    fractions en « −1/2 » séparées par une virgule (25.1 b) → fractions
    LaTeX, point-virgule.
  - Vérifié : 25/25 sur 18 cycles complets, balayage de 5 000 tirages
    vide (« +0 », « 1x », « 0x », fractions réductibles ou en barre
    oblique, options en double, ensembles à élément répété), aucun
    débordement, rendu contrôlé à l'écran.

  **Bilan du lot 21-25** : 82+67+52+74+29 = 304 → 55+44+31+39+25 = 194
  questions. → Poussé le même jour.

  **Fiches 26 à 28, 26/09/2026** (David : « continue les fiches 26 à
  28 »), même outillage.

  *Fiche 26 (cahier 9, Produit scalaire II) : 63 → 45 questions, 22 → 18
  groupes.*
  - Automatismes (2 + 3 = 5, déjà sous 6) : inchangés en nombre ;
    « Simplifier au maximum, sous forme de produit de puissances »,
    « Soit x∈ℝ. Développer », « Développer » retirés des énoncés (déjà
    dans les titres).
  - **Fusions** : 26.8 + 26.9 (**titres identiques** « Dans chacun des
    cas suivants, choisir la bonne réponse ») → 4 (trouver un vecteur
    normal, trouver l'intrus, plusieurs bonnes réponses, droite
    parallèle à \((Ox)\) ; retirés deux doublons de la première) ;
    « Projection orthogonale (I)/(II) » → 2 (point entier, point à
    abscisse fractionnaire) ; « Une distance (I)/(II) » → un groupe de
    2 ; « Retrouver le centre et le rayon (I)/(II) » → 2 paires
    centre/rayon. **Le titre du (I) affichait une équation figée
    (\(x^2+y^2-4x+6y-3=0\)) alors que la question portait sur une
    équation tirée au sort** : titre réécrit.
  - Réduits : vecteurs normaux à \((AB)\) 4 → 2 (trois items du même
    générateur) ; vecteurs directeurs et normaux 8 → 4 (droites \(D_1\)
    et \(D_3\), renommée \(D_2\) ; \(D_2\) était \(D_1\) dans l'autre
    ordre, \(D_4\) figée) ; perpendiculaires oui/non 4 → 3 ; équations
    cartésiennes 3 → 2 ; équations de cercle 3 → 2 ; cercles inconnus
    3 → 2 (« passant par \(O\) » = cas particulier de « passant par
    \(B\) »). Gardés entiers : formule générale de la distance (5,
    étapes dépendantes), tangentes (1+1).
  - Noms en LaTeX partout : \((d)\), \((D)\), \((d_1)\), \((AB)\),
    \((BC)\), \((Ox)\), \(H\), \(A\), \(\Omega\), \(\mathcal{C}\),
    \([AB]\), \(a\), \(b\), \(c\), \(x\in\mathbb{R}\)…
  - **Défauts préexistants corrigés** : correction de 26.1 b) affichée
    « 0 » (quotient \(\frac{7}{5^7\times 2^9}\) arrondi à zéro par
    l'approximation fractionnaire) → une réponse contenant une
    puissance s'affiche telle quelle, en produit de puissances comme le
    demande la consigne ; option « \(\frac{-4}{2}\) » (26.8 b) ;
    « \(m+0\) », « \(0-m\) » (26.6 a) ; rayon « 5/2 » en barre oblique
    (26.13 b).
  - Vérifié : 45/45 sur 16 cycles complets (vecteurs, paires, triplets
    et équations cartésiennes saisis comme un élève : « (a;b) »,
    « (a;b;c) », « a;b;c »), balayage de 3 000 tirages vide (options
    comprises, correction affichée comprise), aucun débordement, rendu
    contrôlé à l'écran.

  *Fiche 27 (cahier 10, Logique) : 48 → 31 questions, 15 → 10 groupes.*
  Fiche **statique** (tableau d'exercices figé, pas de randomisation —
  voulu, cf. audit du 04/09 ; titres « Entraînement » au lieu de
  « Calcul » : outil adapté). Le code contient un appel à
  `genererExercices()` qui n'existe pas dans la page, mais il n'est
  jamais atteint (pas de bouton « Nouvelle fiche ») : laissé tel quel.
  - Automatismes 27.1 (6) + 27.2 (4) → 3+3 : développements a), d)
    (coefficient fractionnaire), e) (produit de quatre facteurs) ;
    fractions a), c), d) (retirée celle dont la réponse est un quotient
    de deux polynômes de degré 3).
  - **Fusion** : 27.3, 27.4, 27.5 avaient **le même titre** → une
    section de 4, une par famille (« et », « ou », implication,
    quantificateur ; deux vraies, deux fausses). **Défaut préexistant
    corrigé** : ce titre demandait « Répondez par oui ou non » alors
    que la correction n'acceptait que vrai/faux (« oui » compté faux) →
    titre « vraies ou fausses ? », et la correction accepte désormais
    aussi « oui »/« non ».
  - **Fusion** : 27.8 + 27.9 (même titre) → 4 (retiré
    « européen/français », même structure que « rectangle/carré »).
  - **Fusion** « Négation de proposition quantifiée (I)/(II)/(III) » →
    une section de 4 (toutes gardées) ; l'énoncé du (I), qui était en
    trois paragraphes au-dessus d'une question vide, passe dans la
    question ; « Donner la négation de » ajouté aux questions du (II).
  - Réduits : négations de phrases 5 → 3 (les deux « la fonction f »
    retirées) ; négations quantifiées (QCM) 4 → 3 ; vocabulaire 3 → 2.
    Gardés : 27.7 (2), 27.9 avancé (3, la c) dépend des deux autres).
  - \(P\), \(Q\) en LaTeX dans les énoncés et les options.
  - Mise en page : 27.7 et 27.9 c) débordaient → `pleineLargeur`
    (même mécanisme que fiches 21 et 23), aussi pour le groupe des
    négations aux énoncés longs.
  - Vérifié : 31/31 (réponse attendue saisie dans le vrai champ),
    « oui »/« non » acceptés à bon escient, 0 erreur MathJax, aucun
    débordement, ordre des cartes conforme, rendu contrôlé à l'écran.

  *Fiche 28 (cahier 10, Théorie des ensembles) : 32 → 23 questions,
  9 → 8 groupes.* Fiche statique, comme la 27.
  - Automatismes 28.1 (4) + 28.2 (3) → 3+3 (retirée l'équation la plus
    simple).
  - Réduits : inéquations 4 → 3, appartenances 4 → 3 (retirées les plus
    simples), inclusions paramétrées 4 → 3 (deux questions avaient la
    même réponse et la même mécanique), intersections paramétrées
    4 → 3. Cardinal gardé.
  - **Fusion** « Inclusions d'intervalles (I)/(II) » → 4 (deux vraies,
    deux fausses, dont les fractions étagées). **Même défaut qu'en
    fiche 27** : le titre demandait « oui » ou « non », refusés par la
    correction → titre « vraies ou fausses ? », « oui »/« non »
    acceptés.
  - 28.6 a) répétait la consigne du titre (« Soit a>0. Déterminer à
    quelle condition… ») → retirée. Titres en LaTeX (\(x\), \(a>0\),
    \(a\geqslant\cdots\), \(a\)) ; « \(A\) », « \(\text{Card}(A)\) »,
    « \(A\), \(B\), \(C\) » en LaTeX dans le rappel.
  - **Défaut préexistant corrigé** : la correction de l'appartenance à
    bornes en \(\pi\) s'affichait en décimal (« ]1.237;1.412[ ») →
    nouveau champ d'exercice `correctionLatex` (écriture exacte
    \(\left]\frac{\pi}{2}-\frac13;\frac{5\pi}{9}-\frac13\right[\)),
    prioritaire dans `formaterReponse`. La saisie « ]pi/2-1/3;…[ » était
    déjà acceptée.
  - Vérifié : 23/23 (intervalles saisis comme un élève), « oui »/« non »
    acceptés, aucune correction en décimal, 0 erreur MathJax, aucun
    débordement, rendu contrôlé à l'écran.

  **Bilan du lot 26-28** : 63+48+32 = 143 → 45+31+23 = 99 questions.
  **Les 28 fiches de Première sont simplifiées.**
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
- **Correction du corrigé d'un sujet blanc d'automatismes accessible pendant
  un devoir (28/09/2026)**, signalé par David : le verrouillage niveau/mode/
  durée d'un devoir d'automatismes (19/09/2026, voir plus haut) empêchait
  bien de jouer « à côté » du devoir, mais rien n'empêchait un élève de
  révéler le corrigé complet — bouton « Voir toutes les réponses » en mode
  fiche, « Voir la correction détaillée » en mode chrono (`automatismes/
  assets/moteur.js`) — puis de la partager avec des camarades qui n'ont pas
  encore fait le devoir. Contrairement aux fiches de calcul (où « Corrigé
  des erreurs »/« Voir toutes les réponses » sont déjà bloqués tant que la
  fiche n'est pas validée), rien de tel n'existait côté automatismes.

  Corrigé en s'appuyant sur `ETAT.config.verrouille`, déjà présent
  uniquement quand un devoir est actif (échéance pas encore passée, voir
  `devoirAutomatismeActif()`) et absent de lui-même au chargement suivant
  une fois l'échéance dépassée — aucune nouvelle donnée à lire, juste
  réutiliser l'indicateur existant. Trois changements dans `moteur.js` :
  (1) `vueFicheHTML()` désactive le bouton « Voir toutes les réponses »
  (`disabled`, tooltip « Devoir en cours : la correction sera disponible
  après l'échéance. ») tant que `verrouille` est présent ; (2)
  `basculerReponses()` refuse aussi d'agir si appelée directement
  (deuxième ligne de défense, même principe que `validerFicheActuelle()`
  sur les fiches de calcul) ; (3) en mode chrono, `vueChronoHTML()` (phase
  « fin ») désactive de la même façon « Voir la correction détaillée » ET
  ne génère même plus le HTML des cartes corrigées dans le `<div id="revue">`
  caché tant que verrouillé — sinon les bonnes réponses restaient
  inspectables dans le code source de la page malgré le bouton désactivé,
  simple `display:none` insuffisant ici contrairement au cas des fiches de
  calcul (où le corrigé n'est de toute façon jamais généré tant que
  `corrigees[i]` reste `false`, donc pas concernées par ce risque) ; le
  handler de l'action `basculer-revue` refuse également d'agir en direct.

  Testé en conditions réelles (appels directs à `Automatismes.demarrer()`
  avec un faux `config.verrouille`, sur `automatismes/premiere/
  sujet-blanc.html`, sans passer par un vrai devoir Firestore) : mode
  fiche verrouillé — bouton désactivé avec le bon tooltip, clic et appel
  direct de `basculerReponses()` sans effet (`ETAT.corrigees` reste tout à
  `false`, aucune classe `.opt.bonne` dans le DOM) ; mode fiche sans devoir
  — bouton actif, clic révèle normalement (comportement inchangé) ; mode
  chrono verrouillé, série menée à terme — bouton désactivé avec le bon
  tooltip, `<div id="revue">` vide (aucune bonne réponse dans le HTML de la
  page) ; mode chrono sans devoir — bouton actif, correction affichée
  normalement au clic. `node --check` sur `moteur.js` (syntaxe OK).
- **Devoir « Fiche d'automatismes ciblée » (28/09/2026)**, sur demande de
  David : jusqu'ici, un devoir d'automatismes ne pouvait viser QUE le sujet
  blanc (mix de tous les thèmes du programme) — pas de moyen d'attribuer un
  entraînement ciblé sur des thèmes précis (la page `fiche.html`, « Fiche
  d'automatismes », existait déjà pour ça côté élève en pratique libre,
  jamais suivie ni notée par choix, mais aucun devoir ne pouvait s'y
  attacher).

  Décisions prises avec David avant de coder (question posée explicitement
  vu le nombre de choix de conception) : le niveau (1/2/3) reste imposé par
  l'enseignant comme pour le sujet blanc (pas de libre choix élève) ; le
  mode (fiche/chrono) et la durée par question restent choisis à
  l'attribution, mêmes champs réutilisés tels quels ; quand plusieurs
  thèmes sont cochés, CHAQUE fiche générée couvre la totalité d'entre eux
  (pas de tirage aléatoire d'un sous-ensemble comme en pratique libre).

  **Modèle retenu** : même document Firestore `type:'automatismes'` que le
  sujet blanc (pas un troisième `type` à part, pour ne pas dupliquer toute
  la mécanique d'échéance/essais/résultats déjà en place) — distingué par un
  nouveau champ `cible` (`'sujet-blanc'` ou `'fiche'`, absent sur tout devoir
  créé avant ce chantier ⇒ traité comme `'sujet-blanc'`, même sentinelle
  côté client que `CLASSE_HORS_CLASSE`) et, pour `cible:'fiche'`, un tableau
  `themes` (identifiants de banques).

  **`automatismes/assets/moteur.js`** : `demarrer()` — quand
  `config.verrouille.themes` est un tableau non vide, `banques`/`nbThemes`
  sont réduits à exactement cette liste (`tirerSerie()` pioche alors
  `min(nbThemes, dispo.length)` = la liste entière : chaque génération
  couvre donc systématiquement tous les thèmes imposés, sans tirage). Un
  nouveau `ETAT.config.themesImposes` (comme `themeImpose` au singulier pour
  `fiche.html?theme=…`) supprime le bouton redondant « Nouvelle fiche (mêmes
  thèmes) » dans les deux modes (déjà garanti par le verrouillage) ; le
  paramètre d'URL `?theme=` est désormais ignoré si un devoir verrouille
  déjà les thèmes (priorité au devoir). Le bandeau « Thèmes de cette fiche »
  déjà existant (`bandeauThemesHTML`) affiche les thèmes imposés sans
  modification, puisqu'il lit simplement `ETAT.questions.themes`.

  **`automatismes/premiere/fiche.html`** : passait jusqu'ici
  `Automatismes.demarrer()` de façon synchrone au chargement du script,
  sans suivi ni verrouillage possible. Refondu sur le même principe que
  `sujet-blanc.html` : `DOMContentLoaded` (attend que `assets/js/suivi.js`,
  chargé en module donc différé, ait fini de s'exécuter), appel à
  `window.devoirAutomatismeFicheActif()` (nouveau, voir suivi.js) pour
  construire `verrouille` si un devoir `cible:'fiche'` est actif, `onFinSerie`
  qui enregistre la tentative SEULEMENT si un devoir est actif
  (`enregistrerTentativeFicheAutomatismesSiDevoir`, voir suivi.js — une
  fiche libre, sans devoir, n'écrit toujours rien, choix d'origine préservé)
  et affiche le même message « tentative épuisée » que le sujet blanc si
  applicable. Nouveau `<p id="suivi-etat">` ajouté au HTML (absent jusqu'ici
  sur cette page).

  **`assets/js/suivi.js`** : `devoirsPourAutomatisme()`,
  `enregistrerTentativeDevoirAutomatismeSiApplicable()`,
  `verifierEtatDevoirAutomatisme()` et `devoirAutomatismeActif()` acceptent
  désormais un paramètre `cible` (défaut `'sujet-blanc'`, filtré côté
  client puisque les devoirs sujet-blanc créés avant ce chantier n'ont pas
  ce champ du tout — pas de `where()` Firestore dessus). Pour `cible:'fiche'`,
  une comparaison exacte de l'ensemble des thèmes joués contre
  `devoir.themes` (nouvelle fonction `memeEnsembleThemes`, ordre indifférent)
  s'ajoute au filtre niveau/mode/durée : nécessaire pour distinguer deux
  devoirs `fiche` actifs sur des thèmes différents mais même niveau/mode,
  ce qui n'existait pas avec le sujet blanc (jamais qu'un seul type de
  répartition possible). Deux devoirs de cibles différentes (un sujet blanc
  ET une fiche ciblée) peuvent être actifs simultanément pour la même classe
  sans se gêner : chaque page ne cherche que sa propre cible. Nouvelle
  fonction exportée `enregistrerTentativeFicheAutomatismesSiDevoir()` :
  contrairement à `enregistrerAutomatisme()` (sujet blanc, écrit
  inconditionnellement dans `eleves/{uid}/automatismes`, l'agrégat utilisé
  par l'onglet Automatismes du tableau de bord), elle n'écrit JAMAIS dans
  cet agrégat — seulement dans `devoirsTentatives`, et seulement si un
  devoir `fiche` est actif — pour ne pas remettre en cause le choix
  d'origine (fiche libre non suivie/non notée). Pas de barème ici (pas de
  note /5 comme le sujet blanc) : `score` = nombre de bonnes réponses,
  `totalExercices` = nombre de questions — la vue résultats de `devoirs.js`
  et `/mes-devoirs/` n'ont eu besoin d'aucune modification pour l'afficher
  correctement (`X / 10`), ni pour la colonne « Non-réponses » (déjà
  générique sur `nbQuestions`/`nbRepondues`, mêmes noms de champs réutilisés).

  **`assets/js/devoirs.js`** (formulaire d'attribution) : nouvelle option
  « Fiche d'automatismes ciblée » dans le select « Type de devoir »
  (`automatismes-fiche`, concept purement côté UI — retraduit à l'écriture
  en `type:'automatismes', cible:'fiche'`) ; nouveau champ « Thèmes
  travaillés » (cases à cocher, liste `THEMES_AUTOMATISMES` codée en dur —
  mêmes identifiants/intitulés que `fiche.html` et les banques, à tenir à
  jour à la main comme `FICHES_PLATES` pour les fiches de calcul), affiché
  seulement pour ce type, au moins un thème exigé à la soumission. Titre
  auto-généré incluant les thèmes choisis (ex. « Fiche d'automatismes —
  Droites et repères, Équations et inéquations — Niveau 2 (mode fiche) »).
  `modifierDevoir()` retrouve le bon type UI et re-coche les thèmes déjà
  choisis.

  **Bug latent trouvé et corrigé au passage** (pas introduit par ce
  chantier, mais du même genre que celui déjà corrigé pour `eleves` lors de
  l'ajout du ciblage individuel hors-classe) : `updateDoc()` en mode édition
  ne portait `duree`/`themes` dans son payload que quand ils s'appliquaient
  ENCORE à la nouvelle configuration — modifier un devoir chrono vers le
  mode fiche, ou une fiche ciblée vers un sujet blanc, laissait une valeur
  périmée en base (`updateDoc` fusionne, n'efface jamais un champ absent du
  payload). Corrigé en ajoutant `duree: donnees.duree ?? deleteField()` et
  `themes: donnees.themes ?? deleteField()`, même principe que
  `eleves: eleves ?? deleteField()` déjà en place.

  **`assets/js/mes-devoirs.js`** : `lienPour()` pointe vers `fiche.html` au
  lieu de `sujet-blanc.html` quand `devoir.cible === 'fiche'`. Aucune autre
  modification nécessaire (score/non-réponses déjà génériques, voir plus
  haut). `assets/js/devoirs-notification.js` (bandeau + pastille) : aucune
  modification nécessaire, ne connaît déjà que le compte de devoirs actifs,
  jamais leur cible ni leur lien.

  Aucune règle Firestore à republier (`devoirs/{id}` n'a aucune validation
  de schéma par champ, juste `allow write: if estAdmin()`).

  **Vérifié** : syntaxe (`node --check` sur les 3 scripts modules touchés,
  `node -e` avec `vm.Script` sur les deux `<script>` classiques de
  `fiche.html`). Mécanisme de verrouillage des thèmes testé en conditions
  réelles dans le navigateur, en appelant directement
  `Automatismes.demarrer()` avec un faux `config.verrouille.themes` (sans
  passer par un vrai devoir Firestore, même limite que le test du 25/09/2026
  ci-dessus) : mode fiche ET mode chrono, 3 thèmes imposés — les 10
  questions couvrent bien les 3 thèmes exacts à chaque génération (y
  compris après « Nouvelle fiche »), niveau/mode verrouillés, bouton
  « Nouvelle fiche (mêmes thèmes) » absent, panneau « Devoir en cours »
  et bandeau des thèmes corrects, bouton de correction déjà bloqué par le
  correctif précédent (aucune régression, les deux verrouillages se
  composent normalement). `?theme=droites` sur `fiche.html` sans devoir
  revérifié, comportement inchangé. **Non testé en conditions réelles avec
  un vrai devoir Firestore** (création via `devoirs.html`, lecture via
  `devoirAutomatismeFicheActif()`, écriture dans `devoirsTentatives`,
  affichage dans la vue résultats de `devoirs.js` et `/mes-devoirs/`) —
  contrairement aux chantiers devoirs précédents sur ce projet, qui
  utilisaient systématiquement un compte enseignant/élève jetable créé via
  `outils/creer-comptes` : à faire par David (ou sur demande explicite) avant
  de considérer cette brique aussi solide que le reste des devoirs
  d'automatismes.

  **Bug bloquant trouvé par le premier vrai test de David (28/09/2026,
  compte `demo-eleve`, classe `1ere-demo`)** : devoir créé avec 3 thèmes,
  mais côté élève seulement 2 thèmes tirés (le défaut de la pratique
  libre), niveau/mode restés au libre choix, bouton « Voir toutes les
  réponses » resté actif — comme si aucun devoir n'était détecté du tout.

  **Cause, trouvée en lisant `<script type="module" src=".../suivi.js">` de
  `sujet-blanc.html` puis en cherchant le même tag dans `fiche.html` : il
  n'y était pas.** `fiche.html` n'avait jamais eu besoin de `suivi.js`
  avant ce chantier (pratique libre non suivie) ; toute la logique de
  verrouillage ajoutée le 28/09/2026 (`window.devoirAutomatismeFicheActif`,
  `window.verifierEtatDevoirAutomatisme`,
  `window.enregistrerTentativeFicheAutomatismesSiDevoir`) appelait donc des
  fonctions `window.X` jamais attachées — `if (window.
  devoirAutomatismeFicheActif)` silencieusement faux, `verrouille` restait
  `null` en permanence, d'où les 4 symptômes d'un coup (thèmes, niveau,
  mode, bouton correction) : rien n'était un bug de LOGIQUE de
  verrouillage (déjà testée en conditions réelles avec un faux
  `config.verrouille`, voir plus haut), seulement l'absence du script qui
  aurait dû fournir la vraie valeur. Corrigé en une ligne : `<script
  type="module" src="../../assets/js/suivi.js"></script>` ajouté dans
  `<head>`, même emplacement que `sujet-blanc.html`.

  **Diagnostic mené en lisant directement Firestore** (script Node
  temporaire dans le scratchpad de session, SDK Admin via `outils/
  creer-comptes/service-account.json` déjà en place, lecture seule) plutôt
  qu'en supposant : confirmé que le document `devoirs/{id}` créé par David
  portait bien `cible:'fiche'` et `themes:['calcul-numerique',
  'developper-factoriser','equations']` — l'écriture (formulaire
  `devoirs.html`) était donc correcte du premier coup, seule la LECTURE
  côté `fiche.html` était cassée. Utile de le vérifier avant de suspecter
  le formulaire ou la logique de correspondance dans `suivi.js`, plus
  complexes et donc plus tentants à soupçonner en premier.

  Au passage, deux questions de David clarifiées (comportement déjà correct,
  pas de code à changer) : (1) un « Recommencer » compte bien comme une
  tentative normale du devoir dès qu'il est mené à son terme — `recommencer()`
  remet `ETAT.serieSignalee` à `false` sans changer les questions
  elles-mêmes (mêmes valeurs générées, contrairement à « Nouvelle fiche » qui
  en tire de nouvelles), donc la complétion suivante redéclenche `onFinSerie`
  et s'enregistre normalement dans `devoirsTentatives`, comptée dans
  `nbEssaisMax` comme n'importe quelle autre tentative. (2) le bouton
  « Nouvelle fiche (autres thèmes) » ne doit jamais changer de thème pendant
  un devoir : déjà garanti par le verrouillage lui-même
  (`ETAT.config.banques`/`nbThemes` réduits aux thèmes imposés, voir plus
  haut) — une fois `verrouille` correctement peuplé (donc une fois le bug
  ci-dessus corrigé), le clic régénère de nouvelles questions mais toujours
  sur les mêmes thèmes, et le libellé du bouton redevient simplement
  « Nouvelle fiche » (sans « autres thèmes », trompeur sinon).

  Vérifié après correction : `window.devoirAutomatismeFicheActif`/
  `verifierEtatDevoirAutomatisme`/`enregistrerTentativeFicheAutomatismesSiDevoir`
  bien définis sur `window` après chargement de `fiche.html` dans le
  navigateur (`typeof` renvoie `"function"` pour les trois, `"undefined"`
  avant le correctif — reproduit la cause exacte), aucune erreur console,
  syntaxe des deux `<script>` classiques revérifiée. **Reste à refaire par
  David** : le test complet avec son compte `demo-eleve` réel (devoir de
  test encore actif au moment de ce correctif, échéance 28/09/2026 17h30
  UTC) pour confirmer le verrouillage réel désormais visible côté élève et
  l'écriture dans `devoirsTentatives`/l'affichage des résultats.

- **Correction/sujet blanc : réactivation dès essais épuisés + pop-up plus
  visible (28/09/2026, mêmes échanges avec David que ci-dessus)**, deux
  retours après son premier test :

  1. **« Voir toutes les réponses »/« Voir la correction détaillée » doit se
  réactiver dès que les essais du devoir sont épuisés**, pas seulement après
  l'échéance — jusqu'ici le blocage (ajouté plus haut le 28/09/2026) durait
  toute la fenêtre du devoir sans exception, alors qu'une fois le quota
  atteint, l'élève ne peut plus soumettre de nouvelle tentative : plus aucune
  raison de lui cacher le corrigé. `ETAT.config.verrouille` porte désormais
  un champ `bloque` (déjà renvoyé par `devoirAutomatismeActif`/
  `devoirAutomatismeFicheActif`, simplement pas transmis jusqu'ici) : les
  deux boutons ainsi que `basculerReponses()`/le handler `basculer-revue`
  (deuxième ligne de défense) utilisent une nouvelle fonction commune
  `correctionBloqueeParDevoir()` (`ETAT.config.verrouille &&
  !ETAT.config.verrouille.bloque`) au lieu du simple `!!ETAT.config.verrouille`
  d'avant. Niveau/mode/durée/thèmes restent verrouillés jusqu'à l'échéance,
  seule la correction se débloque.

  Le cas intéressant : la tentative qui épuise le quota est SOUVENT celle
  qui vient tout juste d'être terminée (`verrouille.bloque`, calculé au
  chargement de la page, ne le sait pas encore). Nouvelle fonction exportée
  `Automatismes.actualiserVerrouille(patch)` (`moteur.js`) : fusionne un
  patch dans `ETAT.config.verrouille` et redessine, sans relancer de série
  — appelée dans `onFinSerie` (`fiche.html`/`sujet-blanc.html`) juste après
  l'écriture de la tentative (désormais `await`-ée, elle ne l'était pas
  avant — nécessaire pour que la relecture d'état qui suit voie bien cette
  tentative) : si l'état rechargé après coup (`etatApres`) indique le quota
  atteint, `verrouille.bloque` passe à `true` et la page se redessine
  aussitôt, bouton de correction réactivé sans recharger la page.

  2. **Message « tentative épuisée » transformé en pop-up**, jugé trop
  discret en petit texte gris sous la fiche/le sujet blanc. Nouveau
  `.modal-devoir` (`automatismes.css`), même langage visuel que
  `.modal-figure` déjà en place (fond assombri, carte blanche centrée) mais
  en plus étroit, avec titre coloré (`--orange`) et bouton d'action explicite
  « Compris » plutôt qu'un simple clic sur le fond pour fermer (le clic sur
  le fond ferme quand même, en plus de la croix et du bouton — même principe
  que `fermerZoom()` : ne se déclenche que si le clic cible directement le
  fond, jamais un descendant, pour ne pas fermer par erreur au clic dans le
  texte). `#suivi-etat` (le paragraphe d'origine) retiré des deux pages,
  remplacé par `afficherModaleDevoir(texte)`/`fermerModaleDevoir()` (dupliquées
  sur les deux pages, comme `formaterEcheance()` déjà avant elles — pas
  couplées à `moteur.js`, qui ignore tout du concept de devoir). Fermeture
  automatique de la pop-up (si ouverte) au clic sur « Nouvelle fiche »/
  « Nouvelle fiche (mêmes thèmes) », comme avant pour le paragraphe.

  Vérifié en conditions réelles dans le navigateur (faux `config.verrouille`,
  sans passer par un vrai devoir Firestore, même limite que les tests
  précédents) sur les deux pages et les deux modes (fiche/chrono) : bouton de
  correction désactivé avec `bloque:false`, réactivé instantanément par un
  appel direct à `Automatismes.actualiserVerrouille({bloque:true})` sans
  rechargement, clic révèle alors bien la correction, panneau « Devoir en
  cours » (niveau/mode) toujours affiché après réactivation (seule la
  correction se débloque). Pop-up : ouverture/fermeture par la croix, le
  bouton « Compris », un clic sur le fond et la touche Échap, un clic à
  l'intérieur du texte ne la ferme PAS, fermeture automatique confirmée au
  clic sur « Nouvelle fiche ». Capture d'écran de la pop-up (rendu propre,
  lisible). Comportement libre (sans devoir) revérifié inchangé sur les deux
  pages. Syntaxe (`vm.Script`/`node --check`) sur les 3 fichiers modifiés,
  aucune erreur console.

  **Retour de David le jour même, après un vrai test à 1 essai** : les
  boutons de correction se réactivaient bien après la tentative (confirme
  le mécanisme ci-dessus), mais **aucun message n'informait l'élève que
  son essai unique venait d'être consommé** — silence complet, alors que
  le cas « tentative refusée parce que déjà épuisée avant même de
  commencer » (`etatAvant.bloque`) affichait bien sa pop-up. Cause : ce
  cas-là (« c'est justement CETTE tentative qui vient d'épuiser le quota
  ») ne déclenchait que la réactivation technique
  (`Automatismes.actualiserVerrouille`), sans jamais prévenir l'élève —
  angle mort du correctif précédent, qui ne traitait que la mécanique de
  déblocage, pas le message qui doit l'accompagner.

  Corrigé en ajoutant une seconde pop-up, distincte de la première (les
  deux passent par un `if (etatAvant.bloque) {…} else if (…) {…}` : jamais
  affichées ensemble) : dès que `etatApres.bloque` devient vrai après
  l'écriture de la tentative EN COURS, message dédié — « C'était ta
  dernière tentative autorisée pour ce devoir (« {titre} », {essaisUtilises}
  /{nbEssaisMax}). Ta meilleure note a été retenue. Tu peux désormais
  consulter la correction, et continuer à t'entraîner librement. » — sur
  `fiche.html` et `sujet-blanc.html`.

  Vérifié en conditions réelles dans le navigateur, en simulant précisément
  ce scénario (stub de `window.verifierEtatDevoirAutomatisme` renvoyant
  `bloque:false` au premier appel puis `bloque:true` au second, reproduisant
  fidèlement le code exact des deux pages plutôt qu'un raccourci) : la
  pop-up « dernière tentative » s'affiche avec le bon texte et les bons
  compteurs (1/1), le bouton se débloque en même temps, capture d'écran
  confirmant un rendu propre ; scénario inverse (tentative déjà refusée,
  `etatAvant.bloque` vrai dès le premier appel) revérifié séparément sur
  `sujet-blanc.html` en mode chrono, affiche bien l'AUTRE message (« tu as
  utilisé tes tentatives… cette tentative ne compte plus ») — confirme que
  les deux pop-up restent mutuellement exclusives. Syntaxe des deux pages
  revérifiée, aucune erreur console.

- **Verrouillage restant actif malgré essais épuisés, sur un chargement neuf
  (28/09/2026, même jour, troisième retour de David)** : après son test à 1
  essai sur une fiche ciblée sur 1 thème, il retourne au sommaire puis
  redemande une fiche d'automatismes libre (2 thèmes) — mais un seul thème
  lui est proposé, exactement celui du devoir déjà épuisé.

  **Cause** : `devoirAutomatismeActif()`/`devoirAutomatismeFicheActif()`
  (`suivi.js`) renvoient le devoir tant que l'échéance n'est pas passée,
  **même si les essais sont épuisés** (`bloque` n'était calculé que pour
  informer, jamais utilisé pour décider si le devoir doit encore verrouiller
  quoi que ce soit) — les deux pages construisaient donc `verrouille` dès
  qu'un devoir existait, sans jamais vérifier `devoir.bloque`. Un devoir
  épuisé mais pas encore échu continuait donc de verrouiller la page à
  chaque nouveau chargement, alors qu'aucune tentative supplémentaire n'est
  de toute façon plus possible dessus.

  **Corrigé à la source, sur les deux pages** : `if (devoir && !devoir.bloque
  && …)` avant de construire `verrouille` — un devoir épuisé est désormais
  traité exactement comme un devoir dont l'échéance est passée (aucun
  verrouillage), dès le prochain chargement.

  **Au passage, simplification du mécanisme ajouté plus tôt dans la
  journée** : le système à deux temps (`verrouille` présent mais
  `verrouille.bloque` vrai, correction seule réactivée) devenait incohérent
  avec ce correctif — un devoir épuisé ne doit plus verrouiller RIEN du
  tout, pas seulement laisser voir la correction. Remplacé
  `Automatismes.actualiserVerrouille(patch)` par `Automatismes.
  leverVerrouille()` (sans paramètre) : lève complètement le verrouillage
  (thèmes/niveau/mode/durée + correction) SANS changer la série actuellement
  affichée (déjà corrigée, ne doit pas disparaître sous les yeux de l'élève)
  — seules les actions futures (Nouvelle fiche, changement de niveau/mode)
  redeviennent libres. `demarrer()` (`moteur.js`) mémorise désormais
  `banques`/`nbThemes`/`labelNouvelle` d'AVANT verrouillage
  (`_banquesAvantVerrouillage` etc.) au moment où `config.verrouille.themes`
  est appliqué, pour pouvoir les restaurer par `leverVerrouille()` sans les
  redemander à la page. `correctionBloqueeParDevoir()` simplifié en
  `!!ETAT.config.verrouille` (un devoir présent verrouille tout ou rien,
  plus d'état intermédiaire). Les deux pages : `verrouille.bloque = true`
  remplacé par `verrouille = null; Automatismes.leverVerrouille();` dans
  `onFinSerie`.

  Vérifié en conditions réelles dans le navigateur (stub de
  `verifierEtatDevoirAutomatisme`, même méthode que les tests précédents) :
  scénario complet sur `fiche.html` (devoir 1 thème/1 essai) — pop-up «
  dernière tentative » affichée, `ETAT.config.verrouille` devient bien
  `null`, panneau verrouillé disparaît, 3 boutons de niveau réapparaissent ;
  clic sur « Nouvelle fiche » ensuite tire bien parmi les 8 banques (thèmes
  aléatoires, plus seulement celui du devoir), `nbThemes`/`banques`/
  `labelNouvelle` correctement restaurés à leurs valeurs libres d'origine.
  Même vérification sur `sujet-blanc.html` (niveau/mode redeviennent
  choisissables). Non-régression revérifiée : un devoir actif et NON
  épuisé verrouille toujours normalement sur les deux pages (bouton
  désactivé, panneau verrouillé affiché, aucun bouton de niveau libre).
  Syntaxe (`node --check`/`vm.Script`) sur les 3 fichiers, aucune erreur
  console.

- **Latence perçue comme un blocage persistant du bouton de correction
  (28/09/2026, même jour, quatrième retour de David)** : après confirmation
  que le déverrouillage des thèmes fonctionnait, David signale que le
  bouton « Voir toutes les réponses » restait quand même bloqué « en
  revenant en mode normal après un devoir terminé ».

  **Cause** : le correctif précédent levait le verrouillage en deux
  allers-retours Firestore SÉQUENTIELS — `enregistrerTentativeFicheAutomatismesSiDevoir`/
  `enregistrerAutomatisme` (écrit la tentative) PUIS un second appel à
  `verifierEtatDevoirAutomatisme` (relit l'état pour savoir si cette
  tentative vient d'épuiser le quota). Le bouton restait donc visiblement
  désactivé pendant toute la durée cumulée des deux requêtes réseau — pas
  un blocage permanent, mais un délai perceptible (facilement plusieurs
  centaines de ms) que David a interprété comme figé.

  **Corrigé en supprimant le second aller-retour**, devenu inutile :
  l'information nécessaire (le nombre d'essais déjà utilisés AVANT cette
  tentative, `etatAvant.essaisUtilises`, et le plafond `nbEssaisMax`) est
  déjà en main depuis la première vérification, faite avant l'écriture.
  Puisque l'écriture qui vient de se terminer a forcément incrémenté ce
  compteur de 1 (sinon elle aurait été refusée par
  `enregistrerTentativeDevoirAutomatismeSiApplicable`, cas déjà couvert par
  la branche `etatAvant.bloque` juste au-dessus), `essaisApresCetteTentative
  = etatAvant.essaisUtilises + 1` suffit à savoir si le quota vient d'être
  atteint — sans relire Firestore une seconde fois. Un seul aller-retour
  réseau reste incompressible (il faut bien attendre que la tentative soit
  écrite), mais le second est éliminé.

  Vérifié en conditions réelles dans le navigateur (même méthode de stub
  fidèle que les tests précédents) : sur `fiche.html`, après un délai
  artificiel de seulement 20 ms (contre 300 ms utilisés pour les tests
  précédents, qui masquaient cette latence), le bouton est déjà réactivé,
  `verrouille` déjà `null`, la pop-up « dernière tentative » déjà affichée
  avec le bon compteur (1/1) — confirme que le déblocage ne dépend plus
  que d'un seul aller-retour au lieu de deux. Cas « tentative déjà refusée
  » (`etatAvant.bloque` vrai dès le premier appel) revérifié séparément sur
  `sujet-blanc.html`, comportement inchangé (verrouillage maintenu, comme
  attendu — ce cas ne correspond à aucune écriture nouvelle). Syntaxe des
  deux pages revérifiée, aucune erreur console.

- **Lot de 4 retours de David après avoir testé l'ensemble des devoirs
  (29/09/2026)**, avant de coder quoi que ce soit : deux points ont d'abord
  été vérifiés par relecture de code plutôt que supposés être des bugs.

  1. **« Un élève connecté ne peut plus corriger au fur et à mesure/voir
  toutes les réponses hors devoir »** — relecture de `fiche-01.html`
  confirmant que c'est un comportement VOLONTAIRE et déjà en place depuis
  le 18-19/09/2026 (`reveler = !eleveConnecte || ficheValidee`, masque la
  correction pour TOUT élève connecté tant qu'il n'a pas validé, devoir ou
  pas), déjà documenté plus haut dans ce fichier. Question posée à David
  pour savoir s'il fallait changer cette règle pour ne l'appliquer que
  pendant un devoir actif — **question laissée sans réponse (« ne pas
  procéder »)** : aucun changement fait sur ce point, en attente d'une
  décision de sa part.

  2. **« La limite d'essais ne fonctionne pas en mode devoir (fiche de
  calcul et sujet blanc) »** — relecture de `enregistrerTentativeDevoirSiApplicable`
  et `verifierEtatDevoir` (fiche de calcul) confirmant que le blocage
  serveur (écriture refusée au-delà du quota) était déjà correct et déjà
  testé le 19/09/2026. David précise alors : le bouton "Valider" restait
  cliquable après la limite, **sans aucune indication pour dire si la
  tentative comptait encore** — exactement le même défaut de clarté déjà
  corrigé côté automatismes un peu plus tôt dans la journée (voir
  ci-dessus), jamais reporté côté fiches de calcul. Demande explicite de
  généraliser la pop-up (jugée claire) des fiches d'automatismes ciblées à
  tous les types de devoir.

  **Généralisé aux 52 fiches de cahiers de calcul** (Première + Seconde),
  piloté sur `fiche-01.html` avant propagation mécanique (même méthode que
  les chantiers précédents de ce type) :
  - Nouveau `#modal-devoir` (HTML + CSS), même composant que sur les pages
    d'automatismes (fond assombri, carte blanche centrée, titre orange,
    bouton « Compris », fermeture par croix/fond/Échap), inséré juste après
    `#suivi-etat` et stylé dans le `<style>` inline de chaque fiche
    (`#D97706` en dur pour l'orange, `--gris`/`--bleu`/`--rouge` déjà
    définis partout — vérifié par grep sur les 52 fichiers avant d'écrire
    le script).
  - `validerFicheActuelle()` réécrite : le message « tentative refusée »
    (déjà présent) passe en pop-up ; nouveau calcul `essaisApresCetteValidation
    = etatDevoir.essaisUtilises + 1` juste après une validation réussie —
    si elle vient d'épuiser le quota, désactive immédiatement « Valider »
    (`resteDesactive`, empêche le `finally` de le réactiver sans condition)
    et affiche la pop-up « C'était ta dernière tentative... », sans attendre
    un rechargement. Même principe que le correctif équivalent côté
    automatismes (calcul direct à partir d'un état déjà en main, pas de
    second aller-retour Firestore).
  - Le message d'arrivée sur une fiche déjà épuisée (`initialiserFiche()`,
    inchangé) reste en texte simple, pas en pop-up — pour ne pas imposer une
    pop-up à chaque visite d'une fiche déjà connue comme épuisée ; seule la
    réaction à une action de l'élève (valider) déclenche la pop-up.

  **Script de propagation** (`.claude/scratch/propager-popup-devoir.ps1`,
  hors dépôt) : vérification d'uniformité préalable (hash MD5) sur les 52
  fiches avant d'écrire quoi que ce soit — `afficherEtatSuivi()`,
  `validerFicheActuelle()` d'origine, la ligne `#suivi-etat` et les 6
  dernières lignes avant `</style>` sont 100 % identiques sur les 51 fiches
  non pilotées (contrairement aux rollouts précédents sur ce projet, qui
  avaient réservé des surprises de mise en forme) : propagation mécanique
  sans cas particulier, chaque marqueur extrait dynamiquement de
  `fiche-01.html`/`fiche-02.html` (jamais de texte accentué tapé en dur
  dans le `.ps1`, même précaution que les scripts précédents — piège CRLF
  cette fois : les fichiers du dépôt sont en CRLF sur ce PC, les marqueurs
  construits à la main utilisent `` `r`n `` et pas seulement `` `n ``).
  51 fiches modifiées, 0 déjà à jour, aucune erreur de marqueur introuvable.

  Vérifié : syntaxe (`vm.Script`) sur les 52 fiches, 0 erreur ; comptage
  d'unicité (exactement une modale, une fonction `afficherModaleDevoir`,
  une nouvelle `validerFicheActuelle` par fichier, aucun doublon) ; aucune
  trace résiduelle de l'ancien message court ; nombre de `</style>` par
  fichier resté à 1. Test réel dans le navigateur avec un faux
  `etatDevoir`/`eleveConnecte` (même méthode que les tests automatismes) :
  `fiche-01.html` (Première) ET `fiche-01.html` (Seconde, fiche différente
  de la pilote) — bouton désactivé immédiatement, pop-up avec le bon texte
  et le bon compteur (1/1), interactions de fermeture (croix/bouton/fond/
  Échap) toutes correctes, capture d'écran confirmant un rendu identique à
  celui des pages d'automatismes ; `fiche-08.html` (Seconde, widget
  `tableauSigne`, structure plus particulière déjà signalée fragile par le
  passé) revérifiée séparément — fonctions et modale bien présentes,
  aucune erreur console. Sujet blanc d'automatismes : déjà couvert par le
  même mécanisme construit plus tôt dans la journée (voir ci-dessus),
  aucun changement supplémentaire nécessaire.

  3. **« Popup affiché dès la 1ère tentative sur un devoir à 2 essais »**
  (fiche d'automatismes ciblée) — avant de suspecter la logique de comptage
  (déjà testée plusieurs fois ce même jour), lecture directe de Firestore
  (script Node temporaire, lecture seule, même méthode que le diagnostic du
  script `suivi.js` manquant plus tôt) : le devoir concerné portait bien
  `nbEssaisMax` correct, MAIS l'historique `devoirsTentatives` de
  `demo-eleve` a révélé plusieurs paires de tentatives écrites à quelques
  centaines de millisecondes d'intervalle sur des `devoirId` DIFFERENTS
  avec un score identique — signe qu'au moment de ces tests, plusieurs
  devoirs correspondant aux mêmes critères (niveau/mode/thèmes/classe)
  étaient actifs simultanément (créés/supprimés rapidement pendant les
  essais successifs de David). `enregistrerTentativeDevoirAutomatismeSiApplicable`/
  `enregistrerTentativeDevoirSiApplicable` bouclent sur TOUS les devoirs
  correspondants et écrivent une tentative dans CHACUN — une seule action
  de l'élève a donc pu consommer un essai sur un devoir « fantôme » dont
  l'élève n'avait pas conscience, faussant le compte affiché. **Pas de
  correctif de code appliqué** : la relecture confirme que la logique de
  comptage elle-même est correcte, ce cas semble provoqué par la création/
  suppression rapprochée de plusieurs devoirs de test se chevauchant. À
  vérifier avec un test propre (un seul devoir actif à la fois) ; le
  chevauchement de plusieurs devoirs identiques sur la même classe reste
  une amélioration possible (matcher/écrire sur un seul devoir choisi de
  façon déterministe plutôt que sur tous les matches) si le cas se
  reproduit en dehors d'un contexte de test.

  4. **« Ajouter Enregistrer/Valider à tous les types de devoir
  d'automatismes »** — demande notée, pas encore commencée (chantier
  séparé, plus large : reproduire pour les pages d'automatismes le modèle
  brouillon/validation déjà construit pour les fiches de cahier de calcul).

- **Mode entraînement connecté (hors devoir) sur les 52 fiches de cahiers de
  calcul (29/09/2026, suite du point 1 ci-dessus)** : demande de David après
  un résumé demandé du comportement actuel par cas (anonyme / connecté
  devoir / connecté entraînement) — confirmé que « Enregistrer mon
  avancement » n'a jamais compté comme tentative (point déjà vrai, aucun
  changement nécessaire). Pour le mode entraînement précisément, David
  demande : garder le choix de mode et « Corrigé des erreurs » comme pour un
  anonyme, rendre « Voir toutes les réponses » disponible sans attendre une
  validation, tout en gardant « Valider ma fiche » EN PLUS (pas de
  changement du mécanisme d'envoi du score au tableau de bord — écarté
  l'option d'un envoi automatique sans bouton, qui aurait annulé l'économie
  Firestore du 19/09). Chantier « enregistrement pour fiches hors devoir »
  (extension aux automatismes, section « Mes fiches enregistrées »,
  suppression automatique après 1 semaine) explicitement abandonné pour
  l'instant sur demande de David.

  **Principe retenu** : la restriction « pas de correction avant validation »
  qui s'appliquait jusqu'ici à TOUT élève connecté (devoir ou non) ne
  s'applique plus qu'en mode devoir (`etatDevoir` non nul). Piloté sur
  `fiche-01.html` avant propagation mécanique aux 51 autres :
  - `mettreAJourEtatBoutons()` : `boutonToutes.disabled = eleveConnecte &&
    !!etatDevoir && !ficheValidee` (au lieu de `eleveConnecte &&
    !ficheValidee`) — "Voir toutes les réponses" reste toujours disponible
    hors devoir.
  - `verifierUne()` : `reveler = !eleveConnecte || !etatDevoir ||
    ficheValidee` — correction immédiate hors devoir, comme un anonyme.
  - Les 3 endroits où l'appui sur Entrée/le blur d'un champ vérifiaient
    silencieusement la réponse pour TOUT élève connecté (`if (eleveConnecte)
    { verifierUne(idx); ... } else if (modeImmediat) { ... }`, dans
    `attacherEcouteurs()` × 2 et `validerEtAvancer()`) : condition passée à
    `eleveConnecte && etatDevoir`, pour qu'un élève connecté en entraînement
    tombe désormais dans la branche `else if (modeImmediat)` — c'est-à-dire
    respecte le choix de mode comme un anonyme, au lieu d'être toujours
    vérifié silencieusement en arrière-plan.
  - `initialiserFiche()` : le calcul initial `panneauMode.hidden =
    eleveConnecte` / `boutonVerifier.hidden = eleveConnecte` (fait avant de
    savoir si un devoir existe) reste tel quel comme valeur par défaut
    inoffensive, corrigé juste après par deux lignes ajoutées à la fin du
    bloc de vérification du devoir (déjà existant, inchangé) :
    `panneauMode.hidden = eleveConnecte && !!etatDevoir` /
    `boutonVerifier.hidden = eleveConnecte && !!etatDevoir` — évite de
    déplacer le bloc de vérification lui-même (dont le contenu varie
    légèrement selon la fiche, voir plus bas).

  **Propagation mécanique, en trois passes** (scripts dans `.claude/scratch/`,
  hors dépôt) :
  1. `boutonToutes.disabled`/`reveler` : uniquement les LIGNES DE CODE
     remplacées (pas les commentaires juste au-dessus) — découvert en
     vérifiant l'uniformité au préalable que le commentaire au-dessus de
     `reveler` varie légèrement sur les fiches à widget (« … a chaque
     réponse **tapée** » vs « … a chaque réponse **vérifiée** », plus
     cohérent avec leur interaction par clics plutôt que par saisie) —
     utiliser ce commentaire comme ancre aurait fait échouer le script sur
     ces fiches-là.
  2. `if (eleveConnecte) {` → `if (eleveConnecte && etatDevoir) {` :
     remplacement global simple (pas de bloc à extraire), puisque ce motif
     exact n'apparaît nulle part ailleurs avec un sens différent. **Absent
     sur 14 fiches à widget/graphique** (`fiche-08/09/10/14 à 23/25`,
     Seconde) : leur `keydown`/`blur` ne teste jamais `eleveConnecte`, juste
     `modeImmediat` (qui vaut déjà `true` par défaut, jamais changé pour un
     élève connecté avant ce chantier puisque le panneau était masqué) — ces
     fiches profitent donc du nouveau comportement entraînement sans aucune
     modification supplémentaire, uniquement grâce au correctif `reveler`
     ci-dessus. **2 fiches** (`seconde/cahier-1/fiche-02.html`,
     `seconde/cahier-2/fiche-06.html`) ont une structure plus ancienne où le
     clavier délègue à `validerEtAvancer(idx)` au lieu de dupliquer la
     logique dans `keydown` : seulement 2 occurrences à corriger au lieu de
     3, mêmes blocs `validerEtAvancer`/`blur` byte-à-byte identiques aux
     35 « fiches standard » malgré tout (vérifié par hash avant d'écrire le
     script).
  3. Insertion des deux lignes correctrices après le bloc (inchangé) de
     vérification du devoir dans `initialiserFiche()` — bloc localisé en
     comptant les accolades depuis son `{` d'ouverture plutôt qu'en cherchant
     un texte de fin fixe (robuste au contenu accentué à l'intérieur,
     jamais tapé à la main dans le script).

  **Piège rencontré en cours de route** : le tout premier lancement du
  script de l'étape 1/2 (avec les commentaires inclus dans l'ancre) a
  partiellement réussi avant d'échouer sur une fiche à commentaire
  légèrement différent — 35 fichiers déjà réécrits avec le nouveau
  commentaire au moment du crash, les 17 restants pas encore touchés.
  Plutôt que de revenir en arrière, passage à l'ancrage code-seul (plus
  robuste) pour les 17 restants, PUIS un script de nettoyage séparé
  (`uniformiser-commentaires.ps1`) pour ré-harmoniser le commentaire sur
  ces 17-là (avec les deux variantes « tapée »/« vérifiée » gérées
  explicitement) — sans quoi les 52 fiches auraient eu un commentaire
  incohérent d'un fichier à l'autre pour un même comportement.

  Vérifié : uniformité totale après coup (grep sur les 52 fichiers,
  0 résidu de l'ancien texte, 52/52 sur le nouveau, dans les deux sens) ;
  syntaxe (`vm.Script`) sur les 52 fiches, 0 erreur ; test réel dans le
  navigateur sur 4 fiches représentatives de chaque cas : `fiche-01.html`
  (Première, pilote, capture d'écran confirmant tous les boutons visibles
  en entraînement — choix de mode, Corrigé des erreurs, Enregistrer,
  Valider, Voir toutes les réponses), `fiche-08.html` (Seconde, widget
  tableauSigne, groupe sans `if (eleveConnecte)`) en entraînement ET en
  devoir (non-régression confirmée), `fiche-02.html` (Seconde, structure à
  `validerEtAvancer` délégué) en entraînement et en anonyme. Comportement
  devoir revérifié inchangé à chaque fois (panneau/Corrigé des erreurs
  masqués, correction cachée jusqu'à validation).

- **Retour en arrière sur le point précédent : suivi enseignant limité aux
  devoirs donnés, entraînement hors devoir = anonyme (29/09/2026)** : David
  revient sur la décision « garder Valider en plus » prise quelques échanges
  plus tôt (entrée ci-dessus) : « Je ne ferai un suivi enseignant que sur les
  devoirs donnés. je ne suivrai pas les fiches ou les automatismes que feront
  les élèves, même connectés. » Demande explicite : le mode connecté hors
  devoir doit fonctionner exactement comme un élève anonyme (mêmes boutons,
  pas de validation obligatoire, pas d'enregistrement, correction et « Voir
  toutes les réponses » toujours actifs), et le tableau de bord enseignant ne
  garde que la vue Devoirs.

  **1) Cahiers de calcul (52 fiches)** — `zone-enregistrer` et `zone-valider`
  ne sont plus jamais affichées hors devoir (avant : toujours visibles pour
  un élève connecté). Piloté sur `fiche-01.html`, trois retouches dans
  `initialiserFiche()`/`mettreAJourEtatBoutons()` :
  - Bloc correctif de fin de vérification du devoir (déjà existant pour
    `panneauMode`/`boutonVerifier`, voir entrée précédente) étendu à
    `zoneEnregistrer`/`zoneValider` : `zoneEnregistrer.hidden =
    !(eleveConnecte && etatDevoir)`, même chose pour `zoneValider` — au lieu
    de dépendre uniquement de `eleveConnecte`.
  - `mettreAJourEtatBoutons()` : la ligne qui pouvait re-révéler
    `zoneEnregistrer` après une validation en devoir (`zoneEnregistrer.hidden
    = enModeDevoirValide`) réécrite en `zoneEnregistrer.hidden = !etatDevoir
    || enModeDevoirValide` — sans ce garde, un élève connecté en entraînement
    voyait « Enregistrer » réapparaître à chaque appel de cette fonction (donc
    à chaque réponse tapée), puisque `enModeDevoirValide` vaut déjà `false`
    dès que `etatDevoir` est nul, quelle que soit `ficheValidee`.
  - `initialiserFiche()` : le chargement d'un brouillon existant conditionné
    à `eleveConnecte && etatDevoir` (au lieu de `eleveConnecte` seul) — sans
    « Enregistrer », plus aucun nouveau brouillon d'entraînement ne peut être
    créé ; ce garde évite seulement qu'un brouillon d'entraînement laissé par
    une session antérieure à ce changement soit encore repris silencieusement.

  Propagation mécanique aux 51 autres fiches (script dans `.claude/scratch/`,
  texte de remplacement extrait dynamiquement du pilote plutôt que tapé à la
  main). **Piège rencontré** : l'ancre de fin pour le remplacement de la
  ligne `zoneEnregistrer` dans `mettreAJourEtatBoutons()` incluait, sans
  intention, la déclaration `const zoneEnregistrer =
  document.getElementById('zone-enregistrer')` qui la précède immédiatement
  dans le texte du pilote — cette déclaration existait déjà, à l'identique,
  dans les 51 fichiers cibles à ce même endroit (héritée du code d'origine),
  puisque seule la ligne `if (zoneEnregistrer...)` servait d'ancre de
  remplacement côté script. Résultat : une seconde déclaration `const
  zoneEnregistrer` insérée juste après la première dans les 51 fichiers →
  `SyntaxError: Identifier 'zoneEnregistrer' has already been declared`,
  détecté par la vérification systématique `vm.Script` sur les 52 fiches
  (0 erreur attendu, 51 trouvées). Un correctif ciblé (autre script, retire
  uniquement la déclaration surnuméraire, repérée par son voisinage exact
  avec le dernier commentaire au-dessus) a ensuite corrigé les 51 fichiers —
  mais ce correctif, appliqué sans distinction sur les 52 fichiers, a retiré
  par erreur la SEULE déclaration du pilote (qui n'avait jamais été
  dupliquée), cassant à son tour `fiche-01.html` (référence à
  `zoneEnregistrer` sans déclaration dans la fonction). Repéré immédiatement
  par la même vérification `vm.Script`, corrigé en une édition manuelle
  ciblée sur le pilote (réinsertion de la déclaration). Après ces deux
  correctifs : `vm.Script` propre sur les 52 fiches (0 erreur), grep
  d'uniformité des trois changements (52/52 sur le nouveau texte, 0 résidu de
  l'ancien) sur `zoneEnregistrer`, `zoneValider` et la garde `chargerBrouillon`.
  Test réel dans le navigateur sur `fiche-01.html` (Première, pilote) et
  `fiche-11.html` (Seconde, cahier-4) dans les trois états (anonyme, connecté
  entraînement, connecté devoir + devoir validé) : entraînement connecté
  désormais identique à anonyme (panneau de mode et Corrigé des erreurs
  visibles, Enregistrer/Valider absents, Voir toutes les réponses jamais
  désactivé, y compris après plusieurs appels successifs de
  `mettreAJourEtatBoutons()` simulant des réponses répétées) ; devoir
  inchangé (panneau/Corrigé des erreurs masqués, Enregistrer/Valider
  présents, Voir toutes les réponses désactivé avant validation) ; aucune
  erreur console.

  **2) `assets/js/suivi.js`** — `validerFiche()` n'écrit plus dans
  `eleves/{uid}/resultats/{ficheId}` (score cumulé tous passages confondus) :
  cette collection n'était lue que par l'ancien tableau de bord « Fiches »,
  supprimé (voir point 3). Ne reste que l'écriture de la tentative de devoir
  si applicable, plus la suppression du brouillon en cours (une fiche validée
  n'est plus « en cours » à reprendre). `enregistrerAutomatisme()` renommée
  `enregistrerTentativeSujetBlancSiDevoir()` (nom qui reflète ce qu'elle fait
  désormais : plus d'écriture inconditionnelle dans
  `eleves/{uid}/automatismes`, agrégat lui aussi devenu orphelin — seule la
  tentative de devoir d'automatismes, si applicable, est encore enregistrée).
  Site d'appel mis à jour dans `automatismes/premiere/sujet-blanc.html`.
  Vérifié : `node --check` sur `suivi.js` et sur les deux `<script>` de
  `sujet-blanc.html` — 0 erreur ; grep sur tout le dépôt confirmant qu'aucune
  référence à l'ancien nom `enregistrerAutomatisme` ne subsiste.

  **Laissé volontairement de côté** (hors périmètre de cette demande,
  signalé mais pas traité) : `enregistrerTentative()` (ancien modèle par
  question, écrit `eleves/{uid}/tentatives`) reste appelée par 14 fiches à
  widget/graphique — désormais elle aussi orpheline (plus rien ne lit cette
  collection), mais la retirer proprement demanderait d'examiner
  individuellement chacun de ces 14 widgets ; risque jugé disproportionné par
  rapport à la demande. `enregistrerConnexion()` (journal de connexion)
  également laissée telle quelle, non demandée et gardant une valeur
  d'audit indépendante du tableau de bord.

  **3) Tableau de bord enseignant** — `tableau-de-bord/index.html` et
  `assets/js/tableau-de-bord.js` supprimés (`git rm`) : c'était l'unique
  lecteur des collections `resultats`/`automatismes` ci-dessus, plus les
  colonnes fiches effectuées/connexions par classe. `assets/css/tableau-de-bord.css`
  conservé (partagé avec `devoirs.html`, vérifié avant de ne pas le
  supprimer). `assets/js/nav-auth.js` : le lien de l'icône tableau de bord
  pointe désormais directement sur `/tableau-de-bord/devoirs.html`.
  `tableau-de-bord/devoirs.html` devient la seule page : titre et `<h1>`
  renommés « Tableau de bord » (au lieu de « Devoirs »), phrase d'intro
  complétée (« Seul le travail fait dans le cadre d'un devoir est suivi ici —
  l'entraînement libre... n'est pas enregistré »), bloc `<nav
  class="tdb-nav-principale">` (bascule Fiches/Devoirs, devenue inutile avec
  une seule page) supprimé. Vérifié par grep qu'aucun lien restant dans le
  dépôt ne pointe vers `tableau-de-bord/index.html`.

- **Procédure de tentative en mode devoir : 4 corrections demandées par
  David (30/09/2026)** — après usage réel du système mis en place les jours
  précédents, David relève quatre manques, tous en mode devoir (élève
  forcément connecté) :
  1. Les automatismes (sujet blanc + fiche ciblée) n'avaient ni Enregistrer
     ni Valider explicite.
  2. Procédure attendue uniforme sur les 3 surfaces : Enregistrer = reprise
     exacte ; une tentative ne compte qu'au clic sur Valider ; « Générer une
     nouvelle fiche » démarre une nouvelle tentative (l'élève doit le
     savoir) ; Recommencer doit disparaître en devoir.
  3. Pop-up de limite atteinte manquant dans certains cas.
  4. Tableau de bord élève : l'élève doit savoir exactement combien de
     tentatives il lui reste.

  Décisions actées avant implémentation : pas d'Enregistrer en mode chrono
  pour les automatismes (une série chrono se joue d'une traite, comme le
  jour de l'épreuve — seul le mode fiche est concerné) ; le compteur de
  tentatives doit apparaître directement sur la page du devoir, en plus de
  `/mes-devoirs/` (page déjà existante depuis le 19/09/2026, qui affichait
  déjà « X tentatives restantes » par devoir mais seulement là).

  **1) Cahiers de calcul (52 fiches)** — piloté sur `fiche-01.html`, propagé
  aux 51 autres. Trois retouches :
  - `mettreAJourEtatBoutons()` : `boutonRecommencer.hidden` simplifié en
    `eleveConnecte && !!etatDevoir` (disparaît dès qu'un devoir est actif,
    plus seulement après validation) ; nouveau `boutonValider.disabled =
    !!(etatDevoir && ficheValidee)` — **avant ce correctif, rien n'empêchait
    de cliquer plusieurs fois « Valider ma fiche » sur la MÊME fiche déjà
    vue/corrigée** (le bouton était réactivé sans condition à la fin de
    `validerFicheActuelle()`), consommant des tentatives sans jamais
    regénérer.
  - `genererNouvelleFiche()` : ajoute un `confirm()` (si `etatDevoir &&
    !etatDevoir.bloque`) informant que ce clic démarre une nouvelle
    tentative, avec le compte essais utilisés/max — c'est désormais le SEUL
    moyen de rejouer en devoir (Recommencer disparu). Annulé = rien ne
    change.
  - `validerFicheActuelle()` : `etatDevoir.essaisUtilises` incrémenté après
    CHAQUE validation réussie (avant : seulement celle qui épuisait le
    quota — bug trouvé en marge, sans conséquence visible jusqu'ici car rien
    n'affichait ce compte en continu).

  Nouvelle bannière persistante `#devoir-info` (répond aux points 3+4) :
  affiche en continu (pas seulement au clic) « Devoir « titre » — X/Y
  tentative(s) utilisée(s), à rendre avant le ÉCHÉANCE », ou le message de
  blocage une fois les essais épuisés. Pop-up au chargement si déjà bloqué
  (point 3) : avant ce changement, un élève arrivant sur la fiche APRÈS
  avoir épuisé ses tentatives lors d'une session précédente ne voyait
  jamais `afficherModaleDevoir` (réservé jusque-là au clic live qui épuise
  le quota), seulement la petite ligne grise `#suivi-etat`, facile à
  manquer.

  Propagation mécanique (script dans `.claude/scratch/`), avec le même
  piège que d'habitude et deux nouveaux à noter :
  - Un marqueur d'ancre contenant un accent (« Échec ») tapé directement
    dans le script PowerShell a été mal lu (PowerShell 5.1 lit les `.ps1`
    en ANSI) — `chec de la validation` (sans le É) utilisé à la place, en
    s'appuyant sur l'unicité du reste de la phrase.
  - Un marqueur de début trop court (`if (etatDevoir && etatDevoir.bloque)
    {`) matchait DEUX endroits dans chaque fiche (le blocage au chargement
    ET la seconde ligne de défense dans `validerFicheActuelle()`) :
    `IndexOf` a trouvé la première occurrence (dans `validerFicheActuelle`,
    bien avant dans le fichier), puis cherché le marqueur de fin bien plus
    loin — résultat, un bloc de remplacement de 42 000 caractères au lieu
    d'une poignée de lignes. Le script a échoué avant d'écraser quoi que ce
    soit d'incohérent, mais avait déjà modifié `fiche-02.html` (le premier
    fichier traité) avant de s'arrêter sur `fiche-03.html` — reverti via
    `git checkout` avant de corriger le marqueur (rendu unique en incluant
    la ligne suivante, `const boutonValider = ...`) et de relancer. Vérifié
    ensuite : `vm.Script` sur les 52 fiches (0 erreur), grep d'uniformité
    des 7 changements (52/52 sur le nouveau texte, 0 résidu de l'ancien),
    test réel dans le navigateur sur `fiche-01.html`, `fiche-02.html` et
    `fiche-11.html` (Seconde) dans les trois états (anonyme, connecté
    entraînement — inchangé —, connecté devoir avant/après validation,
    devoir déjà bloqué au chargement).

  **2) Automatismes (`automatismes/assets/moteur.js`, partagé par
  sujet-blanc.html et fiche.html)** — jusqu'ici, en mode fiche, une
  tentative s'écrivait automatiquement dès que la dernière question
  recevait une réponse (`verifierFinSerie()` déclenchée par `majBilan()`
  à chaque clic d'option) : aucun geste explicite, et le panneau de score
  s'affichait déjà à ce moment-là (fuite du score en temps réel avant toute
  validation, trouvée en marge — corrigée en bloquant `bilanFicheHTML()`
  par `correctionBloqueeParDevoir()`, comme le reste de la correction). Le
  mode chrono n'est pas concerné : il a déjà un geste explicite de fin
  (Terminer le sujet, ou le temps écoulé) et n'expose pas Recommencer dans
  son HTML — aucun risque de rejouer la même série sans regénérer.

  Ajouté, gated sur `ETAT.config.verrouille && ETAT.mode === 'fiche'` :
  - `verifierFinSerie()` : ne déclenche plus `onFinSerie` automatiquement
    dans ce cas — remplacé par un geste explicite.
  - Nouvelles fonctions `validerSerie()` (payload identique à
    `verifierFinSerie`, factorisé dans `payloadFinSerie()`, marque
    `ETAT.serieValidee = true`, supprime le brouillon) et
    `enregistrerSerieDevoir()` (sauvegarde questions+réponses, retour
    visuel léger sur le bouton lui-même — « Enregistré ✓ » 2 secondes —
    plutôt qu'un nouveau composant).
  - `vueFicheHTML()` : barre de boutons remplacée par Enregistrer/Valider
    (sans Recommencer) en devoir ; `nouvelleSerie()`/`nouvelleSerieMemeThemes()`
    remettent `ETAT.serieValidee` à `false` et suppriment tout brouillon
    devenu obsolète.
  - `attacherGlobal()` : « Nouvelle série »/« mêmes thèmes » enveloppés d'un
    `confirm()` si un devoir est actif (même principe que
    `genererNouvelleFiche()` côté cahiers de calcul) — vérifié qu'aucun
    `confirm()` ne se déclenche en pratique libre.
  - `demarrer()` : accepte `config.brouillon` (questions + réponses) pour la
    toute PREMIÈRE série uniquement — jamais pour les suivantes, qui tirent
    toujours au hasard.
  - `panneauVerrouilleHTML()` : ligne « Tentatives utilisées : X / Y »
    ajoutée (répond au point 4), à partir de `verrouille.essaisUtilises`/
    `nbEssaisMax` (nouveaux champs, alimentés par la page depuis l'objet déjà
    renvoyé par `devoirAutomatismeActif`/`devoirAutomatismeFicheActif` —
    jusqu'ici jamais recopiés dans `verrouille`). Mis à jour après chaque
    validation (même objet passé par référence à `Automatismes.demarrer`)
    sans recharger la page.

  **`assets/js/suivi.js`** : `devoirAutomatismeActif()` renvoie désormais
  aussi `id: devoir.id` (absent jusqu'ici, nécessaire pour cibler le bon
  devoir sans le rechercher une seconde fois). Trois nouvelles fonctions,
  même schéma que `enregistrerBrouillon`/`chargerBrouillon`/`supprimerBrouillon`
  mais indexées par `devoirId` plutôt que `ficheId` (un automatisme n'a pas
  de fiche stable) : `enregistrerBrouillonAutomatisme`,
  `chargerBrouillonAutomatisme`, `supprimerBrouillonAutomatisme` →
  `eleves/{uid}/brouillonsAutomatismes/{devoirId}`. Règle Firestore ajoutée
  (`firestore.rules`, même principe que `brouillons/{ficheId}`) et
  **republiée par David en Console Firebase le 30/09/2026**.

  **`sujet-blanc.html`/`fiche.html`** (modifications parallèles) :
  `verrouille` enrichi de `id`/`essaisUtilises`/`nbEssaisMax` ; chargement
  d'un brouillon existant avant `Automatismes.demarrer()` si
  `devoir.mode === 'fiche'` ; pop-up au chargement si `devoir.bloque` (même
  lacune que côté cahiers de calcul — rien n'était affiché jusqu'ici, le
  verrouillage était simplement levé en silence) ; `onFinSerie` met à jour
  `verrouille.essaisUtilises` après chaque tentative réussie.

  Vérifié en navigateur (pas de vraie session Firebase disponible en
  sandbox, donc `window.enregistrerTentativeSujetBlancSiDevoir`/
  `verifierEtatDevoirAutomatisme`/`enregistrerBrouillonAutomatisme`/etc.
  mockées directement, même méthode que pour les tests précédents de cette
  session) sur les deux pages, en mode fiche ET en mode chrono (non-
  régression) : boutons corrects selon le mode, réponse à toutes les
  questions sans fuite du score ni écriture automatique, Enregistrer
  round-trip, Valider écrit une fois, désactive le bouton, rafraîchit le
  panneau tentatives (0/3 → 1/3) sans recharger, un second clic (même
  forcé) n'écrit rien de plus, `confirm()` annulé ne change rien,
  `confirm()` accepté régénère et réactive Valider ; pratique libre
  (`verrouille: null`) : bilan toujours affiché normalement, aucun
  `confirm()` ne se déclenche sur « Nouvelle fiche ».

  **Correctif le jour même** : la correction automatismes restait bloquée
  pour toute la fenêtre du devoir, même après validation — seul l'épuisement
  des essais la débloquait. David demande, comme pour les cahiers de calcul
  (`ficheValidee`) : après avoir validé sa série, l'élève doit voir sa note
  ET pouvoir consulter toutes les réponses DE CETTE série précisément ;
  générer un nouveau sujet rebloque le bouton jusqu'à la prochaine
  validation. `correctionBloqueeParDevoir()` passe de `!!ETAT.config.verrouille`
  à `!!ETAT.config.verrouille && !ETAT.serieValidee`. Mode chrono concerné
  aussi : `terminerSerie()` (Terminer le sujet, ou le temps écoulé) joue le
  même rôle que le clic explicite "Valider ma série" du mode fiche — ajoute
  `ETAT.serieValidee = true` au même endroit où `ETAT.corrigees` était déjà
  mis à `true` (préparé mais jusqu'ici jamais révélé avant l'épuisement des
  essais). Message du bouton désactivé mis à jour (« valide ta série » au
  lieu de « une fois tes tentatives épuisées »). Vérifié en navigateur sur
  `sujet-blanc.html` (mode fiche et chrono) et `fiche.html` : score et
  correction visibles après validation/fin de série, re-bloqués après une
  nouvelle série confirmée.

- **Décalage de +1 sur la limite de tentatives, deux bugs distincts trouvés
  (30/09/2026)** — David signale : avec 2 tentatives autorisées, la première
  se compte bien, la deuxième non, et il faut une troisième pour que le
  pop-up de blocage se déclenche. Diagnostiqué en inspectant directement
  Firestore (script Node temporaire, `firebase-admin`, sur le compte
  `demo-eleve`) plutôt qu'en devinant : les **écritures réelles**
  (`devoirsTentatives`) s'arrêtaient bien exactement à 2 pour les trois
  devoirs fraîchement créés par David — l'enregistrement côté `suivi.js`
  était donc déjà correct. Le problème est double, et purement côté UI :

  1. **Cahiers de calcul** : `boutonValider.disabled` ne dépendait que de
     `ficheValidee`, pas de `etatDevoir.bloque`. Une fois les essais
     épuisés, `genererNouvelleFiche()` remet quand même `ficheValidee` à
     `false` (aucune confirmation affichée dans ce cas précis, mais la
     fonction régénère une fiche pour l'entraînement libre) — ce qui
     réactivait par erreur le bouton Valider pour UN clic de plus, intercepté
     ensuite par la « seconde ligne de défense » de `validerFicheActuelle()`
     sans rien écrire, d'où l'impression d'une limite décalée. Correctif :
     `boutonValider.disabled = !!(etatDevoir && (etatDevoir.bloque ||
     ficheValidee))`. Propagé aux 52 fiches (remplacement d'une seule ligne,
     aucun accent dans le texte cette fois, pas de piège PowerShell).

  2. **Automatismes** : plus profond. `verifierEtatDevoirAutomatisme()` et
     `enregistrerTentativeDevoirAutomatismeSiApplicable()` re-dérivaient le
     devoir concerné par une recherche floue (niveau + mode + duree + cible,
     +ensemble des thèmes pour une fiche ciblée) à CHAQUE appel, au lieu de
     cibler l'id du devoir déjà verrouillé sur la page. Dès que plusieurs
     devoirs similaires coexistent pour la même classe (niveau/mode/cible
     identiques, comme le confirme l'inspection Firestore : jusqu'à 4 devoirs
     « sujet blanc niveau 2 mode fiche » actifs simultanément sur la classe
     de test, tous recevant une écriture à la même validation), cette
     recherche peut retrouver un devoir différent de celui affiché à
     l'élève, décalant le compteur utilisé pour la décision de blocage.
     Reproduit délibérément en test (deux devoirs simulés, même
     niveau/mode/cible, essais indépendants) : sans le correctif, impossible
     à isoler proprement in vivo à cause du chevauchement des devoirs de
     test déjà documenté plus haut ; avec la simulation, le décalage est
     net.

     Corrigé en ciblant systématiquement par id, plus jamais par
     niveau/mode/duree/cible/themes :
     - `devoirAutomatismeActif()` (suivi.js, déjà modifié le 30/09/2026)
       fournissait déjà `id: devoir.id` — jusqu'ici seulement utilisé pour le
       brouillon.
     - Nouvelles fonctions `verifierEtatDevoirAutomatismeParId(devoirId)` et
       `enregistrerTentativeAutomatismeParId(devoirId, ...)` (suivi.js),
       lisent/écrivent pour CE devoir précis. Les anciennes
       `verifierEtatDevoirAutomatisme`, `enregistrerTentativeDevoirAutomatismeSiApplicable`,
       `devoirsPourAutomatisme` et `memeEnsembleThemes` sont devenues
       inutilisées et supprimées (aucun autre appelant trouvé par grep).
     - `enregistrerTentativeSujetBlancSiDevoir`/`enregistrerTentativeFicheAutomatismesSiDevoir`
       prennent désormais `devoirId` en premier paramètre ; les deux pages
       (`sujet-blanc.html`/`fiche.html`) le capturent dans une constante
       (`verrouille.id`) au tout début d'`onFinSerie`, AVANT que `verrouille`
       ne soit potentiellement remis à `null` plus bas dans la même fonction
       (essais épuisés par cette tentative).

  Vérifié : `vm.Script` sur les 52 fiches (0 erreur) ; grep d'uniformité du
  correctif cahiers de calcul (52/52, 0 résidu) ; grep confirmant la
  suppression complète des anciennes fonctions automatismes (aucune
  référence restante) ; test navigateur cahiers de calcul (2 tentatives
  bloquent exactement à la 2ᵉ, un 3ᵉ « Générer une nouvelle version » ne
  réactive plus Valider) ; test navigateur automatismes avec un devoir
  « voisin » simulé (même niveau/mode/cible, essais différents) confirmant
  que le decompte cible bien le SEUL devoir verrouillé, blocage exact à 2/2.

- **Ménage du compte `demo-eleve` et campagne de tests réels de bout en bout
  (30/09/2026)** — demande de David : « fais le ménage, génère de nouveaux
  devoirs de tout type et teste en profondeur que je puisse être serein ».

  **Ménage** (script Node `firebase-admin`, hors dépôt) : la classe
  `1ere-demo` ne contient QUE `demo-eleve` (vérifié avant toute suppression,
  le script s'arrête sinon). Supprimés : ses 9 devoirs de test, et chez
  `demo-eleve` 63 `devoirsTentatives` + les collections orphelines
  `automatismes` (8) et `resultats` (3) — 83 documents, sauvegarde JSON
  complète conservée dans le scratchpad de session. `connexions` gardé.
  Devoirs des vraies classes (`1ere-Gr 1`, `1ere-Gr 3`, `hors-classe`) non
  touchés (recomptés avant/après).

  **Méthode de test** : devoirs créés par script avec exactement la forme
  de document de `devoirs.js` (`classe: '1ere-demo'`, `creePar:
  'test-automatise'`). **Connexion `demo-eleve` faite par David lui-même**
  dans le navigateur intégré (je ne saisis pas de mot de passe sur un
  service d'authentification externe), puis tous les parcours pilotés sur
  localhost avec de vraies écritures Firestore, chaque étape recoupée par
  lecture directe de Firestore (`firebase-admin`). Couvert : fiche de calcul
  Première (Fiche 2), fiche à widget Seconde (Fiche 8), sujet blanc et
  fiche ciblée en mode fiche, puis sujet blanc et fiche ciblée en mode
  chrono (dont une question laissée expirer à son minuteur de 60 s),
  `/mes-devoirs/`, pastille de l'accueil, deux devoirs à échéance courte
  (3-4 min) pour tester le passage de l'échéance. Résultat final en base :
  chaque devoir a exactement le nombre de tentatives attendu, jamais une de
  plus.

  **Sept problèmes trouvés en cours de route, tous corrigés et revérifiés
  en réel :**
  1. *Fiches de calcul : élève coincé après épuisement* — une fois les
     tentatives épuisées (en direct ou au rechargement), la fiche restait
     en mode devoir inutilisable (Valider et « Voir toutes les réponses »
     désactivés, aucune correction), contrairement aux automatismes.
     Nouvelle fonction `passerEnEntrainementLibre()` (+ variable
     `devoirTermine`, qui ne sert plus qu'au bandeau) : retour complet en
     entraînement libre (choix de mode, Corrigé des erreurs, correction
     immédiate, Recommencer), bandeau « tu as utilisé tes N tentatives ».
  2. *Automatismes : brouillon incomplet* — la répartition du sujet blanc
     et les thèmes d'une fiche sont des propriétés du tableau de questions,
     perdues par la sérialisation JSON : le bandeau « Ce sujet couvre… » /
     « Thèmes de cette fiche » disparaissait à la reprise. Sauvegardés dans
     un champ `meta` du brouillon (`enregistrerBrouillonAutomatisme`) et
     restaurés par `demarrer()`.
  3. *Automatismes : faille de triche* — après validation, « Enregistrer »
     restait disponible : masquer la correction, corriger ses réponses,
     enregistrer, recharger → la série revenait corrigée avec « Valider »
     actif (seconde tentative parfaite sur les mêmes questions). Reproduit
     en réel avant correction (brouillon piégé supprimé sans valider).
     Correctif : Enregistrer masqué une fois la série validée (comme sur les
     fiches) et réponses figées (`reponsesFigees()`) tant que le devoir est
     actif — le bilan affiché ne peut plus diverger de la note enregistrée.
  4. *Plusieurs devoirs sur la même cible* — le premier devoir trouvé
     (ordre arbitraire de Firestore) était retenu : un devoir épuisé pouvait
     « cacher » un second devoir encore ouvert (ex. deux sujets blancs à une
     semaine d'intervalle). Côté fiches, une validation était en plus
     écrite pour TOUS les devoirs visant la fiche. Nouvelle fonction
     `choisirDevoirActif()` (suivi.js), partagée par `verifierEtatDevoir`,
     `enregistrerTentativeDevoirSiApplicable` et `devoirAutomatismeActif` :
     le devoir le plus proche de son échéance parmi ceux encore ouverts ; à
     défaut le premier épuisé (pour l'annoncer). La tentative n'est comptée
     que pour ce devoir-là. Vérifié en réel en laissant volontairement les
     devoirs épuisés en place à côté des nouveaux.
  5. *Mode chrono : panneau « Tentatives utilisées » pas rafraîchi* après la
     fin d'une série (resté à 0/2 alors qu'en base et en mémoire la
     tentative était bien comptée). `verifierFinSerie()` redessine
     désormais le seul panneau une fois l'enregistrement terminé
     (`rafraichirPanneauDevoir`), sans toucher à la correction détaillée
     éventuellement déjà ouverte.
  6. *Réponses fantômes sur les fiches à widgets* — un widget jamais touché
     (tableau de signes, de variations, croisé, schéma d'évolution, tableau
     de programme) enregistre une structure de cases vides, comptée comme
     « répondue » : la colonne Non-réponses du tableau de bord enseignant
     était sous-estimée. Balayage automatique des 52 fiches (chargées une à
     une dans un cadre invisible) : 7 fiches de Seconde concernées
     (fiche-08, 09, 10, 14, 15, 19, 20), et toutes leurs structures vides ne
     contiennent que des chaînes vides. `validerFicheActuelle()` ne compte
     plus que les réponses ayant au moins une valeur non vide (même
     imbriquée). Vérifié en réel : 1 champ + 1 tableau entamé → 2 réponses
     (au lieu de 5 avant).
  7. *Validation après l'échéance* (page ouverte avant, validée après) : la
     fiche annonçait « 1 / 2 tentative utilisée » alors que rien n'était
     compté ; côté automatismes, une tentative hors délai était même encore
     écrite (sans effet sur la note). Désormais : rien n'est écrit, pop-up
     « l'échéance est passée : cette validation n'est plus comptée »,
     correction affichée, retour en entraînement libre (fiches et les deux
     pages d'automatismes).

  Aussi : notes affichées au format français (« 3,5 / 5 » et non « 3.5 »)
  dans `/mes-devoirs/` et dans les résultats enseignant ; message « Fiche
  validée : X / Y bonnes réponses » débarrassé de la mention périmée
  « cumulées, tous passages confondus ».

  **Propagation aux 52 fiches** (trois scripts PowerShell dans
  `.claude/scratch/`), chaque fois avec vérification complète de toutes les
  ancres AVANT la moindre écriture (une ancre manquante arrête tout sans
  rien modifier — c'est ce qui s'est passé une fois, sans dégât). **Piège
  nouveau** : les blocs insérés avec l'outil d'édition sont en fins de
  ligne LF dans des fichiers CRLF ; un marqueur construit avec `` `r`n ``
  ne les retrouve pas. Script rendu insensible aux fins de ligne (regex
  `\r?\n` + `MatchEvaluator`, pour que les `${...}` du texte inséré ne
  soient pas interprétés comme références de groupe). Sans conséquence
  pour les navigateurs ; Git normalise au commit (`core.autocrlf`).
  Vérifié : `vm.Script` 52/52 sans erreur, grep d'uniformité 52/52 pour
  chaque changement, 0 résidu.

  **Données de test laissées en place volontairement** (classe `1ere-demo`)
  pour que David puisse contrôler la vue « Résultats » de son tableau de
  bord enseignant (je ne peux pas me connecter en enseignant) ; à
  supprimer ensuite avec le même script de ménage. Trois d'entre eux (les
  devoirs à échéance courte : deux « Fiche 3 », un « Sujet blanc —
  Niveau 1 ») apparaissaient dans « Devoirs faits » en « Non rendu » : c'était
  voulu (validés APRÈS l'échéance pour tester que ça ne compte pas) ; les
  autres, avec leurs notes, étaient dans « Devoirs en cours ». Vue
  « Résultats » contrôlée par David, puis **tout supprimé le 30/09/2026 à
  sa demande** (12 devoirs, 17 `devoirsTentatives`, et 8 `tentatives` de
  l'ancien modèle écrites par les fiches à widgets pendant les tests —
  sauvegardes JSON dans le scratchpad de session). `demo-eleve` repart
  sans aucun devoir ; seul son journal `connexions` est conservé.

  **Complément le jour même — confirmation avant de consommer une
  tentative** (suggestion faite à David à l'issue des tests, acceptée) : un
  clic accidentel sur « Valider » comptait sans recours, même sur une fiche
  vide (0/33 observé en test). `confirm()` avant chaque geste qui compte
  une tentative : « Valider ma fiche » (52 fiches, sauf si l'échéance est
  déjà passée — rien ne serait compté), « Valider ma série » (automatismes,
  mode fiche) et « Terminer le sujet » (mode chrono, même rôle — mais pas le
  passage automatique en fin de temps). Message : « Valider compte une
  tentative pour ce devoir (« titre ») : il t'en restera N ensuite.
  Continuer ? », ou « … compte ta dernière tentative … » quand c'est la
  dernière. Aucune confirmation hors devoir. Vérifié en réel sur les trois
  gestes : annulation sans aucun effet (ni écriture, ni correction
  révélée), acceptation comptée normalement.

  Défaut repéré pendant ce test et corrigé : en mode fiche, la note d'une
  série validée avec des questions sans réponse ne s'affichait pas (règle
  d'origine « pas de bilan tant qu'il reste une question sans réponse »,
  pensée pour ne pas révéler la justesse clic par clic). Une fois la série
  validée, les réponses sont figées : `bilanFicheHTML()` affiche désormais
  toujours la note (`ETAT.serieValidee`), y compris pour la dernière
  tentative après retour en entraînement libre.

- **Trois améliorations après le test réel de David (30/09/2026)** — « Cela
  fonctionne plutôt très bien. Quelques améliorations : »

  1. **Section « Enregistrés » dans `/mes-devoirs/`**, entre « À faire » et
     « Faits ». Nouveau module partagé `assets/js/devoirs-eleve.js`
     (`chargerDevoirsEleve`), utilisé par `mes-devoirs.js` ET
     `devoirs-notification.js` (pastille des pages d'entrée) pour qu'ils
     comptent exactement la même chose. Classement :
     - *Enregistrés* : échéance à venir, essais non épuisés, brouillon en
       cours (`brouillons/{ficheId}` pour une fiche de calcul,
       `brouillonsAutomatismes/{devoirId}` pour les automatismes) ;
     - *À faire* : échéance à venir, essais non épuisés, rien rendu, rien
       enregistré ;
     - *Faits* : tout le reste. **Changement de sens voulu par David** :
       un devoir passe dans « Faits » dès sa première tentative validée
       (« lorsque ces devoirs sont validés, les faire passer dans devoirs
       faits »), et non plus seulement une fois les essais épuisés ou
       l'échéance passée. Un devoir rendu mais encore ouvert y reste
       cliquable (« encore N tentatives possibles avant le … ») pour
       permettre d'améliorer sa note.
     La pastille compte « À faire » + « Enregistrés » (plus les devoirs
     déjà rendus avec des essais restants). `mes-devoirs.js` supprime au
     passage (`nettoyerBrouillons`) tout brouillon qui n'est plus rattaché
     à un devoir ouvert — échéance passée sans validation (demande de David :
     « s'ils ne sont pas terminés à la date limite, les supprimer »), devoir
     supprimé, ou vieux brouillon d'entraînement d'avant le 29/09/2026. Une
     seule requête par collection (tentatives, brouillons) au lieu d'une
     requête de tentatives par devoir.
  2. **Confirmations dans le style du pop-up « Devoir »** au lieu de la
     boîte native du navigateur (affichée en haut de page, jugée peu
     ergonomique) : `demanderConfirmationDevoir()` dans les 52 fiches et
     `demanderConfirmation()` dans `moteur.js`, fenêtre construite à la
     volée avec les classes `.modal-devoir*` existantes (aucun balisage à
     ajouter), boutons « Annuler » + action ; Échap et clic sur le fond
     annulent. Utilisées pour Valider (fiche / série), Terminer le sujet, et
     aussi Générer une nouvelle version / série (même boîte native).
     `genererNouvelleFiche()` devient asynchrone (seul appelant : le bouton).
     Côté automatismes, le message indique le nombre de questions sans
     réponse.
  3. **Mode chrono : le temps continue de s'écouler sur l'écran de reprise**
     (« Reprendre les questions sans réponse ») — avant, le chrono
     s'arrêtait entre deux passes. `lancerMinuteurRecap()` : compte à
     rebours en direct (« le chrono continue de tourner », rouge sous 10 s) ;
     `quitterRecap()` décompte le temps passé sur l'écran du budget global à
     la reprise ou à la fin ; à zéro, le sujet se termine tout seul et
     referme une éventuelle confirmation « Terminer le sujet ? » restée
     ouverte (phase revérifiée après la confirmation pour ne jamais
     terminer deux fois). S'applique aussi à l'entraînement libre.

  **Propagation aux 52 fiches** : nouveau script Node
  (`.claude/scratch/propager.js` + fichier de blocs JSON) qui prend l'ancien
  texte dans la version committée du pilote (`git show HEAD:…`), compare
  sans tenir compte des fins de ligne, vérifie tout avant d'écrire — plus
  aucun piège d'encodage PowerShell. Vérifié : `vm.Script` 52/52, 52/52
  sur chaque changement, plus aucun `confirm()` natif dans les fiches ni
  dans les automatismes.

  **Tests** : confirmations et chrono de reprise dans le navigateur (devoir
  simulé : Annuler/Échap sans effet, confirmation fermée automatiquement à
  l'expiration, une seule tentative comptée) ; section « Enregistrés » avec
  une vraie session `demo-eleve` (reconnectée par David) sur 6 cas préparés
  en base (à faire, enregistré fiche/automatismes, rendu puis réenregistré,
  rendu 1/2, échu avec brouillon) + un brouillon orphelin — classement
  exact, brouillons périmés supprimés ; puis vrai parcours fiche de calcul
  et sujet blanc (enregistrer → « Enregistrés », reprise depuis le tableau
  de bord, validation par la fenêtre stylée → « Faits »), pastille à jour.
  Données de test supprimées ensuite (y compris 8 tentatives orphelines
  laissées par les tests de David du matin sur des devoirs qu'il avait
  supprimés — sauvegarde JSON conservée).

  **Correctif le jour même** (retour de David) : un devoir de fiche de calcul
  validé une fois sur 2 passait dans « Faits » — mon interprétation de « les
  faire passer dans devoirs faits » était trop large. Un devoir auquel il
  reste des essais doit rester accessible dans « À faire ». Classement
  final (`devoirs-eleve.js`) : **Enregistrés** = ouvert + brouillon en
  cours ; **À faire** = ouvert sans brouillon (avec sa meilleure note s'il a
  déjà été rendu) ; **Faits** = essais épuisés ou échéance passée,
  uniquement. Un devoir enregistré puis validé quitte donc « Enregistrés »
  pour « À faire » s'il reste des essais, « Faits » sinon. La pastille
  compte à nouveau tous les devoirs ouverts. Vérifié sur les vraies données
  de test de David (deux devoirs à 1/2 revenus dans « À faire »,
  cliquables ; le devoir à 2/2 dans « Faits » ; pastille à 2).

- **Claviers de saisie : racine dans une fraction, accolades (30/09/2026)**
  — deux retours « plus mathématiques » de David.

  1. **Touche √ du clavier simplifié mal placée dans une fraction** (le
     raccourci tapé `sqrt` marchait, pas la touche). Deux causes distinctes,
     selon le type de champ :
     - *Champ texte* (27 fiches de Première, `insererRacine`) : la touche
       a/b insère `(▢)/(▢)` et sélectionne le ▢ du numérateur ; la touche √
       reprenait cette sélection comme contenu → `(√(▢)5)/(▢)` après avoir
       tapé 5. Désormais, si la sélection est exactement un ▢, la racine le
       remplace et sélectionne son propre ▢ : `(√(5))/(▢)`. Sélection d'un
       vrai nombre (`3` → `√(3)`) et champ vide (`√(` curseur `)`) inchangés.
       Les fiches de Seconde (`sqrt(`, fraction `()/()` sans ▢) n'avaient
       pas le problème.
     - *Champ mathématique avec clavier maison* (`<math-field>` en mode
       `off` : ensembles, cercles) : `insererMath`, `insererFractionMath`,
       `insererRacineMath` et `reculerMath` (11 fiches, dont 4 pour les
       trois dernières) commençaient par `moveToMathfieldEnd` — chaque
       touche partait en fin de champ, d'où `\{\frac{▢}{▢}\sqrt5`. Ligne
       supprimée : insertion (et « ← Suppr. ») au curseur. Le curseur est
       conservé au clic grâce au `mousedown` → `preventDefault()` déjà en
       place sur `.clavier-visuel` pour ces champs.
  2. **Accolades** : le clavier MathLive (bouton ⌨ des champs en mode
     `manual`, le « clavier MathType » de David) n'a que ( ) et [ ].
     Nouveau fichier partagé (d'abord `assets/js/clavier-mathlive.js`,
     renommé `assets/js/claviers.js` le jour même, voir l'entrée suivante),
     chargé juste après `unpkg.com/mathlive` dans les 52 fiches : part des
     dispositions normalisées de MathLive et remplace, sur la couche « 123 »,
     la touche intégrale par **{** (Maj : ∅) et **∀** par **}** (Maj : ;).
     *Corrigé le jour même, entrée suivante : l'intégrale à bornes était
     perdue.* Si MathLive change et que ces touches ne sont pas trouvées,
     rien n'est modifié (le script MathLive est chargé sans numéro de
     version). Saisie `\{1;2\}` → lue `{1;2}` → acceptée par
     `checkEnsemble`.
     Inventaire au passage (les 52 fiches chargées une à une, réponse
     attendue commençant par `{`) : aucune question « ensemble » n'utilise en
     fait le clavier MathLive — Première 01–04, 14, 24 et Seconde 06, 14,
     15, 17–20 ont un champ mathématique avec clavier maison qui avait déjà
     { } ; ∅. En revanche **9 fiches à champ texte n'avaient aucune
     accolade** (Première 08, 09, 10, 15, 20, 21, 22, 25 ; Seconde 12) :
     nouvelle fonction `groupeEnsembleClavier(idx, ex)` qui ajoute en tête
     de leur clavier un groupe « Ensemble » { } ; et la même astuce que les
     autres fiches, uniquement pour ces questions.

  Script `.claude/scratch/clavier-maths.js` (vérifie une occurrence exacte
  partout avant d'écrire). Vérifié : `vm.Script` 52/52 ; une seule variante
  de chaque fonction modifiée ; plus aucun `moveToMathfieldEnd`. Tests
  navigateur par vrais clics : fiche 09 de Première (11 champs texte :
  fraction + √ au numérateur puis au dénominateur → `(√(5))/(√(2))`,
  ensemble `{1;2}` au clavier), fiche 01 de Première (champ ensemble :
  `{` a/b √ 5 → racine dans le numérateur, `;` et « ← Suppr. » au
  curseur), clavier MathLive avec { } sur les fiches 01 de Première et 14
  de Seconde, sans erreur console.

- **Claviers : quatre opérations partout, intégrale rétablie (30/09/2026)**
  — deux retours de David sur l'entrée précédente.

  1. **« Le clavier simplifié doit toujours comporter les quatre opérations
     élémentaires (la division permet d'écrire des fractions) »**.
     Inventaire des 526 claviers des 52 fiches (chargées une à une) : les
     claviers complets (groupe « Opérations ») avaient déjà + − × ÷, mais
     les claviers spécialisés non — intervalles (+ × ÷ absents), ensembles
     et cercle en champ mathématique (× ÷), valeur absolue, pourcentages
     (Seconde 10 : pas de +), écriture f(x) de Seconde 14/17, clavier
     « Chiffres/Ensemble » de Première 14, 24 et Seconde 06, 14–20…
     Plutôt que de retoucher chaque variante de générateur (une dizaine,
     réparties sur les 52 fiches), le fichier partagé
     `assets/js/clavier-mathlive.js` devient **`assets/js/claviers.js`**
     (52 balises `<script>` mises à jour) et complète les claviers dans le
     DOM, à chaque (re)génération (MutationObserver, un passage par image) :
     - touches manquantes ajoutées dans le groupe qui contient déjà +, ×, ÷
       (sinon a/b, sinon √, sinon −), à leur place dans l'ordre + − × ÷ ;
       sinon nouveau groupe « Opérations » avant l'astuce ou avant le groupe
       Effacer ;
     - ancienne touche « / » (Première 14, 24, Seconde 06) remplacée sur
       place par ÷ ;
     - champ texte : `inserer(idx, …)` avec `*` et `/`, comme les claviers
       complets ; champ mathématique : `insererMath` si la fiche l'a, sinon
       `inserer` (qui gère alors le `<math-field>`), avec `\times` (lu
       `2 * 3`) et `\frac{#@}{#?}` pour ÷ (le nombre qui précède devient le
       numérateur, curseur au dénominateur : 3 ÷ 4 → `\frac34`) ;
     - claviers sans rien de numérique laissés tels quels : QCM a/b/c/d,
       vrai/faux, oui/non.
  2. **« On a perdu la possibilité d'écrire une intégrale avec ses
     bornes ? »** — oui (en Maj ne restait qu'un ∫ sans bornes). Désormais
     la touche intégrale d'origine, bornes comprises, est déplacée à la
     place du « i » des nombres complexes (hors programme de Seconde/
     Première) ; **{** et **}** occupent les places de l'intégrale et de
     ∀. ∀ et ∃ restent disponibles sur la couche « ∞≠∈ ». Écarté : une
     seule touche « {▢} » — laissée vide pour l'ensemble vide, elle serait
     lue `{()}` au lieu de `{}` et refusée.

  Vérifié : `vm.Script` 52/52, `node --check` sur `claviers.js` ; nouvel
  inventaire des 526 claviers → plus aucune opération manquante hors
  QCM/vrai-faux/oui-non, aucune erreur ; saisie 6 ÷ 3 × 2 + 1 − 5 par les
  touches sur 11 claviers différents (texte et mathématiques, Seconde 06,
  10, 13, 14, Première 09) → toujours lue et évaluée à 0 ; vrais clics sur
  le champ ensemble de Première 01 (`{3 ÷ 4` → `\{\frac34`) ; claviers
  toujours complets après « Générer une nouvelle fiche » ; clavier
  MathLive : intégrale à bornes insérée
  (`\int_0^{\infty}\!\placeholder{}\,\mathrm{d}x`), { } fonctionnels ;
  aucune erreur console.

- **Cases grisées de ÷ et √, accolades invisibles (30/09/2026)** — retour de
  David : « le bouton division affiche bien une fraction mais on a perdu le
  champ grisé au numérateur […] même chose pour racine carrée ». Reproduit
  par vrais clics (le clavier MathLive et le clavier maison ensembles/cercle
  de Première 01–04 avaient bien leurs cases) :
  1. **÷ ajouté par `claviers.js`** (champs mathématiques) : insérait
     `\frac{#@}{#?}`, qui prend le nombre tapé juste avant comme numérateur
     (5 ÷ → 5/▢, pas de case au numérateur). Désormais `\frac{#0}{#0}`,
     comme a/b : deux cases grisées, curseur au numérateur (une sélection
     éventuelle devient le numérateur). En champ texte, ÷ reste `/`, comme
     sur les claviers complets.
  2. **√ des champs mathématiques** (variante `inserer` des 14 fiches
     Première 14, 24, Seconde 06, 14–23, 25 — défaut antérieur à ces
     retouches) : `\sqrt{}` + `moveToPreviousChar` insérait une racine
     vide, sans case. Désormais `\sqrt{#0}` (case grisée sélectionnée,
     remplacée par le premier chiffre), le reste du mécanisme
     `boiteRacineOuverte` inchangé (les chiffres vont dans la racine, une
     autre touche en sort : √ 5 + 1 → `\sqrt5+1`).
  3. **√ des champs texte de Première** (27 fiches, `insererRacine`) : sur
     un champ vide (rien de sélectionné), `√()` devient `√(▢)` avec le ▢
     sélectionné, comme a/b ; sélection d'un nombre inchangée (`3` →
     `√(3)`).
  4. **Trouvé en testant, dans les mêmes 14 fiches** : les touches { } des
     champs mathématiques insèraient `{` brut, que MathLive traite comme un
     groupe LaTeX invisible — {1;2} s'affichait « 1;2 » (la correction
     passait quand même, `checkEnsemble` ignorant les accolades, mais
     l'élève ne voyait pas ce qu'il écrivait ; { puis √ perdait même
     l'accolade). `inserer` convertit désormais `{`/`}` en `\{`/`\}` pour
     un `<math-field>`.

  Scripts `.claude/scratch/cases-grisees.js` et `accolades-mf.js`.
  **Piège rencontré** : les heredocs Bash de cet outil réduisent `\\` à `\`
  — une première passe avait écrit `'\' + symbole` (erreur de syntaxe dans
  les 14 fiches), réparée aussitôt avec `String.fromCharCode(92)` ; pour
  tout script contenant des barres obliques inverses, l'écrire avec l'outil
  Write, pas un heredoc. Vérifié : `vm.Script` 52/52, une seule variante de
  chaque fonction touchée ; Seconde 14 par vrais clics (5 ÷ → 5 ▢/▢,
  √ au numérateur → √▢, puis 3 dans la racine ; {-19;19}, {-√2;√2}, {}
  affichés avec accolades et acceptés) ; Première 09 champ texte (√ →
  `√(▢)`, a/b √ 5 → `(√(5))/(▢)`).

- **Case grisée avec le clavier simplifié : question de focus (30/09/2026)**
  — David, Seconde 06, 6.6 b) : « le clavier MathType grise bien la case
  mais pas le clavier simplifié ». La case existait (entrée précédente),
  mais la « case grisée » est la *sélection* du `<math-field>`, affichée
  seulement quand il a le focus. Or un clic sur une touche du clavier
  simplifié retirait le focus au champ (seules Première 01–04 avaient un
  écouteur `mousedown` → `preventDefault()`), et `inserer` ne le rendait
  pas. Correctif dans `assets/js/claviers.js` (donc les 52 fiches), pour
  toute touche d'un clavier rattaché à un `<math-field>` : `mousedown` sans
  action par défaut (le champ garde le focus) et, en phase de capture du
  clic, `focus()` du champ s'il l'avait perdu (clavier ouvert par ⌨) avant
  le gestionnaire de la touche. Les champs texte ne sont pas concernés.
  **Au passage** : les attributs `virtual-keyboard-mode="off"/"manual"`
  des fiches datent d'avant MathLive 0.90 et sont ignorés par la version
  chargée (0.110), dont la politique par défaut `auto` ouvre le clavier
  MathLive dès qu'un champ a le focus sur écran tactile — donc, sur
  tablette, par-dessus le clavier simplifié des champs « off ». Ces champs
  reçoivent désormais `math-virtual-keyboard-policy="manual"` (attribut ET
  propriété : l'attribut posé avant l'initialisation du composant restait
  sans effet). Les champs « manual » (bouton ⌨ → MathLive) ne sont pas
  modifiés : sur tablette, le clavier MathLive s'y ouvre toujours au
  toucher du champ, comme avant.
  Vérifié par vrais clics sur Seconde 06 (clavier ouvert par ⌨, champ sans
  focus : { puis ÷ → numérateur sélectionné et grisé, focus conservé,
  clavier MathLive fermé ; √ → case de la racine grisée ; 3 → dans la
  racine), et Première 01, 14, Seconde 18 (÷ puis √ : focus, sélection de
  la case, politique `manual`), Première 09 champ texte inchangé ; aucune
  erreur console.

- **Fiche 1 de Première (cahier 1, Forme canonique) — mise aux règles
  (30/09/2026), 35 → 26 questions, 15 → 10 calculs.** David : « il ne me
  semble pas que la fiche 1 respecte ces règles du tout ». Exact : elle
  n'avait eu que la toute première passe (24/09 après-midi, 1.1–1.4 de 6
  à 4, 1.6–1.9 et 1.14 à 2), antérieure à la règle des 6 automatismes et à
  la règle de fusion posées le soir même sur la fiche 4. Constat au
  passage : les fiches 7 à 28 avaient bien été faites (25–26/09, PC perso,
  commits « Fiche N Premiere : simplifiee en autonomie ») — seule la
  fiche 6 n'a jamais été réduite (traitée juste après celle-ci).
  - **Automatismes 1.1–1.3 : 12 → 6 (2+2+2)** — chaque calcul couvre deux
    familles/niveaux, aucun n'a de gradient justifiant plus. 1.1 : a)
    (px+q)² entier (classique), b) (p/q·z+r)² (fraction, la difficulté de
    toute la fiche) ; retirés b) carré d'une différence (doublon) et c)
    racine (déjà en 1.4 c). 1.2 : un par famille — a) x²−k² (différence de
    carrés), b) p²v²−2pkv+k² (carré parfait avec coefficient, plus complet
    que l'ancien c) ; retiré b) (fractions ET radicaux cumulés). 1.3 : un
    par famille — a) z²=k, b) (pt+q)²=0 ; retirés c) carré nul à radicaux
    et d) ax²=b à fractions (variantes lourdes des mêmes familles).
  - 1.4 inchangé (4, déjà gradué).
  - **1.5 « Formes canoniques » = anciens 1.5 (I) + 1.6 (II) + 1.7 (III)**,
    6 → 4 : a) A=1, b) A entier positif, c) A entier négatif (signe imposé
    par le générateur), d) A fractionnaire avec B, C entiers ; retirés
    l'ancien 1.5 b) (doublon) et l'ancien 1.7 b) (A, B, C fractionnaires et
    négatifs à la fois, résultat du type −548/735). Picto de niveau : celui
    des anciens 1.6/1.7 (2 horloges pleines).
  - **1.6 « Formes canoniques à paramètre » = anciens 1.8 (I) + 1.9 (II)**,
    4 → 3, familles selon la place de λ : a) λ dans le coefficient de x (A
    entier), b) λ coefficient de x² (au dénominateur, d'où λ ∈ ℝ*), c) λ
    dans le coefficient de x ET la constante, A fractionnaire ; retiré
    l'ancien 1.8 a) (contenu dans c).
  - **1.7 = anciens 1.10 + 1.11** (même consigne mot pour mot : courbe →
    forme canonique) et **1.8 = anciens 1.12 + 1.13** (forme canonique →
    courbe ; a) coefficient dominant entier, 3 figures, b) fractionnaire, 4
    figures) : un titre par calcul, une sous-question a)/b) par graphique
    (`blocQCMCourbeVersCanonique`, `blocQCMCanoniqueVersCourbe`, classe
    `.qcm-sous-question`) ; `paramsGraphiques.g1_7a/7b/8a/8b`,
    `PANEL_1_8A/8B`, zones `zone-qcm-1-7/8`.
  - 1.14 → **1.9**, 1.15 → **1.10** (contenu inchangé).
  Identifiants renumérotés (les résultats déjà enregistrés gardent les
  anciens) ; un brouillon enregistré avec l'ancienne structure est ignoré
  (garde-fou existant : longueur de `exercices` différente).
  Scripts `.claude/scratch/fiche01-html.js`, `fiche01-js.js` (+ blocs
  `.txt`). **Interruption en cours de travail** (arrêt du PC de David) :
  rien n'était committé, reprise sur le fichier modifié à moitié, sans
  perte. Vérifié : `vm.Script` 52/52, 8 générateurs sans doublon, ids ↔
  table `groupes` cohérents (26 champs, ordre du DOM = ordre du tableau
  pour la navigation Entrée), 500 tirages auto-cohérents sans échec,
  saisie de toutes les bonnes réponses dans les vrais champs 26/26,
  panneau « Voir toutes les réponses » 26/26 sans erreur MathJax, captures
  (1.5, 1.6, 1.7, 1.8 : un titre, bonnes lettres), « Générer une nouvelle
  version » OK, aucune erreur console.

- **Fiche 6 de Première (cahier 2, Dérivation I) — mise aux règles
  (30/09/2026), 19 → 18 questions, 8 → 6 calculs.** Jamais réduite jusque-là
  (seul le correctif du « a) » des questions seules, 25/09).
  - Automatismes 6.1 + 6.2 : 5 questions, sous le plafond de 6 — inchangés
    (6.1 : somme, produit, quotient de puissances, gradué ; 6.2 : degré 2
    puis 3).
  - **6.3 « Lecture graphique d'un nombre dérivé » = anciens 6.3 (I,
    courbe de f) + 6.4 (II, courbe de g)**, 4 → 3 : les deux courbes
    affichées l'une après l'autre sous un seul titre, puis une grille a) b)
    c) — a) f'(p)=0 (tangente horizontale, classique), b) g'(p₂) (pente
    entière, ±1 ou ±5), c) f'(q) (pente fractionnaire, ±½ ou ±3/2).
    Retirée : l'ancienne 6.4 b) g'(0)=0, deuxième lecture de tangente
    horizontale (doublon de a) ; la tangente horizontale de g n'est plus
    tracée (« ainsi que l'une de ses tangentes »). **Tirage forcé** : f'(q)
    était entière pour la moitié du panel `PANEL_6_3` — filtrée pour ne
    garder que les 4 entrées à pente fractionnaire, sinon le cas délicat
    pouvait ne jamais sortir (500 tirages : b) toujours entière, c)
    toujours fractionnaire).
  - 6.5 → **6.4** « Une courbe, trois tableaux » : inchangé (compétence
    inverse de 6.5, distincte).
  - **6.5 « Un tableau et trois courbes » = anciens 6.6 (I) + 6.7 (II)**,
    même consigne mot pour mot : un titre, sous-questions a) et b), chacune
    avec son tableau et ses trois courbes (la lettre est portée par le
    paragraphe d'introduction de la figure, ids `6.5 a)`/`6.5 b)`, grilles
    `grille-6-5a/5b`).
  - 6.8 → **6.6** « Tangente et rayon » : 7 items conservés — ce sont les
    étapes enchaînées d'un même problème guidé (OM(t) → y_t → f'(t) →
    tangente → vecteurs → orthogonalité), pas 7 exemples ; en couper une
    casserait le raisonnement.
  Renommages internes cohérents (jetons temporaires pour éviter les
  collisions) : `g6_4→g6_3g`, `g6_5→g6_4`, `g6_6/7→g6_5a/5b`,
  `construireGraphique6_*`, `graphique-6-*`, `PANEL_6_4→PANEL_6_3G`,
  `PANEL_6_5_RACINES→PANEL_6_4_RACINES`, `figure-6-8→figure-6-6`.
  Script `.claude/scratch/fiche06.js`. Vérifié : `vm.Script` 52/52, ids ↔
  `groupes` cohérents (18 champs, ordre DOM = ordre du tableau), 500
  tirages auto-cohérents sans échec, saisie de toutes les bonnes réponses
  18/18, panneau « Voir toutes les réponses » 18/18 sans erreur MathJax,
  captures (6.3 : deux courbes puis a/b/c ; 6.5 : un titre puis a) et b)),
  « Générer une nouvelle version » OK (6 figures redessinées), aucune
  erreur console. Piège de test noté : après `setValue()` sur un
  `<math-field>`, MathLive émet son évènement `input` en différé, ce qui
  efface le statut affiché par un `verifierTout()` lancé juste après — le
  score et `saisies` restent justes ; relancer `verifierTout()` pour voir
  les coches.

  **Toutes les fiches de Première (1 à 28) sont désormais passées aux
  règles de simplification.** *(Corrigé le jour même : la fiche 2 avait
  encore 8 automatismes, voir l'entrée suivante — « passées aux règles »
  ne garantissait pas que chaque règle ait été vérifiée sur chaque fiche.)*

- **Fiche 2 de Première — automatismes 8 → 6 (30/09/2026), 34 → 32
  questions.** David : « les automatismes ne respectent pas la règle des 6
  maximum » (2.1 : 4 + 2.2 : 4 ; la passe du 24/09 sur cette fiche avait
  précédé la règle des 6, posée le soir même sur la fiche 4). Répartition
  selon le vrai gradient : **2.1 « Simplifier » 4 → 2** — deux familles
  seulement, chacune en double : a) racine d'un carré parfait (résultat
  rationnel), b) racine à simplifier puis fraction à réduire (ancien c) ;
  retirées l'ancienne b) (même famille que a, seul le signe devant la
  racine changeait) et l'ancienne d) (même famille que c, seul le
  radicande changeait). **2.2 « Calculer » garde ses 4** — un piège
  distinct par question : a) B²−4AC classique avec une fraction, b) carré
  d'un négatif (−B)², c) −B² (à ne pas confondre avec (−B)²), d) fractions
  partout dont (−p/q)². Table `groupes` décalée de 2 après 2.1. Vérifié :
  `vm.Script` 52/52, ids ↔ `groupes` cohérents, 500 tirages
  auto-cohérents sans échec (intervalles compris), saisie de toutes les
  bonnes réponses dans les vrais champs 32/32, panneau 32/32 sans erreur
  MathJax, capture (6 questions dans « Quelques automatismes »),
  régénération OK, aucune erreur console. Remarque non traitée (pas
  demandé) : entre les automatismes et 2.3, la fiche n'a pas de titre de
  section (les autres fiches en ont un, ex. « Changements de forme »).

- **Fiche 2 de Première — suite des retours de David (30/09/2026), total
  inchangé (32).**
  1. « dans 2.3 mettre 4 exemples et n'en mettre que 2 dans 2.4 ».
     **2.3 « Premiers discriminants » 2 → 4**, coefficients entiers, une
     difficulté de plus à chaque question : a) a=1, b) a=−1, c) a entier
     ≠ ±1 (nouveau), d) terme en x absent `ax²+c` (nouveau, piège b=0 donc
     Δ=−4ac). **2.4 « Calculs de discriminants » 4 → 2** : a)
     coefficients fractionnaires, b) radicaux dans a et c (ancien d : le
     produit ac doit se simplifier) ; retirées les anciennes b) et c),
     quasi-doublons (fractions + √ devant x, seul le signe de la racine
     changeait) dont la seule difficulté ajoutée, élever une racine au
     carré, était triviale. Indices des groupes suivants inchangés (même
     total 6).
  2. « dans 2.10, supprimer le (I) dans le titre puisqu'il n'y a qu'un
     exercice de ce type (à garder en mémoire pour les autres fiches) ».
     Fait ; **le « (II) » de 2.11 retiré aussi** : même consigne, mais
     placé dans « Calculs plus avancés » (cas plus dur, gardé séparé) — un
     « (II) » resté seul n'aurait plus de sens, la séparation en sections
     suffit à distinguer les deux (signalé à David). Règle enregistrée en
     mémoire (`feedback_numerotation_titres_calculs`) pour les autres
     fiches.
  Vérifié : `vm.Script` 52/52, ids ↔ `groupes` cohérents, 500 tirages
  auto-cohérents sans échec (2.3 c/d : énoncés et Δ entiers), saisie de
  toutes les bonnes réponses 32/32, panneau 32/32 sans erreur MathJax,
  capture de 2.3/2.4, aucune erreur console.
  3. « ne garder que 2 exemples dans 2.10 » (32 → 31). Les trois exemples
     plaçaient a différemment. Gardés : a) a dans la constante (ancien c,
     classique : Δ affine en a, inéquation du premier degré) ; b) a
     coefficient dominant (ancien a, délicat : signe de a ET Δ, réponse
     « aucune » — famille absente du reste de la fiche). Retiré : l'ancien
     b) (a dans le terme linéaire, Δ du second degré en a), technique
     reprise en 2.11 (a dans le terme linéaire ET la constante). 2.11/2.12
     décalés d'un indice. Vérifié : ids ↔ `groupes`, 500 tirages sans
     échec, saisie 31/31, panneau 31/31 sans erreur MathJax.

- **Revue des groupes (I)/(II) restants dans les fiches de Première
  (30/09/2026)** — David : « passe en revue la fusion des (I)/(II)... dans
  les fiches ». Inventaire (28 fiches chargées) : groupes numérotés encore
  présents dans les fiches 3, 7, 17, 18, 19, 20, 24 (plus 2, traitée
  juste avant). Décisions de David, sur proposition :
  - **Problèmes guidés en plusieurs étapes (fiches 3 et 17)** : fusion
    avec le plafond de 4 = n'en garder qu'un, **le plus complet**.
    - **Fiche 3 (28 → 25)** : 3.6 (I) + 3.7 (II) « Factorisation d'un
      polynôme de degré 3 » → **3.6** = l'ancien (II) (coefficient dominant
      2, racines éventuellement fractionnaires) ; retiré l'ancien (I)
      (dominant 1) ; 3.8 → 3.7, 3.9 → 3.8, `FORMES_FACTORISEES` mis à jour
      (3.6 b/c, 3.7). **Défaut d'affichage corrigé au passage** dans 3.8
      c)/d) (ex-3.9) : l'énoncé montrait un astérisque (« −3*a² ») et des
      fractions en ligne (« 3/4 ») — désormais `\dfrac` et pas de « * »
      (500 tirages vérifiés).
    - **Fiche 17 (41 → 34)** : 17.10 (I) + 17.11 (II) « Une somme
      arithmético-géométrique » → **17.10** = l'ancien (II) (λ à trouver
      sans équation donnée, uₙ à exprimer soi-même) ; 17.12 (I) + 17.13
      (II) « Une somme pour calculer le terme général » → **17.11** =
      l'ancien (I) (4 étapes complètes S(0), S(1), S(p)−S(n), uₙ contre
      3) ; 17.14/17.15 → 17.12/17.13 ; textes d'introduction générés
      (`mettreAJourTextesAvances`) adaptés (clés internes `paramsAvances.g*`
      inchangées, déjà décalées des numéros avant cette passe).
  - **Petits (I)/(II) avec leurs propres données (fiches 18, 19, 20)** :
    **rien fusionné, rien modifié** (décision de David) — 18.7/18.8
    télescopage, 19.9/19.10 probabilités conditionnelles, 20.9/20.10
    paramètres ; les deux variantes existant, la numérotation reste.
  - **Consignes différentes (fiches 7 et 24)** : pas de fusion, (I)/(II)
    retirés des titres. 7.8 « Quotients à simplifier » / 7.9 « Dériver des
    quotients simplifiés » ; 24.11 « Avec les formules d'addition » / 24.12
    « Valeurs exactes avec les formules d'addition » (24.13 « Avec les
    formules d'addition ? » laissé tel quel). **Bug corrigé en fiche 7** :
    7.9 b) tirait (px+q)/(rx+s) sans exclure ps = qr — fonction constante
    possible (vu : « dériver f(x)=(4x+4)/(4x+4) »), désormais redessinée
    tant que ps = qr (2000 tirages : aucune constante).
  Vérifié pour 3 et 17 comme d'habitude (ids ↔ `groupes`, 500 tirages,
  saisie complète 25/25 et 34/34, panneau sans erreur MathJax,
  régénération, console) ; 7 et 24 : `vm.Script`, 500 tirages (7), titres,
  chargement sans erreur. Scripts `.claude/scratch/fiche03.js`,
  `fiche17.js`.

- **Fiche 2 de Première, 2.5 — racines exigées sous forme simplifiée
  (30/09/2026).** Question de David : les racines sont-elles forcées
  entières/rationnelles ? Non — a), b), d) irrationnelles (racine carrée),
  c) rationnelles, entières seulement par hasard ; David : pas de racines
  forcées, mais « imposer la valeur simplifiée (lorsque cela est possible)
  et le dire dans le titre ». Avant, toute écriture équivalente était
  acceptée, et le corrigé lui-même affichait parfois une forme non
  simplifiée (« (4−2√7)/2 »).
  - Titre : « Déterminer les racines de chaque polynôme, **sous forme
    simplifiée**. » ; aide « ? » dédiée (exemples acceptés/refusés).
  - `racineSimplifieeStr(P, Q, rad, D)` : écrit (P+Q√rad)/D en retirant le
    facteur commun à P, Q, D (2−√7, (3+√3)/2, −√2/2) — utilisé par
    `racinesSurd` (a, b) et pour d) ; c) utilisait déjà des fractions
    réduites.
  - `estRacineSimplifiee` / `ensembleRacinesSimplifiees`, appelées pour
    les exercices marqués `racinesSimplifiees:true` (en plus de
    `checkEnsemble`) : chaque racine = somme de morceaux, terme élémentaire
    (c, √k, c√k) ou fraction N/d ; refusés : radicande avec facteur carré
    (√8), fraction réductible (pgcd de tous les coefficients du numérateur
    et du dénominateur ≠ 1 : (4−2√7)/2, (6+2√3)/4, −8/10), plusieurs termes
    rationnels ou de même radicande (1+1−√7, √2+√2), décimaux, coefficient
    1 ou 0 écrit, produit d'entiers (2*3). (5+√2)/10 et 1/2+√2/10 sont
    tous deux acceptés.
  Vérifié : 27 cas unitaires (13 acceptés, 14 refusés, tous comme
  attendu) ; 500 tirages : chaque réponse attendue acceptée, et sa
  version « doublée » (numérateur et dénominateur ×2, même valeur)
  refusée ; vrais champs MathLive : saisie complète 31/31, puis les 4
  réponses de 2.5 en version non simplifiée → refusées (27/31) ; corrigé
  et panneau en forme simplifiée, sans erreur MathJax ; aucune erreur de
  la page (le message `eff`/`getComputedStyle` vu dans la console vient
  d'un script injecté par l'outil de capture du navigateur, pas de la
  fiche).
  Retouche le jour même (David) : texte « sous forme simplifiée
  **lorsque cela est possible** », mis en valeur par une police plus
  grande — `<span class="titre-mise-en-valeur">` dans le titre, règle CSS
  `.calcul-titre .titre-mise-en-valeur { font-size: 1.2em; }` (locale à
  la fiche 2, à recopier si le procédé sert ailleurs) ; aide « ? » alignée
  sur la même formulation. Vérifié : 19,2 px contre 16 px pour le reste du
  titre, bouton « ? » toujours en place.

- **Consignes de forme mises en valeur dans les titres, 52 fiches
  (30/09/2026).** David : « bien mettre en valeur dès qu'une consigne
  demande cela (par exemple ... fraction irréductible) », en plus de la
  police une couleur différente. Choix de David : **toute forme imposée**
  (pas seulement la simplification), couleur **orange foncé #B45309**.
  - Règle ajoutée dans les 52 fiches, juste après `.calcul-titre:first-child` :
    `.calcul-titre .titre-mise-en-valeur { font-size: 1.2em; color: #B45309; }`
    (celle de la fiche 2, posée plus tôt sans couleur, remplacée).
  - `<span class="titre-mise-en-valeur">` autour de la seule expression qui
    impose la forme — jamais le verbe de consigne (Développer,
    Factoriser...) — dans 52 titres (+ 2.5 de la fiche 2 déjà fait) :
    fraction irréductible (dont « fraction de π irréductible »), forme
    simplifiée / une seule fraction simplifiée / simplifier au maximum, sous
    forme factorisée (dérivées, fiche 12), sans radical / racine carrée au
    dénominateur (et 11.3 « de manière à ce que les dénominateurs ne
    comportent pas de radicaux »), sous la forme a√b, 2^a, 2^a3^b, exp(A),
    ax+by+cz, a(x−α)²+β, y=mx+p, « a≥… ou a≤… », d'une seule puissance (ou
    d'une fraction), produit de puissances, à l'aide d'une seule
    puissance, sous (la) forme d'un intervalle (ou d'une réunion / union
    d'intervalles), par puissances croissantes / selon les puissances de x,
    en enlevant les fractions au numérateur et au dénominateur (7.8).
    Liste exacte dans `.claude/scratch/mise-en-valeur.js` (CIBLES).
  - Non mis en valeur (titres de thème, pas de consigne imposée) : ex.
    « Écriture décimale et fraction irréductible, cas moins immédiats »
    (Seconde 11.4), « De la forme canonique à la forme développée »,
    « Choisir la forme adaptée » ; indices « (on pourra ...) ».
  - **Au passage** : Première 6.1 affichait « 2^k » en texte brut dans le
    titre — désormais `\(2^k\)` avec `\(k\in\mathbb{Z}\)`.
  Vérifié : `vm.Script` 52/52, règle présente une fois dans chacune des 52
  fiches, 53 expressions balisées ; 8 fiches chargées (Seconde 1, 3,
  Première 1, 2, 6, 12, 23, 28) : 19,2 px contre 16 px, couleur
  rgb(180,83,9), formules MathJax rendues à l'intérieur de l'expression,
  boutons d'aide « ? » présents, aucune erreur ; capture (Seconde 3).
  **Pour toute nouvelle fiche ou tout nouveau titre** : baliser de la même
  façon l'expression qui impose la forme de la réponse.
  **Rendu revu le jour même** (David : « le rendu ne me plaît pas » ;
  titre déjà rouge → ne pas agrandir, trancher par la couleur). Maquette
  comparée (noir, bleu du site #4B46C7, bleu foncé #3A36A0) : **bleu
  foncé #3A36A0** retenu — contraste net avec le rouge #990000, couleur
  de la charte (survol des boutons), moins « bouton » que le bleu vif ;
  le noir se distinguait mal du rouge foncé en gras. Règle devenue
  `.calcul-titre .titre-mise-en-valeur { color: #3A36A0; }` dans les 52
  fiches (plus de `font-size`). Vérifié : 16 px comme le titre, couleur
  rgb(58,54,160), capture Seconde 1. « l'équation réduite » (Première
  11.8, 25.4) volontairement **non** balisée : la forme attendue est déjà
  expliquée dans le bouton « ? » (David).

- **Première : fiches 4 et 5 supprimées, fiches 6–28 renumérotées 4–26
  (30/09/2026).** Demande de David : « supprimer les fiches 4 et 5,
  adapter toute la numérotation des autres fiches » (Première confirmé :
  les deux niveaux ont des fiches 4 et 5). Supprimées : cahier 1, fiche 4
  « Polynômes I » et fiche 5 « Polynômes II » (restent dans l'historique
  git). **Correspondance ancien → nouveau : N → N−2 pour N = 6 à 28**,
  chaque fiche restant dans son dossier de cahier (cahier-2/fiche-06 →
  cahier-2/fiche-04, …, cahier-10/fiche-28 → cahier-10/fiche-26).
  ⚠️ Toutes les entrées de ce fichier antérieures à celle-ci parlent des
  **anciens** numéros (ex. « fiche 6 de Première » = l'actuelle fiche 4,
  « fiche 17 » = l'actuelle 15).
  - Fichiers renommés par `git mv` (ordre croissant, chaque cible libérée
    avant d'être occupée) ; dans chaque fiche : titre de page, pastille,
    liens précédent/suivant, titres « Calcul N.k » / « Entraînement N.k »,
    identifiants d'exercices (`id:"N.k a)"`, arguments `item("N.k a)")`,
    clés de `FORMES_FACTORISEES`), identifiants DOM (`grille-`, `texte-`,
    `graphique-`, `titre-`, `table-`, `arbre-`, `fleche-…-N-k`), renvoi
    d'énoncé « À l'aide de N.k a) ». Remplacements **ciblés par
    contexte** : un remplacement global aurait cassé `r="6.5"` (rayon SVG),
    `font-size="7.3"`, `Math.random()*8-1`… (audit préalable de tous les
    contextes). Noms internes invisibles (`genGroupeN_k`, `gN_…`,
    `PANEL_N_…`) et commentaires historiques laissés tels quels.
  - Fiche 3 devient la dernière du cahier 1 (« Fiche suivante »
    désactivé) ; sommaire du cahier 1 sans la section « Polynômes »
    (3 fiches) ; sommaires des cahiers 2–10 renumérotés ; « Tous les
    cahiers » : 26 fiches, cahier 1 à 3 fiches ;
    `assets/js/manifeste-fiches.js` (devoirs) mis à jour. Le titre du
    cahier 1 « Second degré et polynômes » est **gardé** (décision de
    David : la fiche 3 conserve une partie sur les polynômes de degré 3).
  - **Firebase** (inventaire en lecture seule avant l'opération, élèves
    réels désormais inscrits : 1ère Gr 1, 1ère Gr 3, 2nde-207) : aucun
    devoir, brouillon ni tentative sur les fiches de Première 4 à 28 ; un
    seul document concerné, `resultats` du compte de test « Nina »
    (classe 1ere-test) sur l'ancien chemin `cahier-2/fiche-06.html`
    (0 question répondue) — ce chemin désigne désormais « Dérivation III » :
    **supprimé** avec l'accord de David (contrôle de la classe et du
    contenu avant suppression, sauvegarde JSON dans le scratchpad de la
    session) ; nouvelle vérification : plus aucun document ne vise une
    fiche de Première ≥ 4.
  Script `.claude/scratch/suppr-fiches-4-5.js` (contrôles avant écriture,
  audits `analyse-numeros.js`, `analyse-ambigus.js`, `audit-guillemets.js`).
  Vérifié : `vm.Script` 50/50 ; pour les 26 fiches (chargées une à une) :
  identifiants tous préfixés du nouveau numéro, table `groupes` ↔ ids ↔
  grilles cohérents, aucun champ manquant, titres renumérotés, aucune
  erreur de page, 100 tirages auto-cohérents par fiche (y compris
  y=ax+b et produits Π, 3000 vérifications ; fiches 25–26 à questions
  fixes) ; titre/pastille/cahier/liens de chaque fiche listés et
  conformes ; fiche 5 : renvoi « À l'aide de 5.8 a) », panneau des
  réponses 29/29 sans erreur MathJax ; aucune référence restante aux
  anciens fichiers ou aux fiches supprimées.

- **Fiche 4 de Première (nouvelle numérotation, ex-6), 4.1 — écriture
  2^k exigée (30/09/2026).** David : la consigne demande « sous la forme
  2^k » mais la réponse attendue n'était que l'exposant k (« n+1 »).
  Désormais : réponse attendue `2^(k)` (corrigé affiché 2^{4n+1}),
  drapeau `formePuissance2` (dans l'objet renvoyé par `gen()` : la fiche
  ne recopie que `id` et `type` de la définition du générateur),
  `estPuissanceDe2` exige une racine `2^E` avec E écrit seulement avec n,
  des entiers, +, −, × (2^(n+1), 2^(2n), 2^(−n+3) acceptés ; n+1, 4^n×2,
  2^n×2, 2^n/2, exposant décimal ou avec puissance refusés), la valeur
  étant vérifiée par `checkEqualNumeric`. Aide « ? » dédiée, exemple
  « 2^k » dans le champ vide. Vérifié : 16 cas unitaires, 500 tirages
  (réponse acceptée, exposant seul toujours refusé), vrais champs
  MathLive (2^{4n+1} accepté, y compris sans signe ×, exposant seul et
  2^{4n}×2 refusés), fiche complète 18/18, panneau sans erreur MathJax.
  **4.3 (lecture graphique d'un nombre dérivé) — marge de ±0,2** (même
  jour). David : −5 accepté mais −5,1 refusé ; « une marge de plus ou
  moins 0,2 est acceptable [...] les élèves liront ce graphique sur leur
  téléphone ». Auparavant `checkEqualNumeric` (valeur exacte, les
  tangentes passant volontairement par des points de grille). Désormais
  drapeau `margeLecture:0.2` sur 4.3 a/b/c et `checkLectureGraphique`
  (valeur numérique, bornes incluses ; nombre décimal avec virgule,
  fraction ou calcul simple ; expression non numérique refusée) ; aide
  « ? » ajoutée à 4.3 (« une valeur à 0,2 près de la valeur exacte est
  acceptée »). Vérifié par les vrais champs sur les trois questions :
  exact, ±0,1, ±0,2 acceptés ; ±0,25 et ±0,3 refusés ; fraction −1/2
  acceptée.

- **Marge de ±0,2 étendue aux autres lectures graphiques + couples en
  LaTeX (30/09/2026).** David : « applique la même marge aux autres
  lectures graphiques ». Inventaire des 50 fiches (en Première, seule la
  fiche 4 en avait) ; en Seconde :
  - **marge ajoutée** (drapeau `margeLecture:0.2` sur le générateur ;
    aiguillage en tête de `verifierUne`, sauf questions `approx` ou
    `intervalle` qui gardent leur propre tolérance ;
    `verifierLectureGraphique` : valeur seule, ensemble {a;b} comparé trié
    élément par élément, couple (x;y), équation réduite y=mx+p avec m et p
    comparés et expression affine exigée ; aide « ? » complétée par
    « Lecture graphique : une valeur à 0,2 près de la valeur exacte est
    acceptée ») : **14.7 a–d** (images/antécédents sur une courbe),
    **15.4 a–c** (résoudre graphiquement f(x)=k — seulement quand le
    tirage donne un ensemble exact ; la variante « valeur approchée »
    gardait déjà 0,2), **16.4** (équation réduite de droites lues),
    **18.9** (diagramme en boîte, axe gradué), **21.3** (coordonnées de
    points), **23.3** (coordonnées de vecteurs) ;
  - **déjà tolérés** : 15.4 d–f, 15.5, 15.8 b–c (0,2) ; **14.7 e** garde
    sa tolérance de 0,5 (plus souple, graphique conçu pour elle) ;
  - **non concernés** : 18.7 (bâtons, effectifs écrits sur le diagramme,
    calcul de moyenne/médiane exact), 18.8 (pourcentages écrits), 20.5
    (arbre, valeurs écrites), 15.8 a (calcul exact à partir de la formule).
  **Défaut trouvé en testant, corrigé** (fiches Seconde 16, 22, 23, 25) :
  les couples (x;y) y sont lus en LaTeX brut (`valeurDuChampLatex`) et
  `checkPaire`/`checkPointCoordonnees` ne comprenaient ni `\frac{a}{b}`
  (toute fraction tapée au clavier MathLive), ni `1{,}5` (virgule), ni
  `\left( \right)` : une réponse juste comme (−9/2 ; 2) était **refusée**
  (seul « 3/2 » ou « 1.5 » tapé tel quel passait). Nouvelle fonction
  `latexNombresVersAscii` appliquée avant la comparaison (et dans la
  marge de lecture). Fiche 21 non concernée (lecture ascii-math).
  Scripts `.claude/scratch/marge-lecture-seconde.js`, `paires-latex.js`.
  Vérifié : `vm.Script` 50/50 ; vrais champs MathLive pour chaque question
  concernée (exact et ±0,2 acceptés, ±0,3 refusé ; 16.4 : y=mx+p exact,
  m+0,15/p−0,2 acceptés, m+0,3 ou p+0,3 ou y=x²+1 refusés ; ensembles
  dans le désordre acceptés ; ensemble vide) ; tous les couples des
  fiches 16, 22, 23, 25 saisis avec `\frac` → acceptés (et virgule
  décimale pour les valeurs finies) ; 8 fiches rechargées + « Générer
  une nouvelle version » sans erreur.

- **Reprise d'un brouillon : figures et textes ne correspondaient plus aux
  questions (Première 2, 4, 6, 11–15, 30/09/2026).** David, fiche 4 : « en
  4.3 a), on demande f'(−1) mais la tangente n'est pas tracée (et elle
  n'est pas horizontale), de même pour f'(1) ». Le graphique et les
  questions d'un même tirage sont cohérents (vérifié) ; mais à la
  **reprise d'un brouillon** (mode devoir, « Enregistrer mon avancement »),
  ces fiches restauraient le tableau `exercices` (énoncés, réponses) sans
  l'état tiré au hasard à côté (`paramsGraphiques` en fiche 4,
  `paramsAvances` dans les autres), puis redessinaient graphiques (fiche 4)
  ou textes d'introduction / titres paramétrés (fiche 2 : « P(x) = x²+bx+… »
  de 2.6–2.8 ; fiches 6, 11–15 : textes `texte-…`) à partir d'un
  **nouveau** tirage → questions d'un tirage, figure d'un autre. Les fiches
  1, 8, 17, 18 (et Seconde 14, 15) avaient déjà le mécanisme
  (`etatSupplementairePourBrouillon` / `restaurerEtatSupplementaire`,
  champ `extra` du brouillon, voir suivi.js) : ajouté aux 8 fiches
  (enregistrement + restauration). **Piège en plus, fiche 4** : les
  paramètres des QCM 4.5 a/b contenaient des **fonctions** (les trois
  courbes), perdues à l'enregistrement (JSON) — le dessin aurait planté à
  la reprise ; `genererParamsQCM3Courbes` renvoie désormais aussi les
  coefficients (`coeffs`) et le rôle de chaque courbe (`type` F/Fa/Fc), et
  `reconstruireFonctionsQCM3Courbes` les recrée à la restauration (si
  impossible — brouillon antérieur — le tirage courant est gardé plutôt
  que de planter). Vérifié par simulation dans chaque fiche (état passé
  par JSON comme dans Firestore, nouvelle version générée puis
  restauration) : texte visible et tracés des courbes identiques à
  l'origine, alors que le nouveau tirage les avait bien changés ; aucune
  fonction restante dans l'état des autres fiches (contrôle récursif).
  Limite : un brouillon enregistré **avant** ce correctif n'a pas cet état
  (inventaire du jour : brouillons sur Première 1 et 2 seulement) — il se
  corrige dès que l'élève réenregistre ou génère une nouvelle version.
  Script `.claude/scratch/etat-brouillon.js`.

- **Fiche 4 de Première — présentation de 4.3, 4.4, 4.5 (30/09/2026).**
  David : « Dans 4.3, écrire a) pour f et mettre les questions en dessous
  du graphique et b) pour g […]. Pour 4.4 : il est écrit de répondre par a
  b c ou d mais il n'y a aucune de ces lettres dans les propositions,
  seulement f1, f2 et f3 […]. Idem pour 4.5. […] écrire les choses en
  LaTeX […] et non f_a ».
  - **4.3** : deux parties. « a) » en tête du texte de la courbe de \(f\),
    suivi de sa grille (`grille-4-3a` : 1) \(f'(p)\), 2) \(f'(q)\)) ; puis
    « b) » courbe de \(g\) et sa grille (`grille-4-3b` : \(g'(p_2)\), seule
    donc sans repère). Les questions de la partie a) sont repérées 1) et 2)
    (nouveau champ `repere` d'un exercice, prioritaire sur la lettre
    automatique de `construireGrilles`) pour ne pas mélanger avec a)/b).
    Ids : « 4.3 a) 1 », « 4.3 a) 2 », « 4.3 b) » (ordre changé : f'(q)
    passe avant g'(p2)). Marge de lecture 0,2 inchangée.
  - **4.4 et 4.5 a/b** : question « Parmi \(f_1\), \(f_2\) et \(f_3\),
    quelle fonction a pour dérivée \(f'\) ? », on répond par le **nom de
    la fonction** — `f1`, `f2`, `f3` (touches f₁ f₂ f₃ du clavier, qui
    remplacent a b c d) ou simplement `1`, `2`, `3` ; `f_1`, `f₁` acceptés
    (`numeroFonctionQCM`). Une lettre a/b/c tapée par l'élève est refusée ;
    elle n'est lue que dans la réponse attendue (les paramètres tirés
    gardent la lettre de position a/b/c, convertie en f1/f2/f3 par les
    générateurs — et un brouillon antérieur, qui stockait « a », reste
    corrigé juste). Placeholder « f1, f2 ou f3 », aide « ? » réécrite,
    réponse affichée \(f_1\) (au lieu de « Réponse a »), plus de « = »
    après la question (`sansEgal`).
  - **Noms en LaTeX** : étiquettes des trois courbes de 4.5 en
    \(f_1\), \(f_2\), \(f_3\) (MathJax, 15 px, noir — au lieu de « f_a »
    gris 11 px) ; dans les tableaux de variation de 4.4 (SVG, où MathJax ne
    passe pas), f italique + indice droit décalé (`<tspan dy>`), rendu
    identique à LaTeX, au lieu des caractères « f₁ ».
  - **Brouillons** : la validité d'un brouillon exige désormais la même
    liste d'ids que la fiche (pas seulement le même nombre de questions),
    sinon un brouillon enregistré avant la réorganisation placerait
    g'(p2) sous la courbe de f.
  Vérifié dans le navigateur : ordre graphique f → questions 1) 2) →
  graphique g → question ; 0 / +0,15 acceptés, +0,3 refusé sur les trois
  lectures ; QCM : f1, 1, f_{1} acceptés, mauvaise fonction et a/b/c
  refusés ; 30 tirages : bonne réponse répartie sur f1/f2/f3 et
  correspondant bien à l'étiquette de la bonne courbe / du bon tableau ;
  aucune erreur console. Vérificateur de syntaxe : 50 fiches, 0 erreur.

- **Fiche 5 de Première (Dérivation II) — refonte demandée par David
  (01/10/2026), 29 → 27 questions, 12 → 9 calculs.**
  - **5.4** : polynômes de degré 2 à 5 (« privilégier les polynômes de
    degré 2 à 5 » ; avant : 4, 5, 6) — a) degré 2 entier, b) degré 3 ou 4,
    c) degré 5 (coefficients fractionnaires en b et c comme avant).
  - **5.6 « Inverses et quotients »** = fusion des anciens 5.6 (1/u) et 5.7
    (quotients), 4 exemples : a) k/(affine), b) k/(trinôme), k entier non
    nul quelconque (plus seulement 1) ; c) quotient de deux affines
    (ps − qr ≠ 0 imposé : sinon fonction constante) ; d) ax/(x²+b), a et b
    entiers non nuls quelconques.
  - **5.7 « Produits »** remplace les anciens 5.8 (quotients à simplifier)
    et 5.9 (dériver les quotients simplifiés) : a) affine × trinôme
    (réponse développée attendue mais toute forme égale acceptée),
    b) affine × √x, c) trinôme × √x (ces deux-là « sur ]0;+∞[ » dans
    l'énoncé).
  - **5.8 « Signe de la dérivée »** (ex-5.10) : ajout de e) ax/(x²+b) avec
    b > 0 (définie sur ℝ) → [−√b ; √b] si a > 0, extérieur sinon. Bornes
    irrationnelles : la saisie `√(5)` / `sqrt(5)` est acceptée ; la
    correction affiche √b simplifiée (champs `texBas`/`texHaut` d'un
    intervalle, prioritaires dans `formaterIntervalleSpec`). 5 exemples :
    au-delà de la règle des 4, mais c'est l'ajout explicitement demandé.
    **Bug corrigé au passage en 5.8 d)** f = 1/(Ax²+Bx+C) : le trinôme
    pouvait s'annuler (A < 0, ou B² > 4AC) → f non définie partout et
    intervalle attendu faux ; discriminant < 0 désormais imposé.
  - **5.11 « Dériver puis factoriser » supprimé** (table
    `FORMES_FACTORISEES` vide), **5.12 → 5.9** (sommes).
  - **Cadre gris des calculs avancés** : le `<div class="bloc-avance">`
    manquait (le `</div>` final était orphelin) — ajouté autour de
    « Calculs plus avancés ».
  - Brouillons : validité exigeant la même liste d'ids (comme fiche 4).
  Vérifié : 200 tirages, chaque réponse attendue comparée à la dérivée
  numérique de f (lue dans l'énoncé) et chaque intervalle de 5.8 au signe
  numérique de f′ sur [−12 ; 12], 0 écart ; pas de valeur interdite en
  5.8 d) ; saisies réelles : 5.7 b) forme développée et forme
  (12x−3)/(2√x) acceptées, réponse incomplète refusée ; 5.8 e) `[-√(5);√(5)]`
  et `sqrt` acceptés, crochets ouverts refusés ; cadre gris présent
  (contient 5.9, pas la barre de boutons) ; aucune erreur console ;
  syntaxe 50 fiches, 0 erreur. Scripts `.claude/scratch/fiche05.js` et
  `fiche05-bloc.js`.

- **Fiche 5 de Première — suite des retours de David (01/10/2026), 27
  questions inchangé.**
  - 5.8 garde ses **5 exemples** : « on garde en général la règle des 4
    mais je ferai juste quelques exceptions comme ici » (les exceptions
    viennent de David uniquement).
  - **5.7 : une seule racine carrée** (« un exemple avec racine carrée
    suffit parmi les 3 ») → a) affine × trinôme, b) trinôme × trinôme,
    c) affine × √x (sur ]0;+∞[). Le trinôme × √x est retiré.
  - **Automatismes diversifiés** (nouvelle règle, « à partir de cette
    fiche » : pas que du calcul numérique, aussi équations, inéquations
    produits et quotients) :
    - **5.1** (intervalle ou réunion d'intervalles, mis en valeur dans le
      titre) : a) inéquation produit (px+q)(rx+s) ◊ 0, b) inéquation
      quotient (px+q)/(rx+s) ◊ 0 (valeur interdite toujours exclue, racine
      du numérateur incluse si inégalité large) — remplacent deux
      inéquations du premier degré. p ∈ {±1, ±2, ±3} : racines simples à
      lire. Construction commune `specSigneProduit`.
    - **5.2 « Résoudre dans ℝ les équations suivantes (ensemble des
      solutions) »** : a) équation produit = 0 → {r1;r2}, b) équation
      quotient (px+q)/(rx+s) = k → {(ks−q)/(p−kr)} (p ≠ kr, ps ≠ qr :
      sinon quotient constant et « solution » = valeur interdite) —
      remplacent la simplification de fractions de puissances. Touches
      { } ; ajoutées au clavier des réponses-ensembles
      (`groupeEnsembleClavier`, repris de la fiche 6).
    - 5.3 (f(a), calcul numérique) inchangé. Toujours 6 automatismes.
  Vérifié : 300 tirages (2 100 questions) — inéquations comparées au signe
  numérique sur une grille + aux bornes exactes, équations : solutions
  vérifiées et aucune autre racine (changements de signe), produits 5.7
  comparés à la dérivée numérique — 0 écart ; saisies réelles acceptées
  (`]-inf;1[ ou ]8;+inf[`, `{1;-9}` tapé avec les touches { }), aucune
  erreur console. Scripts `.claude/scratch/fiche05-v2.js` et
  `fiche05-automatismes-bloc.js`.
  - **Rééquilibrage le jour même** — David : « un exemple d'inéquation
    produit suffit (il y en aura d'autres dans les fiches suivantes).
    N'oublie pas les inéquations de degré 1 avec coeff de signe
    quelconque. Et on n'abandonne pas complètement le calcul numérique
    mais il faut diversifier ». Automatismes finaux (6) :
    - 5.1 a) inéquation du premier degré px+q ◊ rx+s, coefficients de
      signe quelconque (coefficient de x négatif dans 190 tirages sur
      400 → changement de sens) ; b) inéquation produit. L'inéquation
      quotient est retirée.
    - 5.2 équations produit / quotient = k : inchangé.
    - **5.3 « Calcul numérique »** : a) simplifier une fraction de
      puissances (12^m × 10^n)/(15^p × 8^q) (exposants ≥ 2, un « 8¹ »
      pouvait s'afficher), b) « Avec f(x) = …, calculer
      f((p+√D)/q) ». Le trinôme est écrit **dans la question** et plus
      dans le titre : **bug corrigé au passage**, à la reprise d'un
      brouillon le titre était recalculé à partir d'un nouveau tirage
      (f affiché ≠ f des réponses attendues).
    Vérifié : 400 tirages (inéquations au signe numérique + bornes
    exactes, fraction et image recalculées indépendamment), 0 écart ;
    saisies réelles acceptées (champs texte et math-field) ; aucune
    erreur console. Script `.claude/scratch/fiche05-v3.js` (+ Edit).
  - **Vérification du corrigé** (question de David : « as-tu bien vérifié
    le corrigé de ces questions ? » — réponse honnête : jusque-là
    seulement les valeurs attendues et 3 affichages). Valeurs : toutes
    justes (8 100 réponses sur 300 tirages, recalculées indépendamment).
    Mais **affichage maladroit** trouvé et corrigé (pré-existant pour 5.4
    et 5.5) :
    - coefficients fractionnaires affichés « −3/4 × x² », « (−30)/7 × x⁴ »
      → `fracTermAscii` écrit désormais « 3*x^2/4 » (rendu 3x²/4) et un
      premier terme négatif fractionnaire « -(…) » (rendu −30x⁴/7) ;
    - nombres a + b√D (5.3 b, 5.5) affichés « −(7/9 − 13/3 × √7) » →
      `snAscii` écrit terme à terme : −7/9 + 13√7/3 ;
    - ensembles de 5.2 affichés {(−3)/2 ; −1} → {−3/2 ; −1}.
    Contrôle : 300 tirages sans plus aucun « × » ni « (−a)/b » dans les
    corrections (hors sommes 5.9, où le × entre k et x^(k−1) est voulu ;
    5.6 garde un numérateur négatif, ex. (−98x−35)/(…)², écriture usuelle) ;
    cycle complet sur 3 fiches générées : chaque correction affichée,
    retapée dans le vrai champ, est acceptée (27/27 ; sommes saisies comme
    avec la touche Σ) ; panneau « Voir toutes les réponses » : 27 lignes,
    0 erreur MathJax.

- **Équations de tangentes déplacées de la fiche 6 vers la fiche 5
  (01/10/2026).** David : « Je souhaite prendre la section 6.6 dans la
  fiche 5. Juste avant les calculs avancés. »
  - **Fiche 5** : nouvelle section « Équations de tangentes », **5.9 « Des
    équations de tangentes »** (titre et picto de l'ancien 6.6 inchangés),
    mêmes trois exemples : a) trinôme entier, b) trinôme à coefficients
    demi-entiers, c) kx/(ax+b). Sommes 5.9 → **5.10** (dans le cadre gris).
    27 → 30 questions. Générateurs réécrits avec les fractions de la fiche 5
    (`F(n,d)`, `fracAdd`… — la fiche 6 a un objet `F` différent, d'où pas
    de copie directe) ; support « y=… » ajouté (n'existait pas en fiche 5) :
    `checkEquationYax` (le « y= » est exigé), placeholder `y=ax+b`, aide
    « ? », correction « y=… ». Équation écrite comme les autres réponses
    de la fiche (pente « 7x/2 », pas « 7/2 × x »).
  - **Fiche 6** : 6.6 retiré, 6.7 → 6.6 (ordonnées à l'origine, reste seul
    dans la section « Équations de tangentes »), 6.8 → 6.7, 6.9 → 6.8 ;
    22 → 19 questions ; fonctions devenues inutiles retirées
    (`equationReduiteAscii`, `tangenteQuadratique`, `tangenteRationnelle`) ;
    validité d'un brouillon exigeant la même liste d'ids.
  Vérifié : fiche 5, 300 tirages comparés à la vraie tangente (dérivée
  numérique), aucun « × » ni « (−a)/b » dans les corrections ; cycle
  complet 30/30 (corrections retapées dans les champs), « y= » oublié
  refusé, panneau 30 lignes sans erreur MathJax. Fiche 6 : cycle 19/19,
  panneau 19 lignes sans erreur, aucune erreur console. Scripts
  `.claude/scratch/fiche05-tangentes*.js`, `fiche06-retrait-66.js`,
  `fiche06-nettoyage.js`.

- **Fiche 6 de Première (Dérivation III) — automatismes diversifiés et
  corrections (01/10/2026), 19 questions, 8 → 10 calculs.** David :
  « diversifie les automatismes de la fiche 6 et corrige ce que tu as
  remarqué d'incohérent, inutile et exclu ce qui doit être exclu ».
  - **Automatismes (6)**, en variant par rapport à la fiche 5 :
    6.1 a) inéquation du premier degré avec parenthèses k(x+q) ◊ rx+s
    (coefficients de signe quelconque, coefficient de x négatif dans
    146 tirages sur 300), b) **inéquation quotient** (la fiche 5 avait le
    produit ; valeur interdite toujours exclue) ; 6.2 a) **équation du
    second degré** (racines entières distinctes), b) **équation du premier
    degré à coefficients fractionnaires** (même numérateur des deux côtés
    exclu) ; 6.3 **calcul fractionnaire avec priorités**, « sous forme de
    fraction irréductible » mis en valeur et contrôlé
    (`estFractionIrreductible`, repris de la fiche 2 ; 4/6 refusé) ;
    6.4 développer et ordonner (l'ancien 6.2 a, le plus complet). Retirés :
    « écrire sous la forme ax+by+cz » (3) et deux « développer » (que du
    calcul littéral). Calculs suivants renumérotés +2 (6.3 → 6.5 …
    6.8 → 6.10, `texte-6-4/5` → `texte-6-6/7`).
  - **Tirage exclu** : 6.6/6.7 (ex-6.4/6.5) pouvaient tirer h(x) = f(x)
    (p = 1, q = 0) — question sans objet ; 0 cas sur 300 tirages depuis.
  - **Incohérences corrigées** : « Que vaut h′(x) ? = » (plus de « = »
    après « ? », `sansEgal`) ; fractions négatives écrites −3/2 et non
    (−3)/2 dans tous les énoncés (`F.fmtLatex`) et les ensembles corrigés ;
    monômes sans parenthèses inutiles (« 4x », « x² » au lieu de « (4x) »,
    « (x)² » — `puissanceStr`) ; numérateur de degré 1 sans parenthèses en
    6.8 a) ; coefficient −1 écrit « − » en 6.9 ; point (−3/2 ; 9) avec un
    point-virgule en 6.10 a) ; corrections plus lisibles : « 6(2x+5)² » au
    lieu de « 6 × (2x+5)² » (règle ajoutée à `collerCoefficientLettre`),
    « −12/(…)⁴ » au lieu de « (−12)/(…)⁴ », « 6(3x+1)/… » au lieu de
    « −3 × 2(…) » (6.7 a), fraction de 6.9 simplifiée
    (`normaliserQuotientPoly` : (2a−3)/4 et non (4a−6)/8).
  - **Code inutile retiré** : `combinaisonLineaire`,
    `derivProduitPuissances`, `derivQuotientPuissances`,
    `tangenteSommePuissances`, `ordonneeOriginePuissance`, `pToLatex`,
    `termePoly`, `pNeg` (plus appelées) et commentaires périmés du tableau
    des générateurs.
  - Non modifié : 6.5 « Puissances » d) est un quotient −k/(ax+b)ⁿ
    (puissance négative) — cohérent avec le titre.
  Vérifié : 300 tirages — inéquations au signe numérique (grille + bornes
  exactes), équations (solutions vérifiées, aucune autre racine), 6.3
  recalculé, 6.4 développé comparé, dérivées 6.5 / h′ 6.6-6.7 / ordonnées
  6.8 / intersection 6.9 comparées à des calculs numériques indépendants :
  0 écart ; cycle complet 3 × 19/19 (corrections retapées dans les
  champs) ; fraction non simplifiée refusée ; panneau 19 lignes sans
  erreur MathJax ; aucune erreur console. Scripts
  `.claude/scratch/fiche06-automatismes-bloc.js`, `fiche06-refonte.js`,
  `fiche06-nettoyage2.js` (+ Edit).

- **Règles communes aux deux machines (02/10/2026).** Les règles de
  rédaction données par David n'existaient que dans la mémoire locale de
  Claude Code sur PC pro (`C:\Users\David\.claude\…`, hors dépôt) : les
  sessions sur PC perso ne les voyaient pas. Elles sont désormais dans
  **`REGLES-FICHES.md`** (racine), signalé dans `CLAUDE.md` et lu à chaque
  ouverture de session : 4 exemples maximum (exceptions par David),
  6 automatismes diversifiés, mise en valeur des formes imposées (#3A36A0),
  pas de « (I) » seul, marge ±0,2 des lectures graphiques, corrigé lisible,
  liste de vérification, pièges techniques.
  **Vérificateur de syntaxe** des fiches rangé dans le dépôt :
  `node outils/verification/verifier-syntaxe-fiches.js` (chemin relatif,
  fonctionne sur les deux PC ; code de sortie 1 en cas d'erreur).
  `.claude/scratch/` (scripts ponctuels déjà appliqués, à ne pas relancer)
  ajouté au `.gitignore` : reste local à chaque machine.

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
4. Avant de modifier une fiche : lire `REGLES-FICHES.md` (règles de
   rédaction de David, communes aux deux machines — la mémoire locale de
   Claude Code ne voyage pas d'un PC à l'autre). Vérificateur de syntaxe :
   `node outils/verification/verifier-syntaxe-fiches.js` (aucune
   dépendance à installer).

---

## Journal depuis la réorganisation du 02/10/2026

(Nouvelles entrées datées ci-dessous, la plus récente en dernier.)

- **Réorganisation des fichiers de suivi (02/10/2026).** David : « as-tu
  mis de l'ordre dans les règles de fiches pour que ce soit efficace ? Nous
  avons accumulé beaucoup de modifications ». `SUIVI-FIREBASE.md` était
  devenu un journal de 5 215 lignes (350 Ko, environ 90 000 tokens), lu à
  chaque ouverture de session, dont 4 000 lignes de « pièges » qui étaient
  en fait le récit chronologique des chantiers.
  - **`HISTORIQUE.md`** (ce fichier) : tout l'ancien contenu de
    `SUIVI-FIREBASE.md`, déplacé tel quel (rien supprimé), précédé d'un
    avertissement sur l'ancienne numérotation des fiches de Première ; les
    nouvelles entrées s'ajoutent ici, à la fin.
  - **`SUIVI-FIREBASE.md` réécrit** (259 lignes, 15 Ko) : dépôt et
    machines, le site (50 fiches, fichiers partagés), Firebase (collections
    utiles et orphelines, suivi limité aux devoirs), fonctionnement actuel
    des devoirs, comptes, pistes ouvertes, pièges techniques résumés en une
    ou deux lignes, procédure de reprise.
  - **`REGLES-FICHES.md` complété** après relecture intégrale du journal :
    consigne factorisée, notation LaTeX et point-virgule, questions seules
    et `sansEgal`, problèmes à étapes non fusionnés, réponses d'équations en
    ensemble, infini jamais inclus, une droite s'écrit y=mx+p, énoncés
    propres, tirages dégénérés exclus, titre cohérent avec les réponses
    acceptées ; pièges techniques renvoyés vers `SUIVI-FIREBASE.md` §7.
  - `CLAUDE.md` : lire `SUIVI-FIREBASE.md` et `REGLES-FICHES.md` à
    l'ouverture, `HISTORIQUE.md` seulement au besoin ; récit détaillé des
    chantiers désormais ici.
  - Reste à faire sur PC perso : verser dans `REGLES-FICHES.md` les règles
    de la mémoire locale de Claude Code sur cette machine, citées dans le
    journal mais absentes de PC pro (voir `SUIVI-FIREBASE.md` §6).

- **Règles de la mémoire de PC perso versées dans `REGLES-FICHES.md`
  (02/10/2026).** David : « oui fais le maintenant » (tâche de
  `SUIVI-FIREBASE.md` §6). Relecture des règles conservées dans la mémoire
  locale de Claude Code sur PC perso ; ajouté ce qui manquait :
  - §2 automatismes de Seconde : premier calcul varié (vivier de modèles),
    révisions mêlées sans l'annoncer dès la fiche 14, plus de calcul
    numérique pur dès la fiche 15 (non rétroactif) ;
  - §3 : pas de point final en fin de question, jamais la démarche dans
    l'énoncé, rédiger les idées de David en vraies phrases, polynôme nommé
    `P(x)=…`, contextes sans sujet sensible, calculs avancés plus difficiles
    et non contextualisés ;
  - §4 : précisions sur « y=mx+p » (saisie « y= » exigée, pas d'équation
    cartésienne avant la fiche droites, « s'il existe » / « aucun »),
    rigueur des inéquations (intervalles dans toute la fiche, ∪ et ∅ en
    symboles, système avec accolade, encadrement `a<x<b`), clavier
    simplifié complet ;
  - nouveau §4 bis « Conception des tirages aléatoires » : élargir les
    familles de courbes, variété mesurée et coefficients signés, figures non
    aplaties (|sin| > 0,5, tous les sites du fichier), graphiques lisibles,
    banques d'automatismes comme source d'inspiration.
  Déjà présents (non dupliqués) : règle 3bis (problèmes à étapes), une
  droite s'écrit y=mx+p, consigne factorisée, 4 exemples au maximum.
  `SUIVI-FIREBASE.md` §6 : tâche retirée ; ajout des deux points ouverts
  trouvés dans cette mémoire (erreur NaN de la fiche 17, ex-19, mise de
  côté par David ; groupe statique de la fiche 12, ex-14, par choix de
  David).

- **Première fiche 6 : 6.8 b) et 6.9 refaits (02/10/2026).** David :
  « dans 6.8 b), une fonction du type (ax+b)^p suffit. Dans 6.9, choisir
  les deux fonctions du type k(mx+p)^2 avec k différent pour les deux
  fonctions (positif ou négatif) mais m et p identiques pour les 2 […]
  calculer les valeurs de a pour lesquelles les tangentes Tf,a et Tg,a ne
  sont pas parallèles et les donner dans l'énoncé ».
  - 6.8 b) : \(f(x)=(ax+b)^n\), \(n\in\{3;4\}\), \(a\) multiple du
    dénominateur du point (fractionnaire) pour que \(ax+b\) y vaille ±1
    ou ±2 (calcul mental) ; ordonnée à l'origine \(f(x_0)-x_0f'(x_0)\)
    calculée directement. `ordonneeOrigineProduit`, devenue inutilisée,
    retirée.
  - 6.9 : \(f(x)=k_1(mx+p)^2\), \(g(x)=k_2(mx+p)^2\), \(k_1\ne k_2\) parmi
    ±1, ±2, ±3, \(m\) et \(p\) non nuls. Les pentes en \(a\),
    \(2k_im(ma+p)\), ne coïncident que si \(ma+p=0\) : l'énoncé dit
    désormais « Soit \(a\) un réel différent de \(-\frac{p}{m}\) » au lieu
    de « un réel pour lequel les tangentes sont sécantes ». Intersection
    en \(x=\frac{a}{2}-\frac{p}{2m}\) (calculée par
    `intersectionTangentes`, inchangée).
  - Titre de 6.8 : \(f\) et \(a\) en LaTeX.
  - Vérifié : 2 000 tirages comparés à un calcul indépendant (énoncé
    relu, dérivées numériques) — ordonnées à l'origine exactes,
    intersection exacte en trois valeurs de \(a\), tangentes bien
    parallèles en la valeur exclue ; 112 et 1 086 énoncés distincts ;
    corrigé retapé dans le vrai champ accepté (12/12), réponse fausse
    refusée ; vérificateur de syntaxe : 0 erreur ; rendu contrôlé.

- **Première fiche 7 (Généralités sur l'exponentielle I) — automatismes
  aux nouvelles règles et simplifications (02/10/2026), 38 → 32
  questions, 14 calculs.** David : « 1. cette fiche ne respecte pas encore
  les nouvelles règles sur les automatismes. 2. Fusionner 7.4 et 7.5 en
  réécrivant le titre et préciser dans les exemples "développer" ou
  "factoriser". 3. dans 7.8, deux exemples suffisent. 4. 7.11 une seule
  question suffit. »
  - **Automatismes (6)**, en rotation avec les fiches 5 et 6 : 7.1 a)
    inéquation du premier degré à membre fractionnaire, coefficients de
    signe quelconque, b) inéquation produit (x²+k)(ax+b) ◊ 0 (un facteur
    toujours positif ; la fiche 5 avait un produit, la 6 un quotient) ;
    7.2 a) (ax+b)²=c², b) facteur commun (ax+b)(cx+d)=(ax+b)(ex+f)
    (solutions distinctes) ; 7.3 « Calcul numérique » : a) produit
    conjugué (a√b+c)(a√b−c), b) (Bⁿ⁺ᵖ ± Bⁿ)/Bⁿ⁺ᑫ sous forme de fraction
    irréductible (contrôlée). Retirés : les trois calculs de fractions et
    les trois puissances 2ⁿ (calcul numérique seul). Ajout de
    `aleaNonNul` (absente de cette fiche).
  - **7.4 + 7.5 → 7.5 « Avec des identités remarquables »** : deux
    « Développer » (carré d'une différence à coefficients, différence de
    deux carrés qui vaut 4) et deux « Factoriser » (carré à exposants
    différents, différence de deux carrés) ; forme factorisée exigée sur
    les deux derniers seulement. Ancien 7.3 → 7.4.
  - **7.8** : 3 → 2 (gardés le changement X=exp(x) et le changement
    X=exp(x²) ; « À l'aide de …, résoudre » factorisé → « …, en posant
    X=… »). **7.11** : une seule question (cosh(2x) en fonction de
    cosh(x)).
  - Défauts préexistants corrigés : « exp(1x) », « exp(−1x) » (7.5, 7.6) ;
    « exp(0) » tiré au hasard (7.4, 7.6, 7.7) ; « = » ajouté après une
    phrase (« Calculer … = », « est : = », 7.3, 7.5, 7.9, 7.11, 7.14) ;
    ℝ en LaTeX dans les titres et énoncés.
  - Vérifié : 600 tirages comparés à un calcul indépendant (énoncé relu :
    inéquations au signe sur une grille + bornes, équations par
    substitution, calculs numériques, développements/factorisations en
    trois points), 2 000 tirages sans défaut d'affichage ; cycles complets
    (corrections retapées : 224/224 sur les 7 tirages faits après les
    dernières retouches) ; fraction non
    simplifiée, calcul non effectué et expression développée refusés ;
    0 erreur MathJax, aucun débordement ; vérificateur de syntaxe :
    0 erreur ; rendu contrôlé.

- **Première fiche 8 (Généralités sur l'exponentielle II) — automatismes
  aux nouvelles règles (02/10/2026), 32 questions, 13 → 14 calculs.**
  David : « fiche 8 : je vais vérifier mais avant toute chose, applique la
  règle des automatismes sur cette fiche de manière autonome ».
  - Anciens automatismes : 8.1 quatre factorisations, 8.2 deux fractions
    de fractions (pas d'inéquation, pas d'équation).
  - **Nouveaux (6)**, en rotation avec les fiches 5 à 7 : 8.1 a)
    inéquation du premier degré m(px+q) ◊ n(rx+s) (parenthèses des deux
    côtés, coefficients de signe quelconque), b) **inéquation quotient
    comparé à un nombre** (px+q)/(rx+s) ◊ k (la fiche 7 avait un produit ;
    ensemble construit par point-test dans chaque région, valeur interdite
    jamais incluse) ; 8.2 a) a/(x+b) = c/(x+d) (solution différente des
    valeurs interdites, signe devant la fraction), b) second degré à
    **racine double ou sans solution** ({k} ou {}, environ moitié-moitié) ;
    8.3 « Calcul numérique » : a) fraction de fractions (ancien 8.2 a,
    au moins une vraie fraction en haut et en bas : plus de « 3+2 »),
    b) pourcentage d'un pourcentage (résultat entier). Anciens 8.3 à 8.13
    → 8.4 à 8.14 (ids renumérotés, conteneurs de figures inchangés) ;
    `FORMES_FACTORISEES` vidée (plus de « Factoriser ») ; ajout de
    `aleaNonNul` ; ℝ en LaTeX dans les titres 8.6 et 8.7.
  - Vérifié : 300 tirages comparés à un calcul indépendant (énoncé relu :
    inéquations au signe sur une grille et de part et d'autre des bornes,
    équations par substitution et recherche d'autres racines, absence de
    solution vérifiée par le signe, fraction et pourcentage recalculés),
    600 énoncés distincts environ par question ; cycle complet 8 × 32
    (corrections retapées) accepté ; fraction non simplifiée et mauvais
    ensemble refusés ; 0 erreur MathJax ; vérificateur de syntaxe :
    0 erreur ; rendu contrôlé.
  - Remarqué, non traité (hors automatismes, en attente de la relecture de
    David) : « exp(0) » tiré au hasard dans 8.4 à 8.8.

- **Première fiche 8 : notation e^x et suppression des exp(0)
  (02/10/2026).** David : « Je pense que dans cette fiche, on doit
  utiliser la notation e^x plutôt que exp(x). Réécris donc les énoncés et
  les corrigés. corrige ensuite le défaut de exp(0) ».
  - **Notation** : fonction `expVersPuissance` (fiche 8 uniquement) qui
    réécrit \exp(A) et \exp\left(A\right) en e^{A} ; une exponentielle
    élevée à une puissance devient \left(e^{A}\right)^n (sens de
    l'exercice conservé, ex. (eˣ)² = 1/e⁶) ; e^{1} s'écrit e (e⁴ et non
    « (e)⁴ », petite espace dans « 2e\,eˣ »). Appliquée à la fin de
    `genererExercices` (énoncés et options) et dans `jsVersLatex` (tous les
    corrigés, y compris le panneau « Voir toutes les réponses » et
    l'aperçu de saisie). Titre de 8.4 : « sous la forme \(e^{A}\) ».
    8.4 a) et b) : facteurs séparés par × (sinon « ee⁴ »). Saisie : « e^x »
    tapé (MathLive, « e » = nombre e pour math.js) et « exp(x) » sont
    acceptés tous les deux.
  - **exp(0) supprimé** : exposants nuls exclus du tirage en 8.4 a)-c),
    8.6 d), 8.7 a), c), d) et 8.8 a) ; résultats e⁰ exclus en 8.4 a)-b).
  - **Ensemble vide** (nouveau 8.2 b) : le corrigé affichait
    « {undefined} » → « ∅ » ; « ∅ » tapé est désormais accepté (il ne
    l'était pas), touche ∅ ajoutée au clavier des ensembles, aide « ? » et
    astuce du clavier mises à jour.
  - Vérifié : 2 000 tirages sans « exp », « e⁰ », « e¹ », « ee » ni
    « (e)^ » dans les énoncés, options et corrigés ; 500 tirages où les
    énoncés réécrits sont relus et évalués indépendamment (simplifications
    de 8.4-8.5 en trois points, solutions de 8.6 et 8.8 par substitution) :
    0 écart ; 0 erreur MathJax sur 30 fiches complètes (énoncés +
    corrigés) ; cycle complet 6 × 32 accepté (∅ tapé compris) ; « e^x » et
    « exp(x) » acceptés ; vérificateur de syntaxe : 0 erreur ; rendu
    contrôlé.

- **Première fiche 8 : 8.11 supprimé (02/10/2026), 32 → 31 questions.**
  David : « supprimer 8.11 » (QCM « Voici la courbe représentative d'une
  fonction f » : reconnaître c·eˣ parmi trois expressions). Retirés : le
  bloc HTML (titre, figure `graphique-8-12`, grille), le générateur, la
  figure (`construireGraphique10_12` et ses deux appels) et son état
  sauvegardé avec les brouillons (`paramsGraphiques10_12`). 8.12 → 8.11
  (somme), 8.13 → 8.12 (produit), 8.14 → 8.13 (simplification ?). La
  section « Représentation graphique » ne garde que 8.10. Vérifié : 31
  cartes dans l'ordre, cycle complet 5 × 31 accepté, figure de 8.10
  tracée, aucune erreur MathJax ni console ; vérificateur : 0 erreur.

- **Première fiche 8 : 8.5 supprimé ; fiche 7 : notation e^x
  (02/10/2026).** David : « 1. Supprime la question 8.5 de cette fiche 8
  2. j'ai aussi changé d'avis sur la fiche 7 : je souhaite aussi utiliser
  la notation e^x plutôt que exp(x). Réécris la fiche en conséquence ».
  - **Fiche 8** : 8.5 (« Avec des identités remarquables » : (eᵖˣ+e⁻ᵖˣ)² −
    (eᵖˣ−e⁻ᵖˣ)², toujours 4) retiré, HTML et générateur ; 8.6 à 8.13 →
    8.5 à 8.12 ; la section « Propriétés de l'exponentielle » ne garde que
    8.4. 31 → 30 questions.
  - **Fiche 7** : `expVersPuissance` reprise de la fiche 8 (énoncés,
    options, corrigés) ; rappel sur cosh et sinh écrit avec eˣ et e⁻ˣ,
    \(\cosh\), \(\sinh\) en LaTeX ; règle ajoutée dans les deux fiches :
    « \left(e\right)^3 » (parenthèses du modèle autour d'un e¹) → e³.
  - **7.11** (cosh(2x) en fonction de cosh(x)) : la réponse attendue était
    stockée sous forme développée en exp, et le corrigé affichait
    2((eˣ+e⁻ˣ)/2)² − 1 → réponse « 2*cosh(x)^2-1 », corrigé 2cosh(x)² − 1 ;
    `cosh`/`sinh` ajoutées aux fonctions connues ; l'écriture usuelle
    cosh²(x) est désormais comprise (`normaliserSaisie` : cosh^2(x) →
    cosh(x)^2, idem sinh, cos, sin, tan) ; la forme développée en eˣ reste
    acceptée, cosh(x)² ou 2cosh²(x)+1 refusés.
  - Incident de script corrigé avant tout commit : un `node -e` a
    transformé « \b » en caractère de contrôle, puis un remplacement par
    ligne a emporté la déclaration `let s = …` de `normaliserSaisie`
    (fichier à fins de ligne mélangées) — rétabli, diff contrôlé, fins de
    ligne uniformisées.
  - Vérifié : fiche 8, 30 cartes dans l'ordre, cycle complet 5 × 30 ;
    fiche 7, 1 500 tirages sans « exp », « e⁰ », « e¹ », « ee » ni
    « (e)^ », 400 tirages où les énoncés réécrits sont recalculés
    indépendamment (7.4, 7.5, solutions de 7.6 et 7.8) : 0 écart ; cycle
    complet 9 × 32 ; 0 erreur MathJax sur 20 fiches complètes ; saisies
    usuelles (x(x+2), exp(2x), sin(x)², 3cos(x)) toujours acceptées ;
    vérificateur de syntaxe : 0 erreur ; rendu contrôlé.

- **Première fiche 7 : 7.4 à 7.7 réduits à 3 exemples ; affichage de
  7.7 b) (02/10/2026), 32 → 28 questions.** David : « 1. fiche 7 : de 7.4
  à 7.7 trois exemples à chaque fois suffisent (choisis les bons)
  2. problème d'affichage en 7.7 b) ».
  - Retirés : 7.4 a) (produit numérique le plus simple), 7.5 b) (différence
    de deux carrés toujours égale à 4, déjà supprimée en fiche 8), 7.6 a)
    (eᵖˣ = e^q, la plus simple), 7.7 a) (eᵖˣ > e^q, la plus simple).
    Gardés : 7.4 quotient numérique + deux expressions en x ; 7.5 un
    « Développer » + deux « Factoriser » (forme factorisée exigée sur 7.5 b
    et c) ; 7.6 e^{x²}=e^{cx}, équation produit, A−B·e^{px−r}=C ; 7.7
    e^{x²}<e^{cx}, A−B·e^{px+r}⩾C, e^{ax²}>e^{bx+c}.
  - **7.7 b) tronqué** : « \(e^{x^2}<e^{2x}\) » — inséré en HTML, « <e »
    ouvre une balise et l'énoncé s'affiche brut. Introduit par le passage
    à la notation eˣ (avec « <\exp » le problème n'existait pas). Même
    risque pour « <x » dans les nouvelles inéquations des automatismes des
    fiches 7 et 8. Correction centrale dans les deux fiches : tout « < »
    d'un énoncé devient `\lt`. Piège ajouté à `SUIVI-FIREBASE.md` §7.
  - Vérifié : 15 tirages par fiche, aucun énoncé affiché brut (MathJax
    appliqué partout), aucun `\lt` hors des formules ; cycle complet
    15 × 28 (fiche 7) et 15 × 30 (fiche 8) accepté ; 0 erreur MathJax ;
    vérificateur : 0 erreur ; rendu contrôlé.

- **Première fiche 9 (Dérivation et exponentielle I) — automatismes aux
  nouvelles règles et notation e^x (02/10/2026), 34 questions.** David :
  « applique la règle oui et la notation e^x ».
  - **Automatismes (6)**, remplaçant fractions en n, puissances 2ᵃ3ᵇ et
    radicaux en n (que du calcul littéral) ; mêmes trois calculs, donc pas
    de renumérotation : 9.1 a) inéquation du premier degré avec fractions
    des deux côtés (ax+b)/p ◊ (cx+d)/q, coefficients de signe quelconque,
    b) inéquation produit de trois facteurs affines (x−r) ou (r−x),
    réunion de deux intervalles ; 9.2 a) √(ax+b) = c, b) (a²x²−k²)/(ax∓k)
    = 0 (une des deux racines du numérateur est valeur interdite, seule
    l'autre convient ; 38 énoncés distincts après ajout du coefficient a) ;
    9.3 « Calcul numérique » : a) (a/b)⁻² × (c/d)³ sous forme de fraction
    irréductible (contrôlée), b) √(ms²) × √(mt²) = mst (calcul effectué
    exigé). Ensembles construits par point-test, bornes exactes.
  - **Outils ajoutés** (repris de la fiche 8, absents de cette fiche) :
    contrôle « fraction irréductible » (`estFractionIrreductible`,
    vérification, aide « ? »), clavier des ensembles (touches { } ; ∅) et
    « ∅ » accepté.
  - **Notation e^x** : `expVersPuissance` (énoncés, options, corrigés),
    « < » des énoncés en `\lt` ; rappels « Formule admise » réécrits
    ((e^{ax+b})′ = a·e^{ax+b}, f′(x) = u′(x)·e^{u(x)}).
  - Vérifié : 400 tirages comparés à un calcul indépendant (énoncé relu :
    inéquations au signe sur une grille et de part et d'autre des bornes,
    équations par substitution et valeur interdite contrôlée, calculs
    numériques recalculés), aucun « exp », « e⁰ », « e¹ », « +- », « 1x »
    dans les énoncés et corrigés ; cycle complet 6 × 34 accepté (dérivées
    comprises) ; fraction non simplifiée et calcul non effectué refusés ;
    aucun énoncé affiché brut ; 0 erreur MathJax ; vérificateur : 0
    erreur ; rendu contrôlé.

- **Première fiche 9 : retouches de David (02/10/2026), 34 → 28
  questions, 10 → 9 calculs.** David : « 1. dans 9.4 : le "alpha ∈ R"
  doit s'écrire dans l'énoncé du b) et non dans le titre. 2. de même pour
  le n dans 9.5, uniquement à écrire dans le d) 3. imposer la forme
  factorisée dans les réponses de 9.6 4. Fusionner 9.6 et 9.7 : deux
  exemples de produits, deux de quotients. Imposer une forme factorisée
  pour les produits 5. 9.8 trois exemples uniquement. supprimer l'exemple
  avec alpha 6. 9.9 supprimer le d) ».
  - 9.4 b) « …, où α ∈ ℝ » et 9.5 d) « …, où n ∈ ℕ* » ; retirés des titres.
  - **9.6 « Exponentielles, produits et quotients »** (ancien 9.6 + 9.7) :
    a) x·e^{px}, b) (x²+Ax+B)e^{px} — dérivée **sous forme factorisée
    exigée** (mis en valeur dans le titre ; contrôle `estFactorise` et
    aide « ? » ajoutés, repris de la fiche 8) ; c) 1/(1+e^{px}),
    d) (Aeˣ+B)/(1+e^{px}). Retirés : (eˣ+A)(B−eˣ), √(Dx)e^{√D x},
    C/(De^{px}+Ee^{qx}), (x²−e^{qx})/(e^{px}−x).
  - Tangentes (9.7, ex-9.8) : l'exemple à paramètre α retiré, « Soit
    α ∈ ℝ » retiré du titre ; 3 exemples. Variations (9.8, ex-9.9) : d)
    retiré. Composées (ex-9.10) → 9.9.
  - Vérifié : 300 tirages, chaque dérivée comparée à la dérivée numérique
    de la fonction (calcul indépendant) : 0 écart ; corrigés des produits
    acceptés (y compris facteurs dans l'autre ordre), formes développées
    refusées ; cycle complet 5 × 28 ; 0 erreur MathJax ; vérificateur :
    0 erreur ; rendu contrôlé.

- **Première fiche 10 (Dérivation et exponentielle II) — refonte
  (02/10/2026), 37 → 20 questions, 11 → 8 calculs.** David : « 1. applique
  les règles sur les automatismes et la notation e^x 2. fusionner 10.2,
  10.3 10.4 et 10.6 en prenant 1 exemple pour chacun. En n'oubliant pas de
  préciser de factoriser. 3. supprime 10.5, et 10.7 4. 10.8 deux exemples
  suffisent ».
  - **Automatismes (6)** à la place des six factorisations : 10.1 a)
    inéquation du premier degré à coefficients décimaux (dixièmes, signes
    quelconques), b) quotient à dénominateur carré (ax+b)/(cx+d)² ◊ 0 (la
    valeur interdite est toujours exclue et peut couper la solution en
    deux) ; 10.2 a) équation bicarrée, deux familles ((x²−m²)(x²−n²) :
    quatre solutions ; (x²−m²)(x²+k) : deux), b) |ax+b| = c ; 10.3
    « Calcul numérique » : a) puissances de 10, résultat entier
    (exposants ≠ 0 et 1), b) moyenne pondérée de trois notes, résultat
    entier.
  - **10.4 « Des dérivées »** (fusion de 10.2 sommes, 10.3 produits, 10.4
    quotients, 10.6 exponentielle et racine) : un exemple de chaque, titre
    « lorsque cela est possible, donner la réponse sous forme factorisée
    (pour un quotient, numérateur factorisé) » ; contrôles : forme
    factorisée exigée pour le produit (x²+B)e^{px+q}, numérateur factorisé
    pour Ce^x/(x²+1) et e^{px+q}√x (« Sur ]0;+∞[ » précisé) ; la somme
    n'en a pas.
  - Supprimés : 10.5 (dérivée d'un quotient isolé), 10.7 (nombres
    dérivés). Tangentes (10.5, ex-10.8) : 2 exemples (eᵖˣ⁺ᑫ en 0, x²e^{−x+q}
    en a). Suite renumérotée : variations 10.6, composées 10.7, sommes 10.8.
  - **Notation e^x** (énoncés, corrigés, rappel sur la composée), « < »
    des énoncés en `\lt`, clavier des ensembles et « ∅ » repris de la
    fiche 9.
  - **Défauts préexistants corrigés** (tangentes) : corrigés « y=−3e⁰x+e⁰ »
    (q = 0), ordonnée « 0e^… » (a = 1), pente « 0e^… » (a = 2) — et ces
    corrigés retapés étaient refusés ; tirages exclus.
  - Vérifié : 400 tirages comparés à un calcul indépendant (inéquations au
    signe sur une grille et de part et d'autre des bornes, pôle jamais
    inclus ; équations par substitution et nombre de racines par
    changements de signe ; calculs numériques recalculés ; chaque dérivée
    comparée à la dérivée numérique ; tangentes : pente et ordonnée
    recalculées sur 600 cas) : 0 écart ; 3 000 tirages sans « e⁰ », « e¹ »,
    « \exp », « +- », « ^{1} » ; cycle complet 10 × 20 accepté ; formes
    développées refusées en 10.4 ; 0 erreur MathJax ; vérificateur :
    0 erreur ; rendu contrôlé.

- **Première fiche 10 : 4 automatismes au lieu de 6 (02/10/2026), 20 → 18
  questions.** David : « exceptionnellement, garde seulement 4
  automatismes sur cette fiche car on va ajouter un certain nombre de
  questions ». Gardés : les deux inéquations (coefficients décimaux,
  quotient à dénominateur carré), l'équation bicarrée, les puissances de
  10 ; retirés : |ax+b| = c et la moyenne pondérée. 10.2 et 10.3 n'ont
  plus qu'une question (sans lettre, carte pleine largeur ; titre de 10.2
  au singulier). Exception ponctuelle, volontairement pas inscrite dans `REGLES-FICHES.md` (David : « je le ferai à la demande de manière exceptionnelle mais pas comme une règle »). Vérifié :
  cycle complet 5 × 18, 0 erreur MathJax, vérificateur : 0 erreur, rendu
  contrôlé.

- **Première fiche 10 : dérivée de e^u (02/10/2026), 18 → 24 questions.**
  David : « On va se concentrer aussi dans cette fiche à la dérivée de e^u
  […] Cela dépasse légèrement le programme de première ».
  - **Nouvelle section après 10.4**, « Dérivée de la fonction x ↦ e^{u(x)} » :
    rappel (u'e^u, exemple e^{x²}, cas du produit P(x)e^{u}) puis
    **10.5** (forme factorisée exigée, numérateur pour un quotient) :
    a) e^{trinôme} ; b) e^{k/(x−m)} sur ]m;+∞[ ; c) P de degré 1 et
    d) P de degré 2 fois e^{u}, u tiré parmi kx², k/x (sur ]0;+∞[) et
    px+q, deux types différents pour c) et d). Le rappel « composée » de
    la partie avancée est déplacé dans cette section (plus de doublon).
  - **10.6 tangentes** (ancien 10.5) en e^{u} : a) e^{trinôme} en a ;
    b) e^{k/(x−m)} sur ]m;+∞[ ou ]−∞;m[ en a = m ± 1. Tirages sans
    « e⁰ », sans pente ni ordonnée nulle.
  - **10.7 variations** (ancien 10.6), 3 QCM P(x)e^{u} dont le signe de f'
    s'étudie en Première : a) (ax+b)e^{px+q} (f' affine) ; b) trinôme fois
    e^{±x+q}, construit pour que f' = A(x−r₁)(x−r₂)e^{…} à racines
    entières ; c) (ax+b)e^{±x²}, tiré pour que le discriminant de f' soit
    un carré (racines rationnelles). Propositions : le sens vrai sur un
    intervalle de monotonie, le sens contraire sur un autre, le sens vrai
    prolongé au-delà d'une racine.
  - Anciens 10.7 et 10.8 renumérotés 10.8 et 10.9.
  - Vérifié : 120 tirages comparés à un calcul indépendant (dérivées
    contre la dérivée numérique, énoncé relu et comparé à la fonction
    dérivée ; tangentes recalculées depuis l'énoncé ; chaque proposition
    de QCM testée sur 600 points, exactement une vraie) : 0 écart ; formes
    attendues acceptées par le contrôle de forme factorisée, forme
    développée refusée ; cycle complet accepté, réponses fausses et
    tangente sans « y= » refusées ; 0 erreur MathJax ; vérificateur :
    0 erreur ; rendu contrôlé.

- **Première fiche 10 : rappel réduit, composées retirées, extremum
  (02/10/2026), 24 → 22 questions.** David : « dans le rappel de cours,
  supprime ton exemple, il faut juste la formule générale. 1. 10.8 n'a
  plus d'intérêt. 2. garde 10.9 3. crée un exercice 10.10 concernant la
  recherche d'extremum d'une fonction du type P(x)e^u sur un intervalle
  fermé borné ».
  - Rappel « Dérivée de e^u » : seulement (e^{u})' = u'e^{u} (exemple
    e^{x²} et formule du produit retirés).
  - Ancien 10.8 (dérivées composées e^{kx³}, e^{k√x}, e^{e^{kx²}},
    Cxe^{px+qx³}) supprimé ; la somme (ancien 10.9) devient **10.8**.
  - **Nouveau 10.9** (le « 10.10 » demandé, renuméroté), « Extremum sur un
    intervalle fermé borné », deux questions « Maximum/Minimum de f(x)=…
    sur [α;β] » : a) (ax+b)e^{px+q}, p ∈ {±1, ±2} divisant a pour un point
    critique entier ; b) trinôme × e^{±x+q} construit pour que
    f' = A(x−r₁)(x−r₂)e^{…}, l'intervalle contenant une seule des deux
    racines. Un seul point critique strictement intérieur, donc l'extremum
    demandé (maximum si f' passe de + à −) est atteint en ce point ; valeur
    attendue de la forme k·e^{n}, jamais e⁰.
  - Vérifié : 600 extremums comparés au maximum/minimum numérique sur une
    grille de 4 000 points : 0 écart, jamais atteint au bord ; cycle
    complet accepté, valeur fausse refusée ; 0 erreur MathJax ;
    vérificateur : 0 erreur ; rendu contrôlé.

- **Première fiche 10, 10.9 : nature de l'extremum non donnée, famille
  (ax+b)e^{kx²} (02/10/2026).** David : « ne pas dire ce qu'est l'extremum
  (minimum ou maximum) dans la question. S'autoriser (ax+b)e^(ax^2) ».
  Titre : « Sur l'intervalle indiqué, f admet un extremum en un unique
  point intérieur : en donner la valeur » ; items réduits à « f(x)=… sur
  [α;β] ». Les deux questions tirent deux familles différentes parmi
  trois : (ax+b)e^{px+q}, trinôme × e^{±x+q}, et la nouvelle (ax+b)e^{kx²}
  (k ∈ [−3;3]∖{0}), construite avec une racine entière r de f' imposée
  (a = −2krt, b = (2kr²+1)t, f(r) = t·e^{kr²}), l'autre racine 1/(2kr)
  hors de l'intervalle. Vérifié : 600 questions, exactement un extremum
  local intérieur relevé numériquement et égal au corrigé : 0 écart ;
  familles équilibrées (205/202/193) ; cycle complet accepté, valeur
  fausse refusée ; vérificateur : 0 erreur.

- **Première fiche 11 (Généralités sur les suites) : automatismes aux
  règles, fusions, aide groupée (02/10/2026), 29 → 22 questions.** David :
  « applique, corrige et fusionne ».
  - **Automatismes** (6, nouveau modèle de rotation) : 11.1 inéquations
    (intervalles) a) degré 1 déguisé (x+a)² ◊ (x+b)(x+c), b) produit à
    factoriser ax²+bx ◊ 0 ; 11.2 équations (ensemble) a) x + k/x = m (deux
    solutions entières non nulles), b) a(x−b) = c(x+d) à solution
    fractionnaire ; 11.3 calcul numérique a) une seule puissance
    A^p×A^q/(A^r)^s, forme contrôlée (`formePuissance`, `estUneSeulePuissance` :
    la valeur calculée est refusée), b) somme de trois racines à écrire
    a√b (`formeRacine`, `estRacineSimplifiee` reprise de la fiche 2).
    Retirés : puissances ×3 (dont 11.1 b), consigne « une seule puissance »
    mais réponse −256 et écriture « −1⁶ » ambiguë), mise au même
    dénominateur ×2, carré à développer.
  - **Fusions** (chaque question porte sa propre suite, « u_k si u_n=… »,
    consigne commune dans le titre ; anciens paragraphes d'introduction et
    `paramsAvances` supprimés) : 11.4 termes d'une suite explicite (anciens
    11.4 + 11.5 ; quatre familles : polynôme, quotient, A×qⁿ, √(an+b)) ;
    11.5 expressions en fonction de n (anciens 11.6 + 11.7 + 11.8 : u_{n+1},
    u_n+1, u_{2n+1} d'un trinôme, u_{2n+1} de C(−1)ⁿ/(n+q)) ; 11.6 termes
    d'une suite récurrente (anciens 11.9 + 11.10 + 11.11, un exemple par
    famille ; la suite à racine généralisée en u_n = c + dn) ; 11.7
    récurrence avec paramètre a (anciens 11.12 + 11.13, un exemple chacun,
    u_{n+1} = aⁿu_n ou a^{n+1}u_n). Avancés : 11.8 (ancien 11.14, « pour
    tout n ∈ ℕ » corrigé en « n ⩾ 1 » puisque u_1 est donné, u_1 = 1/k
    avec k ≤ 9) et 11.9 (ancien 11.15, titre complété, énoncés réduits à
    « u_n=… »). Section « récurrence avec paramètre » fondue dans
    « Suites définies par récurrence ».
  - **Bouton « ? » groupé** posé (dernière fiche qui ne l'avait pas) :
    `texteAideGroupe`/`injecterAideGroupe` repris de la fiche 10, ancienne
    `construireGrilles` morte supprimée. Clavier des ensembles { } ; ∅ et
    saisie de ∅ ; clavier et aide des intervalles en symboles ∪, ℝ, ∅.
  - **Défaut corrigé dans `estRacineSimplifiee`** (copie de la fiche 11) :
    « −9√2 » était refusé (math.js lit (−9)·√2) ; le signe du coefficient
    est désormais retiré comme un moins unaire. La fiche 2 a le même défaut
    (non corrigé ici).
  - Corrigé de 11.3 a) affiché en puissance (2⁻², pas 1/4).
  - Vérifié : 400 tirages recalculés depuis l'énoncé affiché (inéquations
    sur une grille et aux bornes, équations par substitution et nombre de
    racines, termes et expressions par substitution, récurrences itérées
    avec a numérique, unicité de n en 11.9) : 0 écart ; variété mesurée sur
    300 tirages (≥ 28 énoncés distincts par question, 9 pour 11.8) ; cycle
    complet 5 × 22 accepté ; valeur au lieu de la puissance, racine non
    simplifiée et ensemble incomplet refusés ; 0 erreur MathJax (fiche et
    panneau des réponses) ; vérificateur : 0 erreur ; rendu contrôlé.

- **Première fiche 2 : racine simplifiée à coefficient négatif en tête
  (02/10/2026).** Même défaut que celui corrigé dans la fiche 11 :
  `estRacineSimplifiee` refusait « −9√2 », « −3√2 » saisi dans MathLive,
  car math.js lit (−9)·√2 (nœud `*` dont le premier argument est un moins
  unaire, ni reconnu par `terme()` ni retiré par `aplatir()`). Correctif
  identique à la fiche 11 (3 lignes dans `aplatir`). Seules les fiches 2
  et 11 contiennent cette fonction : la fiche 11 était déjà corrigée.
  - Effet constaté : les réponses attendues de 2.5 a)–d) sont toutes
    écrites constante en tête (« (3-2√3)/2 »), donc aucune n'était refusée ;
    le défaut touchait l'élève qui écrit le terme en racine d'abord :
    « (−2√3+3)/2 » était refusé à tort.
  - Vérifié (fiche ouverte en `file://`, le port 8791 étant occupé par le
    serveur d'un autre dossier) : « −9sqrt(2) », « −3*sqrt(5) »,
    « 2−3sqrt(7) », « −3sqrt(2)/2 », saisie MathLive « −3\sqrt{2} »
    acceptés ; « −sqrt(8) », « −2sqrt(18) », « −1sqrt(2) », « −0sqrt(2) »,
    « −9*sqrt(4) » et « −3sqrt(2)−3sqrt(2) » refusés. 500 tirages : les
    4000 racines attendues de 2.5 passent (0 refus, avant comme après) ;
    les 3000 variantes permutées (racine en tête) passent toutes, contre
    2406 avant le correctif (594 refusées, toutes à coefficient négatif en
    tête). Dans le vrai champ de 2.5 a) : « {(−2√3+3)/2;(2√3+3)/2} » et
    « {3/2−√3;3/2+√3} » acceptés, « √12 » refusé. Vérificateur : 0 erreur.

- **Claviers d'intervalles en symboles ∪, ℝ, ∅ (Première, 02/10/2026).**
  David : « oui fais le » (application de la règle « réunion ∪ et ensemble
  vide ∅ en symboles, jamais « ou » / « vide », dans l'aide, les boutons du
  clavier et les exemples »). Sur les 22 fiches de Première qui avaient
  encore l'ancien clavier maison des intervalles (1, 5 à 10, 12 à 26) :
  boutons « ou », « R », « vide » remplacés par « ∪ », « ℝ », « ∅ » ;
  astuce du clavier « ]-∞;1[ ∪ ]3/2;+∞[ » ; texte de l'aide « ? » des
  intervalles passé aux symboles sur les 17 fiches qui ne l'avaient pas
  (fiche 11 : astuce seule, le reste était déjà fait). La saisie lisait
  déjà ∪, ℝ et ∅ partout (`parseReponseIntervalle` identique), et l'ancienne
  écriture tapée reste tolérée. Les fiches de Seconde utilisaient déjà les
  symboles. Vérifié : 30 tirages de la fiche 10, réponses construites avec le
  bouton ∪ toutes acceptées ; boutons ℝ et ∅ insèrent le symbole, reconnu
  pour ℝ et ∅, refusé à contre-emploi ; vérificateur : 0 erreur.

- **Première fiche 11 : énoncés 11.4 à 11.7 aérés (02/10/2026).** David :
  « mieux gérer l'espacement dans les énoncés 11.4 à 11.7, c'est un peu
  serré ». « u_3 si u_0=… et u_{n+1}=… » est désormais une seule formule où
  « si » et « et » sont entourés d'espaces \quad (passe finale du
  générateur, ids 11.4 à 11.7). Vérifié : 200 tirages, plus aucun « si »/« et »
  hors formule ; 0 erreur MathJax ; aucune carte ne déborde ; rendu contrôlé.
  Retouche le même jour (David : « un peu moins quand même ») : \quad
  remplacé par un double espace épais \;\; autour de « si » et « et ».

- **Première fiche 12 (Suites arithmétiques) : automatismes aux règles,
  12.11 corrigé, fusions (02/10/2026), 27 → 23 questions.** David : « fais
  le » (même démarche que la fiche 11).
  - **Automatismes** (6, nouveau modèle) : 12.1 inéquations a) encadrement
    c ◊ ax+b ◊ d (a de signe quelconque), b) quotient (x²−m²)/(x−p) ◊ 0
    (valeur interdite jamais incluse ni franchie) ; 12.2 équations a)
    x(x+p) = q (deux solutions entières), b) (ax+b)² = (cx+d)² (deux
    solutions) ; 12.3 calcul numérique en fraction irréductible a) a/b −
    c/d × e/f (priorités), b) image d'une fraction par un trinôme, f(p/q).
    Clavier des ensembles repris de la fiche 10.
  - **12.11 corrigé** : « uₙ = (3+5an)/2, déterminer a » n'avait aucune
    condition (réponse 4/5 attendue, sous-entendu « de raison 2 », défaut
    présent depuis la première version) et était figé ; devient 12.6 c),
    aléatoire, « a si uₙ = (p+qan)/s et r = R ».
  - **Fusions**, énoncés autonomes aérés « u_N si r=… et u_K=… » (comme
    11.4 à 11.7) : 12.4 termes (anciens 12.4, 12.5, 12.6 : u_N depuis u₀,
    depuis u₁, u₀ depuis u_K, u_N depuis u_K ; premier terme jamais nul) ;
    12.5 raison et premier terme à partir de deux termes (anciens 12.7,
    12.8 : r et u₀, termes entiers puis fractionnaires) ; 12.6 paramètre a
    (anciens 12.9, 12.10, 12.11 ; « u₁ en fonction de a », toujours égal à
    a, retiré ; 12.6 b élargi : (Ca²+K(n−1))/a).
  - Problèmes à étapes gardés entiers : 12.7 suite auxiliaire vₙ = uₙ²
    (plages élargies), 12.8 homographique (avancé ; « 1uₙ » et « 0uₙ »
    corrigés dans l'énoncé), 12.9 suite définie par une condition (avancé ;
    généralisé à u_k = T, k ∈ {4,5,6}, r = (2k−4)T/((k−1)(k−3)), seule
    raison non nulle). Titres donnés à tous les calculs ; sections
    renommées « Termes et raison d'une suite arithmétique » et « Paramètre
    et suite auxiliaire ».
  - Vérifié : 400 tirages recalculés indépendamment (inéquations sur une
    grille et aux bornes, valeur interdite comprise ; équations par
    substitution et nombre de racines ; fractions ; termes et raisons depuis
    l'énoncé affiché ; paramètre a par substitution numérique ; suites
    auxiliaires par itération ; 12.9 condition vérifiée) : 0 écart ;
    variété ≥ 70 énoncés par question (problèmes à étapes : 54/165/36
    introductions) ; cycle complet 5 × 23 accepté ; fraction non réduite,
    décimal et ensemble incomplet refusés ; 0 erreur MathJax (fiche et
    panneau) ; vérificateur : 0 erreur ; rendu contrôlé.

- **Première fiche 12 : 12.4 et 12.5 fusionnés, 6 exemples (02/10/2026),
  23 → 21 questions.** David : « fusionner 12.4 et 12.5 en gardant 6
  exemples en tout » (exception au plafond de 4, décidée par David pour
  cette fiche, non inscrite dans les règles). Nouveau 12.4 « Termes, raison
  et premier terme » : a) u_N depuis u₀, b) u_N depuis u₁, c) u_N depuis
  u_K, d) r depuis deux termes entiers, e) u₀ depuis deux termes entiers,
  f) u₀ depuis deux termes fractionnaires. Retirés : « u₀ depuis u_K et r »
  (même calcul que c, à rebours) et « r depuis deux termes fractionnaires »
  (contenu dans f). Anciens 12.6 à 12.9 renumérotés 12.5 à 12.8 (ids,
  textes d'introduction, grilles). Vérifié : 400 tirages recalculés
  indépendamment : 0 écart ; cycle complet 4 × 21 accepté ; 0 erreur
  MathJax ; vérificateur : 0 erreur ; rendu contrôlé.

- **Première fiche 12 : nouveau 12.5, sommes de termes consécutifs
  (02/10/2026), 21 → 23 questions.** David : « il manque dans le cœur de la
  fiche deux exemples sur la somme des termes d'une suite arithmétique ».
  12.5 « Sommes de termes consécutifs » : a) u₀+u₁+⋯+u_N avec r et u₀
  donnés (N de 10 à 30) ; b) somme numérique f+(f+r)+(f+2r)+⋯+dernier,
  termes tous positifs, raison positive ou négative, de 8 à 25 termes
  (compter les termes est la difficulté). Anciens 12.5 à 12.8 renumérotés
  12.6 à 12.9. Vérifié : 2 000 tirages comparés à la somme calculée terme à
  terme : 0 écart ; 300 tirages du reste de la fiche : 0 écart ; cycle
  complet 4 × 23 accepté ; 0 erreur MathJax ; vérificateur : 0 erreur ;
  rendu contrôlé.
  Retouche le même jour (David : « enlever le a) dans le titre et le
  mettre dans l'énoncé du a) ») : titre réduit à « Sommes de termes
  consécutifs. Calculer les sommes suivantes. » ; le a) devient
  « u₀+u₁+⋯+u_N, où (uₙ) est arithmétique de raison r et de premier terme
  u₀=… ». Vérifié : 1 000 tirages, 0 écart.

- **Première fiche 13 (Suites géométriques) : automatismes aux règles,
  13.8 corrigé, fusions (02/10/2026), 28 → 23 questions.** David : « oui »
  (même démarche que les fiches 11 et 12).
  - **Automatismes** (6, nouveau modèle) : 13.1 inéquations a) x/a − x/b
    ◊ c (signe du coefficient selon a et b, borne calculée exactement),
    b) produit à facteur commun (ax+b)(cx+d) ◊ (ax+b)(ex+f) ; 13.2
    équations a) degré 3 à factoriser x³ = m²x ou ax³+bx² = 0, b) second
    degré à racines rationnelles ; 13.3 calcul numérique en entier ou
    fraction irréductible (`estFractionIrreductible` reprise de la fiche
    12) a) (Aᵖ ± Aᵖ⁺¹)/Aᵖ⁻¹, b) (1−rⁿ)/(1−r) avec r = ±p/k. Retirés :
    développements, factorisations (dont le corrigé non simplifié
    « (6−5x−6)(6−5x+6) » de 13.2 a), image, antécédent ;
    `FORMES_FACTORISEES` vidé.
  - **13.8 corrigé** : « u_K1 = √D, u_K2 = B√D, déterminer la raison »
    tirait aussi des écarts pairs (q⁴ = 16 : deux raisons, une seule
    acceptée) ; devient 13.5 a) avec un écart 3 (raison unique).
  - **Fusions**, énoncés aérés « … si q=… et u_K=… » : 13.4 termes
    (anciens 13.5, 13.6, 13.7 : u_N depuis u₀, u_N depuis u_K à raison
    fractionnaire, uₙ en fonction de n, raison √D avec u₀ = ±k/√D) ;
    13.5 raison et premier terme, réponse en ensemble des raisons
    possibles (anciens 13.8, 13.9, 13.11 : écart impair, écart pair →
    {−m;m}, raison σm√D ; u₀ pour un indice pair, identique pour les deux
    raisons). Problèmes à étapes gardés entiers : 13.6 trois termes
    consécutifs (ancien 13.10), 13.7 suite auxiliaire (ancien 13.12),
    avancés 13.8 maximum (ancien 13.13) et 13.9 somme (ancien 13.14,
    « Combien vaut 2⁹ ? » retiré, raison 2 ou 3). Titres donnés à tous les
    calculs ; sections « Termes et raison d'une suite géométrique »,
    « Reconnaître une suite géométrique ».
  - **Corrigés** : 13.6 b) affiché a × (1/|q|)ᴷ (`correctionLatex`, au
    lieu d'une grande fraction, et plus de « (4)⁴ ») ; 13.8 a) « −8q²/5 »
    au lieu de « −8/5 × q² » ; saisie « √2 » sans parenthèses acceptée
    (`normaliserSaisie`).
  - Vérifié : 500 tirages recalculés indépendamment (inéquations sur une
    grille et aux bornes, équations par substitution et nombre de racines,
    calculs évalués, termes et raisons depuis l'énoncé affiché avec
    ensemble complet des raisons réelles, problèmes à étapes par
    itération, maximum par comparaison) : 0 écart ; variété ≥ 42 énoncés
    par question ; cycle complet 8 × 23 accepté (corrigés affichés
    retapés) ; fraction non réduite, calcul non effectué et ensemble
    incomplet refusés ; 0 erreur MathJax ; vérificateur : 0 erreur ;
    rendu contrôlé.

- **Première fiche 13 : 13.4 et 13.5 fusionnés, 6 exemples (02/10/2026),
  23 → 21 questions.** David : « de la même manière que la fiche
  précédente, fusionner 13.4 et 13.5 en six exemples » (exception au
  plafond de 4, décidée par David, non inscrite dans les règles). Nouveau
  13.4 « Termes, raison et premier terme » : a) u_N depuis u₀, b) u_N
  depuis u_K (raison fractionnaire), c) uₙ en fonction de n, d) q pour un
  écart impair ({q}), e) q pour un écart pair ({−m;m}), f) u₀ (identique
  pour les deux raisons). Retirés : raison √D avec u₀ = ±k/√D et raison
  irrationnelle σm√D (les deux exemples les plus techniques). Anciens
  13.6 à 13.9 renumérotés 13.5 à 13.8. Vérifié : 400 tirages recalculés
  indépendamment : 0 écart ; cycle complet 5 × 21 accepté ; 0 erreur
  MathJax ; vérificateur : 0 erreur ; rendu contrôlé.

- **Première fiche 13 : suites arithmético-géométriques, sommes, 13.6
  passé en avancé (02/10/2026), 21 → 28 questions.** David : « avant 13.6
  (qui est presque général), proposer deux exercices sur des suites
  arithmético-géométriques […] Trois étapes, déterminer la raison de vₙ,
  exprimer vₙ en fonction de n, en déduire uₙ […] après 13.6 actuelle :
  deux exemples de somme des termes d'une suite géométrique ; supprimer
  13.8 mais mettre le 13.6 actuelle en calculs avancés ».
  - **13.6 et 13.7** (nouvelle section « Suites arithmético-géométriques ») :
    u₀ = A, u_{n+1} = a·uₙ + b, vₙ = uₙ − ℓ donnée (ℓ = b/(1−a) entier),
    a) raison de (vₙ), b) vₙ, c) uₙ ; a entier (±2, ±3) en 13.6,
    fractionnaire (p/q, |p| < q) en 13.7. Corrigés écrits directement
    (`correctionLatex`, « −8(−2/3)ⁿ » évité).
  - **13.8** (section « Somme de termes d'une suite géométrique ») : a)
    u₀+⋯+u_N avec q et u₀ donnés, b) somme numérique f + fr + fr² + ⋯
    (compter les termes, raison ±2 ou ±3).
  - Ancien 13.6 (suite auxiliaire, x à déterminer) → **13.9** en calculs
    avancés ; ancien 13.7 (maximum) → **13.10** ; ancien 13.8 (somme et
    premier terme, avancé) supprimé. Les sommes étant du cœur de fiche,
    elles sont placées en fin de cœur, juste avant les calculs avancés.
  - Vérifié : 1 000 tirages des nouveaux calculs (suites itérées, vₙ
    géométrique vérifiée, sommes terme à terme) et 300 tirages du reste :
    0 écart ; cycle complet 6 × 28 accepté (corrigés affichés retapés) ;
    0 erreur MathJax ; vérificateur : 0 erreur ; rendu contrôlé.

- **Les 50 fiches : « Recommencer » efface aussi la couleur des statuts
  (02/10/2026).** `reinitialiser()` vidait le texte de chaque
  `statut-idx` sans remettre sa classe à `'q-statut'` : les classes
  `ok` / `ko` restaient, et une pastille vide vert clair ou rouge clair
  subsistait à côté des champs déjà corrigés (surtout visible sur les
  champs texte : ensembles, intervalles). `reinitialiserStatut(idx)` le
  faisait déjà correctement. Ajout, juste après la ligne qui vide
  `textContent`, de `document.getElementById('statut-' + idx).className =
  'q-statut';`. Le corps de `reinitialiser()` varie selon les fiches
  (8 variantes : widgets tableau de signes / de variations / croisé /
  programme / schéma d'évolution, `boiteRacineOuverte`…), mais la ligne
  visée est partout dans le `forEach`, avant tout `return` anticipé :
  insertion faite par script Node (CRLF conservé), 50 fiches, une ligne
  chacune. Vérifié : vérificateur 0 erreur ; dans le navigateur (Première
  13 et 22, Seconde 25), réponses saisies (justes et fausses),
  `verifierUne` sur chaque question puis `reinitialiser()` : 21, 39 et
  35 statuts `ok`/`ko` avant, 0 après, aucune erreur console.

- **Backlog « Chantiers futurs » passé en artefact (02/10/2026).** David :
  « je voulais en faire un artefact, pas un .md », puis « supprime le
  .md ». Contenu repris dans l'artefact claude.ai « Chantiers futurs »
  (https://claude.ai/artifact/D4BQtmML6BK5AtuAHRpbad, lisible sur les
  deux PC avec le même compte) ; `CHANTIERS-FUTURS.md` supprimé ; renvois
  de `CLAUDE.md` et `SUIVI-FIREBASE.md` (§6) mis à jour.

- **Première fiche 14 (Calcul de sommes I) : automatismes aux règles
  (03/10/2026), 30 questions inchangées.** David : « oui les
  automatismes » (même démarche que les fiches 10 à 13 ; seul le bloc
  « Quelques automatismes » est touché, la suite de la fiche n'a pas
  encore été relue).
  - **Automatismes** (6, nouveau modèle de rotation) : 14.1 inéquations
    (intervalles) a) degré 1 avec parenthèses a + b(x − c) ◊ dx + e
    (coefficients de signe quelconque, le coefficient de x change de signe
    selon b − d), b) produit avec un carré (x − a)²(bx + c) ◊ 0 (la racine
    double ne change pas le signe : en strict, le point a est exclu et la
    réponse est une réunion ; tirages à solution isolée exclus) ; 14.2
    équations (ensemble) a) √(x + k) = x − m, une seule solution (l'autre
    racine du carré est parasite), b) (x + p)/(x + q) = x − r, deux
    solutions entières (la valeur interdite −q n'en est jamais une) ;
    14.3 calcul numérique en entier ou fraction irréductible a) somme de
    3 à 6 fractions 1/(k(k + s)) (s = 1 ou 2, qui se télescopent), b)
    |p − √n| + |q − √n| avec p < √n < q, résultat entier q − p. Retirés :
    simplifications en a√b, quantité conjuguée (sans contrôle de la forme
    de la réponse), fractions à paramètre m.
  - **Outils repris de la fiche 13** (la fiche 14 ne les avait pas) :
    `estFractionIrreductible` et l'option `fractionIrreductible` (contrôle
    de la forme, aide « ? » dédiée), clavier des ensembles { } ; (groupe
    `groupeEnsembleClavier`) sur les champs à réponse en ensemble.
  - Vérifié : 600 tirages recalculés indépendamment (inéquations sur une
    grille au huitième près et aux bornes, équations par substitution sur
    les entiers de −100 à 100, sommes et valeurs absolues évaluées depuis
    l'énoncé affiché, fractions irréductibles) : 0 écart ; variété
    (énoncés distincts sur 600 tirages) 600 / 557 / 75 / 305 / 48 / 484 ;
    cycle complet 12 × 6 = 72 corrigés retapés, tous acceptés ; refusés :
    fraction non réduite (14/180), décimal, ensemble incomplet, solution
    parasite ajoutée à 14.2 a) ; panneau « Voir toutes les réponses » : 30
    lignes, 0 erreur MathJax ; vérificateur : 0 erreur ; rendu contrôlé.
    Contrôle fait dans un conteneur sans accès aux CDN (MathJax, MathLive
    et math.js servis en local) : seules les polices MathLive manquaient.

- **Premières fiches 15 (Calcul de sommes II) et 16 (Calcul de produits) :
  automatismes aux règles (03/10/2026).** David : « travaille les fiches 15
  et 16 de la même manière que 14 » (seul le bloc « Quelques automatismes »
  est refait ; le reste des fiches n'a pas été relu).
  - **Un troisième calcul d'automatismes** : ces deux fiches n'en avaient que
    deux (5 et 6 questions) ; elles passent à 15.1 inéquations, 15.2
    équations, 15.3 calcul numérique (6 questions, comme les fiches 10 à 14).
    Les calculs suivants sont **renumérotés** (+1) : fiche 15, 15.3-15.13 →
    15.4-15.14 ; fiche 16, 16.3-16.12 → 16.4-16.13 (titres, ids de
    questions, `grille-N-…`, `texte-N-…`, `groupes`). Fiche 15 : 5 → 6
    questions d'automatismes, donc 34 → 35 questions et tous les indices
    suivants décalés de 1 dans `groupes` ; fiche 16 : 31 questions, indices
    inchangés. Les brouillons déjà enregistrés sur ces deux fiches ne
    correspondent plus aux nouveaux ids (ils sont écartés au chargement).
  - **Fiche 15** : 15.1 a) premier degré déguisé (x + a)² − (x + b)² ◊ c
    (différence de deux carrés), b) quotients a/(x − b) ◊ c/(x − d) (deux
    valeurs interdites, jamais incluses ni traversées) ; 15.2 a) valeur
    absolue |ax + b| = cx + d (une solution est parfois rejetée), b)
    (x + a)/(x + b) = (x + c)/(x + d) (le terme en x² disparaît, une
    solution fractionnaire ; valeur interdite jamais solution) ; 15.3 a)
    puissances à exposant négatif A⁻ᵐ ± B⁻ⁿ, b) quotient de décimaux
    (p × q)/r (un chiffre après la virgule).
  - **Fiche 16** : 16.1 a) premier degré déguisé (x + a)(x − b) ◊
    (x − c)(x + d), b) quotient à dénominateur produit (ax + b)/((x − c)(x − d))
    ◊ 0 ; 16.2 a) degré 3 par regroupement x³ − ax² − k²x + ak² = 0
    (trois solutions), b) |ax + b| = |cx + d| (expressions non
    proportionnelles) ; 16.3 a) produit de facteurs 1 ± 1/k (3 à 5 facteurs,
    il se télescope), b) (c√n + p)² + (c√n − p)² = 2c²n + 2p² (entier).
    Retirés : calculs de puissances / fraction / racine (16.1) et carrés à
    développer (16.2) pour la fiche 16 ; développements et fractions à
    paramètre x pour la fiche 15.
  - **Outils repris de la fiche 14** (absents de 15 et 16) :
    `estFractionIrreductible` + option `fractionIrreductible` (contrôle de
    la forme, aide « ? »), clavier des ensembles { } ; (groupe
    `groupeEnsembleClavier`). Fiche 16 : `aleaNonNul`, `fracToStr` et
    `fmtLin` recopiés (la fiche ne les avait pas).
  - Vérifié (fiches 15 et 16) : 600 tirages recalculés indépendamment par
    fiche (inéquations sur une grille au huitième près, sur les rationnels
    de dénominateur ≤ 7 et autour des bornes à 1e-6, valeurs interdites
    exclues ; équations par recherche exhaustive des rationnels de
    dénominateur ≤ 7 sur [−80 ; 80] ; calculs évalués depuis l'énoncé
    affiché ; fractions irréductibles) : 0 écart ; variété (énoncés
    distincts sur 600 tirages) 583 / 596 / 569 / 588 / 237 / 564 (fiche 15)
    et 597 / 595 / 48 / 575 / 42 / 438 (fiche 16) ; ids, lettres, groupes
    et titres de toutes les questions contrôlés (aucune incohérence) ;
    cycle complet 12 × 6 = 72 corrigés retapés par fiche, tous acceptés ;
    refusés : fraction non réduite, décimal, mauvais entier, ensemble avec
    une valeur fausse ; panneau « Voir toutes les réponses » : 35 et 31
    lignes, 0 erreur MathJax ; vérificateur : 0 erreur ; rendu contrôlé.

- **Les 50 fiches : icône ⌨ forcée en glyphe de texte (03/10/2026).** David :
  sur tablette, l'icône du clavier à côté des champs ne convient pas, le
  clavier lui-même fonctionne ; il veut la même icône que sur téléphone et
  ordinateur (une image SVG tentée dans une session précédente ne lui
  convenait pas — aucun SVG de ce genre n'est dans le dépôt, ni dans son
  historique). Cause probable : le bouton `.q-clavier-btn` affiche le
  caractère Unicode U+2328 (`&#9000;`), que les polices d'iPadOS peuvent
  dessiner en emoji coloré. Correctif minimal, sans image : `&#9000;`
  devient `&#9000;&#xFE0E;` (sélecteur de variante « présentation texte »,
  128 occurrences dans les 50 fiches) et la règle `.q-clavier-btn` reçoit
  `font-variant-emoji: text`. Vérifié : 50 règles CSS posées, caractère et
  propriété relus dans le navigateur (iPad simulé), vérificateur : 0 erreur.
  **Non vérifié sur une vraie tablette** (Chromium sous Linux dessine ce
  caractère avec sa police emoji dans tous les cas) : si l'icône est encore
  différente sur la tablette de David, repli prévu = SVG calqué sur
  l'icône du bureau, à partir d'une capture des deux icônes.

- **Les 50 fiches : icône ⌨ plus grande sur tablette (03/10/2026).** David :
  après le passage en présentation texte (entrée précédente), l'icône est la
  même que sur les autres appareils mais « de taille bien trop petite dans le
  cadre » sur tablette (les polices d'iPadOS dessinent le glyphe plus petit).
  Ajout, après la règle `.q-clavier-btn:hover` des 50 fiches, d'une requête
  `@media (pointer: coarse) and (min-width: 700px) and (min-height: 600px)`
  qui met `.q-clavier-btn` à `font-size: 28px; line-height: 1; padding: 0`
  (17 px ailleurs) : cible les tablettes tactiles en portrait comme en
  paysage, pas les téléphones (moins de 700 px de large, ou moins de 600 px de
  haut en paysage) ni les ordinateurs. Vérifié dans Chromium (appareils
  simulés) : 28 px sur iPad portrait et paysage, 17 px sur iPhone portrait et
  paysage et sur ordinateur, bouton toujours de 40 × 40 px, vérificateur :
  0 erreur. **La valeur 28 px est une estimation, non vérifiée sur une vraie
  tablette** : à ajuster (une seule valeur dans la requête, à reporter dans les
  50 fiches) selon le retour de David.

- **Les 50 fiches : icône ⌨ centrée et presque aussi grande que le cadre sur
  tablette (03/10/2026).** David : après le passage à 28 px, « reste à la
  centrer correctement et encore plus grande (presque aussi grande que le
  cadre qui l'entoure) ». La requête tablette de `.q-clavier-btn`
  (`pointer: coarse`, au moins 700 × 600 px) passe de `font-size: 28px` à
  `font-size: 36px` et le bouton devient `display: inline-flex;
  align-items: center; justify-content: center` (avec `line-height: 1` et
  `padding: 0`, déjà en place) : le glyphe est centré par le conteneur au
  lieu de dépendre de la ligne de texte. Mesuré sur capture (Chromium, iPad
  simulé, ×2) : dessin de 32 px de large dans le cadre de 40 × 40 px, centre
  décalé de moins de 0,5 px (x et y) ; iPhone et ordinateur inchangés
  (17 px, `display` normal). Vérificateur : 0 erreur. **Mesure faite avec la
  police emoji de Chromium sous Linux, pas celle d'iPadOS** : la taille et le
  centrage réels sur la tablette de David sont à confirmer (valeur 36 px
  unique, répétée dans les 50 fiches ; un éventuel décalage vertical se
  corrigerait par un `padding-top` / `padding-bottom` sur ce bouton).

- **Guide de l'élève en PDF (03/10/2026).** David : « un pdf, clair,
  esthétique, coloré (mêmes teintes et couleurs que le site), moderne que je
  distribuerai aux élèves comme tutoriel d'utilisation des fiches et
  automatismes », trois parties (fiches de calcul en autonomie, automatismes,
  devoirs), boutons de bas de page, claviers, raccourcis, et pour les devoirs
  la validation et l'enregistrement. Puis, après une première version :
  « épreuve anticipée de Première » partout, niveau Terminale ajouté,
  couverture sur fond clair et sommaire cliquable, bouton de connexion
  visible sur la capture de l'accueil, explication des pictogrammes (bateaux :
  calculs généraux ; horloges : partie principale ; roues crantées : calculs
  plus avancés ; nombre de pictogrammes foncés = temps à prévoir). Version
  retenue « pour le moment ».
  - **Fichiers** : `assets/docs/guide-eleve.pdf` (11 pages A4, 2,3 Mo,
    polices incorporées, 13 liens internes sur la couverture) ;
    `outils/guide-eleve/` : `guide-eleve.html` (source, une `div.page` par
    page), `img/` (14 captures réelles), `polices/` (Inter, Source Serif 4,
    OFL), `captures.js`, `pdf.js`, `README.md`. Pas encore lié depuis le
    site (emplacement à décider par David).
  - **Contenu vérifié dans le code** : libellés des boutons, comportement
    d'Entrée selon le mode, Recommencer / Générer / Corrigé des erreurs / Voir
    toutes les réponses, claviers (simplifié, MathLive), automatismes
    (niveaux, modes, chrono, reprise), devoirs (Enregistrer, Valider avec
    confirmation, tentatives, meilleure note, échéance, Mes devoirs).
  - **Captures** : site servi en local, MathJax / MathLive / math.js /
    Firebase servis depuis npm (CDN inaccessibles depuis le conteneur cloud).
    Mode devoir simulé localement (état élève connecté + devoir fictif
    « Sommes — fiche 14 »), aucune connexion réelle ; « Mes devoirs » et le
    bloc « Devoirs » sont des maquettes HTML signalées comme illustrations.
  - **Deux incohérences du site relevées, non corrigées** : en mode « Tout à
    la fin », le texte renvoie à un bouton « Vérifier mes réponses » qui
    s'appelle « Corrigé des erreurs » (le guide utilise le vrai libellé) ; la
    page Automatismes annonce un sujet blanc « noté sur 6 », la page du sujet
    blanc « sur 5 points » (le guide ne donne pas de barème).

- **Accueil : carte « Guide de l'élève » (03/10/2026).** David, parmi les
  emplacements proposés (pied de page, carte sur l'accueil, icône dans
  l'en-tête, liens contextuels) : une carte comme celles de l'accueil, « après
  tous ceux existants ». Nouvelle section « Guide de l'élève » en fin de
  `index.html`, après Automatismes : une carte `bento-carte--large2` (style
  par défaut, aucune règle CSS ajoutée), étiquette « PDF · 11 pages », titre
  « Mode d'emploi du site », lien `assets/docs/guide-eleve.pdf` ouvert dans un
  nouvel onglet (`target="_blank" rel="noopener"`). Vérifié : rendu ordinateur
  et téléphone, PDF servi en `application/pdf`.

- **Mesure de fréquentation anonyme et tableau de bord « Fréquentation »
  (03/10/2026).** David : statistiques de visites de quiconque (connecté ou
  non), tableau de bord maison plutôt qu'un service extérieur ; validé :
  totaux + parties du site + appareils + fiches les plus ouvertes, pas de
  distinction lycée/maison, mention dans le pied de page, ses visites exclues.
  - **Comptage** (`assets/js/statistiques.js`, ajouté aux 76 pages publiques,
    pas au tableau de bord) : une écriture Firestore par page vue, `setDoc`
    fusionné avec `increment(1)` dans `statistiques/{jour}_{0-4}` (fragment
    tiré au hasard : une classe entière ne sature pas un document). Champs :
    `pv`, `visites` (plus de 30 min sans activité), `visiteurs` (premier
    passage du jour du navigateur), `s_<partie>`, `a_<appareil>` (par visite),
    `pages.<clé>` + `derniere`. Aucune donnée personnelle : le navigateur ne
    garde que la date de son dernier passage et l'heure de sa dernière
    activité (localStorage). Exclus : compte admin (et le navigateur, marqué
    `stats-exclu`, même déconnecté ensuite), localhost / file:, navigateurs
    pilotés (`navigator.webdriver`). Sans stockage local : pages vues seules.
    Réseau du lycée : un élève = sa session Windows = son navigateur, compté à
    part (l'identifiant réseau du lycée n'est jamais visible du site).
  - **Règles** (`firestore.rules`, `match /statistiques/{jour}`) : création
    et mise à jour par tout visiteur, uniquement +1 sur des clés connues
    (pv +1 exactement, la seule page `derniere` +1, les autres compteurs
    inchangés ou +1), identifiant `AAAA-MM-JJ_0..4` ; lecture et suppression
    admin. Testées dans l'émulateur : 29 cas (dont 15 tentatives de triche
    refusées et 3 règles existantes en non-régression) — test conservé dans
    `outils/verification/regles-firestore/`. **À publier dans la Console.**
  - **Tableau de bord** : `tableau-de-bord/frequentation.html` +
    `assets/js/frequentation.js` (styles `.fr-*` dans
    `tableau-de-bord.css`) : périodes 7 j / 30 j / depuis la rentrée / tout,
    tuiles (visiteurs, visites, pages vues, aujourd'hui), barres jour par jour
    (par semaine au-delà de 62 jours), une seule mesure à la fois au choix,
    bulle au survol ou au toucher, tableau des chiffres ; parties du site et
    appareils en barres horizontales ; 15 fiches les plus ouvertes (noms via
    `manifeste-fiches.js`). Volets « Devoirs / Fréquentation » ajoutés en tête
    des deux pages (classes `.tdb-nav-*` existantes).
  - Vérifié de bout en bout contre les émulateurs Firestore + Auth (site
    servi sous un nom de domaine fictif) : ordinateur anonyme 5 pages (pv,
    visites, visiteurs, parties, pages exacts), nouvelle visite après 30 min
    sans nouveau visiteur, téléphone et tablette reconnus, enseignant connecté
    puis déconnecté jamais compté (seule la page de connexion vue avant de se
    connecter, dans un navigateur neuf, compte), tableau de bord affiché sans
    erreur avec 45 jours de données de démonstration, anonyme renvoyé vers la
    connexion ; 0 erreur JS ; vérificateur des fiches : 0 erreur.
  - Règles `statistiques` publiées par David dans la Console Firebase
    (03/10/2026), puis code fusionné sur `master`.
- **Fusion du commit local du 02/10 (03/10/2026).** Le commit « Chantiers
  futurs : backlog déplacé dans un artefact » (27d6694, PC de David, jamais
  poussé) divergeait de `master` après le travail de la session cloud du
  03/10. Poussé par David sur une branche `recup-chantiers`, fusionné dans
  `master` (commit de fusion) : seul conflit, la fin de `HISTORIQUE.md`
  (les deux côtés y ajoutaient des entrées), résolu en gardant tout, entrée
  du 02/10 avant celles du 03/10. `SUIVI-FIREBASE.md` fusionné sans conflit.

- **SUIVI-FIREBASE §6 : ligne périmée retirée (03/10/2026).** La ligne
  « Fiche 12 de Première : un groupe dont la condition sur a manque est
  laissé statique, choix de David » ne valait plus depuis le 02/10/2026
  (12.11 corrigé avec la condition « r = R » et rendu aléatoire, devenu
  12.6 c, avec l'accord de David). Retirée à sa demande.

- **Première : le cahier « Sommes et produits » passe après « Produit
  scalaire » (04/10/2026).** Demande de David : « décaler le cahier 5 de
  première après le cahier 9 (produit scalaire) ».
  ⚠️ **Correspondance ancien → nouveau.** Cahiers : 6 → 5, 7 → 6, 8 → 7,
  9 → 8, 5 → 9 (1 à 4 et 10 inchangés). Fiches : 17 → 14, 18 → 15, 19 →
  16, 20 → 17, 21 → 18, 22 → 19, 23 → 20, 24 → 21, 14 → 22, 15 → 23,
  16 → 24 (1 à 13 et 25-26 inchangées). Nouvel ordre : 5 Probabilités
  (fiche 14), 6 Géométrie plane et vecteurs (15-17), 7 Trigonométrie
  (18-19), 8 Produit scalaire (20-21), 9 Sommes et produits (22-24).
  Toutes les entrées de ce fichier antérieures à celle-ci parlent des
  anciens numéros (« fiche 17 » = probabilités = l'actuelle 14 ;
  « fiche 14 » = sommes I = l'actuelle 22 ; etc.). Les fiches des
  cahiers 1 à 4 et 10 ne changent pas.
  - **Firebase** (inventaire en lecture seule avant l'opération, 78
    élèves, 6 devoirs) : aucun brouillon, aucune tentative ni aucun devoir
    ne vise une fiche de Première 14 à 24 ; les six devoirs portent sur
    les fiches 1 et 2 de Première, deux fiches de Seconde ou les
    automatismes. Aucune migration nécessaire, rien écrit en base.
  - Même méthode que la renumérotation du 30/09 (script Node, remplacements
    ciblés par contexte, `git mv` par dossiers d'attente) : dans chaque
    fiche, titre de page, pastille, titres « Calcul N.k », identifiants
    d'exercices (`id:"N.k a)"`), identifiants DOM (`grille-`, `texte-`,
    `titre-`, `table-`, `arbre-`, `graphique-`, flèches…-N-k), liens
    précédent/suivant ; dans chaque sommaire : titre, fil d'Ariane, h1,
    liens vers le cahier précédent/suivant, numéros des fiches ;
    `assets/js/manifeste-fiches.js` (devoirs) ; page « Tous les cahiers »
    (cartes réordonnées). Les liens des cahiers 4 et 10 et les jonctions
    entre fiches 13/14 et 24/25 n'ont pas eu à changer (aucun lien de
    fiche ne traverse un cahier).
  - Vérifié : audit de cohérence des 11 fiches et 5 sommaires (numéros du
    titre, de la pastille, des ids, des titres « Calcul » ; table
    `groupes` ↔ grilles du HTML ; liens de navigation) : 0 problème ;
    aucun reste d'ancien numéro (deux faux positifs : coordonnées SVG) ;
    chaque fiche chargée dans le navigateur : ids tous préfixés du nouveau
    numéro, tous les groupes présents et remplis, tous les identifiants
    DOM littéraux appelés par le code existants, 0 erreur MathJax, 0
    erreur console ; page « Tous les cahiers » : les 10 cartes de Première
    (étiquette, nom, nombre de fiches) cohérentes avec leur sommaire ;
    manifeste : 26 fiches, numéros 1 à 26, titres identiques à ceux des
    fiches ; vérificateur de syntaxe : 0 erreur.
  - Non modifiés (cosmétique) : le script de captures du guide de l'élève
    (`outils/guide-eleve/captures.js`) nomme un devoir fictif « Sommes —
    fiche 14 » (devenue 22) ; le PDF déjà généré n'est pas affecté.

- **Devoir sujet blanc de 1ere-Gr 1 : `ficheId` résiduel et tentatives de
  fiche rattachées à tort (04/10/2026).** En préparant le devoir sur une
  partie de fiche, inventaire en lecture seule des devoirs : le devoir
  `b725KZd9xnPEDC7cljhf` (sujet blanc niveau 2, mode fiche, `1ere-Gr 1`,
  échéance 04/10 20h30) était de type `automatismes` mais portait encore
  `ficheId` = Première fiche 1, et 5 tentatives de **fiche** (35 questions,
  ancien format, toutes du 29/09) lui étaient rattachées.
  - **Cause** : le devoir avait été créé pour la fiche 1 puis transformé en
    sujet blanc via « Modifier » ; `updateDoc` ne retire pas `ficheId`
    (`devoirs.js` ne fait `deleteField()` que pour `eleves`, `duree` et
    `themes`). Conséquences : (1) `devoirsPour()` ne filtre pas par type, donc
    ouvrir la fiche 1 de Première en `1ere-Gr 1` appliquait ce devoir
    (aucune tentative de ce genre depuis le 29/09) ; (2) les 5 tentatives de
    fiche comptaient dans les essais du sujet blanc et faussaient la
    « meilleure tentative » (score brut) : `p.fonya` (3 tentatives de fiche,
    0 de sujet blanc) était bloqué à 3/3, `s.chowdhury` (2 de fiche) n'avait
    plus qu'un essai.
  - **Correction, avec l'accord de David** : sauvegarde JSON du devoir et de
    ses 22 tentatives (`.claude/scratch/sauvegarde-devoir-b725-2026-10-04T05-41-50-821Z.json`,
    local, non suivi) puis `deleteField()` sur `ficheId` et suppression des
    5 tentatives de fiche (3 de `p.fonya`, 2 de `s.chowdhury`), avec
    vérification avant chaque suppression. Après coup : devoir sans
    `ficheId`, 17 tentatives de sujet blanc restantes, aucune avec
    `ficheId`, type, classe et échéance inchangés.
  - **Non corrigé (proposé à David)** : `devoirs.js` doit ajouter
    `ficheId` (et `niveau`, `mode`, `cible` dans l'autre sens) aux champs
    passés à `deleteField()` quand un devoir change de type ; et/ou
    `devoirsPour()` doit ignorer les devoirs qui ne sont pas de type
    `fiche`. Modification de fichiers partagés : à faire après la clôture
    des sujets blancs et sur « pousse tout » de David.

- **Devoir sur une partie de fiche : conception et trois fiches pilotes
  (04/10/2026).** Demande de David (brief du 04/10) : attribuer une fiche en
  ne retenant que certains calculs ; note = bonnes réponses / questions
  retenues ; calculs non retenus masqués pour l'élève ; devoir sans
  sélection inchangé.
  - **Modèle** : champs facultatifs `calculs` (numéros de calculs, ex.
    `["9.4","9.6"]`) et `calculsTitres` (tableau plat de chaînes ≤ 100
    caractères — Firestore refuse les tableaux imbriqués) sur
    `devoirs/{id}` ; le titre du devoir reçoit « — calcul(s) 9.4 et 9.6 ».
    Correspondance **par numéro de calcul** (préfixe des ids « 9.4 a) »),
    jamais par position. `firestore.rules` inchangé.
  - **Fichiers** : nouveau `assets/js/devoir-partiel.js` (script classique,
    `window.DevoirPartiel` : `appliquer`, `retirer`, `retenu`,
    `retenuParId`, `exercicesRetenus`, `compter`, `phrase`, `listeCalculs`) ;
    `suivi.js` (`verifierEtatDevoir(ficheId, devoirId)` renvoie aussi `id`
    et `calculs`, devoir choisi mémorisé pour que brouillon et tentative
    aillent au même devoir, clé de brouillon `<ficheId>~<devoirId>` + champ
    `devoirId` pour un devoir partiel) ; `devoirs.js` + `devoirs.html` +
    `devoirs.css` (liste des calculs, « tout cocher » par section, résumé,
    verrouillage une fois qu'une tentative existe, `deleteField()` en
    modification) ; `devoirs-eleve.js` (brouillons d'un devoir partiel
    rangés par `devoirId`, pour « Enregistrés ») ; `mes-devoirs.js` (lien
    `…?devoir=<id>`).
  - **Choix** : le formulaire lit les calculs dans la fiche chargée dans
    une iframe hors écran (titres construits en JavaScript compris : 1.7 et
    1.8 de Première 1) et n'offre le choix que si la fiche expose
    `DevoirPartiel` (marqueur « fiche câblée ») ; masquage par classe CSS
    `devoir-partiel-masque` + `MutationObserver` (les grilles sont
    reconstruites à chaque nouvelle version) ; si aucun exercice ne
    correspond aux numéros du devoir (fiche renumérotée), la fiche reste
    entière et la console avertit (mieux que tout cacher). Essais épuisés :
    `retirer()`, fiche entière en entraînement libre.
  - **Pilotes câblés** : Première 1 (calculs 1.7-1.8 construits en JS),
    Première 9, Seconde cahier 2 fiche 8 (widgets, tableau de signes).
    Vérificateur de syntaxe : 50 fiches, 0 erreur.
  - **Tests (comptes jetables, connexion par jeton personnalisé, supprimés
    ensuite)** : formulaire → document Firestore → lien de `/mes-devoirs/`
    → masquage (9.4 + 9.6 : 8 questions sur 28 ; 1.2 + 1.7 + 1.8 : 6 sur 26 ;
    8.2 + 8.5 + 8.6 : 10 sur 33) ; total de la tentative = questions retenues
    (8, 6, 10) ; masquage conservé après reconstruction des zones ;
    brouillon rangé par devoir et restauré ; deux devoirs sur la même fiche
    (entier + partiel) : chacun s'ouvre avec `?devoir=`, sans paramètre le
    plus proche de l'échéance ; essais épuisés → fiche entière visible ;
    modification d'un devoir avec tentatives → cases verrouillées, sans
    tentative → libres. Le test 4/8 → 3/8 observé en route venait de
    l'injection de la réponse dans MathLive (saisie différée), pas du code.
  - **Script de câblage** `outils/devoir-partiel/cabler-fiche.js` : applique
    les retouches (script, bandeau, entraînement libre, validation et total,
    « tout saisi », champ suivant, vérifier tout, toutes les réponses,
    `verifierEtatDevoir`, `appliquer`) avec une variante par gabarit, chaque
    motif devant trouver exactement une occurrence. Essai à blanc sur les 48
    fiches restantes : 48 conformes. **Pas de câblage en masse sans le feu
    vert de David** ; avant, contrôle fiche par fiche de la structure du DOM
    (le masquage suppose `.section-titre`, `.calcul-titre` et grilles
    frères, vérifié sur les 50 fiches pendant la conception ; seul cas
    ambigu : un rappel de formule entre deux calculs, Première 19, traité).
  - **Nettoyage** : 4 devoirs de test, compte élève `z.essai` (+ 4
    tentatives) et compte enseignant jetable supprimés ; `n.testeuse` et
    les vrais devoirs non touchés.
  - **Reste** (en attente de David) : les deux correctifs annoncés plus haut
    (`devoirs.js` / `devoirsPour()`), après 20h30 ; le câblage des autres
    fiches ; un contrôle de renumérotation via `calculsTitres` (non
    implémenté).

- **Retours de David après ses essais en mode devoir : widgets de Seconde et
  QCM de Première 1 (04/10/2026).** Quatre défauts relevés, tous traités.
  - **1. « Valider ce tableau » ne montrait rien en devoir** (fiche 8 de
    Seconde, tableau de signes) : un élève en devoir ne voit ni couleur ni
    statut avant la validation de la fiche, et le clic ne déplaçait pas le
    focus. Désormais un message « ✓ Réponse enregistrée » apparaît à côté du
    bouton (« Remplis toutes les cases avant de valider. » si le widget est
    incomplet) et, si le widget est complet, la fiche passe à la question
    suivante comme avec la touche Entrée. Le message disparaît à la
    modification suivante.
  - **2. Entrée dans un champ placé avant un widget ne faisait rien** :
    `allerChampSuivant()` cherche `input-N`, absent pour un widget
    (`focus()` sur `null`, exception silencieuse), et le clavier ouvert
    restait affiché. Le script partagé enveloppe cette fonction : si la
    question suivante est un widget (en sautant les calculs masqués d'un
    devoir partiel), il ferme les claviers ouverts (maison et MathLive) et
    donne le focus au premier champ du widget.
  - **3. Pas de clavier numérique sur les widgets** (cas confirmé pour les
    cinq types : signes, variations, croisé, programme, schéma d'évolution) :
    un bouton clavier à côté de « Valider » ouvre un pavé (chiffres, virgule,
    −, a/b, %, ×, √, parenthèses, ⌫, Effacer) qui écrit dans le dernier champ
    du widget où se trouvait le curseur et déclenche l'événement `input` de
    la fiche (sauvegarde du brouillon, effacement du statut).
  - **Mise en œuvre** : un seul fichier, `assets/js/widgets-saisie.js`,
    branché par une balise `<script>` dans les 14 fiches concernées (aucune
    autre modification de ces fiches). Testé : fiche 8 de Seconde (pavé,
    saisie « 7/2 », ⌫, passage depuis 8.4 c), message en mode devoir simulé,
    message incomplet/complet, effacement à la modification, fermeture du
    clavier précédent) et un widget de chacun des quatre autres types
    (fiches 9, 10, 14, 15 de Seconde) ; console sans erreur. Vérificateur
    de syntaxe : 50 fiches, 0 erreur.
  - **4. QCM aux figures numérotées et réponses en lettres** : seule la fiche
    1 de Première (calcul 1.8 a/b, forme canonique → courbe) était dans ce
    cas (« figure 1 » à « figure 4 », réponse a à d, avec une note
    « a = figure 1… »). La réponse attendue est maintenant le numéro de la
    figure (1 à 4) ; « figure 2 » est accepté, ainsi que les anciennes
    lettres (brouillons déjà enregistrés) ; placeholder, aide « ? » et
    corrigé (« Figure 3 ») suivent, la note est supprimée. Contrôle des
    autres fiches : Première 4 (f1, f2, f3 → réponse « f1 »), Première 8
    (« courbe 1 »), Première 19 (courbes (a) à (d), réponses en lettres) étaient déjà
    cohérentes ; les banques d'automatismes ne sont pas concernées. Règles
    ajoutées à `REGLES-FICHES.md` (§4).

- **/mes-devoirs/ : l'élève peut supprimer les devoirs faits de sa liste
  (04/10/2026).** Demande de David (dernière section du tableau de bord
  élève, « s'il le souhaite »).
  - **Choix** : « supprimer » = **retirer de la liste de l'élève**, pas
    effacer. Les règles Firestore interdisent à l'élève de supprimer un
    devoir (écriture admin) ou une tentative (suppression admin), et c'est
    voulu : les tentatives alimentent les résultats de l'enseignant. Le
    bouton écrit un marqueur `eleves/{uid}/devoirsMasques/{devoirId}`
    (`{masqueLe: serverTimestamp()}`), que `chargerDevoirsEleve()` retire de
    la colonne « Faits » (seulement : un devoir redevenu ouvert par une
    échéance repoussée réapparaît dans « À faire »). La confirmation le dit :
    « Ton enseignant conserve tes résultats. »
  - **Interface** : bouton « Supprimer » sur chaque devoir fait, en deux temps
    (« Confirmer » / « Annuler », pas de fenêtre du navigateur) ; « Tout
    supprimer » en tête de colonne s'il y a plus d'un devoir fait ; échec
    d'écriture → « Suppression impossible pour le moment. ».
  - **Règle Firestore ajoutée** (`firestore.rules`, **à republier à la main**) :
    `devoirsMasques/{devoirId}` — lecture propriétaire/admin ; création par le
    propriétaire avec le seul champ `masqueLe` égal à l'heure du serveur ;
    pas de modification ; suppression propriétaire ou admin. 16 cas ajoutés à
    `outils/verification/regles-firestore/test-regles.mjs` (marqueur chez un
    autre élève, champ en plus, date falsifiée, anonyme, et non-régression :
    l'élève ne supprime ni tentative ni devoir).
  - **Robustesse** : la lecture des marqueurs est facultative (`catch` → liste
    vide) : tant que la règle n'est pas publiée, `/mes-devoirs/` fonctionne
    comme avant. Les marqueurs dont le devoir a disparu sont supprimés au
    chargement (comme les brouillons orphelins).

- **Supprimer un devoir supprime aussi ses tentatives (04/10/2026).**
  Question de David : un devoir supprimé n'apparaît plus côté élève (vrai : la
  liste part des devoirs de la classe), mais ses tentatives restaient en base,
  invisibles. Décision de David : « autant tout supprimer, y compris les
  tentatives d'un élève ». `devoirs.js` : `tentativesDesDevoirs()` parcourt
  les tentatives de **tous** les élèves (un élève a pu changer de classe),
  `supprimerDevoirsEtTentatives()` efface les tentatives puis le devoir (en
  cas d'échec le devoir existe encore et on peut relancer). La confirmation
  annonce le nombre de tentatives, pour « Supprimer » comme pour « Tout
  supprimer ». Aucune règle à changer (suppression des tentatives déjà permise
  à l'enseignant). Testé sur la base réelle avec des données jetables :
  suppression d'un devoir à 2 tentatives (la tentative d'un autre devoir est
  restée) ; « Tout supprimer » annulé : 4 devoirs, 5 tentatives annoncées, rien
  effacé.

- **Étiquettes PNG individuelles pour les élèves (04/10/2026).** Demande de
  David : communiquer leurs identifiants par message aux élèves qui n'ont pas
  encore reçu leur compte, sans modifier aucun identifiant. Nouvel outil
  `outils/etiquettes/generer-etiquettes-individuelles.js` (dépendance
  `@napi-rs/canvas`) : relit les `comptes-crees-*.csv` et écrit un PNG par
  élève dans `individuelles/<classe>/` (dossier ignoré par Git).
  `generer-etiquettes.js` exporte maintenant `lireCsvComptes` (sans changer
  son usage en ligne de commande). Rapprochement identifiants/classes fait en
  lecture seule dans Firestore : 75 comptes d'élèves réels (2nde-207 : 21,
  1ere-Gr 3 : 26, 1ere-Gr 1 : 27, hors classe : 1), 75 PNG générés ; les comptes
  de test n'ont pas d'étiquette. Aucun compte modifié.

- **Devoirs partiels : câblage des 50 fiches (04/10/2026).** Suite des trois
  pilotes, sur l'accord de David (« il faut l'étendre à l'ensemble des
  fiches »).
  - **Contrôle préalable, en lecture seule, sur les 50 fiches** (chaque fiche
    chargée dans une iframe, module injecté sans rien modifier, trois jeux de
    calculs masqués — premier, dernier, deux au milieu — puis comparaison du
    nombre de questions et de titres visibles avec ce qu'il fallait) :
    49 fiches conformes d'emblée. Seule Première 25 échouait : ses calculs
    s'intitulent « Entraînement 25.3 — … » au lieu de « Calcul 25.3 — … », le
    module ne reconnaissait que « Calcul ». Corrigé dans `devoir-partiel.js`
    (tout mot avant le numéro, aussi pour le libellé du formulaire) puis
    revérifié sur les fiches 25, 26, Première 14 (23 calculs) et Seconde 8.
    Piège de méthode : `exercices` est un `let` de la fiche, invisible comme
    propriété de `window` — le lire par `eval` dans l'iframe.
  - **Câblage** des 47 fiches restantes par `cabler-fiche.js` (une dizaine de
    retouches par fiche, chacune exactement une occurrence ; 47 sur 47). Les
    fiches de Seconde à widgets reçoivent la balise avant
    `widgets-saisie.js` sans conflit. Vérificateur de syntaxe : 50 fiches,
    0 erreur.
  - **Contrôle fonctionnel** sur les 50 : avec un calcul retenu, `verifierTout`
    affiche « x / nombre de questions retenues », « Voir toutes les réponses »
    ne liste que ces questions, `toutesLesReponsesSontSaisies` et
    `allerChampSuivant` s'exécutent sans erreur.

- **Devoirs partiels : test de bout en bout sur trois fiches câblées
  (04/10/2026).** Demande de David avant tout envoi : fiches variées, plusieurs
  réponses par fiche. Élève et devoirs jetables (classe `1ere-test`),
  connexion par jeton, tout supprimé ensuite.
  - **Seconde 15** (calculs 15.2, 15.4, 15.7 : expressions, valeurs
    approchées, intervalles, ensemble, **tableaux de variations**) : 12 questions
    sur 27 ; avancement enregistré avec 7 réponses (4 justes, 2 fausses, un
    widget à moitié rempli), rechargement : brouillon repris à l'identique,
    masquage conservé ; validation → tentative **6 / 12**, 10 réponses ;
    brouillon supprimé.
  - **Première 19** (19.4, 19.8, 19.9, 19.14 : valeurs trigonométriques, QCM,
    QCM sur courbes, formule rappelée) : 11 questions sur 39, rappel de
    formule du calcul masqué (19.5) caché, ceux des calculs retenus visibles ;
    tentative 1 : **6 / 11**, 9 réponses ; « Générer une nouvelle version » :
    masquage conservé, saisies vidées ; tentative 2 (tout juste) : **11 / 11** ;
    tentative 3 (2 réponses) : 2 / 11, fenêtre « dernière tentative », fiche
    entière (39 questions) en entraînement libre.
  - **Seconde 22** (22.3 oui/non, 22.5 vecteurs, 22.7 paires, 22.8
    combinaison) : 11 questions sur 27, tentative **5 / 11**, 9 réponses.
  - **Contrôles croisés** : pour chaque tentative, score, total et nombre de
    réponses stockés dans `devoirsTentatives` = ce que la fiche calculait sur
    les seuls calculs retenus. `/mes-devoirs/` : « Meilleure note : 6 / 12 »,
    « 11 / 11 — 3 tentatives » (rangé dans « Faits »). Vue Résultats de
    l'enseignant : 11 / 11 (0 non-réponse), 6 / 12 (2), 5 / 11 (2).
  - **Artefacts de test, pas des défauts** : les réponses de la combinaison
    22.8 et des valeurs approchées 15.4 a) sont jugées fausses parce que mon
    injection (LaTeX / format de liste) n'est pas lue comme un élève la
    taperait.
  - **Non couvert** : les 44 autres fiches (contrôlées par le masquage et les
    fonctions modifiées, pas par une validation réelle), les appareils tactiles.
  - Le devoir `Xh7g2N6XAJSn5FbJfGmf` (classe `1ere-demo`, calcul 1.4,
    créé par David à 07:20) est un reste de ses propres essais : laissé en place.

- **Deux correctifs annoncés après l'affaire du devoir b725 (04/10/2026).**
  Suite du « ficheId résiduel » (voir l'entrée sur le sujet blanc de
  1ere-Gr 1) : la cause (un devoir de fiche transformé en sujet blanc via
  « Modifier » gardait son `ficheId`) et son effet (le devoir s'appliquait
  aussi à la fiche) sont maintenant traités à la source.
  - **`devoirs.js`** : en modification, `ficheId`, `niveau`, `mode` et `cible`
    passent par `deleteField()` quand ils ne s'appliquent plus au nouveau type
    (`updateDoc` n'efface jamais un champ absent du payload).
  - **`suivi.js`** : `devoirsPour()` ne retient que les devoirs de type
    `fiche` (un devoir sans type est une fiche, ancien format) ; les 5 devoirs
    de la base ont tous un type.
  - **Tests** (élève et enseignant jetables, 4 devoirs jetables en `1ere-test`,
    supprimés ensuite) : un sujet blanc portant un `ficheId` résiduel
    n'apparaît plus sur la fiche (pas de bandeau, pas de mode devoir) alors
    qu'un vrai devoir de la fiche voisine s'affiche ; via le formulaire, un
    devoir fiche → sujet blanc perd son `ficheId`, un sujet blanc → fiche perd
    `niveau`, `mode` et `cible`.

- **Vérifications avant envoi, pendant les sujets blancs (04/10/2026, 12h30).**
  Deux sujets blancs réels (1ere-Gr 1 et 1ere-Gr 3) restaient ouverts jusqu'à
  20h30. Avant de décider de l'envoi du lot (devoirs partiels, suppression
  côté élève, correctifs), vérifications sur élève et enseignant jetables :
  - **Modification de la seule échéance** (formulaire enseignant) sur un
    devoir de fiche entière, un devoir partiel à sélection verrouillée (une
    tentative existe) et un sujet blanc : « Devoir modifié. » ; pour la
    fiche entière et le sujet blanc, seul le champ `echeance` change ; pour le
    partiel, `calculs` est conservé (le titre et `calculsTitres` sont
    réécrits à partir de la fiche, sans effet sur les élèves).
  - **Sujet blanc sous le code actuel** : `automatismes/` n'a aucune
    différence avec GitHub ; seules les fonctions de `suivi.js` propres aux
    fiches changent (`verifierEtatDevoir`, brouillons de fiche,
    `devoirsPour`), celles des automatismes (`…AutomatismeParId`, brouillons
    d'automatismes, `enregistrerTentativeSujetBlancSiDevoir`) sont intactes.
    Parcours réel : devoir trouvé (0/3), 5 réponses enregistrées puis reprises
    après rechargement, validation (« 5 questions sans réponse »), tentative
    stockée (10 questions, 5 répondues), brouillon supprimé.
  - Risque résiduel d'un envoi en cours de journée : fenêtre de cache de
    GitHub Pages (quelques minutes) pendant laquelle un fichier JS ancien
    pourrait côtoyer un nouveau (notamment `mes-devoirs.js` qui importe
    `masquerDevoirs` de `devoirs-eleve.js`) : page `/mes-devoirs/` en erreur le
    temps du rafraîchissement.

- **Suppression du compte de test `n.testeuse` (04/10/2026).** Demande de
  David (ses essais se feront sur `demo-eleve`, et il ne veut plus de classe
  `1ere-test` dans la liste d'attribution). Inventaire en lecture seule et
  sauvegarde JSON (`.claude/scratch/sauvegarde-comptes-test-*.json`, local)
  avant suppression : 1 brouillon, 8 connexions, 1 résultat, 65 tentatives de
  l'ancien modèle, aucun devoir rattaché ; supprimés avec le profil et le
  compte de connexion. La classe `1ere-test` a disparu de la liste, qui est
  calculée à partir des classes des comptes existants.
- **Suppression du compte de test `l.testeur` (04/10/2026).** Sur la demande
  de David, pour que la liste d'attribution ne propose plus que ses classes
  réelles, « Hors classe » et `demo-eleve`. Même sauvegarde JSON que pour
  `n.testeuse` (inventaire préalable : 9 connexions, 47 tentatives de l'ancien
  modèle, aucun devoir rattaché). Classes restantes : `1ere-Gr 3` (26),
  `1ere-Gr 1` (27), `2nde-207` (21), `1ere-demo` (1), hors classe (1).

- **Modification individuelle d'un devoir : échéance et essais par élève
  (04/10/2026).** Demande de David : en cliquant sur « Modifier », pouvoir
  choisir des élèves de la classe (jamais par défaut) plutôt que modifier pour
  toute la classe. Décision (question posée) : échéance et nombre d'essais
  seulement, sur le MÊME devoir (pas de copie de devoir), pour garder un seul
  jeu de résultats ; cas typique : prolonger pour des absents.
  - **Modèle** : `derogations.<uid> = { echeance, nbEssaisMax }` sur
    `devoirs/{id}`. Nouveau module `derogations.js`. Appliqué côté élève
    (`suivi.js` : quatre lectures de devoirs ; `devoirs-eleve.js`) et côté
    enseignant (classement en cours / faits par échéance maximale, mention
    dans la liste, vue Résultats par élève).
  - **Interface** : bloc « Modifier l'échéance et le nombre d'essais pour
    certains élèves seulement » dans l'édition (décoché à chaque ouverture) ;
    coché : les champs de classe sont masqués, la liste des élèves apparaît
    (avec leur réglage individuel actuel), échéance et essais s'appliquent aux
    élèves cochés ; bouton « Rétablir les réglages du devoir pour les élèves
    cochés ». `devoirADesTentatives` réutilise le nouvel `elevesDuDevoir`.
  - **Tests** (3 élèves, un enseignant et 2 devoirs jetables en `1ere-test`,
    supprimés ensuite) : option décochée par défaut ; erreur sans élève coché ;
    enregistrement pour un seul élève (le devoir lui-même inchangé) ;
    `/mes-devoirs/` : l'élève concerné voit sa date et ses essais (fiche et
    sujet blanc), un autre garde ceux de la classe (devoir échu, « Non
    rendu ») ; l'élève concerné valide après la date de la classe (« il t'en
    restera 4 ») ; Résultats : « Rendu, 1 / 5, échéance individuelle » contre
    « 0 / 2 » pour les autres ; devoir échu pour la classe resté « en cours » ;
    « Rétablir » (messages d'erreur si aucun réglage individuel, puis retrait) ;
    modification classique d'un devoir à dérogation : la dérogation est
    conservée.

- **Première : numéro de cahier oublié dans l'en-tête des fiches
  déplacées (04/10/2026).** La renumérotation du jour avait laissé
  « Première — Cahier N » (fil d'Ariane et repère de l'en-tête, 2 mentions
  par fiche) à l'ancien numéro dans les 11 fiches 14 à 24 : détecté en
  ouvrant la fiche 14 (« Cahier 6 » au lieu de « Cahier 5 »). Corrigé :
  cahier 5 (fiche 14), 6 (15-17), 7 (18-19), 8 (20-21), 9 (22-24).
  L'audit du matin ne contrôlait pas cette mention.

- **Première fiche 14 (Probabilités, ex-17) : automatismes aux règles,
  fusions, tableaux de lois en LaTeX (04/10/2026), 53 → 38 questions,
  23 → 15 calculs.** David : « fais le. Dans les tableaux de loi de
  probabilités, il faut du LaTeX ».
  - **Automatismes** (6, nouveau modèle) : 14.1 inéquations a) premier
    degré, chaque membre écrit tel quel ou en p(x+q) ; b) produit ou
    quotient de deux facteurs affines ◊ 0 (valeur interdite jamais incluse
    ni franchie) ; 14.2 équations a) second degré (deux solutions, solution
    double ou aucune, ∅, à raison de 50 / 25 / 25 %), b) premier degré à
    fractions (x+a)/b ± x/c = d ; 14.3 calcul numérique en entier ou
    fraction irréductible a) somme de produits de décimaux, b) somme de
    fractions pondérées (type espérance). Clavier des ensembles { } ; ∅,
    saisie de ∅ et corrigé « ∅ » (au lieu de « {undefined} ») pour {}.
    Retirés : produits de fractions, développement d'un produit, les deux
    simplifications littérales en p et a.
  - **Fusions** (énoncés autonomes « P(…) si … » comme en fiches 11 à 13) :
    14.4 tableau d'effectifs (anciens 14.3 et 14.4 : P(B), P(A∩B), P(A∪B),
    P(Ā∩B̄) ; le tableau de probabilités décimales disparaît) ; 14.5
    probabilités conditionnelles et indépendance (anciens 14.5, 14.9,
    14.10, 14.12, 14.14 : P(A∩B) depuis P_A(B), P_B(A) depuis trois
    données, P(A∪B) et P(B) pour des événements indépendants) ; 14.6 arbre
    pondéré dont le modèle est tiré au hasard (deux branches fractionnaires
    ou trois branches décimales — anciens 14.8 et 14.13), résultats en
    fraction irréductible (l'ancien 14.13 demandait « sous forme
    décimale » pour P_D(A) = 341/623, impossible) ; 14.7 cas concret dont
    le contexte (ski ou musique) est tiré au hasard (anciens 14.6 et 14.11) ;
    14.10 loi avec une probabilité inconnue (anciens 14.16, 14.17, 14.19 :
    la probabilité manquante, P(X ⩽ x), E(X), V(X) ; la valeur de m pour
    E(X+m)=0 disparaît) ; 14.11 loi donnée par P(X ⩽ xᵢ) (ancien 14.18).
    Gardés : 14.8 tableau avec n (coefficients désormais tirés au hasard),
    14.9 arbre avec x, et les avancés 14.12 (arbre avec a), 14.13
    (uniforme), 14.14 (progression géométrique, titre ajouté) et 14.15
    (deux valeurs). Plus de suffixe « (I)/(II) ». Sections : « Calculs de
    probabilités », « Arbres pondérés et cas concrets », « Probabilités
    avec un paramètre », « Variables aléatoires », « Calculs plus avancés ».
  - **LaTeX dans les tableaux** : toutes les cellules des tableaux
    d'effectifs et de lois en LaTeX (x_i, P(X=x_i), P(X ⩽ x_i), décimaux
    0{,}12, fractions, signes), et `\cap`, `\cup`, `\leqslant` à la place des
    symboles Unicode dans les énoncés.
  - Les calculs restent compatibles avec le devoir sur une partie de fiche
    (essai : calculs 14.4 et 14.6 retenus → 7 questions comptées, les
    autres masqués avec leurs tableaux, arbres et textes).
  - Vérifié : 400 tirages recalculés indépendamment depuis les données
    (inéquations sur une grille et aux bornes ; équations par discriminant
    et substitution ; calculs évalués ; tableaux, arbres, cas concrets,
    lois, paramètres) : 0 écart ; variété ≥ 34 énoncés par question tirée ;
    les deux modèles d'arbre et les deux contextes concrets tirés à parts
    égales ; cycle complet 8 × 38 accepté ; fraction non réduite, décimal et
    intervalle faux refusés ; 0 erreur MathJax (fiche, panneau des
    réponses, tableaux) ; vérificateur : 0 erreur ; rendu contrôlé.
  Retouche le même jour (David : « montre les deux contextes. Cette fiche
  est plus longue mais est seule dans son cahier ») : les deux modèles
  d'arbre et les deux contextes concrets, tirés au hasard dans la première
  version, deviennent quatre calculs distincts, tous visibles à chaque
  version : **14.6** arbre à deux branches (fractions), **14.7** arbre à
  trois branches (décimaux), **14.8** cas concret avec un tableau (ski),
  **14.9** cas concret avec un arbre (musique), 3 questions chacun. La
  suite est renumérotée : 14.10 tableau avec n, 14.11 arbre avec x, 14.12
  loi avec une probabilité inconnue, 14.13 lois cumulées, 14.14 arbre
  avec a, 14.15 uniforme, 14.16 progression géométrique, 14.17 deux
  valeurs. **Au total 44 questions, 17 calculs** (53 / 23 à l'origine). Le
  numéro de cahier de l'en-tête est corrigé dans la même passe. Vérifié :
  400 tirages recalculés indépendamment : 0 écart ; cycle complet 8 × 44
  accepté ; fraction non réduite, décimal et intervalle faux refusés ; ∅
  accepté et affiché ; 0 erreur MathJax ; vérificateur : 0 erreur.

- **Première fiche 14, 14.5 : énoncés « On sait que … Calculer … »
  (04/10/2026).** David : « dans 14.5, pour chaque exercice, écrire plutôt :
  On sait que ….. Calculer …. ». Chaque question devient une phrase
  autonome, par exemple « On sait que P(A)=0,65 et P_A(B)=0,37. Calculer
  P(A∩B) » ou « On sait que A et B sont indépendants, que P(A)=… et
  P(B)=…. Calculer P(A∪B) » ; le titre ne garde que « Probabilités
  conditionnelles et indépendance. A et B désignent deux événements. »
  (le « Calculer » est dans chaque question). Vérifié : 300 tirages
  recalculés : 0 écart ; réponses affichées retapées acceptées ; 0 erreur
  MathJax ; vérificateur : 0 erreur ; rendu contrôlé.

- **Première fiche 14 : tableau de probabilités rétabli en 14.4
  (04/10/2026), 44 → 47 questions, 17 → 18 calculs.** David : « avant
  14.4, rajoute le tableau précédent avec les probabilités ». Le tableau de
  probabilités décimales (ancien 14.3 d'origine, retiré à la fusion avec le
  tableau d'effectifs) revient comme **nouveau 14.4** : P(Ā), P(A∪B),
  P(Ā∩B), résultats « sous forme décimale », cellules en LaTeX. **Tous les
  calculs suivants sont décalés de 1** (ids, titres, grilles, tableaux,
  arbres, groupes) : 14.5 tableau d'effectifs, 14.6 probabilités
  conditionnelles et indépendance (« On sait que … Calculer … »), 14.7 et
  14.8 arbres, 14.9 et 14.10 cas concrets, 14.11 tableau avec n, 14.12
  arbre avec x, 14.13 loi avec une probabilité inconnue, 14.14 lois
  cumulées, 14.15 à 14.18 les avancés (arbre avec a, uniforme, progression
  géométrique, deux valeurs). Les entrées du 04/10 ci-dessus parlent des
  numéros d'avant ce décalage. Vérifié : 400 tirages recalculés
  indépendamment : 0 écart ; cycle complet 8 × 47 accepté ; tableaux,
  textes et arbres tous construits ; 0 erreur MathJax ; vérificateur : 0
  erreur ; rendu contrôlé.

- **Première fiche 14 : arbres (14.12, 14.15) et question d'équation
  (04/10/2026), 47 → 48 questions.** David : « 1. Dans 14.12, la
  pondération de la branche A doit être légèrement élevée, on ne voit pas
  le x. 2. Dans 14.15 : les valeurs de l'arbre ne sont pas affichées en
  LaTeX ! 3. dans 14.15 c), ajouter une question du type "déterminer la
  valeur de a telle que P() = ", pour obtenir une équation de degré 2. »
  - `probaLabelSVG` : une étiquette de fraction à dénominateur large
    (« 4+x ») est écartée de la branche proportionnellement à sa largeur
    (le trait traversait le x) ; nouvelle écriture « $… » (LaTeX direct),
    utilisée pour les pondérations de l'arbre de 14.15 (a², 1−a², 1−a, a).
  - **14.15 c)** : « Déterminer la valeur de a telle que P_B(A)=P(A) » :
    a/(1+2a) = a² donne 2a²+a−1=0, soit (2a−1)(a+1)=0, d'où a = 1/2 (l'autre
    racine, −1, est hors de ]0;1[). Choix : une égalité entre deux
    probabilités plutôt qu'une valeur numérique, car toute valeur numérique
    donne sur cet arbre une équation du premier degré (P_B(A), P_A(B)) ou du
    troisième (P(B), P(A∩B)). Vérifié : a = 1/2 annule a/(1+2a)−a², pas
    d'autre racine dans ]0;1[ ; 1/2 et 0,5 acceptés, −1 et 2 refusés ;
    cycle complet 6 × 48 accepté ; 0 erreur MathJax ; vérificateur : 0 erreur.

- **Première fiche 15 (Droites du plan) : refonte, zoom et curseur sur le
  graphique (04/10/2026), 38 → 36 questions, 19 → 14 calculs.** David :
  « fais le. garde 15.6 mais applique au graphique le zoom et curseur ».
  - **Automatismes (15.1 à 15.3, 6 questions)** : inéquations (a : deux
    fractions affines ; b : ax²−b ◊ 0, bornes ±p/q), équations (a : second
    degré, deux racines, racine double ou ∅ ; b : équation à radicaux),
    calcul numérique (a : produit de fractions moins une fraction, fraction
    irréductible ; b : somme de radicaux, forme simplifiée a√b/c). Bornes et
    ensembles solutions construits par signe, jamais la valeur interdite.
  - **Fusions** : 15.4 (équations de droites : ex-15.3, 15.4, 15.5, énoncés
    autonomes « Déterminer … de la droite (d) passant par … »), 15.6 (points
    d'une droite et parallèle : ex-15.7, 15.8), 15.7 (droites à paramètre t :
    ex-15.9, 15.10), 15.8 (intersections : ex-15.11 à 15.13). 15.5 =
    ex-15.6 (détermination graphique, conservée), 15.9 = ex-15.14
    (droite-parabole), 15.10 = ex-15.15 (droite-cercle), 15.11 à 15.14 =
    ex-15.16 à 15.19 (avancés). Tous les calculs ont un vrai titre.
  - **Zoom au clic et curseur de coordonnées sur le graphique de 15.5**,
    portés de la fiche 4 de Première (`activerZoomSvg`, `activerCurseurSvg`,
    bouton curseur, fenêtre de zoom, CSS). Repère -4..4 sans marge
    (`data-marge="0"`), pas 1. Adaptation : la figure n'a pas de courbe
    (`<path>`), donc au doigt le repère est libre, aimanté au quart du pas
    en x et en y (dans la fiche 4 il suit la courbe). Étiquette (d₁)
    remontée au-dessus de la droite.
  - **Contrôles de forme** : `estFractionIrreductible` (fiche 14) et
    `estRacineSimplifiee` (fiche 11) importés ; le corrigé de 15.3 b est
    écrit « −5√7/4 » (radical au numérateur, seule forme acceptée par le
    contrôle). Ensemble vide `{}` géré (saisie ∅, clavier, corrigé).
  - Corrections : 15.7 a/b : composantes du vecteur non proportionnelles
    (sinon le vecteur s'annulait pour une valeur de t) ; 15.14 : f ≠ g
    exclu (tangentes confondues) ; énoncé 15.12 : « my » au lieu de
    « m × y » ; corrigé des équations réduites sans « × » devant x.
  - Vérifié : 400 tirages recalculés indépendamment (ensembles solutions
    sur grille, racines par discriminant, droites vérifiant les points et
    vecteurs donnés, intersections vérifiant les deux équations, points de
    parabole et cercle, tangentes) : 0 écart ; cycle complet 10 × 36
    accepté ; mauvaises réponses refusées ; zoom et curseur essayés dans le
    navigateur ; 0 erreur MathJax ; vérificateur : 0 erreur.

- **Barème en points : fiches pilotes Première 2 et 9 (05/10/2026).** Chantier
  « Barème personnalisé » lancé sur deux fiches, sur les règles de David.
  - **Règles** (voir `outils/bareme/README.md`) : 0,5 à 2 points par question,
    par quart de point ; le temps compte peu ; catégories A à E (automatisme,
    formule, enchaînement, initiative, avancé = bonus) avec leurs bandes ;
    automatismes à 1 point seulement pour les plus délicats ; totaux de base
    entiers (fiche 2 : 24, bonus 7 ; fiche 9 : 23, bonus 7). Barèmes d'abord
    calculés avec des notes difficulté / longueur / méthode (poids 45/15/40), puis
    abandonnés pour des bandes par catégorie après les remarques de David
    (9.6 ≤ 1, 9.7 c) et 9.8 c) proches de a), inéquations classiques ≤ 1, énoncés à
    paramètres mieux valorisés que les inéquations).
  - **Présentation élève** (affichée d'abord partout, restreinte aux devoirs dans l'entrée
    suivante) : une pastille de points par question et « Total : N
    points » en tête de fiche, sans catégorie, infobulle ni explication ;
    pas de sous-total par calcul. L'encart est placé avant le bloc des calculs
    (un devoir partiel masque le bloc entier) et indique le total des calculs
    retenus. Téléphone : pastille en fin de ligne, aucun défilement horizontal.
  - **Note** : `Bareme.calculer` (score et total en points ; bonus : bonne
    réponse ajoutée aux deux, sinon hors barème ; `nbQuestions` = questions de
    base retenues + avancées traitées). Utilisé à la validation d'un devoir (le
    panneau de score du mode libre n'est plus concerné : voir l'entrée suivante). `suivi.js` : `validerFiche` accepte un
    objet barème (5e paramètre) ; `mes-devoirs.js` et `devoirs.js` affichent les
    quarts de point ; Non-réponses = `nbQuestions − nbRepondues`.
  - **Tests** (élève et enseignant jetables, supprimés) : fiche 9 en devoir, 9
    bonnes réponses de base, un avancé juste, un avancé faux, un avancé vide →
    tentative **9,25 / 24,5** (23 de base + 1,5 de bonus), 26 questions, 12
    répondues, 14 non-réponses affichées à l'enseignant ; `/mes-devoirs/` « 9,25 /
    24,5 » ; mode libre « 3 / 24,5 » ; devoir partiel sur la fiche 2 (calculs 2.6 et
    2.10) : total 3 points ; vérificateur de syntaxe : 50 fiches, 0 erreur.
  - **Limite** : le barème suit la position de la question, pas le tirage ; une
    même position peut tirer un cas plus ou moins difficile (ex. 2.9 a).
  - **Non fait** (chantier) : barème des 48 autres fiches ; automatismes à 12
    questions ; arrondi éventuel de la note de l'élève.

- **Barème : uniquement dans les devoirs, encart avec les calculs avancés
  (05/10/2026).** Deux précisions de David sur les fiches pilotes.
  - **Encart de tête** : « Total : 23 points (+ 7 points de calculs avancés) » (base,
    puis les avancés possibles entre parenthèses) ; en devoir partiel, sur les seuls
    calculs retenus ; si seuls des calculs avancés sont retenus, « + N points de calculs
    avancés ».
  - **Aucun barème hors devoir** : ma première version l'affichait aussi en
    entraînement libre (anonyme ou connecté hors devoir) et pondérait le panneau de score
    du mode libre ; corrigé à la demande de David. `Bareme.afficher(!!etatDevoir)` est appelé
    par la fiche une fois le devoir connu (`initialiserFiche`), et `afficher(false)` à la fin des
    essais (`passerEnEntrainementLibre`) ; `Bareme.visible()` (et non `actif()`) décide du
    calcul pondéré et du panneau de score.
  - **Tests** (élèves jetables, supprimés) : visiteur anonyme en mode libre : aucune
    pastille, aucun encart, panneau « 3 / 28 » comme avant ; élève connecté sur une fiche
    sans devoir : rien ; avec un devoir : 28 pastilles et l'encart complet, retirés par
    `passerEnEntrainementLibre()` ; validation : tentative enregistrée « 3 / 24,5 » (25
    questions) ; 50 fiches : 0 erreur de syntaxe.

- **Crochets d'intervalle perdus, « bonnes réponses » en devoir (05/10/2026).** Deux
  retours de David après son test en ligne.
  - **Démo** : devoir de `demo-eleve` supprimé (le test en ligne a fonctionné).
  - **« bonnes réponses »** : en devoir avec barème (fiches 2 et 9), le panneau de score
    n'affiche plus que la note (« 9,25 / 24,5 ») ; le mot reste hors devoir.
    `<span id="score-suffixe">` dans les deux fiches, masqué par `Bareme.afficher(true)`.
  - **Crochet tapé au clavier, fiche 2** : frappé après une fraction (réponse du type
    « ]2 ; 7/2 [ »), le « [ » restait dans le dénominateur (`\frac{7}{[2}`) : affichage
    cassé et réponse fausse. `claviers.js` sort maintenant de la fraction/racine avant
    « [ », « ] » et « ; » dans les champs d'intervalle (clavier physique, `beforeinput`,
    clavier à l'écran). Hypothèse non vérifiée : AltGr de l'AZERTY ; couverte par
    `beforeinput`.
  - **Crochet disparu au retour sur la fiche** : l'ascii-math ne relit pas un crochet
    isolé. Les 50 fiches mémorisent désormais le LaTeX dans le brouillon (`saisies[idx].latex`)
    et le restaurent tel quel ; anciens brouillons : comportement d'avant.
  - **Tests** (élève et devoir jetables, supprimés) : frappe réelle de « ]-2;5[ », réponses
    LaTeX « [1;+\infty[ » et « ]-\infty;\frac{3}{2}[\cup]4;+\infty[ » : enregistrement du
    brouillon, rechargement, trois champs identiques ; crochet tapé dans un dénominateur et
    sous une racine : le crochet sort du modèle ; 50 fiches : 0 erreur de syntaxe.
  - **Observation non traitée** : une réponse longue (réunion d'intervalles) dépasse la
    largeur du champ (142 px pour 130 px visibles) et le dernier crochet est rogné au
    repos ; élargir les champs d'intervalle serait un chantier d'affichage séparé.

- **Audit des claviers de saisie (05/10/2026).** David : « le problème de la racine au
  numérateur était déjà réglé ; un audit des claviers est nécessaire — y a-t-il le même
  problème avec les accolades ? ». Oui, et l'audit a **corrigé le diagnostic de la même
  journée** : la cause principale du « crochet pas pris en compte » n'était pas la
  fraction mais la **fermeture automatique** de MathLive (`smart-fence="off"` ignoré
  par la version 0.111, comme `virtual-keyboard-mode` en septembre), qui ajoutait un
  « ] » en trop (]-2;5[ lu ]-2;5[]) ; la sortie de fraction n'était qu'un défaut secondaire.
  - **Méthode** : banc d'essai `outils/audit-claviers/` (les 50 fiches chargées une à
    une dans une iframe) ; frappe physique avec l'action `key` (vrais `keydown`) — l'action
    `type` n'émet que du texte inséré et masquait tous ces défauts, d'où la fausse
    piste du matin ; inventaire : 891 champs mathématiques avec clavier MathLive, 77 avec
    clavier maison (13 fiches), 30 couples/triplets, 489 champs texte ; 2 variantes de
    `inserer`, 2 de `insererRacine`, 2 de `insererFraction`.
  - **Corrigé (`claviers.js`, section 4)** : `smartFence = false` sur les champs à séparateur ;
    sortie de fraction/racine avant « [ », « ] », « ; » ; « } » et « ) » sortent seulement
    si rien n'est ouvert dans la branche (« {1/2} » donnait une accolade en trop, « (3;1/2) »
    la parenthèse dans le dénominateur) ; « / » juste après un « ] » d'ouverture (]3/2;5[ :
    le « ] » entrait dans le numérateur) ; enveloppe de `inserer` en plus de `insererMath`
    (claviers à chiffres : Première 12 et 19, Seconde 6, 14, 15, 17 à 20 et 25 : un « ; » ou « } »
    après une fraction restait dans le dénominateur) ; faute dans mon premier jet : `'\cup'` (le « \c » JS
    vaut « c ») ne reconnaissait pas la touche ∪ ; critère de champ élargi (touche « ; »
    sur le clavier, car le placeholder dépend du type : Seconde 25 a `\{a\}`).
  - **Brouillon** : l'ancien aller-retour par ascii-math perdait le dernier crochet de 6
    saisies sur 13 (]-∞;3/2[, [1;+∞[, ]-∞;1[∪]3;+∞[…) ; le LaTeX mémorisé les restitue
    toutes à l'identique.
  - **Défaut trouvé au passage (correcteur)** : la touche ∅ du clavier d'ensembles donnait
    une réponse refusée à la question « ensemble vide » (Première 3, 3.8 d), 35 % des
    tirages) : `checkEnsemble` n'acceptait que « {} ». Les 18 fiches qui avaient cette
    variante reprennent celle des fiches 12, 14, 15… (`estVide` : « ∅ », « o/ », « {} »,
    « vide »). « {∅} » reste refusé (ce n'est pas l'ensemble vide). Seules les fiches 3, 8, 14,
    15 de Première et 14, 25 de Seconde peuvent tirer cette réponse ; les autres étaient
    latentes.
  - **Contrôles** : 13 séquences de clics sur chaque clavier maison à champ « ; » : 120 OK,
    0 écart (88 sautées : touche absente du clavier) ; chaque touche de chaque clavier cliquée,
    aucune erreur JavaScript, `+ − × ÷` présents sur les 87 claviers texte et les 15
    claviers mathématiques ; frappe physique : `{3}`, `{-2;3}`, `{}`, `{1/2;3/4}`,
    `]-2;5[`, `]3/2;5/2]`, `[1;+2[`, `(3;1/2)`, `(1;(1+2)/3)`…, et la réponse de 2.5
    `{(-1-3sqrt(7))/2;(-1+3sqrt(7))/2}` acceptée ; touche « ) » du clavier MathLive ; touches
    { } du clavier MathLive présentes (Maj : ∅ et ;) ; 50 fiches : 0 erreur de syntaxe.
  - **Non traité (observations)** : (1) après un « a/b » ou « ÷ » à l'écran, rien ne permet
    d'aller du numérateur au dénominateur sans la souris ou la touche Tab (le clavier n'a pas de
    flèche) ; (2) une réponse longue dépasse la largeur du champ et son dernier crochet est
    rogné au repos ; (3) MathLive non épinglé ; (4) `]-∞;+∞[` est refusé là où ℝ est
    attendu (Première 2.12).

- **MathLive épinglé à 0.111.0 (05/10/2026).** Suite de l'audit des claviers : les 50 fiches
  chargeaient `https://unpkg.com/mathlive` sans numéro, donc toujours la dernière version
  publiée (cause de la perte silencieuse de `smart-fence` et `virtual-keyboard-mode`).
  Remplacé par `https://unpkg.com/mathlive@0.111.0` (une ligne par fiche, script exact-une-fois
  partout ; l'adresse redirige vers `mathlive@0.111.0/mathlive.min.js`). Vérifié : version
  chargée 0.111.0 sur 4 fiches (Première 2, 3, 9, Seconde 14), banc d'essai sans écart, aucune
  erreur JavaScript, 50 fiches : 0 erreur de syntaxe. Changer de version = modifier le numéro
  dans les 50 fiches après un passage du banc `outils/audit-claviers/`. math.js (12.4.0) et
  MathJax (3.2.2) étaient déjà épinglés.

- **Touche → sur les claviers à l'écran (05/10/2026).** Point « non traité » de l'audit, à la
  demande de David : après a/b, ÷ ou √ rien ne permettait d'aller du numérateur au
  dénominateur (ni de sortir de la racine) sans souris ni clavier physique, gênant surtout sur
  tablette. `claviers.js` ajoute une touche **→** après « ← Suppr. » (à défaut, après √, a/b ou ÷)
  sur les claviers qui font des fractions ou des racines. Champ mathématique : `moveToNextChar`
  (numérateur → dénominateur → après la fraction ; sous la racine → après la racine) ; champ
  texte : sélectionne la case ▢ du dénominateur quand le texte suivant commence par « )/(▢ »,
  place le curseur après « )/( » dans la variante « ()/() », sinon sort d'un niveau de
  parenthèse. Une pression = un niveau dans les deux cas (d'abord une version qui sautait de la
  racine au dénominateur en champ texte, corrigée). Banc `outils/audit-claviers` : phase
  `fleches` ; **80 claviers munis de la touche, 222 essais OK, 0 écart**, aucun clavier à
  fraction/racine sans → ; essai à la souris sur la fiche 2 (a/b, 3, →, 4 → 3/4, focus conservé) ;
  50 fiches : 0 erreur de syntaxe. Un défaut de mon banc (nettoyage qui supprimait le « s » de
  sqrt) a produit de faux KO avant correction.

- **Dernier crochet rogné dans les champs longs (05/10/2026).** Point « non traité » de l'audit,
  à la demande de David : une réponse longue (réunion d'intervalles, fractions à radicaux) dépassait
  la largeur fixe du champ (265 px de contenu pour 190 visibles) et son dernier caractère était
  rogné au repos. `claviers.js` (section 5) : au repos, un champ qui déborde passe sur sa propre
  ligne (les lignes de question sont en `flex-wrap` ; la touche ⌨ reste à droite), puis, si cela ne
  suffit pas (téléphone), réduit sa police jusqu'à 12 px. Mesure sur `.ML__content` (scrollWidth >
  clientWidth). Rien ne change pendant la frappe ; à la sortie du champ la mise en page s'ajuste.
  **Premiers essais** : la mesure tombait parfois avant que MathLive ait dessiné le champ (aucun
  réessai) et avant le chargement des polices : réessais pendant 3 s et nouvelle mesure au
  chargement et à `document.fonts.ready`. **Vérifié** : 50 fiches à 1000 px (champs rognés : aucun
  une fois l'attente suffisante ; les échecs observés par séries venaient d'un banc trop pressé,
  rejoués OK) ; à 375 px, 18 champs avec des réponses réalistes sur 12 fiches : aucun rogné, police
  réduite à 13–15 px pour 3 ; scénario réel (frappe, clic ailleurs) : champ rogné en cours de saisie,
  entièrement visible à la sortie ; ⌨ toujours à droite. Pas de débordement horizontal de la page
  causé par ce changement (Première 14, 16, 22 débordent déjà : un tableau et des énoncés MathJax,
  non traités). Banc : phase `largeur`. Reste ouvert : `]-∞;+∞[` refusé là où ℝ est attendu
  (Première 2.12).

- **]-∞;+∞[ accepté pour ℝ (05/10/2026).** Dernier point ouvert de l'audit, à la demande de David :
  `parseReponseIntervalle` lisait `]-∞;+∞[` comme un intervalle ordinaire, jamais égal au
  type « tout » (seule la fiche 2 de Première le tire, question 2.12, mais 41 fiches ont la
  fonction). Règle ajoutée (3 variantes de la fonction, 28 + 11 + 2 fiches) : **un seul
  intervalle, non borné des deux côtés, avec les deux crochets ouverts, est lu « tout »** ;
  `]-∞;+∞]` et `[-∞;+∞[` restent refusés (notation incorrecte : ma première version les
  acceptait, repéré à l'essai en conditions réelles). Au passage, les 39 variantes qui ne
  reconnaissaient pas « rr » ni « o/ » (ce qu'écrivent les touches ℝ et ∅ d'un champ
  mathématique, même défaut que l'ensemble vide) les reconnaissent maintenant. **Vérifié** :
  banc `reels` (24 claviers d'intervalles, saisie par les touches puis correction : `]-∞;+∞[`,
  ℝ, ∅, `]-∞;1[`) ; fiche 2, question 2.12 tirée : `]-∞;+∞[` et ℝ acceptés, `]-∞;1[`,
  `]-∞;+∞]`, `[-∞;+∞[` refusés ; 50 fiches : 0 erreur de syntaxe. L'audit des claviers n'a plus
  de point ouvert (restent hors audit : débordements horizontaux sur téléphone de Première 14,
  16, 22).

- **Contrôle de cohérence des barèmes (05/10/2026).** Question de David : si la fiche 9 est modifiée
  plus tard, le barème suit-il ? Non : il est fixé dans la fiche, lié aux identifiants de questions
  (question ajoutée = ignorée sans erreur, renumérotée = points sur la mauvaise question). Idées
  écartées par David : « générer un barème » à chaque attribution de devoir (trop lourd) ; alerte
  dans la console du navigateur. **Retenu** : barème par fiche, mis à jour par Claude quand il
  modifie la fiche, avec un contrôle **silencieux sauf écart**, déclenché seulement avant un commit
  qui touche une fiche à barème et avant tout « pousse tout », jamais à chaque message ; en cas
  d'écart, alerte unique et barème corrigé proposé. **Mis en place** : `outils/bareme/controle-bareme.js`
  (fiches à barème, déclaration dans `appliquer-bareme.js`, bloc identique à `fiche-NN.json`, code 2 si
  écart) ; `outils/bareme/controle.html` (300 tirages par fiche, questions sans points / points sans
  question) ; `Bareme.ids()` dans `bareme.js` ; consigne dans `CLAUDE.md` (lu à chaque ouverture, donc
  valable sur les deux machines) et rappels dans les READMEs, `REGLES-FICHES.md`, `SUIVI-FIREBASE.md`.
  **Vérifié** : fiches 2 (31 questions) et 9 (28) cohérentes en 3 s ; détection d'une question
  retirée, d'un identifiant fantôme et d'un JSON modifié, puis retour à l'état initial. Non couvert :
  une fiche modifiée à la main sans passer par Claude (relancer le contrôle sur demande). Idée
  « barème attaché au devoir avec éditeur dans le tableau de bord » : non retenue, restée en
  discussion (voir « Chantiers futurs » si David la veut un jour).

- **Contrôle des barèmes : points de contrôle automatiques retirés (05/10/2026).** David n'en veut
  pas (ni avant chaque commit touchant une fiche à barème, ni avant chaque push) : « je ferai
  attention, on se base là-dessus pour le moment ». La section « Fiches à barème (contrôle
  obligatoire) » de `CLAUDE.md` et les rappels de `REGLES-FICHES.md` et `SUIVI-FIREBASE.md` sont
  supprimés ; **Claude ne lance plus ce contrôle de lui-même**. Les outils restent disponibles à la
  demande (`outils/bareme/controle-bareme.js`, `controle.html`, `Bareme.ids()`). Risque connu et
  accepté : une fiche à barème modifiée (question ajoutée, supprimée, renumérotée) se désynchronise
  sans signal.

- **Débordements horizontaux sur téléphone (05/10/2026).** À la demande de David : Première 14, 16
  et 22 faisaient défiler la page horizontalement à 375 px. **Causes** : fiche 14, tableaux de lois
  et d'effectifs (7 colonnes, police 16 px, marges de 16 px, styles inline) ; fiche 16, longues
  formules MathJax vectorielles dans un énoncé (395 px) ; fiche 22, formule d'une aide (333 px dans
  303). **Correctif** : section 6 de `claviers.js` (CSS injecté, écrans de 560 px au plus, aucun effet
  sur ordinateur), règle générale car les énoncés sont tirés au hasard : tableaux compacts et
  défilant dans leur cadre s'ils dépassent ; formule SVG réduite à la largeur de son bloc ;
  `.q-enonce` autorisé à rétrécir. **Fausses pistes** : `overflow-x: auto` sur `mjx-container` ne
  s'applique pas aux formules « inline » (et `inline-block` les décalerait du texte) ; sur
  `.q-enonce` il faisait apparaître des barres verticales parasites ; avec `overflow-y: hidden` le test
  de rognage a révélé que **7 fiches** (formules en bloc des sommes, Première 7, 9, 10, 17, 18, 19,
  22) étaient rognées de 14 px : règles retirées. **Cas rares trouvés par le test multi-tirages** (un
  tirage sur quatre) : un tableau d'achats dans un énoncé de Seconde 9 (375 px) et, à Première 21,
  le texte d'accessibilité caché de MathJax dont la largeur (calculée avant la réduction) faisait
  défiler la page : règles ajoutées. **Vérifié** : banc `debordement` (4 tirages par fiche, 50
  fiches, 375 px) et 25 tirages sur chacune des fiches 14, 16, 21, 22 et Seconde 9 : aucun débordement ;
  aucun rognage effectif ; 50 fiches : 0 erreur de syntaxe. Limite : un énoncé de la fiche 16 (q-46)
  dépasse de 10 px *dans son bloc* sans élargir la page. Phase `debordement` ajoutée au banc.

- **Première fiches 2, 3 et 4 : coefficient 1, exposants 1, démarche
  (05/10/2026).** Relecture des fiches 1 à 4 demandée par David (fiche 1
  laissée telle quelle) ; seules les corrections ci-dessous ont été faites,
  les automatismes de ces fiches n'ont pas été refondus.
  - **Fiche 2** : un coefficient 1 ne s'écrit plus (« 1x », « 1/1 x² »,
    « 0t »). 2.9 a) (A=1), 2.9 c) (membre de droite : « -t^2<t-2 »,
    « -t^2<-1 » quand le coefficient est nul), 2.10 a) (A=1 : « x² » au lieu
    de « \dfrac{1}{1}x² »), 2.10 b) (« +1x »), 2.11, et les en-têtes de 2.7
    et 2.8 (coefficients ±1). Nouvelles fonctions `coefTete` et
    `coefFracLatex`. Balayage de 600 tirages (énoncés et en-têtes) : plus
    aucun motif « 1x », « 0x », « 1/1 », « +- ».
  - **Fiche 3** : 3.2 a) et b) n'écrivent plus un exposant 1 (« 12 » au lieu
    de « 12^{1} ») et 3.2 a) ne tire plus d'exposant 0 (facteur sans
    intérêt) ; 3.6 et 3.7 : coefficient ±1 devant x² et x non écrit
    (`fmtCubiqueLatex`, `fmtConst3`). 3.6 et 3.7 **non fusionnés** (consigne
    de David). Vérifié : 500 tirages, valeur de 3.2 a) et b) recalculée
    depuis l'énoncé affiché : 0 écart.
  - **Fiche 4** : 4.2, la démarche « en factorisant par n² / n³ » est
    retirée des énoncés et le titre « Factorisations dans des fractions »
    devient « Simplifier les expressions suivantes. ». **Point ouvert** : la
    réponse attendue est l'écriture en 1/n (« (2-1/n+3/n²)/(2+2/n+3/n²) »),
    mais le contrôle accepte toute forme équivalente, y compris la fraction
    d'origine recopiée (vérifié) ; sans l'indication, la consigne ne dit pas
    quelle forme est attendue. À trancher avec David.
  - Vérifié : cycle complet des calculs touchés accepté, mauvaise réponse
    refusée, 0 erreur MathJax, vérificateur : 0 erreur.

- **Première fiche 4, 4.2 : forme attendue contrôlée (05/10/2026).** Suite du
  point ouvert de l'entrée précédente ; David : « oui fais ce que tu
  proposes ». Titre : « Réécrire chaque fraction <mise en valeur>avec
  uniquement des termes constants ou de la forme \(\dfrac{a}{n^k}\)</mise en
  valeur>, au numérateur comme au dénominateur. » (la forme, pas la
  démarche). Nouveau contrôle `estFormeUnSurN` (drapeau `formeUnSurN`) :
  chaque « n » doit être seul (n, n^k, c·n^k) au dénominateur d'une
  division ; l'égalité numérique est vérifiée à part. Refusés : la fraction
  d'origine, « (2-1/n)/(2+2n) », « n/n^2 » ; acceptés : la forme en 1/n et
  ses multiples (« (4-2/n+6/n²)/… »). Aide « ? » ajoutée avec un exemple
  distinct de la réponse. Vérifié : 12 tirages × 2 questions (bonne réponse
  acceptée, fraction d'origine et fausse réponse refusées), 0 erreur
  MathJax.

- **Barème en points de la fiche 1 de Première (05/10/2026).** David : barème
  des fiches 1 à 15 (sauf 9, déjà fait), une fiche à la fois, présenté avant
  de passer à la suivante. Fiche 1 : base 20 points, bonus 8,25 points (1.9 et
  1.10 = calculs avancés). Fichier `outils/bareme/fiche-01.json`, bloc généré
  par `appliquer-bareme.js 01`. Nouvel outil `outils/bareme/cabler-fiche.js NN`
  : pose dans une fiche les accroches du barème (balise, `Bareme.definir`,
  fin de devoir, validation, score, affichage), mêmes que les fiches pilotes.
  Vérifié : page sans erreur MathJax, rien hors devoir, pastilles et note en
  devoir, contrôle de cohérence des fichiers sans écart.

- **Barème de la fiche 2 de Première retouché (05/10/2026).** David : automatismes
  (2.1, 2.2) tous à 0,5 ; 2.3 tous à 0,5 ; 2.5 tous à 0,75 ; 2.4 a) à 1 ; 2.6 a) 0,5,
  b) 0,75, c) 1,5. Base 21 points, bonus 7. **Pas une règle générale** : les automatismes
  ne sont pas tous à 0,5 dans les autres fiches (certains se compliquent), David décide
  au cas par cas.

- **Première fiche 3 : 3.5 d) supprimé, deux défauts du corrigé de 3.8, barème
  (05/10/2026), 25 → 24 questions.** David : « supprime la question 3.5 d) ».
  3.5 passe à 3 questions (a, b, c) ; groupes 3.6 à 3.8 décalés d'un rang.
  - **3.8 a) et b)** : le corrigé affichait du bruit de calcul
    (« √2,9999999999999996 ») ; le radicande est maintenant arrondi.
  - **3.8 d)** : un ensemble vide s'affichait « {undefined} » ; le corrigé
    montre désormais « ∅ » (la saisie de ∅ était déjà acceptée).
  - **Barème** (`outils/bareme/fiche-03.json`, outil `cabler-fiche.js`) : base
    18,25 points, bonus 6,75 (3.8 = calculs avancés). Retouches de David :
    3.2 b) 0,5 ; 3.6 a) 0,5 ; 3.6 c) 1. Le total de base n'est pas entier :
    **à revoir avec David** (règle du README).
  - Vérifié : 40 tirages de 3.8 sans bruit ni « undefined », cycle complet
    8 × 24 accepté (ensembles saisis en `\{…\}` et ∅), 0 erreur MathJax,
    vérificateur : 0 erreur, contrôle des barèmes : questions tirées toutes
    pointées.

- **Barème de la fiche 3 de Première : total de base entier (05/10/2026).** David : première
  option proposée. 3.5 a) 1, 3.2 c) 1, 3.6 a) 0,75. Base 19 points, bonus 6,75.

- **Barème de la fiche 4 de Première (05/10/2026).** David : automatismes 4.1 et 4.2 à
  0,5 (rien de compliqué) ; 4.3, 4.4 et 4.5 à 1 point chaque question (il faut avoir compris
  la tangente et le coefficient directeur) ; puis 4.1 c) à 1 pour un total entier. Base 9
  points, bonus 11 (4.6, problème guidé, calculs avancés). Fichier `outils/bareme/fiche-04.json`.

- **Barème de la fiche 5 de Première (05/10/2026).** Base 22 points, bonus 6,75 (5.10, calculs
  avancés). Automatismes 5.1 et 5.2 à 0,5, 5.3 b) 0,75 ; retouches de David : 5.9 b) et c) à 1,
  5.8 b) à 1, 5.5 b) à 0,75. Fichier `outils/bareme/fiche-05.json`.

- **Barème de la fiche 5 de Seconde (Identités remarquables) (05/10/2026).** Premier barème
  hors Première. Base 20 points, bonus 8 (5.7, calculs avancés). Les 12 automatismes
  (5.1 à 5.3) à 0,5 ; calcul littéral mieux doté (5.4 : 1, 1, 1, 1,25 après +0,25 demandé
  par David ; 5.5 et 5.6 de 0,75 à 1,25). Fichier `outils/bareme/fiche-S05.json` (préfixe S =
  Seconde) ; `cabler-fiche.js S05` et `appliquer-bareme.js S05` ; `controle-bareme.js` lit
  désormais les clés S05. Vérifié : 30 questions tirées toutes pointées, rien hors devoir,
  0 erreur MathJax.

- **Guide de l'élève (PDF) adapté aux barèmes (05/10/2026).** Page 9 (Devoirs 1/2) : nouvelle
  section « Le barème : des points sur chaque question » (pastille de points sur chaque
  question et total en tête, visibles dans un devoir seulement ; note en points ; **calculs
  plus avancés = bonus** : une bonne réponse s'ajoute à la note et au total, une réponse
  fausse ou absente ne change rien, sans pénalité ; hors devoir, pas de points). Page 3 : le
  bloc « Calculs plus avancés » renvoie à cette section. Page 9, colonne « Faits » : la
  meilleure note est en points quand la fiche a un barème. Page 7 : capture des panneaux
  réduite (64 % → 40 %), le rendu avec Edge débordait de 42 px sur le pied de page.
  PDF régénéré avec `playwright-core` et le navigateur Edge (`channel: 'msedge'`) faute de
  `playwright` complet sur cette machine ; mêmes réglages que `outils/guide-eleve/pdf.js`.

- **Barème de la fiche 6 de Première (05/10/2026).** Base 14 points, bonus 5,5 (6.9 et 6.10,
  calculs avancés). Automatismes 6.1 à 6.3 à 0,5, 6.4 à 0,75 ; 6.6 a) et 6.7 a) à 1,5
  (dériver une composée sans connaître f). Fichier `outils/bareme/fiche-06.json`.

- **Barème de la fiche 7 de Première (05/10/2026).** Base 19 points, bonus 11,5 (7.10 à 7.14,
  calculs avancés). Retouches de David : 7.2 a) 0,75 et b) 1 ; 7.4 c) 0,75 ; 7.8 a) 1,25 et
  b) 1,5 ; 7.9 1,5 ; puis 7.3 b) à 0,5 pour un total entier. Fichier `outils/bareme/fiche-07.json`.

- **Barème de la fiche 8 de Première (05/10/2026).** Base 22 points, bonus 5 (8.10 à 8.12,
  calculs avancés). Points de David : 8.1 b) 0,75 ; 8.2 a) 0,75 ; 8.3 a) 0,5 ; 8.4 à 0,5 par
  question ; 8.5 à 1 par question ; 8.6 à 0,5 par question. Fichier `outils/bareme/fiche-08.json`.

- **Première fiche 10 : exposants fractionnaires lisibles, barème (05/10/2026).** David : l'expression
  de 10.6 b) (« e^{1/(x+2)} », fraction en exposant) est difficilement lisible. Tout exposant
  contenant une fraction s'écrit maintenant `\exp\left(\dfrac{a}{b}\right)` (grandes parenthèses,
  fraction pleine taille), dans les énoncés et les corrigés (10.5 b), c), d), 10.6 b)) ; les autres
  exposants restent en e^{…} (règle de la notation e^x conservée). `expVersPuissance` traite aussi
  les e^{\frac…} écrits directement par un générateur. Conséquence corrigée : `estFactorise`
  refusait un numérateur réduit à un facteur unique saisi « exp(1/x) » (FunctionNode) ; il est
  maintenant accepté.
  **Barème** (`outils/bareme/fiche-10.json`) : base 16 points, bonus 8,5 (10.8 et 10.9, calculs
  avancés), validé par David.
  Vérifié : 160 corrigés retapés acceptés, mauvaise réponse refusée, 0 erreur MathJax.

- **Première fiche 10 : exposant fractionnaire, retour à e^{…} (05/10/2026).** David : la notation
  exp(…) de l'entrée précédente ne convient pas, il veut e^ avec une fraction en exposant
  légèrement agrandie. Retenu : `e^{\textstyle\frac{a}{b}}` (la fraction passe de la taille
  d'exposant à la taille de texte ; `\dfrac` en exposant, testé, est trop grand). Dans
  `expVersPuissance`, les deux passes produisent ce format ; les exposants sans fraction ne
  changent pas. Le correctif de `estFactorise` (facteur unique `exp(...)` accepté) est conservé.
  Vérifié : 167 énoncés à exposant fractionnaire au nouveau format, aucun ancien format ni
  « \exp » restant, 160 corrigés retapés acceptés, 0 erreur MathJax.

- **Barème de la fiche 11 de Première (05/10/2026).** Base 14 points, bonus 5 (11.8 et 11.9, calculs
  avancés). Points de David : 11.1 a) 0,75 ; 11.6 a) 0,5. Fichier `outils/bareme/fiche-11.json`.

- **Barème de la fiche 12 de Première (05/10/2026).** Base 17 points, bonus 6,5 (12.8 et 12.9, calculs
  avancés). Points de David : 12.1 a) 0,75 et b) 1 ; 12.7 a) 1,5 et b) 1,25 (+0,25 chacune).
  Fichier `outils/bareme/fiche-12.json`.

- **Barème de la fiche 13 de Première (05/10/2026).** Base 21 points, bonus 9,75 (13.9 et 13.10, calculs
  avancés). Points de David : 13.1 a) 0,5 et b) 1,25 ; 13.3 b) 0,5 ; 13.6 c) 0,75 ; 13.7 c) 1.
  Fichier `outils/bareme/fiche-13.json`.

- **Barème de la fiche 14 de Première (05/10/2026).** Base 30 points, bonus 13 (14.15 à 14.18, calculs
  avancés). Points de David : 14.4 c) 0,5 ; 14.5 d) 0,5 ; 14.6 à 0,75 par question ; 14.13 a) 0,5 ;
  14.14 à 0,75 par question ; puis 14.9 b), 14.9 c) et 14.10 c) à 0,75 pour un total entier.
  Fichier `outils/bareme/fiche-14.json`.

- **Barème de la fiche 15 de Première (05/10/2026).** Base 24 points, bonus 15 (15.11 à 15.14, calculs
  avancés). Points de David : 15.3 b) 0,5 ; 15.4 d) 1 ; 15.5 à 0,75 par question ; 15.6 c) 1 ; puis
  15.2 a) 0,75 pour un total entier. Fichier `outils/bareme/fiche-15.json`. Avec cette fiche, les
  barèmes des fiches 1 à 15 de Première sont posés (la 9 l'était déjà).

- **Première fiche 16 (Généralités sur les vecteurs) : refonte (05/10/2026), 55 → 43 questions,
  19 → 18 calculs.** David : « fiche 16 », puis réductions à deux questions des anciens 16.6, 16.9,
  16.12 et 16.14.
  - **Deux réponses attendues fausses corrigées** : ancien 16.10 c) (nouveau 16.8 d)) — le
    coefficient k du calcul n'apparaissait pas dans l'énoncé (« ½(…) − ½… » au lieu de
    « k(…) − k… ») : la bonne réponse était refusée à chaque tirage ; ancien 16.6 a) (nouveau
    16.7 a)) — l'énoncé affichait « (B − α) » alors que la réponse était calculée pour
    « B(1 − α) » (faux dans 86 tirages sur 150). Tirage dégénéré exclu : ancien 16.14 d)
    (nouveau 16.13 b)) donnait « AB = 0·CD » dans 15 % des tirages.
  - **Automatismes** (16.1 à 16.3, modèle de Première) : (x+p)²−(x+q)² ◊ c (premier degré après
    développement) et k/x ◊ m (inverse, valeur interdite 0) ; a/x + b/(x+c) = d (même
    dénominateur, deux racines entières) et x²−2kx+k² = m² (carré à reconnaître) ; fraction avec
    parenthèses (fraction irréductible contrôlée) et (a ± c√n)² sous la forme p + q√n (forme
    contrôlée). Remplacent les développements et les fractions en q (titres qui donnaient la
    démarche, « −1(…) » affiché, corrigé non simplifié).
  - **Fusions et réductions** : 16.7 Équations vectorielles = anciens 16.6 a) + 16.11 a)
    (2 questions, réponses en ensemble) ; 16.8 Simplifications = anciens 16.7 a), d) + 16.10 b),
    c) ; 16.10 = ancien 16.9 a), c) ; 16.11 = ancien 16.12 a), b) ; 16.13 = ancien 16.14 b), d).
    Renumérotation : ancien 16.3→16.4, 16.4→16.5, 16.5→16.6, 16.8→16.9, 16.13→16.12,
    16.15→16.14, 16.16→16.15, 16.17→16.16, 16.18→16.17, 16.19→16.18 (table
    `RENUMEROTATION_16` en fin de générateur). Titres ajoutés : 16.5 « Vecteurs sur un
    quadrillage », 16.6 « Une somme de vecteurs », 16.10 « Décomposer un vecteur », 16.11
    « Décomposer avec un paramètre », 16.15 « Trois points alignés », 16.16 « Colinéarité avec un
    paramètre ». Plages élargies pour 16.7 (24 → 58 et 13 → 35 énoncés distincts).
  - **Brouillon** : les vecteurs de la figure 16.5 et les données de 16.14 et 16.15 sont
    désormais enregistrés avec le brouillon (`etatSupplementairePourBrouillon`) ; avant, la
    reprise redessinait une figure différente des questions.
  - Vérifié : 300 tirages recalculés indépendamment (intervalles sur grille, racines par
    substitution et comptage, valeurs numériques, combinaisons vectorielles sur points
    aléatoires, unicité de α) : 0 écart ; cycle complet 8 × 43 accepté, mauvaises formes
    refusées ; brouillon restauré à l'identique (200 essais) ; 0 erreur MathJax ;
    vérificateur : 0 erreur.

- **Première fiche 16 : titres de 16.10 et 16.11 (05/10/2026).** David : 16.10 a) « incompréhensible
  d'après le titre ». « Décomposer un vecteur » (terme inventé à la refonte) remplacé par
  « Relation de Chasles. A, B et C désignent trois points du plan. Écrire u sous la forme
  aAB + bAC » (forme mise en valeur) ; 16.11 : « … sous la forme kAB, où k dépend de α ».

- **Lettres des QCM centrées dans leur cercle (05/10/2026), 26 fiches de Première.** David : « dans
  les QCM, le b n'est jamais bien centré dans le cercle ». Cause : la boîte de la police (Georgia
  italique 12,5 px) est centrée, pas le dessin de la lettre ; une lettre à jambage montant (b, d)
  monte de 2 px par rapport à a, c, e (mesuré). Correctif : classe `q-qcm-lettre-haute`
  (`padding-top: 4px`, la boîte reste de 20 px grâce à `box-sizing: border-box`) posée par le
  gabarit des options sur b, d, f, h, k, l. Mêmes CSS et gabarit dans les 26 fiches concernées.

- **Première fiche 16 : calcul 16.13 supprimé (05/10/2026), 43 → 41 questions, 18 → 17 calculs.**
  David : « supprimer 16.13 » (« Un vecteur en fonction d'un autre », anciens 16.14 b) et d)).
  16.14 → 16.13 (Point particulier d'un triangle), 16.15 → 16.14 (Trois points alignés), avancés
  16.16 → 16.15, 16.17 → 16.16, 16.18 → 16.17 ; grilles, textes (`texte-16-13`, `texte-16-14`),
  `RENUMEROTATION_16` et `groupes` mis à jour. Vérifié : 5 × 41 corrigés acceptés, brouillon
  restauré à l'identique (100 essais), 0 erreur MathJax, vérificateur : 0 erreur.

- **Première fiche 16 : 16.16 (propriété du milieu) réduit à une question (05/10/2026), 41 → 38
  questions.** David : « 16.16 un exemple suffit ». Gardée : la simplification tirée au hasard
  (ancien 16.18 d), la plus complète, réponse kMN) ; retirées : MA+MB en fonction de MI, BC en
  fonction de IJ, −kAB−IA+BI. Le milieu J de [AC] ne servant plus, l'introduction ne mentionne
  que I. Vérifié : 300 tirages recalculés avec I milieu de [AB] (0 écart), corrigé accepté.

- **Première fiche 16 : 16.12 b) et 16.15 b) supprimés (05/10/2026), 38 → 36 questions.** David :
  « 16.15 supprimer b). 16.12 supprimer b). » 16.12 (colinéarité sur la figure) garde
  u + ½v (→ AB) et v + u + ½w (→ EF) ; le vecteur p de la figure, qui ne servait qu'à la question
  retirée, est effacé (CD reste comme réponse possible du QCM). 16.15 (colinéarité avec un
  paramètre) garde les anciens a) et c). Vérifié : 5 × 36 corrigés acceptés, 0 erreur MathJax.

- **Barème de la fiche 16 de Première (05/10/2026).** Base 22 points, bonus 11 (16.15 à 16.17,
  calculs avancés). Points de David : 16.1 b) 0,5 ; 16.7 a) 0,5 ; 16.10 a) et b) 0,5 ; 16.11 a)
  et b) 1 ; puis 16.5 b) 1 pour un total entier. Fichier `outils/bareme/fiche-16.json`, câblage
  par `cabler-fiche.js 16`. Contrôle : 36 questions tirées, toutes pointées.

- **Première fiche 16 : 16.15 b) supprimé, barème régénéré (05/10/2026), 36 → 35 questions.**
  David : « 16.15 supprimer b) et regénérer le barème ». 16.15 (colinéarité avec un paramètre)
  garde une seule question (ancien 16.17 a)), introduction mise au singulier. Barème : 16.15 à
  1,5 ; base 22 points inchangée, bonus 11 → 9. Contrôle : 35 questions tirées, toutes pointées.

- **Première fiche 17 (Coordonnées des vecteurs) : refonte (05-06/10/2026), 44 → 43 questions,
  15 → 14 calculs.** David : « refais la refonte d'après tes commentaires (écarts avec les règles
  et corrige les réponses justes refusées, notamment le pb alpha) ».
  - **Paramètre α** : les énoncés écrivaient α mais les réponses attendaient « a » (champs de
    couples, α refusé) ou λ (champs mathématiques), et les corrigés affichaient a ou λ. Variable
    interne unique « lam » ; `normaliserSaisie` convertit α, λ et « alpha » ; le clavier propose
    une touche α ; `jsVersLatex` affiche α. Ménélienne : r au lieu de « b pour désigner r » (r ajouté
    aux variables de `checkEqualNumeric`).
  - **Automatismes** : 17.1 a) degré 1 avec coefficient fractionnaire (ancien 17.1 c), sans
    « (5x−1) » ni « −5x− » vide), b) (ax+b)/(x²+k) ◊ 0 ; 17.2 a) (px+q)²−(rx+s)²=0, b)
    (x+a)²+2b(x+a)+b²=0 (anciennes factorisations devenues équations) ; 17.3 a) (a/b)²+(c/d)²
    (fraction irréductible contrôlée), b) √(a²+b²) (racine simplifiée contrôlée).
  - **Fusions** : 17.5 = anciens 17.4 b) + 17.5 avec les mêmes points (« même méthode que dans
    l'exercice précédent » supprimé, l'étape « coordonnées de AB » retirée) ; 17.6 = anciens 17.6 +
    17.7 (« Paramètres et égalité de vecteurs »). Ancien 17.3 b) (radicaux) tiré au hasard.
    Titres ajoutés partout. Affichage « 2 × −2α » remplacé par le coefficient calculé.
  - **Corrigés** : α, plus de « × » devant une lettre ou une racine, signe devant la fraction.
  - **Brouillon** : `contexte22` (points de 17.5, vecteurs de 17.7) enregistré et restauré.
  - Vérifié : 300 tirages recalculés indépendamment (intervalles, équations, calculs numériques,
    coordonnées, valeurs de α) : 0 écart ; cycle complet 8 × 43 accepté avec α tapé dans les
    champs de couples ; mauvaises réponses refusées ; brouillon restauré (50 essais) ; 0 erreur
    MathJax ; vérificateur : 0 erreur.

- **Première fiche 17 : coordonnées saisies dans un champ mathématique, parenthèses exigées
  (06/10/2026).** David : en 17.4 c), « la touche ^ (sur PC) ou le bouton xⁿ du clavier n'affiche pas
  de champ pour une puissance mais juste le symbole ^ », et l'aide doit imposer les parenthèses
  (« nomenclature mathématique exigée »), à vérifier dans toute la fiche.
  - Toutes les réponses de type couple (coordonnées de vecteur ou de point, couples (α;β)) passent
    d'un champ texte à un champ MathLive (`TYPES_MATHFIELD` + 'paire') : ^, fractions, racines et α
    s'écrivent en mathématiques.
  - Parenthèses exigées pour toutes ces réponses (`checkPointCoordonnees`) ; aides réécrites
    (vecteur, point, couple) avec le point-virgule du clavier de l'écran (⇧ puis }) ; texte grisé
    « (x;y) » partout.
  - `normaliserSaisie` : « )( » et le produit implicite écrit avec une espace par MathLive (« p q »)
    deviennent des produits explicites (sinon « (1)/(3)(α−1)² » se lisait 1/(3(α−1)²) et « pq »
    comme une seule variable : 17.8 b) et 17.13 e) refusaient la bonne réponse).
  - Vérifié : cycle 8 × 43 accepté, réponses sans parenthèses refusées, mauvaises réponses
    refusées, 0 erreur MathJax.

- **Multiplication écrite × dans tous les claviers (06/10/2026), 50 fiches.** David : la touche * (ou ×)
  doit afficher le symbole × comme dans les corrigés, et non un point. Cause : la touche × du clavier
  MathLive insère `\cdot` (le × n'est qu'en Maj), et `*` tapé donne `*` dans un champ mathématique.
  Correctif dans `assets/js/claviers.js` (chargé par les 50 fiches) :
  - clavier MathLive : touche × = `\times` (le point passe en Maj) ;
  - champ mathématique : `*` tapé (clavier du PC, collé) devient `\times` ; touche × des claviers
    simplifiés = `\times` ;
  - champ texte : `*` tapé ou inséré par une touche devient « × » ; `valeurDuChamp` remet « * » à
    la lecture (les correcteurs lisaient déjà ×, ceinture et bretelles) ; un brouillon repris avec
    « * » affiche « × » au focus.
  Vérifié par frappe réelle (3*4 → 3×4 dans un champ mathématique, ]-3*2;4[ → ]-3×2;4[ dans un
  champ texte) et cycles complets : fiche 17 de Première (215 questions), fiche 12 de Première
  (92), fiche 5 de Seconde (120) : 0 refus, 0 erreur MathJax. Pages d'automatismes non traitées
  (elles ne chargent pas `claviers.js`).

- **Claviers : bouton ⌨ sans correction prématurée, xⁿ et ^ avec case à remplir (06/10/2026), 50 fiches.**
  Retours de David sur la fiche 17 (correctif dans `assets/js/claviers.js`, section 6) :
  - cliquer sur ⌨ en cours de rédaction déclenchait « À revoir » : dans un champ texte, le clic
    retirait le focus (maintenant `mousedown` sans action par défaut) ; dans un champ mathématique,
    c'est MathLive lui-même qui fait perdre puis rend le focus au champ, environ 0,9 s après le clic
    (`toggleVirtualKeyboard`) : ce blur passager est écarté pendant 2 s après un clic sur ⌨ (un vrai
    blur, par exemple un clic ailleurs, corrige toujours) ;
  - touche xⁿ des claviers simplifiés (champs texte) : insère `^(▢)` avec ▢ sélectionné (comme √ et
    a/b), `→` ou la flèche droite sort de la parenthèse ; la touche ^ du clavier physique dans un champ
    texte fait de même (touche morte AZERTY gérée par deux chemins, non testée sur un vrai AZERTY) ; les
    champs mathématiques avaient déjà la case d'exposant de MathLive ;
  - « * » affiché au lieu de × : non reproduit après rechargement (champ texte et champ mathématique
    affichent ×) ; cause probable : ancienne version de `claviers.js` restée en cache du navigateur →
    recharger sans cache (Ctrl+F5).
  Vérifié par frappe réelle sur la fiche 17 (champ texte et champ mathématique) et la fiche 5 de
  Seconde ; vérificateur de syntaxe : 50 fiches, 0 erreur.

- **Première fiche 17, calcul 17.4 : coordonnées exigées sous forme simplifiée (06/10/2026).** David : en
  17.4 c), recopier les coordonnées sans les simplifier était accepté alors que le titre demande de
  simplifier (le contrôle ne comparait que la valeur numérique). Nouveau drapeau `coordSimplifiees` sur
  17.4 a–d et fonction `estCoordSimplifiee` : chaque coordonnée doit être, sans paramètre, un entier, une
  fraction irréductible ou une racine simplifiée (« 6√7/7 » et « (6/7)√7 » acceptées, « √8 » refusée) ;
  avec paramètre, aucun calcul numérique restant (« 3×2×2ⁿ », « 4/6 », « ×1 », « +0 » refusés, facteur
  entier du numérateur commun avec le dénominateur refusé) et pas plus long que la réponse attendue
  (+2 nœuds : 8×3^(2n) toléré pour 8×9ⁿ ; 2^(n+1) accepté pour 2×2ⁿ). Aide du bouton « ? » complétée.
  Vérifié : réponse attendue acceptée sur 1 200 tirages, 0 écriture non simplifiée acceptée parmi 5
  variantes × 1 200, saisie réelle sur 17.4 c). Les autres calculs de coordonnées (17.12 milieu, 17.9
  normes déjà contrôlées) n'ont pas de consigne de simplification dans leur titre : non modifiés.

- **Première fiche 17 : 34 questions, 13 calculs (06/10/2026).** Demandes de David après relecture :
  - 17.4 : a) devient un cas à coordonnées entières (nouvel item), l'ancien d) (avec α) est supprimé ;
    titre « Calculer les coordonnées du vecteur AB, **sous forme simplifiée** » (partie en bleu comme
    en 17.3) ;
  - 17.6 : questions rédigées « On considère A(…) et B(…), où α ∈ ℝ. Déterminer α tel que AB = u » (c :
    « où α et β sont deux réels. Déterminer le couple (α;β) tel que AB = 0 ») ; titre réduit à
    « Paramètres et égalité de vecteurs » (la consigne n'y est plus, elle est dans chaque question,
    car a/b et c n'ont pas la même) ;
  - 17.9 : d) supprimé (3 questions) ; 17.11 : a) cas simple sans paramètre (u = λv à coordonnées
    entières, λ fraction irréductible ≠ 1, tirage aléatoire), b) garde le cas avec paramètres α et n
    (l'ancien a) à α est retiré) ; 17.12 : deux exemples, a) sans paramètre (fractions), b) avec
    paramètre (ancien c) ; anciens b) racines et d) retirés ;
  - ancien 17.13 (ménélienne, avec sa figure et `construireGraphique22_19`) supprimé ; l'ancien
    17.14 (déterminant) devient 17.13 et reste dans « Calculs plus avancés » ;
  - identifiants renumérotés (table `RENUMEROTATION_17`, groupes `grille-17-1` à `grille-17-13`,
    indices 0 à 33). Pas de barème encore fait pour cette fiche : rien à régénérer.
  Vérifié : 500 tirages (17.4 a, 17.11 a recalculés indépendamment ; réponses modèles de 17.4
  acceptées), 25 cycles complets (650 réponses modèles acceptées dans les champs mathématiques), mauvaises
  réponses refusées, 0 erreur MathJax, 0 erreur console, vérificateur de syntaxe 50 fiches.

- **Première fiche 17, calcul 17.9 : forme simplifiée imposée (06/10/2026).** David : 17.9 doit imposer
  une forme simplifiée. Titre « Calculer la norme du vecteur AB, **sous forme simplifiée** » (en bleu),
  drapeau `normeSimplifiee` sur 17.9 a–c et fonction `estNormeSimplifiee` (outils communs regroupés dans
  `FORME17`, partagés avec `estCoordSimplifiee` de 17.4). Sans paramètre : entier, fraction irréductible ou
  racine simplifiée (« 3√7/5 » et « (3/5)√7 » acceptées ; √63/5, √(63/25), 6√7/10, √32 refusées).
  Avec paramètre (17.9 c) : produit d'au plus un entier ≥ 2, de racines d'entiers sans facteur carré et de
  racines de polynômes sans facteur carré commun à tous les coefficients, écriture courte (≤ 11 nœuds) :
  k√(2α⁴+2) et k√(2(α⁴+1)) acceptés ; la somme de carrés recopiée, √(18α⁴+18) pour 3√2√(α⁴+1), ×1 refusés.
  Aide du « ? » ajoutée. Correctif au passage : la réponse attendue de 17.9 c) s'écrivait « 1*√2… »
  quand k = 1. Vérifié : réponse attendue acceptée sur 1 500 tirages, 17 écritures testées, 20 cycles
  complets (520 réponses), 0 erreur MathJax.

- **Première fiche 17, calculs 17.5 et 17.12 : forme simplifiée imposée (06/10/2026).** David (« oui » à la
  proposition faite après 17.9). Titres : « Un point défini par une égalité de vecteurs. Donner ses
  coordonnées **sous forme simplifiée** » et « Milieu d'un segment. Calculer les coordonnées du vecteur AI,
  où I est le milieu du segment [AB], **sous forme simplifiée** » ; drapeau `coordSimplifiees` (contrôle
  `estCoordSimplifiee`, voir 17.4) sur 17.5 a–d et 17.12 a–b ; aide des points complétée. Vérifié : 500
  tirages (réponses attendues acceptées, 4 variantes non simplifiées refusées), 20 cycles complets (520
  réponses), 0 erreur MathJax. Non touchés (pas de consigne de simplification) : 17.6, 17.7, 17.8.

- **Barème de la fiche 17 de Première (06/10/2026) : base 30 points, bonus 7 points.** Fichier
  `outils/bareme/fiche-17.json` (34 questions), fiche câblée (`cabler-fiche.js 17`) et `appliquer-bareme.js`
  étendu à la fiche 17. Bonus (E) = les 4 questions du calcul 17.13 (déterminant). Contrôle de
  cohérence : fichiers cohérents, 34 questions tirées sur 300 générations, toutes avec points ; affichage
  « Total : 30 points (+ 7 points de calculs avancés) » vérifié. Proposition à valider par David.

- **Barème de la fiche 17, ajustements de David (06/10/2026) : base 26 points, bonus 7 points.** Points
  modifiés : 17.1 a) 0,5 ; 17.1 b) 0,5 ; 17.2 a) 0,75 ; 17.4 b) 0,5 ; 17.5 b) 0,75 ; 17.5 c) 1 ; 17.5 d) 1 ;
  17.6 b) 1,25 ; 17.6 c) 1,5 ; 17.9 a) 0,5 ; 17.9 b) 1 ; 17.12 a) 0,5 ; puis 17.11 b) 1,25 (option 3
  choisie pour obtenir un total de base entier : 26,5 → 26). Contrôle de cohérence : fichiers cohérents.

- **Première fiche 18 (Fonctions trigonométriques I) : revue et corrections (06/10/2026), 31 questions inchangées.**
  Revue contre REGLES-FICHES.md (calculs vérifiés indépendamment : 18.4, 18.5, 18.8 sur 7 200 tirages,
  18.10 et 18.11 sur 4 000, corrigés retapés 930/930 avant corrections). Corrections demandées par David
  (« corrige tout ce que tu as relevé ») :
  - **Rendu** : « cos » et « sin » des énoncés 18.4 et 18.5 s'affichaient en italique (code LaTeX sans
    `\`) → `\cos`, `\sin`.
  - **Automatismes (règle de diversité)** : les six questions n'étaient que des conversions d'angles et des
    sommes de fractions de π. Nouveau 18.1 : inéquation du 1er degré avec parenthèses des deux côtés
    m(px+q) ◊ n(rx+s) (|m|,|n| ≥ 2) + inéquation produit (ax+b)(cx+d) ◊ 0, réponse en intervalle ;
    18.2 : équation k₁/(x+b)=k₂/(x+d) + valeur absolue |ax+b|=c, réponse en ensemble (clavier
    d'ensemble `groupeEnsembleClavier` repris de la fiche 17) ; 18.3 : conversions (a) radians → degrés,
    (b) degrés → radians en fraction de π irréductible, angles tirés dans ]0 ; 2π[ avec dénominateurs
    2 à 20 (22,5° compris en b) ; le rappel de la formule de conversion passe devant 18.3. Les sommes de
    fractions de π sont retirées. Ids 18.1 à 18.3 a/b inchangés mais **contenu entièrement nouveau**
    (un devoir en cours sur cette fiche changerait de questions).
  - **Formes imposées** (`formeValeur`, `estValeurSimplifiee`, `estRacineSimplifiee` reprise de la
    fiche 17) : 18.4, 18.5, 18.8, 18.10, 18.11 « sous forme simplifiée » (0, entier, fraction irréductible,
    racine simplifiée ; `√2/2` accepté, `√8/4`, `1/√2`, `2√2/4` refusés ; « (1/2)√3 » accepté) ; titres
    avec la partie imposée en bleu. 18.3 b) : fraction de π irréductible contrôlée (titre « sous la forme d'une
    fraction de π irréductible »). Le zéro est accepté (cos(3π/2)).
  - **Unité** : « 75° » (ou ^\circ, « deg ») accepté en 18.3 a) (`uniteDegre`), aide complétée.
  - **Intervalles à point-virgule** : options de 18.7 b), 18.9 b), énoncés 18.10 et 18.11.
  - **18.6** : consigne commune (« Dans chaque cas… Quelle est l'affirmation juste ? ») dite une fois dans
    l'introduction ; questions « Fonction cos, avec 0 ≤ t₁ < t₂ ≤ π/2 »… (plus de « Même question pour sin »).
  - **Titres** : 18.9 « Parité et périodicité de la tangente », 18.11 « Avec la tangente ».
  - **18.9 b)** : `tan(x)`, `-tan(x)`, « tan x », `\tan(x)` tolérés (`tolereTan`, `checkTanTolerant`) ;
    trois familles de questions : tan(x ± nπ), tan(nπ − x), tan(−x ± nπ), n de 1 à 9 (45 énoncés).
  - **Variété** (600 tirages) : 18.1 a/b 600, 18.2 a/b 586/496, 18.3 93/96, 18.4 32 (au lieu de 16 : deux cos et
    deux sin dans un ordre tiré), 18.5 117-122, 18.9 b 45 (au lieu de 8), 18.10 48/110, 18.11 a 80,
    b 28 (au lieu de 4), c 76 (au lieu de 4). 18.8 reste à 14 : tableau fini des angles remarquables.
    18.5 ne tire plus d'angle déjà dans [0 ; 2π[. 18.10/18.11 : x dans un quadrant tiré (signe des
    réponses variable), réponses toujours réduites (`surdFrac`), signe devant la fraction dans les énoncés.
  - **Corrigés** : signe moins devant la fraction même avec un numérateur à accolades emboîtées
    (`signeDevantFraction` : « −√2/2 » et non « (−√2)/2 » ; l'ancien motif ne traitait que « −4 »).
    Constaté aussi dans la fiche 17 (même motif) : non corrigé, à faire si David le demande.
  - Code mort supprimé (variables inutilisées de 18.3, commentaires d'anciens numéros).
  Vérifié : 31 questions, 11 groupes, 0 erreur MathJax ; calcul indépendant des nouvelles questions
  (inéquations testées sur des points et aux bornes avec inclusion, équations par substitution,
  conversions, périodicité) 1 000 à 10 200 tirages sans écart ; cycle complet 30 × 31 = 930 réponses
  acceptées (intervalles et ensembles saisis au clavier texte) ; écritures non simplifiées refusées (22
  cas) ; audit des claviers d'intervalles (`reels`) OK ; captures des sections modifiées.

- **Première fiche 18 : mesure principale, 18.10 dans le cœur (06/10/2026), 35 questions, 12 calculs.**
  Demandes de David après la revue :
  - le rappel de conversion radians/degrés est **dans** le calcul 18.3 (après son titre) ;
  - **nouvelle section « Mesure principale d'un angle » (calcul 18.4)** avant les valeurs particulières :
    4 questions du plus simple au plus délicat, réponse en fraction de π irréductible dans ]−π ; π] :
    a) angle entre π et 2π (un seul tour), b) négatif au-delà de −π, c) plusieurs tours (|p/q| entre 3
    et 9), d) grand multiple du type 1231π/6 (numérateur de 101 à 2999, dénominateur 2, 3, 4, 5, 6, 8,
    10 ou 12). Rappel « mesure principale = unique mesure dans ]−π ; π] » dans le calcul ;
  - **« Autres angles » (18.6)** : angles dont la mesure principale doit être cherchée (hors ]−π ; π],
    c'est-à-dire k > 12 ou k ≤ −12 en douzièmes de π, mesure principale « même simple » comprise : 7π/6,
    5π/4, 19π/6, −13π/4…) ;
  - **« Connaissant l'un, déduire l'autre » quitte les calculs avancés** : devenu 18.7, dans une section
    « Relation entre cosinus et sinus » juste après « Autres angles » (rappel de cos²+sin²=1 inclus dans le
    calcul, reformulé « On pourra utiliser… ») ;
  - renumérotation : 18.4 mesure principale, 18.5 premiers angles, 18.6 autres angles, 18.7 connaissant
    l'un, 18.8 monotonie, 18.9 comparaison sin/cos, puis avancés 18.10 valeurs de tan, 18.11 parité et
    périodicité, 18.12 avec la tangente. Groupes `grille-18-1` à `grille-18-12`, indices 0 à 34. Pas de
    barème sur cette fiche : rien à régénérer.
  Vérifié : calcul indépendant de la mesure principale (3 200 tirages), de l'angle hors ]−π ; π] et de
  la valeur trigonométrique en 18.6 (3 200), des valeurs de 18.7 et 18.12 (3 500) ; cycle complet
  15 × 35 = 525 réponses acceptées, angle équivalent modulo 2π ou fraction non réduite refusés ; 0 erreur
  MathJax ; captures. **Incident de la session, sans suite** : un premier lancement du script avait
  supprimé tous les « @ » de la page (adresse MathLive, règles `@media`) ; détecté par l'absence de
  MathLive, fiche restaurée et script corrigé avant tout commit.

- **Première fiche 18, 18.6 : deux angles de grande mesure (06/10/2026).** David : prendre deux angles de
  mesure vraiment plus grande, pour obliger à déterminer d'abord la mesure principale (une lecture sur un
  cercle ne suffit plus). 18.6 a) et b) restent « moyens » (de 1 à 4,8 demi-tours, hors ]−π ; π]) ;
  18.6 c) et d) tirent des angles d'au moins 8π et jusqu'à environ 42π (numérateurs jusqu'à plusieurs
  centaines, ex. −143π/6, 121π/6, 113π/3). Vérifié : valeurs recalculées sur 3 200 tirages sans écart,
  amplitudes mesurées (c et d : de 8,0π à 41,8π), 570 énoncés distincts par question, cycle complet 48
  réponses acceptées.

- **Première fiche 18, 18.7 : plus aucun rappel de formule (06/10/2026).** David : « 18.7 aucun rappel de
  formule ». Le rappel « On pourra utiliser la formule cos²(x)+sin²(x)=1 » est retiré (la formule fait partie
  de ce que l'élève doit connaître ; consigne déjà dite : rien qui indique la démarche). Aucun autre
  changement ; les rappels de définition (conversion en 18.3, mesure principale en 18.4, tangente avant
  18.10) sont conservés.

- **Première fiche 18, 18.4 : rappel de la définition de la mesure principale retiré (06/10/2026).** David :
  « enlève la mesure principale » (interprété comme le rappel « La mesure principale d'un angle est son
  unique mesure appartenant à ]−π ; π] » du calcul 18.4, dans la suite de « 18.7 aucun rappel de formule »).
  Le calcul et ses 4 questions sont inchangés.

- **Section « Comparaisons » déplacée de la fiche 18 à la fiche 19 de Première (07/10/2026).** Demande de
  David : les calculs « Monotonie du cosinus et du sinus » (ancien 18.8, 4 QCM) et « Comparaison entre sinus
  et cosinus » (ancien 18.9, 2 QCM dont un à choix multiples) se retrouvent dans la fiche 19, **avant les
  calculs plus avancés**.
  - Fiche 19 : nouvelle section « Comparaisons » après « Courbes représentatives » = 19.11 (monotonie) et
    19.12 (comparaison), puis les avancés renumérotés 19.13 (formules d'addition), 19.14 (valeurs exactes),
    19.15 (formules d'addition ?), 19.16 (tangente) ; 45 questions (39 + 6), 16 groupes ; la fiche reprend
    l'option `pleineLargeur` de la fiche 18 (cartes d'un groupe en pleine largeur quand les options
    tiennent sur une ligne défilante).
  - Fiche 18 : 29 questions (35 − 6), 10 calculs ; les avancés deviennent 18.8 (valeurs de tan), 18.9
    (parité et périodicité), 18.10 (avec la tangente) ; groupes `grille-18-1` à `grille-18-10`.
  - Identifiants : positionnels, **ceux de 18.8 à 18.10 et de 19.11 à 19.16 changent** (aucun barème sur ces
    deux fiches ; un devoir en cours sur l'une d'elles serait à revoir).
  Vérifié : 45/45 et 29/29 questions, aucune carte manquante dans les grilles, cycles complets (450 et 435
  réponses acceptées, les réponses des champs d'ensemble 19.1/19.2 étant saisies au format ascii comme
  dans la fiche), réponses fausses refusées sur les QCM déplacés, 0 erreur MathJax, rendu contrôlé à l'écran.

- **Première fiche 18 : section « Équations trigonométriques » après 18.7 (07/10/2026), 33 questions, 11 calculs.**
  Demande de David : une section de résolution d'équations trigonométriques, quatre exemples, deux du type
  a·cos(x) = b et a·sin(x) = b (angles remarquables), deux du type a·cos(bx+c) = d et a·sin(bx+c) = d.
  - Nouveau **18.8** (section « Équations trigonométriques », dans le cœur de la fiche, avant les calculs avancés) :
    « Résoudre dans l'intervalle ]−π ; π] les équations suivantes (ensemble des solutions), **sous la forme de
    fractions de π irréductibles** » (consigne dans le titre, partie imposée en bleu). a) a·cos(x) = b,
    b) a·sin(x) = b avec a ∈ {±2, ±3, ±4}, b = a·t pour t ∈ {0, ±1/2, ±√2/2, ±√3/2} (deux solutions) ;
    c) a·cos(bx+c) = d, d) a·sin(bx+c) = d avec b = ±2 et c multiple de π/6 (valeurs 0, ±1/2, ±√3/2) ou de π/4
    (valeurs ±√2/2) : quatre solutions dans ]−π ; π], dénominateurs 6, 12 ou 8, résolues exactement en
    arithmétique de fractions (y = ±α + 2kπ ou α, π−α, puis x = (y−c)/b).
  - Saisie : champ mathématique (`ensembleMath`), placeholder `{a;b}`, clavier MathLive (π, fraction,
    accolades ; point-virgule en ⇧ puis }) ; frappe physique vérifiée (« { - p i / 6 ; p i / 6 } » → correct).
    Contrôle `checkEnsemblePi` : ensemble exact (ni solution manquante ni en trop) et chaque élément 0, π ou
    fraction de π irréductible (« 2π/12 » refusé, valeurs décimales refusées) ; accolades facultatives comme
    dans les autres fiches ; aide « ? » dédiée. Les ids des avancés passent à 18.9 (valeurs de tan), 18.10
    (parité et périodicité) et 18.11 (avec la tangente) ; groupes `grille-18-1` à `grille-18-11`, indices
    0 à 32 (aucun barème sur cette fiche).
  Vérifié : solutions recalculées indépendamment par balayage numérique du signe de a·f(bx+c) − d sur
  ]−π ; π] (480 questions : mêmes racines, 2 solutions en a/b, 4 en c/d), cycle complet 396 réponses acceptées,
  ensembles incomplets, avec solution en trop, non réduits, opposés ou décimaux refusés, variété (23 à 39
  énoncés par question sur 40 tirages), 0 erreur MathJax, captures (section et clavier MathLive).

- **Première fiche 18, 18.8 c) et d) : coefficient b de bx plus varié (07/10/2026).** David : « j'ai l'impression que 2
  sort toujours » (b valait ±2 en dur). Désormais b ∈ {±1, ±2, ±3} tiré au hasard (affichage « x » ou « −x » pour
  |b| = 1), soit 2, 4 ou 6 solutions dans ]−π ; π] (dénominateurs jusqu'à 12 ou 24 selon c). Vérifié : 600
  questions recalculées indépendamment par balayage numérique des racines, 0 écart ; répartition de b sur 600
  tirages : 38, 41, 61, 65, 46, 49 pour 1, 2, 3, −1, −3, −2 ; nombre de solutions 2 / 4 / 6 en proportions
  voisines ; 146 énoncés distincts par question (au lieu de 39) ; cycle complet accepté (60/60).

- **Barème de la fiche 18 de Première (07/10/2026) : base 19 points, bonus 14,25 points.** Fichier
  `outils/bareme/fiche-18.json` (33 questions), fiche câblée (`cabler-fiche.js 18`), `appliquer-bareme.js` étendu à la
  fiche 18. Bonus (E) = les calculs avancés 18.9 (valeurs de tan, 4 × 1,5), 18.10 (parité 1,5, périodicité 1,5), 18.11
  (1,5 / 1,75 / 2). Cœur : 18.1 (0,5 / 0,75), 18.2 (0,75 / 0,5), 18.3 (0,5 × 2), 18.4 (0,5 / 0,5 / 0,75 / 1),
  18.5 (0,5 × 4), 18.6 (0,75 / 0,75 / 1 / 1), 18.7 (1 / 1), 18.8 (1 / 1 / 1,5 / 1,75). Contrôle de cohérence : 19 fiches
  à barème cohérentes, 33 questions tirées sur 300 générations toutes avec points ; affichage « Total : 19 points
  (+ 14,25 points de calculs avancés) » et note « 33,25 / 33,25 » toutes réponses justes vérifiés. Proposition à
  valider par David.

- **Aide du point-virgule reformulée (fiches 17 et 18 de Première, 07/10/2026).** David : pourquoi le bouton « ? » dit « ⇧ puis
  la touche } » plutôt que « ; » ? Vérifié à l'écran : sur le clavier MathLive, la touche `}` change d'étiquette quand on appuie
  sur ⇧ (elle affiche alors `;`) ; le texte désignait l'emplacement de la touche avant le ⇧, ce qui prête à confusion.
  Nouveau texte (6 occurrences : fiche 17 couples, points, vecteurs ; fiche 18 équations trigonométriques) : « le
  point-virgule s'obtient en appuyant sur la touche ⇧ : la touche } se change alors en ; ». Seules ces deux fiches contenaient
  la phrase.

- **Barème de la fiche 18, ajustements de David (07/10/2026) : base 19 points, bonus 14,25 points.** 18.4 d) 0,75 ; 18.8 d) 1,5 ;
  puis, pour que le total de base reste entier (18,5 → 19, « option 2 ») : 18.8 c) 1,75 et 18.4 c) 1 (catégorie B). Contrôle de
  cohérence : fichiers cohérents ; affichage « Total : 19 points (+ 14,25 points de calculs avancés) » et pastilles de 33
  questions vérifiés. Remarque laissée à David : 18.4 c) (plusieurs tours, 1 pt) vaut maintenant plus que 18.4 d) (grand
  multiple, 0,75 pt).

- **Première fiche 19 (Fonctions trigonométriques II) : refonte du cœur (07/10/2026), 38 questions, 13 calculs.** Demande de David : repenser
  le cœur de la fiche autour des formules d'addition et de cos(2x), sin(2x) (développement de a·cos(bx+c) ou a·sin(bx+c)), des
  équations trigonométriques plus délicates, en gardant les questions graphiques et la comparaison. Choix de David (3 questions) :
  retirer tous les anciens calculs « valeurs remarquables / tangente / angles associés » (19.4 à 19.8), garder les automatismes
  19.1 à 19.3, avancés = tan(a+b), équations a·cos x + b·sin x = c, valeurs exactes (π/12…).
  - **Automatismes** 19.1 à 19.3 inchangés (équations avec carrés, valeurs absolues, inéquations).
  - **Section « Formules d'addition et de duplication »** (avec la boîte « Formules admises » cos(a+b), sin(a+b) qui était dans
    les avancés) : **19.4** développement, « sous la forme A cos(bx) + B sin(bx) » : a·cos(x+c), a·sin(x+c) puis a·cos(bx+c),
    a·sin(bx+c) avec b ∈ {2, 3, 4}, c = ±π/6, ±π/4, ±π/3, ±2π/3, ±3π/4, ±5π/6, a ∈ ±{1…4}, cos/sin dans un ordre tiré ;
    forme contrôlée (`estDeveloppe` : tout cos/sin a exactement l'argument bx, aucun π, aucune autre fonction ; l'énoncé recopié est
    refusé). **19.5** duplication, « sous forme simplifiée » : cos(2x) connaissant cos(x), sin(2x) connaissant cos(x) et le quadrant,
    cos(2x) connaissant sin(x), cos(x) connaissant cos(2x) et le quadrant.
  - **Section « Équations trigonométriques »**, **19.6**, dans ]−π ; π], fractions de π irréductibles (champ mathématique, clavier
    MathLive, comme 18.8) : a) second degré en cos (racines parmi 0, ±1/2, ±1, coefficients entiers de pgcd 1), b) second degré en
    sin, c) cos(ax) = cos(bx) ou sin(ax) = sin(bx) avec (a, b) ∈ {(2,1), (3,1), (3,2)} (3 à 6 solutions), d) cos(2x) = ±cos(x),
    ±sin(x) ou sin(2x) = ±cos(x), ±sin(x). Solutions obtenues exactement en testant les multiples de π/120.
  - **Courbes représentatives** (19.7, 19.8) et **Comparaisons** (19.9 monotonie, 19.10 comparaison sinus/cosinus) conservées,
    renumérotées (les anciennes figures `graphique-19-10/11` ne changent pas d'identifiant).
  - **Calculs plus avancés** : **19.11** valeurs exactes cos et sin de kπ/12 (k impair : (√6±√2)/4), **19.12** formule d'addition de la
    tangente (le QCM d'avant, puis tan(a+b) connaissant tan a et tan b, puis tan(kπ/12) = ±2 ± √3), **19.13** équations
    a·cos x + b·sin x = c dans ]−π ; π] (R = 2 avec a, b ∈ {±1, ±√3} ou R = √2 avec a, b = ±1 ; deux solutions).
  - Outils repris de la fiche 18 : `estFractionIrreductible`, `estRacineSimplifiee`, `estValeurSimplifiee`, `checkEnsemblePi`,
    `piFracAscii`, `signeDevantFraction`. Champ d'ensemble en fractions de π : MathLive (placeholder {a;b}), le champ à clavier
    maison de 19.1 et 19.2 est conservé. Retiré : calculs d'addition sur « 4 » devenus inutiles (`BASIC3`, `calcAdditionSurd`…).
  - **Correctif des corrigés** (fiches 18 et 19) : `signeDevantFraction` ne déplace plus le moins d'une somme « −a+b » (« −√6+√2 »
    devenait « −(√6+√2) », faux) ; un numérateur « −(a+b) » entre parenthèses passe devant la fraction ; les réponses de 19.11
    s'écrivent « (√2−√6)/4 » (terme positif d'abord) ; plus de « × » entre un coefficient et cos, sin, tan, racine (fiche 19).
  Vérifié : calculs recalculés indépendamment sur 1 200 tirages (19.4 : valeur de a·f(bx+c) en 4 points ; 19.5 : valeur déterminée
  de façon unique par l'intervalle ; 19.11 et 19.12), équations 19.6 et 19.13 sur 1 400 tirages par balayage de signe et minima de
  |f| (racines doubles comprises, π inclus, −π exclu) : aucun écart ; cycle complet 380 à 456 réponses acceptées ; 110 écritures
  non simplifiées ou énoncés recopiés refusés ; 0 erreur MathJax ; captures. Fiche 18 : cycle complet 396/396 après le correctif.
  Pas de barème sur la fiche 19 ; identifiants renumérotés (un devoir en cours sur cette fiche serait à revoir).

- **Première fiche 19 : titre de 19.4 simplifié, 19.11 supprimé (07/10/2026), 34 questions, 12 calculs.** David : le titre de 19.4 ne
  convient pas (retirer notamment « où bx est le terme en x de l'énoncé », garder A, B et b réels) ; supprimer 19.11.
  - Titre de 19.4 : « Développer chaque expression **sous la forme A cos(bx) + B sin(bx)**, où A, B et b sont des réels »
    (« (valeurs exactes) » retiré aussi ; l'aide du « ? » garde la consigne de valeurs exactes).
  - Calcul 19.11 « Valeurs exactes » (cos et sin de kπ/12) supprimé ; les avancés deviennent 19.11 (formule d'addition de la
    tangente) et 19.12 (équations a·cos x + b·sin x = c) ; groupes `grille-19-1` à `grille-19-12`, indices 0 à 33.
  Vérifié : 34 questions, 12 groupes, cartes complètes, cycle complet 408/408, 0 erreur MathJax.

- **Première fiche 19 : 19.7 et 19.8 (courbes représentatives) supprimés (07/10/2026), 30 questions, 10 calculs.** David : ces questions
  ne sont pas réellement traitées dans le programme du lycée. Section « Courbes représentatives » retirée (les deux calculs, leurs
  figures et leurs 4 questions) ; avec elle le code devenu inutile : générateur de courbes, pool d'identités, dessin des figures SVG
  (`genererSVGCourbeTrigo`, `construireGraphique24_10/11`), curseur de lecture des coordonnées et zoom au clic (`activerCurseurSvg`,
  `activerZoomSvg`, modale), CSS correspondant. Les calculs suivants sont renumérotés : 19.7 monotonie, 19.8 comparaison sinus/cosinus,
  puis avancés 19.9 (tangente) et 19.10 (équations a·cos x + b·sin x = c). Groupes `grille-19-1` à `grille-19-10`, indices 0 à 29.
  Il ne reste donc aucune question graphique dans la fiche 19 (il y en avait été décidé le contraire le 07/10 au moment de la refonte).
  Vérifié : 30 questions, 10 groupes, cartes complètes, cycle complet 360/360, 0 erreur MathJax, 0 erreur console.

- **Barème de la fiche 19 de Première (07/10/2026) : base 20 points, bonus 10 points.** Fichier `outils/bareme/fiche-19.json`
  (30 questions), fiche câblée (`cabler-fiche.js 19`), `appliquer-bareme.js` étendu à la fiche 19. Cœur : 19.1 (0,5 / 0,75),
  19.2 (0,5 / 0,75), 19.3 (0,5 / 0,75), 19.4 développement (0,75 / 0,75 / 1 / 1), 19.5 duplication (0,5 / 1 / 0,5 / 1,25),
  19.6 équations (1,25 / 1,25 / 1,5 / 1,5), 19.7 monotonie (4 × 0,5), 19.8 comparaison (0,75 / 1,25). Bonus (E) = avancés :
  19.9 tangente (1,5 / 1,5 / 1,75), 19.10 équations a·cos x + b·sin x = c (3 × 1,75). Contrôle de cohérence : 20 fiches à
  barème cohérentes, 30 questions tirées sur 300 générations toutes avec points ; « Total : 20 points (+ 10 points de calculs
  avancés) » et note 30 / 30 toutes réponses justes vérifiés. Proposition à valider par David.

- **QCM, oui/non et vrai/faux cliquables dans 47 fiches (07/10/2026).** Demande de David : pour les questions qui n'ont que oui/non ou les
  QCM, utiliser comme dans les pages d'automatismes de simples clics au lieu de taper une lettre. Le scalaire partagé
  `assets/js/qcm-clic.js` (nouveau fichier, aucun générateur modifié) repère les cartes à choix (`.q-qcm-options` + champ texte),
  rend les choix cliquables (même aspect que les automatismes : bordure, pastille de lettre, état « choisi »), masque le champ et son
  clavier, et y écrit la même lettre que la frappe : un seul bon choix → un clic valide (touche Entrée simulée) ; plusieurs bonnes
  réponses (« b,c,f ») → cocher puis bouton « Valider » ; vrai/faux (type `vraifaux`) → deux boutons « Vrai » / « Faux » créés par le
  script. Brouillons, reprises, devoirs (verdict caché jusqu'à la validation), mode « Tout à la fin », « Recommencer » et « Générer une
  nouvelle version » inchangés ; l'aide « ? » devient « Cliquer sur la bonne réponse » (ou « …toutes les bonnes réponses, puis
  « Valider » »). Outil de câblage `outils/qcm-clic/cabler-fiches.js` (balise après `claviers.js`, idempotent, option `--verif`),
  audit `outils/qcm-clic/audit.html`.
  - **Devoirs en cours** (lus en lecture seule dans Firestore, sans identité d'élève) : Première fiche 1 (calculs 1.1 à 1.5 et 1.9,
    classe 1ere-Gr 1, 8/10), Première fiche 2 (2.1 à 2.6, 1ere-Gr 1, 10/10), Seconde fiche 5 (5.1 à 5.5 et 5.7, 2nde-207, 8/10) : ces trois
    fiches ne sont **pas** câblées (liste `EXCLUES`) ; à câbler après les échéances. Les fiches dont le script partagé `claviers.js`
    avait été modifié le 06/10 (touche ×, bouton clavier, xⁿ) restent concernées par ces changements déjà en ligne.
  - Vérifié : 15 fiches contiennent des questions à choix (Première 4, 7, 8, 9, 10, 16 à 21, 23 à 26 ; Seconde : aucune), 75 cartes toutes
    rendues cliquables, 75/75 bonnes réponses obtenues par clic (dont 5 QCM à plusieurs réponses), aucune erreur de script ; devoir
    simulé (clic enregistré dans `saisies` sans verdict affiché) ; « Recommencer » et nouvelle version resynchronisent l'affichage.
  - Règle ajoutée à REGLES-FICHES.md et note dans SUIVI-FIREBASE.md.

- **Première fiche 20 (« Produit scalaire I ») : refonte des automatismes, formes simplifiées, rectangles quelconques (07/10/2026).**
  Réponses de David à l'audit : 1) automatismes avec des vecteurs (vus dans les fiches précédentes) et des valeurs absolues ;
  2) toujours sous forme simplifiée ; 3) tout type de rectangle. La fiche passe de 25 à **26 questions, 11 calculs** (ids positionnels
  renumérotés ; aucun barème ni devoir sur cette fiche à ce stade).
  - **Automatismes (6)** à la place du « méli-mélo » QCM : 20.1 inéquations (a : premier degré à deux membres fractionnaires, signes
    quelconques ; b : |ax+b| ◊ k, quatre opérateurs), 20.2 équations (a : |ax+b| = c avec c > 0, c = 0 ou c < 0 → deux solutions, une
    ou ∅ ; b : (ax+b)/(cx+d) = k, la valeur interdite n'est jamais la solution), 20.3 vecteurs (a : coordonnées de u·AB + v·AC,
    coordonnées entières, réponse « (x;y) » ; b : norme de AB, entier ou racine simplifiée). Toutes les réponses d'inéquations en
    intervalles.
  - **« Sous forme simplifiée » partout où une valeur est attendue** (20.3, 20.5, 20.6, 20.7, 20.8, 20.9, 20.10, 20.11 ; expression
    « sous forme réduite » en 20.9 b/c), phrase mise en bleu dans les titres. Contrôle `estSimplifie(val, ex)` (drapeau
    `formeSimplifiee`) appliqué après le test d'égalité : chaque élément d'un ensemble, chaque coordonnée d'un couple, pente et
    ordonnée d'une équation « y= » (`estLineaireSimplifie` : au plus un terme par lettre et une constante, coefficient sans 1 ni 0
    écrit, `-(x+1)` refusé), `estValeurSimplifiee` portée de la fiche 19 (entier, fraction irréductible, racine sans facteur carré,
    pas de racine au dénominateur ; « (16√14)/3 », « (2x)/3 », « 2/3x » acceptées, « 4/6 », « 1/√2 », « 5+0 » refusées).
  - **Orthogonalité (20.4)** : oui/non tiré au hasard (au moins un oui et un non, ≈ 50 % chacun), démarche « en calculant le produit
    scalaire » retirée du titre ; non-orthogonal obtenu en changeant un signe ; d) avec |a| = |b| ou non (produit scalaire b² − a²).
    **20.5** : c) généralisé (√D·x ± a ; b ± kx, racine simplifiée de la solution), a) signe de x tiré.
  - **Droites** : 20.6 a/b/c réponses lisibles (« 2x/3 + 7/3 », « 16√14/3 »), signe devant la fraction dans l'énoncé de c) ; 20.7
    généralisée (a x + e·s√D y + c = 0, pente ± s√D / a, point E(k√D ; e)) ; 20.8 deux droites « passant par X et perpendiculaire à
    (YZ) » avec des points tirés parmi A, B, C (jamais la même base de départ), « l'équation réduite de la droite » dite une seule fois
    dans le titre.
  - **20.9 : rectangle quelconque ABDC** (AB ⟂ AC, coordonnées entières : AB = t(p;q), AC = s(−q;p), t ∈ {1,2}, s ∈ {±1,±2} ; ≈ 25 %
    de rectangles à côtés parallèles aux axes, 75 % inclinés), questions : AB·AC, AC·CD et AB·BD en fonction de x **et y** (forme
    réduite exigée), puis D (x;y) tel que ABDC soit un rectangle (système de deux équations).
  - **Avancés** : 20.10 f(x) = a x² + βx + d avec a ∈ ±{1,2,3}, β entier ou b√D (x = ± √(β²+1) / (2|a|), racine simplifiée, jamais
    un carré parfait) ; 20.11 f(x) = a x² + b x, abscisses ± n/2, b = ± √(m²−1) avec m = |a|n.
  - **Corrigé lisible** : `signeDevantFraction`, `surdFrac`, suppression du « × » devant une racine (`2\sqrt{3}x`), ensemble vide affiché
    ∅, pente écrite « −2x/3 » (numérateur porteur du x) et non « 2/3 × x ».
  - Vérifié : 26 questions / 11 groupes ; ≈ 400 tirages recomptés par un calcul indépendant à partir des énoncés (balayage numérique
    des racines, signes, perpendicularité, rectangle : 0 erreur réelle) ; variété (20 à 400 énoncés distincts par question, 20.11 : 26,
    20.10 : 96) ; balayage des défauts d'énoncé (« +- », « 1x », « \dfrac{- »…) : un seul trouvé (20.6 c) et corrigé ; cycle complet
    650/650 corrigés acceptés, 650/650 réponses fausses refusées, 400/400 écritures non simplifiées refusées ; 0 erreur MathJax ;
    4/4 oui/non cliquables (audit `qcm-clic`) ; saisie physique d'un couple fraction/racine vérifiée dans MathLive ; capture des
    sections.

- **Première fiche 20 : moins de racines carrées et nouvelle section « Produit scalaire en coordonnées » (07/10/2026).** Remarque de David :
  les racines carrées étaient omniprésentes dans les coordonnées (norme, 20.4 b, 20.5 c, deux des trois droites de 20.6, 20.7, f en 20.10).
  Corrections : norme (20.3 b) entière 40 % du temps, racine simplifiée 60 % ; oui/non b) en entiers une fois sur deux (racines
  1/4 + 1/4) ; « trouver x » c) en solution rationnelle (entiers tels que (b²−a²)/(q²−p²) soit un carré) une fois sur deux ; droites
  par un point et un vecteur normal : a) point entier, b) point rationnel, c) seul cas avec racines (√D en facteur ou au dénominateur) ;
  perpendiculaire à (D) avec des entiers 60 % du temps ; f(x) avec β = b√D seulement 25 % du temps. Restent radicaux par nature :
  les réponses des deux calculs avancés « tangentes perpendiculaires », la norme (60 %) et le cas c) des droites.
  Nouvelle section **« Produit scalaire en coordonnées »** après les automatismes : calcul 20.4 à deux questions, a) u·v avec des
  coordonnées entières, b) AB·AC avec trois points entiers (résultat jamais nul). Les calculs suivants sont renumérotés (20.5 à 20.12) :
  **28 questions, 12 calculs**.
  Vérifié : 185 tirages recomptés par un calcul indépendant à partir des énoncés (0 erreur), variété (20.12 : 26 énoncés, autres de 74
  à 400), balayage des défauts d'énoncé (aucun), cycle 700/700 corrigés acceptés, 700/700 réponses fausses refusées, 400/400 écritures
  non simplifiées refusées, 0 erreur MathJax, capture de la nouvelle section.

- **Première fiche 20 : allègement après relecture de David (07/10/2026).** 1) Oui/non (20.5) : la c) « puissances de 10 » est supprimée
  (3 questions : fractions, entiers ou racines, avec un réel x). 2) Oui/non dans toute la bibliothèque : plus de pastille « a » / « b » dans
  les boutons, seulement « oui » et « non » (`qcm-clic.js` : classe `qcm-oui-non`, lettre masquée par CSS mais toujours écrite dans le champ ;
  règle ajoutée à REGLES-FICHES.md). 3) « Trouver x » (20.6) ramené à 3 exemples : a) cas simple (premier degré, fraction), b) équation du
  second degré (racine ou rationnel, une fois sur deux), c) équation produit à deux solutions ; l'ancien b) (premier degré à fractions) retiré.
  4) Droites par un point et un vecteur normal (20.7) ramenées à 2 exemples : a) point entier, b) point rationnel ou, une fois sur deux,
  avec racines. Nouveau total : **25 questions, 12 calculs** (20.5 : 3, 20.6 : 3, 20.7 : 2).
  Vérifié : 40 tirages recomptés (0 erreur), cycle 625/625 corrigés acceptés, 625/625 fausses refusées, 350/350 non simplifiées refusées,
  lettres masquées sur les 6 cartes oui/non, audit de clic sur 14 fiches à QCM (toutes les bonnes réponses obtenues par clic), capture.

- **Première fiche 20 : formule géométrique du produit scalaire et mesure d'un angle (07/10/2026).** Demande de David : 1) avant le calcul en
  coordonnées, une section avec la formule « norme × norme × cosinus » ; 2) après le calcul en coordonnées, un exercice mêlant les deux
  formules pour trouver la valeur approchée d'un angle en degrés. Nouvelle section **« Produit scalaire : norme et cosinus »**
  (calcul 20.4, 3 questions, résultats rationnels, forme simplifiée) : a) normes entières et angle en degrés (0°, 60°, 90°, 120°, 180°),
  b) angle en radians (π/3, 2π/3, π/4, 3π/4, π/6, 5π/6) avec une norme en k√2 ou k√3 qui se simplifie avec le cosinus, c) triangle
  équilatéral ou carré de côté a (AB·AC, AB·BC, BA·BC, AB·CD, AC·BD, AC·DA : a²/2, −a²/2, a², −a², 0). Le calcul en coordonnées devient 20.5.
  Nouveau calcul **20.6 « Mesure d'un angle »** (problème guidé) : points A, B, C, a) AB·AC par les coordonnées, b) cos(BAC) sous forme
  simplifiée (une fois sur deux avec des vecteurs à normes entières, donc cosinus rationnel), c) mesure de BAC en degrés arrondie à
  l'unité (accepte tout nombre à 0,5° près, unité non écrite, fraction de la partie décimale écartée autour de 0,5 pour que l'arrondi soit
  net ; drapeau `approx` / `approxTol`, fonction `checkApprox`, corrigé « ≈ 143° »). **Calculatrice** : exception à la bannière « Calculatrice
  interdite », qui précise maintenant « sauf pour la dernière question du calcul 20.6 » (la question c) en a besoin pour arccos).
  Calculs suivants renumérotés (20.7 à 20.14). Nouveau total : **31 questions, 14 calculs**.
  Vérifié : 125 tirages recomptés par un calcul indépendant à partir des énoncés (0 erreur, dont les produits scalaires, la figure
  équilatéral/carré, le cosinus exact et l'angle), cycle 775/775 corrigés acceptés, 775/775 réponses fausses refusées, 450/450 écritures non
  simplifiées refusées ; 14 ou 15 refusé, 13 refusé pour 14,25° ; 0 erreur MathJax ; captures des nouvelles sections.

- **Première fiche 20 : 20.4 sans degrés, angle du 20.6 au dixième (07/10/2026).** Demande de David : aucun angle en degrés dans 20.4 (a) passe
  en radians : 0, π/3, π/2, 2π/3, π ; b) ne garde que π/4, 3π/4, π/6, 5π/6) ; dans 20.6 c), mesure de l'angle **arrondie au dixième**.
  Règle d'arrondi (`checkApprox(saisie, valeurExacte, décimales)`) : la réponse doit être un nombre écrit en clair (pas d'expression,
  virgule ou point, unité ° tolérée), avec au plus 1 décimale (zéros finaux admis, « 14,30 » = « 14,3 »), et égal à la valeur exacte
  arrondie au dixième (écart < 10⁻⁹). Pas de marge de tolérance : 14,2 ou 14,4 sont refusés pour 14,25… (14,3 attendu), comme « 14 » ou
  « 14,25 ». Les angles tirés évitent les cas limites (partie décimale de 10θ à moins de 0,12 de 0,5) pour qu'un arrondi de calculatrice soit
  sans ambiguïté. Corrigé affiché « ≈ 143,1° », aide « ? » mise à jour.
  Vérifié : 120 tirages recomptés (0 erreur), cycle 775/775 / 775/775 / 450/450, 0 erreur MathJax.

- **Première fiche 20 : marge sur le cosinus dans 20.6 c) (07/10/2026).** Demande de David : tolérer l'arrondi du cosinus. `checkApprox` accepte
  maintenant toute valeur écrite avec une décimale que donne arccos(c') pour un cosinus c' compris dans [cos − 0,0005 ; cos + 0,0005]
  (cosinus arrondi au millième), en plus de la valeur exacte arrondie (champs `approxCos`, `approxMarge`). Les angles tirés sont maintenant
  compris entre 14,5° et 165,5° environ (sin θ ≥ 0,25) pour que la fenêtre reste de 1 à 3 valeurs (1 : 21 %, 2 : 68 %, 3 : 11 % des tirages) ;
  l'aide « ? » le dit. Vérifié : fenêtre recalculée indépendamment (balayage fin de c') sur 1500 tirages, 0 écart ; 135,0 accepté,
  135,1 / 134,9 / 136,5 / 12 refusés pour θ = 135° (cos = −√2/2) ; « 135,000 » accepté ; 0 erreur MathJax.

- **Première fiche 20 : marge au centième et barème (07/10/2026).** 1) Marge sur le cosinus portée de 0,0005 à **0,005** (cosinus arrondi au
  centième ; aide « ? » mise à jour) : `approxMarge: 0.005` ; les angles tirés de 20.6 c) sont limités à 30°–150° (sin θ ≥ 0,5) pour garder une
  fenêtre raisonnable (7 à 13 valeurs acceptées, 8,6 en moyenne, soit environ ± 0,4°) ; fenêtre recalculée indépendamment sur 1500 tirages,
  0 écart ; cos = −0,71 donne 135,2° accepté pour θ = 135°. 2) **Barème de la fiche 20 : base 20 points, bonus 10 points** (`outils/bareme/fiche-20.json`,
  31 questions, fiche câblée par `cabler-fiche.js 20`, `appliquer-bareme.js` étendu). Cœur : 20.1 inéquations (0,5 / 0,75), 20.2 équations (0,5 / 0,75),
  20.3 vecteurs (0,5 / 0,5), 20.4 norme et cosinus (0,5 / 0,75 / 0,75), 20.5 coordonnées (0,5 / 1), 20.6 mesure d'un angle (0,5 / 1,25 / 1),
  20.7 oui/non (0,5 / 0,5 / 0,75), 20.8 trouver x (0,75 / 1 / 1,25), 20.9 droites par un point et un vecteur normal (0,75 / 1), 20.10 perpendiculaire
  à (D) (1,25), 20.11 droites du triangle (1,25 / 1,25). Bonus (E) = avancés : 20.12 rectangle (1,5 / 1,5 / 1,5 / 1,75), 20.13 tangentes (1,75),
  20.14 tangentes avec paramètre (2). Contrôle : 31 questions tirées sur 300 générations, toutes avec points ; « Total : 20 points (+ 10 points de
  calculs avancés) » ; note 30/30 toutes justes, 20/20 sur le cœur seul, 10/30 sur le bonus seul, 0/20 à vide. Proposition à valider par David.

- **Première fiche 20 : retouches après le barème (07/10/2026).** Demande de David : 1) un angle en radians s'écrit modulo 2π : « (u, v) = π/3 [2π] »
  dans 20.4 a) et b) ; 2) 20.4 : énoncés « Calculer u·v, sachant que… » et « …. Calculer AB·AC » (le verbe est dans chaque énoncé, le titre devient
  « Produit scalaire et cosinus. Donner les résultats sous forme simplifiée ») ; 3) barème : 20.3 a) 0,75 (au lieu de 0,5) et 20.5 b) 0,75 (au lieu de 1) —
  base toujours 20 points, bonus 10. Vérifié : 800 énoncés 20.4 a)/b) recalculés (produit des normes par le cosinus de l'angle écrit), 0 écart ;
  barème régénéré (`appliquer-bareme.js 20`), contrôle de cohérence des fichiers OK ; rendu de « [2π] » contrôlé.

- **Seconde : touches +∞ / −∞ manquantes au clavier simplifié des intervalles (07/10/2026).** Signalement de David. Constat : les fiches 7, 8, 12 et 13 avaient
  bien +∞ et −∞ dans le groupe « Intervalle », mais pas les **fiches 14, 15, 16, 17, 18, 19, 20, 21, 22, 23 et 25** (génération `genererClavierIntervalle` plus
  ancienne : ] [ ; − seulement, alors que le correcteur lit « ∞ »). Correction fiche par fiche (pas dans `claviers.js`, partagé avec les fiches en devoir) : touches
  « +∞ » et « −∞ » ajoutées au groupe Intervalle, astuce complétée par « ]-∞;1[ ∪ ]3;+∞[ ». Première : aucun clavier d'intervalle sans ∞ (Première 2 et 3 utilisent
  le clavier MathLive, qui a ∞ sur sa couche « ∞≠∈ »).
  **Défaut découvert au passage (Seconde 17.3 a, ensemble de définition de |x|, x ↦ ax+b, x², x³ = ℝ)** : la réponse attendue est écrite `]-∞;+∞[` en intervalles, mais la
  saisie « ℝ » ou « ]-∞;+∞[ » est lue « tout ℝ » (type `tout`) : les deux étaient refusées (60 tirages sur 60) ; le corrigé affiché ne pouvait donc pas être saisi.
  `checkIntervalle` ramène maintenant une réponse attendue ]-∞;+∞[ à « tout ℝ » (12 fiches ayant cette lecture : Seconde 8, 14 à 23, 25).
  Vérifié : touches présentes et insérant « +∞ » / « −∞ » dans les 13 fiches à intervalles (7, 8, 12 à 23, 25), 5 fiches saisies uniquement à la souris
  (borne ∞ comprise : 15, 17, 19, 22, 25 toutes justes), et 1700 réponses d'intervalle générées (30 tirages × 12 fiches) toutes acceptées sous leur forme écrite, dont les 30 cas ℝ.

- **Première fiche 21 (« Produit scalaire II ») : nouveaux automatismes (07/10/2026).** Audit de la fiche (45 questions, 18 calculs, pas de barème), puis
  demande de David : régler d'abord les automatismes, avec du calcul simple de produit scalaire. Les anciens 21.1 (puissances, 2 questions) et 21.2
  (développements `aⁿ − bⁿ`, 3 questions), qui ne suivaient pas la règle de diversité, sont remplacés par **6 questions** : **21.1 inéquations**
  (a : premier degré avec parenthèses des deux côtés m(px+q) ◊ n(rx+s), coefficients signés ; b : quotient (ax+b)/(cx+d) ◊ 0, valeur interdite jamais
  incluse, un ou deux intervalles) ; **21.2 équations** (a : second degré ax²+bx+c = 0 construit par (αx+β)(γx+δ) : deux solutions 52 %, solution double
  20 %, aucune 28 % ; b : √(ax+b) = c, aucune solution si c < 0) ; **21.3 calcul numérique, sous forme simplifiée** (a : produit scalaire u·v, coordonnées
  entières, résultat non nul ; b : l'ancien 21.1 a, fraction de puissances, réponse fraction irréductible, maintenant contrôlée par `estValeurSimplifiee`).
  Le reste de la fiche est **renuméroté** (anciens 21.3 à 21.18 → 21.4 à 21.19, **46 questions, 19 calculs**, `groupes` réécrit) ; aucun devoir ni barème
  n'existe sur la fiche. Outils portés de la fiche 20 : `coefPrefixeL`, `fracLatexSigned`, `ensembleStr`, `parSigne` (+ `parSigneQuotient`),
  `estRacineSimplifiee`, `estValeurSimplifiee`, `signeDevantFraction` ; **le corrigé de toute la fiche est plus lisible** (signe devant la fraction,
  ensemble vide ∅, plus de « × » devant une racine) ; l'aide « ? » mentionne la forme simplifiée. Constats de l'audit **non encore traités** : 21.3 a) ancien
  (devenu 21.4 a) non saisissable à l'écran (pas de y, ni x'), 21.12 b) (devenu 21.13 b) « 47/26 × √26 », formes simplifiées des distances, projetés et rayons,
  `\frac` au lieu de `\dfrac` dans quelques énoncés, 21.4 et 21.8 (devenus 21.5 et 21.9) très proches.
  Vérifié : 190 tirages recomptés par un calcul indépendant à partir des énoncés (signe sur grille fine, bornes et inclusions, racines des équations,
  produit scalaire, valeur des puissances, forme simplifiée de la réponse) : 0 erreur ; variété (287 à 400 énoncés distincts sur 400 tirages) ; cycle
  180/180 corrigés acceptés, 180/180 réponses fausses refusées, 30/30 écritures non simplifiées refusées ; structure : 46 cartes, 19 groupes, 0 erreur MathJax ; capture.
