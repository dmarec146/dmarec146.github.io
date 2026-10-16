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
  }
];
