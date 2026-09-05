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

Certaines consignes portent sur la **forme** de la réponse, mais n'étaient contrôlées que par l'égalité numérique, ce qui les rendait inopérantes. Les deux contrôles ci-dessous sont désormais en place ; cette section reste pour documenter leur périmètre et leurs exclusions volontaires.

- **Contrôle de forme factorisée — fait.** La fonction `estFactorise` vérifie que la racine de l'expression saisie est un produit ou une puissance ; un produit divisé par une constante (`(3x−1)²/9`) en est un. Son second paramètre `'numerateur'` restreint l'exigence au numérateur du quotient obtenu, pour les consignes « calculer f'(x) puis factoriser le numérateur ». Elle est en place sur la fiche 01 de Seconde et sur les fiches 01, 03, 05, 07, 09, 10, 12, 15, 22 et 28 de Première, soit 109 exercices.

  L'exigence est posée **par table déclarative** (`FORMES_FACTORISEES`, en tête de chaque fiche), et non exercice par exercice : les formes de déclaration diffèrent trop d'une fiche à l'autre. La clé est un identifiant complet ou un préfixe de groupe. **Tout exercice absent de la table est volontairement hors exigence** — il ne s'agit pas d'un oubli. Sont ainsi exclus :

  - les consignes souples « lorsque cela est possible, on s'efforcera de fournir la réponse sous forme factorisée » (groupes 12.4, 12.5, 12.7, 12.8, 12.10, 12.14 à 12.16) : elles n'exigent rien, et beaucoup de leurs corrigés ne sont eux-mêmes pas factorisés ;
  - le groupe 6.2, qui demande de *simplifier* une fraction en factorisant par `n^k` — la réponse est un quotient ;
  - les questions préparatoires 3.11 a) et 3.12 a), qui sont des calculs de `P(r)` ;
  - le groupe 9.16, dont les réponses sont vides.

- **Contrôle d'irréductibilité — fait.** La fonction `estFractionIrreductible` exige un entier ou un quotient de deux entiers premiers entre eux ; son paramètre `facteurSymbolique` (`"pi"`) couvre les angles en radians. Elle est en place sur la fiche 01 de Seconde et sur les fiches 02, 04, 09, 10, 14, 19 et 23 de Première, via l'indicateur `fractionIrreductible` posé sur 46 exercices.

  Deux réserves à connaître. La fiche 11 de Première est **volontairement exclue** : son groupe 11.1 porte sur des fractions en `n`, où l'irréductibilité est celle de deux polynômes — un contrôle numérique ne la teste pas. Et là où la réponse enregistrée était le calcul de départ plutôt que son résultat, il a fallu la remplacer par la fraction réduite, sinon le corrigé affichait l'énoncé : c'était le cas du groupe 2.2.

## Publier une modification

Le site se met à jour automatiquement (1-2 minutes) après un push sur la branche `master` :

```bash
git add -A
git commit -m "description du changement"
git push
```
