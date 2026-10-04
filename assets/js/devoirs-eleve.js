// Classement des devoirs d'un eleve connecte (30/09/2026), partage par
// /mes-devoirs/ (mes-devoirs.js) et la pastille des pages d'entree
// (devoirs-notification.js), pour que les deux comptent exactement la meme
// chose :
//
//   aFaire      : echeance a venir, essais pas epuises, aucun brouillon en
//                 cours -- y compris un devoir deja rendu une fois auquel il
//                 reste des essais (il doit rester accessible, retour de
//                 David le 30/09/2026 apres un premier classement qui le
//                 rangeait a tort dans "faits" des la premiere validation) ;
//   enregistres : echeance a venir, essais pas epuises, un brouillon en cours
//                 ("Enregistrer mon avancement" clique, pas encore valide) ;
//   faits       : essais epuises, ou echeance passee (rendu ou non).
//
// Brouillons : cles differentes selon le type de devoir -- fiche de calcul
// (eleves/{uid}/brouillons, un document par ficheId) ou automatismes
// (eleves/{uid}/brouillonsAutomatismes, un document par devoirId). Avec
// `nettoyerBrouillons`, un brouillon qui n'est plus rattache a aucun devoir
// ouvert (echeance passee, devoir supprime, ou ancien brouillon
// d'entrainement d'avant le 29/09/2026) est supprime : un devoir enregistre
// mais pas termine a la date limite ne doit plus apparaitre nulle part.

import { db } from './firebase-config.js';
import { appliquerDerogation } from './derogations.js';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Meme sentinelle que suivi.js/devoirs.js : un eleve cree sans classe.
const CLASSE_HORS_CLASSE = 'hors-classe';

const millis = (horodatage) => (horodatage?.toMillis ? horodatage.toMillis() : 0);

// Un eleve peut retirer un devoir FAIT de sa liste (04/10/2026) : simple
// marqueur eleves/{uid}/devoirsMasques/{devoirId}, jamais une suppression --
// le devoir, les tentatives et les resultats de l'enseignant ne bougent pas.
// Un marqueur ne cache que la colonne « Faits » : si le devoir redevient
// ouvert (echeance repoussee), il reapparait dans « A faire ».
export async function masquerDevoirs(uid, devoirIds) {
  await Promise.all(devoirIds.map((id) => setDoc(doc(db, 'eleves', uid, 'devoirsMasques', id), { masqueLe: serverTimestamp() })));
}

