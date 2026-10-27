#!/usr/bin/env node
'use strict';

// Sert le site du dossier de travail sur http://localhost:5173, SANS emulateurs : la page parle au VRAI projet Firebase
// (vrais comptes, vraies donnees, vraie fonction d'invitation). Sert a essayer une modification avant de la publier :
// rien n'est publie, seul ton navigateur voit cette version.
//
//   node outils/test-local/site-seul.js
//   puis ouvrir  http://localhost:5173/connexion/?emulateur=0   et se connecter avec son vrai compte.
//
// Attention : ce que tu fais dans cette page est REEL (une invitation envoie un vrai courriel, un devoir attribue
// l'est vraiment). Pour un essai sur de fausses donnees, utiliser outils/test-local/lancer.js a la place.
// Le « ?emulateur=0 » coupe un eventuel mode test memorise par ce navigateur sur localhost. Ctrl+C arrete le serveur.

const fs = require('fs');
const path = require('path');
const http = require('http');

const RACINE = path.resolve(__dirname, '..', '..');
const PORT = 5173;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

http.createServer((requete, reponse) => {
  const chemin = decodeURIComponent(new URL(requete.url, 'http://x').pathname);
  let fichier = path.resolve(RACINE, '.' + chemin);
  if (!fichier.startsWith(RACINE + path.sep) && fichier !== RACINE) { reponse.writeHead(403); return reponse.end(); }
  // Rien d'autre que le site : jamais outils/, functions/, .git, .claude ni les cles.
  const relatif = path.relative(RACINE, fichier).split(path.sep)[0];
  if (['outils', 'functions', '.git', '.claude', 'publication', 'node_modules'].includes(relatif)) { reponse.writeHead(404); return reponse.end('Introuvable'); }
  if (fs.existsSync(fichier) && fs.statSync(fichier).isDirectory()) fichier = path.join(fichier, 'index.html');
  if (!fs.existsSync(fichier)) { reponse.writeHead(404); return reponse.end('Introuvable'); }
  reponse.writeHead(200, { 'Content-Type': TYPES[path.extname(fichier)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(fichier).pipe(reponse);
}).listen(PORT, '127.0.0.1', () => {
  console.log('Site local branche sur le VRAI Firebase (aucune donnee de test).');
  console.log(`Ouvrir : http://localhost:${PORT}/connexion/?emulateur=0`);
  console.log('Ctrl+C pour arreter.');
});
