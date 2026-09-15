import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const zoneChargement = document.getElementById('tdb-chargement');
const zoneErreur = document.getElementById('tdb-erreur');
const zoneContenu = document.getElementById('tdb-contenu');
const corpsTableau = document.getElementById('tdb-corps');
const compteur = document.getElementById('tdb-compteur');
const boutonDeconnexion = document.getElementById('tdb-deconnexion');

function afficherEtat(element, texte) {
  element.textContent = texte;
  element.hidden = false;
}

onAuthStateChanged(auth, async (utilisateur) => {
  if (!utilisateur) {
    window.location.replace('../connexion/index.html');
    return;
  }
  // Page reservee a l'enseignant : le droit "admin" (custom claim, pose par
  // outils/creer-comptes --admin) est verifie ici pour l'affichage, et par
  // les regles Firestore pour la lecture reelle des donnees (double
  // protection : cote page ET cote base).
  const resultatToken = await utilisateur.getIdTokenResult();
  if (resultatToken.claims.admin !== true) {
    window.location.replace('../index.html');
    return;
  }
  chargerEleves();
});

async function chargerEleves() {
  try {
    const instantane = await getDocs(collection(db, 'eleves'));
    const eleves = instantane.docs.map((d) => d.data());
    eleves.sort((a, b) =>
      (a.classe || '').localeCompare(b.classe || '') ||
      (a.pseudo || '').localeCompare(b.pseudo || '')
    );
    afficherEleves(eleves);
  } catch (erreur) {
    console.error(erreur);
    zoneChargement.hidden = true;
    afficherEtat(zoneErreur, "Impossible de charger la liste des élèves.");
  }
}

function afficherEleves(eleves) {
  zoneChargement.hidden = true;

  if (eleves.length === 0) {
    afficherEtat(zoneErreur, "Aucun élève enregistré pour l'instant.");
    return;
  }

  corpsTableau.innerHTML = '';
  for (const eleve of eleves) {
    const ligne = document.createElement('tr');

    const celluleClasse = document.createElement('td');
    celluleClasse.textContent = eleve.classe || '—';

    const celluleIdentifiant = document.createElement('td');
    celluleIdentifiant.textContent = eleve.pseudo || '—';

    const celluleDate = document.createElement('td');
    celluleDate.textContent = eleve.creeLe?.toDate
      ? eleve.creeLe.toDate().toLocaleDateString('fr-FR')
      : '—';

    ligne.append(celluleClasse, celluleIdentifiant, celluleDate);
    corpsTableau.appendChild(ligne);
  }

  compteur.textContent = `${eleves.length} élève${eleves.length > 1 ? 's' : ''}`;
  zoneContenu.hidden = false;
}

boutonDeconnexion.addEventListener('click', async () => {
  await signOut(auth);
  window.location.replace('../connexion/index.html');
});
