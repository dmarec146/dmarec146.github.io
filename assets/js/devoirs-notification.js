// Bloc "Devoirs", affiche juste apres le header pour un eleve connecte
// (pas pour l'enseignant ni un visiteur anonyme) qui a une classe et au
// moins un devoir deja attribue a celle-ci (actif ou non) -- lien
// permanent vers /mes-devoirs/, avec une pastille de notification donnant
// le nombre de devoirs encore A FAIRE (echeance active ET essais pas
// epuises). Remplace, le 19/09/2026, l'ancien bandeau pleine largeur qui
// listait chaque devoir ici meme -- desormais seulement sur /mes-devoirs/.
// Chargee sur les pages d'entree du site (accueil, sommaires cahiers/
// automatismes) plutot que les 44 fiches individuelles -- le but est
// d'avertir l'eleve des sa connexion, pas de le harceler sur chaque page.
//
// Silencieux comme le reste du suivi (assets/js/suivi.js) : une erreur
// reseau ou hors ligne ne doit jamais bloquer l'affichage normal du site.

import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

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

// Meme sentinelle que suivi.js/devoirs.js : un eleve "hors classe" (aucun
// champ classe sur son document) doit quand meme voir apparaitre ce bloc si
// un devoir "Hors classe" le cible -- avant le 24/09/2026, `classe` restait
// `null` pour lui et le bloc de devoirs n'apparaissait jamais, meme si un
// devoir existait.
const CLASSE_HORS_CLASSE = 'hors-classe';

onAuthStateChanged(auth, async (utilisateur) => {
  if (!utilisateur) return;
  try {
    const profil = await getDoc(doc(db, 'eleves', utilisateur.uid));
    if (!profil.exists()) return; // pas un profil eleve (ex. compte admin)
    const classe = profil.data().classe || CLASSE_HORS_CLASSE;

    const instantaneDevoirs = await getDocs(query(collection(db, 'devoirs'), where('classe', '==', classe)));
    // Ciblage individuel d'un devoir "Hors classe" (24/09/2026, voir
    // devoirs.js) : un devoir dont `eleves` existe ne concerne que les uid
    // qu'il liste, pas tout le groupe.
    const devoirs = instantaneDevoirs.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((d) => !Array.isArray(d.eleves) || d.eleves.includes(utilisateur.uid));
    if (devoirs.length === 0) return; // jamais aucun devoir attribue a cette classe

    const maintenant = Date.now();
    // "A faire" = echeance pas encore passee ET essais pas epuises -- un
    // devoir dont les tentatives sont epuisees bascule "fait" meme si
    // l'echeance court encore (decide avec David le 19/09/2026) : rien
    // d'actionnable ne justifie plus de le compter dans la notification.
    const nbAFaire = (await Promise.all(devoirs.map(async (dv) => {
      const echeanceMillis = dv.echeance?.toMillis ? dv.echeance.toMillis() : 0;
      if (echeanceMillis <= maintenant) return false;
      const instantaneTentatives = await getDocs(query(
        collection(db, 'eleves', utilisateur.uid, 'devoirsTentatives'),
        where('devoirId', '==', dv.id)
      ));
      return instantaneTentatives.size < dv.nbEssaisMax;
    }))).filter(Boolean).length;

    afficherBloc(nbAFaire);
  } catch (erreur) {
    console.warn('Devoirs : vérification impossible.', erreur);
  }
});
