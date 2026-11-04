// Vérification de version du site (04/11/2026, demande de David : les élèves ne rechargent jamais leurs pages, donc ne voient
// pas les modifications quotidiennes). Script classique, chargé par assets/js/pied-droits.js sur toutes les pages publiques.
//
// À la publication sur Firebase Hosting (outils/hosting/publier-hosting.js), chaque page reçoit <meta name="version-site"
// content="<commit>"> et un fichier /version.json donne la version en ligne. Quand l'élève revient sur l'onglet (ou toutes les
// 15 minutes pour une page restée affichée), la page compare sa version à celle de /version.json :
//   - page « sans travail en cours » (accueil, listes, sommaires, Mes devoirs) : rechargement automatique ;
//   - toute autre page (fiche, sujet, tableau de bord, formulaire) : bandeau « nouvelle version, recharger » -- jamais de
//     rechargement forcé, pour ne pas faire perdre une réponse en cours de saisie.
// Sans la balise (copie GitHub Pages, page ouverte en local) : rien ne se passe.
(function () {
  var meta = document.querySelector('meta[name="version-site"]');
  if (!meta || !meta.content || window.__versionSurveillee) return;
  window.__versionSurveillee = true;
  var maVersion = meta.content;
  var derniereVerification = 0;
  var bandeauPose = false;

  // Pages où recharger ne fait rien perdre : aucune saisie possible hors formulaire de connexion (non concerné : on ne recharge
  // pas si un champ a le focus).
  function pageSansTravail() {
    var p = location.pathname.replace(/index\.html$/, '');
    var actif = document.activeElement;
    if (actif && /^(INPUT|TEXTAREA|SELECT|MATH-FIELD)$/i.test(actif.tagName)) return false;
    return p === '/' || p === '/cahiers/' || p === '/automatismes/' || p === '/qcm-bac/' || p === '/mes-devoirs/'
      || /^\/cahiers\/(seconde|premiere|terminale)\/cahier-\d+\/$/.test(p)
      || /^\/automatismes\/[a-z]+\/$/.test(p);
  }

  function poserBandeau() {
    if (bandeauPose) return;
    bandeauPose = true;
    var b = document.createElement('div');
    b.setAttribute('role', 'status');
    b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483000;display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;'
      + 'justify-content:center;padding:10px 16px;background:#4B46C7;color:#fff;font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;'
      + 'box-shadow:0 -2px 10px rgba(0,0,0,.25)';
    var t = document.createElement('span');
    t.textContent = 'Une nouvelle version du site est disponible. Termine ou enregistre ton exercice, puis recharge la page.';
    var bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.textContent = 'Recharger';
    bouton.style.cssText = 'font:inherit;font-weight:600;padding:6px 14px;border:0;border-radius:8px;background:#fff;color:#4B46C7;cursor:pointer';
    bouton.addEventListener('click', function () { location.reload(); });
    b.appendChild(t);
    b.appendChild(bouton);
    document.body.appendChild(b);
  }

  function verifier() {
    if (bandeauPose || Date.now() - derniereVerification < 60000) return;
    derniereVerification = Date.now();
    fetch('/version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.version || j.version === maVersion) return;
        if (pageSansTravail()) location.reload(); else poserBandeau();
      })
      .catch(function () { /* hors ligne ou fichier absent : rien */ });
  }

  document.addEventListener('visibilitychange', function () { if (!document.hidden) verifier(); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) verifier(); });
  setInterval(function () { if (!document.hidden) verifier(); }, 15 * 60 * 1000);
})();
