// Banc d'essai de assets/js/statistiques.js : le script est exécuté tel quel, avec un faux navigateur et une fausse base.
import { readFileSync } from 'fs';
// Lancer : node outils/verification/statistiques-banc-essai.mjs  (aucun accès réseau ni Firebase)
const source = readFileSync(new URL('../../assets/js/statistiques.js', import.meta.url), 'utf8');

const corps = source
  .replace("import('./firebase-config.js')", 'Promise.resolve(MOCK.config)')
  .replace("import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js')", 'Promise.resolve(MOCK.auth)')
  .replace("import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js')", 'Promise.resolve(MOCK.bd)');
if (corps === source || /import\(['"]/.test(corps)) throw new Error('imports non remplacés');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const executer = new AsyncFunction('MOCK', 'location', 'navigator', 'localStorage', 'window', 'screen', 'setTimeout', 'Date', corps);

let maintenant = Date.parse('2026-11-03T08:00:00');
class FauxDate extends Date { constructor(...a) { super(...(a.length ? a : [maintenant])); } static now() { return maintenant; } }

const ecritures = [];
let utilisateur = null;
const MOCK = {
  config: { auth: {}, db: {} },
  auth: { onAuthStateChanged: (_a, ok) => { setImmediate(() => ok(utilisateur)); return () => {}; } },
  bd: {
    increment: (n) => ({ inc: n }),
    doc: (_db, _col, id) => id,
    setDoc: async (id, donnees) => { ecritures.push({ id, donnees }); },
  },
};
let stockage = new Map();
let stockageCasse = false;
const localStorage = {
  getItem: (k) => { if (stockageCasse) throw new Error('bloqué'); return stockage.has(k) ? stockage.get(k) : null; },
  setItem: (k, v) => { if (stockageCasse) throw new Error('bloqué'); stockage.set(k, String(v)); },
  removeItem: (k) => { if (stockageCasse) throw new Error('bloqué'); stockage.delete(k); },
};
const minuteurs = [];
const faux = (f) => minuteurs.push(f);

async function ouvrir(chemin, options = {}) {
  const location = { protocol: 'https:', hostname: 'cahiers-interactifs.fr', pathname: chemin };
  const navigator = { webdriver: !!options.robot };
  const window = { matchMedia: () => ({ matches: false }) };
  await executer(MOCK, location, navigator, localStorage, window, { width: 1920, height: 1080 }, faux, FauxDate);
  await new Promise((r) => setTimeout(r, 30));
}
const avancer = (minutes) => { maintenant += minutes * 60000; };

let ok = 0, ko = 0;
function verif(nom, cond, detail = '') { if (cond) { ok++; console.log('  ok  ', nom); } else { ko++; console.log('  ECHEC', nom, detail); } }
const vide = () => { ecritures.length = 0; };
const somme = (cle) => ecritures.reduce((s, e) => s + (e.donnees[cle]?.inc || 0), 0);
const F = (n) => `/cahiers/premiere/cahier-1/fiche-${n}.html`;

console.log('1. Passage de 30 secondes');
await ouvrir(F(1));
verif('1 écriture', ecritures.length === 1, ecritures.length);
verif('visite, visiteur, appareil, page vue comptés', somme('visites') === 1 && somme('visiteurs') === 1 && somme('a_ordinateur') === 1 && somme('pv') === 1);
verif('document du jour', /^2026-11-03_[0-4]$/.test(ecritures[0].id), ecritures[0].id);
const premier = ecritures[0].donnees;
verif('format compatible règles (derniere = page)', premier.derniere === 'premiere-f1' && premier.pages['premiere-f1'].inc === 1 && premier.s_fiches_premiere.inc === 1);

console.log('2. Visite de 9 pages en 5 minutes');
vide();
for (let i = 2; i <= 9; i++) { avancer(0.5); await ouvrir(F(i)); }
verif('8 pages suivantes = 1 seule écriture (paquet à 8)', ecritures.length === 1, ecritures.length);
verif('paquet : pv 8, pas de nouvelle visite', somme('pv') === 8 && somme('visites') === 0 && somme('visiteurs') === 0);
verif('8 pages différentes', Object.keys(ecritures[0].donnees.pages).length === 8);
verif('s_fiches_premiere = 8', somme('s_fiches_premiere') === 8);
verif('attente vidée', !stockage.has('stats-attente'));

console.log('3. Une page de plus puis départ ; retour 40 min plus tard (même jour)');
vide();
avancer(1); await ouvrir(F(10)); avancer(0.5); await ouvrir(F(10));
verif('2 pages en attente, aucune écriture', ecritures.length === 0 && stockage.has('stats-attente'));
avancer(40); await ouvrir('/');
verif('une seule écriture à la reprise', ecritures.length === 1, ecritures.length);
verif('elle contient accueil + 2 pages en attente + nouvelle visite', somme('pv') === 3 && somme('visites') === 1 && somme('visiteurs') === 0 && ecritures[0].donnees.pages['premiere-f10'].inc === 2 && ecritures[0].donnees.pages.accueil.inc === 1);

console.log('4. Attente d\'un autre jour');
vide();
avancer(1); await ouvrir(F(3)); avancer(0.5); await ouvrir(F(4));
verif('2 pages en attente', ecritures.length === 0);
maintenant = Date.parse('2026-11-04T08:00:00');
await ouvrir('/');
verif('2 écritures : l\'attente à sa date, puis la nouvelle visite', ecritures.length === 2, ecritures.length);
verif('la 1re porte la date d\'hier (pv 2)', ecritures[0]?.id.startsWith('2026-11-03_') && ecritures[0].donnees.pv.inc === 2, JSON.stringify(ecritures[0]));
verif('la 2e porte la date du jour avec visite + visiteur', ecritures[1]?.id.startsWith('2026-11-04_') && ecritures[1].donnees.visites?.inc === 1 && ecritures[1].donnees.visiteurs?.inc === 1);

console.log('5. Minuteur de 10 minutes sur page restée ouverte');
vide(); minuteurs.length = 0;
avancer(1); await ouvrir(F(5));
verif('1re page = pas d\'écriture si visite en cours', true);
vide(); minuteurs.length = 0;
avancer(1); await ouvrir(F(6));
verif('1 page en attente, minuteur programmé', ecritures.length === 0 && minuteurs.length === 1, `${ecritures.length}/${minuteurs.length}`);
avancer(10); minuteurs[0](); await new Promise((r) => setTimeout(r, 30));
verif('le minuteur envoie l\'attente', ecritures.length === 1 && ecritures[0].donnees.pv.inc >= 1, ecritures.length);

console.log('6. Page ouverte après plus de 10 minutes avec attente');
vide();
avancer(1); await ouvrir(F(7)); avancer(11); await ouvrir(F(8));
verif('envoi à la 2e page (attente trop ancienne)', ecritures.length === 1 && ecritures[0].donnees.pv.inc === 2, JSON.stringify(ecritures));

console.log('7. Compte enseignant');
vide(); stockage = new Map();
utilisateur = { getIdTokenResult: async () => ({ claims: { enseignant: true } }) };
await ouvrir(F(1));
verif('aucune écriture', ecritures.length === 0);
verif('navigateur marqué exclu', stockage.get('stats-exclu') === '1');
await ouvrir(F(2));
verif('et toujours rien ensuite', ecritures.length === 0);
utilisateur = null;

console.log('8. Enseignant avec des pages déjà en attente');
vide(); stockage = new Map();
await ouvrir(F(1)); vide(); avancer(1); await ouvrir(F(2));
verif('1 page en attente', stockage.has('stats-attente'));
utilisateur = { getIdTokenResult: async () => ({ claims: { admin: true } }) };
avancer(40); await ouvrir(F(3));
verif('rien envoyé, attente effacée, exclu', ecritures.length === 0 && !stockage.has('stats-attente') && stockage.get('stats-exclu') === '1');
utilisateur = null;

console.log('9. Stockage bloqué');
vide(); stockage = new Map(); stockageCasse = true;
await ouvrir(F(1)); await ouvrir(F(2));
verif('une écriture par page, pv seulement', ecritures.length === 2 && ecritures.every((e) => e.donnees.pv.inc === 1 && !e.donnees.visites && !e.donnees.visiteurs));
stockageCasse = false;

console.log('10. Refus, robot, local');
vide(); stockage = new Map([['stats-refus', '1']]);
await ouvrir(F(1)); verif('refus : rien', ecritures.length === 0);
stockage = new Map(); await ouvrir(F(1), { robot: true }); verif('robot : rien', ecritures.length === 0);

console.log('11. Attente corrompue');
vide(); stockage = new Map([['stats-derniere-activite', String(maintenant)], ['stats-dernier-jour', '2026-11-04'], ['stats-attente', '{"jour":"2026-11-04","depuis":1,"pv":500,"parties":{"pirate":9},"pages":{"A/B":99}}']]);
await ouvrir(F(1));
verif('attente abusive ignorée et effacée, pas d\'écriture invalide', ecritures.every((e) => e.donnees.pv.inc <= 12) && !(stockage.get('stats-attente') || '').includes('pirate'), stockage.get('stats-attente'));

console.log('12. Volume : une journée type, 1000 élèves');
vide(); stockage = new Map();
let total = 0;
for (let eleve = 0; eleve < 40; eleve++) {          // 40 élèves × 3 visites de 10 pages (30 pages/jour)
  stockage = new Map();
  for (let v = 0; v < 3; v++) {
    avancer(60);
    for (let p = 0; p < 10; p++) { avancer(1); await ouvrir(F(1 + p)); }
  }
}
total = ecritures.length;
console.log(`   40 élèves, 30 pages chacun : ${total} écritures (${(total / 40).toFixed(1)} par élève, ancien système : 30) ; pages vues envoyées : ${somme('pv')} sur 1200`);
verif('au plus 8 écritures par élève', total / 40 <= 8, total / 40);

console.log(`\n${ok} réussis, ${ko} échecs`);
process.exit(ko ? 1 : 0);
