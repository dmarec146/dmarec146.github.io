/* Banque 08 — Algorithmique et programmation en Python (Terminale spécialité)
   Questions à quatre choix inspirées des QCM et affirmations de bac 2022 à 2026 : fonction `seuil` qui renvoie le plus petit
   `n` tel que `u_n` dépasse une valeur, `p = 1 - 0.4**n` (fonction `basket`), balayage `while d(u) > 0: u = u + 0.01`
   (fonction `alpha`), sommes de termes, méthode d'Euler, sommes de rectangles. Voir
   outils/qcm-bac/types-de-questions-2022-2023.md.

   Niveau 1 — les bases : valeur renvoyée par une boucle `for` ou `while` simple, somme, factorielle, nombre de tours.
   Niveau 2 — l'épreuve : seuil d'une suite, somme des termes, comptage, pas d'Euler, instruction à compléter.
   Niveau 3 — plus difficile (pénalités) : suites récurrentes à virgule, balayage, probabilité qui dépasse un seuil, Fibonacci,
              double boucle, Collatz, méthode d'Euler sur plusieurs pas, sommes de rectangles, condition de boucle et valeur renvoyée.

   Le contrôle (outils/qcm-bac/controle-banques.js) EXÉCUTE le programme Python affiché (python3 en mode isolé) : la valeur
   renvoyée est celle du vrai interpréteur, comparée à chaque option. Pour les questions « à compléter », chaque instruction
   proposée est insérée dans le programme et testée contre un programme de référence écrit séparément. */
