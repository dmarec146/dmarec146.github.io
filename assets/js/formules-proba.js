// Formules de probabilités saisies au clavier (Terminale, 30/10/2026) : lecture d'une écriture LaTeX contenant des
// probabilités P(A), P_A(B), P(\overline{A}), P(A\cap B), des espérances E(X), des variances V(X) et des lettres,
// puis comparaison avec la formule attendue par SUBSTITUTION NUMÉRIQUE.
//
// Principe : chaque grandeur « P(T) », « P_{T}(S) », « E(X^{2}) »… est un symbole indépendant, auquel on donne des valeurs
// au hasard (plusieurs tirages) ; deux formules sont égales si elles donnent la même valeur pour tous les tirages.
//   - P(\overline{A}) vaut 1 − P(A), et P_B(\overline{A}) vaut 1 − P_B(A) (le contraire dans l'ARGUMENT) ;
//     P_{\overline{B}}(A) est, lui, un symbole indépendant de P_B(A) (le contraire dans le CONDITIONNEMENT) ;
//   - une valeur connue par l'énoncé se déclare dans `fixes` : { 'P(T)': 0.5 } ; l'élève peut alors écrire P(T) ou 1/2 ;
//   - les lettres seules (x, n, m, \sigma…) sont des variables.
// Une formule illisible est refusée. Rien n'est simplifié : l'écriture de l'élève peut être n'importe quelle écriture équivalente.
//
// Usage dans une fiche :
//   FormulesProba.verifier(latexSaisi, { reponse: 'P_{T}(S)\\times P(T)+...', fixes: {...} })  -> true / false
//   FormulesProba.barreHTML(idx, touches)   -> barre de boutons (insererMath de la fiche) sous le champ
//   FormulesProba.aide(touches)             -> texte de l'aide « ? »
// Tests : node outils/verification/test-formules-proba.js
(function (racine) {
  'use strict';

  // ---------- nettoyage du LaTeX ----------
  function nettoyer(s) {
    return String(s)
      .replace(/\\left|\\right/g, '')
      .replace(/\\(?:mathrm|operatorname|text|mathit)\{([^{}]*)\}/g, '$1')
      .replace(/\\bar\{/g, '\\overline{')
      .replace(/\\dfrac|\\tfrac/g, '\\frac')
      .replace(/\\cdot/g, '\\times')
      .replace(/\\[,;! ]|~/g, '')
      .replace(/\{,\}/g, '.')
      .replace(/\s+/g, '');
  }

  // Lit un groupe : « {…} » (équilibré) ou un seul jeton (lettre, chiffre, commande). Renvoie { brut, fin }.
  function lireGroupe(s, i) {
    if (s[i] === '{') {
      let d = 0, j = i;
      for (; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}') { d--; if (d === 0) break; } }
      if (d !== 0) return null;
      return { brut: s.slice(i + 1, j), fin: j + 1 };
    }
    if (s[i] === '\\') {
      const m = /^\\[A-Za-z]+/.exec(s.slice(i));
      if (!m) return null;
      let fin = i + m[0].length;
      if (m[0] === '\\overline' && s[fin] === '{') { const g = lireGroupe(s, fin); if (!g) return null; return { brut: s.slice(i, g.fin), fin: g.fin }; }
      return { brut: m[0], fin };
    }
    if (i < s.length) return { brut: s[i], fin: i + 1 };
    return null;
  }

  // Écriture canonique d'un événement ou d'un argument : R_{1} = R_1, {A} = A
  function canon(b) {
    let t = String(b);
    for (let k = 0; k < 4; k++) t = t.replace(/\{([A-Za-z0-9])\}/g, '$1').replace(/_\{([A-Za-z0-9])\}/g, '_$1');
    return t;
  }
  function accoladesEquilibrees(t) { let d = 0; for (const c of t) { if (c === '{') d++; else if (c === '}') { d--; if (d < 0) return false; } } return d === 0; }
  // Indice « T(S) » ou « \overline{T(S)} » (parenthèse tapée avant de sortir de l'indice) -> { cond: 'T', arg: 'S' } ; sinon null
  function scinderIndice(cond) {
    let m = /^\\overline\{(.+)\((.*)\)\}$/.exec(cond);
    if (m && accoladesEquilibrees(m[1]) && accoladesEquilibrees(m[2])) return { cond: '\\overline{' + m[1] + '}', arg: m[2] };
    m = /^(.+?)\((.*)\)$/.exec(cond);
    if (m && accoladesEquilibrees(m[1]) && accoladesEquilibrees(m[2])) return { cond: m[1], arg: m[2] };
    return null;
  }
  function contraire(b) {   // « \overline{Z} » en entier -> Z ; sinon null
    const m = /^\\overline\{(.*)\}$/.exec(b);
    if (!m) return null;
    let d = 0;
    for (let k = 0; k < m[1].length; k++) { if (m[1][k] === '{') d++; else if (m[1][k] === '}') { d--; if (d < 0) return null; } }
    return d === 0 ? m[1] : null;
  }

  // ---------- lecture (descente récursive) : produit une fonction (valeurs) -> nombre ----------
  const COMMANDES_LETTRES = ['sigma', 'alpha', 'beta', 'lambda', 'mu', 'theta', 'pi'];

  function compiler(latex) {
    const s = nettoyer(latex);
    const symboles = [];                 // clés rencontrées
    let i = 0;
    function peek() { return s[i]; }
    function commence(motif) { return s.startsWith(motif, i); }
    function debutAtome() {
      const c = s[i];
      if (c === undefined) return false;
      if (/[0-9A-Za-z(.]/.test(c)) return true;
      if (c === '{') return true;
      if (s.startsWith('\\frac', i)) return true;
      const m = /^\\([A-Za-z]+)/.exec(s.slice(i));
      return !!(m && COMMANDES_LETTRES.includes(m[1]));
    }
    function symbole(kind, cond, arg) {
      const cle = kind + '|' + canon(cond) + '|' + canon(arg);
      if (!symboles.includes(cle)) symboles.push(cle);
      return cle;
    }
    function expression() {
      let t = terme();
      while (i < s.length && (peek() === '+' || peek() === '-')) {
        const op = s[i++], u = terme(), g = t;
        t = op === '+' ? (v) => g(v) + u(v) : (v) => g(v) - u(v);
      }
      return t;
    }
    function terme() {
      let t = unaire();
      for (;;) {
        if (commence('\\times')) { i += 6; const u = unaire(), g = t; t = (v) => g(v) * u(v); }
        else if (commence('\\div')) { i += 4; const u = unaire(), g = t; t = (v) => g(v) / u(v); }
        else if (peek() === '/') { i++; const u = unaire(), g = t; t = (v) => g(v) / u(v); }
        else if (debutAtome()) { const u = puissance(), g = t; t = (v) => g(v) * u(v); }
        else break;
      }
      return t;
    }
    function unaire() {
      if (peek() === '-') { i++; const u = unaire(); return (v) => -u(v); }
      if (peek() === '+') { i++; return unaire(); }
      return puissance();
    }
    function puissance() {
      let b = atome();
      while (peek() === '^') {
        i++;
        let e;
        if (peek() === '{') { const g = lireGroupe(s, i); if (!g) throw new Error('exposant'); i = g.fin; e = sousFormule(g.brut); }
        else if (/[0-9]/.test(peek() || '')) { const m = /^[0-9]+/.exec(s.slice(i)); i += m[0].length; const n = Number(m[0]); e = () => n; }
        else { const a = atome(); e = a; }
        const g = b;
        b = (v) => Math.pow(g(v), e(v));
      }
      return b;
    }
    function sousFormule(brut) {
      const f = compiler(brut);
      f.symboles.forEach((c) => { if (!symboles.includes(c)) symboles.push(c); });
      return f.fonction;
    }
    function atome() {
      const c = peek();
      if (c === undefined) throw new Error('fin');
      if (/[0-9.]/.test(c)) { const m = /^[0-9]*\.?[0-9]+|^[0-9]+/.exec(s.slice(i)); i += m[0].length; const n = Number(m[0]); return () => n; }
      if (c === '(') {
        i++; const e = expression();
        if (peek() !== ')') throw new Error('parenthese');
        i++; return e;
      }
      if (c === '{') { const g = lireGroupe(s, i); if (!g) throw new Error('accolade'); i = g.fin; return sousFormule(g.brut); }
      if (commence('\\frac')) {
        i += 5;
        const a = lireGroupe(s, i); if (!a) throw new Error('frac'); i = a.fin;
        const b = lireGroupe(s, i); if (!b) throw new Error('frac'); i = b.fin;
        const num = sousFormule(a.brut), den = sousFormule(b.brut);
        return (v) => num(v) / den(v);
      }
      const cmd = /^\\([A-Za-z]+)/.exec(s.slice(i));
      if (cmd) {
        if (!COMMANDES_LETTRES.includes(cmd[1])) throw new Error('commande ' + cmd[1]);
        i += cmd[0].length;
        const nom = '\\' + cmd[1];
        return (v) => v.variable(nom);
      }
      if (/[A-Za-z]/.test(c)) {
        // forme P(...), P_{...}(...), E(...), V(...)
        if (c === 'P' || c === 'E' || c === 'V') {
          let j = i + 1, cond = '';
          if (c === 'P' && s[j] === '_') { const g = lireGroupe(s, j + 1); if (!g) throw new Error('indice'); cond = g.brut; j = g.fin; }
          // « P_T(S) » tapé au clavier physique : la parenthèse reste dans l'indice (P_{T(S)}) tant qu'on n'est pas sorti de l'indice
          if (c === 'P' && cond && s[j] !== '(') {
            const sp = scinderIndice(cond);
            if (sp) { i = j; const inv = contraire(sp.arg); if (inv !== null) { const cle = symbole('P', sp.cond, inv); return (v) => 1 - v.symbole(cle); } const cle = symbole('P', sp.cond, sp.arg); return (v) => v.symbole(cle); }
          }
          if (s[j] === '(') {
            let d = 0, k = j;
            for (; k < s.length; k++) { if (s[k] === '(') d++; else if (s[k] === ')') { d--; if (d === 0) break; } }
            if (d !== 0) throw new Error('parenthese de ' + c);
            const arg = s.slice(j + 1, k);
            i = k + 1;
            if (c === 'P') {
              const inv = contraire(arg);
              if (inv !== null) { const cle = symbole('P', cond, inv); return (v) => 1 - v.symbole(cle); }
              const cle = symbole('P', cond, arg); return (v) => v.symbole(cle);
            }
            const cle = symbole(c, '', arg);
            return (v) => v.symbole(cle);
          }
        }
        i++;
        const nom = c;
        return (v) => v.variable(nom);
      }
      throw new Error('caractere ' + c);
    }
    let f;
    try {
      f = expression();
      if (i !== s.length) return null;
    } catch (e) { return null; }
    return { fonction: f, symboles };
  }

  // Clé canonique d'une grandeur écrite en LaTeX (pour les valeurs connues) : « P(T) », « P_{R_1}(R_2) »…
  function cleDe(latex) {
    const c = compiler(latex);
    if (!c || c.symboles.length !== 1) return null;
    return c.symboles[0];
  }

  // ---------- valeurs aléatoires ----------
  function hasard(a, b) { return a + Math.random() * (b - a); }
  function nouvelleValuation(fixes) {
    const memo = {}, vars = {}, connu = {};
    Object.keys(fixes || {}).forEach((k) => {
      const kc = cleDe(k);
      if (kc) connu[kc] = Number(fixes[k]);
      else if (/^(\\[A-Za-z]+|[A-Za-z])$/.test(k)) vars[k] = Number(fixes[k]);
    });
    const PREMIERS = [1.37, 2.11, 1.73, 2.59, 0.83, 1.19, 2.93, 0.61];
    return {
      symbole(cle) {
        if (cle in connu) return connu[cle];
        if (!(cle in memo)) {
          const kind = cle[0];
          memo[cle] = kind === 'P' ? hasard(0.12, 0.88) : kind === 'V' ? hasard(0.6, 4) : hasard(-3.3, 3.3);
        }
        return memo[cle];
      },
      variable(nom) {
        if (nom in vars) return vars[nom];
        if (!(nom in memo)) memo[nom] = PREMIERS[Object.keys(memo).length % PREMIERS.length] + hasard(0, 0.4);
        return memo[nom];
      }
    };
  }

  const NB_TIRAGES = 8;
  function proche(a, b) { return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-9 * (1 + Math.abs(a) + Math.abs(b)); }

  // La formule saisie (LaTeX) est-elle égale à la formule attendue ?
  function verifier(latexSaisi, ex) {
    const u = compiler(latexSaisi), a = compiler(ex.reponse);
    if (!u || !a) return false;
    const fixes = ex.fixes || {};
    for (let k = 0; k < NB_TIRAGES; k++) {
      const val = nouvelleValuation(fixes);
      // un même tirage pour les deux formules : les symboles sont mémorisés par clé
      let x, y;
      try { x = u.fonction(val); y = a.fonction(val); } catch (e) { return false; }
      if (!proche(x, y)) return false;
    }
    return true;
  }

  // ---------- barre de boutons ----------
  const TOUCHES = {
    P:     { libelle: 'P( )',      tex: 'P\\left(#0\\right)',       titre: 'Probabilité P(…)' },
    Pcond: { libelle: 'P<sub>▢</sub>( )', tex: 'P_{#0}\\left(#0\\right)', titre: 'Probabilité conditionnelle P indice (…)' },
    bar:   { libelle: '<span style="text-decoration:overline">A</span>', tex: '\\overline{#0}', titre: 'Événement contraire' },
    cap:   { libelle: '∩',         tex: '\\cap ',                   titre: 'Intersection' },
    cup:   { libelle: '∪',         tex: '\\cup ',                   titre: 'Réunion' },
    E:     { libelle: 'E( )',      tex: 'E\\left(#0\\right)',       titre: 'Espérance' },
    V:     { libelle: 'V( )',      tex: 'V\\left(#0\\right)',       titre: 'Variance' },
    carre: { libelle: 'x²',        tex: '^{2}',                     titre: 'Carré' }
  };
  // gabarit LaTeX -> littéral JavaScript entre apostrophes, dans un attribut onclick (chaque \ est doublé)
  function echapper(t) { return String(t).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
  function barreHTML(idx, touches) {
    const liste = (touches && touches.length) ? touches : ['P', 'Pcond', 'bar', 'cap', 'cup'];
    return '<div class="q-barre-formule">' + liste.filter((t) => TOUCHES[t]).map((t) =>
      `<button type="button" class="q-touche-formule" title="${TOUCHES[t].titre}" onmousedown="event.preventDefault()" onclick="insererMath(${idx},'${echapper(TOUCHES[t].tex)}')">${TOUCHES[t].libelle}</button>`).join('') + '</div>';
  }
  const AIDES = {
    P: '<code>P( )</code> insère une probabilité',
    Pcond: '<code>P▢( )</code> une probabilité conditionnelle (P indice A de B)',
    bar: 'la barre note l\'événement contraire',
    cap: '∩ l\'intersection',
    cup: '∪ la réunion',
    E: '<code>E( )</code> l\'espérance',
    V: '<code>V( )</code> la variance',
    carre: 'x² un carré'
  };
  function aide(touches) {
    const liste = (touches && touches.length) ? touches : ['P', 'Pcond', 'bar', 'cap', 'cup'];
    return 'Écrire la formule avec les boutons placés sous le champ : ' + liste.filter((t) => AIDES[t]).map((t) => AIDES[t]).join(', ') + '. Toute écriture équivalente est acceptée.';
  }

  const API = { verifier, compiler, cleDe, nettoyer, barreHTML, aide, TOUCHES };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else racine.FormulesProba = API;
})(typeof window !== 'undefined' ? window : globalThis);
