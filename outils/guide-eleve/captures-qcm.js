// Captures reelles du bloc « QCM Terminale » (QCM Bac) pour le guide de l'eleve (outils/guide-eleve), 25/10/2026.
// Prerequis : le site servi en local sur le port 8791 (serveur de .claude/launch.json), Node et le pilote de
// navigateur de navigateur.js (npm install dans outils/audit-reponses). Les bibliotheques (MathJax, MathLive,
// math.js) sont chargees depuis leurs CDN habituels ; les appels a Firestore sont coupes (aucune ecriture,
// aucune donnee d'eleve) et les navigateurs pilotes ne sont de toute facon pas comptes dans la frequentation.
// Usage : node captures-qcm.js   (ecrit les images dans ./img : qcm-carte-corrigee, qcm-bilan-niveau3, accueil, connexion)
const { lancer } = require('./navigateur'); const path = require('path');
const OUT = path.join(__dirname, 'img'); const BASE = 'http://localhost:8791';

async function page(b, url, attente = 4000) {
  const ctx = await b.newContext({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.route(/googleapis\.com|firebaseio|firebaseapp/, r => r.abort());
  await p.goto(BASE + url, { waitUntil: 'load' }); await p.waitForTimeout(attente);
  return p;
}
async function boite(p, sel) {
  return p.locator(sel).first().evaluate(e => { const r = e.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }; });
}
async function clip(p, nom, sel, marge = 8, sel2) {
  const a = await boite(p, sel); let bb = a;
  if (sel2) { const c = await boite(p, sel2); const x0 = Math.min(a.x, c.x), y0 = Math.min(a.y, c.y); bb = { x: x0, y: y0, width: Math.max(a.x + a.width, c.x + c.width) - x0, height: Math.max(a.y + a.height, c.y + c.height) - y0 }; }
  await p.screenshot({ path: path.join(OUT, nom + '.png'), fullPage: true, clip: { x: Math.max(0, bb.x - marge), y: Math.max(0, bb.y - marge), width: bb.width + 2 * marge, height: bb.height + 2 * marge } });
  console.log('ok', nom);
}

(async () => {
  const b = await lancer();

  // 1. (la page d'entree, avec « Mes reglages », est capturee par captures-reglages.js)

  // 2. une fiche a deux themes tires au sort
  { const p = await page(b, '/qcm-bac/fiche.html');
    // 3. une question corrigee, avec son explication (mauvaise reponse volontaire : option 0 puis comparaison)
    await p.locator('[data-action="opt"][data-q="0"][data-k="0"]').click(); await p.waitForTimeout(300);
    await p.locator('[data-action="reponses"]').click(); await p.waitForTimeout(2500);
    await clip(p, 'qcm-carte-corrigee', '#carte-0', 6);
    await p.context().close(); }

  // 4. niveau 3 : bilan avec la penalite (une reponse sur deux au hasard, les autres sans reponse)
  { const p = await page(b, '/qcm-bac/fiche.html?mode=fiche&niveau=3');   // reglage venu de la page d'entree (25/10/2026)
    await p.waitForTimeout(1500);
    const n = await p.locator('[data-action="opt"][data-k="0"]').count();
    for (let q = 0; q < 6; q++) { await p.locator(`[data-action="opt"][data-q="${q}"][data-k="${q % 4}"]`).click(); await p.waitForTimeout(150); }
    await p.locator('[data-action="reponses"]').click(); await p.waitForTimeout(2500);
    console.log('questions affichees (option a) :', n);
    await clip(p, 'qcm-bilan-niveau3', '.score-panneau', 8);
    await p.context().close(); }

  // 5. accueil et connexion (page 2 du guide) : refaits pour montrer le bouton gris de la barre de navigation
  { const ctx = await b.newContext({ viewport: { width: 1100, height: 640 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
    await p.route(/googleapis.com|firebaseio|firebaseapp/, r => r.abort());
    await p.goto(BASE + '/index.html', { waitUntil: 'load' }); await p.waitForTimeout(2500);
    await p.screenshot({ path: path.join(OUT, 'accueil.png') }); console.log('ok accueil'); await ctx.close(); }
  { const ctx = await b.newContext({ viewport: { width: 1000, height: 700 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
    await p.route(/googleapis.com|firebaseio|firebaseapp/, r => r.abort());
    await p.goto(BASE + '/connexion/index.html', { waitUntil: 'load' }); await p.waitForTimeout(2500);
    await p.screenshot({ path: path.join(OUT, 'connexion.png') }); console.log('ok connexion'); await ctx.close(); }

  await b.close();
})();
