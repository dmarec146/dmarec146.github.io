import { auth, emailDepuisPseudo } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const MESSAGES_ERREUR = {
  'auth/invalid-email': "Identifiant invalide.",
  'auth/user-not-found': "Identifiant ou mot de passe incorrect.",
  'auth/wrong-password': "Identifiant ou mot de passe incorrect.",
  'auth/invalid-credential': "Identifiant ou mot de passe incorrect.",
  'auth/too-many-requests': "Trop de tentatives. Réessaie dans quelques minutes.",
  'auth/network-request-failed': "Connexion au serveur impossible. Vérifie ta connexion internet.",
};

function messageErreur(erreur) {
  return MESSAGES_ERREUR[erreur.code] || "La connexion a échoué. Réessaie.";
}

// TODO(tableau de bord / espace élève) : rediriger vers la page dédiée une
// fois construite (brique 04 du cahier de suivi). Pour l'instant, l'accueil.
const DESTINATION_APRES_CONNEXION = '../index.html';

onAuthStateChanged(auth, (utilisateur) => {
  if (utilisateur) window.location.replace(DESTINATION_APRES_CONNEXION);
});

const formulaire = document.getElementById('form-connexion');
const champPseudo = document.getElementById('pseudo');
const champMotDePasse = document.getElementById('mot-de-passe');
const zoneErreur = document.getElementById('connexion-erreur');
const bouton = formulaire.querySelector('.connexion-bouton');

function afficherErreur(message) {
  zoneErreur.textContent = message;
  zoneErreur.hidden = false;
}

function masquerErreur() {
  zoneErreur.hidden = true;
  zoneErreur.textContent = '';
}

formulaire.addEventListener('submit', async (evenement) => {
  evenement.preventDefault();
  masquerErreur();

  const pseudo = champPseudo.value;
  const motDePasse = champMotDePasse.value;
  if (!pseudo.trim() || !motDePasse) {
    afficherErreur("Renseigne ton identifiant et ton mot de passe.");
    return;
  }

  bouton.disabled = true;
  try {
    await signInWithEmailAndPassword(auth, emailDepuisPseudo(pseudo), motDePasse);
    // La redirection est déclenchée par onAuthStateChanged ci-dessus.
  } catch (erreur) {
    afficherErreur(messageErreur(erreur));
    bouton.disabled = false;
  }
});
