'use strict';
// Test de la logique d'invitation sur les emulateurs (node outils/test-local/lancer.js d'abord, puis : node test-invitation.js).
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { inviter } = require('./invitation');
initializeApp({ projectId: 'demo-cahiers' });
const auth = getAuth();
let ok = 0, ko = 0;
const envois = [];
const envoyerCourriel = async (adresse) => { envois.push(adresse); };
async function cas(nom, attendu, fonction) {
  try {
    const r = await fonction();
    if (attendu === 'ok') { ok++; console.log('  ok  ', nom); return r; }
    ko++; console.log('  ECHEC', nom, '- aurait du echouer avec', attendu);
  } catch (e) {
    if (attendu !== 'ok' && e.code === attendu) { ok++; console.log('  ok  ', nom, `(${e.code})`); }
    else { ko++; console.log('  ECHEC', nom, '-', e.code || '', e.message); }
  }
}
(async () => {
  await auth.createUser({ email: 'admin.test@exemple.test', password: 'xxxxxxxx1' }).then((u) => auth.setCustomUserClaims(u.uid, { admin: true, enseignant: true }));
  await cas('adresse vide', 'invalid-argument', () => inviter(auth, { email: '' }, { envoyerCourriel }));
  await cas('adresse sans arobase', 'invalid-argument', () => inviter(auth, { email: 'dupont' }, { envoyerCourriel }));
  await cas('adresse d\'eleve (.local) refusee', 'invalid-argument', () => inviter(auth, { email: 'h.mrc@cahiers-interactifs.local', exception: true }, { envoyerCourriel }));
  await cas('adresse non academique refusee sans exception', 'invalid-argument', () => inviter(auth, { email: 'collegue@gmail.com' }, { envoyerCourriel }));
  const aucun = envois.length === 0; if (aucun) { ok++; console.log('  ok   aucun courriel envoye pour les refus'); } else { ko++; console.log('  ECHEC des courriels sont partis pour des refus'); }
  const r1 = await cas('adresse academique acceptee', 'ok', () => inviter(auth, { email: '  Marie.Dupont@AC-Creteil.fr ' }, { envoyerCourriel }));
  if (r1 && r1.nouveauCompte === true && r1.adresse === 'marie.dupont@ac-creteil.fr') { ok++; console.log('  ok   compte cree, adresse normalisee en minuscules'); } else { ko++; console.log('  ECHEC reponse', JSON.stringify(r1)); }
  const u1 = await auth.getUserByEmail('marie.dupont@ac-creteil.fr');
  if (u1.customClaims && u1.customClaims.enseignant === true && !u1.customClaims.admin) { ok++; console.log('  ok   droit enseignant seulement (pas admin)'); } else { ko++; console.log('  ECHEC droits', JSON.stringify(u1.customClaims)); }
  const r2 = await cas('relance sur le meme compte', 'ok', () => inviter(auth, { email: 'marie.dupont@ac-creteil.fr' }, { envoyerCourriel }));
  if (r2 && r2.nouveauCompte === false) { ok++; console.log('  ok   pas de nouveau compte a la relance'); } else { ko++; console.log('  ECHEC relance', JSON.stringify(r2)); }
  await cas('exception acceptee pour une adresse non academique', 'ok', () => inviter(auth, { email: 'collegue@gmail.com', exception: true }, { envoyerCourriel }));
  await cas('compte administrateur refuse', 'failed-precondition', () => inviter(auth, { email: 'admin.test@exemple.test', exception: true }, { envoyerCourriel }));
  const attendus = ['marie.dupont@ac-creteil.fr', 'marie.dupont@ac-creteil.fr', 'collegue@gmail.com'];
  if (JSON.stringify(envois) === JSON.stringify(attendus)) { ok++; console.log('  ok   courriels envoyes : exactement 3, aux bonnes adresses'); } else { ko++; console.log('  ECHEC courriels', JSON.stringify(envois)); }
  console.log(`\n${ok} reussis, ${ko} echecs`);
  process.exit(ko ? 1 : 0);
})();
