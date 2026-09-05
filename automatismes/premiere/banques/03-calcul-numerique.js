/* Banque 03 — Calcul numérique
   Familles observées dans les sujets 2026 : priorités opératoires avec fractions
   (Amérique du Nord : 1/2 + 3/2 × 4), calcul de fractions (Centres étrangers :
   A/B + 1), puissances (Polynésie : 2⁹ × 5⁷ ; Amérique du Nord : (2×3²)/(27×2³) ;
   Métropole : 10²⁰¹×10⁻⁴/(10²)¹⁰⁰ ; sujet zéro : 10⁷/5²), racines carrées.

   Niveau 1 — les bases : priorités avec des entiers, somme et produit de fractions
              simples, puissances de 10 et produits de puissances de même base.
   Niveau 2 — l'épreuve : priorités mêlant fractions et entiers, quotient de fractions,
              puissances à simplifier, racines carrées usuelles.
   Niveau 3 — bien plus difficile : carrés et signes (−3² ≠ (−3)²), parenthèses
              imbriquées, fractions étagées, exposants négatifs et notation
              scientifique, racines à simplifier et expressions conjuguées. */
(function () {
  'use strict';
  const O = Automatismes.outils;
  const { alea, aleaParmi, melanger, dec, decL, fracL, m, sciL, qcm, famille } = O;

  // ---------- fractions exactes ----------
  function F(n, d) {
    d = d === undefined ? 1 : d;
    if (d < 0) { n = -n; d = -d; }
    const g = O.pgcd(n, d) || 1;
    return { n: n / g, d: d / g };
  }
  const fAdd = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d);
  const fSub = (a, b) => F(a.n * b.d - b.n * a.d, a.d * b.d);
  const fMul = (a, b) => F(a.n * b.n, a.d * b.d);
  const fDiv = (a, b) => F(a.n * b.d, a.d * b.n);
  const fL = a => fracL(a.n, a.d);                 // LaTeX
  const fCle = a => a.n + '/' + a.d;               // clé d'unicité
  const fOpt = a => ({ affichage: m(fL(a)), cle: fCle(a) });
  const fEgal = (a, b) => a.n === b.n && a.d === b.d;
  const fVal = a => a.n / a.d;
  // une vraie fraction : après réduction, le dénominateur reste > 1 — sinon on afficherait
  // des énoncés comme « 1/4 × 1 » ou des étapes comme « 2/1 »
  function fracAlea(maxNum, dens) {
    for (let i = 0; i < 40; i++) {
      const f = F(alea(1, maxNum), aleaParmi(dens));
      if (f.d > 1) return f;
    }
    return F(1, 2);
  }

  const opt = (aff, cle) => ({ affichage: aff, cle: cle === undefined ? aff : cle });
  const optNum = v => opt(m(decL(v)), v);

  // formulations variées d'un calcul
  const PHRASES = [
    e => `Le nombre ${m(e)} est égal à :`,
    e => `Le résultat du calcul ${m(e)} est :`,
    e => `${m(e)} est égal à :`,
    e => `On considère le nombre ${m('A = ' + e)}. On peut affirmer que :`
  ];
  function enonceCalcul(e, forceA) {
    if (forceA) return `On considère le nombre ${m('A = ' + e)}.<br>On peut affirmer que ${m('A')} est égal à :`;
    return aleaParmi(PHRASES.slice(0, 3))(e);
  }

  // =====================================================================
  // Famille A : priorités opératoires
  // =====================================================================
  function priorites(niveau) {
    if (niveau === 1) return prioritesEntiers();
    return prioritesFractions();
  }

  // N1 : entiers, un seul piège de priorité à la fois
  function prioritesEntiers() {
    const type = aleaParmi(['somme-produit', 'somme-produit', 'produit-difference', 'carre', 'parentheses', 'quotient']);
    const a = alea(2, 12), b = alea(2, 9), c = alea(2, 9);
    if (type === 'somme-produit') {
      const rep = a + b * c;
      const e = `${a} + ${b} \\times ${c}`;
      const cands = [(a + b) * c, a * b + c, a + b + c, a * b * c, a * (b + c)].filter(v => v !== rep).map(optNum);
      return qcm(enonceCalcul(e), optNum(rep), cands, {
        explication: `La multiplication est prioritaire : ${m(e + ' = ' + a + ' + ' + (b * c) + ' = ' + rep)} (et non ${m('(' + a + ' + ' + b + ') \\times ' + c + ' = ' + ((a + b) * c))}).`
      });
    }
    if (type === 'produit-difference') {
      const rep = a * b - c;
      if (rep <= 0) return null;
      const e = `${a} \\times ${b} - ${c}`;
      const cands = [a * (b - c), a * b + c, a - b * c, (a * b) * c].filter(v => v !== rep).map(optNum);
      return qcm(enonceCalcul(e), optNum(rep), cands, {
        explication: `On effectue d'abord la multiplication : ${m(e + ' = ' + (a * b) + ' - ' + c + ' = ' + rep)}.`
      });
    }
    if (type === 'carre') {
      const rep = a + b * b;
      const e = `${a} + ${b}^2`;
      const cands = [(a + b) * (a + b), a + 2 * b, (a + b) * 2, a * b * b].filter(v => v !== rep).map(optNum);
      return qcm(enonceCalcul(e), optNum(rep), cands, {
        explication: `Le carré ne porte que sur ${m(String(b))} : ${m(e + ' = ' + a + ' + ' + (b * b) + ' = ' + rep)} (et non ${m('(' + a + ' + ' + b + ')^2 = ' + ((a + b) * (a + b)))}).`
      });
    }
    if (type === 'parentheses') {
      const rep = (a + b) * c;
      const e = `(${a} + ${b}) \\times ${c}`;
      const cands = [a + b * c, a + b + c, a * c + b, a * b * c].filter(v => v !== rep).map(optNum);
      return qcm(enonceCalcul(e), optNum(rep), cands, {
        explication: `Les parenthèses sont prioritaires : ${m(e + ' = ' + (a + b) + ' \\times ' + c + ' = ' + rep)}.`
      });
    }
    // quotient : a ÷ b + c avec division exacte
    const q = alea(2, 9), d = alea(2, 9);
    const num = q * d;
    const rep = q + c;
    const e = `${num} \\div ${d} + ${c}`;
    const cands = [num / (d + c), q * c, num + d + c, (num + c) / d].filter(v => v !== rep && Number.isInteger(v) && v > 0).map(optNum);
    return qcm(enonceCalcul(e), optNum(rep), cands, {
      explication: `La division est prioritaire sur l'addition : ${m(e + ' = ' + q + ' + ' + c + ' = ' + rep)} (et non ${m(num + ' \\div (' + d + ' + ' + c + ')')}).`
    });
  }

  // N2 : priorités mêlant fractions et entiers (Amérique du Nord 2026 : 1/2 + 3/2 × 4)
  function prioritesFractions() {
    const type = aleaParmi(['frac-plus-produit', 'frac-plus-produit', 'entier-moins-produit', 'produit-somme']);
    const dens = [2, 3, 4, 5, 6, 8];
    if (type === 'frac-plus-produit') {
      const A = fracAlea(5, dens);
      const B = fracAlea(5, dens);
      const k = alea(2, 6);
      const rep = fAdd(A, fMul(B, F(k)));
      const e = `${fL(A)} + ${fL(B)} \\times ${k}`;
      const gauche = fMul(fAdd(A, B), F(k));            // calcul de gauche à droite
      const cands = [gauche, fAdd(A, B), fMul(fAdd(A, B), F(k, 1)), fAdd(fMul(A, F(k)), B), fAdd(A, B), fMul(A, fMul(B, F(k)))]
        .filter(x => !fEgal(x, rep)).map(fOpt);
      return qcm(enonceCalcul(e), fOpt(rep), cands, {
        explication: `La multiplication est prioritaire : ${m(fL(B) + ' \\times ' + k + ' = ' + fL(fMul(B, F(k))))}, puis ${m(fL(A) + ' + ' + fL(fMul(B, F(k))) + ' = ' + fL(rep))}. En calculant de gauche à droite on trouverait ${m(fL(gauche))}, ce qui est faux.`
      });
    }
    if (type === 'entier-moins-produit') {
      const k = alea(2, 8);
      const A = fracAlea(5, dens);
      const B = fracAlea(4, dens);
      const rep = fSub(F(k), fMul(A, B));
      const e = `${k} - ${fL(A)} \\times ${fL(B)}`;
      const cands = [fMul(fSub(F(k), A), B), fSub(F(k), fSub(A, B)), fMul(A, fSub(F(k), B)), fSub(fMul(F(k), A), B), fAdd(F(k), fMul(A, B))]
        .filter(x => !fEgal(x, rep)).map(fOpt);
      return qcm(enonceCalcul(e), fOpt(rep), cands, {
        explication: `On calcule d'abord le produit : ${m(fL(A) + ' \\times ' + fL(B) + ' = ' + fL(fMul(A, B)))}, puis ${m(k + ' - ' + fL(fMul(A, B)) + ' = ' + fL(rep))}.`
      });
    }
    // k × (A + B)
    const k = alea(2, 6);
    const A = fracAlea(5, dens);
    const B = fracAlea(5, dens);
    const rep = fMul(F(k), fAdd(A, B));
    const e = `${k} \\times \\left(${fL(A)} + ${fL(B)}\\right)`;
    const cands = [fAdd(fMul(F(k), A), B), fAdd(A, fMul(F(k), B)), fAdd(A, B), fMul(F(k), fMul(A, B)), fMul(F(k * k), fAdd(A, B))]
      .filter(x => !fEgal(x, rep)).map(fOpt);
    return qcm(enonceCalcul(e), fOpt(rep), cands, {
      explication: `On commence par la parenthèse : ${m(fL(A) + ' + ' + fL(B) + ' = ' + fL(fAdd(A, B)))}, puis ${m(k + ' \\times ' + fL(fAdd(A, B)) + ' = ' + fL(rep))}. Le facteur ${m(String(k))} porte sur toute la somme.`
    });
  }

  // N3-a : carrés et signes (−3² ≠ (−3)²)
  function signesCarres() {
    const a = alea(2, 9);
    const type = aleaParmi(['moins-carre', 'carre-moins', 'somme', 'produit']);
    if (type === 'moins-carre') {
      const rep = -(a * a);
      const e = `-${a}^2`;
      const cands = [a * a, -2 * a, 2 * a, -a].map(optNum);
      return qcm(enonceCalcul(e), optNum(rep), cands, {
        explication: `Le carré porte sur ${m(String(a))}, pas sur ${m('-' + a)} : ${m(e + ' = -(' + a + ' \\times ' + a + ') = ' + rep)}. Il faudrait écrire ${m('(-' + a + ')^2')} pour obtenir ${m(String(a * a))}.`
      });
    }
    if (type === 'carre-moins') {
      const rep = a * a;
      const e = `(-${a})^2`;
      const cands = [-(a * a), -2 * a, 2 * a, -a].map(optNum);
      return qcm(enonceCalcul(e), optNum(rep), cands, {
        explication: `${m(e + ' = (-' + a + ') \\times (-' + a + ') = ' + rep)} : le produit de deux nombres négatifs est positif. Sans parenthèses, ${m('-' + a + '^2')} vaudrait ${m(String(-(a * a)))}.`
      });
    }
    if (type === 'somme') {
      const rep = 0;
      const e = `-${a}^2 + (-${a})^2`;
      const cands = [2 * a * a, -2 * a * a, a * a, -(a * a)].map(optNum);
      return qcm(enonceCalcul(e), optNum(rep), cands, {
        explication: `${m('-' + a + '^2 = ' + (-(a * a)))} et ${m('(-' + a + ')^2 = ' + (a * a))} : leur somme vaut ${m('0')}. Les deux écritures ne désignent pas le même nombre.`
      });
    }
    const b = alea(2, 6);
    const rep = -b * (a * a);
    const e = `-${b} \\times ${a}^2`;
    const cands = [b * a * a, -(b * a) * (b * a), -b * 2 * a, (b * a) * (b * a)].filter(v => v !== rep).map(optNum);
    return qcm(enonceCalcul(e), optNum(rep), cands, {
      explication: `Le carré s'applique d'abord : ${m(a + '^2 = ' + (a * a))}, puis ${m('-' + b + ' \\times ' + (a * a) + ' = ' + rep)} (et non ${m('(-' + b + ' \\times ' + a + ')^2')}).`
    });
  }

  // N3-b : parenthèses imbriquées et relatifs
  function prioritesImbriquees() {
    const type = aleaParmi(['imbrique', 'relatif', 'relatif']);
    if (type === 'imbrique') {
      const a = alea(2, 5), b = alea(2, 6), c = alea(2, 5), d = alea(2, 8), f = alea(2, 5);
      if (d - f <= 0) return null;
      const inner = d - f;
      const rep = a * (b + c * inner);
      const e = `${a} \\times \\left(${b} + ${c} \\times (${d} - ${f})\\right)`;
      const cands = [a * (b + c) * inner, a * b + c * inner, (a * b + c) * inner, a * (b + c * d - f), a * b * c * inner]
        .filter(v => v !== rep).map(optNum);
      return qcm(enonceCalcul(e), optNum(rep), cands, {
        explication: `On part de la parenthèse la plus intérieure : ${m(d + ' - ' + f + ' = ' + inner)}, puis ${m(c + ' \\times ' + inner + ' = ' + (c * inner))}, puis ${m(b + ' + ' + (c * inner) + ' = ' + (b + c * inner))}, enfin ${m(a + ' \\times ' + (b + c * inner) + ' = ' + rep)}.`
      });
    }
    const a = alea(2, 12), b = alea(2, 9), c = alea(2, 6), d = alea(7, 14);
    const rep = a - b * (c - d);          // c − d négatif : le résultat augmente
    const e = `${a} - ${b} \\times (${c} - ${d})`;
    const cands = [a - b * (d - c), (a - b) * (c - d), a - b * c - d, a + b * c - d, a - (b * c - d)]
      .filter(v => v !== rep).map(optNum);
    return qcm(enonceCalcul(e), optNum(rep), cands, {
      explication: `${m(c + ' - ' + d + ' = ' + (c - d))}, donc ${m(b + ' \\times (' + (c - d) + ') = ' + (b * (c - d)))} et ${m(a + ' - (' + (b * (c - d)) + ') = ' + rep)} : retrancher un nombre négatif revient à ajouter.`
    });
  }

  // =====================================================================
  // Famille B : fractions
  // =====================================================================
  function fractions(niveau) {
    if (niveau === 1) return fractionsSimples();
    return fractionsExpression();
  }

  // N1 : somme, différence ou produit de deux fractions simples
  function fractionsSimples() {
    const type = aleaParmi(['somme', 'somme', 'produit', 'difference']);
    const dens = [2, 3, 4, 5, 6, 8, 10];
    let A = fracAlea(5, dens);
    let B = fracAlea(5, dens);
    if (type === 'produit') {
      const rep = fMul(A, B);
      const e = `${fL(A)} \\times ${fL(B)}`;
      const cands = [fAdd(A, B), F(A.n * B.n, A.d + B.d), F(A.n + B.n, A.d * B.d), fDiv(A, B), F(A.n * B.d, A.d * B.n)]
        .filter(x => !fEgal(x, rep)).map(fOpt);
      // n'afficher l'étape non réduite que si elle diffère du résultat final
      const brut = A.n * B.n === rep.n && A.d * B.d === rep.d
        ? '' : '\\dfrac{' + (A.n * B.n) + '}{' + (A.d * B.d) + '} = ';
      return qcm(enonceCalcul(e), fOpt(rep), cands, {
        explication: `On multiplie les numérateurs entre eux et les dénominateurs entre eux : ${m(e + ' = ' + brut + fL(rep))}.`
      });
    }
    if (type === 'difference') {
      if (fVal(A) < fVal(B)) { const t = A; A = B; B = t; }
      const rep = fSub(A, B);
      if (rep.n === 0) return null;
      const e = `${fL(A)} - ${fL(B)}`;
      const cands = [F(A.n - B.n, A.d - B.d || 1), F(A.n - B.n, Math.max(A.d, B.d)), fAdd(A, B), F(A.n * B.d - B.n * A.d, Math.max(A.d, B.d))]
        .filter(x => x.d !== 0 && !fEgal(x, rep)).map(fOpt);
      const cd = A.d * B.d / O.pgcd(A.d, B.d);
      return qcm(enonceCalcul(e), fOpt(rep), cands, {
        explication: `On réduit au même dénominateur ${m(String(cd))} : ${m('\\dfrac{' + (A.n * cd / A.d) + '}{' + cd + '} - \\dfrac{' + (B.n * cd / B.d) + '}{' + cd + '} = ' + fL(rep))}.`
      });
    }
    const rep = fAdd(A, B);
    const e = `${fL(A)} + ${fL(B)}`;
    const cands = [F(A.n + B.n, A.d + B.d), F(A.n + B.n, Math.max(A.d, B.d)), fMul(A, B), F(A.n + B.n, A.d * B.d)]
      .filter(x => !fEgal(x, rep)).map(fOpt);
    const cd = A.d * B.d / O.pgcd(A.d, B.d);
    return qcm(enonceCalcul(e), fOpt(rep), cands, {
      explication: `On réduit au même dénominateur ${m(String(cd))} : ${m('\\dfrac{' + (A.n * cd / A.d) + '}{' + cd + '} + \\dfrac{' + (B.n * cd / B.d) + '}{' + cd + '} = ' + fL(rep))}. On n'additionne jamais les dénominateurs.`
    });
  }

  // N2 : expression avec deux fractions nommées (Centres étrangers 2026 : A/B + 1)
  function fractionsExpression() {
    const type = aleaParmi(['quotient-plus-un', 'quotient-plus-un', 'quotient', 'somme-produit']);
    const dens = [2, 3, 4, 5, 6, 8];
    const A = fracAlea(5, dens);
    const B = fracAlea(5, dens);
    if (B.n === 0) return null;
    if (type === 'quotient-plus-un') {
      const rep = fAdd(fDiv(A, B), F(1));
      const e = `\\dfrac{A}{B} + 1`;
      const enonce = `On considère les nombres ${m('A = ' + fL(A))} et ${m('B = ' + fL(B))}.<br>Le nombre ${m(e)} est égal à :`;
      const cands = [fDiv(A, B), fAdd(fMul(A, B), F(1)), fDiv(B, A), fAdd(fDiv(B, A), F(1)), fAdd(A, fAdd(B, F(1))), fMul(fDiv(A, B), F(2))]
        .filter(x => !fEgal(x, rep)).map(fOpt);
      return qcm(enonce, fOpt(rep), cands, {
        explication: `${m('\\dfrac{A}{B} = ' + fL(A) + ' \\div ' + fL(B) + ' = ' + fL(A) + ' \\times ' + fL(F(B.d, B.n)) + ' = ' + fL(fDiv(A, B)))}, puis on ajoute 1 : ${m(fL(fDiv(A, B)) + ' + 1 = ' + fL(rep))}.`
      });
    }
    if (type === 'quotient') {
      const rep = fDiv(A, B);
      const e = `${fL(A)} \\div ${fL(B)}`;
      const cands = [fMul(A, B), fDiv(B, A), F(A.n * B.n, A.d * B.d), F(A.n / O.pgcd(A.n, B.n) * B.d, A.d)]
        .filter(x => x.d !== 0 && !fEgal(x, rep)).map(fOpt);
      return qcm(enonceCalcul(e), fOpt(rep), cands, {
        explication: `Diviser par une fraction, c'est multiplier par son inverse : ${m(e + ' = ' + fL(A) + ' \\times ' + fL(F(B.d, B.n)) + ' = ' + fL(rep))}.`
      });
    }
    const k = alea(2, 5);
    const rep = fAdd(A, fMul(B, F(1, k)));
    const e = `A + \\dfrac{B}{${k}}`;
    const enonce = `On considère les nombres ${m('A = ' + fL(A))} et ${m('B = ' + fL(B))}.<br>Le nombre ${m(e)} est égal à :`;
    const cands = [fMul(fAdd(A, B), F(1, k)), fAdd(A, fMul(B, F(k))), fAdd(A, B), fAdd(fMul(A, F(1, k)), B)]
      .filter(x => !fEgal(x, rep)).map(fOpt);
    return qcm(enonce, fOpt(rep), cands, {
      explication: `${m('\\dfrac{B}{' + k + '} = ' + fL(B) + ' \\div ' + k + ' = ' + fL(fMul(B, F(1, k))))}, puis ${m(fL(A) + ' + ' + fL(fMul(B, F(1, k))) + ' = ' + fL(rep))}.`
    });
  }

  // N3-a : fraction étagée
  function fractionEtagee() {
    const dens = [2, 3, 4, 5, 6];
    const A = fracAlea(4, dens);
    const B = fracAlea(4, dens);
    if (fEgal(A, B)) return null;
    const type = aleaParmi(['etage-simple', 'somme-sur-difference', 'un-sur-somme']);
    if (type === 'etage-simple') {
      const rep = fDiv(A, B);
      const e = `\\dfrac{\\;${fL(A)}\\;}{\\;${fL(B)}\\;}`;
      const cands = [fMul(A, B), fDiv(B, A), F(A.n * B.n, A.d * B.d), F(A.n, B.n)]
        .filter(x => x.d !== 0 && !fEgal(x, rep)).map(fOpt);
      return qcm(enonceCalcul(e), fOpt(rep), cands, {
        explication: `Une barre de fraction est une division : ${m(fL(A) + ' \\div ' + fL(B) + ' = ' + fL(A) + ' \\times ' + fL(F(B.d, B.n)) + ' = ' + fL(rep))}.`
      });
    }
    if (type === 'somme-sur-difference') {
      const S = fAdd(A, B), D = fSub(A, B);
      if (D.n === 0) return null;
      const rep = fDiv(S, D);
      const e = `\\dfrac{\\;${fL(A)} + ${fL(B)}\\;}{\\;${fL(A)} - ${fL(B)}\\;}`;
      const cands = [fDiv(D, S), fAdd(fDiv(A, A), fDiv(B, B)), fSub(S, D), fDiv(S, fAdd(A, B))]
        .filter(x => x.d !== 0 && !fEgal(x, rep)).map(fOpt);
      return qcm(enonceCalcul(e), fOpt(rep), cands, {
        explication: `Numérateur : ${m(fL(S))} ; dénominateur : ${m(fL(D))}. Le quotient vaut ${m(fL(S) + ' \\div ' + fL(D) + ' = ' + fL(rep))}. On ne simplifie pas terme à terme dans une somme.`
      });
    }
    const S = fAdd(A, B);
    const rep = fDiv(F(1), S);
    const e = `\\dfrac{1}{\\;${fL(A)} + ${fL(B)}\\;}`;
    const cands = [fAdd(fDiv(F(1), A), fDiv(F(1), B)), S, fDiv(F(1), fMul(A, B)), fAdd(A, B)]
      .filter(x => x.d !== 0 && !fEgal(x, rep)).map(fOpt);
    return qcm(enonceCalcul(e), fOpt(rep), cands, {
      explication: `On calcule d'abord la somme : ${m(fL(A) + ' + ' + fL(B) + ' = ' + fL(S))}, puis on prend l'inverse : ${m(fL(rep))}. Attention : ${m('\\dfrac{1}{a+b} \\neq \\dfrac{1}{a} + \\dfrac{1}{b}')}.`
    });
  }

  // N3-b : comparaison de fractions
  function comparerFractions() {
    const paires = [[3, 4, 5, 7], [5, 8, 7, 11], [4, 7, 5, 9], [7, 9, 8, 11], [2, 3, 5, 8], [3, 5, 4, 7], [5, 6, 6, 7], [7, 10, 5, 7], [9, 11, 8, 9], [11, 13, 10, 11]];
    const [a, b, c, d] = aleaParmi(paires);
    const A = F(a, b), B = F(c, d);
    if (fEgal(A, B)) return null;
    const plusGrand = fVal(A) > fVal(B) ? A : B;
    const enonce = `Parmi les nombres suivants, le plus grand est :`;
    const autres = [F(a, d), F(c, b), F(a + c, b + d)].filter(x => !fEgal(x, A) && !fEgal(x, B) && fVal(x) < fVal(plusGrand));
    const cands = [fOpt(fVal(A) > fVal(B) ? B : A)].concat(autres.map(fOpt));
    return qcm(enonce, fOpt(plusGrand), cands, {
      explication: `On réduit au même dénominateur ${m(String(b * d))} : ${m(fL(A) + ' = \\dfrac{' + (a * d) + '}{' + (b * d) + '}')} et ${m(fL(B) + ' = \\dfrac{' + (c * b) + '}{' + (b * d) + '}')}. Le plus grand est ${m(fL(plusGrand))}.`,
      optionsLarges: false
    });
  }

  // =====================================================================
  // Famille C : puissances
  // =====================================================================
  function puissances(niveau) {
    if (niveau === 1) return puissancesSimples();
    return puissancesEpreuve();
  }

  // N1 : produit, quotient, puissance de puissance, en base 10 ou 2
  function puissancesSimples() {
    const type = aleaParmi(['produit', 'produit', 'quotient', 'puissance', 'decimal']);
    const base = aleaParmi([10, 10, 10, 2, 3, 5]);
    const bL = String(base);
    if (type === 'produit') {
      const a = alea(2, 6), b = alea(2, 6);
      const e = `${bL}^{${a}} \\times ${bL}^{${b}}`;
      const rep = `${bL}^{${a + b}}`;
      const cands = [`${bL}^{${a * b}}`, `${bL}^{${Math.abs(a - b)}}`, `${base * base}^{${a + b}}`, `${bL}^{${a + b + 1}}`].map(x => opt(m(x), x));
      return qcm(enonceCalcul(e), opt(m(rep), rep), cands, {
        explication: `Pour un produit de puissances de même base, on ajoute les exposants : ${m(e + ' = ' + bL + '^{' + a + '+' + b + '} = ' + rep)}.`
      });
    }
    if (type === 'quotient') {
      const a = alea(5, 9), b = alea(2, 4);
      const e = `\\dfrac{${bL}^{${a}}}{${bL}^{${b}}}`;
      const rep = `${bL}^{${a - b}}`;
      const cands = [`${bL}^{${a + b}}`, `${bL}^{${Math.round(a / b)}}`, `1^{${a - b}}`, `${bL}^{${a * b}}`].map(x => opt(m(x), x));
      return qcm(enonceCalcul(e), opt(m(rep), rep), cands, {
        explication: `Pour un quotient de puissances de même base, on soustrait les exposants : ${m(e + ' = ' + bL + '^{' + a + '-' + b + '} = ' + rep)}.`
      });
    }
    if (type === 'puissance') {
      const a = alea(2, 4), b = alea(2, 4);
      const e = `\\left(${bL}^{${a}}\\right)^{${b}}`;
      const rep = `${bL}^{${a * b}}`;
      const cands = [`${bL}^{${a + b}}`, `${bL}^{${a}}`, `${bL}^{${Math.pow(a, b)}}`, `${bL}^{${a * b + 1}}`].map(x => opt(m(x), x));
      return qcm(enonceCalcul(e), opt(m(rep), rep), cands, {
        explication: `Pour une puissance de puissance, on multiplie les exposants : ${m(e + ' = ' + bL + '^{' + a + ' \\times ' + b + '} = ' + rep)}.`
      });
    }
    // écriture décimale d'une puissance de 10
    const a = aleaParmi([2, 3, 4, -1, -2, -3]);
    const val = Math.pow(10, a);
    const e = `10^{${a}}`;
    const cands = [Math.pow(10, -a), a * 10, Math.pow(10, a > 0 ? a - 1 : a + 1), a].filter(v => v !== val).map(optNum);
    return qcm(`L’écriture décimale de ${m(e)} est :`, optNum(val), cands, {
      explication: a > 0
        ? `${m(e)} est le nombre 1 suivi de ${a} zéros : ${m(decL(val))}.`
        : `${m(e + ' = \\dfrac{1}{10^{' + (-a) + '}} = ' + decL(val))}.`
    });
  }

  // N2 : les quatre modèles rencontrés dans les sujets
  function puissancesEpreuve() {
    const type = aleaParmi(['deux-cinq', 'deux-cinq', 'primes', 'primes', 'grands-exposants', 'dix-sur-carre']);
    if (type === 'deux-cinq') {
      // Polynésie 2026 : 2⁹ × 5⁷ = 4 × 10⁷
      const b = alea(4, 8), ecart = alea(1, 4);
      const a = b + ecart;
      const mant = Math.pow(2, ecart);
      const grand = Math.random() < 0.5;
      const e = grand ? `2^{${a}} \\times 5^{${b}}` : `5^{${a}} \\times 2^{${b}}`;
      const mantisse = grand ? mant : Math.pow(5, ecart);
      if (mantisse > 625) return null;
      const rep = sciL(mantisse, b);
      const cands = [`10^{${a + b}}`, `10^{${a * b}}`, sciL(mantisse, a + b), `10^{${b}}`, sciL(mantisse * 2, b)].map(x => opt(m(x), x));
      const petit = grand ? 5 : 2, gros = grand ? 2 : 5;
      return qcm(enonceCalcul(e), opt(m(rep), rep), cands, {
        explication: `On regroupe les facteurs ${m('2 \\times 5 = 10')} : ${m(e + ' = ' + gros + '^{' + ecart + '} \\times (' + gros + '^{' + b + '} \\times ' + petit + '^{' + b + '}) = ' + decL(mantisse) + ' \\times 10^{' + b + '}')}. Les exposants ne s'additionnent que pour une même base.`
      });
    }
    if (type === 'primes') {
      // Amérique du Nord 2026 : (2 × 3²)/(27 × 2³) = 1/12
      const p = 2, q = 3;
      const a = alea(1, 3), b = alea(1, 3), c = alea(2, 4), d = alea(2, 4);
      const ep = a - c, eq = b - d;
      if (ep === 0 && eq === 0) return null;
      const val = F(Math.pow(p, Math.max(ep, 0)) * Math.pow(q, Math.max(eq, 0)), Math.pow(p, Math.max(-ep, 0)) * Math.pow(q, Math.max(-eq, 0)));
      if (val.d > 200 || val.n > 200) return null;
      const numTxt = `${p} ${a > 1 ? '^{' + a + '}' : ''} \\times ${q}^{${b}}`.replace(' ^', '^');
      const denTxt = `${Math.pow(q, d)} \\times ${p}^{${c}}`;
      const e = `\\dfrac{${a === 1 ? p : p + '^{' + a + '}'} \\times ${q}^{${b}}}{${Math.pow(q, d)} \\times ${p}^{${c}}}`;
      const cands = [F(val.d, val.n), fMul(val, F(2)), F(val.n * 2, val.d), F(Math.pow(p, a + c) * Math.pow(q, b), Math.pow(q, d)), fMul(val, F(1, 2))]
        .filter(x => x.d !== 0 && !fEgal(x, val)).map(fOpt);
      void numTxt; void denTxt;
      return qcm(enonceCalcul(e, true), fOpt(val), cands, {
        explication: `On écrit tout en puissances de ${m('2')} et ${m('3')} : ${m(String(Math.pow(q, d)) + ' = ' + q + '^{' + d + '}')}, donc ${m('A = ' + p + '^{' + a + '-' + c + '} \\times ' + q + '^{' + b + '-' + d + '} = ' + fL(val))}.`
      });
    }
    if (type === 'grands-exposants') {
      // Métropole 2026 : (10²⁰¹ × 10⁻⁴)/(10²)¹⁰⁰
      const c = alea(50, 120), d = 2;
      const a = c * d + alea(-2, 3);
      const b = -alea(2, 6);
      const expo = a + b - c * d;
      if (Math.abs(expo) > 4) return null;
      const e = `\\dfrac{10^{${a}} \\times 10^{${b}}}{\\left(10^{${d}}\\right)^{${c}}}`;
      const val = Math.pow(10, expo);
      const cands = [Math.pow(10, -expo), Math.pow(10, expo + 1), Math.pow(10, expo - 1), -Math.pow(10, expo), Math.pow(10, expo + 2)]
        .filter(v => v !== val).map(optNum);
      return qcm(enonceCalcul(e, true), optNum(val), cands, {
        explication: `Numérateur : ${m('10^{' + a + '} \\times 10^{' + b + '} = 10^{' + (a + b) + '}')}. Dénominateur : ${m('(10^{' + d + '})^{' + c + '} = 10^{' + (c * d) + '}')}. Donc ${m('A = 10^{' + (a + b) + ' - ' + (c * d) + '} = 10^{' + expo + '} = ' + decL(val))}.`
      });
    }
    // sujet zéro : 10⁷/5² = 4 × 10⁵
    const a = alea(5, 9);
    const k = aleaParmi([2, 5]);
    const p = aleaParmi([2, 3]);
    const div = Math.pow(k, p);
    const mantisse = Math.pow(k === 2 ? 5 : 2, p);
    const expo = a - p;
    const e = `\\dfrac{10^{${a}}}{${k}^{${p}}}`;
    const rep = sciL(mantisse, expo);
    const cands = [sciL(mantisse, a), `10^{${a - p}}`, `2^{${a}}`, sciL(div, expo), `10^{${a}}`].map(x => opt(m(x), x));
    return qcm(enonceCalcul(e, true), opt(m(rep), rep), cands, {
      explication: `${m(k + '^{' + p + '} = ' + div)} et ${m('10^{' + p + '} = ' + Math.pow(10, p))}, donc ${m('\\dfrac{1}{' + div + '} = \\dfrac{' + mantisse + '}{10^{' + p + '}}')}. D'où ${m('A = ' + decL(mantisse) + ' \\times 10^{' + a + ' - ' + p + '} = ' + rep)}.`
    });
  }

  // N3-a : notation scientifique (produit et quotient)
  function notationScientifique() {
    const m1 = aleaParmi([1.5, 2, 2.5, 3, 4, 5, 6, 8, 1.2, 7.5]);
    const m2 = aleaParmi([2, 2.5, 4, 5, 8, 1.5, 3, 1.6]);
    const e1 = alea(-8, 12), e2 = alea(-8, 12);
    const produit = Math.random() < 0.5;
    let mant = produit ? m1 * m2 : m1 / m2;
    let expo = produit ? e1 + e2 : e1 - e2;
    // normalisation : 1 ≤ mantisse < 10
    while (mant >= 10) { mant = O.arrondir(mant / 10, 6); expo++; }
    while (mant < 1) { mant = O.arrondir(mant * 10, 6); expo--; }
    if (!Number.isInteger(O.arrondir(mant * 100, 6))) return null;
    const e = produit
      ? `(${decL(m1)} \\times 10^{${e1}}) \\times (${decL(m2)} \\times 10^{${e2}})`
      : `\\dfrac{${decL(m1)} \\times 10^{${e1}}}{${decL(m2)} \\times 10^{${e2}}}`;
    const rep = sciL(mant, expo);
    const brut = produit ? m1 * m2 : m1 / m2;
    const cands = [
      sciL(mant, produit ? e1 * e2 : e1 + e2),
      sciL(mant, expo + 1),
      sciL(mant, expo - 1),
      O.arrondir(brut, 6) !== mant ? sciL(O.arrondir(brut, 6), produit ? e1 + e2 : e1 - e2) : sciL(mant, expo + 2),
      sciL(O.arrondir(mant * 10, 6), expo)
    ].map(x => opt(m(x), x));
    return qcm(`Écrit en notation scientifique, le nombre ${m(e)} est égal à :`, opt(m(rep), rep), cands, {
      explication: `On sépare mantisses et puissances de 10 : ${m(decL(m1) + (produit ? ' \\times ' : ' \\div ') + decL(m2) + ' = ' + decL(O.arrondir(brut, 6)))} et ${m('10^{' + e1 + (produit ? '+' : '-') + '(' + e2 + ')} = 10^{' + (produit ? e1 + e2 : e1 - e2) + '}')}, puis on ramène la mantisse entre 1 et 10 : ${m(rep)}.`
    });
  }

  // N3-b : exposants négatifs et écriture fractionnaire
  // écriture d'une puissance d'exposant quelconque, sans développer les grands nombres
  const puisL = (b, e) => (e === 0 ? '1' : e > 0 ? `${b}^{${e}}` : `\\dfrac{1}{${b}^{${-e}}}`);
  function exposantsNegatifs() {
    const type = aleaParmi(['inverse', 'produit-negatif', 'quotient-negatif']);
    const base = aleaParmi([2, 3, 5, 10]);
    if (type === 'inverse') {
      // exposant petit : la réponse s'écrit comme une vraie fraction (1/125, 1/1000…)
      const a = base === 2 ? alea(2, 5) : alea(2, 3);
      const val = F(1, Math.pow(base, a));
      const e = `${base}^{-${a}}`;
      const cands = [F(-Math.pow(base, a)), F(Math.pow(base, a)), F(1, base * a), F(-1, Math.pow(base, a))]
        .filter(x => !fEgal(x, val)).map(fOpt);
      return qcm(enonceCalcul(e), fOpt(val), cands, {
        explication: `Un exposant négatif donne l'inverse : ${m(e + ' = \\dfrac{1}{' + base + '^{' + a + '}} = ' + fL(val))} (le résultat reste positif).`
      });
    }
    if (type === 'produit-negatif') {
      const a = alea(2, 7), b = -alea(2, 5);
      const s = a + b;
      if (s === 0) return null;
      const e = `${base}^{${a}} \\times ${base}^{${b}}`;
      const cands = [
        opt(m(puisL(base, a * b)), 'x' + a * b),
        opt(m(puisL(base, a - b)), 'y' + (a - b)),
        opt(m(puisL(base, -s)), 'inv' + (-s)),
        opt(m(`${base * base}^{${s}}`), 'b2')
      ];
      return qcm(enonceCalcul(e), opt(m(puisL(base, s)), 'r' + s), cands, {
        explication: `On ajoute les exposants : ${m(e + ' = ' + base + '^{' + a + ' + (' + b + ')} = ' + base + '^{' + s + '} = ' + puisL(base, s))}.`
      });
    }
    const a = -alea(2, 5), b = alea(2, 6);
    const s = a - b;
    const e = `\\dfrac{${base}^{${a}}}{${base}^{${b}}}`;
    const cands = [
      opt(m(puisL(base, a + b)), 'p' + (a + b)),
      opt(m(puisL(base, -s)), 'e' + (-s)),
      opt(m(puisL(base, s + 1)), 'q' + (s + 1)),
      opt(m(`-${base}^{${-s}}`), 'neg')
    ];
    return qcm(enonceCalcul(e), opt(m(puisL(base, s)), 'r' + s), cands, {
      explication: `On soustrait les exposants : ${m(e + ' = ' + base + '^{(' + a + ') - ' + b + '} = ' + base + '^{' + s + '} = ' + puisL(base, s))}.`
    });
  }

  // N3-c : fraction continue — a + 1/(b + 1/c)   (fiche d'automatismes 1, Q4)
  function fractionContinue() {
    const a = alea(1, 4), b = alea(2, 4), c = alea(2, 5);
    const interne = fAdd(F(b), F(1, c));            // b + 1/c
    const rep = fAdd(F(a), fDiv(F(1), interne));
    const e = `${a} + \\dfrac{1}{${b} + \\dfrac{1}{${c}}}`;
    const cands = [
      fAdd(fAdd(F(a), F(1, b)), F(1, c)),            // parenthèses ignorées
      fAdd(F(a), interne),                            // on additionne au lieu d'inverser
      fAdd(F(a), F(1, b + c)),
      fAdd(F(a), F(c, b + c)),
      fDiv(fAdd(F(a), F(1)), interne)
    ].filter(x => !fEgal(x, rep)).map(fOpt);
    return qcm(enonceCalcul(e), fOpt(rep), cands, {
      explication: `On part du dénominateur le plus profond : ${m(b + ' + \\dfrac{1}{' + c + '} = ' + fL(interne))}. Alors ${m('\\dfrac{1}{' + fL(interne) + '} = ' + fL(fDiv(F(1), interne)))}, et enfin ${m(a + ' + ' + fL(fDiv(F(1), interne)) + ' = ' + fL(rep))}.`
    });
  }

  // N3-d : fraction complexe avec priorités   (fiche 3, Q2)
  function fractionComplexe() {
    const p = alea(4, 9), q = alea(2, 9), r = alea(1, 5), s = alea(2, 6);
    const t = alea(4, 9), u = alea(1, 5), w = alea(2, 6);
    const num = fSub(F(p), fMul(F(q), F(r, s)));     // p - q × r/s
    const den = fSub(F(t), F(u, w));                 // t - u/w
    if (den.n === 0 || num.n === 0) return null;
    const rep = fDiv(num, den);
    if (Math.abs(rep.n) > 400 || rep.d > 400) return null;
    const e = `F = \\dfrac{${p} - ${q} \\times \\dfrac{${r}}{${s}}}{${t} - \\dfrac{${u}}{${w}}}`;
    const cands = [
      fDiv(den, num),
      fDiv(fMul(fSub(F(p), F(q)), F(r, s)), den),     // priorité ignorée au numérateur
      fDiv(num, fSub(F(t), F(w, u))),
      fMul(num, den),
      fDiv(fSub(F(p), fMul(F(q), F(s, r))), den)
    ].filter(x => x.d !== 0 && !fEgal(x, rep) && Math.abs(x.n) < 2000 && x.d < 2000).map(fOpt);
    return qcm(`Le quotient ${m(e)} est égal à :`, fOpt(rep), cands, {
      explication: `Numérateur : la multiplication passe avant la soustraction, ${m(q + ' \\times \\dfrac{' + r + '}{' + s + '} = ' + fL(fMul(F(q), F(r, s))))}, donc il vaut ${m(fL(num))}. Dénominateur : ${m(fL(den))}. Enfin ${m(fL(num) + ' \\div ' + fL(den) + ' = ' + fL(num) + ' \\times ' + fL(F(den.d, den.n)) + ' = ' + fL(rep))}.`
    });
  }

  // N3-e : quelle simplification est correcte ?   (fiche 2, Q8 — reformulée en QCM à 4 choix)
  function simplificationJuste() {
    const type = aleaParmi(['radical', 'puissance']);
    if (type === 'radical') {
      // (p + √(k²r)) / p  avec k multiple de p  →  1 + (k/p)√r
      const p = aleaParmi([2, 3]), j = alea(1, 3), r = aleaParmi([2, 3, 5, 6, 7]);
      const k = p * j;
      const rad = k * k * r;
      const e = `\\dfrac{${p} + \\sqrt{${rad}}}{${p}}`;
      const rac = c => (c === 1 ? '' : c) + `\\sqrt{${r}}`;
      const bonne = `1 + ${rac(j)}`;
      const cands = [
        rac(k),                                       // on « simplifie » le p du numérateur
        `1 + ${rac(k)}`,                              // oubli de diviser la racine
        `\\dfrac{1 + ${rac(k)}}{${p}}`,
        `1 + \\sqrt{${Math.round(rad / p)}}`
      ].filter(x => x !== bonne).map(x => opt(m(x), x));
      return qcm(`Le nombre ${m(e)} est égal à :`, opt(m(bonne), bonne), cands, {
        explication: `${m('\\sqrt{' + rad + '} = \\sqrt{' + (k * k) + ' \\times ' + r + '} = ' + rac(k))}. Donc ${m(e + ' = \\dfrac{' + p + ' + ' + rac(k) + '}{' + p + '} = 1 + ' + rac(j))} : on divise <b>les deux</b> termes du numérateur par ${m(String(p))}.`
      });
    }
    // (2^a × 10)^n / 2^m = 2^(an−m) × 10^n     (fiche 2, Q4 : 40⁵/2⁸ = 4×10⁵)
    const a = alea(1, 3), n = alea(3, 5);
    const reste = alea(1, 3);
    const mm = a * n - reste;
    if (mm < 1) return null;
    const base = Math.pow(2, a) * 10;
    const mant = Math.pow(2, reste);
    const e = `\\dfrac{${base}^{${n}}}{2^{${mm}}}`;
    const bonne = sciL(mant, n);
    const cands = [
      `10^{${n}}`, sciL(Math.pow(2, a * n), n), sciL(mant, n - 1), sciL(Math.pow(2, reste + 1), n)
    ].filter(x => x !== bonne).map(x => opt(m(x), x));
    return qcm(enonceCalcul(e, true), opt(m(bonne), bonne), cands, {
      explication: `${m(String(base) + ' = 2^{' + a + '} \\times 10')}, donc ${m(base + '^{' + n + '} = 2^{' + (a * n) + '} \\times 10^{' + n + '}')}. En divisant par ${m('2^{' + mm + '}')} il reste ${m('2^{' + (a * n) + ' - ' + mm + '} = 2^{' + reste + '} = ' + mant)}, d'où ${m(bonne)}.`
    });
  }

  // N3-f : puissances avec des lettres   (fiche 3, Q7)
  function puissancesLitterales() {
    const [u, w] = melanger(['a', 'b', 'x', 'y', 'p', 'q']).slice(0, 2).sort();
    const i = alea(1, 3), j = alea(1, 2), k = alea(2, 3);   // (u^i w^j)^k
    const l = -alea(3, 6), o = alea(1, 2);                  // × u^l × u^o
    const s = -alea(1, 2), t = alea(1, 2), z = 2;           // / (u^s w^t)^z
    const eu = i * k + l + o - s * z;
    const ew = j * k - t * z;
    if (eu === 0 && ew === 0) return null;
    if (Math.abs(eu) > 5 || Math.abs(ew) > 4) return null;
    const litt = (a1, a2) => {
      const f1 = a1 === 0 ? '' : a1 === 1 ? u : u + '^{' + a1 + '}';
      const f2 = a2 === 0 ? '' : a2 === 1 ? w : w + '^{' + a2 + '}';
      const p = [f1, f2].filter(Boolean).join('');
      return p || '1';
    };
    // exposant négatif : on écrit le facteur au dénominateur
    const forme = (a1, a2) => {
      const haut = litt(Math.max(a1, 0), Math.max(a2, 0));
      const bas = litt(Math.max(-a1, 0), Math.max(-a2, 0));
      return bas === '1' ? haut : '\\dfrac{' + haut + '}{' + bas + '}';
    };
    const e = `\\dfrac{\\left(${u}^{${i}}${j === 1 ? w : w + '^{' + j + '}'}\\right)^{${k}} \\times ${u}^{${l}} \\times ${o === 1 ? u : u + '^{' + o + '}'}}{\\left(${u}^{${s}}${t === 1 ? w : w + '^{' + t + '}'}\\right)^{${z}}}`;
    const bonne = forme(eu, ew);
    const cands = [
      forme(eu + s * z, ew + t * z), forme(-eu, ew), forme(eu, -ew), forme(eu + 1, ew), forme(i * k + l + o, j * k)
    ].filter(x => x !== bonne).map(x => opt(x, x));
    return qcm(`Soient ${m(u)} et ${m(w)} deux réels non nuls.<br>${m(e)} est égal à :`, opt(bonne, bonne), cands, {
      explication: `Au numérateur : ${m('(' + u + '^{' + i + '}' + (j === 1 ? w : w + '^{' + j + '}') + ')^{' + k + '} = ' + u + '^{' + (i * k) + '}' + w + '^{' + (j * k) + '}')}, puis on ajoute les exposants de ${m(u)} : ${m(u + '^{' + (i * k) + ' + (' + l + ') + ' + o + '} = ' + u + '^{' + (i * k + l + o) + '}')}. Au dénominateur : ${m(u + '^{' + (s * z) + '}' + w + '^{' + (t * z) + '}')}. En soustrayant les exposants : ${m(bonne)}.`
    });
  }

  // N3-g : somme d'une grande et d'une petite puissance   (fiche 3, Q8)
  function sommePuissancesOpposees() {
    const b = aleaParmi([2, 3, 4, 5, 10]);
    const n = alea(8, 14);
    const e = `X = ${b}^{${n}} + ${b}^{-${n}}`;
    const bonne = `${b}^{${n}}`;
    const cands = [`${b}^{0}`, `2 \\times ${b}^{${n}}`, '0', `${b}^{${2 * n}}`].filter(x => x !== bonne).map(x => opt(m(x), x));
    return qcm(`On considère ${m(e)}.<br>Le nombre ${m('X')} est environ égal à :`, opt(m(bonne), bonne), cands, {
      explication: `${m(b + '^{-' + n + '} = \\dfrac{1}{' + b + '^{' + n + '}}')} est un nombre minuscule, négligeable devant ${m(b + '^{' + n + '}')} qui est très grand. La somme vaut donc environ ${m(b + '^{' + n + '}')}. Les exposants opposés ne se compensent pas dans une <b>somme</b> (ce serait vrai dans un produit).`
    });
  }

  // =====================================================================
  // Famille D : racines carrées (niveaux 2 et 3)
  // =====================================================================
  const CARRES = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225];
  const RADICANDS = [2, 3, 5, 6, 7, 10, 11, 13, 15];
  const racL = k => (k === 1 ? '' : k) + '\\sqrt{' + '@' + '}';   // gabarit (non utilisé tel quel)

  function racines(niveau) {
    const type = niveau === 2
      ? aleaParmi(['exacte', 'produit', 'carre-de-racine', 'simplifier'])
      : aleaParmi(['simplifier', 'somme', 'conjugue', 'rationaliser']);
    if (type === 'exacte') {
      const c = aleaParmi(CARRES);
      const r = Math.sqrt(c);
      const e = `\\sqrt{${c}}`;
      const cands = [c / 2, r * r, c / 4, r + 1].filter(v => v !== r && v > 0).map(optNum);
      return qcm(enonceCalcul(e), optNum(r), cands, {
        explication: `${m(r + '^2 = ' + c)}, donc ${m(e + ' = ' + r)}.`
      });
    }
    if (type === 'produit') {
      const a = aleaParmi([2, 3, 5, 6, 8, 12, 18, 20, 27, 32, 50]);
      const b = aleaParmi([2, 3, 5, 6, 8]);
      const p = a * b;
      const r = Math.sqrt(p);
      if (!Number.isInteger(r)) return null;
      const e = `\\sqrt{${a}} \\times \\sqrt{${b}}`;
      const cands = [a + b, p, Math.sqrt(a + b), r * 2].filter(v => v !== r && Number.isInteger(v)).map(optNum);
      return qcm(enonceCalcul(e), optNum(r), cands, {
        explication: `${m('\\sqrt{a} \\times \\sqrt{b} = \\sqrt{a \\times b}')} : ${m(e + ' = \\sqrt{' + p + '} = ' + r)}.`
      });
    }
    if (type === 'carre-de-racine') {
      const a = aleaParmi(RADICANDS.concat([12, 20, 30]));
      const e = `\\left(\\sqrt{${a}}\\right)^2`;
      const cands = [Math.round(Math.sqrt(a) * 100) / 100, a * a, 2 * a, a / 2].filter(v => v !== a).map(optNum);
      return qcm(enonceCalcul(e), optNum(a), cands, {
        explication: `Pour ${m('a \\geqslant 0')}, ${m('\\left(\\sqrt{a}\\right)^2 = a')} : le carré annule la racine, donc le résultat est ${m(String(a))}.`
      });
    }
    if (type === 'simplifier') {
      const k = aleaParmi([2, 3, 4, 5, 6]);
      const r = aleaParmi(RADICANDS);
      const rad = k * k * r;
      const e = `\\sqrt{${rad}}`;
      const rep = `${k}\\sqrt{${r}}`;
      const cands = [`${k * k}\\sqrt{${r}}`, `${k}\\sqrt{${r * k}}`, `${r}\\sqrt{${k}}`, `${k * r}`].map(x => opt(m(x), x));
      return qcm(`La forme simplifiée de ${m(e)} est :`, opt(m(rep), rep), cands, {
        explication: `${m(rad + ' = ' + (k * k) + ' \\times ' + r)}, donc ${m(e + ' = \\sqrt{' + (k * k) + '} \\times \\sqrt{' + r + '} = ' + rep)}.`
      });
    }
    if (type === 'somme') {
      const r = aleaParmi([2, 3, 5, 6, 7]);
      let k1 = alea(2, 6), k2 = alea(2, 6);
      if (k1 === k2) return null;
      if (k1 < k2) { const t = k1; k1 = k2; k2 = t; }
      const rad1 = k1 * k1 * r, rad2 = k2 * k2 * r;
      const diff = k1 - k2;
      const cr = (k, rad) => (k === 1 ? '' : k) + `\\sqrt{${rad}}`;   // pas de « 1√ »
      const e = `\\sqrt{${rad1}} - \\sqrt{${rad2}}`;
      const rep = cr(diff, r);
      const cands = [cr(1, rad1 - rad2), cr(k1 + k2, r), cr(diff, rad1 - rad2), `${diff * r}`].map(x => opt(m(x), x));
      return qcm(enonceCalcul(e), opt(m(rep), rep), cands, {
        explication: `${m('\\sqrt{' + rad1 + '} = ' + k1 + '\\sqrt{' + r + '}')} et ${m('\\sqrt{' + rad2 + '} = ' + k2 + '\\sqrt{' + r + '}')}, donc la différence vaut ${m(rep)}. Attention : ${m('\\sqrt{a} - \\sqrt{b} \\neq \\sqrt{a-b}')}.`
      });
    }
    if (type === 'conjugue') {
      const a = alea(2, 6);
      const r = aleaParmi([2, 3, 5, 6, 7, 10]);
      const rep = a * a - r;
      const e = `\\left(${a} + \\sqrt{${r}}\\right)\\left(${a} - \\sqrt{${r}}\\right)`;
      const cands = [a * a + r, a * a, r - a * a, 2 * a * a - r].filter(v => v !== rep).map(optNum);
      return qcm(enonceCalcul(e), optNum(rep), cands, {
        explication: `C'est une identité remarquable ${m('(a+b)(a-b) = a^2 - b^2')} : ${m(e + ' = ' + a + '^2 - \\left(\\sqrt{' + r + '}\\right)^2 = ' + (a * a) + ' - ' + r + ' = ' + rep)}.`
      });
    }
    // rationaliser 1/√a
    const r = aleaParmi([2, 3, 5, 6, 7, 10, 11]);
    const e = `\\dfrac{1}{\\sqrt{${r}}}`;
    const rep = `\\dfrac{\\sqrt{${r}}}{${r}}`;
    const cands = [`\\dfrac{${r}}{\\sqrt{${r}}}`, `\\sqrt{${r}}`, `\\dfrac{\\sqrt{${r}}}{${r * r}}`, `\\dfrac{1}{${r}}`].map(x => opt(m(x), x));
    return qcm(`Le nombre ${m(e)} est égal à :`, opt(m(rep), rep), cands, {
      explication: `On multiplie numérateur et dénominateur par ${m('\\sqrt{' + r + '}')} : ${m(e + ' = \\dfrac{\\sqrt{' + r + '}}{\\sqrt{' + r + '} \\times \\sqrt{' + r + '}} = ' + rep)}.`
    });
  }
  void racL;

  // =====================================================================
  Automatismes.enregistrerBanque('calcul-numerique', {
    titre: 'Calcul numérique',
    familles: {
      'priorites': famille({ nom: 'priorités opératoires', niveaux: [1, 2, 3], base: priorites, variantes3: [signesCarres, prioritesImbriquees, fractionComplexe], ordre: { 1: 1, 2: 1 } }),
      'fractions': famille({ nom: 'fractions', niveaux: [1, 2, 3], base: fractions, variantes3: [fractionEtagee, comparerFractions, fractionContinue, fractionContinue], partBase3: 0.2, ordre: { 1: 2, 2: 2 } }),
      'puissances': famille({ nom: 'puissances', niveaux: [1, 2, 3], base: puissances, variantes3: [notationScientifique, exposantsNegatifs, puissancesLitterales, sommePuissancesOpposees, simplificationJuste], partBase3: 0.2, ordre: { 1: 3, 2: 3 }, quota: { 2: { min: 1, priorite: 2 }, 3: { min: 1 } } }),
      'racines': famille({ nom: 'racines carrées', niveaux: [2, 3], base: racines, variantes3: [() => racines(3), simplificationJuste], partBase3: 0.5, ordre: { 2: 4 }, quota: { 2: { max: 1 }, 3: { max: 2 } } })
    }
  });
})();
