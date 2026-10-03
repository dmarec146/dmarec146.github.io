// Tableau de bord « Fréquentation » (03/10/2026) : lit les compteurs anonymes
// écrits par assets/js/statistiques.js (collection statistiques, un document
// par jour et par fragment _0 à _4) et les affiche par période : tuiles,
// graphique jour par jour (ou semaine par semaine au-delà de deux mois),
// parties du site, appareils, fiches les plus ouvertes. Lecture réservée au
// compte enseignant (règles Firestore + vérification ci-dessous).

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { MANIFESTE_CAHIERS } from './manifeste-fiches.js';

const COMPTEURS = ['pv', 'visites', 'visiteurs'];
const PARTIES = [
  ['accueil', 'Accueil'],
  ['cahiers', 'Listes et sommaires des cahiers'],
  ['fiches_seconde', 'Fiches de Seconde'],
  ['fiches_premiere', 'Fiches de Première'],
  ['fiches_terminale', 'Fiches de Terminale'],
  ['automatismes', 'Automatismes'],
  ['mes_devoirs', 'Mes devoirs'],
  ['connexion', 'Connexion'],
  ['autres', 'Autres pages'],
];
const APPAREILS = [['ordinateur', 'Ordinateur'], ['tablette', 'Tablette'], ['telephone', 'Téléphone']];
const LIBELLES_MESURES = { visiteurs: 'Visiteurs', visites: 'Visites', pv: 'Pages vues' };
const NIVEAUX = { seconde: 'Seconde', premiere: 'Première', terminale: 'Terminale' };

const etat = { parJour: new Map(), periode: '30', mesure: 'visiteurs' };
const nombre = (n) => n.toLocaleString('fr-FR');

