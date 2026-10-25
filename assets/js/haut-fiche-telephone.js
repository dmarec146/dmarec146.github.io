// Haut des pages de travail (fiches de calcul, fiches et sujets blancs d'automatismes, QCM Terminale) sur
// TELEPHONE EN PORTRAIT -- refonte du 25/10/2026 validee par David. Un ecran de 560 px au plus, orientation
// portrait : le haut de la page tient sur peu de hauteur pour que la premiere question apparaisse sans defiler.
// Ordinateur, tablette et telephone en paysage ne sont pas concernes (la regle n'existe que sous cette condition).
//
// Ces pages n'ont pas la feuille assets/css/style.css : chacune a son propre CSS. Ce script, charge dans le <head>
// juste apres la balise viewport, injecte les regles ; comme il passe AVANT le <style> de la page, chaque selecteur
// est precede de « body » pour l'emporter a specificite egale.
//   - le fil d'Ariane est masque (le bouton « Sommaire » ramene au cahier) ;
//   - la barre de navigation tient sur UNE ligne de cibles de 44 px. Fiches de calcul (elles ont l'icone PDF) :
//     « Sommaire », fleches ‹ et › (le texte « Fiche precedente / suivante » reste lu par les lecteurs d'ecran),
//     icone PDF, puis les icones ajoutees par nav-auth.js (tableau de bord pour un admin seulement, profil).
//     Automatismes et QCM : « Sommaire » et le lien de retour restent des boutons a texte ;
//   - le filet sous le titre disparait, le bandeau de calculatrice, la consigne et les panneaux de mode sont plus
//     compacts (boutons en deux colonnes, cibles de 44 px) ;
//   - en DEVOIR (zone « Valider » visible, fiches de calcul), « Enregistrer » et « Valider ma fiche » se fixent dans
//     une barre en bas de l'ecran, toujours accessible (le clavier mathematique de MathLive passe devant elle quand
//     il est ouvert).
(function () {
  var BAR = '.barre-controle > ';
  var FICHE = '.barre-navigation:has(.nav-btn-pdf) ';
  var regles = [
    ['.fil-ariane', 'display: none'],
    ['.barre-navigation', 'flex-wrap: nowrap; align-items: center; gap: 6px; margin-bottom: 10px'],
    ['.barre-navigation .nav-btn', 'min-height: 44px; border-radius: 12px; font-size: 14.5px; padding: 0 10px'],
    ['.barre-navigation .nav-btn[data-nav-auth], ' + FICHE + '.nav-btn:not(.nav-btn-sommaire)', 'flex: 0 0 44px !important; width: 44px !important; min-width: 44px; padding: 0 !important; font-size: 0'],
    ['.barre-navigation .nav-btn svg', 'width: 20px; height: 20px; margin: 0'],
    ['.barre-navigation .nav-btn[style*="hidden"]', 'display: none !important'],
    ['.barre-navigation .nav-btn-sommaire', 'flex: 1 1 auto !important; width: auto !important; font-size: 15px; padding: 0 14px !important; justify-content: flex-start'],
    [FICHE + '.nav-btn:nth-child(2)::before, ' + FICHE + '.nav-btn:nth-child(3)::before', 'font-size: 30px; line-height: 1; padding-bottom: 3px'],
    [FICHE + '.nav-btn:nth-child(2)::before', 'content: "\\2039"'],
    [FICHE + '.nav-btn:nth-child(3)::before', 'content: "\\203A"'],
    ['.entete', 'margin-bottom: 8px'],
    ['.entete + .filet', 'display: none'],
    ['.bandeau-calculatrice', 'text-align: left; font-size: 13px; padding: 7px 12px; margin-bottom: 10px'],
    ['.consigne-epreuve', 'font-size: 13.5px; line-height: 1.45; padding: 10px 12px; margin-bottom: 10px'],
    ['.mode-panneau', 'display: grid; grid-template-columns: 1fr 1fr; gap: 6px 8px; padding: 10px 12px; margin-bottom: 10px'],
    ['.mode-panneau[hidden]', 'display: none'],
    ['.mode-label', 'grid-column: 1 / -1; width: auto; font-size: 14px; margin: 0'],
    ['.mode-btn', 'min-height: 44px; border-radius: 12px; font-size: 14px; padding: 6px 8px'],
    ['.mode-explication', 'grid-column: 1 / -1; font-size: 13px; margin: 0'],
    ['.devoir-info', 'margin: 0 0 10px; font-size: 13.5px'],
    [BAR + '#zone-enregistrer:not([hidden]), ' + BAR + '#zone-valider:not([hidden])', 'position: fixed; z-index: 81; bottom: calc(11px + env(safe-area-inset-bottom, 0px)); height: 50px; display: block'],
    [BAR + '#zone-enregistrer', 'left: 12px; width: calc(40% - 16px)'],
    [BAR + '#zone-valider', 'right: 12px; width: calc(60% - 16px)'],
    [BAR + '#zone-enregistrer > button, ' + BAR + '#zone-valider > button', 'width: 100%; height: 50px; min-height: 50px; border-radius: 14px; font-size: 14.5px; line-height: 1.15; padding: 6px 8px']
  ];
  var css = regles.map(function (r) {
    return r[0].split(', ').map(function (x) { return 'body ' + x; }).join(', ') + ' { ' + r[1] + ' }';
  }).join('\n');
  // barre fixe : seulement en devoir (zone « Valider » visible)
  css += '\nbody:has(#zone-valider:not([hidden])) { padding-bottom: calc(92px + env(safe-area-inset-bottom, 0px)); }'
    + '\nbody:has(#zone-valider:not([hidden]))::after { content: ""; position: fixed; left: 0; right: 0; bottom: 0; z-index: 80;'
    + ' height: calc(72px + env(safe-area-inset-bottom, 0px)); background: #fff; border-top: 1px solid #e2e2e2; box-shadow: 0 -4px 14px rgba(26,26,26,0.07); }';
  var s = document.createElement('style');
  s.id = 'haut-page-telephone';
  s.textContent = '@media (max-width: 560px) and (orientation: portrait) {\n' + css + '\n}';
  (document.head || document.documentElement).appendChild(s);

  // Fiches de calcul : le bandeau « Devoir ... tentative n / N, a rendre le ... » (#devoir-info) est en bas de page ;
  // sur telephone il passe juste au-dessus du titre pour que l'eleve le voie des l'arrivee. Le noeud est deplace,
  // pas copie : la fiche continue de le remplir par son identifiant.
  function remonterBandeauDevoir() {
    if (!window.matchMedia('(max-width: 560px) and (orientation: portrait)').matches) return;
    var info = document.getElementById('devoir-info');
    var entete = document.querySelector('.entete');
    if (info && entete && entete.parentNode) entete.parentNode.insertBefore(info, entete);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', remonterBandeauDevoir);
  else remonterBandeauDevoir();
})();
