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
    // f lue dans l'enonce AFFICHE (ou dans l'introduction du calcul) : « f(x)=... »
    const lireF = (e, source) => { const t = formules(source === undefined ? e.enonce : source).find((s) => /^f\(x\)=/.test(s)); if (!t) throw new Error('f(x) introuvable'); const src = t.replace(/^f\(x\)=/, ''); return (x) => val(src, { x }); };
    const lireA = (e) => Number(formules(e.enonce).map((s) => s.match(/^a=(-?\d+)$/)).filter(Boolean)[0][1]);
    const rep = (e) => (x) => math.evaluate(e.reponse, { x });
    // la correction ecrite (LaTeX) est la meme fonction que la reponse attendue
    const memeCorrection = (e) => { if (!e.correctionLatex || typeof e.reponse !== 'string' || e.type === 'num' || e.formeYax || !/^5\.(1|2|3|4|7|8|9|10|11)/.test(e.id)) return true; return [0.37, 0.9, -0.8, 1.3, -1.1].every((x) => proche(val(e.correctionLatex, { x }), math.evaluate(e.reponse, { x }), 1e-9)); };
    // ensemble de la specification d'intervalles
    const dans = (spec, t) => spec.liste.some((iv) => (t > iv.bas || (t === iv.bas && iv.inclusBas)) && (t < iv.haut || (t === iv.haut && iv.inclusHaut)));
    // convexite lue sur f'' (numerique) : bornes et abscisses d'inflexion
    const convexite = (e, F, racines) => {
      const spec = e.intervalleSpec;
      const pts = [];
      for (let t = -6.05; t < 6.2; t += 0.1) pts.push(t);
      for (const t of pts) { const d = D2(F, t); if (Math.abs(d) < 1e-4) continue; if ((d > 0) !== dans(spec, t)) faux(e, e.id + ' convexite en x = ' + t.toFixed(2) + ' : f\'\' = ' + d.toExponential(2)); }
      for (const r of racines) { if (!proche(D2(F, r), 0, 1e-3) && Math.abs(D2(F, r)) > 1e-3) faux(e, e.id + ' f\'\'(' + r + ') = ' + D2(F, r)); const inclus = spec.liste.some((iv) => iv.haut === r && iv.inclusHaut) || spec.liste.some((iv) => iv.bas === r && iv.inclusBas); if (!inclus) faux(e, e.id + ' borne ' + r + ' non incluse'); }
    };
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      const par = (id) => ex.find((e) => e.id === id);
      for (const e of ex) if (/undefined|NaN|Infinity/.test(String(e.enonce) + String(e.reponse === undefined ? '' : e.reponse) + String(e.correctionLatex || ''))) faux(e, 'valeur invalide');
      try {
        for (const e of ex) { ou = 'correction ' + e.id; if (!memeCorrection(e)) faux(e, 'correction affichee differente de la reponse attendue'); }
        // la ligne finale du detail est la meme fonction que la reponse attendue
        for (const e of ex) { ou = 'final ' + e.id; if (e.detail && /^5\.(3|4|6|7|8|9|10 a|11 a)/.test(e.id) && typeof e.reponse === 'string') { const f = e.detail.final.replace(/^y\s*=\s*/, ''); if (!XR.every((x) => proche(val(f, { x }), math.evaluate(e.reponse, { x }), 1e-9))) faux(e, 'detail.final different de la reponse attendue'); } }
        ou = '5.1';
        for (const id of ['5.1 a)', '5.1 b)']) {
          const e = par(id); for (const x of [0, 0.7, -1.3, 2.1]) if (!proche(val(e.enonce, { x }), math.evaluate(e.reponse, { x }))) faux(e, id + ' factorisation');
          if (MoteurReponses.verifierForme({ forme: 'factorise', reponse: e.reponse }, { ascii: e.reponse }) !== true) faux(e, id + ' la reponse attendue ne passe pas la forme factorisee du moteur');
          compte('5.1');
        }
        ou = '5.2';
        for (const id of ['5.2 a)', '5.2 b)']) {
          const e = par(id), enonce = val(e.enonce, { x: 0.37 });
          for (const x of [0.37, 1.9, -2.3, 3.1, 0.81]) if (!proche(val(e.enonce, { x }), math.evaluate(e.reponse, { x }), 1e-9)) faux(e, id + ' valeur de la fraction');
          if (!estMemeDenominateur(e.reponse, e.memeDenominateur, e.reponse)) faux(e, id + ' la reponse attendue ne passe pas sa propre forme');
          // le denominateur est bien le produit des denominateurs de l'enonce (les facteurs x - a et x - b ou b - x)
          // les poles de l'enonce : racine de chaque denominateur (affine) lu dans l'ecriture affichee
          const den = math.compile(e.memeDenominateur.den);
          for (const m of e.enonce.matchAll(/\\dfrac\{[^{}]*\}\{([^{}]*)\}/g)) { const d = (x) => val(m[1], { x }), pole = -d(0) / (d(1) - d(0)); if (Math.abs(den.evaluate({ x: pole })) > 1e-9) faux(e, id + ' le denominateur ne s\'annule pas en ' + pole); }
          compte('5.2');
        }
        // derivees : la reponse attendue est la derivee numerique de la fonction affichee
        for (const id of ['5.3 a)', '5.3 b)', '5.3 c)', '5.3 d)', '5.4 a)', '5.4 b)', '5.7 a)', '5.7 b)', '5.7 c)', '5.7 d)', '5.8 a)', '5.8 b)']) {
          ou = id; const e = par(id), F = lireF(e), G = rep(e);
          for (const x of XR) if (!proche(D1(F, x), G(x), 1e-5)) faux(e, id + ' derivee numerique ' + D1(F, x) + ' <> reponse ' + G(x) + ' en x = ' + x);
          if (/^5\.[78]/.test(id)) {
            if (!(e.nbFacteurs >= 1)) faux(e, id + ' nombre de facteurs ' + e.nbFacteurs);
            if (!estFactoriseComplet(e.reponse, e.formeFactorisee, e.nbFacteurs)) faux(e, id + ' la reponse attendue ne passe pas sa propre forme factorisee');
          }
          compte(id.slice(0, 3));
        }
        ou = '5.9';
        { const e = par('5.9'), F = lireF(e), G = rep(e); for (const x of XR) if (!proche(D2(F, x), G(x), 1e-4)) faux(e, '5.9 derivee seconde ' + D2(F, x) + ' <> reponse ' + G(x)); compte('5.9'); }
        ou = '5.5';
        for (const id of ['5.5 a)', '5.5 b)']) { const e = par(id), F = lireF(e), a = lireA(e), v = math.evaluate(e.reponse); if (!proche(D1(F, a), v, 1e-5)) faux(e, id + ' nombre derive ' + D1(F, a) + ' <> ' + v); compte('5.5'); }
        ou = '5.6';
        {
          const e = par('5.6'), F = lireF(e), a = lireA(e), m = D1(F, a), p = F(a) - m * a, G = rep(e);
          if (!e.formeYax) faux(e, '5.6 forme y= absente');
          if (!proche(G(0), p, 1e-5) || !proche(G(1) - G(0), m, 1e-5)) faux(e, '5.6 tangente : attendu pente ' + m + ' ordonnee ' + p + ', reponse ' + G(0) + ' / ' + (G(1) - G(0)));
          compte('5.6');
        }
        // calculs avances : f'' lue sur la fonction de l'introduction, convexite lue sur le signe de f'' numerique
        for (const [k, num] of [['10', '5.10'], ['11', '5.11']]) {
          ou = num;
          const F = lireF(null, paramsAvances['t' + k]);
          const ea = par(num + ' a)'), G = rep(ea); for (const x of XR) if (!proche(D2(F, x), G(x), 1e-4)) faux(ea, num + ' a) f\'\' numerique ' + D2(F, x) + ' <> reponse ' + G(x));
          if (!estFactoriseComplet(ea.reponse, ea.formeFactorisee, ea.nbFacteurs)) faux(ea, num + ' a) la reponse attendue ne passe pas sa propre forme factorisee');
          if (ea.detail.lignes.map((l) => l.replace(/^\\(small|scriptsize)\s*/, '')).filter((l) => /^f'\(x\)(\s*=|$)/.test(l)).length !== 1 || !ea.detail.lignes.some((l) => /^(\\(small|scriptsize)\s*)?f''\(x\)(\s*=|$)/.test(l))) faux(ea, num + ' a) la derniere ligne du detail doit porter f\'\'');
          const eb = par(num + ' b)'), spec = eb.intervalleSpec;
          // bornes finies de l'ensemble : racines de f'' (changements de signe) ; ni plus ni moins
          const bornes = []; spec.liste.forEach((iv) => { if (isFinite(iv.bas)) bornes.push(iv.bas); if (isFinite(iv.haut)) bornes.push(iv.haut); });
          convexite(eb, F, bornes);
          let chg = [], prec = null; for (let t = -6.05; t < 6.2; t += 0.1) { const d = D2(F, t); if (Math.abs(d) < 1e-4) continue; const s = d > 0; if (prec !== null && s !== prec) chg.push(t); prec = s; }
          if (chg.length !== bornes.length || bornes.some((r) => !chg.some((t) => Math.abs(t - r) < 0.2))) faux(eb, num + ' b) changements de signe de f\'\' : ' + chg.map((t) => t.toFixed(2)).join(' ') + ' <> bornes ' + bornes.join(' '));
          if (par(num + ' c)')) faux(eb, num + ' c) ne doit plus exister');
          compte(num);
        }
        { const ids = ex.map((e) => e.id), calculs = [...new Set(ids.map((i) => Number(i.match(/^5\.(\d+)/)[1])))]; if (calculs.join() !== '1,2,3,4,5,6,7,8,9,10,11') faux(ex[0], 'numerotation'); }
      } catch (er) { faux(ex[0], 'EXCEPTION dans ' + ou + ' : ' + er.message + ' | ' + (er.stack || '').split('\n')[1]); }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
