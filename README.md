# Cahiers de calcul

Site d'exercices de mathématiques auto-corrigés pour lycéens, à travailler directement dans le navigateur (sans compte, sans installation).

Site en ligne : https://dmarec146.github.io/

## Structure du dépôt

```
index.html                     page d'accueil du site
assets/css/style.css            feuille de style commune
cahiers/index.html              page listant tous les cahiers
cahiers/premiere/cahier-N/      cahiers de Première (N = 1 à 10)
cahiers/seconde/cahier-N/       cahiers de Seconde (N = 1 à 3)
```

Chaque dossier `cahier-N/` contient :
- `index.html` : sommaire du cahier, avec les liens vers ses fiches
- `fiche-XX.html` : une fiche d'exercices (XX = numéro de fiche à deux chiffres, numéroté en continu sur tout le niveau)

## Ajouter une fiche ou un cahier

1. Créer le fichier `fiche-XX.html` dans le dossier du cahier concerné, en repartant de la structure d'une fiche existante du même niveau (mêmes balises `<head>`, mêmes classes CSS).
2. Ajouter le lien vers la nouvelle fiche dans l'`index.html` du cahier.
3. Si c'est un nouveau cahier : créer le dossier `cahier-N/`, son `index.html`, puis l'ajouter dans `cahiers/index.html`.

## Chantiers en cours

Certaines consignes portent sur la **forme** de la réponse, mais n'étaient contrôlées que par l'égalité numérique, ce qui les rendait inopérantes.

- **Contrôle de forme factorisée — à faire.** Une consigne « Factoriser » est corrigée par simple égalité numérique : répondre `x²−64` à « factoriser `x²−64` » est donc accepté. Le correctif est la fonction `estFactorise`, qui vérifie que la racine de l'expression saisie est un produit ou une puissance, plus un indicateur `formeFactorisee` sur les exercices concernés. Écrit et vérifié dans `cahiers/seconde/cahier-1/fiche-01.html`, il reste à le porter sur les fiches 01 à 05 de Première.

- **Contrôle d'irréductibilité — fait.** La fonction `estFractionIrreductible` exige un entier ou un quotient de deux entiers premiers entre eux ; son paramètre `facteurSymbolique` (`"pi"`) couvre les angles en radians. Elle est en place sur la fiche 01 de Seconde et sur les fiches 02, 04, 09, 10, 14, 19 et 23 de Première, via l'indicateur `fractionIrreductible` posé sur 46 exercices.

  Deux réserves à connaître. La fiche 11 de Première est **volontairement exclue** : son groupe 11.1 porte sur des fractions en `n`, où l'irréductibilité est celle de deux polynômes — un contrôle numérique ne la teste pas. Et là où la réponse enregistrée était le calcul de départ plutôt que son résultat, il a fallu la remplacer par la fraction réduite, sinon le corrigé affichait l'énoncé : c'était le cas du groupe 2.2.

## Publier une modification

Le site se met à jour automatiquement (1-2 minutes) après un push sur la branche `master` :

```bash
git add -A
git commit -m "description du changement"
git push
```
