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
  query,
  where,
  getDocs
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

// Classe de l'eleve connecte (profil eleves/{uid}) : lue une seule fois par
// session (mise en cache), pour enregistrerTentativeDevoirSiApplicable()
// ci-dessous -- evite une lecture Firestore supplementaire a CHAQUE
// validation de fiche alors que la classe ne change jamais en session.
let classeEleveCourant;
// "hors-classe" : valeur sentinelle pour un eleve cree sans classe (voir
// outils/creer-comptes) -- AUCUN champ classe n'est ecrit sur son document
// eleves/{uid} (ni ici ni migre a posteriori), cette chaine ne sert qu'a
// cote client pour interroger/ecrire la collection devoirs de facon
// coherente (un devoir attribue "Hors classe" depuis devoirs.js stocke
// litteralement classe:"hors-classe"). Avant ce changement (24/09/2026,
// David : un eleve hors classe cree la veille n'apparaissait pas dans la
// liste d'attribution d'un devoir), cette fonction renvoyait null pour un
// eleve hors classe, et chaque appelant plus bas a un garde `if (!classe)
// return` -- un devoir ne pouvait donc jamais s'appliquer a lui. Distinct du
// cas "non connecte" (reste null, geree par le if juste en dessous) et du
// cas "profil eleves/{uid} inexistant" (ex. un compte admin qui visite une
// fiche : reste null aussi, pas un vrai eleve).
const CLASSE_HORS_CLASSE = 'hors-classe';
async function classeEleve() {
  if (classeEleveCourant !== undefined) return classeEleveCourant;
  await authPrete;
  if (!utilisateurCourant) { classeEleveCourant = null; return null; }
  try {
    const profil = await getDoc(doc(db, 'eleves', utilisateurCourant.uid));
    classeEleveCourant = profil.exists() ? (profil.data().classe || CLASSE_HORS_CLASSE) : null;
  } catch (erreur) {
    console.warn('Suivi : lecture du profil eleve impossible.', erreur);
    classeEleveCourant = null;
  }
  return classeEleveCourant;
}

// Un devoir "Hors classe" peut desormais cibler seulement CERTAINS eleves du
// groupe (champ `eleves`, tableau d'uid -- voir devoirs.js, ajoute le
// 24/09/2026) plutot que tout le monde d'office. La requete Firestore par
// classe ne peut pas filtrer la-dessus (pas d'egalite possible sur "uid dans
// ce tableau" combinee aux autres filtres deja en where()) : filtre cote
// client applique apres coup a chaque endroit qui interroge la collection
// devoirs pour la classe courante. Absent (devoir cree avant ce chantier, ou
// devoir d'une vraie classe) = s'applique a tout le monde, comportement
// inchange.
function applicablePourEleve(devoir) {
  return !Array.isArray(devoir.eleves) || devoir.eleves.includes(utilisateurCourant.uid);
}

// Requete brute (sans filtre d'echeance) : partagee entre
// enregistrerTentativeDevoirSiApplicable et verifierEtatDevoir ci-dessous.
async function devoirsPour(ficheId, classe) {
  const instantane = await getDocs(query(
    collection(db, 'devoirs'),
    where('ficheId', '==', ficheId),
    where('classe', '==', classe)
  ));
  return instantane.docs.map((d) => ({ id: d.id, ...d.data() })).filter(applicablePourEleve);
}

// Nombre de tentatives DEJA enregistrees par l'eleve courant pour ce devoir
// precis (eleves/{uid}/devoirsTentatives, voir plus bas).
async function nbEssaisUtilises(devoirId) {
  const instantane = await getDocs(query(
    collection(db, 'eleves', utilisateurCourant.uid, 'devoirsTentatives'),
    where('devoirId', '==', devoirId)
  ));
  return instantane.size;
}

