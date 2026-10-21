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
