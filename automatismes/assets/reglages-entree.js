// Reglages d'entree des Automatismes et des QCM Terminale (25/10/2026, choix de David apres maquette).
//
// Au lieu de deux gros panneaux « Mode de travail » / « Niveau de difficulte » au milieu de la page de travail, le
// mode (fiche ou chrono), le niveau (1, 2 ou 3) et, en chrono, le temps par question se reglent UNE FOIS sur la page
// d'entree. Toucher ensuite une ligne (fiche, sujet blanc, theme precis) lance la serie avec ces reglages : ils sont
// ajoutes a l'adresse du lien (?mode=…&niveau=…&duree=…) et lus par moteur.js (demarrer). Valeurs par defaut :
// fiche et niveau 2 ; le dernier choix est memorise sur l'appareil (localStorage, une cle par section).
//
// A utiliser ainsi, dans la page d'entree : un <div id="reglages-entree"></div> a l'endroit voulu, puis AVANT ce script
//   <script>window.REGLAGES_ENTREE = { cle: 'auto', niveaux: { 1: '…', 2: '…', 3: '…' } };</script>
// Les liens concernes sont les <a class="fiche-lien"> et <a class="theme-etiquette"> de la page. Les devoirs n'y
// passent pas (l'eleve arrive par « Mes devoirs ») : niveau et mode y restent imposes par le professeur.
(function () {
  var conf = window.REGLAGES_ENTREE;
  var zone = document.getElementById('reglages-entree');
  if (!conf || !zone) return;

  var DUREES = [[60, '1 min'], [90, '1 min 30'], [120, '2 min (recommandé)'], [180, '3 min'], [0, 'Sans limite']];
  var INDICE_MODE = {
    fiche: 'Toutes les questions sont affichées : réponds à ton rythme, puis « Voir toutes les réponses » en bas de la page.',
    chrono: 'Une question à la fois, avec un minuteur par question, comme le jour de l\'épreuve. La correction n\'apparaît qu\'à la fin.'
  };
  var CLE = 'reglages-entree-' + conf.cle;
  var etat = { mode: 'fiche', niveau: 2, duree: 120 };

  try {
    var memo = JSON.parse(localStorage.getItem(CLE) || 'null');
    if (memo) {
      if (memo.mode === 'fiche' || memo.mode === 'chrono') etat.mode = memo.mode;
      if (memo.niveau === 1 || memo.niveau === 2 || memo.niveau === 3) etat.niveau = memo.niveau;
      if (DUREES.some(function (d) { return d[0] === memo.duree; })) etat.duree = memo.duree;
    }
  } catch (e) { /* mode prive ou stockage refuse : valeurs par defaut */ }

  zone.innerHTML =
    '<section class="reglages-carte" aria-label="Mes réglages">' +
      '<h2 class="reglages-titre">Mes réglages</h2>' +
      '<div class="reglages-bloc">' +
        '<p class="reglages-lab" id="rl-mode">Mode</p>' +
        '<div class="reglages-seg reglages-seg--2" role="group" aria-labelledby="rl-mode">' +
          '<button type="button" data-mode="fiche">Mode fiche</button>' +
          '<button type="button" data-mode="chrono">Mode chrono ⏱</button>' +
        '</div>' +
        '<p class="reglages-indice" id="rl-indice-mode"></p>' +
      '</div>' +
      '<div class="reglages-bloc">' +
        '<p class="reglages-lab" id="rl-niveau">Niveau</p>' +
        '<div class="reglages-seg reglages-seg--3" role="group" aria-labelledby="rl-niveau">' +
          '<button type="button" data-niveau="1">★ 1</button>' +
          '<button type="button" data-niveau="2">★★ 2 · épreuve</button>' +
          '<button type="button" data-niveau="3">★★★ 3</button>' +
        '</div>' +
        '<p class="reglages-indice" id="rl-indice-niveau"></p>' +
      '</div>' +
      '<div class="reglages-bloc reglages-duree" id="rl-duree-bloc">' +
        '<label class="reglages-lab" for="rl-duree">Temps par question</label>' +
        '<select id="rl-duree">' + DUREES.map(function (d) { return '<option value="' + d[0] + '">' + d[1] + '</option>'; }).join('') + '</select>' +
        '<p class="reglages-indice">Quand le temps est écoulé, on passe automatiquement à la question suivante.</p>' +
      '</div>' +
    '</section>';

  // adresse d'origine de chaque lien de lancement (avec son éventuel ?theme=…)
  var liens = Array.prototype.slice.call(document.querySelectorAll('a.fiche-lien, a.theme-etiquette'));
  liens.forEach(function (a) { a.setAttribute('data-base', a.getAttribute('href')); });

  function afficher() {
    zone.querySelectorAll('[data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-mode') === etat.mode ? 'true' : 'false'); });
    zone.querySelectorAll('[data-niveau]').forEach(function (b) { b.setAttribute('aria-pressed', Number(b.getAttribute('data-niveau')) === etat.niveau ? 'true' : 'false'); });
    document.getElementById('rl-indice-mode').textContent = INDICE_MODE[etat.mode];
    document.getElementById('rl-indice-niveau').textContent = conf.niveaux[etat.niveau];
    document.getElementById('rl-duree-bloc').hidden = etat.mode !== 'chrono';
    document.getElementById('rl-duree').value = String(etat.duree);
    var params = 'mode=' + etat.mode + '&niveau=' + etat.niveau + (etat.mode === 'chrono' ? '&duree=' + etat.duree : '');
    liens.forEach(function (a) {
      var base = a.getAttribute('data-base');
      a.setAttribute('href', base + (base.indexOf('?') === -1 ? '?' : '&') + params);
    });
    try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) { /* sans importance */ }
  }

  zone.addEventListener('click', function (ev) {
    var b = ev.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-mode')) etat.mode = b.getAttribute('data-mode');
    else if (b.hasAttribute('data-niveau')) etat.niveau = Number(b.getAttribute('data-niveau'));
    else return;
    afficher();
  });
  zone.addEventListener('change', function (ev) {
    if (ev.target.id === 'rl-duree') { etat.duree = Number(ev.target.value); afficher(); }
  });
  // retour arriere du navigateur : la page peut revenir du cache avec d'anciens liens
  window.addEventListener('pageshow', afficher);
  afficher();
})();
