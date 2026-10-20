// Détails de correction des fiches de calcul (16/10/2026) : le bouton « Détails » de « Voir la correction des erreurs » déplie
// les étapes du calcul. Partagé par toutes les fiches qui portent des détails ; règles d'écriture : REGLES-FICHES.md § 8.
//
// Chaque exercice concerné porte `detail: { lignes: [LaTeX…], final: LaTeX }` : les étapes, écrites avec les valeurs du tirage ;
// `final` est la réponse telle qu'elle est écrite à la dernière ligne (outils/details-correction/controle.js la compare à `reponse`).
// La fiche appelle Detail.preparer(ex) en fin de genererExercices() et Detail.html(ex, idx) dans verifierTout().
// Nécessite math.js (fractions) ; MathJax compose les étapes.
const Detail = (() => {
  const pgcdD = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; };

  const dP = v => (v < 0 ? `(${v})` : String(v));                         // entier entre parenthèses s'il est négatif
  const dPlus = v => (v < 0 ? `- ${-v}` : `+ ${v}`);                      // « + 5 » ou « - 5 »

  // fraction irréductible n/d en LaTeX, signe devant (jamais « \dfrac{-3}{4} »), entier si d = 1
  const fracTexte = (n, d) => {
    if (d < 0) { n = -n; d = -d; }
    const g = pgcdD(n, d);
    n /= g; d /= g;
    if (d === 1) return String(n);
    return n < 0 ? `-\\dfrac{${-n}}{${d}}` : `\\dfrac{${n}}{${d}}`;
  };
  const fracD = f => { f = math.fraction(f); return fracTexte(f.s * f.n, f.d); };         // fraction math.js -> LaTeX, signe devant
  const fracDP = f => { const t = fracD(f); return t.startsWith('-') ? `(${t})` : t; };    // idem, entre parenthèses si négative

  // somme de termes [coefficient entier, expression LaTeX ou ''] écrite avec les signes : « 12 - 18 + 8 », termes nuls omis
  const sommeTermes = liste => {
    let s = '';
    liste.forEach(([k, e]) => {
      if (k === 0) return;
      // coefficient d'une lettre : « 3n » ; d'un autre facteur (puissance, parenthèse, nombre) : « 3\times 2^2 »
      const m = e ? (Math.abs(k) === 1 ? e : `${Math.abs(k)}${/^[A-Za-z]/.test(e) ? '' : '\\times '}${e}`) : String(Math.abs(k));
      s += (s ? (k < 0 ? ' - ' : ' + ') : (k < 0 ? '-' : '')) + m;
    });
    return s || '0';
  };

  // fraction non simplifiée, signe devant ; « coefficient × a » sur un dénominateur numérique, signe devant aussi
  const fracBrute = (n, d) => (d === 1 ? String(n) : `${n < 0 ? '-' : ''}\\dfrac{${Math.abs(n)}}{${d}}`);
  const coefAbs = n => (Math.abs(n) === 1 ? '' : String(Math.abs(n)));
  const ajouterFrac = t => (t.startsWith('-') ? `- ${t.slice(1)}` : `+ ${t}`);       // « + \dfrac{1}{3} » ou « - \dfrac{1}{3} »
  // terme « coefficient × n » : jamais « 1 n » ni « -1 n » ; avec signe (« + 2\,n », « - n ») ou sans (« 2\,n », « -n »)
  const termeNsansSigne = t => (t === '1' ? 'n' : t === '-1' ? '-n' : `${t}\\,n`);
  const termeNavecSigne = t => (t === '1' ? '+ n' : t === '-1' ? '- n' : `${ajouterFrac(t)}\\,n`);

  // « num / d » écrit puis simplifié : fraction (signe devant) si le numérateur est entier, « x \div d » s'il est lui-même une
  // fraction ; la forme simplifiée n'est ajoutée que si elle diffère de ce qui vient d'être écrit
  const divisionD = (num, d) => {
    const f = math.fraction(num), q = math.divide(f, d);
    const ecrit = f.d === 1 ? `${f.s < 0 ? '-' : ''}\\dfrac{${f.n}}{${d}}` : `${fracDP(f)} \\div ${d}`;
    return ecrit === fracD(q) ? ecrit : `${ecrit} = ${fracD(q)}`;
  };

  // tableau de signes en LaTeX : racines = [{v: valeur numérique, tex: écriture LaTeX, interdit: true pour une double barre}],
  // g = fonction dont on lit le signe ; 0 sous chaque racine, double barre sous une valeur interdite
  const tableauSignes = (racines, g, etiquette) => {
    const bs = [...racines].sort((u, v) => u.v - v.v), n = bs.length;
    const signe = i => {
      const lo = i === 0 ? -Infinity : bs[i - 1].v, hi = i === n ? Infinity : bs[i].v;
      const t = !isFinite(lo) ? hi - 1 : !isFinite(hi) ? lo + 1 : (lo + hi) / 2;
      return g(t) > 0 ? '+' : '-';
    };
    const haut = ['x', '-\\infty'], bas = [`\\text{${etiquette || 'signe'}}`, ''];
    bs.forEach((r, i) => { haut.push('', r.tex); bas.push(signe(i), r.interdit ? '\\Vert' : '0'); });
    haut.push('', '+\\infty');
    bas.push(signe(n), '');
    return `${n >= 3 ? '\\scriptsize' : '\\small'}\\begin{array}{c|${'c'.repeat(2 * n + 3)}} ${haut.join(' & ')} \\\\ \\hline ${bas.join(' & ')} \\end{array}`;
  };

  // tableau de signes COMPLET d'un produit ou d'un quotient : une ligne par facteur, puis la ligne du produit (ou du quotient)
  // (David, 20/10/2026 : « un tableau complet avec toutes les lignes »). facteurs = [{label: LaTeX du facteur, v: sa racine (nombre),
  // tex: la racine en LaTeX, sgn: signe du facteur à droite de sa racine (+1 si a > 0, -1 si a < 0), denom: facteur du dénominateur
  // (double barre sur la ligne finale), carre: facteur élevé au carré (toujours positif)}] ; 0 sous la racine de chaque facteur,
  // 0 ou double barre sous cette racine sur la ligne finale.
  const tableauSignesFacteurs = (facteurs, etiquetteFinale) => {
    const colonnes = [];
    facteurs.forEach(f => { if (!colonnes.some(c => Math.abs(c.v - f.v) < 1e-9)) colonnes.push({ v: f.v, tex: f.tex }); });
    colonnes.sort((p, q) => p.v - q.v);
    const k = colonnes.length;
    const rang = f => colonnes.findIndex(c => Math.abs(c.v - f.v) < 1e-9);
    const signeSur = (f, i) => (f.carre ? 1 : (i > rang(f) ? f.sgn : -f.sgn));      // signe du facteur sur l'intervalle i (0 à k)
    const sym = s => (s > 0 ? '+' : '-');
    const ligne = (etiquette, signeIntervalle, marque) => {
      const c = [etiquette, ''];
      for (let i = 0; i < k; i++) c.push(signeIntervalle(i), marque(i));
      c.push(signeIntervalle(k), '');
      return c.join(' & ');
    };
    const lignes = facteurs.map(f => ligne(f.label, i => sym(signeSur(f, i)), i => (i === rang(f) ? '0' : '')));
    lignes.push(ligne(`\\text{${etiquetteFinale || 'signe'}}`, i => sym(facteurs.reduce((p, f) => p * signeSur(f, i), 1)), i => {
      const ici = facteurs.filter(f => rang(f) === i);
      return ici.some(f => f.denom) ? '\\Vert' : (ici.length ? '0' : '');
    }));
    const haut = ['x', '-\\infty'];
    colonnes.forEach(c => haut.push('', c.tex));
    haut.push('', '+\\infty');
    return `${k >= 3 ? '\\scriptsize' : '\\small'}\\begin{array}{c|${'c'.repeat(2 * k + 3)}} ${haut.join(' & ')} \\\\ \\hline ${lignes.join(' \\\\ \\hline ')} \\end{array}`;
  };

  const ppcm = (u, v) => u * v / pgcdD(u, v);
  // ---- sommes, produits et comparaisons de fractions écrits en ligne (consigne de David, 16/10/2026) ----
  // Écriture en ligne, comme au cahier (consigne de David, 16/10/2026) : 1/2 + 3/7 = 1x7/2x7 + 3x2/7x2 = 7/14 + 6/14 = 13/14
  // (aucune phrase : le dénominateur commun se lit dans la ligne)
  const signeFrac = (s, i, t) => (i === 0 ? t : `${s > 0 ? ' + ' : ' - '}${t}`);
  // somme de fractions [{s: +1|-1, n, d}] : une ligne (deux au-delà de deux fractions), résultat réduit { n, d }
  function lignesSomme(termes) {
    const den = termes.reduce((t, x) => ppcm(t, x.d), 1);
    const num = termes.reduce((t, x) => t + x.s * x.n * (den / x.d), 0);
    const brute = fracBrute(num, den), simple = fracTexte(num, den);
    const origine = termes.map((x, i) => signeFrac(x.s, i, fracBrute(x.n, x.d))).join('');
    const converti = termes.map((x, i) => { const m = den / x.d; return signeFrac(x.s, i, m === 1 ? fracBrute(x.n, x.d) : `\\dfrac{${x.n}\\times ${m}}{${x.d}\\times ${m}}`); }).join('');
    const meme = termes.map((x, i) => signeFrac(x.s, i, fracBrute(x.n * (den / x.d), den))).join('');
    const fin = den === 1 ? `${num}` : brute + (brute === simple ? '' : ` = ${simple}`);
    const g = pgcdD(num, den) || 1;
    const conversion = termes.some(x => x.d !== den);
    // jusqu'à deux fractions : tout sur une ligne ; au-delà, l'écriture convertie finit la première ligne et la somme occupe la seconde
    let lignes;
    if (termes.length <= 2 || !conversion) lignes = [`${origine} = ${conversion ? converti + ' = ' : ''}${meme} = ${fin}`];
    else lignes = [`${origine} = ${converti}`, `${meme} = ${fin}`];
    return { lignes, final: simple, n: num / g, d: den / g };
  }
  // produit (a/b) x (c/d) : une ligne, résultat réduit { n, d }
  function produitFrac(a, b, c, d) {
    const n = a * c, m = b * d, g = pgcdD(n, m) || 1;
    const brute = fracBrute(n, m), simple = fracTexte(n, m);
    return { n: n / g, d: m / g, final: simple, lignes: [
      `${a < 0 ? `\\left(${fracBrute(a, b)}\\right)` : fracBrute(a, b)}\\times ${fracBrute(c, d)} = \\dfrac{${a}\\times ${c}}{${b}\\times ${d}} = ${brute}` + (g > 1 ? ` = ${simple}` : '')] };
  }
  // comparaison de a/b et c/d : mise au même dénominateur (une ligne par fraction), numérateurs, conclusion
  function lignesComparaison(a, b, c, d) {
    const den = ppcm(b, d), x = a * den / b, y = c * den / d, op = x > y ? '>' : '<';
    const conv = (p, v) => (v === den ? [] : [`${fracBrute(p, v)} = \\dfrac{${p}\\times ${den / v}}{${v}\\times ${den / v}} = \\dfrac{${p * den / v}}{${den}}`]);
    return { lignes: [...conv(a, b), ...conv(c, d), `${x} ${op} ${y}`, `\\dfrac{${a}}{${b}} ${op} \\dfrac{${c}}{${d}}`], final: op };
  }

  // coupe les lignes d'égalités trop longues pour un téléphone : « A = B = C = D » devient « A = B = C » puis « = D » ; seuil en
  // nombre de signes visibles ; les lignes avec ⟺, texte, tableau ou \quad ne sont pas touchées (outil de contrôle : une ligne qui
  // commence par « = » reprend le dernier membre de la précédente)
  const longueurVisible = l => l.replace(/\\text\{([^{}]*)\}/g, '$1').replace(/\\(?:left|right|,|;|:|!|quad|qquad)/g, '').replace(/\\[a-zA-Z]+/g, 'x').replace(/[{}\s]/g, '').length;
  const segmentsEgal = l => {
    if (/\\iff|\\text|\\quad|\\begin/.test(l)) return null;
    const segs = []; let prof = 0, gauche = 0, debut = 0;
    for (let i = 0; i < l.length; i++) {
      if (l.startsWith('\\left', i)) { gauche++; i += 4; continue; }
      if (l.startsWith('\\right', i)) { gauche--; i += 5; continue; }
      const c = l[i];
      if (c === '{') prof++; else if (c === '}') prof--;
      else if (c === '=' && prof === 0 && gauche === 0 && l[i - 1] === ' ' && l[i + 1] === ' ') { segs.push(l.slice(debut, i).trim()); debut = i + 1; }
    }
    segs.push(l.slice(debut).trim());
    return segs;
  };
  const couperLigne = (l, seuil) => {
    const segs = segmentsEgal(l);
    if (!segs || segs.length < 2) return [l];
    const lignes = []; let courant = segs[0];
    for (let k = 1; k < segs.length; k++) {
      if (longueurVisible(courant + segs[k]) > seuil) { lignes.push(courant); courant = `= ${segs[k]}`; }
      else courant += ` = ${segs[k]}`;
    }
    lignes.push(courant);
    return lignes;
  };
  // deux lignes « A = B » puis « B = C » se rejoignent en « A = B = C » (le découpage recoupe ensuite sans répéter B)
  const fusionnerChaines = lignes => {
    const sortie = [];
    for (const l of lignes) {
      const prec = sortie.length ? sortie[sortie.length - 1] : null, sp = prec && segmentsEgal(prec), sl = segmentsEgal(l);
      if (sp && sl && sp.length >= 2 && sl.length >= 2 && sl[0] === sp[sp.length - 1]) sortie[sortie.length - 1] = `${prec} = ${sl.slice(1).join(' = ')}`;
      else sortie.push(l);
    }
    return sortie;
  };
  const couper = (ex, seuil = 34, filtre = () => true) => {
    ex.forEach(e => { if (e.detail && filtre(e)) e.detail.lignes = fusionnerChaines(e.detail.lignes).flatMap(l => couperLigne(l, seuil)); });
    return ex;
  };

  // « < » suivi d'une lettre serait lu comme une balise HTML : \lt dans les étapes
  const preparer = ex => {
    ex.forEach(e => { if (e.detail) e.detail.lignes = e.detail.lignes.map(l => l.replace(/</g, '\\lt ')); });
    return ex;
  };

  // bouton « Détails » et étapes repliées d'un exercice, à placer à la fin de sa ligne de correction ('' si l'exercice n'en a pas)
  const html = (ex, idx) => (ex.detail
    ? ` <button type="button" class="btn-details" aria-expanded="false" onclick="basculerDetails(${idx}, this)">Détails</button>`
      + `<div class="details" id="details-${idx}" hidden>${ex.detail.lignes.map(l => `<div>\\(${l}\\)</div>`).join('')}</div>`
    : '');

  // signe d'un facteur affine ax+b (a non nul, pas le facteur x seul) : c'est l'inéquation ax+b > 0 qui le justifie, et non la seule
  // équation ax+b = 0 (David, 19/10/2026) ; mêmes étapes et mêmes phrases que pour une inéquation du premier degré
  // (« On divise par … < 0 », « donc le sens de l'inégalité change » si a < 0)
  const coefXaffine = a => (a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`);
  const lignesSigneAffine = (a, b) => {
    const f = coefXaffine(a) + (b > 0 ? `+${b}` : b < 0 ? `${b}` : '');
    const lignes = [`${f} > 0`];
    if (a !== 1 && b !== 0) lignes.push(`\\iff ${coefXaffine(a)} > ${-b}`);
    if (a < 0) lignes.push(`\\text{On divise par } ${a} < 0`, `\\text{donc le sens de l'inégalité change}`);
    lignes.push(`\\iff x ${a < 0 ? '<' : '>'} ${fracTexte(-b, a)}`);
    return lignes;
  };

  // styles : bouton à droite de la réponse attendue, étapes dépliables dessous ; une ligne trop longue pour l'écran garde sa
  // taille et défile horizontalement (sinon MathJax la réduit à 50-60 %, illisible)
  const style = document.createElement('style');
  style.textContent = `
    .btn-details { margin-left: 8px; padding: 2px 10px; border: 1.3px solid var(--bleu-clair, #B5D4F4); border-radius: 12px;
      background: #fff; color: var(--bleu); font-size: 12.5px; font-weight: 600; cursor: pointer; }
    .btn-details:hover { background: var(--bleu); border-color: var(--bleu); color: #fff; }
    .correction-ligne .details { margin: 8px 0 2px 16px; padding: 8px 12px; background: #f5f8fc;
      border-left: 3px solid var(--bleu); border-radius: 4px; font-size: 14px; }
    .correction-ligne .details > div { padding: 4px 0; overflow-x: auto; overflow-y: hidden; }
    .correction-ligne .details svg { max-width: none; }
    .correction-ligne .details[hidden] { display: none; }`;
  document.head.appendChild(style);

  return { dP, dPlus, fracTexte, fracD, fracDP, sommeTermes, fracBrute, coefAbs, ajouterFrac, termeNsansSigne, termeNavecSigne, divisionD, tableauSignes, tableauSignesFacteurs, lignesSigneAffine, ppcm, lignesSomme, produitFrac, lignesComparaison, couper, preparer, html };
})();

function basculerDetails(idx, bouton) {
  const bloc = document.getElementById('details-' + idx);
  if (!bloc) return;
  const ouvrir = bloc.hidden;
  bloc.hidden = !ouvrir;
  bouton.textContent = ouvrir ? 'Masquer' : 'Détails';
  bouton.setAttribute('aria-expanded', String(ouvrir));
  if (ouvrir && window.MathJax) MathJax.typesetPromise([bloc]);
}
