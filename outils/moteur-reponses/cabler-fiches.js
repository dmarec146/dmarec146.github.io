#!/usr/bin/env node
'use strict';

// Branche le moteur de validation par forme (assets/js/moteur-reponses.js) dans les fiches de calcul, d'apres
// la table outils/moteur-reponses/formes-par-fiche.json (fiche -> { numero de calcul ou id de question : forme }).
// Idempotent : relancer ne fait que remettre la table de la fiche a jour. Par fiche, le script
//   1. ajoute la balise <script> du moteur apres celle de qcm-clic.js ;
//   2. insere (avant verifierUne) le bloc formesCalcul() / parametresForme() / exAvecForme() ;
//   3. ajoute, en tete de la chaine de verification de verifierUne(), la branche qui appelle le moteur (avec repli
//      sur la verification par valeur si le moteur ne sait pas lire la reponse attendue) ;
//   4. ajoute les deux crochets d'aide (necessiteAide, aideContextuellePour).
//
//   node outils/moteur-reponses/cabler-fiches.js                  toutes les fiches de la table
//   node outils/moteur-reponses/cabler-fiches.js seconde/cahier-1/fiche-04   une fiche de la table
//   node outils/moteur-reponses/cabler-fiches.js --verif          liste l'etat (n'ecrit rien)
//
// Valeurs de la table : "simplifie", "factorise", "developpe", "puissance", "monome", "canonique", ou un objet
// {"forme": "puissance", "formeOptions": {"fraction": true}}. Cle : "4.2" (tout le calcul) ou "4.8 c)" (une question).
// Fiches deja cablees a la main (Premiere 1, Seconde 2 : propriete ex.forme) : ne pas les mettre dans la table.

const fs = require('fs');
const path = require('path');

const racine = path.join(__dirname, '..', '..', 'cahiers');
const table = JSON.parse(fs.readFileSync(path.join(__dirname, 'formes-par-fiche.json'), 'utf8'));
delete table.commentaire;

const args = process.argv.slice(2);
const verif = args.includes('--verif');
const cibles = args.filter((a) => !a.startsWith('--'));
const fiches = cibles.length ? cibles : Object.keys(table);

const BALISE_QCM = '<script src="../../../assets/js/qcm-clic.js"></script>';
const BALISE = '<script src="../../../assets/js/moteur-reponses.js"></script>';
const DEBUT = '// ---- Formes imposees par le titre du calcul (moteur-reponses.js) : table geree par outils/moteur-reponses/cabler-fiches.js';
const FIN = '// ---- fin des formes imposees';

function bloc(formes) {
  const lignes = Object.entries(formes).map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n');
  return String.raw`${DEBUT}
// Cle : numero de calcul (« 4.2 ») ou id de question (« 4.8 c) »). Fonctions declarees (hissees) : utilisables partout.
function formesCalcul() {
  return {
${lignes}
  };
}
// forme deduite du premier mot de l'enonce (valeur "auto" de la table) : Developper/Reduire, Factoriser, Simplifier/Calculer
function formeDepuisEnonce(ex) {
  const t = String(ex.enonce || '').replace(/^\s*(\\\(|\\text\{)?\s*/, '');
  if (/^(Développer|Réduire)/.test(t)) return 'developpe';
  if (/^Factoriser/.test(t)) return 'factorise';
  if (/^(Simplifier|Calculer)/.test(t)) return 'simplifie';
  return null;
}
function parametresForme(ex) {
  if (ex.forme) return { forme: ex.forme, formeOptions: ex.formeOptions || {} };
  const t = formesCalcul();
  let v = t[ex.id] || t[String(ex.id || '').split(' ')[0]];
  if (!v) return null;
  // gardes : un controle propre a la question (fraction irreductible, tolerance, lecture graphique), un arrondi,
  // un ensemble de solutions ou un type autre qu'une valeur / expression restent geres par la fiche
  if (ex.fractionIrreductible || ex.margeLecture || ex.tolerance != null || (ex.type !== 'num' && ex.type !== 'alg')) return null;
  if (typeof ex.reponse !== 'string' || ex.reponse.trim().startsWith('{')) return null;
  if (/arrondi|valeur approchée|au (dixième|centième|millième)/i.test(String(ex.enonce || ''))) return null;
  if (v === 'auto') v = formeDepuisEnonce(ex);
  if (!v) return null;
  return typeof v === 'string' ? { forme: v, formeOptions: {} } : { forme: v.forme, formeOptions: v.formeOptions || {} };
}
function exAvecForme(ex) { return { ...ex, ...parametresForme(ex) }; }
${FIN}
`;
}

