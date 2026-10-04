// Cablage "devoir partiel" d'une fiche (modele fiche-09). Usage :
//   node cabler-fiche.js [--ecrire] fichier...   (sans --ecrire : essai a blanc)
// Chaque point de cablage propose une ou plusieurs variantes ; la premiere qui
// trouve EXACTEMENT une occurrence est appliquee. Si un point n'en trouve
// aucune, la fiche est signalee et laissee intacte.
const fs = require('fs');
const path = require('path');

const ecrire = process.argv.includes('--ecrire');
const fichiers = process.argv.slice(2).filter((a) => a !== '--ecrire');

const points = (cheminScript) => [
  ['balise script', [[
    /(<script src="[^"]*assets\/js\/claviers\.js"><\/script>)/,
    (m, a) => `${a}\n<script src="${cheminScript}"></script>`]]],
  ['bandeau', [[
    /(à rendre avant le \$\{formaterEcheanceDevoir\(etatDevoir\.echeance\)\}\.)`;/,
    (m, a) => `${a}\` + DevoirPartiel.phrase();`]]],
  ['entrainement libre', [[
    /(  etatDevoir = null;\n)(  const panneauMode = document\.getElementById\('mode-panneau'\);)/,
    (m, a, b) => `${a}  DevoirPartiel.retirer(); // devoir sur une partie de fiche : tous les calculs reviennent\n${b}`]]],
  ['validation', [[
    /    const reponses = Object\.values\(saisies\);\n/,
    () => '    // Devoir sur une partie de fiche : seules les reponses des calculs retenus\n    // comptent, et le total est le nombre de questions retenues.\n    const reponses = Object.values(saisies).filter((s) => DevoirPartiel.retenuParId(s.id));\n    const totalRetenu = DevoirPartiel.compter(exercices);\n']]],
  ['validerFiche total', [[
    /await window\.validerFiche\(FICHE_ID, idsReussis, exercices\.length, nbRepondues\);\n(\s*)afficherEtatSuivi\(`Fiche validée : \$\{idsReussis\.length\} \/ \$\{exercices\.length\} bonnes réponses\.`\);/,
    (m, esp) => `await window.validerFiche(FICHE_ID, idsReussis, totalRetenu, nbRepondues);\n${esp}afficherEtatSuivi(\`Fiche validée : \${idsReussis.length} / \${totalRetenu} bonnes réponses.\`);`]]],
  ['toutes saisies', [
    [/return exercices\.every\(\(ex, idx\) => valeurDuChamp\(document\.getElementById\('input-' \+ idx\)\) !== ''\);/,
      () => "return exercices.every((ex, idx) => !DevoirPartiel.retenu(ex) || valeurDuChamp(document.getElementById('input-' + idx)) !== '');"],
    [/(function toutesLesReponsesSontSaisies\(\) \{\n  return exercices\.every\(\(ex, idx\) => \{\n)/,
      (m, a) => `${a}    if (!DevoirPartiel.retenu(ex)) return true; // calcul masque (devoir sur une partie de fiche)\n`],
  ]],
  ['champ suivant', [[
    /  const idxSuivant = idxActuel \+ 1;\n/,
    () => '  let idxSuivant = idxActuel + 1;\n  // Devoir sur une partie de fiche : saute les questions des calculs masques.\n  while (idxSuivant < exercices.length && !DevoirPartiel.retenu(exercices[idxSuivant])) idxSuivant++;\n']]],
  ['verifierTout boucle', [[
    /(  exercices\.forEach\(\(ex, idx\) => \{\n)(    const ok = verifierUne\(idx\);\n    if \(ok !== null\) repondues\+\+;)/,
    (m, a, b) => `${a}    if (!DevoirPartiel.retenu(ex)) return; // calcul masque (devoir sur une partie de fiche)\n${b}`]]],
  ['verifierTout score', [[
    /textContent = score \+ ' \/ ' \+ exercices\.length;/,
    () => "textContent = score + ' / ' + DevoirPartiel.compter(exercices);"]]],
  ['toutes reponses', [[
    /(panel|panneau)\.innerHTML = exercices\.map\(/,
    (m, p) => `${p}.innerHTML = DevoirPartiel.exercicesRetenus(exercices).map(`]]],
  ['verifierEtatDevoir', [[
    /etatDevoir = await window\.verifierEtatDevoir\(FICHE_ID\);/,
    () => "// 2e argument : devoir ouvert explicitement depuis /mes-devoirs/\n      // (?devoir=<id>), voir suivi.js -- absent, le plus proche de son echeance.\n      etatDevoir = await window.verifierEtatDevoir(FICHE_ID, new URLSearchParams(window.location.search).get('devoir'));"]]],
  ['appliquer', [[
    /\n( *)(\/\/ Panneau de mode, "Corrige des erreurs", "Enregistrer"\/"Valider" :)/,
    (m, ind, a) => `\n  // Devoir sur une partie de fiche (04/10/2026) : masque les calculs non\n  // retenus (voir assets/js/devoir-partiel.js) tant que le devoir est actif ;\n  // sans effet pour un devoir sur la fiche entiere (etatDevoir.calculs nul).\n  if (etatDevoir) DevoirPartiel.appliquer(etatDevoir.calculs, exercices);\n\n${ind}${a}`]]],
];

const compte = (s, motif) => (s.match(new RegExp(motif.source, 'g')) || []).length;
const bilan = { ok: 0, ko: 0, deja: 0 };
for (const f of fichiers) {
  let src = fs.readFileSync(f, 'utf8');
  const crlf = src.includes('\r\n');
  if (crlf) src = src.replace(/\r\n/g, '\n');
  if (src.includes('devoir-partiel.js')) { console.log('DEJA  ', f); bilan.deja++; continue; }
  const mc = /<script src="([^"]*)assets\/js\/claviers\.js"><\/script>/.exec(src);
  if (!mc) { console.log('KO    ', f, ': claviers.js introuvable'); bilan.ko++; continue; }
  const problemes = [];
  let sortie = src;
  for (const [nom, variantes] of points(mc[1] + 'assets/js/devoir-partiel.js')) {
    const v = variantes.find(([motif]) => compte(sortie, motif) === 1);
    if (!v) { problemes.push(`${nom}=${variantes.map(([m]) => compte(sortie, m)).join('/')}`); continue; }
    sortie = sortie.replace(v[0], v[1]);
  }
  if (problemes.length) { console.log('KO    ', f, problemes.join(', ')); bilan.ko++; continue; }
  bilan.ok++;
  console.log('OK    ', f);
  if (ecrire) fs.writeFileSync(f, crlf ? sortie.replace(/\n/g, '\r\n') : sortie, 'utf8');
}
console.log(bilan);
