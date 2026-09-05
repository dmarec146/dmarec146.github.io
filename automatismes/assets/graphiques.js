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


  /* ------------------------------------------------------------------
     Arbre pondéré
       o.noeuds : [{ nom, barre, p, enfants: [{ nom, barre, p }, …] }, …]
       - « p » est l'étiquette portée par la branche : texte brut (« 0,4 »,
         « ? », « »). Une étiquette vide laisse la branche nue.
       - « barre » note l'événement contraire : la barre est tracée, car un
         <text> SVG ne connaît ni \overline ni les diacritiques combinants.
       Règle du projet (voir la note sur la Q1 du sujet zéro) : les deux
       probabilités de chaque nœud sont toujours écrites.
     ------------------------------------------------------------------ */
  // texte éventuellement surligné d'une barre (événement contraire)
  function texteNoeud(x, y, t, barre, fs) {
    const s = `<text x="${n2(x)}" y="${n2(y)}" font-size="${fs}" font-style="italic" fill="${NOIR}">${esc(t)}</text>`;
    if (!barre) return s;
    const w = String(t).length * fs * 0.58;
    return s + `<line x1="${n2(x)}" y1="${n2(y - fs * 0.92)}" x2="${n2(x + w)}" y2="${n2(y - fs * 0.92)}" stroke="${NOIR}" stroke-width="1.1"/>`;
  }

  function arbrePondere(o) {
    const noeuds = o.noeuds || [];
    const petit = !!o.petit;
    const fs = petit ? 11 : 13;
    const hF = petit ? 26 : 32;                       // hauteur réservée à une feuille
    const xR = petit ? 8 : 10;                        // abscisse de la racine
    const x1 = petit ? 66 : 86;                       // nœuds du premier niveau
    const x2 = petit ? 150 : 192;                     // feuilles
    const dTexte = petit ? 5 : 6;                     // décalage du nom après le point
    const feuilles = noeuds.reduce((s, nd) => s + Math.max(1, (nd.enfants || []).length), 0);
    const H = n2(feuilles * hF);
    const W = n2(x2 + (petit ? 26 : 32));
    const yR = n2(H / 2);

    const s = [];
    s.push(`<svg class="arbre-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" font-family="Georgia, 'Times New Roman', serif">`);
    s.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="white"/>`);
    // Étiquette d'une branche : au milieu du segment, décalée perpendiculairement.
    // Un décalage purement vertical suffit pour une branche plate mais laisse le
    // texte toucher le trait dès que la pente est forte.
    const brancheEtiq = (xa, ya, xb, yb, t) => {
      if (t === undefined || t === null || t === '') return '';
      const mx = (xa + xb) / 2, my = (ya + yb) / 2;
      const dx = xb - xa, dy = yb - ya;
      const L = Math.hypot(dx, dy) || 1;
      // normale dirigée du côté opposé au centre de l'arbre (haut pour une
      // branche montante, bas pour une descendante), puis recentrage du texte
      const nx = (dy < 0 ? dy : -dy) / L, ny = (dy < 0 ? -dx : dx) / L;
      // Le cadre du texte reste horizontal : plus la branche est pentue, plus il
      // faut s'en écarter pour que le trait ne le traverse pas. On prend donc la
      // demi-largeur du cadre projetée sur la normale, plus une marge.
      const fsE = fs - 1;
      const demiL = String(t).length * fsE * 0.55 / 2, demiH = fsE * 0.35;
      const d = Math.abs(nx) * demiL + Math.abs(ny) * demiH + (petit ? 2.5 : 3.5);
      return `<text x="${n2(mx + nx * d)}" y="${n2(my + ny * d + fsE * 0.35)}" text-anchor="middle" font-size="${n2(fsE)}" fill="${ROUGE}">${esc(t)}</text>`;
    };

    let rang = 0;
    noeuds.forEach(nd => {
      const enfants = nd.enfants || [];
      const k = Math.max(1, enfants.length);
      const ys = [];
      for (let i = 0; i < k; i++) ys.push(n2((rang + i + 0.5) * hF));
      rang += k;
      const y1 = n2(ys.reduce((a, b) => a + b, 0) / ys.length);
      // branche racine → nœud du premier niveau
      s.push(`<line x1="${n2(xR + dTexte)}" y1="${yR}" x2="${n2(x1)}" y2="${y1}" stroke="${NOIR}" stroke-width="1.2"/>`);
      s.push(brancheEtiq(xR + dTexte, yR, x1, y1, nd.p));
      s.push(texteNoeud(x1 + dTexte, y1 + fs * 0.36, nd.nom, nd.barre, fs));
      const xd = x1 + dTexte + String(nd.nom).length * fs * 0.66;
      enfants.forEach((en, i) => {
        s.push(`<line x1="${n2(xd)}" y1="${y1}" x2="${n2(x2)}" y2="${ys[i]}" stroke="${NOIR}" stroke-width="1.2"/>`);
        s.push(brancheEtiq(xd, y1, x2, ys[i], en.p));
        s.push(texteNoeud(x2 + dTexte, ys[i] + fs * 0.36, en.nom, en.barre, fs));
      });
    });
    s.push('</svg>');
    return s.join('');
  }

  /* ------------------------------------------------------------------
     Tableau à double entrée
       o.coin     : contenu de la case en haut à gauche
       o.colonnes : en-têtes de colonnes (la dernière est le total si o.totaux)
       o.lignes   : [{ label, cases: [ … ] }, …] (la dernière ligne est le
                    total si o.totaux)
       Une case valant « ? » est mise en évidence : c'est celle à trouver.
     ------------------------------------------------------------------ */
  function tableauCroise(o) {
    const colonnes = o.colonnes || [];
    const lignes = o.lignes || [];
    const totaux = o.totaux !== false;
    const petit = !!o.petit;
    const fs = petit ? 10.5 : 12.5;
    const hL = petit ? 24 : 28;
    const coin = o.coin || '';
    // largeurs : la colonne des libellés s'adapte au plus long
    const libelles = [coin].concat(lignes.map(l => l.label));
    const wL = Math.max(petit ? 54 : 66, Math.max.apply(null, libelles.map(t => String(t).length)) * fs * 0.56 + 14);
    const wC = Math.max.apply(null, colonnes.map(t => String(t).length)) * fs * 0.56 + 16;
    const wCol = Math.max(petit ? 44 : 54, n2(wC));
    const W = n2(wL + colonnes.length * wCol);
    const H = n2((lignes.length + 1) * hL);
    const px = j => n2(wL + j * wCol);
    const py = k => n2(k * hL);
    const cx = j => n2(wL + (j + 0.5) * wCol);
    const cy = k => n2(k * hL + hL / 2 + fs * 0.36);

    const s = [];
    s.push(`<svg class="tab-croise-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" font-family="Georgia, 'Times New Roman', serif">`);
    // fonds d'en-tête, tracés avant les traits
    s.push(`<rect x="0" y="0" width="${W}" height="${hL}" fill="#f2f4f8"/>`);
    s.push(`<rect x="0" y="0" width="${n2(wL)}" height="${H}" fill="#f2f4f8"/>`);
    s.push(`<rect x="0.6" y="0.6" width="${n2(W - 1.2)}" height="${n2(H - 1.2)}" fill="none" stroke="${NOIR}" stroke-width="1.2"/>`);
    for (let k = 1; k <= lignes.length; k++) {
      const gras = totaux && k === lignes.length;
      s.push(`<line x1="0" y1="${py(k)}" x2="${W}" y2="${py(k)}" stroke="${NOIR}" stroke-width="${gras ? 1.6 : 0.9}"/>`);
    }
    for (let j = 0; j < colonnes.length; j++) {
      const gras = j === 0 || (totaux && j === colonnes.length - 1);
      s.push(`<line x1="${px(j)}" y1="0" x2="${px(j)}" y2="${H}" stroke="${NOIR}" stroke-width="${gras ? 1.6 : 0.9}"/>`);
    }
    s.push(`<text x="${n2(wL / 2)}" y="${cy(0)}" text-anchor="middle" font-size="${n2(fs - 0.5)}" fill="${NOIR}">${esc(coin)}</text>`);
    colonnes.forEach((t, j) => {
      // l'inconnue peut aussi se trouver en en-tête, quand ce sont les valeurs
      // de la série qui sont portées par les colonnes
      const inconnue = String(t) === '?' || String(t) === 'x';
      const style = String(t) === 'x' ? ' font-style="italic"' : '';
      s.push(`<text x="${cx(j)}" y="${cy(0)}" text-anchor="middle" font-size="${fs}" fill="${inconnue ? ROUGE : NOIR}"${inconnue ? ' font-weight="bold"' : ''}${style}>${esc(t)}</text>`);
    });
    lignes.forEach((l, k) => {
      s.push(`<text x="${n2(wL / 2)}" y="${cy(k + 1)}" text-anchor="middle" font-size="${fs}" fill="${NOIR}">${esc(l.label)}</text>`);
      // une case « ? » ou « x » est l'inconnue de la question : elle est mise en évidence
      (l.cases || []).forEach((c, j) => {
        const inconnue = String(c) === '?' || String(c) === 'x';
        const style = String(c) === 'x' ? ' font-style="italic"' : '';
        s.push(`<text x="${cx(j)}" y="${cy(k + 1)}" text-anchor="middle" font-size="${fs}" fill="${inconnue ? ROUGE : NOIR}"${inconnue ? ' font-weight="bold"' : ''}${style}>${esc(String(c).replace(/-/g, '−'))}</text>`);
      });
    });
    s.push('</svg>');
    return s.join('');
  }

  /* ------------------------------------------------------------------
     Diagramme en boîte
       o.min, o.q1, o.med, o.q3, o.max — les cinq valeurs, dans l'unité
       de l'axe ; o.xmin, o.xmax, o.pas — l'axe gradué.
     ------------------------------------------------------------------ */
  function diagrammeBoite(o) {
    const xmin = o.xmin, xmax = o.xmax;
    const pas = o.pas || 1;
    const petit = !!o.petit;
    const fs = petit ? 9 : 11;
    const u = o.unite || (petit ? 11 : 17);           // pixels par unité
    const margeG = petit ? 14 : 18, margeD = petit ? 14 : 18;
    const hBoite = petit ? 22 : 30;                   // hauteur de la boîte
    const yBoite = petit ? 10 : 14;                   // haut de la boîte
    const yAxe = yBoite + hBoite + (petit ? 16 : 22);
    const W = n2(margeG + (xmax - xmin) * u + margeD);
    const H = n2(yAxe + (petit ? 17 : 21));
    const X = x => n2(margeG + (x - xmin) * u);
    const yMil = n2(yBoite + hBoite / 2);

    const s = [];
    s.push(`<svg class="boite-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" font-family="Georgia, 'Times New Roman', serif">`);
    s.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="white"/>`);
    // moustaches
    s.push(`<line x1="${X(o.min)}" y1="${yMil}" x2="${X(o.q1)}" y2="${yMil}" stroke="${NOIR}" stroke-width="1.2"/>`);
    s.push(`<line x1="${X(o.q3)}" y1="${yMil}" x2="${X(o.max)}" y2="${yMil}" stroke="${NOIR}" stroke-width="1.2"/>`);
    [o.min, o.max].forEach(v => {
      s.push(`<line x1="${X(v)}" y1="${n2(yBoite + hBoite * 0.2)}" x2="${X(v)}" y2="${n2(yBoite + hBoite * 0.8)}" stroke="${NOIR}" stroke-width="1.2"/>`);
    });
    // boîte et médiane
    s.push(`<rect x="${X(o.q1)}" y="${yBoite}" width="${n2(X(o.q3) - X(o.q1))}" height="${hBoite}" fill="#eef3fb" stroke="${NOIR}" stroke-width="1.3"/>`);
    s.push(`<line x1="${X(o.med)}" y1="${yBoite}" x2="${X(o.med)}" y2="${n2(yBoite + hBoite)}" stroke="${ROUGE}" stroke-width="1.8"/>`);
    // axe gradué
    s.push(`<line x1="${n2(margeG - 8)}" y1="${yAxe}" x2="${n2(W - 4)}" y2="${yAxe}" stroke="${NOIR}" stroke-width="1.2"/>`);
    s.push(`<polygon points="${n2(W - 4)},${yAxe} ${n2(W - 11)},${n2(yAxe - 3.2)} ${n2(W - 11)},${n2(yAxe + 3.2)}" fill="${NOIR}"/>`);
    for (let i = 0; xmin + i * pas <= xmax + 1e-9; i++) {
      const x = n2(xmin + i * pas);
      s.push(`<line x1="${X(x)}" y1="${n2(yAxe - 3)}" x2="${X(x)}" y2="${n2(yAxe + 3)}" stroke="${NOIR}" stroke-width="1"/>`);
      s.push(`<text x="${X(x)}" y="${n2(yAxe + fs + 5)}" text-anchor="middle" font-size="${fs}" fill="${NOIR}">${esc(String(x).replace('.', ','))}</text>`);
    }
    s.push('</svg>');
    return s.join('');
  }
  const G = { repere, segmentDroite, noeudsDroite, tableauSignes, echantillonner, arbrePondere, tableauCroise, diagrammeBoite };
  window.AutomatismesGraphiques = G;
  if (window.Automatismes && window.Automatismes.outils) window.Automatismes.outils.graph = G;
})();
