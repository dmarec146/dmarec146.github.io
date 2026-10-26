#!/usr/bin/env node
'use strict';

// Migration unique (26/10/2026, passage a plusieurs enseignants) : rattache tous
// les eleves et tous les devoirs EXISTANTS qui n'ont pas encore de champ
// `enseignant` a un enseignant donne (en pratique : le compte de David).
//
// Usage :
//   node migrer-enseignant.js <email-enseignant>          simulation, ne change rien
//   node migrer-enseignant.js <email-enseignant> --oui     applique
//
// A lancer APRES une sauvegarde et AVANT de publier le nouveau code et les
// nouvelles regles (le champ ajoute est sans effet sur l'ancien code : on peut
// donc migrer d'abord, sans rien casser). Ne touche que les documents sans
// champ `enseignant` : relancer le script ne change rien de plus. Les comptes
// qui sont des enseignants (aucun profil eleves/ reel) ne sont jamais touches :
// seuls les vrais documents de la collection eleves sont lus (pas les
// documents « fantomes » qui n'ont que des sous-collections).

const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

const CHEMIN_CLE_SERVICE = path.join(__dirname, 'service-account.json');

function initialiser() {
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST && process.env.FIRESTORE_EMULATOR_HOST) {
    console.log('MODE TEST : emulateurs Firebase locaux, aucune donnee reelle.');
    initializeApp({ projectId: 'demo-cahiers' });
    return;
  }
  if (!fs.existsSync(CHEMIN_CLE_SERVICE)) {
    console.error(`Cle de service introuvable : ${CHEMIN_CLE_SERVICE} (voir README.md)`);
    process.exit(1);
  }
  initializeApp({ credential: cert(require(CHEMIN_CLE_SERVICE)) });
}

async function rattacher(collection, uid, appliquer) {
  const db = getFirestore();
  const instantane = await db.collection(collection).get(); // documents reels uniquement
  const sans = instantane.docs.filter((d) => !d.data().enseignant);
  const deja = instantane.size - sans.length;
  console.log(`${collection} : ${instantane.size} document(s), ${deja} deja rattache(s), ${sans.length} a rattacher.`);
  if (appliquer) {
    for (let i = 0; i < sans.length; i += 400) {
      const lot = db.batch();
      sans.slice(i, i + 400).forEach((d) => lot.update(d.ref, { enseignant: uid }));
      await lot.commit();
    }
  }
  return sans.length;
}

async function main() {
  const [, , email, option] = process.argv;
  if (!email || email.startsWith('--')) {
    console.error('Usage : node migrer-enseignant.js <email-enseignant> [--oui]');
    process.exit(1);
  }
  initialiser();
  const appliquer = option === '--oui';

  const utilisateur = await getAuth().getUserByEmail(email.trim().toLowerCase());
  const claims = utilisateur.customClaims || {};
  if (claims.enseignant !== true) {
    console.error(`Le compte ${email} n'a pas le droit "enseignant". Le lui accorder d'abord : node creer-comptes.js --admin <email> <mot-de-passe>`);
    process.exit(1);
  }
  console.log(`Enseignant : ${email} (uid ${utilisateur.uid})${appliquer ? '' : ' -- SIMULATION, rien n\'est modifie'}\n`);

  const nbEleves = await rattacher('eleves', utilisateur.uid, appliquer);
  const nbDevoirs = await rattacher('devoirs', utilisateur.uid, appliquer);

  console.log(appliquer
    ? `\nTermine : ${nbEleves} eleve(s) et ${nbDevoirs} devoir(s) rattaches a ${email}.`
    : '\nSimulation terminee. Relancer avec --oui pour appliquer.');
}

main().catch((erreur) => { console.error(erreur); process.exit(1); });
