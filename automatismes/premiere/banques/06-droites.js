/* Banque 06 — Droites et repères
   La question la plus systématique du corpus : lire l'équation réduite d'une droite
   tracée dans un repère (Métropole : y = −x+2 ; Polynésie : y = −0,6x+5,2 ;
   Asie : y = −⅓x+2 ; Amérique du Nord : f(x) = −10x+30). S'y ajoutent :
   reconnaître le graphique d'une droite donnée (Centres étrangers),
   et déterminer une équation à partir de deux points (sujet zéro : A(2;5), B(0;−1)).

   Niveau 1 — les bases : coefficient directeur entier, lecture directe.
   Niveau 2 — l'épreuve : coefficient fractionnaire, reconnaissance de graphique,
              appartenance d'un point, droite par deux points.
   Niveau 3 — bien plus difficile : parallèles et sécantes, point d'intersection,
              droite parallèle passant par un point, droite verticale.

   Lisibilité (règle du projet) : toute droite tracée passe par au moins deux nœuds
   du quadrillage visibles, et son ordonnée à l'origine est entière. */
(function () {
  'use strict';
  const O = Automatismes.outils;
  const { alea, aleaParmi, aleaNonNul, melanger, fracL, m, qcm, famille, poly, mono } = O;
  const opt = (aff, cle) => ({ affichage: m(aff), cle: cle === undefined ? aff : cle });
  const optFig = (aff, cle) => ({ affichage: aff, cle: cle });

  // ---------- coefficients directeurs, sous forme de fraction exacte ----------
  // {p, q} représente p/q réduit ; q = 1 pour un entier
  function coef(p, q) {
    q = q === undefined ? 1 : q;
    if (q < 0) { p = -p; q = -q; }
    const g = O.pgcd(p, q) || 1;
    return { p: p / g, q: q / g };
  }
  const cVal = c => c.p / c.q;
  const cL = c => fracL(c.p, c.q);                       // écriture LaTeX du coefficient
  // « y = ax + b » avec toutes les conventions d'écriture
  function equationL(c, b) {
    const a = cVal(c);
    let t;
    if (a === 0) t = '';
    else if (c.q === 1) t = mono(c.p, 'x');              // coefficient entier : 1 et −1 omis
    else t = (c.p < 0 ? '-' : '') + fracL(Math.abs(c.p), c.q) + 'x';
    if (!t) return 'y = ' + b;
    return 'y = ' + (b === 0 ? t : (b > 0 ? t + ' + ' + b : t + ' - ' + (-b)));
  }
  const cleEq = (c, b) => c.p + '/' + c.q + '|' + b;

  // jeux de coefficients par niveau
  const COEFS = {
    1: [coef(1), coef(-1), coef(2), coef(-2), coef(3), coef(-3)],
    2: [coef(1), coef(-1), coef(2), coef(-2), coef(3), coef(-3), coef(1, 2), coef(-1, 2), coef(1, 3), coef(-1, 3), coef(2, 3), coef(-2, 3), coef(3, 2), coef(-3, 2)],
    3: [coef(1, 2), coef(-1, 2), coef(1, 3), coef(-1, 3), coef(2, 3), coef(-2, 3), coef(3, 2), coef(-3, 2), coef(1, 4), coef(-1, 4), coef(3, 4), coef(-3, 4), coef(5, 2), coef(-5, 2), coef(4, 3), coef(-4, 3)]
  };

  // fenêtre adaptée : la droite doit traverser le repère en passant par des nœuds
  function fenetrePour(c, b) {
    const a = cVal(c);
    for (const R of [4, 5, 6]) {
      const xmin = -R, xmax = R, ymin = -R, ymax = R;
      const noeuds = O.graph.noeudsDroite(a, b, xmin, xmax, ymin, ymax);
      const seg = O.graph.segmentDroite(a, b, xmin, xmax, ymin, ymax);
      // au moins trois nœuds lisibles et un segment d'amplitude suffisante
      if (noeuds.length >= 3 && seg && Math.hypot(seg[1][0] - seg[0][0], seg[1][1] - seg[0][1]) >= R) {
        return { xmin, xmax, ymin, ymax, unite: R <= 4 ? 26 : R === 5 ? 22 : 19 };
      }
    }
    return null;
  }

  // tire un couple (coefficient, ordonnée à l'origine) lisible dans un repère
  function droiteLisible(niveau) {
    for (let i = 0; i < 60; i++) {
      const c = aleaParmi(COEFS[niveau] || COEFS[2]);
      const b = alea(-3, 3);
      const f = fenetrePour(c, b);
      if (f) return { c, b, f };
    }
    return null;
  }

  // =====================================================================
  // Famille A : lire l'équation réduite d'une droite tracée
  // =====================================================================
  function equationLue(niveau) {
    const d = droiteLisible(niveau);
    if (!d) return null;
    const { c, b, f } = d;
    const figure = O.graph.repere({
      xmin: f.xmin, xmax: f.xmax, ymin: f.ymin, ymax: f.ymax, unite: f.unite,
      oij: niveau === 1, droites: [{ a: cVal(c), b: b, label: '(d)' }]
    });
    const bonne = opt(equationL(c, b), cleEq(c, b));
    // erreurs types des sujets : signe du coefficient, coefficient et ordonnée échangés,
    // rapport lu à l'envers (Δx/Δy au lieu de Δy/Δx)
    const inv = coef(c.q, c.p);
    const cands = [
      [coef(-c.p, c.q), b], [c, -b], [inv, b], [coef(-c.q, c.p), b],
      [coef(b, 1), cVal(c) === Math.round(cVal(c)) ? c.p : b], [coef(c.p * 2, c.q), b]
    ].map(([cc, bb]) => opt(equationL(cc, bb), cleEq(cc, bb)));
    const noeuds = O.graph.noeudsDroite(cVal(c), b, f.xmin, f.xmax, f.ymin, f.ymax);
    const A = noeuds[0], B = noeuds[noeuds.length - 1];
    return qcm(`Dans le repère ci-contre, la droite ${m('(d)')} a pour équation :`, bonne, cands, {
      figure: figure,
      explication: `La droite coupe l'axe des ordonnées en ${m(String(b))}, donc l'ordonnée à l'origine vaut ${m(String(b))}. Entre les points ${m('(' + A[0] + '\\,;\\,' + A[1] + ')')} et ${m('(' + B[0] + '\\,;\\,' + B[1] + ')')}, on avance de ${m(String(B[0] - A[0]))} en abscisse et de ${m(String(B[1] - A[1]))} en ordonnée : le coefficient directeur vaut ${m('\\dfrac{' + (B[1] - A[1]) + '}{' + (B[0] - A[0]) + '} = ' + cL(c))}.`
    });
  }

  // =====================================================================
  // Famille B : lire le coefficient directeur ou l'ordonnée à l'origine
  // =====================================================================
  function lectureCoefficient(niveau) {
    const d = droiteLisible(niveau);
    if (!d) return null;
    const { c, b, f } = d;
    const figure = O.graph.repere({
      xmin: f.xmin, xmax: f.xmax, ymin: f.ymin, ymax: f.ymax, unite: f.unite,
      droites: [{ a: cVal(c), b: b, label: '(d)' }]
    });
    const surCoef = Math.random() < 0.65;
    if (surCoef) {
      // Les clés sont laissées à l'écriture affichée : deux fractions non réduites
      // différentes (2/-1 et -2/1, par exemple) donnent la même écriture une fois
      // réduites, et deux options identiques se retrouveraient dans la question.
      const bonne = opt(cL(c));
      const cands = [
        opt(cL(coef(-c.p, c.q))),
        opt(cL(coef(c.q, c.p))),
        opt(String(b)),
        opt(cL(coef(c.p * 2, c.q))),
        opt(cL(coef(-c.q, c.p)))
      ];
      const noeuds = O.graph.noeudsDroite(cVal(c), b, f.xmin, f.xmax, f.ymin, f.ymax);
      const A = noeuds[0], B = noeuds[noeuds.length - 1];
      return qcm(`Le coefficient directeur de la droite ${m('(d)')} tracée ci-contre est :`, bonne, cands, {
        figure: figure,
        explication: `Entre ${m('(' + A[0] + '\\,;\\,' + A[1] + ')')} et ${m('(' + B[0] + '\\,;\\,' + B[1] + ')')}, l'ordonnée varie de ${m(String(B[1] - A[1]))} quand l'abscisse varie de ${m(String(B[0] - A[0]))} : le coefficient directeur est ${m('\\dfrac{' + (B[1] - A[1]) + '}{' + (B[0] - A[0]) + '} = ' + cL(c))}. C'est la variation de ${m('y')} divisée par celle de ${m('x')}, dans cet ordre.`
      });
    }
    const bonne = opt(String(b));
    const cands = [opt(String(-b)), opt(cL(c)), opt(String(b + 1)), opt(String(b - 1))];
    return qcm(`L’ordonnée à l’origine de la droite ${m('(d)')} tracée ci-contre est :`, bonne, cands, {
      figure: figure,
      explication: `L'ordonnée à l'origine est l'ordonnée du point d'intersection de la droite avec l'axe des ordonnées, c'est-à-dire la valeur de ${m('y')} quand ${m('x = 0')} : ici ${m(String(b))}.`
    });
  }

  // =====================================================================
  // Famille C : équation d'une droite passant par deux points (sans figure)
  // =====================================================================
  function droiteDeuxPoints(niveau) {
    const c = aleaParmi(COEFS[niveau] || COEFS[2]);
    const b = alea(-6, 6);
    // abscisses multiples du dénominateur : les deux points ont des coordonnées entières
    const kmax = Math.max(1, Math.floor(6 / c.q));
    const mult = [];
    for (let k = -kmax; k <= kmax; k++) mult.push(k * c.q);
    const x1 = niveau === 1 ? 0 : aleaParmi(mult);
    const x2 = aleaParmi(mult.filter(x => x !== x1));
    if (x2 === undefined) return null;
    const y1 = cVal(c) * x1 + b, y2 = cVal(c) * x2 + b;
    if (!Number.isInteger(y1) || !Number.isInteger(y2)) return null;
    if (Math.abs(y1) > 12 || Math.abs(y2) > 12) return null;
    const enonce = `Le plan est muni d’un repère. On note ${m('(d)')} la droite passant par les points ${m('A(' + x1 + '\\,;\\,' + y1 + ')')} et ${m('B(' + x2 + '\\,;\\,' + y2 + ')')}.<br>L’équation réduite de ${m('(d)')} est :`;
    const bonne = opt(equationL(c, b), cleEq(c, b));
    const inv = coef(x2 - x1, y2 - y1);
    const cands = [
      opt(equationL(coef(-c.p, c.q), b), cleEq(coef(-c.p, c.q), b)),
      opt(equationL(inv, b), cleEq(inv, b)),
      opt(equationL(c, y1), cleEq(c, y1)),
      opt(equationL(c, -b), cleEq(c, -b)),
      opt(equationL(coef(y2 - y1, 1), b), cleEq(coef(y2 - y1, 1), b))
    ];
    // n'écrire la fraction intermédiaire que si son dénominateur n'est pas ±1
    const dx = x2 - x1, dy = y2 - y1;
    const etape = Math.abs(dx) === 1 ? '' : '\\dfrac{' + dy + '}{' + dx + '} = ';
    const trouverB = x1 === 0
      ? `Le point ${m('A')} est sur l'axe des ordonnées, donc ${m('b = ' + y1)}.`
      : `On reporte ensuite les coordonnées de ${m('A')} : ${m(y1 + ' = ' + cL(c) + ' \\times ' + (x1 < 0 ? '(' + x1 + ')' : x1) + ' + b')}, d'où ${m('b = ' + b)}.`;
    return qcm(enonce, bonne, cands, {
      explication: `Coefficient directeur : ${m('a = \\dfrac{y_B - y_A}{x_B - x_A} = ' + etape + cL(c))}. ${trouverB}`
    });
  }

  // =====================================================================
  // Famille D : reconnaître le graphique d'une droite donnée
  // =====================================================================
  function reconnaitreGraphique(niveau) {
    const d = droiteLisible(niveau === 1 ? 1 : niveau);
    if (!d) return null;
    const { c, b, f } = d;
    const petit = { xmin: -4, xmax: 4, ymin: -4, ymax: 4, unite: 15, petit: true, pasGrad: 2 };
    void f;
    // trois droites concurrentes, visuellement distinctes de la bonne
    const variantes = [
      coef(-c.p, c.q), coef(c.q, c.p), coef(-c.q, c.p), coef(c.p * 2, c.q)
    ];
    const autres = [];
    for (const cc of variantes) {
      if (autres.length === 3) break;
      if (cVal(cc) === cVal(c)) continue;
      if (autres.some(x => cVal(x.c) === cVal(cc) && x.b === b)) continue;
      if (!O.graph.segmentDroite(cVal(cc), b, -4, 4, -4, 4)) continue;
      autres.push({ c: cc, b: b });
    }
    // à défaut, on fait varier l'ordonnée à l'origine
    for (const db of [1, -1, 2]) {
      if (autres.length === 3) break;
      if (!O.graph.segmentDroite(cVal(c), b + db, -4, 4, -4, 4)) continue;
      if (autres.some(x => cVal(x.c) === cVal(c) && x.b === b + db)) continue;
      autres.push({ c: c, b: b + db });
    }
    if (autres.length < 3) return null;
    if (!O.graph.segmentDroite(cVal(c), b, -4, 4, -4, 4)) return null;
    const fig = (cc, bb) => O.graph.repere(Object.assign({}, petit, { droites: [{ a: cVal(cc), b: bb }] }));
    const bonne = optFig(fig(c, b), 'ok');
    const cands = autres.map((x, i) => optFig(fig(x.c, x.b), 'f' + i));
    return qcm(`Parmi les quatre repères ci-dessous, lequel représente la droite d’équation ${m(equationL(c, b))} ?`, bonne, cands, {
      explication: `La droite cherchée coupe l'axe des ordonnées en ${m(String(b))} et a pour coefficient directeur ${m(cL(c))} : quand on avance de ${m(String(c.q))} vers la droite, on monte de ${m(String(c.p))}${c.p < 0 ? ' (donc on descend)' : ''}.`
    });
  }

  // =====================================================================
  // Famille E : appartenance d'un point à une droite
  // =====================================================================
  function appartenance(niveau) {
    const c = aleaParmi(COEFS[niveau] || COEFS[2]);
    const b = alea(-6, 6);
    // abscisse non nulle : un point sur l'axe des ordonnées aurait pour ordonnée
    // l'ordonnée à l'origine, lisible directement dans l'équation
    const surLaDroite = [];
    for (let x = -6; x <= 6; x++) {
      if (x === 0) continue;
      const y = cVal(c) * x + b;
      if (Number.isInteger(y) && Math.abs(y) <= 12) surLaDroite.push([x, y]);
    }
    if (surLaDroite.length < 2) return null;
    const P = aleaParmi(surLaDroite);
    const pt = ([x, y]) => 'A(' + x + '\\,;\\,' + y + ')';
    const nom = ['A', 'B', 'C', 'D'];
    const faux = [];
    for (let i = 0; i < 40 && faux.length < 4; i++) {
      const x = alea(-6, 6), y = alea(-8, 8);
      if (Math.abs(cVal(c) * x + b - y) < 1e-9) continue;      // serait sur la droite
      if (faux.some(q => q[0] === x && q[1] === y)) continue;
      faux.push([x, y]);
    }
    if (faux.length < 3) return null;
    void pt;
    const fmt = ([x, y], i) => nom[i] + '(' + x + '\\,;\\,' + y + ')';
    const tous = [P].concat(faux.slice(0, 3));
    const bonne = opt(fmt(tous[0], 0), 'ok');
    const cands = tous.slice(1).map((p, i) => opt(fmt(p, i + 1), 'f' + i));
    return qcm(`Un seul des quatre points suivants appartient à la droite d’équation ${m(equationL(c, b))}. Lequel ?`, bonne, cands, {
      explication: `On remplace ${m('x')} par l'abscisse du point et on compare à son ordonnée. Pour ${m(fmt(tous[0], 0))} : ${m(cL(c) + ' \\times ' + (P[0] < 0 ? '(' + P[0] + ')' : P[0]) + (b === 0 ? '' : (b > 0 ? ' + ' + b : ' - ' + (-b))) + ' = ' + P[1])}, l'égalité est vérifiée.`
    });
  }

  // N3 : reconnaître l'équation d'une droite tracée, présentée sous des formes variées
  //      (fiche d'automatismes 3, Q4 : équation cartésienne, forme réduite, et une écriture
  //       développée qui se simplifie en une équation du premier degré)
  function formesVariees() {
    // coefficient directeur pair : la forme « développée » v^2 - (v+j)^2 + c en dépend
    const m0 = aleaParmi([-3, -2, -1, 1, 2, 3]) * 2;
    const b0 = alea(-3, 3);
    const c0 = coef(m0);
    const f = fenetrePour(c0, b0);
    if (!f) return null;
    const figure = O.graph.repere({
      xmin: f.xmin, xmax: f.xmax, ymin: f.ymin, ymax: f.ymax, unite: f.unite,
      droites: [{ a: m0, b: b0, label: '(D)' }]
    });
    // forme cartésienne de y = m0·x + b0  :  −m0·x + y − b0 = 0
    const cartesienne = termes => poly(termes) + ' = 0';
    const formeCart = cartesienne([[-m0, 'x'], [1, 'y'], [-b0, '']]);
    // forme développée : x^2 − (x + j)^2 + c  =  −2j·x + (c − j²)
    const j = -m0 / 2;
    const cDev = b0 + j * j;
    const formeDev = `y = x^2 - (x ${j < 0 ? '- ' + (-j) : '+ ' + j})^2 ${cDev < 0 ? '- ' + (-cDev) : '+ ' + cDev}`;
    const cartVraie = Math.random() < 0.5;
    const bonne = cartVraie ? opt(formeCart, 'cart') : opt(formeDev, 'dev');
    // les autres formes décrivent d'autres droites
    const cands = [
      opt(cartesienne([[m0, 'x'], [1, 'y'], [-b0, '']]), 'cart2'),
      opt(equationL(coef(-c0.p, c0.q), b0), 'red1'),
      opt(equationL(coef(c0.q, c0.p), b0), 'red2'),
      cartVraie ? opt(`y = x^2 - (x ${j < 0 ? '- ' + (-j) : '+ ' + j})^2 ${cDev + 1 < 0 ? '- ' + (-(cDev + 1)) : '+ ' + (cDev + 1)}`, 'dev2')
        : opt(formeCart.replace('=', '='), 'cartf') && opt(cartesienne([[-m0, 'x'], [1, 'y'], [-b0 - 1, '']]), 'cartf')
    ];
    return qcm(`On a représenté ci-contre une droite ${m('(D)')}.<br>Parmi les équations suivantes, laquelle représente ${m('(D)')} ?`,
      bonne, cands, {
      figure: figure,
      explication: `La droite tracée a pour équation réduite ${m(equationL(c0, b0))}. ${cartVraie
        ? `En passant tout du même côté : ${m(formeCart)}.`
        : `L’écriture ${m(formeDev)} se développe : ${m('x^2 - (x^2 ' + (j >= 0 ? '+ ' + (2 * j) : '- ' + (-2 * j)) + 'x + ' + (j * j) + ') ' + (cDev < 0 ? '- ' + (-cDev) : '+ ' + cDev) + ' = ' + equationL(c0, b0).replace('y = ', ''))}, c’est bien une équation du premier degré.`}`,
      optionsLarges: true
    });
  }

  // =====================================================================
  // Famille F : positions relatives (niveau 3)
  // =====================================================================
  function positionsRelatives() {
    const type = aleaParmi(['paralleles', 'intersection', 'parallelePoint', 'verticale']);
    if (type === 'paralleles') {
      const c = aleaParmi(COEFS[2]);
      const b1 = alea(-5, 5);
      let b2 = alea(-5, 5);
      if (b1 === b2) return null;
      const memeCoef = Math.random() < 0.55;
      const c2 = memeCoef ? c : aleaParmi(COEFS[2].filter(x => cVal(x) !== cVal(c)));
      const e1 = equationL(c, b1), e2 = equationL(c2, b2);
      const bonne = memeCoef ? 'strictement parallèles' : 'sécantes';
      const options = [
        { t: 'strictement parallèles', k: 'par' },
        { t: 'sécantes', k: 'sec' },
        { t: 'confondues', k: 'conf' },
        { t: 'perpendiculaires', k: 'perp' }
      ];
      const b = options.find(o => o.t === bonne);
      return qcm(`Dans un repère, les droites d’équations ${m(e1)} et ${m(e2)} sont :`,
        { affichage: b.t, cle: b.k }, options.filter(o => o !== b).map(o => ({ affichage: o.t, cle: o.k })), {
        explication: memeCoef
          ? `Les deux droites ont le même coefficient directeur ${m(cL(c))} mais des ordonnées à l'origine différentes (${m(String(b1))} et ${m(String(b2))}) : elles sont strictement parallèles.`
          : `Les coefficients directeurs ${m(cL(c))} et ${m(cL(c2))} sont différents : les droites se coupent en un point, elles sont sécantes.`
      });
    }
    if (type === 'intersection') {
      // deux droites à coefficients entiers, point d'intersection entier
      const a1 = aleaNonNul(-4, 4);
      let a2 = aleaNonNul(-4, 4);
      if (a1 === a2) return null;
      const x0 = alea(-4, 4), y0 = alea(-5, 5);
      const b1 = y0 - a1 * x0, b2 = y0 - a2 * x0;
      const e1 = 'y = ' + poly([[a1, 'x'], [b1, '']]), e2 = 'y = ' + poly([[a2, 'x'], [b2, '']]);
      const bonne = opt('(' + x0 + '\\,;\\,' + y0 + ')', x0 + ';' + y0);
      const cands = [
        opt('(' + y0 + '\\,;\\,' + x0 + ')', y0 + ';' + x0),
        opt('(' + (-x0) + '\\,;\\,' + y0 + ')', -x0 + ';' + y0),
        opt('(' + x0 + '\\,;\\,' + (-y0) + ')', x0 + ';' + (-y0)),
        opt('(' + (b1 - b2) + '\\,;\\,' + (a1 - a2) + ')', (b1 - b2) + ';' + (a1 - a2))
      ];
      return qcm(`Dans un repère, les droites d’équations ${m(e1)} et ${m(e2)} se coupent au point de coordonnées :`, bonne, cands, {
        explication: `On résout ${m(poly([[a1, 'x'], [b1, '']]) + ' = ' + poly([[a2, 'x'], [b2, '']]))}, soit ${m(mono(a1 - a2, 'x') + ' = ' + (b2 - b1))} et ${m('x = ' + x0)}. On reporte : ${m('y = ' + poly([[a1, 'x'], [b1, '']]).replace(/x/g, '(' + x0 + ')') + ' = ' + y0)}.`
      });
    }
    if (type === 'parallelePoint') {
      const c = aleaParmi(COEFS[2]);
      const x0 = aleaNonNul(-5, 5);
      const y0 = alea(-5, 5);
      if (!Number.isInteger(cVal(c) * x0)) return null;
      const b0 = alea(-5, 5);
      const b = y0 - cVal(c) * x0;
      if (!Number.isInteger(b) || b === b0) return null;
      const bonne = opt(equationL(c, b), cleEq(c, b));
      const cands = [
        opt(equationL(c, b0), cleEq(c, b0)),
        opt(equationL(coef(-c.p, c.q), b), cleEq(coef(-c.p, c.q), b)),
        opt(equationL(c, y0), cleEq(c, y0)),
        opt(equationL(coef(c.q, c.p), b), cleEq(coef(c.q, c.p), b))
      ];
      return qcm(`La droite parallèle à la droite d’équation ${m(equationL(c, b0))} et passant par le point ${m('A(' + x0 + '\\,;\\,' + y0 + ')')} a pour équation :`, bonne, cands, {
        explication: `Deux droites parallèles ont le même coefficient directeur : ${m('a = ' + cL(c))}. On détermine ${m('b')} avec les coordonnées de ${m('A')} : ${m(y0 + ' = ' + cL(c) + ' \\times ' + (x0 < 0 ? '(' + x0 + ')' : x0) + ' + b')}, donc ${m('b = ' + b)}.`
      });
    }
    // droite verticale : ce n'est pas la représentation d'une fonction affine
    const k = aleaNonNul(-4, 4);
    const figure = O.graph.repere({ xmin: -5, xmax: 5, ymin: -5, ymax: 5, unite: 22, verticales: [{ x: k }] });
    const bonne = opt('x = ' + k, 'x=' + k);
    const cands = [
      opt('y = ' + k, 'y=' + k),
      opt('y = ' + mono(k, 'x'), 'ykx'),
      opt('x = ' + (-k), 'x=' + (-k)),
      opt('y = x + ' + k, 'yxk')
    ];
    return qcm(`La droite tracée ci-contre a pour équation :`, bonne, cands, {
      figure: figure,
      explication: `Tous les points de cette droite ont la même abscisse ${m(String(k))}, quelle que soit leur ordonnée : son équation est ${m('x = ' + k)}. Une droite verticale n'est pas la représentation graphique d'une fonction affine, son équation ne peut pas s'écrire ${m('y = ax + b')}.`
    });
  }

  // =====================================================================
  // Famille F (niveau 3) : nature d'un triangle donné par trois points
  // (fiche maison 1, Q7). Le repère est orthonormé : les longueurs se
  // calculent, et la réciproque de Pythagore tranche.
  // =====================================================================
  const optNature = t => ({ affichage: t, cle: t });

  function triangleRectangle() {
    const noms = ['A', 'B', 'C'];
    // Le cas « pas rectangle » reste possible, mais la construction d'un triangle
    // rectangle est plus souvent rejetée par les contrôles de lisibilité : ce seuil
    // est réglé pour que les quatre réponses tombent à peu près à égalité (25 %),
    // sans quoi répondre toujours « il n'est pas rectangle » paierait.
    const rectangle = Math.random() < 0.84;
    let P;
    if (rectangle) {
      // sommet de l'angle droit + deux vecteurs orthogonaux à coordonnées entières
      const S = [alea(-4, 4), alea(-4, 4)];
      const a = aleaNonNul(-3, 3), b = aleaNonNul(-3, 3);
      const k = aleaParmi([1, 1, 2, 2, 3]);           // k ≠ 1 évite le triangle isocèle systématique
      P = [S, [S[0] + a, S[1] + b], [S[0] - k * b, S[1] + k * a]];
    } else {
      P = [[alea(-4, 4), alea(-4, 4)], [alea(-4, 4), alea(-4, 4)], [alea(-4, 4), alea(-4, 4)]];
    }
    // contrôles de validité : points distincts, non alignés, lisibles
    for (const p of P) if (Math.abs(p[0]) > 5 || Math.abs(p[1]) > 5) return null;
    const d2 = (u, v) => (u[0] - v[0]) * (u[0] - v[0]) + (u[1] - v[1]) * (u[1] - v[1]);
    const cotes = [d2(P[1], P[2]), d2(P[0], P[2]), d2(P[0], P[1])];   // opposé à A, à B, à C
    if (cotes.some(c => c === 0)) return null;
    const aire2 = Math.abs((P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[2][0] - P[0][0]) * (P[1][1] - P[0][1]));
    if (aire2 === 0) return null;                     // points alignés
    // sommet où l'angle est droit : celui dont le côté opposé est l'hypoténuse
    let droit = -1;
    for (let i = 0; i < 3; i++) {
      const autres = [0, 1, 2].filter(j => j !== i);
      if (cotes[autres[0]] + cotes[autres[1]] === cotes[i]) droit = i;
    }
    if (rectangle !== (droit !== -1)) return null;

    // on brasse les étiquettes pour que l'angle droit ne soit pas toujours en A
    const perm = melanger([0, 1, 2]);
    const Q = perm.map(i => P[i]);
    const dQ2 = [d2(Q[1], Q[2]), d2(Q[0], Q[2]), d2(Q[0], Q[1])];
    let droitQ = -1;
    for (let i = 0; i < 3; i++) {
      const autres = [0, 1, 2].filter(j => j !== i);
      if (dQ2[autres[0]] + dQ2[autres[1]] === dQ2[i]) droitQ = i;
    }
    const coord = i => `${noms[i]}(${Q[i][0]}\\,;\\,${Q[i][1]})`;
    const bonne = optNature(droitQ === -1 ? 'Il n’est pas rectangle.' : `Il est rectangle en ${noms[droitQ]}.`);
    const cands = melanger([0, 1, 2].filter(i => i !== droitQ).map(i => optNature(`Il est rectangle en ${noms[i]}.`))
      .concat(droitQ === -1 ? [] : [optNature('Il n’est pas rectangle.')]));

    const carre = i => `${noms[[1, 0, 0][i]]}${noms[[2, 2, 1][i]]}^2 = ${dQ2[i]}`;
    const detail = droitQ === -1
      ? `Aucune des trois égalités de Pythagore n’est vérifiée : ${m(dQ2[0] + ' + ' + dQ2[1])} ${m('\\neq')} ${m(String(dQ2[2]))}, `
        + `${m(dQ2[0] + ' + ' + dQ2[2])} ${m('\\neq')} ${m(String(dQ2[1]))} et ${m(dQ2[1] + ' + ' + dQ2[2])} ${m('\\neq')} ${m(String(dQ2[0]))}. `
        + `Le triangle n’est donc rectangle en aucun de ses sommets.`
      : (function () {
        const autres = [0, 1, 2].filter(j => j !== droitQ);
        return `${m(String(dQ2[autres[0]]) + ' + ' + String(dQ2[autres[1]]) + ' = ' + String(dQ2[droitQ]))} : `
          + `d’après la réciproque du théorème de Pythagore, le triangle est rectangle en ${m(noms[droitQ])}, `
          + `le côté le plus long étant celui qui lui est opposé.`;
      })();

    return qcm(`Dans un repère orthonormé, on considère les points ${m(coord(0))}, ${m(coord(1))} et ${m(coord(2))}. `
      + `Que peut-on dire du triangle ${m('ABC')} ?`,
      bonne, cands, {
        optionsLarges: true,
        explication: `On calcule les carrés des longueurs, ce qui évite toute racine : `
          + `${m(carre(0))}, ${m(carre(1))} et ${m(carre(2))}. ${detail}`
      });
  }

  // =====================================================================
  Automatismes.enregistrerBanque('droites', {
    titre: 'Droites et repères',
    familles: {
      'equation-lue': famille({
        nom: 'lire l’équation d’une droite', niveaux: [1, 2, 3], base: equationLue, variantes3: [formesVariees], partBase3: 0.55,
        ordre: { 1: 1, 2: 1 }, quota: { 1: { min: 1, priorite: 3 }, 2: { min: 1, priorite: 3 }, 3: { min: 1 } }
      }),
      'lecture-coefficient': famille({
        nom: 'lire le coefficient directeur', niveaux: [1, 2, 3], base: lectureCoefficient, ordre: { 1: 2, 2: 2 }
      }),
      'droite-deux-points': famille({
        nom: 'droite passant par deux points', niveaux: [1, 2, 3], base: droiteDeuxPoints, ordre: { 1: 4, 2: 4 }
      }),
      'reconnaitre-graphique': famille({
        nom: 'reconnaître le graphique', niveaux: [1, 2, 3], base: reconnaitreGraphique,
        ordre: { 1: 3, 2: 3 }, quota: { 1: { max: 1 }, 2: { max: 1 }, 3: { max: 1 } }
      }),
      'appartenance': famille({
        nom: 'point appartenant à une droite', niveaux: [2, 3], base: appartenance, ordre: { 2: 5 }
      }),
      'positions-relatives': famille({
        nom: 'positions relatives', niveaux: [3], base: () => null, variantes3: [positionsRelatives]
      }),
      'triangle-rectangle': famille({
        nom: 'nature d’un triangle', niveaux: [3], base: () => null, variantes3: [triangleRectangle],
        quota: { 3: { max: 1 } }
      })
    }
  });
})();
