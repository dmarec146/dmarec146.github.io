// Mesure de fréquentation anonyme (03/10/2026, demande de David : « juste le
// nombre de visites », de quiconque, connecté ou non).
//
// Des compteurs du jour sont augmentés dans statistiques/{AAAA-MM-JJ}_{fragment}
// -- jamais d'adresse IP, d'identifiant ni de nom : seulement des totaux.
//   pv              pages vues
//   visites         nouvelles visites (plus de 30 min sans activité sur le site)
//   visiteurs       premier passage du jour de CE navigateur
//   s_<partie>      pages vues par partie du site (accueil, fiches de Première...)
//   a_<appareil>    visites par type d'appareil (ordinateur, tablette, téléphone)
//   pages.<clé>     pages vues par page (fiches les plus ouvertes)
//   derniere        clé de la page ouverte au moment de l'écriture (ancien format
//                   des règles, conservé, inoffensif avec les règles actuelles)
// Le navigateur ne retient que la date de son dernier passage, l'heure de sa
// dernière activité et des compteurs en attente d'envoi (localStorage), aucun
// identifiant : un « visiteur » est un navigateur venu ce jour-là (une session
// Windows par élève en salle info).
//
// Écritures groupées (28/10/2026, pour tenir ~1000 élèves sous le quota
// gratuit de 20 000 écritures par jour) :
//   - la PREMIÈRE page d'une visite (ou le premier passage du jour) est écrite
//     tout de suite : un passage de quelques secondes est donc toujours compté ;
//   - les pages suivantes de la visite sont additionnées dans le navigateur
//     (stats-attente) et envoyées en un seul paquet à 8 pages ou 10 minutes ;
//   - à la visite suivante, ce qui restait en attente part avec elle (à la date
//     d'origine). Ce qu'un élève qui ne revient jamais n'a pas eu le temps
//     d'envoyer est perdu : le total des pages vues peut être légèrement sous-
//     évalué, jamais les visites ni les visiteurs.
// Les bibliothèques Firebase ne sont chargées que si une écriture a lieu.
// Fragments (_0 à _4, tirés au hasard) : une classe entière qui ouvre la même
// page à la même seconde ne sature pas un document unique.
// Exclus : le compte enseignant (et tout navigateur où il s'est connecté une
// fois), le site ouvert en local, les navigateurs pilotés (robots, tests).
// Toute erreur est ignorée en silence : la mesure ne doit jamais gêner la page.

const NB_FRAGMENTS = 5;
const DUREE_VISITE_MS = 30 * 60 * 1000;
const PAQUET_PAGES = 8;                    // pages en attente qui déclenchent l'envoi
const ATTENTE_MAX_MS = 10 * 60 * 1000;     // ancienneté de la plus vieille page en attente qui déclenche l'envoi
const PV_MAX_ATTENTE = 10;                 // au-delà, l'attente est abandonnée (les règles refusent plus de 12 pages vues par écriture)
const CLE_EXCLU = 'stats-exclu';
const CLE_DERNIER_JOUR = 'stats-dernier-jour';
const CLE_DERNIERE_ACTIVITE = 'stats-derniere-activite';
const CLE_ATTENTE = 'stats-attente';
const PARTIES = ['accueil', 'cahiers', 'fiches_seconde', 'fiches_premiere', 'fiches_terminale',
                 'automatismes', 'qcm_bac', 'mes_devoirs', 'connexion', 'autres'];

function lire(cle) { try { return localStorage.getItem(cle); } catch (e) { return undefined; } }
function ecrire(cle, valeur) { try { localStorage.setItem(cle, valeur); return true; } catch (e) { return false; } }
function effacer(cle) { try { localStorage.removeItem(cle); } catch (e) { /* ignoré */ } }

