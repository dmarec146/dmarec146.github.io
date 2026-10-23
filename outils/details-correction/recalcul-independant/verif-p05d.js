// Verification independante des details de Premiere 5 (inequations et equations simples, derivees, signe de f', tangentes, sommes) : recalcul a partir de l'enonce affiche
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 300);
const FICHE = process.argv[3] || 'cahiers/premiere/cahier-2/fiche-05.html';
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
      u = u.split('kx').join('k*x').split('k(').join('k*(');
      return u.replace(/(\d)\s*\(/g, '$1*(').replace(/\)\s*(\d)/g, ')*$1').replace(/(\d)\s*([a-zA-Z])/g, '$1*$2').replace(/\)\s*\(/g, ')*(').replace(/\)\s*([a-zA-Z])/g, ')*$1').replace(/(\d)\s*(\()/g, '$1*(');
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
    const memeListe = (A, B) => A.length === B.length && A.every((x, i) => proche(x, B[i], 1e-9));
    const premier = (tx) => tx.match(/\\\((.*?)\\\)/)[1];
    const fdeX = (tx) => premier(tx).replace(/^f\(x\)=/, '');
    const deriv = (f, x) => (f(x + 1e-6) - f(x - 1e-6)) / 2e-6;
    // sommes \sum_{k=a}^{b} corps (b peut contenir n) : evaluation directe
    const somme = (F, x, n) => { const m = F.replace(/\\displaystyle/g, '').match(/^\\sum_\{k=(\d+)\}\^\{([^{}]+)\}(.*)$/); if (!m) throw new Error('somme illisible ' + F); const bas = Number(m[1]), haut = val(m[2], { n }); let s0 = 0; for (let k = bas; k <= haut; k++) s0 += val(m[3], { k, x, n }); return s0; };
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (id === '5.1 a)' || id === '5.1 b)') {
            const q = tx.match(/^(.*?)(\\leqslant|\\geqslant|<|>)(.*)$/), op = q[2];
            const g = (x) => val(q[1], { x }) - val(q[3], { x }); const vrai = (x) => { const y = g(x); return op === '>' ? y > 1e-10 : op === '<' ? y < -1e-10 : op === '\\geqslant' ? y >= -1e-10 : y <= 1e-10; };
            const err = memeEnsemble(F, vrai); if (err) faux(e, '5.1 ' + err + ' ' + F); compte('5.1');
          }
          else if (id === '5.2 a)') { const g = (x) => val(tx.split('=')[0], { x }); const att = lireEnsemble(F); if (att.length !== 2 || att.some((x) => Math.abs(g(x)) > 1e-9) || att[0] === att[1]) faux(e, '5.2a ' + F); compte('5.2a'); }
          else if (id === '5.2 b)') {
            const m = tx.match(/^\\dfrac\{(.*)\}\{(.*)\}=(-?\d+)$/); const h = (x) => val(m[1], { x }) / val(m[2], { x }) - Number(m[3]); const sol = lireEnsemble(F);
            if (sol.length !== 1 || Math.abs(h(sol[0])) > 1e-9) faux(e, '5.2b ' + F);
            // aucune autre solution : h est homographique, au plus une racine ; on balaie
            let autres = 0; let prec = h(-60); for (let x = -59.99; x <= 60; x += 0.01) { const cur = h(x); if (isFinite(prec) && isFinite(cur) && prec * cur < 0 && Math.abs(x - sol[0]) > 0.05 && Math.abs(Math.abs(prec) - Math.abs(cur)) < 5) autres++; prec = cur; }
            if (autres) faux(e, '5.2b autre solution'); compte('5.2b');
          }
          else if (id === '5.3 a)') { const v = val(tx.replace(/^Simplifier /, '').match(/\\\((.*)\\\)/)[1]); if (!proche(v, val(F), 1e-9) || !proche(v, math.evaluate(e.reponse), 1e-9)) faux(e, '5.3a ' + F + ' ' + v); compte('5.3a'); }
          else if (id === '5.3 b)') {
            const fx = tx.match(/f\(x\)=(.*?)\\\), calculer/)[1], pt = tx.match(/calculer \\\(f\\left\((.*)\\right\)\\\)/)[1];
            const v = val(fx, { x: val(pt) }); if (!proche(v, val(F), 1e-9) || !proche(v, math.evaluate(e.reponse), 1e-9)) faux(e, '5.3b ' + F + ' ' + v); compte('5.3b');
          }
          else if (/^5\.4 /.test(id)) { const f = (x) => val(fdeX(tx), { x }); for (const x of [-1.7, 0.4, 2.3]) if (!proche(deriv(f, x), val(F, { x }), 1e-5)) faux(e, '5.4 ' + F); compte('5.4'); }
          else if (/^5\.5 /.test(id)) {
            const fx = tx.match(/f\(x\)=(.*?)\\\) et/)[1], a = val(tx.match(/a=(.*?)\\\)/)[1]), f = (x) => val(fx, { x });
            if (!proche(deriv(f, a), val(F), 1e-5) || !proche(val(F), math.evaluate(e.reponse), 1e-9)) faux(e, '5.5 ' + F + ' ' + deriv(f, a)); compte('5.5');
          }
          else if (/^5\.[67] /.test(id)) { const f = (x) => val(fdeX(tx), { x }); for (const x of [0.6, 1.9, 3.2]) if (!proche(deriv(f, x), val(F, { x }), 1e-5)) faux(e, id + ' ' + F + ' en ' + x + ' : ' + val(F, { x }) + ' / ' + deriv(f, x)); compte('5.6/5.7'); }
          else if (/^5\.8 /.test(id)) {
            const f = (x) => val(fdeX(tx), { x }); const vrai = (x) => { const d = deriv(f, x); return isFinite(d) && d >= -1e-6; };
            const err = memeEnsemble(F, (x) => { if (id === '5.8 c)') { const d = deriv(f, x); return isFinite(d) && Math.abs(d) < 1e12 && d >= -1e-6; } return vrai(x); });
            if (err) faux(e, '5.8 ' + err + ' ' + F); compte('5.8');
          }
          else if (/^5\.9 /.test(id)) {
            const fx = tx.match(/f\(x\)=(.*?)\\\) et/)[1], a = val(tx.match(/a=(.*?)\\\)$/)[1]), f = (x) => val(fx, { x }), pente = deriv(f, a);
            for (const x of [-2, 0.5, 3.1]) if (!proche(val(F, { x }), f(a) + pente * (x - a), 1e-5)) faux(e, '5.9 tangente ' + F); compte('5.9');
          }
          else if (/^5\.10 /.test(id)) {
            const corps = tx.match(/f\(x\)=(.*?)\\\)$/)[1]; const n = 5; const f = (x) => somme(corps, x, n);
            for (const x of [0.7, 1.3, -0.9]) if (!proche(somme(F, x, n), deriv(f, x), 1e-4)) faux(e, '5.10 ' + F + ' en ' + x + ' : ' + somme(F, x, n) + ' / ' + deriv(f, x)); compte('5.10');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
