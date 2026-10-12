// Moteur de validation des reponses par FORME (12/10/2026, demande de David).
//
// Probleme corrige : jusqu'ici, une reponse dont la forme est imposee (« une seule puissance », « forme
// developpee », « forme canonique »…) etait validee par l'egalite NUMERIQUE avec la reponse attendue :
// 2401 passait pour 7^4, la forme developpee recopiee passait pour la forme canonique demandee, etc.
//
// Ici, la reponse de l'eleve est LUE (LaTeX d'un champ mathematique, ou texte tape) dans un arbre
// d'expression propre au moteur -- ce qui evite en prime l'ambiguite de math.js sur « 1/4(x+2)^2 »
// (lu 1/(4(x+2)^2)) --, puis on controle (1) que la valeur est celle de la reponse attendue, (2) que la
// FORME est celle qui est demandee. Chaque forme est un predicat sur l'arbre, ecrit une fois, partage par
// toutes les fiches. Une question declare sa forme dans l'objet de l'exercice :
//
//     { forme: 'puissance', formeOptions: {...}, reponse: '7^4', ... }
//
// et la fiche appelle  MoteurReponses.verifier(ex, champ, valeurAscii)  dans son aiguillage de
// verifierUne(), et  MoteurReponses.aide(ex)  dans aideContextuellePour(). Formes : puissance, monome,
// developpe, canonique (voir plus bas). Module sans dependance
// (ni math.js ni DOM) : utilisable tel quel sous Node pour les tests.
(function (racine) {
  'use strict';

  // =====================================================================================================
  // 1. LECTURE : texte ou LaTeX -> arbre
  // =====================================================================================================
  const FONCTIONS = new Set(['exp', 'ln', 'cos', 'sin', 'tan', 'abs']);
  const LETTRES_GRECQUES = { lambda: 'λ', pi: 'π', alpha: 'α', beta: 'β', gamma: 'γ', theta: 'θ' };

  function lexer(src, modeLatex) {
    let s = String(src)
      .replace(/\{,\}/g, '.')
      .replace(/(\d),(\d)/g, '$1.$2')
      .replace(/[−–]/g, '-')
      .replace(/[×·∗⋅]/g, '*')
      .replace(/÷/g, '/')
      .replace(/²/g, '^2').replace(/³/g, '^3')
      .replace(/\\(left|right)\s*([()\[\]|.])/g, (m, a, d) => (d === '.' ? '' : d))
      .replace(/\\(left|right)/g, '')
      .replace(/\\[,;:! ]|\\quad|\\qquad|~/g, ' ');
    const jetons = [];
    let i = 0;
    const n = s.length;
    while (i < n) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(s[i + 1] || ''))) {
        let j = i;
        while (j < n && /[0-9]/.test(s[j])) j++;
        if (s[j] === '.' && /[0-9]/.test(s[j + 1] || '')) { j++; while (j < n && /[0-9]/.test(s[j])) j++; }
        jetons.push({ t: 'NUM', brut: s.slice(i, j) });
        i = j; continue;
      }
      if (c === '\\') {
        let j = i + 1;
        while (j < n && /[A-Za-z]/.test(s[j])) j++;
        const nom = s.slice(i + 1, j);
        if (!nom) throw new Error('commande vide');
        if (nom === 'frac' || nom === 'dfrac' || nom === 'tfrac') jetons.push({ t: 'CMD', nom: 'frac' });
        else if (nom === 'sqrt') jetons.push({ t: 'CMD', nom: 'sqrt' });
        else if (nom === 'times' || nom === 'cdot' || nom === 'ast') jetons.push({ t: 'OP', v: '*' });
        else if (nom === 'div') jetons.push({ t: 'OP', v: '/' });
        else if (LETTRES_GRECQUES[nom]) jetons.push({ t: 'ID', nom: LETTRES_GRECQUES[nom] });
        else throw new Error('commande inconnue : ' + nom);
        i = j; continue;
      }
      if (/[A-Za-zλπαβγθ]/.test(c)) {
        if (modeLatex || !/[A-Za-z]/.test(c)) { jetons.push({ t: 'ID', nom: c }); i++; continue; }
        let j = i;
        while (j < n && /[A-Za-z]/.test(s[j])) j++;
        const mot = s.slice(i, j);
        i = j;
        if (mot === 'sqrt') jetons.push({ t: 'CMD', nom: 'sqrt' });
        else if (mot === 'lam' || mot === 'lambda') jetons.push({ t: 'ID', nom: 'λ' });
        else if (mot === 'pi') jetons.push({ t: 'ID', nom: 'π' });
        else if (FONCTIONS.has(mot)) jetons.push({ t: 'FUNC', nom: mot });
        else for (const l of mot) jetons.push({ t: 'ID', nom: l });
        continue;
      }
      if ('+-*/^'.includes(c)) { jetons.push({ t: 'OP', v: c }); i++; continue; }
      if (c === '(' || c === '[') { jetons.push({ t: 'LP' }); i++; continue; }
      if (c === ')' || c === ']') { jetons.push({ t: 'RP' }); i++; continue; }
      if (c === '{') { jetons.push({ t: 'LB' }); i++; continue; }
      if (c === '}') { jetons.push({ t: 'RB' }); i++; continue; }
      throw new Error('caractere inattendu : ' + c);
    }
    return jetons;
  }

  const num = (v) => ({ t: 'num', v });
  const sym = (nom) => ({ t: 'sym', nom });
  const add = (a, b) => ({ t: 'add', a, b });
  const sub = (a, b) => ({ t: 'sub', a, b });
  const mul = (a, b) => ({ t: 'mul', a, b });
  const div = (a, b) => ({ t: 'div', a, b });
  const pow = (a, b) => ({ t: 'pow', a, b });
  const neg = (a) => ({ t: 'neg', a });

  // Priorites : + - < * / et produit implicite (meme niveau, de gauche a droite : 1/4(x+2)^2 = (1/4)(x+2)^2) < moins unaire < ^
  function lire(src, modeLatex) {
    const J = lexer(src, modeLatex);
    let p = 0;
    const voir = () => J[p];
    const prendre = () => J[p++];
    const attendre = (t) => { const j = prendre(); if (!j || j.t !== t) throw new Error('attendu ' + t); return j; };
    const estOp = (j, v) => j && j.t === 'OP' && j.v === v;
    const commenceFacteur = (j) => j && (j.t === 'NUM' || j.t === 'ID' || j.t === 'LP' || j.t === 'LB' || j.t === 'FUNC' || (j.t === 'CMD'));

    function expression() {
      let g = terme();
      for (;;) {
        const j = voir();
        if (estOp(j, '+')) { prendre(); g = add(g, terme()); }
        else if (estOp(j, '-')) { prendre(); g = sub(g, terme()); }
        else return g;
      }
    }
    function terme() {
      let g = unaire();
      for (;;) {
        const j = voir();
        if (estOp(j, '*')) { prendre(); g = mul(g, unaire()); }
        else if (estOp(j, '/')) { prendre(); g = div(g, unaire()); }
        else if (commenceFacteur(j)) g = mul(g, puissance());
        else return g;
      }
    }
    function unaire() {
      const j = voir();
      if (estOp(j, '-')) { prendre(); return neg(unaire()); }
      if (estOp(j, '+')) { prendre(); return unaire(); }
      return puissance();
    }
    function puissance() {
      const base = atome();
      if (estOp(voir(), '^')) { prendre(); return pow(base, exposant()); }
      return base;
    }
    function exposant() {
      const j = voir();
      if (j && j.t === 'LB') { prendre(); const e = expression(); attendre('RB'); return estOp(voir(), '^') ? pow(e, (prendre(), exposant())) : e; }
      if (estOp(j, '-')) { prendre(); return neg(exposantAtome()); }
      if (estOp(j, '+')) { prendre(); return exposantAtome(); }
      return exposantAtome();
    }
    function exposantAtome() {
      const e = atome();
      return estOp(voir(), '^') ? pow(e, (prendre(), exposant())) : e;
    }
    // \frac14 : chiffres colles, un chiffre par argument
    function argFraction() {
      const j = voir();
      if (j && j.t === 'NUM' && !j.brut.includes('.') && j.brut.length > 1) {
        const premier = j.brut[0];
        J[p] = { t: 'NUM', brut: j.brut.slice(1) };
        return num(Number(premier));
      }
      return atome();
    }
    function atome() {
      const j = prendre();
      if (!j) throw new Error('fin inattendue');
      if (j.t === 'NUM') return num(Number(j.brut));
      if (j.t === 'ID') return sym(j.nom);
      if (j.t === 'LP') { const e = expression(); attendre('RP'); return e; }
      if (j.t === 'LB') { const e = expression(); attendre('RB'); return e; }
      if (j.t === 'FUNC') return { t: 'fn', nom: j.nom, a: atome() };
      if (j.t === 'CMD' && j.nom === 'frac') { const a = argFraction(); const b = argFraction(); return div(a, b); }
      if (j.t === 'CMD' && j.nom === 'sqrt') return { t: 'sqrt', a: atome() };
      throw new Error('atome inattendu');
    }
    const arbre = expression();
    if (p < J.length) throw new Error('reste de texte');
    return arbre;
  }

  // =====================================================================================================
  // 2. OUTILS SUR L'ARBRE
  // =====================================================================================================
  function evaluer(n, portee) {
    switch (n.t) {
      case 'num': return n.v;
      case 'sym': {
        if (n.nom === 'π') return Math.PI;
        if (!(n.nom in portee)) throw new Error('symbole libre : ' + n.nom);
        return portee[n.nom];
      }
      case 'add': return evaluer(n.a, portee) + evaluer(n.b, portee);
      case 'sub': return evaluer(n.a, portee) - evaluer(n.b, portee);
      case 'mul': return evaluer(n.a, portee) * evaluer(n.b, portee);
      case 'div': return evaluer(n.a, portee) / evaluer(n.b, portee);
      case 'pow': return Math.pow(evaluer(n.a, portee), evaluer(n.b, portee));
      case 'neg': return -evaluer(n.a, portee);
      case 'sqrt': return Math.sqrt(evaluer(n.a, portee));
      case 'fn': {
        const v = evaluer(n.a, portee);
        return { exp: Math.exp, ln: Math.log, cos: Math.cos, sin: Math.sin, tan: Math.tan, abs: Math.abs }[n.nom](v);
      }
      default: throw new Error('noeud inconnu');
    }
  }

  function symboles(n, ens) {
    ens = ens || new Set();
    if (n.t === 'sym') { if (n.nom !== 'π') ens.add(n.nom); }
    else for (const k of ['a', 'b']) if (n[k]) symboles(n[k], ens);
    return ens;
  }
  const contient = (n, noms) => { const s = symboles(n); return noms.some((v) => s.has(v)); };

  // valeur de n si c'est un entier relatif ecrit comme tel (3, -3, (-3))
  function entierRelatif(n) {
    if (n.t === 'num' && Number.isInteger(n.v)) return n.v;
    if (n.t === 'neg') { const v = entierRelatif(n.a); return v === null ? null : -v; }
    return null;
  }

  // meme valeur numerique en plusieurs points (symboles libres compris)
  function memeValeur(u, a) {
    const noms = new Set([...symboles(u), ...symboles(a)]);
    let valides = 0;
    for (let essai = 0; essai < 12 && valides < 6; essai++) {
      const portee = {};
      let k = 0;
      noms.forEach((nom) => { portee[nom] = 0.7 + ((essai * 0.83 + k * 1.37 + 0.31) % 3.9); k++; });
      let vu, va;
      try { vu = evaluer(u, portee); va = evaluer(a, portee); } catch (e) { return false; }
      if (!isFinite(va)) continue;
      if (!isFinite(vu) || Math.abs(vu - va) > 1e-8 * (1 + Math.abs(va))) return false;
      valides++;
    }
    return valides >= 3;
  }

  // termes d'une somme : [{signe, noeud}]
  function termes(n, signe) {
    signe = signe || 1;
    if (n.t === 'add') return termes(n.a, signe).concat(termes(n.b, signe));
    if (n.t === 'sub') return termes(n.a, signe).concat(termes(n.b, -signe));
    if (n.t === 'neg') return termes(n.a, -signe);
    return [{ signe, noeud: n }];
  }

  // facteurs d'un produit / quotient : {signe, num: [...], den: [...]}
  function aplatir(n, inv, acc) {
    acc = acc || { signe: 1, num: [], den: [] };
    if (n.t === 'mul') { aplatir(n.a, inv, acc); aplatir(n.b, inv, acc); }
    else if (n.t === 'div') { aplatir(n.a, inv, acc); aplatir(n.b, !inv, acc); }
    else if (n.t === 'neg') { acc.signe = -acc.signe; aplatir(n.a, inv, acc); }
    else (inv ? acc.den : acc.num).push(n);
    return acc;
  }

  // lettres « variables » d'une expression : toutes sauf les lettres grecques (λ, α… : parametres)
  const variablesDe = (n) => [...symboles(n)].filter((s) => !/[λπαβγθ]/.test(s));

  const pgcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; };
  const sansCarre = (k) => { for (let d = 2; d * d <= k; d++) if (k % (d * d) === 0) return false; return true; };

  // =====================================================================================================
  // 3. FORMES (chaque forme : (arbreEleve, arbreAttendu, options) -> booleen ; la valeur est deja verifiee)
  // =====================================================================================================

  // --- 3.1 puissance : produit / quotient de puissances d'entiers, une seule puissance par base ---------
  // atomes {base, exposant, cote}. Regles : chaque base une seule fois, exposant != 0 et > 0 (une fraction
  // exprime l'inverse) sauf options.exposantsNegatifs ; memes bases et memes exposants que la reponse
  // attendue ; un nombre calcule (2401) n'est pas une puissance de la base attendue (7).
  function lirePuissances(n, options) {
    const f = aplatir(n);
    const cartes = new Map();
    for (const cote of ['num', 'den']) {
      for (const feuille of f[cote]) {
        let base, exp = 1;
        if (feuille.t === 'num' && Number.isInteger(feuille.v)) base = feuille.v;
        else if (feuille.t === 'pow') { base = entierRelatif(feuille.a); const e = entierRelatif(feuille.b); if (base === null || e === null) return null; exp = e; }
        else return null;
        if (base === 1) continue;                       // 1/5^4 : le 1 ne compte pas
        if (cartes.has(base)) return null;              // base repetee : 7^2*7, ou 7^3/7
        if (exp === 0) return null;
        if (exp < 0 && !(options && options.exposantsNegatifs)) return null;
        cartes.set(base, cote === 'num' ? exp : -exp);
      }
    }
    return { signe: f.signe, cartes };
  }
  function formePuissance(u, a, options) {
    const lu = lirePuissances(u, options), la = lirePuissances(a, { exposantsNegatifs: true });
    if (!lu || !la || lu.signe !== la.signe || lu.cartes.size !== la.cartes.size) return false;
    for (const [base, e] of la.cartes) if (lu.cartes.get(base) !== e) return false;
    return true;
  }

  // --- 3.2 monome : coefficient (un seul nombre) x lettres a un exposant entier, chacune une fois ------
  // Accepte aussi une puissance de nombre a exposant litteral (3*2^n). Ni somme ni parenthese a developper.
  function lireMonome(n) {
    const f = aplatir(n);
    let coef = 1, nbNum = 0, nbDen = 0, numCoef = null, denCoef = null;
    const lettres = new Map();     // lettre -> exposant signe
    const bases = [];              // {base, exposant (noeud), cote}
    for (const cote of ['num', 'den']) {
      for (const feuille of f[cote]) {
        if (feuille.t === 'num') {
          if (cote === 'num') { nbNum++; numCoef = feuille.v; } else { nbDen++; denCoef = feuille.v; }
        } else if (feuille.t === 'sym') {
          if (lettres.has(feuille.nom)) return null;
          lettres.set(feuille.nom, cote === 'num' ? 1 : -1);
        } else if (feuille.t === 'pow' && feuille.a.t === 'sym') {
          const e = entierRelatif(feuille.b);
          if (e === null || e < 1 || lettres.has(feuille.a.nom)) return null;
          lettres.set(feuille.a.nom, cote === 'num' ? e : -e);
        } else if (feuille.t === 'pow' && feuille.a.t === 'num' && Number.isInteger(feuille.a.v) && feuille.a.v >= 2) {
          if (symboles(feuille.b).size === 0) return null;        // 2^3 : a calculer
          if (!polynomial(feuille.b)) return null;
          if (bases.some((b) => b.base === feuille.a.v)) return null;
          bases.push({ base: feuille.a.v, exposant: feuille.b, cote });
        } else return null;
      }
    }
    if (nbNum > 1 || nbDen > 1) return null;                       // 2*9x : coefficient a reduire
    if (nbNum && nbDen && (!Number.isInteger(numCoef) || !Number.isInteger(denCoef) || pgcd(numCoef, denCoef) !== 1)) return null;
    if (denCoef === 0) return null;
    coef = (nbNum ? numCoef : 1) / (nbDen ? denCoef : 1);
    return { signe: f.signe, coef, lettres, bases };
  }
  // expression formee seulement de nombres, lettres, + - * (exposants litteraux)
  function polynomial(n) {
    if (n.t === 'num' || n.t === 'sym') return true;
    if (n.t === 'neg') return polynomial(n.a);
    if (n.t === 'add' || n.t === 'sub' || n.t === 'mul') return polynomial(n.a) && polynomial(n.b);
    return false;
  }
  function formeMonome(u, a) {
    const lu = lireMonome(u), la = lireMonome(a);
    if (!lu || !la) return false;
    if (lu.signe * lu.coef !== la.signe * la.coef && Math.abs(lu.signe * lu.coef - la.signe * la.coef) > 1e-9) return false;
    if (lu.lettres.size !== la.lettres.size || lu.bases.length !== la.bases.length) return false;
    for (const [l, e] of la.lettres) if (lu.lettres.get(l) !== e) return false;
    for (const ba of la.bases) {
      const bu = lu.bases.find((b) => b.base === ba.base);
      if (!bu || bu.cote !== ba.cote || !memeValeur(bu.exposant, ba.exposant)) return false;
    }
    return true;
  }

  // --- 3.3 developpe : somme de termes c * x^k, un seul terme par puissance, sans parenthese -----------
  // options.variables : lettres du developpement (defaut : celles de la reponse attendue) ; les lettres grecques
  // (λ…) sont des parametres.
  function lireTermeDeveloppe(noeud, variables) {
    const f = aplatir(noeud);
    let nbNum = 0, nbDen = 0, numC = null, denC = null, surd = 0;
    const exposants = {};          // variable -> exposant
    const parametres = [];
    for (const cote of ['num', 'den']) {
      for (const feuille of f[cote]) {
        if (feuille.t === 'num') {
          if (cote === 'num') { nbNum++; numC = feuille.v; } else { nbDen++; denC = feuille.v; }
        } else if (feuille.t === 'sqrt') {
          if (feuille.a.t !== 'num' || !Number.isInteger(feuille.a.v) || feuille.a.v < 2 || !sansCarre(feuille.a.v) || cote === 'den') return null;
          surd++;
        } else if (feuille.t === 'sym') {
          if (variables.includes(feuille.nom)) { if (cote === 'den' || exposants[feuille.nom]) return null; exposants[feuille.nom] = 1; }
          else parametres.push((cote === 'den' ? '/' : '') + feuille.nom);
        } else if (feuille.t === 'pow' && feuille.a.t === 'sym') {
          const e = entierRelatif(feuille.b);
          if (e === null || e < 1) return null;
          if (variables.includes(feuille.a.nom)) { if (cote === 'den' || exposants[feuille.a.nom]) return null; exposants[feuille.a.nom] = e; }
          else parametres.push((cote === 'den' ? '/' : '') + feuille.a.nom + '^' + e);
        } else return null;      // somme, puissance de nombre, parenthese a developper…
      }
    }
    if (nbNum > 1 || nbDen > 1 || surd > 1) return null;
    if (nbNum && nbDen && (!Number.isInteger(numC) || !Number.isInteger(denC) || pgcd(numC, denC) !== 1)) return null;
    if ((nbNum && numC === 0) || denC === 0) return null;                          // « 0x » a supprimer
    return { signature: Object.keys(exposants).sort().map((v) => v + exposants[v]).join(',') + '|' + parametres.sort().join(',') + '|' + (surd ? 'r' : '') };
  }
  function formeDeveloppe(u, a, options) {
    const variables = (options && options.variables) || variablesDe(a);
    const ts = termes(u);
    const vus = new Set();
    for (const t of ts) {
      const lt = lireTermeDeveloppe(t.noeud, variables);
      if (!lt || vus.has(lt.signature)) return false;
      vus.add(lt.signature);
    }
    return true;
  }

  // --- 3.4 canonique : a(x - α)^2 + β, x une seule fois -------------------------------------------------
  // Le terme en x est  [coefficient] * (x ± c)^2  (ou (x)^2) ; le reste est la constante β. Sans parametre,
  // coefficient, c et β sont des nombres sous forme finale (entier, decimal, fraction irreductible) ;
  // avec un parametre (λ…), ils sont libres (mais x-libres).
  function nombreFinal(n) {
    if (n.t === 'num') return true;
    if (n.t === 'neg') return nombreFinal(n.a);
    if (n.t === 'div') {
      const p = entierRelatif(n.a), q = entierRelatif(n.b);
      return p !== null && q !== null && q !== 0 && pgcd(p, q) === 1 && Math.abs(q) !== 1;
    }
    return false;
  }
  function formeCanonique(u, a, options) {
    const variable = (options && options.variable) || variablesDe(a)[0] || 'x';
    const ts = termes(u);
    const enX = ts.filter((t) => contient(t.noeud, [variable]));
    const hors = ts.filter((t) => !contient(t.noeud, [variable]));
    if (enX.length !== 1) return false;
    const parametres = [...symboles(u)].filter((s) => s !== variable).length > 0;
    // terme en x : un seul facteur contient x, c'est un carre (binome)^2
    const f = aplatir(enX[0].noeud);
    const portent = [];
    for (const cote of ['num', 'den']) for (const feuille of f[cote]) if (contient(feuille, [variable])) portent.push({ feuille, cote });
    if (portent.length !== 1 || portent[0].cote !== 'num') return false;
    const carre = portent[0].feuille;
    if (carre.t !== 'pow' || entierRelatif(carre.b) !== 2) return false;
    const b = carre.a;
    let c = null;
    if (b.t === 'sym' && b.nom === variable) c = null;
    else if ((b.t === 'add' || b.t === 'sub') && b.a.t === 'sym' && b.a.nom === variable && !contient(b.b, [variable])) c = b.b;
    else return false;
    if (!parametres) {
      // coefficient : au plus un nombre en facteur et un nombre au denominateur (fraction irreductible)
      const facteurs = f.num.filter((x) => x !== carre);
      if (facteurs.length > 1 || f.den.length > 1) return false;
      if (facteurs.some((x) => x.t !== 'num') || f.den.some((x) => x.t !== 'num' || x.v === 0)) return false;
      if (facteurs.length && f.den.length && (!Number.isInteger(facteurs[0].v) || !Number.isInteger(f.den[0].v) || pgcd(facteurs[0].v, f.den[0].v) !== 1)) return false;
      if (c && !nombreFinal(c)) return false;
      if (hors.length > 1) return false;
      if (hors.length === 1 && !nombreFinal(hors[0].noeud)) return false;
    }
    return true;
  }

  const FORMES = { puissance: formePuissance, monome: formeMonome, developpe: formeDeveloppe, canonique: formeCanonique };

  // =====================================================================================================
  // 4. API
  // =====================================================================================================
  // entree : {latex, ascii}. Renvoie l'arbre, ou null si illisible.
  function lireEntree(entree) {
    const essais = [];
    if (entree.latex) essais.push([entree.latex, true]);
    if (entree.ascii) essais.push([entree.ascii, false]);
    for (const [src, latex] of essais) {
      try { return lire(src, latex); } catch (e) { /* essai suivant */ }
    }
    return null;
  }

  // ex : exercice ({forme, formeOptions, reponse}) ; entree : {latex, ascii}
  function verifierForme(ex, entree) {
    const forme = FORMES[ex.forme];
    if (!forme) throw new Error('forme inconnue : ' + ex.forme);
    const u = lireEntree(entree);
    if (!u) return false;
    let a;
    try { a = lire(ex.reponse, false); } catch (e) { return false; }
    return memeValeur(u, a) && forme(u, a, ex.formeOptions || {});
  }

  const AIDES = {
    puissance: (o) => 'La réponse doit être écrite avec des <strong>puissances</strong> : par exemple <code>7^4</code> (et non le nombre calculé <code>2401</code>)'
      + (o.fraction ? ', ou une fraction comme <code>1/5^4</code> quand il y a un exposant négatif à supprimer' : ', ou <code>2^3*5</code> s’il y a plusieurs bases')
      + '. Chaque base ne doit apparaître qu’une fois, avec un exposant entier positif.',
    monome: () => 'La réponse doit être <strong>un seul terme simplifié</strong> : le coefficient une seule fois, puis chaque lettre une seule fois avec son exposant, par exemple <code>18x^2</code> ou <code>3*2^n</code> ; pas de parenthèse ni de somme à réduire.',
    developpe: () => 'La réponse doit être la <strong>forme développée et réduite</strong> : une somme de termes de la forme <code>ax^k</code>, un seul terme par puissance de x, sans parenthèse à développer. Une forme factorisée ou canonique n’est pas acceptée, même si elle est égale.',
    canonique: () => 'La réponse doit être écrite sous la <strong>forme canonique</strong> <code>a(x-α)^2+β</code> : x n’apparaît qu’une seule fois, dans une parenthèse élevée au carré (par exemple <code>2(x-4)^2+6</code>). La forme développée n’est pas acceptée, même si elle est égale.'
  };
  function aide(ex) { return (AIDES[ex.forme] || (() => ''))(ex.formeOptions || {}); }

  // La fiche appelle verifier(ex, champ, valeurAscii) depuis son aiguillage : le LaTeX est lu sur un champ
  // mathematique, sinon on lit le texte.
  function verifier(ex, champ, ascii) {
    const latex = champ && champ.tagName === 'MATH-FIELD' ? champ.getValue('latex') : '';
    return verifierForme(ex, { latex, ascii: ascii || '' });
  }

  const MoteurReponses = { lire, lireEntree, evaluer, memeValeur, verifier, verifierForme, aide, formes: Object.keys(FORMES) };
  if (typeof module !== 'undefined' && module.exports) module.exports = MoteurReponses;
  else {
    racine.MoteurReponses = MoteurReponses;
  }
})(typeof window !== 'undefined' ? window : globalThis);
