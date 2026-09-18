// Outil d'attribution des devoirs (tableau-de-bord/devoirs.html), réservé à
// l'enseignant. Étape 1 de la brique "devoirs" (voir SUIVI-FIREBASE.md et
// l'artifact "Cahier de suivi") : choisir une fiche, une classe, une
// échéance et un nombre d'essais, et garder la liste de ce qui a déjà été
// attribué. La limite d'essais réellement bloquante côté fiche (étape 2)
// et le calcul de note (étape 3) ne sont PAS encore branchés ici — un
// devoir créé ici n'a, pour l'instant, aucun effet sur la fiche elle-même.
//
// Un devoir = la meilleure TENTATIVE COMPLÈTE de la fiche avant l'échéance
// (décidé avec David le 18/09/2026, pas par exercice).

import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { FICHES_PLATES } from './manifeste-fiches.js';

const zoneChargement = document.getElementById('dev-chargement');
const zoneErreur = document.getElementById('dev-erreur');
const zoneContenu = document.getElementById('dev-contenu');

const formulaire = document.getElementById('dev-formulaire');
const selectFiche = document.getElementById('dev-fiche');
const selectClasse = document.getElementById('dev-classe');
const champEcheance = document.getElementById('dev-echeance');
const champEssais = document.getElementById('dev-essais');
const boutonSoumettre = formulaire.querySelector('button[type="submit"]');
const zoneConfirmation = document.getElementById('dev-confirmation');
const zoneErreurFormulaire = document.getElementById('dev-erreur-formulaire');

const listeVide = document.getElementById('dev-liste-vide');
const tableau = document.getElementById('dev-tableau');
const corpsTableau = document.getElementById('dev-corps');

// "2nde-207" -> "207" : même raccourci que formaterClasseAffichee dans
// tableau-de-bord.js (dupliqué ici plutôt qu'importé : fonction triviale,
// pas de raison de coupler les deux pages pour ça).
function formaterClasseAffichee(classe) {
  const i = classe.lastIndexOf('-');
  return i === -1 ? classe : classe.slice(i + 1);
}

function afficherEtat(element, texte) {
  element.textContent = texte;
  element.hidden = false;
}

function masquer(element) { element.hidden = true; }

onAuthStateChanged(auth, async (utilisateur) => {
  if (!utilisateur) {
    window.location.replace('../connexion/index.html');
    return;
  }
  // Même double protection que le reste du tableau de bord : vérifiée ici
  // pour l'affichage, et par les règles Firestore (allow write: if estAdmin())
  // pour l'écriture réelle.
  const resultatToken = await utilisateur.getIdTokenResult();
  if (resultatToken.claims.admin !== true) {
    window.location.replace('../index.html');
    return;
  }
  initialiser();
});

function remplirSelectFiche() {
  let cahierCourant = null;
  let groupeCourant = null;
  for (const fiche of FICHES_PLATES) {
    if (fiche.cahier !== cahierCourant) {
      cahierCourant = fiche.cahier;
      groupeCourant = document.createElement('optgroup');
      groupeCourant.label = fiche.titre.split(' · ').slice(0, 2).join(' · ');
      selectFiche.appendChild(groupeCourant);
    }
    const option = document.createElement('option');
    option.value = fiche.ficheId;
    option.textContent = fiche.titre.split(' · ').slice(2).join(' · ');
    groupeCourant.appendChild(option);
  }
}

async function classesConnues() {
  const instantane = await getDocs(collection(db, 'eleves'));
  const classes = new Set();
  instantane.docs.forEach((d) => {
    const classe = d.data().classe;
    if (classe) classes.add(classe);
  });
  return [...classes].sort();
}

async function initialiser() {
  try {
    remplirSelectFiche();

    const classes = await classesConnues();
    if (classes.length === 0) {
      zoneChargement.hidden = true;
      afficherEtat(zoneErreur, "Aucune classe enregistrée pour l'instant — impossible d'attribuer un devoir.");
      return;
    }
    selectClasse.innerHTML = '';
    for (const classe of classes) {
      const option = document.createElement('option');
      option.value = classe;
      option.textContent = formaterClasseAffichee(classe);
      selectClasse.appendChild(option);
    }

    // Échéance par défaut : pas avant maintenant (attribut min du champ,
    // recalculé à l'ouverture de la page plutôt qu'écrit en dur dans le HTML).
    const maintenant = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
    champEcheance.min = maintenant.toISOString().slice(0, 16);

    await chargerListeDevoirs();

    zoneChargement.hidden = true;
    zoneContenu.hidden = false;
  } catch (erreur) {
    console.error(erreur);
    zoneChargement.hidden = true;
    afficherEtat(zoneErreur, "Impossible de charger les données.");
  }
}

