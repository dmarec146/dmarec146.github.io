// Verification independante des details de Premiere 21 (produit scalaire II : vecteurs normaux et directeurs, equations cartesiennes, projete orthogonal, distances, cercles et tangentes) : recalcul a partir de l'enonce affiche (valeurs numeriques, zeros trouves par minimisation), sans lire le raisonnement des etapes.
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/premiere/cahier-8/fiche-21.html';
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
    const prep = (t) => String(t).replace(/\\left\|(.*?)\\right\|/g, 'abs($1)').replace(/\|([^|]*)\|/g, 'abs($1)').replace(/\\pi/g, 'pi');
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
    const decoupe = (s) => {
      s = String(s).replace(/\\left|\\right|\\,/g, '').trim(); if (s[0] === '(') s = s.slice(1, -1);
      let d = 0, cur = ''; const out = [];
      for (const ch of s) { if (ch === '(' || ch === '{') d++; if (ch === ')' || ch === '}') d--; if (ch === ';' && d === 0) { out.push(cur); cur = ''; } else cur += ch; }
      out.push(cur); return out;
    };
    const cv = (s, sc) => decoupe(s).map((t) => vt(t, sc));
    const pointsDe = (txt) => { const o = {}; for (const m of String(txt).matchAll(/\\\(([A-EM])((?:\\left)?\(.*?(?:\\right)?\))\\\)/g)) o[m[1]] = m[2]; return o; };
    const vecteurDe = (txt, nm) => { const deb = '\\vec{' + nm + '}\\begin{pmatrix}'; const i = txt.indexOf(deb); if (i < 0) throw new Error('vecteur ' + nm + ' absent'); const j = txt.indexOf('\\end{pmatrix}', i); return txt.slice(i + deb.length, j).split('\\\\'); };
    const ensemble = (F) => { if (F === '\\emptyset') return []; return F.match(/^\\\{(.*)\\\}$/)[1].split('\\,;\\,').map((z) => vt(z)).sort((u, w) => u - w); };
    const moins = (B, A) => [B[0] - A[0], B[1] - A[1]];
    const scal = (u, w) => u[0] * w[0] + u[1] * w[1];
    const cross = (u, w) => u[0] * w[1] - u[1] * w[0];
    const coefsLin = (expr) => { const g = (x, y) => vt(expr, { x, y }), c0 = g(0, 0); return [g(1, 0) - c0, g(0, 1) - c0, c0]; };   // a x + b y + c
    const eqDe = (txt) => { const m = [...String(txt).matchAll(/\\\(((?:(?!\\\()[^])*?)=0\\\)/g)]; return m.length ? m[0][1].replace(/^\(D_?\d?\):\s*/, '') : null; };
    const vecOption = (o) => { const m = o.texte.match(/pmatrix\}(.*?)\\\\(.*?)\\end/); return [Number(m[1]), Number(m[2])]; };
    const eqs = {};
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (id === '21.1 a)' || id === '21.1 b)') {
            const q = premier(tx).match(/^(.*?)(\\leqslant|\\geqslant|\\lt|<|>)(.*)$/), op = q[2];
            const vrai = (x) => { const a = vt(q[1], { x }), c = vt(q[3], { x }); if (!isFinite(a) || !isFinite(c)) return null; const y = a - c; return op === '>' ? y > 1e-10 : op === '\\geqslant' ? y >= -1e-10 : op === '\\leqslant' ? y <= 1e-10 : y < -1e-10; };
            const err = memeEnsemble(F, vrai, -40, 40); if (err) faux(e, id + ' ' + err + ' ' + F); compte('21.1');
          }
          else if (id === '21.2 a)') {
            const [g0, d0] = premier(tx).split('='), g = (x) => vt(g0, { x }) - vt(d0, { x }), C = g(0), A = (g(1) + g(-1)) / 2 - C, B = (g(1) - g(-1)) / 2, disc = B * B - 4 * A * C, att = ensemble(F);
            const vrai = disc < -1e-9 ? [] : Math.abs(disc) < 1e-9 ? [-B / (2 * A)] : [(-B - Math.sqrt(disc)) / (2 * A), (-B + Math.sqrt(disc)) / (2 * A)].sort((u, w) => u - w);
            if (att.length !== vrai.length || att.some((x, i) => Math.abs(x - vrai[i]) > 1e-9)) faux(e, id + ' ' + F + ' / ' + vrai); compte('21.2a');
          }
          else if (id === '21.2 b)') {
            const m = premier(tx).match(/^\\sqrt\{(.*)\}=(.*)$/), c = vt(m[2]), u = (x) => vt(m[1], { x }), a = u(1) - u(0), b = u(0), att = ensemble(F);
            const vrai = c < 0 ? [] : [(c * c - b) / a];
            if (att.length !== vrai.length || att.some((x, i) => Math.abs(x - vrai[i]) > 1e-9)) faux(e, id + ' ' + F + ' / ' + vrai); compte('21.2b');
          }
          else if (id === '21.3 a)') {
            const u = vecteurDe(tx, 'u').map((z) => vt(z)), v = vecteurDe(tx, 'v').map((z) => vt(z)), p = scal(u, v);
            if (!egal(p, vt(F)) || !egal(p, Number(e.reponse))) faux(e, id + ' ' + F + ' / ' + p); compte('21.3a');
          }
          else if (id === '21.3 b)') {
            const p = vt(premier(tx));
            if (!egal(p, vt(F), 1e-9) || !egal(p, math.evaluate(String(e.reponse)), 1e-9)) faux(e, id + ' ' + F + ' / ' + p); compte('21.3b');
          }
          else if (id === '21.4 a)' || id === '21.4 b)' || id === '21.4 c)') {
            let ref, test;
            if (id === '21.4 a)') { const [a, b] = coefsLin(eqDe(tx)); ref = [a, b]; test = (v) => cross(v, ref) === 0 || Math.abs(cross(v, ref)) < 1e-9; }
            else if (id === '21.4 b)') { ref = vecteurDe(tx, 'u').map((z) => vt(z)); test = (v) => Math.abs(scal(v, ref)) < 1e-9; }
            else { ref = vecteurDe(tx, 'n').map((z) => vt(z)); test = (v) => Math.abs(cross(v, ref)) < 1e-9; }
            const bonnes = e.options.filter((o) => test(vecOption(o))).map((o) => o.lettre).join(',');
            if (bonnes !== F || e.bonneReponse !== F) faux(e, id + ' ' + F + ' / ' + bonnes); compte('21.4');
          }
          else if (/^21\.5 /.test(id)) {
            const P = pointsDe(tx), AB = moins(cv(P.B), cv(P.A)), v = cv(F);
            if (Math.abs(scal(AB, v)) > 1e-9 || !Number.isInteger(v[0]) || !Number.isInteger(v[1]) || pgcd(v[0], v[1]) !== 1 || Number(e.vx) !== v[0] || Number(e.vy) !== v[1]) faux(e, id + ' ' + F + ' / AB=' + AB); compte('21.5');
          }
          else if (id === '21.6 a)') {
            const u = vecteurDe(tx, 'u'), n = vecteurDe(tx, 'n'), gg = (m) => scal(u.map((z) => vt(z, { m })), n.map((z) => vt(z, { m }))), att = ensemble(F);
            if (att.some((m) => Math.abs(gg(m)) > 1e-8) || racinesReelles(gg, -80, 80, 0.0121) !== att.length || att.length !== 2) faux(e, id + ' ' + F); compte('21.6a');
          }
          else if (id === '21.6 b)') {
            const P = pointsDe(tx), n = vecteurDe(tx, 'n').map((z) => vt(z)), A = cv(P.A), m0 = vt(F), B = cv(P.B, { m: m0 });
            if (Math.abs(scal(moins(B, A), n)) > 1e-9) faux(e, id + ' ' + F); const B2 = cv(P.B, { m: m0 + 1 }); if (Math.abs(scal(moins(B2, A), n)) < 1e-9) faux(e, id + ' m non unique'); compte('21.6b');
          }
          else if (/^21\.7 /.test(id)) {
            const v = cv(F), eq = eqDe(tx);
            if (id === '21.7 a)') { eqs.D1 = coefsLin(eq); if (!egal(v[0], eqs.D1[0]) || !egal(v[1], eqs.D1[1])) faux(e, id + ' ' + F + ' / ' + eqs.D1); }
            else if (id === '21.7 b)') { if (Math.abs(scal(v, eqs.D1)) > 1e-9 || (v[0] === 0 && v[1] === 0)) faux(e, id + ' ' + F + ' non directeur de D1 ' + eqs.D1); }
            else if (id === '21.7 c)') { eqs.D2 = coefsLin(eq); if (Math.abs(scal(v, eqs.D2)) > 1e-9 || (v[0] === 0 && v[1] === 0)) faux(e, id + ' ' + F + ' non directeur de D2 ' + eqs.D2); }
            else if (id === '21.7 d)') { if (!egal(v[0], eqs.D2[0]) || !egal(v[1], eqs.D2[1])) faux(e, id + ' ' + F + ' / ' + eqs.D2); }
            if (Math.abs(v[0] - Number(math.evaluate(String(e.vx)))) > 1e-9 || Math.abs(v[1] - Number(math.evaluate(String(e.vy)))) > 1e-9) faux(e, id + ' final different de la reponse'); compte('21.7');
          }
          else if (/^21\.8 /.test(id)) {
            const m = [...tx.matchAll(/\\\(\(d_[12]\): (.*?)=0\\\)/g)].map((z) => z[1]), n1 = coefsLin(m[0]), n2 = coefsLin(m[1]), perp = Math.abs(scal(n1, n2)) < 1e-9, lettre = perp ? 'a' : 'b';
            if (F !== lettre || e.bonneReponse !== lettre) faux(e, id + ' ' + F + ' / ' + lettre); compte('21.8');
          }
          else if (/^21\.9 /.test(id)) {
            const P = pointsDe(tx), A = cv(P.A), [a, b, c] = coefsLin(F.replace(/=\s*0$/, '')), directeur = /vecteur directeur/.test(tx), v = vecteurDe(tx, directeur ? 'u' : 'n').map((z) => vt(z));
            const ok = Math.abs(a * A[0] + b * A[1] + c) < 1e-9 && (directeur ? Math.abs(a * v[0] + b * v[1]) < 1e-9 : Math.abs(cross([a, b], v)) < 1e-9);
            if (!ok || !egal(a, Number(e.eqa)) || !egal(b, Number(e.eqb)) || !egal(c, math.evaluate(String(e.eqc)))) faux(e, id + ' ' + F); compte('21.9');
          }
          else if (/^21\.10 /.test(id)) {
            const M = cv(pointsDe(tx).M), [a, b, c] = coefsLin(eqDe(tx)), H = cv(F);
            if (Math.abs(a * H[0] + b * H[1] + c) > 1e-9 || Math.abs(cross(moins(H, M), [a, b])) > 1e-9 || !egal(H[0], math.evaluate(String(e.pa))) || !egal(H[1], math.evaluate(String(e.pb)))) faux(e, id + ' ' + F); compte('21.10');
          }
          else if (id === '21.11 a)') {
            const M = cv(pointsDe(tx).M), [a, b, c] = coefsLin(eqDe(tx)), d = Math.abs(a * M[0] + b * M[1] + c) / Math.hypot(a, b);
            if (!egal(d, vt(F)) || !egal(d, Number(e.reponse))) faux(e, id + ' ' + F + ' / ' + d); compte('21.11a');
          }
          else if (id === '21.11 b)') {
            const P = pointsDe(tx), A = cv(P.A), B = cv(P.B), C = cv(P.C), BC = moins(C, B), d = Math.abs(cross(BC, moins(A, B))) / Math.hypot(BC[0], BC[1]);
            if (!egal(d, vt(F), 1e-9) || !egal(d, math.evaluate(String(e.reponse)), 1e-9)) faux(e, id + ' ' + F + ' / ' + d); compte('21.11b');
          }
          else if (id === '21.12') {
            const P = pointsDe(tx), A = cv(P.A), B = cv(P.B), [ta, tb, tc] = cv(F), cercle = (Q) => Q[0] * Q[0] + Q[1] * Q[1] + ta * Q[0] + tb * Q[1] + tc;
            if (Math.abs(cercle(A)) > 1e-9 || Math.abs(cercle(B)) > 1e-9 || !egal(-ta / 2, (A[0] + B[0]) / 2) || !egal(-tb / 2, (A[1] + B[1]) / 2)) faux(e, id + ' ' + F);
            if (!egal(ta, Number(e.ta)) || !egal(tb, Number(e.tb)) || !egal(tc, Number(e.tc))) faux(e, id + ' final different de la reponse'); compte('21.12');
          }
          else if (id === '21.13') {
            const m = tx.match(/\(x([+-]\d+)?\)\^2\+\(y([+-]\d+)?\)\^2=(\d+)/), h = -Number(m[1] || 0), k = -Number(m[2] || 0), A = cv(pointsDe(tx).A), [a, b, c] = coefsLin(F.replace(/=\s*0$/, ''));
            if (Math.abs(a * A[0] + b * A[1] + c) > 1e-9 || Math.abs(cross([a, b], moins(A, [h, k]))) > 1e-9 || Math.abs((A[0] - h) ** 2 + (A[1] - k) ** 2 - Number(m[3])) > 1e-9) faux(e, id + ' ' + F);
            if (!egal(a, Number(e.eqa)) || !egal(b, Number(e.eqb)) || !egal(c, Number(e.eqc))) faux(e, id + ' final different de la reponse'); compte('21.13');
          }
          else if (id === '21.14') {
            const [a, b, c] = coefsLin(eqDe(tx)), O = cv('(' + tx.match(/\\Omega\((.*?)\)/)[1] + ')'), [ta, tb, tc] = cv(F), centre = [-ta / 2, -tb / 2], r2 = (ta * ta + tb * tb) / 4 - tc, d2 = (a * O[0] + b * O[1] + c) ** 2 / (a * a + b * b);
            if (!egal(centre[0], O[0]) || !egal(centre[1], O[1]) || !egal(r2, d2, 1e-9) || r2 <= 0) faux(e, id + ' ' + F);
            if (!egal(ta, Number(e.ta)) || !egal(tb, Number(e.tb)) || !egal(tc, math.evaluate(String(e.tc)))) faux(e, id + ' final different de la reponse'); compte('21.14');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
