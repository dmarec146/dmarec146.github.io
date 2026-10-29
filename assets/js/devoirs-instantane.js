// Bloc « Devoirs » (cloche) pose IMMEDIATEMENT d'apres le dernier etat connu (29/10/2026, retour de David : il apparaissait apres coup et decalait
// la page). Script classique minuscule, place juste APRES l'en-tete dans les pages qui chargent devoirs-notification.js : il s'execute pendant
// la lecture de la page, donc avant le premier affichage, sans attendre Firebase. devoirs-notification.js (module) confirme ou corrige ensuite
// le bloc (voir CLE_CACHE) ; la carte de devoir de l'accueil lit le meme cache (assets/js/vedette-accueil.js).
(function () {
  try {
    var c = JSON.parse(window.localStorage.getItem('cahiers-devoirs-cache') || 'null');
    var entete = document.querySelector('.site-entete');
    if (!c || !(c.n > 0) || typeof c.html !== 'string' || !entete || document.querySelector('.devoir-bloc-enveloppe')) return;
    var bloc = document.createElement('div');
    bloc.className = 'devoir-bloc-enveloppe';
    bloc.innerHTML = c.html;
    entete.insertAdjacentElement('afterend', bloc);
  } catch (e) { /* stockage indisponible ou cache illisible : le bloc viendra de Firebase */ }
})();
