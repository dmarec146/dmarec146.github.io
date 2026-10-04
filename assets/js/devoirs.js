// Outil d'attribution des devoirs (tableau-de-bord/devoirs.html), réservé à
// l'enseignant. Voir SUIVI-FIREBASE.md (§4 « Devoirs ») pour le contexte
// complet, HISTORIQUE.md pour le détail des chantiers : choisir une fiche de cahier de calcul, un sujet
// blanc d'automatismes (avec son niveau de difficulté) OU une fiche
// d'automatismes ciblée sur des thèmes choisis (28/09/2026 -- même
// document Firestore `type:'automatismes'` que le sujet blanc, distingué
// par `cible:'fiche'` + `themes`, voir suivi.js), une classe, une
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
  updateDoc,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { FICHES_PLATES } from './manifeste-fiches.js';

// Meme sentinelle que suivi.js (classeEleve()) : un eleve cree sans classe
// (voir outils/creer-comptes) n'a AUCUN champ classe sur son document
// eleves/{uid} -- Firestore ne peut pas interroger "classe absente" par
// egalite, donc un devoir attribue a ce groupe stocke litteralement
// classe:"hors-classe" ; la liste des eleves concernes (vue resultats plus
// bas) est alors retrouvee par un filtre cote client plutot qu'une requete
// where('classe','==', ...).
const CLASSE_HORS_CLASSE = 'hors-classe';

// Themes disponibles pour un devoir "Fiche d'automatismes ciblee"
// (28/09/2026) -- memes identifiants que la liste `banques` codee en dur
// dans automatismes/premiere/fiche.html, memes intitules que le champ
// `titre` declare par chaque banque (voir automatismes/premiere/banques/).
// A tenir a jour a la main si une banque est ajoutee/renommee, meme
// convention que FICHES_PLATES pour les fiches de cahier de calcul.
const THEMES_AUTOMATISMES = [
  { id: 'pourcentages', titre: 'Pourcentages' },
  { id: 'proportions', titre: 'Proportions et ordres de grandeur' },
  { id: 'calcul-numerique', titre: 'Calcul numérique' },
  { id: 'developper-factoriser', titre: 'Développer et factoriser' },
  { id: 'equations', titre: 'Équations et inéquations' },
  { id: 'droites', titre: 'Droites et repères' },
  { id: 'lectures-graphiques', titre: 'Lectures graphiques' },
  { id: 'probabilites', titre: 'Probabilités et statistiques' },
];

const zoneChargement = document.getElementById('dev-chargement');
const zoneErreur = document.getElementById('dev-erreur');
const zoneContenu = document.getElementById('dev-contenu');

const formulaire = document.getElementById('dev-formulaire');
const selectType = document.getElementById('dev-type');
const champFiche = document.getElementById('dev-champ-fiche');
const selectFiche = document.getElementById('dev-fiche');
const champNiveau = document.getElementById('dev-champ-niveau');
const selectNiveau = document.getElementById('dev-niveau');
const champMode = document.getElementById('dev-champ-mode');
const selectMode = document.getElementById('dev-mode');
const champDuree = document.getElementById('dev-champ-duree');
const selectDuree = document.getElementById('dev-duree');
const champThemes = document.getElementById('dev-champ-themes');
const listeThemes = document.getElementById('dev-themes-liste');
const champCalculs = document.getElementById('dev-champ-calculs');
const listeCalculs = document.getElementById('dev-calculs-liste');
const etatCalculs = document.getElementById('dev-calculs-etat');
const selectClasse = document.getElementById('dev-classe');
const champEleves = document.getElementById('dev-champ-eleves');
const listeEleves = document.getElementById('dev-eleves-liste');
const champEcheance = document.getElementById('dev-echeance');
const champEssais = document.getElementById('dev-essais');
const boutonSoumettre = document.getElementById('dev-bouton-soumettre');
const boutonAnnulerEdition = document.getElementById('dev-bouton-annuler-edition');
const titreFormulaire = document.getElementById('dev-formulaire-titre');
const zoneConfirmation = document.getElementById('dev-confirmation');
const zoneErreurFormulaire = document.getElementById('dev-erreur-formulaire');

const titreEnCours = document.getElementById('dev-encours-titre');
const listeVideEnCours = document.getElementById('dev-encours-vide');
const tableauEnCours = document.getElementById('dev-tableau-encours');
const corpsEnCours = document.getElementById('dev-corps-encours');
const titreFaits = document.getElementById('dev-faits-titre');
const listeVideFaits = document.getElementById('dev-faits-vide');
const tableauFaits = document.getElementById('dev-tableau-faits');
const corpsFaits = document.getElementById('dev-corps-faits');
const boutonSupprimerTousFaits = document.getElementById('dev-bouton-supprimer-tous-faits');

const boutonAttribuer = document.getElementById('dev-bouton-attribuer');
const boutonEnCours = document.getElementById('dev-bouton-encours');
const boutonDevoirsFaits = document.getElementById('dev-bouton-devoirs-faits');
const panneauAttribuer = document.getElementById('dev-panneau-attribuer');
const panneauEnCours = document.getElementById('dev-panneau-encours');
const panneauFaits = document.getElementById('dev-panneau-faits');

const vueListe = document.getElementById('dev-vue-liste');
const vueResultats = document.getElementById('dev-vue-resultats');
const resultatsTitre = document.getElementById('dev-resultats-titre');
const resultatsSousTitre = document.getElementById('dev-resultats-sous-titre');
const resultatsCorps = document.getElementById('dev-resultats-corps');
const boutonRetourResultats = document.getElementById('dev-resultats-retour');

// "2nde-207" -> "207", mais "1ere-Gr 1" -> "1ere - Gr 1" (groupe de
// specialite prefixe par le niveau, plusieurs niveaux auront chacun leurs
// groupes numerotes -- voir tableau-de-bord.js) : même raccourci que
// formaterClasseAffichee dans tableau-de-bord.js (dupliqué ici plutôt
// qu'importé : fonction triviale, pas de raison de coupler les deux pages
// pour ça).
function formaterClasseAffichee(classe) {
  if (classe === CLASSE_HORS_CLASSE) return 'Hors classe';
  const i = classe.lastIndexOf('-');
  if (i === -1) return classe;
  const suffixe = classe.slice(i + 1);
  return suffixe.startsWith('Gr') ? `${classe.slice(0, i)} - ${suffixe}` : suffixe;
}

