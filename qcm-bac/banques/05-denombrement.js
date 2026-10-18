/* Banque 05 — Dénombrement (Terminale spécialité)
   Questions à quatre choix inspirées des affirmations et des QCM de bac 2022 à 2026 (nombre de tirages simultanés, groupes
   d'élèves « 3 parmi 20 et 2 parmi 11 », nombre de triplets avec deux numéros identiques, chemins, parties d'un ensemble) et
   du programme (principe multiplicatif, k-uplets, permutations, combinaisons, parties, triangle de Pascal).
   Voir outils/qcm-bac/types-de-questions-2022-2023.md.

   Niveau 1 — les bases : k-listes, factorielle, arrangements, nombre de parties, valeur d'un coefficient binomial.
   Niveau 2 — l'épreuve : contraintes sur une liste, anagrammes, combinaisons avec condition, triangle de Pascal, probabilité
              d'un tirage simultané, chemins dans un quadrillage.
   Niveau 3 — plus difficile (pénalités) : « au moins un » par complémentaire, produits de combinaisons (réponses sous forme
              de coefficients binomiaux), personnes côte à côte, anagrammes avec lettres répétées, chemins avec contrainte.

   Chaque question porte, dans le champ `meta`, les DONNÉES du problème. Le contrôle (outils/qcm-bac/controle-banques.js)
   les relit et DÉNOMBRE par une autre voie que la formule : énumération de toutes les listes, permutations ou parties
   (petits ensembles), ou programmation dynamique « choisir ou non chaque élément » (tirages dans des groupes), puis compare
   avec la valeur lue dans chaque option affichée (entier ou expression en coefficients binomiaux). */
