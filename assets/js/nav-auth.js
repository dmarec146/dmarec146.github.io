// Ajoute au menu du site les liens lies a la connexion, sans toucher au
// HTML des pages : icone de profil -> connexion si personne n'est connecte,
// sinon -> deconnexion (avec un lien Tableau de bord en plus si le compte
// est admin).
//
// Deux cibles possibles selon la page :
// - `.site-nav` (accueil, sommaires de cahiers, automatismes, tableau de
//   bord...) : styles dedies (nav-icone-profil), voir assets/css/style.css.
// - `.barre-navigation` (les 44 fiches de calcul, qui n'ont pas le header
//   standard du site -- CSS propre a chaque fiche, pas de style.css charge)
//   : pas de classe partagee possible, donc les elements ajoutes reprennent
//   directement `.nav-btn` (deja definie dans le <style> de chaque fiche,
//   utilisee par "Sommaire"/"Fiche suivante"/etc.) pour rester coherents
//   sans dupliquer de CSS. `.barre-navigation` existe deux fois par fiche
//   (haut et bas) ; querySelector prend la premiere (en haut), par choix.

import { auth } from './firebase-config.js';
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// Icone "profil" classique (silhouette tete + epaules), reconnaissable sans
// texte. Pas de librairie d'icones chargee juste pour ca : un seul path SVG.
const ICONE_PROFIL = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

// Sur .barre-navigation (pas de classe nav-icone-profil disponible), imite
// une icone compacte en reutilisant .nav-btn (bordure/couleurs de la page)
// mais en forcant une largeur fixe et un contenu centre plutot que le style
// texte pleine largeur des autres boutons de cette barre.
function styliserCommeIconeCompacte(el) {
  el.classList.add('nav-btn');
  el.style.flex = '0 0 auto';
  el.style.display = 'inline-flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.width = '40px';
}

onAuthStateChanged(auth, async (utilisateur) => {
  const nav = document.querySelector('.site-nav');
  const barreNav = nav ? null : document.querySelector('.barre-navigation');
  const cible = nav || barreNav;
  if (!cible) return;

  // Retire ce que ce script a pu ajouter lors d'un etat precedent (evite
  // les doublons si l'etat de connexion change sans recharger la page).
  cible.querySelectorAll('[data-nav-auth]').forEach((el) => el.remove());

  if (!utilisateur) {
    const lien = document.createElement('a');
    lien.href = '/connexion/';
    lien.setAttribute('aria-label', 'Connexion');
    lien.title = 'Connexion';
    lien.innerHTML = ICONE_PROFIL;
    lien.dataset.navAuth = 'true';
    if (nav) lien.className = 'nav-icone-profil';
    else styliserCommeIconeCompacte(lien);
    cible.appendChild(lien);
    return;
  }

  const resultatToken = await utilisateur.getIdTokenResult();
  if (resultatToken.claims.admin === true) {
    const lienTableau = document.createElement('a');
    lienTableau.href = '/tableau-de-bord/';
    lienTableau.textContent = 'Tableau de bord';
    lienTableau.dataset.navAuth = 'true';
    if (barreNav) lienTableau.classList.add('nav-btn');
    cible.appendChild(lienTableau);
  }

  const boutonDeconnexion = document.createElement('button');
  boutonDeconnexion.type = 'button';
  boutonDeconnexion.setAttribute('aria-label', 'Se déconnecter');
  boutonDeconnexion.title = 'Se déconnecter';
  boutonDeconnexion.innerHTML = ICONE_PROFIL;
  boutonDeconnexion.dataset.navAuth = 'true';
  if (nav) boutonDeconnexion.className = 'nav-icone-profil';
  else styliserCommeIconeCompacte(boutonDeconnexion);
  boutonDeconnexion.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = '/index.html';
  });
  cible.appendChild(boutonDeconnexion);
});
