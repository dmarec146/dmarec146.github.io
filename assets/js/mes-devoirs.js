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
import { chargerDevoirsEleve, masquerDevoirs } from './devoirs-eleve.js';

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
  // ?devoir=<id> (04/10/2026) : la fiche s'ouvre sur CE devoir -- necessaire
  // des qu'une fiche porte plusieurs devoirs (devoirs sur des calculs
  // differents) ; une fiche qui ne lit pas le parametre l'ignore.
  if (devoir.type === 'fiche') return `${devoir.ficheId}?devoir=${encodeURIComponent(devoir.id)}`;
  return devoir.cible === 'fiche' ? '/automatismes/premiere/fiche.html' : '/automatismes/premiere/sujet-blanc.html';
}

function titreDevoir(devoir) {
  return devoir.titre || devoir.ficheId || 'Devoir';
}

const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;

function note(d) {
  return `${(Math.round(d.meilleure.score * 10) / 10).toLocaleString('fr-FR')} / ${d.meilleure.totalExercices}`;
}

// Bouton de suppression en deux temps (« Supprimer » puis « Confirmer / Annuler ») :
// retire le ou les devoirs de la liste de l'eleve (voir masquerDevoirs), l'enseignant
// garde les resultats -- le texte de confirmation le dit.
function boutonSuppression(libelle, question, action) {
  const zone = document.createElement('span');
  zone.className = 'md-suppression';
  const bouton = document.createElement('button');
  bouton.type = 'button';
  bouton.className = 'md-supprimer';
  bouton.textContent = libelle;
  zone.appendChild(bouton);
  bouton.addEventListener('click', () => {
    zone.innerHTML = '';
    const q = document.createElement('span');
    q.className = 'md-suppression-question';
    q.textContent = question;
    const oui = document.createElement('button');
    oui.type = 'button'; oui.className = 'md-supprimer md-supprimer--oui'; oui.textContent = 'Confirmer';
    const non = document.createElement('button');
    non.type = 'button'; non.className = 'md-supprimer'; non.textContent = 'Annuler';
    zone.append(q, oui, non);
    non.addEventListener('click', () => { zone.replaceWith(boutonSuppression(libelle, question, action)); });
    oui.addEventListener('click', async () => {
      oui.disabled = non.disabled = true;
      try { await action(); } catch (erreur) {
        console.warn('Mes devoirs : suppression impossible.', erreur);
        q.textContent = 'Suppression impossible pour le moment.';
        oui.remove(); non.disabled = false; non.textContent = 'Fermer';
      }
    });
  });
  return zone;
}

function remplir(section, liste, meta, estLien, action) {
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
    if (action) li.firstElementChild.appendChild(boutonSuppression('Supprimer',
      'Retirer ce devoir de ta liste ? Ton enseignant conserve tes résultats.', () => action([d.id])));
    ul.appendChild(li);
  }
}

async function charger(utilisateur, nettoyerBrouillons) {
  try {
    const resultat = await chargerDevoirsEleve(utilisateur.uid, { nettoyerBrouillons });
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

    const retirer = async (ids) => {
      await masquerDevoirs(utilisateur.uid, ids);
      await charger(utilisateur, false); // recharge la page sans les devoirs retires
    };
    remplir('faits', resultat.faits,
      (d) => (d.meilleure ? note(d) : 'Non rendu') + ` — ${pluriel(d.nbEssaisAvantEcheance, 'tentative')}`,
      () => false, retirer);
    // « Tout supprimer » : meme confirmation, sur toute la colonne.
    const zoneTout = document.getElementById('md-faits-tout');
    zoneTout.innerHTML = '';
    if (resultat.faits.length > 1) {
      zoneTout.appendChild(boutonSuppression('Tout supprimer',
        `Retirer ces ${resultat.faits.length} devoirs de ta liste ? Ton enseignant conserve tes résultats.`,
        () => retirer(resultat.faits.map((d) => d.id))));
    }

    zoneChargement.hidden = true;
    zoneContenu.hidden = false;
  } catch (erreur) {
    console.warn('Mes devoirs : chargement impossible.', erreur);
    zoneChargement.hidden = true;
    zoneErreur.textContent = 'Impossible de charger tes devoirs pour le moment.';
    zoneErreur.hidden = false;
  }
}

onAuthStateChanged(auth, (utilisateur) => {
  if (!utilisateur) {
    window.location.replace('../connexion/index.html');
    return;
  }
  charger(utilisateur, true);
});
