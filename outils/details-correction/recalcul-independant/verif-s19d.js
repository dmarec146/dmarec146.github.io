// Verification independante des details de Seconde 19 (taux, fractions, statistiques en classes, tableaux croises) : tout est recalcule a partir de l'enonce affiche
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 300);
const FICHE = process.argv[3] || 'cahiers/seconde/cahier-6/fiche-19.html';
(async () => {
  const s = http.createServer((req, res) => { const f = path.join(RACINE, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0, '127.0.0.1');
  await new Promise((r) => s.on('listening', r));
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${s.address().port}/${FICHE}`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof exercices !== 'undefined' && window.math && document.querySelector('.question'), null, { timeout: 40000 });
  const r = await p.evaluate((N) => {
    const nettoyer = (tex) => String(tex).replace(/\\\(|\\\)/g, '').replace(/\{,\}/g, '.').replace(/\\left|\\right/g, '').replace(/\\times/g, '*').replace(/\\,/g, '').replace(/\\%/g, '').replace(/\\text\{[^{}]*\}/g, '');
    const toMath = (tex) => { let t = nettoyer(tex); for (let i = 0; i < 8; i++) t = t.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))'); return t; };
    const val = (tex) => math.evaluate(toMath(tex));
    const defauts = [], stats = {}; const compte = (k) => { stats[k] = (stats[k] || 0) + 1; };
    const faux = (e, m) => { if (defauts.length < 14) defauts.push(e.id + ' : ' + m + ' | ' + String(e.enonce).replace(/<svg[\s\S]*?<\/svg>/g, '[figure]').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 110)); };
    const proche = (a, c, tol = 1e-9) => Math.abs(a - c) <= tol;
    const tuple = (F) => F.replace(/\\left|\\right|\\,/g, '').replace(/^\(|\)$/g, '').split(';').map((z) => val(z));
    const lignesTab = (enonce) => [...String(enonce).matchAll(/<tr>(.*?)<\/tr>/g)].map((m) => [...m[1].matchAll(/<td[^>]*>(.*?)<\/td>/g)].map((z) => z[1]));
    const nb = (z) => Number(String(z).replace(/\\\(|\\\)/g, ''));
    const classesEff = (enonce) => { const T = lignesTab(enonce); const classes = T[0].slice(1).map((z) => [...z.matchAll(/\d+/g)].map((m) => Number(m[0]))); return { classes, eff: T[1].slice(1).map(nb) }; };
    const stat = (classes, eff) => { const Ntot = eff.reduce((a, x) => a + x, 0); const moy = classes.reduce((a, c, i) => a + (c[0] + c[1]) / 2 * eff[i], 0) / Ntot; let acc = 0, im = -1; eff.forEach((x, i) => { acc += x; if (im < 0 && acc >= Ntot / 2) im = i; }); return { Ntot, moy, im }; };
    const croise = (enonce) => { const T = lignesTab(enonce); const A = T[1].slice(1, 4).map(nb), B = T[2].slice(1, 4).map(nb); return { A, B }; };
    for (let t = 0; t < N; t++) {
      const ex = genererExercices();
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, L = D.lignes;
        try {
          if (/^19\.1 /.test(id)) {
            const m = e.enonce.match(/initiale \\\((\d+)\\\), valeur finale \\\((\d+(?:\.\d+)?)\\\)/); const t2 = (Number(m[2]) - Number(m[1])) / Number(m[1]) * 100;
            if (!proche(t2, val(F.replace(/^\+/, '')), 1e-7) || !proche(t2, e.reponsePourcent, 1e-7)) faux(e, 'taux ' + F + ' attendu ' + t2); if (t2 > 0 && !/^\+/.test(F)) faux(e, 'signe +'); compte('19.1');
          }
          else if (/^19\.2 /.test(id)) {
            const exp = e.enonce.replace(/\\dfrac\{(\d+)\}\{(\d+)\}/g, '($1/$2)').replace(/\\times/g, '*'); const v = math.evaluate(exp);
            if (!proche(v, val(F), 1e-9) || !proche(v, val(e.reponse), 1e-9)) faux(e, 'fractions ' + F + ' attendu ' + v); compte('19.2' + id[5]);
          }
          else if (/^19\.[34] /.test(id)) {
            let classes, eff;
            if (/^19\.3/.test(id)) ({ classes, eff } = classesEff(e.enonce));
            else { const g = e.enonce.match(/data-bornes="([^"]*)" data-effectifs="([^"]*)"/); const bo = g[1].split(',').map(Number); eff = g[2].split(',').map(Number); classes = eff.map((_, i) => [bo[i], bo[i + 1]]); }
            const S = stat(classes, eff), r = tuple(F);
            if (r[0] !== S.Ntot || !proche(r[1], S.moy, 1e-9) || !proche(r[1], tuple(e.reponse)[1], 1e-9)) faux(e, 'classes ' + F + ' attendu ' + S.Ntot + ';' + S.moy); compte('19.' + id[3]);
          }
          else if (/^19\.5 /.test(id)) {
            const { classes, eff } = classesEff(e.enonce); const iC = classes.findIndex((c) => e.enonce.includes('classe \\([' + c[0] + '\\,;\\,' + c[1] + '[\\)')); const S = stat(classes, eff);
            const cum = eff.slice(0, iC + 1).reduce((a, x) => a + x, 0), r = tuple(F);
            if (iC < 0 || r[0] !== cum || r[1] !== classes[S.im][0]) faux(e, 'cumul/classe mediane ' + F + ' attendu ' + cum + ';' + (classes[S.im] || [])[0]); compte('19.5');
          }
          else if (/^19\.6 /.test(id)) {
            const { A, B } = croise(e.enonce), tot = [0, 1, 2].map((j) => A[j] + B[j]), Nt = tot.reduce((a, x) => a + x, 0), totA = A.reduce((a, x) => a + x, 0), totB = B.reduce((a, x) => a + x, 0);
            const j = Number(e.enonce.match(/« Groupe (\d) »/)[1]) - 1; const r = tuple(F); let a1, a2;
            if (id === '19.6 a)') { a1 = tot[j] / Nt; a2 = A[j] / tot[j]; }
            else if (id === '19.6 b)') { a1 = tot[j] / Nt; a2 = B[j] / tot[j]; }
            else if (id === '19.6 c)') { a1 = totA / Nt; a2 = A[j] / tot[j]; }
            else { a1 = tot[j] / Nt; a2 = B[j] / totB; }
            if (!proche(r[0], a1) || !proche(r[1], a2) || !proche(tuple(e.reponse)[0], a1) || !proche(tuple(e.reponse)[1], a2)) faux(e, 'frequences ' + F + ' attendu ' + a1 + ';' + a2); compte('19.6' + id[5]);
          }
          else if (/^19\.7 /.test(id)) {
            const { classes, eff } = classesEff(e.enonce); const S = stat(classes, eff); const cumAvant = eff.slice(0, S.im).reduce((a, x) => a + x, 0);
            const med = classes[S.im][0] + (S.Ntot / 2 - cumAvant) / eff[S.im] * (classes[S.im][1] - classes[S.im][0]);
            if (!proche(med, val(F)) || !proche(med, val(e.reponse))) faux(e, 'mediane ' + F + ' attendu ' + med); compte('19.7');
          }
          else if (/^19\.8 /.test(id)) {
            const c = e.tcr.cellules, j = e.tcr.aCompleter[0].j, tot = [0, 1, 2].map((k) => c[0][k] + c[1][k]), Nt = tot[0] + tot[1] + tot[2];
            const f = val(e.enonce.match(/vaut \\\((.*?)\\\)/)[1]); const colTot = Nt - (tot[(j + 1) % 3] + tot[(j + 2) % 3]), a = f * colTot, bb = colTot - a;
            const m = F.replace(/\s/g, '').match(/^(\d+)\\text\{et\}(\d+)$/);
            if (!m || !proche(Number(m[1]), a) || !proche(Number(m[2]), bb) || a !== c[0][j] || bb !== c[1][j] || Math.abs(a - Math.round(a)) > 1e-9) faux(e, 'tableau croise ' + F + ' attendu ' + a + ' et ' + bb); compte('19.8');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
