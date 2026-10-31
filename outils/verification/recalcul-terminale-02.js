// Recalcul independant de la fiche 2 de Terminale (autour de la loi binomiale) : chaque reponse est recalculee a partir de l'enonce AFFICHE (parametres lus dans le texte du tirage) par la formule factorielle ou par la loi complete, sans les fonctions de la fiche
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/terminale/cahier-1/fiche-02.html';
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
    const proche = (a, c, tol = 1e-9) => Math.abs(a - c) <= tol * (1 + Math.abs(a) + Math.abs(c));
    const mj = (t) => {
      let u = String(t).replace(/\\displaystyle|\\textstyle/g, '').replace(/\{,\}/g, '.').replace(/\\left|\\right|\\,|\\ /g, ' ').replace(/\\times/g, '*').replace(/\\div/g, '/').replace(/\\lt/g, '<').replace(/\\gt/g, '>').replace(/\\frac/g, '\\dfrac');
      for (let i = 0; i < 8; i++) u = u.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
      u = u.replace(/\{/g, '(').replace(/\}/g, ')');
      return u.replace(/(\d)\s*\(/g, '$1*(').replace(/\)\s*(\d)/g, ')*$1').replace(/(\d)\s*([a-zA-Z])/g, '$1*$2').replace(/\)\s*\(/g, ')*(').replace(/\)\s*([a-zA-Z])/g, ')*$1');
    };
    const cache = {}; const val = (t, sc) => { const k = String(t); return (cache[k] || (cache[k] = math.compile(mj(k)))).evaluate(sc || {}); };
    const T = (k) => String(paramsAvances['t' + k] || '');
    const rep = (e) => math.evaluate(String(e.reponse));
    const comp = (e, att, nom) => { if (!proche(rep(e), att)) faux(e, nom + ' attendu ' + att + ' / ecrit ' + e.reponse); };
    // loi binomiale recalculee par la formule factorielle, sans passer par les fonctions de la fiche
    const fact = (m) => { let r = 1; for (let i = 2; i <= m; i++) r *= i; return r; };
    const binom = (n, k) => fact(n) / (fact(k) * fact(n - k));
    const pk = (n, p, k) => binom(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
    const loiTexte = (t) => { const m = t.match(/\\mathcal\{B\}\\left\((\d+)\\,;\\,(.*?)\\right\)\\\)/); return { n: Number(m[1]), p: val(m[2]) }; };
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices();
      const par = (id) => ex.find((e) => e.id === id);
      const ids = ex.map((e) => e.id);
      if (new Set(ids).size !== ids.length) faux(ex[0], 'identifiants en double');
      for (const e of ex) if (/undefined|NaN|Infinity/.test(String(e.enonce) + String(e.reponse === undefined ? '' : e.reponse))) faux(e, 'valeur invalide');
      for (let n = 3; n <= 11; n++) { const tx = T(n); if (/undefined|NaN|Infinity|\$\{/.test(tx)) faux(ex[0], 'texte ' + n + ' invalide : ' + tx.slice(0, 80)); }
      try {
        // ---- 2.1 : developper ; 2.2 : factoriser (egalite des polynomes en plusieurs points) ----
        for (const id of ['2.1 a)', '2.1 b)', '2.2 a)', '2.2 b)']) {
          const e = par(id);
          for (const x of [-2.3, 0.7, 1.9, 3.1]) if (!proche(val(e.enonce, { x }), val(e.reponse, { x }))) faux(e, id + ' ' + e.enonce + ' / ' + e.reponse);
          compte(id.slice(0, 3));
        }
        { const e = par('2.2 a)'), a = Number((e.enonce.match(/^(\d*)x\^2/) || [0, ''])[1] || 1), b = Math.sqrt(Number(e.enonce.match(/-(\d+)$/)[1])); if (!Number.isInteger(b) || !Number.isInteger(Math.sqrt(a))) faux(e, '2.2 a) pas une difference de carres'); }
        { const e = par('2.2 b)'), m = e.reponse.match(/^\(x([+-]\d+)\)\(x([+-]\d+)\)$/); if (!m || Number(m[1]) === Number(m[2])) faux(e, '2.2 b) racines'); }
        // ---- 2.3 et 2.4 : probabilites d'une loi binomiale (parametres lus dans l'enonce affiche) ----
        { const { n, p } = loiTexte(T(3));
          comp(par('2.3 a)'), pk(n, p, 0), '2.3 a)'); comp(par('2.3 b)'), pk(n, p, n), '2.3 b)'); comp(par('2.3 c)'), pk(n, p, 1), '2.3 c)'); comp(par('2.3 d)'), pk(n, p, n - 1), '2.3 d)');
          if (par('2.3 b)').enonce !== `P(X=${n})` || par('2.3 d)').enonce !== `P(X=${n - 1})`) faux(par('2.3 b)'), '2.3 valeurs de k affichees'); compte('2.3'); }
        { const { n, p } = loiTexte(T(4));
          comp(par('2.4 a)'), pk(n, p, 2), '2.4 a)'); comp(par('2.4 b)'), pk(n, p, 3), '2.4 b)');
          comp(par('2.4 c)'), pk(n, p, 0) + pk(n, p, 1), '2.4 c)'); comp(par('2.4 d)'), 1 - pk(n, p, 0), '2.4 d)'); compte('2.4'); }
        // ---- 2.5 : QCM, une seule proposition egale a la bonne expression pour tout n ----
        { const t5 = T(5), m = t5.match(/\\mathcal\{B\}\\left\(n\\,;\\,(.*?)\\right\)/), p = val(m[1]);
          for (const [id, f] of [['2.5 a)', (n) => pk(n, p, 0)], ['2.5 b)', (n) => pk(n, p, n)], ['2.5 c)', (n) => pk(n, p, 1)]]) {
            const e = par(id);
            if (!Array.isArray(e.options) || e.options.length !== 4) { faux(e, id + ' : pas quatre propositions'); continue; }
            const bonnes = e.options.filter((o) => [2, 3, 4, 5, 6].every((n) => proche(val(o.texte, { n }), f(n))));
            if (bonnes.length !== 1) faux(e, id + ' : ' + bonnes.length + ' propositions justes'); else if (bonnes[0].lettre !== e.bonneReponse) faux(e, id + ' : bonne lettre ' + e.bonneReponse + ' / juste ' + bonnes[0].lettre);
            if (new Set(e.options.map((o) => o.lettre)).size !== 4 || e.options.map((o) => o.lettre).join('') !== 'abcd') faux(e, id + ' : lettres');
            if (new Set(e.options.map((o) => o.texte)).size !== 4) faux(e, id + ' : propositions identiques');
          }
          compte('2.5'); }
        // ---- 2.6 : esperance et variance, transformations affines ----
        { const { n, p } = loiTexte(T(6)), E = n * p, V = n * p * (1 - p);
          comp(par('2.6 a)'), E, '2.6 a)'); comp(par('2.6 b)'), V, '2.6 b)');
          const c = par('2.6 c)').enonce.match(/^E\((-?\d*)X([+-]\d+)\)$/), d = par('2.6 d)').enonce.match(/^V\((-?\d*)X([+-]\d+)\)$/);
          const co = (s) => (s === '' ? 1 : s === '-' ? -1 : Number(s));
          comp(par('2.6 c)'), co(c[1]) * E + Number(c[2]), '2.6 c)'); comp(par('2.6 d)'), co(d[1]) ** 2 * V, '2.6 d)'); compte('2.6'); }
        // ---- 2.7 : frequence d'apparition ----
        { const t7 = T(7), N7 = Number(t7.match(/lance (\d+) fois/)[1]), f7 = Number(t7.match(/à (\d+) faces/)[1]), p = 1 / f7, E = N7 * p, V = N7 * p * (1 - p);
          if (Number(t7.match(/Y=\\dfrac\{X\}\{(\d+)\}/)[1]) !== N7) faux(ex[0], '2.7 Y = X/N');
          comp(par('2.7 a)'), E, '2.7 a)'); comp(par('2.7 b)'), V, '2.7 b)'); comp(par('2.7 c)'), E / N7, '2.7 c)'); comp(par('2.7 d)'), V / (N7 * N7), '2.7 d)'); compte('2.7'); }
        // ---- 2.8 : variances litterales ----
        { for (const id of ['2.8 a)', '2.8 b)', '2.8 c)', '2.8 d)']) {
            const e = par(id), m = e.enonce.match(/^V\((-?\d*)X(?:[+-]\d+)?\)$/), a = id === '2.8 a)' ? 1 : (m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]));
            for (const sc of [{ n: 7, p: 0.3 }, { n: 12, p: 0.85 }, { n: 3, p: 0.5 }]) if (!proche(math.evaluate(e.reponse, sc), a * a * sc.n * sc.p * (1 - sc.p))) faux(e, id + ' variance fausse : ' + e.reponse);
          } compte('2.8'); }
        // ---- 2.9 : transmission de messages (valeurs decimales exactes) ----
        { const t9 = T(9), n = Number(t9.match(/envoie (\d+) messages/)[1]), p = val(t9.match(/probabilité \\\((.*?)\\\)/)[1]), q = 1 - p;
          const coupleOk = (e, nn, pp) => { if (Number(e.pa) !== nn || !proche(math.evaluate(e.pb), pp)) faux(e, e.id + ' couple attendu (' + nn + ';' + pp + ') / ecrit (' + e.pa + ';' + e.pb + ')'); };
          coupleOk(par('2.9 a)'), 1, p); coupleOk(par('2.9 b)'), n, p);
          comp(par('2.9 c)'), pk(n, p, 0), '2.9 c)'); comp(par('2.9 d)'), pk(n, p, 1), '2.9 d)'); comp(par('2.9 e)'), pk(n, p, n - 1), '2.9 e)'); comp(par('2.9 f)'), pk(n, p, n), '2.9 f)');
          comp(par('2.9 g)'), n * p, '2.9 g)'); comp(par('2.9 h)'), q * q, '2.9 h)'); coupleOk(par('2.9 i)'), n, 1 - q * q); comp(par('2.9 j)'), n * (1 - q * q), '2.9 j)');
          for (const id of ['2.9 c)', '2.9 d)', '2.9 e)', '2.9 f)', '2.9 g)', '2.9 h)', '2.9 j)']) { const e = par(id); if (!/^[\d{},]+$/.test(e.correctionLatex)) faux(e, id + ' corrige non decimal : ' + e.correctionLatex); }
          if (!par('2.9 h)').enonce.includes('deux fois')) faux(par('2.9 h)'), '2.9 h) sans le paragraphe'); compte('2.9'); }
        // ---- 2.10 : tirages avec remise ----
        { const t10 = T(10), m = t10.match(/contient (\d+) boules? rouges? et (\d+) boules? bleues?.*?avec remise, (\d+) boules/), r = Number(m[1]), b = Number(m[2]), n = Number(m[3]), p = r / (r + b);
          const G1 = 1 - pk(n, p, 0), G2 = 1 - pk(n, p, 0) - pk(n, p, 1);
          comp(par('2.10 a)'), pk(n, p, 0), '2.10 a)'); comp(par('2.10 b)'), G1, '2.10 b)'); comp(par('2.10 c)'), G2, '2.10 c)'); comp(par('2.10 d)'), G2 / G1, '2.10 d)');
          const seg = t10.match(/contient (.*?), indiscernables/)[1];
          if ((r > 1 ? !/boules rouges/.test(seg) : !/boule rouge(?!s)/.test(seg)) || (b > 1 ? !/boules bleues/.test(seg) : !/boule bleue(?!s)/.test(seg))) faux(ex[0], '2.10 accord : ' + seg); compte('2.10'); }
        // ---- 2.11 : questionnaire (esperance et variance recalculees sur la loi complete) ----
        { const t11 = T(11), n = Number(t11.match(/comporte (\d+) questions/)[1]), a = Number(t11.match(/rapporte (\d+) points/)[1]), b = Number(t11.match(/retire (\d+) points?/)[1]);
          let EX = 0, EN = 0, EN2 = 0; for (let k = 0; k <= n; k++) { const w = pk(n, 0.25, k), N = a * k - b * (n - k); EX += w * k; EN += w * N; EN2 += w * N * N; }
          if (Number(par('2.11 a)').pa) !== n || !proche(math.evaluate(par('2.11 a)').pb), 0.25)) faux(par('2.11 a)'), '2.11 a) couple');
          comp(par('2.11 b)'), EX, '2.11 b)'); comp(par('2.11 c)'), EN, '2.11 c)'); comp(par('2.11 d)'), EN2 - EN * EN, '2.11 d)'); compte('2.11'); }
        { const calculs = [...new Set(ids.map((i) => Number(i.match(/^2\.(\d+)/)[1])))]; if (calculs.join() !== Array.from({ length: 11 }, (_, i) => i + 1).join()) faux(ex[0], 'numerotation des calculs'); }
      } catch (er) { faux(ex[0], 'EXCEPTION ' + er.message + ' | ' + (er.stack || '').split('\n')[1]); }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
