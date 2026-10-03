// Captures reelles du site pour le guide de l'eleve (outils/guide-eleve).
// Prerequis : le site servi en local sur le port 8791 (serveur de .claude/launch.json),
// Node avec playwright, et un dossier node_modules contenant mathjax@3, mathjs@12.4.0,
// mathlive@0.110, firebase@12.19.0 et pngjs (chemin dans GUIDE_NODE_MODULES, sinon
// ./node_modules). Les bibliotheques sont servies en local a la place des CDN.
// Usage : node captures.js   (ecrit les images dans ./img)
const { chromium, devices } = require('playwright');
const path = require('path'); const fs = require('fs');
const NM = process.env.GUIDE_NODE_MODULES || path.join(__dirname, 'node_modules');
const OUT = path.join(__dirname, 'img');
const BASE = 'http://localhost:8791';

async function route(p) {
  await p.route(/cdnjs\.cloudflare\.com|unpkg\.com/, r => {
    const u = new URL(r.request().url()); let f;
    if (u.pathname.includes('mathjax')) f = NM + '/mathjax/es5/' + u.pathname.split('/es5/')[1].replace('.min.js', '.js');
    else if (u.pathname.includes('mathjs')) f = NM + '/mathjs/lib/browser/math.js';
    else if (u.pathname === '/mathlive') f = NM + '/mathlive/mathlive.min.js';
    else if (u.pathname.startsWith('/fonts/')) f = NM + '/mathlive' + u.pathname;
    else f = NM + u.pathname.replace(/^\/mathlive@[^/]*/, '/mathlive');
    if (fs.existsSync(f)) r.fulfill({ path: f, contentType: f.endsWith('.js') ? 'application/javascript' : (f.endsWith('.woff2') ? 'font/woff2' : undefined) });
    else r.abort();
  });
  await p.route(/gstatic\.com\/firebasejs\//, r => {
    const f = NM + '/firebase/' + new URL(r.request().url()).pathname.split('/').pop();
    if (fs.existsSync(f)) r.fulfill({ path: f, contentType: 'application/javascript' }); else r.abort();
  });
  await p.route(/googleapis\.com|firebaseio|firebaseapp/, r => r.abort());
}
async function page(b, url, opts = {}) {
  const ctx = await b.newContext({ viewport: { width: opts.w || 1000, height: opts.h || 900 }, deviceScaleFactor: 2, ...(opts.device || {}) });
  const p = await ctx.newPage(); await route(p);
  await p.goto(BASE + url, { waitUntil: 'load' }); await p.waitForTimeout(opts.attente || 3500);
  return p;
}
async function clip(p, nom, sel, marge = 8, sel2) {
  const boite = async q => p.locator(q).first().evaluate(e => { const r = e.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }; });
  const a = await boite(sel);
  let bb = a;
  if (sel2) { const c = await boite(sel2); const x0 = Math.min(a.x, c.x), y0 = Math.min(a.y, c.y); bb = { x: x0, y: y0, width: Math.max(a.x + a.width, c.x + c.width) - x0, height: Math.max(a.y + a.height, c.y + c.height) - y0 }; }
  await p.screenshot({ path: path.join(OUT, nom + '.png'), fullPage: true, clip: { x: Math.max(0, bb.x - marge), y: Math.max(0, bb.y - marge), width: bb.width + 2 * marge, height: bb.height + 2 * marge } });
  console.log('ok', nom);
}
const typeset = p => p.evaluate(() => window.MathJax && MathJax.typesetPromise ? MathJax.typesetPromise() : null);

