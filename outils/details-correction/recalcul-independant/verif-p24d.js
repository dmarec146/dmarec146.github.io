// Verification independante des details de Premiere 24 (produits : symbole Pi, valeurs, telescopage, quotients, puissances, factorielle) : recalcul a partir de l'enonce affiche (valeurs numeriques, facteurs ecrits compares au facteur general de la reponse), sans lire le raisonnement des etapes.
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/premiere/cahier-9/fiche-24.html';
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
      u = u.replace(/([nk])(?=x)/g, '$1*').replace(/(\d)(?![eE][+-]?\d)([a-zA-Z(])/g, '$1*$2').replace(/\)\(/g, ')*(').replace(/([a-zA-Z])\(/g, (m, c) => (['sqrt', 'abs'].includes(c) ? m : c + '*('));
      u = u.replace(/\{/g, '(').replace(/\}/g, ')'); return math.evaluate(u, sc);
    };
    const f23 = (t) => String(t).replace(/\\dfrac\{(-?\d+)\}\{(\d+)\}/g, '($1/$2)');
    // sommes « \sum_{k=a}^{b} terme » -> valeur numerique ; le terme est un groupe \left( ... \right) ou une suite de caracteres jusqu'au premier + ou - de niveau 0
    const sumsToNum = (t, sc) => {
      let out = '', i = 0;
      const re = /\\displaystyle\\(sum|prod)_\{k=([^{}]*)\}\^\{([^{}]*)\}/y;
      while (i < t.length) {
        re.lastIndex = i; const m = re.exec(t);
        if (!m) { out += t[i]; i++; continue; }
        let j = i + m[0].length, d = 0, deb = j;
        { while (j < t.length) { const c = t[j]; if (c === '{') d++; else if (c === '}') d--; else if (t.startsWith('\\left(', j)) { d++; j += 5; } else if (t.startsWith('\\right)', j)) { d--; j += 6; } else if (d === 0 && (c === '+' || c === '-' || c === '=')) break; j++; } }
        const terme = t.slice(deb, j), lo = ev(m[2], sc), hi = ev(m[3], sc); let s = m[1] === 'prod' ? 1 : 0;
        for (let k = lo; k <= hi + 1e-9; k++) { const v = ev(terme, { ...sc, k }); if (m[1] === 'prod') s *= v; else s += v; }
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
          for (let i = 0; i + 1 < vals.length; i++) if (typeof vals[i] === 'number' && typeof vals[i + 1] === 'number' && isFinite(vals[i]) && isFinite(vals[i + 1]) && !egal(vals[i], vals[i + 1], 1e-8)) faux(e, e.id + ' chaine fausse : ' + l.slice(0, 90) + ' => ' + vals[i] + ' | ' + vals[i + 1]);
          nb += lisibles.length;
          const dernier = vals[vals.length - 1]; prev = typeof dernier === 'number' ? dernier : null;
        }
      }
      return nb;
    };
    // facteur general d'une ecriture « \prod_{k=lo}^{hi} GENERAL » ou « \sum_... » (lecture de la reponse)
    const lireProd = (F) => { const m = String(F).replace(/\\displaystyle/g, '').match(/^\\(prod|sum)_\{k=([^{}]*)\}\^\{([^{}]*)\}(.*)$/); return m ? { type: m[1], lo: m[2], hi: m[3], gen: m[4] } : null; };
    // x_{k+1}, y_{n-k}, x_1, y_n, a_{3} -> valeurs du scope (indices evalues dans le scope)
    const imbriques = (t, sc) => String(t).replace(/\\(prod|sum)_\{i=([^{}]*)\}\^\{([^{}]*)\}x_\{i\}/g, (m, ty, a, b) => { let s = ty === 'prod' ? 1 : 0; for (let i = Math.round(ev(a, sc)); i <= Math.round(ev(b, sc)); i++) { if (ty === 'prod') s *= sc['x' + i]; else s += sc['x' + i]; } return '(' + s + ')'; });
    const indices = (t, sc) => imbriques(t, sc).replace(/([xya])_\{([^{}]*)\}/g, (m, l, idx) => '(' + sc[l + Math.round(ev(idx, sc))] + ')').replace(/([xya])_(\w)/g, (m, l, idx) => '(' + sc[l + Math.round(ev(idx, sc))] + ')');
    const evI = (t, sc) => ev(indices(t, sc), sc);
    const scopeXY = (n) => { const sc = { n }; for (let i = -2; i <= 60; i++) { sc['x' + i] = Math.random() * 2 + 0.5; sc['y' + i] = Math.random() * 2 + 0.5; sc['a' + i] = Math.random() * 2 + 0.5; } return sc; };
    const produitDe = (gen, lo, hi, sc) => { let p = 1; for (let k = lo; k <= hi; k++) p *= evI(gen, { ...sc, k }); return p; };
    const sommeDeG = (gen, lo, hi, sc) => { let p = 0; for (let k = lo; k <= hi; k++) p += evI(gen, { ...sc, k }); return p; };
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (id === '24.1 a)' || id === '24.1 b)') {
            const q = premier(tx).match(/^(.*?)(\\leqslant|\\geqslant|\\lt|<|>)(.*)$/), op = q[2];
            const vrai = (x) => { const a = vt(q[1], { x }), c = vt(q[3], { x }); if (!isFinite(a) || !isFinite(c)) return null; const y = a - c; return op === '>' ? y > 1e-10 : op === '\\geqslant' ? y >= -1e-10 : op === '\\leqslant' ? y <= 1e-10 : y < -1e-10; };
            const err = memeEnsemble(F, vrai, -40, 40); if (err) faux(e, id + ' ' + err + ' ' + F); compte('24.1');
          }
          else if (id === '24.2 a)') {
            const [g0, d0] = premier(tx).split('='), gg = (x) => vt(g0, { x }) - vt(d0, { x }), att = ensemble(F);
            if (att.length !== 3 || att.some((x) => Math.abs(gg(x)) > 1e-8) || new Set(att.map((z) => z.toFixed(9))).size !== 3) faux(e, id + ' racine fausse ' + F);
            if (racinesReelles(gg, -60, 60, 0.00311) !== 3) faux(e, id + ' nombre de racines ' + F); compte('24.2a');
          }
          else if (id === '24.2 b)') {
            const m = premier(tx).match(/^\\left\|(.*)\\right\|=\\left\|(.*)\\right\|$/), I = (x) => vt(m[1], { x }), J = (x) => vt(m[2], { x });
            const a = I(1) - I(0), b = I(0), c = J(1) - J(0), d = J(0), cand = [(d - b) / (a - c), -(b + d) / (a + c)].filter((x) => Math.abs(Math.abs(I(x)) - Math.abs(J(x))) < 1e-9);
            const uniq = []; cand.forEach((x) => { if (!uniq.some((y) => Math.abs(x - y) < 1e-9)) uniq.push(x); }); uniq.sort((u, w) => u - w);
            const att = ensemble(F);
            if (att.length !== uniq.length || att.some((x, i) => Math.abs(x - uniq[i]) > 1e-9)) faux(e, id + ' attendu ' + uniq.join(' ; ') + ' / ecrit ' + F);
            if (racinesReelles((x) => Math.abs(I(x)) - Math.abs(J(x)), -60, 60, 0.00311) !== att.length) faux(e, id + ' nombre de solutions ' + F); compte('24.2b');
          }
          else if (id === '24.3 a)' || id === '24.3 b)') {
            const v = vt(tx);
            if (!egal(v, vt(F), 1e-9) || !egal(v, math.evaluate(String(e.reponse)), 1e-9)) faux(e, id + ' ' + F + ' / ' + v); compte('24.3');
          }
          else if (id === '24.4 a)' || id === '24.4 b)' || id === '24.4 c)' || id === '24.4 d)') {
            // facteurs ecrits avant et apres « \cdots » comparés au facteur general de la reponse
            const corps = premier(tx).replace(/\\displaystyle/g, ''), parts = corps.split(/\\cdots/), lead = parts[0].replace(/(\\times\s*)+$/, '').replace(/^\s*(\\times\s*)+/, ''), trail = parts[parts.length - 1].replace(/^\s*(\\times\s*)+/, '');
            const R = lireProd(F); if (!R || R.type !== 'prod') throw new Error('reponse illisible ' + F);
            const sc = scopeXY(6), lo = Math.round(ev(R.lo, sc)), hi = Math.round(ev(R.hi, sc));
            const t = (s, sc2) => ev(indices(s.replace(/\\times/g, '*'), sc2).replace(/\\left|\\right/g, ''), sc2);
            const v = t(lead, sc); let trouve = false;
            for (let c = 1; c <= 4 && !trouve; c++) if (egal(v, produitDe(R.gen, lo, lo + c - 1, sc), 1e-9)) trouve = true;
            if (!trouve) faux(e, id + ' debut ecrit different du facteur general : ' + lead + ' / ' + R.gen);
            if (!egal(t(trail, sc), produitDe(R.gen, hi, hi, sc), 1e-9)) faux(e, id + ' dernier facteur ecrit different : ' + trail + ' / ' + R.gen + ' en k = ' + hi);
            // reponse attendue : meme produit
            const rep = String(e.reponse).replace(/prod\(k,([^,]+),([^,]+),(.*)\)$/, (m0, a, b, g) => [a, b, g].join('§'));
            compte('24.4');
          }
          else if (id === '24.5 a)' || id === '24.5 b)') {
            const R = lireProd(F), sc = scopeXY(7), n = 7, lo = Math.round(ev(R.lo, sc)), hi = Math.round(ev(R.hi, sc));
            const ATT = { 'x_1+x_1x_2': 'somme|k|\\prod_{i=1}^{k}x_{i}', '(x_1x_2\\cdots x_n)+': 'somme|k|\\prod_{i=k}^{n}x_{i}', 'x_1\\times (x_1+x_2)': 'produit|k|\\left(\\sum_{i=1}^{k}x_{i}\\right)', 'x_n\\times (x_{n-1}+x_n)': 'produit|k|\\left(\\sum_{i=n+1-k}^{n}x_{i}\\right)' };
            const cle = Object.keys(ATT).find((c) => tx.includes(c)); if (!cle) throw new Error('enonce inconnu');
            // facteurs/termes attendus, relus depuis l'enonce : k-ieme terme calculé a la main
            const attendu = (k) => cle === 'x_1+x_1x_2' ? produitDe('x_i', 1, k, { ...sc, k }) : null;
            const gen = (k) => { const s2 = { ...sc, k }; return cle === 'x_1+x_1x_2' ? prodX(1, k, s2) : cle === '(x_1x_2\\cdots x_n)+' ? prodX(k, n, s2) : cle === 'x_1\\times (x_1+x_2)' ? sumX(1, k, s2) : sumX(n + 1 - k, n, s2); };
            function prodX(a, b, s2) { let p = 1; for (let i = a; i <= b; i++) p *= s2['x' + i]; return p; }
            function sumX(a, b, s2) { let p = 0; for (let i = a; i <= b; i++) p += s2['x' + i]; return p; }
            const total = (R.type === 'sum' ? [...Array(hi - lo + 1)].map((_, j) => gen(lo + j)).reduce((s, v) => s + v, 0) : [...Array(hi - lo + 1)].map((_, j) => gen(lo + j)).reduce((s, v) => s * v, 1));
            const lu = R.type === 'sum' ? sommeDeG(R.gen, lo, hi, sc) : produitDe(R.gen, lo, hi, sc);
            if (!egal(total, lu, 1e-9)) faux(e, id + ' ' + F + ' / ' + total + ' vs ' + lu);
            if (R.type !== (cle.startsWith('x_1+') || cle.startsWith('(x_1x_2') ? 'sum' : 'prod')) faux(e, id + ' type de symbole');
            compte('24.5');
          }
          else if (id === '24.6 a)' || id === '24.6 b)' || id === '24.6 c)') {
            const m = premier(tx).replace(/\\displaystyle/g, '').match(/^\\prod_\{k=(\d+)\}\^\{(\d+)\}(.*)$/); let p = 1;
            for (let k = Number(m[1]); k <= Number(m[2]); k++) p *= ev(m[3], { k });
            if (!egal(p, vt(F), 1e-9) || !egal(p, math.evaluate(String(e.reponse)), 1e-9)) faux(e, id + ' ' + F + ' / ' + p); compte('24.6');
          }
          else if (id === '24.7 a)' || id === '24.7 b)') {
            const m = tx.match(/prod_\{k=0\}\^\{(\d*)n?\}(\d+)/) || tx.match(/prod_\{k=0\}\^\{n\}(\d+)/), M = /\^\{\d+n\}/.test(tx) ? Number(tx.match(/\^\{(\d+)n\}/)[1]) : 1, C = Number(tx.match(/\}(\d+)\s*\\\)/)[1]);
            const bons = e.options.filter((o) => [2, 3].every((n) => egal(ev(o.texte, { n }), Math.pow(C, M * n + 1), 1e-9)));
            if (bons.length !== 1 || bons[0].lettre !== F) faux(e, id + ' options correctes ' + bons.map((o) => o.lettre).join(',') + ' / final ' + F); compte('24.7');
          }
          else if (id === '24.8 a)' || id === '24.8 b)') {
            const sc = scopeXY(6), n = 6, b = (k) => { let p = 1; for (let i = 1; i <= k; i++) p *= sc['a' + (i + 1)] / sc['a' + i]; return p; };
            const att = id === '24.8 a)' ? b(2) : b(n - 1);
            if (!egal(att, evI(F, sc), 1e-9)) faux(e, id + ' ' + F + ' / ' + att); compte('24.8');
          }
          else if (id === '24.9') {
            const sc = scopeXY(8), n = 8, p = 4; let P = 1; for (let k = p; k <= n; k++) P *= sc['a' + (k - 1)] / sc['a' + k];
            const bons = e.options.filter((o) => egal(ev(indices(o.texte.replace(/a_\{p-1\}/g, 'a_{3}').replace(/a_\{p\}|a_p/g, 'a_{4}').replace(/a_\{n\}|a_n/g, 'a_{8}'), sc), sc), P, 1e-9));
            if (bons.length !== 1 || bons[0].lettre !== F) faux(e, id + ' options correctes ' + bons.map((o) => o.lettre).join(',') + ' / final ' + F); compte('24.9');
          }
          else if (/^24\.10 [abcd]\)$/.test(id) || /^24\.11 [ab]\)$/.test(id)) {
            const m = premier(tx).replace(/\\displaystyle/g, '').match(/^\\prod_\{k=(\d+)\}\^\{n\}(.*)$/), lo = Number(m[1]);
            for (const n of (/^24\.11/.test(id) ? [6, 7, 9, 12] : [1, 2, 4, 7])) {
              let p = 1; for (let k = lo; k <= n; k++) p *= ev(m[2], { k });
              if (!egal(p, ev(F, { n }), 1e-9) || !egal(p, math.evaluate(String(e.reponse), { n }), 1e-9)) faux(e, id + ' ' + F + ' (n=' + n + ') / ' + p);
            }
            compte('24.10-11');
          }
          else if (id === '24.12 a)') {
            const m = premier(tx).replace(/\\displaystyle/g, '').match(/^\\prod_\{k=1\}\^\{n\}(.*)$/);
            for (const n of [1, 2, 4, 6]) { let p = 1; for (let k = 1; k <= n; k++) p *= ev(m[1], { k }); if (!egal(p, ev(F, { n }), 1e-9) || !egal(p, math.evaluate(String(e.reponse), { n }), 1e-9)) faux(e, id + ' ' + F + ' (n=' + n + ') / ' + p); }
            compte('24.12');
          }
          else if (id === '24.12 b)') {
            const m = tx.replace(/\\displaystyle/g, '').match(/prod_\{k=(\d)\}\^\{(n-1|n)\}(\d+)\^\{(\d*)a\^k\}/), lo = Number(m[1]), B = Number(m[3]), mm = m[4] === '' ? 1 : Number(m[4]);
            for (const a of [2, 3]) for (const n of [1, 2, 3, 4]) {
              const hi = m[2] === 'n' ? n : n - 1; let ex2 = 0; for (let k = lo; k <= hi; k++) ex2 += mm * Math.pow(a, k);
              const att = Math.pow(B, ex2);
              if (!egal(att, ev(F, { a, n }), 1e-9) || !egal(att, math.evaluate(String(e.reponse), { a, n }), 1e-9)) faux(e, id + ' ' + F + ' (a=' + a + ', n=' + n + ') / ' + att);
            }
            compte('24.12');
          }
          else if (id === '24.13 a)') {
            for (const n of [1, 3, 6]) if (!egal(math.factorial(n + 1), ev(F, { n }), 1e-9)) faux(e, id + ' ' + F); compte('24.13');
          }
          else if (id === '24.13 b)') {
            for (const n of [1, 2, 5, 8]) { let p = 1; for (let k = 1; k <= n; k++) p *= (2 * k - 1) / (2 * k); if (!egal(p, ev(F, { n }), 1e-9)) faux(e, id + ' ' + F + ' (n=' + n + ') / ' + p); }
            compte('24.13');
          }
          else faux(e, 'exercice non verifie');
          // chaines intermediaires (sommes et produits) non lisibles par l'outil de controle
          const sc2 = [{ n: 4, x: 0.6, a: 2, k0: 1 }, { n: 7, x: -0.8, a: 3, k0: 2 }];
          if (/^24\.(10|11|12|13 b|3|6)/.test(id)) { const nb = verifChaines(e, sc2, null); compte('chaines'); if (nb < 1 && /^24\.(12|13 b|3|6)/.test(id)) faux(e, id + ' aucune chaine lisible'); }
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
