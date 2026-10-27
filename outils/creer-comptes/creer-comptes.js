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
  // Mode test (outils/test-local) : les emulateurs Firebase sont designes par
  // ces deux variables ; aucune cle de service, aucun vrai compte touche.
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST && process.env.FIRESTORE_EMULATOR_HOST) {
    console.log('MODE TEST : emulateurs Firebase locaux, aucune donnee reelle.');
    initializeApp({ projectId: 'demo-cahiers' });
    return;
  }
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
  // Excel enregistre un « CSV UTF-8 » avec un BOM en tete : sans ce retrait, la premiere colonne ne serait pas reconnue.
  const lignes = fs.readFileSync(cheminCsv, 'utf8').replace(/^﻿/, '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const [entete, ...reste] = lignes;
  const sep = detecterSeparateur(entete);
  // En-tetes sans tenir compte de la casse ni des accents : « Prénom » = « prenom » (modele donne aux enseignants).
  const colonnes = entete.split(sep).map(c => c.trim().toLowerCase().normalize('NFD').replace(MARQUES_DIACRITIQUES, ''));
  const iClasse = colonnes.indexOf('classe');
  const iPseudo = colonnes.indexOf('pseudo');
  const iPrenom = colonnes.indexOf('prenom');
  const iNom = colonnes.indexOf('nom');

  // Colonne 'classe' obligatoire, mais sa valeur peut etre vide : eleve hors classe (rattache a
  // aucun niveau, donc suivi sur tous les niveaux dans le tableau de bord -- voir estHorsClasse
  // dans assets/js/tableau-de-bord.js). Aucun champ 'classe' n'est alors ecrit dans Firestore.
  if (iClasse === -1) throw new Error("Le CSV doit avoir une colonne 'classe' (valeur vide autorisee pour un eleve hors classe).");

  if (iPseudo !== -1) {
    // Pseudo deja choisi par l'enseignant : utilise tel quel.
    return reste.map((ligne, index) => {
      const champs = ligne.split(sep).map(c => c.trim());
      const classe = champs[iClasse];
      const pseudo = champs[iPseudo];
      if (!pseudo) throw new Error(`Ligne ${index + 2} du CSV incomplete : "${ligne}"`);
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
    if (!prenom || !nom) throw new Error(`Ligne ${index + 2} du CSV incomplete : "${ligne}"`);
    return { classe, prenom, nom };
  });
  return genererPseudosUniques(eleves);
}

// Compte d'un enseignant (claim "enseignant" ou "admin") retrouve par son
// adresse e-mail ; les eleves y sont rattaches par son uid (champ `enseignant`).
async function trouverEnseignant(email) {
  let utilisateur;
  try {
    utilisateur = await getAuth().getUserByEmail(email.trim().toLowerCase());
  } catch (erreur) {
    if (erreur.code === 'auth/user-not-found') {
      throw new Error(`Aucun compte pour ${email}. Le creer d'abord : node creer-comptes.js --enseignant ${email}`);
    }
    throw erreur;
  }
  const claims = utilisateur.customClaims || {};
  if (claims.enseignant !== true) {
    throw new Error(`Le compte ${email} n'a pas le droit "enseignant" : ce n'est pas un compte enseignant.`);
  }
  return utilisateur;
}

// Un meme pseudo (d.marec) peut revenir chez deux enseignants differents, ou
// pour deux eleves homonymes : le compte deja la est-il CET eleve ? Meme
// enseignant et, si le fichier donne les noms, memes nom et prenom. Sinon il
// faut un autre pseudo (suffixe numerique) pour ne jamais ignorer a tort un
// nouvel eleve.
async function trouverPseudoLibre(pseudoSouhaite, eleve, enseignantUid, pseudoImpose) {
  const auth = getAuth();
  const db = getFirestore();
  for (let n = 1; n < 100; n++) {
    const pseudo = n === 1 ? pseudoSouhaite : `${pseudoSouhaite}${n}`;
    let existant;
    try {
      existant = await auth.getUserByEmail(emailDepuisPseudo(pseudo));
    } catch (erreur) {
      if (erreur.code === 'auth/user-not-found') return { pseudo, existant: null };
      throw erreur;
    }
    const profil = (await db.collection('eleves').doc(existant.uid).get()).data() || {};
    const memeEnseignant = profil.enseignant === enseignantUid;
    const memeEleve = pseudoImpose || (profil.nom === eleve.nom && profil.prenom === eleve.prenom);
    if (memeEnseignant && memeEleve) return { pseudo, existant };
    if (pseudoImpose) {
      throw new Error(`Le pseudo "${pseudo}" est deja pris par un autre compte : choisir un autre pseudo dans le fichier.`);
    }
  }
  throw new Error(`Aucun pseudo libre trouve a partir de "${pseudoSouhaite}".`);
}

// Renvoie la liste des comptes crees [{ classe, pseudo, motDePasse, prenom, nom }] (vide si rien de nouveau).
// ecrireCsv: false pour ne pas ecrire comptes-crees-<date>.csv (utilise par comptes-et-etiquettes.js, qui produit
// ses propres fichiers dans un dossier par enseignant).
async function creerComptesEleves(cheminCsv, emailEnseignant, { ecrireCsv = true } = {}) {
  const eleves = lireCsvEleves(cheminCsv);
  const auth = getAuth();
  const db = getFirestore();
  const enseignant = await trouverEnseignant(emailEnseignant);
  const pseudoImpose = eleves.length > 0 && eleves.every((e) => !e.nom && !e.prenom);
  const resultats = [];
  console.log(`Eleves rattaches a l'enseignant : ${enseignant.email}`);

  for (const eleve of eleves) {
    const { classe, prenom, nom } = eleve;
    const { pseudo, existant } = await trouverPseudoLibre(eleve.pseudo, eleve, enseignant.uid, pseudoImpose);
    if (existant) {
      console.log(`Deja existant, ignore : ${pseudo}`);
      continue;
    }

    const motDePasse = genererMotDePasse();
    const utilisateur = await auth.createUser({ email: emailDepuisPseudo(pseudo), password: motDePasse });
    // nom/prenom : optionnels si le CSV n'utilisait que classe,pseudo (pas
    // de vraie identite dans ce cas-la, uniquement le pseudo choisi a la main).
    await db.collection('eleves').doc(utilisateur.uid).set({
      pseudo,
      enseignant: enseignant.uid,
      ...(classe && { classe }),
      ...(nom && { nom }),
      ...(prenom && { prenom }),
      creeLe: FieldValue.serverTimestamp(),
    });

    resultats.push({ classe, pseudo, motDePasse, prenom, nom });
    console.log(`Cree : ${pseudo} (${classe || 'hors classe'})`);
  }

  if (resultats.length === 0) {
    console.log('Aucun nouveau compte a creer.');
    return resultats;
  }
  if (!ecrireCsv) return resultats;

  // Feuille de distribution lisible par l'enseignant, dans ce dossier (jamais
  // commitee : mots de passe en clair).
  const avecIdentite = resultats.every(r => r.nom && r.prenom);
  const horodatage = new Date().toISOString().replace(/[:.]/g, '-');
  fs.mkdirSync(DOSSIER_SORTIE, { recursive: true });
  const cheminSortie = path.join(DOSSIER_SORTIE, `comptes-crees-${horodatage}.csv`);
  // Chaque valeur entre guillemets : garantit qu'un nom compose ("EL SHIKH")
  // reste dans UNE seule colonne a l'ouverture dans Excel, quel que soit le
  // separateur que celui-ci decide d'appliquer (certains reglages regionaux
  // scindent aussi sur l'espace si on ne protege pas le champ).
  const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const contenu = avecIdentite
    ? [[q('Nom'), q('Prenom'), q('Identifiant'), q('MotDePasse')].join(';')]
        .concat(resultats.map(r => [q(r.nom), q(r.prenom), q(r.pseudo), q(r.motDePasse)].join(';')))
        .join('\n')
    : [[q('Classe'), q('Identifiant'), q('MotDePasse')].join(';')]
        .concat(resultats.map(r => [q(r.classe), q(r.pseudo), q(r.motDePasse)].join(';')))
        .join('\n');
  fs.writeFileSync(cheminSortie, contenu, 'utf8');
  console.log(`\n${resultats.length} compte(s) cree(s). Identifiants ecrits dans :\n${cheminSortie}`);
  console.log('A distribuer aux eleves puis a supprimer (mots de passe en clair, jamais commite).');
  return resultats;
}

async function creerOuPromouvoirAdmin(email, motDePasse) {
  const auth = getAuth();
  let utilisateur;
  try {
    utilisateur = await auth.getUserByEmail(email);
    console.log(`Compte existant : ${email}`);
  } catch (erreur) {
    if (erreur.code !== 'auth/user-not-found') throw erreur;
    if (!motDePasse) throw new Error(`Aucun compte pour ${email} : indiquer un mot de passe pour le creer.`);
    utilisateur = await auth.createUser({ email, password: motDePasse });
    console.log(`Compte cree : ${email}`);
  }
  // L'administrateur est aussi enseignant : il a ses propres eleves et devoirs,
  // comme un collegue (champ `enseignant` = son uid).
  await auth.setCustomUserClaims(utilisateur.uid, { admin: true, enseignant: true });
  console.log(`Droits "admin" et "enseignant" accordes a ${email}. Deconnecte-toi puis reconnecte-toi sur le site pour que ca prenne effet.`);
}

// Invitation d'un enseignant (26/10/2026) : cree le compte avec un mot de passe
// aleatoire que personne ne connait, lui accorde le droit "enseignant" (rien
// d'autre), puis affiche un LIEN valable un temps limite grace auquel la
// personne choisit elle-meme son mot de passe. Le lien est a lui envoyer de
// votre part ; il n'est ecrit nulle part. Relancer la commande sur un compte
// existant genere simplement un nouveau lien (mot de passe oublie).
// Cle d'API publique du projet (la meme que assets/js/firebase-config.js : elle designe le projet, ce n'est pas un secret).
const CLE_API_PUBLIQUE = 'AIzaSyAlVsufBIQmPQ2dxfaQ1tPi1JVMNYK5TlI';

// Fait envoyer par Firebase lui-meme le courriel « choisir votre mot de passe » (le meme que « mot de passe oublie »,
// en francais), a l'adresse du compte. Renvoie true si Firebase a accepte l'envoi.
async function envoyerCourrielMotDePasse(adresse) {
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    console.log('MODE TEST : aucun courriel n\'est envoye (emulateur).');
    return false;
  }
  const reponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${CLE_API_PUBLIQUE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Firebase-Locale': 'fr' },
    body: JSON.stringify({ requestType: 'PASSWORD_RESET', email: adresse }),
  });
  if (!reponse.ok) {
    const detail = await reponse.text();
    throw new Error(`Firebase a refuse l'envoi du courriel (${reponse.status}) : ${detail.slice(0, 200)}`);
  }
  return true;
}