(async () => {
  const b = await chromium.launch();
  const F = '/cahiers/premiere/cahier-5/fiche-14.html';

  // 1. haut de fiche : navigation + en-tete + mode
  { const p = await page(b, F);
    await p.evaluate(() => scrollTo(0, 0));
    await clip(p, 'fiche-haut', '.fil-ariane', 6, '#mode-panneau');
    // 2. questions corrigees (une juste, une fausse) en mode au fur et a mesure
    await p.evaluate(() => {
      const fr = v => { const f = math.fraction(v); return (f.s < 0 ? '-' : '') + (f.d === 1 ? f.n : f.n + '/' + f.d); };
      const iv = exercices[0].intervalleSpec.liste.map(i => `${i.inclusBas ? '[' : ']'}${isFinite(i.bas) ? fr(i.bas) : '-∞'};${isFinite(i.haut) ? fr(i.haut) : '+∞'}${i.inclusHaut ? ']' : '['}`).join(' ∪ ');
      document.getElementById('input-0').value = iv; verifierUne(0);
      document.getElementById('input-1').value = ']-∞;2['; verifierUne(1);
    });
    await clip(p, 'questions-corrigees', '.calcul-titre', 6, '#q-1');
    // 3. clavier simplifie ouvert
    await p.evaluate(() => { document.getElementById('input-2').value = '{'; toggleClavier(2); });
    await p.waitForTimeout(400);
    await clip(p, 'clavier-simplifie', '#q-2', 6);
    await p.evaluate(() => toggleClavier(2));
    // 4. bulle d'aide "?"
    await p.evaluate(() => { const b = document.querySelector('#grille-14-2') ; let t = b.previousElementSibling; while (t && !t.classList.contains('calcul-titre')) t = t.previousElementSibling; t.querySelector('.q-aide-btn').click(); });
    await p.waitForTimeout(400);
    await clip(p, 'aide', '#aide-groupe-grille-14-2', 6, '#aide-groupe-grille-14-2');
    await p.evaluate(() => document.querySelectorAll('.q-aide-bulle.ouverte').forEach(e => e.classList.remove('ouverte')));
    // 5. barre du bas + bilan apres "Corrige des erreurs"
    await p.evaluate(() => {
      document.getElementById('input-4').setValue(exercices[4].reponse, { format: 'ascii-math' });
      document.getElementById('input-5').setValue('7', { format: 'ascii-math' });
      verifierTout(); toggleCorrection();
    });
    await typeset(p); await p.waitForTimeout(800);
    await clip(p, 'barre-bas', '.barre-controle', 6, '#score-panneau');
    await p.context().close(); }

  // 6. clavier MathLive (champ mathematique)
  { const p = await page(b, F, { w: 1000, h: 820 });
    const champ = p.locator('#input-4'); await champ.scrollIntoViewIfNeeded();
    await p.evaluate(() => { const c = document.getElementById('input-4'); c.focus(); c.setValue('\\frac{5}{14}', { format: 'latex' }); });
    await p.locator('#input-4 + .q-clavier-btn').click(); await p.waitForTimeout(1500);
    await p.screenshot({ path: path.join(OUT, 'clavier-mathlive.png') }); console.log('ok clavier-mathlive');
    await p.context().close(); }

  // 7. mode devoir (simulation de l'etat d'un eleve connecte avec un devoir actif)
  { const p = await page(b, F);
    await p.evaluate(() => {
      eleveConnecte = true;
      etatDevoir = { titre: 'Sommes — fiche 14', nbEssaisMax: 3, essaisUtilises: 1, echeance: new Date(2026, 9, 10, 18, 0).getTime(), bloque: false };
      document.getElementById('mode-panneau').hidden = true;
      document.getElementById('btn-verifier').hidden = true;
      document.getElementById('zone-enregistrer').hidden = false;
      document.getElementById('zone-valider').hidden = false;
      mettreAJourEtatBoutons();
      document.getElementById('input-0').value = ']-∞;2['; verifierUne(0);
    });
    await clip(p, 'devoir-barre', '.barre-controle', 4, '#devoir-info');
    // confirmation de validation
    await p.evaluate(() => { demanderConfirmationDevoir('Valider ta fiche ?', `Cette validation compte une tentative pour le devoir « ${etatDevoir.titre} » : il t'en restera 1 ensuite.`, 'Valider'); });
    await p.waitForTimeout(500);
    await clip(p, 'devoir-confirmation', '.modal-devoir:not(#modal-devoir) .modal-devoir-contenu', 4);
    await p.context().close(); }

  // 8. automatismes : fiche (mode fiche)
  { const p = await page(b, '/automatismes/premiere/fiche.html', { attente: 4500 });
    await clip(p, 'auto-panneaux', '.mode-panneau', 6, '.themes-bandeau');
    await p.locator('[data-action="opt"][data-q="0"][data-k="1"]').click(); await p.waitForTimeout(300);
    await p.locator('[data-action="reponses"]').click(); await p.waitForTimeout(1500);
    await clip(p, 'auto-carte-corrigee', '#carte-0', 6);
    // mode chrono
    await p.locator('[data-action="mode"][data-mode="chrono"]').click(); await p.waitForTimeout(800);
    await clip(p, 'chrono-intro', '.mode-panneau', 6, '.chrono-intro');
    await p.locator('[data-action="demarrer-chrono"]').click(); await p.waitForTimeout(1500);
    await p.locator('[data-action="opt"]').first().click(); await p.waitForTimeout(300);
    await clip(p, 'chrono-question', '.progression', 6, '.barre-controle');
    await p.context().close(); }

  // 9. page de connexion
  { const p = await page(b, '/connexion/index.html', { w: 1000, h: 700 });
    await p.screenshot({ path: path.join(OUT, 'connexion.png') }); console.log('ok connexion');
    await p.context().close(); }

  // 10. accueil (haut)
  { const p = await page(b, '/index.html', { w: 1100, h: 640 });
    await p.screenshot({ path: path.join(OUT, 'accueil.png') }); console.log('ok accueil');
    await p.context().close(); }
  // clavier mathematique : on ne garde que le bas de la capture (le clavier)
  { const { PNG } = require(NM + '/pngjs');
    const src = PNG.sync.read(fs.readFileSync(path.join(OUT, 'clavier-mathlive.png')));
    const y0 = 1000, h = src.height - y0, out = new PNG({ width: src.width, height: h });
    PNG.bitblt(src, out, 0, y0, src.width, h, 0, 0);
    fs.writeFileSync(path.join(OUT, 'clavier-mathlive-crop.png'), PNG.sync.write(out));
    fs.unlinkSync(path.join(OUT, 'clavier-mathlive.png')); console.log('ok clavier-mathlive-crop'); }
  await b.close();
})();