// Même raccourci que nomAffiche dans tableau-de-bord.js (dupliqué, voir
// formaterClasseAffichee ci-dessus).
function nomAffiche(eleve) {
  return (eleve.nom || eleve.prenom)
    ? `${eleve.nom || ''} ${eleve.prenom || ''}`.trim()
    : (eleve.pseudo || '—');
}

function afficherEtat(element, texte) {
  element.textContent = texte;
  element.hidden = false;
}

function masquer(element) { element.hidden = true; }

// Les trois panneaux (formulaire d'attribution / "Devoirs en cours" /
// "Devoirs faits" -- ce dernier ajoute le 24/09/2026, David : distinguer
// dans la liste ce qui reste actionnable de ce qui est termine, plutot
// qu'un seul tableau melangeant les deux avec une colonne Statut) sont
// replies par defaut et s'ouvrent au clic sur leur bouton -- mutuellement
// exclusifs (ouvrir l'un referme les deux autres) pour eviter une page trop
// chargee.
const PANNEAUX = [
  { bouton: boutonAttribuer, panneau: panneauAttribuer },
  { bouton: boutonEnCours, panneau: panneauEnCours },
  { bouton: boutonDevoirsFaits, panneau: panneauFaits },
];

function fermerTousLesPanneaux() {
  for (const { bouton, panneau } of PANNEAUX) {
    panneau.hidden = true;
    bouton.setAttribute('aria-expanded', 'false');
    bouton.classList.remove('dev-action-actif');
  }
}

function ouvrirPanneau(cible) {
  cible.panneau.hidden = false;
  cible.bouton.setAttribute('aria-expanded', 'true');
  cible.bouton.classList.add('dev-action-actif');
}

// Clic sur un bouton deja ouvert = referme (comme avant), clic sur un autre
// = bascule dessus.
function basculerPanneau(cible) {
  const etaitOuvert = !cible.panneau.hidden;
  fermerTousLesPanneaux();
  if (!etaitOuvert) ouvrirPanneau(cible);
}

// Fermer le panneau d'attribution (par l'un ou l'autre bouton) alors qu'une
// edition est en cours l'abandonne -- annulerEdition() est definie plus bas
// mais deja hissee (declaration de fonction) au moment ou ce clic peut se
// produire.
boutonAttribuer.addEventListener('click', () => {
  const allaitFermer = !panneauAttribuer.hidden;
  basculerPanneau(PANNEAUX[0]);
  if (allaitFermer && devoirEnEdition) annulerEdition();
  // Ouverture du panneau : lit (une fois) les calculs de la fiche affichee.
  if (!allaitFermer && !devoirEnEdition) mettreAJourChampCalculs();
});
boutonEnCours.addEventListener('click', () => {
  if (devoirEnEdition) annulerEdition();
  basculerPanneau(PANNEAUX[1]);
});
boutonDevoirsFaits.addEventListener('click', () => {
  if (devoirEnEdition) annulerEdition();
  basculerPanneau(PANNEAUX[2]);
});

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

// Rempli par classesConnues() ci-dessous, en meme temps que la detection de
// la sentinelle "hors-classe" (un seul passage sur la collection eleves) :
// liste des eleves sans champ classe, pour la case a cocher individuelle
// ajoutee le 24/09/2026 (David : pouvoir choisir precisement QUI, dans le
// groupe hors classe, est concerne par un devoir plutot que tout le groupe
// d'office).
let elevesHorsClasse = [];

// Devoir en cours de modification (voir modifierDevoir ci-dessous) -- null
// en mode creation normale. Le formulaire est le MEME dans les deux cas
// (pre-rempli le temps de l'edition), seul ce qui se passe a la soumission
// change (addDoc vs updateDoc, voir l'ecouteur "submit").
let devoirEnEdition = null;

// Ajoute la sentinelle "hors-classe" (voir plus haut) des qu'au moins un
// eleve n'a aucun champ classe -- sinon ce groupe resterait invisible dans
// le select d'attribution (bug signale le 24/09/2026, David : un eleve hors
// classe cree la veille n'apparaissait pas dans la liste des classes).
async function classesConnues() {
  const instantane = await getDocs(collection(db, 'eleves'));
  const classes = new Set();
  elevesHorsClasse = [];
  instantane.docs.forEach((d) => {
    const classe = d.data().classe;
    if (classe) classes.add(classe);
    else elevesHorsClasse.push({ uid: d.id, ...d.data() });
  });
  elevesHorsClasse.sort((a, b) => nomAffiche(a).localeCompare(nomAffiche(b)));
  const liste = [...classes].sort();
  if (elevesHorsClasse.length > 0) liste.push(CLASSE_HORS_CLASSE);
  return liste;
}

// Case a cocher par eleve hors classe, affichee seulement quand "Hors
// classe" est la classe choisie (voir mettreAJourChampEleves). `selectionnes`
// (optionnel, utilise par modifierDevoir) : uid deja cibles par le devoir en
// cours d'edition -- absent (creation, ou devoir existant sans champ
// `eleves`, cree avant ce chantier) veut dire "tout le monde coche par
// defaut", pour ne pas forcer un re-cochage manuel de la totalite du groupe
// a chaque nouvelle attribution.
function remplirListeEleves(selectionnes) {
  listeEleves.innerHTML = '';
  for (const eleve of elevesHorsClasse) {
    const ligne = document.createElement('label');
    ligne.className = 'dev-eleve-ligne';
    const case_ = document.createElement('input');
    case_.type = 'checkbox';
    case_.value = eleve.uid;
    case_.checked = !selectionnes || selectionnes.includes(eleve.uid);
    ligne.append(case_, document.createTextNode(nomAffiche(eleve)));
    listeEleves.appendChild(ligne);
  }
}