(function () {
  'use strict';
  const O = Automatismes.outils;
  const { alea, aleaParmi, melanger, pgcd, m, qcm, famille, fracL, decL } = O;
  const T = String.raw;

  const texOpt = tex => ({ affichage: m(tex), cle: tex });
  const retente = gen => niveau => { for (let i = 0; i < 12; i++) { const q = gen(niveau); if (q) return q; } return null; };
  const ent = n => decL(n);                                      // entier avec espaces fines : 1\,000
  const fact = n => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  const C = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
  const A = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r *= (n - i); return r; };
  const bin = (n, k) => T`\binom{${n}}{${k}}`;
  const fr = (a, b) => T`\dfrac{${a}}{${b}}`;

  // options entières : bonne valeur, candidats (sans doublon, positifs, distincts de la bonne)
  function optsEnt(vrai, candidats, max) {
    const vus = new Set([vrai]), faux = [];
    for (const c of melanger(candidats)) { if (!Number.isFinite(c) || c <= 0 || !Number.isInteger(c) || c > (max || 1e9) || vus.has(c)) continue; vus.add(c); faux.push(ent(c)); }
    return { bonne: ent(vrai), faux };
  }
  // options sous forme d'expressions : [{tex, v}] ; v = valeur numérique pour écarter les expressions égales à la bonne
  function optsExpr(vraiTex, vrai, listeTexV) {
    const vus = new Set([vraiTex]), vv = new Set([vrai]), faux = [];
    for (const [t, v] of melanger(listeTexV)) { if (vus.has(t) || vv.has(v) || !Number.isFinite(v) || v <= 0) continue; vus.add(t); vv.add(v); faux.push(t); }
    return { bonne: vraiTex, faux };
  }

  // ==========================================================================
  // 1. Listes (k-uplets) avec contraintes
  // ==========================================================================
  const ALPHABETS = [
    { n: 10, ks: [2, 3, 4, 5], objet: k => `codes de ${k} chiffres (chaque chiffre est choisi entre 0 et 9)`, sym: 'le chiffre 0', premier: 'dont le premier chiffre n\'est pas 0' },
    { n: 26, ks: [2, 3], objet: k => `mots de ${k} lettres (ayant un sens ou non) écrits avec les 26 lettres de l'alphabet`, sym: 'la lettre A', premier: 'dont la première lettre n\'est pas A' },
    { n: 6, ks: [2, 3, 4, 5], objet: k => `résultats possibles (dans l'ordre) de ${k} lancers successifs d'un dé à six faces`, sym: 'la face 1', premier: 'dont le premier lancer ne donne pas 1' },
    { n: 2, ks: [4, 5, 6, 7, 8, 9, 10, 11], objet: k => `mots de ${k} lettres écrits avec seulement les lettres a et b`, sym: 'la lettre a', premier: 'dont la première lettre est b' },
    { n: 4, ks: [3, 4, 5, 6, 7], objet: k => `séquences de ${k} bases d'un brin d'ADN (chaque base est A, C, G ou T)`, sym: 'la base A', premier: 'dont la première base n\'est pas A' },
    { n: 4, ks: [3, 4, 5, 6], objet: k => `façons de répondre à un QCM de ${k} questions, chacune comportant 4 propositions (A, B, C, D) dont on en coche une`, sym: 'la réponse A', premier: 'dont la première réponse n\'est pas A' },
    { n: 3, ks: [3, 4, 5, 6, 7, 8], objet: k => `drapeaux de ${k} bandes horizontales, chaque bande étant bleue, blanche ou rouge`, sym: 'la couleur bleue', premier: 'dont la première bande n\'est pas bleue' },
    { n: 5, ks: [3, 4, 5, 6], objet: k => `suites de ${k} chiffres, chacun choisi entre 0 et 4`, sym: 'le chiffre 0', premier: 'dont le premier chiffre n\'est pas 0' }
  ];
  function listes(niveau) {
    const al = aleaParmi(ALPHABETS), n = al.n, k = aleaParmi(al.ks);
    const regles = niveau === 1 ? ['libre', 'libre', 'distincts'] : niveau === 2 ? ['premier', 'sans', 'palin', 'distincts', 'libre'] : ['au-moins', 'palin', 'premier', 'croissants', 'au-moins', 'sans'];
    let rule = aleaParmi(regles);
    if (rule === 'distincts' && k > n) rule = 'libre';
    if (rule === 'croissants' && (k > n || n < 4)) rule = 'au-moins';
    if (n === 2 && rule === 'premier') rule = 'sans';
    const cond = { libre: '', distincts: ' dont tous les éléments sont distincts', premier: ` ${al.premier}`, sans: ` ne contenant jamais ${al.sym}`, 'au-moins': ` contenant au moins une fois ${al.sym}`, palin: ' qui se lisent de la même façon dans les deux sens (palindromes)', croissants: ' écrits dans l\'ordre strictement croissant' }[rule];
    const vrai = { libre: Math.pow(n, k), distincts: A(n, k), premier: (n - 1) * Math.pow(n, k - 1), sans: Math.pow(n - 1, k), 'au-moins': Math.pow(n, k) - Math.pow(n - 1, k), palin: Math.pow(n, Math.ceil(k / 2)), croissants: C(n, k) }[rule];
    if (rule === 'croissants' && (n !== 10 && n !== 5)) return null;
    if (rule === 'palin' && k < 3) return null;
    const cands = [Math.pow(n, k), Math.pow(k, n), n * k, A(n, k), C(n, k), Math.pow(n - 1, k), Math.pow(n, k - 1), Math.pow(n, k) - Math.pow(n - 1, k), (n - 1) * Math.pow(n, k - 1), Math.pow(n, Math.floor(k / 2)), Math.pow(n, k) - 1, Math.pow(n, k - 1) * (n + 1), 2 * Math.pow(n, k - 1)];
    const o = optsEnt(vrai, cands, 5e6); if (o.faux.length < 3) return null;
    const expl = { libre: `Pour chacune des ${k} positions, ${n} choix indépendants : ${m(`${n}^{${k}}=${ent(vrai)}`)}.`, distincts: `${n} choix pour le premier, puis ${n - 1}, et ainsi de suite : ${m(`${Array.from({ length: k }, (_, i) => n - i).join('\\times ')}=${ent(vrai)}`)}.`,
      premier: `Premier élément : ${n - 1} choix ; ${k === 2 ? 'l\'autre élément' : `chacun des ${k - 1} autres`} : ${n} choix : ${m(`${n - 1}\\times ${k === 2 ? n : `${n}^{${k - 1}}`}=${ent(vrai)}`)}.`, sans: `${n - 1} choix pour chacune des ${k} positions : ${m(`${n - 1}^{${k}}=${ent(vrai)}`)}.`,
      'au-moins': `On passe par le contraire (aucune fois) : ${m(`${n}^{${k}}-${n - 1}^{${k}}=${ent(vrai)}`)}.`, palin: `Un palindrome est déterminé par ses ${Math.ceil(k / 2)} premiers éléments : ${m(`${n}^{${Math.ceil(k / 2)}}=${ent(vrai)}`)}.`,
      croissants: `Une liste strictement croissante est déterminée par l'ensemble de ses éléments : on choisit ${k} chiffres parmi ${n}, soit ${m(`${bin(n, k)}=${ent(vrai)}`)}.` }[rule];
    return qcm(`Combien y a-t-il de ${al.objet(k)}${cond} ?`, texOpt(o.bonne), o.faux.map(texOpt), { explication: expl, meta: { tipo: 'liste', n, k, rule } });
  }

  // ==========================================================================
  // 2. Permutations, arrangements, anagrammes
  // ==========================================================================
  const MOTS = ['MATHS', 'PARIS', 'MAMAN', 'BANANE', 'RADAR', 'POMME', 'LETTRE', 'ELEVE', 'ALPHA', 'TERMES', 'PAPA', 'SOLEIL', 'ELLE', 'PILIER', 'ANANAS', 'LILLE', 'AGENDA', 'GRAPHE', 'LIMITE', 'SUITE', 'DROITE', 'PLAN', 'VECTEUR', 'COURBE', 'ALGEBRE', 'FONCTION', 'NOMBRE', 'RECURRENCE', 'ESPACE', 'SINUS', 'TANGENTE', 'PRIMITIVE'].filter(w => w.length <= 7);
  const anag = mot => { const c = {}; for (const l of mot) c[l] = (c[l] || 0) + 1; return fact(mot.length) / Object.values(c).reduce((a, x) => a * fact(x), 1); };
  function permutations(niveau) {
    const t = niveau === 1 ? aleaParmi(['perm', 'perm', 'arr']) : niveau === 2 ? aleaParmi(['arr', 'anag', 'anag', 'perm-contrainte', 'avant']) : aleaParmi(['adj', 'apart', 'anag-rep', 'anag-rep', 'adj', 'trois', 'extremes', 'avant']);
    if (t === 'perm') {
      const n = alea(3, 8), vrai = fact(n), ctx = aleaParmi([`${n} élèves se placent en file indienne`, `On range ${n} livres distincts sur une étagère`, `${n} coureurs franchissent la ligne d'arrivée l'un après l'autre, sans ex æquo`]);
      const o = optsEnt(vrai, [Math.pow(n, n), n * n, fact(n - 1), fact(n + 1), Math.pow(2, n), n * (n - 1), 2 * fact(n - 1)], 5e6); if (o.faux.length < 3) return null;
      const q = ctx.startsWith('On range') ? `${ctx}. De combien de façons peut-on le faire ?` : `${ctx}. Combien d'ordres de passage ou de placement sont possibles ?`.replace('Combien d\'ordres de passage ou de placement', 'Combien d\'ordres possibles');
      return qcm(q.replace(/\.\s*Combien d'ordres possibles/, '. Combien d\'ordres possibles'), texOpt(o.bonne), o.faux.map(texOpt), { explication: `Les ${n} objets sont placés un à un : ${m(`${n}!=${Array.from({ length: n }, (_, i) => n - i).join('\\times ')}=${ent(vrai)}`)} permutations.`, meta: { tipo: 'perm', n } });
    }
    if (t === 'arr') {
      const n = alea(5, 12), k = alea(2, Math.min(4, n - 1)), vrai = A(n, k);
      const ctx = aleaParmi([`Dans une course à ${n} concurrents, on s'intéresse aux ${k} premiers (le classement compte)`, `Un club de ${n} membres élit un bureau de ${k} personnes occupant des postes différents (président, trésorier…)`, `On forme une liste ordonnée de ${k} élèves distincts choisis parmi ${n}`]);
      const o = optsEnt(vrai, [C(n, k), Math.pow(n, k), n * k, fact(n), A(n - 1, k), k * n * (n - 1), Math.pow(k, n)], 5e6); if (o.faux.length < 3) return null;
      return qcm(`${ctx}. Combien y a-t-il de possibilités ?`, texOpt(o.bonne), o.faux.map(texOpt), { explication: `On choisit ${k} éléments distincts en tenant compte de l'ordre : ${m(`${Array.from({ length: k }, (_, i) => n - i).join('\\times ')}=${ent(vrai)}`)}.`, meta: { tipo: 'arr', n, k } });
    }
    if (t === 'anag' || t === 'anag-rep') {
      let mot; const rep = t === 'anag-rep';
      const choix = MOTS.filter(w => (new Set(w).size === w.length) !== rep && w.length <= 7);
      mot = aleaParmi(choix);
      const vrai = anag(mot), c = {}; for (const l of mot) c[l] = (c[l] || 0) + 1;
      const rep2 = Object.values(c).filter(x => x > 1);
      const cands = [fact(mot.length), fact(mot.length) / 2, fact(mot.length) / (rep2.length ? Math.max(...rep2) : 1), Math.pow(mot.length, mot.length), fact(mot.length) / fact(Object.keys(c).length), fact(Object.keys(c).length), fact(mot.length - 1), fact(mot.length) / (rep2.reduce((a, x) => a + x, 0) || 1)];
      const o = optsEnt(vrai, cands, 5e6); if (o.faux.length < 3) return null;
      return qcm(`Combien d'anagrammes distincts (ayant un sens ou non) peut-on former avec toutes les lettres du mot ${m(`\\text{${mot}}`)} ?`, texOpt(o.bonne), o.faux.map(texOpt),
        { explication: rep ? `Il y a ${m(`${mot.length}!`)} façons d'ordonner les ${mot.length} lettres si on les distingue ; chaque anagramme est compté ${m(Object.values(c).filter(x => x > 1).map(x => `${x}!`).join('\\times '))} fois (permutation des lettres identiques) : ${m(`\\dfrac{${mot.length}!}{${Object.values(c).filter(x => x > 1).map(x => `${x}!`).join('\\times ')}}=${ent(vrai)}`)}.` : `Les ${mot.length} lettres sont toutes différentes : ${m(`${mot.length}!=${ent(vrai)}`)}.`, meta: { tipo: 'anag', mot } });
    }
    if (t === 'perm-contrainte') {
      const n = alea(4, 7), vrai = fact(n - 1);
      const o = optsEnt(vrai, [fact(n), fact(n - 2), n * fact(n - 1), 2 * fact(n - 1), (n - 1) * (n - 1), fact(n) / 2], 5e6); if (o.faux.length < 3) return null;
      return qcm(`${n} personnes, dont Camille, se placent en file indienne. Combien y a-t-il de files où Camille est en première position ?`, texOpt(o.bonne), o.faux.map(texOpt), { explication: `Camille est fixée en tête ; les ${n - 1} autres se placent librement : ${m(`(${n - 1})!=${ent(vrai)}`)}.`, meta: { tipo: 'adj', n, rule: 'premier' } });
    }
    if (t === 'avant' || t === 'trois' || t === 'extremes') {
      const n = alea(4, 8), vrai = t === 'avant' ? fact(n) / 2 : t === 'trois' ? 6 * fact(n - 2) : fact(n - 2);
      if (t === 'trois' && n < 5) return null;
      const cands = t === 'avant' ? [fact(n), fact(n - 1), fact(n) / 3, 2 * fact(n - 1), fact(n) - fact(n - 1)] : t === 'trois' ? [fact(n - 2), 3 * fact(n - 2), 6 * fact(n - 1), fact(n) / 6, 2 * fact(n - 2), 6 * fact(n - 3)] : [fact(n - 1), 2 * fact(n - 2), fact(n) / 2, n * (n - 1), fact(n - 2) / 2];
      const o = optsEnt(vrai, cands, 5e6); if (o.faux.length < 3) return null;
      const texte = { avant: `${n} personnes, dont Alice et Bob, se placent en file indienne. Combien y a-t-il de files où Alice est placée avant Bob (pas nécessairement juste devant) ?`, trois: `${n} personnes, dont Alice, Bob et Chloé, se placent en file indienne. Combien y a-t-il de files où ces trois personnes sont consécutives (dans un ordre quelconque) ?`, extremes: `${n} personnes, dont Alice et Bob, se placent en file indienne. Combien y a-t-il de files où Alice est la première et Bob le dernier ?` }[t];
      const expl = { avant: `Par symétrie, dans la moitié des files Alice est avant Bob : ${m(`\\dfrac{${n}!}{2}=${ent(vrai)}`)}.`, trois: `Les trois personnes forment un bloc (${m('3!=6')} ordres internes) ; ce bloc et les ${n - 3} autres personnes se placent de ${m(`(${n - 2})!`)} façons : ${m(`6\\times (${n - 2})!=${ent(vrai)}`)}.`, extremes: `Alice et Bob sont fixés aux extrémités ; les ${n - 2} autres se placent librement : ${m(`(${n - 2})!=${ent(vrai)}`)}.` }[t];
      return qcm(texte, texOpt(o.bonne), o.faux.map(texOpt), { explication: expl, meta: { tipo: 'adj', n, rule: t } });
    }
    const n = alea(4, 8), cote = t === 'adj', vrai = cote ? 2 * fact(n - 1) : fact(n) - 2 * fact(n - 1);
    const cands = cote ? [fact(n - 1), fact(n), 2 * fact(n), fact(n - 2), 2 * fact(n - 2), n * fact(n - 1)] : [2 * fact(n - 1), fact(n - 1), fact(n) - fact(n - 1), fact(n) - 2 * fact(n - 2), fact(n) / 2, fact(n) - 2 * fact(n - 1) + 2];
    const o = optsEnt(vrai, cands, 5e6); if (o.faux.length < 3) return null;
    return qcm(`${n} personnes, dont Alice et Bob, se placent en file indienne. Combien y a-t-il de files où Alice et Bob ${cote ? 'sont côte à côte' : 'ne sont pas côte à côte'} ?`, texOpt(o.bonne), o.faux.map(texOpt),
      { explication: cote ? `On considère Alice et Bob comme un bloc (2 ordres possibles : Alice-Bob ou Bob-Alice) : le bloc et les ${n - 2} autres personnes se placent de ${m(`(${n - 1})!`)} façons, d'où ${m(`2\\times (${n - 1})!=${ent(vrai)}`)}.` : `Total ${m(`${n}!=${ent(fact(n))}`)} moins les files où ils sont côte à côte ${m(`2\\times (${n - 1})!=${ent(2 * fact(n - 1))}`)} : ${m(ent(vrai))}.`, meta: { tipo: 'adj', n, rule: cote ? 'cote' : 'loin' } });
  }

  // ==========================================================================
  // 3. Combinaisons : tirages simultanés, comités, mains, avec conditions
  // ==========================================================================
  // art : « un » / « une » ; uni/plur : le groupe visé par les conditions (groupe 0 de `sizes`) ; donne : « un élément fixé à l'avance »
  const CONTEXTES_COMB = [
    { sizes: [[7, 8], [6, 9], [8, 10], [9, 6], [9, 11]], t: (s, k) => `Un club compte ${s[0]} hommes et ${s[1]} femmes. On choisit un comité de ${k} personnes (sans notion d'ordre).`, obj: 'comités', art: 'une', uni: 'femme', plur: 'femmes', donne: 'une personne donnée à l\'avance', cible: 1 },
    { sizes: [[20, 11], [12, 10], [15, 9], [14, 10]], t: (s, k) => `Dans une classe de ${s[0] + s[1]} élèves, ${s[0]} suivent l'enseignement de SES. On choisit un groupe de ${k} élèves.`, obj: 'groupes', art: 'un', uni: 'élève de SES', plur: 'élèves de SES', donne: 'un élève donné à l\'avance', cible: 0 },
    { sizes: [[4, 28]], t: (s, k) => `On tire simultanément ${k} cartes dans un jeu de 32 cartes (qui comporte 4 as).`, obj: 'mains', art: 'un', uni: 'as', plur: 'as', donne: 'une carte donnée à l\'avance', cible: 0 },
    { sizes: [[8, 24]], t: (s, k) => `On tire simultanément ${k} cartes dans un jeu de 32 cartes (qui comporte 8 cœurs).`, obj: 'mains', art: 'un', uni: 'cœur', plur: 'cœurs', donne: 'une carte donnée à l\'avance', cible: 0 },
    { sizes: [[5, 7], [6, 6], [4, 9], [7, 5]], t: (s, k) => `Une urne contient ${s[0]} boules rouges et ${s[1]} boules noires. On tire simultanément ${k} boules.`, obj: 'tirages', art: 'une', uni: 'boule rouge', plur: 'boules rouges', donne: 'une boule donnée à l\'avance', cible: 0 }
  ];
  function combinaisons(niveau) {
    const ctx = aleaParmi(CONTEXTES_COMB), s0 = aleaParmi(ctx.sizes);
    // le groupe visé par les conditions est toujours placé en premier : sg = taille du groupe visé, so = les autres
    const sg = s0[ctx.cible], so = s0[1 - ctx.cible], N = sg + so, k = alea(3, Math.min(5, N - 1));
    const kinds = niveau === 1 ? ['libre', 'libre', 'exact'] : niveau === 2 ? ['exact', 'au-moins', 'libre', 'contient'] : ['exact', 'au-moins', 'exact', 'au-plus'];
    const kind = aleaParmi(kinds), expr = niveau === 3 && Math.random() < 0.8;
    const j = kind === 'exact' ? alea(1, Math.min(k - 1, sg, 3)) : 1;
    if (kind === 'exact' && (k - j > so || j > sg)) return null;
    const objet = ctx.obj, nomG = (n) => `${n} ${n > 1 ? ctx.plur : ctx.uni}`;
    let vrai, cond, texV, cl, expl;
    if (kind === 'libre') { vrai = C(N, k); cond = ''; texV = bin(N, k); cl = [[bin(N, k - 1), C(N, k - 1)], [bin(N, k + 1), C(N, k + 1)], [`${N}\\times ${k}`, N * k], [fr(`${N}!`, `${k}!`), A(N, k)], [`${bin(sg, k)}+${bin(so, k)}`, C(sg, k) + C(so, k)]]; expl = `Les ${k} éléments sont choisis simultanément (sans ordre) parmi ${N} : ${m(`${bin(N, k)}=${ent(vrai)}`)}.`; }
    else if (kind === 'exact') { vrai = C(sg, j) * C(so, k - j); cond = ` comportant exactement ${nomG(j)}`; texV = `${bin(sg, j)}\\times ${bin(so, k - j)}`; cl = [[`${bin(sg, j)}+${bin(so, k - j)}`, C(sg, j) + C(so, k - j)], [`${bin(N, k)}`, C(N, k)], [`${bin(sg, j)}\\times ${bin(so, Math.min(k - j + 1, so))}`, C(sg, j) * C(so, Math.min(k - j + 1, so))], [`${bin(sg, k - j)}\\times ${bin(so, j)}`, C(sg, k - j) * C(so, j)], [`${bin(N, j)}\\times ${bin(N, k - j)}`, C(N, j) * C(N, k - j)], [`${bin(sg, j)}\\times ${bin(N, k - j)}`, C(sg, j) * C(N, k - j)]]; expl = `On choisit ${j} parmi les ${sg} ${ctx.plur}, puis ${k - j} parmi les ${so} autres éléments, de façon indépendante : ${m(`${texV}=${ent(vrai)}`)}.`; }
    else if (kind === 'au-moins') { vrai = C(N, k) - C(so, k); cond = ` comportant au moins ${ctx.art} ${ctx.uni}`; texV = `${bin(N, k)}-${bin(so, k)}`; cl = [[`${bin(sg, 1)}\\times ${bin(N - 1, k - 1)}`, sg * C(N - 1, k - 1)], [`${bin(N, k)}-${bin(sg, k)}`, C(N, k) - C(sg, k)], [`${bin(sg, 1)}\\times ${bin(so, k - 1)}`, sg * C(so, k - 1)], [`${bin(N, k)}`, C(N, k)], [`${bin(so, k)}`, C(so, k)], [`${bin(N, k)}-${bin(so, k - 1)}`, C(N, k) - C(so, k - 1)]]; expl = `Le contraire de « au moins ${ctx.art} ${ctx.uni} » est « aucun » : on retranche au nombre total ${m(bin(N, k))} le nombre de ${objet} sans ${ctx.uni}, soit ${m(bin(so, k))} : ${m(`${texV}=${ent(vrai)}`)}.`; }
    else if (kind === 'au-plus') { vrai = C(so, k) + sg * C(so, k - 1); cond = ` comportant au plus ${ctx.art} ${ctx.uni}`; texV = `${bin(so, k)}+${bin(sg, 1)}\\times ${bin(so, k - 1)}`; cl = [[`${bin(so, k)}`, C(so, k)], [`${bin(sg, 1)}\\times ${bin(so, k - 1)}`, sg * C(so, k - 1)], [`${bin(N, k)}-${bin(so, k)}`, C(N, k) - C(so, k)], [`${bin(so, k)}+${bin(sg, 1)}\\times ${bin(so, k)}`, C(so, k) + sg * C(so, k)], [`${bin(N, k)}-${bin(sg, 2)}\\times ${bin(so, k - 2)}`, C(N, k) - C(sg, 2) * C(so, k - 2)]]; expl = `« Au plus ${ctx.art} ${ctx.uni} » = « aucun » ou « exactement un » : ${m(`${bin(so, k)}+${bin(sg, 1)}\\times ${bin(so, k - 1)}=${ent(vrai)}`)}.`; }
    else { vrai = C(N - 1, k - 1); cond = ` contenant ${ctx.donne}`; texV = bin(N - 1, k - 1); cl = [[bin(N - 1, k), C(N - 1, k)], [bin(N, k - 1), C(N, k - 1)], [bin(N, k), C(N, k)], [`${bin(N - 1, k - 1)}\\times ${N}`, C(N - 1, k - 1) * N], [bin(N - 2, k - 1), C(N - 2, k - 1)]]; expl = `L'élément donné est choisi d'office ; on choisit les ${k - 1} autres parmi les ${N - 1} restants : ${m(`${bin(N - 1, k - 1)}=${ent(vrai)}`)}.`; }
    const spec = { groupes: kind === 'contient' ? [1, N - 1] : [sg, so], k, cond: kind === 'libre' ? { kind: 'libre' } : kind === 'exact' ? { kind: 'exact', j } : kind === 'au-moins' ? { kind: 'au-moins', j: 1 } : kind === 'au-plus' ? { kind: 'au-plus', j: 1 } : { kind: 'exact', j: 1 } };
    const enonce = `${ctx.t(s0, k)} Combien y a-t-il de ${objet}${cond} ?`;
    if (expr) {
      const o = optsExpr(texV, vrai, cl); if (o.faux.length < 3) return null;
      return qcm(enonce + ' (Réponse sous forme d\'expression.)', texOpt(o.bonne), o.faux.map(texOpt), { explication: expl, meta: Object.assign({ tipo: 'comb' }, spec) });
    }
    const o = optsEnt(vrai, cl.map(x => x[1]), 5e6); if (o.faux.length < 3) return null;
    return qcm(enonce, texOpt(o.bonne), o.faux.map(texOpt), { explication: expl, meta: Object.assign({ tipo: 'comb' }, spec) });
  }

  // ==========================================================================
  // 4. Parties d'un ensemble
  // ==========================================================================
  function parties(niveau) {
    const n = alea(4, 12), rules = niveau === 1 ? ['toutes', 'toutes', 'k'] : niveau === 2 ? ['non-vides', 'contient', 'k', 'propres', 'toutes'] : ['pair', 'contient2', 'ni2', 'pair', 'au-moins2'];
    const rule = aleaParmi(rules), k = alea(2, Math.min(4, n - 1));
    const vrai = { toutes: Math.pow(2, n), 'non-vides': Math.pow(2, n) - 1, k: C(n, k), contient: Math.pow(2, n - 1), propres: Math.pow(2, n) - 2, pair: Math.pow(2, n - 1), contient2: Math.pow(2, n - 2), ni2: Math.pow(2, n - 2), 'au-moins2': Math.pow(2, n) - 1 - n }[rule];
    const cond = { toutes: '', 'non-vides': ' non vides', k: ` à ${k} éléments`, contient: ' contenant l\'élément 1', propres: ' distinctes de l\'ensemble vide et de ' + m('E'), pair: ' ayant un nombre pair d\'éléments (l\'ensemble vide compte)', contient2: ' contenant à la fois l\'élément 1 et l\'élément 2', ni2: ' ne contenant ni l\'élément 1 ni l\'élément 2', 'au-moins2': ' ayant au moins 2 éléments' }[rule];
    const cands = [n * n, 2 * n, fact(n), Math.pow(2, n), Math.pow(2, n) - 1, Math.pow(2, n - 1), Math.pow(2, n - 2), Math.pow(2, n) - 2, C(n, 2), C(n, k), Math.pow(2, n) - n, Math.pow(2, n) - n - 1, Math.pow(2, n - 1) - 1, n * (n - 1)];
    const o = optsEnt(vrai, cands, 5e6); if (o.faux.length < 3) return null;
    const expl = { toutes: `Chacun des ${n} éléments est dans la partie ou n'y est pas : ${m(`2^{${n}}=${ent(vrai)}`)}.`, 'non-vides': `Toutes les parties ${m(`2^{${n}}`)} moins la partie vide : ${m(`2^{${n}}-1=${ent(vrai)}`)}.`, k: `Une partie à ${k} éléments est une combinaison : ${m(`${bin(n, k)}=${ent(vrai)}`)}.`, contient: `L'élément 1 est dans la partie ; les ${n - 1} autres sont libres : ${m(`2^{${n - 1}}=${ent(vrai)}`)}.`, propres: `${m(`2^{${n}}`)} parties, moins ${m('\\varnothing')} et ${m('E')} : ${m(`2^{${n}}-2=${ent(vrai)}`)}.`, pair: `Les parties de cardinal pair et celles de cardinal impair sont en bijection (on ajoute ou on retire l'élément 1) : chaque famille compte ${m(`\\dfrac{2^{${n}}}{2}=2^{${n - 1}}=${ent(vrai)}`)}.`, contient2: `Les éléments 1 et 2 sont dans la partie, les ${n - 2} autres sont libres : ${m(`2^{${n - 2}}=${ent(vrai)}`)}.`, ni2: `Les éléments 1 et 2 sont exclus, les ${n - 2} autres sont libres : ${m(`2^{${n - 2}}=${ent(vrai)}`)}.`, 'au-moins2': `Toutes les parties moins la partie vide et les ${n} singletons : ${m(`2^{${n}}-1-${n}=${ent(vrai)}`)}.` }[rule];
    const habillage = { toutes: [`Une pizzeria propose ${n} ingrédients en supplément ; chacun est ajouté ou non. Combien de pizzas différentes (y compris sans aucun supplément) peut-on composer ?`, `Un panier contient ${n} fruits de variétés toutes différentes. Combien de sous-paniers (y compris le panier vide) peut-on former ?`],
      'non-vides': [`Un conseil compte ${n} membres. Combien de commissions non vides, de taille quelconque, peut-on former ?`, `Une boîte contient ${n} jetons numérotés de 1 à ${n}. Combien de façons y a-t-il d'en prendre au moins un ?`] }[rule];
    if (habillage && Math.random() < 0.6) return qcm(aleaParmi(habillage), texOpt(o.bonne), o.faux.map(texOpt), { explication: expl, meta: { tipo: 'parties', n, rule, k } });
    return qcm(`Soit ${m('E')} un ensemble à ${n} éléments ${m(`E=\\{1,2,\\ldots,${n}\\}`)}. Combien ${m('E')} possède-t-il de parties${cond} ?`, texOpt(o.bonne), o.faux.map(texOpt), { explication: expl, meta: { tipo: 'parties', n, rule, k } });
  }

  // ==========================================================================
  // 5. Coefficients binomiaux : valeurs, triangle de Pascal, identités
  // ==========================================================================
  function binomiaux(niveau) {
    const t = niveau === 1 ? aleaParmi(['val', 'val', 'formule']) : niveau === 2 ? aleaParmi(['pascal', 'val', 'formule', 'egalite']) : aleaParmi(['egalite', 'egalite', 'pascal', 'formule']);
    if (t === 'val') {
      const n = niveau === 1 ? alea(4, 12) : alea(6, 14), k = niveau === 1 ? aleaParmi([0, 1, 2, n - 1, n, 3, 2, 3]) : alea(2, Math.floor(n / 2)), vrai = C(n, k);
      const o = optsEnt(vrai, [A(n, k), n * k, C(n, k + 1), C(n, k - 1), C(n + 1, k), Math.pow(n, k), n - k, C(n - 1, k)], 5e6); if (o.faux.length < 3) return null;
      return qcm(`Quelle est la valeur de ${m(bin(n, k))} ?`, texOpt(o.bonne), o.faux.map(texOpt), { explication: `${m(`${bin(n, k)}=\\dfrac{${n}!}{${k}!\\,${n - k}!}=${ent(vrai)}`)}${k === 0 || k === n ? ' (il y a une seule partie vide ou une seule partie pleine)' : ''}.`, meta: { tipo: 'binomiaux', ask: 'val', n, k } });
    }
    if (t === 'pascal') {
      const n = alea(5, 12), k = alea(1, n - 1), a = C(n, k - 1), b = C(n, k), vrai = C(n + 1, k);
      const o = optsEnt(vrai, [a * b, b, a, C(n + 1, k + 1) + 1, a + b + 1, a + b - 1, 2 * b, C(n, k + 1)], 5e6); if (o.faux.length < 3) return null;
      return qcm(`On sait que ${m(`${bin(n, k - 1)}=${ent(a)}`)} et ${m(`${bin(n, k)}=${ent(b)}`)}. Quelle est la valeur de ${m(bin(n + 1, k))} ?`, texOpt(o.bonne), o.faux.map(texOpt), { explication: `Relation de Pascal : ${m(`${bin(n + 1, k)}=${bin(n, k - 1)}+${bin(n, k)}=${ent(a)}+${ent(b)}=${ent(vrai)}`)}.`, meta: { tipo: 'binomiaux', ask: 'val', n: n + 1, k } });
    }
    if (t === 'formule') {
      const kk = aleaParmi([1, 2, 3]);
      const bonne = { 1: 'n', 2: fr('n(n-1)', '2'), 3: fr('n(n-1)(n-2)', '6') }[kk];
      const faux = { 1: ['n-1', 'n^2', '1', 'n+1', '2n'], 2: [fr('n^2', '2'), fr('n(n+1)', '2'), 'n(n-1)', fr('n(n-1)', '4'), fr('(n-1)(n-2)', '2')], 3: [fr('n(n-1)(n-2)', '3'), fr('n^3', '6'), 'n(n-1)(n-2)', fr('(n-1)(n-2)(n-3)', '6'), fr('n(n-1)(n-2)', '2')] }[kk];
      return qcm(`Pour tout entier ${m('n')} supérieur ou égal à ${kk}, ${m(bin('n', kk))} est égal à :`, texOpt(bonne), faux.map(texOpt), { explication: `${m(`${bin('n', kk)}=\\dfrac{n!}{${kk}!\\,(n-${kk})!}=${bonne}`)} (on simplifie ${m('n!')} et ${m(`(n-${kk})!`)}).`, meta: { tipo: 'binomiaux', ask: 'formule', k: kk } });
    }
    const forme = aleaParmi(['sym', 'pascal']), n = alea(6, 14);
    const eq = (g, vg, d, vd) => [`${g}=${d}`, vg === vd];
    let bonne, faux;
    if (forme === 'sym') {
      const k = alea(2, Math.max(2, Math.floor(n / 2) - 1)), v = C(n, k);
      bonne = `${bin(n, k)}=${bin(n, n - k)}`;
      faux = [[`${bin(n, k)}=${bin(n, n - k + 1)}`, C(n, n - k + 1)], [`${bin(n, k)}=${bin(n, n - k - 1)}`, C(n, n - k - 1)], [`${bin(n, k)}=${bin(n - 1, k)}`, C(n - 1, k)], [`${bin(n, k)}=${bin(n + 1, k)}`, C(n + 1, k)], [`${bin(n, k)}=${bin(n, k + 1)}`, C(n, k + 1)], [`${bin(n, k)}=${bin(n, 2 * k)}`, C(n, 2 * k)]].filter(([, w]) => w !== v).map(x => x[0]);
    } else {
      const k = alea(2, n - 2), v = C(n, k) + C(n, k + 1);
      bonne = `${bin(n, k)}+${bin(n, k + 1)}=${bin(n + 1, k + 1)}`;
      faux = [[`${bin(n, k)}+${bin(n, k + 1)}=${bin(n + 1, k)}`, C(n + 1, k)], [`${bin(n, k)}+${bin(n, k + 1)}=${bin(n + 1, k + 2)}`, C(n + 1, k + 2)], [`${bin(n, k)}+${bin(n, k + 1)}=${bin(n, k + 2)}`, C(n, k + 2)], [`${bin(n, k)}\\times ${bin(n, k + 1)}=${bin(n + 1, k + 1)}`, C(n + 1, k + 1) + 0.5], [`${bin(n, k)}+${bin(n, k + 1)}=${bin(n + 2, k + 1)}`, C(n + 2, k + 1)]].filter(([t, w], i) => (i === 3 ? C(n, k) * C(n, k + 1) !== C(n + 1, k + 1) : w !== v)).map(x => x[0]);
    }
    return qcm('Laquelle de ces égalités est vraie ?', texOpt(bonne), faux.filter((x, i, a) => a.indexOf(x) === i && x !== bonne).map(texOpt),
      { explication: forme === 'sym' ? `Symétrie : choisir ${m('k')} éléments revient à choisir les ${m('n-k')} qu'on laisse de côté, donc ${m(T`\binom{n}{k}=\binom{n}{n-k}`)}.` : `Relation de Pascal : ${m(T`\binom{n}{k}+\binom{n}{k+1}=\binom{n+1}{k+1}`)}.`, meta: { tipo: 'binomiaux', ask: 'egalite' } });
  }

  // ==========================================================================
  // 6. Probabilités et dénombrement : tirage simultané
  // ==========================================================================
  function tirageSimultane(niveau) {
    const r = alea(3, 8), b = alea(3, 8), N = r + b, k = alea(2, Math.min(4, N - 1));
    const ask = niveau === 1 ? 'total' : aleaParmi(['exact', 'exact', 'au-moins', 'meme']);
    const j = alea(1, Math.min(k - 1, r)); if (ask === 'exact' && (k - j > b)) return null;
    if (ask === 'total') {
      const vrai = C(N, k), o = optsEnt(vrai, [A(N, k), N * k, C(N, k - 1), C(N, k + 1), Math.pow(N, k), C(r, k) + C(b, k)], 5e6); if (o.faux.length < 3) return null;
      return qcm(`Une urne contient ${r} boules rouges et ${b} boules noires. On tire simultanément ${k} boules. Combien y a-t-il de tirages possibles ?`, texOpt(o.bonne), o.faux.map(texOpt), { explication: `${m(`${bin(N, k)}=${ent(vrai)}`)} (tirage simultané : l'ordre ne compte pas).`, meta: { tipo: 'tirage', r, b, k, ask } });
    }
    const tot = C(N, k), fav = ask === 'exact' ? C(r, j) * C(b, k - j) : ask === 'au-moins' ? tot - C(b, k) : C(r, k) + C(b, k);
    if (fav <= 0 || fav >= tot) return null;
    const g = pgcd(fav, tot), vrai = fracL(fav / g, tot / g);
    const cl = ask === 'exact' ? [[C(r, j) + C(b, k - j), tot], [C(r, j) * C(b, k - j), C(N, j) * C(N, k - j)], [C(r, j) * C(b, k - j), A(N, k)], [C(r, j), tot], [C(r, j) * C(b, k - j), tot * 2], [C(r, k - j) * C(b, j), tot]]
      : ask === 'au-moins' ? [[C(r, 1) * C(N - 1, k - 1), tot], [tot - C(r, k), tot], [C(b, k), tot], [tot - C(b, k - 1), tot], [r * k, N]]
        : [[C(r, k), tot], [C(r, k) + C(b, k), tot * 2], [C(r, k) * C(b, k), tot], [2 * C(r, k), tot], [r * b, tot]];
    const vus = new Set([vrai]), faux = [];
    for (const [a, c] of melanger(cl)) { if (!(a > 0) || a >= c) continue; const gg = pgcd(a, c), t = fracL(a / gg, c / gg); if (vus.has(t)) continue; vus.add(t); faux.push(t); }
    if (faux.length < 3) return null;
    const cond = ask === 'exact' ? `exactement ${j} boule${j > 1 ? 's' : ''} rouge${j > 1 ? 's' : ''}` : ask === 'au-moins' ? 'au moins une boule rouge' : 'toutes les boules de la même couleur';
    return qcm(`Une urne contient ${r} boules rouges et ${b} boules noires, indiscernables au toucher. On tire simultanément ${k} boules. Quelle est la probabilité d'obtenir ${cond} ?`, texOpt(vrai), faux.slice(0, 3).map(texOpt),
      { explication: ask === 'exact' ? `Cas favorables : ${m(`${bin(r, j)}\\times ${bin(b, k - j)}=${ent(fav)}`)} ; cas possibles : ${m(`${bin(N, k)}=${ent(tot)}`)}. Équiprobabilité : ${m(`\\dfrac{${ent(fav)}}{${ent(tot)}}=${vrai}`)}.` : ask === 'au-moins' ? `Le contraire est « aucune boule rouge » : ${m(`1-\\dfrac{${bin(b, k)}}{${bin(N, k)}}=${vrai}`)}.` : `Favorables : ${m(`${bin(r, k)}+${bin(b, k)}=${ent(fav)}`)} (toutes rouges ou toutes noires) sur ${m(`${bin(N, k)}=${ent(tot)}`)} : ${m(vrai)}.`, meta: { tipo: 'tirage', r, b, k, ask, j } });
  }

  // ==========================================================================
  // 7. Chemins dans un quadrillage et mots binaires
  // ==========================================================================
  function chemins(niveau) {
    const t = niveau === 2 ? aleaParmi(['libre', 'libre', 'mots']) : aleaParmi(['par', 'sans', 'par', 'mots']);
    if (t === 'mots') {
      const n = alea(5, 12), k = alea(2, Math.min(5, n - 1)), vrai = C(n, k);
      const o = optsEnt(vrai, [Math.pow(2, n), A(n, k), C(n, k - 1), n * k, Math.pow(n, k), C(n, n - k + 1), Math.pow(2, k)], 5e6); if (o.faux.length < 3) return null;
      return qcm(`Combien y a-t-il de mots de ${n} lettres écrits avec les lettres a et b et contenant exactement ${k} fois la lettre b ?`, texOpt(o.bonne), o.faux.map(texOpt), { explication: `Un tel mot est déterminé par la position des ${k} lettres b parmi les ${n} positions : ${m(`${bin(n, k)}=${ent(vrai)}`)}.`, meta: { tipo: 'chemins', ask: 'mots', n, k } });
    }
    const a = alea(2, 6), b = alea(2, 5), base = aleaParmi([`Dans un quadrillage, on va du point ${m('A(0\\,;0)')} au point ${m(`B(${a}\\,;${b})`)} en ne faisant que des pas d'une unité vers la droite ou vers le haut.`, `Dans une ville dont les rues forment un quadrillage, un piéton va du point ${m('A(0\\,;0)')} au point ${m(`B(${a}\\,;${b})`)} en avançant uniquement vers l'est ou vers le nord, d'un pâté de maisons à la fois.`, `Un pion se déplace sur les nœuds d'un quadrillage, de ${m('A(0\\,;0)')} vers ${m(`B(${a}\\,;${b})`)}, avec des pas vers la droite ou vers le haut uniquement.`]);
    if (t === 'libre') {
      const vrai = C(a + b, a), o = optsEnt(vrai, [a * b, A(a + b, 2), Math.pow(2, a + b), C(a + b, a + 1), C(a + b, 2), fact(a + b), (a + 1) * (b + 1)], 5e6); if (o.faux.length < 3) return null;
      return qcm(`${base} Combien y a-t-il de chemins possibles ?`, texOpt(o.bonne), o.faux.map(texOpt), { explication: `Un chemin comporte ${a} pas à droite et ${b} pas vers le haut, soit ${a + b} pas ; il est déterminé par la place des ${a} pas à droite : ${m(`${bin(a + b, a)}=${ent(vrai)}`)}.`, meta: { tipo: 'chemins', ask: 'libre', a, b } });
    }
    const c = alea(1, a - 1), d = alea(1, b - 1), par = C(c + d, c) * C(a - c + b - d, a - c), tot = C(a + b, a), vrai = t === 'par' ? par : tot - par;
    const cands = t === 'par' ? [C(a + b, a), C(c + d, c) + C(a - c + b - d, a - c), tot - par, C(c + d, c), C(a - c + b - d, a - c), C(c + d, c) * C(a + b - c - d, c)] : [par, C(a + b, a), tot - C(c + d, c), tot - C(c + d, c) * C(a + b, a), C(c + d, c) * C(a - c + b - d, a - c) + 1];
    const o = optsEnt(vrai, cands, 5e6); if (o.faux.length < 3) return null;
    return qcm(`${base} Combien y a-t-il de chemins ${t === 'par' ? `passant par le point ${m(`P(${c}\\,;${d})`)}` : `ne passant pas par le point ${m(`P(${c}\\,;${d})`)}`} ?`, texOpt(o.bonne), o.faux.map(texOpt),
      { explication: t === 'par' ? `De ${m('A')} à ${m('P')} : ${m(`${bin(c + d, c)}=${ent(C(c + d, c))}`)} chemins ; de ${m('P')} à ${m('B')} : ${m(`${bin(a - c + b - d, a - c)}=${ent(C(a - c + b - d, a - c))}`)}. On multiplie : ${m(ent(par))}.` : `Total ${m(`${bin(a + b, a)}=${ent(tot)}`)} moins les chemins passant par ${m('P')} (${m(ent(par))}) : ${m(ent(vrai))}.`, meta: { tipo: 'chemins', ask: t, a, b, c, d } });
  }

  // ==========================================================================
  // Enregistrement
  // ==========================================================================
  Automatismes.enregistrerBanque('denombrement', {
    titre: 'Dénombrement',
    familles: {
      'listes': famille({ nom: 'k-listes et contraintes', niveaux: [1, 2, 3], base: retente(listes) }),
      'permutations': famille({ nom: 'permutations, arrangements, anagrammes', niveaux: [1, 2, 3], base: retente(permutations) }),
      'combinaisons': famille({ nom: 'combinaisons', niveaux: [1, 2, 3], base: retente(combinaisons) }),
      'parties': famille({ nom: 'parties d’un ensemble', niveaux: [1, 2, 3], base: retente(parties) }),
      'binomiaux': famille({ nom: 'coefficients binomiaux', niveaux: [1, 2, 3], base: retente(binomiaux) }),
      'tirage-simultane': famille({ nom: 'tirage simultané et probabilité', niveaux: [1, 2, 3], base: retente(tirageSimultane) }),
      'chemins': famille({ nom: 'chemins et mots binaires', niveaux: [2, 3], base: retente(chemins) })
    }
  });
})();
