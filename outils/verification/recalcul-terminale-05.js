// Recalcul independant de la fiche 5 de Terminale (derivee des fonctions composees) : la fonction f est lue dans l enonce AFFICHE ; chaque derivee, nombre derive et tangente est comparee a la derivee numerique, sans les fonctions de la fiche
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/terminale/cahier-3/fiche-05.html';
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
      let u = String(t).replace(/\\displaystyle|\\textstyle/g, '').replace(/\\(small|scriptsize)/g, '').replace(/\\(cos|sin|ln|exp)/g, '$1').replace(/\{,\}/g, '.').replace(/\\left|\\right|\\,|\\ /g, ' ').replace(/\\times/g, '*').replace(/\\div/g, '/').replace(/\\frac/g, '\\dfrac');
      for (let i = 0; i < 8; i++) u = u.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
      u = u.replace(/\{/g, '(').replace(/\}/g, ')').replace(/([A-DF-Za-df-z])e(?=\^)/g, '$1*e').replace(/(^|[^a-zA-Z])x\s*\(/g, '$1x*(');
      return u.replace(/(\d)\s*\(/g, '$1*(').replace(/\)\s*(\d)/g, ')*$1').replace(/(\d)\s*([a-zA-Z])/g, '$1*$2').replace(/\)\s*\(/g, ')*(').replace(/\)\s*([a-zA-Z])/g, ')*$1');
    };
    const val = (t, sc) => math.evaluate(mj(t), sc || {});
    const formules = (s) => (String(s).match(/\\\((.*?)\\\)/g) || []).map((x) => x.slice(2, -2));
    const D1 = (F, x) => (F(x + 1e-5) - F(x - 1e-5)) / 2e-5;
    const D2 = (F, x) => (F(x + 1e-3) - 2 * F(x) + F(x - 1e-3)) / 1e-6;
    const XR = [-1.1, -0.45, 0.3, 0.9, 1.4];
    // f lue dans l'enonce AFFICHE : « f(x)=... »
    const lireF = (e) => { const t = formules(e.enonce).find((s) => /^f\(x\)=/.test(s)); if (!t) throw new Error('f(x) introuvable'); const src = t.replace(/^f\(x\)=/, ''); return (x) => val(src, { x }); };
    const lireA = (e) => Number(formules(e.enonce).map((s) => s.match(/^a=(-?\d+)$/)).filter(Boolean)[0][1]);
    const rep = (e) => (x) => math.evaluate(e.reponse, { x });
    // la correction ecrite (LaTeX) est la meme fonction que la reponse attendue
    const memeCorrection = (e) => { if (!e.correctionLatex || typeof e.reponse !== 'string' || e.type === 'num' || e.formeYax || !/^5\.(1|2|3|4|7|8|9|10)/.test(e.id)) return true; return XR.every((x) => proche(val(e.correctionLatex, { x }), math.evaluate(e.reponse, { x }), 1e-9)); };
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      const par = (id) => ex.find((e) => e.id === id);
      for (const e of ex) if (/undefined|NaN|Infinity/.test(String(e.enonce) + String(e.reponse === undefined ? '' : e.reponse) + String(e.correctionLatex || ''))) faux(e, 'valeur invalide');
      try {
        for (const e of ex) { ou = 'correction ' + e.id; if (!memeCorrection(e)) faux(e, 'correction affichee differente de la reponse attendue'); }
        // la ligne finale du detail est la meme fonction que la reponse attendue
        for (const e of ex) { ou = 'final ' + e.id; if (e.detail && /^5\.(3|4|6|7|8|9|10)/.test(e.id)) { const f = e.detail.final.replace(/^y\s*=\s*/, ''); if (!XR.every((x) => proche(val(f, { x }), math.evaluate(e.reponse, { x }), 1e-9))) faux(e, 'detail.final different de la reponse attendue'); } }
        ou = '5.1';
        for (const id of ['5.1 a)', '5.1 b)', '5.1 c)']) { const e = par(id); for (const x of [0, 0.7, -1.3, 2.1]) if (!proche(val(e.enonce, { x }), math.evaluate(e.reponse, { x }))) faux(e, id + ' developpement'); compte('5.1'); }
        ou = '5.2';
        for (const id of ['5.2 a)', '5.2 b)', '5.2 c)']) { const e = par(id); for (const x of [0, 0.7, -1.3, 2.1]) if (!proche(val(e.enonce, { x }), math.evaluate(e.reponse, { x }))) faux(e, id + ' factorisation'); if (/^[^*]*$/.test(e.reponse.replace(/\^[0-9]/g, ''))) faux(e, id + ' pas un produit'); compte('5.2'); }
        // derivees : la reponse attendue est la derivee numerique de la fonction affichee
        for (const id of ['5.3 a)', '5.3 b)', '5.3 c)', '5.3 d)', '5.4 a)', '5.4 b)', '5.4 c)', '5.4 d)', '5.7 a)', '5.7 b)', '5.7 c)', '5.7 d)', '5.8 a)', '5.8 b)', '5.8 c)', '5.9 a)', '5.9 b)', '5.9 c)']) {
          ou = id; const e = par(id), F = lireF(e), G = rep(e);
          for (const x of XR) if (!proche(D1(F, x), G(x), 1e-5)) faux(e, id + ' derivee numerique ' + D1(F, x) + ' <> reponse ' + G(x) + ' en x = ' + x);
          if (/^5\.[789]/.test(id)) {
            if (!(e.nbFacteurs >= 1)) faux(e, id + ' nombre de facteurs ' + e.nbFacteurs);
            if (!estFactoriseComplet(e.reponse, e.formeFactorisee, e.nbFacteurs)) faux(e, id + ' la reponse attendue ne passe pas sa propre forme factorisee');
            if (!egaliteFonction(e.reponse, e.reponse)) faux(e, id + ' egalite de fonctions');
          }
          compte(id.slice(0, 3));
        }
        ou = '5.10';
        { const e = par('5.10'), F = lireF(e), G = rep(e); for (const x of XR) if (!proche(D2(F, x), G(x), 1e-4)) faux(e, '5.10 derivee seconde ' + D2(F, x) + ' <> reponse ' + G(x)); compte('5.10'); }
        ou = '5.5';
        for (const id of ['5.5 a)', '5.5 b)']) { const e = par(id), F = lireF(e), a = lireA(e), v = math.evaluate(e.reponse); if (!proche(D1(F, a), v, 1e-5)) faux(e, id + ' nombre derive ' + D1(F, a) + ' <> ' + v); compte('5.5'); }
        ou = '5.6';
        for (const id of ['5.6 a)', '5.6 b)']) {
          const e = par(id), F = lireF(e), a = lireA(e), m = D1(F, a), p = F(a) - m * a, G = rep(e);
          if (!e.formeYax) faux(e, id + ' forme y= absente');
          if (!proche(G(0), p, 1e-5) || !proche(G(1) - G(0), m, 1e-5)) faux(e, id + ' tangente : attendu pente ' + m + ' ordonnee ' + p + ', reponse ' + G(0) + ' / ' + (G(1) - G(0)));
          compte('5.6');
        }
        { const ids = ex.map((e) => e.id), calculs = [...new Set(ids.map((i) => Number(i.match(/^5\.(\d+)/)[1])))]; if (calculs.join() !== '1,2,3,4,5,6,7,8,9,10') faux(ex[0], 'numerotation'); }
      } catch (er) { faux(ex[0], 'EXCEPTION dans ' + ou + ' : ' + er.message + ' | ' + (er.stack || '').split('\n')[1]); }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
