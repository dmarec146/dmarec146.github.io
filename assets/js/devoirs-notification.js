// Bandeau "devoir a faire", affiche juste apres le header pour un eleve
// connecte (pas pour l'enseignant ni un visiteur anonyme) qui a au moins un
// devoir attribue a sa classe dont l'echeance n'est pas encore passee.
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
const ICONE_CLOCHE = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>';

function formaterEcheance(millis) {
  return new Date(millis).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

// Pour un devoir de type fiche, lien direct vers la fiche (ficheId est deja
// un chemin absolu depuis la racine, voir FICHE_ID = window.location.pathname
// dans chaque fiche). Pour un sujet blanc d'automatismes, une seule page
// existe quel que soit le niveau/mode/duree choisis a l'attribution --
// l'eleve doit les selectionner lui-meme en y arrivant (precise dans le texte
// du bandeau, voir afficherBandeau ci-dessous).
function lienPour(devoir) {
  return devoir.type === 'fiche' ? devoir.ficheId : '/automatismes/premiere/sujet-blanc.html';
}

// Trois etats, sur le nombre d'essais reellement utilises (pas juste "au
// moins une tentative") : aucun essai -> pas encore fait (rouge) ; au moins
// un essai mais en dessous du max -> "X/Y tentatives" (vert, il en reste) ;
// max atteint -> tentatives epuisees (gris neutre, plus alarmant que "encore
// possibles" -- corrige le 19/09/2026, c'etait faux des que le max est
// atteint puisque la limite est maintenant reellement bloquante cote fiche).
function statutDevoir(d) {
  if (d.essaisUtilises === 0) {
    return { texte: 'Pas encore fait', classe: 'devoir-bandeau-statut-attente' };
  }
  if (d.essaisUtilises >= d.nbEssaisMax) {
    return { texte: `Tentatives épuisées (${d.essaisUtilises}/${d.nbEssaisMax}) — meilleure note retenue`, classe: 'devoir-bandeau-statut-epuise' };
  }
  return { texte: `${d.essaisUtilises}/${d.nbEssaisMax} tentatives`, classe: 'devoir-bandeau-statut-rendu' };
}

function afficherBandeau(devoirs) {
  const bandeau = document.createElement('div');
  bandeau.className = 'devoir-bandeau';

  const items = devoirs.map((d) => {
    const { texte, classe } = statutDevoir(d);
    return `<li class="devoir-bandeau-item">
      <a class="devoir-bandeau-lien" href="${lienPour(d)}">${d.titre || d.ficheId}</a>
      — à rendre avant le ${formaterEcheance(d.echeance.toMillis())} — <span class="${classe}">${texte}</span>
    </li>`;
  }).join('');

  bandeau.innerHTML = `
    <div class="enveloppe devoir-bandeau-interieur">
      <span class="devoir-bandeau-icone">${ICONE_CLOCHE}</span>
      <div>
        <p class="devoir-bandeau-titre">${devoirs.length > 1 ? `Tu as ${devoirs.length} devoirs à faire` : 'Tu as un devoir à faire'}</p>
        <ul class="devoir-bandeau-liste">${items}</ul>
      </div>
    </div>`;

  const header = document.querySelector('.site-entete');
  if (header) header.insertAdjacentElement('afterend', bandeau);
  else document.body.prepend(bandeau);
}

onAuthStateChanged(auth, async (utilisateur) => {
  if (!utilisateur) return;
  try {
    const profil = await getDoc(doc(db, 'eleves', utilisateur.uid));
    const classe = profil.exists() ? profil.data().classe : null;
    if (!classe) return;

    const instantaneDevoirs = await getDocs(query(collection(db, 'devoirs'), where('classe', '==', classe)));
    const maintenant = Date.now();
    const actifs = instantaneDevoirs.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((dv) => dv.echeance?.toMillis && dv.echeance.toMillis() > maintenant);
    if (actifs.length === 0) return;

    // Nombre d'essais reellement utilises (pas juste un booleen "deja fait") :
    // affiche "X/Y tentatives" pour que l'eleve sache concretement ou il en
    // est, cf. statutDevoir ci-dessus.
    const avecStatut = await Promise.all(actifs.map(async (dv) => {
      const instantaneTentatives = await getDocs(query(
        collection(db, 'eleves', utilisateur.uid, 'devoirsTentatives'),
        where('devoirId', '==', dv.id)
      ));
      return { ...dv, essaisUtilises: instantaneTentatives.size };
    }));

    afficherBandeau(avecStatut);
  } catch (erreur) {
    console.warn('Devoirs : vérification impossible.', erreur);
  }
});
