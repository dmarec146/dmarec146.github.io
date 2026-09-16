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
const vueListe = document.getElementById('tdb-vue-liste');
const filtreClasse = document.getElementById('tdb-select-classe');
const corpsTableau = document.getElementById('tdb-corps');
const compteur = document.getElementById('tdb-compteur');
const boutonDeconnexion = document.getElementById('tdb-deconnexion');
const zoneDetail = document.getElementById('tdb-detail');
const detailTitre = document.getElementById('tdb-detail-titre');
const detailVide = document.getElementById('tdb-detail-vide');
const detailTableau = document.getElementById('tdb-detail-tableau');
const detailCorps = document.getElementById('tdb-detail-corps');
const boutonPrecedent = document.getElementById('tdb-detail-precedent');
const boutonSuivant = document.getElementById('tdb-detail-suivant');
const boutonRetour = document.getElementById('tdb-detail-retour');

// classe -> [eleve...] ; uid -> { activite: [...par fiche...], nbConnexions }
let elevesParClasse = new Map();
let donneesParUid = new Map();
let classeActuelle = null;
let indexActuel = 0;

function afficherEtat(element, texte) {
  element.textContent = texte;
  element.hidden = false;
}

// "2nde-207" -> "207" : le niveau (2nde/1ere/term) n'apporte rien ici,
// seul le numero de classe distingue tes groupes au meme niveau.
function formaterClasseAffichee(classe) {
  if (!classe) return '—';
  const i = classe.lastIndexOf('-');
  return i === -1 ? classe : classe.slice(i + 1);
}

// "/cahiers/premiere/cahier-1/fiche-01.html" -> "Première · Cahier 1 · Fiche 1"
function formaterFicheId(ficheId) {
  const m = ficheId.match(/\/cahiers\/(premiere|seconde)\/cahier-(\d+)\/fiche-(\d+)\.html$/);
  if (!m) return ficheId;
  const niveau = m[1] === 'premiere' ? 'Première' : 'Seconde';
  return `${niveau} · Cahier ${m[2]} · Fiche ${parseInt(m[3], 10)}`;
}

function nomAffiche(eleve) {
  return (eleve.nom || eleve.prenom)
    ? `${eleve.nom || ''} ${eleve.prenom || ''}`.trim()
    : (eleve.pseudo || '—');
}

function horodatageEnMillis(horodatage) {
  return horodatage?.toMillis ? horodatage.toMillis() : 0;
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
  chargerTout();
});

// Regroupe une liste de tentatives par fiche : score = exercices distincts
// dont la DERNIERE tentative est correcte, sur le nombre d'exercices
// distincts tentes. Le nombre de tentatives compte chaque verification
// (y compris les re-verifications d'une meme reponse).
function agregerParFiche(tentatives) {
  const parFiche = new Map();
  for (const t of tentatives) {
    if (!t.ficheId || !t.exercice) continue;
    if (!parFiche.has(t.ficheId)) parFiche.set(t.ficheId, []);
    parFiche.get(t.ficheId).push(t);
  }

  const resultats = [];
  for (const [ficheId, listeTentatives] of parFiche) {
    const derniereParExercice = new Map();
    for (const t of listeTentatives) {
      const precedente = derniereParExercice.get(t.exercice);
      if (!precedente || horodatageEnMillis(t.horodatage) >= horodatageEnMillis(precedente.horodatage)) {
        derniereParExercice.set(t.exercice, t);
      }
    }
    const dernieres = [...derniereParExercice.values()];
    const correctes = dernieres.filter((t) => t.resultat === true).length;
    const derniereActivite = listeTentatives.reduce(
      (max, t) => Math.max(max, horodatageEnMillis(t.horodatage)), 0
    );
    resultats.push({
      ficheId,
      score: `${correctes} / ${dernieres.length}`,
      nbTentatives: listeTentatives.length,
      derniereActivite,
    });
  }
  return resultats.sort((a, b) => b.derniereActivite - a.derniereActivite);
}

