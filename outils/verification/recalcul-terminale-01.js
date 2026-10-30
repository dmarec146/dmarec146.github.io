// Recalcul independant de la fiche 1 de Terminale (generalites sur les probabilites) : chaque reponse est recalculee a partir de l'enonce AFFICHE (texte du tirage, tableau de la loi) par denombrement ou enumeration, sans lire le generateur ; les formules sont evaluees avec des valeurs imposees.
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/terminale/cahier-1/fiche-01.html';
(async () => {
  const s = http.createServer((req, res) => { const f = path.join(RACINE, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0, '127.0.0.1');
  await new Promise((r) => s.on('listening', r));
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${s.address().port}/${FICHE}`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof exercices !== 'undefined' && window.math && document.querySelector('.question'), null, { timeout: 40000 });
  const r = await p.evaluate((N) => {
    const defauts = [], stats = {}; const compte = (k) => { stats[k] = (stats[k] || 0) + 1; };
    const faux = (e, m) => { if (defauts.length < 14) defauts.push(e.id + ' : ' + m + ' | ' + String(e.enonce).replace(/\s+/g, ' ').slice(0, 120)); };
    const proche = (a, c, tol = 1e-8) => Math.abs(a - c) <= tol * (1 + Math.abs(a) + Math.abs(c));
    const mj = (t) => {
      let u = String(t).replace(/\\displaystyle|\\textstyle/g, '').replace(/\{,\}/g, '.').replace(/\\left|\\right|\\,|\\ /g, ' ').replace(/\\times/g, '*').replace(/\\div/g, '/').replace(/\\lt/g, '<').replace(/\\gt/g, '>').replace(/\\frac/g, '\\dfrac');
      for (let i = 0; i < 8; i++) u = u.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
      u = u.replace(/\{/g, '(').replace(/\}/g, ')');
      return u.replace(/(\d)\s*\(/g, '$1*(').replace(/\)\s*(\d)/g, ')*$1').replace(/(\d)\s*([a-zA-Z])/g, '$1*$2').replace(/\)\s*\(/g, ')*(').replace(/\)\s*([a-zA-Z])/g, ')*$1').replace(/\bx\s*\(/g, 'x*(').replace(/\ba\s*\(/g, 'a*(');
    };
    const cache = {}; const val = (t, sc) => { const k = String(t); return (cache[k] || (cache[k] = math.compile(mj(k)))).evaluate(sc || {}); };
    const lireIntervalles = (F) => {
      if (F === '\\emptyset') return []; if (F === '\\mathbb{R}') return [{ bas: -Infinity, haut: Infinity, ib: false, ih: false }];
      return F.split('\\ \\cup\\ ').map((m) => { const q = m.match(/^([\[\]])(.+?)\\,;\\,(.+?)([\[\]])$/); if (!q) throw new Error('intervalle illisible ' + m); const bo = (t) => (/\\infty/.test(t) ? (t.includes('-') ? -Infinity : Infinity) : val(t)); return { bas: bo(q[2]), haut: bo(q[3]), ib: q[1] === '[', ih: q[4] === ']' }; });
    };
    const dans = (L, t) => L.some((iv) => (t > iv.bas + 1e-9 || (Math.abs(t - iv.bas) < 1e-9 && iv.ib)) && (t < iv.haut - 1e-9 || (Math.abs(t - iv.haut) < 1e-9 && iv.ih)));
    const memeEnsemble = (F, vrai, lo, hi) => {
      const L = lireIntervalles(F); const bornes = L.flatMap((iv) => [iv.bas, iv.haut]).filter(isFinite);
      const pas = (hi - lo) / 5000;
      for (let t = lo; t <= hi; t += pas) { if (bornes.some((x) => Math.abs(t - x) < 2 * pas)) continue; const v = vrai(t); if (v === null) continue; if (dans(L, t) !== v) return 'desaccord en ' + t.toFixed(3); }
      for (const x of bornes) { const v = vrai(x); if (v !== null && dans(L, x) !== v) return 'borne ' + x.toFixed(4) + ' mal incluse ou exclue'; }
      for (const iv of L) { if ((iv.bas === -Infinity && iv.ib) || (iv.haut === Infinity && iv.ih)) return 'crochet a l infini'; }
      return null;
    };
    const lireEnsemble = (F) => { if (F === '\\emptyset') return []; const m = F.match(/^\\\{(.*)\\\}$/); if (!m) throw new Error('ensemble illisible ' + F); return m[1].split('\\,;\\,').map((x) => val(x)).sort((u, w) => u - w); };
    const premier = (tx) => tx.match(/\\\((.*?)\\\)/)[1];
    // ---- vecteurs : chaque lettre est un point de coordonnees tirees au hasard ; \vec{x} un vecteur nomme
    const nom = (s) => s.replace(/'/g, 'p');
    const vecMj = (tex) => mj(String(tex).replace(/\\vec\{0\}/g, '0').replace(/\\alpha/g, 'a').replace(/\\overrightarrow\{([A-Z]'?)([A-Z]'?)\}/g, (m, p0, q) => `(${nom(q)}-${nom(p0)})`).replace(/\\vec\{([a-z])\}/g, 'V$1'));
    const evalVec = (tex, pts, extra = {}, vnom = {}) => [0, 1].map((k) => { const sc = { ...extra }; for (const [n, q] of Object.entries(pts)) sc[nom(n)] = q[k]; for (const [n, q] of Object.entries(vnom)) sc['V' + n] = q[k]; return math.evaluate(vecMj(tex), sc); });
    const alea = () => Math.random() * 10 - 5;
    const pointsAleatoires = () => { const q = {}; 'ABCDEFGHIJKLMNPQRSTUVWX'.split('').forEach((l) => { q[l] = [alea(), alea()]; }); q['A\''] = [(q.B[0] + q.C[0]) / 2, (q.B[1] + q.C[1]) / 2]; q['B\''] = [(q.C[0] + q.A[0]) / 2, (q.C[1] + q.A[1]) / 2]; q['C\''] = [(q.A[0] + q.B[0]) / 2, (q.A[1] + q.B[1]) / 2]; q.G = [(q.A[0] + q.B[0] + q.C[0]) / 3, (q.A[1] + q.B[1] + q.C[1]) / 3]; return q; };
    const egalVec = (u, w) => proche(u[0], w[0], 1e-8) && proche(u[1], w[1], 1e-8);
    // reponse en ASCII (« 3*(1-a)AB », « 1/4NF », « (a-1)v ») -> expression en V_xy
    const reponseVec = (rep, pts, extra, vnom) => [0, 1].map((k) => { const sc = { ...extra }; for (const [n, q] of Object.entries(pts)) sc[nom(n)] = q[k]; for (const [n, q] of Object.entries(vnom || {})) sc['V' + n] = q[k]; const ex = String(rep).replace(/([A-Z]'?)([A-Z]'?)/g, (m, p0, q) => ` (${nom(q)}-${nom(p0)}) `).replace(/(?<![A-Za-z])v(?![A-Za-z])/g, ' Vv '); return math.evaluate(ex, sc); });
    const MOTS = {};
    const P5 = { A: [2, 6], B: [5, 6], C: [1, 4], D: [3, 4], E: [6, 4], F: [2, 2], G: [4, 2], H: [3, 1] };
    const coefFrac = (s) => { s = String(s || '').trim(); if (s === '' ) return 1; if (s === '-') return -1; const m = s.match(/^(-?)\\dfrac\{(\d+)\}\{(\d+)\}$/); if (m) return (m[1] ? -1 : 1) * Number(m[2]) / Number(m[3]); return Number(s); };
    const prep = (t) => String(t).replace(/\\displaystyle/g, '').replace(/([nk])\s*(\\left)?\(/g, '$1*$2(').replace(/\\left\|(.*?)\\right\|/g, 'abs($1)').replace(/\\pi/g, 'pi');
    const vt = (t, sc) => val(prep(t), sc);
    const egal = (a, c, tol = 1e-9) => Math.abs(a - c) <= tol * (1 + Math.abs(a) + Math.abs(c));
    const racinesReelles = (gg, lo, hi, pas) => {
      let nb = 0, xp = lo + pas / 7, prec = gg(xp);
      for (let x = xp + pas; x < hi; x += pas) {
        const c = gg(x);
        if (isFinite(prec) && isFinite(c) && prec * c < 0) { let a = xp, b = x, fa = prec; for (let i = 0; i < 70; i++) { const m = (a + b) / 2, fm = gg(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } } if (Math.abs(gg((a + b) / 2)) < 1e-6) nb++; }
        xp = x; prec = c;
      }
      return nb;
    };
    const ensemble = (F) => { if (F === '\\emptyset') return []; return F.match(/^\\\{(.*)\\\}$/)[1].split('\\,;\\,').map((z) => vt(z)).sort((u, w) => u - w); };
    const texteId = (id) => { const el = document.getElementById(id); return el ? el.textContent : ''; };
    // expressions a lettres (a, b, k, n, N, x...) : « a^kb^{9-k} » -> « a^(k)*b^(9-k) »
    const fixe = (t) => String(t).replace(/\\displaystyle/g, '').replace(/\\left|\\right/g, '').replace(/\\times|\\cdot/g, '*').replace(/\^\{([^{}]*)\}/g, '^($1)').replace(/\^([a-zA-Z])/g, '^($1)').replace(/\)([a-zA-Z(])/g, ')*$1').replace(/\{,\}/g, '.');
    const ev = (t, sc) => {
      let u = fixe(t);
      for (let i = 0; i < 8; i++) u = u.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))');
      u = u.replace(/([nk])(?=x)/g, '$1*').replace(/(\d)([a-zA-Z(])/g, '$1*$2').replace(/\)\(/g, ')*(').replace(/([a-zA-Z])\(/g, (m, c) => (['sqrt', 'abs'].includes(c) ? m : c + '*('));
      return math.evaluate(u, sc);
    };
    const f23 = (t) => String(t).replace(/\\dfrac\{(-?\d+)\}\{(\d+)\}/g, '($1/$2)');
    // sommes « \sum_{k=a}^{b} terme » -> valeur numerique ; le terme est un groupe \left( ... \right) ou une suite de caracteres jusqu'au premier + ou - de niveau 0
    const sumsToNum = (t, sc) => {
      let out = '', i = 0;
      const re = /\\displaystyle\\sum_\{k=([^{}]*)\}\^\{([^{}]*)\}/y;
      while (i < t.length) {
        re.lastIndex = i; const m = re.exec(t);
        if (!m) { out += t[i]; i++; continue; }
        let j = i + m[0].length, d = 0, deb = j;
        { while (j < t.length) { const c = t[j]; if (c === '{') d++; else if (c === '}') d--; else if (t.startsWith('\\left(', j)) { d++; j += 5; } else if (t.startsWith('\\right)', j)) { d--; j += 6; } else if (d === 0 && (c === '+' || c === '-' || c === '=')) break; j++; } }
        const terme = t.slice(deb, j), lo = ev(m[1], sc), hi = ev(m[2], sc); let s = 0;
        for (let k = lo; k <= hi + 1e-9; k++) s += ev(terme, { ...sc, k });
        out += '(' + s + ')'; i = j;
      }
      return out;
    };
    const splitTop = (l) => { const out = []; let d = 0, cur = ''; for (const c of String(l)) { if (c === '{') d++; if (c === '}') d--; if (c === '=' && d === 0) { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out; };
    const aplatit = (l) => String(l).replace(/^\\(?:small|scriptsize)\s*/, '');
    // chaines d'egalites contenant des sommes : toutes les valeurs d'une ligne (et le dernier membre de la precedente si elle commence par « = ») doivent etre egales
    const verifChaines = (e, scopes, valS) => {
      const lignes = e.detail.lignes.map(aplatit); let prev = null, nb = 0;
      for (const sc0 of scopes) {
        prev = null;
        for (const l of lignes) {
          if (/\\text|\\iff|\\begin|\\lt|\\gt|\\leqslant|\\geqslant|_\{(?!k)/.test(l)) { prev = null; continue; }
          const sc = { ...sc0 }; if (valS) sc.S = valS(sc);
          const segs = splitTop(l).map((s) => s.trim()); if (segs[0] === '') segs[0] = null;
          const vals = [];
          for (let i = 0; i < segs.length; i++) {
            if (segs[i] === null) { vals.push(prev); continue; }
            try { vals.push(ev(sumsToNum(segs[i], sc), sc)); } catch (er) { vals.push(undefined); }
          }
          const lisibles = vals.filter((v) => typeof v === 'number' && isFinite(v));
          for (let i = 0; i + 1 < vals.length; i++) if (typeof vals[i] === 'number' && typeof vals[i + 1] === 'number' && !egal(vals[i], vals[i + 1], 1e-8)) faux(e, e.id + ' chaine fausse : ' + l.slice(0, 90) + ' => ' + vals[i] + ' | ' + vals[i + 1]);
          nb += lisibles.length;
          const dernier = vals[vals.length - 1]; prev = typeof dernier === 'number' ? dernier : null;
        }
      }
      return nb;
    };
    const evC = (t, sc) => ev(t, sc || {});
    const lat = (s) => (String(s).match(/\\\((.*?)\\\)/g) || []).map((x) => x.slice(2, -2));
    const T = (k) => String(paramsAvances['t' + k] || '');
    const rep = (e) => math.evaluate(String(e.reponse));
    const comp = (e, att, nom) => { if (!egal(rep(e), att, 1e-9)) faux(e, nom + ' attendu ' + att + ' / ecrit ' + e.reponse); };
    const frac = (u, v) => u / v;
    // evaluation d'une formule de la fiche avec des valeurs imposees : tab = { 'P_{T}(S)': 0.3, ... } (cles LaTeX), vars = { n: 3 }
    const evalFormule = (latexF, tab, vars, fixes) => {
      const c = FormulesProba.compiler(latexF); if (!c) throw new Error('formule illisible ' + latexF);
      const m = {}; Object.keys(tab || {}).forEach((k) => { m[FormulesProba.cleDe(k)] = tab[k]; });
      Object.keys(fixes || {}).forEach((k) => { m[FormulesProba.cleDe(k)] = fixes[k]; });
      return c.fonction({ symbole: (cle) => { if (!(cle in m)) throw new Error('symbole non fourni ' + cle); return m[cle]; }, variable: (nom) => { if (!(nom in (vars || {}))) throw new Error('variable non fournie ' + nom); return vars[nom]; } });
    };
    const lireTableau = (html) => { const f = lat(html), i = f.indexOf('P(X=k)'), j = f.indexOf('k'); return { vs: f.slice(j + 1, i), ps: f.slice(i + 1) }; };
    const moy = (vs, ps) => vs.reduce((s, v, i) => s + v * ps[i], 0);
    const vari = (vs, ps) => vs.reduce((s, v, i) => s + v * v * ps[i], 0) - moy(vs, ps) * moy(vs, ps);
    const factoriser = (n) => { const f = {}; let m = n; for (let p = 2; p * p <= m; p++) while (m % p === 0) { f[p] = (f[p] || 0) + 1; m /= p; } if (m > 1) f[m] = (f[m] || 0) + 1; return f; };
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      const par = (id) => ex.find((e) => e.id === id);
      for (const e of ex) {
        if (/undefined|NaN|Infinity/.test(String(e.enonce) + String(e.reponse))) faux(e, 'valeur invalide');
      }
      for (let n = 1; n <= 18; n++) { const tx = T(n); if (/undefined|NaN|Infinity|\$\{/.test(tx)) faux(ex[0], 'texte ' + n + ' invalide : ' + tx.slice(0, 80)); }
      try {
        // ---- 1.1 : valeur et forme (puissances de nombres premiers) ----
        for (const id of ['1.1 a)', '1.1 b)']) {
          const e = par(id), v = evC(e.enonce), r = String(e.reponse), f = factoriser(v);
          const attendu = Object.keys(f).map(Number).sort((a, b) => a - b).map((p) => (f[p] === 1 ? String(p) : p + '^' + f[p])).join('*');
          if (!Number.isInteger(v) || r !== attendu) faux(e, id + ' ' + e.enonce + ' = ' + v + ' ; attendu ' + attendu + ' / ecrit ' + r);
          compte('1.1');
        }
        // ---- 1.2 : egalite des polynomes ----
        for (const id of ['1.2 a)', '1.2 b)', '1.2 c)', '1.2 d)']) {
          const e = par(id);
          for (const x of [-2.3, 0.7, 1.9, 3.1]) if (!egal(evC(e.enonce, { x }), evC(e.reponse, { x }), 1e-9)) faux(e, id + ' ' + e.enonce + ' / ' + e.reponse);
          compte('1.2');
        }
        // ---- 1.3 : loi a completer ----
        {
          const t3 = T(3), vals = lat(t3.match(/valeurs (.*?)\. On suppose/)[1]).map((v) => evC(v)), connues = [...t3.matchAll(/\\\(P\(X=(.*?)\)=(.*?)\\\)/g)].map((m) => [evC(m[1]), evC(m[2])]);
          const prob = (v) => { const c = connues.find((k) => Math.abs(k[0] - v) < 1e-9); return c ? c[1] : 1 - connues.reduce((s, k) => s + k[1], 0); };
          if (vals.length !== 4 || connues.length !== 3 || prob(vals.find((v) => !connues.some((k) => Math.abs(k[0] - v) < 1e-9))) <= 1e-9) faux(ex[0], '1.3 loi invalide : ' + t3);
          for (const id of ['1.3 a)', '1.3 b)', '1.3 c)', '1.3 d)']) {
            const e = par(id), m = String(e.enonce).match(/^P\(X(=|\\leqslant |\\geqslant |\\gt |\\lt )(.*)\)$/), s = evC(m[2]), op = m[1];
            const ok = (v) => (op === '=' ? Math.abs(v - s) < 1e-9 : op === '\\leqslant ' ? v <= s + 1e-9 : op === '\\geqslant ' ? v >= s - 1e-9 : op === '\\gt ' ? v > s + 1e-9 : v < s - 1e-9);
            comp(e, vals.filter(ok).reduce((a, v) => a + prob(v), 0), id); compte('1.3');
          }
        }
        // ---- 1.4 : double hasard (evenements C et N) ----
        {
          const t4 = T(4), phrase = t4.split('</p>')[0];
          let a, b;
          const pCchoix = /1, 2, 3 ou 4/.test(phrase) ? 2 / 3 : /1 ou 2/.test(phrase) ? 1 / 3 : 1 / 2;
          if (/paquets/.test(t4)) { const m = phrase.match(/l'un contient (\d+) cartes.*?l'autre (\d+) cartes/); a = 1 / Number(m[1]); b = 1 / Number(m[2]); }
          else if (/urnes/.test(t4)) { const m = phrase.match(/l'urne 1 contient (\d+) boule\w* rouge\w* et (\d+) boule\w* noire\w*, l'urne 2 contient (\d+) boule\w* rouge\w* et (\d+) boule/); a = Number(m[2]) / (Number(m[1]) + Number(m[2])); b = Number(m[4]) / (Number(m[3]) + Number(m[4])); if (!/noire »/.test(t4)) faux(ex[0], '1.4 evenement N de l urne'); }
          else { const m = phrase.match(/l'un a (\d+) faces.*?l'autre (\d+) faces/); a = 1 / Number(m[1]); b = 1 / Number(m[2]); }
          if (!/\\\(C\\\) : «/.test(t4) || !/\\\(N\\\) : «/.test(t4) || /a\), b\)/.test(t4)) faux(ex[0], '1.4 evenements C et N / phrase a), b)');
          for (const id of ['1.4 a)', '1.4 b)', '1.4 c)', '1.4 e)']) if (!/^Calculer/.test(par(id).enonce)) faux(par(id), id + ' doit commencer par Calculer');
          comp(par('1.4 a)'), pCchoix, '1.4 a)'); comp(par('1.4 b)'), a, '1.4 b)'); comp(par('1.4 c)'), b, '1.4 c)');
          comp(par('1.4 e)'), pCchoix * a + (1 - pCchoix) * b, '1.4 e)');
          const f = par('1.4 d)'), tab = { 'P_{C}(N)': a, 'P_{\\overline{C}}(N)': b };
          if (!egal(evalFormule(f.reponse, tab, {}, f.fixes), pCchoix * a + (1 - pCchoix) * b, 1e-9)) faux(f, '1.4 d) formule fausse : ' + f.reponse);
          if (Math.abs(f.fixes['P(C)'] - pCchoix) > 1e-9) faux(f, '1.4 d) valeur connue de P(C) fausse');
          compte('1.4');
        }
        // ---- 1.5 : urne sans remise (denombrement) : questions P_{non E1}(E2) et P(E2) ----
        {
          const t5 = T(5), m = t5.match(/contient (\d+) boules dont (\d+) (?:sont|est) \w+ et (\d+) (?:sont|est) \w+\./), r = Number(m[2]), b = Number(m[3]);
          if (r + b !== Number(m[1]) || !/<strong>sans remise<\/strong>/.test(t5) || /a\), b\)/.test(t5)) faux(ex[0], '1.5 texte : ' + t5.slice(0, 120));
          let nNE1 = 0, nNE1E2 = 0, tot = 0, nE2 = 0;
          for (let i = 0; i < r + b; i++) for (let j = 0; j < r + b; j++) { if (i === j) continue; tot++; const e1 = i < r, e2 = j < r; if (!e1) nNE1++; if (e2) nE2++; if (!e1 && e2) nNE1E2++; }
          comp(par('1.5 a)'), nNE1E2 / nNE1, '1.5 a)'); comp(par('1.5 b)'), nE2 / tot, '1.5 b)');
          if (ex.filter((e) => /^1\.5 /.test(e.id)).length !== 2) faux(ex[0], '1.5 doit avoir 2 questions');
          compte('1.5');
        }
        // ---- 1.6 : reunion ----
        {
          const t6 = T(6), N6 = Number(t6.match(/paquet de (\d+) cartes/)[1]), mu = (s) => (/pair/.test(s) ? 2 : Number(s.match(/multiple de (\d+)/)[1]));
          const ev6 = [...t6.matchAll(/\\\((R|T)\\\) : « On tire une carte dont le numéro est (pair|multiple de \d+) »/g)], a = mu(ev6[0][2]), b = mu(ev6[1][2]);
          let nR = 0, nT = 0, nRT = 0; for (let k = 1; k <= N6; k++) { const r = k % a === 0, t = k % b === 0; if (r) nR++; if (t) nT++; if (r && t) nRT++; }
          comp(par('1.6 a)'), (N6 - 1) / N6, '1.6 a)'); comp(par('1.6 b)'), nR / N6, '1.6 b)'); comp(par('1.6 d)'), nRT / N6, '1.6 d)'); comp(par('1.6 e)'), (nR + nT - nRT) / N6, '1.6 e)');
          if (!(nRT > 0)) faux(ex[0], '1.6 intersection vide');
          const f = par('1.6 c)'); if (!egal(evalFormule(f.reponse, { 'P(R)': nR / N6, 'P(T)': nT / N6, 'P(R\\cap T)': nRT / N6 }), (nR + nT - nRT) / N6, 1e-9)) faux(f, '1.6 c) formule fausse');
          compte('1.6');
        }
        // ---- 1.7 : loi en tableau ----
        {
          const { vs: vl, ps: pl } = lireTableau(T(7)), vs = vl.map((v) => evC(v)), ps = pl.map((p) => evC(p));
          if (Math.abs(ps.reduce((a, b) => a + b, 0) - 1) > 1e-9) faux(ex[0], '1.7 somme des probabilites');
          const a = par('1.7 a)'), b = par('1.7 b)'), sa = evC(a.enonce.match(/leqslant (.*)\)$/)[1]), sb = evC(b.enonce.match(/lt (.*)\)$/)[1]);
          comp(a, vs.reduce((s, v, i) => (v <= sa + 1e-9 ? s + ps[i] : s), 0), '1.7 a)'); comp(b, vs.reduce((s, v, i) => (v < sb - 1e-9 ? s + ps[i] : s), 0), '1.7 b)');
          comp(par('1.7 c)'), moy(vs, ps), '1.7 c)'); comp(par('1.7 d)'), vari(vs, ps), '1.7 d)'); compte('1.7');
        }
        // ---- 1.8 : urnes numerotees : cellules de la loi, puis E(X) et V(X) ----
        {
          const t8 = T(8), m = /quatre urnes/.test(t8) ? 4 : 3;
          const pmf = {}; for (let u = 1; u <= m; u++) for (let b = 1; b <= u; b++) pmf[b] = (pmf[b] || 0) + 1 / m / u;
          const vs = Array.from({ length: m }, (_, i) => i + 1), ps = vs.map((v) => pmf[v]);
          const li = [...t8.matchAll(/<li>L'urne (\d+) contient (.*?)\.<\/li>/g)];
          li.forEach((x) => { const nb = (x[2].match(/numérotées? (.*)$/)[1].match(/\d+/g) || []).length; if (nb !== Number(x[1])) faux(ex[0], '1.8 urne ' + x[1] + ' : ' + x[2]); });
          const cellules = ex.filter((e) => /^1\.8 /.test(e.id) && e.cellule);
          if (cellules.length !== m || !/Compléter la loi de probabilité/.test(t8)) faux(ex[0], '1.8 cellules ' + cellules.length);
          cellules.forEach((e, i) => { if (Number(e.kTex) !== i + 1 || !egal(rep(e), pmf[i + 1], 1e-9)) faux(e, '1.8 cellule ' + e.id + ' ' + e.reponse + ' / ' + pmf[i + 1]); });
          const lettres = ex.filter((e) => /^1\.8 /.test(e.id)).map((e) => e.id.slice(4, 5)).join('');
          if (lettres !== 'abcdef'.slice(0, m + 2)) faux(ex[0], '1.8 lettres ' + lettres);
          const E = ex.find((e) => /^1\.8 /.test(e.id) && /E\(X\)/.test(e.enonce)), V = ex.find((e) => /^1\.8 /.test(e.id) && /V\(X\)/.test(e.enonce));
          comp(E, moy(vs, ps), '1.8 E'); comp(V, vari(vs, ps), '1.8 V'); compte('1.8');
        }
        // ---- 1.9 : loi avec une inconnue p ----
        {
          const { vs: vl, ps: pl } = lireTableau(T(9)), vs = vl.map((v) => evC(v)), iu = pl.indexOf('p'), connus = pl.map((p, i) => (i === iu ? 0 : evC(p))), p = 1 - connus.reduce((a, b) => a + b, 0), ps = connus.map((c, i) => (i === iu ? p : c));
          if (iu < 0 || p <= 1e-9) faux(ex[0], '1.9 loi invalide');
          comp(par('1.9 a)'), p, '1.9 a)'); comp(par('1.9 b)'), moy(vs, ps), '1.9 b)'); comp(par('1.9 c)'), vari(vs, ps), '1.9 c)'); compte('1.9');
        }
        // ---- 1.10 : loi dependant d'un parametre alpha (equation du second degre) ----
        {
          const { vs: vl, ps: pl } = lireTableau(T(10)), vs = vl.map((v) => evC(v));
          const coef = pl.map((q) => { let a = 0, b = 0; const m2 = q.match(/(\d*)\\alpha\^\{2\}/); if (m2) b = m2[1] === '' ? 1 : Number(m2[1]); const reste = q.replace(/(\d*)\\alpha\^\{2\}/, ''), m1 = reste.match(/(\d*)\\alpha/); if (m1) a = m1[1] === '' ? 1 : Number(m1[1]); return [a, b]; });
          const A = coef.reduce((s, c) => s + c[0], 0), B = coef.reduce((s, c) => s + c[1], 0), disc = A * A + 4 * B, r1 = (-A + Math.sqrt(disc)) / (2 * B), r2 = (-A - Math.sqrt(disc)) / (2 * B);
          if (!(B > 0 && A > 0 && r1 > 0 && r2 < 0)) faux(ex[0], '1.10 equation sans racine unique positive : ' + A + ' ' + B);
          const ps = coef.map((c) => c[0] * r1 + c[1] * r1 * r1);
          if (ps.some((p) => p <= 1e-9 || p >= 1) || Math.abs(ps.reduce((a, b) => a + b, 0) - 1) > 1e-9) faux(ex[0], '1.10 probabilites invalides ' + ps);
          comp(par('1.10 a)'), r1, '1.10 a)'); comp(par('1.10 b)'), moy(vs, ps), '1.10 b)'); comp(par('1.10 c)'), vari(vs, ps), '1.10 c)'); compte('1.10');
        }
        // ---- 1.11 : transformations affines Y et Z ----
        {
          const t11 = T(11), mm = t11.match(/espérance \\\((\d+)\\\) et de variance \\\((\d+)\\\)/), mu = Number(mm[1]), v = Number(mm[2]);
          const lin = (s) => { const m = s.match(/^(-?\d*)X([+-]\d+)?$/); const a = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]); return [a, m[2] ? Number(m[2]) : 0]; };
          const [a1, b1] = lin(t11.match(/Y=(.*?)\\\) et/)[1]), zm = t11.match(/Z=\\dfrac\{(.*?)\}\{(\d+)\}\\\)/), [a2, b2] = lin(zm[1]), c2 = Number(zm[2]);
          if (!/On note \\\(Y\\\) et \\\(Z\\\) les deux variables aléatoires définies par/.test(t11)) faux(ex[0], '1.11 phrase');
          const att = { 'E(Y)': a1 * mu + b1, 'V(Y)': a1 * a1 * v, 'E(Z)': (a2 * mu + b2) / c2, 'V(Z)': a2 * a2 * v / (c2 * c2) };
          ['a', 'b', 'c', 'd'].forEach((l) => { const e = par('1.11 ' + l + ')'), nom = e.enonce.match(/^Calculer \\\((.*)\\\)$/)[1]; comp(e, att[nom], '1.11 ' + l + ' ' + nom); });
          if (par('1.11 a)').enonce !== 'Calculer \\(E(Y)\\)' || par('1.11 b)').enonce !== 'Calculer \\(V(Y)\\)' || par('1.11 c)').enonce !== 'Calculer \\(E(Z)\\)' || par('1.11 d)').enonce !== 'Calculer \\(V(Z)\\)') faux(ex[0], '1.11 ordre des questions'); compte('1.11');
        }
        // ---- 1.12 : Bernoulli : valeurs prises et P(Y = v) ----
        {
          const t12 = T(12), p = evC(t12.match(/paramètre \\\((.*?)\\\)\./)[1]), [a, b] = [Number(t12.match(/Y=(-?\d+)X/)[1]), Number(t12.match(/X([+-]\d+)\\\)/)[1])];
          const vals = [b, a + b].sort((u, w) => u - w), pr = { [b]: 1 - p, [a + b]: p };
          if (String(par('1.12 a)').reponse) !== '{' + vals.join(';') + '}') faux(par('1.12 a)'), '1.12 a) ' + par('1.12 a)').reponse + ' / ' + vals);
          comp(par('1.12 b)'), pr[Number(par('1.12 b)').enonce.match(/Y=(-?\d+)\)/)[1])], '1.12 b)');
          if (ex.filter((e) => /^1\.12 /.test(e.id)).length !== 2) faux(ex[0], '1.12 doit avoir 2 questions'); compte('1.12');
        }
        // ---- 1.13 : des ----
        {
          const f = Number(T(13).match(/dont les (\d+) faces/)[1]); const vs = Array.from({ length: f }, (_, i) => i + 1), ps = vs.map(() => 1 / f);
          comp(par('1.13 a)'), moy(vs, ps), '1.13 a)'); comp(par('1.13 b)'), vari(vs, ps), '1.13 b)');
          for (const n of [1, 2, 5, 9]) {
            const c = math.evaluate(par('1.13 c)').reponse, { n }), d = math.evaluate(par('1.13 d)').reponse, { n });
            if (!egal(c, n * moy(vs, ps), 1e-9) || !egal(d, n * vari(vs, ps), 1e-9)) faux(par('1.13 c)'), '1.13 c/d n=' + n + ' : ' + c + ' ' + d);
          }
          compte('1.13');
        }
        // ---- 1.14 ----
        {
          const e = par('1.14'), a = Number(e.enonce.match(/\\\{0,(\d+)\\\}/)[1]);
          for (const q of [0.2, 0.55, 0.9]) { const EX = a * q, EX2 = a * a * q, val = a === 1 ? EX - EX2 : EX2 - a * EX; if (Math.abs(val) > 1e-9) faux(e, '1.14 non nul'); }
          if (rep(e) !== 0) faux(e, '1.14 reponse'); compte('1.14');
        }
        // ---- 1.15 : minimum de E((cX +- x)^2) ----
        {
          const t15 = T(15), loi = { vs: [0, 1, 3], ps: [0.2, 0.5, 0.3] }, EX = moy(loi.vs, loi.ps), EX2 = loi.vs.reduce((s, v, i) => s + v * v * loi.ps[i], 0), VX = EX2 - EX * EX;
          const m = t15.match(/f\(x\)=E\\left\(\\left\((.*?)\\right\)\^2\\right\)/)[1], mm = m.match(/^(2?)X([+-])x$/), c = mm[1] ? 2 : 1, sg = mm[2] === '+' ? 1 : -1;
          const f = (x) => loi.vs.reduce((s, v, i) => s + loi.ps[i] * (c * v + sg * x) ** 2, 0);
          const tab = { 'E(X)': EX, 'E(X^2)': EX2, 'V(X)': VX };
          const a = par('1.15 a)'), b = par('1.15 b)'), cc = par('1.15 c)');
          for (const x of [-2, 0.5, 3]) if (!egal(evalFormule(a.reponse, tab, { x }), f(x), 1e-9)) faux(a, '1.15 a) trinome faux : ' + a.reponse);
          const xmin = evalFormule(b.reponse, tab, {}); if (f(xmin) > f(xmin + 0.01) + 1e-12 || f(xmin) > f(xmin - 0.01) + 1e-12) faux(b, '1.15 b) pas un minimum : ' + b.reponse);
          if (!egal(evalFormule(cc.reponse, tab, {}), f(xmin), 1e-9)) faux(cc, '1.15 c) minimum faux : ' + cc.reponse);
          compte('1.15');
        }
        // numerotation continue des calculs et des lettres
        { const ids = ex.map((e) => e.id), calculs = [...new Set(ids.map((i) => Number(i.match(/^1\.(\d+)/)[1])))]; if (calculs.join() !== Array.from({ length: 15 }, (_, i) => i + 1).join()) faux(ex[0], 'numerotation ' + calculs.join(',')); }
      } catch (er) { faux(ex[0], 'EXCEPTION ' + er.message + ' | ' + er.stack.split('\n')[1]); }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