(function () {
  'use strict';
  const O = Automatismes.outils;
  const { alea, aleaParmi, melanger, m, qcm, famille, decL } = O;

  const CODE = lignes => `<pre style="margin:8px 0;padding:8px 12px;background:#F1EFE8;border-radius:6px;font-size:0.92em;line-height:1.35;overflow-x:auto;text-align:left;font-family:Consolas,'Courier New',monospace">${lignes.join('\n').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
  const cod = t => `<code>${t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>`;
  const retente = gen => niveau => { for (let i = 0; i < 12; i++) { const q = gen(niveau); if (q) return q; } return null; };
  // arrondi comme round() de Python : exact sur la valeur binaire, égalité parfaite -> pair
  const arr = (x, nd) => { const f = Math.pow(10, nd), t = x * f, fl = Math.floor(t), d = t - fl; if (d === 0.5) return (fl % 2 === 0 ? fl : fl + 1) / f; return Number(x.toFixed(nd)); };
  const pn = x => String(Math.round(x * 1e6) / 1e6);                       // décimal pour le code Python (point)
  const nombre = x => (Number.isInteger(x) ? decL(x) : decL(arr(x, 4)));
  const optNum = x => ({ affichage: m(nombre(x)), cle: nombre(x) });

  // valeurs fausses (sans doublon, différentes de la vraie, finies, de taille raisonnable)
  function fausses(vrai, liste) {
    const vus = new Set([nombre(vrai)]), res = [];
    for (const x of melanger(liste)) { if (!Number.isFinite(x) || Math.abs(x) > 1e9 || vus.has(nombre(x))) continue; vus.add(nombre(x)); res.push(x); }
    return res;
  }
  const lecture = (lignes, appel, vrai, mauvaises, expl, extra) => {
    const f = fausses(vrai, mauvaises); if (f.length < 3) return null;
    return qcm(`On considère la fonction Python suivante.${CODE(lignes)}Que renvoie l'appel ${cod(appel)} ?`, optNum(vrai), f.slice(0, 3).map(optNum),
      { explication: expl, meta: Object.assign({ tipo: 'lecture', code: lignes.join('\n'), appel }, extra || {}) });
  };

  // ==========================================================================
  // 1. Lecture de programmes
  // ==========================================================================
  const TERMES = [['k', k => k], ['k*k', k => k * k], ['2*k+1', k => 2 * k + 1], ['k*(k+1)', k => k * (k + 1)], ['3*k-1', k => 3 * k - 1], ['k*k*k', k => k * k * k]];
  function sommeFor() {
    const [t, f] = aleaParmi(TERMES), n = alea(3, 8);
    const S = (a, b) => { let s = 0; for (let k = a; k < b; k++) s += f(k); return s; };
    const lignes = ['def f(n):', '    s = 0', '    for k in range(1, n + 1):', `        s = s + ${t}`, '    return s'];
    return lecture(lignes, `f(${n})`, S(1, n + 1), [S(0, n), S(1, n), S(2, n + 1), S(0, n + 1), S(1, n + 2)],
      `La boucle ajoute ${t} pour ${'`k`'.replace(/`/g, '')} = 1, 2, …, ${n} : ${m(Array.from({ length: n }, (_, i) => f(i + 1)).join('+'))}.`);
  }
  function suiteFor() {
    const u0 = alea(1, 4), a = aleaParmi([2, 3, 2, -1]), b = aleaParmi([-3, -1, 1, 2, 3, 5]), n = alea(3, 6);
    const U = k => { let u = u0; for (let i = 0; i < k; i++) u = a * u + b; return u; };
    const lignes = ['def f(n):', `    u = ${u0}`, '    for i in range(n):', `        u = ${a === 1 ? '' : a + ' * '}u ${b < 0 ? '-' : '+'} ${Math.abs(b)}`, '    return u'];
    return lecture(lignes, `f(${n})`, U(n), [U(n - 1), U(n + 1), U(n - 2), u0, U(n) + b], `La boucle s'exécute ${n} fois (${m('i=0')} à ${m(`i=${n - 1}`)}) : on calcule ${m(`u_{${n}}`)} avec ${m(`u_0=${u0}`)} et ${m(`u_{k+1}=${a}u_k${b < 0 ? '-' : '+'}${Math.abs(b)}`)}, soit ${m(Array.from({ length: n + 1 }, (_, k) => U(k)).join(',\\;'))}.`);
  }
  function seuilWhile(retourN) {
    const u0 = alea(1, 4), a = aleaParmi([2, 2, 3]), b = aleaParmi([0, 1, 2, 3]), S = alea(40, 600);
    const run = (cmp) => { let u = u0, n = 0; while (cmp(u)) { u = a * u + b; n++; if (n > 200) return null; } return { u, n }; };
    const r = run(x => x < S), rE = run(x => x <= S);
    if (!r || r.n < 3) return null;
    const lignes = ['def seuil(S):', '    n = 0', `    u = ${u0}`, '    while u < S:', `        u = ${a} * u${b ? ' + ' + b : ''}`, '        n = n + 1', retourN ? '    return n' : '    return u'];
    const vrai = retourN ? r.n : r.u;
    return lecture(lignes, `seuil(${S})`, vrai, retourN ? [r.n - 1, r.n + 1, r.u, rE.n, r.n * 2] : [r.u / a - (b ? b / a : 0), r.u * a + b, r.n, rE.u, r.u - b],
      `On calcule les termes tant qu'ils sont inférieurs à ${m(String(S))} : ${m(`u_0=${u0}`)}, puis ${m(`u_{n+1}=${a}u_n${b ? '+' + b : ''}`)}. La boucle s'arrête dès que ${m(`u\\ge ${S}`)}, pour ${m(`n=${r.n}`)} et ${m(`u=${r.u}`)}.`);
  }
  const fact = () => { const n = alea(3, 7); let p = 1; const P = k => { let q = 1; for (let i = 2; i <= k; i++) q *= i; return q; };
    return lecture(['def f(n):', '    p = 1', '    for k in range(2, n + 1):', '        p = p * k', '    return p'], `f(${n})`, P(n), [P(n - 1), P(n + 1), n * n, n * (n - 1), P(n) / 2], `${m(`${n}!=${Array.from({ length: n }, (_, i) => i + 1).join('\\times ')}=${P(n)}`)} : la boucle calcule la factorielle.`); };
  function fibo() {
    const n = alea(4, 10), F = k => { let a = 0, b = 1; for (let i = 0; i < k; i++) [a, b] = [b, a + b]; return a; };
    return lecture(['def f(n):', '    a = 0', '    b = 1', '    for i in range(n):', '        a, b = b, a + b', '    return a'], `f(${n})`, F(n), [F(n + 1), F(n - 1), F(n + 2), F(n) + F(n + 1) - 1], `On obtient les termes de la suite de Fibonacci : 0, 1, 1, 2, 3, 5, 8, … ; après ${n} tours, ${m('a')} vaut ${m(`F_{${n}}=${F(n)}`)}.`);
  }
  function multiples() {
    const N = alea(15, 60), a = aleaParmi([2, 3]), b = aleaParmi([5, 7]), ou = Math.random() < 0.6;
    const C = (N2, et) => { let c = 0; for (let k = 1; k <= N2; k++) if (et ? (k % a === 0 && k % b === 0) : (k % a === 0 || k % b === 0)) c++; return c; };
    const lignes = ['def compter(N):', '    c = 0', '    for k in range(1, N + 1):', `        if k % ${a} == 0 ${ou ? 'or' : 'and'} k % ${b} == 0:`, '            c = c + 1', '    return c'];
    let c0 = 0; for (let k = 1; k <= N; k++) if (ou ? (k % a === 0 || k % b === 0) : (k % a === 0 && k % b === 0)) c0++;
    return lecture(lignes, `compter(${N})`, c0, [C(N, !ou), Math.floor(N / a) + Math.floor(N / b) + (ou ? 0 : 1), Math.floor(N / a), Math.floor(N / b), c0 + 1, c0 - 1],
      `La condition ${ou ? 'est vraie pour les multiples de ' + m(String(a)) + ' ou de ' + m(String(b)) : 'n\'est vraie que pour les multiples communs de ' + m(String(a)) + ' et ' + m(String(b))} : ${m(String(c0))} entiers entre ${m('1')} et ${m(String(N))}.`);
  }
  function doubleBoucle() {
    const n = alea(4, 9), mod = aleaParmi([2, 3]);
    const C = (strict) => { let c = 0; for (let i = 1; i <= n; i++) for (let j = strict ? i + 1 : i; j <= n; j++) if ((i + j) % mod === 0) c++; return c; };
    const lignes = ['def f(n):', '    c = 0', '    for i in range(1, n + 1):', '        for j in range(i, n + 1):', `            if (i + j) % ${mod} == 0:`, '                c = c + 1', '    return c'];
    return lecture(lignes, `f(${n})`, C(false), [C(true), C(false) * 2 - Math.floor(n / mod), C(false) + n, Math.floor(n * n / mod), C(false) - 1], `On compte les couples ${m('(i,j)')} avec ${m(`1\\le i\\le j\\le ${n}`)} dont la somme est un multiple de ${m(String(mod))} (le cas ${m('j=i')} est inclus) : ${m(String(C(false)))}.`);
  }
  function collatz() {
    const n0 = alea(3, 20), pas = k => { let c = 0; while (k !== 1) { k = k % 2 === 0 ? k / 2 : 3 * k + 1; c++; } return c; };
    const lignes = ['def f(n):', '    c = 0', '    while n != 1:', '        if n % 2 == 0:', '            n = n // 2', '        else:', '            n = 3 * n + 1', '        c = c + 1', '    return c'];
    const v = pas(n0); const suite = []; let k = n0; while (k !== 1) { suite.push(k); k = k % 2 === 0 ? k / 2 : 3 * k + 1; } suite.push(1);
    return lecture(lignes, `f(${n0})`, v, [v + 1, v - 1, pas(n0 + 1), Math.max(...suite), suite.length + 1], `Les valeurs successives de ${m('n')} sont ${m(suite.join(',\\;'))} : il y a ${v} passages dans la boucle.`);
  }
  function balayage() {
    const a = aleaParmi([2, 3, 5, 6, 7, 8]), pas = aleaParmi([0.01, 0.1]), u0 = aleaParmi([0, 0.5, 1]);
    const lignes = ['def d(x):', `    return ${a} - x * x`, '', 'def alpha():', `    u = ${u0}`, '    while d(u) > 0:', `        u = u + ${pas}`, '    return round(u, 2)'];
    let u = u0; while (a - u * u > 0 && u < 50) u = u + pas;
    const v = arr(u, 2), r = Math.sqrt(a);
    return lecture(lignes, 'alpha()', v, [arr(u - pas, 2), arr(u + pas, 2), arr(r, 2), arr(r, 1), arr(a / 2, 2), arr(Math.floor(r), 2)], `On avance par pas de ${m(nombre(pas))} depuis ${m(nombre(u0))} tant que ${m(`${a}-u^2>0`)} : la boucle s'arrête au premier ${m('u')} (de la forme ${m(`${nombre(u0)}+k\\times ${nombre(pas)}`)}) pour lequel ${m(`u^2\\ge ${a}`)}, soit ${m(nombre(v))} (valeur approchée par excès de ${m(`\\sqrt{${a}}`)}).`);
  }
  function probaSeuil() {
    const q = aleaParmi([0.4, 0.5, 0.3, 0.6, 0.2]), s = aleaParmi([0.9, 0.95, 0.99, 0.999, 0.9999]);
    let n = 1, p = 1 - q; while (p < s) { n++; p = 1 - Math.pow(q, n); }
    const sim = (cmp, init) => { let nn = init, pp = 1 - Math.pow(q, init); while (cmp(pp)) { nn++; pp = 1 - Math.pow(q, nn); } return nn; };
    const lignes = ['def basket():', `    p = ${pn(1 - q)}`, '    n = 1', `    while p < ${pn(s)}:`, '        n = n + 1', `        p = 1 - ${pn(q)} ** n`, '    return n'];
    return lecture(lignes, 'basket()', n, [n - 1, n + 1, sim(x => x <= s, 1), n + 2, Math.round(n / 2), n - 2], `Après ${m('n')} tours, ${m(`p=1-${nombre(q)}^{n}`)}. On cherche le plus petit ${m('n')} tel que ${m(`1-${nombre(q)}^{n}\\ge ${nombre(s)}`)}, soit ${m(`${nombre(q)}^{n}\\le ${nombre(1 - s)}`)} : ${m(`n=${n}`)}.`);
  }
  function suiteProba() {
    const a = aleaParmi([0.5, 0.6, 0.4, 0.7]), b = aleaParmi([0.2, 0.3, 0.25]), p0 = aleaParmi([0, 0.5, 0.1]);
    const lim = b / (1 - a), s = arr(p0 + (lim - p0) * aleaParmi([0.6, 0.75, 0.9]), 2);
    if (!(s > p0 && s < lim - 0.01)) return null;
    let n = 0, p = p0; while (p < s) { p = a * p + b; n++; if (n > 100) return null; }
    const sim = (cmp) => { let nn = 0, pp = p0; while (cmp(pp)) { pp = a * pp + b; nn++; if (nn > 100) return null; } return nn; };
    const lignes = ['def seuil():', '    n = 0', `    p = ${pn(p0)}`, `    while p < ${pn(s)}:`, '        n = n + 1', `        p = p * ${pn(a)} + ${pn(b)}`, '    return n'];
    return lecture(lignes, 'seuil()', n, [n - 1, n + 1, n + 2, sim(x => x <= s), 1], `La suite ${m(`p_{n+1}=${nombre(a)}p_n+${nombre(b)}`)} part de ${m(`p_0=${nombre(p0)}`)}. On calcule ses termes jusqu'à dépasser ${m(nombre(s))} (valeur limite ${m(nombre(arr(lim, 4)))}) : ${m(`n=${n}`)}.`);
  }
  function decroissant() {
    const U0 = aleaParmi([100, 200, 64, 500]), r = aleaParmi([0.5, 0.8, 0.9, 0.25]), S = aleaParmi([1, 5, 10, 20, 0.5].filter(x => x < U0 / 4));
    let u = U0, n = 0; while (u > S) { u = u * r; n++; if (n > 500) return null; }
    const sim = cmp => { let uu = U0, nn = 0; while (cmp(uu)) { uu = uu * r; nn++; if (nn > 500) return null; } return nn; };
    const lignes = ['def f(S):', '    n = 0', `    u = ${pn(U0)}`, '    while u > S:', `        u = u * ${pn(r)}`, '        n = n + 1', '    return n'];
    return lecture(lignes, `f(${pn(S)})`, n, [n - 1, n + 1, sim(x => x >= S), n + 2, Math.round(U0 / S)], `${m(`u_n=${nombre(U0)}\\times ${nombre(r)}^{n}`)} : la boucle s'arrête au premier ${m('n')} tel que ${m(`u_n\\le ${nombre(S)}`)}, soit ${m(`n=${n}`)}.`);
  }
  function sommeTermes() {
    const u0 = alea(1, 3), a = aleaParmi([2, 3]), b = aleaParmi([-1, 1, 2]), n = alea(3, 6);
    const U = k => { let u = u0; for (let i = 0; i < k; i++) u = a * u + b; return u; };
    const somme = (k) => { let s = 0; for (let i = 0; i < k; i++) s += U(i); return s; };
    const lignes = ['def f(n):', '    s = 0', `    u = ${u0}`, '    for k in range(n):', '        s = s + u', `        u = ${a} * u ${b < 0 ? '-' : '+'} ${Math.abs(b)}`, '    return s'];
    return lecture(lignes, `f(${n})`, somme(n), [somme(n + 1), somme(n - 1), U(n), somme(n) - u0, somme(n + 1) - u0], `La variable ${m('s')} reçoit ${m(`u_0`)}, ${m('u_1')}, …, ${m(`u_{${n - 1}}`)} : ${m(Array.from({ length: n }, (_, i) => U(i)).join('+'))}${m('=' + somme(n))}.`);
  }

  // ==========================================================================
  // 2. Méthode d'Euler
  // ==========================================================================
  function euler(niveau) {
    const t = niveau === 2 ? aleaParmi(['formule', 'code', 'formule']) : aleaParmi(['code', 'ratio', 'code-t']);
    const a = aleaParmi([1, 2, -1, -2, 3, 0.5]), b = aleaParmi([0, 1, 2, -1, 3]), y0 = aleaParmi([1, 2, -1, 3]), h = aleaParmi([0.1, 0.2, 0.5, 0.25]);
    const eq = `y'=${a === 1 ? '' : a === -1 ? '-' : nombre(a)}y${b === 0 ? '' : (b < 0 ? '-' : '+') + Math.abs(b)}`;
    if (t === 'formule') {
      const y1 = y0 + h * (a * y0 + b);
      const f = fausses(y1, [y0 + a * y0 + b, h * (a * y0 + b), y0 + h * a * y0, y0 + h * b, y0 + h * (a * y0 + b) * 2, y0 + (a * y0 + b) / h]);
      if (f.length < 3) return null;
      return qcm(`La méthode d'Euler de pas ${m('h')} pour ${m("y'=ay+b")} consiste à poser ${m('y_{k+1}=y_k+h\\,(ay_k+b)')}. On l'applique à l'équation ${m(eq)} avec ${m(`y(0)=${y0}`)} et ${m(`h=${nombre(h)}`)}. Quelle est la valeur de ${m('y_1')} ?`, optNum(y1), f.slice(0, 3).map(optNum),
        { explication: `${m(`y_1=y_0+h(ay_0+b)=${y0}+${nombre(h)}\\times(${nombre(a)}\\times ${y0}${b < 0 ? '-' : '+'}${Math.abs(b)})=${nombre(y1)}`)}.`, meta: { tipo: 'euler', kind: 'formule', a, b, y0, h } });
    }
    if (t === 'ratio') {
      const aa = aleaParmi([1, 2, -1, 3, -2]), hh = aleaParmi([0.1, 0.2, 0.5, 0.25]);
      const r = 1 + hh * aa; if (Math.abs(r) < 1e-9) return null; const f = fausses(r, [hh * aa, hh + aa, 1 - hh * aa, aa, 1 + hh, 1 / (1 - hh * aa)]);
      if (f.length < 3) return null;
      return qcm(`On applique la méthode d'Euler de pas ${m(`h=${nombre(hh)}`)} à l'équation différentielle ${m(`y'=${aa === 1 ? '' : aa === -1 ? '-' : aa}y`)} avec ${m('y(0)=1')}. La suite ${m('(y_k)')} obtenue est géométrique ; quelle est sa raison ?`, optNum(r), f.slice(0, 3).map(optNum),
        { explication: `${m(`y_{k+1}=y_k+h\\times ${aa === 1 ? '' : aa}y_k=(1+${nombre(hh)}\\times ${aa})\\,y_k`.replace('1\\times ', '').replace('+-', '-'))} : raison ${m(nombre(r))}.`, meta: { tipo: 'euler', kind: 'ratio', a: aa, h: hh } });
    }
    const n = alea(3, 6), avecT = t === 'code-t';
    let y = y0; const code = [];
    if (avecT) {
      const c = aleaParmi([1, 2, 3]); let tt = 0, yy = 0; for (let k = 0; k < n; k++) { yy = yy + h * (c * tt); tt = tt + h; }
      const lignes = ['def euler(n):', '    y = 0', '    t = 0', `    h = ${pn(h)}`, '    for k in range(n):', `        y = y + h * ${c} * t`, '        t = t + h', '    return round(y, 4)'];
      const sim = (nn, ordre) => { let y2 = 0, t2 = 0; for (let k = 0; k < nn; k++) { if (ordre) { t2 = t2 + h; y2 = y2 + h * c * t2; } else { y2 = y2 + h * c * t2; t2 = t2 + h; } } return y2; };
      return lecture(lignes, `euler(${n})`, arr(yy, 4), [arr(sim(n, true), 4), arr(sim(n + 1, false), 4), arr(sim(n - 1, false), 4), arr(c * (n * h) * (n * h) / 2, 4), arr(c * n * h, 4)].map(x => x), `C'est la méthode d'Euler pour ${m(`y'=${c}t`)} avec ${m('y(0)=0')} : on ajoute ${m(`h\\times ${c}t_k`)} à chaque pas, avec ${m(`t_k=k\\times ${nombre(h)}`)}. Après ${n} pas, ${m(`y\\approx ${nombre(arr(yy, 4))}`)} (la solution exacte ${m(`${c === 1 ? '' : c}t^2/2`.replace('t^2/2', '\\dfrac{t^2}{2}'))} vaut ${m(nombre(arr(c * (n * h) * (n * h) / 2, 4)))}).`, { kind: 'code' });
    }
    if (Math.abs(a * y0 + b) < 1e-9) return null;
    for (let k = 0; k < n; k++) y = y + h * (a * y + b);
    const lignes = ['def euler(n):', `    y = ${y0}`, `    h = ${pn(h)}`, '    for k in range(n):', `        y = y + h * (${a < 0 ? '(' + a + ')' : a} * y ${b < 0 ? '-' : '+'} ${Math.abs(b)})`, '    return round(y, 4)'];
    const sim = nn => { let y2 = y0; for (let k = 0; k < nn; k++) y2 = y2 + h * (a * y2 + b); return arr(y2, 4); };
    return lecture(lignes, `euler(${n})`, arr(y, 4), [sim(n - 1), sim(n + 1), sim(n + 2), arr(y0 + n * h * (a * y0 + b), 4), arr(y0 + h * (a * y0 + b), 4)], `On répète ${n} fois ${m(`y_{k+1}=y_k+${nombre(h)}\\,(${nombre(a)}y_k${b < 0 ? '-' : '+'}${Math.abs(b)})`)} à partir de ${m(`y_0=${y0}`)} : ${m(`y_{${n}}\\approx ${nombre(arr(y, 4))}`)}.`, { kind: 'code' });
  }

  // ==========================================================================
  // 3. Sommes de rectangles
  // ==========================================================================
  const FONCTIONS = [['x**2', x => x * x, 'x^2', 0, 1], ['x**2', x => x * x, 'x^2', 0, 2], ['2*x + 1', x => 2 * x + 1, '2x+1', 0, 2], ['1 / x', x => 1 / x, '\\dfrac{1}{x}', 1, 2], ['x**3', x => x * x * x, 'x^3', 0, 2], ['x', x => x, 'x', 0, 4]];
  function rectangles(niveau) {
    const [src, f, tex, a, b] = aleaParmi(FONCTIONS), n = aleaParmi([4, 5, 8, 10]), h = (b - a) / n, mode = aleaParmi(['gauche', 'droite', 'gauche']);
    if (niveau === 3 && Math.random() < 0.35) {
      const croiss = f(b) > f(a);
      return qcm(`On considère la fonction ${m(`f(x)=${tex}`)} sur ${m(`[${a}\\,;${b}]`)} et la somme ${m(`S_n`)} des aires de ${m('n')} rectangles de même largeur, dont la hauteur est la valeur de ${m('f')} à l'extrémité gauche de chaque sous-intervalle. Que peut-on dire de ${m('S_n')} par rapport à ${m(`I=\\displaystyle\\int_{${a}}^{${b}} f(x)\\,\\mathrm{d}x`)} ?`,
        { affichage: croiss ? `${m('S_n\\le I')} : c'est un minorant de l'intégrale` : `${m('S_n\\ge I')} : c'est un majorant de l'intégrale`, cle: croiss ? 'minorant' : 'majorant' },
        [{ affichage: croiss ? `${m('S_n\\ge I')} : c'est un majorant de l'intégrale` : `${m('S_n\\le I')} : c'est un minorant de l'intégrale`, cle: croiss ? 'majorant' : 'minorant' }, { affichage: `${m('S_n=I')} pour tout entier ${m('n')}`, cle: 'egal' }, { affichage: `on ne peut rien dire sans calculer ${m('I')}`, cle: 'rien' }],
        { explication: `${m('f')} est ${croiss ? 'croissante' : 'décroissante'} sur ${m(`[${a}\\,;${b}]`)} : sur chaque sous-intervalle, la valeur à gauche est ${croiss ? 'la plus petite' : 'la plus grande'}, donc les rectangles sont ${croiss ? 'sous' : 'au-dessus de'} la courbe.`, meta: { tipo: 'rectangles', kind: 'claim', fTex: croiss ? tex : tex, a, b } });
    }
    const lignes = ['def rect(n):', `    a = ${a}`, `    b = ${b}`, '    h = (b - a) / n', '    s = 0', mode === 'gauche' ? '    for k in range(n):' : '    for k in range(1, n + 1):', `        x = a + k * h`, `        s = s + h * (${src})`, '    return round(s, 4)'];
    const S = (decal) => { let s = 0; for (let k = 0; k < n; k++) s += h * f(a + (k + decal) * h); return arr(s, 4); };
    const vrai = mode === 'gauche' ? S(0) : S(1), mid = S(0.5);
    return lecture(lignes, `rect(${n})`, vrai, [mode === 'gauche' ? S(1) : S(0), mid, arr(vrai * h, 4), arr(vrai / h, 4), arr(vrai + h, 4)], `La largeur d'un rectangle est ${m(`h=\\dfrac{${b}-${a}}{${n}}=${nombre(h)}`)} ; la boucle ${mode === 'gauche' ? `utilise les abscisses ${m(`a+kh`)} pour ${m(`k=0,\\ldots,${n - 1}`)} (extrémités gauches)` : `utilise les abscisses ${m(`a+kh`)} pour ${m(`k=1,\\ldots,${n}`)} (extrémités droites)`} : ${m(`S\\approx ${nombre(vrai)}`)}.`, { kind: 'code' });
  }

  // ==========================================================================
  // 4. Instruction ou condition à compléter
  // ==========================================================================
  const complete = (enonceLignes, question, bonne, faux, expl, meta) => {
    const f = faux.filter((x, i, a) => x !== bonne && a.indexOf(x) === i); if (f.length < 3) return null;
    const o = x => ({ affichage: cod(x), cle: x });
    return qcm(`${enonceLignes.avant}${CODE(enonceLignes.lignes)}${question}`, o(bonne), f.slice(0, 3).map(o), { explication: expl, meta: Object.assign({ tipo: 'completer' }, meta) });
  };
  function completerCondition() {
    const mode = aleaParmi(['croissante', 'decroissante']), strict = Math.random() < 0.5;
    const appelsDe = termes => { const S = [termes[1], termes[2], termes[3], termes[3] + 1, termes[2] - 1, termes[4]]; return { appels: S.map(x => `seuil(${x})`), appelRef: S.map(x => `ref(${x})`) }; };
    if (mode === 'croissante') {
      const u0 = alea(1, 4), a = aleaParmi([2, 3]), b = alea(0, 3), S = alea(30, 400);
      const T = [u0]; for (let i = 0; i < 6; i++) T.push(a * T[i] + b);
      const bonne = strict ? 'u <= S' : 'u < S';
      const tpl = ['def seuil(S):', '    n = 0', `    u = ${u0}`, '    while {}:', `        u = ${a} * u${b ? ' + ' + b : ''}`, '        n = n + 1', '    return n'];
      const ref = ['def ref(S):', '    n = 0', `    u = ${u0}`, `    while not (u ${strict ? '>' : '>='} S):`, `        u = ${a} * u${b ? ' + ' + b : ''}`, '        n = n + 1', '    return n'];
      return complete({ avant: `On définit ${m(`u_0=${u0}`)} et ${m(`u_{n+1}=${a}u_n${b ? '+' + b : ''}`)}. Dans la fonction suivante, les pointillés sont à remplacer par une condition.`, lignes: tpl.map(l => l.replace('{}', '…')) },
        `La fonction doit renvoyer le plus petit entier ${m('n')} tel que ${m(strict ? `u_n>S` : `u_n\\ge S`)}. Quelle condition faut-il écrire ?`, bonne, ['u < S', 'u <= S', 'u > S', 'u >= S', 'u == S', 'u != S'].filter(x => x !== bonne),
        `On continue tant que l'objectif n'est pas atteint : tant que ${strict ? m('u_n\\le S') : m('u_n\\lt S')}.`,
        Object.assign({ template: tpl, ref }, appelsDe(T)));
    }
    const U0 = aleaParmi([64, 100, 500]), r = aleaParmi([0.5, 0.25]), bonne = strict ? 'u >= S' : 'u > S';
    const T = [U0]; for (let i = 0; i < 6; i++) T.push(T[i] * r);
    const tpl = ['def seuil(S):', '    n = 0', `    u = ${U0}`, '    while {}:', `        u = u * ${r}`, '        n = n + 1', '    return n'];
    const ref = ['def ref(S):', '    n = 0', `    u = ${U0}`, `    while not (u ${strict ? '<' : '<='} S):`, `        u = u * ${r}`, '        n = n + 1', '    return n'];
    return complete({ avant: `On définit ${m(`u_0=${U0}`)} et ${m(`u_{n+1}=${nombre(r)}\\,u_n`)}. Dans la fonction suivante, les pointillés sont à remplacer par une condition.`, lignes: tpl.map(l => l.replace('{}', '…')) },
      `La fonction doit renvoyer le plus petit entier ${m('n')} tel que ${m(strict ? 'u_n\\lt S' : 'u_n\\le S')}. Quelle condition faut-il écrire ?`, bonne, ['u < S', 'u <= S', 'u > S', 'u >= S', 'u == S', 'u != S'].filter(x => x !== bonne),
      `La suite décroît : on continue tant que ${m(strict ? 'u_n\\ge S' : 'u_n\\gt S')}, c'est-à-dire tant que l'objectif n'est pas atteint.`, Object.assign({ template: tpl, ref }, appelsDe(T)));
  }
  function completerRetour() {
    const u0 = alea(1, 4), a = aleaParmi([2, 3]), b = alea(0, 3), cible = aleaParmi(['n', 'u']);
    const tpl = ['def seuil(S):', '    n = 0', `    u = ${u0}`, '    while u < S:', `        u = ${a} * u${b ? ' + ' + b : ''}`, '        n = n + 1', '    {}'];
    const ref = ['def ref(S):', '    n = 0', `    u = ${u0}`, '    while u < S:', `        u = ${a} * u${b ? ' + ' + b : ''}`, '        n = n + 1', cible === 'n' ? '    return n' : '    return u'];
    const bonne = cible === 'n' ? 'return n' : 'return u';
    return complete({ avant: `On définit ${m(`u_0=${u0}`)} et ${m(`u_{n+1}=${a}u_n${b ? '+' + b : ''}`)}. Il manque la dernière instruction de la fonction suivante.`, lignes: tpl.map(l => l.replace('{}', '…')) },
      cible === 'n' ? `La fonction doit renvoyer le plus petit entier ${m('n')} tel que ${m('u_n\\ge S')}. Quelle instruction faut-il écrire ?` : `La fonction doit renvoyer le premier terme de la suite supérieur ou égal à ${m('S')}. Quelle instruction faut-il écrire ?`,
      bonne, ['return n', 'return n - 1', 'return n + 1', 'return u', 'return u - 1', 'return S'].filter(x => x !== bonne && !(cible === 'n' && x === 'return u') && !(cible === 'u' && x === 'return n')).concat(cible === 'n' ? ['return u'] : ['return n']),
      `À la sortie de la boucle, ${m('u')} est le premier terme supérieur ou égal à ${m('S')} et ${m('n')} son indice : ${cible === 'n' ? 'on renvoie ' + m('n') : 'on renvoie ' + m('u')}.`, { template: tpl, ref, appels: ['seuil(50)', 'seuil(100)', 'seuil(9)'], appelRef: ['ref(50)', 'ref(100)', 'ref(9)'] });
  }
  function completerSomme() {
    const t = aleaParmi([['1/k', 'k'], ['1/(k*k)', 'k'], ['k*k', 'k'], ['2*k+1', 'k']]), [terme] = t;
    const bonne = `s = s + ${terme}`, N = alea(4, 8);
    const tpl = ['def f(N):', '    s = 0', '    for k in range(1, N + 1):', '        {}', '    return s'];
    const ref = ['def ref(N):', `    return sum(${terme} for k in range(1, N + 1))`];
    const descr = { '1/k': `1+\\dfrac{1}{2}+\\cdots+\\dfrac{1}{N}`, '1/(k*k)': `1+\\dfrac{1}{4}+\\cdots+\\dfrac{1}{N^2}`, 'k*k': '1^2+2^2+\\cdots+N^2', '2*k+1': '3+5+\\cdots+(2N+1)' }[terme];
    const autres = ['s = s + 1/k', 's = s + k', 's = s + 1/(k + 1)', 's = 1/k', 's = s * k', 's = s + k*k', 's = s + 1/(k*k)', 's = s + 2*k', 's = s + 2*k+1', 's = s + 1/(k*k+1)'].filter(x => x !== bonne);
    return complete({ avant: 'Il manque une instruction dans la fonction suivante.', lignes: tpl.map(l => l.replace('{}', '…')) }, `La fonction doit renvoyer la somme ${m(descr)}. Quelle instruction faut-il écrire à la place des pointillés ?`, bonne, autres,
      `À chaque tour, ${m('k')} prend les valeurs ${m('1')} à ${m('N')} et on ajoute le terme général : ${cod(bonne)}.`, { template: tpl, ref, appels: [`f(${N})`, 'f(3)', 'f(6)'], appelRef: [`ref(${N})`, 'ref(3)', 'ref(6)'] });
  }
  function completerEuler() {
    const a = aleaParmi([2, 3, -1, 0.5]), b = aleaParmi([1, 2, -1]), y0 = aleaParmi([1, 2]), h = aleaParmi([0.1, 0.2, 0.5]);
    if (Math.abs(a * y0 + b) < 1e-9) return null;
    const bonne = 'y = y + h * (a * y + b)';
    const tpl = ['def euler(n):', `    a = ${a}`, `    b = ${b}`, `    h = ${h}`, `    y = ${y0}`, '    for k in range(n):', '        {}', '    return y'];
    const ref = ['def ref(n):', `    y = ${y0}`, '    for k in range(n):', `        y = y + ${h} * (${a} * y + ${b})`, '    return y'];
    return complete({ avant: `On applique la méthode d'Euler de pas ${m(`h=${nombre(h)}`)} à ${m(`y'=${nombre(a)}y${b < 0 ? '-' : '+'}${Math.abs(b)}`)} avec ${m(`y(0)=${y0}`)}. Il manque l'instruction de mise à jour.`, lignes: tpl.map(l => l.replace('{}', '…')) },
      `Quelle instruction faut-il écrire à la place des pointillés ?`, bonne, ['y = y + (a * y + b)', 'y = y + h * a * y + b', 'y = h * (a * y + b)', 'y = y + h * a * (y + b)', 'y = y * (1 + h) * a + b', 'y = y + h * (a + b * y)'],
      `${m("y_{k+1}=y_k+h\\,(ay_k+b)")} s'écrit ${cod(bonne)}.`, { template: tpl, ref, appels: ['euler(3)', 'euler(5)', 'euler(1)'], appelRef: ['ref(3)', 'ref(5)', 'ref(1)'] });
  }
  const completer = niveau => (niveau === 2 ? aleaParmi([completerCondition, completerRetour, completerSomme])() : aleaParmi([completerCondition, completerEuler, completerSomme, completerRetour])());

  // ==========================================================================
  // Registre
  // ==========================================================================
  const lectureNiveau = niveau => aleaParmi(niveau === 1 ? [sommeFor, suiteFor, () => seuilWhile(true), () => seuilWhile(false), fact] : niveau === 2 ? [sommeFor, suiteFor, () => seuilWhile(true), multiples, sommeTermes, fibo, decroissant] : [balayage, probaSeuil, suiteProba, doubleBoucle, collatz, sommeTermes, decroissant, fibo])();
  Automatismes.enregistrerBanque('algorithmique', {
    titre: 'Algorithmique et Python',
    familles: {
      'lecture': famille({ nom: 'lecture d’un programme', niveaux: [1, 2, 3], base: retente(lectureNiveau) }),
      'euler': famille({ nom: 'méthode d’Euler', niveaux: [2, 3], base: retente(euler) }),
      'rectangles': famille({ nom: 'sommes de rectangles', niveaux: [3], base: retente(rectangles) }),
      'completer': famille({ nom: 'instruction ou condition à compléter', niveaux: [2, 3], base: retente(completer) })
    }
  });
})();
