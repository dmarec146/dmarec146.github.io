#!/usr/bin/env node
'use strict';
// Catalogue des phrases de méthode des « Détails » de correction (16/10/2026).
//
// L'outil outils/details-correction/controle.js vérifie les calculs mais pas les mots. Ce second outil gère les MOTS :
//   - catalogue.json garde chaque phrase déjà relue (statut « validee » ou « refusee », qui l'a relue, quand, pourquoi) ;
//   - un lancement compare les phrases utilisées par les fiches (phrases.json, produit par l'outil des détails) au catalogue et ne
//     signale que les phrases NOUVELLES ou REFUSÉES : une phrase déjà validée n'est jamais relue deux fois, d'une fiche à l'autre ;
//   - il écrit demande-relecture.md, le texte à confier à un relecteur indépendant (agent) pour les phrases nouvelles ;
//   - il enregistre ensuite les verdicts du relecteur ou de David dans le catalogue.
//
//   node outils/phrases-details/controle-phrases.js                      rapport : phrases nouvelles, refusées, inutilisées
//   node outils/phrases-details/controle-phrases.js --verdicts v.json    enregistre les verdicts [{phrase, verdict:'ok'|'probleme', raison, correction}]
//                                                      [--source agent|david|claude]  (défaut agent)
//   node outils/phrases-details/controle-phrases.js --valider [--source david]       valide toutes les phrases nouvelles du rapport
//   node outils/phrases-details/controle-phrases.js --oublier "phrase"   retire une phrase du catalogue (à relire)
// Code de sortie 1 s'il reste une phrase nouvelle ou refusée dans les fiches.
const fs = require('fs');
const path = require('path');

const ICI = __dirname;
const PHRASES = path.join(ICI, '..', 'details-correction', 'phrases.json');
const CATALOGUE = path.join(ICI, 'catalogue.json');
const args = process.argv.slice(2);
const option = (nom, defaut) => { const i = args.indexOf(nom); return i >= 0 ? args[i + 1] : defaut; };
const drapeau = (nom) => args.includes(nom);

const catalogue = fs.existsSync(CATALOGUE) ? JSON.parse(fs.readFileSync(CATALOGUE, 'utf8')) : { phrases: {} };
const enregistrer = () => fs.writeFileSync(CATALOGUE, JSON.stringify(catalogue, null, 1) + '\n');
const aujourdhui = new Date().toISOString().slice(0, 10);

if (option('--oublier')) {
  const p = option('--oublier');
  if (catalogue.phrases[p]) { delete catalogue.phrases[p]; enregistrer(); console.log('retirée du catalogue : « ' + p + ' »'); } else console.log('absente du catalogue : « ' + p + ' »');
  process.exit(0);
}

