#!/usr/bin/env node
'use strict';
// Contrôle automatique des « Détails » de correction des fiches de calcul (16/10/2026).
//
// Charge chaque fiche dans un Chrome invisible (playwright-core pilote le Chrome DÉJÀ installé : rien à télécharger, aucun crédit),
// régénère la fiche des centaines de fois et contrôle, pour chaque exercice qui porte un `detail: { lignes, final }` :
//   1. la dernière ligne contient `final`, et `final` égale la réponse attendue (nombres, expressions en a / n / x, ensembles,
//      intervalles, couples et vecteurs) ;
//   2. chaque chaîne d'égalités « A = B = C » est exacte (évaluée en plusieurs valeurs des lettres) ;
//   3. chaque équivalence « P ⟺ Q » entre deux équations / inéquations a les mêmes solutions (résolution numérique) ;
//   4. le style (coefficient 1, signes doublés, exposant 1, fraction de dénominateur 1 ou 0, « < » brut, espaces avant %, NaN…) ;
//   5. le LaTeX compile dans MathJax (aucune erreur de syntaxe) ; chaque tableau de signes est relu (20/10/2026) : signe et zéro de chaque
//      ligne de facteur, ligne finale = produit des lignes, ensemble de solutions lu sur la ligne finale = réponse attendue ;
//   6. l'interface : bouton « Détails » présent pour chaque réponse fausse, étapes dépliables, aucune erreur de page, aucune ligne
//      réduite à moins de 85 % de sa taille ni débordement horizontal, sur ordinateur et sur téléphone (375 px).
// Rapports : rapport.txt (anomalies), phrases.txt (toutes les phrases de méthode, à relire), exemples.html (deux exemples par
// exercice, à parcourir), couverture.txt (exercices avec / sans détail). Un auto-test (mutations) vérifie que l'outil détecte
// bien une erreur volontairement introduite.
//
//   node outils/details-correction/controle.js cahiers/premiere/cahier-4/fiche-12.html
//   node outils/details-correction/controle.js --toutes             toutes les fiches qui portent des détails
//   node outils/details-correction/controle.js --couverture         seulement le tableau exercices avec / sans détail
//   options : --tirages N (défaut 300 ; 1500 pour une fiche nommée)   --regenerations K (interface, défaut 6)
//             --sans-interface   --sans-autotest   --exemples N (exemples par exercice, défaut 2)
// Code de sortie 1 s'il y a des anomalies de gravité « erreur ».
const fs = require('fs');
const path = require('path');
const http = require('http');
const { lancer } = require('../guide-eleve/navigateur');

const RACINE = path.resolve(__dirname, '..', '..');
const SORTIE = __dirname;
const args = process.argv.slice(2);
const option = (nom, defaut) => { const i = args.indexOf(nom); return i >= 0 ? Number(args[i + 1]) : defaut; };
const drapeau = (nom) => args.includes(nom);
const nommees = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && /^--(tirages|tirages-equivalences|regenerations|exemples)$/.test(args[i - 1])));

function toutesLesFiches() {
  const liste = [];
  for (const niveau of ['premiere', 'seconde']) {
    const dn = path.join(RACINE, 'cahiers', niveau);
    for (const cahier of fs.readdirSync(dn).filter((d) => d.startsWith('cahier-'))) {
      for (const f of fs.readdirSync(path.join(dn, cahier)).filter((n) => /^fiche-\d+\.html$/.test(n))) liste.push(`cahiers/${niveau}/${cahier}/${f}`);
    }
  }
  return liste.sort();
}
const aDesDetails = (f) => /detail:\s*\{\s*lignes/.test(fs.readFileSync(path.join(RACINE, f), 'utf8'));

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.woff2': 'font/woff2' };
function demarrerServeur() {
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      let f = path.join(RACINE, url);
      if (!f.startsWith(RACINE)) { res.writeHead(403); return res.end(); }
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
      if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(f).pipe(res);
    }).listen(0, '127.0.0.1', () => resolve(s));
  });
}

