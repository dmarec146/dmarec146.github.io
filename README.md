# Cahiers de calcul

Site d'exercices de mathématiques auto-corrigés pour lycéens, à travailler directement dans le navigateur (sans compte, sans installation).

Site en ligne : https://dmarec146.github.io/

## Structure du dépôt

```
index.html                     page d'accueil du site
assets/css/style.css            feuille de style commune
cahiers/index.html              page listant tous les cahiers
cahiers/premiere/cahier-N/      cahiers de Première (N = 1 à 10)
cahiers/seconde/cahier-N/       cahiers de Seconde (N = 1 à 4)
```

Chaque dossier `cahier-N/` contient :
- `index.html` : sommaire du cahier, avec les liens vers ses fiches
- `fiche-XX.html` : une fiche d'exercices (XX = numéro de fiche à deux chiffres, numéroté en continu sur tout le niveau)

## Ajouter une fiche ou un cahier

1. Créer le fichier `fiche-XX.html` dans le dossier du cahier concerné, en repartant de la structure d'une fiche existante du même niveau (mêmes balises `<head>`, mêmes classes CSS).
2. Ajouter le lien vers la nouvelle fiche dans l'`index.html` du cahier.
3. Si c'est un nouveau cahier : créer le dossier `cahier-N/`, son `index.html`, puis l'ajouter dans `cahiers/index.html`.

## Publier une modification

Le site se met à jour automatiquement (1-2 minutes) après un push sur la branche `master` :

```bash
git add -A
git commit -m "description du changement"
git push
```
