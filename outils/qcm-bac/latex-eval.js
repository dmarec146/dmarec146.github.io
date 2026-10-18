/* Évaluateur LaTeX minimal pour le contrôle des banques « fonctions » (QCM Bac, Terminale).

   Lit le LaTeX AFFICHÉ à l'élève (pas une clé annexe) et le transforme en fonction numérique, de sorte que le contrôle
   recalcule la vérité à partir de ce que l'élève lit réellement.

   Sous-ensemble géré : nombres (virgule décimale « {,} »), constante e, variables d'une lettre, + - \times \cdot,
   multiplication implicite, \dfrac{}{} \frac{}{}, puissances ^{...} ou ^x, e^{...}, \ln(...), \sqrt{...}, \exp(...),
   parenthèses (\left( \right)), \infty dans les intervalles.
   Convention anti-ambiguïté : \ln doit être suivi d'une parenthèse (ou d'une lettre seule non suivie de ^). */
'use strict';

function lexer(src) {
  const s = src.replace(/\\left|\\right/g, '').replace(/\\,|\\;|\\!|\\ |~/g, '').replace(/\{,\}/g, '.').replace(/\\dfrac|\\tfrac/g, '\\frac').replace(/−/g, '-');
  const toks = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '\\') { const mm = /^\\([a-zA-Z]+|.)/.exec(s.slice(i)); toks.push({ t: 'cmd', v: mm[1] }); i += mm[0].length; continue; }
    if (/[0-9.]/.test(c)) { const mm = /^[0-9]*\.?[0-9]+|^[0-9]+/.exec(s.slice(i)); toks.push({ t: 'num', v: Number(mm[0]) }); i += mm[0].length; continue; }
    if (/[a-zA-Z]/.test(c)) { toks.push({ t: 'id', v: c }); i++; continue; }
    toks.push({ t: 'sym', v: c }); i++;
  }
  return toks;
}

function parse(src) {
  const toks = lexer(src); let p = 0;
  const peek = () => toks[p], next = () => toks[p++];
  const isSym = (v) => peek() && peek().t === 'sym' && peek().v === v;
  const isCmd = (v) => peek() && peek().t === 'cmd' && peek().v === v;
  const fail = (m) => { throw new Error('LaTeX non géré (' + m + ') dans : ' + src); };

  function expr() {
    let left = term();
    while (isSym('+') || isSym('-')) { const op = next().v, right = term(); const l = left; left = op === '+' ? (e) => l(e) + right(e) : (e) => l(e) - right(e); }
    return left;
  }
  function startsAtom() {
    const t = peek(); if (!t) return false;
    if (t.t === 'num' || t.t === 'id') return true;
    if (t.t === 'sym') return t.v === '(' || t.v === '{';
    if (t.t === 'cmd') return ['frac', 'ln', 'sqrt', 'exp', 'pi', 'infty', 'cos', 'sin', 'tan'].includes(t.v);
    return false;
  }
  function term() {
    let left = unary();
    for (;;) {
      if (isCmd('times') || isCmd('cdot')) { next(); const r = unary(), l = left; left = (e) => l(e) * r(e); }
      else if (isSym('/')) { next(); const r = unary(), l = left; left = (e) => l(e) / r(e); }
      else if (startsAtom()) { const r = unary(), l = left; left = (e) => l(e) * r(e); }       // multiplication implicite
      else break;
    }
    return left;
  }
  function unary() {
    if (isSym('-')) { next(); const u = unary(); return (e) => -u(e); }
    if (isSym('+')) { next(); return unary(); }
    return power();
  }
  function power() {
    const base = atom();
    if (isSym('^')) {
      next(); const ex = groupOrAtom();
      return (e) => Math.pow(base(e), ex(e));
    }
    return base;
  }
  function groupOrAtom() {
    if (isSym('{')) { next(); const x = expr(); if (!isSym('}')) fail('}'); next(); return x; }
    const t = peek();
    if (t && (t.t === 'num' || t.t === 'id')) { next(); return t.t === 'num' ? () => t.v : varOuE(t.v); }
    if (isSym('-')) { next(); const u = groupOrAtom(); return (e) => -u(e); }
    return atom();
  }
  const varOuE = (nom) => (nom === 'e' ? () => Math.E : (env) => { if (!(nom in env)) throw new Error('variable inconnue ' + nom + ' dans ' + src); return env[nom]; });
  function atom() {
    const t = next();
    if (!t) fail('fin inattendue');
    if (t.t === 'num') return () => t.v;
    if (t.t === 'id') return varOuE(t.v);
    if (t.t === 'sym' && t.v === '(') { const x = expr(); if (!isSym(')')) fail(')'); next(); return x; }
    if (t.t === 'sym' && t.v === '{') { const x = expr(); if (!isSym('}')) fail('}'); next(); return x; }
    if (t.t === 'sym' && t.v === '|') { const x = expr(); if (!isSym('|')) fail('|'); next(); return (e) => Math.abs(x(e)); }
    if (t.t === 'cmd') {
      if (t.v === 'frac') { const a = braced(), b = braced(); return (e) => a(e) / b(e); }
      if (t.v === 'sqrt') { const a = braced(); return (e) => Math.sqrt(a(e)); }
      if (t.v === 'pi') return () => Math.PI;
      if (t.v === 'infty') return () => Infinity;
      if (t.v === 'ln' || t.v === 'exp' || t.v === 'cos' || t.v === 'sin' || t.v === 'tan') {
        let a;
        if (isSym('(')) { next(); a = expr(); if (!isSym(')')) fail(')'); next(); }
        else if (peek() && peek().t === 'id') { const v = next(); a = varOuE(v.v); if (isSym('^')) fail('\\ln ' + v.v + '^… ambigu'); }
        else if (peek() && peek().t === 'num') { const v = next(); a = () => v.v; if (isSym('^')) fail('\\ln n^… ambigu'); }
        else fail('argument de ' + t.v);
        const F = { ln: Math.log, exp: Math.exp, cos: Math.cos, sin: Math.sin, tan: Math.tan }[t.v];
        return (e) => F(a(e));
      }
    }
    fail('jeton ' + JSON.stringify(t));
  }
  function braced() {
    if (!isSym('{')) fail('{ attendu');
    next(); const x = expr(); if (!isSym('}')) fail('} attendu'); next(); return x;
  }
  const f = expr();
  if (p < toks.length) fail('reste ' + JSON.stringify(toks.slice(p, p + 3)));
  return f;
}

