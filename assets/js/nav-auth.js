// Ajoute au menu du site les liens lies a la connexion, sans toucher au
// HTML des pages : icone de profil -> connexion si personne n'est connecte,
// sinon -> deconnexion (avec une icone Tableau de bord en plus si le compte
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
// Les DEUX elements (icone profil ET icone tableau de bord) sont crees tout
// de suite (desactives/masques), avant meme de savoir si quelqu'un est
// connecte : onAuthStateChanged est asynchrone (verifie la session
// enregistree), et savoir si le compte est admin demande un second aller-
// retour asynchrone (getIdTokenResult) apres coup -- les creer seulement a
// la reponse provoquait un decalage visible (ils apparaissaient après coup,
// apres les autres boutons de la barre, en decalant tout). Ainsi l'espace
// est reserve des le depart ; seul le COMPORTEMENT du bouton profil (lien
// connexion / deconnexion) et la VISIBILITE de l'icone tableau de bord se
// mettent a jour une fois l'etat de connexion (et le droit admin) connus --
// plus jamais de noeud insere tardivement dans le DOM.

import { auth } from './firebase-config.js';
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// Icone "profil" classique (silhouette tete + epaules), reconnaissable sans
// texte. Pas de librairie d'icones chargee juste pour ca : un seul path SVG.
const ICONE_PROFIL = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

