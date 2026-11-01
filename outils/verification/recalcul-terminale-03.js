// Recalcul independant de la fiche 3 de Terminale (equations differentielles I) : equation et condition lues dans l enonce AFFICHE ; chaque solution est testee numeriquement (derivee, condition, integrales par Simpson), sans les fonctions de la fiche
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/terminale/cahier-2/fiche-03.html';
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
    const proche = (a, c, tol = 1e-7) => Math.abs(a - c) <= tol * (1 + Math.abs(a) + Math.abs(c));
    const mj = (t) => {
      let u = String(t).replace(/\\displaystyle|\\textstyle/g, '').replace(/\{,\}/g, '.').replace(/\\left|\\right|\\,|\\ /g, ' ').replace(/\\times/g, '*').replace(/\\div/g, '/').replace(/\\frac/g, '\\dfrac');
      for (let i = 0; i < 8; i++) u = u.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
      u = u.replace(/\{/g, '(').replace(/\}/g, ')');
      return u.replace(/(\d)\s*\(/g, '$1*(').replace(/\)\s*(\d)/g, ')*$1').replace(/(\d)\s*([a-zA-Z])/g, '$1*$2').replace(/\)\s*\(/g, ')*(').replace(/\)\s*([a-zA-Z])/g, ')*$1');
    };
    const val = (t, sc) => math.evaluate(mj(t), sc || {});
    const T = (k) => String(paramsAvances['t' + k] || '');
    // lecture d'une equation differentielle affichee : chaque membre est une somme de termes « coef y' », « coef y » ou constante
    const membre = (s) => {
      const r = { yp: 0, y: 0, c: 0 };
      const termes = s.replace(/\s/g, '').replace(/([^{(^])-/g, '$1+-').split('+').filter((x) => x !== '');
      for (const t of termes) {
        const m = t.match(/^(.*?)(y'|y)$/);
        const coef = (k) => (k === '' ? 1 : k === '-' ? -1 : val(k));
        if (m) r[m[2] === "y'" ? 'yp' : 'y'] += coef(m[1]); else r.c += val(t);
      }
      return r;
    };
    const lireEquation = (tex) => { const [g, d] = tex.split('='); const G = membre(g), D = membre(d); const A = G.yp - D.yp; return { a: (D.y - G.y) / A, b: (D.c - G.c) / A }; };
    const enoncesEq = (e) => { const f = (String(e.enonce).match(/\\\((.*?)\\\)/g) || []).map((x) => x.slice(2, -2)); return { eq: f[0], cond: f[1] }; };
    const derivee = (F, x) => (F(x + 1e-5) - F(x - 1e-5)) / 2e-5;
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      const par = (id) => ex.find((e) => e.id === id);
      for (const e of ex) if (/undefined|NaN|Infinity/.test(String(e.enonce) + String(e.reponse) + String(e.correctionLatex || ''))) faux(e, 'valeur invalide');
      try {
        // ---- 3.1 : valeur de l'expression affichee (en plusieurs x pour b) ----
        for (const id of ['3.1 a)', '3.1 b)']) { const e = par(id); for (const x of [0, 0.7, -1.3]) if (!proche(val(e.enonce, { x }), math.evaluate(e.reponse))) faux(e, id + ' valeur'); compte('3.1'); }
        // ---- 3.2 : la solution verifie l'equation affichee et n'annule pas de denominateur ----
        for (const id of ['3.2 a)', '3.2 b)']) {
          const e = par(id), s = math.evaluate(e.reponse), [g, d] = e.enonce.split('=');
          if (!proche(val(g, { x: s }), val(d, { x: s }))) faux(e, id + ' solution fausse');
          const den = e.enonce.match(/\\dfrac\{[^{}]*\}\{([^{}]*)\}/); if (den && Math.abs(val(den[1], { x: s })) < 1e-9) faux(e, id + ' valeur interdite');
          if (math.fraction(e.reponse).d === 1) faux(e, id + ' solution entiere'); compte('3.2');
        }
        // ---- 3.3 et 3.5 : la famille donnee est l'ensemble des solutions de l'equation affichee ----
        for (const id of ['3.3 a)', '3.3 b)', '3.3 c)', '3.3 d)', '3.5 a)', '3.5 b)', '3.5 c)', '3.5 d)']) {
          const e = par(id), { a, b } = lireEquation(enoncesEq(e).eq);
          if (!proche(math.evaluate(e.taux), a) || !proche(math.evaluate(e.cste), -b / a)) faux(e, id + ' taux ou constante : ' + e.taux + ' ; ' + e.cste + ' / a=' + a + ' b=' + b);
          for (const C of [-2, 0.5, 3]) { const F = (x) => math.evaluate(e.reponse, { C, x }); for (const x of [-0.4, 0.3, 0.9]) if (!proche(derivee(F, x), a * F(x) + b, 1e-5)) faux(e, id + ' la famille ne verifie pas l\'equation'); }
          compte(id.slice(0, 3));
        }
        // ---- 3.4 et 3.6 : la solution verifie l'equation et la condition affichees ----
        for (const id of ['3.4 a)', '3.4 b)', '3.4 c)', '3.4 d)', '3.6 a)', '3.6 b)', '3.6 c)']) {
          const e = par(id), { eq, cond } = enoncesEq(e), { a, b } = lireEquation(eq), m = cond.match(/^f\((-?\d+)\)=(.*)$/), x0 = Number(m[1]), y0 = val(m[2]);
          const F = (x) => math.evaluate(e.reponse, { x });
          if (!proche(F(x0), y0)) faux(e, id + ' condition non verifiee : f(' + x0 + ') = ' + F(x0) + ' / ' + y0);
          for (const x of [-0.4, 0.3, 0.9]) if (!proche(derivee(F, x), a * F(x) + b, 1e-5)) faux(e, id + ' equation non verifiee');
          compte(id.slice(0, 3));
        }
        // ---- 3.7 : equation et integrale (methode de Simpson) ----
        {
          const e = par('3.7'), t7 = T(7), m = t7.match(/\\\((\d+)y'([+-])(\d+)y=0\\\)/), p = Number(m[1]), q = (m[2] === '-' ? 1 : -1) * Number(m[3]);
          const bornes = t7.match(/\\int_\{(-?\d+)\}\^\{(-?\d+)\}/), u = Number(bornes[1]), v = Number(bornes[2]), F = (x) => math.evaluate(e.reponse, { x });
          for (const x of [-0.4, 0.3, 0.9]) if (!proche(p * derivee(F, x), q * F(x), 1e-5)) faux(e, '3.7 equation');
          let I = 0; const n = 2000, h = (v - u) / n; for (let i = 0; i <= n; i++) I += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * F(u + i * h); I *= h / 3;
          if (!proche(I, 1, 1e-6)) faux(e, '3.7 integrale = ' + I); compte('3.7');
        }
        // ---- 3.8 : equation integrale verifiee en plusieurs x ----
        {
          const e = par('3.8'), t8 = T(8), m = t8.match(/\\\((\d*)\\displaystyle\\int_\{0\}\^\{x\}f\(t\)\\,\\mathrm\{d\}t\+(\d*)f\(x\)=(-?\d+)\\\)/);
          const mm = m[1] === '' ? 1 : Number(m[1]), q = m[2] === '' ? 1 : Number(m[2]), c = Number(m[3]), F = (x) => math.evaluate(e.reponse, { x });
          for (const X of [-0.8, 0.5, 1.7]) { let I = 0; const n = 2000, h = X / n; for (let i = 0; i <= n; i++) I += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * F(i * h); I *= h / 3; if (!proche(mm * I + q * F(X), c, 1e-6)) faux(e, '3.8 equation integrale en ' + X); }
          compte('3.8');
        }
        { const ids = ex.map((e) => e.id), calculs = [...new Set(ids.map((i) => Number(i.match(/^3\.(\d+)/)[1])))]; if (calculs.join() !== '1,2,3,4,5,6,7,8') faux(ex[0], 'numerotation'); }
      } catch (er) { faux(ex[0], 'EXCEPTION ' + er.message + ' | ' + (er.stack || '').split('\n')[1]); }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
