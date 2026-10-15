#!/usr/bin/env node
'use strict';
// Audit automatique de la validation des reponses des fiches de calcul (12/10/2026).
//
// Charge chaque fiche dans un Chrome invisible (playwright-core pilote le Chrome DEJA installe : rien a telecharger),
// la regenere de nombreuses fois et controle, en prenant le CORRIGE comme reference :
//   A. « corrige-refuse »      : le corrige affiche, retape dans le champ, doit etre accepte ;
//   B. « enonce-accepte »      : l'enonce recopie tel quel (quand c'est une expression a simplifier / developper…) doit etre refuse ;
//   C. defauts du corrige lui-meme : decimale approchee, fraction reductible, « +- », « +0 », « ^1 », « NaN / undefined ».
// Ne verifie PAS que le corrige est mathematiquement juste (recalcul independant, fiche par fiche).
//
//   node outils/audit-reponses/audit.js                 fiches modifiees (git) ; toutes si du code partage a change
//   node outils/audit-reponses/audit.js --toutes        les 50 fiches
//   node outils/audit-reponses/audit.js cahiers/seconde/cahier-1/fiche-02.html [autre.html ...]
//   options : --tirages-saisie N (defaut 10 ; 30 pour une fiche nommee/modifiee)  --tirages-corrige N (defaut 100)
//             --enregistrer-connues   AJOUTE les anomalies de ce lancement a connues.json (liste de travail)
//             --actualiser-connues    REMPLACE, pour les fiches auditees, leurs anomalies de connues.json par celles de ce lancement
//             --tout-afficher         affiche aussi les anomalies deja connues
// Code de sortie 1 s'il y a des anomalies NOUVELLES (absentes de connues.json) de gravite « erreur ».
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');
const { chromium } = require('playwright-core');

const RACINE = path.resolve(__dirname, '..', '..');
const CONNUES = path.join(__dirname, 'connues.json');
const RAPPORT = path.join(__dirname, 'rapport.txt');

const args = process.argv.slice(2);
const option = (nom, defaut) => { const i = args.indexOf(nom); return i >= 0 ? Number(args[i + 1]) : defaut; };
const drapeau = (nom) => args.includes(nom);
const nommees = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--tirages')));

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

// fiches modifiees depuis la derniere publication (committees non poussees + non committees) ; code partage modifie => toutes
function fichesAAuditer() {
  if (drapeau('--toutes')) return { fiches: toutesLesFiches(), raison: 'option --toutes', modifiees: false };
  if (nommees.length) return { fiches: nommees.map((n) => n.replace(/\\/g, '/')), raison: 'fiches nommees', modifiees: true };
  let fichiers = [];
  try {
    const base = execSync('git rev-parse --verify -q origin/master', { cwd: RACINE }).toString().trim();
    fichiers = execSync(`git diff --name-only ${base}`, { cwd: RACINE }).toString().split('\n').filter(Boolean);
    fichiers = fichiers.concat(execSync('git ls-files --others --exclude-standard', { cwd: RACINE }).toString().split('\n').filter(Boolean));
  } catch (e) { return { fiches: toutesLesFiches(), raison: 'git indisponible : toutes les fiches', modifiees: false }; }
  const partage = fichiers.filter((f) => /^(assets\/js\/|automatismes\/assets\/|outils\/audit-reponses\/audit\.js)/.test(f));
  if (partage.length) return { fiches: toutesLesFiches(), raison: 'code partage modifie (' + partage.slice(0, 3).join(', ') + ') : toutes les fiches', modifiees: false };
  const fiches = [...new Set(fichiers.filter((f) => /^cahiers\/.*\/fiche-\d+\.html$/.test(f)))].filter((f) => fs.existsSync(path.join(RACINE, f)));
  return { fiches, raison: 'fiches modifiees depuis la derniere publication', modifiees: true };
}

// serveur statique minimal (aucune dependance)
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

