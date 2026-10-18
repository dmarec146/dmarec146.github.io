/* Contrôle des banques du bloc « QCM Bac » (Terminale), sans navigateur ni dépendance.

   Usage :  node outils/qcm-bac/controle-banques.js [--essais 300] [--banque suites] [--mutation] [--apercu N]

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

const RACINE = path.join(__dirname, '..', '..');
const args = process.argv.slice(2);
const opt = (nom, def) => { const i = args.indexOf(nom); return i >= 0 ? (args[i + 1] === undefined || args[i + 1].startsWith('--') ? true : args[i + 1]) : def; };
const ESSAIS = Number(opt('--essais', 300));
const BANQUE = opt('--banque', null);
const MUTATION = args.includes('--mutation');
const APERCU = Number(opt('--apercu', 0));

// ---------- chargement du moteur et des banques dans un contexte isolé ----------
const contexte = { window: {}, document: { addEventListener() {}, getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; } }, console, Math };
contexte.window = contexte;
vm.createContext(contexte);
function charger(chemin) { vm.runInContext(fs.readFileSync(chemin, 'utf8'), contexte, { filename: chemin }); }
charger(path.join(RACINE, 'automatismes/assets/moteur.js'));
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

// ---------- contrôle de rédaction ----------
function redaction(q) {
  const pb = [];
  const textes = [q.enonce, q.explication || '', ...q.options.map(o => o.affichage)];
  for (const t of textes) {
    if (typeof t !== 'string') { pb.push('texte non chaîne'); continue; }
    if (/NaN|undefined|Infinity|null/.test(t)) pb.push('valeur invalide : ' + t.slice(0, 60));
    if (/<[A-Za-z]/.test(t.replace(/<\/?(pre|code)\b[^>]*>/g, ''))) pb.push('< suivi d\'une lettre (balise HTML involontaire, écrire \\lt) : ' + t.slice(0, 80));
    if (/\+-|-\+|--|\+\+|\^\{1\}|\(\)/.test(t.replace(/\\\(|\\\)/g, ''))) pb.push('signe collé ou exposant 1 : ' + t.slice(0, 80));
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

// ---------- boucle principale ----------
const montres = {};
let anomalies = 0, tirages = 0, mutDetectees = 0, mutTotal = 0;
const manquants = [];
for (const [idBanque, banque] of Object.entries(A.banques)) {
  if (BANQUE && BANQUE !== idBanque) continue;
  for (const [idFam, fam] of Object.entries(banque.familles)) {
    const verif = F[idBanque + '/' + idFam];
    if (!verif) { manquants.push(idBanque + '/' + idFam); }
    for (const niveau of fam.niveaux || [1, 2, 3]) {
      const vus = new Set(); let ok = 0, nuls = 0, mutOk = 0, mutN = 0;
      for (let i = 0; i < ESSAIS; i++) {
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
        vus.add(q.enonce);
      }
      console.log(`${idBanque}/${idFam} N${niveau} : ${ok}/${ESSAIS} sans anomalie, ${vus.size} énoncés distincts${nuls ? `, ${nuls} tirages nuls` : ''}${MUTATION ? `, mutation détectée ${mutOk}/${mutN}` : ''}`);
      if (APERCU) {
        for (let i = 0; i < APERCU; i++) { const q = fam.generer(niveau); if (q) console.log('   · ' + q.enonce.replace(/\\\(|\\\)/g, '$').replace(/\s+/g, ' ') + '\n       ✔ ' + q.options[0].affichage.replace(/\\\(|\\\)/g, '$') + '\n       ✘ ' + q.options.slice(1).map(o => o.affichage.replace(/\\\(|\\\)/g, '$')).join('  |  ')); }
      }
    }
  }
}
if (manquants.length) console.log('Familles sans vérificateur : ' + manquants.join(', '));
console.log(`\n${tirages} questions tirées, ${anomalies} anomalie(s)${MUTATION ? `, mutation détectée ${mutDetectees}/${mutTotal}` : ''}.`);
process.exit(anomalies || manquants.length || (MUTATION && mutDetectees !== mutTotal) ? 1 : 0);
