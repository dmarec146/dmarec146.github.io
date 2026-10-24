// Verification independante des details de Premiere 9 (exponentielle : inequations, equations, derivees, tangentes, sens de variation) :
// recalcul a partir de l'enonce affiche (derivees par difference finie) ; usage : node verif-p09d.js 300 [chemin de la fiche]
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/premiere/cahier-3/fiche-09.html';
(async () => {
  const s = http.createServer((req, res) => { const f = path.join(RACINE, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0, '127.0.0.1');
  await new Promise((r) => s.on('listening', r));
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${s.address().port}/${FICHE}`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof exercices !== 'undefined' && window.math && document.querySelector('.question'), null, { timeout: 40000 });
  const r = await p.evaluate((N) => {
    const defauts = [], stats = {}; const compte = (k) => { stats[k] = (stats[k] || 0) + 1; };
    const faux = (e, m) => { if (defauts.length < 16) defauts.push(e.id + ' : ' + m + ' | ' + String(e.enonce).replace(/\s+/g, ' ').slice(0, 120)); };
    const proche = (a, c, tol = 1e-7) => Math.abs(a - c) <= tol * (1 + Math.abs(a) + Math.abs(c));
    const mj = (t) => {
      let u = String(t).replace(/\\displaystyle/g, '').replace(/\\alpha/g, '(alpha)').replace(/\\left|\\right|\\,|\\ /g, ' ').replace(/\\times/g, '*').replace(/\\lt/g, '<').replace(/\\gt/g, '>');
      for (let i = 0; i < 10; i++) u = u.replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
      return u.replace(/(\d)\s*\(/g, '$1*(').replace(/\)\s*(\d)/g, ')*$1').replace(/(\d)\s*([a-zA-Z])/g, '$1*$2').replace(/\)\s*\(/g, ')*(').replace(/\)\s*([a-zA-Z])/g, ')*$1').replace(/\bx\s*\(/g, 'x*(').replace(/\bn\s*\(/g, 'n*(').replace(/\)\s*e\b/g, ')*e').replace(/\bx\s*e\b/g, 'x*e').replace(/\bxn\b/g, 'x*n').replace(/\be\s+x\b/g, 'e*x').replace(/nx/g, 'n*x');
    };
    const eps = (a, c) => 1e-9 * (1 + Math.abs(a) + Math.abs(c));
    const cache = {}; const val = (t, sc) => { const k = String(t); return (cache[k] || (cache[k] = math.compile(mj(k)))).evaluate(sc || {}); };
    const lireIntervalles = (F) => {
      if (F === '\\emptyset') return []; if (F === '\\mathbb{R}') return [{ bas: -Infinity, haut: Infinity, ib: false, ih: false }];
      return F.split('\\ \\cup\\ ').map((m) => { const q = m.match(/^([\[\]])(.+?)\\,;\\,(.+?)([\[\]])$/); if (!q) throw new Error('intervalle illisible ' + m); const bo = (t) => (/\\infty/.test(t) ? (t.includes('-') ? -Infinity : Infinity) : val(t)); return { bas: bo(q[2]), haut: bo(q[3]), ib: q[1] === '[', ih: q[4] === ']' }; });
    };
    const dans = (L, t) => L.some((iv) => (t > iv.bas + 1e-9 || (Math.abs(t - iv.bas) < 1e-9 && iv.ib)) && (t < iv.haut - 1e-9 || (Math.abs(t - iv.haut) < 1e-9 && iv.ih)));
    const memeEnsemble = (F, vrai, lo, hi) => {
      const L = lireIntervalles(F); const bornes = L.flatMap((iv) => [iv.bas, iv.haut]).filter(isFinite);
      const pas = (hi - lo) / 6000;
      for (let t = lo; t <= hi; t += pas) { if (bornes.some((x) => Math.abs(t - x) < 2 * pas)) continue; const v = vrai(t); if (v === null) continue; if (dans(L, t) !== v) return 'desaccord en ' + t.toFixed(3); }
      for (const x of bornes) { const v = vrai(x); if (v !== null && dans(L, x) !== v) return 'borne ' + x.toFixed(4) + ' mal incluse ou exclue'; }
      for (const iv of L) { if ((iv.bas === -Infinity && iv.ib) || (iv.haut === Infinity && iv.ih)) return 'crochet a l infini'; }
      return null;
    };
    const lireEnsemble = (F) => { if (F === '\\emptyset') return []; const m = F.match(/^\\\{(.*)\\\}$/); if (!m) throw new Error('ensemble illisible ' + F); return m[1].split('\\,;\\,').map((x) => val(x)).sort((u, w) => u - w); };
    const premier = (tx) => tx.match(/\\\((.*?)\\\)/)[1];
    const OPS = /(\\leqslant|\\geqslant|\\lt|<|>)/;
    const racinesParSigne = (g, lo, hi, pas) => {
      const rs = []; let prec = g(lo), xp = lo;
      for (let t = lo + pas; t <= hi; t += pas) {
        const c = g(t);
        if (isFinite(prec) && isFinite(c) && prec * c < 0) {
          let a = xp, bb = t, ga = prec; for (let i = 0; i < 60; i++) { const m = (a + bb) / 2, gm = g(m); if (ga * gm <= 0) bb = m; else { a = m; ga = gm; } }
          if (Math.abs(g((a + bb) / 2)) < 1e-6) rs.push((a + bb) / 2);
        }
        prec = c; xp = t;
      }
      return rs;
    };
    const reponseEnsemble = (rep) => { const m = String(rep).trim().match(/^\{(.*)\}$/); if (!m) return null; return m[1].split(';').filter((x) => x.trim()).map((x) => math.evaluate(x)).sort((u, w) => u - w); };
    const deriv = (f, x, sc) => { const h = 1e-5 * Math.max(1, Math.abs(x)); return (f({ ...sc, x: x + h }) - f({ ...sc, x: x - h })) / (2 * h); };
    // ascii (reponse attendue) : lam = alpha
    const ascii = (r, sc) => math.evaluate(String(r).replace(/\blam\b/g, 'alpha'), sc);
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (id === '9.1 a)' || id === '9.1 b)') {
            const q = premier(tx).split(OPS), op = q[1];
            const vrai = (x) => { const a = val(q[0], { x }), c = val(q[2], { x }); if (!isFinite(a) || !isFinite(c)) return null; const y = a - c, t = eps(a, c); return op === '>' ? y > t : op === '\\geqslant' ? y >= -t : op === '\\leqslant' ? y <= t : y < -t; };
            const err = memeEnsemble(F, vrai, -15, 15); if (err) faux(e, id + ' ' + err + ' ' + F); compte('9.1');
          }
          else if (id === '9.2 a)' || id === '9.2 b)') {
            const parts = premier(tx).split('='), g = (x) => val(parts[0], { x }) - val(parts[1], { x }), att = lireEnsemble(F);
            const rs = racinesParSigne(g, -120.0001, 120.0003, 0.0101);
            if (rs.length !== att.length || att.some((x, i) => Math.abs(g(x)) > 1e-8 || Math.abs(x - rs[i]) > 0.02)) faux(e, id + ' ' + F + ' vs ' + rs.join(','));
            const rep = reponseEnsemble(e.reponse); if (!rep || rep.length !== att.length || rep.some((x, i) => Math.abs(x - att[i]) > 1e-9)) faux(e, id + ' reponse ' + e.reponse + ' / ' + F); compte('9.2');
          }
          else if (id === '9.3 a)') { const v = val(premier(tx.replace(/^Écrire /, ''))); const rep = math.evaluate(e.reponse); if (!proche(v, val(F), 1e-9) || !proche(v, rep, 1e-9)) faux(e, '9.3a ' + F + ' ' + v); compte('9.3a'); }
          else if (id === '9.3 b)') { const v = val(premier(tx.replace(/^Calculer /, ''))); if (!proche(v, val(F), 1e-9) || !proche(v, Number(e.reponse), 1e-9)) faux(e, '9.3b ' + F + ' ' + v); compte('9.3b'); }
          else if (/^9\.[4569] /.test(id)) {
            const corps = tx.match(/f\(x\)=(.*?)\\\)/)[1], f = (sc) => val(corps, sc);
            for (const sc of [{ x: 0.7, alpha: 0.9, n: 3 }, { x: 1.9, alpha: -1.3, n: 4 }, { x: 0.35, alpha: 2.1, n: 2 }, { x: -0.6, alpha: 0.4, n: 3 }]) {
              if (/sqrt\(x\)|\/x\b|\\dfrac\{\d+\}\{x\}|\{x\}/.test(corps + ' ' + mj(corps)) && sc.x < 0) continue;
              const d = deriv(f, sc.x, sc), v = val(F, sc), r = ascii(e.reponse, sc);
              if (!isFinite(d) || !isFinite(v)) continue;
              if (!proche(d, v, 2e-5) || !proche(d, r, 2e-5)) { faux(e, id + ' derivee ' + d.toFixed(5) + ' / final ' + v.toFixed(5) + ' / reponse ' + r.toFixed(5) + ' en x=' + sc.x); break; }
            }
            compte('derivees');
          }
          else if (/^9\.7 /.test(id)) {
            const corps = tx.match(/f\(x\)=(.*?)\\\)/)[1], a = Number(tx.match(/a=(-?\d+)/)[1]), f = (sc) => val(corps, sc);
            const fa = f({ x: a }), pente = deriv(f, a, {}), T = F.replace(/^y = /, '');
            for (const x of [-1.3, 0.2, 2.1]) if (!proche(pente * (x - a) + fa, val(T, { x }), 2e-5)) { faux(e, id + ' tangente ' + F + ' en x=' + x); break; }
            compte('9.7');
          }
          else if (/^9\.8 /.test(id)) {
            const corps = tx.match(/f\(x\)=(.*?)\\\) et/)[1], f = (sc) => val(corps, sc), pos = /\[0,\+\\infty\[/.test(tx), lo = pos ? 0.001 : -6, hi = 6;
            let croit = true, decroit = true; for (let x = lo; x <= hi; x += 0.01) { const d = deriv(f, x, {}); if (d < -1e-7 * (1 + Math.abs(d))) croit = false; if (d > 1e-7 * (1 + Math.abs(d))) decroit = false; }
            const classe = croit ? 'croissante' : decroit ? 'decroissante' : 'pas monotone';
            const bonne = e.options.find((o) => (classe === 'croissante' ? /est croissante/.test(o.texte) : classe === 'decroissante' ? /est d.croissante/.test(o.texte) : /pas monotone/.test(o.texte)));
            if (!bonne || bonne.lettre !== F || e.bonneReponse !== F || !D.lignes[D.lignes.length - 1].includes(F)) faux(e, id + ' classe ' + classe + ' lettre ' + (bonne && bonne.lettre) + ' / ' + F + ' / ' + e.bonneReponse);
            compte('9.8');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
