# Étiquettes à découper

Outil séparé du site : il tourne sur ton ordinateur, jamais sur GitHub Pages.
Transforme le fichier produit par `outils/creer-comptes` en étiquettes PDF
(nom, prénom, adresse du site, identifiant, mot de passe), prêtes à imprimer
et découper au massicot.

## Installation (une fois)

```bash
npm install
```

## Utilisation

```bash
node generer-etiquettes.js "..\creer-comptes\comptes-crees-<date>.csv"
```

Écrit `etiquettes-<date>.pdf` dans ce dossier : 2 colonnes × 5 lignes par
page A4, avec un repère pointillé de découpe autour de chaque étiquette.
Une classe de 21 élèves tient sur 3 pages.

**Ce PDF contient les mots de passe en clair** : à imprimer puis supprimer.
Il est dans `.gitignore`, jamais commité.

Pour changer la mise en page (nombre de colonnes/lignes, taille du texte,
adresse du site affichée), voir les constantes en tête de
`generer-etiquettes.js`.
