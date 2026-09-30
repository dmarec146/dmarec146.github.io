// Clavier virtuel MathLive (bouton ⌨ des champs <math-field>) : ajoute les
// accolades, absentes des dispositions par defaut (30/09/2026, demande de
// David -- seuls ( ) et [ ] y figurent, genant pour ecrire l'ensemble des
// solutions d'une equation, ex. {-2;3}).
//
// Plutot que de redefinir toute la disposition "123" (fragile d'une version
// de MathLive a l'autre, le script est charge sans numero de version), on
// part des dispositions normalisees fournies par MathLive lui-meme et on
// remplace deux touches hors programme de lycee sur la couche "123" :
// l'integrale devient "{" (Maj : ∅) et "∀" devient "}" (Maj : ;). Si ces
// touches ne sont pas trouvees (MathLive modifie), rien n'est change.
//
// Charge apres https://unpkg.com/mathlive dans chaque fiche.

(function () {
  function toucheContient(touche, motif) {
    if (!touche || typeof touche !== 'object') return false;
    return [touche.latex, touche.insert, touche.label].some((v) => typeof v === 'string' && v.includes(motif));
  }

  function ajouterAccolades() {
    const clavier = window.mathVirtualKeyboard;
    if (!clavier || !Array.isArray(clavier.normalizedLayouts)) return;
    const dispositions = JSON.parse(JSON.stringify(clavier.normalizedLayouts));
    const numerique = dispositions[0];
    const lignes = numerique && numerique.layers && numerique.layers[0] && numerique.layers[0].rows;
    if (!Array.isArray(lignes)) return;

    let remplacees = 0;
    for (const ligne of lignes) {
      for (let i = 0; i < ligne.length; i++) {
        if (toucheContient(ligne[i], '\\int')) {
          ligne[i] = { label: '{', insert: '\\{', tooltip: 'Accolade ouvrante', shift: { label: '∅', insert: '\\emptyset' } };
          remplacees++;
        } else if (toucheContient(ligne[i], '\\forall')) {
          ligne[i] = { label: '}', insert: '\\}', tooltip: 'Accolade fermante', shift: { label: ';', insert: ';' } };
          remplacees++;
        }
      }
    }
    if (remplacees !== 2) return;
    clavier.layouts = dispositions;
  }

  if (window.customElements && customElements.whenDefined) {
    customElements.whenDefined('math-field').then(ajouterAccolades).catch(() => {});
  }
})();
