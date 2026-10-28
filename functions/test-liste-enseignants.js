'use strict';
// Test de la liste des collegues sur les emulateurs (demarrer d'abord les emulateurs Auth et Firestore, par exemple
// avec node outils/test-local/lancer.js, puis : node test-liste-enseignants.js). Il cree ses propres comptes fictifs.
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { listerEnseignants } = require('./liste-enseignants');
initializeApp({ projectId: 'demo-cahiers' });
const auth = getAuth();
const db = getFirestore();
let ok = 0, ko = 0;
function verif(nom, cond, detail) { if (cond) { ok++; console.log('  ok  ', nom); } else { ko++; console.log('  ECHEC', nom, detail === undefined ? '' : JSON.stringify(detail)); } }

(async () => {
  const admin = await auth.createUser({ email: 'admin.liste@exemple.test', password: 'xxxxxxxx1' });
  await auth.setCustomUserClaims(admin.uid, { admin: true, enseignant: true });
  const marie = await auth.createUser({ email: 'marie.liste@exemple.test', password: 'xxxxxxxx1' });
  await auth.setCustomUserClaims(marie.uid, { enseignant: true });
  const paul = await auth.createUser({ email: 'paul.liste@exemple.test', password: 'xxxxxxxx1' });
  await auth.setCustomUserClaims(paul.uid, { enseignant: true });
  const vide = await auth.createUser({ email: 'vide.liste@exemple.test', password: 'xxxxxxxx1' });
  await auth.setCustomUserClaims(vide.uid, { enseignant: true });
  await auth.createUser({ email: 'eleve.liste@cahiers-interactifs.local', password: 'xxxxxxxx1' });   // compte eleve : pas de droit

  const profil = (enseignant, classe, n) => db.collection('eleves').doc(`liste-${enseignant}-${n}`).set({ pseudo: `p${n}`, nom: 'SECRET', prenom: 'Eleve', ...(classe === undefined ? {} : { classe }), enseignant });
  await profil(marie.uid, '2nde-1', 1); await profil(marie.uid, '2nde-1', 2); await profil(marie.uid, '2nde-2', 3);
  await profil(marie.uid, undefined, 4);                   // eleve hors classe : compte comme eleve, pas comme classe
  await profil(marie.uid, '  ', 5);                       // classe vide : idem
  await profil(paul.uid, '2nde-1', 6);                    // meme nom de classe chez un autre enseignant : compte pour lui seul
  await profil(admin.uid, '1ere-A', 7);                   // eleve de l'administrateur : ne figure nulle part

  const { enseignants } = await listerEnseignants(auth, db);
  const adresses = enseignants.map((e) => e.adresse).filter((a) => a.endsWith('.liste@exemple.test')).sort();     // l'environnement de test local ajoute aussi collegue@exemple.test
  verif('3 collegues listes (ni l\'administrateur ni les eleves)', JSON.stringify(adresses) === JSON.stringify(['marie.liste@exemple.test', 'paul.liste@exemple.test', 'vide.liste@exemple.test']), adresses);
  const m = enseignants.find((e) => e.adresse === 'marie.liste@exemple.test');
  verif('Marie : 5 eleves, 2 classes', m && m.eleves === 5 && m.classes === 2, m);
  const p = enseignants.find((e) => e.adresse === 'paul.liste@exemple.test');
  verif('Paul : 1 eleve, 1 classe', p && p.eleves === 1 && p.classes === 1, p);
  const v = enseignants.find((e) => e.adresse === 'vide.liste@exemple.test');
  verif('collegue sans eleve : 0 et 0', v && v.eleves === 0 && v.classes === 0, v);
  verif('date d\'invitation valide', m && !Number.isNaN(Date.parse(m.creeLe)), m);
  verif('jamais connecte : derniereConnexion nulle', m && m.derniereConnexion === null, m);
  const texte = JSON.stringify(enseignants);
  verif('aucun nom ni prenom d\'eleve dans la reponse', !/SECRET|Eleve|\bp[1-7]\b/.test(texte), texte);
  verif('seulement les champs prevus', enseignants.every((e) => JSON.stringify(Object.keys(e).sort()) === JSON.stringify(['adresse', 'classes', 'creeLe', 'derniereConnexion', 'eleves'])), Object.keys(enseignants[0] || {}));

  // Une vraie connexion plus tard : la date doit apparaitre (l'emulateur horodate la connexion).
  await new Promise((r) => setTimeout(r, 6000));
  const jeton = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=cle`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'paul.liste@exemple.test', password: 'xxxxxxxx1', returnSecureToken: true }),
  });
  verif('connexion de Paul acceptee par l\'emulateur', jeton.ok);
  const apres = (await listerEnseignants(auth, db)).enseignants.find((e) => e.adresse === 'paul.liste@exemple.test');
  verif('apres connexion : derniere connexion renseignee', apres && apres.derniereConnexion && Date.parse(apres.derniereConnexion) > Date.parse(apres.creeLe), apres);
  const marie2 = (await listerEnseignants(auth, db)).enseignants.find((e) => e.adresse === 'marie.liste@exemple.test');
  verif('Marie reste « jamais connectee »', marie2 && marie2.derniereConnexion === null, marie2);

  console.log(`\n${ok} reussis, ${ko} echecs`);
  process.exit(ko ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
