// Verification independante des details de Premiere 2 (second degre : discriminant, racines, inequations, parametres) : tout est recalcule a partir de l'enonce affiche
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 300);
const FICHE = process.argv[3] || 'cahiers/premiere/cahier-1/fiche-02.html';
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
      let u = String(t).replace(/\\left|\\right|\\,|\\ /g, ' ').replace(/\\times/g, '*').replace(/\\lt/g, '<').replace(/\\gt/g, '>');
      u = u.replace(/\bax\b/g, 'a*x');
      for (let i = 0; i < 6; i++) u = u.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
      return u;
    };
    const cache = {}; const val = (t, sc) => { const k = String(t); return (cache[k] || (cache[k] = math.compile(mj(k)))).evaluate(sc || {}); };
    // coefficients d'un trinome a une variable
    const coefs = (t, v, extra) => { const f = (x) => val(t, Object.assign({ [v]: x }, extra || {})); const a = (f(1) + f(-1) - 2 * f(0)) / 2; if (!proche(f(2), 4 * a + (f(1) - f(-1)) + f(0), 1e-7)) throw new Error('pas un trinome'); return [a, (f(1) - f(-1)) / 2, f(0)]; };
    // ensemble d'intervalles ecrit en LaTeX -> liste { bas, haut, ib, ih }
    const lireIntervalles = (F) => {
      if (F === '\\emptyset') return []; if (F === '\\mathbb{R}') return [{ bas: -Infinity, haut: Infinity, ib: false, ih: false }];
      return F.split('\\ \\cup\\ ').map((m) => { const q = m.match(/^([\[\]])(.+?)\\,;\\,(.+?)([\[\]])$/); if (!q) throw new Error('intervalle illisible ' + m); const bo = (t) => (/\\infty/.test(t) ? (t.includes('-') ? -Infinity : Infinity) : val(t)); return { bas: bo(q[2]), haut: bo(q[3]), ib: q[1] === '[', ih: q[4] === ']' }; });
    };
    const dans = (L, t) => L.some((iv) => (t > iv.bas + 1e-9 || (Math.abs(t - iv.bas) < 1e-9 && iv.ib)) && (t < iv.haut - 1e-9 || (Math.abs(t - iv.haut) < 1e-9 && iv.ih)));
    // compare un ensemble F a un predicat vrai(t) : echantillon dense (hors voisinage des bornes) et les bornes elles-memes
    const memeEnsemble = (F, vrai) => {
      const L = lireIntervalles(F); const bornes = L.flatMap((iv) => [iv.bas, iv.haut]).filter(isFinite);
      const lo = Math.min(-12, ...bornes.map((x) => x - 10)), hi = Math.max(12, ...bornes.map((x) => x + 10)), pas = (hi - lo) / 6000;
      for (let t = lo; t <= hi; t += pas) { if (bornes.some((x) => Math.abs(t - x) < 2 * pas)) continue; if (dans(L, t) !== vrai(t)) return 'desaccord en ' + t.toFixed(3); }
      for (const x of bornes) { if (dans(L, x) !== vrai(x)) return 'borne ' + x.toFixed(4) + ' mal incluse ou exclue'; }
      for (const iv of L) { if (iv.bas !== -Infinity && iv.ib !== vrai(iv.bas)) return 'crochet bas ' + iv.bas; if (iv.haut !== Infinity && iv.ih !== vrai(iv.haut)) return 'crochet haut ' + iv.haut; if ((iv.bas === -Infinity && iv.ib) || (iv.haut === Infinity && iv.ih)) return 'crochet a l infini'; }
      return null;
    };
    const irreductible = (t) => { const m = String(t).match(/^-?\\dfrac\{(\d+)\}\{(\d+)\}$/); if (!m) return /^-?\d+$/.test(t); const pg = (a, b) => (b ? pg(b, a % b) : a); return pg(+m[1], +m[2]) === 1; };
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices(); const pa = paramsAvances;
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (/^2\.1 /.test(id)) { const v = val(tx); if (!proche(v, val(F)) || !proche(v, math.evaluate(e.reponse))) faux(e, '2.1 ' + F + ' attendu ' + v); if (id === '2.1 a)' && !irreductible(F)) faux(e, 'fraction non irreductible ' + F); if (id === '2.1 b)' && !/^-?\d+[+-]\\sqrt\{\d+\}$/.test(F)) faux(e, 'forme 2.1b ' + F); compte('2.1'); }
          else if (/^2\.2 /.test(id)) { const v = val(tx); if (!proche(v, val(F)) || !proche(v, math.evaluate(e.reponse)) || !irreductible(F)) faux(e, '2.2 ' + F + ' attendu ' + v); compte('2.2'); }
          else if (/^2\.[34] /.test(id)) { const [a, bb, c] = coefs(tx, 'x'); const d = bb * bb - 4 * a * c; if (!proche(d, val(F)) || !proche(d, math.evaluate(e.reponse.replace(/sqrt/g, 'sqrt')))) faux(e, 'discriminant ' + F + ' attendu ' + d); if (/^2\.4 /.test(id) && !irreductible(F)) faux(e, 'fraction non irreductible ' + F); compte('2.3/2.4'); }
          else if (/^2\.5 /.test(id)) {
            const [a, bb, c] = coefs(tx.split('=')[0], 'x'); const d = bb * bb - 4 * a * c; if (d < -1e-9) { faux(e, 'delta negatif'); continue; }
            const attendues = d < 1e-9 ? [-bb / (2 * a)] : [(-bb - Math.sqrt(d)) / (2 * a), (-bb + Math.sqrt(d)) / (2 * a)].sort((u, w) => u - w);
            const m = F.match(/^\\\{(.+?)(?:\\,;\\,(.+))?\\\}$/); if (!m) { faux(e, 'ensemble ' + F); continue; }
            const lues = [val(m[1])].concat(m[2] ? [val(m[2])] : []);
            if (lues.length !== attendues.length || !lues.every((x, i) => proche(x, attendues[i]))) faux(e, 'racines ' + F + ' attendu ' + attendues);
            if (lues.length === 2 && !(lues[0] < lues[1])) faux(e, 'ordre croissant ' + F);
            compte('2.5');
          }
          else if (id === '2.6 a)') { const bT = Number(tx.match(/b=(-?\d+)/)[1]), C7 = pa.g7.C7; const oui = bT * bT - 4 * C7 > 0; if (F !== (oui ? 'oui' : 'non') || e.reponse !== F) faux(e, 'oui/non ' + F + ' attendu ' + oui); compte('2.6a'); }
          else if (id === '2.6 b)') { const C7 = pa.g7.C7; for (const bv of [-3, 0.5, 2, 7]) if (!proche(val(F, { b: bv }), bv * bv - 4 * C7)) faux(e, 'disc en b ' + F); compte('2.6b'); }
          else if (id === '2.6 c)') { const C7 = pa.g7.C7; const err = memeEnsemble(F, (bv) => bv * bv - 4 * C7 > 1e-12); if (err) faux(e, 'b ' + err + ' ' + F); compte('2.6c'); }
          else if (id === '2.7 a)') { const { B8, C8 } = pa.g8; for (const av of [-2, 0.5, 3]) if (!proche(val(F, { a: av }), B8 * B8 - 4 * av * C8)) faux(e, 'disc en a ' + F); compte('2.7a'); }
          else if (id === '2.7 b)') { const { B8, C8 } = pa.g8; const a0 = val(F); if (!proche(B8 * B8 - 4 * a0 * C8, 0) || a0 === 0 || !irreductible(F)) faux(e, 'a unique ' + F); compte('2.7b'); }
          else if (id === '2.8 a)') { const { A9, B9 } = pa.g9; for (const cv of [-2, 0.5, 3]) if (!proche(val(F, { c: cv }), B9 * B9 - 4 * A9 * cv)) faux(e, 'disc en c ' + F); compte('2.8a'); }
          else if (id === '2.8 b)') { const { A9, B9 } = pa.g9; const err = memeEnsemble(F, (cv) => B9 * B9 - 4 * A9 * cv < -1e-12); if (err) faux(e, 'c ' + err + ' ' + F); compte('2.8b'); }
          else if (/^2\.9 /.test(id)) {
            const q = tx.match(/^(.*?)(\\leqslant|\\geqslant|\\lt|<|>)(.*)$/); if (!q) { faux(e, 'inegalite illisible'); continue; }
            const v = ['x', 'y', 't', 'v'].find((z) => new RegExp('(^|[^a-z\\\\])' + z + '(?![a-z])').test(tx.replace(/\\[a-z]+/g, ''))), op = q[2] === '\\lt' ? '<' : q[2];
            const g = (z) => val(q[1], { [v]: z }) - val(q[3], { [v]: z }); const vrai = (z) => { const y = g(z); return op === '>' ? y > 1e-10 : op === '<' ? y < -1e-10 : op === '\\geqslant' ? y >= -1e-10 : y <= 1e-10; };
            const err = memeEnsemble(F, vrai); if (err) faux(e, v + ' ' + err + ' ' + F); compte('2.9');
          }
          else if (id === '2.10 a)') {
            const P = tx.match(/P\(x\)=(.*)\\\)$/)[1]; const f = (a0, x) => val(P, { x, a: a0 });
            const vrai = (a0) => { const A = (f(a0, 1) + f(a0, -1) - 2 * f(a0, 0)) / 2, B = (f(a0, 1) - f(a0, -1)) / 2, C = f(a0, 0); return A > 0 && B * B - 4 * A * C <= 1e-10; };
            const err = memeEnsemble(F, vrai, -10, 60); if (err) faux(e, 'a ' + err + ' ' + F); compte('2.10a');
          }
          else if (id === '2.10 b)') { const P = tx.match(/P\(x\)=(.*)\\\)$/)[1]; let aucune = true; for (const a0 of [-5, -1, 0.3, 2, 10, 100]) { let mn = Infinity; for (let x = -50; x <= 50; x += 0.25) mn = Math.min(mn, val(P, { x, a: a0 })); if (mn >= 0) aucune = false; } if (!aucune || F !== 'aucune' || e.reponse !== 'aucune') faux(e, 'aucune ' + F); compte('2.10b'); }
          else if (id === '2.11') {
            const P = tx.match(/P\(x\)=(.*)\\\)$/)[1];
            const vrai = (a0) => { const f = (x) => val(P, { x, a: a0 }); const A = (f(1) + f(-1) - 2 * f(0)) / 2, B = (f(1) - f(-1)) / 2, C = f(0); return A > 0 && B * B - 4 * A * C <= 1e-10; };
            const err = memeEnsemble(F, vrai, -10, 60); if (err) faux(e, 'a ' + err + ' ' + F); compte('2.11');
          }
          else if (id === '2.12') {
            const m = tx.match(/\\\(\(x([+-]\d+)?\)\^2\+\(y([+-]\d+)?\)\^2=(\d+)\\\)/); if (!m) { faux(e, 'cercle illisible'); continue; }
            const h = -(m[1] ? Number(m[1]) : 0), k = -(m[2] ? Number(m[2]) : 0), rr = Number(m[3]);
            const err = memeEnsemble(F, (t) => (t * h - k) ** 2 <= rr * (1 + t * t) + 1e-9, -40, 40); if (err) faux(e, 't ' + err + ' ' + F); compte('2.12');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
