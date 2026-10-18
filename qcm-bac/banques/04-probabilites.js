/* Banque 04 — Probabilités (Terminale spécialité)
   Questions à quatre choix inspirées des QCM de bac 2022 et 2023 (arbres pondérés, probabilités totales, formule de
   Bayes, réunion et indépendance, loi binomiale, espérance d'un jeu) et des affirmations de 2024 à 2026 (paramètres d'une
   loi binomiale, espérance et variance, linéarité, somme de variables indépendantes, inégalité de Bienaymé-Tchebychev).
   Voir outils/qcm-bac/types-de-questions-2022-2023.md.

   Niveau 1 — les bases : lecture d'un arbre, réunion, complémentaire, identification d'une loi binomiale, espérance.
   Niveau 2 — l'épreuve : probabilités totales, tirages successifs, formules de la loi binomiale, variance, jeu équitable.
   Niveau 3 — plus difficile (pénalités) : formule de Bayes, paramètre inconnu, seuils, somme et moyenne de variables,
              Bienaymé-Tchebychev, trois branches.

   Chaque question porte, dans le champ `meta` de l'objet brut, les DONNÉES du problème (jamais la réponse) : le contrôle
   (outils/qcm-bac/controle-banques.js) les relit, recalcule la vérité par énumération des issues (arbre, urnes, répétitions)
   ou par la loi binomiale exacte, et la compare à la valeur lue dans chaque option affichée. */
