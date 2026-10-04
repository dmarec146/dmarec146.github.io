import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, collection, deleteDoc, updateDoc, increment, deleteField, serverTimestamp } from 'firebase/firestore';
import { readFileSync } from 'fs';

const env = await initializeTestEnvironment({
  projectId: 'demo-cahiers',
  firestore: { rules: readFileSync(new URL('../../../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
});
const anonyme = env.unauthenticatedContext().firestore();
const eleve = env.authenticatedContext('eleve1').firestore();
const prof = env.authenticatedContext('prof', { admin: true }).firestore();
const ID = '2026-10-03_2';
let ok = 0, ko = 0;
async function cas(nom, attendu, promesse) {
  try { await (attendu ? assertSucceeds(promesse) : assertFails(promesse)); ok++; console.log('  ok  ', nom); }
  catch (e) { ko++; console.log('  ECHEC', nom, '-', e.message.split('\n')[0]); }
}
const pageVue = (page, extra = {}) => ({ pv: increment(1), s_fiches_premiere: increment(1), pages: { [page]: increment(1) }, derniere: page, ...extra });

console.log('Création');
await cas('anonyme : création valide (comme le script)', true, setDoc(doc(anonyme, 'statistiques', ID), pageVue('premiere-f14', { visites: increment(1), visiteurs: increment(1), a_ordinateur: increment(1) }), { merge: true }));
await cas('identifiant de document invalide', false, setDoc(doc(anonyme, 'statistiques', 'nimportequoi'), pageVue('premiere-f14'), { merge: true }));
await cas('fragment hors 0-4', false, setDoc(doc(anonyme, 'statistiques', '2026-10-03_7'), pageVue('premiere-f14'), { merge: true }));
await cas('création avec pv = 5', false, setDoc(doc(anonyme, 'statistiques', '2026-10-04_0'), { pv: 5, pages: { accueil: 1 }, derniere: 'accueil' }));
await cas('création avec une clé inconnue', false, setDoc(doc(anonyme, 'statistiques', '2026-10-04_0'), { pv: 1, pages: { accueil: 1 }, derniere: 'accueil', pirate: 1 }));
await cas('création avec deux pages', false, setDoc(doc(anonyme, 'statistiques', '2026-10-04_0'), { pv: 1, pages: { accueil: 1, connexion: 1 }, derniere: 'accueil' }));
await cas('création : derniere ne correspond pas', false, setDoc(doc(anonyme, 'statistiques', '2026-10-04_0'), { pv: 1, pages: { accueil: 1 }, derniere: 'connexion' }));
await cas('création : clé de page invalide', false, setDoc(doc(anonyme, 'statistiques', '2026-10-04_0'), { pv: 1, pages: { 'A/B': 1 }, derniere: 'A/B' }));

console.log('Mise à jour');
await cas('anonyme : page vue suivante, même page', true, setDoc(doc(anonyme, 'statistiques', ID), pageVue('premiere-f14'), { merge: true }));
await cas('élève connecté : autre page, nouvelle visite', true, setDoc(doc(eleve, 'statistiques', ID), pageVue('seconde-f3', { visites: increment(1), a_telephone: increment(1) }), { merge: true }));
await cas('pv +2', false, setDoc(doc(anonyme, 'statistiques', ID), { pv: increment(2), pages: { 'premiere-f14': increment(1) }, derniere: 'premiere-f14' }, { merge: true }));
await cas('visites +5', false, setDoc(doc(anonyme, 'statistiques', ID), pageVue('premiere-f14', { visites: increment(5) }), { merge: true }));
await cas('baisse d\'un compteur', false, setDoc(doc(anonyme, 'statistiques', ID), pageVue('premiere-f14', { visiteurs: increment(-1) }), { merge: true }));
await cas('+1 sur une page sans compter de page vue', false, setDoc(doc(anonyme, 'statistiques', ID), { pages: { 'premiere-f14': increment(1) }, derniere: 'premiere-f14' }, { merge: true }));
await cas('+1 sur une autre page que derniere', false, setDoc(doc(anonyme, 'statistiques', ID), { pv: increment(1), pages: { 'seconde-f3': increment(1) }, derniere: 'premiere-f14' }, { merge: true }));
await cas('deux pages à la fois', false, setDoc(doc(anonyme, 'statistiques', ID), { pv: increment(1), pages: { 'premiere-f14': increment(1), 'seconde-f3': increment(1) }, derniere: 'premiere-f14' }, { merge: true }));
await cas('remise à zéro d\'une page', false, setDoc(doc(anonyme, 'statistiques', ID), { pv: increment(1), pages: { 'seconde-f3': 0, 'premiere-f14': increment(1) }, derniere: 'premiere-f14' }, { merge: true }));
await cas('suppression d\'une page', false, updateDoc(doc(anonyme, 'statistiques', ID), { pv: increment(1), 'pages.seconde-f3': deleteField(), derniere: 'premiere-f14', 'pages.premiere-f14': increment(1) }));
await cas('clé inconnue ajoutée', false, setDoc(doc(anonyme, 'statistiques', ID), pageVue('premiere-f14', { pirate: 1 }), { merge: true }));
await cas('écrasement complet du document', false, setDoc(doc(anonyme, 'statistiques', ID), { pv: 1, pages: { accueil: 1 }, derniere: 'accueil' }));

console.log('Lecture et suppression');
await cas('anonyme : lecture refusée', false, getDoc(doc(anonyme, 'statistiques', ID)));
await cas('élève : lecture refusée', false, getDoc(doc(eleve, 'statistiques', ID)));
await cas('élève : liste refusée', false, getDocs(collection(eleve, 'statistiques')));
await cas('enseignant : lecture', true, getDoc(doc(prof, 'statistiques', ID)));
await cas('enseignant : liste', true, getDocs(collection(prof, 'statistiques')));
await cas('anonyme : suppression refusée', false, deleteDoc(doc(anonyme, 'statistiques', ID)));

const final = (await getDoc(doc(prof, 'statistiques', ID))).data();
console.log('Document final :', JSON.stringify(final));
const attendu = { pv: 3, visites: 2, visiteurs: 1, a_ordinateur: 1, a_telephone: 1, s_fiches_premiere: 3 };
for (const [k, v] of Object.entries(attendu)) if (final[k] !== v) { ko++; console.log('  ECHEC valeur', k, final[k], '≠', v); }
if (final.pages['premiere-f14'] !== 2 || final.pages['seconde-f3'] !== 1) { ko++; console.log('  ECHEC pages', JSON.stringify(final.pages)); }

console.log('Règles existantes (non-régression)');
await cas('élève : écrit son brouillon', true, setDoc(doc(eleve, 'eleves/eleve1/brouillons/f1'), { a: 1 }));
await cas('élève : ne lit pas les brouillons d\'un autre', false, getDoc(doc(eleve, 'eleves/autre/brouillons/f1')));
await cas('anonyme : ne lit pas les devoirs', false, getDoc(doc(anonyme, 'devoirs/d1')));

console.log('Devoirs retirés de la liste de l\'élève (devoirsMasques)');
const eleve2 = env.authenticatedContext('eleve2').firestore();
const cheminMasque = (u, d) => `eleves/${u}/devoirsMasques/${d}`;
await cas('élève : marque un devoir comme retiré', true, setDoc(doc(eleve, cheminMasque('eleve1', 'dev1')), { masqueLe: serverTimestamp() }));
await cas('élève : relit son marqueur', true, getDoc(doc(eleve, cheminMasque('eleve1', 'dev1'))));
await cas('élève : liste ses marqueurs', true, getDocs(collection(eleve, 'eleves/eleve1/devoirsMasques')));
await cas('élève : rétablit (supprime) son marqueur', true, deleteDoc(doc(eleve, cheminMasque('eleve1', 'dev1'))));
await cas('élève : marqueur chez un autre élève refusé', false, setDoc(doc(eleve, cheminMasque('eleve2', 'dev1')), { masqueLe: serverTimestamp() }));
await cas('élève : ne lit pas les marqueurs d\'un autre', false, getDoc(doc(eleve, cheminMasque('eleve2', 'dev1'))));
await cas('élève : marqueur avec un champ en plus refusé', false, setDoc(doc(eleve, cheminMasque('eleve1', 'dev2')), { masqueLe: serverTimestamp(), autre: 1 }));
await cas('élève : marqueur avec une date falsifiée refusé', false, setDoc(doc(eleve, cheminMasque('eleve1', 'dev2')), { masqueLe: new Date('2020-01-01') }));
await cas('élève : marqueur vide refusé', false, setDoc(doc(eleve, cheminMasque('eleve1', 'dev2')), {}));
await cas('anonyme : marqueur refusé', false, setDoc(doc(anonyme, cheminMasque('eleve1', 'dev3')), { masqueLe: serverTimestamp() }));
await cas('enseignant : lit un marqueur', true, getDoc(doc(prof, cheminMasque('eleve1', 'dev1'))));
await setDoc(doc(eleve, cheminMasque('eleve1', 'dev4')), { masqueLe: serverTimestamp() });
await cas('élève : modification d\'un marqueur refusée', false, updateDoc(doc(eleve, cheminMasque('eleve1', 'dev4')), { masqueLe: serverTimestamp() }));
await cas('enseignant : supprime un marqueur', true, deleteDoc(doc(prof, cheminMasque('eleve1', 'dev4'))));
console.log('Les tentatives restent intactes (le retrait n\'est qu\'un masquage)');
await cas('élève : ne supprime pas une tentative de devoir', false, deleteDoc(doc(eleve, 'eleves/eleve1/devoirsTentatives/t1')));
await cas('élève : ne modifie pas un devoir', false, setDoc(doc(eleve, 'devoirs/dev1'), { titre: 'x' }));
await cas('élève : ne supprime pas un devoir', false, deleteDoc(doc(eleve, 'devoirs/dev1')));

console.log(`\n${ok} réussis, ${ko} échecs`);
await env.cleanup();
process.exit(ko ? 1 : 0);
