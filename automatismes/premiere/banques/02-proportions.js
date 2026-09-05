/* Banque 02 — Proportions et ordres de grandeur
   Familles observées dans les sujets 2026 : retrouver le total à partir d'une part
   (4 sujets sur 5), proportionnalité et débits, conversions d'unités, ordre de grandeur.

   Niveau 1 — les bases : une part simple → le total, une règle de trois, une conversion
              courante, un ordre de grandeur d'un produit ou d'un quotient.
   Niveau 2 — l'épreuve : « 75 % étudient le grec, les 9 autres le latin », « 150 élèves
              représentent les 3/5 », « 2 400 images en 1 min 40 s », joules → kWh, m² → cm².
   Niveau 3 — bien plus difficile : deux parts et un reste, part d'une part, proportionnalité
              inverse, échelles, comparaison de prix au litre, conversions d'aires, de volumes
              et de débits, estimations concrètes en notation scientifique. */
(function () {
  'use strict';
  const O = Automatismes.outils;
  const { alea, aleaParmi, dec, decL, pct, euros, fracL, m, sciL, qcm, famille } = O;
  const R = v => O.arrondir(v, 6);
  const entier = v => Number.isInteger(R(v));
  const deuxDec = v => Number.isInteger(R(v * 100));
  const opt = (aff, cle) => ({ affichage: aff, cle: cle === undefined ? aff : cle });

  // ---------------------------------------------------------------------
  // Contextes « une partie d'un ensemble » : intro, deux parts complémentaires,
  // nom de l'ensemble, format, valeurs plausibles du total
  // ---------------------------------------------------------------------
  //   tout : nom complet ; court : nom pour compter ; f : féminin (pronom « elles ») ; pers : personnes
  const ENSEMBLES = [
    { intro: 'Dans un club de natation', parts: ['sont mineurs', 'sont majeurs'], tout: 'adhérents', court: 'adhérents', pers: true, question: 'Le nombre d’adhérents du club est :', valeurs: [40, 48, 60, 80, 96, 120, 150, 160, 200, 240, 300] },
    { intro: 'Dans une classe de première', parts: ['étudient l’espagnol', 'étudient l’allemand'], tout: 'élèves', court: 'élèves', pers: true, question: 'L’effectif de la classe est :', valeurs: [24, 28, 30, 32, 35, 36] },
    { intro: 'Dans un lycée', parts: ['sont demi-pensionnaires', 'sont externes'], tout: 'élèves', court: 'élèves', pers: true, lycee: true, question: 'L’effectif du lycée est :', valeurs: [400, 480, 500, 600, 640, 750, 800, 900, 1000, 1200] },
    { intro: 'Lors d’une élection municipale', parts: ['ont voté', 'se sont abstenus'], tout: 'électeurs inscrits', court: 'électeurs', pers: true, election: true, question: 'Le nombre d’électeurs inscrits est :', valeurs: [500, 800, 1000, 1200, 1500, 2000, 2400, 3000, 4000] },
    { intro: 'Dans une entreprise', parts: ['travaillent sur place', 'travaillent à distance'], tout: 'salariés', court: 'salariés', pers: true, question: 'Le nombre de salariés de l’entreprise est :', valeurs: [40, 60, 80, 100, 120, 150, 200, 240, 300, 400] },
    { intro: 'Dans un parking', parts: ['sont occupées', 'sont libres'], tout: 'places', court: 'places', f: true, question: 'Le nombre total de places est :', valeurs: [40, 60, 80, 100, 120, 150, 200, 240, 300] },
    { intro: 'Dans une médiathèque', parts: ['sont des romans', 'sont des documentaires'], tout: 'livres', court: 'livres', question: 'Le nombre total de livres est :', valeurs: [800, 1000, 1200, 1500, 2000, 2400, 3000, 4000, 5000] },
    { intro: 'Dans un verger', parts: ['sont des pommiers', 'sont des poiriers'], tout: 'arbres', court: 'arbres', question: 'Le nombre total d’arbres est :', valeurs: [40, 48, 60, 80, 96, 120, 150, 200, 240] },
    { intro: 'Pour un concert', parts: ['ont été vendus en ligne', 'ont été vendus au guichet'], tout: 'billets', court: 'billets', question: 'Le nombre total de billets vendus est :', valeurs: [400, 500, 600, 800, 1000, 1200, 1500, 2000, 2500] },
    { intro: 'Lors d’un sondage', parts: ['ont répondu oui', 'ont répondu non'], tout: 'personnes interrogées', court: 'personnes', f: true, pers: true, question: 'Le nombre de personnes interrogées est :', valeurs: [200, 250, 400, 500, 600, 800, 1000, 1200, 2000] },
    { intro: 'Dans une équipe de football amateur', parts: ['sont des attaquants', 'sont des défenseurs ou des gardiens'], tout: 'joueurs', court: 'joueurs', pers: true, question: 'Le nombre de joueurs de l’équipe est :', valeurs: [20, 24, 25, 30, 32, 40] },
    { intro: 'Dans un refuge pour animaux', parts: ['sont des chats', 'sont des chiens'], tout: 'animaux', court: 'animaux', question: 'Le nombre d’animaux du refuge est :', valeurs: [40, 48, 60, 64, 80, 96, 120, 150] },
    { intro: 'Dans un camping', parts: ['sont occupés', 'sont libres'], tout: 'emplacements', court: 'emplacements', question: 'Le nombre total d’emplacements est :', valeurs: [40, 50, 60, 80, 100, 120, 150, 200] },
    { intro: 'Sur un vol long-courrier', parts: ['voyagent en classe affaires', 'voyagent en classe économique'], tout: 'passagers', court: 'passagers', pers: true, question: 'Le nombre de passagers est :', valeurs: [200, 240, 250, 300, 320, 400] }
  ];
  const pron = c => (c.f ? 'elles' : 'ils');
  const FRACTIONS = [
    { txt: 'Un quart', txtMin: 'un quart', n: 1, d: 4 }, { txt: 'Les trois quarts', txtMin: 'les trois quarts', n: 3, d: 4 },
    { txt: 'Un cinquième', txtMin: 'un cinquième', n: 1, d: 5 }, { txt: 'Les deux cinquièmes', txtMin: 'les deux cinquièmes', n: 2, d: 5 },
    { txt: 'Les trois cinquièmes', txtMin: 'les trois cinquièmes', n: 3, d: 5 }, { txt: 'Un tiers', txtMin: 'un tiers', n: 1, d: 3 },
    { txt: 'Les deux tiers', txtMin: 'les deux tiers', n: 2, d: 3 }, { txt: 'Les trois huitièmes', txtMin: 'les trois huitièmes', n: 3, d: 8 },
    { txt: 'Les cinq huitièmes', txtMin: 'les cinq huitièmes', n: 5, d: 8 }, { txt: 'Un dixième', txtMin: 'un dixième', n: 1, d: 10 }, { txt: 'La moitié', txtMin: 'la moitié', n: 1, d: 2 }
  ];
  const nb = (v, c) => dec(v) + ' ' + c.court;

  // =====================================================================
  // Famille A : retrouver le total à partir d'une part
  // =====================================================================
  // distracteurs communs : part + taux (Métropole : 9 et 25 % → 34), les « autres », part × taux/10…
  function distracteursTotal(total, part, t, c) {
    return [part + t, total - part, R(part * t / 10), R(part * t / 100), part * 2, R(total * t / 100), R(part * 100 / (100 - t)), total + part, R(total / 2)]
      .filter(v => v > 0 && v !== total && entier(v)).map(v => opt(nb(v, c), v));
  }
  function retrouverTotal(niveau) {
    const c = aleaParmi(ENSEMBLES);
    const total = aleaParmi(c.valeurs);
    const forme = niveau === 1 ? aleaParmi(['directe', 'directe', 'fraction']) : aleaParmi(['directe', 'complement', 'complement', 'fraction', 'fraction']);
    const [p1, p2] = Math.random() < 0.5 ? c.parts : [c.parts[1], c.parts[0]];
    if (forme === 'fraction') {
      const fr = aleaParmi(niveau === 1 ? FRACTIONS.filter(f => f.d <= 5) : FRACTIONS);
      const part = R(total * fr.n / fr.d);
      if (!entier(part)) return null;
      const enonce = `${c.intro}, ${fr.txtMin} des ${c.tout} ${p1} : ${pron(c)} sont ${dec(part)}.<br>${c.question}`;
      const bonne = opt(nb(total, c), total);
      const candidats = [R(part * fr.n / fr.d), R(part * fr.d), R(part * fr.d / fr.n) + part, total - part, R(part * fr.n), R(part + part / fr.n * (fr.d - fr.n))]
        .filter(v => v > 0 && v !== total && entier(v)).map(v => opt(nb(v, c), v));
      const expl = `${nb(part, c)} représentent ${m(fracL(fr.n, fr.d, { petite: true }))} du total, donc le total vaut ${m(decL(part) + ' \\div \\frac{' + fr.n + '}{' + fr.d + '} = ' + decL(part) + ' \\times \\frac{' + fr.d + '}{' + fr.n + '} = ' + decL(total))}.`;
      return qcm(enonce, bonne, candidats, { explication: expl });
    }
    const t = aleaParmi(niveau === 1 ? [10, 20, 25, 50] : [5, 10, 12, 15, 20, 25, 30, 40, 60, 75, 80]);
    const part = R(total * t / 100); // effectif du groupe qui représente t %
    if (!entier(part)) return null;
    if (forme === 'directe') {
      const enonce = `${c.intro}, ${pct(t)} des ${c.tout} ${p1} : ${pron(c)} sont ${dec(part)}.<br>${c.question}`;
      const expl = `${dec(part)} correspond à ${pct(t)} du total : total ${m('= \\dfrac{' + decL(part) + '}{' + decL(t / 100) + '} = ' + decL(part) + ' \\times \\dfrac{100}{' + t + '} = ' + decL(total))}.`;
      return qcm(enonce, opt(nb(total, c), total), distracteursTotal(total, part, t, c), { explication: expl });
    }
    // le complément est donné (Métropole 2026 : « 75 % étudient le grec ; les autres le latin : ils sont 9 »)
    // → on donne l'effectif du groupe « les autres », c'est-à-dire celui qui représente t %
    const enonce = `${c.intro}, ${pct(100 - t)} des ${c.tout} ${p2}. Les autres ${p1} : ${pron(c)} sont ${dec(part)}.<br>${c.question}`;
    const expl = `Les autres représentent ${m('100 - ' + (100 - t) + ' = ' + t)} % du total. ${dec(part)} correspond donc à ${pct(t)} : total ${m('= \\dfrac{' + decL(part) + '}{' + decL(t / 100) + '} = ' + decL(total))}.`;
    const bonne = opt(nb(total, c), total);
    // erreurs types : part + (100 − t) (Métropole : 9 + 25 → 34), diviser par (100 − t) %, doubler…
    const candidats = [part + (100 - t), part + t, R(part * 100 / (100 - t)), part * 2, R(part * t / 10), total - part, R(part * (100 - t) / 100) + part]
      .filter(v => v > 0 && v !== total && entier(v)).map(v => opt(nb(v, c), v));
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N3-a : deux parts en pourcentage et un reste en effectif
  function totalDeuxParts() {
    const c = aleaParmi(ENSEMBLES.filter(x => x.pers && x.valeurs[0] >= 100));
    const total = aleaParmi(c.valeurs);
    const [a, b] = aleaParmi([[40, 35], [45, 30], [50, 20], [30, 30], [60, 15], [25, 35], [20, 55], [35, 40], [45, 45], [30, 45]]);
    const reste = R(total * (100 - a - b) / 100);
    if (!entier(reste) || reste <= 0) return null;
    const trois = c.lycee ? ['sont en seconde', 'sont en première', 'sont en terminale']
      : c.election ? ['ont voté pour la liste A', 'ont voté pour la liste B', 'ont voté pour la liste C']
      : aleaParmi([
        ['ont moins de 30 ans', 'ont entre 30 et 60 ans', 'ont plus de 60 ans'],
        ['viennent à pied', 'viennent en bus', 'viennent en voiture'],
        ['préfèrent le cinéma', 'préfèrent le théâtre', 'préfèrent les concerts']
      ]);
    const enonce = `${c.intro}, ${pct(a)} des ${c.tout} ${trois[0]}, ${pct(b)} ${trois[1]} et les ${dec(reste)} autres ${trois[2]}.<br>${c.question}`;
    const bonne = opt(nb(total, c), total);
    const r = 100 - a - b;
    const candidats = [R(reste * 100 / (a + b)), reste + a + b, R(reste * (a + b) / 100) + reste, reste * 2, R(reste * 100 / a), R(total - reste), R(reste * r)]
      .filter(v => v > 0 && v !== total && entier(v)).map(v => opt(nb(v, c), v));
    const expl = `Les autres représentent ${m('100 - ' + a + ' - ' + b + ' = ' + r)} % du total. ${dec(reste)} correspond à ${pct(r)}, donc total ${m('= \\dfrac{' + decL(reste) + '}{' + decL(r / 100) + '} = ' + decL(total))}.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N3-b : part d'une part (30 % des élèves sont en première, 40 % d'entre eux en spé maths : ils sont 36)
  function totalPartDePart() {
    const [a, b] = aleaParmi([[30, 40], [20, 50], [25, 40], [60, 25], [50, 30], [40, 45], [75, 20], [80, 25], [30, 30], [40, 40], [25, 60], [20, 75]]);
    const c = aleaParmi([
      { intro: 'Dans un lycée', tout: 'élèves', a: 'sont en première', b: 'suivent la spécialité mathématiques', question: 'L’effectif du lycée est :', valeurs: [300, 400, 500, 600, 800, 1000, 1200] },
      { intro: 'Dans une ville', tout: 'habitants', a: 'ont moins de 30 ans', b: 'sont étudiants', question: 'La population de la ville est :', valeurs: [2000, 4000, 5000, 8000, 10000, 12000, 20000] },
      { intro: 'Dans une entreprise', tout: 'salariés', a: 'sont des cadres', b: 'travaillent au siège', question: 'Le nombre de salariés est :', valeurs: [100, 120, 200, 300, 400, 500, 800] },
      { intro: 'Dans un club de tennis', tout: 'adhérents', a: 'sont des femmes', b: 'jouent en compétition', question: 'Le nombre d’adhérents est :', valeurs: [100, 120, 160, 200, 240, 300, 400] }
    ]);
    const total = aleaParmi(c.valeurs);
    c.court = c.tout;
    const sous = R(total * a * b / 10000);
    if (!entier(sous)) return null;
    const enonce = `${c.intro}, ${pct(a)} des ${c.tout} ${c.a} ; parmi ceux-ci, ${pct(b)} ${c.b}. Ces derniers sont ${dec(sous)}.<br>${c.question}`;
    const bonne = opt(nb(total, c), total);
    const ab = R(a * b / 100);
    const candidats = [R(sous * 100 / (a + b)), R(sous * 100 / b), R(sous * 100 / a), R(sous * 100 / Math.abs(a - b || 1)), sous * 2, R(total * a / 100)]
      .filter(v => v > 0 && v !== total && entier(v)).map(v => opt(nb(v, c), v));
    const expl = `${pct(b)} de ${pct(a)}, c'est ${m(decL(a / 100) + ' \\times ' + decL(b / 100) + ' = ' + decL(ab / 100))}, soit ${pct(ab)} du total. Total ${m('= \\dfrac{' + decL(sous) + '}{' + decL(ab / 100) + '} = ' + decL(total))}.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N3-c : une fraction et un reste (« un tiers des places sont réservées, les 240 autres… »)
  function totalFractionReste() {
    const c = aleaParmi(ENSEMBLES);
    const total = aleaParmi(c.valeurs);
    const fr = aleaParmi(FRACTIONS.filter(f => f.n < f.d));
    const part = R(total * fr.n / fr.d);
    const reste = total - part;
    if (!entier(part) || reste <= 0) return null;
    const enonce = `${c.intro}, ${fr.txtMin} des ${c.tout} ${c.parts[0]} ; les ${dec(reste)} autres ${c.parts[1]}.<br>${c.question}`;
    const bonne = opt(nb(total, c), total);
    const candidats = [R(reste * fr.d / fr.n), R(reste * fr.d), R(reste * fr.n / fr.d) + reste, reste * 2, R(reste * fr.d / (fr.d - fr.n)) - reste, R(reste + part / 2)]
      .filter(v => v > 0 && v !== total && entier(v)).map(v => opt(nb(v, c), v));
    const expl = `Les autres représentent ${m('1 - \\frac{' + fr.n + '}{' + fr.d + '} = \\frac{' + (fr.d - fr.n) + '}{' + fr.d + '}')} du total : ${dec(reste)} correspond à ${m('\\frac{' + (fr.d - fr.n) + '}{' + fr.d + '}')}, donc total ${m('= ' + decL(reste) + ' \\times \\frac{' + fr.d + '}{' + (fr.d - fr.n) + '} = ' + decL(total))}.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // =====================================================================
  // Famille B : proportionnalité (règle de trois, débits, vitesses)
  // =====================================================================
  // contextes : q1 unités → v1 ; on demande la valeur pour q2 (ou la quantité pour v2)
  const PROP = [
    { objet: 'cahiers', phrase: (q, v) => `${q} cahiers identiques coûtent ${euros(v)}.`, question: q => `Le prix de ${q} de ces cahiers est :`, fmt: euros, unit: [1.2, 1.5, 2, 2.5, 3, 4], q1: [4, 5, 6, 8, 10], q2: [12, 15, 20, 25, 30] },
    { objet: 'pommes', phrase: (q, v) => `${dec(q)} kg de pommes coûtent ${euros(v)}.`, question: q => `Le prix de ${dec(q)} kg de ces pommes est :`, fmt: euros, unit: [2, 2.5, 3, 3.5, 4], q1: [2, 3, 4, 5], q2: [6, 7, 8, 10, 12] },
    { objet: 'essence', phrase: (q, v) => `Une voiture consomme ${dec(v)} litres d’essence pour ${dec(q)} km.`, question: q => `Pour ${dec(q)} km, elle consomme :`, fmt: v => dec(v) + ' L', unit: [0.05, 0.06, 0.07, 0.08], q1: [100, 200, 300], q2: [150, 250, 400, 450, 500, 600] },
    { objet: 'farine', phrase: (q, v) => `Pour ${q} personnes, une recette demande ${dec(v)} g de farine.`, question: q => `Pour ${q} personnes, il faut :`, fmt: v => dec(v) + ' g', unit: [50, 60, 75, 80, 100], q1: [4, 6, 8], q2: [3, 5, 10, 12, 15] },
    { objet: 'marche', phrase: (q, v) => `Un randonneur parcourt ${dec(q)} km en ${dec(v)} minutes, à allure constante.`, question: q => `Pour ${dec(q)} km, il lui faut :`, fmt: v => dec(v) + ' min', unit: [12, 15, 20], q1: [2, 3, 4, 5], q2: [6, 7, 8, 10] },
    { objet: 'bouteilles', phrase: (q, v) => `Une machine remplit ${dec(v)} bouteilles en ${dec(q)} minutes.`, question: q => `En ${dec(q)} minutes, elle remplit :`, fmt: v => dec(v) + ' bouteilles', unit: [20, 25, 30, 40, 50], q1: [5, 10, 12, 15, 20], q2: [30, 45, 60, 90] },
    { objet: 'peinture', phrase: (q, v) => `Il faut ${dec(v)} litres de peinture pour ${dec(q)} m² de mur.`, question: q => `Pour ${dec(q)} m², il faut :`, fmt: v => dec(v) + ' L', unit: [0.1, 0.125, 0.15, 0.2], q1: [20, 40, 80], q2: [30, 50, 60, 100, 120] },
    { objet: 'photocopies', phrase: (q, v) => `Une photocopieuse produit ${dec(v)} pages en ${dec(q)} minutes.`, question: q => `En ${dec(q)} minutes, elle produit :`, fmt: v => dec(v) + ' pages', unit: [30, 40, 45, 60], q1: [2, 3, 4, 5], q2: [7, 8, 10, 12, 15] },
    { objet: 'tissu', phrase: (q, v) => `${dec(q)} mètres de tissu coûtent ${euros(v)}.`, question: q => `Le prix de ${dec(q)} mètres de ce tissu est :`, fmt: euros, unit: [4, 5, 6, 8, 12], q1: [2, 3, 5], q2: [4, 6, 7, 8, 10] }
  ];
  function proportionnalite(niveau) {
    const c = aleaParmi(PROP);
    const u = aleaParmi(c.unit);
    const q1 = aleaParmi(c.q1), q2 = aleaParmi(c.q2);
    if (q1 === q2) return null;
    const v1 = R(u * q1), v2 = R(u * q2);
    if (niveau === 1 && (!entier(v1) || !entier(v2))) return null;
    if (!deuxDec(v1) || !deuxDec(v2)) return null;
    const enonce = `${c.phrase(q1, v1)}<br>${c.question(q2)}`;
    const bonne = opt(c.fmt(v2), v2);
    // erreurs types : ajouter la différence des quantités, multiplier v1 par q2, inverser le rapport
    const candidats = [R(v1 + (q2 - q1)), R(v1 * q2), R(v1 * q1 / q2), R(v2 + u), R(v2 - u), R(v1 * 2), R(v1 * q2 / 10)]
      .filter(v => v > 0 && v !== v2 && deuxDec(v)).map(v => opt(c.fmt(v), v));
    const expl = `Situation de proportionnalité : pour 1 unité, ${m(decL(v1) + ' \\div ' + decL(q1) + ' = ' + decL(u))} ; pour ${dec(q2)} : ${m(decL(u) + ' \\times ' + decL(q2) + ' = ' + decL(v2))} (ou directement ${m(decL(v1) + ' \\times \\dfrac{' + decL(q2) + '}{' + decL(q1) + '}')}).`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N2 : débits et vitesses avec une conversion de temps (Métropole 2026 : 2 400 images en 1 min 40 s)
  function tempsTxt(s) {
    const mn = Math.floor(s / 60), sec = s % 60;
    if (mn === 0) return sec + ' s';
    return mn + ' min' + (sec ? ' ' + sec + ' s' : '');
  }
  function debitVitesse(niveau) {
    const type = aleaParmi(['images', 'images', 'vitesse', 'pompe', 'coeur']);
    if (type === 'images') {
      const ips = aleaParmi([24, 25, 30, 50, 60]);
      const s = aleaParmi([80, 90, 100, 120, 150, 200]);
      const total = ips * s;
      const enonce = `Une vidéo d’une durée de ${tempsTxt(s)} contient ${dec(total)} images.<br>Le nombre d’images par seconde est :`;
      const bonne = opt(dec(ips) + ' images/s', ips);
      const faux = Math.floor(s / 60) * 100 + s % 60; // « 1 min 40 » lu comme 140
      const candidats = [R(total / faux), R(total / (s / 60)), R(ips * 60 / 100 * 10), R(total / (s + 60)), ips * 2, R(ips / 2)]
        .filter(v => v > 0 && v !== ips && deuxDec(v)).map(v => opt(dec(v) + ' images/s', v));
      const expl = `${tempsTxt(s)} = ${dec(s)} s (et non ${faux}). ${m(decL(total) + ' \\div ' + decL(s) + ' = ' + decL(ips))} images par seconde.`;
      return qcm(enonce, bonne, candidats, { explication: expl });
    }
    if (type === 'vitesse') {
      const v = aleaParmi([60, 80, 90, 100, 120]);
      const min = aleaParmi([45, 75, 90, 105, 135, 150]);
      const d = R(v * min / 60);
      if (!entier(d)) return null;
      const h = Math.floor(min / 60), mn = min % 60;
      const enonce = `Un train parcourt ${dec(d)} km en ${h} h${mn ? ' ' + mn + ' min' : ''}.<br>Sa vitesse moyenne est :`;
      const bonne = opt(dec(v) + ' km/h', v);
      const faux = h + mn / 100; // 1 h 15 lu comme 1,15 h
      const candidats = [R(d / faux), R(d / min * 100), R(d / h), R(d * 60 / min / 2), v + 10, v - 10]
        .filter(x => x > 0 && x !== v && deuxDec(x)).map(x => opt(dec(x) + ' km/h', x));
      // decL (virgule échappée {,}) ne vaut que dans une zone \(...\) ; en texte brut, dec
      const expl = `${h} h${mn ? ' ' + mn + ' min' : ''} = ${m('\\dfrac{' + min + '}{60}')} h = ${dec(min / 60)} h (et non ${dec(faux)} h). Vitesse ${m('= \\dfrac{' + decL(d) + '}{' + decL(min / 60) + '} = ' + decL(v))} km/h.`;
      return qcm(enonce, bonne, candidats, { explication: expl });
    }
    if (type === 'pompe') {
      const lpm = aleaParmi([15, 20, 25, 30, 40, 50]);
      const t1 = aleaParmi([10, 12, 15, 20]);
      const min2 = aleaParmi([90, 105, 120, 150]);
      const v1 = lpm * t1, v2 = lpm * min2;
      const h = Math.floor(min2 / 60), mn = min2 % 60;
      const enonce = `Une pompe remplit ${dec(v1)} litres en ${t1} minutes, à débit constant.<br>En ${h} h${mn ? ' ' + mn + ' min' : ''}, elle remplit :`;
      const bonne = opt(dec(v2) + ' L', v2);
      const faux = h * 100 + mn;
      const candidats = [R(lpm * faux), R(lpm * (h + mn / 100) * 60), R(v1 * (min2 - t1)), R(v1 * h), R(v2 / 2), R(lpm * min2 / 10)]
        .filter(x => x > 0 && x !== v2 && entier(x)).map(x => opt(dec(x) + ' L', x));
      const expl = `Débit : ${m(decL(v1) + ' \\div ' + t1 + ' = ' + lpm)} L/min. ${h} h${mn ? ' ' + mn + ' min' : ''} = ${min2} min, donc ${m(lpm + ' \\times ' + min2 + ' = ' + decL(v2))} L.`;
      return qcm(enonce, bonne, candidats, { explication: expl });
    }
    // battements de cœur
    const bpm = aleaParmi([60, 70, 75, 80]);
    const min = aleaParmi([90, 120, 150, 180, 240]);
    const total = bpm * min;
    const h = Math.floor(min / 60), mn = min % 60;
    const enonce = `Le cœur d’une personne bat ${bpm} fois par minute.<br>En ${h} h${mn ? ' ' + mn + ' min' : ''}, il bat :`;
    const bonne = opt(dec(total) + ' fois', total);
    const candidats = [bpm * (h * 100 + mn), bpm * h, bpm * 60, R(total / 10), R(bpm * (h + mn / 100) * 60), total * 2]
      .filter(x => x > 0 && x !== total && entier(x)).map(x => opt(dec(x) + ' fois', x));
    const expl = `${h} h${mn ? ' ' + mn + ' min' : ''} = ${min} min ; ${m(bpm + ' \\times ' + min + ' = ' + decL(total))}.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N3-a : proportionnalité inverse (piège : appliquer une règle de trois directe)
  function proportionnaliteInverse() {
    const c = aleaParmi([
      { a: (n, t) => `${n} ouvriers mettent ${dec(t)} heures pour monter un mur.`, q: n => `À la même cadence, ${n} ouvriers mettraient :`, fmt: v => dec(v) + ' h' },
      { a: (n, t) => `${n} robinets identiques remplissent un bassin en ${dec(t)} heures.`, q: n => `Avec ${n} robinets, le bassin serait rempli en :`, fmt: v => dec(v) + ' h' },
      { a: (n, t) => `À ${dec(n * 10)} km/h, un trajet dure ${dec(t)} heures.`, q: n => `À ${dec(n * 10)} km/h, le même trajet durerait :`, fmt: v => dec(v) + ' h' },
      { a: (n, t) => `Un stock de nourriture permet de nourrir ${n} personnes pendant ${dec(t)} jours.`, q: n => `Le même stock nourrirait ${n} personnes pendant :`, fmt: v => dec(v) + ' jours' }
    ]);
    const [n1, n2] = aleaParmi([[4, 3], [3, 4], [2, 3], [3, 2], [4, 6], [6, 4], [5, 4], [4, 5], [8, 6], [6, 8], [3, 6], [6, 3], [4, 8], [8, 4], [10, 8], [8, 10], [12, 9], [9, 12]]);
    const K = aleaParmi([12, 24, 36, 48, 60, 72, 120]);
    const t1 = R(K / n1), t2 = R(K / n2);
    if (!deuxDec(t1) || !deuxDec(t2) || t1 === t2) return null;
    const enonce = `${c.a(n1, t1)}<br>${c.q(n2)}`;
    const bonne = opt(c.fmt(t2), t2);
    const candidats = [R(t1 * n2 / n1), R(t1 + (n2 - n1)), R(t1 - (n2 - n1)), R(t1 * n2), R(t1 / n2), R(t1 * (n1 + n2) / n1 / 2)]
      .filter(v => v > 0 && v !== t2 && deuxDec(v)).map(v => opt(c.fmt(v), v));
    const naif = R(t1 * n2 / n1);
    const expl = `Ce n'est pas une situation de proportionnalité mais de proportionnalité inverse : le produit ${m(n1 + ' \\times ' + decL(t1) + ' = ' + K)} reste constant. D'où ${m(K + ' \\div ' + n2 + ' = ' + decL(t2))}. Une règle de trois directe${deuxDec(naif) ? ' (' + c.fmt(naif) + ')' : ''} est absurde ici : ${n2 > n1 ? 'plus nombreux, ils vont plus vite' : 'moins nombreux, ils vont moins vite'}.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N3-b : échelles de cartes et de plans
  function echelle() {
    const sens = Math.random() < 0.6 ? 'carte-vers-reel' : 'reel-vers-plan';
    if (sens === 'carte-vers-reel') {
      const e = aleaParmi([25000, 50000, 100000, 200000, 500000]);
      const cm = aleaParmi([2, 3, 4, 5, 6, 8, 12]);
      const km = R(cm * e / 100000);
      if (!deuxDec(km)) return null;
      const enonce = `Sur une carte à l’échelle ${m('1/' + dec(e).replace(/ /g, '\\,'))}, deux villages sont distants de ${cm} cm.<br>La distance réelle entre ces villages est :`;
      const bonne = opt(dec(km) + ' km', km);
      const candidats = [R(km * 10), R(km / 10), R(km * 100), R(cm * e / 1000000), R(cm * e / 10000), R(km * 1000)]
        .filter(v => v > 0 && v !== km && deuxDec(v)).map(v => opt(dec(v) + ' km', v));
      const expl = `1 cm sur la carte représente ${dec(e)} cm réels, soit ${dec(e / 100000)} km. ${cm} cm représentent ${m(cm + ' \\times ' + decL(e / 100000) + ' = ' + decL(km))} km.`;
      return qcm(enonce, bonne, candidats, { explication: expl });
    }
    const e = aleaParmi([50, 100, 200, 250, 500]);
    const mReel = aleaParmi([4, 5, 6, 8, 10, 12, 15, 20]);
    const cmPlan = R(mReel * 100 / e);
    if (!deuxDec(cmPlan) || cmPlan < 1) return null;
    const enonce = `Sur un plan à l’échelle ${m('1/' + e)}, un mur de ${mReel} m de long est représenté par un segment de :`;
    const bonne = opt(dec(cmPlan) + ' cm', cmPlan);
    const candidats = [R(cmPlan * 10), R(cmPlan / 10), R(mReel * e / 100), R(mReel / e), R(cmPlan * 100), R(mReel * 100 / e * 2)]
      .filter(v => v > 0 && v !== cmPlan && deuxDec(v)).map(v => opt(dec(v) + ' cm', v));
    const expl = `${mReel} m = ${dec(mReel * 100)} cm ; sur le plan, les longueurs sont divisées par ${e} : ${m(decL(mReel * 100) + ' \\div ' + e + ' = ' + decL(cmPlan))} cm.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N3-c : comparer des prix au litre / au kilo
  function meilleurPrix() {
    const c = aleaParmi([
      { nom: 'jus d’orange', u: 'L', tailles: [[0.75, 1], [1, 1.5], [0.5, 2], [1.5, 2]] },
      { nom: 'lessive', u: 'L', tailles: [[1, 2], [1.5, 3], [2, 5]] },
      { nom: 'riz', u: 'kg', tailles: [[0.5, 1], [1, 2], [1, 5], [2, 5]] },
      { nom: 'café', u: 'kg', tailles: [[0.25, 0.5], [0.5, 1], [0.25, 1]] }
    ]);
    const [qa, qb] = aleaParmi(c.tailles);
    const pa = aleaParmi([2, 2.4, 3, 3.2, 4, 4.5, 5, 6, 8, 12]); // prix au litre/kilo du petit
    const ecart = aleaParmi([-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.5]);
    const pb = R(pa + ecart);
    const A = R(pa * qa), B = R(pb * qb);
    if (!deuxDec(A) || !deuxDec(B) || A === B) return null;
    const enonce = `Un ${c.nom} est vendu en deux formats : ${dec(qa)} ${c.u} pour ${euros(A)}, ou ${dec(qb)} ${c.u} pour ${euros(B)}.<br>Au ${c.u === 'L' ? 'litre' : 'kilo'}, le format le plus avantageux est :`;
    const rep = ecart < 0 ? 'grand' : (ecart > 0 ? 'petit' : 'egal');
    const options = [
      opt(`le grand format (${dec(qb)} ${c.u}), à ${euros(pb)} le ${c.u === 'L' ? 'litre' : 'kilo'}`, 'grand'),
      opt(`le petit format (${dec(qa)} ${c.u}), à ${euros(pa)} le ${c.u === 'L' ? 'litre' : 'kilo'}`, 'petit'),
      opt('les deux formats reviennent au même prix', 'egal'),
      opt('on ne peut pas comparer sans connaître la marque', 'nsp')
    ];
    const bonne = options.find(o => o.cle === rep);
    const candidats = options.filter(o => o.cle !== rep);
    const expl = `Prix au ${c.u === 'L' ? 'litre' : 'kilo'} : ${m(decL(A) + ' \\div ' + decL(qa) + ' = ' + decL(pa))} € et ${m(decL(B) + ' \\div ' + decL(qb) + ' = ' + decL(pb))} €. ${rep === 'egal' ? 'Les deux prix unitaires sont égaux.' : 'Le format le moins cher à l’unité est le ' + rep + '.'} Le grand format n'est pas toujours le plus avantageux.`;
    return qcm(enonce, bonne, candidats, { explication: expl, optionsLarges: true });
  }

  // =====================================================================
  // Famille C : conversions d'unités
  // =====================================================================
  function conversions(niveau) {
    const gen = niveau === 1 ? aleaParmi(CONV_N1) : aleaParmi(CONV_N2);
    return gen();
  }
  const CONV_N1 = [
    () => { const km = aleaParmi([1.5, 2.5, 3.2, 0.8, 4.5, 0.25, 12.5]); const mtr = km * 1000; return qcm(`${dec(km)} km, c'est :`, opt(dec(mtr) + ' m', mtr), [R(km * 100), R(km * 10000), R(km * 10), R(mtr + 100)].map(v => opt(dec(v) + ' m', v)), { explication: `1 km = 1 000 m, donc ${m(decL(km) + ' \\times 1\\,000 = ' + decL(mtr))} m.` }); },
    () => { const h = alea(1, 3), mn = aleaParmi([10, 15, 20, 30, 40, 45, 50]); const tot = h * 60 + mn; return qcm(`${h} h ${mn} min, c'est :`, opt(dec(tot) + ' min', tot), [h * 100 + mn, h * 60 + mn * 10, tot + 60, h * 60].map(v => opt(dec(v) + ' min', v)), { explication: `1 h = 60 min : ${m(h + ' \\times 60 + ' + mn + ' = ' + tot)} min (et non ${h * 100 + mn}).` }); },
    () => { const g = aleaParmi([3500, 250, 750, 1200, 4800, 80]); const kg = g / 1000; return qcm(`${dec(g)} g, c'est :`, opt(dec(kg) + ' kg', kg), [R(g / 100), R(g / 10), R(g / 10000), R(kg * 10)].filter(v => v !== kg).map(v => opt(dec(v) + ' kg', v)), { explication: `1 kg = 1 000 g, donc ${m(decL(g) + ' \\div 1\\,000 = ' + decL(kg))} kg.` }); },
    () => { const L = aleaParmi([0.75, 1.5, 0.33, 2.5, 0.2]); const cL = R(L * 100); return qcm(`${dec(L)} L, c'est :`, opt(dec(cL) + ' cL', cL), [R(L * 10), R(L * 1000), R(L * 10000), R(cL + 10)].map(v => opt(dec(v) + ' cL', v)), { explication: `1 L = 100 cL, donc ${m(decL(L) + ' \\times 100 = ' + decL(cL))} cL.` }); },
    () => { const mn = alea(1, 5), s = aleaParmi([10, 15, 20, 30, 40, 45]); const tot = mn * 60 + s; return qcm(`${mn} min ${s} s, c'est :`, opt(dec(tot) + ' s', tot), [mn * 100 + s, mn * 60 + s * 10, tot + 60, mn * 60].map(v => opt(dec(v) + ' s', v)), { explication: `1 min = 60 s : ${m(mn + ' \\times 60 + ' + s + ' = ' + tot)} s (et non ${mn * 100 + s}).` }); },
    () => { const cm = aleaParmi([150, 175, 45, 320, 68, 1250]); const mtr = cm / 100; return qcm(`${dec(cm)} cm, c'est :`, opt(dec(mtr) + ' m', mtr), [R(cm / 10), R(cm / 1000), R(cm * 10), R(mtr + 1)].map(v => opt(dec(v) + ' m', v)), { explication: `1 m = 100 cm, donc ${m(decL(cm) + ' \\div 100 = ' + decL(mtr))} m.` }); }
  ];
  const CONV_N2 = [
    // m² → cm² (piège : ×100)
    () => { const a = aleaParmi([2, 3, 0.5, 1.5, 4, 0.25, 12]); const cm2 = a * 10000; return qcm(`Une surface de ${dec(a)} m² mesure :`, opt(dec(cm2) + ' cm²', cm2), [R(a * 100), R(a * 1000), R(a * 100000), R(a * 10)].map(v => opt(dec(v) + ' cm²', v)), { explication: `1 m = 100 cm, donc 1 m² = 100 × 100 = 10 000 cm² : ${m(decL(a) + ' \\times 10\\,000 = ' + decL(cm2))} cm².` }); },
    // heures décimales → h min (piège : 2,5 h = 2 h 50)
    () => {
      const h = aleaParmi([0.25, 0.75, 1.25, 1.5, 2.5, 2.75, 3.2, 1.1, 0.4, 1.8]);
      const H = Math.floor(h), mn = Math.round((h - H) * 60);
      const hm = (HH, MM) => (HH ? HH + ' h ' : '') + MM + ' min';
      const txt = hm(H, mn);
      const faux = hm(H, Math.round((h - H) * 100)); // 2,5 h lu comme 2 h 50
      const candidats = [faux, hm(H, 60 - mn), hm(H, mn + 15), hm(H + 1, mn), hm(H, Math.round(mn / 2))].filter(t => t !== txt).map(t => opt(t, t));
      return qcm(`Une durée de ${dec(h)} h, c'est :`, opt(txt, txt), candidats, { explication: `La partie décimale ${m(decL(h - H))} h vaut ${m(decL(h - H) + ' \\times 60 = ' + mn)} min (une heure fait 60 min, pas 100) : ${txt}, et non ${faux}.` });
    },
    // km/h → m/s
    () => { const v = aleaParmi([36, 54, 72, 90, 108, 18, 126]); const ms = v / 3.6; return qcm(`Une vitesse de ${v} km/h correspond à :`, opt(dec(ms) + ' m/s', ms), [R(v / 60), R(v * 1000 / 60), R(v / 3.6 * 10), R(v * 3.6), R(v / 36)].filter(x => x !== ms && deuxDec(x)).map(x => opt(dec(x) + ' m/s', x)), { explication: `${v} km/h = ${dec(v * 1000)} m en 3 600 s : ${m('\\dfrac{' + decL(v * 1000) + '}{3\\,600} = ' + decL(ms))} m/s (diviser par 3,6).` }); },
    // joules → kWh avec donnée (sujet zéro)
    () => { const kwh = aleaParmi([0.5, 2, 2.5, 1.5, 0.25]); const J = R(kwh * 3.6); return qcm(`Un appareil a besoin d’une énergie de ${m(sciL(J, 6))} J pour fonctionner. Donnée : 1 kWh = ${m(sciL(3.6, 6))} J.<br>Cela correspond à :`, opt(dec(kwh) + ' kWh', kwh), [R(J * 3.6), R(J), R(kwh * 10), R(kwh / 10), R(J / 36)].filter(x => x !== kwh && deuxDec(x)).map(x => opt(dec(x) + ' kWh', x)), { explication: `On divise : ${m('\\dfrac{' + decL(J) + ' \\times 10^{6}}{3{,}6 \\times 10^{6}} = \\dfrac{' + decL(J) + '}{3{,}6} = ' + decL(kwh))} kWh.` }); },
    // mL → L / L → mL
    () => { const mL = aleaParmi([1500, 250, 330, 750, 2500, 50]); const L = mL / 1000; return qcm(`${dec(mL)} mL, c'est :`, opt(dec(L) + ' L', L), [R(mL / 100), R(mL / 10), R(mL / 10000), R(L * 10)].filter(x => x !== L).map(x => opt(dec(x) + ' L', x)), { explication: `1 L = 1 000 mL, donc ${m(decL(mL) + ' \\div 1\\,000 = ' + decL(L))} L.` }); },
    // tonnes → kg, quintal ?
    () => { const t = aleaParmi([2.5, 0.8, 1.2, 3.75, 0.05]); const kg = t * 1000; return qcm(`Un camion transporte ${dec(t)} tonnes de sable, soit :`, opt(dec(kg) + ' kg', kg), [R(t * 100), R(t * 10000), R(t * 10), R(kg + 100)].map(x => opt(dec(x) + ' kg', x)), { explication: `1 tonne = 1 000 kg : ${m(decL(t) + ' \\times 1\\,000 = ' + decL(kg))} kg.` }); },
    // minutes → heures décimales
    () => { const mn = aleaParmi([15, 45, 90, 150, 12, 36, 105]); const h = mn / 60; return qcm(`${mn} minutes, c'est :`, opt(dec(h) + ' h', h), [R(mn / 100), R(mn / 10), R(Math.floor(mn / 60) + (mn % 60) / 100), R(h * 10)].filter(x => x !== h && deuxDec(x)).map(x => opt(dec(x) + ' h', x)), { explication: `${m('\\dfrac{' + mn + '}{60} = ' + decL(h))} h (on divise par 60, pas par 100).` }); }
  ];
  // N3 : aires, volumes, débits, densités
  const CONV_N3 = [
    () => { const m3 = aleaParmi([1.2, 0.5, 2.5, 0.75, 3, 0.08]); const L = m3 * 1000; return qcm(`Un volume de ${dec(m3)} m³ d’eau représente :`, opt(dec(L) + ' L', L), [R(m3 * 100), R(m3 * 10), R(m3 * 1000000), R(m3 * 10000)].map(x => opt(dec(x) + ' L', x)), { explication: `1 m³ = 1 000 dm³ = 1 000 L, donc ${m(decL(m3) + ' \\times 1\\,000 = ' + decL(L))} L.` }); },
    () => { const ha = aleaParmi([4.5, 2, 0.8, 12, 0.25, 30]); const m2 = ha * 10000; return qcm(`Un champ de ${dec(ha)} hectares a une aire de :`, opt(dec(m2) + ' m²', m2), [R(ha * 100), R(ha * 1000), R(ha * 100000), R(ha * 1000000)].map(x => opt(dec(x) + ' m²', x)), { explication: `1 ha = 1 hm² = 100 m × 100 m = 10 000 m² : ${m(decL(ha) + ' \\times 10\\,000 = ' + decL(m2))} m².` }); },
    () => { const ms = aleaParmi([5, 10, 15, 20, 25, 30, 8]); const kmh = R(ms * 3.6); return qcm(`Un cycliste roule à ${ms} m/s, soit :`, opt(dec(kmh) + ' km/h', kmh), [R(ms / 3.6), R(ms * 60), R(ms * 36), R(ms * 3600 / 100), R(ms * 6)].filter(x => x !== kmh && deuxDec(x)).map(x => opt(dec(x) + ' km/h', x)), { explication: `${ms} m/s = ${dec(ms * 3600)} m par heure = ${m(decL(ms) + ' \\times 3{,}6 = ' + decL(kmh))} km/h.` }); },
    () => { const lpm = aleaParmi([5, 10, 12, 15, 20, 25, 30]); const m3h = R(lpm * 60 / 1000); return qcm(`Un robinet débite ${lpm} L/min, soit :`, opt(dec(m3h) + ' m³/h', m3h), [R(lpm * 60), R(lpm / 1000), R(lpm * 60 / 100), R(lpm * 6 / 1000), R(lpm / 60)].filter(x => x !== m3h && deuxDec(x * 100)).map(x => opt(dec(x) + ' m³/h', x)), { explication: `${lpm} L/min = ${dec(lpm * 60)} L/h = ${m(decL(lpm * 60) + ' \\div 1\\,000 = ' + decL(m3h))} m³/h.` }); },
    () => { const km2 = aleaParmi([2.5, 0.4, 12, 1.5, 0.06]); const m2 = km2 * 1000000; return qcm(`Une commune s’étend sur ${dec(km2)} km², soit :`, opt(m(sciL(km2, 6)) + ' m²', m2), [R(km2 * 1000), R(km2 * 10000), R(km2 * 100000), R(km2 * 100)].map(x => opt(dec(x) + ' m²', x)), { explication: `1 km = 1 000 m, donc 1 km² = 1 000² = ${m('10^6')} m² : ${m(decL(km2) + ' \\times 10^{6}')} m².` }); },
    () => { const hab = aleaParmi([50000, 20000, 120000, 8000, 300000]); const km2 = aleaParmi([25, 40, 50, 80, 100, 20, 10]); const d = R(hab / km2); if (!entier(d)) return null; return qcm(`Une ville de ${dec(hab)} habitants s’étend sur ${km2} km².<br>Sa densité de population est :`, opt(dec(d) + ' hab/km²', d), [R(hab * km2), R(km2 / hab * 1000000), R(d / 10), R(d * 10), R(hab / km2 / 2)].filter(x => x !== d && entier(x)).map(x => opt(dec(x) + ' hab/km²', x)), { explication: `Densité = nombre d'habitants par km² : ${m('\\dfrac{' + decL(hab) + '}{' + km2 + '} = ' + decL(d))} hab/km².` }); },
    () => { const cm3 = aleaParmi([250, 500, 1500, 330, 2000, 75]); const L = cm3 / 1000; return qcm(`Un récipient de ${dec(cm3)} cm³ a une contenance de :`, opt(dec(L) + ' L', L), [R(cm3 / 100), R(cm3 / 10), R(cm3 / 10000), R(cm3 / 100000)].filter(x => x !== L).map(x => opt(dec(x) + ' L', x)), { explication: `1 L = 1 dm³ = 1 000 cm³, donc ${m(decL(cm3) + ' \\div 1\\,000 = ' + decL(L))} L.` }); }
  ];
  function conversionsN3() { return aleaParmi(CONV_N3)(); }

  // N3 : comparer des parts exprimées différemment (fractions, pourcentages, reste)
  // verbe : forme au singulier et au pluriel, pour s'accorder avec la part qui précède
  //   « le quart des élèves vient » mais « les deux cinquièmes des élèves viennent »
  const PARTS_MELEES = [
    { intro: 'Lors d’une élection', sg: 'a voté pour', pl: 'ont voté pour', qui: ['A', 'B', 'C', 'D'], sujet: 'des électeurs', question: 'Le candidat ayant recueilli le moins de voix est :', questionMax: 'Le candidat ayant recueilli le plus de voix est :' },
    { intro: 'Dans un sondage sur les loisirs préférés', sg: 'a choisi', pl: 'ont choisi', qui: ['le cinéma', 'le sport', 'la lecture', 'la musique'], sujet: 'des personnes interrogées', question: 'Le loisir le moins choisi est :', questionMax: 'Le loisir le plus choisi est :' },
    { intro: 'Dans un lycée', sg: 'vient', pl: 'viennent', qui: ['à pied', 'à vélo', 'en bus', 'en voiture'], sujet: 'des élèves', question: 'Le mode de transport le moins utilisé est :', questionMax: 'Le mode de transport le plus utilisé est :' }
  ];
  // parts écrites tantôt en fraction, tantôt en pourcentage ; la quatrième est « le reste »
  const PART_FRACTIONS = [
    { txt: 'le quart', n: 1, d: 4 }, { txt: 'le tiers', n: 1, d: 3 }, { txt: 'la moitié', n: 1, d: 2 },
    { txt: 'le cinquième', n: 1, d: 5 }, { txt: 'le sixième', n: 1, d: 6 },
    { txt: 'les deux cinquièmes', n: 2, d: 5, pl: true }, { txt: 'les trois dixièmes', n: 3, d: 10, pl: true },
    { txt: 'le dixième', n: 1, d: 10 }, { txt: 'les deux neuvièmes', n: 2, d: 9, pl: true }
  ];
  function comparerParts() {
    const c = aleaParmi(PARTS_MELEES);
    for (let essai = 0; essai < 40; essai++) {
      const f1 = aleaParmi(PART_FRACTIONS);
      const f2 = aleaParmi(PART_FRACTIONS.filter(f => f.n / f.d !== f1.n / f1.d));
      const p = aleaParmi([10, 15, 20, 25, 30, 35]);
      // valeurs exactes sur 180 (multiple de 2,3,4,5,6,9,10) pour comparer sans arrondi
      const B = 180;
      const v = [f1.n * B / f1.d, p * B / 100, f2.n * B / f2.d];
      const reste = B - v[0] - v[1] - v[2];
      if (reste <= 0) continue;
      const toutes = v.concat([reste]);
      if (new Set(toutes).size !== 4) continue;                 // quatre parts distinctes
      const chercheMin = Math.random() < 0.5;
      const cible = chercheMin ? Math.min.apply(null, toutes) : Math.max.apply(null, toutes);
      const idx = toutes.indexOf(cible);
      const q = c.qui;
      const vb = pluriel => (pluriel ? c.pl : c.sg);
      // un pourcentage suivi d'un complément pluriel entraîne le verbe au pluriel
      const enonce = `${c.intro}, ${f1.txt} ${c.sujet} ${vb(f1.pl)} ${q[0]}, ${pct(p)} ${vb(true)} ${q[1]}, ${f2.txt} ${vb(f2.pl)} ${q[2]} et le reste ${vb(false)} ${q[3]}.<br>${chercheMin ? c.question : c.questionMax}`;
      const bonne = opt(q[idx], 'ok' + idx);
      const cands = q.map((nom, i) => opt(nom, 'x' + i)).filter((_, i) => i !== idx);
      const pourc = x => dec(O.arrondir(x / B * 100, 1));
      const detail = q.map((nom, i) => `${nom} : ${pourc(toutes[i])} %`).join(' · ');
      return qcm(enonce, bonne, cands, {
        explication: `On ramène tout à des pourcentages — ${m(fracL(f1.n, f1.d))} vaut ${pct(O.arrondir(f1.n / f1.d * 100, 1))}, ${m(fracL(f2.n, f2.d))} vaut ${pct(O.arrondir(f2.n / f2.d * 100, 1))}, et le reste est ce qui manque pour atteindre 100 %. Cela donne ${detail}. Le ${chercheMin ? 'plus petit' : 'plus grand'} est donc ${q[idx]}.`
      });
    }
    return null;
  }

  // =====================================================================
  // Famille D : ordres de grandeur
  // =====================================================================
  // options espacées d'un facteur 10, comme dans le sujet (5 / 50 / 500 / 5 000)
  function optionsPuissances(valeur, fmt) {
    const cand = [R(valeur / 100), R(valeur / 10), R(valeur * 10), R(valeur * 100), R(valeur * 1000)];
    return cand.map(v => opt(fmt ? fmt(v) : dec(v), v));
  }
  // arrondi à un chiffre significatif : 48 → 50, 3 200 → 3 000, 0,21 → 0,2
  function signif(x) {
    const p = Math.pow(10, Math.floor(Math.log10(Math.abs(x))));
    return R(Math.round(x / p) * p);
  }
  function ordreGrandeur(niveau) {
    const type = niveau === 1 ? aleaParmi(['quotient', 'produit', 'produit']) : aleaParmi(['quotient', 'quotient', 'produit', 'racine', 'somme']);
    if (type === 'quotient') {
      const rep = aleaParmi(niveau === 1 ? [10, 20, 50, 100, 200, 500] : [5, 20, 50, 200, 500, 2000, 0.5, 0.2]);
      const den = aleaParmi(niveau === 1 ? [48, 52, 21, 19, 98, 102, 4.9, 5.1, 31, 29] : [3200, 3100, 2900, 5100, 4900, 62, 58, 0.21, 0.19, 0.48, 0.52, 980, 1020]);
      const num = R(rep * den * (Math.random() < 0.5 ? 0.98 : 1.03));
      // numérateur affiché avec trois chiffres significatifs, jamais nul
      const p = Math.pow(10, Math.floor(Math.log10(num)) - 2);
      const numAff = R(Math.round(num / p) * p);
      if (numAff < 0.5 && rep < 1) return null;
      const enonce = `Parmi les réponses proposées, la valeur la plus proche de ${m('\\dfrac{' + decL(numAff) + '}{' + decL(den) + '}')} est :`;
      const expl = `${m(decL(numAff) + ' \\approx ' + decL(signif(numAff)))} et ${m(decL(den) + ' \\approx ' + decL(signif(den)))}, donc le quotient est proche de ${m('\\dfrac{' + decL(signif(numAff)) + '}{' + decL(signif(den)) + '} \\approx ' + decL(rep))}.`;
      return qcm(enonce, opt(dec(rep), rep), optionsPuissances(rep), { explication: expl });
    }
    if (type === 'produit') {
      const a = aleaParmi(niveau === 1 ? [19.8, 4.9, 3.1, 9.8, 51, 302, 2.05, 98] : [0.49, 0.051, 302, 1980, 0.0098, 4.97, 0.21, 29.7]);
      const b = aleaParmi(niveau === 1 ? [5.1, 20.2, 9.7, 3.02, 48, 11, 2.1] : [3.1, 0.198, 0.0051, 21, 39, 0.98, 4.02]);
      const exact = a * b;
      if (exact < 0.05 || exact > 5e6) return null; // reste lisible sans notation scientifique
      const ex = Math.pow(10, Math.floor(Math.log10(exact)));
      const mant = exact / ex;
      const rep = R((mant < 1.5 ? 1 : mant < 3.5 ? 2 : mant < 7.5 ? 5 : 10) * ex);
      const enonce = `Parmi les réponses proposées, la valeur la plus proche de ${m(decL(a) + ' \\times ' + decL(b))} est :`;
      const expl = `${m(decL(a) + ' \\approx ' + decL(signif(a)))} et ${m(decL(b) + ' \\approx ' + decL(signif(b)))} : ${m(decL(signif(a)) + ' \\times ' + decL(signif(b)) + ' = ' + decL(R(signif(a) * signif(b))))}, le produit est proche de ${m(decL(rep))}.`;
      return qcm(enonce, opt(dec(rep), rep), optionsPuissances(rep), { explication: expl });
    }
    if (type === 'racine') {
      const r = aleaParmi([3, 30, 300, 7, 70, 5, 50, 500, 9, 90]);
      const rad = R(r * r * (Math.random() < 0.5 ? 0.96 : 1.05));
      const radAff = rad >= 100 ? Math.round(rad) : O.arrondir(rad, 1);
      const enonce = `Parmi les réponses proposées, la valeur la plus proche de ${m('\\sqrt{' + decL(radAff) + '}')} est :`;
      const expl = `${m(decL(r) + '^2 = ' + decL(r * r))}, proche de ${m(decL(radAff))}, donc ${m('\\sqrt{' + decL(radAff) + '} \\approx ' + decL(r))}.`;
      return qcm(enonce, opt(dec(r), r), optionsPuissances(r).concat([opt(dec(R(r * 2)), 'd'), opt(dec(R(r / 2)), 'h')]), { explication: expl });
    }
    // somme de termes de tailles différentes
    const a = aleaParmi([2980, 5120, 9970, 19800, 49500]);
    const b = aleaParmi([12, 48, 105, 3.2, 0.5]);
    const c = aleaParmi([0.8, 2.5, 9.9, 24]);
    const rep = R(Math.round(a / 1000) * 1000);
    const enonce = `Parmi les réponses proposées, la valeur la plus proche de ${m(decL(a) + ' + ' + decL(b) + ' + ' + decL(c))} est :`;
    const expl = `Les deux derniers termes sont négligeables devant ${m(decL(a))} : la somme vaut environ ${m(decL(rep))}.`;
    return qcm(enonce, opt(dec(rep), rep), optionsPuissances(rep), { explication: expl });
  }

  // N3 : estimations concrètes en notation scientifique
  const ESTIMATIONS = [
    { q: 'Le nombre de secondes dans une année (365 jours) est proche de :', rep: [3, 7], expl: `${m('365 \\times 24 \\times 3\\,600 \\approx 3{,}15 \\times 10^{7}')} s.` },
    { q: 'Le cœur bat environ 70 fois par minute. Le nombre de battements en une journée est proche de :', rep: [1, 5], expl: `${m('70 \\times 60 \\times 24 = 100\\,800 \\approx 10^{5}')}.` },
    { q: 'Une feuille de papier a une épaisseur de 0,1 mm. Une pile de 500 feuilles mesure environ :', rep: [5, 0], unite: 'cm', expl: `${m('500 \\times 0{,}1 = 50')} mm = 5 cm.` },
    { q: 'La lumière parcourt 300 000 km par seconde. La distance Terre–Lune est de 384 000 km. La lumière met environ :', rep: [1.3, 0], unite: 's', expl: `${m('384\\,000 \\div 300\\,000 \\approx 1{,}3')} s.` },
    { q: 'La France compte environ 68 millions d’habitants pour 550 000 km². Sa densité de population est proche de :', rep: [1.2, 2], unite: 'hab/km²', expl: `${m('\\dfrac{68 \\times 10^{6}}{5{,}5 \\times 10^{5}} \\approx 124')} hab/km².` },
    { q: 'Un cheveu pousse d’environ 1 cm par mois. En 3 ans, il pousse d’environ :', rep: [3.6, 1], unite: 'cm', expl: `${m('3 \\times 12 = 36')} cm.` },
    { q: 'Un adulte boit environ 1,5 L d’eau par jour. En 60 ans, cela représente environ :', rep: [3.3, 4], unite: 'L', expl: `${m('1{,}5 \\times 365 \\times 60 \\approx 33\\,000 \\approx 3{,}3 \\times 10^{4}')} L.` },
    { q: 'La Terre a un rayon d’environ 6 400 km. La longueur de l’équateur est proche de :', rep: [4, 4], unite: 'km', expl: `${m('2 \\pi \\times 6\\,400 \\approx 40\\,000 = 4 \\times 10^{4}')} km.` },
    { q: 'Un être humain a environ 100 000 milliards de cellules. Ce nombre s’écrit :', rep: [1, 14], expl: `100 000 milliards = ${m('10^{5} \\times 10^{9} = 10^{14}')}.` },
    { q: 'Une voiture roule à 90 km/h. En 1 minute, elle parcourt environ :', rep: [1.5, 3], unite: 'm', expl: `${m('90\\,000 \\div 60 = 1\\,500')} m.` },
    { q: 'Un livre de 300 pages contient environ 40 lignes par page et 12 mots par ligne. Le nombre de mots est proche de :', rep: [1.4, 5], expl: `${m('300 \\times 40 \\times 12 = 144\\,000 \\approx 1{,}4 \\times 10^{5}')}.` },
    { q: 'La distance Terre–Soleil est d’environ 150 millions de km. En mètres, elle s’écrit :', rep: [1.5, 11], unite: 'm', expl: `150 millions de km = ${m('1{,}5 \\times 10^{8}')} km = ${m('1{,}5 \\times 10^{11}')} m.` },
    { q: 'Un grain de riz pèse environ 0,03 g. Un sac de 5 kg contient environ :', rep: [1.7, 5], unite: 'grains', expl: `${m('5\\,000 \\div 0{,}03 \\approx 167\\,000 \\approx 1{,}7 \\times 10^{5}')} grains.` },
    { q: 'Un robinet qui goutte perd 5 mL par minute. En un an, il perd environ :', rep: [2.6, 3], unite: 'L', expl: `${m('5 \\times 60 \\times 24 \\times 365 \\approx 2{,}6 \\times 10^{6}')} mL, soit ${m('2{,}6 \\times 10^{3}')} L.` }
  ];
  function estimation() {
    const e = aleaParmi(ESTIMATIONS);
    const [mant, exp] = e.rep;
    const u = e.unite ? ' ' + e.unite : '';
    const aff = (mm, ee) => m(sciL(mm, ee)) + u;
    const bonne = opt(aff(mant, exp), mant + 'e' + exp);
    const candidats = [[mant, exp + 1], [mant, exp - 1], [mant, exp + 2], [mant, exp - 2], [mant * 2, exp], [mant, exp + 3]]
      .filter(([mm, ee]) => ee >= -1).map(([mm, ee]) => opt(aff(R(mm), ee), R(mm) + 'e' + ee));
    return qcm(e.q, bonne, candidats, { explication: e.expl });
  }

  // =====================================================================
  Automatismes.enregistrerBanque('proportions', {
    titre: 'Proportions et ordres de grandeur',
    familles: {
      'conversions': famille({ nom: 'conversions d’unités', niveaux: [1, 2, 3], base: conversions, variantes3: [conversionsN3], ordre: { 1: 1, 2: 1 } }),
      'ordre-grandeur': famille({ nom: 'ordre de grandeur', niveaux: [1, 2, 3], base: ordreGrandeur, variantes3: [estimation], partBase3: 0.3, ordre: { 1: 3, 2: 2 }, quota: { 2: { max: 2 } } }),
      'proportionnalite': famille({ nom: 'proportionnalité', niveaux: [1, 2, 3], base: n => (n === 2 && Math.random() < 0.6 ? debitVitesse(n) : proportionnalite(n)), variantes3: [proportionnaliteInverse, echelle, meilleurPrix, () => debitVitesse(3)], ordre: { 1: 2, 2: 3 } }),
      'retrouver-total': famille({ nom: 'retrouver le total', niveaux: [1, 2, 3], base: retrouverTotal, variantes3: [totalDeuxParts, totalPartDePart, totalFractionReste], partBase3: 0.25, ordre: { 1: 4, 2: 4 }, quota: { 1: { min: 1 }, 2: { min: 1, priorite: 2 }, 3: { min: 1 } } }),
      'comparer-parts': famille({ nom: 'comparer des parts', niveaux: [3], base: () => null, variantes3: [comparerParts] })
    }
  });
})();
