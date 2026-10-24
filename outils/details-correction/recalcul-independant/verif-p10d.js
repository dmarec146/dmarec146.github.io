// Verification independante des details de Premiere 10 (exponentielle : inequations, biquadratiques, puissances de 10, derivees, tangentes, variations, sommes, extremums) : recalcul a partir de l'enonce affiche
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/premiere/cahier-3/fiche-10.html';
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
    const proche = (a, c, tol = 1e-6) => Math.abs(a - c) <= tol * (1 + Math.abs(a) + Math.abs(c));
    const mj = (t) => {
      let u = String(t).replace(/\\displaystyle|\\textstyle/g, '').replace(/\{,\}/g, '.').replace(/\\left|\\right|\\,|\\ /g, ' ').replace(/\\times/g, '*').replace(/\\lt/g, '<').replace(/\\gt/g, '>').replace(/\\frac/g, '\\dfrac');
      for (let i = 0; i < 8; i++) u = u.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
      return u.replace(/([knx])e\^/g, '$1*e^').replace(/(\d)\s*\(/g, '$1*(').replace(/\)\s*(\d)/g, ')*$1').replace(/(\d)\s*([a-zA-Z])/g, '$1*$2').replace(/\)\s*\(/g, ')*(').replace(/\)\s*([a-zA-Z])/g, ')*$1').replace(/kx/g, 'k*x').replace(/nx/g, 'n*x').replace(/\bx\s*\(/g, 'x*(').replace(/\)\s*e\b/g, ')*e');
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
    const expressionF = (tx) => tx.match(/f\(x\)=(.*?)\\\)/)[1];
    // points de test strictement dans l'ensemble de definition annonce (« Sur ]p;q[ ») ; sinon points positifs
    const pointsDans = (tx) => {
      const m = tx.match(/Sur \\\((\]|\[)(.+?);(.+?)(\]|\[)\\\)/) || tx.match(/sur \\\((\]|\[)(.+?);(.+?)(\]|\[)\\\)/);
      if (!m || /f\(x\)/.test(m[0])) return [0.45, 0.9, 1.7, 2.6];
      const bo = (t) => (/infty/.test(t) ? (t.includes('-') ? -Infinity : Infinity) : val(t));
      const lo = bo(m[2]), hi = bo(m[3]);
      const a = isFinite(lo) ? lo : hi - 6, c = isFinite(hi) ? hi : a + 6;
      return [0.12, 0.35, 0.6, 0.9].map((q) => a + (c - a) * q);
    };
    const derivee = (f, x) => { const h = 1e-6 * (1 + Math.abs(x)); return (f(x + h) - f(x - h)) / (2 * h); };
    const sommeCorps = (corps, x, n) => { let s0 = 0; for (let k = 1; k <= n; k++) s0 += val(corps, { k, x, n }); return s0; };
    const valSomme = (F, x, n) => { const m = F.match(/^\\sum_\{k=1\}\^\{n\}(.*)$/); return m ? sommeCorps(m[1], x, n) : val(F, { x, n }); };
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (id === '10.1 a)' || id === '10.1 b)') {
            const q = premier(tx).match(/^(.*?)(\\leqslant|\\geqslant|\\lt|<|>)(.*)$/), op = q[2];
            const vrai = (x) => { const a = val(q[1], { x }), c = val(q[3], { x }); if (!isFinite(a) || !isFinite(c)) return null; const y = a - c; return op === '>' ? y > 1e-10 : op === '\\geqslant' ? y >= -1e-10 : op === '\\leqslant' ? y <= 1e-10 : y < -1e-10; };
            const err = memeEnsemble(F, vrai, -40, 40); if (err) faux(e, id + ' ' + err + ' ' + F); compte('10.1');
          }
          else if (id === '10.2') {
            const parts = premier(tx).split('='), g = (x) => val(parts[0], { x }) - val(parts[1], { x }), att = lireEnsemble(F);
            if (att.some((x) => Math.abs(g(x)) > 1e-9) || new Set(att).size !== att.length) faux(e, '10.2 racine fausse ' + F);
            const nb = changements(g, -30.0013, 30.0007, 0.0101); if (nb !== att.length) faux(e, '10.2 nombre de racines ' + nb + ' / ' + att.length + ' ' + F);
            if (e.reponse !== undefined && att.length !== (String(e.reponse).match(/;/g) || []).length + 1) faux(e, '10.2 reponse ' + e.reponse); compte('10.2');
          }
          else if (id === '10.3') { const v = val(premier(tx.replace(/^Calculer /, ''))); if (!proche(v, val(F.replace(/\\,/g, '')), 1e-9) || !proche(v, math.evaluate(e.reponse), 1e-9)) faux(e, '10.3 ' + F + ' ' + v); compte('10.3'); }
          else if (/^10\.[45] /.test(id)) {
            const fx = expressionF(tx), f = (x) => val(fx, { x });
            for (const x of pointsDans(tx)) { const d = derivee(f, x); if (!proche(d, val(F, { x }), 1e-6) || !proche(d, math.evaluate(e.reponse, { x }), 1e-6)) faux(e, id + ' ' + F + ' en ' + x.toFixed(3) + ' : ' + d + ' / ' + val(F, { x })); }
            compte('10.4/10.5');
          }
          else if (/^10\.6 /.test(id)) {
            const fx = expressionF(tx), f = (x) => val(fx, { x }), a = val(tx.match(/a=(-?\d+)/)[1]);
            if (!/^y = /.test(F)) { faux(e, '10.6 final sans y = ' + F); continue; }
            const droite = (x) => val(F.slice(4).replace(/\\,/g, '*'), { x }), da = derivee(f, a);
            for (const x of [-2.3, 0.4, 1.7]) if (!proche(droite(x), f(a) + da * (x - a), 1e-6) || !proche(droite(x), math.evaluate(e.reponse, { x }), 1e-6)) faux(e, id + ' tangente ' + F + ' en ' + x + ' : ' + droite(x) + ' / ' + (f(a) + da * (x - a)));
            compte('10.6');
          }
          else if (/^10\.7 /.test(id)) {
            const fx = expressionF(tx), f = (x) => val(fx, { x });
            const vrai = (texte) => {
              const q = texte.match(/^(croissante|décroissante) sur \\\((.*)\\\)$/); if (!q) throw new Error('option illisible ' + texte);
              const sens = q[1] === 'croissante' ? 1 : -1; let lo = -12, hi = 12;
              if (q[2] !== '\\mathbb{R}') { const m = q[2].match(/^([\[\]])(.+?);(.+?)([\[\]])$/); const bo = (t, def) => (/infty/.test(t) ? def : val(t)); lo = bo(m[2], -12); hi = bo(m[3], 12); }
              const pas = (hi - lo) / 1000; let prec = f(lo);
              for (let i = 1; i <= 1000; i++) { const c = f(lo + i * pas); if (!(sens * (c - prec) > 0)) return false; prec = c; }
              return true;
            };
            const vraies = e.options.filter((o) => vrai(o.texte));
            if (vraies.length !== 1 || vraies[0].lettre !== F || e.bonneReponse !== F) faux(e, id + ' options vraies : ' + vraies.map((o) => o.lettre).join(',') + ' / final ' + F);
            compte('10.7');
          }
          else if (id === '10.8 a)') {
            const corps = tx.match(/\\sum_\{k=1\}\^\{n\}(.*?)\\\)/)[1];
            for (const [x, n] of [[0.37, 5], [-0.52, 4], [0.21, 7]]) if (!proche(sommeCorps(corps, x, n), valSomme(F, x, n), 1e-9) || !proche(sommeCorps(corps, x, n), math.evaluate(e.reponse, { x, n }), 1e-9)) faux(e, id + ' ' + F + ' en x=' + x + ' n=' + n);
            compte('10.8a');
          }
          else if (id === '10.8 b)') {
            for (const [x, n] of [[0.37, 5], [-0.52, 4], [0.21, 7]]) { const g = (t) => sommeCorps('e^(k*x)', t, n); const gg = (t) => { let s0 = 0; for (let k = 1; k <= n; k++) s0 += Math.exp(k * t); return s0; }; if (!proche(derivee(gg, x), valSomme(F, x, n), 1e-6)) faux(e, id + ' ' + F + ' en x=' + x + ' n=' + n); }
            compte('10.8b');
          }
          else if (id === '10.8 c)') {
            for (const [x, n] of [[0.37, 5], [-0.52, 4], [0.21, 7]]) { const direct = sommeCorps('k*e^(k*x)', x, n); if (!proche(direct, valSomme(F, x, n), 1e-9) || !proche(direct, math.evaluate(e.reponse, { x, n }), 1e-9)) faux(e, id + ' ' + F + ' en x=' + x + ' n=' + n); }
            compte('10.8c');
          }
          else if (/^10\.9 /.test(id)) {
            const fx = expressionF(tx), f = (x) => val(fx, { x }), m = dernier(tx).match(/^\[(.+?);(.+?)\]$/), al = val(m[1]), be = val(m[2]), pas = (be - al) / 200000;
            let imin = 0, imax = 0, fmin = Infinity, fmax = -Infinity;
            for (let i = 0; i <= 200000; i++) { const y = f(al + i * pas); if (y < fmin) { fmin = y; imin = i; } if (y > fmax) { fmax = y; imax = i; } }
            const interieur = (i) => i > 5 && i < 199995, cible = val(F), att = math.evaluate(e.reponse);
            const extr = interieur(imin) ? fmin : interieur(imax) ? fmax : null;
            if (extr === null) faux(e, '10.9 pas d extremum interieur'); else if (!proche(extr, cible, 1e-6) || !proche(extr, att, 1e-6)) faux(e, '10.9 ' + F + ' / extremum ' + extr);
            if (interieur(imin) && interieur(imax)) faux(e, '10.9 deux extremums interieurs');
            const nbc = changements((t) => derivee(f, t), al + 1.7e-4, be - 1.1e-4, pas * 20.37); if (nbc !== 1) faux(e, '10.9 changements de signe de f\' : ' + nbc);
            compte('10.9');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
