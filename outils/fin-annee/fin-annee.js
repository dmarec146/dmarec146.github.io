#!/usr/bin/env node
'use strict';

// Nettoyage de fin d'annee scolaire (decision de David, 26/10/2026 : comptes d'eleves supprimes au 30 juin).
// Outil hors-site (jamais publie : outils/ est exclu de Firebase Hosting) a lancer A LA MAIN, dans cet ordre :
//
//   1. node outils/fin-annee/fin-annee.js --classes="2nde-207,1ere-Gr 1"     comptage seul, RIEN n'est supprime
//   2. node outils/fin-annee/fin-annee.js --classes="..." --exporter          sauvegarde complete + export des resultats (tableur)
//   3. node outils/fin-annee/fin-annee.js --classes="..." --supprimer --oui   suppression (refusee sans l'export du jour)
//
// Options : --toutes (au lieu de --classes) ; --garder=pseudo1,pseudo2 (comptes a conserver en plus de demo-eleve) ;
// --orphelins (inclut les dossiers eleves/ dont le compte n'existe plus) ; --devoirs (supprime aussi les devoirs echus
// des classes concernees : ils contiennent des identifiants d'eleves) ; --dossier=CHEMIN (sortie de l'export).
// Jamais supprimes : le compte enseignant (adresse reelle), demo-eleve, les statistiques anonymes, les devoirs sans --devoirs.
// Prerequis : outils/creer-comptes (npm install fait, service-account.json present). Voir SUIVI-FIREBASE.md.

const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const DOSSIER_CREER = path.join(__dirname, '..', 'creer-comptes');
const req = createRequire(path.join(DOSSIER_CREER, 'package.json'));
const { initializeApp, cert } = req('firebase-admin/app');
const { getAuth } = req('firebase-admin/auth');
const { getFirestore, Timestamp } = req('firebase-admin/firestore');

const SUFFIXE_ELEVE = '@cahiers-interactifs.local';
const GARDER_PAR_DEFAUT = ['demo-eleve'];

const args = process.argv.slice(2);
const val = (nom) => { const a = args.find((x) => x.startsWith(nom + '=')); return a ? a.slice(nom.length + 1) : null; };
const classesCiblees = (val('--classes') || '').split(',').map((s) => s.trim()).filter(Boolean);
const toutes = args.includes('--toutes');
const garder = new Set([...GARDER_PAR_DEFAUT, ...(val('--garder') || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)]);
const avecOrphelins = args.includes('--orphelins');
const avecDevoirs = args.includes('--devoirs');
const exporter = args.includes('--exporter');
const supprimer = args.includes('--supprimer');
const confirme = args.includes('--oui');

function fail(m) { console.error('\nERREUR : ' + m); process.exit(1); }
if (!toutes && !classesCiblees.length) fail('indique les classes visees : --classes="2nde-207,1ere-Gr 1" (ou --toutes).');
if (supprimer && exporter) fail('--exporter et --supprimer se lancent separement.');

initializeApp({ credential: cert(JSON.parse(fs.readFileSync(path.join(DOSSIER_CREER, 'service-account.json'), 'utf8'))) });
const db = getFirestore();
const auth = getAuth();

const aujourdhui = new Date().toISOString().slice(0, 10);
const dossierExport = val('--dossier') || `C:/Users/${process.env.USERNAME || 'david'}/Documents/sauvegardes-site/${aujourdhui}-fin-annee`;

function convertir(v) {
  if (v === null || typeof v !== 'object') return v;
  if (v instanceof Timestamp) return { __type: 'timestamp', iso: v.toDate().toISOString() };
  if (Array.isArray(v)) return v.map(convertir);
  const o = {}; for (const k of Object.keys(v)) o[k] = convertir(v[k]); return o;
}
async function exporterRef(ref) {
  const d = await ref.get();
  const entree = { id: ref.id, existe: d.exists, data: d.exists ? convertir(d.data()) : null, sous: {} };
  for (const sc of await ref.listCollections()) {
    entree.sous[sc.id] = [];
    for (const r of await sc.listDocuments()) entree.sous[sc.id].push(await exporterRef(r));
  }
  return entree;
}
const millis = (t) => (t && t.toMillis ? t.toMillis() : 0);
const csv = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
const frDate = (ms) => (ms ? new Date(ms).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }) : '');
const frNombre = (n) => String(n).replace('.', ',');

