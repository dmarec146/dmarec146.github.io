// usage : node dump-details.js <chemin fiche> [nombre de tirages] [filtre id]
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const fiche = process.argv[2], tirages = Number(process.argv[3] || 1), filtre = process.argv[4] || '';
(async () => {
  const s = http.createServer((req, res) => { const f = path.join(RACINE, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0, '127.0.0.1');
  await new Promise((r) => s.on('listening', r));
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${s.address().port}/${fiche}`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof exercices !== 'undefined' && window.math && document.querySelector('.question'), null, { timeout: 40000 });
  const r = await p.evaluate(([n, filtre]) => { const o = []; for (let k = 0; k < n; k++) { const ex = genererExercices(); ex.forEach((e) => { if (!e.detail) return; if (filtre && !e.id.startsWith(filtre)) return; o.push(e.id + ' | ' + String(e.enonce).replace(/<svg[\s\S]*?<\/svg>/g, ' [figure] ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 110) + ' | rep=' + (e.reponse !== undefined ? e.reponse : '') + '\n     ' + e.detail.lignes.join('\n     ') + '\n     FINAL: ' + e.detail.final); }); o.push('-----'); } return o; }, [tirages, filtre]);
  console.log(r.join('\n')); await b.close(); s.close(); process.exit(0);
})();
