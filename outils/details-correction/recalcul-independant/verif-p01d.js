// Verification independante des details de Premiere 1 (formes canoniques, cercles) : tout est recalcule a partir de l'enonce affiche
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 300);
const FICHE = process.argv[3] || 'cahiers/premiere/cahier-1/fiche-01.html';
(async () => {
  const s = http.createServer((req, res) => { const f = path.join(RACINE, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0, '127.0.0.1');
  await new Promise((r) => s.on('listening', r));
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${s.address().port}/${FICHE}`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof exercices !== 'undefined' && window.math && document.querySelector('.question'), null, { timeout: 40000 });
  const r = await p.evaluate((N) => {
    const defauts = [], stats = {}; const compte = (k) => { stats[k] = (stats[k] || 0) + 1; };
    const faux = (e, m) => { if (defauts.length < 14) defauts.push(e.id + ' : ' + m + ' | ' + String(e.enonce).replace(/\s+/g, ' ').slice(0, 130)); };
    const proche = (a, c, tol = 1e-7) => Math.abs(a - c) <= tol * (1 + Math.abs(a) + Math.abs(c));
    // LaTeX -> math.js
    const mj = (t) => {
      let u = String(t).replace(/\\left|\\right|\\,|\\ /g, ' ').replace(/\\lambda/g, '(lam)').replace(/\\times/g, '*');
      for (let i = 0; i < 6; i++) u = u.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
      return u;
    };
    const cache = {}; const val = (t, sc) => { const k = String(t); return (cache[k] || (cache[k] = math.compile(mj(k)))).evaluate(sc || {}); };
    const egalFonctions = (A, B, vars, nbPts = 6) => {
      for (let k = 0; k < nbPts; k++) {
        const sc = {}; vars.forEach((v) => { sc[v] = Math.round((Math.random() * 8 - 4) * 4) / 4 + (v === 'lam' ? 0.37 : 0.11); });
        if (!proche(val(A, sc), val(B, sc))) return false;
      }
      return true;
    };
    const lettres = (t) => [...new Set(String(t).replace(/\\[a-zA-Z]+/g, '').match(/[a-zA-Z]/g) || [])];
    // coefficients d'un trinome a une variable : [a, b, c]
    const coefs = (t, v, extra) => { const f = (x) => val(t, Object.assign({ [v]: x }, extra || {})); const a = (f(1) + f(-1) - 2 * f(0)) / 2; if (!proche(f(2), 4 * a + (f(1) - f(-1)) + f(0))) throw new Error('pas un trinome'); return [a, (f(1) - f(-1)) / 2, f(0)]; };
    const fr = (t) => val(t);
    // forme canonique « coef (x -+ alpha)^2 +- beta » : renvoie { A, alpha, beta } ou null
    const lireCanonique = (F, v) => {
      const m = F.match(new RegExp('^(-?)(\\\\dfrac\\{\\d+\\}\\{\\d+\\}|\\d+)?(?:\\\\left)?\\(' + v + '(?:([+-])(\\\\dfrac\\{\\d+\\}\\{\\d+\\}|\\d+))?(?:\\\\right)?\\)\\^\\{2\\}([+-]\\\\dfrac\\{\\d+\\}\\{\\d+\\}|[+-]\\d+)?$'));
      if (!m) return null;
      return { A: (m[1] === '-' ? -1 : 1) * (m[2] ? fr(m[2]) : 1), alpha: m[3] ? (m[3] === '-' ? 1 : -1) * fr(m[4]) : 0, beta: m[5] ? fr(m[5]) : 0 };
    };
    // lettre de l'option d'un QCM -> fonction (texte de l'option) : « -\dfrac{1}{2}(x+3)^2-2 »
    for (let t = 0; t < N; t++) {
      const ex = genererExercices(); const pg = paramsGraphiques;
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (/^1\.[14] /.test(id)) {
            const v = lettres(tx)[0];
            if (!egalFonctions(tx, F, [v]) || /[()]/.test(F)) faux(e, 'developpe ' + F);
            if (!egalFonctions(F, e.reponse, [v])) faux(e, 'reponse attendue differente ' + F);
            compte('1.1/1.4');
          }
          else if (/^1\.2 a/.test(id)) { const k = Math.sqrt(val(tx.replace(/x\^2-/, ''))); if (!egalFonctions(tx, F, ['x']) || !/^\(x-\d+\)\(x\+\d+\)$/.test(F) || !proche(Number(F.match(/-(\d+)\)/)[1]), k)) faux(e, 'diff carres ' + F); compte('1.2a'); }
          else if (/^1\.2 b/.test(id)) { if (!egalFonctions(tx, F, ['v']) || !/^\(\d+v-\d+\)\^\{2\}$/.test(F)) faux(e, 'carre parfait ' + F); compte('1.2b'); }
          else if (/^1\.3 a/.test(id)) {
            const k = val(tx.split('=')[1]); const m = F.match(/^\\\{(.+)\\,;\\,(.+)\\\}$/); if (!m) { faux(e, 'ensemble ' + F); continue; }
            const u = val(m[1]), w = val(m[2]); if (!(u < 0 && w > 0 && proche(u * u, k) && proche(w * w, k))) faux(e, 'z^2=k ' + F); compte('1.3a');
          }
          else if (/^1\.3 b/.test(id)) {
            const m = F.match(/^\\\{(.+)\\\}$/); if (!m) { faux(e, 'ensemble ' + F); continue; }
            const x0 = val(m[1]); if (!proche(val(tx.split('=')[0], { t: x0 }), 0, 1e-9) || x0 >= 0) faux(e, 'carre nul ' + F); compte('1.3b');
          }
          else if (/^1\.5 /.test(id)) {
            const [a, bb, c] = coefs(tx, 'x'); const L = lireCanonique(F, 'x');
            if (!L || !proche(L.A, a) || !proche(L.alpha, -bb / (2 * a)) || !proche(L.beta, c - bb * bb / (4 * a))) faux(e, 'canonique ' + F + ' attendu ' + JSON.stringify([a, -bb / (2 * a), c - bb * bb / (4 * a)])); compte('1.5');
          }
          else if (/^1\.6 /.test(id)) {
            if (!egalFonctions(tx, F, ['x', 'lam'])) { faux(e, 'canonique parametre different ' + F); continue; }
            // forme : un carre (x + ...)^2 puis un reste sans x ; au sommet, la derivee en x s'annule
            const g = F.match(/\\left\(x[^()]*\\right\)\^\{2\}/); if (!g) { faux(e, 'pas de carre ' + F); continue; }
            const reste = F.replace(g[0], ''); if (/x/.test(reste)) faux(e, 'x dans le reste ' + F);
            for (const lam of [0.7, -1.3, 2.9]) {
              const [a, bb] = coefs(tx, 'x', { lam }), al = -bb / (2 * a), d = 1e-5;
              const Fx = (x) => val(F, { x, lam }); if (Math.abs((Fx(al + d) - Fx(al - d)) / (2 * d)) > 1e-5) faux(e, 'sommet faux ' + F);
              const inner = g[0].match(/x([^()]*)\\right/)[1]; if (!proche(val('x' + inner.replace(/\\left|\\right/g, ''), { x: al, lam }), 0, 1e-7)) faux(e, 'x-alpha ne s annule pas au sommet ' + F);
            }
            compte('1.6');
          }
          else if (/^1\.9 /.test(id)) {
            const corps = tx.replace(/^.*?\\mathbb\{R\},\\ ?/, '');
            const m = corps.match(/^(.*?)(\\geqslant|\\leqslant|>|<)(.*)$/); if (!m) { faux(e, 'inegalite illisible'); continue; }
            const v = lettres(corps)[0], op = m[2], strict = op === '>' || op === '<' || op === '\\lt', sensPlus = op === '>' || op === '\\geqslant';
            const g = (x) => val(m[1], { [v]: x }) - val(m[3], { [v]: x }) ; const h = sensPlus ? g : (x) => -g(x);
            let mn = Infinity; for (let x = -20; x <= 20; x += 0.001) { const y = h(x); if (y < mn) mn = y; }
            const classe = mn < -1e-4 ? -1 : Math.abs(mn) <= 1e-4 ? 0 : 1; const vraiReel = strict ? classe > 0 : classe >= 0;
            if (F !== (vraiReel ? 'Vrai' : 'Faux') || e.estVrai !== vraiReel) faux(e, 'vrai/faux ' + F + ' attendu ' + vraiReel + ' min=' + mn.toFixed(4));
            // le minimum cite dans le detail est le vrai minimum
            const ligneMin = D.lignes.find((l) => /Le minimum de l'expression est/.test(l)); const mm = ligneMin.match(/est \} (-?(?:\\dfrac\{\d+\}\{\d+\}|\d+))/);
            if (!mm || !proche(fr(mm[1]), mn, 1e-3)) faux(e, 'minimum cite ' + ligneMin + ' reel ' + mn.toFixed(4));
            compte('1.9');
          }
          else if (/^1\.10 /.test(id)) {
            const [gch, drt] = tx.split('='); const f = (x, y) => val(gch, { x, y }) - val(drt, { x, y });
            const c = f(0, 0), bx = (f(1, 0) - f(-1, 0)) / 2, by = (f(0, 1) - f(0, -1)) / 2;
            if (!proche((f(1, 0) + f(-1, 0) - 2 * c) / 2, 1) || !proche((f(0, 1) + f(0, -1) - 2 * c) / 2, 1)) { faux(e, 'pas un cercle'); continue; }
            const cx = -bx / 2, cy = -by / 2, r2 = cx * cx + cy * cy - c, m = F.match(/^\\Omega\((.+)\\,;\\,(.+)\) \\text\{ et \} r=(.+)$/);
            if (!m || !proche(fr(m[1]), cx) || !proche(fr(m[2]), cy) || !proche(fr(m[3]) ** 2, r2) || fr(m[3]) <= 0) faux(e, 'cercle ' + F + ' attendu ' + [cx, cy, Math.sqrt(r2)]);
            if (!proche(e.cx, cx) || !proche(e.cy, cy) || !proche(e.r, Math.sqrt(r2))) faux(e, 'attendu de la fiche different');
            compte('1.10');
          }
          else if (id === '1.7 a)' || id === '1.7 b)') {
            const g = pg[id === '1.7 a)' ? 'g1_7a' : 'g1_7b'], o = g.options.find((q) => q.lettre === F);
            if (!o || F !== e.bonneReponse) { faux(e, 'lettre ' + F); continue; }
            const fo = (x) => val(o.texte, { x }), fa = (x) => (g.a.n / g.a.d) * (x - g.alpha) ** 2 + g.beta;
            if (![-3, 0, 1.5, 4].every((x) => proche(fo(x), fa(x)))) faux(e, 'option ' + F + ' differente de la courbe');
            if (g.options.filter((q) => [-3, 0, 1.5, 4].every((x) => proche(val(q.texte, { x }), fa(x)))).length !== 1) faux(e, 'plusieurs options justes');
            const s = D.lignes[2].match(/S\((.+)\\,;\\,(.+)\)/); if (!s || !proche(fr(s[1]), g.alpha) || !proche(fr(s[2]), g.beta)) faux(e, 'sommet cite ' + D.lignes[2]);
            const prop = D.lignes[3].replace(/^\\text\{[^}]*\} /, ''); if (![-3, 0, 1.5, 4].every((x) => proche(val(prop, { x }), fa(x)))) faux(e, 'proposition citee ' + D.lignes[3]);
            compte('1.7');
          }
          else if (id === '1.8 a)' || id === '1.8 b)') {
            const g = pg[id === '1.8 a)' ? 'g1_8a' : 'g1_8b'], aff = texteFonctionQuadratique(g.p, g.q, g.r, 'x'); const [a, bb, c] = coefs(aff, 'x');
            const al = -bb / (2 * a), be = c - bb * bb / (4 * a); const k = g.variantes.findIndex((q) => proche(q.a, a) && proche(q.alpha, al) && proche(q.beta, be));
            if (k < 0 || String(k + 1) !== F || F !== e.bonneReponse) faux(e, 'figure ' + F + ' attendue ' + (k + 1));
            if (g.variantes.filter((q) => proche(q.a, a) && proche(q.alpha, al) && proche(q.beta, be)).length !== 1) faux(e, 'plusieurs figures justes');
            const s = D.lignes.find((l) => /Le sommet est/.test(l)).match(/S\((.+)\\,;\\,(.+)\)/); if (!s || !proche(fr(s[1]), al) || !proche(fr(s[2]), be)) faux(e, 'sommet cite');
            const sens = D.lignes.find((l) => /parabole tournée/.test(l)); if (/haut/.test(sens) !== (a > 0)) faux(e, 'sens ' + sens);
            compte('1.8');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