async function chargerTout() {
  try {
    const instantane = await getDocs(collection(db, 'eleves'));
    const eleves = instantane.docs.map((d) => ({ uid: d.id, ...d.data() }));

    await Promise.all(eleves.map(async (eleve) => {
      const [instantaneTentatives, instantaneConnexions] = await Promise.all([
        getDocs(collection(db, 'eleves', eleve.uid, 'tentatives')),
        getDocs(collection(db, 'eleves', eleve.uid, 'connexions')),
      ]);
      donneesParUid.set(eleve.uid, {
        activite: agregerParFiche(instantaneTentatives.docs.map((d) => d.data())),
        nbConnexions: instantaneConnexions.size,
      });
    }));

    elevesParClasse = new Map();
    for (const eleve of eleves) {
      const classe = eleve.classe || '—';
      if (!elevesParClasse.has(classe)) elevesParClasse.set(classe, []);
      elevesParClasse.get(classe).push(eleve);
    }
    for (const liste of elevesParClasse.values()) {
      liste.sort((a, b) => nomAffiche(a).localeCompare(nomAffiche(b)));
    }

    zoneChargement.hidden = true;

    if (eleves.length === 0) {
      afficherEtat(zoneErreur, "Aucun élève enregistré pour l'instant.");
      return;
    }

    remplirFiltreClasse();
    zoneContenu.hidden = false;
    afficherClasse(filtreClasse.value);
  } catch (erreur) {
    console.error(erreur);
    zoneChargement.hidden = true;
    afficherEtat(zoneErreur, "Impossible de charger les données.");
  }
}

function remplirFiltreClasse() {
  const classes = [...elevesParClasse.keys()].sort();
  filtreClasse.innerHTML = '';
  for (const classe of classes) {
    const option = document.createElement('option');
    option.value = classe;
    option.textContent = formaterClasseAffichee(classe);
    filtreClasse.appendChild(option);
  }
}

filtreClasse.addEventListener('change', () => afficherClasse(filtreClasse.value));

function afficherClasse(classe) {
  classeActuelle = classe;
  zoneDetail.hidden = true;
  vueListe.hidden = false;

  const eleves = elevesParClasse.get(classe) || [];
  corpsTableau.innerHTML = '';

  eleves.forEach((eleve, index) => {
    const donnees = donneesParUid.get(eleve.uid) || { activite: [], nbConnexions: 0 };
    const ligne = document.createElement('tr');
    ligne.classList.add('tdb-ligne-cliquable');
    ligne.tabIndex = 0;

    const celluleNom = document.createElement('td');
    celluleNom.textContent = nomAffiche(eleve);

    const celluleFiches = document.createElement('td');
    celluleFiches.textContent = String(donnees.activite.length);

    const celluleConnexions = document.createElement('td');
    celluleConnexions.textContent = String(donnees.nbConnexions);

    ligne.append(celluleNom, celluleFiches, celluleConnexions);

    const ouvrir = () => afficherDetail(index);
    ligne.addEventListener('click', ouvrir);
    ligne.addEventListener('keydown', (evenement) => {
      if (evenement.key === 'Enter' || evenement.key === ' ') { evenement.preventDefault(); ouvrir(); }
    });

    corpsTableau.appendChild(ligne);
  });

  compteur.textContent = `${eleves.length} élève${eleves.length > 1 ? 's' : ''}`;
}

function afficherDetail(index) {
  const eleves = elevesParClasse.get(classeActuelle) || [];
  if (index < 0 || index >= eleves.length) return;
  indexActuel = index;

  const eleve = eleves[index];
  const donnees = donneesParUid.get(eleve.uid) || { activite: [], nbConnexions: 0 };

  vueListe.hidden = true;
  zoneDetail.hidden = false;

  detailTitre.textContent = nomAffiche(eleve);

  if (donnees.activite.length === 0) {
    detailTableau.hidden = true;
    afficherEtat(detailVide, "Aucune fiche travaillée pour l'instant.");
  } else {
    detailVide.hidden = true;
    detailCorps.innerHTML = '';
    for (const item of donnees.activite) {
      const ligneDetail = document.createElement('tr');

      const celluleFiche = document.createElement('td');
      celluleFiche.textContent = formaterFicheId(item.ficheId);

      const celluleScore = document.createElement('td');
      celluleScore.textContent = item.score;

      const celluleTentatives = document.createElement('td');
      celluleTentatives.textContent = String(item.nbTentatives);

      const celluleDate = document.createElement('td');
      celluleDate.textContent = item.derniereActivite
        ? new Date(item.derniereActivite).toLocaleString('fr-FR')
        : '—';

      ligneDetail.append(celluleFiche, celluleScore, celluleTentatives, celluleDate);
      detailCorps.appendChild(ligneDetail);
    }
    detailTableau.hidden = false;
  }

  boutonPrecedent.disabled = index === 0;
  boutonSuivant.disabled = index === eleves.length - 1;

  zoneDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

boutonPrecedent.addEventListener('click', () => afficherDetail(indexActuel - 1));
boutonSuivant.addEventListener('click', () => afficherDetail(indexActuel + 1));
boutonRetour.addEventListener('click', () => afficherClasse(classeActuelle));

boutonDeconnexion.addEventListener('click', async () => {
  await signOut(auth);
  window.location.replace('../connexion/index.html');
});
