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
  updateDoc,
  deleteDoc,
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
const selectClasse = document.getElementById('dev-classe');
const champEcheance = document.getElementById('dev-echeance');
const champEssais = document.getElementById('dev-essais');
const boutonSoumettre = document.getElementById('dev-bouton-soumettre');
const boutonAnnulerEdition = document.getElementById('dev-bouton-annuler-edition');
const titreFormulaire = document.getElementById('dev-formulaire-titre');
const zoneConfirmation = document.getElementById('dev-confirmation');
const zoneErreurFormulaire = document.getElementById('dev-erreur-formulaire');

const listeVide = document.getElementById('dev-liste-vide');
const tableau = document.getElementById('dev-tableau');
const corpsTableau = document.getElementById('dev-corps');

const boutonAttribuer = document.getElementById('dev-bouton-attribuer');
const boutonDevoirsFaits = document.getElementById('dev-bouton-devoirs-faits');
const panneauAttribuer = document.getElementById('dev-panneau-attribuer');
const panneauListe = document.getElementById('dev-panneau-liste');

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

// Les deux panneaux (formulaire d'attribution / liste "Devoirs faits") sont
// repliés par defaut et s'ouvrent au clic sur leur bouton -- mutuellement
// exclusifs (ouvrir l'un referme l'autre) pour eviter une page trop chargee.
function basculerPanneau(panneau, bouton, autrePanneau, autreBouton) {
  const ouvrir = panneau.hidden;
  panneau.hidden = !ouvrir;
  bouton.setAttribute('aria-expanded', String(ouvrir));
  bouton.classList.toggle('dev-action-actif', ouvrir);
  if (ouvrir) {
    autrePanneau.hidden = true;
    autreBouton.setAttribute('aria-expanded', 'false');
    autreBouton.classList.remove('dev-action-actif');
  }
}
// Fermer le panneau d'attribution (par l'un ou l'autre bouton) alors qu'une
// edition est en cours l'abandonne -- annulerEdition() est definie plus bas
// mais deja hissee (declaration de fonction) au moment ou ce clic peut se
// produire.
boutonAttribuer.addEventListener('click', () => {
  const allaitFermer = !panneauAttribuer.hidden;
  basculerPanneau(panneauAttribuer, boutonAttribuer, panneauListe, boutonDevoirsFaits);
  if (allaitFermer && devoirEnEdition) annulerEdition();
});
boutonDevoirsFaits.addEventListener('click', () => {
  if (devoirEnEdition) annulerEdition();
  basculerPanneau(panneauListe, boutonDevoirsFaits, panneauAttribuer, boutonAttribuer);
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
  let auMoinsUnHorsClasse = false;
  instantane.docs.forEach((d) => {
    const classe = d.data().classe;
    if (classe) classes.add(classe); else auMoinsUnHorsClasse = true;
  });
  const liste = [...classes].sort();
  if (auMoinsUnHorsClasse) liste.push(CLASSE_HORS_CLASSE);
  return liste;
}

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
function mettreAJourChampDuree() {
  const estAutomatismes = selectType.value === 'automatismes';
  champDuree.hidden = !estAutomatismes || selectMode.value !== 'chrono';
}

selectType.addEventListener('change', () => {
  const estAutomatismes = selectType.value === 'automatismes';
  champFiche.hidden = estAutomatismes;
  selectFiche.required = !estAutomatismes;
  champNiveau.hidden = !estAutomatismes;
  champMode.hidden = !estAutomatismes;
  mettreAJourChampDuree();
  remplirSelectClasse();
});

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

  selectType.value = devoir.type;
  selectType.dispatchEvent(new Event('change'));
  if (devoir.type === 'automatismes') {
    selectNiveau.value = String(devoir.niveau);
    selectMode.value = devoir.mode;
    selectMode.dispatchEvent(new Event('change'));
    if (devoir.mode === 'chrono') selectDuree.value = String(devoir.duree);
  } else {
    selectFiche.value = devoir.ficheId;
  }
  // Apres le "change" sur selectType (qui repeuple selectClasse, voir
  // remplirSelectClasse) : la classe du devoir doit rester dans la liste
  // puisque c'est forcement une classe deja utilisee par ce devoir.
  selectClasse.value = devoir.classe;
  if (devoir.echeance?.toMillis) champEcheance.value = dateLocalePourChamp(devoir.echeance.toMillis());
  champEssais.value = String(devoir.nbEssaisMax);

  titreFormulaire.textContent = 'Modifier ce devoir';
  boutonSoumettre.textContent = 'Enregistrer les modifications';
  boutonAnnulerEdition.hidden = false;

  panneauListe.hidden = true;
  panneauAttribuer.hidden = false;
  boutonAttribuer.setAttribute('aria-expanded', 'true');
  boutonAttribuer.classList.add('dev-action-actif');
  boutonDevoirsFaits.setAttribute('aria-expanded', 'false');
  boutonDevoirsFaits.classList.remove('dev-action-actif');
  panneauAttribuer.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  if (type === 'automatismes') {
    const niveau = parseInt(selectNiveau.value, 10);
    const mode = selectMode.value;
    const libelleMode = mode === 'chrono' ? 'chrono' : 'fiche';
    donnees = { type, niveau, mode, titre: `Sujet blanc — Niveau ${niveau} (mode ${libelleMode})` };
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
    if (devoirEnEdition) {
      // Pas de creeLe/creePar ici : on ne touche pas aux metadonnees de
      // creation d'origine, seulement aux parametres modifies.
      await updateDoc(doc(db, 'devoirs', devoirEnEdition.id), { ...donnees, classe, echeance, nbEssaisMax });
      annulerEdition();
      afficherEtat(zoneConfirmation, 'Devoir modifié.');
    } else {
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
    }
    await chargerListeDevoirs();
  } catch (erreur) {
    console.error(erreur);
    afficherEtat(zoneErreurFormulaire, `Échec de l'${devoirEnEdition ? 'enregistrement' : 'attribution'} — réessayer.`);
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

    ligne.append(celluleFiche, celluleClasse, celluleEcheance, celluleEssais, celluleStatut, celluleResultats, celluleModifier, celluleAction);
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

  // "Hors classe" (voir CLASSE_HORS_CLASSE) : aucun eleve n'a litteralement
  // ce champ classe (il en est simplement depourvu), une requete where() ne
  // trouverait donc jamais personne -- filtre cote client sur l'absence du
  // champ a la place.
  const eleves = (devoir.classe === CLASSE_HORS_CLASSE
    ? (await getDocs(collection(db, 'eleves'))).docs.filter((d) => !d.data().classe)
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
      ? `${Math.round(ligneDonnees.meilleure.score * 10) / 10} / ${ligneDonnees.meilleure.totalExercices}`
      : '—';

    // Non-reponses = cases/questions laissees vides par l'eleve sur SA
    // meilleure tentative. Fiche : totalExercices - nbRepondues (nbRepondues
    // compte les champs remplis, voir validerFicheActuelle). Automatismes
    // (depuis le 19/09/2026) : nbQuestions - nbRepondues -- deux champs
    // distincts, voir enregistrerTentativeDevoirAutomatismeSiApplicable
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
