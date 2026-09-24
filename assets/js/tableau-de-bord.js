import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged
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
const zoneDetail = document.getElementById('tdb-detail');
const detailTitre = document.getElementById('tdb-detail-titre');
const zoneOnglets = document.getElementById('tdb-detail-onglets');
const boutonOngletCalcul = document.getElementById('tdb-onglet-calcul');
const boutonOngletAutomatismes = document.getElementById('tdb-onglet-automatismes');
const zoneSectionCalcul = document.getElementById('tdb-section-calcul');
const detailVide = document.getElementById('tdb-detail-vide');
const detailTableau = document.getElementById('tdb-detail-tableau');
const detailCorps = document.getElementById('tdb-detail-corps');
const boutonPrecedent = document.getElementById('tdb-detail-precedent');
const boutonSuivant = document.getElementById('tdb-detail-suivant');
const boutonRetour = document.getElementById('tdb-detail-retour');
const zoneAutomatismes = document.getElementById('tdb-automatismes');
const automatismesContenu = document.getElementById('tdb-automatismes-contenu');

// classe -> [eleve...] ; uid -> { activite: [...par fiche...], nbConnexions }
let elevesParClasse = new Map();
let donneesParUid = new Map();
let classeActuelle = null;
let indexActuel = 0;

function afficherEtat(element, texte) {
  element.textContent = texte;
  element.hidden = false;
}

