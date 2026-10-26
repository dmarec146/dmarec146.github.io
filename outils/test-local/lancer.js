#!/usr/bin/env node
'use strict';

// Environnement de test LOCAL (26/10/2026) : fausse base et faux comptes sur le PC,
// site servi sur http://localhost:5173, AUCUNE donnee reelle touchee.
//
//   node outils/test-local/lancer.js
//
// Demarre les emulateurs Firebase (Authentication 9099, Firestore 8080) avec les
// regles de firestore.rules, y met quelques comptes fictifs (voir DONNEES
// ci-dessous), puis sert le site. Ouvrir ensuite
//   http://localhost:5173/connexion/?emulateur=1
// (le « ?emulateur=1 » branche la page sur les emulateurs ; un bandeau rouge
// « MODE TEST » reste affiche en bas de chaque page tant que c'est actif).
// Ctrl+C arrete tout. Les donnees fictives sont perdues a chaque arret.
//
// Prerequis (deja installes pour les autres outils) :
//   outils/verification/regles-firestore/node_modules  (firebase-tools)
//   outils/creer-comptes/node_modules                  (firebase-admin)
// Java est necessaire a l'emulateur Firestore.

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { createRequire } = require('module');

const RACINE = path.resolve(__dirname, '..', '..');
const PORT_SITE = 5173;
const MDP = 'test1234';
const FICHIER_CONFIG = path.join(RACINE, 'firebase.test-local.json');

// ---- Emulateurs -----------------------------------------------------------
fs.writeFileSync(FICHIER_CONFIG, JSON.stringify({
  firestore: { rules: 'firestore.rules' },
  emulators: {
    auth: { host: '127.0.0.1', port: 9099 },
    firestore: { host: '127.0.0.1', port: 8080 },
    ui: { enabled: false },
  },
}, null, 2));

const bin = path.join(RACINE, 'outils', 'verification', 'regles-firestore', 'node_modules', '.bin',
  process.platform === 'win32' ? 'firebase.cmd' : 'firebase');
const emulateurs = spawn(bin, ['emulators:start', '--only', 'auth,firestore', '--project', 'demo-cahiers',
  '--config', FICHIER_CONFIG], { cwd: RACINE, shell: process.platform === 'win32' });

let pret = false;
function nettoyer() {
  try { fs.unlinkSync(FICHIER_CONFIG); } catch (e) { /* deja supprime */ }
  try { fs.unlinkSync(path.join(RACINE, 'firestore-debug.log')); } catch (e) { /* absent */ }
}
function arreter() {
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(emulateurs.pid), '/t', '/f']);
  else emulateurs.kill('SIGINT');
  nettoyer();
  setTimeout(() => process.exit(0), 800);
}
process.on('SIGINT', arreter);
process.on('SIGTERM', arreter);
emulateurs.on('exit', () => { nettoyer(); if (!pret) { console.error('Les emulateurs se sont arretes avant d\'etre prets (port 8080 ou 9099 deja pris ?).'); process.exit(1); } });

const surSortie = (flux) => flux.on('data', (morceau) => {
  const texte = morceau.toString();
  if (!pret && /All emulators ready/i.test(texte)) { pret = true; demarrerTout().catch((e) => { console.error(e); arreter(); }); }
  if (/error|erreur/i.test(texte) && !/Java version/i.test(texte)) process.stderr.write(texte);
});
surSortie(emulateurs.stdout);
surSortie(emulateurs.stderr);

