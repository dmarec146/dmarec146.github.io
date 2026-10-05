# Barème en points des fiches de calcul

Fiches pilotes (05/10/2026) : **Première 2** et **Première 9**. Chaque fichier
`fiche-NN.json` donne, pour chaque question, `[catégorie, points, justification]`.
**La justification est pour l'enseignant** : l'élève ne voit que les points de chaque question
et le total en tête de fiche (jamais la catégorie ni l'explication).

## Règles retenues (David)

- Points de **0,5 à 2 par question, par quart de point** ; total de base entier, pas fixé à 30
  (les fiches n'ont pas toutes le même nombre de questions).
- Le **temps** (longueur du calcul) compte peu : on valorise la compréhension et l'initiative.
- **Catégories** (bandes de points) :
  - **A** automatisme, calcul direct : 0,5 à 0,75 (1 exceptionnellement, pour le plus délicat) ;
  - **B** application d'une formule ou d'un algorithme : 0,5 à 1,25 (dérivées ≤ 1, inéquation
    classique du second degré ≤ 1) ;
  - **C** enchaînement avec choix de démarche : 1 à 1,25 ;
  - **D** initiative et compréhension (paramètres, traduction d'un énoncé) : 1,25 à 1,75 ;
  - **E** calcul avancé = **bonus** : 1,5 à 2.
- **Bonus (E)** : une bonne réponse s'ajoute au score **et** au total (la note ne dépasse jamais
  100 %) ; une mauvaise réponse ou une absence de réponse reste hors barème, sans pénalité.

## Mise en œuvre

- `assets/js/bareme.js` : affichage (pastille de points par question, « Total : N points » en
  tête) et calcul de la note (`Bareme.calculer`).
- Chaque fiche contient `Bareme.definir({...})` : **généré** par `node appliquer-bareme.js NN`
  à partir de `fiche-NN.json` (à relancer après toute modification des points ;
  `--verif` signale un écart sans écrire).
- La note est enregistrée en points (`score`, `totalExercices`, `nbQuestions` dans
  `devoirsTentatives`) ; `nbQuestions` sert à la colonne « Non-réponses » du tableau de bord.
- Un barème est lié aux **identifiants** de questions (« 9.6 a) ») : renuméroter une fiche
  oblige à mettre à jour son fichier.

## Limite connue

Le barème est attaché à la **position** de la question. Si le générateur tire des cas plus ou
moins difficiles pour une même position, les points ne suivent pas : resserrer les plages de
l'aléatoire (chantier « moteur robuste ») ou faire dépendre les points des paramètres tirés.
