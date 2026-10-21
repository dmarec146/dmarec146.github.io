// Verification independante des details de Seconde 15 : tout est recalcule a partir de l'enonce et des fonctions de la fiche
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 300);
const FICHE = process.argv[3] || 'cahiers/seconde/cahier-5/fiche-15.html';
(async () => {
  const s = http.createServer((req, res) => { const f = path.join(RACINE, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0, '127.0.0.1');
  await new Promise((r) => s.on('listening', r));
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${s.address().port}/${FICHE}`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof exercices !== 'undefined' && window.math && document.querySelector('.question'), null, { timeout: 40000 });
  const r = await p.evaluate((N) => {
    const nettoyer = (tex) => String(tex).replace(/\\\(|\\\)/g, '').replace(/\{,\}/g, '.').replace(/(\d),(\d)/g, '$1.$2').replace(/\\left|\\right/g, '').replace(/\\times/g, '*').replace(/\\,/g, '').replace(/\\text\{[^{}]*\}/g, '');
    const toMath = (tex) => { let t = nettoyer(tex);
      for (let i = 0; i < 8; i++) t = t.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
      t = t.replace(/\|([^|]*)\|/g, 'abs($1)').replace(/[{}]/g, '').replace(/(\d)x/g, '$1*x').replace(/\)x/g, ')*x').replace(/(\d|\))\(/g, '$1*(').replace(/x\(/g, 'x*(');
      return t; };
    const val = (tex, x) => math.evaluate(toMath(tex), { x });
    const defauts = [], stats = {}; const compte = (k) => { stats[k] = (stats[k] || 0) + 1; };
    const faux = (e, m) => { if (defauts.length < 14) defauts.push(e.id + ' : ' + m + ' | ' + String(e.enonce).replace(/\s+/g, ' ').slice(0, 100)); };
    const proche = (a, c, tol = 1e-9) => Math.abs(a - c) <= tol;
    const polys = (expr) => [-3, -1, 0, 2, 5, 1.5].map((x) => val(expr, x));
    const parseIv = (F) => F === '\\emptyset' ? [] : F.split(/\\ \\cup\\ /).map((z) => { const m = z.match(/^([\[\]])(.+?)\\,;\\,(.+?)([\[\]])$/); const v = (t) => /\\infty/.test(t) ? (t.includes('-') ? -Infinity : Infinity) : val(t, 0); return { ib: m[1] === '[', bas: v(m[2]), haut: v(m[3]), ih: m[4] === ']' }; });
    // verifie un ensemble d'intervalles lus contre un predicat sat(x) sur [xmin;xmax] (hors des 0,12 autour des bornes)
    const verifIntervalles = (e, F, f, sat, xmin, xmax) => {
      const morceaux = parseIv(F);
      for (let x = xmin; x <= xmax + 1e-9; x += 0.011) {
        const dedans = morceaux.some((m) => x >= m.bas - 1e-9 && x <= m.haut + 1e-9);
        const loin = morceaux.every((m) => Math.abs(x - m.bas) > 0.12 && Math.abs(x - m.haut) > 0.12);
        if (loin && dedans !== sat(x)) { faux(e, 'ensemble faux en x=' + x.toFixed(3) + ' : ' + F); return false; }
      }
      return true;
    };
    for (let t = 0; t < N; t++) {
      const ex = genererExercices();
      const PE = paramsGraphiqueEq, fe = fonctionGraphiqueEq(PE), PD = paramsGraphiqueDeux, { f: fd, g: gd } = fonctionsGraphiqueDeux(PD);
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, L = D.lignes;
        try {
          if (/^15\.1 /.test(id)) { const v = val(e.enonce, 0); if (!proche(v, val(F, 0)) || !proche(v, Number(e.reponse))) faux(e, 'calcul'); compte('15.1'); }
          else if (/^15\.2 /.test(id)) {
            const a = polys(e.enonce), c = polys(F), r = polys(e.reponse);
            if (!a.every((v, i) => proche(v, c[i], 1e-7) && proche(v, r[i], 1e-7))) faux(e, 'developpement ' + F); compte('15.2');
          }
          else if (/^15\.3 [abc]/.test(id)) {
            const k = val(e.enonce.match(/f\(x\)=(.+?)\\\)/)[1], 0);
            const vrais = []; const pas = 0.0005; let prev = fe(PE.xmin) - k; if (Math.abs(prev) < 1e-9) vrais.push(PE.xmin);
            for (let x = PE.xmin + pas; x <= PE.xmax + 1e-9; x += pas) { const y = fe(x) - k; if (prev * y < 0) { let lo = x - pas, hi = x; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if ((fe(lo) - k) * (fe(m) - k) <= 0) hi = m; else lo = m; } vrais.push((lo + hi) / 2); } else if (Math.abs(y) < 1e-9 && vrais.every((v) => Math.abs(v - x) > 0.01)) vrais.push(x); prev = y; }
            if (PE.degre === 2 && Math.abs(k - PE.r) < 1e-9) vrais.splice(0, vrais.length, PE.p);
            const els = F.replace(/^\\\{|\\\}$/g, '').split('\\,;\\,').map((z) => val(z, 0));
            const uniques = vrais.filter((v, i) => i === 0 || v - vrais[i - 1] > 1e-3);
            if (els.length !== uniques.length || !els.every((v, i) => Math.abs(v - uniques[i]) <= 0.06)) faux(e, 'racines ' + F + ' vs ' + uniques.map((v) => v.toFixed(3)).join(','));
            compte('15.3' + id[5]);
          }
          else if (/^15\.3 [def]/.test(id)) {
            const m = e.enonce.match(/\\(gt|geqslant|lt|leqslant)(-?[\d,]+)\\\)/); const k = val(m[2], 0), op = m[1];
            const sat = (x) => { const y = fe(x); return op === 'gt' ? y > k : op === 'geqslant' ? y >= k : op === 'lt' ? y < k : y <= k; };
            verifIntervalles(e, F, fe, sat, PE.xmin, PE.xmax); compte('15.3' + id[5]);
          }
          else if (/^15\.4 /.test(id)) {
            const m = e.enonce.match(/\\\((-?[\d,]+)\\(lt|leqslant)\\,f\(x\)\\(lt|leqslant)(-?[\d,]+)\\\)/); const k1 = val(m[1], 0), k2 = val(m[4], 0), large = m[2] === 'leqslant';
            if (m[2] !== m[3]) faux(e, 'sens mixtes');
            const sat = (x) => { const y = fe(x); return large ? y >= k1 && y <= k2 : y > k1 && y < k2; };
            verifIntervalles(e, F, fe, sat, PE.xmin, PE.xmax); compte('15.4' + id[5]);
          }
          else if (/^15\.5 a/.test(id)) {
            const xs = L[2].split(' \\text{ ou } ').map((z) => val(z.replace(/^x = /, ''), 0));
            if (xs.length !== PD.racines.length || !xs.every((x, i) => proche(x, PD.racines[i]) && proche(fd(x), gd(x), 1e-6)) || !proche(val(F, 0), PD.racines[0])) faux(e, 'intersections'); compte('15.5a');
          }
          else if (/^15\.5 b|^15\.7 c/.test(id)) {
            const dessous = /^15\.5 b/.test(id) ? true : /\\lt0/.test(e.enonce);
            verifIntervalles(e, F, fe, (x) => dessous ? fd(x) < gd(x) : fd(x) > gd(x), PD.xmin, PD.xmax); compte(id.slice(0, 4) + id[5]);
          }
          else if (/^15\.6 /.test(id)) {
            const P = e.paramsVar, f = fonctionGraphiqueVar(P), xs = e.seuils.map((s) => s.x);
            const corps = F.replace(/^\\(?:small|scriptsize)\s*\\begin\{array\}\{[^}]*\}/, '').replace(/\\end\{array\}\s*$/, '');
            const lg = corps.split('\\\\ \\hline ').map((r) => r.split(' & ').map((c) => c.trim()));
            const k = xs.length; if (lg[0].length !== 2 * k) faux(e, 'colonnes');
            for (let j = 0; j < k; j++) { const x = val(lg[0][1 + 2 * j], 0), y = val(lg[1][1 + 2 * j], 0); if (!proche(x, xs[j]) || !proche(y, f(x))) faux(e, 'valeur ' + j); }
            for (let j = 0; j < k - 1; j++) {
              const a = val(lg[0][1 + 2 * j], 0), c = val(lg[0][3 + 2 * j], 0); let monotone = true; const croiss = f(c) > f(a), fl = lg[1][2 + 2 * j];
              if ((fl === '\\nearrow') !== croiss) faux(e, 'fleche ' + j);
              for (let x = a; x < c - 0.01; x += 0.01) if ((f(x + 0.01) - f(x) > 1e-9) !== croiss) { monotone = false; break; }
              if (!monotone) faux(e, 'non monotone sur l intervalle ' + j);
            }
            // extrema reels : la derivee numerique change de signe en chaque seuil interieur
            for (let j = 1; j < k - 1; j++) { const x = xs[j]; if (!((f(x) - f(x - 0.01)) * (f(x + 0.01) - f(x)) <= 0)) faux(e, 'pas un extremum en ' + x); }
            compte('15.6');
          }
          else if (/^15\.7 a/.test(id)) {
            const m = e.enonce.match(/f\(x\)=(.+?)\\\), représentée/); const els = F.replace(/^\\\{|\\\}$/g, '').split('\\,;\\,').map((z) => val(z, 0));
            if (els.length !== 2 || !els.every((x) => proche(val(m[1].replace(/\(x\)/, 'x'), x), 0, 1e-9)) ) faux(e, 'racines ' + F); compte('15.7a');
          }
          else if (/^15\.7 b/.test(id)) {
            const pos = /\\gt0/.test(e.enonce);
            verifIntervalles(e, F, fe, (x) => pos ? fd(x) * gd(x) > 0 : fd(x) * gd(x) < 0, PD.xmin, PD.xmax);
            // tableau : signes de f, g et du produit sur chaque intervalle
            const T = L.find((l) => /\\begin\{array\}/.test(l)); const corps = T.replace(/^\\(?:tiny|scriptsize|small)\\begin\{array\}\{[^}]*\}/, '').replace(/\\end\{array\}\s*$/, '');
            const lg = corps.split('\\\\ \\hline ').map((r) => r.split(' & ').map((c) => c.trim())); const seuils = lg[0].slice(1).filter((_, i) => i % 2 === 0).map((z) => val(z, 0));
            for (let i = 0; i + 1 < seuils.length; i++) { const mid = (seuils[i] + seuils[i + 1]) / 2; const sf = lg[1][2 + 2 * i], sg = lg[2][2 + 2 * i], sp = lg[3][2 + 2 * i];
              if ((fd(mid) > 0 ? '+' : '-') !== sf || (gd(mid) > 0 ? '+' : '-') !== sg || (fd(mid) * gd(mid) > 0 ? '+' : '-') !== sp) { faux(e, 'signes du tableau, intervalle ' + i); break; } }
            compte('15.7b');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
