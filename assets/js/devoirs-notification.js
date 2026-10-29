// Bloc "Devoirs", affiche juste apres le header pour un eleve connecte
// (pas pour l'enseignant ni un visiteur anonyme) qui a une classe et au
// moins un devoir deja attribue a celle-ci (actif ou non) -- lien
// permanent vers /mes-devoirs/, avec une pastille de notification donnant
// le nombre de devoirs a faire ou enregistres (voir devoirs-eleve.js).
// Remplace, le 19/09/2026, l'ancien bandeau pleine largeur qui
// listait chaque devoir ici meme -- desormais seulement sur /mes-devoirs/.
// Chargee sur les pages d'entree du site (accueil, sommaires cahiers/
// automatismes) plutot que les 44 fiches individuelles -- le but est
// d'avertir l'eleve des sa connexion, pas de le harceler sur chaque page.
//
// Silencieux comme le reste du suivi (assets/js/suivi.js) : une erreur
// reseau ou hors ligne ne doit jamais bloquer l'affichage normal du site.

import { auth } from './firebase-config.js';
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { chargerDevoirsEleve } from './devoirs-eleve.js';

// Cloche de notification, glyphe plein (currentColor) -- meme poids visuel
// que les autres icones du site (nav-auth.js), pas de librairie chargee
// juste pour ca.
const ICONE_CLOCHE = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>';

// Dernier etat connu des devoirs (29/10/2026) : sans lui, le bloc « Devoirs » et la carte de devoir de l'accueil n'apparaissaient qu'apres
// le chargement de Firebase et decalaient la page (clignotement, retour de David). On garde donc dans le navigateur le nombre de devoirs a traiter,
// le HTML du bloc et la liste minimale des devoirs de fiche : assets/js/pied-droits.js (script classique, immediat) affiche le bloc d'apres ce
// cache avant tout reseau, assets/js/vedette-accueil.js dessine ses cartes d'apres lui, puis ce script corrige s'il y a lieu (rien ne bouge si
// l'etat est le meme). Efface a la deconnexion et pour un compte qui n'est pas un eleve (nav-auth.js, memoriserEtat).
const CLE_CACHE = 'cahiers-devoirs-cache';
function ecrireCache(donnees) { try { window.localStorage.setItem(CLE_CACHE, JSON.stringify(donnees)); } catch (e) { /* stockage indisponible */ } }
function effacerCache() { try { window.localStorage.removeItem(CLE_CACHE); } catch (e) { /* stockage indisponible */ } }

function htmlBloc(nbAFaire) {
  return `
    <div class="enveloppe">
      <a class="devoir-bloc" href="/mes-devoirs/">
        <span class="devoir-bloc-icone">${ICONE_CLOCHE}</span>
        <span class="devoir-bloc-texte">Devoirs</span>
        ${nbAFaire > 0 ? `<span class="devoir-bloc-badge">${nbAFaire}</span>` : ''}
      </a>
    </div>`;
}

// Cree le bloc, ou met a jour celui deja pose d'apres le cache (sans toucher au DOM s'il est identique)
function afficherBloc(nbAFaire) {
  const html = htmlBloc(nbAFaire);
  let bloc = document.querySelector('.devoir-bloc-enveloppe');
  if (!bloc) {
    bloc = document.createElement('div');
    bloc.className = 'devoir-bloc-enveloppe';
    bloc.innerHTML = html;
    const header = document.querySelector('.site-entete');
    if (header) header.insertAdjacentElement('afterend', bloc);
    else document.body.prepend(bloc);
  } else if (bloc.innerHTML !== html) {
    bloc.innerHTML = html;
  }
  return html;
}
function retirerBloc() {
  const bloc = document.querySelector('.devoir-bloc-enveloppe');
  if (bloc) bloc.remove();
}
// Publie le resultat pour les cartes de l'accueil (assets/js/vedette-accueil.js, 29/10/2026) : pas de seconde lecture Firestore
function publier(resultat) {
  window.devoirsEleve = resultat;
  document.dispatchEvent(new CustomEvent('devoirs-eleve-prets', { detail: resultat }));
}

onAuthStateChanged(auth, async (utilisateur) => {
  if (!utilisateur) { retirerBloc(); effacerCache(); publier(null); return; }
  try {
    // Meme classement que /mes-devoirs/ (devoirs-eleve.js, 30/09/2026) : la
    // pastille compte tous les devoirs encore ouverts ("A faire", y compris
    // ceux deja rendus une fois avec des essais restants, et "Enregistres").
    const resultat = await chargerDevoirsEleve(utilisateur.uid);
    if (!resultat) { retirerBloc(); effacerCache(); publier(null); return; } // pas un profil eleve (ex. compte admin)
    publier(resultat);

    // Le bouton n'a d'utilite que tant qu'il reste au moins un devoir a faire ou enregistre (27/10/2026, demande de
    // David) : quand tous sont « faits » (tentatives epuisees ou echeance passee, meme si l'echeance n'est pas
    // atteinte), il disparait ; l'icone « Mes devoirs » en haut a droite (nav-auth.js) donne toujours acces aux notes.
    const ouverts = [].concat(resultat.aFaire, resultat.enregistres);
    const aTraiter = ouverts.length;
    if (resultat.nbDevoirs === 0 || aTraiter === 0) { retirerBloc(); ecrireCache({ n: 0, devoirs: [], t: Date.now() }); return; }

    const html = afficherBloc(aTraiter);
    const devoirs = ouverts
      .filter((d) => d.type === 'fiche' && typeof d.ficheId === 'string')
      .map((d) => ({ id: d.id, type: 'fiche', ficheId: d.ficheId, titre: d.titre || '', echeanceMillis: d.echeanceMillis }));
    ecrireCache({ n: aTraiter, html, devoirs, t: Date.now() });
  } catch (erreur) {
    console.warn('Devoirs : vérification impossible.', erreur);
  }
});
