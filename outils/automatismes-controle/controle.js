/* Contrôle des banques d'automatismes (création : 16/10/2026).
   Pour chaque famille demandée et chaque niveau, tire N questions avec le moteur réel et vérifie :
   - la structure (4 options distinctes, une bonne réponse valide, aucune erreur du générateur) ;
   - la rédaction (motifs A à G de REGLES-FICHES.md §7 : {,} dans le texte, virgule nue en zone math, signes doublés,
     coefficient 1 devant \sqrt ou \dfrac, NaN/undefined, dénominateur nul, %/€ sans espace, accolades ou
     parenthèses déséquilibrées) ;
   - la justesse, par un calcul indépendant : pour les familles qui ont un vérificateur dans VERIFS (ci-dessous),
     la bonne réponse est réévaluée à partir de l'énoncé affiché et les trois autres options doivent être fausses.
   Utilisation : ouvrir controle.html puis, dans la console, Controle.lancer() ; lire CONTROLE_FIN et Controle.resume(). */
(function () {
  'use strict';
  const A = window.Automatismes;

  // ---------- évaluateur LaTeX -> nombre (sans dépendance) ----------
  function accolade(s, i) {
    let d = 0;
    for (let j = i; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}') { d--; if (d === 0) return j; } }
    throw new Error('accolade non fermée dans : ' + s);
  }
  function conv(s) {
    s = s.replace(/\\left|\\right/g, '').replace(/\\[,; ]/g, '').replace(/\\times|\\cdot/g, '*').replace(/\\div/g, '/')
      .replace(/\{,\}/g, '.').replace(/\\text\{[^}]*\}/g, '').replace(/\\mathbb\{R\}/g, 'R').replace(/\\geqslant/g, '>=').replace(/\\leqslant/g, '<=');
    let out = '';
    for (let i = 0; i < s.length; i++) {
      if (s.startsWith('\\dfrac', i) || s.startsWith('\\frac', i)) {
        const k = s[i + 1] === 'd' ? 6 : 5;
        const a2 = accolade(s, i + k), b2 = accolade(s, a2 + 1);
        out += '((' + conv(s.slice(i + k + 1, a2)) + ')/(' + conv(s.slice(a2 + 2, b2)) + '))';
        i = b2; continue;
      }
      if (s.startsWith('\\sqrt', i)) {
        const a2 = accolade(s, i + 5);
        out += 'SQRT(' + conv(s.slice(i + 6, a2)) + ')';
        i = a2; continue;
      }
      if (s[i] === '^' && s[i + 1] === '{') { const a2 = accolade(s, i + 1); out += '^(' + conv(s.slice(i + 2, a2)) + ')'; i = a2; continue; }
      if (s[i] === '{') { const a2 = accolade(s, i); out += '(' + conv(s.slice(i + 1, a2)) + ')'; i = a2; continue; }
      out += s[i];
    }
    return out;
  }
  function jetons(js) {
    const t = []; let i = 0;
    while (i < js.length) {
      const c = js[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9.]/.test(c)) { let j = i; while (j < js.length && /[0-9.]/.test(js[j])) j++; t.push({ n: parseFloat(js.slice(i, j)) }); i = j; continue; }
      if (js.startsWith('SQRT', i)) { t.push({ f: 'SQRT' }); i += 4; continue; }
      if (/[a-zA-Z]/.test(c)) { t.push({ v: c }); i++; continue; }
      t.push({ o: c }); i++;
    }
    return t;
  }
  function evalJs(js, scope) {
    const t = jetons(js); let p = 0;
    const debutPrimaire = x => x && (x.n !== undefined || x.v !== undefined || x.f || x.o === '(');
    function somme() { let v = produit(); while (t[p] && (t[p].o === '+' || t[p].o === '-')) { const o = t[p++].o; const w = produit(); v = o === '+' ? v + w : v - w; } return v; }
    function produit() {
      let v = unaire();
      for (;;) {
        const x = t[p];
        if (x && (x.o === '*' || x.o === '/')) { p++; const w = unaire(); v = x.o === '*' ? v * w : v / w; }
        else if (debutPrimaire(x)) { v = v * puissance(); }          // multiplication implicite
        else break;
      }
      return v;
    }
    function unaire() { if (t[p] && t[p].o === '-') { p++; return -unaire(); } if (t[p] && t[p].o === '+') { p++; return unaire(); } return puissance(); }
    function puissance() { const b = primaire(); if (t[p] && t[p].o === '^') { p++; const e = unaire(); return Math.pow(b, e); } return b; }
    function primaire() {
      const x = t[p++];
      if (!x) throw new Error('expression incomplète : ' + js);
      if (x.n !== undefined) return x.n;
      if (x.f === 'SQRT') { p++; const v = somme(); p++; return Math.sqrt(v); }   // SQRT ( ... )
      if (x.v !== undefined) { if (!(x.v in scope)) throw new Error('variable inconnue ' + x.v + ' dans ' + js); return scope[x.v]; }
      if (x.o === '(') { const v = somme(); p++; return v; }
      throw new Error('jeton inattendu ' + JSON.stringify(x) + ' dans ' + js);
    }
    const v = somme();
    if (p < t.length) throw new Error('reste ' + JSON.stringify(t[p]) + ' dans ' + js);
    return v;
  }
  const evalTex = (tex, scope) => evalJs(conv(tex), scope || {});
  const proche = (a, b) => a === b || Math.abs(a - b) <= 1e-9 * Math.max(Math.abs(a), Math.abs(b));   // tolérance relative

  // ---------- zones math / texte ----------
  const enTexte = html => String(html).replace(/<br\s*\/?>/g, ' ').replace(/<[^>]*>/g, ' ');
  function zones(html) {
    const maths = [];
    const texte = enTexte(html).replace(/\\\(([\s\S]*?)\\\)/g, (mm, g) => { maths.push(g); return ' '; });
    return { maths, texte };
  }
  const nbOuvrantes = (s, o, f) => (s.split(o).length - 1) - (s.split(f).length - 1);

  function auditRedaction(q) {
    const alertes = [];
    const champs = [['énoncé', q.enonce], ['explication', q.explication || '']].concat(q.options.map((o, i) => ['option ' + 'abcd'[i], o]));
    champs.forEach(([nom, html]) => {
      const { maths, texte } = zones(html);
      if (/\{,\}/.test(texte)) alertes.push(nom + ' : {,} en zone de texte');
      maths.forEach(g => {
        if (/\d,\d/.test(g)) alertes.push(nom + ' : virgule nue en zone math (' + g.slice(0, 40) + ')');
        if (/\+\s*-|-\s*-|-\s*\+|\+\s*\+/.test(g.replace(/\\[a-z]+/g, '').replace(/\^\{-/g, '^{'))) {
          if (/\+\s*-|-\s*-|-\s*\+|\+\s*\+/.test(g.replace(/\\[a-z]+/g, '').replace(/\^\{-[^}]*\}/g, '').replace(/\(-[^)]*\)/g, '').replace(/\{[^{}]*\}/g, ''))) alertes.push(nom + ' : signes doublés (' + g.slice(0, 50) + ')');
        }
        if (/(^|[^0-9.,{\\a-z])1\\(sqrt|dfrac|frac)/.test(g)) alertes.push(nom + ' : coefficient 1 devant \\sqrt ou fraction (' + g.slice(0, 40) + ')');
        if (/\\dfrac\{[^{}]*\}\{1\}/.test(g)) alertes.push(nom + ' : fraction de dénominateur 1 (' + g.slice(0, 40) + ')');
        if (/\\dfrac\{[^{}]*\}\{0\}/.test(g)) alertes.push(nom + ' : dénominateur nul (' + g.slice(0, 40) + ')');
        if (/\^\{1\}/.test(g)) alertes.push(nom + ' : exposant 1 (' + g.slice(0, 40) + ')');
        if (nbOuvrantes(g, '{', '}') !== 0 || nbOuvrantes(g, '(', ')') !== 0 || nbOuvrantes(g, '\\left(', '\\right)') !== 0) alertes.push(nom + ' : accolades ou parenthèses déséquilibrées (' + g.slice(0, 50) + ')');
        if (/NaN|undefined|Infinity|null/.test(g)) alertes.push(nom + ' : valeur invalide dans ' + g.slice(0, 40));
      });
      if (/NaN|undefined|Infinity|null/.test(texte)) alertes.push(nom + ' : NaN/undefined/Infinity dans le texte');
      if (/\d%|\d [%€]/.test(texte)) alertes.push(nom + ' : % ou € sans espace fine insécable');
    });
    return alertes;
  }

  function auditStructure(q) {
    const alertes = [];
    if (!q.options || q.options.length !== 4) alertes.push('pas 4 options');
    else {
      if (new Set(q.options).size !== 4) alertes.push('options identiques à l\'affichage');
      if (!(q.bonne >= 0 && q.bonne <= 3)) alertes.push('index de bonne réponse invalide');
    }
    if (!q.enonce) alertes.push('énoncé vide');
    if (!q.explication) alertes.push('explication vide');
    return alertes;
  }

  // ---------- vérificateurs de justesse (calcul indépendant) ----------
  const mathsDe = html => zones(html).maths;
  const optMaths = q => q.options.map(o => mathsDe(o).join(' '));
  function aValeurs(textHtml) {            // « x = 3, y = -2 et t = -4 » -> {x:3, y:-2, t:-4}
    const sc = {}; const re = /([a-z])\s*=\s*(-?\d+(?:\.\d+)?)/g; let r;
    while ((r = re.exec(textHtml))) sc[r[1]] = parseFloat(r[2]);
    return sc;
  }

  const VERIFS = {};
  // Une expression E donnée dans l'énoncé, une valeur parmi les options : la bonne option est égale, les autres non.
  function verifExpression(q, valeurAttendue) {
    const opts = optMaths(q).map(s => s.replace(/^E\s*=\s*/, ''));
    const vals = opts.map(s => evalTex(s));
    const erreurs = [];
    if (!proche(vals[q.bonne], valeurAttendue)) erreurs.push('bonne réponse ' + vals[q.bonne] + ' ≠ calcul indépendant ' + valeurAttendue);
    vals.forEach((v, i) => { if (i !== q.bonne && proche(v, valeurAttendue)) erreurs.push('option ' + 'abcd'[i] + ' est aussi correcte'); });
    return erreurs;
  }
  VERIFS['calcul-numerique/valeur-expression'] = q => {
    const m = zones(q.enonce).maths;               // [ 'E = formule', 'x = 3, y = -2\\text{ et }t = -4' ]
    const formule = m[0].replace(/^E\s*=\s*/, '');
    const sc = aValeurs(m[1].replace(/\\text\{[^}]*\}/g, ','));
    return verifExpression(q, evalTex(formule, sc));
  };
  VERIFS['calcul-numerique/comparaison'] = q => {
    const erreurs = [];
    const ev = s => { const r = s.match(/^(.*?)\s*([<>])\s*(.*)$/); if (!r) throw new Error('pas une comparaison : ' + s); const a = evalTex(r[1]), b = evalTex(r[3]); return r[2] === '<' ? a < b : a > b; };
    optMaths(q).forEach((s, i) => { const v = ev(s); if (i === q.bonne && !v) erreurs.push('la bonne réponse est fausse : ' + s); if (i !== q.bonne && v) erreurs.push('l\'option ' + 'abcd'[i] + ' est vraie : ' + s); });
    return erreurs;
  };
  VERIFS['calcul-numerique/egalite-puissances'] = q => {
    const e = zones(q.enonce);
    if (/^La seule égalité/.test(e.texte.trim())) {
      const erreurs = [];
      optMaths(q).forEach((s, i) => {
        const [g, d] = s.split('=');
        const v = proche(evalTex(g), evalTex(d));
        if (i === q.bonne && !v) erreurs.push('égalité fausse donnée comme bonne : ' + s);
        if (i !== q.bonne && v) erreurs.push('l\'option ' + 'abcd'[i] + ' est une égalité vraie : ' + s);
      });
      return erreurs;
    }
    // moitié, double, quart, triple, tiers, dixième d'une puissance
    const t = e.texte.trim(), base = evalTex(e.maths[0].split('^')[0]), n = parseInt(e.maths[0].match(/\^\{(\d+)\}/)[1], 10);
    const f = /moitié/.test(t) ? 0.5 : /double/.test(t) ? 2 : /quart/.test(t) ? 0.25 : /triple/.test(t) ? 3 : /tiers/.test(t) ? 1 / 3 : /dixième/.test(t) ? 0.1 : NaN;
    return verifExpression(q, f * Math.pow(base, n));
  };
  VERIFS['calcul-numerique/racines-operations'] = q => {
    const e = zones(q.enonce);
    const expr = e.maths[0];
    // « Une forme développée de ... » : on compare numériquement l'expression et chaque option
    return verifExpression(q, evalTex(expr));
  };

  // ---------- exécution ----------
  const RESUME = {};
  function lancer(opts) {
    opts = opts || {};
    const essais = opts.essais || 300;
    window.CONTROLE_FIN = false;
    const banques = opts.banques || Object.keys(A.banques);
    const sortie = [];
    banques.forEach(b => {
      const familles = (opts.familles && opts.familles[b]) || Object.keys(A.banques[b].familles);
      familles.forEach(f => {
        [1, 2, 3].filter(n => A.famillesDispo(b, n).includes(f)).forEach(niv => {
          const cle = b + '/' + f + ' N' + niv;
          const r = { cle, essais, erreursGenerateur: 0, structure: {}, redaction: {}, justesse: {}, distincts: new Set(), exemple: null };
          for (let i = 0; i < essais; i++) {
            let q;
            try { q = A.genererQuestion(b, f, niv); } catch (e) { r.erreursGenerateur++; continue; }
            r.distincts.add(q.enonce + '|' + q.options.slice().sort().join('|'));   // énoncé et jeu d'options
            if (!r.exemple) r.exemple = { enonce: zones(q.enonce).texte.trim().slice(0, 80) + ' | ' + zones(q.enonce).maths.join(' ; ').slice(0, 90), bonne: optMaths(q)[q.bonne] };
            auditStructure(q).forEach(a => { r.structure[a] = (r.structure[a] || 0) + 1; });
            auditRedaction(q).forEach(a => { r.redaction[a] = (r.redaction[a] || 0) + 1; });
            const v = VERIFS[b + '/' + f];
            if (v) {
              try { v(q).forEach(a => { r.justesse[a] = (r.justesse[a] || 0) + 1; }); }
              catch (e) { r.justesse['ERREUR DU VÉRIFICATEUR : ' + e.message] = (r.justesse['ERREUR DU VÉRIFICATEUR : ' + e.message] || 0) + 1; }
            }
          }
          r.nbDistincts = r.distincts.size; delete r.distincts;
          r.verifie = !!VERIFS[b + '/' + f];
          sortie.push(r);
        });
      });
    });
    RESUME.sortie = sortie;
    const lignes = sortie.map(r => {
      const pb = r.erreursGenerateur + Object.keys(r.structure).length + Object.keys(r.redaction).length + Object.keys(r.justesse).length;
      return (pb ? 'ANOMALIE ' : 'OK       ') + r.cle + ' : ' + r.essais + ' tirages, ' + r.nbDistincts + ' énoncés distincts' + (r.verifie ? ', justesse contrôlée' : '') +
        (pb ? ' — ' + JSON.stringify({ gen: r.erreursGenerateur || undefined, structure: r.structure, redaction: r.redaction, justesse: r.justesse }) : '');
    });
    const zone = document.getElementById('sortie');
    if (zone) zone.textContent = lignes.join('\n');
    window.CONTROLE_FIN = true;
    return lignes;
  }
  // aperçu visuel : n questions d'une famille, rendues par MathJax, bonne réponse en vert
  function apercu(banque, famille, niveau, n) {
    const zone = document.getElementById('apercu');
    zone.innerHTML = '';
    for (let i = 0; i < (n || 4); i++) {
      const q = A.genererQuestion(banque, famille, niveau);
      const d = document.createElement('div');
      d.style.cssText = 'border:1px solid #ccc;border-radius:6px;padding:10px;margin:8px 0;max-width:760px';
      d.innerHTML = '<div>' + q.enonce + '</div>' + (q.figure ? '<div>' + q.figure + '</div>' : '') +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:8px 0">' +
        q.options.map((o, k) => '<span style="border:1px solid ' + (k === q.bonne ? '#1a7f37' : '#bbb') + ';background:' + (k === q.bonne ? '#e6f4ea' : '#fff') + ';padding:4px 10px;border-radius:14px">' + 'abcd'[k] + ' · ' + o + '</span>').join('') +
        '</div><div style="font-size:12px;color:#555">' + (q.explication || '') + '</div>';
      zone.appendChild(d);
    }
    if (window.MathJax && MathJax.typesetPromise) return MathJax.typesetPromise([zone]);
  }
  window.Controle = { lancer, apercu, resume: () => RESUME.sortie, evalTex, zones, auditRedaction, VERIFS };
})();
