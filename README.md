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

Deux consignes ne sont contrôlées que par l'égalité numérique, ce qui les rend inopérantes. Les deux correctifs sont écrits et vérifiés dans `cahiers/seconde/cahier-1/fiche-01.html` ; il reste à les transposer en Première.

- **Contrôle de forme factorisée.** Une consigne « Factoriser » est corrigée par simple égalité numérique : répondre `x²−64` à « factoriser `x²−64` » est donc accepté. Le correctif est la fonction `estFactorise`, qui vérifie que la racine de l'expression saisie est un produit ou une puissance, plus un indicateur `formeFactorisee` sur les exercices concernés. À porter sur les fiches 01 à 05.

- **Contrôle d'irréductibilité.** Une consigne « sous forme de fraction irréductible » accepte `4/6` pour `2/3`, ainsi qu'une écriture décimale ou un calcul non effectué. Le correctif est la fonction `estFractionIrreductible`, qui exige un entier ou un quotient de deux entiers premiers entre eux, plus un indicateur `fractionIrreductible`. Attention : là où la réponse enregistrée est le calcul de départ et non son résultat, il faut aussi la remplacer par la fraction réduite, sinon le corrigé affiche l'énoncé. À porter sur les fiches 02, 04, 09, 10, 11, 14, 19 et 23.

## Publier une modification

Le site se met à jour automatiquement (1-2 minutes) après un push sur la branche `master` :

```bash
git add -A
git commit -m "description du changement"
git push
```
