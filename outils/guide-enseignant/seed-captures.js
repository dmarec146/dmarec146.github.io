#!/usr/bin/env node
'use strict';

// Donnees FICTIVES pour les captures du guide de l'enseignant (27/10/2026). A lancer quand l'environnement de test local
// tourne (node outils/test-local/lancer.js : emulateurs Auth 9099 / Firestore 8080). N'ecrit QUE dans les emulateurs.
//
//   node outils/guide-enseignant/seed-captures.js
//
// Cree deux enseignants fictifs (mot de passe test1234) :
//   prof.martin@exemple.test   2 classes, 8 eleves, 3 devoirs (dont un rendu par une partie des eleves) : tableau de bord rempli
//   prof.nouveau@exemple.test  aucun eleve : affiche l'encadre « Obtenez les comptes de vos eleves »

const path = require('path');
const { createRequire } = require('module');

if (process.env.FIREBASE_AUTH_EMULATOR_HOST === undefined) process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
if (process.env.FIRESTORE_EMULATOR_HOST === undefined) process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
const req = createRequire(path.join(__dirname, '..', 'creer-comptes', 'package.json'));
const { initializeApp } = req('firebase-admin/app');
const { getAuth } = req('firebase-admin/auth');
const { getFirestore, FieldValue, Timestamp } = req('firebase-admin/firestore');

const MDP = 'test1234';
const JOUR = 24 * 3600 * 1000;

const ELEVES = [
  ['2nde-207', 'Bernard', 'Léa'], ['2nde-207', 'Dupont', 'Hugo'], ['2nde-207', 'Moreau', 'Inès'], ['2nde-207', 'Petit', 'Noah'],
  ['1ere-Gr 1', 'Garcia', 'Manon'], ['1ere-Gr 1', 'Roux', 'Théo'], ['1ere-Gr 1', 'Faure', 'Jade'], ['1ere-Gr 1', 'Lambert', 'Louis'],
];

(async () => {
  initializeApp({ projectId: 'demo-cahiers' });
  const auth = getAuth(); const db = getFirestore();

  const martin = await auth.createUser({ email: 'prof.martin@exemple.test', password: MDP });
  await auth.setCustomUserClaims(martin.uid, { enseignant: true });
  const nouveau = await auth.createUser({ email: 'prof.nouveau@exemple.test', password: MDP });
  await auth.setCustomUserClaims(nouveau.uid, { enseignant: true });

  const uids = {};
  for (const [classe, nom, prenom] of ELEVES) {
    const pseudo = `${prenom[0].toLowerCase()}.${nom.toLowerCase()}`.normalize('NFD').replace(/[̀-ͯ]/g, '');
    const u = await auth.createUser({ email: `${pseudo}@cahiers-interactifs.local`, password: MDP });
    await db.collection('eleves').doc(u.uid).set({ pseudo, classe, nom: nom.toUpperCase(), prenom, enseignant: martin.uid, creeLe: FieldValue.serverTimestamp() });
    (uids[classe] = uids[classe] || []).push(u.uid);
  }

  const dev = async (champs) => (await db.collection('devoirs').add({ creeLe: FieldValue.serverTimestamp(), creePar: 'prof.martin@exemple.test', enseignant: martin.uid, ...champs })).id;
  const calculDe14 = await dev({
    type: 'fiche', ficheId: '/cahiers/premiere/cahier-5/fiche-14.html', titre: 'Première · Cahier 5 · Fiche 14 — Calcul de sommes I',
    classe: '1ere-Gr 1', echeance: Timestamp.fromMillis(Date.now() + 6 * JOUR), nbEssaisMax: 3,
  });
  const sujetBlanc = await dev({
    type: 'automatismes', cible: 'sujet-blanc', niveau: 2, mode: 'chrono', duree: 120, titre: 'Sujet blanc d’automatismes — niveau 2',
    classe: '2nde-207', echeance: Timestamp.fromMillis(Date.now() + 12 * JOUR), nbEssaisMax: 2,
  });
  const termine = await dev({
    type: 'fiche', ficheId: '/cahiers/seconde/cahier-1/fiche-01.html', titre: 'Seconde · Cahier 1 · Fiche 1 — Calcul numérique',
    classe: '2nde-207', echeance: Timestamp.fromMillis(Date.now() - 3 * JOUR), nbEssaisMax: 3,
  });

  // Tentatives (horodatees avant l'echeance) : quelques eleves ont rendu, d'autres non.
  const tentative = async (uid, devoirId, score, total, repondues, il_y_a) => db.collection('eleves').doc(uid).collection('devoirsTentatives').add({
    devoirId, score, totalExercices: total, nbRepondues: repondues, horodatage: Timestamp.fromMillis(Date.now() - il_y_a * JOUR),
  });
  const gr1 = uids['1ere-Gr 1'];
  await tentative(gr1[0], calculDe14, 24, 31, 31, 1); await tentative(gr1[0], calculDe14, 27, 31, 31, 0.3);
  await tentative(gr1[1], calculDe14, 19, 31, 29, 2);
  await tentative(gr1[2], calculDe14, 29, 31, 31, 1);
  const n207 = uids['2nde-207'];
  await tentative(n207[0], termine, 21, 28, 28, 6); await tentative(n207[1], termine, 15, 28, 26, 5); await tentative(n207[3], termine, 25, 28, 28, 7);
  console.log('Donnees fictives creees : prof.martin@exemple.test (8 eleves, 3 devoirs) et prof.nouveau@exemple.test (aucun eleve), mot de passe', MDP);
  void sujetBlanc;
})().catch((e) => { console.error(e); process.exit(1); });
