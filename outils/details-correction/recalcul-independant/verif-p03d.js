// Verification independante des details de Premiere 3 (factorisations, equations se ramenant au second degre, bicarrees) : tout est recalcule a partir de l'enonce affiche
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 300);
const FICHE = process.argv[3] || 'cahiers/premiere/cahier-1/fiche-03.html';
(async () => {
  const s = http.createServer((req, res) => { const f = path.join(RACINE, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0, '127.0.0.1');
  await new Promise((r) => s.on('listening', r));
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${s.address().port}/${FICHE}`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof exercices !== 'undefined' && window.math && document.querySelector('.question'), null, { timeout: 40000 });
  const r = await p.evaluate((N) => {
    const defauts = [], stats = {}; const compte = (k) => { stats[k] = (stats[k] || 0) + 1; };
    const faux = (e, m) => { if (defauts.length < 14) defauts.push(e.id + ' : ' + m + ' | ' + String(e.enonce).replace(/\s+/g, ' ').slice(0, 130)); };
    const proche = (a, c, tol = 1e-8) => Math.abs(a - c) <= tol * (1 + Math.abs(a) + Math.abs(c));
    const mj = (t) => {
      let u = String(t).split('mx').join('m*x').replace(/\\left\||\\right\|/g, '|').replace(/\\left|\\right|\\,|\\ /g, ' ').replace(/\\times/g, '*').replace(/\\lt/g, '<').replace(/\\gt/g, '>');
      u = u.replace(/\|([^|]*)\|/g, 'abs($1)');
      for (let i = 0; i < 6; i++) u = u.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
      return u.replace(/(\d)\s*\(/g, '$1*(').replace(/\)\s*(\d)/g, ')*$1').replace(/(\d)\s*([a-zA-Z])/g, '$1*$2').replace(/\)\s*\(/g, ')*(').replace(/\)\s*([a-zA-Z])/g, ')*$1').replace(/(sqrt\([^()]*\))\s*([a-zA-Z(])/g, '$1*$2');
    };
    const cache = {}; const val = (t, sc) => { const k = String(t); return (cache[k] || (cache[k] = math.compile(mj(k)))).evaluate(sc || {}); };
    const lireIntervalles = (F) => {
      if (F === '\\emptyset') return []; if (F === '\\mathbb{R}') return [{ bas: -Infinity, haut: Infinity, ib: false, ih: false }];
      return F.split('\\ \\cup\\ ').map((m) => { const q = m.match(/^([\[\]])(.+?)\\,;\\,(.+?)([\[\]])$/); if (!q) throw new Error('intervalle illisible ' + m); const bo = (t) => (/\\infty/.test(t) ? (t.includes('-') ? -Infinity : Infinity) : val(t)); return { bas: bo(q[2]), haut: bo(q[3]), ib: q[1] === '[', ih: q[4] === ']' }; });
    };
    const dans = (L, t) => L.some((iv) => (t > iv.bas + 1e-9 || (Math.abs(t - iv.bas) < 1e-9 && iv.ib)) && (t < iv.haut - 1e-9 || (Math.abs(t - iv.haut) < 1e-9 && iv.ih)));
    const memeEnsemble = (F, vrai) => {
      const L = lireIntervalles(F); const bornes = L.flatMap((iv) => [iv.bas, iv.haut]).filter(isFinite);
      const lo = Math.min(-12, ...bornes.map((x) => x - 10)), hi = Math.max(12, ...bornes.map((x) => x + 10)), pas = (hi - lo) / 6000;
      for (let t = lo; t <= hi; t += pas) { if (bornes.some((x) => Math.abs(t - x) < 2 * pas)) continue; if (dans(L, t) !== vrai(t)) return 'desaccord en ' + t.toFixed(3); }
      for (const x of bornes) { if (dans(L, x) !== vrai(x)) return 'borne ' + x.toFixed(4) + ' mal incluse ou exclue'; }
      for (const iv of L) { if ((iv.bas === -Infinity && iv.ib) || (iv.haut === Infinity && iv.ih)) return 'crochet a l infini'; }
      return null;
    };
    const lireEnsemble = (F) => { if (F === '\\emptyset') return []; const m = F.match(/^\\\{(.*)\\\}$/); if (!m) throw new Error('ensemble illisible ' + F); return m[1].split('\\,;\\,').map((x) => val(x)).sort((u, w) => u - w); };
    const memeListe = (A, B) => A.length === B.length && A.every((x, i) => proche(x, B[i], 1e-9));
    const sansDoublon = (L) => L.filter((v, i) => i === 0 || Math.abs(v - L[i - 1]) > 1e-9);
    const interieur = (tx) => tx.match(/\\\((.*?)\\\)/)[1];
    const coefs = (t, v, extra) => { const f = (x) => val(t, Object.assign({ [v]: x }, extra || {})); const a = (f(1) + f(-1) - 2 * f(0)) / 2; if (!proche(f(2), 4 * a + (f(1) - f(-1)) + f(0), 1e-7)) throw new Error('pas un trinome'); return [a, (f(1) - f(-1)) / 2, f(0)]; };
    const nbFacteurs = (F) => (F.match(/\((?:[^()]|\\left\(|\\right\))*?\)/g) || []).length;
    // zeros d'une fonction sur [lo, hi] par balayage (changements de signe et minima de |h| proches de 0)
    const zeros = (h, lo, hi, pas) => {
      const res = []; let prec = [lo - pas, Math.abs(h(lo - pas))], cour = [lo, Math.abs(h(lo))];
      for (let t = lo + pas; t <= hi + pas; t += pas) {
        const suiv = [t, Math.abs(h(t))];
        if (cour[1] <= prec[1] && cour[1] <= suiv[1]) { let a = prec[0], c = suiv[0]; for (let i = 0; i < 80; i++) { const m1 = a + (c - a) / 3, m2 = c - (c - a) / 3; if (Math.abs(h(m1)) < Math.abs(h(m2))) c = m2; else a = m1; } const x = (a + c) / 2; if (Math.abs(h(x)) < 1e-6) res.push(x); }
        prec = cour; cour = suiv;
      }
      return sansDoublon(res.sort((u, w) => u - w).filter((x, i, t) => i === 0 || Math.abs(x - t[i - 1]) > 1e-4));
    };
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices(); const par = (id) => ex.find((x) => x.id === id);
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (/^3\.1 /.test(id)) {
            const q = tx.match(/^(.*?)(\\leqslant|\\geqslant|<|\\lt|>)(.*)$/); const op = q[2] === '\\lt' ? '<' : q[2];
            const g = (x) => val(q[1], { x }) - val(q[3], { x });
            const vrai = (x) => { const y = g(x); return op === '>' ? y > 1e-10 : op === '<' ? y < -1e-10 : op === '\\geqslant' ? y >= -1e-10 : y <= 1e-10; };
            const err = memeEnsemble(F, vrai); if (err) faux(e, '3.1 ' + err + ' ' + F); compte('3.1');
          }
          else if (id === '3.2 a)') { const v = val(tx); if (!proche(v, val(F)) || !proche(v, math.evaluate(e.reponse))) faux(e, '3.2a ' + F + ' attendu ' + v); compte('3.2a'); }
          else if (/^3\.2 [bcd]/.test(id)) { for (const n of [1, 2, 3, 4, 5]) if (!proche(val(tx, { n }), val(F, { n }), 1e-7) || !proche(val(tx, { n }), math.evaluate(e.reponse, { n }), 1e-7)) faux(e, '3.2 en n=' + n + ' ' + F); compte('3.2bcd'); }
          else if (/^3\.3 /.test(id)) {
            const P = interieur(tx); let ok = true; for (const x of [-2.5, 0.3, 1, 4.7]) if (!proche(val(P, { x }), val(F, { x }), 1e-7)) ok = false;
            if (!ok || nbFacteurs(F) !== 2) faux(e, 'factorisation ' + F); compte('3.3');
          }
          else if (/^3\.4 /.test(id)) {
            const P = interieur(tx); let ok = true; for (const [x, m] of [[1.3, 0.7], [-2, 3], [0.4, -1.9]]) if (!proche(val(P, { x, m }), val(F, { x, m }), 1e-7)) ok = false;
            if (!ok || nbFacteurs(F) !== 2) faux(e, 'factorisation ' + F); compte('3.4');
          }
          else if (id === '3.5 a)') {
            const k = val(interieur(tx).split('=')[1]); const d = k * k - 4; const att = d < 1e-9 ? [k / 2] : [(k - Math.sqrt(d)) / 2, (k + Math.sqrt(d)) / 2];
            if (!memeListe(lireEnsemble(F), att)) faux(e, '3.5a ' + F + ' attendu ' + att); compte('3.5a');
          }
          else if (id === '3.5 b)') {
            const m = tx.match(/=(-?\d+)-\\dfrac\{(-?\d+)\}/); const A = Number(m[1]), B = Number(m[2]);
            const h = (x) => x / (x * x - 1) - A + B / (x - 1); const att = [];
            // racines reelles de h hors x = +-1, par balayage entre les poles
            const bornes = [-60, -1 - 1e-6, -1 + 1e-6, 1 - 1e-6, 1 + 1e-6, 60]; for (let i = 0; i < bornes.length; i += 2) { const a = bornes[i], c = bornes[i + 1]; let prec = h(a); for (let x = a + 0.001; x <= c; x += 0.001) { const cur = h(x); if (isFinite(prec) && isFinite(cur) && prec * cur < 0) { let u = x - 0.001, w = x; for (let k = 0; k < 80; k++) { const mid = (u + w) / 2; if (h(u) * h(mid) <= 0) w = mid; else u = mid; } const rt = (u + w) / 2; if (Math.abs(h(rt)) < 1e-6) att.push(rt); } prec = cur; } }
            if (!memeListe(lireEnsemble(F), sansDoublon(att.sort((u, w) => u - w)))) faux(e, '3.5b ' + F + ' attendu ' + att); compte('3.5b');
          }
          else if (id === '3.5 c)') {
            const m = tx.match(/x([+-]\d+)?=\\sqrt\{x([+-]\d+)?\}/); const pp = m[1] ? Number(m[1]) : 0, qq = m[2] ? Number(m[2]) : 0; const att = [];
            for (let x = -200; x <= 200; x++) if (x + qq >= 0 && Math.abs((x + pp) - Math.sqrt(x + qq)) < 1e-9) att.push(x);
            if (!memeListe(lireEnsemble(F), att)) faux(e, '3.5c ' + F + ' attendu ' + att); compte('3.5c');
          }
          else if (id === '3.6 a)') { const P = tx.match(/P\(x\)=(.*)\\\), calculer \\\(P\((-?\d+)\)/); if (!proche(val(P[1], { x: Number(P[2]) }), 0, 1e-9) || F !== '0') faux(e, 'P(r) ' + F); compte('3.6a'); }
          else if (/^3\.6 [bc]/.test(id)) {
            const P = par('3.6 a)').enonce.match(/P\(x\)=(.*)\\\), calculer/)[1]; let ok = true; for (const x of [-2.5, 0.3, 1, 4.7]) if (!proche(val(P, { x }), val(F, { x }), 1e-7)) ok = false;
            if (!ok || nbFacteurs(F) !== (id === '3.6 b)' ? 2 : 3)) faux(e, 'factorisation ' + F); compte('3.6bc');
          }
          else if (/^3\.7 /.test(id)) {
            const P = interieur(tx); let ok = true; for (const x of [-2.5, 0.3, 1, 4.7]) if (!proche(val(P, { x }), val(F, { x }), 1e-7)) ok = false;
            if (!ok || nbFacteurs(F) !== 3) faux(e, 'factorisation ' + F); compte('3.7');
          }
          else if (/^3\.8 [ab]/.test(id)) {
            const P = interieur(tx).split('=')[0]; const g = (X) => val(P, { x: Math.sqrt(X) }); const C = g(0), B = g(1) - C - (g(4) - 4 * (g(1) - C) - C) * 0, Bq = g(1) - C - 1; // x^4 + B x^2 + C : g(X)= X^2 + B X + C
            const Bb = (g(1) - C - 1); const dd = Bb * Bb - 4 * C; const att = [];
            if (dd >= -1e-9) { const sq = Math.sqrt(Math.max(0, dd)); [(-Bb - sq) / 2, (-Bb + sq) / 2].forEach((Y) => { if (Y > 1e-9) att.push(-Math.sqrt(Y), Math.sqrt(Y)); else if (Math.abs(Y) <= 1e-9) att.push(0); }); }
            if (!memeListe(lireEnsemble(F), sansDoublon(att.sort((u, w) => u - w)))) faux(e, 'bicarree ' + F + ' attendu ' + att); compte('3.8ab');
          }
          else if (/^3\.8 [cd]/.test(id)) {
            const P = tx.match(/racines de \\\((.*?)\\\)\./)[1];
            const h = (a) => { const [A0, B0, C0] = coefs(P, 'x', { a }); const dl = B0 * B0 - 4 * A0 * C0; return Math.sqrt(Math.max(0, dl)) / Math.abs(A0) - 1; };
            const att = zeros(h, -20, 20, 0.002).filter((a) => { const [A0, B0, C0] = coefs(P, 'x', { a }); return B0 * B0 - 4 * A0 * C0 >= -1e-9; });
            if (!(lireEnsemble(F).length === att.length && lireEnsemble(F).every((v, i) => Math.abs(v - att[i]) < 2e-3))) faux(e, 'ecart ' + F + ' attendu ' + att.map((x) => x.toFixed(4))); compte('3.8cd');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
