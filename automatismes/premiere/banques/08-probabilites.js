/* Banque 08 — Probabilités et statistiques
   Les probabilités pèsent 11 % du corpus, les statistiques 4 %. Trois supports
   reviennent systématiquement : l'arbre pondéré (Asie Q5 : P(B) = 0,18 ;
   Centres étrangers Q1 : P(Ā∩B) = 0,42 ; sujet zéro Q1 : p(B) = 0,66),
   le tableau à double entrée (Asie Q4 : P_E(V) = 8/13 ; Centres étrangers Q7 :
   tableau incomplet, 3/5) et le dénombrement direct (Amérique du Nord Q5,
   lettres d'un mot). S'y ajoutent la comparaison médiane / moyenne (Asie Q8)
   et le diagramme en boîte du sujet zéro (Q12).

   Niveau 1 — les bases : lire une probabilité dans un tableau ou sur une
              branche, dénombrer, calculer une médiane.
   Niveau 2 — l'épreuve : probabilité conditionnelle, probabilités totales,
              intersection sur un arbre, moyenne pondérée, lecture d'un
              diagramme en boîte.
   Niveau 3 — bien plus difficile : remonter d'une probabilité totale à une
              branche manquante, tableau à compléter, réunion à partir d'une
              conditionnelle, arbre à trois branches, affirmations sur les
              quartiles.

   Règle du projet (cf. la note sur la Q1 du sujet zéro) : sur un arbre, les
   deux probabilités de chaque nœud sont toujours écrites — jamais une seule
   branche étiquetée, qui rendrait l'énoncé ambigu. */
