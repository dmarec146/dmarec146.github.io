// Outil d'attribution des devoirs (tableau-de-bord/devoirs.html), réservé à
// l'enseignant. Voir SUIVI-FIREBASE.md et l'artifact "Cahier de suivi" pour
// le contexte complet : choisir une fiche de cahier de calcul OU un sujet
// blanc d'automatismes (avec son niveau de difficulté), une classe, une
// échéance et un nombre d'essais ; voir la liste des devoirs attribués et,
// pour chacun, les résultats par élève (meilleure tentative complète avant
// l'échéance, enregistrée séparément par suivi.js -- voir
// enregistrerTentativeDevoirSiApplicable / enregistrerTentativeDevoirAutomatismeSiApplicable).
//
// Pas encore fait : la limite d'essais n'est pas réellement bloquante côté
// fiche/sujet blanc, le mode chrono n'est pas imposé pour les devoirs.

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
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { FICHES_PLATES } from './manifeste-fiches.js';

const zoneChargement = document.getElementById('dev-chargement');
const zoneErreur = document.getElementById('dev-erreur');
const zoneContenu = document.getElementById('dev-contenu');

const formulaire = document.getElementById('dev-formulaire');
const selectType = document.getElementById('dev-type');
const champFiche = document.getElementById('dev-champ-fiche');
const selectFiche = document.getElementById('dev-fiche');
const champNiveau = document.getElementById('dev-champ-niveau');
const selectNiveau = document.getElementById('dev-niveau');
const selectClasse = document.getElementById('dev-classe');
const champEcheance = document.getElementById('dev-echeance');
const champEssais = document.getElementById('dev-essais');
const boutonSoumettre = formulaire.querySelector('button[type="submit"]');
const zoneConfirmation = document.getElementById('dev-confirmation');
const zoneErreurFormulaire = document.getElementById('dev-erreur-formulaire');

const listeVide = document.getElementById('dev-liste-vide');
const tableau = document.getElementById('dev-tableau');
const corpsTableau = document.getElementById('dev-corps');

const vueListe = document.getElementById('dev-vue-liste');
const vueResultats = document.getElementById('dev-vue-resultats');
const resultatsTitre = document.getElementById('dev-resultats-titre');
const resultatsSousTitre = document.getElementById('dev-resultats-sous-titre');
const resultatsCorps = document.getElementById('dev-resultats-corps');
const boutonRetourResultats = document.getElementById('dev-resultats-retour');

// "2nde-207" -> "207" : même raccourci que formaterClasseAffichee dans
// tableau-de-bord.js (dupliqué ici plutôt qu'importé : fonction triviale,
// pas de raison de coupler les deux pages pour ça).
function formaterClasseAffichee(classe) {
  const i = classe.lastIndexOf('-');
  return i === -1 ? classe : classe.slice(i + 1);
}

// Même raccourci que nomAffiche dans tableau-de-bord.js (dupliqué, voir
// formaterClasseAffichee ci-dessus).
function nomAffiche(eleve) {
  return (eleve.nom || eleve.prenom)
    ? `${eleve.nom || ''} ${eleve.prenom || ''}`.trim()
    : (eleve.pseudo || '—');
}

// Même heuristique que dans tableau-de-bord.js : seule la Première a des
// automatismes avec suivi pour l'instant -- sert a ne proposer que les
// classes concernees quand "Sujet blanc d'automatismes" est choisi.
function estPremiere(classe) {
  return !!classe && classe.toLowerCase().startsWith('1ere');
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

let toutesLesClasses = [];

async function classesConnues() {
  const instantane = await getDocs(collection(db, 'eleves'));
  const classes = new Set();
  instantane.docs.forEach((d) => {
    const classe = d.data().classe;
    if (classe) classes.add(classe);
  });
  return [...classes].sort();
}

// Repeuple le select Classe -- filtre sur la Première seule quand un sujet
// blanc d'automatismes est en cours d'attribution (voir estPremiere), garde
// la valeur deja choisie si elle reste valide dans la nouvelle liste.
function remplirSelectClasse() {
  const estAutomatismes = selectType.value === 'automatismes';
  const classes = estAutomatismes ? toutesLesClasses.filter(estPremiere) : toutesLesClasses;
  const valeurPrecedente = selectClasse.value;
  selectClasse.innerHTML = '';
  for (const classe of classes) {
    const option = document.createElement('option');
    option.value = classe;
    option.textContent = formaterClasseAffichee(classe);
    selectClasse.appendChild(option);
  }
  if (classes.includes(valeurPrecedente)) selectClasse.value = valeurPrecedente;
}

selectType.addEventListener('change', () => {
  const estAutomatismes = selectType.value === 'automatismes';
  champFiche.hidden = estAutomatismes;
  selectFiche.required = !estAutomatismes;
  champNiveau.hidden = !estAutomatismes;
  remplirSelectClasse();
});

async function initialiser() {
  try {
    remplirSelectFiche();

    toutesLesClasses = await classesConnues();
    if (toutesLesClasses.length === 0) {
      zoneChargement.hidden = true;
      afficherEtat(zoneErreur, "Aucune classe enregistrée pour l'instant — impossible d'attribuer un devoir.");
      return;
    }
    remplirSelectClasse();

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

  const type = selectType.value;
  const classe = selectClasse.value;
  const echeance = champEcheance.value ? new Date(champEcheance.value) : null;
  const nbEssaisMax = parseInt(champEssais.value, 10);

  let donnees;
  if (type === 'automatismes') {
    const niveau = parseInt(selectNiveau.value, 10);
    donnees = { type, niveau, titre: `Sujet blanc — Niveau ${niveau}` };
    if (!niveau) { afficherEtat(zoneErreurFormulaire, 'Merci de choisir un niveau.'); return; }
  } else {
    const ficheId = selectFiche.value;
    donnees = { type: 'fiche', ficheId, titre: ficheTitreDepuisId(ficheId) };
    if (!ficheId) { afficherEtat(zoneErreurFormulaire, 'Merci de choisir une fiche.'); return; }
  }

  if (!classe || !echeance || !nbEssaisMax || nbEssaisMax < 1) {
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
      ...donnees,
      classe,
      echeance,
      nbEssaisMax,
      creeLe: serverTimestamp(),
      creePar: auth.currentUser.email || null,
    });
    formulaire.reset();
    selectType.dispatchEvent(new Event('change'));
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
    celluleFiche.textContent = devoir.titre || devoir.ficheId;

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

    const celluleResultats = document.createElement('td');
    const boutonResultats = document.createElement('button');
    boutonResultats.type = 'button';
    boutonResultats.className = 'tdb-bouton-secondaire';
    boutonResultats.textContent = 'Résultats';
    boutonResultats.addEventListener('click', () => afficherResultats(devoir));
    celluleResultats.appendChild(boutonResultats);

    const celluleAction = document.createElement('td');
    const boutonSupprimer = document.createElement('button');
    boutonSupprimer.type = 'button';
    boutonSupprimer.className = 'dev-bouton-supprimer';
    boutonSupprimer.textContent = 'Supprimer';
    boutonSupprimer.addEventListener('click', () => supprimerDevoir(devoir.id, boutonSupprimer));
    celluleAction.appendChild(boutonSupprimer);

    ligne.append(celluleFiche, celluleClasse, celluleEcheance, celluleEssais, celluleStatut, celluleResultats, celluleAction);
    corpsTableau.appendChild(ligne);
  }
  tableau.hidden = false;
}

