/* Banque 03 — Fonctions : exponentielle, logarithme, dérivation, primitives (Terminale spécialité)
   Questions à quatre choix inspirées des QCM de bac 2022 et 2023 (exercices « fonction exponentielle / logarithme »,
   « dérivation et convexité », « primitives », « limites ») : le type de question vient du sujet, les nombres sont
   tirés au hasard, les trois mauvaises réponses reprennent des erreurs classiques
   (voir outils/qcm-bac/types-de-questions-2022-2023.md).

   Niveau 1 — les bases : une règle de dérivation ou de primitivation, une équation simple, des valeurs simples.
   Niveau 2 — l'épreuve : les questions des sujets (produit, quotient, composée, équations en ln et en exp, limites par
              croissances comparées, tangente, convexité).
   Niveau 3 — plus difficile (pénalités) : composées imbriquées, primitives par intégration par parties, inéquations,
              conditions initiales, plusieurs étapes.

   Chaque question porte, dans l'objet brut renvoyé par le générateur (champ `meta`), l'expression de départ en LaTeX
   (`fTex`) : outils/qcm-bac/controle-banques.js la relit, l'évalue numériquement et recalcule la vérité de CHAQUE
   option à partir du LaTeX affiché, sans jamais se fier à la bonne réponse choisie par le générateur. */