// ===================================================================================================================
// Code exécuté DANS la page (aucune variable extérieure : la fonction est sérialisée)
// ===================================================================================================================
async function controlerDansLaPage(opts) {
  const anomalies = [], cles = new Set();
  const stats = { tirages: 0, exercices: 0, avecDetail: 0, lignes: 0, chaines: 0, chainesIllisibles: 0, equivalences: 0, equivalencesIllisibles: 0,
    finalVerifie: 0, finalNonVerifiable: 0, motifsLaTeX: 0, tableaux: 0 };
  const ajouter = (gravite, motif, e, exemple) => {
    const cle = e.id + '|' + motif;
    if (cles.has(cle)) return;
    cles.add(cle);
    anomalies.push({ gravite, motif, id: e.id, exemple: String(exemple).replace(/\s+/g, ' ').slice(0, 260) });
  };
  const generer = () => (typeof marquerFormesFactorisees === 'function' ? marquerFormesFactorisees(genererExercices()) : genererExercices());

  // ---------- LaTeX -> mathjs ----------
  const FONCTIONS = new Set(['sqrt', 'log', 'exp', 'cos', 'sin', 'tan', 'abs', 'pi', 'e', 'Infinity', 'nthRoot']);
  function versMathjs(tex) {
    let t = String(tex).replace(/\\(?:small|scriptsize)\s*/g, '').replace(/\\%/g, '*0.01').replace(/(\d)\\,(?=\d)/g, '$1').replace(/\\lt\s*/g, '<').replace(/\\left|\\right/g, '').replace(/\[/g, '(').replace(/\]/g, ')').replace(/\\[,;!: ]/g, ' ').replace(/\\q?quad/g, ' ')   // 16\,384 : un seul nombre ; crochets : parenthèses
      .replace(/\\(?:times|cdot)/g, '*').replace(/\\div/g, '/').replace(/\\pi/g, 'pi').replace(/\\infty/g, 'Infinity')
      .replace(/\\ln/g, 'log').replace(/\\exp/g, 'exp').replace(/\\cos/g, 'cos').replace(/\\sin/g, 'sin').replace(/\\tan/g, 'tan')
      .replace(/\\mathrm\{e\}/g, 'e').replace(/\{,\}/g, '.').replace(/\\Vert|\\vert/g, '')
      .replace(/\|([^|]*)\|/g, 'abs($1)');                                      // valeur absolue |x-3| (sans imbrication)
    if (/\\[a-zA-Z]+/.test(t.replace(/\\(?:dfrac|frac|sqrt)/g, ''))) throw new Error('commande LaTeX inconnue : ' + (t.match(/\\[a-zA-Z]+/) || [''])[0]);
    for (let i = 0; i < 12; i++) {
      const avant = t;
      t = t.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)')
        .replace(/_\{([^{}]*)\}/g, (m, s) => '_' + s.replace(/\+/g, 'p').replace(/-/g, 'm').replace(/[^A-Za-z0-9]/g, ''))
        .replace(/\^\{([^{}]*)\}/g, '^($1)');
      if (t === avant) break;
    }
    t = t.replace(/[{}]/g, (c) => (c === '{' ? '(' : ')')).replace(/\s+/g, ' ');
    // identifiants : une suite de lettres sans indice se coupe en lettres multipliées (an -> a*n), sauf noms connus
    t = t.replace(/([A-Za-z]+)(_[A-Za-z0-9]+)?/g, (m, lettres, indice) => {
      if (indice) return lettres.length === 1 ? m : lettres.split('').slice(0, -1).join('*') + '*' + lettres.slice(-1) + indice;
      if (FONCTIONS.has(lettres)) return lettres;
      return lettres.split('').join('*');
    });
    // multiplications implicites
    t = t.replace(/(\d)\s*([A-Za-z(])/g, '$1*$2').replace(/\)\s*([A-Za-z0-9(])/g, ')*$1')
      .replace(/([A-Za-z0-9_])\s*\(/g, (m, c, off, s) => {
        const mot = (s.slice(0, off + 1).match(/[A-Za-z_][A-Za-z0-9_]*$/) || [''])[0];
        return FONCTIONS.has(mot) ? m : c + '*(';
      });
    t = t.replace(/([A-Za-z_][A-Za-z0-9_]*)\s+([A-Za-z0-9(])/g, (m, a, b) => (FONCTIONS.has(a) ? m : a + '*' + b));
    return t;
  }
  const hasard = (graine) => { let s = graine; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };
  function portee(expr, k) {
    // chaque identifiant libre reçoit une valeur « quelconque » (non entière), fixe pour un k donné
    const R = hasard(7919 * (k + 3));
    const sc = {};
    for (const m of String(expr).matchAll(/[A-Za-z_][A-Za-z0-9_]*/g)) {
      if (FONCTIONS.has(m[0])) continue;
      // « n » est un indice entier (sinon (-3)^n donnerait un nombre complexe)
      if (!(m[0] in sc)) sc[m[0]] = m[0] === 'n' ? 2 + Math.floor(R() * 11) : 1.31 + R() * 2.4;
    }
    return sc;
  }
  const NB_PORTEES = 8;
  const egal = (a, b) => Math.abs(a - b) <= 1e-8 * Math.max(1, Math.abs(a), Math.abs(b));
  const evaluer = (tex, k) => { const m = versMathjs(tex); const sc = portee(m, k); const v = math.evaluate(m, sc); if (typeof v !== 'number' || !isFinite(v)) throw new Error('non fini'); return v; };
  // même valeur des lettres pour toutes les expressions comparées : on construit la portée sur la concaténation
  function evaluerGroupe(textes, k) {
    const ms = textes.map(versMathjs);
    const sc = portee(ms.join(' + '), k);
    return ms.map((m) => { const v = math.evaluate(m, sc); if (typeof v !== 'number' || !isFinite(v)) throw new Error('non fini'); return v; });
  }

  // ---------- chaînes d'égalités ----------
  // un membre réduit à un symbole (x, r, u_n, v_{n+1}^2…) est la grandeur définie par la chaîne, pas une valeur à comparer
  const estSymboleSeul = (s) => /^\s*-?\s*[A-Za-z](_(\{[^{}]*\}|[A-Za-z0-9]))?(\^(\{[^{}]*\}|\d))?\s*$/.test(s) || /^\s*\\(Delta|lambda|alpha)\s*$/.test(s);
  // une suite u_{14}, v_0, u_1 est une grandeur liée aux autres par l'énoncé : ses valeurs ne sont pas libres, on ne la compare pas
  const aIndice = (s) => /_(\{[^{}]*\}|\d)/.test(s);
  const estApplication = (s) => /^\s*[fgh]\s*(\\left)?\(/.test(s);                        // f(3/2) : image définie par la fonction de l'énoncé
  const aDesLettres = (s) => /[A-Za-z]/.test(s.replace(/\\(?:dfrac|frac|sqrt|times|cdot|div|left|right|pi|infty|lt|gt)(?![A-Za-z])/g, ''));
  const nz = (s) => String(s).replace(/\\\(|\\\)/g, '').replace(/\\lt\s*/g, '<').replace(/\\left|\\right|\\[,;! ]|\s+/g, '');
  // Une chaîne « A = B = C » est vérifiée par paires voisines : deux membres numériques doivent être égaux ; deux membres littéraux
  // doivent être égaux pour toute valeur des lettres (identité) ; un membre numérique à côté d'un membre littéral exprime une
  // équation ou une substitution et n'est pas comparable. Un membre qui reprend l'énoncé (équation à résoudre) est ignoré.
  function verifierChaine(partie, enonce, dansEquivalence) {
    if (enonce && nz(partie).length >= 5 && nz(enonce).includes(nz(partie))) return null;
    const segs = partie.split('=').map((s) => s.trim()).filter(Boolean).filter((s) => !estSymboleSeul(s) && !/\\Delta/.test(s) && !aIndice(s) && !estApplication(s) && !/[A-Za-z]'/.test(s));   // (a', b', c' : coefficients nommés, pas des valeurs)
    if (segs.length < 2) return null;
    let verifie = 0;
    for (let i = 0; i + 1 < segs.length; i++) {
      const lit = [aDesLettres(segs[i]), aDesLettres(segs[i + 1])];
      if (lit[0] !== lit[1]) continue;
      // « A = B » littéral seul dans une partie d'équivalence est une équation à résoudre (contrôlée par l'équivalence), pas une identité
      if (lit[0] && dansEquivalence && segs.length === 2) continue;
      for (let k = 0; k < (lit[0] ? NB_PORTEES : 1); k++) {
        let vs;
        try { vs = evaluerGroupe([segs[i], segs[i + 1]], k); } catch (er) { return verifie ? { ok: true } : { illisible: true }; }
        if (!egal(vs[0], vs[1])) return { faux: true, valeurs: segs[i] + ' = ' + segs[i + 1] + '  =>  ' + vs.map((v) => +v.toFixed(5)).join(' | ') };
      }
      verifie++;
    }
    return verifie ? { ok: true } : null;
  }

  // ---------- équivalences entre équations / inéquations ----------
  const OPS = [['\\leqslant', '<='], ['\\geqslant', '>='], ['\\leq', '<='], ['\\geq', '>='], ['\\lt', '<'], ['\\gt', '>'], ['<', '<'], ['>', '>']];
  const JETON = { '<=': 'LE', '>=': 'GE', '<': 'LT', '>': 'GT' }, SYMBOLE = { LE: '<=', GE: '>=', LT: '<', GT: '>', EQ: '=' };
  // une relation « g(v) op 0 » : [{ g: (x) => nombre, op }] ; plusieurs relations reliées par ET (double inégalité) ou OU
  function analyserPartie(partie) {
    // « A \text{ ou } B » : réunion ; « A \text{ et } B » : intersection ; une double inégalité est elle-même une intersection.
    // Réunion de doubles inégalités acceptée (« 1 \lt x \lt 3 \text{ ou } 5 \leqslant x \lt 8 ») ; « et » et « ou » ne se mélangent pas.
    let p = partie.replace(/\\text\{\s*ou\s*\}/g, ' §OU§ ').replace(/\\text\{\s*et\s*\}/g, ' §ET§ ').replace(/\\q?quad/g, ' ');
    if (/\\text|\\begin|\\neq|\\in|\\cup/.test(p)) return null;
    if (p.includes('§OU§') && p.includes('§ET§')) return null;
    const morceaux = p.split(/§OU§|§ET§/).map((s) => s.trim()).filter(Boolean);
    const relations = [], groupes = [];
    const unionDeMorceaux = p.includes('§OU§');
    let connecteur = unionDeMorceaux ? 'ou' : 'et';
    for (const morceau of morceaux) {
      // repère les opérateurs de relation (= < > ≤ ≥) au premier niveau
      // les opérateurs sont remplacés par des jetons sans « < » ni « = » pour ne pas se couper entre eux
      let marque = morceau;
      for (const [tex, sym] of OPS) marque = marque.split(tex).join(' §' + JETON[sym] + '§ ');
      marque = marque.replace(/=/g, ' §EQ§ ');
      const jetons = marque.split(/§(LE|GE|LT|GT|EQ)§/).map((x) => x.trim());
      // jetons : expr, op, expr, [op, expr]
      if (jetons.length < 3 || jetons.length % 2 === 0) return null;
      const indices = [];
      for (let i = 0; i + 2 < jetons.length; i += 2) { indices.push(relations.length); relations.push({ gauche: jetons[i], op: SYMBOLE[jetons[i + 1]], droite: jetons[i + 2] }); }
      groupes.push(indices);
    }
    // réunion : un groupe par morceau ; intersection : un seul groupe contenant toutes les relations
    return { relations, connecteur, groupes: unionDeMorceaux ? groupes : [groupes.flat()] };
  }
  function variableLibre(...analyses) {
    const lettres = new Set();
    for (const a of analyses) for (const r of a.relations) for (const t of [r.gauche, r.droite]) {
      const m = versMathjs(t);
      for (const id of m.matchAll(/[A-Za-z_][A-Za-z0-9_]*/g)) if (!FONCTIONS.has(id[0])) lettres.add(id[0]);
    }
    if (lettres.size !== 1) return null;
    return [...lettres][0];
  }
  function resoudre(a, v, borne) {
    // renvoie { racines: [...], vecteur: [booleens sur la grille], frontieres: Set d'indices }
    const N = 4800, pas = (2 * borne) / N;
    const fTout = a.relations.map((r) => { const g = math.compile(versMathjs(r.gauche)), d = math.compile(versMathjs(r.droite)); return (x) => { const sc = {}; sc[v] = x; return g.evaluate(sc) - d.evaluate(sc); }; });
    const valeursTout = fTout.map((fn) => { const w = new Array(N + 1); for (let i = 0; i <= N; i++) { const y = fn(-borne + i * pas + 0.00137); w[i] = isFinite(y) ? y : NaN; } return w; });
    // une égalité vraie pour tout x (identité, ex. x² - 1 = (x-1)(x+1), ou égalité numérique) n'apporte aucune condition : on l'écarte ;
    // une égalité constamment fausse rend la partie illisible (la chaîne d'égalités la signale séparément)
    const gardes = a.relations.map((r, k) => {
      const w = valeursTout[k].filter(isFinite);
      if (!w.length) return false;
      const amp = Math.max(...w.map(Math.abs)), constante = Math.max(...w) - Math.min(...w) < 1e-9 * (1 + amp);
      if (r.op === '=' && constante) { if (amp < 1e-9) return false; throw new Error('égalité constamment fausse'); }
      return true;
    });
    if (!gardes.some(Boolean)) throw new Error('aucune condition');
    const rels = a.relations.filter((r, k) => gardes[k]), f = fTout.filter((fn, k) => gardes[k]), valeurs = valeursTout.filter((w, k) => gardes[k]);
    let suivant = 0; const nk = gardes.map((g) => (g ? suivant++ : -1));   // indice d'une relation conservée (relations constantes écartées : -1)
    const racines = [], frontieres = new Set(), vecteur = new Array(N + 1);
    f.forEach((fn, k) => {
      for (let i = 0; i < N; i++) {
        const y0 = valeurs[k][i], y1 = valeurs[k][i + 1];
        if (!isFinite(y0) || !isFinite(y1) || y0 * y1 > 0) continue;
        let lo = -borne + i * pas + 0.00137, hi = lo + pas, flo = y0;
        for (let it = 0; it < 60; it++) { const mid = (lo + hi) / 2, fm = fn(mid); if (flo * fm <= 0) hi = mid; else { lo = mid; flo = fm; } }
        const r = (lo + hi) / 2;
        // un pôle (saut de signe sans annulation) n'est pas une racine
        if (Math.abs(fn(r)) > 1e-5 * (1 + Math.abs(y0) + Math.abs(y1))) { frontieres.add(i); frontieres.add(i + 1); continue; }
        racines.push({ r, k, op: rels[k].op });
        frontieres.add(i); frontieres.add(i + 1);
      }
      // racine double d'une équation (ex. x²(x-5) = 0 en 0) : la fonction s'annule sans changer de signe, minimum de |f| nul
      if (rels[k].op === '=') {
        for (let i = 1; i < N; i++) {
          const a0 = valeurs[k][i - 1], a1 = valeurs[k][i], a2 = valeurs[k][i + 1];
          if (![a0, a1, a2].every(isFinite) || a0 * a1 <= 0 || a1 * a2 <= 0) continue;   // changement de signe : traité plus haut
          if (!(Math.abs(a1) <= Math.abs(a0) && Math.abs(a1) <= Math.abs(a2))) continue;
          let lo = -borne + (i - 1) * pas + 0.00137, hi = lo + 2 * pas;
          for (let it = 0; it < 80; it++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (Math.abs(fn(m1)) < Math.abs(fn(m2))) hi = m2; else lo = m1; }
          const r = (lo + hi) / 2;
          if (Math.abs(fn(r)) < 1e-7 * (1 + Math.abs(a0) + Math.abs(a1) + Math.abs(a2))) racines.push({ r, k, op: '=' });
        }
      }
    });
    for (let i = 0; i <= N; i++) {
      const t = rels.map((r, k) => { const y = valeurs[k][i]; if (!isFinite(y)) return null; return r.op === '<' ? y < 0 : r.op === '>' ? y > 0 : r.op === '<=' ? y <= 0 : r.op === '>=' ? y >= 0 : null; });
      if (t.some((x) => x === null && true)) { vecteur[i] = null; continue; }
      vecteur[i] = a.groupes.some((g) => g.every((k) => nk[k] === -1 || t[nk[k]]));
    }
    // racines d'une relation d'égalité : solutions ; racines d'une inégalité : simples frontières
    const solutions = racines.filter((x) => x.op === '=').map((x) => x.r);
    const aEgalite = rels.some((r) => r.op === '=');
    return { solutions, aEgalite, vecteur, frontieres, racinesToutes: racines.map((x) => x.r) };
  }
  function verifierEquivalence(partieA, partieB) {
    const A = analyserPartie(partieA), B = analyserPartie(partieB);
    if (!A || !B) return { illisible: true };
    const v = variableLibre(A, B);
    if (!v) return { illisible: true };
    let RA, RB;
    // la fenêtre de recherche s'élargit avec les nombres écrits (x/72 > 5 a pour frontière x = 360)
    const nombres = (partieA + ' ' + partieB).match(/\d+(?:\.\d+)?/g) || [];
    const borne = Math.min(3000, Math.max(30, 1.5 * Math.max(0, ...nombres.map(Number))));
    try { RA = resoudre(A, v, borne); RB = resoudre(B, v, borne); } catch (er) { return { illisible: true }; }
    const tous = (R) => R.racinesToutes;
    const memeListe = (X, Y) => X.length === Y.length && X.every((x, i) => Math.abs(x - Y[i]) < 1e-5 * (1 + Math.abs(x)));
    if (RA.aEgalite || RB.aEgalite) {
      const sa = RA.aEgalite ? RA.solutions.slice().sort((p, q) => p - q) : null, sb = RB.aEgalite ? RB.solutions.slice().sort((p, q) => p - q) : null;
      if (sa && sb) {
        // les doublons proches (racine double) sont fusionnés
        const fus = (L) => L.filter((x, i) => i === 0 || Math.abs(x - L[i - 1]) > 1e-4);
        return memeListe(fus(sa), fus(sb)) ? { ok: true } : { faux: true, detail: 'solutions ' + fus(sa).map((x) => +x.toFixed(4)) + ' contre ' + fus(sb).map((x) => +x.toFixed(4)) };
      }
      return { illisible: true };
    }
    // inégalités : mêmes valeurs de vérité hors des frontières
    let ecarts = 0, comparees = 0, premier = null;
    for (let i = 0; i < RA.vecteur.length; i++) {
      let proche = false;
      for (let d = -2; d <= 2 && !proche; d++) if (RA.frontieres.has(i + d) || RB.frontieres.has(i + d)) proche = true;
      if (proche) continue;
      if (RA.vecteur[i] === null || RB.vecteur[i] === null) continue;
      comparees++;
      if (RA.vecteur[i] !== RB.vecteur[i]) { ecarts++; if (premier === null) premier = i; }
    }
    if (comparees < 200) return { illisible: true };
    return ecarts === 0 ? { ok: true } : { faux: true, detail: ecarts + ' points de désaccord, par exemple ' + v + ' ≈ ' + (-30 + premier * 0.0125).toFixed(2) };
  }

  // ---------- réponse finale ----------
  function comparerFinal(e) {
    const D = e.detail;
    const F = D.final;
    if (e.type === 'intervalle' && e.intervalleSpec) {
      const exact = formaterIntervalleSpec(e.intervalleSpec);
      if (!e.tolerance) return F === exact || F === exact.replace(/(\d)\.(\d)/g, '$1{,}$2') ? 'ok' : 'faux';
      // lecture graphique : bornes lues au dixième, comparées à la réponse exacte à 0,06 près, crochets identiques
      const spec = e.intervalleSpec;
      if (spec.type === 'vide') return F === '\\emptyset' ? 'ok' : 'faux';
      if (spec.type === 'tout') return F === '\\mathbb{R}' ? 'ok' : 'faux';
      const morceaux = String(F).split(/\\\s*\\cup\\\s*/).map((m) => m.trim());
      if (morceaux.length !== spec.liste.length) return 'faux';
      const borne = (t) => (/\\infty/.test(t) ? (t.includes('-') ? -Infinity : Infinity) : evaluer(t, 0));
      try {
        for (let i = 0; i < morceaux.length; i++) {
          const m = morceaux[i].match(/^([\[\]])(.+?)\\,;\\,(.+?)([\[\]])$/); if (!m) return 'faux';
          const iv = spec.liste[i], bas = borne(m[2]), haut = borne(m[3]);
          if ((m[1] === '[') !== !!iv.inclusBas || (m[4] === ']') !== !!iv.inclusHaut) return 'faux';
          if (!(bas === iv.bas || Math.abs(bas - iv.bas) <= 0.06) || !(haut === iv.haut || Math.abs(haut - iv.haut) <= 0.06)) return 'faux';
        }
        return 'ok';
      } catch (er) { return 'non-verifiable'; }
    }
    // valeur lue sur un graphique (type approx) : à la tolérance près de la valeur attendue (ou de l'une des valeurs possibles)
    if (e.type === 'approx' && e.valeurApprox !== undefined) {
      try {
        const v = evaluer(String(F).replace(/\\approx\s*/g, ''), 0), tol = (e.tolerance || 0) + 1e-9;
        return (Array.isArray(e.valeurApprox) ? e.valeurApprox : [e.valeurApprox]).some((c) => Math.abs(v - c) <= tol) ? 'ok' : 'faux';
      } catch (er) { return 'non-verifiable'; }
    }
    // tableau de variations : seuils x, valeurs g(x) et flèches \nearrow / \searrow
    if (e.type === 'tableauVariations' && e.seuils) {
      const corps = String(F).replace(/^\\(?:small|scriptsize)\s*\\begin\{array\}\{[^}]*\}/, '').replace(/\\end\{array\}\s*$/, '');
      const lg = corps.split('\\\\ \\hline ').map((r) => r.split(' & ').map((c) => c.trim()));
      const k = e.seuils.length;
      if (lg.length !== 2 || lg[0].length !== 2 * k || lg[1].length !== 2 * k) return 'faux';
      try {
        for (let j = 0; j < k; j++) {
          if (!egal(evaluer(lg[0][1 + 2 * j], 0), e.seuils[j].x) || !egal(evaluer(lg[1][1 + 2 * j], 0), e.seuils[j].y)) return 'faux';
          if (j < k - 1 && lg[1][2 + 2 * j] !== (e.seuils[j + 1].y > e.seuils[j].y ? '\\nearrow' : '\\searrow')) return 'faux';
        }
        return 'ok';
      } catch (er) { return 'non-verifiable'; }
    }
    // deux droites parallèles distinctes : aucun point d'intersection
    if (e.type === 'paire' && e.aucunPoint) return F === "\\text{aucun point d'intersection}" ? 'ok' : 'faux';
    // tableau croisé à compléter : les effectifs des cases à compléter, dans l'ordre de aCompleter
    // (« 28 \text{ et } 12 », ou « \left(28\,;\,12\,;\,6\,;\,54\right) » ; les milliers « 2\,700 » sont recollés)
    if (e.type === 'tableauCroiseRempli' && e.tcr) {
      const nombres = (String(F).replace(/(\d)\\,(\d{3})(?!\d)/g, '$1$2').match(/-?\d+/g) || []).map(Number), att = e.tcr.aCompleter.map(({ i, j }) => e.tcr.cellules[i][j]);
      return nombres.length === att.length && nombres.every((v, k) => v === att[k]) ? 'ok' : 'faux';
    }
    // tableau de programme de calcul : « image \text{ et } antécédent »
    if (e.type === 'tableauProgramme') {
      const m = String(F).replace(/\s/g, '').match(/^(-?\d+)\\text\{et\}(-?\d+)$/);
      return m && Number(m[1]) === e.resultatK3 && Number(m[2]) === e.x0 ? 'ok' : 'faux';
    }
    // couples, vecteurs, triplets : « (a ; b) »
    const liste = (s) => String(s).replace(/\\left|\\right/g, '').replace(/\\[,;! ]/g, ' ').replace(/^\s*\(|\)\s*$/g, '').split(/;/).map((x) => x.trim());
    const cibleListe = e.type === 'paire' ? [e.pa, e.pb] : e.type === 'vecteur' ? [e.vx, e.vy] : e.type === 'triplet' ? [e.ta, e.tb, e.tc] : null;
    if (cibleListe && cibleListe.every((x) => x !== undefined)) {
      const L = String(F).replace(/\\left|\\right/g, '').replace(/\\,/g, '').replace(/^\s*\(|\)\s*$/g, '').split(/;/);
      if (L.length !== cibleListe.length) return 'faux';
      for (let i = 0; i < L.length; i++) {
        try { const a = math.evaluate(String(cibleListe[i]).replace(/\^/g, '^')), b = evaluer(L[i], 0); if (!egal(a, b)) return 'faux'; } catch (er) { return 'non-verifiable'; }
      }
      return 'ok';
    }
    // encadrement « a < expression < b » : seules les deux bornes et le caractère strict ou large de chaque côté comptent
    if (e.type === 'encadrement') {
      const m = String(F).replace(/\\lt\s*/g, '<').replace(/\\leqslant\s*/g, '<=').match(/^(.+?)(<=|<)(.+)(<=|<)(.+)$/);
      if (!m) return 'faux';
      try {
        const bas = evaluer(m[1], 0), haut = evaluer(m[5], 0);
        return (m[2] === '<=') === !!e.inclusBas && (m[4] === '<=') === !!e.inclusHaut && Math.abs(bas - e.bas) < 1e-9 && Math.abs(haut - e.haut) < 1e-9 ? 'ok' : 'faux';
      } catch (er) { return 'non-verifiable'; }
    }
    // pourcentages et écarts en points : la valeur écrite (sans « % ») est comparée au nombre attendu, à la tolérance de la fiche près
    const cibleNum = e.reponsePourcent !== undefined ? e.reponsePourcent : e.reponsePoints != null ? e.reponsePoints : e.pourcentageAttendu !== undefined ? e.pourcentageAttendu : undefined;
    if (cibleNum !== undefined) {
      try {
        const v = evaluer(String(F).replace(/\\approx\s*/g, '').replace(/\\,?\s*\\%/g, ''), 0);
        return Math.abs(v - cibleNum) <= Math.max(e.tolerancePourcent || 0, e.tolerancePoints ? 0.05 : 0, 1e-6) ? 'ok' : 'faux';
      } catch (er) { return 'non-verifiable'; }
    }
    // |x - a| op r (type valAbs) : centre, sens et rayon (20/10/2026)
    if (e.type === 'valAbs' && e.aAttendu !== undefined) {
      const m = String(F).replace(/\\lt\s*/g, '<').replace(/\\leqslant\s*/g, '<=').replace(/\\geqslant\s*/g, '>=').replace(/\\gt\s*/g, '>').replace(/\s+/g, '').match(/^\|x(?:([+-][\d{},.]+))?\|(<=|>=|<|>)([\d{},.]+)$/);
      if (!m) return 'faux';
      try {
        const decalage = m[1] ? evaluer(m[1], 0) : 0;
        return Math.abs(-decalage - e.aAttendu) < 1e-9 && m[2] === e.sensAttendu && Math.abs(evaluer(m[3], 0) - e.rAttendu) < 1e-9 ? 'ok' : 'faux';
      } catch (er) { return 'non-verifiable'; }
    }
    // inégalité portant sur x (« x \gt -7 ») : sens et seuil (20/10/2026)
    if (e.type === 'ineq' && e.sens !== undefined && e.seuil !== undefined) {
      const m = String(F).replace(/\\lt\s*/g, '<').replace(/\\leqslant\s*/g, '<=').replace(/\\geqslant\s*/g, '>=').replace(/\\gt\s*/g, '>').replace(/\s+/g, '').match(/^x(<=|>=|<|>)(.+)$/);
      if (!m) return 'faux';
      try { return m[1] === e.sens && Math.abs(evaluer(m[2], 0) - e.seuil) < 1e-9 ? 'ok' : 'faux'; } catch (er) { return 'non-verifiable'; }
    }
    // oui / non (reponseOuiNon booléen) ; plus petit ensemble de nombres (\mathbb{N}, \mathbb{Z}, \mathbb{D}, \mathbb{Q}, \mathbb{R}) ;
    // écriture scientifique a\times 10^{n} : mantisse et exposant exacts (20/10/2026)
    if (e.type === 'ouiNon' && typeof e.reponseOuiNon === 'boolean') return String(F).replace(/\\text\{([^{}]*)\}/g, '$1').trim().toLowerCase() === (e.reponseOuiNon ? 'oui' : 'non') ? 'ok' : 'faux';
    if (e.type === 'ensembleNombre') return String(F).replace(/\s/g, '') === '\\mathbb{' + e.ensemble + '}' ? 'ok' : 'faux';
    if (e.type === 'ecritureSci') {
      const m = String(F).replace(/\s/g, '').match(/^(-?[\d{},]+)\\times10(?:\^\{(-?\d+)\})?$/);          // « a\times 10 » : exposant 1
      if (!m) return 'faux';
      return Math.abs(Number(m[1].replace('{,}', '.')) - e.mantisse) < 1e-9 && (m[2] === undefined ? 1 : Number(m[2])) === e.exposant ? 'ok' : 'faux';
    }
    if (typeof e.reponse !== 'string') return 'non-verifiable';
    // réponses textuelles (« > », « < », « oui », « non ») : comparées telles quelles
    if (e.type === 'texte') {
      const norm = (s) => String(s).replace(/\\text\{([^{}]*)\}/g, '$1').replace(/\\lt\s*/g, '<').replace(/\\gt\s*/g, '>').replace(/_\{(\d)\}/g, '$1').replace(/\s+/g, '').toLowerCase();
      return norm(F) === norm(e.reponse) ? 'ok' : 'faux';
    }
    const rep = e.reponse.trim();
    // couple ou triplet écrit « (6;36) » dans une réponse de type num
    if (/^\(.+;.+\)$/.test(rep)) {
      const A = rep.slice(1, -1).split(';'), L = String(F).replace(/\\left|\\right/g, '').replace(/\\,/g, '').replace(/^\s*\(|\)\s*$/g, '').split(';');
      if (A.length !== L.length) return 'faux';
      try { return A.every((a, i) => egal(math.evaluate(a), evaluer(L[i], 0))) ? 'ok' : 'faux'; } catch (er) { return 'non-verifiable'; }
    }
    if (rep.startsWith('{')) {
      try {
        const A = rep.slice(1, -1).split(';').filter((s) => s.trim()).map((x) => math.evaluate(x.replace(',', '.'))).sort((p, q) => p - q);
        const interieur = String(F).replace(/\\left\\\{|\\right\\\}/g, '').replace(/\\[,;! ]/g, '').replace(/\\\{|\\\}/g, '');
        const B = /^\s*(\\emptyset|\\varnothing)\s*$/.test(String(F)) ? [] : interieur.split(';').filter((s) => s.trim()).map((x) => evaluer(x, 0)).sort((p, q) => p - q);
        const tol = e.margeLecture ? e.margeLecture + 1e-9 : 0;      // lecture graphique : valeurs lues au dixième
        return A.length === B.length && A.every((v, i) => (tol ? Math.abs(v - B[i]) <= tol : egal(v, B[i]))) ? 'ok' : 'faux';
      } catch (er) { return 'non-verifiable'; }
    }
    try {
      for (let k = 0; k < NB_PORTEES; k++) {
        const m = versMathjs(String(F).replace(/^\s*(?:y|f\(x\))\s*=\s*/, '')), sc = portee(m + ' + ' + rep, k);     // équation réduite « y = mx + p » ou « f(x) = mx + p » : on compare mx + p
        const a = math.evaluate(rep, sc), b = math.evaluate(m, sc);
        if (typeof a !== 'number' || typeof b !== 'number' || !isFinite(a) || !isFinite(b)) return 'non-verifiable';
        if (!egal(a, b)) return 'faux';
      }
      return 'ok';
    } catch (er) { return 'non-verifiable'; }
  }

  // ---------- style ----------
  function styler(e, l) {
    const sansTexte = l.replace(/\\text\{[^{}]*\}/g, ' ');
    const m = [];
    if (/\\dfrac\{[^{}]*\}\{1\}(?!\d)/.test(sansTexte)) m.push(['erreur', 'fraction-denominateur-1']);
    if (/\\dfrac\{[^{}]*\}\{0\}(?![\d.])/.test(sansTexte)) m.push(['erreur', 'denominateur-nul']);
    if (/NaN|undefined|Infinity|null/.test(sansTexte)) m.push(['erreur', 'valeur-invalide']);   // hors des blocs de texte (« nulle » contient « null »)
    if (/\^\{1\}(?!\d)/.test(sansTexte)) m.push(['erreur', 'exposant-1']);
    if (/\+\s*-|-\s*-|-\s*\+|\+\s*\+/.test(sansTexte.replace(/\\[a-zA-Z]+/g, '').replace(/\^\{-/g, '^{').replace(/\\left\(|\\right\)|\([^()]*\)/g, '(x)'))) m.push(['erreur', 'signes-doubles']);
    // coefficient 1 écrit devant une lettre (« 1n », « 1\,r », « 1\times r », « 1\left(… »). Les blocs de texte et les ⟺ sont remplacés par un jeton
    // (§) pour ne pas être pris pour une multiplication implicite : « = -1 \text{ ou } x = 1 » est correct.
    const epure = l.replace(/\\text\{[^{}]*\}|\\iff|\\q?quad/g, ' § ').replace(/[uv]_\{?[0-9a-z+\-]*\}?/g, 'U');
    if (/(^|[^0-9.,{}_\\A-Za-z§])1\s*(?:\\times|\\,)?\s*(?:[a-zA-Z](?![a-zA-Z])|\\left\()/.test(epure)) m.push(['erreur', 'coefficient-1']);
    if (/(^|[^0-9.,{}_\\A-Za-z§])-1\s*(?:\\times|\\,)?\s*[a-zA-Z](?![a-zA-Z])/.test(epure)) m.push(['erreur', 'coefficient-moins-1']);
    if (/\d,\d/.test(sansTexte)) m.push(['erreur', 'virgule-nue-en-zone-math']);
    if (/<[a-zA-Z/!]/.test(l)) m.push(['erreur', 'chevron-brut']);
    const o = (l.match(/\{/g) || []).length - (l.match(/\}/g) || []).length;
    if (o !== 0 && !/\\left\\\{|\\right\\\}|\\\{|\\\}/.test(l)) m.push(['erreur', 'accolades-desequilibrees']);
    const g = (l.match(/\\left/g) || []).length - (l.match(/\\right/g) || []).length;
    if (g !== 0) m.push(['erreur', 'left-right-desequilibres']);
    // numérateur négatif sur un dénominateur purement numérique : le signe va devant la fraction (-\dfrac{3}{4}) ; sur un dénominateur littéral c'est la formule
    if (/\\dfrac\{-\d+\}\{\d+\}/.test(sansTexte) && !/\\begin/.test(l)) m.push(['style', 'signe-au-numerateur']);
    if (/\\dfrac\{[^{}]*\}\{[^{}]*\}\\times\s*\{?\s*(?:[A-Za-z]|\\sqrt)/.test(sansTexte)) m.push(['style', 'multiplication-apres-fraction']);
    if (/\\text\{[^{}]*\d [%€][^{}]*\}/.test(l) || /\\text\{[^{}]*\d%[^{}]*\}/.test(l)) m.push(['style', 'espace-avant-pourcent']);
    if (/\\text\{[^{}]*\{,\}[^{}]*\}/.test(l)) m.push(['style', 'virgule-latex-en-texte']);
    if (l.replace(/\s+/g, '').length > 170 && !/\\begin\{array\}/.test(l)) m.push(['style', 'ligne-tres-longue']);   // (un tableau ne se raccourcit pas)
    for (const [gr, motif] of m) ajouter(gr, motif, e, l);
  }

  // ---------- tableaux de signes (20/10/2026) : lignes de facteurs, produit, ensemble de solutions ----------
  // Un tableau `\begin{array}{c|…} x & -\infty & … \\ \hline étiquette & … \\ \hline …` est relu. Chaque ligne dont l'étiquette est une
  // expression de x (3x+14, (x-2)^2…) doit avoir le signe de cette expression entre les racines de l'en-tête et un 0 sous sa seule
  // racine ; la ligne finale (étiquette \text{signe}, E(x)…) est le produit des lignes de facteurs, avec 0 ou double barre exactement
  // sous les racines des facteurs ; enfin, si l'exercice porte un intervalleSpec et une ligne « pour lesquelles … op 0 », l'ensemble
  // de solutions lu sur la ligne finale (racines comprises, selon le sens large ou strict) est celui de la réponse attendue.
  function problemesTableauSignes(e, tex, lignes) {
    const probl = [];
    const corps = tex.replace(/^\\(?:small|scriptsize)\s*\\begin\{array\}\{[^}]*\}/, '').replace(/\\end\{array\}\s*$/, '');
    const L = corps.split('\\\\ \\hline ').map((r) => r.replace(/\\\\\s*$/, '').split(' & ').map((c) => c.trim()));
    const entete = L[0];
    if (L.length < 2 || entete[0] !== 'x') return null;                 // null : tableau non vérifiable automatiquement
    const racinesTex = []; for (let j = 3; j < entete.length - 2; j += 2) racinesTex.push(entete[j]);
    if (racinesTex.some((t) => /[A-Za-z]/.test(t.replace(/\\[a-zA-Z]+/g, '')))) return null;     // racine littérale (discussion selon un paramètre)
    let racines; try { racines = racinesTex.map((t) => evaluer(t, 0)); } catch (er) { return ['racine illisible']; }
    const k = racines.length;
    if (!k) return null;
    for (let j = 1; j < k; j++) if (!(racines[j] > racines[j - 1])) probl.push('racines non croissantes');
    const echant = (i) => (i === 0 ? racines[0] - 1 : i === k ? racines[k - 1] + 1 : (racines[i - 1] + racines[i]) / 2);
    const corpsLignes = L.slice(1);
    if (corpsLignes.some((r) => r.length !== 2 * k + 4)) return ['ligne de longueur inattendue'];
    const evalX = (label, x) => { const v = math.evaluate(versMathjs(label), { x }); if (typeof v !== 'number' || !isFinite(v)) throw new Error('non fini'); return v; };
    // une étiquette « \text{signe} » ou « E(x) » (math.js lit E comme le nombre d'Euler) désigne la ligne finale, pas un facteur
    const estFacteur = (label) => { if (/^\\text\{|^[A-Za-z]\(x\)$/.test(label)) return false; try { evalX(label, 1.7); return true; } catch (er) { return false; } };
    const signesDe = (r) => { const s = []; for (let i = 0; i <= k; i++) s.push(r[2 + 2 * i]); return s; };
    const marquesDe = (r) => { const m = []; for (let j = 0; j < k; j++) m.push(r[3 + 2 * j]); return m; };
    const eq = (u, v) => Math.abs(u - v) < 1e-9;
    const rangees = corpsLignes.filter((r) => estFacteur(r[0]));
    if (!rangees.length) return null;      // lignes f(x), g(x)… lues sur un graphique : signes non recalculables ici (vérifiés par l'essai indépendant de la fiche)
    const finale = estFacteur(corpsLignes[corpsLignes.length - 1][0]) ? null : corpsLignes[corpsLignes.length - 1];
    rangees.forEach((r) => {
      const s = signesDe(r), m = marquesDe(r);
      for (let i = 0; i <= k; i++) { const v = evalX(r[0], echant(i)); if ((v > 0 ? '+' : '-') !== s[i]) probl.push('signe de ' + r[0] + ' sur l\'intervalle ' + (i + 1)); }
      for (let j = 0; j < k; j++) { const estZero = Math.abs(evalX(r[0], racines[j])) < 1e-9; if ((m[j] === '0') !== estZero) probl.push('zéro de ' + r[0] + ' sous la racine ' + (j + 1)); }
    });
    if (finale) {
      const s = signesDe(finale), m = marquesDe(finale);
      for (let i = 0; i <= k; i++) { let p = 1; rangees.forEach((r) => { p *= signesDe(r)[i] === '+' ? 1 : -1; }); if ((p > 0 ? '+' : '-') !== s[i]) probl.push('signe de la ligne finale sur l\'intervalle ' + (i + 1)); }
      for (let j = 0; j < k; j++) { const aZero = rangees.some((r) => marquesDe(r)[j] === '0'); if (aZero !== (m[j] === '0' || m[j] === '\\Vert')) probl.push('marque de la ligne finale sous la racine ' + (j + 1)); }
      const spec = e.intervalleSpec, ligneOp = lignes.find((l) => /pour lesquelles/.test(l));
      const mo = ligneOp && ligneOp.match(/(\\geqslant|\\leqslant|\\lt|>|<)\s*\\ 0\s*$/);
      if (spec && spec.liste && mo) {
        const positif = mo[1] === '>' || mo[1] === '\\geqslant', large = mo[1] === '\\geqslant' || mo[1] === '\\leqslant';
        const dans = (t) => spec.liste.some((iv) => {
          const bas = iv.bas == null ? -Infinity : iv.bas, haut = iv.haut == null ? Infinity : iv.haut;
          return (t > bas + 1e-9 || (eq(t, bas) && iv.inclusBas)) && (t < haut - 1e-9 || (eq(t, haut) && iv.inclusHaut));
        });
        for (let i = 0; i <= k; i++) if (((s[i] === '+') === positif) !== dans(echant(i))) probl.push('intervalle ' + (i + 1) + ' : la ligne finale ne donne pas la réponse attendue');
        for (let j = 0; j < k; j++) if ((m[j] === '0' && large) !== dans(racines[j])) probl.push('racine ' + (j + 1) + ' : la ligne finale ne donne pas la réponse attendue');
      }
    }
    return probl;
  }

  // ---------- vérification complète d'un détail (sans effet de bord) ----------
  function verifierDetail(e, D, ctx) {
    const trouves = [];
    const noter = (gr, motif, ex) => trouves.push({ gr, motif, ex });
    if (!Array.isArray(D.lignes) || !D.lignes.length || D.lignes.some((l) => typeof l !== 'string' || !l.trim())) noter('erreur', 'lignes-invalides', JSON.stringify(D.lignes).slice(0, 120));
    if (typeof D.final !== 'string' || !D.final.trim()) noter('erreur', 'final-absent', '');
    if (trouves.length) return trouves;
    const norm = (s) => s.replace(/\\lt /g, '<');
    if (!norm(D.lignes[D.lignes.length - 1]).includes(norm(D.final))) noter('erreur', 'derniere-ligne-sans-final', D.lignes[D.lignes.length - 1] + '  /  final = ' + D.final);
    const cmp = comparerFinal({ ...e, detail: D });
    if (cmp === 'faux') noter('erreur', 'final-different-de-la-reponse', 'final = ' + D.final + '  /  reponse = ' + (e.reponse !== undefined ? e.reponse : '') );
    ctx.finalVerifie += cmp === 'ok' ? 1 : 0; ctx.finalNonVerifiable += cmp === 'non-verifiable' ? 1 : 0;
    for (const lt of D.lignes) {
      if (!/^\\(?:small|scriptsize)\s*\\begin\{array\}\{c\|/.test(lt)) continue;
      const pb = problemesTableauSignes(e, lt, D.lignes);
      if (pb === null) continue;
      if (pb.length) noter('erreur', 'tableau-de-signes-incorrect', pb.slice(0, 2).join(' ; ') + '  —  ' + lt.slice(0, 110));
      else ctx.tableaux = (ctx.tableaux || 0) + 1;
    }
    let precedent = null;       // dernière partie de la ligne précédente : une ligne qui commence par ⟺ la prolonge
    let dernierMembre = null;     // dernier membre de la ligne précédente : une ligne qui commence par « = » le reprend
    for (const [idxL, l0] of D.lignes.entries()) {
      ctx.lignes++;
      let l = l0;
      if (/^\s*=(?!=)/.test(l0) && dernierMembre) l = dernierMembre + ' ' + l0.trim();
      dernierMembre = /\\iff|\\Leftrightarrow|\\text|\\begin|\\q?quad/.test(l) ? null : l.split('=').pop().trim();
      // une ligne suivie d'une ligne qui commence par ⟺ est la première partie d'une équivalence : « A = B » littéral y est une équation à résoudre
      const prolongee = idxL + 1 < D.lignes.length && /^\s*(\\iff|\\Leftrightarrow)/.test(D.lignes[idxL + 1]);
      if (/\\begin/.test(l)) { precedent = null; continue; }                    // tableau de signes : relu à la main
      const clauses = l.split(/\\q?quad/);
      for (const clause of clauses) {
        const parties = clause.split(/\\iff|\\Leftrightarrow/);
        if (parties.length > 1 && !parties[0].trim() && precedent) parties[0] = precedent;
        // chaînes d'égalités dans chaque partie (les parties avec du texte libre sont ignorées, sauf « ou » et les symboles)
        parties.forEach((p) => {
          if (!p.trim()) return;
          if (/\\begin|\\neq|\\cup|\\in\b/.test(p)) return;
          // le texte libre (hors « ou ») coupe la ligne en morceaux de formules, chacun contrôlé séparément ;
          // un morceau se termine parfois par une ponctuation (« r = 11 - 9 = 2. »)
          const pieces = p.split(/\\text\{(?!\s*ou\s*\})[^{}]*\}/).map((s) => s.replace(/[.,;:]\s*$/, '').trim()).filter(Boolean);
          pieces.forEach((piece) => {
            const morceaux = /\\text\{\s*ou\s*\}/.test(piece) ? piece.split(/\\text\{\s*ou\s*\}/) : [piece];
            morceaux.forEach((q) => { const r = verifierChaine(q, e.enonce, parties.length > 1 || prolongee); if (r === null) return; if (r.illisible) { ctx.chainesIllisibles++; const ill = stats.illisiblesEx || (stats.illisiblesEx = {}); const o = ill[e.id] || (ill[e.id] = { n: 0, ex: q }); o.n++; } else { ctx.chaines++; if (r.faux) noter('erreur', 'chaine-d-egalites-fausse', r.valeurs); } });
          });
        });
        for (let i = 0; i + 1 < parties.length && ctx.equivActif !== false; i++) {
          if (!parties[i].trim() || !parties[i + 1].trim()) continue;
          if (/\\text\{(?!\s*ou\s*\})/.test(parties[i] + parties[i + 1])) { ctx.equivalencesIllisibles++; continue; }
          const cleEq = parties[i].trim() + '§' + parties[i + 1].trim();
          if (ctx.equivVues) { if (ctx.equivVues.has(cleEq)) continue; ctx.equivVues.add(cleEq); }
          const r = verifierEquivalence(parties[i], parties[i + 1]);
          if (r.illisible) { ctx.equivalencesIllisibles++; const ill = stats.illisiblesEx || (stats.illisiblesEx = {}); const o = ill[e.id + ' (équivalence)'] || (ill[e.id + ' (équivalence)'] = { n: 0, ex: parties[i].trim() + '  ⟺  ' + parties[i + 1].trim() }); o.n++; } else { ctx.equivalences++; if (r.faux) noter('erreur', 'equivalence-fausse', parties[i] + '  ⟺  ' + parties[i + 1] + '   =>   ' + r.detail); }
        }
      }
      // assertions propres aux phrases (outils/phrases-details/assertions.js) : la condition qu'une phrase affirme doit être vraie dans ce tirage
      for (const A of ctx.assertions || []) {
        if (!A.motif.test(l)) continue;
        let ok; try { ok = A.verifie(l, e, ctx.environnement); } catch (er) { ok = false; }
        if (ok === null || ok === undefined) continue;
        ctx.assertionsVerifiees = (ctx.assertionsVerifiees || 0) + 1;
        if (ok === false) noter('erreur', 'assertion-fausse : ' + A.nom, l);
      }
      // une ligne réduite à un texte (« On divise par … ») n'interrompt pas l'enchaînement des équivalences
      if (!(/^\s*\\text\{/.test(l) && !/=|\\iff/.test(l))) precedent = clauses.length === 1 ? l.split(/\\iff|\\Leftrightarrow/).pop() : null;
    }
    return trouves;
  }

  // ---------- compilation MathJax ----------
  async function compilerMathJax(l) {
    if (!window.MathJax || !(MathJax.tex2svg || MathJax.tex2chtml)) return null;     // sortie SVG (Première) ou CHTML (Seconde)
    try {
      const n = (MathJax.tex2svg || MathJax.tex2chtml)(l.replace(/\\lt /g, '\\lt '));
      const erreur = n.querySelector('[data-mml-node="merror"], mjx-merror');
      if (erreur) return (erreur.getAttribute('data-mjx-error') || erreur.textContent || 'erreur MathJax');
      return null;
    } catch (er) { return String(er.message || er); }
  }
  if (window.MathJax && MathJax.startup && MathJax.startup.promise) { try { await MathJax.startup.promise; } catch (er) { /* sans MathJax */ } }
  const motifsVus = new Set();

  // ---------- boucle de tirages ----------
  const phrases = new Map(), exemples = new Map(), idsAvecDetail = new Set(), idsSansDetail = new Set(), echantillons = [];
  stats.equivVues = new Set();
  stats.environnement = { texte: (id) => { const n = document.getElementById(id); return n ? n.textContent : ''; } };
  stats.assertions = (opts.assertions || []).map((a) => ({ nom: a.nom, motif: new RegExp(a.motif), verifie: (0, eval)('(' + a.verifie + ')') }));
  stats.assertionsVerifiees = 0;
  for (let k = 0; k < opts.tirages; k++) {
    let ex; try { ex = generer(); } catch (er) { ajouter('erreur', 'generation-en-erreur', { id: '(fiche)' }, er.message); continue; }
    stats.tirages++;
    stats.equivActif = k < opts.tiragesEquivalences;      // la résolution numérique des équivalences est coûteuse : sur les premiers tirages seulement
    for (const e of ex) {
      stats.exercices++;
      if (!e.detail) { idsSansDetail.add(e.id); continue; }
      stats.avecDetail++; idsAvecDetail.add(e.id);
      const D = e.detail;
      if (D.lignes && D.lignes.length) {
        for (const l of D.lignes) {
          styler(e, l);
          // phrase « en clair » : le texte des \text{…} dans l'ordre, les formules étant remplacées par […]
          if (/\\text\{/.test(l)) {
            const clair = String(l).replace(/^\\small\s*/, '').split(/(\\text\{[^{}]*\})/).map((s) => (/^\\text\{/.test(s) ? s.slice(6, -1) : (s.replace(/[\s\\,;:]/g, '') ? ' […] ' : ' '))).join('').replace(/\s+/g, ' ').replace(/\\lt\s*/g, '<').trim();
            if (!phrases.has(clair)) phrases.set(clair, { ids: new Set(), exemple: l, enonce: String(e.enonce).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), lignes: D.lignes.slice() });
            phrases.get(clair).ids.add(e.id);
          }
          const motif = l.replace(/\d+/g, '0');
          if (!motifsVus.has(motif)) { motifsVus.add(motif); const er = await compilerMathJax(l); stats.motifsLaTeX++; if (er) ajouter('erreur', 'latex-invalide', e, l + '   =>   ' + er); }
        }
      }
      for (const t of verifierDetail(e, D, stats)) ajouter(t.gr, t.motif, e, t.ex);
      const nb = exemples.get(e.id) || [];
      if (nb.length < opts.exemples && !nb.some((x) => JSON.stringify(x.lignes) === JSON.stringify(D.lignes))) {
        let rep = ''; try { rep = formaterReponse(e); } catch (er) { /* sans corrigé */ }
        nb.push({ enonce: e.enonce, reponse: rep, lignes: D.lignes });
        exemples.set(e.id, nb);
      }
      if (echantillons.length < 1200 && k < 150) echantillons.push({ e, D });
    }
  }
  for (const id of idsAvecDetail) idsSansDetail.delete(id);

  // ---------- auto-test : l'outil doit détecter une erreur volontaire ----------
  const autotest = {};
  if (opts.autotest) {
    const compte = (nom, f, desc) => { const r = autotest[nom] || (autotest[nom] = { essais: 0, detectes: 0, rates: [] }); r.essais++; if (f()) r.detectes++; else if (desc && r.rates.length < 6) r.rates.push(desc.slice(0, 160)); };
    const chiffreAlterne = (s) => { const i = [...s.matchAll(/\d+/g)].pop(); if (!i) return null; const nombre = String(+i[0] + 1); return s.slice(0, i.index) + nombre + s.slice(i.index + i[0].length); };
    for (const { e, D } of echantillons) {
      const ctx = { finalVerifie: 0, finalNonVerifiable: 0, lignes: 0, chaines: 0, chainesIllisibles: 0, equivalences: 0, equivalencesIllisibles: 0, equivActif: false };
      const copie = () => ({ lignes: D.lignes.slice(), final: D.final });
      // M1 : la réponse finale (dernière ligne et final) est décalée
      if (e.type !== 'intervalle' && !Array.isArray(e.valeurApprox) && !e.margeLecture && !e.tolerance && comparerFinal({ ...e, detail: D }) === 'ok') {   // (plusieurs antécédents possibles : le chiffre décalé peut en être un autre)
        const M = copie(); const n = chiffreAlterne(D.final);
        if (n && n !== D.final) { M.final = n; M.lignes[M.lignes.length - 1] = D.lignes[D.lignes.length - 1].replace(D.final, n); compte('reponse-finale-decalee', () => verifierDetail(e, M, ctx).some((t) => t.motif === 'final-different-de-la-reponse')); }
      }
      // M2 : un nombre d'une chaîne d'égalités numérique est modifié
      D.lignes.forEach((l, i) => {
        if (/\\iff|\\text|\\begin|\\q?quad/.test(l) || !l.includes('=')) return;
        const segs = l.split('='); if (segs.length < 2) return;
        const dernier = segs[segs.length - 1]; const n = chiffreAlterne(dernier); if (!n || n === dernier) return;
        const r0 = verifierChaine(l); if (!r0 || !r0.ok) return;
        const M = copie(); M.lignes[i] = segs.slice(0, -1).join('=') + '=' + n;
        compte('chaine-modifiee', () => { const r = verifierChaine(M.lignes[i]); return r && r.faux; }, `${e.id} : ${l}`);
      });
      // M3 : un nombre de la seconde partie d'une équivalence est modifié
      D.lignes.forEach((l) => {
        if (!/\\iff/.test(l) || /\\q?quad|\\begin/.test(l)) return;
        const parties = l.split('\\iff'); if (parties.length < 2) return;
        const r0 = verifierEquivalence(parties[0], parties[1]); if (!r0.ok) return;
        // on change le CHIFFRE DES UNITÉS ou, pour un grand nombre, son premier chiffre (un écart de 1 sur « x < 316 » est trop fin pour la grille)
        const dernier = [...parties[1].matchAll(/\d+/g)].pop();
        const n = !dernier ? null : dernier[0].length >= 3
          ? parties[1].slice(0, dernier.index) + String((+dernier[0][0] % 9) + 1) + dernier[0].slice(1) + parties[1].slice(dernier.index + dernier[0].length)
          : chiffreAlterne(parties[1]);
        if (!n || n === parties[1]) return;
        compte('equivalence-modifiee', () => { const r = verifierEquivalence(parties[0], n); if (r.faux) return true; const rc = verifierChaine(n, null, true); return !!(rc && rc.faux); }, `${e.id} : ${parties[0].trim()} ⟺ ${n.trim()}`);
      });
      // M4 : une accolade fermante supprimée => MathJax doit refuser
      // (une accolade d'ensemble « \} » est un symbole, non un groupe : sa suppression laisse un « \ » final que MathJax accepte, on ne la retient pas)
      const derniereAccolade = (x) => { for (let i = x.length - 1; i >= 0; i--) if (x[i] === '}' && x[i - 1] !== '\\') return i; return -1; };
      if (window.MathJax && (MathJax.tex2svg || MathJax.tex2chtml) && D.lignes.some((l) => derniereAccolade(l) >= 0)) {
        const l = D.lignes.find((x) => derniereAccolade(x) >= 0); const k = derniereAccolade(l), mut = l.slice(0, k) + l.slice(k + 1);
        compte('accolade-supprimee', () => { try { const nn = (MathJax.tex2svg || MathJax.tex2chtml)(mut); return !!nn.querySelector('[data-mml-node="merror"], mjx-merror'); } catch (er) { return true; } });
      }
      // M6 : un signe de la ligne finale, puis d'une ligne de facteur, est inversé dans un tableau de signes => le tableau doit être refusé
      D.lignes.forEach((l, i) => {
        const mt = l.match(/^(\\(?:small|scriptsize)\s*\\begin\{array\}\{c\|[^}]*\})(.*)\\end\{array\}\s*$/);
        const avant = mt ? problemesTableauSignes(e, l, D.lignes) : null;
        if (!avant || avant.length) return;                                           // seulement un tableau vérifiable et jugé correct avant la mutation
        const rows = mt[2].split('\\\\ \\hline ').map((r) => r.replace(/\\\\\s*$/, '').trim().split(' & '));
        if (rows.length < 2) return;
        [rows.length - 1, 1].forEach((li, nom) => {
          const R = rows.map((r) => r.slice()); const c = R[li][2]; if (c !== '+' && c !== '-') return;
          R[li][2] = c === '+' ? '-' : '+';
          const M = copie(); M.lignes[i] = mt[1] + R.map((r) => r.join(' & ')).join(' \\\\ \\hline ') + ' \\end{array}';
          compte(nom === 0 ? 'tableau-signe-final-inverse' : 'tableau-signe-facteur-inverse', () => verifierDetail(e, M, ctx).some((t) => t.motif === 'tableau-de-signes-incorrect'), `${e.id} : ${l.slice(0, 80)}`);
        });
      });
      // M5 : un coefficient 1 est introduit
      { const l = D.lignes[0]; if (/[a-z]/.test(l)) compte('coefficient-1-ajoute', () => { const avant = anomalies.length; const x = { id: '#autotest' + anomalies.length }; styler(x, '1\\,r + ' + l); return anomalies.length > avant; }); }
    }
  }
  // les lignes d'autotest ne comptent pas comme anomalies de la fiche
  const reelles = anomalies.filter((a) => !String(a.id).startsWith('#autotest'));

  const statsSimples = (({ environnement, assertions, equivVues, equivActif, ...reste }) => reste)(stats);
  return {
    anomalies: reelles, stats: statsSimples,
    avecDetail: [...idsAvecDetail], sansDetail: [...idsSansDetail],
    phrases: [...phrases.entries()].map(([t, v]) => [t, [...v.ids], v.exemple, v.enonce, v.lignes]),
    exemples: [...exemples.entries()],
    autotest
  };
}

// ===================================================================================================================
// Interface : boutons « Détails », rendu, débordements, erreurs de page
// ===================================================================================================================
async function controlerInterface(page, viewport, regenerations, serveurUrl) {
  const anomalies = [];
  const erreursPage = [];
  const ecouteur = (m) => { if (m.type() === 'error') erreursPage.push('console : ' + m.text().slice(0, 160)); };
  page.on('console', ecouteur);
  page.on('pageerror', (er) => erreursPage.push('page : ' + String(er.message).slice(0, 160)));
  await page.setViewportSize(viewport);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => typeof genererExercices === 'function' && window.MathJax && MathJax.startup, null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(800);
  for (let r = 0; r < regenerations; r++) {
    const res = await page.evaluate(async () => {
      const dormir = (ms) => new Promise((x) => setTimeout(x, ms));
      if (typeof genererNouvelleFiche === 'function') { try { await genererNouvelleFiche(); } catch (er) { /* en devoir : confirmation */ } }
      await dormir(300);
      const avecDetail = exercices.map((e, i) => ({ e, i })).filter((x) => x.e.detail && (typeof DevoirPartiel === 'undefined' || DevoirPartiel.retenu(x.e)));
      // 1. la réponse finale du détail, saisie comme le ferait un élève, doit être acceptée par la validation de la fiche
      const versTexte = (tex) => {
        let a = String(tex).replace(/\\approx\s*/g, '').replace(/\\%/g, '%').replace(/\\pi/g, 'pi').replace(/\{,\}/g, ',').replace(/\\left|\\right/g, '').replace(/\\[,;! ]/g, '')
          .replace(/\\\{/g, '{').replace(/\\\}/g, '}').replace(/\\cup/g, '∪').replace(/\\infty/g, 'inf').replace(/\\lt\s*/g, '<').replace(/\\leqslant\s*/g, '<=').replace(/\\geqslant\s*/g, '>=').replace(/\\gt\s*/g, '>').replace(/_\{(\d)\}/g, '$1').replace(/\\(?:times|cdot)/g, '*')
          .replace(/\\(?:emptyset|varnothing)/g, '∅').replace(/\\mathbb\{R\}/g, 'ℝ');
        for (let k = 0; k < 6; k++) a = a.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
        return a.replace(/\s+/g, '');
      };
      const refus = [];
      for (const { e, i } of avecDetail) {
        const inp = document.getElementById('input-' + i); if (!inp) continue;
        if (e.type === 'discussionParametre') continue;   // réponse « si m<s alors … » : la fiche la contrôle elle-même (audit-reponses)
        const ensembleSeul = e.detail.final.match(/^\\mathbb\{([NZDQR])\}$/);   // « \mathbb{N} » : l'élève tape la lettre dans un champ texte
        if (inp.tagName === 'MATH-FIELD') { inp.setValue(''); inp.setValue(e.detail.final.replace(/\\lt\s*/g, '<').replace(/\\left|\\right/g, '').replace(/\\[,;! ]/g, ''), { format: 'latex' }); } else inp.value = ensembleSeul ? ensembleSeul[1] : versTexte(e.detail.final);
        await dormir(25);
        let ok; try { ok = verifierUne(i); } catch (er) { ok = 'erreur'; }
        if (ok !== true) refus.push({ id: e.id, final: e.detail.final, resultat: String(ok) });
      }
      // 2. réponse volontairement fausse dans chaque champ
      for (const { i } of avecDetail) {
        const inp = document.getElementById('input-' + i);
        if (!inp) {   // tableau de signes (widget) : seuils faux et cases remplies d'un « + »
          document.querySelectorAll('[id^="cs-seuil-' + i + '-"]').forEach((el) => { el.value = '999'; });
          document.querySelectorAll('[id^="cs-cell-' + i + '-"]').forEach((el) => { el.textContent = '+'; });
          document.querySelectorAll('[id^="tc-"][id$="-' + i + '"], [id^="tc-' + i + '-"], [id^="se-"][id$="-' + i + '"], [id^="tp-"][id$="-' + i + '"]').forEach((el) => { el.value = '999'; });
          document.querySelectorAll('[id^="tv-x-' + i + '-"], [id^="tv-y-' + i + '-"]').forEach((el) => { el.value = '999'; });   // tableau de variations
          document.querySelectorAll('[id^="tv-fleche-' + i + '-"]').forEach((el) => { el.textContent = '↗'; });   // tableau croisé ou schéma d'évolution à compléter
          continue;
        }
        if (inp.tagName === 'MATH-FIELD') inp.setValue('999'); else inp.value = '999'; }
      await dormir(100);
      verifierTout();
      await dormir(200);
      const bouton = document.getElementById('btn-correction'); if (bouton) bouton.click();
      await dormir(200);
      const boutons = [...document.querySelectorAll('.btn-details')];
      const attendus = avecDetail.length;
      boutons.forEach((b) => b.click());
      if (window.MathJax && MathJax.typesetPromise) { try { await MathJax.typesetPromise(); } catch (er) { /* erreurs relevées ci-dessous */ } }
      await dormir(400);
      const blocs = [...document.querySelectorAll('.correction-ligne .details')];
      const mesures = [];
      for (const bloc of blocs) {
        if (bloc.hidden) { mesures.push({ id: bloc.id, ferme: true }); continue; }
        let numLigne = 0;
        for (const ligne of bloc.querySelectorAll(':scope > div')) {
          numLigne++;
          const svg = ligne.querySelector('svg, mjx-container'); if (!svg) { mesures.push({ id: bloc.id, vide: true }); continue; }
          // largeur naturelle de la formule rapportée à la largeur disponible : > 1 = la ligne défile horizontalement
          mesures.push({ id: bloc.id, num: numLigne, largeur: ligne.scrollWidth / Math.max(1, ligne.clientWidth), erreur: !!ligne.querySelector('[data-mml-node="merror"], mjx-merror') });
        }
      }
      // éléments qui dépassent à droite de l'écran sans être dans un conteneur à défilement (pour localiser un débordement)
      const fautifs = [];
      if (document.documentElement.scrollWidth - window.innerWidth > 2) {
        for (const el of document.body.querySelectorAll('*')) {
          const rc = el.getBoundingClientRect(); if (rc.width === 0 || rc.right <= window.innerWidth + 2) continue;
          let p = el.parentElement, defile = false;
          while (p && p !== document.body) { const o = getComputedStyle(p); if (/(auto|scroll|hidden)/.test(o.overflowX)) { defile = true; break; } p = p.parentElement; }
          if (!defile && fautifs.length < 3) fautifs.push(el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '') + ' (droite à ' + Math.round(rc.right) + ' px, dans ' + (() => { const c = []; for (let q = el.parentElement; q && q !== document.body && c.length < 4; q = q.parentElement) c.push(q.tagName.toLowerCase() + (q.id ? '#' + q.id : '') + (typeof q.className === 'string' && q.className ? '.' + q.className.split(' ')[0] : '')); return c.join(' < '); })() + ')');
        }
      }
      return { attendus, trouves: boutons.length, mesures, fautifs, debordement: document.documentElement.scrollWidth - window.innerWidth,
        sansReponse: document.querySelectorAll('.correction-ligne .details').length, refus };
    });
    const tag = `${viewport.width}px`;
    for (const x of res.refus) anomalies.push({ gravite: 'erreur', motif: 'reponse-finale-refusee-par-la-fiche', id: x.id, exemple: `final = ${x.final} (résultat de la validation : ${x.resultat})` });
    if (res.trouves !== res.attendus) anomalies.push({ gravite: 'erreur', motif: 'bouton-details-manquant', id: '(interface ' + tag + ')', exemple: `${res.trouves} bouton(s) pour ${res.attendus} exercice(s) à détail` });
    for (const m of res.mesures) {
      if (m.ferme) anomalies.push({ gravite: 'erreur', motif: 'details-ne-s-ouvrent-pas', id: '(interface ' + tag + ')', exemple: m.id });
      if (m.vide) anomalies.push({ gravite: 'erreur', motif: 'ligne-sans-formule', id: '(interface ' + tag + ')', exemple: m.id });
      if (m.erreur) anomalies.push({ gravite: 'erreur', motif: 'erreur-mathjax-affichee', id: '(interface ' + tag + ')', exemple: m.id });
      // la ligne garde sa taille et défile : aucun défilement ne devrait être utile, ni sur téléphone ni sur ordinateur
      const seuil = 1.1;   // David (16/10/2026) : le moins de défilement possible, même sur téléphone
      if (m.largeur !== undefined && m.largeur > seuil) anomalies.push({ gravite: 'style', motif: 'ligne-trop-longue-' + (viewport.width < 600 ? 'telephone' : 'ordinateur'), id: m.id.replace('details-', 'ex.#'), exemple: `ligne ${m.num} : ${m.largeur.toFixed(2)} fois la largeur disponible (${tag})` });
    }
    if (res.debordement > 2) anomalies.push({ gravite: 'erreur', motif: 'debordement-horizontal', id: '(interface ' + tag + ')', exemple: res.debordement + ' px de trop' + (res.fautifs.length ? ' — ' + res.fautifs.join(' ; ') : '') });
  }
  page.off('console', ecouteur);
  for (const m of new Set(erreursPage)) anomalies.push({ gravite: 'erreur', motif: 'erreur-de-page', id: '(interface ' + viewport.width + 'px)', exemple: m });
  return anomalies;
}

// ===================================================================================================================
(async () => {
  const toutes = drapeau('--toutes') || drapeau('--couverture');
  let fiches = toutes ? toutesLesFiches() : nommees.map((n) => n.replace(/\\/g, '/'));
  if (!fiches.length) { console.error('Indiquer une fiche (cahiers/premiere/cahier-4/fiche-12.html) ou --toutes / --couverture.'); process.exit(2); }
  const couvertureSeule = drapeau('--couverture');
  if (drapeau('--toutes') && !couvertureSeule) fiches = fiches.filter(aDesDetails);
  // Réglages « robustes » par défaut (David, 16/10/2026 : plus de temps pour plus de sûreté) : une fiche nommée prend de 4 à 8 minutes,
  // --rapide (300 tirages) revient à moins d'une minute pour un essai en cours de rédaction.
  const rapide = drapeau('--rapide');
  const tirages = option('--tirages', rapide ? 300 : toutes ? 1500 : 4000);
  const regenerations = option('--regenerations', rapide ? 4 : toutes ? 8 : 14);
  const tiragesEquivalences = option('--tirages-equivalences', rapide ? 40 : toutes ? 120 : 300);
  // assertions des phrases (outils/phrases-details/assertions.js) : fonctions envoyées à la page sous forme de texte
  let assertions = [];
  try { assertions = require('../phrases-details/assertions.js').map((a) => ({ nom: a.nom, motif: a.motif.source, verifie: a.verifie.toString() })); } catch (er) { /* outil des phrases absent */ }
  const nbExemples = option('--exemples', 2);
  const serveur = await demarrerServeur();
  const base = 'http://127.0.0.1:' + serveur.address().port;
  const navigateur = await lancer();
  const lignesRapport = [], phrasesTout = [], exemplesHtml = [], couverture = [];
  let erreurs = 0, avertissements = 0;
  const T0 = Date.now();
  for (const fiche of fiches) {
    const contexte = await navigateur.newContext({ viewport: { width: 1000, height: 900 } });
    const page = await contexte.newPage();
    const chemin = fiche.replace(/^\//, '');
    try {
      await page.goto(base + '/' + chemin, { waitUntil: 'load' });
      await page.waitForFunction(() => typeof genererExercices === 'function', null, { timeout: 30000 });
      await page.waitForFunction(() => window.MathJax && MathJax.startup, null, { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(600);
    } catch (er) { lignesRapport.push(`${fiche} : ouverture impossible (${er.message.slice(0, 80)})`); erreurs++; await contexte.close(); continue; }
    const r = await page.evaluate(controlerDansLaPage, { tirages: couvertureSeule ? 1 : tirages, tiragesEquivalences: couvertureSeule ? 0 : tiragesEquivalences, exemples: nbExemples, assertions, autotest: !couvertureSeule && !drapeau('--sans-autotest') });
    couverture.push({ fiche, avec: r.avecDetail, sans: r.sansDetail });
    let anomalies = couvertureSeule ? [] : r.anomalies;
    if (!couvertureSeule && !drapeau('--sans-interface') && r.avecDetail.length) {
      for (const vp of [{ width: 1000, height: 900 }, { width: 375, height: 812 }]) anomalies = anomalies.concat(await controlerInterface(page, vp, regenerations, base));
    }
    // une même anomalie revue à chaque régénération n'est listée qu'une fois, avec son nombre d'occurrences
    const groupes = new Map();
    for (const a of anomalies) { const lig = (a.exemple.match(/^ligne (d+)/) || [])[1] || ''; const c = a.gravite + '|' + a.motif + '|' + a.id + '|' + lig; if (!groupes.has(c)) groupes.set(c, { ...a, n: 0 }); const g = groupes.get(c); g.n++; const larg = (s) => parseFloat((s.match(/: ([d.]+) fois/) || [])[1] || 0); if (larg(a.exemple) > larg(g.exemple)) g.exemple = a.exemple; }
    anomalies = [...groupes.values()];
    const s = r.stats;
    const nbE = anomalies.filter((a) => a.gravite === 'erreur').length, nbS = anomalies.length - nbE;
    erreurs += nbE; avertissements += nbS;
    if (couvertureSeule) { await contexte.close(); continue; }
    lignesRapport.push(`${nbE ? 'ERREURS ' : nbS ? 'style    ' : 'OK       '} ${fiche} : ${r.avecDetail.length} exercice(s) à détail sur ${r.avecDetail.length + r.sansDetail.length}, ${s.avecDetail} détails contrôlés ` +
      `(${s.chaines} chaînes d'égalités, ${s.equivalences} équivalences, ${s.assertionsVerifiees || 0} assertions de phrases, ${s.tableaux || 0} tableaux de signes, ${s.finalVerifie} réponses finales vérifiées${s.finalNonVerifiable ? ', ' + s.finalNonVerifiable + ' non vérifiables automatiquement' : ''}, ` +
      `${s.motifsLaTeX} formes LaTeX compilées${s.chainesIllisibles || s.equivalencesIllisibles ? ', ' + s.chainesIllisibles + ' chaînes et ' + s.equivalencesIllisibles + ' équivalences non lisibles' : ''})`);
    if (process.argv.includes('--illisibles')) for (const [id, o] of Object.entries(s.illisiblesEx || {})) lignesRapport.push(`      chaîne non lisible ${id} (×${o.n}) : ${o.ex}`);
    for (const a of anomalies) lignesRapport.push(`      [${a.gravite}] ${a.id} — ${a.motif}${a.n > 1 ? ' (×' + a.n + ')' : ''} : ${a.exemple}`);
    const at = Object.entries(r.autotest);
    if (at.length) lignesRapport.push('      auto-test (détection d\'une erreur volontaire) : ' + at.map(([n, v]) => `${n} ${v.detectes}/${v.essais}`).join(' ; '));
    for (const [n, v] of at) if (v.rates && v.rates.length && process.argv.includes('--rates')) v.rates.forEach((x) => lignesRapport.push(`          ${n} non détecté : ${x}`));
    for (const [n, v] of at) if (v.essais >= 20 && v.detectes / v.essais < 0.9) { lignesRapport.push(`      [erreur] (outil) — auto-test insuffisant : ${n} ${v.detectes}/${v.essais}`); (v.rates || []).forEach((x) => lignesRapport.push('          non détecté : ' + x)); erreurs++; }
    for (const [t, ids, exemple, enonce, lignes] of r.phrases) phrasesTout.push({ fiche, t, ids, exemple, enonce, lignes });
    for (const [id, liste] of r.exemples) exemplesHtml.push({ fiche, id, liste });
    await contexte.close();
  }
  await navigateur.close(); serveur.close();
  const duree = Math.round((Date.now() - T0) / 1000);
  if (couvertureSeule) {
    const l = couverture.map((c) => `${c.fiche} : ${c.avec.length} avec détail sur ${c.avec.length + c.sans.length}` + (c.sans.length ? `   (sans : ${c.sans.join(', ')})` : ''));
    const total = couverture.reduce((s, c) => s + c.avec.length, 0), tout = couverture.reduce((s, c) => s + c.avec.length + c.sans.length, 0);
    fs.writeFileSync(path.join(SORTIE, 'couverture.txt'), l.join('\n') + `\n\nTotal : ${total} exercices avec détail sur ${tout}.\n`);
    console.log(l.join('\n') + `\n\nTotal : ${total} exercices avec détail sur ${tout}. (couverture.txt)`);
    return;
  }
  const entete = `Contrôle des détails de correction — ${new Date().toISOString().slice(0, 16).replace('T', ' ')} — ${fiches.length} fiche(s), ${tirages} tirages, ${duree} s`;
  const bilan = `${erreurs} erreur(s), ${avertissements} point(s) de style.`;
  fs.writeFileSync(path.join(SORTIE, 'rapport.txt'), [entete, '', ...lignesRapport, '', bilan, ''].join('\n'));
  // phrases de méthode : liste lisible pour l'humain, et phrases.json pour l'outil séparé outils/phrases-details (catalogue des phrases validées)
  fs.writeFileSync(path.join(SORTIE, 'phrases.json'), JSON.stringify(phrasesTout.map((p) => ({ fiche: p.fiche, phrase: p.t, exercices: p.ids, exemple: p.exemple, enonce: p.enonce, detailComplet: p.lignes })), null, 1));
  const parFiche = {};
  for (const p of phrasesTout) { (parFiche[p.fiche] = parFiche[p.fiche] || []).push(p); }
  const txt = Object.entries(parFiche).map(([f, l]) => `== ${f}\n` + l.sort((a, b) => a.ids[0].localeCompare(b.ids[0], 'fr', { numeric: true })).map((p) => `  « ${p.t} »\n      exercices : ${p.ids.join(', ')}\n      exemple   : ${p.exemple}`).join('\n\n')).join('\n\n');
  fs.writeFileSync(path.join(SORTIE, 'phrases.txt'), `Phrases de méthode des détails — TOUT le texte libre (\\text{…}) écrit dans les étapes, à relire : l'outil vérifie les calculs mais ne peut pas juger si une phrase est juste ni bien tournée.\n`
    + `Les formules sont remplacées par […] ; l'exemple donne la ligne complète, avec les formules.\n\n${txt}\n`);
  // exemples à parcourir
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const blocs = exemplesHtml.map(({ fiche, id, liste }) => `<section><h3>${esc(fiche.replace(/^cahiers\//, ''))} — ${esc(id)}</h3>` + liste.map((x, i) =>
    `<div class="ex"><div class="en">${i + 1}. ${x.enonce}</div><div class="rep">Réponse attendue : \\(${x.reponse}\\)</div>${x.lignes.map((l) => `<div>\\(${l}\\)</div>`).join('')}</div>`).join('') + '</section>').join('\n');
  fs.writeFileSync(path.join(SORTIE, 'exemples.html'), `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Exemples de détails</title>
<style>body{font:15px/1.5 Georgia,serif;max-width:860px;margin:20px auto;padding:0 16px}section{border-top:2px solid #333;margin-top:22px}h3{font:600 16px sans-serif}
.ex{border-left:3px solid #4a47c7;background:#f5f8fc;margin:8px 0;padding:6px 12px}.en{color:#555}.rep{font-weight:bold;margin:4px 0}</style>
<script>window.MathJax={tex:{inlineMath:[['\\\\(','\\\\)']]}}</script><script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-svg.min.js"></script></head><body>
<h1>Exemples de détails de correction</h1><p>Deux tirages par exercice. À parcourir pour juger les phrases de méthode et la lisibilité.</p>\n${blocs}\n</body></html>`);
  console.log([entete, '', ...lignesRapport, '', bilan, '(rapport.txt, phrases.txt, exemples.html)'].join('\n'));
  process.exit(erreurs ? 1 : 0);
})().catch((er) => { console.error(er); process.exit(2); });
