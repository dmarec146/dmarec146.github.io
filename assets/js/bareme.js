// Barème en points d'une fiche de calcul (05/10/2026, fiches pilotes : Première 2 et 9).
// Chaque question porte un nombre de points (de 0,5 à 2, par quart de point) ; l'élève ne
// voit que ce nombre sur chaque question et le total de la fiche en tête de page.
//
// Le barème ne concerne QUE LES DEVOIRS : la fiche l'affiche (afficher(true)) quand un devoir
// est actif pour l'élève connecté, et le retire en entraînement libre (visiteur anonyme, élève
// connecté hors devoir, devoir terminé). Hors devoir, la fiche se comporte comme avant.
//
// Les calculs avancés sont un BONUS : une bonne réponse s'ajoute au score ET au total
// (la note ne dépasse jamais 100 %) ; une mauvaise réponse ou une absence de réponse reste
// hors barème, sans pénalité. Voir calculer().
//
// Script classique, chargé après devoir-partiel.js ; la fiche déclare ensuite ses données :
//   Bareme.definir({ points: { "2.1 a)": 0.5, ... }, bonus: ["2.10 a)", ...] });
// puis appelle Bareme.afficher(!!etatDevoir) quand elle sait si un devoir est actif.
// Une fiche sans definir() n'est pas concernée (actif() vaut faux).
(function () {
  'use strict';

  let POINTS = null;
  let BONUS = new Set();
  let VISIBLE = false;
  let observateur = null;

  const arrondi = (n) => Math.round(n * 100) / 100;
  const format = (n) => arrondi(n).toLocaleString('fr-FR');
  const pluriel = (n) => (n > 1 ? 'points' : 'point');

  // Valeur saisie non vide, même imbriquée (même règle que la validation des fiches).
  const nonVide = (v) => (v !== null && typeof v === 'object')
    ? Object.values(v).some(nonVide)
    : (typeof v === 'string' ? v.trim() !== '' : v !== null && v !== undefined);

  const retenue = (ex) => !window.DevoirPartiel || window.DevoirPartiel.retenu(ex);

  // N'écrit que si le texte change : réécrire le même texte déclencherait l'observateur (boucle).
  const mettre = (el, texte) => { if (el.textContent !== texte) el.textContent = texte; };

  function calculer(exercices, saisies) {
    const parId = {};
    Object.values(saisies || {}).forEach((s) => { if (s && s.id) parId[s.id] = s; });
    let score = 0, total = 0, nbQuestions = 0;
    exercices.forEach((ex) => {
      if (!retenue(ex)) return;
      const p = POINTS[ex.id];
      if (typeof p !== 'number') return;
      const s = parId[ex.id];
      const juste = !!(s && s.correct);
      if (BONUS.has(ex.id)) {
        if (juste) { score += p; total += p; }
        if (s && nonVide(s.valeur)) nbQuestions++;   // traitée (juste ou non) : comptée comme répondue
      } else {
        total += p; nbQuestions++;
        if (juste) score += p;
      }
    });
    return { score: arrondi(score), total: arrondi(total), nbQuestions };
  }

  // Total de base (hors bonus) et points de calculs avancés possibles, calculs retenus seulement.
  function totaux(exercices) {
    let base = 0, bonus = 0;
    exercices.forEach((ex) => {
      if (!retenue(ex) || typeof POINTS[ex.id] !== 'number') return;
      if (BONUS.has(ex.id)) bonus += POINTS[ex.id]; else base += POINTS[ex.id];
    });
    return { base: arrondi(base), bonus: arrondi(bonus) };
  }

  function texteTotal(exercices) {
    const { base, bonus } = totaux(exercices);
    const avances = bonus > 0 ? '+ ' + format(bonus) + ' ' + pluriel(bonus) + ' de calculs avancés' : '';
    if (base === 0 && bonus > 0) return avances;
    return 'Total : ' + format(base) + ' ' + pluriel(base) + (avances ? ' (' + avances + ')' : '');
  }

  function style() {
    if (document.getElementById('bareme-style')) return;
    const s = document.createElement('style');
    s.id = 'bareme-style';
    s.textContent = `
      .bareme-pastille { position:absolute; top:6px; right:8px; z-index:2; background:#fff4d6; color:#7a5200; border:1.5px solid #e6b94d;
        border-radius:999px; padding:1px 9px; font:600 12px/1.5 system-ui,sans-serif; white-space:nowrap; }
      .question.bareme-rel { position:relative; padding-right:88px; }
      @media (max-width: 560px) {
        .bareme-pastille { position:static; margin-left:auto; flex:0 0 auto; }
        .question.bareme-rel { padding-right:10px; }
      }
      .bareme-bandeau { margin:14px 0 18px; padding:10px 16px; background:#fff4d6; color:#4a3500; border:1.5px solid #e6b94d;
        border-radius:10px; font:600 15px/1.5 system-ui,sans-serif; }
    `;
    document.head.appendChild(s);
  }

  function poser() {
    if (!POINTS || !VISIBLE || typeof exercices === 'undefined') return;
    style();
    suffixeScore(true);
    exercices.forEach((e, i) => {
      const p = POINTS[e.id];
      if (typeof p !== 'number') return;
      const q = document.getElementById('q-' + i);
      if (!q) return;
      q.classList.add('bareme-rel');
      let b = q.querySelector('.bareme-pastille');
      if (!b) { b = document.createElement('span'); b.className = 'bareme-pastille'; q.appendChild(b); }
      mettre(b, format(p) + ' ' + (p > 1 ? 'pts' : 'pt'));
    });
    let ban = document.getElementById('bareme-bandeau');
    // Avant le bloc des calculs (et non dedans) : un devoir partiel masque un bloc entier
    // quand tous ses calculs sont masqués, et l'encart disparaîtrait avec lui.
    const premier = document.querySelector('.bloc-general') || document.querySelector('.section-titre');
    if (!ban && premier) {
      ban = document.createElement('div'); ban.id = 'bareme-bandeau'; ban.className = 'bareme-bandeau';
      premier.parentNode.insertBefore(ban, premier);
    }
    if (ban) mettre(ban, texteTotal(exercices));
  }

  // Panneau de score : en devoir, la note est en points (« 9,25 / 24,5 ») et le mot « bonnes réponses »
  // n'a plus de sens ; hors devoir, il reste (la fiche l'écrit dans <span id="score-suffixe">).
  function suffixeScore(masquer) {
    const s = document.getElementById('score-suffixe');
    if (s) s.hidden = masquer;
  }

  function retirer() {
    suffixeScore(false);
    document.querySelectorAll('.bareme-pastille').forEach((e) => e.remove());
    document.querySelectorAll('.bareme-rel').forEach((e) => e.classList.remove('bareme-rel'));
    const ban = document.getElementById('bareme-bandeau');
    if (ban) ban.remove();
  }

  let minuterie = null;
  function planifier() {
    if (minuterie) return;
    minuterie = setTimeout(() => { minuterie = null; poser(); }, 60);
  }

  window.Bareme = {
    definir(donnees) {
      POINTS = donnees.points || {};
      BONUS = new Set(donnees.bonus || []);
    },
    actif() { return !!POINTS; },
    // Vrai quand le barème est affiché et compte (devoir actif).
    visible() { return !!POINTS && VISIBLE; },
    // true : pastilles + total, et reprise à chaque reconstruction des grilles ; false : tout retiré.
    afficher(oui) {
      VISIBLE = !!oui && !!POINTS;
      if (VISIBLE) {
        poser();
        // grilles reconstruites (nouvelle version, brouillon) et calculs masqués après coup par un devoir partiel
        if (!observateur && window.MutationObserver) {
          observateur = new MutationObserver(planifier);
          observateur.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        }
      } else {
        retirer();
      }
    },
    points(id) { return POINTS ? POINTS[id] : undefined; },
    calculer,
    format,
    // « x / y » prêt à afficher (panneau de score de la fiche)
    libelleScore(exercices, saisies) {
      const r = calculer(exercices, saisies);
      return format(r.score) + ' / ' + format(r.total);
    },
  };
})();
