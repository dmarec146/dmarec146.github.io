// Ajoute au menu du site les liens lies a la connexion, sans toucher au
// HTML des pages : icone de profil -> connexion si personne n'est connecte,
// sinon -> deconnexion (avec un lien Tableau de bord en plus si le compte
// est admin). Charge pour l'instant uniquement sur l'accueil (pas sur les
// 43 fiches, hors perimetre du pilote de suivi).

import { auth } from './firebase-config.js';
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// Icone "profil" classique (silhouette tete + epaules), reconnaissable sans
// texte. Pas de librairie d'icones chargee juste pour ca : un seul path SVG.
const ICONE_PROFIL = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

onAuthStateChanged(auth, async (utilisateur) => {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  // Retire ce que ce script a pu ajouter lors d'un etat precedent (evite
  // les doublons si l'etat de connexion change sans recharger la page).
  nav.querySelectorAll('[data-nav-auth]').forEach((el) => el.remove());

  if (!utilisateur) {
    const lien = document.createElement('a');
    lien.href = '/connexion/';
    lien.className = 'nav-icone-profil';
    lien.setAttribute('aria-label', 'Connexion');
    lien.title = 'Connexion';
    lien.innerHTML = ICONE_PROFIL;
    lien.dataset.navAuth = 'true';
    nav.appendChild(lien);
    return;
  }

  const resultatToken = await utilisateur.getIdTokenResult();
  if (resultatToken.claims.admin === true) {
    const lienTableau = document.createElement('a');
    lienTableau.href = '/tableau-de-bord/';
    lienTableau.textContent = 'Tableau de bord';
    lienTableau.dataset.navAuth = 'true';
    nav.appendChild(lienTableau);
  }

  const boutonDeconnexion = document.createElement('button');
  boutonDeconnexion.type = 'button';
  boutonDeconnexion.className = 'nav-icone-profil';
  boutonDeconnexion.setAttribute('aria-label', 'Se déconnecter');
  boutonDeconnexion.title = 'Se déconnecter';
  boutonDeconnexion.innerHTML = ICONE_PROFIL;
  boutonDeconnexion.dataset.navAuth = 'true';
  boutonDeconnexion.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = '/index.html';
  });
  nav.appendChild(boutonDeconnexion);
});
