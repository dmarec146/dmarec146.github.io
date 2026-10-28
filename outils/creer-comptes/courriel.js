'use strict';

// Courriel envoye a un collegue quand les comptes de ses classes sont crees (28/10/2026). Envoye depuis la boite
// contact@cahiers-interactifs.fr (OVH, Zimbra) par le serveur d'envoi d'OVH ; les reglages et le mot de passe de la boite sont
// dans courriel.json, a cote de ce fichier (jamais commite : .gitignore). Modele sans secret : courriel.exemple.json.
// Le courriel ne contient AUCUN identifiant ni mot de passe d'eleve : les etiquettes sont envoyees a part par David.

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const CHEMIN_REGLAGES = path.join(__dirname, 'courriel.json');
const ADRESSE_SITE = 'https://cahiers-interactifs.fr';

// { reglages } si le fichier est utilisable, sinon { erreur } (message lisible).
function chargerReglages(chemin = CHEMIN_REGLAGES) {
  if (!fs.existsSync(chemin)) return { erreur: `fichier ${path.basename(chemin)} absent (modele : courriel.exemple.json)` };
  let reglages;
  try { reglages = JSON.parse(fs.readFileSync(chemin, 'utf8')); } catch (e) { return { erreur: `${path.basename(chemin)} illisible (JSON invalide)` }; }
  for (const champ of ['hote', 'port', 'utilisateur', 'motDePasse', 'expediteur']) {
    if (!reglages[champ]) return { erreur: `${path.basename(chemin)} : champ « ${champ} » manquant` };
  }
  if (/^REMPLACER/.test(String(reglages.motDePasse))) return { erreur: `${path.basename(chemin)} : mot de passe pas encore renseigne` };
  return { reglages };
}

function creerTransport(reglages) {
  return nodemailer.createTransport({
    host: reglages.hote,
    port: Number(reglages.port),
    secure: reglages.securise !== undefined ? !!reglages.securise : Number(reglages.port) === 465,
    auth: { user: reglages.utilisateur, pass: reglages.motDePasse },
  });
}

const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;

// classes : [{ classe, nombre }] (comptes crees cette fois-ci) ; nom : facultatif.
function messageClassesEnLigne({ nom, classes }) {
  const lignes = classes.map((c) => `  - ${c.classe || 'hors classe'} : ${pluriel(c.nombre, 'élève')}`);
  const texte = [
    nom ? `Bonjour ${nom},` : 'Bonjour,',
    '',
    `Les comptes de vos élèves sont créés sur Cahiers interactifs :`,
    '',
    ...lignes,
    '',
    'Pour attribuer un devoir à une classe :',
    `  1. Connectez-vous sur ${ADRESSE_SITE}/connexion/ avec votre adresse e-mail et le mot de passe que vous avez choisi à la réception de l'invitation.`,
    '  2. Ouvrez votre tableau de bord (icône en haut à droite) : vos classes y apparaissent.',
    '',
    'Les identifiants des élèves (étiquettes à imprimer et à découper) vous sont envoyés séparément par David Marec, depuis sa messagerie académique.',
    '',
    `Le guide de l'enseignant : ${ADRESSE_SITE}/assets/docs/guide-enseignant.pdf`,
    '',
    'Pour toute question, répondez simplement à ce message.',
    '',
    'David Marec',
    'Cahiers interactifs',
  ].join('\n');
  return { sujet: 'Vos classes sont en ligne — Cahiers interactifs', texte };
}

async function envoyer(reglages, destinataire, message, transport = creerTransport(reglages)) {
  return transport.sendMail({
    from: reglages.expediteur,
    ...(reglages.repondreA && { replyTo: reglages.repondreA }),
    to: destinataire,
    subject: message.sujet,
    text: message.texte,
  });
}

module.exports = { chargerReglages, creerTransport, messageClassesEnLigne, envoyer };
