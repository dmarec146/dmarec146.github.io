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
  'la-valeur-rejetee-est-negative': [
    [true, '\\text{Or } n \\in \\mathbb{N} \\text{, donc } -3 \\text{ est rejeté}', {}, env('')],
    [false, '\\text{Or } n \\in \\mathbb{N} \\text{, donc } 3 \\text{ est rejeté}', {}, env('')]
  ],
  'l-indice-cite-est-pair': [
    [true, '\\text{Comme } 4 \\text{ est pair, } q^{4} = 81 \\text{ dans les deux cas}', {}, env('')],
    [false, '\\text{Comme } 3 \\text{ est pair, } q^{3} = 27 \\text{ dans les deux cas}', {}, env('')]
  ],
  'le-coefficient-annonce-est-negatif': [
    [true, '\\text{avec } a = -\\dfrac{12}{5} \\lt  0 \\text{ et } b = -\\dfrac{3}{5}', {}, env('')],
    [false, '\\text{avec } a = \\dfrac{12}{5} \\lt  0 \\text{ et } b = -\\dfrac{3}{5}', {}, env('')]
  ],
  'la-comparaison-ecrite-est-vraie': [
    [true, '35 > 24', {}, env('')],
    [false, '24 > 35', {}, env('')],
    [true, '\\dfrac{5}{6} > \\dfrac{3}{4}', {}, env('')],
    [false, '\\dfrac{3}{4} > \\dfrac{5}{6}', {}, env('')],
    [true, '\\dfrac{7}{3} \\lt  4', {}, env('')],
    [false, '\\dfrac{7}{3} \\lt  2', {}, env('')]
  ],
  'le-facteur-annonce-n-est-ni-2-ni-5': [
    [true, '\\text{Le dénominateur a le facteur premier } 3 \\text{, autre que 2 et 5}', { enonce: 'Le nombre \\(\\dfrac{7}{12}\\) est-il un nombre décimal ?' }, env('')],
    [false, '\\text{Le dénominateur a le facteur premier } 3 \\text{, autre que 2 et 5}', { enonce: 'Le nombre \\(\\dfrac{7}{20}\\) est-il un nombre décimal ?' }, env('')],
    [false, '\\text{Le dénominateur a le facteur premier } 5 \\text{, autre que 2 et 5}', { enonce: 'Le nombre \\(\\dfrac{7}{20}\\) est-il un nombre décimal ?' }, env('')]
  ],
  'le-denominateur-annonce-est-premier': [
    [true, '\\text{Le dénominateur } 7 \\text{ est un nombre premier}', { enonce: 'Le nombre \\(\\dfrac{3}{7}\\) est-il un nombre décimal ?' }, env('')],
    [false, '\\text{Le dénominateur } 9 \\text{ est un nombre premier}', { enonce: 'Le nombre \\(\\dfrac{4}{9}\\) est-il un nombre décimal ?' }, env('')],
    [false, '\\text{Le dénominateur } 5 \\text{ est un nombre premier}', { enonce: 'Le nombre \\(\\dfrac{3}{7}\\) est-il un nombre décimal ?' }, env('')]
  ],
  'seuls-2-et-5-apparaissent': [
    [true, '\\text{Le dénominateur } 5 \\text{ n\'a pas d\'autre facteur premier que 2 ou 5}', { enonce: 'Le nombre \\(\\dfrac{3}{15}\\) est-il un nombre décimal ?' }, env('')],
    [false, '\\text{Le dénominateur } 15 \\text{ n\'a pas d\'autre facteur premier que 2 ou 5}', { enonce: 'Le nombre \\(\\dfrac{3}{15}\\) est-il un nombre décimal ?' }, env('')],
    [false, '\\text{Le dénominateur } 12 \\text{ n\'a pas d\'autre facteur premier que 2 ou 5}', { enonce: 'Le nombre \\(\\dfrac{7}{12}\\) est-il un nombre décimal ?' }, env('')]
  ],
  'la-periode-decimale-est-exacte': [
    [true, '\\dfrac{1}{7} = 0{,}\\overline{142857}', {}, env('')],
    [false, '\\dfrac{1}{7} = 0{,}\\overline{142858}', {}, env('')]
  ],
  'decalage-periodique-exact': [
    [true, '100x = 18{,}\\overline{18}', { enonce: 'Écrire \\(0{,}\\overline{18}\\) sous forme de fraction irréductible.' }, env('')],
    [false, '10x = 18{,}\\overline{18}', { enonce: 'Écrire \\(0{,}\\overline{18}\\) sous forme de fraction irréductible.' }, env('')],
    [false, '100x = 81{,}\\overline{18}', { enonce: 'Écrire \\(0{,}\\overline{18}\\) sous forme de fraction irréductible.' }, env('')],
    [false, '100x = 18{,}\\overline{81}', { enonce: 'Écrire \\(0{,}\\overline{18}\\) sous forme de fraction irréductible.' }, env('')]
  ],
  'soustraction-periodique-exacte': [
    [true, '100x - x = 18{,}\\overline{18} - 0{,}\\overline{18} = 18', { enonce: 'Écrire \\(0{,}\\overline{18}\\) sous forme de fraction irréductible.' }, env('')],
    [false, '100x - x = 18{,}\\overline{18} - 0{,}\\overline{18} = 17', { enonce: 'Écrire \\(0{,}\\overline{18}\\) sous forme de fraction irréductible.' }, env('')],
    [false, '10x - x = 18{,}\\overline{18} - 0{,}\\overline{18} = 18', { enonce: 'Écrire \\(0{,}\\overline{18}\\) sous forme de fraction irréductible.' }, env('')]
  ],
  'la-reponse-oui-non-est-celle-de-l-exercice': [
    [true, '\\text{Réponse : oui}', { reponseOuiNon: true }, env('')],
    [false, '\\text{Réponse : non}', { reponseOuiNon: true }, env('')],
    [true, '\\text{Réponse : non}', { reponse: 'non' }, env('')],
    [false, '\\text{Réponse : oui}', { reponse: 'non' }, env('')]
  ],
  'aucun-reel-ne-convient-si-l-ensemble-est-vide': [
    [true, '\\text{Aucun réel ne convient}', { intervalleSpec: { type: 'vide' } }, env('')],
    [false, '\\text{Aucun réel ne convient}', { intervalleSpec: { type: 'tout' } }, env('')],
    [false, '\\text{Aucun réel ne convient}', { intervalleSpec: { type: 'intervalles', liste: [{ bas: 1, haut: 2, inclusBas: true, inclusHaut: true }] } }, env('')],
    [false, '\\text{Aucun réel ne convient}', {}, env('')]
  ],
  'la-longueur-de-periode-annoncee-est-exacte': [
    [true, '\\text{Période de } 6 \\text{ chiffres}', { enonce: 'Le développement décimal de \\(\\dfrac{1}{7}\\) est périodique.' }, env('')],
    [false, '\\text{Période de } 3 \\text{ chiffres}', { enonce: 'Le développement décimal de \\(\\dfrac{1}{7}\\) est périodique.' }, env('')],
    [true, '\\text{Période de } 1 \\text{ chiffre}', { enonce: 'Le développement décimal de \\(\\dfrac{1}{3}\\) est périodique.' }, env('')],
    [false, '\\text{Période de } 1 \\text{ chiffres}', { enonce: 'Le développement décimal de \\(\\dfrac{1}{3}\\) est périodique.' }, env('')]
  ],
  'les-unites-se-repetent-tous-les-4-exposants': [
    [true, '\\text{les chiffres des unités se répètent de 4 en 4}', { enonce: 'Déterminer le chiffre des unités de \\(4^{268}\\)' }, env('')],
    [true, '\\text{les chiffres des unités se répètent de 4 en 4}', { enonce: 'Déterminer le chiffre des unités de \\(7^{1\\,234}\\)' }, env('')]
  ],
  'la-puissance-finit-comme-sa-reduite': [
    [true, '\\text{Donc } 4^{268} \\text{ finit comme } 4^{4}', {}, env('')],
    [false, '\\text{Donc } 4^{267} \\text{ finit comme } 4^{4}', {}, env('')],
    [true, '\\text{Donc } 9^{389} \\text{ finit comme } 9', {}, env('')],
    [false, '\\text{Donc } 9^{388} \\text{ finit comme } 9', {}, env('')]
  ],
  'le-signe-de-x-est-celui-de-l-enonce': [
    [true, '\\text{Comme } x \\lt  0 \\text{, } |x| = -x', { enonce: '\\(\\sqrt{x^2}\\), sachant que \\(x<0\\)' }, env('')],
    [false, '\\text{Comme } x > 0 \\text{, } |x| = x', { enonce: '\\(\\sqrt{x^2}\\), sachant que \\(x<0\\)' }, env('')],
    [false, '\\text{Comme } x \\lt  0 \\text{, } |x| = x', { enonce: '\\(\\sqrt{x^2}\\), sachant que \\(x<0\\)' }, env('')],
    [true, '\\text{Comme } x > 0 \\text{, } |x| = x', { enonce: '\\(\\sqrt{x^2}\\), sachant que \\(x>0\\)' }, env('')]
  ],
  'a-puissance-5-finit-comme-a': [
    [true, '\\text{Comme } 4^{5} \\text{ finit comme } 4 \\text{,}', {}, env('')],
    [true, '\\text{Comme } 7^{5} \\text{ finit comme } 7 \\text{,}', {}, env('')],
    [false, '\\text{Comme } 7^{5} \\text{ finit comme } 3 \\text{,}', {}, env('')]
  ],
  'm-n-est-pas-un-carre-parfait': [
    [true, '\\text{Comme } 7 \\text{ n\'est pas un carré parfait, } \\sqrt{7} \\text{ est irrationnel}', {}, env('')],
    [false, '\\text{Comme } 9 \\text{ n\'est pas un carré parfait, } \\sqrt{9} \\text{ est irrationnel}', {}, env('')]
  ],
  'le-coefficient-est-non-nul-et-la-racine-irrationnelle': [
    [true, '\\text{et } 28 \\neq 0 \\text{, donc } 28\\sqrt{7} \\text{ est irrationnel}', {}, env('')],
    [true, '\\text{et } -1 \\neq 0 \\text{, donc } -\\sqrt{7} \\text{ est irrationnel}', {}, env('')],
    [false, '\\text{et } 0 \\neq 0 \\text{, donc } 0\\sqrt{7} \\text{ est irrationnel}', {}, env('')],
    [false, '\\text{et } 3 \\neq 0 \\text{, donc } 3\\sqrt{9} \\text{ est irrationnel}', {}, env('')]
  ],
  'on-multiplie-par-un-nombre-negatif': [
    [true, '\\text{On multiplie par } -3 \\lt  0', {}, env('')],
    [false, '\\text{On multiplie par } 3 \\lt  0', {}, env('')]
  ],
  'la-borne-inferieure-depasse-la-borne-superieure': [
    [true, '\\text{Comme } 5 \\geqslant 3 \\text{, aucun nombre ne convient}', {}, env('')],
    [true, '\\text{Comme } -2 \\geqslant -2 \\text{, aucun nombre ne convient}', {}, env('')],
    [false, '\\text{Comme } 2 \\geqslant 3 \\text{, aucun nombre ne convient}', {}, env('')],
    [true, '\\text{Comme } -9 > -13 \\text{, aucun nombre ne convient}', {}, env('')],
    [false, '\\text{Comme } 5 > 5 \\text{, aucun nombre ne convient}', {}, env('')]
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
    [true, '-4x+1 = 0 \\iff x = \\dfrac{1}{4} \\text{ (valeur interdite)}', { enonce: 'E(x)=\\dfrac{2*x-3}{-4*x+1}' }, env('')],
    [true, '2x+3 = 0 \\iff x = -\\dfrac{3}{2} \\text{ (valeur interdite)}', { enonce: 'E(x)=\\dfrac{x-5}{2*x+3}' }, env('')],
    [false, '2x+3 = 0 \\iff x = \\dfrac{3}{2} \\text{ (valeur interdite)}', { enonce: 'E(x)=\\dfrac{x-5}{2*x+3}' }, env('')],
    [true, '\\text{On cherche les valeurs de } x \\text{ pour lesquelles le quotient est }\\geqslant \\ 0 \\text{ ; la valeur interdite }1 \\text{ est exclue dans tous les cas}', { enonce: '\\dfrac{x^2-25}{x-1}\\geqslant 0' }, env('')],
    [false, '\\text{On cherche les valeurs de } x \\text{ pour lesquelles le quotient est }\\geqslant \\ 0 \\text{ ; la valeur interdite }3 \\text{ est exclue dans tous les cas}', { enonce: '\\dfrac{x^2-25}{x-1}\\geqslant 0' }, env('')]
  ],
  'le-sens-annonce-est-celui-de-l-enonce': [
    [true, '\\text{On cherche les valeurs de } x \\text{ pour lesquelles le quotient est }\\geqslant \\ 0 \\text{ ; la valeur interdite }1 \\text{ est exclue dans tous les cas}', { enonce: '\\dfrac{x^2-25}{x-1}\\geqslant 0' }, env('')],
    [false, '\\text{On cherche les valeurs de } x \\text{ pour lesquelles le quotient est }\\leqslant \\ 0 \\text{ ; la valeur interdite }1 \\text{ est exclue dans tous les cas}', { enonce: '\\dfrac{x^2-25}{x-1}\\geqslant 0' }, env('')],
    [true, '\\text{On cherche les valeurs de } x \\text{ pour lesquelles le quotient est }\\lt \\ 0 \\text{ ; la valeur interdite }1', { enonce: '\\dfrac{x^2-1}{x-1}\\lt 0' }, env('')],
    [false, '\\text{On cherche les valeurs de } x \\text{ pour lesquelles le quotient est }> \\ 0 \\text{ ; la valeur interdite }1', { enonce: '\\dfrac{x^2-1}{x-1}\\lt 0' }, env('')],
    [true, '\\text{pour lesquelles l\'expression est } >\\ 0', { enonce: '\\((2x-6)(x+1)\\gt 0\\)' }, env('')],
    [false, '\\text{pour lesquelles l\'expression est } >\\ 0', { enonce: '\\((2x-6)(x+1)\\lt 0\\)' }, env('')]
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
