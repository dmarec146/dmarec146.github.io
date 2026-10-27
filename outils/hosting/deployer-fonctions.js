#!/usr/bin/env node
'use strict';

// Deploie les fonctions serveur du dossier functions/ (invitation d'un enseignant, 27/10/2026) sur le projet Firebase.
//
//   node outils/hosting/deployer-fonctions.js
//
// Independant de la publication du site (outils/hosting/publier-hosting.js, qui regenere firebase.json avec Hosting
// seul) : ce script ecrit sa propre configuration temporaire, deploie UNIQUEMENT les fonctions, puis la supprime.
// A relancer a chaque modification du dossier functions/ (et seulement alors : un git push du site ne les touche pas).
// Prerequis : `npx firebase-tools login` fait (meme compte que pour Hosting), et `npm install` fait dans functions/.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const RACINE = path.resolve(__dirname, '..', '..');
const PROJET = 'cahiers-interactifs';
const VERSION_FIREBASE_TOOLS = '15.34.1';
const CONFIG = path.join(RACINE, 'firebase.functions.json');

if (!fs.existsSync(path.join(RACINE, 'functions', 'node_modules'))) {
  console.error('Dependances absentes : lancer `npm install` dans le dossier functions/ puis recommencer.');
  process.exit(1);
}

fs.writeFileSync(CONFIG, JSON.stringify({
  functions: [{
    source: 'functions',
    codebase: 'default',
    runtime: 'nodejs22',
    ignore: ['node_modules', '.git', 'test-invitation.js', '*.log'],
  }],
}, null, 2) + '\n');

try {
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const resultat = spawnSync(npx, ['--yes', `firebase-tools@${VERSION_FIREBASE_TOOLS}`, 'deploy', '--only', 'functions',
    '--config', 'firebase.functions.json', '--project', PROJET, '--force'], { cwd: RACINE, stdio: 'inherit', shell: process.platform === 'win32' });
  if (resultat.status !== 0) {
    console.error('\nLe deploiement a echoue. Si Firebase demande de se connecter : npx firebase-tools@' + VERSION_FIREBASE_TOOLS + ' login');
    process.exit(resultat.status || 1);
  }
  console.log('\nFonctions deployees.');
} finally {
  try { fs.unlinkSync(CONFIG); } catch (e) { /* deja supprime */ }
}
