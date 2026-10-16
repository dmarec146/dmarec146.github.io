// Pilote de navigateur des scripts du guide (pdf.js, captures.js).
// 1. « playwright » s'il est installe ET que son Chromium est present ;
// 2. sinon playwright-core + le Chrome DEJA installe, comme l'outil d'audit (outils/audit-reponses : un seul
//    `npm install` par machine, rien d'autre a telecharger).
const path = require('path');

function charger(nom, chemin) { try { return require(chemin || nom); } catch (e) { return null; } }

const complet = charger('playwright');
const core = charger('playwright-core', path.join(__dirname, '..', 'audit-reponses', 'node_modules', 'playwright-core'));
const pilote = complet || core;
if (!pilote) {
  console.error("Aucun pilote de navigateur : lancer `npm install` dans outils/audit-reponses (playwright-core, utilise le Chrome installe).");
  process.exit(1);
}

async function lancer() {
  if (complet) {
    try { return await complet.chromium.launch(); } catch (e) { /* Chromium de playwright absent : repli ci-dessous */ }
  }
  if (!core) throw new Error("Chromium de playwright introuvable et playwright-core absent : `npm install` dans outils/audit-reponses.");
  return core.chromium.launch({ channel: 'chrome', headless: true });
}

module.exports = { chromium: pilote.chromium, devices: pilote.devices, lancer };
