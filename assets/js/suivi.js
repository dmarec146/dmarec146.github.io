// Suivi du travail des eleves connectes, sur les fiches de cahiers et les
// sujets blancs d'automatismes. Voir le "Cahier de suivi" pour le contexte
// complet, et SUIVI-FIREBASE.md pour l'etat d'avancement du cablage fiche
// par fiche.
//
// Point d'accroche dans une fiche : les fiches sont des scripts classiques
// (pas des modules ES, trop risque de convertir un script de plus de 2000
// lignes) ; ce module s'expose donc sur window.<fonction> plutot que d'etre
// importe directement.
//
// Deux modeles de suivi coexistent le temps de migrer les 44 fiches de
// calcul vers le second :
//
// - Ancien modele (enregistrerTentative, ci-dessous) : une ecriture par
//   question verifiee. Encore utilise par la plupart des fiches.
// - Nouveau modele (enregistrerBrouillon / chargerBrouillon / validerFiche,
//   plus bas) : deux documents mis a jour en place au lieu d'un journal
//   append-only, avec reprise possible d'une fiche interrompue. Voir le
//   commentaire au-dessus de enregistrerBrouillon pour le detail.

import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

let utilisateurCourant = null;
// Resolue une seule fois, au premier declenchement de onAuthStateChanged :
// permet a chargerBrouillon() (appelee au chargement de la fiche, donc
// potentiellement avant que Firebase ait fini de restaurer la session) de
// savoir quand utilisateurCourant est fiable plutot que de le lire trop tot.
let resoudreAuthPrete;
const authPrete = new Promise((resolve) => { resoudreAuthPrete = resolve; });
onAuthStateChanged(auth, (u) => { utilisateurCourant = u; resoudreAuthPrete(); });

// Identifiant de document Firestore a partir d'un chemin de fiche (qui
// contient des "/", interdits dans un id de document) : encodage reversible,
// pas besoin de le decoder puisque ficheId est aussi stocke en champ.
function idFiche(ficheId) {
  return encodeURIComponent(ficheId);
}

// Pour les fiches passees au nouveau modele : permet de n'afficher les
// boutons Enregistrer/Valider (et de conditionner ce qu'ils debloquent) que
// pour un eleve reellement connecte -- le site reste utilisable sans compte,
// et rien ne doit laisser croire a un visiteur anonyme que son travail est
// suivi. Attend authPrete pour ne jamais repondre trop tot (avant que
// Firebase ait fini de restaurer la session).
export async function estConnecte() {
  await authPrete;
  return !!utilisateurCourant;
}

// Ne bloque jamais la fiche : la correction affichee a l'eleve reste
// 100% locale (calculee avant cet appel) ; cet enregistrement n'est qu'un
// effet secondaire, silencieux en cas d'echec (hors ligne, visiteur non
// connecte, quota Firestore depasse...).
export async function enregistrerTentative(ficheId, exerciceId, resultat, passe, totalExercices) {
  if (!utilisateurCourant) return;
  try {
    await addDoc(collection(db, 'eleves', utilisateurCourant.uid, 'tentatives'), {
      ficheId,
      exercice: exerciceId,
      resultat,
      passe,
      totalExercices,
      horodatage: serverTimestamp(),
    });
  } catch (erreur) {
    console.warn('Suivi : enregistrement de la tentative impossible.', erreur);
  }
}

