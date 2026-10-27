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
  zoneChargement.hidden = true;
  zoneContenu.hidden = false;
});