// Le modele "resultats" ci-dessus FUSIONNE les passages (score cumule, un
// exercice reussi une fois reste acquis) -- adapte a l'entrainement libre,
// mais un devoir a besoin au contraire de la MEILLEURE TENTATIVE COMPLETE
// individuelle (decide avec David le 18/09/2026), donc d'un historique
// SEPARE ou chaque validation garde son propre score. Cout Firestore
// maitrise : rien n'est ecrit tant qu'aucun devoir n'existe pour cette
// fiche+classe (la tres grande majorite des validations, hors devoir, n'en
// ecrivent jamais). Ne bloque jamais la validation normale (voir
// validerFiche) : toute erreur ici reste silencieuse.
//
// Limite d'essais (19/09/2026, decide avec David) : verifiee ici seulement
// PENDANT la fenetre active du devoir (echeance pas encore passee) -- une
// fois l'echeance passee, la fiche redevient un entrainement libre illimite
// (decide des la conception de la brique devoirs) donc plus aucune raison
// de compter/plafonner ces tentatives-la, meme si elles n'ont plus d'effet
// sur la note (deja exclues par le filtre d'echeance de la vue resultats).
// Le VRAI blocage cote UI vit dans verifierEtatDevoir() (appelee au
// chargement de la fiche, desactive "Valider ma fiche") ; ce filtre ici est
// une seconde ligne de defense si ce blocage est contourne (ex. appel
// direct de window.validerFiche() depuis la console).
async function enregistrerTentativeDevoirSiApplicable(ficheId, exercicesReussisIds, totalExercices, nbRepondues) {
  try {
    const classe = await classeEleve();
    if (!classe) return;
    const devoirs = await devoirsPour(ficheId, classe);
    const maintenant = Date.now();
    for (const devoir of devoirs) {
      const actif = devoir.echeance?.toMillis && devoir.echeance.toMillis() > maintenant;
      if (actif && (await nbEssaisUtilises(devoir.id)) >= devoir.nbEssaisMax) continue;
      await addDoc(collection(db, 'eleves', utilisateurCourant.uid, 'devoirsTentatives'), {
        devoirId: devoir.id,
        ficheId,
        score: exercicesReussisIds.length,
        totalExercices,
        nbRepondues,
        horodatage: serverTimestamp(),
      });
    }
  } catch (erreur) {
    console.warn('Suivi : enregistrement de la tentative de devoir impossible.', erreur);
  }
}

// Appelee au chargement d'une fiche (voir initialiserFiche() cote fiche)
// pour savoir s'il faut desactiver "Valider ma fiche" : renvoie null si
// aucun devoir actif pour cette fiche+classe (comportement normal), sinon
// {titre, nbEssaisMax, essaisUtilises, echeance (ms), bloque}. "bloque" ne
// devient vrai que PENDANT la fenetre active (memes raisons que le filtre
// dans enregistrerTentativeDevoirSiApplicable ci-dessus) -- passee
// l'echeance, plus aucun blocage, entrainement libre.
export async function verifierEtatDevoir(ficheId) {
  await authPrete;
  if (!utilisateurCourant) return null;
  try {
    const classe = await classeEleve();
    if (!classe) return null;
    const maintenant = Date.now();
    const devoir = (await devoirsPour(ficheId, classe))
      .find((d) => d.echeance?.toMillis && d.echeance.toMillis() > maintenant);
    if (!devoir) return null;
    const essaisUtilises = await nbEssaisUtilises(devoir.id);
    return {
      titre: devoir.titre,
      nbEssaisMax: devoir.nbEssaisMax,
      essaisUtilises,
      echeance: devoir.echeance.toMillis(),
      bloque: essaisUtilises >= devoir.nbEssaisMax,
    };
  } catch (erreur) {
    console.warn('Suivi : verification du devoir impossible.', erreur);
    return null;
  }
}