(function () {
  'use strict';
  const O = Automatismes.outils;
  const { alea, aleaParmi, melanger, pgcd, m, qcm, famille, fracL, poly } = O;
  const T = String.raw;

  const opt = (aff, cle) => ({ affichage: aff, cle: cle });
  const texOpt = tex => opt(m(tex), tex);                  // option dont la clé est le LaTeX lui-même
  const sgn = n => (n < 0 ? '-' : '+') + Math.abs(n);
  const coef = c => (c === 1 ? '' : c === -1 ? '-' : String(c));
  const xp = k => (k === 0 ? '1' : k === 1 ? 'x' : `x^{${k}}`);
  const P = (...termes) => poly(termes).replace(/ ([+-]) /g, '$1');   // P([2,'x'],[-3,'']) -> 2x-3 (écriture compacte, comme dans les banques de suites)
  const J = (t1, t2) => (!t2 ? t1 : t2.charAt(0) === '-' ? t1 + t2 : t1 + '+' + t2);   // t1 + t2 sans « + - »
  const fr = (a, b) => T`\dfrac{${a}}{${b}}`;
  const E = arg => T`e^{${arg}}`;
  const ln = arg => T`\ln\left(${arg}\right)`;
  const rat = (n, d) => fracL(n, d);                         // fraction réduite en LaTeX (entier si d | n)
  const coefFr = (n, d) => { const t = rat(n, d); return t === '1' ? '' : t === '-1' ? '-' : t; };   // coefficient rationnel devant un facteur
  // e^{1} s'écrit e ; appliqué à toutes les chaînes d'une question (énoncé, options, explication, meta)
  const epure = q => {
    if (!q) return q;
    const r = t => (typeof t === 'string' ? t.replace(/e\^\{1\}/g, 'e') : t);
    q.enonce = r(q.enonce); q.explication = r(q.explication);
    q.options.forEach(o => { o.affichage = r(o.affichage); o.cle = r(o.cle); });
    if (q.meta) for (const k of Object.keys(q.meta)) q.meta[k] = r(q.meta[k]);
    return q;
  };
  // quelques tirages peuvent échouer (distracteurs insuffisants, cas dégénéré) : on retente
  const retente = gen => niveau => { for (let i = 0; i < 12; i++) { const q = gen(niveau); if (q) return q; } return null; };
  const IR = T`\mathbb{R}`, IPOS = T`\left]0\,;+\infty\right[`;
  const bornes = (lo, hi) => T`\left]${lo}\,;${hi}\right[`;

  // ==========================================================================
  // 1. Dérivées
  // ==========================================================================
  // un modèle renvoie { f, d, faux: [...], dom: [lo, hi] (pour le contrôle), domTex, expl }
  // tirage d'un modèle : le niveau 3 reprend parfois des modèles du niveau 2 (35 %), le niveau 2 des modèles du niveau 1 (25 %)
  const tirerModele = (M, niveau) => aleaParmi(niveau === 3 && M[2] && Math.random() < 0.35 ? M[2] : niveau === 2 && M[1] && Math.random() < 0.25 ? M[1] : M[niveau]);
  const MODELES_DERIVEE = {
    1: [
      () => {                                   // a e^{kx}
        const a = aleaParmi([2, 3, 4, 5, -2, -3]), k = aleaParmi([2, 3, 4, -1, -2, -3]);
        const kx = P([k, 'x']), u = E(kx);
        return { f: `${coef(a)}${u}`, d: `${coef(a * k)}${u}`, domTex: IR, dom: [-2, 2],
          faux: [`${coef(a)}${u}`, `${coef(k)}${u}`, `${coefFr(a, k)}${u}`, `${a * k === 1 ? '' : coef(a * k)}x${E(P([k, 'x'], [-1, '']))}`],
          expl: `La dérivée de ${m(E(kx))} est ${m(`${coef(k)}${u}`)} (formule ${m(T`(e^{u})'=u'e^{u}`)}) : on multiplie par la dérivée ${m(String(k))} de l'exposant.` };
      },
      () => {                                   // ln(ax+b)
        const a = aleaParmi([2, 3, 4, 5]), b = aleaParmi([1, 2, 3, 4, -1, -2]);
        const u = P([a, 'x'], [b, '']), x0 = -b / a;
        return { f: ln(u), d: fr(String(a), u), domTex: bornes(rat(-b, a), T`+\infty`), dom: [x0 + 0.15, x0 + 4],
          faux: [fr('1', u), fr(String(a), T`\left(${u}\right)^2`), fr(u, String(a)), `${a}${ln(u)}`],
          expl: `Pour ${m(T`\ln(u)`)}, la dérivée est ${m(T`\dfrac{u'}{u}`)} avec ${m(`u=${u}`)} et ${m(`u'=${a}`)}.` };
      },
      () => {                                   // (ax+b) e^x
        const a = aleaParmi([1, 2, 3, 4, -1, -2]), b = aleaParmi([1, 2, 3, 4, -1, -2, -3]);
        return { f: `(${P([a, 'x'], [b, ''])})e^x`, d: `(${P([a, 'x'], [a + b, ''])})e^x`, domTex: IR, dom: [-2, 2],
          faux: [`${coef(a)}e^x`, `(${P([a, 'x'], [b, ''])})e^x`, `(${P([a, 'x'], [b - a, ''])})e^x`, `${coef(a)}(${P([a, 'x'], [b, ''])})e^x`],
          expl: `Produit ${m('uv')} avec ${m(`u=${P([a, 'x'], [b, ''])}`)} et ${m('v=e^x')} : ${m(T`(uv)'=u'v+uv'=${coef(a)}e^x+(${P([a, 'x'], [b, ''])})e^x=(${P([a, 'x'], [a + b, ''])})e^x`)}.` };
      },
      () => {                                   // a x^2 + b e^x
        const a = aleaParmi([1, 2, 3, 4, -1, -2]), b = aleaParmi([2, 3, 5, -1, -2, -3]);
        const be = `${b < 0 ? '-' : '+'}${Math.abs(b) === 1 ? '' : Math.abs(b)}e^x`;
        return { f: `${coef(a)}x^2${be}`, d: `${coef(2 * a)}x${be}`, domTex: IR, dom: [-2, 2],
          faux: [`${coef(a)}x${be}`, `${coef(2 * a)}x${be.slice(0, -3)}xe^{x-1}`, `${coef(2 * a)}x`, `${coef(a)}x^2${be}`],
          expl: `La dérivée de ${m(`${coef(a)}x^2`)} est ${m(`${coef(2 * a)}x`)} et celle de ${m(be.slice(1))} est ${m(be.slice(1))} : la dérivée de ${m('e^x')} est ${m('e^x')}.` };
      }
    ],
    2: [
      () => {                                   // x^n ln x
        const n = aleaParmi([2, 3, 4]);
        const t1 = `${n}${xp(n - 1)}\\ln x`;
        return { f: `${xp(n)}\\ln x`, d: `${t1}+${xp(n - 1)}`, domTex: IPOS, dom: [0.3, 4],
          faux: [t1, `${n}${xp(n - 2)}`, `${t1}+${xp(n)}`, fr(`${n}${xp(n - 1)}`, 'x')],
          expl: `Produit ${m('uv')} avec ${m(`u=${xp(n)}`)} et ${m(T`v=\ln x`)} : ${m(T`(uv)'=${n}${xp(n - 1)}\ln x+${xp(n)}\times\dfrac{1}{x}=${t1}+${xp(n - 1)}`)}.` };
      },
      () => {                                   // (ax+b)/e^x
        const a = aleaParmi([1, 2, 3]), b = aleaParmi([1, 2, 3, 4]);
        return { f: fr(P([a, 'x'], [b, '']), 'e^x'), d: fr(P([-a, 'x'], [a - b, '']), 'e^x'), domTex: IR, dom: [-2, 2],
          faux: [fr(String(a), 'e^x'), fr(P([a, 'x'], [a + b, '']), 'e^x'), fr(P([a, 'x'], [a - b, '']), 'e^x'), fr(P([-a, 'x'], [a + b, '']), 'e^x')],
          expl: `Quotient ${m(T`\dfrac{u}{v}`)} avec ${m(`u=${P([a, 'x'], [b, ''])}`)} et ${m('v=e^x')} : ${m(T`\dfrac{u'v-uv'}{v^2}=\dfrac{${a}e^x-(${P([a, 'x'], [b, ''])})e^x}{(e^x)^2}=${fr(P([-a, 'x'], [a - b, '']), 'e^x')}`)}.` };
      },
      () => {                                   // x e^{±x²-c}
        const s = aleaParmi([1, -1]), c = alea(1, 4), ex = P([s, 'x^2'], [-c, '']), u = E(ex);
        return { f: `x${u}`, d: `(${P([2 * s, 'x^2'], [1, ''])})${u}`, domTex: IR, dom: [-1.8, 1.8],
          faux: [`2x${u}`, `(${P([2 * s, 'x'], [1, ''])})${u}`, `(${P([s, 'x^2'], [1, ''])})${u}`, `(${P([-2 * s, 'x^2'], [1, ''])})${u}`],
          expl: `Produit ${m('uv')} avec ${m('u=x')} et ${m(`v=${u}`)}, où ${m(T`v'=${coef(2 * s)}x${u}`)} : ${m(T`(uv)'=${u}+x\times ${coef(2 * s)}x${u}=(${P([2 * s, 'x^2'], [1, ''])})${u}`)}.` };
      },
      () => {                                   // ln(x^2+bx+c), discriminant < 0
        const b = aleaParmi([1, 2, 3, -1, -2, -3]), c = Math.ceil(b * b / 4) + 1 + alea(0, 2), g = P([1, 'x^2'], [b, 'x'], [c, '']);
        return { f: ln(g), d: fr(P([2, 'x'], [b, '']), g), domTex: IR, dom: [-2.5, 2.5],
          faux: [fr('1', g), fr(g, P([2, 'x'], [b, ''])), `(${P([2, 'x'], [b, ''])})${ln(g)}`, P([2, 'x'], [b, ''])],
          expl: `Pour ${m(T`\ln(u)`)}, la dérivée est ${m(T`\dfrac{u'}{u}`)} avec ${m(`u=${g}`)} et ${m(`u'=${P([2, 'x'], [b, ''])}`)}. Le trinôme ${m(g)} est strictement positif pour tout réel ${m('x')} (discriminant négatif).` };
      },
      () => {                                   // e^x / (x + c)
        const c = alea(1, 4), q = P([1, 'x'], [c, '']);
        return { f: fr('e^x', q), d: fr(`e^x(${P([1, 'x'], [c - 1, ''])})`, `\\left(${q}\\right)^2`), domTex: IPOS, dom: [0.2, 4],
          faux: [fr('e^x', `\\left(${q}\\right)^2`), fr(`e^x(${P([1, 'x'], [c + 1, ''])})`, `\\left(${q}\\right)^2`), fr('e^x', '1'), fr(`e^x(${q})-e^x`, q)],
          expl: `Quotient ${m(T`\dfrac{u}{v}`)} : ${m(T`\dfrac{u'v-uv'}{v^2}=\dfrac{e^x(${q})-e^x}{\left(${q}\right)^2}=\dfrac{e^x(${P([1, 'x'], [c - 1, ''])})}{\left(${q}\right)^2}`)}.` };
      },
      () => {                                   // a e^{-x^2} + b  (« 3e^{-x²}+2 » du bac)
        const a = aleaParmi([2, 3, 4, 5, -2, -3]), b = aleaParmi([1, 2, 3, -1, -2]);
        return { f: `${coef(a)}e^{-x^2}${sgn(b)}`, d: `${coef(-2 * a)}xe^{-x^2}`, domTex: IR, dom: [-2, 2],
          faux: [`${coef(-a)}e^{-x^2}`, `${coef(-2 * a)}e^{-x^2}`, `${coef(a)}xe^{-x^2}`, `${coef(-2 * a)}xe^{-x^2}${sgn(b)}`],
          expl: `Avec ${m(T`u(x)=-x^2`)}, ${m(T`u'(x)=-2x`)} et ${m(T`(e^{u})'=u'e^{u}`)} : la dérivée de ${m(`${coef(a)}e^{-x^2}`)} est ${m(`${coef(-2 * a)}xe^{-x^2}`)} ; la constante ${m(String(b))} disparaît.` };
      }
    ],
    3: [
      () => {                                   // ln(e^x + c)
        const c = alea(1, 4), g = `e^x+${c}`;
        return { f: ln(g), d: fr('e^x', g), domTex: IR, dom: [-2, 2],
          faux: [fr('1', g), fr('e^x', `\\left(${g}\\right)^2`), fr(g, 'e^x'), `e^x${ln(g)}`],
          expl: `${m(T`(\ln u)'=\dfrac{u'}{u}`)} avec ${m(`u=${g}`)} et ${m(`u'=e^x`)}.` };
      },
      () => {                                   // e^x/(e^x+c), c >= 2
        const c = alea(2, 5), g = `e^x+${c}`;
        return { f: fr('e^x', g), d: fr(`${c}e^x`, `\\left(${g}\\right)^2`), domTex: IR, dom: [-2, 2],
          faux: [fr('e^x', `\\left(${g}\\right)^2`), fr('e^x', g), fr(`${c}e^x`, g), fr(`e^x(e^x+${c})+e^{2x}`, `\\left(${g}\\right)^2`)],
          expl: `${m(T`\dfrac{u'v-uv'}{v^2}=\dfrac{e^x(${g})-e^x\times e^x}{\left(${g}\right)^2}=\dfrac{${c}e^x}{\left(${g}\right)^2}`)}.` };
      },
      () => {                                   // (x^2 + ax + b) e^{-x}
        const a = aleaParmi([1, 2, 3, 4, -1, -2, -3]), b = aleaParmi([1, 2, 3, 4, -1, -2]);
        const g = P([1, 'x^2'], [a, 'x'], [b, '']);
        return { f: `(${g})e^{-x}`, d: `(${P([-1, 'x^2'], [2 - a, 'x'], [a - b, ''])})e^{-x}`, domTex: IR, dom: [-2, 2],
          faux: [`(${P([2, 'x'], [a, ''])})e^{-x}`, `(${g})e^{-x}`, `(${P([-1, 'x^2'], [a + 2, 'x'], [a + b, ''])})e^{-x}`, `(${P([-1, 'x^2'], [2 - a, 'x'], [a + b, ''])})e^{-x}`],
          expl: `Produit ${m('uv')} avec ${m(`u=${g}`)}, ${m(`u'=${P([2, 'x'], [a, ''])}`)}, ${m('v=e^{-x}')}, ${m(T`v'=-e^{-x}`)} : ${m(T`(uv)'=(u'-u)e^{-x}=(${P([-1, 'x^2'], [2 - a, 'x'], [a - b, ''])})e^{-x}`)}.` };
      },
      () => {                                   // ln x / x^n
        const n = aleaParmi([2, 3]);
        return { f: fr('\\ln x', xp(n)), d: fr(`1-${n}\\ln x`, xp(n + 1)), domTex: IPOS, dom: [0.3, 4],
          faux: [fr('1-\\ln x', xp(n + 1)), fr('1', xp(n + 1)), fr(`1-${n}\\ln x`, xp(n)), fr(`${n}\\ln x-1`, xp(n + 1))],
          expl: `Quotient ${m(T`\dfrac{u}{v}`)} avec ${m(T`u=\ln x`)} et ${m(`v=${xp(n)}`)} : ${m(T`\dfrac{\frac{1}{x}\times ${xp(n)}-\ln x\times ${n}${xp(n - 1)}}{${xp(2 * n)}}=\dfrac{1-${n}\ln x}{${xp(n + 1)}}`)}.` };
      },
      () => {                                   // ln(1 + e^{-x})
        return { f: ln('1+e^{-x}'), d: fr('-e^{-x}', '1+e^{-x}'), domTex: IR, dom: [-2, 2],
          faux: [fr('e^{-x}', '1+e^{-x}'), fr('1', '1+e^{-x}'), fr('-1', '1+e^{-x}'), fr('-1', 'e^{-x}')],
          expl: `${m(T`(\ln u)'=\dfrac{u'}{u}`)} avec ${m('u=1+e^{-x}')} et ${m(T`u'=-e^{-x}`)}.` };
      },
      () => {                                   // sqrt(e^x + c)
        const c = alea(1, 5), g = `e^x+${c}`;
        return { f: `\\sqrt{${g}}`, d: fr('e^x', `2\\sqrt{${g}}`), domTex: IR, dom: [-2, 2],
          faux: [fr('1', `2\\sqrt{${g}}`), fr('e^x', `\\sqrt{${g}}`), fr('e^x', `2(${g})`), fr('e^x+1', `2\\sqrt{${g}}`)],
          expl: `${m(T`(\sqrt{u})'=\dfrac{u'}{2\sqrt{u}}`)} avec ${m(`u=${g}`)} et ${m('u\'=e^x')}.` };
      },
      () => {                                   // (ln x)^2
        const a = aleaParmi([1, 2, 3]);
        return { f: `${coef(a)}\\left(\\ln x\\right)^2`, d: fr(`${2 * a}\\ln x`, 'x'), domTex: IPOS, dom: [0.3, 4],
          faux: [fr(String(2 * a), 'x'), `${2 * a}\\ln x`, fr(`${a}\\ln x`, 'x'), fr(`${2 * a}\\ln x`, 'x^2')],
          expl: `${m(T`(u^2)'=2u'u`)} avec ${m(T`u=\ln x`)} et ${m(T`u'=\dfrac{1}{x}`)} : ${m(T`${a}\times 2\times\dfrac{1}{x}\times\ln x=${fr(`${2 * a}\\ln x`, 'x')}`)}.` };
      }
    ]
  };
  function derivee(niveau) {
    const mo = tirerModele(MODELES_DERIVEE, niveau)();
    const bonne = texOpt(`f'(x)=${mo.d}`);
    const faux = mo.faux.map(t => texOpt(`f'(x)=${t}`));
    return qcm(`On considère la fonction ${m('f')} définie sur ${m(mo.domTex)} par ${m(`f(x)=${mo.f}`)}. Quelle est l'expression de sa dérivée ${m("f'(x)")} ?`,
      bonne, faux, { explication: mo.expl, meta: { fTex: mo.f, dom: mo.dom } });
  }

  // ==========================================================================
  // 2. Primitives
  // ==========================================================================
  // un modèle renvoie { f, F, faux: [...], domTex, dom, cond: {x0, y0}|null, expl }
  const MODELES_PRIMITIVE = {
    1: [
      () => {                                   // a e^{kx}
        const a = aleaParmi([2, 3, 4, 5, 6, -2, -3]), k = aleaParmi([2, 3, 4, -1, -2, -3]), kx = P([k, 'x']), u = E(kx);
        return { f: `${coef(a)}${u}`, F: `${coefFr(a, k)}${u}`, domTex: IR, dom: [-2, 2],
          faux: [`${coef(a)}${u}`, `${coef(a * k)}${u}`, `${coefFr(a, k + 1)}${E(P([k + 1, 'x']))}`, `${coefFr(a, k)}${E(P([k - 1, 'x']))}`, `${coef(k)}${u}`],
          expl: `Une primitive de ${m(T`u'e^{u}`)} est ${m(T`e^{u}`)} : ici ${m(`u=${kx}`)} et ${m(`u'=${k}`)}, donc il faut diviser par ${m(String(k))} : ${m(`F(x)=${coefFr(a, k)}${u}`)}.` };
      },
      () => {                                   // a/x
        const a = aleaParmi([2, 3, 4, 5]);
        return { f: fr(String(a), 'x'), F: `${a}\\ln x`, domTex: IPOS, dom: [0.3, 4],
          faux: [`\\ln\\left(${a}x\\right)`, fr(String(-a), 'x^2'), `${fr(String(a), 'x')}\\ln x`, `${a}\\ln\\left(x^2\\right)`, fr('x', String(a))],
          expl: `Une primitive de ${m(T`\dfrac{1}{x}`)} sur ${m(IPOS)} est ${m(T`\ln x`)} ; on multiplie par ${m(String(a))}.` };
      },
      () => {                                   // ax + b e^x
        const a = aleaParmi([2, 4, 6, 3]), b = aleaParmi([2, 3, 5, -2, -3]), bs = `${b < 0 ? '-' : '+'}${Math.abs(b)}`;
        return { f: `${a}x${bs}e^x`, F: `${coefFr(a, 2)}x^2${bs}e^x`, domTex: IR, dom: [-2, 2],
          faux: [`${a}x^2${bs}e^x`, `${coefFr(a, 2)}x^2${bs}xe^x`, `${coefFr(a, 2)}x^2`, `${a}x${bs}e^x`, `${coefFr(a, 2)}x^2${bs}\\dfrac{e^{x+1}}{x+1}`],
          expl: `Une primitive de ${m(`${a}x`)} est ${m(`${coefFr(a, 2)}x^2`)} et une primitive de ${m(`${Math.abs(b)}e^x`)} est ${m(`${Math.abs(b)}e^x`)} : la primitive de ${m('e^x')} est ${m('e^x')} elle-même.` };
      }
    ],
    2: [
      () => {                                   // x e^{a x^2 + b}
        const a = aleaParmi([1, 2, 3, -1, -2]), b = aleaParmi([1, 2, 3, 4, -1, -2]), u = E(P([a, 'x^2'], [b, '']));
        return { f: `x${u}`, F: `${coefFr(1, 2 * a)}${u}`, domTex: IR, dom: [-1.5, 1.5],
          faux: [u, `\\dfrac{x^2}{2}${u}`, `${coefFr(1, a)}${u}`, `${coefFr(2, a)}${u}`, `${coefFr(a, 2)}${u}`],
          expl: `${m(`x${u}`)} est de la forme ${m(T`u'e^{u}`)} à un coefficient près : avec ${m(`u=${P([a, 'x^2'], [b, ''])}`)}, ${m(`u'=${P([2 * a, 'x'])}`)}, donc ${m(`F(x)=${coefFr(1, 2 * a)}${u}`)}.` };
      },
      () => {                                   // e^{kx+b} avec F(0) = y0
        const k = aleaParmi([2, 3, 4, -1, -2]), b = aleaParmi([1, 2, 3]), y0 = aleaParmi([1, 2, 3, -1, -2]), u = E(P([k, 'x'], [b, '']));
        const eb = b === 1 ? 'e' : `e^{${b}}`, den = Math.abs(k), ebk = den === 1 ? eb : fr(eb, String(den));
        const tete = `${coefFr(1, k)}${u}`, c0 = `${y0}${k > 0 ? '-' : '+'}${ebk}`;
        return { f: u, F: J(tete, c0), domTex: IR, dom: [-1, 1], cond: { x0: 0, y0 },
          faux: [tete, J(tete, String(y0)), J(tete, `${y0}-${eb}`), J(`${coef(k)}${u}`, String(y0)), J(tete, `${y0}${k > 0 ? '+' : '-'}${ebk}`)],
          expl: `Les primitives de ${m(`f(x)=${u}`)} sont ${m(`${tete}+C`)}. La condition ${m(`F(0)=${y0}`)} donne ${m(`${coefFr(1, k)}${eb}+C=${y0}`)}, donc ${m(`C=${c0}`)}.` };
      },
      () => {                                   // (2x+b)/(x^2+bx+c) -> ln(x^2+bx+c)
        const b = aleaParmi([1, 2, 3, -1, -2, -3]), c = Math.ceil(b * b / 4) + 1 + alea(0, 2), g = P([1, 'x^2'], [b, 'x'], [c, '']), g1 = P([2, 'x'], [b, '']);
        return { f: fr(g1, g), F: ln(g), domTex: IR, dom: [-2.5, 2.5],
          faux: [fr('1', g), ln(g1), `\\left(${g1}\\right)${ln(g)}`, fr(g, g1), fr(`\\left(${g1}\\right)^2`, `2\\left(${g}\\right)`)],
          expl: `${m(T`\dfrac{u'}{u}`)} a pour primitive ${m(T`\ln(u)`)} lorsque ${m('u>0')} : ici ${m(`u=${g}`)}, strictement positif sur ${m(IR)}.` };
      },
      () => {                                   // a x / (x^2 + c)
        const c = alea(1, 5), a = aleaParmi([1, 2, 3, 4]), g = P([1, 'x^2'], [c, '']);
        return { f: fr(`${a === 1 ? '' : a}x`, g), F: `${coefFr(a, 2)}${ln(g)}`, domTex: IR, dom: [-2.5, 2.5],
          faux: [`${a === 1 ? '' : a}${ln(g)}`, `${coefFr(a, 2)}\\left(${g}\\right)^2`, fr('1', g), `${coefFr(a, 4)}${ln(g)}`, `${coefFr(a, 2)}${ln('x')}`],
          expl: `${m(fr('2x', g))} a pour primitive ${m(ln(g))} : ${m(`F(x)=${coefFr(a, 2)}${ln(g)}`)}.` };
      }
    ],
    3: [
      () => {                                   // a ln x  ->  a (x ln x - x)
        const a = aleaParmi([1, 2, 3, -1, -2]);
        return { f: `${coef(a)}\\ln x`, F: `${coef(a)}\\left(x\\ln x-x\\right)`, domTex: IPOS, dom: [0.3, 4],
          faux: [`${a < 0 ? '-' : ''}\\dfrac{${Math.abs(a)}}{x}`, `${coef(a)}x\\ln x`, `${coef(a)}\\left(x\\ln x+x\\right)`, `${coef(a)}\\left(\\dfrac{1}{x}-x\\right)`],
          expl: `On vérifie : ${m(T`\left(x\ln x-x\right)'=\ln x+x\times\dfrac{1}{x}-1=\ln x`)}. Une primitive de ${m(`${coef(a)}\\ln x`)} est donc ${m(`${coef(a)}\\left(x\\ln x-x\\right)`)}.` };
      },
      () => {                                   // (x + b) e^x -> (x + b - 1) e^x
        const b = aleaParmi([1, 2, 3, 4, -1, -2, -3]);
        return { f: `(${P([1, 'x'], [b, ''])})e^x`, F: `(${P([1, 'x'], [b - 1, ''])})e^x`, domTex: IR, dom: [-2, 2],
          faux: [`(${P([1, 'x'], [b + 1, ''])})e^x`, `\\left(\\dfrac{x^2}{2}${b < 0 ? '-' : '+'}${Math.abs(b)}x\\right)e^x`, `(${P([1, 'x'], [b, ''])})e^x`, `(${P([1, 'x'], [b - 2, ''])})e^x`],
          expl: `Intégration par parties (ou vérification) : ${m(T`\left((${P([1, 'x'], [b - 1, ''])})e^x\right)'=e^x+(${P([1, 'x'], [b - 1, ''])})e^x=(${P([1, 'x'], [b, ''])})e^x`)}.` };
      },
      () => {                                   // x/(c - x^2) sur ]-r ; r[
        const r = aleaParmi([1, 2, 3]), c = r * r, g = `${c}-x^2`;
        return { f: fr('x', g), F: `-\\dfrac{1}{2}${ln(g)}`, domTex: bornes(String(-r), String(r)), dom: [-r + 0.1, r - 0.1],
          faux: [`\\dfrac{1}{2}${ln(g)}`, `-${ln(g)}`, ln(g), `-\\dfrac{x^2}{2}${ln(g)}`, `-\\dfrac{1}{2}${ln('x')}`],
          expl: `${m(T`\dfrac{x}{${g}}=-\dfrac{1}{2}\times\dfrac{-2x}{${g}}`)} avec ${m(T`u=${g}`)}, ${m("u'=-2x")} : la primitive est ${m(T`-\dfrac{1}{2}\ln\left(${g}\right)`)} (${m('u>0')} sur ${m(bornes(String(-r), String(r)))}).` };
      },
      () => {                                   // e^x/(e^x + c)
        const c = alea(1, 5), g = `e^x+${c}`;
        return { f: fr('e^x', g), F: ln(g), domTex: IR, dom: [-2, 2],
          faux: [fr('1', g), `e^x${ln(g)}`, fr('e^x', `\\left(${g}\\right)^2`), ln('e^x'), fr('e^{2x}', '2')],
          expl: `${m(T`\dfrac{u'}{u}`)} avec ${m(`u=${g}`)}, ${m("u'=e^x")} : une primitive est ${m(ln(g))}.` };
      },
      () => {                                   // ln x / x -> (ln x)^2 / 2
        return { f: fr('\\ln x', 'x'), F: `\\dfrac{1}{2}\\left(\\ln x\\right)^2`, domTex: IPOS, dom: [0.3, 4],
          faux: [`\\left(\\ln x\\right)^2`, `\\dfrac{1}{2}\\ln\\left(x^2\\right)`, fr('\\ln x', 'x^2'), fr('\\left(\\ln x\\right)^2', 'x'), `\\ln\\left(\\ln x\\right)`],
          expl: `${m(T`\dfrac{\ln x}{x}=u'u`)} avec ${m(T`u=\ln x`)} : une primitive de ${m("u'u")} est ${m(T`\dfrac{u^2}{2}`)}.` };
      }
    ]
  };
  function primitive(niveau) {
    const mo = tirerModele(MODELES_PRIMITIVE, niveau)();
    const nom = x => texOpt(`F(x)=${x}`);
    const bonne = nom(mo.F), faux = mo.faux.map(nom);
    const enonce = mo.cond
      ? `On considère la fonction ${m('f')} définie sur ${m(mo.domTex)} par ${m(`f(x)=${mo.f}`)}. Quelle est la primitive ${m('F')} de ${m('f')} sur ${m(mo.domTex)} qui vérifie ${m(`F(${mo.cond.x0})=${mo.cond.y0}`)} ?`
      : `On considère la fonction ${m('f')} définie sur ${m(mo.domTex)} par ${m(`f(x)=${mo.f}`)}. Laquelle de ces fonctions est une primitive de ${m('f')} sur ${m(mo.domTex)} ?`;
    return qcm(enonce, bonne, faux, { explication: mo.expl, meta: { fTex: mo.f, dom: mo.dom, cond: mo.cond || null } });
  }

  // ==========================================================================
  // 3. Ensemble de définition, équations et inéquations avec ln et exp
  // ==========================================================================
  const INF = T`+\infty`, MINF = T`-\infty`;
  const IV = (lo, hi, lc, hc) => T`\left${lc ? '[' : ']'}${lo}\,;${hi}\right${hc ? ']' : '['}`;   // intervalle (bornes infinies toujours ouvertes)
  const ENS = (...v) => T`\left\{${v.join(T`\,;`)}\right\}`;
  const UNION = (...p) => p.join(T`\cup`);
  const lnN = k => T`\ln ${k}`;
  // candidats [tex, valeur] sans doublon et différents de la bonne valeur (v)
  const candidats = (vBonne, liste) => {
    const vus = new Set(), res = [];
    for (const [tex, v] of liste) { if (Number.isNaN(v) || v === vBonne || Math.abs(v - vBonne) < 1e-9 || vus.has(tex)) continue; vus.add(tex); res.push(tex); }
    return res;
  };

  const MODELES_EQUATION = {
    1: [
      () => {                                   // ensemble de définition de ln(ax+b)
        const a = aleaParmi([1, 2, 3, 4, -1, -2, -3]), b = aleaParmi([1, 2, 3, 4, 5, -1, -2, -3, -4]), x0 = rat(-b, a), g = P([a, 'x'], [b, '']);
        const vrai = a > 0 ? IV(x0, INF, false, false) : IV(MINF, x0, false, false);
        return { type: 'dom', args: [g], enonce: `Quel est l'ensemble de définition de la fonction ${m('f')} définie par ${m(`f(x)=${ln(g)}`)} ?`, g: ln(g),
          bonne: vrai,
          faux: [a > 0 ? IV(x0, INF, true, false) : IV(MINF, x0, false, true), a > 0 ? IV(MINF, x0, false, false) : IV(x0, INF, false, false), a > 0 ? IV(rat(b, a), INF, false, false) : IV(MINF, rat(b, a), false, false), IV(MINF, INF, false, false)],
          expl: `${m(ln('u'))} est définie lorsque ${m('u>0')} : ici ${m(`${g}>0`)}, soit ${m(`x${a > 0 ? '>' : '<'}${x0}`)} (on change le sens de l'inégalité quand on divise par un nombre négatif).` };
      },
      () => {                                   // e^{ax+b} = k
        const a = aleaParmi([1, 2, 3, 4]), b = aleaParmi([0, 1, 2, 3, -1, -2]), k = alea(2, 9), L = Math.log(k), x1 = (L - b) / a;
        const num = b === 0 ? lnN(k) : `${lnN(k)}${sgn(-b)}`, sol = a === 1 ? num : fr(num, String(a));
        const faux = candidats(x1, [[lnN(k), L], [a === 1 ? `${lnN(k)}${sgn(b)}` : fr(`${lnN(k)}${sgn(b)}`, String(a)), (L + b) / a], [`${fr(lnN(k), String(a))}${sgn(-b)}`, L / a - b], [`${k}`, k], [`${E(String(k))}`, Math.exp(k)], [`${lnN(k)}${sgn(-b)}`, L - b], [`-${lnN(k)}`, -L], [fr(String(k), 'e'), k / Math.E], [lnN(k + 1), Math.log(k + 1)], [fr(lnN(k), String(a + 1)), L / (a + 1)]]);
        return { type: 'eq', args: [], g: E(P([a, 'x'], [b, ''])), h: String(k), op: '=', enonce: `Quel est l'ensemble des solutions dans ${m(IR)} de l'équation ${m(`e^{${P([a, 'x'], [b, ''])}}=${k}`)} ?`,
          bonne: ENS(sol), faux: faux.map(t => ENS(t)),
          expl: `On applique ${m(T`\ln`)} aux deux membres : ${m(`${P([a, 'x'], [b, ''])}=\\ln ${k}`)}, donc ${m(`x=${sol}`)}.` };
      },
      () => {                                   // ln(x + a) = b
        const a = aleaParmi([1, 2, 3, 4, -1, -2]), b = aleaParmi([1, 2, 3]), x1 = Math.exp(b) - a;
        const solTex = `${E(String(b))}${sgn(-a)}`;
        const faux = candidats(x1, [[`${b}${sgn(-a)}`, b - a], [`${E(String(b))}${sgn(a)}`, Math.exp(b) + a], [E(`${b}${sgn(-a)}`), Math.exp(b - a)], [`${b}${sgn(a)}`, b + a], [`${lnN(b)}${sgn(-a)}`, Math.log(b) - a]]);
        return { type: 'eq', args: [`x${sgn(a)}`], g: ln(`x${sgn(a)}`), h: String(b), op: '=', enonce: `Quel est l'ensemble des solutions de l'équation ${m(`\\ln\\left(x${sgn(a)}\\right)=${b}`)} ?`,
          bonne: ENS(solTex), faux: faux.map(t => ENS(t)),
          expl: `${m(`\\ln\\left(x${sgn(a)}\\right)=${b}`)} équivaut à ${m(`x${sgn(a)}=e^{${b}}`)}, soit ${m(`x=${solTex}`)} (valeur acceptable : ${m(`x${sgn(a)}>0`)}).` };
      }
    ],
    2: [
      () => {                                   // domaine de ln((x-a)/(x+b))
        let a, b; do { a = aleaParmi([-4, -3, -2, -1, 1, 2, 3, 4, 5]); b = alea(1, 5); } while (a === -b);
        const r1 = Math.min(a, -b), r2 = Math.max(a, -b), q = fr(`x${sgn(-a)}`, `x${sgn(b)}`);
        return { type: 'dom', args: [q], g: ln(q), enonce: `Quel est l'ensemble de définition de la fonction ${m('f')} définie par ${m(`f(x)=${ln(q)}`)} ?`,
          bonne: UNION(IV(MINF, String(r1), false, false), IV(String(r2), INF, false, false)),
          faux: [IV(String(r1), String(r2), false, false), UNION(IV(MINF, String(r1), false, true), IV(String(r2), INF, true, false)), IV(String(r2), INF, false, false), UNION(IV(MINF, String(-r2), false, false), IV(String(-r1), INF, false, false)), IV(MINF, INF, false, false)],
          expl: `Le quotient ${m(q)} est strictement positif lorsque ${m(`x${sgn(-a)}`)} et ${m(`x${sgn(b)}`)} ont le même signe : à l'extérieur des valeurs d'annulation ${m(String(r1))} et ${m(String(r2))}. Donc ${m('x<' + r1)} ou ${m('x>' + r2)}.` };
      },
      () => {                                   // domaine de ln(-x² + (r+s)x - rs)
        let r, s; do { r = alea(-3, 5); s = alea(-5, 3); } while (r - s < 2);
        const g = P([-1, 'x^2'], [r + s, 'x'], [-r * s, '']);
        return { type: 'dom', args: [g], g: ln(g), enonce: `Quel est l'ensemble de définition de la fonction ${m('f')} définie par ${m(`f(x)=${ln(g)}`)} ?`,
          bonne: IV(String(s), String(r), false, false),
          faux: [UNION(IV(MINF, String(s), false, false), IV(String(r), INF, false, false)), IV(String(s), String(r), true, true), UNION(IV(MINF, String(s), false, true), IV(String(r), INF, true, false)), IV(String(-r), String(-s), false, false), IV(MINF, INF, false, false)],
          expl: `On résout ${m(`${g}>0`)}. Le trinôme se factorise : ${m(`${g}=-(x${sgn(-s)})(x${sgn(-r)})`)}. Il est positif entre ses racines ${m(String(s))} et ${m(String(r))} (coefficient de ${m('x^2')} négatif), strictement entre elles.` };
      },
      () => {                                   // e^{2x} + p e^x - q = 0
        let r, s; do { r = alea(2, 6); s = alea(1, 6); } while (r === s);
        const pp = s - r, qq = r * s, lhs = `e^{2x}${pp === 0 ? '' : (pp < 0 ? '-' : '+') + (Math.abs(pp) === 1 ? '' : Math.abs(pp)) + 'e^x'}-${qq}`;
        return { type: 'eq', args: [], g: lhs, h: '0', op: '=', enonce: `Quel est l'ensemble des solutions dans ${m(IR)} de l'équation ${m(`${lhs}=0`)} ?`,
          bonne: ENS(lnN(r)), faux: [ENS(lnN(s)), ENS(String(r)), ENS(lnN(r), lnN(s)), ENS(String(r), String(-s)), ENS(lnN(r), String(-s))],
          expl: `On pose ${m(T`X=e^x`)} (avec ${m('X>0')}) : l'équation devient ${m(`X^2${pp === 0 ? '' : (pp < 0 ? '-' : '+') + (Math.abs(pp) === 1 ? '' : Math.abs(pp)) + 'X'}-${qq}=0`)}, de racines ${m(String(r))} et ${m(String(-s))}. Seule ${m(String(r))} convient (${m('X>0')}), d'où ${m(`x=\\ln ${r}`)}.` };
      },
      () => {                                   // ln x + ln(x - a) = ln b
        let r, s; do { r = alea(3, 9); s = alea(1, 6); } while (r - s < 1);
        const a = r - s, b = r * s;
        return { type: 'eq', args: ['x', `x-${a}`], g: `\\ln x+${ln(`x-${a}`)}`, h: lnN(b), op: '=', enonce: `Quel est l'ensemble des solutions de l'équation ${m(`\\ln x+\\ln\\left(x-${a}\\right)=\\ln ${b}`)} ?`,
          bonne: ENS(String(r)), faux: [ENS(String(r), String(-s)), ENS(String(-s)), ENS(String(a + b)), ENS(rat(b, a))],
          expl: `Il faut ${m(`x>${a}`)}. L'équation s'écrit ${m(`\\ln\\left(x(x-${a})\\right)=\\ln ${b}`)}, soit ${m(`x^2-${a}x-${b}=0`)}, de racines ${m(String(r))} et ${m(String(-s))}. Seule ${m(String(r))} est supérieure à ${m(String(a))}.` };
      },
      () => {                                   // (ln x)² + p ln x + q = 0
        let t1, t2; do { t1 = alea(-7, 3); t2 = alea(-7, 3); } while (t1 >= t2 || t1 === 0 || t2 === 0 || t1 + t2 === 0);
        const pp = -(t1 + t2), qq = t1 * t2;
        const lhs = `\\left(\\ln x\\right)^2${pp === 0 ? '' : (pp < 0 ? '-' : '+') + (Math.abs(pp) === 1 ? '' : Math.abs(pp)) + '\\ln x'}${qq < 0 ? '-' : '+'}${Math.abs(qq)}`;
        const ee = t => (t === 1 ? 'e' : E(String(t)));
        return { type: 'eq', args: ['x'], g: lhs, h: '0', op: '=', enonce: `Quel est l'ensemble des solutions de l'équation ${m(`${lhs}=0`)} ?`,
          bonne: ENS(ee(t1), ee(t2)), faux: [ENS(String(t1), String(t2)), ENS(ee(-t1), ee(-t2)), ENS(ee(t1)), ENS(ee(t1 + t2), ee(t1 * t2)), ENS(ee(t2))].slice(0, 5),
          expl: `On pose ${m(T`X=\ln x`)} : ${m(`X^2${pp === 0 ? '' : (pp < 0 ? '-' : '+') + (Math.abs(pp) === 1 ? '' : Math.abs(pp)) + 'X'}${qq < 0 ? '-' : '+'}${Math.abs(qq)}=0`)} a pour racines ${m(String(t1))} et ${m(String(t2))}, donc ${m(`x=e^{${t1}}`)} ou ${m(`x=e^{${t2}}`)}.` };
      }
    ],
    3: [
      () => {                                   // ln(x + a) < 2 ln(x + b)
        const b = aleaParmi([1, 2, 3]), r1 = alea(0, 4), r2 = 1 - 2 * b - r1, a = b * b - r1 * r2;
        return { type: 'ineq', args: [`x+${a}`, `x+${b}`], g: ln(`x+${a}`), h: `2${ln(`x+${b}`)}`, op: '<', enonce: `Quel est l'ensemble des solutions de l'inéquation ${m(`\\ln\\left(x+${a}\\right)\\lt 2\\ln\\left(x+${b}\\right)`)} ?`,
          bonne: IV(String(r1), INF, false, false),
          faux: [IV(String(-b), String(r1), false, false), IV(String(r2), String(r1), false, false), UNION(IV(MINF, String(r2), false, false), IV(String(r1), INF, false, false)), IV(String(-b), INF, false, false), IV(String(r1), INF, true, false)],
          expl: `Il faut ${m(`x+${a}>0`)} et ${m(`x+${b}>0`)}, donc ${m(`x>${-b}`)}. Alors l'inéquation équivaut à ${m(`x+${a}\\lt (x+${b})^2`)}, soit ${m(`${P([1, 'x^2'], [2 * b - 1, 'x'], [b * b - a, ''])}>0`)}, de racines ${m(String(r1))} et ${m(String(r2))}. Avec ${m(`x>${-b}`)}, on obtient ${m(`x>${r1}`)}.` };
      },
      () => {                                   // ln(ax+b) ◇ c
        const a = aleaParmi([2, 3, 4, 5]), b = aleaParmi([1, 2, 3, -1, -2]), c = aleaParmi([1, 2, 3]), op = aleaParmi(['le', 'lt', 'ge', 'gt']);
        const lo = rat(-b, a), hi = fr(`e^{${c}}${sgn(-b)}`, String(a)), g = P([a, 'x'], [b, '']), hiFaux = fr(`e^{${c}}${sgn(b)}`, String(a)), hiBis = fr(`${c}${sgn(-b)}`, String(a));
        const sym = { le: '\\le', lt: '\\lt', ge: '\\ge', gt: '\\gt' }[op], opm = { le: '<=', lt: '<', ge: '>=', gt: '>' }[op];
        const bonnes = { le: IV(lo, hi, false, true), lt: IV(lo, hi, false, false), ge: IV(hi, INF, true, false), gt: IV(hi, INF, false, false) };
        const fauxs = { le: [IV(MINF, hi, false, true), IV(lo, hi, false, false), IV(lo, hiBis, false, true), IV(hi, INF, true, false), IV(lo, hiFaux, false, true)],
          lt: [IV(MINF, hi, false, false), IV(lo, hi, false, true), IV(lo, hiBis, false, false), IV(hi, INF, false, false), IV(lo, hiFaux, false, false)],
          ge: [IV(lo, hi, false, true), IV(hi, INF, false, false), IV(hiBis, INF, true, false), IV(lo, INF, false, false), IV(hiFaux, INF, true, false)],
          gt: [IV(lo, hi, false, false), IV(hi, INF, true, false), IV(hiBis, INF, false, false), IV(lo, INF, false, false), IV(hiFaux, INF, false, false)] };
        return { type: 'ineq', args: [g], g: ln(g), h: String(c), op: opm, enonce: `Quel est l'ensemble des solutions de l'inéquation ${m(`\\ln\\left(${g}\\right)${sym} ${c}`)} ?`,
          bonne: bonnes[op], faux: fauxs[op],
          expl: `Il faut ${m(`${g}>0`)}, soit ${m(`x>${lo}`)}. Puis ${m(`\\ln(${g})${sym} ${c}`)} équivaut à ${m(`${g}${sym} e^{${c}}`)} (${m(T`\exp`)} est croissante), soit ${m(`x${sym} ${hi}`)}${op === 'ge' || op === 'gt' ? ` (valeur supérieure à ${m(lo)}, la condition d'existence est donc vérifiée)` : ` ; avec la condition d'existence, on obtient ${m(bonnes[op])}`}.` };
      },
      () => {                                   // e^{2x} + p e^x - q ◇ 0
        let r, s; do { r = alea(2, 6); s = alea(1, 6); } while (r === s);
        const pp = s - r, qq = r * s, op = aleaParmi(['gt', 'ge', 'lt', 'le']), lhs = `e^{2x}${pp === 0 ? '' : (pp < 0 ? '-' : '+') + (Math.abs(pp) === 1 ? '' : Math.abs(pp)) + 'e^x'}-${qq}`;
        const sym = { le: '\\le', lt: '\\lt', ge: '\\ge', gt: '\\gt' }[op], opm = { le: '<=', lt: '<', ge: '>=', gt: '>' }[op], L = lnN(r);
        const bonnes = { gt: IV(L, INF, false, false), ge: IV(L, INF, true, false), lt: IV(MINF, L, false, false), le: IV(MINF, L, false, true) };
        const haut = op === 'gt' || op === 'ge', ferme = op === 'ge' || op === 'le';
        const faux = [haut ? IV(MINF, L, false, ferme) : IV(L, INF, ferme, false), haut ? IV(String(r), INF, ferme, false) : IV(MINF, String(r), false, ferme), haut ? IV(L, INF, !ferme, false) : IV(MINF, L, false, !ferme),
          haut ? UNION(IV(MINF, String(-s), false, ferme), IV(L, INF, ferme, false)) : IV(lnN(s), INF, ferme, false), IV(MINF, INF, false, false)];
        return { type: 'ineq', args: [], g: lhs, h: '0', op: opm, enonce: `Quel est l'ensemble des solutions de l'inéquation ${m(`${lhs}${sym} 0`)} ?`,
          bonne: bonnes[op], faux,
          expl: `Avec ${m(T`X=e^x`)} (${m('X>0')}), ${m(`X^2${pp === 0 ? '' : (pp < 0 ? '-' : '+') + (Math.abs(pp) === 1 ? '' : Math.abs(pp)) + 'X'}-${qq}=(X-${r})(X+${s})`)} ; comme ${m(`X+${s}>0`)}, le signe est celui de ${m(`X-${r}`)}. On obtient ${m(`X${haut ? (ferme ? '\\ge' : '\\gt') : (ferme ? '\\le' : '\\lt')} ${r}`)}, donc ${m(`x${haut ? (ferme ? '\\ge' : '\\gt') : (ferme ? '\\le' : '\\lt')} \\ln ${r}`)}.` };
      }
    ]
  };
  function equation(niveau) {
    const mo = aleaParmi(MODELES_EQUATION[niveau])();
    const dis = mo.faux.filter((t, i, a) => a.indexOf(t) === i && t !== mo.bonne);
    return epure(qcm(mo.enonce, texOpt(mo.bonne), dis.map(texOpt), { explication: mo.expl, meta: { type: mo.type, args: mo.args, g: mo.g, h: mo.h, op: mo.op } }));
  }

  // ==========================================================================
  // 4. Limites de fonctions (croissances comparées, quotients, asymptotes)
  // ==========================================================================
  function enoncerLimite(mo) {
    const lieu = { inf: `en ${m(INF)}`, '-inf': `en ${m(MINF)}`, '0+': `en ${m('0')} par valeurs supérieures`, '0': `en ${m('0')}` }[mo.at];
    return `On considère la fonction ${m('f')} définie sur ${m(mo.domTex)} par ${m(`f(x)=${mo.f}`)}. Quelle est la limite de ${m('f')} ${lieu} ?`;
  }
  // limite valant Infinity, -Infinity ou un nombre (tex) ; faux : liste de [tex, valeur]
  const MODELES_LIMITE = {
    1: [
      () => {                                   // a e^{kx}
        const a = aleaParmi([2, 3, 5, -2, -3]), k = aleaParmi([1, 2, 3, -1, -2, -3]), at = aleaParmi(['inf', '-inf']);
        const dir = (at === 'inf' ? 1 : -1) * Math.sign(k), v = dir > 0 ? Math.sign(a) * Infinity : 0;
        return { f: `${coef(a)}e^{${P([k, 'x'])}}`, domTex: IR, at, v, faux: [['0', 0], [INF, Infinity], [MINF, -Infinity], [String(a), a], ['1', 1]],
          expl: `Quand ${m('x')} tend vers ${m(at === 'inf' ? INF : MINF)}, ${m(P([k, 'x']))} tend vers ${m(dir > 0 ? INF : MINF)}, donc ${m(`e^{${P([k, 'x'])}}`)} tend vers ${m(dir > 0 ? INF : '0')}${dir > 0 ? `, et le coefficient ${m(String(a))} est ${a > 0 ? 'positif' : 'négatif'}` : ''}.` };
      },
      () => {                                   // polynôme
        const d = aleaParmi([2, 3]), a = aleaParmi([1, 2, 3, -1, -2, -3]), b = aleaParmi([1, 2, 3, 4, -1, -2, -3]), c = aleaParmi([1, 2, 3, -4, -2]), at = aleaParmi(['inf', '-inf']);
        const f = P([a, xp(d)], [b, 'x'], [c, '']), sgnInf = Math.sign(a) * (at === 'inf' ? 1 : Math.pow(-1, d));
        return { f, domTex: IR, at, v: sgnInf * Infinity, faux: [['0', 0], [INF, Infinity], [MINF, -Infinity], [String(c), c], [String(a), a]],
          expl: `En l'infini, un polynôme a la même limite que son terme de plus haut degré ${m(P([a, xp(d)]))} : ${m(INF)} ou ${m(MINF)} selon le signe de ${m(String(a))} et la parité de ${m(String(d))}.` };
      },
      () => {                                   // (ax+b)/(cx+d)
        let a, b, c, d; do { a = aleaParmi([1, 2, 3, 4, -1, -2, -3]); b = alea(-5, 5); c = aleaParmi([1, 2, 3, 4, -1, -2]); d = alea(-5, 5); } while (a * d - b * c === 0);
        const at = aleaParmi(['inf', '-inf']), L = rat(a, c);
        return { f: fr(P([a, 'x'], [b, '']), P([c, 'x'], [d, ''])), domTex: T`\mathbb{R}\setminus\left\{${rat(-d, c)}\right\}`, at, v: a / c, vTex: L,
          faux: [[rat(c, a), c / a], [INF, Infinity], ['0', 0], [String(a), a], [rat(b, d || 1), d ? b / d : NaN], [rat(-a, c), -a / c]],
          expl: `Pour un quotient de deux fonctions affines, la limite en l'infini est le quotient des coefficients de ${m('x')} : ${m(`${fr(String(a), String(c))}=${L}`)}.` };
      },
      () => {                                   // a ln x
        const a = aleaParmi([2, 3, 5, -1, -2]), at = aleaParmi(['inf', '0+']);
        const v = (at === 'inf' ? 1 : -1) * Math.sign(a) * Infinity;
        return { f: `${coef(a)}\\ln x`, domTex: IPOS, at, v, faux: [['0', 0], [INF, Infinity], [MINF, -Infinity], [String(a), a]],
          expl: `${m(T`\lim_{x\to+\infty}\ln x=+\infty`)} et ${m(T`\lim_{x\to0^{+}}\ln x=-\infty`)} ; on tient compte du signe de ${m(String(a))}.` };
      },
      () => {                                   // a/x
        const a = aleaParmi([1, 2, 3, -1, -2]), at = aleaParmi(['inf', '0+']);
        return { f: fr(String(a), 'x'), domTex: IPOS, at, v: at === 'inf' ? 0 : Math.sign(a) * Infinity, faux: [['0', 0], [INF, Infinity], [MINF, -Infinity], [String(a), a], ['1', 1]],
          expl: at === 'inf' ? `${m(T`\dfrac{1}{x}`)} tend vers ${m('0')} quand ${m('x')} tend vers ${m(INF)}.` : `${m(String(a))} est ${a > 0 ? 'positif' : 'négatif'} et ${m('x')} tend vers ${m('0')} par valeurs supérieures : le quotient tend vers ${m(a > 0 ? INF : MINF)}.` };
      }
    ],
    2: [
      () => {                                   // (e^x + a)/(e^x - b)
        const a = alea(1, 5), b = alea(1, 5), at = aleaParmi(['inf', '-inf']);
        const v = at === 'inf' ? 1 : -a / b;
        return { f: fr(`e^x+${a}`, `e^x-${b}`), domTex: T`\mathbb{R}\setminus\left\{\ln ${b}\right\}`, at, v, vTex: at === 'inf' ? '1' : rat(-a, b), faux: [['0', 0], ['1', 1], ['-1', -1], [INF, Infinity], [rat(a, b), a / b], [rat(-a, b), -a / b], [String(-a), -a], [MINF, -Infinity]],
          expl: at === 'inf' ? `Pour ${m('x')} grand, on factorise par ${m('e^x')} : ${m(T`\dfrac{e^x(1+${a}e^{-x})}{e^x(1-${b}e^{-x})}`)} tend vers ${m('1')}.` : `En ${m(MINF)}, ${m('e^x')} tend vers ${m('0')} : le quotient tend vers ${m(fr(String(a), String(-b)))}${a % b === 0 ? ` ${m('=' + (-a / b))}` : ''}.` };
      },
      () => {                                   // x^n e^{-x}, (x+a)/e^x
        const n = aleaParmi([1, 2, 3]), a = aleaParmi([1, 2, 3]), forme = aleaParmi(['p', 'q']);
        return { f: forme === 'p' ? `${xp(n)}e^{-x}` : fr(`x+${a}`, 'e^x'), domTex: IR, at: 'inf', v: 0, faux: [[INF, Infinity], ['1', 1], [MINF, -Infinity], [String(a), a], [String(n), n]],
          expl: `Par croissances comparées, ${m(T`\lim_{x\to+\infty}\dfrac{x^n}{e^x}=0`)} : l'exponentielle l'emporte sur toute puissance de ${m('x')}.` };
      },
      () => {                                   // e^x / x^n
        const n = aleaParmi([1, 2, 3, 4]);
        return { f: fr('e^x', xp(n)), domTex: IPOS, at: 'inf', v: Infinity, faux: [['0', 0], ['1', 1], [MINF, -Infinity], [String(n), n]],
          expl: `Par croissances comparées, ${m(T`\lim_{x\to+\infty}\dfrac{e^x}{x^n}=+\infty`)}.` };
      },
      () => {                                   // ln x / (a x^2 + 1) ou ln x / x^n
        const n = aleaParmi([1, 2, 3]), a = aleaParmi([2, 3, 4]), den = aleaParmi([xp(n), P([a, 'x^2'], [1, ''])]);
        return { f: fr('\\ln x', den), domTex: IPOS, at: 'inf', v: 0, faux: [[INF, Infinity], ['1', 1], [MINF, -Infinity], [String(a), a], [rat(1, a), 1 / a]],
          expl: `Le logarithme croît beaucoup plus lentement que toute puissance de ${m('x')} : par croissances comparées, le quotient tend vers ${m('0')}.` };
      },
      () => {                                   // x^n ln x en 0+
        const n = aleaParmi([1, 2, 3]), a = aleaParmi([1, 2, 3, -1, -2]);
        return { f: `${coef(a)}${xp(n)}\\ln x`, domTex: IPOS, at: '0+', v: 0, faux: [[INF, Infinity], [MINF, -Infinity], ['1', 1], [String(-a), -a]],
          expl: `Par croissances comparées, ${m(T`\lim_{x\to0^{+}}x^n\ln x=0`)} : la puissance de ${m('x')} l'emporte sur le logarithme.` };
      },
      () => {                                   // (e^{2x} - a)/(e^x - x)
        const a = alea(1, 4), k = aleaParmi([2, 3]);
        return { f: fr(`e^{${k}x}-${a}`, 'e^x-x'), domTex: IR, at: 'inf', v: Infinity, faux: [['0', 0], ['1', 1], [MINF, -Infinity], [String(k), k]],
          expl: `On factorise par ${m(`e^{${k}x}`)} au numérateur et par ${m('e^x')} au dénominateur : le quotient se comporte comme ${m(`e^{${k - 1}x}`.replace('e^{1x}', 'e^x'))}, qui tend vers ${m(INF)}.` };
      },
      () => {                                   // x^n e^{kx} en -infini
        const n = aleaParmi([1, 2, 3]), k = aleaParmi([1, 2, 3]);
        return { f: `${xp(n)}e^{${k === 1 ? '' : k}x}`, domTex: IR, at: '-inf', v: 0, faux: [[INF, Infinity], [MINF, -Infinity], ['1', 1], [String(n), n]],
          expl: `Avec ${m(T`X=-x`)} qui tend vers ${m(INF)}, on retrouve ${m(T`\dfrac{X^n}{e^{${k === 1 ? '' : k}X}}`)} qui tend vers ${m('0')} par croissances comparées.` };
      },
      () => {                                   // asymptote horizontale d'un quotient
        let a, b, c, d; do { a = aleaParmi([1, 2, 3, 4, -1, -2, -3]); b = alea(-5, 5); c = aleaParmi([1, 2, 3, -1, -2]); d = alea(-5, 5); } while (a * d - b * c === 0 || a % c === 0);
        const h = rat(a, c);
        return { asym: 'H', f: fr(P([a, 'x'], [b, '']), P([c, 'x'], [d, ''])), domTex: T`\mathbb{R}\setminus\left\{${rat(-d, c)}\right\}`, at: 'inf', v: a / c,
          q: `On considère la fonction ${m('f')} définie sur ${m(T`\mathbb{R}\setminus\left\{${rat(-d, c)}\right\}`)} par ${m(`f(x)=${fr(P([a, 'x'], [b, '']), P([c, 'x'], [d, '']))}`)}. Laquelle de ces droites est asymptote à la courbe représentative de ${m('f')} en ${m(INF)} ?`,
          bonneTex: `y=${h}`, fauxTex: [`y=${rat(c, a)}`, `x=${rat(-d, c)}`, `y=${a}`, `y=${rat(b, d || 1)}`, `x=${rat(-b, a)}`],
          expl: `${m(T`\lim_{x\to+\infty}f(x)=${fr(String(a), String(c))}=${h}`)} : la droite d'équation ${m(`y=${h}`)} est asymptote horizontale. La droite ${m(`x=${rat(-d, c)}`)} est l'asymptote verticale, pas l'asymptote en ${m(INF)}.` };
      }
    ],
    3: [
      () => {                                   // e^x - x^n, x^n - e^x
        const n = aleaParmi([2, 3, 4]), sens = aleaParmi([1, -1]);
        return { f: sens > 0 ? `e^x-${xp(n)}` : `${xp(n)}-e^x`, domTex: IR, at: 'inf', v: sens * Infinity, faux: [['0', 0], [sens > 0 ? MINF : INF, -sens * Infinity], ['1', 1], [String(-n), -n]],
          expl: `Par croissances comparées, ${m('e^x')} l'emporte sur ${m(xp(n))} en ${m(INF)}. On écrit ${m(sens > 0 ? `e^x-${xp(n)}=e^x\\left(1-\\dfrac{${xp(n)}}{e^x}\\right)` : `${xp(n)}-e^x=-e^x\\left(1-\\dfrac{${xp(n)}}{e^x}\\right)`)}.` };
      },
      () => {                                   // x - ln x, ln x - x, ln x - sqrt(x)
        const forme = aleaParmi(['a', 'b', 'c']);
        const f = { a: 'x-\\ln x', b: '\\ln x-x', c: '\\ln x-\\sqrt{x}' }[forme], v = forme === 'a' ? Infinity : -Infinity;
        return { f, domTex: IPOS, at: 'inf', v, faux: [['0', 0], [forme === 'a' ? MINF : INF, -v], ['1', 1], [forme === 'a' ? '0' : '-1', forme === 'a' ? 0 : -1]],
          expl: `Par croissances comparées, ${m(T`\ln x`)} est négligeable devant ${forme === 'c' ? m(T`\sqrt{x}`) : m('x')} en ${m(INF)} : on factorise par le terme dominant, qui impose la limite ${m(v > 0 ? INF : MINF)}.` };
      },
      () => {                                   // sqrt(x^2 + a x) - x
        const a = aleaParmi([2, 4, 6, 1, 3, 5]);
        return { f: `\\sqrt{x^2+${a}x}-x`, domTex: IPOS, at: 'inf', v: a / 2, vTex: rat(a, 2), faux: [['0', 0], [INF, Infinity], [String(a), a], [rat(a, 4), a / 4], ['1', 1]],
          expl: `Forme indéterminée ${m(T`\infty-\infty`)} : on multiplie par la quantité conjuguée. ${m(T`\sqrt{x^2+${a}x}-x=\dfrac{${a}x}{\sqrt{x^2+${a}x}+x}=\dfrac{${a}}{\sqrt{1+\frac{${a}}{x}}+1}`)} tend vers ${m(rat(a, 2))}.` };
      },
      () => {                                   // ln(1 + e^x) - x
        return { f: `\\ln\\left(1+e^x\\right)-x`, domTex: IR, at: 'inf', v: 0, faux: [[INF, Infinity], ['1', 1], [MINF, -Infinity], ['-1', -1]],
          expl: `${m(T`\ln(1+e^x)-x=\ln\left(e^x(1+e^{-x})\right)-x=\ln\left(1+e^{-x}\right)`)}, qui tend vers ${m('\\ln 1=0')}.` };
      },
      () => {                                   // ln x / x en 0+, (e^x - 1)/x et ln(1+x)/x en 0
        const t = aleaParmi(['lnx', 'exp', 'ln1']);
        const d = { lnx: { f: fr('\\ln x', 'x'), at: '0+', v: -Infinity, domTex: IPOS, expl: `Au voisinage de ${m('0')} par valeurs supérieures, ${m(T`\ln x`)} tend vers ${m(MINF)} et ${m('x')} est positif et tend vers ${m('0')} : le quotient tend vers ${m(MINF)}.` },
          exp: { f: fr('e^x-1', 'x'), at: '0', v: 1, domTex: T`\mathbb{R}^{*}`, expl: `${m(T`\dfrac{e^x-1}{x}=\dfrac{e^x-e^0}{x-0}`)} est le taux d'accroissement de ${m('\\exp')} en ${m('0')} : il tend vers ${m(T`\exp'(0)=1`)}.` },
          ln1: { f: fr('\\ln(1+x)', 'x'), at: '0', v: 1, domTex: T`\left]-1\,;+\infty\right[\setminus\left\{0\right\}`, expl: `${m(T`\dfrac{\ln(1+x)}{x}=\dfrac{\ln(1+x)-\ln 1}{x-0}`)} est le taux d'accroissement de ${m(T`x\mapsto\ln(1+x)`)} en ${m('0')} : il tend vers la dérivée ${m(T`\dfrac{1}{1+0}=1`)}.` } }[t];
        return { f: d.f, domTex: d.domTex, at: d.at, v: d.v, faux: [['0', 0], [INF, Infinity], [t === 'lnx' ? INF : MINF, t === 'lnx' ? Infinity : -Infinity], ['1', 1], ['-1', -1], ['2', 2]], expl: d.expl };
      },
      () => {                                   // (e^x + x)/(e^x - x^2) et x e^x/(e^x + 1)
        if (Math.random() < 0.5) return { f: fr('e^x+x', 'e^x-x^2'), domTex: IR, at: 'inf', v: 1, faux: [['0', 0], [INF, Infinity], [MINF, -Infinity], ['-1', -1]],
          expl: `On factorise par ${m('e^x')} : ${m(T`\dfrac{1+xe^{-x}}{1-x^2e^{-x}}`)} tend vers ${m('1')} par croissances comparées.` };
        const at = aleaParmi(['inf', '-inf']);
        return { f: fr('xe^x', 'e^x+1'), domTex: IR, at, v: at === 'inf' ? Infinity : 0, faux: [['0', 0], [INF, Infinity], [MINF, -Infinity], ['1', 1], ['-1', -1]],
          expl: at === 'inf' ? `${m(T`\dfrac{xe^x}{e^x+1}=x\times\dfrac{1}{1+e^{-x}}`)} : en ${m(INF)}, le deuxième facteur tend vers ${m('1')}, donc le quotient tend vers ${m(INF)}.` : `En ${m(MINF)}, ${m('xe^x')} tend vers ${m('0')} (croissances comparées) et ${m('e^x+1')} tend vers ${m('1')} : le quotient tend vers ${m('0')}.` };
      }
    ]
  };
  function limite(niveau) {
    const mo = tirerModele(MODELES_LIMITE, niveau)();
    if (mo.asym) {
      return epure(qcm(mo.q, texOpt(mo.bonneTex), mo.fauxTex.filter((t, i, a) => a.indexOf(t) === i && t !== mo.bonneTex).map(texOpt), { explication: mo.expl, meta: { fTex: mo.f, at: mo.at, asym: mo.asym } }));
    }
    const bonne = mo.vTex || (Number.isFinite(mo.v) ? String(Math.round(mo.v)) : (mo.v > 0 ? INF : MINF));
    const dis = candidats(mo.v, mo.faux).filter(t => t !== bonne);
    return epure(qcm(enoncerLimite(mo), texOpt(bonne), dis.map(texOpt), { explication: mo.expl, meta: { fTex: mo.f, at: mo.at } }));
  }

  // ==========================================================================
  // 5. Tangente, tangente horizontale
  // ==========================================================================
  // c·e^k·suffixe (c entier, k exposant : 0 = pas de e) ; chaîne vide si c = 0
  const eT = (c, k, suffixe) => {
    if (c === 0) return '';
    const a = Math.abs(c), eb = k === 0 ? '' : k === 1 ? 'e' : `e^{${k}}`;
    const corps = k === 0 ? (a === 1 && suffixe ? '' : String(a)) : (a === 1 ? '' : String(a)) + eb;
    return (c < 0 ? '-' : '') + corps + (suffixe || '');
  };
  // y = m1·e^k1·x + p1·e^k2
  const droiteE = (m1, k1, p1, k2) => {
    const t1 = eT(m1, k1, 'x'), t2 = eT(p1, k2);
    return 'y=' + (!t1 ? (t2 || '0') : J(t1, t2));
  };
  const droiteTex = (mm, pp) => droiteE(mm, 0, pp, 0);
  const formeTangente = (aTex, sl, fa) => (aTex === '0' ? `y=${sl}x${sgn(fa)}` : `y=${sl}\\left(x${aTex === 'e' ? '-e' : sgn(-Number(aTex))}\\right)${sgn(fa)}`);
  const MODELES_TANGENTE = {
    1: [
      () => {                                   // x^2 + bx + c
        const b = aleaParmi([-4, -3, -2, -1, 1, 2, 3, 4]), c = alea(-4, 4), a = aleaParmi([-2, -1, 0, 1, 2, 3]);
        const fa = a * a + b * a + c, sl = 2 * a + b, p = fa - sl * a;
        return { f: P([1, 'x^2'], [b, 'x'], [c, '']), domTex: IR, a, aTex: String(a), bonne: droiteTex(sl, p),
          faux: [droiteTex(sl, fa), droiteTex(fa, sl), droiteTex(sl, c), droiteTex(sl + 1, p), droiteTex(sl, -p), droiteTex(-sl, p), droiteTex(sl, p + 1)],
          expl: `${m(`f'(x)=2x${sgn(b)}`)} donc ${m(`f'(${a})=${sl}`)} et ${m(`f(${a})=${fa}`)}. La tangente au point d'abscisse ${m(String(a))} a pour équation ${m(formeTangente(String(a), sl, fa))}, soit ${m(droiteTex(sl, p))}.` };
      },
      () => {                                   // e^x + bx en 0
        const b = aleaParmi([-3, -2, -1, 1, 2, 3, 4]);
        return { f: `e^x${b < 0 ? '-' : '+'}${Math.abs(b) === 1 ? '' : Math.abs(b)}x`, domTex: IR, a: 0, aTex: '0', bonne: droiteTex(b + 1, 1),
          faux: [droiteTex(b, 1), droiteTex(b + 1, 0), droiteTex(b + 2, 1), droiteTex(1, b + 1), droiteTex(b + 1, b)],
          expl: `${m(`f'(x)=e^x${sgn(b)}`)} donc ${m(`f'(0)=${b + 1}`)} et ${m('f(0)=1')}. La tangente en ${m('0')} est ${m(droiteTex(b + 1, 1))}.` };
      },
      () => {                                   // k ln x + bx en 1
        const k = aleaParmi([1, 2, 3, 4, -1, -2]), b = aleaParmi([-3, -2, -1, 1, 2, 3]);
        const sl = k + b, fa = b, p = fa - sl;
        return { f: `${coef(k)}\\ln x${b < 0 ? '-' : '+'}${Math.abs(b) === 1 ? '' : Math.abs(b)}x`, domTex: IPOS, a: 1, aTex: '1', bonne: droiteTex(sl, p),
          faux: [droiteTex(sl, fa), droiteTex(b, p), droiteTex(sl, 0), droiteTex(k, p), droiteTex(sl + 1, p)],
          expl: `${m(T`f'(x)=\dfrac{${k}}{x}${sgn(b)}`)} donc ${m(`f'(1)=${sl}`)} et ${m(`f(1)=${b}`)} (car ${m(T`\ln 1=0`)}). La tangente en ${m('1')} est ${m(formeTangente('1', sl, fa))}, soit ${m(droiteTex(sl, p))}.` };
      }
    ],
    2: [
      () => {                                   // (x + c) e^x en 0 ou en 1
        const c = aleaParmi([-3, 1, 2, 3]), a = aleaParmi([0, 1]), f = `(${P([1, 'x'], [c, ''])})e^x`;
        if (a === 0) return { f, domTex: IR, a: 0, aTex: '0', bonne: droiteTex(c + 1, c),
          faux: [droiteTex(c, c + 1), droiteTex(c + 1, 0), droiteTex(c + 2, c), droiteTex(c, c), droiteTex(c + 1, c + 1)],
          expl: `${m(`f'(x)=(${P([1, 'x'], [c + 1, ''])})e^x`)} donc ${m(`f'(0)=${c + 1}`)} et ${m(`f(0)=${c}`)}. La tangente en ${m('0')} est ${m(droiteTex(c + 1, c))}.` };
        return { f, domTex: IR, a: 1, aTex: '1', bonne: droiteE(c + 2, 1, -1, 1),
          faux: [droiteE(c + 2, 1, c + 1, 1), droiteE(c + 1, 1, -1, 1), `y=${eT(c + 2, 1)}\\left(x-1\\right)`, droiteE(c + 2, 1, 1, 1), droiteE(c + 3, 1, -1, 1)],
          expl: `${m(`f'(x)=(${P([1, 'x'], [c + 1, ''])})e^x`)} donc ${m(`f'(1)=${eT(c + 2, 1)}`)} et ${m(`f(1)=${eT(c + 1, 1)}`)}. La tangente en ${m('1')} est ${m(`y=${eT(c + 2, 1)}\\left(x-1\\right)${eT(c + 1, 1).startsWith('-') ? '' : '+'}${eT(c + 1, 1)}`)}, soit ${m(droiteE(c + 2, 1, -1, 1))}.` };
      },
      () => {                                   // x² + bx + k ln(2x - 1) en 1
        const b = aleaParmi([-5, -4, -3, -2, -1, 1, 2, 3]), k = aleaParmi([1, 2, 3, -1, -2]);
        const sl = 2 + b + 2 * k, fa = 1 + b, p = -1 - 2 * k;
        return { f: `${P([1, 'x^2'], [b, 'x'])}${k < 0 ? '-' : '+'}${Math.abs(k) === 1 ? '' : Math.abs(k)}\\ln(2x-1)`, domTex: bornes(T`\dfrac{1}{2}`, INF), a: 1, aTex: '1', bonne: droiteTex(sl, p),
          faux: [droiteTex(sl, fa), droiteTex(2 + b + k, -1 - k), droiteTex(2 + b, p), droiteTex(sl, fa - 2 - b), droiteTex(sl + 2, p)],
          expl: `${m(`f'(x)=2x${sgn(b)}${k < 0 ? '-' : '+'}\\dfrac{${2 * Math.abs(k)}}{2x-1}`)} donc ${m(`f'(1)=${sl}`)} et ${m(`f(1)=${fa}`)} (car ${m(T`\ln 1=0`)}). La tangente est ${m(formeTangente('1', sl, fa))}, soit ${m(droiteTex(sl, p))}.` };
      },
      () => {                                   // c x ln x en e
        const c = aleaParmi([1, 2, 3, -1, -2]);
        return { f: `${coef(c)}x\\ln x`, domTex: IPOS, a: Math.E, aTex: 'e', bonne: droiteE(2 * c, 0, -c, 1),
          faux: [droiteE(2 * c, 0, c, 1), droiteTex(2 * c, 0), droiteE(c, 0, -c, 1), `y=${coef(2 * c)}\\left(x-e\\right)`, droiteE(c + 1, 0, -c, 1)],
          expl: `${m(`f'(x)=${coef(c)}\\ln x+${coef(c)}`.replace('+-', '-').replace('+1', '+1'))} donc ${m(`f'(e)=${2 * c}`)} et ${m(`f(e)=${eT(c, 1)}`)} (car ${m(T`\ln e=1`)}). La tangente en ${m('e')} est ${m(`y=${2 * c}\\left(x-e\\right)${c < 0 ? '' : '+'}${eT(c, 1)}`)}, soit ${m(droiteE(2 * c, 0, -c, 1))}.` };
      },
      () => {                                   // en quel point la tangente est-elle horizontale ?
        const t = aleaParmi(['xe', 'ex', 'xln', 'lnx', 'xex']), k = aleaParmi([2, 3, 4, 5]);
        const D = {
          xe:  { f: `xe^{-${k}x}`, x: rat(1, k), dp: `(1-${k}x)e^{-${k}x}`, dom: IR, faux: [rat(-1, k), String(k), rat(1, k * k), '0', String(-k)] },
          ex:  { f: `e^x-${k}x`, x: lnN(k), dp: `e^x-${k}`, dom: IR, faux: [rat(1, k), String(k), '0', lnN(k + 1), `-${lnN(k)}`] },
          xln: { f: `x\\ln x-${k}x`, x: E(String(k - 1)), dp: `\\ln x+1-${k}`, dom: IPOS, faux: [E(String(k)), String(k - 1), E(String(1 - k)), '1', String(k)] },
          lnx: { f: `\\ln x-${k}x`, x: rat(1, k), dp: `\\dfrac{1}{x}-${k}`, dom: IPOS, faux: [String(k), rat(-1, k), '1', lnN(k), E(String(k))] },
          xex: { f: `xe^{${k}x}`, x: rat(-1, k), dp: `(1+${k}x)e^{${k}x}`, dom: IR, faux: [rat(1, k), String(-k), '0', String(k), rat(-1, k * k)] }
        }[t];
        return { f: D.f, domTex: D.dom, horiz: true, bonne: `x=${D.x}`, faux: D.faux.map(z => `x=${z}`),
          expl: `Une tangente est horizontale lorsque ${m("f'(x)=0")}. Ici ${m(`f'(x)=${D.dp}`)}, qui s'annule en ${m(`x=${D.x}`)}.` };
      }
    ],
    3: [
      () => {                                   // e^x / (x + c) en 0
        const c = alea(2, 5), sg = rat(c - 1, c * c);
        return { f: fr('e^x', `x+${c}`), domTex: bornes(String(-c), INF), a: 0, aTex: '0', bonne: `y=${sg}x+${rat(1, c)}`,
          faux: [`y=${rat(1, c)}x+${rat(c - 1, c * c)}`, `y=${sg}x`, `y=${rat(1, c * c)}x+${rat(1, c)}`, `y=${rat(c + 1, c * c)}x+${rat(1, c)}`, `y=${rat(c - 1, c)}x+${rat(1, c)}`],
          expl: `${m(T`f'(x)=\dfrac{e^x(x+${c})-e^x}{(x+${c})^2}=\dfrac{e^x(x+${c - 1})}{(x+${c})^2}`)} donc ${m(`f'(0)=${sg}`)} et ${m(`f(0)=${rat(1, c)}`)}. La tangente en ${m('0')} est ${m(`y=${sg}x+${rat(1, c)}`)}.` };
      },
      () => {                                   // ln(x² + 1) en 1
        return { f: `\\ln\\left(x^2+1\\right)`, domTex: IR, a: 1, aTex: '1', bonne: 'y=x-1+\\ln 2',
          faux: ['y=x+\\ln 2', 'y=x-1', 'y=2x-2+\\ln 2', 'y=\\ln 2', 'y=x-1+\\ln 3'],
          expl: `${m(T`f'(x)=\dfrac{2x}{x^2+1}`)} donc ${m("f'(1)=1")} et ${m(T`f(1)=\ln 2`)}. La tangente est ${m(T`y=1\times(x-1)+\ln 2`)}, soit ${m('y=x-1+\\ln 2')}.` };
      },
      () => {                                   // e^{kx+b} en 0 ou b x e^{kx} en 0
        const k = aleaParmi([2, 3, -1, -2]), b = aleaParmi([1, 2, -1, -2]);
        if (Math.random() < 0.4) return { f: `${coef(b)}xe^{${k}x}`, domTex: IR, a: 0, aTex: '0', bonne: droiteTex(b, 0),
          faux: [droiteTex(b * k, 0), droiteTex(b, b), droiteTex(0, 0), droiteTex(b + k, 0), droiteTex(-b, 0)],
          expl: `${m(`f'(x)=${coef(b)}(1+${k}x)e^{${k}x}`.replace('+-', '-'))} donc ${m(`f'(0)=${b}`)} et ${m('f(0)=0')}. La tangente à l'origine est ${m(droiteTex(b, 0))}.` };
        return { f: `e^{${P([k, 'x'], [b, ''])}}`, domTex: IR, a: 0, aTex: '0', bonne: droiteE(k, b, 1, b),
          faux: [droiteE(k, 0, 1, b), droiteE(k, b, 0, 0), droiteE(1, b, k, 0), droiteE(k, b, 1, 0), droiteE(k, 0, 1, 0)],
          expl: `${m(`f'(x)=${coef(k)}e^{${P([k, 'x'], [b, ''])}}`)} donc ${m(`f'(0)=${eT(k, b)}`)} et ${m(`f(0)=e^{${b}}`)}. La tangente en ${m('0')} est ${m(droiteE(k, b, 1, b))}.` };
      }
    ]
  };
  function tangente(niveau) {
    const mo = tirerModele(MODELES_TANGENTE, niveau)();
    const fauxL = mo.faux.filter((t, i, a) => a.indexOf(t) === i && t !== mo.bonne).map(texOpt);
    if (mo.horiz) {
      return epure(qcm(`On considère la fonction ${m('f')} définie sur ${m(mo.domTex)} par ${m(`f(x)=${mo.f}`)}. En quel point d'abscisse ${m('x')} la courbe représentative de ${m('f')} admet-elle une tangente horizontale ?`,
        texOpt(mo.bonne), fauxL, { explication: mo.expl, meta: { fTex: mo.f, horiz: true } }));
    }
    return epure(qcm(`On considère la fonction ${m('f')} définie sur ${m(mo.domTex)} par ${m(`f(x)=${mo.f}`)}. Quelle est l'équation réduite de la tangente à la courbe représentative de ${m('f')} au point d'abscisse ${m(mo.aTex)} ?`,
      texOpt(mo.bonne), fauxL, { explication: mo.expl, meta: { fTex: mo.f, a: mo.a } }));
  }

  // ==========================================================================
  // 6. Convexité et points d'inflexion
  // ==========================================================================
  // affirmations sur la convexité : 'cvx', 'ccv', 'cc:a' (concave puis convexe), 'cv:a' (convexe puis concave)
  const optConvexite = (cle, domTex, lo) => {
    if (cle === 'cvx') return opt(`la fonction ${m('f')} est convexe sur ${m(domTex)}`, cle);
    if (cle === 'ccv') return opt(`la fonction ${m('f')} est concave sur ${m(domTex)}`, cle);
    const a = cle.slice(3), g = IV(lo, a, lo !== MINF, true), d = IV(a, INF, true, false);
    return cle.startsWith('cc:') ? opt(`${m('f')} est concave sur ${m(g)} et convexe sur ${m(d)}`, cle) : opt(`${m('f')} est convexe sur ${m(g)} et concave sur ${m(d)}`, cle);
  };
  const MODELES_CONVEXITE = {
    2: [
      () => {                                   // e^x - ax, a e^{-x} + bx : convexe sur R
        const t = aleaParmi(['a', 'b']), a = alea(1, 5), c = aleaParmi([2, 3, 4]);
        return t === 'a' ? { f: `e^x-${a === 1 ? '' : a}x`, domTex: IR, win: [-3, 3], vrai: 'cvx', expl: `${m(`f'(x)=e^x-${a}`)} puis ${m("f''(x)=e^x")}, strictement positif sur ${m(IR)} : ${m('f')} est convexe.` }
          : { f: `${c}e^{-x}+${a}x`, domTex: IR, win: [-3, 3], vrai: 'cvx', expl: `${m(`f'(x)=-${c}e^{-x}+${a}`)} puis ${m(`f''(x)=${c}e^{-x}`)}, strictement positif sur ${m(IR)} : ${m('f')} est convexe.` };
      },
      () => {                                   // x^{2k} ± x
        const k = aleaParmi([2, 3, 5, 50, 500]), neg = Math.random() < 0.3, n = 2 * k;
        return { f: neg ? `-x^{${n}}+x` : `x^{${n}}+x`, domTex: IR, win: [-1.25, 1.25], a: 0, vrai: neg ? 'ccv' : 'cvx',
          expl: `${m(`f''(x)=${neg ? '-' : ''}${n * (n - 1)}x^{${n - 2}}`)} : l'exposant ${m(String(n - 2))} est pair, donc ${m(`x^{${n - 2}}`)} est positif et ${m('f')} est ${neg ? 'concave' : 'convexe'} sur ${m(IR)}.` };
      },
      () => {                                   // ln x - ax (concave), 1/x (convexe), sqrt x (concave), -ln x + ax (convexe)
        const t = aleaParmi(['lna', 'inv', 'rac', 'moinsln']), a = alea(1, 5);
        const D = { lna: { f: `\\ln x-${a === 1 ? '' : a}x`, v: 'ccv', e: `${m(T`f''(x)=-\dfrac{1}{x^2}`)}, strictement négatif sur ${m(IPOS)} : ${m('f')} est concave.` },
          inv: { f: fr('1', 'x'), v: 'cvx', e: `${m(T`f'(x)=-\dfrac{1}{x^2}`)} puis ${m(T`f''(x)=\dfrac{2}{x^3}`)}, strictement positif sur ${m(IPOS)} : ${m('f')} est convexe.` },
          rac: { f: '\\sqrt{x}', v: 'ccv', e: `${m(T`f'(x)=\dfrac{1}{2\sqrt{x}}`)} puis ${m(T`f''(x)=-\dfrac{1}{4x\sqrt{x}}`)}, strictement négatif sur ${m(IPOS)} : ${m('f')} est concave.` },
          moinsln: { f: `-\\ln x+${a === 1 ? '' : a}x`, v: 'cvx', e: `${m(T`f''(x)=\dfrac{1}{x^2}`)}, strictement positif sur ${m(IPOS)} : ${m('f')} est convexe.` } }[t];
        return { f: D.f, domTex: IPOS, win: [0.15, 6], vrai: D.v, lo: '0', expl: D.e };
      }
    ],
    3: [
      () => {                                   // (x - a)^3 + c : concave puis convexe ; -(x-a)^3 + c : convexe puis concave
        const a = alea(-3, 3), c = aleaParmi([-3, -2, -1, 1, 2, 3]), neg = Math.random() < 0.5, g = a === 0 ? 'x' : `(x${sgn(-a)})`;
        return { f: `${neg ? '-' : ''}${g}^3${sgn(c)}`, domTex: IR, win: [-6, 6], vrai: `${neg ? 'cv' : 'cc'}:${a}`, a,
          expl: `${m(`f''(x)=${neg ? '-' : ''}6${g}`)} s'annule en ${m(String(a))} en changeant de signe : ${neg ? 'positive avant, négative après' : 'négative avant, positive après'}. Le point d'abscisse ${m(String(a))} est un point d'inflexion.` };
      },
      () => {                                   // (x + b) e^{-x}  ou (x - a) e^x
        if (Math.random() < 0.5) {
          const b = aleaParmi([-3, -2, -1, 0, 1, 2, 3]), a = 2 - b;
          return { f: b === 0 ? 'xe^{-x}' : `(${P([1, 'x'], [b, ''])})e^{-x}`, domTex: IR, win: [-5, 7], vrai: `cc:${a}`, a,
            expl: `${m(`f'(x)=(${P([-1, 'x'], [1 - b, ''])})e^{-x}`)} puis ${m(`f''(x)=(${P([1, 'x'], [b - 2, ''])})e^{-x}`)}, qui change de signe en ${m(String(a))} : négative avant, positive après.` };
        }
        const c = aleaParmi([-3, -2, -1, 1, 2, 3]), a = c - 2;
        return { f: `(${P([1, 'x'], [-c, ''])})e^x`, domTex: IR, win: [-7, 5], vrai: `cc:${a}`, a,
          expl: `${m(`f'(x)=(${P([1, 'x'], [1 - c, ''])})e^x`)} puis ${m(`f''(x)=(${P([1, 'x'], [2 - c, ''])})e^x`)}, qui change de signe en ${m(String(a))} : négative avant, positive après.` };
      }
    ]
  };
  function convexiteClaim(niveau) {
    const mo = aleaParmi(MODELES_CONVEXITE[niveau])();
    const lo = mo.lo === '0' ? '0' : MINF, a = mo.a !== undefined ? mo.a : 1;
    const tous = mo.lo === '0' ? ['cvx', 'ccv', 'cc:1', 'cv:1', 'cc:2', 'cv:2'] : ['cvx', 'ccv', `cc:${a}`, `cv:${a}`, `cc:${a + 1}`, `cv:${a - 1}`];
    const faux = tous.filter(c => c !== mo.vrai);
    const choix = niveau === 3 ? melanger(faux.filter(c => c.indexOf(':') < 0 || c.slice(3) === String(a) || Math.random() < 0.5)) : melanger(faux);
    if (choix.length < 3) return null;
    return epure(qcm(`On considère la fonction ${m('f')} définie sur ${m(mo.domTex)} par ${m(`f(x)=${mo.f}`)}. Quelle affirmation est vraie ?`,
      optConvexite(mo.vrai, mo.domTex, lo), choix.slice(0, 3).map(c => optConvexite(c, mo.domTex, lo)), { explication: mo.expl, meta: { fTex: mo.f, win: mo.win, lo: mo.lo === '0' ? 0 : null } }));
  }
  function convexiteIntervalle() {                 // ln(x² + bx + c) : convexe entre les racines de f''
    const combos = [[0, 1], [0, 4], [0, 9], [2, 2], [2, 5], [2, 10], [4, 5], [4, 8], [-2, 2], [-2, 5], [-4, 5], [-4, 8]];
    const [b, c] = aleaParmi(combos), s = Math.sqrt(4 * c - b * b), r1 = (-b - s) / 2, r2 = (-b + s) / 2, g = P([1, 'x^2'], [b, 'x'], [c, '']);
    const f = ln(g);
    return epure(qcm(`On considère la fonction ${m('f')} définie sur ${m(IR)} par ${m(`f(x)=${f}`)}. Sur lequel de ces intervalles la fonction ${m('f')} est-elle convexe ?`,
      texOpt(IV(String(r1), String(r2), true, true)),
      [IV(MINF, String(r1), false, true), IV(String(r2), INF, true, false), IV(MINF, INF, false, false), IV(String(r1 - 1), String(r2 + 1), true, true), IV(String(r1), INF, true, false)].map(texOpt),
      { explication: `${m(`f'(x)=${fr(P([2, 'x'], [b, '']), g)}`)} puis ${m(`f''(x)=${fr(P([-2, 'x^2'], [-2 * b, 'x'], [2 * c - b * b, '']), `\\left(${g}\\right)^2`)}`)}. Le numérateur est un trinôme de racines ${m(String(r1))} et ${m(String(r2))}, positif entre elles (coefficient de ${m('x^2')} négatif) : ${m('f')} est convexe sur ${m(IV(String(r1), String(r2), true, true))}.`,
        meta: { fTex: f, cvxSet: true } }));
  }
  function pointsInflexion() {
    const nf = aleaParmi([2, 3]), racines = melanger([-3, -2, -1, 0, 1, 2, 3]).slice(0, nf), mult = racines.map(() => aleaParmi([1, 1, 2, 3]));
    const facteur = (r, k) => `${r === 0 ? 'x' : `(x${sgn(-r)})`}${k === 1 ? '' : `^{${k}}`}`, signeE = aleaParmi(['e^x', 'e^{-x}']);
    const f2 = racines.map((r, i) => facteur(r, mult[i])).join('') + signeE;
    const nb = mult.filter(k => k % 2 === 1).length;
    return epure(qcm(`La fonction ${m('f')} est deux fois dérivable sur ${m(IR)} et sa dérivée seconde est définie par ${m(`f''(x)=${f2}`)}. Combien de points d'inflexion la courbe représentative de ${m('f')} admet-elle ?`,
      opt(m(String(nb)), 'num:' + nb), [0, 1, 2, 3].filter(k => k !== nb).map(k => opt(m(String(k)), 'num:' + k)),
      { explication: `Un point d'inflexion correspond à une valeur où ${m("f''")} s'annule en changeant de signe. Ici, ${m("f''")} s'annule en ${racines.map((r, i) => `${m(String(r))} (facteur à l'exposant ${mult[i]}, ${mult[i] % 2 ? 'signe changé' : 'signe inchangé'})`).join(', ')} ; ${m(signeE)} est strictement positif. Il y a donc ${nb} point${nb > 1 ? 's' : ''} d'inflexion.`,
        meta: { fTex: f2, inflexion: nb } }));
  }
  const convexite = n => (n === 2 ? convexiteClaim(2) : aleaParmi([convexiteClaim, convexiteIntervalle, pointsInflexion, convexiteClaim])(n));

  // ==========================================================================
  // 7. Calcul : logarithmes, exponentielles, inégalités
  // ==========================================================================
  // un modèle renvoie { enonce, bonne, faux: [[tex, valeur]...], v (valeur de l'expression), f (LaTeX évalué), expl }
  const LNP = (K, p) => (K === 1 ? lnN(p) : K === -1 ? `-${lnN(p)}` : `${K}${lnN(p)}`);
  const MODELES_CALCUL = {
    1: [
      () => {                                   // somme de logarithmes de puissances
        const p = aleaParmi([2, 3, 5]), nt = aleaParmi([2, 3]), ex = Array.from({ length: nt }, () => alea(1, p === 5 ? 3 : 4)), sg = ex.map((_, i) => (i === 0 ? 1 : aleaParmi([1, -1])));
        const K = ex.reduce((a, e, i) => a + sg[i] * e, 0);
        if (K === 0) return null;
        const f = ex.map((e, i) => (i === 0 ? '' : sg[i] < 0 ? '-' : '+') + lnN(Math.pow(p, e))).join('');
        const somme = ex.reduce((a, e, i) => a + sg[i] * Math.pow(p, e), 0);
        const toutPlus = ex.reduce((a, e) => a + e, 0);
        return { enonce: `Exprimer ${m(f)} en fonction de ${m(lnN(p))}.`, bonne: LNP(K, p), v: K * Math.log(p), f,
          faux: [[LNP(K + 1, p), (K + 1) * Math.log(p)], [LNP(K - 1, p), (K - 1) * Math.log(p)], [LNP(toutPlus, p), toutPlus * Math.log(p)], [LNP(-K, p), -K * Math.log(p)], [somme > 0 ? lnN(somme) : LNP(K + 2, p), somme > 0 ? Math.log(somme) : (K + 2) * Math.log(p)]],
          expl: `Chaque terme s'écrit comme un multiple de ${m(lnN(p))} : ${m(`\\ln\\left(${p}^{k}\\right)=k\\ln ${p}`)}. On obtient ${m(f)} ${m('=\\left(' + ex.map((e, i) => (i === 0 ? '' : sg[i] < 0 ? '-' : '+') + e).join('') + '\\right)\\ln ' + p)}, c'est-à-dire ${m(LNP(K, p))}.` };
      },
      () => {                                   // produits et quotients d'exponentielles
        const a = alea(2, 5), b = alea(1, 4), c = alea(1, 4);
        if (a + b - c === 0) return null;
        const f = `${fr(`e^{${a}x}\\times e^{${b}x}`, `e^{${c}x}`)}`, K = a + b - c, ex = k => (k === 1 ? 'e^x' : k === -1 ? 'e^{-x}' : `e^{${k}x}`);
        return { enonce: `Pour tout réel ${m('x')}, ${m(f)} est égal à :`, bonne: ex(K), v: NaN, f,
          faux: [[ex(a + b + c), 0], [ex(a * b - c), 0], [ex(K + 1), 0], [ex(a + b), 0], [ex(-K), 0]].map(([t, v]) => [t, 1]),
          expl: `On utilise ${m(T`e^{u}\times e^{v}=e^{u+v}`)} et ${m(T`\dfrac{e^{u}}{e^{v}}=e^{u-v}`)} : l'exposant est ${m(`${a}x+${b}x-${c}x=${K}x`)}.` };
      }
    ],
    2: [
      () => {                                   // ln 9 + ln(√3/3) + ln(1/9)
        const p = aleaParmi([2, 3, 5]), a = alea(1, p === 5 ? 2 : 3), b = alea(1, 2), c = alea(1, 2);
        const n = 2 * a + 1 - 2 * b - 2 * c, f = `${lnN(Math.pow(p, a))}+\\ln\\left(\\dfrac{\\sqrt{${p}}}{${Math.pow(p, b)}}\\right)+\\ln\\left(\\dfrac{1}{${Math.pow(p, c)}}\\right)`;
        const val = k => `${k < 0 ? '-' : ''}\\dfrac{${Math.abs(k)}}{2}${lnN(p)}`, vv = k => (k / 2) * Math.log(p);
        return { enonce: `Exprimer ${m(f)} en fonction de ${m(lnN(p))}.`, bonne: val(n), v: vv(n), f,
          faux: [[val(n + 2), vv(n + 2)], [val(n - 2), vv(n - 2)], [val(-n), vv(-n)], [LNP(Math.round(n / 2) || 3, p), (Math.round(n / 2) || 3) * Math.log(p)], [val(n + 4), vv(n + 4)]],
          expl: `${m(`\\ln ${Math.pow(p, a)}=${LNP(a, p)}`)} ; ${m(T`\ln\left(\dfrac{\sqrt{${p}}}{${Math.pow(p, b)}}\right)=\dfrac{1}{2}\ln ${p}-${LNP(b, p)}`)} ; ${m(T`\ln\left(\dfrac{1}{${Math.pow(p, c)}}\right)=-${LNP(c, p)}`)}. Au total : ${m(T`\left(${a}+\dfrac{1}{2}-${b}-${c}\right)\ln ${p}=${val(n)}`)}.` };
      },
      () => {                                   // e^{a ln p + b}
        const p = aleaParmi([2, 3, 5]), a = alea(2, 3), b = aleaParmi([1, 2, 3, -1]), q = Math.pow(p, a);
        const eb = b === 1 ? 'e' : `e^{${b}}`, rep = (num, bb) => `${num === 1 ? '' : num}${bb === 1 ? 'e' : `e^{${bb}}`}`;
        const f = `e^{${a}\\ln ${p}${sgn(b)}}`;
        return { enonce: `L'expression ${m(f)} est égale à :`, bonne: rep(q, b), v: q * Math.exp(b), f,
          faux: [[rep(a * p, b), a * p * Math.exp(b)], [`${q}+${eb}`, q + Math.exp(b)], [`e^{${a * p * 1}${sgn(b)}}`, Math.exp(a * p + b)], [rep(p, a * b), p * Math.exp(a * b)], [rep(q, b + 1), q * Math.exp(b + 1)]],
          expl: `${m(T`e^{u+v}=e^{u}e^{v}`)} et ${m(T`e^{${a}\ln ${p}}=\left(e^{\ln ${p}}\right)^{${a}}=${p}^{${a}}=${q}`)}. Donc ${m(f)} ${m('=' + rep(q, b))}.` };
      },
      () => {                                   // (e^x - a e^{-x}) / (e^x + a e^{-x})
        const a = alea(2, 5), f = fr(`e^{x}-${a}e^{-x}`, `e^{x}+${a}e^{-x}`);
        return { enonce: `Pour tout réel ${m('x')}, ${m(f)} est égal à :`, bonne: fr(`e^{2x}-${a}`, `e^{2x}+${a}`), v: NaN, f,
          faux: [[fr(`e^{2x}+${a}`, `e^{2x}-${a}`), 1], [fr(`e^{x}-${a}`, `e^{x}+${a}`), 1], [fr(`e^{2x}-${a}`, `e^{2x}-${a}e^{-x}`), 1], [fr(`1-${a}e^{-2x}`, `1+${a}`), 1], [`1-${fr(String(a), 'e^{2x}')}`, 1]],
          expl: `On multiplie le numérateur et le dénominateur par ${m('e^{x}')} : ${m(T`\dfrac{e^{2x}-${a}}{e^{2x}+${a}}`)}.` };
      }
    ],
    3: [
      () => {                                   // a + (b e^{-x} - c)/(e^{-x} + 1)
        let a, b, c; do { a = aleaParmi([1, 2, 3, 4]); b = aleaParmi([2, 3, 4, 5, -2, -3]); c = aleaParmi([1, 2, 3, 4, 5, -1, -3]); } while (a + b === 0 || a - c === 0);
        const un = k => P([k, 'e^{-x}']), f = `${a}+${fr(`${b < 0 ? '-' : ''}${Math.abs(b) === 1 ? '' : Math.abs(b)}e^{-x}-${c < 0 ? '(' + c + ')' : c}`.replace(/-\((-?\d+)\)/, (z, k) => sgn(-Number(k))), 'e^{-x}+1')}`;
        const num = P([a + b, 'e^{-x}'], [a - c, '']);
        return { enonce: `Pour tout réel ${m('x')}, ${m(f)} est égal à :`, bonne: fr(num, 'e^{-x}+1'), v: NaN, f,
          faux: [[fr(P([b, 'e^{-x}'], [a - c, '']), 'e^{-x}+1'), 1], [fr(P([a + b, 'e^{-x}'], [-c, '']), 'e^{-x}+1'), 1], [P([a + b, 'e^{-x}'], [a - c, '']), 1], [fr(P([a + b, 'e^{-x}'], [a + c, '']), 'e^{-x}+1'), 1], [fr(P([a - b, 'e^{-x}'], [a - c, '']), 'e^{-x}+1'), 1]],
          expl: `On met au même dénominateur : ${m(T`${a}+\dfrac{N}{e^{-x}+1}=\dfrac{${a}(e^{-x}+1)+N}{e^{-x}+1}`)} avec ${m(`N=${P([b, 'e^{-x}'], [-c, ''])}`)}, soit ${m(fr(num, 'e^{-x}+1'))}.` };
      },
      () => {                                   // ln(e^x + e^{-x})
        return { enonce: `Pour tout réel ${m('x')}, ${m(T`\ln\left(e^{x}+e^{-x}\right)`)} est égal à :`, bonne: T`x+\ln\left(1+e^{-2x}\right)`, v: NaN, f: T`\ln\left(e^{x}+e^{-x}\right)`,
          faux: [[T`x+\ln\left(1+e^{-x}\right)`, 1], [T`2x`, 1], [T`x+\ln\left(1+e^{2x}\right)`, 1], [T`\ln\left(e^{x}\right)+\ln\left(e^{-x}\right)`, 1], [T`-x+\ln\left(1+e^{-2x}\right)`, 1]],
          expl: `On factorise par ${m('e^{x}')} : ${m(T`e^{x}+e^{-x}=e^{x}\left(1+e^{-2x}\right)`)}, puis ${m(T`\ln\left(e^{x}\left(1+e^{-2x}\right)\right)=x+\ln\left(1+e^{-2x}\right)`)}. On ne peut pas séparer le logarithme d'une somme.` };
      }
    ]
  };
  const INEG = [
    { vraie: 'e^x\\ge x+1', dom: 'R', faux: ['e^x\\le x+1', 'e^x\\gt x+1', 'e^x\\ge 2x+1', 'e^x\\ge x+2'] },
    { vraie: 'e^{-x}\\ge 1-x', dom: 'R', faux: ['e^{-x}\\le 1-x', 'e^{-x}\\gt 1-x', 'e^{-x}\\ge 1+x', 'e^{-x}\\ge 2-x'] },
    { vraie: '\\ln x\\le x-1', dom: 'pos', faux: ['\\ln x\\ge x-1', '\\ln x\\lt x-1', '\\ln x\\le x-2', '\\ln x\\le 2x-1'] },
    { vraie: '1+e^{2x}\\ge 2e^x', dom: 'R', faux: ['1+e^{2x}\\le 2e^x', '1+e^{2x}\\gt 2e^x', '1+e^{2x}\\ge 3e^x', '1+e^{2x}\\ge e^x+2'] },
    { vraie: 'e^x+e^{-x}\\ge 2', dom: 'R', faux: ['e^x+e^{-x}\\le 2', 'e^x+e^{-x}\\gt 2', 'e^x+e^{-x}\\ge 3', 'e^x+e^{-x}\\ge x+2'] },
    { vraie: 'x^2+1\\ge 2x', dom: 'R', faux: ['x^2+1\\le 2x', 'x^2+1\\gt 2x', 'x^2+1\\ge 3x', 'x^2+1\\ge x+2'] },
    { vraie: 'e^{2x}+4\\ge 4e^x', dom: 'R', faux: ['e^{2x}+4\\le 4e^x', 'e^{2x}+4\\gt 4e^x', 'e^{2x}+4\\ge 5e^x', 'e^{2x}+4\\ge 2e^x+2'] },
    { vraie: '\\ln(1+x)\\le x', dom: 'gt-1', faux: ['\\ln(1+x)\\ge x', '\\ln(1+x)\\lt x', '\\ln(1+x)\\le x-1', '\\ln(1+x)\\le \\dfrac{x}{2}'] }
  ];
  function inegalite() {
    const I = aleaParmi(INEG), lieu = { R: `pour tout réel ${m('x')}`, pos: `pour tout réel ${m('x')} strictement positif`, 'gt-1': `pour tout réel ${m('x')} strictement supérieur à ${m('-1')}` }[I.dom];
    return epure(qcm(`Laquelle de ces inégalités est vraie ${lieu} ?`, texOpt(I.vraie), I.faux.map(texOpt),
      { explication: `On étudie le signe de la différence des deux membres : elle est positive ou égale à 0, et s'annule en un seul point (c'est le cas d'égalité). L'inégalité ${m(I.vraie)} est donc vraie, mais pas la version stricte ni la version inversée.`, meta: { ineg: true, dom: I.dom } }));
  }
  function calcul(niveau) {
    if (niveau === 3 && Math.random() < 0.4) return inegalite();
    let mo = null, essais = 0;
    while (!mo && essais++ < 20) mo = tirerModele(MODELES_CALCUL, niveau)();
    if (!mo) return null;
    const dis = mo.faux.filter(([t, v], i, a) => t !== mo.bonne && a.findIndex(z => z[0] === t) === i && !(Number.isFinite(mo.v) && Number.isFinite(v) && Math.abs(v - mo.v) < 1e-9)).map(([t]) => t);
    return epure(qcm(mo.enonce, texOpt(mo.bonne), dis.map(texOpt), { explication: mo.expl, meta: { fTex: mo.f, calcul: true } }));
  }

  // ==========================================================================
  // 8. Équations différentielles y' = ay + b
  // ==========================================================================
  const yEq = (a, b) => `y'=${a.n === 1 && a.d === 1 ? '' : a.n === -1 && a.d === 1 ? '-' : a.d === 1 ? a.n : coefFr(a.n, a.d)}y${b < 0 ? '-' : '+'}${Math.abs(b)}`;
  const eAx = a => `e^{${a.d === 1 ? coef(a.n) : coefFr(a.n, a.d)}x}`;
  const frac = (n, d) => { const g = pgcd(n, d); if (d < 0) { n = -n; d = -d; } return { n: n / g, d: d / g, v: n / d }; };
  let equaDiff = function (niveau) {
    const a = aleaParmi(niveau === 1 ? [frac(2, 1), frac(3, 1), frac(4, 1), frac(-1, 1), frac(-2, 1), frac(-3, 1), frac(1, 2), frac(-1, 2), frac(5, 1)] : [frac(2, 1), frac(3, 1), frac(4, 1), frac(-1, 1), frac(-2, 1), frac(-3, 1), frac(1, 2), frac(-1, 2), frac(5, 1)]);
    const b = aleaParmi([-6, -4, -3, -2, -1, 1, 2, 3, 4, 6, 8]), ex = eAx(a), av = a.v;
    const lead = niveau === 1 ? 'a' : aleaParmi(niveau === 2 ? ['gen', 'gen', 'cond', 'const'] : ['gen3', 'cond3', 'cond1']);
    const csteTex = rat(-b * a.d, a.n);                // -b/a
    if (niveau === 1 && Math.random() < 0.4) {                 // y' = ay, y(0) = y0
      const y0 = aleaParmi([-3, -2, -1, 2, 3, 4, 5]), ee = eAx(a), eqa = `y'=${a.d === 1 ? coef(a.n) : coefFr(a.n, a.d)}y`.replace("y'=1y", "y'=y");
      return epure(qcm(`On considère l'équation différentielle ${m(eqa)}. Quelle est la solution ${m('y')} qui vérifie ${m(`y(0)=${y0}`)} ?`,
        texOpt(`y(x)=${coef(y0)}${ee}`), [`${coef(y0)}${eAx({ n: -a.n, d: a.d })}`, `${y0}+${ee}`.replace('+-', '-'), `${coef(y0 * a.n)}${eAx({ n: 1, d: 1 })}`.replace('e^{x}', 'e^{x}'), `${ee}${y0 < 0 ? '' : '+'}${y0}`, `${coef(a.n * y0)}${ee}`].map(t => texOpt(`y(x)=${t}`)),
        { explication: `Les solutions sont ${m(`y(x)=Ce^{${a.d === 1 ? coef(a.n) : coefFr(a.n, a.d)}x}`)}. La condition ${m(`y(0)=${y0}`)} donne ${m(`C=${y0}`)}.`, meta: { ode: true, a: a.v, b: 0, mode: 'cond', cond: { x0: 0, y0 } } }));
    }
    if (niveau === 1) {
      const eq = `y'=${a.d === 1 ? coef(a.n) : coefFr(a.n, a.d)}y`.replace("y'=1y", "y'=y");
      const cx = x => `Ce^{${x}x}`;
      return epure(qcm(`Quelles sont les solutions sur ${m(IR)} de l'équation différentielle ${m(eq)} ? (${m('C')} désigne un réel quelconque)`,
        texOpt(`y(x)=Ce^{${a.d === 1 ? coef(a.n) : coefFr(a.n, a.d)}x}`),
        [`y(x)=Ce^{${a.d === 1 ? coef(-a.n) : coefFr(-a.n, a.d)}x}`, `y(x)=Ce^{${coefFr(a.d, a.n)}x}`, `y(x)=${a.d === 1 ? coef(a.n) : coefFr(a.n, a.d)}Ce^{x}`, `y(x)=C${a.d === 1 ? coef(a.n) : coefFr(a.n, a.d)}x`.replace('Cx', 'Cx'), `y(x)=Ce^{x}`].map(texOpt),
        { explication: `Les solutions de ${m("y'=ay")} sont les fonctions ${m('x\\mapsto Ce^{ax}')} avec ${m('C')} réel : ici ${m(`a=${rat(a.n, a.d)}`)}.`, meta: { ode: true, a: a.v, b: 0, mode: 'gen' } }));
    }
    const eq = yEq(a, b);
    const gen = `Ce^{${a.d === 1 ? coef(a.n) : coefFr(a.n, a.d)}x}`;
    if (lead === 'gen') {
      return epure(qcm(`Quelles sont les solutions sur ${m(IR)} de l'équation différentielle ${m(eq)} ? (${m('C')} désigne un réel quelconque)`,
        texOpt(`y(x)=${J(gen, csteTex)}`),
        [J(gen, rat(b * a.d, a.n)), J(gen, String(-b)), J(gen, String(b)), gen, J(gen, rat(-a.n, b * a.d || 1))].map(t => texOpt(`y(x)=${t}`)),
        { explication: `On cherche d'abord une solution constante : ${m(`0=${coefFr(a.n, a.d)}k${sgn(b)}`.replace('=1k', '=k'))} donne ${m(`k=${csteTex}`)}. Les solutions sont alors ${m(`y(x)=${J(gen, csteTex)}`)}, ${m('C')} réel quelconque.`, meta: { ode: true, a: a.v, b, mode: 'gen' } }));
    }
    if (lead === 'const') {
      return epure(qcm(`Quelle est l'unique solution constante de l'équation différentielle ${m(eq)} sur ${m(IR)} ?`,
        texOpt(`y(x)=${csteTex}`), [rat(b * a.d, a.n), String(-b), String(b), rat(a.n, -b * a.d || 1)].map(t => texOpt(`y(x)=${t}`)),
        { explication: `Une fonction constante ${m('y=k')} vérifie ${m("y'=0")} : il faut ${m(`0=${coefFr(a.n, a.d)}k${sgn(b)}`.replace('=1k', '=k'))}, soit ${m(`k=${csteTex}`)}.`, meta: { ode: true, a: a.v, b, mode: 'const' } }));
    }
    if (lead === 'gen3') {
      const k = aleaParmi([2, 3, 4, 5]), c = aleaParmi([2, 3, 4, 6, 8, -2, -4]), K = frac(c, k);
      const eq3 = `y'+${k}y=${c}`, g3 = `Ce^{-${k}x}`;
      return epure(qcm(`Quelles sont les solutions sur ${m(IR)} de l'équation différentielle ${m(eq3)} ? (${m('C')} désigne un réel quelconque)`,
        texOpt(`y(x)=${J(g3, rat(c, k))}`), [J(`Ce^{${k}x}`, rat(c, k)), J(g3, rat(-c, k)), J(g3, String(c)), J(`Ce^{${k}x}`, rat(-c, k)), J(g3, rat(k, c))].map(t => texOpt(`y(x)=${t}`)),
        { explication: `On écrit ${m(`y'=-${k}y${c < 0 ? '-' : '+'}${Math.abs(c)}`)} : ${m(`a=-${k}`)}, ${m(`b=${c}`)}. La solution constante est ${m(`-\\dfrac{b}{a}=${rat(c, k)}`)} et les solutions sont ${m(`y(x)=${J(g3, rat(c, k))}`)}.`, meta: { ode: true, a: -k, b: c, mode: 'gen' } }));
    }
    // avec condition initiale
    const x0 = lead === 'cond1' ? 1 : 0, y0 = aleaParmi([-3, -2, -1, 1, 2, 3, 4]);
    const cA = frac(a.n * y0 + b * a.d, a.n);            // y0 + b/a = (a y0 + b)/a
    if (cA.n === 0 || (cA.d === 1 && cA.n === y0)) return null;
    const ex0 = x0 === 0 ? ex : `e^{${a.d === 1 ? coef(a.n) : coefFr(a.n, a.d)}\\left(x-1\\right)}`;
    const fx = (cc, e, k) => J(`${cc.d === 1 ? coef(cc.n) : coefFr(cc.n, cc.d)}${e}`, k);
    const bonne = fx(cA, ex0, csteTex), exFaux = x0 === 0 ? ex : ex;
    const autre = x0 === 0 ? [fx(frac(a.n * y0 - b * a.d, a.n), ex0, rat(b * a.d, a.n)), fx(frac(y0, 1), ex0, csteTex), fx(frac(y0 + b, 1), ex0, csteTex), fx(frac(a.n * y0 + b * a.d, a.n), ex0, rat(b * a.d, a.n))]
      : [fx(cA, ex, csteTex), fx(frac(y0, 1), ex0, csteTex), fx(cA, `e^{${a.d === 1 ? coef(a.n) : coefFr(a.n, a.d)}\\left(x+1\\right)}`, csteTex), fx(frac(a.n * y0 - b * a.d, a.n), ex0, rat(b * a.d, a.n))];
    return epure(qcm(`On considère l'équation différentielle ${m(eq)}. Quelle est la solution ${m('y')} qui vérifie ${m(`y(${x0})=${y0}`)} ?`,
      texOpt(`y(x)=${bonne}`), autre.map(t => texOpt(`y(x)=${t}`)),
      { explication: `Les solutions sont ${m(`y(x)=${J(`Ce^{${a.d === 1 ? coef(a.n) : coefFr(a.n, a.d)}x}`, csteTex)}`)}. ${x0 === 0 ? `La condition ${m(`y(0)=${y0}`)} donne ${m(`C${csteTex.startsWith('-') ? '' : '+'}${csteTex}=${y0}`)}, donc ${m(`C=${rat(cA.n, cA.d)}`)}.` : `On écrit la solution sous la forme ${m('y(x)=Ke^{a(x-1)}+k')} : ${m(`y(1)=K+k=${y0}`)} avec ${m(`k=${csteTex}`)}, donc ${m(`K=${rat(cA.n, cA.d)}`)}.`}`,
        meta: { ode: true, a: a.v, b, mode: 'cond', cond: { x0, y0 } } }));
  }

  // ==========================================================================
  // 9. Compléments : modèles supplémentaires (variété des séries)
  // ==========================================================================
  MODELES_DERIVEE[2].push(
    () => {                                     // (ax+b) ln x
      const a = aleaParmi([1, 2, 3, 4]), b = aleaParmi([1, 2, 3, -1, -2]), g = P([a, 'x'], [b, '']);
      return { f: `(${g})\\ln x`, d: `${coef(a)}\\ln x+${fr(g, 'x')}`, domTex: IPOS, dom: [0.3, 4],
        faux: [`${coef(a)}\\ln x`, fr(String(a), 'x'), `${coef(a)}\\ln x+${fr(String(a), 'x')}`, fr(g, 'x')],
        expl: `Produit ${m('uv')} avec ${m(`u=${g}`)} et ${m(T`v=\ln x`)} : ${m(T`(uv)'=${coef(a)}\ln x+(${g})\times\dfrac{1}{x}`)}.` };
    },
    () => {                                     // a ln x / x
      const a = aleaParmi([1, 2, 3, 5]);
      return { f: fr(`${coef(a)}\\ln x`, 'x'), d: fr(`${a}\\left(1-\\ln x\\right)`.replace('1\\left', '\\left'), 'x^2'), domTex: IPOS, dom: [0.3, 4],
        faux: [fr(String(a), 'x^2'), fr(`${a}\\left(\\ln x-1\\right)`.replace('1\\left', '\\left'), 'x^2'), fr(`${a}\\left(1-\\ln x\\right)`.replace('1\\left', '\\left'), 'x'), fr(String(a), 'x')],
        expl: `Quotient ${m(T`\dfrac{u}{v}`)} avec ${m(T`u=${coef(a)}\ln x`)} et ${m('v=x')} : ${m(T`\dfrac{u'v-uv'}{v^2}=\dfrac{\frac{${a}}{x}\times x-${coef(a)}\ln x}{x^2}=\dfrac{${a}\left(1-\ln x\right)}{x^2}`.replace('{1\\left', '{\\left'))}.` };
    },
    () => {                                     // (ax+b)^n
      const n = aleaParmi([3, 4, 5]), a = aleaParmi([2, 3, -1, -2]), b = aleaParmi([1, 2, 3, -1, -2]), g = P([a, 'x'], [b, '']), pw = k => (k === 1 ? `(${g})` : `(${g})^{${k}}`);
      return { f: pw(n), d: `${coef(n * a)}${pw(n - 1)}`, domTex: IR, dom: [-2, 2],
        faux: [`${coef(n)}${pw(n - 1)}`, `${coef(a)}${pw(n - 1)}`, `${coef(n * a)}${pw(n)}`, pw(n - 1), `${coef(n * a)}${pw(n + 1)}`],
        expl: `Pour ${m('u^n')}, la dérivée est ${m("nu'u^{n-1}")} avec ${m(`u=${g}`)}, ${m(`u'=${a}`)} et ${m(`n=${n}`)}.` };
    },
    () => {                                     // sqrt(ax+b)
      const a = aleaParmi([2, 3, 4, 5]), b = aleaParmi([1, 2, 3]), g = P([a, 'x'], [b, '']), x0 = -b / a;
      return { f: `\\sqrt{${g}}`, d: fr(String(a), `2\\sqrt{${g}}`), domTex: bornes(rat(-b, a), INF), dom: [x0 + 0.2, x0 + 4],
        faux: [fr('1', `2\\sqrt{${g}}`), fr(String(a), `\\sqrt{${g}}`), fr(String(a), `2\\left(${g}\\right)`), `${2 * a}\\sqrt{${g}}`],
        expl: `${m(T`(\sqrt{u})'=\dfrac{u'}{2\sqrt{u}}`)} avec ${m(`u=${g}`)} et ${m(`u'=${a}`)}.` };
    },
    () => {                                     // e^{ax²+bx}
      const a = aleaParmi([1, 2, -1, -2]), b = aleaParmi([-3, -2, -1, 1, 2, 3]), g = P([a, 'x^2'], [b, 'x']);
      return { f: E(g), d: `(${P([2 * a, 'x'], [b, ''])})${E(g)}`, domTex: IR, dom: [-1.5, 1.5],
        faux: [E(g), `(${P([a, 'x'], [b, ''])})${E(g)}`, `(${P([2 * a, 'x'], [b, ''])})${E(P([2 * a, 'x'], [b, '']))}`, `${coef(2 * a)}x${E(g)}`],
        expl: `${m(T`(e^{u})'=u'e^{u}`)} avec ${m(`u=${g}`)} et ${m(`u'=${P([2 * a, 'x'], [b, ''])}`)}.` };
    },
    () => {                                     // 1/(x² + c)
      const c = alea(1, 6), a = aleaParmi([1, 2, 3]);
      return { f: fr(String(a), `x^2+${c}`), d: fr(`${-2 * a}x`, `\\left(x^2+${c}\\right)^2`), domTex: IR, dom: [-2.5, 2.5],
        faux: [fr(`${-a}`, `\\left(x^2+${c}\\right)^2`), fr(`${2 * a}x`, `\\left(x^2+${c}\\right)^2`), fr(`${-2 * a}x`, `x^2+${c}`), fr(String(a), `2x`)],
        expl: `${m(T`\left(\dfrac{1}{v}\right)'=-\dfrac{v'}{v^2}`)} avec ${m(`v=x^2+${c}`)}, ${m("v'=2x")}${a === 1 ? '' : `, puis on multiplie par ${m(String(a))}`}.` };
    }
  );
  MODELES_DERIVEE[3].push(
    () => {                                     // (e^x - a)/(e^x + a)
      const a = alea(2, 5), g = `e^x+${a}`;
      return { f: fr(`e^x-${a}`, g), d: fr(`${2 * a}e^x`, `\\left(${g}\\right)^2`), domTex: IR, dom: [-2, 2],
        faux: [fr('2e^x', `\\left(${g}\\right)^2`), fr(`${a}e^x`, `\\left(${g}\\right)^2`), fr('e^x', `\\left(${g}\\right)^2`), fr(`${2 * a}e^x`, g)],
        expl: `${m(T`\dfrac{u'v-uv'}{v^2}=\dfrac{e^x(${g})-(e^x-${a})e^x}{\left(${g}\right)^2}=\dfrac{${2 * a}e^x}{\left(${g}\right)^2}`)}.` };
    },
    () => {                                     // e^{sqrt x}
      return { f: 'e^{\\sqrt{x}}', d: fr('e^{\\sqrt{x}}', '2\\sqrt{x}'), domTex: IPOS, dom: [0.3, 4],
        faux: [fr('e^{\\sqrt{x}}', '\\sqrt{x}'), 'e^{\\sqrt{x}}', fr('1', '2\\sqrt{x}'), fr('e^{\\sqrt{x}}', '2x')],
        expl: `${m(T`(e^{u})'=u'e^{u}`)} avec ${m(T`u=\sqrt{x}`)} et ${m(T`u'=\dfrac{1}{2\sqrt{x}}`)}.` };
    },
    () => {                                     // e^x / (x² + c)
      const c = alea(1, 6), g = `x^2+${c}`;
      return { f: fr('e^x', g), d: fr(`e^x\\left(${P([1, 'x^2'], [-2, 'x'], [c, ''])}\\right)`, `\\left(${g}\\right)^2`), domTex: IR, dom: [-2.5, 2.5],
        faux: [fr(`e^x\\left(${P([1, 'x^2'], [2, 'x'], [c, ''])}\\right)`, `\\left(${g}\\right)^2`), fr('e^x', `\\left(${g}\\right)^2`), fr('e^x', '2x'), fr(`e^x\\left(${P([1, 'x^2'], [-2, 'x'])}\\right)`, `\\left(${g}\\right)^2`)],
        expl: `${m(T`\dfrac{u'v-uv'}{v^2}=\dfrac{e^x(${g})-e^x\times 2x}{\left(${g}\right)^2}`)}, soit ${m(fr(`e^x\\left(${P([1, 'x^2'], [-2, 'x'], [c, ''])}\\right)`, `\\left(${g}\\right)^2`))}.` };
    },
    () => {                                     // (ln x)^3
      return { f: '\\left(\\ln x\\right)^3', d: fr('3\\left(\\ln x\\right)^2', 'x'), domTex: IPOS, dom: [0.3, 4],
        faux: [fr('3\\left(\\ln x\\right)^2', 'x^2'), '3\\left(\\ln x\\right)^2', fr('\\left(\\ln x\\right)^2', 'x'), fr('3\\ln x', 'x')],
        expl: `${m(T`(u^3)'=3u'u^2`)} avec ${m(T`u=\ln x`)} et ${m(T`u'=\dfrac{1}{x}`)}.` };
    },
    () => {                                     // 1/(1 + e^{-x})
      return { f: fr('1', '1+e^{-x}'), d: fr('e^{-x}', '\\left(1+e^{-x}\\right)^2'), domTex: IR, dom: [-2, 2],
        faux: [fr('-e^{-x}', '\\left(1+e^{-x}\\right)^2'), fr('-1', '\\left(1+e^{-x}\\right)^2'), fr('e^{-x}', '1+e^{-x}'), fr('1', '\\left(1+e^{-x}\\right)^2')],
        expl: `${m(T`\left(\dfrac{1}{v}\right)'=-\dfrac{v'}{v^2}`)} avec ${m('v=1+e^{-x}')} et ${m(T`v'=-e^{-x}`)} : ${m(T`-\dfrac{-e^{-x}}{(1+e^{-x})^2}`)}.` };
    },
    () => {                                     // x^n ln x - x^n / n
      const n = aleaParmi([2, 3, 4]);
      return { f: `${xp(n)}\\ln x-${fr(xp(n), String(n))}`, d: `${n}${xp(n - 1)}\\ln x`, domTex: IPOS, dom: [0.3, 4],
        faux: [`${n}${xp(n - 1)}\\ln x+${xp(n - 1)}`, `${xp(n - 1)}\\ln x`, `${n}${xp(n - 1)}\\ln x-${xp(n - 1)}`, `${xp(n - 1)}`],
        expl: `${m(T`(${xp(n)}\ln x)'=${n}${xp(n - 1)}\ln x+${xp(n - 1)}`)} et ${m(T`\left(\dfrac{${xp(n)}}{${n}}\right)'=${xp(n - 1)}`)} : les termes en ${m(xp(n - 1))} s'annulent.` };
    },
    () => {                                     // ln(x/(x+a))
      const a = alea(1, 6), q = fr('x', `x+${a}`);
      return { f: ln(q), d: fr(String(a), `x\\left(x+${a}\\right)`), domTex: IPOS, dom: [0.3, 4],
        faux: [fr('1', `x+${a}`), fr(String(a), `\\left(x+${a}\\right)^2`), fr('1', 'x'), fr(`x+${a}`, 'x')],
        expl: `${m(T`\ln\left(\dfrac{x}{x+${a}}\right)=\ln x-\ln(x+${a})`)}, de dérivée ${m(T`\dfrac{1}{x}-\dfrac{1}{x+${a}}=\dfrac{${a}}{x(x+${a})}`)}.` };
    }
  );
  MODELES_PRIMITIVE[1].push(
    () => {                                     // polynôme
      const a = aleaParmi([3, 6, 9, 2, 4]), b = aleaParmi([2, 4, 6, -2, -4, 3]), c = aleaParmi([1, -1, 2, -3, 5]), f = P([a, 'x^2'], [b, 'x'], [c, '']);
      const Fx = `${coefFr(a, 3)}x^3${b < 0 ? '-' : '+'}${coefFr(Math.abs(b), 2)}x^2${c < 0 ? '-' : '+'}${Math.abs(c) === 1 ? '' : Math.abs(c)}x`;
      return { f, F: Fx, domTex: IR, dom: [-2, 2],
        faux: [`${a}x^3${b < 0 ? '-' : '+'}${Math.abs(b)}x^2${c < 0 ? '-' : '+'}${Math.abs(c)}x`, `${coefFr(a, 3)}x^3${b < 0 ? '-' : '+'}${coefFr(Math.abs(b), 2)}x^2${sgn(c)}`, P([2 * a, 'x'], [b, '']), `${coefFr(a, 2)}x^3${b < 0 ? '-' : '+'}${Math.abs(b)}x^2${c < 0 ? '-' : '+'}${Math.abs(c) === 1 ? '' : Math.abs(c)}x`],
        expl: `On primitive terme à terme : ${m(T`x^2\to\dfrac{x^3}{3}`)}, ${m(T`x\to\dfrac{x^2}{2}`)}, ${m(T`1\to x`)}.` };
    },
    () => {                                     // a/x²
      const a = aleaParmi([1, 2, 3, 4, 5]);
      return { f: fr(String(a), 'x^2'), F: `-${fr(String(a), 'x')}`, domTex: IPOS, dom: [0.3, 4],
        faux: [fr(String(a), 'x'), `${a}\\ln x`, fr(String(a), `3x^3`), `-${fr(String(a), 'x^2')}`, `${a}x`],
        expl: `Une primitive de ${m(T`\dfrac{1}{x^2}`)} sur ${m(IPOS)} est ${m(T`-\dfrac{1}{x}`)}.` };
    },
    () => {                                     // a e^x + b/x
      const a = aleaParmi([2, 3, 5, -2]), b = aleaParmi([1, 2, 3, 4, -1]);
      return { f: `${coef(a)}e^x${b < 0 ? '-' : '+'}${fr(String(Math.abs(b)), 'x')}`, F: `${coef(a)}e^x${b < 0 ? '-' : '+'}${Math.abs(b) === 1 ? '' : Math.abs(b)}\\ln x`, domTex: IPOS, dom: [0.3, 4],
        faux: [`${coef(a)}e^x${b < 0 ? '-' : '+'}${fr(String(Math.abs(b)), 'x^2')}`, `${coef(a)}xe^x${b < 0 ? '-' : '+'}${Math.abs(b) === 1 ? '' : Math.abs(b)}\\ln x`, `${coef(a)}e^x${b < 0 ? '-' : '+'}${Math.abs(b) === 1 ? '' : Math.abs(b)}\\ln\\left(x^2\\right)`, `${coef(a)}e^{x}${b < 0 ? '-' : '+'}${fr(String(Math.abs(b)), 'x')}`],
        expl: `Une primitive de ${m(`${coef(a)}e^x`)} est ${m(`${coef(a)}e^x`)} et une primitive de ${m(fr(String(Math.abs(b)), 'x'))} sur ${m(IPOS)} est ${m(`${Math.abs(b) === 1 ? '' : Math.abs(b)}\\ln x`)}.` };
    }
  );
  MODELES_PRIMITIVE[3].push(
    () => {                                     // x ln x
      return { f: 'x\\ln x', F: `${fr('x^2', '2')}\\ln x-${fr('x^2', '4')}`, domTex: IPOS, dom: [0.3, 4],
        faux: [`${fr('x^2', '2')}\\ln x`, `${fr('x^2', '2')}\\ln x-${fr('x^2', '2')}`, `${fr('x^2', '2')}\\ln x+${fr('x^2', '4')}`, `x\\ln x-x`, fr('x', '2')],
        expl: `On vérifie : ${m(T`\left(\dfrac{x^2}{2}\ln x-\dfrac{x^2}{4}\right)'=x\ln x+\dfrac{x^2}{2}\times\dfrac{1}{x}-\dfrac{x}{2}=x\ln x`)}.` };
    },
    () => {                                     // x e^{kx}
      const k = aleaParmi([2, 3, -1, -2]), num = P([k, 'x'], [-1, '']);
      return { f: `xe^{${P([k, 'x'])}}`, F: k * k === 1 ? `(${num})e^{${P([k, 'x'])}}` : `${fr(num, String(k * k))}e^{${P([k, 'x'])}}`, domTex: IR, dom: [-2, 2],
        faux: [`${fr('x', String(k))}e^{${P([k, 'x'])}}`.replace('\\dfrac{x}{-1}', '-x'), `(${P([k, 'x'], [1, ''])})e^{${P([k, 'x'])}}`, `${fr(P([1, 'x'], [-1, '']), String(k))}e^{${P([k, 'x'])}}`, `${fr('x^2', '2')}e^{${P([k, 'x'])}}`, `${fr(P([k, 'x'], [1, '']), String(k * k))}e^{${P([k, 'x'])}}`],
        expl: `Intégration par parties (ou vérification) : la dérivée de ${m(T`\dfrac{kx-1}{k^2}e^{kx}`.replace(/k\^2/, String(k * k)).replace(/kx/g, P([k, 'x'])).replace(/\{k\}/, `{${k}}`).replace(/e\^\{kx\}/, `e^{${P([k, 'x'])}}`))} est ${m(`xe^{${P([k, 'x'])}}`)}.` };
    },
    () => {                                     // e^x / (e^x + c)^2
      const c = alea(1, 5), g = `e^x+${c}`;
      return { f: fr('e^x', `\\left(${g}\\right)^2`), F: `-${fr('1', g)}`, domTex: IR, dom: [-2, 2],
        faux: [fr('1', g), `-${fr('1', `\\left(${g}\\right)^2`)}`, ln(g), fr('1', `\\left(${g}\\right)^2`), `-${fr('e^x', g)}`],
        expl: `${m(T`\dfrac{u'}{u^2}`)} a pour primitive ${m(T`-\dfrac{1}{u}`)}, avec ${m(`u=${g}`)} et ${m("u'=e^x")}.` };
    },
    () => {                                     // (2x+b) e^{x²+bx}
      const b = aleaParmi([-3, -2, -1, 1, 2, 3]), g = P([1, 'x^2'], [b, 'x']);
      return { f: `(${P([2, 'x'], [b, ''])})${E(g)}`, F: E(g), domTex: IR, dom: [-1.5, 1.5],
        faux: [`${fr('1', '2')}${E(g)}`, `(${P([2, 'x'], [b, ''])})${E(P([2, 'x'], [b, '']))}`, `${fr(`(${P([2, 'x'], [b, ''])})`, '2')}${E(g)}`, `${fr('x^2', '2')}${E(g)}`, `\\left(${g}\\right)${E(g)}`],
        expl: `La fonction est de la forme ${m(T`u'e^{u}`)} avec ${m(`u=${g}`)} : une primitive est ${m(E(g))}.` };
    },
    () => {                                     // 1/(x ln x) sur ]1 ; +inf[
      return { f: fr('1', 'x\\ln x'), F: ln('\\ln x'), domTex: bornes('1', INF), dom: [1.3, 6],
        faux: [ln('x\\ln x'), `\\left(\\ln x\\right)^2`, fr('1', '\\ln x'), `\\dfrac{1}{2}\\left(\\ln x\\right)^2`, fr('\\ln x', 'x')],
        expl: `${m(T`\dfrac{1}{x\ln x}=\dfrac{u'}{u}`)} avec ${m(T`u=\ln x`)} (strictement positif sur ${m(bornes('1', INF))}) : une primitive est ${m(ln('\\ln x'))}.` };
    }
  );
  // limites : les sigles utilisés plus haut (INF, MINF) sont déjà définis
  MODELES_LIMITE[2].push(
    () => {                                     // (e^x - 1)/(e^x + 1) en ±infini
      const a = alea(1, 4), at = aleaParmi(['inf', '-inf']);
      return { f: fr(`e^x-${a}`, `e^x+${a}`), domTex: IR, at, v: at === 'inf' ? 1 : -1, faux: [['0', 0], [INF, Infinity], [MINF, -Infinity], [String(a), a], [String(-a), -a]],
        expl: at === 'inf' ? `En ${m(INF)}, on factorise par ${m('e^x')} : le quotient tend vers ${m('1')}.` : `En ${m(MINF)}, ${m('e^x')} tend vers ${m('0')} : le quotient tend vers ${m(fr(String(-a), String(a)))}${m('=-1')}.` };
    },
    () => {                                     // ln x / sqrt x, ln x / x^n
      return { f: fr('\\ln x', '\\sqrt{x}'), domTex: IPOS, at: 'inf', v: 0, faux: [[INF, Infinity], ['1', 1], [MINF, -Infinity], ['2', 2]],
        expl: `Par croissances comparées, le logarithme est négligeable devant toute puissance de ${m('x')}, y compris ${m(T`\sqrt{x}=x^{1/2}`)} : la limite est ${m('0')}.` };
    },
    () => {                                     // e^{-x} ln x
      const a = aleaParmi([1, 2, 3]);
      return { f: `${coef(a)}e^{-x}\\ln x`, domTex: IPOS, at: 'inf', v: 0, faux: [[INF, Infinity], [MINF, -Infinity], ['1', 1], [String(a), a]],
        expl: `${m(T`e^{-x}\ln x=\dfrac{\ln x}{e^x}`)} et ${m('e^x')} l'emporte sur ${m(T`\ln x`)} : la limite est ${m('0')}.` };
    },
    () => {                                     // (x² + a)/ln x
      const a = alea(1, 5);
      return { f: fr(`x^2+${a}`, '\\ln x'), domTex: bornes('1', INF), at: 'inf', v: Infinity, faux: [['0', 0], [MINF, -Infinity], ['1', 1], [String(a), a]],
        expl: `Le numérateur tend vers ${m(INF)} beaucoup plus vite que le dénominateur ${m(T`\ln x`)} : la limite est ${m(INF)}.` };
    },
    () => {                                     // quotient de polynômes de même degré 2 ou de degré différent
      const a = aleaParmi([1, 2, 3, -1, -2]), c = aleaParmi([1, 2, 4, -1, -3]), b = alea(-4, 4), d = alea(-4, 4), mode = aleaParmi(['egal', 'num', 'den']);
      const at = aleaParmi(['inf', '-inf']);
      if (mode === 'egal') return { f: fr(P([a, 'x^2'], [b, 'x'], [1, '']), P([c, 'x^2'], [d, ''], [1, ''])), domTex: IR, at, v: a / c, vTex: rat(a, c), faux: [['0', 0], [INF, Infinity], [MINF, -Infinity], [rat(c, a), c / a], [String(a), a], [rat(-a, c), -a / c]],
        expl: `Au numérateur comme au dénominateur, le terme de plus haut degré est en ${m('x^2')} : la limite est le quotient des coefficients ${m(fr(String(a), String(c)))}.` };
      if (mode === 'num') return { f: fr(P([a, 'x^3'], [b, 'x'], [1, '']), P([c, 'x^2'], [d, ''], [1, ''])), domTex: IR, at, v: Math.sign(a / c) * (at === 'inf' ? 1 : -1) * Infinity, faux: [['0', 0], [INF, Infinity], [MINF, -Infinity], [rat(a, c), a / c]],
        expl: `Le numérateur est de degré 3, le dénominateur de degré 2 : le quotient se comporte comme ${m(fr(`${a}x^3`, `${c}x^2`))}, donc comme ${m(`${rat(a, c)}x`)}, de limite infinie.` };
      return { f: fr(P([a, 'x'], [b, '']), P([c, 'x^2'], [d, ''], [1, ''])), domTex: IR, at, v: 0, faux: [[INF, Infinity], [MINF, -Infinity], [rat(a, c), a / c], ['1', 1]],
        expl: `Le dénominateur est de degré 2, le numérateur de degré 1 : le quotient se comporte comme ${m(fr(`${a}x`, `${c}x^2`))}, qui tend vers ${m('0')}.` };
    }
  );
  MODELES_LIMITE[3].push(
    () => {                                     // x ln(1 + a/x)
      const a = alea(2, 6);
      return { f: `x\\ln\\left(1+${fr(String(a), 'x')}\\right)`, domTex: IPOS, at: 'inf', v: a, faux: [['0', 0], [INF, Infinity], ['1', 1], [String(a * a), a * a], [String(-a), -a]],
        expl: `On pose ${m(T`X=\dfrac{${a}}{x}`)}, qui tend vers ${m('0')} : ${m(T`x\ln\left(1+\dfrac{${a}}{x}\right)=${a}\times\dfrac{\ln(1+X)}{X}`)} tend vers ${m(`${a}\\times 1=${a}`)} (taux d'accroissement de ${m(T`\ln(1+X)`)} en ${m('0')}).` };
    },
    () => {                                     // x(e^{1/x} - 1)
      return { f: 'x\\left(e^{1/x}-1\\right)', domTex: IPOS, at: 'inf', v: 1, faux: [['0', 0], [INF, Infinity], [MINF, -Infinity], ['2', 2]],
        expl: `Avec ${m(T`X=\dfrac{1}{x}`)} qui tend vers ${m('0')} : ${m(T`x\left(e^{1/x}-1\right)=\dfrac{e^{X}-1}{X}`)} tend vers ${m(T`\exp'(0)=1`)}.` };
    },
    () => {                                     // ln((ax+b)/(cx+d))
      const a = alea(2, 9), c = alea(1, a - 1), g = pgcd(a, c), n = a / g, d = c / g, b = alea(1, 5), dd = alea(1, 5);
      const lim = d === 1 ? lnN(n) : ln(fr(String(n), String(d)));
      return { f: ln(fr(P([a, 'x'], [b, '']), P([c, 'x'], [dd, '']))), domTex: bornes(rat(-dd, c), INF), at: 'inf', v: Math.log(a / c), vTex: lim,
        faux: [['0', 0], [INF, Infinity], [String(a / c), a / c], [lnN(a), Math.log(a)], [d === 1 ? lnN(n + 1) : ln(fr(String(d), String(n))), d === 1 ? Math.log(n + 1) : Math.log(d / n)]],
        expl: `Le quotient ${m(fr(P([a, 'x'], [b, '']), P([c, 'x'], [dd, ''])))} tend vers ${m(fr(String(a), String(c)))} en ${m(INF)}, et ${m(T`\ln`)} est continue : la limite est ${m(lim)}.` };
    },
    () => {                                     // (2e^x - x)/(e^x + 3x)
      const a = alea(2, 5), b = alea(1, 4), c = alea(1, 6);
      return { f: fr(`${a}e^x-${b === 1 ? '' : b}x`, `e^x+${c}x`), domTex: T`\mathbb{R}`, at: 'inf', v: a, faux: [['0', 0], [INF, Infinity], ['1', 1], [rat(a, c), a / c], [String(-b), -b]],
        expl: `On factorise par ${m('e^x')} : ${m(T`\dfrac{${a}-${b === 1 ? '' : b}xe^{-x}}{1+${c}xe^{-x}}`)} tend vers ${m(String(a))} car ${m('xe^{-x}')} tend vers ${m('0')}.` };
    },
    () => {                                     // x - sqrt(x² + ax)
      const a = aleaParmi([2, 4, 6, 8, 1, 3]);
      return { f: `x-\\sqrt{x^2+${a}x}`, domTex: IPOS, at: 'inf', v: -a / 2, vTex: `-${rat(a, 2)}`, faux: [['0', 0], [INF, Infinity], [MINF, -Infinity], [rat(a, 2), a / 2], [String(-a), -a]],
        expl: `Forme indéterminée ${m(T`\infty-\infty`)} : on multiplie par la quantité conjuguée : ${m(T`x-\sqrt{x^2+${a}x}=\dfrac{-${a}x}{x+\sqrt{x^2+${a}x}}=\dfrac{-${a}}{1+\sqrt{1+\frac{${a}}{x}}}`)} tend vers ${m('-' + rat(a, 2))}.` };
    },
    () => {                                     // x^n e^{-x} ± x ou e^x - x^n e^{...}
      const n = aleaParmi([2, 3]), a = aleaParmi([1, 2, 3]);
      return { f: `${a}x-${xp(n)}e^{-x}`, domTex: IR, at: 'inf', v: Infinity, faux: [['0', 0], [MINF, -Infinity], [String(a), a], ['1', 1]],
        expl: `${m(`${xp(n)}e^{-x}`)} tend vers ${m('0')} (croissances comparées) tandis que ${m(`${a}x`)} tend vers ${m(INF)} : la limite est ${m(INF)}.` };
    }
  );
  MODELES_TANGENTE[2].push(
    () => {                                     // ln(ax + b) en x0 où ax0 + b = 1
      const a = aleaParmi([2, 3, 4, 5]), x0 = aleaParmi([1, 2]), b = 1 - a * x0;
      return { f: ln(P([a, 'x'], [b, ''])), domTex: bornes(rat(-b, a), INF), a: x0, aTex: String(x0), bonne: droiteTex(a, -a * x0),
        faux: [droiteTex(a, 0), droiteTex(1, -x0), droiteTex(a, a * x0), droiteTex(1, -a * x0), droiteTex(a + 1, -a * x0)],
        expl: `${m(`f'(x)=${fr(String(a), P([a, 'x'], [b, '']))}`)} donc ${m(`f'(${x0})=${a}`)} et ${m(`f(${x0})=\\ln 1=0`)}. La tangente est ${m(`y=${a}\\left(x-${x0}\\right)`)}, soit ${m(droiteTex(a, -a * x0))}.` };
    },
    () => {                                     // x/(x + a) en 1
      const a = alea(1, 5), d = (a + 1) * (a + 1);
      return { f: fr('x', `x+${a}`), domTex: bornes(String(-a), INF), a: 1, aTex: '1', bonne: `y=${rat(a, d)}x+${rat(1, d)}`,
        faux: [`y=${rat(a, d)}x`, `y=${rat(1, d)}x+${rat(a, d)}`, `y=${rat(1, a + 1)}x+${rat(1, d)}`, `y=${rat(a, d)}x+${rat(1, a + 1)}`, `y=${rat(a, d)}x-${rat(1, d)}`],
        expl: `${m(`f'(x)=${fr(`(x+${a})-x`, `(x+${a})^2`)}=${fr(String(a), `(x+${a})^2`)}`)} donc ${m(`f'(1)=${rat(a, d)}`)} et ${m(`f(1)=${rat(1, a + 1)}`)}. La tangente est ${m(`y=${rat(a, d)}(x-1)+${rat(1, a + 1)}`)}, soit ${m(`y=${rat(a, d)}x+${rat(1, d)}`)}.` };
    },
    () => {                                     // x² e^x en 1
      return { f: 'x^2e^x', domTex: IR, a: 1, aTex: '1', bonne: droiteE(3, 1, -2, 1),
        faux: [droiteE(3, 1, 1, 1), droiteE(2, 1, -1, 1), droiteE(3, 1, -1, 1), droiteE(3, 1, 0, 0), droiteE(2, 1, 0, 0)],
        expl: `${m(T`f'(x)=(2x+x^2)e^x`)} donc ${m("f'(1)=3e")} et ${m('f(1)=e')}. La tangente est ${m(T`y=3e(x-1)+e`)}, soit ${m(droiteE(3, 1, -2, 1))}.` };
    },
    () => {                                     // sqrt(x) en q² (q = 2, 3)
      const q = aleaParmi([2, 3, 5]);
      return { f: '\\sqrt{x}', domTex: T`\left[0\,;+\infty\right[`, a: q * q, aTex: String(q * q), bonne: `y=${rat(1, 2 * q)}x+${rat(q, 2)}`,
        faux: [`y=${rat(1, 2 * q)}x`, `y=${rat(1, q)}x+${rat(q, 2)}`, `y=${rat(1, 2 * q)}x+${q}`, `y=${rat(1, 2 * q * q)}x+${rat(q, 2)}`, `y=${2 * q}x+${rat(q, 2)}`],
        expl: `${m(T`f'(x)=\dfrac{1}{2\sqrt{x}}`)} donc ${m(`f'(${q * q})=${rat(1, 2 * q)}`)} et ${m(`f(${q * q})=${q}`)}. La tangente est ${m(`y=${rat(1, 2 * q)}(x-${q * q})+${q}`)}, soit ${m(`y=${rat(1, 2 * q)}x+${rat(q, 2)}`)}.` };
    }
  );
  MODELES_TANGENTE[3].push(
    () => {                                   // ln x / x en e : tangente horizontale
      return { f: fr('\\ln x', 'x'), domTex: IPOS, a: Math.E, aTex: 'e', bonne: 'y=\\dfrac{1}{e}',
        faux: [`y=\\dfrac{1}{e}x`, `y=\\dfrac{2}{e}`, 'y=1', 'y=e', `y=\\dfrac{x}{e}-1`],
        expl: `${m(T`f'(x)=\dfrac{1-\ln x}{x^2}`)} donc ${m("f'(e)=0")} : la tangente est horizontale. Comme ${m(T`f(e)=\dfrac{1}{e}`)}, son équation est ${m(T`y=\dfrac{1}{e}`)}.` };
    },
    () => {                                   // e^{-x²} en 1
      return { f: 'e^{-x^2}', domTex: IR, a: 1, aTex: '1', bonne: `y=${fr('3-2x', 'e')}`,
        faux: [`y=${fr('1-2x', 'e')}`, `y=${fr('2-3x', 'e')}`, `y=${fr('2x-3', 'e')}`, `y=${fr('3-x', 'e')}`, `y=${fr('1', 'e')}-2x`],
        expl: `${m(T`f'(x)=-2xe^{-x^2}`)} donc ${m(T`f'(1)=-\dfrac{2}{e}`)} et ${m(T`f(1)=\dfrac{1}{e}`)}. La tangente est ${m(T`y=-\dfrac{2}{e}(x-1)+\dfrac{1}{e}`)}, soit ${m(`y=${fr('3-2x', 'e')}`)}.` };
    },
    () => {                                   // x ln x en 1 + autre : (x² - 1) ln x ... simple : x²ln x en 1
      const n = aleaParmi([2, 3, 4]);
      return { f: `${xp(n)}\\ln x`, domTex: IPOS, a: 1, aTex: '1', bonne: droiteTex(1, -1),
        faux: [droiteTex(n, -n), droiteTex(1, 0), droiteTex(n, -1), droiteTex(1, 1), droiteTex(0, 0)],
        expl: `${m(`f'(x)=${n}${xp(n - 1)}\\ln x+${xp(n - 1)}`)} donc ${m("f'(1)=1")} et ${m(T`f(1)=0`)}. La tangente est ${m('y=x-1')}.` };
    }
  );
  MODELES_CONVEXITE[2].push(
    () => {                                     // a x² + bx + c
      const a = aleaParmi([1, 2, 3, -1, -2]), b = alea(-5, 5), c = alea(-5, 5);
      return { f: P([a, 'x^2'], [b, 'x'], [c, '']), domTex: IR, win: [-4, 4], vrai: a > 0 ? 'cvx' : 'ccv', a: aleaParmi([0, 1]),
        expl: `${m(`f''(x)=${2 * a}`)} est constant ${a > 0 ? 'strictement positif' : 'strictement négatif'} : ${m('f')} est ${a > 0 ? 'convexe' : 'concave'} sur ${m(IR)}.` };
    },
    () => {                                     // a e^{kx} + bx ou -a e^{kx}
      const k = aleaParmi([2, 3, -1, -2]), a = aleaParmi([1, 2, 3]), neg = Math.random() < 0.35;
      return { f: `${neg ? '-' : ''}${a === 1 ? '' : a}e^{${P([k, 'x'])}}${sgn(alea(1, 4))}x`, domTex: IR, win: [-2, 2], vrai: neg ? 'ccv' : 'cvx', a: 0,
        expl: `${m(`f''(x)=${neg ? '-' : ''}${a * k * k}e^{${P([k, 'x'])}}`)} est ${neg ? 'strictement négatif' : 'strictement positif'} sur ${m(IR)} : ${m('f')} est ${neg ? 'concave' : 'convexe'}.` };
    },
    () => {                                     // x ln x (convexe), x + 1/x (convexe), -1/x (concave), x^2 - ln x
      const t = aleaParmi(['xln', 'xinv', 'minv', 'x2ln']), a = alea(1, 4);
      const D = { xln: { f: `${a === 1 ? '' : a}x\\ln x`, v: 'cvx', e: `${m(`f'(x)=${a === 1 ? '' : a}\\ln x+${a}`)} puis ${m(`f''(x)=${fr(String(a), 'x')}`)} > 0 sur ${m(IPOS)} : convexe.` },
        xinv: { f: `${a === 1 ? '' : a}x+${fr('1', 'x')}`, v: 'cvx', e: `${m(T`f''(x)=\dfrac{2}{x^3}`)} > 0 sur ${m(IPOS)} : convexe.` },
        minv: { f: `-${fr(String(a), 'x')}`, v: 'ccv', e: `${m(`f'(x)=${fr(String(a), 'x^2')}`)} puis ${m(`f''(x)=-${fr(String(2 * a), 'x^3')}`)} < 0 sur ${m(IPOS)} : concave.` },
        x2ln: { f: `x^2-${a === 1 ? '' : a}\\ln x`, v: 'cvx', e: `${m(`f''(x)=2+${fr(String(a), 'x^2')}`)} > 0 sur ${m(IPOS)} : convexe.` } }[t];
      return { f: D.f, domTex: IPOS, win: [0.15, 6], vrai: D.v, lo: '0', expl: D.e.replace(' > 0', ' est strictement positif').replace(' < 0', ' est strictement négatif') };
    }
  );
  MODELES_CALCUL[1].push(
    () => {                                     // ln(e^a) + e^{ln b}
      const a = alea(2, 7), b = alea(2, 9), f = `${ln(E(String(a)))}+e^{\\ln ${b}}`;
      return { enonce: `L'expression ${m(f)} est égale à :`, bonne: String(a + b), v: a + b, f,
        faux: [[String(a * b), 0], [String(a + b + 1), 0], [`${a}e^{${b}}`, 0], [`${b}e^{${a}}`, 0], [String(Math.abs(a - b)), 0]].map(([t]) => [t, 1]),
        expl: `${m(T`\ln\left(e^{${a}}\right)=${a}`)} et ${m(T`e^{\ln ${b}}=${b}`)} : la somme vaut ${m(String(a + b))}.` };
    },
    () => {                                     // e^{x+a} / e^{x-b}
      const a = alea(1, 5), b = alea(1, 5), f = fr(`e^{x+${a}}`, `e^{x-${b}}`);
      return { enonce: `Pour tout réel ${m('x')}, ${m(f)} est égal à :`, bonne: `e^{${a + b}}`, v: NaN, f,
        faux: [[`e^{${a - b}}`, 1], [`e^{x+${a + b}}`, 1], [`e^{${a * b}}`, 1], [`e^{2x+${a - b}}`, 1], [`e^{-${a + b}}`, 1]],
        expl: `${m(T`\dfrac{e^{u}}{e^{v}}=e^{u-v}`)} : l'exposant est ${m(`(x+${a})-(x-${b})=${a + b}`)}.` };
    }
  );
  MODELES_TANGENTE[3].push(
    () => {                                     // ln(x² + c) en x0
      const [c, x0] = aleaParmi([[1, 1], [3, 1], [4, 2], [8, 2], [5, 2], [2, 1], [1, 2], [7, 3], [3, 3]]), N = x0 * x0 + c, mn = 2 * x0, cs = 2 * x0 * x0;
      const dr = (sn, sd, kn, kd, ln) => `y=${rat(sn, sd)}x${kn < 0 ? '-' : '+'}${rat(Math.abs(kn), kd)}${ln === 0 ? '' : `+\\ln ${ln}`}`.replace('y=1x', 'y=x').replace(/\+\\ln /, '+\\ln ').replace('x+0', 'x');
      const bonne = dr(mn, N, -cs, N, N);
      return { f: `\\ln\\left(x^2+${c}\\right)`, domTex: IR, a: x0, aTex: String(x0), bonne,
        faux: [dr(mn, N, -cs, N, 0), dr(mn, N, cs, N, N), dr(mn, N + 1, -cs, N, N), dr(1, 1, -x0, 1, N), dr(mn, N, -cs, N, N + 1), dr(2, 1, -2 * x0, 1, N)].filter(t => !/^$/.test(t)),
        expl: `${m(T`f'(x)=\dfrac{2x}{x^2+${c}}`)} donc ${m(`f'(${x0})=${rat(mn, N)}`)} et ${m(`f(${x0})=\\ln ${N}`)}. La tangente est ${m(`y=${rat(mn, N)}\\left(x-${x0}\\right)+\\ln ${N}`)}, soit ${m(bonne)}.` };
    }
  );
  MODELES_CALCUL[2].push(
    () => {                                     // (e^x + e^-x)² - (e^x - e^-x)²
      const k = aleaParmi([1, 2, 3]), f = `\\left(e^{x}+${k === 1 ? '' : k}e^{-x}\\right)^2-\\left(e^{x}-${k === 1 ? '' : k}e^{-x}\\right)^2`;
      return { enonce: `Pour tout réel ${m('x')}, ${m(f)} est égal à :`, bonne: String(4 * k), v: NaN, f,
        faux: [[String(2 * k), 1], [`${4 * k}e^{2x}`, 1], ['0', 1], [`${2 * k}e^{2x}`, 1], [String(4 * k * k), 1], [`e^{2x}+${k * k}e^{-2x}`, 1]],
        expl: `${m(T`(A+B)^2-(A-B)^2=4AB`)} avec ${m('A=e^{x}')} et ${m(`B=${k === 1 ? '' : k}e^{-x}`)} : ${m(`4AB=${4 * k}e^{x}e^{-x}=${4 * k}`)}.` };
    },
    () => {                                     // k ln p - ln(p^q)
      const p = aleaParmi([2, 3, 5, 7]), k = alea(2, 6), q = alea(1, 5);
      if (k === q) return null;
      const f = `${k}${lnN(p)}-\\ln\\left(${Math.pow(p, q)}\\right)`, K = k - q;
      return { enonce: `Exprimer ${m(f)} en fonction de ${m(lnN(p))}.`, bonne: LNP(K, p), v: K * Math.log(p), f,
        faux: [[LNP(k + q, p), (k + q) * Math.log(p)], [LNP(k * q, p), k * q * Math.log(p)], [LNP(-K, p), -K * Math.log(p)], [lnN(p * K), Math.log(p * K)], [LNP(k - q + 1, p), (K + 1) * Math.log(p)], [LNP(K - 1, p), (K - 1) * Math.log(p)]],
        expl: `${m(`\\ln\\left(${Math.pow(p, q)}\\right)=${LNP(q, p)}`)}, donc l'expression vaut ${m(`${k}\\ln ${p}-${LNP(q, p)}=${LNP(K, p)}`)}.` };
    }
  );
  // ---- seconde vague de compléments ----
  MODELES_DERIVEE[3].push(
    () => {                                     // x² e^{kx}
      const k = aleaParmi([2, 3, -1, -2, -3]), u = E(P([k, 'x']));
      return { f: `x^2${u}`, d: `(${P([k, 'x^2'], [2, 'x'])})${u}`, domTex: IR, dom: [-1.5, 1.5],
        faux: [`2x${u}`, `(${P([k, 'x^2'], [1, 'x'])})${u}`, `(${P([1, 'x^2'], [2, 'x'])})${u}`, `${coef(2 * k)}x${u}`, `(${P([k, 'x^2'], [-2, 'x'])})${u}`],
        expl: `Produit ${m('uv')} avec ${m('u=x^2')} et ${m(`v=${u}`)} : ${m(`(uv)'=2x${u}+x^2\\times ${coef(k)}${u}=(${P([k, 'x^2'], [2, 'x'])})${u}`)}.` };
    },
    () => {                                     // (ax+b) e^{kx}
      const a = aleaParmi([1, 2, 3, -1, -2]), b = aleaParmi([1, 2, 3, -1, -2, -3]), k = aleaParmi([2, 3, -1, -2]), u = E(P([k, 'x']));
      return { f: `(${P([a, 'x'], [b, ''])})${u}`, d: `(${P([a * k, 'x'], [a + b * k, ''])})${u}`, domTex: IR, dom: [-1.5, 1.5],
        faux: [`${coef(a)}${u}`, `(${P([a * k, 'x'], [b * k, ''])})${u}`, `(${P([a, 'x'], [a + b, ''])})${u}`, `(${P([a * k, 'x'], [a + b, ''])})${u}`, `(${P([a * k, 'x'], [a - b * k, ''])})${u}`],
        expl: `Produit ${m('uv')} avec ${m(`u=${P([a, 'x'], [b, ''])}`)}, ${m(`u'=${a}`)}, ${m(`v=${u}`)} et ${m(`v'=${coef(k)}${u}`)} : ${m(`(uv)'=\\left(${a}${k < 0 ? '-' : '+'}${Math.abs(k) === 1 ? '' : Math.abs(k)}\\left(${P([a, 'x'], [b, ''])}\\right)\\right)${u}=(${P([a * k, 'x'], [a + b * k, ''])})${u}`)}.` };
    },
    () => {                                     // x/(e^x + 1)
      const a = aleaParmi([1, 2, 3]);
      return { f: fr(`${a === 1 ? '' : a}x`, 'e^x+1'), d: fr(`${a}\\left(e^x+1-xe^x\\right)`.replace('1\\left', '\\left'), '\\left(e^x+1\\right)^2'), domTex: IR, dom: [-2, 2],
        faux: [fr(String(a), 'e^x'), fr(`${a}\\left(e^x+1+xe^x\\right)`, '\\left(e^x+1\\right)^2'), fr(`${a}\\left(1-xe^x\\right)`, '\\left(e^x+1\\right)^2'), fr(`${a}\\left(e^x+1-xe^x\\right)`, 'e^x+1')].map(t => t.replace('{1\\left', '{\\left')),
        expl: `Quotient : ${m(T`\dfrac{u'v-uv'}{v^2}=\dfrac{${a}(e^x+1)-${coef(a)}xe^x}{(e^x+1)^2}`.replace('-1xe', '-xe'))}.` };
    },
    () => {                                     // sqrt(x² + c)
      const c = alea(1, 8);
      return { f: `\\sqrt{x^2+${c}}`, d: fr('x', `\\sqrt{x^2+${c}}`), domTex: IR, dom: [-2.5, 2.5],
        faux: [fr('1', `2\\sqrt{x^2+${c}}`), fr('2x', `\\sqrt{x^2+${c}}`), fr('x', `2\\sqrt{x^2+${c}}`).replace('x}{', 'x}{').replace(/^\\dfrac\{x\}/, '\\dfrac{x}'), fr('x', `x^2+${c}`)],
        expl: `${m(T`(\sqrt{u})'=\dfrac{u'}{2\sqrt{u}}`)} avec ${m(`u=x^2+${c}`)}, ${m("u'=2x")} : ${m(fr('2x', `2\\sqrt{x^2+${c}}`))}.` };
    }
  );
  MODELES_PRIMITIVE[3].push(
    () => {                                     // a x / sqrt(x² + c)
      const a = aleaParmi([1, 2, 3]), c = alea(1, 8);
      return { f: fr(`${a === 1 ? '' : a}x`, `\\sqrt{x^2+${c}}`), F: `${coef(a)}\\sqrt{x^2+${c}}`, domTex: IR, dom: [-2.5, 2.5],
        faux: [`${coef(a)}${fr('1', `\\sqrt{x^2+${c}}`)}`, `${coef(2 * a)}\\sqrt{x^2+${c}}`, `${coef(a)}\\left(x^2+${c}\\right)\\sqrt{x^2+${c}}`, fr(`${a}\\sqrt{x^2+${c}}`, '2'), `${coef(a)}\\ln\\left(x^2+${c}\\right)`],
        expl: `${m(T`\dfrac{u'}{\sqrt{u}}`)} a pour primitive ${m(T`2\sqrt{u}`)}. Ici ${m(`u=x^2+${c}`)}, ${m("u'=2x")}, donc ${m(fr('x', `\\sqrt{x^2+${c}}`))} a pour primitive ${m(`\\sqrt{x^2+${c}}`)}.` };
    },
    () => {                                     // a (ln x)² / x
      const a = aleaParmi([1, 2, 3, 6]);
      return { f: fr(`${coef(a)}\\left(\\ln x\\right)^2`, 'x'), F: `${coefFr(a, 3)}\\left(\\ln x\\right)^3`, domTex: IPOS, dom: [0.3, 4],
        faux: [`${coefFr(a, 2)}\\left(\\ln x\\right)^2`, `${coef(a)}\\left(\\ln x\\right)^3`, `${coefFr(a, 3)}\\left(\\ln x\\right)^3\\times\\dfrac{1}{x}`.replace(/\\times\\dfrac\{1\}\{x\}/, '').replace(/$/, ''), fr(`${coef(a)}\\left(\\ln x\\right)^3`, 'x'), `${coefFr(a, 3)}\\ln\\left(x^3\\right)`],
        expl: `La fonction est de la forme ${m(T`u'u^2`)} avec ${m(T`u=\ln x`)} : une primitive est ${m(T`\dfrac{u^3}{3}`)}, donc ${m(`F(x)=${coefFr(a, 3)}\\left(\\ln x\\right)^3`)}.` };
    },
    () => {                                     // ln x avec F(1) = y0
      const y0 = aleaParmi([-2, -1, 1, 2, 3, 4]), c = y0 + 1;
      return { f: '\\ln x', F: J('x\\ln x-x', String(c)), domTex: IPOS, dom: [0.3, 4], cond: { x0: 1, y0 },
        faux: [J('x\\ln x-x', String(y0)), J('x\\ln x-x', String(y0 - 1)), J('x\\ln x+x', String(y0 - 1)), J('x\\ln x-x', String(-c)), 'x\\ln x-x'],
        expl: `Les primitives de ${m(T`\ln x`)} sont ${m('x\\ln x-x+C')}. La condition ${m(`F(1)=${y0}`)} donne ${m(`-1+C=${y0}`)}, donc ${m(`C=${c}`)}.` };
    },
    () => {                                     // 1/sqrt(x) + k
      const k = aleaParmi([1, 2, 3, 4, 5]), a = aleaParmi([1, 2, 3]);
      return { f: `${coef(a)}${fr('1', '\\sqrt{x}')}+${k}`, F: `${coef(2 * a)}\\sqrt{x}+${k}x`, domTex: IPOS, dom: [0.3, 4],
        faux: [`${coef(a)}\\sqrt{x}+${k}x`, `${coef(2 * a)}\\sqrt{x}+${k}`, `${coef(-a)}${fr('1', '2x\\sqrt{x}')}+${k}x`.replace('\\dfrac{1}{2x', '\\dfrac{1}{2x'), `${fr(String(a), '2')}\\sqrt{x}+${k}x`],
        expl: `Une primitive de ${m(T`\dfrac{1}{\sqrt{x}}`)} est ${m(T`2\sqrt{x}`)} (la dérivée de ${m(T`\sqrt{x}`)} est ${m(T`\dfrac{1}{2\sqrt{x}}`)}) et une primitive de ${m(String(k))} est ${m(`${k}x`)}.` };
    }
  );
  MODELES_TANGENTE[3].push(
    () => {                                     // x^n e^{-x} en 1
      const n = aleaParmi([2, 3, 4]), sl = n - 1, num = P([n - 1, 'x'], [-(n - 2), '']).replace(/^1x/, 'x');
      const lin = n === 2 ? 'x' : P([n - 1, 'x'], [-(n - 2), '']);
      return { f: `${xp(n)}e^{-x}`, domTex: IR, a: 1, aTex: '1', bonne: `y=${fr(lin, 'e')}`,
        faux: [`y=${fr(P([n - 1, 'x'], [-(n - 1), '']), 'e')}`, `y=${fr(P([n, 'x'], [-(n - 1), '']), 'e')}`, `y=${fr(P([n - 1, 'x'], [n - 2, '']), 'e')}`, `y=${fr('x', 'e')}`.replace(/.*/, n === 2 ? `y=${fr('2x-1', 'e')}` : `y=${fr('x', 'e')}`), `y=${fr(lin, 'e')}${sgn(1)}`.replace('+1', '+e')],
        expl: `${m(`f'(x)=(${n}${xp(n - 1)}-${xp(n)})e^{-x}`.replace('1x', 'x'))} donc ${m(T`f'(1)=\dfrac{${n - 1}}{e}`)} et ${m(T`f(1)=\dfrac{1}{e}`)}. La tangente est ${m(T`y=\dfrac{${n - 1}}{e}(x-1)+\dfrac{1}{e}`)}, soit ${m(`y=${fr(lin, 'e')}`)}.` };
    },
    () => {                                     // a e^x ln x en 1
      const a = aleaParmi([1, 2, 3, -1, -2]);
      return { f: `${coef(a)}e^x\\ln x`, domTex: IPOS, a: 1, aTex: '1', bonne: droiteE(a, 1, -a, 1),
        faux: [droiteE(a, 1, a, 1), droiteE(a, 1, 0, 0), droiteE(a, 0, -a, 0), droiteE(a, 1, -a, 0), droiteE(2 * a, 1, -2 * a, 1)],
        expl: `${m(`f'(x)=${coef(a)}e^x\\ln x+${coef(a)}${fr('e^x', 'x')}`.replace('+1', '+').replace('+-', '-'))} donc ${m(`f'(1)=${eT(a, 1)}`)} et ${m('f(1)=0')} (car ${m(T`\ln 1=0`)}). La tangente est ${m(`y=${eT(a, 1)}\\left(x-1\\right)`)}, soit ${m(droiteE(a, 1, -a, 1))}.` };
    },
    () => {                                     // e^x / x en 1 ou en 2
      if (Math.random() < 0.5) return { f: fr('e^x', 'x'), domTex: IPOS, a: 1, aTex: '1', bonne: 'y=e', faux: ['y=ex', 'y=1', 'y=ex-e', 'y=e(x-1)+1', 'y=0'],
        expl: `${m(T`f'(x)=\dfrac{e^x(x-1)}{x^2}`)} donc ${m("f'(1)=0")} : la tangente est horizontale, d'équation ${m('y=f(1)=e')}.` };
      return { f: fr('e^x', 'x'), domTex: IPOS, a: 2, aTex: '2', bonne: `y=${fr('e^2', '4')}x`, faux: [`y=${fr('e^2', '2')}x`, `y=${fr('e^2', '4')}x+${fr('e^2', '2')}`, `y=${fr('e^2', '4')}x-${fr('e^2', '2')}`, `y=${fr('e^2', '4')}`, `y=${fr('e^2', '8')}x`],
        expl: `${m(T`f'(x)=\dfrac{e^x(x-1)}{x^2}`)} donc ${m(T`f'(2)=\dfrac{e^2}{4}`)} et ${m(T`f(2)=\dfrac{e^2}{2}`)}. La tangente est ${m(T`y=\dfrac{e^2}{4}(x-2)+\dfrac{e^2}{2}`)}, soit ${m(`y=${fr('e^2', '4')}x`)}.` };
    }
  );
  MODELES_TANGENTE[2].push(
    () => {                                     // x e^{-x} en 0 ou 1
      if (Math.random() < 0.5) return { f: 'xe^{-x}', domTex: IR, a: 0, aTex: '0', bonne: 'y=x', faux: ['y=-x', 'y=1', 'y=x+1', 'y=0', 'y=2x'],
        expl: `${m(T`f'(x)=(1-x)e^{-x}`)} donc ${m("f'(0)=1")} et ${m('f(0)=0')} : la tangente est ${m('y=x')}.` };
      return { f: 'xe^{-x}', domTex: IR, a: 1, aTex: '1', bonne: 'y=\\dfrac{1}{e}', faux: ['y=\\dfrac{x}{e}', 'y=e', 'y=1', 'y=\\dfrac{1}{e}x+\\dfrac{1}{e}', 'y=0'],
        expl: `${m(T`f'(x)=(1-x)e^{-x}`)} donc ${m("f'(1)=0")} : la tangente est horizontale, d'équation ${m(T`y=f(1)=\dfrac{1}{e}`)}.` };
    },
    () => {                                     // x² + a e^x en 0
      const a = aleaParmi([1, 2, 3, 4, -1, -2]), b = aleaParmi([-3, -2, -1, 1, 2, 3]);
      return { f: `x^2${b < 0 ? '-' : '+'}${Math.abs(b) === 1 ? '' : Math.abs(b)}x${a < 0 ? '-' : '+'}${Math.abs(a) === 1 ? '' : Math.abs(a)}e^x`, domTex: IR, a: 0, aTex: '0', bonne: droiteTex(b + a, a),
        faux: [droiteTex(b, a), droiteTex(b + a, 0), droiteTex(a, b + a), droiteTex(b + a + 1, a), droiteTex(b + a, a + b)],
        expl: `${m(`f'(x)=2x${sgn(b)}${a < 0 ? '-' : '+'}${Math.abs(a) === 1 ? '' : Math.abs(a)}e^x`)} donc ${m(`f'(0)=${b + a}`)} et ${m(`f(0)=${a}`)}. La tangente en ${m('0')} est ${m(droiteTex(b + a, a))}.` };
    }
  );
  MODELES_CALCUL[2].push(
    () => {                                     // (e^x + a)² - 2a e^x
      const a = alea(2, 5);
      return { enonce: `Pour tout réel ${m('x')}, ${m(`\\left(e^x+${a}\\right)^2-${2 * a}e^x`)} est égal à :`, bonne: `e^{2x}+${a * a}`, v: NaN, f: `\\left(e^x+${a}\\right)^2-${2 * a}e^x`,
        faux: [[`e^{2x}+${2 * a}`, 1], [`e^{2x}+${a * a}e^x`, 1], [`e^{2x}-${a * a}`, 1], [`e^{x}+${a * a}`, 1], [`e^{2x}+${4 * a}e^x+${a * a}`, 1]],
        expl: `On développe : ${m(`\\left(e^x+${a}\\right)^2=e^{2x}+${2 * a}e^x+${a * a}`)}, puis on retranche ${m(`${2 * a}e^x`)}.` };
    },
    () => {                                     // (e^{2x} - a²)/(e^x + a)
      const a = alea(2, 5);
      return { enonce: `Pour tout réel ${m('x')}, ${m(fr(`e^{2x}-${a * a}`, `e^x+${a}`))} est égal à :`, bonne: `e^x-${a}`, v: NaN, f: fr(`e^{2x}-${a * a}`, `e^x+${a}`),
        faux: [[`e^x+${a}`, 1], [`e^{x}-${a * a}`, 1], [`e^{2x}-${a}`, 1], [`e^x-${a}e^{x}`, 1], [fr('e^x', a), 1]].map(([t, v]) => [t.replace('\\dfrac{e^x}{', '\\dfrac{e^x}{'), v]),
        expl: `Identité remarquable : ${m(`e^{2x}-${a * a}=\\left(e^x-${a}\\right)\\left(e^x+${a}\\right)`)}, on simplifie par ${m(`e^x+${a}`)}.` };
    },
    () => {                                     // ln(a e^x) = x + ln a ; ln(e^x + ...)
      const a = aleaParmi([2, 3, 5]), k = aleaParmi([1, 2, 3]);
      const f = `\\ln\\left(${a}e^{${k === 1 ? '' : k}x}\\right)`;
      return { enonce: `Pour tout réel ${m('x')}, ${m(f)} est égal à :`, bonne: `${k === 1 ? '' : k}x+${lnN(a)}`, v: NaN, f,
        faux: [[`${a}${k === 1 ? '' : k}x`, 1], [`${k === 1 ? '' : k}x${lnN(a)}`.replace(/(\d)\\ln/, '$1\\times\\ln'), 1], [`${a}x+${lnN(k + 1)}`, 1], [`${k === 1 ? '' : k}x-${lnN(a)}`, 1], [`${lnN(a)}${k === 1 ? '' : k}x`, 1].map ? [`${lnN(a)}\\times ${k === 1 ? '' : k}x`, 1] : [`${k}x`, 1]],
        expl: `${m(T`\ln(AB)=\ln A+\ln B`)} donc ${m(f)} ${m('=' + lnN(a) + '+' + ln(`e^{${k === 1 ? '' : k}x}`) + '=' + lnN(a) + '+' + (k === 1 ? '' : k) + 'x')}.` };
    }
  );
  MODELES_CALCUL[3].push(
    () => {                                     // 1/(1 + e^{-x})
      return { enonce: `Pour tout réel ${m('x')}, ${m(fr('1', '1+e^{-x}'))} est égal à :`, bonne: fr('e^x', 'e^x+1'), v: NaN, f: fr('1', '1+e^{-x}'),
        faux: [[fr('e^{-x}', '1+e^{-x}'), 1], [fr('1', 'e^x+1'), 1], [fr('e^x', '1+e^{-x}'), 1], [`1-e^{-x}`, 1], [fr('1', '1-e^{-x}'), 1]],
        expl: `On multiplie le numérateur et le dénominateur par ${m('e^x')} : ${m(T`\dfrac{e^x}{e^x+1}`)}.` };
    },
    () => {                                     // ln(e^x / (1 + e^x))
      return { enonce: `Pour tout réel ${m('x')}, ${m(ln(fr('e^x', '1+e^x')))} est égal à :`, bonne: '-\\ln\\left(1+e^{-x}\\right)', v: NaN, f: ln(fr('e^x', '1+e^x')),
        faux: [['\\ln\\left(1+e^{-x}\\right)', 1], ['x-\\ln\\left(1+e^{-x}\\right)', 1], ['x+\\ln\\left(1+e^x\\right)', 1], ['x', 1], ['\\ln\\left(1+e^{x}\\right)-1', 1]],
        expl: `${m(ln(fr('e^x', '1+e^x')))} ${m(T`=-\ln\left(\dfrac{1+e^x}{e^x}\right)=-\ln\left(e^{-x}+1\right)`)}.` };
    },
    () => {                                     // somme de fractions de même dénominateur : e^x/(1+e^x) + a/(1+e^x)
      const a = alea(2, 6);
      return { enonce: `Pour tout réel ${m('x')}, ${m(`${fr('e^x', '1+e^x')}+${fr(String(a), '1+e^x')}`)} est égal à :`, bonne: fr(`e^x+${a}`, '1+e^x'), v: NaN, f: `${fr('e^x', '1+e^x')}+${fr(String(a), '1+e^x')}`,
        faux: [[fr(`e^x+${a}`, `2+2e^x`), 1], [fr(`${a}e^x`, '1+e^x'), 1], [fr(`e^x+${a}`, '\\left(1+e^x\\right)^2'), 1], [`1+${fr(String(a), '1+e^x')}`, 1], [fr(`e^x+${a}`, '1')], 1].slice(0, 5),
        expl: `Les deux fractions ont le même dénominateur : on additionne les numérateurs.` };
    }
  );
  // modèles supplémentaires (18/10/2026) : identités valables pour tout réel x
  MODELES_CALCUL[3].push(
    () => {
      const f = ln('e^{2x}+2e^{x}+1');
      return { enonce: `Pour tout réel ${m('x')}, ${m(f)} est égal à :`, bonne: '2\\ln\\left(1+e^{x}\\right)', v: NaN, f,
        faux: [['\\ln\\left(1+e^{2x}\\right)', 1], ['\\ln 2+2\\ln\\left(1+e^{x}\\right)', 1], ['2x+\\ln\\left(1+e^{x}\\right)', 1], ['\\ln\\left(1+e^{x}\\right)', 1], ['2x+2\\ln 2', 1]],
        expl: `${m(T`e^{2x}+2e^{x}+1=\left(e^{x}+1\right)^2`)}, donc ${m(f)} ${m(T`=\ln\left(\left(1+e^{x}\right)^2\right)=2\ln\left(1+e^{x}\right)`)}.` };
    },
    () => {
      const f = fr('e^{x}-e^{-x}', 'e^{x}+e^{-x}');
      return { enonce: `Pour tout réel ${m('x')}, ${m(f)} est égal à :`, bonne: fr('e^{2x}-1', 'e^{2x}+1'), v: NaN, f,
        faux: [[fr('e^{2x}+1', 'e^{2x}-1'), 1], [fr('e^{x}-1', 'e^{x}+1'), 1], [fr('1-e^{2x}', '1+e^{2x}'), 1], [fr('e^{2x}-1', 'e^{2x}-1').replace('e^{2x}-1}{e^{2x}-1', 'e^{2x}-1}{e^{x}+1'), 1], [fr('e^{2x}-1', '2e^{x}'), 1]],
        expl: `On multiplie le numérateur et le dénominateur par ${m('e^{x}')} : ${m(T`\dfrac{e^{2x}-1}{e^{2x}+1}`)}.` };
    },
    () => {
      const a = aleaParmi([2, 3, 4, 5, 6]), f = `e^{x+\\ln ${a}}`;
      return { enonce: `Pour tout réel ${m('x')}, ${m(f)} est égal à :`, bonne: `${a}e^{x}`, v: NaN, f,
        faux: [[`e^{x}+${a}`, 1], [`e^{x}+\\ln ${a}`, 1], [`e^{${a}x}`, 1], [`\\ln ${a}\\,e^{x}`, 1], [`x+${a}`, 1]],
        expl: `${m(T`e^{x+\ln a}=e^{x}\times e^{\ln a}=ae^{x}`)} avec ${m(`a=${a}`)}.` };
    },
    () => {
      const a = aleaParmi([2, 3, 4, 5, 6]), f = `e^{2x-\\ln ${a}}`;
      return { enonce: `Pour tout réel ${m('x')}, ${m(f)} est égal à :`, bonne: fr('e^{2x}', String(a)), v: NaN, f,
        faux: [[`e^{2x}-${a}`, 1], [fr('e^{2x}', `\\ln ${a}`), 1], [fr('e^{x}', String(a)), 1], [`${a}e^{2x}`, 1], [`e^{2x}-\\ln ${a}`, 1]],
        expl: `${m(T`e^{2x-\ln a}=\dfrac{e^{2x}}{e^{\ln a}}=\dfrac{e^{2x}}{a}`)} avec ${m(`a=${a}`)}.` };
    },
    () => {
      const f = ln(fr('e^{x}+1', 'e^{x}'));
      return { enonce: `Pour tout réel ${m('x')}, ${m(f)} est égal à :`, bonne: '\\ln\\left(1+e^{-x}\\right)', v: NaN, f,
        faux: [['\\ln\\left(1+e^{x}\\right)', 1], ['x-\\ln\\left(1+e^{x}\\right)', 1], ['\\ln\\left(1+e^{x}\\right)-1', 1], ['-\\ln\\left(1+e^{-x}\\right)', 1], ['1+e^{-x}', 1]],
        expl: `${m(T`\dfrac{e^{x}+1}{e^{x}}=1+e^{-x}`)}, donc ${m(f)} ${m(T`=\ln\left(1+e^{-x}\right)`)}.` };
    },
    () => {
      const f = T`\left(e^{x}+e^{-x}\right)^2-\left(e^{x}-e^{-x}\right)^2`;
      return { enonce: `Pour tout réel ${m('x')}, ${m(f)} est égal à :`, bonne: '4', v: NaN, f,
        faux: [['2', 1], ['2e^{2x}', 1], ['4e^{2x}', 1], ['0', 1], ['2e^{x}', 1]],
        expl: `${m(T`(a+b)^2-(a-b)^2=4ab`)} avec ${m('a=e^{x}')} et ${m('b=e^{-x}')} : ${m(T`4e^{x}e^{-x}=4`)}.` };
    },
    () => {
      const f = ln('e^{x}\\sqrt{e}');
      return { enonce: `Pour tout réel ${m('x')}, ${m(f)} est égal à :`, bonne: T`x+\dfrac{1}{2}`, v: NaN, f,
        faux: [['x+\\sqrt{e}', 1], [fr('x', '2'), 1], [fr('x+1', '2'), 1], ['x+e', 1], ['x\\sqrt{e}', 1]],
        expl: `${m(T`\ln\left(e^{x}\sqrt{e}\right)=\ln\left(e^{x}\right)+\ln\left(e^{1/2}\right)=x+\dfrac{1}{2}`)}.` };
    },
    () => {
      const a = aleaParmi([2, 3, 4, 5]), f = ln(`${a}e^{2x}`);
      return { enonce: `Pour tout réel ${m('x')}, ${m(f)} est égal à :`, bonne: `2x+\\ln ${a}`, v: NaN, f,
        faux: [[`2x\\ln ${a}`, 1], [`2x+${a}`, 1], [`x+2\\ln ${a}`, 1], [`${a}+2x`, 1], [`2\\ln ${a}+2x`, 1]],
        expl: `${m(T`\ln\left(ae^{2x}\right)=\ln a+\ln\left(e^{2x}\right)=2x+\ln a`)} avec ${m(`a=${a}`)}.` };
    },
    () => {
      const a = aleaParmi([2, 3, 4]), f = fr(`e^{${a}x}-e^{-${a}x}`, '2');
      return { enonce: `Pour tout réel ${m('x')}, ${m(f)} est égal à :`, bonne: fr(`e^{${2 * a}x}-1`, `2e^{${a}x}`), v: NaN, f,
        faux: [[fr(`e^{${2 * a}x}+1`, `2e^{${a}x}`), 1], [fr(`e^{${2 * a}x}-1`, '2'), 1], [fr(`e^{${a}x}-1`, `2e^{${a}x}`), 1], [fr(`1-e^{${2 * a}x}`, `2e^{${a}x}`), 1], [fr(`e^{${2 * a}x}-1`, `e^{${a}x}`), 1]],
        expl: `On met au même dénominateur : ${m(`e^{-${a}x}=\\dfrac{1}{e^{${a}x}}`)}, donc ${m(f)} ${m(`=\\dfrac{e^{${2 * a}x}-1}{2e^{${a}x}}`)}.` };
    }
  );
  // équation différentielle : quelle équation vérifie la fonction donnée ?
  const equaDiffInverse = () => {
    const A = aleaParmi([2, 3, 4, -1, -2, -3, 5]), K = aleaParmi([1, 2, 3, 4, -1, -2, 5]), B = aleaParmi([2, 3, 4, -2, 5]);
    const f = `${K === 1 ? '' : K}e^{${coef(A)}x}`;
    const eq = a => `y'=${coef(a)}y`;
    return epure(qcm(`La fonction ${m('f')} définie sur ${m(IR)} par ${m(`f(x)=${f}`)} est solution d'une des équations différentielles suivantes. Laquelle ?`,
      texOpt(eq(A)), [-A, K, K * A, 1, A + 1].filter(a => a !== A).map(a => texOpt(eq(a))),
      { explication: `${m(`f'(x)=${K === 1 ? '' : K}\\times ${coef(A)}e^{${coef(A)}x}=${coef(A)}f(x)`.replace('\\times 1e', 'e'))} : ${m('f')} vérifie ${m(eq(A))}.`, meta: { odeInv: true, fTex: f, A } }));
  };
  const equaDiffBase1 = equaDiff;
  equaDiff = niveau => (niveau === 1 && Math.random() < 0.3 ? equaDiffInverse() : equaDiffBase1(niveau));

  // ==========================================================================
  // Enregistrement
  // ==========================================================================
  Automatismes.enregistrerBanque('fonctions', {
    titre: 'Exponentielle et logarithme',
    familles: {
      'derivees': famille({ nom: 'dérivées', niveaux: [1, 2, 3], base: retente(derivee) }),
      'primitives': famille({ nom: 'primitives', niveaux: [1, 2, 3], base: retente(primitive) }),
      'equations': famille({ nom: 'équations et inéquations', niveaux: [1, 2, 3], base: retente(equation) }),
      'limites': famille({ nom: 'limites', niveaux: [1, 2, 3], base: retente(limite) }),
      'tangente': famille({ nom: 'tangente', niveaux: [1, 2, 3], base: retente(tangente) }),
      'convexite': famille({ nom: 'convexité et points d’inflexion', niveaux: [2, 3], base: retente(convexite) }),
      'calcul': famille({ nom: 'calcul avec ln et exp', niveaux: [1, 2, 3], base: retente(calcul) }),
      'equations-differentielles': famille({ nom: 'équations différentielles', niveaux: [1, 2, 3], base: retente(equaDiff) })
    }
  });
})();
