// Verification independante des details de Premiere 4 (puissances, nombre derive, tableaux de variation, tangente a une parabole) : recalcul a partir de l'enonce et des courbes tracees
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 300);
const FICHE = process.argv[3] || 'cahiers/premiere/cahier-2/fiche-04.html';
(async () => {
  const s = http.createServer((req, res) => { const f = path.join(RACINE, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0, '127.0.0.1');
  await new Promise((r) => s.on('listening', r));
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${s.address().port}/${FICHE}`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof exercices !== 'undefined' && window.math && document.querySelector('.question'), null, { timeout: 40000 });
  const r = await p.evaluate((N) => {
    const defauts = [], stats = {}; const compte = (k) => { stats[k] = (stats[k] || 0) + 1; };
    const faux = (e, m) => { if (defauts.length < 14) defauts.push(e.id + ' : ' + m + ' | ' + String(e.enonce).replace(/\s+/g, ' ').slice(0, 110)); };
    const proche = (a, c, tol = 1e-7) => Math.abs(a - c) <= tol * (1 + Math.abs(a) + Math.abs(c));
    const mj = (t) => {
      let u = String(t).replace(/\\left|\\right|\\,|\\ /g, ' ').replace(/\\times/g, '*');
      for (let i = 0; i < 6; i++) u = u.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
      return u.replace(/(\d)\s*\(/g, '$1*(').replace(/\)\s*(\d)/g, ')*$1').replace(/(\d)\s*([a-zA-Z])/g, '$1*$2').replace(/\)\s*\(/g, ')*(').replace(/\)\s*([a-zA-Z])/g, ')*$1');
    };
    const cache = {}; const val = (t, sc) => { const k = String(t); return (cache[k] || (cache[k] = math.compile(mj(k)))).evaluate(sc || {}); };
    const interieur = (tx) => tx.match(/\\\((.*)\\\)/)[1];
    const deriv = (f, x) => (f(x + 1e-5) - f(x - 1e-5)) / 2e-5;
    for (let tt = 0; tt < N; tt++) {
      const ex = genererExercices(); const gp = paramsGraphiques;
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (/^4\.1 /.test(id)) { const P = interieur(tx); for (const n of [1, 2, 3, 4]) if (!proche(val(P, { n }), val(F, { n }), 1e-9) || !proche(val(P, { n }), math.evaluate(e.reponse, { n }), 1e-9)) faux(e, '4.1 n=' + n + ' ' + F); if (!/^2\^\{[^{}]*\}$/.test(F)) faux(e, 'forme 2^k ' + F); compte('4.1'); }
          else if (/^4\.2 /.test(id)) { const P = interieur(tx); for (const n of [1.7, 2.3, -3.1, 5]) if (!proche(val(P, { n }), val(F, { n }), 1e-9)) faux(e, '4.2 n=' + n + ' ' + F); if (/\\dfrac\{[^{}]*\}\{1\}/.test(F)) faux(e, 'dfrac sur 1'); compte('4.2'); }
          else if (id === '4.3 a) 1') {
            const g = gp.g6_3, f = (x) => (1 / g.m) * (x - g.p) * (x - g.p) * (x - g.q) + g.r; if (Math.abs(deriv(f, g.p)) > 1e-6 || F !== '0' || !tx.includes("(" + g.p + ")")) faux(e, 'f\'(p) ' + F); compte('4.3a1');
          }
          else if (id === '4.3 a) 2' || id === '4.3 b)') {
            const g = id === '4.3 b)' ? gp.g6_3g : gp.g6_3, x0 = id === '4.3 b)' ? g.p2 : g.q;
            const f = id === '4.3 b)' ? (x) => (1 / g.m) * (x ** 3 / 3 - g.e * x * x / 2) + g.C0 : (x) => (1 / g.m) * (x - g.p) * (x - g.p) * (x - g.q) + g.r;
            const pente = deriv(f, x0), v = val(F);
            if (!proche(pente, v, 1e-5)) faux(e, 'pente ' + F + ' attendu ' + pente);
            const m = D.lignes.join(' ').match(/A\((-?\d+)\\,;\\,(-?\d+)\).*B\((-?\d+)\\,;\\,(-?\d+)\)/); if (!m) { faux(e, 'points illisibles'); continue; }
            const [xA, yA, xB, yB] = m.slice(1).map(Number), tang = (x) => f(x0) + pente * (x - x0);
            if (xA !== x0 || !proche(yA, f(x0), 1e-7) || !proche(yB, tang(xB), 1e-6) || Math.abs(xB - x0) > 2.2 || xB === xA) faux(e, 'points de la tangente A(' + xA + ';' + yA + ') B(' + xB + ';' + yB + ') f(x0)=' + f(x0));
            compte('4.3tangente');
          }
          else if (id === '4.4') {
            const g = gp.g6_4, num = Number(F.slice(1)); const vrai = g.ordre[num - 1];
            if (!vrai || !vrai.estCorrect || F !== e.bonneReponse) faux(e, 'numero ' + F);
            const s0 = g.k > 0 ? '+' : '-'; if (JSON.stringify(vrai.sens) !== JSON.stringify([s0, s0 === '+' ? '-' : '+', s0])) faux(e, 'sens du tableau');
            const fp = (x) => g.k * (x - g.r1) * (x - g.r2); if (Math.abs(fp(g.r1)) > 1e-9 || Math.abs(fp(g.r2)) > 1e-9) faux(e, 'racines de f\'');
            const t = D.lignes.find((l) => /begin\{array\}/.test(l)).replace(/\s+/g, ' '); if (!t.includes(' ' + g.r1 + ' ') && !t.includes('& ' + g.r1 + ' ')) faux(e, 'racine absente du tableau ' + t.slice(0, 80));
            const signes = (t.match(/f'\(x\) & & ([+-]) & 0 & ([+-]) & 0 & ([+-])/) || []).slice(1); if (signes.join('') !== [s0, s0 === '+' ? '-' : '+', s0].join('')) faux(e, 'signes du detail ' + signes);
            // le signe de f' lu sur la courbe
            for (const [x, sg] of [[g.r1 - 1, s0], [(g.r1 + g.r2) / 2, s0 === '+' ? '-' : '+'], [g.r2 + 1, s0]]) if ((fp(x) > 0 ? '+' : '-') !== sg) faux(e, 'signe de f\' faux en ' + x);
            compte('4.4');
          }
          else if (id === '4.5 a)' || id === '4.5 b)') {
            const g = gp[id === '4.5 a)' ? 'g6_5a' : 'g6_5b'], num = Number(F.slice(1)); const o = g.ordre[num - 1];
            if (!o || !o.estCorrect || o.type !== 'F' || F !== e.bonneReponse) faux(e, 'numero ' + F);
            const fp = (x) => g.coeffs.cub.k * x ** 3 + g.coeffs.cub.p * x * x + g.coeffs.cub.q * x + g.coeffs.cub.C;
            const [ra, rb, rc] = g.racines; for (const rr of [ra, rb, rc]) if (Math.abs(fp(rr)) > 1e-6) faux(e, 'racine de f\' ' + rr + ' -> ' + fp(rr));
            if (!(ra < rb && rb < rc)) faux(e, 'racines non croissantes');
            const tests = [ra - 1, (ra + rb) / 2, (rb + rc) / 2, rc + 1].map((x) => (fp(x) > 0 ? '+' : '-'));
            if (JSON.stringify(tests) !== JSON.stringify(g.sens)) faux(e, 'sens ' + g.sens + ' attendu ' + tests);
            const t = D.lignes.find((l) => /begin\{array\}/.test(l)).replace(/\s+/g, ' '); const sg = (t.match(/f'\(x\) & & ([+-]) & 0 & ([+-]) & 0 & ([+-]) & 0 & ([+-])/) || []).slice(1);
            if (sg.join('') !== tests.join('')) faux(e, 'signes du detail ' + sg + ' attendu ' + tests);
            const fl = (t.match(/f & & (\\\w+) & & (\\\w+) & & (\\\w+) & & (\\\w+)/) || []).slice(1); if (fl.join('') !== tests.map((z) => (z === '+' ? '\\nearrow' : '\\searrow')).join('')) faux(e, 'fleches ' + fl);
            const arr = (v) => (Math.abs(v - Math.round(v)) < 1e-6 ? String(Math.round(v)) : (v < 0 ? '-' : '') + Math.abs(v).toFixed(2).replace('.', '{,}'));
            for (const rr of [ra, rb, rc]) if (!t.includes(arr(rr))) faux(e, 'racine arrondie absente ' + arr(rr));
            // la courbe designee a bien pour derivee f' : sa derivee numerique a le signe lu
            const Fn = o.fn; for (let i = 0; i < 4; i++) { const x = [ra - 1, (ra + rb) / 2, (rb + rc) / 2, rc + 1][i]; if ((deriv(Fn, x) > 0 ? '+' : '-') !== tests[i]) faux(e, 'courbe designee : sens faux en ' + x); }
            compte('4.5');
          }
          else if (/^4\.6 /.test(id)) {
            const g = gp.g6_6, a = g.n / g.d, f = (x) => a * x * x, fp = (x) => 2 * a * x;
            for (const t of [-1.7, -0.6, 0.4, 1.3, 2.2]) {
              const sc = { t };
              if (id === '4.6 a)') { if (!proche(val(F, sc), fp(t), 1e-9) || !proche(math.evaluate(e.reponse, sc), fp(t), 1e-9) || !proche(val(e.correctionLatex, sc), fp(t), 1e-9)) faux(e, '4.6a f\'(t) ' + F); }
              else if (id === '4.6 b)') {
                const m = F.replace(/^y = /, '').match(/^(.*?)x(.*)$/); if (!m) { faux(e, 'forme y=ax+b ' + F); break; }
                const pente = val(m[1], sc), ord = val(m[2], sc);
                for (const x of [-2, 0.5, 3]) if (!proche(pente * x + ord, f(t) + fp(t) * (x - t), 1e-8)) faux(e, 'tangente ' + F);
                if (e.correctionLatex !== F) faux(e, 'corrige affiche <> detail : ' + e.correctionLatex);
                const rep = e.reponse.replace(/^\(/, '').match(/^(.*)\)\*x([+-].*)?$/); if (!rep) { faux(e, 'reponse ' + e.reponse); break; }
                for (const x of [-2, 3]) if (!proche(math.evaluate(e.reponse, { t, x }), f(t) + fp(t) * (x - t), 1e-8)) faux(e, 'reponse attendue ' + e.reponse);
              }
              else if (id === '4.6 c)') { if (!proche(val(F, sc), t - f(t) / fp(t), 1e-9) || !proche(math.evaluate(e.reponse, sc), t - f(t) / fp(t), 1e-9) || !proche(val(e.correctionLatex, sc), t - f(t) / fp(t), 1e-9)) faux(e, 'abscisse de I ' + F); }
              else if (id === '4.6 d)') { if (!proche(val(F, sc), f(t) - fp(t) * t, 1e-9) || !proche(math.evaluate(e.reponse, sc), f(t) - fp(t) * t, 1e-9) || !proche(val(e.correctionLatex, sc), f(t) - fp(t) * t, 1e-9)) faux(e, 'ordonnee de J ' + F); }
              else if (id === '4.6 e)') {
                const sur = /\[H\\,M\(t\)\]/.test(tx) ? 'HM' : /\[OH\]/.test(tx) ? 'OH' : null; if (!sur) { faux(e, 'segment illisible'); break; }
                const I = [t - f(t) / fp(t), 0], mil = sur === 'OH' ? [(0 + t) / 2, 0] : [(t + t) / 2, (0 + f(t)) / 2], vrai = Math.abs(mil[0] - I[0]) < 1e-9 && Math.abs(mil[1] - I[1]) < 1e-9;
                if (e.estVrai !== vrai || F !== (vrai ? 'Vrai' : 'Faux')) faux(e, 'milieu ' + sur + ' : attendu ' + vrai);
              }
            }
            if (id === '4.6 a)' && !(g.n !== 0 && g.d > 0)) faux(e, 'parametre a');
            compte('4.6');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
