// Mesure de fréquentation anonyme (03/10/2026, demande de David : « juste le
// nombre de visites », de quiconque, connecté ou non).
//
// À chaque page ouverte, UNE écriture Firestore ajoute +1 à des compteurs du
// jour dans statistiques/{AAAA-MM-JJ}_{fragment} -- jamais d'adresse IP,
// d'identifiant ni de nom : seulement des totaux.
//   pv              pages vues
//   visites         nouvelles visites (plus de 30 min sans activité sur le site)
//   visiteurs       premier passage du jour de CE navigateur
//   s_<partie>      pages vues par partie du site (accueil, fiches de Première...)
//   a_<appareil>    visites par type d'appareil (ordinateur, tablette, téléphone)
//   pages.<clé>     pages vues par page (fiches les plus ouvertes)
//   derniere        clé de la page comptée par CETTE écriture (exigée par les
//                   règles pour vérifier que seule cette page prend +1)
// Le navigateur ne retient que la date de son dernier passage et l'heure de sa
// dernière activité (localStorage), aucun identifiant : un « visiteur » est un
// navigateur venu ce jour-là (une session Windows par élève en salle info).
// Fragments (_0 à _4, tirés au hasard) : une classe entière qui ouvre la même
// page à la même seconde ne sature pas un document unique.
// Exclus : le compte enseignant (et tout navigateur où il s'est connecté une
// fois), le site ouvert en local, les navigateurs pilotés (robots, tests).
// Toute erreur est ignorée en silence : la mesure ne doit jamais gêner la page.

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, setDoc, increment } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const NB_FRAGMENTS = 5;
const DUREE_VISITE_MS = 30 * 60 * 1000;
const CLE_EXCLU = 'stats-exclu';
const CLE_DERNIER_JOUR = 'stats-dernier-jour';
const CLE_DERNIERE_ACTIVITE = 'stats-derniere-activite';

function lire(cle) { try { return localStorage.getItem(cle); } catch (e) { return undefined; } }
function ecrire(cle, valeur) { try { localStorage.setItem(cle, valeur); return true; } catch (e) { return false; } }

function jourLocal(date) {
  const deux = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}`;
}

// Partie du site et clé de page, d'après l'adresse (mêmes clés que le tableau
// de bord tableau-de-bord/frequentation.html).
function decrirePage(chemin) {
  const c = chemin.replace(/index\.html$/, '');
  let m = c.match(/^\/cahiers\/(seconde|premiere|terminale)\/cahier-\d+\/fiche-(\d+)\.html$/);
  if (m) return { partie: 'fiches_' + m[1], page: `${m[1]}-f${Number(m[2])}` };
  m = c.match(/^\/cahiers\/(seconde|premiere|terminale)\/cahier-(\d+)\/$/);
  if (m) return { partie: 'cahiers', page: `${m[1]}-c${Number(m[2])}` };
  if (c === '/cahiers/') return { partie: 'cahiers', page: 'cahiers' };
  m = c.match(/^\/automatismes\/(?:([a-z]+)\/)?(?:([a-z-]+)\.html)?$/);
  if (m) return { partie: 'automatismes', page: ['auto', m[1], m[2]].filter(Boolean).join('-') };
  if (c === '/mes-devoirs/') return { partie: 'mes_devoirs', page: 'mes-devoirs' };
  if (c === '/connexion/') return { partie: 'connexion', page: 'connexion' };
  if (c === '/') return { partie: 'accueil', page: 'accueil' };
  return { partie: 'autres', page: 'autre' };
}

function typeAppareil() {
  const tactile = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if (!tactile) return 'ordinateur';
  return Math.min(screen.width, screen.height) < 600 ? 'telephone' : 'tablette';
}

function utilisateurInitial() {
  return new Promise((resoudre) => {
    const arreter = onAuthStateChanged(auth, (u) => { arreter(); resoudre(u); }, () => resoudre(null));
  });
}

async function compter() {
  if (location.protocol === 'file:' || ['localhost', '127.0.0.1', ''].includes(location.hostname)) return;
  if (navigator.webdriver) return;
  if (lire(CLE_EXCLU) === '1') return;

  const utilisateur = await utilisateurInitial();
  if (utilisateur) {
    const jeton = await utilisateur.getIdTokenResult();
    if (jeton.claims.admin === true) { ecrire(CLE_EXCLU, '1'); return; }
  }

  const maintenant = new Date();
  const jour = jourLocal(maintenant);
  const { partie, page } = decrirePage(location.pathname);

  const donnees = { pv: increment(1), ['s_' + partie]: increment(1), pages: { [page]: increment(1) }, derniere: page };
  // Sans stockage local (navigation privée stricte, stockage bloqué) : seules
  // les pages vues sont comptées, faute de pouvoir reconnaître une visite.
  const derniereActivite = lire(CLE_DERNIERE_ACTIVITE);
  const stockageDisponible = derniereActivite !== undefined;
  if (stockageDisponible) {
    if (!derniereActivite || maintenant.getTime() - Number(derniereActivite) > DUREE_VISITE_MS) {
      donnees.visites = increment(1);
      donnees['a_' + typeAppareil()] = increment(1);
    }
    if (lire(CLE_DERNIER_JOUR) !== jour) donnees.visiteurs = increment(1);
  }

  const fragment = Math.floor(Math.random() * NB_FRAGMENTS);
  await setDoc(doc(db, 'statistiques', `${jour}_${fragment}`), donnees, { merge: true });
  if (stockageDisponible) {
    ecrire(CLE_DERNIERE_ACTIVITE, String(maintenant.getTime()));
    ecrire(CLE_DERNIER_JOUR, jour);
  }
}

compter().catch(() => {});
