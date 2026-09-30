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

function afficherBloc(nbAFaire) {
  const bloc = document.createElement('div');
  bloc.className = 'devoir-bloc-enveloppe';
  bloc.innerHTML = `
    <div class="enveloppe">
      <a class="devoir-bloc" href="/mes-devoirs/">
        <span class="devoir-bloc-icone">${ICONE_CLOCHE}</span>
        <span class="devoir-bloc-texte">Devoirs</span>
        ${nbAFaire > 0 ? `<span class="devoir-bloc-badge">${nbAFaire}</span>` : ''}
      </a>
    </div>`;

  const header = document.querySelector('.site-entete');
  if (header) header.insertAdjacentElement('afterend', bloc);
  else document.body.prepend(bloc);
}

onAuthStateChanged(auth, async (utilisateur) => {
  if (!utilisateur) return;
  try {
    // Meme classement que /mes-devoirs/ (devoirs-eleve.js, 30/09/2026) : la
    // pastille compte tous les devoirs encore ouverts ("A faire", y compris
    // ceux deja rendus une fois avec des essais restants, et "Enregistres").
    const resultat = await chargerDevoirsEleve(utilisateur.uid);
    if (!resultat) return; // pas un profil eleve (ex. compte admin)
    if (resultat.nbDevoirs === 0) return; // jamais aucun devoir attribue

    afficherBloc(resultat.aFaire.length + resultat.enregistres.length);
  } catch (erreur) {
    console.warn('Devoirs : vérification impossible.', erreur);
  }
});
