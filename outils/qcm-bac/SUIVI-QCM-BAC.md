# Bloc « QCM Bac » (Terminale spécialité mathématiques) — suivi du chantier

**Statut au 17/10/2026 : en cadrage, aucun code écrit.** Décisions prises avec
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
- Programme officiel de Terminale spécialité (attendus et approfondissements) : **pas encore déposé**.

## 3. Prochaines étapes (dans l'ordre)

1. **Accès aux sources** — *fait le 17/10/2026* : `www.apmep.fr` était refusé par la politique réseau du
   conteneur cloud (403 du proxy) ; David a modifié l'environnement et le téléchargement fonctionne.
   Fichiers `.tex` récupérés dans le dossier temporaire de la session (non conservés dans le dépôt).
2. Programme officiel — *lu en entier le 17/10/2026* (fichier PDF donné par David dans la session cloud, non
   déposé dans le dépôt) ; découpage en thèmes dans `outils/qcm-bac/pilote-suites.md` §1.
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
