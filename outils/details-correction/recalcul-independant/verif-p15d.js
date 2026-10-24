// Verification independante des details de Premiere 15 (inequations, equations, droites : cartesienne, reduite, parametres, intersections, parabole, cercle, tangentes) : recalcul a partir de l'enonce affiche et du texte des figures
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/premiere/cahier-6/fiche-15.html';
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
      let u = String(t).replace(/\\displaystyle|\\textstyle/g, '').replace(/\{,\}/g, '.').replace(/\\left|\\right|\\,|\\ /g, ' ').replace(/\\times/g, '*').replace(/\\div/g, '/').replace(/\\lt/g, '<').replace(/\\gt/g, '>').replace(/\\frac/g, '\\dfrac').replace(/ax/g, 'a*x').replace(/mx/g, 'm*x').replace(/my/g, 'm*y');
      for (let i = 0; i < 8; i++) u = u.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
      u = u.replace(/\{/g, '(').replace(/\}/g, ')');          // accolades restantes (« { x}^{2} » de jsVersLatex)
      return u.replace(/(\d)\s*\(/g, '$1*(').replace(/\)\s*(\d)/g, ')*$1').replace(/(\d)\s*([a-zA-Z])/g, '$1*$2').replace(/\)\s*\(/g, ')*(').replace(/\)\s*([a-zA-Z])/g, ')*$1').replace(/\bx\s*\(/g, 'x*(').replace(/\bt\s*\(/g, 't*(').replace(/\by\s*\(/g, 'y*(').replace(/\bm\s*\(/g, 'm*(').replace(/\ba\s*\(/g, 'a*(').replace(/\bX\b/g, 'X');
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
    const changements = (g, lo, hi, pas) => { let n = 0, prec = g(lo); for (let t = lo + pas; t <= hi; t += pas) { const c = g(t); if (isFinite(prec) && isFinite(c) && prec * c < 0) n++; prec = c; } return n; };
    // « L = R » -> fonction (x, y, ...) -> L - R ; coefficients a, b, c de a x + b y + c
    const fonc = (eq) => { const [g, d] = eq.replace(/\s/g, '').split('='); return (sc) => val(g, sc) - val(d, sc); };
    const coefs = (eq, sc = {}) => { const f = fonc(eq), c = f({ ...sc, x: 0, y: 0 }); return { a: f({ ...sc, x: 1, y: 0 }) - c, b: f({ ...sc, x: 0, y: 1 }) - c, c }; };
    const couple = (F) => { const L = String(F).replace(/\\left|\\right/g, '').replace(/\\,/g, '').replace(/^\s*\(|\)\s*$/g, '').split(';'); if (L.length !== 2) throw new Error('couple illisible ' + F); return L; };
    const sur = (cf, X, Y) => Math.abs(cf.a * X + cf.b * Y + cf.c) <= 1e-8 * (1 + Math.abs(cf.a * X) + Math.abs(cf.b * Y) + Math.abs(cf.c));
    const colin = (u, w) => Math.abs(u[0] * w[1] - u[1] * w[0]) <= 1e-8 * (1 + Math.abs(u[0] * w[1]));
    const proportionnel = (c1, c2) => Math.abs(c1.a * c2.b - c1.b * c2.a) + Math.abs(c1.a * c2.c - c1.c * c2.a) + Math.abs(c1.b * c2.c - c1.c * c2.b) <= 1e-8 * (1 + Math.abs(c1.a * c2.b));
    const sansEnonce = (tx) => tx.replace(/<[^>]*>/g, ' ');
    const equations = (tx) => [...tx.matchAll(/\\\(([^()]*?=0)\\\)/g)].map((m) => m[1]);
    // « … d'équation [cartésienne] \(… = 0\) » : les parentheses \left( \right) de l'equation sont admises
    const eqsApres = (txt) => [...txt.matchAll(/équation(?: cartésienne)? \\\((.*?)=0\\\)/g)].map((m) => m[1] + '=0');
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      mettreAJourTextesAvances();
      const g = paramsAvances, T = (i) => document.getElementById('texte-15-' + i).textContent;
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (id === '15.1 a)' || id === '15.1 b)') {
            const q = premier(tx).match(/^(.*?)(\\leqslant|\\geqslant|\\lt|<|>)(.*)$/), op = q[2];
            const vrai = (x) => { const a = val(q[1], { x }), c = val(q[3], { x }); const y = a - c; return op === '>' ? y > 1e-10 : op === '\\geqslant' ? y >= -1e-10 : op === '\\leqslant' ? y <= 1e-10 : y < -1e-10; };
            const err = memeEnsemble(F, vrai, -40, 40); if (err) faux(e, id + ' ' + err + ' ' + F); compte('15.1');
          }
          else if (id === '15.2 a)') {
            const gg = fonc(premier(tx)), att = lireEnsemble(F), f1 = (x) => gg({ x });
            if (att.some((x) => Math.abs(f1(x)) > 1e-9) || new Set(att).size !== att.length) faux(e, '15.2a racine fausse ' + F);
            const nb = changements(f1, -30.0013, 30.0007, 0.0101);
            if (att.length === 2 && nb !== 2) faux(e, '15.2a nombre de racines ' + nb + ' ' + F);
            if (att.length === 1 && nb !== 0) faux(e, '15.2a racine double croisee');
            if (att.length === 0 && Math.min(...Array.from({ length: 6001 }, (_, i) => f1(-30 + i * 0.01))) <= 0) faux(e, '15.2a racine oubliee ' + F); compte('15.2a');
          }
          else if (id === '15.2 b)') { const gg = fonc(premier(tx)), att = lireEnsemble(F); if (att.length !== 1 || Math.abs(gg({ x: att[0] })) > 1e-9 || Math.abs(gg({ x: att[0] + 1 }) - gg({ x: att[0] + 2 })) < 1e-12) faux(e, '15.2b ' + F); compte('15.2b'); }
          else if (id === '15.3 a)' || id === '15.3 b)') { if (!proche(val(tx), val(F), 1e-9) || !proche(val(tx), math.evaluate(String(e.reponse)), 1e-9)) faux(e, id + ' ' + F + ' / ' + val(tx)); compte('15.3'); }
          else if (id === '15.4 a)') {
            const A = tx.match(/A\((.*?);(.*?)\)/), u = [...tx.matchAll(/pmatrix\}(.*?)\\\\(.*?)\\end/g)][0], cf = coefs(F), X = val(A[1]), Y = val(A[2]);
            if (!sur(cf, X, Y) || !colin([-cf.b, cf.a], [val(u[1]), val(u[2])])) faux(e, '15.4a ' + F); compte('15.4a');
          }
          else if (id === '15.4 b)') {
            const A = tx.match(/A\((.*?);(.*?)\)/), B = tx.match(/B\((.*?);(.*?)\)/), parts = F.replace(/\s/g, '').split('=');
            if (parts[0] !== 'y') faux(e, '15.4b forme ' + F);
            const f = (x) => val(parts[1], { x });
            if (!proche(f(val(A[1])), val(A[2])) || !proche(f(val(B[1])), val(B[2]))) faux(e, '15.4b ' + F); compte('15.4b');
          }
          else if (id === '15.4 c)' || id === '15.4 d)') {
            const A = tx.match(/A\((.*?);(.*?)\)/), B = tx.match(/B\((.*?);(.*?)\)/), cf = coefs(F);
            if (!sur(cf, val(A[1]), val(A[2])) || !sur(cf, val(B[1]), val(B[2])) || (Math.abs(cf.a) + Math.abs(cf.b) < 1e-9)) faux(e, id + ' ' + F); compte('15.4cd');
          }
          else if (id === '15.5 a)') { const c = g.g5, L = couple(F).map((x) => val(x)); if (L[0] !== c.Q7 || L[1] !== c.P7 || Math.abs(c.B7 + c.P7) > 4 || c.Q7 > 4) faux(e, '15.5a ' + F); compte('15.5a'); }
          else if (id === '15.5 b)') { const c = g.g5, f = (x) => val(F.replace(/^y\s*=/, ''), { x }); if (F.slice(0, 1) !== 'y' || !proche(f(0), c.B7) || !proche(f(c.Q7), c.B7 + c.P7)) faux(e, '15.5b ' + F); compte('15.5b'); }
          else if (id === '15.5 c)') { const c = g.g5; if (F.replace(/\s/g, '') !== 'y=' + c.K7 || c.K7 === c.B7) faux(e, '15.5c ' + F); compte('15.5c'); }
          else if (id === '15.6 a)') {
            const cf = coefs(equations(tx)[0].replace(/=0$/, '=0')), m = tx.match(/ordonnée \\\((-?)\\dfrac\{(\d+)\}\{(\d+)\}\\\)/), Y = (m[1] ? -1 : 1) * Number(m[2]) / Number(m[3]);
            if (!sur(cf, val(F), Y)) faux(e, '15.6a ' + F); compte('15.6a');
          }
          else if (id === '15.6 b)') { const cf = coefs(equations(tx)[0]), L = couple(F).map((x) => val(x)); if (!sur(cf, L[0], L[1]) || !proche(L[0], L[1])) faux(e, '15.6b ' + F); compte('15.6b'); }
          else if (id === '15.6 c)') {
            const eqs = equations(tx), d = coefs(eqs[0]), P = tx.match(/point \\\(\((.*?);(.*?)\)\\\)/), cf = coefs(F);
            if (!proportionnel({ a: d.a, b: d.b, c: 0 }, { a: cf.a, b: cf.b, c: 0 }) || !sur(cf, val(P[1]), val(P[2])) || Math.abs(cf.a * d.b - cf.b * d.a) > 1e-8 * (1 + Math.abs(cf.a * d.b))) faux(e, '15.6c ' + F); compte('15.6c');
          }
          else if (id === '15.7 a)' || id === '15.7 c)') {
            const u = [...tx.matchAll(/pmatrix\}(.*?)\\\\(.*?)\\end/g)][0], A = tx.match(/A\\left\((.*?);(.*?)\\right\)|A\((.*?);(.*?)\)/);
            const xa = val(A[1] !== undefined ? A[1] : A[3]), ya = val(A[2] !== undefined ? A[2] : A[4]);
            for (const t of [0.7, -1.3, 2.9]) {
              const cf = coefs(F, { t }), uu = [val(u[1], { t }), val(u[2], { t })];
              if (!sur(cf, xa, ya) || !colin([-cf.b, cf.a], uu)) faux(e, id + ' ' + F + ' en t=' + t);
            }
            compte('15.7ac');
          }
          else if (id === '15.7 b)') {
            const u = [...tx.matchAll(/pmatrix\}(.*?)\\\\(.*?)\\end/g)][0], t = val(F);
            if (Math.abs(val(u[2], { t })) > 1e-9 || Math.abs(val(u[1], { t })) < 1e-9) faux(e, '15.7b ' + F); compte('15.7b');
          }
          else if (id === '15.8 a)' || id === '15.8 b)' || id === '15.8 c)' || id === '15.8 d)') {
            const eqs = equations(tx), L = couple(F).map((x) => val(x));
            if (id === '15.8 a)' || id === '15.8 d)') { if (!eqs.every((q) => sur(coefs(q), L[0], L[1]))) faux(e, id + ' ' + F); }
            else if (id === '15.8 b)') { if (!sur(coefs(eqs[0]), L[0], L[1]) || Math.abs(L[1]) > 1e-12) faux(e, id + ' ' + F); }
            else if (!sur(coefs(eqs[0]), L[0], L[1]) || !proche(L[0], L[1])) faux(e, id + ' ' + F);
            if (id !== '15.8 b)' && id !== '15.8 c)' && eqs.length === 2) { const a = coefs(eqs[0]), c = coefs(eqs[1]); if (Math.abs(a.a * c.b - a.b * c.a) < 1e-9) faux(e, id + ' droites paralleles'); }
            compte('15.8');
          }
          else if (id === '15.9 a)' || id === '15.9 b)') {
            const eqs = eqsApres(T(9));
            const dr = coefs(eqs[0]), par = T(9).match(/parabole d'équation \\\(y=(.*?)\\\)/)[1];
            const h = (x) => -(dr.a * x + dr.c) / dr.b, d2 = (x) => val(par, { x }) - h(x);
            const racines = []; let prec = d2(-60), pas = 0.0013;
            for (let x = -60 + pas; x <= 60; x += pas) { const c = d2(x); if (prec * c < 0) { let lo = x - pas, hi = x; for (let k = 0; k < 80; k++) { const mid = (lo + hi) / 2; if (d2(lo) * d2(mid) <= 0) hi = mid; else lo = mid; } racines.push((lo + hi) / 2); } prec = c; }
            if (racines.length !== 2) { faux(e, '15.9 racines ' + racines.length + ' : ' + T(9) + ' -> ' + racines.join(',')); continue; }
            const L = couple(F).map((x) => val(x)), X = id === '15.9 a)' ? racines[0] : racines[1];
            if (!proche(L[0], X, 1e-6) || !proche(L[1], h(X), 1e-6)) faux(e, id + ' ' + F + ' / ' + X + ' ' + h(X)); compte('15.9');
          }
          else if (id === '15.10 a)' || id === '15.10 b)') {
            const txt = T(10), eqd = eqsApres(txt)[0], dr = coefs(eqd), cer = txt.match(/cercle d'équation \\\((.*?)\\\)/)[1].replace(/\s/g, '');
            const h = (x) => -(dr.a * x + dr.c) / dr.b, [gc, dc] = cer.split('='), d2 = (x) => val(gc, { x, y: h(x) }) - val(dc);
            const racines = []; let prec = d2(-60), pas = 0.0013;
            for (let x = -60 + pas; x <= 60; x += pas) { const c = d2(x); if (prec * c < 0) { let lo = x - pas, hi = x; for (let k = 0; k < 80; k++) { const mid = (lo + hi) / 2; if (d2(lo) * d2(mid) <= 0) hi = mid; else lo = mid; } racines.push((lo + hi) / 2); } prec = c; }
            if (racines.length !== 2) { faux(e, '15.10 racines ' + racines.length); continue; }
            const L = couple(F).map((x) => val(x)), X = id === '15.10 a)' ? racines[0] : racines[1];
            if (!proche(L[0], X, 1e-6) || !proche(L[1], h(X), 1e-6)) faux(e, id + ' ' + F + ' / ' + X + ' ' + h(X)); compte('15.10');
          }
          else if (id === '15.11 a)' || id === '15.11 b)') {
            const eq = T(11).match(/cartésienne \\\((.*?=0)\\\)/)[1];
            for (const a of [0.4, 1.7, -2.3]) {
              const cf = coefs(eq, { a });
              if (id === '15.11 a)') { const y = -(cf.a * a + cf.c) / cf.b; if (!proche(val(F, { a }), y, 1e-8)) faux(e, '15.11a ' + F + ' en a=' + a); }
              else { const dec = tx.match(/ordonnée \\\((.*?)\\\)/)[1], y = val(dec, { a }), x = -(cf.b * y + cf.c) / cf.a; if (!proche(val(F, { a }), x, 1e-8)) faux(e, '15.11b ' + F + ' en a=' + a); }
            }
            compte('15.11');
          }
          else if (id === '15.12 a)' || id === '15.12 b)') {
            const t12 = eqsApres(T(12)), eq1 = t12[0], eq2 = t12[1];
            const det = (m) => { const c1 = coefs(eq1, { m }), c2 = coefs(eq2, { m }); return c1.a * c2.b - c2.a * c1.b; };
            if (id === '15.12 a)') {
              const att = lireEnsemble(F); if (att.length !== 2 || att.some((m) => Math.abs(det(m)) > 1e-8 * (1 + m * m))) faux(e, '15.12a ' + F);
              if (changements(det, -60.0013, 60.0007, 0.0101) !== 2) faux(e, '15.12a nombre de valeurs exclues');
            } else {
              const L = String(F).replace(/\\left|\\right/g, '').replace(/^\s*\(|\)\s*$/g, '').split('\\,;\\,');
              for (const m of [0.37, 2.1, -3.3]) { const c1 = coefs(eq1, { m }), c2 = coefs(eq2, { m }), X = val(L[0], { m }), Y = val(L[1], { m }); if (!sur(c1, X, Y) || !sur(c2, X, Y)) faux(e, '15.12b ' + F + ' en m=' + m); }
            }
            compte('15.12');
          }
          else if (id === '15.13 a)' || id === '15.13 b)') {
            const fx = T(13).match(/f\(x\)=(.*?)\\\)/)[1], f = (x) => val(fx, { x }), dv = (x) => (f(x + 1e-6) - f(x - 1e-6)) / 2e-6;
            if (id === '15.13 a)') { const R = F.replace(/^y\s*=/, ''); for (const [m, x] of [[0.6, -1.2], [-1.4, 2.3]]) if (!proche(val(R, { m, x }), dv(m) * (x - m) + f(m), 1e-5)) faux(e, '15.13a ' + F); }
            else {
              const eq = eqsApres(tx)[0];
              for (const m of [0.37, 2.1, -3.3]) {
                const cf = coefs(eq), M = dv(m), q = f(m) - M * m, L = String(F).replace(/\\left|\\right/g, '').replace(/^\s*\(|\)\s*$/g, '').split('\\,;\\,');
                const X = val(L[0], { m }), Y = val(L[1], { m });
                if (!proche(Y, M * X + q, 1e-5) || !sur(cf, X, Y)) faux(e, '15.13b ' + F + ' en m=' + m);
              }
            }
            compte('15.13');
          }
          else if (/^15\.14 /.test(id)) {
            const fx = T(14).match(/f\(x\)=(.*?)\\\)/)[1], gx = T(14).match(/g\(x\)=(.*?)\\\)/)[1], f = (x) => val(fx, { x }), gg = (x) => val(gx, { x });
            const df = (x) => (f(x + 1e-6) - f(x - 1e-6)) / 2e-6, dg = (x) => (gg(x + 1e-6) - gg(x - 1e-6)) / 2e-6;
            const Tf = (a) => (x) => df(a) * (x - a) + f(a), Tg = (a) => (x) => dg(-a) * (x + a) + gg(-a);
            if (id === '15.14 a)') { const R = F.replace(/^y\s*=/, ''); for (const [a, x] of [[0.8, 1.1], [-1.7, 0.4]]) if (!proche(val(R, { a, x }), Tf(a)(x), 1e-5)) faux(e, '15.14a ' + F); }
            else if (id === '15.14 b)') { const R = F.replace(/^y\s*=/, ''); for (const [a, x] of [[0.8, 1.1], [-1.7, 0.4]]) if (!proche(val(R, { a, x }), Tg(a)(x), 1e-5)) faux(e, '15.14b ' + F); }
            else {
              const L = String(F).replace(/\\left|\\right/g, '').replace(/^\s*\(|\)\s*$/g, '').split('\\,;\\,');
              for (const a of [0.8, -1.7, 2.6]) { const X = val(L[0], { a }), Y = val(L[1], { a }); if (!proche(Y, Tf(a)(X), 1e-5) || !proche(Y, Tg(a)(X), 1e-5)) faux(e, '15.14c ' + F + ' en a=' + a); }
            }
            compte('15.14');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