// ---- Donnees fictives ------------------------------------------------------
const DONNEES = {
  administrateur: { email: 'david@exemple.test', claims: { admin: true, enseignant: true } },
  collegue: { email: 'collegue@exemple.test', claims: { enseignant: true } },
  // Meme nom de classe chez les deux enseignants : chacun ne doit voir que les siens.
  eleves: [
    { pseudo: 'd.demo1', classe: '2nde-207', chez: 'administrateur', nom: 'DEMO', prenom: 'Un' },
    { pseudo: 'd.demo2', classe: '2nde-207', chez: 'administrateur', nom: 'DEMO', prenom: 'Deux' },
    { pseudo: 'c.eleve1', classe: '2nde-207', chez: 'collegue', nom: 'ELEVE', prenom: 'Un' },
    { pseudo: 'c.eleve2', classe: '2nde-207', chez: 'collegue', nom: 'ELEVE', prenom: 'Deux' },
  ],
  devoirs: [
    { chez: 'administrateur', titre: 'Devoir de David (fiche 1 Seconde)', classe: '2nde-207' },
    { chez: 'collegue', titre: 'Devoir du collegue (fiche 1 Seconde)', classe: '2nde-207' },
  ],
};

async function injecter() {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  const req = createRequire(path.join(RACINE, 'outils', 'creer-comptes', 'package.json'));
  const { initializeApp } = req('firebase-admin/app');
  const { getAuth } = req('firebase-admin/auth');
  const { getFirestore, FieldValue, Timestamp } = req('firebase-admin/firestore');
  initializeApp({ projectId: 'demo-cahiers' });
  const auth = getAuth();
  const db = getFirestore();
  const uid = {};

  for (const cle of ['administrateur', 'collegue']) {
    const { email, claims } = DONNEES[cle];
    const u = await auth.createUser({ email, password: MDP });
    await auth.setCustomUserClaims(u.uid, claims);
    uid[cle] = u.uid;
  }
  for (const e of DONNEES.eleves) {
    const u = await auth.createUser({ email: `${e.pseudo}@cahiers-interactifs.local`, password: MDP });
    await db.collection('eleves').doc(u.uid).set({
      pseudo: e.pseudo, classe: e.classe, nom: e.nom, prenom: e.prenom,
      enseignant: uid[e.chez], creeLe: FieldValue.serverTimestamp(),
    });
  }
  const dans30Jours = Timestamp.fromMillis(Date.now() + 30 * 24 * 3600 * 1000);
  for (const d of DONNEES.devoirs) {
    await db.collection('devoirs').add({
      type: 'fiche', ficheId: '/cahiers/seconde/cahier-1/fiche-01.html', titre: d.titre, classe: d.classe,
      echeance: dans30Jours, nbEssaisMax: 3, creeLe: FieldValue.serverTimestamp(),
      creePar: DONNEES[d.chez].email, enseignant: uid[d.chez],
    });
  }
}

// ---- Serveur du site -----------------------------------------------------------
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};
function servirSite() {
  http.createServer((requete, reponse) => {
    let chemin = decodeURIComponent(new URL(requete.url, 'http://x').pathname);
    let fichier = path.resolve(RACINE, '.' + chemin);
    if (!fichier.startsWith(RACINE + path.sep) && fichier !== RACINE) { reponse.writeHead(403); return reponse.end(); }
    if (fs.existsSync(fichier) && fs.statSync(fichier).isDirectory()) fichier = path.join(fichier, 'index.html');
    if (!fs.existsSync(fichier)) { reponse.writeHead(404); return reponse.end('Introuvable'); }
    reponse.writeHead(200, { 'Content-Type': TYPES[path.extname(fichier)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(fichier).pipe(reponse);
  }).listen(PORT_SITE, '127.0.0.1');
}

async function demarrerTout() {
  await injecter();
  servirSite();
  console.log('\n=== ENVIRONNEMENT DE TEST PRET (donnees fictives) ===');
  console.log(`Site            : http://localhost:${PORT_SITE}/connexion/?emulateur=1`);
  console.log(`Mot de passe de tous les comptes de test : ${MDP}`);
  console.log(`Administrateur  : ${DONNEES.administrateur.email}  (admin + enseignant, 2 eleves : d.demo1, d.demo2)`);
  console.log(`Collegue        : ${DONNEES.collegue.email}  (enseignant, 2 eleves : c.eleve1, c.eleve2)`);
  console.log('Ctrl+C pour tout arreter.\n');
}
