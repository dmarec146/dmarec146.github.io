/* Banque 07 — Trigonométrie (Terminale spécialité)
   Questions à quatre choix inspirées du programme (fonctions sinus et cosinus : dérivées, variations, courbes ; équations
   `cos(x)=a` et inéquations `cos(x)≤a` sur [−π, π]) et des sujets de bac 2024 à 2026 (dérivée de `x + sin x`, concavité,
   `h'(x) = −2 sin x + cos x`, solutions `C e^x + 2 cos x + sin x`). Voir outils/qcm-bac/types-de-questions-2022-2023.md.

   Niveau 1 — les bases : valeurs exactes de cos et sin aux angles usuels, dérivée de sin(ax+b), parité, périodes.
   Niveau 2 — l'épreuve : équations `cos x = a` et `sin x = a` sur un intervalle, formules d'addition et de duplication,
              dérivées de produits, extremum d'une fonction trigonométrique, limites en 0.
   Niveau 3 — plus difficile (pénalités) : inéquations trigonométriques (réunions d'intervalles), signe de f', concavité,
              limites par taux d'accroissement ou gendarmes, `cos 2x` ou `sin 2x` connaissant `cos x`.

   Le contrôle (outils/qcm-bac/controle-banques.js) relit dans le LaTeX affiché les fonctions, les angles et les ensembles de
   solutions et recalcule numériquement : valeur, racines et signe sur une grille, dérivée par différences finies, limites. */
