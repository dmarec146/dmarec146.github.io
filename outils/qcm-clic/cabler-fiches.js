#!/usr/bin/env node
'use strict';

// Branche assets/js/qcm-clic.js (choix cliquables des QCM et oui/non) dans les fiches de calcul : une balise
// <script> apres celle de claviers.js. Idempotent. Usage :
//
//   node outils/qcm-clic/cabler-fiches.js premiere/cahier-8/fiche-20 [autre/fiche ...]   (fiches nommees)
//   node outils/qcm-clic/cabler-fiches.js --toutes                                      (toutes, sauf EXCLUES)
//   node outils/qcm-clic/cabler-fiches.js --verif                                       (liste ce qui manque, n'ecrit rien)
//
// EXCLUES : fiches ayant un devoir en cours (07/10/2026) -- elles ne changent pas tant que le devoir n'est
// pas termine : Premiere 1 et 2 (jusqu'au 10/10/2026 au soir), Seconde 5. Les retirer de la liste apres les
// echeances, puis relancer --toutes.

const fs = require('fs');
const path = require('path');

const EXCLUES = ['premiere/cahier-1/fiche-01', 'premiere/cahier-1/fiche-02', 'seconde/cahier-1/fiche-05'];
const racine = path.join(__dirname, '..', '..', 'cahiers');
const BALISE = '<script src="../../../assets/js/qcm-clic.js"></script>';

function toutesLesFiches() {
  const liste = [];
  for (const niveau of ['premiere', 'seconde']) {
    for (const cahier of fs.readdirSync(path.join(racine, niveau)).filter((d) => d.startsWith('cahier-'))) {
      for (const f of fs.readdirSync(path.join(racine, niveau, cahier)).filter((n) => /^fiche-\d+\.html$/.test(n))) {
        liste.push(`${niveau}/${cahier}/${f.replace('.html', '')}`);
      }
    }
  }
  return liste;
}

const args = process.argv.slice(2);
const verif = args.includes('--verif');
let cibles = args.filter((a) => !a.startsWith('--'));
if (args.includes('--toutes') || verif) cibles = toutesLesFiches();
if (!cibles.length) { console.error('Usage : voir l\'en-tete du script.'); process.exit(1); }

let modifiees = 0, deja = 0, exclues = 0, manquantes = 0;
for (const nom of cibles) {
  if (EXCLUES.includes(nom)) { exclues++; continue; }
  const fichier = path.join(racine, nom + '.html');
  if (!fs.existsSync(fichier)) { console.error('fiche introuvable : ' + nom); process.exit(1); }
  const brut = fs.readFileSync(fichier, 'utf8');
  const crlf = brut.includes('\r\n');
  const src = brut.replace(/\r\n/g, '\n');
  if (src.includes('assets/js/qcm-clic.js')) { deja++; continue; }
  if (verif) { manquantes++; console.log('a cabler : ' + nom); continue; }
  const ancre = '<script src="../../../assets/js/claviers.js"></script>';
  if (src.split(ancre).length !== 2) { console.error('ancre claviers.js absente ou multiple : ' + nom); process.exit(1); }
  const nouveau = src.replace(ancre, () => ancre + '\n' + BALISE);
  fs.writeFileSync(fichier, crlf ? nouveau.replace(/\n/g, '\r\n') : nouveau);
  modifiees++;
  console.log('cablee : ' + nom);
}
console.log(`${modifiees} cablee(s), ${deja} deja cablee(s), ${exclues} exclue(s) (devoir en cours)${verif ? ', ' + manquantes + ' a cabler' : ''}.`);
