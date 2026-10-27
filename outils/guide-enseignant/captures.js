// Captures du guide de l'enseignant (27/10/2026), sur l'environnement de test LOCAL (donnees fictives uniquement) :
//   1. node outils/test-local/lancer.js          (emulateurs + site sur http://localhost:5173, laisser tourner)
//   2. node outils/guide-enseignant/seed-captures.js
//   3. node outils/guide-enseignant/captures.js  (ecrit dans ./img)
// Pilote de navigateur : ../guide-eleve/navigateur.js (playwright, ou playwright-core + Chrome installe).
const { lancer } = require('../guide-eleve/navigateur'); const path = require('path'); const fs = require('fs');
const OUT = path.join(__dirname, 'img'); const BASE = 'http://localhost:5173';
fs.mkdirSync(OUT, { recursive: true });

async function ouvrir(b, email, url) {
  const ctx = await b.newContext({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/connexion/?emulateur=1`, { waitUntil: 'load' });
  await p.fill('#pseudo', email); await p.fill('#mot-de-passe', 'test1234');
  await Promise.all([p.waitForURL((u) => !u.pathname.includes('/connexion/'), { timeout: 15000 }), p.click('button[type=submit]')]);
  await p.goto(`${BASE}${url}`, { waitUntil: 'load' }); await p.waitForTimeout(3500);
  // le bandeau rouge « MODE TEST » (emulateurs) ne doit pas figurer sur les captures
  await p.evaluate(() => { for (const d of document.querySelectorAll('div')) if ((d.textContent || '').startsWith('MODE TEST') && d.style.position === 'fixed') d.remove(); });
  return p;
}
async function boite(p, sel) {
  return p.locator(sel).first().evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }; });
}
async function clip(p, nom, sel, marge = 8) {
  const bb = await boite(p, sel);
  await p.screenshot({ path: path.join(OUT, nom + '.png'), fullPage: true,
    clip: { x: Math.max(0, bb.x - marge), y: Math.max(0, bb.y - marge), width: bb.width + 2 * marge, height: bb.height + 2 * marge } });
  console.log('ok', nom);
}

(async () => {
  const b = await lancer();

  // Enseignant avec classes : en-tete connecte (icones), boutons d'action, formulaire, listes, resultats
  { const p = await ouvrir(b, 'prof.martin@exemple.test', '/tableau-de-bord/devoirs.html');
    await clip(p, 'entete-connecte', '.site-entete', 0);
    await clip(p, 'actions', '.dev-actions-principales', 6);

    await p.click('#dev-bouton-attribuer'); await p.waitForTimeout(800); await p.fill('#dev-echeance', '2026-11-06T18:00'); await p.click('#dev-formulaire-titre');
    await clip(p, 'formulaire-fiche', '#dev-formulaire', 6);
    await p.selectOption('#dev-type', 'automatismes'); await p.waitForTimeout(500);
    await clip(p, 'formulaire-automatismes', '#dev-formulaire', 6);
    await p.selectOption('#dev-type', 'qcm-bac'); await p.waitForTimeout(500);
    await clip(p, 'formulaire-qcm', '#dev-formulaire', 6);
    await p.click('#dev-bouton-attribuer'); await p.waitForTimeout(400);

    await p.click('#dev-bouton-encours'); await p.waitForTimeout(1200);
    await clip(p, 'en-cours', '#dev-panneau-encours', 6);
    // resultats du premier devoir en cours (celui de Premiere, echeance la plus proche)
    await p.locator('#dev-corps-encours button', { hasText: 'Résultats' }).first().click(); await p.waitForTimeout(2500);
    await clip(p, 'resultats', '#dev-vue-resultats', 6);
    await p.click('#dev-resultats-retour'); await p.waitForTimeout(500);
    await p.click('#dev-bouton-devoirs-faits'); await p.waitForTimeout(1000);
    await clip(p, 'faits', '#dev-panneau-faits', 6);
    await p.context().close(); }

  // Enseignant sans eleve : encadre d'accueil
  { const p = await ouvrir(b, 'prof.nouveau@exemple.test', '/tableau-de-bord/devoirs.html');
    await clip(p, 'accueil-sans-eleve', '#dev-accueil', 8);
    await p.context().close(); }

  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