// Case a cocher par theme, pour un devoir "Fiche d'automatismes ciblee"
// (28/09/2026) -- meme principe que remplirListeEleves ci-dessus, mais tout
// decoche par defaut (contrairement aux eleves hors classe, ou tout cocher
// par defaut evite un recochage manuel du groupe entier) : ici, un choix
// explicite du professeur est attendu a chaque attribution, pas un sous-
// ensemble implicite. `selectionnes` (optionnel, utilise par modifierDevoir)
// : themes deja cibles par le devoir en cours d'edition.
function remplirListeThemes(selectionnes) {
  listeThemes.innerHTML = '';
  for (const theme of THEMES_AUTOMATISMES) {
    const ligne = document.createElement('label');
    ligne.className = 'dev-eleve-ligne';
    const case_ = document.createElement('input');
    case_.type = 'checkbox';
    case_.value = theme.id;
    case_.checked = !!(selectionnes && selectionnes.includes(theme.id));
    ligne.append(case_, document.createTextNode(theme.titre));
    listeThemes.appendChild(ligne);
  }
}

// ---------- Devoir sur une partie de fiche (04/10/2026) ----------
// Pour une fiche "cablee" (qui charge assets/js/devoir-partiel.js), le
// formulaire propose les calculs de la fiche a cocher ; rien de coche (ou
// tout coche) = la fiche entiere, comportement habituel. La liste n'est pas
// tenue a la main : elle est lue dans la fiche elle-meme, chargee dans une
// iframe hors ecran (titres construits en JavaScript compris), ce qui sert
// aussi de test "fiche cablee ?" (presence de window.DevoirPartiel) -- une
// fiche pas encore cablee ne propose pas le choix, plutot que de laisser
// creer un devoir "partiel" qu'elle ferait faire en entier sans rien dire.
let calculsFiche = null;       // [{num, section, titre}] de la fiche choisie, ou null
let ficheCalculsLue = null;    // ficheId pour lequel calculsFiche est a jour
let jetonCalculs = 0;          // ignore une lecture rendue obsolete par un nouveau choix
let lectureCalculsEnCours = false;
let lectureCalculsEnEchec = false;

const attendre = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Charge la fiche dans une iframe hors ecran, attend qu'elle ait construit ses
// grilles et compose ses formules, puis renvoie DevoirPartiel.listeCalculs()
// (null si la fiche n'est pas cablee). L'iframe est toujours retiree.
function lireCalculsDeLaFiche(ficheId) {
  return new Promise((resolve, reject) => {
    const cadre = document.createElement('iframe');
    cadre.setAttribute('aria-hidden', 'true');
    cadre.tabIndex = -1;
    cadre.style.cssText = 'position:fixed;left:-10000px;top:0;width:1000px;height:900px;border:0;opacity:0;pointer-events:none;';
    const fin = (valeur, erreur) => {
      clearTimeout(delai);
      cadre.remove();
      if (erreur) reject(erreur); else resolve(valeur);
    };
    const delai = setTimeout(() => fin(null, new Error('delai depasse')), 30000);
    cadre.addEventListener('load', async () => {
      try {
        const fenetre = cadre.contentWindow;
        if (!fenetre.DevoirPartiel) { fin(null); return; }
        const debut = Date.now();
        while (fenetre.document.querySelectorAll('.question').length === 0 && Date.now() - debut < 20000) await attendre(150);
        if (fenetre.MathJax && fenetre.MathJax.typesetPromise) {
          try { await fenetre.MathJax.typesetPromise(); } catch (e) { /* titres lisibles meme sans composition */ }
        }
        fin(fenetre.DevoirPartiel.listeCalculs());
      } catch (erreur) {
        fin(null, erreur);
      }
    });
    cadre.src = ficheId;
    document.body.appendChild(cadre);
  });
}

function nbCalculsCoches() {
  return listeCalculs.querySelectorAll('input[value]:checked').length;
}

function mettreAJourResumeCalculs() {
  if (!calculsFiche) return;
  const n = nbCalculsCoches();
  etatCalculs.textContent = n === 0
    ? 'Aucun calcul coché : le devoir porte sur la fiche entière. Coche des calculs pour ne donner qu\'une partie de la fiche.'
    : `${n} calcul${n > 1 ? 's' : ''} retenu${n > 1 ? 's' : ''} sur ${calculsFiche.length} : les autres seront masqués pour les élèves et la note sera « bonnes réponses / questions retenues ».`;
  if (listeCalculs.querySelector('input:disabled')) {
    etatCalculs.textContent += ' Sélection verrouillée : des élèves ont déjà fait des tentatives sur ce devoir.';
  }
}

function remplirListeCalculs(calculs, preselection, verrouille) {
  listeCalculs.innerHTML = '';
  const parSection = new Map();
  for (const calcul of calculs) {
    if (!parSection.has(calcul.section)) parSection.set(calcul.section, []);
    parSection.get(calcul.section).push(calcul);
  }
  for (const [section, items] of parSection) {
    const entete = document.createElement('label');
    entete.className = 'dev-eleve-ligne dev-calculs-section';
    const caseSection = document.createElement('input');
    caseSection.type = 'checkbox';
    caseSection.disabled = !!verrouille;
    entete.append(caseSection, document.createTextNode(section || 'Calculs'));
    listeCalculs.appendChild(entete);

    const cases = items.map((calcul) => {
      const ligne = document.createElement('label');
      ligne.className = 'dev-eleve-ligne dev-calculs-ligne';
      ligne.title = calcul.titre;
      const case_ = document.createElement('input');
      case_.type = 'checkbox';
      case_.value = calcul.num;
      case_.dataset.titre = calcul.titre;
      case_.checked = !!(preselection && preselection.includes(calcul.num));
      case_.disabled = !!verrouille;
      const texte = document.createElement('span');
      const numero = document.createElement('span');
      numero.className = 'dev-calculs-num';
      numero.textContent = `Calcul ${calcul.num}`;
      const titre = calcul.titre.length > 130 ? `${calcul.titre.slice(0, 127)}…` : calcul.titre;
      texte.append(numero, document.createTextNode(titre ? ` — ${titre}` : ''));
      ligne.append(case_, texte);
      listeCalculs.appendChild(ligne);
      return case_;
    });

    const majSection = () => {
      const n = cases.filter((c) => c.checked).length;
      caseSection.checked = n === cases.length;
      caseSection.indeterminate = n > 0 && n < cases.length;
    };
    caseSection.addEventListener('change', () => {
      cases.forEach((c) => { c.checked = caseSection.checked; });
      caseSection.indeterminate = false;
      mettreAJourResumeCalculs();
    });
    cases.forEach((c) => c.addEventListener('change', () => { majSection(); mettreAJourResumeCalculs(); }));
    majSection();
  }
  mettreAJourResumeCalculs();
}

