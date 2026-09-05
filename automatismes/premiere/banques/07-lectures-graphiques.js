/* Banque 07 — Lectures graphiques
   Familles observées dans les sujets 2026 :
   nombre de solutions de f(x) = k lu sur une courbe (Asie), résolution graphique
   d'une inéquation (Amérique du Nord : f(x) ⩾ 5), comparaison de deux courbes
   (Asie : f(x) < g(x) avec une droite et une parabole), appartenance d'un point à
   une courbe (Métropole : f(x) = 0,5(x−3)²+10).
   Complété par les fiches d'automatismes maison : point sur une parabole,
   signe de x × f(x), intersection d'une parabole et d'une droite.

   Niveau 1 — les bases : lire une image, lire un antécédent, nombre de solutions.
   Niveau 2 — l'épreuve : inéquation résolue graphiquement, comparaison de deux courbes,
              appartenance d'un point donnée par une formule.
   Niveau 3 — bien plus difficile : signe de x × f(x), intersection parabole/droite,
              inéquation dont l'ensemble est une réunion d'intervalles, courbe du 3ᵉ degré.

   Lisibilité : tout point lu par l'élève (sommet, intersection, solution) est un nœud
   du quadrillage, et la portion utile de la courbe tient dans la fenêtre. */
(function () {
  'use strict';
  const O = Automatismes.outils;
  const { alea, aleaParmi, aleaNonNul, melanger, decL, m, qcm, famille, poly, mono } = O;
  const opt = (aff, cle) => ({ affichage: m(aff), cle: cle === undefined ? aff : cle });
  const optTxt = (aff, cle) => ({ affichage: aff, cle: cle === undefined ? aff : cle });

  const MOINS_INF = '-\\infty', PLUS_INF = '+\\infty';
  function inter(a, b, ouvA, ouvB) {
    return (ouvA ? '\\left]' : '\\left[') + a + '\\,;\\,' + b + (ouvB ? '\\right[' : '\\right]');
  }
  const ensemble = l => '\\left\\{' + l.join('\\,;\\,') + '\\right\\}';
  const VIDE = '\\varnothing';

  // ---------------------------------------------------------------------
  // Paraboles lisibles : f(x) = a(x − α)² + β, sommet sur un nœud du quadrillage
  // ---------------------------------------------------------------------
  // pour les questions à figure, on s'en tient à des courbures douces : une parabole de
  // coefficient ±2 monterait à 50 sur [−5;5] et écraserait toute la figure
  const COEFS_A = [1, -1, 0.5, -0.5];
  // demi-largeur de la fenêtre telle que la courbe monte d'environ 9 unités au bord
  const demiLargeur = a => Math.max(2, Math.min(5, Math.floor(Math.sqrt(9 / Math.abs(a)))));
  function parabole(a, al, be) {
    const f = x => a * (x - al) * (x - al) + be;
    f.a = a; f.al = al; f.be = be;
    // écriture canonique, avec les conventions d'écriture du site
    f.tex = 'f(x) = ' + (a === 1 ? '' : a === -1 ? '-' : decL(a)) + '(x' + (al > 0 ? ' - ' + al : al < 0 ? ' + ' + (-al) : '') + ')^2' + (be > 0 ? ' + ' + be : be < 0 ? ' - ' + (-be) : '');
    return f;
  }
  // fenêtre dans laquelle la partie utile de la parabole est visible
  function fenetreParabole(f, xmin, xmax) {
    let bas = Infinity, haut = -Infinity;
    for (let x = xmin; x <= xmax; x += 0.5) { const y = f(x); bas = Math.min(bas, y); haut = Math.max(haut, y); }
    // la fenêtre contient toujours l'origine : sans axe des abscisses visible, ni l'axe
    // ni les graduations ne seraient tracés et la figure deviendrait illisible
    const ymin = Math.min(-1, Math.max(-12, Math.floor(bas) - 1));
    const ymax = Math.max(1, Math.min(12, Math.ceil(haut) + 1));
    if (ymax - ymin < 4 || ymax - ymin > 18) return null;
    const largeur = xmax - xmin, hauteur = ymax - ymin;
    const unite = Math.min(30, Math.max(13, Math.floor(300 / Math.max(largeur, hauteur))));
    return { xmin, xmax, ymin, ymax, unite };
  }
  const dessin = (fen, courbes, extra) => O.graph.repere(Object.assign({
    xmin: fen.xmin, xmax: fen.xmax, ymin: fen.ymin, ymax: fen.ymax, unite: fen.unite,
    courbes: courbes
  }, extra || {}));

  // =====================================================================
  // Famille A : nombre de solutions de f(x) = k
  // =====================================================================
  function nombreSolutions(niveau) {
    for (let essai = 0; essai < 50; essai++) {
      const a = aleaParmi(niveau === 1 ? [1, -1] : COEFS_A);
      const al = alea(-2, 2), be = alea(-4, 4);
      const dm = demiLargeur(a);
      const xmin = al - dm, xmax = al + dm;
      // solutions α ± d, avec d entier pour rester sur le quadrillage
      const d = alea(1, dm);
      const k = a * d * d + be;
      if (Math.abs(k) > 9) continue;
      const sols = [al - d, al + d].filter(x => x >= xmin && x <= xmax);
      const cas = aleaParmi(['deux', 'deux', 'une', 'zero', 'une-ou-deux']);
      let kk = k, attendu = sols.length;
      if (cas === 'une') { kk = be; attendu = 1; }
      if (cas === 'zero') { kk = be - a * (alea(1, 3)); attendu = 0; }   // du mauvais côté du sommet
      if (Math.abs(kk) > 9) continue;
      const f = parabole(a, al, be);
      const fen = fenetreParabole(f, xmin, xmax);
      if (!fen) continue;
      if (kk < fen.ymin || kk > fen.ymax) continue;
      // recompte pour être sûr : solutions réelles dans la fenêtre
      const disc = (kk - be) / a;
      let n = 0;
      if (Math.abs(disc) < 1e-9) n = (al >= xmin && al <= xmax) ? 1 : 0;
      else if (disc > 0) { const r = Math.sqrt(disc); n = [al - r, al + r].filter(x => x >= xmin && x <= xmax).length; }
      if (n !== attendu) continue;
      const figure = dessin(fen, [{ points: O.graph.echantillonner(f, xmin, xmax), label: "C_f" }]);
      const mot = ['aucune solution', 'une seule solution', 'deux solutions', 'trois solutions'];
      const bonne = optTxt(mot[n], 'n' + n);
      const cands = [0, 1, 2, 3].filter(x => x !== n).map(x => optTxt(mot[x], 'n' + x));
      return qcm(`On considère la fonction ${m('f')} définie sur ${m(inter(String(xmin), String(xmax), false, false))} et représentée ci-contre.<br>Sur cet intervalle, l’équation ${m('f(x) = ' + decL(kk))} admet :`,
        bonne, cands, {
        figure: figure,
        explication: `On trace la droite horizontale d’équation ${m('y = ' + decL(kk))} et on compte ses points d’intersection avec la courbe : il y en a ${n === 0 ? 'aucun' : n === 1 ? 'un seul' : n}. ${n === 0 ? `La droite passe entièrement ${a > 0 ? 'au-dessous' : 'au-dessus'} de la courbe.` : n === 1 ? 'La droite passe exactement par le sommet de la parabole.' : `Les solutions se lisent en ${m(String(al - Math.sqrt(disc)))} et ${m(String(al + Math.sqrt(disc)))}.`}`
      });
    }
    return null;
  }

  // =====================================================================
  // Famille B : résoudre graphiquement une inéquation
  // =====================================================================
  function inequationGraphique(niveau) {
    for (let essai = 0; essai < 50; essai++) {
      // a < 0 : l'ensemble est un intervalle ; a > 0 : une réunion (réservée au niveau 3)
      const union = niveau === 3 && Math.random() < 0.5;
      const a = union ? aleaParmi([1, 0.5]) : aleaParmi([-1, -0.5]);
      const al = alea(-2, 2), be = alea(-3, 5);
      const dm = demiLargeur(a);
      const xmin = al - dm, xmax = al + dm;
      const d = alea(1, dm - 1);
      const k = a * d * d + be;
      if (Math.abs(k) > 9) continue;
      const f = parabole(a, al, be);
      const fen = fenetreParabole(f, xmin, xmax);
      if (!fen || k < fen.ymin || k > fen.ymax) continue;
      const large = Math.random() < 0.5;
      const sens = large ? '\\geqslant' : '>';
      // f(x) ⩾ k : entre les racines si a < 0, à l'extérieur si a > 0
      const bonne = union
        ? inter(String(xmin), String(al - d), false, !large) + ' \\cup ' + inter(String(al + d), String(xmax), !large, false)
        : inter(String(al - d), String(al + d), !large, !large);
      const cands = [
        union ? inter(String(al - d), String(al + d), !large, !large)
          : inter(String(xmin), String(al - d), false, !large) + ' \\cup ' + inter(String(al + d), String(xmax), !large, false),
        inter(String(al - d), String(al + d), large, large),
        inter(String(xmin), String(al + d), false, !large),
        inter(String(al - d), String(xmax), !large, false)
      ].filter(x => x !== bonne).map(x => opt(x));
      const figure = dessin(fen, [{ points: O.graph.echantillonner(f, xmin, xmax), label: "C_f" }]);
      return qcm(`On considère la fonction ${m('f')} définie sur ${m(inter(String(xmin), String(xmax), false, false))} et représentée ci-contre.<br>L’ensemble des solutions de l’inéquation ${m('f(x) ' + sens + ' ' + decL(k))} est :`,
        opt(bonne), cands, {
        figure: figure,
        explication: `La courbe coupe la droite d’équation ${m('y = ' + decL(k))} aux points d’abscisses ${m(String(al - d))} et ${m(String(al + d))}. La courbe est ${a < 0 ? 'au-dessus' : 'au-dessous'} de cette droite entre ces deux abscisses, donc l’inéquation est vérifiée ${union ? 'à l’extérieur de cet intervalle' : 'entre ces deux valeurs'} : ${m(bonne)}.${large ? ' Les bornes sont incluses car l’inégalité est large.' : ' Les bornes sont exclues car l’inégalité est stricte.'}`,
        optionsLarges: true
      });
    }
    return null;
  }

  // =====================================================================
  // Famille C : appartenance d'un point à une courbe (sans figure)
  // =====================================================================
  function pointSurCourbe(niveau) {
    const canonique = niveau === 1 || Math.random() < 0.5;
    const a = aleaParmi(canonique ? [1, -1, 2, -2, 0.5, -0.5] : [1, -1, 2, -2]);
    const al = alea(-4, 4), be = alea(-6, 8);
    const f = parabole(a, al, be);
    // écriture développée : a x² − 2aα x + (aα² + β)
    const A = a, B = -2 * a * al, C = a * al * al + be;
    if (!canonique && (!Number.isInteger(B) || !Number.isInteger(C))) return null;
    const tex = canonique ? f.tex : 'f(x) = ' + poly([[A, 'x^2'], [B, 'x'], [C, '']]);
    // le bon point : une abscisse entière donnant une ordonnée entière
    const xs = [];
    for (let x = -5; x <= 5; x++) { const y = f(x); if (Number.isInteger(y) && Math.abs(y) <= 30) xs.push([x, y]); }
    if (xs.length < 2) return null;
    const P = aleaParmi(xs);
    const noms = ['A', 'B', 'C', 'D'];
    const faux = [];
    for (let i = 0; i < 60 && faux.length < 3; i++) {
      const x = alea(-5, 5), y = alea(-12, 20);
      if (Math.abs(f(x) - y) < 1e-9) continue;
      if (faux.some(q => q[0] === x && q[1] === y)) continue;
      faux.push([x, y]);
    }
    if (faux.length < 3) return null;
    const fmt = (p, i) => noms[i] + '(' + p[0] + '\\,;\\,' + decL(p[1]) + ')';
    const tous = [P].concat(faux);
    return qcm(`On considère la fonction ${m('f')} définie sur ${m('\\mathbb{R}')} par ${m(tex)}, et on note ${m('\\mathcal{C}')} sa courbe représentative.<br>Un seul des quatre points suivants appartient à ${m('\\mathcal{C}')}. Lequel ?`,
      opt(fmt(tous[0], 0), 'ok'), tous.slice(1).map((p, i) => opt(fmt(p, i + 1), 'f' + i)), {
      explication: `Il faut vérifier que l’ordonnée du point est bien l’image de son abscisse. Pour ${m(fmt(tous[0], 0))} : ${m('f(' + (P[0] < 0 ? '(' + P[0] + ')' : P[0]) + ') = ' + decL(P[1]))}, l’égalité est vérifiée.`
    });
  }

  // =====================================================================
  // Famille D : comparer deux courbes (droite et parabole)
  // =====================================================================
  function comparerCourbes(niveau) {
    for (let essai = 0; essai < 50; essai++) {
      const r1 = alea(-4, 1), r2 = r1 + alea(2, 4);
      if (r2 > 4) continue;
      const a = aleaParmi([0.5, 1, -0.5, -1]);
      const mPente = alea(-2, 2), p = alea(-3, 3);
      const L = x => mPente * x + p;                         // droite
      const P = x => L(x) + a * (x - r1) * (x - r2);         // parabole
      const centre = Math.round((r1 + r2) / 2), dm = demiLargeur(a) + 1;
      const xmin = centre - dm, xmax = centre + dm;
      if (r1 < xmin || r2 > xmax) continue;
      let bas = Infinity, haut = -Infinity;
      for (let x = xmin; x <= xmax; x += 0.5) {
        bas = Math.min(bas, L(x), P(x)); haut = Math.max(haut, L(x), P(x));
      }
      // la fenêtre contient toujours l'origine (voir fenetreParabole)
      const ymin = Math.min(-1, Math.floor(bas) - 1), ymax = Math.max(1, Math.ceil(haut) + 1);
      if (ymax - ymin > 16 || ymax - ymin < 5) continue;
      const fen = { xmin, xmax, ymin, ymax, unite: Math.min(26, Math.floor(280 / Math.max(xmax - xmin, ymax - ymin))) };
      // f = droite, g = parabole. f(x) < g(x) ⟺ a(x−r1)(x−r2) > 0
      const dehors = a > 0;   // vrai : solution à l'extérieur de [r1, r2]
      const bonne = dehors
        ? inter(MOINS_INF, String(r1), true, true) + ' \\cup ' + inter(String(r2), PLUS_INF, true, true)
        : inter(String(r1), String(r2), true, true);
      const cands = [
        dehors ? inter(String(r1), String(r2), true, true)
          : inter(MOINS_INF, String(r1), true, true) + ' \\cup ' + inter(String(r2), PLUS_INF, true, true),
        inter(MOINS_INF, String(r1), true, true),
        inter(String(r2), PLUS_INF, true, true),
        inter(String(r1), String(r2), false, false)
      ].filter(x => x !== bonne).map(x => opt(x));
      const figure = dessin(fen, [
        { points: O.graph.echantillonner(L, xmin, xmax), label: "C_f", couleur: '#4B46C7', labelAuDebut: true },
        { points: O.graph.echantillonner(P, xmin, xmax), label: "C_g" }
      ]);
      return qcm(`On a représenté ci-contre une fonction affine ${m('f')} et une fonction polynôme du second degré ${m('g')}, définies sur ${m('\\mathbb{R}')}.<br>L’ensemble ${m('S')} des solutions de l’inéquation ${m('f(x) < g(x)')} est :`,
        opt(bonne), cands, {
        figure: figure,
        explication: `Les deux courbes se coupent aux points d’abscisses ${m(String(r1))} et ${m(String(r2))}. L’inéquation ${m('f(x) < g(x)')} se lit : la droite est <b>au-dessous</b> de la parabole, ce qui se produit ${dehors ? 'à l’extérieur de l’intervalle des abscisses d’intersection' : 'entre les deux abscisses d’intersection'}, d’où ${m(bonne)}.`,
        optionsLarges: true
      });
    }
    return null;
  }

  // =====================================================================
  // Famille E : lire une image ou un antécédent
  // =====================================================================
  function lectureImage(niveau) {
    for (let essai = 0; essai < 40; essai++) {
      const a = aleaParmi(niveau === 1 ? [1, -1] : COEFS_A);
      const al = alea(-2, 2), be = alea(-4, 4);
      const f = parabole(a, al, be);
      const dm = demiLargeur(a);
      const xmin = al - dm, xmax = al + dm;
      const fen = fenetreParabole(f, xmin, xmax);
      if (!fen) continue;
      const surImage = Math.random() < 0.55;
      if (surImage) {
        const xs = [];
        for (let x = xmin; x <= xmax; x++) { const y = f(x); if (Number.isInteger(y) && y >= fen.ymin && y <= fen.ymax) xs.push(x); }
        if (!xs.length) continue;
        const x0 = aleaParmi(xs), y0 = f(x0);
        const figure = dessin(fen, [{ points: O.graph.echantillonner(f, xmin, xmax), label: "C_f" }]);
        const cands = [y0 + 1, y0 - 1, x0, -y0].filter(v => v !== y0).map(v => opt(decL(v)));
        return qcm(`La courbe ci-contre représente une fonction ${m('f')}.<br>La valeur de ${m('f(' + x0 + ')')} est :`, opt(decL(y0)), cands, {
          figure: figure,
          explication: `On se place à l’abscisse ${m(String(x0))}, on monte jusqu’à la courbe et on lit l’ordonnée : ${m('f(' + x0 + ') = ' + decL(y0))}.`
        });
      }
      // antécédents : f(x) = k avec deux solutions entières
      const d = alea(1, dm - 1);
      const k = a * d * d + be;
      if (k < fen.ymin || k > fen.ymax) continue;
      const figure = dessin(fen, [{ points: O.graph.echantillonner(f, xmin, xmax), label: "C_f" }]);
      const bonne = ensemble([String(al - d), String(al + d)]);
      const cands = [
        ensemble([String(al)]), ensemble([String(al - d)]),
        ensemble([String(-(al - d)), String(-(al + d))].sort((x, y) => x - y)), VIDE
      ].filter(x => x !== bonne).map(x => opt(x));
      return qcm(`La courbe ci-contre représente une fonction ${m('f')} définie sur ${m(inter(String(xmin), String(xmax), false, false))}.<br>L’ensemble des antécédents de ${m(decL(k))} par ${m('f')} est :`, opt(bonne), cands, {
        figure: figure,
        explication: `On trace la droite d’équation ${m('y = ' + decL(k))} et on lit les abscisses des points d’intersection avec la courbe : ${m(String(al - d))} et ${m(String(al + d))}.`
      });
    }
    return null;
  }

  // =====================================================================
  // Niveau 3 : variantes plus élaborées
  // =====================================================================
  // signe de x × f(x) lu sur une courbe (fiche d'automatismes 3, Q10)
  function signeXFoisF() {
    for (let essai = 0; essai < 60; essai++) {
      // cubique à trois racines distinctes, dont l'amplitude est normalisée pour tenir
      // dans la fenêtre : seul le signe de f est lu, les ordonnées n'ont pas à être entières
      const r = melanger([-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2]).slice(0, 3).sort((x, y) => x - y);
      if (r.some((v, i) => i && v - r[i - 1] < 0.9)) continue;      // racines bien séparées
      const signe = aleaParmi([1, -1]);
      const xmin = -2.6, xmax = 2.6, lim = 5;
      const brut = x => (x - r[0]) * (x - r[1]) * (x - r[2]);
      let maxAbs = 0;
      for (let x = xmin; x <= xmax; x += 0.05) maxAbs = Math.max(maxAbs, Math.abs(brut(x)));
      const k = (lim - 0.6) / maxAbs;
      const f = x => signe * k * brut(x);
      const fen = { xmin, xmax, ymin: -lim, ymax: lim, unite: 40 };
      // quatre abscisses, deux vérifiant x·f(x) > 0 et deux non, avec un signe bien lisible
      const noms = ['A', 'B', 'C', 'D'];
      const candidats = [-2.3, -1.8, -1.3, -0.8, 0.8, 1.3, 1.8, 2.3].filter(x => Math.abs(f(x)) > 0.7 && Math.abs(f(x)) < lim - 0.4);
      const positifs = melanger(candidats.filter(x => x * f(x) > 0));
      const negatifs = melanger(candidats.filter(x => x * f(x) < 0));
      if (positifs.length < 2 || negatifs.length < 2) continue;
      const abs = positifs.slice(0, 2).concat(negatifs.slice(0, 2)).sort((x, y) => x - y);
      const pts = abs.map((x, i) => ({ x: x, y: f(x), label: noms[i] }));
      const bons = pts.filter(p => p.x * p.y > 0).map(p => p.label);
      if (bons.length !== 2) continue;
      const figure = dessin(fen, [{ points: O.graph.echantillonner(f, xmin, xmax), label: "C_f" }], { points: pts.map(p => ({ x: p.x, y: p.y, label: p.label })) });
      const paire = l => m('x_' + l[0]) + ' et ' + m('x_' + l[1]);
      const bonne = optTxt(paire(bons), bons.join(''));
      const autres = [];
      for (let i = 0; i < noms.length; i++) for (let j = i + 1; j < noms.length; j++) {
        const c = [noms[i], noms[j]];
        if (c.join('') !== bons.join('')) autres.push(optTxt(paire(c), c.join('')));
      }
      return qcm(`On a représenté ci-contre la courbe ${m('\\mathcal{C}_f')} d’une fonction ${m('f')}. Les points ${m('A')}, ${m('B')}, ${m('C')} et ${m('D')} appartiennent à ${m('\\mathcal{C}_f')} ; leurs abscisses sont notées ${m('x_A')}, ${m('x_B')}, ${m('x_C')} et ${m('x_D')}.<br>L’inéquation ${m('x \\times f(x) > 0')} est vérifiée par :`,
        bonne, melanger(autres).slice(0, 3), {
        figure: figure,
        explication: `Le produit ${m('x \\times f(x)')} est strictement positif quand ${m('x')} et ${m('f(x)')} sont <b>de même signe</b> : le point est soit à droite de l’axe des ordonnées et au-dessus de l’axe des abscisses, soit à gauche et au-dessous. Cela concerne ${paire(bons)}.`,
        optionsLarges: true
      });
    }
    return null;
  }

  // intersection d'une parabole et d'une droite : combien de points ? (fiche 1, Q8)
  function intersectionParaboleDroite() {
    const a = aleaParmi([1, -1]);
    const al = alea(-2, 2), be = alea(-4, 4);
    const mPente = alea(-3, 3);
    const cas = aleaParmi(['deux', 'deux', 'un', 'zero']);
    // f(x) − (mx + p) = a x² + (…)x + (…) : on choisit p pour fixer le discriminant
    // f(x) = a(x−al)² + be  →  a x² − 2a·al x + (a·al² + be)
    const A = a, B = -2 * a * al - mPente;
    let p;
    if (cas === 'un') p = a * al * al + be - B * B / (4 * A);            // discriminant nul
    else if (cas === 'deux') p = a * al * al + be - B * B / (4 * A) - a * alea(1, 4);
    else p = a * al * al + be - B * B / (4 * A) + a * alea(1, 4);
    if (!Number.isInteger(p)) return null;
    const C = a * al * al + be - p;
    const disc = B * B - 4 * A * C;
    const n = Math.abs(disc) < 1e-9 ? 1 : disc > 0 ? 2 : 0;
    const mot = ['aucun point d’intersection', 'un seul point d’intersection', 'deux points d’intersection'];
    const droite = 'y = ' + poly([[mPente, 'x'], [p, '']]);
    const bonne = optTxt(mot[n], 'n' + n);
    const cands = [0, 1, 2].filter(x => x !== n).map(x => optTxt(mot[x], 'n' + x))
      .concat([optTxt('on ne peut pas le savoir sans tracer les courbes', 'nsp')]);
    return qcm(`Dans un repère, on considère la parabole d’équation ${m('y = ' + poly([[A, 'x^2'], [-2 * a * al, 'x'], [a * al * al + be, '']]))} et la droite d’équation ${m(droite)}.<br>Elles ont :`,
      bonne, cands.slice(0, 3), {
      explication: `On résout ${m(poly([[A, 'x^2'], [-2 * a * al, 'x'], [a * al * al + be, '']]) + ' = ' + poly([[mPente, 'x'], [p, '']]))}, c’est-à-dire ${m(poly([[A, 'x^2'], [B, 'x'], [C, '']]) + ' = 0')}. Le discriminant vaut ${m('\\Delta = ' + B + '^2 - 4 \\times ' + (A < 0 ? '(' + A + ')' : A) + ' \\times ' + (C < 0 ? '(' + C + ')' : C) + ' = ' + disc)}, ${disc > 0 ? 'strictement positif : il y a deux points d’intersection' : disc === 0 ? 'nul : les courbes sont tangentes, il y a un seul point' : 'strictement négatif : les courbes ne se coupent pas'}.`,
      optionsLarges: true
    });
  }

  // =====================================================================
  Automatismes.enregistrerBanque('lectures-graphiques', {
    titre: 'Lectures graphiques',
    familles: {
      'lecture-image': famille({ nom: 'lire une image, un antécédent', niveaux: [1, 2, 3], base: lectureImage, ordre: { 1: 1, 2: 1 } }),
      'nombre-solutions': famille({
        nom: 'nombre de solutions de f(x) = k', niveaux: [1, 2, 3], base: nombreSolutions,
        ordre: { 1: 2, 2: 2 }, quota: { 2: { min: 1, priorite: 3 } }
      }),
      'point-sur-courbe': famille({ nom: 'point appartenant à une courbe', niveaux: [1, 2, 3], base: pointSurCourbe, ordre: { 1: 3, 2: 3 } }),
      'inequation-graphique': famille({
        nom: 'inéquation résolue graphiquement', niveaux: [1, 2, 3], base: inequationGraphique,
        ordre: { 1: 4, 2: 4 }, quota: { 2: { min: 1, priorite: 2 } }
      }),
      'comparer-courbes': famille({ nom: 'comparer deux courbes', niveaux: [2, 3], base: comparerCourbes, ordre: { 2: 5 }, quota: { 2: { max: 1 }, 3: { max: 1 } } }),
      'signe-produit-x': famille({ nom: 'signe de x × f(x)', niveaux: [3], base: () => null, variantes3: [signeXFoisF] }),
      'intersection': famille({ nom: 'intersection d’une parabole et d’une droite', niveaux: [3], base: () => null, variantes3: [intersectionParaboleDroite] })
    }
  });
})();
