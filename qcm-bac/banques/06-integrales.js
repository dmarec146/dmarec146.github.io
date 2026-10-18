/* Banque 06 — Calcul intégral (Terminale spécialité)
   Questions à quatre choix inspirées des QCM et des affirmations de bac 2022 à 2026 : intégrale par primitive ou intégration
   par parties (`∫ x e^x`, `∫ ln x`, `∫ sin x`), linéarité, relation de Chasles, positivité et intégration des inégalités,
   valeur moyenne, aire entre deux courbes, suite d'intégrales (`I_n = ∫ x^n e^x`, `∫ e^{-nx} sin x`), dérivée d'une fonction
   définie par une intégrale. Voir outils/qcm-bac/types-de-questions-2022-2023.md.

   Niveau 1 — les bases : intégrale d'un polynôme, de `1/x`, de `e^x`, Chasles, valeur moyenne simple.
   Niveau 2 — l'épreuve : intégrales de `sin` et `cos`, de `u'e^u` et `u'/u`, linéarité, encadrement, aire, dérivée de `∫_a^x`.
   Niveau 3 — plus difficile (pénalités) : intégration par parties, suites d'intégrales, aire entre deux courbes avec unité,
              intégrale à borne variable, affirmations sur les propriétés.

   Les valeurs exactes sont écrites par un petit module de sommes `a·e + b·π + c…` (texte et valeur numérique produits ensemble).
   Le contrôle (outils/qcm-bac/controle-banques.js) relit l'intégrande et les bornes dans le LaTeX affiché, calcule l'intégrale
   NUMÉRIQUEMENT (méthode de Simpson) et la compare à la valeur lue dans chaque option : il ne se fie jamais à la valeur exacte
   écrite par le générateur. */
