#!/usr/bin/env node
'use strict';

// Outil hors-site : transforme le fichier produit par outils/creer-comptes
// (Nom, Prenom, Identifiant, MotDePasse) en etiquettes PDF pretes a
// imprimer et decouper. Voir README.md.

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const ADRESSE_SITE = 'dmarec146.github.io';
const COLONNES = 2;
const LIGNES = 5;
const MARGE = 28; // points (72pt = 1 pouce)

// Le CSV peut etre separe par ';' (Excel FR) ou ',', et ses champs peuvent
// etre entre guillemets (avec "" pour un guillemet litteral) : c'est
// exactement le format ecrit par outils/creer-comptes/creer-comptes.js.
function detecterSeparateur(ligne) {
  // Ignore les ';' ou ',' a l'interieur de guillemets pour la detection.
  let dansGuillemets = false;
  for (const c of ligne) {
    if (c === '"') dansGuillemets = !dansGuillemets;
    else if (!dansGuillemets && c === ';') return ';';
  }
  return ',';
}

function analyserLigneCsv(ligne, sep) {
  const champs = [];
  let champ = '';
  let dansGuillemets = false;
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (dansGuillemets) {
      if (c === '"') {
        if (ligne[i + 1] === '"') { champ += '"'; i++; }
        else { dansGuillemets = false; }
      } else {
        champ += c;
      }
    } else if (c === '"') {
      dansGuillemets = true;
    } else if (c === sep) {
      champs.push(champ);
      champ = '';
    } else {
      champ += c;
    }
  }
  champs.push(champ);
  return champs.map(c => c.trim());
}

function lireCsvComptes(cheminCsv) {
  const lignes = fs.readFileSync(cheminCsv, 'utf8').split(/\r?\n/).filter(l => l.trim() !== '');
  if (lignes.length === 0) throw new Error('CSV vide.');
  const sep = detecterSeparateur(lignes[0]);
  const entete = analyserLigneCsv(lignes[0], sep).map(c => c.toLowerCase());
  const iNom = entete.indexOf('nom');
  const iPrenom = entete.indexOf('prenom');
  const iIdentifiant = entete.indexOf('identifiant');
  const iMotDePasse = entete.indexOf('motdepasse');
  if (iNom === -1 || iPrenom === -1 || iIdentifiant === -1 || iMotDePasse === -1) {
    throw new Error(
      "Le CSV doit avoir les colonnes Nom, Prenom, Identifiant, MotDePasse " +
      "(celui produit par outils/creer-comptes/creer-comptes.js)."
    );
  }
  return lignes.slice(1).map((ligne, index) => {
    const champs = analyserLigneCsv(ligne, sep);
    const eleve = {
      nom: champs[iNom],
      prenom: champs[iPrenom],
      identifiant: champs[iIdentifiant],
      motDePasse: champs[iMotDePasse],
    };
    if (!eleve.nom || !eleve.prenom || !eleve.identifiant || !eleve.motDePasse) {
      throw new Error(`Ligne ${index + 2} du CSV incomplete : "${ligne}"`);
    }
    return eleve;
  });
}

function genererPdf(eleves, cheminSortie, classe) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGE });
    const flux = fs.createWriteStream(cheminSortie);
    doc.pipe(flux);
    flux.on('finish', resolve);
    flux.on('error', reject);

    const largeurUtile = doc.page.width - 2 * MARGE;
    const hauteurUtile = doc.page.height - 2 * MARGE;
    const largeurCellule = largeurUtile / COLONNES;
    const hauteurCellule = hauteurUtile / LIGNES;
    const parPage = COLONNES * LIGNES;
    const pad = 14;

    eleves.forEach((eleve, index) => {
      const dansPage = index % parPage;
      if (index > 0 && dansPage === 0) doc.addPage();

      const col = dansPage % COLONNES;
      const ligne = Math.floor(dansPage / COLONNES);
      const x = MARGE + col * largeurCellule;
      const y = MARGE + ligne * hauteurCellule;

      // Repere de decoupe (pointille) autour de chaque etiquette.
      doc.rect(x, y, largeurCellule, hauteurCellule)
        .dash(2, { space: 2 })
        .strokeColor('#aaaaaa')
        .lineWidth(0.5)
        .stroke();
      doc.undash();

      const contenuX = x + pad;
      const contenuW = largeurCellule - 2 * pad;
      let curY = y + pad;

      const entete = classe ? `${eleve.nom} ${eleve.prenom} — ${classe}` : `${eleve.nom} ${eleve.prenom}`;
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(13)
        .text(entete, contenuX, curY, { width: contenuW });
      curY += 20;

      doc.font('Helvetica').fontSize(9).fillColor('#555555')
        .text(ADRESSE_SITE, contenuX, curY, { width: contenuW });
      curY += 18;

      doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000')
        .text('Identifiant : ', contenuX, curY, { continued: true })
        .font('Helvetica').text(eleve.identifiant);
      curY += 16;

      doc.font('Helvetica-Bold').fontSize(11)
        .text('Mot de passe : ', contenuX, curY, { continued: true })
        .font('Helvetica').text(eleve.motDePasse);
    });

    doc.end();
  });
}

async function main() {
  const [, , cheminCsv, classe] = process.argv;
  if (!cheminCsv) {
    console.error('Usage : node generer-etiquettes.js <comptes-crees-XXX.csv> [classe]');
    process.exit(1);
  }
  if (!fs.existsSync(cheminCsv)) {
    console.error(`Fichier introuvable : ${cheminCsv}`);
    process.exit(1);
  }

  const eleves = lireCsvComptes(cheminCsv);
  const horodatage = new Date().toISOString().replace(/[:.]/g, '-');
  const cheminSortie = path.join(__dirname, `etiquettes-${horodatage}.pdf`);
  await genererPdf(eleves, cheminSortie, classe);

  const parPage = COLONNES * LIGNES;
  const nbPages = Math.ceil(eleves.length / parPage);
  console.log(`${eleves.length} etiquette(s) sur ${nbPages} page(s) A4 -> ${cheminSortie}`);
  console.log('Contient les mots de passe en clair : a supprimer une fois imprime.');
}

main().catch((erreur) => {
  console.error(erreur);
  process.exit(1);
});
