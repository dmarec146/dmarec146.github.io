// Verification independante des details de Premiere 22 (calcul de sommes : inequations, equations, sommes d entiers, suites arithmetiques et geometriques, symbole somme, sommes de puissances) : recalcul a partir de l'enonce affiche (valeurs numeriques, zeros trouves par minimisation), sans lire le raisonnement des etapes.
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/premiere/cahier-9/fiche-22.html';
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
    const proche = (a, c, tol = 1e-8) => Math.abs(a - c) <= tol * (1 + Math.abs(a) + Math.abs(c));
    const mj = (t) => {
      let u = String(t).replace(/\\displaystyle|\\textstyle/g, '').replace(/\{,\}/g, '.').replace(/\\left|\\right|\\,|\\ /g, ' ').replace(/\\times/g, '*').replace(/\\div/g, '/').replace(/\\lt/g, '<').replace(/\\gt/g, '>').replace(/\\frac/g, '\\dfrac');
      for (let i = 0; i < 8; i++) u = u.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
      u = u.replace(/\{/g, '(').replace(/\}/g, ')');
      return u.replace(/(\d)\s*\(/g, '$1*(').replace(/\)\s*(\d)/g, ')*$1').replace(/(\d)\s*([a-zA-Z])/g, '$1*$2').replace(/\)\s*\(/g, ')*(').replace(/\)\s*([a-zA-Z])/g, ')*$1').replace(/\bx\s*\(/g, 'x*(').replace(/\ba\s*\(/g, 'a*(');
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
    // ---- vecteurs : chaque lettre est un point de coordonnees tirees au hasard ; \vec{x} un vecteur nomme
    const nom = (s) => s.replace(/'/g, 'p');
    const vecMj = (tex) => mj(String(tex).replace(/\\vec\{0\}/g, '0').replace(/\\alpha/g, 'a').replace(/\\overrightarrow\{([A-Z]'?)([A-Z]'?)\}/g, (m, p0, q) => `(${nom(q)}-${nom(p0)})`).replace(/\\vec\{([a-z])\}/g, 'V$1'));
    const evalVec = (tex, pts, extra = {}, vnom = {}) => [0, 1].map((k) => { const sc = { ...extra }; for (const [n, q] of Object.entries(pts)) sc[nom(n)] = q[k]; for (const [n, q] of Object.entries(vnom)) sc['V' + n] = q[k]; return math.evaluate(vecMj(tex), sc); });
    const alea = () => Math.random() * 10 - 5;
    const pointsAleatoires = () => { const q = {}; 'ABCDEFGHIJKLMNPQRSTUVWX'.split('').forEach((l) => { q[l] = [alea(), alea()]; }); q['A\''] = [(q.B[0] + q.C[0]) / 2, (q.B[1] + q.C[1]) / 2]; q['B\''] = [(q.C[0] + q.A[0]) / 2, (q.C[1] + q.A[1]) / 2]; q['C\''] = [(q.A[0] + q.B[0]) / 2, (q.A[1] + q.B[1]) / 2]; q.G = [(q.A[0] + q.B[0] + q.C[0]) / 3, (q.A[1] + q.B[1] + q.C[1]) / 3]; return q; };
    const egalVec = (u, w) => proche(u[0], w[0], 1e-8) && proche(u[1], w[1], 1e-8);
    // reponse en ASCII (« 3*(1-a)AB », « 1/4NF », « (a-1)v ») -> expression en V_xy
    const reponseVec = (rep, pts, extra, vnom) => [0, 1].map((k) => { const sc = { ...extra }; for (const [n, q] of Object.entries(pts)) sc[nom(n)] = q[k]; for (const [n, q] of Object.entries(vnom || {})) sc['V' + n] = q[k]; const ex = String(rep).replace(/([A-Z]'?)([A-Z]'?)/g, (m, p0, q) => ` (${nom(q)}-${nom(p0)}) `).replace(/(?<![A-Za-z])v(?![A-Za-z])/g, ' Vv '); return math.evaluate(ex, sc); });
    const MOTS = {};
    const P5 = { A: [2, 6], B: [5, 6], C: [1, 4], D: [3, 4], E: [6, 4], F: [2, 2], G: [4, 2], H: [3, 1] };
    const coefFrac = (s) => { s = String(s || '').trim(); if (s === '' ) return 1; if (s === '-') return -1; const m = s.match(/^(-?)\\dfrac\{(\d+)\}\{(\d+)\}$/); if (m) return (m[1] ? -1 : 1) * Number(m[2]) / Number(m[3]); return Number(s); };
    const prep = (t) => String(t).replace(/\\displaystyle/g, '').replace(/([nk])\s*(\\left)?\(/g, '$1*$2(').replace(/\\left\|(.*?)\\right\|/g, 'abs($1)').replace(/\\pi/g, 'pi');
    const vt = (t, sc) => val(prep(t), sc);
    const egal = (a, c, tol = 1e-9) => Math.abs(a - c) <= tol * (1 + Math.abs(a) + Math.abs(c));
    const racinesReelles = (gg, lo, hi, pas) => {
      let nb = 0, xp = lo + pas / 7, prec = gg(xp);
      for (let x = xp + pas; x < hi; x += pas) {
        const c = gg(x);
        if (isFinite(prec) && isFinite(c) && prec * c < 0) { let a = xp, b = x, fa = prec; for (let i = 0; i < 70; i++) { const m = (a + b) / 2, fm = gg(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } } if (Math.abs(gg((a + b) / 2)) < 1e-6) nb++; }
        xp = x; prec = c;
      }
      return nb;
    };
    const ensemble = (F) => { if (F === '\\emptyset') return []; return F.match(/^\\\{(.*)\\\}$/)[1].split('\\,;\\,').map((z) => vt(z)).sort((u, w) => u - w); };
    const texteId = (id) => { const el = document.getElementById(id); return el ? el.textContent : ''; };
    const sommeDe = (tx) => { const m = tx.replace(/\\displaystyle/g, '').match(/\\sum_\{k=(.*?)\}\^\{(.*?)\}(.*?)\\\)/); return m ? { a: m[1], b: m[2], terme: m[3] } : null; };
    const vraieSomme = (s, n) => { const a = vt(s.a, { n }), b = vt(s.b, { n }); let t = 0; for (let k = a; k <= b + 1e-9; k++) t += vt(s.terme, { k, n }); return t; };
    // termes signes de niveau 0 d'une ecriture « 1-\dfrac{1}{2}+\cdots+\dfrac{1}{2n+1} »
    const termesDe = (s) => { const out = []; let d = 0, cur = ''; const t = s.replace(/\\left|\\right/g, ''); for (let i = 0; i < t.length; i++) { const ch = t[i]; if (ch === '{' || ch === '(') d++; if (ch === '}' || ch === ')') d--; if (d === 0 && (ch === '+' || ch === '-') && cur.trim() !== '' && !/\^$/.test(cur.trim())) { out.push(cur); cur = ch; } else cur += ch; } out.push(cur); return out.map((x) => x.trim()).filter(Boolean); };
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      mettreAJourTextesAvances();
      const T9 = texteId('titre-22-9');
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (id === '22.1 a)' || id === '22.1 b)') {
            const q = premier(tx).match(/^(.*?)(\\leqslant|\\geqslant|\\lt|<|>)(.*)$/), op = q[2];
            const vrai = (x) => { const a = vt(q[1], { x }), c = vt(q[3], { x }); if (!isFinite(a) || !isFinite(c)) return null; const y = a - c; return op === '>' ? y > 1e-10 : op === '\\geqslant' ? y >= -1e-10 : op === '\\leqslant' ? y <= 1e-10 : y < -1e-10; };
            const err = memeEnsemble(F, vrai, -40, 40); if (err) faux(e, id + ' ' + err + ' ' + F); compte('22.1');
          }
          else if (id === '22.2 a)' || id === '22.2 b)') {
            const [g0, d0] = premier(tx).split('='), gg = (x) => vt(g0, { x }) - vt(d0, { x }), att = ensemble(F);
            if (att.some((x) => !isFinite(gg(x)) || Math.abs(gg(x)) > 1e-8) || new Set(att.map((z) => z.toFixed(9))).size !== att.length) faux(e, id + ' racine fausse ' + F);
            if (racinesReelles(gg, -60, 60, 0.00311) !== att.length) faux(e, id + ' nombre de solutions ' + F); compte('22.2');
          }
          else if (id === '22.3 a)' || id === '22.3 b)') {
            const v = vt(tx);
            if (!egal(v, vt(F), 1e-9) || !egal(v, math.evaluate(String(e.reponse)), 1e-9)) faux(e, id + ' ' + F + ' / ' + v); compte('22.3');
          }
          else if (/^22\.(4|8|10|11)/.test(id)) {
            const s = sommeDe(tx);
            for (const n of [9, 10, 11, 12]) { const v = vraieSomme(s, n); if (!egal(v, vt(F, { n }), 1e-9) || !egal(v, math.evaluate(String(e.reponse), { n }), 1e-9)) faux(e, id + ' ' + F + ' (n=' + n + ') / ' + v); }
            compte('22.4-11');
          }
          else if (id === '22.5 a)' || id === '22.5 b)' || id === '22.6 a)' || id === '22.6 b)') {
            const m = tx.replace(/\\displaystyle/g, '').match(/\\sum_\{k=(\d+)\}\^\{(\d+)\}u_k\\\), si \\\(u_0=(-?\d+)\\\) et \\\((r|q)=(-?\d+)\\\)/), a = Number(m[1]), b = Number(m[2]), u0 = Number(m[3]), c = Number(m[5]), arith = m[4] === 'r';
            let S = 0; for (let k = a; k <= b; k++) S += arith ? u0 + k * c : u0 * Math.pow(c, k);
            if (!egal(S, vt(F), 1e-9) || !egal(S, Number(e.reponse), 1e-9)) faux(e, id + ' ' + F + ' / ' + S); compte('22.56');
          }
          else if (id === '22.7 a)' || id === '22.7 b)' || id === '22.7 c)' || id === '22.7 d)') {
            const ts = termesDe(premier(tx)), iC = ts.findIndex((z) => /cdots/.test(z)), avant = ts.slice(0, iC), derniere = ts[ts.length - 1];
            const f = F.replace(/\\displaystyle/g, '').match(/\\sum_\{k=(.*?)\}\^\{(.*?)\}(.*)$/), a = Number(f[1]);
            const n0 = id === '22.7 b)' ? 0 : 5, bExpr = f[2], nn = n0 || 7;
            avant.forEach((z, j) => { const v = vt(z.replace(/^\+/, '')), g = vt(f[3], { k: a + j, n: nn }); if (!egal(v, g, 1e-9)) faux(e, id + ' terme ' + (j + 1) + ' : ' + z + ' / ' + g); });
            const bN = vt(bExpr, { n: nn }), vl = vt(derniere.replace(/^\+/, ''), { n: nn }), gl = vt(f[3], { k: bN, n: nn });
            if (!egal(vl, gl, 1e-9)) faux(e, id + ' dernier terme ' + derniere + ' / ' + gl + ' (n=' + nn + ')');
            compte('22.7');
          }
          else if (id === '22.9') {
            const M = Number(T9.match(/entre 1 et (\d+)/)[1]); let S = 0; for (let j = 1; j <= M; j += 2) S += j;
            if (!egal(S, vt(F)) || !egal(S, Number(e.reponse))) faux(e, id + ' ' + F + ' / ' + S); compte('22.9');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
