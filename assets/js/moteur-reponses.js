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
        else if (FONCTIONS.has(nom)) jetons.push({ t: 'FUNC', nom });                 // \cos, \sin, \tan, \ln, \exp
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
  // fixes : constantes imposees a certains symboles (ex. {e: Math.E} en Premiere, ou e est le nombre d'Euler)
  function memeValeur(u, a, fixes) {
    const noms = new Set([...symboles(u), ...symboles(a)]);
    if (fixes) Object.keys(fixes).forEach((k) => noms.delete(k));
    let valides = 0;
    for (let essai = 0; essai < 12 && valides < 6; essai++) {
      const portee = Object.assign({}, fixes);
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
        let base, exp = 1, arbre = null;
        if (feuille.t === 'num' && Number.isInteger(feuille.v)) base = feuille.v;
        else if (feuille.t === 'pow') {
          base = entierRelatif(feuille.a);
          if (base === null) return null;
          const e = entierRelatif(feuille.b);
          if (e !== null) exp = e;
          else if (symboles(feuille.b).size > 0 && polynomial(feuille.b)) arbre = feuille.b;   // exposant litteral : 2^(4n+1)
          else return null;
        }
        else return null;
        if (base === 1) continue;                       // 1/5^4 : le 1 ne compte pas
        if (cartes.has(base)) return null;              // base repetee : 7^2*7, ou 7^3/7
        if (arbre) { cartes.set(base, { arbre: cote === 'num' ? arbre : neg(arbre) }); continue; }
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
    for (const [base, e] of la.cartes) {
      if (!lu.cartes.has(base)) return false;
      const eu = lu.cartes.get(base);
      if (typeof e === 'number' && typeof eu === 'number') { if (eu !== e) return false; }
      else {
        const arbre = (x) => (typeof x === 'number' ? num(x) : x.arbre);
        if (!memeValeur(arbre(eu), arbre(e))) return false;
      }
    }
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

  // --- 3.5 simplifie : plus aucune simplification possible (13/10/2026) ---------------------------------
  // Regle generale « Simplifier / Calculer / Reduire » : la reponse doit etre de meme valeur que la reponse
  // attendue ET ne rien contenir qu'on puisse encore simplifier. On cherche donc, dans l'arbre de l'eleve,
  // les motifs REDUCTIBLES ; l'enonce recopie en contient par construction. Motifs :
  //   - operation entre deux nombres (3+4, 2*5, 1/2+1/3) ; fraction non irreductible (6/4) ou de denominateur 1 ;
  //   - racine d'un nombre qui a un facteur carre (sqrt(224), sqrt(81)) ou racine d'une fraction ;
  //   - deux racines multipliees (sqrt(2)*sqrt(3)) ; racine au denominateur (1/sqrt(62)) ;
  //   - deux nombres dans un meme produit (2*9x) ; une meme base deux fois dans un produit (x^2*x, e^3*e^-3) ;
  //   - puissance de puissance, de produit ou de nombre calculable (2^3, (e^-3)^3), exposant 0 ou 1 ;
  //   - termes semblables dans une somme (2x+14-6x-7) ; somme de deux fractions litterales ;
  //   - facteur numerique commun au numerateur et au denominateur ((42x+36)/6).
  // Les options se deduisent de la reponse attendue : si elle contient elle-meme une racine au denominateur,
  // une puissance de nombres ou une somme de fractions litterales, ce motif est permis.
  const chaine = (n) => {
    switch (n.t) {
      case 'num': return String(n.v);
      case 'sym': return n.nom;
      case 'neg': return '(-' + chaine(n.a) + ')';
      case 'sqrt': return 'r(' + chaine(n.a) + ')';
      case 'fn': return n.nom + '(' + chaine(n.a) + ')';
      default: return '(' + chaine(n.a) + ({ add: '+', sub: '-', mul: '*', div: '/', pow: '^' }[n.t]) + chaine(n.b) + ')';
    }
  };
  // nombre pur : ni lettre ni racine ni fonction
  const nombrePur = (n) => {
    if (n.t === 'num') return true;
    if (n.t === 'neg') return nombrePur(n.a);
    if (n.t === 'add' || n.t === 'sub' || n.t === 'mul' || n.t === 'div' || n.t === 'pow') return nombrePur(n.a) && nombrePur(n.b);
    return false;
  };
  const contientNoeud = (n, test) => {
    if (test(n)) return true;
    return ['a', 'b'].some((k) => n[k] && contientNoeud(n[k], test));
  };
  // coefficient entier d'un terme (4x -> 4, -3 -> 3, x -> 1) ; null si non entier / non lisible
  function contenuEntier(terme) {
    const f = aplatir(terme);
    let c = 1;
    for (const x of f.num) if (x.t === 'num') { if (!Number.isInteger(x.v)) return null; c *= Math.abs(x.v) || 1; }
    for (const x of f.den) if (x.t === 'num') { if (!Number.isInteger(x.v)) return null; }
    return c;
  }
  function contenuSomme(n) {
    let g = 0;
    for (const t of termes(n)) {
      const c = contenuEntier(t.noeud);
      if (c === null) return 1;
      g = pgcd(g, c);
    }
    return g || 1;
  }
  function optionsSimplifie(a) {
    return {
      puissanceDeNombres: contientNoeud(a, (n) => n.t === 'pow' && nombrePur(n.a) && nombrePur(n.b)),
      racineDenominateur: contientNoeud(a, (n) => n.t === 'div' && contientNoeud(n.b, (m) => m.t === 'sqrt')),
      sommeDeFractions: contientNoeud(a, (n) => (n.t === 'add' || n.t === 'sub') &&
        termes(n).filter((t) => aplatir(t.noeud).den.some((d) => symboles(d).size > 0)).length > 1)
    };
  }
  function reductible(n, o) {
    // --- nœud par nœud
    if (n.t === 'add' || n.t === 'sub' || n.t === 'mul') {
      if (nombrePur(n.a) && nombrePur(n.b)) return true;               // 3+4, 2*5, 1/2+1/3
    }
    if (n.t === 'div' && nombrePur(n.a) && nombrePur(n.b)) {
      const p = entierRelatif(n.a), q = entierRelatif(n.b);
      if (p === null || q === null || q === 0 || Math.abs(q) === 1 || pgcd(p, q) !== 1) return true;
    }
    if (n.t === 'sqrt') {
      if (nombrePur(n.a)) {
        const v = entierRelatif(n.a);
        if (v === null || v < 2 || !sansCarre(v)) return true;         // sqrt(224), sqrt(81), sqrt(1/4)
      }
    }
    if (n.t === 'pow') {
      if (nombrePur(n.a) && nombrePur(n.b) && !o.puissanceDeNombres) return true;      // 2^3
      if (n.b.t === 'num' && (n.b.v === 0 || n.b.v === 1)) return true;                // x^1, x^0
      if (n.a.t === 'pow' || n.a.t === 'mul' || (n.a.t === 'neg' && !nombrePur(n.a))) return true;   // (e^-3)^3, (2x)^3, (-x)^2
      if (n.a.t === 'div' && !nombrePur(n.a)) return true;                             // (x/y)^2
      // (4-3*sqrt(6))^2 : somme constante (sans lettre) elevee a une puissance entiere => a developper
      if ((n.a.t === 'add' || n.a.t === 'sub') && symboles(n.a).size === 0 && n.b.t === 'num' && n.b.v >= 2) return true;
    }
    // cos(0), sin(7*pi/6), tan(pi/3), |-3| : fonction d'un nombre (ou d'un multiple de pi) => valeur a calculer
    if (n.t === 'fn' && ['cos', 'sin', 'tan', 'abs'].includes(n.nom) && symboles(n.a).size === 0) return true;
    // --- produit / quotient : on regarde la chaine de facteurs une seule fois, a sa racine
    if (n.t === 'mul' || n.t === 'div') {
      const f = aplatir(n);
      const nbNumNum = f.num.filter((x) => nombrePur(x)).length, nbNumDen = f.den.filter((x) => nombrePur(x)).length;
      if (nbNumNum > 1 || nbNumDen > 1) return true;                                    // 2*9x
      if (nbNumNum === 1 && nbNumDen === 1) {
        const p = entierRelatif(f.num.find(nombrePur)), q = entierRelatif(f.den.find(nombrePur));
        if (p === null || q === null || pgcd(p, q) !== 1) return true;
      }
      if (f.num.filter((x) => x.t === 'sqrt').length > 1) return true;                  // sqrt(2)*sqrt(3)
      if (!o.racineDenominateur && f.den.some((x) => contientNoeud(x, (m) => m.t === 'sqrt'))) return true;
      // 6^n / 8^n, 2^n * 3^n : bases numeriques de meme exposant litteral, a regrouper en (a/b)^n
      const exposantsNombres = f.num.concat(f.den).filter((x) => x.t === 'pow' && nombrePur(x.a) && !nombrePur(x.b)).map((x) => chaine(x.b));
      if (new Set(exposantsNombres).size < exposantsNombres.length) return true;
      const cles = new Set();
      for (const x of f.num.concat(f.den)) {
        if (nombrePur(x)) continue;
        const base = x.t === 'pow' ? x.a : x;
        const cle = chaine(base);
        if (cles.has(cle)) return true;                                                 // x^2*x, e^3/e^-2
        cles.add(cle);
      }
      if (n.t === 'div' && f.num.length + f.den.length > 0) {
        // facteur numerique commun entre numerateur et denominateur d'une fraction de sommes
        const gN = (n.a.t === 'add' || n.a.t === 'sub') ? contenuSomme(n.a) : contenuEntier(n.a);
        const gD = (n.b.t === 'add' || n.b.t === 'sub') ? contenuSomme(n.b) : contenuEntier(n.b);
        if (gN && gD && (n.a.t === 'add' || n.a.t === 'sub' || n.b.t === 'add' || n.b.t === 'sub') && pgcd(gN, gD) > 1) return true;
      }
    }
    // --- somme : termes semblables, fractions litterales a reunir
    if (n.t === 'add' || n.t === 'sub') {
      const ts = termes(n);
      const vus = new Set();
      let fractionsLitterales = 0, quotientsDeSommes = 0;
      const basesPuissances = new Set();
      for (const t of ts) {
        const f = aplatir(t.noeud);
        // 3^(n+2) - 3^(n+1) - 3*3^n : plusieurs termes en puissances de la meme base numerique => a factoriser en k*3^n
        const dejaVues = new Set();
        for (const x of f.num.concat(f.den)) {
          if (x.t === 'pow' && nombrePur(x.a) && !nombrePur(x.b)) {
            const b = chaine(x.a);
            if (!dejaVues.has(b)) { dejaVues.add(b); if (basesPuissances.has(b)) return true; }
          }
        }
        dejaVues.forEach((b) => basesPuissances.add(b));
        const reste = f.num.filter((x) => !nombrePur(x)).map((x) => '+' + chaine(x)).concat(f.den.filter((x) => !nombrePur(x)).map((x) => '/' + chaine(x))).sort().join('');
        if (vus.has(reste)) return true;                                                // 2x ... -6x, 3 ... -7, 7√67 ... 9√67
        vus.add(reste);
        if (f.den.some((x) => symboles(x).size > 0)) fractionsLitterales++;
        if (f.den.length && f.num.some((x) => x.t === 'add' || x.t === 'sub')) quotientsDeSommes++;
      }
      if (fractionsLitterales > 1 && !o.sommeDeFractions) return true;
      if (quotientsDeSommes > 1 && !o.sommeDeFractions) return true;                  // (x+3)/3-(x-7)/8 : a reunir
    }
    return ['a', 'b'].some((k) => n[k] && reductible(n[k], o));
  }
  function formeSimplifie(u, a) { return !reductible(u, optionsSimplifie(a)); }

  // --- 3.6 factorise : un produit (au moins un facteur non constant), jamais une somme ---------------------
  // facteurs sommes sans facteur numerique commun (3(24x+15) refuse), pas de facteur 1, un seul facteur
  // numerique (sauf s'il y a deux facteurs non constants ou plus : un scalaire peut rester dans une parenthese), au moins
// autant de facteurs non constants que la reponse attendue, rien de reductible a l'interieur.
  function facteursNonConstants(n) {
    const f = aplatir(n);
    let k = 0;
    for (const x of f.num.concat(f.den)) {
      if (nombrePur(x)) continue;
      if (x.t === 'pow' && x.b.t === 'num' && Number.isInteger(x.b.v) && x.b.v >= 2) k += x.b.v; else k++;
    }
    return k;
  }
  function formeFactorise(u, a) {
    let n = u;
    while (n.t === 'neg') n = n.a;
    if (n.t === 'add' || n.t === 'sub') return false;                    // une somme n'est pas factorisee
    const f = aplatir(n);
    if (f.den.length) return false;
    const facteurs = f.num.map((x) => (x.t === 'pow' && (x.a.t === 'add' || x.a.t === 'sub')) ? x.a : x);
    if (facteurs.filter(nombrePur).length > 1) return false;
    if (facteurs.some((x) => x.t === 'num' && (x.v === 1 || x.v === 0))) return false;      // 1*(...)
    // facteur numerique commun reste dans une parenthese : refuse quand extraire ce facteur est l'objet de l'exercice
    // (reponse attendue a un seul facteur non constant : 9(8x+5)), tolere quand la reponse attendue a au moins deux
    // facteurs non constants ((x+6)(9x+9) accepte pour 9(x+6)(x+1)) ; une factorisation en x manquante reste refusee
    if (facteursNonConstants(a) < 2) for (const x of facteurs) if ((x.t === 'add' || x.t === 'sub') && contenuSomme(x) > 1) return false;
    if (facteursNonConstants(n) < facteursNonConstants(a)) return false;
    if (f.num.length < 2 && !(f.num.length === 1 && f.num[0].t === 'pow' && (f.num[0].a.t === 'add' || f.num[0].a.t === 'sub'))) return false;
    return !reductible(u, optionsSimplifie(a));
  }

  // --- 3.7 decimal : un nombre ecrit en notation decimale (0,0072, -3,5, 12), ni fraction ni puissance de 10 ---
  function formeDecimal(u) {
    let n = u;
    while (n.t === 'neg') n = n.a;
    return n.t === 'num';
  }

  const FORMES = { puissance: formePuissance, monome: formeMonome, developpe: formeDeveloppe, canonique: formeCanonique,
    simplifie: formeSimplifie, factorise: formeFactorise, decimal: formeDecimal };

  // =====================================================================================================
  // 4. API
  // =====================================================================================================
  // entree : {latex, ascii}. Renvoie l'arbre, ou null si illisible.
  function lireEntree(entree) {
    const essais = [];
    if (entree.latex) essais.push([entree.latex, true]);
    if (entree.ascii) essais.push([entree.ascii, false]);
    for (const [src, latex] of essais) {
      // « x = -5 », « f(6) = -29 » : seule la valeur compte (le membre de gauche est ignore)
      const sansNom = String(src).replace(/^\s*[A-Za-z]\s*(\([^()]*\))?\s*=\s*/, '');
      try { return lire(sansNom, latex); } catch (e) { /* essai suivant */ }
    }
    return null;
  }

  // ex : exercice ({forme, formeOptions, reponse}) ; entree : {latex, ascii}
  function verifierForme(ex, entree) {
    const forme = FORMES[ex.forme];
    if (!forme) throw new Error('forme inconnue : ' + ex.forme);
    let a;
    try { a = lire(ex.reponse, false); } catch (e) { return null; }          // reponse attendue illisible : la fiche se rabat sur la valeur
    const u = lireEntree(entree);
    if (!u) return false;
    const fixes = ex.formeOptions && ex.formeOptions.euler ? { e: Math.E } : null;
    return memeValeur(u, a, fixes) && forme(u, a, ex.formeOptions || {});
  }

  const AIDES = {
    puissance: (o) => 'La réponse doit être écrite avec des <strong>puissances</strong> : par exemple <code>7^4</code> (et non le nombre calculé <code>2401</code>)'
      + (o.fraction ? ', ou une fraction comme <code>1/5^4</code> quand il y a un exposant négatif à supprimer' : ', ou <code>2^3*5</code> s’il y a plusieurs bases')
      + '. Chaque base ne doit apparaître qu’une fois, avec un exposant entier positif.',
    monome: () => 'La réponse doit être <strong>un seul terme simplifié</strong> : le coefficient une seule fois, puis chaque lettre une seule fois avec son exposant, par exemple <code>18x^2</code> ou <code>3*2^n</code> ; pas de parenthèse ni de somme à réduire.',
    developpe: () => 'La réponse doit être la <strong>forme développée et réduite</strong> : une somme de termes de la forme <code>ax^k</code>, un seul terme par puissance de x, sans parenthèse à développer. Une forme factorisée ou canonique n’est pas acceptée, même si elle est égale.',
    simplifie: () => 'La réponse doit être <strong>entièrement simplifiée</strong> : plus aucun calcul à faire (pas de <code>3+4</code>, de fraction réductible, de racine <code>√8</code> à simplifier, de termes semblables à regrouper, de même base écrite deux fois). Recopier l’énoncé n’est pas accepté.',
    decimal: () => 'La réponse doit être écrite en <strong>notation décimale</strong> (par exemple <code>0,0072</code>), pas sous forme de fraction ni de puissance de 10.',
    factorise: () => 'La réponse doit être <strong>un produit</strong> (par exemple <code>9(8x+5)</code> ou <code>(x-4)(x+4)</code>) : factoriser complètement. Quand il n’y a qu’un seul facteur non constant, extraire entièrement le facteur numérique commun (<code>9(8x+5)</code> et non <code>3(24x+15)</code>). Une somme, même égale, n’est pas acceptée.',
    canonique: () => 'La réponse doit être écrite sous la <strong>forme canonique</strong> <code>a(x-α)^2+β</code> : x n’apparaît qu’une seule fois, dans une parenthèse élevée au carré (par exemple <code>2(x-4)^2+6</code>). La forme développée n’est pas acceptée, même si elle est égale.'
  };
  function aide(ex) { return (AIDES[ex.forme] || (() => ''))(ex.formeOptions || {}); }

  // La fiche appelle verifier(ex, champ, valeurAscii) depuis son aiguillage : le LaTeX est lu sur un champ
  // mathematique, sinon on lit le texte.
  // repli (facultatif) : fonction appelee si la reponse attendue est illisible par le moteur (la fiche se rabat
  // alors sur sa verification par valeur) ; sans repli, une reponse attendue illisible fait refuser la saisie.
  function verifier(ex, champ, ascii, repli) {
    const latex = champ && champ.tagName === 'MATH-FIELD' ? champ.getValue('latex') : '';
    const r = verifierForme(ex, { latex, ascii: ascii || '' });
    if (r === null) return repli ? repli() : false;
    return r;
  }
  // true si le moteur sait lire la reponse attendue (controle de l'audit)
  function referenceLisible(ex) { try { lire(ex.reponse, false); return true; } catch (e) { return false; } }

  const MoteurReponses = { lire, lireEntree, evaluer, memeValeur, verifier, verifierForme, referenceLisible, aide, formes: Object.keys(FORMES) };
  if (typeof module !== 'undefined' && module.exports) module.exports = MoteurReponses;
  else {
    racine.MoteurReponses = MoteurReponses;
  }
})(typeof window !== 'undefined' ? window : globalThis);