// Cliquer sur "Valider" (fiche complete ou non). Depuis le 29/09/2026, sur
// demande de David ("je ne ferai un suivi enseignant que sur les devoirs
// donnes"), ce bouton n'existe plus que pendant un devoir actif (voir
// zoneValider.hidden dans chaque fiche) : plus d'ecriture dans
// eleves/{uid}/resultats/{ficheId} (score cumule tous passages confondus),
// qui n'etait lue que par l'ancien tableau de bord "Fiches", retire le meme
// jour -- seule la tentative de devoir (si applicable) est encore
// enregistree. Supprime aussi le brouillon en cours : une fois validee, la
// fiche n'est plus "en cours" a reprendre.
export async function validerFiche(ficheId, exercicesReussisIds, totalExercices, nbRepondues) {
  if (!utilisateurCourant) return;
  await enregistrerTentativeDevoirSiApplicable(ficheId, exercicesReussisIds, totalExercices, nbRepondues);
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

// Deux cibles possibles pour un devoir de type 'automatismes' (28/09/2026) :
// 'sujet-blanc' (mix de tous les themes, comportement d'origine) ou 'fiche'
// (fiche d'automatismes ciblee, themes choisis par l'enseignant -- voir
// automatismes/premiere/fiche.html). Stockee dans le champ `cible` du
// document devoir ; absente sur tout devoir cree avant ce chantier, traitee
// alors comme 'sujet-blanc' (meme sentinelle cote client que CLASSE_HORS_CLASSE
// dans devoirs.js, pour ne rien casser sur les devoirs existants).
const CIBLE_AUTOMATISMES_DEFAUT = 'sujet-blanc';

// Compare deux listes de themes comme des ensembles (ordre indifferent) --
// utilise pour verifier qu'une tentative de fiche d'automatismes correspond
// bien aux themes EXACTS d'un devoir 'fiche', pas seulement a son niveau/
// mode/duree (qui a eux seuls ne suffiraient pas a distinguer deux devoirs
// 'fiche' actifs sur des themes differents mais memes niveau/mode).
function memeEnsembleThemes(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  const sa = [...a].sort(), sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

// Requete brute (sans filtre d'echeance) pour un devoir d'automatismes,
// identifie par (type 'automatismes', cible, niveau, mode, [duree], classe)
// plutot que par ficheId -- partagee entre enregistrerTentativeDevoirAutomatisme-
// SiApplicable et verifierEtatDevoirAutomatisme ci-dessous (meme principe que
// devoirsPour plus haut, pour les fiches). Ni le niveau, ni le mode, ni la
// duree ne sont imposes a l'eleve SAUF pendant un devoir actif (verrouille
// cote page, voir moteur.js/demarrer) : une tentative avec un autre niveau,
// mode ou duree que ceux du devoir n'est simplement pas comptee, comme une
// tentative hors delai. La duree n'a de sens qu'en mode chrono (voir
// devoirs.js) : filtre ajoute seulement si mode === 'chrono', sinon le champ
// n'existe meme pas sur le document devoir. `cible` filtree cote client
// (pas de where() Firestore dessus : les devoirs 'sujet-blanc' crees avant
// ce chantier n'ont pas ce champ du tout).
async function devoirsPourAutomatisme(niveau, mode, duree, classe, cible) {
  cible = cible || CIBLE_AUTOMATISMES_DEFAUT;
  const filtres = [
    where('type', '==', 'automatismes'),
    where('niveau', '==', niveau),
    where('mode', '==', mode),
    where('classe', '==', classe)
  ];
  if (mode === 'chrono') filtres.push(where('duree', '==', duree));
  const instantane = await getDocs(query(collection(db, 'devoirs'), ...filtres));
  return instantane.docs.map((d) => ({ id: d.id, ...d.data() }))
    .filter(applicablePourEleve)
    .filter((d) => (d.cible || CIBLE_AUTOMATISMES_DEFAUT) === cible);
}

// Meme principe que enregistrerTentativeDevoirSiApplicable ci-dessus, pour
// un sujet blanc d'automatismes : reutilise le MEME journal eleves/{uid}/
// devoirsTentatives (memes champs score/totalExercices, ici note/6 plutot
// que exercices reussis/total -- meme forme, la vue resultats de devoirs.js
// n'a pas besoin de distinguer les deux types pour calculer la meilleure
// tentative).
//
// Limite d'essais (19/09/2026, meme principe et memes raisons que pour les
// fiches, voir enregistrerTentativeDevoirSiApplicable) : verifiee ici
// seulement PENDANT la fenetre active du devoir. Cote UI, le blocage passe
// par verifierEtatDevoirAutomatisme() (voir automatismes/premiere/
// sujet-blanc.html) ; ce filtre ici est la seconde ligne de defense.
//
// `repondues` et `baremeTotal` (19/09/2026, retour de David apres son test
// reel) : jusque-la, `nbRepondues` recevait `total` (nombre de QUESTIONS de
// la serie, toujours 10) et `totalExercices` valait 6 en dur -- une reponse
// sciemment laissee vide n'apparaissait donc jamais dans le tableau de bord
// (colonne "Non-reponses" forcee a "—" pour un devoir d'automatismes, voir
// devoirs.js). `repondues` (nombre REEL de questions ayant une reponse,
// calcule par moteur.js) et `baremeTotal` (points max du bareme choisi pour
// CETTE serie, voir enregistrerTentativeSujetBlancSiDevoir) rendent ces deux champs a
// nouveau justes.
async function enregistrerTentativeDevoirAutomatismeSiApplicable(niveau, mode, duree, points, bonnes, total, repondues, baremeTotal, cible, themes) {
  try {
    const classe = await classeEleve();
    if (!classe) return;
    let devoirs = await devoirsPourAutomatisme(niveau, mode, duree, classe, cible);
    // Devoir 'fiche' : niveau/mode/duree seuls ne distinguent pas deux
    // devoirs actifs sur des themes differents -- comparaison exacte de
    // l'ensemble des themes joues contre celui du devoir (voir
    // memeEnsembleThemes plus haut).
    if (cible === 'fiche') devoirs = devoirs.filter((d) => memeEnsembleThemes(d.themes, themes));
    const maintenant = Date.now();
    for (const devoir of devoirs) {
      const actif = devoir.echeance?.toMillis && devoir.echeance.toMillis() > maintenant;
      if (actif && (await nbEssaisUtilises(devoir.id)) >= devoir.nbEssaisMax) continue;
      await addDoc(collection(db, 'eleves', utilisateurCourant.uid, 'devoirsTentatives'), {
        devoirId: devoir.id,
        score: points,
        totalExercices: baremeTotal,
        nbQuestions: total,
        nbRepondues: repondues,
        horodatage: serverTimestamp(),
      });
    }
  } catch (erreur) {
    console.warn('Suivi : enregistrement de la tentative de devoir (automatismes) impossible.', erreur);
  }
}

// Meme principe que verifierEtatDevoir ci-dessus, pour un sujet blanc
// d'automatismes. Appelee depuis onFinSerie (voir sujet-blanc.html) avec le
// niveau/mode/duree de la serie qui vient de se terminer -- pas d'equivalent
// du controle "au chargement de la fiche" ici, puisque le niveau/mode/duree
// ne sont connus qu'une fois la serie lancee par l'eleve (choisis via
// moteur.js, pas figes comme un ficheId).
export async function verifierEtatDevoirAutomatisme(niveau, mode, duree, cible, themes) {
  await authPrete;
  if (!utilisateurCourant) return null;
  try {
    const classe = await classeEleve();
    if (!classe) return null;
    const maintenant = Date.now();
    let devoirs = await devoirsPourAutomatisme(niveau, mode, duree, classe, cible);
    if (cible === 'fiche') devoirs = devoirs.filter((d) => memeEnsembleThemes(d.themes, themes));
    const devoir = devoirs.find((d) => d.echeance?.toMillis && d.echeance.toMillis() > maintenant);
    if (!devoir) return null;
    const essaisUtilises = await nbEssaisUtilises(devoir.id);
    return {
      titre: devoir.titre,
      nbEssaisMax: devoir.nbEssaisMax,
      essaisUtilises,
      echeance: devoir.echeance.toMillis(),
      bloque: essaisUtilises >= devoir.nbEssaisMax,
    };
  } catch (erreur) {
    console.warn('Suivi : verification du devoir (automatismes) impossible.', erreur);
    return null;
  }
}

// Devoir d'automatismes actif (echeance pas encore passee) pour la classe de
// l'eleve connecte et pour la CIBLE demandee ('sujet-blanc' par defaut, voir
// CIBLE_AUTOMATISMES_DEFAUT plus haut), tous niveau/mode/duree confondus --
// appelee AVANT de lancer une serie (voir sujet-blanc.html et fiche.html),
// pour verrouiller la page sur le niveau/mode/duree (et, pour une cible
// 'fiche', les themes) choisis par l'enseignant a l'attribution plutot que de
// laisser l'eleve les choisir librement pendant la fenetre active du devoir.
// S'il existe plusieurs devoirs actifs pour la meme classe ET la meme cible,
// seul le premier trouve sert au verrouillage (cas non prevu en pratique :
// un seul devoir actif a la fois par classe et par cible). Deux devoirs de
// cibles differentes (un sujet blanc ET une fiche ciblee) peuvent en
// revanche etre actifs simultanement sans se gener : chaque page ne
// verrouille que sur SA propre cible.
export async function devoirAutomatismeActif(cible) {
  cible = cible || CIBLE_AUTOMATISMES_DEFAUT;
  await authPrete;
  if (!utilisateurCourant) return null;
  try {
    const classe = await classeEleve();
    if (!classe) return null;
    const instantane = await getDocs(query(
      collection(db, 'devoirs'),
      where('type', '==', 'automatismes'),
      where('classe', '==', classe)
    ));
    const maintenant = Date.now();
    const devoir = instantane.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter(applicablePourEleve)
      .filter((d) => (d.cible || CIBLE_AUTOMATISMES_DEFAUT) === cible)
      .find((d) => d.echeance?.toMillis && d.echeance.toMillis() > maintenant);
    if (!devoir) return null;
    const essaisUtilises = await nbEssaisUtilises(devoir.id);
    return {
      id: devoir.id,
      titre: devoir.titre,
      niveau: devoir.niveau,
      mode: devoir.mode,
      duree: devoir.duree,
      themes: devoir.themes || null,
      nbEssaisMax: devoir.nbEssaisMax,
      essaisUtilises,
      echeance: devoir.echeance.toMillis(),
      bloque: essaisUtilises >= devoir.nbEssaisMax,
    };
  } catch (erreur) {
    console.warn('Suivi : recherche du devoir actif (automatismes) impossible.', erreur);
    return null;
  }
}

// Brouillon d'une serie d'automatismes en devoir mode fiche (30/09/2026) :
// meme principe que enregistrerBrouillon/chargerBrouillon/supprimerBrouillon
// ci-dessus pour les cahiers de calcul, mais indexe par devoirId plutot que
// par ficheId -- un automatisme (sujet blanc ou fiche ciblee) n'a pas
// d'identifiant de fiche stable, seul le devoir qui l'encadre en a un.
// Reserve au mode fiche (pas chrono, decide avec David : une serie chrono se
// joue d'une traite, comme le jour de l'epreuve).
export async function enregistrerBrouillonAutomatisme(devoirId, questions, reponses) {
  if (!utilisateurCourant) return;
  try {
    const donnees = {
      devoirId,
      questions: JSON.parse(JSON.stringify(questions)),
      reponses: JSON.parse(JSON.stringify(reponses)),
      horodatage: serverTimestamp(),
    };
    await setDoc(doc(db, 'eleves', utilisateurCourant.uid, 'brouillonsAutomatismes', devoirId), donnees);
  } catch (erreur) {
    console.warn('Suivi : enregistrement du brouillon (automatismes) impossible.', erreur);
    throw erreur;
  }
}

export async function chargerBrouillonAutomatisme(devoirId) {
  await authPrete;
  if (!utilisateurCourant) return null;
  try {
    const instantane = await getDoc(doc(db, 'eleves', utilisateurCourant.uid, 'brouillonsAutomatismes', devoirId));
    return instantane.exists() ? instantane.data() : null;
  } catch (erreur) {
    console.warn('Suivi : lecture du brouillon (automatismes) impossible.', erreur);
    return null;
  }
}

export async function supprimerBrouillonAutomatisme(devoirId) {
  if (!utilisateurCourant) return;
  try {
    await deleteDoc(doc(db, 'eleves', utilisateurCourant.uid, 'brouillonsAutomatismes', devoirId));
  } catch (erreur) {
    console.warn('Suivi : suppression du brouillon (automatismes) impossible.', erreur);
  }
}

// Un sujet blanc termine (voir automatismes/premiere/sujet-blanc.html et le
// callback onFinSerie dans assets/moteur.js). Depuis le 29/09/2026, sur
// demande de David ("je ne ferai un suivi enseignant que sur les devoirs
// donnes") : plus aucune ecriture inconditionnelle dans eleves/{uid}/
// automatismes (agregat qui n'etait lu que par l'ancien tableau de bord
// "Fiches", retire le meme jour) -- seule une tentative correspondant a un
// devoir 'sujet-blanc' ACTIF est enregistree, dans devoirsTentatives
// uniquement, exactement comme enregistrerTentativeFicheAutomatismesSiDevoir
// ci-dessous pour la fiche ciblee. Un sujet blanc joue hors devoir
// n'ecrit donc plus jamais rien.
//
// `repondues` (nombre reel de questions ayant une reponse) et `baremeTotal`
// (points max du bareme de CETTE page, voir sujet-blanc.html) : voir le
// commentaire devant enregistrerTentativeDevoirAutomatismeSiApplicable.
export async function enregistrerTentativeSujetBlancSiDevoir(bonnes, total, points, niveau, mode, duree, repondues, baremeTotal) {
  await enregistrerTentativeDevoirAutomatismeSiApplicable(niveau, mode, duree, points, bonnes, total, repondues, baremeTotal);
}

// Fiche d'automatismes ciblee par un devoir (28/09/2026, voir
// automatismes/premiere/fiche.html) -- contrairement au sujet blanc
// ci-dessus, une fiche d'automatismes ORDINAIRE reste volontairement non
// suivie/non notee (pratique libre, choix deja documente plus haut) : rien
// n'est jamais ecrit dans eleves/{uid}/automatismes pour une fiche. Seule une
// tentative correspondant a un devoir 'fiche' ACTIF est enregistree, dans
// devoirsTentatives uniquement (comme une fiche de cahier de calcul). Pas de
// bareme ici (pas de note /5 comme le sujet blanc) : score = nombre de
// bonnes reponses, totalExercices = nombre de questions de la serie.
export async function enregistrerTentativeFicheAutomatismesSiDevoir(bonnes, total, niveau, mode, duree, themes, repondues) {
  await enregistrerTentativeDevoirAutomatismeSiApplicable(niveau, mode, duree, bonnes, bonnes, total, repondues, total, 'fiche', themes);
}

window.enregistrerTentative = enregistrerTentative;
window.enregistrerTentativeSujetBlancSiDevoir = enregistrerTentativeSujetBlancSiDevoir;
window.enregistrerTentativeFicheAutomatismesSiDevoir = enregistrerTentativeFicheAutomatismesSiDevoir;
window.enregistrerBrouillon = enregistrerBrouillon;
window.chargerBrouillon = chargerBrouillon;
window.supprimerBrouillon = supprimerBrouillon;
window.validerFiche = validerFiche;
window.estConnecte = estConnecte;
window.verifierEtatDevoir = verifierEtatDevoir;
window.verifierEtatDevoirAutomatisme = verifierEtatDevoirAutomatisme;
window.devoirAutomatismeFicheActif = () => devoirAutomatismeActif('fiche');
window.devoirAutomatismeActif = devoirAutomatismeActif;
window.enregistrerBrouillonAutomatisme = enregistrerBrouillonAutomatisme;
window.chargerBrouillonAutomatisme = chargerBrouillonAutomatisme;
window.supprimerBrouillonAutomatisme = supprimerBrouillonAutomatisme;
