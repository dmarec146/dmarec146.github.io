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
  const fracBrute = (n, d) => `${n < 0 ? '-' : ''}\\dfrac{${Math.abs(n)}}{${d}}`;
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
    return `\\small\\begin{array}{c|${'c'.repeat(2 * n + 3)}} ${haut.join(' & ')} \\\\ \\hline ${bas.join(' & ')} \\end{array}`;
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

  return { dP, dPlus, fracTexte, fracD, fracDP, sommeTermes, fracBrute, coefAbs, ajouterFrac, termeNsansSigne, termeNavecSigne, divisionD, tableauSignes, preparer, html };
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
