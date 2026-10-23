// Verification independante des details de Premiere 6 (inequations, equations, fractions, developpement, derivees de puissances, derivation par relation, tangentes) : recalcul a partir de l'enonce affiche
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 300);
const FICHE = process.argv[3] || 'cahiers/premiere/cahier-2/fiche-06.html';
(async () => {
  const s = http.createServer((req, res) => { const f = path.join(RACINE, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0, '127.0.0.1');
  await new Promise((r) => s.on('listening', r));
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${s.address().port}/${FICHE}`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof exercices !== 'undefined' && window.math && document.querySelector('.question'), null, { timeout: 40000 });
  const r = await p.evaluate((N) => {
    const defauts = [], stats = {}; const compte = (k) => { stats[k] = (stats[k] || 0) + 1; };
    const faux = (e, m) => { if (defauts.length < 14) defauts.push(e.id + ' : ' + m + ' | ' + String(e.enonce).replace(/\s+/g, ' ').slice(0, 110)); };
    const proche = (a, c, tol = 1e-7) => Math.abs(a - c) <= tol * (1 + Math.abs(a) + Math.abs(c));
    const mj = (t) => {
      let u = String(t).replace(/\\displaystyle/g, '').replace(/\\left|\\right|\\,|\\ /g, ' ').replace(/\\times/g, '*').replace(/\\lt/g, '<').replace(/\\gt/g, '>');
      for (let i = 0; i < 6; i++) u = u.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
      return u.replace(/(\d)\s*\(/g, '$1*(').replace(/\)\s*(\d)/g, ')*$1').replace(/(\d)\s*([a-zA-Z])/g, '$1*$2').replace(/\)\s*\(/g, ')*(').replace(/\)\s*([a-zA-Z])/g, ')*$1').replace(/\bbx\b/g, 'b*x').replace(/\b([xabs])\s*\(/g, '$1*(').replace(/(\d)\s*(\()/g, '$1*(');
    };
    const cache = {}; const val = (t, sc) => { const k = String(t); return (cache[k] || (cache[k] = math.compile(mj(k)))).evaluate(sc || {}); };
    const lireIntervalles = (F) => {
      if (F === '\\emptyset') return []; if (F === '\\mathbb{R}') return [{ bas: -Infinity, haut: Infinity, ib: false, ih: false }];
      return F.split('\\ \\cup\\ ').map((m) => { const q = m.match(/^([\[\]])(.+?)\\,;\\,(.+?)([\[\]])$/); if (!q) throw new Error('intervalle illisible ' + m); const bo = (t) => (/\\infty/.test(t) ? (t.includes('-') ? -Infinity : Infinity) : val(t)); return { bas: bo(q[2]), haut: bo(q[3]), ib: q[1] === '[', ih: q[4] === ']' }; });
    };
    const dans = (L, t) => L.some((iv) => (t > iv.bas + 1e-9 || (Math.abs(t - iv.bas) < 1e-9 && iv.ib)) && (t < iv.haut - 1e-9 || (Math.abs(t - iv.haut) < 1e-9 && iv.ih)));
    const memeEnsemble = (F, vrai) => {
      const L = lireIntervalles(F); const bornes = L.flatMap((iv) => [iv.bas, iv.haut]).filter(isFinite);
      const lo = Math.min(-12, ...bornes.map((x) => x - 10)), hi = Math.max(12, ...bornes.map((x) => x + 10)), pas = (hi - lo) / 6000;
      for (let t = lo; t <= hi; t += pas) { if (bornes.some((x) => Math.abs(t - x) < 2 * pas)) continue; if (dans(L, t) !== vrai(t)) return 'desaccord en ' + t.toFixed(3); }
      for (const x of bornes) { if (dans(L, x) !== vrai(x)) return 'borne ' + x.toFixed(4) + ' mal incluse ou exclue'; }
      for (const iv of L) { if ((iv.bas === -Infinity && iv.ib) || (iv.haut === Infinity && iv.ih)) return 'crochet a l infini'; }
      return null;
    };
    const lireEnsemble = (F) => { if (F === '\\emptyset') return []; const m = F.match(/^\\\{(.*)\\\}$/); if (!m) throw new Error('ensemble illisible ' + F); return m[1].split('\\,;\\,').map((x) => val(x)).sort((u, w) => u - w); };
    const premier = (tx) => tx.match(/\\\((.*?)\\\)/)[1];
    const deriv = (f, x) => (f(x + 1e-6) - f(x - 1e-6)) / 2e-6;
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (id === '6.1 a)') {
            const q = tx.match(/^(.*?)(\\leqslant|\\geqslant|<|>)(.*)$/), op = q[2];
            const vrai = (x) => { const y = val(q[1], { x }) - val(q[3], { x }); return op === '>' ? y > 1e-10 : op === '<' ? y < -1e-10 : op === '\\geqslant' ? y >= -1e-10 : y <= 1e-10; };
            const err = memeEnsemble(F, vrai); if (err) faux(e, '6.1a ' + err + ' ' + F); compte('6.1a');
          }
          else if (id === '6.1 b)') {
            const q = tx.match(/^\\dfrac\{(.*)\}\{(.*)\} *(\\leqslant|\\geqslant|<|>) *0$/), op = q[3];
            const vrai = (x) => { const d = val(q[2], { x }); if (Math.abs(d) < 1e-12) return false; const y = val(q[1], { x }) / d; return op === '>' ? y > 1e-10 : op === '<' ? y < -1e-10 : op === '\\geqslant' ? y >= -1e-10 : y <= 1e-10; };
            const err = memeEnsemble(F, vrai); if (err) faux(e, '6.1b ' + err + ' ' + F); compte('6.1b');
          }
          else if (id === '6.2 a)') { const g = (x) => val(tx.split('=')[0], { x }); const att = lireEnsemble(F); if (att.length !== 2 || att.some((x) => Math.abs(g(x)) > 1e-9) || att[0] === att[1]) faux(e, '6.2a ' + F); compte('6.2a'); }
          else if (id === '6.2 b)') {
            const parts = tx.split('='); const h = (x) => val(parts[0], { x }) - val(parts[1], { x }); const sol = lireEnsemble(F);
            if (sol.length !== 1 || Math.abs(h(sol[0])) > 1e-9) faux(e, '6.2b ' + F);
            if (Math.abs(h(sol[0] + 1) - h(sol[0] + 2) * 0.5) < 1e-12 && Math.abs(h(sol[0] + 1)) < 1e-12) faux(e, '6.2b identite'); compte('6.2b');
          }
          else if (id === '6.3') { const v = val(tx); if (!proche(v, val(F), 1e-9) || !proche(v, math.evaluate(e.reponse), 1e-9)) faux(e, '6.3 ' + F + ' ' + v); compte('6.3'); }
          else if (id === '6.4') { const g = (x) => val(premier(tx), { x }); for (const x of [-2.3, 0.7, 1.9]) if (!proche(g(x), val(F, { x }), 1e-9) || !proche(g(x), math.evaluate(e.reponse, { x }), 1e-9)) faux(e, '6.4 ' + F); compte('6.4'); }
          else if (/^6\.5 /.test(id)) { const f = (x) => val(premier(tx).replace(/^f\(x\)=/, ''), { x }); for (const x of [-1.3, 0.4, 2.2]) if (!proche(deriv(f, x), val(F, { x }), 1e-5) || !proche(deriv(f, x), math.evaluate(e.reponse, { x }), 1e-5)) faux(e, '6.5 ' + F + ' en ' + x); compte('6.5'); }
          else if (/^6\.[67] /.test(id)) {
            // h(x) = k f(px+q) ; f' donnee dans l'enonce commun (1/x + x ou 2x/(3+x^2)) : h'(x) = k p f'(px+q)
            const g = id.startsWith('6.6') ? paramsAvances.g9 : paramsAvances.g10, fp = id.startsWith('6.6') ? (u) => 1 / u + u : (u) => 2 * u / (3 + u * u), hp = (x) => g.k.n * g.p * fp(g.p * x + g.q);
            if (/a\)$/.test(id)) { for (const x of [-2.6, 0.45, 1.9]) if (!proche(hp(x), val(F, { x }), 1e-9)) faux(e, id + ' ' + F + ' en ' + x + ' : ' + val(F, { x }) + ' / ' + hp(x)); }
            else { const pt = val(tx.match(/h'\\left\((.*)\\right\)/)[1]), att = hp(pt); if (!proche(att, val(F), 1e-9) || !proche(att, math.evaluate(e.reponse), 1e-9)) faux(e, id + ' ' + F + ' / ' + att); }
            compte('6.6/6.7');
          }
          else if (/^6\.8 /.test(id)) {
            const fx = tx.match(/f\(x\)=(.*?)\\\) et/)[1], a = val(tx.match(/a=(.*?)\\\)/)[1]), f = (x) => val(fx, { x });
            const p0 = f(a) - a * deriv(f, a); if (!proche(p0, val(F), 1e-5) || !proche(p0, math.evaluate(e.reponse), 1e-5)) faux(e, '6.8 ' + F + ' ' + p0); compte('6.8');
          }
          else if (id === '6.9') {
            const f = (x) => val(tx.match(/f\(x\)=(.*?)\\\)/)[1], { x }), g = (x) => val(tx.match(/g\(x\)=(.*?)\\\)/)[1], { x }), exclu = val(tx.match(/différent de \\\((.*?)\\\)/)[1]);
            for (const a of [-3.7, -0.6, 1.3, 2.9]) { if (Math.abs(a - exclu) < 1e-3) continue; const pf = deriv(f, a), pg = deriv(g, a), xs = a + (g(a) - f(a)) / (pf - pg); if (!proche(xs, val(F, { a }), 1e-5) || !proche(xs, math.evaluate(e.reponse, { a }), 1e-5)) faux(e, '6.9 ' + F + ' en a=' + a + ' : ' + val(F, { a }) + ' / ' + xs); }
            compte('6.9');
          }
          else if (id === '6.10 a)') {
            const f = (x) => val(tx.match(/f\(x\)=(.*?)\\\), trouver/)[1], { x }), m = tx.split('point')[1].match(/\\left\((.*?)\\,;\\,(.*?)\\right\)/), px = val(m[1]), py = val(m[2]);
            const att = lireEnsemble(F), gg = (t) => f(t) + deriv(f, t) * (px - t) - py;
            if (att.length !== 2 || att[0] === att[1] || att.some((t) => Math.abs(gg(t)) > 1e-5)) faux(e, '6.10a ' + F);
            let signes = 0, prec = gg(-40); for (let t = -39.9; t <= 40; t += 0.1) { const cur = gg(t); if (prec * cur < 0) signes++; prec = cur; } if (signes > 2) faux(e, '6.10a trop de racines'); compte('6.10a');
          }
          else if (id === '6.10 b)') {
            const x0 = Number(tx.match(/T_\{f,(-?\d+)\}/)[1]), fb = (b, x) => val(tx.match(/f\(x\)=(.*?)\\\)\./)[1], { b, x }), att = lireEnsemble(F);
            if (att.length !== 2 || att[0] === att[1] || att.some((bb) => Math.abs(deriv((x) => fb(bb, x), x0)) > 1e-5)) faux(e, '6.10b ' + F);
            for (const bb of [0, 0.3, 0.77, -0.5, 2]) if (!att.some((c) => Math.abs(c - bb) < 1e-9) && Math.abs(deriv((x) => fb(bb, x), x0)) < 1e-9) faux(e, '6.10b autre valeur ' + bb); compte('6.10b');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
