// Verification independante des details de Premiere 23 (inequations, equations, sommes telescopiques, suites arithmetiques et geometriques, suite arithmetico-geometrique, somme de k x^k, serie alternee) : recalcul a partir de l'enonce affiche (valeurs numeriques, zeros trouves par minimisation), sans lire le raisonnement des etapes.
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/premiere/cahier-9/fiche-23.html';
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
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      mettreAJourTextesAvances();
      const T6 = texteId('texte-23-6'), T7 = texteId('texte-23-7'), T8 = texteId('texte-23-8'), T11 = texteId('texte-23-11'), T12 = texteId('texte-23-12'), T13 = texteId('texte-23-13'), T14 = texteId('texte-23-14');
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (id === '23.1 a)' || id === '23.1 b)') {
            const q = premier(tx).match(/^(.*?)(\\leqslant|\\geqslant|\\lt|<|>)(.*)$/), op = q[2];
            const vrai = (x) => { const a = vt(q[1], { x }), c = vt(q[3], { x }); if (!isFinite(a) || !isFinite(c)) return null; const y = a - c; return op === '>' ? y > 1e-10 : op === '\\geqslant' ? y >= -1e-10 : op === '\\leqslant' ? y <= 1e-10 : y < -1e-10; };
            const err = memeEnsemble(F, vrai, -40, 40); if (err) faux(e, id + ' ' + err + ' ' + F); compte('23.1');
          }
          else if (id === '23.2 a)') {
            const m = premier(tx).match(/^\\left\|(.*)\\right\|=(.*)$/), I = (x) => vt(m[1], { x }), R = (x) => vt(m[2], { x });
            const a = I(1) - I(0), b = I(0), c = R(1) - R(0), d = R(0), cand = [(d - b) / (a - c), -(d + b) / (a + c)].filter((x) => Math.abs(Math.abs(I(x)) - R(x)) < 1e-9 && R(x) >= -1e-12);
            const uniq = []; cand.forEach((x) => { if (!uniq.some((y) => Math.abs(x - y) < 1e-9)) uniq.push(x); }); uniq.sort((u, w) => u - w);
            const att = ensemble(F);
            if (att.length !== uniq.length || att.some((x, i) => Math.abs(x - uniq[i]) > 1e-9)) faux(e, id + ' attendu ' + uniq.join(' ; ') + ' / ecrit ' + F);
            if (Math.abs(a) === Math.abs(c)) faux(e, id + ' |a| = |c|'); compte('23.2a');
          }
          else if (id === '23.2 b)') {
            const [g0, d0] = premier(tx).split('='), gg = (x) => vt(g0, { x }) - vt(d0, { x }), att = ensemble(F);
            if (att.some((x) => !isFinite(gg(x)) || Math.abs(gg(x)) > 1e-8) || new Set(att.map((z) => z.toFixed(9))).size !== att.length) faux(e, id + ' racine fausse ' + F);
            if (racinesReelles(gg, -60, 60, 0.00311) !== att.length) faux(e, id + ' nombre de solutions ' + F); compte('23.2b');
          }
          else if (id === '23.3 a)' || id === '23.3 b)') {
            const v = vt(tx);
            if (!egal(v, vt(F), 1e-9) || !egal(v, math.evaluate(String(e.reponse)), 1e-9)) faux(e, id + ' ' + F + ' / ' + v); compte('23.3');
          }
          else if (id === '23.4 a)' || id === '23.4 b)') {
            const m = premier(tx).match(/^\((a[-+]b)\)\\displaystyle\\sum_\{k=0\}\^\{(\d+)\}(.*)$/), N0 = Number(m[2]);
            for (const [a, b] of [[1.3, 0.7], [-0.9, 1.6], [2.1, -1.2]]) {
              let S = 0; for (let k = 0; k <= N0; k++) S += ev(m[3], { a, b, k });
              const v = ev(m[1], { a, b }) * S;
              if (!egal(v, ev(F, { a, b }), 1e-9) || !egal(v, ev(e.reponse, { a, b }), 1e-9)) faux(e, id + ' ' + F + ' / ' + v);
            }
            compte('23.4');
          }
          else if (id === '23.5') {
            const m = premier(tx).match(/^\((.*?)\)\\displaystyle\\sum_\{k=(\d+)\}\^\{(.*?)\}b\^k$/), fac = m[1];
            for (const b of [1.3, -0.7, 2.2]) for (const n of [3, 5, 8]) {
              const hi = ev(m[3], { n }); let S = 0; for (let k = Number(m[2]); k <= hi; k++) S += Math.pow(b, k);
              const v = ev(fac, { b }) * S;
              if (!egal(v, ev(F, { b, n }), 1e-9) || !egal(v, ev(e.reponse, { b, n }), 1e-9)) faux(e, id + ' ' + F + ' / ' + v);
            }
            compte('23.5');
          }
          else if (id === '23.6 a)' || id === '23.6 b)') {
            const g = T6.match(/u_0=(-?\d+).*r=(-?\d+)/), u0 = Number(g[1]), r = Number(g[2]), u = (n) => u0 + n * r;
            if (id === '23.6 a)') {
              const s = tx.match(/sum_\{n=(\d+)\}\^\{(\d+)\}u_n/); let S = 0; for (let n = Number(s[1]); n <= Number(s[2]); n++) S += u(n);
              if (!egal(S, vt(F), 1e-9) || !egal(S, Number(e.reponse), 1e-9)) faux(e, id + ' ' + F + ' / ' + S);
            } else {
              for (const N1 of [1, 2, 5, 9]) { let S = 0; for (let n = 0; n <= N1; n++) S += u(n); if (!egal(S, vt(F, { N: N1 }), 1e-9) || !egal(S, math.evaluate(String(e.reponse), { N: N1 }), 1e-9)) faux(e, id + ' ' + F + ' (N=' + N1 + ') / ' + S); }
            }
            compte('23.6');
          }
          else if (id === '23.7 a)' || id === '23.7 b)') {
            const g = T7.match(/u_0=(-?\d+).*r=(-?)\\dfrac\{(\d+)\}\{(\d+)\}/), u0 = Number(g[1]), r = (g[2] ? -1 : 1) * Number(g[3]) / Number(g[4]), u = (n) => u0 + n * r;
            if (id === '23.7 a)') {
              const s = tx.match(/sum_\{n=(\d+)\}\^\{(\d+)\}u_n/); let S = 0; for (let n = Number(s[1]); n <= Number(s[2]); n++) S += u(n);
              if (!egal(S, vt(F), 1e-9) || !egal(S, math.evaluate(String(e.reponse)), 1e-9)) faux(e, id + ' ' + F + ' / ' + S);
            } else {
              const M = Number(tx.match(/\^\{(\d+)N\}/)[1]);
              for (const N1 of [1, 2, 3, 6]) { let S = 0; for (let n = 0; n <= M * N1; n++) S += u(n); if (!egal(S, vt(F, { N: N1 }), 1e-9) || !egal(S, math.evaluate(String(e.reponse), { N: N1 }), 1e-9)) faux(e, id + ' ' + F + ' (N=' + N1 + ') / ' + S); }
            }
            compte('23.7');
          }
          else if (id === '23.8') {
            const g = T8.match(/sum_\{k=(\d+)\}\^\{(\d+)\}u_k/), L = Number(g[1]), U = Number(g[2]);
            const val8 = (txt, q) => { const u = (j) => Math.pow(q, j); const t = txt.replace(/\\left|\\right|S=/g, '').replace(/u_\{(\d+)\}/g, (m, j) => String(u(Number(j)))); return ev(t.replace(/q/g, '(' + q + ')'), {}); };
            const q = 1.37; let S = 0; for (let k = L; k <= U; k++) S += Math.pow(q, k);
            const bons = e.options.filter((o) => Math.abs(val8(o.texte, q) - S) < 1e-9 && Math.abs(val8(o.texte, 0.81) - (() => { let s2 = 0; for (let k = L; k <= U; k++) s2 += Math.pow(0.81, k); return s2; })()) < 1e-9);
            if (bons.length !== 1 || bons[0].lettre !== F) faux(e, id + ' options correctes ' + bons.map((o) => o.lettre).join(',') + ' / final ' + F); compte('23.8');
          }
          else if (id === '23.9 a)') {
            const m = tx.match(/u_0=\\dfrac\{(\d+)\}\{(\d+)\}.*?q=(-?\d+).*sum_\{k=(\d+)\}\^\{n\}/), u0 = Number(m[1]) / Number(m[2]), Q = Number(m[3]), L = Number(m[4]);
            for (const n of [L, L + 1, L + 3, L + 6]) { let S = 0; for (let k = L; k <= n; k++) S += u0 * Math.pow(Q, k); if (!egal(S, ev(F, { n }), 1e-9) || !egal(S, math.evaluate(String(e.reponse), { n }), 1e-9)) faux(e, id + ' ' + F + ' (n=' + n + ') / ' + S); }
            compte('23.9');
          }
          else if (id === '23.9 b)') {
            const m = tx.match(/u_0=(\d+).*?q=\\dfrac\{(\d+)\}\{(\d+)\}.*sum_\{k=1\}\^\{2n\}/), u0 = Number(m[1]), q = Number(m[2]) / Number(m[3]);
            for (const n of [1, 2, 3, 5]) { let S = 0; for (let k = 1; k <= 2 * n; k++) S += u0 * Math.pow(q, k); if (!egal(S, ev(F, { n }), 1e-9) || !egal(S, math.evaluate(String(e.reponse), { n }), 1e-9)) faux(e, id + ' ' + F + ' (n=' + n + ') / ' + S); }
            compte('23.9');
          }
          else if (id === '23.10 a)' || id === '23.10 b)') {
            const m = tx.match(/sum_\{k=0\}\^\{n\}(.*?)\\\)$/), t = m[1];
            for (const n of [0, 1, 3, 6]) { let S = 0; for (let k = 0; k <= n; k++) S += ev(t, { k }); if (!egal(S, ev(F, { n }), 1e-9) || !egal(S, math.evaluate(String(e.reponse), { n }), 1e-9)) faux(e, id + ' ' + F + ' (n=' + n + ') / ' + S); }
            compte('23.10');
          }
          else if (id === '23.11 a)' || id === '23.11 b)') {
            const g = T11.match(/u_0=(-?\d+).*u_\{n\+1\}=(\d+)u_n(-?\+?-?\d+)/), u0 = Number(g[1]), B = Number(g[2]), C = Number(g[3]);
            const U = [u0]; for (let i = 0; i < 12; i++) U.push(B * U[i] + C);
            for (const n of [0, 1, 2, 5, 8]) {
              const att = id === '23.11 a)' ? U[n] : U.slice(0, n + 1).reduce((s, v) => s + v, 0);
              if (!egal(att, ev(F, { n }), 1e-9) || !egal(att, math.evaluate(String(e.reponse), { n }), 1e-9)) faux(e, id + ' ' + F + ' (n=' + n + ') / ' + att);
            }
            compte('23.11');
          }
          else if (id === '23.12') {
            const g = T12.match(/=(\d+)n\(n\+(\d+)\)/), A = Number(g[1]), K = Number(g[2]), S = (n) => A * n * (n + K);
            for (const n of [1, 2, 3, 7, 12]) { const att = S(n) - S(n - 1); if (!egal(att, ev(F, { n }), 1e-9) || !egal(att, math.evaluate(String(e.reponse).replace(/·/g, '*'), { n }), 1e-9)) faux(e, id + ' ' + F + ' (n=' + n + ') / ' + att); }
            compte('23.12');
          }
          else if (id === '23.13') {
            const unplus = /\(k\+1\)x\^k/.test(T13);
            for (const x of [0.4, -0.8, 2.3]) for (const n of [1, 2, 5, 8]) {
              let S = 0; for (let k = unplus ? 0 : 1; k <= n; k++) S += (unplus ? k + 1 : k) * Math.pow(x, k);
              if (!egal(S, ev(F.replace(/nx/g, 'n*x'), { x, n }), 1e-9)) faux(e, id + ' ' + F + ' (x=' + x + ', n=' + n + ') / ' + S);
            }
            compte('23.13');
          }
          else if (id === '23.14 a)' || id === '23.14 b)') {
            const g = T14.match(/\\dfrac\{\(-1\)\^\{?(k\+1|k)\}?\}\{k(\^2)?\}/), s = g[1] === 'k' ? 1 : -1, p = g[2] ? 2 : 1;
            const u = (n) => { let t = 0; for (let k = 1; k <= n; k++) t += (s === 1 ? Math.pow(-1, k) : Math.pow(-1, k + 1)) / Math.pow(k, p); return t; };
            const suite = id === '23.14 a)' ? (n) => u(2 * n) : (n) => u(2 * n + 1);
            let croit = true, decroit = true; for (let n = 1; n < 30; n++) { const dd = suite(n + 1) - suite(n); if (dd <= 0) croit = false; if (dd >= 0) decroit = false; }
            const mot = tx.match(/est-elle (croissante|décroissante)/)[1], oui = mot === 'croissante' ? croit : decroit, lettreOui = e.options.find((o) => o.texte === 'oui').lettre, lettreNon = e.options.find((o) => o.texte === 'non').lettre;
            if (!(croit || decroit)) faux(e, id + ' suite non monotone');
            if (F !== (oui ? lettreOui : lettreNon) || e.bonneReponse !== F) faux(e, id + ' reponse ' + F + ' / attendu ' + (oui ? 'oui' : 'non'));
            compte('23.14');
          }
          else faux(e, 'exercice non verifie');
          // chaines intermediaires contenant des sommes (non lisibles par l'outil de controle)
          if (/^23\.(4|5|9|10|11 b|12|13|6 b|7 b)/.test(id)) {
            const sc = [{ n: 4, x: 0.6, a: 1.3, b: 0.7, N: 3 }, { n: 7, x: -0.8, a: -0.9, b: 1.6, N: 5 }];
            let valS = null;
            if (id === '23.13') { const unplus = /\(k\+1\)x\^k/.test(T13); valS = (c) => { let s2 = 0; for (let k = unplus ? 0 : 1; k <= c.n; k++) s2 += (unplus ? k + 1 : k) * Math.pow(c.x, k); return s2; }; }
            const nb = verifChaines(e, sc, valS); if (nb < 2) faux(e, id + ' aucune chaine lisible'); compte('chaines');
          }
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
