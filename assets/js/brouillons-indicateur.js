// Petite pastille "brouillon en attente" sur les liens vers une fiche de
// calcul (nouveau modele, voir assets/js/suivi.js) que l'eleve connecte a
// enregistree sans l'avoir validee -- sommaire d'un cahier (lien direct
// vers la fiche) et liste de tous les cahiers (lien vers le sommaire du
// cahier qui la contient). Rien pour un visiteur anonyme (pas de suivi) ni
// pour un eleve sans brouillon en cours.

import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Disquette, symbole universel de sauvegarde -- distinct de l'icone de
// profil deja utilisee ailleurs (nav-auth.js), pour ne pas les confondre.
const ICONE_BROUILLON = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM7 8V4h9v4H7z"/></svg>';

// "/cahiers/seconde/cahier-1/fiche-01.html" -> "/cahiers/seconde/cahier-1/"
function dossierDe(chemin) {
  return chemin.slice(0, chemin.lastIndexOf('/') + 1);
}

onAuthStateChanged(auth, async (utilisateur) => {
  if (!utilisateur) return;

  let brouillons;
  try {
    const instantane = await getDocs(collection(db, 'eleves', utilisateur.uid, 'brouillons'));
    brouillons = instantane.docs.map((d) => d.data()).filter((b) => b.ficheId);
  } catch (erreur) {
    return; // silencieux, comme le reste du suivi (hors ligne, etc.)
  }
  if (brouillons.length === 0) return;

  const fichesEnCours = new Set(brouillons.map((b) => b.ficheId));
  const dossiersEnCours = new Set(brouillons.map((b) => dossierDe(b.ficheId)));

  document.querySelectorAll('a[href]').forEach((lien) => {
    let chemin;
    try {
      chemin = new URL(lien.href, window.location.origin).pathname;
    } catch (erreur) {
      return;
    }

    const versUneFiche = /\/fiche-\d+\.html$/.test(chemin);
    const versUnSommaireDeCahier = /\/cahier-\d+\/(index\.html)?$/.test(chemin);
    const dossierCahier = chemin.replace(/index\.html$/, '');
    const correspond = versUneFiche
      ? fichesEnCours.has(chemin)
      : versUnSommaireDeCahier && dossiersEnCours.has(dossierCahier);

    if (!correspond || lien.querySelector('[data-brouillon-icone]')) return;

    const pastille = document.createElement('span');
    pastille.dataset.brouillonIcone = 'true';
    pastille.title = versUneFiche ? 'Fiche en cours, non terminée' : 'Au moins une fiche en cours dans ce cahier';
    pastille.setAttribute('aria-label', pastille.title);
    pastille.style.display = 'inline-flex';
    pastille.style.marginLeft = '6px';
    pastille.style.color = '#B8860B';
    pastille.innerHTML = ICONE_BROUILLON;
    lien.appendChild(pastille);
  });
});
