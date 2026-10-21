// Verification independante des details de Seconde 12 : tout est recalcule a partir de l'enonce affiche (jamais a partir des specifications du generateur)
const fs = require('fs'), path = require('path'), http = require('http');
const RACINE = 'C:/Users/David/Documents/siteCahierCalcul';
const { chromium } = require(RACINE + '/outils/audit-reponses/node_modules/playwright-core');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const N = Number(process.argv[2] || 300);
const FICHE = process.argv[3] || 'cahiers/seconde/cahier-4/fiche-12.html';
(async () => {
  const s = http.createServer((req, res) => { const f = path.join(RACINE, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0, '127.0.0.1');
  await new Promise((r) => s.on('listening', r));
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${s.address().port}/${FICHE}`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof exercices !== 'undefined' && window.math && document.querySelector('.question'), null, { timeout: 40000 });
  const r = await p.evaluate((N) => {
    const val = (tex) => { let t = String(tex).replace(/\\\(|\\\)/g, '').replace(/\{,\}/g, '.').replace(/,/g, '.').replace(/\\left|\\right/g, '').replace(/\\times/g, '*').replace(/\\text\{[^{}]*\}/g, '').replace(/\\,/g, '');
      for (let i = 0; i < 6; i++) t = t.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
      t = t.replace(/\+\\infty/g, 'Infinity').replace(/\\infty/g, 'Infinity');
      return math.evaluate(t.replace(/[{}]/g, '')); };
    const defauts = [], stats = {}; const compte = (k) => { stats[k] = (stats[k] || 0) + 1; };
    const faux = (e, m) => { if (defauts.length < 14) defauts.push(e.id + ' : ' + m + ' | ' + String(e.enonce).replace(/\s+/g, ' ').slice(0, 110)); };
    const egal = (x, y) => x === y || (isFinite(x) && isFinite(y) && Math.abs(x - y) < 1e-9);
    // ---- ensembles de reels : liste d'intervalles {bas, haut, ib, ih}
    const inter2 = (A, B) => { const bas = Math.max(A.bas, B.bas), haut = Math.min(A.haut, B.haut);
      const ib = A.bas === B.bas ? A.ib && B.ib : (A.bas > B.bas ? A.ib : B.ib), ih = A.haut === B.haut ? A.ih && B.ih : (A.haut < B.haut ? A.ih : B.ih);
      if (bas > haut || (bas === haut && !(ib && ih))) return null; return { bas, haut, ib, ih }; };
    const normaliser = (L) => { const T = L.slice().sort((x, y) => x.bas - y.bas || (y.ib - x.ib)); const R = [];
      for (const iv of T) { const d = R[R.length - 1];
        if (d && (iv.bas < d.haut || (iv.bas === d.haut && (iv.ib || d.ih)))) { if (iv.haut > d.haut || (iv.haut === d.haut && iv.ih)) { d.haut = iv.haut; d.ih = iv.ih; } } else R.push({ ...iv }); }
      return R; };
    const interSets = (A, B) => { const R = []; for (const x of A) for (const y of B) { const z = inter2(x, y); if (z) R.push(z); } return normaliser(R); };
    const memeEnsemble = (A, B) => { A = normaliser(A); B = normaliser(B); return A.length === B.length && A.every((x, i) => egal(x.bas, B[i].bas) && egal(x.haut, B[i].haut) && (x.ib === B[i].ib || !isFinite(x.bas)) && (x.ih === B[i].ih || !isFinite(x.haut))); };
    const parseIntervalles = (txt) => { const R = []; const re = /([\[\]])((?:[^\[\]])*?)\\,;\\,((?:[^\[\]])*?)([\[\]])/g; let m;
      while ((m = re.exec(txt))) R.push({ bas: val(m[2]), haut: val(m[3]), ib: m[1] === '[', ih: m[4] === ']' }); return R; };
    // « -5 \lt x \leqslant 2 », « x \gt 3 », « x \leqslant \sqrt{3} »
    const parseCond = (c) => { const t = c.replace(/^\\small\s*/, '').trim().split(/\s*(\\leqslant|\\geqslant|\\lt|\\gt)\s*/);
      if (t.length === 3 && t[0] === 'x') { const v = val(t[2]), o = t[1]; return o === '\\gt' ? { bas: v, haut: Infinity, ib: false, ih: false } : o === '\\geqslant' ? { bas: v, haut: Infinity, ib: true, ih: false } : o === '\\lt' ? { bas: -Infinity, haut: v, ib: false, ih: false } : { bas: -Infinity, haut: v, ib: false, ih: true }; }
      if (t.length === 5 && t[2] === 'x') return { bas: val(t[0]), haut: val(t[4]), ib: t[1] === '\\leqslant', ih: t[3] === '\\leqslant' };
      throw new Error('condition illisible : ' + c); };
    const parseUnionCond = (c) => c.replace(/^\\small\s*/, '').split(/\s*\\text\{ ou \}\s*/).map(parseCond);
    const parseEtCond = (c) => c.replace(/^\\small\s*/, '').split(/\s*\\text\{ et \}\s*/).map(parseCond);
    const finalEnsemble = (F) => F === '\\emptyset' ? [] : F === '\\mathbb{R}' ? [{ bas: -Infinity, haut: Infinity, ib: false, ih: false }] : parseIntervalles(F);
    const premier = (n) => { for (let k = 2; k * k <= n; k++) if (n % k === 0) return false; return n > 1; };
    for (let t = 0; t < N; t++) {
      const ex = genererExercices();
      for (const e of ex) {
        const D = e.detail; if (!D) { faux(e, 'sans detail'); continue; }
        const id = e.id, F = D.final, L = D.lignes, en = String(e.enonce).replace(/\\\[|\\\]/g, (m) => m);
        try {
          if (/^12\.1 /.test(id)) { const v = val(e.enonce); if (Math.abs(v - val(F)) > 1e-9 || Math.abs(v - Number(e.reponse)) > 1e-9) faux(e, 'valeur ' + v + ' vs ' + F); compte('12.1'); }
          else if (/^12\.2 a/.test(id)) {
            const m = e.enonce.match(/\\\((-?\d+)\\?(leqslant|lt) x \\?(leqslant|lt) (-?\d+)\\\)/) || e.enonce.match(/\\\((-?\d+)\s*\\(leqslant|lt) x \\(leqslant|lt) (-?\d+)\\\)/);
            if (!m) throw new Error('enonce 12.2 a');
            const iv = { bas: Number(m[1]), haut: Number(m[4]), ib: m[2] === 'leqslant', ih: m[3] === 'leqslant' };
            if (!memeEnsemble(finalEnsemble(F), [iv])) faux(e, 'final ' + F); if (!memeEnsemble(parseIntervalles(L[1]), [iv])) faux(e, 'ligne 2 ' + L[1]);
            const c = parseCond(L[0]); if (!memeEnsemble([c], [iv])) faux(e, 'ligne 1'); compte('12.2a');
          }
          else if (/^12\.2 b/.test(id)) {
            const m = e.enonce.match(/x \\(gt|lt|geqslant|leqslant) (.+)\\\)$/); const v = val(m[2]), o = m[1];
            const iv = o === 'gt' ? { bas: v, haut: Infinity, ib: false, ih: false } : o === 'geqslant' ? { bas: v, haut: Infinity, ib: true, ih: false } : o === 'lt' ? { bas: -Infinity, haut: v, ib: false, ih: false } : { bas: -Infinity, haut: v, ib: false, ih: true };
            if (!memeEnsemble(finalEnsemble(F), [iv])) faux(e, 'final ' + F); if (!memeEnsemble([parseCond(L[0])], [iv])) faux(e, 'ligne 1'); compte('12.2b');
          }
          else if (/^12\.2 c/.test(id)) {
            const iv = parseIntervalles(e.enonce)[0]; const c = parseCond(F);
            if (!memeEnsemble([c], [iv]) || !(e.bas === iv.bas) || e.inclusBas !== iv.ib || e.inclusHaut !== iv.ih) faux(e, 'encadrement ' + F); compte('12.2c');
          }
          else if (/^12\.2 d/.test(id)) {
            const iv = parseIntervalles(e.enonce)[0]; const c = parseCond(F);
            if (!memeEnsemble([c], [iv])) faux(e, 'inegalite ' + F);
            const op = c.bas === -Infinity ? (c.ih ? '<=' : '<') : (c.ib ? '>=' : '>'); const seuil = c.bas === -Infinity ? c.haut : c.bas; if (op !== e.sens || seuil !== e.seuil) faux(e, 'sens/seuil'); compte('12.2d');
          }
          else if (/^12\.3 [ab]/.test(id)) {
            const m = e.enonce.match(/\\\((.+?)\\in (.+)\\\)$/); const x = val(m[1]), iv = parseIntervalles(m[2])[0];
            const dedans = (x > iv.bas || (x === iv.bas && iv.ib)) && (x < iv.haut || (x === iv.haut && iv.ih));
            if (dedans !== e.reponseOuiNon || F !== (dedans ? 'oui' : 'non')) faux(e, 'appartenance');
            if (!L[2].includes(dedans ? '\\in' : '\\notin') || (dedans && L[2].includes('\\notin'))) faux(e, 'symbole ' + L[2]);
            compte('12.3' + id[5] + (dedans ? 'o' : 'n'));
          }
          else if (/^12\.3 [cd]/.test(id)) {
            const rang = { N: 0, Z: 1, D: 2, Q: 3, R: 4 }; const m = e.enonce.match(/mathbb\{(.)\}\\subset\\mathbb\{(.)\}/); const vrai = rang[m[1]] <= rang[m[2]];
            if (vrai !== e.reponseOuiNon || F !== (vrai ? 'oui' : 'non')) faux(e, 'inclusion'); if (vrai === L.some((l) => /mais/.test(l))) faux(e, 'contre-exemple'); compte('12.3cd' + (vrai ? 'o' : 'n'));
          }
          else if (/^12\.[456] /.test(id) && !/^12\.4 d/.test(id) || /^12\.4 d/.test(id)) {
            // enonce : ensembles nommes I, J (, K), operation \cap ou \cup (12.6) ; 12.4 = \cap ; 12.5 = \cup
            const ivs = parseIntervalles(e.enonce.replace(/\\:/g, ''));
            const op = /^12\.4/.test(id) ? 'cap' : /^12\.5/.test(id) ? 'cup' : (/\\cap/.test(e.enonce) ? 'cap' : 'cup');
            let attendu = op === 'cap' ? ivs.reduce((a, iv) => interSets(a, [iv]), [{ bas: -Infinity, haut: Infinity, ib: false, ih: false }]) : normaliser(ivs);
            if (!memeEnsemble(finalEnsemble(F), attendu)) faux(e, 'final ' + F + ' attendu ' + JSON.stringify(attendu));
            if (e.intervalleSpec.type === 'vide' ? attendu.length !== 0 : (e.intervalleSpec.type === 'tout' ? !(attendu.length === 1 && attendu[0].bas === -Infinity && attendu[0].haut === Infinity) : !memeEnsemble(e.intervalleSpec.liste.map((v) => ({ bas: v.bas, haut: v.haut, ib: v.inclusBas, ih: v.inclusHaut })), attendu))) faux(e, 'reponse attendue de la fiche');
            // traductions de chaque intervalle
            const trad = L.filter((l) => /^x \\in [IJK] \\iff/.test(l));
            if (trad.length !== ivs.length) faux(e, 'nombre de traductions');
            trad.forEach((l, i) => { if (!memeEnsemble([parseCond(l.split('\\iff')[1])], [ivs[i]])) faux(e, 'traduction ' + l); });
            // ligne de conjonction ou de reunion : meme ensemble que l'operation sur les traductions
            const conj = L.find((l) => (op === 'cap' ? / \\text\{ et \}/ : / \\text\{ ou \}/).test(l) && !/\\iff|\\in|\\notin/.test(l));
            if (!conj) faux(e, 'ligne de conjonction absente');
            else { const cs = (op === 'cap' ? parseEtCond : parseUnionCond)(conj); if (!memeEnsemble(op === 'cap' ? cs.reduce((a, iv) => interSets(a, [iv]), [{ bas: -Infinity, haut: Infinity, ib: false, ih: false }]) : cs, attendu)) faux(e, 'conjonction ' + conj); if (!memeEnsemble(cs, ivs)) faux(e, 'conjonction diff des traductions'); }
            // ligne de fusion (optionnelle) : memes elements que le resultat
            const fus = L.filter((l) => /^(\\small )?\\iff /.test(l) && !/\\in /.test(l));
            if (op === 'cap' && attendu.length) { if (fus.length !== 1 || !memeEnsemble(parseUnionCond(fus[0].replace(/^(\\small )?\\iff /, '')), attendu)) faux(e, 'fusion absente/incorrecte ' + fus); }
            if (op === 'cap' && !attendu.length) { if (!L.includes('\\text{Aucun réel ne convient}') || fus.length) faux(e, 'phrase du vide'); }
            if (op === 'cup' && fus.length === 1 && !memeEnsemble(parseUnionCond(fus[0].replace(/^(\\small )?\\iff /, '')), attendu)) faux(e, 'fusion ' + fus[0]);
            if (op === 'cap' && attendu.length && L.includes('\\text{Aucun réel ne convient}')) faux(e, 'phrase du vide a tort');
            // reunion : une fusion est requise quand l'ensemble obtenu n'est pas la liste des intervalles donnes
            if (op === 'cup' && attendu.length !== ivs.length || (op === 'cup' && !memeEnsemble(attendu, ivs))) { if (!(fus.length === 1 || L.some((l) => /\\iff x \\in \\mathbb\{R\}/.test(l)))) faux(e, 'fusion manquante'); }
            else if (op === 'cup' && fus.length) faux(e, 'fusion inutile');
            // point exclu des deux intervalles
            if (op === 'cup') { const exclu = ivs.some((a, i) => ivs.some((c, j) => i !== j && a.haut === c.bas && !a.ih && !c.ib && isFinite(a.haut))); if (exclu !== L.some((l) => /\\notin/.test(l))) faux(e, 'point exclu'); }
            if (/^12\.4 d/.test(id)) { const cmp = L.find((l) => /\^\{2\} = .* \\(gt|lt) .* = \\sqrt/.test(l)); const dm = e.enonce.match(/(\d)\{,\}(\d)/); const d = Number(dm[1] + '.' + dm[2]); const k = Number(e.enonce.match(/\\sqrt\{(\d+)\}/)[1]);
              if (!cmp) faux(e, 'comparaison absente'); else { const g = cmp.match(/= ([\d{},]+) \\(gt|lt) (\d+) = /); if (Math.abs(val(g[1]) - d * d) > 1e-9 || Number(g[3]) !== k || (g[2] === 'lt') !== (d * d < k)) faux(e, 'comparaison ' + cmp);
                const concl = L[L.indexOf(cmp) + 3]; if ((concl.includes('\\lt')) !== (d < Math.sqrt(k))) faux(e, 'conclusion ' + concl); } }
            compte(id.slice(0, 4) + (attendu.length ? 'n' : 'v'));
          }
          else if (/^12\.7 |^12\.8 a/.test(id)) {
            const lignes = e.enonce.match(/cases\}\s*(.*?)\s*\\end\{cases/)[1].split('\\\\').map((x) => x.trim());
            let attendu = [{ bas: -Infinity, haut: Infinity, ib: false, ih: false }]; const conds = [];
            for (const ln of lignes) { const m = ln.match(/^(-?\d*)x\+(\d+)\\(gt|lt)(-?\d+)$/); let a = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]); const b = Number(m[2]), c = Number(m[4]);
              const x0 = (c - b) / a; const sup = (m[3] === 'lt') === (a > 0); conds.push({ x0, sup });
              attendu = interSets(attendu, [sup ? { bas: -Infinity, haut: x0, ib: false, ih: false } : { bas: x0, haut: Infinity, ib: false, ih: false }]); }
            if (!memeEnsemble(finalEnsemble(F), attendu)) faux(e, 'systeme final ' + F);
            // chaque inequation resolue : derniere ligne « \iff x op x0 »
            const iConj = L.findIndex((l) => / \\text\{ et \}/.test(l)); const solved = L.slice(0, iConj).filter((l) => /^\\iff x \\(gt|lt) -?\d+$/.test(l));
            if (solved.length !== lignes.length) faux(e, 'nombre de resolutions');
            solved.forEach((l, i) => { const m = l.match(/x \\(gt|lt) (-?\d+)/); if (Number(m[2]) !== conds[i].x0 || (m[1] === 'lt') !== conds[i].sup) faux(e, 'resolution ' + l + ' pour ' + lignes[i]); });
            const conj = L.find((l) => / \\text\{ et \}/.test(l)); const cs = parseEtCond(conj);
            if (cs.length !== lignes.length || !memeEnsemble(cs.reduce((a, iv) => interSets(a, [iv]), [{ bas: -Infinity, haut: Infinity, ib: false, ih: false }]), attendu)) faux(e, 'conjonction ' + conj);
            const vide = attendu.length === 0; if (vide !== L.includes('\\text{Aucun réel ne convient}')) faux(e, 'phrase du vide'); if (!vide && !memeEnsemble([parseCond(L[L.length - 2].replace(/^\\iff /, ''))], attendu)) faux(e, 'fusion');
            // phrases de division par un negatif
            lignes.forEach((ln, i) => { const a = ln.match(/^(-?\d*)x/)[1]; const neg = a.startsWith('-'); });
            compte(id.slice(0, 4) + (vide ? 'v' : 'n'));
          }
          else if (/^12\.8 b/.test(id)) {
            const iv = parseIntervalles(e.enonce.replace(/;/g, '\\,;\\,'))[0]; let n = 0; for (let k = Math.ceil(iv.bas); k <= Math.floor(iv.haut); k++) if ((k > iv.bas || iv.ib) && (k < iv.haut || iv.ih)) n++;
            if (String(n) !== F || String(n) !== e.reponse) faux(e, 'compte ' + n + ' vs ' + F); compte('12.8b');
          }
          else if (/^12\.8 c/.test(id)) {
            const iv = parseIntervalles(e.enonce.replace(/;/g, '\\,;\\,'))[0]; const att = [{ bas: -Infinity, haut: iv.bas, ib: false, ih: !iv.ib }, { bas: iv.haut, haut: Infinity, ib: !iv.ih, ih: false }];
            if (!memeEnsemble(finalEnsemble(F), att)) faux(e, 'complementaire ' + F); compte('12.8c');
          }
          else if (/^12\.8 d/.test(id)) {
            const seuil = Number(e.enonce.match(/lt (\d+)\\\}/)[1]); const els = []; for (let k = 0; k * k < seuil; k++) els.push(k);
            if (F !== '\\{' + els.join('\\,;\\,') + '\\}') faux(e, 'extension ' + F); compte('12.8d');
          }
          else faux(e, 'exercice non verifie');
        } catch (er) { faux(e, 'EXCEPTION ' + er.message); }
      }
    }
    return { defauts, stats };
  }, N);
  console.log(JSON.stringify(r.stats)); console.log(r.defauts.length ? 'DEFAUTS :\n' + r.defauts.join('\n') : 'aucun defaut'); await b.close(); s.close(); process.exit(0);
})();
