// Aides de saisie communes aux fiches de Seconde a WIDGETS (tableau de signes,
// de variations, croise, de programme, schema d'evolution) -- 04/10/2026,
// retours de David apres ses essais en mode devoir. Script classique, charge
// apres claviers.js ; il n'a besoin d'aucune autre modification des fiches :
//
//  1. "Valider ce tableau" (bouton .cs-/.tc-/.se-/.tv-btn-valider) : un
//     eleve en devoir ne voit ni couleur ni statut avant la validation de la
//     fiche, donc le clic ne semblait rien faire. Le script affiche a cote du
//     bouton « Reponse enregistree » (ou « remplis toutes les cases »), puis,
//     si le widget est complet, passe a la question suivante comme le fait
//     la touche Entree sur un champ ordinaire.
//  2. Passage a la question suivante : allerChampSuivant() de la fiche cherche
//     input-N, qui n'existe pas pour un widget (focus() sur null, rien ne se
//     passait, clavier laisse ouvert). Le script enveloppe cette fonction :
//     si la question suivante est un widget, il ferme les claviers ouverts et
//     donne le focus a son premier champ.
//  3. Clavier numerique : les champs d'un widget n'avaient pas le bouton clavier
//     des champs ordinaires. Le script ajoute a cote de « Valider » un bouton
//     clavier (meme style que .q-clavier-btn) et un pave (chiffres, virgule,
//     signe moins, barre de fraction, pourcentage, produit, racine, efface)
//     qui ecrit dans le dernier champ du widget ou l'eleve avait le curseur.
//
// Les classes .clavier-visuel, .clavier-groupe, .q-clavier-btn viennent du
// CSS de chaque fiche. Idempotent : rejouable apres chaque reconstruction de
// la grille (MutationObserver).
(function () {
  'use strict';

  const BOUTONS_VALIDER = '.cs-btn-valider, .tc-btn-valider, .se-btn-valider, .tv-btn-valider';
  const CLASSE_PAVE = 'clavier-widget';
  const CLASSE_MESSAGE = 'widget-confirmation';

  // ---- repérage ------------------------------------------------------------

  const indexDeQuestion = (q) => (q && /^q-\d+$/.test(q.id) ? Number(q.id.slice(2)) : null);
  const questionDe = (el) => (el && el.closest ? el.closest('.question[id^="q-"]') : null);

  // Un widget = une question qui a des champs texte mais pas le input-N d'un champ ordinaire.
  function estWidget(q) {
    const idx = indexDeQuestion(q);
    return idx !== null && !document.getElementById('input-' + idx) && !!q.querySelector('input[type="text"]');
  }

  function suivantRetenu(idxActuel) {
    if (typeof exercices === 'undefined') return null;
    let i = idxActuel + 1;
    while (i < exercices.length && window.DevoirPartiel && !window.DevoirPartiel.retenu(exercices[i])) i++;
    return i < exercices.length ? i : null;
  }

  // ---- 2. passage a un widget ---------------------------------------------

  function fermerClaviers(sauf) {
    if (typeof fermerAutresClaviers === 'function') fermerAutresClaviers(sauf);
    try { if (window.mathVirtualKeyboard) window.mathVirtualKeyboard.hide(); } catch (e) { /* clavier MathLive absent */ }
    document.querySelectorAll('.' + CLASSE_PAVE + '.ouvert').forEach((p) => {
      if (questionDe(p) !== document.getElementById('q-' + sauf)) p.classList.remove('ouvert');
    });
  }

  function focaliserWidget(idx) {
    const q = document.getElementById('q-' + idx);
    if (!q) return;
    fermerClaviers(idx);
    const champ = q.querySelector('input[type="text"]');
    if (champ) champ.focus(); else q.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function envelopperAllerChampSuivant() {
    const origine = window.allerChampSuivant;
    if (typeof origine !== 'function' || origine.__widgets) return;
    const enveloppe = function (idxActuel) {
      const suivant = suivantRetenu(idxActuel);
      if (suivant !== null && !document.getElementById('input-' + suivant)) { focaliserWidget(suivant); return undefined; }
      return origine.apply(this, arguments);
    };
    enveloppe.__widgets = true;
    window.allerChampSuivant = enveloppe;
  }

  // ---- 1. retour apres « Valider ce tableau » -----------------------------

  function retirerMessage(q) {
    if (q) q.querySelectorAll('.' + CLASSE_MESSAGE).forEach((m) => m.remove());
  }

  function afficherMessage(bouton, texte) {
    const q = questionDe(bouton);
    retirerMessage(q);
    const m = document.createElement('span');
    m.className = CLASSE_MESSAGE;
    m.setAttribute('role', 'status');
    m.textContent = texte;
    bouton.insertAdjacentElement('afterend', m);
  }

  document.addEventListener('click', (evenement) => {
    const bouton = evenement.target.closest ? evenement.target.closest(BOUTONS_VALIDER) : null;
    if (bouton) {
      // Le onclick du bouton (verifierUne) s'est deja execute : saisies[idx] est a jour.
      const idx = indexDeQuestion(questionDe(bouton));
      if (idx === null || typeof saisies === 'undefined') return;
      const saisie = saisies[idx];
      const complet = !!saisie && saisie.correct !== null && saisie.correct !== undefined;
      if (!complet) { afficherMessage(bouton, 'Remplis toutes les cases avant de valider.'); return; }
      const silencieux = typeof etatDevoir !== 'undefined' && !!etatDevoir
        && typeof eleveConnecte !== 'undefined' && !!eleveConnecte
        && !(typeof ficheValidee !== 'undefined' && ficheValidee);
      if (silencieux) afficherMessage(bouton, '✓ Réponse enregistrée');
      else retirerMessage(questionDe(bouton));
      if (typeof allerChampSuivant === 'function') allerChampSuivant(idx);
      return;
    }
    // Toute modification du widget efface le message (la reponse a change).
    const q = questionDe(evenement.target);
    if (q && estWidget(q) && !evenement.target.closest('.' + CLASSE_PAVE) && !evenement.target.closest('.q-clavier-btn')) retirerMessage(q);
  });
  document.addEventListener('input', (evenement) => {
    const q = questionDe(evenement.target);
    if (q && estWidget(q)) retirerMessage(q);
  });

  // ---- 3. pave numerique ----------------------------------------------------

  const TOUCHES = [
    ['Chiffres', [['7'], ['8'], ['9'], ['4'], ['5'], ['6'], ['1'], ['2'], ['3'], ['0'], [',']]],
    ['Autre', [['−', '-'], ['a/b', '/'], ['%'], ['×'], ['√', 'sqrt('], ['(', '('], [')', ')']]],
  ];

  function insererDans(champ, texte) {
    const debut = champ.selectionStart == null ? champ.value.length : champ.selectionStart;
    const fin = champ.selectionEnd == null ? champ.value.length : champ.selectionEnd;
    champ.value = champ.value.slice(0, debut) + texte + champ.value.slice(fin);
    const pos = debut + texte.length;
    champ.focus();
    try { champ.setSelectionRange(pos, pos); } catch (e) { /* type sans curseur */ }
    champ.dispatchEvent(new Event('input', { bubbles: true })); // declenche le oninput de la fiche (sauvegarde, statut)
  }

  function effacerCaractere(champ) {
    const debut = champ.selectionStart == null ? champ.value.length : champ.selectionStart;
    const fin = champ.selectionEnd == null ? champ.value.length : champ.selectionEnd;
    if (debut === fin) {
      if (debut === 0) return;
      champ.value = champ.value.slice(0, debut - 1) + champ.value.slice(fin);
      champ.focus(); champ.setSelectionRange(debut - 1, debut - 1);
    } else {
      champ.value = champ.value.slice(0, debut) + champ.value.slice(fin);
      champ.focus(); champ.setSelectionRange(debut, debut);
    }
    champ.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function construirePave() {
    const pave = document.createElement('div');
    pave.className = 'clavier-visuel ' + CLASSE_PAVE;
    TOUCHES.forEach(([titre, touches], g) => {
      const groupe = document.createElement('div');
      groupe.className = 'clavier-groupe';
      const etiquette = document.createElement('span');
      etiquette.className = 'clavier-label';
      etiquette.textContent = titre;
      groupe.appendChild(etiquette);
      touches.forEach(([affiche, valeur]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = affiche;
        b.dataset.insere = valeur === undefined ? affiche : valeur;
        groupe.appendChild(b);
      });
      if (g === TOUCHES.length - 1) {
        const arriere = document.createElement('button');
        arriere.type = 'button'; arriere.className = 'touche-large'; arriere.textContent = '⌫'; arriere.dataset.action = 'arriere';
        const effacer = document.createElement('button');
        effacer.type = 'button'; effacer.className = 'touche-large touche-effacer'; effacer.textContent = 'Effacer'; effacer.dataset.action = 'effacer';
        groupe.append(arriere, effacer);
      }
      pave.appendChild(groupe);
    });
    return pave;
  }

  // Dernier champ du widget ou l'eleve avait le curseur (le focus part sur la
  // touche cliquee : on le memorise a part).
  let dernierChamp = null;
  document.addEventListener('focusin', (evenement) => {
    const q = questionDe(evenement.target);
    if (q && estWidget(q) && evenement.target.matches('input[type="text"]')) dernierChamp = evenement.target;
  });

  // Les touches ne doivent pas voler le focus au champ en cours de saisie.
  document.addEventListener('mousedown', (evenement) => {
    if (evenement.target.closest && evenement.target.closest('.' + CLASSE_PAVE)) evenement.preventDefault();
  });

  document.addEventListener('click', (evenement) => {
    const bouton = evenement.target.closest ? evenement.target.closest('.' + CLASSE_PAVE + ' button') : null;
    if (!bouton) return;
    const q = questionDe(bouton);
    let champ = dernierChamp && q && q.contains(dernierChamp) ? dernierChamp : (q ? q.querySelector('input[type="text"]') : null);
    if (!champ) return;
    if (bouton.dataset.action === 'effacer') { champ.value = ''; champ.focus(); champ.dispatchEvent(new Event('input', { bubbles: true })); return; }
    if (bouton.dataset.action === 'arriere') { effacerCaractere(champ); return; }
    insererDans(champ, bouton.dataset.insere);
  });

  function ajouterPaves() {
    document.querySelectorAll('.question[id^="q-"]').forEach((q) => {
      if (!estWidget(q) || q.querySelector('.' + CLASSE_PAVE)) return;
      const valider = q.querySelector(BOUTONS_VALIDER);
      if (!valider) return;
      const pave = construirePave();
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'q-clavier-btn widget-clavier-btn';
      toggle.title = 'Clavier numérique';
      toggle.setAttribute('aria-label', 'Clavier numérique');
      toggle.innerHTML = '&#9000;&#xFE0E;';
      toggle.addEventListener('click', () => {
        const etaitOuvert = pave.classList.contains('ouvert');
        fermerClaviers(indexDeQuestion(q));
        pave.classList.toggle('ouvert', !etaitOuvert);
      });
      valider.insertAdjacentElement('afterend', toggle);
      valider.parentElement.appendChild(pave);
    });
  }

  function injecterStyle() {
    if (document.getElementById('widgets-saisie-style')) return;
    const style = document.createElement('style');
    style.id = 'widgets-saisie-style';
    style.textContent = '.' + CLASSE_MESSAGE + ' { margin-left: 10px; font-size: 13px; font-weight: bold;'
      + ' color: var(--bleu, #4B46C7); font-family: Georgia, serif; }'
      + ' .widget-clavier-btn { margin-left: 8px; margin-top: 8px; vertical-align: middle; }'
      + ' .' + CLASSE_PAVE + ' { margin-top: 8px; }';
    document.head.appendChild(style);
  }

  let minuterie = null;
  function planifier() {
    if (minuterie) return;
    minuterie = setTimeout(() => { minuterie = null; ajouterPaves(); }, 40);
  }

  function demarrer() {
    injecterStyle();
    envelopperAllerChampSuivant();
    ajouterPaves();
    if (window.MutationObserver) new MutationObserver(planifier).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
