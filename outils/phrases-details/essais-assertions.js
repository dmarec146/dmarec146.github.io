#!/usr/bin/env node
'use strict';
// Essais des assertions (assertions.js) : chacune doit accepter un cas valide ET refuser un cas volontairement faux.
// Sans cela, une assertion trop permissive passerait inaperçue. À relancer après tout ajout ou toute modification :
//   node outils/phrases-details/essais-assertions.js
global.math = { evaluate: (s) => Function('"use strict"; return (' + s + ')')() };
const assertions = require('./assertions.js');
const env = (texte) => ({ texte: () => texte });
const ESSAIS = {
  'on-divise-par-un-nombre-negatif': [
    [true, '\\text{On divise par } -3 \\lt  0 \\text{ : les inégalités changent de sens}', {}, env('')],
    [false, '\\text{On divise par } 3 \\lt  0 \\text{ : les inégalités changent de sens}', {}, env('')]
  ],
  'la-suite-est-arithmetique': [
    [true, '… \\quad \\text{(car } u_1+u_3 = 2u_2\\text{)}', {}, env('On considère l\'unique suite arithmétique')],
    [false, '… \\quad \\text{(car } u_1+u_3 = 2u_2\\text{)}', {}, env('On considère l\'unique suite géométrique')]
  ],
  'la-raison-est-non-nulle': [
    [true, 'r \\neq 0 \\text{ donc } 8\\,r + 6 = 0', {}, env('de raison non nulle telle que')],
    [false, 'r \\neq 0 \\text{ donc } 8\\,r + 6 = 0', {}, env('de raison quelconque')]
  ],
  'nombre-de-termes-d-une-somme-de-u0-a-uN': [
    [true, '\\text{Il y a } 19+1 = 20 \\text{ termes, donc } S', { enonce: 'u_0+u_1+\\cdots+u_{19}' }, env('')],
    [false, '\\text{Il y a } 19+1 = 21 \\text{ termes, donc } S', { enonce: 'u_0+u_1+\\cdots+u_{19}' }, env('')],
    [false, '\\text{Il y a } 19+1 = 20 \\text{ termes, donc } S', { enonce: 'u_0+u_1+\\cdots+u_{18}' }, env('')]
  ],
  'la-valeur-citee-annule-le-denominateur': [
    [true, 'x-1 = 0 \\iff x = 1 \\text{ (valeur interdite)}', { enonce: '\\dfrac{x^2-25}{x-1}\\geqslant 0' }, env('')],
    [false, 'x-1 = 0 \\iff x = 2 \\text{ (valeur interdite)}', { enonce: '\\dfrac{x^2-25}{x-1}\\geqslant 0' }, env('')],
    [true, '\\text{On cherche les valeurs de } x \\text{ pour lesquelles le quotient est }\\geqslant \\ 0 \\text{ ; la valeur interdite }1 \\text{ est exclue dans tous les cas}', { enonce: '\\dfrac{x^2-25}{x-1}\\geqslant 0' }, env('')],
    [false, '\\text{On cherche les valeurs de } x \\text{ pour lesquelles le quotient est }\\geqslant \\ 0 \\text{ ; la valeur interdite }3 \\text{ est exclue dans tous les cas}', { enonce: '\\dfrac{x^2-25}{x-1}\\geqslant 0' }, env('')]
  ],
  'le-sens-annonce-est-celui-de-l-enonce': [
    [true, '\\text{On cherche les valeurs de } x \\text{ pour lesquelles le quotient est }\\geqslant \\ 0 \\text{ ; la valeur interdite }1 \\text{ est exclue dans tous les cas}', { enonce: '\\dfrac{x^2-25}{x-1}\\geqslant 0' }, env('')],
    [false, '\\text{On cherche les valeurs de } x \\text{ pour lesquelles le quotient est }\\leqslant \\ 0 \\text{ ; la valeur interdite }1 \\text{ est exclue dans tous les cas}', { enonce: '\\dfrac{x^2-25}{x-1}\\geqslant 0' }, env('')],
    [true, '\\text{On cherche les valeurs de } x \\text{ pour lesquelles le quotient est }\\lt \\ 0 \\text{ ; la valeur interdite }1', { enonce: '\\dfrac{x^2-1}{x-1}\\lt 0' }, env('')],
    [false, '\\text{On cherche les valeurs de } x \\text{ pour lesquelles le quotient est }> \\ 0 \\text{ ; la valeur interdite }1', { enonce: '\\dfrac{x^2-1}{x-1}\\lt 0' }, env('')]
  ]
};
let echecs = 0, essais = 0;
for (const a of assertions) {
  const cas = ESSAIS[a.nom];
  if (!cas) { console.log(`MANQUE   ${a.nom} : aucun essai écrit`); echecs++; continue; }
  let vraisOk = 0, fauxOk = 0, vrais = 0, faux = 0;
  for (const [attendu, ligne, exercice, environnement] of cas) {
    essais++;
    if (!a.motif.test(ligne)) { console.log(`ECHEC    ${a.nom} : le motif ne reconnaît pas la ligne d'essai : ${ligne}`); echecs++; continue; }
    const r = a.verifie(ligne, exercice, environnement);
    if (attendu) { vrais++; if (r === true) vraisOk++; else { console.log(`ECHEC    ${a.nom} : cas valide refusé : ${ligne}`); echecs++; } }
    else { faux++; if (r === false) fauxOk++; else { console.log(`ECHEC    ${a.nom} : cas faux accepté : ${ligne}`); echecs++; } }
  }
  console.log(`OK       ${a.nom} : ${vraisOk}/${vrais} cas valides acceptés, ${fauxOk}/${faux} cas faux refusés`);
}
for (const nom of Object.keys(ESSAIS)) if (!assertions.some((a) => a.nom === nom)) { console.log(`ORPHELIN ${nom} : essais sans assertion`); echecs++; }
console.log(`\n${essais} essais, ${echecs} échec(s).`);
process.exit(echecs ? 1 : 0);