(function () {
  'use strict';
  const O = Automatismes.outils;
  const { alea, aleaParmi, melanger, pgcd, m, qcm, famille, fracL, decL } = O;
  const T = String.raw;

  const opt = (aff, cle) => ({ affichage: aff, cle: cle });
  const texOpt = tex => opt(m(tex), tex);
  const retente = gen => niveau => { for (let i = 0; i < 12; i++) { const q = gen(niveau); if (q) return q; } return null; };
  const arr = (x, nd) => { nd = nd === undefined ? 6 : nd; const f = Math.pow(10, nd); return Math.round(x * f + (x < 0 ? -1e-9 : 1e-9)) / f; };      // arrondi sûr (pas de notation exponentielle)
  const plain = (x, nd) => String(arr(x, nd)).replace('.', ',');       // décimal en texte brut (hors formule)
  const nombre = (x, nd) => decL(arr(x, nd));                    // décimal LaTeX : 0{,}35
  const coefBin = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
  const pmf = (n, p, k) => coefBin(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
  const cdf = (n, p, k) => { let s = 0; for (let i = 0; i <= k; i++) s += pmf(n, p, i); return s; };
  const fr = (a, b) => T`\dfrac{${a}}{${b}}`;
  const sgn = n => (n < 0 ? '-' : '+') + Math.abs(n);
  const ov = e => T`\overline{${e}}`;

  // bonne valeur et mauvaises valeurs (décimaux arrondis à nd décimales, sans doublon, éventuellement dans [0, 1])
  function optsNum(vrai, candidats, nd, borne01) {
    const bonne = nombre(vrai, nd), vus = new Set([bonne]), faux = [];
    for (const c of candidats) {
      if (!Number.isFinite(c) || (borne01 && (c < 0 || c > 1))) continue;
      const t = nombre(c, nd);
      if (vus.has(t)) continue;
      vus.add(t); faux.push(t);
    }
    return { bonne, faux };
  }
  const mentionArrondi = (vrai, nd) => (Math.abs(arr(vrai, nd) - arr(vrai, 9)) < 1e-12 ? '' : ` (arrondie à ${nd === 2 ? '0,01' : nd === 3 ? '0,001' : '10^{-' + nd + '}'} près)`);
  // rationnels exacts {n, d}
  const Q = (n, d) => { const g = pgcd(n, d); if (d < 0) { n = -n; d = -d; } return { n: n / g, d: d / g, v: n / d }; };
  const qtex = r => fracL(r.n, r.d);

  // ==========================================================================
  // 1. Arbres pondérés : probabilités conditionnelles, totales, formule de Bayes
  // ==========================================================================
  const CONTEXTES_ARBRE = [
    { A: 'A', B: 'D', niveauxMin: 1,
      tirer: () => ({ p: aleaParmi([20, 25, 30, 40, 60, 70, 75, 80]), q1: aleaParmi([1, 2, 3, 4, 5, 6, 8]), q2: aleaParmi([2, 3, 5, 7, 10, 12]) }),
      prem: (c) => `Une usine fabrique des pièces dans deux ateliers. L'atelier A fournit ${c.p} % de la production et l'atelier B le reste. ${c.q1} % des pièces de l'atelier A sont défectueuses, contre ${c.q2} % de celles de l'atelier B. On prélève une pièce au hasard. On note ${m('A')} l'événement « la pièce provient de l'atelier A » et ${m('D')} l'événement « la pièce est défectueuse ».` },
    { A: 'M', B: 'T', niveauxMin: 1,
      tirer: () => ({ p: aleaParmi([1, 2, 5, 10]), q1: aleaParmi([90, 95, 98]), q2: aleaParmi([2, 5, 10]) }),
      prem: (c) => `Dans une population, ${c.p} % des personnes sont atteintes d'une maladie. Un test est positif pour ${c.q1} % des personnes malades et pour ${c.q2} % des personnes non malades. On choisit une personne au hasard. On note ${m('M')} l'événement « la personne est malade » et ${m('T')} l'événement « le test est positif ».` },
    { A: 'I', B: 'S', niveauxMin: 1,
      tirer: () => ({ p: aleaParmi([20, 25, 30, 40, 60]), q1: aleaParmi([40, 50, 60, 70]), q2: aleaParmi([20, 30, 35, 45, 55]) }),
      prem: (c) => `Dans un lycée, ${c.p} % des élèves sont internes. Parmi les internes, ${c.q1} % pratiquent un sport en club ; parmi les externes, ${c.q2} %. On choisit un élève au hasard. On note ${m('I')} l'événement « l'élève est interne » et ${m('S')} l'événement « l'élève pratique un sport en club ».` },
    { A: 'A', B: 'B', niveauxMin: 1,
      tirer: () => { const v = [5, 10, 15, 20, 25, 30, 35, 40, 45, 55, 60, 65, 70, 75, 80, 85, 90]; let q1, q2; do { q1 = aleaParmi(v); q2 = aleaParmi(v); } while (q1 === q2); return { p: aleaParmi([20, 25, 30, 35, 40, 60, 65, 70, 75, 80]), q1, q2 }; },
      prem: (c, A, B) => `${m(A)} et ${m(B)} sont deux événements d'un univers ${m(T`\Omega`)} tels que ${m(`P(${A})=${nombre(c.p / 100)}`)}, ${m(`P_{${A}}(${B})=${nombre(c.q1 / 100)}`)} et ${m(`P_{${ov(A)}}(${B})=${nombre(c.q2 / 100)}`)}.` }
  ];
  const ASKS_ARBRE = {
    1: ['AB', 'NAB', 'BnA', 'NABn'],
    2: ['B', 'Bbar', 'AB', 'AgB'],
    3: ['AgB', 'NAgB', 'AgNB', 'p', 'q2']
  };
  function arbre2(niveau) {
    const ask = aleaParmi(ASKS_ARBRE[niveau]);
    let ctx = aleaParmi(CONTEXTES_ARBRE);
    const abstrait = ask === 'p' || ask === 'q2';
    if (abstrait) ctx = CONTEXTES_ARBRE[3];
    const c = ctx.tirer(), p = c.p / 100, q1 = c.q1 / 100, q2 = c.q2 / 100, A = ctx.A, B = ctx.B, nA = ov(A), nB = ov(B);
    const AB = p * q1, NAB = (1 - p) * q2, ABn = p * (1 - q1), NABn = (1 - p) * (1 - q2), PB = AB + NAB;
    const pB = arr(PB, 6);
    let tex, vrai, nd = 4, cands, expl, prem = ctx.prem(c, A, B), extra = '';
    switch (ask) {
      case 'AB': tex = `P(${A}\\cap ${B})`; vrai = AB; cands = [p + q1, q1, p * q2, (1 - p) * q1, ABn, q1 * q2, 1 - AB]; nd = 4;
        expl = `On multiplie les probabilités le long de la branche : ${m(`P(${A}\\cap ${B})=P(${A})\\times P_{${A}}(${B})=${nombre(p)}\\times ${nombre(q1)}=${nombre(AB)}`)}.`; break;
      case 'NAB': tex = `P(${nA}\\cap ${B})`; vrai = NAB; cands = [(1 - p) * q1, p * q2, q2, 1 - NAB, (1 - p) * (1 - q2), AB]; nd = 4;
        expl = `${m(`P(${nA}\\cap ${B})=P(${nA})\\times P_{${nA}}(${B})=${nombre(1 - p)}\\times ${nombre(q2)}=${nombre(NAB)}`)}.`; break;
      case 'BnA': tex = `P_{${A}}(${nB})`; vrai = 1 - q1; nd = 2; cands = [q1, 1 - q2, ABn, 1 - p, q2, p * q1];
        expl = `Les deux branches issues de ${m(A)} ont des probabilités de somme 1 : ${m(`P_{${A}}(${nB})=1-P_{${A}}(${B})=1-${nombre(q1)}=${nombre(1 - q1)}`)}.`; break;
      case 'NABn': tex = `P(${nA}\\cap ${nB})`; vrai = NABn; cands = [(1 - p) * q2, (1 - p) * (1 - q1), 1 - NAB, ABn, (1 - q1) * (1 - q2), 1 - NABn]; nd = 4;
        expl = `${m(`P(${nA}\\cap ${nB})=P(${nA})\\times P_{${nA}}(${nB})=${nombre(1 - p)}\\times ${nombre(1 - q2)}=${nombre(NABn)}`)}.`; break;
      case 'B': tex = `P(${B})`; vrai = PB; nd = 4; cands = [q1 + q2, AB, (q1 + q2) / 2, p * q1 + p * q2, NAB, p * q2 + (1 - p) * q1, 1 - PB];
        expl = `Formule des probabilités totales, ${m(A)} et ${m(nA)} formant une partition : ${m(`P(${B})=P(${A}\\cap ${B})+P(${nA}\\cap ${B})=${nombre(AB)}+${nombre(NAB)}=${nombre(PB)}`)}.`; break;
      case 'Bbar': tex = `P(${nB})`; vrai = 1 - PB; nd = 4; cands = [PB, ABn, (1 - q1 + 1 - q2) / 2, NABn, 1 - AB, 1 - NAB, 1 - p];
        expl = `${m(`P(${nB})=1-P(${B})`)}, avec ${m(`P(${B})=${nombre(AB)}+${nombre(NAB)}=${nombre(PB)}`)}, soit ${m(nombre(1 - PB))}.`; break;
      case 'AgB': tex = `P_{${B}}(${A})`; vrai = AB / PB; nd = 2; cands = [AB, q1, p, NAB / PB, AB / (1 - PB), p * q1 / (q1 + q2), (1 - p) * q2 / PB];
        expl = `Formule de Bayes : ${m(`P_{${B}}(${A})=\\dfrac{P(${A}\\cap ${B})}{P(${B})}=\\dfrac{${nombre(AB)}}{${nombre(PB)}}`)}, avec ${m(`P(${B})=${nombre(PB)}`)} (probabilités totales).`; break;
      case 'NAgB': tex = `P_{${B}}(${nA})`; vrai = NAB / PB; nd = 2; cands = [NAB, q2, 1 - p, AB / PB, NAB / (1 - PB), (1 - p) * q2 / (q1 + q2)];
        expl = `${m(`P_{${B}}(${nA})=\\dfrac{P(${nA}\\cap ${B})}{P(${B})}=\\dfrac{${nombre(NAB)}}{${nombre(PB)}}`)}, avec ${m(`P(${B})=${nombre(PB)}`)}.`; break;
      case 'AgNB': tex = `P_{${nB}}(${A})`; vrai = ABn / (1 - PB); nd = 2; cands = [ABn, 1 - q1, p, AB / PB, ABn / PB, NABn / (1 - PB)];
        expl = `${m(`P_{${nB}}(${A})=\\dfrac{P(${A}\\cap ${nB})}{P(${nB})}=\\dfrac{${nombre(ABn)}}{${nombre(1 - PB)}}`)}, avec ${m(`P(${nB})=1-P(${B})=${nombre(1 - PB)}`)}.`; break;
      case 'p': tex = `P(${A})`; vrai = p; nd = 2; cands = [pB - q2, (pB - q2) / q1, (pB - q2) / (q1 + q2), pB / (q1 + q2), 1 - p, pB / q1, (pB - q1) / (q2 - q1) + 0.1];
        extra = ` On sait aussi que ${m(`P(${B})=${nombre(PB)}`)}.`;
        expl = `Probabilités totales : ${m(`P(${B})=P(${A})\\times ${nombre(q1)}+(1-P(${A}))\\times ${nombre(q2)}`)}, donc ${m(`${nombre(PB)}=${nombre(q2)}+P(${A})\\times(${nombre(q1)}-${nombre(q2)})`)} et ${m(`P(${A})=\\dfrac{${nombre(PB)}-${nombre(q2)}}{${nombre(q1)}-${nombre(q2)}}=${nombre(p)}`)}.`; break;
      default: tex = `P_{${nA}}(${B})`; vrai = q2; nd = 2; cands = [pB - AB, (pB - AB) / p, (pB - q1) / (1 - p), pB - q1, q1 - pB, 1 - q2, (pB - AB) * (1 - p)];
        prem = `${m(A)} et ${m(B)} sont deux événements d'un univers ${m(T`\Omega`)} tels que ${m(`P(${A})=${nombre(p)}`)}, ${m(`P_{${A}}(${B})=${nombre(q1)}`)} et ${m(`P(${B})=${nombre(PB)}`)}.`;
        expl = `Probabilités totales : ${m(`${nombre(PB)}=${nombre(p)}\\times ${nombre(q1)}+${nombre(1 - p)}\\times P_{${nA}}(${B})`)}, donc ${m(`P_{${nA}}(${B})=\\dfrac{${nombre(PB)}-${nombre(AB)}}{${nombre(1 - p)}}=${nombre(q2)}`)}.`; break;
    }
    if (ask === 'p') prem = `${m(A)} et ${m(B)} sont deux événements d'un univers ${m(T`\Omega`)} tels que ${m(`P_{${A}}(${B})=${nombre(q1)}`)} et ${m(`P_{${nA}}(${B})=${nombre(q2)}`)}.`;
    const o = optsNum(vrai, cands, nd, true);
    if (o.faux.length < 3) return null;
    return qcm(`${prem}${extra} Quelle est la valeur de ${m(tex)}${mentionArrondi(vrai, nd)} ?`, texOpt(o.bonne), o.faux.map(texOpt),
      { explication: expl, meta: { tipo: 'arbre2', p: c.p, q1: c.q1, q2: c.q2, ask, nd } });
  }

  const PART3 = [[50, 30, 20], [40, 40, 20], [25, 25, 50], [60, 30, 10], [20, 30, 50], [10, 40, 50]];
  function arbre3(niveau) {
    const ps = aleaParmi(PART3), qs = [0, 0, 0].map(() => aleaParmi([5, 10, 15, 20, 25, 30, 40, 50, 60, 70]));
    const P = ps.map(x => x / 100), Qs = qs.map(x => x / 100), joint = P.map((x, i) => x * Qs[i]), PB = joint.reduce((a, b) => a + b, 0);
    const k = alea(0, 2), bayes = Math.random() < 0.5, nom = i => `A_{${i + 1}}`;
    const prem = `Les événements ${m(nom(0))}, ${m(nom(1))} et ${m(nom(2))} forment une partition de l'univers, avec ${[0, 1, 2].map(i => m(`P(${nom(i)})=${nombre(P[i])}`)).join(', ')}. Pour un événement ${m('B')}, on sait que ${[0, 1, 2].map(i => m(`P_{${nom(i)}}(B)=${nombre(Qs[i])}`)).join(', ')}.`;
    if (!bayes) {
      const vrai = PB, cands = [Qs[0] + Qs[1] + Qs[2], (Qs[0] + Qs[1] + Qs[2]) / 3, joint[k], Math.max(...joint), P[0] * Qs[1] + P[1] * Qs[2] + P[2] * Qs[0], Qs[k]];
      const o = optsNum(vrai, cands, 4, true); if (o.faux.length < 3) return null;
      return qcm(`${prem} Quelle est la valeur de ${m('P(B)')} ?`, texOpt(o.bonne), o.faux.map(texOpt),
        { explication: `Probabilités totales : ${m(`P(B)=\\sum_{i=1}^{3}P(${T`A_i`})P_{${T`A_i`}}(B)=${[0, 1, 2].map(i => nombre(joint[i])).join('+')}=${nombre(PB)}`)}.`, meta: { tipo: 'arbre3', ps, qs, ask: 'B', nd: 4 } });
    }
    const vrai = joint[k] / PB, cands = [joint[k], Qs[k], P[k], joint[(k + 1) % 3] / PB, joint[(k + 2) % 3] / PB, Qs[k] / (Qs[0] + Qs[1] + Qs[2]), P[k] * Qs[k] / (1 - PB)];
    const o = optsNum(vrai, cands, 2, true); if (o.faux.length < 3) return null;
    return qcm(`${prem} Quelle est la valeur de ${m(`P_{B}(${nom(k)})`)}${mentionArrondi(vrai, 2)} ?`, texOpt(o.bonne), o.faux.map(texOpt),
      { explication: `${m(`P_{B}(${nom(k)})=\\dfrac{P(${nom(k)}\\cap B)}{P(B)}=\\dfrac{${nombre(joint[k])}}{${nombre(PB)}}`)}, avec ${m(`P(B)=${nombre(PB)}`)} (probabilités totales).`, meta: { tipo: 'arbre3', ps, qs, ask: 'bayes', k, nd: 2 } });
  }
  const arbre = niveau => (niveau === 3 && Math.random() < 0.3 ? arbre3(3) : arbre2(niveau));

  // ==========================================================================
  // 2. Événements : réunion, indépendance, tirages successifs
  // ==========================================================================
  function evenementUnion() {                      // P(A∪B), P(A∩B̄), P(Ā∩B̄) avec P(A∩B) donné
    const a = aleaParmi([0.3, 0.4, 0.5, 0.6, 0.7, 0.8]), b = aleaParmi([0.2, 0.3, 0.4, 0.5, 0.6, 0.7]), cmax = Math.min(a, b);
    const c = aleaParmi([0.05, 0.1, 0.15, 0.2, 0.25, 0.3].filter(x => x < cmax - 0.04)); if (c === undefined) return null;
    const ask = aleaParmi(['U', 'AnB', 'NN']), U = a + b - c;
    const base = `${m('A')} et ${m('B')} sont deux événements tels que ${m(`P(A)=${nombre(a)}`)}, ${m(`P(B)=${nombre(b)}`)} et ${m(`P(A\\cap B)=${nombre(c)}`)}.`;
    let tex, vrai, cands, expl;
    if (ask === 'U') { tex = T`P(A\cup B)`; vrai = U; cands = [a + b, a + b + c, a * b, a + b - 2 * c, Math.max(a, b), 1 - U]; expl = `${m(T`P(A\cup B)=P(A)+P(B)-P(A\cap B)=${nombre(a)}+${nombre(b)}-${nombre(c)}=${nombre(U)}`)}.`; }
    else if (ask === 'AnB') { tex = T`P\left(A\cap\overline{B}\right)`; vrai = a - c; cands = [a + c, a - b, a * (1 - b), 1 - c, b - c, a]; expl = `${m(T`P\left(A\cap\overline{B}\right)=P(A)-P(A\cap B)=${nombre(a)}-${nombre(c)}=${nombre(a - c)}`)}.`; }
    else { tex = T`P\left(\overline{A}\cap\overline{B}\right)`; vrai = 1 - U; cands = [1 - a - b, 1 - a * b, (1 - a) * (1 - b), 1 - c, U, 1 - a - b + 2 * c]; expl = `${m(T`P\left(\overline{A}\cap\overline{B}\right)=1-P(A\cup B)=1-${nombre(U)}=${nombre(1 - U)}`)}.`; }
    const o = optsNum(vrai, cands, 3, true); if (o.faux.length < 3) return null;
    return qcm(`${base} Quelle est la valeur de ${m(tex)} ?`, texOpt(o.bonne), o.faux.map(texOpt), { explication: expl, meta: { tipo: 'union', a, b, c, ask } });
  }
  function evenementIndependant() {                // événements indépendants, composants en série ou en parallèle
    const t = aleaParmi(['AB', 'U', 'NN', 'au-moins', 'bus', 'tous']);
    if (t === 'AB' || t === 'U' || t === 'NN') {
      const a = aleaParmi([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]), b = aleaParmi([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]);
      const tex = { AB: T`P(A\cap B)`, U: T`P(A\cup B)`, NN: T`P\left(\overline{A}\cap\overline{B}\right)` }[t], vrai = { AB: a * b, U: a + b - a * b, NN: (1 - a) * (1 - b) }[t];
      const cands = [a + b, a + b - a * b, a * b, (1 - a) * (1 - b), 1 - a * b, a + b - 2 * a * b, (a + b) / 2, 1 - (a + b)];
      const o = optsNum(vrai, cands, 4, true); if (o.faux.length < 3) return null;
      const expl = { AB: `Les événements sont indépendants : ${m(T`P(A\cap B)=P(A)\times P(B)=${nombre(a)}\times ${nombre(b)}=${nombre(a * b)}`)}.`, U: `${m(T`P(A\cap B)=P(A)\times P(B)=${nombre(a * b)}`)} puis ${m(T`P(A\cup B)=${nombre(a)}+${nombre(b)}-${nombre(a * b)}=${nombre(a + b - a * b)}`)}.`, NN: `Si ${m('A')} et ${m('B')} sont indépendants, ${m(T`\overline{A}`)} et ${m(T`\overline{B}`)} le sont aussi : ${m(T`${nombre(1 - a)}\times ${nombre(1 - b)}=${nombre((1 - a) * (1 - b))}`)}.` }[t];
      return qcm(`${m('A')} et ${m('B')} sont deux événements indépendants tels que ${m(`P(A)=${nombre(a)}`)} et ${m(`P(B)=${nombre(b)}`)}. Quelle est la valeur de ${m(tex)} ?`, texOpt(o.bonne), o.faux.map(texOpt), { explication: expl, meta: { tipo: 'indep', a, b, ask: t } });
    }
    if (t === 'bus') {
      const a = aleaParmi([0.7, 0.75, 0.8, 0.85, 0.9]), b = aleaParmi([0.6, 0.7, 0.8, 0.9, 0.95]), vrai = 1 - (1 - a) * (1 - b);
      const o = optsNum(vrai, [a + b, a * b, (a + b) / 2, 1 - a * b, Math.max(a, b), (1 - a) * (1 - b), a + b - 2 * a * b], 4, true); if (o.faux.length < 3) return null;
      return qcm(`Pour aller à son travail, Léa prend le bus ou le train, indépendamment l'un de l'autre. Le bus est à l'heure avec la probabilité ${plain(a)} et le train avec la probabilité ${plain(b)}. Quelle est la probabilité qu'au moins un des deux soit à l'heure ?`, texOpt(o.bonne), o.faux.map(texOpt),
        { explication: `Le contraire de « au moins un est à l'heure » est « aucun n'est à l'heure » : ${m(`1-(1-${nombre(a)})(1-${nombre(b)})=1-${nombre((1 - a) * (1 - b))}=${nombre(vrai)}`)}.`, meta: { tipo: 'composants', ps: [a, b], ask: 'au-moins' } });
    }
    const n = aleaParmi([2, 3, 4, 5]), p = aleaParmi([0.5, 0.6, 0.7, 0.8, 0.9, 0.95]), au = t === 'au-moins';
    const vrai = au ? 1 - Math.pow(1 - p, n) : Math.pow(p, n);
    const o = optsNum(vrai, [Math.pow(p, n), 1 - Math.pow(p, n), n * p, Math.pow(1 - p, n), 1 - n * (1 - p), 1 - (1 - p) * n, Math.pow(p, n - 1), 1 - Math.pow(1 - p, n - 1)], 4, true); if (o.faux.length < 3) return null;
    return qcm(`Un système comporte ${n} composants qui fonctionnent indépendamment les uns des autres ; chacun fonctionne avec la probabilité ${plain(p)}. Quelle est la probabilité ${au ? 'qu\'au moins un composant fonctionne' : 'que tous les composants fonctionnent'} ?`, texOpt(o.bonne), o.faux.map(texOpt),
      { explication: au ? `Le contraire de « au moins un fonctionne » est « aucun ne fonctionne », de probabilité ${m(`(1-${nombre(p)})^{${n}}`)} : la réponse est ${m(`1-(${nombre(1 - p)})^{${n}}=${nombre(vrai)}`)}.` : `Les composants sont indépendants : ${m(`${nombre(p)}^{${n}}=${nombre(vrai)}`)}.`, meta: { tipo: 'composants', ps: Array(n).fill(p), ask: au ? 'au-moins' : 'tous' } });
  }
  function tirages() {                              // urne : tirages successifs avec ou sans remise
    const r = alea(2, 7), b = alea(2, 7), avec = Math.random() < 0.5, N = r + b;
    const ask = aleaParmi(['RR', 'RB', 'MC', 'une']);
    const ctx = `Une urne contient ${r} boules rouges et ${b} boules bleues, indiscernables au toucher. On tire successivement deux boules ${avec ? 'avec remise' : 'sans remise'}.`;
    const den = avec ? N * N : N * (N - 1);
    const nbRR = avec ? r * r : r * (r - 1), nbBB = avec ? b * b : b * (b - 1), nbRB = 2 * r * b;
    const vraiN = { RR: nbRR, RB: nbRB, MC: nbRR + nbBB, une: den - nbBB }[ask];
    const tex = { RR: 'obtenir deux boules rouges', RB: 'obtenir une boule rouge et une boule bleue (dans un ordre quelconque)', MC: 'obtenir deux boules de la même couleur', une: 'obtenir au moins une boule rouge' }[ask];
    const vrai = Q(vraiN, den), alt = avec ? N * (N - 1) : N * N;
    const cl = [Q(r * r, N * N), Q(r * (r - 1), N * (N - 1)), Q(r * b, den), Q(nbRB, alt), Q(r, N), Q(r + b, den), Q(nbRR, alt), Q(nbRR + nbBB, alt), Q(den - nbBB, alt), Q(r * (r - 1) + b * (b - 1), N * N), Q(2 * r, N)];
    const vus = new Set([qtex(vrai)]), faux = [];
    for (const c of cl) { if (c.v > 1 || c.v <= 0) continue; const t = qtex(c); if (vus.has(t)) continue; vus.add(t); faux.push(t); }
    if (faux.length < 3) return null;
    const expl = { RR: avec ? `Les tirages sont indépendants : ${m(T`\dfrac{${r}}{${N}}\times\dfrac{${r}}{${N}}`)}.` : `Sans remise, la composition change : ${m(T`\dfrac{${r}}{${N}}\times\dfrac{${r - 1}}{${N - 1}}`)}.`,
      RB: `Deux ordres possibles (rouge puis bleue, ou bleue puis rouge) : ${m(avec ? T`2\times\dfrac{${r}}{${N}}\times\dfrac{${b}}{${N}}` : T`2\times\dfrac{${r}}{${N}}\times\dfrac{${b}}{${N - 1}}`)}.`,
      MC: `On additionne « deux rouges » et « deux bleues » : ${m(avec ? T`\dfrac{${r * r}}{${N * N}}+\dfrac{${b * b}}{${N * N}}` : T`\dfrac{${r * (r - 1)}}{${N * (N - 1)}}+\dfrac{${b * (b - 1)}}{${N * (N - 1)}}`)}.`,
      une: `Le contraire est « deux boules bleues » : ${m(avec ? T`1-\dfrac{${b}}{${N}}\times\dfrac{${b}}{${N}}` : T`1-\dfrac{${b}}{${N}}\times\dfrac{${b - 1}}{${N - 1}}`)}.` }[ask];
    return qcm(`${ctx} Quelle est la probabilité d'${tex} ?`, texOpt(qtex(vrai)), faux.map(texOpt), { explication: `${expl} On trouve ${m(qtex(vrai))}.`, meta: { tipo: 'urne', r, b, avec, ask } });
  }
  function tirages3() {                             // trois tirages sans remise
    const r = alea(3, 6), b = alea(2, 5), N = r + b, ask = aleaParmi(['au-moins-bleue', 'exactement-2R']);
    const tot = N * (N - 1) * (N - 2), RRR = r * (r - 1) * (r - 2), nb = ask === 'au-moins-bleue' ? tot - RRR : 3 * r * (r - 1) * b;
    const vrai = Q(nb, tot), cl = [Q(RRR, tot), Q(r * (r - 1) * b, tot), Q(3 * r * r * b, N * N * N), Q(tot - RRR, N * N * N), Q(3 * r * (r - 1) * b, N * N * N), Q(r * r * b, N * N * N), Q(b, N), Q(3 * b, N)];
    const vus = new Set([qtex(vrai)]), faux = [];
    for (const c of cl) { if (c.v > 1 || c.v <= 0) continue; const t = qtex(c); if (vus.has(t)) continue; vus.add(t); faux.push(t); }
    if (faux.length < 3) return null;
    return qcm(`Une urne contient ${r} boules rouges et ${b} boules bleues. On tire successivement et sans remise trois boules. Quelle est la probabilité d'obtenir ${ask === 'au-moins-bleue' ? 'au moins une boule bleue' : 'exactement deux boules rouges'} ?`, texOpt(qtex(vrai)), faux.map(texOpt),
      { explication: ask === 'au-moins-bleue' ? `Le contraire est « trois boules rouges » : ${m(`1-\\dfrac{${r}}{${N}}\\times\\dfrac{${r - 1}}{${N - 1}}\\times\\dfrac{${r - 2}}{${N - 2}}=${qtex(vrai)}`)}.` : `Trois places possibles pour la boule bleue, chaque ordre de probabilité ${m(`\\dfrac{${r}}{${N}}\\times\\dfrac{${r - 1}}{${N - 1}}\\times\\dfrac{${b}}{${N - 2}}`)} : ${m(`3\\times\\dfrac{${r * (r - 1) * b}}{${tot}}=${qtex(vrai)}`)}.`, meta: { tipo: 'urne3', r, b, ask } });
  }
  function independanceClaims() {                  // indépendants, incompatibles, inclus…
    const sc = aleaParmi(['indep', 'incomp', 'inclus']);
    let a, b, c;
    if (sc === 'indep') { a = aleaParmi([0.2, 0.4, 0.5, 0.6]); b = aleaParmi([0.25, 0.5, 0.75, 0.8, 0.3].filter(x => x !== a)); c = arr(a * b, 6); }
    else if (sc === 'incomp') { a = aleaParmi([0.2, 0.3, 0.4]); b = aleaParmi([0.15, 0.25, 0.35, 0.5].filter(x => x !== a)); c = 0; }
    else { a = aleaParmi([0.1, 0.2, 0.3]); b = aleaParmi([0.4, 0.5, 0.6, 0.7]); c = a; }
    const S = [
      opt(`${m('A')} et ${m('B')} sont indépendants`, 'indep'),
      opt(`${m('A')} et ${m('B')} sont incompatibles`, 'incomp'),
      opt(`${m('A')} est incluse dans ${m('B')}`, 'inclus'),
      opt(`${m(T`\overline{A}`)} et ${m(T`\overline{B}`)} sont incompatibles`, 'egal')
    ];
    const bonne = S[{ indep: 0, incomp: 1, inclus: 2 }[sc]], faux = S.filter(x => x !== bonne);
    return qcm(`${m('A')} et ${m('B')} sont deux événements tels que ${m(`P(A)=${nombre(a)}`)}, ${m(`P(B)=${nombre(b)}`)} et ${m(`P(A\\cap B)=${nombre(c)}`)}. Quelle affirmation est vraie ?`, bonne, faux,
      { explication: sc === 'indep' ? `${m(T`P(A)\times P(B)=${nombre(a)}\times ${nombre(b)}=${nombre(a * b)}=P(A\cap B)`)} : les événements sont indépendants.` : sc === 'incomp' ? `${m(T`P(A\cap B)=0`)} : les événements ne peuvent pas se réaliser ensemble, ils sont incompatibles.` : `${m(T`P(A\cap B)=P(A)`)} : tout ce qui réalise ${m('A')} réalise ${m('B')}, donc ${m('A')} est incluse dans ${m('B')}.`,
        meta: { tipo: 'claims', a, b, c } });
  }
  const evenements = niveau => (niveau === 1 ? aleaParmi([evenementUnion, evenementIndependant])() : niveau === 2 ? aleaParmi([evenementIndependant, tirages, tirages, independanceClaims, evenementUnion])() : aleaParmi([tirages3, tirages, independanceClaims, evenementIndependant])());

  // ==========================================================================
  // 3. Loi binomiale : identification, espérance et variance, expressions
  // ==========================================================================
  const SITUATIONS = [
    { t: n => `On lance ${n} fois de suite un dé équilibré à six faces. On note ${m('X')} le nombre de fois où l'on obtient un 6.`, p: Q(1, 6), mot: 'un 6' },
    { t: n => `On lance ${n} fois de suite un dé équilibré à six faces. On note ${m('X')} le nombre de fois où l'on obtient un nombre pair.`, p: Q(1, 2), mot: 'un nombre pair' },
    { t: n => `On lance ${n} fois de suite un dé équilibré à six faces. On note ${m('X')} le nombre de fois où l'on obtient un multiple de 3.`, p: Q(1, 3), mot: 'un multiple de 3' },
    { t: n => `On tire ${n} fois de suite, avec remise, une boule dans une urne contenant 3 boules rouges et 2 boules noires. On note ${m('X')} le nombre de boules rouges obtenues.`, p: Q(3, 5), mot: 'une boule rouge' },
    { t: n => `Un archer atteint sa cible avec la probabilité 0,7 à chaque tir, les tirs étant indépendants. Il effectue ${n} tirs. On note ${m('X')} le nombre de tirs réussis.`, p: Q(7, 10), mot: 'un tir réussi' },
    { t: n => `Un élève répond au hasard à un QCM de ${n} questions, chacune comportant quatre propositions dont une seule est exacte. On note ${m('X')} le nombre de bonnes réponses.`, p: Q(1, 4), mot: 'une bonne réponse' },
    { t: n => `Dans une grande production, 5 % des pièces sont défectueuses. On prélève ${n} pièces au hasard, de façon indépendante. On note ${m('X')} le nombre de pièces défectueuses.`, p: Q(1, 20), mot: 'une pièce défectueuse' },
    { t: n => `Un site reçoit la visite de ${n} internautes indépendants ; chacun achète un produit avec la probabilité 0,38. On note ${m('X')} le nombre d'acheteurs.`, p: Q(19, 50), mot: 'un acheteur' }
  ];
  const ptex = (p, dec) => (dec ? nombre(p.v) : fracL(p.n, p.d));
  const loiTex = (n, p, dec) => T`\mathcal{B}\left(${n}\,;${ptex(p, dec)}\right)`;
  function binomLoi(niveau) {
    const S = aleaParmi(SITUATIONS), n = aleaParmi([5, 6, 8, 10, 12, 15, 20, 30]), p = S.p, dec = p.d === 10 || p.d === 20 || p.d === 50;
    const nom = loiTex(n, p, dec), q = Q(p.d - p.n, p.d);
    const ask = niveau === 1 ? aleaParmi(['loi', 'esp']) : aleaParmi(['esp', 'var', 'loi']);
    if (ask === 'loi') {
      const faux = [loiTex(n, q, dec), loiTex(n + 1, p, dec), loiTex(n - 1, p, dec), loiTex(n, Q(1, 2), dec), loiTex(n, Q(p.n + 1, p.d), dec)].filter((t, i, a) => t !== nom && a.indexOf(t) === i);
      if (faux.length < 3) return null;
      return qcm(`${S.t(n)} Quelle est la loi suivie par ${m('X')} ?`, texOpt(nom), faux.map(texOpt),
        { explication: `On répète ${n} fois de façon indépendante la même épreuve de Bernoulli (succès : ${S.mot}, de probabilité ${m(ptex(p, dec))}) : ${m('X')} suit la loi binomiale ${m(nom)}.`, meta: { tipo: 'binom-loi', n, p: { n: p.n, d: p.d } } });
    }
    if (ask === 'esp') {
      const E = Q(n * p.n, p.d), fmt = r => (dec ? nombre(r.v) : qtex(r));
      const cl = [Q(n * p.n, p.d * 2), Q(n, 1), Q(p.n * (p.d - p.n) * n, p.d * p.d), Q(n * (p.d - p.n), p.d), Q(n + p.n, p.d), Q(p.n, p.d), Q(n * p.n * 2, p.d)];
      const vus = new Set([fmt(E)]), faux = [];
      for (const c of cl) { const t = fmt(c); if (vus.has(t) || c.v <= 0) continue; vus.add(t); faux.push(t); }
      if (faux.length < 3) return null;
      return qcm(`${S.t(n)} On admet que ${m('X')} suit la loi binomiale ${m(nom)}. Quelle est l'espérance de ${m('X')} ?`, texOpt(fmt(E)), faux.map(texOpt),
        { explication: `${m(T`E(X)=np=${n}\times ${ptex(p, dec)}=${fmt(E)}`)}.`, meta: { tipo: 'binom-esp', n, p: { n: p.n, d: p.d }, ask: 'esp', dec } });
    }
    const Vr = Q(n * p.n * (p.d - p.n), p.d * p.d), E = Q(n * p.n, p.d), fmt = r => (dec ? nombre(r.v) : qtex(r));
    const cl = [E, Q(n * p.n * p.n, p.d * p.d), Q(p.n * (p.d - p.n), p.d * p.d), Q(n * (p.d - p.n), p.d), Q(n * p.n * (p.d - p.n), p.d), Q(n * p.n * (p.d - p.n) * 2, p.d * p.d), Q(n * (p.d - p.n) * (p.d - p.n), p.d * p.d)];
    const vus = new Set([fmt(Vr)]), faux = [];
    for (const c of cl) { const t = fmt(c); if (vus.has(t) || c.v <= 0) continue; vus.add(t); faux.push(t); }
    if (faux.length < 3) return null;
    return qcm(`${S.t(n)} On admet que ${m('X')} suit la loi binomiale ${m(nom)}. Quelle est la variance de ${m('X')} ?`, texOpt(fmt(Vr)), faux.map(texOpt),
      { explication: `${m(T`V(X)=np(1-p)=${n}\times ${ptex(p, dec)}\times ${ptex(q, dec)}=${fmt(Vr)}`)}.`, meta: { tipo: 'binom-esp', n, p: { n: p.n, d: p.d }, ask: 'var', dec } });
  }
  // expressions de P(X = k), P(X >= 1)... avec p décimal ou fractionnaire
  const puis = (x, e) => (e === 1 ? `\\left(${x}\\right)` : `\\left(${x}\\right)^{${e}}`);
  function binomExpression(niveau) {
    const S = aleaParmi(SITUATIONS), n = aleaParmi([4, 5, 6, 8, 10, 12]), p = S.p; if (2 * p.n === p.d) return null;
    const dec = p.d === 10 || p.d === 20 || p.d === 50, k = alea(2, Math.min(n - 1, 5)), q = Q(p.d - p.n, p.d);
    const pt = ptex(p, dec), qt = ptex(q, dec), bin = (nn, kk) => `\\binom{${nn}}{${kk}}`;
    const t = niveau === 1 ? 'egal' : aleaParmi(['egal', 'egal', 'au-moins', 'au-plus']);
    let tex, bonne, faux;
    if (t === 'egal') {
      tex = `P(X=${k})`; bonne = `${bin(n, k)}${puis(pt, k)}${puis(qt, n - k)}`;
      faux = [`${bin(n, k)}${puis(pt, n - k)}${puis(qt, k)}`, `${puis(pt, k)}${puis(qt, n - k)}`, `${bin(n, k)}${puis(pt, k)}`, `${bin(n, k)}${puis(pt, k)}${puis(qt, k)}`, `${k}${puis(pt, k)}${puis(qt, n - k)}`, `${bin(n, k)}${puis(pt, k)}${puis(qt, n - k + 1)}`];
    } else if (t === 'au-moins') {
      tex = 'P(X\\ge 1)'; bonne = `1-${puis(qt, n)}`;
      faux = [`${puis(pt, n)}`, `1-${puis(pt, n)}`, `${puis(qt, n)}`, `${n}\\times ${pt}`, `1-${n}\\times ${qt}`, `1-${puis(qt, n - 1)}`];
    } else {
      tex = 'P(X\\le 1)'; bonne = `${puis(qt, n)}+${n}\\times ${pt}\\times ${puis(qt, n - 1)}`;
      faux = [`${puis(qt, n)}`, `1-${puis(qt, n)}`, `${puis(qt, n)}+${pt}${puis(qt, n - 1)}`, `${n}\\times ${pt}\\times ${puis(qt, n - 1)}`, `${puis(pt, n)}+${n}\\times ${qt}\\times ${puis(pt, n - 1)}`, `1-${puis(pt, n)}`];
    }
    const faux2 = faux.filter((x, i, a) => a.indexOf(x) === i && x !== bonne);
    return qcm(`${S.t(n)} On admet que ${m('X')} suit la loi binomiale ${m(loiTex(n, p, dec))}. Quelle expression donne ${m(tex)} ?`, texOpt(bonne), faux2.map(texOpt),
      { explication: t === 'egal' ? `Pour la loi binomiale ${m(T`\mathcal{B}(n\,;p)`)}, ${m(T`P(X=k)=\binom{n}{k}p^{k}(1-p)^{n-k}`)} : ici ${m(`n=${n}`)}, ${m(`k=${k}`)}, ${m(`p=${pt}`)}.` : t === 'au-moins' ? `${m(T`P(X\ge 1)=1-P(X=0)=1-(1-p)^{n}`)} : on passe par l'événement contraire.` : `${m(T`P(X\le 1)=P(X=0)+P(X=1)=(1-p)^{n}+n\,p\,(1-p)^{n-1}`)}.`,
        meta: { tipo: 'binom-expr', n, p: { n: p.n, d: p.d }, ask: t, k } });
  }
  function binomIntervalle() {                      // P(a < X <= b) en fonction de P(X <= k)
    const n = alea(10, 20), p = aleaParmi([0.2, 0.3, 0.4, 0.6, 0.7]), a = alea(2, 5), b = a + alea(2, 4), form = aleaParmi(['lt-le', 'le-le', 'le-lt', 'lt-lt']);
    if (Math.abs((n + 1) * p - Math.round((n + 1) * p)) < 1e-9) return null;        // loi bimodale : P(X=k) = P(X=k+1)
    const tex = { 'lt-le': `P(${a}\\lt X\\le ${b})`, 'le-le': `P(${a}\\le X\\le ${b})`, 'le-lt': `P(${a}\\le X\\lt ${b})`, 'lt-lt': `P(${a}\\lt X\\lt ${b})` }[form];
    const hi = { 'lt-le': b, 'le-le': b, 'le-lt': b - 1, 'lt-lt': b - 1 }[form], lo = { 'lt-le': a, 'le-le': a - 1, 'le-lt': a - 1, 'lt-lt': a }[form];
    const F = i => `P(X\\le ${i})`, diff = (i, j) => `${F(i)}-${F(j)}`;
    const bonne = diff(hi, lo), faux = [];
    const valeurDiff = (i, j) => cdf(n, p, i) - cdf(n, p, j), vBonne = valeurDiff(hi, lo);
    for (const i of [b - 1, b, b + 1]) for (const j of [a - 1, a, a + 1]) { const t = diff(i, j); if (t !== bonne && Math.abs(valeurDiff(i, j) - vBonne) > 1e-6) faux.push(t); }
    const choisis = melanger(faux).slice(0, 3);
    return qcm(`${m('X')} suit la loi binomiale ${m(loiTex(n, Q(Math.round(p * 10), 10), true))}. Laquelle de ces égalités est vraie ?`, opt(m(`${tex}=${bonne}`), `${tex}=${bonne}`), choisis.map(t => opt(m(`${tex}=${t}`), `${tex}=${t}`)),
      { explication: `${m(T`P(X\le k)`)} compte les valeurs ${m('0')} à ${m('k')}. Pour ${m(tex)}, les valeurs retenues vont de ${m(String(lo + 1))} à ${m(String(hi))} : on retranche ${m(F(lo))} à ${m(F(hi))}.`, meta: { tipo: 'binom-intervalle', n, p, a, b, form } });
  }
  const binomiale = niveau => (niveau === 1 ? binomLoi(1) : niveau === 2 ? aleaParmi([binomLoi, binomExpression, binomExpression, binomIntervalle])(2) : aleaParmi([binomExpression, binomIntervalle, binomLoi])(3));

  // ==========================================================================
  // 4. Loi binomiale : calculs, seuils, paramètre inconnu
  // ==========================================================================
  function binomCalcul(niveau) {
    const types = niveau === 1 ? ['egal'] : niveau === 2 ? ['egal', 'le', 'ge'] : ['seuil-n', 'seuil-k', 'param', 'seuil-n', 'seuil-k'];
    const t = aleaParmi(types);
    if (t === 'egal' || t === 'le' || t === 'ge') {
      const n = alea(8, 25), p = aleaParmi([0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7]), k = Math.max(1, Math.min(n - 1, Math.round(n * p) + alea(-2, 2)));
      const vrai = t === 'egal' ? pmf(n, p, k) : t === 'le' ? cdf(n, p, k) : 1 - cdf(n, p, k - 1);
      const tex = t === 'egal' ? `P(X=${k})` : t === 'le' ? `P(X\\le ${k})` : `P(X\\ge ${k})`;
      const cands = t === 'egal' ? [pmf(n, p, k - 1), pmf(n, p, k + 1), cdf(n, p, k), 1 - pmf(n, p, k), Math.pow(p, k) * Math.pow(1 - p, n - k), pmf(n, p, n - k)]
        : t === 'le' ? [cdf(n, p, k - 1), cdf(n, p, k + 1), 1 - cdf(n, p, k), pmf(n, p, k), 1 - cdf(n, p, k - 1)]
          : [1 - cdf(n, p, k), 1 - cdf(n, p, k + 1), cdf(n, p, k), cdf(n, p, k - 1), pmf(n, p, k)];
      if (vrai < 0.01 || vrai > 0.99) return null;
      const o = optsNum(vrai, cands, 3, true); if (o.faux.length < 3) return null;
      return qcm(`${m('X')} suit la loi binomiale ${m(loiTex(n, Q(Math.round(p * 100), 100), true))}. À la calculatrice, quelle est la valeur de ${m(tex)} (arrondie à ${m('10^{-3}')}) ?`, texOpt(o.bonne), o.faux.map(texOpt),
        { explication: `On utilise la fonction binomiale de la calculatrice : ${t === 'egal' ? 'loi de probabilité (binomFdp)' : t === 'le' ? 'fonction de répartition (binomFRép)' : `${m(T`P(X\ge k)=1-P(X\le k-1)`)} avec la fonction de répartition`}. On trouve ${m(o.bonne)}.`, meta: { tipo: 'binom-num', n, p, k, ask: t } });
    }
    if (t === 'seuil-n') {
      const p = aleaParmi([0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5]), alpha = aleaParmi([0.9, 0.95, 0.99]);
      let n = 1; while (1 - Math.pow(1 - p, n) < alpha) n++;
      const cands = [n - 1, n + 1, n - 2, n + 2, Math.ceil(alpha / p), Math.round(1 / p), n + 3].filter(x => x >= 1 && x !== n);
      const faux = [...new Set(cands)]; if (faux.length < 3) return null;
      return qcm(`À chaque essai, un joueur réussit avec la probabilité ${plain(p)} ; les essais sont indépendants. Quel est le plus petit nombre d'essais ${m('n')} pour que la probabilité d'obtenir au moins un succès soit supérieure ou égale à ${plain(alpha)} ?`, texOpt(String(n)), faux.slice(0, 3).map(x => texOpt(String(x))),
        { explication: `${m(`P(X\\ge 1)=1-${nombre(1 - p)}^{n}\\ge ${nombre(alpha)}`)} équivaut à ${m(`${nombre(1 - p)}^{n}\\le ${nombre(1 - alpha)}`)}, soit ${m(`n\\ge\\dfrac{\\ln ${nombre(1 - alpha)}}{\\ln ${nombre(1 - p)}}`)} (${m(T`\ln`)} est négatif, on change le sens). La plus petite valeur entière est ${m(String(n))}.`, meta: { tipo: 'binom-seuil-n', p, alpha } });
    }
    if (t === 'seuil-k') {
      const n = alea(15, 40), p = aleaParmi([0.1, 0.2, 0.3, 0.5, 0.6]), alpha = aleaParmi([0.9, 0.95]);
      let k = 0; while (cdf(n, p, k) < alpha) k++;
      const faux = [...new Set([k - 1, k + 1, k + 2, Math.round(n * p), k - 2].filter(x => x >= 0 && x !== k))]; if (faux.length < 3) return null;
      return qcm(`${m('X')} suit la loi binomiale ${m(loiTex(n, Q(Math.round(p * 10), 10), true))}. Quel est le plus petit entier ${m('k')} tel que ${m(`P(X\\le k)\\ge ${nombre(alpha)}`)} ?`, texOpt(String(k)), faux.slice(0, 3).map(x => texOpt(String(x))),
        { explication: `On calcule ${m('P(X\\le k)')} pour ${m('k')} croissant (tableau de valeurs de la fonction de répartition) : ${m(`P(X\\le ${k - 1})\\approx ${nombre(cdf(n, p, k - 1), 3)}`)} est inférieur à ${m(nombre(alpha))} et ${m(`P(X\\le ${k})\\approx ${nombre(cdf(n, p, k), 3)}`)} est supérieur ou égal à ${m(nombre(alpha))}.`, meta: { tipo: 'binom-seuil-k', n, p, alpha } });
    }
    const mm = alea(2, 5), n = alea(2, 4), den = Math.pow(mm, n), vrai = Q(mm - 1, mm), nom = n === 1 ? 'X' : 'X';
    const cl = [Q(1, mm), Q(1, den), Q(den - 1, den), Q(mm, mm + 1), Q(1, mm - 1 || 2), Q(n, mm), Q(mm - 1, den)];
    const vus = new Set([qtex(vrai)]), faux = [];
    for (const c of cl) { if (c.v > 1 || c.v < 0 || c.v === 0) continue; const tt = qtex(c); if (vus.has(tt)) continue; vus.add(tt); faux.push(tt); }
    if (faux.length < 3) return null;
    return qcm(`${m('X')} suit la loi binomiale de paramètres ${m(`n=${n}`)} et ${m('p')}, avec ${m('p')} inconnu. On sait que ${m(`P(X=0)=${fracL(1, den)}`)}. Quelle est la valeur de ${m('p')} ?`, texOpt(qtex(vrai)), faux.slice(0, 3).map(texOpt),
      { explication: `${m(`P(X=0)=(1-p)^{${n}}=${fracL(1, den)}`)} donc ${m(`1-p=\\dfrac{1}{${mm}}`)} (car ${m(`\\left(\\dfrac{1}{${mm}}\\right)^{${n}}=${fracL(1, den)}`)}), d'où ${m(`p=${qtex(vrai)}`)}.`, meta: { tipo: 'binom-param', n, den } });
  }

  // ==========================================================================
  // 5. Variable aléatoire : espérance, variance, jeu équitable
  // ==========================================================================
  const tableau = (xs, ws, D, dec) => {
    const pr = w => (dec ? nombre(w / D) : fracL(w, D));
    return `\\begin{array}{|c|${xs.map(() => 'c|').join('')}}\\hline x_i & ${xs.join(' & ')} \\\\ \\hline P(X=x_i) & ${ws.map(pr).join(' & ')} \\\\ \\hline \\end{array}`;
  };
  function tirerLoi(nb) {
    for (let essai = 0; essai < 50; essai++) {
      const D = aleaParmi([10, 10, 20, 4, 8, 6, 12]), dec = D === 10 || D === 20;
      const xs = []; while (xs.length < nb) { const v = alea(-6, 12); if (!xs.includes(v)) xs.push(v); }
      xs.sort((a, b) => a - b);
      const ws = Array(nb).fill(1); let reste = D - nb; while (reste > 0) { ws[alea(0, nb - 1)]++; reste--; }
      if (ws.some(w => w < 1)) continue;
      return { xs, ws, D, dec };
    }
    return null;
  }
  const calc = L => { const S1 = L.xs.reduce((a, x, i) => a + x * L.ws[i], 0), S2 = L.xs.reduce((a, x, i) => a + x * x * L.ws[i], 0); return { E: Q(S1, L.D), E2: Q(S2, L.D), V: Q(S2 * L.D - S1 * S1, L.D * L.D), S1, S2 }; };
  function espLoi(niveau) {
    const nb = aleaParmi([3, 3, 4]), L = tirerLoi(nb); if (!L) return null;
    const { E, E2, V, S1 } = calc(L), fmt = r => (L.dec ? nombre(r.v) : qtex(r));
    const ask = niveau === 1 ? 'E' : aleaParmi(['E', 'V', 'mise', 'V']);
    const tab = m(tableau(L.xs, L.ws, L.D, L.dec)), moy = Q(L.xs.reduce((a, x) => a + x, 0), nb);
    let vrai, cands, q, expl;
    if (ask === 'E') {
      vrai = E; cands = [moy, Q(S1, 1), E2, Q(L.xs.reduce((a, x, i) => a + L.ws[i] * Math.abs(x), 0), L.D), Q(L.xs.reduce((a, x, i) => a + x * L.ws[(i + 1) % nb], 0), L.D), V];
      q = `Une variable aléatoire ${m('X')} a la loi donnée par le tableau suivant.<br>${tab}<br>Quelle est son espérance ${m('E(X)')} ?`;
      expl = `${m(`E(X)=\\sum x_i\\,P(X=x_i)=${L.xs.map((x, i) => { const pr = L.dec ? nombre(L.ws[i] / L.D) : fracL(L.ws[i], L.D); return x === 1 ? pr : x === -1 ? '-' + pr : x === 0 ? '0' : `${x < 0 ? '(' + x + ')' : x}\\times ${pr}`; }).join('+').replace(/\+-/g, '-')}=${fmt(E)}`)}.`;
    } else if (ask === 'V') {
      vrai = V; cands = [E2, E, Q(E2.n * E.d * E.d + E.n * E.n * E2.d, E2.d * E.d * E.d), Q(E.n * E.n, E.d * E.d), moy, Q(V.n, V.d * 2)];
      q = `Une variable aléatoire ${m('X')} a la loi donnée par le tableau suivant.<br>${tab}<br>Quelle est sa variance ${m('V(X)')} ?`;
      expl = `${m(`E(X)=${fmt(E)}`)} et ${m(`E(X^2)=\\sum x_i^2\\,P(X=x_i)=${fmt(E2)}`)}. Par la formule de König-Huygens, ${m(`V(X)=E(X^2)-E(X)^2=${fmt(E2)}-${fmt(Q(E.n * E.n, E.d * E.d))}=${fmt(V)}`)}.`;
    } else {
      const g = L.xs.map(x => x + 6), L2 = { xs: g, ws: L.ws, D: L.D, dec: L.dec }, E2g = calc(L2).E; if (E2g.v <= 0) return null;
      const tabG = m(tableau(g, L.ws, L.D, L.dec)), mise = E2g;
      return qcm(`Pour jouer, un joueur mise une somme de ${m(T`m`)} euros. Son gain brut ${m('G')} (en euros) a la loi donnée par le tableau suivant.<br>${tabG}<br>Pour quelle mise ${m('m')} le jeu est-il équitable (gain net d'espérance égale à 0) ?`, texOpt(fmt(mise)),
        [Q(g.reduce((a, x) => a + x, 0), nb), Q(L.xs.reduce((a, x, i) => a + x * L.ws[i], 0), L.D), Q(g[nb - 1], 1), Q(Math.round(mise.v) + 1, 1), Q(g.reduce((a, x, i) => a + x * L.ws[i], 0), 1)].filter((c, i, a) => fmt(c) !== fmt(mise) && a.findIndex(z => fmt(z) === fmt(c)) === i).slice(0, 5).map(c => texOpt(fmt(c))),
        { explication: `Le gain net est ${m('G-m')}, d'espérance ${m('E(G)-m')} : le jeu est équitable si ${m('m=E(G)')}. Ici ${m(`E(G)=${fmt(mise)}`)}.`, meta: { tipo: 'esperance', xs: g, ws: L.ws, D: L.D, ask: 'E' } });
    }
    const vus = new Set([fmt(vrai)]), faux = [], court = c => !L.dec || Math.abs(c.v * 1e4 - Math.round(c.v * 1e4)) < 1e-9;
    for (const c of cands) { const t = fmt(c); if (vus.has(t) || !court(c) || (ask === 'V' && c.v <= 0)) continue; vus.add(t); faux.push(t); }
    if (faux.length < 3) return null;
    return qcm(q, texOpt(fmt(vrai)), faux.slice(0, 3).map(texOpt), { explication: expl, meta: { tipo: 'esperance', xs: L.xs, ws: L.ws, D: L.D, ask } });
  }

  // ==========================================================================
  // 6. Somme, moyenne, linéarité, Bienaymé-Tchebychev
  // ==========================================================================
  function variables(niveau) {
    const t = niveau === 2 ? aleaParmi(['lin-E', 'lin-V', 'som-E', 'som-V']) : aleaParmi(['dif-V', 'moy-E', 'moy-V', 'bt', 'bt-n', 'som-V', 'lin-V']);
    const dec = x => nombre(x, 4);
    if (t === 'lin-E' || t === 'lin-V') {
      const e = alea(-4, 9), v = aleaParmi([1, 2, 3, 4, 5, 6, 9]), a = aleaParmi([2, 3, 4, 5, -2, -3]), b = aleaParmi([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8]);
      const vrai = t === 'lin-E' ? a * e + b : a * a * v;
      const cands = t === 'lin-E' ? [a * e, e + b, a * (e + b), a + e + b, a * e - b, e] : [a * v, a * a * v + b, a * v + b, v, a * a + v, Math.abs(a) * v];
      const o = optsNum(vrai, cands, 2); if (o.faux.length < 3) return null;
      const f = `${a}X${sgn(b)}`;
      return qcm(`${m('X')} est une variable aléatoire d'espérance ${m(`E(X)=${e}`)} et de variance ${m(`V(X)=${v}`)}. Quelle est la valeur de ${t === 'lin-E' ? m(`E(${f})`) : m(`V(${f})`)} ?`, texOpt(o.bonne), o.faux.map(texOpt),
        { explication: t === 'lin-E' ? `Linéarité : ${m(`E(aX+b)=aE(X)+b=${a}\\times ${e}${sgn(b)}=${vrai}`)}.` : `${m(`V(aX+b)=a^2V(X)`)} : le décalage ${m('b')} ne change pas la variance et le coefficient est élevé au carré : ${m(`${a}^2\\times ${v}=${vrai}`)}.`, meta: { tipo: 'variables', kind: t, e, v, a, b } });
    }
    if (t === 'som-E' || t === 'som-V' || t === 'dif-V') {
      const e1 = alea(-3, 8), e2 = alea(-3, 8), v1 = aleaParmi([1, 2, 3, 4, 5, 9]), v2 = aleaParmi([1, 2, 3, 4, 6, 8]);
      const vrai = t === 'som-E' ? e1 + e2 : v1 + v2;
      const cands = t === 'som-E' ? [e1 * e2, e1 - e2, e1 + e2 + 1, (e1 + e2) / 2, e1 + e2 - 1] : [v1 - v2, v1 * v2, Math.sqrt(v1) + Math.sqrt(v2), (v1 + v2) / 2, v1 + v2 + 2, Math.abs(v1 - v2)];
      const o = optsNum(vrai, cands, 2); if (o.faux.length < 3) return null;
      const f = t === 'dif-V' ? 'X-Y' : 'X+Y';
      return qcm(`${m('X')} et ${m('Y')} sont deux variables aléatoires indépendantes, avec ${m(`E(X)=${e1}`)}, ${m(`E(Y)=${e2}`)}, ${m(`V(X)=${v1}`)} et ${m(`V(Y)=${v2}`)}. Quelle est la valeur de ${t === 'som-E' ? m(`E(${f})`) : m(`V(${f})`)} ?`, texOpt(o.bonne), o.faux.map(texOpt),
        { explication: t === 'som-E' ? `Linéarité de l'espérance : ${m(`E(X+Y)=E(X)+E(Y)=${e1}${sgn(e2)}=${vrai}`)}.` : t === 'som-V' ? `Pour des variables indépendantes, ${m(`V(X+Y)=V(X)+V(Y)=${v1}+${v2}=${vrai}`)}.` : `Pour des variables indépendantes, les variances s'additionnent aussi pour une différence : ${m(`V(X-Y)=V(X)+(-1)^2V(Y)=${v1}+${v2}=${vrai}`)}.`, meta: { tipo: 'variables', kind: t, e1, e2, v1, v2 } });
    }
    if (t === 'moy-E' || t === 'moy-V') {
      const n = aleaParmi([4, 5, 8, 10, 16, 20, 25, 50]), mu = alea(2, 20), v = aleaParmi([4, 9, 16, 36, 64, 100]);
      const vrai = t === 'moy-E' ? mu : v / n;
      const cands = t === 'moy-E' ? [n * mu, mu / n, mu * mu, mu + n, v] : [v * n, v, Math.sqrt(v) / n, v / Math.sqrt(n), Math.sqrt(v / n), v / (n * n)];
      const o = optsNum(vrai, cands, 4); if (o.faux.length < 3) return null;
      return qcm(`Soit ${m(`(X_1,\\ldots,X_{${n}})`)} un échantillon de ${n} variables aléatoires indépendantes, de même loi, d'espérance ${m(`\\mu=${mu}`)} et de variance ${m(`\\sigma^2=${v}`)}. On note ${m(`M_{${n}}=\\dfrac{X_1+\\cdots+X_{${n}}}{${n}}`)}. Quelle est la valeur de ${t === 'moy-E' ? m(`E(M_{${n}})`) : m(`V(M_{${n}})`)} ?`, texOpt(o.bonne), o.faux.map(texOpt),
        { explication: t === 'moy-E' ? `${m(`E(S_{${n}})=${n}\\mu`)} et ${m(`M_{${n}}=\\dfrac{S_{${n}}}{${n}}`)}, donc ${m(`E(M_{${n}})=\\mu=${mu}`)}.` : `${m(`V(S_{${n}})=${n}\\sigma^2`)} (indépendance) et ${m(`V\\left(\\dfrac{S_{${n}}}{${n}}\\right)=\\dfrac{1}{${n}^2}V(S_{${n}})=\\dfrac{\\sigma^2}{${n}}=${nombre(vrai, 4)}`)}.`, meta: { tipo: 'variables', kind: t, n, mu, v } });
    }
    if (t === 'bt') {
      const v = aleaParmi([2, 4, 5, 8, 9, 10]), aa = aleaParmi([2, 4, 5, 10]), mu = alea(5, 30), vrai = v / (aa * aa);
      const o = optsNum(vrai, [Math.sqrt(v) / aa, v / aa, v / (2 * aa), v / aa / aa * 2, mu / aa, 1 - vrai], 4, true); if (o.faux.length < 3) return null;
      return qcm(`${m('X')} est une variable aléatoire d'espérance ${m(`\\mu=${mu}`)} et de variance ${m(`V(X)=${v}`)}. D'après l'inégalité de Bienaymé-Tchebychev, quelle est la meilleure majoration obtenue pour ${m(`P\\left(|X-${mu}|\\ge ${aa}\\right)`)} ?`, texOpt(o.bonne), o.faux.map(texOpt),
        { explication: `${m(T`P\left(|X-\mu|\ge\delta\right)\le\dfrac{V(X)}{\delta^2}`)} : ici ${m(`\\dfrac{${v}}{${aa}^2}=${nombre(vrai, 4)}`)}.`, meta: { tipo: 'variables', kind: 'bt', v, a: aa } });
    }
    const v = aleaParmi([4, 9, 16, 25, 36]), dl = aleaParmi([0.5, 1, 2]), al = aleaParmi([0.05, 0.1, 0.01]);   // bt-n : taille d'échantillon
    const nn = Math.ceil(v / (al * dl * dl) - 1e-9);
    const faux = [...new Set([Math.ceil(Math.sqrt(v) / (al * dl)), Math.ceil(v / (al * dl)), Math.ceil(v / (al * dl * dl) / 2), Math.ceil(v * al / (dl * dl)), nn + 1, nn - 1].filter(x => x !== nn && x > 0))];
    if (faux.length < 3) return null;
    return qcm(`Les variables ${m('X_1,X_2,\\ldots')} sont indépendantes, de même loi, d'espérance ${m(T`\mu`)} et de variance ${m(`\\sigma^2=${v}`)}. On note ${m('M_n')} leur moyenne empirique. Avec l'inégalité de Bienaymé-Tchebychev, quelle valeur minimale de ${m('n')} garantit ${m(`P\\left(|M_n-\\mu|\\ge ${nombre(dl)}\\right)\\le ${nombre(al)}`)} ?`, texOpt(String(nn)), faux.slice(0, 3).map(x => texOpt(String(x))),
      { explication: `${m(`V(M_n)=\\dfrac{${v}}{n}`)}, donc ${m(`P\\left(|M_n-\\mu|\\ge ${nombre(dl)}\\right)\\le\\dfrac{${v}}{n\\times ${nombre(dl)}^2}`)}. On veut ${m(`\\dfrac{${v}}{n\\times ${nombre(dl)}^2}\\le ${nombre(al)}`)}, soit ${m(`n\\ge\\dfrac{${v}}{${nombre(al)}\\times ${nombre(dl)}^2}=${nombre(v / (al * dl * dl), 4)}`)}, donc ${m(`n=${nn}`)}.`, meta: { tipo: 'variables', kind: 'bt-n', v, dl, al } });
  }

  // ==========================================================================
  // Enregistrement
  // ==========================================================================
  Automatismes.enregistrerBanque('probabilites', {
    titre: 'Probabilités',
    familles: {
      'arbre': famille({ nom: 'probabilités conditionnelles et totales', niveaux: [1, 2, 3], base: retente(arbre) }),
      'evenements': famille({ nom: 'événements, indépendance, tirages', niveaux: [1, 2, 3], base: retente(evenements) }),
      'binomiale': famille({ nom: 'loi binomiale : loi, formules', niveaux: [1, 2, 3], base: retente(binomiale) }),
      'binomiale-calcul': famille({ nom: 'loi binomiale : calculs et seuils', niveaux: [1, 2, 3], base: retente(binomCalcul) }),
      'esperance': famille({ nom: 'espérance et variance', niveaux: [1, 2, 3], base: retente(n => (n === 3 ? variables(3) : espLoi(n))) }),
      'variables': famille({ nom: 'somme, moyenne, Bienaymé-Tchebychev', niveaux: [2, 3], base: retente(variables) })
    }
  });
})();
