'use strict';
// Test de la lecture des listes d'enseignants (adresse en premiere ligne, CSV/Excel), de la verification avant creation et
// du courriel, sur les EMULATEURS Firebase (aucune donnee reelle, aucun courriel envoye). Depuis la racine du depot :
//
//   outils/verification/regles-firestore/node_modules/.bin/firebase emulators:exec --config firebase.test-temp.json \
//     --project demo-cahiers --only auth,firestore "node outils/creer-comptes/test-liste.js"
//
// (firebase.test-temp.json : voir outils/verification/regles-firestore/README.md, avec en plus l'emulateur auth sur le port 9099.)
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { initialiserAdmin, creerComptesEleves } = require('./creer-comptes.js');
const { lireListe } = require('./liste-eleves.js');
const { messageClassesEnLigne, chargerReglages } = require('./courriel.js');

let ok = 0, ko = 0;
function verif(nom, cond, detail) { if (cond) { ok++; console.log('  ok  ', nom); } else { ko++; console.log('  ECHEC', nom, detail === undefined ? '' : JSON.stringify(detail)); } }
async function refuse(nom, motif, fonction) {
  try { await fonction(); ko++; console.log('  ECHEC', nom, '- aurait du echouer'); }
  catch (e) { if (motif.test(e.message)) { ok++; console.log('  ok  ', nom); } else { ko++; console.log('  ECHEC', nom, '-', e.message); } }
}
const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'liste-'));
const ecrire = (nom, contenu) => { const c = path.join(dossier, nom); fs.writeFileSync(c, contenu, 'utf8'); return c; };

