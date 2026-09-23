// Liste statique des 45 fiches de cahiers de calcul (Première + Seconde), regroupées par
// cahier — sert au sélecteur de fiche de l'outil d'attribution des devoirs
// (tableau-de-bord/devoirs.html). Extraite une fois des 15 sommaires de cahier
// (cahiers/<niveau>/cahier-N/index.html) ; à tenir à jour à la main si une fiche est
// ajoutée/renommée (rare, contrairement au contenu des fiches lui-même).

export const MANIFESTE_CAHIERS = [
  { niveau: 'premiere', cahier: 'cahier-1', titreCahier: 'Cahier 1 — Second degré et polynômes', fiches: [
    { href: 'fiche-01.html', numero: 1, nom: 'Forme canonique' },
    { href: 'fiche-02.html', numero: 2, nom: 'Discriminant et racines I' },
    { href: 'fiche-03.html', numero: 3, nom: 'Discriminant et racines II' },
    { href: 'fiche-04.html', numero: 4, nom: 'Polynômes I' },
    { href: 'fiche-05.html', numero: 5, nom: 'Polynômes II' },
  ]},
  { niveau: 'premiere', cahier: 'cahier-2', titreCahier: 'Cahier 2 — Dérivation', fiches: [
    { href: 'fiche-06.html', numero: 6, nom: 'Dérivation I' },
    { href: 'fiche-07.html', numero: 7, nom: 'Dérivation II' },
    { href: 'fiche-08.html', numero: 8, nom: 'Dérivation III' },
  ]},
  { niveau: 'premiere', cahier: 'cahier-3', titreCahier: 'Cahier 3 — Exponentielle', fiches: [
    { href: 'fiche-09.html', numero: 9, nom: "Généralités sur l'exponentielle I" },
    { href: 'fiche-10.html', numero: 10, nom: "Généralités sur l'exponentielle II" },
    { href: 'fiche-11.html', numero: 11, nom: 'Dérivation et exponentielle I' },
    { href: 'fiche-12.html', numero: 12, nom: 'Dérivation et exponentielle II' },
  ]},
  { niveau: 'premiere', cahier: 'cahier-4', titreCahier: 'Cahier 4 — Suites arithmétiques et géométriques', fiches: [
    { href: 'fiche-13.html', numero: 13, nom: 'Généralités sur les suites' },
    { href: 'fiche-14.html', numero: 14, nom: 'Suites arithmétiques' },
    { href: 'fiche-15.html', numero: 15, nom: 'Suites géométriques' },
  ]},
  { niveau: 'premiere', cahier: 'cahier-5', titreCahier: 'Cahier 5 — Sommes et produits', fiches: [
    { href: 'fiche-16.html', numero: 16, nom: 'Calcul de sommes I' },
    { href: 'fiche-17.html', numero: 17, nom: 'Calcul de sommes II' },
    { href: 'fiche-18.html', numero: 18, nom: 'Calcul de produits' },
  ]},
  { niveau: 'premiere', cahier: 'cahier-6', titreCahier: 'Cahier 6 — Probabilités', fiches: [
    { href: 'fiche-19.html', numero: 19, nom: 'Probabilités' },
  ]},
  { niveau: 'premiere', cahier: 'cahier-7', titreCahier: 'Cahier 7 — Géométrie plane et vecteurs', fiches: [
    { href: 'fiche-20.html', numero: 20, nom: 'Droites du plan' },
    { href: 'fiche-21.html', numero: 21, nom: 'Généralités sur les vecteurs' },
    { href: 'fiche-22.html', numero: 22, nom: 'Coordonnées des vecteurs' },
  ]},
  { niveau: 'premiere', cahier: 'cahier-8', titreCahier: 'Cahier 8 — Trigonométrie', fiches: [
    { href: 'fiche-23.html', numero: 23, nom: 'Fonctions trigonométriques I' },
    { href: 'fiche-24.html', numero: 24, nom: 'Fonctions trigonométriques II' },
  ]},
  { niveau: 'premiere', cahier: 'cahier-9', titreCahier: 'Cahier 9 — Produit scalaire', fiches: [
    { href: 'fiche-25.html', numero: 25, nom: 'Produit scalaire I' },
    { href: 'fiche-26.html', numero: 26, nom: 'Produit scalaire II' },
  ]},
  { niveau: 'premiere', cahier: 'cahier-10', titreCahier: 'Cahier 10 — Logique et théorie des ensembles', fiches: [
    { href: 'fiche-27.html', numero: 27, nom: 'Logique' },
    { href: 'fiche-28.html', numero: 28, nom: 'Théorie des ensembles' },
  ]},
  { niveau: 'seconde', cahier: 'cahier-1', titreCahier: 'Cahier 1 — Calcul numérique et littéral', fiches: [
    { href: 'fiche-01.html', numero: 1, nom: 'Fractions' },
    { href: 'fiche-02.html', numero: 2, nom: 'Puissances' },
    { href: 'fiche-03.html', numero: 3, nom: 'Racines carrées' },
    { href: 'fiche-04.html', numero: 4, nom: 'Développer, réduire, factoriser' },
    { href: 'fiche-05.html', numero: 5, nom: 'Identités remarquables' },
  ]},
  { niveau: 'seconde', cahier: 'cahier-2', titreCahier: 'Cahier 2 — Équations et inéquations', fiches: [
    { href: 'fiche-06.html', numero: 6, nom: 'Équations du premier degré' },
    { href: 'fiche-07.html', numero: 7, nom: 'Inéquations du premier degré' },
    { href: 'fiche-08.html', numero: 8, nom: 'Tableaux de signes' },
  ]},
  { niveau: 'seconde', cahier: 'cahier-3', titreCahier: 'Cahier 3 — Proportions et pourcentages', fiches: [
    { href: 'fiche-09.html', numero: 9, nom: 'Proportions et pourcentages' },
    { href: 'fiche-10.html', numero: 10, nom: 'Évolutions' },
  ]},
  { niveau: 'seconde', cahier: 'cahier-4', titreCahier: 'Cahier 4 — Nombres réels et arithmétique', fiches: [
    { href: 'fiche-11.html', numero: 11, nom: "Écritures d'un nombre" },
    { href: 'fiche-12.html', numero: 12, nom: 'Intervalles et ensembles de nombres' },
    { href: 'fiche-13.html', numero: 13, nom: 'Valeur absolue et encadrements' },
  ]},
  { niveau: 'seconde', cahier: 'cahier-5', titreCahier: 'Cahier 5 — Fonctions', fiches: [
    { href: 'fiche-14.html', numero: 14, nom: 'Images et antécédents' },
    { href: 'fiche-15.html', numero: 15, nom: 'Résolution graphique' },
    { href: 'fiche-16.html', numero: 16, nom: 'Fonctions affines' },
    { href: 'fiche-17.html', numero: 17, nom: 'Fonctions de référence' },
  ]},
];

function libelleNiveau(niveau) {
  return niveau === 'premiere' ? 'Première' : 'Seconde';
}

// Même format de ficheId que window.location.pathname sur une fiche réelle
// (voir FICHE_ID dans chaque fiche, et formaterFicheId dans tableau-de-bord.js) :
// "/cahiers/<niveau>/<cahier>/<href>".
export function ficheIdDepuis(niveau, cahier, href) {
  return `/cahiers/${niveau}/${cahier}/${href}`;
}

// Liste à plat des 45 fiches, prête pour un <select> : { ficheId, titre, niveau, cahier }.
export const FICHES_PLATES = MANIFESTE_CAHIERS.flatMap((c) =>
  c.fiches.map((f) => ({
    ficheId: ficheIdDepuis(c.niveau, c.cahier, f.href),
    titre: `${libelleNiveau(c.niveau)} · Cahier ${c.cahier.replace('cahier-', '')} · Fiche ${f.numero} — ${f.nom}`,
    niveau: c.niveau,
    cahier: c.cahier,
  }))
);
