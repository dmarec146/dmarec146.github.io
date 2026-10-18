# Bloc « QCM Bac » (Terminale spécialité mathématiques) — suivi du chantier

**Statut au 17/10/2026 : pilote codé (suites + géométrie dans l'espace), non encore en ligne sur `master` ni lié depuis le site.** Décisions prises avec
David lors d'une session cloud ; à tenir à jour à chaque étape (le récit détaillé
d'un chantier terminé va à la fin de `HISTORIQUE.md`).

## 1. Décisions

- **Nouveau bloc** « QCM Bac » pour les classes de Terminale spécialité : une entrée dans la
  barre de navigation **et** une carte sur la page d'accueil, comme les automatismes.
  Couleur de la section : **à proposer à David** (le rouge des cahiers et le vert des automatismes
  sont pris), rien d'inventé sans son accord.
- **Même architecture que les automatismes de Première** : banques de données par famille,
  trois niveaux, mêmes moteurs de création et de correction (`automatismes/assets/moteur.js`),
  deux modes (fiche par thèmes / chrono ou sujet blanc), devoirs et barème branchés.
  Le moteur doit être **mutualisé, pas copié**. Pas encore lu en détail : repérer ce qui est
  propre à la Première (barème, textes, niveaux, `estPremiere()`) avant de proposer un plan.
- **Matière première** : les questions tombées au bac en Terminale (sujets 2024, 2025, 2026).
  On **ne recopie pas** : chaque question devient une **famille** à valeurs aléatoires, avec des
  mauvaises réponses qui reprennent les erreurs classiques (règles de `REGLES-FICHES.md` §7).
- **Affirmations à justifier** : les sujets récents sont surtout faits d'« affirmations à justifier »,
  que le site ne gère pas et ne doit pas gérer (aucune rédaction demandée à l'élève).
  **Méthode retenue par David** : transformer l'affirmation en **la question à laquelle sa justification
  répond**, avec 4 choix dont les mauvais correspondent aux erreurs de copie. Autres formes possibles,
  moins riches : vrai/faux puis choix de la bonne justification ; choisir l'affirmation vraie parmi quatre ;
  un simple vrai/faux (à éviter, une chance sur deux). Les affirmations qui ne s'y prêtent pas
  (récurrence, démonstration, figure trop particulière) sont **signalées avec la raison**, pas forcées.
- **Barème** : 1 point par question, sans pénalité, comme au bac. Le niveau 3 pourrait avoir des
  pénalités (à confirmer par David) ; il faudrait alors une option « je ne sais pas », et `bareme.js`
  ne gère pas de points négatifs. À trancher au moment du pilote, exemple sous les yeux.
- **Pas de rédaction** : le site ne propose aucune question à justifier.

## 2. Sources

Dans le dépôt, ne garder que **les exercices retenus** (énoncé, corrigé officiel, référence :
année, centre, numéro, lien), pas les sujets entiers. Dossier prévu : `outils/qcm-bac/sources/`.
Les sources LaTeX sont préférées aux PDF (texte et formules exacts) ; les PDF servent pour les figures.

- 2024 : https://www.apmep.fr/IMG/tex/Exercices_0_2024_FK_2.tex
- 2025 : https://www.apmep.fr/IMG/tex/Annee_spe_2025_DV.tex
- 2026 : https://www.apmep.fr/Annee-2026 (un fichier par sujet, à récupérer un par un)
- Programme officiel de Terminale spécialité (attendus et approfondissements) : **déposé le 18/10/2026** dans
  `outils/qcm-bac/sources/` (PDF et version texte, voir son `README.md`).

## 3. Prochaines étapes (dans l'ordre)

1. **Accès aux sources** — *fait le 17/10/2026* : `www.apmep.fr` était refusé par la politique réseau du
   conteneur cloud (403 du proxy) ; David a modifié l'environnement et le téléchargement fonctionne.
   Fichiers `.tex` récupérés dans le dossier temporaire de la session (non conservés dans le dépôt).
2. Programme officiel — *lu en entier le 17/10/2026* (PDF donné par David dans la session cloud, copié le
   18/10/2026 dans `outils/qcm-bac/sources/`) ; découpage en thèmes dans `outils/qcm-bac/pilote-suites.md` §1.
3. `moteur.js` — *lu le 17/10/2026* : déjà générique (banques enregistrées par identifiant, QCM à 4 options,
   niveaux 1 à 3, modes fiche et chrono, barème par table). Propre à la Première : les pages, les 8 banques,
   `bareme-sujet-blanc.js` et le lien en dur de `assets/js/mes-devoirs.js` (ligne 40). Pas de copie du moteur.
4. **Index des exercices** (année, centre, numéro, thème, type QCM / affirmation) — *brouillon fait le
   17/10/2026* : `outils/qcm-bac/index-exercices.md`, 47 exercices candidats (les vrais sujets de 2024, page
   `https://www.apmep.fr/Annee-2024`, ont été ajoutés le même jour ; le fichier donné d'abord pour 2024 était
   les « Exercices 0 », gardés en complément), **à faire valider par David**. Les affirmations isolées dans un
   exercice rédigé sont mises à part.
5. **Thème pilote : les suites** (choisi le 17/10/2026, David m'a laissé choisir). Proposition, quatre exemples
   de conversion (question d'origine à côté) et familles prévues : `outils/qcm-bac/pilote-suites.md`.
   **À valider par David avant tout code.** La géométrie dans l'espace viendra ensuite.
6. Banque pilote complète : 3 niveaux, vérificateurs indépendants testés par mutation, barème, audit de rédaction.
7. Bloc dans la navigation et sur l'accueil, comptes et classes de Terminale (le code distingue aujourd'hui
   Seconde et Première), attribution des devoirs et tableau de bord.

## 4. Points d'attention connus

- Les thèmes de Terminale sont plus conceptuels : un tirage aléatoire peut donner des énoncés dégénérés
  ou ambigus (limites, asymptotes, géométrie dans l'espace). Chaque famille a besoin d'un contrôle
  indépendant de la réponse, peut-être avec de la dérivation ou de l'intégration symbolique.
- Géométrie dans l'espace : le site n'a que des figures 2D (`graphiques.js`) ; la 3D viendrait plus tard.
- Aucune classe de Terminale n'existe encore dans Firestore ni dans les outils de création de comptes.
- Les sujets de bac sont publics ; GitHub Pages publie tout le dépôt, donc les extraits rangés ici seront en ligne
  une fois sur `master`.

## 5. Pilote codé le 17/10/2026 (après validation des quatre exemples par David)

Décisions de David : quatre propositions par question ; **séries de 10 questions** (plus qu'au bac, pour s'entraîner) ;
essai d'un **mélange de deux thèmes** (suites et géométrie dans l'espace, sans figure) ; **niveau 3 = questions plus
difficiles + pénalités**. Pénalité retenue : **0,25 point par mauvaise réponse** (une question laissée sans réponse ne
retire rien, la note ne descend pas sous 0) — valeur à confirmer par David, elle tient en un seul réglage
(`bareme.penalites` dans `qcm-bac/fiche.html`).

- **Pages et banques** : `qcm-bac/fiche.html` (page de fiche, 2 thèmes, 10 questions, trois niveaux, modes fiche et
  chrono), `qcm-bac/banques/01-suites.js` (7 familles) et `02-geometrie-espace.js` (8 familles). Elles réutilisent
  `automatismes/assets/moteur.js` et `automatismes.css`. Pas encore : page d'accueil du bloc, entrée dans la
  navigation, comptes et classes de Terminale, devoirs (aucun suivi Firebase sur la page).
- **Moteur** (`automatismes/assets/moteur.js`), deux options **facultatives**, sans effet sur la Première (vérifié) :
  `bareme.penalites` (`{3: 0.25}` : points retirés par mauvaise réponse à ce niveau) et `textesNiveau` (phrases des
  trois niveaux). Le bilan affiche alors les mauvaises réponses et leur retrait.
- **Contrôle** : `node outils/qcm-bac/controle-banques.js [--essais N] [--banque ID] [--mutation] [--apercu N]`.
  Il tire des questions brutes, contrôle la rédaction, puis **recalcule la vérité de chaque option de façon
  indépendante** (premiers termes, itérations de récurrences, modèles de suites pour les théorèmes, coordonnées) ; avec
  `--mutation`, il échange la bonne réponse avec une mauvaise et vérifie que le contrôle échoue. Résultat du
  17/10/2026 : 18 500 questions, 0 anomalie, mutation détectée 2 212 / 2 212. Il a trouvé et fait corriger : plan
  (ABC) confondu avec une équation du même plan, trois points toujours alignés quel que soit `m`, option
  « pour tout m » vraie, option fausse en double.
- **Navigateur** (Chromium, MathJax en local, voir `SUIVI-FIREBASE.md` §7) : 10 questions réparties 5 + 5, trois niveaux,
  aucune erreur MathJax ni console, pas de défilement horizontal à 390 px, note calculée (niveau 3 : 6 bonnes, 3 fausses,
  1 sans réponse → 5,25 / 10 ; niveau 2 : 6 / 10).
- **Essai en ligne sans passer par `master`** : artefact privé https://claude.ai/artifact/42e4JA2yp4B59e5CKMFvq9 (copie
  à plat de la page ; non testé dans l'artefact lui-même).
- **Limites connues** : peu d'énoncés distincts pour quelques familles de niveau 1 (≈ 17 à 40) ; la famille
  « convergence monotone » a 4 énoncés de fond (habillés par des lettres variées) ; pas d'option « je ne sais pas »
  (on laisse la question vide) ; le niveau 3 de géométrie n'a pas de question sur l'intersection de deux plans ni sur les sphères
  (approfondissements du programme) ; barème fixe à 1 point par question (pas de table par famille).
- **À valider par David** : la valeur de la pénalité, la lecture des questions des deux thèmes (surtout le niveau 3),
  l'équilibre 5 + 5, puis la suite : autres thèmes (exponentielle et logarithme, dérivation et convexité, intégration,
  probabilités et dénombrement, équations différentielles), puis navigation, accueil, comptes et devoirs.
