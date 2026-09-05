/* ============================================================
   Cahiers d'automatismes — moteur commun
   - boîte à outils partagée par les banques de questions
   - tirage d'une série (fiche thématique ou sujet blanc pondéré)
   - deux modes : « fiche » (toutes les questions, correction à la
     demande) et « chrono » (une question à la fois, minuteur)
   ============================================================ */
(function () {
  'use strict';

  // ---------- Boîte à outils ----------
  function alea(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function aleaParmi(liste) { return liste[alea(0, liste.length - 1)]; }
  function aleaNonNul(min, max) { let v; do { v = alea(min, max); } while (v === 0); return v; }
  function melanger(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function pgcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = b; b = a % b; a = t; } return a || 1; }
  // arrondi propre (évite 0,1+0,2 = 0,30000000000000004)
  function arrondir(x, nb) { nb = nb === undefined ? 6 : nb; return Number(Math.round(Number(x + 'e' + nb)) + 'e-' + nb); }
  // décimal à la française, en texte brut : "1,15", "−0,8", "1 500"
  function dec(x, nbMax) {
    const v = arrondir(x, nbMax === undefined ? 6 : nbMax);
    const neg = v < 0;
    let [ent, frac] = String(Math.abs(v)).split('.');
    if (ent.length > 3) ent = ent.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (neg ? '−' : '') + ent + (frac ? ',' + frac : '');
  }
  // décimal pour MathJax : virgule échappée, signe moins ordinaire, milliers avec \,
  function decL(x, nbMax) {
    const v = arrondir(x, nbMax === undefined ? 6 : nbMax);
    const neg = v < 0;
    let [ent, frac] = String(Math.abs(v)).split('.');
    if (ent.length > 3) ent = ent.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,');
    return (neg ? '-' : '') + ent + (frac ? '{,}' + frac : '');
  }
  function pct(t) { return dec(t) + ' %'; }
  function euros(x) { return dec(x) + ' €'; }
  // fraction réduite en LaTeX ; d = 1 -> entier
  function fracL(n, d, opts) {
    opts = opts || {};
    if (d < 0) { n = -n; d = -d; }
    const g = pgcd(n, d);
    n /= g; d /= g;
    if (d === 1) return String(n);
    const cmd = opts.petite ? '\\frac' : '\\dfrac';
    return (n < 0 ? '-' : '') + cmd + '{' + Math.abs(n) + '}{' + d + '}';
  }
  function m(tex) { return '\\(' + tex + '\\)'; }
  // choisit les premiers candidats distincts (par clé) de la bonne réponse et entre eux
  function choisirDistracteurs(bonne, candidats, nb) {
    nb = nb === undefined ? 3 : nb;
    const vus = new Set([String(bonne.cle)]);
    const res = [];
    for (const c of candidats) {
      const k = String(c.cle);
      if (vus.has(k)) continue;
      vus.add(k);
      res.push(c);
      if (res.length === nb) break;
    }
    return res;
  }
  // construit la question à partir d'une bonne réponse et de candidats de distracteurs
  function qcm(enonce, bonne, candidats, extra) {
    const dis = choisirDistracteurs(bonne, candidats);
    if (dis.length < 3) return null;
    const options = [bonne].concat(dis);
    return Object.assign({ enonce: enonce, options: options, bonne: 0 }, extra || {});
  }

  // définition d'une famille : base (par niveau) + variantes propres au niveau 3
  //   o.base(niveau) ; o.variantes3 : générateurs sans argument ; o.partBase3 : part des tirages
  //   de niveau 3 qui utilisent la base (0 par défaut) ; o.niveaux ; o.quota ; o.ordre
  function famille(o) {
    return {
      nom: o.nom, niveaux: o.niveaux, quota: o.quota, ordre: o.ordre,
      generer(niveau) {
        if (niveau === 3 && o.variantes3 && o.variantes3.length && Math.random() >= (o.partBase3 || 0)) return aleaParmi(o.variantes3)();
        return o.base(niveau);
      }
    };
  }
  // notation scientifique en LaTeX : 3 × 10^7
  function sciL(mantisse, exposant) { return (mantisse === 1 ? '' : decL(mantisse) + ' \\times ') + '10^{' + exposant + '}'; }

  // ---------- Écriture d'expressions algébriques ----------
  // Couche unique par laquelle passent toutes les expressions littérales, pour respecter
  // les conventions des cahiers de calcul : coefficient 1 ou −1 jamais écrit devant une
  // lettre, aucun signe doublé (« + -3x »), aucun opérateur en suspens.
  // monôme : coefficient × facteur ; facteur vide = terme constant
  function mono(c, fac) {
    if (c === 0) return '';
    const neg = c < 0, a = Math.abs(c);
    const num = decL(a);
    if (!fac) return (neg ? '-' : '') + num;
    if (a === 1) return (neg ? '-' : '') + fac;
    return (neg ? '-' : '') + num + fac;
  }
  // assemble des monômes [[coef, facteur], …] en une expression signée correcte
  function poly(termes) {
    let out = '';
    for (const [c, fac] of termes) {
      const t = mono(c, fac);
      if (!t) continue;
      out = out ? (t.charAt(0) === '-' ? out + ' - ' + t.slice(1) : out + ' + ' + t) : t;
    }
    return out || '0';
  }
  // binôme entre parenthèses : (3x - 2), (x + 1)
  const paren = termes => '(' + poly(termes) + ')';
  // coefficient devant une parenthèse : « -(x-4) », jamais « -1(x-4) »
  const coefParen = (c, P) => (c === 1 ? P : c === -1 ? '-' + P : mono(c, '') + P);
  // enchaîne deux termes déjà écrits en gérant le signe du second : jamais « + -3x »
  const joindre = (t1, t2) => (!t2 ? t1 : t2.charAt(0) === '-' ? t1 + ' - ' + t2.slice(1) : t1 + ' + ' + t2);
  // coefficient fractionnaire devant un facteur : la fraction reste en \dfrac (jamais « 5/2x »,
  // ambigu une fois rendu), et un coefficient qui se réduit à 1 ou −1 ne s'écrit pas
  function monoFrac(num, den, fac) {
    if (num === 0) return '';
    const f = fracL(num, den);
    if (!fac) return f;
    if (f === '1') return fac;
    if (f === '-1') return '-' + fac;
    return f + fac;
  }
  // un manuel écrit (x+2)^2, jamais (x+2)(x+2)
  const facteurRepete = s => /\(([^()]{1,16})\)\(\1\)/.test(s);

  const outils = {
    alea, aleaParmi, aleaNonNul, melanger, pgcd, arrondir, dec, decL, pct, euros, fracL, m, sciL,
    choisirDistracteurs, qcm, famille,
    mono, poly, paren, coefParen, joindre, monoFrac, facteurRepete
  };

  // ---------- Banques ----------
  const banques = {};
  function enregistrerBanque(id, def) { banques[id] = def; }

  // niveau : 1 (découverte), 2 (niveau de l'épreuve, défaut), 3 (approfondissement)
  function genererQuestion(banqueId, familleId, niveau) {
    niveau = niveau || 2;
    const banque = banques[banqueId];
    const fam = banque.familles[familleId];
    for (let essai = 0; essai < 40; essai++) {
      let q;
      try { q = fam.generer(niveau); } catch (e) { console.warn('Générateur en erreur', banqueId, familleId, e); continue; }
      if (!q || !Array.isArray(q.options) || q.options.length !== 4) continue;
      const opts = q.options.map(o => typeof o === 'string' ? { affichage: o, cle: o } : { affichage: o.affichage, cle: o.cle === undefined ? o.affichage : o.cle });
      if (new Set(opts.map(o => String(o.cle))).size !== 4) continue;
      const ordre = melanger([0, 1, 2, 3]);
      return {
        enonce: q.enonce,
        figure: q.figure || null,
        explication: q.explication || '',
        optionsLarges: !!q.optionsLarges,
        options: ordre.map(i => opts[i].affichage),
        bonne: ordre.indexOf(q.bonne),
        niveau: niveau,
        difficulte: (fam.ordre && fam.ordre[niveau]) || 0, // rang de difficulté déclaré par la banque
        banque: banqueId,
        famille: familleId,
        familleNom: fam.nom,
        banqueTitre: banque.titre
      };
    }
    throw new Error('Impossible de générer une question valide : ' + banqueId + ' / ' + familleId);
  }


  // familles d'une banque disponibles à un niveau donné (une famille peut déclarer `niveaux: [2, 3]`)
  function famillesDispo(banqueId, niveau) {
    const fams = banques[banqueId].familles;
    return Object.keys(fams).filter(f => !fams[f].niveaux || fams[f].niveaux.includes(niveau));
  }

  function tirerSerie(config, niveau) {
    niveau = niveau || 2;
    if (config.domaines) return tirerSerieParDomaines(config, niveau);
    // fiche : `nbThemes` banques tirées au sort parmi celles disponibles au niveau (2 par défaut)
    const dispo = config.banques.filter(b => banques[b] && famillesDispo(b, niveau).length);
    if (!dispo.length) throw new Error('Aucune banque disponible au niveau ' + niveau);
    const k = Math.min(config.nbThemes || 1, dispo.length);
    return construireSeriePourBanques(config, niveau, melanger(dispo).slice(0, k));
  }

  // tirage pondéré dans une liste [{id, poids}, …]
  function tirerPondere(liste) {
    const total = liste.reduce((s, x) => s + x.poids, 0);
    let t = Math.random() * total;
    for (const x of liste) { t -= x.poids; if (t <= 0) return x; }
    return liste[liste.length - 1];
  }

  /* Sujet blanc : la série se répartit entre les grands domaines du programme,
     dans les proportions relevées sur le corpus des sujets. Chaque domaine reçoit
     d'abord son plancher proportionnel — il est donc toujours représenté — puis les
     places restantes sont tirées au sort, pondérées par les décimales : deux sujets
     blancs n'ont ainsi pas la même composition. Dans un domaine, la banque est
     choisie selon ses propres poids, sans qu'aucune ne dépasse `maxParBanque`.
     Les minimums par famille ne s'appliquent pas ici : conçus pour une fiche
     thématique de 10 questions, ils ramèneraient toujours la même famille quand
     une banque n'a qu'une ou deux places. */
  function tirerSerieParDomaines(config, niveau) {
    const nb = config.nb;
    const doms = config.domaines.map(d => ({
      nom: d.nom, poids: d.poids,
      banques: Object.keys(d.banques)
        .filter(b => banques[b] && famillesDispo(b, niveau).length)
        .map(b => ({ id: b, poids: d.banques[b] }))
    })).filter(d => d.banques.length);
    if (!doms.length) throw new Error('Aucun domaine disponible au niveau ' + niveau);

    const somme = doms.reduce((s, d) => s + d.poids, 0);
    const exact = doms.map(d => d.poids / somme * nb);
    const places = exact.map(Math.floor);
    let libres = nb - places.reduce((s, p) => s + p, 0);
    let pool = doms.map((d, i) => ({ poids: exact[i] - places[i] || 0.001, i }));
    while (libres > 0) {
      if (!pool.length) pool = doms.map((d, i) => ({ poids: 1, i }));   // plus de places que de domaines
      const choisi = tirerPondere(pool);
      places[choisi.i]++;
      pool = pool.filter(x => x !== choisi);
      libres--;
    }

    let questions = [];
    const repartition = [];
    doms.forEach((d, i) => {
      if (!places[i]) return;
      const comptes = {};
      for (let k = 0; k < places[i]; k++) {
        const libre = d.banques.filter(b => (comptes[b.id] || 0) < (config.maxParBanque || 2));
        const cible = tirerPondere(libre.length ? libre : d.banques);
        comptes[cible.id] = (comptes[cible.id] || 0) + 1;
      }
      Object.keys(comptes).forEach(b => {
        questions = questions.concat(tirerDansBanque(b, niveau, comptes[b], { sansMinimums: true }));
      });
      repartition.push({ nom: d.nom, nb: places[i] });
    });
    questions = melangerQuestions(questions);
    // pas de tri par difficulté : le sujet d'examen mêle les thèmes et les niveaux
    questions.repartition = repartition;
    return questions;
  }

  // construit une série (mode fiche) pour un jeu de banques déjà choisi — places réparties
  // équitablement, quotas appliqués dans chaque banque. Réutilisé pour retirer une nouvelle
  // série sur les mêmes thèmes (voir nouvelleSerieMemeThemes).
  function construireSeriePourBanques(config, niveau, choisies) {
    const nb = config.nb;
    const k = choisies.length;
    let questions = [];
    choisies.forEach((b, i) => {
      const places = Math.floor(nb / k) + (i < nb % k ? 1 : 0);
      questions = questions.concat(tirerDansBanque(b, niveau, places));
    });
    questions = melangerQuestions(questions);
    // niveaux 1 et 2 : difficulté croissante (rang déclaré par chaque banque, normalisé, tri stable) ;
    // niveau 3 : ordre mélangé, comme dans l'épreuve
    if (niveau <= 2 && config.trierParDifficulte !== false) questions.sort((a, b) => a.difficulte - b.difficulte);
    questions.themes = choisies.map(b => banques[b].titre);
    questions.themesIds = choisies.slice();
    return questions;
  }

  // n questions d'une banque, en respectant les quotas par famille (`quota: {2: {min, max, gen, priorite}}`)
  //   min : questions garanties ; max : plafond ; gen : niveau de génération forcé ;
  //   priorite : ordre dans lequel les minimums sont honorés quand la série est courte.
  //   Sur n places, on honore au plus max(1, 40 % de n) familles à minimum — sur 10 places, toutes
  //   les familles habituelles ; sur 5 places, deux d'entre elles, choisies par priorité puis au hasard.
  function tirerDansBanque(b, niveau, n, options) {
    const fams = famillesDispo(b, niveau);
    const def = f => banques[b].familles[f];
    const quota = f => ((def(f).quota || {})[niveau]) || {};
    const plan = [], comptes = {};
    const ajouter = f => { plan.push(f); comptes[f] = (comptes[f] || 0) + 1; };
    const capMin = Math.max(1, Math.round(n * 0.4));
    const avecMin = (options && options.sansMinimums) ? []
      : melanger(fams.filter(f => quota(f).min > 0)).sort((x, y) => (quota(y).priorite || 1) - (quota(x).priorite || 1));
    let honores = 0;
    for (const f of avecMin) {
      if (honores >= capMin || plan.length >= n) break;
      for (let i = 0; i < quota(f).min && plan.length < n; i++) ajouter(f);
      honores++;
    }
    const ordre = melanger(fams);
    for (let i = 0, tours = 0; plan.length < n && tours < 20 * n; i++, tours++) {
      const f = ordre[i % ordre.length];
      const max = quota(f).max === undefined ? Infinity : quota(f).max;
      if ((comptes[f] || 0) < max) ajouter(f);
    }
    // rang de difficulté normalisé (0 à 1) pour être comparable d'une banque à l'autre
    const rangMax = Math.max(1, ...fams.map(f => (def(f).ordre && def(f).ordre[niveau]) || 0));
    return plan.map(f => {
      const q = genererQuestion(b, f, quota(f).gen || niveau);
      q.difficulte = q.difficulte / rangMax;
      return q;
    });
  }

  function melangerQuestions(questions) {
    for (let essai = 0; essai < 60; essai++) {
      const q = melanger(questions);
      let ok = true;
      for (let i = 1; i < q.length; i++) if (q[i].famille === q[i - 1].famille && q[i].banque === q[i - 1].banque) { ok = false; break; }
      if (ok) return q;
    }
    return melanger(questions);
  }

  // ---------- État et rendu ----------
  const LETTRES = ['a', 'b', 'c', 'd'];
  const ETAT = {};

  function typeset(el) {
    if (window.MathJax && window.MathJax.typesetPromise) {
      return window.MathJax.typesetPromise(el ? [el] : undefined).catch(() => {});
    }
    return Promise.resolve();
  }
  function echapper(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function demarrer(config) {
    ETAT.config = Object.assign({ nb: 10, modeDefaut: 'fiche', duree: 120, niveauDefaut: 2, cible: '#app', labelNouvelle: 'Nouvelle série' }, config);
    ETAT.mode = ETAT.config.modeDefaut;
    ETAT.duree = ETAT.config.duree;
    ETAT.niveau = ETAT.config.niveauDefaut;
    // un thème unique peut être imposé par l'adresse : fiche.html?theme=droites
    const voulu = (new URLSearchParams(window.location.search).get('theme') || '').trim();
    if (voulu && banques[voulu] && (ETAT.config.banques || []).indexOf(voulu) !== -1) {
      ETAT.config.banques = [voulu];
      ETAT.config.nbThemes = 1;
      ETAT.config.themeImpose = voulu;
      ETAT.config.labelNouvelle = 'Nouvelle fiche';
    }
    ETAT.racine = document.querySelector(ETAT.config.cible);
    // Échap ferme la figure agrandie
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') fermerZoom(); });
    nouvelleSerie();
  }

  function nouvelleSerie() {
    arreterChrono();
    ETAT.questions = tirerSerie(ETAT.config, ETAT.niveau);
    ETAT.reponses = ETAT.questions.map(() => null);
    ETAT.corrigees = ETAT.questions.map(() => false);
    ETAT.chrono = { phase: 'intro', index: 0, restant: ETAT.duree, timer: null, choix: null, debut: 0, tempsTotal: 0 };
    rendre();
  }

  // nouvelle série, mêmes thèmes que la série actuelle (mode fiche à plusieurs thèmes uniquement)
  function nouvelleSerieMemeThemes() {
    arreterChrono();
    const ids = ETAT.questions.themesIds;
    ETAT.questions = (ids && ids.length) ? construireSeriePourBanques(ETAT.config, ETAT.niveau, ids) : tirerSerie(ETAT.config, ETAT.niveau);
    ETAT.reponses = ETAT.questions.map(() => null);
    ETAT.corrigees = ETAT.questions.map(() => false);
    ETAT.chrono = { phase: 'intro', index: 0, restant: ETAT.duree, timer: null, choix: null, debut: 0, tempsTotal: 0 };
    rendre();
  }

  function recommencer() {
    arreterChrono();
    ETAT.reponses = ETAT.questions.map(() => null);
    ETAT.corrigees = ETAT.questions.map(() => false);
    ETAT.chrono = { phase: 'intro', index: 0, restant: ETAT.duree, timer: null, choix: null, debut: 0, tempsTotal: 0 };
    rendre();
  }

  function changerMode(mode) {
    if (mode === ETAT.mode) return;
    ETAT.mode = mode;
    nouvelleSerie();
  }

  function changerNiveau(niveau) {
    if (niveau === ETAT.niveau) return;
    ETAT.niveau = niveau;
    nouvelleSerie();
  }

  function rendre() {
    const r = ETAT.racine;
    r.innerHTML = panneauModesHTML() + bandeauThemesHTML() + (ETAT.mode === 'fiche' ? vueFicheHTML() : vueChronoHTML()) + modaleHTML();
    attacherGlobal();
    typeset(r);
  }

  // thèmes tirés au sort pour cette série (fiches à plusieurs thèmes),
  // ou répartition par domaines (sujet blanc)
  function bandeauThemesHTML() {
    const rep = ETAT.questions.repartition;
    if (rep && rep.length) {
      return `<div class="themes-bandeau"><span class="themes-label">Ce sujet couvre :</span> `
        + rep.map(d => `<span class="theme-puce">${echapper(d.nom)} <b>×${d.nb}</b></span>`).join('') + '</div>';
    }
    const th = ETAT.questions.themes;
    if (!th || !th.length || !ETAT.config.nbThemes) return '';
    const libelle = ETAT.config.themeImpose ? 'Thème choisi'
      : th.length > 1 ? 'Thèmes de cette fiche' : 'Thème de cette fiche';
    return `<div class="themes-bandeau"><span class="themes-label">${libelle} :</span> ${th.map(t => `<span class="theme-puce">${echapper(t)}</span>`).join('')}</div>`;
  }

  // ----- panneau de mode -----
  function panneauModesHTML() {
    const fiche = ETAT.mode === 'fiche';
    const expl = fiche
      ? 'Toutes les questions sont affichées. Répondez à votre rythme, puis cliquez sur « Voir toutes les réponses » en bas de la page.'
      : 'Une question à la fois, avec un minuteur par question, comme le jour de l\'épreuve. La correction n\'apparaît qu\'à la fin.';
    let html = `<div class="mode-panneau">
      <span class="mode-label">Mode de travail</span>
      <button class="mode-btn ${fiche ? 'mode-actif' : ''}" data-action="mode" data-mode="fiche">Mode fiche</button>
      <button class="mode-btn ${!fiche ? 'mode-actif-sombre' : ''}" data-action="mode" data-mode="chrono">Mode chrono ⏱</button>
      <span class="mode-explication">${expl}</span>
    </div>`;
    // choix du niveau : toujours en mode fiche, seulement avant le départ en mode chrono
    if (fiche || ETAT.chrono.phase === 'intro') {
      const n = ETAT.niveau;
      const EXPL = {
        1: 'Niveau 1 — les bases : une seule étape de calcul, des nombres simples.',
        2: 'Niveau 2 — le niveau de l\'épreuve : questions calquées sur les sujets du baccalauréat.',
        3: 'Niveau 3 — bien plus difficile : plusieurs étapes, pièges, situations moins habituelles (toujours sans calculatrice).'
      };
      html += `<div class="mode-panneau">
        <span class="mode-label">Niveau de difficulté</span>
        <button class="mode-btn niveau-btn ${n === 1 ? 'mode-actif' : ''}" data-action="niveau" data-niveau="1">★ Niveau 1</button>
        <button class="mode-btn niveau-btn ${n === 2 ? 'mode-actif' : ''}" data-action="niveau" data-niveau="2">★★ Niveau 2 · épreuve</button>
        <button class="mode-btn niveau-btn ${n === 3 ? 'mode-actif' : ''}" data-action="niveau" data-niveau="3">★★★ Niveau 3</button>
        <span class="mode-explication">${EXPL[n]}</span>
      </div>`;
    }
    if (!fiche && ETAT.chrono.phase === 'intro') {
      const d = ETAT.duree;
      html += `<div class="mode-panneau">
        <span class="mode-label">Temps par question</span>
        <select data-action="duree">
          <option value="60" ${d === 60 ? 'selected' : ''}>1 min</option>
          <option value="90" ${d === 90 ? 'selected' : ''}>1 min 30</option>
          <option value="120" ${d === 120 ? 'selected' : ''}>2 min (recommandé)</option>
          <option value="180" ${d === 180 ? 'selected' : ''}>3 min</option>
          <option value="0" ${d === 0 ? 'selected' : ''}>Sans limite</option>
        </select>
        <span class="mode-explication">Quand le temps est écoulé, on passe automatiquement à la question suivante.</span>
      </div>`;
    }
    return html;
  }

  // ----- agrandissement des figures -----
  // Toute figure SVG reçoit une loupe en haut à droite ; le clic ouvre la figure
  // en grand dans une fenêtre, sans sélectionner l'option qui la contient.
  const ICONE_LOUPE = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">'
    + '<circle cx="10.5" cy="10.5" r="6.3" fill="none" stroke="currentColor" stroke-width="2"/>'
    + '<line x1="15.3" y1="15.3" x2="21" y2="21" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/>'
    + '<line x1="7.8" y1="10.5" x2="13.2" y2="10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
    + '<line x1="10.5" y1="7.8" x2="10.5" y2="13.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  // Un repère quadrillé a de la marge dans ses angles ; un tableau ou un arbre,
  // non : la loupe y masquerait une donnée. Ces figures-là reçoivent une classe
  // qui réserve la place du bouton en dehors du dessin.
  const FIGURE_DENSE = /tab-croise-svg|tab-signes-svg|arbre-svg|boite-svg/;
  function figureZoomable(html) {
    if (!html || String(html).indexOf('<svg') === -1) return html;
    return '<span class="figure-zoom' + (FIGURE_DENSE.test(html) ? ' figure-zoom-dense' : '') + '">' + html
      + '<span class="zoom-btn" data-action="zoom" role="button" title="Agrandir la figure" aria-label="Agrandir la figure">'
      + ICONE_LOUPE + '</span></span>';
  }
  function modaleHTML() {
    return '<div class="modal-figure" id="modal-figure" data-action="fermer-zoom" hidden>'
      + '<div class="modal-figure-contenu">'
      + '<button type="button" class="modal-figure-fermer" data-action="fermer-zoom" title="Fermer" aria-label="Fermer">&times;</button>'
      + '<div class="modal-figure-corps" id="modal-figure-corps"></div></div></div>';
  }
  function ouvrirZoom(bouton) {
    const enveloppe = bouton.closest('.figure-zoom');
    const svg = enveloppe && enveloppe.querySelector('svg');
    const corps = document.getElementById('modal-figure-corps');
    const modale = document.getElementById('modal-figure');
    if (!svg || !corps || !modale) return;
    const copie = svg.cloneNode(true);
    copie.removeAttribute('width');
    copie.removeAttribute('height');
    copie.classList.remove('repere-petit');
    corps.innerHTML = '';
    corps.appendChild(copie);
    modale.hidden = false;
  }
  function fermerZoom() {
    const modale = document.getElementById('modal-figure');
    if (modale) modale.hidden = true;
  }

  // ----- carte de question -----
  function carteHTML(q, i, etatCarte) {
    // etatCarte : { choix, corrigee, cliquable, neutre }
    //   neutre : simple révélation des réponses (mode fiche) — une question laissée vide n'est
    //   pas signalée comme une erreur, contrairement au récapitulatif du mode chrono.
    const choix = etatCarte.choix;
    const corrigee = etatCarte.corrigee;
    const sansReponse = corrigee && choix === null;
    let classe = 'carte';
    if (corrigee && !(sansReponse && etatCarte.neutre)) {
      classe += sansReponse ? ' sans-reponse' : (choix === q.bonne ? ' correct' : ' incorrect');
    }
    const options = q.options.map((o, k) => {
      let cl = 'opt';
      if (corrigee) {
        if (k === q.bonne) cl += ' bonne';
        else if (k === choix) cl += ' fausse';
      } else if (k === choix) cl += ' choisie';
      return `<button type="button" class="${cl}" data-action="opt" data-q="${i}" data-k="${k}" ${etatCarte.cliquable ? '' : 'disabled'}>
        <span class="opt-lettre">${LETTRES[k]}</span><span class="opt-texte">${figureZoomable(o)}</span></button>`;
    }).join('');
    let retour = '';
    if (corrigee) {
      let verdict;
      if (sansReponse) verdict = etatCarte.neutre
        ? `Réponse : <b>${LETTRES[q.bonne]}</b>.`
        : `Pas de réponse — la bonne réponse était <b>${LETTRES[q.bonne]}</b>.`;
      else if (choix === q.bonne) verdict = '✓ Bonne réponse.';
      else verdict = `✗ Réponse ${LETTRES[choix]} — la bonne réponse était <b>${LETTRES[q.bonne]}</b>.`;
      retour = `<div class="carte-retour visible"><span class="verdict">${verdict}</span>${q.explication ? `<div class="explication">${q.explication}</div>` : ''}</div>`;
    }
    const corps = q.figure
      ? `<div class="carte-corps avec-figure"><div class="carte-enonce">${q.enonce}</div><div class="carte-figure">${figureZoomable(q.figure)}</div><div class="carte-options${q.optionsLarges ? ' options-larges' : ''}">${options}</div></div>`
      : `<div class="carte-corps"><div class="carte-enonce">${q.enonce}</div><div class="carte-options${q.optionsLarges ? ' options-larges' : ''}">${options}</div></div>`;
    // Sujet blanc : l'étiquette nomme le thème ET la méthode (« intersection sur un
    // arbre pondéré ») — c'est un indice que l'épreuve ne donne pas. On ne l'affiche
    // qu'une fois la question corrigée.
    const etiquette = (ETAT.config.masquerEtiquette && !corrigee)
      ? '' : `<span class="carte-famille">${echapper(q.banqueTitre)} · ${echapper(q.familleNom)}</span>`;
    return `<div class="${classe}" id="carte-${i}">
      <div class="carte-entete"><span class="carte-num">Question ${i + 1}</span>${etiquette}</div>
      ${corps}${retour}
    </div>`;
  }

  // ----- vue fiche -----
  function vueFicheHTML() {
    const cartes = ETAT.questions.map((q, i) => carteHTML(q, i, { choix: ETAT.reponses[i], corrigee: ETAT.corrigees[i], cliquable: !ETAT.corrigees[i], neutre: true })).join('');
    const revelees = ETAT.corrigees.every(c => c);
    return `<div class="liste-questions" id="liste-questions">${cartes}</div>
      <div class="barre-controle">
        <button class="btn-principal" data-action="reponses">${revelees ? 'Masquer les réponses' : 'Voir toutes les réponses'}</button>
        <button class="btn-secondaire" data-action="recommencer">Recommencer</button>
        ${ETAT.config.nbThemes && !ETAT.config.themeImpose ? `<button class="btn-secondaire" data-action="nouvelle-memes-themes">Nouvelle fiche (mêmes thèmes)</button>` : ''}
        <button class="btn-secondaire" data-action="nouvelle">${echapper(ETAT.config.labelNouvelle)}</button>
      </div>`;
  }

  function majCarte(i) {
    const ancienne = document.getElementById('carte-' + i);
    if (!ancienne) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = carteHTML(ETAT.questions[i], i, { choix: ETAT.reponses[i], corrigee: ETAT.corrigees[i], cliquable: !ETAT.corrigees[i], neutre: true });
    const nouvelle = tmp.firstElementChild;
    ancienne.replaceWith(nouvelle);
    typeset(nouvelle);
  }

  function scoreHTML() {
    const n = ETAT.questions.length;
    let bonnes = 0, sans = 0;
    ETAT.questions.forEach((q, i) => { if (ETAT.reponses[i] === null) sans++; else if (ETAT.reponses[i] === q.bonne) bonnes++; });
    let html = `<span class="score-chiffre">${bonnes} / ${n}</span> bonnes réponses`;
    if (ETAT.config.bareme) {
      const pts = arrondir(bonnes * ETAT.config.bareme.parQuestion, 2);
      html += `<div class="score-points">soit <b>${dec(pts)} / ${dec(ETAT.config.bareme.total)}</b> points au barème de l'épreuve (${dec(ETAT.config.bareme.parQuestion)} pt par bonne réponse, aucune pénalité)</div>`;
    }
    if (sans > 0) html += `<div class="score-detail">${sans} question${sans > 1 ? 's' : ''} sans réponse.</div>`;
    if (ETAT.mode === 'chrono' && ETAT.chrono.tempsTotal > 0) {
      const s = Math.round(ETAT.chrono.tempsTotal);
      html += `<div class="score-detail">Temps total : ${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s.</div>`;
    }
    // bilan par famille si plusieurs banques
    const parBanque = {};
    ETAT.questions.forEach((q, i) => {
      if (!parBanque[q.banqueTitre]) parBanque[q.banqueTitre] = { ok: 0, n: 0 };
      parBanque[q.banqueTitre].n++;
      if (ETAT.reponses[i] === q.bonne) parBanque[q.banqueTitre].ok++;
    });
    const cles = Object.keys(parBanque);
    if (cles.length > 1) {
      html += '<div class="score-detail">' + cles.map(k => `${echapper(k)} : ${parBanque[k].ok}/${parBanque[k].n}`).join(' · ') + '</div>';
    }
    return html;
  }

  // mode fiche : révèle (ou masque) la bonne réponse et l'explication de chaque question,
  // sans notation — le score reste l'affaire du mode chrono.
  function basculerReponses() {
    const revelees = ETAT.corrigees.every(c => c);
    ETAT.corrigees = ETAT.questions.map(() => !revelees);
    rendre();
  }

  // ----- vue chrono -----
  function vueChronoHTML() {
    const c = ETAT.chrono;
    const n = ETAT.questions.length;
    if (c.phase === 'intro') {
      const d = ETAT.duree;
      const dureeTxt = d === 0 ? 'sans limite de temps' : `${d >= 60 ? Math.floor(d / 60) + ' min' : ''}${d % 60 ? ' ' + (d % 60) + ' s' : ''} par question`;
      const total = d === 0 ? '' : ` (${Math.round(n * d / 60)} min au total au maximum)`;
      return `<div class="chrono-intro">
        <h2>${n} questions · ${dureeTxt}${total}</h2>
        <p>Une seule question à l'écran. Cliquez sur une réponse puis sur « Valider » ; sans réponse à la fin du temps, on passe à la suivante.</p>
        <p>Impossible de revenir en arrière. La correction complète s'affiche à la fin.</p>
        <button class="btn-principal" data-action="demarrer-chrono">Démarrer</button>
      </div>`;
    }
    if (c.phase === 'fin') {
      const cartes = ETAT.questions.map((q, i) => carteHTML(q, i, { choix: ETAT.reponses[i], corrigee: true, cliquable: false })).join('');
      return `<div class="score-panneau visible" id="score-panneau">${scoreHTML()}
          <div class="barre-controle">
            <button class="btn-secondaire" data-action="basculer-revue">Voir la correction détaillée</button>
            ${ETAT.config.nbThemes && !ETAT.config.themeImpose ? `<button class="btn-secondaire" data-action="nouvelle-memes-themes">Nouvelle fiche (mêmes thèmes)</button>` : ''}
            <button class="btn-principal" data-action="nouvelle">${echapper(ETAT.config.labelNouvelle)}</button>
          </div>
        </div>
        <div class="liste-questions" id="revue" style="display:none">${cartes}</div>`;
    }
    // phase 'question'
    const i = c.index;
    const q = ETAT.questions[i];
    const prog = ETAT.questions.map((_, k) => `<span class="${k < i ? 'faite' : (k === i ? 'courante' : '')}"></span>`).join('');
    const tempsHTML = ETAT.duree === 0
      ? `<span class="chrono-infini">sans limite</span>`
      : `<span class="chrono-temps" id="chrono-temps">${formatTemps(c.restant)}</span>`;
    const barre = ETAT.duree === 0 ? '' : `<div class="chrono-barre"><div class="chrono-remplissage" id="chrono-remplissage" style="width:${100 * c.restant / ETAT.duree}%"></div></div>`;
    return `<div class="progression">${prog}</div>
      <div class="chrono-entete"><span class="position">Question ${i + 1} / ${n}</span>${tempsHTML}</div>
      ${barre}
      <div id="carte-courante">${carteHTML(q, i, { choix: c.choix, corrigee: false, cliquable: true })}</div>
      <div class="barre-controle">
        <button class="btn-principal" data-action="valider" id="btn-valider" ${c.choix === null ? 'disabled' : ''}>${i === n - 1 ? 'Valider et terminer' : 'Valider →'}</button>
        <button class="btn-secondaire" data-action="passer">Passer sans répondre</button>
      </div>`;
  }

  function formatTemps(s) {
    s = Math.max(0, Math.ceil(s));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function demarrerChrono() {
    ETAT.chrono.phase = 'question';
    ETAT.chrono.index = 0;
    ETAT.chrono.choix = null;
    ETAT.chrono.tempsTotal = 0;
    lancerMinuteur();
    rendre();
  }

  function lancerMinuteur() {
    arreterChrono();
    const c = ETAT.chrono;
    c.restant = ETAT.duree;
    c.debut = Date.now();
    if (ETAT.duree === 0) return;
    c.timer = setInterval(() => {
      c.restant = ETAT.duree - (Date.now() - c.debut) / 1000;
      const t = document.getElementById('chrono-temps');
      const b = document.getElementById('chrono-remplissage');
      const alerte = c.restant <= 10;
      if (t) { t.textContent = formatTemps(c.restant); t.classList.toggle('alerte', alerte); }
      if (b) { b.style.width = Math.max(0, 100 * c.restant / ETAT.duree) + '%'; b.classList.toggle('alerte', alerte); }
      if (c.restant <= 0) avancer(true);
    }, 200);
  }

  function arreterChrono() {
    if (ETAT.chrono && ETAT.chrono.timer) { clearInterval(ETAT.chrono.timer); ETAT.chrono.timer = null; }
  }

  function avancer(tempsEcoule) {
    const c = ETAT.chrono;
    if (c.phase !== 'question') return;
    c.tempsTotal += (Date.now() - c.debut) / 1000;
    arreterChrono();
    ETAT.reponses[c.index] = c.choix; // en cas de temps écoulé, on garde la réponse cliquée mais non validée
    c.choix = null;
    if (c.index >= ETAT.questions.length - 1) {
      c.phase = 'fin';
      ETAT.corrigees = ETAT.questions.map(() => true);
      rendre();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    c.index++;
    lancerMinuteur();
    rendre();
    if (tempsEcoule) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ----- événements -----
  function attacherGlobal() {
    const r = ETAT.racine;
    r.onclick = function (ev) {
      const cible = ev.target.closest('[data-action]');
      if (!cible || !r.contains(cible)) return;
      const action = cible.dataset.action;
      // la loupe est imbriquée dans le bouton d'option : traitée en premier, elle
      // ouvre la figure sans sélectionner la réponse
      if (action === 'zoom') { ev.preventDefault(); ouvrirZoom(cible); return; }
      if (action === 'fermer-zoom') { if (ev.target === cible) fermerZoom(); return; }
      if (action === 'mode') changerMode(cible.dataset.mode);
      else if (action === 'niveau') changerNiveau(Number(cible.dataset.niveau));
      else if (action === 'opt') clicOption(Number(cible.dataset.q), Number(cible.dataset.k));
      else if (action === 'reponses') basculerReponses();
      else if (action === 'recommencer') recommencer();
      else if (action === 'nouvelle') nouvelleSerie();
      else if (action === 'nouvelle-memes-themes') nouvelleSerieMemeThemes();
      else if (action === 'demarrer-chrono') demarrerChrono();
      else if (action === 'valider') avancer(false);
      else if (action === 'passer') { ETAT.chrono.choix = null; avancer(false); }
      else if (action === 'basculer-revue') {
        const rev = document.getElementById('revue');
        const visible = rev.style.display !== 'none';
        rev.style.display = visible ? 'none' : '';
        cible.textContent = visible ? 'Voir la correction détaillée' : 'Masquer la correction détaillée';
        if (!visible) rev.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    r.onchange = function (ev) {
      const cible = ev.target.closest('[data-action="duree"]');
      if (cible) { ETAT.duree = Number(cible.value); ETAT.chrono.restant = ETAT.duree; rendre(); }
    };
  }

  function clicOption(i, k) {
    if (ETAT.mode === 'fiche') {
      if (ETAT.corrigees[i]) return;
      ETAT.reponses[i] = (ETAT.reponses[i] === k) ? null : k;
      majCarte(i);
    } else {
      const c = ETAT.chrono;
      if (c.phase !== 'question' || i !== c.index) return;
      c.choix = (c.choix === k) ? null : k;
      const carte = document.getElementById('carte-courante');
      carte.querySelectorAll('.opt').forEach((b, idx) => b.classList.toggle('choisie', idx === c.choix));
      const bv = document.getElementById('btn-valider');
      if (bv) bv.disabled = c.choix === null;
    }
  }

  // ---------- Export ----------
  window.Automatismes = {
    outils: outils,
    banques: banques,
    enregistrerBanque: enregistrerBanque,
    genererQuestion: genererQuestion,
    famillesDispo: famillesDispo,
    tirerSerie: tirerSerie,
    tirerDansBanque: tirerDansBanque,
    demarrer: demarrer,
    titreBanque: id => (banques[id] ? banques[id].titre : null),
    etat: ETAT
  };
})();
