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
  '01': 'cahiers/premiere/cahier-1/fiche-01.html',
  '02': 'cahiers/premiere/cahier-1/fiche-02.html',
  '03': 'cahiers/premiere/cahier-1/fiche-03.html',
  '04': 'cahiers/premiere/cahier-2/fiche-04.html',
  '05': 'cahiers/premiere/cahier-2/fiche-05.html',
  '06': 'cahiers/premiere/cahier-2/fiche-06.html',
  '07': 'cahiers/premiere/cahier-3/fiche-07.html',
  '08': 'cahiers/premiere/cahier-3/fiche-08.html',
  '09': 'cahiers/premiere/cahier-3/fiche-09.html',
  '10': 'cahiers/premiere/cahier-3/fiche-10.html',
  '11': 'cahiers/premiere/cahier-4/fiche-11.html',
  '12': 'cahiers/premiere/cahier-4/fiche-12.html',
  '13': 'cahiers/premiere/cahier-4/fiche-13.html',
  '14': 'cahiers/premiere/cahier-5/fiche-14.html',
  '15': 'cahiers/premiere/cahier-6/fiche-15.html',
  '16': 'cahiers/premiere/cahier-6/fiche-16.html',
  '17': 'cahiers/premiere/cahier-6/fiche-17.html',
  '18': 'cahiers/premiere/cahier-7/fiche-18.html',
  '19': 'cahiers/premiere/cahier-7/fiche-19.html',
  '20': 'cahiers/premiere/cahier-8/fiche-20.html',
  '21': 'cahiers/premiere/cahier-8/fiche-21.html',
  '22': 'cahiers/premiere/cahier-9/fiche-22.html',
  'S05': 'cahiers/seconde/cahier-1/fiche-05.html',
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
