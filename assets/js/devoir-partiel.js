// Devoir sur une PARTIE d'une fiche de calcul (04/10/2026) : le devoir porte
// un champ facultatif `calculs` (numeros de calculs, ex. ["9.4", "9.6"]) ;
// ce module, charge par les fiches "cablees" (script classique, pas un
// module : disponible des le chargement, sans attendre DOMContentLoaded),
// masque les autres calculs et dit a la fiche lesquels comptent.
//
// Correspondance par NUMERO DE CALCUL (le "9.4" de "Calcul 9.4" et des ids
// "9.4 a)"), jamais par position : renumeroter une fiche pendant un devoir
// partiel fausserait donc la selection (voir SUIVI-FIREBASE.md, §7).
//
// Hors devoir partiel (appliquer() jamais appele, ou retirer() appele), tout
// est retenu : retenu() vaut toujours vrai, compter()/exercicesRetenus()
// renvoient la fiche entiere -- le code des fiches peut donc appeler ces
// fonctions sans condition.
//
// La presence de window.DevoirPartiel sert aussi de MARQUEUR "fiche cablee"
// pour le formulaire d'attribution (devoirs.js), qui charge la fiche dans une
// iframe et n'offre le choix des calculs que si ce marqueur existe.
(function () {
  'use strict';

  const CLASSE_MASQUE = 'devoir-partiel-masque';

  // Elements qui bornent le bloc d'un calcul : le calcul suivant, un titre de
  // section, les blocs englobants, et tout ce qui vient apres les calculs.
  const LIMITES = '.calcul-titre, .section-titre, .bloc-general, .bloc-avance, '
    + '.barre-controle, .barre-navigation, .score-panneau, .correction-panneau, '
    + '.modal-devoir, #suivi-etat, #devoir-info, script, style';

  let retenus = null; // Set des numeros retenus ; null = fiche entiere
  let observateur = null;
  let minuterie = null;

  function numeroDeTitre(el) {
    const m = /Calcul\s+(\d+\.\d+)/.exec(el.textContent || '');
    return m ? m[1] : null;
  }

  // "9.4 a)" -> "9.4"
  function numeroDeId(id) {
    const m = /^\s*(\d+\.\d+)\b/.exec(id || '');
    return m ? m[1] : null;
  }

  function contientTitre(el) {
    return el.matches('.calcul-titre, .section-titre') || !!el.querySelector('.calcul-titre, .section-titre');
  }

  function estLimite(el) {
    return el.matches(LIMITES) || contientTitre(el);
  }

  function contientGrille(el) {
    return el.matches('.question-grille') || !!el.querySelector('.question-grille');
  }

  // Pour chaque titre de calcul : { titre, num, elements } -- le titre et les
  // freres qui le suivent jusqu'a la prochaine limite (grille, figure,
  // introduction, rappel de formule...). Un element qui suit la DERNIERE
  // grille d'un calcul et precede directement le titre suivant (cas observe :
  // un rappel de formule entre deux calculs, Premiere fiche 19) introduit le
  // calcul suivant, pas le precedent : il lui est reaffecte.
  function calculerBlocs() {
    const blocs = [...document.querySelectorAll('.calcul-titre')].map((titre) => {
      const elements = [titre];
      let suivant = titre.nextElementSibling;
      while (suivant && !estLimite(suivant)) { elements.push(suivant); suivant = suivant.nextElementSibling; }
      return { titre, num: numeroDeTitre(titre), elements, suivant };
    });
    for (let i = 0; i < blocs.length - 1; i++) {
      const courant = blocs[i];
      const prochain = blocs[i + 1];
      if (courant.suivant !== prochain.titre) continue;
      let derniereGrille = -1;
      courant.elements.forEach((e, k) => { if (contientGrille(e)) derniereGrille = k; });
      if (derniereGrille >= 0 && derniereGrille < courant.elements.length - 1) {
        prochain.elements.unshift(...courant.elements.splice(derniereGrille + 1));
      }
    }
    return blocs;
  }

  // Pour chaque titre de section : l'entete (le titre, sa barre, un eventuel
  // rappel de formule ou texte, jusqu'au premier calcul) et les titres de
  // calcul qu'elle contient. Une section dont tous les calculs sont masques
  // masque aussi son entete.
  function calculerSections() {
    return [...document.querySelectorAll('.section-titre')].map((section) => {
      const entete = [section];
      const titres = [];
      let dansEntete = true;
      let e = section.nextElementSibling;
      while (e && !e.matches('.section-titre, .barre-controle, .barre-navigation, .score-panneau, .correction-panneau, .modal-devoir, #suivi-etat, #devoir-info, script, style')) {
        const dedans = e.matches('.calcul-titre') ? [e] : [...e.querySelectorAll('.calcul-titre')];
        if (dedans.length) { dansEntete = false; titres.push(...dedans); } else if (dansEntete) entete.push(e);
        e = e.nextElementSibling;
      }
      return { entete, titres };
    });
  }

  const estMasque = (el) => !!el.closest('.' + CLASSE_MASQUE);

  function masquer() {
    if (!retenus) return;
    document.querySelectorAll('.' + CLASSE_MASQUE).forEach((e) => e.classList.remove(CLASSE_MASQUE));
    for (const bloc of calculerBlocs()) {
      if (bloc.num && retenus.has(bloc.num)) continue;
      bloc.elements.forEach((e) => e.classList.add(CLASSE_MASQUE));
    }
    for (const section of calculerSections()) {
      if (section.titres.length > 0 && section.titres.every(estMasque)) {
        section.entete.forEach((e) => e.classList.add(CLASSE_MASQUE));
      }
    }
    document.querySelectorAll('.bloc-general, .bloc-avance').forEach((enveloppe) => {
      const titres = [...enveloppe.querySelectorAll('.calcul-titre')];
      if (titres.length > 0 && titres.every(estMasque)) enveloppe.classList.add(CLASSE_MASQUE);
    });
  }

  function planifierMasquage() {
    if (minuterie) return;
    minuterie = setTimeout(() => { minuterie = null; masquer(); }, 40);
  }

  // Les grilles, figures et zones de la fiche sont construites (et
  // reconstruites a chaque "Generer une nouvelle version") apres le
  // chargement : le masquage est reapplique des que le DOM change. Il ne fait
  // qu'ajouter/retirer une classe, donc ne declenche pas cet observateur
  // (childList seulement) : pas de boucle.
  function demarrerObservation() {
    if (observateur || !window.MutationObserver) return;
    observateur = new MutationObserver(planifierMasquage);
    observateur.observe(document.body, { childList: true, subtree: true });
  }

  function arreterObservation() {
    if (observateur) { observateur.disconnect(); observateur = null; }
    if (minuterie) { clearTimeout(minuterie); minuterie = null; }
  }

  function injecterStyle() {
    if (document.getElementById('devoir-partiel-style')) return;
    const style = document.createElement('style');
    style.id = 'devoir-partiel-style';
    style.textContent = '.' + CLASSE_MASQUE + ' { display: none !important; }';
    document.head.appendChild(style);
  }

  const API = {
    pret: true,

    // Masque tous les calculs hors de `calculs` et renvoie vrai si le
    // masquage est actif. `exercices` (optionnel mais conseille) : tableau
    // de la fiche, sert a verifier que la selection correspond a des
    // exercices existants -- sinon (fiche renumerotee depuis l'attribution,
    // liste vide ou inconnue) rien n'est masque et la fiche reste entiere,
    // plutot que de tout cacher.
    appliquer(calculs, exercices) {
      const liste = Array.isArray(calculs) ? calculs.map(String) : [];
      if (liste.length === 0) { API.retirer(); return false; }
      const ensemble = new Set(liste);
      if (Array.isArray(exercices) && !exercices.some((ex) => ensemble.has(numeroDeId(ex && ex.id)))) {
        console.warn('DevoirPartiel : aucun exercice ne correspond aux calculs du devoir (fiche renumerotee ?), fiche entiere conservee.', liste);
        API.retirer();
        return false;
      }
      retenus = ensemble;
      injecterStyle();
      masquer();
      demarrerObservation();
      return true;
    },

    // Retour a la fiche entiere (entrainement libre une fois le devoir termine).
    retirer() {
      retenus = null;
      arreterObservation();
      document.querySelectorAll('.' + CLASSE_MASQUE).forEach((e) => e.classList.remove(CLASSE_MASQUE));
    },

    actif() { return !!retenus; },

    retenu(ex) { return !retenus || retenus.has(numeroDeId(ex && ex.id)); },

    retenuParId(id) { return !retenus || retenus.has(numeroDeId(id)); },

    exercicesRetenus(exercices) { return retenus ? exercices.filter((ex) => API.retenu(ex)) : exercices; },

    compter(exercices) { return API.exercicesRetenus(exercices).length; },

    // Phrase ajoutee au bandeau d'information du devoir ('' hors devoir partiel).
    phrase() {
      if (!retenus) return '';
      const noms = [...retenus].sort((a, b) => {
        const [a1, a2] = a.split('.').map(Number);
        const [b1, b2] = b.split('.').map(Number);
        return a1 - b1 || a2 - b2;
      });
      const liste = noms.length > 1 ? noms.slice(0, -1).join(', ') + ' et ' + noms[noms.length - 1] : noms[0];
      return ` Calcul${noms.length > 1 ? 's' : ''} ${liste} seulement : les autres calculs sont masqués.`;
    },

    // Pour le formulaire d'attribution (devoirs.js, via une iframe) : les
    // calculs de la fiche telle qu'elle est rendue (titres construits en
    // JavaScript compris), dans l'ordre, avec leur section.
    listeCalculs() {
      const resultat = [];
      let section = '';
      document.querySelectorAll('.section-titre, .calcul-titre').forEach((el) => {
        if (el.matches('.section-titre')) { section = (el.textContent || '').trim(); return; }
        const num = numeroDeTitre(el);
        if (!num) return;
        const premier = el.querySelector('span');
        const texte = ((premier || el).textContent || '').replace(/\s+/g, ' ').trim();
        resultat.push({ num, section, titre: texte.replace(/^Calcul\s+\d+\.\d+\s*[—–-]\s*/, '') });
      });
      return resultat;
    },
  };

  window.DevoirPartiel = API;
})();
