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
  let saisies = 0;
  for (let tour = 0; tour < opts.tiragesSaisie; tour++) {
    if (tour > 0) {
      window.confirm = () => true;
      try { await genererNouvelleFiche(); } catch (e) { break; }
      await dormir(700);
    }
    for (let i = 0; i < exercices.length; i++) {
      const e = exercices[i];
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
