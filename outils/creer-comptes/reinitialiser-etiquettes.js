#!/usr/bin/env node
'use strict';

// Nouveaux mots de passe + nouvelles etiquettes pour une classe dont les etiquettes n'ont PAS ete distribuees (04/11/2026,
// demande de David : refaire les etiquettes de Terminale avec la nouvelle adresse du site). Les mots de passe sont chiffres dans
// Firebase et les fichiers d'identifiants ont ete supprimes : la seule facon de refaire des etiquettes est de REINITIALISER les
// mots de passe, ce qui rend les anciennes etiquettes inutilisables.
//
//   node reinitialiser-etiquettes.js "<classe>" [--enseignant=<email>] [--oui] [--forcer] [--racine=<dossier>] [--site=<adresse>]
//
// SANS --oui : simulation (liste les eleves et dit si l'un d'eux s'est deja connecte), rien n'est modifie.
// GARDE-FOU : refuse si un eleve de la classe s'est DEJA connecte (il utilise son mot de passe : le changer le bloquerait) ;
// --forcer pour passer outre en connaissance de cause. Refuse aussi si la classe existe chez plusieurs enseignants sans
// --enseignant. Produit le meme dossier que comptes-et-etiquettes.js (voir fabriquer-fichiers.js).

const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { initialiserAdmin, genererMotDePasse } = require('./creer-comptes.js');
const { fabriquerFichiers, etiquettesInstallees, DOSSIER_ETIQUETTES } = require('./fabriquer-fichiers.js');

const args = process.argv.slice(2);
const valeur = (nom) => { const a = args.find((x) => x.startsWith(nom + '=')); return a ? a.slice(nom.length + 1) : null; };
const classe = args.find((a) => !a.startsWith('--'));
if (!classe) {
  console.error('Usage : node reinitialiser-etiquettes.js "<classe>" [--enseignant=<email>] [--oui] [--forcer] [--racine=<dossier>] [--site=<adresse>]');
  process.exit(1);
}
if (!etiquettesInstallees()) {
  console.error(`Les etiquettes ne sont pas installees : lancer \`npm install\` dans ${DOSSIER_ETIQUETTES}`);
  process.exit(1);
}

// Un compte qui n'a jamais servi : pas de connexion, ou une connexion a moins de 5 s de la creation (comptes crees par le serveur).
function dejaConnecte(utilisateur) {
  const creation = Date.parse(utilisateur.metadata.creationTime);
  const derniere = utilisateur.metadata.lastSignInTime ? Date.parse(utilisateur.metadata.lastSignInTime) : 0;
  return Boolean(derniere) && Math.abs(derniere - creation) > 5000;
}

async function main() {
  initialiserAdmin();
  const auth = getAuth();
  const db = getFirestore();

  let profils = (await db.collection('eleves').where('classe', '==', classe).get()).docs;
  if (!profils.length) throw new Error(`Aucun eleve dans la classe "${classe}".`);
  const emailDemande = (valeur('--enseignant') || '').trim().toLowerCase();
  if (emailDemande) {
    const ens = await auth.getUserByEmail(emailDemande);
    profils = profils.filter((p) => p.data().enseignant === ens.uid);
    if (!profils.length) throw new Error(`Aucun eleve de la classe "${classe}" chez ${emailDemande}.`);
  }
  const enseignants = [...new Set(profils.map((p) => p.data().enseignant))];
  if (enseignants.length !== 1 || !enseignants[0]) {
    throw new Error(`La classe "${classe}" concerne ${enseignants.length} enseignant(s) : preciser --enseignant=<email> (un seul enseignant, avec le droit enseignant).`);
  }
  const enseignant = await auth.getUser(enseignants[0]);
  const adresseEnseignant = (enseignant.email || '').toLowerCase();
  if (!adresseEnseignant) throw new Error("L'enseignant n'a pas d'adresse e-mail.");

  const eleves = [];
  for (const p of profils) {
    const donnees = p.data();
    const utilisateur = await auth.getUser(p.id);
    eleves.push({ uid: p.id, pseudo: donnees.pseudo, nom: donnees.nom, prenom: donnees.prenom, classe, connecte: dejaConnecte(utilisateur) });
  }
  eleves.sort((a, b) => String(a.nom).localeCompare(String(b.nom)));
  const connectes = eleves.filter((e) => e.connecte);

  console.log(`Classe "${classe}" de ${adresseEnseignant} : ${eleves.length} eleve(s) ; deja connecte(s) : ${connectes.length}.`);
  for (const e of eleves) console.log(`  ${e.pseudo}${e.connecte ? '   <-- S\'EST DEJA CONNECTE' : ''}`);
  if (connectes.length && !args.includes('--forcer')) {
    throw new Error(`${connectes.length} eleve(s) se sont deja connectes avec leur mot de passe actuel : rien n'est modifie. (--forcer pour passer outre, en les prevenant.)`);
  }
  if (!args.includes('--oui')) {
    console.log('\nSIMULATION : aucun mot de passe change. Relancer avec --oui pour reinitialiser les mots de passe et produire les nouvelles etiquettes\n(les anciennes etiquettes deviendront inutilisables).');
    return;
  }

  // Mots de passe changes un par un ; les fichiers sont fabriques pour ceux qui ont reussi, meme en cas d'erreur en cours de route.
  const resultats = [];
  let erreurEnCours = null;
  for (const e of eleves) {
    try {
      const motDePasse = genererMotDePasse();
      await auth.updateUser(e.uid, { password: motDePasse });
      resultats.push({ classe: e.classe, pseudo: e.pseudo, motDePasse, prenom: e.prenom, nom: e.nom });
    } catch (erreur) {
      erreurEnCours = erreur;
      console.error(`Echec pour ${e.pseudo} : ${erreur.message}`);
      break;
    }
  }
  if (resultats.length) {
    const dossier = fabriquerFichiers(resultats, {
      adresseEnseignant, racine: valeur('--racine'), site: valeur('--site'), intitule: 'Mots de passe reinitialises et etiquettes refaites',
    });
    console.log(`\n${resultats.length} mot(s) de passe reinitialise(s) sur ${eleves.length}.\nFichiers dans : ${dossier}`);
  }
  if (erreurEnCours) throw new Error(`Interrompu apres ${resultats.length}/${eleves.length} eleve(s) : relancer la commande (les eleves deja traites seront de nouveau reinitialises, ce qui est sans danger tant que les etiquettes ne sont pas distribuees).`);
}

main().catch((erreur) => { console.error(erreur.message || erreur); process.exit(1); });