// Nouveau modele pour les cahiers de calcul (remplace progressivement
// enregistrerTentative ci-dessus, fiche par fiche) : au lieu d'un journal
// append-only (une ecriture par question verifiee, relu en entier par le
// tableau de bord a chaque ouverture), deux documents mis a jour en place :
//
//   eleves/{uid}/brouillons/{ficheId}  etat courant d'une fiche en pause
//                                      (ecrase a chaque clic sur "Enregistrer",
//                                      supprime des que la fiche est validee)
//   eleves/{uid}/resultats/{ficheId}   score cumule (tous passages confondus),
//                                      mis a jour a chaque clic sur "Valider"
//
// Ca resout deux problemes a la fois : la reprise d'une fiche interrompue
// (le brouillon contient les valeurs generees telles quelles, pas juste les
// identifiants d'exercices) et le volume de lectures Firestore cote tableau
// de bord (un document par fiche au lieu d'un par question repondue).
//
// Cote fiche, l'enregistrement n'est PLUS automatique a chaque question :
// un clic explicite sur "Enregistrer" ou "Valider" est necessaire, pour ne
// pas accumuler des ecritures qui ne serviraient jamais si l'eleve abandonne
// la fiche en cours de route.

// Instantane complet d'une fiche en pause : les valeurs generees (exercices,
// telles que produites par la fiche, pas regenerees a la prochaine visite)
// et l'etat de chaque reponse deja saisie (saisies, indexe par idx d'exercice
// -> { id, valeur, correct }). Ecrase le brouillon precedent s'il existe.
//
// "extra" (optionnel) : certaines fiches generent, en plus du tableau
// exercices, un etat auxiliaire pour le rendu de sections graphiques/QCM
// (ex. les parametres d'une courbe -- nom de variable different d'une fiche
// a l'autre, "paramsGraphiques", "paramsGraphique14", etc.) -- jamais lu par
// verifierUne() (qui se contente de exercices[idx]), mais necessaire pour
// reafficher exactement la meme chose a la reprise plutot qu'une nouvelle
// version generee au hasard, incoherente avec la reponse deja enregistree.
// Une fiche simple (sans un tel etat) n'a rien a passer ici.
export async function enregistrerBrouillon(ficheId, exercices, saisies, passe, extra) {
  if (!utilisateurCourant) return;
  try {
    const donnees = { ficheId, exercices, saisies, passe, horodatage: serverTimestamp() };
    if (extra !== undefined) donnees.extra = extra;
    // setDoc() refuse tout champ explicitement `undefined`, meme imbrique
    // profondement (une fiche a exercices ou etat auxiliaire genere
    // dynamiquement -- observe une fois, jamais reproduit de facon fiable
    // malgre plusieurs dizaines d'essais, donc probablement une condition de
    // course cote generation plutot qu'un champ systematiquement absent).
    // Aller-retour JSON : supprime silencieusement tout `undefined`
    // (comportement JSON standard), sans autre effet sur des donnees deja
    // 100% serialisables (exercices/saisies/extra ne contiennent que des
    // types simples). Ne s'applique qu'a exercices/extra, pas au document
    // entier (deconseille de toucher horodatage, un objet Firestore special).
    donnees.exercices = JSON.parse(JSON.stringify(donnees.exercices));
    donnees.saisies = JSON.parse(JSON.stringify(donnees.saisies));
    if (donnees.extra !== undefined) donnees.extra = JSON.parse(JSON.stringify(donnees.extra));
    await setDoc(doc(db, 'eleves', utilisateurCourant.uid, 'brouillons', idFiche(ficheId)), donnees);
  } catch (erreur) {
    console.warn('Suivi : enregistrement du brouillon impossible.', erreur);
    // Chaque fiche affiche explicitement un message de succes/echec a
    // l'eleve (voir enregistrerBrouillonActuel()) : remonter l'erreur plutot
    // que l'avaler ici, sinon la fiche affiche "enregistre" a tort alors que
    // rien n'a ete ecrit (trouve en testant reellement un cas ou setDoc()
    // rejette les donnees -- tableaux imbriques, non supportes par Firestore).
    throw erreur;
  }
}

