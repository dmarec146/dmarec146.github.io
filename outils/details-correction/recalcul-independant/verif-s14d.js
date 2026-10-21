// Verification independante des details de Seconde 14 : tout est recalcule a partir de l'enonce et des fonctions de la fiche
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 300);
const FICHE = process.argv[3] || 'cahiers/seconde/cahier-5/fiche-14.html';
(async () => {
  const s = http.createServer((req, res) => { const f = path.join(RACINE, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0, '127.0.0.1');
  await new Promise((r) => s.on('listening', r));
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${s.address().port}/${FICHE}`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof exercices !== 'undefined' && window.math && document.querySelector('.question'), null, { timeout: 40000 });
  const r = await p.evaluate((N) => {
    const nettoyer = (tex) => String(tex).replace(/\\\(|\\\)/g, '').replace(/\{,\}/g, '.').replace(/\\left|\\right/g, '').replace(/\\times/g, '*').replace(/\\,/g, '').replace(/\\text\{[^{}]*\}/g, '');
    const toMath = (tex) => { let t = nettoyer(tex);
      for (let i = 0; i < 8; i++) t = t.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
      t = t.replace(/\|([^|]*)\|/g, 'abs($1)').replace(/[{}]/g, '').replace(/(\d)x/g, '$1*x').replace(/\)x/g, ')*x').replace(/(\d|\))\(/g, '$1*(').replace(/x\(/g, 'x*(').replace(/x\^/g, 'x^');
      return t; };
    const val = (tex, x) => math.evaluate(toMath(tex), { x });
    const defauts = [], stats = {}; const compte = (k) => { stats[k] = (stats[k] || 0) + 1; };
    const faux = (e, m) => { if (defauts.length < 14) defauts.push(e.id + ' : ' + m + ' | ' + String(e.enonce).replace(/\s+/g, ' ').slice(0, 110)); };
    const proche = (a, c, tol = 1e-9) => Math.abs(a - c) <= tol;
    const ensembleFinal = (F) => F === '\\emptyset' ? [] : F.replace(/^\\\{|\\\}$/g, '').split('\\,;\\,').map((z) => val(z, 0)).sort((u, v) => u - v);
    const memeListe = (A, B) => A.length === B.length && A.every((v, i) => proche(v, B[i], 1e-7));
    const polys = (expr) => [-3, -1, 0, 2, 5, 1.5].map((x) => val(expr, x));
    for (let t = 0; t < N; t++) {
      const ex = genererExercices();
      const f14 = fonctionGraphique14(paramsGraphique14), P = paramsGraphique14;
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, L = D.lignes;
        try {
          if (/^14\.1 /.test(id)) { const v = val(e.enonce, 0); if (!proche(v, val(F, 0)) || !proche(v, Number(e.reponse))) faux(e, 'calcul ' + v + ' vs ' + F); compte('14.1'); }
          else if (/^14\.2 /.test(id)) {
            const a = polys(e.enonce), c = polys(F.replace(/x\^\{2\}/g, 'x^2')), r = polys(e.reponse);
            if (!a.every((v, i) => proche(v, c[i], 1e-7) && proche(v, r[i], 1e-7))) faux(e, 'developpement ' + F);
            if (/\b1x|\b1\\times x|\^\{1\}/.test(F)) faux(e, 'forme'); compte('14.2');
          }
          else if (/^14\.3 /.test(id)) {
            const m = e.enonce.match(/f\(x\)=(.+?)\\\), image de \\\((-?\d+)\\\)/), k = Number(m[2]);
            const v = val(m[1].replace(/x\^(\d)/g, 'x^$1'), k);
            if (!proche(v, val(F, 0)) || !proche(v, Number(e.reponse))) faux(e, 'image ' + v + ' vs ' + F); compte('14.3');
          }
          else if (/^14\.4 a/.test(id)) {
            const { a, b, c, k1 } = paramsProgramme; if (!proche(c * (a * k1 + b), Number(F))) faux(e, 'programme'); compte('14.4a');
          }
          else if (/^14\.4 b/.test(id)) {
            const { a, b, c, k3, x0 } = paramsProgramme; const m = F.replace(/\s/g, '').match(/^(-?\d+)\\text\{et\}(-?\d+)$/);
            if (!m || Number(m[1]) !== c * (a * k3 + b) || Number(m[2]) !== x0 || c * (a * x0 + b) !== e.resultatAntecedent) faux(e, 'tableau programme ' + F); compte('14.4b');
          }
          else if (/^14\.5 a/.test(id)) {
            const x0 = Number(e.enonce.match(/f\((-?\d+)\)/)[1]); if (!proche(f14(x0), Number(F)) || !proche(f14(x0), e.type === 'approx' ? e.valeurApprox : Number(e.reponse))) faux(e, 'image lue'); compte('14.5a');
          }
          else if (/^14\.5 [bc]/.test(id)) {
            const y0 = Number(e.enonce.match(/\\\((-?\d+)\\\) par/)[1]);
            if (F === '\\emptyset') { const min = P.degre === 2 ? P.r : -Infinity; if (!(P.degre === 2 && y0 < P.r) || e.reponse !== '{}') faux(e, 'vide a tort'); }
            else if (/^\\\{/.test(F)) { const els = ensembleFinal(F); if (!els.every((x) => proche(f14(x), y0, 1e-7)) || els.length !== 2 || P.degre !== 2 || !memeListe(els, [P.p - Math.sqrt(y0 - P.r), P.p + Math.sqrt(y0 - P.r)])) faux(e, 'antecedents ' + F); }
            else { const x = Number(F); if (!proche(f14(x), y0, 1e-7) || !e.valeurApprox.some((v) => Math.abs(v - x) <= 0.2) || x < P.xmin || x > P.xmax) faux(e, 'un antecedent ' + F); }
            compte('14.5' + id[5]);
          }
          else if (/^14\.5 d/.test(id)) {
            const op = e.enonce.match(/\\(gt|geqslant|lt|leqslant)0/)[1]; const sat = (y) => op === 'gt' ? y > 0 : op === 'geqslant' ? y >= 0 : op === 'lt' ? y < 0 : y <= 0;
            const morceaux = F === '\\emptyset' ? [] : F.split(/\\ \\cup\\ /).map((z) => { const m = z.match(/^([\[\]])(.+?)\\,;\\,(.+?)([\[\]])$/); return { ib: m[1] === '[', bas: val(m[2], 0), haut: val(m[3], 0), ih: m[4] === ']' }; });
            for (let x = P.xmin; x <= P.xmax + 1e-9; x += 0.013) {
              const dedans = morceaux.some((m) => (x > m.bas || (x === m.bas && m.ib)) && (x < m.haut || (x === m.haut && m.ih)));
              const loin = morceaux.every((m) => Math.abs(x - m.bas) > 0.1 && Math.abs(x - m.haut) > 0.1) && Math.abs(f14(x)) > 1e-3;
              if (loin && dedans !== sat(f14(x))) { faux(e, 'inequation en x=' + x.toFixed(3) + ' : ' + F); break; }
            }
            if (!L.some((l) => (op === 'gt' || op === 'geqslant' ? /au-dessus de l'axe/ : /en dessous de l'axe/).test(l))) faux(e, 'phrase dessus/dessous'); compte('14.5d');
          }
          else if (/^14\.6 /.test(id)) {
            const m = e.enonce.match(/\\\((\w)\(x\)=(.+?)\\\), (?:antécédent\(s\)|antécédent) de \\\((-?\d+)\\\)/); const c = Number(m[3]), g = (x) => val(m[2].replace(/x\^2/, 'x^2'), x);
            if (F === '\\emptyset') { let min = Infinity; for (let x = -50; x <= 50; x += 0.05) min = Math.min(min, g(x)); if (min <= c + 1e-6 || e.reponse !== '{}') faux(e, 'vide a tort'); }
            else if (/^\\\{/.test(F)) { const els = ensembleFinal(F); if (els.length !== 2 || !els.every((x) => proche(g(x), c, 1e-7))) faux(e, 'antecedents ' + F); }
            else if (!proche(g(Number(F)), c)) faux(e, 'antecedent ' + F);
            compte('14.6' + id[5]);
          }
          else if (/^14\.7 a/.test(id)) {
            const m = e.enonce.match(/f\(x\)=(.+?)\\\)\. Le point de coordonnées \\\(\((-?\d+)\\,;\\,(-?\d+)\)/); const fx = val(m[1], Number(m[2])); const app = proche(fx, Number(m[3]));
            if (app !== e.reponseOuiNon || F !== (app ? 'oui' : 'non')) faux(e, 'appartenance'); compte('14.7a' + (app ? 'o' : 'n'));
          }
          else if (/^14\.7 b/.test(id)) {
            const m = e.enonce.match(/g\(x\)=(.+?)\\\), a pour ordonnée \\\((-?\d+)\\\)/); const y0 = Number(m[2]); const els = ensembleFinal(F);
            if (els.length !== 2 || !els.every((x) => proche(val(m[1], x), y0, 1e-7))) faux(e, 'abscisses ' + F); compte('14.7b');
          }
          else if (/^14\.7 c/.test(id)) {
            const m = e.enonce.match(/f\(x\)=(.+?)\\\)\. Sachant/); const croiss = val(m[1], 1) > val(m[1], 0); const attendu = croiss ? '\\lt' : '\\gt';
            if (F !== `f(x_{1}) ${attendu} f(x_{2})` || e.reponse !== (croiss ? 'f(x1)<f(x2)' : 'f(x1)>f(x2)')) faux(e, 'comparaison ' + F); if (croiss === L.some((l) => /On multiplie par/.test(l))) faux(e, 'phrase multiplication'); compte('14.7c');
          }
          else if (/^14\.7 d/.test(id)) {
            const m = e.enonce.match(/\|x_1-?\+?(-?\d+)?\|=(\d+)\\\) et que \\\(\|x_2.*?\|=(\d+)/); const d1 = Number(e.enonce.match(/\|=(\d+)\\\) et/)[1]), d2 = Number(e.enonce.match(/\|=(\d+)\\\)\. Comparer/)[1]);
            const attendu = d1 < d2 ? '\\lt' : '\\gt'; if (F !== `g(x_{1}) ${attendu} g(x_{2})`) faux(e, 'comparaison ' + F); compte('14.7d');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