// fonction de x (et d'éventuelles autres variables passées dans env)
function fonction(tex) { const f = parse(tex); return (x, env) => f(Object.assign({ x }, env || {})); }
const valeur = (tex, env) => parse(tex)(env || {});

// contenu mathématique d'une option / d'un énoncé : le premier \( … \) ; « f'(x)=… » → partie droite
function mathDe(html, indice) {
  const morceaux = [...html.matchAll(/\\\((.*?)\\\)/gs)].map(x => x[1]);
  return morceaux[indice === undefined ? 0 : indice];
}
function membreDroit(tex) { const i = tex.indexOf('='); return i < 0 ? tex : tex.slice(i + 1); }

// ensembles : intervalles « ]a;b[ », réunions \cup, ensembles finis \{a;b\}
function ensemble(tex) {
  const s = tex.replace(/\\left|\\right/g, '').replace(/\\,|\\;|\\!/g, '').trim();
  const parts = s.split('\\cup').map(x => x.trim());
  const morceaux = [];
  for (const part of parts) {
    let mm;
    if ((mm = /^\\\{(.*)\\\}$/s.exec(part))) { for (const v of mm[1].split(';')) morceaux.push({ pt: valeur(v) }); continue; }
    if ((mm = /^([\[\]])(.*);(.*)([\[\]])$/s.exec(part))) {
      morceaux.push({ lo: valeur(mm[2]), hi: valeur(mm[3]), loFerme: mm[1] === '[', hiFerme: mm[4] === ']' });
      continue;
    }
    if (part === '\\varnothing' || part === '\\emptyset') continue;
    throw new Error('ensemble non géré : ' + part);
  }
  return {
    morceaux,
    contient(x, eps) {
      eps = eps === undefined ? 1e-9 : eps;
      return morceaux.some(M => M.pt !== undefined ? Math.abs(x - M.pt) < eps : ((M.loFerme ? x >= M.lo - eps : x > M.lo + eps) && (M.hiFerme ? x <= M.hi + eps : x < M.hi - eps)));
    },
    bornes() { return morceaux.flatMap(M => M.pt !== undefined ? [M.pt] : [M.lo, M.hi]).filter(Number.isFinite); }
  };
}

// relation « g \ge h » : renvoie { gauche, droite, op }
function relation(tex) {
  const mm = /^(.*?)(\\geqslant|\\leqslant|\\ge|\\le|\\gt|\\lt|>|<)(.*)$/s.exec(tex);
  if (!mm) throw new Error('pas une relation : ' + tex);
  const op = { '\\geqslant': '>=', '\\ge': '>=', '\\leqslant': '<=', '\\le': '<=', '\\gt': '>', '>': '>', '\\lt': '<', '<': '<' }[mm[2]];
  return { gauche: fonction(mm[1]), droite: fonction(mm[3]), op };
}

module.exports = { parse, fonction, valeur, mathDe, membreDroit, ensemble, relation };
