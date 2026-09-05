/* Banque 05 — Équations, inéquations et formules
   Familles observées dans les sujets 2026 :
   équation produit nul (Polynésie : (−0,5x+3)(−5x−4)=0),
   équation du premier degré dégénérée (Amérique du Nord : 2(x−4)−(2x+1)=0 → aucune solution),
   isoler une variable dans une formule (Polynésie : Ec = ½mv² ; Asie : x = 3 + 5/y ;
   Centres étrangers : x = 5/(2+y) ; sujet zéro : F = G·mA·mB/d²),
   inéquation du premier degré (sujet zéro : 2x − 7 < 13),
   équation x² = a (sujet zéro : x² = 10),
   signe d'un produit / tableau de signes (Amérique du Nord et sujet zéro).

   Niveau 1 — les bases : ax + b = c, (x−a)(x−b) = 0, formule à une opération,
              inéquation sans changement de sens.
   Niveau 2 — l'épreuve : équation avec l'inconnue des deux côtés et cas dégénérés,
              produit nul à coefficients décimaux, formules physiques, inéquation avec
              changement de sens, x² = a, tableau de signes.
   Niveau 3 — bien plus difficile : équations à fractions, quotient nul, formules à
              isoler sous une racine, inéquations à fractions, (x−a)² = b, signe d'un quotient. */
