// Initialisation Firebase, partagée par toutes les pages qui en ont besoin
// (connexion, câblage du suivi dans les fiches, tableau de bord).
// SDK modulaire chargé depuis le CDN Google — pas de build, cohérent avec
// le reste du site (fichiers HTML/JS servis tels quels par GitHub Pages).

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Marques diacritiques Unicode (U+0300 a U+036F), celles qui restent apres un
// normalize('NFD') sur une lettre accentuee (e.g. "e" + accent aigu separe).
const MARQUES_DIACRITIQUES = /[̀-ͯ]/g;

// Un pseudo (ex. "renard-bleu") n'est pas un email valide pour Firebase Auth ;
// on le fait correspondre a une adresse fictive, jamais envoyee a personne.
// Meme regle utilisee cote script de creation des comptes (outils/creer-comptes).
export function emailDepuisPseudo(pseudo) {
  const slug = pseudo.trim().toLowerCase().normalize('NFD').replace(MARQUES_DIACRITIQUES, '');
  return `${slug}@cahiers-interactifs.local`;
}