// (Re)lit les calculs de la fiche choisie et remplit la liste. `forcer` :
// relire meme si la fiche n'a pas change (edition d'un devoir existant, avec sa
// selection `preselection` et un eventuel verrouillage).
async function mettreAJourChampCalculs({ preselection = null, verrouille = false, forcer = false } = {}) {
  const ficheId = selectFiche.value;
  if (selectType.value !== 'fiche' || !ficheId) {
    jetonCalculs++;
    champCalculs.hidden = true;
    calculsFiche = null;
    ficheCalculsLue = null;
    lectureCalculsEnCours = false;
    return;
  }
  champCalculs.hidden = false;
  // Rien a lire tant que le panneau d'attribution est ferme (charger une
  // fiche entiere dans une iframe a chaque creation de devoir serait du
  // gaspillage) ; la lecture se fait a l'ouverture du panneau.
  if (!forcer && panneauAttribuer.hidden) return;
  if (!forcer && ficheCalculsLue === ficheId) return;

  const jeton = ++jetonCalculs;
  calculsFiche = null;
  ficheCalculsLue = null;
  lectureCalculsEnEchec = false;
  lectureCalculsEnCours = true;
  listeCalculs.hidden = true;
  listeCalculs.innerHTML = '';
  etatCalculs.textContent = 'Lecture des calculs de la fiche…';
  try {
    const calculs = await lireCalculsDeLaFiche(ficheId);
    if (jeton !== jetonCalculs) return;
    ficheCalculsLue = ficheId;
    if (!calculs) {
      etatCalculs.textContent = 'Le choix des calculs n\'est pas encore disponible pour cette fiche : le devoir portera sur la fiche entière.';
    } else if (calculs.length === 0) {
      etatCalculs.textContent = 'Aucun calcul repéré dans cette fiche : le devoir portera sur la fiche entière.';
    } else {
      calculsFiche = calculs;
      listeCalculs.hidden = false;
      remplirListeCalculs(calculs, preselection, verrouille);
    }
  } catch (erreur) {
    if (jeton !== jetonCalculs) return;
    console.warn('Devoirs : lecture des calculs de la fiche impossible.', erreur);
    lectureCalculsEnEchec = true;
    etatCalculs.textContent = 'Lecture des calculs de la fiche impossible. Re-sélectionne la fiche pour réessayer.';
  } finally {
    if (jeton === jetonCalculs) lectureCalculsEnCours = false;
  }
}

// Selection courante : { calculs, calculsTitres } pour un devoir partiel, ou
// null pour la fiche entiere (rien de coche, tout coche, ou fiche non cablee).
function selectionCalculs() {
  if (!calculsFiche) return null;
  const cochees = [...listeCalculs.querySelectorAll('input[value]:checked')];
  if (cochees.length === 0 || cochees.length === calculsFiche.length) return null;
  return {
    calculs: cochees.map((c) => c.value),
    calculsTitres: cochees.map((c) => (c.dataset.titre || '').slice(0, 100)),
  };
}

// Phrase ajoutee au titre du devoir : "9.4 et 9.6", "9.1, 9.2 et 9.5".
function phraseCalculs(calculs) {
  const liste = calculs.length > 1 ? `${calculs.slice(0, -1).join(', ')} et ${calculs[calculs.length - 1]}` : calculs[0];
  return `calcul${calculs.length > 1 ? 's' : ''} ${liste}`;
}

// Des eleves ont-ils deja fait au moins une tentative sur ce devoir ? Alors la
// selection de calculs n'est plus modifiable : les notes deja enregistrees
// (x / nombre de questions retenues) ne seraient plus sur la meme base. Meme
// parcours des eleves concernes que la vue "Resultats" (afficherResultats).
async function devoirADesTentatives(devoir) {
  const eleves = devoir.classe === CLASSE_HORS_CLASSE
    ? (await getDocs(collection(db, 'eleves'))).docs.filter((d) =>
        !d.data().classe && (!Array.isArray(devoir.eleves) || devoir.eleves.includes(d.id)))
    : (await getDocs(query(collection(db, 'eleves'), where('classe', '==', devoir.classe)))).docs;
  const comptes = await Promise.all(eleves.map(async (e) => (await getDocs(query(
    collection(db, 'eleves', e.id, 'devoirsTentatives'),
    where('devoirId', '==', devoir.id)
  ))).size));
  return comptes.some((n) => n > 0);
}

// Affiche/masque la case a cocher selon la classe choisie, et la peuple a la
// demande (jamais utile hors "Hors classe"). Appelee au changement de classe
// ET au changement de type (qui repeuple entierement le select classe, voir
// remplirSelectClasse) -- toujours apres l'un ou l'autre pour rester
// synchronisee avec la valeur reellement affichee.
function mettreAJourChampEleves(selectionnes) {
  const estHorsClasse = selectClasse.value === CLASSE_HORS_CLASSE;
  champEleves.hidden = !estHorsClasse;
  if (estHorsClasse) remplirListeEleves(selectionnes);
}
selectClasse.addEventListener('change', () => mettreAJourChampEleves());

