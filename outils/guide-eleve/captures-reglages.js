// Captures reelles des REGLAGES D'ENTREE (Automatismes et QCM Terminale) pour le guide de l'eleve, 25/10/2026.
// Memes prerequis que captures-qcm.js (site servi sur le port 8791, pilote de navigateur.js, Firestore coupe).
// Usage : node captures-reglages.js   (ecrit dans ./img : auto-reglages, auto-recap, chrono-intro, qcm-accueil)
const { lancer } = require('./navigateur'); const path = require('path');
const OUT = path.join(__dirname, 'img'); const BASE = 'http://localhost:8791';

async function page(b, url, attente = 3500) {
  const ctx = await b.newContext({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.route(/googleapis\.com|firebaseio|firebaseapp/, r => r.abort());
  await p.goto(BASE + url, { waitUntil: 'load' }); await p.waitForTimeout(attente);
  return p;
}
async function boite(p, sel, dernier) {
  const l = p.locator(sel); const e = dernier ? l.last() : l.first();
  return e.evaluate(e => { const r = e.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }; });
}
// capture du rectangle englobant sel (premier element) et sel2 (dernier element)
async function clip(p, nom, sel, marge = 8, sel2) {
  const a = await boite(p, sel); let bb = a;
  if (sel2) { const c = await boite(p, sel2, true); const x0 = Math.min(a.x, c.x), y0 = Math.min(a.y, c.y); bb = { x: x0, y: y0, width: Math.max(a.x + a.width, c.x + c.width) - x0, height: Math.max(a.y + a.height, c.y + c.height) - y0 }; }
  await p.screenshot({ path: path.join(OUT, nom + '.png'), fullPage: true, clip: { x: Math.max(0, bb.x - marge), y: Math.max(0, bb.y - marge), width: bb.width + 2 * marge, height: bb.height + 2 * marge } });
  console.log('ok', nom);
}

(async () => {
  const b = await lancer();
  // 1. entree des automatismes : « Mes reglages » puis les deux series a lancer
  { const p = await page(b, '/automatismes/premiere/index.html', 2500);
    await clip(p, 'auto-reglages', '.reglages-carte', 10);
    await p.context().close(); }
  // 2. page de travail : la ligne de rappel et les themes tires au sort
  { const p = await page(b, '/automatismes/premiere/fiche.html?mode=fiche&niveau=2', 4500);
    await clip(p, 'auto-recap', '.reglages-recap', 6, '.themes-bandeau');
    await p.context().close(); }
  // 3. chrono : l'ecran avant le depart, avec la ligne de rappel
  { const p = await page(b, '/automatismes/premiere/fiche.html?mode=chrono&niveau=2&duree=120', 4500);
    await clip(p, 'chrono-intro', '.reglages-recap', 6, '.chrono-intro');
    await p.context().close(); }
  // 4. entree du QCM Terminale : reglages (niveau 3 selectionne pour montrer la penalite), series, themes
  { const p = await page(b, '/qcm-bac/index.html', 2500);
    await p.locator('[data-niveau="3"]').click(); await p.waitForTimeout(300);
    await clip(p, 'qcm-accueil', '.reglages-carte', 10, '.themes-note');
    await p.context().close(); }
  await b.close();
})();
