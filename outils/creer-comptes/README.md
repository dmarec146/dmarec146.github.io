# Création des comptes

Outil séparé du site : il tourne sur ton ordinateur, jamais sur GitHub Pages.
Il crée les comptes Firebase (élèves + toi en tant qu'enseignant) et leur
profil Firestore.

## Installation (une fois)

1. **Node.js** — installer depuis [nodejs.org](https://nodejs.org/) si ce
   n'est pas déjà fait (version LTS).
2. Dans ce dossier :
   ```bash
   npm install
   ```
3. **Clé de service Firebase** — Console Firebase → icône ⚙️ → Paramètres du
   projet → onglet *Comptes de service* → *Générer une nouvelle clé privée*.
   Enregistrer le fichier téléchargé ici sous le nom exact `service-account.json`.
   Ce fichier donne un accès total au projet Firebase : il est dans
   `.gitignore`, ne jamais le partager ni le commiter.

## Créer ton propre compte (enseignant)

```bash
node creer-comptes.js --admin ton-email@exemple.fr un-mot-de-passe-solide
```

Crée le compte s'il n'existe pas encore, et lui accorde le droit `admin`
(nécessaire pour la future page de tableau de bord). Relançable sans risque :
si le compte existe déjà, la commande se contente de lui (re)donner ce droit.

## Créer les comptes élèves

1. Préparer un CSV avec deux colonnes `classe,pseudo` — voir
   `eleves-exemple.csv`. Le pseudo est celui que tu choisis pour chaque
   élève (pas son nom réel : voir la note de confidentialité du cahier de
   suivi). Un compte existant (même pseudo) est ignoré, pas recréé.
2. Lancer :
   ```bash
   node creer-comptes.js mes-eleves.csv
   ```
3. Le script affiche sa progression et écrit un fichier
   `comptes-crees-<date>.csv` (pseudo + mot de passe généré pour chacun).
   **Ce fichier contient des mots de passe en clair** : à distribuer aux
   élèves puis à supprimer. Il est dans `.gitignore`, jamais commité.
