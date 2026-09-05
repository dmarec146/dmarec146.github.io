/* Banque 01 — Pourcentages et évolutions

   Niveau 1 — les bases (trois familles seulement) : pourcentage d'une valeur,
              nouvelle valeur après UNE hausse ou baisse, taux d'évolution.
   Niveau 2 — le niveau de l'épreuve : coefficient ↔ taux, deux évolutions
              successives, coefficient réciproque, etc.
   Niveau 3 — bien plus difficile : trois évolutions, aires et volumes quand une
              dimension varie, réciproque après deux évolutions, problèmes inverses,
              TVA, remises en cascade, pièges de formulation, fractions…

   Les contextes sont tirés dans un large pool (loyer, population, abonnés,
   récolte, visiteurs, consommation d'eau…) pour éviter la répétition. */
(function () {
  'use strict';
  const O = Automatismes.outils;
  const { alea, aleaParmi, dec, decL, pct, euros, fracL, m, qcm } = O;
  const R = v => O.arrondir(v, 6);
  const entier = v => Number.isInteger(R(v));
  const deuxDec = v => Number.isInteger(R(v * 100));
  const unDec = v => Number.isInteger(R(v * 10));

  // ---------------------------------------------------------------------
  // Contextes d'évolution d'une grandeur
  //   maj / ref / genre : « Le loyer d’un appartement » / « ce loyer » / m
  //   intro(v) : phrase de départ ; sujet : « Ce loyer » ; question : « Le nouveau loyer est : »
  //   fmt : format avec unité ; valeurs : ordres de grandeur plausibles
  // ---------------------------------------------------------------------
  const hab = v => dec(v) + ' habitants';
  const CTX = [
    { maj: 'Le prix d’un vélo', ref: 'ce prix', genre: 'm', intro: v => `Un vélo coûte ${euros(v)}.`, sujet: 'Son prix', question: 'Son nouveau prix est :', fmt: euros, valeurs: [200, 250, 300, 400, 500, 600, 800, 1200] },
    { maj: 'Le loyer d’un appartement', ref: 'ce loyer', genre: 'm', intro: v => `Le loyer d’un appartement est de ${euros(v)} par mois.`, sujet: 'Ce loyer', question: 'Le nouveau loyer est :', fmt: euros, valeurs: [400, 500, 600, 640, 700, 750, 800, 900, 1000, 1200] },
    { maj: 'Le prix d’un billet de concert', ref: 'ce prix', genre: 'm', intro: v => `Un billet de concert coûte ${euros(v)}.`, sujet: 'Son prix', question: 'Son nouveau prix est :', fmt: euros, valeurs: [20, 25, 30, 40, 45, 50, 60, 80] },
    { maj: 'La population d’un village', ref: 'cette population', genre: 'f', intro: v => `Un village compte ${hab(v)}.`, sujet: 'Sa population', question: 'Sa nouvelle population est :', fmt: hab, valeurs: [250, 400, 500, 600, 800, 1000, 1200, 1500, 2000, 2500] },
    { maj: 'Le nombre d’abonnés d’une chaîne de vidéos', ref: 'ce nombre', genre: 'm', intro: v => `Une chaîne de vidéos compte ${dec(v)} abonnés.`, sujet: 'Ce nombre', question: 'Le nouveau nombre d’abonnés est :', fmt: v => dec(v) + ' abonnés', valeurs: [2000, 2500, 4000, 5000, 8000, 10000, 12000, 20000, 25000, 40000] },
    { maj: 'Le salaire mensuel d’une personne', ref: 'ce salaire', genre: 'm', intro: v => `Le salaire mensuel d’une personne est de ${euros(v)}.`, sujet: 'Ce salaire', question: 'Le nouveau salaire est :', fmt: euros, valeurs: [1200, 1500, 1600, 1800, 2000, 2400, 2500, 3000] },
    { maj: 'La facture annuelle d’électricité d’un foyer', ref: 'cette facture', genre: 'f', intro: v => `La facture annuelle d’électricité d’un foyer s’élève à ${euros(v)}.`, sujet: 'Cette facture', question: 'La nouvelle facture est :', fmt: euros, valeurs: [600, 800, 900, 1000, 1200, 1500] },
    { maj: 'Le prix d’un smartphone', ref: 'ce prix', genre: 'm', intro: v => `Un smartphone coûte ${euros(v)}.`, sujet: 'Son prix', question: 'Son nouveau prix est :', fmt: euros, valeurs: [200, 250, 300, 400, 500, 600, 800, 1000] },
    { maj: 'Le nombre mensuel de visiteurs d’un musée', ref: 'ce nombre', genre: 'm', intro: v => `En mars, un musée a accueilli ${dec(v)} visiteurs.`, sujet: 'En avril, ce nombre', question: 'Le nombre de visiteurs en avril est :', fmt: v => dec(v) + ' visiteurs', valeurs: [400, 500, 800, 1000, 1200, 1500, 2000, 2500, 3000, 4000] },
    { maj: 'La consommation d’eau mensuelle d’une commune', ref: 'cette consommation', genre: 'f', intro: v => `Une commune consomme ${dec(v)} m³ d’eau par mois.`, sujet: 'Cette consommation', question: 'La nouvelle consommation mensuelle est :', fmt: v => dec(v) + ' m³', valeurs: [2000, 2500, 4000, 5000, 8000, 10000] },
    { maj: 'Le nombre d’élèves d’un lycée', ref: 'ce nombre', genre: 'm', intro: v => `Un lycée compte ${dec(v)} élèves.`, sujet: 'Cet effectif', question: 'Le nouvel effectif est :', fmt: v => dec(v) + ' élèves', valeurs: [400, 500, 600, 800, 900, 1000, 1200, 1500] },
    { maj: 'La récolte de blé d’un agriculteur', ref: 'cette récolte', genre: 'f', intro: v => `Un agriculteur a récolté ${dec(v)} tonnes de blé cette année.`, sujet: 'L’an prochain, sa récolte', question: 'La récolte de l’an prochain sera de :', fmt: v => dec(v) + ' tonnes', valeurs: [20, 25, 40, 50, 60, 80, 100, 120, 150, 200] },
    { maj: 'Le nombre de licenciés d’un club de handball', ref: 'ce nombre', genre: 'm', intro: v => `Un club de handball compte ${dec(v)} licenciés.`, sujet: 'Ce nombre', question: 'Le nouveau nombre de licenciés est :', fmt: v => dec(v) + ' licenciés', valeurs: [40, 50, 60, 80, 120, 150, 200, 250, 300, 400] },
    { maj: 'Le chiffre d’affaires mensuel d’une boulangerie', ref: 'ce chiffre d’affaires', genre: 'm', intro: v => `Le chiffre d’affaires mensuel d’une boulangerie est de ${euros(v)}.`, sujet: 'Ce chiffre d’affaires', question: 'Le nouveau chiffre d’affaires est :', fmt: euros, valeurs: [2000, 2500, 4000, 5000, 8000, 10000, 12000, 15000, 20000] },
    { maj: 'Le prix d’un menu au restaurant', ref: 'ce prix', genre: 'm', intro: v => `Un menu au restaurant coûte ${euros(v)}.`, sujet: 'Son prix', question: 'Son nouveau prix est :', fmt: euros, valeurs: [12, 15, 16, 20, 24, 25, 30, 40] },
    { maj: 'La durée d’un trajet en bus', ref: 'cette durée', genre: 'f', intro: v => `Un trajet en bus dure ${dec(v)} minutes.`, sujet: 'Avec les travaux, sa durée', question: 'La nouvelle durée du trajet est :', fmt: v => dec(v) + ' min', valeurs: [20, 25, 30, 40, 45, 50, 60, 80, 90, 120] },
    { maj: 'Le nombre de jeux vidéo vendus par un magasin en un mois', ref: 'ce nombre', genre: 'm', intro: v => `Un magasin a vendu ${dec(v)} jeux vidéo en novembre.`, sujet: 'En décembre, ce nombre', question: 'Le nombre de jeux vendus en décembre est :', fmt: v => dec(v) + ' jeux', valeurs: [200, 250, 400, 500, 800, 1000, 1200] },
    { maj: 'La quantité de CO₂ émise chaque année par une usine', ref: 'cette quantité', genre: 'f', intro: v => `Une usine émet ${dec(v)} tonnes de CO₂ par an.`, sujet: 'Cette quantité', question: 'La nouvelle quantité annuelle est :', fmt: v => dec(v) + ' tonnes', valeurs: [500, 800, 1000, 1200, 1500, 2000, 2500, 4000] },
    { maj: 'Le nombre mensuel de téléchargements d’une application', ref: 'ce nombre', genre: 'm', intro: v => `Une application a été téléchargée ${dec(v)} fois en janvier.`, sujet: 'En février, ce nombre', question: 'Le nombre de téléchargements en février est :', fmt: v => dec(v) + ' téléchargements', valeurs: [5000, 8000, 10000, 12000, 20000, 25000, 40000, 50000] },
    { maj: 'Le prix d’une nuit d’hôtel', ref: 'ce prix', genre: 'm', intro: v => `Une nuit dans un hôtel coûte ${euros(v)}.`, sujet: 'En haute saison, son prix', question: 'Le prix en haute saison est :', fmt: euros, valeurs: [60, 80, 90, 100, 120, 150, 200] },
    { maj: 'La population d’une ville', ref: 'cette population', genre: 'f', intro: v => `Une ville compte ${hab(v)}.`, sujet: 'Sa population', question: 'Sa nouvelle population est :', fmt: hab, valeurs: [12000, 15000, 20000, 25000, 40000, 50000, 80000] },
    { maj: 'La production annuelle d’une installation solaire', ref: 'cette production', genre: 'f', intro: v => `Des panneaux solaires ont produit ${dec(v)} kWh l’an dernier.`, sujet: 'Cette année, leur production', question: 'La production de cette année est :', fmt: v => dec(v) + ' kWh', valeurs: [1500, 2000, 2500, 3000, 4000, 5000] },
    { maj: 'Le prix d’un jean', ref: 'ce prix', genre: 'm', intro: v => `Un jean coûte ${euros(v)}.`, sujet: 'Son prix', question: 'Son nouveau prix est :', fmt: euros, valeurs: [30, 40, 45, 50, 60, 80] },
    { maj: 'Le nombre de spectateurs d’un match', ref: 'ce nombre', genre: 'm', intro: v => `Un match a réuni ${dec(v)} spectateurs.`, sujet: 'Au match suivant, ce nombre', question: 'Le nombre de spectateurs au match suivant est :', fmt: v => dec(v) + ' spectateurs', valeurs: [4000, 5000, 8000, 10000, 12000, 15000, 20000] },
    { maj: 'Le temps d’écran quotidien d’un adolescent', ref: 'cette durée', genre: 'f', intro: v => `Un adolescent passe ${dec(v)} minutes par jour sur son téléphone.`, sujet: 'Cette durée', question: 'La nouvelle durée quotidienne est :', fmt: v => dec(v) + ' min', valeurs: [60, 90, 120, 150, 180, 240] }
  ];
  const ctxAlea = () => aleaParmi(CTX);
  // « passe de 400 à 420 » : pour un « nombre de … », on n'écrit pas l'unité deux fois
  const fmtPasse = c => (c.maj.startsWith('Le nombre') ? dec : c.fmt);
  // « le loyer d’un appartement » en milieu de phrase
  const minuscule = s => s.charAt(0).toLowerCase() + s.slice(1);
  const participe = (c, base) => base + (c.genre === 'f' ? 'e' : '');

  // Contextes « part d'un tout » (pourcentage d'une valeur)
  const PARTS = [
    { intro: n => `Dans un lycée de ${dec(n)} élèves`, part: 'sont demi-pensionnaires', question: 'Le nombre d’élèves demi-pensionnaires est :', fmt: v => dec(v) + ' élèves', valeurs: [200, 300, 400, 500, 600, 800, 1000, 1200] },
    { intro: n => `Dans une classe de ${dec(n)} élèves`, part: 'étudient l’allemand', question: 'Le nombre d’élèves qui étudient l’allemand est :', fmt: v => dec(v) + ' élèves', valeurs: [20, 24, 25, 30, 32, 35, 36, 40] },
    { intro: n => `Dans un club de judo de ${dec(n)} licenciés`, part: 'sont mineurs', question: 'Le nombre de licenciés mineurs est :', fmt: v => dec(v) + ' licenciés', valeurs: [40, 50, 60, 80, 120, 150, 200, 250] },
    { intro: n => `Dans un village de ${dec(n)} habitants`, part: 'ont moins de 20 ans', question: 'Le nombre d’habitants de moins de 20 ans est :', fmt: hab, valeurs: [400, 500, 600, 800, 1000, 1200, 1500, 2000] },
    { intro: n => `Lors d’un sondage auprès de ${dec(n)} personnes`, part: 'se déclarent favorables au projet', question: 'Le nombre de personnes favorables est :', fmt: v => dec(v) + ' personnes', valeurs: [200, 250, 400, 500, 800, 1000, 1200, 2000] },
    { intro: n => `Dans un stock de ${dec(n)} articles`, part: 'sont défectueux', question: 'Le nombre d’articles défectueux est :', fmt: v => dec(v) + ' articles', valeurs: [50, 80, 100, 120, 150, 200, 250, 400, 500] },
    { intro: n => `Dans un parking de ${dec(n)} places`, part: 'sont occupées', question: 'Le nombre de places occupées est :', fmt: v => dec(v) + ' places', valeurs: [40, 50, 60, 80, 100, 120, 150, 200, 240] },
    { intro: n => `Dans une bibliothèque de ${dec(n)} livres`, part: 'sont des romans', question: 'Le nombre de romans est :', fmt: v => dec(v) + ' livres', valeurs: [500, 800, 1000, 1200, 1500, 2000, 2500, 4000] },
    { intro: n => `Sur un budget mensuel de ${euros(n)}`, part: 'sont consacrés aux loisirs', question: 'La somme consacrée aux loisirs est :', fmt: euros, valeurs: [800, 1000, 1200, 1500, 1600, 2000, 2400, 3000] },
    { intro: n => `Dans un verger de ${dec(n)} arbres`, part: 'sont des pommiers', question: 'Le nombre de pommiers est :', fmt: v => dec(v) + ' arbres', valeurs: [40, 50, 60, 80, 120, 150, 200, 250] },
    { intro: n => `Dans un réservoir de ${dec(n)} litres`, part: 'ont déjà été utilisés', question: 'Le volume déjà utilisé est :', fmt: v => dec(v) + ' L', valeurs: [200, 250, 400, 500, 800, 1000, 1500, 2000] },
    { intro: n => `Sur une commande de ${dec(n)} pizzas`, part: 'sont végétariennes', question: 'Le nombre de pizzas végétariennes est :', fmt: v => dec(v) + ' pizzas', valeurs: [20, 25, 40, 50, 60, 80] },
    { intro: n => `Dans une entreprise de ${dec(n)} salariés`, part: 'travaillent à temps partiel', question: 'Le nombre de salariés à temps partiel est :', fmt: v => dec(v) + ' salariés', valeurs: [40, 50, 60, 80, 100, 120, 150, 200, 250, 400] },
    { intro: n => `Sur un trajet de ${dec(n)} km`, part: 'ont déjà été parcourus', question: 'La distance déjà parcourue est :', fmt: v => dec(v) + ' km', valeurs: [40, 50, 60, 80, 120, 150, 200, 250, 300, 400, 500] },
    { intro: n => `Sur les ${dec(n)} billets d’un concert`, part: 'ont été vendus en ligne', question: 'Le nombre de billets vendus en ligne est :', fmt: v => dec(v) + ' billets', valeurs: [400, 500, 800, 1000, 1200, 1500, 2000, 2500] }
  ];

  function evolutionTexte(t) {
    if (t === 0) return 'aucune évolution (retour à la valeur initiale)';
    return (t > 0 ? 'une hausse de ' : 'une baisse de ') + pct(Math.abs(t));
  }
  const signe = v => (v > 0 ? '+' : '−') + pct(Math.abs(v));
  const evol = v => ({ affichage: evolutionTexte(v), cle: v });
  const hausseBaisse = t => (t > 0 ? 'une hausse' : 'une baisse') + ' de ' + pct(Math.abs(t));

  // famille = base (par niveau) + variantes propres au niveau 3
  //   partBase3 : proportion des tirages de niveau 3 qui utilisent la base (0 par défaut)
  //   quota : {niveau: {min, max}} — nombre de questions de cette famille dans une série de 10
  //   ordre : {niveau: rang} — rang de difficulté, utilisé pour trier la série aux niveaux 1 et 2
  function famille(o) {
    return {
      nom: o.nom, niveaux: o.niveaux, quota: o.quota, ordre: o.ordre,
      generer(niveau) {
        if (niveau === 3 && o.variantes3 && o.variantes3.length && Math.random() >= (o.partBase3 || 0)) return aleaParmi(o.variantes3)();
        return o.base(niveau);
      }
    };
  }

  // =====================================================================
  // Famille A : pourcentage d'une valeur (niveaux 1-2 ; niveau 3 : variantes)
  // =====================================================================
  function pourcentageValeur(niveau) {
    const T = niveau === 1 ? [5, 10, 20, 25, 30, 40, 50, 75] : [5, 8, 12, 15, 24, 35, 45, 60, 65, 85, 2.5, 7.5, 12.5];
    const t = aleaParmi(T);
    const abstrait = Math.random() < 0.3;
    let n, enonce, fmt;
    if (abstrait) {
      n = aleaParmi(niveau === 1 ? [40, 50, 60, 80, 120, 150, 200, 300, 400, 500] : [48, 64, 90, 120, 160, 240, 360, 480, 640, 1200]);
      enonce = `${pct(t)} de ${dec(n)} est égal à :`;
      fmt = dec;
    } else {
      const c = aleaParmi(PARTS);
      n = aleaParmi(c.valeurs);
      enonce = `${c.intro(n)}, ${pct(t)} ${c.part}.<br>${c.question}`;
      fmt = c.fmt;
    }
    const v = R(n * t / 100);
    if (!entier(v)) return null;
    const bonne = { affichage: fmt(v), cle: v };
    const candidats = [n - v, R(n * t / 10), R(n * t / 1000), n - t, t, R(n / t), n + v]
      .filter(x => x > 0 && x !== v && entier(x)).map(x => ({ affichage: fmt(x), cle: x }));
    const expl = `${pct(t)} de ${dec(n)}, c'est ${m(decL(n) + ' \\times \\dfrac{' + decL(t) + '}{100} = ' + decL(n) + ' \\times ' + decL(t / 100) + ' = ' + decL(v))}.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N3-a : pourcentage d'un pourcentage
  const PCT_PCT = [[30, 40], [20, 50], [25, 40], [60, 25], [50, 30], [40, 45], [75, 20], [80, 25], [30, 30], [60, 60], [40, 40], [90, 50], [25, 25], [70, 10], [15, 20]];
  const PCT_PCT_CTX = [
    { a: 'des élèves sont en première', b: 'suivent la spécialité mathématiques', q: 'La part des élèves de première qui suivent la spécialité mathématiques, parmi tous les élèves du lycée, est :', intro: 'Dans un lycée,' },
    { a: 'des habitants ont moins de 30 ans', b: 'sont étudiants', q: 'La part des étudiants de moins de 30 ans dans la population de la ville est :', intro: 'Dans une ville,' },
    { a: 'des clients achètent en ligne', b: 'se font livrer à domicile', q: 'La part des clients livrés à domicile parmi tous les clients est :', intro: 'Dans un magasin,' },
    { a: 'des salariés sont des cadres', b: 'travaillent au siège', q: 'La part des cadres travaillant au siège parmi tous les salariés est :', intro: 'Dans une entreprise,' },
    { a: 'des adhérents sont des femmes', b: 'ont plus de 40 ans', q: 'La part des femmes de plus de 40 ans parmi tous les adhérents est :', intro: 'Dans un club de tennis,' },
    { a: 'des passagers voyagent en première classe', b: 'ont réservé un repas', q: 'La part des passagers de première classe ayant réservé un repas, parmi tous les passagers, est :', intro: 'Dans un train,' }
  ];
  function pourcentageDePourcentage() {
    const [a, b] = aleaParmi(PCT_PCT);
    const c = aleaParmi(PCT_PCT_CTX);
    const v = R(a * b / 100);
    if (!deuxDec(v)) return null;
    const enonce = `${c.intro} ${pct(a)} ${c.a} ; parmi ceux-ci, ${pct(b)} ${c.b}.<br>${c.q}`;
    const bonne = { affichage: pct(v), cle: v };
    const candidats = [a + b, Math.abs(a - b), b, a, R((a + b) / 2), R(v * 10), R(a * b / 10)]
      .filter(x => x > 0 && x <= 100 && deuxDec(x)).map(x => ({ affichage: pct(x), cle: x }));
    const expl = `On prend ${pct(b)} de ${pct(a)} : ${m(decL(a / 100) + ' \\times ' + decL(b / 100) + ' = ' + decL(v / 100))}, soit ${pct(v)} du total. Les deux pourcentages se multiplient, ils ne s'additionnent pas.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N3-b : « quel pourcentage représente… » (part / tout)
  const PROPORTIONS = [[60, 240], [45, 180], [36, 120], [150, 600], [27, 90], [14, 56], [48, 320], [72, 400], [33, 132], [9, 45], [105, 700], [16, 64], [39, 52], [7, 28], [6, 48], [18, 144], [21, 84], [51, 68], [12, 96], [90, 360]];
  const PROP_CTX = [
    { phrase: (p, n) => `Sur les ${dec(n)} élèves d’un lycée, ${dec(p)} mangent à la cantine.`, q: 'La proportion d’élèves qui mangent à la cantine est :' },
    { phrase: (p, n) => `Une équipe a gagné ${dec(p)} de ses ${dec(n)} matchs.`, q: 'Le pourcentage de matchs gagnés est :' },
    { phrase: (p, n) => `Sur ${dec(n)} candidats à un concours, ${dec(p)} ont été admis.`, q: 'Le taux d’admission est :' },
    { phrase: (p, n) => `Dans un lot de ${dec(n)} ampoules, ${dec(p)} sont défectueuses.`, q: 'Le pourcentage d’ampoules défectueuses est :' },
    { phrase: (p, n) => `Un cycliste a parcouru ${dec(p)} km d’une étape de ${dec(n)} km.`, q: 'La part de l’étape déjà parcourue est :' },
    { phrase: (p, n) => `Sur ${dec(n)} places d’un train, ${dec(p)} sont réservées.`, q: 'Le taux de réservation est :' }
  ];
  function proportionEnPourcentage() {
    const [p, n] = aleaParmi(PROPORTIONS);
    const c = aleaParmi(PROP_CTX);
    const t = R(p / n * 100);
    if (!deuxDec(t)) return null;
    const enonce = `${c.phrase(p, n)}<br>${c.q}`;
    const bonne = { affichage: pct(t), cle: t };
    const candidats = [100 - t, R(t / 10), R(n / p), R(t / 2), 2 * t, R(t * 10), p]
      .filter(x => x > 0 && x <= 100 && deuxDec(x)).map(x => ({ affichage: pct(x), cle: x }));
    const expl = `Proportion ${m('= \\dfrac{' + p + '}{' + n + '} = ' + decL(t / 100))}, soit ${pct(t)} (on peut simplifier : ${m('\\dfrac{' + p + '}{' + n + '} = ' + fracL(p, n))}).`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // =====================================================================
  // Famille B : appliquer une évolution (niveaux 1-2 ; niveau 3 : variantes)
  // =====================================================================
  function appliquerTaux(niveau) {
    const c = ctxAlea();
    const P = aleaParmi(c.valeurs);
    const t = aleaParmi(niveau === 1 ? [5, 10, 20, 25, 30, 40, 50, 75] : [5, 8, 10, 12, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75]);
    const variation = R(P * t / 100);
    if (!entier(variation)) return null;
    const hausse = Math.random() < 0.5;
    const nouveau = R(hausse ? P + variation : P - variation);
    const enonce = `${c.intro(P)} ${c.sujet} ${hausse ? 'augmente' : 'diminue'} de ${pct(t)}.<br>${c.question}`;
    const bonne = { affichage: c.fmt(nouveau), cle: nouveau };
    // erreurs types : ajouter/retirer le taux tel quel, ne garder que la variation, se tromper de sens
    const candidats = [
      R(hausse ? P + t : P - t), variation, R(hausse ? P - variation : P + variation),
      R(hausse ? P + 2 * variation : P - variation / 2), R(hausse ? P + variation / 10 : P - variation / 10), R(hausse ? P + t / 100 : P - t / 100)
    ].filter(v => v > 0 && v !== nouveau && deuxDec(v)).map(v => ({ affichage: c.fmt(v), cle: v }));
    const coef = R(hausse ? 1 + t / 100 : 1 - t / 100);
    const expl = `${m(decL(P) + ' \\times ' + decL(coef) + ' = ' + decL(nouveau))} (ou bien : ${pct(t)} de ${dec(P)} font ${dec(variation)}, que l'on ${hausse ? 'ajoute' : 'retranche'}).`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // =====================================================================
  // Famille B' : retrouver la valeur initiale (tous niveaux : une évolution aux
  // niveaux 1-2, deux évolutions au niveau 3 ; TVA à partir du niveau 2)
  // =====================================================================
  function valeurInitiale(niveau) {
    if (niveau >= 2 && Math.random() < 0.25) return appliquerTauxTVA(false);
    if (niveau === 3) return valeurInitialeDouble();
    return valeurInitialeSimple(niveau);
  }
  function valeurInitialeSimple(niveau) {
    const c = ctxAlea();
    const P0 = aleaParmi(c.valeurs);
    const t = aleaParmi(niveau === 1 ? [10, 20, 25, 50] : [5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75, 100]);
    const hausse = t >= 100 ? true : Math.random() < 0.5;
    const P1 = R(P0 * (hausse ? 1 + t / 100 : 1 - t / 100));
    if (!entier(P1)) return null;
    const enonce = `Après une ${hausse ? 'hausse' : 'baisse'} de ${pct(t)}, ${minuscule(c.maj)} est de ${c.fmt(P1)}.<br>Avant cette ${hausse ? 'hausse' : 'baisse'}, ${c.ref} était de :`;
    const bonne = { affichage: c.fmt(P0), cle: P0 };
    const sgn = hausse ? 1 : -1;
    const candidats = [R(P1 * (1 - sgn * t / 100)), R(P1 - sgn * t), R(P1 * (1 + sgn * t / 100)), R(P1 - sgn * P1 * t / 100 / 2), R(P1 + sgn * t)]
      .filter(v => v > 0 && deuxDec(v)).map(v => ({ affichage: c.fmt(v), cle: v }));
    const coef = R(hausse ? 1 + t / 100 : 1 - t / 100);
    const expl = `Valeur initiale ${m('\\times ' + decL(coef) + ' = ' + decL(P1))}, donc valeur initiale ${m('= \\dfrac{' + decL(P1) + '}{' + decL(coef) + '} = ' + decL(P0))}. On <b>divise</b> par le coefficient ; ${hausse ? 'retirer' : 'ajouter'} ${pct(t)} à ${dec(P1)} donnerait ${dec(R(P1 * (1 - sgn * t / 100)))}, ce qui est faux.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }
  // deux évolutions connues, valeur finale connue → valeur initiale
  const PAIRES_INIT = [[20, -50], [25, -20], [50, -20], [-20, 50], [-25, 20], [100, -40], [-50, 50], [60, -25], [25, 20], [20, 20], [-20, -20], [10, 10], [-10, -10], [-50, -20], [50, -50], [-20, 25], [20, -10], [-40, 25], [-25, -20], [30, -50]];
  function valeurInitialeDouble() {
    const c = ctxAlea();
    const P0 = aleaParmi(c.valeurs);
    const [a, b] = aleaParmi(PAIRES_INIT);
    const c1 = R(1 + a / 100), c2 = R(1 + b / 100), coef = R(c1 * c2);
    // coefficient global 1 : la valeur initiale serait égale à la valeur finale, question dégénérée
    if (coef === 1) return null;
    const P2 = R(P0 * coef);
    if (!entier(P2)) return null;
    const enonce = `Après ${hausseBaisse(a)} puis ${hausseBaisse(b)}, ${minuscule(c.maj)} est de ${c.fmt(P2)}.<br>Avant ces deux évolutions, ${c.ref} était de :`;
    const bonne = { affichage: c.fmt(P0), cle: P0 };
    const candidats = [R(P2 / c1), R(P2 / c2), R(P2 * coef), R(P2 / (1 + (a + b) / 100)), R(P2 * (1 - a / 100) * (1 - b / 100)), R(P2 - P2 * (a + b) / 100)]
      .filter(v => v > 0 && v !== P0 && deuxDec(v)).map(v => ({ affichage: c.fmt(v), cle: v }));
    const expl = `Coefficient global ${m(decL(c1) + ' \\times ' + decL(c2) + ' = ' + decL(coef))}. Valeur initiale ${m('= \\dfrac{' + decL(P2) + '}{' + decL(coef) + '} = ' + decL(P0))} : on divise la valeur finale par le produit des coefficients (ou on divise successivement par ${m(decL(c2))} puis par ${m(decL(c1))}).`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // TVA — hors taxes ↔ toutes taxes comprises (versTTC : true = appliquer, false = retrouver le HT)
  const OBJETS_TVA = ['un ordinateur portable', 'une paire de baskets', 'un canapé', 'une machine à laver', 'un vélo électrique', 'un abonnement annuel à une salle de sport', 'une prestation de plombier', 'un billet d’avion'];
  function appliquerTauxTVA(versTTC) {
    const tva = aleaParmi([20, 20, 10, 5.5]);
    const HT = aleaParmi([50, 80, 100, 120, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1200, 2000]);
    const TTC = R(HT * (1 + tva / 100));
    if (!entier(TTC)) return null;
    const objet = aleaParmi(OBJETS_TVA);
    if (versTTC === undefined) versTTC = Math.random() < 0.5;
    let enonce, bonne, candidats, expl;
    if (versTTC) {
      enonce = `Le prix hors taxes (HT) d’${objet} est ${euros(HT)}. La TVA est de ${pct(tva)}.<br>Son prix toutes taxes comprises (TTC) est :`;
      bonne = { affichage: euros(TTC), cle: TTC };
      candidats = [R(HT + tva), R(HT * tva / 100), R(HT * (1 - tva / 100)), R(HT + tva / 10), R(HT * (1 + tva / 1000))].filter(v => v > 0 && deuxDec(v)).map(v => ({ affichage: euros(v), cle: v }));
      expl = `Prix TTC ${m('= ' + decL(HT) + ' \\times ' + decL(1 + tva / 100) + ' = ' + decL(TTC))} : la TVA s'ajoute au prix HT.`;
    } else {
      enonce = `Le prix toutes taxes comprises (TTC) d’${objet} est ${euros(TTC)}, avec une TVA de ${pct(tva)}.<br>Son prix hors taxes (HT) est :`;
      bonne = { affichage: euros(HT), cle: HT };
      candidats = [R(TTC * (1 - tva / 100)), R(TTC - tva), R(TTC * (1 + tva / 100)), R(TTC - TTC * tva / 100 / 2), R(TTC * tva / 100)].filter(v => v > 0 && deuxDec(v)).map(v => ({ affichage: euros(v), cle: v }));
      expl = `Prix HT ${m('\\times ' + decL(1 + tva / 100) + ' = ' + decL(TTC))}, donc prix HT ${m('= \\dfrac{' + decL(TTC) + '}{' + decL(1 + tva / 100) + '} = ' + decL(HT))}. Retirer ${pct(tva)} du prix TTC (${euros(R(TTC * (1 - tva / 100)))}) est faux : la TVA a été calculée sur le prix HT, pas sur le prix TTC.`;
    }
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N3-c : remises en cascade (soldes puis remise supplémentaire en caisse)
  const OBJETS_SOLDES = [{ t: 'un manteau' }, { t: 'une paire de chaussures', f: true }, { t: 'un sac à dos' }, { t: 'une valise', f: true }, { t: 'un casque audio' }, { t: 'une robe', f: true }, { t: 'une raquette de tennis', f: true }, { t: 'un blouson' }];
  function appliquerTauxCascade() {
    const P = aleaParmi([40, 50, 60, 80, 100, 120, 150, 200, 250, 300, 400, 500]);
    const r1 = aleaParmi([20, 25, 30, 40, 50]);
    const r2 = aleaParmi([10, 20, 25, 50]);
    const final = R(P * (1 - r1 / 100) * (1 - r2 / 100));
    if (!deuxDec(final)) return null;
    const objet = aleaParmi(OBJETS_SOLDES);
    const e = objet.f ? 'e' : '';
    const enonce = `Pendant les soldes, ${objet.t} affiché${e} ${euros(P)} est remisé${e} de ${pct(r1)}. En caisse, une remise supplémentaire de ${pct(r2)} est appliquée sur le prix déjà remisé.<br>Le prix payé est :`;
    const bonne = { affichage: euros(final), cle: final };
    const candidats = [R(P * (1 - (r1 + r2) / 100)), R(P * (1 - r1 / 100) - r2), R(P * (1 - r1 / 100)), R(P * (1 - r1 / 100) * (1 + r2 / 100)), R(P * (1 - r1 / 100) - P * r2 / 100)]
      .filter(v => v > 0 && deuxDec(v)).map(v => ({ affichage: euros(v), cle: v }));
    const expl = `${m(decL(P) + ' \\times ' + decL(1 - r1 / 100) + ' \\times ' + decL(1 - r2 / 100) + ' = ' + decL(final))}. Les deux remises ne s'additionnent pas (${pct(r1)} puis ${pct(r2)} ≠ ${pct(r1 + r2)}) : la seconde porte sur un prix déjà réduit.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // =====================================================================
  // Famille C : calculer un taux d'évolution (niveaux 1-2 ; niveau 3 : variantes)
  // =====================================================================
  function questionTaux(enonce, V1, V2, t, explSupp) {
    const bonne = { affichage: signe(t), cle: t };
    const surFinal = R((V2 - V1) / V2 * 100);
    const rapport = R(V2 / V1 * 100);
    // la « différence brute lue comme un pourcentage » n'est un distracteur crédible que si elle reste
    // de l'ordre d'un pourcentage (le sujet de Métropole : 40 → 50 propose +10 %)
    const plausible = v => v !== 0 && Math.abs(v) <= Math.max(200, 2 * Math.abs(t));
    const bruts = [surFinal, R(V2 - V1), -t, rapport, R(t / 10), 2 * t].filter(plausible);
    const candidats = bruts.filter(unDec).concat(bruts.filter(v => !unDec(v)).map(v => O.arrondir(v, 1)))
      .map(v => ({ affichage: signe(v), cle: v }));
    const expl = `Taux d'évolution ${m('= \\dfrac{\\text{valeur finale} - \\text{valeur initiale}}{\\text{valeur initiale}} = \\dfrac{' + decL(V2) + ' - ' + decL(V1) + '}{' + decL(V1) + '} = \\dfrac{' + decL(R(V2 - V1)) + '}{' + decL(V1) + '} = ' + decL(t / 100))}, soit ${signe(t)}. On divise toujours par la valeur <b>initiale</b>.${explSupp ? ' ' + explSupp : ''}`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }
  function tauxEvolution(niveau) {
    const c = ctxAlea();
    const V1 = aleaParmi(c.valeurs);
    const T = niveau === 1 ? [10, 20, 25, 50, 100, 5, 30, 40, 75] : [5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75, 100, 150];
    const t = aleaParmi(T) * (Math.random() < 0.55 ? 1 : -1);
    if (t <= -100) return null;
    const V2 = R(V1 + V1 * t / 100);
    if (!entier(V2)) return null;
    const f = fmtPasse(c);
    const enonce = `${c.maj} passe de ${f(V1)} à ${f(V2)}.<br>Le taux d’évolution correspondant est :`;
    return questionTaux(enonce, V1, V2, t);
  }

  // N3-a : points de pourcentage ≠ pourcentage
  const POINTS = [[60, 75], [40, 50], [8, 10], [50, 60], [25, 30], [80, 60], [20, 25], [75, 60], [10, 12], [5, 6], [16, 20], [12, 15], [30, 33], [20, 22], [50, 40], [60, 45], [25, 20], [4, 5], [15, 12], [40, 30], [12, 9]];
  const CONTEXTES_TAUX = ['Le taux de réussite à un examen', 'Le taux de chômage d’une région', 'La part de marché d’une entreprise', 'Le taux de participation à une élection', 'La proportion d’élèves demi-pensionnaires d’un lycée', 'Le taux d’occupation d’un hôtel', 'La part des énergies renouvelables dans la production d’un pays'];
  function tauxPoints() {
    const [a, b] = aleaParmi(POINTS);
    const t = R((b - a) / a * 100);
    if (!entier(t)) return null;
    const ctx = aleaParmi(CONTEXTES_TAUX);
    const enonce = `${ctx} passe de ${pct(a)} à ${pct(b)}.<br>En pourcentage, ce taux a ${t > 0 ? 'augmenté' : 'diminué'} de :`;
    const bonne = { affichage: pct(Math.abs(t)), cle: Math.abs(t) };
    const candidats = [Math.abs(b - a), R(Math.abs(b - a) / b * 100), R(b / a * 100), R(Math.abs(t) / 10), Math.abs(t) + Math.abs(b - a)]
      .filter(v => v > 0 && unDec(v)).map(v => ({ affichage: pct(v), cle: v }));
    const expl = `Le taux ${t > 0 ? 'gagne' : 'perd'} ${Math.abs(b - a)} <b>points</b> de pourcentage, ce qui représente une variation relative de ${m('\\dfrac{' + (b - a) + '}{' + a + '} = ' + decL(t / 100))}, soit ${pct(Math.abs(t))}. « ${Math.abs(b - a)} points » et « ${pct(Math.abs(b - a))} » ne désignent pas la même chose.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N3-b : valeurs décimales
  function tauxDecimaux() {
    const V1 = aleaParmi([0.8, 1.6, 2.5, 12.5, 7.5, 0.25, 0.4, 3.2, 6.4, 0.75, 1.25, 4.5, 1.2, 0.6]);
    const t = aleaParmi([20, 25, 40, 50, 60, 75, 100, 150, 12.5, 37.5]) * (Math.random() < 0.55 ? 1 : -1);
    if (t <= -100) return null;
    const V2 = R(V1 * (1 + t / 100));
    if (!deuxDec(V2)) return null;
    const ctx = aleaParmi([
      `Le prix du litre d’essence passe de ${euros(V1)} à ${euros(V2)}.`,
      `Le cours d’une action passe de ${euros(V1)} à ${euros(V2)}.`,
      `La masse d’un colis passe de ${dec(V1)} kg à ${dec(V2)} kg.`,
      `Le prix du kilo de tomates passe de ${euros(V1)} à ${euros(V2)}.`,
      `Le temps de chargement d’une page web passe de ${dec(V1)} s à ${dec(V2)} s.`,
      `La hauteur d’une plante passe de ${dec(V1)} m à ${dec(V2)} m.`
    ]);
    return questionTaux(`${ctx}<br>Le taux d’évolution correspondant est :`, V1, V2, t);
  }

  // N3-c : aller-retour — le taux du retour n'est pas l'opposé du taux de l'aller
  const ALLER_RETOUR = [[40, 50], [80, 100], [100, 125], [20, 25], [200, 250], [100, 160], [40, 64], [200, 500], [50, 200], [25, 40], [100, 400], [16, 20], [32, 40], [60, 75], [10, 25], [400, 1000], [125, 200], [250, 400], [50, 100], [30, 60]];
  function tauxAllerRetour() {
    const [V1, V2] = aleaParmi(ALLER_RETOUR);
    const sujet = aleaParmi(['Le prix d’un article', 'Le cours d’une action', 'Le prix d’un abonnement', 'Le tarif d’une prestation', 'Le prix d’un livre', 'Le prix d’un panier de courses']);
    const aller = R((V2 - V1) / V1 * 100), retour = R((V1 - V2) / V2 * 100);
    if (!deuxDec(retour)) return null;
    const enonce = `${sujet} passe de ${euros(V1)} à ${euros(V2)}, ce qui est une hausse de ${pct(aller)}. Il revient ensuite de ${euros(V2)} à ${euros(V1)}.<br>Le taux d’évolution de ce retour est :`;
    const bonne = { affichage: signe(retour), cle: retour };
    const candidats = [-aller, R(retour / 2), R(-(V2 - V1)), R(-aller / 2), R(retour * 2), R(-100 * (V2 - V1) / V1 / 2)]
      .filter(v => v < 0 && v > -100 && deuxDec(v)).map(v => ({ affichage: signe(v), cle: v }));
    const expl = `Au retour, la valeur initiale est ${euros(V2)} : ${m('\\dfrac{' + decL(V1) + ' - ' + decL(V2) + '}{' + decL(V2) + '} = ' + decL(retour / 100))}, soit ${signe(retour)}. Une hausse de ${pct(aller)} n'est pas compensée par une baisse de ${pct(aller)}.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // =====================================================================
  // Famille D : du taux au coefficient (niveau 2 ; niveau 3 : variantes)
  // =====================================================================
  function tauxVersCoef() {
    const c = ctxAlea();
    const t = aleaParmi([5, 8, 10, 12, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 75, 80]);
    const hausse = Math.random() < 0.5;
    const coef = R(hausse ? 1 + t / 100 : 1 - t / 100);
    const enonce = `${c.maj} ${hausse ? 'augmente' : 'diminue'} de ${pct(t)}.<br>Cela signifie que ${c.ref} a été ${participe(c, 'multiplié')} par :`;
    const bonne = { affichage: m(decL(coef)), cle: coef };
    const oppose = R(hausse ? 1 - t / 100 : 1 + t / 100);
    const virgule = R(hausse ? 1 + t / 1000 : 1 - t / 1000);
    const candidats = [
      { affichage: m(decL(oppose)), cle: oppose },
      { affichage: m('\\dfrac{' + decL(t) + '}{100}'), cle: R(t / 100) },
      { affichage: m(decL(virgule)), cle: virgule },
      { affichage: m(decL(t)), cle: t },
      { affichage: m(decL(R(1 + t / 10))), cle: R(1 + t / 10) }
    ].filter(x => x.cle > 0);
    const expl = hausse
      ? `Augmenter de ${pct(t)}, c'est multiplier par ${m('1 + \\dfrac{' + decL(t) + '}{100} = ' + decL(coef))}.`
      : `Diminuer de ${pct(t)}, c'est multiplier par ${m('1 - \\dfrac{' + decL(t) + '}{100} = ' + decL(coef))}.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N3-a : taux décimal ou supérieur à 100 %
  function tauxVersCoefDur() {
    const c = ctxAlea();
    const t = aleaParmi([2.5, 4.5, 7.5, 12.5, 0.5, 1.5, 17.5, 37.5, 120, 150, 200, 250, 300]);
    const hausse = t >= 100 ? true : Math.random() < 0.5;
    const coef = R(hausse ? 1 + t / 100 : 1 - t / 100);
    const enonce = `${c.maj} ${hausse ? 'augmente' : 'diminue'} de ${pct(t)}.<br>Cela signifie que ${c.ref} a été ${participe(c, 'multiplié')} par :`;
    const bonne = { affichage: m(decL(coef)), cle: coef };
    const candidats = [R(hausse ? 1 - t / 100 : 1 + t / 100), R(t / 100), R(hausse ? 1 + t / 1000 : 1 - t / 1000), t, R(1 + t / 10), R(t / 10)]
      .filter(v => v > 0 && v !== coef).map(v => ({ affichage: v === R(t / 100) ? m('\\dfrac{' + decL(t) + '}{100}') : m(decL(v)), cle: v }));
    const expl = `${hausse ? 'Augmenter' : 'Diminuer'} de ${pct(t)}, c'est multiplier par ${m('1 ' + (hausse ? '+' : '-') + ' \\dfrac{' + decL(t) + '}{100} = ' + decL(coef))}${t >= 100 ? ' (une hausse de plus de 100 % fait plus que doubler)' : ''}.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N3-b : l'évolution est donnée par une fraction en toutes lettres
  const FRACTIONS_MOTS = [
    { txt: 'd’un quart', f: 0.25 }, { txt: 'd’un cinquième', f: 0.2 }, { txt: 'de moitié', f: 0.5 },
    { txt: 'des trois quarts', f: 0.75 }, { txt: 'des deux cinquièmes', f: 0.4 }, { txt: 'd’un huitième', f: 0.125 },
    { txt: 'd’un dixième', f: 0.1 }, { txt: 'des trois cinquièmes', f: 0.6 }, { txt: 'des trois huitièmes', f: 0.375 },
    { txt: 'd’un vingtième', f: 0.05 }, { txt: 'des quatre cinquièmes', f: 0.8 }
  ];
  function tauxVersCoefFraction() {
    const c = ctxAlea();
    const fr = aleaParmi(FRACTIONS_MOTS);
    const hausse = Math.random() < 0.5;
    const coef = R(hausse ? 1 + fr.f : 1 - fr.f);
    const enonce = `${c.maj} ${hausse ? 'augmente' : 'diminue'} ${fr.txt}.<br>Cela signifie que ${c.ref} a été ${participe(c, 'multiplié')} par :`;
    const bonne = { affichage: m(decL(coef)), cle: coef };
    const candidats = [R(hausse ? 1 - fr.f : 1 + fr.f), fr.f, R(1 / fr.f), R(hausse ? 1 + fr.f / 10 : 1 - fr.f / 10), R(hausse ? 1 + fr.f * 10 : 1 - fr.f * 10), R(hausse ? 2 - fr.f : fr.f + 0.1)]
      .filter(v => v > 0 && unDec(v * 100)).map(v => ({ affichage: m(decL(v)), cle: v }));
    const expl = `${hausse ? 'Augmenter' : 'Diminuer'} ${fr.txt}, c'est ${hausse ? 'ajouter' : 'retirer'} ${m(decL(fr.f))} fois la valeur : coefficient ${m('1 ' + (hausse ? '+' : '-') + ' ' + decL(fr.f) + ' = ' + decL(coef))}, soit ${evolutionTexte(R((coef - 1) * 100))}.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N3-c : « réduit à 35 % de sa valeur » / « porté à 130 % de sa valeur » (piège : « à » ≠ « de »)
  function tauxVersCoefReduitA() {
    const c = ctxAlea();
    const reduit = Math.random() < 0.5;
    const X = reduit ? aleaParmi([5, 20, 35, 40, 60, 65, 75, 85, 92, 95]) : aleaParmi([105, 110, 120, 130, 150, 175, 200, 250, 300]);
    const coef = R(X / 100);
    const enonce = `${c.maj} est ${participe(c, reduit ? 'réduit' : 'porté')} à ${pct(X)} de sa valeur initiale.<br>Cela signifie que ${c.ref} a été ${participe(c, 'multiplié')} par :`;
    const bonne = { affichage: m(decL(coef)), cle: coef };
    const candidats = [R(reduit ? 1 - X / 100 : 1 + X / 100), R(Math.abs(1 - X / 100)), R(X / 10), R(reduit ? 1 + X / 100 : X / 100 - 1), R(1 - X / 1000), R(1 + X / 1000)]
      .filter(v => v > 0).map(v => ({ affichage: m(decL(v)), cle: v }));
    const expl = `« ${reduit ? 'Réduit' : 'Porté'} <b>à</b> ${pct(X)} de sa valeur » : la nouvelle valeur <b>est</b> ${pct(X)} de l'ancienne, donc le coefficient est ${m('\\dfrac{' + X + '}{100} = ' + decL(coef))} (à ne pas confondre avec « ${reduit ? 'réduit' : 'augmenté'} <b>de</b> ${pct(X)} »).`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // =====================================================================
  // Famille E : du coefficient au taux (niveau 2 ; niveau 3 : variantes)
  // =====================================================================
  function coefVersTaux() {
    const hausse = Math.random() < 0.5;
    const k = aleaParmi(hausse ? [1.05, 1.08, 1.12, 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.5, 1.75, 2, 1.045, 1.125, 1.6] : [0.95, 0.92, 0.9, 0.85, 0.845, 0.8, 0.75, 0.7, 0.65, 0.6, 0.5, 0.4, 0.25, 0.955, 0.875, 0.3]);
    const t = R(Math.abs(k - 1) * 100);
    if (Math.random() < 0.5) {
      const c = ctxAlea();
      const enonce = `${c.maj} est ${participe(c, 'multiplié')} par ${m(decL(k))}.<br>Cela signifie que ${c.ref} a :`;
      const txt = (h, v) => (h ? 'augmenté de ' : 'baissé de ') + pct(v);
      const cle = (h, v) => (h ? '+' : '-') + v;
      const bonne = { affichage: txt(hausse, t), cle: cle(hausse, t) };
      const candidats = [[!hausse, t], [true, R(k * 100)], [hausse, R(t / 10)], [!hausse, R(k * 100)], [hausse, R(t * 10)], [hausse, R(k * 10)]]
        .filter(([h, v]) => v > 0 && (h || v <= 100)).map(([h, v]) => ({ affichage: txt(h, v), cle: cle(h, v) }));
      const expl = hausse
        ? `${m(decL(k) + ' = 1 + ' + decL(R(k - 1)))} : le coefficient dépasse 1 de ${m(decL(R(k - 1)))}, soit une hausse de ${pct(t)}.`
        : `${m(decL(k) + ' = 1 - ' + decL(R(1 - k)))} : il manque ${m(decL(R(1 - k)))} pour atteindre 1, soit une baisse de ${pct(t)}.`;
      return qcm(enonce, bonne, candidats, { explication: expl });
    }
    // schéma du sujet d'Asie 2026 (×0,6 → 4 % / 6 % / 40 % / 60 %)
    const enonce = `Multiplier un nombre par ${m(decL(k))} revient à ${hausse ? 'l’augmenter' : 'le diminuer'} de :`;
    const bonne = { affichage: pct(t), cle: t };
    const candidats = [R(k * 100), R(t / 10), R(k * 10), R(100 - t), R(t * 10), R(t / 100)]
      .filter(v => v > 0 && (hausse || v <= 100)).map(v => ({ affichage: pct(v), cle: v }));
    const expl = hausse
      ? `${m(decL(k) + ' = 1 + \\dfrac{' + decL(t) + '}{100}')}, donc c'est une augmentation de ${pct(t)}.`
      : `${m(decL(k) + ' = 1 - \\dfrac{' + decL(t) + '}{100}')}, donc c'est une diminution de ${pct(t)}.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N3-a : « a triplé », « a été divisé par 4 » (piège : tripler = +200 %, pas +300 %)
  const MULTIPLES = [
    { txt: 'a doublé', k: 2 }, { txt: 'a triplé', k: 3 }, { txt: 'a quadruplé', k: 4 }, { txt: 'a été multiplié~ par 10', k: 10 },
    { txt: 'a été divisé~ par 2', k: 0.5 }, { txt: 'a été divisé~ par 4', k: 0.25 }, { txt: 'a été divisé~ par 5', k: 0.2 },
    { txt: 'a été divisé~ par 8', k: 0.125 }, { txt: 'a été divisé~ par 10', k: 0.1 }, { txt: 'a été divisé~ par 1,25', k: 0.8 }, { txt: 'a été divisé~ par 2,5', k: 0.4 }
  ];
  function coefVersTauxMultiple() {
    const c = ctxAlea();
    const mu = aleaParmi(MULTIPLES);
    const k = mu.k, hausse = k > 1;
    const t = R((k - 1) * 100);
    const txt = mu.txt.replace(/~/g, c.genre === 'f' ? 'e' : '');
    const enonce = `${c.maj} ${txt}.<br>Le taux d’évolution de ${c.ref} est :`;
    const bonne = { affichage: signe(t), cle: t };
    const bruts = hausse
      ? [R(k * 100), -t, R(k * 10), R(t / 10), R(t * 10), R((k + 1) * 100)]
      : [R(-k * 100), -t, R(-100 / k), R(-1 / k), R(-t / 10), R(-(k + 1) * 100 / 2)];
    const candidats = bruts.filter(v => v !== 0 && v >= -100 && deuxDec(v)).map(v => ({ affichage: signe(v), cle: v }));
    const expl = hausse
      ? `Multiplier par ${m(decL(k))}, c'est un coefficient de ${m(decL(k) + ' = 1 + ' + decL(R(k - 1)))} : hausse de ${pct(t)} (et non ${pct(R(k * 100))} : « tripler », c'est ajouter deux fois la valeur, pas trois).`
      : `Diviser par ${m(decL(1 / k))}, c'est multiplier par ${m(decL(k))} ; le coefficient ${m(decL(k) + ' = 1 - ' + decL(R(1 - k)))} traduit une baisse de ${pct(R(-t))}.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N3-b : coefficient donné sous forme de fraction
  const FRAC_COEFS = [[3, 4], [5, 4], [7, 8], [9, 8], [6, 5], [4, 5], [3, 2], [5, 2], [1, 4], [21, 20], [19, 20], [11, 10], [13, 10], [5, 8], [1, 2], [3, 8], [7, 5], [8, 5], [1, 5], [9, 10], [3, 5], [11, 8], [17, 20]];
  function coefVersTauxFraction() {
    const c = ctxAlea();
    const [n, d] = aleaParmi(FRAC_COEFS);
    const k = n / d, hausse = k > 1;
    const t = R((k - 1) * 100);
    const enonce = `${c.maj} est ${participe(c, 'multiplié')} par ${m(fracL(n, d))}.<br>Cela signifie que ${c.ref} a :`;
    const txt = (h, v) => (h ? 'augmenté de ' : 'baissé de ') + pct(v);
    const cle = (h, v) => (h ? '+' : '-') + v;
    const at = Math.abs(t);
    const bonne = { affichage: txt(hausse, at), cle: cle(hausse, at) };
    const candidats = [[!hausse, at], [hausse, R(k * 100)], [!hausse, R(k * 100)], [hausse, Math.abs(n - d)], [!hausse, Math.abs(n - d)], [hausse, R(100 * Math.abs(d - n) / n)], [hausse, R(at / 10)]]
      .filter(([h, v]) => v > 0 && (h || v <= 100) && deuxDec(v)).map(([h, v]) => ({ affichage: txt(h, v), cle: cle(h, v) }));
    const expl = `${m(fracL(n, d) + ' = ' + decL(k))} ; le coefficient ${hausse ? 'dépasse 1 de' : 'est inférieur à 1 de'} ${m(decL(R(Math.abs(k - 1))))}, soit ${evolutionTexte(t)}.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N3-c : « représente désormais 85 % de sa valeur initiale »
  function coefVersTauxRepresente() {
    const c = ctxAlea();
    const X = aleaParmi([5, 20, 35, 40, 60, 65, 75, 85, 92, 95, 105, 110, 120, 130, 150, 175, 200, 250, 300]);
    const t = X - 100, hausse = t > 0;
    const enonce = `Après une évolution, ${minuscule(c.maj)} représente ${pct(X)} de sa valeur initiale.<br>Cela signifie que ${c.ref} a :`;
    const txt = (h, v) => (h ? 'augmenté de ' : 'baissé de ') + pct(v);
    const cle = (h, v) => (h ? '+' : '-') + v;
    const bonne = { affichage: txt(hausse, Math.abs(t)), cle: cle(hausse, Math.abs(t)) };
    const candidats = [[!hausse, Math.abs(t)], [true, X], [false, X], [hausse, X], [!hausse, R(X / 10)], [hausse, R(Math.abs(t) / 10)]]
      .filter(([h, v]) => v > 0 && (h || v <= 100)).map(([h, v]) => ({ affichage: txt(h, v), cle: cle(h, v) }));
    const expl = `La nouvelle valeur vaut ${m('\\dfrac{' + X + '}{100} = ' + decL(X / 100))} fois l'ancienne : coefficient ${m(decL(X / 100))}, soit ${evolutionTexte(t)}.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // =====================================================================
  // Famille F : évolutions successives (niveau 2 : deux ; niveau 3 : trois + variantes)
  // =====================================================================
  function evolutionsSuccessives(niveau) {
    const nbEtapes = niveau === 3 ? 3 : 2;
    const TX = { 1: [10, 20, 25, 50, 100], 2: [10, 20, 25, 30, 40, 50, 60, 75, 80, 100], 3: [10, 20, 25, 40, 50, 60, 100, 75, 30] }[niveau];
    let taux = null, g = 0;
    for (let essai = 0; essai < 80 && !taux; essai++) {
      const t = [];
      for (let i = 0; i < nbEtapes; i++) t.push(aleaParmi(TX) * (Math.random() < 0.5 ? 1 : -1));
      if (t.some(v => v <= -100)) continue;
      if (niveau === 1 && t[0] * t[1] > 0 && Math.random() < 0.7) continue; // niveau 1 : surtout une hausse et une baisse
      const coef = t.reduce((cc, v) => cc * (1 + v / 100), 1);
      const gg = R((coef - 1) * 100);
      if (Math.abs(gg) > 250) continue; // reste calculable de tête
      if (entier(gg) || (niveau === 3 && unDec(gg))) { taux = t; g = gg; }
    }
    if (!taux) return null;
    const somme = taux.reduce((s, v) => s + v, 0);
    const c = ctxAlea();
    const verbe = t => (t > 0 ? 'augmente' : 'diminue') + ' de ' + pct(Math.abs(t));
    let enonce;
    if (Math.random() < 0.5) {
      // formulation abstraite, comme dans le sujet des Centres étrangers
      const mot = (t, premier) => (t > 0 ? (premier ? 'Une hausse' : 'une hausse') : (premier ? 'Une baisse' : 'une baisse')) + ' de ' + pct(Math.abs(t));
      enonce = nbEtapes === 2
        ? `${mot(taux[0], true)} suivie d’${mot(taux[1], false)} correspond à :`
        : `${mot(taux[0], true)}, puis ${mot(taux[1], false)}, puis ${mot(taux[2], false)} correspondent au total à :`;
    } else {
      enonce = nbEtapes === 2
        ? `${c.maj} ${verbe(taux[0])}, puis ${verbe(taux[1])}.<br>Au total, ${c.ref} a subi :`
        : `${c.maj} ${verbe(taux[0])} la première année, ${verbe(taux[1])} la deuxième, puis ${verbe(taux[2])} la troisième.<br>Sur les trois années, ${c.ref} a subi :`;
    }
    const bonne = evol(g);
    const a = taux[0], b = taux[1];
    const bruts = [somme, -g, R(a * b / 100), -somme, a - b, b - a, taux.reduce((s, v) => s + Math.abs(v), 0), 2 * g, R(g / 2), R(somme / 2)];
    const candidats = bruts.filter(v => v >= -100 && unDec(v)).map(evol);
    const coefs = taux.map(v => decL(R(1 + v / 100))).join(' \\times ');
    const expl = `On multiplie les coefficients : ${m(coefs + ' = ' + decL(R(taux.reduce((cc, v) => cc * (1 + v / 100), 1))))}, soit ${evolutionTexte(g)}. Les taux ne s'additionnent pas.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N3-a : retrouver l'évolution manquante connaissant la première et le bilan global
  const MANQUANTES = [[20, -10], [25, -4], [50, -20], [-20, 50], [-25, 20], [100, -40], [-50, 50], [60, -25], [25, 20], [20, 20], [-20, -20], [10, 10], [-10, -10], [-50, -20], [150, -60], [-40, 25], [-60, 150]];
  function evolutionManquante() {
    const [a, b] = aleaParmi(MANQUANTES);
    const g = R(((1 + a / 100) * (1 + b / 100) - 1) * 100);
    if (!entier(g) || g === 0) return null;
    const c = ctxAlea();
    const enonce = `${c.maj} subit ${hausseBaisse(a)}, puis une seconde évolution. Au total, ${c.ref} a subi ${hausseBaisse(g)}.<br>La seconde évolution est :`;
    const bonne = evol(b);
    const candidats = [g - a, -(g - a), g, -b, a, R(b / 2), g + a].filter(v => v > -100 && v !== 0 && entier(v)).map(evol);
    const expl = `Coefficient global ${m(decL(1 + g / 100))}, premier coefficient ${m(decL(1 + a / 100))} : le second vaut ${m('\\dfrac{' + decL(1 + g / 100) + '}{' + decL(1 + a / 100) + '} = ' + decL(1 + b / 100))}, soit ${evolutionTexte(b)}. On divise les coefficients, on ne soustrait pas les taux (${signe(g)} − ${signe(a)} ≠ ${signe(b)}).`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N3-b : un même taux répété plusieurs années (piège : multiplier le taux par le nombre d'années)
  function tauxRepete() {
    const r = aleaParmi([10, 20, 50, 100, 5, 30, 40, -10, -20, -50, -30, -40]);
    const n = Math.random() < 0.7 ? 2 : 3;
    const coef = R(Math.pow(1 + r / 100, n));
    const g = R((coef - 1) * 100);
    if (!deuxDec(g)) return null;
    const c = ctxAlea();
    const enonce = `${c.maj} ${r > 0 ? 'augmente' : 'diminue'} de ${pct(Math.abs(r))} chaque année, pendant ${n} ans.<br>Sur l'ensemble de ces ${n} années, ${c.ref} a subi :`;
    const bonne = evol(g);
    const candidats = [n * r, r, R(n * r + (r > 0 ? 1 : -1)), R(coef * 100), R(g / n), R(-n * r), (n + 1) * r].filter(v => v > -100 && v !== 0 && deuxDec(v)).map(evol);
    const expl = `Coefficient ${m(decL(1 + r / 100) + '^{' + n + '} = ' + decL(coef))}, soit ${evolutionTexte(g)} — et non ${signe(n * r)} : chaque année, le taux s'applique à une valeur déjà modifiée.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N3-c : taux annuel moyen sur deux ans (racine carrée du coefficient global)
  const CARRES = [[21, 10], [44, 20], [69, 30], [96, 40], [125, 50], [300, 100], [-19, -10], [-36, -20], [-51, -30], [-64, -40], [-75, -50], [-84, -60]];
  function tauxMoyen() {
    const [g, r] = aleaParmi(CARRES);
    const c = ctxAlea();
    const enonce = `En deux ans, ${minuscule(c.maj)} a subi ${hausseBaisse(g)}, par deux évolutions annuelles de même taux.<br>Le taux de chaque évolution annuelle est :`;
    const bonne = evol(r);
    const candidats = [R(g / 2), g, R(g / 4), 2 * g, R(g / 2 + (g > 0 ? 1 : -1)), -r].filter(v => v > -100 && v !== 0 && deuxDec(v)).map(evol);
    const expl = `Coefficient global ${m(decL(1 + g / 100))} ; chaque année, le coefficient ${m('c')} vérifie ${m('c^2 = ' + decL(1 + g / 100))}, donc ${m('c = ' + decL(1 + r / 100))} : ${evolutionTexte(r)} par an, et non ${signe(g / 2)}.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // =====================================================================
  // Famille G : coefficient multiplicateur réciproque (niveau 2 ; niveau 3 : variantes)
  // =====================================================================
  // (comparerAvantApres est défini plus bas, juste avant l'enregistrement de la banque)
  const PAIRES = {
    2: [[1.25, 0.8], [2, 0.5], [0.8, 1.25], [0.5, 2], [4, 0.25], [0.25, 4], [1.6, 0.625], [0.625, 1.6], [2.5, 0.4], [0.4, 2.5], [5, 0.2], [0.2, 5]],
    3: [[1.6, 0.625], [0.625, 1.6], [2.5, 0.4], [0.4, 2.5], [5, 0.2], [0.2, 5], [8, 0.125], [0.125, 8], [3.2, 0.3125], [0.3125, 3.2], [6.25, 0.16], [0.16, 6.25], [4, 0.25], [0.25, 4]]
  };
  function reciproque(niveau) {
    const [k, kr] = aleaParmi(PAIRES[niveau] || PAIRES[2]);
    const t = R((k - 1) * 100), tr = R((kr - 1) * 100);
    if (!deuxDec(t * 100) || !deuxDec(tr * 100)) return null;
    if (Math.random() < 0.6) {
      const c = ctxAlea();
      const verbeAller = t > 0 ? 'augmenté' : 'baissé';
      const verbeRetour = c.genre === 'f' ? (tr > 0 ? 'l’augmenter' : 'la diminuer') : (tr > 0 ? 'l’augmenter' : 'le diminuer');
      const enonce = `${c.maj} a ${verbeAller} de ${pct(Math.abs(t))}.<br>Pour revenir à sa valeur initiale, il faut ${verbeRetour} de :`;
      const bonne = { affichage: pct(Math.abs(tr)), cle: Math.abs(tr) };
      const at = Math.abs(t), atr = Math.abs(tr);
      const candidats = [at, R(at / 2), R(2 * at), R(100 - at), R(atr / 2), R(2 * atr), R(100 - atr), R(at + atr)]
        .filter(v => v > 0 && (tr > 0 || v <= 100) && deuxDec(v)).map(v => ({ affichage: pct(v), cle: v }));
      const expl = `Le coefficient de l'évolution est ${m(decL(k))} ; le coefficient réciproque est ${m('\\dfrac{1}{' + decL(k) + '} = ' + decL(kr))}, soit ${evolutionTexte(tr)}. Le pourcentage de retour n'est pas le même que celui de l'aller.`;
      return qcm(enonce, bonne, candidats, { explication: expl });
    }
    const enonce = `Le coefficient multiplicateur réciproque de ${m(decL(k))} est :`;
    const bonne = { affichage: m(decL(kr)), cle: kr };
    const candidats = [R(2 - k), R(k - 1), k, R(Math.abs(1 - k)), R(1 + (kr - 1) * 2), R(kr / 2), R(k / 2)]
      .filter(v => v > 0 && deuxDec(v * 100)).map(v => ({ affichage: m(decL(v)), cle: v }));
    const expl = `Le coefficient réciproque est l'inverse : ${m('\\dfrac{1}{' + decL(k) + '} = ' + decL(kr))}. Multiplier par ${m(decL(k))} puis par ${m(decL(kr))} ramène à la valeur de départ.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N3-a : coefficient en fraction, réponses en fractions (l'inverse de n/d est d/n)
  const FRAC_RECIP = [[5, 4], [3, 2], [4, 5], [2, 3], [5, 2], [2, 5], [3, 4], [4, 3], [8, 5], [5, 8], [6, 5], [5, 6], [7, 4], [4, 7], [9, 8], [8, 9], [7, 5], [5, 7]];
  function reciproqueFraction() {
    const [n, d] = aleaParmi(FRAC_RECIP);
    const c = ctxAlea();
    const enonce = `${c.maj} a été ${participe(c, 'multiplié')} par ${m(fracL(n, d))}.<br>Pour retrouver sa valeur initiale, il faut ${c.genre === 'f' ? 'la' : 'le'} multiplier par :`;
    const bonne = { affichage: m(fracL(d, n)), cle: R(d / n) };
    const candidats = [[2 * d - n, d], [n, d], [Math.abs(n - d), d], [d, Math.abs(n - d)], [n, 2 * n - d], [d, 2 * d - n], [1, n]]
      .filter(([p, q]) => p > 0 && q > 0).map(([p, q]) => ({ affichage: m(fracL(p, q)), cle: R(p / q) }));
    const tAller = R(Math.abs(n - d) / d * 100), tRetour = R(Math.abs(n - d) / n * 100);
    const complement = (deuxDec(tAller) && deuxDec(tRetour))
      ? ` ${n > d ? 'Une hausse' : 'Une baisse'} de ${pct(tAller)} se compense par ${n > d ? 'une baisse' : 'une hausse'} de ${pct(tRetour)}, pas par ${n > d ? 'une baisse' : 'une hausse'} du même pourcentage.`
      : ` Multiplier par ${m(fracL(n, d))} puis par ${m(fracL(d, n))} ramène à la valeur de départ.`;
    const expl = `L'inverse de ${m(fracL(n, d))} est ${m(fracL(d, n))} : ${m(fracL(n, d) + ' \\times ' + fracL(d, n) + ' = 1')}.${complement}`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N3-b : compenser DEUX évolutions successives
  const DOUBLES = [[25, 60], [25, 100], [-20, -50], [-50, -50], [-20, -20], [25, 25], [100, 100], [60, 150], [-75, 100], [100, -75], [300, -50], [-50, 60], [60, -50], [25, -60], [-20, -37.5], [-20, 25], [100, -50], [25, -20], [-60, 150]];
  function reciproqueDouble() {
    const [a, b] = aleaParmi(DOUBLES);
    const coef = R((1 + a / 100) * (1 + b / 100));
    const tr = R((1 / coef - 1) * 100);
    if (!deuxDec(tr)) return null;
    const c = ctxAlea();
    const enonce = `${c.maj} subit ${hausseBaisse(a)}, puis ${hausseBaisse(b)}.<br>Pour que ${c.ref} revienne à sa valeur initiale, il faudrait ensuite lui appliquer :`;
    const bonne = evol(tr);
    const g = R((coef - 1) * 100);
    const candidats = [-(a + b), -g, -b, -a, R(-(a + b) / 2), R(-g / 2), a + b].filter(v => v > -100 && deuxDec(v)).map(evol);
    const expl = tr === 0
      ? `Coefficient global ${m(decL(1 + a / 100) + ' \\times ' + decL(1 + b / 100) + ' = 1')} : les deux évolutions se compensent déjà, la valeur est revenue à son niveau initial.`
      : `Coefficient global ${m(decL(1 + a / 100) + ' \\times ' + decL(1 + b / 100) + ' = ' + decL(coef))} ; le coefficient réciproque est ${m('\\dfrac{1}{' + decL(coef) + '} = ' + decL(1 / coef))}, soit ${evolutionTexte(tr)}.`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // N3 : comparer la valeur finale à la valeur initiale, sans la calculer
  // (une hausse puis une baisse de même taux ne ramène jamais au point de départ)
  function comparerAvantApres() {
    const memeTaux = Math.random() < 0.5;
    const a = aleaParmi([10, 15, 20, 25, 30, 40, 50]);
    const b = memeTaux ? a : aleaParmi([5, 10, 15, 20, 25, 30, 40, 50].filter(x => x !== a));
    const haussePuisBaisse = Math.random() < 0.5;
    const t1 = haussePuisBaisse ? a : -a;
    const t2 = haussePuisBaisse ? -b : b;
    const coef = R((1 + t1 / 100) * (1 + t2 / 100));
    if (coef === 1) return null;
    const c = aleaParmi(CTX.filter(x => x.fmt === euros));
    const Ref = c.ref.charAt(0).toUpperCase() + c.ref.slice(1);
    const enonce = `${c.maj} est ${participe(c, 'noté')} ${m('P')}. ${Ref} ${t1 > 0 ? 'augmente' : 'baisse'} de ${pct(Math.abs(t1))}, puis ${t2 > 0 ? 'augmente' : 'baisse'} de ${pct(Math.abs(t2))}. La valeur obtenue est notée ${m('P_1')}.<br>On peut affirmer que :`;
    const options = [
      { t: m('P < P_1'), k: '<' }, { t: m('P = P_1'), k: '=' },
      { t: m('P > P_1'), k: '>' }, { t: 'on ne peut pas savoir sans connaître ' + m('P'), k: '?' }
    ];
    const cle = coef > 1 ? '<' : '>';
    const bonne = options.find(o => o.k === cle);
    const expl = memeTaux
      ? `Coefficient global : ${m(decL(1 + t1 / 100) + ' \\times ' + decL(1 + t2 / 100) + ' = ' + decL(coef))}, strictement inférieur à 1, donc ${m('P_1 < P')}. Une hausse puis une baisse de même taux ne ramène jamais au prix de départ : la seconde évolution porte sur un montant différent de la première.`
      : `Coefficient global : ${m(decL(1 + t1 / 100) + ' \\times ' + decL(1 + t2 / 100) + ' = ' + decL(coef))}, ${coef > 1 ? 'supérieur' : 'inférieur'} à 1, donc ${m(coef > 1 ? 'P_1 > P' : 'P_1 < P')}. La réponse ne dépend pas de la valeur de ${m('P')}.`;
    return qcm(enonce, { affichage: bonne.t, cle: bonne.k },
      options.filter(o => o !== bonne).map(o => ({ affichage: o.t, cle: o.k })), {
      explication: expl, optionsLarges: true
    });
  }

  // =====================================================================
  // Famille H : aires et volumes quand une dimension varie (niveau 3 seulement)
  // =====================================================================
  // pl : sujet au pluriel (accord du verbe)
  const FIG_AIRE = [
    { txt: 'Le côté d’un carré', mesure: 'son aire', expl: 'l’aire d’un carré est proportionnelle au carré de son côté' },
    { txt: 'Le rayon d’un disque', mesure: 'son aire', expl: 'l’aire d’un disque est proportionnelle au carré de son rayon (πr²)' },
    { txt: 'Le rayon d’un cylindre (sa hauteur ne change pas)', mesure: 'son volume', expl: 'le volume d’un cylindre est proportionnel au carré de son rayon (πr²h)' },
    { txt: 'Les deux dimensions d’un rectangle', mesure: 'son aire', pl: true, expl: 'l’aire est le produit des deux dimensions, toutes deux multipliées par le même coefficient' },
    { txt: 'Les trois côtés d’un triangle', mesure: 'son aire', pl: true, expl: 'dans un agrandissement ou une réduction de rapport k, les aires sont multipliées par k²' },
    { txt: 'L’arête d’un cube', mesure: 'son aire totale', expl: 'l’aire totale d’un cube vaut 6 fois le carré de son arête, elle est donc proportionnelle au carré de l’arête' }
  ];
  const FIG_VOL = [
    { txt: 'L’arête d’un cube', mesure: 'son volume', expl: 'le volume d’un cube est proportionnel au cube de son arête' },
    { txt: 'Le rayon d’une boule', mesure: 'son volume', expl: 'le volume d’une boule est proportionnel au cube de son rayon' },
    { txt: 'Les trois dimensions d’un pavé droit', mesure: 'son volume', pl: true, expl: 'le volume est le produit des trois dimensions, toutes multipliées par le même coefficient' }
  ];
  const verbeEvol = (f, t) => (t > 0 ? 'augmente' : 'diminue') + (f.pl ? 'nt' : '') + ' de ' + pct(Math.abs(t));
  // niveau 2 : une seule question par série, sur les cas les plus directs
  function aireVolumeN2() {
    return Math.random() < 0.6 ? aireDimension(true) : multiplicateurDimension('direct');
  }
  function aireDimension(simple) {
    const t = aleaParmi(simple ? [10, 20, 50, 100, -10, -20, -50] : [10, 20, 25, 30, 40, 50, 100, -10, -20, -25, -30, -40, -50]);
    const f = aleaParmi(simple ? FIG_AIRE.slice(0, 2) : FIG_AIRE);
    const k = R(1 + t / 100);
    const g = R((k * k - 1) * 100);
    if (!deuxDec(g)) return null;
    const enonce = `${f.txt} ${verbeEvol(f, t)}.<br>Alors ${f.mesure} subit :`;
    const bonne = evol(g);
    const candidats = [2 * t, t, R(t * t / 100), R(2 * t + (t > 0 ? 1 : -1)), 3 * t, R(g / 2), -g].filter(v => v > -100 && v !== 0 && deuxDec(v)).map(evol);
    const expl = `Coefficient sur la dimension : ${m(decL(k))} ; ${f.expl}, donc coefficient ${m(decL(k) + '^2 = ' + decL(k * k))} sur ${f.mesure}, soit ${evolutionTexte(g)} (et non ${signe(2 * t)}).`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }
  function volumeDimension() {
    const t = aleaParmi([10, 20, 30, 40, 50, 100, -10, -20, -30, -40, -50]);
    const f = aleaParmi(FIG_VOL);
    const k = R(1 + t / 100);
    const g = R((k * k * k - 1) * 100);
    if (!unDec(g)) return null;
    const enonce = `${f.txt} ${verbeEvol(f, t)}.<br>Alors ${f.mesure} subit :`;
    const bonne = evol(g);
    const g2 = R((k * k - 1) * 100);
    const candidats = [3 * t, t, 2 * t, g2, R(3 * t + (t > 0 ? 1 : -1)), R(g / 3)].filter(v => v > -100 && v !== 0 && unDec(v)).map(evol);
    const expl = `Coefficient sur la dimension : ${m(decL(k))} ; ${f.expl}, donc coefficient ${m(decL(k) + '^3 = ' + decL(R(k * k * k)))} sur ${f.mesure}, soit ${evolutionTexte(g)} (et non ${signe(3 * t)}).`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }
  // longueur et largeur évoluent différemment
  const RECT = [[25, -20], [20, -20], [50, -50], [10, 10], [20, 50], [-10, 20], [30, -30], [100, -50], [25, 20], [-25, -20], [50, -20], [40, -50], [-20, 25], [60, -25], [-40, 50]];
  function aireRectangle() {
    const [a, b] = aleaParmi(RECT);
    const g = R(((1 + a / 100) * (1 + b / 100) - 1) * 100);
    if (!deuxDec(g)) return null;
    const fig = aleaParmi([
      { l: 'La longueur d’un rectangle', L: 'sa largeur', mesure: 'son aire' },
      { l: 'La base d’un triangle', L: 'sa hauteur', mesure: 'son aire' },
      { l: 'Le rayon d’un cylindre', L: 'sa hauteur', mesure: 'son volume', carre: true },
      { l: 'La longueur d’un terrain rectangulaire', L: 'sa largeur', mesure: 'son aire' }
    ]);
    let coef, expl;
    if (fig.carre) {
      const gc = R(((1 + a / 100) * (1 + a / 100) * (1 + b / 100) - 1) * 100);
      if (!deuxDec(gc)) return null;
      coef = gc;
      expl = `Volume ${m('= \\pi r^2 h')} : coefficient ${m(decL(1 + a / 100) + '^2 \\times ' + decL(1 + b / 100) + ' = ' + decL(1 + gc / 100))}, soit ${evolutionTexte(gc)}.`;
    } else {
      coef = g;
      expl = `${fig.mesure.charAt(0).toUpperCase() + fig.mesure.slice(1)} est proportionnel${fig.mesure.includes('aire') ? 'le' : ''} au produit des deux dimensions : coefficient ${m(decL(1 + a / 100) + ' \\times ' + decL(1 + b / 100) + ' = ' + decL(1 + g / 100))}, soit ${evolutionTexte(g)}. Les taux ne s'additionnent pas (${signe(a)} et ${signe(b)} ne donnent pas ${signe(a + b)}).`;
    }
    const enonce = `${fig.l} ${a > 0 ? 'augmente' : 'diminue'} de ${pct(Math.abs(a))} et ${fig.L} ${b > 0 ? 'augmente' : 'diminue'} de ${pct(Math.abs(b))}.<br>Alors ${fig.mesure} subit :`;
    const bonne = evol(coef);
    const candidats = [a + b, -(a + b), R((a + b) / 2), R(a * b / 100), a, b, 2 * (a + b), -coef].filter(v => v > -100 && deuxDec(v)).map(evol);
    return qcm(enonce, bonne, candidats, { explication: expl });
  }
  // problème inverse : l'aire (ou le volume) a varié, de combien la dimension ?
  const CUBES = [[33.1, 10], [72.8, 20], [237.5, 50], [700, 100], [-27.1, -10], [-48.8, -20], [-87.5, -50], [-65.7, -30], [119.7, 30]];
  // figures à dimension unique, avec le genre de la dimension (accords) ; div = exposant
  const FIG_INV = [
    { mesure: 'L’aire d’un carré', mesureSon: 'son aire', mesureF: true, dimMaj: 'Le côté d’un carré', dim: 'son côté', dimA: 'au côté', dimF: false, div: 2 },
    { mesure: 'L’aire d’un disque', mesureSon: 'son aire', mesureF: true, dimMaj: 'Le rayon d’un disque', dim: 'son rayon', dimA: 'au rayon', dimF: false, div: 2 },
    { mesure: 'Le volume d’un cube', mesureSon: 'son volume', mesureF: false, dimMaj: 'L’arête d’un cube', dim: 'son arête', dimA: 'à l’arête', dimF: true, div: 3 },
    { mesure: 'Le volume d’une boule', mesureSon: 'son volume', mesureF: false, dimMaj: 'Le rayon d’une boule', dim: 'son rayon', dimA: 'au rayon', dimF: false, div: 3 }
  ];
  function dimensionInverse() {
    const f = aleaParmi(FIG_INV);
    const [g, r] = aleaParmi(f.div === 3 ? CUBES : CARRES);
    const enonce = `${f.mesure} a subi ${hausseBaisse(g)}.<br>Alors ${f.dim} a subi :`;
    const bonne = evol(r);
    const candidats = [R(g / f.div), g, R(g / (f.div + 1)), R(g / (f.div - 1)), -r, R(2 * r)].filter(v => v > -100 && v !== 0 && deuxDec(v)).map(evol);
    const naif = O.arrondir(g / f.div, 1);
    const expl = `Si ${f.dim} est multiplié${f.dimF ? 'e' : ''} par ${m('c')}, ${minuscule(f.mesure)} l'est par ${m('c^' + f.div)} : ${m('c^' + f.div + ' = ' + decL(1 + g / 100))} donne ${m('c = ' + decL(1 + r / 100))}, soit ${evolutionTexte(r)} — et non ${signe(naif)} (diviser le taux par ${f.div} est faux).`;
    return qcm(enonce, bonne, candidats, { explication: expl });
  }
  // multiplicateur entier : côté ×3 → aire ×9, périmètre ×3 ; arête ×2 → volume ×8
  function multiplicateurDimension(typeForce) {
    const k = aleaParmi([2, 3, 4, 5, 10, 1.5]);
    const divise = Math.random() < 0.3; // « divisé par » plutôt que « multiplié par »
    const f = aleaParmi(FIG_INV);
    const type = typeForce || aleaParmi(['direct', 'direct', 'inverse', f.div === 2 ? 'perimetre' : 'direct']);
    const optNum = v => ({ affichage: m(decL(v)), cle: v });
    const kp = R(Math.pow(k, f.div)); // k² ou k³
    const verbe = divise ? 'divisé' : 'multiplié';
    let enonce, bonne, candidats, expl;
    if (type === 'direct') {
      enonce = `${f.dimMaj} est ${verbe}${f.dimF ? 'e' : ''} par ${m(decL(k))}.<br>Alors ${f.mesureSon} est ${verbe}${f.mesureF ? 'e' : ''} par :`;
      bonne = optNum(kp);
      candidats = [k, f.div * k, R(Math.pow(k, f.div === 2 ? 3 : 2)), 2 * k, kp + k].filter(v => v > 0 && v !== kp).map(optNum);
      expl = `${f.mesure} est proportionnel${f.mesureF ? 'le' : ''} ${f.dimA} ${f.div === 2 ? 'au carré' : 'au cube'} : coefficient ${m(decL(k) + '^' + f.div + ' = ' + decL(kp))}.`;
    } else if (type === 'perimetre') {
      enonce = `Le côté d’un carré est ${verbe} par ${m(decL(k))}.<br>Alors son périmètre est ${verbe} par :`;
      bonne = optNum(k);
      candidats = [R(k * k), 4 * k, 2 * k, R(k * k * k)].map(optNum);
      expl = `Le périmètre est proportionnel au côté (${m('P = 4c')}) : il est ${verbe} par ${m(decL(k))}, comme le côté. C'est l'aire qui serait ${verbe}e par ${m(decL(k * k))}.`;
    } else {
      enonce = `${f.mesure} est ${verbe}${f.mesureF ? 'e' : ''} par ${m(decL(kp))}.<br>Alors ${f.dim} est ${verbe}${f.dimF ? 'e' : ''} par :`;
      bonne = optNum(k);
      candidats = [R(kp / f.div), kp, R(kp / (f.div + 1)), 2 * k, R(kp / 2), k + 1].filter(v => v > 0 && v !== k && deuxDec(v)).map(optNum);
      expl = `Si ${f.dim} est ${verbe}${f.dimF ? 'e' : ''} par ${m('c')}, ${minuscule(f.mesure)} l'est par ${m('c^' + f.div)} : ${m('c^' + f.div + ' = ' + decL(kp))} donne ${m('c = ' + decL(k))}.`;
    }
    return qcm(enonce, bonne, candidats, { explication: expl });
  }

  // =====================================================================
  // Composition d'une série de 10 (quotas) :
  //   niveau 1 : exactement 1 question à deux évolutions ; au moins 1 « valeur initiale »
  //   niveau 2 : au moins 1 coefficient réciproque ; deux questions un cran plus difficiles
  //              (1 aire/volume + 1 évolution manquante) ; au moins 1 « valeur initiale »
  //   niveau 3 : au moins 1 aire/volume, 1 réciproque, 1 « valeur initiale » (deux évolutions)
  Automatismes.enregistrerBanque('pourcentages', {
    titre: 'Pourcentages',
  // Ordre de difficulté croissante dans une série (niveaux 1 et 2) : rang par famille.
    familles: {
      'pourcentage-valeur': famille({ nom: 'pourcentage d’une valeur', niveaux: [1, 2, 3], base: pourcentageValeur, variantes3: [pourcentageDePourcentage, proportionEnPourcentage], ordre: { 1: 1, 2: 1 } }),
      'taux-vers-coef': famille({ nom: 'du taux au coefficient', niveaux: [2, 3], base: tauxVersCoef, variantes3: [tauxVersCoefDur, tauxVersCoefFraction, tauxVersCoefReduitA], ordre: { 2: 2 } }),
      'coef-vers-taux': famille({ nom: 'du coefficient au taux', niveaux: [2, 3], base: coefVersTaux, variantes3: [coefVersTauxMultiple, coefVersTauxFraction, coefVersTauxRepresente], ordre: { 2: 3 } }),
      'appliquer-taux': famille({ nom: 'appliquer une évolution', niveaux: [1, 2, 3], base: appliquerTaux, variantes3: [() => appliquerTauxTVA(true), appliquerTauxCascade], ordre: { 1: 2, 2: 4 } }),
      'taux-evolution': famille({ nom: 'calculer un taux d’évolution', niveaux: [1, 2, 3], base: tauxEvolution, variantes3: [tauxPoints, tauxDecimaux, tauxAllerRetour], ordre: { 1: 3, 2: 5 } }),
      'valeur-initiale': famille({ nom: 'retrouver la valeur initiale', niveaux: [1, 2, 3], base: valeurInitiale, quota: { 1: { min: 1, max: 1, priorite: 2 }, 2: { min: 1, max: 1, priorite: 2 }, 3: { min: 1, max: 1, priorite: 2 } }, ordre: { 1: 4, 2: 6 } }),
      'evolutions-successives': famille({ nom: 'évolutions successives', niveaux: [1, 2, 3], base: evolutionsSuccessives, variantes3: [tauxRepete, tauxMoyen, comparerAvantApres], partBase3: 0.4, quota: { 1: { min: 1, max: 1 } }, ordre: { 1: 5, 2: 7 } }),
      'reciproque': famille({ nom: 'coefficient réciproque', niveaux: [2, 3], base: reciproque, variantes3: [reciproqueFraction, reciproqueDouble], partBase3: 0.25, quota: { 2: { min: 1, priorite: 3 }, 3: { min: 1 } }, ordre: { 2: 8 } }),
      'evolution-manquante': famille({ nom: 'évolution manquante', niveaux: [2, 3], base: evolutionManquante, quota: { 2: { min: 1, max: 1 } }, ordre: { 2: 9 } }),
      'aire-volume': famille({ nom: 'aires et volumes', niveaux: [2, 3], base: aireVolumeN2, variantes3: [() => aireDimension(false), volumeDimension, aireRectangle, dimensionInverse, () => multiplicateurDimension()], quota: { 2: { min: 1, max: 1 }, 3: { min: 1 } }, ordre: { 2: 10 } })
    }
  });
})();
