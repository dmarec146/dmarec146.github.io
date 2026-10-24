// Verification independante des details de Premiere 17 (inequations, equations, normes, vecteurs : points definis par relations vectorielles, parametres, combinaison, somme nulle, parallelisme, colinearite, milieu, determinants) : recalcul a partir de l'enonce affiche et des textes de groupe (texte-17-5, texte-17-7), sans lire le raisonnement des etapes.
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/premiere/cahier-6/fiche-17.html';
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
    const al = (t) => String(t).replace(/\\alpha/g, 'a').replace(/\\beta/g, 'b');
    // « (x;y) » ou « \left(x\,;\,y\right) » -> [texte x, texte y] (decoupe au point-virgule de profondeur 0)
    const decoupe = (s) => {
      s = String(s).replace(/\\left|\\right|\\,/g, '').trim(); if (s[0] === '(') s = s.slice(1, -1);
      let d = 0, cur = ''; const out = [];
      for (const ch of s) { if (ch === '(' || ch === '{') d++; if (ch === ')' || ch === '}') d--; if (ch === ';' && d === 0) { out.push(cur); cur = ''; } else cur += ch; }
      out.push(cur); return out;
    };
    const cv = (s, sc) => decoupe(s).map((t) => val(al(t), sc));
    const pointsDe = (txt) => { const o = {}; for (const m of String(txt).matchAll(/\\\(([A-D])((?:\\left)?\(.*?(?:\\right)?\))\\\)/g)) o[m[1]] = m[2]; return o; };
    const vecteurDe = (txt, nm) => { const deb = '\\vec{' + nm + '}\\begin{pmatrix}'; const i = txt.indexOf(deb); if (i < 0) throw new Error('vecteur ' + nm + ' absent'); const j = txt.indexOf('\\end{pmatrix}', i); return txt.slice(i + deb.length, j).split('\\\\'); };
    const egalP = (u, w) => proche(u[0], w[0], 1e-8) && proche(u[1], w[1], 1e-8);
    const moins = (B, A) => [B[0] - A[0], B[1] - A[1]];
    const racinesReelles = (gg) => { // nombre de vraies racines (changements de signe confirmes par dichotomie : un pole n'en est pas une)
      let nb = 0, xp = -15.0013, prec = gg(xp);
      for (let x = xp + 0.0207; x <= 15.0007; x += 0.0207) {
        const c = gg(x);
        if (isFinite(prec) && isFinite(c) && prec * c < 0) { let lo = xp, hi = x, flo = prec; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2, fm = gg(m); if (flo * fm <= 0) hi = m; else { lo = m; flo = fm; } } if (Math.abs(gg((lo + hi) / 2)) < 1e-6) nb++; }
        xp = x; prec = c;
      }
      return nb;
    };
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      mettreAJourTextesAvances();
      const T5 = document.getElementById('texte-17-5').textContent, T7 = document.getElementById('texte-17-7').textContent;
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (id === '17.1 a)' || id === '17.1 b)') {
            const q = premier(tx).match(/^(.*?)(\\leqslant|\\geqslant|\\lt|<|>)(.*)$/), op = q[2];
            const vrai = (x) => { const a = val(q[1], { x }), c = val(q[3], { x }); if (!isFinite(a) || !isFinite(c)) return null; const y = a - c; return op === '>' ? y > 1e-10 : op === '\\geqslant' ? y >= -1e-10 : op === '\\leqslant' ? y <= 1e-10 : y < -1e-10; };
            const err = memeEnsemble(F, vrai, -40, 40); if (err) faux(e, id + ' ' + err + ' ' + F); compte('17.1');
          }
          else if (id === '17.2 a)') {
            const [g0, d0] = premier(tx).split('='), gg = (x) => val(g0, { x }) - val(d0, { x }), att = lireEnsemble(F);
            if (att.some((x) => !isFinite(gg(x)) || Math.abs(gg(x)) > 1e-8) || new Set(att).size !== att.length) faux(e, id + ' racine fausse ' + F);
            if (racinesReelles(gg) !== att.length) faux(e, id + ' nombre de racines ' + F); compte('17.2a');
          }
          else if (id === '17.2 b)') {
            const [g0, d0] = premier(tx).split('='), gg = (x) => val(g0, { x }) - val(d0, { x }), att = lireEnsemble(F);
            if (att.length !== 1 || Math.abs(gg(att[0])) > 1e-8) { faux(e, id + ' racine fausse ' + F); continue; }
            for (const dx of [-3, -1.3, -0.4, 0.4, 1.3, 3]) if (gg(att[0] + dx) <= 1e-9) faux(e, id + ' autre zero en ' + (att[0] + dx));
            compte('17.2b');
          }
          else if (id === '17.3 a)' || id === '17.3 b)') { if (!proche(val(tx), val(F), 1e-9) || !proche(val(tx), math.evaluate(String(e.reponse)), 1e-9)) faux(e, id + ' ' + F + ' / ' + val(tx)); compte('17.3'); }
          else if (/^17\.4 /.test(id)) {
            const m = tx.match(/\\\(A(.*?)\\\) et \\\(B(.*?)\\\)/), sym = id === '17.4 d)';
            for (const n of sym ? [2, 3, 5] : [0]) {
              const A = cv(m[1], { n }), B = cv(m[2], { n }), att = cv(F, { n });
              if (!egalP(moins(B, A), att)) faux(e, id + ' ' + F + ' / calcul ' + moins(B, A) + ' (n=' + n + ')');
            }
            compte('17.4');
          }
          else if (/^17\.5 /.test(id)) {
            const P = pointsDe(T5), pts = {}; for (const k of ['A', 'B', 'C']) pts[k] = cv(P[k]);
            pts.D = cv(F); const [g, d] = premier(tx).split('=');
            const L = evalVec(g, pts), R = evalVec(d, pts);
            if (!egalVec(L, R)) faux(e, id + ' ' + F + ' donne ' + L + ' / ' + R); compte('17.5');
          }
          else if (id === '17.6 a)' || id === '17.6 b)') {
            const m = tx.match(/\\\(A(.*?)\\\) et \\\(B(.*?)\\\), où/), a0 = val(F);
            const f = (a) => moins(cv(m[2], { a }), cv(m[1], { a }));
            if (!egalP(f(a0), [0, -1])) faux(e, id + ' alpha = ' + F + ' donne ' + f(a0));
            if (egalP(f(a0 + 1), [0, -1]) || egalP(f(a0 - 0.7), [0, -1])) faux(e, id + ' alpha non unique'); compte('17.6ab');
          }
          else if (id === '17.6 c)') {
            const m = tx.match(/\\\(A(.*?)\\\) et \\\(B(.*?)\\\), où/), [a0, b0] = cv(F);
            const f = (a, b) => moins(cv(m[2], { a, b }), cv(m[1], { a, b })), z = f(a0, b0), d1 = moins(f(a0 + 1, b0), z), d2 = moins(f(a0, b0 + 1), z);
            if (!egalP(z, [0, 0])) faux(e, id + ' ' + F + ' donne ' + z);
            if (Math.abs(d1[0] * d2[1] - d1[1] * d2[0]) < 1e-9) faux(e, id + ' systeme non unique'); compte('17.6c');
          }
          else if (id === '17.7 a)') {
            const P = pointsDe(T7); if (!egalP(cv(F), moins(cv(P.B), cv(P.A)))) faux(e, id + ' ' + F); compte('17.7a');
          }
          else if (id === '17.7 b)') {
            const P = pointsDe(T7), AB = moins(cv(P.B), cv(P.A)), u = vecteurDe(T7, 'u').map((t) => val(t)), v = vecteurDe(T7, 'v').map((t) => val(t)), [a0, b0] = cv(F);
            if (!egalP([a0 * u[0] + b0 * v[0], a0 * u[1] + b0 * v[1]], AB)) faux(e, id + ' ' + F + ' ne donne pas AB');
            if (Math.abs(u[0] * v[1] - u[1] * v[0]) < 1e-9) faux(e, id + ' u et v colineaires'); compte('17.7b');
          }
          else if (id === '17.8 a)' || id === '17.8 b)') {
            const P = pointsDe(tx), sym = id === '17.8 b)';
            for (const a of sym ? [0.7, 1.9, -2.3] : [0]) {
              const A = cv(P.A, { a }), B = cv(P.B, { a }), C = cv(P.C, { a }), att = cv(F, { a }), M = att;
              const s = [A, B, C].map((Q) => moins(Q, M)); if (!egalP([s[0][0] + s[1][0] + s[2][0], s[0][1] + s[1][1] + s[2][1]], [0, 0])) faux(e, id + ' ' + F + ' (a=' + a + ')');
            }
            compte('17.8');
          }
          else if (/^17\.9 /.test(id)) {
            const P = pointsDe(tx), sym = id === '17.9 c)';
            for (const a of sym ? [1.3, 2, 3.7] : [0]) {
              const AB = moins(cv(P.B, { a }), cv(P.A, { a })), norme = Math.hypot(AB[0], AB[1]), r = e.type === 'alg' ? math.evaluate(String(e.reponse), { lam: a }) : math.evaluate(String(e.reponse));
              if (!proche(norme, val(al(F), { a }), 1e-9) || !proche(norme, r, 1e-9)) faux(e, id + ' ' + F + ' / norme ' + norme);
            }
            compte('17.9');
          }
          else if (id === '17.10 a)' || id === '17.10 b)') {
            const P = pointsDe(tx), A = cv(P.A), B = cv(P.B), C = cv(P.C), Dd = cv(P.D), AB = moins(B, A), CD = moins(Dd, C), det = AB[0] * CD[1] - AB[1] * CD[0];
            const opt = e.options.find((o) => o.lettre === F), paral = det === 0;
            if (!opt || e.bonneReponse !== F || /parallèles/.test(opt.texte) !== paral || /sécantes/.test(opt.texte) === paral) faux(e, id + ' lettre ' + F + ' det ' + det);
            if (paral && (AB[0] * moins(C, A)[1] - AB[1] * moins(C, A)[0]) === 0) compte('confondues'); compte('17.10');
          }
          else if (id === '17.11 a)' || id === '17.11 b)') {
            const sym = id === '17.11 b)', u = vecteurDe(tx, 'u'), v = vecteurDe(tx, 'v');
            for (const [a, n] of sym ? [[2.3, 2], [0.6, 3], [-1.7, 2]] : [[0, 0]]) {
              const uu = u.map((t) => val(al(t), { a, n })), vv = v.map((t) => val(al(t), { a, n })), lam = val(al(F), { a, n });
              if (!egalP(uu, [lam * vv[0], lam * vv[1]])) faux(e, id + ' lambda = ' + F + ' (a=' + a + ',n=' + n + ')');
              if (!sym && !proche(lam, math.evaluate(String(e.reponse)), 1e-9)) faux(e, id + ' reponse differente de F');
              if (sym && !proche(lam, math.evaluate(String(e.reponse), { lam: a }), 1e-9)) faux(e, id + ' reponse differente de F');
            }
            compte('17.11');
          }
          else if (id === '17.12 a)' || id === '17.12 b)') {
            const m = tx.match(/\\\(A(.*?)\\\) et \\\(B(.*?)\\\)/), sym = id === '17.12 b)';
            for (const a of sym ? [0.6, -1.7, 3.1] : [0]) {
              const A = cv(m[1], { a }), B = cv(m[2], { a }), att = cv(F, { a });
              if (!egalP(att, [(B[0] - A[0]) / 2, (B[1] - A[1]) / 2])) faux(e, id + ' ' + F + ' (a=' + a + ')');
            }
            compte('17.12');
          }
          else if (id === '17.13 a)' || id === '17.13 b)') {
            const u = vecteurDe(tx, 'u'), v = vecteurDe(tx, 'v');
            for (const a of [0.7, 1.9, -0.37]) {
              const uu = u.map((t) => val(al(t), { a })), vv = v.map((t) => val(al(t), { a })), det = uu[0] * vv[1] - uu[1] * vv[0];
              if (!proche(det, val(al(F), { a }), 1e-9) || !proche(det, math.evaluate(String(e.reponse), { lam: a }), 1e-9)) faux(e, id + ' ' + F + ' / det ' + det + ' (a=' + a + ')');
            }
            compte('17.13ab');
          }
          else if (id === '17.13 c)' || id === '17.13 d)') {
            const u = vecteurDe(tx, 'u'), v = vecteurDe(tx, 'v'), att = lireEnsemble(F);
            const gg = (a) => { const uu = u.map((t) => val(al(t), { a })), vv = v.map((t) => val(al(t), { a })); return uu[0] * vv[1] - uu[1] * vv[0]; };
            if (att.some((x) => !isFinite(gg(x)) || Math.abs(gg(x)) > 1e-8 || Math.abs(Math.abs(x) - 1) < 1e-9 && id === '17.13 d)') || new Set(att).size !== att.length) faux(e, id + ' racine fausse ' + F);
            if (racinesReelles(gg) !== att.length) faux(e, id + ' nombre de racines ' + racinesReelles(gg) + ' / ' + att.length + ' ' + F); compte('17.13cd');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
