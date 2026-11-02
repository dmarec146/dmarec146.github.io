// Recalcul independant de la fiche 4 de Terminale (equations differentielles II) : equations et conditions lues dans l enonce AFFICHE ; chaque solution est testee numeriquement (derivee, condition, famille de solutions), sans les fonctions de la fiche
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/terminale/cahier-2/fiche-04.html';
(async () => {
  const s = http.createServer((req, res) => { const f = path.join(RACINE, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0, '127.0.0.1');
  await new Promise((r) => s.on('listening', r));
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${s.address().port}/${FICHE}`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof exercices !== 'undefined' && window.math && document.querySelector('.question'), null, { timeout: 40000 });
  const r = await p.evaluate((N) => {
    let ou = '';
    const defauts = [], stats = {}; const compte = (k) => { stats[k] = (stats[k] || 0) + 1; };
    const faux = (e, m) => { if (defauts.length < 14) defauts.push(e.id + ' : ' + m + ' | ' + String(e.enonce).replace(/\s+/g, ' ').slice(0, 120)); };
    const proche = (a, c, tol = 1e-7) => Math.abs(a - c) <= tol * (1 + Math.abs(a) + Math.abs(c));
    const mj = (t) => {
      let u = String(t).replace(/\\displaystyle|\\textstyle/g, '').replace(/\\(cos|sin)/g, '$1').replace(/\{,\}/g, '.').replace(/\\left|\\right|\\,|\\ /g, ' ').replace(/\\times/g, '*').replace(/\\div/g, '/').replace(/\\frac/g, '\\dfrac');
      for (let i = 0; i < 8; i++) u = u.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
      u = u.replace(/\{/g, '(').replace(/\}/g, ')').replace(/([ABC])(?=[a-zA-Z])/g, '$1*').replace(/([A-DF-Za-df-z])e(?=\^)/g, '$1*e');
      return u.replace(/(\d)\s*\(/g, '$1*(').replace(/\)\s*(\d)/g, ')*$1').replace(/(\d)\s*([a-zA-Z])/g, '$1*$2').replace(/\)\s*\(/g, ')*(').replace(/\)\s*([a-zA-Z])/g, ')*$1');
    };
    const val = (t, sc) => math.evaluate(mj(t), sc || {});
    const T = (k) => String(paramsAvances['t' + k] || '');
    const formules = (s) => (String(s).match(/\\\((.*?)\\\)/g) || []).map((x) => x.slice(2, -2));
    const derivee = (F, x) => (F(x + 1e-5) - F(x - 1e-5)) / 2e-5;
    // equation « gauche = droite » en y', y, x lue dans l'ecriture affichee : residu au point (x, u, u')
    const residu = (tex, u, du, x) => { const [g, d] = String(tex).replace(/y'/g, ' yp ').split('='); const sc = { yp: du, y: u, x }; return val(g, sc) - val(d, sc); };
    const resout = (tex, F, xs) => xs.every((x) => { const u = F(x), du = derivee(F, x); return proche(residu(tex, u, du, x), 0, 1e-5) || Math.abs(residu(tex, u, du, x)) <= 1e-5 * (1 + Math.abs(u) + Math.abs(du)); });
    const XR = [-0.4, 0.3, 0.9], XP = [0.6, 1.3, 2.1], CS = [-1.3, 0.4, 2.2];
    const famValide = (e, tex, xs) => {
      for (const C of CS) { const F = (x) => math.evaluate(e.reponse, { x, C }); if (!resout(tex, F, xs)) return false; }
      const F1 = (x) => math.evaluate(e.reponse, { x, C: 1 }), F0 = (x) => math.evaluate(e.reponse, { x, C: 0 });
      return xs.some((x) => Math.abs(F1(x) - F0(x)) > 1e-6);   // la constante intervient vraiment
    };
    // la correction ecrite (LaTeX) est la meme fonction que la reponse attendue
    const memeCorrection = (e, xs) => { if (!e.correctionLatex || typeof e.reponse !== 'string' || e.type === 'paire' || e.type === 'triplet' || e.type === 'qcm' || e.type === 'num') return true; return xs.every((x) => proche(val(e.correctionLatex, { x, C: 1.7, A: 1.3, B: -0.6 }), math.evaluate(e.reponse, { x, C: 1.7, A: 1.3, B: -0.6 }), 1e-6)); };
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      const par = (id) => ex.find((e) => e.id === id);
      for (const e of ex) if (/undefined|NaN|Infinity/.test(String(e.enonce) + String(e.reponse === undefined ? '' : e.reponse) + String(e.correctionLatex || ''))) faux(e, 'valeur invalide');
      try {
        for (const e of ex) { if (!memeCorrection(e, XR)) faux(e, 'correction affichee differente de la reponse attendue'); }
        ou = '4.1'; // ---- 4.1 : developpement, valeur de l'expression affichee ----
        for (const id of ['4.1 a)', '4.1 b)']) { const e = par(id); for (const x of [0, 0.7, -1.3, 2.1]) if (!proche(val(e.enonce, { x }), math.evaluate(e.reponse, { x }))) faux(e, id + ' developpement'); compte('4.1'); }
        ou = '4.2'; // ---- 4.2 : valeur de l'expression affichee, reponse sans racine au denominateur ----
        for (const id of ['4.2 a)', '4.2 b)']) { const e = par(id); if (!proche(val(e.enonce), math.evaluate(e.reponse))) faux(e, id + ' valeur'); if (/sqrt\([^)]*\)\s*\)?\s*\/\s*sqrt|\/\s*sqrt/.test(e.reponse)) faux(e, id + ' racine au denominateur'); compte('4.2'); }
        ou = '4.3'; // ---- 4.3 : y' = ay + px + q ----
        {
          const eq = formules(T(3))[1];
          const eA = par('4.3 a)'), eqA = formules(eA.enonce).slice(-1)[0];
          if (!famValide(eA, eqA, XR)) faux(eA, '4.3 a) famille de y\' = ay');
          const eB = par('4.3 b)'), a = math.evaluate(eB.pa), b = math.evaluate(eB.pb);
          if (!resout(eq, (x) => a * x + b, XR)) faux(eB, '4.3 b) couple (' + eB.pa + ';' + eB.pb + ') : phi ne verifie pas (E)');
          const eC = par('4.3 c)'); if (!famValide(eC, eq, XR)) faux(eC, '4.3 c) famille de (E)');
          const eD = par('4.3 d)'), k = Number(eD.enonce.match(/f\(0\)=(-?\d+)/)[1]), F = (x) => math.evaluate(eD.reponse, { x });
          if (!resout(eq, F, XR) || !proche(F(0), k)) faux(eD, '4.3 d) solution ou condition f(0)=' + k + ' : f(0) = ' + F(0));
          compte('4.3');
        }
        ou = '4.4'; // ---- 4.4 : y' + py = c e^{-px} ----
        {
          const eq = formules(T(4))[1];
          const eA = par('4.4 a)'), r = val((eA.enonce.match(/e\^\{([^{}]*)\}/) || [])[1], { x: 1 }), aa = math.evaluate(eA.reponse);
          if (!resout(eq, (x) => aa * x * Math.exp(r * x), XR)) faux(eA, '4.4 a) a = ' + eA.reponse + ' ne convient pas');
          // unicite : une autre valeur ne convient pas
          if (resout(eq, (x) => (aa + 1) * x * Math.exp(r * x), XR)) faux(eA, '4.4 a) la valeur n\'est pas unique');
          const eB = par('4.4 b)'); if (!famValide(eB, eq, XR)) faux(eB, '4.4 b) famille de (E)');
          const eC = par('4.4 c)'), k = Number(eC.enonce.match(/f\(0\)=(-?\d+)/)[1]), F = (x) => math.evaluate(eC.reponse, { x });
          if (!resout(eq, F, XR) || !proche(F(0), k)) faux(eC, '4.4 c) solution ou condition');
          compte('4.4');
        }
        ou = '4.5'; // ---- 4.5 : y' - ay = c sin(x) ou c cos(x) ----
        {
          const eq = formules(T(5))[1];
          const eA = par('4.5 a)'), bonnes = eA.options.filter((o) => resout(eq, (x) => val(o.texte, { x }), XR)).map((o) => o.lettre);
          if (bonnes.length !== 1 || bonnes[0] !== eA.bonneReponse) faux(eA, '4.5 a) options qui conviennent : ' + bonnes.join(',') + ' / annonce ' + eA.bonneReponse);
          if (new Set(eA.options.map((o) => o.texte)).size !== 4) faux(eA, '4.5 a) options identiques');
          const eB = par('4.5 b)'); if (!famValide(eB, eq, XR)) faux(eB, '4.5 b) famille de (E)');
          const eC = par('4.5 c)'), k = Number(eC.enonce.match(/f\(0\)=(-?\d+)/)[1]), F = (x) => math.evaluate(eC.reponse, { x });
          if (!resout(eq, F, XR) || !proche(F(0), k)) faux(eC, '4.5 c) solution ou condition');
          compte('4.5');
        }
        ou = '4.6'; // ---- 4.6 : y' + py = (ux^2 + vx + w) e^{kx} ----
        {
          const eq = formules(T(6))[1], eA = par('4.6 a)'), rk = val((eA.enonce.match(/e\^\{([^{}]*)\}/) || [])[1], { x: 1 });
          const a = math.evaluate(eA.ta), b = math.evaluate(eA.tb), c = math.evaluate(eA.tc);
          if (!resout(eq, (x) => (a * x * x + b * x + c) * Math.exp(rk * x), XR)) faux(eA, '4.6 a) triplet (' + eA.ta + ';' + eA.tb + ';' + eA.tc + ') ne convient pas');
          if (resout(eq, (x) => ((a + 1) * x * x + b * x + c) * Math.exp(rk * x), XR) || resout(eq, (x) => (a * x * x + (b + 1) * x + c) * Math.exp(rk * x), XR) || resout(eq, (x) => (a * x * x + b * x + c + 1) * Math.exp(rk * x), XR)) faux(eA, '4.6 a) le triplet n\'est pas unique');
          const eB = par('4.6 b)'); if (!famValide(eB, eq, XR)) faux(eB, '4.6 b) famille de (E)');
          const eC = par('4.6 c)'), k0 = Number(eC.enonce.match(/f\(0\)=(-?\d+)/)[1]), F = (x) => math.evaluate(eC.reponse, { x });
          if (!resout(eq, F, XR) || !proche(F(0), k0)) faux(eC, '4.6 c) solution ou condition');
          compte('4.6');
        }
        ou = '4.7'; // ---- 4.7 : y'' + py' + qy = (ux + v) e^{kx} ----
        {
          const f7 = formules(T(7)), eqE = f7[1], eqH = f7[3];
          if (!/=0$/.test(eqH.replace(/\s/g, ''))) faux(ex[0], '4.7 equation homogene mal lue : ' + eqH);
          const eA = par('4.7 a)'), poly = formules(eA.enonce)[0], racines = eA.reponse.slice(1, -1).split(';').map(Number);
          if (racines.length !== 2 || racines[0] === racines[1] || racines.some((r) => Math.abs(val(poly, { r })) > 1e-9)) faux(eA, '4.7 a) racines ' + eA.reponse + ' de ' + poly);
          // les racines sont bien toutes les racines : la somme et le produit lus dans le polynome affiche
          const c0 = val(poly, { r: 0 }), c1 = val(poly, { r: 1 }) - c0 - 1;
          if (!proche(racines[0] + racines[1], -c1) || !proche(racines[0] * racines[1], c0)) faux(eA, '4.7 a) somme/produit des racines');
          const deriv2 = (F, x) => (F(x + 1e-3) - 2 * F(x) + F(x - 1e-3)) / 1e-6;
          const residu2 = (tex, F, x) => { const [g, d] = String(tex).replace(/y''/g, ' ypp ').replace(/y'/g, ' yp ').split('='); const sc = { ypp: deriv2(F, x), yp: derivee(F, x), y: F(x), x }; return val(g, sc) - val(d, sc); };
          const resout2 = (tex, F, xs) => xs.every((x) => Math.abs(residu2(tex, F, x)) <= 1e-4 * (1 + Math.abs(F(x)) + Math.abs(derivee(F, x)) + Math.abs(deriv2(F, x))));
          const fam2 = (e, tex) => {
            const G = (a, b) => (x) => math.evaluate(e.reponse, { x, A: a, B: b });
            for (const [a, b] of [[-1.3, 0.4], [2.2, -0.9], [0.7, 1.5]]) if (!resout2(tex, G(a, b), XR)) return false;
            const f1 = (x) => G(1, 0)(x) - G(0, 0)(x), f2 = (x) => G(0, 1)(x) - G(0, 0)(x);
            return Math.abs(f1(0.2) * f2(0.9) - f1(0.9) * f2(0.2)) > 1e-6;   // les deux constantes interviennent, independamment
          };
          const eB = par('4.7 b)'); if (!fam2(eB, eqH)) faux(eB, '4.7 b) famille de (E0)');
          const eC = par('4.7 c)'), rk = val((eC.enonce.match(/e\^\{([^{}]*)\}/) || [])[1], { x: 1 }), a = math.evaluate(eC.pa), b = math.evaluate(eC.pb);
          if (!resout2(eqE, (x) => (a * x + b) * Math.exp(rk * x), XR)) faux(eC, '4.7 c) couple (' + eC.pa + ';' + eC.pb + ') ne convient pas');
          const eD = par('4.7 d)'); if (!fam2(eD, eqE)) faux(eD, '4.7 d) famille de (E)');
          const eE = par('4.7 e)'), h0 = Number(eE.enonce.match(/h\(0\)=(-?\d+)/)[1]), h1 = Number(eE.enonce.match(/h'\(0\)=(-?\d+)/)[1]), H = (x) => math.evaluate(eE.reponse, { x });
          if (!resout2(eqE, H, XR) || !proche(H(0), h0, 1e-7) || !proche(derivee(H, 0), h1, 1e-5)) faux(eE, '4.7 e) solution ou conditions : h(0) = ' + H(0) + ', h\'(0) = ' + derivee(H, 0));
          compte('4.7');
        }
        { const ids = ex.map((e) => e.id), calculs = [...new Set(ids.map((i) => Number(i.match(/^4\.(\d+)/)[1])))]; if (calculs.join() !== '1,2,3,4,5,6,7') faux(ex[0], 'numerotation'); }
      } catch (er) { faux(ex[0], 'EXCEPTION dans ' + ou + ' : ' + er.message + ' | ' + (er.stack || '').split('\n')[1]); }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
