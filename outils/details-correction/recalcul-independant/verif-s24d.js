// Verification independante des details de Seconde 24 (equations de droites) : tout est recalcule a partir de l'enonce affiche
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/seconde/cahier-8/fiche-24.html';
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
    const proche = (a, c, tol = 1e-9) => Math.abs(a - c) <= tol * (1 + Math.abs(a) + Math.abs(c));
    const mj = (t) => { let u = String(t).replace(/\\\(|\\\)/g, '').replace(/\\left|\\right|\\,/g, '').replace(/\{,\}/g, '.').replace(/\\times/g, '*').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)').replace(/\\div/g, '/'); for (let i = 0; i < 5; i++) u = u.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))'); return u.replace(/(\d)\(/g, '$1*(').replace(/\)\(/g, ')*('); };
    const val = (t, sc) => math.evaluate(mj(t), sc || {});
    // equation « lhs = rhs » en x, y : renvoie (a, b, c) avec a x + b y + c = lhs - rhs
    const coefs = (tex) => { const [g, d] = mj(tex).replace(/\s/g, '').split('='); const f = (x, y) => math.evaluate(g, { x, y, m: 0 }) - math.evaluate(d, { x, y, m: 0 }); const c = f(0, 0); return { a: f(1, 0) - c, b: f(0, 1) - c, c }; };
    const propo = (u, v) => Math.abs(u.a * v.b - u.b * v.a) < 1e-7 && Math.abs(u.a * v.c - u.c * v.a) < 1e-7 && Math.abs(u.b * v.c - u.c * v.b) < 1e-7 && (Math.abs(u.a) + Math.abs(u.b) + Math.abs(u.c)) > 1e-9;
    const equationDe = (txt) => { const m = String(txt).match(/\\\(((?:[^()]|\([^()]*\))*?=\s*0)\\\)/); return m && m[1]; };
    const point = (txt, nom) => { const re = new RegExp(nom + '(?:\\\\left)?\\(([^;]*?);(.*?)(?:\\\\right)?\\)(?=\\\\\\)|,| et |\\.|:|$|\\s)'); const m = String(txt).match(re); if (!m) throw new Error('point ' + nom + ' introuvable'); return [m[1].trim(), m[2].replace(/\\right$/, '').trim()].map((z) => val(z)); };
    const tuple = (F) => F.replace(/\\left|\\right|\\,/g, '').replace(/^\(|\)$/g, '').split(';').map((z) => val(z));
    // verifie que toute ligne « ... = 0 » en x et y (equation de droite) est proportionnelle a l'equation finale
    const lignesEq = (e, fin) => { for (const l of e.detail.lignes) { if (/\\text|\\overrightarrow/.test(l) || !/=\s*0$/.test(l) || !/x/.test(l) || !/y/.test(l)) continue; const t = l.replace(/^\\iff\s*/, ''); try { if (!propo(coefs(t), fin)) { faux(e, 'equation non proportionnelle : ' + l); return false; } } catch (er) { /* illisible */ } } return true; };
    for (let t = 0; t < N; t++) {
      const ex = genererExercices(); const par = (id) => ex.find((x) => x.id === id);
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (/^24\.1 /.test(id)) { const v = val(tx); if (!proche(v, val(F)) || !proche(v, math.evaluate(e.reponse))) faux(e, 'quotient ' + F); compte('24.1'); }
          else if (/^24\.2 /.test(id)) { const [g, d] = mj(tx).split('='); const f = (x) => math.evaluate(g, { x }) - math.evaluate(d, { x }); const x0 = -f(0) / (f(1) - f(0)); if (!proche(f(val(F)), 0, 1e-9) || !proche(x0, val(F)) || !proche(x0, math.evaluate(e.reponse))) faux(e, 'equation ' + F); compte('24.2' + id[5]); }
          else if (id === '24.3 a)') { const q = coefs(equationDe(tx)), u = tuple(F); if (!proche(u[0] * q.a - u[1] * -q.b, 0, 1e-9) || Math.abs(u[0]) + Math.abs(u[1]) === 0) faux(e, 'vecteur directeur (cart) ' + F); compte('24.3a'); }
          else if (id === '24.3 b)') { const m = val(tx.match(/y=(.*?)\\\)/)[1].replace(/x.*$/, '').replace(/^$/, '1').replace(/^-$/, '-1') || '1'); const q = coefs(tx.match(/\\\((y=.*?)\\\)/)[1]); const u = tuple(F); if (!proche(u[1] * q.b * -1, u[0] * q.a * 1 * -1 * -1 * 1 + 0, 1e-9) && false) faux(e, 'x'); const pente = -q.a / q.b; if (!proche(u[1], pente * u[0], 1e-9)) faux(e, 'vecteur directeur (reduite) ' + F); compte('24.3b'); }
          else if (id === '24.3 c)') { const A = point(tx, 'A'), B = point(tx, 'B'), u = tuple(F); if (!proche(u[0] * (B[1] - A[1]), u[1] * (B[0] - A[0])) || Math.abs(u[0]) + Math.abs(u[1]) === 0) faux(e, 'vecteur AB ' + F); compte('24.3c'); }
          else if (id === '24.3 d)') { const u = tuple(F); if (!proche(u[0] * e.vy, u[1] * e.vx)) faux(e, 'lecture ' + F); compte('24.3d'); }
          else if (/^24\.4 /.test(id)) {
            const q = coefs(equationDe(par('24.4 a)').contexteTexte));
            if (id === '24.4 a)' || id === '24.4 b)') { const P = point(tx, id[5] === 'a' ? 'A' : 'B'); const v = q.a * P[0] + q.b * P[1] + q.c, sur = Math.abs(v) < 1e-9; if (F !== (sur ? 'oui' : 'non') || e.reponseOuiNon !== sur) faux(e, 'appartenance ' + F + ' attendu ' + sur); }
            else if (id === '24.4 c)') { const k = Number(tx.match(/d'abscisse \\\((-?\d+)\\\)/)[1]); const y = -(q.a * k + q.c) / q.b; if (!proche(y, val(F)) || !proche(y, math.evaluate(e.reponse))) faux(e, 'ordonnee ' + F); }
            else { const k = Number(tx.match(/d'ordonnée \\\((-?\d+)\\\)/)[1]); const x = -(q.b * k + q.c) / q.a; if (!proche(x, val(F)) || !proche(x, math.evaluate(e.reponse))) faux(e, 'abscisse ' + F); }
            compte('24.4' + id[5]);
          }
          else if (/^24\.5 /.test(id)) {
            const q = coefs(equationDe(tx)), rhs = F.replace(/^\s*[xy]\s*=\s*/, '');
            if (/^x/.test(F)) { if (Math.abs(q.b) > 1e-9 || !proche(-q.c / q.a, val(rhs))) faux(e, 'x = c ' + F); }
            else for (const x of [-2.5, 0, 3.7]) { const y = val(rhs, { x }); if (!proche(q.a * x + q.b * y + q.c, 0, 1e-8)) faux(e, 'equation reduite ' + F); }
            compte('24.5' + id[5]);
          }
          else if (/^24\.6 [ab]/.test(id)) {
            const A = point(tx, 'A'), u = point(tx.replace(/\\overrightarrow\{u\}/, 'u'), 'u'), fin = coefs(F);
            if (!(proche(fin.a * u[0] + fin.b * u[1], 0, 1e-9) && proche(fin.a * A[0] + fin.b * A[1] + fin.c, 0, 1e-9)) || (fin.a < 0 || (fin.a === 0 && fin.b < 0))) faux(e, 'equation d ' + F); lignesEq(e, fin); compte('24.6' + id[5]);
          }
          else if (id === '24.6 c)') { const A = point(tx, 'A'), B = point(tx, 'B'), fin = coefs(F); if (!(proche(fin.a * (B[0] - A[0]) + fin.b * (B[1] - A[1]), 0, 1e-9) && proche(fin.a * A[0] + fin.b * A[1] + fin.c, 0, 1e-9)) || !Number.isInteger(fin.a) || !Number.isInteger(fin.b) || !Number.isInteger(fin.c)) faux(e, 'equation (AB) ' + F); lignesEq(e, fin); compte('24.6c'); }
          else if (id === '24.6 d)') { const q = coefs(tx.match(/\\\((y=.*?)\\\)/)[1]), fin = coefs(F); if (!propo(q, fin) || !Number.isInteger(fin.a) || !Number.isInteger(fin.b) || !Number.isInteger(fin.c)) faux(e, 'equation depuis reduite ' + F); lignesEq(e, fin); compte('24.6d'); }
          else if (id === '24.7 a)') { const [e1, e2] = [...tx.matchAll(/\\\(([^\\]*?=0)\\\)/g)].map((m) => coefs(m[1])); const para = Math.abs(e1.a * e2.b - e2.a * e1.b) < 1e-9; if (F !== (para ? 'oui' : 'non') || e.reponseOuiNon !== para) faux(e, 'paralleles (cart) ' + F); compte('24.7a'); }
          else if (id === '24.7 b)') { const e1 = coefs([...tx.matchAll(/\\\(([^\\]*?=0)\\\)/g)][0][1]), e2 = coefs(tx.match(/\\\((y=.*?)\\\)/)[1]); const para = Math.abs(e1.a * e2.b - e2.a * e1.b) < 1e-9; if (F !== (para ? 'oui' : 'non') || e.reponseOuiNon !== para) faux(e, 'paralleles (mixte) ' + F); compte('24.7b'); }
          else if (id === '24.7 c)') { const e1 = coefs([...tx.matchAll(/\\\(([^\\]*?=0)\\\)/g)][0][1]), A = point(tx, 'A'), B = point(tx, 'B'); const para = Math.abs(e1.a * (B[0] - A[0]) + e1.b * (B[1] - A[1])) < 1e-9; if (F !== (para ? 'oui' : 'non') || e.reponseOuiNon !== para) faux(e, 'paralleles (AB) ' + F); compte('24.7c'); }
          else if (/^24\.8 /.test(id)) {
            const ms = [...tx.matchAll(/\\\(d_[12]\\\) : \\\((.*?)\\\)/g)].map((m) => m[1]); const e1 = coefs(ms[0]), e2 = coefs(ms[1]); const det = e1.a * e2.b - e2.a * e1.b;
            if (Math.abs(det) < 1e-9) { if (F !== "\\text{aucun point d'intersection}" || !e.aucunPoint) faux(e, 'aucun point ' + F); }
            else { const x = (-e1.c * e2.b + e2.c * e1.b) / det, y = (-e1.a * e2.c + e2.a * e1.c) / det, r = tuple(F); if (!proche(r[0], x) || !proche(r[1], y) || !proche(x, math.evaluate(e.pa)) || !proche(y, math.evaluate(e.pb))) faux(e, 'intersection ' + F + ' attendu ' + x + ';' + y); }
            compte('24.8' + id[5]);
          }
          else if (/^24\.9 /.test(id)) {
            const c = par('24.9 a)').contexteTexte, A = point(c, 'A'), B = point(c, 'B'), C = point(c, 'C');
            if (id === '24.9 a)') { const fin = coefs(F), I = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2]; if (!(proche(fin.a * A[0] + fin.b * A[1] + fin.c, 0) && proche(fin.a * I[0] + fin.b * I[1] + fin.c, 0))) faux(e, 'mediane ' + F); lignesEq(e, fin); }
            else if (id === '24.9 b)') { const fin = coefs(F), M = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2]; if (!(proche(fin.a * M[0] + fin.b * M[1] + fin.c, 0) && proche(fin.a * (C[0] - B[0]) + fin.b * (C[1] - B[1]) - Math.sqrt((fin.a ** 2 + fin.b ** 2) * ((C[0] - B[0]) ** 2 + (C[1] - B[1]) ** 2)) * Math.sign(fin.a * (C[0] - B[0]) + fin.b * (C[1] - B[1])), 0, 1e-7))) faux(e, 'mediatrice ' + F); lignesEq(e, fin); }
            else if (id === '24.9 c)') { const r = tuple(F); if (!proche(r[0], (A[0] + B[0] + C[0]) / 3) || !proche(r[1], (A[1] + B[1] + C[1]) / 3)) faux(e, 'centre de gravite ' + F); }
            else { const r = tuple(F), d = (P) => Math.hypot(P[0] - r[0], P[1] - r[1]); if (!proche(d(A), d(B)) || !proche(d(B), d(C))) faux(e, 'cercle circonscrit ' + F); }
            compte('24.9' + id[5]);
          }
          else if (/^24\.10 /.test(id)) {
            const c = par('24.10 a)').contexteTexte, eqs = [...c.matchAll(/d'équation \\\((.*?)\\\)/g)].map((m) => m[1]);
            const ord = id === '24.10 b)', parts = (eq) => { const m = eq.replace(/\s/g, '').match(/^(m\^2|m)x([+-]\d*)y([+-]\d+)?=0$/); return m && { deg2: m[1] === 'm^2', p: Number((m[2] === '+' ? '+1' : m[2] === '-' ? '-1' : m[2])), q: Number(m[3] || 0) }; };
            const d1 = parts(eqs[0].replace(/\^\{2\}/, '^2')), q2 = coefs(eqs[1]);
            // d1 : m x + p y + q = 0 (ou m^2) ; d2 : D x + E y + F = 0 ; parallele : m E - D p = 0 ; orthogonale : m D + p E = 0
            const sols = (() => { const A = ord ? (-d1.p * q2.b) / q2.a : (q2.a * d1.p) / q2.b; if (d1.deg2) return A > 0 ? [-Math.sqrt(A), Math.sqrt(A)] : []; return [A]; })();
            const rep = String(e.reponse), att = rep.startsWith('{') ? rep.slice(1, -1).split(';').filter((z) => z.trim()).map((z) => math.evaluate(z)).sort((u, v) => u - v) : [math.evaluate(rep)];
            if (sols.length !== att.length || sols.some((v, i) => !proche(v, att[i], 1e-7))) faux(e, 'parametre (attendu de la fiche) ' + rep + ' vs ' + sols);
            const fin = F === '\\emptyset' ? [] : (F.startsWith('\\{') ? F.replace(/^\\\{|\\\}$/g, '').replace(/\\,/g, '').split(';').map((z) => val(z)).sort((u, v) => u - v) : [val(F)]);
            if (fin.length !== sols.length || fin.some((v, i) => !proche(v, sols[i], 1e-7))) faux(e, 'parametre ' + F + ' vs ' + sols); compte('24.10' + id[6]);
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
