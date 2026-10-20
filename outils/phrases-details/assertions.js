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
    motif: /de la courbe (?:sur ou )?(?:au-dessus|en dessous) de l'axe/,
    verifie: (l, e) => {
      const m = l.match(/de la courbe (sur ou )?(au-dessus|en dessous) de l'axe/), r = String(e.enonce).match(/\\(gt|geqslant|lt|leqslant)\s*0/);
      if (!m || !r) return false;
      const large = r[1] === 'geqslant' || r[1] === 'leqslant';
      return (m[2] === 'au-dessus') === (r[1] === 'gt' || r[1] === 'geqslant') && !!m[1] === large;
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
  }
];
