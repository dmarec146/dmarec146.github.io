#!/usr/bin/env node
'use strict';

// Outil hors-site (jamais servi par GitHub Pages) : crée les comptes Firebase
// du projet cahiers-interactifs, à exécuter à la main par l'enseignant.
// Voir README.md pour l'installation et l'usage.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const CHEMIN_CLE_SERVICE = path.join(__dirname, 'service-account.json');
// Choix assume : reste dans ce dossier (donc dans Google Drive, synchronise
// vers le cloud) pour rester accessible facilement depuis n'importe quel
// poste. Le fichier est dans .gitignore : jamais commite sur GitHub.
const DOSSIER_SORTIE = __dirname;
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
  initializeApp({
    credential: cert(require(CHEMIN_CLE_SERVICE)),
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

// Ne garde que a-z (apres normalize('NFD') + suppression des diacritiques) :
// enleve accents, espaces, traits d'union, apostrophes...
function nettoyerPourPseudo(s) {
  return s.trim().toLowerCase().normalize('NFD').replace(MARQUES_DIACRITIQUES, '').replace(/[^a-z]/g, '');
}

// Un eleve peut avoir plusieurs prenoms ("Aicha Bénédicte") : seul le
// premier sert, aussi bien pour l'identifiant que pour l'affichage.
function premierPrenom(prenom) {
  return prenom.trim().split(/\s+/)[0];
}

// Casse forcee par le code (independante de celle du fichier source) :
// nom entierement en majuscules, prenom avec seule l'initiale en majuscule.
function formaterNom(nom) {
  return nom.trim().toLocaleUpperCase('fr-FR');
}
function formaterPrenom(prenom) {
  const mot = premierPrenom(prenom).toLocaleLowerCase('fr-FR');
  return mot.charAt(0).toLocaleUpperCase('fr-FR') + mot.slice(1);
}

// Premiere lettre du (premier) prenom + '.' + nom (ex. "David Marec" -> "d.marec").
// En cas de doublon (meme initiale + meme nom), suffixe numerique : d.marec2, d.marec3...
// Attribution stable d'une execution a l'autre tant que les lignes existantes du
// CSV ne sont ni reordonnees ni retirees (ajouter des eleves a la fin ne change
// rien aux pseudos deja attribues) : c'est ce qui rend le script idempotent
// (relancer sur le meme fichier retrouve les memes pseudos, donc les memes
// comptes, et ne recree rien).
function genererPseudosUniques(eleves) {
  const compteurs = new Map();
  return eleves.map(({ classe, prenom, nom }) => {
    const base = `${nettoyerPourPseudo(premierPrenom(prenom)).charAt(0)}.${nettoyerPourPseudo(nom)}`;
    const n = (compteurs.get(base) || 0) + 1;
    compteurs.set(base, n);
    return { classe, prenom: formaterPrenom(prenom), nom: formaterNom(nom), pseudo: n === 1 ? base : `${base}${n}` };
  });
}

// Excel en France enregistre/attend des CSV separes par ';' (la ',' est la
// touche decimale) ; on accepte aussi ',' pour les fichiers ecrits a la main
// ou par un autre outil. Detecte sur la ligne d'entete.
function detecterSeparateur(entete) {
  return entete.includes(';') ? ';' : ',';
}

function lireCsvEleves(cheminCsv) {
  const lignes = fs.readFileSync(cheminCsv, 'utf8').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const [entete, ...reste] = lignes;
  const sep = detecterSeparateur(entete);
  const colonnes = entete.split(sep).map(c => c.trim().toLowerCase());
  const iClasse = colonnes.indexOf('classe');
  const iPseudo = colonnes.indexOf('pseudo');
  const iPrenom = colonnes.indexOf('prenom');
  const iNom = colonnes.indexOf('nom');

  if (iClasse === -1) throw new Error("Le CSV doit avoir une colonne 'classe'.");

  if (iPseudo !== -1) {
    // Pseudo deja choisi par l'enseignant : utilise tel quel.
    return reste.map((ligne, index) => {
      const champs = ligne.split(sep).map(c => c.trim());
      const classe = champs[iClasse];
      const pseudo = champs[iPseudo];
      if (!classe || !pseudo) throw new Error(`Ligne ${index + 2} du CSV incomplete : "${ligne}"`);
      return { classe, pseudo };
    });
  }

  if (iPrenom === -1 || iNom === -1) {
    throw new Error("Le CSV doit avoir soit une colonne 'pseudo', soit les colonnes 'prenom' et 'nom'.");
  }
  const eleves = reste.map((ligne, index) => {
    const champs = ligne.split(sep).map(c => c.trim());
    const classe = champs[iClasse];
    const prenom = champs[iPrenom];
    const nom = champs[iNom];
    if (!classe || !prenom || !nom) throw new Error(`Ligne ${index + 2} du CSV incomplete : "${ligne}"`);
    return { classe, prenom, nom };
  });
  return genererPseudosUniques(eleves);
}

async function creerComptesEleves(cheminCsv) {
  const eleves = lireCsvEleves(cheminCsv);
  const auth = getAuth();
  const db = getFirestore();
  const resultats = [];

  for (const { classe, pseudo, prenom, nom } of eleves) {
    const email = emailDepuisPseudo(pseudo);
    let utilisateur;
    try {
      utilisateur = await auth.getUserByEmail(email);
      console.log(`Deja existant, ignore : ${pseudo}`);
      continue;
    } catch (erreur) {
      if (erreur.code !== 'auth/user-not-found') throw erreur;
    }

    const motDePasse = genererMotDePasse();
    utilisateur = await auth.createUser({ email, password: motDePasse });
    await db.collection('eleves').doc(utilisateur.uid).set({
      pseudo,
      classe,
      creeLe: FieldValue.serverTimestamp(),
    });

    resultats.push({ classe, pseudo, motDePasse, prenom, nom });
    console.log(`Cree : ${pseudo} (${classe})`);
  }

  if (resultats.length === 0) {
    console.log('Aucun nouveau compte a creer.');
    return;
  }

  // Nom/prenom ne sont jamais envoyes a Firestore (seuls pseudo + classe le
  // sont, ci-dessus) : ils ne servent qu'a produire une feuille de
  // distribution lisible par l'enseignant, dans ce meme dossier (jamais
  // commitee, mais synchronisee sur Google Drive comme le reste du projet).
  const avecIdentite = resultats.every(r => r.nom && r.prenom);
  const horodatage = new Date().toISOString().replace(/[:.]/g, '-');
  fs.mkdirSync(DOSSIER_SORTIE, { recursive: true });
  const cheminSortie = path.join(DOSSIER_SORTIE, `comptes-crees-${horodatage}.csv`);
  const contenu = avecIdentite
    ? ['Nom;Prenom;Identifiant;MotDePasse']
        .concat(resultats.map(r => `${r.nom};${r.prenom};${r.pseudo};${r.motDePasse}`))
        .join('\n')
    : ['Classe;Identifiant;MotDePasse']
        .concat(resultats.map(r => `${r.classe};${r.pseudo};${r.motDePasse}`))
        .join('\n');
  fs.writeFileSync(cheminSortie, contenu, 'utf8');
  console.log(`\n${resultats.length} compte(s) cree(s). Identifiants ecrits dans :\n${cheminSortie}`);
  console.log('A distribuer aux eleves puis a supprimer (mots de passe en clair, jamais commite).');
}

async function creerOuPromouvoirAdmin(email, motDePasse) {
  const auth = getAuth();
  let utilisateur;
  try {
    utilisateur = await auth.getUserByEmail(email);
    console.log(`Compte existant : ${email}`);
  } catch (erreur) {
    if (erreur.code !== 'auth/user-not-found') throw erreur;
    utilisateur = await auth.createUser({ email, password: motDePasse });
    console.log(`Compte cree : ${email}`);
  }
  await auth.setCustomUserClaims(utilisateur.uid, { admin: true });
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
