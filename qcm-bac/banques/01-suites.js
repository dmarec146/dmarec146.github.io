/* Banque 01 — Suites (Terminale spécialité)
   Questions à quatre choix inspirées des affirmations « vrai ou faux, justifier » des sujets de bac 2024 à 2026 :
   l'affirmation devient la question à laquelle sa justification répond, les trois mauvaises réponses reprennent
   des erreurs classiques (voir outils/qcm-bac/pilote-suites.md).

   Niveau 1 — les bases : limite de q^n, nature simple d'une suite, sens de variation de a q^n, premiers termes
              d'une suite arithmético-géométrique, oscillation évidente.
   Niveau 2 — l'épreuve : les questions des sujets (gendarmes, suite définie par inversion, variations d'une
              suite récurrente, a q^n + b, suite arithmético-géométrique, croissante majorée).
   Niveau 3 — plus difficile (pénalités) : cas de vraie divergence, limites en cascade, expressions explicites,
              suites adjacentes, valeur de la limite d'une suite récurrente.

   Chaque question porte, dans l'objet brut renvoyé par le générateur (champ `meta`), de quoi la recalculer
   indépendamment : outils/qcm-bac/controle-banques.js. La `cle` d'une option est son affirmation en clair
   (« lim:3 », « inf », « ar:2 », « f:… ») : le contrôle la lit et la vérifie sur les premiers termes. */
