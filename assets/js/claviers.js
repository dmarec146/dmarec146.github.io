// Claviers de saisie des fiches, retouches communes aux 52 fiches (charge
// juste apres https://unpkg.com/mathlive dans chacune).
//
// 1. Clavier virtuel MathLive (bouton ⌨ des champs <math-field>) : accolades
//    (30/09/2026, demande de David -- seuls ( ) et [ ] y figuraient, genant
//    pour ecrire l'ensemble des solutions d'une equation, ex. {-2;3}).
// 2. Claviers simplifies (propres a chaque fiche) : toujours les quatre
//    operations + − × ÷ (30/09/2026, demande de David -- plusieurs claviers
//    specialises, intervalles, ensembles, cercle, valeur absolue... n'en
//    avaient que certaines ; ÷ permet d'ecrire une fraction).

(function () {
  // --- 1. Accolades sur le clavier MathLive ---------------------------------
  //
  // Plutot que de redefinir toute la disposition "123" (fragile d'une version
  // de MathLive a l'autre, le script est charge sans numero de version), on
  // part des dispositions normalisees fournies par MathLive lui-meme, et sur
  // la couche "123" : l'integrale (avec ses bornes, inchangee) prend la place
  // du "i" des nombres complexes (hors programme de Seconde/Premiere), puis
  // "{" (Maj : ∅) et "}" (Maj : ;) prennent les places liberees de l'integrale
  // et de "∀" (∀ et ∃ restent sur la couche "∞≠∈"). Deux touches separees
  // plutot qu'une paire "{▢}" : laissee vide, celle-ci serait lue "{()}" et
  // non "{}" (ensemble vide). Si ces touches ne sont pas trouvees (MathLive
  // modifie), rien n'est change.

  function toucheContient(touche, motif) {
    if (!touche || typeof touche !== 'object') return false;
    return [touche.latex, touche.insert, touche.label].some((v) => typeof v === 'string' && v.includes(motif));
  }

  function trouverTouche(lignes, motif) {
    for (const ligne of lignes) {
      const i = ligne.findIndex((t) => toucheContient(t, motif));
      if (i >= 0) return { ligne, i };
    }
    return null;
  }

  function ajouterAccolades() {
    const clavier = window.mathVirtualKeyboard;
    if (!clavier || !Array.isArray(clavier.normalizedLayouts)) return;
    const dispositions = JSON.parse(JSON.stringify(clavier.normalizedLayouts));
    const numerique = dispositions[0];
    const lignes = numerique && numerique.layers && numerique.layers[0] && numerique.layers[0].rows;
    if (!Array.isArray(lignes)) return;

    const integrale = trouverTouche(lignes, '\\int');
    const pourTout = trouverTouche(lignes, '\\forall');
    const imaginaire = trouverTouche(lignes, '\\imaginaryI');
    if (!integrale || !pourTout || !imaginaire) return;

    imaginaire.ligne[imaginaire.i] = integrale.ligne[integrale.i];
    integrale.ligne[integrale.i] = { label: '{', insert: '\\{', tooltip: 'Accolade ouvrante', shift: { label: '∅', insert: '\\emptyset' } };
    pourTout.ligne[pourTout.i] = { label: '}', insert: '\\}', tooltip: 'Accolade fermante', shift: { label: ';', insert: ';' } };
    clavier.layouts = dispositions;
  }

  if (window.customElements && customElements.whenDefined) {
    customElements.whenDefined('math-field').then(ajouterAccolades).catch(() => {});
  }

  // --- 2. Quatre operations sur les claviers simplifies ----------------------
  //
  // Les claviers sont generes par chaque fiche (genererClavierPour,
  // genererClavierMathEnsemble... -- nombreuses variantes) : on les complete
  // apres coup dans le DOM, a chaque (re)generation, plutot que de retoucher
  // chaque variante. Les touches manquantes rejoignent le groupe qui contient
  // deja une operation (ou a/b), sinon un nouveau groupe "Opérations" place
  // avant l'astuce. Claviers sans rien de numerique (QCM a/b/c/d, vrai/faux)
  // laisses tels quels.

  const OPERATIONS = [
    { label: '+', texte: '+', latex: '+' },
    { label: '−', texte: '-', latex: '-' },
    { label: '×', texte: '*', latex: '\\times' },
    // ÷ en champ mathematique : fraction a deux cases grisees, comme a/b
    // (retour de David le 30/09/2026 -- la premiere version, '\frac{#@}{#?}',
    // prenait le nombre tape juste avant comme numerateur, sans case grisee).
    // Une selection eventuelle devient le numerateur (#0).
    { label: '÷', texte: '/', latex: '\\frac{#0}{#0}' },
  ];
  const libelle = (b) => b.textContent.trim().replace('-', '−');
  const estOperation = (b) => OPERATIONS.some((op) => op.label === libelle(b)) || libelle(b) === 'a/b';

  // Champ texte : meme insertion que les touches existantes (inserer, "*"
  // et "/" comme le groupe "Opérations" des claviers complets). Champ
  // mathematique : insererMath si la fiche l'a (clavier ensembles/cercle de
  // Premiere), sinon inserer, qui gere alors lui-meme le <math-field>.
  function insererOperation(idx, op) {
    const champ = document.getElementById('input-' + idx);
    if (!champ) return;
    if (champ.tagName !== 'MATH-FIELD') { window.inserer(idx, op.texte); return; }
    if (typeof window.insererMath === 'function') {
      window.insererMath(idx, op.latex);
      if (typeof window.reinitialiserStatut === 'function') window.reinitialiserStatut(idx);
    } else {
      window.inserer(idx, op.latex);
    }
  }

  function creerTouche(idx, op) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = op.label;
    b.addEventListener('click', () => insererOperation(idx, op));
    return b;
  }

  function completerClavier(clavier) {
    const idx = clavier.id.replace('clavier-', '');
    let boutons = [...clavier.querySelectorAll('.clavier-groupe button')];
    const numerique = boutons.some((b) => /^[0-9]$/.test(libelle(b)) || estOperation(b) || libelle(b) === '√');
    if (!numerique || typeof window.inserer !== 'function') return;
    // Ancienne touche "/" (3 fiches) : remplacee sur place par ÷, plutot que
    // d'avoir les deux.
    const barre = boutons.find((b) => libelle(b) === '/');
    if (barre && !boutons.some((b) => libelle(b) === '÷')) {
      barre.replaceWith(creerTouche(idx, OPERATIONS[3]));
      boutons = [...clavier.querySelectorAll('.clavier-groupe button')];
    }
    const presents = new Set(boutons.map(libelle));
    const manquantes = OPERATIONS.filter((op) => !presents.has(op.label));
    if (!manquantes.length) return;

    // Groupe d'accueil : celui d'une operation autre que "−" (le "−" est
    // souvent dans le groupe Intervalle, a cote de +∞/−∞), puis celui de
    // a/b, puis de √, puis du "−".
    const accueil = ['+', '×', '÷', 'a/b', '√', '−']
      .map((l) => boutons.find((b) => libelle(b) === l)).find(Boolean);
    let groupe = accueil && accueil.closest('.clavier-groupe');
    if (!groupe) {
      groupe = document.createElement('div');
      groupe.className = 'clavier-groupe';
      groupe.innerHTML = '<span class="clavier-label">Opérations</span>';
      // Avant l'astuce, ou avant le groupe final Effacer / Suppr. s'il est
      // a part, sinon a la fin.
      const groupeEffacer = [...clavier.querySelectorAll(':scope > .clavier-groupe')]
        .find((g) => g.querySelector('button') && [...g.querySelectorAll('button')].every((b) => b.classList.contains('touche-effacer')));
      clavier.insertBefore(groupe, clavier.querySelector(':scope > .clavier-apercu') || groupeEffacer || null);
    }
    // Ordre + − × ÷ : chaque touche ajoutee se place apres l'operation qui la
    // precede dans cet ordre (si presente dans le groupe), sinon avant la
    // premiere operation du groupe, sinon avant Effacer/Suppr., sinon a la fin.
    for (const op of manquantes) {
      const touche = creerTouche(idx, op);
      const rang = OPERATIONS.indexOf(op);
      const dansGroupe = [...groupe.querySelectorAll('button')];
      const precedente = dansGroupe.filter((b) => OPERATIONS.findIndex((o) => o.label === libelle(b)) > -1 && OPERATIONS.findIndex((o) => o.label === libelle(b)) < rang).pop();
      const reference = precedente ? precedente.nextSibling
        : (dansGroupe.find(estOperation) || groupe.querySelector('.touche-effacer'));
      groupe.insertBefore(touche, reference || null);
    }
  }

  // --- 3. Focus des champs mathematiques pendant la saisie au clavier -------
  //
  // Retour de David (30/09/2026, Seconde 06, 6.6 b) : avec le clavier
  // simplifie, la case a remplir d'une fraction ou d'une racine apparaissait
  // mais pas grisee, contrairement au clavier MathLive. La case grisee est la
  // selection du <math-field>, visible seulement quand il a le focus : or un
  // clic sur une touche le lui retirait (seules Premiere 01-04 l'evitaient,
  // par leur propre ecouteur "mousedown"), et l'insertion se faisait
  // ensuite dans un champ sans focus. Donc, pour toute touche d'un clavier
  // simplifie rattache a un <math-field> :
  //   - "mousedown" sans action par defaut : le champ garde le focus ;
  //   - au clic, avant le gestionnaire de la touche (phase de capture), le
  //     champ reprend le focus s'il l'avait perdu (ex. clavier ouvert par
  //     le bouton ⌨) -- MathLive conserve la position du curseur.
  function champMathDuClavier(cible) {
    const clavier = cible instanceof Element && cible.closest('.clavier-visuel[id^="clavier-"]');
    if (!clavier) return null;
    const champ = document.getElementById('input-' + clavier.id.replace('clavier-', ''));
    return champ && champ.tagName === 'MATH-FIELD' ? champ : null;
  }
  document.addEventListener('mousedown', (e) => {
    if (champMathDuClavier(e.target)) e.preventDefault();
  }, true);
  document.addEventListener('click', (e) => {
    const bouton = e.target instanceof Element && e.target.closest('button');
    const champ = bouton && champMathDuClavier(bouton);
    if (champ && !champ.hasFocus?.() && document.activeElement !== champ) champ.focus();
  }, true);

  // Champs mathematiques prevus sans clavier MathLive (attribut
  // virtual-keyboard-mode="off", nom d'avant MathLive 0.90 -- ignore par la
  // version chargee, dont la politique par defaut "auto" ouvre le clavier
  // MathLive des qu'un champ recoit le focus sur ecran tactile, par-dessus
  // le clavier simplifie) : politique "manual", le clavier MathLive ne
  // s'ouvre plus de lui-meme.
  // Attribut ET propriete : l'attribut pose avant l'initialisation du
  // composant n'est pas toujours pris en compte (constate le 30/09/2026).
  function reglerPolitiqueClavier() {
    document.querySelectorAll('math-field[virtual-keyboard-mode="off"]').forEach((mf) => {
      if (mf.getAttribute('math-virtual-keyboard-policy') !== 'manual') mf.setAttribute('math-virtual-keyboard-policy', 'manual');
      if ('mathVirtualKeyboardPolicy' in mf && mf.mathVirtualKeyboardPolicy !== 'manual') mf.mathVirtualKeyboardPolicy = 'manual';
    });
  }
  if (window.customElements && customElements.whenDefined) {
    customElements.whenDefined('math-field').then(() => requestAnimationFrame(reglerPolitiqueClavier)).catch(() => {});
  }

  let planifie = false;
  function completerClaviers() {
    planifie = false;
    document.querySelectorAll('.clavier-visuel[id^="clavier-"]').forEach(completerClavier);
    reglerPolitiqueClavier();
  }
  function planifier() {
    if (planifie) return;
    planifie = true;
    requestAnimationFrame(completerClaviers);
  }

  new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (n.nodeType === 1 && (n.matches('.clavier-visuel, .clavier-groupe') || n.querySelector('.clavier-visuel'))) { planifier(); return; }
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', planifier);
})();