(async () => {
  // ---- Etat actuel ----
  const comptes = [];
  let jeton;
  do { const r = await auth.listUsers(1000, jeton); comptes.push(...r.users); jeton = r.pageToken; } while (jeton);
  const uidsAuth = new Set(comptes.map((u) => u.uid));
  const refsEleves = await db.collection('eleves').listDocuments();
  const profils = new Map();
  for (const r of refsEleves) { const d = await r.get(); if (d.exists) profils.set(r.id, d.data()); }

  // Un compte qui porte le droit administrateur ou enseignant n'est JAMAIS traite comme un eleve, meme avec une adresse fictive.
  const estAdmin = (u) => !!(u.customClaims && (u.customClaims.admin || u.customClaims.enseignant));
  const eleves = comptes.filter((u) => (u.email || '').endsWith(SUFFIXE_ELEVE) && !estAdmin(u)).map((u) => {
    const p = profils.get(u.uid) || {};
    const pseudo = (p.pseudo || (u.email || '').replace(SUFFIXE_ELEVE, '')).toLowerCase();
    return { uid: u.uid, pseudo, nom: p.nom || '', prenom: p.prenom || '', classe: p.classe || (profils.has(u.uid) ? 'hors-classe' : '(sans profil)') };
  });
  const protegesAdmin = comptes.filter((u) => !(u.email || '').endsWith(SUFFIXE_ELEVE) || estAdmin(u));
  const cibles = eleves.filter((e) => (toutes || classesCiblees.includes(e.classe)) && !garder.has(e.pseudo));
  const gardes = eleves.filter((e) => !cibles.includes(e));
  const orphelins = refsEleves.filter((r) => !uidsAuth.has(r.id));

  const parClasse = {}; for (const e of cibles) parClasse[e.classe] = (parClasse[e.classe] || 0) + 1;
  console.log('=== Etat ===');
  console.log(`Comptes Authentication : ${comptes.length} (eleves : ${eleves.length}, enseignant / autres : ${protegesAdmin.length})`);
  console.log('A SUPPRIMER (comptes eleves ciblés) :', cibles.length, JSON.stringify(parClasse));
  const gardesParClasse = {}; for (const e of gardes) gardesParClasse[e.classe] = (gardesParClasse[e.classe] || 0) + 1;
  console.log('CONSERVES parmi les eleves :', gardes.length, JSON.stringify(gardesParClasse));
  const aSignaler = gardes.filter((e) => garder.has(e.pseudo) || e.classe === '(sans profil)' || e.classe === 'hors-classe');
  if (aSignaler.length) console.log('  a noter (protege, sans profil ou hors classe) :', aSignaler.map((e) => `${e.pseudo} [${e.classe}]`).join(', '));
  console.log('Dossiers eleves/ dont le compte n\'existe plus (orphelins) :', orphelins.length, avecOrphelins ? '(inclus)' : '(non inclus : ajoute --orphelins)');

  const snapDevoirs = await db.collection('devoirs').get();
  const maintenant = Date.now();
  const classesTouchees = new Set(cibles.map((e) => e.classe));
  const devoirsASupprimer = avecDevoirs
    ? snapDevoirs.docs.filter((d) => (toutes || classesTouchees.has(d.get('classe'))) && millis(d.get('echeance')) < maintenant) : [];
  console.log(`Devoirs : ${snapDevoirs.size} au total ; ${avecDevoirs ? devoirsASupprimer.length + ' echus a supprimer (--devoirs)' : 'non touches (ajoute --devoirs pour supprimer les devoirs echus des classes concernees)'}`);

  if (!exporter && !supprimer) { console.log('\nComptage seul : rien n\'a ete modifie, rien n\'a ete ecrit.'); process.exit(0); }

  // ---- Export ----
  if (exporter) {
    fs.mkdirSync(dossierExport, { recursive: true });
    const eleveJson = []; for (const r of refsEleves) eleveJson.push(await exporterRef(r));
    fs.writeFileSync(path.join(dossierExport, 'firestore_eleves.json'), JSON.stringify(eleveJson, null, 1));
    fs.writeFileSync(path.join(dossierExport, 'firestore_devoirs.json'), JSON.stringify(snapDevoirs.docs.map((d) => ({ id: d.id, data: convertir(d.data()) })), null, 1));
    fs.writeFileSync(path.join(dossierExport, 'authentication_comptes.json'), JSON.stringify(comptes.map((u) => u.toJSON()), null, 1));

    // Resultats : meilleure tentative avant l'echeance (meme regle que le tableau de bord), un tableur lisible par Excel.
    const devoirs = new Map(snapDevoirs.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));
    const lignes = [['Classe', 'Nom', 'Prenom', 'Identifiant', 'Devoir', 'Echeance', 'Essais utilises', 'Meilleure note', 'Sur', 'Date de la meilleure tentative'].map(csv).join(';')];
    for (const e of eleves) {
      const tentatives = (await db.collection('eleves').doc(e.uid).collection('devoirsTentatives').get()).docs.map((d) => d.data());
      const parDevoir = new Map();
      for (const t of tentatives) { if (!parDevoir.has(t.devoirId)) parDevoir.set(t.devoirId, []); parDevoir.get(t.devoirId).push(t); }
      for (const [devoirId, liste] of parDevoir) {
        const dv = devoirs.get(devoirId) || {};
        const ech = millis(dv.echeance);
        const valides = liste.filter((t) => !ech || (millis(t.horodatage) > 0 && millis(t.horodatage) <= ech));
        const part = (t) => (t.totalExercices > 0 ? t.score / t.totalExercices : t.score);
        let meilleure = null; for (const t of valides) if (!meilleure || part(t) > part(meilleure)) meilleure = t;
        lignes.push([e.classe, e.nom, e.prenom, e.pseudo, dv.titre || devoirId, frDate(ech), liste.length, meilleure ? frNombre(meilleure.score) : '', meilleure ? frNombre(meilleure.totalExercices) : '', meilleure ? frDate(millis(meilleure.horodatage)) : ''].map(csv).join(';'));
      }
    }
    fs.writeFileSync(path.join(dossierExport, 'resultats-des-devoirs.csv'), '\uFEFF' + lignes.join('\r\n') + '\r\n');
    fs.writeFileSync(path.join(dossierExport, 'resume.json'), JSON.stringify({ date: new Date().toISOString(), comptes: comptes.length, elevesCibles: cibles.length, lignesResultats: lignes.length - 1 }, null, 1));
    console.log(`\nExport termine dans ${dossierExport}\n  - firestore_eleves.json, firestore_devoirs.json, authentication_comptes.json (sauvegarde complete)\n  - resultats-des-devoirs.csv (${lignes.length - 1} lignes, a ouvrir avec Excel)\nCes fichiers contiennent des donnees d'eleves : les garder hors ligne.`);
    process.exit(0);
  }

  // ---- Suppression ----
  if (!confirme) fail('ajoute --oui pour confirmer la suppression.');
  const resume = path.join(dossierExport, 'resume.json');
  if (!fs.existsSync(resume)) fail(`aucun export du jour trouve (${resume}). Lance d'abord --exporter.`);
  if (!cibles.length && !(avecOrphelins && orphelins.length) && !devoirsASupprimer.length) fail('rien a supprimer.');

  const uids = cibles.map((e) => e.uid);
  for (let i = 0; i < uids.length; i += 1000) {
    const r = await auth.deleteUsers(uids.slice(i, i + 1000));
    console.log(`Authentication : ${r.successCount} comptes supprimes, ${r.failureCount} echecs.`);
    if (r.failureCount) r.errors.forEach((x) => console.error('  echec', x.index, x.error.message));
  }
  const dossiersASupprimer = [...cibles.map((e) => db.collection('eleves').doc(e.uid)), ...(avecOrphelins ? orphelins : [])];
  for (const ref of dossiersASupprimer) await db.recursiveDelete(ref);
  console.log(`Firestore : ${dossiersASupprimer.length} dossiers eleves/ supprimes avec leurs sous-collections.`);
  for (const d of devoirsASupprimer) await d.ref.delete();
  if (devoirsASupprimer.length) console.log(`Devoirs echus supprimes : ${devoirsASupprimer.length}`);

  // ---- Controle ----
  const reste = (await auth.getUsers(uids.map((uid) => ({ uid })))).users.length;
  let resteFirestore = 0; for (const e of cibles) { const l = await db.collection('eleves').doc(e.uid).listCollections(); resteFirestore += l.length; }
  console.log(`Controle : ${reste} compte(s) cible(s) encore dans Authentication, ${resteFirestore} sous-collection(s) restante(s).`);
  process.exit(reste || resteFirestore ? 2 : 0);
})().catch((e) => { console.error('ERREUR', e.message); process.exit(1); });
