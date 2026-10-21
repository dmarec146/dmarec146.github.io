// Verification independante des details de Seconde 21 (vecteurs, repere : distances, milieux, natures de figures) : tout est recalcule a partir de l'enonce affiche
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 300);
const FICHE = process.argv[3] || 'cahiers/seconde/cahier-8/fiche-21.html';
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
    const mj = (t) => { let u = String(t).replace(/\\left|\\right|\\,/g, '').replace(/\{,\}/g, '.').replace(/\\times/g, '*').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)'); for (let i = 0; i < 4; i++) u = u.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))'); return u; };
    const val = (t, sc) => math.evaluate(mj(t), sc || {});
    // coordonnees « A(x ; y) » ou « A\left(x ; y\right) » dans un texte
    const point = (txt, nom) => { const re = new RegExp(nom + '(?:\\\\left)?\\(([^;]*?)(?:\\\\,)?;(?:\\\\,)?(.*?)(?:\\\\right)?\\)(?=\\\\\\)|,| et |\\.|$|\\s)'); const m = String(txt).match(re); if (!m) throw new Error('point ' + nom + ' introuvable'); return [m[1].replace(/\\right$/, '').trim(), m[2].replace(/\\right$/, '').trim()]; };
    const tuple = (F) => F.replace(/\\left|\\right|\\,/g, '').replace(/^\(|\)$/g, '').split(';');
    const fr = (t) => math.fraction(math.evaluate(mj(t)));
    const d2 = (P, Q) => math.add(math.square(math.subtract(P[0], Q[0])), math.square(math.subtract(P[1], Q[1])));
    const pt = (txt, nom) => point(txt, nom).map((z) => math.fraction(math.evaluate(mj(z))));
    for (let t = 0; t < N; t++) {
      const ex = genererExercices(); const par = (id) => ex.find((x) => x.id === id);
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (/^21\.1 /.test(id)) { const v = math.evaluate(tx.replace(/\^/g, '^')); if (!proche(v, val(F)) || !proche(v, Number(e.reponse))) faux(e, 'carres ' + F + ' attendu ' + v); compte('21.1'); }
          else if (/^21\.2 /.test(id)) { const v = Math.sqrt(Number(tx.match(/\\sqrt\{(\d+)\}/)[1])); if (!proche(v, val(F)) || !proche(v, val(e.reponse))) faux(e, 'racine ' + F); const n = Number(tx.match(/\\sqrt\{(\d+)\}/)[1]); const m = F.match(/^(\d+)\\sqrt\{(\d+)\}$/); if (!m || Number(m[1]) ** 2 * Number(m[2]) !== n) faux(e, 'forme racine'); compte('21.2'); }
          else if (/^21\.3 /.test(id)) { const r = tuple(F).map(Number); if (r[0] !== Number(e.pa) || r[1] !== Number(e.pb) || !r.every(Number.isInteger)) faux(e, 'lecture ' + F); compte('21.3'); }
          else if (/^21\.4 /.test(id)) { const A = point(tx, 'A').map(Number), B = point(tx, 'B').map(Number); const v = Math.hypot(B[0] - A[0], B[1] - A[1]); if (!proche(v, val(F), 1e-9) || !proche(v, val(e.reponse), 1e-9)) faux(e, 'distance ' + F + ' attendu ' + v); compte('21.4'); }
          else if (/^21\.5 [ab]/.test(id)) { const A = pt(tx, 'A'), B = pt(tx, 'B'); const r = tuple(F).map(fr); if (!math.equal(r[0], math.divide(math.add(A[0], B[0]), 2)) || !math.equal(r[1], math.divide(math.add(A[1], B[1]), 2))) faux(e, 'milieu ' + F); compte('21.5' + id[5]); }
          else if (/^21\.5 c/.test(id)) {
            const A = point(tx, 'A'), B = point(tx, 'B'); const r = tuple(F);
            for (const mv of [0.7, 2.3, -4]) { const f = (z) => val(z, { m: mv }); const att = [(f(A[0]) + f(B[0])) / 2, (f(A[1]) + f(B[1])) / 2]; if (!proche(att[0], f(r[0]), 1e-9) || !proche(att[1], f(r[1]), 1e-9)) { faux(e, 'milieu parametre ' + F); break; } }
            compte('21.5c');
          }
          else if (/^21\.5 d/.test(id)) { const A = pt(tx, 'A'), I = pt(tx, 'I'); const B = tuple(F).map(Number); if (!math.equal(math.fraction(B[0]), math.subtract(math.multiply(I[0], 2), A[0])) || !math.equal(math.fraction(B[1]), math.subtract(math.multiply(I[1], 2), A[1]))) faux(e, 'retrouver B ' + F); compte('21.5d'); }
          else if (/^21\.6 /.test(id)) {
            const c = par('21.6 a)').contexteTexte, A = pt(c, 'A'), B = pt(c, 'B'), C = pt(c, 'C');
            let v; if (id === '21.6 a)') v = math.equal(math.add(d2(A, B), d2(B, C)), d2(A, C)); else v = math.equal(d2(A, B), d2(B, C)) || math.equal(d2(B, C), d2(C, A)) || math.equal(d2(C, A), d2(A, B));
            if (F !== (v ? 'oui' : 'non') || e.reponseOuiNon !== v) faux(e, 'triangle ' + F + ' attendu ' + v); compte('21.6' + id[5]);
          }
          else if (/^21\.7 /.test(id)) {
            const c = par('21.7 a)').contexteTexte, A = pt(c, 'A'), B = pt(c, 'B'), C = pt(c, 'C'), Dd = pt(c, 'D'); let v;
            if (id === '21.7 a)') v = math.equal(math.add(A[0], C[0]), math.add(B[0], Dd[0])) && math.equal(math.add(A[1], C[1]), math.add(B[1], Dd[1]));
            else v = math.equal(d2(A, B), d2(B, C)) && math.equal(d2(B, C), d2(C, Dd)) && math.equal(d2(C, Dd), d2(Dd, A));
            if (F !== (v ? 'oui' : 'non') || e.reponseOuiNon !== v) faux(e, 'quadrilatere ' + F + ' attendu ' + v); compte('21.7' + id[5]);
          }
          else if (/^21\.8 a/.test(id)) {
            const A = pt(par('21.8 a)').contexteTexte, 'A'), M = pt(tx, 'M'); const am2 = d2(A, M), mh2 = math.square(M[1]); const v = math.equal(am2, mh2);
            if (F !== (v ? 'oui' : 'non') || e.reponseOuiNon !== v) faux(e, 'ensemble E ' + F + ' attendu ' + v); compte('21.8a');
          }
          else if (/^21\.8 b/.test(id)) {
            const A = pt(par('21.8 a)').contexteTexte, 'A'), x0 = math.fraction(Number(tx.match(/x=(-?\d+)/)[1])); const y = math.divide(math.add(math.square(math.subtract(x0, A[0])), math.square(A[1])), math.multiply(2, A[1]));
            if (!math.equal(y, fr(F)) || !math.equal(y, math.fraction(math.evaluate(e.reponse)))) faux(e, 'ordonnee ' + F + ' attendu ' + math.format(y)); const M = [x0, y]; if (!math.equal(d2(A, M), math.square(y))) faux(e, 'M pas dans E'); compte('21.8b');
          }
          else if (/^21\.9 /.test(id)) {
            const A = point(tx, 'A'), B = point(tx, 'B'), I = pt(tx, 'I');
            const lin = (z) => (z.trim() === 'm' ? [0, 1] : [Number(z), 0]);        // a + b m
            const eq = [0, 1].map((k) => { const a = lin(A[k]), bb = lin(B[k]); return [(a[0] + bb[0]) / 2 - I[k].valueOf(), (a[1] + bb[1]) / 2]; });  // c + d m = 0
            let ok = true, mv = null;
            for (const [c, dd] of eq) { if (Math.abs(dd) < 1e-12) { if (Math.abs(c) > 1e-9) ok = false; } else { const m = -c / dd; if (mv === null) mv = m; else if (Math.abs(mv - m) > 1e-9) ok = false; } }
            if (F !== (ok ? 'oui' : 'non') || e.reponseOuiNon !== ok) faux(e, 'milieu parametre oui/non ' + F + ' attendu ' + ok); compte('21.9');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
