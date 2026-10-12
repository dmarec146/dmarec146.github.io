// Tests du moteur de validation par forme (assets/js/moteur-reponses.js), sans navigateur :
//   node outils/verification/test-moteur-reponses.js
// Chaque ligne : [forme, options, reponse attendue, saisie, doit etre acceptee]. La saisie est lue comme du
// texte (ascii) ou, si elle commence par « L: », comme du LaTeX de champ mathematique.
const M = require('../../assets/js/moteur-reponses.js');

const CAS = [
  // ---- puissance (Seconde 2.2 a 2.4) ----
  ['puissance', {}, '7^4', '7^4', true],
  ['puissance', {}, '7^4', '2401', false],              // le cas signale par David
  ['puissance', {}, '7^4', 'L:7^{4}', true],
  ['puissance', {}, '7^4', '(7)^4', true],
  ['puissance', {}, '7^4', '49^2', false],
  ['puissance', {}, '7^4', '7^2*7^2', false],
  ['puissance', {}, '7^4', '7^(2+2)', false],
  ['puissance', {}, '7^4', '7^3*7', false],
  ['puissance', {}, '7^4', '7^5', false],
  ['puissance', {}, '7^4', '7^4*1', true],
  ['puissance', {}, '4^7', '4^7', true],
  ['puissance', {}, '4^7', '2^14', false],
  ['puissance', {}, '1/5^4', '1/5^4', true],
  ['puissance', {}, '1/5^4', 'L:\\frac{1}{5^4}', true],
  ['puissance', {}, '1/5^4', '5^-4', false],            // exposant negatif : une fraction est demandee
  ['puissance', {}, '1/5^4', '1/625', false],
  ['puissance', {}, '10^6', '10^6', true],
  ['puissance', {}, '10^6', '1/10^-6', false],
  ['puissance', {}, '10^6', '1000000', false],
  ['puissance', {}, '7^3*2', '7^3*2', true],
  ['puissance', {}, '7^3*2', '2*7^3', true],
  ['puissance', {}, '7^3*2', 'L:7^{3}\\times2', true],
  ['puissance', {}, '7^3*2', '686', false],
  ['puissance', {}, '7^3*2', '14*7^2', false],
  ['puissance', {}, '7^3*2', '7^3*2^1', true],
  ['puissance', {}, '5^9/7^7', '5^9/7^7', true],
  ['puissance', {}, '5^9/7^7', 'L:\\frac{5^9}{7^{7}}', true],
  ['puissance', {}, '5^9/7^7', '5^9*7^-7', false],
  ['puissance', {}, '5^9/7^7', '(5^3/7^2)^3*5^0', false],
  ['puissance', {}, '2*5', '2*5', true],
  ['puissance', {}, '2*5', '10', false],
  ['puissance', {}, '(-3)^4', '(-3)^4', true],
  ['puissance', {}, '(-3)^4', '81', false],
  // ---- monome (Seconde 2.4 c, d ; 2.5 b) ----
  ['monome', {}, 'x^2*y^3', 'x^2*y^3', true],
  ['monome', {}, 'x^2*y^3', 'y^3*x^2', true],
  ['monome', {}, 'x^2*y^3', '(x^2*y^3)^3/(x^4*y^6)', false],
  ['monome', {}, 'x^2*y^3', 'x*x*y^3', false],
  ['monome', {}, '18*x^2', '18*x^2', true],
  ['monome', {}, '18*x^2', 'L:18x^{2}', true],
  ['monome', {}, '18*x^2', '2*9*x^2', false],
  ['monome', {}, '18*x^2', '(3x)^2*2', false],
  ['monome', {}, '18*x^2', '18x^2', true],
  ['monome', {}, '3*2^n', '3*2^n', true],
  ['monome', {}, '3*2^n', '2^n*3', true],
  ['monome', {}, '3*2^n', '2^n+2^(n+1)', false],
  ['monome', {}, '3*2^n', '6*2^(n-1)', false],
  ['monome', {}, '3*2^n', 'L:3\\times2^{n}', true],
  ['monome', {}, '3/2*x^2', '3/2*x^2', true],
  ['monome', {}, '3/2*x^2', 'L:\\frac{3}{2}x^{2}', true],
  ['monome', {}, '3/2*x^2', 'L:\\frac{3x^{2}}{2}', true],
  ['monome', {}, '3/2*x^2', '6/4*x^2', false],
  ['monome', {}, '3/2*x^2', '1.5*x^2', true],
  // ---- developpe (Premiere 1.1, 1.4) ----
  ['developpe', {}, '25*x^2+30*x+9', '25*x^2+30*x+9', true],
  ['developpe', {}, '25*x^2+30*x+9', '(5x+3)^2', false],
  ['developpe', {}, '25*x^2+30*x+9', '25x^2+15x+15x+9', false],
  ['developpe', {}, '25*x^2+30*x+9', '30x+25x^2+9', true],
  ['developpe', {}, '25*x^2+30*x+9', 'L:25x^{2}+30x+9', true],
  ['developpe', {}, '25*x^2+30*x+9', '25x^2+30x+4+5', false],
  ['developpe', {}, 'x^2-4*x-3', 'L:x^{2}-4x-3', true],
  ['developpe', {}, 'x^2-4*x-3', 'x^2-4*x+-3', true],
  ['developpe', {}, 'x^2-4*x-3', '(x-2)^2-7', false],
  ['developpe', {}, '49/9*z^2+70/3*z+25', 'L:\\frac{49}{9}z^{2}+\\frac{70}{3}z+25', true],
  ['developpe', { variables: ['z'] }, '49/9*z^2+70/3*z+25', 'L:\\frac{49}{9}z^{2}+\\frac{70}{3}z+25', true],
  ['developpe', { variables: ['z'] }, '49/9*z^2+70/3*z+25', 'L:\\frac{49z^{2}}{9}+\\frac{70z}{3}+25', true],
  ['developpe', { variables: ['z'] }, '49/9*z^2+70/3*z+25', '(7/3*z+5)^2', false],
  ['developpe', {}, '25/4*x^2+50/12*x+-119/36', '25/4*x^2+25/6*x-119/36', true],
  ['developpe', {}, '25/4*x^2+50/12*x+-119/36', '25/4*x^2+50/12*x-119/36', false],   // fraction reductible
  ['developpe', {}, '9*sqrt(5)*x^2-12*sqrt(5)*x', 'L:9\\sqrt{5}x^{2}-12\\sqrt{5}x', true],
  ['developpe', {}, '9*sqrt(5)*x^2-12*sqrt(5)*x', 'sqrt(5)*(3x-2)^2-4*sqrt(5)', false],
  ['developpe', {}, '-3*x^2-30*x-68', '-3x^2-30x-68', true],
  ['developpe', {}, '-3*x^2-30*x-68', '-3(x+5)^2+7', false],
  ['developpe', {}, '-3*x^2-30*x-68', '-3x^2-30x-68+0', false],
  // ---- canonique (Premiere 1.5, 1.6) ----
  ['canonique', {}, '2*(x-4)^2+6', '2*(x-4)^2+6', true],
  ['canonique', {}, '2*(x-4)^2+6', 'L:2(x-4)^{2}+6', true],
  ['canonique', {}, '2*(x-4)^2+6', '2x^2-16x+38', false],          // la forme developpee n'est pas la canonique
  ['canonique', {}, '2*(x-4)^2+6', '2*(x-4)*(x-4)+6', false],
  ['canonique', {}, '2*(x-4)^2+6', '2(x-4)^2+2+4', false],
  ['canonique', {}, '2*(x-4)^2+6', '(x-4)^2*2+6', true],
  ['canonique', {}, '(x+3)^2+6', '(x+3)^2+6', true],
  ['canonique', {}, '(x+3)^2+6', 'x^2+6x+15', false],
  ['canonique', {}, '-2*(x-1)^2-6', '-2(x-1)^2-6', true],
  ['canonique', {}, '-2*(x-1)^2-6', '-2*(x-1)^2+(-6)', true],
  ['canonique', {}, '-2*(x-1)^2-6', '-2x^2+4x-8', false],
  ['canonique', {}, '1/4*(x+2)^2-9', 'L:\\frac{1}{4}(x+2)^{2}-9', true],      // math.js lisait 1/(4(x+2)^2)
  ['canonique', {}, '1/4*(x+2)^2-9', 'L:\\frac14\\left(x+2\\right)^2-9', true],
  ['canonique', {}, '1/4*(x+2)^2-9', 'L:\\frac{(x+2)^{2}}{4}-9', true],
  ['canonique', {}, '1/4*(x+2)^2-9', '0.25(x+2)^2-9', true],
  ['canonique', {}, '1/4*(x+2)^2-9', 'L:\\frac{1}{4}x^{2}+x-8', false],
  ['canonique', {}, '1/4*(x+2)^2-9', '2/8*(x+2)^2-9', false],
  ['canonique', {}, '1/4*(x+2)^2-9', '1/4*(x+2)^2-18/2', false],
  ['canonique', {}, '1/4*(x+2)^2-9', '1/4*(x+2)^2-9/1', false],   // 9/1 n'est pas une forme finale
  ['canonique', {}, '-4*(x-1/4*lam)^2+1/4*lam^2-2', 'L:-4\\left(x-\\frac{\\lambda}{4}\\right)^{2}+\\frac{\\lambda^{2}}{4}-2', true],
  ['canonique', {}, '-4*(x-1/4*lam)^2+1/4*lam^2-2', 'L:-4x^{2}+2\\lambda x-2', false],
  ['canonique', {}, 'lam*(x+1/lam)^2-1/lam+1', 'L:\\lambda\\left(x+\\frac{1}{\\lambda}\\right)^{2}-\\frac{1}{\\lambda}+1', true],
  ['canonique', {}, 'lam*(x+1/lam)^2-1/lam+1', 'L:\\lambda x^{2}+2x+1', false],
];

