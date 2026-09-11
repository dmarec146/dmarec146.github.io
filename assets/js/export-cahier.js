(function () {
  'use strict';

  function collecterFiches() {
    return [...document.querySelectorAll('.fiche-lien[href]')].map(a => a.getAttribute('href'));
  }

  function attendreChargement(iframe) {
    return new Promise(resolve => { iframe.addEventListener('load', resolve, { once: true }); });
  }

  // attend que la hauteur ET le nombre d'équations MathJax cessent de bouger (MathJax/MathLive
  // terminent leur mise en page de façon asynchrone, sans évènement fiable à écouter). Garde-fous
  // contre une fausse stabilité détectée trop tôt (avant même que MathJax ait démarré, pendant le
  // bref instant où seul l'en-tête statique existe) : délai plancher avant la première lecture, et
  // on n'accepte "stable" que si au moins une équation a été rendue (toutes les fiches en ont).
  function attendreStabilisation(iframe) {
    return new Promise(resolve => {
      setTimeout(demarrer, 700);
      function demarrer() {
        let derniereH = -1, derniereEq = -1, stable = 0;
        const debut = Date.now();
        (function verifier() {
          let h, nbEq;
          try {
            const doc = iframe.contentDocument;
            h = doc.documentElement.scrollHeight;
            nbEq = doc.querySelectorAll('mjx-container').length;
          } catch (e) { h = derniereH; nbEq = derniereEq; }
          const auDela = Date.now() - debut > 6300; // au-delà, on accepte meme sans equation
          if (h === derniereH && nbEq === derniereEq && h > 0 && (nbEq > 0 || auDela)) stable++; else stable = 0;
          derniereH = h; derniereEq = nbEq;
          if (stable >= 3 || Date.now() - debut > 7000) { resolve(); return; }
          setTimeout(verifier, 250);
        })();
      }
    });
  }

  function attendreRendu() {
    return new Promise(resolve => setTimeout(resolve, 300));
  }

  // remplace chaque <math-field> par un simple <div> statique (même classe, donc même
  // apparence via le CSS déjà cloné) avant de quitter l'iframe. Un cahier entier peut
  // contenir des dizaines de champs MathLive ; ce composant est un éditeur complet (shadow
  // DOM, curseur, rendu interne) coûteux à mettre en page pour Chrome en grand nombre, ce qui
  // provoque un blocage de la boîte d'impression (aperçu qui n'affiche jamais les pages).
  // Un champ déjà rempli garde son contenu en le retypesetant avec MathJax (déjà chargé dans
  // la fiche) avant l'échange, produisant une sortie SVG statique comme pour l'énoncé.
  async function statifierChampsMath(doc) {
    const champs = [...doc.querySelectorAll('math-field.q-mathfield')];
    if (!champs.length) return;
    const win = doc.defaultView;
    const aTypeset = [];
    champs.forEach(mf => {
      const valeur = (mf.value || '').trim();
      const remplacement = doc.createElement('div');
      remplacement.className = mf.className;
      const cs = win.getComputedStyle(mf);
      remplacement.style.display = cs.display;
      remplacement.style.alignItems = cs.alignItems;
      if (valeur) {
        remplacement.textContent = `\\(${valeur}\\)`;
        aTypeset.push(remplacement);
      }
      mf.replaceWith(remplacement);
    });
    if (aTypeset.length && win.MathJax && win.MathJax.typesetPromise) {
      try { await win.MathJax.typesetPromise(aTypeset); } catch (e) { /* ignore */ }
    }
  }

  // charge une fiche dans une iframe temporaire, attend qu'elle soit prête, puis DÉPLACE (pas
  // copie) ses vrais nœuds DOM dans le document principal. Contrairement à une simple iframe
  // laissée en place, ceci évite un défaut connu de Chrome où le contenu chargé dynamiquement
  // dans une iframe n'apparaît pas dans l'impression réelle alors qu'il s'affiche bien à l'écran.
  // Déplacer (et non cloner) les nœuds préserve le rendu déjà construit des champs MathLive
  // (leur shadow DOM), qui ne survivrait pas à une simple copie de HTML.
  async function extraireFiche(url, index) {
    const iframe = document.createElement('iframe');
    iframe.style.width = '980px';
    iframe.style.height = '1200px';
    iframe.style.position = 'absolute';
    iframe.style.left = '-99999px';
    iframe.style.top = '0';
    document.body.appendChild(iframe);
    iframe.src = url;
    await attendreChargement(iframe);
    await attendreStabilisation(iframe);

    const doc = iframe.contentDocument;
    await statifierChampsMath(doc);
    doc.head.querySelectorAll('style').forEach(s => {
      const copie = s.cloneNode(true);
      copie.setAttribute('data-export-cahier', '1');
      document.head.appendChild(copie);
    });

    const section = document.createElement('div');
    section.className = 'export-cahier-fiche';
    while (doc.body.firstChild) {
      const noeud = doc.body.firstChild;
      if (noeud.nodeType === 1 && noeud.tagName === 'SCRIPT') { noeud.remove(); continue; }
      section.appendChild(document.adoptNode(noeud));
    }
    iframe.remove();
    return section;
  }

  async function exporterCahierPDF(bouton) {
    if (bouton.disabled) return;
    const fiches = collecterFiches();
    if (!fiches.length) return;

    bouton.disabled = true;
    document.body.classList.add('mode-export-cahier');

    let conteneur = document.getElementById('export-cahier-conteneur');
    if (!conteneur) {
      conteneur = document.createElement('div');
      conteneur.id = 'export-cahier-conteneur';
      document.body.appendChild(conteneur);
    }
    conteneur.innerHTML = '';
    const statut = document.createElement('p');
    statut.id = 'export-cahier-statut';
    conteneur.appendChild(statut);

    for (let i = 0; i < fiches.length; i++) {
      statut.textContent = `Préparation du PDF… (${i + 1}/${fiches.length})`;
      const section = await extraireFiche(fiches[i], i);
      if (i < fiches.length - 1) section.style.pageBreakAfter = 'always';
      conteneur.appendChild(section);
    }

    statut.remove();
    await attendreRendu();
    window.print();
  }

  function nettoyer() {
    const conteneur = document.getElementById('export-cahier-conteneur');
    if (conteneur) conteneur.remove();
    document.querySelectorAll('style[data-export-cahier]').forEach(s => s.remove());
    document.body.classList.remove('mode-export-cahier');
    document.querySelectorAll('.btn-export-cahier').forEach(b => { b.disabled = false; });
  }

  window.addEventListener('afterprint', nettoyer);
  window.exporterCahierPDF = exporterCahierPDF;
})();
