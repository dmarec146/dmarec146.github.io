#!/usr/bin/env node
'use strict';

// Supprime un enseignant (compte de test, depart d'un collegue, fin d'annee) ET tout ce qui lui est rattache :
// ses eleves (comptes Authentication + profils + toutes leurs sous-collections : tentatives, brouillons, connexions...)
// et ses devoirs. Ne touche a rien d'autre. Irreversible : sauvegarder avant pour un vrai compte.
//
//   node supprimer-enseignant.js <email>          SIMULATION : liste ce qui serait supprime, ne change rien
//   node supprimer-enseignant.js <email> --oui    supprime
//
// Garde-fous : refuse un compte qui porte le droit "admin" (le votre), un compte sans le droit "enseignant", et un
// compte qui n'existe pas. Les fichiers locaux (Documents\comptes-enseignants\<email>) sont a supprimer a la main.

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
  if (!fs.existsSync(CHEMIN_CLE_SERVICE)) { console.error(`Cle de service introuvable : ${CHEMIN_CLE_SERVICE}`); process.exit(1); }
  initializeApp({ credential: cert(require(CHEMIN_CLE_SERVICE)) });
}

async function main() {
  const [, , email, option] = process.argv;
  if (!email || email.startsWith('--')) { console.error('Usage : node supprimer-enseignant.js <email> [--oui]'); process.exit(1); }
  initialiser();
  const appliquer = option === '--oui';
  const auth = getAuth();
  const db = getFirestore();

  let enseignant;
  try { enseignant = await auth.getUserByEmail(email.trim().toLowerCase()); }
  catch (e) { if (e.code === 'auth/user-not-found') { console.error(`Aucun compte pour ${email}.`); process.exit(1); } throw e; }
  const claims = enseignant.customClaims || {};
  if (claims.admin === true) { console.error(`REFUSE : ${email} porte le droit "admin" (c'est un compte d'administrateur).`); process.exit(1); }
  if (claims.enseignant !== true) { console.error(`REFUSE : ${email} n'a pas le droit "enseignant" (ce n'est pas un compte enseignant).`); process.exit(1); }

  const eleves = await db.collection('eleves').where('enseignant', '==', enseignant.uid).get();
  const devoirs = await db.collection('devoirs').where('enseignant', '==', enseignant.uid).get();
  console.log(`Enseignant : ${email} (uid ${enseignant.uid})${appliquer ? '' : ' -- SIMULATION, rien n\'est supprime'}`);
  console.log(`Eleves rattaches : ${eleves.size}${eleves.size ? ' -> ' + eleves.docs.map((d) => d.data().pseudo).join(', ') : ''}`);
  console.log(`Devoirs : ${devoirs.size}${devoirs.size ? ' -> ' + devoirs.docs.map((d) => d.data().titre).join(' | ') : ''}`);
  let nbSous = 0;
  for (const d of eleves.docs) for (const c of await d.ref.listCollections()) nbSous += (await c.listDocuments()).length;
  console.log(`Documents dans les sous-collections des eleves : ${nbSous}`);
  const dossierEnseignant = db.collection('eleves').doc(enseignant.uid);
  const sousEns = (await dossierEnseignant.listCollections()).length;
  if (sousEns) console.log('Dossier eleves/ au nom de l\'enseignant lui-meme : present, sera supprime aussi.');

  if (!appliquer) { console.log('\nSimulation terminee. Relancer avec --oui pour supprimer.'); return; }

  for (const d of eleves.docs) await db.recursiveDelete(d.ref);
  for (const d of devoirs.docs) await d.ref.delete();
  if (sousEns || (await dossierEnseignant.get()).exists) await db.recursiveDelete(dossierEnseignant);
  const uidsEleves = eleves.docs.map((d) => d.id);
  if (uidsEleves.length) await auth.deleteUsers(uidsEleves);
  await auth.deleteUser(enseignant.uid);
  console.log(`\nSupprime : ${eleves.size} eleve(s) (comptes et donnees), ${devoirs.size} devoir(s), et le compte de ${email}.`);
}

main().catch((erreur) => { console.error(erreur); process.exit(1); });
