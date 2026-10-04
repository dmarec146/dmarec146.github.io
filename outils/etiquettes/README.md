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
node generer-etiquettes.js "..\creer-comptes\comptes-crees-<date>.csv" "2nde-207"
```

Le deuxième argument (nom de la classe) est optionnel — s'il est fourni, il
apparaît à côté du prénom sur chaque étiquette, ET dans le nom du fichier
produit. Comme un fichier de comptes correspond en général à une seule
classe, il s'applique à toutes les étiquettes du fichier.

Écrit `etiquettes-<classe>-<date>.pdf` dans ce dossier (ou juste
`etiquettes-<date>.pdf` sans le deuxième argument) : 2 colonnes × 5 lignes
par page A4, avec un repère pointillé de découpe autour de chaque
étiquette. Une classe de 21 élèves tient sur 3 pages.

**Ce PDF contient les mots de passe en clair** : à imprimer puis supprimer.
Il est dans `.gitignore`, jamais commité.

## Une étiquette PNG par élève (message individuel)

Pour envoyer ses identifiants à un élève par message (04/10/2026) :

```bash
npm install            # une fois (installe aussi @napi-rs/canvas)
node generer-etiquettes-individuelles.js "..\creer-comptes\comptes-crees-<date>.csv" "1ere-Gr 1"
```

Écrit `individuelles/<classe>/<NOM Prénom>.png` (un fichier par élève, nom de
fichier sans mot de passe, 900 × 420 px) : même contenu que l'étiquette PDF,
identifiant et mot de passe en police à chasse fixe pour distinguer `l`/`1`
et `O`/`0`. Le script **relit** le CSV, il ne modifie aucun compte. Le CSV ne
précise pas la classe : la donner en deuxième argument (voir le contenu des
fichiers `comptes-crees-*.csv` : un fichier = une classe). Le dossier
`individuelles/` contient les mots de passe en clair : il est dans `.gitignore`,
à supprimer une fois les messages envoyés.

Pour changer la mise en page (nombre de colonnes/lignes, taille du texte,
adresse du site affichée), voir les constantes en tête de
`generer-etiquettes.js`.
