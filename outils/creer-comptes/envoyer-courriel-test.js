#!/usr/bin/env node
'use strict';

// Essai d'envoi du courriel « vos classes sont en ligne » vers UNE adresse, avec les reglages de courriel.json :
//
//   node envoyer-courriel-test.js <adresse>
//
// Aucun compte n'est cree ni modifie : c'est seulement pour verifier que la boite d'envoi fonctionne.

const { chargerReglages, creerTransport, messageClassesEnLigne, envoyer } = require('./courriel.js');

const destinataire = process.argv[2];
if (!destinataire || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(destinataire)) {
  console.error('Usage : node envoyer-courriel-test.js <adresse>');
  process.exit(1);
}
const { reglages, erreur } = chargerReglages();
if (erreur) { console.error(`Reglages de courriel inutilisables : ${erreur}`); process.exit(1); }

const message = messageClassesEnLigne({ nom: 'Prénom Nom', classes: [{ classe: '2nde-210', nombre: 2 }, { classe: '1ere-Gr 5', nombre: 1 }] });
message.sujet = '[ESSAI] ' + message.sujet;
message.texte = 'CECI EST UN ESSAI D\'ENVOI : aucun compte n\'a ete cree.\n\n' + message.texte;
const transport = creerTransport(reglages);
transport.verify()
  .then(() => { console.log(`Connexion au serveur d'envoi ${reglages.hote}:${reglages.port} reussie.`); return envoyer(reglages, destinataire, message, transport); })
  .then((info) => console.log(`Courriel d'essai envoye a ${destinataire} (accepte par le serveur : ${(info.accepted || []).join(', ') || 'aucun'}).`))
  .catch((e) => { console.error(`Echec de l'envoi : ${e.message}`); process.exit(1); });