(function () {
  'use strict';
  const O = Automatismes.outils;
  const { alea, aleaParmi, melanger, pgcd, m, qcm, famille, fracL, decL, dec } = O;
  const T = String.raw;

  const opt = (aff, cle) => ({ affichage: aff, cle: cle });
  const unique = (liste, aeviter) => {          // premiers éléments distincts (par clé) et différents de `aeviter`
    const vus = new Set(aeviter.map(String)), res = [];
    for (const x of liste) { const k = String(x.cle); if (!vus.has(k)) { vus.add(k); res.push(x); } }
    return res;
  };
  const sgn = n => (n < 0 ? '-' : '+') + Math.abs(n);              // « +3 », « -3 »
  const dc = x => ({ n: Math.round(x * 100), d: 100, v: x, tex: decL(x), cle: String(x) });     // décimal affiché en écriture décimale
  const rat = (n, d) => { const g = pgcd(n, d); if (d < 0) { n = -n; d = -d; } n /= g; d /= g; return { n, d, v: n / d, tex: fracL(n, d), cle: d === 1 ? String(n) : n + '/' + d }; };
  const coef = c => (c === 1 ? '' : c === -1 ? '-' : String(c));      // coefficient devant une lettre
  // q^expo : parenthèses (\left\right) autour d'une fraction ou d'un négatif
  const puiss = (qd, expo) => (qd.d === 1 && qd.v > 0 ? `${qd.n}^{${expo}}` : T`\left(${qd.tex}\right)^{${expo}}`);
  const fois = (a, rest) => (a === 1 ? rest : a === -1 ? '-' + rest : `${a}\\times ${rest}`);   // a × rest, sans coefficient 1

  // ---------- options réutilisables ----------
  const LIM = x => opt(`elle converge vers ${m(String(x))}`, 'lim:' + x);
  const DIV = what => opt(`elle diverge, car ${m(what)} n'a pas de limite`, 'div');
  const PINF = () => opt(`elle tend vers ${m(T`+\infty`)}`, 'inf');
  const MINF = () => opt(`elle tend vers ${m(T`-\infty`)}`, '-inf');
  const AR = r => opt(`arithmétique de raison ${m(r.tex)}`, 'ar:' + r.cle);
  const GE = q => opt(`géométrique de raison ${m(q.tex)}`, 'ge:' + q.cle);
  const AREXP = (tex, cle) => opt(`arithmétique de raison ${m(tex)}`, 'ar:' + cle);
  const GEEXP = (tex, cle) => opt(`géométrique de raison ${m(tex)}`, 'ge:' + cle);
  const NI = () => opt('ni arithmétique ni géométrique', 'none');

  // ==========================================================================
  // 1. Limite d'une suite avec (-1)^n (Amérique du Sud 2024, exo 3, affirmation 1)
  // ==========================================================================
  function oscillanteN1() {
    const forme = aleaParmi(['alt', 'alt', 'cos', 'sin', 'carre']);
    const k = aleaParmi([1, 1, 2, 3, 4, 5]), c = aleaParmi([0, 0, 1, 2, 3, 4, 5, 6]);
    let num, den, u;
    if (forme === 'cos' || forme === 'sin') {
      const nom = forme === 'cos' ? T`\cos(n)` : T`\sin(n)`, f = forme === 'cos' ? Math.cos : Math.sin;
      num = k === 1 ? nom : T`${k}${nom}`; den = c === 0 ? 'n' : `n+${c}`;
      u = n => k * f(n) / (n + c);
    } else if (forme === 'carre') {
      num = k === 1 ? T`(-1)^n` : T`${k}(-1)^n`; den = c === 0 ? 'n^2' : `n^2+${c}`;
      u = n => k * Math.pow(-1, n) / (n * n + c);
    } else {
      num = k === 1 ? T`(-1)^n` : T`${k}(-1)^n`; den = c === 0 ? 'n' : `n+${c}`;
      u = n => k * Math.pow(-1, n) / (n + c);
    }
    const osc = forme === 'cos' ? T`\cos(n)` : forme === 'sin' ? T`\sin(n)` : T`(-1)^n`;
    return qcm(
      `Que peut-on dire de la suite ${m('(u_n)')} définie pour tout entier ${m(T`n\ge 1`)} par ${m(T`u_n=\dfrac{${num}}{${den}}`)} ?`,
      LIM(0), [DIV(osc), LIM(k), PINF(), LIM(-k)],
      { explication: `${m(T`|u_n|\le \dfrac{${k}}{${den}}`)}, donc ${m('(u_n)')} converge vers ${m('0')} (théorème des gendarmes) : le facteur ${m(osc)} oscille mais reste borné, il ne change pas la limite.`,
        meta: { u, n0: 1 } });
  }
  function oscillanteN2() {
    const cos = Math.random() < 0.4;
    const a = alea(10, 60), b = aleaParmi([1, 2, 3, 4]), c = aleaParmi([0, 0, 0, 1, 2, 3]);
    const osc = cos ? T`\cos(n)` : T`(-1)^n`;
    const num = b === 1 ? `${a}+${osc}` : `${a}+${b}${osc}`;
    const den = c === 0 ? 'n' : `n+${c}`;
    return qcm(
      `Que peut-on dire de la suite ${m('(u_n)')} définie pour tout entier ${m(T`n\ge 1`)} par ${m(T`u_n=\dfrac{${num}}{${den}}`)} ?`,
      LIM(0), [DIV(osc), PINF(), LIM(a)],
      { explication: `${m(T`|u_n|\le \dfrac{${a + b}}{${den}}`)} : ${m('(u_n)')} converge vers ${m('0')} (gendarmes). Le numérateur reste compris entre ${m(String(a - b))} et ${m(String(a + b))} mais le dénominateur tend vers ${m(T`+\infty`)}.`,
        meta: { u: cos ? (n => (a + b * Math.cos(n)) / (n + c)) : (n => (a + b * Math.pow(-1, n)) / (n + c)), n0: 1 } });
  }
  function oscillanteN3a() {        // (-1)^n p + q/n : deux valeurs d'adhérence
    const p = aleaParmi([1, 2, 3]), q = alea(2, 9);
    const f = p === 1 ? '' : String(p);
    return qcm(
      `Que peut-on dire de la suite ${m('(u_n)')} définie pour tout entier ${m(T`n\ge 1`)} par ${m(T`u_n=${f}(-1)^n+\dfrac{${q}}{n}`)} ?`,
      opt(`elle diverge, car les termes de rang pair et ceux de rang impair ont des limites différentes (${m(String(p))} et ${m(String(-p))})`, 'div'),
      [LIM(0), LIM(p), PINF()],
      { explication: `Pour ${m('n')} pair, ${m('u_n')} tend vers ${m(String(p))} ; pour ${m('n')} impair, vers ${m(String(-p))} : ${m('(u_n)')} n'a pas de limite.`,
        meta: { u: n => p * Math.pow(-1, n) + q / n, n0: 1 } });
  }
  function oscillanteN3b() {        // n + k(-1)^n : tend vers +infini
    const k = alea(2, 6);
    return qcm(
      `Que peut-on dire de la suite ${m('(u_n)')} définie pour tout entier naturel ${m('n')} par ${m(T`u_n=n+${k}(-1)^n`)} ?`,
      PINF(), [opt(`elle n'a pas de limite, car ${m('(-1)^n')} oscille`, 'nolim'), LIM(k), LIM(0)],
      { explication: `${m(T`u_n\ge n-${k}`)} et ${m(T`n-${k}`)} tend vers ${m(T`+\infty`)} : par comparaison, ${m('(u_n)')} tend vers ${m(T`+\infty`)}.`,
        meta: { u: n => n + k * Math.pow(-1, n), n0: 0 } });
  }
  function oscillanteN3c() {        // ((-1)^n n + a)/(n^2+1) -> 0
    const a = alea(2, 9);
    return qcm(
      `Que peut-on dire de la suite ${m('(u_n)')} définie pour tout entier naturel ${m('n')} par ${m(T`u_n=\dfrac{(-1)^n n+${a}}{n^2+1}`)} ?`,
      LIM(0), [DIV(T`(-1)^n n`), LIM(1), PINF()],
      { explication: `${m(T`|u_n|\le \dfrac{n+${a}}{n^2+1}`)} et ce quotient tend vers ${m('0')} : ${m('(u_n)')} converge vers ${m('0')} (gendarmes).`,
        meta: { u: n => (Math.pow(-1, n) * n + a) / (n * n + 1), n0: 0 } });
  }

  // ==========================================================================
  // 2. Nature d'une suite
  // ==========================================================================
  const QNATURE = u => `Quelle est la nature de la suite ${m('(u_n)')} ${u} ?`;
  function natureN1() {
    const type = aleaParmi(['ar', 'ge', 'none']);
    if (type === 'ar') {
      const p = alea(-4, 9), r = aleaParmi([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7]);
      const def = Math.random() < 0.5
        ? `définie pour tout entier naturel ${m('n')} par ${m(T`u_n=${p}${sgn(r)}n`)}`
        : `définie par ${m(T`u_0=${p}`)} et, pour tout entier naturel ${m('n')}, ${m(T`u_{n+1}=u_n${sgn(r)}`)}`;
      const raison = rat(r, 1), prem = rat(p, 1);
      return qcm(QNATURE(def), AR(raison), [GE(raison), p === r ? NI() : AR(prem), NI(), GE(prem)],
        { explication: `${m(T`u_{n+1}-u_n=${r}`)} pour tout ${m('n')} : suite arithmétique de raison ${m(String(r))}.`,
          meta: { u: n => p + r * n, n0: 0 } });
    }
    if (type === 'ge') {
      const a = aleaParmi([1, 2, 3, 4, 5, -2, -3]), qd = aleaParmi([rat(2, 1), rat(3, 1), rat(4, 1), rat(1, 2), rat(1, 3), rat(-2, 1), rat(-3, 1), rat(2, 3)]);
      const def = Math.random() < 0.5
        ? `définie pour tout entier naturel ${m('n')} par ${m(T`u_n=${fois(a, puiss(qd, 'n'))}`)}`
        : `définie par ${m(T`u_0=${a}`)} et, pour tout entier naturel ${m('n')}, ${m(T`u_{n+1}=${qd.d !== 1 || qd.v < 0 ? T`\left(${qd.tex}\right)` : qd.tex}\,u_n`)}`;
      const premier = rat(a, 1);
      return qcm(QNATURE(def), GE(qd), [AR(qd), a === qd.v ? NI() : GE(premier), NI(), AR(premier), AR(rat(2, 1))],
        { explication: `${m(T`u_{n+1}=${qd.tex}\,u_n`)} pour tout ${m('n')} : suite géométrique de raison ${m(qd.tex)}.`,
          meta: { u: n => a * Math.pow(qd.v, n), n0: 0 } });
    }
    const c = alea(-5, 5), k = aleaParmi([1, 1, 2, 3]);
    return qcm(QNATURE(`définie pour tout entier naturel ${m('n')} par ${m(T`u_n=${k === 1 ? '' : k}n^2${c === 0 ? '' : sgn(c)}`)}`),
      NI(), [AREXP('2', '2'), GEEXP('2', '2'), AREXP(String(c === 0 ? 1 : c), String(c === 0 ? 1 : c)), GEEXP(String(k + 1), String(k + 1)), AREXP('3', '3'), GEEXP('3', '3')],
      { explication: `${m(T`u_{n+1}-u_n=${k}(2n+1)`)} dépend de ${m('n')}, et le quotient ${m(T`\dfrac{u_{n+1}}{u_n}`)} aussi : ni arithmétique ni géométrique.`,
        meta: { u: n => k * n * n + c, n0: 0 } });
  }
  function natureInversion() {      // Amérique du Sud 2024, exo 3, affirmation 2
    const a = aleaParmi([1, 1, 2, 3, 4, 5]), c = aleaParmi([1, 1, 2, 3, 4, 5]);
    const kNum = Math.random() < 0.5 ? null : alea(2, 7);       // k littéral (comme au bac) ou nombre
    const ks = kNum === null ? 'k' : String(kNum);
    const rc = kNum === null ? (c === 1 ? 'k' : `${c}k`) : String(kNum * c);
    const rcCle = kNum === null ? `k*${c}` : String(kNum * c);
    const w = `${m(T`w_0=${a}`)} et, pour tout entier naturel ${m('n')}, ${m(T`w_{n+1}=\dfrac{w_n}{1+${c === 1 ? '' : c}w_n}`)}`;
    const k0 = kNum === null ? `Soit ${m('k')} un réel strictement positif et ` : 'On pose ';
    const dist = kNum === null
      ? [GEEXP(rc, rcCle), AREXP(String(c), String(c)), NI(), c === 1 ? AREXP(T`\dfrac{1}{k}`, '1/k') : AREXP('k', 'k')]
      : [GEEXP(rc, rcCle), AREXP(String(c), String(c)), NI(), AREXP(String(kNum), String(kNum)), AREXP(String(kNum + c), String(kNum + c))];
    return qcm(
      `On pose ${w}. On admet que ${m(T`w_n>0`)} pour tout ${m('n')}. ${k0}${m(T`t_n=\dfrac{${ks}}{w_n}`)}. Quelle est la nature de la suite ${m('(t_n)')} ?`,
      AREXP(rc, rcCle), dist,
      { explication: `${m(T`\dfrac{1}{w_{n+1}}=\dfrac{1+${c === 1 ? '' : c}w_n}{w_n}=\dfrac{1}{w_n}+${c}`)}, donc ${m(T`t_{n+1}=t_n+${rc}`)} : suite arithmétique de raison ${m(rc)}.`,
        meta: { w0: a, c, k: kNum } });
  }
  function natureExpression() {     // N3 : expression de w_n
    const a = aleaParmi([2, 3, 4]), c = aleaParmi([1, 2, 3]);
    const cn = c === 1 ? 'n' : `${c}n`;
    const bonne = opt(m(T`w_n=\dfrac{${a}}{1+${a * c}n}`), `f:${a}/(1+${a * c}*n)`);
    return qcm(
      `On pose ${m(T`w_0=${a}`)} et, pour tout entier naturel ${m('n')}, ${m(T`w_{n+1}=\dfrac{w_n}{1+${c === 1 ? '' : c}w_n}`)}. On admet que ${m(T`w_n>0`)} pour tout ${m('n')}. Quelle est l'expression de ${m('w_n')} en fonction de ${m('n')} ?`,
      bonne,
      [opt(m(T`w_n=\dfrac{1}{${a}+${cn}}`), `f:1/(${a}+${c}*n)`), opt(m(T`w_n=\dfrac{${a}}{1+${cn}}`), `f:${a}/(1+${c}*n)`), opt(m(T`w_n=\dfrac{${a}}{(1+${c})^n}`), `f:${a}/Math.pow(1+${c},n)`)],
      { explication: `${m(T`\dfrac{1}{w_{n+1}}=\dfrac{1}{w_n}+${c}`)} : ${m(T`\dfrac{1}{w_n}`)} est arithmétique de premier terme ${m(T`\dfrac{1}{${a}}`)} et de raison ${m(String(c))}, donc ${m(T`\dfrac{1}{w_n}=\dfrac{1}{${a}}+${cn}=\dfrac{1+${a * c}n}{${a}}`)}.`,
        meta: { w0: a, c } });
  }
  function natureDecalage() {       // N3 : a q^n + b
    const a = aleaParmi([2, 3, 4, 5, -2, -3]), b = aleaParmi([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]), qd = aleaParmi([rat(2, 1), rat(3, 1), rat(1, 2), rat(-2, 1), rat(3, 2)]);
    const raisonArTex = rat(a * (qd.n - qd.d), qd.d);       // a(q-1), en fraction exacte
    return qcm(
      QNATURE(`définie pour tout entier naturel ${m('n')} par ${m(T`u_n=${a}\times ${puiss(qd, 'n')}${sgn(b)}`)}`),
      NI(), [GE(qd), AR(qd), AREXP(raisonArTex.tex, raisonArTex.cle), GE(rat(a, 1)), GE(rat(b, 1))],
      { explication: `Le terme constant ${m(String(b))} empêche d'être géométrique, et ${m(T`u_{n+1}-u_n=${a}\times ${puiss(qd, 'n')}(${qd.tex}-1)`)} dépend de ${m('n')} : ni arithmétique ni géométrique.`,
        meta: { u: n => a * Math.pow(qd.v, n) + b, n0: 0 } });
  }

  // ==========================================================================
  // 3. Sens de variation, suites récurrentes u_{n+1} = f(u_n)
  // ==========================================================================
  function sensN1() {
    const forme = aleaParmi(['aq', 'aq', 'ratio', 'alt']);
    const SENS = { inc: opt('elle est croissante', 'inc'), dec: opt('elle est décroissante', 'dec'), const: opt('elle est constante', 'const'), nomono: opt('elle n\'est ni croissante ni décroissante', 'nomono') };
    const question = u => `Quel est le sens de variation de la suite ${m('(u_n)')} définie pour tout entier naturel ${m('n')} par ${m(u)} ?`;
    if (forme === 'ratio') {
      let c, d; do { c = alea(0, 9); d = alea(1, 6); } while (c === d);
      const croit = d > c, e = x => (x === 0 ? 'n' : `n+${x}`);
      return qcm(question(T`u_n=\dfrac{${e(c)}}{${e(d)}}`),
        croit ? SENS.inc : SENS.dec, [croit ? SENS.dec : SENS.inc, SENS.const, SENS.nomono],
        { explication: `${m(T`u_{n+1}-u_n=\dfrac{n+1+${c}}{n+1+${d}}-\dfrac{n+${c}}{n+${d}}=\dfrac{${d - c}}{(n+${d})(n+${d + 1})}`)} est ${croit ? 'positif' : 'négatif'}, donc la suite est ${croit ? 'croissante' : 'décroissante'}.`,
        meta: { u: n => (n + c) / (n + d), n0: 0 } });
    }
    if (forme === 'alt') {
      const a = aleaParmi([1, 2, 3, -1, -2, 5]), qd = aleaParmi([rat(-2, 1), rat(-3, 1), rat(-1, 2), rat(-1, 3), rat(-3, 2), rat(-2, 3)]);
      return qcm(question(T`u_n=${fois(a, puiss(qd, 'n'))}`),
        SENS.nomono, [SENS.inc, SENS.dec, SENS.const],
        { explication: `La raison ${m(qd.tex)} est négative : les termes sont alternativement positifs et négatifs, la suite n'est ni croissante ni décroissante.`,
          meta: { u: n => a * Math.pow(qd.v, n), n0: 0 } });
    }
    const a = aleaParmi([1, 2, 3, 4, 5, -1, -2, -3]), qd = aleaParmi([rat(2, 1), rat(3, 1), rat(3, 2), rat(1, 2), rat(1, 3), rat(2, 3), rat(4, 1), rat(5, 4), rat(3, 4)]);
    const croit = (a > 0) === (qd.v > 1);
    return qcm(question(T`u_n=${fois(a, puiss(qd, 'n'))}`),
      croit ? SENS.inc : SENS.dec, [croit ? SENS.dec : SENS.inc, SENS.const, SENS.nomono],
      { explication: `${m(T`u_{n+1}-u_n=${fois(a, puiss(qd, 'n'))}(${qd.tex}-1)`)} : le signe dépend de ${m(String(a))} (${a > 0 ? 'positif' : 'négatif'}) et de ${m(T`${qd.tex}-1`)} (${qd.v > 1 ? 'positif' : 'négatif'}).`,
        meta: { u: n => a * Math.pow(qd.v, n), n0: 0 } });
  }
  const RECURR = {
    ln:   { f: T`\ln(1+x)`, ff: x => Math.log(1 + x), admet: true, sens: () => 'decconv' },
    inv:  { f: T`\dfrac{x}{1+x}`, ff: x => x / (1 + x), admet: true, sens: () => 'decconv' },
    rac:  { f: T`\sqrt{x}`, ff: x => Math.sqrt(x), admet: false, sens: v0 => (v0 > 1 ? 'decconv' : 'incconv') },
    exp:  { f: T`e^{x}-1`, ff: x => Math.exp(x) - 1, admet: true, sens: () => 'incinf' },
    rac2: { f: T`\sqrt{x+2}`, ff: x => Math.sqrt(x + 2), admet: false, sens: v0 => (v0 > 2 ? 'decconv' : 'incconv') },
    heron: { f: T`\dfrac{x^2+2}{2x}`, ff: x => (x * x + 2) / (2 * x), admet: true, sens: () => 'decconv' },
    mob:  { f: T`\dfrac{2x+3}{x+2}`, ff: x => (2 * x + 3) / (x + 2), admet: true, sens: v0 => (v0 < Math.sqrt(3) ? 'incconv' : 'decconv') }
  };
  const REP = {
    incconv: opt('elle est croissante et majorée, donc elle converge', 'incconv'),
    incinf: opt(`elle est croissante et non majorée, donc elle tend vers ${m(T`+\infty`)}`, 'incinf'),
    decconv: opt('elle est décroissante et minorée, donc elle converge', 'decconv'),
    decinf: opt(`elle est décroissante, donc elle tend vers ${m(T`-\infty`)}`, 'decinf')
  };
  function recurrenteN2() {         // Amérique du Sud 2024, exo 3, affirmation 3
    const id = aleaParmi(['ln', 'inv', 'rac', 'exp', 'rac2', 'heron', 'mob']);
    const R = RECURR[id], L = aleaParmi(['v', 'v', 'u', 'w', 's', 't']);
    let v0, v0tex;
    if (id === 'rac') { const d = aleaParmi([rat(1, 4), rat(1, 9), rat(1, 16), rat(1, 2), rat(1, 3), rat(2, 1), rat(3, 1), rat(4, 1), rat(5, 1), rat(9, 1), rat(16, 1)]); v0 = d.v; v0tex = d.tex; }
    else if (id === 'rac2') { v0 = aleaParmi([0, 1, 3, 4, 5, 6, 7, 10]); v0tex = String(v0); }
    else if (id === 'heron') { v0 = aleaParmi([2, 3, 4, 5, 6, 7, 8, 9]); v0tex = String(v0); }
    else if (id === 'mob') { v0 = aleaParmi([0, 1, 3, 4, 5, 6, 7, 8, 9]); v0tex = String(v0); }
    else { v0 = aleaParmi([1, 2, 3, 4, 5, 6, 7, 8]); v0tex = String(v0); }
    const vrai = R.sens(v0);
    const ordre = ['incconv', 'incinf', 'decconv', 'decinf'];
    return qcm(
      `On pose ${m(`${L}_0=${v0tex}`)} et, pour tout entier naturel ${m('n')}, ${m(`${L}_{n+1}=${R.f.replace(/x/g, L + '_n')}`)}.${R.admet ? ` On admet que ${m(`${L}_n>0`)} pour tout ${m('n')}.` : ''} Quelle affirmation sur la suite ${m(`(${L}_n)`)} est correcte ?`,
      REP[vrai], ordre.filter(c => c !== vrai).map(c => REP[c]),
      { explication: `Le signe de ${m(T`f(x)-x`)} donne le sens de variation, puis le théorème de convergence monotone conclut (une suite croissante majorée, ou décroissante minorée, converge).`,
        meta: { id, v0, vrai } });
  }
  function recurrenteLimite() {     // N3 : v_{n+1} = sqrt(v_n + k), limite j avec k = j(j-1)
    const j = aleaParmi([3, 4, 5]), k = j * (j - 1), v0 = aleaParmi([0, 1, 2, j + 3, j + 5]);
    return qcm(
      `On pose ${m(T`v_0=${v0}`)} et, pour tout entier naturel ${m('n')}, ${m(T`v_{n+1}=\sqrt{v_n+${k}}`)}. On admet que la suite ${m('(v_n)')} converge. Quelle est sa limite ?`,
      LIM(j), [LIM(1 - j), LIM(k), PINF()],
      { explication: `La limite ${m(T`\ell`)} vérifie ${m(T`\ell=\sqrt{\ell+${k}}`)}, donc ${m(T`\ell\ge 0`)} et ${m(T`\ell^2-\ell-${k}=0`)}, soit ${m(T`\ell=${j}`)} ou ${m(T`\ell=${1 - j}`)} ; seule la valeur positive convient.`,
        meta: { u: null, rec: x => Math.sqrt(x + k), v0, n0: 0 } });
  }
  function recurrenteCarre() {      // N3 : u_{n+1} = u_n^2
    const d = aleaParmi([rat(1, 2), rat(1, 3), rat(2, 3), rat(3, 2), rat(2, 1), rat(3, 1)]);
    const verite = d.v < 1 ? LIM(0) : PINF();
    return qcm(
      `On pose ${m(T`u_0=${d.tex}`)} et, pour tout entier naturel ${m('n')}, ${m(T`u_{n+1}=u_n^2`)}. Que peut-on dire de la suite ${m('(u_n)')} ?`,
      verite, [d.v < 1 ? PINF() : LIM(0), LIM(1), LIM(d.tex === String(d.n) ? d.n : d.v)].map(o => o).filter(o => o.cle !== verite.cle),
      { explication: d.v < 1 ? `${m(T`0\lt u_0\lt 1`)} : la suite est décroissante, minorée par ${m('0')}, et sa limite ${m(T`\ell`)} vérifie ${m(T`\ell=\ell^2`)} ; comme ${m(T`\ell<1`)}, ${m(T`\ell=0`)}.` : `${m(T`u_0>1`)} : la suite est croissante ; elle ne peut converger vers ${m('1')} (${m(T`\ell=\ell^2`)} donnerait ${m(T`\ell\in\{0,1\}`)}, impossible pour des termes supérieurs à ${m(T`u_0`)}), donc elle tend vers ${m(T`+\infty`)}.`,
        meta: { u: null, rec: x => x * x, v0: d.v, n0: 0 } });
  }

  // ==========================================================================
  // 4. Théorème des gendarmes (Métropole 2024, exo 1, affirmations 3 et 4)
  // ==========================================================================
  const NOMS3 = [['u', 'v', 'w'], ['a', 'b', 'c'], ['s', 't', 'r'], ['x', 'y', 'z']];
  function gendarmesN2() {
    const [x, y, z] = aleaParmi(NOMS3), X = m(`(${x}_n)`), Y = m(`(${y}_n)`), Z = m(`(${z}_n)`);
    const egal = Math.random() < 0.3;
    let l1, l2;
    if (egal) { l1 = l2 = aleaParmi([-3, -2, -1, 1, 2, 3, 4, 5, 6, -4]); }
    else { l1 = alea(-6, 4); l2 = l1 + alea(1, 6); }
    const cadre = `Soit ${X}, ${Y} et ${Z} trois suites telles que, pour tout entier naturel ${m('n')}, ${m(`${x}_n\\le ${y}_n\\le ${z}_n`)}. La suite ${X} converge vers ${m(String(l1))} et la suite ${Z} converge vers ${m(String(l2))}.`;
    if (egal) {
      return qcm(`${cadre} Que peut-on affirmer sur ${Y} ?`,
        LIM(l1), [opt('on ne peut pas conclure sur sa convergence', 'rien'), LIM(0), opt('elle diverge', 'div')],
        { explication: `${X} et ${Z} ont la même limite ${m(String(l1))} : par le théorème des gendarmes, ${Y} converge vers ${m(String(l1))}.`, meta: { l1, l2, egal } });
    }
    const mil = rat(l1 + l2, 2);
    return qcm(`${cadre} Que peut-on affirmer sur ${Y} ?`,
      opt('on ne peut pas conclure sur sa convergence', 'rien'),
      [opt(`elle converge vers ${m(mil.tex)}`, 'lim:' + mil.cle), opt(`elle converge vers un réel de l'intervalle ${m(T`[${l1}\,;${l2}]`)}`, 'conv'), opt(`elle converge vers ${m(String(l1))} ou vers ${m(String(l2))}`, 'ou')],
      { explication: `Les deux limites sont différentes : le théorème des gendarmes ne s'applique pas. Par exemple, ${Y} peut alterner entre ${m(`${x}_n`)} et ${m(`${z}_n`)} et n'avoir alors aucune limite.`,
        meta: { l1, l2, egal } });
  }
  function gendarmesMonotone() {    // N3 : x croissante, z décroissante
    const [x, y, z] = aleaParmi(NOMS3), X = m(`(${x}_n)`), Y = m(`(${y}_n)`), Z = m(`(${z}_n)`);
    const l1 = alea(-6, 3), l2 = l1 + alea(2, 7);
    return qcm(
      `Soit ${X}, ${Y} et ${Z} trois suites telles que, pour tout entier naturel ${m('n')}, ${m(`${x}_n\\le ${y}_n\\le ${z}_n`)}. La suite ${X} est strictement croissante et converge vers ${m(String(l1))} ; la suite ${Z} est strictement décroissante et converge vers ${m(String(l2))}. Quel encadrement de ${m(`${y}_n`)} est vrai pour tout entier naturel ${m('n')} ?`,
      opt(m(`${x}_0\\le ${y}_n\\le ${z}_0`), 'enc:u0,w0'),
      [opt(m(`${l1}\\le ${y}_n\\le ${l2}`), 'enc:l1,l2'), opt(m(`${x}_0\\le ${y}_n\\le ${l2}`), 'enc:u0,l2'), opt(m(`${l1}\\le ${y}_n\\le ${z}_0`), 'enc:l1,w0')],
      { explication: `${X} croissante donne ${m(`${x}_0\\le ${x}_n\\le ${y}_n`)} ; ${Z} décroissante donne ${m(`${y}_n\\le ${z}_n\\le ${z}_0`)}. Les bornes ${m(String(l1))} et ${m(String(l2))} sont des limites, pas des bornes de ${Y}.`,
        meta: { l1, l2 } });
  }
  function comparaisonInfinie() {   // théorèmes de comparaison pour les limites infinies
    const [x, y] = aleaParmi([['u', 'v'], ['a', 'b'], ['s', 't'], ['x', 'y']]);
    const X = m(`(${x}_n)`), Y = m(`(${y}_n)`);
    const cas = aleaParmi([1, 2, 3, 4]);
    const pose = { 1: [`${x}_n\\le ${y}_n`, T`+\infty`], 2: [`${y}_n\\le ${x}_n`, T`+\infty`], 3: [`${y}_n\\le ${x}_n`, T`-\infty`], 4: [`${x}_n\\le ${y}_n`, T`-\infty`] }[cas];
    const rien = opt('on ne peut pas conclure sur la limite', 'rien');
    const bonne = cas === 1 ? opt(`${Y} tend vers ${m(T`+\infty`)}`, 'inf') : cas === 3 ? opt(`${Y} tend vers ${m(T`-\infty`)}`, '-inf') : rien;
    const dist = { 1: [rien, opt(`${Y} converge`, 'conv'), opt(`${Y} tend vers ${m(T`-\infty`)}`, '-inf')],
      2: [opt(`${Y} tend vers ${m(T`+\infty`)}`, 'inf'), opt(`${Y} converge`, 'conv'), opt(`${Y} tend vers ${m(T`-\infty`)}`, '-inf')],
      3: [rien, opt(`${Y} converge`, 'conv'), opt(`${Y} tend vers ${m(T`+\infty`)}`, 'inf')],
      4: [opt(`${Y} tend vers ${m(T`-\infty`)}`, '-inf'), opt(`${Y} converge`, 'conv'), opt(`${Y} tend vers ${m(T`+\infty`)}`, 'inf')] }[cas];
    const ex = { 1: `Si ${m(`${x}_n\\le ${y}_n`)} et ${m(`${x}_n`)} tend vers ${m(T`+\infty`)}, alors ${m(`${y}_n`)} tend vers ${m(T`+\infty`)} (théorème de comparaison).`,
      2: `${m(`${y}_n`)} est majorée par une suite qui tend vers ${m(T`+\infty`)} : cela ne dit rien de sa limite (${m(`${y}_n`)} peut tendre vers ${m(T`-\infty`)}, converger ou tendre vers ${m(T`+\infty`)}).`,
      3: `Si ${m(`${y}_n\\le ${x}_n`)} et ${m(`${x}_n`)} tend vers ${m(T`-\infty`)}, alors ${m(`${y}_n`)} tend vers ${m(T`-\infty`)}.`,
      4: `${m(`${y}_n`)} est minorée par une suite qui tend vers ${m(T`-\infty`)} : on ne peut rien dire de sa limite.` }[cas];
    return qcm(`Soit ${X} et ${Y} deux suites telles que, pour tout entier naturel ${m('n')}, ${m(pose[0])}. La suite ${X} tend vers ${m(pose[1])}. Que peut-on affirmer ?`,
      bonne, dist, { explication: ex, meta: { cmp: cas } });
  }

  // ==========================================================================
  // 5. Suites géométriques et limites
  // ==========================================================================
  function geomN1() {
    const q = aleaParmi([rat(1, 2), rat(1, 3), rat(1, 4), rat(2, 5), rat(3, 4), rat(4, 5), rat(-1, 2), rat(-2, 3), rat(2, 1), rat(3, 1), rat(4, 1), rat(5, 2), rat(4, 3), rat(-2, 1), rat(-3, 1), rat(-1, 1), rat(-3, 2), rat(1, 1),
      dc(0.9), dc(0.8), dc(0.95), dc(1.05), dc(1.2), dc(-0.9), dc(-1.1), dc(0.6)]);
    const k = aleaParmi([1, 1, 1, 2, 3, 5, -2, -4]);
    const absq = Math.abs(q.v);
    let verite;
    if (absq < 1) verite = LIM(0);
    else if (q.v === 1) verite = LIM(k);
    else if (q.v > 1) verite = k > 0 ? PINF() : MINF();
    else verite = opt('elle n\'a pas de limite', 'nolim');
    const pool = [LIM(0), PINF(), MINF(), LIM(1), LIM(k), opt('elle n\'a pas de limite', 'nolim'), LIM(-1)].filter(o => o.cle !== verite.cle);
    const expr = fois(k, puiss(q, 'n'));
    return qcm(`Que peut-on dire de la suite ${m('(u_n)')} définie pour tout entier naturel ${m('n')} par ${m(T`u_n=${expr}`)} ?`,
      verite, pool,
      { explication: absq < 1 ? `${m(T`-1<${q.tex}<1`)} : ${m(puiss(q, 'n'))} tend vers ${m('0')}, donc ${m('u_n')} aussi.` : q.v === 1 ? `${m(T`1^n=1`)} : la suite est constante, égale à ${m(String(k))}.` : q.v > 1 ? `${m(T`${q.tex}>1`)} : ${m(puiss(q, 'n'))} tend vers ${m(T`+\infty`)}, donc ${m('u_n')} tend vers ${k > 0 ? m(T`+\infty`) : m(T`-\infty`)}.` : `${m(T`${q.tex}\le -1`)} : ${m(puiss(q, 'n'))} change de signe sans se stabiliser, et n'a pas de limite.`,
        meta: { u: n => k * Math.pow(q.v, n), n0: 0 } });
  }
  function geomN2() {
    const a = aleaParmi([2, 3, 4, 5, 6, -2, -3, -4, -5]), b = aleaParmi([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7]);
    const qd = aleaParmi([rat(1, 2), rat(3, 4), rat(-1, 3), rat(2, 3), rat(2, 1), rat(3, 1), rat(3, 2)]);
    let verite;
    if (Math.abs(qd.v) < 1) verite = LIM(b); else verite = a > 0 ? PINF() : MINF();
    const pool = [LIM(0), LIM(a + b), PINF(), MINF(), LIM(a)].filter(o => o.cle !== verite.cle);
    return qcm(`Que peut-on dire de la suite ${m('(u_n)')} définie pour tout entier naturel ${m('n')} par ${m(T`u_n=${a}\times ${puiss(qd, 'n')}${sgn(b)}`)} ?`, verite, pool,
      { explication: Math.abs(qd.v) < 1 ? `${m(puiss(qd, 'n'))} tend vers ${m('0')} car ${m(T`|${qd.tex}|<1`)} : ${m('u_n')} tend vers ${m(String(b))}.` : `${m(puiss(qd, 'n'))} tend vers ${m(T`+\infty`)} (raison supérieure à ${m('1')}) : ${m('u_n')} tend vers ${a > 0 ? m(T`+\infty`) : m(T`-\infty`)}.`,
        meta: { u: n => a * Math.pow(qd.v, n) + b, n0: 0 } });
  }
  function geomSomme() {            // N3 : somme des termes d'une suite géométrique
    const q = aleaParmi([rat(1, 2), rat(1, 3), rat(2, 3), rat(3, 4), rat(-1, 2)]);
    const lim = rat(q.d, q.d - q.n);              // 1/(1-q) = d/(d-n)
    const qq = q.v < 0 ? T`\left(${q.tex}\right)` : q.tex;
    const deuxiemeTerme = q.v < 0 ? `1-${fracL(-q.n, q.d)}` : `1+${q.tex}`;
    const faux1 = rat(q.d, q.n), faux2 = rat(q.d, q.d + q.n);
    return qcm(`Pour tout entier naturel ${m('n')}, on pose ${m(T`S_n=${deuxiemeTerme}+${puiss(q, '2')}+\cdots+${puiss(q, 'n')}`)}. Quelle est la limite de ${m('(S_n)')} ?`,
      opt(m(lim.tex), 'lim:' + lim.cle), [opt(m(faux1.tex), 'lim:' + faux1.cle), opt(m(faux2.tex), 'lim:' + faux2.cle), PINF(), opt(m('1'), 'lim:1')],
      { explication: `${m(T`S_n=\dfrac{1-${puiss(q, 'n+1')}}{1-${qq}}`)} et ${m(puiss(q, 'n+1'))} tend vers ${m('0')} : ${m('S_n')} tend vers ${m(T`\dfrac{1}{1-${qq}}=${lim.tex}`)}.`,
        meta: { u: n => { let s = 0; for (let k = 0; k <= n; k++) s += Math.pow(q.v, k); return s; }, n0: 0 } });
  }
  function geomCroissComparee() {   // N3 : n q^n
    const q = aleaParmi([rat(1, 2), rat(2, 3), rat(3, 4), rat(1, 3)]);
    return qcm(`Que peut-on dire de la suite ${m('(u_n)')} définie pour tout entier naturel ${m('n')} par ${m(T`u_n=n\times ${puiss(q, 'n')}`)} ?`,
      LIM(0), [PINF(), LIM(1), opt('elle n\'a pas de limite', 'nolim')],
      { explication: `Par croissances comparées, ${m(T`n\,q^n`)} tend vers ${m('0')} lorsque ${m(T`0\lt q\lt 1`)} : la géométrique l'emporte sur ${m('n')}.`,
        meta: { u: n => n * Math.pow(q.v, n), n0: 0 } });
  }
  function geomQuotient() {         // N3 : (a q^n + b)/(c q^n + d), q > 1
    const q = aleaParmi([2, 3, 4]), a = aleaParmi([1, 2, 3, 5]), b = alea(1, 6), c = aleaParmi([1, 2, 3, 4]), d = alea(1, 6);
    const lim = rat(a, c);
    return qcm(`Que peut-on dire de la suite ${m('(u_n)')} définie pour tout entier naturel ${m('n')} par ${m(T`u_n=\dfrac{${fois(a, q + '^n')}+${b}}{${fois(c, q + '^n')}+${d}}`)} ?`,
      opt(`elle converge vers ${m(lim.tex)}`, 'lim:' + lim.cle),
      [opt(`elle converge vers ${m(rat(b, d).tex)}`, 'lim:' + rat(b, d).cle), PINF(), opt(`elle converge vers ${m('0')}`, 'lim:0'), opt(`elle converge vers ${m(rat(a + b, c + d).tex)}`, 'lim:' + rat(a + b, c + d).cle)],
      { explication: `On factorise par ${m(T`${q}^n`)} : ${m(T`u_n=\dfrac{${a}+${fois(b, q + '^{-n}')}}{${c}+${fois(d, q + '^{-n}')}}`)} et ${m(T`${q}^{-n}`)} tend vers ${m('0')}, d'où la limite ${m(lim.tex)}.`,
        meta: { u: n => (a * Math.pow(q, n) + b) / (c * Math.pow(q, n) + d), n0: 0, N: 60 } });
  }

  // ==========================================================================
  // 6. Suite arithmético-géométrique u_{n+1} = p u_n + q
  // ==========================================================================
  const COMBOS = [[rat(2, 1), 1], [rat(3, 1), 1], [rat(-2, 1), 1], [rat(1, 2), 2], [rat(1, 3), 3], [rat(2, 3), 3], [rat(3, 4), 4], [rat(-1, 2), 2]];
  function fixePointAleatoire() {
    const [p, mult] = aleaParmi(COMBOS);
    let l = mult * alea(-3, 3); if (l === 0) l = mult;
    const q = rat(l * (p.d - p.n), p.d);             // q = l(1-p) entier
    let u0 = alea(-6, 8); if (u0 === l) u0 += 1;
    return { p, q: q.n, l, u0 };
  }
  function arithGeoN1() {
    const p = aleaParmi([2, 3, 4, -2, -3, 5]), q = aleaParmi([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]), u0 = alea(-4, 6);
    const u1 = p * u0 + q, u2 = p * u1 + q;
    const fx = v => opt(m(String(v)), 'num:' + v);
    return qcm(`On pose ${m(T`u_0=${u0}`)} et, pour tout entier naturel ${m('n')}, ${m(T`u_{n+1}=${p}u_n${sgn(q)}`)}. Que vaut ${m('u_2')} ?`,
      fx(u2), [fx(p * p * u0 + q), fx(p * p * u0 + 2 * q), fx(u1 + q), fx(p * u1)],
      { explication: `${m(T`u_1=${p}\times ${u0 < 0 ? '(' + u0 + ')' : u0}${sgn(q)}=${u1}`)} puis ${m(T`u_2=${p}\times ${u1 < 0 ? '(' + u1 + ')' : u1}${sgn(q)}=${u2}`)}.`,
        meta: { p, q, u0, u2 } });
  }
  function arithGeoN2() {
    const { p, q, l, u0 } = fixePointAleatoire();
    const ptex = p.d === 1 ? String(p.n) : p.tex;
    const def = `${m(T`u_0=${u0}`)} et, pour tout entier naturel ${m('n')}, ${m(T`u_{n+1}=${ptex}\,u_n${q === 0 ? '' : sgn(q)}`)}`;
    const fv = (aff, cle) => opt(m(T`v_n=${aff}`), 'g:' + cle);
    return qcm(`On pose ${def}. Parmi les suites suivantes, laquelle est géométrique ?`,
      fv(`u_n${sgn(-l)}`, `${l}`),
      [fv(`u_n${sgn(l)}`, `${-l}`), fv(`u_n${sgn(-q)}`, `${q}`), fv(`u_n${sgn(-u0)}`, `${u0}`), fv(`u_n${sgn(-(l + q))}`, `${l + q}`)],
      { explication: `${m(T`\ell=${l}`)} vérifie ${m(T`\ell=${ptex}\ell${q === 0 ? '' : sgn(q)}`)} ; alors ${m(T`v_{n+1}=u_{n+1}-${l < 0 ? '(' + l + ')' : l}=${ptex}(u_n-${l < 0 ? '(' + l + ')' : l})=${ptex}\,v_n`)} : ${m('(v_n)')} est géométrique de raison ${m(ptex)}.`,
        meta: { p: p.v, q, l, u0 } });
  }
  function arithGeoLimite() {       // N3 : limite selon la raison
    const { p, q, l, u0 } = fixePointAleatoire();
    const ptex = p.d === 1 ? String(p.n) : p.tex;
    const def = `${m(T`u_0=${u0}`)} et, pour tout entier naturel ${m('n')}, ${m(T`u_{n+1}=${ptex}\,u_n${q === 0 ? '' : sgn(q)}`)}`;
    let verite, pool;
    if (Math.abs(p.v) < 1) { verite = LIM(l); pool = [LIM(q), LIM(u0), PINF(), LIM(0)]; }
    else if (p.v > 1) { verite = u0 > l ? PINF() : MINF(); pool = [LIM(l), u0 > l ? MINF() : PINF(), LIM(0), opt('elle n\'a pas de limite', 'nolim')]; }
    else { verite = opt('elle n\'a pas de limite', 'nolim'); pool = [LIM(l), LIM(0), PINF(), MINF()]; }
    return qcm(`On pose ${def}. Que peut-on dire de la suite ${m('(u_n)')} ?`, verite, pool.filter(o => o.cle !== verite.cle),
      { explication: `${m(T`u_n=(u_0-\ell)\,p^n+\ell`)} avec ${m(T`\ell=${l}`)} et ${m(T`p=${ptex}`)}. ${Math.abs(p.v) < 1 ? 'Comme ' + m(T`|p|<1`) + ', ' + m('u_n') + ' tend vers ' + m(String(l)) + '.' : p.v > 1 ? 'Comme ' + m(T`p>1`) + ', le signe de ' + m(T`u_0-\ell`) + ' décide du sens de la divergence.' : 'Comme ' + m(T`p<-1`) + ', les termes alternent en grandissant en valeur absolue : pas de limite.'}`,
        meta: { p: p.v, q, l, u0, u: n => { let u = u0; for (let k = 0; k < n; k++) u = p.v * u + q; return u; }, n0: 0, N: 3000 } });
  }
  function arithGeoExpression() {   // N3 : expression explicite
    const { p, q, l, u0 } = fixePointAleatoire();
    const ptex = p.d === 1 ? String(p.n) : p.tex;
    const A = u0 - l;
    const ft = (aff, cle) => opt(m(T`u_n=${aff}`), 'f:' + cle);
    const pw = puiss(p, 'n');
    return qcm(`On pose ${m(T`u_0=${u0}`)} et, pour tout entier naturel ${m('n')}, ${m(T`u_{n+1}=${ptex}\,u_n${q === 0 ? '' : sgn(q)}`)}. Quelle est l'expression de ${m('u_n')} en fonction de ${m('n')} ?`,
      ft(T`${fois(A, pw)}${sgn(l)}`, `${A}*Math.pow(${p.v},n)+${l}`),
      [ft(T`${fois(u0, pw)}${sgn(l)}`, `${u0}*Math.pow(${p.v},n)+${l}`), ft(fois(A, pw), `${A}*Math.pow(${p.v},n)`), ft(T`${fois(u0, pw)}${sgn(q)}`, `${u0}*Math.pow(${p.v},n)+${q}`), ft(T`${fois(A, pw)}${sgn(-l)}`, `${A}*Math.pow(${p.v},n)+${-l}`)],
      { explication: `${m(T`v_n=u_n-${l < 0 ? '(' + l + ')' : l}`)} est géométrique de raison ${m(ptex)} et de premier terme ${m(T`u_0-${l < 0 ? '(' + l + ')' : l}=${A}`)}, d'où ${m(T`u_n=v_n+${l < 0 ? '(' + l + ')' : l}`)}.`,
        meta: { p: p.v, q, l, u0 } });
  }

  // ==========================================================================
  // 7. Théorèmes de convergence monotone
  // ==========================================================================
  function monotoneN2() {
    const cas = aleaParmi(['cmaj', 'dmin', 'cnonmaj', 'c', 'ccv', 'cdv', 'borne', 'bornee']);
    const L = aleaParmi(['u', 'v', 'w', 's', 't', 'a', 'b', 'x', 'y']), M = aleaParmi(['M', 'K', 'B', 'A']), mi = aleaParmi(['m', 'c', 'b', 'k']);
    const u = m(`(${L}_n)`), un = `${L}_n`, tM = m(M), tm = m(mi), ell = m(T`\ell`);
    if (cas === 'cmaj') {
      return qcm(`Soit ${u} une suite croissante et majorée par un réel ${tM}. Que peut-on affirmer ?`,
        opt(`elle converge vers un réel ${ell} tel que ${m(T`\ell\le ${M}`)}`, 'conv_le_M'),
        [opt(`elle converge vers ${tM}`, 'conv_M'), opt(`elle tend vers ${m(T`+\infty`)}`, 'inf'), opt(`elle converge vers un réel ${ell} tel que ${m(T`\ell\lt ${M}`)}`, 'conv_lt_M')],
        { explication: `Théorème de convergence monotone : une suite croissante et majorée converge, et sa limite est inférieure ou égale à tout majorant ; elle n'est pas forcément égale à ${tM}.`, meta: { cas } });
    }
    if (cas === 'dmin') {
      return qcm(`Soit ${u} une suite décroissante et minorée par un réel ${tm}. Que peut-on affirmer ?`,
        opt(`elle converge vers un réel ${ell} tel que ${m(T`\ell\ge ${mi}`)}`, 'conv_ge_m'),
        [opt(`elle converge vers ${tm}`, 'conv_m'), opt(`elle tend vers ${m(T`-\infty`)}`, '-inf'), opt(`elle converge vers un réel ${ell} tel que ${m(T`\ell\gt ${mi}`)}`, 'conv_gt_m')],
        { explication: 'Une suite décroissante et minorée converge, et sa limite est supérieure ou égale à tout minorant.', meta: { cas } });
    }
    if (cas === 'cnonmaj') {
      return qcm(`Soit ${u} une suite croissante et non majorée. Que peut-on affirmer ?`,
        opt(`elle tend vers ${m(T`+\infty`)}`, 'inf'),
        [opt('elle converge', 'conv'), opt('on ne peut rien affirmer sur sa limite', 'rien'), opt(`elle tend vers ${m(T`-\infty`)}`, '-inf')],
        { explication: `Une suite croissante non majorée tend vers ${m(T`+\infty`)} : pour tout réel ${m('A')}, elle dépasse ${m('A')} à partir d'un certain rang et ne redescend plus.`, meta: { cas } });
    }
    if (cas === 'c') {
      return qcm(`Soit ${u} une suite croissante (on ne sait rien d'autre). Que peut-on affirmer ?`,
        opt(`elle converge ou elle tend vers ${m(T`+\infty`)}`, 'conv_ou_inf'),
        [opt('elle converge', 'conv'), opt(`elle tend vers ${m(T`+\infty`)}`, 'inf'), opt('elle diverge', 'div')],
        { explication: `Deux cas : si elle est majorée, elle converge ; sinon elle tend vers ${m(T`+\infty`)}. On ne peut pas dire laquelle des deux est vraie sans plus d'information.`, meta: { cas } });
    }
    if (cas === 'ccv') {
      return qcm(`Soit ${u} une suite croissante qui converge vers un réel ${ell}. Que peut-on affirmer ?`,
        opt(`pour tout entier ${m('n')}, ${m(`${un}\\le \\ell`)}`, 'le_l'),
        [opt(`pour tout entier ${m('n')}, ${m(`${un}\\lt \\ell`)}`, 'lt_l'), opt(`pour tout entier ${m('n')}, ${m(`${un}\\ge \\ell`)}`, 'ge_l'), opt('elle est constante à partir d\'un certain rang', 'cst')],
        { explication: `Une suite croissante qui converge vers ${ell} est majorée par ${ell} (elle ne peut pas dépasser sa limite). L'inégalité stricte est fausse pour une suite constante, qui est croissante.`, meta: { cas } });
    }
    if (cas === 'cdv') {
      return qcm(`Soit ${u} une suite décroissante qui converge vers un réel ${ell}. Que peut-on affirmer ?`,
        opt(`pour tout entier ${m('n')}, ${m(`${un}\\ge \\ell`)}`, 'ge_l'),
        [opt(`pour tout entier ${m('n')}, ${m(`${un}\\gt \\ell`)}`, 'gt_l'), opt(`pour tout entier ${m('n')}, ${m(`${un}\\le \\ell`)}`, 'le_l'), opt('elle est constante à partir d\'un certain rang', 'cst')],
        { explication: `Une suite décroissante qui converge vers ${ell} est minorée par ${ell}. L'inégalité stricte est fausse pour une suite constante, qui est décroissante.`, meta: { cas } });
    }
    if (cas === 'borne') {
      return qcm(`Soit ${u} une suite qui converge. Que peut-on affirmer ?`,
        opt('elle est bornée', 'bornee'),
        [opt('elle est monotone', 'monotone'), opt('elle est croissante', 'croissante'), opt('elle est constante à partir d\'un certain rang', 'cst')],
        { explication: `Une suite convergente est bornée : à partir d'un certain rang, ses termes sont proches de la limite, et il n'y en a qu'un nombre fini avant. Elle n'est pas forcément monotone (exemple : ${m(T`\dfrac{(-1)^n}{n}`)}).`, meta: { cas } });
    }
    return qcm(`Soit ${u} une suite bornée. Que peut-on affirmer ?`,
      opt('on ne peut rien affirmer sur sa convergence', 'rien_conv'),
      [opt('elle converge', 'conv'), opt('elle est monotone', 'monotone'), opt('elle est constante à partir d\'un certain rang', 'cst')],
      { explication: `Une suite bornée ne converge pas forcément : ${m(T`(-1)^n`)} est bornée et n'a pas de limite. Elle n'est pas non plus forcément monotone.`, meta: { cas } });
  }
  function adjacentes() {           // N3 : suites adjacentes (approfondissement du programme)
    return qcm(
      `Soit ${m('(u_n)')} une suite croissante et ${m('(v_n)')} une suite décroissante telles que ${m(T`v_n-u_n`)} tend vers ${m('0')}. Que peut-on affirmer ?`,
      opt('les deux suites convergent vers la même limite', 'adj'),
      [opt('les deux suites convergent, mais pas forcément vers la même limite', 'adj_diff'), opt(`${m('(u_n)')} converge mais ${m('(v_n)')} peut diverger`, 'adj_u'), opt(`${m('(u_n)')} tend vers ${m(T`+\infty`)}`, 'adj_inf')],
      { explication: `${m('(u_n)')} est croissante et majorée par ${m('v_0')}, ${m('(v_n)')} est décroissante et minorée par ${m('u_0')} : elles convergent, et la différence des limites vaut ${m('0')}. On dit que ces suites sont adjacentes.`,
        meta: {} });
  }


  // ==========================================================================
  // 8. Raisonnement par récurrence : hérédité
  // ==========================================================================
  const intervalle = (lo, hi, tex) => opt(m(tex), `I:${lo},${hi}`);
  function herediteAffine() {       // f affine de pente |p| < 1 : l'intervalle [a, b] est stable, la récurrence fonctionne
    const [p, mult] = aleaParmi([[rat(1, 2), 2], [rat(1, 3), 3], [rat(2, 3), 3], [rat(3, 4), 4], [rat(-1, 2), 2], [rat(-1, 3), 3], [rat(1, 4), 4]]);
    let l, a, b, q;
    for (;;) {
      l = mult * alea(-2, 3);                       // point fixe
      q = l * (p.d - p.n) / p.d;                    // q = l(1-p), entier
      a = l - alea(1, 6); b = l + alea(1, 6);
      const fa = (p.n * a + q * p.d) / p.d, fb = (p.n * b + q * p.d) / p.d;
      if (Math.min(fa, fb) >= a && Math.max(fa, fb) <= b && Number.isInteger(q)) break;
    }
    const num = x => p.n * x + q * p.d;               // f(x) = num(x) / p.d
    const lo = p.n > 0 ? rat(num(a), p.d) : rat(num(b), p.d), hi = p.n > 0 ? rat(num(b), p.d) : rat(num(a), p.d);
    const iv = (L, H) => intervalle(L.v, H.v, T`${L.tex}\le u_{n+1}\le ${H.tex}`);
    const ent = x => rat(x, 1);
    const cand = [iv(rat(num(a), p.d), rat(num(b), p.d)), iv(ent(a + q), ent(b + q)), iv(rat(p.n * Math.min(a, b), p.d), rat(p.n * Math.max(a, b), p.d)),
      iv(ent(a), ent(b)), iv(rat(num(a), p.d), ent(b + q)), iv(ent(q), rat(num(b), p.d)), iv(rat(Math.min(num(a), num(b)) - p.d, p.d), hi), iv(lo, rat(Math.max(num(a), num(b)) + p.d, p.d))].filter(o => { const [x, y] = o.cle.slice(2).split(',').map(Number); return x < y; });
    const bonne = iv(lo, hi);
    const pt = p.d === 1 ? String(p.n) : p.tex;
    return qcm(`On considère la suite ${m('(u_n)')} définie par ${m(T`u_0=${a}`)} et, pour tout entier naturel ${m('n')}, ${m(T`u_{n+1}=${pt}\,u_n${sgn(q)}`)}. On démontre par récurrence que, pour tout entier naturel ${m('n')}, ${m(T`${a}\le u_n\le ${b}`)}. Dans l'étape d'hérédité, on suppose que ${m(T`${a}\le u_n\le ${b}`)} pour un entier ${m('n')} fixé. Quel est l'encadrement de ${m('u_{n+1}')} le plus précis que l'on en déduit ?`,
      bonne, unique(cand, [bonne.cle]).slice(0, 3),
      { explication: p.n > 0 ? `La fonction ${m(T`x\mapsto ${pt}x${sgn(q)}`)} est croissante : on multiplie les trois membres par ${m(pt)} puis on ajoute ${m(String(q))}, sans changer l'ordre. On obtient ${m(T`${lo.tex}\le u_{n+1}\le ${hi.tex}`)}, qui est bien contenu dans ${m(T`[${a}\,;${b}]`)}.` : `On multiplie par le nombre négatif ${m(pt)} : l'ordre des inégalités est inversé, puis on ajoute ${m(String(q))}. On obtient ${m(T`${lo.tex}\le u_{n+1}\le ${hi.tex}`)}, qui est bien contenu dans ${m(T`[${a}\,;${b}]`)}.`,
        meta: { kind: 'aff', p: p.v, q, a, b } });
  }
  function heredite() { return herediteAffine(); }
  function herediteRacine() {       // N3 : u_{n+1} = sqrt(2 u_n + k)
    let s0, k, b;
    do { s0 = aleaParmi([2, 3, 4, 5, 6]); k = alea(1, 12); b = (s0 * s0 - k) / 2; } while (!Number.isInteger(b) || b < 1 || b < s0);
    const lo = Math.sqrt(k), hi = s0;
    const iv = (l, h, tex) => intervalle(l, h, tex);
    const rk = T`\sqrt{${k}}`;
    const bonne = iv(lo, hi, T`${rk}\le u_{n+1}\le ${hi}`);
    const cand = [iv(k, s0 * s0, T`${k}\le u_{n+1}\le ${s0 * s0}`), iv(lo, s0 * s0, T`${rk}\le u_{n+1}\le ${s0 * s0}`), iv(0, hi, T`0\le u_{n+1}\le ${hi}`), iv(lo, b, T`${rk}\le u_{n+1}\le ${b}`), iv(lo, hi + 1, T`${rk}\le u_{n+1}\le ${hi + 1}`), iv(1, hi, T`1\le u_{n+1}\le ${hi}`), iv(0, b, T`0\le u_{n+1}\le ${b}`)].filter(o => { const [l, h] = o.cle.slice(2).split(',').map(Number); return l < h; });
    return qcm(`On considère la suite ${m('(u_n)')} définie par ${m(T`u_0=0`)} et, pour tout entier naturel ${m('n')}, ${m(T`u_{n+1}=\sqrt{2u_n+${k}}`)}. On démontre par récurrence que, pour tout entier naturel ${m('n')}, ${m(T`0\le u_n\le ${b}`)}. Dans l'étape d'hérédité, on suppose que ${m(T`0\le u_n\le ${b}`)} pour un entier ${m('n')} fixé. Quel est l'encadrement de ${m('u_{n+1}')} le plus précis que l'on en déduit ?`,
      bonne, unique(cand, [bonne.cle]).slice(0, 3),
      { explication: `${m(T`0\le u_n\le ${b}`)} donne ${m(T`${k}\le 2u_n+${k}\le ${2 * b + k}`)}, puis, la fonction racine carrée étant croissante, ${m(T`${rk}\le u_{n+1}\le ${hi}`)}.`,
        meta: { kind: 'rac', k, a: 0, b } });
  }

  // ==========================================================================
  // 9. Algorithme de seuil (Python)
  // ==========================================================================
  const CODE = lignes => `<pre style="margin:8px 0;padding:8px 12px;background:#F1EFE8;border-radius:6px;font-size:0.92em;line-height:1.35;overflow-x:auto;text-align:left;font-family:Consolas,'Courier New',monospace">${lignes.join('\n').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
  function seuilPython(niveau) {
    const n3 = niveau === 3;
    let a, p, q, S, cmp, ret, n, u, suite;
    for (let essai = 0; essai < 200; essai++) {
      const dec = n3 && Math.random() < 0.3;
      if (!dec) { p = aleaParmi([1, 2, 2, 3]); q = p === 1 ? aleaParmi([2, 3, 4, 5]) : (n3 ? alea(-2, 4) : alea(0, 3)); a = alea(1, 5); }
      else { p = 1; q = -aleaParmi([2, 3, 4, 5]); a = alea(30, 80); }
      suite = [a]; for (let i = 0; i < 30; i++) suite.push(p * suite[i] + q);
      const k = alea(2, 7);
      if (!dec && (suite[k] <= suite[k - 1] || suite[k] > 2000)) continue;
      if (dec && suite[k] < 0) continue;
      const exact = Math.random() < 0.5;
      cmp = dec ? (Math.random() < 0.5 ? '>' : '>=') : (n3 && Math.random() < 0.5 ? '<=' : '<');
      S = exact ? suite[k] : (dec ? suite[k] + 1 : suite[k] - 1);       // exact : on atteint S
      if (!dec && !exact && S <= suite[k - 1]) continue;
      if (dec && !exact && S >= suite[k - 1]) continue;
      ret = n3 && Math.random() < 0.4 ? 'u' : 'n';
      u = a; n = 0;
      const cont = x => (cmp === '<' ? x < S : cmp === '<=' ? x <= S : cmp === '>' ? x > S : x >= S);
      while (cont(u) && n < 100) { u = p * u + q; n++; }
      if (n < 2 || n > 9) continue;
      break;
    }
    const expr = (p === 1 ? 'u' : `${p} * u`) + (q === 0 ? '' : q < 0 ? ` - ${-q}` : ` + ${q}`);
    const code = ['def seuil(S):', '    n = 0', `    u = ${a}`, `    while u ${cmp} S:`, `        u = ${expr}`, '        n = n + 1', `    return ${ret}`];
    const res = ret === 'n' ? n : u;
    const nb = x => opt(m(String(x)), 'num:' + x);
    const prec = suite[n - 1];
    const cand = ret === 'n' ? [n - 1, n + 1, u, prec, n + 2].map(nb) : [n, prec, p * u + q, u - q, suite[n - 2]].map(nb);
    return qcm(`On considère la fonction Python suivante.${CODE(code)}Que renvoie l'appel <code>seuil(${S})</code> ?`,
      nb(res), unique(cand.filter(o => !String(o.cle).includes('NaN') && Number(o.cle.slice(4)) >= 0), ['num:' + res]),
      { explication: `On calcule les termes de la suite ${m(T`u_0=${a}`)}, ${m(T`u_{k+1}=${p === 1 ? '' : p + T`\,`}u_k${q === 0 ? '' : sgn(q)}`)} tant que la condition ${m(T`u ${cmp === '<=' ? T`\le` : cmp === '>=' ? T`\ge` : cmp === '<' ? T`\lt` : T`\gt`} ${S}`)} est vraie : on s'arrête quand elle devient fausse, après ${m(String(n))} passage${n > 1 ? 's' : ''} dans la boucle (${m(T`u=${u}`)}), et la fonction renvoie ${ret === 'n' ? 'le compteur ' + m('n') : 'la valeur de ' + m('u')} : ${m(String(res))}.`,
      meta: { a, p, q, S, cmp, ret } });
  }

  // ==========================================================================
  // 10. Ajouts d'après les QCM de 2022 et 2023
  // ==========================================================================
  function geomQuotientBases() {    // (a p^n + b) / (c q^n + d), bases différentes
    let p, qq, a, b, c, d;
    for (;;) {
      p = aleaParmi([2, 3, 4, 5]); qq = aleaParmi([2, 3, 4, 5]);
      a = aleaParmi([1, 1, 2, 3, -1, -2]); b = aleaParmi([1, 2, 3, -1, -2, 4]); c = aleaParmi([1, 1, 2, 3, -1]); d = aleaParmi([1, 2, 3, 5, -2]);
      let nul = p === qq;
      for (let n = 0; n <= 30 && !nul; n++) if (c * Math.pow(qq, n) + d === 0) nul = true;
      if (!nul) break;
    }
    const num = `${fois(a, p + '^n')}${sgn(b)}`, den = `${fois(c, qq + '^n')}${sgn(d)}`;
    let verite;
    if (p < qq) verite = LIM(0); else verite = (a > 0) === (c > 0) ? PINF() : MINF();
    const ra = rat(a, c), rb = rat(b, d);
    const pool = [LIM(0), PINF(), MINF(), opt(`elle converge vers ${m(ra.tex)}`, 'lim:' + ra.cle), opt(`elle converge vers ${m(rb.tex)}`, 'lim:' + rb.cle)].filter(o => o.cle !== verite.cle);
    return qcm(`On considère la suite ${m('(u_n)')} définie pour tout entier naturel ${m('n')} par ${m(T`u_n=\dfrac{${num}}{${den}}`)}. Que peut-on dire de ${m('(u_n)')} ?`,
      verite, pool,
      { explication: p < qq ? `Au numérateur comme au dénominateur, la puissance domine. On factorise par ${m(`${qq}^n`)} : ${m(T`\left(\dfrac{${p}}{${qq}}\right)^n`)} tend vers ${m('0')}, donc le quotient tend vers ${m('0')}.` : `On factorise par ${m(`${p}^n`)} : le quotient se comporte comme ${m(T`${ra.d === 1 && Math.abs(ra.n) === 1 ? (ra.n < 0 ? '-' : '') : ra.tex}\left(\dfrac{${p}}{${qq}}\right)^n`)}, avec ${m(T`\dfrac{${p}}{${qq}}\gt 1`)}, donc il tend vers ${(a > 0) === (c > 0) ? m(T`+\infty`) : m(T`-\infty`)}.`,
        meta: { u: n => (a * Math.pow(p, n) + b) / (c * Math.pow(qq, n) + d), n0: 0, N: 60 } });
  }
  function limiteInegalite() {      // passage à la limite dans une inégalité large
    const min = Math.random() < 0.5, [L] = [aleaParmi(['u', 'v', 'w', 's', 't', 'a'])];
    const b = alea(-5, 6), bt = Math.random() < 0.3 ? aleaParmi(['M', 'K', 'B']) : String(b), ell = m(T`\ell`);
    const rel = { ge: [T`\ell\ge ${bt}`, 'rel:ge'], gt: [T`\ell\gt ${bt}`, 'rel:gt'], eq: [T`\ell=${bt}`, 'rel:eq'], le: [T`\ell\le ${bt}`, 'rel:le'], lt: [T`\ell\lt ${bt}`, 'rel:lt'] };
    const O = k => opt(`on peut affirmer que ${m(rel[k][0])}`, rel[k][1]);
    const juste = min ? 'ge' : 'le';
    const dist = min ? ['gt', 'eq', 'le'] : ['lt', 'eq', 'ge'];
    return qcm(`Soit ${m(`(${L}_n)`)} une suite ${min ? 'minorée' : 'majorée'} par ${m(bt)} qui converge vers un réel ${ell}. Que peut-on affirmer ?`,
      O(juste), dist.map(O),
      { explication: `Les inégalités larges se conservent par passage à la limite : ${m(`${L}_n\\${min ? 'ge' : 'le'} ${bt}`)} pour tout ${m('n')} donne ${m(rel[juste][0])}. L'inégalité stricte n'est pas conservée (la suite ${m(T`${bt}${min ? '+' : '-'}\dfrac{1}{n+1}`)} est strictement ${min ? 'supérieure' : 'inférieure'} à ${m(bt)}, mais sa limite est ${m(bt)}).`,
        meta: { cas: 'ineg', sens: min ? 'min' : 'maj', b } });
  }
  function encadrementExplicite() { // encadrements du type de ceux des sujets
    const cas = aleaParmi([1, 2, 3]);
    const L = aleaParmi(['u', 'v', 'w']), un = `${L}_n`, U = m(`(${L}_n)`);
    if (cas === 1) {                // n + a < u_n < n + b : tend vers +infini
      const a = alea(-3, 2), b = a + alea(1, 3), k = aleaParmi([1, 1, 2, 3]);
      const aff = c => (k === 1 ? 'n' : `${k}n`) + (c === 0 ? '' : sgn(c)), lo = aff(a), hi = aff(b);
      return qcm(`On considère une suite ${U} telle que, pour tout entier naturel ${m('n')}, ${m(T`${lo}\lt ${un}\lt ${hi}`)}. On peut affirmer que :`,
        opt(`${U} tend vers ${m(T`+\infty`)}`, 'inf'),
        [opt(`${U} converge`, 'conv'), opt(`${U} tend vers ${m(T`-\infty`)}`, '-inf'), opt('on ne peut pas conclure sur sa limite', 'rien')],
        { explication: `${m(T`${un}\gt ${lo}`)} et ${m(lo)} tend vers ${m(T`+\infty`)} : par comparaison, ${m(un)} tend vers ${m(T`+\infty`)}. La majoration ne sert pas.`,
          meta: { enc: 1, a, b, k } });
    }
    if (cas === 2) {                // a + (1/q)^n <= u_n <= a + 1 - n/(n+1)
      const a = alea(-3, 4), q = aleaParmi([2, 3, 4]);
      const hi = aleaParmi([[T`${a + 1}-\dfrac{n}{n+1}`, n => a + 1 - n / (n + 1)], [T`${a}+\dfrac{1}{n+1}`, n => a + 1 / (n + 1)], [T`${a}+\dfrac{2}{n+2}`, n => a + 2 / (n + 2)]]);
      return qcm(`On considère une suite ${U} telle que, pour tout entier naturel ${m('n')}, ${m(T`${a}+\left(\dfrac{1}{${q}}\right)^n\le ${un}\le ${hi[0]}`)}. On peut affirmer que :`,
        opt(`${U} converge vers ${m(String(a))}`, 'lim:' + a),
        [opt(`${U} converge vers ${m(String(a + 1))}`, 'lim:' + (a + 1)), opt('on ne peut pas conclure sur sa convergence', 'rien'), opt(`${U} diverge`, 'div')],
        { explication: `Le minorant tend vers ${m(String(a))} car ${m(T`\left(\dfrac{1}{${q}}\right)^n`)} tend vers ${m('0')} ; le majorant tend aussi vers ${m(String(a))}. Par le théorème des gendarmes, ${U} converge vers ${m(String(a))}.`,
          meta: { enc: 2, a, q, hi: hi[1] } });
    }
    const a = aleaParmi([-3, -2, -1, 0]);
    return qcm(`On considère une suite ${U} telle que, pour tout entier naturel ${m(T`n\ge 1`)}, ${m(T`${un}\le ${L}_{n+1}\le \dfrac{1}{n}`)}. On peut alors affirmer que :`,
      opt(`${U} converge`, 'conv'),
      [opt(`${U} converge vers ${m('0')}`, 'lim:0'), opt(`${U} tend vers ${m(T`+\infty`)}`, 'inf'), opt(`${U} diverge`, 'div')],
      { explication: `${U} est croissante et majorée (par ${m('1')}, puisque ${m(T`${un}\le \dfrac{1}{n}\le 1`)} donne ${m(T`${L}_{n+1}\le 1`)}) : elle converge (théorème de convergence monotone). Sa limite est inférieure ou égale à ${m('0')} mais n'est pas forcément ${m('0')}.`,
        meta: { enc: 3 } });
  }
  function seuilContexte() {        // modélisation par une suite géométrique et seuil
    const cas = aleaParmi(['baisse', 'hausse', 'double']);
    let v0, taux, cible, texte, croit, nom;
    for (let essai = 0; essai < 300; essai++) {
      if (cas === 'baisse') { v0 = aleaParmi([1, 2, 5, 10, 20]); taux = aleaParmi([5, 8, 10, 12, 15, 20, 25]); cible = v0 * aleaParmi([0.5, 0.25, 0.1, 0.8]); croit = false; }
      else if (cas === 'hausse') { v0 = aleaParmi([50, 57, 100, 200, 500, 1000]); taux = aleaParmi([2, 3, 4, 5, 8, 10]); cible = v0 * aleaParmi([1.5, 2, 3]); croit = true; }
      else { v0 = aleaParmi([100, 200, 500, 1000]); taux = 100; cible = v0 * aleaParmi([50, 100, 500, 1000]); croit = true; }
      const f = 1 + (croit ? 1 : -1) * taux / 100;
      let v = v0, n = 0; while ((croit ? v <= cible : v >= cible) && n < 200) { v *= f; n++; }
      const prec = v0 * Math.pow(f, n - 1);
      if (n < 3 || n > 30 || Math.abs(v - cible) / cible < 1e-6 || Math.abs(prec - cible) / cible < 1e-6) continue;
      const lin = Math.ceil(Math.abs(cible - v0) / (v0 * taux / 100));          // erreur classique : évolution linéaire
      const ent = x => (Number.isInteger(x) ? String(x) : dec(x)), entm = x => (Number.isInteger(x) ? String(x) : decL(x));
      nom = { baisse: `Un récipient contient ${ent(v0)} litre${v0 > 1 ? 's' : ''} d'eau. Chaque heure, le volume d'eau diminue de ${taux}\\,\\%. Au bout de combien d'heures entières le volume est-il strictement inférieur à ${ent(cible)} litre${cible > 1 ? 's' : ''} ?`,
        hausse: `Une action est cotée ${ent(v0)}\\,€. Sa valeur augmente de ${taux}\\,\\% chaque mois. Au bout de combien de mois entiers sa valeur dépasse-t-elle strictement ${ent(cible)}\\,€ ?`,
        double: `Une population de bactéries compte ${ent(v0)} individus et double toutes les heures. Au bout de combien d'heures entières la population dépasse-t-elle strictement ${ent(cible)} individus ?` }[cas];
      const cand = (cas === 'double' ? [n - 1, n + 1, n + 3, n + 2, n - 2] : [n - 1, n + 1, lin, n + 2, n - 2]).filter(x => x > 0 && x !== n);
      const nb = x => opt(m(String(x)), 'num:' + x);
      const choix = unique(cand.map(nb), ['num:' + n]).slice(0, 3);
      if (choix.length < 3) continue;
      return qcm(nom.replace(/\\,/g, ' ').replace(/\\%/g, '%').replace(/€/g, '€'), nb(n), choix,
        { explication: `Le modèle est une suite géométrique de raison ${m(decL(f))} et de premier terme ${m(entm(v0))} : on cherche le plus petit entier ${m('n')} tel que ${m(`${entm(v0)}\\times ${decL(f)}^n ${croit ? '\\gt' : '\\lt'} ${entm(cible)}`)}. À la calculatrice, on trouve ${m(`n=${n}`)}.`,
          meta: { v0, f, cible, croit } });
    }
    return null;
  }
  function conditionBoucle() {      // algorithme de seuil à compléter
    const p = aleaParmi([2, 3]), q = aleaParmi([0, 1, 2, 3]), a = alea(1, 5), S = alea(30, 400);
    const large = Math.random() < 0.5;               // « u_n ≥ S » ou « u_n > S »
    const expr = (p === 1 ? 'u' : `${p} * u`) + (q ? ` + ${q}` : '');
    const code = ['def seuil(S):', '    n = 0', `    u = ${a}`, '    while ......... :', `        u = ${expr}`, '        n = n + 1', '    return n'];
    const OP = ['u < S', 'u <= S', 'u > S', 'u >= S'];
    const juste = large ? 'u < S' : 'u <= S';
    const objectif = large ? `le plus petit entier ${m('n')} tel que ${m(T`u_n\ge S`)}` : `le plus petit entier ${m('n')} tel que ${m(T`u_n\gt S`)}`;
    const opt2 = o => opt(`<code>${o.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>`, 'cond:' + o);
    return qcm(`Dans la fonction Python suivante, ${m(T`u_0=${a}`)} et ${m(T`u_{n+1}=${p === 1 ? '' : p}u_n${q ? '+' + q : ''}`)}.${CODE(code)}La fonction doit renvoyer ${objectif}. Par quelle condition faut-il remplacer les pointillés ?`,
      opt2(juste), OP.filter(o => o !== juste).map(opt2),
      { explication: `La boucle doit continuer tant que l'objectif n'est pas atteint, donc tant que ${m(large ? T`u_n\lt S` : T`u_n\le S`)}. À la sortie, ${large ? m(T`u_n\ge S`) : m(T`u_n\gt S`)} est vrai pour la première fois.`,
        meta: { a, p, q, large } });
  }

  const retenter = gen => { for (let i = 0; i < 40; i++) { const q = gen(); if (q) return q; } return null; };

  // ==========================================================================
  // 10. Sommes de termes : valeur d'une somme, forme close, limite d'une somme, inégalité de Bernoulli
  //     (le contrôle relit la somme AFFICHÉE et la recalcule terme à terme)
  // ==========================================================================
  const SIGMA = (bas, haut, terme) => T`\displaystyle\sum_{k=${bas}}^{${haut}} ${terme}`;
  const puissK = qd => (qd.d === 1 && qd.v > 0 ? `${qd.n}^{k}` : T`\left(${qd.tex}\right)^{k}`);
  const termeGeo = (c, qd) => (c === 1 ? '' : `${c}\\times `) + puissK(qd);
  // somme exacte de c·(a/b)^k pour k = lo … hi (lo ≥ 0), en fraction irréductible
  function sommeRat(a, b, c, lo, hi) {
    if (hi < lo) return rat(0, 1);
    let num = 0; for (let k = lo; k <= hi; k++) num += Math.pow(a, k) * Math.pow(b, hi - k);
    return rat(c * num, Math.pow(b, hi));
  }
  const ratOpt = r => opt(m(r.tex), r.cle);
  const completer3 = (bonne, candidats, expl, meta, enonce) => {              // 3 mauvaises valeurs distinctes de la bonne
    const vus = new Set([bonne.cle]), faux = [];
    for (const c of candidats) if (c && !vus.has(c.cle)) { vus.add(c.cle); faux.push(c); }
    if (faux.length < 3) return null;
    return qcm(enonce, ratOpt(bonne), faux.slice(0, 3).map(ratOpt), { explication: expl, meta });
  };

  function sommeGeoValeur(niveau) {
    const [a, b] = aleaParmi(niveau === 1 ? [[2, 1], [3, 1], [4, 1], [1, 2], [1, 3], [5, 1]] : [[2, 1], [3, 1], [4, 1], [1, 2], [1, 3], [2, 3], [3, 2], [-2, 1], [-1, 2], [-1, 3], [3, 4], [-3, 1], [1, 4]]);
    const n = alea(3, niveau === 1 ? 7 : 8), k0 = aleaParmi([0, 0, 1]), c = niveau === 1 ? 1 : aleaParmi([1, 1, 2, 3]), qd = rat(a, b);
    const S = (lo, hi) => sommeRat(a, b, c, lo, hi), vraie = S(k0, n);
    return completer3(vraie, [S(k0, n - 1), S(k0, n + 1), k0 > 0 ? S(k0 - 1, n) : S(k0 + 1, n), S(k0 + 1, n)],
      `La somme compte les termes de ${m(`k=${k0}`)} à ${m(`k=${n}`)}, soit ${m(String(n - k0 + 1))} termes ; pour une raison ${m(qd.tex)} on utilise ${m(T`\dfrac{\text{premier terme}\times\left(1-q^{\text{nombre de termes}}\right)}{1-q}`)} : on obtient ${m(vraie.tex)}.`,
      { tipo: 'valeur' }, `Calculer ${m(SIGMA(k0, n, termeGeo(c, qd)))}.`);
  }
  const arithTerme = (a, b) => (b === 0 ? `${coef(a)}k` : T`\left(${coef(a)}k${sgn(b)}\right)`);
  function sommeArith(niveau) {
    const n = aleaParmi(niveau === 1 ? [10, 20, 30, 40, 50, 100] : [10, 12, 15, 20, 24, 30, 40, 50, 60, 100]), a = niveau === 1 ? alea(1, 3) : alea(1, 5), b = niveau === 1 ? alea(0, 2) : alea(-3, 4);
    const v = a * n * (n + 1) / 2 + b * n;
    return completer3(rat(v, 1), [rat(a * n * (n + 1) + b * n, 1), rat(a * n * (n - 1) / 2 + b * n, 1), rat(a * n * (n + 1) / 2 + b * (n + 1), 1), rat(a * n * (n + 1) / 2, 1)],
      `On utilise ${m(T`1+2+\dots+n=\dfrac{n(n+1)}{2}`)} : ${m(T`${a === 1 ? '' : a + '\times '}\dfrac{${n}\times ${n + 1}}{2}${b ? sgn(b) + T`\times ${n}` : ''}=${v}`)}.`,
      { tipo: 'valeur' }, `Calculer ${m(SIGMA(1, n, arithTerme(a, b)))}.`);
  }

  // forme close : les propositions sont des expressions de n, comparées à la somme pour n = 1 … 9
  const termeQ = (c, qd) => termeGeo(c, qd);
  function formeCloseGeo() {
    const [a, b] = aleaParmi([[2, 1], [3, 1], [4, 1], [5, 1], [1, 2], [1, 3]]), c = aleaParmi([1, 1, 2, 3]), qd = rat(a, b), qv = a / b;
    const cc = c === 1 ? '' : String(c), qn = e => (qd.d === 1 ? `${qd.n}^{${e}}` : T`\left(${qd.tex}\right)^{${e}}`);
    const deux = qd.n === 2 && qd.d === 1, pre = c === 1 ? '' : `${c}\\times `;
    const P = x => (c === 1 ? x : T`${c}\left(${x}\right)`);
    const bonne = deux ? P('2^{n+1}-1') : qd.d === 1 ? T`\dfrac{${P(`${qn('n+1')}-1`)}}{${qd.n - 1}}` : T`${pre}\dfrac{1-${qn('n+1')}}{1-${qd.tex}}`;
    const cands = deux ? [P('2^{n}-1'), P('2^{n+1}+1'), T`${pre}2^{n+1}`, P('2^{n}+1'), P('2^{n+2}-1')]
      : qd.d === 1
      ? [T`\dfrac{${P(`${qn('n')}-1`)}}{${qd.n - 1}}`, P(`${qn('n+1')}-1`), T`\dfrac{${P(`${qn('n+1')}-1`)}}{${qd.n}}`, T`\dfrac{${P(`1-${qn('n+1')}`)}}{${qd.n - 1}}`, T`\dfrac{${P(`${qn('n+1')}+1`)}}{${qd.n - 1}}`]
      : [T`${pre}\dfrac{1-${qn('n')}}{1-${qd.tex}}`, T`${pre}\dfrac{1-${qn('n+1')}}{1+${qd.tex}}`, T`${pre}\dfrac{1}{1-${qd.tex}}`, T`${pre}\dfrac{${qn('n+1')}-1}{1-${qd.tex}}`, T`${pre}\left(1-${qn('n+1')}\right)`];
    return formeQuestion(SIGMA(0, 'n', termeQ(c, qd)), bonne, cands,
      `C'est une somme de ${m('n+1')} termes d'une suite géométrique de raison ${m(qd.tex)} et de premier terme ${m(String(c))} : ${m(T`\text{premier terme}\times\dfrac{1-q^{\text{nombre de termes}}}{1-q}`)}.`);
  }
  function formeCloseArith() {
    const a = alea(1, 4), b = alea(-2, 3), un = a === 1 ? '' : String(a);
    const fm = (num, den, reste) => T`\dfrac{${un}${num}}{${den}}${reste}`;
    const reste = x => (x === 0 ? '' : x === 1 ? '+n' : x === -1 ? '-n' : `${sgn(x)}n`);
    const bonne = fm('n(n+1)', 2, reste(b));
    const cands = [fm('n(n+1)', 1, reste(b)), fm('n(n-1)', 2, reste(b)), fm('n(n+1)', 2, b === 0 ? '+1' : `${sgn(b)}\\left(n+1\\right)`), fm('n^{2}', 2, reste(b)), fm('(n+1)^{2}', 2, reste(b))];
    return formeQuestion(SIGMA(1, 'n', arithTerme(a, b)), bonne, cands,
      `${m(T`\sum_{k=1}^{n}k=\dfrac{n(n+1)}{2}`)} et ${m(T`\sum_{k=1}^{n}1=n`)} : la somme vaut ${m(bonne)}.`);
  }
  function formeCloseTelescope() {
    const forme = aleaParmi([0, 1]), terme = forme === 0 ? T`\dfrac{1}{k(k+1)}` : T`\left(\dfrac{1}{k}-\dfrac{1}{k+1}\right)`;
    const bonne = T`\dfrac{n}{n+1}`, cands = [T`\dfrac{n}{n+2}`, T`\dfrac{1}{n+1}`, T`1-\dfrac{1}{n}`, T`\dfrac{n+1}{n+2}`, T`\dfrac{n-1}{n}`];
    return formeQuestion(SIGMA(1, 'n', terme), bonne, cands,
      `${forme === 0 ? `On écrit ${m(T`\dfrac{1}{k(k+1)}=\dfrac{1}{k}-\dfrac{1}{k+1}`)} puis ` : ''}les termes se compensent deux à deux (somme télescopique) : il reste ${m(T`1-\dfrac{1}{n+1}=\dfrac{n}{n+1}`)}.`);
  }
  function formeQuestion(sigma, bonne, cands, expl) {
    const vus = new Set([bonne]), faux = cands.filter(c => !vus.has(c) && vus.add(c));
    if (faux.length < 3) return null;
    return qcm(`Pour tout entier naturel ${m('n')} non nul, ${m(T`S_n=${sigma}`)}. Quelle est l'expression de ${m('S_n')} en fonction de ${m('n')} ?`, { affichage: m(bonne), cle: bonne }, faux.slice(0, 3).map(c => ({ affichage: m(c), cle: c })),
      { explication: expl, meta: { tipo: 'forme' } });
  }

  // limite d'une somme géométrique (nombre de termes infini)
  function limiteSomme(niveau) {
    const [a, b] = aleaParmi(niveau === 2 ? [[1, 2], [1, 3], [2, 3], [3, 4], [1, 4], [2, 5], [1, 5]] : [[1, 2], [1, 3], [2, 3], [-1, 2], [-1, 1], [2, 1], [3, 2], [3, 4], [1, 4], [-1, 3], [-2, 3], [4, 3], [3, 1]]);
    const c = niveau === 2 ? aleaParmi([1, 1, 2, 3]) : aleaParmi([1, 2, 3, 4, 5, 6]), k0 = niveau === 2 ? 0 : aleaParmi([0, 1]), qd = rat(a, b), qv = a / b;
    const Lr = r => opt(`elle converge vers ${m(r.tex)}`, 'lim:' + r.cle), NOL = () => opt(`elle n'a pas de limite`, 'nolim');
    let bonne, faux;
    if (Math.abs(qv) < 1) {                                  // c q^k0 / (1 − q)
      bonne = Lr(rat(c * Math.pow(a, k0) * b, Math.pow(b, k0) * (b - a)));
      faux = [Lr(rat(c * b, b - a)), Lr(rat(Math.pow(a, k0) * b, Math.pow(b, k0) * (b - a))), Lr(rat(c * Math.pow(a, k0), Math.pow(b, k0))), PINF(), NOL()];
    } else if (qv === -1) {
      bonne = NOL();
      faux = [PINF(), Lr(rat(0, 1)), Lr(rat(c, 2)), Lr(rat(c, 1))];
    } else {
      bonne = PINF();
      faux = [Lr(rat(0, 1)), NOL(), Lr(rat(c * b, b - a)), Lr(rat(c, 1))];
    }
    const gen = unique(faux, [bonne.cle, bonne.cle === 'inf' ? '-inf' : '']);
    const vus = new Set([bonne.cle + bonne.affichage]); const f3 = gen.filter(o => !vus.has(o.cle + o.affichage) && (vus.add(o.cle + o.affichage), true));
    if (f3.length < 3) return null;
    const expl = Math.abs(qv) < 1 ? `Somme géométrique de raison ${m(qd.tex)} avec ${m(String(Math.abs(qv)))}${m(T`\lt 1`)} : ${m('S_n')} tend vers ${m(T`\dfrac{\text{premier terme}}{1-q}`)}.`
      : qv === -1 ? `Les sommes partielles valent alternativement ${m(String(c * (k0 === 0 ? 1 : -1)))} et ${m('0')} : ${m('S_n')} n'a pas de limite.` : `La raison ${m(qd.tex)} est supérieure à ${m('1')} : les termes sont positifs et tendent vers ${m(T`+\infty`)}, donc ${m('S_n')} aussi.`;
    return qcm(`On pose ${m(T`S_n=${SIGMA(k0, 'n', termeGeo(c, qd))}`)}. Que peut-on dire de la suite ${m(T`(S_n)`)} ?`, bonne, f3.slice(0, 3), { explication: expl, meta: { tipo: 'limite' } });
  }

  // inégalité de Bernoulli
  function bernoulliInegalite() {
    const general = Math.random() < 0.5;
    if (general) {
      const bonne = T`\left(1+a\right)^{n}\ge 1+na`, cands = [T`\left(1+a\right)^{n}\le 1+na`, T`\left(1+a\right)^{n}\ge 1+na^{2}`, T`\left(1+a\right)^{n}\ge 1+n+a`, T`\left(1+a\right)^{n}\le 1+a^{n}`, T`\left(1+a\right)^{n}\le na`];
      const f = melanger(cands).slice(0, 3);
      return qcm(`Soit ${m('a')} un réel strictement positif. Quelle inégalité est vraie pour tout entier naturel ${m('n')} (inégalité de Bernoulli) ?`, { affichage: m(bonne), cle: bonne }, f.map(c => ({ affichage: m(c), cle: c })),
        { explication: `L'inégalité de Bernoulli s'énonce ${m(T`\left(1+a\right)^{n}\ge 1+na`)} pour tout ${m(T`a\gt 0`)} (et tout ${m('n')} entier naturel). Elle se démontre par récurrence.`, meta: { tipo: 'bernoulli', general } });
    }
    const a = aleaParmi([0.01, 0.02, 0.05, 0.1, 0.2, 0.5]), A = decL(a), base = T`\left(1+${A}\right)^{n}`;
    const bonne = T`${base}\ge 1+${A}n`, cands = [T`${base}\le 1+${A}n`, T`${base}\ge 1+${decL(1 + a)}n`, T`${base}\ge 1+${A}n^{2}`, T`${base}\ge ${decL(1 + a)}+n`, T`${base}\le ${A}n`];
    const f = melanger(cands).slice(0, 3);
    return qcm(`Quelle inégalité est vraie pour tout entier naturel ${m('n')} ? (Utiliser l'inégalité de Bernoulli.)`, { affichage: m(bonne), cle: bonne }, f.map(c => ({ affichage: m(c), cle: c })),
      { explication: `D'après l'inégalité de Bernoulli avec ${m(`a=${A}`)} : ${m(bonne)}.`, meta: { tipo: 'bernoulli', general } });
  }
  function rangBernoulli() {
    const k = aleaParmi([1, 2, 5, 10, 20, 50]), A = aleaParmi([10, 50, 100, 500, 1000]), a = k / 100;
    const n0 = Math.ceil((A - 1) * 100 / k), as = decL(a);
    return completer3(rat(n0, 1), [rat(n0 + 1, 1), rat(n0 - 1, 1), rat(Math.ceil(A * 100 / k), 1), rat(Math.floor((A - 1) * 100 / k), 1)],
      `On résout ${m(`1+${as}n\\ge ${A}`)} : ${m(`n\\ge\\dfrac{${A - 1}}{${as}}`)}, soit ${m(`n\\ge ${(A - 1) * 100 / k}`)} ; le plus petit entier convenable est ${m(String(n0))}.`,
      { tipo: 'rang' }, `Pour tout entier naturel ${m('n')}, ${m(T`\left(1+${as}\right)^{n}\ge 1+${as}n`)} (inégalité de Bernoulli). Quel est le plus petit entier ${m('n')} tel que ${m(`1+${as}n\\ge ${A}`)}, ce qui garantit alors ${m(T`\left(1+${as}\right)^{n}\ge ${A}`)} ?`);
  }

  // ==========================================================================
  // Enregistrement
  // ==========================================================================
  Automatismes.enregistrerBanque('suites', {
    titre: 'Suites',
    familles: {
      'oscillante': famille({ nom: 'limite avec (−1)ⁿ', niveaux: [1, 2, 3], base: n => (n === 1 ? oscillanteN1() : oscillanteN2()), variantes3: [oscillanteN3a, oscillanteN3b, oscillanteN3c], partBase3: 0.15 }),
      'nature': famille({ nom: 'nature d’une suite', niveaux: [1, 2, 3], base: n => (n === 1 ? natureN1() : natureInversion()), variantes3: [natureExpression, natureDecalage], partBase3: 0.2 }),
      'variations': famille({ nom: 'sens de variation', niveaux: [1, 2, 3], base: n => (n === 1 ? sensN1() : recurrenteN2()), variantes3: [recurrenteLimite, recurrenteCarre], partBase3: 0.2 }),
      'gendarmes': famille({ nom: 'gendarmes et comparaison', niveaux: [2, 3], base: () => (Math.random() < 0.3 ? encadrementExplicite() : gendarmesN2()), variantes3: [gendarmesMonotone, comparaisonInfinie, encadrementExplicite], partBase3: 0.2 }),
      'geometrique': famille({ nom: 'suites géométriques et limites', niveaux: [1, 2, 3], base: n => (n === 1 ? geomN1() : geomN2()), variantes3: [geomSomme, geomCroissComparee, geomQuotient, geomQuotientBases], partBase3: 0.1 }),
      'arithmetico-geometrique': famille({ nom: 'suite arithmético-géométrique', niveaux: [1, 2, 3], base: n => (n === 1 ? arithGeoN1() : arithGeoN2()), variantes3: [arithGeoLimite, arithGeoExpression], partBase3: 0.1 }),
      'convergence-monotone': famille({ nom: 'convergence monotone', niveaux: [2, 3], base: () => (Math.random() < 0.25 ? limiteInegalite() : monotoneN2()), variantes3: [adjacentes, limiteInegalite], partBase3: 0.4 }),
      'recurrence': famille({ nom: 'raisonnement par récurrence', niveaux: [2, 3], base: heredite, variantes3: [herediteRacine], partBase3: 0.4 }),
      'sommes': famille({ nom: 'sommes de termes et inégalité de Bernoulli', niveaux: [1, 2, 3], base: n => retenter(() => (n === 1 ? aleaParmi([() => sommeGeoValeur(1), () => sommeArith(1)])() : aleaParmi([() => sommeGeoValeur(2), () => sommeArith(2), formeCloseGeo, formeCloseArith, bernoulliInegalite, () => limiteSomme(2)])())), variantes3: [() => retenter(() => limiteSomme(3)), () => retenter(formeCloseTelescope), () => retenter(rangBernoulli), () => retenter(formeCloseGeo), () => retenter(bernoulliInegalite)], partBase3: 0.1 }),
      'algorithme-seuil': famille({ nom: 'algorithme de seuil', niveaux: [2, 3], base: () => (Math.random() < 0.4 ? (Math.random() < 0.5 ? seuilContexte() : conditionBoucle()) : seuilPython(2)), variantes3: [() => seuilPython(3), seuilContexte, conditionBoucle], partBase3: 0.0 })
    }
  });
})();
