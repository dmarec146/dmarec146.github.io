#!/usr/bin/env node
'use strict';

// Controle de coherence des baremes (volet « fichiers »). A lancer avant tout commit qui touche une
// fiche a bareme, et avant chaque publication (voir README.md et CLAUDE.md).
//
//   node outils/bareme/controle-bareme.js
//
// 1. Repere les fiches qui contiennent Bareme.definir( (donc a bareme).
// 2. Verifie que chacune est declaree dans appliquer-bareme.js et que son bloc Bareme.definir est
//    identique a celui que donne outils/bareme/fiche-NN.json (meme test que « appliquer-bareme.js NN --verif »).
// 3. Ecrit outils/bareme/fiches-a-bareme.json, lu par la page de controle (volet « questions tirees »,
//    qui compare les questions reellement generees aux points : outils/bareme/controle.html).
//
// Code de sortie : 0 = rien a signaler ; 2 = ecart (affiche).

const fs = require('fs');
const path = require('path');

const racine = path.join(__dirname, '..', '..');

function fiches(dossier, sortie) {
  for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
    const p = path.join(dossier, e.name);
    if (e.isDirectory()) fiches(p, sortie);
    else if (/^fiche-\d+\.html$/.test(e.name)) sortie.push(p);
  }
  return sortie;
}

const aBareme = [];
for (const f of fiches(path.join(racine, 'cahiers'), [])) {
  const src = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
  if (/Bareme\.definir\(/.test(src)) aBareme.push({ fichier: path.relative(racine, f).split(path.sep).join('/'), src });
}

// table FICHES d'appliquer-bareme.js (numero -> chemin)
const appliquer = fs.readFileSync(path.join(__dirname, 'appliquer-bareme.js'), 'utf8');
const declarees = {};
for (const m of appliquer.matchAll(/'(\d+)':\s*'([^']+)'/g)) declarees[m[2]] = m[1];

const ecarts = [];
const liste = [];
for (const { fichier, src } of aBareme) {
  liste.push('/' + fichier);
  const num = declarees[fichier];
  if (!num) { ecarts.push(`${fichier} : a un bareme mais n'est pas declaree dans appliquer-bareme.js (table FICHES)`); continue; }
  const json = path.join(__dirname, `fiche-${num}.json`);
  if (!fs.existsSync(json)) { ecarts.push(`${fichier} : fichier ${path.basename(json)} introuvable`); continue; }
  const donnees = JSON.parse(fs.readFileSync(json, 'utf8'));
  const points = {}; const bonus = [];
  for (const [id, [categorie, pts]] of Object.entries(donnees)) { points[id] = pts; if (categorie === 'E') bonus.push(id); }
  const attendu = `Bareme.definir(${JSON.stringify({ points, bonus })});`;
  const present = (src.match(/Bareme\.definir\(\{.*\}\);/) || [''])[0];
  if (present !== attendu) ecarts.push(`${fichier} : le bloc Bareme.definir n'est pas celui de fiche-${num}.json (lancer : node outils/bareme/appliquer-bareme.js ${num})`);
}

fs.writeFileSync(path.join(__dirname, 'fiches-a-bareme.json'), JSON.stringify(liste, null, 1) + '\n', 'utf8');

console.log(`${liste.length} fiche(s) a bareme : ${liste.join(', ') || '(aucune)'}`);
if (ecarts.length) {
  console.log('ECARTS :\n- ' + ecarts.join('\n- '));
  process.exit(2);
}
console.log('Fichiers coherents. Reste le volet « questions tirees » : ouvrir http://localhost:8791/outils/bareme/controle.html puis Controle.lancer().');
