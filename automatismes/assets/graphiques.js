/* ============================================================
   Cahiers d'automatismes — figures SVG
   Repère quadrillé avec droites, courbes et points, au format des
   sujets (quadrillage fin, axes fléchés, graduations lisibles).

   Règle de lisibilité (voir le playbook du projet) : une droite ou une
   courbe doit passer par des nœuds du quadrillage, rester contenue dans
   la fenêtre, et garder une amplitude lisible. Les générateurs qui
   appellent ces fonctions doivent le vérifier, pas la fonction de dessin.
   ============================================================ */
(function () {
  'use strict';

  const GRIS_GRILLE = '#cfcfe4';
  const NOIR = '#1a1a1a';
  const ROUGE = '#E24B4A';

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  // Un <text> SVG n'est jamais typeset : le LaTeX y apparaîtrait littéralement.
  // Les étiquettes sont donc du texte brut, avec un indice éventuel noté « C_f ».
  function etiquette(t) {
    const i = String(t).indexOf('_');
    if (i === -1) return esc(t);
    return esc(String(t).slice(0, i)) + '<tspan font-size="0.75em" dy="2.5">' + esc(String(t).slice(i + 1)) + '</tspan>';
  }
  const n2 = v => (Math.round(v * 100) / 100);

  // segment visible de la droite y = ax + b dans la fenêtre
  function segmentDroite(a, b, xmin, xmax, ymin, ymax) {
    const pts = [];
    const eps = 1e-9;
    const ajouter = (x, y) => {
      if (x >= xmin - eps && x <= xmax + eps && y >= ymin - eps && y <= ymax + eps) {
        if (!pts.some(p => Math.abs(p[0] - x) < 1e-6 && Math.abs(p[1] - y) < 1e-6)) pts.push([x, y]);
      }
    };
    ajouter(xmin, a * xmin + b);
    ajouter(xmax, a * xmax + b);
    if (a !== 0) { ajouter((ymin - b) / a, ymin); ajouter((ymax - b) / a, ymax); }
    if (pts.length < 2) return null;
    pts.sort((p, q) => p[0] - q[0]);
    return [pts[0], pts[pts.length - 1]];
  }

  // nœuds du quadrillage traversés par la droite, dans la fenêtre
  function noeudsDroite(a, b, xmin, xmax, ymin, ymax) {
    const out = [];
    for (let x = Math.ceil(xmin); x <= xmax; x++) {
      const y = a * x + b;
      if (Math.abs(y - Math.round(y)) < 1e-9 && y >= ymin && y <= ymax) out.push([x, Math.round(y)]);
    }
    return out;
  }

  /* repere({ xmin, xmax, ymin, ymax, unite, droites, points, courbes, petit, oij }) */
  function repere(o) {
    o = o || {};
    const xmin = o.xmin === undefined ? -5 : o.xmin;
    const xmax = o.xmax === undefined ? 5 : o.xmax;
    const ymin = o.ymin === undefined ? -5 : o.ymin;
    const ymax = o.ymax === undefined ? 5 : o.ymax;
    const petit = !!o.petit;
    const u = o.unite || (petit ? 13 : 22);
    const marge = o.marge === undefined ? (petit ? 9 : 14) : o.marge;
    const W = n2((xmax - xmin) * u + 2 * marge);
    const H = n2((ymax - ymin) * u + 2 * marge);
    const X = x => n2(marge + (x - xmin) * u);
    const Y = y => n2(marge + (ymax - y) * u);
    const s = [];
    s.push(`<svg class="repere-svg${petit ? ' repere-petit' : ''}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`);

    // quadrillage
    let g = '';
    for (let x = Math.ceil(xmin); x <= xmax; x++) g += `<line x1="${X(x)}" y1="${Y(ymax)}" x2="${X(x)}" y2="${Y(ymin)}"/>`;
    for (let y = Math.ceil(ymin); y <= ymax; y++) g += `<line x1="${X(xmin)}" y1="${Y(y)}" x2="${X(xmax)}" y2="${Y(y)}"/>`;
    s.push(`<g stroke="${GRIS_GRILLE}" stroke-width="0.7" fill="none">${g}</g>`);

    // axes (avec pointes de flèche dessinées en polygone : pas de <marker>, dont l'id
    // entrerait en collision quand plusieurs figures coexistent sur la page)
    const fx = 5, fy = 5;
    s.push(`<g stroke="${NOIR}" stroke-width="1.2" fill="${NOIR}">`);
    if (ymin <= 0 && ymax >= 0) {
      s.push(`<line x1="${X(xmin)}" y1="${Y(0)}" x2="${X(xmax)}" y2="${Y(0)}"/>`);
      s.push(`<polygon points="${X(xmax)},${Y(0)} ${n2(X(xmax) - fx * 1.6)},${n2(Y(0) - fy * 0.7)} ${n2(X(xmax) - fx * 1.6)},${n2(Y(0) + fy * 0.7)}" stroke="none"/>`);
    }
    if (xmin <= 0 && xmax >= 0) {
      s.push(`<line x1="${X(0)}" y1="${Y(ymin)}" x2="${X(0)}" y2="${Y(ymax)}"/>`);
      s.push(`<polygon points="${X(0)},${Y(ymax)} ${n2(X(0) - fx * 0.7)},${n2(Y(ymax) + fy * 1.6)} ${n2(X(0) + fx * 0.7)},${n2(Y(ymax) + fy * 1.6)}" stroke="none"/>`);
    }
    s.push('</g>');

    // graduations chiffrées — supprimées quand le repère est nommé (O, I, J), sinon les
    // étiquettes I et J se superposeraient aux nombres 1, comme dans les sujets
    if (o.graduations !== false && !o.oij) {
      const pas = o.pasGrad || (petit ? 2 : 1);
      const fs = petit ? 7 : 9.5;
      const dt = petit ? 2 : 3;
      let t = '';
      for (let x = Math.ceil(xmin); x <= xmax; x++) {
        if (x === 0 || x % pas !== 0) continue;
        t += `<line x1="${X(x)}" y1="${n2(Y(0) - dt)}" x2="${X(x)}" y2="${n2(Y(0) + dt)}" stroke="${NOIR}" stroke-width="1"/>`;
        t += `<text x="${X(x)}" y="${n2(Y(0) + fs + 3)}" text-anchor="middle" font-size="${fs}" fill="${NOIR}" stroke="none">${x}</text>`;
      }
      for (let y = Math.ceil(ymin); y <= ymax; y++) {
        if (y === 0 || y % pas !== 0) continue;
        t += `<line x1="${n2(X(0) - dt)}" y1="${Y(y)}" x2="${n2(X(0) + dt)}" y2="${Y(y)}" stroke="${NOIR}" stroke-width="1"/>`;
        t += `<text x="${n2(X(0) - dt - 3)}" y="${n2(Y(y) + fs / 2.6)}" text-anchor="end" font-size="${fs}" fill="${NOIR}" stroke="none">${y}</text>`;
      }
      s.push(`<g font-family="Georgia, serif">${t}</g>`);
    }

    // repère (O, I, J) à la façon des sujets
    if (o.oij) {
      s.push(`<g font-family="Georgia, serif" font-size="11" fill="${NOIR}">`);
      s.push(`<text x="${n2(X(0) - 10)}" y="${n2(Y(0) + 13)}">O</text>`);
      s.push(`<circle cx="${X(1)}" cy="${Y(0)}" r="2"/><text x="${X(1)}" y="${n2(Y(0) + 14)}" text-anchor="middle">I</text>`);
      s.push(`<circle cx="${X(0)}" cy="${Y(1)}" r="2"/><text x="${n2(X(0) - 11)}" y="${n2(Y(1) + 4)}">J</text>`);
      s.push('</g>');
    }

    // droites
    (o.droites || []).forEach(d => {
      const seg = segmentDroite(d.a, d.b, xmin, xmax, ymin, ymax);
      if (!seg) return;
      const couleur = d.couleur || ROUGE;
      s.push(`<line x1="${X(seg[0][0])}" y1="${Y(seg[0][1])}" x2="${X(seg[1][0])}" y2="${Y(seg[1][1])}" stroke="${couleur}" stroke-width="1.9" stroke-linecap="round"/>`);
      if (d.label) {
        // étiquette près de l'extrémité la plus haute, décalée vers l'intérieur
        const haut = seg[0][1] > seg[1][1] ? seg[0] : seg[1];
        const versGauche = haut[0] > (xmin + xmax) / 2;
        s.push(`<text x="${n2(X(haut[0]) + (versGauche ? -8 : 8))}" y="${n2(Y(haut[1]) + 12)}" text-anchor="${versGauche ? 'end' : 'start'}" font-size="11.5" font-family="Georgia, serif" fill="${couleur}">${etiquette(d.label)}</text>`);
      }
    });

    // droite verticale x = k
    (o.verticales || []).forEach(v => {
      const couleur = v.couleur || ROUGE;
      s.push(`<line x1="${X(v.x)}" y1="${Y(ymin)}" x2="${X(v.x)}" y2="${Y(ymax)}" stroke="${couleur}" stroke-width="1.9"/>`);
    });

    // courbes : suite de points [[x,y], …] déjà échantillonnés. Les portions qui sortent
    // de la fenêtre sont coupées en tracés séparés, sinon un segment fantôme relierait
    // le point de sortie au point de rentrée.
    (o.courbes || []).forEach(c => {
      const dedans = p => p[1] >= ymin - 0.01 && p[1] <= ymax + 0.01;
      const morceaux = [];
      let courant = [];
      (c.points || []).forEach(p => {
        if (dedans(p)) courant.push(p);
        else { if (courant.length > 1) morceaux.push(courant); courant = []; }
      });
      if (courant.length > 1) morceaux.push(courant);
      morceaux.forEach(pts => {
        const d = pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]) + ' ' + Y(p[1])).join(' ');
        s.push(`<path d="${d}" fill="none" stroke="${c.couleur || ROUGE}" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/>`);
      });
      if (c.label && morceaux.length) {
        const p = morceaux[0][Math.floor(morceaux[0].length * (c.labelAuDebut ? 0.06 : 0.94))];
        s.push(`<text x="${n2(X(p[0]) + 8)}" y="${n2(Y(p[1]) - 4)}" font-size="11.5" font-family="Georgia, serif" fill="${c.couleur || ROUGE}">${etiquette(c.label)}</text>`);
      }
    });

    // points marqués
    (o.points || []).forEach(p => {
      s.push(`<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="2.8" fill="${p.couleur || NOIR}"/>`);
      if (p.label) s.push(`<text x="${n2(X(p.x) + 6)}" y="${n2(Y(p.y) - 5)}" font-size="11" font-family="Georgia, serif" fill="${p.couleur || NOIR}">${esc(p.label)}</text>`);
    });

    s.push('</svg>');
    return s.join('');
  }

  /* ------------------------------------------------------------------
     Tableau de signes, au tracé des manuels français.
     (TikZ / tkz-tab exigerait un moteur LaTeX, hors de portée d'une page web :
      on dessine donc en SVG, comme les repères.)

       o = { variable, racines: [textes], lignes: [{label, signes, zeros}], petit }
       - racines  : valeurs affichées, de gauche à droite
       - signes   : n+1 caractères '+' ou '-', un par intervalle
       - zeros    : n booléens, true si la ligne s'annule à cette racine
                    (une ligne sans zéro, comme un facteur constant, en met aucun)
     ------------------------------------------------------------------ */
  function tableauSignes(o) {
    const v = o.variable || 'x';
    const racines = o.racines || [];
    const lignes = o.lignes || [];
    const petit = !!o.petit;
    const n = racines.length;
    const hL = petit ? 23 : 28;                       // hauteur d'une ligne
    const wI = petit ? 50 : 66;                       // largeur d'un intervalle
    const fs = petit ? 11.5 : 13;
    const marge = 14;                                 // retrait des bornes infinies
    const etiquettes = [v].concat(lignes.map(l => l.label));
    const maxLen = Math.max.apply(null, etiquettes.map(t => t.length));
    const wL = Math.max(petit ? 38 : 46, maxLen * (petit ? 6.6 : 7.6) + 14);
    const W = wL + 2 * marge + (n + 1) * wI;
    const H = (lignes.length + 1) * hL;
    // abscisses : bornes infinies en retrait, racines réparties entre elles
    const x0 = wL + marge, x1 = W - marge;
    const px = i => n2(x0 + i * (x1 - x0) / (n + 1));  // i = 0 (−∞) … n+1 (+∞)
    const mid = i => n2((px(i) + px(i + 1)) / 2);      // milieu de l'intervalle i
    const yL = k => n2(k * hL);                        // haut de la ligne k
    const yT = k => n2(k * hL + hL / 2 + fs * 0.36);   // ligne de base du texte

    const s = [];
    s.push(`<svg class="tab-signes-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" font-family="Georgia, 'Times New Roman', serif">`);
    s.push(`<rect x="0.6" y="0.6" width="${n2(W - 1.2)}" height="${n2(H - 1.2)}" fill="white" stroke="${NOIR}" stroke-width="1.2"/>`);
    // séparateurs horizontaux entre les lignes
    for (let k = 1; k <= lignes.length; k++) {
      s.push(`<line x1="0" y1="${yL(k)}" x2="${W}" y2="${yL(k)}" stroke="${NOIR}" stroke-width="1.2"/>`);
    }
    // séparateur vertical après la colonne des étiquettes
    s.push(`<line x1="${wL}" y1="0" x2="${wL}" y2="${H}" stroke="${NOIR}" stroke-width="1.2"/>`);
    // pointillés verticaux aux racines, sur les lignes de signes
    for (let i = 1; i <= n; i++) {
      s.push(`<line x1="${px(i)}" y1="${yL(1)}" x2="${px(i)}" y2="${H}" stroke="${NOIR}" stroke-width="0.8" stroke-dasharray="3 3"/>`);
    }
    // en-tête : la variable, −∞, les racines, +∞
    s.push(`<text x="${n2(wL / 2)}" y="${yT(0)}" text-anchor="middle" font-size="${fs}" font-style="italic" fill="${NOIR}">${esc(v)}</text>`);
    // vrai signe moins (U+2212) partout, comme dans le reste du site
    const bornes = ['−∞'].concat(racines.map(r => String(r).replace(/-/g, '−')), ['+∞']);
    bornes.forEach((t, i) => {
      s.push(`<text x="${px(i)}" y="${yT(0)}" text-anchor="middle" font-size="${fs}" fill="${NOIR}">${esc(t)}</text>`);
    });
    // lignes de signes
    lignes.forEach((l, k) => {
      const y = yT(k + 1);
      s.push(`<text x="${n2(wL / 2)}" y="${y}" text-anchor="middle" font-size="${fs}" fill="${NOIR}">${esc(l.label)}</text>`);
      (l.signes || []).forEach((sg, i) => {
        const car = sg === '-' ? '−' : '+';
        s.push(`<text x="${mid(i)}" y="${y}" text-anchor="middle" font-size="${n2(fs + 1)}" fill="${NOIR}">${car}</text>`);
      });
      (l.zeros || []).forEach((z, i) => {
        if (!z) return;
        s.push(`<text x="${px(i + 1)}" y="${y}" text-anchor="middle" font-size="${fs}" fill="${NOIR}">0</text>`);
      });
    });
    s.push('</svg>');
    return s.join('');
  }

  // échantillonne une fonction sur [xmin, xmax] pour la passer à repere({courbes})
  function echantillonner(f, xmin, xmax, pas) {
    const p = pas || 0.04;
    const pts = [];
    for (let x = xmin; x <= xmax + 1e-9; x += p) {
      const y = f(x);
      if (isFinite(y)) pts.push([Math.min(x, xmax), y]);
    }
    return pts;
  }

  const G = { repere, segmentDroite, noeudsDroite, tableauSignes, echantillonner };
  window.AutomatismesGraphiques = G;
  if (window.Automatismes && window.Automatismes.outils) window.Automatismes.outils.graph = G;
})();
