/* Banque 04 — Développer et factoriser
   Familles observées dans les sujets 2026 : développer une identité remarquable
   (Métropole : (3x−2)² ; Centres étrangers : (x³−1)² ; sujet zéro : (2x+0,5)²),
   développer et réduire (Amérique du Nord : (x+2)² − (1−x)²),
   factoriser une différence de carrés (Polynésie : 16x² − (x+1)²).

   Niveau 1 — les bases : (x+a)², (x+a)(x+b), facteur commun immédiat.
   Niveau 2 — l'épreuve : (ax+b)², (ax+b)(ax−b), (x+a)² − (b−x)²,
              factorisation par a²−b² et par trinôme carré parfait.
   Niveau 3 — bien plus difficile : carré d'une puissance, coefficients décimaux ou
              fractionnaires, deux variables, factorisation en deux étapes,
              (kx)² − (ax+b)², racines carrées.

   Conventions de rédaction reprises des cahiers de calcul :
   coefficient 1 ou −1 jamais écrit devant une lettre, aucun signe doublé,
   parenthèses simples pour un binôme court et \left(...\right) autour d'une fraction,
   virgule décimale échappée {,} en zone mathématique. */
(function () {
  'use strict';
  const O = Automatismes.outils;
  // la couche d'écriture algébrique (mono, poly, paren…) vit désormais dans le moteur,
  // partagée avec les autres banques de calcul littéral
  const { alea, aleaParmi, aleaNonNul, melanger, decL, fracL, m, qcm, famille,
    mono, poly, paren, coefParen, joindre, monoFrac, facteurRepete } = O;
  const opt = (aff, cle) => ({ affichage: m(aff), cle: cle === undefined ? aff : cle });

  // lettres variables, comme dans les cahiers de calcul (x, y, t, u, z, v)
  const VARS = ['x', 'x', 'x', 'y', 't', 'z', 'u', 'v'];
  const varAlea = () => aleaParmi(VARS);

  // trinôme du second degré a·v² + b·v + c
  const trinome = (a, b, c, v) => poly([[a, v + '^2'], [b, v], [c, '']]);
  // produit de deux binômes déjà écrits
  const produit = (p, q) => p + q;

  // =====================================================================
  // Famille A : développer une identité remarquable (a·v + b)²
  // =====================================================================
  function developperIdentite(niveau) {
    const v = varAlea();
    const a = niveau === 1 ? 1 : alea(2, 6);
    const b = aleaNonNul(-9, 9);
    const A = a * a, B = 2 * a * b, C = b * b;
    const e = paren([[a, v], [b, '']]) + '^2';
    const bonne = trinome(A, B, C, v);
    // erreurs types du sujet de Métropole : oubli du double produit, oubli du carré
    // sur le coefficient, « distribution » du carré
    const cands = [
      trinome(A, 0, C, v),          // 9x^2 + 4  : double produit oublié
      trinome(a, B, C, v),          // 3x^2 - 12x + 4 : coefficient non élevé au carré
      poly([[2 * a, v], [2 * b, '']]), // 6x - 4 : carré distribué comme un facteur
      trinome(A, a * b, C, v),      // double produit non doublé
      trinome(A, B, -C, v),
      trinome(A, -B, C, v)
    ].map(x => opt(x));
    return qcm(`La forme développée de ${m(e)} est :`, opt(bonne), cands, {
      explication: `${m('(a+b)^2 = a^2 + 2ab + b^2')} avec ${m('a = ' + mono(a, v))} et ${m('b = ' + mono(b, ''))} : ${m(e + ' = ' + trinome(A, 0, 0, v) + ' + 2 \\times ' + mono(a, v) + ' \\times ' + (b < 0 ? '(' + mono(b, '') + ')' : mono(b, '')) + ' + ' + mono(C, '') + ' = ' + bonne)}. Le double produit ne doit pas être oublié.`
    });
  }

  // N3-a : carré d'une puissance (Centres étrangers : (x³−1)²)
  function carrePuissance() {
    const v = varAlea();
    const n = alea(2, 5);
    const b = aleaNonNul(-4, 4);
    const B = 2 * b, C = b * b;
    const e = paren([[1, v + '^' + n], [b, '']]) + '^2';
    const bonne = poly([[1, v + '^{' + 2 * n + '}'], [B, v + '^' + n], [C, '']]);
    const cands = [
      poly([[1, v + '^{' + 2 * n + '}'], [C, '']]),
      poly([[1, v + '^{' + n * n + '}'], [B, v + '^' + n], [C, '']]),
      poly([[1, v + '^{' + 2 * n + '}'], [B, v + '^{' + 2 * n + '}'], [C, '']]),
      poly([[1, v + '^{' + 2 * n + '}'], [b, v + '^' + n], [C, '']]),
      poly([[2, v + '^' + n], [2 * b, '']])
    ].map(x => opt(x));
    return qcm(`La forme développée de ${m(e)} est :`, opt(bonne), cands, {
      explication: `${m('(a+b)^2 = a^2+2ab+b^2')} avec ${m('a = ' + v + '^' + n)} : ${m('\\left(' + v + '^' + n + '\\right)^2 = ' + v + '^{' + n + ' \\times 2} = ' + v + '^{' + 2 * n + '}')} (les exposants se multiplient), d'où ${m(e + ' = ' + bonne)}.`
    });
  }

  // N3-b : coefficient décimal (sujet zéro : (2x+0,5)²)
  function carreDecimal() {
    const v = varAlea();
    const a = alea(2, 5);
    const b = aleaParmi([0.5, 1.5, 2.5, 0.2, 0.1, 0.4, -0.5, -1.5, -0.2]);
    const A = a * a, B = O.arrondir(2 * a * b, 6), C = O.arrondir(b * b, 6);
    const e = paren([[a, v], [b, '']]) + '^2';
    const bonne = trinome(A, B, C, v);
    const cands = [
      trinome(A, O.arrondir(B / 2, 6), C, v),
      trinome(A, B, O.arrondir(Math.abs(b), 6), v),
      trinome(A, 0, C, v),
      trinome(A, B, O.arrondir(C * 10, 6), v),
      trinome(a, B, C, v)
    ].map(x => opt(x));
    return qcm(`La forme développée de ${m(e)} est :`, opt(bonne), cands, {
      explication: `Double produit : ${m('2 \\times ' + mono(a, v) + ' \\times ' + (b < 0 ? '(' + decL(b) + ')' : decL(b)) + ' = ' + mono(B, v))} ; carré du second terme : ${m(decL(b) + '^2 = ' + decL(C))}. D'où ${m(e + ' = ' + bonne)}.`
    });
  }

  // N3-c : deux variables
  function carreDeuxVariables() {
    // lettres rangées dans l'ordre alphabétique : le terme croisé s'écrit « ax », jamais « xa »
    const [v, w] = melanger(['x', 'y', 't', 'a', 'b']).slice(0, 2).sort();
    const a = alea(1, 5), b = aleaNonNul(-5, 5);
    const A = a * a, B = 2 * a * b, C = b * b;
    const e = paren([[a, v], [b, w]]) + '^2';
    const bonne = poly([[A, v + '^2'], [B, v + w], [C, w + '^2']]);
    const cands = [
      poly([[A, v + '^2'], [C, w + '^2']]),
      poly([[A, v + '^2'], [B, v + w], [-C, w + '^2']]),
      poly([[A, v + '^2'], [a * b, v + w], [C, w + '^2']]),
      poly([[A, v + '^2'], [B, v + '^2' + w + '^2'], [C, w + '^2']]),
      poly([[a, v + '^2'], [B, v + w], [C, w + '^2']])
    ].map(x => opt(x));
    return qcm(`La forme développée de ${m(e)} est :`, opt(bonne), cands, {
      explication: `${m('(a+b)^2 = a^2+2ab+b^2')} avec ${m('a = ' + mono(a, v))} et ${m('b = ' + mono(b, w))} : le double produit vaut ${m(mono(B, v + w))}, d'où ${m(e + ' = ' + bonne)}.`
    });
  }

  // =====================================================================
  // Famille B : développer et réduire un produit
  // =====================================================================
  function developperProduit(niveau) {
    const v = varAlea();
    if (niveau >= 2 && Math.random() < 0.4) {
      // (a·v + b)(a·v − b) : différence de deux carrés
      const a = alea(2, 6), b = alea(2, 9);
      const e = produit(paren([[a, v], [b, '']]), paren([[a, v], [-b, '']]));
      const bonne = poly([[a * a, v + '^2'], [-b * b, '']]);
      const cands = [
        poly([[a * a, v + '^2'], [b * b, '']]),
        trinome(a * a, -2 * a * b, -b * b, v),
        poly([[a * a, v + '^2'], [-b, '']]),
        poly([[a, v + '^2'], [-b * b, '']]),
        trinome(a * a, 2 * a * b, -b * b, v)
      ].map(x => opt(x));
      return qcm(`La forme développée et réduite de ${m(e)} est :`, opt(bonne), cands, {
        explication: `${m('(a+b)(a-b) = a^2 - b^2')} : ${m(e + ' = ' + poly([[a * a, v + '^2'], [0, '']]) + ' - ' + (b * b) + ' = ' + bonne)}. Les termes en ${m(v)} se compensent, il n'y a pas de double produit.`
      });
    }
    const a = niveau === 1 ? 1 : alea(1, 4);
    const c = niveau === 1 ? 1 : alea(1, 4);
    const b = aleaNonNul(-9, 9), d = aleaNonNul(-9, 9);
    if (a === c && b === d) return null;   // (x+2)(x+2) s'écrit (x+2)^2
    const A = a * c, B = a * d + b * c, C = b * d;
    const e = produit(paren([[a, v], [b, '']]), paren([[c, v], [d, '']]));
    const bonne = trinome(A, B, C, v);
    const cands = [
      trinome(A, 0, C, v),              // seuls les « extrêmes » multipliés
      trinome(A, b + d, C, v),
      trinome(A, B, -C, v),
      trinome(A, a * d, C, v),
      trinome(A, b * c, C, v),
      poly([[A, v + '^2'], [C, '']])
    ].map(x => opt(x));
    return qcm(`La forme développée et réduite de ${m(e)} est :`, opt(bonne), cands, {
      explication: `On développe les quatre produits : ${m(poly([[a * c, v + '^2'], [a * d, v], [b * c, v], [b * d, '']]))}, puis on réduit les termes en ${m(v)} : ${m(poly([[a * d, v], [b * c, v]]) + ' = ' + mono(B, v))}. D'où ${m(bonne)}.`
    });
  }

  // N3-a : différence de deux carrés développée (Amérique du Nord : (x+2)² − (1−x)²)
  function differenceDeCarres() {
    const v = varAlea();
    const a = aleaNonNul(-6, 6), b = aleaNonNul(-6, 6);
    // (v + a)^2 - (b - v)^2 = (2a + 2b)v + (a^2 - b^2)
    const B = 2 * a + 2 * b, C = a * a - b * b;
    if (B === 0 && C === 0) return null;
    const e = paren([[1, v], [a, '']]) + '^2 - ' + paren([[b, ''], [-1, v]]) + '^2';
    const bonne = poly([[B, v], [C, '']]);
    const cands = [
      poly([[2, v + '^2'], [B, v], [C, '']]),
      poly([[B, v], [-C, '']]),
      poly([[2 * a - 2 * b, v], [C, '']]),
      poly([[B / 2, v], [C, '']]),
      poly([[B, v], [a * a + b * b, '']])
    ].filter(x => x !== bonne).map(x => opt(x));
    return qcm(`La forme développée et réduite de ${m(e)} est :`, opt(bonne), cands, {
      explication: `${m(paren([[1, v], [a, '']]) + '^2 = ' + trinome(1, 2 * a, a * a, v))} et ${m(paren([[b, ''], [-1, v]]) + '^2 = ' + trinome(1, -2 * b, b * b, v))}. En soustrayant, les termes en ${m(v + '^2')} disparaissent : ${m(bonne)}. Attention au signe de chaque terme de la seconde parenthèse.`
    });
  }

  // N3-b : produit moins un carré
  function produitMoinsCarre() {
    const v = varAlea();
    const a = aleaNonNul(-6, 6), b = aleaNonNul(-6, 6), c = aleaNonNul(-6, 6);
    if (a === b) return null;   // (v+4)(v+4) s'écrit (v+4)^2
    // (v+a)(v+b) - (v+c)^2 = (a + b - 2c)v + (ab - c^2)
    const B = a + b - 2 * c, C = a * b - c * c;
    if (B === 0 && C === 0) return null;
    const e = produit(paren([[1, v], [a, '']]), paren([[1, v], [b, '']])) + ' - ' + paren([[1, v], [c, '']]) + '^2';
    const bonne = poly([[B, v], [C, '']]);
    const cands = [
      poly([[2, v + '^2'], [B, v], [C, '']]),
      poly([[a + b - c, v], [C, '']]),
      poly([[B, v], [a * b + c * c, '']]),
      poly([[B, v], [-C, '']]),
      poly([[a + b - 2 * c, v], [a * b - c, '']])
    ].filter(x => x !== bonne).map(x => opt(x));
    return qcm(`La forme développée et réduite de ${m(e)} est :`, opt(bonne), cands, {
      explication: `${m(produit(paren([[1, v], [a, '']]), paren([[1, v], [b, '']])) + ' = ' + trinome(1, a + b, a * b, v))} et ${m(paren([[1, v], [c, '']]) + '^2 = ' + trinome(1, 2 * c, c * c, v))}. La soustraction élimine les ${m(v + '^2')} : ${m(bonne)}.`
    });
  }

  // =====================================================================
  // Famille C : factoriser par un facteur commun
  // =====================================================================
  function factoriserCommun(niveau) {
    const v = varAlea();
    if (niveau === 1) {
      const type = aleaParmi(['nombre', 'variable']);
      if (type === 'nombre') {
        const k = alea(2, 9), p = aleaNonNul(-9, 9), q = aleaNonNul(-9, 9);
        if (O.pgcd(p, q) > 1) return null;   // le facteur commun doit être exactement k
        const e = poly([[k * p, v], [k * q, '']]);
        const bonne = mono(k, '') + paren([[p, v], [q, '']]);
        const cands = [
          mono(k, '') + paren([[p, v], [k * q, '']]),
          mono(k, '') + paren([[k * p, v], [q, '']]),
          mono(k * k, '') + paren([[p, v], [q, '']]),
          mono(k, '') + paren([[p, v], [-q, '']])
        ].filter(x => x !== bonne).map(x => opt(x));
        return qcm(`La forme factorisée de ${m(e)} est :`, opt(bonne), cands, {
          explication: `${m(String(k))} est facteur commun aux deux termes : ${m(mono(k * p, v) + ' = ' + k + ' \\times ' + mono(p, v))} et ${m(mono(k * q, '') + ' = ' + k + ' \\times ' + (q < 0 ? '(' + q + ')' : q))}, donc ${m(e + ' = ' + bonne)}.`
        });
      }
      const p = alea(1, 6), q = aleaNonNul(-9, 9);
      // sans cette garde, x(6x-2) serait donné comme réponse alors que la factorisation
      // complète est 2x(3x-1) : le facteur commun doit être exactement v
      if (O.pgcd(p, q) > 1) return null;
      const e = poly([[p, v + '^2'], [q, v]]);
      const bonne = v + paren([[p, v], [q, '']]);
      const cands = [
        v + paren([[p, v + '^2'], [q, '']]),
        v + '^2' + paren([[p, ''], [q, '']]),
        mono(p, v) + paren([[1, v], [q, '']]),
        v + paren([[p, v], [-q, '']])
      ].filter(x => x !== bonne).map(x => opt(x));
      return qcm(`La forme factorisée de ${m(e)} est :`, opt(bonne), cands, {
        explication: `${m(v)} est facteur commun : ${m(mono(p, v + '^2') + ' = ' + v + ' \\times ' + mono(p, v))} et ${m(mono(q, v) + ' = ' + v + ' \\times ' + (q < 0 ? '(' + q + ')' : q))}, donc ${m(e + ' = ' + bonne)}.`
      });
    }
    // N2 : parenthèse en facteur commun
    const a = aleaNonNul(-6, 6), p = alea(2, 6), q = aleaNonNul(-9, 9);
    // le second facteur doit être irréductible : sinon (t+1)(4t-8) au lieu de 4(t+1)(t-2)
    if (O.pgcd(p, q) > 1) return null;
    const B = paren([[1, v], [a, '']]);
    const e = joindre(mono(p, v) + B, coefParen(q, B));
    const bonne = B + paren([[p, v], [q, '']]);
    const cands = [
      B + paren([[p, v], [-q, '']]),
      B + mono(p + q, v),
      paren([[p, v], [q, '']]),
      mono(p, v) + paren([[1, v], [a + q, '']]),
      B + '^2' + paren([[p, v], [q, '']])
    ].filter(x => x !== bonne).map(x => opt(x));
    return qcm(`La forme factorisée de ${m(e)} est :`, opt(bonne), cands, {
      explication: `${m(B)} est facteur commun aux deux termes : ${m(e + ' = ' + bonne)}. On met la parenthèse en facteur et on additionne ce qui la multiplie.`
    });
  }

  // N3 : facteur commun à faire apparaître (deux parenthèses distinctes)
  function factoriserCommunAvance() {
    const v = varAlea();
    const a = aleaNonNul(-6, 6), b = aleaNonNul(-6, 6), c = aleaNonNul(-6, 6);
    // b = c donnerait deux facteurs identiques, a = b ou a = c ferait écrire (x+2)(x+2)
    // là où un manuel écrirait (x+2)^2
    if (b === c || a === b || a === c) return null;
    // b + c impair : sinon (t-1)(2t-10) au lieu de la factorisation complète 2(t-1)(t-5)
    if ((b + c) % 2 === 0) return null;
    const B = paren([[1, v], [a, '']]);
    const e = B + paren([[1, v], [b, '']]) + ' + ' + B + paren([[1, v], [c, '']]);
    const bonne = B + paren([[2, v], [b + c, '']]);
    const cands = [
      B + paren([[1, v], [b + c, '']]),
      B + paren([[2, v], [b * c, '']]),
      B + '^2' + paren([[2, v], [b + c, '']]),
      paren([[2, v], [b + c, '']]),
      B + paren([[2, v], [b - c, '']])
    ].filter(x => x !== bonne && !facteurRepete(x)).map(x => opt(x));
    return qcm(`La forme factorisée de ${m(e)} est :`, opt(bonne), cands, {
      explication: `${m(B)} est facteur commun : ${m(e + ' = ' + B + '\\left[' + poly([[1, v], [b, '']]) + ' + ' + poly([[1, v], [c, '']]) + '\\right] = ' + bonne)}.`
    });
  }

  // =====================================================================
  // Famille D : factoriser à l'aide d'une identité remarquable (niveaux 2 et 3)
  // =====================================================================
  function factoriserIdentite(niveau) {
    const v = varAlea();
    const type = niveau === 2 ? aleaParmi(['difference', 'difference', 'carre-parfait']) : aleaParmi(['difference', 'carre-parfait']);
    if (type === 'difference') {
      const a = alea(1, 6), b = alea(2, 9);
      // a et b premiers entre eux : sinon 4z^2-36 se factoriserait plus complètement
      // en 4(z-3)(z+3) que par la seule identité (2z-6)(2z+6)
      if (O.pgcd(a, b) > 1) return null;
      const e = poly([[a * a, v + '^2'], [-b * b, '']]);
      const bonne = paren([[a, v], [-b, '']]) + paren([[a, v], [b, '']]);
      const cands = [
        paren([[a, v], [-b, '']]) + '^2',
        paren([[a, v], [-b * b, '']]) + paren([[a, v], [b * b, '']]),
        paren([[a * a, v], [-b, '']]) + paren([[a * a, v], [b, '']]),
        paren([[a, v], [b, '']]) + '^2',
        paren([[a, v], [-b, '']]) + paren([[a, v], [-b, '']])
      ].filter(x => x !== bonne).map(x => opt(x));
      const carreA = a === 1 ? '' : `${m(mono(a * a, v + '^2') + ' = (' + mono(a, v) + ')^2')} et `;
      return qcm(`La forme factorisée de ${m(e)} est :`, opt(bonne), cands, {
        explication: `${carreA}${m(String(b * b) + ' = ' + b + '^2')}. On applique ${m('a^2 - b^2 = (a-b)(a+b)')} avec ${m('a = ' + mono(a, v))} et ${m('b = ' + b)} : ${m(e + ' = ' + bonne)}.`
      });
    }
    const a = alea(1, 5), b = aleaNonNul(-9, 9);
    if (O.pgcd(a, b) > 1) return null;   // 4x^2+16x+16 vaudrait mieux écrit 4(x+2)^2
    const e = trinome(a * a, 2 * a * b, b * b, v);
    const bonne = paren([[a, v], [b, '']]) + '^2';
    const cands = [
      paren([[a, v], [-b, '']]) + '^2',
      paren([[a, v], [b, '']]) + paren([[a, v], [-b, '']]),
      paren([[a * a, v], [b * b, '']]) + '^2',
      paren([[a, v], [2 * b, '']]) + '^2',
      paren([[a, v], [b, '']])
    ].filter(x => x !== bonne).map(x => opt(x));
    return qcm(`La forme factorisée de ${m(e)} est :`, opt(bonne), cands, {
      explication: `On reconnaît ${m('a^2 + 2ab + b^2 = (a+b)^2')} avec ${m('a = ' + mono(a, v))} et ${m('b = ' + mono(b, ''))} : le double produit ${m(mono(2 * a * b, v))} confirme l'identité, donc ${m(e + ' = ' + bonne)}.`
    });
  }

  // N3-a : (k·v)² − (a·v + b)²  (Polynésie : 16x² − (x+1)²)
  function differenceCarresBinome() {
    const v = varAlea();
    const k = alea(2, 6), a = alea(1, 3), b = aleaNonNul(-6, 6);
    // k > a garde un premier facteur de coefficient positif — (-x-5)(5x+5) s'écrirait
    // plus proprement -5(x+5)(x+1) ; les pgcd assurent des facteurs irréductibles
    if (k <= a) return null;
    if (O.pgcd(k - a, b) > 1 || O.pgcd(k + a, b) > 1) return null;
    // (kv)^2 - (av+b)^2 = ((k-a)v - b)((k+a)v + b)
    const e = poly([[k * k, v + '^2'], [0, '']]) + ' - ' + paren([[a, v], [b, '']]) + '^2';
    const bonne = paren([[k - a, v], [-b, '']]) + paren([[k + a, v], [b, '']]);
    const cands = [
      paren([[k - a, v], [b, '']]) + paren([[k + a, v], [-b, '']]),
      paren([[k, v], [-b, '']]) + paren([[k, v], [b, '']]),
      paren([[k - a, v], [-b, '']]) + '^2',
      paren([[k * k - a, v], [-b, '']]) + paren([[k * k + a, v], [b, '']]),
      paren([[k + a, v], [b, '']]) + '^2'
    ].filter(x => x !== bonne).map(x => opt(x));
    return qcm(`La forme factorisée de ${m(e)} est :`, opt(bonne), cands, {
      explication: `${m(mono(k * k, v + '^2') + ' = ' + '(' + mono(k, v) + ')^2')}, donc c'est ${m('A^2 - B^2')} avec ${m('A = ' + mono(k, v))} et ${m('B = ' + poly([[a, v], [b, '']]))} : ${m('A - B = ' + poly([[k - a, v], [-b, '']]))} et ${m('A + B = ' + poly([[k + a, v], [b, '']]))}, d'où ${m(bonne)}.`
    });
  }

  // N3-b : différence de deux carrés avec une racine  (v² − k, k non carré parfait)
  function differenceRacine() {
    const v = varAlea();
    const k = aleaParmi([2, 3, 5, 6, 7, 10, 11, 13, 15]);
    const e = poly([[1, v + '^2'], [-k, '']]);
    const bonne = '(' + v + ' - \\sqrt{' + k + '})(' + v + ' + \\sqrt{' + k + '})';
    const cands = [
      '(' + v + ' - ' + k + ')(' + v + ' + ' + k + ')',
      '(' + v + ' - \\sqrt{' + k + '})^2',
      '(' + v + ' + \\sqrt{' + k + '})^2',
      '(' + v + ' - \\sqrt{' + k + '})(' + v + ' - \\sqrt{' + k + '})',
      '\\left(' + v + ' - \\dfrac{' + k + '}{2}\\right)\\left(' + v + ' + \\dfrac{' + k + '}{2}\\right)'
    ].map(x => opt(x));
    return qcm(`Dans ${m('\\mathbb{R}')}, la forme factorisée de ${m(e)} est :`, opt(bonne), cands, {
      explication: `${m(String(k))} n'est pas un carré parfait, mais ${m(k + ' = \\left(\\sqrt{' + k + '}\\right)^2')}. On applique ${m('a^2 - b^2 = (a-b)(a+b)')} avec ${m('b = \\sqrt{' + k + '}')} : ${m(e + ' = ' + bonne)}.`
    });
  }

  // N3-c : coefficient fractionnaire — la fraction est parenthésée devant la lettre
  // (règle des cahiers : « (5/2)x », jamais « 5/2x », ambigu une fois rendu)
  function carreFraction() {
    const v = varAlea();
    const [n, d] = aleaParmi([[1, 2], [1, 3], [2, 3], [3, 2], [1, 4], [3, 4], [5, 2], [2, 5], [5, 3]]);
    const b = aleaNonNul(-5, 5);
    const fr = fracL(n, d);
    const e = '\\left(' + joindre(monoFrac(n, d, v), String(b)) + '\\right)^2';
    // (n/d·v + b)^2 = (n²/d²)v² + (2nb/d)v + b²
    const carre = monoFrac(n * n, d * d, v + '^2');
    const dbl = monoFrac(2 * n * b, d, v);
    const bonne = joindre(joindre(carre, dbl), String(b * b));
    const cands = [
      joindre(carre, String(b * b)),                                    // double produit oublié
      joindre(joindre(monoFrac(n, d, v + '^2'), dbl), String(b * b)),   // coefficient non élevé au carré
      joindre(joindre(carre, monoFrac(n * b, d, v)), String(b * b)),    // double produit non doublé
      joindre(joindre(carre, dbl), String(-b * b))
    ].filter(x => x !== bonne).map(x => opt(x));
    return qcm(`La forme développée de ${m(e)} est :`, opt(bonne), cands, {
      explication: `${m('\\left(' + fr + '\\right)^2 = ' + fracL(n * n, d * d))} et le double produit vaut ${m('2 \\times ' + fr + ' \\times ' + (b < 0 ? '(' + b + ')' : b) + ' = ' + fracL(2 * n * b, d))}, d'où ${m(bonne)}.`
    });
  }

  // =====================================================================
  Automatismes.enregistrerBanque('developper-factoriser', {
    titre: 'Développer et factoriser',
    familles: {
      'developper-identite': famille({
        nom: 'développer une identité remarquable', niveaux: [1, 2, 3], base: developperIdentite,
        variantes3: [carrePuissance, carreDecimal, carreDeuxVariables, carreFraction],
        ordre: { 1: 1, 2: 1 }, quota: { 1: { min: 1 }, 2: { min: 1, priorite: 3 }, 3: { min: 1 } }
      }),
      'developper-produit': famille({
        nom: 'développer et réduire', niveaux: [1, 2, 3], base: developperProduit,
        variantes3: [differenceDeCarres, produitMoinsCarre], partBase3: 0.3, ordre: { 1: 2, 2: 2 }
      }),
      'factoriser-commun': famille({
        nom: 'factoriser (facteur commun)', niveaux: [1, 2, 3], base: factoriserCommun,
        variantes3: [factoriserCommunAvance], partBase3: 0.4, ordre: { 1: 3, 2: 3 }
      }),
      'factoriser-identite': famille({
        nom: 'factoriser (identité remarquable)', niveaux: [2, 3], base: factoriserIdentite,
        variantes3: [differenceCarresBinome, differenceRacine], partBase3: 0.3,
        ordre: { 2: 4 }, quota: { 2: { min: 1, priorite: 2 }, 3: { min: 1 } }
      })
    }
  });
})();
