// Ajoute un lien "Tableau de bord" dans le menu du site, visible seulement
// pour un enseignant connecte (droit "admin"). N'est charge que sur les
// pages qui en ont besoin (pour l'instant : l'accueil) -- pas sur les 43
// fiches, pour ne pas les toucher en dehors du pilote de suivi.

import { auth } from './firebase-config.js';
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

onAuthStateChanged(auth, async (utilisateur) => {
  if (!utilisateur) return;
  const resultatToken = await utilisateur.getIdTokenResult();
  if (resultatToken.claims.admin !== true) return;

  const nav = document.querySelector('.site-nav');
  if (!nav || nav.querySelector('[data-lien-admin]')) return;

  const lien = document.createElement('a');
  lien.href = '/tableau-de-bord/';
  lien.textContent = 'Tableau de bord';
  lien.dataset.lienAdmin = 'true';
  nav.appendChild(lien);
});
