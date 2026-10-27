'use strict';

// Fonctions serveur du site (27/10/2026). Region : Paris, comme la base Firestore.
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { inviter } = require('./invitation');

initializeApp();
setGlobalOptions({ region: 'europe-west9', maxInstances: 3 });

// Cle d'API publique du projet (la meme que assets/js/firebase-config.js : elle designe le projet, ce n'est pas un secret).
const CLE_API_PUBLIQUE = 'AIzaSyAlVsufBIQmPQ2dxfaQ1tPi1JVMNYK5TlI';
const ADRESSE_APRES_CHOIX_MOT_DE_PASSE = 'https://cahiers-interactifs.fr/connexion/';

// Fait envoyer par Firebase le courriel de choix du mot de passe (le meme que « mot de passe oublie »), en francais.
async function envoyerCourrielMotDePasse(adresse) {
  // Emulateur : aucun courriel reel ne doit partir (le compte n'existe que dans la fausse base).
  if (process.env.FUNCTIONS_EMULATOR === 'true') { console.log('MODE TEST : courriel non envoye a', adresse); return; }
  const reponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${CLE_API_PUBLIQUE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Firebase-Locale': 'fr' },
    body: JSON.stringify({ requestType: 'PASSWORD_RESET', email: adresse, continueUrl: ADRESSE_APRES_CHOIX_MOT_DE_PASSE }),
  });
  if (!reponse.ok) {
    console.error('Envoi du courriel refuse', reponse.status, (await reponse.text()).slice(0, 300));
    throw new HttpsError('internal', 'Le courriel n\'a pas pu être envoyé.');
  }
}

// Appelable depuis le tableau de bord (assets/js/inviter.js) par l'administrateur UNIQUEMENT : cree le compte d'un
// enseignant (mot de passe aleatoire inconnu), lui donne le droit « enseignant », puis lui fait envoyer le courriel.
exports.inviterEnseignant = onCall(async (requete) => {
  if (!requete.auth || requete.auth.token.admin !== true) {
    throw new HttpsError('permission-denied', 'Réservé à l\'administrateur.');
  }
  return inviter(getAuth(), requete.data, { envoyerCourriel: envoyerCourrielMotDePasse });
});
