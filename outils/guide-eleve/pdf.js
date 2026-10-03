// Genere assets/docs/guide-eleve.pdf a partir de guide-eleve.html (A4, une page par .page).
// Signale toute page dont le contenu deborde sur le pied de page.
// Usage : node pdf.js   (Node avec playwright)
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.join(__dirname, 'guide-eleve.html'), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  const deb = await p.evaluate(() => [...document.querySelectorAll('.page')].map((pg, i) => {
    const c = pg.querySelector('.contenu'); const pied = pg.querySelector('.pied');
    const bas = c ? Math.max(...[...c.children].map(e => e.getBoundingClientRect().bottom)) - pg.getBoundingClientRect().top : 0;
    const limite = pied ? pied.getBoundingClientRect().top - pg.getBoundingClientRect().top : pg.clientHeight;
    return `page ${i + 1}: contenu jusqu'a ${Math.round(bas)}px / limite ${Math.round(limite)}px ${bas > limite ? 'DEBORDE de ' + Math.round(bas - limite) + 'px' : 'ok (marge ' + Math.round(limite - bas) + 'px)'}`;
  }));
  console.log(deb.join('\n'));
  await p.pdf({ path: path.join(__dirname, '..', '..', 'assets', 'docs', 'guide-eleve.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
  await b.close();
})();
