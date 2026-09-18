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
// Le style visuel (bouton bordure/coin arrondi, pas un simple cercle) est
// harmonise entre les deux cibles : nav-icone-profil (site.css) reprend
// exactement les memes teintes que .nav-btn des fiches (--accent = meme
// bleu que --bleu des fiches).
//
// Le bouton est cree tout de suite (desactive), avant meme de savoir si
// quelqu'un est connecte : onAuthStateChanged est asynchrone (verifie la
// session enregistree), le creer seulement a la reponse provoquait un
// decalage visible (le bouton apparaissait après coup, apres les autres
// boutons de la barre). Ainsi l'espace est reserve des le depart, seul son
// comportement (lien connexion / deconnexion) se met a jour une fois l'etat
// de connexion connu.

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

// Le pseudo est stocke cote Firestore, pas dans le compte Firebase Auth
// lui-meme (seul un email synthetique pseudo@cahiers-interactifs.local y
// existe pour les eleves) : on affiche la partie utile de cet email plutot
// que de faire une lecture Firestore supplementaire juste pour une infobulle.
function identifiantAffichable(utilisateur) {
  const email = utilisateur.email || '';
  return email.endsWith('@cahiers-interactifs.local') ? email.split('@')[0] : email;
}

const nav = document.querySelector('.site-nav');
const barreNav = nav ? null : document.querySelector('.barre-navigation');
const cible = nav || barreNav;

if (cible) {
  const bouton = document.createElement('button');
  bouton.type = 'button';
  bouton.disabled = true;
  bouton.dataset.navAuth = 'true';
  bouton.innerHTML = ICONE_PROFIL;
  if (nav) bouton.className = 'nav-icone-profil';
  else styliserCommeIconeCompacte(bouton);
  cible.appendChild(bouton);

  let lienTableau = null;

  onAuthStateChanged(auth, async (utilisateur) => {
    bouton.disabled = false;
    bouton.onclick = null;
    if (lienTableau) { lienTableau.remove(); lienTableau = null; }

    if (!utilisateur) {
      bouton.title = 'Connexion';
      bouton.setAttribute('aria-label', 'Connexion');
      bouton.onclick = () => { window.location.href = '/connexion/'; };
      return;
    }

    const resultatToken = await utilisateur.getIdTokenResult();
    if (resultatToken.claims.admin === true) {
      lienTableau = document.createElement('a');
      lienTableau.href = '/tableau-de-bord/';
      lienTableau.textContent = 'Tableau de bord';
      lienTableau.dataset.navAuth = 'true';
      if (barreNav) lienTableau.classList.add('nav-btn');
      cible.insertBefore(lienTableau, bouton);
    }

    const identifiant = identifiantAffichable(utilisateur);
    bouton.title = identifiant ? `Se déconnecter (${identifiant})` : 'Se déconnecter';
    bouton.setAttribute('aria-label', bouton.title);
    bouton.onclick = async () => {
      await signOut(auth);
      window.location.href = '/index.html';
    };
  });
}
