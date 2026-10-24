// Verification independante des details de Premiere 16 (inequations, equations, vecteurs : quadrillage, Chasles, parametres, colinearite, milieu, centre de gravite) : recalcul a partir de l'enonce affiche et du texte des figures
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/premiere/cahier-6/fiche-16.html';
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
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      mettreAJourTextesAvances();
      const T13 = document.getElementById('texte-16-13').textContent, T14 = document.getElementById('texte-16-14').textContent, fv = window.__f21vecteurs;
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (id === '16.1 a)' || id === '16.1 b)') {
            const q = premier(tx).match(/^(.*?)(\\leqslant|\\geqslant|\\lt|<|>)(.*)$/), op = q[2];
            const vrai = (x) => { const a = val(q[1], { x }), c = val(q[3], { x }); if (!isFinite(a) || !isFinite(c)) return null; const y = a - c; return op === '>' ? y > 1e-10 : op === '\\geqslant' ? y >= -1e-10 : op === '\\leqslant' ? y <= 1e-10 : y < -1e-10; };
            const err = memeEnsemble(F, vrai, -40, 40); if (err) faux(e, id + ' ' + err + ' ' + F); compte('16.1');
          }
          else if (id === '16.2 a)' || id === '16.2 b)') {
            const [g0, d0] = premier(tx).split('='), gg = (x) => val(g0, { x }) - val(d0, { x }), att = lireEnsemble(F);
            if (att.some((x) => !isFinite(gg(x)) || Math.abs(gg(x)) > 1e-8) || new Set(att).size !== att.length) faux(e, id + ' racine fausse ' + F);
            let nb = 0, prec = gg(-30.0013); for (let x = -30.0013 + 0.0101; x <= 30.0007; x += 0.0101) { const c = gg(x); if (isFinite(prec) && isFinite(c) && prec * c < 0 && Math.abs(prec) < 50 && Math.abs(c) < 50) nb++; prec = c; }
            if (nb !== att.length) faux(e, id + ' nombre de racines ' + nb + ' / ' + att.length + ' ' + F); compte('16.2');
          }
          else if (id === '16.3 a)' || id === '16.3 b)') { if (!proche(val(tx), val(F), 1e-9) || !proche(val(tx), math.evaluate(String(e.reponse)), 1e-9)) faux(e, id + ' ' + F + ' / ' + val(tx)); compte('16.3'); }
          else if (id === '16.4') { if (F !== e.bonneReponse || F !== 'c') faux(e, '16.4 lettre ' + F); compte('16.4'); }
          else if (/^16\.5 /.test(id)) {
            const vb = { AB: [-2, -2], CD: [0, 4] }, cible = evalVec(premier(tx).replace(/\\vec\{([uvwp])\}/g, '\\vec{$1}'), {}, {}, fv);
            const comb = [0, 1].map((k) => { const sc = { VAB: vb.AB[k], VCD: vb.CD[k] }; return math.evaluate(mj(String(F).replace(/\\overrightarrow\{(AB|CD)\}/g, ' V$1 ')), sc); });
            if (!egalVec(comb, cible)) faux(e, id + ' ' + F + ' donne ' + comb + ' / ' + cible); compte('16.5');
          }
          else if (/^16\.6 /.test(id)) {
            const cible = evalVec(premier(tx), P5), L = evalVec(F, P5);
            if (!egalVec(cible, L)) faux(e, id + ' ' + F + ' / ' + cible); compte('16.6');
          }
          else if (id === '16.7 a)') {
            const corps = premier(tx).replace(/^\\vec\{u\}=/, '').replace(/\\vec\{v\}/g, '').replace(/\\alpha/g, 'a'), co = (a) => val(corps, { a }), att = lireEnsemble(F);
            if (att.length !== 1 || Math.abs(co(att[0])) > 1e-9 || Math.abs(co(att[0] + 1) - co(att[0] + 2)) < 1e-12) faux(e, '16.7a ' + F); compte('16.7a');
          }
          else if (id === '16.7 b)') {
            const pts = pointsAleatoires(), corps = premier(tx).replace(/^\\vec\{u\}=/, ''), att = lireEnsemble(F);
            if (att.length !== 1) { faux(e, '16.7b ' + F); continue; }
            const u = evalVec(corps, pts, { a: att[0] }); if (!egalVec(u, [0, 0])) faux(e, '16.7b u non nul pour alpha = ' + att[0] + ' : ' + u);
            const u2 = evalVec(corps, pts, { a: att[0] + 1 }); if (egalVec(u2, [0, 0])) faux(e, '16.7b u nul aussi ailleurs'); compte('16.7b');
          }
          else if (/^16\.8 /.test(id) || /^16\.10 /.test(id) || /^16\.11 /.test(id) || id === '16.16') {
            const pts = pointsAleatoires(); pts.I = [(pts.A[0] + pts.B[0]) / 2, (pts.A[1] + pts.B[1]) / 2];
            let corps = premier(tx).replace(/^Simplifier /, '').replace(/^\\vec\{u\}=/, '');
            const sc = { a: 0.37 + (tt % 5) * 0.23 };
            const lu = evalVec(corps, pts, sc), att = F.trim() === '\\vec{0}' ? [0, 0] : (e.type === 'texte' ? reponseVec(e.reponse, pts, sc) : null);
            const fin = evalVec(F, pts, sc);
            if (!egalVec(lu, fin) || (att && !egalVec(lu, att))) faux(e, id + ' ' + F + ' / enonce ' + lu + ' / final ' + fin + ' / reponse ' + att); compte('16.8-11');
          }
          else if (id === '16.9') {
            const pts = pointsAleatoires(), corps = tx.match(/pour que \\\((.*)=\\vec\{0\}\\\)/)[1], pX = [0, 1].map((k) => { const sc = {}; for (const [n, q] of Object.entries(pts)) sc[nom(n)] = q[k]; sc.X = 0; const s0 = math.evaluate(vecMj(corps), sc); sc.X = 1; const s1 = math.evaluate(vecMj(corps), sc); return -s0 / (s1 - s0); });
            const opt = e.options.find((o) => o.lettre === F); if (!opt || !egalVec(pts[opt.texte], pX) || e.bonneReponse !== F) faux(e, '16.9 ' + F); compte('16.9');
          }
          else if (/^16\.12 /.test(id)) { if (F !== e.bonneReponse) faux(e, id + ' lettre'); compte('16.12'); }
          else if (id === '16.13') {
            const pts = pointsAleatoires(), corps = T13.match(/tel que \\\((.*?)=\\vec\{0\}\\\)/)[1];
            const G = [0, 1].map((k) => { const sc = {}; for (const [n, q] of Object.entries(pts)) sc[nom(n)] = q[k]; sc.G = 0; const s0 = math.evaluate(vecMj(corps), sc); sc.G = 1; const s1 = math.evaluate(vecMj(corps), sc); return -s0 / (s1 - s0); });
            const p2 = { ...pts, G }; if (!egalVec(evalVec(F.replace(/^.*$/, F), p2), evalVec('\\overrightarrow{GA}', p2))) faux(e, '16.13 ' + F); compte('16.13');
          }
          else if (id === '16.14') {
            const m = T14.match(/\\overrightarrow\{AP\}=(.*?)\\overrightarrow\{BA\}, \\overrightarrow\{NC\}=(.*?)\\overrightarrow\{BC\} et \\overrightarrow\{AM\}=(.*?)\\overrightarrow\{AC\}/) || T14.match(/\\overrightarrow\{AP\}=(.*?)\\overrightarrow\{BA\}, \\\(\\overrightarrow\{NC\}=(.*?)\\overrightarrow\{BC\}\\\)/);
            const mm = [...T14.matchAll(/\\overrightarrow\{(AP|NC|AM)\}=([^\\]*?(?:\\dfrac\{\d+\}\{\d+\})?)\\overrightarrow\{(BA|BC|AC)\}/g)];
            const k = {}; mm.forEach((x) => { k[x[1]] = coefFrac(x[2]); });
            const pts = pointsAleatoires(), A = pts.A, B = pts.B, C = pts.C;
            pts.P = [A[0] + k.AP * (A[0] - B[0]), A[1] + k.AP * (A[1] - B[1])]; pts.N = [C[0] - k.NC * (C[0] - B[0]), C[1] - k.NC * (C[1] - B[1])]; pts.M = [A[0] + k.AM * (C[0] - A[0]), A[1] + k.AM * (C[1] - A[1])];
            const pn = evalVec('\\overrightarrow{PN}', pts);
            const t = coefFrac(F.replace(/\\overrightarrow\{PM\}/, ''));
            if (!egalVec(pn, [t * (pts.M[0] - pts.P[0]), t * (pts.M[1] - pts.P[1])])) faux(e, '16.14 ' + F + ' k=' + JSON.stringify(k)); compte('16.14');
          }
          else if (id === '16.15') {
            const m = tx.match(/\\vec\{u\}=(\d*)\\overrightarrow\{AB\}/), m1 = m[1] === '' ? 1 : Number(m[1]), pts = pointsAleatoires();
            for (const a of [0.4, 2.3, -1.7]) {
              const u = evalVec(`${m1}\\overrightarrow{AB}+${m1}(${a * a}-1)\\overrightarrow{AC}`, pts), v = evalVec(`\\dfrac{1}{${a}-1}\\overrightarrow{AB}+(${a}+1)\\overrightarrow{AC}`, pts), coef = val(F.replace(/\\vec\{v\}/, '').replace(/\\alpha/g, 'a'), { a });
              if (!egalVec(u, [coef * v[0], coef * v[1]])) faux(e, '16.15 ' + F + ' en a=' + a);
            }
            compte('16.15');
          }
          else if (/^16\.17 /.test(id)) {
            const pts = pointsAleatoires();
            if (id === '16.17 a)' || id === '16.17 b)') { if (!egalVec(evalVec(F, pts), evalVec('\\overrightarrow{AG}', pts))) faux(e, id + ' ' + F); }
            else { const lu = evalVec(premier(tx).replace(/^Simplifier la somme /, ''), pts); if (!egalVec(lu, [0, 0]) || F !== '\\vec{0}') faux(e, id + ' somme non nulle ' + lu); }
            compte('16.17');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
