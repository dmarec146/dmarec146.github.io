// Identite du site sur toutes les pages publiques : icone (sigma) a cote du titre « Cahiers interactifs »,
// favicon, et ligne « © année auteur · Tous droits réservés » en pied de page.
// Un seul script partage, ajoute juste avant </body> de chaque page (cahiers, automatismes, QCM Bac, comptes) :
// aucun pied de page a modifier a la main. Pour changer l'auteur ou l'annee, modifier les deux constantes ci-dessous.
// Une nouvelle page publique doit contenir <script src=".../assets/js/pied-droits.js"></script> avant </body>.
(function () {
  if (window.__piedDroitsPose) return;
  window.__piedDroitsPose = true;

  var ANNEE = '2026';
  var AUTEUR = 'dmarec146';
  var TEXTE = '© ' + ANNEE + ' ' + AUTEUR + ' · Tous droits réservés';
  window.SITE_DROITS = TEXTE;   // repris par l'export PDF des cahiers (assets/js/export-cahier.js)

  // meme dessin que assets/img/icone-cahiers.svg (sigma blanc, extremites vertes, fond indigo)
  function icone(taille) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="' + taille + '" height="' + taille + '" aria-hidden="true" focusable="false">' +
      '<rect width="64" height="64" rx="14" fill="#4B46C7"/>' +
      '<path d="M45 14H20L35 32L20 50H45" fill="none" stroke="#ffffff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M45 14V21M45 50V43" fill="none" stroke="#7DE3C0" stroke-width="5.5" stroke-linecap="round"/></svg>';
  }

  // dossier des images, deduit de l'adresse de ce script (les pages sont a des profondeurs differentes)
  var script = document.currentScript;
  var base = script && script.src ? new URL('../img/', script.src).href : '';

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.textContent =
    '.site-droits-ligne{display:inline-flex;align-items:center;gap:7px;font:12.5px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#6b6a66}' +
    '.site-droits-ligne svg{flex:none;display:block}' +
    '.site-pied .site-droits-ligne{display:flex;justify-content:center;margin-bottom:6px;color:inherit}' +
    'footer.site-droits{text-align:center;margin:28px 0 0;padding:16px 16px 26px;border-top:1px solid #e2e2e2;clear:both}' +
    '.site-logo .icone-site{flex:none;align-self:center;display:block}' +
    'body.mode-export-cahier>footer.site-droits{display:none!important}';
  head.appendChild(style);

  // favicon (SVG, avec des PNG de secours) et icone d'ecran d'accueil, si la page n'en declare pas
  if (!document.querySelector('link[rel~="icon"]') && base) {
    [['icon', 'image/svg+xml', 'icone-cahiers.svg', null], ['icon', 'image/png', 'icone-32.png', '32x32'], ['apple-touch-icon', null, 'icone-180.png', '180x180']].forEach(function (d) {
      var l = document.createElement('link');
      l.rel = d[0]; if (d[1]) l.type = d[1]; if (d[3]) l.sizes = d[3]; l.href = base + d[2];
      head.appendChild(l);
    });
  }

  // icone a gauche du titre, dans l'en-tete standard du site (accueil, sommaires, automatismes, comptes)
  var logo = document.querySelector('.site-logo');
  if (logo && !logo.querySelector('.icone-site')) {
    var span = document.createElement('span');
    span.className = 'icone-site';
    span.innerHTML = icone(26);
    logo.insertBefore(span, logo.firstChild);
  }

  // ligne de droits : dans le pied de page existant, sinon dans un pied de page cree en fin de page
  var ligne = document.createElement('span');
  ligne.className = 'site-droits-ligne';
  ligne.innerHTML = icone(18);
  var texte = document.createElement('span');
  texte.textContent = TEXTE;
  ligne.appendChild(texte);

  var pied = document.querySelector('footer.site-pied');
  if (pied) {
    pied.insertBefore(ligne, pied.firstChild);
  } else {
    var f = document.createElement('footer');
    f.className = 'site-droits';
    f.appendChild(ligne);
    document.body.appendChild(f);
  }
})();

// --- Libelle « QCM Terminale » sur TELEPHONE seulement (David, 25/10/2026) --------------------------------------
// Les pages et les scripts ecrivent « QCM Bac » ; ordinateur et tablette ne changent pas. Sur un ecran de 560 px au
// plus (telephone en vertical), « QCM Bac » est remplace par « QCM Terminale », et inversement quand l'ecran
// s'elargit (rotation). Les deux titres qui disent aussi « Terminale » sont reformules pour ne pas le repeter.
// Les textes ecrits plus tard par les scripts (sous-titres, titres de devoirs) sont traites aussi.
// Le titre de l'onglet (document.title), les adresses et les identifiants ne changent pas.
(function () {
  if (!window.matchMedia) return;
  // fiches de calcul : aucun libelle « QCM » et un contenu qui bouge beaucoup (MathJax, saisie) : on ne les surveille pas
  if (/\/fiche-\d+\.html$/.test(location.pathname)) return;
  var mq = window.matchMedia('(max-width: 560px)');
  var OMIS = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1 };
  // [texte ordinateur, texte telephone] ; les formes longues d'abord
  var PAIRES = [
    ['QCM Bac — Terminale spécialité', 'QCM Terminale — spécialité mathématiques'],
    ['QCM Bac de Terminale spécialité', 'QCM Terminale (spécialité mathématiques)'],
    ['QCM Bac', 'QCM Terminale']
  ];
  var planifie = false;

  function remplacer() {
    planifie = false;
    if (!document.body) return;
    var tel = mq.matches;
    var arbre = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var noeud, tous = [];
    while ((noeud = arbre.nextNode())) { if (!OMIS[noeud.parentNode && noeud.parentNode.nodeName]) tous.push(noeud); }
    tous.forEach(function (n) {
      var v = n.nodeValue, w = v;
      PAIRES.forEach(function (p) { w = w.split(tel ? p[0] : p[1]).join(tel ? p[1] : p[0]); });
      if (w !== v) n.nodeValue = w;
    });
  }
  function planifier() { if (!planifie) { planifie = true; (window.requestAnimationFrame || setTimeout)(remplacer); } }

  remplacer();
  if (mq.addEventListener) mq.addEventListener('change', remplacer); else if (mq.addListener) mq.addListener(remplacer);
  if (window.MutationObserver && document.body) {
    new MutationObserver(planifier).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
})();
