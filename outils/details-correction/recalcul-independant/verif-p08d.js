// Verification independante des details de Premiere 8 (exponentielle : inequations, equations, puissances, systeme, courbes, somme, produit, vrai-faux) :
// recalcul a partir de l'enonce affiche (et, pour 8.9, du dessin des trois courbes) ; usage : node verif-p08d.js 300 [chemin de la fiche]
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/premiere/cahier-3/fiche-08.html';
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
    // LaTeX -> math.js (enonces et lignes des details)
    const mj = (t) => {
      let u = String(t).replace(/\\displaystyle/g, '').replace(/\\left|\\right|\\,|\\ /g, ' ').replace(/\\times/g, '*').replace(/\\lt/g, '<').replace(/\\gt/g, '>');
      for (let i = 0; i < 10; i++) u = u.replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
      return u.replace(/(\d)\s*\(/g, '$1*(').replace(/\)\s*(\d)/g, ')*$1').replace(/(\d)\s*([a-zA-Z])/g, '$1*$2').replace(/\)\s*\(/g, ')*(').replace(/\)\s*([a-zA-Z])/g, ')*$1').replace(/\bx\s*\(/g, 'x*(').replace(/\bn\s*\(/g, 'n*(').replace(/kx/g, 'k*x').replace(/nx/g, 'n*x').replace(/\)\s*e\b/g, ')*e');
    };
    const eps = (a, c) => 1e-9 * (1 + Math.abs(a) + Math.abs(c));        // tolerance relative : e^16 - (e^4)^4 n'est pas exactement nul en flottants
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
    // changements de signe de g (hors poles : |g| trop grand ou non fini)
    // un changement de signe est une racine si la dichotomie converge vers une valeur nulle (un pole, lui, diverge)
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
    const egalEnsembles = (att, rs, tol) => att.length === rs.length && att.every((x, i) => Math.abs(x - rs[i]) < tol);
    const reponseEnsemble = (rep) => { const m = String(rep).trim().match(/^\{(.*)\}$/); if (!m) return null; return m[1].split(';').filter((x) => x.trim()).map((x) => math.evaluate(x)).sort((u, w) => u - w); };
    // classification des trois courbes a partir du dessin : decroissante, croissante convexe (illimitee) ou croissante concave (bornee)
    const classerCourbes = () => {
      const svgs = [...document.querySelectorAll('#graphique-8-11 svg')]; const familles = [];
      for (const sv of svgs) {
        const d = sv.querySelector('path').getAttribute('d').replace(/^M\s*/, '').split(/\s*L\s*/).map((q) => q.split(',').map(Number));
        // coordonnees SVG : y vers le bas ; on retourne pour raisonner en repere usuel
        const pts = d.map(([x, y]) => [x, -y]); const n = pts.length, pente = (a, c) => (pts[c][1] - pts[a][1]) / (pts[c][0] - pts[a][0]);
        const premierePente = pente(0, Math.floor(n / 3)), dernierePente = pente(n - 1 - Math.floor(n / 3), n - 1);
        if (premierePente < 0 && dernierePente < 0) familles.push('decroissante');
        else if (premierePente > 0 && dernierePente > 0) familles.push(dernierePente > premierePente ? 'illimitee' : 'bornee');
        else familles.push('?');
      }
      return familles;
    };
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      if (typeof construireGraphique10_11 === 'function') construireGraphique10_11();
      const fam = classerCourbes();
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (id === '8.1 a)' || id === '8.1 b)') {
            const q = premier(tx).split(OPS), op = q[1], gauche = q[0], droite = q[2];
            const vrai = (x) => { const a = val(gauche, { x }), c = val(droite, { x }); if (!isFinite(a) || !isFinite(c)) return null; const y = a - c, t = eps(a, c); return op === '>' ? y > t : op === '\\geqslant' ? y >= -t : op === '\\leqslant' ? y <= t : y < -t; };
            const err = memeEnsemble(F, vrai, -15, 15); if (err) faux(e, id + ' ' + err + ' ' + F); compte('8.1');
          }
          else if (id === '8.2 a)') {
            const parts = premier(tx).split('='), g = (x) => val(parts[0], { x }) - val(parts[1], { x }), att = lireEnsemble(F);
            const rs = racinesParSigne(g, -80.0001, 80.0003, 0.0101);
            if (!egalEnsembles(att, rs, 0.01) || att.some((x) => Math.abs(g(x)) > 1e-9)) faux(e, '8.2a ' + F + ' vs ' + rs.join(',')); const rep = reponseEnsemble(e.reponse); if (!rep || !egalEnsembles(att, rep, 1e-9)) faux(e, '8.2a reponse ' + e.reponse + ' / ' + F); compte('8.2a');
          }
          else if (id === '8.2 b)') {
            const parts = premier(tx).split('='), g = (x) => val(parts[0], { x }), att = lireEnsemble(F);
            let pointsOk = true, mini = Infinity, xmin = 0; for (let x = -25; x <= 25; x += 0.0005) { const v = Math.abs(g(x)); if (v < mini) { mini = v; xmin = x; } }
            if (att.length === 0) { if (mini < 1e-3) pointsOk = false; }
            else if (att.length === 1) { if (Math.abs(g(att[0])) > 1e-9 || Math.abs(xmin - att[0]) > 0.01) pointsOk = false; for (let x = -25; x <= 25; x += 0.01) if (Math.abs(x - att[0]) > 0.05 && Math.abs(g(x)) < 1e-6) { pointsOk = false; break; } }
            else pointsOk = false;
            if (!pointsOk) faux(e, '8.2b ' + F); const rep = reponseEnsemble(e.reponse); if (!rep || !egalEnsembles(att, rep, 1e-9)) faux(e, '8.2b reponse ' + e.reponse + ' / ' + F); compte('8.2b');
          }
          else if (id === '8.3 a)') { const v = val(premier(tx)); if (!proche(v, val(F), 1e-9) || !proche(v, math.evaluate(e.reponse), 1e-9)) faux(e, '8.3a ' + F + ' ' + v); compte('8.3a'); }
          else if (id === '8.3 b)') {
            const q = [...tx.matchAll(/\\\((\d+)\\,\\%\\\)/g)].map((m) => Number(m[1])), n = Number(tx.match(/\\\((\d+)\\\)\s*$/)[1]), v = q[0] / 100 * q[1] / 100 * n;
            if (q.length !== 2 || !proche(v, val(F.replace(/\\,/g, '')), 1e-9) || !proche(v, Number(e.reponse), 1e-9)) faux(e, '8.3b ' + F + ' ' + v); compte('8.3b');
          }
          else if (/^8\.4 /.test(id)) {
            const g = (x) => val(premier(tx), { x }); for (const x of [-1.3, 0.4, 0.9]) if (!proche(g(x), val(F, { x }), 1e-9) || !proche(g(x), math.evaluate(e.reponse, { x }), 1e-9)) faux(e, id + ' ' + F + ' en x=' + x); compte('8.4');
          }
          else if (/^8\.5 /.test(id) || id === '8.7 c)' || id === '8.7 d)') {
            const parts = premier(tx).split('='), g = (x) => val(parts[0], { x }) - val(parts[1], { x }), att = lireEnsemble(F);
            const rs = racinesParSigne(g, -12.0013, 12.0007, 0.0101);
            if (rs.length !== att.length || att.some((x, i) => Math.abs(g(x)) > 1e-8 * (1 + Math.exp(Math.abs(x) * 2)) || Math.abs(x - rs[i]) > 0.02)) faux(e, id + ' ' + F + ' vs ' + rs.join(',')); const rep = reponseEnsemble(e.reponse); if (!rep || !egalEnsembles(att, rep, 1e-9)) faux(e, id + ' reponse ' + e.reponse + ' / ' + F); compte('8.5/8.7cd');
          }
          else if (id === '8.7 a)' || id === '8.7 b)') {
            const parts = premier(tx).split('='), g = (x) => val(parts[0], { x }) - val(parts[1], { x }), att = lireEnsemble(F);
            if (att.length !== 1 || Math.abs(g(att[0])) > 1e-9) faux(e, id + ' racine ' + F);
            for (let x = -8; x <= 8; x += 0.01) if (Math.abs(x - att[0]) > 0.06 && g(x) < 1e-7) { faux(e, id + ' g <= 0 en ' + x.toFixed(2)); break; }
            const rep = reponseEnsemble(e.reponse); if (!rep || !egalEnsembles(att, rep, 1e-9)) faux(e, id + ' reponse ' + e.reponse + ' / ' + F); compte('8.7ab');
          }
          else if (/^8\.6 /.test(id)) {
            const t = premier(tx); const morceaux = t.split(OPS);
            let vrai;
            if (morceaux.length === 5) {   // a <= f(x) <= b
              const o1 = morceaux[1], o2 = morceaux[3];
              const ok = (o, a, c) => { const y = a - c, t = eps(a, c); return o === '\\leqslant' || o === '<=' ? y <= t : y < -t; };
              vrai = (x) => { const a = val(morceaux[0], { x }), m = val(morceaux[2], { x }), c = val(morceaux[4], { x }); return ok(o1, a, m) && ok(o2, m, c); };
            } else {
              const op = morceaux[1];
              vrai = (x) => { const a = val(morceaux[0], { x }), c = val(morceaux[2], { x }); if (!isFinite(a) || !isFinite(c)) return null; const y = a - c, t = eps(a, c); return op === '>' ? y > t : op === '\\geqslant' ? y >= -t : op === '\\leqslant' ? y <= t : y < -t; };
            }
            const err = memeEnsemble(F, vrai, -9.5, 9.5); if (err) faux(e, id + ' ' + err + ' ' + F); compte('8.6');
          }
          else if (id === '8.8') {
            const sys = tx.match(/begin\{cases\}(.*?)\\\\ (.*?)\\end\{cases\}/); const eq = (q) => q.split('=').map((z) => z.trim());
            const e1 = eq(sys[1]), e2 = eq(sys[2]); const m = F.match(/^\\left\((-?\d+)\\,;\\,(-?\d+)\\right\)$/); if (!m) throw new Error('couple illisible ' + F);
            const x0 = Number(m[1]), y0 = Number(m[2]);
            const g1 = (x) => val(e1[0], { x }) - val(e1[1], { x }), g2 = (x, y) => val(e2[0], { x, y }) - val(e2[1], { x, y });
            if (Math.abs(g1(x0)) > 1e-9 || Math.abs(g2(x0, y0)) > 1e-9) faux(e, '8.8 couple ' + F);
            for (let x = -8; x <= 8; x += 0.01) if (Math.abs(x - x0) > 0.06 && g1(x) < 1e-7) { faux(e, '8.8 autre solution en x ' + x.toFixed(2)); break; }
            for (let y = -8; y <= 8; y += 0.01) if (Math.abs(y - y0) > 0.06 && Math.abs(g2(x0, y)) < 1e-6) { faux(e, '8.8 autre solution en y ' + y.toFixed(2)); break; }
            if (String(e.pa) !== String(x0) || String(e.pb) !== String(y0)) faux(e, '8.8 pa/pb ' + e.pa + ' ' + e.pb); compte('8.8');
          }
          else if (/^8\.9 /.test(id)) {
            const f = tx.match(/mapsto (.*?)\\\)/)[1]; const g = (x) => val(f, { x });
            const attendue = id === '8.9 a)' ? 'illimitee' : id === '8.9 b)' ? 'decroissante' : id === '8.9 d)' ? 'bornee' : null;
            const c = Number(String(f).match(/^(\d+)/)[1]);
            if (id === '8.9 c)') { if (e.reponse !== 'aucune' || F !== '\\text{aucune}' || fam.includes('?')) faux(e, '8.9c ' + e.reponse); if (Math.abs(g(0) - 1) > 1e-9 || Math.abs((c + 1) - c * Math.exp(0) - 1) > 1e-9) faux(e, '8.9c f(0)'); }
            else {
              const k = fam.indexOf(attendue) + 1; if (k === 0 || fam.filter((x) => x === attendue).length !== 1) faux(e, '8.9 famille ' + attendue + ' dans ' + fam.join(','));
              if (e.reponse !== 'courbe ' + k || F !== '\\text{courbe } ' + k) faux(e, '8.9 reponse ' + e.reponse + ' / courbe ' + k + ' / ' + F);
              const L = D.lignes.join(' '); if (!new RegExp('\\\\text\\{La courbe \\} ' + k + ' ').test(L)) faux(e, '8.9 detail cite une autre courbe : ' + L.slice(0, 80));
              if (attendue === 'bornee' && Math.abs(g(0)) > 1e-9) faux(e, '8.9d f(0)');
            }
            compte('8.9');
          }
          else if (id === '8.10') {
            const corps = tx.match(/\\sum_\{k=0\}\^\{n-1\}(.*?)\\\)/)[1];
            for (const [x, n] of [[0.37, 5], [-0.52, 4], [0.21, 7], [1.1, 3]]) { let s0 = 0; for (let k = 0; k <= n - 1; k++) s0 += val(corps, { k, x }); if (!proche(s0, val(F, { x, n }), 1e-9) || !proche(s0, math.evaluate(e.reponse, { x, n }), 1e-9)) faux(e, '8.10 ' + F + ' en x=' + x + ' n=' + n); }
            compte('8.10');
          }
          else if (id === '8.11') {
            const t2 = tx.match(/\\times (e(?:\^\{(-?\d+)\})?)\\times \\cdots/); const c = Number(t2[2] || 1) / 2;
            for (const n of [1, 2, 3, 5, 8]) { let pr = 1; for (let k = 1; k <= n; k++) pr *= Math.exp(c * k); if (!proche(pr, val(F, { n }), 1e-9) || !proche(pr, math.evaluate(e.reponse, { n }), 1e-9)) faux(e, '8.11 ' + F + ' n=' + n); }
            compte('8.11');
          }
          else if (id === '8.12') {
            const k = Number((tx.match(/f\(x\)=\\dfrac\{e\^\{(\d*)x\}/)[1]) || 1), k2 = Number((tx.match(/g\(f\(x\)\)=e\^\{(\d*)x\}/)[1]) || 1);
            for (const x of [-1.2, 0.3, 0.9]) { const f = (Math.exp(k * x) - Math.exp(-k * x)) / 2, gf = f + Math.sqrt(f * f + 1); if (!proche(gf, Math.exp(k * x), 1e-9)) faux(e, '8.12 identite'); }
            const vrai = k === k2; if (e.estVrai !== vrai || F !== (vrai ? 'Vrai' : 'Faux') || !D.lignes[D.lignes.length - 1].includes(vrai ? 'Vrai' : 'Faux')) faux(e, '8.12 reponse ' + e.estVrai + ' ' + F + ' (k=' + k + ', k2=' + k2 + ')'); compte('8.12');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
