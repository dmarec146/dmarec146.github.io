#!/usr/bin/env node
'use strict';

// Regenere, dans une fiche de calcul, l'appel Bareme.definir({...}) a partir du fichier de
// bareme de cette fiche (outils/bareme/fiche-NN.json : categorie, points, justification par
// question). A relancer apres toute modification des points. Voir README.md.
//
//   node appliquer-bareme.js 02      (ecrit dans la fiche)
//   node appliquer-bareme.js 02 --verif   (n'ecrit rien, signale un ecart)

const fs = require('fs');
const path = require('path');

const FICHES = {
  '02': 'cahiers/premiere/cahier-1/fiche-02.html',
  '09': 'cahiers/premiere/cahier-3/fiche-09.html',
};

const [, , num, option] = process.argv;
if (!FICHES[num]) { console.error('Usage : node appliquer-bareme.js <' + Object.keys(FICHES).join('|') + '> [--verif]'); process.exit(1); }

const racine = path.join(__dirname, '..', '..');
const donnees = JSON.parse(fs.readFileSync(path.join(__dirname, `fiche-${num}.json`), 'utf8'));
const points = {}; const bonus = [];
for (const [id, [categorie, pts]] of Object.entries(donnees)) {
  if (pts < 0.5 || pts > 2 || Math.round(pts * 4) !== pts * 4) throw new Error(`${id} : ${pts} points (de 0,5 a 2, par quart de point)`);
  points[id] = pts;
  if (categorie === 'E') bonus.push(id);
}
const appel = `Bareme.definir(${JSON.stringify({ points, bonus })});`;

const fichier = path.join(racine, FICHES[num]);
const brut = fs.readFileSync(fichier, 'utf8');
const crlf = brut.includes('\r\n');
const src = brut.replace(/\r\n/g, '\n');
const motif = /Bareme\.definir\(\{.*\}\);/;
if (!motif.test(src)) throw new Error('Bareme.definir introuvable dans la fiche');
const nouveau = src.replace(motif, () => appel);
const base = Object.entries(points).filter(([id]) => !bonus.includes(id)).reduce((t, [, p]) => t + p, 0);
const boni = bonus.reduce((t, id) => t + points[id], 0);
console.log(`fiche ${num} : ${Object.keys(points).length} questions, base ${base} points, bonus ${boni} points`);
if (nouveau === src) { console.log('deja a jour.'); process.exit(0); }
if (option === '--verif') { console.log('ECART : la fiche n\'est pas a jour.'); process.exit(2); }
fs.writeFileSync(fichier, crlf ? nouveau.replace(/\n/g, '\r\n') : nouveau, 'utf8');
console.log('fiche mise a jour.');