(function () {
  'use strict';
  const O = Automatismes.outils;
  const { alea, aleaParmi, melanger, arrondir, dec, decL, fracL, pgcd, m, qcm, famille } = O;

  // ---------- options ----------
  const opt = (aff, cle) => ({ affichage: m(aff), cle: cle === undefined ? aff : cle });
  const optTxt = t => ({ affichage: t, cle: t });
  // Une probabilité décimale. Les valeurs hors de ]0 ; 1[ sont écartées : une
  // option négative, nulle ou égale à 1 s'élimine sans le moindre calcul et
  // n'apporte donc rien comme distracteur.
  function pOpt(v) {
    v = arrondir(v, 6);
    if (!isFinite(v) || v <= 0 || v >= 1) return null;
    return { affichage: m(decL(v)), cle: 'p' + v };
  }
  // une probabilité en fraction : la clé est la valeur, deux écritures d'un
  // même nombre ne peuvent donc pas cohabiter dans les options
  function fOpt(n, d) {
    if (!d || !isFinite(n / d) || n <= 0 || n >= d) return null;   // ni 0 ni 1, même raison
    return { affichage: m(fracL(n, d)), cle: 'f' + arrondir(n / d, 6) };
  }
  const nettoyer = liste => liste.filter(Boolean);

  // « 0,4 » en texte brut, pour les étiquettes SVG (jamais typeset)
  const etiqP = v => dec(arrondir(v, 6));

  // =====================================================================
  // Contextes des arbres pondérés
  // Chaque contexte fournit deux événements emboîtés : A (le premier niveau,
  // une dichotomie de la population) et B (le second, conditionné par A).
  // =====================================================================
  const CTX_ARBRE = [
    { intro: 'Une usine fabrique des ampoules dans deux ateliers.', tirage: 'On prélève une ampoule au hasard dans la production.',
      A: 'A', descA: 'l’ampoule provient de l’atelier n° 1', B: 'D', descB: 'l’ampoule est défectueuse' },
    { intro: 'Dans un lycée, une partie des élèves est demi-pensionnaire.', tirage: 'On interroge un élève au hasard.',
      A: 'D', descA: 'l’élève est demi-pensionnaire', B: 'S', descB: 'l’élève pratique un sport en club' },
    { intro: 'Un site de vente en ligne expédie ses commandes depuis deux entrepôts.', tirage: 'On choisit une commande au hasard.',
      A: 'E', descA: 'la commande part de l’entrepôt de Lyon', B: 'R', descB: 'la commande est livrée en 48 heures' },
    { intro: 'Un verger réunit deux variétés de pommiers.', tirage: 'On cueille une pomme au hasard.',
      A: 'V', descA: 'la pomme vient d’un arbre de la variété ancienne', B: 'C', descB: 'la pomme est calibrée « gros fruit »' },
    { intro: 'Une médiathèque distingue les abonnés adultes des abonnés jeunes.', tirage: 'On choisit un emprunt au hasard dans le registre.',
      A: 'J', descA: 'l’emprunt est fait par un abonné jeune', B: 'B', descB: 'l’emprunt porte sur une bande dessinée' },
    { intro: 'Un péage autoroutier voit passer des véhicules légers et des poids lourds.', tirage: 'On observe un véhicule au hasard.',
      A: 'L', descA: 'le véhicule est un poids lourd', B: 'T', descB: 'le véhicule emprunte une voie de télépéage' },
    { intro: 'Un festival propose des concerts en salle et en plein air.', tirage: 'On interroge un spectateur au hasard.',
      A: 'P', descA: 'le spectateur assiste à un concert en plein air', B: 'R', descB: 'le spectateur a réservé sa place en ligne' },
    { intro: 'Une jardinerie vend des sachets de graines de deux fournisseurs.', tirage: 'On sème une graine au hasard.',
      A: 'F', descA: 'la graine vient du premier fournisseur', B: 'G', descB: 'la graine germe' },
    { intro: 'Un atelier de réparation reçoit des appareils sous garantie et hors garantie.', tirage: 'On considère un appareil au hasard.',
      A: 'G', descA: 'l’appareil est encore sous garantie', B: 'R', descB: 'l’appareil est réparé le jour même' },
    { intro: 'Un club de tennis compte des joueurs juniors et des joueurs adultes.', tirage: 'On choisit un licencié au hasard.',
      A: 'J', descA: 'le licencié est un junior', B: 'T', descB: 'le licencié participe au tournoi d’été' },
    { intro: 'Une boulangerie prépare ses pains au levain ou à la levure.', tirage: 'On prend un pain au hasard dans la fournée.',
      A: 'L', descA: 'le pain est préparé au levain', B: 'V', descB: 'le pain est vendu avant midi' },
    { intro: 'Une compagnie ferroviaire fait circuler des trains directs et des trains omnibus.', tirage: 'On choisit un train au hasard dans la journée.',
      A: 'D', descA: 'le train est direct', B: 'H', descB: 'le train arrive à l’heure' },
    { intro: 'Un centre de vacances accueille des groupes scolaires et des familles.', tirage: 'On choisit un séjour au hasard.',
      A: 'S', descA: 'le séjour est celui d’un groupe scolaire', B: 'A', descB: 'le séjour comporte une activité nautique' },
    { intro: 'Une application mobile existe en version gratuite et en version payante.', tirage: 'On choisit un utilisateur au hasard.',
      A: 'P', descA: 'l’utilisateur a la version payante', B: 'N', descB: 'l’utilisateur se connecte tous les jours' },
    { intro: 'Un maraîcher cultive ses tomates sous serre ou en plein champ.', tirage: 'On récolte une tomate au hasard.',
      A: 'S', descA: 'la tomate a poussé sous serre', B: 'M', descB: 'la tomate est mûre à la récolte' },
    { intro: 'Un cinéma programme ses films en version originale sous-titrée ou en version doublée.', tirage: 'On choisit une séance au hasard.',
      A: 'V', descA: 'la séance est en version originale', B: 'C', descB: 'la séance affiche complet' }
  ];

  // Arbre à deux niveaux, les quatre chemins étiquetés. « masque » marque une
  // branche d'un « ? » et laisse sa branche sœur muette : si celle-ci portait sa
  // probabilité, la branche cherchée se lirait par complément à 1 et la formule
  // des probabilités totales deviendrait inutile.
  const SOEUR = { a: 'ac', ac: 'a', b1: 'b1c', b1c: 'b1', b2: 'b2c', b2c: 'b2' };
  function figureArbre(c, a, b1, b2, masque) {
    const e = (v, cle) => (masque === cle ? '?' : (SOEUR[masque] === cle ? '' : etiqP(v)));
    return O.graph.arbrePondere({
      noeuds: [
        { nom: c.A, p: e(a, 'a'), enfants: [
          { nom: c.B, p: e(b1, 'b1') },
          { nom: c.B, barre: true, p: e(1 - b1, 'b1c') }
        ] },
        { nom: c.A, barre: true, p: e(1 - a, 'ac'), enfants: [
          { nom: c.B, p: e(b2, 'b2') },
          { nom: c.B, barre: true, p: e(1 - b2, 'b2c') }
        ] }
      ]
    });
  }

  function introArbre(c) {
    return `${c.intro} ${c.tirage} On note ${m(c.A)} l’événement « ${c.descA} » et ${m(c.B)} l’événement « ${c.descB} ». `
      + `L’arbre pondéré ci-contre traduit la situation.`;
  }

  // Une réponse qui figure déjà sur une branche se trouverait par simple lecture,
  // sans aucun calcul : ces tirages-là sont rejetés.
  function lisibleSurLArbre(valeur, etiquettes) {
    const v = arrondir(valeur, 6);
    return etiquettes.some(x => arrondir(x, 6) === v);
  }
  const branches2 = (a, b1, b2) => [a, 1 - a, b1, 1 - b1, b2, 1 - b2];

  // tire un triplet (a, b1, b2) à une décimale, avec b1 ≠ b2 pour que l'arbre
  // ne soit pas dégénéré (sinon B serait indépendant de A et la question perd son sens)
  function coefsArbre() {
    const a = alea(2, 8) / 10;
    let b1, b2;
    do { b1 = alea(1, 9) / 10; b2 = alea(1, 9) / 10; } while (b1 === b2);
    return { a: arrondir(a, 6), b1: arrondir(b1, 6), b2: arrondir(b2, 6) };
  }

  // =====================================================================
  // Famille A : probabilité d'une intersection lue sur un arbre
  // =====================================================================
  function arbreIntersection(niveau) {
    const c = aleaParmi(CTX_ARBRE);
    const { a, b1, b2 } = coefsArbre();
    // niveau 1 : le chemin du haut ; niveau 2 : le chemin de l'événement contraire
    const hautA = niveau === 1;
    const pA = hautA ? a : 1 - a;
    const pB = hautA ? b1 : b2;
    const nomA = hautA ? c.A : '\\overline{' + c.A + '}';
    const valeur = arrondir(pA * pB, 6);
    if (lisibleSurLArbre(valeur, branches2(a, b1, b2))) return null;

    const bonne = pOpt(valeur);
    if (!bonne) return null;
    const cands = nettoyer([
      pOpt(arrondir(pA + pB, 6)),                     // additionner au lieu de multiplier
      pOpt(pB),                                       // confondre avec la probabilité conditionnelle
      pOpt(arrondir(pA * (1 - pB), 6)),               // suivre l'autre branche
      pOpt(arrondir((1 - pA) * pB, 6)),               // partir du mauvais nœud
      pOpt(arrondir(pA * pB + (1 - pA) * (hautA ? b2 : b1), 6)) // calculer P(B) au lieu de l'intersection
    ]);
    return qcm(`${introArbre(c)} La probabilité ${m('P(' + nomA + ' \\cap ' + c.B + ')')} est égale à :`,
      bonne, cands, {
        figure: figureArbre(c, a, b1, b2),
        explication: `On multiplie les probabilités rencontrées le long du chemin : `
          + `${m('P(' + nomA + ' \\cap ' + c.B + ') = P(' + nomA + ') \\times P_{' + nomA + '}(' + c.B + ') = '
            + decL(pA) + ' \\times ' + decL(pB) + ' = ' + decL(valeur))}. `
          + `Additionner les deux nombres reviendrait à traiter les branches comme des cas incompatibles, ce qu’elles ne sont pas.`
      });
  }

  // niveau 3 : intersection sur un arbre à trois branches au premier niveau
  function arbreIntersectionTrois() {
    const c = aleaParmi(CTX_ARBRE);
    const a1 = alea(2, 5) / 10;
    const a2 = alea(2, 10 - a1 * 10 - 1) / 10;
    const a3 = arrondir(1 - a1 - a2, 6);
    if (a3 <= 0.05) return null;
    const bs = [alea(1, 9) / 10, alea(1, 9) / 10, alea(1, 9) / 10].map(v => arrondir(v, 6));
    if (new Set(bs).size < 3) return null;
    const k = alea(0, 2);
    const noms = ['A_1', 'A_2', 'A_3'];
    const as = [a1, a2, a3];
    const valeur = arrondir(as[k] * bs[k], 6);
    if (lisibleSurLArbre(valeur, as.concat(bs, bs.map(x => 1 - x)))) return null;
    const bonne = pOpt(valeur);
    if (!bonne) return null;
    const cands = nettoyer([
      pOpt(arrondir(as[k] + bs[k], 6)),
      pOpt(bs[k]),
      pOpt(as[k]),
      pOpt(arrondir(as[(k + 1) % 3] * bs[(k + 1) % 3], 6)),
      pOpt(arrondir(as[k] * (1 - bs[k]), 6))
    ]);
    const figure = O.graph.arbrePondere({
      noeuds: [0, 1, 2].map(i => ({
        nom: 'A' + (i + 1), p: etiqP(as[i]),
        enfants: [{ nom: c.B, p: etiqP(bs[i]) }, { nom: c.B, barre: true, p: etiqP(arrondir(1 - bs[i], 6)) }]
      }))
    });
    return qcm(`${c.intro} ${c.tirage} La population se répartit en trois catégories ${m('A_1')}, ${m('A_2')} et ${m('A_3')}, `
      + `et on note ${m(c.B)} l’événement « ${c.descB} ». L’arbre pondéré ci-contre traduit la situation. `
      + `La probabilité ${m('P(' + noms[k] + ' \\cap ' + c.B + ')')} est égale à :`,
      bonne, cands, {
        figure: figure,
        explication: `Le long du chemin qui mène à ${m(noms[k] + ' \\cap ' + c.B)} : `
          + `${m('P(' + noms[k] + ' \\cap ' + c.B + ') = ' + decL(as[k]) + ' \\times ' + decL(bs[k]) + ' = ' + decL(valeur))}. `
          + `Les trois probabilités du premier niveau ont bien pour somme ${m('1')} : ${m(decL(a1) + ' + ' + decL(a2) + ' + ' + decL(a3) + ' = 1')}.`
      });
  }

  // =====================================================================
  // Famille B : probabilités totales — calculer P(B) sur un arbre
  // =====================================================================
  function arbreTotale() {
    const c = aleaParmi(CTX_ARBRE);
    const { a, b1, b2 } = coefsArbre();
    const valeur = arrondir(a * b1 + (1 - a) * b2, 6);
    if (lisibleSurLArbre(valeur, branches2(a, b1, b2))) return null;
    const bonne = pOpt(valeur);
    if (!bonne) return null;
    const cands = nettoyer([
      pOpt(arrondir(a * b1, 6)),                      // n'utiliser qu'un seul chemin
      pOpt(arrondir((1 - a) * b2, 6)),                // n'utiliser que l'autre
      pOpt(arrondir(b1 + b2, 6)),                     // additionner les conditionnelles
      pOpt(arrondir((b1 + b2) / 2, 6)),               // en faire la moyenne
      pOpt(arrondir(b1 * b2, 6))
    ]);
    return qcm(`${introArbre(c)} La probabilité ${m('P(' + c.B + ')')} est égale à :`,
      bonne, cands, {
        figure: figureArbre(c, a, b1, b2),
        explication: `${m(c.B)} se réalise par deux chemins, celui qui passe par ${m(c.A)} et celui qui passe par ${m('\\overline{' + c.A + '}')} : `
          + `${m('P(' + c.B + ') = ' + decL(a) + ' \\times ' + decL(b1) + ' + ' + decL(arrondir(1 - a, 6)) + ' \\times ' + decL(b2)
            + ' = ' + decL(arrondir(a * b1, 6)) + ' + ' + decL(arrondir((1 - a) * b2, 6)) + ' = ' + decL(valeur))}. `
          + `Il faut bien ajouter les deux chemins : n’en garder qu’un revient à oublier une partie de la population.`
      });
  }

  // niveau 3 : arbre à trois branches au premier niveau
  function arbreTotaleTrois() {
    const c = aleaParmi(CTX_ARBRE);
    const a1 = alea(1, 5) / 10;
    const a2 = alea(1, 9 - a1 * 10) / 10;
    const a3 = arrondir(1 - a1 - a2, 6);
    if (a3 <= 0.05) return null;
    const as = [arrondir(a1, 6), arrondir(a2, 6), a3];
    const bs = [alea(1, 9) / 10, alea(1, 9) / 10, alea(1, 9) / 10].map(v => arrondir(v, 6));
    const valeur = arrondir(as[0] * bs[0] + as[1] * bs[1] + as[2] * bs[2], 6);
    if (lisibleSurLArbre(valeur, as.concat(bs, bs.map(x => 1 - x)))) return null;
    const bonne = pOpt(valeur);
    if (!bonne) return null;
    const cands = nettoyer([
      pOpt(arrondir(as[0] * bs[0], 6)),
      pOpt(arrondir(bs[0] + bs[1] + bs[2], 6)),
      pOpt(arrondir((bs[0] + bs[1] + bs[2]) / 3, 6)),
      pOpt(arrondir(as[0] * bs[0] + as[1] * bs[1], 6)),
      pOpt(arrondir(valeur + 0.1, 6))
    ]);
    const figure = O.graph.arbrePondere({
      noeuds: [0, 1, 2].map(i => ({
        nom: 'A' + (i + 1), p: etiqP(as[i]),
        enfants: [{ nom: c.B, p: etiqP(bs[i]) }, { nom: c.B, barre: true, p: etiqP(arrondir(1 - bs[i], 6)) }]
      }))
    });
    return qcm(`${c.intro} ${c.tirage} La population se répartit en trois catégories ${m('A_1')}, ${m('A_2')} et ${m('A_3')}, `
      + `et on note ${m(c.B)} l’événement « ${c.descB} ». L’arbre pondéré ci-contre traduit la situation. `
      + `La probabilité ${m('P(' + c.B + ')')} est égale à :`,
      bonne, cands, {
        figure: figure,
        explication: `${m(c.B)} se réalise par trois chemins : `
          + `${m('P(' + c.B + ') = ' + decL(as[0]) + ' \\times ' + decL(bs[0]) + ' + ' + decL(as[1]) + ' \\times ' + decL(bs[1])
            + ' + ' + decL(as[2]) + ' \\times ' + decL(bs[2]) + ' = ' + decL(valeur))}.`
      });
  }

  // =====================================================================
  // Famille C (niveau 3) : remonter d'une probabilité totale à une branche
  // =====================================================================
  function arbreBrancheManquante() {
    const c = aleaParmi(CTX_ARBRE);
    const a = alea(2, 8) / 10;
    const b1 = alea(1, 9) / 10;
    const b2 = alea(1, 9) / 10;           // c'est cette branche qu'on efface
    if (b1 === b2) return null;
    const pB = arrondir(a * b1 + (1 - a) * b2, 6);
    const bonne = pOpt(arrondir(b2, 6));
    if (!bonne) return null;
    const cands = nettoyer([
      pOpt(arrondir(pB - a * b1, 6)),                 // oublier de diviser par P(Ā)
      pOpt(arrondir(pB, 6)),
      pOpt(arrondir(pB / (1 - a), 6)),                // oublier de retrancher le premier chemin
      pOpt(arrondir(1 - b2, 6)),                      // répondre pour la branche sœur
      pOpt(arrondir((pB - a * b1) / a, 6))            // diviser par P(A)
    ]);
    return qcm(`${introArbre(c)} On sait de plus que ${m('P(' + c.B + ') = ' + decL(pB))}. `
      + `La probabilité manquante, notée ${m('?')} sur l’arbre, est égale à :`,
      bonne, cands, {
        figure: figureArbre(c, arrondir(a, 6), arrondir(b1, 6), arrondir(b2, 6), 'b2'),
        explication: `D’après la formule des probabilités totales, `
          + `${m('P(' + c.B + ') = P(' + c.A + ') \\times P_{' + c.A + '}(' + c.B + ') + P(\\overline{' + c.A + '}) \\times P_{\\overline{' + c.A + '}}(' + c.B + ')')}, `
          + `soit ${m(decL(pB) + ' = ' + decL(arrondir(a, 6)) + ' \\times ' + decL(arrondir(b1, 6)) + ' + ' + decL(arrondir(1 - a, 6)) + ' \\times \\, ?')}. `
          + `Donc ${m('? = \\dfrac{' + decL(pB) + ' - ' + decL(arrondir(a * b1, 6)) + '}{' + decL(arrondir(1 - a, 6)) + '} = \\dfrac{'
            + decL(arrondir(pB - a * b1, 6)) + '}{' + decL(arrondir(1 - a, 6)) + '} = ' + decL(arrondir(b2, 6)))}. `
          + `La branche effacée ne se lit pas directement : elle se déduit, et la division par ${m('P(\\overline{' + c.A + '})')} est indispensable.`
      });
  }

  // =====================================================================
  // Contextes des tableaux à double entrée
  // =====================================================================
  const CTX_TABLEAU = [
    { intro: 'Un club omnisports recense ses adhérents.', unite: 'adhérent', unites: 'adhérents', coin: 'Adhérents', sujet: 'l’adhérent',
      lig: ['Juniors', 'Seniors'], col: ['Tennis', 'Badminton'],
      vL: ['est junior', 'est senior'],
      vC: ['joue au tennis', 'joue au badminton'] },
    { intro: 'Un lycée interroge ses élèves de seconde et de première.', unite: 'élève', unites: 'élèves', coin: 'Élèves', sujet: 'l’élève',
      lig: ['Seconde', 'Première'], col: ['Externe', 'Demi-p.'],
      vL: ['est en seconde', 'est en première'],
      vC: ['est externe', 'est demi-pensionnaire'] },
    { intro: 'Un cinéma étudie la fréquentation d’une soirée.', unite: 'spectateur', unites: 'spectateurs', coin: 'Spectateurs', sujet: 'le spectateur',
      lig: ['Moins 18', '18 et plus'], col: ['Comédie', 'Aventure'],
      vL: ['a moins de 18 ans', 'a 18 ans ou plus'],
      vC: ['assiste à la comédie', 'assiste au film d’aventure'] },
    { intro: 'Une médiathèque analyse les emprunts de la semaine.', unite: 'emprunt', unites: 'emprunts', coin: 'Emprunts', sujet: 'l’emprunt',
      lig: ['Jeunes', 'Adultes'], col: ['Romans', 'BD'],
      vL: ['est fait par un jeune', 'est fait par un adulte'],
      vC: ['porte sur un roman', 'porte sur une bande dessinée'] },
    { intro: 'Une entreprise interroge ses salariés sur leur trajet domicile-travail.', unite: 'salarié', unites: 'salariés', coin: 'Salariés', sujet: 'le salarié',
      lig: ['Atelier', 'Bureau'], col: ['Vélo', 'Voiture'],
      vL: ['travaille à l’atelier', 'travaille au bureau'],
      vC: ['vient à vélo', 'vient en voiture'] },
    { intro: 'Un camping enregistre ses réservations du mois d’août.', unite: 'séjour', unites: 'séjours', coin: 'Séjours', sujet: 'le séjour',
      lig: ['Tentes', 'Camping-cars'], col: ['1 semaine', '2 semaines'],
      vL: ['se fait sous tente', 'se fait en camping-car'],
      vC: ['dure une semaine', 'dure deux semaines'] },
    { intro: 'Une école de musique répartit ses élèves par instrument et par niveau.', unite: 'élève', unites: 'élèves', coin: 'Élèves', sujet: 'l’élève',
      lig: ['Piano', 'Guitare'], col: ['Débutants', 'Confirmés'],
      vL: ['apprend le piano', 'apprend la guitare'],
      vC: ['est débutant', 'est confirmé'] },
    { intro: 'Un marché de producteurs recense ses exposants.', unite: 'exposant', unites: 'exposants', coin: 'Exposants', sujet: 'l’exposant',
      lig: ['Alimentaire', 'Artisanat'], col: ['Matin', 'Journée'],
      vL: ['vend de l’alimentaire', 'vend de l’artisanat'],
      vC: ['n’est là que le matin', 'reste toute la journée'] },
    { intro: 'Un service après-vente classe les appareils reçus en un mois.', unite: 'appareil', unites: 'appareils', coin: 'Appareils', sujet: 'l’appareil',
      lig: ['Sous garantie', 'Hors garantie'], col: ['Réparés', 'Remplacés'],
      vL: ['est sous garantie', 'est hors garantie'],
      vC: ['est réparé', 'est remplacé'] },
    { intro: 'Une application mobile étudie ses utilisateurs actifs.', unite: 'utilisateur', unites: 'utilisateurs', coin: 'Utilisateurs', sujet: 'l’utilisateur',
      lig: ['Gratuit', 'Payant'], col: ['Android', 'iOS'],
      vL: ['a la version gratuite', 'a la version payante'],
      vC: ['est sur Android', 'est sur iOS'] },
    { intro: 'Une jardinerie suit la reprise de ses plants au printemps.', unite: 'plant', unites: 'plants', coin: 'Plants', sujet: 'le plant',
      lig: ['Serre', 'Extérieur'], col: ['Repris', 'Perdus'],
      vL: ['a été élevé en serre', 'a été élevé à l’extérieur'],
      vC: ['a repris', 'a été perdu'] },
    { intro: 'Un centre de tri contrôle les colis d’une matinée.', unite: 'colis', unites: 'colis', coin: 'Colis', sujet: 'le colis',
      lig: ['Standard', 'Express'], col: ['À l’heure', 'En retard'],
      vL: ['est en envoi standard', 'est en envoi express'],
      vC: ['part à l’heure', 'part en retard'] }
  ];
  // « le spectateur a moins de 18 ans » : phrase complète, à l'indicatif, utilisable
  // aussi bien après « on constate que » que comme nom d'événement entre guillemets
  const evL = (c, i) => c.sujet + ' ' + c.vL[i];
  const evC = (c, j) => c.sujet + ' ' + c.vC[j];

  // tire un tableau 2×2 dont les effectifs sont lisibles et non proportionnels
  // (sinon les deux catégories auraient la même répartition et la conditionnelle
  //  serait égale à la probabilité simple : la question perdrait son intérêt)
  function effectifs2x2() {
    for (let i = 0; i < 60; i++) {
      const n11 = alea(2, 20), n12 = alea(2, 20), n21 = alea(2, 20), n22 = alea(2, 20);
      const l1 = n11 + n12, l2 = n21 + n22, c1 = n11 + n21, c2 = n12 + n22;
      const N = l1 + l2;
      if (N < 20 || N > 90) continue;
      if (n11 * n22 === n12 * n21) continue;                 // répartitions identiques
      if (n11 * l2 === n21 * l1) continue;                   // même chose, vu en colonnes
      return { n: [[n11, n12], [n21, n22]], l: [l1, l2], c: [c1, c2], N };
    }
    return null;
  }

  function figureTableau(ctx, t, masque) {
    const cellule = (i, j) => (masque && masque[0] === i && masque[1] === j ? '?' : String(t.n[i][j]));
    return O.graph.tableauCroise({
      coin: ctx.coin,
      colonnes: ctx.col.concat(['Total']),
      lignes: [
        { label: ctx.lig[0], cases: [cellule(0, 0), cellule(0, 1), String(t.l[0])] },
        { label: ctx.lig[1], cases: [cellule(1, 0), cellule(1, 1), String(t.l[1])] },
        { label: 'Total', cases: [String(t.c[0]), String(t.c[1]), String(t.N)] }
      ]
    });
  }

  // =====================================================================
  // Famille D : lire une probabilité dans un tableau à double entrée
  // =====================================================================
  function tableauProba(niveau) {
    const ctx = aleaParmi(CTX_TABLEAU);
    const t = effectifs2x2();
    if (!t) return null;
    const i = alea(0, 1), j = alea(0, 1);
    const nij = t.n[i][j], li = t.l[i], cj = t.c[j], N = t.N;

    if (niveau === 1) {
      // probabilité simple ou probabilité d'une intersection
      const inter = Math.random() < 0.5;
      const bonne = inter ? fOpt(nij, N) : fOpt(cj, N);
      if (!bonne) return null;
      const cands = nettoyer(inter
        ? [fOpt(nij, li), fOpt(nij, cj), fOpt(li, N), fOpt(cj, N), fOpt(N - nij, N)]
        : [fOpt(t.c[1 - j], N), fOpt(cj, li), fOpt(li, N), fOpt(nij, N), fOpt(cj, t.c[1 - j])]);
      const entete = `${ctx.intro} Le tableau ci-contre donne la répartition des ${N} ${ctx.unites} recensés. On en choisit un au hasard. `;
      const enonce = inter
        ? entete + `La probabilité de l’événement « ${evL(ctx, i)} et ${ctx.vC[j]} » est égale à :`
        : entete + `La probabilité de l’événement « ${evC(ctx, j)} » est égale à :`;
      return qcm(enonce, bonne, cands, {
        figure: figureTableau(ctx, t),
        explication: inter
          ? `La case commune à la ligne « ${ctx.lig[i]} » et à la colonne « ${ctx.col[j]} » contient ${m(String(nij))} ${ctx.unites} sur ${m(String(N))} au total, `
            + `d’où une probabilité de ${m('\\dfrac{' + nij + '}{' + N + '}' + (pgcd(nij, N) > 1 ? ' = ' + fracL(nij, N) : ''))}.`
          : `La colonne « ${ctx.col[j]} » totalise ${m(String(cj))} ${ctx.unites} sur ${m(String(N))}, `
            + `d’où ${m('\\dfrac{' + cj + '}{' + N + '}' + (pgcd(cj, N) > 1 ? ' = ' + fracL(cj, N) : ''))}. `
            + `Le dénominateur est l’effectif total, jamais celui d’une ligne.`
      });
    }

    // niveaux 2 et 3 : probabilité conditionnelle, dans un sens ou dans l'autre
    const parLigne = niveau === 2 ? true : Math.random() < 0.5;
    const bonne = parLigne ? fOpt(nij, li) : fOpt(nij, cj);
    if (!bonne) return null;
    const cands = nettoyer([
      parLigne ? fOpt(nij, cj) : fOpt(nij, li),       // conditionner dans l'autre sens
      fOpt(nij, N),                                   // confondre avec l'intersection
      fOpt(parLigne ? li : cj, N),                    // donner la probabilité de l'événement conditionnant
      fOpt(parLigne ? li - nij : cj - nij, parLigne ? li : cj),  // l'événement contraire
      fOpt(parLigne ? t.l[1 - i] : t.c[1 - j], N)
    ]);
    const sachant = parLigne ? evL(ctx, i) : evC(ctx, j);
    const cherche = parLigne ? evC(ctx, j) : evL(ctx, i);
    const den = parLigne ? li : cj;
    return qcm(`${ctx.intro} Le tableau ci-contre donne la répartition des ${N} ${ctx.unites} recensés. `
      + `On en choisit un au hasard et on constate que ${sachant}. `
      + `La probabilité de l’événement « ${cherche} » est alors égale à :`,
      bonne, cands, {
        figure: figureTableau(ctx, t),
        explication: `L’information « ${sachant} » restreint l’étude à ${m(String(den))} ${ctx.unites} : `
          + `c’est ce nombre qui devient le dénominateur, et non le total ${m(String(N))}. `
          + `Parmi eux, ${m(String(nij))} vérifient l’autre condition, d’où `
          + `${m('\\dfrac{' + nij + '}{' + den + '}' + (pgcd(nij, den) > 1 ? ' = ' + fracL(nij, den) : ''))}.`
      });
  }

  // =====================================================================
  // Famille E (niveaux 2-3) : tableau à compléter
  // =====================================================================
  function tableauIncomplet() {
    const ctx = aleaParmi(CTX_TABLEAU);
    const t = effectifs2x2();
    if (!t) return null;
    const i = alea(0, 1), j = alea(0, 1);             // case effacée
    // on interroge une probabilité qui a besoin de la case effacée
    const nij = t.n[i][j], li = t.l[i], cj = t.c[j], N = t.N;
    const parLigne = Math.random() < 0.5;
    const den = parLigne ? li : cj;
    const bonne = fOpt(nij, den);
    if (!bonne) return null;
    const autre = parLigne ? t.n[i][1 - j] : t.n[1 - i][j];
    const cands = nettoyer([
      fOpt(autre, den),                               // lire la case visible au lieu de la calculer
      fOpt(nij, N),
      fOpt(nij, parLigne ? cj : li),
      fOpt(den - nij, den),
      fOpt(den, N)
    ]);
    const sachant = parLigne ? evL(ctx, i) : evC(ctx, j);
    const cherche = parLigne ? evC(ctx, j) : evL(ctx, i);
    return qcm(`${ctx.intro} Le tableau ci-contre est incomplet : l’effectif marqué ${m('?')} n’a pas été reporté. `
      + `On choisit un ${ctx.unite} au hasard parmi les ${N} recensés et on constate que ${sachant}. `
      + `La probabilité de l’événement « ${cherche} » est égale à :`,
      bonne, cands, {
        figure: figureTableau(ctx, t, [i, j]),
        explication: `La case manquante se retrouve par différence : `
          + `${m(String(parLigne ? li : cj) + ' - ' + String(autre) + ' = ' + String(nij))}. `
          + `L’information « ${sachant} » ramène ensuite l’étude à ${m(String(den))} ${ctx.unites}, `
          + `d’où ${m('\\dfrac{' + nij + '}{' + den + '}' + (pgcd(nij, den) > 1 ? ' = ' + fracL(nij, den) : ''))}.`
      });
  }

  // =====================================================================
  // Famille F : dénombrement direct
  // =====================================================================
  const MOTS = ['ANNIVERSAIRE', 'MATHEMATIQUES', 'ORDINATEUR', 'PROBABILITE', 'BIBLIOTHEQUE', 'RESTAURANT',
    'TELEPHONE', 'CALCULATRICE', 'MONTAGNE', 'PARAPLUIE', 'HORLOGE', 'SPECTACLE', 'CHOCOLAT',
    'DICTIONNAIRE', 'PARALLELE', 'TRIANGLE', 'CONFITURE', 'TROMBONE'];
  const VOYELLES = 'AEIOU';
  const estVoyelle = l => VOYELLES.indexOf(l) !== -1;

  // « pron » est le pronom de l'objet tiré, « coul » les couleurs au pluriel et
  // « sing » au singulier accordé : le genre est déclaré, jamais deviné.
  const CTX_URNE = [
    { contenant: 'Une urne', objet: 'jeton', pron: 'il', coul: ['rouges', 'verts', 'bleus'], sing: ['rouge', 'vert', 'bleu'] },
    { contenant: 'Un sac', objet: 'bille', pron: 'elle', coul: ['jaunes', 'noires', 'blanches'], sing: ['jaune', 'noire', 'blanche'] },
    { contenant: 'Une trousse', objet: 'stylo', pron: 'il', coul: ['bleus', 'noirs', 'rouges'], sing: ['bleu', 'noir', 'rouge'] },
    { contenant: 'Un panier', objet: 'fleur', pron: 'elle', coul: ['roses', 'blanches', 'jaunes'], sing: ['rose', 'blanche', 'jaune'] },
    { contenant: 'Une boîte', objet: 'bouton', pron: 'il', coul: ['dorés', 'argentés', 'noirs'], sing: ['doré', 'argenté', 'noir'] },
    { contenant: 'Un carton', objet: 'écharpe', pron: 'elle', coul: ['grises', 'vertes', 'beiges'], sing: ['grise', 'verte', 'beige'] }
  ];

  function denombrement(niveau) {
    if (Math.random() < 0.45) {
      // tirage d'une lettre dans un mot
      const mot = aleaParmi(MOTS);
      const n = mot.length;
      const voy = mot.split('').filter(estVoyelle).length;
      if (niveau === 1) {
        const cherche = Math.random() < 0.5;
        const k = cherche ? voy : n - voy;
        const bonne = fOpt(k, n);
        if (!bonne) return null;
        const cands = nettoyer([fOpt(n - k, n), fOpt(k, n - k), fOpt(k, k + 1), fOpt(1, n), fOpt(k - 1, n)]);
        return qcm(`On écrit chacune des ${n} lettres du mot ${m('\\text{' + mot + '}')} sur un jeton, puis on tire un jeton au hasard. `
          + `La probabilité d’obtenir ${cherche ? 'une voyelle' : 'une consonne'} est égale à :`,
          bonne, cands, {
            explication: `Le mot ${m('\\text{' + mot + '}')} compte ${m(String(n))} lettres, dont ${m(String(voy))} voyelles et ${m(String(n - voy))} consonnes. `
              + `Les tirages étant équiprobables, la probabilité cherchée vaut `
              + `${m('\\dfrac{' + k + '}{' + n + '}' + (pgcd(k, n) > 1 ? ' = ' + fracL(k, n) : ''))}. `
              + `Attention : on compte les lettres écrites, une lettre répétée comptant autant de fois qu’elle apparaît.`
          });
      }
      // niveaux 2 et 3 : conditionnelle par dénombrement
      const lettres = mot.split('');
      const cons = lettres.filter(l => !estVoyelle(l));
      const surCons = Math.random() < 0.5 && cons.length >= 3;
      const univers = surCons ? cons : lettres.filter(estVoyelle);
      if (univers.length < 3) return null;
      const cible = aleaParmi(Array.from(new Set(univers)));
      const k = univers.filter(l => l === cible).length;
      const bonne = fOpt(k, univers.length);
      if (!bonne) return null;
      const cands = nettoyer([
        fOpt(k, n),                                   // ne pas restreindre l'univers
        fOpt(univers.length, n),
        fOpt(k, n - univers.length),
        fOpt(univers.length - k, univers.length),
        fOpt(1, univers.length)
      ]);
      return qcm(`On écrit chacune des ${n} lettres du mot ${m('\\text{' + mot + '}')} sur un jeton, puis on tire un jeton au hasard. `
        + `Sachant que la lettre obtenue est ${surCons ? 'une consonne' : 'une voyelle'}, `
        + `la probabilité que ce soit la lettre ${m('\\text{' + cible + '}')} est égale à :`,
        bonne, cands, {
          explication: `L’information « la lettre est ${surCons ? 'une consonne' : 'une voyelle'} » ramène l’univers à `
            + `${m(String(univers.length))} jetons, et non aux ${m(String(n))} jetons de départ. `
            + `La lettre ${m('\\text{' + cible + '}')} y figure ${m(String(k))} fois, d’où `
            + `${m('\\dfrac{' + k + '}{' + univers.length + '}' + (pgcd(k, univers.length) > 1 ? ' = ' + fracL(k, univers.length) : ''))}.`
        });
    }

    // tirage dans une urne à trois couleurs
    const u = aleaParmi(CTX_URNE);
    const a = alea(3, 12), b = alea(3, 12), c = alea(3, 12);
    const N = a + b + c;
    const eff = [a, b, c];
    const k = alea(0, 2);
    const detail = `${u.contenant} contient ${a} ${u.objet}s ${u.coul[0]}, ${b} ${u.objet}s ${u.coul[1]} et ${c} ${u.objet}s ${u.coul[2]}. `
      + `On en tire un au hasard.`;
    if (niveau === 1) {
      const bonne = fOpt(eff[k], N);
      if (!bonne) return null;
      const cands = nettoyer([
        fOpt(eff[k], N - eff[k]),                     // rapporter au reste au lieu du total
        fOpt(N - eff[k], N),
        fOpt(eff[(k + 1) % 3], N),
        fOpt(1, 3),                                   // croire à l'équiprobabilité des couleurs
        fOpt(eff[k], eff[(k + 1) % 3])
      ]);
      return qcm(`${detail} La probabilité qu’${u.pron} soit ${u.sing[k]} est égale à :`, bonne, cands, {
        explication: `Il y a ${m(String(N))} ${u.objet}s au total, dont ${m(String(eff[k]))} ${u.coul[k]} : `
          + `${m('\\dfrac{' + eff[k] + '}{' + N + '}' + (pgcd(eff[k], N) > 1 ? ' = ' + fracL(eff[k], N) : ''))}. `
          + `Il y a trois couleurs, mais elles ne sont pas également représentées : la réponse n’est pas ${m('\\frac{1}{3}')}.`
      });
    }
    // conditionnelle : « sachant qu'il n'est pas de la couleur … »
    const exclu = alea(0, 2);
    let cible = alea(0, 2);
    if (cible === exclu) cible = (cible + 1) % 3;
    const reste = N - eff[exclu];
    const bonne = fOpt(eff[cible], reste);
    if (!bonne) return null;
    const cands = nettoyer([
      fOpt(eff[cible], N),                            // oublier de restreindre l'univers
      fOpt(reste - eff[cible], reste),
      fOpt(eff[exclu], N),
      fOpt(reste, N),
      fOpt(1, 2)
    ]);
    return qcm(`${detail} Sachant qu’${u.pron} n’est pas ${u.sing[exclu]}, la probabilité qu’${u.pron} soit ${u.sing[cible]} est égale à :`,
      bonne, cands, {
        explication: `Écarter les ${m(String(eff[exclu]))} ${u.objet}s ${u.coul[exclu]} laisse `
          + `${m(String(N) + ' - ' + String(eff[exclu]) + ' = ' + String(reste))} ${u.objet}s possibles. `
          + `Parmi eux, ${m(String(eff[cible]))} sont ${u.coul[cible]}, d’où `
          + `${m('\\dfrac{' + eff[cible] + '}{' + reste + '}' + (pgcd(eff[cible], reste) > 1 ? ' = ' + fracL(eff[cible], reste) : ''))}. `
          + `Le dénominateur n’est plus ${m(String(N))}.`
      });
  }

  // =====================================================================
  // Famille G : réunion de deux événements
  // =====================================================================
  const CTX_AB = [
    { intro: 'Dans une classe, on interroge un élève au hasard.', A: 'l’élève étudie l’espagnol', B: 'l’élève est inscrit à l’association sportive' },
    { intro: 'Dans un immeuble, on choisit un logement au hasard.', A: 'le logement possède un balcon', B: 'le logement possède un garage' },
    { intro: 'Dans une gare, on interroge un voyageur au hasard.', A: 'le voyageur a un abonnement', B: 'le voyageur voyage en première classe' },
    { intro: 'Dans un verger, on cueille une pomme au hasard.', A: 'la pomme est tachée', B: 'la pomme est de petit calibre' },
    { intro: 'Dans une bibliothèque, on choisit un livre au hasard.', A: 'le livre est un roman', B: 'le livre a été publié après 2010' },
    { intro: 'Dans un parking, on regarde une voiture au hasard.', A: 'la voiture est électrique', B: 'la voiture est immatriculée dans le département' },
    { intro: 'Dans un magasin, on choisit un article au hasard.', A: 'l’article est en promotion', B: 'l’article est en rupture de stock' },
    { intro: 'Dans un centre de loisirs, on interroge un enfant au hasard.', A: 'l’enfant fait de la poterie', B: 'l’enfant fait de l’escalade' }
  ];

  function reunion(niveau) {
    const c = aleaParmi(CTX_AB);
    if (niveau === 2) {
      const pA = alea(2, 6) / 10, pB = alea(2, 6) / 10;
      const pI = alea(1, Math.min(pA, pB) * 10) / 10;
      const val = arrondir(pA + pB - pI, 6);
      if (val > 1) return null;
      const bonne = pOpt(val);
      if (!bonne) return null;
      const cands = nettoyer([
        pOpt(arrondir(pA + pB, 6)),                   // oublier de retrancher l'intersection
        pOpt(arrondir(pA + pB + pI, 6)),
        pOpt(arrondir(pA * pB, 6)),
        pOpt(arrondir(pI, 6)),
        pOpt(arrondir(Math.abs(pA - pB), 6))
      ]);
      return qcm(`${c.intro} On note ${m('A')} l’événement « ${c.A} » et ${m('B')} l’événement « ${c.B} ». `
        + `On sait que ${m('P(A) = ' + decL(arrondir(pA, 6)))}, ${m('P(B) = ' + decL(arrondir(pB, 6)))} et `
        + `${m('P(A \\cap B) = ' + decL(arrondir(pI, 6)))}. Alors ${m('P(A \\cup B)')} est égale à :`,
        bonne, cands, {
          explication: `${m('P(A \\cup B) = P(A) + P(B) - P(A \\cap B) = ' + decL(arrondir(pA, 6)) + ' + ' + decL(arrondir(pB, 6))
            + ' - ' + decL(arrondir(pI, 6)) + ' = ' + decL(val))}. `
            + `Sans le retrait de ${m('P(A \\cap B)')}, les éléments communs aux deux événements seraient comptés deux fois.`
        });
    }
    // niveau 3 : l'intersection n'est pas donnée, elle se calcule avec une conditionnelle
    const pA = alea(2, 7) / 10, pB = alea(2, 7) / 10;
    const cond = alea(1, 9) / 10;
    const pI = arrondir(pA * cond, 6);
    if (pI > pB) return null;                        // P(A∩B) ⩽ P(B), sinon la situation est impossible
    const val = arrondir(pA + pB - pI, 6);
    if (val > 1) return null;
    const bonne = pOpt(val);
    if (!bonne) return null;
    const cands = nettoyer([
      pOpt(arrondir(pA + pB - cond, 6)),              // prendre la conditionnelle pour l'intersection
      pOpt(arrondir(pA + pB, 6)),
      pOpt(arrondir(pA + pB - pB * cond, 6)),         // multiplier par la mauvaise probabilité
      pOpt(pI),
      pOpt(arrondir(pA * pB, 6))
    ]);
    return qcm(`${c.intro} On note ${m('A')} l’événement « ${c.A} » et ${m('B')} l’événement « ${c.B} ». `
      + `On sait que ${m('P(A) = ' + decL(arrondir(pA, 6)))}, ${m('P(B) = ' + decL(arrondir(pB, 6)))} et `
      + `${m('P_A(B) = ' + decL(arrondir(cond, 6)))}. Alors ${m('P(A \\cup B)')} est égale à :`,
      bonne, cands, {
        explication: `On calcule d’abord l’intersection : ${m('P(A \\cap B) = P(A) \\times P_A(B) = ' + decL(arrondir(pA, 6))
          + ' \\times ' + decL(arrondir(cond, 6)) + ' = ' + decL(pI))}. `
          + `Puis ${m('P(A \\cup B) = ' + decL(arrondir(pA, 6)) + ' + ' + decL(arrondir(pB, 6)) + ' - ' + decL(pI) + ' = ' + decL(val))}. `
          + `${m('P_A(B)')} n’est pas ${m('P(A \\cap B)')} : c’est une probabilité calculée dans l’univers réduit à ${m('A')}.`
      });
  }

  // =====================================================================
  // Statistiques — séries et tableaux d'effectifs
  // =====================================================================
  // Chaque contexte déclare la plage des valeurs plausibles : sans elle, on
  // obtient une note de 26 sur 20, un joueur de 3 ans ou 26 buts dans un match.
  const CTX_SERIE = [
    { intro: 'Voici les notes obtenues par les élèves d’un groupe à un devoir noté sur 20', valeurNom: 'Note', effNom: 'Effectif', min: 3, max: 19 },
    { intro: 'Voici le nombre de buts marqués par une équipe à chacun de ses matchs', valeurNom: 'Buts', effNom: 'Matchs', min: 0, max: 6 },
    { intro: 'Voici le nombre de livres empruntés en un mois par les abonnés d’une médiathèque', valeurNom: 'Livres', effNom: 'Abonnés', min: 0, max: 9 },
    { intro: 'Voici le nombre de personnes par foyer dans un petit immeuble', valeurNom: 'Personnes', effNom: 'Foyers', min: 1, max: 6 },
    { intro: 'Voici le nombre de jours de pluie par mois relevés dans une commune', valeurNom: 'Jours', effNom: 'Mois', min: 2, max: 20 },
    { intro: 'Voici l’âge des joueurs d’une équipe de club', valeurNom: 'Âge', effNom: 'Joueurs', min: 17, max: 34 },
    { intro: 'Voici le nombre de frères et sœurs des élèves d’une classe', valeurNom: 'Frères et sœurs', effNom: 'Élèves', min: 0, max: 5 },
    { intro: 'Voici le nombre de trains en retard par jour dans une gare', valeurNom: 'Trains', effNom: 'Jours', min: 0, max: 12 }
  ];

  // suite de k valeurs strictement croissantes, contenue dans la plage du contexte
  function valeursCroissantes(c, k, pasMax) {
    const pas = [];
    let somme = 0;
    for (let i = 0; i < k - 1; i++) { const p = alea(1, pasMax); pas.push(p); somme += p; }
    if (somme > c.max - c.min) return null;
    const vals = [alea(c.min, c.max - somme)];
    pas.forEach(p => vals.push(vals[vals.length - 1] + p));
    return vals;
  }

  // Séries franchement dissymétriques : quelques valeurs très élevées tirent la
  // moyenne sans déplacer la médiane. Les contextes ci-dessus ne s'y prêtent pas
  // (une note ne peut pas valoir cinq fois la moyenne), d'où une liste à part,
  // chacun avec ses quatre paliers de valeurs.
  const CTX_DISSYM = [
    { intro: 'Voici le nombre de livres empruntés en un an par les abonnés d’une médiathèque', valeurNom: 'Livres', effNom: 'Abonnés',
      paliers: [[1, 3], [5, 8], [12, 16], [30, 44]] },
    { intro: 'Voici le temps d’attente, en minutes, relevé au guichet d’une agence', valeurNom: 'Minutes', effNom: 'Clients',
      paliers: [[1, 3], [5, 8], [12, 18], [40, 60]] },
    { intro: 'Voici le montant, en euros, des achats faits en une heure dans une boutique', valeurNom: 'Montant', effNom: 'Achats',
      paliers: [[4, 8], [12, 18], [25, 35], [90, 140]] },
    { intro: 'Voici le nombre de messages envoyés dans la journée par les membres d’un groupe', valeurNom: 'Messages', effNom: 'Membres',
      paliers: [[1, 4], [6, 10], [15, 22], [60, 90]] },
    { intro: 'Voici la distance, en kilomètres, entre le domicile et le travail des salariés d’une entreprise', valeurNom: 'Distance', effNom: 'Salariés',
      paliers: [[1, 4], [6, 10], [15, 20], [55, 80]] },
    { intro: 'Voici le nombre de colis déposés par jour dans un point relais', valeurNom: 'Colis', effNom: 'Jours',
      paliers: [[2, 5], [8, 12], [18, 25], [60, 90]] }
  ];

  // médiane d'une série triée donnée par valeurs + effectifs
  function medianeSerie(vals, effs) {
    const total = effs.reduce((s, e) => s + e, 0);
    const rang = k => {                                // valeur de rang k (1-indexé)
      let c = 0;
      for (let i = 0; i < vals.length; i++) { c += effs[i]; if (k <= c) return vals[i]; }
      return vals[vals.length - 1];
    };
    return total % 2 ? rang((total + 1) / 2) : (rang(total / 2) + rang(total / 2 + 1)) / 2;
  }
  const moyenneSerie = (vals, effs) => arrondir(vals.reduce((s, v, i) => s + v * effs[i], 0) / effs.reduce((s, e) => s + e, 0), 6);

  function tableauEffectifs(c, vals, effs) {
    return O.graph.tableauCroise({
      coin: c.valeurNom,
      colonnes: vals.map(String),
      lignes: [{ label: c.effNom, cases: effs.map(String) }],
      totaux: false
    });
  }

  // ---------- niveau 1 : médiane d'une liste de valeurs ----------
  function medianeListe() {
    const c = aleaParmi(CTX_SERIE);
    const n = aleaParmi([7, 9]);
    if (c.max - c.min < 5) return null;               // sans étalement, la liste est plate
    const liste = [];
    for (let i = 0; i < n; i++) liste.push(alea(c.min, c.max));
    const trie = liste.slice().sort((x, y) => x - y);
    const med = trie[(n - 1) / 2];
    const moy = arrondir(liste.reduce((s, v) => s + v, 0) / n, 6);
    const brut = liste[(n - 1) / 2];                  // la valeur du milieu… de la liste non triée
    if (brut === med) return null;                    // sans quoi l'erreur classique donne la bonne réponse
    const bonne = opt(String(med), 'v' + med);
    const cands = [
      opt(String(brut), 'v' + brut),
      opt(decL((trie[0] + trie[n - 1]) / 2), 'v' + arrondir((trie[0] + trie[n - 1]) / 2, 6)),
      opt(decL(moy), 'v' + moy),
      opt(String(trie[n - 1] - trie[0]), 'v' + (trie[n - 1] - trie[0]))
    ];
    return qcm(`${c.intro} : ${liste.join(' ; ')}. La médiane de cette série est égale à :`,
      bonne, cands, {
        explication: `Il faut d’abord ranger les valeurs dans l’ordre croissant : ${trie.join(' ; ')}. `
          + `La série compte ${m(String(n))} valeurs, un nombre impair : la médiane est la ${m('' + ((n + 1) / 2) + '^\\text{e}')} valeur de cette liste triée, soit ${m(String(med))}. `
          + `Prendre la valeur du milieu de la liste initiale, sans la trier, est l’erreur la plus fréquente.`
      });
  }

  // découpe un effectif total N en k parts non nulles (composition aléatoire)
  function repartirEffectifs(N, k) {
    const coupures = melanger(Array.from({ length: N - 1 }, (_, i) => i + 1)).slice(0, k - 1).sort((x, y) => x - y);
    const parts = [];
    let prec = 0;
    coupures.concat([N]).forEach(c => { parts.push(c - prec); prec = c; });
    return parts;
  }

  // ---------- niveau 2 : moyenne pondérée lue dans un tableau ----------
  function moyennePonderee() {
    const c = aleaParmi(CTX_SERIE);
    const k = aleaParmi([4, 5]);
    const vals = valeursCroissantes(c, k, 2);
    if (!vals) return null;
    // l'effectif total est choisi d'avance (10 ou 20) : la moyenne tombe alors
    // sur une décimale exacte, calculable de tête, sans rejeter des tirages entiers
    const N = aleaParmi([10, 10, 20]);
    const effs = repartirEffectifs(N, k);
    const somme = vals.reduce((s, v, i) => s + v * effs[i], 0);
    if (N === 20 && somme % 2 !== 0) return null;    // sinon la moyenne aurait deux décimales
    const moy = arrondir(somme / N, 6);
    const naive = arrondir(vals.reduce((s, v) => s + v, 0) / k, 6);
    if (naive === moy) return null;                   // l'erreur classique doit être distincte
    const bonne = opt(decL(moy), 'v' + moy);
    const cands = nettoyer([
      opt(decL(naive), 'v' + naive),                  // moyenne des valeurs, sans les effectifs
      opt(decL(medianeSerie(vals, effs)), 'v' + medianeSerie(vals, effs)),
      opt(String(somme), 'v' + somme),
      opt(decL(arrondir(N / k, 6)), 'v' + arrondir(N / k, 6)),
      opt(String(vals[k - 1] - vals[0]), 'v' + (vals[k - 1] - vals[0]))
    ]);
    return qcm(`${c.intro}. Le tableau ci-contre donne les effectifs. La moyenne de cette série est égale à :`,
      bonne, cands, {
        figure: tableauEffectifs(c, vals, effs),
        explication: `Chaque valeur compte autant de fois que son effectif : `
          + `${m('\\overline{x} = \\dfrac{' + vals.map((v, i) => v + ' \\times ' + effs[i]).join(' + ') + '}{' + N + '} = \\dfrac{' + somme + '}{' + N + '} = ' + decL(moy))}. `
          + `Faire la moyenne des ${m(String(k))} valeurs sans tenir compte des effectifs donnerait ${m(decL(naive))}, ce qui est faux.`
      });
  }

  /* ---------- niveaux 2-3 : problème inverse, retrouver une case du tableau
     connaissant la moyenne.
     Niveau 2 — c'est une VALEUR qui manque : l'inconnue n'est qu'au numérateur,
                l'équation se résout par étapes (somme totale, puis division par
                l'effectif de la colonne).
     Niveau 3 — c'est un EFFECTIF qui manque : l'inconnue figure au numérateur
                ET au dénominateur, il faut passer par une vraie équation.
     ------------------------------------------------------------------------ */
  function moyenneValeurManquante() {
    for (let essai = 0; essai < 80; essai++) {
      const c = aleaParmi(CTX_SERIE);
      const k = aleaParmi([4, 5]);
      // Les valeurs connues occupent les premières colonnes et l'inconnue la
      // dernière : placée entre deux valeurs connues, l'ordre croissant du
      // tableau la trahirait (« 3 | x | 5 » impose x = 4 sans aucun calcul).
      const connues = valeursCroissantes({ min: c.min, max: c.max - 3 }, k - 1, 2);
      if (!connues) continue;
      const j = k - 1;
      const x = alea(connues[k - 2] + 1, c.max);      // plusieurs valeurs restent possibles
      const vals = connues.concat([x]);
      const N = aleaParmi([10, 10, 20]);
      const effs = repartirEffectifs(N, k);
      if (effs[j] < 2 || effs[j] > 5) continue;       // l'effectif doit peser, sans alourdir le calcul
      const somme = vals.reduce((s, v, i) => s + v * effs[i], 0);
      if (N === 20 && somme % 2 !== 0) continue;      // sinon la moyenne aurait deux décimales
      const moy = arrondir(somme / N, 6);
      const reste = somme - x * effs[j];              // apport des colonnes connues
      const part = x * effs[j];                       // apport attendu de la colonne effacée

      // erreurs classiques
      const sansEffectif = part;                                    // ne pas diviser par l'effectif
      const sansPonderation = arrondir(moy * k - connues.reduce((s, v) => s + v, 0), 6);
      const parLeTotal = arrondir(part / N, 6);                     // diviser par l'effectif total
      const optV = v => (isFinite(v) && v > 0 && v < 1000 ? opt(decL(v), 'v' + arrondir(v, 6)) : null);
      const cands = nettoyer([optV(moy), optV(sansEffectif), optV(sansPonderation), optV(parLeTotal), optV(arrondir(x + effs[j], 6))]);

      const q = qcm(`${c.intro}. Le tableau ci-contre donne les effectifs, mais une valeur a été effacée et remplacée par ${m('x')}. `
        + `Sachant que la moyenne de cette série est égale à ${m(decL(moy))}, la valeur de ${m('x')} est :`,
        opt(String(x), 'v' + x), cands, {
          figure: tableauEffectifs(c, connues.map(String).concat(['x']), effs),
          explication: `La somme de toutes les valeurs vaut ${m(decL(moy) + ' \\times ' + N + ' = ' + decL(somme))}. `
            + `Les colonnes connues en apportent ${m(connues.map((v, i) => v + ' \\times ' + effs[i]).join(' + ') + ' = ' + reste)}, `
            + `il reste donc ${m(somme + ' - ' + reste + ' = ' + part)} pour la colonne effacée. `
            + `Celle-ci compte ${m(String(effs[j]))} valeurs toutes égales à ${m('x')}, d’où ${m(O.mono(effs[j], 'x') + ' = ' + part)} et ${m('x = ' + x)}. `
            + `Répondre ${m(String(part))} reviendrait à s’arrêter avant la dernière division : ${m(String(part))} est le total de la colonne, pas la valeur cherchée.`
        });
      if (q) return q;
    }
    return null;
  }

  function moyenneEffectifManquant() {
    for (let essai = 0; essai < 120; essai++) {
      const c = aleaParmi(CTX_SERIE);
      const k = 4;
      const vals = valeursCroissantes(c, k, 2);
      if (!vals) continue;
      const effs = [alea(1, 6), alea(1, 6), alea(1, 6), alea(1, 6)];
      const j = alea(0, k - 1);                       // l'effectif effacé ; les effectifs
      const x = effs[j];                              // n'étant pas ordonnés, sa place ne le trahit pas
      const N = effs.reduce((s, e) => s + e, 0);
      const somme = vals.reduce((s, v, i) => s + v * effs[i], 0);
      if (somme % N !== 0) continue;                  // moyenne entière : l'équation reste faisable de tête
      const moy = somme / N;
      if (vals[j] === moy) continue;                  // sinon x s'élimine de l'équation
      const N0 = N - x, S0 = somme - vals[j] * x;     // colonnes connues
      if (N < 10 || N0 < 4) continue;                 // une série de 7 valeurs fait maigre

      // erreurs classiques
      const oubliDenominateur = arrondir((moy * N0 - S0) / vals[j], 6);   // ne pas mettre x au dénominateur
      const sansDivision = arrondir(moy * N0 - S0, 6);                    // ne pas diviser du tout
      const optV = v => (isFinite(v) && v > 0 && v <= 60 && Math.abs(v - Math.round(v)) < 1e-9
        ? opt(String(Math.round(v)), 'v' + Math.round(v)) : null);
      const cands = nettoyer([optV(moy), optV(oubliDenominateur), optV(sansDivision), optV(N0), optV(vals[j])]);
      const coefX = vals[j] - moy;

      const q = qcm(`${c.intro}. Le tableau ci-contre donne les effectifs, mais l’un d’eux a été effacé et remplacé par ${m('x')}. `
        + `Sachant que la moyenne de cette série est égale à ${m(String(moy))}, la valeur de ${m('x')} est :`,
        opt(String(x), 'v' + x), cands, {
          figure: tableauEffectifs(c, vals, effs.map((e, i) => (i === j ? 'x' : String(e)))),
          explication: `L’inconnue figure au numérateur <b>et</b> au dénominateur, puisque l’effectif total dépend d’elle : `
            + `${m('\\dfrac{' + S0 + ' + ' + O.mono(vals[j], 'x') + '}{' + N0 + ' + x} = ' + moy)}. `
            + `On multiplie en croix : ${m(S0 + ' + ' + O.mono(vals[j], 'x') + ' = ' + moy + '(' + N0 + ' + x)')}, `
            + `soit ${m(S0 + ' + ' + O.mono(vals[j], 'x') + ' = ' + (moy * N0) + ' + ' + O.mono(moy, 'x'))}. `
            + `En regroupant : ${m(O.mono(coefX, 'x') + ' = ' + (moy * N0 - S0))}, donc ${m('x = ' + x)}. `
            + `Traiter le dénominateur comme s’il valait ${m(String(N0))} donnerait ${m(decL(oubliDenominateur))} : c’est l’erreur à éviter.`
        });
      if (q) return q;
    }
    return null;
  }

  // ---------- niveau 2 : lire médiane, étendue ou effectif dans un tableau ----------
  function lectureSerie() {
    const c = aleaParmi(CTX_SERIE);
    const k = aleaParmi([4, 5]);
    const vals = valeursCroissantes(c, k, 1);
    if (!vals) return null;
    const effs = [];
    for (let i = 0; i < k; i++) effs.push(alea(2, 9));
    const N = effs.reduce((s, e) => s + e, 0);
    const med = medianeSerie(vals, effs);
    const moy = moyenneSerie(vals, effs);
    const etendue = vals[k - 1] - vals[0];
    if (med === moy) return null;
    const bonne = opt(decL(med), 'v' + med);
    const cands = nettoyer([
      opt(decL(moy), 'v' + moy),
      opt(decL(vals[Math.floor((k - 1) / 2)]), 'v' + vals[Math.floor((k - 1) / 2)]),  // valeur du milieu du tableau
      opt(String(etendue), 'v' + etendue),
      opt(decL(arrondir(N / 2, 6)), 'v' + arrondir(N / 2, 6)),                        // confondre rang et valeur
      opt(String(Math.max.apply(null, effs)), 'v' + Math.max.apply(null, effs))
    ]);
    const rangMed = N % 2 ? String((N + 1) / 2) + '^\\text{e}' : String(N / 2) + '^\\text{e}' + ' \\text{ et } ' + String(N / 2 + 1) + '^\\text{e}';
    return qcm(`${c.intro}. Le tableau ci-contre donne les effectifs. La médiane de cette série est égale à :`,
      bonne, cands, {
        figure: tableauEffectifs(c, vals, effs),
        explication: `La série compte ${m(String(N))} valeurs. La médiane est ${N % 2 ? 'la' : 'la demi-somme des'} ${m(rangMed)} valeur${N % 2 ? '' : 's'} `
          + `de la série ordonnée : en cumulant les effectifs (${effs.map((e, i) => { let s = 0; for (let j = 0; j <= i; j++) s += effs[j]; return s; }).join(' ; ')}), on trouve ${m(decL(med))}. `
          + `La médiane est une valeur de la série, pas un rang ni un effectif.`
      });
  }

  // ---------- niveau 3 : comparer médiane et moyenne (série dissymétrique) ----------
  function medianeContreMoyenne() {
    const c = aleaParmi(CTX_DISSYM);
    // beaucoup de petites valeurs, quelques-unes très élevées
    const vals = c.paliers.map(p => alea(p[0], p[1]));
    for (let i = 1; i < vals.length; i++) if (vals[i] <= vals[i - 1]) return null;
    // Effectif total fixé à 10 : la moyenne tombe sur une décimale exacte, donc
    // calculable de tête. Exiger en plus une moyenne entière rejetait dix-neuf
    // tirages sur vingt et rendait la question presque introuvable.
    const d = 1, k3 = alea(1, 2), k2 = alea(2, 3);
    const effs = [10 - k2 - k3 - d, k2, k3, d];
    if (effs[0] < 4) return null;                     // la série doit rester dissymétrique
    const N = 10;
    const med = medianeSerie(vals, effs);
    const somme = vals.reduce((s, v, i) => s + v * effs[i], 0);
    const moy = arrondir(somme / N, 6);
    if (moy === med) return null;
    const paire = (a, b) => ({ affichage: m('\\text{Me} = ' + decL(a) + ' \\quad \\text{et} \\quad \\overline{x} = ' + decL(b)), cle: a + '|' + b });
    const bonne = paire(med, moy);
    const naive = arrondir(vals.reduce((s, v) => s + v, 0) / 4, 6);
    const cands = [
      paire(moy, med),                                 // intervertir les deux
      paire(med, naive),                               // moyenne sans les effectifs
      paire(vals[1], moy),
      paire(med, arrondir(moy + 1, 6))
    ];
    return qcm(`${c.intro}. Le tableau ci-contre donne les effectifs. La médiane ${m('\\text{Me}')} et la moyenne ${m('\\overline{x}')} de cette série valent respectivement :`,
      bonne, cands, {
        optionsLarges: true,
        figure: tableauEffectifs(c, vals, effs),
        explication: `La série compte ${m(String(N))} valeurs, un nombre pair : la médiane est la demi-somme des `
          + `${m(String(N / 2) + '^\\text{e}')} et ${m(String(N / 2 + 1) + '^\\text{e}')} valeurs de la série ordonnée, soit ${m(decL(med))}. `
          + `La moyenne, elle, tient compte de toutes les valeurs : `
          + `${m('\\overline{x} = \\dfrac{' + somme + '}{' + N + '} = ' + decL(moy))}. `
          + `${med < moy ? 'Les quelques valeurs très élevées tirent la moyenne vers le haut sans déplacer la médiane : c’est pourquoi ' + m('\\text{Me} < \\overline{x}') + '.'
            : 'Ici ' + m('\\text{Me} > \\overline{x}') + ' : les valeurs basses, peu nombreuses mais éloignées, abaissent la moyenne.'}`
      });
  }

  // =====================================================================
  // Famille I : diagramme en boîte
  // =====================================================================
  const CTX_BOITE = [
    { intro: 'Le diagramme en boîte ci-contre résume les notes sur 20 obtenues par les élèves d’un lycée à un devoir commun.', unite: 'note', genre: 'f', pop: 'élèves', xmin: 0, xmax: 20, pas: 2 },
    { intro: 'Le diagramme en boîte ci-contre résume les temps de trajet, en minutes, des salariés d’une entreprise.', unite: 'temps de trajet', genre: 'm', pop: 'salariés', xmin: 0, xmax: 60, pas: 10 },
    { intro: 'Le diagramme en boîte ci-contre résume les températures maximales, en degrés, relevées un mois durant.', unite: 'température', genre: 'f', pop: 'journées', xmin: 0, xmax: 30, pas: 5 },
    { intro: 'Le diagramme en boîte ci-contre résume les durées, en minutes, des films projetés dans un festival.', unite: 'durée', genre: 'f', pop: 'films', xmin: 60, xmax: 180, pas: 20 },
    { intro: 'Le diagramme en boîte ci-contre résume le nombre de livres empruntés en un an par les abonnés d’une médiathèque.', unite: 'nombre de livres', genre: 'm', pop: 'abonnés', xmin: 0, xmax: 40, pas: 5 }
  ];
  // accords : le genre est déclaré, jamais deviné d'après l'initiale du mot
  const unUne = c => (c.genre === 'f' ? 'une' : 'un');
  const superieur = c => (c.genre === 'f' ? 'supérieure ou égale' : 'supérieur ou égal');
  const inferieur = c => (c.genre === 'f' ? 'inférieure' : 'inférieur');
  const aucun = c => (c.genre === 'f' ? 'Aucune' : 'Aucun');

  // cinq valeurs strictement croissantes, toutes sur une graduation
  function cinqValeurs(c) {
    for (let i = 0; i < 60; i++) {
      const n = Math.round((c.xmax - c.xmin) / c.pas);
      const idx = melanger(Array.from({ length: n + 1 }, (_, k) => k)).slice(0, 5).sort((x, y) => x - y);
      if (idx[0] === idx[1] || idx[1] === idx[2] || idx[2] === idx[3] || idx[3] === idx[4]) continue;
      const v = idx.map(k => c.xmin + k * c.pas);
      if (v[4] - v[0] < 3 * c.pas) continue;
      return { min: v[0], q1: v[1], med: v[2], q3: v[3], max: v[4] };
    }
    return null;
  }

  function figureBoite(c, v) {
    const largeur = (c.xmax - c.xmin) / c.pas;
    return O.graph.diagrammeBoite({
      min: v.min, q1: v.q1, med: v.med, q3: v.q3, max: v.max,
      xmin: c.xmin, xmax: c.xmax, pas: c.pas,
      unite: Math.max(6, Math.min(20, Math.round(300 / (c.xmax - c.xmin) * (largeur > 8 ? 1 : 1.2))))
    });
  }

  // niveau 2 : lire une caractéristique
  function boiteLecture() {
    const c = aleaParmi(CTX_BOITE);
    const v = cinqValeurs(c);
    if (!v) return null;
    const quoi = aleaParmi(['mediane', 'interquartile', 'etendue']);
    const ei = v.q3 - v.q1, et = v.max - v.min;
    const valeurs = { mediane: v.med, interquartile: ei, etendue: et };
    // la question porte l'accord du sujet : « l'écart interquartile est égal », pas « égale »
    const libelles = { mediane: 'la médiane est égale à', interquartile: 'l’écart interquartile est égal à', etendue: 'l’étendue est égale à' };
    const bonne = opt(String(valeurs[quoi]), 'v' + valeurs[quoi]);
    const cands = [
      opt(String(v.med), 'v' + v.med),
      opt(String(ei), 'v' + ei),
      opt(String(et), 'v' + et),
      opt(String(v.q1), 'v' + v.q1),
      opt(String(v.q3), 'v' + v.q3),
      opt(String(v.max), 'v' + v.max)
    ].filter(o => o.cle !== bonne.cle);
    const detail = {
      mediane: `Le trait qui partage la boîte marque la médiane : ${m(String(v.med))}.`,
      interquartile: `L’écart interquartile est la largeur de la boîte : ${m('Q_3 - Q_1 = ' + v.q3 + ' - ' + v.q1 + ' = ' + ei)}. Il ne fait pas intervenir les extrémités des moustaches.`,
      etendue: `L’étendue va d’une extrémité de moustache à l’autre : ${m(String(v.max) + ' - ' + String(v.min) + ' = ' + et)}. Elle mesure tout l’étalement de la série, moustaches comprises, et non la seule largeur de la boîte.`
    };
    return qcm(`${c.intro} Pour cette série, ${libelles[quoi]} :`, bonne, cands, {
      figure: figureBoite(c, v),
      explication: `Le diagramme donne, de gauche à droite : minimum ${m(String(v.min))}, premier quartile ${m('Q_1 = ' + v.q1)}, `
        + `médiane ${m(String(v.med))}, troisième quartile ${m('Q_3 = ' + v.q3)} et maximum ${m(String(v.max))}. ${detail[quoi]}`
    });
  }

  // niveau 3 : affirmations sur les quartiles (sujet zéro, Q12)
  function boiteAffirmation() {
    const c = aleaParmi(CTX_BOITE);
    const v = cinqValeurs(c);
    if (!v) return null;
    const u = c.unite;
    const ont = s => `ont ${unUne(c)} ${u} ${superieur(c)} à ${dec(s)}`;
    const vraies = [
      { t: `Au moins 75 % des ${c.pop} ${ont(v.q1)}.`,
        p: `${m('Q_1 = ' + v.q1)} sépare le premier quart des valeurs des trois autres : au plus 25 % des valeurs lui sont inférieures, donc au moins 75 % lui sont supérieures ou égales.` },
      { t: `Au moins 25 % des ${c.pop} ${ont(v.q3)}.`,
        p: `${m('Q_3 = ' + v.q3)} laisse au moins 75 % des valeurs en dessous, donc au moins 25 % au-dessus ou égales.` },
      { t: `Au moins la moitié des ${c.pop} ${ont(v.med)}.`,
        p: `C’est la définition de la médiane ${m(String(v.med))} : elle partage la série ordonnée en deux moitiés.` }
    ];
    const fausses = [
      { t: `Au moins la moitié des ${c.pop} dépassent ${dec(v.q3)}.`, p: `${m('Q_3 = ' + v.q3)} n’est dépassé que par un quart des valeurs au plus, pas par la moitié.` },
      { t: `${aucun(c)} ${u} n’est ${inferieur(c)} à ${dec(v.q1)}.`, p: `La moustache de gauche descend jusqu’à ${m(String(v.min))} : des valeurs inférieures à ${m(String(v.q1))} existent bien.` },
      { t: `La moyenne de la série est égale à ${dec(v.med)}.`, p: `Un diagramme en boîte ne donne aucune information sur la moyenne : seules les cinq valeurs résumées y figurent.` },
      { t: `L’étendue de la série est égale à ${dec(v.q3 - v.q1)}.`, p: `${m(String(v.q3) + ' - ' + String(v.q1))} est l’écart interquartile ; l’étendue vaut ${m(String(v.max) + ' - ' + String(v.min) + ' = ' + String(v.max - v.min))}.` },
      { t: `Les trois quarts des ${c.pop} se situent entre ${dec(v.q1)} et ${dec(v.q3)}.`, p: `Entre ${m('Q_1')} et ${m('Q_3')} se trouve la moitié des valeurs, pas les trois quarts.` }
    ];
    const bonneAff = aleaParmi(vraies);
    const mauvaises = melanger(fausses).slice(0, 3);
    if (mauvaises.length < 3) return null;
    const bonne = optTxt(bonneAff.t);
    const cands = mauvaises.map(f => optTxt(f.t));
    return qcm(`${c.intro} Parmi les affirmations suivantes, laquelle est vraie ?`, bonne, cands, {
      optionsLarges: true,
      figure: figureBoite(c, v),
      explication: `Le diagramme donne minimum ${m(String(v.min))}, ${m('Q_1 = ' + v.q1)}, médiane ${m(String(v.med))}, `
        + `${m('Q_3 = ' + v.q3)} et maximum ${m(String(v.max))}. ${bonneAff.p} `
        + mauvaises.map(f => f.p).join(' ')
    });
  }

  // =====================================================================
  Automatismes.enregistrerBanque('probabilites', {
    titre: 'Probabilités et statistiques',
    familles: {
      'denombrement': famille({
        nom: 'probabilité par dénombrement', niveaux: [1, 2, 3], base: denombrement,
        ordre: { 1: 1, 2: 3 }
      }),
      'tableau-proba': famille({
        nom: 'probabilité dans un tableau croisé', niveaux: [1, 2, 3], base: tableauProba,
        ordre: { 1: 2, 2: 2 }, quota: { 2: { min: 1, priorite: 3 }, 3: { max: 2 } }
      }),
      'arbre-intersection': famille({
        nom: 'intersection sur un arbre pondéré', niveaux: [1, 2, 3], base: arbreIntersection,
        variantes3: [arbreIntersectionTrois], partBase3: 0.5,
        ordre: { 1: 4, 2: 1 }, quota: { 2: { min: 1, priorite: 3 }, 3: { max: 2 } }
      }),
      'arbre-totale': famille({
        nom: 'probabilités totales', niveaux: [2, 3], base: arbreTotale,
        variantes3: [arbreTotaleTrois], partBase3: 0.5,
        ordre: { 2: 7 }, quota: { 2: { max: 1 }, 3: { max: 1 } }
      }),
      'arbre-manquante': famille({
        nom: 'retrouver une branche manquante', niveaux: [3], base: () => null, variantes3: [arbreBrancheManquante]
      }),
      'tableau-incomplet': famille({
        nom: 'tableau croisé à compléter', niveaux: [2, 3], base: tableauIncomplet,
        ordre: { 2: 9 }, quota: { 2: { max: 1 }, 3: { max: 1 } }
      }),
      'reunion': famille({
        nom: 'réunion de deux événements', niveaux: [2, 3], base: reunion,
        ordre: { 2: 8 }, quota: { 2: { max: 1 }, 3: { max: 1 } }
      }),
      'mediane': famille({
        nom: 'médiane d’une série', niveaux: [1, 2, 3], base: n => (n === 1 ? medianeListe() : lectureSerie()),
        variantes3: [medianeContreMoyenne], partBase3: 0.35,
        ordre: { 1: 3, 2: 4 }, quota: { 1: { max: 2 }, 2: { max: 2 } }
      }),
      'moyenne': famille({
        nom: 'moyenne pondérée', niveaux: [2, 3], base: moyennePonderee,
        ordre: { 2: 5 }, quota: { 2: { max: 1 }, 3: { max: 1 } }
      }),
      // problème inverse : la moyenne est donnée, c'est une case du tableau qu'il
      // faut retrouver — une valeur au niveau 2, un effectif au niveau 3
      'moyenne-inconnue': famille({
        nom: 'retrouver une case connaissant la moyenne', niveaux: [2, 3],
        base: moyenneValeurManquante, variantes3: [moyenneEffectifManquant], partBase3: 0.25,
        ordre: { 2: 6 }, quota: { 2: { max: 1 }, 3: { max: 1 } }
      }),
      'boite': famille({
        nom: 'diagramme en boîte', niveaux: [2, 3], base: boiteLecture,
        variantes3: [boiteAffirmation], partBase3: 0.3,
        ordre: { 2: 10 }, quota: { 2: { max: 1 }, 3: { max: 1 } }
      })
    }
  });
})();
