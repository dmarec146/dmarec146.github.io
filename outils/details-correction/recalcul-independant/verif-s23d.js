// Verification independante des details de Seconde 23 (vecteurs en coordonnees) : tout est recalcule a partir de l'enonce affiche
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 300);
const FICHE = process.argv[3] || 'cahiers/seconde/cahier-8/fiche-23.html';
(async () => {
  const s = http.createServer((req, res) => { const f = path.join(RACINE, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0, '127.0.0.1');
  await new Promise((r) => s.on('listening', r));
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${s.address().port}/${FICHE}`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof exercices !== 'undefined' && window.math && document.querySelector('.question'), null, { timeout: 40000 });
  const r = await p.evaluate((N) => {
    const defauts = [], stats = {}; const compte = (k) => { stats[k] = (stats[k] || 0) + 1; };
    const faux = (e, m) => { if (defauts.length < 14) defauts.push(e.id + ' : ' + m + ' | ' + String(e.enonce).replace(/<svg[\s\S]*?<\/svg>/g, '[figure]').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 110)); };
    const proche = (a, c, tol = 1e-9) => Math.abs(a - c) <= tol;
    const mj = (t) => { let u = String(t).replace(/\\left|\\right|\\,/g, '').replace(/\{,\}/g, '.').replace(/\\times/g, '*').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/(\d)sqrt/g, '$1*sqrt'); for (let i = 0; i < 4; i++) u = u.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))'); return u; };
    const val = (t, sc) => math.evaluate(mj(t), sc || {});
    const point = (txt, nom) => { const re = new RegExp(nom + '(?:\\\\left)?\\(([^;]*?);(.*?)(?:\\\\right)?\\)(?=\\\\\\)|,| et |\\.|:|$|\\s)'); const m = String(txt).match(re); if (!m) throw new Error('point ' + nom + ' introuvable'); return [m[1].trim(), m[2].replace(/\\right$/, '').trim()].map((z) => val(z)); };
    const tuple = (F) => F.replace(/\\left|\\right|\\,/g, '').replace(/^\(|\)$/g, '').split(';').map((z) => val(z));
    // coefficient (entier, fraction, -, vide) devant \overrightarrow{nom} ou \overrightarrow{x} dans une combinaison
    const termes = (txt) => [...String(txt).replace(/\\\(|\\\)/g, '').matchAll(/([+-]?)(\\dfrac\{\d+\}\{\d+\}|\d+)?\\overrightarrow\{([A-Za-z]+)\}/g)].map((m) => ({ c: (m[1] === '-' ? -1 : 1) * (m[2] ? val(m[2]) : 1), nom: m[3] }));
    for (let t = 0; t < N; t++) {
      const ex = genererExercices(); const par = (id) => ex.find((x) => x.id === id);
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (/^23\.1 /.test(id)) { const v = val(tx); if (!proche(v, val(F)) || !proche(v, math.evaluate(e.reponse))) faux(e, 'demis ' + F); compte('23.1'); }
          else if (/^23\.2 a/.test(id)) { const v = val(tx.replace(/\^2/g, '^2')); if (!proche(v, val(F)) || !proche(v, math.evaluate(e.reponse))) faux(e, 'carres ' + F); compte('23.2a'); }
          else if (/^23\.2 b/.test(id)) { const n = Number(tx.match(/\\sqrt\{(\d+)\}/)[1]); if (!proche(Math.sqrt(n), val(F)) || !/^\d+\\sqrt\{\d+\}$/.test(F)) faux(e, 'racine ' + F); const m = F.match(/^(\d+)\\sqrt\{(\d+)\}$/); if (Number(m[1]) ** 2 * Number(m[2]) !== n) faux(e, 'forme racine'); compte('23.2b'); }
          else if (/^23\.3 /.test(id)) { const v = lecture22_3['uvw'.indexOf(tx.match(/overrightarrow\{(\w)\}/)[1])], r = tuple(F); if (!proche(r[0], v.dx) || !proche(r[1], v.dy)) faux(e, 'lecture ' + F); compte('23.3'); }
          else if (/^23\.4 /.test(id)) {
            const nom = tx.match(/overrightarrow\{([A-Z])([A-Z])\}/), P1 = point(tx, nom[1]), P2 = point(tx, nom[2]), r = tuple(F);
            if (!proche(r[0], P2[0] - P1[0]) || !proche(r[1], P2[1] - P1[1])) faux(e, 'vecteur par points ' + F); compte('23.4');
          }
          else if (/^23\.5 [abc]/.test(id)) {
            const tm = termes(tx.split(/,\s*avec/)[0]), reste = tx.split(/,\s*avec/)[1]; const coord = {}; for (const nm of ['u', 'v', 'w']) { try { coord[nm] = point(reste, '\\\\overrightarrow\\{' + nm + '\\}'); } catch (er) { /* absent */ } }
            let x = 0, y = 0; for (const q of tm) { x += q.c * coord[q.nom][0]; y += q.c * coord[q.nom][1]; } const r = tuple(F);
            if (!proche(r[0], x) || !proche(r[1], y)) faux(e, 'combinaison ' + F + ' attendu ' + x + ';' + y); compte('23.5' + id[5]);
          }
          else if (/^23\.5 d/.test(id)) {
            const tm = termes(tx.split(/,\s*avec/)[0]), reste = tx.split(/,\s*avec/)[1], A = point(reste, 'A'), B = point(reste, 'B'), C = point(reste, 'C'); const V = { AB: [B[0] - A[0], B[1] - A[1]], AC: [C[0] - A[0], C[1] - A[1]] };
            let x = 0, y = 0; for (const q of tm) { x += q.c * V[q.nom][0]; y += q.c * V[q.nom][1]; } const r = tuple(F);
            if (!proche(r[0], x) || !proche(r[1], y)) faux(e, 'combinaison AB AC ' + F); compte('23.5d');
          }
          else if (/^23\.6 [ab]/.test(id)) { const A = point(tx, 'A'), B = point(tx, 'B'); const v = Math.hypot(B[0] - A[0], B[1] - A[1]); if (!proche(v, val(F), 1e-9) || !proche(v, val(e.reponse), 1e-9)) faux(e, 'norme ' + F); compte('23.6' + id[5]); }
          else if (/^23\.6 c/.test(id)) { const u = point(tx.split(':')[0], '\\\\overrightarrow\\{u\\}'); const v = Math.hypot(u[0], u[1]); if (!proche(v, val(F), 1e-9) || !proche(v, val(e.reponse), 1e-9)) faux(e, 'norme u ' + F); compte('23.6c'); }
          else if (/^23\.6 d/.test(id)) { const A = point(tx, 'A'), B = point(tx, 'B'), C = point(tx, 'C'); const tm = termes(tx.split('calculer')[1]); const V = { AB: [B[0] - A[0], B[1] - A[1]], AC: [C[0] - A[0], C[1] - A[1]] }; let x = 0, y = 0; for (const q of tm) { x += q.c * V[q.nom][0]; y += q.c * V[q.nom][1]; } const v = Math.hypot(x, y); if (!proche(v, val(F), 1e-9) || !proche(v, val(e.reponse), 1e-9)) faux(e, 'norme combinaison ' + F); compte('23.6d'); }
          else if (/^23\.7 a/.test(id)) {
            const c = e.contexteTexte, A = point(c, 'A'), B = point(c, 'B'), C = point(c, 'C'); const k = termes(tx).find((z) => z.nom === 'BC').c; const r = tuple(F);
            if (!proche(r[0], A[0] + k * (C[0] - B[0])) || !proche(r[1], A[1] + k * (C[1] - B[1]))) faux(e, 'D ' + F); compte('23.7a');
          }
          else if (/^23\.7 b/.test(id)) {
            const c = par('23.7 a)').contexteTexte, A = point(c, 'A'), B = point(c, 'B'), C = point(c, 'C'); const tm = termes(tx.split('tel que')[1].replace('Calculer les coordonnées de E.', '')); const V = { AB: [B[0] - A[0], B[1] - A[1]], AC: [C[0] - A[0], C[1] - A[1]] };
            let x = A[0], y = A[1]; for (const q of tm.filter((z) => z.nom !== 'AE')) { x += q.c * V[q.nom][0]; y += q.c * V[q.nom][1]; } const r = tuple(F);
            if (!proche(r[0], x) || !proche(r[1], y)) faux(e, 'E ' + F); compte('23.7b');
          }
          else if (id === '23.8 a)') { const A = [Math.random() * 9, Math.random() * 9], Bb = [Math.random() * 9, Math.random() * 9], Cc = [Math.random() * 9, Math.random() * 9], G = [(A[0] + Bb[0] + Cc[0]) / 3, (A[1] + Bb[1] + Cc[1]) / 3]; const tm = termes(F); const x = tm.reduce((a, q) => a + q.c * ({ AB: Bb[0] - A[0], AC: Cc[0] - A[0] })[q.nom], 0); if (!proche(x, G[0] - A[0], 1e-9) || tm.length !== 2) faux(e, 'AG ' + F); compte('23.8a'); }
          else if (id === '23.8 b)') { const c = par('23.8 a)').contexteTexte, A = point(c, 'A'), B = point(c, 'B'), C = point(c, 'C'); const r = tuple(F); if (!proche(r[0], (A[0] + B[0] + C[0]) / 3) || !proche(r[1], (A[1] + B[1] + C[1]) / 3)) faux(e, 'G ' + F); compte('23.8b'); }
          else if (/^23\.9 /.test(id)) {
            const c = par('23.9 a)').contexteTexte, O = point(c, '\\\\Omega'), rt = c.match(/r=(.*?)\\\)/)[1], r2 = Math.pow(val(rt), 2); const nom = id === '23.9 a)' ? 'M' : 'N', P = point(tx, nom);
            const d2 = (P[0] - O[0]) ** 2 + (P[1] - O[1]) ** 2, sur = Math.abs(d2 - r2) < 1e-9;
            if (F !== (sur ? 'oui' : 'non') || e.reponseOuiNon !== sur) faux(e, 'cercle ' + F + ' attendu ' + sur); compte('23.9');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
