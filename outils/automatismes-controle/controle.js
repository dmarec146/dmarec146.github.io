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
      .replace(/\{,\}/g, '.').replace(/\\ell/g, 'l').replace(/\\text\{[^}]*\}/g, '').replace(/\\mathbb\{R\}/g, 'R').replace(/\\geqslant/g, '>=').replace(/\\leqslant/g, '<=');
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
  // une balise commence par « < » suivi d'une lettre ou de « / » : un « < » de comparaison n'en est pas une
  const enTexte = html => String(html).replace(/<br\s*\/?>/g, ' ').replace(/<\/?[a-zA-Z][^>]*>/g, ' ');
  function zones(html) {
    const maths = [];
    // les formules sont extraites avant le retrait des balises : une formule peut contenir « < »
    const texte = enTexte(String(html).replace(/\\\(([\s\S]*?)\\\)/g, (mm, g) => { maths.push(g); return ' '; }));
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
    const sc = {}; const re = /([a-zA-Z])\s*=\s*(-?\d+(?:\.\d+)?)/g; let r;
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

  // Équivalence d'expressions littérales : égalité numérique en plusieurs points (entiers non nuls, lettres x y t z u v a b)
  const LETTRES = ['x', 'y', 't', 'z', 'u', 'v', 'a', 'b'];
  function egalSurPoints(texA, texB) {
    for (let i = 0; i < 6; i++) {
      const sc = {}; LETTRES.forEach(l => { sc[l] = Math.floor(Math.random() * 10) - 3; if (sc[l] === 0) sc[l] = 7; });
      if (!proche(evalTex(texA, sc), evalTex(texB, sc))) return false;
    }
    return true;
  }
  // bonne option égale à la cible, les autres différentes (ou, si egalesAttendues, trois égales et une différente)
  function verifEquivalence(q, cible) {
    const erreurs = [], opts = optMaths(q).map(s => s.replace(/^E\s*=\s*/, ''));
    opts.forEach((s, i) => {
      const egal = egalSurPoints(s, cible);
      if (i === q.bonne && !egal) erreurs.push('la bonne réponse n’est pas égale à la cible : ' + s);
      if (i !== q.bonne && egal) erreurs.push('l’option ' + 'abcd'[i] + ' est aussi égale à la cible : ' + s);
    });
    return erreurs;
  }
  VERIFS['developper-factoriser/expression-egale'] = q => {         // la « bonne » réponse est la seule NON égale à la cible
    const cible = zones(q.enonce).maths[0], erreurs = [];
    optMaths(q).forEach((s, i) => {
      const egal = egalSurPoints(s, cible);
      if (i === q.bonne && egal) erreurs.push('la réponse attendue est égale à la cible : ' + s);
      if (i !== q.bonne && !egal) erreurs.push('l’option ' + 'abcd'[i] + ' n’est pas égale à la cible : ' + s);
    });
    return erreurs;
  };
  VERIFS['developper-factoriser/reduire-oppose'] = q => verifEquivalence(q, zones(q.enonce).maths.find(g => /^E\s*=/.test(g)).replace(/^E\s*=\s*/, ''));
  VERIFS['developper-factoriser/developper-simple'] = q => verifEquivalence(q, zones(q.enonce).maths[0]);
  VERIFS['developper-factoriser/factoriser-fraction'] = q => verifEquivalence(q, zones(q.enonce).maths[0]);

  // ---------- équations : relation et valeurs données, tableau de signes, isolement ----------
  // racines de g sur [min, 60] (pas 0,05, bissection), pôles écartés
  function racinesNumeriques(g, min) {
    const res = [];
    let xp = min, gp = g(xp);
    for (let x = min + 0.05; x <= 60 + 1e-9; x += 0.05) {
      const gx = g(x);
      if (isFinite(gp) && isFinite(gx) && gp * gx <= 0) {
        let a = xp, b = x, ga = gp;
        for (let i = 0; i < 50; i++) { const c = (a + b) / 2, gc = g(c); if (ga * gc <= 0) b = c; else { a = c; ga = gc; } }
        const r = (a + b) / 2;
        if (Math.abs(g(r)) < 1e-6 * (1 + Math.abs(r)) && !res.some(v => Math.abs(v - r) < 1e-4)) res.push(r);
      }
      xp = x; gp = gx;
    }
    return res.sort((p, q) => p - q);
  }
  const ensembleOption = s => (/impossible/.test(s) ? [] : s.split('\\text{ ou }').map(t => evalTex(t.trim())));
  const memeEnsemble = (A, B) => A.length === B.length && A.every((v, i) => Math.abs(v - B[i]) < 1e-6 * Math.max(1, Math.abs(v)));
  VERIFS['equations/formule-valeurs'] = q => {
    const M = zones(q.enonce).maths;                     // [relation, (condition), valeurs, grandeur cherchée]
    const rel = M[0], cible = M[M.length - 1].replace(/\\ell/g, 'l').trim(), vals = M[M.length - 2];
    const positif = M.length === 4;
    const sc = aValeurs(vals.replace(/\\text\{[^}]*\}/g, ','));
    const [L, R] = rel.replace(/\\ell/g, 'l').split('=');
    const g = x => { const s = Object.assign({}, sc); s[cible] = x; return evalTex(L, s) - evalTex(R, s); };
    const attendu = racinesNumeriques(g, positif ? 0.0001 : -60);
    const erreurs = [];
    optMaths(q).forEach((s, i) => {
      let ens; try { ens = ensembleOption(s.replace(/\\ell/g, 'l')).sort((p, r) => p - r); } catch (e) { erreurs.push('option illisible : ' + s); return; }
      const ok = memeEnsemble(ens, attendu);
      if (i === q.bonne && !ok) erreurs.push('la bonne réponse {' + ens + '} ≠ solutions {' + attendu + '}');
      if (i !== q.bonne && ok) erreurs.push('l’option ' + 'abcd'[i] + ' est aussi correcte : ' + s);
    });
    return erreurs;
  };
  VERIFS['equations/tableau-vers-expression'] = q => {
    const d = new DOMParser().parseFromString(q.figure, 'image/svg+xml');
    const t = [...d.querySelectorAll('text')].map(x => x.textContent.replace('−', '-'));
    const racines = t.slice(t.indexOf('-∞') + 1, t.indexOf('+∞')).map(Number);
    const signes = t.filter(x => x === '+' || x === '-');
    const v = (t.find(x => /^A\(.\)$/.test(x)) || 'A(x)')[2];
    const pts = [racines[0] - 1].concat(racines.slice(1).map((r, i) => (racines[i] + r) / 2), [racines[racines.length - 1] + 1]);
    const erreurs = [];
    optMaths(q).forEach((s, i) => {
      const f = x => evalTex(s, { [v]: x });
      let correct = racines.every(r => Math.abs(f(r)) < 1e-9) && pts.every((p, k) => Math.abs(f(p)) > 1e-9 && ((f(p) > 0 ? '+' : '-') === signes[k]));
      if (i === q.bonne && !correct) erreurs.push('la bonne réponse ne correspond pas au tableau : ' + s);
      if (i !== q.bonne && correct) erreurs.push('l’option ' + 'abcd'[i] + ' correspond aussi au tableau : ' + s);
    });
    if (signes.length !== racines.length + 1) erreurs.push('tableau illisible : ' + t.join(' '));
    return erreurs;
  };
  // isoler une variable : seulement les formules à lettres simples (sinon la vérification est sautée)
  VERIFS['equations/isoler-variable'] = q => {
    const M = zones(q.enonce).maths;
    const formule = M.find(g => g.includes('=')), cibleTex = M[M.length - 1];
    const options = optMaths(q);
    if ([formule, cibleTex].concat(options).some(g => /\\(mathcal|pi|ell|rho)|_/.test(g))) return [];
    const conv1 = s => s.replace(/([a-zA-Z])'/g, (mm, l) => l.toUpperCase());
    const [L, R] = conv1(formule).split('=');
    const cible = conv1(cibleTex).trim();
    const lettres = [...new Set((conv1(formule).replace(/\\[a-z]+/g, '').match(/[a-zA-Z]/g) || []))].filter(l => l !== cible);
    const erreurs = [];
    options.forEach((s, i) => {
      const expr = conv1(s).split('=')[1];
      let correct = true;
      for (let k = 0; k < 6 && correct; k++) {
        const sc = {}; lettres.forEach(l => { sc[l] = 1.5 + Math.random() * 4; });
        let xv; try { xv = evalTex(expr, sc); } catch (e) { correct = false; break; }
        sc[cible] = xv;
        const diff = evalTex(L, sc) - evalTex(R, sc);
        if (!isFinite(diff) || Math.abs(diff) > 1e-9 * Math.max(1, Math.abs(evalTex(L, sc)))) correct = false;
      }
      if (i === q.bonne && !correct) erreurs.push('formule : la bonne réponse ne vérifie pas la relation : ' + s);
      if (i !== q.bonne && correct) erreurs.push('formule : l’option ' + 'abcd'[i] + ' vérifie aussi la relation : ' + s);
    });
    return erreurs;
  };

  // ---------- pourcentages ----------
  const nbFr = s => parseFloat(s.replace(/−/g, '-').replace(/ /g, '').replace(',', '.'));
  const NB = '\\d[\\d ]*(?:,\\d+)?';
  VERIFS['pourcentages/formule-evolution'] = q => {
    const t = zones(q.enonce).texte.replace(/\s/g, ' ');       // \s couvre aussi les espaces insécables
    const taux = [...t.matchAll(new RegExp('(hausse|baisse) de (' + NB + ') %', 'g'))].map(r => (r[1] === 'hausse' ? 1 : -1) * nbFr(r[2]));
    let attendu;
    if (/chaque année pendant/.test(t)) {
      const P = nbFr(t.match(new RegExp('vaut (' + NB + ') au'))[1]), pc = nbFr(t.match(new RegExp('de (' + NB + ') % chaque'))[1]), n = parseInt(t.match(/pendant (\d+) ans/)[1], 10);
      attendu = P * Math.pow(1 + (/diminue/.test(t) ? -pc : pc) / 100, n);
    } else if (/avant cette évolution/.test(t)) {
      attendu = nbFr(t.match(new RegExp('est de (' + NB + ')'))[1]) / (1 + taux[0] / 100);
    } else if (/successivement/.test(t)) {
      attendu = nbFr(t.match(new RegExp(NB))[0]) * (1 + taux[0] / 100) * (1 + taux[1] / 100);
    } else {
      const pc = nbFr(t.match(new RegExp('de (' + NB + ') %'))[1]);
      attendu = nbFr(t.match(new RegExp(NB))[0]) * (1 + (/diminue/.test(t) ? -pc : pc) / 100);
    }
    return verifExpression(q, attendu);
  };

  // ---------- proportions ----------
  const premierNombre = s => nbFr(s.match(new RegExp(NB))[0]);
  const nombresDe = s => [...s.matchAll(new RegExp(NB, 'g'))].map(r => nbFr(r[0]));
  // vérifie que seule la bonne option porte la valeur attendue (le nombre de l'option est lu dans son texte)
  function verifValeurOption(q, attendu) {
    const erreurs = [];
    q.options.forEach((o, i) => {
      const v = premierNombre(zones(o).texte.replace(/\s/g, ' '));
      if (i === q.bonne && !proche(v, attendu)) erreurs.push('la bonne réponse ' + v + ' ≠ calcul indépendant ' + attendu);
      if (i !== q.bonne && proche(v, attendu)) erreurs.push('l’option ' + 'abcd'[i] + ' vaut aussi ' + attendu);
    });
    return erreurs;
  }
  const motCle = nom => nom.replace(/^(les |le |la |l’)/, '');
  const contient = (texte, nom) => new RegExp('(^|[^A-Za-zÀ-ÿ])' + motCle(nom).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^A-Za-zÀ-ÿ])').test(texte);
  VERIFS['proportions/partage-ratio'] = q => {
    const [avant, apres] = q.enonce.split('<br>');
    const t = zones(avant).texte.replace(/\s/g, ' '), question = zones(apres || '').texte.replace(/\s/g, ' ');
    const trois = t.match(new RegExp('rapport (\\d+) : (\\d+) : (\\d+)'));
    if (trois) {
      const r = trois.slice(1).map(Number), T = premierNombre(t);
      return verifValeurOption(q, T * (Math.max(...r) - Math.min(...r)) / r.reduce((x, y) => x + y, 0));
    }
    const d = t.match(/rapport (\d+) : (\d+) \(\d+ parts? pour ([^,]+), \d+ parts? pour ([^)]+)\)/);
    const [a, b] = [Number(d[1]), Number(d[2])], n1 = d[3], n2 = d[4];
    if (/vaut/.test(t)) {                                       // une part connue, l'autre cherchée
      const phrase = t.slice(t.indexOf(')') + 1), X = premierNombre(phrase.replace(/^\s*\./, ''));
      const connuEstPremier = contient(phrase.split('vaut')[0], n1);
      return verifValeurOption(q, connuEstPremier ? X * b / a : X * a / b);
    }
    const T = premierNombre(t), premier = contient(question, n1);
    return verifValeurOption(q, T * (premier ? a : b) / (a + b));
  };
  VERIFS['proportions/melange-pourcentage'] = q => {
    const t = zones(q.enonce.split('<br>')[0]).texte.replace(/\s/g, ' ');
    if (/On y ajoute/.test(t)) {
      const S = premierNombre(t), p = nbFr(t.match(new RegExp('(' + NB + ') % de sel'))[1]), w = nbFr(t.match(new RegExp('ajoute (' + NB + ') g'))[1]);
      return verifValeurOption(q, p * S / (S + w));
    }
    const [s, e] = nombresDe(t);
    return verifValeurOption(q, 100 * s / (s + e));
  };

  // ---------- probabilités et statistiques ----------
  VERIFS['probabilites/evenement-contraire'] = q => {
    const z = zones(q.enonce), t = z.texte.replace(/\s/g, ' '), M = z.maths;
    let attendu;
    if (M.some(g => /overline/.test(g))) {                                  // P(non A) = 1 − P(A)
      attendu = 1 - evalTex(M.find(g => /^P\(A\)/.test(g)).replace(/^P\(A\)\s*=/, ''));
    } else if (/urne/.test(t)) {                                            // tirages avec remise
      const r = parseInt(t.match(/(\d+) boules? rouges?/)[1], 10), v = parseInt(t.match(/(\d+) boules? vertes?/)[1], 10), n = parseInt(t.match(/successivement (\d+) boules/)[1], 10);
      attendu = 1 - Math.pow(v / (r + v), n);
    } else if (M.length >= 2) {                                             // deux événements indépendants
      attendu = 1 - (1 - evalTex(M[0])) * (1 - evalTex(M[1]));
    } else {                                                                // n épreuves identiques indépendantes
      const n = parseInt(t.split('.').slice(1).join('.').match(/(\d+)/)[1], 10);
      attendu = 1 - Math.pow(1 - evalTex(M[0]), n);
    }
    return verifExpression(q, attendu);
  };
  VERIFS['probabilites/moyenne-simple'] = q => {
    const z = zones(q.enonce.split('<br>')[0]), t = z.texte.replace(/\s/g, ' ');
    let attendu;
    if (/On ajoute une note/.test(t)) {
      const n = parseInt(t.match(/moyenne de (\d+) notes est (\d+)/)[1], 10), moy = parseInt(t.match(/moyenne de (\d+) notes est (\d+)/)[2], 10), x = parseInt(t.match(/note de (\d+)/)[1], 10);
      attendu = (n * moy + x) / (n + 1);
    } else if (/Dans une classe/.test(t)) {
      const d = t.match(/classe de (\d+) élèves, la moyenne à un devoir est (\d+)\. Dans une autre classe de (\d+) élèves, la moyenne au même devoir est (\d+)/).slice(1).map(Number);
      attendu = (d[0] * d[1] + d[2] * d[3]) / (d[0] + d[2]);
    } else {
      const liste = t.slice(t.indexOf(':') + 1).match(/\d+/g).map(Number);
      attendu = liste.reduce((s, x) => s + x, 0) / liste.length;
    }
    return verifExpression(q, attendu);
  };

  // ---------- droites ----------
  VERIFS['droites/coefficient-deux-points'] = q => {
    const e = q.enonce.replace(/\\,/g, ' ');
    const pts = [...e.matchAll(/[AB]\((-?\d+)\s*;\s*(-?\d+)\)/g)].map(r => [parseInt(r[1], 10), parseInt(r[2], 10)]);
    if (pts.length !== 2) return ['points illisibles dans l’énoncé'];
    return verifExpression(q, (pts[1][1] - pts[0][1]) / (pts[1][0] - pts[0][0]));
  };
  // quatre droites D1..D4 tracées (couleurs fixes), puis quatre affirmations dont une seule est vraie
  const COULEURS_DROITES = ['#E24B4A', '#1f6fb4', '#2e8b3d', '#8e44ad'];
  VERIFS['droites/affirmation-droites'] = q => {
    const d = new DOMParser().parseFromString(q.figure, 'image/svg+xml');
    const lu = {};      // i -> { vert, x } ou { a, b }
    [...d.querySelectorAll('line')].forEach(l => {
      const i = COULEURS_DROITES.indexOf(l.getAttribute('stroke'));
      if (i < 0) return;
      const u = (parseFloat(d.documentElement.getAttribute('width')) - 28) / 10;     // unité du repère [-5 ; 5], marge 14
      const X = px => (parseFloat(px) - 14) / u - 5, Y = py => 5 - (parseFloat(py) - 14) / u;
      const x1 = X(l.getAttribute('x1')), y1 = Y(l.getAttribute('y1')), x2 = X(l.getAttribute('x2')), y2 = Y(l.getAttribute('y2'));
      if (Math.abs(x2 - x1) < 1e-6) lu[i + 1] = { vert: true, x: x1 };
      else { const a = (y2 - y1) / (x2 - x1); lu[i + 1] = { a, b: y1 - a * x1 }; }
    });
    const erreurs = [];
    if (Object.keys(lu).length !== 4) erreurs.push('la figure ne montre pas quatre droites : ' + Object.keys(lu).length);
    const egal = (u, v) => Math.abs(u - v) < 0.02;
    q.options.forEach((o, k) => {
      const z = zones(o), mm = z.maths, t = z.texte;
      const i = parseInt(mm[0].replace('D_', ''), 10), D = lu[i];
      if (!D) { erreurs.push('droite inconnue dans : ' + o); return; }
      let vrai;
      if (/passe par/.test(t)) vrai = !D.vert && egal(D.b, 0);
      else if (/équation/.test(t)) {
        const s = mm[1].replace(/\s/g, '');
        if (/^x=/.test(s)) vrai = !!D.vert && egal(D.x, evalTex(s.slice(2)));
        else { const f = x => evalTex(s.replace(/^y=/, ''), { x }); vrai = !D.vert && egal(f(0), D.b) && egal(f(1) - f(0), D.a); }
      } else if (/coefficient directeur/.test(t)) vrai = !D.vert && egal(evalTex(mm[1]), D.a);
      else if (/ordonnée à l/.test(t)) vrai = !D.vert && egal(evalTex(mm[1]), D.b);
      else { erreurs.push('affirmation non reconnue : ' + t); return; }
      if (k === q.bonne && !vrai) erreurs.push('la bonne réponse est fausse : ' + t + ' ' + mm.join(' ; '));
      if (k !== q.bonne && vrai) erreurs.push('l’option ' + 'abcd'[k] + ' est vraie : ' + t + ' ' + mm.join(' ; '));
    });
    return erreurs;
  };

  // ---------- lectures graphiques ----------
  // lit un repère SVG du site : unité et origine d'après la grille et les axes, courbes d'après les tracés (regroupés par couleur)
  function lireFigure(svg) {
    const d = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const gs = d.querySelectorAll('g');
    const xsGrille = [...gs[0].querySelectorAll('line')].filter(l => l.getAttribute('x1') === l.getAttribute('x2')).map(l => parseFloat(l.getAttribute('x1')));
    const u = xsGrille[1] - xsGrille[0];
    const axes = [...d.querySelectorAll('g')].find(g => g.getAttribute('stroke-width') === '1.2');
    const ls = [...axes.querySelectorAll('line')];
    const Y0 = parseFloat(ls.find(l => l.getAttribute('y1') === l.getAttribute('y2')).getAttribute('y1'));
    const X0 = parseFloat(ls.find(l => l.getAttribute('x1') === l.getAttribute('x2')).getAttribute('x1'));
    const courbes = {};
    d.querySelectorAll('path').forEach(p => {
      const nb = (p.getAttribute('d').match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
      const c = p.getAttribute('stroke');
      (courbes[c] = courbes[c] || []);
      for (let i = 0; i + 1 < nb.length; i += 2) courbes[c].push([(nb[i] - X0) / u, (Y0 - nb[i + 1]) / u]);
    });
    return { u, courbes };
  }
  const nombreTex = s => parseFloat(s.replace(/\{,\}/g, '.').replace(/\s/g, ''));
  const yEn = (pts, x) => pts.reduce((b, p) => (Math.abs(p[0] - x) < Math.abs(b[0] - x) ? p : b))[1];
  const proche2 = (a, b, t) => Math.abs(a - b) < (t || 0.03);
  const intervallesDe = maths => maths.map(s => { const r = s.match(/(-?[\d.{},]+)\\,;\\,(-?[\d.{},]+)/); return r ? [nombreTex(r[1]), nombreTex(r[2])] : null; });
  // la courbe est strictement monotone dans le sens voulu sur [a ; b]
  function monotoneSur(pts, a, b, croit) {
    const P = pts.filter(p => p[0] >= a - 1e-6 && p[0] <= b + 1e-6);
    if (P.length < 3) return false;
    for (let i = 1; i < P.length; i++) { const dy = P[i][1] - P[i - 1][1]; if (croit ? dy < -1e-9 : dy > 1e-9) return false; }
    return Math.abs(P[P.length - 1][1] - P[0][1]) > 1e-6;
  }
  VERIFS['lectures-graphiques/variations-extremum'] = q => {
    const fig = lireFigure(q.figure), pts = Object.values(fig.courbes)[0], e = zones(q.enonce), erreurs = [];
    const verdict = (i, vrai, quoi) => {
      if (i === q.bonne && !vrai) erreurs.push('la bonne réponse est fausse : ' + quoi);
      if (i !== q.bonne && vrai) erreurs.push('l’option ' + 'abcd'[i] + ' est vraie : ' + quoi);
    };
    if (/admet :/.test(e.texte)) {                                              // extremum global d'une parabole
      const ymin = Math.min(...pts.map(p => p[1])), ymax = Math.max(...pts.map(p => p[1]));
      q.options.forEach((o, i) => {
        const z = zones(o), nat = /minimum/.test(z.texte) ? 'min' : 'max', v = nombreTex(z.maths[0]), x0 = nombreTex(z.maths[1].replace(/^x\s*=/, ''));
        const ext = nat === 'min' ? ymin : ymax, ok = proche2(v, ext) && proche2(yEn(pts, x0), ext, 0.05);
        verdict(i, ok, z.texte + z.maths.join(' ; '));
      });
    } else if (/est (croissante|décroissante) sur l/.test(e.texte)) {            // sens de variation sur un intervalle
      const croit = /est croissante/.test(e.texte);
      q.options.forEach((o, i) => { const [a, b] = intervallesDe(zones(o).maths)[0]; verdict(i, monotoneSur(pts, a, b, croit), o); });
    } else if (/maximum local/.test(e.texte)) {                                 // valeur du maximum local
      const locaux = [];
      for (let i = 1; i < pts.length - 1; i++) if (pts[i][1] > pts[i - 1][1] && pts[i][1] >= pts[i + 1][1]) locaux.push(pts[i][1]);
      if (locaux.length !== 1) return ['maximum local non unique sur la courbe : ' + locaux.length];
      q.options.forEach((o, i) => verdict(i, proche2(nombreTex(zones(o).maths[0]), locaux[0], 0.05), o));
    } else {                                                                     // « croissante sur …, puis décroissante sur … »
      q.options.forEach((o, i) => {
        const z = zones(o), sens = [...z.texte.matchAll(/(dé)?croissante/g)].map(r => !r[1]), ints = intervallesDe(z.maths);
        verdict(i, sens.length === ints.length && sens.every((cr, k) => monotoneSur(pts, ints[k][0], ints[k][1], cr)), o);
      });
    }
    return erreurs;
  };
  VERIFS['lectures-graphiques/signe-quotient-images'] = q => {
    const fig = lireFigure(q.figure), f = fig.courbes['#4B46C7'], gc = Object.keys(fig.courbes).find(c => c !== '#4B46C7'), g = fig.courbes[gc];
    const expr = zones(q.enonce).maths.slice(-1)[0], quotient = /dfrac/.test(expr);
    const r = expr.match(/f\((-?[\d.{},]+)\).*?g\((-?[\d.{},]+)\)/);
    const fu = Math.round(yEn(f, nombreTex(r[1]))), gv = Math.round(yEn(g, nombreTex(r[2])));
    const erreurs = [];
    const vrai = t => {
      if (/impossible/.test(t)) return false;
      if (/non défini/.test(t)) return quotient && gv === 0;
      if (/nul/.test(t)) return quotient ? gv !== 0 && fu === 0 : fu * gv === 0;
      const s = quotient ? (gv === 0 ? 0 : fu * gv) : fu * gv;
      if (/positif/.test(t)) return s > 0;
      if (/négatif/.test(t)) return s < 0;
      return null;
    };
    q.options.forEach((o, i) => {
      const t = zones(o).texte, v = vrai(t);
      if (v === null) { erreurs.push('option non reconnue : ' + t); return; }
      if (i === q.bonne && !v) erreurs.push('la bonne réponse est fausse : ' + t + ' (f=' + fu + ', g=' + gv + ')');
      if (i !== q.bonne && v) erreurs.push('l’option ' + 'abcd'[i] + ' est vraie : ' + t + ' (f=' + fu + ', g=' + gv + ')');
    });
    return erreurs;
  };
  VERIFS['lectures-graphiques/reconnaitre-courbe'] = q => {
    const rhs = zones(q.enonce).maths.find(g => /^f\(x\)\s*=/.test(g)).replace(/^f\(x\)\s*=/, '');
    const erreurs = [];
    q.options.forEach((o, i) => {
      const pts = Object.values(lireFigure(o).courbes)[0];
      const ok = pts.length > 10 && pts.every(p => Math.abs(evalTex(rhs, { x: p[0] }) - p[1]) < 0.05);
      if (i === q.bonne && !ok) erreurs.push('la courbe donnée comme bonne ne correspond pas à la formule');
      if (i !== q.bonne && ok) erreurs.push('la courbe ' + 'abcd'[i] + ' correspond aussi à la formule');
    });
    return erreurs;
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