let echecs = 0;
for (const [forme, formeOptions, reponse, saisie, attendu] of CAS) {
  const ex = { forme, formeOptions, reponse };
  const entree = saisie.startsWith('L:') ? { latex: saisie.slice(2), ascii: '' } : { latex: '', ascii: saisie };
  let obtenu;
  try { obtenu = M.verifierForme(ex, entree); } catch (e) { obtenu = 'ERREUR ' + e.message; }
  if (obtenu !== attendu) { echecs++; console.log(`ECHEC [${forme}] attendu « ${reponse} », saisie « ${saisie} » : obtenu ${obtenu}, voulu ${attendu}`); }
}
console.log(`${CAS.length} cas, ${echecs} echec(s)`);
process.exitCode = echecs ? 1 : 0;

// controle de fond : un refus ne doit pas venir d'une saisie illisible (sauf cas voulu)
let illisibles = 0;
for (const [forme, formeOptions, reponse, saisie, attendu] of CAS) {
  const entree = saisie.startsWith('L:') ? { latex: saisie.slice(2), ascii: '' } : { latex: '', ascii: saisie };
  if (!M.lireEntree(entree)) { illisibles++; console.log(`ILLISIBLE : ${saisie}`); }
}
console.log(`${illisibles} saisie(s) illisible(s)`);
if (illisibles) process.exitCode = 1;