// --- 4. Champs a SEPARATEUR (intervalles, ensembles, couples) : saisie au clavier -------------
//
// 05/10/2026, retour de David (fiche 2 de Premiere : « [ » tape au clavier non pris en compte,
// affichage cassé, crochet disparu au retour sur la fiche), puis audit des claviers. Deux
// defauts de MathLive 0.111 dans les champs dont le placeholder contient « ; » :
//
// a) FERMETURE AUTOMATIQUE. L'attribut smart-fence="off" ecrit dans les fiches n'est pas pris en
//    compte par cette version (la propriete smartFence reste vraie, comme virtual-keyboard-mode) :
//    taper « [ » ajoutait une paire « [ ] » (la reponse ]-2;5[ etait lue ]-2;5[] , un « ] » en
//    trop) et « { » une paire « { } ». On force donc la propriete smartFence = false.
//
// b) SORTIE DE LA FRACTION OU DE LA RACINE. Apres une fraction (bouton a/b ou ÷, ou « / ») le
//    curseur reste au DENOMINATEUR, et dans une racine sous le radical : un « [ », « ; » ou « } »
//    tape ensuite entrait dans le denominateur (\frac{7}{[2}, \frac{1}{2\rbrace}) ou sous la
//    racine, la reponse etait lue fausse. Ces caracteres sortent donc d'abord de la fraction ou
//    de la racine : « [ », « ] » et « ; » toujours ; « } » et « ) » seulement si aucune
//    accolade / parenthese n'est ouverte dans la branche courante (« (1/(2))... » garde ses
//    parentheses). Sans effet a la racine du champ.
(function () {
  const SEPARATEURS = ['[', ']', ';'];
  const FERMANTS = { '}': ['{', '}'], ')': ['(', ')'] };
  // Touches du clavier a l'ecran (argument de insererMath) : meme regle.
  const TOUCHES_TOUJOURS = ['[', ']', ';', '\\cup', '\\cap'];
  const TOUCHES_FERMANTES = { '\\}': '}', '}': '}' };

  // Champ a separateur : placeholder avec « ; » ((x;y), {a;b}, ]a;b[) ou, a defaut (le placeholder
  // depend du type de question), clavier maison rattache au champ muni d'une touche « ; ».
  function champASeparateurs(mf) {
    if (!mf || mf.tagName !== 'MATH-FIELD') return false;
    if (/;/.test(mf.getAttribute('placeholder') || '')) return true;
    const clavier = document.getElementById('clavier-' + String(mf.id).replace('input-', ''));
    return !!clavier && [...clavier.querySelectorAll('button')].some((b) => b.textContent.trim() === ';');
  }

  function reglerFences() {
    document.querySelectorAll('math-field').forEach((mf) => {
      if (champASeparateurs(mf) && mf.smartFence !== false) {
        try { mf.smartFence = false; } catch (erreur) { /* version de MathLive sans cette propriete */ }
      }
    });
  }

  // Contenu de la branche courante (numerateur, denominateur, sous la racine) avant le curseur.
  function contenuAvantCurseur(mf) {
    const p = mf.position;
    try {
      mf.executeCommand('moveToGroupStart');
      return mf.getValue(mf.position, p, 'latex');
    } catch (erreur) {
      return '';
    } finally {
      mf.position = p;
    }
  }

  function nombre(texte, motif) { return (texte.match(motif) || []).length; }

  // Vrai si le caractere fermant ne ferme rien dans la branche courante (donc : il sort).
  function fermantSansOuvrant(mf, car) {
    const branche = contenuAvantCurseur(mf);
    if (car === ')') return nombre(branche, /\(/g) - nombre(branche, /\)/g) <= 0;
    return nombre(branche, /\\lbrace|\\\{/g) - nombre(branche, /\\rbrace|\\\}/g) <= 0;
  }

  function sortirDuModele(mf) {
    try {
      for (let i = 0; i < 6; i++) {
        const avant = mf.position;
        mf.executeCommand('moveAfterParent');
        if (mf.position === avant) break;   // a la racine : rien a quitter
      }
    } catch (erreur) { /* version de MathLive sans cette commande : comportement inchange */ }
  }

  function avantCaractere(mf, car) {
    if (!champASeparateurs(mf)) return;
    if (SEPARATEURS.includes(car)) sortirDuModele(mf);
    else if (FERMANTS[car] && fermantSansOuvrant(mf, car)) sortirDuModele(mf);
  }

  // Clavier physique : avant que MathLive n'insere le caractere (phase de capture, sur le document).
  document.addEventListener('keydown', (evenement) => {
    if (evenement.isComposing || evenement.key.length !== 1) return;
    avantCaractere(evenement.target, evenement.key);
  }, true);
  // « / » tape juste apres un « ] » d'ouverture (]3/2;5[) : MathLive prend le « ] » pour la fin d'un
  // groupe et le met dans le numerateur (\frac{]3}{2}). Le numerateur est donc construit a la main :
  // seulement l'operande qui suit le « ] », le curseur arrive au denominateur.
  document.addEventListener('keydown', (evenement) => {
    if (evenement.isComposing || evenement.key !== '/' || evenement.ctrlKey || evenement.metaKey) return;
    const mf = evenement.target;
    if (!champASeparateurs(mf)) return;
    const operande = contenuAvantCurseur(mf).match(/\](\d+(?:[.,]\d+)?|[a-zA-Z])$/);
    if (!operande) return;
    evenement.preventDefault();
    evenement.stopPropagation();
    try {
      for (let i = 0; i < operande[1].length; i++) mf.executeCommand('extendSelectionBackward');
      mf.insert('\\frac{#@}{#?}', { focus: true });
    } catch (erreur) { /* version de MathLive differente : comportement d'origine perdu pour ce cas seulement */ }
  }, true);
  // Saisie sans keydown fiable (clavier mobile, dictee) : meme sortie sur beforeinput.
  document.addEventListener('beforeinput', (evenement) => {
    if (evenement.isComposing || evenement.inputType !== 'insertText' || !evenement.data || evenement.data.length !== 1) return;
    avantCaractere(evenement.target, evenement.data);
  }, true);

  // Touches du clavier a l'ecran : chaque fiche definit insererMath (claviers maison des champs
  // mathematiques de Premiere) et/ou inserer (claviers simplifies, qui gerent aussi les champs
  // mathematiques) ; les deux sont enveloppees.
  function envelopper(nom) {
    const origine = window[nom];
    if (typeof origine !== 'function' || origine.__sortie) return;
    const enveloppe = function (idx, texte) {
      const mf = document.getElementById('input-' + idx);
      if (champASeparateurs(mf)
        && (TOUCHES_TOUJOURS.includes(texte) || (TOUCHES_FERMANTES[texte] && fermantSansOuvrant(mf, TOUCHES_FERMANTES[texte])))) {
        sortirDuModele(mf);
        // Variante « inserer » : la fiche garde en memoire que la racine est ouverte et ferait un
        // deplacement de trop ; on la declare refermee.
        try { if (typeof boiteRacineOuverte === 'object') boiteRacineOuverte[idx] = false; } catch (erreur) { /* absente */ }
      }
      return origine.apply(this, arguments);
    };
    enveloppe.__sortie = true;
    window[nom] = enveloppe;
  }

  function demarrer() {
    envelopper('insererMath');
    envelopper('inserer');
    reglerFences();
  }
  if (window.customElements && customElements.whenDefined) {
    customElements.whenDefined('math-field').then(() => requestAnimationFrame(reglerFences)).catch(() => {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer); else demarrer();
  // Champs (re)generes apres coup (nouvelle fiche, brouillon, devoir).
  let fencePlanifie = false;
  new MutationObserver((mutations) => {
    if (fencePlanifie) return;
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (n.nodeType === 1 && (n.tagName === 'MATH-FIELD' || n.querySelector('math-field'))) {
          fencePlanifie = true;
          requestAnimationFrame(() => { fencePlanifie = false; reglerFences(); });
          return;
        }
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