// ---- code execute DANS la page ------------------------------------------------------------------------
async function auditerDansLaPage(opts) {
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  const anomalies = [];
  const ajouter = (gravite, motif, e, exemple) => anomalies.push({ gravite, motif, id: e.id, calcul: String(e.id).replace(/\s*[a-z]\)\s*$/, ''), exemple: String(exemple).replace(/\s+/g, ' ').slice(0, 110) });
  const generer = () => (typeof marquerFormesFactorisees === 'function' ? marquerFormesFactorisees(genererExercices()) : genererExercices());
  const pgcd = (a, b) => (b ? pgcd(b, a % b) : a);

  // ---------- D0. enonces redondants : la meme consigne repetee dans au moins 3 questions d'un calcul (elle doit etre
  // dite une fois dans le titre : REGLES-FICHES.md §3). Un enonce reduit a des nombres n'est pas concerne. ----------
  try {
    const norm = (t) => String(t).replace(/<table[\s\S]*?<\/table>/g, ' [tableau] ').replace(/\\\([\s\S]*?\\\)/g, '#').replace(/<[^>]+>/g, ' ').replace(/\d+([,.]\d+)?/g, '#').replace(/\s+/g, ' ').trim();
    for (const [g, idxs] of Object.entries(window.groupes || groupes)) {
      const comptes = new Map();
      const lettres = (t) => t.replace(/[^A-Za-zÀ-ÿ]/g, '').length;
      for (const i of idxs) {
        const t = norm(exercices[i].enonce || '');
        // enonce entier identique, ou derniere phrase commune (consigne repetee apres les donnees)
        const cles = new Set(); if (lettres(t) >= 25) cles.add(t);
        const fin = t.match(/([^.?!]{25,}[.?!])\s*$/); if (fin && lettres(fin[1]) >= 25) cles.add('…' + fin[1]);
        for (const c of cles) { if (!comptes.has(c)) comptes.set(c, []); comptes.get(c).push(i); }
      }
      for (const [t, liste] of comptes) if (liste.length >= 3) ajouter('style', 'enonce-redondant', exercices[liste[0]], t);
    }
  } catch (er) { /* fiche sans groupes */ }

  // ---------- C. defauts du corrige (rapide, sans interface) ----------
  const vus = new Set();
  for (let k = 0; k < opts.tiragesCorrige; k++) {
    let ex; try { ex = generer(); } catch (e) { continue; }
    for (const e of ex) {
      if (e.type === 'qcm' || e.type === 'vraifaux' || typeof e.reponse !== 'string' && e.type !== 'intervalle') continue;
      let tex; try { tex = formaterReponse(e); } catch (er) { continue; }
      if (typeof tex !== 'string' || !tex) continue;
      const approche = e.type === 'approx' || e.tolerance != null || /\\approx|≈/.test(tex) || /approch|arrondi|valeur approch/i.test(e.enonce || '');
      // un coefficient multiplicateur ou une valeur decimale demandee est exacte, pas approchee
      const decimalExact = /coefficient|sous forme décimale|écriture décimale|forme décimale/i.test(e.enonce || '');
      const motifs = [];
      // forme imposee par le moteur de validation (table de la fiche) : forme « decimal » => une decimale est voulue ;
      // reponse attendue que le moteur ne sait pas lire => il se rabattrait en silence sur la seule valeur
      let formeMoteur = null;
      try { if (typeof parametresForme === 'function') { const pf = parametresForme(e); formeMoteur = pf ? pf.forme : null; } } catch (er) { /* sans moteur */ }
      if (formeMoteur && window.MoteurReponses && !window.MoteurReponses.referenceLisible(e)) motifs.push(['erreur', 'reference-illisible']);
      if (/NaN|undefined|Infinity/.test(tex)) motifs.push(['erreur', 'corrige-invalide']);
      if (!approche && !decimalExact && formeMoteur !== 'decimal' && /\d+\.\d{3,}/.test(tex)) motifs.push(['erreur', 'corrige-decimale']);
      if (/\+-|-\+|--/.test(tex.replace(/\\,/g, ''))) motifs.push(['erreur', 'corrige-plus-moins']);
      if (/(?:^|[+\-=(])\s*0(?:\\sqrt|\s*[a-z]|\{ ?[a-z]|\\times)|\+\s*0(?![\d.,])/.test(tex)) motifs.push(['erreur', 'corrige-terme-nul']);
      if (/\^\{1\}(?!\d)/.test(tex)) motifs.push(['erreur', 'corrige-exposant-1']);
      for (const f of tex.matchAll(/\\dfrac\{(-?\d+)\}\{(\d+)\}/g)) {
        const a = Math.abs(+f[1]), b = +f[2];
        if (b > 1 && pgcd(a, b) > 1 && !approche) { motifs.push(['erreur', 'corrige-fraction-reductible']); break; }
      }
      // numerateur reduit a un nombre negatif seul (une somme comme -1-\sqrt{2} sur 2 est normale)
      if (/\\dfrac\{-[^{}+\-]*\}\{/.test(tex)) motifs.push(['style', 'corrige-signe-au-numerateur']);
      // « fraction × lettre » (le × est inutile : \dfrac{1}{4}x) ; deux nombres ou une puissance gardent leur ×
      if (/\\dfrac\{[^{}]*\}\{[^{}]*\}\\times\s*\{?\s*(?:[A-Za-z]|\\lambda|\\sqrt)/.test(tex)) motifs.push(['style', 'corrige-multiplication-apres-fraction']);
      for (const [g, m] of motifs) { const cle = e.id + '|' + m; if (!vus.has(cle)) { vus.add(cle); ajouter(g, m, e, tex); } }
    }
  }

  // ---------- A et B. saisie dans les vrais champs ----------
  // champs texte (sans clavier mathematique) : le LaTeX de l'enonce est converti en texte tape
  const latexVersAscii = (s) => {
    let a = String(s).replace(/\\left|\\right/g, '').replace(/\\(?:times|cdot)/g, '*').replace(/\\lambda/g, 'lam').replace(/\\pi/g, 'pi');
    for (let i = 0; i < 6; i++) {
      a = a.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
    }
    return a.replace(/[{}]/g, (c) => (c === '{' ? '(' : ')')).replace(/\s+/g, '');
  };
  const comparable = (s) => String(s).replace(/\\left|\\right|\\,|\\;|\\!|\s|\{\s*\}/g, '').replace(/\\dfrac|\\tfrac/g, '\\frac');
  // corrige LaTeX d'un intervalle, d'une reunion ou d'une discussion « si m<3 alors ... » -> texte qu'un eleve taperait
  const corrigeVersTexte = (tex) => {
    let a = String(tex).replace(/\\approx\s*/g, '').replace(/\\pi/g, 'pi').replace(/\{,\}/g, ',');
    a = a.replace(/\\text\{\s*:\s*\}/g, '§A§').replace(/\\text\{\s*;?\s*si\s*\}/g, '§S§');
    a = a.replace(/\\left|\\right/g, '').replace(/\\[,;! ]/g, '').replace(/\\\{/g, '§{§').replace(/\\\}/g, '§}§')
      .replace(/\\cup/g, '∪').replace(/\\infty/g, 'inf').replace(/\\lt\s*/g, '<').replace(/\\gt\s*/g, '>')
      .replace(/\\(?:emptyset|varnothing)/g, '∅').replace(/\\mathbb\{R\}/g, 'ℝ');
    a = a.replace(/\\[dt]?frac\{(-?\d+)\}\{(\d+)\}/g, '$1/$2');
    for (let i = 0; i < 6; i++) a = a.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\^\{([^{}]*)\}/g, '^($1)');
    return a.replace(/\s+/g, '').replace(/§S§/g, ' si ').replace(/§A§/g, ' alors ').replace(/§\{§/g, '{').replace(/§\}§/g, '}');
  };
  // champ texte : .value ; champ mathematique (certaines fiches y saisissent les intervalles) : le corrige est injecte en LaTeX,
  // une variante fausse en ascii-math (jamais .value : MathLive y insere des espaces dans « sqrt »)
  const saisirTexte = async (idx, t, latex) => {
    const inp = document.getElementById('input-' + idx);
    if (inp.tagName === 'MATH-FIELD') { inp.setValue(''); if (latex != null) inp.setValue(latex, { format: 'latex' }); else inp.setValue(t, { format: 'ascii-math' }); } else inp.value = t;
    await dormir(30);
  };
  // D. reponses structurees (hors champs mathematiques) : intervalles, discussion selon un parametre, tableaux de signes
  async function auditerStructure(i, e) {
    let n = 0;
    const verifier = () => { try { return verifierUne(i); } catch (er) { return 'erreur'; } };
    // tableau de variations a completer (abscisses des extrema, fleches, valeurs) : le bon tableau est accepte ; une fleche inversee, une valeur
    // fausse, une abscisse fausse, une case vide sont refuses
    if (e.type === 'tableauVariations' && Array.isArray(e.seuils) && typeof reinitialiserTableauVariations === 'function' && document.getElementById('tv-y-' + i + '-0')) {
      const k = e.seuils.length;
      const remplir = (modif) => {
        reinitialiserTableauVariations(i, e);
        for (let j = 1; j < k - 1; j++) document.getElementById('tv-x-' + i + '-' + j).value = String(e.seuils[j].x + (modif && modif.x === j ? 1 : 0));
        for (let j = 0; j < k - 1; j++) { const att = e.seuils[j + 1].y > e.seuils[j].y ? '↗' : '↘'; document.getElementById('tv-fleche-' + i + '-' + j).textContent = modif && modif.fleche === j ? (att === '↗' ? '↘' : '↗') : att; }
        for (let j = 0; j < k; j++) document.getElementById('tv-y-' + i + '-' + j).value = String(e.seuils[j].y + (modif && modif.y === j ? 1 : 0));
      };
      const essais = [['tableau-variations-corrige-refuse', null, true], ['tableau-variations-fleche-fausse-acceptee', { fleche: 0 }, false], ['tableau-variations-valeur-fausse-acceptee', { y: k - 1 }, false],
        ['tableau-variations-valeur-fausse-acceptee', { y: 0 }, false]];
      if (k > 2) essais.push(['tableau-variations-abscisse-fausse-acceptee', { x: 1 }, false]);
      for (const [motif, modif, attendu] of essais) {
        remplir(modif); n++;
        const ok = verifier();
        if (attendu ? ok !== true : ok === true) ajouter('erreur', motif, e, JSON.stringify(modif || 'tableau juste'));
      }
      // une case vide : jamais accepte
      remplir(null); document.getElementById('tv-y-' + i + '-0').value = ''; n++;
      if (verifier() === true) ajouter('erreur', 'tableau-variations-case-vide-acceptee', e, 'valeur de depart vide');
      remplir(null); document.getElementById('tv-fleche-' + i + '-0').textContent = ''; n++;
      if (verifier() === true) ajouter('erreur', 'tableau-variations-case-vide-acceptee', e, 'fleche vide');
      try { reinitialiserTableauVariations(i, e); } catch (er) { /* sans reinitialisation */ }
      return n;
    }
    if (e.type === 'intervalle' || e.type === 'discussionParametre') {
      if (!document.getElementById('input-' + i)) return 0;
      let tex; try { tex = formaterReponse(e); } catch (er) { return 0; }
      const t = corrigeVersTexte(tex);
      const motifCorrige = e.type === 'intervalle' ? 'intervalle-corrige-refuse' : 'discussion-corrige-refuse';
      await saisirTexte(i, t, tex); n++;
      if (verifier() !== true) { ajouter('erreur', motifCorrige, e, t); return n; }
      const mutations = [];
      if (e.type === 'intervalle') {
        const parties = t.split('∪');
        const analyse = parties.map((p) => p.match(/^([\[\]])([^;]+);([^;\[\]]+)([\[\]])$/));
        const k = analyse.findIndex((m) => m && (!/inf/.test(m[2]) || !/inf/.test(m[3])));
        if (k >= 0) {
          const m = analyse[k], rebati = (cg, a, b, cd) => parties.map((p, j) => (j === k ? cg + a + ';' + b + cd : p)).join('∪');
          const ouvre = (c) => (c === '[' ? ']' : '[');
          // crochet inverse sur une borne finie, ou borne finie decalee de 1
          if (!/inf/.test(m[2])) mutations.push(['crochet-inverse', rebati(ouvre(m[1]), m[2], m[3], m[4])]);
          else mutations.push(['crochet-inverse', rebati(m[1], m[2], m[3], ouvre(m[4]))]);
          const b = !/inf/.test(m[3]) ? 3 : 2;
          if (/^-?\d+$/.test(m[b])) mutations.push(['borne-decalee', b === 3 ? rebati(m[1], m[2], String(+m[3] + 1), m[4]) : rebati(m[1], String(+m[2] + 1), m[3], m[4])]);
        }
        // borne fractionnaire a donner sous forme irreductible : p/q recopiee en 2p/2q doit etre refusee
        if (e.bornesIrreductibles) {
          const fr = t.match(/(-?)(\d+)\/(\d+)/);
          if (fr) mutations.push(['borne-non-irreductible', t.replace(fr[0], fr[1] + (2 * fr[2]) + '/' + (2 * fr[3]))]);
        }
      } else {
        const cas = t.split(' si ').map((c) => c.trim()).filter(Boolean).map((c) => c.split(' alors '));
        if (cas.length >= 2 && cas.every((c) => c.length === 2) && cas[0][1] !== cas[1][1]) {
          const echange = [[cas[0][0], cas[1][1]], [cas[1][0], cas[0][1]], ...cas.slice(2)];
          mutations.push(['cas-echanges', echange.map((c) => 'si ' + c[0] + ' alors ' + c[1]).join(' ; ')]);
        }
      }
      for (const [nom, texte] of mutations) {
        await saisirTexte(i, texte); n++;
        if (verifier() === true) ajouter('erreur', (e.type === 'intervalle' ? 'intervalle-faux-accepte' : 'discussion-faux-acceptee'), e, nom + ' : ' + texte + '   => attendu ' + t);
      }
      if (e.type === 'intervalle' && e.intervalleSpec) {
        const sp = e.intervalleSpec;
        // ℝ s'ecrit aussi ]-inf;+inf[ et R
        if (sp.type === 'tout') for (const variante of [']-inf;+inf[', 'R']) { await saisirTexte(i, variante); n++; if (verifier() !== true) ajouter('erreur', 'intervalle-tout-refuse', e, variante); }
        // un intervalle borne ecrit sous forme d'inegalite « a<x<b » n'est pas un intervalle
        if (sp.type === 'intervalles' && sp.liste.length === 1 && Number.isFinite(sp.liste[0].bas) && Number.isFinite(sp.liste[0].haut)) {
          const iv = sp.liste[0], fr = (v) => { if (Number.isInteger(v)) return String(v); const f = math.fraction(v); return (f.s < 0 ? '-' : '') + f.n + '/' + f.d; };
          const ineg = fr(iv.bas) + (iv.inclusBas ? '<=' : '<') + 'x' + (iv.inclusHaut ? '<=' : '<') + fr(iv.haut);
          await saisirTexte(i, ineg); n++;
          if (verifier() === true) ajouter('erreur', 'intervalle-ecrit-en-inegalite-accepte', e, ineg);
        }
      }
      return n;
    }
    // reponse oui / non : « oui » ou « non » juste accepte (aussi en majuscule), l'inverse et une reponse quelconque refuses
    if (e.type === 'ouiNon') {
      if (!document.getElementById('input-' + i) || typeof e.reponseOuiNon !== 'boolean') return 0;
      const bon = e.reponseOuiNon ? 'oui' : 'non', mauvais = e.reponseOuiNon ? 'non' : 'oui';
      const essais = [['ouinon-corrige-refuse', bon, true], ['ouinon-corrige-refuse', bon[0].toUpperCase() + bon.slice(1), true],
        ['ouinon-faux-accepte', mauvais, false], ['ouinon-quelconque-accepte', 'peut-être', false]];
      for (const [motif, texte, attendu] of essais) {
        await saisirTexte(i, texte); n++;
        const ok = verifier();
        if (attendu ? ok !== true : ok === true) ajouter('erreur', motif, e, texte + '   => attendu ' + bon);
      }
      return n;
    }
    // encadrement « a<=x<b » : le corrige est accepte ; un crochet inverse, une borne decalee, l'ecriture en intervalle sont refuses
    if (e.type === 'encadrement' && typeof e.bas === 'number' && typeof e.haut === 'number') {
      if (!document.getElementById('input-' + i)) return 0;
      const fr = (v) => { if (Number.isInteger(v)) return String(v); const f = math.fraction(v); return (f.s < 0 ? '-' : '') + f.n + '/' + f.d; };
      const op = (incl) => (incl ? '<=' : '<');
      const essais = [['encadrement-corrige-refuse', fr(e.bas) + op(e.inclusBas) + 'x' + op(e.inclusHaut) + fr(e.haut), true],
        ['encadrement-faux-accepte', fr(e.bas) + op(!e.inclusBas) + 'x' + op(e.inclusHaut) + fr(e.haut), false],
        ['encadrement-faux-accepte', fr(e.bas) + op(e.inclusBas) + 'x' + op(!e.inclusHaut) + fr(e.haut), false],
        ['encadrement-faux-accepte', fr(e.bas) + op(e.inclusBas) + 'x' + op(e.inclusHaut) + fr(e.haut + 1), false],
        ['encadrement-ecrit-en-intervalle-accepte', (e.inclusBas ? '[' : ']') + fr(e.bas) + ';' + fr(e.haut) + (e.inclusHaut ? ']' : '['), false]];
      for (const [motif, texte, attendu] of essais) {
        await saisirTexte(i, texte); n++;
        const ok = verifier();
        if (attendu ? ok !== true : ok === true) ajouter('erreur', motif, e, texte);
      }
      return n;
    }
    // inegalite « x>=3 » : le corrige est accepte ; sens inverse, inclusion inversee, seuil decale et ecriture en intervalle (qui recopierait l'enonce) refuses
    if (e.type === 'ineq' && typeof e.seuil === 'number' && e.sens) {
      if (!document.getElementById('input-' + i)) return 0;
      const fr = (v) => { if (Number.isInteger(v)) return String(v); const f = math.fraction(v); return (f.s < 0 ? '-' : '') + f.n + '/' + f.d; };
      const oppose = { '>': '<', '<': '>', '>=': '<=', '<=': '>=' }[e.sens], large = { '>': '>=', '<': '<=', '>=': '>', '<=': '<' }[e.sens];
      const inter = e.sens[0] === '>' ? (e.sens === '>=' ? '[' : ']') + fr(e.seuil) + ';+inf[' : ']-inf;' + fr(e.seuil) + (e.sens === '<=' ? ']' : '[');
      const essais = [['ineq-corrige-refuse', 'x' + e.sens + fr(e.seuil), true], ['ineq-faux-accepte', 'x' + oppose + fr(e.seuil), false],
        ['ineq-faux-accepte', 'x' + large + fr(e.seuil), false], ['ineq-faux-accepte', 'x' + e.sens + fr(e.seuil + 1), false],
        ['ineq-ecrite-en-intervalle-acceptee', inter, false]];
      for (const [motif, texte, attendu] of essais) {
        await saisirTexte(i, texte); n++;
        const ok = verifier();
        if (attendu ? ok !== true : ok === true) ajouter('erreur', motif, e, texte);
      }
      return n;
    }
    // ensemble ecrit en extension « {0;1;2} » dans un champ texte : le corrige (dans un ordre ou l'autre) est accepte ; un element en moins ou en trop refuse
    if (e.type === 'num' && typeof e.reponse === 'string' && e.reponse.trim().startsWith('{')) {
      const inp = document.getElementById('input-' + i);
      if (!inp || inp.tagName === 'MATH-FIELD') return 0;
      const elements = e.reponse.trim().slice(1, -1).split(';').map((x) => x.trim()).filter(Boolean);
      const ens = (l) => '{' + l.join(';') + '}';
      const valeur = (x) => { try { return math.evaluate(x); } catch (er) { return NaN; } };
      let essais;
      if (!elements.length) {
        // ensemble vide « {} » : le corrige est accepte ; un ensemble non vide est refuse
        essais = [['ensemble-corrige-refuse', e.reponse, true], ['ensemble-faux-accepte', '{0}', false]];
      } else {
        const supplementaire = String(Math.max(...elements.map((x) => valeur(x))) + 1);
        essais = [['ensemble-corrige-refuse', e.reponse, true], ['ensemble-ordre-refuse', ens(elements.slice().reverse()), true],
          ['ensemble-incomplet-accepte', ens(elements.slice(0, -1)), false], ['ensemble-en-trop-accepte', ens(elements.concat([supplementaire])), false],
          // un element faux (decale de 1) : refuse
          ['ensemble-faux-accepte', ens(elements.map((x, k) => (k === 0 ? '(' + x + ')+1' : x))), false]];
        // ensemble des opposes : refuse, sauf si l'ensemble est symetrique (c'est alors le meme ensemble)
        const symetrique = elements.every((x) => elements.some((y) => Math.abs(valeur(x) + valeur(y)) < 1e-9));
        if (!symetrique) essais.push(['ensemble-faux-accepte', ens(elements.map((x) => '-(' + x + ')')), false]);
      }
      for (const [motif, texte, attendu] of essais) {
        await saisirTexte(i, texte); n++;
        const ok = verifier();
        if (attendu ? ok !== true : ok === true) ajouter(motif === 'ensemble-ordre-refuse' ? 'avertissement' : 'erreur', motif, e, texte + '   => attendu ' + e.reponse);
      }
      return n;
    }
    // valeur lue ou approchee (lecture graphique, tolerance t) : la valeur exacte et une valeur a t/2 pres (point ou virgule decimale) sont
    // acceptees ; une valeur a 2t, du texte, un champ vide sont refuses. Plusieurs racines possibles (typeApprox « racine ») : n'importe laquelle.
    // Une tolerance de plus de 0,2 est signalee (regle des lectures graphiques : 0,2).
    if (e.type === 'approx' && e.tolerance > 0) {
      if (!document.getElementById('input-' + i)) return 0;
      const racines = Array.isArray(e.valeurApprox) ? e.valeurApprox : [e.valeurApprox];
      if (!racines.length || racines.some((x) => typeof x !== 'number')) return 0;
      const t = e.tolerance, v = racines[0];
      const dec = (x, virgule) => { const s = String(Math.round(x * 1000) / 1000); return virgule ? s.replace('.', ',') : s; };
      // un point a plus de 2t de toutes les racines
      let loin = v + 2 * t; for (let k = 0; k < 10 && racines.some((x) => Math.abs(x - loin) <= t + 1e-9); k++) loin += t;
      const essais = [['approx-corrige-refuse', dec(v), true], ['approx-corrige-refuse', dec(v + t / 2, true), true], ['approx-corrige-refuse', dec(v - t / 2), true],
        ['approx-faux-accepte', dec(loin), false], ['approx-faux-accepte', 'abc', false], ['approx-faux-accepte', '', false]];
      for (const [motif, texte, attendu] of essais) {
        await saisirTexte(i, texte); n++;
        const ok = verifier();
        if (attendu ? ok !== true : ok === true) ajouter('erreur', motif, e, (texte || '(vide)') + '   => attendu ' + dec(v) + ' a ' + t + ' pres');
      }
      if (t > 0.2 + 1e-9) ajouter('style', 'lecture-tolerance-superieure-a-0,2', e, 'tolerance ' + t);
      return n;
    }
    // comparaison de deux images « f(x1)<f(x2) » : le corrige est accepte (aussi avec espaces) ; le sens inverse, l'inegalite large, le symbole seul,
    // une autre fonction et le signe = sont refuses
    if (e.type === 'texte' && e.comparaison && typeof e.reponse === 'string') {
      if (!document.getElementById('input-' + i)) return 0;
      const m = e.reponse.replace(/\s/g, '').match(/^(\w+)\((\w+)\)([<>])(\w+)\((\w+)\)$/);
      if (!m) return 0;
      const [, f1, a1, sg, f2, a2] = m, ce = (s) => f1 + '(' + a1 + ')' + s + f2 + '(' + a2 + ')';
      const oppose = sg === '<' ? '>' : '<', autre = f1 === 'f' ? 'g' : 'f';
      const essais = [['comparaison-corrige-refuse', ce(sg), true], ['comparaison-corrige-refuse', f1 + '(' + a1 + ') ' + sg + ' ' + f2 + '(' + a2 + ')', true],
        ['comparaison-faux-accepte', ce(oppose), false], ['comparaison-faux-accepte', ce(sg + '='), false], ['comparaison-faux-accepte', ce('='), false],
        ['comparaison-symbole-seul-accepte', sg, false], ['comparaison-faux-accepte', autre + '(' + a1 + ')' + sg + autre + '(' + a2 + ')', false]];
      for (const [motif, texte, attendu] of essais) {
        await saisirTexte(i, texte); n++;
        const ok = verifier();
        if (attendu ? ok !== true : ok === true) ajouter('erreur', motif, e, texte + '   => attendu ' + e.reponse);
      }
      return n;
    }
    // tableau de programme de calcul (une image a calculer, un antecedent a determiner) : le bon tableau est accepte ; une case fausse,
    // une case vide, les deux cases echangees sont refuses
    if (e.type === 'tableauProgramme' && typeof reinitialiserTableauProgramme === 'function' && document.getElementById('tp-img-' + i)) {
      const img = document.getElementById('tp-img-' + i), ant = document.getElementById('tp-ant-' + i);
      const remplir = (a, b) => { img.value = a; ant.value = b; };
      const bonI = e.resultatK3, bonA = e.x0;
      const essais = [['tableau-programme-corrige-refuse', String(bonI), String(bonA), true], ['tableau-programme-case-fausse-acceptee', String(bonI + 1), String(bonA), false],
        ['tableau-programme-case-fausse-acceptee', String(bonI), String(bonA + 1), false], ['tableau-programme-case-vide-acceptee', '', String(bonA), false],
        ['tableau-programme-case-vide-acceptee', String(bonI), '', false]];
      if (bonI !== bonA) essais.push(['tableau-programme-cases-echangees-acceptees', String(bonA), String(bonI), false]);
      for (const [motif, a, b, attendu] of essais) {
        remplir(a, b); n++;
        const ok = verifier();
        if (attendu ? ok !== true : ok === true) ajouter('erreur', motif, e, 'image=' + (a || '(vide)') + ' antecedent=' + (b || '(vide)') + '   => attendu image=' + bonI + ' antecedent=' + bonA);
      }
      try { reinitialiserTableauProgramme(i); } catch (er) { /* sans reinitialisation */ }
      return n;
    }
    // inequation avec valeur absolue « |x-3|<=5 » (ecrire un encadrement sous cette forme) : le corrige est accepte ;
    // sens ou inclusion inverse, centre ou rayon decale, reponse qui n'est pas de la forme demandee refuses
    if (e.type === 'valAbs' && typeof e.aAttendu === 'number' && e.sensAttendu) {
      if (!document.getElementById('input-' + i)) return 0;
      const fr = (v) => String(Math.round(v * 1e6) / 1e6);
      const terme = (a) => (a === 0 ? 'x' : (a < 0 ? 'x+' + fr(-a) : 'x-' + fr(a)));
      const forme = (a, sens, r) => '|' + terme(a) + '|' + sens + fr(r);
      const autreInclusion = e.sensAttendu === '<=' ? '<' : (e.sensAttendu === '<' ? '<=' : (e.sensAttendu === '>=' ? '>' : '>='));
      const oppose = { '<': '>', '<=': '>=', '>': '<', '>=': '<=' }[e.sensAttendu];
      const essais = [['valabs-corrige-refuse', forme(e.aAttendu, e.sensAttendu, e.rAttendu), true],
        ['valabs-faux-accepte', forme(e.aAttendu, autreInclusion, e.rAttendu), false],
        ['valabs-faux-accepte', forme(e.aAttendu, oppose, e.rAttendu), false],
        ['valabs-faux-accepte', forme(e.aAttendu + 1, e.sensAttendu, e.rAttendu), false],
        ['valabs-faux-accepte', forme(e.aAttendu, e.sensAttendu, e.rAttendu + 1), false],
        ['valabs-hors-forme-accepte', 'x' + e.sensAttendu + fr(e.rAttendu), false]];
      for (const [motif, texte, attendu] of essais) {
        await saisirTexte(i, texte); n++;
        const ok = verifier();
        if (attendu ? ok !== true : ok === true) ajouter('erreur', motif, e, texte + '   => attendu ' + forme(e.aAttendu, e.sensAttendu, e.rAttendu));
      }
      return n;
    }
    // pourcentages (« 25% », ecart en points de pourcentage) : le corrige tape est accepte ; une valeur fausse, le nombre
    // seul (sans %), un calcul non termine et l'enonce recopie (« Ecrire 0,06 en pourcentage ») sont refuses
    if (e.type === 'pourcentage') {
      if (!document.getElementById('input-' + i)) return 0;
      const points = e.reponsePoints != null;
      const val = points ? e.reponsePoints : e.reponsePourcent;
      if (typeof val !== 'number') return 0;
      const fr = (x) => String(Math.round(x * 1e6) / 1e6).replace('.', ',');
      const essais = points
        ? [['points-corrige-refuse', fr(val), true], ['points-corrige-refuse', fr(val) + ' points', true],
           ['points-faux-accepte', fr(val + 1), false], ['points-avec-pourcent-accepte', fr(val) + '%', false]]
        : [['pourcentage-corrige-refuse', fr(val) + '%', true], ['pourcentage-faux-accepte', fr(val + 5) + '%', false],
           ...(val === 0 ? [] : [['pourcentage-nombre-seul-accepte', fr(val), false]]), ['pourcentage-calcul-accepte', '(' + fr(2 * val) + ')/2%', false]];
      const m = String(e.enonce || '').match(/\\\((.*?)\\\) en pourcentage/);
      if (m && !points) essais.push(['pourcentage-enonce-accepte', m[1].replace(/\{,\}/g, ',').replace(/\\[dt]?frac\{(\d+)\}\{(\d+)\}/g, '$1/$2'), false]);
      for (const [motif, texte, attendu] of essais) {
        await saisirTexte(i, texte); n++;
        const ok = verifier();
        if (attendu ? ok !== true : ok === true) ajouter('erreur', motif, e, texte + '   => attendu ' + fr(val) + (points ? ' points' : '%'));
      }
      return n;
    }
    // tableau croise a completer (4 cases + un pourcentage) : bon tableau accepte ; une case fausse, une case vide, un pourcentage faux ou vide refuses
    if (e.type === 'tableauCroiseRempli' && e.t && typeof reinitialiserTableauCroiseRempli === 'function' && document.getElementById('tc-a-' + i)) {
      const t = e.t, P = e.pourcentageAttendu, cles = ['a', 'b', 'c', 'd'];
      const fr = (x) => String(Math.round(x * 1e6) / 1e6).replace('.', ',');
      const poser = (cases, pct) => { for (const c of cles) document.getElementById(`tc-${c}-${i}`).value = cases[c]; document.getElementById('tc-pct-' + i).value = pct; };
      const bons = { a: String(t.a), b: String(t.b), c: String(t.c), d: String(t.d) };
      poser(bons, fr(P) + '%'); n++;
      if (verifier() !== true) { ajouter('erreur', 'tableau-croise-corrige-refuse', e, JSON.stringify(bons) + ' ' + fr(P) + '%'); reinitialiserTableauCroiseRempli(i); return n; }
      for (const c of cles) {
        poser({ ...bons, [c]: String(t[c] + 1) }, fr(P) + '%'); n++;
        if (verifier() === true) ajouter('erreur', 'tableau-croise-case-fausse-acceptee', e, 'case ' + c + ' : ' + (t[c] + 1) + ' au lieu de ' + t[c]);
        poser({ ...bons, [c]: '' }, fr(P) + '%'); n++;
        if (verifier() === true) ajouter('erreur', 'tableau-croise-case-vide-acceptee', e, 'case ' + c + ' vide');
      }
      poser(bons, fr(P + 3) + '%'); n++;
      if (verifier() === true) ajouter('erreur', 'tableau-croise-pourcentage-faux-accepte', e, fr(P + 3) + '% au lieu de ' + fr(P) + '%');
      poser(bons, ''); n++;
      if (verifier() === true) ajouter('erreur', 'tableau-croise-pourcentage-vide-accepte', e, 'pourcentage vide');
      reinitialiserTableauCroiseRempli(i);
      return n;
    }
    // schema d'evolutions successives (3 periodes : taux en % et coefficient multiplicateur) : schema juste accepte ; une case
    // fausse ou vide, un taux ecrit en calcul non termine (« (40)/2% ») refuses
    if (e.type === 'schemaEvolution' && e.t && typeof reinitialiserSchemaEvolution === 'function' && document.getElementById('se-taux1-' + i)) {
      const t = e.t;
      const fr = (x) => String(Math.round(x * 1e6) / 1e6).replace('.', ',');
      const signe = (v) => (v > 0 ? '+' : '') + fr(v) + '%';
      const bons = { taux1: signe(t.h1 ? t.p1 : -t.p1), cm1: fr(t.c1), taux2: signe(t.taux2), cm2: fr(t.c2), taux3: signe(t.h3 ? t.p3 : -t.p3), cm3: fr(t.c3) };
      const valeurs = { taux1: t.h1 ? t.p1 : -t.p1, cm1: t.c1, taux2: t.taux2, cm2: t.c2, taux3: t.h3 ? t.p3 : -t.p3, cm3: t.c3 };
      const poser = (v) => { for (const c of Object.keys(bons)) document.getElementById(`se-${c}-${i}`).value = v[c]; };
      poser(bons); n++;
      if (verifier() !== true) { ajouter('erreur', 'schema-corrige-refuse', e, JSON.stringify(bons)); reinitialiserSchemaEvolution(i); return n; }
      for (const c of Object.keys(bons)) {
        const estTaux = c.startsWith('taux');
        poser({ ...bons, [c]: estTaux ? signe(valeurs[c] + 1) : fr(valeurs[c] + 0.01) }); n++;
        if (verifier() === true) ajouter('erreur', 'schema-case-fausse-acceptee', e, 'case ' + c + ' : ' + (estTaux ? signe(valeurs[c] + 1) : fr(valeurs[c] + 0.01)) + ' au lieu de ' + bons[c]);
        poser({ ...bons, [c]: '' }); n++;
        if (verifier() === true) ajouter('erreur', 'schema-case-vide-acceptee', e, 'case ' + c + ' vide');
        if (estTaux) {
          poser({ ...bons, [c]: '(' + fr(2 * valeurs[c]) + ')/2%' }); n++;
          if (verifier() === true) ajouter('erreur', 'schema-calcul-accepte', e, 'case ' + c + ' : (' + fr(2 * valeurs[c]) + ')/2%');
        }
      }
      reinitialiserSchemaEvolution(i);
      return n;
    }
    if (e.type === 'tableauSigne' && typeof restaurerEtatTableauSigne === 'function' && typeof reinitialiserTableauSigne === 'function') {
      const sp = e.spec;
      const frac = (v) => { if (Number.isInteger(v)) return String(v); const f = math.fraction(v); return (f.s < 0 ? '-' : '') + f.n + '/' + f.d; };
      const etat = () => { const o = { seuils: sp.seuils.map((z) => frac(z.valeur)), lignes: {}, finale: sp.finale ? sp.finale.slice() : [] }; sp.lignes.forEach((l, li) => { o.lignes[li] = l.valeurs.slice(); }); return o; };
      const poser = (o) => { reinitialiserTableauSigne(i, e); restaurerEtatTableauSigne(i, e, o); };
      const cycle = ['+', '-', '0', '|', '‖'];
      poser(etat()); n++;
      if (verifier() !== true) { ajouter('erreur', 'tableau-corrige-refuse', e, JSON.stringify(etat())); reinitialiserTableauSigne(i, e); return n; }
      const cases = [];
      sp.lignes.forEach((l, li) => l.valeurs.forEach((v, c) => cases.push([li, c, v])));
      if (sp.finale) sp.finale.forEach((v, c) => cases.push(['fin', c, v]));
      for (const [li, c, v] of cases) {
        const o = etat(), faux = cycle[(cycle.indexOf(v) + 1) % cycle.length];
        if (li === 'fin') o.finale[c] = faux; else o.lignes[li][c] = faux;
        poser(o); n++;
        if (verifier() === true) ajouter('erreur', 'tableau-faux-accepte', e, 'case ' + li + '/' + c + ' : ' + v + ' remplace par ' + faux);
        const o2 = etat(); if (li === 'fin') o2.finale[c] = ''; else o2.lignes[li][c] = '';
        poser(o2); n++;
        if (verifier() === true) ajouter('erreur', 'tableau-incomplet-accepte', e, 'case ' + li + '/' + c + ' vide');
      }
      for (let j = 0; j < sp.seuils.length; j++) {
        const o = etat(); o.seuils[j] = frac(sp.seuils[j].valeur + 1);
        poser(o); n++;
        if (verifier() === true) ajouter('erreur', 'tableau-seuil-faux-accepte', e, 'seuil ' + j + ' : ' + o.seuils[j] + ' au lieu de ' + frac(sp.seuils[j].valeur));
      }
      reinitialiserTableauSigne(i, e);
      return n;
    }
    return 0;
  }
  let saisies = 0;
  for (let tour = 0; tour < opts.tiragesSaisie; tour++) {
    if (tour > 0) {
      window.confirm = () => true;
      try { await genererNouvelleFiche(); } catch (e) { break; }
      await dormir(700);
    }
    for (let i = 0; i < exercices.length; i++) {
      const e = exercices[i];
      const champTexte = (() => { const el = document.getElementById('input-' + i); return !!el && el.tagName !== 'MATH-FIELD'; })();
      const ensembleEnExtension = e.type === 'num' && typeof e.reponse === 'string' && e.reponse.trim().startsWith('{') && champTexte;
      if (['intervalle', 'discussionParametre', 'tableauSigne', 'pourcentage', 'tableauCroiseRempli', 'schemaEvolution', 'ouiNon', 'encadrement', 'ineq', 'valAbs', 'approx', 'tableauProgramme', 'tableauVariations'].includes(e.type) || (e.type === 'texte' && e.comparaison) || ensembleEnExtension) { saisies += await auditerStructure(i, e); continue; }
      if (e.type !== 'num' && e.type !== 'alg') continue;
      const inp = document.getElementById('input-' + i);
      if (!inp) continue;
      const estMF = inp.tagName === 'MATH-FIELD';
      const saisir = async (latex, ascii) => { if (estMF) inp.setValue(latex, { format: 'latex' }); else inp.value = ascii; await dormir(30); };
      let tex; try { tex = formaterReponse(e); } catch (er) { tex = null; }
      // decorations d'affichage que l'eleve ne tape pas (valeur approchee, degre, petite fraction en exposant)
      if (typeof tex === 'string') tex = tex.replace(/\\approx\s*/g, '').replace(/\^\\circ/g, '').replace(/\\textstyle\s*/g, '');
      const ensemble = typeof e.reponse === 'string' && e.reponse.trim().startsWith('{');
      // A. corrige retape (champs mathematiques seulement : le LaTeX injecte est celui d'un champ ; ensembles et sommes ont leurs limites connues)
      if (estMF && tex && !ensemble && e.type !== 'somme') {
        await saisir(tex, '');
        saisies++;
        let ok; try { ok = verifierUne(i); } catch (er) { ok = null; }
        if (ok === false) ajouter('avertissement', 'corrige-refuse', e, tex);
      }
      // A'. couple / triplet ordonne « (a;b) » : accolades, valeurs sans parentheses, valeur fausse, valeur manquante et ordre inverse refuses
      if (estMF && typeof e.reponse === 'string' && /^\(.*;.*\)$/.test(e.reponse.trim())) {
        const el = e.reponse.trim().slice(1, -1).split(';');
        const nums = el.map((x) => { try { return math.evaluate(x); } catch (er) { return NaN; } });
        const essais = [['tuple-accolades-accepte', '{' + el.join(';') + '}'], ['tuple-sans-parentheses-accepte', el.join(';')],
          ['tuple-valeur-fausse-acceptee', '(' + el.map((x, k) => (k === 0 ? '(' + x + ')+1' : x)).join(';') + ')'], ['tuple-incomplet-accepte', '(' + el[0] + ')']];
        if (nums.some((v, k) => Math.abs(v - nums[nums.length - 1 - k]) > 1e-9)) essais.push(['tuple-ordre-accepte', '(' + el.slice().reverse().join(';') + ')']);
        for (const [motif, texte] of essais) {
          inp.setValue(texte, { format: 'ascii-math' }); await dormir(30); saisies++;
          let okT; try { okT = verifierUne(i); } catch (er) { okT = null; }
          if (okT === true) ajouter('erreur', motif, e, texte + '   => attendu ' + e.reponse);
        }
      }
      // B. enonce recopie : accepte a tort ?
      let s = String(e.enonce || '').replace(/\\\(|\\\)/g, '').trim();
      if (!s || s.length > 160 || /[=<>]|\\leq|\\geq|\\text|\\forall|\\in\b|\\mathbb|:/.test(s) || /[A-Za-zÀ-ÿ]{4,}/.test(s.replace(/\\[a-zA-Z]+/g, ''))) continue;
      if (tex && comparable(tex) === comparable(s)) continue;                    // l'enonce EST deja la reponse attendue
      await saisir(s, latexVersAscii(s));
      saisies++;
      let ok; try { ok = verifierUne(i); } catch (er) { ok = null; }
      if (ok === true) ajouter('erreur', 'enonce-accepte', e, s + '   => attendu ' + (tex || e.reponse));
      // le nombre calcule pour une puissance : meme controle
      if (estMF && e.forme === 'puissance') {
        let v; try { v = Function('"use strict";return (' + String(e.reponse).replace(/\^/g, '**') + ')')(); } catch (er) { v = null; }
        if (Number.isInteger(v)) { await saisir(String(v), String(v)); saisies++; if (verifierUne(i) === true) ajouter('erreur', 'nombre-calcule-accepte', e, String(v)); }
      }
    }
  }
  return { anomalies, saisies };
}

// ---- programme principal ------------------------------------------------------------------------------
(async () => {
  const { fiches, raison, modifiees } = fichesAAuditer();
  if (!fiches.length) { console.log('Aucune fiche modifiee depuis la derniere publication : rien a auditer. (--toutes pour tout auditer)'); return; }
  const tiragesCorrige = option('--tirages-corrige', 100);
  const tiragesSaisie = option('--tirages-saisie', modifiees ? 30 : 10);
  console.log(`Audit de ${fiches.length} fiche(s) — ${raison} — ${tiragesSaisie} tirages saisis, ${tiragesCorrige} tirages de corrige par fiche`);

  const serveur = await demarrerServeur();
  const port = serveur.address().port;
  let navigateur;
  try { navigateur = await chromium.launch({ channel: 'chrome', headless: true }); }
  catch (e) { console.error('Impossible de lancer Google Chrome : ' + e.message.split('\n')[0] + '\nChrome doit etre installe (voir README.md).'); serveur.close(); process.exit(2); }

  const connues = fs.existsSync(CONNUES) ? new Set(JSON.parse(fs.readFileSync(CONNUES, 'utf8')).anomalies) : new Set();
  const resultats = [];
  let suivante = 0, faites = 0;
  const debut = Date.now();
  async function travailleur() {
    const contexte = await navigateur.newContext({ viewport: { width: 1000, height: 800 } });
    for (;;) {
      const i = suivante++;
      if (i >= fiches.length) break;
      const fiche = fiches[i];
      const page = await contexte.newPage();
      const erreursPage = [];
      page.on('pageerror', (e) => erreursPage.push(String(e.message).slice(0, 100)));
      page.on('dialog', (d) => d.accept().catch(() => {}));
      let res = { fiche, anomalies: [], saisies: 0, erreur: null };
      try {
        await page.goto(`http://127.0.0.1:${port}/${fiche}`, { waitUntil: 'load', timeout: 40000 });
        await page.waitForFunction(() => typeof exercices !== 'undefined' && window.customElements.get('math-field') && document.querySelector('.question') && window.math, null, { timeout: 40000 });
        await page.waitForTimeout(900);
        const r = await page.evaluate(auditerDansLaPage, { tiragesCorrige, tiragesSaisie });
        res.anomalies = r.anomalies; res.saisies = r.saisies;
        if (erreursPage.length) res.anomalies.push({ gravite: 'erreur', motif: 'erreur-de-page', id: '-', calcul: '-', exemple: erreursPage[0] });
      } catch (e) { res.erreur = String(e.message).split('\n')[0].slice(0, 140); }
      await page.close();
      resultats.push(res);
      faites++;
      process.stdout.write(`\r  ${faites}/${fiches.length} fiches (${Math.round((Date.now() - debut) / 1000)} s)   `);
    }
    await contexte.close();
  }
  await Promise.all(Array.from({ length: Math.min(4, fiches.length) }, travailleur));
  await navigateur.close(); serveur.close();
  process.stdout.write('\n');

  // ---- rapport ----
  resultats.sort((a, b) => a.fiche.localeCompare(b.fiche));
  const cle = (r, a) => `${r.fiche.replace(/^cahiers\//, '').replace('.html', '')}|${a.calcul}|${a.motif}`;
  const regroupe = (r) => { const m = new Map(); for (const a of r.anomalies) { const k = cle(r, a); if (!m.has(k)) m.set(k, { ...a, cle: k, n: 0 }); m.get(k).n++; } return [...m.values()]; };
  let nouvellesErreurs = 0, nouvelles = 0, connuesN = 0;
  const lignes = [], toutes = [];
  for (const r of resultats) {
    const g = regroupe(r);
    toutes.push(...g.map((a) => a.cle));
    const nouv = g.filter((a) => !connues.has(a.cle)), conn = g.filter((a) => connues.has(a.cle));
    nouvelles += nouv.length; connuesN += conn.length;
    nouvellesErreurs += nouv.filter((a) => a.gravite === 'erreur').length;
    const nom = r.fiche.replace(/^cahiers\//, '').replace('.html', '');
    if (r.erreur) { lignes.push(`${nom} : IMPOSSIBLE A AUDITER — ${r.erreur}`); nouvellesErreurs++; continue; }
    if (!g.length) { lignes.push(`${nom} : OK (${r.saisies} saisies)`); continue; }
    lignes.push(`${nom} : ${nouv.length} nouvelle(s), ${conn.length} connue(s)`);
    for (const a of (drapeau('--tout-afficher') ? g : nouv)) lignes.push(`    [${a.gravite}] ${a.id} ${a.motif} (${a.n}x) : ${a.exemple}`);
  }
  const duree = Math.round((Date.now() - debut) / 1000);
  const bilan = `Bilan : ${resultats.length} fiche(s) en ${duree} s — ${nouvelles} anomalie(s) nouvelle(s) (dont ${nouvellesErreurs} erreur(s)), ${connuesN} deja connue(s) (connues.json).`;
  fs.writeFileSync(RAPPORT, [new Date().toISOString(), raison, ...lignes, bilan, ''].join('\n'), 'utf8');
  console.log(lignes.join('\n'));
  console.log(bilan + `\nRapport complet : outils/audit-reponses/rapport.txt`);

  if (drapeau('--enregistrer-connues') || drapeau('--actualiser-connues')) {
    // --enregistrer-connues : ajoute les anomalies vues (les tirages etant aleatoires, une anomalie rare peut manquer a un lancement) ;
    // --actualiser-connues  : pour les fiches auditees, REMPLACE leurs anomalies par celles de ce lancement (a faire apres une correction)
    let actuelles = new Set(connues);
    if (drapeau('--actualiser-connues')) {
      const auditees = new Set(resultats.map((r) => r.fiche.replace(/^cahiers\//, '').replace('.html', '')));
      actuelles = new Set([...connues].filter((k) => !auditees.has(k.split('|')[0])));
    }
    for (const k of toutes) actuelles.add(k);
    fs.writeFileSync(CONNUES, JSON.stringify({ commentaire: 'Anomalies deja connues (liste de travail) : cle = fiche|calcul|motif. Ne pas y ajouter une anomalie sans la traiter ensuite.', anomalies: [...actuelles].sort() }, null, 1) + '\n', 'utf8');
    console.log(`connues.json mis a jour (${actuelles.size} anomalies).`);
  }
  process.exitCode = nouvellesErreurs ? 1 : 0;
})();