// "2nde-207" -> "207" (le niveau n'apporte rien pour une classe normale) ;
// "1ere-Gr 1" -> "1ere - Gr 1" (voir commentaire plus bas).
function formaterClasseAffichee(classe) {
  if (!classe) return '—';
  const i = classe.lastIndexOf('-');
  if (i === -1) return classe;
  const suffixe = classe.slice(i + 1);
  // Groupe de specialite (ex. "1ere-Gr 1") : prefixe par le niveau, car
  // plusieurs niveaux (Premiere, Terminale...) auront chacun leurs propres
  // groupes numerotes -- "Gr 1" seul serait ambigu entre eux (19/09/2026,
  // demande de David en prevision des groupes de Terminale a venir).
  return suffixe.startsWith('Gr') ? `${classe.slice(0, i)} - ${suffixe}` : suffixe;
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

function estPremiere(classe) {
  return !!classe && classe.toLowerCase().startsWith('1ere');
}
// La Seconde a aussi acces aux automatismes de Premiere, sans restriction
// technique (voir automatismes/premiere/) -- David a demande le 24/09/2026
// que leur suivi apparaisse aussi ici, comme pour la Premiere (Terminale
// reste a venir, pas de classe de ce niveau pour l'instant).
function estSeconde(classe) {
  return !!classe && classe.toLowerCase().startsWith('2nde');
}
// Eleve cree sans classe (voir outils/creer-comptes) : rattache a aucun niveau, il travaille sur
// tous -- son suivi affiche donc aussi les automatismes, comme pour la Premiere.
function estHorsClasse(eleve) {
  return !eleve.classe;
}
const LIBELLE_HORS_CLASSE = 'Hors classe';

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

// Regroupe une liste de tentatives par fiche. Le score mesure une MAITRISE
// CUMULEE : chaque question reussie au moins une fois compte, meme si ce
// n'est pas arrive le meme jour ni lors du meme passage -- rapportee au
// nombre TOTAL de questions de la fiche (pas seulement celles tentees),
// pour qu'un "1/1" trompeur (une seule question faite, par hasard juste)
// devienne un "1/38" qui reflete vraiment l'avancement.
//
// Le passage (champ "passe", un identifiant regenere a chaque chargement ou
// regeneration de la fiche cote eleve -- voir assets/js/suivi.js et
// cahiers/premiere/cahier-1/fiche-01.html) sert seulement a compter les
// tentatives et la moyenne de questions par tentative, pas le score.
// Tentatives anterieures a cet ajout (sans "passe") : regroupees dans un
// seul passage "_ancien" pour ne pas planter sur d'anciennes donnees.
//
//   score       = questions reussies au moins une fois / total de la fiche
//   nbTentatives = nombre de passages distincts (fiche allee au bout ou non)
//   moyenneQuestions = nombre moyen de questions distinctes faites par passage
//   derniereActivite = horodatage le plus recent, tous passages confondus
function agregerParFiche(tentatives) {
  const parFiche = new Map();
  for (const t of tentatives) {
    if (!t.ficheId || !t.exercice) continue;
    if (!parFiche.has(t.ficheId)) parFiche.set(t.ficheId, []);
    parFiche.get(t.ficheId).push(t);
  }

  const resultats = [];
  for (const [ficheId, listeTentatives] of parFiche) {
    const exercicesReussis = new Set(
      listeTentatives.filter((t) => t.resultat === true).map((t) => t.exercice)
    );
    const totalExercices = listeTentatives.reduce(
      (max, t) => Math.max(max, t.totalExercices || 0), 0
    );

    const parPasse = new Map();
    for (const t of listeTentatives) {
      const cle = t.passe || '_ancien';
      if (!parPasse.has(cle)) parPasse.set(cle, []);
      parPasse.get(cle).push(t);
    }

    const passages = [...parPasse.values()].map((tentativesPasse) => {
      const exercicesDistincts = new Set(tentativesPasse.map((t) => t.exercice));
      const finPassage = tentativesPasse.reduce(
        (max, t) => Math.max(max, horodatageEnMillis(t.horodatage)), 0
      );
      return { nbExercices: exercicesDistincts.size, finPassage };
    });

    const moyenneQuestions = passages.reduce((s, p) => s + p.nbExercices, 0) / passages.length;
    const derniereActivite = passages.reduce((max, p) => Math.max(max, p.finPassage), 0);

    resultats.push({
      ficheId,
      enCours: false,
      score: totalExercices ? `${exercicesReussis.size} / ${totalExercices}` : `${exercicesReussis.size} / ?`,
      nbTentatives: passages.length,
      moyenneQuestions: Math.round(moyenneQuestions * 10) / 10,
      totalExercices,
      derniereActivite,
    });
  }
  return resultats;
}

// Nouveau modele de suivi des cahiers de calcul (voir assets/js/suivi.js) :
// un document "resultats" par fiche validee (remplace les tentatives
// individuelles) et, tant qu'une fiche n'a pas ete validee, un document
// "brouillons" qui indique juste qu'il y a une activite en cours, sans score
// (le detail exact de la fiche en pause -- valeurs, reponses saisies -- ne
// sert qu'a la reprise cote eleve, pas a l'affichage admin).
function agregerResultats(docsResultats) {
  return docsResultats.map((d) => {
    const r = d.data();
    const bonnes = Array.isArray(r.exercicesReussis) ? r.exercicesReussis.length : 0;
    const nbValidations = r.nbValidations || 0;
    return {
      ficheId: r.ficheId,
      enCours: false,
      score: r.totalExercices ? `${bonnes} / ${r.totalExercices}` : `${bonnes} / ?`,
      nbTentatives: nbValidations,
      moyenneQuestions: nbValidations ? Math.round((r.sommeQuestionsRepondues / nbValidations) * 10) / 10 : 0,
      totalExercices: r.totalExercices || 0,
      derniereActivite: horodatageEnMillis(r.derniereActivite),
    };
  });
}

function agregerBrouillonsEnCours(docsBrouillons) {
  return docsBrouillons
    .map((d) => d.data())
    .map((b) => ({
      ficheId: b.ficheId,
      enCours: true,
      score: null,
      nbTentatives: 0,
      moyenneQuestions: 0,
      totalExercices: Array.isArray(b.exercices) ? b.exercices.length : 0,
      derniereActivite: horodatageEnMillis(b.horodatage),
    }));
}

// Trois lignes fixes (niveaux 1, 2, 3), meme si un niveau n'a jamais ete
// tente -- l'affichage decide alors quoi en faire (voir afficherDetail).
function agregerAutomatismesParNiveau(sujetsBlancs) {
  return [1, 2, 3].map((niveau) => {
    const duNiveau = sujetsBlancs.filter((s) => s.niveau === niveau);
    const notes = duNiveau.filter((s) => typeof s.points === 'number').map((s) => s.points);
    return {
      niveau,
      nbSujetsBlancs: duNiveau.length,
      noteMoyenne: notes.length ? Math.round((notes.reduce((s, n) => s + n, 0) / notes.length) * 10) / 10 : null,
    };
  });
}

async function chargerTout() {
  try {
    const instantane = await getDocs(collection(db, 'eleves'));
    const eleves = instantane.docs.map((d) => ({ uid: d.id, ...d.data() }));

    await Promise.all(eleves.map(async (eleve) => {
      const [instantaneTentatives, instantaneConnexions, instantaneAutomatismes, instantaneResultats, instantaneBrouillons] = await Promise.all([
        getDocs(collection(db, 'eleves', eleve.uid, 'tentatives')),
        getDocs(collection(db, 'eleves', eleve.uid, 'connexions')),
        getDocs(collection(db, 'eleves', eleve.uid, 'automatismes')),
        getDocs(collection(db, 'eleves', eleve.uid, 'resultats')),
        getDocs(collection(db, 'eleves', eleve.uid, 'brouillons')),
      ]);
      const sujetsBlancs = instantaneAutomatismes.docs.map((d) => d.data());

      // Ancien modele (tentatives) et nouveau modele (resultats/brouillons)
      // portent chacun sur des fiches disjointes : une fiche est cablee sur
      // l'un ou l'autre, jamais les deux (voir assets/js/suivi.js).
      const activiteAncienModele = agregerParFiche(instantaneTentatives.docs.map((d) => d.data()));
      const resultatsAgreges = agregerResultats(instantaneResultats.docs);
      const brouillonsAgreges = agregerBrouillonsEnCours(instantaneBrouillons.docs);
      // Un brouillon et un resultat peuvent coexister pour la meme fiche
      // (l'eleve a valide une fois, puis retravaille sans revalider depuis) :
      // validerFiche() supprime toujours le brouillon a la validation, donc
      // quand les deux existent le brouillon est forcement le plus recent --
      // priorite a "en cours", pas de doublon avec l'ancien score affiche.
      const ficheIdsEnCours = new Set(brouillonsAgreges.map((b) => b.ficheId));
      const resultatsAffiches = resultatsAgreges.filter((r) => !ficheIdsEnCours.has(r.ficheId));
      const activite = [...activiteAncienModele, ...resultatsAffiches, ...brouillonsAgreges]
        .sort((a, b) => b.derniereActivite - a.derniereActivite);

      donneesParUid.set(eleve.uid, {
        activite,
        nbConnexions: instantaneConnexions.size,
        automatismesParNiveau: agregerAutomatismesParNiveau(sujetsBlancs),
      });
    }));

    elevesParClasse = new Map();
    for (const eleve of eleves) {
      const classe = eleve.classe || LIBELLE_HORS_CLASSE;
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
    const donnees = donneesParUid.get(eleve.uid) || { activite: [], nbConnexions: 0, automatismesParNiveau: [] };
    const ligne = document.createElement('tr');
    ligne.classList.add('tdb-ligne-cliquable');
    ligne.tabIndex = 0;

    const celluleNom = document.createElement('td');
    celluleNom.textContent = nomAffiche(eleve);

    // Ne compte que les fiches terminees (une "en cours" -- brouillon non
    // valide -- n'est pas encore "effectuee").
    const celluleFiches = document.createElement('td');
    celluleFiches.textContent = String(donnees.activite.filter((a) => !a.enCours).length);

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
  const donnees = donneesParUid.get(eleve.uid) || { activite: [], nbConnexions: 0, automatismesParNiveau: [] };

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
      celluleFiche.textContent = formaterFicheId(item.ficheId) + (item.enCours ? ' (en cours)' : '');

      const celluleScore = document.createElement('td');
      celluleScore.textContent = item.enCours ? '—' : item.score;

      const celluleTentatives = document.createElement('td');
      celluleTentatives.textContent = item.enCours ? '—' : String(item.nbTentatives);

      const celluleMoyenne = document.createElement('td');
      celluleMoyenne.textContent = item.enCours
        ? '—'
        : (item.totalExercices ? `${item.moyenneQuestions} / ${item.totalExercices}` : `${item.moyenneQuestions} / ?`);

      const celluleDate = document.createElement('td');
      celluleDate.textContent = item.derniereActivite
        ? new Date(item.derniereActivite).toLocaleString('fr-FR')
        : '—';

      ligneDetail.append(celluleFiche, celluleScore, celluleTentatives, celluleMoyenne, celluleDate);
      detailCorps.appendChild(ligneDetail);
    }
    detailTableau.hidden = false;
  }

  if (estPremiere(eleve.classe) || estSeconde(eleve.classe) || estHorsClasse(eleve)) {
    automatismesContenu.innerHTML = '';
    for (const ligneNiveau of donnees.automatismesParNiveau) {
      const li = document.createElement('li');
      li.textContent = ligneNiveau.nbSujetsBlancs > 0
        ? `Niveau ${ligneNiveau.niveau} — note moyenne : ${ligneNiveau.noteMoyenne} / 6 · ${ligneNiveau.nbSujetsBlancs} sujet${ligneNiveau.nbSujetsBlancs > 1 ? 's' : ''} blanc${ligneNiveau.nbSujetsBlancs > 1 ? 's' : ''} effectué${ligneNiveau.nbSujetsBlancs > 1 ? 's' : ''}.`
        : `Niveau ${ligneNiveau.niveau} — aucun sujet blanc effectué.`;
      automatismesContenu.appendChild(li);
    }
    zoneOnglets.hidden = false;
    afficherOnglet('calcul');
  } else {
    // Pas d'automatismes suivis pour ce niveau : pas d'onglets, juste la
    // section cahiers de calcul, comme avant.
    zoneOnglets.hidden = true;
    zoneSectionCalcul.hidden = false;
    zoneAutomatismes.hidden = true;
  }

  boutonPrecedent.disabled = index === 0;
  boutonSuivant.disabled = index === eleves.length - 1;

  zoneDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function afficherOnglet(nom) {
  const surCalcul = nom === 'calcul';
  zoneSectionCalcul.hidden = !surCalcul;
  zoneAutomatismes.hidden = surCalcul;
  boutonOngletCalcul.classList.toggle('tdb-onglet-actif', surCalcul);
  boutonOngletAutomatismes.classList.toggle('tdb-onglet-actif', !surCalcul);
}

boutonOngletCalcul.addEventListener('click', () => afficherOnglet('calcul'));
boutonOngletAutomatismes.addEventListener('click', () => afficherOnglet('automatismes'));

boutonPrecedent.addEventListener('click', () => afficherDetail(indexActuel - 1));
boutonSuivant.addEventListener('click', () => afficherDetail(indexActuel + 1));
boutonRetour.addEventListener('click', () => afficherClasse(classeActuelle));
