# Phrases des détails de correction : catalogue, assertions, relecture indépendante

Complète `outils/details-correction/` : celui-ci vérifie les **calculs** des étapes, celui-là gère les **mots** (les `\text{…}`).
Aucun des deux ne coûte de crédits ; seule la relecture indépendante par un agent en consomme, et seulement pour les phrases nouvelles.

## Les trois mécanismes

1. **Assertions** (`assertions.js`). Une phrase qui affirme quelque chose (« on divise par un nombre négatif », « car la suite est
   arithmétique », « la valeur 1 est interdite ») n'est affichée que si l'affirmation est vraie dans le tirage. Chaque assertion est
   testée par l'outil des détails sur **chaque ligne de chaque tirage** (des milliers de contrôles par fiche). `essais-assertions.js`
   prouve que chaque assertion refuse bien un cas faux : `node outils/phrases-details/essais-assertions.js`.
2. **Catalogue** (`catalogue.json`, suivi par git). Chaque phrase relue y est inscrite : `validee` ou `refusee`, par qui (`agent`,
   `david`, `claude`), quand, pourquoi. `controle-phrases.js` compare les phrases utilisées par les fiches au catalogue et ne signale
   que celles qui sont **nouvelles** ou **refusées** : une phrase déjà validée n'est jamais relue deux fois, d'une fiche à l'autre.
3. **Relecture indépendante** (`demande-relecture.md`, produit pour les phrases nouvelles). Texte à confier à un agent relecteur qui
   n'a pas vu le code : sa seule mission est de chercher des raisons de refuser chaque phrase (fausse dans un cas particulier,
   affirmation non garantie par l'énoncé, formulation ambiguë ou fautive). Ses verdicts sont enregistrés dans le catalogue.

## Le déroulement pour une fiche

```
node outils/details-correction/controle.js cahiers/<niveau>/<cahier>/fiche-NN.html     calculs, assertions, interface ; écrit phrases.json
node outils/phrases-details/controle-phrases.js                                        phrases nouvelles ? écrit demande-relecture.md
   (l'agent relit demande-relecture.md et rend un tableau JSON de verdicts)
node outils/phrases-details/controle-phrases.js --verdicts verdicts.json --source agent
node outils/phrases-details/controle-phrases.js                                        doit annoncer 0 nouvelle, 0 refusée
```
Une phrase refusée se corrige dans la fiche (le rapport donne le motif et la correction proposée), puis on relance.

## Qui fait quoi

- **Claude** lance les trois commandes, confie la relecture à l'agent, applique les corrections et enregistre les verdicts : rien de
  tout cela n'exige David.
- **David** n'a rien à lancer. Il peut, s'il le souhaite : lire `catalogue.json` (la liste de toutes les phrases validées, avec leur
  source), ouvrir `outils/details-correction/exemples.html`, ou contester une phrase (« refuse cette phrase » : Claude la passe à
  `refusee` avec son motif). Une phrase validée par `agent` peut être confirmée par `david` en la relisant :
  `node outils/phrases-details/controle-phrases.js --verdicts v.json --source david`.

## Ce que cela ne garantit pas

Un relecteur indépendant, comme n'importe quel relecteur, peut laisser passer une erreur. Les assertions ne couvrent que les
phrases qui ont une condition vérifiable par programme. Le catalogue enregistre qui a validé chaque phrase pour que l'on sache ce
qui a été relu par un humain et ce qui ne l'a été que par un agent.