(async () => {
  initialiserAdmin();
  const auth = getAuth();
  const db = getFirestore();
  const prof = await auth.createUser({ email: 'marie.dupont@ac-creteil.fr', password: 'xxxxxxxx1' });
  await auth.setCustomUserClaims(prof.uid, { enseignant: true });
  const autre = await auth.createUser({ email: 'paul.martin@ac-creteil.fr', password: 'xxxxxxxx1' });
  await auth.setCustomUserClaims(autre.uid, { enseignant: true });
  await auth.createUser({ email: 'pas.enseignant@ac-creteil.fr', password: 'xxxxxxxx1' });

  console.log('Lecture');
  const nouveau = ecrire('nouveau.csv', '﻿Enseignant;Marie Dupont;Marie.Dupont@AC-Creteil.fr\r\nClasse;Nom;Prénom\r\n2nde-1;Durand;Léa\r\n2nde-1;Durand;Zoé\r\n1ere-Gr 2;Petit;Jean\r\n');
  const l1 = await lireListe(nouveau);
  verif('adresse lue en minuscules', l1.enseignant && l1.enseignant.adresse === 'marie.dupont@ac-creteil.fr', l1.enseignant);
  verif('nom lu', l1.enseignant && l1.enseignant.nom === 'Marie Dupont', l1.enseignant);
  verif('lignes : colonnes + 3 eleves', l1.lignes.length === 4 && l1.lignes[0][0] === 'Classe', l1.lignes);
  const virgules = await lireListe(ecrire('virgules.csv', 'marie@ac-creteil.fr\nClasse,Nom,Prenom\n2nde-1,Durand,Lea\n'));
  verif('adresse seule en premiere ligne, separateur virgule', virgules.enseignant && virgules.enseignant.adresse === 'marie@ac-creteil.fr' && virgules.enseignant.nom === null && virgules.lignes.length === 2, virgules);
  const ancien = ecrire('ancien.csv', 'Classe;Nom;Prénom\n2nde-1;Durand;Léa\n');
  const l2 = await lireListe(ancien);
  verif('ancien fichier : pas d\'enseignant, colonnes en premiere ligne', l2.enseignant === null && l2.lignes[0][0] === 'Classe' && l2.lignes.length === 2, l2);
  const xlsx = process.env.LISTE_XLSX_TEST;
  if (xlsx && fs.existsSync(xlsx)) {
    const l3 = await lireListe(xlsx);
    verif('Excel : adresse, nom et eleves lus', l3.enseignant && l3.enseignant.adresse === 'marie.dupont@ac-creteil.fr' && l3.lignes.length === 4, l3);
  } else console.log('  (essai Excel ignore : LISTE_XLSX_TEST non renseigne)');

  console.log('Verification avant creation');
  const avant = await creerComptesEleves(nouveau, null, { ecrireCsv: false, confirme: false });
  verif('sans confirmation : rien renvoye', avant === null);
  await auth.getUserByEmail('l.durand@cahiers-interactifs.local').then(() => verif('aucun compte cree sans confirmation', false), () => verif('aucun compte cree sans confirmation', true));
  await refuse('adresse du fichier differente de --enseignant', /ne correspond pas/, () => creerComptesEleves(nouveau, 'paul.martin@ac-creteil.fr', { ecrireCsv: false, confirme: true }));
  await refuse('ancien fichier sans --enseignant', /Aucune adresse/, () => creerComptesEleves(ancien, null, { ecrireCsv: false, confirme: true }));
  await refuse('adresse sans compte enseignant', /Aucun compte pour/, () => creerComptesEleves(ecrire('inconnu.csv', 'Enseignant;;inconnu@ac-creteil.fr\nClasse;Nom;Prenom\n2nde-1;A;B\n'), null, { ecrireCsv: false, confirme: true }));
  await refuse('compte qui n\'est pas enseignant', /n'a pas le droit/, () => creerComptesEleves(ecrire('pas.csv', 'pas.enseignant@ac-creteil.fr\nClasse;Nom;Prenom\n2nde-1;A;B\n'), null, { ecrireCsv: false, confirme: true }));

  console.log('Creation');
  const resultats = await creerComptesEleves(nouveau, null, { ecrireCsv: false, confirme: true });
  verif('3 comptes crees', resultats && resultats.length === 3, resultats && resultats.length);
  verif('enseignant du resultat : adresse du compte et nom du fichier', resultats.enseignant.adresse === 'marie.dupont@ac-creteil.fr' && resultats.enseignant.nom === 'Marie Dupont', resultats.enseignant);
  const profils = await db.collection('eleves').where('enseignant', '==', prof.uid).get();
  verif('3 profils rattaches a Marie', profils.size === 1 + 2, profils.size);
  const chezAutre = await db.collection('eleves').where('enseignant', '==', autre.uid).get();
  verif('aucun profil chez l\'autre enseignant', chezAutre.size === 0, chezAutre.size);
  const encore = await creerComptesEleves(nouveau, null, { ecrireCsv: false, confirme: true });
  verif('relance : rien de nouveau', encore.length === 0, encore.length);

  console.log('Courriel');
  const m = messageClassesEnLigne({ nom: 'Marie Dupont', classes: [{ classe: '2nde-1', nombre: 2 }, { classe: '1ere-Gr 2', nombre: 1 }] });
  verif('2 eleves / 1 eleve au bon nombre', m.texte.includes('2nde-1 : 2 élèves') && m.texte.includes('1ere-Gr 2 : 1 élève\n'), m.texte);
  verif('aucun mot de passe ni identifiant dans le courriel', !/mot de passe des|identifiant :|[A-Za-z0-9]{10,}@/.test(m.texte.replace('mot de passe que vous avez choisi', '')) && !resultats.some((r) => m.texte.includes(r.motDePasse)));
  verif('reglages sans fichier : message clair', /absent|renseigne/.test(chargerReglages(path.join(dossier, 'courriel.json')).erreur || chargerReglages(path.join(dossier, 'x.json')).erreur));

  console.log('Commande complete (comptes-et-etiquettes.js, emulateurs)');
  const liste2 = ecrire('classe2.csv', 'Enseignant;Paul Martin;paul.martin@ac-creteil.fr\nClasse;Nom;Prénom\n2nde-9;Leroy;Anne\n2nde-9;Leroy;Bob\n');
  const racine = path.join(dossier, 'sortie');
  const lancer = (...args) => spawnSync(process.execPath, [path.join(__dirname, 'comptes-et-etiquettes.js'), liste2, `--racine=${racine}`, ...args], { encoding: 'utf8', env: process.env });
  const essai = lancer();
  verif('sans --oui : verification affichee, rien cree', /VERIFICATION SEULEMENT/.test(essai.stdout) && /2nde-9 : 2 compte/.test(essai.stdout) && !fs.existsSync(racine), essai.stdout + essai.stderr);
  const reel = lancer('--oui');
  verif('avec --oui : comptes crees et dossier de fichiers', /2 compte\(s\) cree\(s\) pour paul.martin@ac-creteil.fr/.test(reel.stdout) && fs.existsSync(path.join(racine, 'paul.martin@ac-creteil.fr')), reel.stdout + reel.stderr);
  verif('en test, le courriel est affiche et non envoye', /MODE TEST : courriel non envoye a paul.martin@ac-creteil.fr/.test(reel.stdout) && /Bonjour Paul Martin,/.test(reel.stdout) && /2nde-9 : 2 élèves/.test(reel.stdout), reel.stdout);
  verif('la sortie du courriel ne contient aucun mot de passe', !/MotDePasse/.test(reel.stdout));
  const profPaul = await db.collection('eleves').where('enseignant', '==', autre.uid).get();
  verif('les 2 eleves sont rattaches a Paul', profPaul.size === 2, profPaul.size);

  fs.rmSync(dossier, { recursive: true, force: true });
  console.log(`\n${ok} reussis, ${ko} echecs`);
  process.exit(ko ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