// Repeuple le select Classe. Plus de filtre par niveau pour un sujet blanc
// d'automatismes (jusqu'au 24/09/2026, seule la Première etait proposee :
// David voulait aussi pouvoir attribuer un devoir d'automatismes de
// Premiere a une classe de Seconde, qui y a deja acces en pratique libre
// sans restriction technique -- voir automatismes/premiere/, aucune garde
// de classe). Garde la valeur deja choisie si elle reste valide.
function remplirSelectClasse() {
  const classes = toutesLesClasses;
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

// Le champ Duree ne s'affiche qu'en mode chrono (comme le panneau "Temps
// par question" sur la page du sujet blanc elle-meme -- voir moteur.js,
// masque en mode fiche) : depend a la fois du type ET du mode, d'ou une
// fonction a part plutot que de dupliquer la logique dans les deux
// ecouteurs de changement (type et mode).
// Les deux variantes "automatismes" (sujet blanc et fiche ciblee) partagent
// niveau/mode/duree -- seule la fiche ciblee ajoute le champ themes (voir
// listener ci-dessous).
function estTypeAutomatismes(valeur) {
  return valeur === 'automatismes' || valeur === 'automatismes-fiche';
}

function mettreAJourChampDuree() {
  champDuree.hidden = !estTypeAutomatismes(selectType.value) || selectMode.value !== 'chrono';
}

selectType.addEventListener('change', () => {
  const valeur = selectType.value;
  const estFiche = valeur === 'fiche';
  const estAutomatismes = estTypeAutomatismes(valeur);
  const estAutomatismesCible = valeur === 'automatismes-fiche';
  champFiche.hidden = !estFiche;
  selectFiche.required = estFiche;
  champNiveau.hidden = !estAutomatismes;
  champMode.hidden = !estAutomatismes;
  champThemes.hidden = !estAutomatismesCible;
  if (estAutomatismesCible) remplirListeThemes();
  mettreAJourChampDuree();
  remplirSelectClasse();
  mettreAJourChampEleves();
  // Aussi appele apres chaque formulaire.reset() (creation, annulation) :
  // oublier la fiche deja lue force une liste de calculs neuve, ni cochee ni
  // verrouillee par l'edition precedente.
  ficheCalculsLue = null;
  mettreAJourChampCalculs();
});

selectFiche.addEventListener('change', () => mettreAJourChampCalculs());

selectMode.addEventListener('change', mettreAJourChampDuree);

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
    mettreAJourChampEleves();

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

// "YYYY-MM-DDTHH:MM" en heure locale, format attendu par un <input
// type="datetime-local"> -- meme calcul que pour champEcheance.min plus
// haut (initialiser()), reutilise ici pour pre-remplir une echeance
// existante en mode edition.
function dateLocalePourChamp(millis) {
  const d = new Date(millis - new Date().getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}

// Ouvre le panneau d'attribution pre-rempli avec les valeurs d'un devoir
// existant (voir le bouton "Modifier" dans chargerListeDevoirs) : le
// formulaire est le MEME qu'a la creation, seule la soumission change
// (voir l'ecouteur "submit" plus bas, qui teste devoirEnEdition).
function modifierDevoir(devoir) {
  devoirEnEdition = devoir;
  masquer(zoneConfirmation);
  masquer(zoneErreurFormulaire);

  // Un devoir 'automatismes' avec cible:'fiche' se re-selectionne dans le
  // type "automatismes-fiche" du formulaire (concept purement cote UI, voir
  // le listener "submit" plus bas qui le retraduit en type:'automatismes',
  // cible:'fiche' a l'ecriture).
  const estFicheCiblee = devoir.type === 'automatismes' && devoir.cible === 'fiche';
  selectType.value = estFicheCiblee ? 'automatismes-fiche' : devoir.type;
  selectType.dispatchEvent(new Event('change'));
  if (devoir.type === 'automatismes') {
    selectNiveau.value = String(devoir.niveau);
    selectMode.value = devoir.mode;
    selectMode.dispatchEvent(new Event('change'));
    if (devoir.mode === 'chrono') selectDuree.value = String(devoir.duree);
    if (estFicheCiblee) remplirListeThemes(devoir.themes);
  } else {
    selectFiche.value = devoir.ficheId;
  }
  // Apres le "change" sur selectType (qui repeuple selectClasse, voir
  // remplirSelectClasse) : la classe du devoir doit rester dans la liste
  // puisque c'est forcement une classe deja utilisee par ce devoir.
  selectClasse.value = devoir.classe;
  // Assigner .value ne declenche pas de "change" -- rappel manuel pour que
  // la case a cocher hors-classe apparaisse/se peuple si besoin, pre-cochee
  // sur les eleves deja cibles par ce devoir (devoir.eleves absent = devoir
  // cree avant ce chantier, s'appliquait a tout le groupe : tout coche).
  mettreAJourChampEleves(devoir.eleves);
  if (devoir.echeance?.toMillis) champEcheance.value = dateLocalePourChamp(devoir.echeance.toMillis());
  champEssais.value = String(devoir.nbEssaisMax);

  titreFormulaire.textContent = 'Modifier ce devoir';
  boutonSoumettre.textContent = 'Enregistrer les modifications';
  boutonAnnulerEdition.hidden = false;

  fermerTousLesPanneaux();
  ouvrirPanneau(PANNEAUX[0]);
  panneauAttribuer.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Devoir de fiche : relit les calculs de la fiche avec la selection du
  // devoir. Verrouillee (cases grisees) des qu'un eleve a deja fait une
  // tentative, partiel ou non -- sinon les notes deja enregistrees ne
  // seraient plus sur la meme base ; en cas de doute (lecture impossible),
  // par prudence, verrouillee aussi.
  if (devoir.type === 'fiche') {
    (async () => {
      let verrouille = false;
      try { verrouille = await devoirADesTentatives(devoir); } catch (erreur) { verrouille = true; }
      if (devoirEnEdition !== devoir) return;
      await mettreAJourChampCalculs({ preselection: Array.isArray(devoir.calculs) ? devoir.calculs : null, verrouille, forcer: true });
    })();
  }
}

function annulerEdition() {
  devoirEnEdition = null;
  formulaire.reset();
  selectType.dispatchEvent(new Event('change'));
  titreFormulaire.textContent = 'Attribuer un nouveau devoir';
  boutonSoumettre.textContent = 'Attribuer ce devoir';
  boutonAnnulerEdition.hidden = true;
  masquer(zoneConfirmation);
  masquer(zoneErreurFormulaire);
}
boutonAnnulerEdition.addEventListener('click', annulerEdition);

formulaire.addEventListener('submit', async (evenement) => {
  evenement.preventDefault();
  masquer(zoneConfirmation);
  masquer(zoneErreurFormulaire);

  const type = selectType.value;
  const classe = selectClasse.value;
  const echeance = champEcheance.value ? new Date(champEcheance.value) : null;
  const nbEssaisMax = parseInt(champEssais.value, 10);

  let donnees;
  if (estTypeAutomatismes(type)) {
    const niveau = parseInt(selectNiveau.value, 10);
    const mode = selectMode.value;
    const libelleMode = mode === 'chrono' ? 'chrono' : 'fiche';
    if (type === 'automatismes-fiche') {
      const themes = [...listeThemes.querySelectorAll('input:checked')].map((c) => c.value);
      if (themes.length === 0) { afficherEtat(zoneErreurFormulaire, 'Merci de choisir au moins un thème.'); return; }
      const libellesThemes = THEMES_AUTOMATISMES.filter((t) => themes.includes(t.id)).map((t) => t.titre);
      donnees = {
        type: 'automatismes', cible: 'fiche', themes, niveau, mode,
        titre: `Fiche d'automatismes — ${libellesThemes.join(', ')} — Niveau ${niveau} (mode ${libelleMode})`,
      };
    } else {
      donnees = { type: 'automatismes', cible: 'sujet-blanc', niveau, mode, titre: `Sujet blanc — Niveau ${niveau} (mode ${libelleMode})` };
    }
    // La duree (temps par question) n'a de sens qu'en mode chrono -- comme
    // le panneau correspondant sur la page du sujet blanc elle-meme,
    // absente du document pour un devoir en mode fiche.
    if (mode === 'chrono') {
      const duree = parseInt(selectDuree.value, 10);
      donnees.duree = duree;
      donnees.titre += ` — ${selectDuree.options[selectDuree.selectedIndex].textContent}/question`;
    }
    if (!niveau) { afficherEtat(zoneErreurFormulaire, 'Merci de choisir un niveau.'); return; }
  } else {
    const ficheId = selectFiche.value;
    if (!ficheId) { afficherEtat(zoneErreurFormulaire, 'Merci de choisir une fiche.'); return; }
    // Pas de soumission pendant la lecture des calculs : une selection encore
    // vide serait prise pour "fiche entiere" (et effacerait celle d'un devoir
    // partiel en cours de modification).
    if (lectureCalculsEnCours) {
      afficherEtat(zoneErreurFormulaire, 'Lecture des calculs de la fiche en cours — réessayer dans un instant.');
      return;
    }
    donnees = { type: 'fiche', ficheId, titre: ficheTitreDepuisId(ficheId) };
    let selection = selectionCalculs();
    // Lecture des calculs impossible pendant la modification d'un devoir
    // partiel de la MEME fiche : on garde sa selection plutot que de
    // l'effacer sans le dire.
    if (!selection && !calculsFiche && devoirEnEdition && devoirEnEdition.ficheId === ficheId
      && Array.isArray(devoirEnEdition.calculs) && devoirEnEdition.calculs.length > 0) {
      selection = { calculs: devoirEnEdition.calculs, calculsTitres: devoirEnEdition.calculsTitres || [] };
    }
    if (selection) {
      donnees.calculs = selection.calculs;
      donnees.calculsTitres = selection.calculsTitres;
      donnees.titre += ` — ${phraseCalculs(selection.calculs)}`;
    }
  }

  if (!classe || !echeance || !nbEssaisMax || nbEssaisMax < 1) {
    afficherEtat(zoneErreurFormulaire, 'Merci de compléter tous les champs.');
    return;
  }
  if (echeance.getTime() <= Date.now()) {
    afficherEtat(zoneErreurFormulaire, "L'échéance doit être dans le futur.");
    return;
  }

  // Cible individuelle (24/09/2026) : uniquement pour "Hors classe", ou le
  // groupe recouvre des eleves de niveaux differents qui n'ont en commun que
  // l'absence de classe -- une vraie classe reste ciblee dans son ensemble,
  // comme avant. Au moins un eleve coche exige (sinon le devoir ne
  // s'appliquerait litteralement a personne, voir le filtre cote suivi.js).
  let eleves = null;
  if (classe === CLASSE_HORS_CLASSE) {
    eleves = [...listeEleves.querySelectorAll('input:checked')].map((c) => c.value);
    if (eleves.length === 0) {
      afficherEtat(zoneErreurFormulaire, 'Merci de sélectionner au moins un élève.');
      return;
    }
  }

  boutonSoumettre.disabled = true;
  try {
    if (devoirEnEdition) {
      // Pas de creeLe/creePar ici : on ne touche pas aux metadonnees de
      // creation d'origine, seulement aux parametres modifies. deleteField()
      // quand la classe n'est plus "Hors classe" : un devoir modifie pour
      // viser une vraie classe ne doit garder aucune trace d'un ancien
      // ciblage individuel. Meme raisonnement etendu ici (28/09/2026, trouve
      // en ajoutant le champ themes) a `duree` et `themes` : `donnees` ne les
      // porte que quand ils s'appliquent encore (mode chrono / type "fiche
      // ciblee") -- sans deleteField() explicite, passer un devoir chrono a
      // fiche, ou une fiche ciblee a sujet blanc, laisserait une valeur
      // perimee en base (un `updateDoc` fusionne, il n'efface jamais un
      // champ absent du payload).
      await updateDoc(doc(db, 'devoirs', devoirEnEdition.id), {
        ...donnees, classe, echeance, nbEssaisMax,
        eleves: eleves ?? deleteField(),
        duree: donnees.duree ?? deleteField(),
        themes: donnees.themes ?? deleteField(),
        calculs: donnees.calculs ?? deleteField(),
        calculsTitres: donnees.calculsTitres ?? deleteField(),
      });
      annulerEdition();
      afficherEtat(zoneConfirmation, 'Devoir modifié.');
    } else {
      const nouveauDevoir = {
        ...donnees,
        classe,
        echeance,
        nbEssaisMax,
        creeLe: serverTimestamp(),
        creePar: auth.currentUser.email || null,
      };
      // Pas de champ `eleves` du tout ici si non hors-classe (plutot que
      // deleteField(), refuse par addDoc -- reserve a updateDoc).
      if (eleves) nouveauDevoir.eleves = eleves;
      await addDoc(collection(db, 'devoirs'), nouveauDevoir);
      formulaire.reset();
      selectType.dispatchEvent(new Event('change'));
      afficherEtat(zoneConfirmation, 'Devoir attribué.');
    }
    await chargerListeDevoirs();
  } catch (erreur) {
    console.error(erreur);
    afficherEtat(zoneErreurFormulaire, `Échec de l'${devoirEnEdition ? 'enregistrement' : 'attribution'} — réessayer.`);
  } finally {
    boutonSoumettre.disabled = false;
  }
});

// Une ligne de tableau pour un devoir -- partagee entre les deux listes
// ("Devoirs en cours" / "Devoirs faits", voir chargerListeDevoirs) : memes
// colonnes, seule la source (et le tri) differe, plus de colonne Statut
// (devenue redondante une fois les deux listes separees -- chaque tableau
// ne contient deja que l'un ou l'autre).
function construireLigneDevoir(devoir) {
  const ligne = document.createElement('tr');

  const celluleFiche = document.createElement('td');
  celluleFiche.textContent = devoir.titre || devoir.ficheId;

  const celluleClasse = document.createElement('td');
  celluleClasse.textContent = formaterClasseAffichee(devoir.classe || '—')
    + (devoir.classe === CLASSE_HORS_CLASSE && Array.isArray(devoir.eleves) ? ` (${devoir.eleves.length})` : '');

  const celluleEcheance = document.createElement('td');
  const echeanceMillis = devoir.echeance?.toMillis ? devoir.echeance.toMillis() : 0;
  celluleEcheance.textContent = echeanceMillis ? new Date(echeanceMillis).toLocaleString('fr-FR') : '—';

  const celluleEssais = document.createElement('td');
  celluleEssais.textContent = String(devoir.nbEssaisMax ?? '—');

  const celluleResultats = document.createElement('td');
  const boutonResultats = document.createElement('button');
  boutonResultats.type = 'button';
  boutonResultats.className = 'dev-bouton-resultats';
  boutonResultats.textContent = 'Résultats';
  boutonResultats.addEventListener('click', () => afficherResultats(devoir));
  celluleResultats.appendChild(boutonResultats);

  const celluleModifier = document.createElement('td');
  const boutonModifier = document.createElement('button');
  boutonModifier.type = 'button';
  boutonModifier.className = 'tdb-bouton-secondaire';
  boutonModifier.textContent = 'Modifier';
  boutonModifier.addEventListener('click', () => modifierDevoir(devoir));
  celluleModifier.appendChild(boutonModifier);

  const celluleAction = document.createElement('td');
  const boutonSupprimer = document.createElement('button');
  boutonSupprimer.type = 'button';
  boutonSupprimer.className = 'dev-bouton-supprimer';
  boutonSupprimer.textContent = 'Supprimer';
  boutonSupprimer.addEventListener('click', () => supprimerDevoir(devoir.id, boutonSupprimer));
  celluleAction.appendChild(boutonSupprimer);

  ligne.append(celluleFiche, celluleClasse, celluleEcheance, celluleEssais, celluleResultats, celluleModifier, celluleAction);
  return ligne;
}

// Remplit un des deux tableaux (en-cours / faits) avec sa liste de devoirs,
// ou affiche le message "vide" a la place si elle est vide -- factorise
// puisque les deux listes partagent exactement la meme mecanique d'affichage.
function remplirTableauDevoirs(corps, tableauEl, videEl, titreEl, titreBase, devoirs, texteVide) {
  titreEl.textContent = `${titreBase} (${devoirs.length})`;
  if (devoirs.length === 0) {
    tableauEl.hidden = true;
    corps.innerHTML = '';
    afficherEtat(videEl, texteVide);
    return;
  }
  masquer(videEl);
  corps.innerHTML = '';
  for (const devoir of devoirs) corps.appendChild(construireLigneDevoir(devoir));
  tableauEl.hidden = false;
}

// Devoirs "faits" actuellement affiches (voir chargerListeDevoirs plus bas)
// -- cible exacte du bouton "Tout supprimer" (dev-bouton-supprimer-tous-faits),
// ajoute le 24/09/2026 sur demande de David en plus de la suppression
// individuelle deja existante.
let devoirsFaitsActuels = [];

async function chargerListeDevoirs() {
  const instantane = await getDocs(collection(db, 'devoirs'));
  const devoirs = instantane.docs.map((d) => ({ id: d.id, ...d.data() }));
  const maintenant = Date.now();

  // "En cours" triee par echeance la plus proche (ce qui presse en premier,
  // comme /mes-devoirs/ cote eleve) ; "Faits" triee par echeance la plus
  // recente (ce qui vient de se terminer en premier).
  const enCours = devoirs
    .filter((d) => (d.echeance?.toMillis ? d.echeance.toMillis() : 0) > maintenant)
    .sort((a, b) => (a.echeance?.toMillis() || 0) - (b.echeance?.toMillis() || 0));
  const faits = devoirs
    .filter((d) => (d.echeance?.toMillis ? d.echeance.toMillis() : 0) <= maintenant)
    .sort((a, b) => (b.echeance?.toMillis() || 0) - (a.echeance?.toMillis() || 0));

  remplirTableauDevoirs(corpsEnCours, tableauEnCours, listeVideEnCours, titreEnCours, 'Devoirs en cours', enCours, "Aucun devoir en cours pour l'instant.");
  remplirTableauDevoirs(corpsFaits, tableauFaits, listeVideFaits, titreFaits, 'Devoirs faits', faits, 'Aucun devoir terminé pour l\'instant.');

  // Retenue pour le bouton "Tout supprimer" (voir plus bas) : les devoirs
  // faits actuellement affiches, exactement ceux que ce bouton doit viser.
  devoirsFaitsActuels = faits;
  boutonSupprimerTousFaits.hidden = faits.length === 0;
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

  // "Hors classe" (voir CLASSE_HORS_CLASSE) : aucun eleve n'a litteralement
  // ce champ classe (il en est simplement depourvu), une requete where() ne
  // trouverait donc jamais personne -- filtre cote client sur l'absence du
  // champ a la place. Ciblage individuel (24/09/2026, voir devoir.eleves) :
  // restreint encore la liste aux seuls uid cibles par CE devoir, si le
  // champ est present (absent = devoir cree avant ce chantier, s'applique a
  // tout le groupe hors classe, comportement inchange).
  const eleves = (devoir.classe === CLASSE_HORS_CLASSE
    ? (await getDocs(collection(db, 'eleves'))).docs.filter((d) =>
        !d.data().classe && (!Array.isArray(devoir.eleves) || devoir.eleves.includes(d.id)))
    : (await getDocs(query(collection(db, 'eleves'), where('classe', '==', devoir.classe)))).docs
  )
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
    badge.className = `dev-badge ${ligneDonnees.rendu ? 'dev-badge-encours' : 'dev-badge-alerte'}`;
    badge.textContent = ligneDonnees.rendu ? 'Rendu' : 'Non rendu';
    celluleRendu.appendChild(badge);

    // Math.round(...*10)/10 : les notes d'automatismes (points, bareme 0,5 par
    // question) peuvent porter des artefacts de virgule flottante (0.5*7 =
    // 3.499999999996) -- sans effet sur les scores entiers des fiches de calcul.
    const celluleNote = document.createElement('td');
    celluleNote.textContent = ligneDonnees.meilleure
      ? `${(Math.round(ligneDonnees.meilleure.score * 10) / 10).toLocaleString('fr-FR')} / ${ligneDonnees.meilleure.totalExercices}`
      : '—';

    // Non-reponses = cases/questions laissees vides par l'eleve sur SA
    // meilleure tentative. Fiche : totalExercices - nbRepondues (nbRepondues
    // compte les champs remplis, voir validerFicheActuelle). Automatismes
    // (depuis le 19/09/2026) : nbQuestions - nbRepondues -- deux champs
    // distincts, voir enregistrerTentativeAutomatismeParId
    // (suivi.js) : totalExercices y porte le bareme (points), pas le nombre
    // de questions. Les tentatives enregistrees AVANT ce correctif n'ont pas
    // nbQuestions : affiche "—" plutot qu'un chiffre faux pour elles.
    const celluleNonReponses = document.createElement('td');
    if (!ligneDonnees.meilleure) {
      celluleNonReponses.textContent = '—';
    } else if (devoir.type === 'fiche') {
      celluleNonReponses.textContent = String(ligneDonnees.meilleure.totalExercices - ligneDonnees.meilleure.nbRepondues);
    } else if (typeof ligneDonnees.meilleure.nbQuestions === 'number') {
      celluleNonReponses.textContent = String(ligneDonnees.meilleure.nbQuestions - ligneDonnees.meilleure.nbRepondues);
    } else {
      celluleNonReponses.textContent = '—';
    }

    const celluleEssais = document.createElement('td');
    celluleEssais.textContent = `${ligneDonnees.nbEssais} / ${devoir.nbEssaisMax}`;

    const celluleDate = document.createElement('td');
    celluleDate.textContent = ligneDonnees.derniereActivite
      ? new Date(ligneDonnees.derniereActivite).toLocaleString('fr-FR')
      : '—';

    ligne.append(celluleNom, celluleRendu, celluleNote, celluleNonReponses, celluleEssais, celluleDate);
    resultatsCorps.appendChild(ligne);
  }
}

boutonRetourResultats.addEventListener('click', () => {
  vueResultats.hidden = true;
  vueListe.hidden = false;
});

// Suppression d'un devoir (04/10/2026, demande de David) : le devoir ET toutes
// les tentatives des eleves (eleves/{uid}/devoirsTentatives) -- plus rien ne
// reste d'un devoir supprime. Tous les eleves sont parcourus, pas seulement la
// classe visee (un eleve a pu changer de classe). Les brouillons et les
// marqueurs "retire de ma liste" de l'eleve ne sont pas supprimables par
// l'enseignant (regles) : l'eleve les efface lui-meme au prochain chargement
// de /mes-devoirs/ (devoirs-eleve.js).
async function tentativesDesDevoirs(devoirIds) {
  const ids = new Set(devoirIds);
  const eleves = await getDocs(collection(db, 'eleves'));
  const parEleve = await Promise.all(eleves.docs.map(async (e) =>
    (await getDocs(collection(db, 'eleves', e.id, 'devoirsTentatives'))).docs.filter((t) => ids.has(t.data().devoirId))));
  return parEleve.flat();
}

// Tentatives d'abord, devoir ensuite : en cas d'echec en cours de route le
// devoir existe encore et la suppression peut etre relancee.
async function supprimerDevoirsEtTentatives(devoirIds, tentatives) {
  await Promise.all(tentatives.map((t) => deleteDoc(t.ref)));
  await Promise.all(devoirIds.map((id) => deleteDoc(doc(db, 'devoirs', id))));
}

const phraseTentatives = (n) => (n > 0 ? ` ainsi que les ${n} tentative${n > 1 ? 's' : ''} des élèves` : '');

async function supprimerDevoir(devoirId, bouton) {
  bouton.disabled = true;
  let tentatives;
  try {
    tentatives = await tentativesDesDevoirs([devoirId]);
  } catch (erreur) {
    console.error(erreur);
    bouton.disabled = false;
    afficherEtat(zoneErreurFormulaire, 'Échec de la suppression — réessayer.');
    return;
  }
  if (!confirm(`Supprimer ce devoir${phraseTentatives(tentatives.length)} ? Cette action est définitive.`)) { bouton.disabled = false; return; }
  masquer(zoneConfirmation);
  try {
    await supprimerDevoirsEtTentatives([devoirId], tentatives);
    await chargerListeDevoirs();
  } catch (erreur) {
    console.error(erreur);
    bouton.disabled = false;
    afficherEtat(zoneErreurFormulaire, 'Échec de la suppression — réessayer.');
  }
}

// Suppression groupee de tous les devoirs "faits" affiches (devoirsFaitsActuels,
// voir chargerListeDevoirs) -- en plus de la suppression individuelle
// ci-dessus, pour vider d'un coup une liste qui s'accumule (echeances
// passees) plutot que ligne par ligne. alert() plutot que
// zoneErreurFormulaire en cas d'echec : ce panneau n'a pas de zone d'erreur
// dediee, et zoneErreurFormulaire vit dans le panneau d'attribution,
// invisible quand celui-ci est ferme.
boutonSupprimerTousFaits.addEventListener('click', async () => {
  const n = devoirsFaitsActuels.length;
  if (n === 0) return;
  boutonSupprimerTousFaits.disabled = true;
  try {
    const ids = devoirsFaitsActuels.map((d) => d.id);
    const tentatives = await tentativesDesDevoirs(ids);
    if (!confirm(`Supprimer les ${n} devoir${n > 1 ? 's' : ''} faits${phraseTentatives(tentatives.length)} ? Cette action est définitive.`)) return;
    await supprimerDevoirsEtTentatives(ids, tentatives);
    await chargerListeDevoirs();
  } catch (erreur) {
    console.error(erreur);
    alert('Échec de la suppression — réessayer.');
  } finally {
    boutonSupprimerTousFaits.disabled = false;
  }
});
