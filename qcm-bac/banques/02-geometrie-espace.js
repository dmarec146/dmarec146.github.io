/* Banque 02 — Géométrie dans l'espace (Terminale spécialité), sans figure
   Questions à quatre choix inspirées des affirmations des sujets de bac 2024 à 2026 (alignement, vecteurs
   formant une base, représentations paramétriques, produit scalaire, plans, distances). Aucune figure : les
   énoncés donnent des coordonnées dans un repère orthonormé, comme la plupart des sujets.

   Niveau 1 — les bases : points alignés, vecteur directeur, point d'une droite, produit scalaire, vecteur normal.
   Niveau 2 — l'épreuve : valeur de m, base de l'espace, représentation paramétrique, point d'un plan,
              orthogonalité, équation de plan, position relative d'une droite et d'un plan.
   Niveau 3 — plus difficile (pénalités) : paramètre d'une base, droite perpendiculaire à un plan, triangle
              rectangle, plan (ABC), distance à un plan, projeté orthogonal, intersection.

   Chaque question porte, dans `meta`, les coordonnées nécessaires pour la recalculer de façon indépendante
   (outils/qcm-bac/controle-banques.js). La `cle` d'une option est son affirmation en clair. */
(function () {
  'use strict';
  const O = Automatismes.outils;
  const { alea, aleaParmi, melanger, pgcd, m, qcm, famille, fracL } = O;
  const T = String.raw;

  // ---------- vecteurs et points : tableaux [x, y, z] d'entiers ----------
  const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  const sub = (P, Q) => [P[0] - Q[0], P[1] - Q[1], P[2] - Q[2]];
  const add = (P, u) => [P[0] + u[0], P[1] + u[1], P[2] + u[2]];
  const mul = (k, u) => [k * u[0], k * u[1], k * u[2]];
  const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const nul = u => u[0] === 0 && u[1] === 0 && u[2] === 0;
  const col = (u, v) => nul(cross(u, v));
  const egal = (u, v) => u[0] === v[0] && u[1] === v[1] && u[2] === v[2];
  const gcd3 = v => pgcd(pgcd(Math.abs(v[0]), Math.abs(v[1])), Math.abs(v[2]));
  const reduit = v => { const g = gcd3(v); return v.map(x => x / g); };
  const det = (u, v, w) => dot(u, cross(v, w));
  const surDroite = (P, A, u) => col(sub(P, A), u);
  const randV = (lo, hi) => { let v; do { v = [alea(lo, hi), alea(lo, hi), alea(lo, hi)]; } while (nul(v)); return v; };
  const randP = (lo, hi) => [alea(lo, hi), alea(lo, hi), alea(lo, hi)];
  const cle = v => v.join(',');
  const opt = (aff, c) => ({ affichage: aff, cle: c });

  // ---------- écriture LaTeX ----------
  const pt = P => T`(${P[0]}\,;${P[1]}\,;${P[2]})`;
  const vec = u => T`\begin{pmatrix}${u[0]}\\${u[1]}\\${u[2]}\end{pmatrix}`;
  // combinaison linéaire : lin([2, -1, 0, 3], ['x', 'y', 'z', '']) = « 2x-y+3 »
  function lin(coefs, vars) {
    let s = '';
    coefs.forEach((c, i) => {
      if (!c) return;
      const a = Math.abs(c);
      const terme = vars[i] ? (a === 1 ? '' : String(a)) + vars[i] : String(a);
      s += (c < 0 ? '-' : (s ? '+' : '')) + terme;
    });
    return s || '0';
  }
  const rep = (A, u) => T`x=${lin([A[0], u[0]], ['', 't'])},\ y=${lin([A[1], u[1]], ['', 't'])},\ z=${lin([A[2], u[2]], ['', 't'])}`;
  const plan = (c) => T`${lin(c, ['x', 'y', 'z', ''])}=0`;
  const par = x => (x < 0 ? '(' + x + ')' : String(x));
  // c·P (+ d) détaillé : « 2\times 3-1\times (-2)+4\times 5+7 »
  function dotTex(c, P, d) {
    let s = `${c[0]}\\times ${par(P[0])}`;
    for (let i = 1; i < 3; i++) s += (c[i] < 0 ? '-' : '+') + `${Math.abs(c[i])}\\times ${par(P[i])}`;
    if (d) s += sgn(d);
    return s;
  }
  const repCases = (A, u) => T`\begin{cases}x=${lin([A[0], u[0]], ['', 't'])}\\ y=${lin([A[1], u[1]], ['', 't'])}\\ z=${lin([A[2], u[2]], ['', 't'])}\end{cases}`;
  const repOpt = (A, u) => opt(m(rep(A, u)), `R:${cle(A)}|${cle(u)}`);
  const nbOpt = (v, tex) => opt(m(tex === undefined ? String(v) : tex), 'num:' + v);
  const ptOpt = P => opt(m(pt(P)), 'P:' + cle(P));
  const vecOpt = u => opt(m(vec(u)), 'V:' + cle(u));
  const eqOpt = c => opt(m(plan(c)), 'E:' + cle(c));
  const unique = (liste, aeviter) => {          // premiers éléments distincts (par clé) et différents de `aeviter`
    const vus = new Set(aeviter.map(String)), res = [];
    for (const x of liste) { const k = String(x.cle); if (!vus.has(k)) { vus.add(k); res.push(x); } }
    return res;
  };

  // ==========================================================================
  // 1. Alignement de points
  // ==========================================================================
  function alignementN1() {
    const noms = aleaParmi([['A', 'B', 'C'], ['M', 'N', 'P'], ['E', 'F', 'G'], ['R', 'S', 'T']]);
    const [X, Y, Z] = noms;
    const AB = (a, b) => T`\overrightarrow{${a}${b}}`;
    let P1, u, P2, P3, aligne, t;
    for (;;) {
      P1 = randP(-4, 4); u = randV(-3, 3); P2 = add(P1, u);
      aligne = Math.random() < 0.5;
      t = aleaParmi([2, 3, -1, -2]);
      P3 = add(P1, mul(t, u));
      if (!aligne) { const k = alea(0, 2); P3[k] += aleaParmi([-2, -1, 1, 2]); if (col(sub(P2, P1), sub(P3, P1))) continue; }
      break;
    }
    const U = sub(P2, P1), W = sub(P3, P1);
    const lbl = k => (k === 1 ? '' : k === -1 ? '-' : k + T`\,`);
    const relAC = k => `${m(`${AB(X, Z)}=${lbl(k)}${AB(X, Y)}`)}`;
    let bonne, dist;
    if (aligne) {
      bonne = opt(`oui, car ${relAC(t)}`, `yes:AC=${t}AB`);
      const t2 = t === 2 ? 3 : 2;
      dist = [opt(`oui, car ${relAC(t2)}`, `yes:AC=${t2}AB`),
        opt(`non, car les coordonnées de ${m(AB(X, Y))} et ${m(AB(X, Z))} ne sont pas proportionnelles`, 'no:noprop'),
        opt(`non, car ${m(`${AB(X, Y)}\\neq ${AB(X, Z)}`)}`, 'no:ne'),
        opt(`non, car ${m(`${AB(X, Y)}\\cdot ${AB(X, Z)}\\neq 0`)}`, 'no:dot')];
    } else {
      bonne = opt(`non, car les coordonnées de ${m(AB(X, Y))} et ${m(AB(X, Z))} ne sont pas proportionnelles`, 'no:noprop');
      dist = [opt(`oui, car ${relAC(t)}`, `yes:AC=${t}AB`),
        opt(`oui, car ${m(`${AB(X, Y)}=${AB(X, Z)}`)}`, 'yes:AB=AC'),
        opt(`oui, car ${m(`${AB(X, Y)}\\cdot ${AB(X, Z)}=0`)}`, 'yes:dot0')];
      dist.push(opt(`oui, car les trois points ont des coordonnées entières`, 'yes:entier'));
    }
    return qcm(`Dans un repère de l'espace, on considère les points ${m(`${X}${pt(P1)}`)}, ${m(`${Y}${pt(P2)}`)} et ${m(`${Z}${pt(P3)}`)}. Les points ${m(X)}, ${m(Y)} et ${m(Z)} sont-ils alignés ?`,
      bonne, dist,
      { explication: `${m(`${AB(X, Y)}${vec(U)}`)} et ${m(`${AB(X, Z)}${vec(W)}`)} : ${aligne ? `on a ${m(`${AB(X, Z)}=${lbl(t)}${AB(X, Y)}`)}, les vecteurs sont colinéaires.` : 'il n\'existe aucun réel qui multiplie les trois coordonnées de l\'un pour obtenir celles de l\'autre : les vecteurs ne sont pas colinéaires.'}`,
        meta: { A: P1, B: P2, C: P3 } });
  }
  function alignementN2() {        // valeur de m pour laquelle trois points sont alignés
    let A, u, B, t, C, m0;
    do {
      A = randP(-4, 4); u = randV(-3, 3); if (u[2] === 0) continue;
      B = add(A, u); t = aleaParmi([2, 3, -1, -2]);
      C = add(A, mul(t, u)); m0 = C[2];
    } while (u[2] === 0 || m0 === 0 || (u[0] === 0 && u[1] === 0));
    const ok = opt(m(`m=${m0}`), 'm:' + m0);
    const cand = [opt(m(`m=${t * u[2]}`), 'm:' + t * u[2]), opt(m(`m=${A[2] + u[2]}`), 'm:' + (A[2] + u[2])), opt(m(`m=${A[2] - t * u[2]}`), 'm:' + (A[2] - t * u[2])), opt(m(`m=${-m0}`), 'm:' + (-m0)), opt(m(`m=${m0 + 1}`), 'm:' + (m0 + 1))];
    return qcm(`Dans un repère de l'espace, on considère les points ${m(`A${pt(A)}`)}, ${m(`B${pt(B)}`)} et ${m(T`C(${C[0]}\,;${C[1]}\,;m)`)}, où ${m('m')} est un réel. Pour quelle valeur de ${m('m')} les points ${m('A')}, ${m('B')} et ${m('C')} sont-ils alignés ?`,
      ok, unique(cand, ['m:' + m0]),
      { explication: `${m(T`\overrightarrow{AB}${vec(sub(B, A))}`)} et ${m(T`\overrightarrow{AC}\begin{pmatrix}${C[0] - A[0]}\\${C[1] - A[1]}\\m${sgn(-A[2])}\end{pmatrix}`)} doivent être colinéaires : le coefficient est ${m(String(t))}, d'où ${m(T`m${sgn(-A[2])}=${t}\times ${u[2] < 0 ? '(' + u[2] + ')' : u[2]}`)} soit ${m(`m=${m0}`)}.`,
        meta: { A, B, Cxy: [C[0], C[1]] } });
  }
  const sgn = n => (n < 0 ? '-' : '+') + Math.abs(n);

  // ==========================================================================
  // 2. Vecteurs formant une base
  // ==========================================================================
  function baseN2() {
    let u, v, w, coplanaires, al, be;
    for (;;) {
      u = randV(-3, 3); v = randV(-3, 3);
      if (col(u, v)) continue;
      coplanaires = Math.random() < 0.5;
      al = aleaParmi([-2, -1, 1, 2, 3]); be = aleaParmi([-2, -1, 1, 2, 3]);
      w = add(mul(al, u), mul(be, v));
      if (!coplanaires) { const k = alea(0, 2); w[k] += aleaParmi([-2, -1, 1, 2]); if (det(u, v, w) === 0) continue; }
      if (col(u, w) || col(v, w) || nul(w)) continue;
      break;
    }
    const U = T`\vec{u}`, Vv = T`\vec{v}`, W = T`\vec{w}`;
    const relation = (a, b) => `${m(`${W}=${a === 1 ? '' : a === -1 ? '-' : a}${U}${b < 0 ? '-' : '+'}${Math.abs(b) === 1 ? '' : Math.abs(b)}${Vv}`)}`;
    let bonne, dist;
    if (coplanaires) {
      bonne = opt(`non, car ${relation(al, be)}`, `non:w=${al}u+${be}v`);
      const a2 = al === 1 ? 2 : 1;
      dist = [opt('oui, car les trois vecteurs sont deux à deux non colinéaires', 'oui:pairs'), opt(`non, car ${relation(a2, be)}`, `non:w=${a2}u+${be}v`), opt(`non, car ${m(`${U}`)} et ${m(Vv)} sont colinéaires`, 'non:col:uv'), opt(`oui, car ${m(Vv)} et ${m(W)} ne sont pas colinéaires`, 'oui:vw')];
    } else {
      bonne = opt(`oui, car aucune égalité de la forme ${m(T`\vec{w}=\alpha\vec{u}+\beta\vec{v}`)} n'est possible`, 'oui:norel');
      const a2 = al === 1 ? 2 : 1;
      dist = [opt(`non, car ${relation(al, be)}`, `non:w=${al}u+${be}v`), opt(`non, car ${m(U)} et ${m(Vv)} sont colinéaires`, 'non:col:uv'), opt(`non, car ${relation(a2, be)}`, `non:w=${a2}u+${be}v`), opt(`non, car ${m(U)} et ${m(W)} sont colinéaires`, 'non:col:uw')];
    }
    return qcm(`Dans l'espace muni d'un repère, on considère les vecteurs ${m(`${U}${vec(u)}`)}, ${m(`${Vv}${vec(v)}`)} et ${m(`${W}${vec(w)}`)}. Les vecteurs ${m(U)}, ${m(Vv)} et ${m(W)} forment-ils une base de l'espace ?`,
      bonne, dist,
      { explication: coplanaires
        ? `On a ${relation(al, be)} : les trois vecteurs sont coplanaires, ils ne forment pas une base (même s'ils sont deux à deux non colinéaires).`
        : `${m(U)} et ${m(Vv)} ne sont pas colinéaires et ${m(W)} n'est pas combinaison linéaire de ${m(U)} et ${m(Vv)} (le système obtenu n'a pas de solution) : les trois vecteurs ne sont pas coplanaires.`,
        meta: { u, v, w } });
  }
  function baseParametre() {        // N3 : valeur(s) de m pour lesquelles u, v, w(m) forment une base
    let u, v, al, be, x0, cof;
    do {
      u = randV(-3, 3); v = randV(-3, 3);
      al = aleaParmi([-2, -1, 1, 2, 3]); be = aleaParmi([-2, -1, 1, 2, 3]);
      const w0 = add(mul(al, u), mul(be, v)); x0 = w0[0];
      cof = u[1] * v[2] - u[2] * v[1];            // coefficient de x dans det(u, v, w) : nul exclu
      var y0 = w0[1], z0 = w0[2];
    } while (col(u, v) || x0 === 0 || cof === 0);
    const W = T`\vec{w}\begin{pmatrix}m\\${y0}\\${z0}\end{pmatrix}`;
    return qcm(`Dans l'espace muni d'un repère, on considère les vecteurs ${m(`\\vec{u}${vec(u)}`)}, ${m(`\\vec{v}${vec(v)}`)} et ${m(W)}, où ${m('m')} est un réel. Pour quelles valeurs de ${m('m')} les vecteurs ${m(T`\vec{u}`)}, ${m(T`\vec{v}`)} et ${m(T`\vec{w}`)} forment-ils une base de l'espace ?`,
      opt(m(T`m\neq ${x0}`), 'm:ne:' + x0),
      [opt(m(`m=${x0}`), 'm:eq:' + x0), opt(m(T`m\neq ${-x0}`), 'm:ne:' + (-x0)), opt('pour tout réel ' + m('m'), 'm:all')],
      { explication: `Les trois vecteurs ne forment pas une base exactement lorsque ${m(T`\vec{w}`)} est combinaison linéaire de ${m(T`\vec{u}`)} et ${m(T`\vec{v}`)}. Pour ${m(`m=${x0}`)}, on a ${m(T`\vec{w}=${al}\vec{u}${sgn(be)}\vec{v}`)} : ils sont alors coplanaires. Pour toute autre valeur de ${m('m')}, ils forment une base.`,
        meta: { u, v, y0, z0 } });
  }

  // ==========================================================================
  // 3. Droites : vecteur directeur, représentations paramétriques
  // ==========================================================================
  function directeurN1() {
    const A = randP(-5, 5), u = randV(-4, 4), mult = aleaParmi([1, 1, 1, -1, 2]);
    const ans = mul(mult, u);
    const cand = [A, [u[0], u[1], -u[2]], [-u[0], u[1], u[2]], [u[1], u[0], u[2]], sub(A, u), [u[0], -u[1], u[2]]];
    const choix = cand.filter(v => !col(v, u) && !nul(v)).map(vecOpt);
    return qcm(`Dans un repère de l'espace, on considère la droite ${m('d')} de représentation paramétrique ${m(repCases(A, u))}, ${m(T`t\in\mathbb{R}`)}. Quel est un vecteur directeur de ${m('d')} ?`,
      vecOpt(ans), unique(choix, ['V:' + cle(ans)]).slice(0, 3),
      { explication: `Dans une représentation paramétrique ${m(T`x=x_A+at,\ y=y_A+bt,\ z=z_A+ct`)}, un vecteur directeur est ${m(T`(a\,;b\,;c)`)} : ici les coefficients de ${m('t')}. Les constantes donnent un point de la droite, pas sa direction.`,
        meta: { A, u } });
  }
  function repAB() {               // N2 : représentation paramétrique de (AB)
    let A, B, u, P, d;
    for (;;) {
      A = randP(-4, 4); u = randV(-3, 3); B = add(A, u);
      const depuisB = Math.random() < 0.5;
      P = depuisB ? B : A; d = Math.random() < 0.7 ? u : mul(-1, u);
      const candidats = [
        [A, B],                                         // direction = coordonnées de B
        [A, add(A, B)],                                 // direction = A + B
        [A, [u[0], u[1], -u[2]]],                       // signe oublié sur la troisième coordonnée
        [[0, 0, 0], u],                                 // origine à la place d'un point de la droite
        [B, B],                                         // point B, direction B
        [A, [u[1], u[0], u[2]]]                         // coordonnées permutées
      ].filter(([Q, D]) => !(surDroite(Q, A, u) && col(D, u)) && !nul(D));
      if (candidats.length < 3 || nul(d)) continue;
      const choix = melanger(candidats).slice(0, 3);
      const vus = new Set([`${cle(P)}|${cle(d)}`]);
      if (choix.some(([Q, D]) => { const k = `${cle(Q)}|${cle(D)}`; if (vus.has(k)) return true; vus.add(k); return false; })) continue;
      return qcm(`Dans un repère de l'espace, on considère les points ${m(`A${pt(A)}`)} et ${m(`B${pt(B)}`)}. Laquelle de ces représentations paramétriques est celle de la droite ${m('(AB)')} ? (${m(T`t\in\mathbb{R}`)})`,
        repOpt(P, d), choix.map(([Q, D]) => repOpt(Q, D)),
        { explication: `${m(T`\overrightarrow{AB}${vec(u)}`)} est un vecteur directeur de ${m('(AB)')} et la droite passe par ${m('A')} (et par ${m('B')}) : il faut un point de la droite et un vecteur colinéaire à ${m(T`\overrightarrow{AB}`)}.`,
          meta: { A, B } });
    }
  }
  function perpendiculairePlan() {  // N3 : droite passant par A et perpendiculaire à un plan
    let A, n, dp, P;
    for (;;) {
      A = randP(-4, 4); n = randV(-3, 3); dp = alea(-6, 6);
      if (n.some(x => x === 0) && Math.random() < 0.7) continue;
      const candidats = [
        [A, [n[0], n[1], dp]], [A, [n[1], n[0], n[2]]], [A, [n[0], n[1], -n[2]]], [[0, 0, 0], n], [A, [-n[0], n[1], n[2]]], [add(A, [1, 0, 0]), n]
      ].filter(([Q, D]) => !(surDroite(Q, A, n) && col(D, n)) && !nul(D));
      if (candidats.length < 3) continue;
      const choix = melanger(candidats).slice(0, 3);
      const vus = new Set([`${cle(A)}|${cle(n)}`]);
      if (choix.some(([Q, D]) => { const k = `${cle(Q)}|${cle(D)}`; if (vus.has(k)) return true; vus.add(k); return false; })) continue;
      return qcm(`Dans un repère orthonormé de l'espace, on considère le point ${m(`A${pt(A)}`)} et le plan ${m('\\mathcal{P}')} d'équation ${m(plan([n[0], n[1], n[2], dp]))}. Laquelle de ces représentations paramétriques est celle de la droite passant par ${m('A')} et perpendiculaire à ${m('\\mathcal{P}')} ? (${m(T`t\in\mathbb{R}`)})`,
        repOpt(A, n), choix.map(([Q, D]) => repOpt(Q, D)),
        { explication: `Un vecteur normal à ${m(T`\mathcal{P}`)} est ${m(T`\vec{n}${vec(n)}`)} (les coefficients de ${m('x')}, ${m('y')}, ${m('z')}) : c'est un vecteur directeur de la droite cherchée, qui passe par ${m('A')}.`,
          meta: { A, n } });
    }
  }

  // ==========================================================================
  // 4. Appartenance d'un point à une droite ou à un plan
  // ==========================================================================
  function appartenanceDroite() {
    let A, u, t0, bon, dist;
    for (;;) {
      A = randP(-4, 4); u = randV(-3, 3); t0 = aleaParmi([-2, -1, 1, 2, 3]);
      bon = add(A, mul(t0, u));
      const t1 = t0 + aleaParmi([-2, -1, 1, 2]);
      const cand = [
        add(bon, [aleaParmi([-1, 1]), 0, 0]), add(bon, [0, aleaParmi([-1, 1]), 0]), add(bon, [0, 0, aleaParmi([-2, -1, 1, 2])]),
        [A[0] + t0 * u[0], A[1] + t1 * u[1], A[2] + t0 * u[2]], add(A, [t0 * u[0], t0 * u[1], 0]).map((x, i) => (i === 2 ? A[2] : x)),
        [A[0] - u[0] * t0, A[1] + u[1] * t0, A[2] + u[2] * t0]
      ].filter(P => !surDroite(P, A, u));
      const choix = unique(cand.map(ptOpt), ['P:' + cle(bon)]).slice(0, 3);
      if (choix.length < 3) continue;
      return qcm(`Dans un repère de l'espace, on considère la droite ${m('d')} de représentation paramétrique ${m(repCases(A, u))}, ${m(T`t\in\mathbb{R}`)}. Lequel de ces points appartient à ${m('d')} ?`,
        ptOpt(bon), choix,
        { explication: `On cherche ${m('t')} tel que les trois équations soient vraies : pour ${m(`t=${t0}`)}, on trouve ${m(pt(bon))}. Pour les autres points, les trois coordonnées ne conduisent pas à la même valeur de ${m('t')}.`,
          meta: { A, u } });
    }
  }
  function appartenancePlan() {
    let M0, c;
    for (;;) {
      M0 = randP(-3, 3); c = randV(-3, 3);
      const d = -dot(c, M0);
      const cand = [add(M0, [aleaParmi([-1, 1]), 0, 0]), add(M0, [0, aleaParmi([-1, 1]), 0]), add(M0, [0, 0, aleaParmi([-1, 1])]), [M0[1], M0[0], M0[2]], [-M0[0], -M0[1], -M0[2]], [M0[0] + 1, M0[1] + 1, M0[2]]]
        .filter(P => dot(c, P) + d !== 0);
      const choix = unique(cand.map(ptOpt), ['P:' + cle(M0)]).slice(0, 3);
      if (choix.length < 3) continue;
      return qcm(`Dans un repère de l'espace, on considère le plan ${m('\\mathcal{P}')} d'équation ${m(plan([c[0], c[1], c[2], d]))}. Lequel de ces points appartient à ${m('\\mathcal{P}')} ?`,
        ptOpt(M0), choix,
        { explication: `Un point appartient à ${m(T`\mathcal{P}`)} si ses coordonnées vérifient l'équation : pour ${m(pt(M0))}, ${m(`${dotTex(c, M0, d)}=0`)}.`,
          meta: { c, d } });
    }
  }

  // ==========================================================================
  // 5. Produit scalaire et orthogonalité
  // ==========================================================================
  function scalaireN1() {
    const u = randV(-4, 4), v = randV(-4, 4), val = dot(u, v);
    const faux = [u[0] * v[0] + u[1] * v[1], u[0] * v[0] + u[1] * v[1] - u[2] * v[2], u[0] * v[0] * u[1] * v[1] * u[2] * v[2], u[0] + u[1] + u[2] + v[0] + v[1] + v[2], u[0] * v[1] + u[1] * v[2] + u[2] * v[0], -val, u[0] * v[0] - u[1] * v[1] + u[2] * v[2], val + 2, val - 2];
    return qcm(`Dans un repère orthonormé de l'espace, on considère les vecteurs ${m(`\\vec{u}${vec(u)}`)} et ${m(`\\vec{v}${vec(v)}`)}. Quelle est la valeur du produit scalaire ${m(T`\vec{u}\cdot\vec{v}`)} ?`,
      nbOpt(val), unique(faux.map(x => nbOpt(x)), ['num:' + val]),
      { explication: `${m(T`\vec{u}\cdot\vec{v}=x_ux_v+y_uy_v+z_uz_v=${dotTex(u, v)}=${val}`)}.`,
        meta: { u, v } });
  }
  function orthogonalM() {
    let u, v, m0;
    for (;;) {
      const b = alea(-4, 4), c = alea(-4, 4), e = alea(-4, 4), f = alea(-4, 4), d = aleaParmi([1, 2, 3, -1, -2, -3]);
      const reste = -(b * e + c * f);
      if (reste % d !== 0) continue;
      m0 = reste / d;
      if (m0 === 0) continue;
      u = [null, b, c]; v = [d, e, f]; break;
    }
    const ok = opt(m(`m=${m0}`), 'm:' + m0);
    const ee = v[1], ff = v[2], dd = v[0];
    const cand = [-m0, -(u[1] * ee + u[2] * ff), u[1] * ee + u[2] * ff, m0 + 1, m0 - 1, 2 * m0, m0 + 2, -m0 + 1].map(x => opt(m(`m=${x}`), 'm:' + x));
    return qcm(`Dans un repère orthonormé de l'espace, on considère les vecteurs ${m(T`\vec{u}\begin{pmatrix}m\\${u[1]}\\${u[2]}\end{pmatrix}`)} et ${m(`\\vec{v}${vec(v)}`)}, où ${m('m')} est un réel. Pour quelle valeur de ${m('m')} les vecteurs ${m(T`\vec{u}`)} et ${m(T`\vec{v}`)} sont-ils orthogonaux ?`,
      ok, unique(cand, ['m:' + m0]),
      { explication: `${m(T`\vec{u}\cdot\vec{v}=${lin([dd, u[1] * ee, u[2] * ff], ['m', '', ''])}=0`)} d'où ${m(`m=${m0}`)}.`,
        meta: { b: u[1], c: u[2], v } });
  }
  function triangleRectangle() {    // N3
    let pts, vrai, noms;
    for (;;) {
      const w = randV(-3, 3), a = randV(-3, 3), u = reduit(cross(w, a));
      if (nul(u)) continue;
      const v0 = reduit(cross(u, w)); if (nul(v0)) continue;
      const V = randP(-3, 3), P = add(V, u), Q = add(V, v0);
      noms = melanger(['A', 'B', 'C']);
      const pos = { }; const lieu = aleaParmi([0, 1, 2]);
      const rect = Math.random() < 0.75;
      let Qq = Q; if (!rect) { Qq = Q.slice(); Qq[alea(0, 2)] += aleaParmi([-2, -1, 1, 2]); }
      const ordre = melanger([V, P, Qq]);
      pts = ordre;
      const dotAt = k => dot(sub(pts[(k + 1) % 3], pts[k]), sub(pts[(k + 2) % 3], pts[k]));
      const droits = [0, 1, 2].filter(k => dotAt(k) === 0);
      if (droits.length > 1 || (rect && droits.length !== 1) || (!rect && droits.length !== 0)) continue;
      vrai = droits.length ? 'rect:' + 'ABC'[droits[0]] : 'rect:none';
      break;
    }
    const L = { 'rect:A': 'ABC est rectangle en A', 'rect:B': 'ABC est rectangle en B', 'rect:C': 'ABC est rectangle en C', 'rect:none': 'ABC n\'est pas rectangle' };
    const toutes = ['rect:A', 'rect:B', 'rect:C', 'rect:none'];
    const o = c => opt(L[c].replace('ABC', m('ABC')).replace(/ en ([ABC])/, (s, g) => ' en ' + m(g)), c);
    return qcm(`Dans un repère orthonormé de l'espace, on considère les points ${m(`A${pt(pts[0])}`)}, ${m(`B${pt(pts[1])}`)} et ${m(`C${pt(pts[2])}`)}. Quelle affirmation est vraie ?`,
      o(vrai), toutes.filter(c => c !== vrai).map(o),
      { explication: 'On calcule les produits scalaires ' + m(T`\overrightarrow{AB}\cdot\overrightarrow{AC}`) + ', ' + m(T`\overrightarrow{BA}\cdot\overrightarrow{BC}`) + ' et ' + m(T`\overrightarrow{CA}\cdot\overrightarrow{CB}`) + ' : un produit scalaire nul donne un angle droit.',
        meta: { P: pts } });
  }

  // ==========================================================================
  // 6. Plans : vecteur normal, équation
  // ==========================================================================
  function normalN1() {
    const c = randV(-4, 4), d = aleaParmi([-7, -5, -3, -2, 2, 3, 4, 6, 8]);
    const cand = [[c[0], c[1], d], [c[1], c[0], c[2]], [c[0], c[1], -c[2]], [-c[0], c[1], c[2]], [c[0], d, c[2]]];
    const choix = unique(cand.filter(v => !col(v, c)).map(vecOpt), ['V:' + cle(c)]);
    return qcm(`Dans un repère orthonormé de l'espace, on considère le plan ${m('\\mathcal{P}')} d'équation ${m(plan([c[0], c[1], c[2], d]))}. Quel est un vecteur normal à ${m('\\mathcal{P}')} ?`,
      vecOpt(c), choix.slice(0, 3),
      { explication: `Si ${m('\\mathcal{P}')} a pour équation ${m(T`ax+by+cz+d=0`)}, le vecteur ${m(T`(a\,;b\,;c)`)} lui est normal : on lit les coefficients de ${m('x')}, ${m('y')} et ${m('z')}, sans la constante.`,
        meta: { c, d } });
  }
  function equationPlanN2() {
    let A, n;
    do { A = randP(-4, 4); n = randV(-3, 3); } while (dot(n, A) === 0);
    const d = -dot(n, A);
    const cand = [[n[0], n[1], n[2], -d], [n[0], n[1], n[2], 0], [A[0], A[1], A[2], d], [n[0], n[1], n[2], dot(n, A) + 1], [n[0], n[1], n[2], d + n[0]], [n[1], n[0], n[2], d]];
    const choix = unique(cand.map(eqOpt), ['E:' + cle([n[0], n[1], n[2], d])]);
    return qcm(`Dans un repère orthonormé de l'espace, on considère le point ${m(`A${pt(A)}`)} et le vecteur ${m(`\\vec{n}${vec(n)}`)}. Quelle est une équation du plan passant par ${m('A')} et de vecteur normal ${m(T`\vec{n}`)} ?`,
      eqOpt([n[0], n[1], n[2], d]), choix.slice(0, 3),
      { explication: `Le plan a une équation de la forme ${m(`${lin([n[0], n[1], n[2]], ['x', 'y', 'z'])}+d=0`)}. Comme ${m('A')} appartient au plan, ${m(`d=-(${dotTex(n, A)})=${d}`)}.`,
        meta: { A, n } });
  }
  function planABC() {              // N3 : plan passant par trois points
    let A, B, C, n;
    for (;;) {
      A = randP(-3, 3); const u = randV(-3, 3), v = randV(-3, 3);
      if (col(u, v)) continue;
      B = add(A, u); C = add(A, v);
      n = reduit(cross(u, v));
      if (nul(n) || Math.max(...n.map(Math.abs)) > 12) continue;
      const d = -dot(n, A);
      const mauvais = [[n[0], n[1], -n[2]], [n[1], n[0], n[2]], [-n[0], n[1], n[2]], reduit(add(u, v)), [n[0], -n[1], n[2]]].filter(x => !nul(x));
      const eqs = mauvais.map(c => [c[0], c[1], c[2], -dot(c, A)]).filter(e => !(dot(e, B) + e[3] === 0 && dot(e, C) + e[3] === 0));
      const choix = unique(eqs.map(eqOpt), ['E:' + cle([n[0], n[1], n[2], d])]).slice(0, 3);
      if (choix.length < 3) continue;
      return qcm(`Dans un repère orthonormé de l'espace, on considère les points ${m(`A${pt(A)}`)}, ${m(`B${pt(B)}`)} et ${m(`C${pt(C)}`)}, non alignés. Quelle est une équation du plan ${m('(ABC)')} ?`,
        eqOpt([n[0], n[1], n[2], d]), choix,
        { explication: `${m(T`\overrightarrow{AB}${vec(sub(B, A))}`)} et ${m(T`\overrightarrow{AC}${vec(sub(C, A))}`)} ne sont pas colinéaires. Un vecteur ${m(T`\vec{n}${vec(n)}`)} orthogonal aux deux est normal au plan ; on trouve ensuite ${m('d')} avec les coordonnées de ${m('A')} : ${m(plan([n[0], n[1], n[2], d]))}.`,
          meta: { A, B, C } });
    }
  }

  // ==========================================================================
  // 7. Distance d'un point à un plan, projeté orthogonal
  // ==========================================================================
  const NORMALES = [[1, 2, 2], [2, 3, 6], [1, 4, 8], [2, 6, 9], [4, 4, 7], [2, 1, 2], [2, 2, 1], [3, 4, 12], [2, 3, 6], [6, 6, 7]];
  const norme = n => Math.sqrt(dot(n, n));
  const signe = () => aleaParmi([-1, 1]);
  function distancePlan() {
    let n, d, M0, num;
    for (;;) {
      n = aleaParmi(NORMALES).map(x => x * signe()); if (Math.random() < 0.5) n = [n[1], n[0], n[2]];
      M0 = randP(-4, 4); d = alea(-8, 8); num = dot(n, M0) + d;
      if (num !== 0 && Math.abs(num) < 80) break;
    }
    const N = Math.round(norme(n)), r = (a, b) => { const g = pgcd(a, b); return { v: a / b, tex: fracL(a, b), cle: (a / g) / (b / g) + '' }; };
    const val = r(Math.abs(num), N);
    const ob = x => opt(m(x.tex), 'd:' + x.v);
    const faux = [r(Math.abs(num), N * N), r(Math.abs(num), 1), r(-num, N), r(num, N), r(Math.abs(num), N + 1), r(Math.abs(num) * N, 1)];
    const choix = unique(faux.map(ob), ['d:' + val.v]).slice(0, 3);
    return qcm(`Dans un repère orthonormé de l'espace, on considère le point ${m(`M${pt(M0)}`)} et le plan ${m('\\mathcal{P}')} d'équation ${m(plan([n[0], n[1], n[2], d]))}. Quelle est la distance du point ${m('M')} au plan ${m('\\mathcal{P}')} ?`,
      ob(val), choix,
      { explication: `${m(T`d(M,\mathcal{P})=\dfrac{|ax_M+by_M+cz_M+d|}{\sqrt{a^2+b^2+c^2}}=\dfrac{|${num}|}{\sqrt{${dot(n, n)}}}=\dfrac{${Math.abs(num)}}{${N}}`)}${val.tex !== T`\dfrac{${Math.abs(num)}}{${N}}` ? m(`=${val.tex}`) : ''}.`,
        meta: { n, d, M: M0 } });
  }
  function projeteOrthogonal() {
    let n, d, M0, H, lam;
    for (;;) {
      n = randV(-3, 3); H = randP(-3, 3); d = -dot(n, H);
      lam = aleaParmi([-2, -1, 1, 2]); M0 = add(H, mul(lam, n));
      const cand = [add(H, mul(2, n)), add(H, mul(-1, n)), add(M0, mul(-2 * lam, n)).map((x, i) => x), add(H, [1, 0, 0]), M0.map((x, i) => (i === 0 ? H[0] : x)), add(H, mul(lam + 1, n)), mul(-1, H)]
        .filter(P => !egal(P, H));
      const choix = unique(cand.map(ptOpt), ['P:' + cle(H)]).slice(0, 3);
      if (choix.length < 3 || Math.max(...M0.map(Math.abs)) > 15) continue;
      return qcm(`Dans un repère orthonormé de l'espace, on considère le plan ${m('\\mathcal{P}')} d'équation ${m(plan([n[0], n[1], n[2], d]))} et le point ${m(`M${pt(M0)}`)}. Quelles sont les coordonnées du projeté orthogonal de ${m('M')} sur ${m('\\mathcal{P}')} ?`,
        ptOpt(H), choix,
        { explication: `Le projeté ${m('H')} est le point de la droite passant par ${m('M')} et de direction ${m(T`\vec{n}${vec(n)}`)} qui appartient à ${m('\\mathcal{P}')} : ${m(T`H=M+t\vec{n}`)} avec ${m(`t=${-lam}`)}, soit ${m(pt(H))}.`,
          meta: { n, d, M: M0 } });
    }
  }

  // ==========================================================================
  // 8. Position relative d'une droite et d'un plan
  // ==========================================================================
  function positionDroitePlan() {
    let A, u, c, d, cas, M0, t0;
    for (;;) {
      u = randV(-3, 3); c = randV(-3, 3);
      cas = aleaParmi(['secant', 'secant', 'parallele', 'incluse']);
      A = randP(-4, 4);
      if (cas === 'secant') {
        if (dot(c, u) === 0) continue;
        t0 = aleaParmi([-2, -1, 1, 2, 3]); M0 = add(A, mul(t0, u)); d = -dot(c, M0);
        if (dot(c, A) + d === 0) continue;
      } else {
        // direction orthogonale à la normale : u = c × w
        const w = randV(-2, 2); u = reduit(cross(c, w)); if (nul(u)) continue;
        d = cas === 'incluse' ? -dot(c, A) : -dot(c, A) + aleaParmi([-3, -2, -1, 1, 2, 3]);
      }
      break;
    }
    const OPT = {
      sec: P => opt(`${m('d')} et ${m('\\mathcal{P}')} sont sécants en ${m(pt(P))}`, 'sec:' + cle(P)),
      secq: opt(`${m('d')} et ${m('\\mathcal{P}')} sont sécants en un seul point`, 'sec'),
      par: opt(`${m('d')} est strictement parallèle à ${m('\\mathcal{P}')}`, 'par'),
      inc: opt(`${m('d')} est incluse dans ${m('\\mathcal{P}')}`, 'inc'),
      orth: opt(`${m('d')} est orthogonale à ${m('\\mathcal{P}')}`, 'orth')
    };
    let bonne, dist;
    if (cas === 'secant') {
      bonne = OPT.sec(M0);
      const faux = add(A, mul(-t0, u));
      dist = [OPT.sec(faux), OPT.par, OPT.inc];
      if (egal(faux, M0)) dist[0] = OPT.orth;
    } else if (cas === 'parallele') { bonne = OPT.par; dist = [OPT.inc, OPT.secq, OPT.orth]; }
    else { bonne = OPT.inc; dist = [OPT.par, OPT.secq, OPT.orth]; }
    return qcm(`Dans un repère orthonormé de l'espace, on considère la droite ${m('d')} de représentation paramétrique ${m(repCases(A, u))}, ${m(T`t\in\mathbb{R}`)}, et le plan ${m('\\mathcal{P}')} d'équation ${m(plan([c[0], c[1], c[2], d]))}. Quelle affirmation est vraie ?`,
      bonne, dist,
      { explication: cas === 'secant'
        ? `${m(T`\vec{n}\cdot\vec{u}=${dot(c, u)}\neq 0`)} : la droite n'est pas parallèle au plan. En remplaçant dans l'équation, on trouve ${m(`t=${t0}`)}, d'où le point ${m(pt(M0))}.`
        : `${m(T`\vec{n}\cdot\vec{u}=0`)} : la droite est parallèle au plan. ${cas === 'incluse' ? `Le point ${m(`A${pt(A)}`)} de la droite vérifie l'équation du plan : la droite est incluse dans le plan.` : `Le point ${m(`A${pt(A)}`)} de la droite ne vérifie pas l'équation du plan : la droite est strictement parallèle.`}`,
        meta: { A, u, c, d } });
  }
  function intersectionDroitePlan() {
    let A, u, c, d, M0, t0, tt;
    for (;;) {
      A = randP(-4, 4); u = randV(-3, 3); c = randV(-3, 3);
      if (dot(c, u) === 0) continue;
      t0 = aleaParmi([-3, -2, -1, 1, 2, 3]); M0 = add(A, mul(t0, u)); d = -dot(c, M0);
      if (dot(c, A) + d === 0) continue;
      tt = [t0 + 1, t0 - 1, -t0, 0];
      const cand = [add(A, mul(t0 + 1, u)), add(A, mul(t0 - 1, u)), add(A, mul(-t0, u)), A, mul(-1, M0), add(M0, [1, 0, 0])].filter(P => !egal(P, M0));
      const choix = unique(cand.map(ptOpt), ['P:' + cle(M0)]).slice(0, 3);
      if (choix.length < 3) continue;
      return qcm(`Dans un repère orthonormé de l'espace, on considère la droite ${m('d')} de représentation paramétrique ${m(repCases(A, u))}, ${m(T`t\in\mathbb{R}`)}, et le plan ${m('\\mathcal{P}')} d'équation ${m(plan([c[0], c[1], c[2], d]))}. Quelles sont les coordonnées du point d'intersection de ${m('d')} et de ${m('\\mathcal{P}')} ?`,
        ptOpt(M0), choix,
        { explication: `On remplace ${m('x')}, ${m('y')}, ${m('z')} par leurs expressions en ${m('t')} dans l'équation du plan : on trouve ${m(`t=${t0}`)}, d'où le point ${m(pt(M0))}.`,
          meta: { A, u, c, d } });
    }
  }

  // ==========================================================================
  // 9. Position relative de deux droites
  // ==========================================================================
  function deuxDroites() {
    let A, u, B, v, cas, M0;
    for (;;) {
      cas = aleaParmi(['sec', 'sec', 'par', 'conf', 'noncop']);
      u = randV(-3, 3);
      if (cas === 'par' || cas === 'conf') {
        const k = aleaParmi([2, -1, -2, 3]); v = mul(k, u); A = randP(-4, 4);
        B = cas === 'conf' ? add(A, mul(aleaParmi([1, 2, -1, 3]), u)) : add(add(A, mul(2, u)), randV(-2, 2));
        if (cas === 'par' && surDroite(B, A, u)) continue;
      } else {
        v = randV(-3, 3); if (col(u, v)) continue;
        if (cas === 'sec') {
          M0 = randP(-4, 4); const t0 = aleaParmi([-2, -1, 1, 2, 3]), s0 = aleaParmi([-3, -2, -1, 1, 2]);
          A = sub(M0, mul(t0, u)); B = sub(M0, mul(s0, v));
        } else {
          A = randP(-4, 4); B = randP(-4, 4);
          if (det(u, v, sub(B, A)) === 0) continue;
        }
      }
      break;
    }
    const O = {
      par: opt(`${m('d')} et ${m("d'")} sont strictement parallèles`, 'par'),
      conf: opt(`${m('d')} et ${m("d'")} sont confondues`, 'conf'),
      secq: opt(`${m('d')} et ${m("d'")} sont sécantes`, 'sec'),
      sec: P => opt(`${m('d')} et ${m("d'")} sont sécantes en ${m(pt(P))}`, 'sec:' + cle(P)),
      noncop: opt(`${m('d')} et ${m("d'")} ne sont pas coplanaires`, 'noncop')
    };
    let bonne, dist;
    if (cas === 'sec') { bonne = O.sec(M0); dist = [O.sec(add(M0, [1, 0, 0])), O.par, O.noncop]; }
    else if (cas === 'par') { bonne = O.par; dist = [O.conf, O.secq, O.noncop]; }
    else if (cas === 'conf') { bonne = O.conf; dist = [O.par, O.secq, O.noncop]; }
    else { bonne = O.noncop; dist = [O.secq, O.par, O.conf]; }
    return qcm(`Dans un repère de l'espace, on considère les droites ${m('d')} et ${m("d'")} de représentations paramétriques ${m(repCases(A, u))}, ${m(T`t\in\mathbb{R}`)}, et ${m(repCases(B, v).replace(/t/g, 's'))}, ${m(T`s\in\mathbb{R}`)}. Quelle affirmation est vraie ?`,
      bonne, dist,
      { explication: cas === 'par' || cas === 'conf'
        ? `Les vecteurs directeurs ${m(vec(u))} et ${m(vec(v))} sont colinéaires : les droites sont parallèles. ${cas === 'conf' ? 'Le point de ' + m("d'") + ' obtenu pour ' + m('s=0') + ' appartient à ' + m('d') + ' : elles sont confondues.' : 'Un point de ' + m("d'") + ' n\'appartient pas à ' + m('d') + ' : elles sont strictement parallèles.'}`
        : cas === 'sec' ? `Les vecteurs directeurs ne sont pas colinéaires. Le système obtenu en égalant les coordonnées admet une solution : les droites se coupent en ${m(pt(M0))}.`
        : 'Les vecteurs directeurs ne sont pas colinéaires et le système obtenu en égalant les coordonnées n\'a pas de solution : les droites ne sont ni parallèles, ni sécantes, donc non coplanaires.',
      meta: { A, u, B, v } });
  }
  function intersectionDeuxDroites() {  // N3 : coordonnées du point d'intersection
    let A, u, B, v, M0, t0, s0;
    for (;;) {
      u = randV(-3, 3); v = randV(-3, 3); if (col(u, v)) continue;
      M0 = randP(-4, 4); t0 = aleaParmi([-2, -1, 1, 2, 3]); s0 = aleaParmi([-3, -2, -1, 1, 2]);
      A = sub(M0, mul(t0, u)); B = sub(M0, mul(s0, v));
      const cand = [A, B, add(A, mul(t0 + 1, u)), add(B, mul(s0 - 1, v)), mul(-1, M0), add(A, u), add(B, v)].filter(P => !egal(P, M0));
      const choix = unique(cand.map(ptOpt), ['P:' + cle(M0)]).slice(0, 3);
      if (choix.length < 3) continue;
      return qcm(`Dans un repère de l'espace, on considère les droites ${m('d')} et ${m("d'")} de représentations paramétriques ${m(repCases(A, u))}, ${m(T`t\in\mathbb{R}`)}, et ${m(repCases(B, v).replace(/t/g, 's'))}, ${m(T`s\in\mathbb{R}`)}. Ces droites sont sécantes. Quelles sont les coordonnées de leur point d'intersection ?`,
        ptOpt(M0), choix,
        { explication: `On cherche ${m('t')} et ${m('s')} tels que les trois coordonnées soient égales : on trouve ${m(`t=${t0}`)} et ${m(`s=${s0}`)}, d'où le point ${m(pt(M0))}.`,
          meta: { A, u, B, v } });
    }
  }

  // ==========================================================================
  // 10. Position relative de deux plans, intersection
  // ==========================================================================
  function deuxPlans() {
    let n, d, n2, d2, cas;
    for (;;) {
      n = randV(-3, 3); d = alea(-6, 6); cas = aleaParmi(['par', 'conf', 'perp', 'sec']);
      if (cas === 'par' || cas === 'conf') { const k = aleaParmi([2, -1, -2, 3]); n2 = mul(k, n); d2 = cas === 'conf' ? k * d : k * d + aleaParmi([-3, -2, -1, 1, 2, 3]); }
      else if (cas === 'perp') { const w = randV(-2, 2); n2 = reduit(cross(n, w)); if (nul(n2) || col(n, n2)) continue; d2 = alea(-6, 6); }
      else { n2 = randV(-3, 3); d2 = alea(-6, 6); if (col(n, n2) || dot(n, n2) === 0) continue; }
      if (nul(n2)) continue;
      break;
    }
    const O = { par: opt('les plans sont strictement parallèles', 'par'), conf: opt('les plans sont confondus', 'conf'), perp: opt('les plans sont sécants et perpendiculaires', 'perp'), sec: opt('les plans sont sécants et non perpendiculaires', 'sec') };
    const ordre = ['par', 'conf', 'perp', 'sec'];
    return qcm(`Dans un repère orthonormé de l'espace, on considère les plans ${m('\\mathcal{P}')} et ${m("\\mathcal{P}'")} d'équations ${m(plan([n[0], n[1], n[2], d]))} et ${m(plan([n2[0], n2[1], n2[2], d2]))}. Quelle affirmation est vraie ?`,
      O[cas], ordre.filter(c => c !== cas).map(c => O[c]),
      { explication: col(n, n2) ? `Les vecteurs normaux ${m(vec(n))} et ${m(vec(n2))} sont colinéaires : les plans sont parallèles. ${cas === 'conf' ? 'Les équations sont proportionnelles (constante comprise) : les plans sont confondus.' : 'Les équations ne sont pas proportionnelles (constante comprise) : les plans sont strictement parallèles.'}` : `Les vecteurs normaux ne sont pas colinéaires : les plans sont sécants. ${m(T`\vec{n}\cdot\vec{n'}=${dot(n, n2)}`)}${dot(n, n2) === 0 ? ' : ils sont perpendiculaires.' : ' : ils ne sont pas perpendiculaires.'}`,
        meta: { n, d, n2, d2 } });
  }
  function droiteIntersectionPlans() {   // N3 : représentation paramétrique de l'intersection
    let A, n, n2, u, d, d2;
    for (;;) {
      n = randV(-3, 3); n2 = randV(-3, 3); if (col(n, n2)) continue;
      u = reduit(cross(n, n2)); if (nul(u) || Math.max(...u.map(Math.abs)) > 12) continue;
      A = randP(-3, 3); d = -dot(n, A); d2 = -dot(n2, A);
      const cand = [[A, n], [A, add(n, n2)], [A, [u[0], u[1], -u[2]]], [add(A, [1, 0, 0]), u], [[0, 0, 0], u], [A, cross(u, n)]].filter(([Q, D]) => !nul(D) && !(dot(n, sub(Q, A)) === 0 && dot(n2, sub(Q, A)) === 0 && dot(n, D) === 0 && dot(n2, D) === 0));
      if (cand.length < 3) continue;
      const choix = melanger(cand).slice(0, 3);
      const vus = new Set([`${cle(A)}|${cle(u)}`]);
      if (choix.some(([Q, D]) => { const k = `${cle(Q)}|${cle(D)}`; if (vus.has(k)) return true; vus.add(k); return false; })) continue;
      return qcm(`Dans un repère orthonormé de l'espace, on considère les plans ${m('\\mathcal{P}')} et ${m("\\mathcal{P}'")} d'équations ${m(plan([n[0], n[1], n[2], d]))} et ${m(plan([n2[0], n2[1], n2[2], d2]))}. Ils sont sécants. Laquelle de ces représentations paramétriques est celle de leur droite d'intersection ? (${m(T`t\in\mathbb{R}`)})`,
        repOpt(A, u), choix.map(([Q, D]) => repOpt(Q, D)),
        { explication: `La droite d'intersection passe par ${m(`A${pt(A)}`)}, qui vérifie les deux équations, et son vecteur directeur est orthogonal aux deux vecteurs normaux ${m(vec(n))} et ${m(vec(n2))} : on trouve ${m(vec(u))}.`,
          meta: { n, d, n2, d2 } });
    }
  }

  // ==========================================================================
  // 11. Angle de deux vecteurs, plan médiateur
  // ==========================================================================
  function angleAbc() {
    let A, B, C, deg, cand;
    for (;;) {
      A = randP(-3, 3); B = randP(-3, 3); C = randP(-3, 3);
      const u = sub(B, A), v = sub(C, A);
      if (nul(u) || nul(v) || col(u, v)) continue;
      const th = Math.acos(dot(u, v) / (Math.sqrt(dot(u, u)) * Math.sqrt(dot(v, v)))) * 180 / Math.PI;
      if (Math.abs(th % 1 - 0.5) < 0.08 || th < 8 || th > 172) continue;
      deg = Math.round(th);
      const x = dot(u, v) / (Math.sqrt(dot(u, u)) + Math.sqrt(dot(v, v)));
      cand = [180 - deg, Math.abs(90 - deg), Math.round(Math.acos(Math.max(-1, Math.min(1, x))) * 180 / Math.PI), deg + 10, deg - 10, Math.round(Math.asin(Math.abs(dot(u, v)) / (Math.sqrt(dot(u, u)) * Math.sqrt(dot(v, v)))) * 180 / Math.PI)]
        .filter(d => d > 0 && d < 180 && d !== deg);
      const choix = unique(cand.map(x => opt(m(`${x}^\\circ`), 'num:' + x)), ['num:' + deg]).slice(0, 3);
      if (choix.length < 3) continue;
      return qcm(`Dans un repère orthonormé de l'espace, on considère les points ${m(`A${pt(A)}`)}, ${m(`B${pt(B)}`)} et ${m(`C${pt(C)}`)}. Quelle est la mesure de l'angle ${m(T`\widehat{BAC}`)}, arrondie au degré ?`,
        opt(m(`${deg}^\\circ`), 'num:' + deg), choix,
        { explication: `${m(T`\cos\widehat{BAC}=\dfrac{\overrightarrow{AB}\cdot\overrightarrow{AC}}{AB\times AC}=\dfrac{${dot(u, v)}}{\sqrt{${dot(u, u)}}\times\sqrt{${dot(v, v)}}}`)}, d'où ${m(T`\widehat{BAC}\approx ${deg}^\circ`)}.`,
          meta: { A, B, C } });
    }
  }
  function planMediateur() {
    let A, B, n, I2, c, d;
    for (;;) {
      A = randP(-4, 4); B = randP(-4, 4); n = sub(B, A); if (nul(n)) continue;
      const nb = dot(B, B) - dot(A, A);              // (|B|² - |A|²) : n·X = nb/2 sur le plan médiateur
      let coefs = [2 * n[0], 2 * n[1], 2 * n[2], -nb];
      const g = pgcd(pgcd(pgcd(Math.abs(coefs[0]), Math.abs(coefs[1])), Math.abs(coefs[2])), Math.abs(coefs[3]));
      coefs = coefs.map(x => x / g);
      const dA = -dot(n, A), dB = -dot(n, B);
      const cand = [[n[0], n[1], n[2], dA], [n[0], n[1], n[2], dB], [coefs[0], coefs[1], coefs[2], -coefs[3]], [A[0] + B[0], A[1] + B[1], A[2] + B[2], -nb], [coefs[0], coefs[1], coefs[2], coefs[3] + 1]].filter(e => !nul(e.slice(0, 3)));
      const bonne = eqOpt(coefs);
      const choix = unique(cand.map(eqOpt), [bonne.cle]).slice(0, 3);
      if (choix.length < 3 || Math.max(...coefs.map(Math.abs)) > 60) continue;
      return qcm(`Dans un repère orthonormé de l'espace, on considère les points ${m(`A${pt(A)}`)} et ${m(`B${pt(B)}`)}. Quelle est une équation du plan médiateur du segment ${m('[AB]')} ?`,
        bonne, choix,
        { explication: `Le plan médiateur est l'ensemble des points ${m('M')} tels que ${m('MA=MB')} : il passe par le milieu de ${m('[AB]')} et admet ${m(T`\overrightarrow{AB}${vec(n)}`)} pour vecteur normal. En écrivant ${m(T`MA^2=MB^2`)}, on obtient ${m(plan(coefs))}.`,
          meta: { A, B } });
    }
  }

  // ==========================================================================
  // Enregistrement
  // ==========================================================================
  Automatismes.enregistrerBanque('geometrie-espace', {
    titre: 'Géométrie dans l’espace',
    familles: {
      'alignement': famille({ nom: 'points alignés', niveaux: [1, 2], base: n => (n === 1 ? alignementN1() : alignementN2()) }),
      'base': famille({ nom: 'base de l’espace', niveaux: [2, 3], base: n => (n === 2 ? baseN2() : baseParametre()), partBase3: 0 }),
      'droite': famille({ nom: 'droites et représentations paramétriques', niveaux: [1, 2, 3], base: n => (n === 1 ? directeurN1() : n === 2 ? repAB() : perpendiculairePlan()) }),
      'appartenance': famille({ nom: 'appartenance à une droite ou à un plan', niveaux: [1, 2], base: n => (n === 1 ? appartenanceDroite() : appartenancePlan()) }),
      'orthogonalite': famille({ nom: 'produit scalaire et orthogonalité', niveaux: [1, 2, 3], base: n => (n === 1 ? scalaireN1() : n === 2 ? orthogonalM() : triangleRectangle()) }),
      'plan': famille({ nom: 'plans : vecteur normal et équation', niveaux: [1, 2, 3], base: n => (n === 1 ? normalN1() : n === 2 ? equationPlanN2() : planABC()) }),
      'distance-projection': famille({ nom: 'distance et projeté orthogonal', niveaux: [3], base: () => (Math.random() < 0.5 ? distancePlan() : projeteOrthogonal()) }),
      'position': famille({ nom: 'droite et plan', niveaux: [2, 3], base: n => (n === 2 ? positionDroitePlan() : intersectionDroitePlan()) }),
      'deux-droites': famille({ nom: 'deux droites', niveaux: [2, 3], base: n => (n === 2 ? deuxDroites() : intersectionDeuxDroites()) }),
      'deux-plans': famille({ nom: 'deux plans', niveaux: [2, 3], base: n => (n === 2 ? deuxPlans() : droiteIntersectionPlans()) }),
      'angle-plan-median': famille({ nom: 'angle et plan médiateur', niveaux: [3], base: () => (Math.random() < 0.5 ? angleAbc() : planMediateur()) })
    }
  });
})();