// Icone "tableau de bord" (grille a 4 cases inegales), meme gabarit/poids
// visuel (glyphe plein, currentColor) que ICONE_PROFIL ci-dessus, pour
// remplacer l'ancien lien texte "Tableau de bord" -- reconnaissable sans texte.
const ICONE_TABLEAU_DE_BORD = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect fill="currentColor" x="3" y="3" width="8" height="8" rx="1.5"/><rect fill="currentColor" x="13" y="3" width="8" height="5" rx="1.5"/><rect fill="currentColor" x="13" y="10" width="8" height="11" rx="1.5"/><rect fill="currentColor" x="3" y="13" width="8" height="8" rx="1.5"/></svg>';

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
  // Style de l'etat « connecte » du bouton profil, injecte ici pour couvrir les deux cibles (.site-nav et
  // .barre-navigation des fiches, qui n'ont pas la meme feuille de style) : fond plein de la couleur d'accent
  // du site, icone blanche, point vert avec liseré blanc en bas a droite. Hors connexion, l'icone garde son
  // contour habituel. Les !important l'emportent sur le survol et sur les styles propres a chaque fiche.
  const styleConnecte = document.createElement('style');
  styleConnecte.textContent =
    'button[data-nav-auth][data-connecte]{position:relative;background:var(--accent,var(--bleu,#4B46C7))!important;' +
    'color:#fff!important;border-color:var(--accent,var(--bleu,#4B46C7))!important}' +
    'button[data-nav-auth][data-connecte]:hover{filter:brightness(1.1)}' +
    'button[data-nav-auth][data-connecte]::after{content:"";position:absolute;right:4px;bottom:4px;width:10px;height:10px;' +
    'border-radius:50%;background:#2fbf71;border:2px solid #fff;box-sizing:border-box}';
  document.head.appendChild(styleConnecte);

  // Icone Tableau de bord : creee et inseree tout de suite (comme le bouton
  // profil ci-dessous) -- reste admin uniquement, n'apparait donc jamais
  // pour la tres grande majorite des visiteurs. La rendre visible plus tard
  // (une fois le droit admin confirme) ne fait que modifier un noeud DEJA
  // present dans le DOM, plutot que d'en inserer un nouveau apres coup
  // (voir commentaire en tete de fichier).
  //
  // Masquage initial via VISIBILITY (pas display, pas l'attribut "hidden")
  // : visibility:hidden reserve quand meme sa place dans la ligne, alors
  // que display:none (essaye d'abord, 19/09/2026) retire l'element du flux
  // -- le faire apparaitre ensuite (une fois le droit admin confirme, apres
  // l'aller-retour async getIdTokenResult) redistribue alors les autres
  // boutons de la barre, un decalage encore visible sur les pages ou la
  // barre est deja proche de son point de repli en plusieurs lignes. Avec
  // visibility, l'espace est deja compte des le premier rendu : plus aucun
  // decalage possible en devenant visible.
  //
  // CORRECTIF (19/09/2026, deuxieme fois, remarque par David en cliquant
  // sur "Connexion") : la version precedente repassait cette icone en
  // display:none des que l'etat NON-admin etait confirme (visiteur anonyme
  // OU eleve connecte -- la tres grande majorite des cas), en pariant que
  // "personne ne regarde cette icone precise". Faux : ca retire quand meme
  // son espace reserve de la ligne, ce qui DEPLACE le bouton profil juste
  // apres -- justement celui sur lequel on clique pour se connecter. Le
  // masquage reste desormais permanent via visibility (jamais de retour a
  // display:none) pour un non-admin : l'espace reserve au chargement ne
  // bouge plus jamais, au prix d'un petit vide invisible et permanent dans
  // la barre pour la tres grande majorite des visiteurs.
  const lienTableau = document.createElement('a');
  // Pointe directement sur devoirs.html (29/09/2026) : l'ancien tableau de
  // bord "Fiches" (suivi de l'entrainement hors devoir) a ete retire sur
  // demande de David ("je ne ferai un suivi enseignant que sur les devoirs
  // donnes") -- devoirs.html est desormais le seul tableau de bord
  // enseignant.
  lienTableau.href = '/tableau-de-bord/devoirs.html';
  lienTableau.title = 'Tableau de bord';
  lienTableau.setAttribute('aria-label', 'Tableau de bord');
  lienTableau.innerHTML = ICONE_TABLEAU_DE_BORD;
  lienTableau.dataset.navAuth = 'true';
  if (nav) lienTableau.className = 'nav-icone-profil';
  else styliserCommeIconeCompacte(lienTableau);
  lienTableau.style.visibility = 'hidden';
  cible.appendChild(lienTableau);

  const bouton = document.createElement('button');
  bouton.type = 'button';
  bouton.disabled = true;
  bouton.dataset.navAuth = 'true';
  bouton.innerHTML = ICONE_PROFIL;
  if (nav) bouton.className = 'nav-icone-profil';
  else styliserCommeIconeCompacte(bouton);
  cible.appendChild(bouton);

  onAuthStateChanged(auth, async (utilisateur) => {
    bouton.disabled = false;
    bouton.onclick = null;

    if (!utilisateur) {
      delete bouton.dataset.connecte;
      lienTableau.style.visibility = 'hidden'; // l'icone des devoirs n'existe que connecte
      bouton.title = 'Connexion';
      bouton.setAttribute('aria-label', 'Connexion');
      bouton.onclick = () => { window.location.href = '/connexion/'; };
      return;
    }

    const resultatToken = await utilisateur.getIdTokenResult();
    // Une seule icone « grille » pour tout compte connecte, deux destinations (27/10/2026) :
    // - administrateur ou enseignant -> tableau de bord (chacun ne voit que ses eleves) ;
    // - tout autre compte connecte, donc un eleve -> sa page « Mes devoirs », qui reste ainsi
    //   joignable meme quand plus aucun devoir n'est en cours (le bloc « Devoirs » sous l'en-tete,
    //   lui, n'apparait que s'il reste au moins un devoir : voir devoirs-notification.js).
    const estEnseignant = resultatToken.claims.admin === true || resultatToken.claims.enseignant === true;
    // Destination posee a chaque changement d'etat (pas seulement pour un eleve) : un changement de compte sans
    // rechargement de la page ne doit pas laisser la destination du compte precedent.
    const destination = estEnseignant
      ? { href: '/tableau-de-bord/devoirs.html', titre: 'Tableau de bord' }
      : { href: '/mes-devoirs/', titre: 'Mes devoirs' };
    lienTableau.href = destination.href;
    lienTableau.title = destination.titre;
    lienTableau.setAttribute('aria-label', destination.titre);
    // 'inline-flex' explicite (pas '' pour retomber sur la regle CSS) :
    // pour la variante barre-navigation, le display vient d'un style EN
    // LIGNE pose par styliserCommeIconeCompacte, pas d'une classe -- vider
    // style.display retomberait sur le display par defaut d'un <a>
    // (inline), sans les proprietes flex de centrage.
    lienTableau.style.display = 'inline-flex';
    lienTableau.style.visibility = 'visible';

    // Etat « connecte » visible sans survol (27/10/2026) : le bouton profil se remplit et recoit un point vert.
    bouton.dataset.connecte = 'true';

    const identifiant = identifiantAffichable(utilisateur);
    bouton.title = identifiant ? `Se déconnecter (${identifiant})` : 'Se déconnecter';
    bouton.setAttribute('aria-label', bouton.title);
    bouton.onclick = async () => {
      await signOut(auth);
      window.location.href = '/index.html';
    };
  });
}
