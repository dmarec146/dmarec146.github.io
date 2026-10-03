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

Résultat attendu : « 29 réussis, 0 échecs ».
