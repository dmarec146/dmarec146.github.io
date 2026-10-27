import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, collection, query, where, deleteDoc, updateDoc, increment, deleteField, serverTimestamp } from 'firebase/firestore';
import { readFileSync } from 'fs';

const env = await initializeTestEnvironment({
  projectId: 'demo-cahiers',
  firestore: { rules: readFileSync(new URL('../../../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
});
const anonyme = env.unauthenticatedContext().firestore();
const eleve = env.authenticatedContext('eleve1').firestore();
const prof = env.authenticatedContext('prof', { admin: true, enseignant: true }).firestore();
// Depuis le 27/10/2026, le droit admin ne donne plus acces aux eleves : prof lit eleve1 en tant que SON enseignant.
await env.withSecurityRulesDisabled(async (ctx) => { await setDoc(doc(ctx.firestore(), 'eleves/eleve1'), { pseudo: 'e1', enseignant: 'prof' }); });
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

console.log('Partie « QCM Bac » (s_qcm_bac, 18/10/2026)');
const ID_QCM = '2026-10-18_1';
const pageQcm = (page, extra = {}) => ({ pv: increment(1), s_qcm_bac: increment(1), pages: { [page]: increment(1) }, derniere: page, ...extra });
await cas('QCM Bac : création valide (anonyme)', true, setDoc(doc(anonyme, 'statistiques', ID_QCM), pageQcm('qcm-bac-fiche', { visites: increment(1), a_telephone: increment(1) }), { merge: true }));
await cas('QCM Bac : page vue suivante (anonyme)', true, setDoc(doc(anonyme, 'statistiques', ID_QCM), pageQcm('qcm-bac'), { merge: true }));
await cas('QCM Bac : élève connecté', true, setDoc(doc(eleve, 'statistiques', ID_QCM), pageQcm('qcm-bac-sujet-blanc'), { merge: true }));
await cas('QCM Bac : s_qcm_bac +2', false, setDoc(doc(anonyme, 'statistiques', ID_QCM), pageQcm('qcm-bac', { s_qcm_bac: increment(2) }), { merge: true }));
await cas('QCM Bac : baisse du compteur', false, setDoc(doc(anonyme, 'statistiques', ID_QCM), pageQcm('qcm-bac', { s_qcm_bac: increment(-1) }), { merge: true }));
await cas('QCM Bac : création avec s_qcm_bac = 5', false, setDoc(doc(anonyme, 'statistiques', '2026-10-18_2'), { pv: 1, s_qcm_bac: 5, pages: { 'qcm-bac': 1 }, derniere: 'qcm-bac' }));
await cas('QCM Bac : une autre partie inconnue reste refusée', false, setDoc(doc(anonyme, 'statistiques', ID_QCM), pageQcm('qcm-bac', { s_pirate: increment(1) }), { merge: true }));
await cas('QCM Bac : lecture refusée à l\'anonyme', false, getDoc(doc(anonyme, 'statistiques', ID_QCM)));

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

console.log('Plusieurs enseignants (26/10/2026) : chacun ne voit que ses élèves et ses devoirs');
await env.withSecurityRulesDisabled(async (ctx) => {
  const d = ctx.firestore();
  await setDoc(doc(d, 'eleves/eA1'), { pseudo: 'a1', classe: '2nde1', enseignant: 'profA' });
  await setDoc(doc(d, 'eleves/eA2'), { pseudo: 'a2', classe: '2nde2', enseignant: 'profA' });
  await setDoc(doc(d, 'eleves/eB1'), { pseudo: 'b1', classe: '2nde1', enseignant: 'profB' });
  await setDoc(doc(d, 'eleves/eL'), { pseudo: 'legacy', classe: '2nde1' });
  for (const [e, t] of [['eA1', 'tA1'], ['eA1', 'tA1bis'], ['eB1', 'tB1'], ['eL', 'tL']]) {
    await setDoc(doc(d, `eleves/${e}/devoirsTentatives/${t}`), { devoirId: 'dA', score: 3 });
    await setDoc(doc(d, `eleves/${e}/connexions/${t}`), { a: 1 });
    await setDoc(doc(d, `eleves/${e}/brouillons/${t}`), { a: 1 });
  }
  await setDoc(doc(d, 'devoirs/dA'), { titre: 'A', classe: '2nde1', enseignant: 'profA' });
  await setDoc(doc(d, 'devoirs/dA2'), { titre: 'A2', classe: '2nde1', enseignant: 'profA' });
  await setDoc(doc(d, 'devoirs/dB'), { titre: 'B', classe: '2nde1', enseignant: 'profB' });
  await setDoc(doc(d, 'devoirs/dL'), { titre: 'legacy', classe: '2nde1' });
  await setDoc(doc(d, 'eleves/eD1'), { pseudo: 'd1', classe: '2nde3', enseignant: 'david' });
  await setDoc(doc(d, 'eleves/eD1/devoirsTentatives/tD1'), { devoirId: 'dD', score: 2 });
  await setDoc(doc(d, 'devoirs/dD'), { titre: 'D', classe: '2nde3', enseignant: 'david' });
  await setDoc(doc(d, 'devoirs/dD2'), { titre: 'D2', classe: '2nde3', enseignant: 'david' });
});
const profA = env.authenticatedContext('profA', { enseignant: true }).firestore();
const profB = env.authenticatedContext('profB', { enseignant: true }).firestore();
const david = env.authenticatedContext('david', { admin: true, enseignant: true }).firestore();
const eA1 = env.authenticatedContext('eA1').firestore();
const simpleCompte = env.authenticatedContext('quelquun').firestore();

console.log('  Profils élèves');
await cas('enseignant A : lit le profil de son élève', true, getDoc(doc(profA, 'eleves/eA1')));
await cas('enseignant A : ne lit pas le profil d\'un élève de B', false, getDoc(doc(profA, 'eleves/eB1')));
await cas('enseignant A : ne lit pas un profil sans enseignant', false, getDoc(doc(profA, 'eleves/eL')));
await cas('enseignant A : liste ses élèves (where enseignant)', true, getDocs(query(collection(profA, 'eleves'), where('enseignant', '==', profA_uid()))));
await cas('enseignant A : liste ses élèves d\'une classe', true, getDocs(query(collection(profA, 'eleves'), where('enseignant', '==', profA_uid()), where('classe', '==', '2nde1'))));
await cas('enseignant A : liste de TOUS les élèves refusée', false, getDocs(collection(profA, 'eleves')));
await cas('enseignant A : liste des élèves de B refusée', false, getDocs(query(collection(profA, 'eleves'), where('enseignant', '==', 'profB'))));
await cas('enseignant A : liste par classe seule refusée', false, getDocs(query(collection(profA, 'eleves'), where('classe', '==', '2nde1'))));
await cas('enseignant A : n\'écrit pas un profil', false, setDoc(doc(profA, 'eleves/eA1'), { pseudo: 'x', enseignant: 'profA' }));
await cas('enseignant A : ne crée pas de profil', false, setDoc(doc(profA, 'eleves/nouveau'), { pseudo: 'x', enseignant: 'profA' }));
await cas('enseignant A : ne s\'attribue pas l\'élève de B', false, updateDoc(doc(profA, 'eleves/eB1'), { enseignant: 'profA' }));
await cas('enseignant A : lit son propre uid (compte sans profil)', true, getDoc(doc(profA, 'eleves/profA')));
await cas('élève : ne s\'attribue pas à un enseignant', false, updateDoc(doc(eA1, 'eleves/eA1'), { enseignant: 'profB' }));
await cas('compte sans droit : ne lit pas un profil', false, getDoc(doc(simpleCompte, 'eleves/eA1')));
await cas('compte sans droit : ne liste pas les élèves', false, getDocs(collection(simpleCompte, 'eleves')));

console.log('  Journaux et brouillons de ses élèves');
await cas('enseignant A : lit les tentatives de devoir de son élève', true, getDocs(query(collection(profA, 'eleves/eA1/devoirsTentatives'), where('devoirId', '==', 'dA'))));
await cas('enseignant A : lit tout le journal de son élève', true, getDocs(collection(profA, 'eleves/eA1/devoirsTentatives')));
await cas('enseignant A : ne lit pas les tentatives d\'un élève de B', false, getDocs(collection(profA, 'eleves/eB1/devoirsTentatives')));
await cas('enseignant A : ne lit pas une tentative d\'un élève de B', false, getDoc(doc(profA, 'eleves/eB1/devoirsTentatives/tB1')));
await cas('enseignant A : ne lit pas les tentatives d\'un élève sans enseignant', false, getDocs(collection(profA, 'eleves/eL/devoirsTentatives')));
await cas('enseignant A : lit les connexions de son élève', true, getDocs(collection(profA, 'eleves/eA1/connexions')));
await cas('enseignant A : ne lit pas les connexions d\'un élève de B', false, getDocs(collection(profA, 'eleves/eB1/connexions')));
await cas('enseignant A : lit les brouillons de son élève', true, getDocs(collection(profA, 'eleves/eA1/brouillons')));
await cas('enseignant A : ne lit pas les brouillons d\'un élève de B', false, getDocs(collection(profA, 'eleves/eB1/brouillons')));
await cas('enseignant A : n\'écrit pas dans le brouillon de son élève', false, setDoc(doc(profA, 'eleves/eA1/brouillons/x'), { a: 1 }));
await cas('enseignant A : n\'ajoute pas de tentative à son élève', false, setDoc(doc(profA, 'eleves/eA1/devoirsTentatives/faux'), { devoirId: 'dA', score: 99 }));
await cas('enseignant A : ne modifie pas une tentative', false, updateDoc(doc(profA, 'eleves/eA1/devoirsTentatives/tA1'), { score: 99 }));
await cas('enseignant B : ne supprime pas une tentative d\'un élève de A', false, deleteDoc(doc(profB, 'eleves/eA1/devoirsTentatives/tA1')));
await cas('enseignant A : supprime une tentative de son élève', true, deleteDoc(doc(profA, 'eleves/eA1/devoirsTentatives/tA1')));
await cas('enseignant A : ne supprime pas une tentative d\'un élève de B', false, deleteDoc(doc(profA, 'eleves/eB1/devoirsTentatives/tB1')));
await cas('élève : lit toujours ses propres tentatives', true, getDocs(collection(eA1, 'eleves/eA1/devoirsTentatives')));
await cas('élève : ajoute toujours sa tentative', true, setDoc(doc(eA1, 'eleves/eA1/devoirsTentatives/nouv'), { devoirId: 'dA', score: 1 }));

console.log('  Devoirs');
await cas('enseignant A : crée un devoir à son nom', true, setDoc(doc(profA, 'devoirs/nouvA'), { titre: 'n', classe: '2nde1', enseignant: 'profA' }));
await cas('enseignant A : crée un devoir au nom de B', false, setDoc(doc(profA, 'devoirs/faux1'), { titre: 'n', classe: '2nde1', enseignant: 'profB' }));
await cas('enseignant A : crée un devoir sans enseignant', false, setDoc(doc(profA, 'devoirs/faux2'), { titre: 'n', classe: '2nde1' }));
await cas('enseignant A : modifie son devoir', true, updateDoc(doc(profA, 'devoirs/dA'), { titre: 'A modifié' }));
await cas('enseignant A : modifie un devoir de B', false, updateDoc(doc(profA, 'devoirs/dB'), { titre: 'piraté' }));
await cas('enseignant A : modifie un devoir sans enseignant', false, updateDoc(doc(profA, 'devoirs/dL'), { titre: 'piraté' }));
await cas('enseignant A : donne son devoir à B', false, updateDoc(doc(profA, 'devoirs/dA'), { enseignant: 'profB' }));
await cas('enseignant A : s\'approprie le devoir de B', false, updateDoc(doc(profA, 'devoirs/dB'), { enseignant: 'profA' }));
await cas('enseignant A : liste ses devoirs (where enseignant)', true, getDocs(query(collection(profA, 'devoirs'), where('enseignant', '==', 'profA'))));
await cas('enseignant A : supprime un devoir de B', false, deleteDoc(doc(profA, 'devoirs/dB')));
await cas('enseignant A : supprime un devoir sans enseignant', false, deleteDoc(doc(profA, 'devoirs/dL')));
await cas('enseignant A : supprime son devoir', true, deleteDoc(doc(profA, 'devoirs/dA2')));
console.log('  Lecture des devoirs resserrée (28/10/2026) : propriétaire et élèves de cet enseignant seulement');
const eB1 = env.authenticatedContext('eB1').firestore();
const eL = env.authenticatedContext('eL').firestore();
const eD1 = env.authenticatedContext('eD1').firestore();
const adminSeulLecture = env.authenticatedContext('adminSeul', { admin: true }).firestore();
await cas('élève de A : lit un devoir de son enseignant', true, getDoc(doc(eA1, 'devoirs/dA')));
await cas('élève de A : liste les devoirs de sa classe (comme devoirs-eleve.js)', true, getDocs(query(collection(eA1, 'devoirs'), where('classe', '==', '2nde1'), where('enseignant', '==', 'profA'))));
await cas('élève de A : liste par fiche et classe (comme suivi.js)', true, getDocs(query(collection(eA1, 'devoirs'), where('ficheId', '==', 'f1'), where('classe', '==', '2nde1'), where('enseignant', '==', 'profA'))));
await cas('élève de A : ne lit pas un devoir de B', false, getDoc(doc(eA1, 'devoirs/dB')));
await cas('élève de A : liste des devoirs de B refusée', false, getDocs(query(collection(eA1, 'devoirs'), where('classe', '==', '2nde1'), where('enseignant', '==', 'profB'))));
await cas('élève de A : liste sans filtre enseignant refusée', false, getDocs(query(collection(eA1, 'devoirs'), where('classe', '==', '2nde1'))));
await cas('élève de A : liste de tous les devoirs refusée', false, getDocs(collection(eA1, 'devoirs')));
await cas('élève de B : ne lit pas un devoir de A', false, getDoc(doc(eB1, 'devoirs/dA')));
await cas('élève de B : lit un devoir de son enseignant', true, getDoc(doc(eB1, 'devoirs/dB')));
await cas('élève sans enseignant : ne lit aucun devoir', false, getDoc(doc(eL, 'devoirs/dA')));
await cas('élève sans enseignant : ne lit pas un devoir sans enseignant', false, getDoc(doc(eL, 'devoirs/dL')));
await cas('enseignant A : lit son devoir', true, getDoc(doc(profA, 'devoirs/dA')));
await cas('enseignant A : ne lit pas un devoir de B', false, getDoc(doc(profA, 'devoirs/dB')));
await cas('enseignant A : liste de tous les devoirs refusée', false, getDocs(collection(profA, 'devoirs')));
await cas('enseignant A : liste des devoirs de B refusée', false, getDocs(query(collection(profA, 'devoirs'), where('enseignant', '==', 'profB'))));
await cas('enseignant A : ne lit pas un devoir sans enseignant', false, getDoc(doc(profA, 'devoirs/dL')));
await cas('compte sans profil ni droit : ne lit aucun devoir', false, getDoc(doc(simpleCompte, 'devoirs/dA')));
await cas('compte sans profil ni droit : ne liste pas les devoirs', false, getDocs(collection(simpleCompte, 'devoirs')));
await cas('admin seul : ne lit aucun devoir', false, getDoc(doc(adminSeulLecture, 'devoirs/dA')));
await cas('david : lit son devoir', true, getDoc(doc(david, 'devoirs/dD')));
await cas('david : ne lit pas un devoir de A', false, getDoc(doc(david, 'devoirs/dA')));
await cas('david : liste ses devoirs', true, getDocs(query(collection(david, 'devoirs'), where('enseignant', '==', 'david'))));
await cas('élève de david : lit un devoir de david', true, getDoc(doc(eD1, 'devoirs/dD')));
await cas('élève de david : ne lit pas un devoir de A', false, getDoc(doc(eD1, 'devoirs/dA')));
await cas('élève : crée un devoir à son uid', false, setDoc(doc(eA1, 'devoirs/faux3'), { titre: 'n', classe: '2nde1', enseignant: 'eA1' }));
await cas('compte sans droit : ne crée pas de devoir', false, setDoc(doc(simpleCompte, 'devoirs/faux4'), { titre: 'n', enseignant: 'quelquun' }));
await cas('anonyme : ne lit toujours pas les devoirs', false, getDoc(doc(anonyme, 'devoirs/dA')));

console.log('  Statistiques de fréquentation : réservées à l\'admin');
await cas('enseignant A : ne lit pas la fréquentation', false, getDoc(doc(profA, 'statistiques', ID)));
await cas('enseignant A : ne liste pas la fréquentation', false, getDocs(collection(profA, 'statistiques')));

console.log('  Droit admin seul : fréquentation uniquement, aucun accès aux élèves ni aux devoirs');
const adminSeul = env.authenticatedContext('adminSeul', { admin: true }).firestore();
await cas('admin seul : lit la fréquentation', true, getDoc(doc(adminSeul, 'statistiques', ID)));
await cas('admin seul : liste la fréquentation', true, getDocs(collection(adminSeul, 'statistiques')));
await cas('admin seul : supprime une fréquentation', true, deleteDoc(doc(adminSeul, 'statistiques', '2026-10-04_0')));
await cas("admin seul : ne lit pas le profil d'un élève", false, getDoc(doc(adminSeul, 'eleves/eA1')));
await cas('admin seul : ne liste pas les élèves', false, getDocs(collection(adminSeul, 'eleves')));
await cas("admin seul : ne lit pas les tentatives d'un élève", false, getDocs(collection(adminSeul, 'eleves/eB1/devoirsTentatives')));
await cas("admin seul : n'écrit pas un profil", false, setDoc(doc(adminSeul, 'eleves/eA1'), { pseudo: 'x' }));
await cas('admin seul : ne supprime pas une tentative', false, deleteDoc(doc(adminSeul, 'eleves/eA1/devoirsTentatives/tA1bis')));
await cas('admin seul : ne modifie pas un devoir', false, updateDoc(doc(adminSeul, 'devoirs/dA'), { titre: 'par admin' }));
await cas('admin seul : ne supprime pas un devoir', false, deleteDoc(doc(adminSeul, 'devoirs/dB')));
await cas('admin seul : ne crée pas de devoir', false, setDoc(doc(adminSeul, 'devoirs/nouvAdmin'), { titre: 'n', classe: '2nde1', enseignant: 'adminSeul' }));

console.log('  David (admin + enseignant) : ses élèves et ses devoirs, la fréquentation, rien de plus');
await cas('david : lit la fréquentation', true, getDoc(doc(david, 'statistiques', ID)));
await cas('david : lit le profil de son élève', true, getDoc(doc(david, 'eleves/eD1')));
await cas('david : liste ses élèves', true, getDocs(query(collection(david, 'eleves'), where('enseignant', '==', 'david'))));
await cas('david : liste de tous les élèves refusée', false, getDocs(collection(david, 'eleves')));
await cas('david : lit les tentatives de son élève', true, getDocs(collection(david, 'eleves/eD1/devoirsTentatives')));
await cas("david : ne lit pas le profil d'un élève de A", false, getDoc(doc(david, 'eleves/eA1')));
await cas("david : ne lit pas les tentatives d'un élève de B", false, getDocs(collection(david, 'eleves/eB1/devoirsTentatives')));
await cas('david : ne lit pas un élève sans enseignant', false, getDoc(doc(david, 'eleves/eL')));
await cas("david : n'écrit pas un profil", false, setDoc(doc(david, 'eleves/eD1'), { pseudo: 'x', enseignant: 'david' }));
await cas('david : ne modifie pas le devoir de A', false, updateDoc(doc(david, 'devoirs/dA'), { titre: 'par david' }));
await cas('david : ne supprime pas le devoir de B', false, deleteDoc(doc(david, 'devoirs/dB')));
await cas('david : ne modifie pas un devoir sans enseignant', false, updateDoc(doc(david, 'devoirs/dL'), { titre: 'x' }));
await cas('david : crée un devoir à son nom', true, setDoc(doc(david, 'devoirs/nouvD'), { titre: 'n', classe: '2nde3', enseignant: 'david' }));
await cas('david : crée un devoir au nom de B', false, setDoc(doc(david, 'devoirs/fauxD'), { titre: 'n', classe: '2nde3', enseignant: 'profB' }));
await cas('david : modifie son devoir', true, updateDoc(doc(david, 'devoirs/dD'), { titre: 'D modifié' }));
await cas('david : supprime son devoir', true, deleteDoc(doc(david, 'devoirs/dD2')));
await cas('david : supprime une tentative de son élève', true, deleteDoc(doc(david, 'eleves/eD1/devoirsTentatives/tD1')));

function profA_uid() { return 'profA'; }

console.log(`\n${ok} réussis, ${ko} échecs`);
await env.cleanup();
process.exit(ko ? 1 : 0);
