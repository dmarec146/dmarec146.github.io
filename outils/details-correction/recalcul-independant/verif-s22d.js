// Verification independante des details de Seconde 22 (vecteurs : Chasles, parallelogramme, milieux, decompositions) :
// chaque egalite vectorielle des details est evaluee avec des coordonnees aleatoires respectant la configuration de l'exercice
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 200);
const FICHE = process.argv[3] || 'cahiers/seconde/cahier-8/fiche-22.html';
(async () => {
  const s = http.createServer((req, res) => { const f = path.join(RACINE, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0, '127.0.0.1');
  await new Promise((r) => s.on('listening', r));
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${s.address().port}/${FICHE}`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof exercices !== 'undefined' && window.math && document.querySelector('.question'), null, { timeout: 40000 });
  const r = await p.evaluate((N) => {
    const defauts = [], stats = {}; const compte = (k) => { stats[k] = (stats[k] || 0) + 1; };
    const faux = (e, m) => { if (defauts.length < 14) defauts.push(e.id + ' : ' + m + ' | ' + String(e.enonce).replace(/<svg[\s\S]*?<\/svg>/g, '[figure]').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 100)); };
    const proche = (a, c, tol = 1e-9) => Math.abs(a - c) <= tol;
    const alea = (a, b) => a + Math.random() * (b - a);
    const nettoyer = (tex) => String(tex).replace(/\\\(|\\\)/g, '').replace(/\\left|\\right/g, '').replace(/\\times/g, '*');
    const toMath = (tex) => { let t = nettoyer(tex); for (let i = 0; i < 6; i++) t = t.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))'); return t; };
    const val = (tex, sc) => math.evaluate(toMath(tex), sc || {});
    // expression de vecteurs : somme de termes coef * \overrightarrow{XY}, ou \vec{0} ; P = { A: [x, y], ... } ; renvoie [x, y] ou null si illisible
    const vecEval = (expr, P) => {
      let t = String(expr).replace(/\s/g, '').replace(/\\iff/g, '');
      if (!t || /\\text|\\left|\\vec\{[a-z]\}/.test(t) || !/\\overrightarrow|\\vec\{0\}/.test(t)) return null;
      const re = /([+-]?)(\\dfrac\{(\d+)\}\{(\d+)\}|\d+)?(\\overrightarrow\{([A-Z])([A-Z])\}|\\vec\{0\})/g; let m, somme = [0, 0], fin = 0, ok = true;
      while ((m = re.exec(t)) !== null) {
        if (m.index !== fin) { ok = false; break; }
        fin = re.lastIndex; const c = (m[1] === '-' ? -1 : 1) * (m[3] ? Number(m[3]) / Number(m[4]) : m[2] ? Number(m[2]) : 1);
        if (m[5] === '\\vec{0}') continue;
        const A = P[m[6]], B = P[m[7]]; if (!A || !B) return null;
        somme = [somme[0] + c * (B[0] - A[0]), somme[1] + c * (B[1] - A[1])];
      }
      return ok && fin === t.length ? somme : null;
    };
    const pointsAlea = (noms) => { const P = {}; noms.forEach((n) => { P[n] = [alea(-9, 9), alea(-9, 9)]; }); return P; };
    const parallelogramme = () => { const A = [alea(-9, 9), alea(-9, 9)], B = [alea(-9, 9), alea(-9, 9)], D = [alea(-9, 9), alea(-9, 9)]; const C = [B[0] + D[0] - A[0], B[1] + D[1] - A[1]]; return { A, B, C, D, I: [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2] }; };
    const egalVec = (u, v) => u && v && proche(u[0], v[0], 1e-7) && proche(u[1], v[1], 1e-7);
    // verifie toutes les egalites vectorielles des lignes (chaines « a = b = c », lignes commençant par \iff) avec la configuration donnee
    const verifierLignes = (e, P, compteur) => {
      for (const l of e.detail.lignes) {
        if (/\\text|\\vec\{[a-z]\}/.test(l)) continue;
        const parties = l.replace(/^\\iff\s*/, '').split('=');
        if (parties.length < 2 || !/\\overrightarrow/.test(l)) continue;
        const vals = parties.map((x) => vecEval(x, P));
        if (vals.some((v) => v === null)) { stats['illisible'] = (stats['illisible'] || 0) + 1; continue; }
        for (let i = 1; i < vals.length; i++) if (!egalVec(vals[0], vals[i])) { faux(e, 'egalite vectorielle fausse : ' + l); return false; }
        compteur && compte(compteur);
      }
      return true;
    };
    for (let t = 0; t < N; t++) {
      const ex = genererExercices(); const par = (id) => ex.find((x) => x.id === id);
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, tx = String(e.enonce);
        try {
          if (/^22\.1 /.test(id)) { const v = val(tx.replace(/\^/g, '^')); if (!proche(v, val(F)) || !proche(v, math.evaluate(e.reponse))) faux(e, 'fraction x entier ' + F); compte('22.1'); }
          else if (/^22\.2 /.test(id)) { const f = (x) => math.evaluate(tx.replace(/(\d)\(/g, '$1*('), { x }), g = (x) => val(F, { x }); if (![-3, 0.5, 4.2].every((x) => proche(f(x), g(x), 1e-7))) faux(e, 'combinaison affine ' + F); compte('22.2'); }
          else if (/^22\.3 /.test(id)) {
            const q = quad21_3, i = ['a', 'b', 'c'].indexOf(id[5]), qq = q.questions[i], v1 = q.vecteurs[qq.i].v, v2 = q.vecteurs[qq.j].v;
            const rep = qq.typeQ === 'egaux' ? (v1[0] === v2[0] && v1[1] === v2[1]) : (v1[0] === -v2[0] && v1[1] === -v2[1]);
            const nom = (v) => v.nom.join(''); if (!tx.includes(nom(q.vecteurs[qq.i])) || !tx.includes(nom(q.vecteurs[qq.j])) || !tx.includes(qq.typeQ === 'egaux' ? 'égaux' : 'opposés')) faux(e, 'enonce incoherent');
            if (F !== (rep ? 'oui' : 'non') || e.reponseOuiNon !== rep) faux(e, 'egaux/opposes ' + F); compte('22.3');
          }
          else if (/^22\.4 /.test(id)) {
            const P = pointsAlea('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')); const att = vecEval(tx.replace(/\\\(|\\\)/g, ''), P);
            const fin = F === '0' ? [0, 0] : vecEval(F, P);
            if (!egalVec(att, fin)) faux(e, 'somme de vecteurs ' + F); if (F === '0' ? false : /^\\overrightarrow/.test(F) === false) faux(e, 'forme finale'); verifierLignes(e, P, '22.4lignes'); compte('22.4');
          }
          else if (/^22\.5 /.test(id)) {
            const Q = parallelogramme(); const P = { A: Q.A, B: Q.B, C: Q.C, D: Q.D, I: Q.I };
            const att = vecEval(tx.replace(/\\\(|\\\)/g, ''), P), fin = F === '\\vec{0}' ? [0, 0] : vecEval(F, P);
            if (!egalVec(att, fin)) faux(e, 'parallelogramme ' + F); verifierLignes(e, P, '22.5lignes'); compte('22.5' + id[5]);
          }
          else if (id === '22.6 a)') { const k = math.evaluate(e.reponse); const l = D.lignes; const sens = /même sens/.test(l[0]) ? 1 : -1; if (Math.sign(k) !== sens) faux(e, 'sens'); const lg = l[1].match(/\\text\{AE est \} (.+) \\text\{ fois/); const ab = /même longueur/.test(l[1]) ? 1 : val(lg[1]); if (!proche(ab, Math.abs(k))) faux(e, 'longueur'); if (!proche(val(F), k)) faux(e, 'k final'); compte('22.6a'); }
          else if (id === '22.6 b)') {
            const m = tx.match(/CJ\}=(.*?)\\overrightarrow\{CB\}/); const k = m[1] === '' ? 1 : val(m[1]); const A = [alea(-9, 9), alea(-9, 9)], B = [alea(-9, 9), alea(-9, 9)], C = [alea(-9, 9), alea(-9, 9)];
            const I = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], J = [C[0] + k * (B[0] - C[0]), C[1] + k * (B[1] - C[1])], P = { A, B, C, I, J };
            const [mm, nn] = F.replace(/\\left|\\right|\\,/g, '').replace(/^\(|\)$/g, '').split(';').map((z) => val(z));
            const IJ = [J[0] - I[0], J[1] - I[1]], comb = [mm * (B[0] - A[0]) + nn * (C[0] - A[0]), mm * (B[1] - A[1]) + nn * (C[1] - A[1])];
            if (!egalVec(IJ, comb)) faux(e, 'decomposition IJ ' + F); verifierLignes(e, P, '22.6blignes'); compte('22.6b');
          }
          else if (id === '22.6 c)') { const Q = parallelogramme(); const I = [(Q.A[0] + Q.B[0]) / 2, (Q.A[1] + Q.B[1]) / 2], J = [(Q.C[0] + Q.D[0]) / 2, (Q.C[1] + Q.D[1]) / 2]; const P = { A: Q.A, B: Q.B, C: Q.C, D: Q.D, I, J }; if (!egalVec(vecEval('\\overrightarrow{IJ}', P), vecEval(F, P))) faux(e, 'IJ = AD'); verifierLignes(e, P, '22.6clignes'); compte('22.6c'); }
          else if (/^22\.7 /.test(id)) {
            const mn = F.replace(/\\left|\\right|\\,/g, '').replace(/^\(|\)$/g, '').split(';').map(Number); const lig = D.lignes.find((l0) => /^.vec.[uv]. =/.test(l0)); const m = lig.match(/=(.*)$/)[1];
            const P = { A: [0, 0], B: [3, 1], C: [-1, 2] }; const u = vecEval(m, P); const att = [mn[0] * 3 + mn[1] * -1, mn[0] * 1 + mn[1] * 2];
            if (!egalVec(u, att) || mn[0] !== Number(e.pa) || mn[1] !== Number(e.pb)) faux(e, 'decomposition lue ' + F); compte('22.7');
          }
          else if (id === '22.8 a)') {
            const A = [alea(-9, 9), alea(-9, 9)], B = [alea(-9, 9), alea(-9, 9)], C = [alea(-9, 9), alea(-9, 9)], G = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3], P = { A, B, C, G };
            if (!egalVec(vecEval('\\overrightarrow{AG}', P), vecEval(F, P))) faux(e, 'AG final'); verifierLignes(e, P, '22.8lignes'); compte('22.8');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
