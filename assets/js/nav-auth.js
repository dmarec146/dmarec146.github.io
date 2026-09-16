// Ajoute au menu du site les liens lies a la connexion, sans toucher au
// HTML des pages : "Connexion" si personne n'est connecte, sinon
// "Se deconnecter" (et "Tableau de bord" en plus si le compte est admin).
// Charge pour l'instant uniquement sur l'accueil (pas sur les 43 fiches,
// hors perimetre du pilote de suivi).

import { auth } from './firebase-config.js';
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

onAuthStateChanged(auth, async (utilisateur) => {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  // Retire ce que ce script a pu ajouter lors d'un etat precedent (evite
  // les doublons si l'etat de connexion change sans recharger la page).
  nav.querySelectorAll('[data-nav-auth]').forEach((el) => el.remove());

  if (!utilisateur) {
    const lien = document.createElement('a');
    lien.href = '/connexion/';
    lien.textContent = 'Connexion';
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
  boutonDeconnexion.textContent = 'Se déconnecter';
  boutonDeconnexion.dataset.navAuth = 'true';
  boutonDeconnexion.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = '/connexion/';
  });
  nav.appendChild(boutonDeconnexion);
});
