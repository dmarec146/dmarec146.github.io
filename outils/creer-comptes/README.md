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
node creer-comptes.js --admin ton-email@exemple.fr
```

Accorde au compte les droits `admin` (voit tout, fréquentation comprise) et
`enseignant` (a ses propres élèves et devoirs, comme un collègue). Si le compte
n'existe pas encore, ajouter un mot de passe à la suite de l'adresse pour le
créer ; ne pas le saisir pour un compte qui existe déjà. Relançable sans risque.
Se déconnecter puis se reconnecter sur le site pour que les droits prennent effet.

## Inviter un collègue (enseignant)

```bash
node creer-comptes.js --enseignant collegue@ac-creteil.fr
```

L'adresse doit être **académique** (`@ac-creteil.fr`, `@ac-paris.fr`...) : c'est
une preuve simple qu'il s'agit d'un enseignant. Pour accepter une autre adresse
(décision à prendre cas par cas, par exemple un compte de test), ajouter
`--adresse-libre` à la fin de la commande.

Crée le compte avec un mot de passe aléatoire que personne ne connaît et lui
accorde le seul droit `enseignant`. Avec l'option **`--envoyer`**, c'est
**Firebase qui envoie lui-même le courriel** (en français) contenant le lien pour
choisir son mot de passe : c'est la façon recommandée.

```bash
node creer-comptes.js --enseignant collegue@ac-creteil.fr --envoyer
```

Sans `--envoyer`, la commande affiche le lien à la place ; certaines messageries
le « consomment » en le prévisualisant et il apparaît alors comme expiré, donc à
éviter. Le lien est valable environ une heure : relancer la même commande envoie
un nouveau courriel (mot de passe oublié, ou invitation trop ancienne). La
personne se connecte ensuite avec son adresse e-mail sur la page Connexion.
Un enseignant ne voit que **ses** élèves et **ses** devoirs ; il n'a pas accès à
la fréquentation du site et ne peut pas créer de comptes élèves : c'est toi qui
les crées pour lui (section suivante), à partir de la liste qu'il t'envoie.

## Élèves d'un collègue : comptes et étiquettes en une commande

```bash
node comptes-et-etiquettes.js liste.csv --enseignant=collegue@ac-creteil.fr
```

Crée les comptes **nouveaux** (comme `creer-comptes.js`), puis fabrique les
étiquettes et range tout dans un dossier au nom de l'enseignant :

    Documents\comptes-enseignants\<adresse e-mail>\<AAAA-MM-JJ_HHhMM>\
        comptes-<classe>.csv              identifiants et mots de passe (Excel)
        etiquettes-<classe>-<date>.pdf    à imprimer et découper (2 colonnes × 5)
        individuelles\<classe>\*.png      une étiquette par élève, à envoyer par message
        LISEZ-MOI.txt

Les étiquettes portent l'adresse `cahiers-interactifs.fr` (option
`--site=<adresse>` pour une autre ; `--racine=<dossier>` change l'emplacement).
Une liste avec plusieurs classes donne un jeu de fichiers par classe. Relancer
sur la même liste n'ajoute rien. **Ces fichiers contiennent des mots de passe en
clair et des noms d'élèves** : les envoyer à l'enseignant, puis les supprimer,
ainsi que la liste reçue. Prérequis : `npm install` fait dans
`outils/etiquettes`.

## Rattacher les élèves et devoirs déjà existants (une seule fois)

Passage à plusieurs enseignants (26/10/2026) : chaque élève et chaque devoir
porte désormais le champ `enseignant` (uid de son enseignant). Les anciens
n'ont pas ce champ ; il faut les rattacher à ton compte, **après une
sauvegarde** et avant de publier le nouveau code :

```bash
node migrer-enseignant.js ton-email@exemple.fr          # simulation : ne change rien
node migrer-enseignant.js ton-email@exemple.fr --oui    # applique
```

Sans danger pour l'ancien code (le champ ajouté est ignoré) ; relançable (ne
touche que ce qui n'est pas encore rattaché).

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
2. Lancer, en indiquant **l'enseignant à qui appartiennent ces élèves** (obligatoire :
   jamais d'élève rattaché à personne) :
   ```bash
   node creer-comptes.js mes-eleves.csv --enseignant=ton-email@exemple.fr
   ```
   Si un pseudo est déjà pris par un autre élève (homonyme, ou élève d'un
   autre enseignant), le script prend le suivant libre (`d.marec2`...) ;
   relancer le même fichier n'ajoute rien.
3. Le script affiche sa progression et écrit un fichier
   `comptes-crees-<date>.csv` dans ce dossier (nom, prénom, identifiant, mot
   de passe généré pour chacun — séparateur `;`, compatible Excel en
   français). **Ce fichier contient des mots de passe en clair** : à
   distribuer aux élèves puis à supprimer une fois fait. Il est dans
   `.gitignore` (jamais commité), mais reste dans ce dossier — donc
   synchronisé sur Google Drive comme le reste du projet.
