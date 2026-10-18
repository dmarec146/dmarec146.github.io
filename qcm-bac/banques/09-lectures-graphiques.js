/* Banque 09 — Lectures graphiques (Terminale spécialité)
   Questions à figure inspirées des QCM de bac 2022 et 2023 : nombre de solutions de f(x)=k lu sur une courbe, sens de
   variation lu sur la courbe de f, ou déduit de la courbe de f', convexité et point d'inflexion déduits de la courbe de f' ou
   de f'', signe de f, pente d'une tangente tracée, encadrement d'une intégrale en comptant les carreaux.

   Niveau 1 — les bases : solutions de f(x)=k, extremum et sens de variation lus sur la courbe de f.
   Niveau 2 — l'épreuve : variations de f à partir de la courbe de f', signe de f, tangente, intégrale par les carreaux.
   Niveau 3 — plus difficile (pénalités) : convexité et point d'inflexion à partir de f' ou de f'', extremum à partir de f'.

   Lisibilité (règle du projet) : tout point lu par l'élève (extremum, zéro, point d'inflexion) est un nœud du quadrillage, la
   courbe tient dans la fenêtre et la figure est dessinée à partir de la MÊME fonction que celle du corrigé.
   Le contrôle (outils/qcm-bac/controle-banques.js) relit la formule de la fonction tracée (`drawTex`), vérifie qu'elle redonne
   les points du tracé (`pts`), puis recalcule numériquement racines, signe, extremums, point d'inflexion ou intégrale. */
