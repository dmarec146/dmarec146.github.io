// Recalcul independant de la fiche 7 de Terminale (limites et asymptotes) : f est lue dans l enonce AFFICHE ; limites en haute precision, poles par changement de signe, racines par balayage, sans les fonctions de la fiche
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/terminale/cahier-3/fiche-07.html';
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
      const brut = s.slice(i + 2, j).replace(/^\\textstyle\s*/, '').replace(/^x\\to\s*/, '').trim(), expr = s.slice(j + 1);
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
        if (!isFinite(a2) || (a2 > 1.4 * a1 && a2 > 5)) return { t: 'inf', s: num(v2) > 0 ? 1 : -1 };
        return { t: 'fini', v: num(v2) };
      });
      if (res.length === 2 && JSON.stringify(res[0]) !== JSON.stringify(res[1]) && !(res[0].t === 'fini' && res[1].t === 'fini' && proche(res[0].v, res[1].v, 1e-6))) return { t: 'differente', res };
      return res[0];
    };
    // formes indeterminees reconnues sur l'ecriture AFFICHEE (independamment du generateur)
    const estFI = (enonce) => /lim_\{\\textstyle x\\to \+\\infty\}\\left\(e\^\{x\}-x(\^\{\d+\})?\\right\)/.test(enonce) || /lim_\{\\textstyle x\\to \+\\infty\}\\dfrac\{\\ln\(x\)\}\{x(\^\{\d+\})?\}/.test(enonce)
      || /lim_\{\\textstyle x\\to -\\infty\}(x\\,|x\^\{\d+\})e\^\{x\}/.test(enonce) || /lim_\{\\textstyle x\\to -?\d+\}\\dfrac\{x\^\{2\}-\d+\}\{x[+-]\d+\}/.test(enonce);
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
    // ---- fiche 7 : lecture de f dans l'enonce affiche, resolution numerique independante ----
    const lireF = (enonce) => { const m = String(enonce).match(/^\\\(f\(x\)=(.*)\\\)$/); if (!m) throw new Error('enonce de fonction illisible : ' + enonce); return m[1]; };
    const racinesReelles = (exprTex) => {                                   // racines d'un membre gauche P(x) (P(x) = 0), par changement de signe sur [-60, 60]
      const F = math.compile(mj(exprTex)), r = [], h = 0.0007;
      let x = -60.00013, fx = F.evaluate({ x });
      while (x < 60) { const y = x + h, fy = F.evaluate({ x: y }); if (fx === 0) r.push(x); else if (fx * fy < 0) { let a = x, b = y; for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (F.evaluate({ x: a }) * F.evaluate({ x: m }) <= 0) b = m; else a = m; } r.push((a + b) / 2); } x = y; fx = fy; }
      return r;
    };
    const ensembleReponse = (rep) => String(rep).replace(/[{}]/g, '').split(';').map((s) => s.trim()).filter((s) => s !== '').map((s) => math.evaluate(s)).sort((a, b) => a - b);
    const poles = (exprTex) => {                                            // abscisses ou |f| devient infini : changement de signe entre deux points ou |f| > 100
      const F = math.compile(mj(exprTex)), r = [], h = 0.0005;
      let x = -12.0001237, fx = F.evaluate({ x });
      while (x < 12) { const y = x + h, fy = F.evaluate({ x: y }); if (isFinite(fx) && isFinite(fy) && fx * fy < 0 && Math.abs(fx) > 100 && Math.abs(fy) > 100) { let a = x, b = y; for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (F.evaluate({ x: a }) * F.evaluate({ x: m }) <= 0) b = m; else a = m; } r.push((a + b) / 2); } x = y; fx = fy; }
      return r;
    };
    const horizontales = (exprTex) => {                                     // limites finies en +oo et -oo (haute precision)
      const src = mj(exprTex), h = [];
      for (const pt of ['+inf', '-inf']) { const c = classer(src, pt); if (c.t === 'fini' && !h.some((v) => proche(v, c.v, 1e-6))) h.push(c.v); }
      return h.sort((a, b) => a - b);
    };
    const memeListe = (A, B) => A.length === B.length && A.every((v, i) => proche(v, B[i], 1e-6));
    const verifierLimiteF = (e, fsrc) => {                                  // limite dont l'enonce porte sur f(x) : f lue dans l'introduction
      const { pt, expr } = decouper(formules(e.enonce)[0]);
      const src = mj(expr).replace(/f\(x\)/g, '(' + mj(fsrc.replace(/^f\(x\)=/, '')) + ')'), att = e.limite, c = classer(src, pt);
      if (att.t === 'inf') { if (c.t !== 'inf' || c.s !== att.s) faux(e, 'limite numerique ' + JSON.stringify(c) + ' <> ' + e.reponse); }
      else if (c.t !== 'fini' || !proche(c.v, att.v, 1e-6)) faux(e, 'limite numerique ' + JSON.stringify(c) + ' <> ' + e.reponse);
      if (!checkLimite(e.reponse, att)) faux(e, 'la reponse attendue ne passe pas sa propre verification');
    };
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      const par = (id) => ex.find((e) => e.id === id);
      for (const e of ex) if (/undefined|NaN|Infinity/.test(String(e.enonce) + String(e.reponse === undefined ? '' : e.reponse) + String(e.correctionLatex || ''))) faux(e, 'valeur invalide');
      try {
        // 7.1 : equations et inequations du second degre, recalculees sur l'enonce affiche (coefficients relus sur le polynome, discriminant, test sur de nombreux points)
        {
          const signes = [];
          for (const id of ['7.1 a)', '7.1 b)', '7.1 c)', '7.1 d)']) {
            ou = id; const e = par(id), m = formules(e.enonce)[0].match(/^(.*?)(\\geqslant|\\leqslant|\\lt|\\gt|=|>|<)\s*0$/);
            if (!m) { faux(e, id + ' enonce illisible : ' + e.enonce); continue; }
            const P = math.compile(mj(m[1])), p = (x) => P.evaluate({ x }), C = p(0), A = (p(1) + p(-1) - 2 * C) / 2, B = (p(1) - p(-1)) / 2, D = B * B - 4 * A * C, op = m[2];
            for (const x of [2.5, -3.5, 7]) if (!proche(p(x), A * x * x + B * x + C, 1e-9)) faux(e, id + ' le membre de gauche n\'est pas un trinome');
            signes.push(Math.sign(D));
            if (op === '=') {
              if (A <= 0) faux(e, id + ' coefficient dominant negatif dans une equation');
              const R = D > 1e-9 ? [(-B - Math.sqrt(D)) / (2 * A), (-B + Math.sqrt(D)) / (2 * A)] : Math.abs(D) <= 1e-9 ? [-B / (2 * A)] : [];
              if (!memeListe(R, ensembleReponse(e.reponse))) faux(e, id + ' solutions ' + JSON.stringify(R) + ' <> ' + e.reponse);
              if (!checkEnsemble(e.reponse, e.reponse)) faux(e, id + ' la reponse attendue ne passe pas sa propre verification');
            } else {
              const verifie = (x, spec) => {
                const v = p(x), nul = Math.abs(v) < 1e-14, vrai = op === '\\gt' || op === '>' ? v > 0 && !nul : op === '\\geqslant' ? v > 0 || nul : op === '\\lt' || op === '<' ? v < 0 && !nul : v < 0 || nul;
                const dans = spec.type === 'tout' ? true : spec.type === 'vide' ? false : spec.liste.some((iv) => (x > iv.bas || (iv.inclusBas && x === iv.bas)) && (x < iv.haut || (iv.inclusHaut && x === iv.haut)));
                return vrai === dans;
              };
              const spec = e.intervalleSpec, pts = [];
              for (let x = -30; x <= 30; x += 0.0137) pts.push(x);
              if (D >= 0) for (const s of [-1, 1]) { const r = (-B + s * Math.sqrt(D)) / (2 * A); pts.push(r, r - 1e-6, r + 1e-6); }
              for (const x of pts) if (!verifie(x, spec)) { faux(e, id + ' x = ' + x + ' mal classe par ' + JSON.stringify(spec)); break; }
              if (spec.type === 'intervalles' && spec.liste.some((iv) => iv.bas === iv.haut)) faux(e, id + ' ensemble reduit a un point');
              if (!checkIntervalle(formaterIntervalleSpec(spec).replace(/\\,/g, '').replace(/\\ \\cup\\ /g, '∪').replace(/\\infty/g, '∞').replace(/\\mathbb\{R\}/, 'ℝ').replace(/\\emptyset/, '∅').replace(/\\dfrac\{(-?\d+)\}\{(\d+)\}/g, '($1)/($2)'), spec)) faux(e, id + ' le corrige affiche, retape, n\'est pas accepte : ' + formaterIntervalleSpec(spec));
            }
            compte('7.1');
          }
          if (!(signes.filter((s) => s > 0).length === 2 && signes.includes(0) && signes.includes(-1))) faux(par('7.1 a)'), '7.1 : signes des discriminants ' + signes);
        }
        // limites sans f(x) : valeur numerique en haute precision
        for (const e of ex) {
          if (!e.limite || /f\(x\)/.test(e.enonce)) continue;
          ou = e.id; verifierLimite(e); compte(e.id.slice(0, 3));
        }
        // 7.4 : f lue dans l'introduction
        ou = '7.4';
        { const src = formules(paramsAvances.t4).find((s) => /^f\(x\)=/.test(s)); verifierLimiteF(par('7.4 a)'), src); verifierLimiteF(par('7.4 b)'), src); compte('7.4'); }
        // 7.5 : asymptotes recalculees sur l'enonce affiche (poles par changement de signe, horizontales par la limite en +oo et -oo)
        for (const id of ['7.5 a)', '7.5 b)', '7.5 c)', '7.5 d)']) {
          ou = id; const e = par(id), f = lireF(e.enonce);
          const V = poles(f).sort((a, b) => a - b), H = horizontales(f);
          const Ve = e.asymptotes.filter((u) => u.t === 'v').map((u) => u.v).sort((a, b) => a - b), He = e.asymptotes.filter((u) => u.t === 'h').map((u) => u.v).sort((a, b) => a - b);
          if (!memeListe(V, Ve)) faux(e, id + ' asymptotes verticales ' + JSON.stringify(V) + ' <> ' + JSON.stringify(Ve));
          if (!memeListe(H, He)) faux(e, id + ' asymptotes horizontales ' + JSON.stringify(H) + ' <> ' + JSON.stringify(He));
          if (!checkAsymptotes(e.reponse, e.asymptotes)) faux(e, id + ' la reponse attendue ne passe pas sa propre verification');
          if (checkAsymptotes(e.reponse.split(';').slice(1).join(';'), e.asymptotes) && e.asymptotes.length > 1) faux(e, id + ' une reponse incomplete est acceptee');
          compte('7.5');
        }
        // 7.6 : f(x) = ax + b + k ln(x - p)/(x - p) lue dans l'introduction
        ou = '7.6';
        {
          const src = formules(paramsAvances.t6).find((s) => /^f\(x\)=/.test(s)), p = Number(String(paramsAvances.t6).match(/\]\s*(-?\d+);\+\\infty\[/)[1]);
          verifierLimiteF(par('7.6 a)'), src);
          const eb = par('7.6 b)'), F = MB.compile(mj(src.replace(/^f\(x\)=/, ''))), G = (x) => math.evaluate(eb.reponse, { x });
          for (const X of ['1e12', '1e24']) { const x = MB.bignumber(X), diff = MB.subtract(F.evaluate({ x, e: EB }), MB.add(MB.multiply(MB.bignumber(G(1) - G(0)), x), MB.bignumber(G(0)))); if (Math.abs(num(diff)) > 1e-6) faux(eb, '7.6 b) f(x) - droite vaut ' + num(diff) + ' en ' + X); }
          const ec = par('7.6 c)'), c = classer(mj(src.replace(/^f\(x\)=/, '')), { a: p, cote: '+' });
          if (c.t !== 'inf') faux(ec, '7.6 c) f ne tend pas vers l\'infini en ' + p + '+ : ' + JSON.stringify(c));
          if (ec.asymptotes.length !== 1 || ec.asymptotes[0].t !== 'v' || ec.asymptotes[0].v !== p || ec.reponse !== 'x=' + p || !checkAsymptotes(ec.reponse, ec.asymptotes)) faux(ec, '7.6 c) asymptote verticale ' + ec.reponse + ' <> x=' + p);
          compte('7.6');
        }
        // 7.7 : asymptote oblique y = mx + p d'apres f(x) = (ax^2 + bx + c)/(x - d) ; a et b de la reponse remis dans f
        ou = '7.7';
        {
          const intro = formules(paramsAvances.t7).find((s) => /^f\(x\)=/.test(s)), mm = intro.match(/^f\(x\)=\\dfrac\{ax\^\{2\}\+bx([+-]\d+)\}\{x([+-]\d+)\}$/);
          if (!mm) throw new Error('introduction 7.7 illisible : ' + intro);
          const c = Number(mm[1]), d = -Number(mm[2]), e = par('7.7 a)'), rhs = formules(e.enonce).find((s) => /^y=/.test(s)).replace(/^y=/, ''), g = (x) => val(rhs, { x }), m = g(1) - g(0), pp = g(0);
          const [a, b] = e.reponse.replace(/[()]/g, '').split(';').map(Number);
          if (Number(e.pa) !== a || Number(e.pb) !== b) faux(e, '7.7 a) pa/pb <> reponse');
          const F = MB.compile('(a*x^2+b*x+(' + c + '))/(x-(' + d + '))');
          for (const X of ['1e12', '1e24', '-1e12']) { const x = MB.bignumber(X), diff = MB.subtract(F.evaluate({ x, a: MB.bignumber(a), b: MB.bignumber(b) }), MB.add(MB.multiply(MB.bignumber(m), x), MB.bignumber(pp))); if (Math.abs(num(diff)) > 1e-6) faux(e, '7.7 a) f(x) - (mx + p) vaut ' + num(diff) + ' en ' + X + ' avec (a;b) = (' + a + ';' + b + ')'); }
          const F2 = MB.compile('((a+1)*x^2+b*x+(' + c + '))/(x-(' + d + '))'), x2 = MB.bignumber('1e12'), diff2 = MB.subtract(F2.evaluate({ x: x2, a: MB.bignumber(a), b: MB.bignumber(b) }), MB.add(MB.multiply(MB.bignumber(m), x2), MB.bignumber(pp)));
          if (Math.abs(num(diff2)) < 1e3) faux(e, '7.7 a) une autre valeur de a donnerait aussi l\'asymptote : unicite non verifiee');
          compte('7.7');
        }
        // 7.8 : f(x) = (ax + b)/(x + c), asymptotes x = p0 et y = k, point (0 ; y0)
        ou = '7.8';
        {
          const t8 = String(paramsAvances.t8), m1 = t8.match(/\\\(x=(-?\d+)\\\) et \\\(y=(-?\d+)\\\)/), m2 = t8.match(/\\\(\(0\\,;\\,(-?\d+)\)\\\)/);
          if (!m1 || !m2) throw new Error('introduction 7.8 illisible : ' + t8);
          const p0 = Number(m1[1]), k = Number(m1[2]), y0 = Number(m2[1]), e = par('7.8 a)'), a = Number(e.ta), b = Number(e.tb), c = Number(e.tc);
          if (e.reponse !== '(' + a + ';' + b + ';' + c + ')') faux(e, '7.8 a) reponse <> ta/tb/tc');
          const F = MB.compile('(a*x+b)/(x+c)'), sc = (x) => ({ x, a: MB.bignumber(a), b: MB.bignumber(b), c: MB.bignumber(c) });
          if (-c !== p0) faux(e, '7.8 a) pole -c = ' + (-c) + ' <> ' + p0);
          if (a * (-c) + b === 0) faux(e, '7.8 a) le numerateur s\'annule au pole : pas d\'asymptote verticale');
          for (const X of ['1e12', '-1e12', '1e24']) if (Math.abs(num(F.evaluate(sc(MB.bignumber(X)))) - k) > 1e-6) faux(e, '7.8 a) limite en ' + X + ' <> ' + k);
          if (!proche(num(F.evaluate(sc(MB.bignumber(0)))), y0, 1e-9)) faux(e, '7.8 a) f(0) <> ' + y0);
          if (Math.abs(num(F.evaluate(sc(MB.bignumber(p0 + 1e-9))))) < 1e6) faux(e, '7.8 a) f ne tend pas vers l\'infini en ' + p0);
          compte('7.8');
        }
        { const ids = ex.map((e) => e.id), calculs = [...new Set(ids.map((i) => Number(i.match(/^7\.(\d+)/)[1])))]; if (calculs.join() !== '1,2,3,4,5,6,7,8') faux(ex[0], 'numerotation'); }
      } catch (er) { faux(ex[0], 'EXCEPTION dans ' + ou + ' : ' + er.message + ' | ' + (er.stack || '').split('\n')[1]); }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
