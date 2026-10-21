// Verification independante des details de Seconde 17
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 300);
const FICHE = process.argv[3] || 'cahiers/seconde/cahier-5/fiche-17.html';
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
      t = t.replace(/\|([^|]*)\|/g, 'abs($1)').replace(/[{}]/g, '').replace(/(\d|\))\s*x/g, '$1*x').replace(/(\d|\))\(/g, '$1*(').replace(/x\(/g, 'x*(');
      return t; };
    const val = (tex, x) => math.evaluate(toMath(tex), { x });
    const defauts = [], stats = {}; const compte = (k) => { stats[k] = (stats[k] || 0) + 1; };
    const faux = (e, m) => { if (defauts.length < 14) defauts.push(e.id + ' : ' + m + ' | ' + String(e.enonce).replace(/\s+/g, ' ').slice(0, 110)); };
    const proche = (a, c, tol = 1e-9) => Math.abs(a - c) <= tol;
    const polys = (expr) => [-3, -1, 0, 2, 5, 1.5].map((x) => val(expr, x));
    const parseIv = (F) => F.split(/\\ \\cup\\ /).map((z) => { const m = z.match(/^([\[\]])(.+?)\\,;\\,(.+?)([\[\]])$/); const v = (t) => /\\infty/.test(t) ? (t.includes('-') ? -Infinity : Infinity) : val(t, 0); return { ib: m[1] === '[', bas: v(m[2]), haut: v(m[3]), ih: m[4] === ']' }; });
    const dans = (x, L) => L.some((q) => (x > q.bas + 1e-12 || (Math.abs(x - q.bas) < 1e-12 && q.ib)) && (x < q.haut - 1e-12 || (Math.abs(x - q.haut) < 1e-12 && q.ih)));
    const droiteF = (F) => (x) => val(String(F).replace(/^\s*(?:y|f\(x\))\s*=\s*/, ''), x);
    for (let t = 0; t < N; t++) {
      const ex = genererExercices();
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, L = D.lignes;
        try {
          if (/^17\.1 /.test(id)) { const v = val(e.enonce, 0); if (!proche(v, val(F, 0)) || !proche(v, Number(e.reponse))) faux(e, 'calcul'); compte('17.1'); }
          else if (/^17\.2 /.test(id)) { const a = polys(e.enonce), c = polys(F), r = polys(e.reponse); if (!a.every((v, i) => proche(v, c[i], 1e-7) && proche(v, r[i], 1e-7))) faux(e, 'developpement ' + F); compte('17.2'); }
          else if (/^17\.3 /.test(id)) {
            const expr = e.enonce.match(/f\(x\)=(.+?)\\\)/)[1]; const f = (x) => { try { const v = val(expr, x); return typeof v === 'number' && isFinite(v) ? v : null; } catch (er) { return null; } };
            const morceaux = parseIv(F);
            for (let x = -12.0007; x <= 12; x += 0.0517) { const defini = f(x) !== null && !(typeof math.evaluate('1', {}) !== 'number'); const attendu = dans(x, morceaux); const reel = f(x) !== null; if (reel !== attendu) { faux(e, 'domaine en x=' + x.toFixed(3) + ' : ' + F); break; } }
            for (const x of [0, 3, -3, 6, -6, 1, 2, 5, 4, -1, -2, -4, -5]) { const reel = f(x) !== null, attendu = dans(x, morceaux); if (reel !== attendu) { faux(e, 'domaine en x=' + x + ' : ' + F); break; } }
            compte('17.3' + id[5]);
          }
          else if (/^17\.4 a/.test(id)) {
            const m = e.enonce.match(/f\((-?\d+)\)=(-?\d+)\\\) et \\\(f\((-?\d+)\)=(-?\d+)/); const pente = (Number(m[4]) - Number(m[2])) / (Number(m[3]) - Number(m[1]));
            if (!proche(pente, val(F, 0)) || !proche(pente, Number(e.reponse))) faux(e, 'pente'); compte('17.4a');
          }
          else if (/^17\.4 b/.test(id)) {
            const m = e.enonce.match(/m=(-?\d+)\\\), vérifie \\\(f\((-?\d+)\)=(-?\d+)/); const pp = Number(m[3]) - Number(m[1]) * Number(m[2]);
            if (!proche(pp, val(F, 0)) || !proche(pp, Number(e.reponse))) faux(e, 'ordonnee'); compte('17.4b');
          }
          else if (/^17\.4 c/.test(id)) {
            const m = [...e.enonce.matchAll(/([AB])\((-?\d+)\\,;\\,(-?\d+)\)/g)].map((q) => ({ x: Number(q[2]), y: Number(q[3]) })); const g = droiteF(F);
            if (!m.every((q) => proche(g(q.x), q.y, 1e-9))) faux(e, 'droite ' + F); compte('17.4c');
          }
          else if (/^17\.5 [ab]|^17\.6 [ab]/.test(id) && /bas|\\lt [ab]|\\lt x_1/.test(e.enonce) && /a\\lt|x_1\\lt/.test(e.enonce) && /^(17\.5 a|17\.6 a)/.test(id)) {
            const fe = e.enonce.match(/f\(x\)=(.+?)\\\)\./)[1]; const g = (x) => val(fe, x);
            const bs = [...e.enonce.matchAll(/(-?\d+)\\lt (?:a|b|x_1|x_2)\\lt (-?\d+)/g)].map((q) => [Number(q[1]), Number(q[2])]);
            let sup = null;
            for (let k = 0; k < 400; k++) { const u = bs[0][0] + Math.random() * (bs[0][1] - bs[0][0]), v = bs[1][0] + Math.random() * (bs[1][1] - bs[1][0]); const s2 = g(u) > g(v) ? '>' : '<'; if (sup === null) sup = s2; else if (sup !== s2) { faux(e, 'comparaison non constante'); break; } }
            const att = F.includes('\\gt') ? '>' : '<'; if (sup !== att || e.reponse.replace(/[a-z0-9()]/g, '') !== att) faux(e, 'symbole ' + F + ' vs ' + sup); compte(id.slice(0, 4) + 'a');
          }
          else if (/^17\.5 [bcd]|^17\.6 b/.test(id)) {
            const fe = e.enonce.match(/(?:g|h|k)\(x\)=(.+?)\\\)\./)[1]; const x1 = Number(e.enonce.match(/x_1=(-?\d+)/)[1]), x2 = Number(e.enonce.match(/x_2=(-?\d+)/)[1]); const g = (x) => val(fe, x);
            const att = g(x1) > g(x2) ? '\\gt' : '\\lt'; if (!F.includes(att) || (e.reponse.includes('>') ? '\\gt' : '\\lt') !== att) faux(e, 'symbole ' + F); compte(id.slice(0, 4) + id[5]);
          }
          else if (/^17\.6 c/.test(id)) {
            const op = /x\^2\\lt/.test(e.enonce) ? 'lt' : 'gt'; const morceaux = parseIv(F);
            for (let x = 0; x <= 6; x += 0.01) { const sat = op === 'lt' ? x * x < x - 1e-12 : x * x > x + 1e-12; if (dans(x, morceaux) !== sat && Math.abs(x - 1) > 1e-9) { faux(e, 'inequation x=' + x.toFixed(2) + ' ' + F); break; } }
            if (dans(0, morceaux)) faux(e, '0 solution a tort'); if (dans(1, morceaux)) faux(e, '1 solution a tort'); compte('17.6c' + op);
          }
          else if (/^17\.6 d/.test(id)) {
            const P = Number(e.enonce.match(/demi-périmètre \\\((\d+)\\\)/)[1]); let best = -1, bx = 0; for (let x = 0; x <= P; x += 0.01) { const a = x * (P - x); if (a > best) { best = a; bx = x; } }
            const m = F.replace(/\\left|\\right|\\,/g, '').match(/^\((\d+);(\d+)\)$/); if (!proche(bx, Number(m[1]), 0.011) || !proche(best, Number(m[2]), 0.01)) faux(e, 'optimum ' + F); compte('17.6d');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
