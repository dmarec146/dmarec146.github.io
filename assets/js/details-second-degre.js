// Détails de correction : fonctions communes du second degré (22/10/2026), à charger après details-correction.js.
// Extraites de Première fiche 2 (discriminant, racines, ligne de racine double) pour servir aux fiches voisines ; la fiche 2 garde
// ses propres copies. Nécessite math.js et l'objet Detail.
//   const { dF2, dedup2, polyF2, lignesDelta2, phraseDelta2, lignesRacines2, lignesRacinesRat2, ligneRacineDouble2, ... } = DetailQ;
const DetailQ = (() => {
  const { dP, fracD, fracTexte, fracBrute } = Detail;
  const pgcdQ = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; };
  // fraction ou entier (math.js) écrit entre \left( \right) s'il est négatif
  const dF2 = (f) => { f = math.fraction(f); return f.s < 0 && f.n !== 0 ? `\\left(${fracD(f)}\\right)` : fracD(f); };
  // égalités successives « A = B = C » : deux écritures identiques consécutives n'en font qu'une
  const dedup2 = (...t) => t.filter((x, i) => i === 0 || x !== t[i - 1]).join(' = ');
  // polynôme en une lettre : termes [{ c (fraction ou nombre), v: 'x^{2}' | 'x' | '' }], coefficient 1 omis devant une lettre, termes nuls supprimés
  function polyF2(termes) {
    let s = '';
    for (const { c, v } of termes) {
      const f = math.fraction(c); if (f.n === 0) continue;
      const t = fracTexte(f.n, f.d), corps = (t === '1' && v) ? v : `${t}${v}`;
      s += (f.s < 0 ? '-' : (s ? '+' : '')) + corps;
    }
    return s || '0';
  }
  // somme de fractions (math.js) écrite avec les signes, termes nuls omis : « -3+9+4 »
  function sommeF2(liste) {
    let s = '';
    for (const t of liste) { const f = math.fraction(t); if (f.n === 0) continue; s += s ? (f.s < 0 ? '-' : '+') + fracTexte(f.n, f.d) : fracD(f); }
    return s || '0';
  }
  // signe devant un terme écrit après un autre : « +\dfrac{3}{2} », « -5 » ; rien si nul
  const sg2 = (f) => { f = math.fraction(f); return f.n === 0 ? '' : (f.s < 0 ? '-' : '+') + fracTexte(f.n, f.d); };
  // coefficient (valeur absolue d'une fraction math.js) devant une lettre : « a », « 3a », « \dfrac{2}{3}a »
  const coefLettre2 = (f, lettre) => { f = math.fraction(f); const t = fracTexte(f.n, f.d); return (t === '1' ? '' : t) + lettre; };
  // discriminant de A x^2 + B x + C (nombres ou fractions) : { lignes, D } (D fraction math.js)
  function lignesDelta2(A, B, C) {
    const a = math.fraction(A), b = math.fraction(B), c = math.fraction(C);
    const b2 = math.multiply(b, b), q = math.multiply(4, math.multiply(a, c)), D = math.subtract(b2, q);
    const facteurA = a.n === 1 && a.d === 1 && a.s > 0 ? '' : `${dF2(a)}\\times `;      // jamais « \times 1 \times »
    return { lignes: [`\\Delta = ${dedup2(`${dF2(b)}^{2}-4\\times ${facteurA}${dF2(c)}`, `${fracD(b2)}-${dF2(q)}`, fracD(D))}`], D };
  }
  // phrase annonçant le nombre de racines d'après le signe du discriminant D (fraction math.js)
  function phraseDelta2(D) {
    D = math.fraction(D);
    return D.n === 0 ? '0 \\text{ : une racine double}' : D.s > 0 ? `${fracD(D)} \\gt 0 \\text{ : deux racines distinctes}` : `${fracD(D)} \\lt 0 \\text{ : aucune racine réelle}`;
  }
  const ENTETE_RACINES2 = ['\\text{Discriminant : } b^{2}-4ac', '\\text{Racines : } \\dfrac{-b-\\sqrt{\\Delta}}{2a} \\text{ et } \\dfrac{-b+\\sqrt{\\Delta}}{2a}'];
  // racine (-B + signe sqrt(delta)) / (2A), A et B entiers, delta entier > 0, en LaTeX exact et réduit : sqrt(delta) = k sqrt(m), m sans facteur carré
  function texRacineQuadratique(A, B, delta, signe) {
    let k = 1, m = delta;
    for (let f = 2; f * f <= m; f++) while (m % (f * f) === 0) { m /= f * f; k *= f; }
    let p = -B, q = signe * k, d = 2 * A;
    if (m === 1) { const fr = math.fraction(p + q, d); return fracD(fr); }
    const g = pgcdQ(pgcdQ(p, q), d);
    p /= g; q /= g; d /= g;
    if (d < 0) { p = -p; q = -q; d = -d; }
    const racine = (Math.abs(q) === 1 ? '' : String(Math.abs(q))) + '\\sqrt{' + m + '}';
    const num = (p === 0 ? '' : String(p)) + (q < 0 ? '-' : (p === 0 ? '' : '+')) + racine;
    return d === 1 ? num : (p === 0 ? (q < 0 ? '-' : '') + '\\dfrac{' + racine + '}{' + d + '}' : '\\dfrac{' + num + '}{' + d + '}');
  }
  // racine (P + Q sqrt(rad)) / D écrite sous forme simplifiée (facteur commun retiré), en LaTeX ; rad sans facteur carré, D > 0
  function texRacineSimp2(P, Q, rad, D) {
    const g = pgcdQ(pgcdQ(P, Q), D); P /= g; Q /= g; D /= g;
    const partie = `${Math.abs(Q) === 1 ? '' : Math.abs(Q)}\\sqrt{${rad}}`;
    const num = P === 0 ? `${Q < 0 ? '-' : ''}${partie}` : `${P}${Q < 0 ? '-' : '+'}${partie}`;
    if (D === 1) return num;
    return P === 0 ? `${Q < 0 ? '-' : ''}\\dfrac{${partie}}{${D}}` : `\\dfrac{${num}}{${D}}`;
  }
  // racines de A x^2 + B x + C (A > 0 et B entiers) de discriminant D > 0 entier : { lignes, t1, t2, x1, x2 } (t = écritures simplifiées, x1 < x2)
  function lignesRacines2(A, B, D) {
    let K = 1, m = D; for (let f = 2; f * f <= m; f++) while (m % (f * f) === 0) { m /= f * f; K *= f; }
    const lignes = [], sq = m === 1 ? String(K) : K > 1 ? `${K}\\sqrt{${m}}` : `\\sqrt{${D}}`;
    if (m === 1) lignes.push(`\\sqrt{${D}} = ${K}`); else if (K > 1) lignes.push(`\\sqrt{${D}} = \\sqrt{${K}^{2}\\times ${m}} = ${sq}`);
    const num = (s) => B === 0 ? (s < 0 ? `-${sq}` : sq) : `-${dP(B)}${s < 0 ? '-' : '+'}${sq}`;
    const t1 = texRacineQuadratique(A, B, D, -1), t2 = texRacineQuadratique(A, B, D, 1);
    [[1, -1, t1], [2, 1, t2]].forEach(([i, s, t]) => {
      lignes.push(`x_${i} = ${dedup2(B === 0 ? `${s < 0 ? '-' : ''}\\dfrac{${sq}}{${2 * A}}` : `\\dfrac{${num(s)}}{${2 * A}}`, ...(m === 1 ? [fracBrute(-B + s * K, 2 * A)] : []), t)}`);
    });
    return { lignes, t1, t2, x1: (-B - Math.sqrt(D)) / (2 * A), x2: (-B + Math.sqrt(D)) / (2 * A) };
  }
  // racines de A x^2 + B x + C (fractions, A > 0) de discriminant D > 0 carré d'un rationnel : { lignes, x1, x2 } (fractions math.js, x1 < x2)
  function lignesRacinesRat2(A, B, D) {
    const a = math.fraction(A), b = math.fraction(B), d = math.fraction(D), s = math.fraction(Math.round(Math.sqrt(d.n)), Math.round(Math.sqrt(d.d)));
    const lignes = [`\\sqrt{${fracD(d)}} = ${fracD(s)}`], xs = [];
    [[1, -1], [2, 1]].forEach(([i, sg]) => {
      const num = math.add(math.unaryMinus(b), math.multiply(sg, s)), x = math.divide(num, math.multiply(2, a)); xs.push(x);
      lignes.push(`x_${i} = ${dedup2(`\\dfrac{-${dF2(b)}${sg < 0 ? '-' : '+'}${fracD(s)}}{2\\times ${dF2(a)}}`, num.d === 1 && math.multiply(2, a).d === 1 ? fracBrute(num.s * num.n, math.multiply(2, a).n) : `\\dfrac{${fracD(num)}}{${fracD(math.multiply(2, a))}}`, fracD(x))}`);
    });
    return { lignes, x1: xs[0], x2: xs[1] };
  }
  // racine double -B / (2A) (fractions math.js) : { ligne, x0 }
  function ligneRacineDouble2(A, B) {
    const a = math.fraction(A), b = math.fraction(B), x0 = math.divide(math.unaryMinus(b), math.multiply(2, a));
    const ecrit = b.n === 0 ? '0' : `${b.s > 0 ? '-' : ''}\\dfrac{${fracD(math.abs(b))}}{2\\times ${dF2(a)}}`;
    return { ligne: `x_0 = ${dedup2(ecrit, fracD(x0))}`, x0 };
  }
  // facteur « x - racine » pour une racine rationnelle (fraction math.js) : « x+3 », « x-\dfrac{1}{2} », « x »
  const facteurRacine2 = (r) => polyF2([{ c: 1, v: 'x' }, { c: math.unaryMinus(math.fraction(r)), v: '' }]);
  // facteur « x - (P + Q sqrt(rad)) / D » pour une racine irrationnelle, écrit sans parenthèse inutile
  function facteurRacineSurd2(P, Q, rad, D) {
    const g = pgcdQ(pgcdQ(P, Q), D); P /= g; Q /= g; D /= g;
    const partie = `${Math.abs(Q) === 1 ? '' : Math.abs(Q)}\\sqrt{${rad}}`;
    if (D === 1) return `x${P === 0 ? '' : (P > 0 ? '-' : '+') + Math.abs(P)}${Q > 0 ? '-' : '+'}${partie}`;
    const t = texRacineSimp2(P, Q, rad, D);
    return t.startsWith('-') ? `x+${t.slice(1)}` : `x-${t}`;
  }
  // tableau de signes d'un trinome (une ligne) : racines = [{ v: nombre, tex }], g(t) = valeur du trinome, etiquette = le trinome ecrit en LaTeX
  function tableauTrinome2(v, racines, g, etiquette) {
    const bs = [...racines].sort((p, q) => p.v - q.v), n = bs.length;
    const signe = (i) => { const lo = i === 0 ? -Infinity : bs[i - 1].v, hi = i === n ? Infinity : bs[i].v; const t = !isFinite(lo) ? hi - 1 : !isFinite(hi) ? lo + 1 : (lo + hi) / 2; return g(t) > 0 ? '+' : '-'; };
    const haut = [v, '-\\infty'], bas = [etiquette, ''];
    const long = n >= 3 || bs.reduce((s, r) => s + r.tex.length, etiquette.length) > 26;      // racines longues : taille reduite et fractions en ligne, pour tenir sur un telephone
    bs.forEach((r, i) => { haut.push('', long ? r.tex.replace(/\\dfrac/g, '\\frac') : r.tex); bas.push(signe(i), '0'); });
    haut.push('', '+\\infty'); bas.push(signe(n), '');
    return `${long ? '\\scriptsize' : '\\small'}\\begin{array}{c|${'c'.repeat(2 * n + 3)}} ${haut.join(' & ')} \\\\ \\hline ${bas.join(' & ')} \\end{array}`;
  }
  // inequation du second degre « A v^2 + B v + C op 0 » (A, B, C entiers ou fractions ; op '>', '>=', '<', '<=') : discriminant, racines, tableau de signes,
  // ensemble des solutions (spec = intervalleSpec de la reponse, fmt = formaterIntervalleSpec de la fiche). debut = lignes qui menent a cette forme
  // (la forme elle-meme y figure) ; sinon elle est ecrite ici.
  function detailInequation2(v, A, B, C, op, spec, debut, fmt) {
    let a = math.fraction(A), b = math.fraction(B), c = math.fraction(C);
    const sym = { '>': '\\gt', '>=': '\\geqslant', '<': '\\lt', '<=': '\\leqslant' }, inv = { '>': '<', '>=': '<=', '<': '>', '<=': '>=' };
    const poly = (a, b, c) => polyF2([{ c: a, v: `${v}^{2}` }, { c: b, v }, { c, v: '' }]);
    const lignes = debut && debut.length ? [...debut] : [`${poly(a, b, c)} ${sym[op]} 0`];
    if (a.s < 0) {      // coefficient dominant negatif : on divise par -1 pour le rendre positif
      lignes.push('\\text{On divise par } -1 \\lt 0', "\\text{donc le sens de l'inégalité change}");
      a = math.unaryMinus(a); b = math.unaryMinus(b); c = math.unaryMinus(c); op = inv[op];
      lignes.push(`\\iff ${poly(a, b, c)} ${sym[op]} 0`);
    }
    const d = lignesDelta2(a, b, c), D = d.D, etiquette = poly(a, b, c);
    lignes.push('\\text{Discriminant : } b^{2}-4ac', ...d.lignes, phraseDelta2(D));
    if (D.s < 0) lignes.push(`${fracD(a)} \\gt 0 \\text{ : trinôme strictement positif}`, `\\text{pour tout réel } ${v}`);
    else if (D.n === 0) {
      const r = ligneRacineDouble2(a, b); lignes.push(r.ligne);
      lignes.push(tableauTrinome2(v, [{ v: math.number(r.x0), tex: fracD(r.x0) }], (t) => math.number(a), etiquette));
    } else {
      let r, racines;
      if (a.d === 1 && b.d === 1 && D.d === 1) { r = lignesRacines2(a.n, b.s * b.n, D.n); racines = [{ v: r.x1, tex: r.t1 }, { v: r.x2, tex: r.t2 }]; }
      else { r = lignesRacinesRat2(a, b, D); racines = [{ v: math.number(r.x1), tex: fracD(r.x1) }, { v: math.number(r.x2), tex: fracD(r.x2) }]; }
      lignes.push(...r.lignes, tableauTrinome2(v, racines, (t) => math.number(a) * (t - racines[0].v) * (t - racines[1].v), etiquette));
    }
    const final = fmt(spec);
    lignes.push(`${final.length > 44 ? '\\scriptsize ' : final.length > 30 ? '\\small ' : ''}S = ${final}`);      // une reponse longue passe en plus petit pour tenir sur un telephone
    return { lignes, final };
  }
  return { dF2, dedup2, polyF2, sommeF2, sg2, coefLettre2, lignesDelta2, phraseDelta2, ENTETE_RACINES2, texRacineQuadratique, texRacineSimp2, lignesRacines2, lignesRacinesRat2, ligneRacineDouble2, facteurRacine2, facteurRacineSurd2, tableauTrinome2, detailInequation2 };
})();
