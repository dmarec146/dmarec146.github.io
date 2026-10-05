#!/usr/bin/env node
'use strict';

// Cable le bareme en points (assets/js/bareme.js) dans une fiche de Premiere qui n'en a pas
// encore : balise <script>, appel Bareme.definir (vide : le contenu vient de fiche-NN.json via
// appliquer-bareme.js) et les quatre points d'accroche de la fiche (fin du devoir, validation,
// score, affichage). Idempotent. Les memes accroches que les fiches pilotes 2 et 9.
//
//   node cabler-fiche.js 01

const fs = require('fs');
const path = require('path');
const R = (s, ...v) => String.raw(s, ...v).replace(/§/g, '`').replace(/¤/g, '$');   // § = accent grave, ¤ = dollar

const num = process.argv[2];
if (!/^\d\d$/.test(num || '')) { console.error('Usage : node cabler-fiche.js NN'); process.exit(1); }
const racine = path.join(__dirname, '..', '..');
const dossiers = fs.readdirSync(path.join(racine, 'cahiers', 'premiere')).filter((d) => d.startsWith('cahier-'));
const trouve = dossiers.map((d) => path.join('cahiers', 'premiere', d, `fiche-${num}.html`)).find((f) => fs.existsSync(path.join(racine, f)));
if (!trouve) { console.error('fiche introuvable : ' + num); process.exit(1); }
const fichier = path.join(racine, trouve);
const brut = fs.readFileSync(fichier, 'utf8');
const crlf = brut.includes('\r\n');
let c = brut.replace(/\r\n/g, '\n');
if (c.includes('Bareme.definir(')) { console.log('deja cablee : ' + trouve); process.exit(0); }

function rep(a, b) { const n = c.split(a).length - 1; if (n !== 1) throw new Error(n + ' x ' + a.slice(0, 90)); c = c.replace(a, () => b); }

rep(R`<script src="../../../assets/js/devoir-partiel.js"></script>
`, R`<script src="../../../assets/js/devoir-partiel.js"></script>
<script src="../../../assets/js/bareme.js"></script>
<script>
// Barème de la fiche (points par question ; les calculs avancés sont un bonus) : voir assets/js/bareme.js
Bareme.definir({"points":{},"bonus":[]});
</script>
`);
rep(R`  DevoirPartiel.retirer(); // devoir sur une partie de fiche : tous les calculs reviennent
`, R`  DevoirPartiel.retirer(); // devoir sur une partie de fiche : tous les calculs reviennent
  if (window.Bareme) Bareme.afficher(false); // plus de barème hors devoir
`);
rep(R`    await window.validerFiche(FICHE_ID, idsReussis, totalRetenu, nbRepondues);
    afficherEtatSuivi(§Fiche validée : ¤{idsReussis.length} / ¤{totalRetenu} bonnes réponses.§);
`, R`    // Barème en points (assets/js/bareme.js) : note pondérée, calculs avancés en bonus.
    const bareme = window.Bareme && Bareme.visible() ? Bareme.calculer(exercices, saisies) : null;
    await window.validerFiche(FICHE_ID, idsReussis, bareme ? bareme.total : totalRetenu, nbRepondues, bareme || undefined);
    afficherEtatSuivi(bareme
      ? §Fiche validée : ¤{Bareme.format(bareme.score)} / ¤{Bareme.format(bareme.total)} points.§
      : §Fiche validée : ¤{idsReussis.length} / ¤{totalRetenu} bonnes réponses.§);
`);
rep(R`  document.getElementById('score-chiffre').textContent = score + ' / ' + DevoirPartiel.compter(exercices);
`, R`  document.getElementById('score-chiffre').textContent = (window.Bareme && Bareme.visible())
    ? Bareme.libelleScore(exercices, saisies)
    : score + ' / ' + DevoirPartiel.compter(exercices);
`);
rep(R`  if (etatDevoir) DevoirPartiel.appliquer(etatDevoir.calculs, exercices);
`, R`  if (etatDevoir) DevoirPartiel.appliquer(etatDevoir.calculs, exercices);
  // Barème en points : uniquement dans un devoir (assets/js/bareme.js) ; entraînement libre : rien.
  if (window.Bareme) Bareme.afficher(!!etatDevoir);
`);

fs.writeFileSync(fichier, crlf ? c.replace(/\n/g, '\r\n') : c, 'utf8');
console.log('cablee : ' + trouve);
