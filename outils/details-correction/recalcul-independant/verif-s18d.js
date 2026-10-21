// Verification independante des details de Seconde 18 (statistiques) : tout est recalcule a partir de l'enonce affiche
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 300);
const FICHE = process.argv[3] || 'cahiers/seconde/cahier-6/fiche-18.html';
(async () => {
  const s = http.createServer((req, res) => { const f = path.join(RACINE, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0, '127.0.0.1');
  await new Promise((r) => s.on('listening', r));
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${s.address().port}/${FICHE}`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof exercices !== 'undefined' && window.math && document.querySelector('.question'), null, { timeout: 40000 });
  const r = await p.evaluate((N) => {
    const nettoyer = (tex) => String(tex).replace(/\\\(|\\\)/g, '').replace(/\{,\}/g, '.').replace(/\\left|\\right/g, '').replace(/\\times/g, '*').replace(/\\,/g, '').replace(/\\%/g, '').replace(/\\text\{[^{}]*\}/g, '');
    const toMath = (tex) => { let t = nettoyer(tex); for (let i = 0; i < 8; i++) t = t.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\^\{([^{}]*)\}/g, '^($1)'); return t.replace(/\|([^|]*)\|/g, 'abs($1)').replace(/[{}]/g, ''); };
    const val = (tex) => math.evaluate(toMath(tex));
    const defauts = [], stats = {}; const compte = (k) => { stats[k] = (stats[k] || 0) + 1; };
    const faux = (e, m) => { if (defauts.length < 14) defauts.push(e.id + ' : ' + m + ' | ' + String(e.enonce).replace(/<svg[\s\S]*?<\/svg>/g, '[figure]').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 100)); };
    const proche = (a, c, tol = 1e-9) => Math.abs(a - c) <= tol;
    const moy = (v) => v.reduce((a, x) => a + x, 0) / v.length;
    const med = (v) => { const t = [...v].sort((a, b) => a - b), n = t.length; return n % 2 ? t[(n - 1) / 2] : (t[n / 2 - 1] + t[n / 2]) / 2; };
    const q = (v, k) => { const t = [...v].sort((a, b) => a - b); return t[Math.ceil(t.length * k / 4) - 1]; };
    const nombres = (txt) => [...String(txt).matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
    const liste = (enonce) => { const m = String(enonce).match(/\\\(([-\d\\,;]+)\\\)/); return m[1].split('\\,;\\,').map(Number); };
    const tuple = (F) => F.replace(/\\left|\\right|\\,/g, '').replace(/^\(|\)$/g, '').split(';').map((z) => val(z));
    const tableau = (enonce) => { const rows = [...String(enonce).matchAll(/<tr>(.*?)<\/tr>/g)].map((m) => [...m[1].matchAll(/\\\((.*?)\\\)/g)].map((z) => z[1])); return rows; };
    const attr = (enonce, nom) => String(enonce).match(new RegExp(nom + '="([^"]*)"'))[1];
    for (let t = 0; t < N; t++) {
      const ex = genererExercices();
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, L = D.lignes;
        try {
          if (/^18\.1 /.test(id)) {
            const m = e.enonce.match(/^(-?\d*)x(?:([+-]\d+))?\\(gt|geqslant|lt|leqslant)(-?\d+)$/); const a = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]), b = m[2] ? Number(m[2]) : 0, c = Number(m[4]), op = m[3];
            const x0 = (c - b) / a; const flip = a < 0; const strict = op === 'gt' || op === 'lt'; const sup = (op === 'gt' || op === 'geqslant') !== flip;
            const attendu = sup ? `[${x0}\\,;\\,+\\infty[` : `]-\\infty\\,;\\,${x0}]`; const attendu2 = (strict ? attendu.replace('[', ']').replace(/\]$/, '[') : attendu);
            const calc = sup ? `${strict ? ']' : '['}${x0}\\,;\\,+\\infty[` : `]-\\infty\\,;\\,${x0}${strict ? '[' : ']'}`;
            if (F !== calc) faux(e, 'intervalle ' + F + ' attendu ' + calc); compte('18.1');
          }
          else if (/^18\.2 /.test(id)) { const m = e.enonce.match(/initiale \\\((\d+)\\\), valeur finale \\\((\d+(?:\.\d+)?)\\\)/); const t2 = (Number(m[2]) - Number(m[1])) / Number(m[1]) * 100; if (!proche(t2, val(F.replace(/^\+/, '')), 1e-9) || !proche(t2, e.reponsePourcent, 1e-9)) faux(e, 'taux ' + F); compte('18.2'); }
          else if (/^18\.3 [abc]/.test(id)) { const v = liste(e.enonce), r = tuple(F); if (!proche(r[0], moy(v)) || !proche(r[1], med(v))) faux(e, 'moy/med ' + F); compte('18.3' + id[5]); }
          else if (/^18\.3 d/.test(id)) { const M = Number(e.enonce.match(/moyenne \\\((\d+)\\\)/)[1]), c4 = nombres(e.enonce.match(/sont \\\((.*?)\\\)/)[1].replace(/\\,;\\,/g, ' ')); const x = 5 * M - c4.reduce((a, z) => a + z, 0); if (!proche(x, val(F)) || !proche(x, Number(e.reponse))) faux(e, 'cinquieme'); compte('18.3d'); }
          else if (/^18\.4 /.test(id)) {
            const v = liste(e.enonce.match(/série suivante : (\\\(.*?\\\))/) ? e.enonce.match(/série suivante : (\\\(.*?\\\))/)[1] : e.enonce), r = tuple(F);
            if (id === '18.4 c)') { if (r[0] !== q(v, 3) - q(v, 1)) faux(e, 'iqr'); } else if (id === '18.4 d)') { if (r[0] !== Math.max(...v) - Math.min(...v) || r[1] !== q(v, 3) - q(v, 1)) faux(e, 'etendue/iqr'); } else if (r[0] !== q(v, 1) || r[1] !== q(v, 3)) faux(e, 'quartiles');
            const rg = L.filter((l) => /donc le rang est/.test(l)).map((l) => { const mm = l.match(/(\d+) \\text\{ donc le rang est \} (\d+)$/); return mm ? [l, Number(mm[2])] : null; });
            if (rg.length !== 2 || rg.some((x) => !x)) faux(e, 'lignes de rang'); else if (rg[0][1] !== Math.ceil(v.length / 4) || rg[1][1] !== Math.ceil(3 * v.length / 4)) faux(e, 'rangs'); compte('18.4' + id[5]);
          }
          else if (/^18\.5 [ab]/.test(id)) {
            const T = tableau(e.enonce), vals = T[0].map(Number), eff = T[1].map(Number); const m = vals.reduce((a, x, i) => a + x * eff[i], 0) / eff.reduce((a, x) => a + x, 0);
            if (!proche(m, val(F)) || !proche(m, val(e.reponse))) faux(e, 'moyenne ponderee'); compte('18.5' + id[5]);
          }
          else if (/^18\.5 c/.test(id)) {
            const T = tableau(e.enonce), vals = T[0].map(Number), fr = T[1].map((z) => val(z)); const m = vals.reduce((a, x, i) => a + x * fr[i], 0);
            if (!proche(m, val(F)) || !proche(fr.reduce((a, x) => a + x, 0), 1)) faux(e, 'moyenne frequences'); compte('18.5c');
          }
          else if (/^18\.5 d/.test(id)) {
            const T = tableau(e.enonce), vals = T[0].map(Number), eff = T[1]; const M = val(e.enonce.match(/vaut \\\((.*?)\\\)/)[1]);
            const connus = eff.slice(0, 3).map(Number); const S0 = connus.reduce((a, x, i) => a + x * vals[i], 0), N0 = connus.reduce((a, x) => a + x, 0), V = vals[3];
            const x = (M * N0 - S0) / (V - M); if (!proche(x, val(F), 1e-7) || !proche(x, Number(e.reponse), 1e-7) || Math.abs(x - Math.round(x)) > 1e-7) faux(e, 'effectif manquant ' + x); compte('18.5d');
          }
          else if (/^18\.6 a/.test(id)) { const n = [...e.enonce.matchAll(/\\\((\d+)\\\) valeurs a pour moyenne \\\((\d+)\\\)/g)].map((m) => [Number(m[1]), Number(m[2])]); const m = (n[0][0] * n[0][1] + n[1][0] * n[1][1]) / (n[0][0] + n[1][0]); if (!proche(m, val(F))) faux(e, 'reunion'); compte('18.6a'); }
          else if (/^18\.6 b/.test(id)) { const v = liste(e.enonce), m = moy(v), V = moy(v.map((x) => (x - m) ** 2)); if (!proche(Math.sqrt(V), val(F))) faux(e, 'ecart type'); compte('18.6b'); }
          else if (/^18\.6 c/.test(id)) { const m = e.enonce.match(/moyenne \\\((\d+)\\\) et écart type \\\((\d+)\\\).*par \\\((-?\d+)\\\), puis on ajoute \\\((-?\d+)\\\)/), M = Number(m[1]), S = Number(m[2]), k = Number(m[3]), c = Number(m[4]); const r = tuple(F); if (r[0] !== k * M + c || r[1] !== Math.abs(k) * S) faux(e, 'transformation'); compte('18.6c'); }
          else if (/^18\.6 d/.test(id)) { const v = liste(e.enonce), c = Number(e.enonce.match(/ajoute \\\((-?\d+)\\\) à chacune/) ? e.enonce.match(/ajoute \\\((-?\d+)\\\) à chacune/)[1] : e.enonce.match(/On ajoute \\\((-?\d+)\\\)/)[1]); const w = v.map((x) => x + c), r = tuple(F); if (r[0] !== med(w) || r[1] !== q(w, 3) - q(w, 1)) faux(e, 'translation'); compte('18.6d'); }
          else if (/^18\.7 /.test(id)) {
            const vals = attr(e.enonce, 'data-valeurs').split(',').map(Number), eff = attr(e.enonce, 'data-effectifs').split(',').map(Number); const serie = []; vals.forEach((v, i) => { for (let k = 0; k < eff[i]; k++) serie.push(v); });
            const r = tuple(F); if (!proche(r[0], moy(serie)) || r[1] !== Math.max(...vals) - Math.min(...vals) || !proche(r[2], med(serie))) faux(e, 'batons ' + F); compte('18.7');
          }
          else if (/^18\.8 /.test(id)) {
            const pc = attr(e.enonce, 'data-pourcentages').split(',').map(Number), tot = Number(attr(e.enonce, 'data-total')), vals = attr(e.enonce, 'data-valeurs').split(',').map(Number);
            const m = e.enonce.match(/valeurs \\\((\d+)\\\) et \\\((\d+)\\\), puis le pourcentage associé à la valeur \\\((\d+)\\\).*vaut \\\((\d+)\\\)/); const i1 = vals.indexOf(Number(m[1])), i2 = vals.indexOf(Number(m[2])), ic = vals.indexOf(Number(m[3]));
            const r = tuple(F); if (!proche(r[0], pc[i1] * tot / 100) || !proche(r[1], pc[i2] * tot / 100) || !proche(r[2], pc[ic]) || !proche(Number(m[4]) / tot * 100, pc[ic])) faux(e, 'circulaire ' + F); compte('18.8');
          }
          else if (/^18\.9 /.test(id)) {
            const boites = [...e.enonce.matchAll(/data-min="(\d+)" data-q1="(\d+)" data-mediane="(\d+)" data-q3="(\d+)" data-max="(\d+)"/g)].map((m) => m.slice(1).map(Number)); const r = tuple(F);
            if (id === '18.9 a)') { const [mi, q1, me, q3, ma] = boites[0]; if (r[0] !== ma - mi || r[1] !== q3 - q1 || r[2] !== me) faux(e, 'boite'); }
            else { const [a, bb] = boites; if (r[0] !== a[2] || r[1] !== a[3] - a[1] || r[2] !== bb[2] || r[3] !== bb[3] - bb[1]) faux(e, 'boites'); }
            compte('18.9');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