function jourLocal(date) {
  const deux = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}`;
}

// Partie du site et clé de page, d'après l'adresse (mêmes clés que le tableau
// de bord tableau-de-bord/frequentation.html).
function decrirePage(chemin) {
  const c = chemin.replace(/index\.html$/, '');
  let m = c.match(/^\/cahiers\/(seconde|premiere|terminale)\/cahier-\d+\/fiche-(\d+)\.html$/);
  if (m) return { partie: 'fiches_' + m[1], page: `${m[1]}-f${Number(m[2])}` };
  m = c.match(/^\/cahiers\/(seconde|premiere|terminale)\/cahier-(\d+)\/$/);
  if (m) return { partie: 'cahiers', page: `${m[1]}-c${Number(m[2])}` };
  if (c === '/cahiers/') return { partie: 'cahiers', page: 'cahiers' };
  m = c.match(/^\/automatismes\/(?:([a-z]+)\/)?(?:([a-z-]+)\.html)?$/);
  if (m) return { partie: 'automatismes', page: ['auto', m[1], m[2]].filter(Boolean).join('-') };
  m = c.match(/^\/qcm-bac\/(?:([a-z-]+)\.html)?$/);
  if (m) return { partie: 'qcm_bac', page: ['qcm-bac', m[1]].filter(Boolean).join('-') };     // 18/10/2026 : partie à part (règles Firestore publiées avec s_qcm_bac)
  if (c === '/mes-devoirs/') return { partie: 'mes_devoirs', page: 'mes-devoirs' };
  if (c === '/connexion/') return { partie: 'connexion', page: 'connexion' };
  if (c === '/') return { partie: 'accueil', page: 'accueil' };
  return { partie: 'autres', page: 'autre' };
}

function typeAppareil() {
  const tactile = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if (!tactile) return 'ordinateur';
  return Math.min(screen.width, screen.height) < 600 ? 'telephone' : 'tablette';
}

// ---- Pages vues en attente d'envoi : { jour, depuis, pv, parties: {partie: n}, pages: {page: n} } ----

// Relit l'attente en la validant (le stockage peut avoir été modifié ou corrompu) ; null si absente ou inutilisable.
function lireAttente() {
  const brut = lire(CLE_ATTENTE);
  if (!brut) return null;
  try {
    const a = JSON.parse(brut);
    if (!a || !/^\d{4}-\d{2}-\d{2}$/.test(a.jour) || !Number.isInteger(a.pv) || a.pv < 1 || a.pv > PV_MAX_ATTENTE) throw 0;
    if (!Number.isFinite(a.depuis)) throw 0;
    const parties = {}, pages = {};
    for (const [k, n] of Object.entries(a.parties || {})) if (PARTIES.includes(k) && Number.isInteger(n) && n >= 1 && n <= PV_MAX_ATTENTE) parties[k] = n;
    for (const [k, n] of Object.entries(a.pages || {})) if (/^[a-z0-9-]{1,40}$/.test(k) && Number.isInteger(n) && n >= 1 && n <= PV_MAX_ATTENTE) pages[k] = n;
    if (!Object.keys(pages).length) throw 0;
    return { jour: a.jour, depuis: a.depuis, pv: a.pv, parties, pages };
  } catch (e) {
    effacer(CLE_ATTENTE);
    return null;
  }
}

function ajouterALAttente(attente, jour, partie, page, maintenant) {
  const a = attente || { jour, depuis: maintenant, pv: 0, parties: {}, pages: {} };
  a.pv += 1;
  a.parties[partie] = (a.parties[partie] || 0) + 1;
  a.pages[page] = (a.pages[page] || 0) + 1;
  return a;
}

// ---- Envoi (les bibliothèques Firebase ne sont chargées qu'ici) ----

let bibliotheques = null;
function charger() {
  if (!bibliotheques) {
    bibliotheques = Promise.all([
      import('./firebase-config.js'),
      import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js'),
    ]);
  }
  return bibliotheques;
}

// Faux si le navigateur est celui d'un enseignant ou de l'administrateur (alors rien n'est compté).
async function visiteurCompte(config, authLib) {
  const utilisateur = await new Promise((resoudre) => {
    const arreter = authLib.onAuthStateChanged(config.auth, (u) => { arreter(); resoudre(u); }, () => resoudre(null));
  });
  if (!utilisateur) return true;
  const jeton = await utilisateur.getIdTokenResult();
  if (jeton.claims.admin === true || jeton.claims.enseignant === true) { ecrire(CLE_EXCLU, '1'); effacer(CLE_ATTENTE); return false; }
  return true;
}

// `lots` : liste de paquets { jour, pv, parties, pages, derniere, visite? } ; chacun devient une écriture.
async function envoyer(lots) {
  const [config, authLib, bd] = await charger();
  if (!(await visiteurCompte(config, authLib))) return;
  for (const lot of lots) {
    const donnees = { pv: bd.increment(lot.pv), pages: {}, derniere: lot.derniere };
    for (const [k, n] of Object.entries(lot.parties)) donnees['s_' + k] = bd.increment(n);
    for (const [k, n] of Object.entries(lot.pages)) donnees.pages[k] = bd.increment(n);
    if (lot.visite) {
      if (lot.visite.visites) { donnees.visites = bd.increment(1); donnees['a_' + lot.visite.appareil] = bd.increment(1); }
      if (lot.visite.visiteurs) donnees.visiteurs = bd.increment(1);
    }
    const fragment = Math.floor(Math.random() * NB_FRAGMENTS);
    try { await bd.setDoc(bd.doc(config.db, 'statistiques', `${lot.jour}_${fragment}`), donnees, { merge: true }); }
    catch (e) { /* un paquet perdu ne doit pas empêcher d'envoyer le suivant */ }
  }
}

function lotDepuisAttente(a) {
  return { jour: a.jour, pv: a.pv, parties: a.parties, pages: a.pages, derniere: Object.keys(a.pages)[0] };
}

// Envoie l'attente telle qu'elle est dans le stockage à cet instant (un autre onglet a pu l'envoyer entre-temps).
function envoyerAttente() {
  const a = lireAttente();
  if (!a) return Promise.resolve();
  effacer(CLE_ATTENTE);     // retirée avant l'envoi : jamais envoyée deux fois ; perdue si l'envoi échoue
  return envoyer([lotDepuisAttente(a)]).catch(() => {});
}

let minuteur = null;
function programmerEnvoi(attente, maintenant) {
  if (minuteur) return;
  const reste = Math.max(1000, attente.depuis + ATTENTE_MAX_MS - maintenant);
  minuteur = setTimeout(() => { minuteur = null; envoyerAttente(); }, reste);
}

async function compter() {
  if (location.protocol === 'file:' || ['localhost', '127.0.0.1', ''].includes(location.hostname)) return;
  if (navigator.webdriver) return;
  if (lire(CLE_EXCLU) === '1') return;
  if (lire('stats-refus') === '1') return;     // refus du comptage, bouton de la page confidentialite/ (28/10/2026)

  const maintenant = new Date();
  const instant = maintenant.getTime();
  const jour = jourLocal(maintenant);
  const { partie, page } = decrirePage(location.pathname);

  // Sans stockage local (navigation privée stricte, stockage bloqué) : seules
  // les pages vues sont comptées, une écriture chacune, faute de pouvoir
  // reconnaître une visite ni garder des compteurs en attente.
  const derniereActivite = lire(CLE_DERNIERE_ACTIVITE);
  if (derniereActivite === undefined) {
    await envoyer([{ jour, pv: 1, parties: { [partie]: 1 }, pages: { [page]: 1 }, derniere: page }]);
    return;
  }

  const nouvelleVisite = !derniereActivite || instant - Number(derniereActivite) > DUREE_VISITE_MS;
  const nouveauJour = lire(CLE_DERNIER_JOUR) !== jour;
  let attente = lireAttente();
  ecrire(CLE_DERNIERE_ACTIVITE, String(instant));
  ecrire(CLE_DERNIER_JOUR, jour);

  // Première page d'une visite ou du jour : écrite tout de suite, avec l'attente du même jour s'il y en a une.
  if (nouvelleVisite || nouveauJour) {
    const lots = [];
    let lot = { jour, pv: 1, parties: { [partie]: 1 }, pages: { [page]: 1 }, derniere: page,
                visite: { visites: nouvelleVisite, appareil: typeAppareil(), visiteurs: nouveauJour } };
    if (attente) {
      effacer(CLE_ATTENTE);
      if (attente.jour === jour) {
        lot.pv += attente.pv;
        for (const [k, n] of Object.entries(attente.parties)) lot.parties[k] = (lot.parties[k] || 0) + n;
        for (const [k, n] of Object.entries(attente.pages)) lot.pages[k] = (lot.pages[k] || 0) + n;
      } else {
        lots.push(lotDepuisAttente(attente));     // attente d'un autre jour : comptée à sa date
      }
    }
    lots.push(lot);
    await envoyer(lots);
    return;
  }

  // Page suivante de la visite : additionnée dans le navigateur, envoyée par paquet.
  if (attente && attente.jour !== jour) {
    effacer(CLE_ATTENTE);
    await envoyer([lotDepuisAttente(attente)]).catch(() => {});
    attente = null;
  }
  attente = ajouterALAttente(attente, jour, partie, page, instant);
  ecrire(CLE_ATTENTE, JSON.stringify(attente));
  if (attente.pv >= PAQUET_PAGES || instant - attente.depuis >= ATTENTE_MAX_MS) await envoyerAttente();
  else programmerEnvoi(attente, instant);
}

compter().catch(() => {});
