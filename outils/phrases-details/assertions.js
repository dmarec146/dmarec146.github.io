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
    verifie: (l) => { const m = l.match(/\\text\{On divise par \}\s*(-?\d+)\s*\\lt\s*0/); return m ? Number(m[1]) < 0 : false; }
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
      const p = l.match(/x = (-?\d+) \\text\{ \(valeur interdite\)/) || l.match(/[Ll]a valeur interdite \}\s*(-?\d+)\s*\\text\{ est exclue dans tous les cas/);
      if (!den || !p) return false;
      return Math.abs(math.evaluate(den[1].replace(/x/g, '(' + p[1] + ')'))) < 1e-9;
    }
  },
  {
    nom: 'le-sens-annonce-est-celui-de-l-enonce',
    motif: /pour lesquelles (?:le quotient|l'expression) est \}/,
    verifie: (l, e) => {
      const norme = (s) => (/leqslant/.test(s) ? '<=' : /geqslant/.test(s) ? '>=' : /(lt|<)/.test(s) ? '<' : '>');
      const dansLigne = l.match(/pour lesquelles (?:le quotient|l'expression) est \}\s*(\\leqslant|\\geqslant|\\lt|<|>)/), rels = String(e.enonce).match(/\\leqslant|\\geqslant|\\lt|<|>/g);
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
    motif: /^\s*(?:\\dfrac\{\d+\}\{\d+\}|\d+)\s*(?:>|\\lt)\s*(?:\\dfrac\{\d+\}\{\d+\}|\d+)\s*$/,
    verifie: (l) => {
      const f = (s) => s.replace(/\\dfrac\{(\d+)\}\{(\d+)\}/g, '(($1)/($2))');
      const m = l.trim().match(/^(.*?)\s*(>|\\lt)\s*(.*)$/);
      if (!m) return false;
      const a = math.evaluate(f(m[1])), b = math.evaluate(f(m[3]));
      return m[2] === '>' ? a > b : a < b;
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
    // « \dfrac{1}{7} = 0{,}\overline{142857} \quad \text{(période de } 6 \text{ chiffres)} » : chiffres recalculés par la division posée
    motif: /\\overline\{\d+\}/,
    verifie: (l) => {
      const m = l.match(/^\\dfrac\{1\}\{(\d+)\} = 0\{,\}\\overline\{(\d+)\}.*période de \} (\d+) /);
      if (!m) return false;
      const b = Number(m[1]);
      let reste = 1, chiffres = '', n = 0;
      do { reste *= 10; chiffres += Math.floor(reste / b); reste %= b; n++; } while (reste !== 1 && n < 500);
      return chiffres === m[2] && Number(m[3]) === chiffres.length;
    }
  }
];
