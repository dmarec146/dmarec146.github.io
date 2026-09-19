// Tableau de bord eleve : /mes-devoirs/ (19/09/2026). Deux listes -- "A
// faire" (echeance active ET essais pas epuises, triee par echeance la
// plus proche) et "Faits" (le reste : echeance passee OU essais epuises,
// triee par derniere activite la plus recente) -- sur le meme principe que
// devoirs-notification.js (bloc + pastille sur les pages d'entree), mais
// en detail complet ici plutot qu'un simple compteur.
//
// Page reservee a un compte eleve connecte : redirige vers /connexion/
// sinon, meme garde que tableau-de-bord.js pour l'enseignant.

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

const zoneChargement = document.getElementById('md-chargement');
const zoneErreur = document.getElementById('md-erreur');
const zoneContenu = document.getElementById('md-contenu');
const listeAFaire = document.getElementById('md-a-faire-liste');
const videAFaire = document.getElementById('md-a-faire-vide');
const nbAFaire = document.getElementById('md-a-faire-nb');
const listeFaits = document.getElementById('md-faits-liste');
const videFaits = document.getElementById('md-faits-vide');
const nbFaits = document.getElementById('md-faits-nb');

function echapper(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

function formaterEcheance(millis) {
  return new Date(millis).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

// Meme principe que dans devoirs-notification.js : une fiche pointe
// directement dessus (ficheId, chemin absolu), un sujet blanc d'automatismes
// n'a qu'une seule page qui se verrouille elle-meme sur le devoir en cours.
function lienPour(devoir) {
  return devoir.type === 'fiche' ? devoir.ficheId : '/automatismes/premiere/sujet-blanc.html';
}

function titreDevoir(devoir) {
  return devoir.titre || devoir.ficheId || 'Devoir';
}

function rendreAFaire(liste) {
  listeAFaire.innerHTML = '';
  videAFaire.hidden = liste.length > 0;
  nbAFaire.textContent = liste.length ? `(${liste.length})` : '';
  for (const d of liste) {
    const restantes = d.nbEssaisMax - d.essaisUtilises;
    const li = document.createElement('li');
    li.innerHTML = `<a class="md-item md-item-lien" href="${lienPour(d)}">
      <span class="md-item-titre">${echapper(titreDevoir(d))}</span>
      <span class="md-item-meta">À rendre avant le ${formaterEcheance(d.echeanceMillis)} — ${restantes} tentative${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''}</span>
    </a>`;
    listeAFaire.appendChild(li);
  }
}

function rendreFaits(liste) {
  listeFaits.innerHTML = '';
  videFaits.hidden = liste.length > 0;
  nbFaits.textContent = liste.length ? `(${liste.length})` : '';
  for (const d of liste) {
    const noteTxt = d.meilleure
      ? `${Math.round(d.meilleure.score * 10) / 10} / ${d.meilleure.totalExercices}`
      : 'Non rendu';
    const li = document.createElement('li');
    li.innerHTML = `<div class="md-item md-item-fait">
      <span class="md-item-titre">${echapper(titreDevoir(d))}</span>
      <span class="md-item-meta">${noteTxt} — ${d.nbEssaisAvantEcheance} tentative${d.nbEssaisAvantEcheance > 1 ? 's' : ''}</span>
    </div>`;
    listeFaits.appendChild(li);
  }
}

onAuthStateChanged(auth, async (utilisateur) => {
  if (!utilisateur) {
    window.location.replace('../connexion/index.html');
    return;
  }
  try {
    const profil = await getDoc(doc(db, 'eleves', utilisateur.uid));
    const classe = profil.exists() ? profil.data().classe : null;
    if (!classe) {
      zoneChargement.hidden = true;
      zoneErreur.textContent = "Ce compte n'est pas associé à une classe élève.";
      zoneErreur.hidden = false;
      return;
    }

    const instantaneDevoirs = await getDocs(query(collection(db, 'devoirs'), where('classe', '==', classe)));
    const devoirs = instantaneDevoirs.docs.map((d) => ({ id: d.id, ...d.data() }));
    const maintenant = Date.now();

    const avecStatut = await Promise.all(devoirs.map(async (dv) => {
      const instantaneTentatives = await getDocs(query(
        collection(db, 'eleves', utilisateur.uid, 'devoirsTentatives'),
        where('devoirId', '==', dv.id)
      ));
      const tentatives = instantaneTentatives.docs.map((t) => t.data());
      const echeanceMillis = dv.echeance?.toMillis ? dv.echeance.toMillis() : 0;
      const actif = echeanceMillis > maintenant;
      const essaisUtilises = tentatives.length;
      const epuise = essaisUtilises >= dv.nbEssaisMax;

      // Meilleure tentative AVANT l'echeance (meme regle que la vue
      // resultats de l'enseignant, devoirs.js) : une tentative apres
      // l'echeance est un entrainement libre, jamais une note.
      const avantEcheance = tentatives
        .map((t) => ({ ...t, millis: t.horodatage?.toMillis ? t.horodatage.toMillis() : 0 }))
        .filter((t) => t.millis > 0 && t.millis <= echeanceMillis);
      let meilleure = null;
      for (const t of avantEcheance) { if (!meilleure || t.score > meilleure.score) meilleure = t; }
      const derniereActivite = tentatives.reduce((max, t) => Math.max(max, t.horodatage?.toMillis ? t.horodatage.toMillis() : 0), 0);

      return { ...dv, echeanceMillis, essaisUtilises, actif, epuise, meilleure, nbEssaisAvantEcheance: avantEcheance.length, derniereActivite };
    }));

    const aFaire = avecStatut.filter((d) => d.actif && !d.epuise).sort((a, b) => a.echeanceMillis - b.echeanceMillis);
    const faits = avecStatut.filter((d) => !(d.actif && !d.epuise)).sort((a, b) => b.derniereActivite - a.derniereActivite);

    rendreAFaire(aFaire);
    rendreFaits(faits);
    zoneChargement.hidden = true;
    zoneContenu.hidden = false;
  } catch (erreur) {
    console.warn('Mes devoirs : chargement impossible.', erreur);
    zoneChargement.hidden = true;
    zoneErreur.textContent = 'Impossible de charger tes devoirs pour le moment.';
    zoneErreur.hidden = false;
  }
});
