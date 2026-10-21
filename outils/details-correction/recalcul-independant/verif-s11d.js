// Verification independante des details de Seconde 11 : chaque reponse attendue et chaque « final » sont recalcules a partir de l'enonce.
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 400);
(async () => {
  const s = http.createServer((req, res) => { const f = path.join(RACINE, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0, '127.0.0.1');
  await new Promise((r) => s.on('listening', r));
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${s.address().port}/cahiers/seconde/cahier-4/fiche-11.html`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof exercices !== 'undefined' && window.math && document.querySelector('.question'), null, { timeout: 40000 });
  const r = await p.evaluate((N) => {
    const val = (tex) => { let t = String(tex).replace(/\\\(|\\\)/g, '').replace(/\{,\}/g, '.').replace(/,/g, '.').replace(/\\left|\\right/g, '').replace(/\\times/g, '*').replace(/\\text\{[^{}]*\}/g, '');
      for (let i = 0; i < 6; i++) t = t.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
      return math.evaluate(t.replace(/[{}]/g, '')); };
    const defauts = [], stats = {}; const compte = (k) => { stats[k] = (stats[k] || 0) + 1; };
    const faux = (e, m) => { if (defauts.length < 14) defauts.push(e.id + ' : ' + m + ' | ' + String(e.enonce).slice(0, 90)); };
    const premier = (n) => { for (let k = 2; k * k <= n; k++) if (n % k === 0) return false; return n > 1; };
    for (let t = 0; t < N; t++) {
      const ex = genererExercices();
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final;
        try {
          if (/^11\.1 /.test(id) || /^11\.4 [a]/.test(id)) { const v = val(e.enonce); if (Math.abs(v - val(F)) > 1e-9 || Math.abs(v - Number(e.reponse)) > 1e-9) faux(e, 'valeur ' + v + ' vs final ' + F + ' / rep ' + e.reponse); compte(id.slice(0, 4)); }
          else if (/^11\.2 /.test(id)) {
            const v = val(e.enonce), m = e.mantisse, x = e.exposant;
            if (Math.abs(v - m * Math.pow(10, x)) > 1e-9 * Math.max(1, Math.abs(v)) || m < 1 || m >= 10) faux(e, 'mantisse/exposant faux ' + m + ' ' + x + ' pour ' + v);
            const fin = F.replace(/\s/g, '').match(/^([\d{},]+)\\times10(?:\^\{(-?\d+)\})?$/); if (!fin || Math.abs(Number(fin[1].replace('{,}', '.')) - m) > 1e-9 || (fin[2] === undefined ? 1 : Number(fin[2])) !== x) faux(e, 'final ' + F);
            if (/\^\{1\}(?!\d)/.test(D.lignes.join(' ') + e.enonce)) faux(e, 'exposant 1 ecrit'); compte('11.2');
          }
          else if (/^11\.3 /.test(id)) {
            const v = val(e.enonce); const entier = Math.abs(v - Math.round(v)) < 1e-9;
            const q = (() => { const s = String(Math.round(v * 1e9) / 1e9); return (s.split('.')[1] || '').length; })();
            const irrat = /\\sqrt\{(\d+)\}/.test(e.enonce) && !/dfrac|\{,\}/.test(e.enonce) && Math.abs(Math.sqrt(Number(e.enonce.match(/\\sqrt\{(\d+)\}/)[1])) % 1) > 1e-9;
            let cat;
            if (irrat) cat = 'R'; else if (entier) cat = v >= 0 ? 'N' : 'Z';
            else { // fraction ou decimal : decimal si le denominateur irreductible n'a que 2 et 5
              let den = 1; for (let d = 1; d <= 100000; d *= 1) { if (Math.abs(v * d - Math.round(v * d)) < 1e-9) { den = d; break; } d = d < 100 ? d + 1 : d * 10; if (d > 100000) { den = 0; break; } }
              cat = den ? (( () => { let x = den; while (x % 2 === 0) x /= 2; while (x % 5 === 0) x /= 5; return x === 1; })() ? 'D' : 'Q') : 'Q';
            }
            if (cat !== e.ensemble || F !== '\\mathbb{' + cat + '}') faux(e, 'ensemble ' + cat + ' attendu, fiche ' + e.ensemble + ' / ' + F); compte('11.3' + cat);
          }
          else if (/^11\.4 [bcd]/.test(id)) { const v = val(e.enonce), f = val(F); if (Math.abs(v - f) > 1e-9) faux(e, 'fraction ' + F); const mm = F.match(/dfrac\{(\d+)\}\{(\d+)\}/); const pg = (a, c) => (c ? pg(c, a % c) : a); if (!mm || pg(Number(mm[1]), Number(mm[2])) !== 1) faux(e, 'fraction non irreductible ' + F); compte('11.4' + id[5]); }
          else if (/^11\.5 /.test(id)) {
            const v = Math.abs(val(e.enonce)), x = Math.floor(Math.log10(v + 1e-300) + 1e-12), m = v / Math.pow(10, x), n = m < 5 ? x : x + 1;
            if (n !== Number(e.reponse) || F !== String(n)) faux(e, 'ordre de grandeur ' + n + ' vs ' + e.reponse + '/' + F); compte('11.5');
          }
          else if (/^11\.6 /.test(id)) {
            const donne = D.lignes[1], reel = D.lignes[0];
            const ex10 = (txt) => { const mm = txt.match(/([\d{},]+)\\times 10(?:\^\{(-?\d+)\})?/) || txt.match(/^\\text\{[^}]*\} *(\d[\d{},]*)\\text/); if (!mm) return null; return mm[2] === undefined ? (mm[0].includes('times 10') ? 1 : 0) : Number(mm[2]); };
            const eD = ex10(donne), eR = ex10(reel);
            if (F !== (e.reponseOuiNon ? 'oui' : 'non')) faux(e, 'final oui/non');
            if (eD !== null && eR !== null) { const proche = Math.abs(eD - eR) <= 0; if (proche !== e.reponseOuiNon && !(eR === null)) faux(e, 'exposants ' + eD + ' / ' + eR + ' mais reponse ' + e.reponseOuiNon); }
            compte('11.6');
          }
          else if (/^11\.7 a/.test(id)) { const mm = e.enonce.match(/overline\{(\d+)\}/)[1]; const P = Number(mm), den = Math.pow(10, mm.length) - 1; const f = val(F); if (Math.abs(f - P / den) > 1e-12 || Math.abs(f - val(e.reponse)) > 1e-12) faux(e, 'periodique ' + F); compte('11.7a'); }
          else if (/^11\.7 b/.test(id)) {
            const c = Number(e.enonce.match(/\\\((\d+)\\\) cm/)[1]), diag = /carré/.test(e.enonce); const att = diag ? c * Math.SQRT2 : c * Math.sqrt(3) / 2;
            if (Math.abs(val(F) - att) > 1e-9 || Math.abs(val(e.reponse) - att) > 1e-9) faux(e, 'geometrie ' + F); compte('11.7b' + (diag ? 'd' : 'h'));
          }
          else if (/^11\.7 c/.test(id)) { const n = Number(e.enonce.match(/dfrac\{1\}\{(\d+)\}/)[1]); let x = n; while (x % 2 === 0) x /= 2; while (x % 5 === 0) x /= 5; const fini = x === 1; if (fini !== e.reponseOuiNon || F !== (fini ? 'oui' : 'non')) faux(e, 'decimal fini ' + fini); if (fini) { const mm = D.lignes[D.lignes.length - 2].match(/= ([\d{},]+)$/); if (!mm || Math.abs(Number(mm[1].replace('{,}', '.')) - 1 / n) > 1e-12) faux(e, 'valeur decimale ' + D.lignes[D.lignes.length - 2]); } compte('11.7c' + (fini ? 'f' : 'n')); }
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