let ecrites = 0, ok = 0, absentes = 0;
for (const f of fiches) {
  const chemin = path.join(racine, f + '.html');
  if (!table[f]) { console.log(`${f} : absente de la table`); absentes++; continue; }
  let s = fs.readFileSync(chemin, 'utf8');
  const crlf = s.includes('\r\n');
  const nl = (t) => (crlf ? t.split('\n').join('\r\n') : t);
  const avant = s;
  const problemes = [];

  if (!s.includes('moteur-reponses.js')) {
    if (!s.includes(BALISE_QCM)) problemes.push('balise qcm-clic.js introuvable');
    else s = s.replace(BALISE_QCM, () => BALISE_QCM + nl('\n') + BALISE);
  }

  const b = nl(bloc(table[f]));
  const i = s.indexOf(DEBUT), j = s.indexOf(FIN);
  if (i >= 0 && j > i) {
    const finLigne = s.indexOf('\n', j) + 1;
    s = s.slice(0, i) + b + s.slice(finLigne);
  } else if (s.includes('function verifierUne(')) {
    s = s.replace('function verifierUne(', () => b + nl('\n') + 'function verifierUne(');
  } else problemes.push('function verifierUne introuvable');

  const aiguillage = nl('  let ok;\n  if (parametresForme(ex)) ok = MoteurReponses.verifier(exAvecForme(ex), input, val, () => checkEqualNumeric(val, ex.reponse));\n  else if (');
  if (!s.includes('parametresForme(ex)) ok =')) {
    const motif = nl('  let ok;\n  if (');
    const n = s.split(motif).length - 1;
    if (n !== 1) problemes.push(`aiguillage : ${n} occurrence(s) de « let ok; if ( » (1 attendue)`);
    else s = s.replace(motif, () => aiguillage);
  }

  if (!s.includes('if (parametresForme(ex)) return true;')) {
    const m1 = nl('function necessiteAide(ex) {\n');
    if (!s.includes(m1)) problemes.push('necessiteAide introuvable');
    else s = s.replace(m1, () => m1 + nl('  if (parametresForme(ex)) return true;\n'));
  }
  if (!s.includes('if (parametresForme(ex)) return MoteurReponses.aide(')) {
    const m2 = nl('function aideContextuellePour(ex) {\n');
    if (!s.includes(m2)) problemes.push('aideContextuellePour introuvable');
    else s = s.replace(m2, () => m2 + nl('  if (parametresForme(ex)) return MoteurReponses.aide(exAvecForme(ex));\n'));
  }

  if (problemes.length) { console.log(`${f} : NON CABLEE -- ${problemes.join(' ; ')}`); continue; }
  if (s === avant) { console.log(`${f} : deja a jour`); ok++; continue; }
  if (verif) { console.log(`${f} : a mettre a jour`); continue; }
  fs.writeFileSync(chemin, s);
  console.log(`${f} : cablee (${Object.keys(table[f]).length} entree(s))`);
  ecrites++;
}
console.log(`${ecrites} fiche(s) ecrite(s), ${ok} deja a jour${absentes ? ', ' + absentes + ' absente(s) de la table' : ''}`);
