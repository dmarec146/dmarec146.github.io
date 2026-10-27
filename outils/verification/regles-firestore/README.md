# Test des règles Firestore (émulateur)

`test-regles.mjs` vérifie les règles de `firestore.rules` contre l'émulateur
Firestore, sans toucher au vrai projet : surtout la collection
`statistiques` (fréquentation anonyme : seul un ajout de +1 aux compteurs
connus est permis, lecture réservée à l'enseignant), plus quelques règles
existantes en non-régression.

À relancer après toute modification de `firestore.rules`, **avant** de les
publier dans la Console Firebase.

Prérequis : Node, Java, et dans ce dossier (le `node_modules/` n'est pas
suivi par Git) :

    npm install firebase-tools@14 @firebase/rules-unit-testing firebase@12.19.0
    npx firebase setup:emulators:firestore

Lancer (projet fictif, aucune connexion au vrai Firebase) :

    npx firebase emulators:exec --project demo-cahiers --only firestore "node test-regles.mjs"

Il faut un `firebase.json` à côté indiquant les règles et le port 8080 :

    { "firestore": { "rules": "../../../firestore.rules" },
      "emulators": { "firestore": { "port": 8080, "host": "127.0.0.1" }, "ui": { "enabled": false } } }

Résultat attendu : « 131 réussis, 0 échecs » (29 cas initiaux + 16 pour
`devoirsMasques`, 04/10/2026, + 8 pour `s_qcm_bac`, 18/10/2026, + 59 pour les
**plusieurs enseignants**, 26/10/2026 : chaque enseignant ne lit que les profils,
journaux et brouillons de ses élèves, ne crée/modifie/supprime que ses devoirs,
ne s'attribue pas l'élève ou le devoir d'un autre ; le droit admin ne donne accès qu'à la fréquentation, plus aux élèves ni aux devoirs, resserrement du 27/10/2026).

Sous Windows, l'émulateur Java peut rester actif après le test et occuper le
port 8080 : voir `outils/test-local/README.md` (section « port taken »).

Si la CLI répond « `../../../firestore.rules` is outside of project
directory » (firebase-tools 14 récent) : créer à la racine du dépôt un
`firebase.test-temp.json` contenant `{ "firestore": { "rules": "firestore.rules" }, "emulators": { "firestore": { "port": 8080, "host": "127.0.0.1" }, "ui": { "enabled": false } } }`
et lancer depuis la racine :

    outils/verification/regles-firestore/node_modules/.bin/firebase emulators:exec --config firebase.test-temp.json --project demo-cahiers --only firestore "node outils/verification/regles-firestore/test-regles.mjs"

puis supprimer ce fichier temporaire et `firestore-debug.log`.
