// Suivi du travail des eleves connectes, sur les fiches de cahiers.
// Pilote sur une seule fiche pour l'instant (cahiers/premiere/cahier-1/fiche-01.html) ;
// voir le "Cahier de suivi" pour le contexte complet.
//
// Point d'accroche dans une fiche : les fiches sont des scripts classiques
// (pas des modules ES, trop risque de convertir un script de plus de 2000
// lignes) ; ce module s'expose donc sur window.enregistrerTentative plutot
// que d'etre importe directement. Cote fiche, un seul appel a ajouter,
// juste apres le calcul du resultat dans verifierUne() :
//
//   window.enregistrerTentative(FICHE_ID, ex.id, ok, PASSE_ACTUELLE, exercices.length);
//
// avec FICHE_ID = window.location.pathname (stable, automatique meme si la
// fiche est copiee sous un nouveau nom/chemin), PASSE_ACTUELLE un
// identifiant unique regenere a chaque nouveau passage sur la fiche
// (chargement de page ou "Generer une nouvelle fiche") -- ce qui permet au
// tableau de bord de compter les passages distincts plutot que les
// verifications individuelles --, et exercices.length le nombre total de
// questions de la fiche, pour rapporter le score au total plutot qu'au
// nombre de questions tentees.

import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

let utilisateurCourant = null;
onAuthStateChanged(auth, (u) => { utilisateurCourant = u; });

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
