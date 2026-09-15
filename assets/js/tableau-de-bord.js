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
const activiteVide = document.getElementById('tdb-activite-vide');
const activiteTableau = document.getElementById('tdb-activite-tableau');
const activiteCorps = document.getElementById('tdb-activite-corps');

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
  chargerEleves();
});

async function chargerEleves() {
  try {
    const instantane = await getDocs(collection(db, 'eleves'));
    const eleves = instantane.docs.map((d) => ({ uid: d.id, ...d.data() }));
    eleves.sort((a, b) =>
      (a.classe || '').localeCompare(b.classe || '') ||
      (a.pseudo || '').localeCompare(b.pseudo || '')
    );
    afficherEleves(eleves);
    chargerActivite(eleves);
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
    celluleClasse.textContent = formaterClasseAffichee(eleve.classe);

    const celluleNom = document.createElement('td');
    celluleNom.textContent = (eleve.nom || eleve.prenom)
      ? `${eleve.nom || ''} ${eleve.prenom || ''}`.trim()
      : '—';

    const celluleIdentifiant = document.createElement('td');
    celluleIdentifiant.textContent = eleve.pseudo || '—';

    ligne.append(celluleClasse, celluleNom, celluleIdentifiant);
    corpsTableau.appendChild(ligne);
  }

  compteur.textContent = `${eleves.length} élève${eleves.length > 1 ? 's' : ''}`;
  zoneContenu.hidden = false;
}

// Pour chaque eleve x fiche : score = exercices distincts dont la DERNIERE
// tentative est correcte, sur le nombre d'exercices distincts tentes.
// Le nombre de tentatives, lui, compte chaque verification (y compris les
// re-verifications d'une meme reponse) : c'est le nombre de fois ou
// l'eleve a demande une correction, pas le nombre d'exercices differents.
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

async function chargerActivite(eleves) {
  try {
    const parEleve = await Promise.all(eleves.map(async (eleve) => {
      const instantane = await getDocs(collection(db, 'eleves', eleve.uid, 'tentatives'));
      const tentatives = instantane.docs.map((d) => d.data());
      return { eleve, activite: agregerParFiche(tentatives) };
    }));

    const lignes = [];
    for (const { eleve, activite } of parEleve) {
      for (const item of activite) lignes.push({ eleve, ...item });
    }
    lignes.sort((a, b) => b.derniereActivite - a.derniereActivite);

    if (lignes.length === 0) {
      activiteVide.hidden = false;
      return;
    }

    activiteCorps.innerHTML = '';
    for (const ligneDonnees of lignes) {
      const ligne = document.createElement('tr');

      const celluleIdentifiant = document.createElement('td');
      celluleIdentifiant.textContent = ligneDonnees.eleve.pseudo || '—';

      const celluleFiche = document.createElement('td');
      celluleFiche.textContent = formaterFicheId(ligneDonnees.ficheId);

      const celluleScore = document.createElement('td');
      celluleScore.textContent = ligneDonnees.score;

      const celluleTentatives = document.createElement('td');
      celluleTentatives.textContent = String(ligneDonnees.nbTentatives);

      const celluleDate = document.createElement('td');
      celluleDate.textContent = ligneDonnees.derniereActivite
        ? new Date(ligneDonnees.derniereActivite).toLocaleString('fr-FR')
        : '—';

      ligne.append(celluleIdentifiant, celluleFiche, celluleScore, celluleTentatives, celluleDate);
      activiteCorps.appendChild(ligne);
    }
    activiteTableau.hidden = false;
  } catch (erreur) {
    console.error(erreur);
    afficherEtat(activiteVide, "Impossible de charger l'activité sur les fiches.");
  }
}

boutonDeconnexion.addEventListener('click', async () => {
  await signOut(auth);
  window.location.replace('../connexion/index.html');
});