(function () {
  'use strict';
  const O = Automatismes.outils;
  const { alea, aleaParmi, aleaNonNul, melanger, dec, decL, fracL, m, qcm, famille,
    mono, poly, paren, coefParen, joindre } = O;
  const R = v => O.arrondir(v, 6);
  const opt = (aff, cle) => ({ affichage: m(aff), cle: cle === undefined ? aff : cle });
  const optTxt = (aff, cle) => ({ affichage: aff, cle: cle === undefined ? aff : cle });

  const VARS = ['x', 'x', 'x', 'y', 't', 'z'];
  const varAlea = () => aleaParmi(VARS);

  // ---------- ensembles de solutions et intervalles ----------
  const MOINS_INF = '-\\infty', PLUS_INF = '+\\infty';
  // ]a ; b[ avec crochets ouvrants/fermants choisis
  function inter(a, b, ouvertA, ouvertB) {
    const g = ouvertA ? '\\left]' : '\\left[';
    const d = ouvertB ? '\\right[' : '\\right]';
    return g + a + '\\,;\\,' + b + d;
  }
  const ensemble = liste => '\\left\\{' + liste.join('\\,;\\,') + '\\right\\}';
  const VIDE = '\\varnothing';
  // valeur rationnelle p/q en LaTeX, réduite
  const rat = (p, q) => fracL(p, q);

  // =====================================================================
  // Famille A : équations du premier degré
  // =====================================================================
  function equationPremierDegre(niveau) {
    const v = varAlea();
    if (niveau === 1) {
      // a·v + b = c, solution entière
      const a = aleaNonNul(-6, 6), sol = aleaNonNul(-9, 9), b = aleaNonNul(-9, 9);
      const c = a * sol + b;
      const e = poly([[a, v], [b, '']]) + ' = ' + c;
      const bonne = v + ' = ' + sol;
      const cands = [
        v + ' = ' + R((c + b) / a), v + ' = ' + (c - b), v + ' = ' + R(c / a),
        v + ' = ' + (-sol), v + ' = ' + R((c - b) / -a)
      ].filter(x => x !== bonne && /= -?\d+(\.\d+)?$/.test(x)).map(x => opt(x.replace(/= (-?)(\d+)\.(\d+)/, (s, sg, i, d2) => '= ' + sg + i + '{,}' + d2)));
      return qcm(`L’unique solution de l’équation ${m(e)} est :`, opt(bonne), cands, {
        explication: `${m(e)} donne ${m(mono(a, v) + ' = ' + (c - b))}, puis ${m(v + ' = ' + rat(c - b, a) + (Number.isInteger((c - b) / a) ? '' : ''))} soit ${m(v + ' = ' + sol)}.`
      });
    }
    // N2/N3 : inconnue des deux côtés, avec les cas dégénérés du sujet d'Amérique du Nord
    const cas = aleaParmi(['normale', 'normale', 'normale', 'aucune', 'infinite']);
    if (cas === 'aucune') {
      // k(v + p) - (k·v + q) = 0 avec kp ≠ q  → constante non nulle = 0
      const k = alea(2, 5), p = aleaNonNul(-8, 8), q = aleaNonNul(-9, 9);
      if (k * p === q) return null;
      const e = coefParen(k, paren([[1, v], [p, '']])) + ' - ' + paren([[k, v], [q, '']]) + ' = 0';
      const faux1 = rat(q, k), faux2 = -p;
      const bonne = optTxt('Aucune solution');
      const cands = [
        optTxt('Une infinité de solutions'),
        optTxt(`Deux solutions : ${m(String(faux2))} et ${m(faux1)}`, 'deux'),
        optTxt(`Une seule solution : ${m(v + ' = ' + String(k * p - q))}`, 'une'),
        optTxt(`Une seule solution : ${m(v + ' = 0')}`, 'zero')
      ];
      return qcm(`Dans ${m('\\mathbb{R}')}, l’équation ${m(e)} admet :`, bonne, cands, {
        explication: `On développe : ${m(poly([[k, v], [k * p, '']]) + ' - ' + paren([[k, v], [q, '']]) + ' = ' + String(k * p - q))}. Les termes en ${m(v)} se compensent et il reste ${m(String(k * p - q) + ' = 0')}, ce qui est faux : l’équation n’a aucune solution. Ce n’est pas une équation produit nul, il n’y a donc pas deux solutions à lire dans les parenthèses.`,
        optionsLarges: true
      });
    }
    if (cas === 'infinite') {
      const k = alea(2, 5), p = aleaNonNul(-8, 8);
      const e = coefParen(k, paren([[1, v], [p, '']])) + ' = ' + poly([[k, v], [k * p, '']]);
      const bonne = optTxt('Une infinité de solutions');
      const cands = [
        optTxt('Aucune solution'),
        optTxt(`Une seule solution : ${m(v + ' = ' + (-p))}`, 'une'),
        optTxt(`Une seule solution : ${m(v + ' = 0')}`, 'zero'),
        optTxt(`Deux solutions : ${m(String(-p))} et ${m(String(k))}`, 'deux')
      ];
      return qcm(`Dans ${m('\\mathbb{R}')}, l’équation ${m(e)} admet :`, bonne, cands, {
        explication: `En développant le membre de gauche : ${m(coefParen(k, paren([[1, v], [p, '']])) + ' = ' + poly([[k, v], [k * p, '']]))}. Les deux membres sont identiques : l’égalité est vraie pour tout réel ${m(v)}.`,
        optionsLarges: true
      });
    }
    // a·v + b = c·v + d
    const a = aleaNonNul(-6, 6), c = aleaNonNul(-6, 6);
    if (a === c) return null;
    const sol = niveau === 3 ? aleaParmi([-3.5, -2.5, -1.5, 1.5, 2.5, 3.5, -4.5, 4.5]) : aleaNonNul(-8, 8);
    const b = aleaNonNul(-9, 9);
    const d = R((a - c) * sol + b);
    if (!Number.isInteger(d)) return null;
    const e = poly([[a, v], [b, '']]) + ' = ' + poly([[c, v], [d, '']]);
    const affSol = Number.isInteger(sol) ? String(sol) : rat(Math.round(sol * 2), 2);
    const bonne = v + ' = ' + affSol;
    const cands = [
      v + ' = ' + rat(d + b, a - c), v + ' = ' + rat(b - d, a - c), v + ' = ' + rat(d - b, a + c || 1),
      v + ' = ' + rat(-(d - b), a - c), v + ' = ' + rat(d - b, c - a)
    ].filter(x => x !== bonne).map(x => opt(x));
    return qcm(`L’unique solution de l’équation ${m(e)} est :`, opt(bonne), cands, {
      explication: `On regroupe les ${m(v)} à gauche et les nombres à droite : ${m(mono(a - c, v) + ' = ' + (d - b))}, donc ${m(v + ' = ' + rat(d - b, a - c))}.`
    });
  }

  // N3 : équation à fractions
  function equationFractions() {
    const v = varAlea();
    const p = alea(2, 6), q = alea(2, 6);
    if (p === q) return null;
    const sol = aleaNonNul(-8, 8);
    const a = aleaNonNul(-6, 6);
    // (v + a)/p = (v + b)/q  →  q(v+a) = p(v+b)  →  (q-p)v = pb - qa
    const b = R((sol * (q - p) + q * a) / p);
    if (!Number.isInteger(b) || b === 0) return null;
    const e = '\\dfrac{' + poly([[1, v], [a, '']]) + '}{' + p + '} = \\dfrac{' + poly([[1, v], [b, '']]) + '}{' + q + '}';
    const bonne = v + ' = ' + sol;
    const cands = [
      v + ' = ' + R(p * b - q * a), v + ' = ' + (-sol), v + ' = ' + rat(p * b - q * a, p - q),
      v + ' = ' + rat(b - a, q - p), v + ' = ' + (b - a)
    ].filter(x => x !== bonne && !/\./.test(x)).map(x => opt(x));
    return qcm(`L’unique solution de l’équation ${m(e)} est :`, opt(bonne), cands, {
      explication: `On multiplie en croix : ${m(q + paren([[1, v], [a, '']]) + ' = ' + p + paren([[1, v], [b, '']]))}, soit ${m(poly([[q, v], [q * a, '']]) + ' = ' + poly([[p, v], [p * b, '']]))}. On regroupe : ${m(mono(q - p, v) + ' = ' + (p * b - q * a))}, d'où ${m(v + ' = ' + sol)}.`
    });
  }

  // =====================================================================
  // Famille B : équation produit nul
  // =====================================================================
  function produitNul(niveau) {
    const v = varAlea();
    if (niveau === 1) {
      const r1 = aleaNonNul(-9, 9);
      let r2 = aleaNonNul(-9, 9);
      if (r1 === r2) return null;
      const e = paren([[1, v], [-r1, '']]) + paren([[1, v], [-r2, '']]) + ' = 0';
      const bonne = ensemble([String(Math.min(r1, r2)), String(Math.max(r1, r2))]);
      const cands = [
        ensemble([String(-r1), String(-r2)].sort((x, y) => x - y)),
        ensemble([String(r1)]), ensemble([String(r1 * r2)]),
        ensemble([String(Math.min(r1, r2)), String(-Math.max(r1, r2))])
      ].filter(x => x !== bonne).map(x => opt(x));
      return qcm(`Dans ${m('\\mathbb{R}')}, l’ensemble des solutions de ${m(e)} est :`, opt(bonne), cands, {
        explication: `Un produit est nul si et seulement si l’un de ses facteurs est nul : ${m(poly([[1, v], [-r1, '']]) + ' = 0')} donne ${m(v + ' = ' + r1)}, et ${m(poly([[1, v], [-r2, '']]) + ' = 0')} donne ${m(v + ' = ' + r2)}.`
      });
    }
    // N2/N3 : coefficients quelconques, éventuellement décimaux (Polynésie)
    const decimal = niveau >= 2 && Math.random() < 0.45;
    let a, b, c, d;
    if (decimal) {
      a = aleaParmi([-0.5, 0.5, -0.2, 0.2, 2.5, -2.5]);
      c = aleaParmi([-5, 5, -4, 4, -2, 2]);
      b = R(a * -aleaNonNul(-8, 8));
      d = R(c * -aleaParmi([0.8, -0.8, 1.5, -1.5, 0.4, -0.4, 2.5, -2.5]));
    } else {
      a = aleaNonNul(-6, 6); c = aleaNonNul(-6, 6);
      b = aleaNonNul(-9, 9); d = aleaNonNul(-9, 9);
    }
    const r1 = R(-b / a), r2 = R(-d / c);
    if (r1 === r2) return null;
    if (!Number.isInteger(R(r1 * 10)) || !Number.isInteger(R(r2 * 10))) return null;
    const e = paren([[a, v], [b, '']]) + paren([[c, v], [d, '']]) + ' = 0';
    const tri = (x, y) => (x < y ? [x, y] : [y, x]);
    const [s1, s2] = tri(r1, r2);
    const bonne = ensemble([decL(s1), decL(s2)]);
    const cands = [
      ensemble(tri(R(-r1), R(-r2)).map(decL)),
      ensemble(tri(R(b / a), R(d / c)).map(decL)),
      ensemble([decL(s1)]),
      ensemble(tri(R(-b * a), R(-d * c)).map(decL)),
      ensemble(tri(s1, R(-r2)).map(decL))
    ].filter(x => x !== bonne).map(x => opt(x));
    return qcm(`Dans ${m('\\mathbb{R}')}, l’ensemble des solutions de ${m(e)} est :`, opt(bonne), cands, {
      explication: `Un produit est nul si et seulement si l’un de ses facteurs est nul. ${m(poly([[a, v], [b, '']]) + ' = 0')} donne ${m(v + ' = ' + rat(-b * 10, a * 10) + ' = ' + decL(r1))} ; ${m(poly([[c, v], [d, '']]) + ' = 0')} donne ${m(v + ' = ' + decL(r2))}.`
    });
  }

  // N3 : quotient nul (le dénominateur doit rester non nul)
  function quotientNul() {
    const v = varAlea();
    const a = aleaNonNul(-5, 5), b = aleaNonNul(-9, 9);
    const c = aleaNonNul(-5, 5), d = aleaNonNul(-9, 9);
    const r = R(-b / a), interdite = R(-d / c);
    if (r === interdite) return null;
    if (!Number.isInteger(R(r * 2)) || !Number.isInteger(R(interdite * 2))) return null;
    const e = '\\dfrac{' + poly([[a, v], [b, '']]) + '}{' + poly([[c, v], [d, '']]) + '} = 0';
    const bonne = ensemble([rat(-b, a)]);
    const cands = [
      ensemble([rat(-d, c)]),
      ensemble([rat(-b, a), rat(-d, c)].sort()),
      ensemble([rat(b, a)]),
      VIDE
    ].filter(x => x !== bonne).map(x => opt(x));
    return qcm(`Dans ${m('\\mathbb{R}')}, l’ensemble des solutions de ${m(e)} est :`, opt(bonne), cands, {
      explication: `Un quotient est nul quand son numérateur est nul et son dénominateur ne l’est pas : ${m(poly([[a, v], [b, '']]) + ' = 0')} donne ${m(v + ' = ' + rat(-b, a))}. Cette valeur n’annule pas le dénominateur (qui s’annule en ${m(rat(-d, c))}), elle convient donc.`
    });
  }

  // =====================================================================
  // Famille C : équation du type v² = a
  // =====================================================================
  function carreEgal(niveau) {
    const v = varAlea();
    const cas = aleaParmi(niveau === 2 ? ['carre', 'nonCarre', 'nonCarre', 'negatif'] : ['nonCarre', 'negatif', 'fraction', 'decale']);
    if (cas === 'carre') {
      const r = alea(2, 12);
      const e = v + '^2 = ' + (r * r);
      const bonne = ensemble(['-' + r, String(r)]);
      const cands = [ensemble([String(r)]), ensemble([String(r * r)]), ensemble(['-' + r * r, String(r * r)]), ensemble([rat(r * r, 2)])]
        .filter(x => x !== bonne).map(x => opt(x));
      return qcm(`Dans ${m('\\mathbb{R}')}, l’ensemble des solutions de ${m(e)} est :`, opt(bonne), cands, {
        explication: `${m(v + '^2 = ' + (r * r))} équivaut à ${m(v + ' = ' + r)} ou ${m(v + ' = -' + r)} : il y a deux solutions opposées, pas une seule.`
      });
    }
    if (cas === 'nonCarre') {
      const k = aleaParmi([2, 3, 5, 6, 7, 10, 11, 13, 15, 17]);
      const e = v + '^2 = ' + k;
      const bonne = ensemble(['-\\sqrt{' + k + '}', '\\sqrt{' + k + '}']);
      const cands = [
        ensemble(['\\sqrt{' + k + '}']),
        ensemble(['-' + rat(k, 2), rat(k, 2)]),
        ensemble(['-' + k, String(k)]),
        VIDE
      ].map(x => opt(x));
      return qcm(`Dans ${m('\\mathbb{R}')}, l’ensemble des solutions de ${m(e)} est :`, opt(bonne), cands, {
        explication: `${m(String(k))} n’est pas un carré parfait, mais l’équation admet bien deux solutions : ${m(v + ' = \\sqrt{' + k + '}')} ou ${m(v + ' = -\\sqrt{' + k + '}')}.`
      });
    }
    if (cas === 'negatif') {
      const k = alea(2, 30);
      const e = v + '^2 = -' + k;
      const bonne = VIDE;
      const cands = [
        ensemble(['-\\sqrt{' + k + '}', '\\sqrt{' + k + '}']),
        ensemble(['-\\sqrt{' + k + '}']),
        ensemble(['-' + k, String(k)]),
        ensemble(['0'])
      ].map(x => opt(x));
      return qcm(`Dans ${m('\\mathbb{R}')}, l’ensemble des solutions de ${m(e)} est :`, opt(bonne), cands, {
        explication: `Un carré est toujours positif ou nul : ${m(v + '^2 \\geqslant 0')} pour tout réel ${m(v)}. L’équation ${m(e)} n’a donc aucune solution réelle.`
      });
    }
    if (cas === 'fraction') {
      const p = alea(1, 9), q = alea(2, 9);
      const P = p * p, Q = q * q;
      const e = v + '^2 = ' + fracL(P, Q);
      const bonne = ensemble(['-' + rat(p, q), rat(p, q)]);
      const cands = [
        ensemble([rat(p, q)]),
        ensemble(['-' + fracL(P, Q), fracL(P, Q)]),
        ensemble(['-' + rat(q, p), rat(q, p)]),
        VIDE
      ].filter(x => x !== bonne).map(x => opt(x));
      return qcm(`Dans ${m('\\mathbb{R}')}, l’ensemble des solutions de ${m(e)} est :`, opt(bonne), cands, {
        explication: `${m('\\sqrt{' + fracL(P, Q) + '} = ' + rat(p, q))} car ${m(rat(p, q) + '^2 = ' + fracL(P, Q))}. Les deux solutions sont opposées.`
      });
    }
    // (v - a)^2 = k, k carré parfait
    const a = aleaNonNul(-6, 6), r = alea(2, 7);
    const e = paren([[1, v], [-a, '']]) + '^2 = ' + (r * r);
    const bonne = ensemble([String(Math.min(a - r, a + r)), String(Math.max(a - r, a + r))]);
    const cands = [
      ensemble(['-' + r, String(r)]),
      ensemble([String(a + r)]),
      ensemble([String(-a - r), String(-a + r)].sort((x, y) => x - y)),
      ensemble([String(a + r * r)])
    ].filter(x => x !== bonne).map(x => opt(x));
    return qcm(`Dans ${m('\\mathbb{R}')}, l’ensemble des solutions de ${m(e)} est :`, opt(bonne), cands, {
      explication: `${m(e)} équivaut à ${m(poly([[1, v], [-a, '']]) + ' = ' + r)} ou ${m(poly([[1, v], [-a, '']]) + ' = -' + r)}, d’où ${m(v + ' = ' + (a + r))} ou ${m(v + ' = ' + (a - r))}.`
    });
  }

  // =====================================================================
  // Famille D : inéquations du premier degré
  // =====================================================================
  const SYMB = { '<': '<', '>': '>', '≤': '\\leqslant', '≥': '\\geqslant' };
  function inequation(niveau) {
    const v = varAlea();
    // niveau 1 : coefficient positif, pas de changement de sens
    const a = niveau === 1 ? alea(2, 6) : aleaNonNul(-6, 6);
    const sens = aleaParmi(['<', '>', '≤', '≥']);
    const sol = aleaNonNul(-9, 9);
    const b = aleaNonNul(-9, 9);
    const c = a * sol + b;
    const e = poly([[a, v], [b, '']]) + ' ' + SYMB[sens] + ' ' + c;
    // a < 0 : le sens de l'inégalité change
    const inverse = a < 0;
    const strict = sens === '<' || sens === '>';
    let versLaDroite = (sens === '>' || sens === '≥');
    if (inverse) versLaDroite = !versLaDroite;
    const bonne = versLaDroite
      ? inter(String(sol), PLUS_INF, strict, true)
      : inter(MOINS_INF, String(sol), true, strict);
    const cands = [
      versLaDroite ? inter(MOINS_INF, String(sol), true, strict) : inter(String(sol), PLUS_INF, strict, true),
      versLaDroite ? inter(String(sol), PLUS_INF, !strict, true) : inter(MOINS_INF, String(sol), true, !strict),
      versLaDroite ? inter(String(-sol), PLUS_INF, strict, true) : inter(MOINS_INF, String(-sol), true, strict),
      versLaDroite ? inter(String(c - b), PLUS_INF, strict, true) : inter(MOINS_INF, String(c - b), true, strict)
    ].filter(x => x !== bonne).map(x => opt(x));
    const expl = inverse
      ? `On isole ${m(v)} : ${m(mono(a, v) + ' ' + SYMB[sens] + ' ' + (c - b))}. On divise par ${m(String(a))}, qui est <b>négatif</b> : le sens de l’inégalité change, d’où ${m(v + ' ' + SYMB[versLaDroite ? (strict ? '>' : '≥') : (strict ? '<' : '≤')] + ' ' + sol)}.`
      : `On isole ${m(v)} : ${m(mono(a, v) + ' ' + SYMB[sens] + ' ' + (c - b))}, puis on divise par ${m(String(a))} qui est positif, le sens ne change pas : ${m(v + ' ' + SYMB[sens] + ' ' + sol)}.`;
    return qcm(`Dans ${m('\\mathbb{R}')}, l’ensemble des solutions de l’inéquation ${m(e)} est :`, opt(bonne), cands, {
      explication: expl
    });
  }

  // N3 : inéquation avec l'inconnue des deux côtés ou une fraction
  function inequationAvancee() {
    const v = varAlea();
    const type = aleaParmi(['deuxCotes', 'fraction']);
    const sens = aleaParmi(['<', '>', '≤', '≥']);
    const strict = sens === '<' || sens === '>';
    const sol = aleaNonNul(-8, 8);
    if (type === 'deuxCotes') {
      const a = aleaNonNul(-6, 6), c = aleaNonNul(-6, 6);
      if (a === c) return null;
      const b = aleaNonNul(-9, 9);
      const d = (a - c) * sol + b;
      const e = poly([[a, v], [b, '']]) + ' ' + SYMB[sens] + ' ' + poly([[c, v], [d, '']]);
      const inverse = (a - c) < 0;
      let versLaDroite = (sens === '>' || sens === '≥');
      if (inverse) versLaDroite = !versLaDroite;
      const bonne = versLaDroite ? inter(String(sol), PLUS_INF, strict, true) : inter(MOINS_INF, String(sol), true, strict);
      const cands = [
        versLaDroite ? inter(MOINS_INF, String(sol), true, strict) : inter(String(sol), PLUS_INF, strict, true),
        versLaDroite ? inter(String(sol), PLUS_INF, !strict, true) : inter(MOINS_INF, String(sol), true, !strict),
        versLaDroite ? inter(String(-sol), PLUS_INF, strict, true) : inter(MOINS_INF, String(-sol), true, strict),
        versLaDroite ? inter(String(d - b), PLUS_INF, strict, true) : inter(MOINS_INF, String(d - b), true, strict)
      ].filter(x => x !== bonne).map(x => opt(x));
      return qcm(`Dans ${m('\\mathbb{R}')}, l’ensemble des solutions de l’inéquation ${m(e)} est :`, opt(bonne), cands, {
        explication: `On regroupe : ${m(mono(a - c, v) + ' ' + SYMB[sens] + ' ' + (d - b))}. On divise par ${m(String(a - c))}${inverse ? ', qui est <b>négatif</b> : le sens change' : ', qui est positif : le sens ne change pas'}, d’où ${m(bonne.replace('\\left', '').replace('\\right', ''))}.`
      });
    }
    // (v + b)/p ≥ c  avec p négatif possible ; |p| ≥ 2, un dénominateur 1 ne s'écrit pas
    const p = aleaParmi([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]), b = aleaNonNul(-9, 9);
    const c = R((sol + b) / p);
    if (!Number.isInteger(c)) return null;
    const e = '\\dfrac{' + poly([[1, v], [b, '']]) + '}{' + p + '} ' + SYMB[sens] + ' ' + c;
    const inverse = p < 0;
    let versLaDroite = (sens === '>' || sens === '≥');
    if (inverse) versLaDroite = !versLaDroite;
    const bonne = versLaDroite ? inter(String(sol), PLUS_INF, strict, true) : inter(MOINS_INF, String(sol), true, strict);
    const cands = [
      versLaDroite ? inter(MOINS_INF, String(sol), true, strict) : inter(String(sol), PLUS_INF, strict, true),
      versLaDroite ? inter(String(sol), PLUS_INF, !strict, true) : inter(MOINS_INF, String(sol), true, !strict),
      versLaDroite ? inter(String(p * c), PLUS_INF, strict, true) : inter(MOINS_INF, String(p * c), true, strict),
      versLaDroite ? inter(String(-sol), PLUS_INF, strict, true) : inter(MOINS_INF, String(-sol), true, strict)
    ].filter(x => x !== bonne).map(x => opt(x));
    return qcm(`Dans ${m('\\mathbb{R}')}, l’ensemble des solutions de l’inéquation ${m(e)} est :`, opt(bonne), cands, {
      explication: `On multiplie les deux membres par ${m(String(p))}${inverse ? ', qui est <b>négatif</b> : le sens de l’inégalité change' : ', qui est positif : le sens ne change pas'}. On obtient ${m(poly([[1, v], [b, '']]) + ' ' + SYMB[versLaDroite ? (strict ? '>' : '≥') : (strict ? '<' : '≤')] + ' ' + (p * c))}, puis ${m(v + ' ' + SYMB[versLaDroite ? (strict ? '>' : '≥') : (strict ? '<' : '≤')] + ' ' + sol)}.`
    });
  }

  // N3 : inéquation produit avec un facteur du second degré  (fiche d'automatismes 2, Q3)
  //      (v² − k²)(a·v + b) > 0  se factorise en (v − k)(v + k)(a·v + b)
  function inequationProduit() {
    const v = varAlea();
    const k = alea(2, 6);
    const a = aleaNonNul(-4, 4);
    const r3 = aleaParmi([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5].filter(x => x !== k && x !== -k));
    const b = -a * r3;
    const strict = Math.random() < 0.7;
    const sens = Math.random() < 0.5 ? (strict ? '>' : '≥') : (strict ? '<' : '≤');
    const cherchePositif = sens === '>' || sens === '≥';
    const racines = [-k, k, r3].sort((x, y) => x - y);
    const e = `(${v}^2 - ${k * k})(${poly([[a, v], [b, '']])}) ${SYMB[sens]} 0`;
    const valeur = x => (x * x - k * k) * (a * x + b);
    const signeSur = i => {
      const x = i === 0 ? racines[0] - 1 : (i < racines.length ? (racines[i - 1] + racines[i]) / 2 : racines[racines.length - 1] + 1);
      return valeur(x) > 0 ? 1 : -1;
    };
    const bornes = [MOINS_INF].concat(racines.map(String), [PLUS_INF]);
    const morceaux = [], autres = [];
    for (let i = 0; i <= racines.length; i++) {
      const seg = inter(bornes[i], bornes[i + 1], true, true);
      (signeSur(i) === (cherchePositif ? 1 : -1) ? morceaux : autres).push(seg);
    }
    if (!morceaux.length || !autres.length) return null;
    const bonne = morceaux.join(' \\cup ');
    const cands = [
      autres.join(' \\cup '), morceaux[0],
      inter(bornes[1], bornes[bornes.length - 2], true, true),
      inter(MOINS_INF, bornes[1], true, true) + ' \\cup ' + inter(bornes[bornes.length - 2], PLUS_INF, true, true)
    ].filter(x => x && x !== bonne).map(x => opt(x));
    return qcm(`Dans ${m('\\mathbb{R}')}, l’ensemble des solutions de l’inéquation ${m(e)} est :`, opt(bonne), cands, {
      explication: `On factorise le premier facteur : ${m(v + '^2 - ' + (k * k) + ' = (' + v + ' - ' + k + ')(' + v + ' + ' + k + ')')}. L’inéquation a donc trois racines : ${racines.map(r => m(String(r))).join(', ')}. En étudiant le signe de chaque facteur (attention au coefficient ${m(String(a))}${a < 0 ? ', négatif' : ''}), le produit est ${cherchePositif ? 'positif' : 'négatif'} sur ${m(bonne)}.`,
      optionsLarges: true
    });
  }

  // =====================================================================
  // Famille E : isoler une variable dans une formule
  // =====================================================================
  // chaque entrée : énoncé de la formule, variable à isoler, réponse et distracteurs
  const FORMULES_N1 = [
    () => ({ ctx: 'La vitesse moyenne d’un mobile est donnée par', f: 'v = \\dfrac{d}{t}', cible: 'd',
      bonne: 'd = v \\times t', faux: ['d = \\dfrac{v}{t}', 'd = \\dfrac{t}{v}', 'd = v + t', 'd = \\dfrac{1}{vt}'],
      expl: 'On multiplie les deux membres par \\(t\\) : \\(v \\times t = d\\).' }),
    () => ({ ctx: 'L’aire d’un rectangle de longueur \\(L\\) et de largeur \\(\\ell\\) est', f: '\\mathcal{A} = L \\times \\ell', cible: '\\ell',
      bonne: '\\ell = \\dfrac{\\mathcal{A}}{L}', faux: ['\\ell = \\mathcal{A} \\times L', '\\ell = \\dfrac{L}{\\mathcal{A}}', '\\ell = \\mathcal{A} - L', '\\ell = \\dfrac{\\mathcal{A}}{2L}'],
      expl: 'On divise les deux membres par \\(L\\).' }),
    () => ({ ctx: 'Le périmètre d’un carré de côté \\(c\\) est', f: 'P = 4c', cible: 'c',
      bonne: 'c = \\dfrac{P}{4}', faux: ['c = 4P', 'c = P - 4', 'c = \\dfrac{4}{P}', 'c = \\dfrac{P}{2}'],
      expl: 'On divise les deux membres par 4.' }),
    () => ({ ctx: 'La masse volumique d’un corps est', f: '\\rho = \\dfrac{m}{V}', cible: 'V',
      bonne: 'V = \\dfrac{m}{\\rho}', faux: ['V = m \\times \\rho', 'V = \\dfrac{\\rho}{m}', 'V = m - \\rho', 'V = \\dfrac{1}{m\\rho}'],
      expl: 'On multiplie par \\(V\\) puis on divise par \\(\\rho\\).' }),
    () => ({ ctx: 'La distance parcourue à vitesse constante est', f: 'd = v \\times t', cible: 't',
      bonne: 't = \\dfrac{d}{v}', faux: ['t = d \\times v', 't = \\dfrac{v}{d}', 't = d - v', 't = \\dfrac{d}{2v}'],
      expl: 'On divise les deux membres par \\(v\\).' })
  ];
  const FORMULES_N2 = [
    // Polynésie 2026
    () => ({ ctx: 'L’énergie cinétique d’un corps de masse \\(m\\) et de vitesse \\(v\\) est', f: 'E_c = \\dfrac{1}{2}mv^2', cible: 'v', pos: '\\(v > 0\\)',
      bonne: 'v = \\sqrt{\\dfrac{2E_c}{m}}', faux: ['v = \\sqrt{\\dfrac{E_c}{2m}}', 'v = \\dfrac{2E_c}{m}', 'v = \\sqrt{2E_cm}', 'v = \\dfrac{E_c}{2m}'],
      expl: 'On multiplie par 2 : \\(2E_c = mv^2\\), on divise par \\(m\\) : \\(v^2 = \\dfrac{2E_c}{m}\\), puis on prend la racine carrée.' }),
    // Asie 2026
    () => ({ ctx: 'Pour \\(y\\) réel non nul, on définit \\(x\\) par', f: 'x = 3 + \\dfrac{5}{y}', cible: 'y',
      bonne: 'y = \\dfrac{5}{x - 3}', faux: ['y = \\dfrac{x - 3}{5}', 'y = \\dfrac{5}{x} - 3', 'y = \\dfrac{x}{8}', 'y = \\dfrac{8}{x}'],
      expl: 'On isole la fraction : \\(\\dfrac{5}{y} = x - 3\\), puis on prend l’inverse : \\(\\dfrac{y}{5} = \\dfrac{1}{x-3}\\), d’où \\(y = \\dfrac{5}{x-3}\\).' }),
    // Centres étrangers 2026
    () => ({ ctx: 'Pour \\(y \\neq -2\\), on définit \\(x\\) par', f: 'x = \\dfrac{5}{2 + y}', cible: 'y',
      bonne: 'y = \\dfrac{5}{x} - 2', faux: ['y = \\dfrac{5}{x + 2}', 'y = \\dfrac{5 - 2}{x}', 'y = 5x - 2', 'y = \\dfrac{x}{5} - 2'],
      expl: 'On multiplie par \\(2+y\\) : \\(x(2+y) = 5\\), donc \\(2 + y = \\dfrac{5}{x}\\), d’où \\(y = \\dfrac{5}{x} - 2\\).' }),
    () => ({ ctx: 'Le volume d’un cylindre de rayon \\(r\\) et de hauteur \\(h\\) est', f: 'V = \\pi r^2 h', cible: 'h',
      bonne: 'h = \\dfrac{V}{\\pi r^2}', faux: ['h = \\dfrac{V}{\\pi r}', 'h = \\dfrac{\\pi r^2}{V}', 'h = V - \\pi r^2', 'h = \\dfrac{V}{2\\pi r}'],
      expl: 'On divise les deux membres par \\(\\pi r^2\\).' }),
    () => ({ ctx: 'L’aire d’un triangle de base \\(b\\) et de hauteur \\(h\\) est', f: '\\mathcal{A} = \\dfrac{b \\times h}{2}', cible: 'h',
      bonne: 'h = \\dfrac{2\\mathcal{A}}{b}', faux: ['h = \\dfrac{\\mathcal{A}}{2b}', 'h = \\dfrac{b}{2\\mathcal{A}}', 'h = 2\\mathcal{A}b', 'h = \\dfrac{\\mathcal{A}}{b}'],
      expl: 'On multiplie par 2 : \\(2\\mathcal{A} = b \\times h\\), puis on divise par \\(b\\).' }),
    () => ({ ctx: 'La relation entre une température en degrés Celsius et en degrés Fahrenheit est', f: 'F = \\dfrac{9}{5}C + 32', cible: 'C',
      bonne: 'C = \\dfrac{5}{9}(F - 32)', faux: ['C = \\dfrac{9}{5}(F - 32)', 'C = \\dfrac{5}{9}F - 32', 'C = \\dfrac{F - 32}{5}', 'C = \\dfrac{5(F + 32)}{9}'],
      expl: 'On retranche 32 : \\(F - 32 = \\dfrac{9}{5}C\\), puis on multiplie par \\(\\dfrac{5}{9}\\).' })
  ];
  // fiche d'automatismes 3, Q6 : le piège est de garder la racine négative
  const FORMULES_N3 = [
    () => ({ ctx: 'Un objet lâché parcourt une distance \\(h\\) avant de toucher le sol ; sa vitesse à l’impact \\(v\\) vérifie', f: 'h = \\dfrac{v^2}{2g}', cible: 'v', pos: '\\(v > 0\\) et \\(g > 0\\)',
      bonne: 'v = \\sqrt{2gh}', faux: ['v = \\sqrt{\\dfrac{h}{2g}}', 'v = -\\sqrt{\\dfrac{h}{2g}}', 'v = \\sqrt{h - 2g}', 'v = \\dfrac{2gh}{2}'],
      expl: 'On multiplie par \\(2g\\) : \\(2gh = v^2\\), puis on prend la racine carrée. Comme \\(v > 0\\), on garde la racine positive : \\(v = \\sqrt{2gh}\\).' }),
    // sujet zéro
    () => ({ ctx: 'La force gravitationnelle entre deux corps de masses \\(m_A\\) et \\(m_B\\) séparés d’une distance \\(d\\) est', f: 'F = \\dfrac{G \\times m_A \\times m_B}{d^2}', cible: 'd', pos: '\\(d > 0\\)',
      bonne: 'd = \\sqrt{\\dfrac{G m_A m_B}{F}}', faux: ['d = \\sqrt{\\dfrac{G m_A m_B}{F^2}}', 'd = \\sqrt{\\dfrac{F}{G m_A m_B}}', 'd = \\dfrac{F}{G m_A m_B}', 'd = \\dfrac{G m_A m_B}{F}'],
      expl: 'On multiplie par \\(d^2\\) : \\(F d^2 = G m_A m_B\\), donc \\(d^2 = \\dfrac{G m_A m_B}{F}\\), puis on prend la racine carrée.' }),
    () => ({ ctx: 'La période d’un pendule de longueur \\(\\ell\\) est', f: 'T = 2\\pi\\sqrt{\\dfrac{\\ell}{g}}', cible: '\\ell',
      bonne: '\\ell = \\dfrac{gT^2}{4\\pi^2}', faux: ['\\ell = \\dfrac{gT^2}{2\\pi}', '\\ell = \\dfrac{4\\pi^2}{gT^2}', '\\ell = \\dfrac{T^2}{4\\pi^2 g}', '\\ell = \\dfrac{gT}{4\\pi^2}'],
      expl: 'On divise par \\(2\\pi\\), on élève au carré : \\(\\dfrac{T^2}{4\\pi^2} = \\dfrac{\\ell}{g}\\), puis on multiplie par \\(g\\).' }),
    () => ({ ctx: 'L’aire d’un disque de rayon \\(r\\) est', f: '\\mathcal{A} = \\pi r^2', cible: 'r', pos: '\\(r > 0\\)',
      bonne: 'r = \\sqrt{\\dfrac{\\mathcal{A}}{\\pi}}', faux: ['r = \\dfrac{\\mathcal{A}}{\\pi}', 'r = \\sqrt{\\mathcal{A}\\pi}', 'r = \\dfrac{\\sqrt{\\mathcal{A}}}{\\pi}', 'r = \\dfrac{\\mathcal{A}}{2\\pi}'],
      expl: 'On divise par \\(\\pi\\) : \\(r^2 = \\dfrac{\\mathcal{A}}{\\pi}\\), puis on prend la racine carrée.' }),
    () => ({ ctx: 'La résistance équivalente de deux résistances en parallèle vérifie', f: '\\dfrac{1}{R} = \\dfrac{1}{R_1} + \\dfrac{1}{R_2}', cible: 'R',
      bonne: 'R = \\dfrac{R_1 R_2}{R_1 + R_2}', faux: ['R = R_1 + R_2', 'R = \\dfrac{R_1 + R_2}{R_1 R_2}', 'R = \\dfrac{1}{R_1 + R_2}', 'R = \\dfrac{R_1 + R_2}{2}'],
      expl: 'On réduit au même dénominateur : \\(\\dfrac{1}{R} = \\dfrac{R_2 + R_1}{R_1R_2}\\), puis on prend l’inverse.' }),
    () => ({ ctx: 'Le volume d’un cône de rayon \\(r\\) et de hauteur \\(h\\) est', f: 'V = \\dfrac{1}{3}\\pi r^2 h', cible: 'r', pos: '\\(r > 0\\)',
      bonne: 'r = \\sqrt{\\dfrac{3V}{\\pi h}}', faux: ['r = \\sqrt{\\dfrac{V}{3\\pi h}}', 'r = \\dfrac{3V}{\\pi h}', 'r = \\sqrt{\\dfrac{\\pi h}{3V}}', 'r = \\dfrac{3V}{\\pi h^2}'],
      expl: 'On multiplie par 3 puis on divise par \\(\\pi h\\) : \\(r^2 = \\dfrac{3V}{\\pi h}\\), puis racine carrée.' })
  ];
  function isolerVariable(niveau) {
    const liste = niveau === 1 ? FORMULES_N1 : niveau === 2 ? FORMULES_N2 : FORMULES_N3;
    const F = aleaParmi(liste)();
    const enonce = `${F.ctx} ${m(F.f)}${F.pos ? ', avec ' + F.pos : ''}.<br>L’expression de ${m(F.cible)} en fonction des autres grandeurs est :`;
    const cands = melanger(F.faux).map(x => opt(x));
    return qcm(enonce, opt(F.bonne), cands, { explication: F.expl, optionsLarges: true });
  }

  // =====================================================================
  // Famille F : signe d'une expression (tableau de signes)
  // =====================================================================
  // ---- facteurs a·v + b : autant de coefficients négatifs que positifs ----
  // un facteur est décrit par {a, b, r} avec r = -b/a sa racine (entière)
  function tirerFacteurs(v, nb) {
    for (let essai = 0; essai < 60; essai++) {
      const racines = [];
      while (racines.length < nb) {
        const r = aleaNonNul(-8, 8);
        if (!racines.includes(r)) racines.push(r);
      }
      racines.sort((x, y) => x - y);
      // autant de coefficients directeurs négatifs que positifs : chaque facteur tire
      // son signe à pile ou face, aucun n'est forcé
      return racines.map(r => {
        const a = aleaParmi([1, 1, 2, 3, -1, -1, -2, -3]);
        return { a: a, b: -a * r, r: r };
      });
    }
    return null;
  }
  // écriture d'un facteur avec la variable choisie, en LaTeX puis en texte brut (pour le SVG)
  const facL = (f, v) => paren([[f.a, v], [f.b, '']]);
  const facTxt = (f, v) => poly([[f.a, v], [f.b, '']]).replace(/-/g, '−');
  // point de test de l'intervalle i : avant la première racine, entre deux racines, après la dernière
  const pointTest = (racines, i) =>
    i === 0 ? racines[0] - 1
      : i < racines.length ? (racines[i - 1] + racines[i]) / 2
        : racines[racines.length - 1] + 1;
  const signesFacteur = (f, racines) =>
    racines.concat([0]).map((_, i) => (f.a * pointTest(racines, i) + f.b > 0 ? '+' : '-'));
  const signesProduit = (facteurs, racines) =>
    racines.concat([0]).map((_, i) => {
      const x = pointTest(racines, i);
      return facteurs.reduce((p, f) => p * (f.a * x + f.b), 1) > 0 ? '+' : '-';
    });
  function tableSignesSVG(v, facteurs, racines, signesProduit, petit, detaille) {
    const lignes = [];
    if (detaille) {
      facteurs.forEach(f => lignes.push({
        label: facTxt(f, v),
        signes: signesFacteur(f, racines),
        zeros: racines.map(r => r === f.r)
      }));
    }
    lignes.push({ label: 'A(' + v + ')', signes: signesProduit, zeros: racines.map(() => true) });
    return O.graph.tableauSignes({ variable: v, racines: racines, lignes: lignes, petit: !!petit });
  }
  function signeProduit(niveau) {
    const v = varAlea();
    if (niveau === 3 && Math.random() < 0.4) return signeIntervalle(v, niveau);
    const nb = niveau === 3 ? 3 : 2;
    const facteurs = tirerFacteurs(v, nb);
    if (!facteurs) return null;
    const racines = facteurs.map(f => f.r);
    const e = facteurs.map(f => facL(f, v)).join('');
    const produit = signesProduit(facteurs, racines);
    const petit = nb === 3;
    const table = sg => tableSignesSVG(v, facteurs, racines, sg, petit, false);
    const bonne = optTxt(table(produit), produit.join(''));
    // erreurs types, par ordre de pertinence : le signe qu'on obtiendrait en ignorant les
    // coefficients négatifs (alternance à partir de « + »), l'inversion complète, puis
    // un changement de signe manquant à l'une des racines
    const alternance = racines.concat([0]).map((_, i) => (i % 2 === 0 ? '+' : '-'));
    const variantes = [alternance, produit.map(s => (s === '+' ? '-' : '+'))];
    for (let i = 0; i < produit.length; i++) {
      const w = produit.slice();
      w[i] = w[i] === '+' ? '-' : '+';
      variantes.push(w);
    }
    const uniq = [];
    for (const sg of variantes) {
      const cle = sg.join('');
      if (cle === produit.join('') || uniq.some(u => u.cle === cle)) continue;
      uniq.push(optTxt(table(sg), cle));
      if (uniq.length === 3) break;
    }
    const detail = facteurs.map(f => `${m(facL(f, v))} s'annule en ${m(String(f.r))} et est ${f.a > 0 ? 'négatif avant, positif après' : 'positif avant, négatif après'} (son coefficient ${m(String(f.a))} est ${f.a > 0 ? 'positif' : 'négatif'})`).join(' ; ');
    return qcm(`On considère la fonction ${m('A')} définie pour tout réel ${m(v)} par ${m('A(' + v + ') = ' + e)}.<br>Le tableau de signes de ${m('A(' + v + ')')} sur ${m('\\mathbb{R}')} est :`,
      bonne, uniq, {
      explication: `${detail}. En multipliant les signes ligne par ligne, on obtient :<div class="explication-figure">${tableSignesSVG(v, facteurs, racines, produit, false, true)}</div>`,
      optionsLarges: true
    });
  }
  // variante : intervalle sur lequel l'expression est négative / positive
  function signeIntervalle(v, niveau) {
    const facteurs = tirerFacteurs(v, niveau === 3 ? 3 : 2);
    if (!facteurs) return null;
    const racines = facteurs.map(f => f.r);
    const e = facteurs.map(f => facL(f, v)).join('');
    const sg = signesProduit(facteurs, racines);
    const signeSur = i => (sg[i] === '+' ? 1 : -1);
    const negatif = Math.random() < 0.5;
    const cible = negatif ? -1 : 1;
    // réunion des intervalles où le produit a le signe cherché
    const bornes = [MOINS_INF].concat(racines.map(String), [PLUS_INF]);
    const morceaux = [];
    for (let i = 0; i <= racines.length; i++) {
      if (signeSur(i) === cible) morceaux.push(inter(bornes[i], bornes[i + 1], true, true));
    }
    if (!morceaux.length) return null;
    const bonne = morceaux.join(' \\cup ');
    const autres = [];
    for (let i = 0; i <= racines.length; i++) {
      if (signeSur(i) !== cible) autres.push(inter(bornes[i], bornes[i + 1], true, true));
    }
    const cands = [
      autres.join(' \\cup '),
      morceaux[0],
      autres[0] || inter(MOINS_INF, bornes[1], true, true),
      inter(bornes[1], bornes[bornes.length - 2], true, true)
    ].filter(x => x && x !== bonne).map(x => opt(x));
    return qcm(`L’expression ${m(e)} est strictement ${negatif ? 'négative' : 'positive'} sur :`, opt(bonne), cands, {
      explication: `Les racines sont ${racines.map(r => m(String(r))).join(', ')}. En tenant compte du signe de chaque coefficient directeur, le produit est ${negatif ? 'négatif' : 'positif'} sur ${m(bonne)}.<div class="explication-figure">${tableSignesSVG(v, facteurs, racines, sg, false, true)}</div>`,
      optionsLarges: true
    });
  }

  // =====================================================================
  Automatismes.enregistrerBanque('equations', {
    titre: 'Équations et inéquations',
    familles: {
      'equation-1er-degre': famille({
        nom: 'équation du premier degré', niveaux: [1, 2, 3], base: equationPremierDegre,
        variantes3: [equationFractions], partBase3: 0.5, ordre: { 1: 1, 2: 1 }
      }),
      'produit-nul': famille({
        nom: 'équation produit nul', niveaux: [1, 2, 3], base: produitNul,
        variantes3: [quotientNul], partBase3: 0.55, ordre: { 1: 2, 2: 2 },
        quota: { 2: { min: 1, priorite: 2 } }
      }),
      'inequation': famille({
        nom: 'inéquation', niveaux: [1, 2, 3], base: inequation,
        variantes3: [inequationAvancee, inequationProduit], partBase3: 0.3, ordre: { 1: 3, 2: 3 }
      }),
      'carre-egal': famille({
        nom: 'équation du type x² = a', niveaux: [2, 3], base: carreEgal, ordre: { 2: 4 }, quota: { 2: { max: 1 }, 3: { max: 1 } }
      }),
      'isoler-variable': famille({
        nom: 'isoler une variable dans une formule', niveaux: [1, 2, 3], base: isolerVariable,
        ordre: { 1: 4, 2: 5 }, quota: { 1: { max: 1 }, 2: { min: 1, priorite: 3, max: 1 }, 3: { max: 1 } }
      }),
      'signe-produit': famille({
        nom: 'signe d’un produit', niveaux: [2, 3], base: signeProduit, ordre: { 2: 6 }, quota: { 2: { max: 1 }, 3: { max: 1 } }
      })
    }
  });
})();
