/* Contrôle des banques du bloc « QCM Bac » (Terminale), sans navigateur ni dépendance.

   Usage :  node outils/qcm-bac/controle-banques.js [--essais 300] [--banque suites] [--famille calcul] [--niveau 3] [--mutation] [--apercu N]

   Pour chaque famille et chaque niveau, tire des questions BRUTES (avant mélange des options : l'option 0 est
   la bonne), puis :
   1. contrôle la rédaction (NaN, undefined, signes collés, exposant 1, \( \) non fermés, options en double…) ;
   2. recalcule la vérité de chaque option de façon INDÉPENDANTE à partir des données de la question
      (`q.meta`) — premiers termes, itérations, coordonnées — sans jamais relire la réponse choisie par le
      générateur : l'option 0 doit être vraie, les trois autres fausses ;
   3. avec --mutation, échange la bonne réponse avec une mauvaise et vérifie que le contrôle échoue à chaque fois
      (preuve que le contrôle sait détecter une erreur).
   Code de sortie 0 : aucune anomalie. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const LX = require('./latex-eval.js');
const { spawnSync } = require('child_process');

const RACINE = path.join(__dirname, '..', '..');
const args = process.argv.slice(2);
const opt = (nom, def) => { const i = args.indexOf(nom); return i >= 0 ? (args[i + 1] === undefined || args[i + 1].startsWith('--') ? true : args[i + 1]) : def; };
const ESSAIS = Number(opt('--essais', 300));
const BANQUE = opt('--banque', null);
const FAMILLE = opt('--famille', null);
const NIVEAU_SEUL = opt('--niveau', null);
const MUTATION = args.includes('--mutation');
const APERCU = Number(opt('--apercu', 0));

// ---------- chargement du moteur et des banques dans un contexte isolé ----------
const contexte = { window: {}, document: { addEventListener() {}, getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; } }, console, Math };
contexte.window = contexte;
vm.createContext(contexte);
function charger(chemin) { vm.runInContext(fs.readFileSync(chemin, 'utf8'), contexte, { filename: chemin }); }
charger(path.join(RACINE, 'automatismes/assets/moteur.js'));
charger(path.join(RACINE, 'automatismes/assets/graphiques.js'));
const dirBanques = path.join(RACINE, 'qcm-bac/banques');
for (const f of fs.readdirSync(dirBanques).filter(f => f.endsWith('.js')).sort()) charger(path.join(dirBanques, f));
const A = contexte.Automatismes;

// ---------- outils numériques ----------
const eq = (a, b, tol) => Math.abs(a - b) <= (tol === undefined ? 1e-9 : tol) * (1 + Math.abs(a) + Math.abs(b));
const nombre = s => { s = String(s); if (s.includes('/')) { const [n, d] = s.split('/'); return Number(n) / Number(d); } return Number(s); };
function termes(meta, n) {                      // u(n) pour une suite explicite ou récurrente
  if (meta.u) return meta.u(n);
  let u = meta.v0; for (let k = 0; k < n; k++) u = meta.rec(u); return u;
}
// classe le comportement d'une suite à l'infini : { type: 'lim', x } | { type: 'inf' } | { type: '-inf' } | { type: 'nolim' }
function classer(u, N) {
  const a = u(N), b = u(N + 1), c = u(N + 2);
  if ([a, b, c].some(Number.isNaN)) return { type: 'nan' };
  if (a > 1e4 && b > 1e4 && c > 1e4) return { type: 'inf' };
  if (a < -1e4 && b < -1e4 && c < -1e4) return { type: '-inf' };
  if (Number.isFinite(a) && Math.abs(a - b) < 1e-3 && Math.abs(b - c) < 1e-3) return { type: 'lim', x: a };
  return { type: 'nolim' };
}
function comportement(meta, defaut) {
  const N = meta.N || (meta.rec ? 600 : 100000);
  const u = meta.u ? meta.u : n => termes(meta, n);
  return classer(u, N);
}
function reclamation(cle, comp) {               // vérité d'une réclamation sur la limite
  if (cle.startsWith('lim:')) return comp.type === 'lim' && Math.abs(comp.x - nombre(cle.slice(4))) < 5e-3 * (1 + Math.abs(comp.x));
  if (cle === 'div') return comp.type !== 'lim';
  if (cle === 'inf') return comp.type === 'inf';
  if (cle === '-inf') return comp.type === '-inf';
  if (cle === 'nolim') return comp.type === 'nolim';
  throw new Error('réclamation inconnue : ' + cle);
}
const sensDe = (u, n0, nb) => {
  let inc = true, dec = true, cst = true;
  for (let n = n0; n < n0 + nb; n++) { const d = u(n + 1) - u(n); if (!(d > 1e-12)) inc = false; if (!(d < -1e-12)) dec = false; if (Math.abs(d) > 1e-12) cst = false; }
  return { inc, dec, cst };
};
const constantes = (xs, tol) => xs.every(x => Number.isFinite(x) && eq(x, xs[0], tol || 1e-7));

// ---------- vérificateurs : un tableau de booléens (vérité de chaque option) ----------
const F = {};
function verifLimites(q) { const comp = comportement(q.meta); return q.options.map(o => reclamation(o.cle, comp)); }

F['suites/oscillante'] = verifLimites;
F['suites/geometrique'] = verifLimites;
F['suites/arithmetico-geometrique'] = q => {
  const cles = q.options.map(o => o.cle);
  if (cles[0].startsWith('num:')) {
    const { p, q: qq, u0 } = q.meta; let u = u0; for (let i = 0; i < 2; i++) u = p * u + qq;
    return cles.map(c => Number(c.slice(4)) === u);
  }
  if (cles[0].startsWith('g:')) {
    const { p, q: qq, u0 } = q.meta; const us = [u0]; for (let i = 0; i < 9; i++) us.push(p * us[i] + qq);
    return cles.map(c => { const cc = Number(c.slice(2)); const v = us.map(x => x - cc); if (v.some(x => Math.abs(x) < 1e-12)) return false; return constantes(v.slice(1).map((x, i) => x / v[i])); });
  }
  if (cles[0].startsWith('f:')) {
    const { p, q: qq, u0 } = q.meta; const us = [u0]; for (let i = 0; i < 10; i++) us.push(p * us[i] + qq);
    return cles.map(c => { const f = new Function('n', 'return ' + c.slice(2)); return us.every((x, n) => eq(f(n), x, 1e-9)); });
  }
  return verifLimites(q);
};
F['suites/gendarmes'] = q => {
  if (q.meta.enc) {                              // encadrements explicites : modèles compatibles avec l'hypothèse
    const M = q.meta;
    const modeles = { 1: [n => (M.k === 1 ? n : M.k * n) + M.a + 0.5, n => (M.k * n) + M.b - 0.5, n => M.k * n + (M.a + M.b) / 2],
      2: [n => M.a + Math.pow(1 / M.q, n), M.hi, n => (M.a + Math.pow(1 / M.q, n) + M.hi(n)) / 2],
      3: [n => -1 - 1 / (n + 1), n => 0, n => -0.5 - 0.5 / (n + 1)] }[M.enc];
    const comp = modeles.map(f => classer(f, 100000));
    return q.options.map(o => {
      const c = o.cle;
      if (c === 'rien') return !(comp.every(x => x.type === 'inf') || comp.every(x => x.type === '-inf') || comp.every(x => x.type === 'lim' && Math.abs(x.x - comp[0].x) < 1e-3));
      if (c === 'inf') return comp.every(x => x.type === 'inf');
      if (c === '-inf') return comp.every(x => x.type === '-inf');
      if (c === 'conv') return comp.every(x => x.type === 'lim');
      if (c === 'div') return comp.every(x => x.type !== 'lim');
      if (c.startsWith('lim:')) return comp.every(x => reclamation(c, x));
      throw new Error('clé inconnue ' + c);
    });
  }
  if (q.meta.cmp) {                              // comparaison : (x_n, y_n) modèles compatibles avec l'hypothèse
    const modeles = { 1: [[n => n, n => n], [n => n, n => n * n], [n => n, n => 2 * n + 1]],
      2: [[n => n, n => -n], [n => n, n => 1 / (n + 1)], [n => n, n => n / 2]],
      3: [[n => -n, n => -n], [n => -n, n => -n * n], [n => -n, n => -2 * n - 1]],
      4: [[n => -n, n => n], [n => -n, n => 1 / (n + 1)], [n => -n, n => -n / 2]] }[q.meta.cmp];
    const comp = modeles.map(([, y]) => classer(y, 3000000));
    return q.options.map(o => {
      const c = o.cle;
      if (c === 'rien') return !(comp.every(x => x.type === 'inf') || comp.every(x => x.type === '-inf'));
      if (c === 'inf') return comp.every(x => x.type === 'inf');
      if (c === '-inf') return comp.every(x => x.type === '-inf');
      if (c === 'conv') return comp.every(x => x.type === 'lim');
      throw new Error('clé inconnue ' + c);
    });
  }
  const { l1, l2 } = q.meta;
  const u = n => l1 - 1 / (n + 1), w = n => l2 + 1 / (n + 1);
  const modeles = [u, w, n => (n % 2 === 0 ? u(n) : w(n)), n => (u(n) + w(n)) / 2];
  const compM = modeles.map(f => classer(f, 100000));
  return q.options.map(o => {
    const c = o.cle;
    if (c.startsWith('enc:')) {
      const [bas, haut] = c.slice(4).split(',');
      const val = nm => ({ u0: u(0), w0: w(0), l1, l2 }[nm]);
      return modeles.every(f => { for (let n = 0; n < 300; n++) { const v = f(n); if (v < val(bas) - 1e-12 || v > val(haut) + 1e-12) return false; } return true; });
    }
    if (c === 'rien') return !compM.every(x => x.type === 'lim' && Math.abs(x.x - compM[0].x) < 1e-3);
    if (c === 'conv') return compM.every(x => x.type === 'lim' && x.x >= l1 - 1e-3 && x.x <= l2 + 1e-3);
    if (c === 'ou') return compM.every(x => x.type === 'lim' && (Math.abs(x.x - l1) < 1e-3 || Math.abs(x.x - l2) < 1e-3));
    if (c === 'div') return compM.every(x => x.type !== 'lim');
    if (c.startsWith('lim:')) return compM.every(x => reclamation(c, x));
    throw new Error('clé inconnue ' + c);
  });
};
F['suites/nature'] = q => {
  const cles = q.options.map(o => o.cle), M = q.meta;
  if (M.w0 !== undefined) {                        // suite définie par inversion
    const ws = [M.w0]; for (let i = 0; i < 12; i++) ws.push(ws[i] / (1 + M.c * ws[i]));
    if (cles[0].startsWith('f:')) return cles.map(c => { const f = new Function('n', 'return ' + c.slice(2)); return ws.every((x, n) => eq(f(n), x, 1e-9)); });
    return cles.map(c => {
      if (c === 'none') return (M.k ? [M.k] : [1.7, 3.3]).every(k => { const t = ws.map(x => k / x); const d = t.slice(1).map((x, i) => x - t[i]); const r = t.slice(1).map((x, i) => x / t[i]); return !constantes(d) && !constantes(r); });
      const [genre, expr] = [c.slice(0, 2), c.slice(3)];
      return (M.k ? [M.k] : [1.7, 3.3]).every(k => {
        const f = new Function('k', 'return ' + expr), val = f(k);
        const t = ws.map(x => k / x);
        return genre === 'ar' ? constantes(t.slice(1).map((x, i) => x - t[i])) && eq(t[1] - t[0], val, 1e-9) : constantes(t.slice(1).map((x, i) => x / t[i])) && eq(t[1] / t[0], val, 1e-9);
      });
    });
  }
  const u = M.u, xs = Array.from({ length: 12 }, (_, n) => u(n));
  const d = xs.slice(1).map((x, i) => x - xs[i]), r = xs.slice(1).map((x, i) => x / xs[i]);
  const estAr = constantes(d, 1e-9), estGe = xs.every(x => Math.abs(x) > 1e-12) && constantes(r, 1e-9);
  return cles.map(c => {
    if (c === 'none') return !estAr && !estGe;
    if (c.startsWith('ar:')) return estAr && eq(d[0], nombre(c.slice(3)), 1e-9);
    if (c.startsWith('ge:')) return estGe && eq(r[0], nombre(c.slice(3)), 1e-9);
    throw new Error('clé inconnue ' + c);
  });
};
const RECURRENCES = {
  ln: x => Math.log(1 + x), inv: x => x / (1 + x), rac: x => Math.sqrt(x), exp: x => Math.exp(x) - 1, rac2: x => Math.sqrt(x + 2),
  heron: x => (x * x + 2) / (2 * x), mob: x => (2 * x + 3) / (x + 2)
};
F['suites/variations'] = q => {
  const cles = q.options.map(o => o.cle), M = q.meta;
  if (['inc', 'dec', 'nomono', 'const'].includes(cles[0])) {
    const s = sensDe(M.u, 0, 20);
    return cles.map(c => c === 'inc' ? s.inc : c === 'dec' ? s.dec : c === 'const' ? s.cst : !(s.inc || s.dec || s.cst));
  }
  if (M.id) {
    const f = RECURRENCES[M.id]; let v = M.v0; const vs = [v];
    for (let i = 0; i < 400; i++) { v = f(v); vs.push(v); }
    const premiers = n => vs[n];
    const s = sensDe(premiers, 0, 2);
    const fin = vs[400], avant = vs[399];
    const conv = Number.isFinite(fin) && Math.abs(fin - avant) < 1e-3, inf = !Number.isFinite(fin) || fin > 1e6;
    return cles.map(c => c === 'incconv' ? s.inc && conv : c === 'incinf' ? s.inc && inf : c === 'decconv' ? s.dec && conv : c === 'decinf' ? s.dec && fin < -1e6 : false);
  }
  return verifLimites(q);                           // limite d'une suite récurrente
};
F['suites/recurrence'] = q => {
  const M = q.meta, f = M.kind === 'aff' ? (x => M.p * x + M.q) : (x => Math.sqrt(2 * x + M.k));
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i <= 2000; i++) { const x = M.a + (M.b - M.a) * i / 2000, y = f(x); lo = Math.min(lo, y); hi = Math.max(hi, y); }
  return q.options.map(o => { const [l, h] = o.cle.slice(2).split(',').map(Number); return Math.abs(l - lo) < 1e-9 && Math.abs(h - hi) < 1e-9; });
};
// somme AFFICHÉE « \sum_{k=a}^{b} terme » : relue dans l'énoncé et recalculée terme à terme
function sommeAffichee(q, indiceMath) {
  const tex = LX.mathDe(q.enonce, indiceMath || 0), mm = /\\sum_\{k=(-?\d+)\}\^\{(\w+)\}(.*)$/.exec(tex);
  if (!mm) throw new Error('somme non trouvée dans ' + tex);
  const g = LX.fonction(mm[3]);
  return { bas: Number(mm[1]), haut: mm[2], terme: k => g(0, { k }) };
}
F['suites/sommes'] = q => {
  const M = q.meta;
  switch (M.tipo) {
    case 'valeur': {
      const { bas, haut, terme } = sommeAffichee(q), H = Number(haut); let S = 0; for (let k = bas; k <= H; k++) S += terme(k);
      return q.options.map(o => egale(valeurOption(o), S, 1e-9 * (1 + Math.abs(S))));
    }
    case 'forme': {
      const { bas, terme } = sommeAffichee(q, 1);
      return q.options.map(o => { const g = LX.fonction(LX.mathDe(o.affichage)); for (let n = 1; n <= 9; n++) { let S = 0; for (let k = bas; k <= n; k++) S += terme(k); if (!egale(g(0, { n }), S, 1e-9 * (1 + Math.abs(S)))) return false; } return true; });
    }
    case 'limite': {
      const { bas, terme } = sommeAffichee(q, 0), N = 20000, cum = []; let S = 0;
      for (let k = bas; k <= N + 3; k++) { S += terme(k); cum[k] = S; }
      const comp = classer(n => cum[n], N);
      return q.options.map(o => reclamation(o.cle, comp));
    }
    case 'bernoulli': {
      return q.options.map(o => {
        const [g, d] = LX.mathDe(o.affichage).split(/\\(?:ge|le)(?![a-z])/), sens = /\\ge(?![a-z])/.test(LX.mathDe(o.affichage)) ? 1 : -1, fg = LX.fonction(g), fd = LX.fonction(d);
        const as = M.general ? [0.1, 0.5, 1, 2, 5] : [0];
        for (const a of as) for (let n = 0; n <= 40; n++) if (sens * (fg(0, { n, a }) - fd(0, { n, a })) < -1e-9 * (1 + Math.abs(fg(0, { n, a })))) return false;
        return true;
      });
    }
    case 'rang': {
      const pieces = [...q.enonce.matchAll(/\\\((.*?)\\\)/gs)].map(x => x[1]), rel = pieces.find(t => /^1\+.*n\\ge \d+$/.test(t)), bern = pieces.find(t => /^\\left\(1\+/.test(t));
      const r = LX.relation(rel); let n0 = 0; while (!(r.gauche(0, { n: n0 }) >= r.droite(0, { n: n0 }) - 1e-12)) n0++;
      const [bg, bd] = bern.split('\\ge'), a = r.gauche(0, { n: 1 }) - 1; if (Math.abs(LX.fonction(bg)(0, { n: 7 }) - Math.pow(1 + a, 7)) > 1e-9 || Math.abs(LX.fonction(bd)(0, { n: 7 }) - (1 + 7 * a)) > 1e-9) throw new Error('Bernoulli incohérent');
      return q.options.map(o => egale(valeurOption(o), n0));
    }
    default: throw new Error('type inconnu');
  }
};
F['suites/algorithme-seuil'] = q => {
  const Mt = q.meta;
  if (Mt.f !== undefined) {                       // seuil en contexte : plus petit n tel que v0 f^n dépasse (ou passe sous) la cible
    let n = 0, v = Mt.v0; while (Mt.croit ? !(v > Mt.cible) : !(v < Mt.cible)) { v *= Mt.f; n++; }
    return q.options.map(o => Number(o.cle.slice(4)) === n);
  }
  if (Mt.large !== undefined) {                   // condition de boucle : doit rendre le premier n tel que u_n >= S (ou > S), pour tout S
    const u = n => { let x = Mt.a; for (let i = 0; i < n; i++) x = Mt.p * x + Mt.q; return x; };
    const attendu = S => { let n = 0; while (Mt.large ? u(n) < S : u(n) <= S) n++; return n; };
    return q.options.map(o => {
      const cond = o.cle.slice(5);
      const f = x => (cond === 'u < S' ? x < S0 : cond === 'u <= S' ? x <= S0 : cond === 'u > S' ? x > S0 : x >= S0);
      let S0 = 0;
      for (S0 = Mt.a; S0 <= 3000; S0++) {
        let n = 0, x = Mt.a; while (f(x) && n < 100) { x = Mt.p * x + Mt.q; n++; }
        if (n !== attendu(S0)) return false;
      }
      return true;
    });
  }
  const { a, p, q: qq, S, cmp, ret } = q.meta;
  const cont = x => (cmp === '<' ? x < S : cmp === '<=' ? x <= S : cmp === '>' ? x > S : x >= S);
  let u = a, n = 0; while (cont(u) && n < 1000) { u = p * u + qq; n++; }
  const res = ret === 'n' ? n : u;
  return q.options.map(o => Number(o.cle.slice(4)) === res);
};
F['suites/convergence-monotone'] = q => {
  const cles = q.options.map(o => o.cle), M = q.meta;
  if (!M.cas) return cles.map(c => c === 'adj');     // suites adjacentes : seule la première affirmation est le théorème
  if (M.cas === 'ineg') {
    const b = M.b, min = M.sens === 'min';
    const modeles = min ? [n => b + 1 + 1 / (n + 1), n => b + 1 / (n + 1), n => b + 2] : [n => b - 1 - 1 / (n + 1), n => b - 1 / (n + 1), n => b - 2];
    const lim = modeles.map(f => classer(f, 3000000).x);
    const rel = { ge: l => l >= b - 1e-3, gt: l => l > b + 1e-3, eq: l => Math.abs(l - b) < 1e-3, le: l => l <= b + 1e-3, lt: l => l < b - 1e-3 };
    return cles.map(c => lim.every(rel[c.slice(4)]));
  }
  const Mv = 7, mv = -3, Lv = 5;
  const extra = {
    ccv: [n => Lv - 1 / (n + 1), n => Lv], cdv: [n => Lv + 1 / (n + 1), n => Lv],
    borne: [n => 1 / (n + 1), n => Math.pow(-1, n) / (n + 1), n => Lv - 1 / (n + 1)], bornee: [n => Math.pow(-1, n), n => 1 / (n + 1), n => Math.sin(n)]
  };
  if (extra[M.cas]) {
    const fs = extra[M.cas], pts = Array.from({ length: 400 }, (_, i) => i);
    const tout = pred => fs.every(f => pred(f));
    const croiss = f => pts.slice(1).every(i => f(i) >= f(i - 1) - 1e-12), monot = f => croiss(f) || pts.slice(1).every(i => f(i) <= f(i - 1) + 1e-12);
    const cstRang = f => pts.slice(300).every(i => Math.abs(f(i) - f(300)) < 1e-12);
    const comp = fs.map(f => classer(f, 3000000));
    return cles.map(c => {
      switch (c) {
        case 'le_l': return tout(f => pts.every(i => f(i) <= Lv + 1e-12));
        case 'lt_l': return tout(f => pts.every(i => f(i) < Lv));
        case 'ge_l': return tout(f => pts.every(i => f(i) >= Lv - 1e-12));
        case 'gt_l': return tout(f => pts.every(i => f(i) > Lv));
        case 'cst': return tout(cstRang);
        case 'bornee': return tout(f => pts.every(i => Math.abs(f(i)) < 1e6));
        case 'monotone': return tout(monot);
        case 'croissante': return tout(croiss);
        case 'conv': return comp.every(x => x.type === 'lim');
        case 'rien_conv': return !comp.every(x => x.type === 'lim');
        default: throw new Error('clé inconnue ' + c);
      }
    });
  }
  const modeles = {
    cmaj: [n => Mv - 1 - 1 / (n + 1), n => Mv - 1 / (n + 1), n => Mv - 10 - 1 / (n + 1)],
    dmin: [n => mv + 1 + 1 / (n + 1), n => mv + 1 / (n + 1), n => mv + 10 + 1 / (n + 1)],
    cnonmaj: [n => n, n => n * n, n => Math.pow(n + 1, 0.75)],
    c: [n => n, n => 1 - 1 / (n + 1), n => Math.log(n + 1)]
  }[M.cas];
  const comp = modeles.map(f => classer(f, 3000000));
  const vrai = c => {
    switch (c) {
      case 'conv_le_M': return comp.every((x, i) => x.type === 'lim' && x.x <= Mv + 1e-3);
      case 'conv_M': return comp.every(x => x.type === 'lim' && Math.abs(x.x - Mv) < 1e-3);
      case 'conv_lt_M': return comp.every(x => x.type === 'lim' && x.x < Mv - 1e-3);
      case 'conv_ge_m': return comp.every(x => x.type === 'lim' && x.x >= mv - 1e-3);
      case 'conv_m': return comp.every(x => x.type === 'lim' && Math.abs(x.x - mv) < 1e-3);
      case 'conv_gt_m': return comp.every(x => x.type === 'lim' && x.x > mv + 1e-3);
      case 'inf': return comp.every(x => x.type === 'inf');
      case '-inf': return comp.every(x => x.type === '-inf');
      case 'conv': return comp.every(x => x.type === 'lim');
      case 'conv_ou_inf': return comp.every(x => x.type === 'lim' || x.type === 'inf');
      case 'div': return comp.every(x => x.type !== 'lim');
      case 'rien': return !(comp.every(x => x.type === 'inf') || comp.every(x => x.type === 'lim'));
      default: throw new Error('clé inconnue ' + c);
    }
  };
  return cles.map(vrai);
};


// ---------- géométrie dans l'espace ----------
const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
const sub = (P, Q) => [P[0] - Q[0], P[1] - Q[1], P[2] - Q[2]];
const mul = (k, u) => [k * u[0], k * u[1], k * u[2]];
const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
const nul = u => u.every(x => x === 0);
const col = (u, v) => nul(cross(u, v));
const egal = (u, v) => u.every((x, i) => x === v[i]);
const det = (u, v, w) => dot(u, cross(v, w));
const vect = c => c.split(',').map(Number);
const surDroite = (P, A, u) => col(sub(P, A), u);

F['geometrie-espace/alignement'] = q => {
  const M = q.meta;
  if (M.Cxy) return q.options.map(o => { const v = Number(o.cle.slice(2)); return col(sub(M.B, M.A), sub([M.Cxy[0], M.Cxy[1], v], M.A)); });
  const AB = sub(M.B, M.A), AC = sub(M.C, M.A), aligne = col(AB, AC);
  return q.options.map(o => {
    const [verdict, just] = o.cle.split(':');
    if (verdict === 'yes') {
      if (!aligne) return false;
      const r = /^AC=(-?\d+)AB$/.exec(just);
      if (r) return egal(AC, mul(Number(r[1]), AB));
      return just === 'AB=AC' ? egal(AB, AC) : false;
    }
    return just === 'noprop' ? !aligne : false;
  });
};
F['geometrie-espace/base'] = q => {
  const M = q.meta;
  if (M.u && M.w) {
    const cop = det(M.u, M.v, M.w) === 0;
    return q.options.map(o => {
      const [verdict, just] = [o.cle.slice(0, o.cle.indexOf(':')), o.cle.slice(o.cle.indexOf(':') + 1)];
      if (verdict === 'oui') return just === 'norel' ? !cop : false;
      const r = /^w=(-?\d+)u\+(-?\d+)v$/.exec(just);
      if (r) return cop && egal(M.w, [0, 1, 2].map(i => Number(r[1]) * M.u[i] + Number(r[2]) * M.v[i]));
      if (just === 'col:uv') return cop && col(M.u, M.v);
      if (just === 'col:uw') return cop && col(M.u, M.w);
      throw new Error('clé inconnue ' + o.cle);
    });
  }
  const base = x => det(M.u, M.v, [x, M.y0, M.z0]) !== 0, ms = Array.from({ length: 81 }, (_, i) => i - 40);
  return q.options.map(o => {
    const [, genre, c] = o.cle.split(':');
    if (o.cle === 'm:all') return ms.every(base);
    const cc = Number(c);
    return genre === 'ne' ? ms.every(x => (x !== cc) === base(x)) : ms.every(x => (x === cc) === base(x));
  });
};
F['geometrie-espace/droite'] = q => {
  const M = q.meta;
  if (M.n2) return q.options.map(o => { const [P, D] = o.cle.slice(2).split('|').map(vect); return dot(M.n, P) + M.d === 0 && dot(M.n2, P) + M.d2 === 0 && dot(M.n, D) === 0 && dot(M.n2, D) === 0 && !nul(D); });
  if (M.B) { const u = sub(M.B, M.A); return q.options.map(o => { const [P, D] = o.cle.slice(2).split('|').map(vect); return surDroite(P, M.A, u) && col(D, u) && !nul(D); }); }
  if (M.n) return q.options.map(o => { const [P, D] = o.cle.slice(2).split('|').map(vect); return surDroite(P, M.A, M.n) && col(D, M.n) && !nul(D); });
  return q.options.map(o => { const v = vect(o.cle.slice(2)); return col(v, M.u) && !nul(v); });
};
F['geometrie-espace/appartenance'] = q => {
  const M = q.meta;
  if (M.u) return q.options.map(o => surDroite(vect(o.cle.slice(2)), M.A, M.u));
  return q.options.map(o => dot(M.c, vect(o.cle.slice(2))) + M.d === 0);
};
F['geometrie-espace/orthogonalite'] = q => {
  const M = q.meta;
  if (M.P && q.options[0].cle.startsWith('tri:')) {              // nature d'un triangle
    const [A, B, C] = M.P, ab = dot(sub(B, A), sub(B, A)), bc = dot(sub(C, B), sub(C, B)), ca = dot(sub(A, C), sub(A, C));
    const droit = dot(sub(B, A), sub(C, A)) === 0 || dot(sub(A, B), sub(C, B)) === 0 || dot(sub(A, C), sub(B, C)) === 0;
    const iso = ab === bc || bc === ca || ca === ab, equi = ab === bc && bc === ca;
    return q.options.map(o => ({ 'tri:rect': droit, 'tri:iso': iso && !equi, 'tri:equi': equi, 'tri:quel': !droit && !iso })[o.cle]);
  }
  if (M.P) {
    const [A, B, C] = M.P, ang = { A: dot(sub(B, A), sub(C, A)) === 0, B: dot(sub(A, B), sub(C, B)) === 0, C: dot(sub(A, C), sub(B, C)) === 0 };
    return q.options.map(o => { const k = o.cle.slice(5); return k === 'none' ? !(ang.A || ang.B || ang.C) : ang[k]; });
  }
  if (M.b !== undefined) return q.options.map(o => Number(o.cle.slice(2)) * M.v[0] + M.b * M.v[1] + M.c * M.v[2] === 0);
  return q.options.map(o => Number(o.cle.slice(4)) === dot(M.u, M.v));
};
F['geometrie-espace/plan'] = q => {
  const M = q.meta;
  if (M.c && M.d !== undefined && !M.A) return q.options.map(o => { const v = vect(o.cle.slice(2)); return col(v, M.c) && !nul(v); });
  const passe = (e, P) => dot(e.slice(0, 3), P) + e[3] === 0;
  if (M.n) return q.options.map(o => { const e = vect(o.cle.slice(2)); return col(e.slice(0, 3), M.n) && passe(e, M.A); });
  return q.options.map(o => { const e = vect(o.cle.slice(2)); return !nul(e.slice(0, 3)) && passe(e, M.A) && passe(e, M.B) && passe(e, M.C); });
};

F['geometrie-espace/deux-droites'] = q => {
  const { A, u, B, v } = q.meta, w = sub(B, A);
  let statut, M = null;
  if (col(u, v)) statut = surDroite(B, A, u) ? 'conf' : 'par';
  else if (det(u, v, w) !== 0) statut = 'noncop';
  else {                                          // sécantes : A + t u = B + s v, t = ((B-A) x v) . (u x v) / |u x v|²
    const uv = cross(u, v), tt = dot(cross(w, v), uv) / dot(uv, uv);
    statut = 'sec'; M = A.map((a, i) => a + tt * u[i]);
  }
  return q.options.map(o => {
    if (o.cle === 'sec') return statut === 'sec';
    if (o.cle.startsWith('sec:')) return statut === 'sec' && vect(o.cle.slice(4)).every((x, i) => Math.abs(x - M[i]) < 1e-9);
    if (o.cle.startsWith('P:')) return statut === 'sec' && vect(o.cle.slice(2)).every((x, i) => Math.abs(x - M[i]) < 1e-9);
    return o.cle === statut;
  });
};
F['geometrie-espace/deux-plans'] = q => {
  if (q.options[0].cle.startsWith('R:')) return F['geometrie-espace/droite'](q);     // droite d'intersection
  const { n, d, n2, d2 } = q.meta;
  let statut;
  if (col(n, n2)) {                               // proportionnels y compris la constante ?
    const k = n.findIndex(x => x !== 0), lam = n2[k] / n[k];
    statut = Math.abs(d2 - lam * d) < 1e-9 ? 'conf' : 'par';
  } else statut = dot(n, n2) === 0 ? 'perp' : 'sec';
  return q.options.map(o => o.cle === statut);
};
F['geometrie-espace/angle-plan-median'] = q => {
  const M = q.meta;
  if (M.na !== undefined) return q.options.map(o => Number(o.cle.slice(4)) === Math.round(Math.acos(M.d / Math.sqrt(M.na * M.nb)) * 180 / Math.PI));
  if (M.C) {
    const u = sub(M.B, M.A), v = sub(M.C, M.A), th = Math.acos(dot(u, v) / Math.sqrt(dot(u, u) * dot(v, v))) * 180 / Math.PI;
    return q.options.map(o => Number(o.cle.slice(4)) === Math.round(th));
  }
  const n = sub(M.B, M.A), I2 = [M.A[0] + M.B[0], M.A[1] + M.B[1], M.A[2] + M.B[2]];     // 2 × milieu
  return q.options.map(o => { const e = vect(o.cle.slice(2)); return col(e.slice(0, 3), n) && 2 * e[3] + dot(e.slice(0, 3), I2) === 0; });
};
F['geometrie-espace/distance-projection'] = q => {
  const M = q.meta, num = dot(M.n, M.M) + M.d;
  if (q.options[0].cle.startsWith('d:')) { const val = Math.abs(num) / Math.sqrt(dot(M.n, M.n)); return q.options.map(o => Math.abs(Number(o.cle.slice(2)) - val) < 1e-9); }
  return q.options.map(o => { const H = vect(o.cle.slice(2)); return dot(M.n, H) + M.d === 0 && col(sub(M.M, H), M.n); });
};
F['geometrie-espace/position'] = q => {
  const M = q.meta, nu = dot(M.c, M.u), Ain = dot(M.c, M.A) + M.d === 0;
  return q.options.map(o => {
    const k = o.cle;
    if (k.startsWith('sec:')) { const P = vect(k.slice(4)); return nu !== 0 && surDroite(P, M.A, M.u) && dot(M.c, P) + M.d === 0; }
    if (k.startsWith('P:')) { const P = vect(k.slice(2)); return surDroite(P, M.A, M.u) && dot(M.c, P) + M.d === 0; }
    if (k === 'sec') return nu !== 0;
    if (k === 'par') return nu === 0 && !Ain;
    if (k === 'inc') return nu === 0 && Ain;
    if (k === 'orth') return col(M.u, M.c);
    throw new Error('clé inconnue ' + k);
  });
};

// ---------- banque « fonctions » : vérité recalculée depuis le LaTeX AFFICHÉ (outils/qcm-bac/latex-eval.js) ----------
const dnum = (f, x) => { const h = 1e-5 * Math.max(1, Math.abs(x)); return (f(x + h) - f(x - h)) / (2 * h); };
const d2num = (f, x) => { const h = 1e-3 * Math.max(1, Math.abs(x)); return (f(x + h) - 2 * f(x) + f(x - h)) / (h * h); };
const points = (dom, n) => Array.from({ length: n || 9 }, (_, i) => dom[0] + (dom[1] - dom[0]) * (i + 0.5 + 0.0137 * i) / (n || 9));
const proche = (a, b, tol) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= (tol || 1e-6) * (1 + Math.abs(a) + Math.abs(b));
const droite = o => LX.membreDroit(LX.mathDe(o.affichage));
function enonceContient(q, tex) { if (!q.enonce.includes(tex)) throw new Error('l\'énoncé ne contient pas fTex : ' + tex); }
F['fonctions/derivees'] = q => {
  const M = q.meta; enonceContient(q, M.fTex);
  const f = LX.fonction(M.fTex), xs = points(M.dom);
  return q.options.map(o => { const g = LX.fonction(droite(o)); return xs.every(x => proche(g(x), dnum(f, x), 1e-6)); });
};

F['fonctions/primitives'] = q => {
  const M = q.meta; enonceContient(q, M.fTex);
  const f = LX.fonction(M.fTex), xs = points(M.dom);
  return q.options.map(o => {
    const G = LX.fonction(droite(o));
    return xs.every(x => proche(dnum(G, x), f(x), 1e-6)) && (!M.cond || proche(G(M.cond.x0), M.cond.y0, 1e-9));
  });
};

// équations et inéquations : vérité d'un ensemble affiché (intervalles, réunions, ensembles finis) contre le prédicat de l'énoncé
function racines(g, dom) {
  const xs = [];
  for (let i = -4000; i <= 4000; i++) xs.push(i * 0.0071);                         // grille linéaire
  for (let i = 0; i <= 6000; i++) xs.push(Math.exp(-20 + 26 * i / 6000));            // grille logarithmique (racines proches de 0+)
  xs.sort((a, b) => a - b);
  const res = [];
  for (let i = 0; i + 1 < xs.length; i++) {
    const a = xs[i], b = xs[i + 1];
    if (!dom(a) || !dom(b)) continue;
    const ga = g(a), gb = g(b);
    if (!Number.isFinite(ga) || !Number.isFinite(gb)) continue;
    if (ga === 0 || ga * gb < 0) {
      let lo = a, hi = b;
      for (let k = 0; k < 200; k++) { const mid = (lo + hi) / 2; if (g(lo) * g(mid) <= 0) hi = mid; else lo = mid; }
      const r = (lo + hi) / 2;
      if (!res.some(x => Math.abs(x - r) < 1e-7 * (1 + Math.abs(r)))) res.push(r);
    }
  }
  return res;
}
F['fonctions/equations'] = q => {
  const M = q.meta;
  const args = (M.args || []).map(a => LX.fonction(a));
  const dom = (x, marge) => args.every(a => { const v = a(x); return Number.isFinite(v) && v > (marge || 0); });
  if (M.type !== 'dom') enonceContient(q, M.g);
  const g = M.type === 'dom' ? null : LX.fonction(M.g), h = M.type === 'dom' ? null : LX.fonction(M.h);
  if (M.type === 'dom') { const lncontenu = args.length; if (!lncontenu) throw new Error('domaine sans argument'); }
  const sol = M.type === 'eq' ? racines(x => g(x) - h(x), dom) : null;
  const rel = (x, tol) => { const d = g(x) - h(x); return { '=': Math.abs(d) <= tol, '<': d < -tol, '>': d > tol, '<=': d <= tol, '>=': d >= -tol }[M.op]; };
  return q.options.map(o => {
    const E = LX.ensemble(LX.mathDe(o.affichage));
    if (M.type === 'eq') {
      const pts = E.morceaux.filter(z => z.pt !== undefined).map(z => z.pt);
      return pts.length === sol.length && pts.every(p => sol.some(r => Math.abs(p - r) < 1e-6 * (1 + Math.abs(r)))) && sol.every(r => pts.some(p => Math.abs(p - r) < 1e-6 * (1 + Math.abs(r))));
    }
    const pred = x => dom(x) && (M.type === 'dom' || rel(x, 0));
    const predBord = x => dom(x, 1e-9) && (M.type === 'dom' || rel(x, 1e-9));
    const xs = [];
    for (let i = -3000; i <= 3000; i++) xs.push(i * 0.0113 + 0.00071);
    for (const x of xs) { if (E.bornes().some(b => Math.abs(b - x) < 2e-3)) continue; if (E.contient(x) !== !!pred(x)) return false; }
    for (const b of E.bornes()) {                                                    // bornes ouvertes / fermées : seulement aux vraies frontières
      const vraieFrontiere = !!pred(b - 1e-4) !== !!pred(b + 1e-4);
      if (vraieFrontiere && E.contient(b) !== !!predBord(b)) return false;
    }
    return true;
  });
};

// limites de fonctions : échantillons à des distances croissantes ; « exp » si la formule contient e^
function limiteFonction(fTex, at) {
  const f = LX.fonction(fTex);
  const echelles = at === 'inf' ? [[1e3, 1e6, 1e9], [30, 60, 120]] : at === '-inf' ? [[-1e3, -1e6, -1e9], [-30, -60, -120]] : at === '0+' ? [[1e-3, 1e-6, 1e-9]] : [[1e-3, 1e-5, 1e-7]];
  const classe = (L) => {
    const v = L.map(x => f(x));
    if (v.some(z => !Number.isFinite(z))) return { type: 'nan' };
    const d1 = Math.abs(v[1] - v[0]), d2 = Math.abs(v[2] - v[1]);
    if (d2 < 1e-6 || d2 < 0.1 * d1) return { type: 'lim', x: v[2] };
    if (Math.abs(v[2]) > Math.abs(v[1]) && Math.abs(v[1]) > Math.abs(v[0]) && Math.abs(v[2]) > 10 && Math.sign(v[0]) === Math.sign(v[2])) return { type: v[2] > 0 ? 'inf' : '-inf' };
    return { type: 'nolim' };
  };
  for (const L of echelles) {                       // échelle large d'abord ; si débordement (e^1000…), échelle réduite
    if (at === '0') { const a = classe(L), b = classe(L.map(x => -x)); return a.type === 'lim' && b.type === 'lim' && Math.abs(a.x - b.x) < 1e-3 ? a : { type: 'nolim' }; }
    const r = classe(L);
    if (r.type !== 'nan') return r;
  }
  return { type: 'nan' };
}
F['fonctions/limites'] = q => {
  const M = q.meta; enonceContient(q, M.fTex);
  const L = limiteFonction(M.fTex, M.at), f = LX.fonction(M.fTex);
  if (L.type === 'nan' || L.type === 'nolim') throw new Error('limite non classée : ' + M.fTex + ' en ' + M.at + ' -> ' + JSON.stringify(L));
  if (M.asym) {                                      // droites asymptotes d'un quotient affine
    return q.options.map(o => {
      const d = LX.mathDe(o.affichage), val = LX.valeur(LX.membreDroit(d));
      if (d.startsWith('y=')) return L.type === 'lim' && Math.abs(val - L.x) < 1e-3 * (1 + Math.abs(val));
      return false;
    });
  }
  return q.options.map(o => {
    const v = LX.valeur(LX.mathDe(o.affichage));
    if (L.type === 'inf') return v === Infinity;
    if (L.type === '-inf') return v === -Infinity;
    return Number.isFinite(v) && Math.abs(v - L.x) < 2e-3 * (1 + Math.abs(L.x));
  });
};

F['fonctions/tangente'] = q => {
  const M = q.meta; enonceContient(q, M.fTex);
  const f = LX.fonction(M.fTex);
  if (M.horiz) return q.options.map(o => { const v = LX.valeur(droite(o)); return Number.isFinite(f(v)) && Math.abs(dnum(f, v)) <= 1e-6 * Math.abs(f(v)) + 1e-14; });
  return q.options.map(o => {
    const g = LX.fonction(droite(o)), a = M.a;
    return proche(g(a), f(a), 1e-7) && proche(g(a + 1) - g(a), dnum(f, a), 1e-6);
  });
};

F['fonctions/convexite'] = q => {
  const M = q.meta; enonceContient(q, M.fTex);
  const f = LX.fonction(M.fTex), tol = x => 1e-5 * (1 + Math.abs(f(x)));
  if (M.inflexion !== undefined) {                  // M.fTex est ici f'' : on compte ses changements de signe
    let n = 0, prec = 0;
    for (let x = -6; x <= 6; x += 0.00731) { const v = f(x); if (Math.abs(v) < 1e-12) continue; const sg = Math.sign(v); if (prec && sg !== prec) n++; prec = sg; }
    return q.options.map(o => Number(o.cle.slice(4)) === n);
  }
  if (M.cvxSet) {
    return q.options.map(o => {
      const E = LX.ensemble(LX.mathDe(o.affichage)), bornes = E.bornes();
      for (let x = -12; x <= 12; x += 0.0173) {
        if (bornes.some(b => Math.abs(b - x) < 0.02) || !E.contient(x)) continue;
        if (d2num(f, x) < -tol(x)) return false;
      }
      return true;
    });
  }
  const [lo, hi] = M.win, pas = (hi - lo) / 2400;
  return q.options.map(o => {
    const [genre, a] = o.cle.split(':'), A = Number(a);
    for (let x = lo + pas / 2; x < hi; x += pas) {
      const d = d2num(f, x), t = tol(x);
      if (genre === 'cvx' && d < -t) return false;
      if (genre === 'ccv' && d > t) return false;
      if (genre === 'cc' && Math.abs(x - A) > 0.03 && ((x < A && d > t) || (x > A && d < -t))) return false;
      if (genre === 'cv' && Math.abs(x - A) > 0.03 && ((x < A && d < -t) || (x > A && d > t))) return false;
    }
    return true;
  });
};
F['fonctions/calcul'] = q => {
  const M = q.meta;
  if (M.ineg) {
    const speciaux = [0, 1, -1, 2, -2, 3, 0.5].concat([2, 3, 4, 5, 6].flatMap(k => [Math.log(k), -Math.log(k), 1 / k, k, -k]));      // points d'égalité courants (ln k, 1/k…)
    const dansDom = x => (M.dom === 'R' ? true : M.dom === 'pos' ? x > 0 : x > -1);
    const xs = Array.from({ length: 40 }, (_, i) => (M.dom === 'R' ? -4 + i * 0.25 : M.dom === 'pos' ? 0.25 + i * 0.25 : -0.75 + i * 0.25)).concat(speciaux).filter(dansDom);
    return q.options.map(o => {
      const R = LX.relation(LX.mathDe(o.affichage));
      return xs.every(x => { const a = R.gauche(x), b = R.droite(x), e = 1e-12 * (1 + Math.abs(a) + Math.abs(b)); return { '>=': a >= b - e, '<=': a <= b + e, '>': a > b + e, '<': a < b - e }[R.op]; });
    });
  }
  enonceContient(q, M.fTex);
  const f = LX.fonction(M.fTex), xs = [-1.7, -0.6, 0.3, 1.1, 2.2];
  return q.options.map(o => { const g = LX.fonction(LX.mathDe(o.affichage)); return xs.every(x => proche(g(x), f(x), 1e-9)); });
};
F['fonctions/equations-differentielles'] = q => {
  const M = q.meta, Cs = [1.3, -2.1];
  if (M.odeInv) { enonceContient(q, M.fTex); const f = LX.fonction(M.fTex); return q.options.map(o => { const a = LX.fonction(droite(o))(0, { y: 1 }); return [-1, 0.4, 1.3].every(x => proche(dnum(f, x), a * f(x), 1e-6)); }); }
  return q.options.map(o => {
    const y = LX.fonction(droite(o)), xs = [-1, 0.4, 1.3];
    const ok = Cs.every(C => xs.every(x => proche(dnum(t => y(t, { C }), x), M.a * y(x, { C }) + M.b, 1e-6)));
    if (!ok) return false;
    if (M.mode === 'gen') return Math.abs(y(0.5, { C: Cs[0] }) - y(0.5, { C: Cs[1] })) > 1e-6;
    if (M.mode === 'cond') return proche(y(M.cond.x0, { C: 0 }), M.cond.y0, 1e-9);
    return Math.abs(y(0.5, { C: Cs[0] }) - y(0.5, { C: Cs[1] })) < 1e-9;           // constante
  });
};

// ---------- banque « probabilités » : vérité recalculée par énumération ou loi binomiale exacte ----------
const valeurOption = o => LX.valeur(LX.mathDe(o.affichage).replace(/\\binom\{(\d+)\}\{(\d+)\}/g, (_, a, b) => String(binomial(+a, +b))));
const binomial = (n, k) => { if (k < 0 || k > n) return 0; let r = 1n; for (let i = 1n; i <= BigInt(k); i++) r = r * (BigInt(n) - BigInt(k) + i) / i; return Number(r); };
const pmfB = (n, p, k) => binomial(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
const cdfB = (n, p, k) => { let t = 0; for (let i = 0; i <= Math.min(k, n); i++) t += pmfB(n, p, i); return t; };
const arrondi = (x, nd) => Math.round(x * Math.pow(10, nd) + 1e-9) / Math.pow(10, nd);
const egale = (a, b, t) => Math.abs(a - b) <= (t === undefined ? 1e-9 : t);
function loiDe(o) { const mm = /\\mathcal\{B\}\\left\((.*?)\\,;(.*)\\right\)/.exec(LX.mathDe(o.affichage)); return { n: LX.valeur(mm[1]), p: LX.valeur(mm[2]) }; }
F['probabilites/arbre'] = q => {
  const M = q.meta; let e;
  if (M.tipo === 'arbre2') {
    const p = M.p / 100, q1 = M.q1 / 100, q2 = M.q2 / 100;
    const J = { AB: p * q1, ABn: p * (1 - q1), nAB: (1 - p) * q2, nABn: (1 - p) * (1 - q2) };
    const PB = J.AB + J.nAB, PnB = J.ABn + J.nABn, PA = J.AB + J.ABn;
    e = { AB: J.AB, NAB: J.nAB, BnA: J.ABn / PA, NABn: J.nABn, B: PB, Bbar: PnB, AgB: J.AB / PB, NAgB: J.nAB / PB, AgNB: J.ABn / PnB, p: PA, q2: J.nAB / (1 - PA) }[M.ask];
  } else {
    const P = M.ps.map(x => x / 100), Qs = M.qs.map(x => x / 100), joint = P.map((x, i) => x * Qs[i]), PB = joint.reduce((a, b) => a + b, 0);
    e = M.ask === 'B' ? PB : joint[M.k] / PB;
  }
  const attendu = arrondi(e, M.nd);
  return q.options.map(o => egale(valeurOption(o), attendu, 1e-9));
};
F['probabilites/evenements'] = q => {
  const M = q.meta;
  if (M.tipo === 'claims') {
    return q.options.map(o => {
      const mm = LX.mathDe(o.affichage);
      if (/indépendants/.test(o.affichage)) return egale(M.c, M.a * M.b);
      if (/incompatibles/.test(o.affichage) && /overline/.test(o.affichage)) return egale(1 - (M.a + M.b - M.c), 0);
      if (/incompatibles/.test(o.affichage)) return egale(M.c, 0);
      if (/incluse/.test(o.affichage)) return egale(M.c, M.a);
      throw new Error('affirmation inconnue : ' + o.affichage);
    });
  }
  let e;
  if (M.tipo === 'union') { const AnB = M.a - M.c, nAB = M.b - M.c, nAnB = 1 - M.a - M.b + M.c; e = { U: 1 - nAnB, AnB, NN: nAnB }[M.ask]; e = arrondi(e, 3); }
  else if (M.tipo === 'indep') { e = { AB: M.a * M.b, U: 1 - (1 - M.a) * (1 - M.b), NN: (1 - M.a) * (1 - M.b) }[M.ask]; e = arrondi(e, 4); }
  else if (M.tipo === 'composants') {
    let t = 0; const n = M.ps.length;
    for (let mask = 0; mask < (1 << n); mask++) { let pr = 1, ok = 0; for (let i = 0; i < n; i++) { const f = (mask >> i) & 1; pr *= f ? M.ps[i] : 1 - M.ps[i]; ok += f; } if (M.ask === 'au-moins' ? ok >= 1 : ok === n) t += pr; }
    e = arrondi(t, 4);
  } else if (M.tipo === 'urne' || M.tipo === 'urne3') {
    const boules = [...Array(M.r).fill('R'), ...Array(M.b).fill('B')], nb = M.tipo === 'urne' ? 2 : 3;
    let tot = 0, fav = 0;
    const rec = (suite, utilises) => {
      if (suite.length === nb) {
        tot++; const R = suite.filter(c => c === 'R').length;
        const ok = M.tipo === 'urne' ? { RR: R === 2, RB: R === 1, MC: R !== 1, une: R >= 1 }[M.ask] : (M.ask === 'au-moins-bleue' ? R < 3 : R === 2);
        if (ok) fav++; return;
      }
      boules.forEach((c, i) => { if (!M.avec && utilises.includes(i)) return; rec(suite.concat(c), utilises.concat(i)); });
    };
    rec([], []); e = fav / tot;
  } else throw new Error('type inconnu ' + M.tipo);
  return q.options.map(o => egale(valeurOption(o), e, M.tipo === 'urne' || M.tipo === 'urne3' ? 1e-12 : 1e-9));
};
F['probabilites/binomiale'] = q => {
  const M = q.meta, p = M.p ? M.p.n / M.p.d : M.p;
  if (M.tipo === 'binom-loi') return q.options.map(o => { const L = loiDe(o); return egale(L.n, M.n) && egale(L.p, p); });
  if (M.tipo === 'binom-esp') { const e = M.ask === 'esp' ? M.n * p : M.n * p * (1 - p); return q.options.map(o => egale(valeurOption(o), e)); }
  if (M.tipo === 'binom-expr') {
    const e = M.ask === 'egal' ? pmfB(M.n, p, M.k) : M.ask === 'au-moins' ? 1 - Math.pow(1 - p, M.n) : cdfB(M.n, p, 1);
    return q.options.map(o => egale(valeurOption(o), e, 1e-9));
  }
  if (M.tipo === 'binom-intervalle') {
    return q.options.map(o => {
      const tex = LX.mathDe(o.affichage), [g, d] = tex.split('=');
      const mm = /P\((\d+)\\(lt|le) X\\(lt|le) (\d+)\)/.exec(g);
      const a = +mm[1], b = +mm[4]; let cible = 0;
      for (let k = 0; k <= M.n; k++) if ((mm[2] === 'lt' ? k > a : k >= a) && (mm[3] === 'lt' ? k < b : k <= b)) cible += pmfB(M.n, M.p, k);
      const rhs = d.replace(/P\(X\\le (-?\d+)\)/g, (_, i) => '(' + cdfB(M.n, M.p, +i).toFixed(15) + ')');
      return egale(LX.valeur(rhs), cible, 1e-9);
    });
  }
  throw new Error('type inconnu ' + M.tipo);
};
F['probabilites/binomiale-calcul'] = q => {
  const M = q.meta;
  if (M.tipo === 'binom-num') {
    const e = M.ask === 'egal' ? pmfB(M.n, M.p, M.k) : M.ask === 'le' ? cdfB(M.n, M.p, M.k) : 1 - cdfB(M.n, M.p, M.k - 1);
    return q.options.map(o => egale(valeurOption(o), arrondi(e, 3), 1e-9));
  }
  if (M.tipo === 'binom-seuil-n') { let n = 1; while (1 - Math.pow(1 - M.p, n) < M.alpha - 1e-12) n++; return q.options.map(o => egale(valeurOption(o), n)); }
  if (M.tipo === 'binom-seuil-k') { let k = 0; while (cdfB(M.n, M.p, k) < M.alpha - 1e-12) k++; return q.options.map(o => egale(valeurOption(o), k)); }
  if (M.tipo === 'binom-param') { const p = 1 - Math.pow(1 / M.den, 1 / M.n); return q.options.map(o => egale(valeurOption(o), p, 1e-9)); }
  throw new Error('type inconnu ' + M.tipo);
};
F['probabilites/esperance'] = q => {
  const M = q.meta;
  if (M.tipo === 'variables') return F['probabilites/variables'](q);
  const E = M.xs.reduce((a, x, i) => a + x * M.ws[i] / M.D, 0), E2 = M.xs.reduce((a, x, i) => a + x * x * M.ws[i] / M.D, 0);
  const e = M.ask === 'E' ? E : E2 - E * E;
  return q.options.map(o => egale(valeurOption(o), e, 1e-9));
};
F['probabilites/variables'] = q => {
  const M = q.meta;
  const e = { 'lin-E': () => M.a * M.e + M.b, 'lin-V': () => M.a * M.a * M.v, 'som-E': () => M.e1 + M.e2, 'som-V': () => M.v1 + M.v2, 'dif-V': () => M.v1 + M.v2, 'moy-E': () => M.mu, 'moy-V': () => M.v / M.n, bt: () => M.v / (M.a * M.a), 'bt-n': () => Math.ceil(M.v / (M.al * M.dl * M.dl) - 1e-9) }[M.kind]();
  return q.options.map(o => egale(valeurOption(o), arrondi(e, 4), 1e-9));
};

// ---------- banque « dénombrement » : on DÉNOMBRE (énumération ou programmation dynamique), on ne recalcule pas la formule ----------
function compterListes(n, k, pred) {
  let total = 0; const L = new Array(k);
  (function rec(i) { if (i === k) { if (pred(L)) total++; return; } for (let v = 0; v < n; v++) { L[i] = v; rec(i + 1); } })(0);
  return total;
}
function compterPermutations(n, pred) {
  let total = 0; const L = [], pris = new Array(n).fill(false);
  (function rec() { if (L.length === n) { if (pred(L)) total++; return; } for (let v = 0; v < n; v++) { if (pris[v]) continue; pris[v] = true; L.push(v); rec(); L.pop(); pris[v] = false; } })();
  return total;
}
// choisir k éléments dans des groupes (tailles `groupes`), élément par élément : « pris ou non » ; renvoie le nombre de choix par vecteur de compteurs
function choixParGroupes(groupes, k) {
  let etats = new Map([[JSON.stringify([...groupes.map(() => 0)]), 1]]);
  groupes.forEach((taille, g) => {
    for (let e = 0; e < taille; e++) {
      const suivant = new Map();
      for (const [cle, nb] of etats) {
        suivant.set(cle, (suivant.get(cle) || 0) + nb);                                // l'élément n'est pas pris
        const cpt = JSON.parse(cle); if (cpt.reduce((a, x) => a + x, 0) >= k) continue;
        cpt[g]++; const c2 = JSON.stringify(cpt); suivant.set(c2, (suivant.get(c2) || 0) + nb);   // l'élément est pris
      }
      etats = suivant;
    }
  });
  const res = []; for (const [cle, nb] of etats) { const cpt = JSON.parse(cle); if (cpt.reduce((a, x) => a + x, 0) === k) res.push([cpt, nb]); }
  return res;
}
const sommePred = (res, pred) => res.filter(([c]) => pred(c)).reduce((a, [, nb]) => a + nb, 0);
function triangle(n) { const T = [[1]]; for (let i = 1; i <= n; i++) { T.push([1]); for (let j = 1; j < i; j++) T[i].push(T[i - 1][j - 1] + T[i - 1][j]); T[i].push(1); } return T; }
const PASCAL = triangle(40), Cp = (n, k) => (k < 0 || k > n ? 0 : PASCAL[n][k]);
const cheminsGrille = (a, b, interdit) => { const g = Array.from({ length: a + 1 }, () => new Array(b + 1).fill(0)); g[0][0] = 1; for (let x = 0; x <= a; x++) for (let y = 0; y <= b; y++) { if (interdit && interdit(x, y)) { g[x][y] = 0; continue; } if (x || y) g[x][y] = (x ? g[x - 1][y] : 0) + (y ? g[x][y - 1] : 0); } return g[a][b]; };
F['denombrement/listes'] = q => {
  const M = q.meta;
  const pred = { libre: () => true, distincts: L => new Set(L).size === L.length, premier: L => L[0] !== 0, sans: L => !L.includes(0), 'au-moins': L => L.includes(0), palin: L => L.every((v, i) => v === L[L.length - 1 - i]), croissants: L => L.every((v, i) => i === 0 || v > L[i - 1]) }[M.rule];
  const e = compterListes(M.n, M.k, pred);
  return q.options.map(o => egale(valeurOption(o), e));
};
F['denombrement/permutations'] = q => {
  const M = q.meta; let e;
  if (M.tipo === 'perm') e = compterPermutations(M.n, () => true);
  else if (M.tipo === 'arr') { let t = 0; const L = [], pris = new Array(M.n).fill(false); (function rec() { if (L.length === M.k) { t++; return; } for (let v = 0; v < M.n; v++) { if (pris[v]) continue; pris[v] = true; L.push(v); rec(); L.pop(); pris[v] = false; } })(); e = t; }
  else if (M.tipo === 'anag') { const lettres = M.mot.split(''), vus = new Set(), pris = new Array(lettres.length).fill(false), cur = []; (function rec() { if (cur.length === lettres.length) { vus.add(cur.join('')); return; } for (let i = 0; i < lettres.length; i++) { if (pris[i]) continue; pris[i] = true; cur.push(lettres[i]); rec(); cur.pop(); pris[i] = false; } })(); e = vus.size; }
  else if (M.tipo === 'adj') e = compterPermutations(M.n, L => { const i0 = L.indexOf(0), i1 = L.indexOf(1); const i2 = L.indexOf(2); if (M.rule === 'trois') { const mx = Math.max(i0, i1, i2), mn = Math.min(i0, i1, i2); return mx - mn === 2; } if (M.rule === 'avant') return i0 < i1; if (M.rule === 'extremes') return L[0] === 0 && L[L.length - 1] === 1; return M.rule === 'premier' ? L[0] === 0 : M.rule === 'cote' ? Math.abs(i0 - i1) === 1 : Math.abs(i0 - i1) !== 1; });
  else throw new Error('type inconnu ' + M.tipo);
  return q.options.map(o => egale(valeurOption(o), e));
};
F['denombrement/combinaisons'] = q => {
  const M = q.meta, res = choixParGroupes(M.groupes, M.k), c = M.cond;
  const pred = { libre: () => true, exact: x => x[0] === c.j, 'au-moins': x => x[0] >= c.j, 'au-plus': x => x[0] <= c.j }[c.kind];
  const e = sommePred(res, pred);
  return q.options.map(o => egale(valeurOption(o), e));
};
F['denombrement/parties'] = q => {
  const M = q.meta, pop = x => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
  const pred = { toutes: () => true, 'non-vides': x => x !== 0, k: x => pop(x) === M.k, contient: x => x & 1, propres: x => x !== 0 && x !== (1 << M.n) - 1, pair: x => pop(x) % 2 === 0, contient2: x => (x & 3) === 3, ni2: x => (x & 3) === 0, 'au-moins2': x => pop(x) >= 2 }[M.rule];
  let e = 0; for (let x = 0; x < (1 << M.n); x++) if (pred(x)) e++;
  return q.options.map(o => egale(valeurOption(o), e));
};
F['denombrement/binomiaux'] = q => {
  const M = q.meta;
  if (M.ask === 'val') return q.options.map(o => egale(valeurOption(o), Cp(M.n, M.k)));
  if (M.ask === 'formule') return q.options.map(o => { const f = LX.fonction(LX.mathDe(o.affichage)); for (let n = M.k; n <= 12; n++) if (!egale(f(0, { n }), Cp(n, M.k), 1e-9)) return false; return true; });
  return q.options.map(o => { const [g, d] = valeurDe(o).split('=').map(t => LX.valeur(t)); return egale(g, d); });
};
function valeurDe(o) { return LX.mathDe(o.affichage).replace(/\\binom\{(\d+)\}\{(\d+)\}/g, (_, a, b) => String(Cp(+a, +b))); }
F['denombrement/tirage-simultane'] = q => {
  const M = q.meta, res = choixParGroupes([M.r, M.b], M.k), tot = sommePred(res, () => true);
  let e;
  if (M.ask === 'total') e = tot;
  else e = sommePred(res, M.ask === 'exact' ? c => c[0] === M.j : M.ask === 'au-moins' ? c => c[0] >= 1 : c => c[0] === M.k || c[0] === 0) / tot;
  return q.options.map(o => egale(valeurOption(o), e, 1e-12));
};
F['denombrement/chemins'] = q => {
  const M = q.meta; let e;
  if (M.ask === 'mots') { const dp = Array.from({ length: M.n + 1 }, () => new Array(M.k + 2).fill(0)); dp[0][0] = 1; for (let i = 0; i < M.n; i++) for (let j = 0; j <= M.k; j++) { dp[i + 1][j] += dp[i][j]; dp[i + 1][j + 1] += dp[i][j]; } e = dp[M.n][M.k]; }
  else if (M.ask === 'libre') e = cheminsGrille(M.a, M.b);
  else if (M.ask === 'par') e = cheminsGrille(M.c, M.d) * cheminsGrille(M.a - M.c, M.b - M.d);
  else e = cheminsGrille(M.a, M.b, (x, y) => x === M.c && y === M.d);
  return q.options.map(o => egale(valeurOption(o), e));
};

// ---------- banque « calcul intégral » : l'intégrale est calculée NUMÉRIQUEMENT (Simpson) depuis le LaTeX affiché ----------
function simpson(f, a, b, n) { n = n || 4000; if (n % 2) n++; const h = (b - a) / n; let t = f(a) + f(b); for (let i = 1; i < n; i++) t += f(a + i * h) * (i % 2 ? 4 : 2); return t * h / 3; }
F['integrales/calcul'] = q => {
  const M = q.meta; enonceContient(q, M.fTex);
  const f = LX.fonction(M.fTex), I = simpson(x => f(x), LX.valeur(M.aTex), LX.valeur(M.bTex));
  return q.options.map(o => egale(valeurOption(o), I, 1e-8));
};
F['integrales/moyenne'] = q => {
  const M = q.meta; enonceContient(q, M.fTex);
  const f = LX.fonction(M.fTex), a = LX.valeur(M.aTex), b = LX.valeur(M.bTex), moy = simpson(x => f(x), a, b) / (b - a);
  return q.options.map(o => egale(valeurOption(o), moy, 1e-8));
};
F['integrales/aires'] = q => {
  const M = q.meta; enonceContient(q, M.fTex);
  const f = LX.fonction(M.fTex), g = LX.fonction(M.gTex), a = LX.valeur(M.aTex), b = LX.valeur(M.bTex);
  const A = simpson(x => Math.abs(f(x) - g(x)), a, b, 200000) * M.unite;
  return q.options.map(o => egale(valeurOption(o), A, 1e-6));
};
const CAS_FONCTIONS = [['x', 'x'], ['x^2', 'x^2'], ['1', '1'], ['2-x', '2-x'], ['x-0.5', 'x-0.5'], ['\\sin(x)', '\\sin(x)'], ['e^{x}', 'e^{x}'], ['-x', '-x'], ['x^3-x', 'x^3-x']].map(([t]) => LX.fonction(t));
const CAS_INTERVALLES = [[0, 1], [0, 2], [-1, 1], [1, 3], [0, 3]];
const PRIMITIVES = [[LX.fonction('x^2'), LX.fonction('2x')], [LX.fonction('\\sin(x)'), LX.fonction('\\cos(x)')], [LX.fonction('e^{x}'), LX.fonction('e^{x}')], [LX.fonction('x^3'), LX.fonction('3x^2')]];
function proprieteUniverselle(cle) {
  const I = (f, a, b) => simpson(f, a, b, 4000), ech = (a, b) => Array.from({ length: 41 }, (_, i) => a + (b - a) * i / 40), tol = 1e-9;
  for (const [a, b] of CAS_INTERVALLES) {
    for (const f of CAS_FONCTIONS) for (const g of CAS_FONCTIONS) {
      const ff = x => f(x), gg = x => g(x), If = I(ff, a, b), Ig = I(gg, a, b), pf = ech(a, b).every(x => ff(x) <= gg(x) + tol);
      if (cle === 'mono' && pf && !(If <= Ig + 1e-7)) return false;
      if (cle === 'mono-rec' && If <= Ig + 1e-7 && !pf) return false;
      if (cle === 'somme' && !egale(I(x => ff(x) + gg(x), a, b), If + Ig, 1e-7)) return false;
      if (cle === 'prod' && !egale(I(x => ff(x) * gg(x), a, b), If * Ig, 1e-7)) return false;
    }
    for (const f of CAS_FONCTIONS) {
      const ff = x => f(x), If = I(ff, a, b), pos = ech(a, b).every(x => ff(x) >= -1e-9);
      if (cle === 'pos' && pos && If < -1e-7) return false;
      if (cle === 'pos-rec' && If >= -1e-7 && !pos) return false;
      if (cle === 'carre' && !egale(If * If, I(x => ff(x) * ff(x), a, b), 1e-7)) return false;
      if (cle === 'abs' && Math.abs(If) > I(x => Math.abs(ff(x)), a, b) + 1e-7) return false;
      if (cle === 'lin' && !egale(I(x => 2 * ff(x), a, b), 2 * If, 1e-7)) return false;
      if (cle === 'lin-bad' && !egale(I(x => ff(x) + 2, a, b), If + 2, 1e-7)) return false;
      for (const c of [a + (b - a) / 3, a + 2 * (b - a) / 3]) {
        if (cle === 'chasles' && !egale(If, I(ff, a, c) + I(ff, c, b), 1e-7)) return false;
        if (cle === 'chasles-bad' && !egale(If, I(ff, a, c) - I(ff, c, b), 1e-7)) return false;
      }
    }
    for (const [Fx, dF] of PRIMITIVES) {
      if (cle === 'deriv' && !egale(I(x => dF(x), a, b), Fx(b) - Fx(a), 1e-7)) return false;
      if (cle === 'deriv-bad' && !egale(I(x => dF(x), a, b), dF(b) - dF(a), 1e-7)) return false;
    }
  }
  return true;
}
F['integrales/proprietes'] = q => {
  const M = q.meta;
  if (M.kind === 'claims') return q.options.map(o => proprieteUniverselle(o.cle));
  if (M.kind === 'encadrement') return q.options.map(o => { const mm = /^(-?\d+)\\le I\\le (-?\d+)$/.exec(LX.mathDe(o.affichage)); return !!mm && +mm[1] === M.lo * M.L && +mm[2] === M.hi * M.L; });
  const e = { chasles: () => M.u + M.v, inverse: () => -M.u, const: () => M.c * (M.b - M.a), moy: () => M.u / M.L, lin: () => M.al * M.u + M.be * M.v }[M.kind]();
  return q.options.map(o => egale(valeurOption(o), e));
};
const SUITES_I = {
  exp: n => simpson(x => Math.pow(x, n) * Math.exp(x), 0, 1, 6000), ln: n => simpson(x => Math.pow(Math.log(x), n), 1, Math.E, 6000),
  inv: n => simpson(x => Math.pow(x, n) / (1 + x), 0, 1, 6000), expneg: n => simpson(x => Math.pow(x, n) * Math.exp(-x), 0, 1, 6000), expdec: n => simpson(x => Math.pow(1 - x, n) * Math.exp(x), 0, 1, 6000), atan: n => simpson(x => Math.pow(x, n) / (1 + x * x), 0, 1, 6000), sin: n => simpson(x => Math.exp(-n * x) * Math.sin(x), 0, Math.PI, 40000)
};
F['integrales/suites-integrales'] = q => {
  const M = q.meta, I = SUITES_I[M.id];
  if (M.ask === 'init') return q.options.map(o => egale(valeurOption(o), I(0), 1e-8));
  if (M.ask === 'sens') { const v = Array.from({ length: 16 }, (_, n) => I(n)); const dec = v.every((x, i) => i === 0 || x < v[i - 1] - 1e-12), inc = v.every((x, i) => i === 0 || x > v[i - 1] + 1e-12), cst = v.every(x => Math.abs(x - v[0]) < 1e-12); return q.options.map(o => ({ dec, inc, cst, non: !dec && !inc && !cst })[o.cle]); }
  if (M.ask === 'lim') { const a = I(20), b = I(40), conv = Math.abs(a - b) < 0.1; return q.options.map(o => ({ 0: conv && b < 0.1, 1: conv && Math.abs(b - 1) < 0.05, inf: b > 1e3, non: !conv })[o.cle]); }
  const v = n => I(n);
  return q.options.map(o => {
    const tex = LX.mathDe(o.affichage).replace(/I_\{n\+2\}/g, 'K').replace(/I_\{n\+1\}/g, 'J').replace(/I_n/g, 'I'), [g, d] = tex.split('=');
    for (let n = 1; n <= 6; n++) { const env = { n, I: v(n), J: v(n + 1), K: v(n + 2) }; if (!egale(LX.parse(g)(env), LX.parse(d)(env), 1e-7)) return false; }
    return true;
  });
};
F['integrales/integrale-variable'] = q => {
  const M = q.meta, g = LX.parse(M.fTex), h = LX.fonction(M.haute);
  const Fx = x => simpson(t => g({ t }), M.a, h(x), 4000);
  return q.options.map(o => { const d = LX.fonction(droite(o)); return [0.3, 0.7, 1.1].every(x => egale((Fx(x + 1e-4) - Fx(x - 1e-4)) / 2e-4, d(x), 1e-5)); });
};

// ---------- banque « trigonométrie » : valeurs, racines et signes recalculés sur le LaTeX affiché ----------
const FNT = { cos: Math.cos, sin: Math.sin, tan: Math.tan };
F['trigonometrie/valeurs'] = q => {
  const M = q.meta, e = FNT[M.fn](LX.valeur(M.angleTex));
  return q.options.map(o => egale(valeurOption(o), e, 1e-9));
};
F['trigonometrie/equations'] = q => {
  const M = q.meta, f = FNT[M.fn], c = LX.valeur(M.cTex), lo = LX.valeur(M.loTex), hi = LX.valeur(M.hiTex);
  if (M.op === '=') {
    const sol = racines(x => f(x) - c, x => x >= lo - 1e-12 && x <= hi + 1e-12);
    for (let x = lo; x <= hi; x += 0.01) {              // racines tangentielles (sin x = 1…) : minima locaux de |f - c|
      const g0 = Math.abs(f(x) - c), g1 = Math.abs(f(x - 0.01) - c), g2 = Math.abs(f(x + 0.01) - c);
      if (g0 < 1e-3 && g0 <= g1 && g0 <= g2) { let a = Math.max(lo, x - 0.01), b = Math.min(hi, x + 0.01); for (let k = 0; k < 80; k++) { const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (Math.abs(f(m1) - c) < Math.abs(f(m2) - c)) b = m2; else a = m1; } const r = (a + b) / 2; if (Math.abs(f(r) - c) < 1e-12 && !sol.some(z => Math.abs(z - r) < 1e-6)) sol.push(r); }
    }
    for (const x of [lo, hi]) if (Math.abs(f(x) - c) < 1e-12 && !sol.some(r => Math.abs(r - x) < 1e-6)) sol.push(x);
    return q.options.map(o => { const E = LX.ensemble(LX.mathDe(o.affichage)), pts = E.morceaux.filter(z => z.pt !== undefined).map(z => z.pt); return pts.length === sol.length && pts.every(p => sol.some(r => Math.abs(p - r) < 1e-6)) && sol.every(r => pts.some(p => Math.abs(p - r) < 1e-6)); });
  }
  const rel = (x, tol) => ({ '<=': f(x) <= c + tol, '>=': f(x) >= c - tol, '<': f(x) < c - tol, '>': f(x) > c + tol })[M.op];
  return q.options.map(o => {
    const E = LX.ensemble(LX.mathDe(o.affichage));
    for (let x = lo + 0.00137; x < hi; x += 0.0113) { if (E.bornes().some(b => Math.abs(b - x) < 2e-3)) continue; if (E.contient(x) !== !!rel(x, 0)) return false; }
    for (const b of E.bornes()) { const vraieFrontiere = !!rel(b - 1e-4, 0) !== !!rel(b + 1e-4, 0) && b - 1e-4 >= lo && b + 1e-4 <= hi; if (vraieFrontiere && E.contient(b) !== !!rel(b, 1e-9)) return false; }
    return true;
  });
};
F['trigonometrie/derivees'] = q => {
  const M = q.meta; enonceContient(q, M.fTex);
  const f = LX.fonction(M.fTex), xs = points(M.dom);
  return q.options.map(o => { const g = LX.fonction(droite(o)); return xs.every(x => proche(g(x), dnum(f, x), 1e-6)); });
};
F['trigonometrie/parite-periode'] = q => {
  const M = q.meta;
  if (M.tipo === 'parite') return q.options.map(o => { const f = LX.fonction(droite(o)); const sg = M.paire ? 1 : -1; return [0.3, 0.9, 1.7, 2.6, -1.1].every(x => proche(f(-x), sg * f(x), 1e-9)); });
  const f = LX.fonction(M.fTex);
  const periodique = T0 => [0.1, 0.77, 1.9, -2.3].every(x => proche(f(x + T0), f(x), 1e-9));
  const err = t0 => Math.max(...[0.1, 0.77, 1.9, -2.3, 3.1].map(x => Math.abs(f(x + t0) - f(x))));
  let Tmin = null, prec = err(1e-3), cour = err(2e-3);
  for (let t = 2e-3; t < 7 * Math.PI && Tmin === null; t += 1e-3) {
    const suiv = err(t + 1e-3);
    if (cour < prec && cour <= suiv && cour < 0.05) { let a = t - 1e-3, b = t + 1e-3; for (let k = 0; k < 80; k++) { const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (err(m1) < err(m2)) b = m2; else a = m1; } if (err((a + b) / 2) < 1e-9) Tmin = (a + b) / 2; }
    prec = cour; cour = suiv;
  }
  return q.options.map(o => Math.abs(LX.valeur(LX.mathDe(o.affichage)) - Tmin) < 2e-3);
};
F['trigonometrie/etude'] = q => {
  const M = q.meta;
  if (M.tipo === 'concavite') { const f = LX.fonction(M.fTex); return q.options.map(o => { const E = LX.ensemble(LX.mathDe(o.affichage)), b = E.bornes(); const [lo, hi] = [Math.min(...b), Math.max(...b)]; for (let x = lo + 0.01; x < hi; x += 0.0173) if (d2num(f, x) > 1e-5 * (1 + Math.abs(f(x)))) return false; return true; }); }
  const f = LX.fonction(M.fTex), df = x => dnum(f, x), A = (M.lo === undefined ? 0 : M.lo) * Math.PI / 180, B = (M.hi === undefined ? 180 : M.hi) * Math.PI / 180;
  if (M.ask === 'signe') return q.options.map(o => { const E = LX.ensemble(LX.mathDe(o.affichage)); for (let x = A + 0.0057; x < B; x += 0.0097) { if (E.bornes().some(b => Math.abs(b - x) < 2e-3)) continue; if (E.contient(x) !== (df(x) >= 0)) return false; } return true; });
  const crit = []; for (let x = A + 0.01; x < B - 0.01; x += 0.001) if (df(x) * df(x + 0.001) < 0) crit.push(x + 0.0005);
  return q.options.map(o => { const v = LX.valeur(LX.mathDe(o.affichage)); const c = crit.find(r => Math.abs(r - v) < 2e-3); if (c === undefined) return false; const avant = df(c - 0.01), apres = df(c + 0.01); return M.ask === 'max' ? avant > 0 && apres < 0 : avant < 0 && apres > 0; });
};
function limiteTrigo(fTex, at) {
  const f = LX.fonction(fTex), echelles = at === 'inf' ? [1e3, 1e6, 1e9] : at === '0+' ? [1e-2, 1e-3, 1e-4] : [1e-2, 1e-3, 1e-4];
  const classe = L => { const v = L.map(x => f(x)); if (v.some(z => !Number.isFinite(z))) return { type: 'nan' }; const d1 = Math.abs(v[1] - v[0]), d2 = Math.abs(v[2] - v[1]); if (d2 < 1e-6 || d2 < 0.25 * d1) return { type: 'lim', x: v[2] }; if (Math.abs(v[2]) > Math.abs(v[1]) && Math.abs(v[1]) > Math.abs(v[0]) && Math.abs(v[2]) > 10) return { type: v[2] > 0 ? 'inf' : '-inf' }; return { type: 'nolim' }; };
  if (at === '0') { const a = classe(echelles), b = classe(echelles.map(x => -x)); return a.type === 'lim' && b.type === 'lim' && Math.abs(a.x - b.x) < 5e-3 ? a : { type: 'nolim' }; }
  return classe(echelles);
}
F['trigonometrie/limites'] = q => {
  const M = q.meta; enonceContient(q, M.fTex);
  const L = limiteTrigo(M.fTex, M.at);
  if (L.type === 'nan' || L.type === 'nolim') throw new Error('limite non classée : ' + M.fTex + ' en ' + M.at + ' -> ' + JSON.stringify(L));
  return q.options.map(o => { const v = LX.valeur(LX.mathDe(o.affichage)); if (L.type === 'inf') return v === Infinity; if (L.type === '-inf') return v === -Infinity; return Number.isFinite(v) && Math.abs(v - L.x) < 5e-3 * (1 + Math.abs(L.x)); });
};
F['trigonometrie/formules'] = q => {
  const M = q.meta;
  if (M.tipo === 'connaissant') {
    const c = M.cn / M.cd, s = (M.quad === 'haut' ? 1 : -1) * Math.sqrt(1 - c * c), e = { sin: s, cos2: Math.cos(2 * Math.acos(c) * (M.quad === 'haut' ? 1 : -1)), sin2: Math.sin(2 * Math.atan2(s, c)) }[M.ask];
    return q.options.map(o => egale(valeurOption(o), e, 1e-9));
  }
  return q.options.map(o => { const [g, d] = LX.mathDe(o.affichage).split('='); const fg = LX.fonction(g), fd = LX.fonction(d); const paires = [[0.3, 1.1], [1.7, -0.4], [2.2, 0.9], [-1.3, 0.6], [0.8, 2.4]]; const vraie = paires.every(([x, y]) => proche(fg(x, { y }), fd(x, { y }), 1e-9)); return M.neg ? !vraie : vraie; });
};

// ---------- banque « algorithmique » : le programme Python affiché est EXÉCUTÉ (python3, mode isolé) ----------
const cachePy = new Map();
function pyEval(code, expr) {
  const cle = code + '\u0000' + expr; if (cachePy.has(cle)) return cachePy.get(cle);
  const r = spawnSync('python3', ['-I', '-c', code + '\nprint(repr(' + expr + '))'], { timeout: 1500, encoding: 'utf8' });
  if (r.status !== 0) throw new Error('python : ' + String(r.stderr || r.error || 'délai dépassé').slice(0, 160));
  const v = Number(r.stdout.trim()); cachePy.set(cle, v); return v;
}
const verifLecture = q => { const M = q.meta, v = pyEval(M.code, M.appel); return q.options.map(o => egale(valeurOption(o), v, 1e-9)); };
F['algorithmique/lecture'] = verifLecture;
F['algorithmique/euler'] = q => {
  const M = q.meta; if (M.tipo === 'lecture') return verifLecture(q);
  if (M.kind === 'formule') { const y1 = M.y0 + M.h * (M.a * M.y0 + M.b); return q.options.map(o => egale(valeurOption(o), y1, 1e-9)); }
  let y = 1; const ys = [y]; for (let k = 0; k < 4; k++) { y = y + M.h * M.a * y; ys.push(y); }
  return q.options.map(o => ys.slice(1).every((v, i) => egale(v / ys[i], valeurOption(o), 1e-9)));
};
F['algorithmique/rectangles'] = q => {
  const M = q.meta; if (M.tipo === 'lecture') return verifLecture(q);
  const f = LX.fonction(M.fTex), I = simpson(x => f(x), M.a, M.b, 20000);
  const gauche = n => { const h = (M.b - M.a) / n; let s = 0; for (let k = 0; k < n; k++) s += h * f(M.a + k * h); return s; };
  const mino = [4, 10, 50].every(n => gauche(n) < I - 1e-12), majo = [4, 10, 50].every(n => gauche(n) > I + 1e-12);
  return q.options.map(o => ({ minorant: mino, majorant: majo, egal: false, rien: false })[o.cle]);
};
F['algorithmique/completer'] = q => {
  const M = q.meta, ref = M.ref.join('\n');
  const attendus = M.appelRef.map(a => pyEval(ref, a));
  return q.options.map(o => {
    const code = M.template.join('\n').replace('{}', o.cle);
    try { return M.appels.every((a, i) => egale(pyEval(code, a), attendus[i], 1e-9 * (1 + Math.abs(attendus[i])))); } catch (e) { return false; }
  });
};

// ---------- contrôle de rédaction ----------
function redaction(q) {
  const pb = [];
  const textes = [q.enonce, q.explication || '', ...q.options.map(o => o.affichage)];
  for (const t0 of textes) {
    if (typeof t0 !== 'string') { pb.push('texte non chaîne'); continue; }
    const t = t0.replace(/<pre[\s\S]*?<\/pre>/g, '').replace(/<code>[\s\S]*?<\/code>/g, '');          // le code Python est vérifié par exécution, pas par ces motifs
    if (/NaN|undefined|Infinity|null/.test(t)) pb.push('valeur invalide : ' + t.slice(0, 60));
    if (/<[A-Za-z]/.test(t.replace(/<\/?(pre|code|br)\b[^>]*>/g, ''))) pb.push('< suivi d\'une lettre (balise HTML involontaire, écrire \\lt) : ' + t.slice(0, 80));
    { const tt = t.replace(/\\\(|\\\)/g, ''), mm = /\+-|-\+|--|\+\+|(?<!\}|_\w)\^\{1\}|\(\)/.exec(tt); if (mm) pb.push('signe collé ou exposant 1 : …' + tt.slice(Math.max(0, mm.index - 40), mm.index + 40) + '…'); }
    if ((t.match(/\\\(/g) || []).length !== (t.match(/\\\)/g) || []).length) pb.push('\\( \\) non appariés : ' + t.slice(0, 60));
    if (/(^|[^\d.])1\\times\s*(\\left|\\dfrac|\\sqrt|[a-z])|\\left\(1\\,/.test(t)) pb.push('coefficient 1 : ' + t.slice(0, 60));
    if (/\{,\}/.test(t.replace(/\\\(.*?\\\)/g, ''))) pb.push('{,} hors zone math');
  }
  const cles = q.options.map(o => String(o.cle === undefined ? o.affichage : o.cle));
  if (new Set(cles).size !== q.options.length) pb.push('clés en double : ' + cles.join(' | '));
  const textesOpt = q.options.map(o => o.affichage);
  if (new Set(textesOpt).size !== q.options.length) pb.push('options identiques');
  if (q.options.length !== 4) pb.push(q.options.length + ' options');
  return pb;
}

// ---------- banque « lectures-graphiques » : la fonction tracée (drawTex) est relue et recalculée, indépendamment du générateur ----------
function lectureGraphique(q) {
  const M = q.meta, fn = LX.fonction(M.drawTex), pb = [];
  for (const [x, y] of M.pts) {
    if (Math.abs(fn(x) - y) > 1e-6) pb.push('le tracé ne suit pas la formule');
    if (y < M.ymin - 1e-9 || y > M.ymax + 1e-9) pb.push('la courbe sort de la fenêtre');
  }
  if (!(M.xmin < 0 && M.xmax > 0 && M.ymin < 0 && M.ymax > 0)) pb.push('origine hors fenêtre');
  if (!q.figure || !q.figure.includes('<polyline') && !q.figure.includes('<path')) pb.push('figure sans courbe');
  return { fn, pb };
}
const enonceTexte = q => q.enonce.replace(/\\\(|\\\)/g, '');
function monotone(g, a, b, sens) {            // g monotone (sens +1 croissante, -1 décroissante) sur [a, b]
  let prec = g(a); for (let i = 1; i <= 400; i++) { const x = a + (b - a) * i / 400, v = g(x); if (sens * (v - prec) < -1e-9) return false; prec = v; }
  return true;
}
function signeSur(g, a, b, sens) {            // g de signe sens (≥ 0 ou ≤ 0) sur [a, b]
  for (let i = 0; i <= 400; i++) { const x = a + (b - a) * i / 400; if (sens * g(x) < -1e-9) return false; } return true;
}
function racinesDe(g, xmin, xmax, k) {
  const r = []; const ajoute = x => { if (!r.length || x - r[r.length - 1] > 0.01) r.push(x); };
  let prec = g(xmin) - k; if (Math.abs(prec) < 1e-9) ajoute(xmin);
  for (let i = 1; i <= (xmax - xmin) * 1000; i++) { const x = xmin + i / 1000, v = g(x) - k; if (Math.abs(v) < 1e-9) ajoute(x); else if (Math.abs(prec) >= 1e-9 && prec * v < 0) ajoute(x); prec = v; }
  return r;
}
function changementsDeSigne(g, xmin, xmax) {  // abscisses (entières ou non) où g change de signe : [{x, de: +1|-1}]
  const res = []; let prec = g(xmin + 0.001);
  for (let x = xmin + 0.002; x < xmax; x += 0.001) { const v = g(x); if (prec * v < 0 || (Math.abs(prec) < 1e-12 && false)) res.push({ x: Math.round(x * 100) / 100, de: Math.sign(prec) }); if (v !== 0) prec = v; }
  return res;
}
const MATCH_TEXTE = {
  cr: t => (/croissante/.test(t) && !/décroissante/.test(t) ? 1 : /décroissante/.test(t) ? -1 : 0),
  ext: t => (/maximum local/.test(t) ? 1 : /minimum local/.test(t) ? -1 : 0),
  cvx: t => (/convexe/.test(t) ? 1 : /concave/.test(t) ? -1 : 0)
};
const optionsIntervalles = (q, test) => q.options.map(o => { const e = LX.ensemble(o.cle); return e.morceaux.every(mc => test(mc.lo, mc.hi)); });
const verifLG = (q, calcul) => {
  const { fn, pb } = lectureGraphique(q); if (pb.length) throw new Error(pb[0]);
  return calcul(fn, q.meta, enonceTexte(q));
};
F['lectures-graphiques/courbe-de-f'] = q => verifLG(q, (f, M, txt) => {
  switch (M.tipo) {
    case 'sol-k': {
      const k = Number(/f\(x\)=(-?\d+)/.exec(txt)[1]); if (k !== M.k) throw new Error('k incohérent');
      const n = racinesDe(f, M.xmin, M.xmax, k).length; return q.options.map(o => Number(o.cle) === n);
    }
    case 'var-f': { const s = MATCH_TEXTE.cr(txt); return optionsIntervalles(q, (a, b) => monotone(f, a, b, s)); }
    case 'ext-f': {
      const s = MATCH_TEXTE.ext(txt), ch = changementsDeSigne(x => (f(x + 1e-4) - f(x - 1e-4)), M.xmin + 0.01, M.xmax - 0.01);
      const ext = ch.filter(c => c.de === s).map(c => f(c.x));   // maximum : la dérivée passe de + à −
      if (ext.length !== 1) throw new Error('extremum non unique');
      return q.options.map(o => Math.abs(Number(o.cle) - ext[0]) < 1e-6);
    }
    case 'infl-f': {
      const ch = changementsDeSigne(x => (f(x + 1e-3) - 2 * f(x) + f(x - 1e-3)), M.xmin + 0.01, M.xmax - 0.01);
      if (ch.length !== 1) throw new Error("point d'inflexion non unique");
      return q.options.map(o => Math.abs(Number(o.cle) - ch[0].x) < 1e-6);
    }
    case 'signe-f': {
      const pos = /\\ge 0/.test(q.enonce) ? 1 : -1;
      return q.options.map(o => { const e = LX.ensemble(o.cle); for (let x = M.xmin; x <= M.xmax + 1e-9; x += 0.05) { if (e.contient(x, 1e-9) !== (pos * f(x) >= -1e-9)) return false; } for (const x of [M.xmin + 0.013, M.xmax - 0.013]) if (e.contient(x, 1e-9) !== (pos * f(x) >= -1e-9)) return false; return true; });
    }
    case 'tangente': {
      const x0 = Number(/f'\((-?\d+)\)/.exec(txt)[1]), A = /A\((-?\d+)\\,;(-?\d+)\)/.exec(q.enonce);
      if (x0 !== M.x0 || Number(A[1]) !== x0 || Math.abs(f(x0) - Number(A[2])) > 1e-9) throw new Error('point A incohérent');
      const der = (f(x0 + 1e-5) - f(x0 - 1e-5)) / 2e-5;
      if (Math.abs(M.tangente.a - der) > 1e-6 || Math.abs(M.tangente.a * x0 + M.tangente.b - f(x0)) > 1e-9) throw new Error('droite tracée ≠ tangente');
      return q.options.map(o => Math.abs(Number(o.cle) - der) < 1e-6);
    }
    case 'integrale': {
      const g = /\\int_\{(-?\d+)\}\^\{(-?\d+)\}/.exec(q.enonce); if (Number(g[1]) !== M.lo || Number(g[2]) !== M.hi) throw new Error('bornes incohérentes');
      if (!signeSur(f, M.lo, M.hi, 1)) throw new Error('fonction non positive');
      const I = simpson(x => f(x), M.lo, M.hi, 4000);
      return q.options.map(o => { const mm = /^(-?\d+)\\le I\\le (-?\d+)$/.exec(o.cle); return I >= Number(mm[1]) && I <= Number(mm[2]); });
    }
    default: throw new Error('type inconnu ' + M.tipo);
  }
});
F['lectures-graphiques/courbe-de-fp'] = q => verifLG(q, (g, M, txt) => {                // g est f' ou f''
  switch (M.tipo) {
    case 'var-fp': { const s = MATCH_TEXTE.cr(txt); return optionsIntervalles(q, (a, b) => signeSur(g, a, b, s)); }
    case 'ext-fp': {
      const s = MATCH_TEXTE.ext(txt), ch = changementsDeSigne(g, M.xmin, M.xmax).filter(c => c.de === s);
      if (ch.length !== 1) throw new Error('extremum non unique');
      return q.options.map(o => Math.abs(Number(o.cle) - ch[0].x) < 1e-6);
    }
    case 'conv-fp': { const s = MATCH_TEXTE.cvx(txt); return optionsIntervalles(q, (a, b) => monotone(g, a, b, s)); }       // f convexe ⇔ f' croissante
    case 'infl-fpp': {
      const ch = changementsDeSigne(g, M.xmin, M.xmax); if (ch.length !== 1) throw new Error('inflexion non unique');
      return q.options.map(o => Math.abs(Number(o.cle) - ch[0].x) < 1e-6);
    }
    case 'conv-fpp': { const s = MATCH_TEXTE.cvx(txt); return optionsIntervalles(q, (a, b) => signeSur(g, a, b, s)); }      // f convexe ⇔ f'' ≥ 0
    default: throw new Error('type inconnu ' + M.tipo);
  }
});

// ---------- boucle principale ----------
const montres = {};
let anomalies = 0, tirages = 0, mutDetectees = 0, mutTotal = 0;
const manquants = [];
for (const [idBanque, banque] of Object.entries(A.banques)) {
  if (BANQUE && BANQUE !== idBanque) continue;
  for (const [idFam, fam] of Object.entries(banque.familles)) {
    if (FAMILLE && FAMILLE !== idFam) continue;
    const verif = F[idBanque + '/' + idFam];
    if (!verif) { manquants.push(idBanque + '/' + idFam); }
    for (const niveau of fam.niveaux || [1, 2, 3]) {
      if (NIVEAU_SEUL && Number(NIVEAU_SEUL) !== niveau) continue;
      const vus = new Set(), vusAvecOptions = new Set(); let ok = 0, nuls = 0, mutOk = 0, mutN = 0;
      for (let i = 0; i < (idBanque === 'algorithmique' ? Math.min(ESSAIS, 120) : ESSAIS); i++) {
        let q;
        try { q = fam.generer(niveau); } catch (e) { console.log(`ERREUR ${idBanque}/${idFam} N${niveau} : ${e.stack.split('\n').slice(0, 2).join(' ')}`); anomalies++; continue; }
        tirages++;
        if (!q) { nuls++; continue; }
        const pb = redaction(q);
        if (verif) {
          let v;
          try { v = verif(q); } catch (e) { pb.push('contrôle impossible : ' + e.message); }
          if (v) {
            if (v[0] !== true) pb.push('la bonne réponse est fausse : ' + q.enonce.slice(0, 100) + ' -> ' + q.options[0].affichage);
            v.slice(1).forEach((x, k) => { if (x === true) pb.push(`la mauvaise réponse ${k + 1} est vraie : ${q.options[k + 1].affichage} (${q.options[k + 1].cle})`); });
            if (MUTATION && i < 60) {                 // la bonne réponse est échangée avec une mauvaise : le contrôle doit échouer
              const k = 1 + (i % 3);
              const q2 = Object.assign({}, q, { options: q.options.slice() });
              [q2.options[0], q2.options[k]] = [q2.options[k], q2.options[0]];
              let v2; try { v2 = verif(q2); } catch (e) { v2 = null; }
              mutN++; mutTotal++;
              if (!v2 || v2[0] !== true || v2.slice(1).some(x => x === true)) { mutOk++; mutDetectees++; }
            }
          }
        }
        if (pb.length) { anomalies++; const cleFam = idBanque + '/' + idFam + niveau; montres[cleFam] = (montres[cleFam] || 0) + 1; if (montres[cleFam] <= 3) console.log(`ANOMALIE ${idBanque}/${idFam} N${niveau} : ${pb.join(' ; ')}\n    ${q.enonce.replace(/\s+/g, ' ').slice(0, 160)}`); }
        else ok++;
        vus.add(q.enonce + (q.figure ? '||' + q.figure : '')); vusAvecOptions.add(q.enonce + (q.figure ? '||' + q.figure : '') + '||' + q.options.map(o => o.affichage).sort().join('|'));
      }
      console.log(`${idBanque}/${idFam} N${niveau} : ${ok}/${ESSAIS} sans anomalie, ${vus.size} énoncés distincts (${vusAvecOptions.size} avec leurs propositions)${nuls ? `, ${nuls} tirages nuls` : ''}${MUTATION ? `, mutation détectée ${mutOk}/${mutN}` : ''}`);
      if (APERCU) {
        for (let i = 0; i < APERCU; i++) { const q = fam.generer(niveau); if (q) console.log('   · ' + q.enonce.replace(/\\\(|\\\)/g, '$').replace(/\s+/g, ' ') + '\n       ✔ ' + q.options[0].affichage.replace(/\\\(|\\\)/g, '$') + '\n       ✘ ' + q.options.slice(1).map(o => o.affichage.replace(/\\\(|\\\)/g, '$')).join('  |  ')); }
      }
    }
  }
}
if (manquants.length) console.log('Familles sans vérificateur : ' + manquants.join(', '));
console.log(`\n${tirages} questions tirées, ${anomalies} anomalie(s)${MUTATION ? `, mutation détectée ${mutDetectees}/${mutTotal}` : ''}.`);
process.exit(anomalies || manquants.length || (MUTATION && mutDetectees !== mutTotal) ? 1 : 0);
