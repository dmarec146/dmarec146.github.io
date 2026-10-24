// Verification independante des details de Premiere 14 (inequations, equations, probabilites : tableaux, arbres, lois, esperance et variance, parametres) : recalcul a partir de l'enonce affiche et des donnees des figures
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/premiere/cahier-5/fiche-14.html';
(async () => {
  const s = http.createServer((req, res) => { const f = path.join(RACINE, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0, '127.0.0.1');
  await new Promise((r) => s.on('listening', r));
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${s.address().port}/${FICHE}`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof exercices !== 'undefined' && window.math && document.querySelector('.question'), null, { timeout: 40000 });
  const r = await p.evaluate((N) => {
    const defauts = [], stats = {}; const compte = (k) => { stats[k] = (stats[k] || 0) + 1; };
    const faux = (e, m) => { if (defauts.length < 14) defauts.push(e.id + ' : ' + m + ' | ' + String(e.enonce).replace(/\s+/g, ' ').slice(0, 120)); };
    const proche = (a, c, tol = 1e-9) => Math.abs(a - c) <= tol * (1 + Math.abs(a) + Math.abs(c));
    const mj = (t) => {
      let u = String(t).replace(/\\displaystyle|\\textstyle/g, '').replace(/\{,\}/g, '.').replace(/\\left|\\right|\\,|\\ /g, ' ').replace(/\\times/g, '*').replace(/\\div/g, '/').replace(/\\lt/g, '<').replace(/\\gt/g, '>').replace(/\\frac/g, '\\dfrac');
      for (let i = 0; i < 8; i++) u = u.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
      return u.replace(/(\d)\s*\(/g, '$1*(').replace(/\)\s*(\d)/g, ')*$1').replace(/(\d)\s*([a-zA-Z])/g, '$1*$2').replace(/\)\s*\(/g, ')*(').replace(/\)\s*([a-zA-Z])/g, ')*$1').replace(/\bx\s*\(/g, 'x*(').replace(/\bn\s*\(/g, 'n*(').replace(/\ba\s*\(/g, 'a*(');
    };
    const cache = {}; const val = (t, sc) => { const k = String(t); return (cache[k] || (cache[k] = math.compile(mj(k)))).evaluate(sc || {}); };
    const lireIntervalles = (F) => {
      if (F === '\\emptyset') return []; if (F === '\\mathbb{R}') return [{ bas: -Infinity, haut: Infinity, ib: false, ih: false }];
      return F.split('\\ \\cup\\ ').map((m) => { const q = m.match(/^([\[\]])(.+?)\\,;\\,(.+?)([\[\]])$/); if (!q) throw new Error('intervalle illisible ' + m); const bo = (t) => (/\\infty/.test(t) ? (t.includes('-') ? -Infinity : Infinity) : val(t)); return { bas: bo(q[2]), haut: bo(q[3]), ib: q[1] === '[', ih: q[4] === ']' }; });
    };
    const dans = (L, t) => L.some((iv) => (t > iv.bas + 1e-9 || (Math.abs(t - iv.bas) < 1e-9 && iv.ib)) && (t < iv.haut - 1e-9 || (Math.abs(t - iv.haut) < 1e-9 && iv.ih)));
    const memeEnsemble = (F, vrai, lo, hi) => {
      const L = lireIntervalles(F); const bornes = L.flatMap((iv) => [iv.bas, iv.haut]).filter(isFinite);
      const pas = (hi - lo) / 5000;
      for (let t = lo; t <= hi; t += pas) { if (bornes.some((x) => Math.abs(t - x) < 2 * pas)) continue; const v = vrai(t); if (v === null) continue; if (dans(L, t) !== v) return 'desaccord en ' + t.toFixed(3); }
      for (const x of bornes) { const v = vrai(x); if (v !== null && dans(L, x) !== v) return 'borne ' + x.toFixed(4) + ' mal incluse ou exclue'; }
      for (const iv of L) { if ((iv.bas === -Infinity && iv.ib) || (iv.haut === Infinity && iv.ih)) return 'crochet a l infini'; }
      return null;
    };
    const lireEnsemble = (F) => { if (F === '\\emptyset') return []; const m = F.match(/^\\\{(.*)\\\}$/); if (!m) throw new Error('ensemble illisible ' + F); return m[1].split('\\,;\\,').map((x) => val(x)).sort((u, w) => u - w); };
    const premier = (tx) => tx.match(/\\\((.*?)\\\)/)[1];
    const changements = (g, lo, hi, pas) => { let n = 0, prec = g(lo); for (let t = lo + pas; t <= hi; t += pas) { const c = g(t); if (isFinite(prec) && isFinite(c) && prec * c < 0) n++; prec = c; } return n; };
    const num = (F) => val(String(F).replace(/\\,/g, ''));
    // compare la reponse affichee (final), la reponse attendue (reponse) et la valeur recalculee
    const verifie = (e, F, attendu, tol = 1e-9) => {
      if (!proche(num(F), attendu, tol)) faux(e, e.id + ' final ' + F + ' = ' + num(F) + ' / recalcul ' + attendu);
      if (e.reponse !== undefined && !proche(math.evaluate(String(e.reponse)), attendu, tol)) faux(e, e.id + ' reponse ' + e.reponse + ' / recalcul ' + attendu);
    };
    const verifieLitteral = (e, F, f, scopes) => { for (const sc of scopes) { const att = f(sc); if (!proche(val(F, sc), att, 1e-9) || !proche(math.evaluate(String(e.reponse), sc), att, 1e-9)) faux(e, e.id + ' ' + F + ' en ' + JSON.stringify(sc) + ' : ' + val(F, sc) + ' / ' + att); } };
    const MOTS = { tiers: 3, quart: 4, 'cinquième': 5, 'sixième': 6 };
    const decimaux = (t) => [...String(t).matchAll(/\\\(P(?:_[A-Z])?\([^)]*\)=([0-9{},]+)\\\)/g)].map((m) => val(m[1]));
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      mettreAJourTextesAvances();
      const g = paramsAvances, T9 = document.getElementById('texte-14-9').textContent, T10 = document.getElementById('texte-14-10').textContent;
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (id === '14.1 a)' || id === '14.1 b)') {
            const q = premier(tx).match(/^(.*?)(\\leqslant|\\geqslant|\\lt|<|>)(.*)$/), op = q[2];
            const vrai = (x) => { const a = val(q[1], { x }), c = val(q[3], { x }); if (!isFinite(a) || !isFinite(c)) return null; const y = a - c; return op === '>' ? y > 1e-10 : op === '\\geqslant' ? y >= -1e-10 : op === '\\leqslant' ? y <= 1e-10 : y < -1e-10; };
            const err = memeEnsemble(F, vrai, -40, 40); if (err) faux(e, id + ' ' + err + ' ' + F); compte('14.1');
          }
          else if (id === '14.2 a)') {
            const parts = premier(tx).split('='), gg = (x) => val(parts[0], { x }) - val(parts[1], { x }), att = lireEnsemble(F);
            if (att.some((x) => Math.abs(gg(x)) > 1e-9) || new Set(att).size !== att.length) faux(e, '14.2a racine fausse ' + F);
            const nb = changements(gg, -30.0013, 30.0007, 0.0101), doubles = att.length === 1 ? 1 : 0;
            if (att.length === 2 && nb !== 2) faux(e, '14.2a nombre de racines ' + nb + ' ' + F);
            if (att.length === 0 && Math.min(...Array.from({ length: 6001 }, (_, i) => gg(-30 + i * 0.01))) <= 0) faux(e, '14.2a racine oubliee ' + F);
            if (doubles && Math.abs(gg(att[0] + 0.01)) <= 0) faux(e, '14.2a racine double'); if (doubles && nb !== 0) faux(e, '14.2a racine double croisee'); compte('14.2a');
          }
          else if (id === '14.2 b)') {
            const parts = premier(tx).split('='), gg = (x) => val(parts[0], { x }) - val(parts[1], { x }), att = lireEnsemble(F);
            if (att.length !== 1 || Math.abs(gg(att[0])) > 1e-9 || Math.abs(gg(att[0] + 1) - gg(att[0] + 2)) < 1e-12) faux(e, '14.2b ' + F); compte('14.2b');
          }
          else if (id === '14.3 a)' || id === '14.3 b)') { verifie(e, F, val(tx)); compte('14.3'); }
          else if (/^14\.4 /.test(id)) {
            const c = g.g4, att = { 'a)': 1 - (c.pAB + c.pnAB) / 100, 'b)': 1 - c.pnAnB / 100, 'c)': c.pAnB / 100 }[id.slice(5)];
            verifie(e, F, att); compte('14.4');
          }
          else if (/^14\.5 /.test(id)) {
            const c = g.g5, T = c.nAB + c.nAnB + c.nnAB + c.nnAnB, att = { 'a)': (c.nAB + c.nAnB) / T, 'b)': c.nAB / T, 'c)': 1 - c.nnAnB / T, 'd)': c.nnAnB / T }[id.slice(5)];
            if (c.N !== T || c.rowB !== c.nAB + c.nAnB || c.colA !== c.nAB + c.nnAB) faux(e, '14.5 totaux du tableau');
            verifie(e, F, att); compte('14.5');
          }
          else if (id === '14.6 a)') { const [pa, q] = decimaux(tx); verifie(e, F, pa * q); compte('14.6'); }
          else if (id === '14.6 b)') { const [pa, pb, q] = decimaux(tx); verifie(e, F, pa * q / pb); compte('14.6'); }
          else if (id === '14.6 c)') { const [pa, pb] = decimaux(tx); verifie(e, F, 1 - (1 - pa) * (1 - pb)); compte('14.6'); }
          else if (id === '14.6 d)') { const [pa, pab] = decimaux(tx); verifie(e, F, pab / pa); compte('14.6'); }
          else if (/^14\.7 /.test(id)) {
            const c = g.g7, f = (x) => math.number(x), pC = f(c.pC), q1 = f(c.q1), q2 = f(c.q2), pD = pC * q1 + (1 - pC) * q2;
            if (!proche(f(c.q1bar), 1 - q1) || !proche(f(c.pCbar), 1 - pC)) faux(e, '14.7 branches complementaires');
            verifie(e, F, { 'a)': pC * (1 - q1), 'b)': pD, 'c)': pC * q1 / pD }[id.slice(5)]); compte('14.7');
          }
          else if (/^14\.8 /.test(id)) {
            const c = g.g8, pD = (c.p1 * c.q1 + c.p2 * c.q2 + c.p3 * c.q3) / 10000;
            if (c.p1 + c.p2 + c.p3 !== 100) faux(e, '14.8 somme des branches');
            verifie(e, F, { 'a)': c.p2 * (100 - c.q2) / 10000, 'b)': pD, 'c)': c.p1 * c.q1 / 10000 / pD }[id.slice(5)]); compte('14.8');
          }
          else if (/^14\.9 /.test(id)) {
            const nb = [...T9.matchAll(/(\d+) personnes/g)].map((m) => Number(m[1])), mot = Object.keys(MOTS).find((k) => T9.includes('un ' + k + ' des skieurs'));
            const Nn = nb[0], S = nb[1], X = nb[2], both = S / MOTS[mot], R = Nn - X - S + both;
            verifie(e, F, { 'a)': both / Nn, 'b)': (Nn - X) / Nn, 'c)': both / R }[id.slice(5)]); compte('14.9');
          }
          else if (/^14\.10 /.test(id)) {
            const pc = [...T10.matchAll(/(\d+)%/g)].map((m) => Number(m[1])), m0 = pc[0] / 100, a = pc[1] / 100, bb = pc[2] / 100, pS = m0 * a + (1 - m0) * bb;
            verifie(e, F, { 'a)': m0 * a, 'b)': pS, 'c)': m0 * a / pS }[id.slice(6)]); compte('14.10');
          }
          else if (/^14\.11 /.test(id)) {
            const c = g.g11;
            verifieLitteral(e, F, ({ n }) => (id === '14.11 a)' ? c.k1 * n * n / (c.k1 * n * n + c.k4 * n) : c.k1 * n * n / (c.k1 * n * n + c.k2 * n + c.k3 * n * n)), [{ n: 3 }, { n: 7 }, { n: 12 }]); compte('14.11');
          }
          else if (/^14\.12 /.test(id)) {
            const c = g.g12, pA = (x) => 1 / (x + c.K), pAB = (x) => pA(x) * c.Fp / c.Fq, pB = (x) => pAB(x) + (1 - pA(x)) * c.Gp / c.Gq;
            verifieLitteral(e, F, ({ x }) => ({ 'a)': pAB(x), 'b)': pB(x), 'c)': pAB(x) / pB(x) }[id.slice(6)]), [{ x: 0.7 }, { x: 2.3 }, { x: 9 }]); compte('14.12');
          }
          else if (/^14\.13 /.test(id)) {
            const c = g.g13, tot = c.pr.reduce((a, b2) => a + b2, 0), E = c.pr.reduce((t2, pp, i) => t2 + c.xs[i] * pp, 0) / 100, E2 = c.pr.reduce((t2, pp, i) => t2 + c.xs[i] * c.xs[i] * pp, 0) / 100;
            if (tot !== 100) faux(e, '14.13 somme des probabilites ' + tot);
            verifie(e, F, { 'a)': c.pr[c.mi] / 100, 'b)': c.pr.slice(0, c.mi + 1).reduce((a, b2) => a + b2, 0) / 100, 'c)': E, 'd)': E2 - E * E }[id.slice(6)]); compte('14.13');
          }
          else if (/^14\.14 /.test(id)) {
            const c = g.g14, k = id === '14.14 a)' ? 3 : 4;
            verifie(e, F, (c.C[k - 1] - c.C[k - 2]) / c.Dtot); if (c.C[5] !== c.Dtot) faux(e, '14.14 total des probabilites cumulees'); compte('14.14');
          }
          else if (id === '14.15 a)' || id === '14.15 b)') {
            const pB = (a) => a * a * (1 - a) + (1 - a * a) * a;
            verifieLitteral(e, F, ({ a }) => (id === '14.15 a)' ? pB(a) : a * a * (1 - a) / pB(a)), [{ a: 0.2 }, { a: 0.55 }, { a: 0.9 }]); compte('14.15');
          }
          else if (id === '14.15 c)') {
            const pB = (a) => a * a * (1 - a) + (1 - a * a) * a, gg = (a) => a * a * (1 - a) / pB(a) - a * a, att = val(F);
            if (Math.abs(gg(att)) > 1e-9 || changements(gg, 0.0003, 0.9997, 0.0007) !== 1) faux(e, '14.15c ' + F); compte('14.15c');
          }
          else if (/^14\.16 /.test(id)) {
            verifieLitteral(e, F, ({ n }) => { let E = 0, E2 = 0; for (let i = 1; i <= n; i++) { E += i / n; E2 += i * i / n; } return id === '14.16 a)' ? E : E2 - E * E; }, [{ n: 4 }, { n: 7 }, { n: 12 }]); compte('14.16');
          }
          else if (id === '14.17') {
            verifieLitteral(e, F, ({ a, n }) => { let E = 0; for (let i = 0; i <= n; i++) E += Math.pow(a, i) / (n + 1); return E; }, [{ a: 0.7, n: 4 }, { a: 2.5, n: 6 }, { a: -1.5, n: 5 }]); compte('14.17');
          }
          else if (/^14\.18 /.test(id)) {
            verifieLitteral(e, F, ({ x }) => { const E = x + (1 - x) * x, E2 = x + (1 - x) * x * x; return id === '14.18 a)' ? E : E2 - E * E; }, [{ x: 0.2 }, { x: 0.5 }, { x: 0.83 }]); compte('14.18');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