(function () {
  'use strict';
  const O = Automatismes.outils;
  const { alea, aleaParmi, melanger, pgcd, m, qcm, famille, fracL, poly } = O;
  const T = String.raw;

  const texOpt = tex => ({ affichage: m(tex), cle: tex });
  const retente = gen => niveau => { for (let i = 0; i < 12; i++) { const q = gen(niveau); if (q) return q; } return null; };
  const P = (...termes) => poly(termes).replace(/ ([+-]) /g, '$1');
  const coef = c => (c === 1 ? '' : c === -1 ? '-' : String(c));
  const fr = (a, b) => T`\dfrac{${a}}{${b}}`;
  const sgn = n => (n < 0 ? '-' : '+') + Math.abs(n);
  const MINF = T`-\infty`, INF = T`+\infty`;

  // ---------- angles en degrés → LaTeX en multiples de π ----------
  const rad = d => d * Math.PI / 180;
  function angTex(deg) {
    if (deg === 0) return '0';
    const g = pgcd(Math.abs(deg), 180), n = deg / g, d = 180 / g, an = Math.abs(n);
    const corps = d === 1 ? (an === 1 ? T`\pi` : `${an}\\pi`) : fr(an === 1 ? T`\pi` : `${an}\\pi`, String(d));
    return (n < 0 ? '-' : '') + corps;
  }
  // ---------- valeurs exactes de cos, sin, tan aux angles usuels (retrouvées numériquement) ----------
  const S2 = Math.SQRT2 / 2, S3 = Math.sqrt(3) / 2, T3 = Math.sqrt(3) / 3;
  const POOL = [[0, '0'], [1, '1'], [-1, '-1'], [0.5, fr('1', '2')], [-0.5, T`-\dfrac{1}{2}`], [S2, fr('\\sqrt{2}', '2')], [-S2, T`-\dfrac{\sqrt{2}}{2}`], [S3, fr('\\sqrt{3}', '2')], [-S3, T`-\dfrac{\sqrt{3}}{2}`],
    [T3, fr('\\sqrt{3}', '3')], [-T3, T`-\dfrac{\sqrt{3}}{3}`], [Math.sqrt(3), T`\sqrt{3}`], [-Math.sqrt(3), T`-\sqrt{3}`]];
  const exactTex = v => { const p = POOL.find(([x]) => Math.abs(x - v) < 1e-9); return p ? p[1] : null; };
  const FN = { cos: Math.cos, sin: Math.sin, tan: Math.tan };

  // ==========================================================================
  // 1. Valeurs exactes
  // ==========================================================================
  function valeurs(niveau) {
    const fns = niveau === 1 ? ['cos', 'sin'] : ['cos', 'sin', 'tan'];
    const fn = aleaParmi(fns), base = aleaParmi(fn === 'tan' ? [0, 30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330] : niveau === 1 ? [0, 30, 45, 60, 90, 120, 135, 150, 180] : [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330]);
    const k = niveau === 1 ? aleaParmi([0, 0, -1]) : aleaParmi([-1, 0, 0, 1, 2, -2]), deg = base + 360 * k;
    const v = FN[fn](rad(deg)), vrai = exactTex(v); if (vrai === null) return null;
    const autre = fn === 'cos' ? Math.sin : Math.cos;
    const ref = Math.abs(FN[fn](rad(base % 90 === 0 ? base : (base > 180 ? 360 - base : base > 90 ? 180 - base : base))));
    const cands = [-v, autre(rad(deg)), -autre(rad(deg)), FN[fn](rad(deg + 90)), FN[fn](rad(Math.abs(base) % 90)), ref].map(x => [x, exactTex(x)]).filter(([x, t]) => t !== null && Math.abs(x - v) > 1e-9);
    const pool = POOL.filter(([x]) => (fn === 'tan' ? true : Math.abs(x) <= 1) && Math.abs(x - v) > 1e-9);
    const vus = new Set([vrai]), faux = [];
    for (const [, t] of cands.concat(melanger(pool))) { if (vus.has(t)) continue; vus.add(t); faux.push(t); }
    const reduit = ((deg % 360) + 360) % 360;
    return qcm(`Quelle est la valeur exacte de ${m(`\\${fn}\\left(${angTex(deg)}\\right)`)} ?`, texOpt(vrai), faux.slice(0, 3).map(texOpt),
      { explication: `On ramène l'angle dans ${m(T`\left]-\pi\,;\pi\right]`)} (à ${m(T`2\pi`)} près) puis on utilise les valeurs usuelles et les symétries du cercle trigonométrique : ${m(`\\${fn}\\left(${angTex(deg)}\\right)=${vrai}`)}.`, meta: { tipo: 'valeur', fn, angleTex: angTex(deg) } });
  }

  // ==========================================================================
  // 2. Équations et inéquations sur un intervalle
  // ==========================================================================
  const IV = (lo, hi, lc, hc) => T`\left${lc ? '[' : ']'}${lo}\,;${hi}\right${hc ? ']' : '['}`;
  const ENS = (...v) => T`\left\{${v.join(T`\,;`)}\right\}`;
  const UNION = (...p) => p.join(T`\cup`);
  const ang = d => angTex(d);
  // racines (en degrés, multiples de 15) de fn(x) = c sur [lo, hi] (degrés)
  const racinesDeg = (fn, c, lo, hi) => { const r = []; for (let d = lo; d <= hi; d += 15) if (Math.abs(FN[fn](rad(d)) - c) < 1e-9) r.push(d); return r; };
  // ensemble solution d'une inéquation fn(x) ◇ c sur [lo, hi] : liste d'intervalles [a, b] en degrés (fermés si non strict)
  function solIneq(fn, c, op, lo, hi) {
    const rs = racinesDeg(fn, c, lo, hi), bords = [lo].concat(rs.filter(r => r > lo && r < hi), [hi]);
    const vrai = x => ({ '<=': FN[fn](rad(x)) <= c, '>=': FN[fn](rad(x)) >= c, '<': FN[fn](rad(x)) < c, '>': FN[fn](rad(x)) > c })[op];
    const morceaux = [];
    for (let i = 0; i + 1 < bords.length; i++) if (vrai((bords[i] + bords[i + 1]) / 2)) { const dernier = morceaux[morceaux.length - 1]; if (dernier && dernier[1] === bords[i]) dernier[1] = bords[i + 1]; else morceaux.push([bords[i], bords[i + 1]]); }
    return morceaux;
  }
  function texEns(morceaux, op, lo, hi) {
    const ferme = op === '<=' || op === '>=';
    if (!morceaux.length) return T`\varnothing`;
    return UNION(...morceaux.map(([a, b]) => IV(ang(a), ang(b), a === lo ? true : ferme, b === hi ? true : ferme)));
  }
  const COS_C = [[1, '1'], [-1, '-1'], [0.5, fr('1', '2')], [-0.5, T`-\dfrac{1}{2}`], [S2, fr('\\sqrt{2}', '2')], [-S2, T`-\dfrac{\sqrt{2}}{2}`], [S3, fr('\\sqrt{3}', '2')], [-S3, T`-\dfrac{\sqrt{3}}{2}`], [0, '0']];
  function trigEquation(niveau) {
    const t = niveau === 2 ? aleaParmi(['cos-eq', 'cos-eq', 'sin-eq']) : aleaParmi(['cos-ineq', 'sin-ineq', 'cos-ineq', 'sin-eq']);
    const [c, cTex] = aleaParmi(COS_C);
    const fn = t.startsWith('cos') ? 'cos' : 'sin';
    const [lo, hi] = fn === 'cos' ? aleaParmi([[-180, 180], [-180, 180], [0, 360], [0, 180], [-90, 90], [90, 270], [-270, 90], [-90, 270], [180, 360], [-180, 0]]) : (t === 'sin-ineq' ? aleaParmi([[0, 180], [0, 360], [-180, 180], [-90, 90], [90, 270], [-270, 90]]) : aleaParmi([[0, 360], [-180, 180], [0, 180], [-90, 90], [90, 270], [-270, 90], [-90, 270], [180, 360], [-180, 0]]));
    const loTex = ang(lo), hiTex = ang(hi);
    const tex = (op) => `\\${fn}\\left(x\\right)${{ '=': '=', '<=': '\\le', '>=': '\\ge', '<': '\\lt', '>': '\\gt' }[op]} ${cTex}`;
    if (t.endsWith('eq')) {
      const rs = racinesDeg(fn, c, lo, hi); if (!rs.length) return null;
      const ens = ds => ENS(...[...new Set(ds)].sort((a, b) => a - b).map(ang)), cle = ds => [...new Set(ds)].sort((a, b) => a - b).join(',');
      const vrai = ens(rs), bonneCle = cle(rs);
      const norm = d => ((((d - lo) % 360) + 360) % 360) + lo;
      const candDeg = [rs.map(d => norm(-d)), rs.map(d => norm(180 - d)), rs.slice(0, 1), rs.map(d => norm(d + (fn === 'cos' ? 30 : 60))), racinesDeg(fn, -c, lo, hi), rs.map(d => norm(d + 180)), rs.map(d => norm(90 - d)), rs.concat(racinesDeg(fn, -c, lo, hi))];
      const vus = new Set([bonneCle]), unique = [];
      for (const ds of candDeg) { if (!ds.length) continue; const k = cle(ds); if (vus.has(k)) continue; vus.add(k); unique.push(ens(ds)); }
      if (unique.length < 3) return null;
      return qcm(`Quel est l'ensemble des solutions de l'équation ${m(tex('='))} dans l'intervalle ${m(IV(loTex, hiTex, true, true))} ?`, texOpt(vrai), unique.slice(0, 3).map(texOpt),
        { explication: fn === 'cos' ? `${m(tex('='))} : si ${m('\\alpha')} est une solution, ${m('-\\alpha')} l'est aussi (parité de ${m(T`\cos`)}), à ${m(T`2\pi`)} près. Sur ${m(IV(loTex, hiTex, true, true))} : ${m(vrai)}.` : `${m(tex('='))} : si ${m('\\alpha')} est une solution, ${m(T`\pi-\alpha`)} l'est aussi, à ${m(T`2\pi`)} près. Sur ${m(IV(loTex, hiTex, true, true))} : ${m(vrai)}.`, meta: { tipo: 'trig-eq', fn, cTex, op: '=', loTex, hiTex } });
    }
    const op = aleaParmi(['<=', '>=', '<', '>']), morceaux = solIneq(fn, c, op, lo, hi); if (!morceaux.length) return null;
    const vrai = texEns(morceaux, op, lo, hi), opInv = { '<=': '>=', '>=': '<=', '<': '>', '>': '<' }[op], opNuance = { '<=': '<', '>=': '>', '<': '<=', '>': '>=' }[op], opCompl = { '<=': '>', '>=': '<', '<': '>=', '>': '<=' }[op];
    const autres = [texEns(solIneq(fn, c, opInv, lo, hi), opInv, lo, hi), texEns(solIneq(fn, c, opNuance, lo, hi), opNuance, lo, hi), texEns(solIneq(fn, -c, op, lo, hi), op, lo, hi), texEns(solIneq(fn, c, opCompl, lo, hi), opCompl, lo, hi),
      texEns(morceaux.slice(0, 1), op, lo, hi), texEns(morceaux.map(([a, b]) => [Math.max(lo, a - 30), Math.min(hi, b - 30)]), op, lo, hi)].filter(x => x !== vrai && x !== T`\varnothing`);
    const unique = [...new Set(autres)]; if (unique.length < 3) return null;
    return qcm(`Quel est l'ensemble des solutions de l'inéquation ${m(tex(op))} dans l'intervalle ${m(IV(loTex, hiTex, true, true))} ?`, texOpt(vrai), unique.slice(0, 3).map(texOpt),
      { explication: `On résout d'abord l'équation ${m(tex('='))} (valeurs ${racinesDeg(fn, c, lo, hi).map(d => m(ang(d))).join(', ')}), puis on lit sur le cercle (ou la courbe) les arcs où ${m(`\\${fn}\\left(x\\right)`)} est ${op[0] === '<' ? 'inférieur' : 'supérieur'}${op.length === 2 ? ' ou égal' : ' (strictement)'} à ${m(cTex)} : ${m(vrai)}.`, meta: { tipo: 'trig-eq', fn, cTex, op, loTex, hiTex } });
  }

  // ==========================================================================
  // 3. Dérivées
  // ==========================================================================
  const MODELES_DERIVEE = {
    1: [
      () => { const a = aleaParmi([2, 3, 4, -2, -3, 5]), b = aleaParmi([0, 1, 2, -1, 3]), u = P([a, 'x'], [b, '']);
        return { f: `\\sin(${u})`, d: `${coef(a)}\\cos(${u})`, faux: [`\\cos(${u})`, `${coef(-a)}\\cos(${u})`, `${coef(a)}\\sin(${u})`, `${coef(a)}\\cos(x)`], expl: `${m(T`(\sin u)'=u'\cos u`)} avec ${m(`u=${u}`)} et ${m(`u'=${a}`)}.` }; },
      () => { const a = aleaParmi([2, 3, 4, -2, -3, 5]), b = aleaParmi([0, 1, 2, -1, 3]), u = P([a, 'x'], [b, '']);
        return { f: `\\cos(${u})`, d: `${coef(-a)}\\sin(${u})`, faux: [`${coef(a)}\\sin(${u})`, `-\\sin(${u})`, `${coef(a)}\\cos(${u})`, `${coef(-a)}\\sin(x)`], expl: `${m(T`(\cos u)'=-u'\sin u`)} avec ${m(`u=${u}`)} et ${m(`u'=${a}`)}.` }; },
      () => { const a = aleaParmi([1, 2, 3, 4, -1, -2]), b = aleaParmi([2, 3, 5, -1, -2]);
        return { f: `${coef(a)}\\sin x${sgn(b)}\\cos x`.replace('+1\\cos', '+\\cos').replace('-1\\cos', '-\\cos'), d: `${coef(a)}\\cos x${sgn(-b)}\\sin x`.replace('+1\\sin', '+\\sin').replace('-1\\sin', '-\\sin'), faux: [`${coef(a)}\\cos x${sgn(b)}\\sin x`, `${coef(-a)}\\cos x${sgn(-b)}\\sin x`, `${coef(a)}\\sin x${sgn(b)}\\cos x`, `${coef(a)}\\cos x${sgn(-b)}\\cos x`].map(t => t.replace('+1\\sin', '+\\sin').replace('-1\\sin', '-\\sin').replace('+1\\cos', '+\\cos').replace('-1\\cos', '-\\cos')), expl: `${m(T`(\sin x)'=\cos x`)} et ${m(T`(\cos x)'=-\sin x`)}.` }; }
    ],
    2: [
      () => { const a = aleaParmi([1, 2, 3]), b = aleaParmi([1, 2, -1]);
        return { f: `x\\sin x`, d: `\\sin x+x\\cos x`, faux: [`\\cos x`, `\\sin x+\\cos x`, `x\\cos x`, `\\sin x-x\\cos x`], expl: `Produit ${m('uv')} avec ${m('u=x')} et ${m(T`v=\sin x`)} : ${m(T`(uv)'=\sin x+x\cos x`)}.` }; },
      () => { const k = aleaParmi([1, 2, 3, -1, -2]);
        return { f: `e^{${k === 1 ? '' : k}x}\\cos x`, d: `e^{${k === 1 ? '' : k}x}\\left(${k === 1 ? '' : k}\\cos x-\\sin x\\right)`, faux: [`-e^{${k === 1 ? '' : k}x}\\sin x`, `e^{${k === 1 ? '' : k}x}\\left(${k === 1 ? '' : k}\\cos x+\\sin x\\right)`, `${coef(k)}e^{${k === 1 ? '' : k}x}\\cos x`, `e^{${k === 1 ? '' : k}x}\\left(\\cos x-\\sin x\\right)`], expl: `Produit ${m('uv')} : ${m(T`(uv)'=${coef(k)}e^{${k}x}\cos x-e^{${k}x}\sin x`.replace('{1x}', '{x}'))}.` }; },
      () => { return { f: `\\sin x\\cos x`, d: `\\cos^2 x-\\sin^2 x`.replace('\\cos^2 x-\\sin^2 x', `\\left(\\cos x\\right)^2-\\left(\\sin x\\right)^2`), faux: [`-\\sin x\\cos x`, `\\left(\\cos x\\right)^2+\\left(\\sin x\\right)^2`, `\\cos x-\\sin x`, `2\\sin x\\cos x`], expl: `Produit ${m('uv')} avec ${m(T`u=\sin x`)} et ${m(T`v=\cos x`)} : ${m(T`(uv)'=\cos x\cos x+\sin x(-\sin x)`)}.` }; },
      () => { const a = aleaParmi([2, 3, 4]);
        return { f: `\\sin\\left(${a}x\\right)\\cos\\left(x\\right)`.replace('\\cos\\left(x\\right)', '\\cos x'), d: `${a}\\cos\\left(${a}x\\right)\\cos x-\\sin\\left(${a}x\\right)\\sin x`, faux: [`${a}\\cos\\left(${a}x\\right)\\cos x+\\sin\\left(${a}x\\right)\\sin x`, `\\cos\\left(${a}x\\right)\\cos x-\\sin\\left(${a}x\\right)\\sin x`, `${a}\\cos\\left(${a}x\\right)\\left(-\\sin x\\right)`, `${a}\\cos\\left(${a}x\\right)-\\sin x`], expl: `Produit ${m('uv')} avec ${m(`u=\\sin(${a}x)`)} et ${m(T`v=\cos x`)} : ${m(`${a}\\cos(${a}x)\\cos x-\\sin(${a}x)\\sin x`)}.` }; },
      () => { return { f: `x+\\sin x`, d: `1+\\cos x`, faux: [`1-\\cos x`, `\\cos x`, `x+\\cos x`, `1+\\sin x`], expl: `${m(T`(x)'=1`)} et ${m(T`(\sin x)'=\cos x`)}.` }; }
    ],
    3: [
      () => { return { f: `\\left(\\cos x\\right)^2`, d: `-2\\sin x\\cos x`, faux: [`2\\cos x`, `-2\\sin x`, `2\\sin x\\cos x`, `-\\left(\\sin x\\right)^2`], expl: `${m(T`(u^2)'=2u'u`)} avec ${m(T`u=\cos x`)} et ${m(T`u'=-\sin x`)}.` }; },
      () => { const a = aleaParmi([2, 3]);
        return { f: `\\sin\\left(x^${a}\\right)`.replace('x^2', 'x^2'), d: `${a}x${a === 2 ? '' : '^2'}\\cos\\left(x^${a}\\right)`.replace('2x\\cos', '2x\\cos'), faux: [`\\cos\\left(x^${a}\\right)`, `${a}x${a === 2 ? '' : '^2'}\\sin\\left(x^${a}\\right)`, `-${a}x${a === 2 ? '' : '^2'}\\cos\\left(x^${a}\\right)`, `${a}\\cos\\left(x^${a}\\right)`], expl: `${m(T`(\sin u)'=u'\cos u`)} avec ${m(`u=x^${a}`)} et ${m(`u'=${a}x${a === 2 ? '' : '^2'}`)}.` }; },
      () => { const a = aleaParmi([1, 2, 3]); return { f: fr('\\sin x', `x`), d: fr('x\\cos x-\\sin x', 'x^2'), faux: [fr('\\cos x', '1'), fr('x\\cos x+\\sin x', 'x^2'), fr('\\cos x', 'x^2'), fr('\\sin x-x\\cos x', 'x^2')], expl: `Quotient ${m(T`\dfrac{u}{v}`)} : ${m(T`\dfrac{u'v-uv'}{v^2}=\dfrac{x\cos x-\sin x}{x^2}`)}.` , sur: IV('0', INF, false, false), dom: [0.3, 3] }; },
      () => { return { f: `\\ln\\left(2+\\cos x\\right)`, d: fr('-\\sin x', '2+\\cos x'), faux: [fr('\\sin x', '2+\\cos x'), fr('-\\sin x', '1'), fr('1', '2+\\cos x'), `-\\sin x\\ln\\left(2+\\cos x\\right)`], expl: `${m(T`(\ln u)'=\dfrac{u'}{u}`)} avec ${m(T`u=2+\cos x`)} et ${m(T`u'=-\sin x`)}.` }; },
      () => { return { f: `e^{\\sin x}`, d: `\\cos x\\,e^{\\sin x}`, faux: [`e^{\\sin x}`, `\\cos x\\,e^{\\cos x}`, `-\\cos x\\,e^{\\sin x}`, `\\sin x\\,e^{\\sin x}`], expl: `${m(T`(e^{u})'=u'e^{u}`)} avec ${m(T`u=\sin x`)}.` }; }
    ]
  };
  MODELES_DERIVEE[2].push(
    () => { const a = aleaParmi([1, 2, 3, 4, -1, -2]), ab = coef(Math.abs(a)); return { f: `${coef(a)}x\\cos x`, d: `${coef(a)}\\cos x${a > 0 ? '-' : '+'}${ab}x\\sin x`, faux: [`${coef(-a)}\\sin x`, `${coef(a)}\\cos x${a > 0 ? '+' : '-'}${ab}x\\sin x`, `${coef(a)}x\\sin x`, `${coef(-a)}x\\sin x`], expl: `Produit ${m('uv')} avec ${m(`u=${coef(a)}x`)} et ${m(T`v=\cos x`)} : ${m(`(uv)'=${coef(a)}\\cos x${a > 0 ? '-' : '+'}${ab}x\\sin x`)}.` }; },
    () => { const a = aleaParmi([1, 2, 3]), b = aleaParmi([1, 2, 3, -1]); const g = P([a, 'x'], [b, '']); return { f: `(${g})\\sin x`, d: `${coef(a)}\\sin x+(${g})\\cos x`, faux: [`${coef(a)}\\cos x`, `${coef(a)}\\sin x-(${g})\\cos x`, `(${g})\\cos x`, `${coef(a)}\\cos x+(${g})\\sin x`], expl: `Produit ${m('uv')} avec ${m(`u=${g}`)} et ${m(T`v=\sin x`)}.` }; },
    () => { const a = aleaParmi([2, 3, 4]); return { f: `x^${a}\\cos x`, d: `${a}x${a === 2 ? '' : '^' + (a - 1)}\\cos x-x^${a}\\sin x`, faux: [`-${a}x${a === 2 ? '' : '^' + (a - 1)}\\sin x`, `${a}x${a === 2 ? '' : '^' + (a - 1)}\\cos x+x^${a}\\sin x`, `${a}x${a === 2 ? '' : '^' + (a - 1)}\\sin x`, `x^${a}\\cos x-${a}x${a === 2 ? '' : '^' + (a - 1)}\\sin x`], expl: `Produit ${m('uv')} avec ${m(`u=x^${a}`)} et ${m(T`v=\cos x`)}.` }; },
    () => { const a = aleaParmi([2, 3, 4, 5]); return { f: `\\sin(${a}x)+\\cos(${a}x)`, d: `${a}\\cos(${a}x)-${a}\\sin(${a}x)`, faux: [`${a}\\cos(${a}x)+${a}\\sin(${a}x)`, `\\cos(${a}x)-\\sin(${a}x)`, `-${a}\\cos(${a}x)+${a}\\sin(${a}x)`, `${a}\\cos(${a}x)-\\sin(${a}x)`], expl: `${m(T`(\sin(ax))'=a\cos(ax)`)} et ${m(T`(\cos(ax))'=-a\sin(ax)`)}.` }; }
  );
  MODELES_DERIVEE[3].push(
    () => { const a = aleaParmi([1, 2, 3]); return { f: `${coef(a)}\\left(\\sin x\\right)^3`, d: `${3 * a}\\left(\\sin x\\right)^2\\cos x`, faux: [`${3 * a}\\left(\\sin x\\right)^2`, `${3 * a}\\left(\\cos x\\right)^2\\sin x`, `${3 * a}\\left(\\sin x\\right)^2\\sin x`, `${a}\\left(\\cos x\\right)^3`], expl: `${m(T`(u^3)'=3u'u^2`)} avec ${m(T`u=\sin x`)}.` }; },
    () => { return { f: fr('\\cos x', '1+\\sin x'), d: fr('-1', '1+\\sin x'), faux: [fr('1', '1+\\sin x'), fr('-\\sin x', '1+\\sin x'), fr('-\\sin x-\\cos x', '\\left(1+\\sin x\\right)^2'), fr('\\sin x-1', '\\left(1+\\sin x\\right)^2')], expl: `Quotient : ${m(T`\dfrac{-\sin x(1+\sin x)-\cos x\cos x}{(1+\sin x)^2}=\dfrac{-\sin x-1}{(1+\sin x)^2}=\dfrac{-1}{1+\sin x}`)}.` , sur: IV(T`-\dfrac{\pi}{2}`, T`\dfrac{\pi}{2}`, false, false), dom: [-1.2, 1.2] }; },
    () => { return { f: fr('1', '\\cos x'), d: fr('\\sin x', '\\left(\\cos x\\right)^2'), faux: [fr('-\\sin x', '\\left(\\cos x\\right)^2'), fr('1', '\\left(\\cos x\\right)^2'), fr('\\sin x', '\\cos x'), '-\\sin x'], expl: `${m(T`\left(\dfrac{1}{v}\right)'=-\dfrac{v'}{v^2}`)} avec ${m(T`v=\cos x`)}.` , sur: IV(T`-\dfrac{\pi}{2}`, T`\dfrac{\pi}{2}`, false, false), dom: [-1.2, 1.2] }; },
    () => { const a = aleaParmi([1, 2, 3]); return { f: `e^{${a === 1 ? '' : a}x}\\sin x`, d: `e^{${a === 1 ? '' : a}x}\\left(${a === 1 ? '' : a}\\sin x+\\cos x\\right)`, faux: [`e^{${a === 1 ? '' : a}x}\\cos x`, `e^{${a === 1 ? '' : a}x}\\left(${a === 1 ? '' : a}\\sin x-\\cos x\\right)`, `${coef(a)}e^{${a === 1 ? '' : a}x}\\sin x`, `e^{${a === 1 ? '' : a}x}\\left(\\sin x+\\cos x\\right)`], expl: `Produit ${m('uv')} : ${m(`(uv)'=${coef(a)}e^{${a}x}\\sin x+e^{${a}x}\\cos x`.replace('{1x}', '{x}'))}.` }; },
    () => { return { f: `\\ln\\left(\\sin x\\right)`, d: fr('\\cos x', '\\sin x'), faux: [fr('\\sin x', '\\cos x'), fr('1', '\\sin x'), '\\cos x', fr('-\\cos x', '\\sin x')], expl: `${m(T`(\ln u)'=\dfrac{u'}{u}`)} avec ${m(T`u=\sin x`)} (défini là où ${m(T`\sin x>0`)}).`, dom: [0.3, 2.8], sur: IV('0', T`\pi`, false, false) }; }
  );
  MODELES_DERIVEE[3].push(
    () => { const a = aleaParmi([2, 3, 4]), t = aleaParmi(['sin', 'cos']); const g = `${a}+\\${t} x`, dg = t === 'sin' ? '\\cos x' : '-\\sin x';
      return { f: `\\ln\\left(${g}\\right)`, d: fr(dg, g), faux: [fr(`\\${t === 'sin' ? 'cos' : 'sin'} x`, g), fr('1', g), fr(dg, String(a)), `${dg}\\ln\\left(${g}\\right)`], expl: `${m(T`(\\ln u)'=\\dfrac{u'}{u}`)} avec ${m(`u=${g}`)} (strictement positif).` }; },
    () => { const a = aleaParmi([1, 2, 3]), t = aleaParmi(['sin', 'cos']); const dg = t === 'sin' ? `${coef(a)}\\cos x` : `${coef(-a)}\\sin x`;
      return { f: `e^{${coef(a)}\\${t} x}`, d: `${dg}\\,e^{${coef(a)}\\${t} x}`, faux: [`e^{${coef(a)}\\${t} x}`, `${t === 'sin' ? coef(-a) + '\\sin x' : coef(a) + '\\cos x'}\\,e^{${coef(a)}\\${t} x}`, `${dg}\\,e^{${dg}}`, `${a}e^{${coef(a)}\\${t} x}`], expl: `${m(T`(e^{u})'=u'e^{u}`)} avec ${m(`u=${coef(a)}\\${t} x`)}.` }; },
    () => { const a = aleaParmi([2, 3, 4]); return { f: fr('\\sin x', `${a}+\\cos x`), d: fr(`${a}\\cos x+1`, `\\left(${a}+\\cos x\\right)^2`), faux: [fr(`${a}\\cos x-1`, `\\left(${a}+\\cos x\\right)^2`), fr('\\cos x', `${a}+\\cos x`), fr(`${a}\\cos x+1`, `${a}+\\cos x`), fr('\\cos x', `-\\sin x`)], expl: `Quotient : ${m(`\\dfrac{\\cos x(${a}+\\cos x)+\\sin x\\sin x}{(${a}+\\cos x)^2}=\\dfrac{${a}\\cos x+1}{(${a}+\\cos x)^2}`)}.` }; },
    () => { const n = aleaParmi([4, 5]); return { f: `\\left(\\cos x\\right)^${n}`, d: `-${n}\\left(\\cos x\\right)^${n - 1}\\sin x`, faux: [`${n}\\left(\\cos x\\right)^${n - 1}\\sin x`, `-${n}\\left(\\cos x\\right)^${n - 1}`, `-${n}\\left(\\sin x\\right)^${n - 1}\\cos x`, `-\\left(\\sin x\\right)^${n}`], expl: `${m(T`(u^n)'=nu'u^{n-1}`)} avec ${m(T`u=\\cos x`)} et ${m(T`u'=-\\sin x`)}.` }; }
  );
  MODELES_DERIVEE[2].push(
    () => { const b = aleaParmi([2, 3, 4, 5]); return { f: `x\\sin(${b}x)`, d: `\\sin(${b}x)+${b}x\\cos(${b}x)`, faux: [`${b}\\cos(${b}x)`, `\\sin(${b}x)+x\\cos(${b}x)`, `\\sin(${b}x)-${b}x\\cos(${b}x)`, `${b}x\\cos(${b}x)`], expl: `Produit ${m('uv')} avec ${m('u=x')} et ${m(`v=\\sin(${b}x)`)} : ${m(`(uv)'=\\sin(${b}x)+x\\times ${b}\\cos(${b}x)`)}.` }; },
    () => { const b = aleaParmi([2, 3, 4]); return { f: `\\cos(${b}x)\\sin x`, d: `\\cos(${b}x)\\cos x-${b}\\sin(${b}x)\\sin x`, faux: [`\\cos(${b}x)\\cos x+${b}\\sin(${b}x)\\sin x`, `-${b}\\sin(${b}x)\\cos x`, `\\cos(${b}x)\\cos x-\\sin(${b}x)\\sin x`, `${b}\\sin(${b}x)\\sin x`], expl: `Produit ${m('uv')} avec ${m(`u=\\cos(${b}x)`)} et ${m(T`v=\\sin x`)}.` }; },
    () => { const k = aleaParmi([1, 2, 3]), b = aleaParmi([2, 3]); const e = `e^{${k === 1 ? '' : k}x}`; return { f: `${e}\\sin(${b}x)`, d: `${e}\\left(${coef(k)}\\sin(${b}x)+${b}\\cos(${b}x)\\right)`, faux: [`${e}\\left(${coef(k)}\\sin(${b}x)-${b}\\cos(${b}x)\\right)`, `${b}${e}\\cos(${b}x)`, `${e}\\left(\\sin(${b}x)+${b}\\cos(${b}x)\\right)`, `${e}\\left(${coef(k)}\\cos(${b}x)+${b}\\sin(${b}x)\\right)`].filter((t, i) => !(k === 1 && i === 2)), expl: `Produit ${m('uv')} : ${m(`(uv)'=${coef(k)}${e}\\sin(${b}x)+${e}\\times ${b}\\cos(${b}x)`)}.` }; },
    () => { const a = aleaParmi([1, 2, 3]); return { f: `(x^2+${a})\\cos x`, d: `2x\\cos x-(x^2+${a})\\sin x`, faux: [`2x\\cos x+(x^2+${a})\\sin x`, `-2x\\sin x`, `2x\\cos x-x^2\\sin x`, `(x^2+${a})\\cos x-2x\\sin x`], expl: `Produit ${m('uv')} avec ${m(`u=x^2+${a}`)} et ${m(T`v=\\cos x`)}.` }; }
  );
  // modèles supplémentaires (18/10/2026) : plus de produits, quotients et composées, avec leur ensemble de définition
  const XP = a => (a === 2 ? 'x' : `x^${a - 1}`);
  const UNSURX = '\\dfrac{1}{x}', SUR_POS = IV('0', INF, false, false), SUR_PI = IV('0', T`\pi`, false, false), SUR_DEMI = IV(T`-\dfrac{\pi}{2}`, T`\dfrac{\pi}{2}`, false, false);
  MODELES_DERIVEE[2].push(
    () => { const a = aleaParmi([2, 3, 4]); return { f: `x^${a}\\sin x`, d: `${a}${XP(a)}\\sin x+x^${a}\\cos x`, faux: [`${a}${XP(a)}\\cos x`, `${a}${XP(a)}\\sin x-x^${a}\\cos x`, `x^${a}\\cos x`, `${a}${XP(a)}\\sin x+${a}${XP(a)}\\cos x`], expl: `Produit ${m('uv')} avec ${m(`u=x^${a}`)} et ${m(T`v=\sin x`)} : ${m(`(uv)'=${a}${XP(a)}\\sin x+x^${a}\\cos x`)}.` }; },
    () => { const a = aleaParmi([2, 3, 4, 5]); return { f: `x\\cos(${a}x)`, d: `\\cos(${a}x)-${a}x\\sin(${a}x)`, faux: [`\\cos(${a}x)+${a}x\\sin(${a}x)`, `-${a}\\sin(${a}x)`, `\\cos(${a}x)-x\\sin(${a}x)`, `-${a}x\\sin(${a}x)`], expl: `Produit ${m('uv')} avec ${m('u=x')} et ${m(`v=\\cos(${a}x)`)} : ${m(`(uv)'=\\cos(${a}x)+x\\times(-${a}\\sin(${a}x))`)}.` }; },
    () => { const a = aleaParmi([1, 2, 3, 4]); return { f: `${coef(a)}x\\sin x+${coef(a)}\\cos x`, d: `${coef(a)}x\\cos x`, faux: [`${coef(a)}\\sin x+${coef(a)}x\\cos x`, `${coef(a)}x\\cos x-${coef(a)}\\sin x`, `-${coef(a)}x\\cos x`, `${coef(a)}x\\sin x`], expl: `${m(`(${coef(a)}x\\sin x)'=${coef(a)}\\sin x+${coef(a)}x\\cos x`)} et ${m(`(${coef(a)}\\cos x)'=-${coef(a)}\\sin x`)} : les termes en ${m(T`\sin x`)} se compensent.` }; },
    () => { const a = aleaParmi([1, 2, 3, 4]); return { f: `${coef(a)}\\sin x-${coef(a)}x\\cos x`, d: `${coef(a)}x\\sin x`, faux: [`${coef(a)}x\\cos x`, `${coef(a)}\\cos x-${coef(a)}x\\sin x`, `-${coef(a)}x\\sin x`, `${2 * a}\\cos x-${coef(a)}x\\sin x`], expl: `${m(`(${coef(a)}\\sin x)'=${coef(a)}\\cos x`)} et ${m(`(${coef(a)}x\\cos x)'=${coef(a)}\\cos x-${coef(a)}x\\sin x`)} : la différence vaut ${m(`${coef(a)}x\\sin x`)}.` }; },
    () => { const a = aleaParmi([2, 3, 4, 5]), t = aleaParmi(['sin', 'cos']), u = T`\dfrac{x}{${a}}`, dd = t === 'sin' ? T`\dfrac{1}{${a}}\cos\left(${u}\right)` : T`-\dfrac{1}{${a}}\sin\left(${u}\right)`;
      return { f: `\\${t}\\left(${u}\\right)`, d: dd, faux: [t === 'sin' ? `${a}\\cos\\left(${u}\\right)` : `-${a}\\sin\\left(${u}\\right)`, `\\${t === 'sin' ? 'cos' : 'sin'}\\left(${u}\\right)`, t === 'sin' ? T`-\dfrac{1}{${a}}\cos\left(${u}\right)` : T`\dfrac{1}{${a}}\sin\left(${u}\right)`, T`\dfrac{1}{${a}}\${t}\left(${u}\right)`], expl: `${m(T`(\${t} u)'=${t === 'sin' ? '' : '-'}u'\${t === 'sin' ? 'cos' : 'sin'} u`)} avec ${m(`u=${u}`)} et ${m(T`u'=\dfrac{1}{${a}}`)}.` }; },
    () => { const a = aleaParmi([2, 3, 4]), b = aleaParmi([2, 3, 4]); return { f: `${a}x^2+\\cos(${b}x)`, d: `${2 * a}x-${b}\\sin(${b}x)`, faux: [`${2 * a}x+${b}\\sin(${b}x)`, `${a}x-${b}\\sin(${b}x)`, `${2 * a}x-\\sin(${b}x)`, `${2 * a}x-${b}\\cos(${b}x)`], expl: `${m(`(${a}x^2)'=${2 * a}x`)} et ${m(`(\\cos(${b}x))'=-${b}\\sin(${b}x)`)}.` }; }
  );
  MODELES_DERIVEE[3].push(
    () => { return { f: fr('\\cos x', 'x'), d: fr('-x\\sin x-\\cos x', 'x^2'), faux: [fr('-\\sin x', 'x^2'), fr('-x\\sin x+\\cos x', 'x^2'), fr('x\\sin x-\\cos x', 'x^2'), fr('-\\sin x', '1')], expl: `Quotient : ${m(T`\dfrac{-\sin x\times x-\cos x\times 1}{x^2}`)}.`, sur: SUR_POS, dom: [0.3, 3] }; },
    () => { return { f: fr('x', '\\sin x'), d: fr('\\sin x-x\\cos x', '\\left(\\sin x\\right)^2'), faux: [fr('\\sin x+x\\cos x', '\\left(\\sin x\\right)^2'), fr('x\\cos x-\\sin x', '\\left(\\sin x\\right)^2'), fr('1', '\\cos x'), fr('\\sin x-x\\cos x', '\\sin x')], expl: `Quotient : ${m(T`\dfrac{1\times\sin x-x\cos x}{(\sin x)^2}`)}.`, sur: SUR_PI, dom: [0.3, 2.8] }; },
    () => { return { f: `\\ln\\left(\\cos x\\right)`, d: fr('-\\sin x', '\\cos x'), faux: [fr('\\sin x', '\\cos x'), fr('1', '\\cos x'), '-\\sin x', fr('-\\cos x', '\\sin x')], expl: `${m(T`(\ln u)'=\dfrac{u'}{u}`)} avec ${m(T`u=\cos x`)} (strictement positif sur cet intervalle).`, sur: SUR_DEMI, dom: [-1.2, 1.2] }; },
    () => { const a = aleaParmi([2, 3, 4]), t = aleaParmi(['sin', 'cos']); return { f: `\\sqrt{${a}+\\${t} x}`, d: fr(t === 'sin' ? '\\cos x' : '-\\sin x', `2\\sqrt{${a}+\\${t} x}`), faux: [fr(t === 'sin' ? '\\cos x' : '-\\sin x', `\\sqrt{${a}+\\${t} x}`), fr(t === 'sin' ? '-\\cos x' : '\\sin x', `2\\sqrt{${a}+\\${t} x}`), fr('1', `2\\sqrt{${a}+\\${t} x}`), fr(t === 'sin' ? '\\cos x' : '-\\sin x', `2\\sqrt{${a}+${t === 'sin' ? '\\cos' : '\\sin'} x}`)], expl: `${m(T`(\sqrt{u})'=\dfrac{u'}{2\sqrt{u}}`)} avec ${m(`u=${a}+\\${t} x`)} (strictement positif).` }; },
    () => { const t = aleaParmi(['sin', 'cos']), e = 'e^{-x}'; return { f: `\\${t} x\\,${e}`, d: t === 'sin' ? `${e}\\left(\\cos x-\\sin x\\right)` : `-${e}\\left(\\sin x+\\cos x\\right)`, faux: t === 'sin' ? [`${e}\\left(\\cos x+\\sin x\\right)`, `-${e}\\cos x`, `\\cos x\\,${e}`, `${e}\\left(\\sin x-\\cos x\\right)`] : [`${e}\\left(\\sin x-\\cos x\\right)`, `-\\sin x\\,${e}`, `${e}\\left(\\sin x+\\cos x\\right)`, `-${e}\\cos x`], expl: `Produit ${m('uv')} avec ${m(`u=\\${t} x`)} et ${m(`v=${e}`)} : ${m(`(uv)'=${t === 'sin' ? '\\cos x' : '-\\sin x'}${e}-\\${t} x\\,${e}`)}.` }; },
    () => { const a = aleaParmi([2, 3]); return { f: `\\cos\\left(x^${a}\\right)`, d: `-${a}${a === 2 ? 'x' : 'x^2'}\\sin\\left(x^${a}\\right)`, faux: [`${a}${a === 2 ? 'x' : 'x^2'}\\sin\\left(x^${a}\\right)`, `-\\sin\\left(x^${a}\\right)`, `-${a}${a === 2 ? 'x' : 'x^2'}\\cos\\left(x^${a}\\right)`, `${a}${a === 2 ? 'x' : 'x^2'}\\cos\\left(x^${a}\\right)`], expl: `${m(T`(\cos u)'=-u'\sin u`)} avec ${m(`u=x^${a}`)} et ${m(`u'=${a}${a === 2 ? 'x' : 'x^2'}`)}.` }; },
    () => { const t = aleaParmi(['sin', 'cos']), c = `\\${t}\\left(${UNSURX}\\right)`, o = `\\${t === 'sin' ? 'cos' : 'sin'}\\left(${UNSURX}\\right)`; return { f: c, d: t === 'sin' ? fr(`-${o}`, 'x^2') : fr(o, 'x^2'), faux: t === 'sin' ? [fr(o, 'x^2'), `-${o}`, fr(`-${c}`, 'x^2'), fr(`-${o}`, 'x')] : [fr(`-${o}`, 'x^2'), o, fr(c, 'x^2'), fr(o, 'x')], expl: `${m(t === 'sin' ? T`(\sin u)'=u'\cos u` : T`(\cos u)'=-u'\sin u`)} avec ${m(`u=${UNSURX}`)} et ${m(T`u'=-\dfrac{1}{x^2}`)}.`, sur: SUR_POS, dom: [0.3, 3] }; },
    () => { const t = aleaParmi(['sin', 'cos']), o = `\\left(\\${t} x\\right)^2`, g = `1+${o}`; return { f: `\\ln\\left(${g}\\right)`, d: fr(t === 'sin' ? '2\\sin x\\cos x' : '-2\\sin x\\cos x', g), faux: [fr(t === 'sin' ? '2\\cos x' : '-2\\sin x', g), fr(t === 'sin' ? '\\sin x\\cos x' : '-\\sin x\\cos x', g), fr(t === 'sin' ? '2\\sin x\\cos x' : '-2\\sin x\\cos x', `\\left(${g}\\right)^2`), `${t === 'sin' ? '2\\sin x\\cos x' : '-2\\sin x\\cos x'}\\ln\\left(${g}\\right)`], expl: `${m(T`(\ln u)'=\dfrac{u'}{u}`)} avec ${m(`u=${g}`)} et ${m(`u'=${t === 'sin' ? '2\\sin x\\cos x' : '-2\\sin x\\cos x'}`)}.` }; }
  );
  function derivee(niveau) {
    const mo = aleaParmi(niveau === 3 ? MODELES_DERIVEE[3].concat(MODELES_DERIVEE[2]) : MODELES_DERIVEE[niveau])();
    const faux = mo.faux.filter((t, i, a) => t !== mo.d && a.indexOf(t) === i);
    if (faux.length < 3) return null;
    return qcm(`On considère la fonction ${m('f')} définie sur ${m(mo.sur || T`\mathbb{R}`)} par ${m(`f(x)=${mo.f}`)}. Quelle est l'expression de ${m("f'(x)")} ?`, texOpt(`f'(x)=${mo.d}`), faux.slice(0, 3).map(t => texOpt(`f'(x)=${t}`)), { explication: mo.expl, meta: { tipo: 'derivee', fTex: mo.f, dom: mo.dom || [-2.5, 2.5] } });
  }

  // ==========================================================================
  // 4. Parité et périodicité
  // ==========================================================================
  const PAIRES = ['\\cos x', 'x\\sin x', 'x^2\\cos x', '\\cos(2x)', '\\left(\\sin x\\right)^2', 'x^2+\\cos x', '|x|\\cos x'.replace('|x|', 'x^4'), '\\cos(3x)+1', 'x\\sin(2x)', '\\cos x\\cos(2x)'];
  const IMPAIRES = ['\\sin x', 'x\\cos x', 'x^3', '\\sin(3x)', 'x\\cos(3x)', 'x\\cos(2x)', '\\sin x\\cos x', 'x^2\\sin x', '\\sin x+x', 'x^3\\cos x'];
  function parite() {
    const paire = Math.random() < 0.5, vraies = paire ? PAIRES : IMPAIRES, fausses = paire ? IMPAIRES : PAIRES;
    const bonne = aleaParmi(vraies), faux = melanger(fausses).slice(0, 3);
    return qcm(`Soit ${m('f')} une fonction définie sur ${m(T`\mathbb{R}`)}. Laquelle de ces fonctions est ${paire ? 'paire' : 'impaire'} ?`, texOpt(`f(x)=${bonne}`), faux.map(t => texOpt(`f(x)=${t}`)),
      { explication: `On compare ${m('f(-x)')} à ${m('f(x)')} : ${paire ? `une fonction paire vérifie ${m('f(-x)=f(x)')}` : `une fonction impaire vérifie ${m('f(-x)=-f(x)')}`}. Rappels : ${m(T`\cos`)} est paire, ${m(T`\sin`)} est impaire, ${m('x^n')} a la parité de ${m('n')}, et le produit de deux fonctions de même parité est pair, de parités différentes impair.`, meta: { tipo: 'parite', paire } });
  }
  function periode() {
    const t = aleaParmi(['cos', 'sin', 'cos', 'sin', 'cos-dec', 'sin-dec']), a = aleaParmi([2, 3, 4, 5, 6, 8, 10]), b = alea(1, 3);
    const f = t === 'cos' ? `\\cos(${a}x)` : t === 'sin' ? `\\sin(${a}x)` : t === 'cos-dec' ? `\\cos(${a}x+${b})` : `\\sin(${a}x-${b})`;
    const pt = (n, d) => { const g = pgcd(n, d), nn = n / g, dd = d / g; return { tex: dd === 1 ? (nn === 1 ? T`\pi` : `${nn}\\pi`) : fr(nn === 1 ? T`\pi` : `${nn}\\pi`, String(dd)), v: n / d }; };
    const vrai = pt(2, a), vus = new Set([vrai.tex]), faux = [];
    for (const c of [pt(2, 1), pt(1, a), pt(a, 1), pt(2, a + 1), pt(1, 1), pt(4, a), pt(2 * a, 1), pt(2, a - 1), pt(1, 2 * a)]) { if (Math.abs(c.v - vrai.v) < 1e-9 || vus.has(c.tex)) continue; vus.add(c.tex); faux.push(c.tex); }
    return qcm(`Quelle est la plus petite période positive de la fonction ${m(`x\\mapsto ${f}`)} ?`, texOpt(vrai.tex), faux.slice(0, 3).map(texOpt),
      { explication: `${m(T`x\mapsto\cos(ax+b)`)} et ${m(T`x\mapsto\sin(ax+b)`)} ont pour plus petite période ${m(T`\dfrac{2\pi}{a}`)} : ici ${m(`\\dfrac{2\\pi}{${a}}=${vrai.tex}`)}.`, meta: { tipo: 'periode', fTex: f } });
  }

  // ==========================================================================
  // 5. Étude de fonctions : extremum, signe de f', concavité
  // ==========================================================================
  // f et sa dérivée (fonction JavaScript fpn, en x radians) ; étude sur [0 ; π]
  const MODELES_ETUDE = [
    () => { const k = aleaParmi([1, 2, 3, 4]); return { f: `${coef(k)}x+${2 * k}\\cos x`, fp: `${k}-${2 * k}\\sin x`, fpn: x => k - 2 * k * Math.sin(x), expl: `${m(`f'(x)=${k}-${2 * k}\\sin x=${k}\\left(1-2\\sin x\\right)`)}.` }; },
    () => { const k = aleaParmi([1, 2, 3]); return { f: `${2 * k}\\sin x-${coef(k)}x`, fp: `${2 * k}\\cos x-${k}`, fpn: x => 2 * k * Math.cos(x) - k, expl: `${m(`f'(x)=${2 * k}\\cos x-${k}=${k}\\left(2\\cos x-1\\right)`)}.` }; },
    () => { return { f: `x+\\sqrt{2}\\sin x`, fp: `1+\\sqrt{2}\\cos x`, fpn: x => 1 + Math.SQRT2 * Math.cos(x), expl: `${m(T`f'(x)=1+\sqrt{2}\cos x`)}, qui s'annule lorsque ${m(T`\cos x=-\dfrac{\sqrt{2}}{2}`)}.` }; },
    () => { return { f: `x-\\sqrt{2}\\sin x`, fp: `1-\\sqrt{2}\\cos x`, fpn: x => 1 - Math.SQRT2 * Math.cos(x), expl: `${m(T`f'(x)=1-\sqrt{2}\cos x`)}, qui s'annule lorsque ${m(T`\cos x=\dfrac{\sqrt{2}}{2}`)}.` }; },
    () => { return { f: `\\sqrt{3}x+2\\cos x`, fp: `\\sqrt{3}-2\\sin x`, fpn: x => Math.sqrt(3) - 2 * Math.sin(x), expl: `${m(T`f'(x)=\sqrt{3}-2\sin x`)}, qui s'annule lorsque ${m(T`\sin x=\dfrac{\sqrt{3}}{2}`)}.` }; },
    () => { return { f: `\\sqrt{3}x-2\\sin x`, fp: `\\sqrt{3}-2\\cos x`, fpn: x => Math.sqrt(3) - 2 * Math.cos(x), expl: `${m(T`f'(x)=\sqrt{3}-2\cos x`)}, qui s'annule lorsque ${m(T`\cos x=\dfrac{\sqrt{3}}{2}`)}.` }; },
    () => { const k = aleaParmi([1, 2, 3]); return { f: `${coef(k)}x-${2 * k}\\sin x`, fp: `${k}-${2 * k}\\cos x`, fpn: x => k - 2 * k * Math.cos(x), expl: `${m(`f'(x)=${k}-${2 * k}\\cos x=${k}\\left(1-2\\cos x\\right)`)}.` }; },
    () => { return { f: `\\sqrt{2}x+2\\cos x`, fp: `\\sqrt{2}-2\\sin x`, fpn: x => Math.SQRT2 - 2 * Math.sin(x), expl: `${m(T`f'(x)=\sqrt{2}-2\sin x`)}, qui s'annule lorsque ${m(T`\sin x=\dfrac{\sqrt{2}}{2}`)}.` }; },
    () => { return { f: `\\sqrt{2}x-2\\sin x`, fp: `\\sqrt{2}-2\\cos x`, fpn: x => Math.SQRT2 - 2 * Math.cos(x), expl: `${m(T`f'(x)=\sqrt{2}-2\cos x`)}, qui s'annule lorsque ${m(T`\cos x=\dfrac{\sqrt{2}}{2}`)}.` }; },
    () => { const k = aleaParmi([1, 2, 3]); return { f: `${coef(k)}\\sin x+${coef(k)}\\cos x`, fp: `${coef(k)}\\cos x-${coef(k)}\\sin x`, fpn: x => k * Math.cos(x) - k * Math.sin(x), expl: `${m(`f'(x)=${k === 1 ? '' : k}\\left(\\cos x-\\sin x\\right)`)}, qui s'annule lorsque ${m(T`\cos x=\sin x`)}.` }; },
    () => { const k = aleaParmi([1, 2, 3]); return { f: `${coef(k)}\\sin x-${coef(k)}\\cos x`, fp: `${coef(k)}\\cos x+${coef(k)}\\sin x`, fpn: x => k * Math.cos(x) + k * Math.sin(x), expl: `${m(`f'(x)=${k === 1 ? '' : k}\\left(\\cos x+\\sin x\\right)`)}, qui s'annule lorsque ${m(T`\cos x=-\sin x`)}.` }; },
    () => { return { f: `\\sin x\\cos x`, fp: `\\cos(2x)`, fpn: x => Math.cos(2 * x), expl: `${m(T`f'(x)=\cos^2x-\sin^2x=\cos(2x)`)}, qui s'annule lorsque ${m(T`2x=\dfrac{\pi}{2}+k\pi`)}.` }; },
    () => { return { f: `\\sin(2x)-x`, fp: `2\\cos(2x)-1`, fpn: x => 2 * Math.cos(2 * x) - 1, expl: `${m(T`f'(x)=2\cos(2x)-1`)}, qui s'annule lorsque ${m(T`\cos(2x)=\dfrac{1}{2}`)}.` }; },
    () => { return { f: `x-\\sin(2x)`, fp: `1-2\\cos(2x)`, fpn: x => 1 - 2 * Math.cos(2 * x), expl: `${m(T`f'(x)=1-2\cos(2x)`)}, qui s'annule lorsque ${m(T`\cos(2x)=\dfrac{1}{2}`)}.` }; },
    () => { return { f: `\\left(\\sin x\\right)^2`, fp: `\\sin(2x)`, fpn: x => Math.sin(2 * x), expl: `${m(T`f'(x)=2\sin x\cos x=\sin(2x)`)}.` }; },
    () => { const k = aleaParmi([1, 2, 3]); return { f: `${coef(k)}x+${2 * k}\\sin x`, fp: `${k}+${2 * k}\\cos x`, fpn: x => k + 2 * k * Math.cos(x), expl: `${m(`f'(x)=${k}+${2 * k}\\cos x=${k}\\left(1+2\\cos x\\right)`)}.` }; },
    () => { const k = aleaParmi([1, 2, 3]); return { f: `${coef(k)}x-${2 * k}\\cos x`, fp: `${k}+${2 * k}\\sin x`, fpn: x => k + 2 * k * Math.sin(x), expl: `${m(`f'(x)=${k}+${2 * k}\\sin x=${k}\\left(1+2\\sin x\\right)`)}.` }; }
  ];
  function etude(niveau) {
    const mo = aleaParmi(MODELES_ETUDE)(), t = niveau === 2 ? aleaParmi(['extremum', 'extremum', 'signe']) : aleaParmi(['signe', 'extremum']);
    const [lo, hi] = aleaParmi(niveau === 2 ? [[0, 180], [0, 180], [-180, 180], [0, 360]] : [[0, 180], [-180, 180], [0, 360], [-90, 90]]);
    const loTex = ang(lo), hiTex = ang(hi), d = x => mo.fpn(rad(x)), milieu = (lo + hi) / 2;
    const rs = []; for (let x = lo + 15; x < hi; x += 15) if (Math.abs(d(x)) < 1e-9 && d(x - 1) * d(x + 1) < 0) rs.push(x);
    if (!rs.length) return null;
    const signeEn = x => d(x) >= 0;
    const dans = x => x > lo && x < hi;
    if (t === 'extremum') {
      const maxima = rs.filter(r => d(r - 1) > 0 && d(r + 1) < 0), minima = rs.filter(r => d(r - 1) < 0 && d(r + 1) > 0);
      const possibles = [].concat(maxima.length === 1 ? ['max'] : [], minima.length === 1 ? ['min'] : []); if (!possibles.length) return null;
      const estMax = aleaParmi(possibles) === 'max', r = (estMax ? maxima : minima)[0];
      const vrai = ang(r), val = x => ang(x), ok = [-r, lo + hi - r, r / 2, r + 30, r - 30, 90, 60, 30, 120, 45, -90, -30, -60, 150, 135, 0].concat(rs).filter(x => dans(x) && x !== r).map(val).filter((x, i, A) => A.indexOf(x) === i);
      if (ok.length < 3) return null;
      return qcm(`On considère la fonction ${m('f')} définie sur ${m(IV(loTex, hiTex, true, true))} par ${m(`f(x)=${mo.f}`)}. En quelle valeur ${m('x')} de ${m(IV(loTex, hiTex, false, false))} la fonction ${m('f')} admet-elle ${estMax ? 'un maximum local' : 'un minimum local'} ?`, texOpt(vrai), melanger(ok).slice(0, 3).map(texOpt),
        { explication: `${mo.expl} Dans ${m(IV(loTex, hiTex, false, false))}, ${m("f'")} s'annule en ${rs.map(x => m(ang(x))).join(', ')} ; en ${m(vrai)} ${m("f'")} passe de ${estMax ? 'positive à négative' : 'négative à positive'} : ${estMax ? 'maximum' : 'minimum'} local en ${m(vrai)}.`, meta: { tipo: 'etude', fTex: mo.f, fpTex: mo.fp, ask: estMax ? 'max' : 'min', lo, hi } });
    }
    const bords = [lo].concat(rs, [hi]), pos = [], neg = [];
    for (let i = 0; i + 1 < bords.length; i++) { const cible = signeEn((bords[i] + bords[i + 1]) / 2) ? pos : neg, dernier = cible[cible.length - 1]; if (dernier && dernier[1] === bords[i]) dernier[1] = bords[i + 1]; else cible.push([bords[i], bords[i + 1]]); }
    const mk = ms => { ms = ms.filter(([a, b]) => b > a); return ms.length ? UNION(...ms.map(([a, b]) => IV(ang(a), ang(b), true, true))) : null; };
    const vrai = mk(pos), cl = [mk(neg), mk(pos.slice(0, 1)), mk(pos.map(([a, b]) => [Math.max(lo, a - 30), Math.min(hi, b - 30)])), mk(pos.map(([a, b]) => [lo + hi - b, lo + hi - a])), mk([[lo, milieu]]), mk([[milieu, hi]]), mk(pos.map(([a, b]) => [Math.max(lo, a + 30), Math.min(hi, b + 30)]))].filter((x, i, A) => x && x !== vrai && A.indexOf(x) === i);
    if (!vrai || cl.length < 3) return null;
    return qcm(`On considère la fonction ${m('f')} définie sur ${m(IV(loTex, hiTex, true, true))} par ${m(`f(x)=${mo.f}`)}. Sur quel ensemble a-t-on ${m("f'(x)\\ge 0")} ?`, texOpt(vrai), cl.slice(0, 3).map(texOpt),
      { explication: `${mo.expl} On étudie le signe de ${m("f'(x)")} : ${m("f'(x)\\ge 0")} sur ${m(vrai)}.`, meta: { tipo: 'etude', fTex: mo.f, fpTex: mo.fp, ask: 'signe', lo, hi } });
  }
  function concavite() {
    const k = aleaParmi([1, 2, 3]), t = aleaParmi(['s', 'c']), signe = aleaParmi([1, -1]);
    const f = `${coef(k)}x${signe > 0 ? '+' : '-'}\\${t === 's' ? 'sin' : 'cos'} x`;
    const intervalles = [[0, 180], [180, 360], [-180, 0], [-90, 90], [90, 270], [0, 90]];
    const num = x => (t === 's' ? -Math.sin(rad(x)) : -Math.cos(rad(x))) * signe;            // f''(x)
    const ok = (a, b) => { for (let d = a + 1; d < b; d += 5) if (num(d) > 1e-9) return false; return true; };
    const bonnes = intervalles.filter(([a, b]) => ok(a, b)), mauvaises = intervalles.filter(([a, b]) => !ok(a, b));
    if (!bonnes.length || mauvaises.length < 3) return null;
    const [a0, b0] = aleaParmi(bonnes);
    return qcm(`On considère la fonction ${m('f')} définie sur ${m(T`\mathbb{R}`)} par ${m(`f(x)=${f}`)}. Sur lequel de ces intervalles la fonction ${m('f')} est-elle concave ?`, texOpt(IV(ang(a0), ang(b0), true, true)), melanger(mauvaises).slice(0, 3).map(([a, b]) => texOpt(IV(ang(a), ang(b), true, true))),
      { explication: `${m(`f''(x)=${signe > 0 ? '-' : ''}\\${t === 's' ? 'sin' : 'cos'} x`)}. ${m('f')} est concave là où ${m("f''(x)\\le 0")}, c'est-à-dire sur ${m(IV(ang(a0), ang(b0), true, true))}.`, meta: { tipo: 'concavite', fTex: f } });
  }
  const etudeFamille = niveau => (niveau === 3 && Math.random() < 0.5 ? concavite() : etude(niveau));

  // ==========================================================================
  // 6. Limites
  // ==========================================================================
  const MODELES_LIMITE = {
    2: [
      { f: fr('\\sin x', 'x'), at: '0', v: 1, vt: '1' }, { f: fr('\\sin(2x)', 'x'), at: '0', v: 2, vt: '2' }, { f: fr('\\sin(3x)', 'x'), at: '0', v: 3, vt: '3' },
      { f: fr('\\sin x', 'x'), at: 'inf', v: 0, vt: '0' }, { f: fr('\\cos x', 'x'), at: 'inf', v: 0, vt: '0' }, { f: fr('\\tan x', 'x'), at: '0', v: 1, vt: '1' },
      { f: fr('\\sin x', '2x'), at: '0', v: 0.5, vt: fr('1', '2') }, { f: fr('1-\\cos x', 'x'), at: '0', v: 0, vt: '0' }, { f: fr('\\sin(5x)', 'x'), at: '0', v: 5, vt: '5' }
    ],
    3: [
      { f: fr('1-\\cos x', 'x^2'), at: '0', v: 0.5, vt: fr('1', '2') }, { f: fr('\\sin(2x)', '\\sin(3x)'), at: '0', v: 2 / 3, vt: fr('2', '3') }, { f: fr('\\sin(3x)', '\\sin(2x)'), at: '0', v: 1.5, vt: fr('3', '2') },
      { f: 'x\\sin\\left(\\dfrac{1}{x}\\right)', at: 'inf', v: 1, vt: '1' }, { f: fr('x+\\sin x', 'x'), at: 'inf', v: 1, vt: '1' }, { f: 'x+\\sin x', at: 'inf', v: Infinity, vt: INF },
      { f: fr('\\sin x', 'x^2'), at: '0+', v: Infinity, vt: INF }, { f: fr('\\sin(x^2)', 'x^2'), at: '0', v: 1, vt: '1' }, { f: fr('x^2+\\cos x', 'x^2+1'), at: 'inf', v: 1, vt: '1' }, { f: fr('\\cos x-1', 'x^2'), at: '0', v: -0.5, vt: T`-\dfrac{1}{2}` },
      { f: 'x-\\sin x', at: 'inf', v: Infinity, vt: INF }, { f: fr('\\sin x-x', 'x^3'), at: '0', v: -1 / 6, vt: T`-\dfrac{1}{6}` }
    ]
  };
  (function () {                                // modèles paramétrés
    const frac = (a, b) => { const g = pgcd(Math.abs(a), b); return { n: a / g, d: b / g, v: a / b }; }, tx = r => (r.d === 1 ? String(r.n) : fr(String(r.n), String(r.d)));
    for (const a of [2, 3, 4, 5, 6, 7]) MODELES_LIMITE[2].push({ f: fr(`\\sin(${a}x)`, 'x'), at: '0', v: a, vt: String(a) }, { f: fr(`\\tan(${a}x)`, 'x'), at: '0', v: a, vt: String(a) });
    for (const [a, b] of [[1, 2], [1, 3], [2, 3], [3, 2], [3, 4], [2, 5], [4, 3]]) { const r = frac(a, b); MODELES_LIMITE[2].push({ f: fr(`\\sin(${a === 1 ? '' : a}x)`, `${b}x`), at: '0', v: r.v, vt: tx(r) }); }
    for (const [a, b] of [[2, 3], [3, 2], [3, 5], [5, 3], [2, 5], [4, 3], [5, 2], [3, 4]]) { const r = frac(a, b); MODELES_LIMITE[3].push({ f: fr(`\\sin(${a}x)`, `\\sin(${b}x)`), at: '0', v: r.v, vt: tx(r) }); }
    for (const a of [2, 3, 4]) { const r = frac(a * a, 2); MODELES_LIMITE[3].push({ f: fr(`1-\\cos(${a}x)`, 'x^2'), at: '0', v: r.v, vt: tx(r) }, { f: `x\\sin\\left(${fr(String(a), 'x')}\\right)`, at: 'inf', v: a, vt: String(a) }); }
    for (const a of [1, 2, 3, 5]) MODELES_LIMITE[3].push({ f: fr(`x+${a === 1 ? '' : a}\\sin x`, 'x'), at: 'inf', v: 1, vt: '1' }, { f: `${a === 1 ? '' : a}x+\\cos x`, at: 'inf', v: Infinity, vt: INF });
  })();
  const ratTex = x => { for (let d = 1; d <= 12; d++) { const n = Math.round(x * d); if (Math.abs(n / d - x) < 1e-9) { const g = pgcd(Math.abs(n), d) || 1, nn = n / g, dd = d / g; return dd === 1 ? String(nn) : (nn < 0 ? '-' : '') + fr(String(Math.abs(nn)), String(dd)); } } return null; };
  function limite(niveau) {
    const mo = aleaParmi(MODELES_LIMITE[niveau]), v = mo.v;
    const brut = Number.isFinite(v) ? [0, 1, -1, v + 1, v - 1, 2 * v, v / 2, v === 0 ? 2 : 1 / v, -v, v * v, Infinity, -Infinity, v + 2] : [0, 1, -Infinity, 2, -1, 3, Number.isFinite(v) ? v : Infinity];
    const vus = new Set([mo.vt]), faux = [];
    for (const x of melanger(brut)) { const tex = x === Infinity ? INF : x === -Infinity ? MINF : ratTex(x); if (tex === null || vus.has(tex) || (Number.isFinite(x) && Number.isFinite(v) && Math.abs(x - v) < 1e-9) || x === v) continue; vus.add(tex); faux.push(tex); }
    if (faux.length < 3) return null;
    const lieu = { '0': `en ${m('0')}`, '0+': `en ${m('0')} par valeurs supérieures`, inf: `en ${m(INF)}` }[mo.at];
    const dom = mo.at === 'inf' || mo.at === '0+' ? 'sur ' + m(T`\left]0\,;+\infty\right[`) : `sur ${m(T`\mathbb{R}^{*}`)}`;
    return qcm(`On considère la fonction ${m('f')} définie ${dom} par ${m(`f(x)=${mo.f}`)}. Quelle est la limite de ${m('f')} ${lieu} ?`, texOpt(mo.vt), faux.slice(0, 3).map(texOpt),
      { explication: mo.at === 'inf' ? `Le terme trigonométrique reste borné (${m(T`-1\le\sin x\le 1`)}) : on encadre et on applique le théorème des gendarmes, ou on factorise par le terme dominant. La limite est ${m(mo.vt)}.` : `On se ramène à la limite de référence ${m(T`\lim_{x\to0}\dfrac{\sin x}{x}=1`)} (taux d'accroissement de ${m(T`\sin`)} en ${m('0')}) et à ${m(T`\lim_{x\to0}\dfrac{1-\cos x}{x^2}=\dfrac{1}{2}`)} : la limite est ${m(mo.vt)}.`, meta: { tipo: 'limite', fTex: mo.f, at: mo.at } });
  }

  // ==========================================================================
  // 7. Formules et identités
  // ==========================================================================
  const IDENT = [
    { v: '\\sin(\\pi-x)=\\sin x', f: ['\\sin(\\pi-x)=-\\sin x', '\\sin(\\pi-x)=\\cos x', '\\sin(\\pi-x)=-\\cos x'], niv: 1 },
    { v: '\\cos(\\pi-x)=-\\cos x', f: ['\\cos(\\pi-x)=\\cos x', '\\cos(\\pi-x)=\\sin x', '\\cos(\\pi-x)=-\\sin x'], niv: 1 },
    { v: '\\sin(x+\\pi)=-\\sin x', f: ['\\sin(x+\\pi)=\\sin x', '\\sin(x+\\pi)=\\cos x', '\\sin(x+\\pi)=-\\cos x'], niv: 1 },
    { v: '\\cos(x+\\pi)=-\\cos x', f: ['\\cos(x+\\pi)=\\cos x', '\\cos(x+\\pi)=\\sin x', '\\cos(x+\\pi)=-\\sin x'], niv: 1 },
    { v: '\\cos\\left(\\dfrac{\\pi}{2}-x\\right)=\\sin x', f: ['\\cos\\left(\\dfrac{\\pi}{2}-x\\right)=\\cos x', '\\cos\\left(\\dfrac{\\pi}{2}-x\\right)=-\\sin x', '\\cos\\left(\\dfrac{\\pi}{2}-x\\right)=-\\cos x'], niv: 1 },
    { v: '\\sin\\left(\\dfrac{\\pi}{2}-x\\right)=\\cos x', f: ['\\sin\\left(\\dfrac{\\pi}{2}-x\\right)=\\sin x', '\\sin\\left(\\dfrac{\\pi}{2}-x\\right)=-\\cos x', '\\sin\\left(\\dfrac{\\pi}{2}-x\\right)=-\\sin x'], niv: 1 },
    { v: '\\sin(-x)=-\\sin x', f: ['\\sin(-x)=\\sin x', '\\sin(-x)=\\cos x', '\\sin(-x)=-\\cos x'], niv: 1 },
    { v: '\\cos(-x)=\\cos x', f: ['\\cos(-x)=-\\cos x', '\\cos(-x)=\\sin x', '\\cos(-x)=-\\sin x'], niv: 1 },
    { v: '\\left(\\cos x\\right)^2+\\left(\\sin x\\right)^2=1', f: ['\\left(\\cos x\\right)^2-\\left(\\sin x\\right)^2=1', '\\cos x+\\sin x=1', '\\left(\\cos x\\right)^2+\\left(\\sin x\\right)^2=2'], niv: 1 },
    { v: '\\sin(2x)=2\\sin x\\cos x', f: ['\\sin(2x)=2\\sin x', '\\sin(2x)=\\left(\\sin x\\right)^2', '\\sin(2x)=\\sin x\\cos x'], niv: 2 },
    { v: '\\cos(2x)=2\\left(\\cos x\\right)^2-1', f: ['\\cos(2x)=2\\cos x', '\\cos(2x)=2\\left(\\cos x\\right)^2+1', '\\cos(2x)=\\left(\\cos x\\right)^2+\\left(\\sin x\\right)^2'], niv: 2 },
    { v: '\\cos(2x)=1-2\\left(\\sin x\\right)^2', f: ['\\cos(2x)=1+2\\left(\\sin x\\right)^2', '\\cos(2x)=2-\\left(\\sin x\\right)^2', '\\cos(2x)=2\\left(\\sin x\\right)^2-1'], niv: 2 },
    { v: '\\cos(2x)=\\left(\\cos x\\right)^2-\\left(\\sin x\\right)^2', f: ['\\cos(2x)=\\left(\\cos x\\right)^2+\\left(\\sin x\\right)^2', '\\cos(2x)=\\left(\\sin x\\right)^2-\\left(\\cos x\\right)^2', '\\cos(2x)=2\\cos x\\sin x'], niv: 2 },
    { v: '\\cos(x+y)=\\cos x\\cos y-\\sin x\\sin y', f: ['\\cos(x+y)=\\cos x\\cos y+\\sin x\\sin y', '\\cos(x+y)=\\cos x+\\cos y', '\\cos(x+y)=\\sin x\\cos y+\\cos x\\sin y'], niv: 2 },
    { v: '\\sin(x+y)=\\sin x\\cos y+\\cos x\\sin y', f: ['\\sin(x+y)=\\sin x\\cos y-\\cos x\\sin y', '\\sin(x+y)=\\sin x+\\sin y', '\\sin(x+y)=\\cos x\\cos y+\\sin x\\sin y'], niv: 2 },
    { v: '\\cos(x-y)=\\cos x\\cos y+\\sin x\\sin y', f: ['\\cos(x-y)=\\cos x\\cos y-\\sin x\\sin y', '\\cos(x-y)=\\cos x-\\cos y', '\\cos(x-y)=\\sin x\\cos y-\\cos x\\sin y'], niv: 2 },
    { v: '1+\\cos(2x)=2\\left(\\cos x\\right)^2', f: ['1+\\cos(2x)=2\\left(\\sin x\\right)^2', '1+\\cos(2x)=\\left(\\cos x\\right)^2', '1-\\cos(2x)=2\\left(\\cos x\\right)^2'], niv: 3 },
    { v: '1-\\cos(2x)=2\\left(\\sin x\\right)^2', f: ['1-\\cos(2x)=2\\left(\\cos x\\right)^2', '1-\\cos(2x)=\\left(\\sin x\\right)^2', '1+\\cos(2x)=2\\left(\\sin x\\right)^2'], niv: 3 },
    { v: '\\cos x+\\sin x=\\sqrt{2}\\cos\\left(x-\\dfrac{\\pi}{4}\\right)', f: ['\\cos x+\\sin x=\\sqrt{2}\\cos\\left(x+\\dfrac{\\pi}{4}\\right)', '\\cos x+\\sin x=\\cos\\left(x-\\dfrac{\\pi}{4}\\right)', '\\cos x+\\sin x=\\sqrt{2}\\sin\\left(x-\\dfrac{\\pi}{4}\\right)'], niv: 3 }
  ];
  function identites(niveau) {
    const pool = IDENT.filter(x => (niveau === 1 ? x.niv === 1 : niveau === 2 ? x.niv >= 1 : x.niv >= 2));
    if (Math.random() < 0.4 && pool.length >= 4) {                       // « laquelle est FAUSSE ? » : trois identités vraies, une fausse
      const [I, ...autres] = melanger(pool), faux = aleaParmi(I.f), vraies = autres.slice(0, 3).map(x => x.v);
      const y = [faux, ...vraies].some(t => t.includes('y'));
      return qcm(`Laquelle de ces égalités est FAUSSE ${y ? 'pour certains réels ' + m('x') + ' et ' + m('y') : 'pour certains réels ' + m('x')} ?`, texOpt(faux), vraies.map(texOpt),
        { explication: `Les trois autres sont des formules du cours. L'égalité ${m(faux)} est fausse : on le voit avec une valeur simple de ${m('x')}, ou en la comparant à la formule correcte ${m(I.v)}.`, meta: { tipo: 'identite', neg: true } });
    }
    const I = aleaParmi(pool);
    return qcm(`Laquelle de ces égalités est vraie ${I.v.includes('y') ? 'pour tous réels ' + m('x') + ' et ' + m('y') : 'pour tout réel ' + m('x')} ?`, texOpt(I.v), melanger(I.f).map(texOpt),
      { explication: `On vérifie sur des valeurs simples (par exemple ${m('x=0')} ou ${m(T`x=\dfrac{\pi}{2}`)}) ou avec les formules du cours : ${m(I.v)}.`, meta: { tipo: 'identite', y: I.v.includes('y') } });
  }
  function valeurConnaissant() {                    // cos x donné → sin x, cos 2x, sin 2x
    const triplets = [[3, 5, 4, 5], [4, 5, 3, 5], [5, 13, 12, 13], [12, 13, 5, 13], [8, 17, 15, 17], [15, 17, 8, 17], [20, 29, 21, 29]];
    const [cn, cd, sn, sd] = aleaParmi(triplets), quad = aleaParmi(['haut', 'bas']), ask = aleaParmi(['sin', 'cos2', 'sin2']);
    const s = quad === 'haut' ? sn / sd : -sn / sd, c = cn / cd, q = (a, b) => { const g = pgcd(Math.abs(a), b); return { n: a / g, d: b / g, v: a / b }; };
    const tx = r => (r.d === 1 ? String(r.n) : (r.n < 0 ? '-' : '') + fr(String(Math.abs(r.n)), String(r.d)));
    let vrai, cl;
    if (ask === 'sin') { vrai = q(quad === 'haut' ? sn : -sn, sd); cl = [q(-vrai.n, vrai.d), q(cn, cd), q(sd - cd, sd), q(cd * cd - sd * sd, sd * sd), q(1 - cn, cd)]; }
    else if (ask === 'cos2') { vrai = q(2 * cn * cn - cd * cd, cd * cd); cl = [q(2 * cn, cd), q(2 * cn * cn + cd * cd, cd * cd), q(cn * cn, cd * cd), q(cd * cd - 2 * sn * sn, cd * cd) /* = cos2x ... égal ! */, q(1 - 2 * cn * cn, 1), q(-(2 * cn * cn - cd * cd), cd * cd)]; cl = cl.filter((r, i) => i !== 3); }
    else { vrai = q((quad === 'haut' ? 2 : -2) * cn * sn, cd * sd); cl = [q(2 * cn * sn, cd * sd), q(-(quad === 'haut' ? 2 : -2) * cn * sn, cd * sd), q(2 * cn, cd), q(2 * sn, sd), q(cn * sn, cd * sd), q(cn * cn - sn * sn, cd * sd)]; }
    const vus = new Set([tx(vrai)]), faux = []; for (const r of cl) { const t = tx(r); if (vus.has(t) || Math.abs(r.v) > 1.0000001 && ask !== 'cos2') continue; vus.add(t); faux.push(t); }
    if (faux.length < 3) return null;
    const cond = quad === 'haut' ? `${m('x')} appartient à ${m(IV('0', T`\pi`, true, true))}` : `${m('x')} appartient à ${m(IV(T`-\pi`, '0', true, true))}`;
    const qq = ask === 'sin' ? m(T`\sin x`) : ask === 'cos2' ? m(T`\cos(2x)`) : m(T`\sin(2x)`);
    return qcm(`On sait que ${m(`\\cos x=${tx(q(cn, cd))}`)} et que ${cond}. Quelle est la valeur de ${qq} ?`, texOpt(tx(vrai)), faux.slice(0, 3).map(texOpt),
      { explication: ask === 'sin' ? `${m(T`\sin^2 x=1-\cos^2 x`)} donne ${m(`\\sin^2 x=${tx(q(sn * sn, sd * sd))}`)} ; comme ${cond}, ${m(T`\sin x`)} est ${quad === 'haut' ? 'positif' : 'négatif'} : ${m(`\\sin x=${tx(vrai)}`)}.` : ask === 'cos2' ? `${m(T`\cos(2x)=2\cos^2 x-1`)}, soit ${m(`2\\times ${tx(q(cn * cn, cd * cd))}-1=${tx(vrai)}`)}.` : `${m(T`\sin(2x)=2\sin x\cos x`)} avec ${m(`\\sin x=${tx(q(quad === 'haut' ? sn : -sn, sd))}`)} (signe donné par l'intervalle) : ${m(tx(vrai))}.`, meta: { tipo: 'connaissant', cn, cd, sn, sd, quad, ask } });
  }
  const formules = niveau => (niveau === 3 ? aleaParmi([identites, valeurConnaissant, valeurConnaissant])(3) : niveau === 2 ? aleaParmi([identites, valeurConnaissant])(2) : identites(1));

  // ==========================================================================
  // Enregistrement
  // ==========================================================================
  Automatismes.enregistrerBanque('trigonometrie', {
    titre: 'Trigonométrie',
    familles: {
      'valeurs': famille({ nom: 'valeurs exactes', niveaux: [1, 2], base: retente(valeurs) }),
      'equations': famille({ nom: 'équations et inéquations', niveaux: [2, 3], base: retente(trigEquation) }),
      'derivees': famille({ nom: 'dérivées', niveaux: [1, 2, 3], base: retente(derivee) }),
      'parite-periode': famille({ nom: 'parité et périodicité', niveaux: [1, 2], base: retente(() => (Math.random() < 0.5 ? parite() : periode())) }),
      'etude': famille({ nom: 'extremum, signe de f′, concavité', niveaux: [2, 3], base: retente(etudeFamille) }),
      'limites': famille({ nom: 'limites', niveaux: [2, 3], base: retente(limite) }),
      'formules': famille({ nom: 'formules et identités', niveaux: [1, 2, 3], base: retente(formules) })
    }
  });
})();
