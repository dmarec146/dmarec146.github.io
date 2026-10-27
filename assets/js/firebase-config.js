// Initialisation Firebase, partagée par toutes les pages qui en ont besoin
// (connexion, câblage du suivi dans les fiches, tableau de bord).
// SDK modulaire chargé depuis le CDN Google — pas de build, cohérent avec
// le reste du site (fichiers HTML/JS servis tels quels par GitHub Pages).

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
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
export const auth = getAuth(app);
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
