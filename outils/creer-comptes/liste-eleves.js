'use strict';

// Lecture d'une liste de classes envoyee par un enseignant (28/10/2026) : fichier CSV ou Excel (.xlsx, premiere feuille).
//
//   ligne 1  l'enseignant : « Enseignant ; Prenom Nom (facultatif) ; adresse@ac-xxx.fr »   (l'adresse est obligatoire
//            pour les nouveaux fichiers ; l'ordre des cases n'a pas d'importance : on cherche celle qui contient un @)
//   ligne 2  les colonnes : Classe ; Nom ; Prenom   (ou Classe ; Pseudo)
//   ligne 3+ un eleve par ligne
//
// Un ancien fichier sans la ligne « enseignant » est encore lu (la premiere ligne est alors celle des colonnes) : l'adresse
// doit alors etre donnee a la main (--enseignant=...). Renvoie { enseignant: { adresse, nom } | null, lignes } ou `lignes`
// est la liste des lignes (tableaux de textes) SANS la ligne de l'enseignant, premiere ligne = colonnes.

const fs = require('fs');

const MARQUES = /[̀-ͯ]/g;
const ADRESSE = /[^\s@;,:"'<>()]+@[^\s@;,:"'<>()]+\.[^\s@;,:"'<>()]+/;
const normaliser = (s) => String(s).toLowerCase().normalize('NFD').replace(MARQUES, '').trim();

function separateur(lignes) {
  // Sur la ligne des colonnes (celle qui contient « classe ») : la ligne de l'enseignant peut contenir une virgule dans un nom.
  const entete = lignes.find((l) => normaliser(l).includes('classe')) || lignes[0];
  return entete.includes(';') ? ';' : ',';
}

async function lireCases(chemin) {
  if (/\.xlsx$/i.test(chemin)) {
    const { readSheet } = await import('read-excel-file/node');
    const feuille = await readSheet(chemin);
    return feuille.map((ligne) => ligne.map((c) => (c === null || c === undefined ? '' : String(c).trim())));
  }
  if (/\.xls$/i.test(chemin)) {
    throw new Error('Ancien format Excel (.xls) non lu : enregistrer le fichier au format .xlsx ou CSV.');
  }
  // Excel enregistre un « CSV UTF-8 » avec un BOM en tete : sans ce retrait, la premiere colonne ne serait pas reconnue.
  const lignes = fs.readFileSync(chemin, 'utf8').replace(/^﻿/, '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lignes.length) return [];
  const sep = separateur(lignes);
  return lignes.map((l) => l.split(sep).map((c) => c.trim()));
}

// Ligne de l'enseignant : une case contient une adresse e-mail ET la ligne n'est pas celle des colonnes.
function extraireEnseignant(ligne) {
  if (!ligne || ligne.some((c) => normaliser(c) === 'classe')) return null;
  const adresseCase = ligne.find((c) => ADRESSE.test(c));
  if (!adresseCase) return null;
  const adresse = adresseCase.match(ADRESSE)[0].toLowerCase();
  const morceaux = ligne.map((c) => (c === adresseCase ? c.replace(ADRESSE, '') : c))
    .map((c) => c.replace(/^\s*enseignant(e)?\s*:?\s*$/i, '').replace(/^\s*enseignant(e)?\s*:\s*/i, '').trim())
    .filter(Boolean);
  return { adresse, nom: morceaux.join(' ') || null };
}

async function lireListe(chemin) {
  const cases = (await lireCases(chemin)).filter((ligne) => ligne.some((c) => c !== ''));
  const enseignant = extraireEnseignant(cases[0]);
  return { enseignant, lignes: enseignant ? cases.slice(1) : cases };
}

module.exports = { lireListe, extraireEnseignant };
