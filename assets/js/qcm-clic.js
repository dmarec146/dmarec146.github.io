// Questions a choix (QCM, oui/non, vrai/faux) des fiches de calcul : on clique sur la reponse au lieu de la taper.
//
// 07/10/2026, demande de David : utiliser pour les fiches la meme saisie que les pages d'automatismes
// (boutons sur lesquels on clique). Script partage, charge par les fiches apres claviers.js ; il ne depend
// d'aucun generateur : il repere dans la page les cartes de question qui portent des choix
// (`.q-qcm-options`) et un champ texte `#input-N`, rend les choix cliquables et masque le champ (qui reste
// la source de verite : un clic y ecrit la meme lettre que celle qu'on aurait tapee, donc reponses
// enregistrees, brouillons, devoirs, baremes et corrections sont inchanges).
//
//   - vrai/faux (type « vraifaux », champ « vrai » / « faux ») : deux boutons « Vrai » et « Faux » crees par le script ;
//   - un seul bon choix : un clic choisit la reponse et la valide (meme effet que la touche Entree) ;
//   - plusieurs bonnes reponses (ex. « b,c,f ») : on coche / decoche, puis « Valider » ;
//   - en devoir, comme avant : le verdict n'est pas affiche avant la validation de la fiche.
(function () {
  'use strict';

  const STYLE = `
    .question.qcm-clic .q-input, .question.qcm-clic .q-clavier-btn, .question.qcm-clic .clavier-visuel { display: none !important; }
    .q-qcm-option.cliquable {
      cursor: pointer; padding: 6px 12px; border: 1.5px solid #d4d4d4; border-radius: 8px; background: #fff;
      user-select: none; -webkit-user-select: none; transition: border-color 0.12s, background-color 0.12s;
    }
    .q-qcm-option.cliquable:hover { border-color: var(--bleu, #4a45c4); background: #f7f7ff; }
    .q-qcm-option.cliquable:focus-visible { outline: 2px solid var(--bleu, #4a45c4); outline-offset: 2px; }
    .q-qcm-option.choisie { border-color: var(--bleu, #4a45c4); background: var(--bleu-clair, #eceaff); }
    .q-qcm-option.choisie .q-qcm-lettre { background: var(--bleu, #4a45c4); border-color: var(--bleu, #4a45c4); color: #fff; font-style: normal; font-weight: bold; }
    .q-qcm-valider {
      flex-basis: 100%; margin: 2px auto 0; max-width: 180px; cursor: pointer; padding: 7px 14px; font-size: 14px; font-weight: 600;
      color: #fff; background: var(--bleu, #4a45c4); border: none; border-radius: 8px;
    }
    .q-qcm-valider:hover { filter: brightness(1.1); }
    @media print { .q-qcm-valider { display: none !important; } }
  `;

  function injecterStyle() {
    if (document.getElementById('qcm-clic-style')) return;
    const s = document.createElement('style');
    s.id = 'qcm-clic-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  const indiceDe = (carte) => { const m = /^q-(\d+)$/.exec(carte.id || ''); return m ? Number(m[1]) : -1; };
  const exerciceDe = (idx) => { try { return (typeof exercices !== 'undefined' && exercices[idx]) || null; } catch (e) { return null; } };
  const plusieursReponses = (ex) => !!ex && /,/.test(String(ex.bonneReponse != null ? ex.bonneReponse : (ex.reponse || '')));
  const lettresDe = (champ) => String(champ.value || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

  function ameliorer(carte) {
    if (carte.dataset.qcmClic) return;
    const options = carte.querySelector('.q-qcm-options');
    const idx = indiceDe(carte);
    const champ = idx >= 0 ? document.getElementById('input-' + idx) : null;
    if (!options || !champ || champ.tagName !== 'INPUT') return;
    carte.dataset.qcmClic = '1';
    carte.classList.add('qcm-clic');
    const multiple = plusieursReponses(exerciceDe(idx));
    options.querySelectorAll('.q-qcm-option').forEach((o) => {
      const lettre = (o.querySelector('.q-qcm-lettre') || {}).textContent || '';
      o.classList.add('cliquable');
      o.dataset.lettre = lettre.trim().toLowerCase();
      o.setAttribute('role', multiple ? 'checkbox' : 'button');
      o.setAttribute('tabindex', '0');
    });
    if (multiple && !carte.querySelector('.q-qcm-valider')) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'q-qcm-valider';
      b.textContent = '✓ Valider';
      const enveloppe = options.closest('.q-qcm-options-wrapper') || options;
      enveloppe.insertAdjacentElement('afterend', b);
    }
    synchroniser(carte);
  }

  // vrai/faux : le champ « vrai » / « faux » est remplace par deux boutons (meme apparence que les choix d'un QCM)
  function ameliorerVraiFaux(carte) {
    if (carte.dataset.qcmClic) return;
    const idx = indiceDe(carte);
    const ex = exerciceDe(idx);
    const champ = idx >= 0 ? document.getElementById('input-' + idx) : null;
    if (!ex || ex.type !== 'vraifaux' || !champ || champ.tagName !== 'INPUT') return;
    carte.dataset.qcmClic = '1';
    carte.classList.add('qcm-clic');
    const bloc = document.createElement('div');
    bloc.className = 'q-qcm-options-wrapper';
    bloc.innerHTML = '<div class="q-qcm-options">'
      + '<span class="q-qcm-option cliquable" role="button" tabindex="0" data-valeur="vrai"><span>Vrai</span></span>'
      + '<span class="q-qcm-option cliquable" role="button" tabindex="0" data-valeur="faux"><span>Faux</span></span></div>';
    champ.insertAdjacentElement('beforebegin', bloc);
    synchroniser(carte);
  }

  // l'etat visuel suit toujours la valeur du champ (clic, brouillon repris, « Recommencer »…)
  function synchroniser(carte) {
    const idx = indiceDe(carte);
    const champ = idx >= 0 ? document.getElementById('input-' + idx) : null;
    if (!champ) return;
    const choisies = lettresDe(champ);
    carte.querySelectorAll('.q-qcm-option.cliquable').forEach((o) => {
      const oui = o.dataset.valeur ? String(champ.value || '').trim().toLowerCase() === o.dataset.valeur : choisies.includes(o.dataset.lettre);
      if (o.classList.contains('choisie') !== oui) o.classList.toggle('choisie', oui);
      o.setAttribute('aria-pressed', oui ? 'true' : 'false');
    });
  }
  function toutSynchroniser() { document.querySelectorAll('.question.qcm-clic').forEach(synchroniser); }
  function toutAmeliorer() { document.querySelectorAll('.question').forEach((q) => { ameliorer(q); ameliorerVraiFaux(q); }); }

  function valider(champ) {
    champ.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  }

  function choisir(option) {
    const carte = option.closest('.question');
    const idx = carte ? indiceDe(carte) : -1;
    const champ = idx >= 0 ? document.getElementById('input-' + idx) : null;
    if (!champ) return;
    const lettre = option.dataset.lettre;
    const multiple = !option.dataset.valeur && plusieursReponses(exerciceDe(idx));
    let nouvelles;
    if (option.dataset.valeur) {
      nouvelles = [option.dataset.valeur];   // vrai / faux
    } else if (multiple) {
      const courantes = lettresDe(champ);
      nouvelles = courantes.includes(lettre) ? courantes.filter((l) => l !== lettre) : courantes.concat(lettre);
      nouvelles.sort();
    } else {
      nouvelles = [lettre];
    }
    if (typeof reinitialiserStatut === 'function') reinitialiserStatut(idx);
    champ.value = nouvelles.join(',');
    synchroniser(carte);
    if (!multiple) valider(champ);
  }

  document.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) return;
    const bouton = e.target.closest('.q-qcm-valider');
    if (bouton) {
      const carte = bouton.closest('.question');
      const champ = carte ? document.getElementById('input-' + indiceDe(carte)) : null;
      if (champ) valider(champ);
      return;
    }
    const option = e.target.closest('.q-qcm-option.cliquable');
    if (option) choisir(option);
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key !== 'Enter' && e.key !== ' ') || !(e.target instanceof Element)) return;
    const option = e.target.closest('.q-qcm-option.cliquable');
    if (!option) return;
    e.preventDefault();
    choisir(option);
  });

  // aide « ? » : on clique, on ne tape plus de lettre
  function envelopperAide() {
    const origine = window.aideContextuellePour;
    if (typeof origine !== 'function' || origine.__qcmClic) return;
    const enveloppe = function (ex) {
      const idx = typeof exercices !== 'undefined' ? exercices.indexOf(ex) : -1;
      if (idx >= 0 && ex && ex.type === 'vraifaux' && document.getElementById('input-' + idx) && document.getElementById('input-' + idx).tagName === 'INPUT') {
        return "Cliquer sur « Vrai » ou sur « Faux ».";
      }
      const clique = idx >= 0 && ex && ex.type === 'qcm' && document.querySelector('#q-' + idx + ' .q-qcm-options') && document.getElementById('input-' + idx) && document.getElementById('input-' + idx).tagName === 'INPUT';
      if (clique) {
        return plusieursReponses(ex)
          ? "Cliquer sur toutes les bonnes réponses (plusieurs sont possibles), puis sur « Valider »."
          : "Cliquer sur la bonne réponse.";
      }
      return origine.apply(this, arguments);
    };
    enveloppe.__qcmClic = true;
    window.aideContextuellePour = enveloppe;
  }

  function demarrer() {
    injecterStyle();
    envelopperAide();
    toutAmeliorer();
    toutSynchroniser();
    // cartes (re)construites apres coup : nouvelle fiche, brouillon, devoir
    let planifie = false;
    new MutationObserver((mutations) => {
      if (planifie) return;
      for (const m of mutations) {
        for (const n of m.addedNodes) {
          if (n.nodeType === 1 && (n.matches('.question') || n.querySelector('.question'))) {
            // microtache : la page entiere (cartes + aide) est deja construite quand le callback s'execute
            planifie = true;
            Promise.resolve().then(() => { planifie = false; toutAmeliorer(); envelopperAide(); });
            return;
          }
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
    setInterval(toutSynchroniser, 400);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer); else demarrer();
})();