async function inviterEnseignant(email, adresseLibre, envoyer) {
  const auth = getAuth();
  const adresse = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adresse) || adresse.endsWith('@cahiers-interactifs.local')) {
    throw new Error(`Adresse e-mail invalide : ${email}`);
  }
  // Par defaut, une adresse academique (@ac-creteil.fr, @ac-paris.fr...) : preuve peu couteuse
  // qu'il s'agit bien d'un enseignant. Autre adresse : decision explicite (--adresse-libre).
  if (!adresseLibre && !/@ac-[a-z-]+\.fr$/.test(adresse)) {
    throw new Error(`${adresse} n'est pas une adresse academique (@ac-xxx.fr). Pour l'accepter quand meme : ajouter --adresse-libre`);
  }
  let utilisateur;
  try {
    utilisateur = await auth.getUserByEmail(adresse);
    console.log(`Compte existant : ${adresse}`);
  } catch (erreur) {
    if (erreur.code !== 'auth/user-not-found') throw erreur;
    utilisateur = await auth.createUser({ email: adresse, password: genererMotDePasse(24) });
    console.log(`Compte cree : ${adresse}`);
  }
  const claims = utilisateur.customClaims || {};
  if (claims.enseignant !== true) await auth.setCustomUserClaims(utilisateur.uid, { ...claims, enseignant: true });
  console.log(`\nDroit "enseignant" accorde a ${adresse}.`);
  if (envoyer && await envoyerCourrielMotDePasse(adresse)) {
    console.log(`Courriel envoye par Firebase a ${adresse} : il y trouve le lien pour choisir son mot de passe (valable environ une heure ; relancer la meme commande pour en envoyer un nouveau).`);
  } else {
    let lien = await auth.generatePasswordResetLink(adresse);
    // Page de choix du mot de passe en francais (le lien porte lang=en par defaut).
    lien = /[?&]lang=/.test(lien) ? lien.replace(/([?&])lang=[^&]*/, '$1lang=fr') : `${lien}&lang=fr`;
    console.log('Lien a envoyer a cette personne pour qu\'elle choisisse son mot de passe (usage unique, duree limitee ; certaines messageries le consomment a l\'ouverture : preferer --envoyer) :\n');
    console.log(lien);
  }
  console.log('\nElle se connectera ensuite sur le site avec son adresse e-mail (page Connexion).');
}

