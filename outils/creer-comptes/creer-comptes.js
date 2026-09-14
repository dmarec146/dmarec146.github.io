#!/usr/bin/env node
'use strict';

// Outil hors-site (jamais servi par GitHub Pages) : crée les comptes Firebase
// du projet cahiers-interactifs, à exécuter à la main par l'enseignant.
// Voir README.md pour l'installation et l'usage.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const admin = require('firebase-admin');

const CHEMIN_CLE_SERVICE = path.join(__dirname, 'service-account.json');
const ALPHABET_MOT_DE_PASSE = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0/O/1/l/I

function initialiserAdmin() {
  if (!fs.existsSync(CHEMIN_CLE_SERVICE)) {
    console.error(
      `Clé de service introuvable : ${CHEMIN_CLE_SERVICE}\n` +
      "Console Firebase -> Parametres du projet -> Comptes de service -> " +
      "Generer une nouvelle cle privee, puis enregistrer le fichier telecharge " +
      "sous ce nom exact (il est dans .gitignore, jamais commite)."
    );
    process.exit(1);
  }
  admin.initializeApp({
    credential: admin.credential.cert(require(CHEMIN_CLE_SERVICE)),
  });
}

// Marques diacritiques U+0300-U+036F restant apres un normalize('NFD').
const MARQUES_DIACRITIQUES = /[̀-ͯ]/g;

function emailDepuisPseudo(pseudo) {
  const slug = pseudo.trim().toLowerCase().normalize('NFD').replace(MARQUES_DIACRITIQUES, '');
  return `${slug}@cahiers-interactifs.local`;
}

function genererMotDePasse(longueur = 10) {
  let mot = '';
  const octets = crypto.randomBytes(longueur);
  for (let i = 0; i < longueur; i++) {
    mot += ALPHABET_MOT_DE_PASSE[octets[i] % ALPHABET_MOT_DE_PASSE.length];
  }
  return mot;
}

function lireCsvEleves(cheminCsv) {
  const lignes = fs.readFileSync(cheminCsv, 'utf8').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const [entete, ...reste] = lignes;
  const colonnes = entete.split(',').map(c => c.trim().toLowerCase());
  const iClasse = colonnes.indexOf('classe');
  const iPseudo = colonnes.indexOf('pseudo');
  if (iClasse === -1 || iPseudo === -1) {
    throw new Error("Le CSV doit avoir un en-tete avec les colonnes 'classe' et 'pseudo'.");
  }
  return reste.map((ligne, index) => {
    const champs = ligne.split(',').map(c => c.trim());
    const classe = champs[iClasse];
    const pseudo = champs[iPseudo];
    if (!classe || !pseudo) throw new Error(`Ligne ${index + 2} du CSV incomplete : "${ligne}"`);
    return { classe, pseudo };
  });
}

async function creerComptesEleves(cheminCsv) {
  const eleves = lireCsvEleves(cheminCsv);
  const db = admin.firestore();
  const resultats = [];

  for (const { classe, pseudo } of eleves) {
    const email = emailDepuisPseudo(pseudo);
    let utilisateur;
    try {
      utilisateur = await admin.auth().getUserByEmail(email);
      console.log(`Deja existant, ignore : ${pseudo}`);
      continue;
    } catch (erreur) {
      if (erreur.code !== 'auth/user-not-found') throw erreur;
    }

    const motDePasse = genererMotDePasse();
    utilisateur = await admin.auth().createUser({ email, password: motDePasse });
    await db.collection('eleves').doc(utilisateur.uid).set({
      pseudo,
      classe,
      creeLe: admin.firestore.FieldValue.serverTimestamp(),
    });

    resultats.push({ classe, pseudo, motDePasse });
    console.log(`Cree : ${pseudo} (${classe})`);
  }

  if (resultats.length === 0) {
    console.log('Aucun nouveau compte a creer.');
    return;
  }

  const horodatage = new Date().toISOString().replace(/[:.]/g, '-');
  const cheminSortie = path.join(__dirname, `comptes-crees-${horodatage}.csv`);
  const contenu = ['classe,pseudo,motDePasse']
    .concat(resultats.map(r => `${r.classe},${r.pseudo},${r.motDePasse}`))
    .join('\n');
  fs.writeFileSync(cheminSortie, contenu, 'utf8');
  console.log(`\n${resultats.length} compte(s) cree(s). Identifiants ecrits dans :\n${cheminSortie}`);
  console.log('Fichier a distribuer aux eleves puis a supprimer (mots de passe en clair, jamais commite).');
}

async function creerOuPromouvoirAdmin(email, motDePasse) {
  let utilisateur;
  try {
    utilisateur = await admin.auth().getUserByEmail(email);
    console.log(`Compte existant : ${email}`);
  } catch (erreur) {
    if (erreur.code !== 'auth/user-not-found') throw erreur;
    utilisateur = await admin.auth().createUser({ email, password: motDePasse });
    console.log(`Compte cree : ${email}`);
  }
  await admin.auth().setCustomUserClaims(utilisateur.uid, { admin: true });
  console.log(`Droit "admin" accorde a ${email}. Deconnecte-toi puis reconnecte-toi sur le site pour que ca prenne effet.`);
}

async function main() {
  const [, , commande, arg1, arg2] = process.argv;
  initialiserAdmin();

  if (commande === '--admin') {
    if (!arg1 || !arg2) {
      console.error('Usage : node creer-comptes.js --admin <email> <mot-de-passe>');
      process.exit(1);
    }
    await creerOuPromouvoirAdmin(arg1, arg2);
    return;
  }

  if (!commande) {
    console.error('Usage : node creer-comptes.js <fichier.csv>\n   ou : node creer-comptes.js --admin <email> <mot-de-passe>');
    process.exit(1);
  }
  await creerComptesEleves(commande);
}

main().catch((erreur) => {
  console.error(erreur);
  process.exit(1);
});