// Pour chaque élève de la classe visée par ce devoir : va chercher son
// historique de tentatives sur CE devoir précis (eleves/{uid}/devoirsTentatives,
// écrit par enregistrerTentativeDevoirSiApplicable dans suivi.js), ne garde
// que celles horodatées avant l'échéance (horodatage serveur, pas une valeur
// que l'élève pourrait falsifier) et affiche la meilleure d'entre elles.
async function afficherResultats(devoir) {
  vueListe.hidden = true;
  vueResultats.hidden = false;
  resultatsTitre.textContent = devoir.titre || devoir.ficheId;
  resultatsSousTitre.textContent = 'Chargement…';
  resultatsCorps.innerHTML = '';

  const echeanceMillis = devoir.echeance?.toMillis ? devoir.echeance.toMillis() : 0;

  const instantaneEleves = await getDocs(query(collection(db, 'eleves'), where('classe', '==', devoir.classe)));
  const eleves = instantaneEleves.docs
    .map((d) => ({ uid: d.id, ...d.data() }))
    .sort((a, b) => nomAffiche(a).localeCompare(nomAffiche(b)));

  resultatsSousTitre.textContent = `Classe ${formaterClasseAffichee(devoir.classe)} — échéance le ${echeanceMillis ? new Date(echeanceMillis).toLocaleString('fr-FR') : '—'}`;

  const lignes = await Promise.all(eleves.map(async (eleve) => {
    const instantaneTentatives = await getDocs(query(
      collection(db, 'eleves', eleve.uid, 'devoirsTentatives'),
      where('devoirId', '==', devoir.id)
    ));
    const tentatives = instantaneTentatives.docs.map((d) => d.data());
    const avecMillis = tentatives.map((t) => ({ ...t, millis: t.horodatage?.toMillis ? t.horodatage.toMillis() : 0 }));
    const avantEcheance = avecMillis.filter((t) => t.millis > 0 && t.millis <= echeanceMillis);

    let meilleure = null;
    for (const t of avantEcheance) {
      if (!meilleure || t.score > meilleure.score) meilleure = t;
    }
    const derniereActivite = avecMillis.reduce((max, t) => Math.max(max, t.millis), 0);

    return { eleve, rendu: avantEcheance.length > 0, meilleure, nbEssais: avantEcheance.length, derniereActivite };
  }));

  for (const ligneDonnees of lignes) {
    const ligne = document.createElement('tr');

    const celluleNom = document.createElement('td');
    celluleNom.textContent = nomAffiche(ligneDonnees.eleve);

    const celluleRendu = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `dev-badge ${ligneDonnees.rendu ? 'dev-badge-encours' : 'dev-badge-termine'}`;
    badge.textContent = ligneDonnees.rendu ? 'Rendu' : 'Non rendu';
    celluleRendu.appendChild(badge);

    // Math.round(...*10)/10 : les notes d'automatismes (points, bareme 0,6 par
    // question) peuvent porter des artefacts de virgule flottante (0.6*7 =
    // 4.199999999996) -- sans effet sur les scores entiers des fiches de calcul.
    const celluleNote = document.createElement('td');
    celluleNote.textContent = ligneDonnees.meilleure
      ? `${Math.round(ligneDonnees.meilleure.score * 10) / 10} / ${ligneDonnees.meilleure.totalExercices}`
      : '—';

    const celluleEssais = document.createElement('td');
    celluleEssais.textContent = `${ligneDonnees.nbEssais} / ${devoir.nbEssaisMax}`;

    const celluleDate = document.createElement('td');
    celluleDate.textContent = ligneDonnees.derniereActivite
      ? new Date(ligneDonnees.derniereActivite).toLocaleString('fr-FR')
      : '—';

    ligne.append(celluleNom, celluleRendu, celluleNote, celluleEssais, celluleDate);
    resultatsCorps.appendChild(ligne);
  }
}

boutonRetourResultats.addEventListener('click', () => {
  vueResultats.hidden = true;
  vueListe.hidden = false;
});

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
