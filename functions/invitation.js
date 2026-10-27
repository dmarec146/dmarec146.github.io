'use strict';

// Logique de l'invitation d'un enseignant (27/10/2026), separee de index.js pour pouvoir etre testee sur les emulateurs
// sans deployer. `auth` est un objet Auth de firebase-admin ; `envoyerCourriel(adresse)` fait envoyer le courriel de
// choix du mot de passe (injecte : une fausse fonction dans les tests).

const crypto = require('crypto');
const { HttpsError } = require('firebase-functions/v2/https');

// Une adresse academique (@ac-creteil.fr, @ac-paris.fr...) : preuve simple qu'il s'agit d'un enseignant.
const MOTIF_ACADEMIQUE = /@ac-[a-z-]+\.fr$/;
const MOTIF_ADRESSE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function motDePasseAleatoire(longueur = 28) {
  const octets = crypto.randomBytes(longueur);
  let mot = '';
  for (let i = 0; i < longueur; i++) mot += ALPHABET[octets[i] % ALPHABET.length];
  return mot;
}

async function inviter(auth, donnees, { envoyerCourriel }) {
  const adresse = String((donnees && donnees.email) || '').trim().toLowerCase();
  const exception = !!(donnees && donnees.exception);
  if (!MOTIF_ADRESSE.test(adresse) || adresse.endsWith('@cahiers-interactifs.local')) {
    throw new HttpsError('invalid-argument', 'Adresse e-mail invalide.');
  }
  if (!exception && !MOTIF_ACADEMIQUE.test(adresse)) {
    throw new HttpsError('invalid-argument', 'Ce n\'est pas une adresse académique (@ac-….fr). Cochez « exception » pour l\'inviter quand même.');
  }

  let utilisateur;
  let nouveauCompte = false;
  try {
    utilisateur = await auth.getUserByEmail(adresse);
  } catch (erreur) {
    if (erreur.code !== 'auth/user-not-found') throw erreur;
    utilisateur = await auth.createUser({ email: adresse, password: motDePasseAleatoire() });
    nouveauCompte = true;
  }
  const droits = utilisateur.customClaims || {};
  if (droits.admin === true) {
    throw new HttpsError('failed-precondition', 'Ce compte est un compte administrateur : aucune invitation nécessaire.');
  }
  if (droits.enseignant !== true) await auth.setCustomUserClaims(utilisateur.uid, { ...droits, enseignant: true });

  await envoyerCourriel(adresse);
  return { ok: true, adresse, nouveauCompte };
}

module.exports = { inviter, MOTIF_ACADEMIQUE };
