// Recalcul independant de la fiche 6 de Terminale (limites de fonctions) : l expression est lue dans l enonce AFFICHE ; chaque limite est controlee par un calcul en haute precision tres pres du point ou tres loin, sans les fonctions de la fiche
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/terminale/cahier-3/fiche-06.html';
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
      u = u.replace(/([x0-9)])\s*ln\(/g, '$1*ln(');
      return u.replace(/(\d)\s*\(/g, '$1*(').replace(/\)\s*(\d)/g, ')*$1').replace(/(\d)\s*([a-zA-Z])/g, '$1*$2').replace(/\)\s*\(/g, ')*(').replace(/\)\s*([a-zA-Z])/g, ')*$1');
    };
    const val = (t, sc) => math.evaluate(mj(t), sc || {});
    const formules = (s) => (String(s).match(/\\\((.*?)\\\)/g) || []).map((x) => x.slice(2, -2));
    // calcul en haute precision (80 chiffres) : la limite est lue sur la valeur de l'expression tres pres du point, ou tres loin
    const MB = math.create(math.all, { number: 'BigNumber', precision: 90 });
    MB.import({ ln: MB.log }, { override: true });
    const EB = MB.exp(MB.bignumber(1));   // le nombre e en haute precision
    const num = (v) => Number(v.toString());
    // « \lim_{x\to PT}EXPR » : renvoie { pt, expr } ; pt = '+inf' | '-inf' | { a, cote }
    const decouper = (src) => {
      const s = String(src).replace(/^\\displaystyle/, ''), i = s.indexOf('_{');
      if (i < 0) throw new Error('pas de limite : ' + src);
      let prof = 0, j = i + 1; for (; j < s.length; j++) { if (s[j] === '{') prof++; else if (s[j] === '}') { prof--; if (prof === 0) break; } }
      const brut = s.slice(i + 2, j).replace(/^x\\to\s*/, '').trim(), expr = s.slice(j + 1);
      let pt;
      if (brut === '+\\infty') pt = '+inf'; else if (brut === '-\\infty') pt = '-inf';
      else { const m = brut.match(/^(-?\d+)(\^\{([+-])\})?$/); if (!m) throw new Error('point illisible : ' + brut); pt = { a: Number(m[1]), cote: m[3] || 0 }; }
      return { pt, expr };
    };
    const classerUnCote = (src, x0, cote, exp) => {
      const f = MB.compile(src);
      const d = exp && x0 === 0 ? ['0.02', '0.005'] : ['1e-12', '1e-24'];
      const pts = d.map((e) => MB.add(MB.bignumber(x0), MB.multiply(MB.bignumber(cote === '-' ? -1 : 1), MB.bignumber(e))));
      return [f.evaluate({ x: pts[0], e: EB }), f.evaluate({ x: pts[1], e: EB })];
    };
    const classer = (src, pt) => {
      const exp = /e\^/.test(src);
      let paires;
      if (pt === '+inf' || pt === '-inf') {
        const sg = pt === '+inf' ? '' : '-', xs = exp ? [sg + '100', sg + '200'] : [sg + '1e12', sg + '1e24'], f = MB.compile(src);
        paires = [xs.map((x) => f.evaluate({ x: MB.bignumber(x), e: EB }))];
      } else if (pt.cote) paires = [classerUnCote(src, pt.a, pt.cote, exp)];
      else paires = [classerUnCote(src, pt.a, '+', exp), classerUnCote(src, pt.a, '-', exp)];
      const res = paires.map(([v1, v2]) => {
        const a1 = Math.abs(num(v1)), a2 = Math.abs(num(v2));
        if (a2 > 1.4 * a1 && a2 > 5) return { t: 'inf', s: num(v2) > 0 ? 1 : -1 };
        return { t: 'fini', v: num(v2) };
      });
      if (res.length === 2 && JSON.stringify(res[0]) !== JSON.stringify(res[1]) && !(res[0].t === 'fini' && res[1].t === 'fini' && proche(res[0].v, res[1].v, 1e-6))) return { t: 'differente', res };
      return res[0];
    };
    // formes indeterminees reconnues sur l'ecriture AFFICHEE (independamment du generateur)
    const estFI = (enonce) => /lim_\{x\\to \+\\infty\}\\left\(e\^\{x\}-x(\^\{\d+\})?\\right\)/.test(enonce) || /lim_\{x\\to \+\\infty\}\\dfrac\{\\ln\(x\)\}\{x(\^\{\d+\})?\}/.test(enonce)
      || /lim_\{x\\to -\\infty\}(x\\,|x\^\{\d+\})e\^\{x\}/.test(enonce) || /lim_\{x\\to -?\d+\}\\dfrac\{x\^\{2\}-\d+\}\{x[+-]\d+\}/.test(enonce);
    const verifierLimite = (e, source) => {
      const { pt, expr } = decouper(formules(e.enonce)[0]);
      const src = mj(source === undefined ? expr : source.replace(/^f\(x\)=/, ''));
      const att = e.limite, fi = /^6.3/.test(e.id) && estFI(e.enonce);
      if (att.t === 'FI') { if (!estFI(e.enonce)) faux(e, 'declaree FI alors que ce n\'est pas une forme indeterminee reconnue'); return; }
      if (fi) { faux(e, 'forme indeterminee reconnue mais reponse ' + e.reponse); return; }
      const c = classer(src, pt);
      if (att.t === 'inf') { if (c.t !== 'inf' || c.s !== att.s) faux(e, 'limite numerique ' + JSON.stringify(c) + ' <> ' + e.reponse); }
      else if (c.t !== 'fini' || !proche(c.v, att.v, 1e-6)) faux(e, 'limite numerique ' + JSON.stringify(c) + ' <> ' + e.reponse);
      if (!checkLimite(e.reponse, att)) faux(e, 'la reponse attendue ne passe pas sa propre verification');
    };
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      const par = (id) => ex.find((e) => e.id === id);
      for (const e of ex) if (/undefined|NaN|Infinity/.test(String(e.enonce) + String(e.reponse === undefined ? '' : e.reponse) + String(e.correctionLatex || ''))) faux(e, 'valeur invalide');
      try {
        ou = '6.1';
        for (const id of ['6.1 a)', '6.1 b)']) { const e = par(id); for (const x of [0.7, -1.3, 2.1]) { if (!proche(val(e.enonce, { x }), math.evaluate(e.reponse, { x }))) faux(e, id + ' simplification'); if (!proche(val(e.correctionLatex, { x }), math.evaluate(e.reponse, { x }))) faux(e, id + ' correction affichee'); } compte('6.1'); }
        ou = '6.2';
        for (const id of ['6.2 a)', '6.2 b)']) {
          const e = par(id); for (const x of [0.3, -0.6, 1.1]) { if (!proche(val(e.enonce, { x }), math.evaluate(e.reponse, { x }), 1e-9)) faux(e, id + ' simplification'); if (!proche(val(e.correctionLatex, { x }), math.evaluate(e.reponse, { x }), 1e-9)) faux(e, id + ' correction affichee'); }
          if (!estUneExponentielle(e.reponse)) faux(e, id + ' la reponse attendue n\'est pas une seule exponentielle'); compte('6.2');
        }
        // limites : valeur numerique en haute precision
        for (const e of ex) {
          if (!e.limite) continue;
          ou = e.id;
          if (/^6\.1[34]/.test(e.id)) continue;
          verifierLimite(e); compte(e.id.slice(0, 3).replace(/\s|\)/g, ''));
        }
        // 6.3 : deux formes indeterminees et deux limites directes
        { const fis = ['6.3 a)', '6.3 b)', '6.3 c)', '6.3 d)'].filter((id) => par(id).limite.t === 'FI'); if (fis.length !== 2) faux(par('6.3 a)'), '6.3 : ' + fis.length + ' formes indeterminees au lieu de 2'); }
        // 6.13 : f lue dans l'introduction
        ou = '6.13';
        {
          const src = formules(paramsAvances.t13).find((s) => /^f\(x\)=/.test(s)), f = (x) => val(src.replace(/^f\(x\)=/, ''), { x });
          const ea = par('6.13 a)'), al = Number(ea.ta), be = Number(ea.tb), ga = Number(ea.tc), d = Number(formules(ea.enonce).join(' ').match(/x\\neq (-?\d+)/)[1]);
          for (const x of [0.37, 1.9, -2.3, 3.1]) if (Math.abs(x - d) > 0.2 && !proche(f(x), al * x + be + ga / (x - d), 1e-9)) faux(ea, '6.13 a) f(x) <> alpha x + beta + gamma/(x-d) en ' + x);
          const eb = par('6.13 b)'), c = classer(mj(src.replace(/^f\(x\)=/, '')), { a: d, cote: '+' });
          if (c.t !== 'inf' || c.s !== eb.limite.s) faux(eb, '6.13 b) limite numerique ' + JSON.stringify(c) + ' <> ' + eb.reponse);
          const ec = par('6.13 c)'), G = (x) => math.evaluate(ec.reponse, { x }), F = MB.compile(mj(src.replace(/^f\(x\)=/, '')));
          for (const X of ['1e12', '1e24']) { const x = MB.bignumber(X), diff = MB.subtract(F.evaluate({ x, e: EB }), MB.add(MB.multiply(MB.bignumber(al), x), MB.bignumber(be))); if (Math.abs(num(diff)) > 1e-6) faux(ec, '6.13 c) f(x) - (alpha x + beta) vaut ' + num(diff) + ' en ' + X + ' (devrait tendre vers 0)'); }
          if (!proche(G(0), be, 1e-9) || !proche(G(1) - G(0), al, 1e-9)) faux(ec, '6.13 c) droite ' + G(0) + ' / ' + (G(1) - G(0)) + ' <> y = ' + al + 'x+' + be);
          compte('6.13');
        }
        // 6.14 : f lue dans l'introduction, limites a chaque borne
        ou = '6.14';
        {
          const src = mj(formules(paramsAvances.t14).find((s) => /^f\(x\)=/.test(s)).replace(/^f\(x\)=/, ''));
          for (const id of ['6.14 a)', '6.14 b)', '6.14 c)', '6.14 d)']) {
            const e = par(id), { pt } = decouper(formules(e.enonce)[0]), c = classer(src, pt), att = e.limite;
            if (att.t === 'inf' ? (c.t !== 'inf' || c.s !== att.s) : (c.t !== 'fini' || !proche(c.v, att.v, 1e-6))) faux(e, id + ' limite numerique ' + JSON.stringify(c) + ' <> ' + e.reponse);
            compte('6.14');
          }
        }
        { const ids = ex.map((e) => e.id), calculs = [...new Set(ids.map((i) => Number(i.match(/^6\.(\d+)/)[1])))]; if (calculs.join() !== '1,2,3,4,5,6,7,8,9,10,11,12,13,14') faux(ex[0], 'numerotation'); }
      } catch (er) { faux(ex[0], 'EXCEPTION dans ' + ou + ' : ' + er.message + ' | ' + (er.stack || '').split('\n')[1]); }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
