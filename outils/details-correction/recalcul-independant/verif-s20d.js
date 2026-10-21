// Verification independante des details de Seconde 20 (probabilites) : tout est recalcule a partir de l'enonce affiche (tableaux, arbres SVG, textes)
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 300);
const FICHE = process.argv[3] || 'cahiers/seconde/cahier-7/fiche-20.html';
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
    const dec = (z) => Number(String(z).replace(/\{,\}/g, '.').replace(',', '.'));
    const tuple = (F) => F.replace(/\\left|\\right|\\,/g, '').replace(/^\(|\)$/g, '').split(';').map((z) => val(z));
    const entiers = (F) => (String(F).replace(/(\d)\\,(\d{3})(?!\d)/g, '$1$2').match(/-?\d+/g) || []).map(Number);
    const lignesTab = (h) => [...String(h).matchAll(/<tr>(.*?)<\/tr>/g)].map((m) => [...m[1].matchAll(/<td[^>]*>(.*?)<\/td>/g)].map((z) => z[1]));
    const textes = (h) => { const d = document.createElement('div'); d.innerHTML = h; return [...d.querySelectorAll('svg text')].map((t) => t.textContent); };
    const probasTable = (h) => lignesTab(h)[1].slice(1).map((z) => val(z));
    const fracOk = (F, rep, v) => proche(val(F), v) && proche(math.evaluate(rep), v);
    for (let t = 0; t < N; t++) {
      const ex = genererExercices(); const par = (id) => ex.find((x) => x.id === id);
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final;
        try {
          if (/^20\.1 /.test(id)) {
            const v = math.evaluate(e.enonce.replace(/\\dfrac\{(\d+)\}\{(\d+)\}/g, '($1/$2)').replace(/\\times/g, '*'));
            if (!fracOk(F, e.reponse, v)) faux(e, 'fractions ' + F + ' attendu ' + v); compte('20.1' + id[5]);
          }
          else if (/^20\.2 /.test(id)) {
            const v = math.evaluate(nettoyer(e.enonce));
            if (!proche(v, val(F), 1e-9) || !proche(v, Number(e.reponse), 1e-9)) faux(e, 'decimaux ' + F + ' attendu ' + v); compte('20.2' + id[5]);
          }
          else if (id === '20.3 b)' || id === '20.3 c)') {
            const pr = probasTable(par('20.3 b)').contexteFigure); let ok;
            if (id === '20.3 b)') ok = [1, 2, 3, 4, 5, 6].filter((v) => (v % 2 === 0) === /numéro pair/.test(e.enonce));
            else { const seuil = Number(e.enonce.match(/à (\d)/)[1]); ok = [1, 2, 3, 4, 5, 6].filter((v) => v % 2 === 0 || v > seuil); }
            const v = ok.reduce((a, k) => a + pr[k - 1], 0);
            if (!fracOk(F, e.reponse, v)) faux(e, 'loi ' + F + ' attendu ' + v); compte('20.3' + id[5]);
          }
          else if (id === '20.4 a)') { const pa = dec(e.enonce.match(/P\(A\)=([\d{,}]+)/)[1]); if (!proche(1 - pa, val(F)) || !proche(1 - pa, Number(e.reponse))) faux(e, 'contraire'); compte('20.4a'); }
          else if (id === '20.4 b)') {
            const m = e.enonce.match(/contient (\d+) \S+ (\S+), (\d+) \S+ (\S+) et (\d+) \S+ (\S+)\. On tire .* ne soit pas (\S+)\.$/); const eff = [Number(m[1]), Number(m[3]), Number(m[5])], coul = [m[2], m[4], m[6]], k = coul.findIndex((c) => c.startsWith(m[7]));
            const v = (eff[0] + eff[1] + eff[2] - eff[k]) / (eff[0] + eff[1] + eff[2]); if (k < 0 || !fracOk(F, e.reponse, v)) faux(e, 'urne ' + F + ' attendu ' + v); compte('20.4b');
          }
          else if (id === '20.4 c)') { const pr = probasTable(e.enonce); const v = 1 - pr[2] - pr[5]; if (!fracOk(F, e.reponse, v)) faux(e, 'contraire loi ' + F + ' attendu ' + v); compte('20.4c'); }
          else if (/^20\.[56] /.test(id)) {
            const T = textes(par(id[3] === '5' ? '20.5 a)' : '20.6 a)').contexteFigure).map((z) => (/^\d,\d$/.test(z) ? dec(z) : z)), pA = T[0], pAb = T[2], bA = T[4], bAb = T[8]; let v;
            if (id === '20.5 a)') v = pA; else if (id === '20.5 b)') v = /P_\{\\overline/.test(e.enonce) ? bAb : bA;
            else if (id === '20.6 a)') v = pA * bA; else if (id === '20.6 b)') v = pAb * bAb; else v = pA * bA + pAb * bAb;
            if (!proche(v, val(F), 1e-9) || !proche(v, Number(e.reponse), 1e-9)) faux(e, 'arbre ' + F + ' attendu ' + v); compte(id.slice(0, 4) + id[5]);
          }
          else if (id === '20.7 a)') {
            const T = textes(e.enonce).map((z) => (/^\d,\d$/.test(z) ? dec(z) : z)), n = Number(e.enonce.match(/population de (\d+) individus/)[1]); const att = [n * T[0] * T[4], n * T[0] * (1 - T[4]), n * T[2] * T[8], n * T[2] * (1 - T[8])];
            const r = entiers(F); if (r.length !== 4 || r.some((z, i) => !proche(z, att[i], 1e-7))) faux(e, 'tableau depuis arbre ' + F + ' attendu ' + att); compte('20.7');
          }
          else if (id === '20.9 a)') {
            const m = e.enonce.match(/Sur (\d+) individus au total, (\d+) vérifient .*?, (\d+) vérifient à la fois .*? et (\d+) vérifient à la fois/); const X = Number(m[2]), Y = Number(m[3]), Z = Number(m[4]);
            const v = Z / (X - Y + Z); if (!fracOk(F, e.reponse, v)) faux(e, 'reconstitution ' + F + ' attendu ' + v); compte('20.9');
          }
          else if (id === '20.10 a)') {
            const T = lignesTab(e.enonce), n11 = Number(T[1][1].replace(/\D/g, '')), n12 = Number(T[1][2].replace(/\D/g, '')), n21 = Number(T[2][1].replace(/\D/g, '')); const r = tuple(F);
            if (!proche(r[0], n11 / (n11 + n12)) || !proche(r[1], n11 / (n11 + n21)) || !proche(tuple(e.reponse.replace(/(\d+)\/(\d+)/g, '$1/$2'))[0] || 0, n11 / (n11 + n12), 1e-9)) faux(e, 'conditionnelles ' + F); compte('20.10');
          }
          else if (/^20\.11 /.test(id)) {
            let tx = String(e.contexteTexte).replace(/\u00a0/g, ''); tx = tx.replace(/(\d)%/g, '$1 %'); const m = tx.match(/population de (\d+) personnes.*?que (\d+) %.*?sensibilité de (\d+) %.*?spécificité de (\d+) %/); const [Np, pr, se, sp] = m.slice(1).map(Number);
            const mal = Np * pr / 100, VP = mal * se / 100, FN = mal - VP, sain = Np - mal, VN = sain * sp / 100, FP = sain - VN;
            if (id === '20.11 a)') { const r = entiers(F), att = [VP, FN, FP, VN]; if (r.length !== 4 || r.some((z, i) => !proche(z, att[i], 1e-6))) faux(e, 'test ' + F + ' attendu ' + att); compte('20.11a'); }
            else { const v = VP / (VP + FP); if (!fracOk(F, e.reponse, v)) faux(e, 'vpp ' + F + ' attendu ' + v); compte('20.11b'); }
          }
          else if (/^20\.8 /.test(id)) {
            const g = (re) => { const m = e.enonce.match(re); return m ? dec(m[1]) : null; };
            const pA = g(/P\(A\)=([\d{,}]+)/), pB = g(/P\(B\)=([\d{,}]+)/), cond = g(/P_A\(B\)=([\d{,}]+)/), inter = g(/P\(A\\cap B\)=([\d{,}]+)/), uni = g(/P\(A\\cup B\)=([\d{,}]+)/), pAb = g(/P\(\\overline\{A\}\)=([\d{,}]+)/); let v;
            if (id === '20.8 a)') v = pA + pB - inter; else if (id === '20.8 b)') v = pA + pB - pA * cond; else if (id === '20.8 c)') v = uni - pA + pA * cond; else v = uni - (1 - pAb) + (1 - pAb) * cond;
            if (!proche(v, val(F), 1e-9) || !proche(v, Number(e.reponse), 1e-9)) faux(e, 'reunion ' + F + ' attendu ' + v); compte('20.8' + id[5]);
          }
          else if (id === '20.12 a)') {
            const T = textes(e.enonce), pA = dec(T[0]), pAb = dec(T[2]); const paires = []; for (let i = 4; i < T.length; i += 2) paires.push([dec(T[i]), T[i + 1]]);
            const iC1 = paires.slice(0, 3).findIndex((z) => z[1] === 'C'), iC2 = paires.slice(3).findIndex((z) => z[1] === 'C'); const pAC = pA * paires[iC1][0], pbC = pAb * paires[3 + iC2][0];
            const v = pAC / (pAC + pbC); if (iC1 < 0 || iC2 < 0 || !fracOk(F, e.reponse, v)) faux(e, 'bayes ' + F + ' attendu ' + v); compte('20.12');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
