#!/usr/bin/env node
'use strict';
// Contrôle (28/10/2026) que la liste des fiches de assets/js/manifeste-fiches.js, les fichiers réels des
// dossiers cahiers/<niveau>/cahier-N/ et le texte de repli de cahiers/index.html (« 3 fiches · n° 1 à 3 »)
// concordent. La page « Tous les cahiers » calcule ces textes d'après le manifeste ; le texte écrit dans le
// HTML ne sert que de repli, mais doit rester juste.
//
//   node outils/verification/verifier-manifeste.js            contrôle (code de sortie 1 si écart)
//   node outils/verification/verifier-manifeste.js --corriger  réécrit le texte de repli de cahiers/index.html
//
// À lancer avant de pousser dès qu'une fiche est ajoutée, retirée ou renumérotée (REGLES-FICHES.md §5).
// Le manifeste lui-même reste à tenir à jour à la main (une entrée par fiche : href, numero, nom).

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const RACINE = path.resolve(__dirname, '..', '..');
const corriger = process.argv.includes('--corriger');

function plage(nums) {
  if (nums.length === 1) return 'n° ' + nums[0];
  const consecutifs = nums.every((v, i) => i === 0 || v === nums[i - 1] + 1);
  if (!consecutifs) return 'n° ' + nums.join(', ');
  return nums.length === 2 ? 'n° ' + nums[0] + ' et ' + nums[1] : 'n° ' + nums[0] + ' à ' + nums[nums.length - 1];
}
function texteMeta(nums) { return nums.length + (nums.length > 1 ? ' fiches' : ' fiche') + ' · ' + plage(nums); }

(async () => {
  const { MANIFESTE_CAHIERS } = await import(pathToFileURL(path.join(RACINE, 'assets/js/manifeste-fiches.js')).href);
  const erreurs = [];

  // 1. manifeste <-> fichiers de fiches
  const dossiersReels = [];
  for (const niveau of ['seconde', 'premiere', 'terminale']) {
    const base = path.join(RACINE, 'cahiers', niveau);
    for (const d of fs.readdirSync(base)) if (/^cahier-\d+$/.test(d)) dossiersReels.push({ niveau, cahier: d });
  }
  for (const d of dossiersReels) {
    if (!MANIFESTE_CAHIERS.some(c => c.niveau === d.niveau && c.cahier === d.cahier)) erreurs.push(`${d.niveau}/${d.cahier} : dossier absent du manifeste`);
  }
  for (const c of MANIFESTE_CAHIERS) {
    const dossier = path.join(RACINE, 'cahiers', c.niveau, c.cahier);
    if (!fs.existsSync(dossier)) { erreurs.push(`${c.niveau}/${c.cahier} : dossier introuvable`); continue; }
    const reels = fs.readdirSync(dossier).filter(x => /^fiche-\d+\.html$/.test(x)).sort();
    const listes = c.fiches.map(x => x.href).sort();
    if (JSON.stringify(reels) !== JSON.stringify(listes)) erreurs.push(`${c.niveau}/${c.cahier} : fichiers ${reels.join(', ')} ≠ manifeste ${listes.join(', ')}`);
    for (const x of c.fiches) {
      const n = Number((x.href.match(/fiche-(\d+)\.html/) || [])[1]);
      if (n !== x.numero) erreurs.push(`${c.niveau}/${c.cahier}/${x.href} : numero ${x.numero} ≠ nom de fichier`);
    }
  }

  // 2. texte de repli de cahiers/index.html
  const fichierIndex = path.join(RACINE, 'cahiers', 'index.html');
  const brut = fs.readFileSync(fichierIndex, 'utf8');
  const crlf = brut.includes('\r\n');
  let html = brut.replace(/\r\n/g, '\n');
  let corrections = 0;
  for (const c of MANIFESTE_CAHIERS) {
    const nums = c.fiches.map(x => x.numero).sort((a, b) => a - b);
    const attendu = texteMeta(nums);
    const re = new RegExp('(<a class="bento-carte[^"]*" href="' + c.niveau + '/' + c.cahier + '/index\\.html">[\\s\\S]*?<span class="bento-meta">)([^<]*)(</span>)');
    const m = html.match(re);
    if (!m) { erreurs.push(`cahiers/index.html : bloc de ${c.niveau}/${c.cahier} introuvable`); continue; }
    if (m[2] !== attendu) {
      if (corriger) { html = html.replace(re, (t, a, ancien, z) => a + attendu + z); corrections++; }
      else erreurs.push(`cahiers/index.html : ${c.niveau}/${c.cahier} affiche « ${m[2]} » au lieu de « ${attendu} »`);
    }
  }
  for (const niveau of ['seconde', 'premiere', 'terminale']) {
    const cs = MANIFESTE_CAHIERS.filter(c => c.niveau === niveau);
    const total = cs.reduce((t, c) => t + c.fiches.length, 0);
    const attendu = `${total} ${total > 1 ? 'fiches' : 'fiche'} ${cs.length > 1 ? 'réparties en ' + cs.length + ' cahiers' : 'dans 1 cahier'}`;
    const re = new RegExp('(<div class="groupe-niveau" id="niveau-' + niveau + '">[\\s\\S]*?<p class="groupe-niveau-sous">[^<]*?)(\\d+ fiches? (?:réparties en \\d+ cahiers|dans 1 cahier))');
    const m = html.match(re);
    if (!m) { erreurs.push(`cahiers/index.html : sous-titre de ${niveau} introuvable`); continue; }
    if (m[2] !== attendu) {
      if (corriger) { html = html.replace(re, (t, a) => a + attendu); corrections++; }
      else erreurs.push(`cahiers/index.html : sous-titre de ${niveau} affiche « ${m[2]} » au lieu de « ${attendu} »`);
    }
  }
  if (corriger && corrections) fs.writeFileSync(fichierIndex, crlf ? html.replace(/\n/g, '\r\n') : html, 'utf8');

  if (erreurs.length) {
    erreurs.forEach(e => console.error('✗ ' + e));
    console.error(`\n${erreurs.length} écart(s). Corriger le manifeste (assets/js/manifeste-fiches.js), puis relancer avec --corriger pour le texte de cahiers/index.html.`);
    process.exit(1);
  }
  const nb = MANIFESTE_CAHIERS.reduce((t, c) => t + c.fiches.length, 0);
  console.log(`✓ manifeste, fichiers et cahiers/index.html concordent (${MANIFESTE_CAHIERS.length} cahiers, ${nb} fiches)` + (corrections ? ` — ${corrections} texte(s) corrigé(s)` : ''));
})().catch(e => { console.error(e); process.exit(1); });
