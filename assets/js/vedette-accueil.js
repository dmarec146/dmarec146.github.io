// Cartes « Cahiers de calcul en vedette » de l'accueil (29/10/2026, choix de David après maquette) :
//   - une carte Première et une carte Seconde : le cahier du JOUR (tiré au hasard, le même toute la journée pour un niveau
//     donné), sauf pour un élève connecté qui a un devoir de fiche de calcul en cours dans ce niveau : la carte montre alors le
//     cahier de ce devoir (celui dont l'échéance est la plus proche), avec un bandeau « Devoir à rendre le … » qui mène à la fiche ;
//   - une carte « Terminale » (à venir), sans lien.
// Le HTML de index.html contient un repli statique (JavaScript absent, ouverture en file://) ; ce script le remplace.
// Les devoirs de l'élève viennent de devoirs-notification.js, qui les charge déjà pour la pastille « Mes devoirs » : il publie le
// résultat (événement « devoirs-eleve-prets » et window.devoirsEleve), aucune lecture Firestore de plus.
import { MANIFESTE_CAHIERS } from './manifeste-fiches.js';

const NIVEAUX = [['premiere', 'Première', 'vc-sombre'], ['seconde', 'Seconde', 'vc-clair']];
const zone = document.getElementById('vedette-cartes');

function echapper(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

// Entier pseudo-aléatoire stable (FNV-1a) : mêmes graines, même résultat
function hacher(texte) {
  let h = 2166136261;
  for (let i = 0; i < texte.length; i++) { h ^= texte.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
// Jour local (change à minuit, heure de l'appareil)
function jourLocal() {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}
function cahierDuJour(niveau) {
  const liste = MANIFESTE_CAHIERS.filter((c) => c.niveau === niveau);
  return liste[hacher(jourLocal() + '|' + niveau) % liste.length];
}
function plage(nums) {
  if (nums.length === 1) return 'n° ' + nums[0];
  const consecutifs = nums.every((v, i) => i === 0 || v === nums[i - 1] + 1);
  if (!consecutifs) return 'n° ' + nums.join(', ');
  return nums.length === 2 ? 'n° ' + nums[0] + ' et ' + nums[1] : 'n° ' + nums[0] + ' à ' + nums[nums.length - 1];
}
function dateEcheance(ms) {
  const d = new Date(ms);
  const deux = (n) => String(n).padStart(2, '0');
  return deux(d.getDate()) + '/' + deux(d.getMonth() + 1) + ' à ' + d.getHours() + ' h' + (d.getMinutes() ? deux(d.getMinutes()) : '');
}

// Devoirs de fiche en cours de l'élève, rangés par niveau : { premiere: [devoir…], seconde: [...] }, du plus proche au plus lointain
function devoirsParNiveau(resultat) {
  const par = { premiere: [], seconde: [] };
  if (!resultat) return par;
  const ouverts = [].concat(resultat.aFaire || [], resultat.enregistres || []);
  for (const d of ouverts) {
    const m = d.type === 'fiche' && typeof d.ficheId === 'string' && d.ficheId.match(/^\/cahiers\/(premiere|seconde)\/(cahier-\d+)\/(fiche-\d+\.html)$/);
    if (m) par[m[1]].push({ devoir: d, cahier: m[2], href: m[3] });
  }
  for (const n of Object.keys(par)) par[n].sort((a, b) => a.devoir.echeanceMillis - b.devoir.echeanceMillis);
  return par;
}

function carteCahier(niveau, libelle, classe, cahier, avecDevoir, nbAutres) {
  const numero = cahier.cahier.replace('cahier-', '');
  const titre = cahier.titreCahier.split(' — ').slice(1).join(' — ') || cahier.titreCahier;
  const base = 'cahiers/' + niveau + '/' + cahier.cahier + '/';
  const nums = cahier.fiches.map((f) => f.numero).sort((a, b) => a - b);
  let bandeau = '';
  if (avecDevoir) {
    const f = cahier.fiches.find((x) => x.href === avecDevoir.href);
    const autres = nbAutres > 0 ? ' · + ' + nbAutres + (nbAutres > 1 ? ' autres devoirs' : ' autre devoir') + ' en cours' : '';
    bandeau = '<a class="vc-devoir" href="' + base + avecDevoir.href + '?devoir=' + encodeURIComponent(avecDevoir.devoir.id) + '">' +
      'Devoir à rendre le ' + dateEcheance(avecDevoir.devoir.echeanceMillis) +
      '<small>' + (f ? echapper(f.nom) + ' — fiche ' + f.numero : echapper(avecDevoir.devoir.titre || 'Devoir')) + autres + '</small></a>';
  }
  const items = cahier.fiches.map((f) =>
    '<li' + (avecDevoir && f.href === avecDevoir.href ? ' class="vc-dv"' : '') + '><a href="' + base + f.href + '"><b>' + f.numero + '</b> ' + echapper(f.nom) + '</a></li>').join('');
  return '<div class="vc-carte ' + classe + '">' +
    '<span class="vc-eti">' + libelle + ' · Cahier ' + numero + '</span>' + bandeau +
    '<h3><a class="vc-lien" href="' + base + 'index.html">' + echapper(titre) + '</a></h3>' +
    '<ul class="vc-fiches">' + items + '</ul>' +
    '<span class="vc-meta">' + nums.length + (nums.length > 1 ? ' fiches' : ' fiche') + ' · ' + plage(nums) + '</span>' +
    '<span class="vc-fleche" aria-hidden="true">→</span></div>';
}

const CARTE_TERMINALE = '<div class="vc-carte vc-avenir"><span class="vc-eti">Terminale</span><h3>Cahier de Terminale</h3>' +
  '<p class="vc-bientot">À venir — en préparation.</p></div>';

function dessiner(resultat) {
  const devoirs = devoirsParNiveau(resultat);
  const html = NIVEAUX.map(([niveau, libelle, classe]) => {
    const liste = devoirs[niveau];
    if (liste.length) {
      const choisi = liste[0];
      const cahier = MANIFESTE_CAHIERS.find((c) => c.niveau === niveau && c.cahier === choisi.cahier);
      if (cahier) return carteCahier(niveau, libelle, classe, cahier, choisi, liste.length - 1);
    }
    return carteCahier(niveau, libelle, classe, cahierDuJour(niveau), null, 0);
  }).join('') + CARTE_TERMINALE;
  zone.innerHTML = html;
}

if (zone) {
  dessiner(window.devoirsEleve || null);
  document.addEventListener('devoirs-eleve-prets', (ev) => dessiner(ev.detail));
}
