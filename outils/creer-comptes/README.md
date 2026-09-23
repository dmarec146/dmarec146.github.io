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

1. Préparer un CSV avec les colonnes `classe,prenom,nom` — voir
   `eleves-exemple.csv`. Le pseudo (identifiant de connexion) est généré
   automatiquement : première lettre du prénom + `.` + nom (`David Marec`
   → `d.marec`). En cas de doublon (même initiale + même nom dans la même
   liste), un chiffre est ajouté (`d.marec2`, `d.marec3`...).

   Pour que les comptes déjà créés gardent le même pseudo d'un lancement à
   l'autre (et ne soient pas recréés en double), **ajoute les nouveaux
   élèves à la fin du fichier** plutôt que d'insérer une ligne au milieu ou
   de réordonner celles qui existent déjà.

   Variante : un CSV avec `classe,pseudo` (pseudo déjà choisi à la main)
   fonctionne aussi, le pseudo est alors utilisé tel quel.

   **Élève hors classe** : laisser la valeur de `classe` vide (la colonne
   doit rester présente, par exemple la ligne `;Ewenn;Marec`). Aucune classe
   n'est alors enregistrée : l'élève n'est rattaché à aucun niveau, n'a pas
   de devoirs, et le tableau de bord le range sous « Hors classe » avec le
   suivi des cahiers ET des automatismes (tous les niveaux).
2. Lancer :
   ```bash
   node creer-comptes.js mes-eleves.csv
   ```
3. Le script affiche sa progression et écrit un fichier
   `comptes-crees-<date>.csv` dans ce dossier (nom, prénom, identifiant, mot
   de passe généré pour chacun — séparateur `;`, compatible Excel en
   français). **Ce fichier contient des mots de passe en clair** : à
   distribuer aux élèves puis à supprimer une fois fait. Il est dans
   `.gitignore` (jamais commité), mais reste dans ce dossier — donc
   synchronisé sur Google Drive comme le reste du projet.
