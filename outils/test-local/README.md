# Environnement de test local

Pour essayer le site (comptes, devoirs, tableau de bord) **sans toucher aux
données réelles** : fausse base et faux comptes sur le PC, site servi sur
`localhost`.

## Lancer

```bash
node outils/test-local/lancer.js
```

Prérequis : Node, Java, et les dossiers `node_modules` de
`outils/verification/regles-firestore` (firebase-tools) et
`outils/creer-comptes` (firebase-admin), déjà utilisés par les autres outils.
Il faut environ une minute pour que tout démarre ; le script affiche alors
l'adresse à ouvrir :

    http://localhost:5173/connexion/?emulateur=1

Le `?emulateur=1` branche la page sur les émulateurs (mémorisé dans ce
navigateur ; `?emulateur=0` le coupe). Un **bandeau rouge « MODE TEST »** reste
affiché en bas de chaque page tant que c'est actif. Le mécanisme ne fonctionne
que sur `localhost` / `127.0.0.1` (voir `assets/js/firebase-config.js`) :
impossible de brancher par erreur le vrai site sur l'émulateur, ou l'inverse.

Comptes fictifs (mot de passe `test1234` pour tous) :

| Compte | Rôle | Élèves |
|---|---|---|
| `david@exemple.test` | administrateur + enseignant | `d.demo1`, `d.demo2` |
| `collegue@exemple.test` | enseignant | `c.eleve1`, `c.eleve2` |

Les deux enseignants ont une classe du même nom (`2nde-207`) pour vérifier que
chacun ne voit que les siens. Les élèves se connectent avec leur pseudo
(`d.demo1`), les enseignants avec leur adresse.

Ctrl+C arrête tout ; les données fictives disparaissent à l'arrêt.

## Essayer les scripts de comptes sur l'émulateur

Dans un autre terminal, avec les deux variables ci-dessous, les outils de
`outils/creer-comptes` travaillent sur l'émulateur (aucune clé de service,
message « MODE TEST ») :

```bash
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
cd outils/creer-comptes
node creer-comptes.js --enseignant nouveau@exemple.test
node creer-comptes.js mes-eleves.csv --enseignant=collegue@exemple.test
node migrer-enseignant.js david@exemple.test
```

## Si le démarrage échoue (« port taken »)

Un émulateur d'une exécution précédente tourne encore (Java reste parfois en
arrière-plan sous Windows). Le repérer et l'arrêter :

```powershell
Get-CimInstance Win32_Process -Filter "Name='java.exe'" | Select ProcessId, CommandLine
Stop-Process -Id <numéro du processus qui contient cloud-firestore-emulator>
```
