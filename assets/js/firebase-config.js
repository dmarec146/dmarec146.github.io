// Initialisation Firebase, partagée par toutes les pages qui en ont besoin
// (connexion, câblage du suivi dans les fiches, tableau de bord).
// SDK modulaire chargé depuis le CDN Google — pas de build, cohérent avec
// le reste du site (fichiers HTML/JS servis tels quels par GitHub Pages).

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { initializeAuth, browserSessionPersistence, inMemoryPersistence, connectAuthEmulator, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Ces identifiants sont publics (ils désignent le projet, pas un secret) :
// c'est le champ des règles de sécurité Firestore/Auth qui protège les données.
const firebaseConfig = {
  apiKey: "AIzaSyAlVsufBIQmPQ2dxfaQ1tPi1JVMNYK5TlI",
  authDomain: "cahiers-interactifs.firebaseapp.com",
  projectId: "cahiers-interactifs",
  storageBucket: "cahiers-interactifs.firebasestorage.app",
  messagingSenderId: "628099107506",
  appId: "1:628099107506:web:e8571d71d1ef0e362fd7ab"
};

// Mode test local (26/10/2026) : sur le poste de David uniquement (adresse
// localhost / 127.0.0.1), la page peut se brancher sur les émulateurs Firebase
// (outils/test-local) au lieu du vrai projet : fausse base, faux comptes, aucune
// donnée réelle. On l'active en ouvrant une page avec ?emulateur=1 (mémorisé
// ensuite pour ce navigateur), on le coupe avec ?emulateur=0. Sur n'importe
// quelle autre adresse (cahiers-interactifs.fr, github.io...) ce bloc ne fait
// rien : le test hostname ci-dessous l'empêche, quoi que contienne l'adresse.
const SUR_POSTE_LOCAL = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
function emulateurDemande() {
  if (!SUR_POSTE_LOCAL) return false;
  try {
    const param = new URLSearchParams(window.location.search).get('emulateur');
    if (param === '1') window.localStorage.setItem('cahiers-emulateur', '1');
    if (param === '0') window.localStorage.removeItem('cahiers-emulateur');
    return window.localStorage.getItem('cahiers-emulateur') === '1';
  } catch (e) {
    return false;
  }
}
const MODE_EMULATEUR = emulateurDemande();

const app = initializeApp(MODE_EMULATEUR
  ? { apiKey: 'cle-emulateur', authDomain: 'localhost', projectId: 'demo-cahiers' }
  : firebaseConfig);

export { app, MODE_EMULATEUR };
// Connexion limitée à l'ONGLET (04/11/2026, demande de David : postes partagés de la salle informatique, et pages qui doivent
// être rechargées au déploiement) : la session vit dans sessionStorage, donc disparaît à la fermeture de l'onglet ou du
// navigateur et n'est pas partagée entre onglets (un lien ouvert dans un nouvel onglet demande de se reconnecter). La
// navigation d'une page à l'autre dans le même onglet la conserve. Repli en mémoire si sessionStorage est bloqué.
// Avec getAuth, la session était gardée durablement (IndexedDB) jusqu'à « Se déconnecter » : ce changement oblige
// tout le monde à se reconnecter une fois, voulu.
export const auth = initializeAuth(app, { persistence: [browserSessionPersistence, inMemoryPersistence] });
export const db = getFirestore(app);

if (MODE_EMULATEUR) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  // Bandeau permanent : impossible de prendre cette page pour le vrai site.
  const poserBandeau = () => {
    const bandeau = document.createElement('div');
    bandeau.textContent = 'MODE TEST — données fictives (émulateur), rien n\'est enregistré sur le vrai site';
    bandeau.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483647;background:#b3261e;color:#fff;font:600 12px/1.4 system-ui,sans-serif;text-align:center;padding:4px 8px;pointer-events:none';
    document.body.appendChild(bandeau);
  };
  if (document.body) poserBandeau(); else document.addEventListener('DOMContentLoaded', poserBandeau);
}

// Marques diacritiques Unicode (U+0300 a U+036F), celles qui restent apres un
// normalize('NFD') sur une lettre accentuee (e.g. "e" + accent aigu separe).
const MARQUES_DIACRITIQUES = /[̀-ͯ]/g;

