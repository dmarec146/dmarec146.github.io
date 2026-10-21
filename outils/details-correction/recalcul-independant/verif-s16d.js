// Verification independante des details de Seconde 16 : tout est recalcule a partir de l'enonce affiche
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 300);
const FICHE = process.argv[3] || 'cahiers/seconde/cahier-5/fiche-16.html';
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
      for (let i = 0; i < 8; i++) t = t.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\^\{([^{}]*)\}/g, '^($1)');
      t = t.replace(/[{}]/g, '').replace(/(\d|\))\s*x/g, '$1*x').replace(/(\d|\))\(/g, '$1*(').replace(/x\(/g, 'x*(').replace(/(\d|\))\s*([ky])/g, '$1*$2');
      return t; };
    const val = (tex, vars) => math.evaluate(toMath(tex), vars || {});
    const defauts = [], stats = {}; const compte = (k) => { stats[k] = (stats[k] || 0) + 1; };
    const faux = (e, m) => { if (defauts.length < 14) defauts.push(e.id + ' : ' + m + ' | ' + String(e.enonce).replace(/\s+/g, ' ').slice(0, 110)); };
    const proche = (a, c, tol = 1e-9) => Math.abs(a - c) <= tol;
    const polys = (expr) => [-3, -1, 0, 2, 5, 1.5].map((x) => val(expr, { x }));
    const droiteF = (F) => (x) => val(String(F).replace(/^\s*y\s*=\s*/, ''), { x });
    const points = (txt) => [...String(txt).matchAll(/([A-C])\\?(?:left)?\(([^;]+);([^)]+?)\\?(?:right)?\)/g)].map((m) => ({ nom: m[1], x: val(m[2].replace(/\\right$/, '')), y: val(m[3].replace(/\\right$/, '')) }));
    const parseIv = (F) => F.split(/\\ \\cup\\ /).map((z) => { const m = z.match(/^([\[\]])(.+?)\\,;\\,(.+?)([\[\]])$/); const v = (t) => /\\infty/.test(t) ? (t.includes('-') ? -Infinity : Infinity) : val(t); return { ib: m[1] === '[', bas: v(m[2]), haut: v(m[3]), ih: m[4] === ']' }; });
    const lireSysteme = (enonce) => { const m = String(enonce).match(/begin\{cases\}(.+?)\\\\(.+?)\\end\{cases\}/); const eq = (t) => { const q = t.match(/^(-?\d*)x([+-]\d*)y=(-?\d+)$/); const c = (v) => (v === '' ? 1 : v === '-' ? -1 : Number(v)); return { a: c(q[1]), b: q[2] === '+' ? 1 : q[2] === '-' ? -1 : Number(q[2]), c: Number(q[3]) }; }; return [eq(m[1]), eq(m[2])]; };
    for (let t = 0; t < N; t++) {
      const ex = genererExercices();
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, L = D.lignes;
        try {
          if (/^16\.1 /.test(id)) { const v = val(e.enonce); if (!proche(v, val(F)) || !proche(v, Number(e.reponse))) faux(e, 'calcul'); compte('16.1'); }
          else if (/^16\.2 /.test(id)) { const a = polys(e.enonce), c = polys(F), r = polys(e.reponse); if (!a.every((v, i) => proche(v, c[i], 1e-7) && proche(v, r[i], 1e-7))) faux(e, 'developpement ' + F); compte('16.2'); }
          else if (/^16\.3 /.test(id)) {
            const f = (x) => val(fonction16_3.m + '*x+' + fonction16_3.p, { x });
            if (id === '16.3 a)') { const x0 = Number(e.enonce.match(/f\((-?\d+)\)/)[1]); if (!proche(f(x0), Number(F))) faux(e, 'image'); }
            else { const y = Number(e.enonce.match(/\\\((-?\d+)\\\) par/)[1]); const x = val(F); if (!proche(f(x), y, 1e-9)) faux(e, 'antecedent ' + F); if (id === '16.3 c)' && (Number.isInteger(x) || !/^-?\\dfrac\{\d+\}\{\d+\}$/.test(F))) faux(e, 'fraction'); }
            compte('16.3' + id[5]);
          }
          else if (/^16\.4 /.test(id)) {
            const dr = droites16_4[Number(id[5].charCodeAt(0) - 97)]; const g = droiteF(F);
            if (!proche(g(0), dr.p) || !proche(g(3) - g(0), 3 * dr.m, 1e-9)) faux(e, 'equation lue ' + F);
            const mB = L.find((l) => /^B\(/.test(l)).match(/^B\((-?\d+)\\,;\\,(-?\d+)\)$/); if (!proche(g(Number(mB[1])), Number(mB[2]))) faux(e, 'B hors de la droite'); if (Math.abs(Number(mB[1])) > 5 || Math.abs(Number(mB[2])) > 5) faux(e, 'B hors du cadre');
            compte('16.4');
          }
          else if (/^16\.5 /.test(id)) {
            const pts = points(e.enonce), A = pts[0], B = pts[1]; const m = (B.y - A.y) / (B.x - A.x);
            if (!proche(m, val(F), 1e-9) || !proche(m, val(String(e.reponse).replace(/\//, '/')), 1e-9)) faux(e, 'pente ' + F + ' vs ' + m); compte('16.5' + id[5]);
          }
          else if (/^16\.6 /.test(id)) {
            const g = droiteF(F), pts = points(e.enonce);
            if (id === '16.6 a)' || id === '16.6 b)') { if (!pts.every((q) => proche(g(q.x), q.y, 1e-9))) faux(e, 'passe par A et B ' + F); }
            else if (id === '16.6 c)') { const p0 = Number(e.enonce.match(/origine \\\((-?\d+)\\\)/)[1]); if (!proche(g(0), p0) || !proche(g(pts[0].x), pts[0].y, 1e-9)) faux(e, 'ordonnee origine ' + F); }
            else { const m0 = e.enonce.match(/y=(.+?)\\\) et passe/)[1]; const g0 = (x) => val(m0, { x }); if (!proche(g(1) - g(0), g0(1) - g0(0), 1e-9) || !proche(g(pts[0].x), pts[0].y, 1e-9) || proche(g(0), g0(0))) faux(e, 'parallele ' + F); }
            compte('16.6' + id[5]);
          }
          else if (/^16\.7 /.test(id)) {
            const m = e.enonce.match(/f\(x\)=(.+?)\\\) : (au-dessus|en dessous)/), f = (x) => val(m[1], { x }), dessus = m[2] === 'au-dessus';
            const morceaux = parseIv(F);
            for (let x = -12; x <= 12; x += 0.0173) { const dedans = morceaux.some((q) => x >= q.bas - 1e-9 && x <= q.haut + 1e-9); if (Math.abs(f(x)) > 1e-6 && dedans !== (dessus ? f(x) > 0 : f(x) < 0)) { faux(e, 'signe en x=' + x.toFixed(3) + ' : ' + F); break; } }
            compte('16.7');
          }
          else if (/^16\.8 [ab]/.test(id)) {
            const m = e.enonce.match(/y=(.+?)\\\) et \\\(y=(.+?)\\\)/), g1 = (x) => val(m[1], { x }), g2 = (x) => val(m[2], { x }), parallel = proche(g1(1) - g1(0), g2(1) - g2(0), 1e-12);
            if (parallel !== !!e.aucunPoint) faux(e, 'parallelisme');
            if (parallel) { if (F !== "\\text{aucun point d'intersection}" || proche(g1(0), g2(0))) faux(e, 'aucun point'); }
            else { const mm = F.replace(/\\left|\\right/g, '').match(/^\((.+?)\\,;\\,(.+)\)$/); const x = val(mm[1]), y = val(mm[2]); if (!proche(g1(x), y, 1e-9) || !proche(g2(x), y, 1e-9)) faux(e, 'intersection ' + F); }
            compte('16.8' + id[5] + (parallel ? 'p' : 's'));
          }
          else if (/^16\.8 c|^16\.9 a/.test(id)) {
            const [e1, e2] = lireSysteme(e.enonce); const mm = F.replace(/\\left|\\right/g, '').match(/^\((.+?)\\,;\\,(.+)\)$/); const x = val(mm[1]), y = val(mm[2]);
            if (!proche(e1.a * x + e1.b * y, e1.c, 1e-9) || !proche(e2.a * x + e2.b * y, e2.c, 1e-9)) faux(e, 'solution ' + F); compte(id.slice(0, 4) + id[5]);
          }
          else if (/^16\.9 [bc]/.test(id)) {
            const [e1, e2] = lireSysteme(e.enonce); const det = e1.a * e2.b - e2.a * e1.b, dc = e1.c * e2.b - e2.c * e1.b;
            const au_moins = det !== 0 || dc === 0, unique = det !== 0, attendu = id === '16.9 b)' ? au_moins : unique;
            if (attendu !== e.reponseOuiNon || F !== (attendu ? 'oui' : 'non')) faux(e, 'existence'); compte('16.9' + id[5]);
          }
          else if (/^16\.10 a/.test(id)) {
            const pts = points(e.enonce), A = pts[0], B = pts[1], C = pts[2], g = droiteF(F);
            if (!proche(g(1) - g(0), (B.y - A.y) / (B.x - A.x), 1e-9) || !proche(g(C.x), C.y, 1e-9)) faux(e, 'parallele a (AB) ' + F); compte('16.10a');
          }
          else if (/^16\.10 b/.test(id)) {
            const pts = points(e.enonce), A = pts[0], B = pts[1], C = pts[2]; const align = (B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x) === 0;
            if (align !== e.reponseOuiNon || F !== (align ? 'oui' : 'non')) faux(e, 'alignement'); compte('16.10b' + (align ? 'o' : 'n'));
          }
          else if (/^16\.10 c/.test(id)) {
            const m = e.enonce.match(/y=\((.+?)\)x([+-]\d+)\\\) et \\\(y=(.+?)\\\) sont/); const k = val(F);
            const m1 = val(m[1], { k }), m2 = (() => { const q = m[3].match(/^(-?\d*)x/); return q[1] === '' ? 1 : q[1] === '-' ? -1 : Number(q[1]); })();
            if (!proche(m1, m2, 1e-9)) faux(e, 'k ' + F); compte('16.10c');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
