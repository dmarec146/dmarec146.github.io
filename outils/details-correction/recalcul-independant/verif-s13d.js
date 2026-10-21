// Verification independante des details de Seconde 13 : l'enonce affiche fait foi ; chaque ligne d'un detail est evaluee comme PREDICAT sur x
// en des points choisis autour de toutes les bornes (les points de bord compris), puis comparee a l'enonce et a la reponse finale.
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 300);
const FICHE = process.argv[3] || 'cahiers/seconde/cahier-4/fiche-13.html';
(async () => {
  const s = http.createServer((req, res) => { const f = path.join(RACINE, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0, '127.0.0.1');
  await new Promise((r) => s.on('listening', r));
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${s.address().port}/${FICHE}`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof exercices !== 'undefined' && window.math && document.querySelector('.question'), null, { timeout: 40000 });
  const r = await p.evaluate((N) => {
    const EPS = 1e-7;
    const nettoyer = (tex) => String(tex).replace(/\\\(|\\\)/g, '').replace(/^\\small\s*/, '').replace(/\{,\}/g, '.').replace(/\\left|\\right/g, '').replace(/\\times/g, '*').replace(/\\,/g, '');
    const exprVersMath = (tex) => { let t = nettoyer(tex);
      for (let i = 0; i < 8; i++) t = t.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
      t = t.replace(/\|([^|]*)\|/g, 'abs($1)').replace(/[{}]/g, '').replace(/(\d)x/g, '$1*x').replace(/\)x/g, ')*x').replace(/(\d)\(/g, '$1*(').replace(/x\(/g, 'x*(');
      return t; };
    const val = (tex, x) => math.evaluate(exprVersMath(tex), { x });
    // predicat d'une ligne : ou / et / chaines de relations ; renvoie une fonction x -> booleen, ou null si la ligne n'est pas un predicat sur x
    const OPS = [['\\leqslant', 'le'], ['\\geqslant', 'ge'], ['\\lt', 'lt'], ['\\gt', 'gt'], ['=', 'eq']];
    const relation = (a, op, c) => op === 'le' ? a <= c + EPS : op === 'ge' ? a >= c - EPS : op === 'lt' ? a < c - EPS : op === 'gt' ? a > c + EPS : Math.abs(a - c) < EPS * Math.max(1, Math.abs(c));
    function predicat(ligne) {
      let l = String(ligne).replace(/^\\small\s*/, '').replace(/^\s*\\iff\s*/, '');
      if (/\\in\b|\\notin|\\cap|\\cup|\\emptyset|\\mathbb|^S|^E|\\text\{[^{}]*[a-zé]{4,}[^{}]*\}\s*$/.test(l.replace(/\\text\{ (ou|et) \}/g, ''))) return null;
      if (!/x/.test(l) || /\\text\{(?! (ou|et) )/.test(l)) return null;
      const groupes = l.split(/\\text\{ ou \}/).map((g) => g.split(/\\text\{ et \}/).map((piece) => {
        let marque = piece; for (const [tex, tok] of OPS) marque = marque.split(tex).join(' §' + tok + '§ ');
        const t = marque.split(/§(le|ge|lt|gt|eq)§/).map((z) => z.trim()); if (t.length < 3 || t.length % 2 === 0) throw new Error('relation illisible : ' + piece);
        return { exprs: t.filter((_, i) => i % 2 === 0), ops: t.filter((_, i) => i % 2 === 1) }; }));
      return (x) => groupes.some((g) => g.every((pc) => pc.ops.every((op, i) => relation(val(pc.exprs[i], x), op, val(pc.exprs[i + 1], x)))));
    }
    const nombresDe = (txt) => { const out = []; const re = /(\\dfrac\{(-?\d+)\}\{(\d+)\})|(-?\d+(?:\{,\}\d+)?)/g; let m; const t = String(txt).replace(/\\dfrac\{(\d+)\}\{(\d+)\}/g, 'F$1_$2');
      const re2 = /F(\d+)_(\d+)|(\d+(?:\{,\}\d+)?)/g; while ((m = re2.exec(t))) { const v = m[1] ? Number(m[1]) / Number(m[2]) : Number(m[3].replace('{,}', '.')); out.push(v, -v); } return out; };
    const points = (textes) => { const base = new Set([0]); textes.forEach((t) => nombresDe(t).forEach((v) => base.add(Math.round(v * 1e9) / 1e9)));
      const tri = [...base].sort((a, b) => a - b); const pts = new Set(tri); for (let i = 0; i + 1 < tri.length; i++) pts.add((tri[i] + tri[i + 1]) / 2);
      pts.add(tri[0] - 3); pts.add(tri[tri.length - 1] + 3); return [...pts]; };
    const parseIntervalles = (txt) => { const R = []; const re = /([\[\]])((?:[^\[\]])*?)\\,;\\,((?:[^\[\]])*?)([\[\]])/g; let m;
      const v = (z) => (/\\infty/.test(z) ? (z.includes('-') ? -Infinity : Infinity) : math.evaluate(exprVersMath(z), {}));
      while ((m = re.exec(txt))) R.push({ bas: v(m[2]), haut: v(m[3]), ib: m[1] === '[', ih: m[4] === ']' }); return R; };
    const dansIv = (x, L) => L.some((iv) => (x > iv.bas + EPS || (Math.abs(x - iv.bas) < EPS && iv.ib)) && (x < iv.haut - EPS || (Math.abs(x - iv.haut) < EPS && iv.ih)));
    const defauts = [], stats = {}; const compte = (k) => { stats[k] = (stats[k] || 0) + 1; };
    const faux = (e, m) => { if (defauts.length < 14) defauts.push(e.id + ' : ' + m + ' | ' + String(e.enonce).replace(/\s+/g, ' ').slice(0, 110)); };
    for (let t = 0; t < N; t++) {
      const ex = genererExercices();
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, L = D.lignes;
        try {
          if (/^13\.1 |^13\.2 |^13\.4 |^13\.9 a/.test(id)) {
            const attendu = /^13\.4 /.test(id) ? (() => { const m = e.enonce.match(/\\\((.+?)\\\) et \\\((.+?)\\\)/); return Math.abs(val(m[1], 0) - val(m[2], 0)); })()
              : val(/^13\.9 a/.test(id) ? e.enonce.match(/\\sqrt\{\(.+?\)\^2\}/)[0] : e.enonce, 0);
            if (Math.abs(attendu - val(F, 0)) > 1e-9 || Math.abs(attendu - Number(e.reponse)) > 1e-9) faux(e, 'valeur ' + attendu + ' vs ' + F + ' / ' + e.reponse); compte(id.slice(0, 4));
          }
          else if (/^13\.9 b/.test(id)) {
            const Nn = Number(e.enonce.match(/sqrt\{(\d+)\}/)[1]), p = e.enonce.includes('0{,}01') ? 2 : 1; const m = F.match(/^([\d{},]+) \\lt \\sqrt\{(\d+)\} \\lt ([\d{},]+)$/);
            const bas = val(m[1], 0), haut = val(m[3], 0);
            if (Number(m[2]) !== Nn || !(bas * bas < Nn && Nn < haut * haut) || Math.abs(haut - bas - Math.pow(10, -p)) > 1e-9 || Math.abs(bas - Math.floor(Math.sqrt(Nn) * Math.pow(10, p)) / Math.pow(10, p)) > 1e-9) faux(e, 'balayage ' + F); compte('13.9b');
          }
          else {
            // ---- les exercices de type predicat sur x : equation, inequation, systeme, encadrement
            let phrase = e.enonce.replace(/^[^\\|]*?(\\\(|\\\[)/, '$1').replace(/\\begin\{cases\}|\\end\{cases\}|\\\[|\\\]/g, '').trim();
            let oracle;   // x -> booleen, ecrit a partir de l'enonce
            if (/^13\.9 c/.test(id)) { const ps = phrase.replace(/^.*?:\s*/, '').split('\\\\').map((z) => predicat(z.trim().replace(/\\\)$/, ''))); oracle = (x) => ps.every((f) => f(x)); }
            else if (/^13\.7 /.test(id)) { const m = phrase.replace(/\\\(|\\\)/g, '').trim(); const pr = predicat(m.replace(/x/, 'x')); oracle = pr; }
            else if (/^13\.9 d/.test(id)) oracle = predicat(phrase.replace(/^.*?:\s*/, '').replace(/\\\(|\\\)/g, ''));
            else oracle = predicat(phrase.replace(/\\\(|\\\)/g, ''));
            if (!oracle) throw new Error('enonce illisible : ' + phrase);
            const pts = points([e.enonce, ...L, F]);
            // reponse finale
            let reponseFinale;
            if (e.type === 'valAbs') reponseFinale = predicat(F);
            else if (e.type === 'encadrement') reponseFinale = predicat(F);
            else if (F === '\\emptyset') reponseFinale = () => false;
            else if (F === '\\mathbb{R}') reponseFinale = () => true;
            else if (/^\\\{/.test(F)) { const el = F.replace(/^\\\{|\\\}$/g, '').split('\\,;\\,').map((z) => val(z, 0)); reponseFinale = (x) => el.some((v) => Math.abs(v - x) < 1e-7); }
            else { const ivs = parseIntervalles(F); reponseFinale = (x) => dansIv(x, ivs); }
            // pour une equation, ajouter les solutions comme points de test
            const ptsTest = pts.slice(); if (/^13\.3 /.test(id) && /^\\\{/.test(F)) F.replace(/^\\\{|\\\}$/g, '').split('\\,;\\,').forEach((z) => ptsTest.push(val(z, 0)));
            for (const x of ptsTest) {
              const o = oracle(x);
              if (reponseFinale(x) !== o) { faux(e, 'reponse finale fausse en x=' + x + ' (enonce ' + o + ') : ' + F); break; }
              let cible = o, mal = false;
              for (const l of L) {
                const pr = (() => { try { return predicat(l); } catch (er) { return null; } })();
                if (!pr) continue;
                if (!/^\s*\\iff/.test(l)) { /* nouvelle ligne de depart : si elle n'est pas la premiere, elle definit sa propre cible */ cible = pr(x); if (l === L[0] || /^(\\small )?(\||[-\d])/.test(l) === false) { } continue; }
                if (pr(x) !== cible) { faux(e, 'ligne fausse en x=' + x + ' : ' + l + ' (attendu ' + cible + ')'); mal = true; break; }
              }
              if (mal) break;
            }
            // cible de la premiere ligne = enonce : elle doit etre equivalente a l'enonce
            const p0 = (() => { try { return predicat(L[0]); } catch (er) { return null; } })();
            if (p0 && !/^13\.9 c/.test(id)) for (const x of ptsTest) if (p0(x) !== oracle(x)) { faux(e, 'premiere ligne differente de l\'enonce en x=' + x); break; }
            compte(id.slice(0, 4));
          }
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