function jourLocal(date) {
  const deux = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}`;
}
function dateDe(jour) { const [a, m, j] = jour.split('-').map(Number); return new Date(a, m - 1, j); }
function jourCourt(jour) { const d = dateDe(jour); return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }); }
function jourLong(jour) { return dateDe(jour).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }

function nomFiche(cle) {
  const m = cle.match(/^(seconde|premiere|terminale)-f(\d+)$/);
  if (!m) return null;
  const numero = Number(m[2]);
  for (const cahier of MANIFESTE_CAHIERS) {
    if (cahier.niveau !== m[1]) continue;
    const fiche = cahier.fiches.find((f) => f.numero === numero);
    if (fiche) return `${NIVEAUX[m[1]]} · fiche ${numero} — ${fiche.nom}`;
  }
  return `${NIVEAUX[m[1]]} · fiche ${numero}`;
}

// ---------- chargement et regroupement par jour (fragments additionnés) ----------
async function charger() {
  const instantane = await getDocs(collection(db, 'statistiques'));
  const parJour = new Map();
  instantane.forEach((d) => {
    const jour = d.id.slice(0, 10);
    const data = d.data();
    const cumul = parJour.get(jour) || { pages: {} };
    for (const [cle, valeur] of Object.entries(data)) {
      if (cle === 'pages') {
        for (const [page, n] of Object.entries(valeur || {})) cumul.pages[page] = (cumul.pages[page] || 0) + n;
      } else if (typeof valeur === 'number') {
        cumul[cle] = (cumul[cle] || 0) + valeur;
      }
    }
    parJour.set(jour, cumul);
  });
  return parJour;
}

function joursDeLaPeriode() {
  const aujourdhui = new Date(); aujourdhui.setHours(0, 0, 0, 0);
  let debut;
  if (etat.periode === '7' || etat.periode === '30') {
    debut = new Date(aujourdhui); debut.setDate(debut.getDate() - Number(etat.periode) + 1);
  } else if (etat.periode === 'rentree') {
    const annee = aujourdhui.getMonth() >= 8 ? aujourdhui.getFullYear() : aujourdhui.getFullYear() - 1;
    debut = new Date(annee, 8, 1);
  } else {
    const jours = [...etat.parJour.keys()].sort();
    debut = jours.length ? dateDe(jours[0]) : new Date(aujourdhui);
    if (debut > aujourdhui) debut = new Date(aujourdhui);
  }
  const liste = [];
  for (const d = new Date(debut); d <= aujourdhui; d.setDate(d.getDate() + 1)) liste.push(jourLocal(d));
  return liste;
}

// Au-delà de deux mois, une barre par semaine (du lundi au dimanche).
function regrouper(jours) {
  const parSemaine = jours.length > 62;
  const groupes = [];
  for (const jour of jours) {
    const c = etat.parJour.get(jour) || {};
    let cle = jour, libelle = jourCourt(jour), detail = jourLong(jour);
    if (parSemaine) {
      const d = dateDe(jour); const decalage = (d.getDay() + 6) % 7; d.setDate(d.getDate() - decalage);
      cle = jourLocal(d); libelle = jourCourt(cle); detail = `Semaine du ${jourLong(cle)}`;
    }
    let g = groupes[groupes.length - 1];
    if (!g || g.cle !== cle) { g = { cle, libelle, detail, pv: 0, visites: 0, visiteurs: 0 }; groupes.push(g); }
    for (const k of COMPTEURS) g[k] += c[k] || 0;
  }
  return { groupes, parSemaine };
}

// ---------- graphique en barres (SVG, une seule mesure à la fois) ----------
function echelleRonde(max) {
  if (max <= 4) return 4;
  const p = Math.pow(10, Math.floor(Math.log10(max)));
  for (const f of [1, 2, 2.5, 5, 10]) if (f * p >= max) return f * p;
  return 10 * p;
}

function dessinerGraphique(groupes, parSemaine) {
  const zone = document.getElementById('fr-graphique');
  const mesure = etat.mesure;
  const L = 860, H = 270, mg = 46, md = 10, mh = 16, mb = 30;
  const largeur = L - mg - md, hauteur = H - mh - mb;
  const max = echelleRonde(Math.max(1, ...groupes.map((g) => g[mesure])));
  const pas = largeur / groupes.length;
  const barre = Math.max(2, Math.min(28, pas - Math.max(2, pas * 0.28)));
  const y = (v) => mh + hauteur - (v / max) * hauteur;
  const svgNS = 'http://www.w3.org/2000/svg';
  let svg = `<svg viewBox="0 0 ${L} ${H}" role="img" aria-label="${LIBELLES_MESURES[mesure]} ${parSemaine ? 'par semaine' : 'par jour'}" xmlns="${svgNS}">`;
  for (let i = 0; i <= 4; i++) {
    const v = (max / 4) * i, yy = y(v);
    svg += `<line x1="${mg}" x2="${L - md}" y1="${yy}" y2="${yy}" class="fr-grille${i === 0 ? ' fr-base' : ''}"/>`;
    svg += `<text x="${mg - 8}" y="${yy + 4}" class="fr-axe" text-anchor="end">${nombre(Math.round(v * 10) / 10)}</text>`;
  }
  const tous = Math.max(1, Math.ceil(groupes.length / 8));
  groupes.forEach((g, i) => {
    const cx = mg + pas * i + pas / 2;
    const v = g[mesure];
    if (v > 0) {
      const h = Math.max(1.5, (v / max) * hauteur), x = cx - barre / 2, yb = mh + hauteur, r = Math.min(4, barre / 2, h);
      svg += `<path class="fr-barre" d="M${x},${yb} V${yb - h + r} Q${x},${yb - h} ${x + r},${yb - h} H${x + barre - r} Q${x + barre},${yb - h} ${x + barre},${yb - h + r} V${yb} Z"/>`;
    }
    if ((groupes.length - 1 - i) % tous === 0) svg += `<text x="${cx}" y="${H - 9}" class="fr-axe" text-anchor="middle">${g.libelle}</text>`;
    svg += `<rect class="fr-cible" x="${mg + pas * i}" y="${mh}" width="${pas}" height="${hauteur}" data-i="${i}"/>`;
  });
  svg += `</svg><div class="fr-bulle" hidden></div>`;
  zone.innerHTML = svg;

  const bulle = zone.querySelector('.fr-bulle');
  const montrer = (cible) => {
    const g = groupes[Number(cible.dataset.i)];
    zone.querySelectorAll('.fr-cible.actif').forEach((c) => c.classList.remove('actif'));
    cible.classList.add('actif');
    bulle.innerHTML = `<b>${g.detail}</b><br>${LIBELLES_MESURES.visiteurs} : ${nombre(g.visiteurs)}<br>${LIBELLES_MESURES.visites} : ${nombre(g.visites)}<br>${LIBELLES_MESURES.pv} : ${nombre(g.pv)}`;
    bulle.hidden = false;
    const rz = zone.getBoundingClientRect(), rc = cible.getBoundingClientRect();
    const gauche = rc.left - rz.left + rc.width / 2;
    bulle.style.left = Math.min(Math.max(gauche, 90), rz.width - 90) + 'px';
  };
  zone.querySelectorAll('.fr-cible').forEach((c) => {
    c.addEventListener('mouseenter', () => montrer(c));
    c.addEventListener('click', () => montrer(c));
  });
  zone.addEventListener('mouseleave', () => { bulle.hidden = true; zone.querySelectorAll('.fr-cible.actif').forEach((c) => c.classList.remove('actif')); });
}

// ---------- barres horizontales (parties, appareils) et fiches ----------
function barresHTML(lignes, total) {
  const max = Math.max(1, ...lignes.map((l) => l.n));
  if (!total) return '<p class="fr-vide">Aucune donnée sur cette période.</p>';
  return lignes.filter((l) => l.n > 0).map((l) => `
    <div class="fr-ligne">
      <span class="fr-ligne-nom">${l.nom}</span>
      <span class="fr-ligne-piste"><span class="fr-ligne-barre" style="width:${(100 * l.n / max).toFixed(1)}%"></span></span>
      <span class="fr-ligne-valeur">${nombre(l.n)} <small>${Math.round(100 * l.n / total)} %</small></span>
    </div>`).join('');
}

function afficher() {
  document.querySelectorAll('[data-periode]').forEach((b) => b.classList.toggle('actif', b.dataset.periode === etat.periode));
  document.querySelectorAll('[data-mesure]').forEach((b) => b.classList.toggle('actif', b.dataset.mesure === etat.mesure));

  const jours = joursDeLaPeriode();
  const cumul = { pages: {} };
  for (const jour of jours) {
    const c = etat.parJour.get(jour);
    if (!c) continue;
    for (const [k, v] of Object.entries(c)) {
      if (k === 'pages') for (const [p, n] of Object.entries(v)) cumul.pages[p] = (cumul.pages[p] || 0) + n;
      else cumul[k] = (cumul[k] || 0) + v;
    }
  }
  document.getElementById('fr-t-visiteurs').textContent = nombre(cumul.visiteurs || 0);
  document.getElementById('fr-t-visites').textContent = nombre(cumul.visites || 0);
  document.getElementById('fr-t-pv').textContent = nombre(cumul.pv || 0);
  const jourJ = etat.parJour.get(jourLocal(new Date())) || {};
  document.getElementById('fr-t-jour').textContent = nombre(jourJ.visiteurs || 0);
  document.getElementById('fr-t-jour-note').textContent = `visiteurs · ${nombre(jourJ.visites || 0)} visites · ${nombre(jourJ.pv || 0)} pages vues`;

  const { groupes, parSemaine } = regrouper(jours);
  document.getElementById('fr-graphique-titre').textContent = parSemaine ? 'Semaine par semaine' : 'Jour par jour';
  document.getElementById('fr-col-periode').textContent = parSemaine ? 'Semaine du' : 'Jour';
  dessinerGraphique(groupes, parSemaine);
  document.getElementById('fr-corps-jours').innerHTML = [...groupes].reverse().map((g) =>
    `<tr><td>${parSemaine ? g.libelle : g.detail}</td><td>${nombre(g.visiteurs)}</td><td>${nombre(g.visites)}</td><td>${nombre(g.pv)}</td></tr>`).join('');

  document.getElementById('fr-parties').innerHTML = barresHTML(PARTIES.map(([k, nom]) => ({ nom, n: cumul['s_' + k] || 0 })), cumul.pv || 0);
  const totalAppareils = APPAREILS.reduce((s, [k]) => s + (cumul['a_' + k] || 0), 0);
  document.getElementById('fr-appareils').innerHTML = barresHTML(APPAREILS.map(([k, nom]) => ({ nom, n: cumul['a_' + k] || 0 })), totalAppareils);

  const fiches = Object.entries(cumul.pages).map(([cle, n]) => ({ nom: nomFiche(cle), n })).filter((f) => f.nom).sort((a, b) => b.n - a.n).slice(0, 15);
  const maxF = Math.max(1, ...fiches.map((f) => f.n));
  document.getElementById('fr-fiches').innerHTML = fiches.length
    ? `<table class="tdb-tableau fr-tableau-fiches"><thead><tr><th>#</th><th>Fiche</th><th>Pages vues</th></tr></thead><tbody>${fiches.map((f, i) =>
      `<tr><td>${i + 1}</td><td>${f.nom}</td><td class="fr-cellule-barre"><span class="fr-nb">${nombre(f.n)}</span><span class="fr-mini-piste"><span class="fr-mini-barre" style="width:${(100 * f.n / maxF).toFixed(1)}%"></span></span></td></tr>`).join('')}</tbody></table>`
    : '<p class="fr-vide">Aucune fiche ouverte sur cette période.</p>';
}

async function initialiser() {
  try {
    etat.parJour = await charger();
    document.getElementById('fr-chargement').hidden = true;
    document.getElementById('fr-contenu').hidden = false;
    document.querySelectorAll('[data-periode]').forEach((b) => b.addEventListener('click', () => { etat.periode = b.dataset.periode; afficher(); }));
    document.querySelectorAll('[data-mesure]').forEach((b) => b.addEventListener('click', () => { etat.mesure = b.dataset.mesure; afficher(); }));
    afficher();
  } catch (erreur) {
    console.error('Fréquentation : chargement impossible.', erreur);
    document.getElementById('fr-chargement').hidden = true;
    const zone = document.getElementById('fr-erreur');
    zone.textContent = erreur && erreur.code === 'permission-denied'
      ? "Lecture refusée : les règles Firestore de la fréquentation ne sont peut-être pas encore publiées (firestore.rules → Console Firebase)."
      : 'Impossible de charger les statistiques pour le moment.';
    zone.hidden = false;
  }
}

onAuthStateChanged(auth, async (utilisateur) => {
  if (!utilisateur) { window.location.replace('../connexion/index.html'); return; }
  const jeton = await utilisateur.getIdTokenResult();
  if (jeton.claims.admin !== true) { window.location.replace('../index.html'); return; }
  initialiser();
});
