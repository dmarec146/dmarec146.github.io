'use strict';
// Assertions des phrases de méthode des « Détails » de correction (16/10/2026).
//
// Une phrase qui AFFIRME quelque chose (« on divise par un nombre négatif », « car la suite est arithmétique », « la valeur p est
// interdite »…) ne doit apparaître que dans un tirage où cette affirmation est vraie. Chaque assertion porte :
//   nom     : identifiant lisible (apparaît dans le rapport si l'assertion est violée) ;
//   motif   : expression régulière qui repère la ligne concernée (la ligne LaTeX complète du détail) ;
//   verifie : fonction (ligne, exercice, environnement) -> true (vraie), false (violée), null (ne s'applique pas à cette ligne).
// L'outil outils/details-correction/controle.js les applique à CHAQUE ligne de CHAQUE tirage (des milliers de contrôles par fiche).
//
// Contraintes : chaque fonction `verifie` est envoyée à la page sous forme de texte (toString) : elle doit être AUTONOME (aucune
// variable extérieure) ; elle peut utiliser `math` (math.js) et `document`. `environnement.texte(id)` renvoie le texte d'un élément de
// la fiche (par exemple l'énoncé commun « texte-12-9 »). Une assertion nouvelle s'accompagne d'une violation volontaire dans
// outils/phrases-details/essais-assertions.js, pour prouver qu'elle détecte bien l'erreur qu'elle vise.
module.exports = [
  {
    nom: 'on-divise-par-un-nombre-negatif',
    motif: /On divise par \}/,
    // le diviseur est un entier ou une fraction : « -3 », « -\dfrac{3}{2} »
    verifie: (l) => { const m = l.match(/\\text\{On divise par \}\s*(-?\d+|-\\dfrac\{\d+\}\{\d+\})\s*\\lt\s*0/); return m ? /^-[\d\\]/.test(m[1]) && !/^-0$/.test(m[1]) : false; }
  },
  {
    nom: 'la-suite-est-arithmetique',
    motif: /\(car \}\s*u_1\+u_3 = 2u_2/,
    verifie: (l, e, env) => /arithmétique/.test(env.texte('texte-12-9'))
  },
  {
    nom: 'la-raison-est-non-nulle',
    motif: /r \\neq 0 \\text\{ donc/,
    verifie: (l, e, env) => /non nulle/.test(env.texte('texte-12-9'))
  },
  {
    nom: 'nombre-de-termes-d-une-somme-de-u0-a-uN',
    motif: /Il y a \} \d+\+1 = \d+/,
    verifie: (l, e) => {
      const m = l.match(/Il y a \}\s*(\d+)\+1 = (\d+)/), n = String(e.enonce).match(/u_\{(\d+)\}/g);
      if (!m || !n) return false;
      const N = Number(n[n.length - 1].match(/\d+/)[0]);
      return Number(m[2]) === Number(m[1]) + 1 && Number(m[1]) === N;
    }
  },
  {
    nom: 'la-valeur-citee-annule-le-denominateur',
    motif: /\(valeur interdite\)|est exclue dans tous les cas/,
    verifie: (l, e) => {
      const den = String(e.enonce).match(/\\dfrac\{[^{}]*\}\{([^{}]*)\}/);
      const val = '(-?(?:\\\\dfrac\\{\\d+\\}\\{\\d+\\}|\\d+))';
      const p = l.match(new RegExp('x = ' + val + ' \\\\text\\{ \\(valeur interdite\\)')) || l.match(new RegExp('[Ll]a valeur interdite \\}\\s*' + val + '\\s*\\\\text\\{ est exclue dans tous les cas'));
      if (!den || !p) return false;
      const nombre = p[1].replace(/(-?)\\dfrac\{(\d+)\}\{(\d+)\}/, (m, s, n, d) => s + '(' + n + '/' + d + ')');
      return Math.abs(math.evaluate(den[1].replace(/x/g, '(' + nombre + ')'))) < 1e-9;
    }
  },
  {
    nom: 'le-sens-annonce-est-celui-de-l-enonce',
    motif: /pour lesquelles (?:le quotient|l'expression) est \}/,
    verifie: (l, e) => {
      const norme = (s) => (/leqslant/.test(s) ? '<=' : /geqslant/.test(s) ? '>=' : /(lt|<)/.test(s) ? '<' : '>');
      const dansLigne = l.match(/pour lesquelles (?:le quotient|l'expression) est \}\s*(\\leqslant|\\geqslant|\\lt|\\gt|<|>)/), rels = String(e.enonce).match(/\\leqslant|\\geqslant|\\lt|\\gt|<|>/g);
      return !!(dansLigne && rels && rels.length === 1) && norme(dansLigne[1]) === norme(rels[0]);
    }
  },
  {
    nom: 'la-valeur-rejetee-est-negative',
    motif: /donc \}\s*-?\d+\s*\\text\{ est rejeté/,
    verifie: (l) => { const m = l.match(/donc \}\s*(-?\d+)\s*\\text\{ est rejeté/); return m ? Number(m[1]) < 0 : false; }
  },
  {
    nom: 'l-indice-cite-est-pair',
    motif: /Comme \}\s*\d+ \\text\{ est pair/,
    verifie: (l) => { const m = l.match(/Comme \}\s*(\d+) \\text\{ est pair, \} q\^\{(\d+)\}/); return m ? Number(m[1]) % 2 === 0 && m[1] === m[2] : false; }
  },
  {
    nom: 'le-coefficient-annonce-est-negatif',
    motif: /\\text\{avec \} a = /,
    verifie: (l) => /\\text\{avec \} a = -.*\\lt\s*0 \\text\{ et \}/.test(l)
  },
  {
    nom: 'la-comparaison-ecrite-est-vraie',
    // ligne réduite à « A > B » ou « A < B », A et B nombres ou fractions (« 35 > 24 », « \dfrac{5}{6} > \dfrac{3}{4} », « \dfrac{7}{3} > 2 »)
    motif: /^\s*(?:\\dfrac\{\d+\}\{\d+\}|\d[\d\\,]*)\s*(?:>|\\lt|\\leqslant|\\geqslant)\s*(?:\\dfrac\{\d+\}\{\d+\}|\d[\d\\,]*)\s*$/,
    verifie: (l) => {
      const f = (s) => s.replace(/\\,/g, '').replace(/\\dfrac\{(\d+)\}\{(\d+)\}/g, '(($1)/($2))');
      const m = l.trim().match(/^(.*?)\s*(>|\\lt|\\leqslant|\\geqslant)\s*(.*)$/);
      if (!m) return false;
      // grands entiers : comparés en BigInt quand les deux côtés sont des entiers
      const ent = (s) => /^\d+$/.test(s.replace(/\\,/g, '').trim());
      if (ent(m[1]) && ent(m[3])) {
        const a = BigInt(m[1].replace(/\\,/g, '').trim()), b = BigInt(m[3].replace(/\\,/g, '').trim());
        return m[2] === '>' ? a > b : m[2] === '\\lt' ? a < b : m[2] === '\\leqslant' ? a <= b : a >= b;
      }
      const a = math.evaluate(f(m[1])), b = math.evaluate(f(m[3]));
      return m[2] === '>' ? a > b : m[2] === '\\lt' ? a < b : m[2] === '\\leqslant' ? a <= b : a >= b;
    }
  },
  {
    nom: 'le-facteur-annonce-n-est-ni-2-ni-5',
    motif: /Le dénominateur a le facteur premier \} \d+ \\text\{, autre que 2 et 5/,
    verifie: (l, e) => {
      const p = Number((l.match(/Le dénominateur a le facteur premier \} (\d+) /) || [])[1]);
      const fr = String(e.enonce).match(/\\dfrac\{(\d+)\}\{(\d+)\}/);
      if (!p || !fr) return false;
      const pgcd = (x, y) => (y ? pgcd(y, x % y) : x);
      const br = Number(fr[2]) / pgcd(Number(fr[1]), Number(fr[2]));
      let premier = p > 1; for (let k = 2; k * k <= p; k++) if (p % k === 0) premier = false;
      return premier && p !== 2 && p !== 5 && br % p === 0;
    }
  },
  {
    nom: 'le-denominateur-annonce-est-premier',
    motif: /Le dénominateur \} \d+ \\text\{ est un nombre premier/,
    verifie: (l, e) => {
      const p = Number((l.match(/Le dénominateur \} (\d+) /) || [])[1]);
      const fr = String(e.enonce).match(/\\dfrac\{(\d+)\}\{(\d+)\}/);
      if (!p || !fr) return false;
      const pgcd = (x, y) => (y ? pgcd(y, x % y) : x);
      let premier = p > 1; for (let k = 2; k * k <= p; k++) if (p % k === 0) premier = false;
      return premier && Number(fr[2]) / pgcd(Number(fr[1]), Number(fr[2])) === p;
    }
  },
  {
    nom: 'seuls-2-et-5-apparaissent',
    motif: /Le dénominateur \} \d+ \\text\{ n'a pas d'autre facteur premier que 2 ou 5/,
    verifie: (l, e) => {
      const fr = String(e.enonce).match(/\\dfrac\{(\d+)\}\{(\d+)\}/), cite = Number((l.match(/Le dénominateur \} (\d+) /) || [])[1]);
      if (!fr || !cite) return false;
      const pgcd = (x, y) => (y ? pgcd(y, x % y) : x);
      let br = Number(fr[2]) / pgcd(Number(fr[1]), Number(fr[2]));
      if (br !== cite) return false;
      while (br % 2 === 0) br /= 2;
      while (br % 5 === 0) br /= 5;
      return br === 1;
    }
  },
  {
    nom: 'la-periode-decimale-est-exacte',
    // « \dfrac{1}{7} = 0{,}\overline{142857} » : chiffres recalculés par la division posée
    motif: /\\overline\{\d+\}/,
    verifie: (l) => {
      const m = l.match(/^\\dfrac\{1\}\{(\d+)\} = 0\{,\}\\overline\{(\d+)\}$/);
      if (!m) return null;     // autre ecriture d'un developpement periodique (voir les assertions suivantes)
      const b = Number(m[1]);
      let reste = 1, chiffres = '', n = 0;
      do { reste *= 10; chiffres += Math.floor(reste / b); reste %= b; n++; } while (reste !== 1 && n < 500);
      return chiffres === m[2];
    }
  },
  {
    nom: 'decalage-periodique-exact',
    // « 100x = 18{,}\overline{18} » : multiplier x = 0,\overline{18} par 10^L (L = longueur de la période) donne P,\overline{P} avec P = 18
    motif: /^\d+x = \d+\{,\}\\overline\{\d+\}$/,
    verifie: (l, e) => {
      const m = l.match(/^(\d+)x = (\d+)\{,\}\\overline\{(\d+)\}$/), enonce = String(e.enonce).match(/0\{,\}\\overline\{(\d+)\}/);
      if (!m || !enonce) return false;
      const motif = enonce[1];
      return m[3] === motif && Number(m[1]) === Math.pow(10, motif.length) && Number(m[2]) === Number(motif);
    }
  },
  {
    nom: 'soustraction-periodique-exacte',
    // « 100x - x = 18{,}\overline{18} - 0{,}\overline{18} = 18 » : les deux développements ont la même période et la différence est P
    motif: /^\d+x - x = \d+\{,\}\\overline\{\d+\} - 0\{,\}\\overline\{\d+\} = \d+$/,
    verifie: (l, e) => {
      const m = l.match(/^(\d+)x - x = (\d+)\{,\}\\overline\{(\d+)\} - 0\{,\}\\overline\{(\d+)\} = (\d+)$/), enonce = String(e.enonce).match(/0\{,\}\\overline\{(\d+)\}/);
      if (!m || !enonce) return false;
      const motif = enonce[1];
      return m[3] === motif && m[4] === motif && Number(m[1]) === Math.pow(10, motif.length) && Number(m[2]) === Number(motif) && Number(m[5]) === Number(motif);
    }
  },
  {
    nom: 'la-reponse-oui-non-est-celle-de-l-exercice',
    motif: /\\text\{Réponse : (oui|non)\}/,
    verifie: (l, e) => {
      const m = l.match(/\\text\{Réponse : (oui|non)\}/);
      if (!m) return false;
      const attendu = typeof e.reponseOuiNon === 'boolean' ? (e.reponseOuiNon ? 'oui' : 'non') : e.reponse;
      return m[1] === attendu;
    }
  },
  {
    nom: 'aucun-reel-ne-convient-si-l-ensemble-est-vide',
    // « Aucun réel ne convient » n'est écrit que si la réponse attendue est l'ensemble vide
    motif: /Aucun réel ne convient/,
    verifie: (l, e) => !!e.intervalleSpec && e.intervalleSpec.type === 'vide'
  },
  {
    nom: 'inegalite-toujours-verifiee-si-l-ensemble-est-r',
    // « L'inégalité est toujours vérifiée » (|x-a| > -r) : la réponse attendue est ℝ
    motif: /toujours vérifiée/,
    verifie: (l, e) => !!e.intervalleSpec && e.intervalleSpec.type === 'tout'
  },
  {
    nom: 'inegalite-jamais-verifiee-si-l-ensemble-est-vide',
    // « L'inégalité n'est jamais vérifiée » (|x-a| < -r) : la réponse attendue est l'ensemble vide
    motif: /n'est jamais vérifiée/,
    verifie: (l, e) => !!e.intervalleSpec && e.intervalleSpec.type === 'vide'
  },
  {
    nom: 'equation-sans-solution-si-l-ensemble-est-vide',
    // « donc l'équation n'a pas de solution » : la réponse attendue est l'ensemble vide {}
    motif: /n'a pas de solution/,
    verifie: (l, e) => String(e.reponse).trim() === '{}'
  },
  {
    nom: 'aucun-point-de-la-courbe-si-aucun-antecedent',
    // « La courbe reste au-dessus / de la droite d'équation y = … / donc aucun point n'a pour ordonnée … » : la réponse attendue est l'ensemble vide
    motif: /La courbe reste au-dessus\}|aucun point n'a pour ordonnée/,
    verifie: (l, e) => String(e.reponse).trim() === '{}'
  },
  {
    nom: 'la-courbe-est-du-bon-cote-de-l-axe',
    // « de la courbe au-dessus (en dessous) de l'axe des abscisses » : f(x) > 0 ou >= 0 (au-dessus), f(x) < 0 ou <= 0 (en dessous)
    // « sur ou au-dessus » (resp. « sur ou en dessous ») pour une inégalité large (>= 0, <= 0), « au-dessus » (resp. « en dessous ») pour une inégalité stricte
    motif: /de la courbe (?:sur ou )?(?:au-dessus|en dessous)/,
    verifie: (l, e) => {
      const m = l.match(/de la courbe (sur ou )?(au-dessus|en dessous)/), r = String(e.enonce).match(/\\(gt|geqslant|lt|leqslant)/);
      if (!m || !r) return false;
      const large = r[1] === 'geqslant' || r[1] === 'leqslant';
      return (m[2] === 'au-dessus') === (r[1] === 'gt' || r[1] === 'geqslant') && !!m[1] === large;
    }
  },
  {
    nom: 'la-droite-citee-est-celle-de-l-enonce',
    // « de la droite y = 1{,}5 » : le niveau k de l'inéquation f(x) op k
    motif: /^\\text\{de la droite \} y = /,
    verifie: (l, e) => {
      const m = l.match(/y = (-?[\d{},]+)$/), k = String(e.enonce).match(/\\(?:gt|geqslant|lt|leqslant)\s*(-?[\d,]+)/);
      const n = (s) => String(s).replace(/\{,\}/g, '.').replace(',', '.');
      return !!(m && k) && n(m[1]) === n(k[1]);
    }
  },
  {
    nom: 'la-courbe-entre-les-droites-est-stricte-ou-large',
    // « de la courbe entre » (inégalités strictes) / « de la courbe sur ou entre » (inégalités larges)
    motif: /de la courbe (?:sur ou )?entre\}/,
    verifie: (l, e) => { const m = l.match(/de la courbe (sur ou )?entre\}/); return !!m && (!!m[1]) === /leqslant/.test(String(e.enonce)); }
  },
  {
    nom: 'les-droites-citees-sont-celles-de-l-enonce',
    // « les droites y = 1{,}5 et y = 2 » : k1 et k2 de l'encadrement k1 op f(x) op k2
    motif: /^\\text\{les droites \} y = /,
    verifie: (l, e) => {
      const m = l.match(/y = (-?[\d{},]+) \\text\{ et \} y = (-?[\d{},]+)$/), k = String(e.enonce).match(/\\\((-?[\d,]+)\\(?:lt|leqslant)\\,f\(x\)\\(?:lt|leqslant)(-?[\d,]+)\\\)/);
      const n = (s) => String(s).replace(/\{,\}/g, '.').replace(',', '.');
      return !!(m && k) && n(m[1]) === n(k[1]) && n(m[2]) === n(k[2]);
    }
  },
  {
    nom: 'la-courbe-de-f-est-du-bon-cote-de-celle-de-g',
    // « est en dessous (au-dessus) de celle de g » : f(x) < g(x) ou f(x) - g(x) < 0 (en dessous), > (au-dessus)
    motif: /est (?:en dessous|au-dessus) de celle de/,
    verifie: (l, e) => {
      const m = l.match(/est (en dessous|au-dessus) de celle de/), r = String(e.enonce).match(/f\(x\)\\(lt|gt)\s*g\(x\)|f\(x\)-g\(x\)\\(lt|gt)\s*0/);
      if (!m || !r) return false;
      return (m[1] === 'en dessous') === ((r[1] || r[2]) === 'lt');
    }
  },
  {
    nom: 'la-courbe-coupe-l-axe-aux-solutions',
    // « en -2 et 2 » : les deux solutions de l'équation f(x) = 0 attendues
    motif: /^\\text\{en \} -?\d+ \\text\{ et \} -?\d+$/,
    verifie: (l, e) => {
      const m = l.match(/^\\text\{en \} (-?\d+) \\text\{ et \} (-?\d+)$/), att = String(e.reponse).replace(/[{}]/g, '').split(';').map(Number).sort((p, q) => p - q);
      return !!m && att.length === 2 && Number(m[1]) === att[0] && Number(m[2]) === att[1];
    }
  },
  {
    nom: 'la-droite-est-du-bon-cote-de-l-axe',
    // « La droite est au-dessus (en dessous) de l'axe » : le sens demandé par l'énoncé (« : au-dessus » ou « : en dessous »)
    motif: /^\\text\{est (?:au-dessus|en dessous) de l'axe des abscisses\}$/,
    verifie: (l, e) => { const m = l.match(/^\\text\{est (au-dessus|en dessous) de l'axe des abscisses\}$/), r = String(e.enonce).match(/: (au-dessus|en dessous)\s*$/); return !!(m && r) && m[1] === r[1]; }
  },
  {
    nom: 'le-signe-de-f-est-celui-de-la-position',
    // « lorsque f(x) > 0 » pour « au-dessus », « lorsque f(x) < 0 » pour « en dessous »
    motif: /^\\text\{lorsque \} f\(x\) \\(?:gt|lt) 0$/,
    verifie: (l, e) => { const m = l.match(/^\\text\{lorsque \} f\(x\) \\(gt|lt) 0$/), r = String(e.enonce).match(/: (au-dessus|en dessous)\s*$/); return !!(m && r) && (m[1] === 'gt') === (r[1] === 'au-dessus'); }
  },
  {
    nom: 'droites-paralleles-distinctes-si-aucun-point',
    // phrases de deux droites parallèles distinctes : seulement quand la réponse attendue est « aucun point d'intersection »
    motif: /^\\text\{Les deux droites ont le même\}$|^\\text\{coefficient directeur\}$|mais des ordonnées à l'origine différentes|Elles sont parallèles et distinctes|aucun point d'intersection\}$/,
    verifie: (l, e) => e.aucunPoint === true
  },
  {
    nom: 'determinant-non-nul-si-une-unique-solution',
    // « Ce nombre est non nul » : ab' - a'b du système de l'énoncé
    motif: /\\text\{Le nombre \} ab'-a'b \\text\{ est non nul\}$|^\\text\{donc une unique solution\}$/,
    verifie: (l, e) => {
      const m = String(e.enonce).match(/begin\{cases\}(.+?)\\\\(.+?)\\end\{cases\}/); if (!m) return false;
      const eq = (t) => { const q = t.match(/^(-?\d*)x([+-]\d*)y=(-?\d+)$/); if (!q) return null; const c = (v) => (v === '' ? 1 : v === '-' ? -1 : Number(v)); return { a: c(q[1]), b: q[2] === '+' ? 1 : q[2] === '-' ? -1 : Number(q[2]), c: Number(q[3]) }; };
      const e1 = eq(m[1]), e2 = eq(m[2]); return !!(e1 && e2) && e1.a * e2.b - e2.a * e1.b !== 0;
    }
  },
  {
    nom: 'determinant-nul-annonce',
    // « Ce nombre est nul » : ab' - a'b = 0
    motif: /^\\text\{Le nombre \} ab'-a'b \\text\{ est nul\}$/,
    verifie: (l, e) => {
      const m = String(e.enonce).match(/begin\{cases\}(.+?)\\\\(.+?)\\end\{cases\}/); if (!m) return false;
      const eq = (t) => { const q = t.match(/^(-?\d*)x([+-]\d*)y=(-?\d+)$/); if (!q) return null; const c = (v) => (v === '' ? 1 : v === '-' ? -1 : Number(v)); return { a: c(q[1]), b: q[2] === '+' ? 1 : q[2] === '-' ? -1 : Number(q[2]), c: Number(q[3]) }; };
      const e1 = eq(m[1]), e2 = eq(m[2]); return !!(e1 && e2) && e1.a * e2.b - e2.a * e1.b === 0;
    }
  },
  {
    nom: 'aucune-solution-si-seconds-membres-non-proportionnels',
    // « Ce nombre n'est pas nul : aucune solution » : ab' - a'b = 0 et cb' - c'b != 0
    motif: /Seul \} ab'-a'b \\text\{ est nul\}$|^\\text\{donc aucune solution\}$/,
    verifie: (l, e) => {
      const m = String(e.enonce).match(/begin\{cases\}(.+?)\\\\(.+?)\\end\{cases\}/); if (!m) return false;
      const eq = (t) => { const q = t.match(/^(-?\d*)x([+-]\d*)y=(-?\d+)$/); if (!q) return null; const c = (v) => (v === '' ? 1 : v === '-' ? -1 : Number(v)); return { a: c(q[1]), b: q[2] === '+' ? 1 : q[2] === '-' ? -1 : Number(q[2]), c: Number(q[3]) }; };
      const e1 = eq(m[1]), e2 = eq(m[2]); return !!(e1 && e2) && e1.a * e2.b - e2.a * e1.b === 0 && e1.c * e2.b - e2.c * e1.b !== 0;
    }
  },
  {
    nom: 'infinite-de-solutions-si-seconds-membres-proportionnels',
    // « Ce nombre est nul : une infinité de solutions » : ab' - a'b = 0 et cb' - c'b = 0
    motif: /Les deux nombres sont nuls\}$|^\\text\{donc une infinité de solutions\}$/,
    verifie: (l, e) => {
      const m = String(e.enonce).match(/begin\{cases\}(.+?)\\\\(.+?)\\end\{cases\}/); if (!m) return false;
      const eq = (t) => { const q = t.match(/^(-?\d*)x([+-]\d*)y=(-?\d+)$/); if (!q) return null; const c = (v) => (v === '' ? 1 : v === '-' ? -1 : Number(v)); return { a: c(q[1]), b: q[2] === '+' ? 1 : q[2] === '-' ? -1 : Number(q[2]), c: Number(q[3]) }; };
      const e1 = eq(m[1]), e2 = eq(m[2]); return !!(e1 && e2) && e1.a * e2.b - e2.a * e1.b === 0 && e1.c * e2.b - e2.c * e1.b === 0;
    }
  },
  {
    nom: 'f-definie-sur-r-pour-une-fonction-de-reference',
    // « On peut calculer f(x) pour tout réel x » : seulement pour 2x-3, x², x³ ou |x| (pas 1/x ni √x)
    motif: /On peut calculer \} f\(x\) \\text\{ pour tout réel/,
    verifie: (l, e) => /f\(x\)=(?:2x-3|x\^2|x\^3|\|x\|)\\\)$/.test(String(e.enonce))
  },
  {
    nom: 'monotonie-du-carre-du-bon-cote',
    // « La fonction f est croissante sur [v ; +oo[ » (nombres à droite du sommet) ou « décroissante sur ]-oo ; v] » (à gauche)
    motif: /^\\text\{La fonction \} f \\text\{ est (?:croissante|décroissante) sur \} /,
    verifie: (l, e) => {
      const m = l.match(/^\\text\{La fonction \} f \\text\{ est (croissante|décroissante) sur \} (?:\[(-?\d+)\\,;\\,\+\\infty\[|\]-\\infty\\,;\\,(-?\d+)\])$/);
      const f = String(e.enonce).match(/\(x([+-]\d+)\)\^2/), b = String(e.enonce).match(/(-?\d+)\\lt (?:a|x_1)\\lt (-?\d+)/);
      if (!m || !f || !b) return false;
      const v = -Number(f[1]), droite = Number(b[1]) >= v;
      return (m[1] === 'croissante') === droite && Number(m[2] !== undefined ? m[2] : m[3]) === v && (m[1] === 'croissante') === (m[2] !== undefined);
    }
  },
  {
    nom: 'monotonie-de-l-inverse-du-bon-cote',
    // « La fonction inverse est décroissante sur ]0 ; +oo[ » si x_1 > 0, sur ]-oo ; 0[ si x_1 < 0
    motif: /^\\text\{sur \} \](?:0\\,;\\,\+\\infty|-\\infty\\,;\\,0)\[$/,
    verifie: (l, e) => {
      const m = l.match(/^\\text\{sur \} (\]0\\,;\\,\+\\infty\[|\]-\\infty\\,;\\,0\[)$/), x = String(e.enonce).match(/x_1=(-?\d+)/);
      return !!(m && x) && (m[1] === ']0\\,;\\,+\\infty[') === (Number(x[1]) > 0);
    }
  },
  {
    nom: 'monotonie-de-l-homographique-du-bon-cote',
    // « La fonction g est décroissante sur ]v ; +oo[ » (x_1 à droite de la valeur interdite v = -c) ou « ]-oo ; v[ » (à gauche)
    motif: /^\\text\{La fonction \} g \\text\{ est décroissante sur \} /,
    verifie: (l, e) => {
      const m = l.match(/sur \} (?:\](-?\d+)\\,;\\,\+\\infty\[|\]-\\infty\\,;\\,(-?\d+)\[)$/), g = String(e.enonce).match(/\\dfrac\{1\}\{x([+-]\d+)\}/), x = String(e.enonce).match(/x_1=(-?\d+)/);
      if (!m || !g || !x) return false;
      const v = -Number(g[1]);
      return Number(m[1] !== undefined ? m[1] : m[2]) === v && (m[1] !== undefined) === (Number(x[1]) > v);
    }
  },
  {
    nom: 'le-maximum-annonce-est-celui-de-l-enonce',
    // « donc l'aire est au plus 36 » et « avec égalité pour x = 6 » : les deux valeurs de la réponse attendue (x ; aire)
    motif: /^\\text\{donc l'aire est au plus \} \d+$|^\\text\{avec égalité pour \} x = \d+$/,
    verifie: (l, e) => {
      const r = String(e.reponse).match(/^\((\d+);(\d+)\)$/); if (!r) return false;
      const a = l.match(/au plus \} (\d+)$/), b = l.match(/égalité pour \} x = (\d+)$/);
      return a ? a[1] === r[2] : !!b && b[1] === r[1];
    }
  },
  {
    nom: 'la-longueur-de-periode-annoncee-est-exacte',
    // « \text{Période de } 6 \text{ chiffres} » : longueur de la période de 1/b (b lu dans l'énoncé)
    motif: /\\text\{Période de \} \d+ \\text\{ chiffres?\}/,
    verifie: (l, e) => {
      const L = Number((l.match(/Période de \} (\d+) /) || [])[1]), b = Number((String(e.enonce).match(/\\dfrac\{1\}\{(\d+)\}/) || [])[1]);
      if (!L || !b) return false;
      let reste = 1, n = 0;
      do { reste = (reste * 10) % b; n++; } while (reste !== 1 && n < 500);
      const pluriel = /chiffres\}$/.test(l.trim());
      return n === L && pluriel === (L > 1);
    }
  },
  {
    nom: 'les-unites-se-repetent-tous-les-4-exposants',
    motif: /les chiffres des unités se répètent de 4 en 4/,
    verifie: (l, e) => {
      const a = Number((String(e.enonce).match(/\\\(\s*(\d+)\^\{/) || [])[1]);
      if (!a) return false;
      const u = (k) => { let r = 1; for (let i = 0; i < k; i++) r = (r * a) % 10; return r; };
      for (let k = 1; k <= 8; k++) if (u(k) !== u(k + 4)) return false;
      return true;
    }
  },
  {
    nom: 'la-puissance-finit-comme-sa-reduite',
    motif: /\\text\{Donc \} \d+\^\{[\d\\,]+\} \\text\{ finit comme/,
    verifie: (l, e) => {
      const m = l.match(/Donc \} (\d+)\^\{([\d\\,]+)\} \\text\{ finit comme \} (\d+)(?:\^\{(\d+)\})?/);
      if (!m) return false;
      const a = Number(m[1]), N = Number(m[2].replace(/\\,/g, '')), a2 = Number(m[3]), r = m[4] ? Number(m[4]) : 1;
      if (a !== a2 || r < 1 || r > 4) return false;
      const u = (k) => { let x = 1; for (let i = 0; i < k; i++) x = (x * a) % 10; return x; };
      return u(N) === u(r);
    }
  },
  {
    nom: 'le-signe-de-x-est-celui-de-l-enonce',
    motif: /\\text\{Comme \} x\s*(?:\\lt|>)\s*0/,
    verifie: (l, e) => {
      const dansLigne = (l.match(/\\text\{Comme \} x\s*(\\lt|>)\s*0/) || [])[1], dansEnonce = (String(e.enonce).match(/x\s*(<|>)\s*0/) || [])[1];
      if (!dansLigne || !dansEnonce) return false;
      const resultat = /\|x\| = -x$/.test(l.trim());
      return (dansLigne === '>') === (dansEnonce === '>') && resultat === (dansEnonce === '<');
    }
  },
  {
    nom: 'a-puissance-5-finit-comme-a',
    motif: /\\text\{Comme \} \d+\^\{5\} \\text\{ finit comme \} \d+/,
    verifie: (l) => {
      const m = l.match(/\\text\{Comme \} (\d+)\^\{5\} \\text\{ finit comme \} (\d+)/);
      if (!m || m[1] !== m[2]) return false;
      const a = Number(m[1]);
      let x = 1; for (let i = 0; i < 5; i++) x = (x * a) % 10;
      return x === a % 10;
    }
  },
  {
    nom: 'm-n-est-pas-un-carre-parfait',
    motif: /n'est pas un carré parfait/,
    verifie: (l) => {
      const m = l.match(/Comme \} (\d+) \\text\{ n'est pas un carré parfait/);
      if (!m) return false;
      const n = Number(m[1]);
      return n >= 2 && Math.pow(Math.round(Math.sqrt(n)), 2) !== n;
    }
  },
  {
    nom: 'le-coefficient-est-non-nul-et-la-racine-irrationnelle',
    // « \text{et } 28 \neq 0 \text{, donc } 28\sqrt{7} \text{ est irrationnel} »
    motif: /\\text\{et \} -?\d+ \\neq 0 \\text\{, donc \}/,
    verifie: (l) => {
      const m = l.match(/\\text\{et \} (-?\d+) \\neq 0 \\text\{, donc \} (-?\d*)\\sqrt\{(\d+)\} \\text\{ est irrationnel/);
      if (!m) return false;
      const c = Number(m[1]), n = Number(m[3]), cc = m[2] === '' ? 1 : m[2] === '-' ? -1 : Number(m[2]);
      return c !== 0 && c === cc && n >= 2 && Math.pow(Math.round(Math.sqrt(n)), 2) !== n;
    }
  },
  {
    nom: 'on-multiplie-par-un-nombre-negatif',
    motif: /\\text\{On multiplie par \} -?\d+ \\lt/,
    verifie: (l) => { const m = l.match(/\\text\{On multiplie par \}\s*(-?\d+)\s*\\lt\s*0/); return m ? Number(m[1]) < 0 : false; }
  },
  {
    nom: 'la-borne-inferieure-depasse-la-borne-superieure',
    // « \text{Comme } 5 \geqslant 3 \text{, aucun nombre ne convient} » : un nombre à la fois > p et < q n'existe pas si p >= q
    motif: /\\text\{Comme \} -?\d+ (?:\\geqslant|>) -?\d+ \\text\{, aucun nombre ne convient\}/,
    verifie: (l) => {
      const m = l.match(/\\text\{Comme \} (-?\d+) (\\geqslant|>) (-?\d+) \\text/);
      return m ? (m[2] === '>' ? Number(m[1]) > Number(m[3]) : Number(m[1]) >= Number(m[3])) : false;
    }
  },
  {
    nom: 'le-rang-du-quartile-est-l-entier-superieur',
    // « \dfrac{9}{4} = 2{,}25 \text{ donc le rang est } 3 » ou « \dfrac{3\times 9}{4} = 6{,}75 \text{ donc le rang est } 7 » : rang = n k / 4 arrondi à l'entier supérieur
    motif: /\\text\{ donc le rang est \}/,
    verifie: (l) => {
      const m = l.match(/\\dfrac\{(?:(\d+)\\times )?(\d+)\}\{4\} = (\d+(?:\{,\}\d+)?) \\text\{ donc le rang est \} (\d+)/);
      if (!m) return false;
      const k = m[1] ? Number(m[1]) : 1, n = Number(m[2]), v = Number(m[3].replace('{,}', '.')), r = Number(m[4]);
      return Math.abs(k * n / 4 - v) < 1e-9 && r === Math.ceil(v - 1e-9);
    }
  },
  {
    nom: 'les-numeros-pairs-ou-impairs-cites-sont-ceux-de-l-enonce',
    // « \text{Numéros pairs : } 2\,;\,4\,;\,6 » : la parité annoncée est celle de l'énoncé et la liste est complète
    motif: /\\text\{Numéros (?:pairs|impairs) : \}/,
    verifie: (l, e) => {
      const m = l.match(/\\text\{Numéros (pairs|impairs) : \} ([\d\\,;]+)$/), mot = String(e.enonce).match(/numéro (pair|impair)\b/);
      if (!m || !mot || m[1] !== mot[1] + 's') return false;
      const liste = m[2].split('\\,;\\,').map(Number), attendu = [1, 2, 3, 4, 5, 6].filter((v) => (v % 2 === 0) === (mot[1] === 'pair'));
      return liste.join(',') === attendu.join(',');
    }
  },
  {
    nom: 'les-numeros-superieurs-cites-sont-ceux-du-seuil-de-l-enonce',
    // « \text{Numéros } > 4 \text{ : } 5\,;\,6 »
    motif: /\\text\{Numéros \} > \d+ \\text\{ : \}/,
    verifie: (l, e) => {
      const m = l.match(/\\text\{Numéros \} > (\d+) \\text\{ : \} ([\d\\,;]+)$/), seuil = String(e.enonce).match(/strictement \S+ à (\d+)/);
      if (!m || !seuil || Number(m[1]) !== Number(seuil[1])) return false;
      return m[2].split('\\,;\\,').map(Number).join(',') === [1, 2, 3, 4, 5, 6].filter((v) => v > Number(m[1])).join(',');
    }
  },
  {
    nom: 'les-numeros-retenus-sont-pairs-ou-superieurs-au-seuil',
    // « \text{Numéros retenus : } 2\,;\,4\,;\,5\,;\,6 » : réunion des numéros pairs et des numéros strictement supérieurs au seuil de l'énoncé
    motif: /\\text\{Numéros retenus : \}/,
    verifie: (l, e) => {
      const m = l.match(/\\text\{Numéros retenus : \} ([\d\\,;]+)$/), seuil = String(e.enonce).match(/numéro pair, ou est strictement \S+ à (\d+)/);
      if (!m || !seuil) return false;
      return m[1].split('\\,;\\,').map(Number).join(',') === [1, 2, 3, 4, 5, 6].filter((v) => v % 2 === 0 || v > Number(seuil[1])).join(',');
    }
  },
  {
    nom: 'les-multiples-de-3-cites-sont-ceux-de-l-enonce',
    motif: /\\text\{Multiples de 3 : \}/,
    verifie: (l, e) => /multiple de 3/.test(String(e.enonce)) && /\\text\{Multiples de 3 : \} 3\\,;\\,6$/.test(l)
  },
  {
    nom: 'la-branche-citee-est-celle-de-l-enonce',
    // « \text{Probabilité de la branche qui mène à } C \text{ :} » (énoncé P(C)) ;
    // « \text{Branche qui part de } \overline{C} \text{ et mène à } S \text{ :} » (énoncé P_{\overline{C}}(S))
    motif: /\\text\{Probabilité de la branche qui mène à \}|\\text\{Branche qui part de \}/,
    verifie: (l, e) => {
      const simple = l.match(/\\text\{Probabilité de la branche qui mène à \} (\w+) \\text\{ :\}$/), cond = l.match(/\\text\{Branche qui part de \} (\\overline\{\w+\}|\w+) \\text\{ et mène à \} (\w+) \\text\{ :\}$/);
      if (simple) { const p = String(e.enonce).match(/probabilité \\\(P\((\w+)\)\\\)/); return !!p && p[1] === simple[1]; }
      if (cond) { const p = String(e.enonce).match(/probabilité \\\(P_\{(\\overline\{\w+\}|\w+)\}\((\w+)\)\\\)/); return !!p && p[1] === cond[1] && p[2] === cond[2]; }
      return false;
    }
  },
  {
    nom: 'le-chemin-multiplie-est-celui-de-l-enonce',
    // « \text{On multiplie le long du chemin } \overline{E} \text{ puis } R \text{ :} » (énoncé P(\overline{E} \cap R))
    motif: /\\text\{On multiplie le long du chemin \}/,
    verifie: (l, e) => {
      const m = l.match(/\\text\{On multiplie le long du chemin \} (\\overline\{\w+\}|\w+) \\text\{ puis \} (\w+) \\text\{ :\}$/), p = String(e.enonce).match(/\\\(P\((\\overline\{\w+\}|\w+) \\cap (\w+)\)\\\)/);
      return !!m && !!p && m[1] === p[1] && m[2] === p[2];
    }
  },
  {
    nom: 'les-deux-chemins-menent-a-l-evenement-de-l-enonce',
    // « \text{Deux chemins mènent à } R \text{ :} » (énoncé P(R))
    motif: /\\text\{Deux chemins mènent à \}/,
    verifie: (l, e) => {
      const m = l.match(/\\text\{Deux chemins mènent à \} (\w+) \\text\{ :\}$/), p = String(e.enonce).match(/\\\(P\((\w+)\)\\\)/);
      return !!m && !!p && m[1] === p[1];
    }
  },
  {
    nom: 'un-carre-n-est-jamais-negatif',
    // « \text{Un carré n'est jamais égal à } -20 » : le nombre cité est bien négatif
    motif: /\\text\{Un carré n'est jamais égal à \}/,
    verifie: (l) => { const m = l.match(/\\text\{Un carré n'est jamais égal à \} (-?\d+(?:\.\d+)?)$/); return !!m && Number(m[1]) < 0; }
  },
  {
    nom: 'le-sens-de-AE-est-celui-du-signe-de-k',
    // « \text{AE a le même sens que } AB » ou « \text{AE a le sens contraire de } AB » : selon le signe de k (réponse de l'exercice)
    motif: /\\text\{AE a le (?:même sens que|sens contraire de) \}/,
    verifie: (l, e) => { const k = math.evaluate(String(e.reponse)); return /même sens/.test(l) === (k > 0); }
  },
  {
    nom: 'la-longueur-de-AE-est-celle-de-la-valeur-absolue-de-k',
    // « \text{AE est } 2 \text{ fois aussi long que } AB », « \text{AE est } \dfrac{3}{2} \text{ fois aussi long que } AB », « \text{AE a la même longueur que } AB »
    motif: /\\text\{AE (?:est \} .* \\text\{ fois aussi long que \}|a la même longueur que \})/,
    verifie: (l, e) => {
      const k = Math.abs(math.evaluate(String(e.reponse)));
      if (/a la même longueur/.test(l)) return Math.abs(k - 1) < 1e-9;
      const m = l.match(/\\text\{AE est \} (\d+|\\dfrac\{\d+\}\{\d+\}) \\text\{ fois aussi long que \}/);
      if (!m) return false;
      return Math.abs(math.evaluate(m[1].replace(/\\dfrac\{(\d+)\}\{(\d+)\}/, '($1/$2)')) - k) < 1e-9 && Math.abs(k - 1) > 1e-9;
    }
  },
  {
    nom: 'la-propriete-annoncee-correspond-a-la-question-egaux-ou-opposes',
    // « \text{Égaux si mêmes coordonnées :} » pour une question « égaux », « \text{Opposés si coordonnées opposées :} » pour « opposés »
    motif: /\\text\{(?:Égaux si mêmes coordonnées|Opposés si coordonnées opposées) :\}/,
    verifie: (l, e) => (/Égaux/.test(l) ? /sont-ils égaux/.test(String(e.enonce)) : /sont-ils opposés/.test(String(e.enonce)))
  },
  {
    nom: 'la-regle-du-parallelogramme-est-au-sommet-commun',
    // « \text{Règle du parallélogramme en } C \text{ :} » : C est l'origine commune des deux vecteurs de l'énoncé
    motif: /\\text\{Règle du parallélogramme en \} [A-D] \\text\{ :\}/,
    verifie: (l, e) => {
      const m = l.match(/\\text\{Règle du parallélogramme en \} ([A-D]) \\text/), vs = [...String(e.enonce).matchAll(/overrightarrow\{([A-Z])([A-Z])\}/g)];
      return !!m && vs.length === 2 && vs[0][1] === m[1] && vs[1][1] === m[1] && vs[0][2] !== vs[1][2];
    }
  },
  {
    nom: 'le-milieu-cite-est-celui-de-l-enonce',
    // « \text{I est le milieu de } [AC] \text{ :} » : soit l'énoncé le dit (« I est le milieu du segment [AB] »), soit les deux vecteurs de l'énoncé
    // partent de I (ou arrivent en I) vers les extrémités X et Y citées
    motif: /\\text\{[IJ] est le milieu de \} \[[A-Z]{2}\]/,
    verifie: (l, e) => {
      const m = l.match(/\\text\{([IJ]) est le milieu de \} \[([A-Z])([A-Z])\]/), t = String(e.enonce);
      if (!m) return false;
      const [, P, X, Y] = m, direct = new RegExp(P + '(?:\\\\\\))? est le milieu (?:du segment|de) \\\\\\(\\[' + X + Y + '\\]\\\\\\)').test(t);
      const vs = [...t.matchAll(/overrightarrow\{([A-Z])([A-Z])\}/g)].map((x) => x[1] + x[2]);
      const ok = vs.length === 2 && ((vs[0] === P + X && vs[1] === P + Y) || (vs[0] === P + Y && vs[1] === P + X) || (vs[0] === X + P && vs[1] === Y + P) || (vs[0] === Y + P && vs[1] === X + P));
      return direct || ok;
    }
  },
  {
    nom: 'le-mot-egal-ou-different-correspond-a-la-relation',
    // « \text{Carrés égaux : } \dfrac{13}{4} = \dfrac{13}{4} », « \text{Sommes différentes : } 2 \neq 3 », « \text{Égalité vérifiée : } … » :
    // le mot annonce la vraie relation entre les deux valeurs écrites, et le signe est celui du mot
    motif: /\\text\{(?:Carrés|Sommes|Égalité|Pentes) [^{}]* : \}/,
    verifie: (l) => {
      const m = l.match(/\\text\{(?:Carrés|Sommes|Égalité|Pentes) (égaux|égales|vérifiée|différents|différentes|non vérifiée) : \} (.+?) (=|\\neq) (.+)$/);
      if (!m) return false;
      const val = (t) => math.evaluate(t.replace(/\\left|\\right/g, '').replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))'));
      const egalReel = Math.abs(val(m[2]) - val(m[4])) < 1e-9, annonce = /^(égaux|égales|vérifiée)$/.test(m[1]);
      return annonce === egalReel && (m[3] === '=') === egalReel;
    }
  },
  {
    nom: 'la-parabole-est-tournee-dans-le-sens-du-signe-du-coefficient',
    // « 3 \gt 0 \text{ : parabole tournée vers le haut} », « -\dfrac{1}{2} \lt 0 \text{ : parabole tournée vers le bas} »
    motif: /parabole tournée vers le (?:haut|bas)/,
    verifie: (l) => {
      const m = l.match(/^(-?(?:\\dfrac\{\d+\}\{\d+\}|\d+)) (\\gt|\\lt) 0 \\text\{ : parabole tournée vers le (haut|bas)\}$/);
      if (!m) return false;
      const v = math.evaluate(m[1].replace(/(-?)\\dfrac\{(\d+)\}\{(\d+)\}/, (x, s, n, d) => s + '(' + n + '/' + d + ')'));
      return (m[2] === '\\gt') === (v > 0) && (m[3] === 'haut') === (v > 0);
    }
  },
  {
    nom: 'la-comparaison-du-minimum-est-annoncee-vraie-ou-fausse-comme-elle-l-est',
    // « -\dfrac{3}{2} \geqslant 0 \text{ est faux} » : la comparaison du minimum à 0 est vraie ou fausse comme annoncé
    motif: /^-?(?:\\dfrac\{\d+\}\{\d+\}|\d+) (?:\\gt|\\geqslant) 0 \\text\{ est (?:vrai|faux)\}$/,
    verifie: (l) => {
      const m = l.match(/^(-?(?:\\dfrac\{\d+\}\{\d+\}|\d+)) (\\gt|\\geqslant) 0 \\text\{ est (vrai|faux)\}$/);
      if (!m) return false;
      const v = math.evaluate(m[1].replace(/(-?)\\dfrac\{(\d+)\}\{(\d+)\}/, (x, s, n, d) => s + '(' + n + '/' + d + ')'));
      return (m[3] === 'vrai') === (m[2] === '\\gt' ? v > 0 : v >= 0);
    }
  },
  {
    nom: 'la-conclusion-vrai-faux-est-celle-de-l-exercice',
    // « \text{L'inégalité est fausse pour } x \text{ égal à } 2 » ou « \text{L'inégalité est vraie pour tout réel } x » : conforme à estVrai
    motif: /\\text\{L'inégalité est (?:vraie pour tout réel|fausse pour) \}/,
    verifie: (l, e) => {
      const m = l.match(/^\\text\{L'inégalité est (vraie pour tout réel|fausse pour) \}/);
      return !!m && (m[1] === 'vraie pour tout réel') === !!e.estVrai;
    }
  },
  {
    nom: 'le-discriminant-annonce-le-bon-nombre-de-racines',
    // « 4 \gt 0 \text{ : deux racines distinctes} », « -\dfrac{17}{3} \lt 0 \text{ : aucune racine réelle} », « 0 \text{ : une racine double} » (le discriminant
    // nul est celui de la ligne « \Delta = … = 0 » qui précède)
    motif: /\\text\{ : (?:deux racines distinctes|aucune racine réelle|une racine double)\}$/,
    verifie: (l, e) => {
      const m = l.match(/^(-?(?:\\dfrac\{\d+\}\{\d+\}|\d+)) (\\gt|\\lt) 0 \\text\{ : (deux racines distinctes|aucune racine réelle)\}$/);
      if (m) {
        const v = math.evaluate(m[1].replace(/(-?)\\dfrac\{(\d+)\}\{(\d+)\}/, (x, s, n, d) => s + '(' + n + '/' + d + ')'));
        return v !== 0 && (m[2] === '\\gt') === (v > 0) && (m[3] === 'deux racines distinctes') === (v > 0);
      }
      if (!/^0 \\text\{ : une racine double\}$/.test(l)) return false;
      const L = (e.detail && e.detail.lignes) || [], i = L.indexOf(l);
      return i > 0 && /= 0$/.test(L[i - 1].trim());
    }
  },
  {
    nom: 'le-trinome-positif-pour-tout-reel-a-un-coefficient-positif-et-pas-de-racine',
    // « 1 \gt 0 \text{ : trinôme strictement positif} » : le coefficient dominant est positif et le discriminant a annoncé « aucune racine réelle »
    motif: /\\gt 0 \\text\{ : trinôme strictement positif\}$/,
    verifie: (l, e) => {
      const m = l.match(/^(-?(?:\\dfrac\{\d+\}\{\d+\}|\d+)) \\gt 0 \\text\{ : trinôme strictement positif\}$/);
      if (!m) return false;
      const v = math.evaluate(m[1].replace(/(-?)\\dfrac\{(\d+)\}\{(\d+)\}/, (x, s, n, d) => s + '(' + n + '/' + d + ')'));
      return v > 0 && ((e.detail && e.detail.lignes) || []).some((x) => /\\lt 0 \\text\{ : aucune racine réelle\}$/.test(x));
    }
  },
  {
    nom: 'le-coefficient-dominant-annonce-est-positif-et-est-celui-de-l-enonce',
    // « \dfrac{2}{3} \gt 0 \text{ donc} » (énoncé « P(x)=\dfrac{2}{3}x^2+… ») : le nombre est positif et c'est le coefficient de x^2 de P
    motif: /^-?(?:\\dfrac\{\d+\}\{\d+\}|\d+) \\gt 0 \\text\{ donc\}$/,
    verifie: (l, e) => {
      const m = l.match(/^(-?(?:\\dfrac\{\d+\}\{\d+\}|\d+)) \\gt 0 \\text\{ donc\}$/), p = String(e.enonce).match(/P\(x\)=((?:\\dfrac\{\d+\}\{\d+\})|\d*)x\^2/);
      if (!m || !p) return false;
      const val = (t) => (t === '' ? 1 : math.evaluate(t.replace(/(-?)\\dfrac\{(\d+)\}\{(\d+)\}/, (x, s, n, d) => s + '(' + n + '/' + d + ')')));
      return val(m[1]) > 0 && Math.abs(val(m[1]) - val(p[1])) < 1e-9;
    }
  },
  {
    nom: 'la-constante-annoncee-negative-est-celle-de-l-enonce',
    // « -8 \lt 0 \text{ donc } P(0) \lt 0 \text{ pour toute valeur de } a » (énoncé « P(x)=ax^2+4x-8 ») : c est négatif et c'est la constante de P
    motif: /\\text\{ donc \} P\(0\) \\lt 0/,
    verifie: (l, e) => {
      const m = l.match(/^(-\d+) \\lt 0 \\text\{ donc \} P\(0\) \\lt 0 \\text\{ pour toute valeur de \} a$/), p = String(e.enonce).match(/([+-]\d+)\\\)$/);
      return !!m && !!p && Number(m[1]) < 0 && Number(m[1]) === Number(p[1]);
    }
  },
  {
    nom: 'oui-si-et-seulement-si-le-discriminant-annonce-deux-racines-distinctes',
    // « \text{Réponse : oui} » après un discriminant : oui exactement quand une ligne annonce « deux racines distinctes »
    motif: /^\\text\{Réponse : (?:oui|non)\}$/,
    verifie: (l, e) => {
      const L = (e.detail && e.detail.lignes) || [];
      if (!L.some((x) => /Discriminant : /.test(x))) return null;
      return /oui/.test(l) === L.some((x) => /\\gt 0 \\text\{ : deux racines distinctes\}$/.test(x));
    }
  },
  {
    nom: 'on-garde-la-racine-si-elle-verifie-la-condition',
    // « 2 \geqslant 0 \text{ : on garde } 3 », « -1 \lt 0 \text{ : on rejette } -4 » : « on garde » exactement quand le nombre est positif ou nul
    motif: /\\text\{ : on (?:garde|rejette) \} -?\d+$/,
    verifie: (l) => {
      const m = l.match(/^(-?\d+) (\\geqslant|\\lt) 0 \\text\{ : on (garde|rejette) \} (-?\d+)$/);
      return !!m && (m[2] === '\\geqslant') === (Number(m[1]) >= 0) && (m[3] === 'garde') === (Number(m[1]) >= 0);
    }
  },
  {
    nom: 'pas-de-solution-seulement-pour-un-carre-egal-a-un-nombre-negatif',
    // « -3 \lt 0 \text{ : pas de solution} » (après « x^2 = -3 ») : le nombre est bien négatif
    motif: /\\lt 0 \\text\{ : pas de solution\}$/,
    verifie: (l) => { const m = l.match(/^(-\d+) \\lt 0 \\text\{ : pas de solution\}$/); return !!m && Number(m[1]) < 0; }
  },
  {
    nom: 'la-valeur-testee-est-bien-une-racine',
    // « \text{Donc } 3 \text{ est une racine de } P » : la valeur citée est celle de « \text{On teste la valeur } 3 » et l'évaluation qui précède vaut 0
    motif: /^\\text\{Donc \} -?\d+ \\text\{ est une racine de \} P$/,
    verifie: (l, e) => {
      const L = (e.detail && e.detail.lignes) || [], i = L.indexOf(l), m = l.match(/^\\text\{Donc \} (-?\d+) /), t = L.find((x) => /^\\text\{On teste la valeur \} -?\d+$/.test(x));
      return i > 0 && !!m && !!t && t.endsWith('} ' + m[1]) && /(?:^|= )0$/.test(L[i - 1].trim());
    }
  },
  {
    nom: 'la-reponse-citee-est-la-bonne-reponse-du-qcm',
    // « \text{Réponse : f2} » : c'est la bonne réponse de l'exercice (QCM f1, f2, f3)
    motif: /^\\text\{Réponse : f\d\}$/,
    verifie: (l, e) => l === '\\text{Réponse : ' + String(e.bonneReponse) + '}'
  },
  {
    nom: 'le-produit-scalaire-annonce-nul-vaut-0',
    // « \text{Il est nul : les vecteurs sont orthogonaux} » : la ligne qui précède se termine par « = 0 »
    motif: /^\\text\{Il est nul : les vecteurs sont orthogonaux\}$/,
    verifie: (l, e) => { const L = (e.detail && e.detail.lignes) || [], i = L.indexOf(l); return i > 0 && /= 0$/.test(L[i - 1].trim()); }
  },
  {
    nom: 'la-solution-trouvee-differe-de-la-valeur-interdite',
    // « -\dfrac{1}{2} \neq 3 \text{ : la solution convient} » : les deux nombres sont différents et le premier est la solution de la réponse attendue
    motif: /\\neq .* \\text\{ : la solution convient\}$/,
    verifie: (l, e) => {
      const m = l.match(/^(-?(?:\\dfrac\{\d+\}\{\d+\}|\d+)) \\neq (-?(?:\\dfrac\{\d+\}\{\d+\}|\d+)) \\text\{ : la solution convient\}$/);
      if (!m) return false;
      const val = (t) => math.evaluate(t.replace(/(-?)\\dfrac\{(\d+)\}\{(\d+)\}/, (x, s, n, d) => s + '(' + n + '/' + d + ')'));
      const sol = math.evaluate(String(e.reponse).replace(/[{}]/g, ''));
      return Math.abs(val(m[1]) - val(m[2])) > 1e-9 && Math.abs(val(m[1]) - sol) < 1e-9;
    }
  },
  {
    nom: 'le-trinome-ne-s-annule-pas-apres-delta-negatif',
    // « \text{Donc } u \text{ ne s'annule pas} » : une ligne précédente annonce « aucune racine réelle »
    motif: /^\\text\{Donc \} u \\text\{ ne s'annule pas\}$/,
    verifie: (l, e) => { const L = (e.detail && e.detail.lignes) || [], i = L.indexOf(l); return i > 0 && L.slice(0, i).some((x) => /\\lt 0 \\text\{ : aucune racine réelle\}$/.test(x)); }
  },
  {
    nom: 'parmi-les-individus-de-X-ceux-de-Y-est-une-probabilite-de-l-enonce',
    // « \text{Parmi les individus de } B \text{, ceux de } \overline{A} \text{ :} » : le couple (X, Y) est celui d'un P_{X}(Y) de l'énoncé
    motif: /\\text\{Parmi les individus de \} .* \\text\{, ceux de \}/,
    verifie: (l, e) => {
      const m = l.match(/\\text\{Parmi les individus de \} (\\overline\{\w+\}|\w+) \\text\{, ceux de \} (\\overline\{\w+\}|\w+) \\text\{ :\}$/);
      if (!m) return false;
      const echap = (s) => s.replace(/[\\{}]/g, '\\$&');
      return new RegExp('P_\\{' + echap(m[1]) + '\\}\\(' + echap(m[2]) + '\\)').test(String(e.enonce));
    }
  },
  {
    nom: 'la-valeur-exclue-annule-la-base-du-carre',
    // « \text{Comme } a \neq 3 \text{, on a } s \neq 0 » : la valeur citée est celle « différent de » de l'énoncé et annule le facteur (mx+p) du carré
    motif: /\\text\{Comme \} a \\neq .* \\text\{, on a \} s \\neq 0$/,
    verifie: (l, e) => {
      const m = l.match(/^\\text\{Comme \} a \\neq (-?(?:\\dfrac\{\d+\}\{\d+\}|\d+)) \\text\{, on a \} s \\neq 0$/), base = String(e.enonce).match(/\(([^()]*)\)\^\{2\}/);
      if (!m || !base) return false;
      const val = math.evaluate(m[1].replace(/(-?)\\dfrac\{(\d+)\}\{(\d+)\}/, (x, s, n, d) => s + '(' + n + '/' + d + ')'));
      return String(e.enonce).includes('différent de \\(' + m[1] + '\\)') && Math.abs(math.evaluate(base[1].replace(/(\d)x/g, '$1*x').replace(/x/g, '(' + val + ')'))) < 1e-9;
    }
  },
  {
    nom: 'la-lettre-du-qcm-citee-est-la-bonne-reponse-lettree',
    // « \text{Réponse : } b » : la lettre est la bonne réponse de l'exercice (options a, b, c mélangées à chaque tirage)
    motif: /^\\text\{Réponse : \} [a-c]$/,
    verifie: (l, e) => { const m = l.match(/^\\text\{Réponse : \} ([a-c])$/); return !!m && m[1] === e.bonneReponse; }
  },
  {
    nom: 'x-non-nul-donne-une-raison-differente-de-1',
    // « \text{Comme } x \neq 0 \text{, on a } e^{2x} \neq 1 » : l'énoncé impose x réel non nul (\mathbb{R}^*) et l'exposant est un multiple non nul de x
    motif: /^\\text\{Comme \} x \\neq 0 \\text\{, on a \} e\^\{\d*x\} \\neq 1$/,
    verifie: (l, e) => { const m = l.match(/e\^\{(\d*)x\} \\neq 1$/); return !!m && /x\\in\\mathbb\{R\}\^\*/.test(String(e.enonce)) && (m[1] === '' || Number(m[1]) !== 0); }
  },
  {
    nom: 'on-simplifie-par-s-seulement-apres-avoir-etabli-que-s-est-non-nul',
    // « \text{On simplifie par } s \text{ (non nul)} » : une ligne précédente a établi « s \neq 0 »
    motif: /^\\text\{On simplifie par \} s \\text\{ \(non nul\)\}$/,
    verifie: (l, e) => { const L = (e.detail && e.detail.lignes) || [], i = L.indexOf(l); return i > 0 && L.slice(0, i).some((x) => /\\text\{, on a \} s \\neq 0$/.test(x)); }
  }
];