(function () {
  'use strict';
  const O = Automatismes.outils;
  const { alea, aleaParmi, melanger, pgcd, m, qcm, famille, fracL, poly } = O;
  const T = String.raw;

  const texOpt = tex => ({ affichage: m(tex), cle: tex });
  // e^{1} s'écrit e (énoncé, options, explication, meta)
  const epure = q => { if (!q) return q; const r = t => (typeof t === 'string' ? t.replace(/e\^\{1\}/g, 'e') : t); q.enonce = r(q.enonce); q.explication = r(q.explication); q.options.forEach(o => { o.affichage = r(o.affichage); o.cle = r(o.cle); }); if (q.meta) for (const k of Object.keys(q.meta)) q.meta[k] = r(q.meta[k]); return q; };
  const retente = gen => niveau => { for (let i = 0; i < 12; i++) { const q = gen(niveau); if (q) return q; } return null; };
  const P = (...termes) => poly(termes).replace(/ ([+-]) /g, '$1');
  const coef = c => (c === 1 ? '' : c === -1 ? '-' : String(c));
  const xp = k => (k === 1 ? 'x' : `x^{${k}}`);
  const fr = (a, b) => T`\dfrac{${a}}{${b}}`;
  const sgn = n => (n < 0 ? '-' : '+') + Math.abs(n);

  // ---------- sommes exactes : [numérateur, dénominateur, base] ----------
  const BASE = { '1': 1, e: Math.E, e2: Math.E * Math.E, e3: Math.pow(Math.E, 3), ie: 1 / Math.E, pi: Math.PI, pi2: Math.PI * Math.PI, ln2: Math.log(2), ln3: Math.log(3), ln5: Math.log(5), s3: Math.sqrt(3), s2: Math.SQRT2 };
  const SYM = { e: 'e', e2: 'e^2', e3: 'e^3', pi: T`\pi`, pi2: T`\pi^2`, ln2: T`\ln 2`, ln3: T`\ln 3`, ln5: T`\ln 5`, s3: T`\sqrt{3}`, s2: T`\sqrt{2}` };
  const ORDRE = ['pi2', 'pi', 'e3', 'e2', 'e', 'ln5', 'ln3', 'ln2', 's3', 's2', 'ie', '1'];
  const red = (n, d) => { const g = pgcd(n, d); if (d < 0) { n = -n; d = -d; } return [n / g, d / g]; };
  function normaliser(Ts) {                                  // fusionne les bases identiques, retire les termes nuls
    const acc = {};
    for (const [n, d, b] of Ts) { const c = acc[b] || [0, 1]; const [x, y] = red(c[0] * d + n * c[1], c[1] * d); acc[b] = [x, y]; }
    return ORDRE.filter(b => acc[b] && acc[b][0] !== 0).map(b => [acc[b][0], acc[b][1], b]);
  }
  const valeur = Ts => Ts.reduce((a, [n, d, b]) => a + (n / d) * BASE[b], 0);
  function termeTex(n, d, b) {
    const an = Math.abs(n);
    if (b === '1') return d === 1 ? String(an) : fr(String(an), String(d));
    if (b === 'ie') return fr(String(an), d === 1 ? 'e' : `${d}e`);
    const c = an === 1 ? '' : String(an);
    return d === 1 ? `${c}${SYM[b]}` : fr(`${c}${SYM[b]}`, String(d));
  }
  function exprTex(Ts) {
    let L = normaliser(Ts);
    if (!L.length) return '0';
    if (L[0][0] < 0) { const i = L.findIndex(t => t[0] > 0); if (i > 0) { const [t] = L.splice(i, 1); L.unshift(t); } }     // « e-2 », « 1-… », pas « -2+e »
    return L.map(([n, d, b], i) => (n < 0 ? '-' : (i ? '+' : '')) + termeTex(n, d, b)).join('');
  }
  const fois = (Ts, c, dd) => Ts.map(([n, d, b]) => [...red(n * c, d * (dd || 1)), b]);
  // variantes plausibles d'une valeur exacte (erreurs de signe, de terme oublié, de coefficient)
  function autres(Ts) {
    const N = normaliser(Ts), v = valeur(N), res = [];
    res.push(fois(N, -1));
    if (N.length > 1) { res.push(N.slice(1)); res.push(N.slice(0, -1)); }
    N.forEach((t, i) => {
      res.push(N.map((u, j) => (j === i ? [u[0] + 1, u[1], u[2]] : u)));
      res.push(N.map((u, j) => (j === i ? [u[0] - 1, u[1], u[2]] : u)));
      res.push(N.map((u, j) => (j === i ? [-u[0], u[1], u[2]] : u)));
      res.push(N.map((u, j) => (j === i ? [u[0] * 2, u[1], u[2]] : u)));
    });
    res.push(N.concat([[1, 1, '1']])); res.push(N.concat([[-1, 1, '1']]));
    res.push(fois(N, 2)); res.push(fois(N, 1, 2));
    const vus = new Set([exprTex(N)]), sortie = [];
    for (const c of melanger(res)) {
      const t = exprTex(c), w = valeur(normaliser(c));
      if (!t || t === '0' || vus.has(t) || !Number.isFinite(w) || Math.abs(w - v) < 1e-9) continue;
      vus.add(t); sortie.push(t);
    }
    return sortie;
  }
  const bornes = (a, b) => ({ a, b });
  const intg = (a, b, f) => T`\displaystyle\int_{${a}}^{${b}} ${f}\,\mathrm{d}x`;

  // ==========================================================================
  // 1. Calcul d'intégrales (primitive, intégration par parties)
  // ==========================================================================
  // un modèle : { f, a: {t, v}, b: {t, v}, Tt: somme exacte, expl }
  const cote = (aire) => aire;
  const TABLE_TRIG = [        // ∫ sin ou cos sur un intervalle : valeur exacte pour le coefficient 1
    { fn: 'sin', a: ['0', 0], b: [T`\pi`, Math.PI], Tt: [[2, 1, '1']], prim: T`-\cos x`, ex: T`\left[-\cos x\right]_0^{\pi}=1+1=2` },
    { fn: 'sin', a: ['0', 0], b: [fr('\\pi', '2'), Math.PI / 2], Tt: [[1, 1, '1']], prim: T`-\cos x`, ex: T`\left[-\cos x\right]_0^{\pi/2}=0+1=1` },
    { fn: 'sin', a: [fr('\\pi', '2'), Math.PI / 2], b: [T`\pi`, Math.PI], Tt: [[1, 1, '1']], prim: T`-\cos x`, ex: T`\left[-\cos x\right]_{\pi/2}^{\pi}=1-0=1` },
    { fn: 'sin', a: ['0', 0], b: [fr('\\pi', '3'), Math.PI / 3], Tt: [[1, 2, '1']], prim: T`-\cos x`, ex: T`\left[-\cos x\right]_0^{\pi/3}=-\dfrac{1}{2}+1=\dfrac{1}{2}` },
    { fn: 'sin', a: [fr('\\pi', '3'), Math.PI / 3], b: [T`\pi`, Math.PI], Tt: [[3, 2, '1']], prim: T`-\cos x`, ex: T`\left[-\cos x\right]_{\pi/3}^{\pi}=1+\dfrac{1}{2}=\dfrac{3}{2}` },
    { fn: 'sin', a: ['0', 0], b: [fr('\\pi', '6'), Math.PI / 6], Tt: [[1, 1, '1'], [-1, 2, 's3']], prim: T`-\cos x`, ex: T`\left[-\cos x\right]_0^{\pi/6}=-\dfrac{\sqrt{3}}{2}+1` },
    { fn: 'cos', a: ['0', 0], b: [fr('\\pi', '2'), Math.PI / 2], Tt: [[1, 1, '1']], prim: T`\sin x`, ex: T`\left[\sin x\right]_0^{\pi/2}=1-0=1` },
    { fn: 'cos', a: ['0', 0], b: [fr('\\pi', '6'), Math.PI / 6], Tt: [[1, 2, '1']], prim: T`\sin x`, ex: T`\left[\sin x\right]_0^{\pi/6}=\dfrac{1}{2}` },
    { fn: 'cos', a: ['0', 0], b: [fr('\\pi', '3'), Math.PI / 3], Tt: [[1, 2, 's3']], prim: T`\sin x`, ex: T`\left[\sin x\right]_0^{\pi/3}=\dfrac{\sqrt{3}}{2}` },
    { fn: 'cos', a: [fr('\\pi', '6'), Math.PI / 6], b: [fr('\\pi', '2'), Math.PI / 2], Tt: [[1, 2, '1']], prim: T`\sin x`, ex: T`\left[\sin x\right]_{\pi/6}^{\pi/2}=1-\dfrac{1}{2}=\dfrac{1}{2}` },
    { fn: 'cos', a: [fr('\\pi', '2'), Math.PI / 2], b: [T`\pi`, Math.PI], Tt: [[-1, 1, '1']], prim: T`\sin x`, ex: T`\left[\sin x\right]_{\pi/2}^{\pi}=0-1=-1` },
    { fn: 'cos', a: [T`-\dfrac{\pi}{2}`, -Math.PI / 2], b: [fr('\\pi', '2'), Math.PI / 2], Tt: [[2, 1, '1']], prim: T`\sin x`, ex: T`\left[\sin x\right]_{-\pi/2}^{\pi/2}=1+1=2` },
    { fn: 'cos', a: ['0', 0], b: [fr('\\pi', '4'), Math.PI / 4], Tt: [[1, 2, 's2']], prim: T`\sin x`, ex: T`\left[\sin x\right]_0^{\pi/4}=\dfrac{\sqrt{2}}{2}` }
  ];
  const MODELES_CALCUL = {
    1: [
      () => {                                   // px + q
        const a = alea(0, 3), b = a + alea(1, 3), p = aleaParmi([1, 2, 3, 4, -1, -2]), q = aleaParmi([-3, -2, -1, 1, 2, 3, 5]);
        return { f: `(${P([p, 'x'], [q, ''])})`, a: [String(a), a], b: [String(b), b], Tt: [[p * (b * b - a * a) + 2 * q * (b - a), 2, '1']],
          expl: `Une primitive de ${m(P([p, 'x'], [q, '']))} est ${m(`${p === 1 ? '' : coefFr(p, 2)}x^2${sgn(q)}x`.replace('\\dfrac{2}{2}', ''))} ; on calcule ${m(T`F(${b})-F(${a})`)}.` };
      },
      () => {                                   // c x^n
        const n = aleaParmi([2, 3]), c = aleaParmi([1, 2, 3, 4, 6]), a = alea(0, 2), b = a + alea(1, 3);
        return { f: `${coef(c)}${xp(n)}`, a: [String(a), a], b: [String(b), b], Tt: [[c * (Math.pow(b, n + 1) - Math.pow(a, n + 1)), n + 1, '1']],
          expl: `Une primitive de ${m(`${coef(c)}${xp(n)}`)} est ${m(`${c === 1 ? '' : fr(String(c), String(n + 1))}${xp(n + 1)}`.replace(/^$/, xp(n + 1)))}.` };
      },
      () => {                                   // c / x entre 1 et e^k
        const c = aleaParmi([1, 2, 3, 4, 5]), k = aleaParmi([1, 2, 3]);
        return { f: fr(String(c), 'x'), a: ['1', 1], b: [k === 1 ? 'e' : `e^{${k}}`, Math.exp(k)], Tt: [[c * k, 1, '1']],
          expl: `Une primitive de ${m(fr(String(c), 'x'))} sur ${m(T`\left]0\,;+\infty\right[`)} est ${m(`${coef(c)}\\ln x`)} : ${m(`${c}\\left(\\ln ${k === 1 ? 'e' : `e^{${k}}`}-\\ln 1\\right)=${c * k}`)}.` };
      },
      () => {                                   // a e^x entre 0 et 1, ou e^x entre 0 et ln k
        if (Math.random() < 0.5) { const a = aleaParmi([1, 2, 3, 4, 5]);
          return { f: `${coef(a)}e^{x}`, a: ['0', 0], b: ['1', 1], Tt: [[a, 1, 'e'], [-a, 1, '1']], expl: `Une primitive de ${m(`${coef(a)}e^{x}`)} est elle-même : ${m(`${coef(a)}\\left(e^{1}-e^{0}\\right)`.replace('e^{1}', 'e'))}.` }; }
        const k = aleaParmi([2, 3, 4, 5, 6]);
        return { f: 'e^{x}', a: ['0', 0], b: [T`\ln ${k}`, Math.log(k)], Tt: [[k - 1, 1, '1']], expl: `${m(T`\left[e^{x}\right]_0^{\ln ${k}}=e^{\ln ${k}}-e^{0}=${k}-1=${k - 1}`)}.` };
      },
      () => {                                   // e^{kx} entre 0 et 1
        const k = aleaParmi([2, 3]);
        return { f: `e^{${k}x}`, a: ['0', 0], b: ['1', 1], Tt: [[1, k, 'e' + k], [-1, k, '1']], expl: `Une primitive de ${m(`e^{${k}x}`)} est ${m(fr(`e^{${k}x}`, String(k)))} : ${m(`\\dfrac{e^{${k}}-1}{${k}}`)}.` };
      }
    ],
    2: [
      () => {                                   // sin / cos
        const t = aleaParmi(TABLE_TRIG), c = aleaParmi([1, 1, 2, 3, -1, 4]);
        const cc = t.Tt.some(x => x[2] !== '1') && c !== 1 ? 1 : c;
        const primC = t.fn === 'sin' ? `${coef(-cc)}\\cos x` : `${coef(cc)}\\sin x`;
        return { f: `${coef(cc)}\\${t.fn} x`, a: t.a, b: t.b, Tt: fois(t.Tt, cc), expl: `Une primitive de ${m(`${coef(cc)}\\${t.fn} x`)} est ${m(primC)}.` + (cc === 1 ? ` On a ${m(t.ex)}.` : '') };
      },
      () => {                                   // c + sin x
        const c = aleaParmi([1, 2, 3, 4]);
        return { f: `(${c}+\\sin x)`, a: ['0', 0], b: [T`\pi`, Math.PI], Tt: [[c, 1, 'pi'], [2, 1, '1']], expl: `${m(T`\int_0^{\pi}${c}\,\mathrm{d}x=${c}\pi`)} et ${m(T`\int_0^{\pi}\sin x\,\mathrm{d}x=2`)}, par linéarité.` };
      },
      () => {                                   // u'e^u
        const t = aleaParmi(['a', 'b', 'c', 'd']);
        const D = { a: { f: '2xe^{x^2}', Tt: [[1, 1, 'e'], [-1, 1, '1']] }, b: { f: 'xe^{x^2}', Tt: [[1, 2, 'e'], [-1, 2, '1']] }, c: { f: '3x^2e^{x^3}', Tt: [[1, 1, 'e'], [-1, 1, '1']] }, d: { f: '(2x+1)e^{x^2+x}', Tt: [[1, 1, 'e2'], [-1, 1, '1']] } }[t];
        return { f: D.f, a: ['0', 0], b: ['1', 1], Tt: D.Tt, expl: `La fonction est de la forme ${m(T`u'e^{u}`)} (à un coefficient près), de primitive ${m(T`e^{u}`)} : ${t === 'b' ? m(T`\left[\dfrac{1}{2}e^{x^2}\right]_0^1`) : t === 'a' ? m(T`\left[e^{x^2}\right]_0^1`) : t === 'c' ? m(T`\left[e^{x^3}\right]_0^1`) : m(T`\left[e^{x^2+x}\right]_0^1`)}.` };
      },
      () => {                                   // u'/u
        const t = aleaParmi(['a', 'b', 'c', 'd', 'e']);
        const D = { a: { f: fr('2x', 'x^2+1'), b: ['1', 1], Tt: [[1, 1, 'ln2']] }, b: { f: fr('x', 'x^2+1'), b: ['1', 1], Tt: [[1, 2, 'ln2']] }, c: { f: fr('1', 'x+1'), b: ['1', 1], Tt: [[1, 1, 'ln2']] }, d: { f: fr('2x+1', 'x^2+x+1'), b: ['1', 1], Tt: [[1, 1, 'ln3']] }, e: { f: fr('2x', 'x^2+1'), b: ['2', 2], Tt: [[1, 1, 'ln5']] } }[t];
        return { f: D.f, a: ['0', 0], b: D.b, Tt: D.Tt, expl: `La fonction est de la forme ${m(T`\dfrac{u'}{u}`)} (à un coefficient près), de primitive ${m(T`\ln u`)} (avec ${m('u>0')}).` };
      },
      () => {                                   // (ln x)^n / x sur [1, e]
        const n = aleaParmi([1, 2]), c = aleaParmi([1, 2, 3]);
        return { f: fr(`${coef(c)}${n === 1 ? '\\ln x' : '\\left(\\ln x\\right)^2'}`, 'x'), a: ['1', 1], b: ['e', Math.E], Tt: [[c, n + 1, '1']], expl: `La fonction est de la forme ${m(n === 1 ? T`u'u` : T`u'u^{2}`)} avec ${m(T`u=\ln x`)} : une primitive est ${m(`${coef(c)}\\dfrac{(\\ln x)^{${n + 1}}}{${n + 1}}`)}. Entre ${m('1')} et ${m('e')} : ${m(`${coef(c)}\\times\\dfrac{1}{${n + 1}}`)}.` };
      },
      () => {                                   // e^x + kx
        const k = aleaParmi([1, 3, 4, 5, 6, 8]);
        return { f: `(e^{x}+${k === 1 ? '' : k}x)`, a: ['0', 0], b: ['1', 1], Tt: [[1, 1, 'e'], [k - 2, 2, '1']], expl: `${m(T`\int_0^1 e^{x}\,\mathrm{d}x=e-1`)} et ${m(`\\int_0^1 ${k === 1 ? '' : k}x\\,\\mathrm{d}x=${fracL(k, 2)}`)}, donc ${m(`e-1+${fracL(k, 2)}`)}.` };
      }
    ],
    3: [
      () => {                                   // (ax+b)e^x
        const a = aleaParmi([1, 2, 3, -1]), b = aleaParmi([1, 2, 3, -1, -2]);
        return { f: `(${P([a, 'x'], [b, ''])})e^{x}`, a: ['0', 0], b: ['1', 1], Tt: [[b, 1, 'e'], [a - b, 1, '1']], expl: `Intégration par parties avec ${m(`u=${P([a, 'x'], [b, ''])}`)} et ${m("v'=e^{x}")} : une primitive est ${m(`(${P([a, 'x'], [b - a, ''])})e^{x}`)}.` };
      },
      () => {                                   // (ax+b)e^{-x}
        const a = aleaParmi([1, 2, 3]), b = aleaParmi([1, 2, 3, -1]);
        return { f: `(${P([a, 'x'], [b, ''])})e^{-x}`, a: ['0', 0], b: ['1', 1], Tt: [[a + b, 1, '1'], [-(2 * a + b), 1, 'ie']], expl: `Intégration par parties : une primitive est ${m(`-(${P([a, 'x'], [a + b, ''])})e^{-x}`)}, donc ${m(`-(${2 * a + b})e^{-1}+${a + b}`)}.` };
      },
      () => {                                   // x ln x, ln x, (ln x)², x² ln x
        const t = aleaParmi(['ln', 'xln', 'ln2', 'x2ln']), c = aleaParmi([1, 1, 2, 3]);
        const D = { ln: { f: '\\ln x', Tt: [[1, 1, '1']], p: T`x\ln x-x` }, xln: { f: 'x\\ln x', Tt: [[1, 4, 'e2'], [1, 4, '1']], p: T`\dfrac{x^2}{2}\ln x-\dfrac{x^2}{4}` }, ln2: { f: '\\left(\\ln x\\right)^2', Tt: [[1, 1, 'e'], [-2, 1, '1']], p: T`x(\ln x)^2-2x\ln x+2x` }, x2ln: { f: 'x^2\\ln x', Tt: [[2, 9, 'e3'], [1, 9, '1']], p: T`\dfrac{x^3}{3}\ln x-\dfrac{x^3}{9}` } }[t];
        return { f: `${coef(c)}${D.f}`, a: ['1', 1], b: ['e', Math.E], Tt: fois(D.Tt, c), expl: `Intégration par parties : une primitive de ${m(D.f)} est ${m(D.p)}. On évalue entre ${m('1')} et ${m('e')} (${m(T`\ln 1=0`)}, ${m(T`\ln e=1`)})${c === 1 ? '' : `, puis on multiplie par ${m(String(c))}`}.` };
      },
      () => {                                   // x sin x, x cos x
        const t = aleaParmi(['xs', 'xc', 'xs2', 'xc2']);
        const D = { xs: { f: 'x\\sin x', b: [T`\pi`, Math.PI], Tt: [[1, 1, 'pi']], p: T`-x\cos x+\sin x` }, xc: { f: 'x\\cos x', b: [fr('\\pi', '2'), Math.PI / 2], Tt: [[1, 2, 'pi'], [-1, 1, '1']], p: T`x\sin x+\cos x` }, xs2: { f: 'x\\sin x', b: [fr('\\pi', '2'), Math.PI / 2], Tt: [[1, 1, '1']], p: T`-x\cos x+\sin x` }, xc2: { f: 'x\\cos x', b: [T`\pi`, Math.PI], Tt: [[-2, 1, '1']], p: T`x\sin x+\cos x` } }[t];
        return { f: D.f, a: ['0', 0], b: D.b, Tt: D.Tt, expl: `Intégration par parties : une primitive de ${m(D.f)} est ${m(D.p)}.` };
      },
      () => {                                   // x e^{2x}, ln sur [1,2]
        if (Math.random() < 0.5) return { f: 'xe^{2x}', a: ['0', 0], b: ['1', 1], Tt: [[1, 4, 'e2'], [1, 4, '1']], expl: `Intégration par parties : une primitive de ${m('xe^{2x}')} est ${m(T`\left(\dfrac{x}{2}-\dfrac{1}{4}\right)e^{2x}`)}.` };
        return { f: '\\ln x', a: ['1', 1], b: ['2', 2], Tt: [[2, 1, 'ln2'], [-1, 1, '1']], expl: `Une primitive de ${m(T`\ln x`)} est ${m(T`x\ln x-x`)} : ${m(T`(2\ln 2-2)-(0-1)=2\ln 2-1`)}.` };
      },
      () => {                                   // x² e^x
        return { f: 'x^2e^{x}', a: ['0', 0], b: ['1', 1], Tt: [[1, 1, 'e'], [-2, 1, '1']], expl: `Deux intégrations par parties successives : une primitive de ${m('x^2e^{x}')} est ${m('(x^2-2x+2)e^{x}')}.` };
      }
    ]
  };
  function coefFr(n, d) { const t = fracL(n, d); return t === '1' ? '' : t === '-1' ? '-' : t; }
  function calcul(niveau) {
    const mo = aleaParmi(MODELES_CALCUL[niveau])();
    const bonne = exprTex(mo.Tt), faux = autres(mo.Tt);
    if (faux.length < 3) return null;
    return qcm(`Quelle est la valeur de ${m(intg(mo.a[0], mo.b[0], mo.f))} ?`, texOpt(bonne), faux.map(texOpt),
      { explication: mo.expl, meta: { tipo: 'calcul', fTex: mo.f, aTex: mo.a[0], bTex: mo.b[0] } });
  }

  // ==========================================================================
  // 2. Valeur moyenne
  // ==========================================================================
  const MODELES_MOYENNE = [
    () => { const p = aleaParmi([1, 2, 3, -1]), q = aleaParmi([1, 2, 3, 5, -2]), b = aleaParmi([2, 4]); return { f: `(${P([p, 'x'], [q, ''])})`, a: 0, b, Tt: [[p * b * b + 2 * q * b, 2, '1']] }; },
    () => { const n = aleaParmi([2, 3]), c = aleaParmi([1, 2, 3, 4]), b = aleaParmi([1, 2, 3, 4]); return { f: `${coef(c)}${xp(n)}`, a: 0, b, Tt: [[c * Math.pow(b, n + 1), n + 1, '1']] }; },
    () => { const a = aleaParmi([1, 2, 3, 4]); return { f: `${coef(a)}e^{x}`, a: 0, b: 1, Tt: [[a, 1, 'e'], [-a, 1, '1']] }; },
    () => { const a = aleaParmi([1, 2, 3, -1]), b = aleaParmi([1, 2, 3, -1, -2]); return { f: `(${P([a, 'x'], [b, ''])})e^{x}`, a: 0, b: 1, Tt: [[b, 1, 'e'], [a - b, 1, '1']] }; },
    () => { const a = aleaParmi([1, 2, 3]), b = aleaParmi([1, 2, 3, -1]); return { f: `(${P([a, 'x'], [b, ''])})e^{-x}`, a: 0, b: 1, Tt: [[a + b, 1, '1'], [-(2 * a + b), 1, 'ie']] }; },
    () => { return { f: 'x^2e^{x}', a: 0, b: 1, Tt: [[1, 1, 'e'], [-2, 1, '1']] }; }
  ];
  function moyenne(niveau) {
    const pool = niveau === 1 ? MODELES_MOYENNE.slice(0, 3) : niveau === 2 ? MODELES_MOYENNE.slice(0, 4) : MODELES_MOYENNE.slice(2);
    const mo = aleaParmi(pool)(), L = mo.b - mo.a, moy = fois(mo.Tt, 1, L);
    const bonne = exprTex(moy), faux = autres(moy), integrale = exprTex(mo.Tt);
    const cl = [integrale].concat(faux).filter((x, i, a) => x !== bonne && a.indexOf(x) === i);
    if (cl.length < 3) return null;
    const contexte = aleaParmi([`La température (en °C) d'une pièce, ${'à l\'instant ' + m('x') + ' (en heures)'}, est modélisée par ${m(`f(x)=${mo.f}`)} pour ${m(`x\\in[${mo.a}\\,;${mo.b}]`)}. Quelle est la température moyenne sur cet intervalle ?`, `Quelle est la valeur moyenne de la fonction ${m('f')} définie par ${m(`f(x)=${mo.f}`)} sur l'intervalle ${m(`[${mo.a}\\,;${mo.b}]`)} ?`]);
    return qcm(contexte, texOpt(bonne), cl.slice(0, 3).map(texOpt),
      { explication: `${m(T`\mu=\dfrac{1}{b-a}\int_a^b f(x)\,\mathrm{d}x`)} avec ${m(`b-a=${L}`)} et ${m(`\\int_${mo.a}^{${mo.b}} ${mo.f}\\,\\mathrm{d}x=${integrale}`)} : ${m(bonne)}.`, meta: { tipo: 'moyenne', fTex: mo.f, aTex: String(mo.a), bTex: String(mo.b) } });
  }

  // ==========================================================================
  // 3. Propriétés de l'intégrale (valeurs données)
  // ==========================================================================
  const CLAIMS = {
    mono: { vrai: true, tex: T`\text{si } f\le g \text{ sur } [a\,;b], \text{ alors } \int_a^b f\le\int_a^b g` },
    'mono-rec': { vrai: false, tex: T`\text{si } \int_a^b f\le\int_a^b g, \text{ alors } f\le g \text{ sur } [a\,;b]` },
    somme: { vrai: true, tex: T`\int_a^b (f+g)=\int_a^b f+\int_a^b g` },
    prod: { vrai: false, tex: T`\int_a^b (f\times g)=\int_a^b f\times\int_a^b g` },
    pos: { vrai: true, tex: T`\text{si } f\ge 0 \text{ sur } [a\,;b], \text{ alors } \int_a^b f\ge 0` },
    'pos-rec': { vrai: false, tex: T`\text{si } \int_a^b f\ge 0, \text{ alors } f\ge 0 \text{ sur } [a\,;b]` },
    carre: { vrai: false, tex: T`\left(\int_a^b f\right)^2=\int_a^b f^2` },
    abs: { vrai: true, tex: T`\left|\int_a^b f\right|\le\int_a^b |f|` },
    deriv: { vrai: true, tex: T`\int_a^b f'(x)\,\mathrm{d}x=f(b)-f(a)` },
    'deriv-bad': { vrai: false, tex: T`\int_a^b f'(x)\,\mathrm{d}x=f'(b)-f'(a)` },
    chasles: { vrai: true, tex: T`\int_a^c f=\int_a^b f+\int_b^c f` },
    'chasles-bad': { vrai: false, tex: T`\int_a^c f=\int_a^b f-\int_b^c f` },
    lin: { vrai: true, tex: T`\int_a^b 2f=2\int_a^b f` },
    'lin-bad': { vrai: false, tex: T`\int_a^b (f+2)=\int_a^b f+2` }
  };
  function proprietes(niveau) {
    const t = niveau === 1 ? aleaParmi(['chasles', 'inverse', 'const', 'moy']) : niveau === 2 ? aleaParmi(['lin', 'moy', 'encadrement', 'chasles', 'lin']) : aleaParmi(['claims', 'claims', 'encadrement', 'lin']);
    const ent = x => String(x), nb = (c, tex) => ({ affichage: m(tex), cle: tex });
    const mk = (vrai, cands) => { const vus = new Set([vrai]), f = []; for (const c of melanger(cands)) { if (!Number.isFinite(c) || vus.has(c)) continue; vus.add(c); f.push(c); } return f.slice(0, 3); };
    if (t === 'chasles') {
      const a = alea(0, 2), b = a + alea(1, 3), c = b + alea(1, 3), u = alea(2, 9), v = alea(-4, 9);
      const f = mk(u + v, [u - v, u * v, v - u, u + v + 1, u + v - 1, Math.abs(u) + Math.abs(v) + 2]); if (f.length < 3) return null;
      return qcm(`${m('f')} est une fonction continue sur ${m(`[${a}\\,;${c}]`)} telle que ${m(`\\displaystyle\\int_{${a}}^{${b}} f(x)\\,\\mathrm{d}x=${u}`)} et ${m(`\\displaystyle\\int_{${b}}^{${c}} f(x)\\,\\mathrm{d}x=${v}`)}. Que vaut ${m(`\\displaystyle\\int_{${a}}^{${c}} f(x)\\,\\mathrm{d}x`)} ?`, nb(0, String(u + v)), f.map(x => nb(0, String(x))), { explication: `Relation de Chasles : ${m(`\\int_{${a}}^{${c}}=\\int_{${a}}^{${b}}+\\int_{${b}}^{${c}}=${u}${sgn(v)}=${u + v}`)}.`, meta: { tipo: 'prop', kind: 'chasles', u, v } });
    }
    if (t === 'inverse') {
      const a = alea(0, 3), b = a + alea(1, 4), u = alea(2, 9);
      const f = mk(-u, [u, 1 / u, u - 1, -u + 1, u + 1, 2 * u]); if (f.length < 3) return null;
      return qcm(`${m('f')} est une fonction continue sur ${m(`[${a}\\,;${b}]`)} telle que ${m(`\\displaystyle\\int_{${a}}^{${b}} f(x)\\,\\mathrm{d}x=${u}`)}. Que vaut ${m(`\\displaystyle\\int_{${b}}^{${a}} f(x)\\,\\mathrm{d}x`)} ?`, nb(0, String(-u)), f.filter(x => Number.isInteger(x)).concat([u * 3, u + 2]).filter((x, i, A) => x !== -u && A.indexOf(x) === i).slice(0, 3).map(x => nb(0, String(x))), { explication: `Échanger les bornes change le signe : ${m(`\\int_{${b}}^{${a}} f=-\\int_{${a}}^{${b}} f=${-u}`)}.`, meta: { tipo: 'prop', kind: 'inverse', u } });
    }
    if (t === 'const') {
      const a = alea(-2, 2), b = a + alea(2, 5), c = alea(2, 8);
      const f = mk(c * (b - a), [c, b - a, c + b - a, c * b, c * (b + a), (c * (b * b - a * a)) / 2]); if (f.length < 3) return null;
      return qcm(`Que vaut ${m(`\\displaystyle\\int_{${a}}^{${b}} ${c}\\,\\mathrm{d}x`)} ?`, nb(0, String(c * (b - a))), f.filter(Number.isInteger).map(x => nb(0, String(x))), { explication: `Une primitive de la constante ${m(String(c))} est ${m(`${c}x`)} : ${m(`${c}\\times ${b < 0 ? '(' + b + ')' : b}-${c}\\times ${a < 0 ? '(' + a + ')' : a}=${c * (b - a)}`)}.`, meta: { tipo: 'prop', kind: 'const', a, b, c } });
    }
    if (t === 'moy') {
      const a = alea(0, 3), L = aleaParmi([2, 4, 5]), b = a + L, mu = alea(2, 9), u = mu * L;
      const f = mk(mu, [u, L, u + L, mu + L, u / (L + 1), mu * 2]); if (f.length < 3) return null;
      return qcm(`${m('f')} est une fonction continue sur ${m(`[${a}\\,;${b}]`)} telle que ${m(`\\displaystyle\\int_{${a}}^{${b}} f(x)\\,\\mathrm{d}x=${u}`)}. Quelle est la valeur moyenne de ${m('f')} sur ${m(`[${a}\\,;${b}]`)} ?`, nb(0, String(mu)), f.filter(Number.isInteger).concat([mu + 1, mu - 1, u - L]).filter((x, i, A) => x !== mu && A.indexOf(x) === i).slice(0, 3).map(x => nb(0, String(x))), { explication: `${m(T`\mu=\dfrac{1}{b-a}\int_a^b f=\dfrac{${u}}{${L}}=${mu}`)}.`, meta: { tipo: 'prop', kind: 'moy', u, L } });
    }
    if (t === 'lin') {
      const a = alea(0, 2), b = a + alea(1, 3), u = alea(1, 8), v = alea(1, 8), al = aleaParmi([2, 3, 4, -1, -2]), be = aleaParmi([2, 3, -1, -3, 5]);
      const vr = al * u + be * v, f = mk(vr, [al * u - be * v, al + be * (u + v), al * be * u * v, (al + be) * (u + v), vr + u, al * u + be + v, u + v]); if (f.length < 3) return null;
      return qcm(`${m('f')} et ${m('g')} sont continues sur ${m(`[${a}\\,;${b}]`)}, avec ${m(`\\displaystyle\\int_{${a}}^{${b}} f(x)\\,\\mathrm{d}x=${u}`)} et ${m(`\\displaystyle\\int_{${a}}^{${b}} g(x)\\,\\mathrm{d}x=${v}`)}. Que vaut ${m(`\\displaystyle\\int_{${a}}^{${b}} \\left(${coef(al)}f(x)${sgn(be)}${Math.abs(be) === 1 ? '' : Math.abs(be)}g(x)\\right)\\mathrm{d}x`)} ?`, nb(0, String(vr)), f.map(x => nb(0, String(x))), { explication: `Linéarité : ${m(`${coef(al)}\\times ${u}${sgn(be)}\\times ${v}`.replace('1\\times', '').replace(/^\\times/, ''))}${''} = ${m(String(vr))}.`.replace(/ = /, ' '), meta: { tipo: 'prop', kind: 'lin', u, v, al, be } });
    }
    if (t === 'encadrement') {
      const a = alea(0, 3), L = aleaParmi([2, 3, 4, 5]), b = a + L, lo = alea(-2, 3), hi = lo + alea(1, 4);
      const bonne = `${lo * L}\\le I\\le ${hi * L}`;
      const cl = [`${lo}\\le I\\le ${hi}`, `${hi * L}\\le I\\le ${lo * L}`, `${lo * L}\\le I\\le ${hi}`, `${lo + L}\\le I\\le ${hi + L}`, `${lo}\\le I\\le ${hi * L}`, `${lo * L - 1}\\le I\\le ${hi * L + 1}`, `${(lo * L) / 2}\\le I\\le ${(hi * L) / 2}`].filter((x, i, A) => x !== bonne && A.indexOf(x) === i && !/\./.test(x));
      if (cl.length < 3 || lo * L === hi * L) return null;
      return qcm(`Pour tout ${m('x')} de ${m(`[${a}\\,;${b}]`)}, on a ${m(`${lo}\\le f(x)\\le ${hi}`)}. On pose ${m(`I=\\displaystyle\\int_{${a}}^{${b}} f(x)\\,\\mathrm{d}x`)}. Quel encadrement de ${m('I')} obtient-on en intégrant cette inégalité ?`, nb(0, bonne), cl.slice(0, 3).map(x => nb(0, x)), { explication: `On intègre sur ${m(`[${a}\\,;${b}]`)} : ${m(`${lo}(${b}-${a})\\le I\\le ${hi}(${b}-${a})`)}, soit ${m(bonne)} (longueur de l'intervalle : ${m(String(L))}).`, meta: { tipo: 'prop', kind: 'encadrement', lo, hi, L } });
    }
    const vrais = ['mono', 'somme', 'pos', 'abs', 'deriv', 'chasles', 'lin'], faux = ['mono-rec', 'prod', 'pos-rec', 'carre', 'deriv-bad', 'chasles-bad', 'lin-bad'];
    const bonneCle = aleaParmi(vrais), f3 = melanger(faux).slice(0, 3);
    return qcm('Quelle affirmation est vraie, pour des fonctions continues sur l\'intervalle considéré ?', { affichage: m(CLAIMS[bonneCle].tex), cle: bonneCle }, f3.map(c => ({ affichage: m(CLAIMS[c].tex), cle: c })),
      { explication: `Les propriétés valables sont la linéarité, la relation de Chasles, la positivité, la croissance (si ${m(T`f\le g`)} alors ${m(T`\int f\le\int g`)}) et ${m(T`\int_a^b f'=f(b)-f(a)`)}. Les réciproques de la positivité et de la croissance sont fausses (une intégrale peut être positive sans que ${m('f')} le soit), et l'intégrale d'un produit n'est pas le produit des intégrales.`, meta: { tipo: 'prop', kind: 'claims' } });
  }

  // ==========================================================================
  // 4. Aires
  // ==========================================================================
  const MODELES_AIRE = {
    2: [
      () => {                                   // x² - a x sur [0, a] : courbe sous l'axe
        const a = aleaParmi([2, 3, 4, 6]);
        return { f: P([1, 'x^2'], [-a, 'x']), g: '0', a: ['0', 0], b: [String(a), a], Tt: [[a * a * a, 6, '1']], expl: `${m(`f(x)=x(x-${a})`)} est négative sur ${m(`[0\\,;${a}]`)} : l'aire est ${m(`-\\int_0^{${a}} f=-\\left[\\dfrac{x^3}{3}-${fracL(a, 2)}x^2\\right]_0^{${a}}=${fracL(a * a * a, 6)}`)}.` };
      },
      () => {                                   // -x² + a x sur [0, a]
        const a = aleaParmi([2, 3, 4, 5, 6]);
        return { f: P([-1, 'x^2'], [a, 'x']), g: '0', a: ['0', 0], b: [String(a), a], Tt: [[a * a * a, 6, '1']], expl: `${m(`f(x)=x(${a}-x)`)} est positive sur ${m(`[0\\,;${a}]`)} : l'aire est ${m(`\\int_0^{${a}} f=${fracL(a * a * a, 6)}`)}.` };
      },
      () => {                                   // x² - c² sur [-c, c]
        const c = aleaParmi([1, 2, 3]);
        return { f: P([1, 'x^2'], [-c * c, '']), g: '0', a: [String(-c), -c], b: [String(c), c], Tt: [[4 * c * c * c, 3, '1']], expl: `${m(`f(x)=x^2-${c * c}`)} est négative sur ${m(`[${-c}\\,;${c}]`)} : l'aire est ${m(`-\\int_{${-c}}^{${c}} f=-\\left(\\dfrac{2\\times ${c * c * c}}{3}-${2 * c * c * c}\\right)=${fracL(4 * c * c * c, 3)}`)}.` };
      }
    ],
    3: [
      () => {                                   // e^x - k sur [0, ln k]
        const k = aleaParmi([2, 3]);
        return { f: `e^{x}-${k}`, g: '0', a: ['0', 0], b: [T`\ln ${k}`, Math.log(k)], Tt: [[k, 1, 'ln' + k], [-(k - 1), 1, '1']], expl: `${m(`e^x-${k}`)} est négative sur ${m(`[0\\,;\\ln ${k}]`)} : l'aire est ${m(`-\\int_0^{\\ln ${k}}(e^x-${k})\\,\\mathrm{d}x=-\\left[e^x-${k}x\\right]_0^{\\ln ${k}}=${k}\\ln ${k}-${k - 1}`)}.` };
      },
      () => {                                   // entre y = a x et y = x² sur [0, a]
        const a = aleaParmi([2, 3, 4, 5]);
        return { f: `${a}x`, g: 'x^2', a: ['0', 0], b: [String(a), a], Tt: [[a * a * a, 6, '1']], entre: true, expl: `Sur ${m(`[0\\,;${a}]`)}, la droite est au-dessus de la parabole (${m(`${a}x\\ge x^2`)}) : l'aire est ${m(`\\int_0^{${a}}(${a}x-x^2)\\,\\mathrm{d}x=${fracL(a * a * a, 6)}`)}.` };
      },
      () => {                                   // entre e^x et 1 sur [0,1]  (e^x >= 1)
        return { f: 'e^{x}', g: '1', a: ['0', 0], b: ['1', 1], Tt: [[1, 1, 'e'], [-2, 1, '1']], entre: true, expl: `Sur ${m('[0\\,;1]')}, ${m('e^x\\ge 1')} : l'aire est ${m(T`\int_0^1(e^x-1)\,\mathrm{d}x=\left[e^x-x\right]_0^1=e-2`)}.` };
      },
      () => {                                   // entre x + 1 et e^x
        return { f: 'e^{x}', g: 'x+1', a: ['0', 0], b: ['1', 1], Tt: [[1, 1, 'e'], [-5, 2, '1']], entre: true, expl: `Sur ${m('[0\\,;1]')}, ${m('e^x\\ge x+1')} : l'aire est ${m(T`\int_0^1(e^x-x-1)\,\mathrm{d}x=\left[e^x-\dfrac{x^2}{2}-x\right]_0^1=e-\dfrac{1}{2}-1-1=e-\dfrac{5}{2}`)}.` };
      },
      () => {                                   // x^3 - x sur [-1, 1]
        return { f: 'x^3-x', g: '0', a: ['-1', -1], b: ['1', 1], Tt: [[1, 2, '1']], expl: `${m('x^3-x=x(x-1)(x+1)')} change de signe en ${m('0')} : on calcule l'aire sur ${m('[-1\\,;0]')} (courbe au-dessus de l'axe) et sur ${m('[0\\,;1]')} (en dessous), soit ${m(T`2\times\dfrac{1}{4}=\dfrac{1}{2}`)}. Un seul calcul sur ${m('[-1\\,;1]')} donnerait ${m('0')}.` };
      }
    ]
  };
  function aires(niveau) {
    const mo = aleaParmi(MODELES_AIRE[niveau])(), ux = aleaParmi([1, 1, 2, 3]), uy = aleaParmi([1, 1, 2, 4]), U = ux * uy;
    const surface = mo.entre ? `du domaine délimité par les courbes de ${m(`f(x)=${mo.f}`)} et de ${m(`g(x)=${mo.g}`)} entre ${m(`x=${mo.a[0]}`)} et ${m(`x=${mo.b[0]}`)}` : `du domaine délimité par la courbe de ${m(`f(x)=${mo.f}`)}, l'axe des abscisses et les droites d'équations ${m(`x=${mo.a[0]}`)} et ${m(`x=${mo.b[0]}`)}`;
    const unite = U === 1 ? ' en unités d\'aire' : ` en cm², l'unité graphique étant ${ux} cm sur l'axe des abscisses et ${uy} cm sur l'axe des ordonnées`;
    const Tt = fois(mo.Tt, U), bonne = exprTex(Tt);
    let cl = autres(Tt);
    if (U !== 1) cl = [exprTex(mo.Tt), exprTex(fois(mo.Tt, ux)), exprTex(fois(mo.Tt, uy))].filter(x => x !== bonne).concat(cl);
    cl = cl.filter((x, i, a) => a.indexOf(x) === i && x !== bonne);
    if (cl.length < 3) return null;
    return qcm(`Quelle est l'aire ${surface}${unite} ?`, texOpt(bonne), cl.slice(0, 3).map(texOpt), { explication: `${mo.expl}${U === 1 ? '' : ` On multiplie par l'aire de l'unité d'aire : ${m(`${ux}\\times ${uy}=${U}`)} cm².`}`, meta: { tipo: 'aire', fTex: mo.f, gTex: mo.g, aTex: mo.a[0], bTex: mo.b[0], unite: U } });
  }

  // ==========================================================================
  // 5. Suites d'intégrales
  // ==========================================================================
  const SUITES = {
    exp: { nom: T`I_n=\int_0^1 x^{n}e^{x}\,\mathrm{d}x`, init: [[1, 1, 'e'], [-1, 1, '1']], rec: 'I_{n+1}=e-(n+1)I_n', faux: ['I_{n+1}=e-nI_n', 'I_{n+1}=e+(n+1)I_n', 'I_{n+1}=(n+1)I_n-e', 'I_{n+1}=\\dfrac{e-I_n}{n+1}', 'I_{n+1}=e-I_n'], sens: 'dec', lim: '0', expl: `Intégration par parties avec ${m('u=x^{n+1}')} et ${m("v'=e^{x}")} : ${m(T`I_{n+1}=\left[x^{n+1}e^{x}\right]_0^1-(n+1)\int_0^1 x^{n}e^{x}\,\mathrm{d}x=e-(n+1)I_n`)}. Pour ${m('x\\in[0\\,;1]')}, ${m(T`0\le x^{n+1}\le x^{n}`)}, donc la suite est décroissante, positive, et ${m(T`0\le I_n\le\dfrac{e}{n+1}`)} (gendarmes) : limite ${m('0')}.` },
    ln: { nom: T`I_n=\int_1^e \left(\ln x\right)^{n}\mathrm{d}x`, init: [[1, 1, 'e'], [-1, 1, '1']], rec: 'I_{n+1}=e-(n+1)I_n', faux: ['I_{n+1}=e-nI_n', 'I_{n+1}=e+(n+1)I_n', 'I_{n+1}=(n+1)I_n-e', 'I_{n+1}=\\dfrac{e-I_n}{n+1}', 'I_{n+1}=e-I_n'], sens: 'dec', lim: '0', expl: `Intégration par parties avec ${m('u=(\\ln x)^{n+1}')} et ${m("v'=1")} : ${m(T`I_{n+1}=\left[x(\ln x)^{n+1}\right]_1^e-(n+1)\int_1^e(\ln x)^{n}\,\mathrm{d}x=e-(n+1)I_n`)}. Sur ${m('[1\\,;e]')}, ${m(T`0\le\ln x\le 1`)} : la suite est décroissante, positive, de limite ${m('0')}.` },
    inv: { nom: T`I_n=\int_0^1 \dfrac{x^{n}}{1+x}\,\mathrm{d}x`, init: [[1, 1, 'ln2']], rec: 'I_{n+1}+I_n=\\dfrac{1}{n+1}', faux: ['I_{n+1}+I_n=\\dfrac{1}{n}', 'I_{n+1}-I_n=\\dfrac{1}{n+1}', 'I_{n+1}+I_n=n+1', 'I_{n+1}\\times I_n=\\dfrac{1}{n+1}', 'I_{n+1}+I_n=\\dfrac{1}{n+2}'], sens: 'dec', lim: '0', expl: `${m(T`I_{n+1}+I_n=\int_0^1\dfrac{x^{n+1}+x^{n}}{1+x}\,\mathrm{d}x=\int_0^1 x^{n}\,\mathrm{d}x=\dfrac{1}{n+1}`)}. Comme ${m(T`0\le\dfrac{x^{n+1}}{1+x}\le\dfrac{x^{n}}{1+x}`)}, la suite est décroissante ; ${m(T`0\le I_n\le\dfrac{1}{n+1}`)} donne la limite ${m('0')}.` },
    sin: { nom: T`I_n=\int_0^{\pi} e^{-nx}\sin x\,\mathrm{d}x`, init: [[2, 1, '1']], rec: null, faux: [], sens: 'dec', lim: '0', expl: `Pour ${m(T`x\in[0\,;\pi]`)}, ${m(T`0\le\sin x\le 1`)} donc ${m(T`0\le e^{-nx}\sin x\le e^{-nx}`)} ; on intègre : ${m(T`0\le I_n\le\dfrac{1-e^{-n\pi}}{n}`)}, de limite ${m('0')}. De plus ${m(T`e^{-(n+1)x}\le e^{-nx}`)} : la suite est décroissante. ${m(T`I_0=\int_0^{\pi}\sin x\,\mathrm{d}x=2`)}.` }
  };
  function suitesIntegrales() {
    const id = aleaParmi(Object.keys(SUITES)), S = SUITES[id];
    const kinds = id === 'sin' ? ['init', 'sens', 'lim'] : ['rec', 'rec', 'init', 'sens', 'lim'];
    const k = aleaParmi(kinds), nom = m(S.nom);
    if (k === 'rec') {
      const bonne = S.rec, cl = S.faux.filter((x, i, A) => x !== bonne && A.indexOf(x) === i);
      return qcm(`On pose, pour tout entier naturel ${m('n')}, ${nom}. Quelle relation lie ${m('I_{n+1}')} et ${m('I_n')} (intégration par parties) ?`, texOpt(bonne), cl.slice(0, 3).map(texOpt), { explication: S.expl, meta: { tipo: 'suite', id, ask: 'rec' } });
    }
    if (k === 'init') {
      const bonne = exprTex(S.init), faux = autres(S.init);
      return qcm(`On pose, pour tout entier naturel ${m('n')}, ${nom}. Que vaut ${m('I_0')} ?`, texOpt(bonne), faux.slice(0, 3).map(texOpt), { explication: `${m('I_0')} est l'intégrale de la fonction obtenue pour ${m('n=0')}, soit ${m(bonne)}.`, meta: { tipo: 'suite', id, ask: 'init' } });
    }
    if (k === 'sens') {
      const O1 = { dec: 'elle est décroissante', inc: 'elle est croissante', cst: 'elle est constante', non: 'elle n\'est pas monotone' };
      return qcm(`On pose, pour tout entier naturel ${m('n')}, ${nom}. Quel est le sens de variation de la suite ${m('(I_n)')} ?`, { affichage: O1.dec, cle: 'dec' }, [{ affichage: O1.inc, cle: 'inc' }, { affichage: O1.cst, cle: 'cst' }, { affichage: O1.non, cle: 'non' }], { explication: S.expl, meta: { tipo: 'suite', id, ask: 'sens' } });
    }
    const cl = ['0', '1', T`+\infty`, T`\dfrac{1}{2}`, '-1'].filter(x => x !== '0');
    return qcm(`On pose, pour tout entier naturel ${m('n')}, ${nom}. Que peut-on dire de la limite de la suite ${m('(I_n)')} ?`, { affichage: `elle converge vers ${m('0')}`, cle: '0' }, [{ affichage: `elle converge vers ${m('1')}`, cle: '1' }, { affichage: `elle tend vers ${m(T`+\infty`)}`, cle: 'inf' }, { affichage: `elle n'a pas de limite`, cle: 'non' }], { explication: S.expl, meta: { tipo: 'suite', id, ask: 'lim' } });
  }

  // ==========================================================================
  // 6. Fonction définie par une intégrale
  // ==========================================================================
  const num = u => /^\d+$/.test(u);                       // borne numérique : on écrit la valeur simplifiée
  const INTEGRANDES = [
    { f: 'e^{-t^2}', d: u => (num(u) ? `e^{-${u * u}}` : `e^{-${u}^2}`) },
    { f: T`\dfrac{1}{1+t^2}`, d: u => (num(u) ? fr('1', String(1 + u * u)) : fr('1', `1+${u}^2`)) },
    { f: 't\\,e^{t}', d: u => (num(u) ? (u === '1' ? 'e' : `${u}e^{${u}}`) : `${u}e^{${u}}`) },
    { f: T`\ln\left(1+t^2\right)`, d: u => (num(u) ? `\\ln ${1 + u * u}` : `\\ln\\left(1+${u}^2\\right)`) },
    { f: 'e^{t}\\sin t', d: u => `e^{${u}}\\sin ${u}` },
    { f: T`\dfrac{t}{1+t^2}`, d: u => (num(u) ? fr(u, String(1 + u * u)) : fr(u, `1+${u}^2`)) },
    { f: '\\cos\\left(t^2\\right)', d: u => (num(u) ? `\\cos ${u * u}` : `\\cos\\left(${u}^2\\right)`) }
  ];
  function integraleVariable(niveau) {
    const g = aleaParmi(INTEGRANDES), a = aleaParmi([0, 1, 2]), compose = niveau === 3 && Math.random() < 0.6;
    const haute = compose ? aleaParmi([['x^2', '2x', 'x^2'], ['2x', '2', '2x'], ['x+1', '1', 'x+1']]) : ['x', '1', 'x'];
    const F = `F(x)=\\displaystyle\\int_{${a}}^{${haute[0]}} ${g.f}\\,\\mathrm{d}t`;
    const vrai = compose ? `${haute[1] === '1' ? '' : haute[1] + '\\times '}${g.d(`\\left(${haute[2]}\\right)`)}` : g.d('x');
    const pref = haute[1] === '1' ? '' : `${haute[1]}\\times `, ua = g.d(String(a)), gu = compose ? g.d(`\\left(${haute[2]}\\right)`) : g.d('x'), gx = g.d('x');
    const ga = a === 0 ? null : ua;
    const cl = compose ? [gu, `${pref}${gx}`, ga ? `${pref}${gu}-${ga}` : null, `x\\times ${gu}`, `-${pref}${gu}`, `${haute[1] === '1' ? '2' : String(+haute[1] + 1)}\\times ${gu}`]
      : [`-${gx}`, ga ? `${gx}-${ga}` : null, `x\\times ${gx}`, ga ? ga : null, `2${gx}`, ga ? `${gx}+${ga}` : `${gx}+1`];
    const faux = cl.filter((x, i, A) => x && x !== vrai && A.indexOf(x) === i);
    if (faux.length < 3) return null;
    return qcm(`La fonction ${m('F')} est définie sur ${m(T`\mathbb{R}`)} par ${m(F)}, où ${m('t\\mapsto ' + g.f)} est continue. Quelle est l'expression de ${m("F'(x)")} ?`, texOpt(`F'(x)=${vrai}`), faux.slice(0, 3).map(t => texOpt(`F'(x)=${t}`)),
      { explication: compose ? `${m('F')} est la composée de ${m(`G(u)=\\int_{${a}}^{u} ${g.f}\\,\\mathrm{d}t`)} (de dérivée ${m(`G'(u)=${g.d('u')}`)}) et de ${m(`u(x)=${haute[0]}`)} : ${m("F'(x)=u'(x)\\,G'(u(x))")}.` : `${m('F')} est la primitive de ${m(`t\\mapsto ${g.f}`)} qui s'annule en ${m(String(a))} : ${m(`F'(x)=${g.d('x')}`)}. La borne inférieure ${m(String(a))} n'intervient pas dans la dérivée.`, meta: { tipo: 'integrale-variable', fTex: g.f, a, haute: haute[0] } });
  }
  function wrap(t) { return /^\\dfrac|^\\ln|^\\cos|^e\^/.test(t) ? t : t; }

  // ==========================================================================
  // Enregistrement
  // ==========================================================================
  Automatismes.enregistrerBanque('integrales', {
    titre: 'Calcul intégral',
    familles: {
      'calcul': famille({ nom: 'calcul d’intégrales', niveaux: [1, 2, 3], base: retente(n => epure(calcul(n))) }),
      'moyenne': famille({ nom: 'valeur moyenne', niveaux: [1, 2, 3], base: retente(n => epure(moyenne(n))) }),
      'proprietes': famille({ nom: 'propriétés de l’intégrale', niveaux: [1, 2, 3], base: retente(n => epure(proprietes(n))) }),
      'aires': famille({ nom: 'aires', niveaux: [2, 3], base: retente(n => epure(aires(n))) }),
      'suites-integrales': famille({ nom: 'suites d’intégrales', niveaux: [3], base: retente(n => epure(suitesIntegrales(n))) }),
      'integrale-variable': famille({ nom: 'fonction définie par une intégrale', niveaux: [2, 3], base: retente(n => epure(integraleVariable(n))) })
    }
  });
})();