// Lu au chargement d'une fiche pour savoir si un brouillon existe et, si
// oui, reconstruire exactement la meme fiche (memes valeurs generees) avec
// les reponses deja saisies plutot que d'en tirer une nouvelle au hasard.
// Attend authPrete : appelee tres tot au chargement de la page, avant que
// Firebase ait forcement fini de restaurer la session precedente.
export async function chargerBrouillon(ficheId) {
  await authPrete;
  if (!utilisateurCourant) return null;
  try {
    const instantane = await getDoc(doc(db, 'eleves', utilisateurCourant.uid, 'brouillons', idFiche(ficheId)));
    return instantane.exists() ? instantane.data() : null;
  } catch (erreur) {
    console.warn('Suivi : lecture du brouillon impossible.', erreur);
    return null;
  }
}

// Appelee quand un brouillon n'a plus lieu d'etre (fiche validee, ou
// l'eleve redemarre explicitement la fiche depuis zero).
export async function supprimerBrouillon(ficheId) {
  if (!utilisateurCourant) return;
  try {
    await deleteDoc(doc(db, 'eleves', utilisateurCourant.uid, 'brouillons', idFiche(ficheId)));
  } catch (erreur) {
    console.warn('Suivi : suppression du brouillon impossible.', erreur);
  }
}

// Cliquer sur "Valider" (fiche complete ou non) fusionne les reponses
// correctes de ce passage dans le score cumule de la fiche, tous passages
// confondus -- un exercice reussi une fois reste acquis, meme reussi a un
// autre passage avec d'autres valeurs generees. Supprime aussi le brouillon
// en cours : une fois validee, la fiche n'est plus "en cours" pour le
// tableau de bord.
export async function validerFiche(ficheId, exercicesReussisIds, totalExercices, nbRepondues) {
  if (!utilisateurCourant) return;
  try {
    const donnees = {
      ficheId,
      totalExercices,
      nbValidations: increment(1),
      sommeQuestionsRepondues: increment(nbRepondues),
      derniereActivite: serverTimestamp(),
    };
    if (exercicesReussisIds.length > 0) donnees.exercicesReussis = arrayUnion(...exercicesReussisIds);
    await setDoc(doc(db, 'eleves', utilisateurCourant.uid, 'resultats', idFiche(ficheId)), donnees, { merge: true });
  } catch (erreur) {
    console.warn('Suivi : validation de la fiche impossible.', erreur);
    return;
  }
  await supprimerBrouillon(ficheId);
}

// Appelee depuis connexion.js juste apres une connexion reussie. Prend le
// uid en parametre plutot que de relire utilisateurCourant (evite toute
// dependance a l'ordre entre la resolution de la connexion et le prochain
// declenchement de onAuthStateChanged).
export async function enregistrerConnexion(uid) {
  try {
    await addDoc(collection(db, 'eleves', uid, 'connexions'), {
      horodatage: serverTimestamp(),
    });
  } catch (erreur) {
    console.warn('Suivi : enregistrement de la connexion impossible.', erreur);
  }
}

// Un sujet blanc termine (mode chrono uniquement, voir automatismes/premiere/
// sujet-blanc.html et le callback onFinSerie dans assets/moteur.js). Pas de
// suivi du mode fiche (pratique libre, non notee) ni des themes abordes
// (tout est melange dans un sujet blanc).
export async function enregistrerAutomatisme(bonnes, total, points, niveau, mode) {
  if (!utilisateurCourant) return;
  try {
    await addDoc(collection(db, 'eleves', utilisateurCourant.uid, 'automatismes'), {
      bonnes,
      total,
      points,
      niveau,
      mode,
      horodatage: serverTimestamp(),
    });
  } catch (erreur) {
    console.warn('Suivi : enregistrement du sujet blanc impossible.', erreur);
  }
}

window.enregistrerTentative = enregistrerTentative;
window.enregistrerAutomatisme = enregistrerAutomatisme;
window.enregistrerBrouillon = enregistrerBrouillon;
window.chargerBrouillon = chargerBrouillon;
window.supprimerBrouillon = supprimerBrouillon;
window.validerFiche = validerFiche;
window.estConnecte = estConnecte;
