// Verification independante des details de Premiere 19 (equations avec carres et valeurs absolues, developpement de cos et sin, duplication, equations trigonometriques, monotonie, comparaison sin-cos, tangente, a cos x + b sin x = c) : recalcul a partir de l'enonce affiche (valeurs numeriques, zeros trouves par minimisation), sans lire le raisonnement des etapes.
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/premiere/cahier-7/fiche-19.html';
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
    const prep = (t) => String(t).replace(/\^\{?\\circ\}?/g, '').replace(/\\left\|(.*?)\\right\|/g, 'abs($1)').replace(/\|([^|]*)\|/g, 'abs($1)').replace(/\\(cos|sin|tan)\^\{?2\}?\s*\(([^()]*)\)/g, '($1($2))^2').replace(/\\(cos|sin|tan)/g, '$1').replace(/\\pi/g, 'pi');
    const vt = (t, sc) => val(prep(t), sc);
    const egal = (a, c, tol = 1e-9) => Math.abs(a - c) <= tol * (1 + Math.abs(a) + Math.abs(c));
    const racinesReelles = (gg, lo, hi, pas) => { // nombre de vraies racines dans ]lo ; hi[ (changements de signe confirmes par dichotomie : un pole n'en est pas une)
      let nb = 0, xp = lo + pas / 7, prec = gg(xp);
      for (let x = xp + pas; x < hi; x += pas) {
        const c = gg(x);
        if (isFinite(prec) && isFinite(c) && prec * c < 0) { let a = xp, b = x, fa = prec; for (let i = 0; i < 70; i++) { const m = (a + b) / 2, fm = gg(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } } if (Math.abs(gg((a + b) / 2)) < 1e-6) nb++; }
        xp = x; prec = c;
      }
      return nb;
    };
    // zeros de g dans ]lo ; hi] (racines simples ou doubles) : minima locaux de |g| affines
    const zeros = (g, lo, hi) => {
      const n = 4800, h = (hi - lo) / n, xs = [], out = [];
      for (let i = 0; i <= n; i++) xs.push(lo + i * h);
      const v = xs.map((x) => Math.abs(g(x)));
      for (let i = 0; i <= n; i++) {
        if (!(v[i] < 1e-2) || (i > 0 && v[i] > v[i - 1]) || (i < n && v[i] > v[i + 1])) continue;
        let a = xs[Math.max(0, i - 1)], b = xs[Math.min(n, i + 1)];
        for (let it = 0; it < 80; it++) { const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (Math.abs(g(m1)) < Math.abs(g(m2))) b = m2; else a = m1; }
        const x = (a + b) / 2;
        if (Math.abs(g(x)) < 1e-9 && x > lo + 1e-6 && x <= hi + 1e-9 && !out.some((y) => Math.abs(y - x) < 1e-5)) out.push(x);
      }
      return out.sort((p, q) => p - q);
    };
    const bornes = (s) => {
      const m = String(s).match(/\\left\[(.*)\\right\]/) || String(s).match(/\[(.*)\]/); let d = 0, cur = '', out = [];
      for (const ch of m[1]) { if (ch === '{' || ch === '(') d++; if (ch === '}' || ch === ')') d--; if (ch === ';' && d === 0) { out.push(cur); cur = ''; } else cur += ch; }
      out.push(cur); return out.map((t) => vt(t));
    };
    const ensemble = (F) => F.match(/^\\\{(.*)\\\}$/)[1].split('\\,;\\,').map((z) => vt(z)).sort((u, w) => u - w);
    const memeListe = (a, c) => a.length === c.length && a.every((x, i) => Math.abs(x - c[i]) < 1e-7);
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (/^19\.[12] /.test(id)) {
            const [g0, d0] = premier(tx).split('='), gg = (x) => vt(g0, { x }) - vt(d0, { x }), att = ensemble(F);
            if (att.some((x) => !isFinite(gg(x)) || Math.abs(gg(x)) > 1e-8) || new Set(att).size !== att.length) faux(e, id + ' racine fausse ' + F);
            if (racinesReelles(gg, -150, 150, 0.0207) !== att.length) faux(e, id + ' nombre de racines ' + F);
            compte('19.12');
          }
          else if (id === '19.3 a)' || id === '19.3 b)') {
            const q = premier(tx).match(/^(.*?)(\\leqslant|\\geqslant|\\lt|<|>)(.*)$/), op = q[2];
            const vrai = (x) => { const a = vt(q[1], { x }), c = vt(q[3], { x }); if (!isFinite(a) || !isFinite(c)) return null; const y = a - c; return op === '>' ? y > 1e-10 : op === '\\geqslant' ? y >= -1e-10 : op === '\\leqslant' ? y <= 1e-10 : y < -1e-10; };
            const err = memeEnsemble(F, vrai, -40, 40); if (err) faux(e, id + ' ' + err + ' ' + F); compte('19.3');
          }
          else if (/^19\.4 /.test(id)) {
            const exprE = premier(tx);
            for (const x of [0.3, 1.1, -0.8, 2.4]) {
              const attendu = vt(exprE, { x }), fin = vt(F, { x }), rep = math.evaluate(String(e.reponse), { x });
              if (!egal(attendu, fin, 1e-9) || !egal(attendu, rep, 1e-9)) faux(e, id + ' ' + F + ' en x=' + x);
            }
            if (!/^[-+0-9\\a-z{}()\s,.]*$/i.test(F) || /pi/.test(F)) faux(e, id + ' forme non developpee ' + F); compte('19.4');
          }
          else if (/^19\.5 /.test(id)) {
            const m = [...tx.matchAll(/\\\((.*?)\\\)/g)].map((z) => z[1]), eq = m[0], iv = m.length === 3 ? m[1] : null, ask = m[m.length - 1];
            const fnD = eq.match(/^\\(cos|sin)\((2?)x\)=(.*)$/), v = vt(fnD[3]), k = fnD[2] ? 2 : 1, f1 = fnD[1] === 'cos' ? Math.cos : Math.sin;
            const [lo, hi] = iv ? bornes(iv) : [-Math.PI, Math.PI], xs = zeros((x) => f1(k * x) - v, lo, hi + 1e-12).filter((x) => x >= lo - 1e-9 && x <= hi + 1e-9);
            if (!xs.length) { faux(e, id + ' aucun x'); continue; }
            const fa = ask.match(/\\(cos|sin)\((2?)x\)/), f2 = fa[1] === 'cos' ? Math.cos : Math.sin, k2 = fa[2] ? 2 : 1;
            const att = xs.map((x) => f2(k2 * x));
            if (iv && xs.length !== 1) faux(e, id + ' x non unique ' + xs.length);
            if (att.some((z) => Math.abs(z - att[0]) > 1e-8) || !egal(att[0], vt(F), 1e-9) || !egal(att[0], math.evaluate(String(e.reponse)), 1e-9)) faux(e, id + ' ' + F + ' / ' + att[0]);
            compte('19.5');
          }
          else if (/^19\.(6|10) /.test(id)) {
            const [g, d] = premier(tx).split('='), gg = (x) => vt(g, { x }) - vt(d, { x }), att = ensemble(F), z = zeros(gg, -Math.PI, Math.PI);
            if (!memeListe(att, z)) faux(e, id + ' attendu ' + z.map((q) => q.toFixed(5)) + ' / ' + att.map((q) => q.toFixed(5)) + ' ' + F);
            compte('19.610');
          }
          else if (/^19\.7 /.test(id)) {
            const attendu = { '19.7 a)': 'b', '19.7 b)': 'a', '19.7 c)': 'b', '19.7 d)': 'c' }[id];
            if (F !== attendu || e.bonneReponse !== attendu) faux(e, id + ' lettre ' + F); compte('19.7');
          }
          else if (id === '19.8 a)') {
            const bonnes = e.options.filter((o) => { const x = vt(o.texte.replace(/^x=/, '')); return Math.sin(x) <= Math.cos(x) + 1e-12; }).map((o) => o.lettre).join(',');
            if (F !== bonnes || e.bonneReponse !== bonnes) faux(e, id + ' ' + F + ' / ' + bonnes); compte('19.8a');
          }
          else if (id === '19.8 b)') {
            const bonnes = e.options.filter((o) => { const [lo, hi] = bornes(o.texte); for (let i = 0; i <= 600; i++) { const x = lo + (hi - lo) * i / 600; if (Math.sin(x) > Math.cos(x) + 1e-12) return false; } return true; }).map((o) => o.lettre).join(',');
            if (F !== bonnes || e.bonneReponse !== bonnes) faux(e, id + ' ' + F + ' / ' + bonnes); compte('19.8b');
          }
          else if (id === '19.9 a)') {
            const o = e.options.find((z) => z.lettre === F);
            if (!o || o.texte !== '\\dfrac{\\tan(a)+\\tan(b)}{1-\\tan(a)\\tan(b)}' || e.bonneReponse !== F) faux(e, id + ' lettre ' + F); compte('19.9a');
          }
          else if (id === '19.9 b)') {
            const m = tx.match(/\\tan\(a\)=(.*?)\\\) et \\\(\\tan\(b\)=(.*?)\\\)/), A = vt(m[1]), B = vt(m[2]), t = (A + B) / (1 - A * B);
            if (!egal(t, vt(F), 1e-9) || !egal(t, math.evaluate(String(e.reponse)), 1e-9)) faux(e, id + ' ' + F + ' / ' + t); compte('19.9b');
          }
          else if (id === '19.9 c)') {
            const t = vt(premier(tx));
            if (!egal(t, vt(F), 1e-9) || !egal(t, math.evaluate(String(e.reponse)), 1e-9)) faux(e, id + ' ' + F + ' / ' + t); compte('19.9c');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
