// Verifie la syntaxe JavaScript des scripts integres de toutes les fiches de calcul
// (cahiers/**/fiche-NN.html), sans navigateur : chaque bloc <script> inline est compile avec
// vm.Script. A lancer apres toute modification d'une fiche, depuis la racine du depot :
//   node outils/verification/verifier-syntaxe-fiches.js
// Code de sortie 1 s'il y a une erreur. Ne verifie que la syntaxe : les reponses, l'affichage
// et le comportement se testent dans le navigateur (voir REGLES-FICHES.md, section 5).
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const racine = path.join(__dirname, '..', '..', 'cahiers');

function trouverFiches(dir, resultats) {
  for (const entree of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entree.name);
    if (entree.isDirectory()) trouverFiches(p, resultats);
    else if (/^fiche-\d+\.html$/.test(entree.name)) resultats.push(p);
  }
  return resultats;
}

const fichiers = trouverFiches(racine, []);
let erreurs = 0;

for (const f of fichiers) {
  const texte = fs.readFileSync(f, 'utf8');
  // blocs sans attribut src (les scripts externes ont un contenu vide)
  const blocs = [...texte.matchAll(/<script(?![^>]*\bsrc=)(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  for (const bloc of blocs) {
    try {
      new vm.Script(bloc[1], { filename: f });
    } catch (e) {
      erreurs++;
      console.log('ERREUR : ' + path.relative(path.join(racine, '..'), f));
      console.log('  ' + e.message);
    }
  }
}

console.log('Fichiers verifies : ' + fichiers.length);
console.log('Erreurs : ' + erreurs);
process.exitCode = erreurs ? 1 : 0;