async function main() {
  const [, , commande, arg1, arg2] = process.argv;
  initialiserAdmin();

  if (commande === '--admin') {
    if (!arg1) {
      console.error('Usage : node creer-comptes.js --admin <email> [mot-de-passe]   (mot de passe utile seulement si le compte n\'existe pas encore)');
      process.exit(1);
    }
    await creerOuPromouvoirAdmin(arg1, arg2);
    return;
  }

  if (commande === '--enseignant') {
    if (!arg1) {
      console.error('Usage : node creer-comptes.js --enseignant <email> [--adresse-libre] [--envoyer]');
      process.exit(1);
    }
    await inviterEnseignant(arg1, process.argv.includes('--adresse-libre'), process.argv.includes('--envoyer'));
    return;
  }

  // Eleves : fichier CSV + enseignant obligatoire (--enseignant=<email>), pour
  // ne jamais creer d'eleves rattaches a personne.
  const optionEnseignant = process.argv.slice(2).find((a) => a.startsWith('--enseignant='));
  if (!commande || commande.startsWith('--') || !optionEnseignant) {
    console.error(
      'Usage : node creer-comptes.js <fichier.csv> --enseignant=<email-de-l-enseignant>\n' +
      '   ou : node creer-comptes.js --enseignant <email> [--envoyer]     (inviter un enseignant ; --envoyer = courriel de Firebase)\n' +
      '   ou : node creer-comptes.js --admin <email> [mot-de-passe]'
    );
    process.exit(1);
  }
  await creerComptesEleves(commande, optionEnseignant.slice('--enseignant='.length));
}

// Importable (comptes-et-etiquettes.js) sans lancer la commande.
if (require.main === module) {
  main().catch((erreur) => {
    console.error(erreur);
    process.exit(1);
  });
}

module.exports = { initialiserAdmin, creerComptesEleves, inviterEnseignant, lireCsvEleves };
