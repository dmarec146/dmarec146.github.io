// En-tête posé AVANT le premier affichage (30/10/2026, retour de David : « clignotement des pages dès que l'on clique sur un bouton du menu »).
// Script classique minuscule, placé juste après </header> : il s'exécute pendant la lecture de la page, donc avant le premier affichage, sans attendre
// les scripts de fin de page ni Firebase. Il pose ce qui, sinon, apparaissait après coup et faisait bouger l'en-tête :
//   - l'icône sigma à gauche du titre (que assets/js/pied-droits.js ajoutait en fin de page) ;
//   - la pastille de la section en cours dans la navigation (aria-current, même règle que pied-droits.js).
//   - les deux icônes du compte (Mes devoirs / tableau de bord, profil), dans leur dernier état connu (même clé que nav-auth.js : CLE_ETAT) ; nav-auth.js
//     les adopte ensuite au lieu d'en créer d'autres, puis l'état réel de la connexion les corrige (voir afficherEtat). Sans cela elles apparaissaient après
//     coup, et « Mes devoirs » / le point vert d'un élève connecté clignotaient à chaque changement de page.
(function () {
  var logo = document.querySelector('.site-logo');
  if (logo && !logo.querySelector('.icone-site')) {
    var span = document.createElement('span');
    span.className = 'icone-site';
    span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="26" height="26" aria-hidden="true" focusable="false">' +
      '<rect width="64" height="64" rx="14" fill="#4B46C7"/>' +
      '<path d="M45 14H20L35 32L20 50H45" fill="none" stroke="#ffffff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M45 14V21M45 50V43" fill="none" stroke="#7DE3C0" stroke-width="5.5" stroke-linecap="round"/></svg>';
    logo.insertBefore(span, logo.firstChild);
  }
  var nav = document.querySelector('.site-nav');
  if (!nav) return;
  if (!document.body.classList.contains('sans-icones') && !nav.querySelector('[data-nav-auth]')) {
    var etat = null;
    try { var v = window.localStorage.getItem('cahiers-nav-etat'); if (v === 'eleve' || v === 'enseignant') etat = v; } catch (e) { /* stockage indisponible */ }
    var lien = document.createElement('a');
    lien.className = 'nav-icone-profil';
    lien.dataset.navAuth = 'true';
    lien.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect fill="currentColor" x="3" y="3" width="8" height="8" rx="1.5"/><rect fill="currentColor" x="13" y="3" width="8" height="5" rx="1.5"/><rect fill="currentColor" x="13" y="10" width="8" height="11" rx="1.5"/><rect fill="currentColor" x="3" y="13" width="8" height="8" rx="1.5"/></svg>';
    var dest = etat === 'enseignant' ? ['/tableau-de-bord/devoirs.html', 'Tableau de bord'] : ['/mes-devoirs/', 'Mes devoirs'];
    lien.href = etat ? dest[0] : '/tableau-de-bord/devoirs.html';
    lien.title = etat ? dest[1] : 'Tableau de bord';
    lien.setAttribute('aria-label', lien.title);
    if (etat) { lien.style.display = 'inline-flex'; lien.style.visibility = 'visible'; } else { lien.style.visibility = 'hidden'; }
    var bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'nav-icone-profil';
    bouton.dataset.navAuth = 'true';
    bouton.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
    if (etat) { bouton.dataset.connecte = 'true'; bouton.title = 'Se déconnecter'; bouton.setAttribute('aria-label', 'Se déconnecter'); }
    nav.appendChild(lien);
    nav.appendChild(bouton);
  }
  var liens = nav.querySelectorAll(':scope > a:not(.nav-icone-profil)');
  if (liens.length !== 4) return;
  var racine = new URL(liens[0].getAttribute('href'), location.href).pathname.replace(/[^\/]*$/, '');
  var chemin = location.pathname;
  var courant = -1;
  if (chemin === racine || chemin === racine + 'index.html') courant = 0;
  for (var k = 1; k < 4; k++) {
    var dossier = new URL(liens[k].getAttribute('href'), location.href).pathname.replace(/[^\/]*$/, '');
    if (chemin.indexOf(dossier) === 0) courant = k;
  }
  if (courant >= 0) liens[courant].setAttribute('aria-current', 'page');
})();