// Renvoie null si le compte n'a pas de profil eleve (ex. compte enseignant).
export async function chargerDevoirsEleve(uid, { nettoyerBrouillons = false } = {}) {
  const profil = await getDoc(doc(db, 'eleves', uid));
  if (!profil.exists()) return null;
  const classe = profil.data().classe || CLASSE_HORS_CLASSE;

  const [instDevoirs, instTentatives, instBrouillonsFiches, instBrouillonsAuto, instMasques] = await Promise.all([
    getDocs(query(collection(db, 'devoirs'), where('classe', '==', classe))),
    getDocs(collection(db, 'eleves', uid, 'devoirsTentatives')),
    getDocs(collection(db, 'eleves', uid, 'brouillons')),
    getDocs(collection(db, 'eleves', uid, 'brouillonsAutomatismes')),
    // Lecture facultative : tant que les regles Firestore ne connaissent pas
    // devoirsMasques, un refus ne doit pas casser toute la page.
    getDocs(collection(db, 'eleves', uid, 'devoirsMasques')).catch((erreur) => {
      console.warn('Devoirs : devoirs retirés illisibles.', erreur);
      return null;
    }),
  ]);
  const masques = new Set(instMasques ? instMasques.docs.map((d) => d.id) : []);

  // Ciblage individuel d'un devoir "Hors classe" (voir devoirs.js) : un
  // devoir dont `eleves` existe ne concerne que les uid qu'il liste.
  const devoirs = instDevoirs.docs
    .map((d) => appliquerDerogation({ id: d.id, ...d.data() }, uid)) // echeance / essais propres a l'eleve
    .filter((d) => !Array.isArray(d.eleves) || d.eleves.includes(uid));

  const tentativesParDevoir = new Map();
  for (const t of instTentatives.docs) {
    const x = t.data();
    if (!tentativesParDevoir.has(x.devoirId)) tentativesParDevoir.set(x.devoirId, []);
    tentativesParDevoir.get(x.devoirId).push(x);
  }
  // Brouillons de fiche : un par fiche pour un devoir sur la fiche entiere
  // (cle historique, sans devoirId), un PAR DEVOIR pour un devoir sur une
  // partie de fiche (champ devoirId, voir cleBrouillon dans suivi.js).
  const brouillonParFiche = new Map(instBrouillonsFiches.docs.filter((b) => !b.data().devoirId).map((b) => [b.data().ficheId, b]));
  const brouillonParDevoirPartiel = new Map(instBrouillonsFiches.docs.filter((b) => b.data().devoirId).map((b) => [b.data().devoirId, b]));
  const brouillonParDevoir = new Map(instBrouillonsAuto.docs.map((b) => [b.id, b]));
  const brouillonsUtiles = new Set();

  const maintenant = Date.now();
  const avecStatut = devoirs.map((dv) => {
    const tentatives = tentativesParDevoir.get(dv.id) || [];
    const echeanceMillis = millis(dv.echeance);
    const actif = echeanceMillis > maintenant;
    const essaisUtilises = tentatives.length;
    const epuise = essaisUtilises >= dv.nbEssaisMax;
    const ouvert = actif && !epuise;

    // Meilleure tentative AVANT l'echeance (meme regle que la vue resultats
    // de l'enseignant, devoirs.js) : apres l'echeance, entrainement libre.
    const avantEcheance = tentatives.filter((t) => millis(t.horodatage) > 0 && millis(t.horodatage) <= echeanceMillis);
    let meilleure = null;
    for (const t of avantEcheance) { if (!meilleure || t.score > meilleure.score) meilleure = t; }
    const derniereActivite = tentatives.reduce((max, t) => Math.max(max, millis(t.horodatage)), 0);

    const partiel = Array.isArray(dv.calculs) && dv.calculs.length > 0;
    const brouillon = dv.type === 'fiche'
      ? (partiel ? brouillonParDevoirPartiel.get(dv.id) : brouillonParFiche.get(dv.ficheId))
      : brouillonParDevoir.get(dv.id);
    const enregistre = ouvert && !!brouillon;
    if (enregistre) brouillonsUtiles.add(brouillon.ref.path);

    return {
      ...dv, echeanceMillis, actif, epuise, ouvert, essaisUtilises,
      restantes: Math.max(0, dv.nbEssaisMax - essaisUtilises),
      meilleure, nbEssaisAvantEcheance: avantEcheance.length, derniereActivite,
      enregistre, enregistreMillis: enregistre ? millis(brouillon.data().horodatage) : 0,
    };
  });

  const parEcheance = (a, b) => a.echeanceMillis - b.echeanceMillis;
  const enregistres = avecStatut.filter((d) => d.enregistre).sort(parEcheance);
  const aFaire = avecStatut.filter((d) => d.ouvert && !d.enregistre).sort(parEcheance);
  const faits = avecStatut.filter((d) => !d.ouvert && !masques.has(d.id)).sort((a, b) => b.derniereActivite - a.derniereActivite);

  if (nettoyerBrouillons) {
    const perimes = [...instBrouillonsFiches.docs, ...instBrouillonsAuto.docs].filter((b) => !brouillonsUtiles.has(b.ref.path));
    await Promise.all(perimes.map((b) => deleteDoc(b.ref).catch((erreur) => console.warn('Devoirs : suppression d\'un brouillon périmé impossible.', erreur))));
    // Marqueurs « retiré de ma liste » dont le devoir n'existe plus (supprime par l'enseignant).
    if (instMasques) {
      const existants = new Set(devoirs.map((d) => d.id));
      await Promise.all(instMasques.docs.filter((m) => !existants.has(m.id))
        .map((m) => deleteDoc(m.ref).catch((erreur) => console.warn('Devoirs : marqueur périmé non supprimé.', erreur))));
    }
  }

  return { classe, nbDevoirs: devoirs.length, aFaire, enregistres, faits };
}
