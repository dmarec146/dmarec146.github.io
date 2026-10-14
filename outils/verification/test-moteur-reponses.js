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
  // ---- simplifie (Premiere 2.1, 3.2 ; Seconde 3.3 a 3.6, 4.2, 4.7, 7.4, 8.4, 9.1…) : l'enonce recopie est refuse ----
  ['simplifie', {}, '13/2', '13/2', true],
  ['simplifie', {}, '13/2', 'L:\\frac{13}{2}', true],
  ['simplifie', {}, '13/2', '6.5', true],
  ['simplifie', {}, '13/2', '(15-2)/2', false],
  ['simplifie', {}, '13/2', 'L:\\frac{15-\\sqrt{4}}{2}', false],
  ['simplifie', {}, '13/2', '26/4', false],
  ['simplifie', {}, '13/2', '13/2/1', false],
  ['simplifie', {}, '5/6', 'L:\\frac{12-\\sqrt{49}}{6}', false],
  ['simplifie', {}, '4*sqrt(14)', '4*sqrt(14)', true],
  ['simplifie', {}, '4*sqrt(14)', 'L:4\\sqrt{14}', true],
  ['simplifie', {}, '4*sqrt(14)', 'L:\\sqrt{224}', false],
  ['simplifie', {}, '4*sqrt(14)', 'L:2\\sqrt{56}', false],
  ['simplifie', {}, '16*sqrt(67)', 'L:16\\sqrt{67}', true],
  ['simplifie', {}, '16*sqrt(67)', 'L:7\\sqrt{67}+9\\sqrt{67}', false],
  ['simplifie', {}, 'sqrt(62)/62', 'L:\\frac{\\sqrt{62}}{62}', true],
  ['simplifie', {}, 'sqrt(62)/62', 'L:\\frac{1}{\\sqrt{62}}', false],
  ['simplifie', {}, '-4*x+7', '-4x+7', true],
  ['simplifie', {}, '-4*x+7', '7-4x', true],
  ['simplifie', {}, '-4*x+7', '2x+14-6x-7', false],
  ['simplifie', {}, '7*x+6', '7x+6', true],
  ['simplifie', {}, '7*x+6', 'L:\\frac{42x+36}{6}', false],
  ['simplifie', {}, '13/42*x', 'L:\\frac{13x}{42}', true],
  ['simplifie', {}, '13/42*x', 'L:\\frac{13}{42}x', true],
  ['simplifie', {}, '13/42*x', 'L:\\frac{x}{6}+\\frac{x}{7}', false],
  ['simplifie', {}, '4^7', '4^7', true],
  ['simplifie', {}, '4^7', 'L:4^{3}\\times4^{4}', false],
  ['simplifie', {}, 'e^-9', 'L:e^{-9}', true],
  ['simplifie', {}, 'e^-9', 'L:\\frac{e^{3}\\times\\left(e^{-3}\\right)^{3}}{e^{-2}\\times e^{5}}', false],
  ['simplifie', {}, 'e^-17', 'L:\\frac{e^{-5}\\times e^{-5}}{e^{3}\\times e^{4}}', false],
  ['simplifie', {}, '(4/3)^n*5/16', 'L:\\left(\\frac{4}{3}\\right)^{n}\\times\\frac{5}{16}', true],
  ['simplifie', {}, '(4/3)^n*5/16', 'L:\\frac{4^{n}\\times5}{3^{n}\\times4^{2}}', false],
  ['simplifie', {}, '(x-y)/(x*y)', 'L:\\frac{x-y}{xy}', true],
  ['simplifie', {}, '(x-y)/(x*y)', 'L:\\frac{x}{xy-y^{2}}+\\frac{2x-y}{xy-x^{2}}', false],
  ['simplifie', {}, '1/5', '0.2', true],
  ['simplifie', {}, '1/5', 'L:\\frac{4}{5}-9\\times\\frac{5}{7}', false],
  // ---- factorise (Seconde 4.6) ----
  ['factorise', {}, '9*(8*x+5)', '9(8x+5)', true],
  ['factorise', {}, '9*(8*x+5)', 'L:9\\left(8x+5\\right)', true],
  ['factorise', {}, '9*(8*x+5)', '72x+45', false],           // l'enonce recopie
  ['factorise', {}, '9*(8*x+5)', '3(24x+15)', false],        // facteur commun restant
  ['factorise', {}, '9*(8*x+5)', '1*(72x+45)', false],
  ['factorise', {}, '9*(8*x+5)', '9*1*(8x+5)', false],
  ['factorise', {}, '(x-4)*(x+4)', '(x-4)(x+4)', true],
  ['factorise', {}, '(x-4)*(x+4)', 'x^2-16', false],
  ['factorise', {}, '(x-4)*(x+4)', '1*(x^2-16)', false],
  ['factorise', {}, '(x-4)*(x+4)', '(x^2-16)', false],
  ['factorise', {}, 'x*(x+1)', 'x(x+1)', true],
  ['factorise', {}, '(x-1)^2', '(x-1)^2', true],
  ['factorise', {}, '(x-1)^2', 'x^2-2x+1', false],
  ['factorise', {}, '9*(x+6)*(x+1)', '9(x+6)(x+1)', true],
  ['factorise', {}, '9*(x+6)*(x+1)', '(x+6)(9x+9)', true],       // deux facteurs non constants : le scalaire peut rester dans une parenthese
  ['factorise', {}, '9*(x+6)*(x+1)', '(x+6)*9*(x+1)', true],
  ['factorise', {}, '9*(x+6)*(x+1)', '9(x^2+7x+6)', false],      // factorisation en x manquante
  ['factorise', {}, '9*(x+6)*(x+1)', '(x+6)(9x+9)*1', false],
  ['factorise', {}, '3*(x-2)*(x+2)*(x^2+4)', '(x-2)(x+2)(3x^2+12)', true],
  ['factorise', {}, '3*(x-2)*(x+2)*(x^2+4)', '3(x^2-4)(x^2+4)', false],
  ['factorise', {}, '9*(8*x+5)', '3(24x+15)', false],            // un seul facteur non constant : facteur numerique a extraire en entier
  // ---- regles ajoutees : bases numeriques de meme exposant, somme de quotients, constante e, decimal ----
  ['simplifie', {}, '(3/4)^n*5/6', 'L:\\frac{6^{n}\\times5}{8^{n}\\times6}', false],
  ['simplifie', {}, '2^n*3^n', '2^n*3^n', false],
  ['simplifie', {}, '10/3*3^n', 'L:3^{n+2}-3^{n+1}-3\\times3^{n}+3^{n-1}', false],
  ['simplifie', {}, '10/3*3^n', 'L:\\frac{10}{3}\\times3^{n}', true],
  ['simplifie', {}, '6^n', '6^n', true],
  ['simplifie', {}, '(5*x+45)/24', 'L:\\frac{x+3}{3}-\\frac{x-7}{8}', false],
  ['simplifie', {}, '(5*x+45)/24', 'L:\\frac{5x+45}{24}', true],
  ['simplifie', {}, '(5*x+45)/24', 'L:\\frac{5x}{24}+\\frac{15}{8}', true],
  ['simplifie', { euler: true }, 'exp(-2)', 'L:e^{-2}', true],
  ['simplifie', { euler: true }, 'exp(-2)', 'L:\\frac{e^{3}}{e^{5}}', false],
  ['simplifie', { euler: true }, 'e^(-2)', 'e^-2', true],
  // ---- puissance a exposant litteral (Premiere 4.1 : ecrire sous la forme 2^k) ----
  ['puissance', {}, '2^(4*n+1)', '2^(4*n+1)', true],
  ['puissance', {}, '2^(4*n+1)', 'L:2^{4n+1}', true],
  ['puissance', {}, '2^(4*n+1)', 'L:2^{1+4n}', true],
  ['puissance', {}, '2^(4*n+1)', 'L:2\\times16^{n}', false],
  ['puissance', {}, '2^(4*n+1)', 'L:2^{4n}\\times2', false],
  ['puissance', {}, '2^(4*n+1)', 'L:16^{n}+16^{n}', false],
  ['puissance', {}, '2^(4*n+1)', 'L:2^{4n+2}', false],
  ['puissance', {}, '2^(4*n+1)', 'L:4^{2n}\\times2', false],
  ['puissance', {}, '2^(2*n-1)', 'L:2^{2n-1}', true],
  ['puissance', {}, '2^(2*n-1)', 'L:\\frac{4^{n}}{2}', false],
  ['factorise', {}, '(2*x+1)^2/4', '(2x+1)^2/4', true],        // denominateur numerique permis
  ['factorise', {}, '(2*x+1)^2/4', 'L:\\frac{\\left(2x+1\\right)^{2}}{4}', true],
  ['factorise', {}, '(2*x+1)^2/4', 'L:\\left(x+\\frac{1}{2}\\right)^{2}', true],
  ['factorise', {}, '(2*x+1)^2/4', 'L:x^{2}+x+\\frac{1}{4}', false],
  ['factorise', {}, '3*(x-2)*(x+2)', '3(x-2)(x+2)', true],
  ['factorise', {}, '3*(x-2)*(x+2)', '3x^2-12', false],
  ['factorise', {}, '(x-3)^2', 'x^2-6x+9', false],
  ['simplifie', {}, '1', 'cos(0)', false],                      // valeur trigonometrique a calculer
  ['simplifie', {}, '1', 'L:\\cos\\left(0\\right)', false],
  ['simplifie', {}, '-1/2', 'L:\\cos\\left(-\\frac{10\\pi}{3}\\right)', false],
  ['simplifie', {}, '-1/2', 'L:-\\frac{1}{2}', true],
  ['simplifie', {}, '-1', 'tan(3*pi/4)', false],
  ['simplifie', {}, '70-24*sqrt(6)', 'L:\\left(4-3\\sqrt{6}\\right)^{2}', false],
  ['simplifie', {}, '70-24*sqrt(6)', 'L:70-24\\sqrt{6}', true],
  ['simplifie', {}, '-5', 'x=-5', true],
  ['simplifie', {}, '-5', 'L:x=-5', true],
  ['simplifie', {}, '-29', 'f(6)=-29', true],
  ['simplifie', {}, '-5', '-45/9', false],
  ['simplifie', {}, '42', '35*1.2', false],                    // « Calculer 35 augmente de 20 % » : le calcul doit etre fait
  ['simplifie', {}, '42', 'L:35\\times1{,}2', false],
  ['simplifie', {}, '42', '42', true],
  ['simplifie', {}, '1.3', '130/100', false],
  ['simplifie', {}, '1.3', '1,3', true],
  ['decimal', {}, '0.12', '0,12', true],
  ['decimal', {}, '0.12', 'L:0{,}12', true],
  ['decimal', {}, '0.12', 'L:\\frac{3}{25}', false],
  ['decimal', {}, '0.0072', 'L:7{,}2\\times10^{-3}', false],
  ['decimal', {}, '0.0072', '0.0072', true],
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

// ---- estTermine (ensembles de solutions « sous forme irreductible », racine carree libre) ----
{
  const T = [['2/3', null, true], ['4/6', null, false], ['-4/3', null, true], ['10/5', null, false], ['sqrt(24)', null, false],
    ['sqrt(24)', { racineLibre: true }, true], ['-3-sqrt(12)', { racineLibre: true }, true], ['2*sqrt(6)', { racineLibre: true }, true],
    ['sqrt(81)', { racineLibre: true }, false], ['3+4', { racineLibre: true }, false], ['(1+sqrt(5))/2', { racineLibre: true }, true]];
  let echecsT = 0;
  for (const [s, o, attendu] of T) { const obtenu = M.estTermine({ ascii: s }, o); if (obtenu !== attendu) { echecsT++; console.log(`ECHEC estTermine « ${s} » : obtenu ${obtenu}, voulu ${attendu}`); } }
  console.log(`${T.length} cas estTermine, ${echecsT} echec(s)`);
  if (echecsT) process.exitCode = 1;
}
