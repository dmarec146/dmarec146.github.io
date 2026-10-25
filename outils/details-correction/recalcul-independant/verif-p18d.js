// Verification independante des details de Premiere 18 (inequations, equations, conversions radians-degres, mesure principale, cosinus et sinus remarquables, equations trigonometriques, tangente) : recalcul a partir de l'enonce affiche (valeurs numeriques, angles tires), sans lire le raisonnement des etapes.
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/premiere/cahier-7/fiche-18.html';
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
    const prep = (t) => String(t).replace(/\^\{?\\circ\}?/g, '').replace(/\\ \\text\{rad\}/g, '').replace(/\\left\|(.*?)\\right\|/g, 'abs($1)').replace(/\\(cos|sin|tan)\^\{2\}/g, '$1^2').replace(/\\(cos|sin|tan)/g, '$1').replace(/\\pi/g, 'pi');
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
    const bornes = (s) => { // « x\in\left[0;\dfrac{\pi}{2}\right] » -> [bas, haut]
      const m = String(s).match(/\\left\[(.*)\\right\]/) || String(s).match(/\[(.*)\]/); let d = 0, cur = '', out = [];
      for (const ch of m[1]) { if (ch === '{' || ch === '(') d++; if (ch === '}' || ch === ')') d--; if (ch === ';' && d === 0) { out.push(cur); cur = ''; } else cur += ch; }
      out.push(cur); return out.map((t) => vt(t));
    };
    const trouverX = (fn, v, lo, hi) => { // x de [lo ; hi] avec fn(x) = v (un seul attendu)
      const c = []; for (let k = -3; k <= 3; k++) {
        if (fn === 'cos') { if (Math.abs(v) <= 1) { c.push(Math.acos(v) + 2 * Math.PI * k, -Math.acos(v) + 2 * Math.PI * k); } }
        else if (fn === 'sin') { if (Math.abs(v) <= 1) { c.push(Math.asin(v) + 2 * Math.PI * k, Math.PI - Math.asin(v) + 2 * Math.PI * k); } }
        else c.push(Math.atan(v) + Math.PI * k);
      }
      const bons = c.filter((x) => x >= lo - 1e-9 && x <= hi + 1e-9).filter((x, i, a) => a.findIndex((y) => Math.abs(y - x) < 1e-7) === i);
      return bons;
    };
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (id === '18.1 a)' || id === '18.1 b)') {
            const q = premier(tx).match(/^(.*?)(\\leqslant|\\geqslant|\\lt|<|>)(.*)$/), op = q[2];
            const vrai = (x) => { const a = val(q[1], { x }), c = val(q[3], { x }); if (!isFinite(a) || !isFinite(c)) return null; const y = a - c; return op === '>' ? y > 1e-10 : op === '\\geqslant' ? y >= -1e-10 : op === '\\leqslant' ? y <= 1e-10 : y < -1e-10; };
            const err = memeEnsemble(F, vrai, -40, 40); if (err) faux(e, id + ' ' + err + ' ' + F); compte('18.1');
          }
          else if (id === '18.2 a)' || id === '18.2 b)') {
            const [g0, d0] = premier(tx).split('='), gg = (x) => vt(g0, { x }) - vt(d0, { x }), att = lireEnsemble(F);
            if (att.some((x) => !isFinite(gg(x)) || Math.abs(gg(x)) > 1e-8) || new Set(att).size !== att.length) faux(e, id + ' racine fausse ' + F);
            if (racinesReelles(gg, -150, 150, 0.0207) !== att.length) faux(e, id + ' nombre de racines ' + F);
            compte('18.2');
          }
          else if (id === '18.3 a)') {
            const rad = vt(premier(tx)), deg = rad * 180 / Math.PI;
            if (!egal(deg, vt(F), 1e-9) || !egal(deg, Number(e.reponse), 1e-9)) faux(e, id + ' ' + F + ' / ' + deg); compte('18.3a');
          }
          else if (id === '18.3 b)') {
            const rad = vt(premier(tx)) * Math.PI / 180;
            if (!egal(rad, vt(F), 1e-9) || !egal(rad, math.evaluate(String(e.reponse)), 1e-9)) faux(e, id + ' ' + F + ' / ' + rad); compte('18.3b');
          }
          else if (/^18\.4 /.test(id)) {
            const angle = vt(premier(tx)), r = vt(F), tours = (angle - r) / (2 * Math.PI);
            if (Math.abs(tours - Math.round(tours)) > 1e-6 || !(r > -Math.PI + 1e-9 && r <= Math.PI + 1e-9) || !egal(r, math.evaluate(String(e.reponse)), 1e-9)) faux(e, id + ' ' + F + ' (tours ' + tours + ')'); compte('18.4');
          }
          else if (/^18\.[56] /.test(id) || /^18\.9 /.test(id)) {
            const v = vt(premier(tx));
            if (!isFinite(v) || !egal(v, vt(F), 1e-9) || !egal(v, math.evaluate(String(e.reponse)), 1e-9)) faux(e, id + ' ' + F + ' / ' + v); compte('18.569');
          }
          else if (/^18\.7 /.test(id) || /^18\.11 /.test(id)) {
            const m = [...tx.matchAll(/\\\((.*?)\\\)/g)].map((z) => z[1]), [eq, iv, ask] = m, fnDonne = eq.match(/^\\(cos|sin|tan)\(x\)=(.*)$/), fnDemande = ask.match(/\\(cos|sin|tan)\(x\)/)[1];
            const v = vt(fnDonne[2]), [lo, hi] = bornes(iv), xs = trouverX(fnDonne[1], v, lo, hi);
            if (xs.length !== 1) { faux(e, id + ' x non unique ou absent : ' + xs.length); continue; }
            const f = { cos: Math.cos, sin: Math.sin, tan: Math.tan }[fnDemande], att = f(xs[0]);
            if (!egal(att, vt(F), 1e-9) || !egal(att, math.evaluate(String(e.reponse)), 1e-9)) faux(e, id + ' ' + F + ' / ' + att); compte('18.7-11');
          }
          else if (/^18\.8 /.test(id)) {
            const [g, d] = premier(tx).split('='), gg = (x) => vt(g, { x }) - vt(d, { x }), att = F.match(/^\\\{(.*)\\\}$/)[1].split('\\,;\\,').map((z) => vt(z)).sort((u, w) => u - w);
            if (att.some((x) => !isFinite(gg(x)) || Math.abs(gg(x)) > 1e-8 || !(x > -Math.PI + 1e-9 && x <= Math.PI + 1e-9)) || new Set(att.map((x) => x.toFixed(9))).size !== att.length) faux(e, id + ' solution fausse ' + F);
            const nb = racinesReelles(gg, -Math.PI, Math.PI, 0.00311) + (Math.abs(gg(Math.PI)) < 1e-9 ? 1 : 0);
            if (nb !== att.length) faux(e, id + ' nombre de solutions ' + nb + ' / ' + att.length + ' ' + F); compte('18.8');
          }
          else if (id === '18.10 a)') { if (F !== 'b' || e.bonneReponse !== 'b' || e.options.find((o) => o.lettre === 'b').texte !== 'impaire') faux(e, '18.10a'); compte('18.10a'); }
          else if (id === '18.10 b)') {
            const exprs = [...tx.matchAll(/\\\((.*?)\\\)/g)].map((z) => z[1]), expr = exprs[exprs.length - 1], signe = F.trim().startsWith('-') ? -1 : 1;
            for (const x of [0.3, 0.9, -0.6]) if (!egal(vt(expr, { x }), signe * Math.tan(x), 1e-9)) faux(e, id + ' ' + F + ' en x=' + x);
            if (String(e.reponse).replace(/\\/g, '') !== F.replace(/\\/g, '')) faux(e, id + ' reponse differente'); compte('18.10b');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