function ficheTitreDepuisId(ficheId) {
  const fiche = FICHES_PLATES.find((f) => f.ficheId === ficheId);
  return fiche ? fiche.titre : ficheId;
}

formulaire.addEventListener('submit', async (evenement) => {
  evenement.preventDefault();
  masquer(zoneConfirmation);
  masquer(zoneErreurFormulaire);

  const ficheId = selectFiche.value;
  const classe = selectClasse.value;
  const echeance = champEcheance.value ? new Date(champEcheance.value) : null;
  const nbEssaisMax = parseInt(champEssais.value, 10);

  if (!ficheId || !classe || !echeance || !nbEssaisMax || nbEssaisMax < 1) {
    afficherEtat(zoneErreurFormulaire, 'Merci de compléter tous les champs.');
    return;
  }
  if (echeance.getTime() <= Date.now()) {
    afficherEtat(zoneErreurFormulaire, "L'échéance doit être dans le futur.");
    return;
  }

  boutonSoumettre.disabled = true;
  try {
    await addDoc(collection(db, 'devoirs'), {
      ficheId,
      ficheTitre: ficheTitreDepuisId(ficheId),
      classe,
      echeance,
      nbEssaisMax,
      creeLe: serverTimestamp(),
      creePar: auth.currentUser.email || null,
    });
    formulaire.reset();
    afficherEtat(zoneConfirmation, 'Devoir attribué.');
    await chargerListeDevoirs();
  } catch (erreur) {
    console.error(erreur);
    afficherEtat(zoneErreurFormulaire, "Échec de l'attribution — réessayer.");
  } finally {
    boutonSoumettre.disabled = false;
  }
});

async function chargerListeDevoirs() {
  const instantane = await getDocs(collection(db, 'devoirs'));
  const devoirs = instantane.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.echeance?.toMillis() || 0) - (a.echeance?.toMillis() || 0));

  if (devoirs.length === 0) {
    tableau.hidden = true;
    corpsTableau.innerHTML = '';
    afficherEtat(listeVide, 'Aucun devoir attribué pour l\'instant.');
    return;
  }
  masquer(listeVide);
  corpsTableau.innerHTML = '';

  for (const devoir of devoirs) {
    const ligne = document.createElement('tr');

    const celluleFiche = document.createElement('td');
    celluleFiche.textContent = devoir.ficheTitre || devoir.ficheId;

    const celluleClasse = document.createElement('td');
    celluleClasse.textContent = formaterClasseAffichee(devoir.classe || '—');

    const celluleEcheance = document.createElement('td');
    const echeanceMillis = devoir.echeance?.toMillis ? devoir.echeance.toMillis() : 0;
    celluleEcheance.textContent = echeanceMillis ? new Date(echeanceMillis).toLocaleString('fr-FR') : '—';

    const celluleEssais = document.createElement('td');
    celluleEssais.textContent = String(devoir.nbEssaisMax ?? '—');

    const celluleStatut = document.createElement('td');
    const enCours = echeanceMillis > Date.now();
    const badge = document.createElement('span');
    badge.className = `dev-badge ${enCours ? 'dev-badge-encours' : 'dev-badge-termine'}`;
    badge.textContent = enCours ? 'En cours' : 'Terminé';
    celluleStatut.appendChild(badge);

    const celluleAction = document.createElement('td');
    const boutonSupprimer = document.createElement('button');
    boutonSupprimer.type = 'button';
    boutonSupprimer.className = 'dev-bouton-supprimer';
    boutonSupprimer.textContent = 'Supprimer';
    boutonSupprimer.addEventListener('click', () => supprimerDevoir(devoir.id, boutonSupprimer));
    celluleAction.appendChild(boutonSupprimer);

    ligne.append(celluleFiche, celluleClasse, celluleEcheance, celluleEssais, celluleStatut, celluleAction);
    corpsTableau.appendChild(ligne);
  }
  tableau.hidden = false;
}

async function supprimerDevoir(devoirId, bouton) {
  if (!confirm('Supprimer ce devoir ? Cette action est définitive.')) return;
  bouton.disabled = true;
  masquer(zoneConfirmation);
  try {
    await deleteDoc(doc(db, 'devoirs', devoirId));
    await chargerListeDevoirs();
  } catch (erreur) {
    console.error(erreur);
    bouton.disabled = false;
    afficherEtat(zoneErreurFormulaire, 'Échec de la suppression — réessayer.');
  }
}