if (!fs.existsSync(PHRASES)) {
  console.error('phrases.json absent : lancer d\'abord node outils/details-correction/controle.js <fiche> (il écrit phrases.json).');
  process.exit(2);
}
const utilisees = JSON.parse(fs.readFileSync(PHRASES, 'utf8'));
// regroupe par phrase (une même phrase peut venir de plusieurs fiches)
const parPhrase = new Map();
for (const u of utilisees) {
  if (!parPhrase.has(u.phrase)) parPhrase.set(u.phrase, { phrase: u.phrase, fiches: [], exercices: [], exemple: u.exemple, enonce: u.enonce, detailComplet: u.detailComplet });
  const g = parPhrase.get(u.phrase);
  g.fiches.push(u.fiche.replace(/^cahiers\//, '')); g.exercices.push(...u.exercices.map((x) => u.fiche.replace(/^cahiers\/(\w+)\/cahier-(\d+)\/fiche-(\d+)\.html$/, 'f$3') + ' ' + x));
}

// enregistrement de verdicts
if (option('--verdicts')) {
  const source = option('--source', 'agent');
  const verdicts = JSON.parse(fs.readFileSync(option('--verdicts'), 'utf8'));
  let ok = 0, ko = 0, inconnues = 0;
  for (const v of verdicts) {
    if (!parPhrase.has(v.phrase) && !catalogue.phrases[v.phrase]) { inconnues++; console.log('phrase inconnue (ni utilisée ni au catalogue) : « ' + v.phrase + ' »'); continue; }
    if (v.verdict === 'ok') { catalogue.phrases[v.phrase] = { statut: 'validee', source, date: aujourdhui, remarque: v.raison || '' }; ok++; }
    else { catalogue.phrases[v.phrase] = { statut: 'refusee', source, date: aujourdhui, remarque: (v.raison || '') + (v.correction ? ' — correction proposée : ' + v.correction : '') }; ko++; }
  }
  enregistrer();
  console.log(`verdicts enregistrés (source : ${source}) : ${ok} validée(s), ${ko} refusée(s), ${inconnues} inconnue(s).`);
}

// validation en bloc des phrases nouvelles
if (drapeau('--valider')) {
  const source = option('--source', 'david');
  let n = 0;
  for (const [p] of parPhrase) if (!catalogue.phrases[p] || catalogue.phrases[p].statut !== 'validee') { catalogue.phrases[p] = { statut: 'validee', source, date: aujourdhui, remarque: '' }; n++; }
  enregistrer();
  console.log(`${n} phrase(s) validée(s) (source : ${source}).`);
}

const nouvelles = [], refusees = [], validees = [];
for (const [p, g] of parPhrase) {
  const c = catalogue.phrases[p];
  if (!c) nouvelles.push(g); else if (c.statut === 'refusee') refusees.push({ ...g, remarque: c.remarque }); else validees.push({ ...g, source: c.source });
}
const inutilisees = Object.keys(catalogue.phrases).filter((p) => !parPhrase.has(p));
const sources = {};
for (const v of validees) sources[v.source] = (sources[v.source] || 0) + 1;

const lignes = [];
lignes.push(`Phrases utilisées par les fiches contrôlées : ${parPhrase.size} — validées ${validees.length}` + (Object.keys(sources).length ? ' (' + Object.entries(sources).map(([s, n]) => `${n} par ${s}`).join(', ') + ')' : '') + `, nouvelles ${nouvelles.length}, refusées ${refusees.length}.`);
if (refusees.length) { lignes.push('', 'REFUSÉES (encore utilisées : à corriger dans la fiche) :'); for (const r of refusees) lignes.push(`  « ${r.phrase} »  (${r.exercices.join(', ')})\n      motif : ${r.remarque}\n      exemple : ${r.exemple}`); }
if (nouvelles.length) { lignes.push('', 'NOUVELLES (à relire) :'); for (const r of nouvelles) lignes.push(`  « ${r.phrase} »  (${r.exercices.join(', ')})\n      exemple : ${r.exemple}`); }
if (inutilisees.length && drapeau('--tout-afficher')) { lignes.push('', 'AU CATALOGUE MAIS NON UTILISÉES par ces fiches :'); for (const p of inutilisees) lignes.push('  « ' + p + ' »'); }
console.log(lignes.join('\n'));

// texte à confier à un relecteur indépendant, pour les phrases nouvelles seulement
if (nouvelles.length) {
  const bloc = nouvelles.map((n, i) => `### Phrase ${i + 1} : « ${n.phrase} »\n\nExercice(s) concerné(s) : ${n.exercices.join(', ')}\n\nÉnoncé d'un exemple : ${n.enonce}\n\nDétail complet de cet exemple (LaTeX, une ligne par étape ; la phrase à juger est dans les \\text{…}) :\n\n${n.detailComplet.map((l) => '    ' + l).join('\n')}\n`).join('\n');
  const texte = `# Relecture indépendante de phrases de correction (fiches de mathématiques de Première, spécialité)

Contexte : un site d'exercices auto-corrigés pour des élèves de Première (spécialité mathématiques, programme français). Quand un élève se trompe, un bouton « Détails » déplie les étapes de la correction. Les calculs sont vérifiés par ailleurs (par programme). **Ta mission porte uniquement sur les MOTS** : les phrases écrites dans les \\text{…} des étapes. Chacune est affichée dans de nombreux tirages aléatoires de l'exercice (nombres différents, signes différents, cas particuliers).

Pour chaque phrase ci-dessous, cherche activement des raisons de la refuser. Ne présume pas qu'elle est juste. Demande-toi :
1. La phrase est-elle mathématiquement vraie pour TOUS les tirages possibles de l'exercice, y compris les cas particuliers (valeur nulle, négative, égale à 1, nombres égaux, dénominateur qui se simplifie…) ?
2. Est-elle vraie parce que l'énoncé le garantit, ou affirme-t-elle une propriété (suite arithmétique, signe, non-nullité…) que rien ne justifie dans l'énoncé affiché ?
3. Est-elle correctement tournée en français pour un élève de Première (accord, ponctuation, vocabulaire du programme, absence d'ambiguïté) ?
4. Peut-elle induire une erreur de méthode (confondre équation et inéquation, oublier un changement de sens, dire « donc » sans conséquence logique…) ?

Réponds par un tableau JSON, un objet par phrase, dans l'ordre, au format exact :
[{"phrase": "<la phrase telle qu'écrite ci-dessous>", "verdict": "ok" | "probleme", "raison": "<une ou deux phrases>", "correction": "<formulation proposée si probleme, sinon vide>"}]
Utilise "probleme" dès qu'un doute sérieux subsiste, en l'expliquant. N'utilise "ok" que si tu as cherché un contre-exemple sans en trouver.

${bloc}`;
  fs.writeFileSync(path.join(ICI, 'demande-relecture.md'), texte);
  console.log('\n(demande-relecture.md écrite : texte à confier à un relecteur indépendant)');
}
process.exit(nouvelles.length || refusees.length ? 1 : 0);