(function () {
  'use strict';
  const O = Automatismes.outils;
  const { alea, aleaParmi, m, qcm, famille } = O;
  const T = String.raw;

  const texOpt = tex => ({ affichage: m(tex), cle: tex });
  const retente = gen => niveau => { for (let i = 0; i < 40; i++) { const q = gen(niveau); if (q) return q; } return null; };
  const sgn = n => (n < 0 ? '-' : '+') + Math.abs(n);
  const IV = (lo, hi) => T`\left[${lo}\,;${hi}\right]`;
  const UNION = l => l.join(T`\cup`);

  // ---------- fonctions de référence : formule JavaScript ET formule LaTeX écrites ensemble ----------
  const lin = p => (p === 0 ? 'x' : `x${sgn(-p)}`);                       // x - p
  const fac = r => (r === 0 ? 'x' : `\\left(x${sgn(-r)}\\right)`);        // (x - r)
  const coef = c => (c === 1 ? '' : c === -1 ? '-' : String(c));
  // « marche d'escalier » : extremum local en x = p (valeur M) et en x = q (valeur mm), point d'inflexion au milieu
  function cubique(p, q, M, mm) {
    const D = M - mm, w = q - p, u = `\\dfrac{${lin(p)}}{${w}}`;
    const bloc = `3\\left(${u}\\right)^{2}-2\\left(${u}\\right)^{3}`;
    const f = x => { const t = (x - p) / w; return M - D * (3 * t * t - 2 * t * t * t); };
    return { f, tex: D > 0 ? `${M}-${D}\\left(${bloc}\\right)` : `${M}+${-D}\\left(${bloc}\\right)`, p, q, M, m: mm };
  }
  const parabole = (a, al, be) => ({ f: x => a * (x - al) * (x - al) + be, tex: `${coef(a)}${al === 0 ? 'x' : fac(al)}^{2}${be === 0 ? '' : sgn(be)}`, a, al, be });

  // ---------- figures ----------
  function fenetre(f, xmin, xmax, hauteurMax) {
    if (xmin > -1 || xmax < 1) return null;
    let lo = Infinity, hi = -Infinity;
    for (let x = xmin; x <= xmax + 1e-9; x += 0.05) { const y = f(x); lo = Math.min(lo, y); hi = Math.max(hi, y); }
    const ymin = Math.min(-1, Math.floor(lo) - 1), ymax = Math.max(1, Math.ceil(hi) + 1);
    if (ymax - ymin > (hauteurMax || 14) || ymax - ymin < 4 || xmax - xmin < 3 || xmax - xmin > 14) return null;
    const w = xmax - xmin, h = ymax - ymin;
    return { xmin, xmax, ymin, ymax, unite: Math.min(32, Math.max(15, Math.floor(330 / Math.max(w, h)))) };
  }
  const dessiner = (fen, f, extra) => {
    const pts = O.graph.echantillonner(f, fen.xmin, fen.xmax, 0.04);
    const svg = O.graph.repere(Object.assign({ xmin: fen.xmin, xmax: fen.xmax, ymin: fen.ymin, ymax: fen.ymax, unite: fen.unite, courbes: [{ points: pts, label: '' }] }, extra || {}));
    const echantillon = []; for (let x = fen.xmin; x <= fen.xmax + 1e-9; x += 0.5) echantillon.push([x, f(x)]);
    return { svg, pts: echantillon };
  };
  const metaBase = (fen, fn, extra) => Object.assign({ drawTex: fn.tex, xmin: fen.xmin, xmax: fen.xmax, ymin: fen.ymin, ymax: fen.ymax }, extra);
  const question = (enonce, svg, bonne, faux, expl, meta) => {
    const f = faux.map(String).filter((x, i, a) => x !== String(bonne) && a.indexOf(x) === i); if (f.length < 3) return null;
    return qcm(enonce, texOpt(String(bonne)), f.slice(0, 3).map(texOpt), { figure: svg, explication: expl, meta });
  };
  const CONTEXTE = fen => `On donne ci-contre la courbe représentative ${m(T`\mathcal{C}`)} d'une fonction ${m('f')} définie sur ${m(IV(String(fen.xmin), String(fen.xmax)))}.`;
  const ensembleTex = l => UNION(l.map(([a, b]) => IV(String(a), String(b))));
  const CONTEXTE_FP = fen => `La courbe ${m(T`\mathcal{C}'`)} ci-contre est la représentation graphique de la dérivée ${m("f'")} d'une fonction ${m('f')} dérivable sur ${m(IV(String(fen.xmin), String(fen.xmax)))}.`;

  // courbe de la cubique avec fenêtre : tire p, q, M, m jusqu'à obtenir une figure lisible
  function tirerCubique(opt) {
    for (let essai = 0; essai < 80; essai++) {
      const p = alea(-3, 0), q = p + aleaParmi([2, 2, 3, 4]), M = alea(-1, 4), D = aleaParmi([2, 3, 4]) * aleaParmi([1, -1]), mm = M - D;
      const fn = cubique(p, q, M, mm), fen = fenetre(fn.f, p - alea(1, 2), q + alea(1, 2), opt && opt.h);
      if (!fen) continue;
      if (opt && opt.inflexion && ((p + q) % 2 !== 0 || D % 2 !== 0)) continue;
      return { fn, fen };
    }
    return null;
  }
  // nombre de solutions distinctes de f(x) = k sur [xmin, xmax] (pas de 1/1000 : les abscisses entières sont atteintes exactement)
  function compterSolutions(f, k, xmin, xmax) {
    const racines = []; let prec = f(xmin) - k;
    const ajoute = x => { if (!racines.length || x - racines[racines.length - 1] > 0.01) racines.push(x); };
    if (Math.abs(prec) < 1e-9) ajoute(xmin);
    for (let i = 1; i <= (xmax - xmin) * 1000; i++) {
      const x = xmin + i / 1000, v = f(x) - k;
      if (Math.abs(v) < 1e-9) ajoute(x); else if (Math.abs(prec) >= 1e-9 && prec * v < 0) ajoute(x);
      prec = v;
    }
    return racines.length;
  }

  // ==========================================================================
  // 1. Nombre de solutions de f(x) = k
  // ==========================================================================
  function solutions() {
    const c = tirerCubique(); if (!c) return null;
    const { fn, fen } = c, lo = Math.min(fn.M, fn.m), hi = Math.max(fn.M, fn.m), k = alea(lo - 2, hi + 2);
    if (k < fen.ymin + 0 || k > fen.ymax) return null;
    const n = compterSolutions(fn.f, k, fen.xmin, fen.xmax); if (n > 3) return null;
    const touche = k === fn.M || k === fn.m;
    const d = dessiner(fen, fn.f, { droites: [{ a: 0, b: k, couleur: '#2a6bd6', label: `y = ${k}` }] });
    return question(`${CONTEXTE(fen)} Combien l'équation ${m(`f(x)=${k}`)} admet-elle de solutions dans cet intervalle ?`, d.svg, n, ['0', '1', '2', '3'],
      `Les solutions de ${m(`f(x)=${k}`)} sont les abscisses des points d'intersection de ${m(T`\mathcal{C}`)} et de la droite horizontale d'équation ${m(`y=${k}`)} : on en compte ${m(String(n))}${touche ? " (la droite passe par un extremum local : elle touche la courbe en ce point, qui compte pour une solution)" : ''}.`,
      metaBase(fen, fn, { tipo: 'sol-k', k, pts: d.pts }));
  }

  // ==========================================================================
  // 2. Sens de variation lu sur la courbe de f : on cherche l'intervalle parmi quatre
  // ==========================================================================
  function proposerIntervalle(fen, p, q, vrai, memeSens) {            // vrai : [a,b] ; memeSens : intervalles où f varie aussi dans le même sens (à ne pas proposer)
    const tous = [[fen.xmin, p], [p, q], [q, fen.xmax]];
    const pieges = tous.filter(([a, b]) => !memeSens.some(([c, e]) => c === a && e === b)).concat([[fen.xmin, q], [p, fen.xmax], [p - 1, q + 1], [fen.xmin, fen.xmax]]);
    return pieges.filter(([a, b]) => !(a === vrai[0] && b === vrai[1])).map(([a, b]) => IV(String(a), String(b)));
  }
  function variationsF() {
    const c = tirerCubique(); if (!c) return null;
    const { fn, fen } = c, { p, q } = fn, cubiqueMax = fn.M > fn.m, croissant = Math.random() < 0.5;
    const cresc = cubiqueMax ? [[fen.xmin, p], [q, fen.xmax]] : [[p, q]], decr = cubiqueMax ? [[p, q]] : [[fen.xmin, p], [q, fen.xmax]];
    const bons = croissant ? cresc : decr, vrai = aleaParmi(bons);
    const d = dessiner(fen, fn.f);
    return question(`${CONTEXTE(fen)} Sur lequel de ces intervalles la fonction ${m('f')} est-elle ${croissant ? 'croissante' : 'décroissante'} ?`, d.svg, IV(String(vrai[0]), String(vrai[1])), proposerIntervalle(fen, p, q, vrai, bons),
      `On lit sur la courbe : ${m('f')} est ${croissant ? 'croissante' : 'décroissante'} là où la courbe ${croissant ? 'monte' : 'descend'} (quand on la parcourt de gauche à droite). Les extremums locaux sont en ${m('x=' + p)} et ${m('x=' + q)} : ${m('f')} est ${croissant ? 'croissante' : 'décroissante'} sur ${m(IV(String(vrai[0]), String(vrai[1])))}.`,
      metaBase(fen, fn, { tipo: 'var-f', pts: d.pts }));
  }

  // ==========================================================================
  // 3. Extremum local (valeur) et abscisse du point d'inflexion
  // ==========================================================================
  function extremumF() {
    const c = tirerCubique(); if (!c) return null;
    const { fn, fen } = c, maxLocal = Math.max(fn.M, fn.m), minLocal = Math.min(fn.M, fn.m), veutMax = Math.random() < 0.5, vrai = veutMax ? maxLocal : minLocal, autre = veutMax ? minLocal : maxLocal;
    const xExt = veutMax ? (maxLocal === fn.M ? fn.p : fn.q) : (minLocal === fn.M ? fn.p : fn.q);
    const d = dessiner(fen, fn.f);
    return question(`${CONTEXTE(fen)} Quelle est la valeur de ${veutMax ? 'son maximum local' : 'son minimum local'} ?`, d.svg, vrai, [autre, vrai + 1, vrai - 1, xExt, vrai + 2, vrai - 2],
      `Le ${veutMax ? 'sommet' : 'creux'} de la courbe est le point de coordonnées ${m(`(${xExt}\\,;${vrai})`)} : la valeur demandée est l'ordonnée ${m(String(vrai))}.`,
      metaBase(fen, fn, { tipo: 'ext-f', pts: d.pts }));
  }
  function inflexionF() {
    const c = tirerCubique({ inflexion: true }); if (!c) return null;
    const { fn, fen } = c, mid = (fn.p + fn.q) / 2, d = dessiner(fen, fn.f, { points: [{ x: mid, y: fn.f(mid), label: 'I' }] });
    return question(`${CONTEXTE(fen)} Le point ${m('I')} marqué sur la courbe est son point d'inflexion. Quelle est son abscisse ?`, d.svg, mid, [fn.p, fn.q, mid + 1, mid - 1, fn.f(mid), mid + 2],
      `Le point d'inflexion est le point où la courbe traverse sa tangente, en passant de concave à convexe (ou l'inverse). Ici ${m('I')} est le point de la courbe d'abscisse ${m(String(mid))}.`,
      metaBase(fen, fn, { tipo: 'infl-f', pts: d.pts }));
  }

  // ==========================================================================
  // 4. Signe de f
  // ==========================================================================
  function signeF() {
    for (let essai = 0; essai < 60; essai++) {
      const r1 = alea(-3, -1), r2 = r1 + alea(1, 3), r3 = r2 + alea(1, 3), c = aleaParmi([0.25, 0.5, 1, -0.5, -1]), xmin = r1 - 1, xmax = Math.max(r3 + 1, xmin + 5);
      const f = x => c * (x - r1) * (x - r2) * (x - r3), tex = `${coef(c)}${fac(r1)}${fac(r2)}${fac(r3)}`;
      const fen = fenetre(f, xmin, xmax); if (!fen) continue;
      const pos = Math.random() < 0.5, bords = [fen.xmin, r1, r2, r3, fen.xmax];
      const signes = [f(r1 - 0.5) > 0, f((r1 + r2) / 2) > 0, f((r2 + r3) / 2) > 0, f(r3 + 0.5) > 0];
      const garde = [], rejette = [];
      for (let i = 0; i < 4; i++) (signes[i] === pos ? garde : rejette).push([bords[i], bords[i + 1]]);
      const fusion = l => { const r = []; for (const [a, b] of l) { const dr = r[r.length - 1]; if (dr && dr[1] === a) dr[1] = b; else r.push([a, b]); } return r; };
      const vrai = fusion(garde), t = ensembleTex;
      const pieges = [fusion(rejette), vrai.length > 1 ? vrai.slice(0, 1) : [[r1, r3]], [[fen.xmin, r2]], [[r2, fen.xmax]], vrai.map(([a, b]) => [Math.max(fen.xmin, a - 1), Math.min(fen.xmax, b - 1)])];
      const d = dessiner(fen, f);
      return question(`${CONTEXTE(fen)} Sur quel ensemble a-t-on ${m(pos ? T`f(x)\ge 0` : T`f(x)\le 0`)} ?`, d.svg, t(vrai), pieges.map(t),
        `On lit les abscisses des zéros de ${m('f')} (${m(String(r1))}, ${m(String(r2))} et ${m(String(r3))}), puis les arcs de la courbe situés ${pos ? 'au-dessus' : 'en dessous'} de l'axe des abscisses : ${m(t(vrai))} (les zéros sont inclus).`,
        metaBase(fen, { tex }, { tipo: 'signe-f', pts: d.pts }));
    }
    return null;
  }

  // ==========================================================================
  // 5. Tangente et dérivée en un point
  // ==========================================================================
  function tangente() {
    for (let essai = 0; essai < 60; essai++) {
      const a = aleaParmi([1, -1, 0.5, -0.5, 0.25, -0.25]), al = alea(-2, 2), be = alea(-3, 3), x0 = al + aleaParmi([-2, -1, 1, 2]), pente = 2 * a * (x0 - al);
      if (!Number.isInteger(pente) || pente === 0 || Math.abs(pente) > 3) continue;
      const fn = parabole(a, al, be), y0 = fn.f(x0); if (!Number.isInteger(y0)) continue;
      const fen = fenetre(fn.f, Math.min(x0, al) - 3, Math.max(x0, al) + 3, 13); if (!fen || Math.abs(y0) > fen.ymax - 1 || y0 < fen.ymin + 1) continue;
      const ordo = y0 - pente * x0, d = dessiner(fen, fn.f, { droites: [{ a: pente, b: ordo, couleur: '#2a6bd6', label: 'T' }], points: [{ x: x0, y: y0, label: 'A' }] });
      return question(`${CONTEXTE(fen)} La droite ${m('T')} est la tangente à ${m(T`\mathcal{C}`)} au point ${m(`A(${x0}\\,;${y0})`)}. Quelle est la valeur de ${m(`f'(${x0})`)} ?`, d.svg, pente, [-pente, pente + 1, pente - 1, y0, x0, 2 * pente],
        `${m(`f'(${x0})`)} est le coefficient directeur de la tangente ${m('T')} : quand on avance de ${m('1')} vers la droite, ${m('T')} ${pente > 0 ? 'monte' : 'descend'} de ${m(String(Math.abs(pente)))}, donc ${m(`f'(${x0})=${pente}`)}.`,
        metaBase(fen, fn, { tipo: 'tangente', x0, tangente: { a: pente, b: ordo }, pts: d.pts }));
    }
    return null;
  }

  // ==========================================================================
  // 6. Encadrement d'une intégrale (comptage de carreaux)
  // ==========================================================================
  function integrale() {
    for (let essai = 0; essai < 80; essai++) {
      const a = aleaParmi([0.5, 1, 0.25]), al = alea(-1, 1), be = alea(1, 3), lo = alea(-2, 0), hi = lo + aleaParmi([2, 3, 4]);
      const fn = parabole(a, al, be), fen = fenetre(fn.f, Math.min(lo, al) - 1, Math.max(hi, al) + 1, 13); if (!fen) continue;
      let I = 0; const n = 4000, h = (hi - lo) / n; for (let k = 0; k < n; k++) I += fn.f(lo + (k + 0.5) * h) * h;
      const base = Math.floor(I / 3) * 3;
      if (I - base < 0.4 || base + 3 - I < 0.4) continue;
      const pieges = [base - 3, base + 3, base + 6, base - 6, base + 9].filter(x => x >= 0).map(x => `${x}\\le I\\le ${x + 3}`);
      const d = dessiner(fen, fn.f, { verticales: [{ x: lo, couleur: '#2a6bd6', label: `x=${lo}` }, { x: hi, couleur: '#2a6bd6', label: `x=${hi}` }] });
      return question(`${CONTEXTE(fen)} On note ${m(`I=\\displaystyle\\int_{${lo}}^{${hi}} f(x)\\,\\mathrm{d}x`)}. Un carreau du quadrillage a pour aire ${m('1')} (unité d'aire). Quel encadrement de ${m('I')} est correct ?`,
        d.svg, `${base}\\le I\\le ${base + 3}`, pieges,
        `${m('I')} est l'aire du domaine compris entre la courbe, l'axe des abscisses et les droites ${m(`x=${lo}`)} et ${m(`x=${hi}`)} (la fonction est positive). En comptant les carreaux entiers sous la courbe et ceux qu'elle traverse, on obtient ${m(`${base}\\le I\\le ${base + 3}`)}.`,
        metaBase(fen, fn, { tipo: 'integrale', lo, hi, pts: d.pts }));
    }
    return null;
  }

  // ==========================================================================
  // 7. À partir de la courbe de f' : variations, extremum, convexité
  // ==========================================================================
  function tirerParaboleFp(sommetEntier) {
    for (let essai = 0; essai < 60; essai++) {
      const p = alea(-3, 0), q = p + aleaParmi([2, 2, 4, 3]), a = aleaParmi([1, -1, 0.5, -0.5]);
      if (sommetEntier && (p + q) % 2 !== 0) continue;
      const f = x => a * (x - p) * (x - q), fen = fenetre(f, p - alea(1, 2), q + alea(1, 2), 14); if (!fen) continue;
      return { f, tex: `${coef(a)}${fac(p)}${fac(q)}`, a, p, q, fen };
    }
    return null;
  }
  function variationsFp() {
    const c = tirerParaboleFp(); if (!c) return null;
    const { p, q, a, fen } = c, croissant = Math.random() < 0.5;
    const dehors = [[fen.xmin, p], [q, fen.xmax]], dedans = [[p, q]];
    const bons = (croissant === (a > 0)) ? dehors : dedans, vrai = aleaParmi(bons);   // f' ≥ 0 hors de [p, q] si a > 0
    const d = dessiner(fen, c.f);
    return question(`${CONTEXTE_FP(fen)} Sur lequel de ces intervalles la fonction ${m('f')} est-elle ${croissant ? 'croissante' : 'décroissante'} ?`, d.svg, IV(String(vrai[0]), String(vrai[1])), proposerIntervalle(fen, p, q, vrai, bons),
      `${m('f')} est ${croissant ? 'croissante' : 'décroissante'} là où ${m(croissant ? "f'(x)\\ge 0" : "f'(x)\\le 0")}, c'est-à-dire là où la courbe ${m(T`\mathcal{C}'`)} est ${croissant ? 'au-dessus' : 'en dessous'} de l'axe des abscisses : sur ${m(IV(String(vrai[0]), String(vrai[1])))}.`,
      metaBase(fen, c, { tipo: 'var-fp', pts: d.pts }));
  }
  function extremumFp() {
    const c = tirerParaboleFp(); if (!c) return null;
    const { p, q, a, fen } = c, veutMax = Math.random() < 0.5;
    const maxEn = a > 0 ? p : q, minEn = a > 0 ? q : p, vrai = veutMax ? maxEn : minEn;
    const d = dessiner(fen, c.f);
    return question(`${CONTEXTE_FP(fen)} En quelle abscisse ${m('f')} admet-elle ${veutMax ? 'un maximum local' : 'un minimum local'} ?`, d.svg, vrai, [veutMax ? minEn : maxEn, (p + q) / 2, vrai + 1, vrai - 1, 0].filter(v => Number.isInteger(v)),
      `Un extremum local de ${m('f')} correspond à un changement de signe de ${m("f'")}. Ici ${m("f'")} s'annule en ${m(String(p))} et en ${m(String(q))}, et ${m("f'")} passe de ${veutMax ? 'positive à négative' : 'négative à positive'} en ${m(String(vrai))} : ${veutMax ? 'maximum' : 'minimum'} local.`,
      metaBase(fen, c, { tipo: 'ext-fp', pts: d.pts }));
  }
  function convexiteFp() {
    const c = tirerParaboleFp(true); if (!c) return null;
    const { p, q, a, fen } = c, sommet = (p + q) / 2, convexe = Math.random() < 0.5;
    const droite = (convexe === (a > 0)), vrai = droite ? [sommet, fen.xmax] : [fen.xmin, sommet], oppose = droite ? [fen.xmin, sommet] : [sommet, fen.xmax];
    const d = dessiner(fen, c.f);
    return question(`${CONTEXTE_FP(fen)} Sur lequel de ces intervalles la fonction ${m('f')} (deux fois dérivable) est-elle ${convexe ? 'convexe' : 'concave'} ?`, d.svg, IV(String(vrai[0]), String(vrai[1])),
      [oppose, [p, q], [sommet - 1, sommet + 1], [fen.xmin, fen.xmax], [fen.xmin, q], [p, fen.xmax]].map(([x, y]) => IV(String(x), String(y))),
      `${m('f')} est ${convexe ? 'convexe' : 'concave'} là où ${m("f'")} est ${convexe ? 'croissante' : 'décroissante'}. La courbe ${m(T`\mathcal{C}'`)} est une parabole de sommet d'abscisse ${m(String(sommet))} : elle ${convexe ? 'monte' : 'descend'} sur ${m(IV(String(vrai[0]), String(vrai[1])))}.`,
      metaBase(fen, c, { tipo: 'conv-fp', pts: d.pts }));
  }

  // ==========================================================================
  // 8. À partir de la courbe de f'' : convexité, point d'inflexion
  // ==========================================================================
  function convexiteFpp() {
    for (let essai = 0; essai < 60; essai++) {
      const r = alea(-2, 2), c = aleaParmi([1, -1, 0.5, -0.5, 2, -2]), f = x => c * (x - r), fen = fenetre(f, r - alea(2, 3), r + alea(2, 3), 12); if (!fen) continue;
      const fn = { tex: `${coef(c)}${fac(r)}` }, ask = aleaParmi(['intervalle', 'infl']), d = dessiner(fen, f);
      const enonce = `La courbe ci-contre est la représentation graphique de la dérivée seconde ${m("f''")} d'une fonction ${m('f')} deux fois dérivable sur ${m(IV(String(fen.xmin), String(fen.xmax)))}.`;
      if (ask === 'infl') {
        return question(`${enonce} Quelle est l'abscisse du point d'inflexion de la courbe de ${m('f')} ?`, d.svg, r, [r + 1, r - 1, r + 2, -r, 0, f(0)].filter(Number.isInteger),
          `Un point d'inflexion correspond à un changement de signe de ${m("f''")} : la courbe coupe l'axe des abscisses en ${m(String(r))}.`, metaBase(fen, fn, { tipo: 'infl-fpp', pts: d.pts }));
      }
      const convexe = Math.random() < 0.5, droite = convexe === (c > 0), vrai = droite ? [r, fen.xmax] : [fen.xmin, r], oppose = droite ? [fen.xmin, r] : [r, fen.xmax];
      return question(`${enonce} Sur lequel de ces intervalles la fonction ${m('f')} est-elle ${convexe ? 'convexe' : 'concave'} ?`, d.svg, IV(String(vrai[0]), String(vrai[1])),
        [oppose, [r - 1, r + 1], [fen.xmin, fen.xmax], [fen.xmin, r + 1], [r - 1, fen.xmax]].map(([x, y]) => IV(String(x), String(y))),
        `${m('f')} est ${convexe ? 'convexe' : 'concave'} là où ${m(convexe ? "f''(x)\\ge 0" : "f''(x)\\le 0")}, c'est-à-dire là où la courbe est ${convexe ? 'au-dessus' : 'en dessous'} de l'axe des abscisses : sur ${m(IV(String(vrai[0]), String(vrai[1])))}.`,
        metaBase(fen, fn, { tipo: 'conv-fpp', pts: d.pts }));
    }
    return null;
  }

  // ==========================================================================
  // Registre
  // ==========================================================================
  Automatismes.enregistrerBanque('lectures-graphiques', {
    titre: 'Lectures graphiques',
    familles: {
      'courbe-de-f': famille({ nom: 'lecture de la courbe de f', niveaux: [1, 2, 3], base: retente(niveau => (niveau === 1 ? aleaParmi([solutions, variationsF, extremumF])() : niveau === 2 ? aleaParmi([signeF, tangente, integrale, variationsF, solutions])() : aleaParmi([inflexionF, integrale, tangente, signeF])())) }),
      'courbe-de-fp': famille({ nom: 'courbe de la dérivée f′ ou f″', niveaux: [2, 3], base: retente(niveau => (niveau === 2 ? aleaParmi([variationsFp, extremumFp])() : aleaParmi([convexiteFp, convexiteFpp, extremumFp, variationsFp])())) })
    }
  });
})();
