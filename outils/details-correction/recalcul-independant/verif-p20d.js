// Verification independante des details de Premiere 20 (produit scalaire : inequations, equations, coordonnees, norme, cosinus, orthogonalite, droites par point et vecteur normal, rectangle, tangentes perpendiculaires) : recalcul a partir de l'enonce affiche (valeurs numeriques, zeros trouves par minimisation), sans lire le raisonnement des etapes.
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/premiere/cahier-8/fiche-20.html';
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
    const prep = (t) => String(t).replace(/\^\{?\\circ\}?/g, '').replace(/\\ \\text\{rad\}/g, '').replace(/\\left\|(.*?)\\right\|/g, 'abs($1)').replace(/\|([^|]*)\|/g, 'abs($1)').replace(/\\(cos|sin|tan)/g, '$1').replace(/\\pi/g, 'pi');
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
    const pointsDe = (txt) => { const o = {}; for (const m of String(txt).matchAll(/\\\(([A-E])((?:\\left)?\(.*?(?:\\right)?\))\\\)/g)) o[m[1]] = m[2]; return o; };
    const vecteurDe = (txt, nm) => { const deb = '\\vec{' + nm + '}\\begin{pmatrix}'; const i = txt.indexOf(deb); if (i < 0) throw new Error('vecteur ' + nm + ' absent'); const j = txt.indexOf('\\end{pmatrix}', i); return txt.slice(i + deb.length, j).split('\\\\'); };
    const egalP = (u, w) => proche(u[0], w[0], 1e-8) && proche(u[1], w[1], 1e-8);
    const moins = (B, A) => [B[0] - A[0], B[1] - A[1]];
    const scal = (u, w) => u[0] * w[0] + u[1] * w[1];
    const ensemble = (F) => { if (F === '\\emptyset') return []; return F.match(/^\\\{(.*)\\\}$/)[1].split('\\,;\\,').map((z) => vt(z)).sort((u, w) => u - w); };
    const texteId = (id) => { const el = document.getElementById(id); return el ? el.textContent : ''; };
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      mettreAJourTextesAvances();
      const T6 = texteId('texte-20-6'), T10 = texteId('titre-20-10'), T11 = texteId('titre-20-11'), T12 = texteId('texte-20-12'), T13 = texteId('titre-20-13'), T14 = texteId('titre-20-14');
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (id === '20.1 a)' || id === '20.1 b)') {
            const q = premier(tx).match(/^(.*?)(\\leqslant|\\geqslant|\\lt|<|>)(.*)$/), op = q[2];
            const vrai = (x) => { const a = vt(q[1], { x }), c = vt(q[3], { x }); if (!isFinite(a) || !isFinite(c)) return null; const y = a - c; return op === '>' ? y > 1e-10 : op === '\\geqslant' ? y >= -1e-10 : op === '\\leqslant' ? y <= 1e-10 : y < -1e-10; };
            const err = memeEnsemble(F, vrai, -40, 40); if (err) faux(e, id + ' ' + err + ' ' + F); compte('20.1');
          }
          else if (id === '20.2 a)') {
            const [g0, d0] = premier(tx).split('='), c = vt(d0), gg = (x) => vt(g0, { x }) - c, att = ensemble(F);
            if (c < 0) { if (att.length) faux(e, id + ' devrait etre vide'); for (const x of [-7, -1.3, 0, 2.2, 9]) if (gg(x) <= 0) faux(e, id + ' g <= 0'); }
            else if (c === 0) { if (att.length !== 1 || Math.abs(gg(att[0])) > 1e-9 || gg(att[0] + 0.3) <= 0 || gg(att[0] - 0.3) <= 0) faux(e, id + ' cas c = 0 ' + F); }
            else { if (att.some((x) => Math.abs(gg(x)) > 1e-8) || racinesReelles(gg, -150, 150, 0.0207) !== att.length || new Set(att).size !== att.length) faux(e, id + ' ' + F); }
            compte('20.2a');
          }
          else if (id === '20.2 b)') {
            const [g0, d0] = premier(tx).split('='), gg = (x) => vt(g0, { x }) - vt(d0, { x }), att = ensemble(F);
            if (att.some((x) => !isFinite(gg(x)) || Math.abs(gg(x)) > 1e-8) || racinesReelles(gg, -80, 80, 0.00311) !== att.length) faux(e, id + ' ' + F); compte('20.2b');
          }
          else if (id === '20.3 a)') {
            const P = pointsDe(tx), A = cv(P.A), B = cv(P.B), C = cv(P.C), m = tx.match(/\\vec\{p\}=(.*?)\\overrightarrow\{AB\}(.*?)\\overrightarrow\{AC\}/), co = (s) => (s === '' || s === '+' ? 1 : s === '-' ? -1 : Number(s.replace(/^\+/, '')));
            const u = co(m[1]), v = co(m[2]), AB = moins(B, A), AC = moins(C, A), att = [u * AB[0] + v * AC[0], u * AB[1] + v * AC[1]];
            if (!egalP(cv(F), att) || !egalP(att, [Number(e.pa), Number(e.pb)])) faux(e, id + ' ' + F + ' / ' + att); compte('20.3a');
          }
          else if (id === '20.3 b)') {
            const P = pointsDe(tx), AB = moins(cv(P.B), cv(P.A)), n = Math.hypot(AB[0], AB[1]);
            if (!egal(n, vt(F), 1e-9) || !egal(n, math.evaluate(String(e.reponse)), 1e-9)) faux(e, id + ' ' + F + ' / ' + n); compte('20.3b');
          }
          else if (id === '20.4 a)' || id === '20.4 b)') {
            const m = [...tx.matchAll(/\\\((.*?)\\\)/g)].map((z) => z[1]), n1 = vt(m[1].replace(/^.*?\|=/, '').replace(/^\\\|\\vec\{u\}\\\|=/, '')), n2 = vt(m[2].replace(/^\\\|\\vec\{v\}\\\|=/, '')), ang = vt(m[3].replace(/^.*?\\right\)=/, '').replace(/\\ \[2\\pi\]$/, '')), p = n1 * n2 * Math.cos(ang);
            if (!egal(p, vt(F), 1e-9) || !egal(p, math.evaluate(String(e.reponse)), 1e-9)) faux(e, id + ' ' + F + ' / ' + p); compte('20.4ab');
          }
          else if (id === '20.4 c)') {
            const a = Number(tx.match(/côté \\\((\d+)\\\)/)[1]), tri = /équilatéral/.test(tx), pq = [...tx.matchAll(/\\overrightarrow\{([A-D])([A-D])\}/g)].map((z) => [z[1], z[2]]);
            const pts = tri ? { A: [0, 0], B: [a, 0], C: [a / 2, a * Math.sqrt(3) / 2] } : { A: [0, 0], B: [a, 0], C: [a, a], D: [0, a] };
            const vec = ([s, t]) => moins(pts[t], pts[s]), p = scal(vec(pq[0]), vec(pq[1]));
            if (!egal(p, vt(F), 1e-9) || !egal(p, math.evaluate(String(e.reponse)), 1e-9)) faux(e, id + ' ' + F + ' / ' + p); compte('20.4c');
          }
          else if (id === '20.5 a)') {
            const u = vecteurDe(tx, 'u').map((z) => vt(z)), v = vecteurDe(tx, 'v').map((z) => vt(z)), p = scal(u, v);
            if (!egal(p, vt(F)) || !egal(p, Number(e.reponse))) faux(e, id + ' ' + F + ' / ' + p); compte('20.5a');
          }
          else if (id === '20.5 b)') {
            const P = pointsDe(tx), p = scal(moins(cv(P.B), cv(P.A)), moins(cv(P.C), cv(P.A)));
            if (!egal(p, vt(F)) || !egal(p, Number(e.reponse))) faux(e, id + ' ' + F + ' / ' + p); compte('20.5b');
          }
          else if (/^20\.6 /.test(id)) {
            const P = pointsDe(T6), A = cv(P.A), B = cv(P.B), C = cv(P.C), u = moins(B, A), v = moins(C, A), p = scal(u, v), co = p / (Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1])), theta = Math.acos(co) * 180 / Math.PI;
            if (id === '20.6 a)') { if (!egal(p, vt(F)) || !egal(p, Number(e.reponse))) faux(e, id + ' ' + F + ' / ' + p); }
            else if (id === '20.6 b)') { if (!egal(co, vt(F), 1e-9) || !egal(co, math.evaluate(String(e.reponse)), 1e-9)) faux(e, id + ' ' + F + ' / ' + co); }
            else { const lu = Number(F.replace('{,}', '.')); if (Math.abs(lu - theta) > 0.0501 || Math.abs(lu - Number(e.reponse)) > 1e-9) faux(e, id + ' ' + F + ' / ' + theta); }
            compte('20.6');
          }
          else if (/^20\.7 /.test(id)) {
            const sansX = !/ où /.test(tx), xs = sansX ? [0] : [0.3, 1.7, -2.4], u = vecteurDe(tx, 'u'), v = vecteurDe(tx, 'v');
            const prods = xs.map((x) => scal(u.map((z) => vt(z, { x })), v.map((z) => vt(z, { x }))));
            if (prods.some((q) => Math.abs(q - prods[0]) > 1e-9)) faux(e, id + ' produit non constant ' + prods);
            const lettre = Math.abs(prods[0]) < 1e-9 ? 'a' : 'b';
            if (F !== lettre || e.bonneReponse !== lettre) faux(e, id + ' ' + F + ' / ' + prods[0]); compte('20.7');
          }
          else if (/^20\.8 /.test(id)) {
            const u = vecteurDe(tx, 'u'), v = vecteurDe(tx, 'v'), gg = (x) => scal(u.map((z) => vt(z, { x })), v.map((z) => vt(z, { x }))), att = ensemble(F);
            if (att.some((x) => Math.abs(gg(x)) > 1e-8) || racinesReelles(gg, -60, 60, 0.0213) !== att.length || new Set(att.map((z) => z.toFixed(9))).size !== att.length) faux(e, id + ' ' + F); compte('20.8');
          }
          else if (/^20\.(9|10|11)/.test(id)) {
            const Y = F.replace(/^y\s*=\s*/, ''), f = (x) => vt(Y, { x }), rep = (x) => math.evaluate(String(e.reponse).replace(/^y=/, ''), { x });
            for (const x of [-2.3, 0, 1.7, 4]) if (!egal(f(x), rep(x), 1e-9)) faux(e, id + ' final different de la reponse en x=' + x);
            let pt, n;
            if (id === '20.9 a)' || id === '20.9 b)') { const P = pointsDe(tx), cle = Object.keys(P)[0]; pt = cv(P[cle]); const nv = vecteurDe(tx, 'n').map((z) => vt(z)); n = nv; }
            else if (id === '20.10') {
              const ptTexte = T10.match(/par le point \\\(E(.*?)\\\) et/)[1], eqTexte = T10.match(/d'équation \\\((.*?)\\\)/)[1];
              pt = cv(ptTexte); const g = (x, y) => vt(eqTexte.split('=')[0], { x, y }); n = [g(1, 0) - g(0, 0), g(0, 1) - g(0, 0)]; if (Math.abs(g(2, 3) - (2 * n[0] + 3 * n[1] + g(0, 0))) > 1e-9) faux(e, id + ' droite D non lineaire');
              n = [-n[1], n[0]].map((z) => z);   // (D) a pour vecteur directeur (-b ; a) : la perpendiculaire l'a pour normale
            }
            else {
              const m = tx.match(/par le point \\\(([A-C])\\\) et perpendiculaire à la droite \\\(\(([A-C])([A-C])\)\\\)/), P = pointsDe(T11 || ''), nomsPts = pointsDe(T11);
              const Q = { A: cv(nomsPts.A), B: cv(nomsPts.B), C: cv(nomsPts.C) }; pt = Q[m[1]]; n = moins(Q[m[3]], Q[m[2]]);
            }
            // la droite passe par le point et son vecteur normal est n : n.(M - P) = 0 pour tout M de la droite
            for (const x of [-2.3, 0, 1.7, 4]) if (Math.abs(n[0] * (x - pt[0]) + n[1] * (f(x) - pt[1])) > 1e-8 * (1 + Math.abs(n[0]) + Math.abs(n[1]))) faux(e, id + ' ' + F + ' ne verifie pas la condition en x=' + x);
            compte('20.9-11');
          }
          else if (id === '20.12 a)') { compte('20.12a'); const P = pointsDe(T12); if (scal(moins(cv(P.B), cv(P.A)), moins(cv(P.C), cv(P.A))) !== 0 || F !== '0') faux(e, id + ' produit scalaire non nul'); }
          else if (id === '20.12 b)' || id === '20.12 c)') {
            const P = pointsDe(T12), A = cv(P.A), B = cv(P.B), C = cv(P.C);
            for (const [x, y] of [[0.4, -1.3], [3, 2], [-2.2, 5.1]]) {
              const attendu = id === '20.12 b)' ? scal(moins(C, A), moins([x, y], C)) : scal(moins(B, A), moins([x, y], B));
              if (!egal(attendu, vt(F, { x, y }), 1e-9)) faux(e, id + ' ' + F + ' en ' + x + ',' + y);
              if (!egal(attendu, math.evaluate(String(e.reponse), { x, y }), 1e-9)) faux(e, id + ' reponse attendue incorrecte');
            }
            compte('20.12bc');
          }
          else if (id === '20.12 d)') {
            const P = pointsDe(T12), A = cv(P.A), B = cv(P.B), C = cv(P.C), Dd = cv(F);
            if (scal(moins(B, A), moins(C, A)) !== 0 || !egalP(moins(Dd, B), moins(C, A)) || !egalP(moins(Dd, C), moins(B, A))) faux(e, id + ' ' + F + ' ne donne pas un rectangle'); compte('20.12d');
          }
          else if (id === '20.13') {
            const fx = T13.match(/f\(x\)=(.*?)\\\)\./)[1], f = (x) => vt(fx, { x }), fp = (x) => (f(x + 1e-6) - f(x - 1e-6)) / 2e-6, gg = (x) => fp(x) * fp(-x) + 1, att = ensemble(F);
            if (att.some((x) => Math.abs(gg(x)) > 1e-4) || racinesReelles(gg, -30, 30, 0.00931) !== att.length) faux(e, id + ' ' + F + ' / ' + fx); compte('20.13');
          }
          else if (id === '20.14') {
            const a = Number(T14.match(/f\(x\)=(-?\d*)x\^2/)[1].replace(/^-$/, '-1').replace(/^$/, '1')), ps = [...tx.matchAll(/\\\((.*?)\\\)/g)].map((z) => vt(z[1])), p = ps[1], att = ensemble(F);
            const gg = (b) => (2 * a * p + b) * (-2 * a * p + b) + 1;
            if (att.some((b) => Math.abs(gg(b)) > 1e-7) || racinesReelles(gg, -200, 200, 0.0137) !== att.length) faux(e, id + ' ' + F + ' (a=' + a + ', p=' + p + ')'); compte('20.14');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