// Un pseudo eleve (ex. "renard-bleu") n'est pas un email valide pour Firebase
// Auth ; on le fait correspondre a une adresse fictive, jamais envoyee a
// personne. Meme regle utilisee cote script de creation des comptes
// (outils/creer-comptes). Le compte enseignant, lui, est cree avec une
// vraie adresse email (outils/creer-comptes --admin) : si l'identifiant
// saisi contient un "@", on l'utilise tel quel plutot que de le "pseudo-iser".
export function emailDepuisIdentifiant(identifiant) {
  const valeur = identifiant.trim();
  if (valeur.includes('@')) return valeur.toLowerCase();
  const slug = valeur.toLowerCase().normalize('NFD').replace(MARQUES_DIACRITIQUES, '');
  return `${slug}@cahiers-interactifs.local`;
}

// ---------- Session : anciennes sessions durables et expiration par inactivité (04/11/2026) ----------
// Une seule fois par navigateur : efface les anciennes sessions durables (IndexedDB « firebaseLocalStorageDb » et clés
// firebase:authUser:* de localStorage), devenues inutilisées mais qui laisseraient un jeton sur un poste partagé.
try {
  if (!window.localStorage.getItem('cahiers-session-onglet')) {
    for (const cle of Object.keys(window.localStorage)) if (cle.startsWith('firebase:authUser:')) window.localStorage.removeItem(cle);
    if (window.indexedDB) window.indexedDB.deleteDatabase('firebaseLocalStorageDb');
    window.localStorage.setItem('cahiers-session-onglet', '1');
  }
} catch (e) { /* stockage indisponible : sans conséquence */ }

// Inactivité : une heure sans action (clic, touche, défilement) sur le site, élèves comme enseignants. Vérifiée UNIQUEMENT à
// l'ouverture d'une page (et au retour d'une page mise en cache par le navigateur), jamais par un chronomètre sur une page
// affichée : un élève qui revient après trois heures sur une fiche restée ouverte peut donc encore valider, et sa
// tentative est enregistrée ; il est déconnecté à la page suivante.
export const DELAI_INACTIVITE_MS = 60 * 60 * 1000;
const CLE_ACTIVITE = 'cahiers-activite';
const CLE_EXPIREE = 'cahiers-session-expiree';
function lireActivite() { try { return Number(window.sessionStorage.getItem(CLE_ACTIVITE)) || 0; } catch (e) { return 0; } }
export function marquerActivite() { try { window.sessionStorage.setItem(CLE_ACTIVITE, String(Date.now())); } catch (e) { /* stockage indisponible */ } }

function annoncerSessionExpiree() {
  if (window.location.pathname.startsWith('/connexion/')) return;     // la page de connexion l'annonce elle-même
  const poser = () => {
    const b = document.createElement('div');
    b.setAttribute('role', 'status');
    b.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:2147483000;padding:10px 16px;text-align:center;background:#b3261e;color:#fff;'
      + 'font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
    b.innerHTML = 'Ta session a expiré (une heure sans activité). <a href="/connexion/" style="color:#fff;font-weight:600">Reconnecte-toi</a> pour que ton travail soit suivi.';
    document.body.appendChild(b);
  };
  if (document.body) poser(); else document.addEventListener('DOMContentLoaded', poser);
}

function verifierInactivite() {
  auth.authStateReady().then(() => {
    if (!auth.currentUser) return;
    const derniere = lireActivite();
    if (derniere && Date.now() - derniere > DELAI_INACTIVITE_MS) {
      try { window.sessionStorage.setItem(CLE_EXPIREE, '1'); } catch (e) { /* stockage indisponible */ }
      signOut(auth).then(annoncerSessionExpiree).catch(() => {});
    } else {
      marquerActivite();
    }
  });
}
verifierInactivite();
window.addEventListener('pageshow', (e) => { if (e.persisted) verifierInactivite(); });

// Chaque action de l'utilisateur renouvelle le délai (au plus une écriture toutes les 30 secondes).
let dernierMarquage = 0;
for (const evenement of ['pointerdown', 'keydown', 'touchstart', 'scroll']) {
  window.addEventListener(evenement, () => {
    const maintenant = Date.now();
    if (maintenant - dernierMarquage < 30000 || !auth.currentUser) return;
    dernierMarquage = maintenant;
    marquerActivite();
  }, { passive: true, capture: true });
}
