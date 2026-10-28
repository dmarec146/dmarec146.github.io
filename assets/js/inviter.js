// Page « Inviter un enseignant » du tableau de bord (tableau-de-bord/inviter.html), reservee a l'administrateur.
// Appelle la fonction serveur `inviterEnseignant` (functions/index.js), qui cree le compte, lui donne le droit
// « enseignant » et fait envoyer par Firebase le courriel de choix du mot de passe. Le navigateur ne peut pas le
// faire seul : creer un compte et poser un droit exigent les pouvoirs du serveur ; la fonction refuse tout autre
// compte que l'administrateur, et cette page redirige les autres visiteurs.

import { auth, app, MODE_EMULATEUR } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js";

const REGION = 'europe-west9'; // meme region que functions/index.js

const zoneChargement = document.getElementById('inv-chargement');
const zoneContenu = document.getElementById('inv-contenu');
const formulaire = document.getElementById('inv-formulaire');
const champEmail = document.getElementById('inv-email');
const caseException = document.getElementById('inv-exception');
const bouton = document.getElementById('inv-bouton');
const zoneResultat = document.getElementById('inv-resultat');
const zoneErreur = document.getElementById('inv-erreur');

const fonctions = getFunctions(app, REGION);
if (MODE_EMULATEUR) connectFunctionsEmulator(fonctions, '127.0.0.1', 5001);
const inviterEnseignant = httpsCallable(fonctions, 'inviterEnseignant');
const listerEnseignants = httpsCallable(fonctions, 'listerEnseignants');
const zoneListeEtat = document.getElementById('inv-liste-etat');
const tableListe = document.getElementById('inv-liste');
const corpsListe = document.getElementById('inv-liste-corps');

function montrer(zone, texte) { zone.textContent = texte; zone.hidden = false; }
function cacher(zone) { zone.hidden = true; zone.textContent = ''; }

// Messages lisibles : les erreurs « metier » de la fonction (adresse invalide, non academique, compte admin) portent
// deja un texte en francais ; les autres sont expliquees ici.
function messageErreur(erreur) {
  const code = erreur && erreur.code ? String(erreur.code).replace('functions/', '') : '';
  if (code === 'invalid-argument' || code === 'failed-precondition') return String(erreur.message || '').replace(/\s*\[\d{3}\]\s*$/, '');
  if (code === 'permission-denied') return "Cette action est réservée au compte administrateur : reconnecte-toi avec ton compte (déconnexion puis connexion).";
  if (code === 'unauthenticated') return 'Session expirée : reconnecte-toi.';
  if (code === 'unavailable' || code === 'deadline-exceeded') return 'Connexion impossible pour le moment. Réessaie dans un instant.';
  if (code === 'not-found') return "La fonction d'invitation n'est pas encore installée sur le serveur.";
  return "L'invitation n'a pas pu être envoyée. Réessaie, et dis-le moi si cela se reproduit.";
}

// Collegues invites (28/10/2026) : adresse, date d'invitation, derniere connexion, nombre d'eleves et de classes.
// Que des totaux (la fonction ne renvoie jamais de nom d'eleve). Appelee a l'ouverture de la page et apres chaque
// invitation, pas autrement : chaque appel lit un profil par eleve de chaque collegue.
const FORMAT_JOUR = { day: 'numeric', month: 'long', year: 'numeric' };
const FORMAT_HEURE = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
function cellule(ligne, texte, classe) {
  const td = document.createElement('td');
  td.textContent = texte;
  if (classe) td.className = classe;
  ligne.appendChild(td);
  return td;
}
async function chargerListe() {
  tableListe.hidden = true;
  zoneListeEtat.classList.remove('tdb-etat-erreur');
  zoneListeEtat.textContent = 'Chargement de la liste…';
  zoneListeEtat.hidden = false;
  try {
    const { data } = await listerEnseignants();
    corpsListe.textContent = '';
    for (const e of data.enseignants) {
      const ligne = document.createElement('tr');
      cellule(ligne, e.adresse);
      cellule(ligne, e.creeLe ? new Date(e.creeLe).toLocaleDateString('fr-FR', FORMAT_JOUR) : '—');
      if (e.derniereConnexion) cellule(ligne, new Date(e.derniereConnexion).toLocaleString('fr-FR', FORMAT_HEURE));
      else cellule(ligne, 'Pas encore connecté', 'inv-pas-connecte');
      cellule(ligne, String(e.eleves), 'inv-nombre');
      cellule(ligne, String(e.classes), 'inv-nombre');
      corpsListe.appendChild(ligne);
    }
    if (!data.enseignants.length) { zoneListeEtat.textContent = 'Aucun collègue invité pour le moment.'; return; }
    zoneListeEtat.hidden = true;
    tableListe.hidden = false;
  } catch (erreur) {
    console.error('Liste des collègues : échec.', erreur);
    const code = erreur && erreur.code ? String(erreur.code).replace('functions/', '') : '';
    zoneListeEtat.classList.add('tdb-etat-erreur');
    zoneListeEtat.textContent = code === 'not-found'
      ? "La fonction de liste n'est pas encore installée sur le serveur."
      : 'La liste des collègues n’a pas pu être chargée. Recharge la page pour réessayer.';
  }
}

formulaire.addEventListener('submit', async (evenement) => {
  evenement.preventDefault();
  cacher(zoneResultat); cacher(zoneErreur);
  const email = champEmail.value.trim();
  if (!email) { montrer(zoneErreur, "Saisis l'adresse e-mail de l'enseignant."); champEmail.focus(); return; }
  bouton.disabled = true;
  const libelle = bouton.textContent;
  bouton.textContent = 'Envoi en cours…';
  try {
    const { data } = await inviterEnseignant({ email, exception: caseException.checked });
    montrer(zoneResultat, data.nouveauCompte
      ? `Invitation envoyée à ${data.adresse}. Le compte vient d'être créé ; le courriel contient le lien pour choisir le mot de passe.`
      : `Nouveau courriel envoyé à ${data.adresse} (le compte existait déjà).`);
    champEmail.value = '';
    caseException.checked = false;
    chargerListe();
  } catch (erreur) {
    console.error('Invitation : échec.', erreur);
    montrer(zoneErreur, messageErreur(erreur));
  } finally {
    bouton.disabled = false;
    bouton.textContent = libelle;
  }
});

onAuthStateChanged(auth, async (utilisateur) => {
  if (!utilisateur) { if (!window.__deconnexionEnCours) window.location.replace('../connexion/index.html'); return; }
  const jeton = await utilisateur.getIdTokenResult();
  if (jeton.claims.admin !== true) { window.location.replace('../index.html'); return; }
  document.querySelectorAll('.tdb-nav-carte[data-reserve-admin]').forEach((carte) => { carte.classList.add('admin-confirme'); });
  try { window.localStorage.setItem('cahiers-admin', '1'); } catch (e) { /* stockage indisponible */ }
  zoneChargement.hidden = true;
  zoneContenu.hidden = false;
  chargerListe();
});
