// Tests de assets/js/formules-proba.js (formules de probabilités saisies au clavier).
// Lancer : node outils/verification/test-formules-proba.js
const FP = require('../../assets/js/formules-proba.js');
let ok = 0, ko = 0;
function t(nom, latex, ex, attendu) {
  let r; try { r = FP.verifier(latex, ex); } catch (e) { r = 'EXCEPTION ' + e.message; }
  if (r === attendu) ok++; else { ko++; console.log('ECHEC :', nom, '|', latex, '| obtenu', r, 'attendu', attendu); }
}
// 1. probabilités totales : P(S) = P_T(S) P(T) + P_{\overline T}(S) P(\overline T), avec P(T) = 1/2 connu
const TOT = { reponse: 'P_{T}(S)\\times P(T)+P_{\\overline{T}}(S)\\times P(\\overline{T})', fixes: { 'P(T)': 0.5 } };
t('tot identique', 'P_{T}(S)\\times P(T)+P_{\\overline{T}}(S)\\times P(\\overline{T})', TOT, true);
t('tot LaTeX MathLive', 'P_T\\left(S\\right)\\times P\\left(T\\right)+P_{\\overline{T}}\\left(S\\right)\\times P\\left(\\overline{T}\\right)', TOT, true);
t('tot ordre inversé', 'P_{\\overline{T}}(S)P(\\overline{T})+P(T)P_{T}(S)', TOT, true);
t('tot avec 1/2', '\\frac{1}{2}P_{T}(S)+\\frac{1}{2}P_{\\overline{T}}(S)', TOT, true);
t('tot avec 0,5', '0{,}5P_{T}(S)+0{,}5P_{\\overline{T}}(S)', TOT, true);
t('tot avec 1-P(T)', 'P_{T}(S)P(T)+P_{\\overline{T}}(S)(1-P(T))', TOT, true);
t('tot indice sans accolade', 'P_T(S)\\times\\frac12+P_{\\overline T}(S)\\times\\frac12', TOT, true);
// parenthèse tapée dans l'indice (clavier physique) : P_T(S) devient P_{T(S)}
t('tot indice avec parenthèse', 'P_{T\\left(S\\right)}\\times P(T)+P_{\\overline{T}\\left(S\\right)}\\times P(\\overline{T})', TOT, true);
t('tot indice barre avec parenthèse', 'P_{T(S)}\\times\\frac12+P_{\\overline{T(S)}}\\times\\frac12', TOT, true);
t('tot indice sans argument', 'P_{T}\\times\\frac12', TOT, false);
t('tot : terme oublié', 'P_{T}(S)\\times P(T)', TOT, false);
t('tot : mauvais conditionnement', 'P_{T}(S)\\times P(T)+P_{T}(S)\\times P(\\overline{T})', TOT, false);
t('tot : somme sans poids', 'P_{T}(S)+P_{\\overline{T}}(S)', TOT, false);
t('tot : produit', 'P_{T}(S)\\times P_{\\overline{T}}(S)', TOT, false);
t('tot : recopie P(S)', 'P(S)', TOT, false);
t('tot : illisible', 'P_{T}(S)\\times', TOT, false);
t('tot : vide', '', TOT, false);
// 2. réunion
const UNI = { reponse: 'P(R)+P(T)-P(R\\cap T)' };
t('union', 'P(R)+P(T)-P(R\\cap T)', UNI, true);
t('union autre ordre', 'P(T)-P(R\\cap T)+P(R)', UNI, true);
t('union cap-cup', 'P(R)+P(T)-P(R\\cup T)', UNI, false);
t('union signe', 'P(R)+P(T)+P(R\\cap T)', UNI, false);
t('union recopiée', 'P(R\\cup T)', UNI, false);
// 3. König-Huygens et trinôme
const KH = { reponse: 'E(X^{2})-E(X)^{2}' };
t('KH', 'E\\left(X^2\\right)-E\\left(X\\right)^2', KH, true);
t('KH avec accolades', 'E(X^{2})-(E(X))^{2}', KH, true);
t('KH faux', 'E(X^2)-E(X)', KH, false);
t('KH recopiée V(X)', 'V(X)', KH, false);
const TRI = { reponse: 'x^{2}-2E(X)x+E(X^{2})' };
t('trinôme', 'x^2-2E(X)x+E(X^2)', TRI, true);
t('trinôme autre forme', 'E(X^2)+x^2-2xE(X)', TRI, true);
t('trinôme faux coefficient', 'x^2-E(X)x+E(X^2)', TRI, false);
t('trinôme faux E(X)^2', 'x^2-2E(X)x+E(X)^2', TRI, false);
// 4. variables et fractions : \sigma^2 / n
const SIG = { reponse: '\\frac{\\sigma^{2}}{n}' };
t('sigma', '\\frac{\\sigma^2}{n}', SIG, true);
t('sigma dfrac', '\\dfrac{\\sigma^{2}}{n}', SIG, true);
t('sigma n au numérateur', '\\sigma^2n', SIG, false);
// 5. contraire dans l'argument : P_B(\overline A) = 1 - P_B(A)
t('contraire argument', '1-P_{B}(A)', { reponse: 'P_{B}(\\overline{A})' }, true);
t('contraire argument bis', 'P_{B}(\\overline{A})', { reponse: '1-P_{B}(A)' }, true);
t('contraire conditionnement', '1-P_{B}(A)', { reponse: 'P_{\\overline{B}}(A)' }, false);
// 6. valeurs connues : P(R_1) = 2/3
const URN = { reponse: 'P_{R_{1}}(R_{2})P(R_{1})+P_{\\overline{R_{1}}}(R_{2})P(\\overline{R_{1}})', fixes: { 'P(R_1)': 2 / 3 } };
t('urne', 'P_{R_1}(R_2)P(R_1)+P_{\\overline{R_1}}(R_2)P(\\overline{R_1})', URN, true);
t('urne nombres', 'P_{R_1}(R_2)\\times\\frac{2}{3}+P_{\\overline{R_1}}(R_2)\\times\\frac{1}{3}', URN, true);
t('urne faux 1/2', 'P_{R_1}(R_2)\\times\\frac{1}{2}+P_{\\overline{R_1}}(R_2)\\times\\frac{1}{2}', URN, false);
// 7. cléDe
const c1 = FP.cleDe('P_{T}(S)'), c2 = FP.cleDe('P_T\\left(S\\right)');
if (c1 === c2 && c1) ok++; else { ko++; console.log('ECHEC : cleDe', c1, c2); }
// 8. barre : gabarits échappés pour onclick
const html = FP.barreHTML(3, ['P', 'Pcond', 'bar']);
if (html.includes("insererMath(3,'P\\\\left(#0\\\\right)')") && html.includes("'\\\\overline{#0}'")) ok++; else { ko++; console.log('ECHEC : barreHTML', html); }
console.log(`${ok} réussis, ${ko} échec(s)`);
process.exit(ko ? 1 : 0);
