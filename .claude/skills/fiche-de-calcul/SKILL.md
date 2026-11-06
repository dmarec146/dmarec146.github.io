---
name: fiche-de-calcul
description: Créer, modifier, réduire ou vérifier une fiche de calcul des cahiers interactifs (cahiers/seconde|premiere|terminale/cahier-N/fiche-NN.html) — déroulé, contrôles et références. À utiliser pour « crée la fiche N », « simplifie la fiche », « ajoute les Détails de correction », « vérifie la fiche », « barème de la fiche ». Les règles de rédaction ne sont PAS dans ce skill : elles sont dans REGLES-FICHES.md, lu à chaque usage.
---

# Fiche de calcul : déroulé

**Les règles de rédaction vivent dans `REGLES-FICHES.md` (une seule source). Ce skill ne les recopie pas.** Toute règle
générale nouvelle donnée par David va dans ce fichier (jamais une exception ponctuelle : celle-ci va dans l'entrée datée de
`HISTORIQUE.md`). Répondre en français.

## 0. Au départ (toujours)

1. Lire `REGLES-FICHES.md` **en entier** : il dépasse la limite de l'outil de lecture, le lire en deux fois (`offset`).
2. Lire `SUIVI-FIREBASE.md` (état, pièges) si ce n'est pas déjà fait dans la session, et la mémoire `project_terminale_cahiers`
   pour la Terminale (source : PDF de David, numérotation du site, décisions).
3. Lire les deux références de ce skill :
   - `references/contenu-fiche-neuve.md` : ce qu'une fiche neuve doit contenir (scripts, CSS, structure, moteur) ;
   - `references/bugs-generateur.md` : défauts à chasser (tirages, énoncé et réponse, rendu LaTeX, saisie, mise en page,
     pièges d'outils, figures, leçons de méthode). La mémoire d'origine (268 Ko) est archivée dans
     `Documents\sauvegardes-site\memoire-2026-11-06\`.

## 1. Cadrage

- Repérer le fichier par `Glob **/fiche-NN.html` (le numéro d'une fiche ne donne pas le dossier `cahier-N`).
- Confirmer le sujet et le plan avec David (PDF source en Terminale ; l'ancien titre d'un fichier existant ne fait pas foi).
  Un message qui mêle consignes et vraie question : répondre d'abord à la question.
- Fiche portant un devoir en cours : ne pas la modifier sans l'accord de David.
- Un widget nouveau (tableau de signes…) ou une convention visuelle jamais vue : poser les décisions à David avant de coder
  (`AskUserQuestion`, une question à la fois, une recommandation) et demander un exemple.

## 2. Chercher l'existant AVANT d'écrire un générateur (porte, pas suggestion)

`grep -rn` des mots du sujet ET des mécanismes (équation, inéquation, intervalle, ensemble, système, encadrement, formule,
limite…) dans `cahiers/premiere/`, `cahiers/seconde/`, `cahiers/terminale/`, `automatismes/premiere/banques/`. Lire en entier
ce qui sort (générateurs, fonctions de contrôle à copier mot pour mot, clavier, texte de l'aide). Noter ce qui a été trouvé
(ou pourquoi rien : un contenu mathématique peut manquer, jamais l'infrastructure). Si une version maison diverge de
l'existant, la supprimer et reprendre l'original.

## 3. Construire

- Partir de la **dernière fiche validée du même niveau** (aujourd'hui `cahiers/terminale/cahier-3/fiche-06.html`), comparer son
  CSS et ses scripts avant d'écrire le corps (`references/contenu-fiche-neuve.md`).
- Concevoir les générateurs groupe par groupe : dériver à la main et comparer aux chiffres de la fiche d'origine ; **construire
  à l'envers** (choisir la réponse, déduire les paramètres) ; la réponse stockée est la forme FINALE (factorisée, réduite), pas
  une forme équivalente ; élargir l'aléatoire et le MESURER (≈ 40 énoncés distincts par question) ; coefficients signés.
- Écrire les fichiers avec l'outil d'édition ou des scripts Node : jamais `sed -i`, ni LaTeX dans un `sed`/`perl`/heredoc
  (antislashs mangés, fins de ligne CRLF/LF converties). Vérifier avec `file` et `git ls-files --eol -m`.
- Types de réponse : mécanismes existants d'abord (`moteur-reponses.js` et sa table `formes-par-fiche.json`, clavier
  `claviers.js`, type `formule`, `limite`, `famille`…).

## 4. Vérifier par paliers (relancer après chaque correction)

0. Syntaxe : `node outils/verification/verifier-syntaxe-fiches.js` (0 erreur).
1. Balayage de plusieurs centaines de tirages : pas d'exception, nombre d'exercices attendu, aucune chaîne `NaN`, `undefined`,
   `Infinity`, `/0`, double signe, `^{1}`, `1x` (énoncé, réponse, corrigé).
2. **Recalcul indépendant** depuis l'énoncé AFFICHÉ (pas la formule du générateur ; pas l'auto-cohérence), propriété attendue
   pour les seuils, deux valeurs non dégénérées pour un leurre.
3. **Cycle complet dans le navigateur** : chaque corrigé retapé dans le vrai champ (touches `key`, pas `type`) est accepté
   (N/N) ; une réponse fausse ou mal formée est refusée ; bornes strictes/larges inversées refusées.
4. Panneau « Voir toutes les réponses » relu (aucune erreur MathJax, écritures lisibles) ; capture d'écran pour ce qu'on ne voit qu'à
   l'œil ; figures : contenu, amplitude, points du quadrillage (`references/bugs-generateur.md` §I).
5. Détails de correction et barème si la fiche en a : `node outils/details-correction/controle.js <fiche>` (réglages robustes
   par défaut ; `--rapide` en rédaction), phrases : `node outils/phrases-details/controle-phrases.js` puis relecteur indépendant ;
   ne pas relancer `controle-phrases.js` pendant qu'un relecteur lit `demande-relecture.md` (REGLES-FICHES §8, §4).
6. Manifeste : `assets/js/manifeste-fiches.js` puis `node outils/verification/verifier-manifeste.js` (0 écart).
7. **Audit des réponses** `node outils/audit-reponses/audit.js` : une seule fois, quand David a fini ses modifications (REGLES §5).
   Claviers : `outils/audit-claviers/` après toute retouche de clavier ou de MathLive.

Navigateur intégré : laisser les onglets ouverts ; si la vue est blanche mais que le DOM est présent, réessayer avant d'en parler ;
un focus se vérifie par un vrai clic, pas par `mf.focus()`.

## 5. Terminer

- Entrée datée à la fin de `HISTORIQUE.md` ; `SUIVI-FIREBASE.md` si l'état ou un piège change ; règle générale nouvelle →
  `REGLES-FICHES.md` ; connaissance durable sur David ou sur un outil → mémoire.
- Présenter le résultat à David. **Ne rien pousser** sans son « push » / « pousse tout » (`git fetch` d'abord ; après un push :
  publication sur Hosting, dire « en ligne »).
