// Tableau de bord eleve : /mes-devoirs/ (19/09/2026). Trois listes depuis le
// 30/09/2026 (demande de David) -- "A faire", "Enregistres" (commences et
// sauvegardes, pas encore valides) et "Faits" ; voir devoirs-eleve.js pour
// le classement exact, partage avec la pastille des pages d'entree
// (devoirs-notification.js). Un devoir enregistre quitte "Enregistres" des
// qu'il est valide (retour dans "A faire" s'il reste des essais, "Faits"
// sinon) ; s'il n'est pas termine a l'echeance, son brouillon est supprime
// (nettoyerBrouillons) et il apparait dans "Faits" comme non rendu.
//
// Page reservee a un compte eleve connecte : redirige vers /connexion/
// sinon.

import { auth } from './firebase-config.js';
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { chargerDevoirsEleve } from './devoirs-eleve.js';

const zoneChargement = document.getElementById('md-chargement');
const zoneErreur = document.getElementById('md-erreur');
const zoneContenu = document.getElementById('md-contenu');

function echapper(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

function formaterDate(millis) {
  return new Date(millis).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

// Une fiche pointe directement dessus (ficheId, chemin absolu). Un devoir
// d'automatismes n'a qu'une seule page qui se verrouille elle-meme sur le
// devoir en cours : sujet-blanc.html (cible absente ou 'sujet-blanc') ou
// fiche.html (cible 'fiche').
function lienPour(devoir) {
  if (devoir.type === 'fiche') return devoir.ficheId;
  return devoir.cible === 'fiche' ? '/automatismes/premiere/fiche.html' : '/automatismes/premiere/sujet-blanc.html';
}

function titreDevoir(devoir) {
  return devoir.titre || devoir.ficheId || 'Devoir';
}

const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;

function note(d) {
  return `${(Math.round(d.meilleure.score * 10) / 10).toLocaleString('fr-FR')} / ${d.meilleure.totalExercices}`;
}

function remplir(section, liste, meta, estLien) {
  const ul = document.getElementById(`md-${section}-liste`);
  ul.innerHTML = '';
  document.getElementById(`md-${section}-vide`).hidden = liste.length > 0;
  document.getElementById(`md-${section}-nb`).textContent = liste.length ? `(${liste.length})` : '';
  for (const d of liste) {
    const li = document.createElement('li');
    const contenu = `<span class="md-item-titre">${echapper(titreDevoir(d))}</span><span class="md-item-meta">${meta(d)}</span>`;
    li.innerHTML = estLien(d)
      ? `<a class="md-item md-item-lien" href="${lienPour(d)}">${contenu}</a>`
      : `<div class="md-item md-item-fait">${contenu}</div>`;
    ul.appendChild(li);
  }
}

onAuthStateChanged(auth, async (utilisateur) => {
  if (!utilisateur) {
    window.location.replace('../connexion/index.html');
    return;
  }
  try {
    const resultat = await chargerDevoirsEleve(utilisateur.uid, { nettoyerBrouillons: true });
    if (!resultat) {
      zoneChargement.hidden = true;
      zoneErreur.textContent = "Ce compte n'est pas associé à une classe élève.";
      zoneErreur.hidden = false;
      return;
    }

    remplir('a-faire', resultat.aFaire,
      (d) => (d.meilleure ? `Meilleure note : ${note(d)} — ` : '')
        + `À rendre avant le ${formaterDate(d.echeanceMillis)} — ${pluriel(d.restantes, 'tentative')} restante${d.restantes > 1 ? 's' : ''}`,
      () => true);

    remplir('enregistres', resultat.enregistres,
      (d) => `Enregistré${d.enregistreMillis ? ` le ${formaterDate(d.enregistreMillis)}` : ''} — à terminer et valider avant le ${formaterDate(d.echeanceMillis)}`
        + (d.meilleure ? ` — meilleure note : ${note(d)}` : '')
        + ` — ${pluriel(d.restantes, 'tentative')} restante${d.restantes > 1 ? 's' : ''}`,
      () => true);

    remplir('faits', resultat.faits,
      (d) => (d.meilleure ? note(d) : 'Non rendu') + ` — ${pluriel(d.nbEssaisAvantEcheance, 'tentative')}`,
      () => false);

    zoneChargement.hidden = true;
    zoneContenu.hidden = false;
  } catch (erreur) {
    console.warn('Mes devoirs : chargement impossible.', erreur);
    zoneChargement.hidden = true;
    zoneErreur.textContent = 'Impossible de charger tes devoirs pour le moment.';
    zoneErreur.hidden = false;
  }
});
