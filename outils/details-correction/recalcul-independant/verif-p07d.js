// Verification independante des details de Premiere 7 (exponentielle : inequations, equations, puissances de e, identites remarquables, changement de variable, parite, cosh/sinh, sommes) : recalcul a partir de l'enonce affiche
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/premiere/cahier-3/fiche-07.html';
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
      let u = String(t).replace(/\\displaystyle/g, '').replace(/\\left|\\right|\\,|\\ /g, ' ').replace(/\\times/g, '*').replace(/\\lt/g, '<').replace(/\\gt/g, '>').replace(/\\(cosh|sinh)/g, '$1');
      for (let i = 0; i < 8; i++) u = u.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
      return u.replace(/(\d)\s*\(/g, '$1*(').replace(/\)\s*(\d)/g, ')*$1').replace(/(\d)\s*([a-zA-Z])/g, '$1*$2').replace(/\)\s*\(/g, ')*(').replace(/\)\s*([a-zA-Z])/g, ')*$1').replace(/kx/g, 'k*x').replace(/nx/g, 'n*x').replace(/\bx\s*\(/g, 'x*(').replace(/\)\s*e\b/g, ')*e');
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
    const dernier = (tx) => tx.slice(tx.lastIndexOf('\\(') + 2, tx.lastIndexOf('\\)'));
    const changements = (g, lo, hi, pas) => { let n = 0, prec = g(lo); for (let t = lo + pas; t <= hi; t += pas) { const c = g(t); if (isFinite(prec) && isFinite(c) && prec * c < 0) n++; prec = c; } return n; };
    const sommes = (txt, x, n) => { const m = txt.match(/\\sum_\{k=(\d+)\}\^\{n\}(.*)$/); let s0 = 0; for (let k = Number(m[1]); k <= n; k++) s0 += val(m[2], { k, x, n }); return s0; };
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (id === '7.1 a)' || id === '7.1 b)') {
            const q = premier(tx).match(/^(.*?)(\\leqslant|\\geqslant|\\lt|<|>)(.*)$/), op = q[2];
            const vrai = (x) => { const y = val(q[1], { x }) - val(q[3], { x }); return op === '>' ? y > 1e-10 : /lt|</.test(op) && op !== '\\leqslant' ? y < -1e-10 : op === '\\geqslant' ? y >= -1e-10 : y <= 1e-10; };
            const err = memeEnsemble(F, vrai, -14, 14); if (err) faux(e, id + ' ' + err + ' ' + F); compte('7.1');
          }
          else if (id === '7.2 a)' || id === '7.2 b)') {
            const parts = premier(tx).split('='), g = (x) => val(parts[0], { x }) - val(parts[1], { x }), att = lireEnsemble(F);
            if (att.length !== 2 || att[0] === att[1] || att.some((x) => Math.abs(g(x)) > 1e-9)) faux(e, id + ' ' + F); compte('7.2');
          }
          else if (id === '7.3 a)') { const v = val(premier(tx)); if (!proche(v, val(F), 1e-9) || !proche(v, math.evaluate(e.reponse), 1e-9)) faux(e, '7.3a ' + F + ' ' + v); compte('7.3a'); }
          else if (id === '7.3 b)') { const c = tx.match(/\\dfrac\{.*\}\{.*\}/)[0]; const v = val(c, { n: 2.7 }), v2 = val(c, { n: -1.3 }); if (!proche(v, val(F), 1e-9) || !proche(v2, val(F), 1e-9) || !proche(v, math.evaluate(e.reponse), 1e-9)) faux(e, '7.3b ' + F + ' ' + v); compte('7.3b'); }
          else if (/^7\.[45] /.test(id)) {
            const g = (x) => val(premier(tx.replace(/^(Développer|Factoriser) /, '')), { x }); for (const x of [-1.3, 0.4, 0.9]) { if (!proche(g(x), val(F, { x }), 1e-9) || !proche(g(x), math.evaluate(e.reponse.replace(/\^\(/g, '^('), { x }), 1e-9)) faux(e, id + ' ' + F + ' en ' + x + ' : ' + g(x) + ' / ' + val(F, { x })); }
            compte('7.4/7.5');
          }
          else if (id === '7.6 a)' || id === '7.6 b)' || id === '7.6 c)' || id === '7.8 a)') {
            const parts = premier(tx).split('='), g = (x) => val(parts[0], { x }) - val(parts[1], { x }), att = lireEnsemble(F);
            if (att.some((x) => Math.abs(g(x)) > 1e-9 * (1 + Math.exp(Math.abs(x) * 3)))) faux(e, id + ' racine fausse ' + F);
            const nb = changements(g, -8.0013, 8.0007, 0.0101); if (nb !== att.length) faux(e, id + ' nombre de racines ' + nb + ' / ' + att.length); compte('7.6/7.8a');
          }
          else if (/^7\.7 /.test(id)) {
            const q = premier(tx).match(/^(.*?)(\\leqslant|\\geqslant|\\lt|<|>)(.*)$/), op = q[2];
            const vrai = (x) => { const a = val(q[1], { x }), c = val(q[3], { x }); if (!isFinite(a) || !isFinite(c)) return null; const y = a - c; return op === '>' ? y > 1e-10 : op === '\\geqslant' ? y >= -1e-10 : op === '\\leqslant' ? y <= 1e-10 : y < -1e-10; };
            const err = memeEnsemble(F, vrai, -5.5, 5.5); if (err) faux(e, id + ' ' + err + ' ' + F); compte('7.7');
          }
          else if (id === '7.8 b)') {
            const parts = premier(tx).split('='), g = (x) => val(parts[0], { x }) - val(parts[1], { x }), att = lireEnsemble(F);
            if (att.length !== 3 || att.some((x) => Math.abs(g(x)) > 1e-8)) faux(e, '7.8b racine fausse ' + F);
            for (let x = -3; x <= 3; x += 0.001) if (Math.abs(g(x)) < 1e-5 && !att.some((r0) => Math.abs(x - r0) < 0.05)) { faux(e, '7.8b autre racine ' + x); break; }
            compte('7.8b');
          }
          else if (id === '7.9') {
            const f = (t) => val(tx.match(/\\mapsto (.*?)\\\)/)[1], { t }); for (const t of [0.3, -1.1, 2.4]) if (!proche(f(-t), -f(t), 1e-9)) faux(e, '7.9 non impaire');
            const bonne = e.options.find((o) => o.texte.includes('impaire') && !o.texte.includes('ni')).lettre; if (F !== bonne || e.bonneReponse !== bonne) faux(e, '7.9 lettre ' + F + ' / ' + bonne); compte('7.9');
          }
          else if (id === '7.10') { for (const x of [0.3, -1.2, 2.2]) if (!proche(Math.cosh(x) ** 2 - Math.sinh(x) ** 2, 1, 1e-9)) faux(e, '7.10'); if (F !== 'Vrai' || e.estVrai !== true) faux(e, '7.10 reponse'); compte('7.10'); }
          else if (id === '7.11') { for (const x of [0.3, -1.2, 2.2]) if (!proche(Math.cosh(2 * x), val(F, { x }), 1e-9)) faux(e, '7.11 ' + F); compte('7.11'); }
          else if (id === '7.12 a)' || id === '7.12 b)') {
            const lhs = tx.match(/On a \\\((.*?)=\\cdots/)[1], pts = [[0.4, -0.7], [1.3, 0.9], [-0.8, 1.7]];
            const bonnes = e.options.filter((o) => pts.every(([x, y]) => proche(val(lhs, { x, y }), val(o.texte, { x, y }), 1e-9)));
            if (bonnes.length !== 1 || bonnes[0].lettre !== F || e.bonneReponse !== F) faux(e, id + ' options ' + bonnes.length + ' lettre ' + F); compte('7.12');
          }
          else if (id === '7.13') {
            const g = (x) => val(dernier(tx).split('=')[0], { x }) - 1; const att = lireEnsemble(F);
            if (att.length !== 1 || Math.abs(g(att[0])) > 1e-9) faux(e, '7.13 racine'); for (let x = -3; x <= 3; x += 0.01) if (Math.abs(x) > 0.02 && g(x) < 1e-6) { faux(e, '7.13 autre racine ' + x); break; } compte('7.13');
          }
          else if (id === '7.14 a)' || id === '7.14 b)') {
            const corps = dernier(tx); for (const [x, n] of [[0.37, 5], [-0.52, 4], [0.21, 7]]) if (!proche(sommes(corps, x, n), val(F, { x, n }), 1e-9) || !proche(sommes(corps, x, n), math.evaluate(e.reponse, { x, n }), 1e-9)) faux(e, id + ' ' + F + ' en x=' + x + ' n=' + n); compte('7.14');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
