#!/usr/bin/env node
'use strict';

// Outil hors-site : une etiquette PNG PAR ELEVE (nom, prenom, classe, adresse du
// site, identifiant, mot de passe), a envoyer par message. Meme contenu que les
// etiquettes PDF a decouper (generer-etiquettes.js), lit le meme fichier CSV et
// NE MODIFIE JAMAIS les comptes : il ne fait que relire les identifiants et
// mots de passe deja produits par outils/creer-comptes. Voir README.md.
//
// Usage : node generer-etiquettes-individuelles.js <comptes-crees-XXX.csv> <classe>
// Ecrit individuelles/<classe>/<NOM Prenom>.png (dossier ignore par Git).

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');
const { lireCsvComptes } = require('./generer-etiquettes.js');

const ADRESSE_SITE = 'dmarec146.github.io';
const LARGEUR = 900;
const HAUTEUR = 420;
const ECHELLE = 3.3; // pas de la mise en page PDF (points) vers des pixels

// Polices de Windows ; Consolas distingue l / 1 / I et O / 0, utile pour un mot
// de passe recopie a la main.
const POLICE_TEXTE = 'Arial, Helvetica, sans-serif';
const POLICE_CODE = 'Consolas, "Courier New", monospace';

function dessinerEngrenage(ctx, cx, cy, rayon, couleur) {
  const nbDents = 8;
  const largeurDent = rayon * 0.6;
  const hauteurDent = rayon * 0.45;
  ctx.save();
  ctx.fillStyle = couleur;
  ctx.beginPath(); ctx.arc(cx, cy, rayon, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < nbDents; i++) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((Math.PI * 2 / nbDents) * i);
    ctx.fillRect(-largeurDent / 2, -(rayon + hauteurDent * 0.7), largeurDent, hauteurDent);
    ctx.restore();
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(cx, cy, rayon * 0.42, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// Reduit la taille de la police jusqu'a ce que le texte tienne dans la largeur.
function ajusterPolice(ctx, texte, gras, famille, taille, largeurMax) {
  let t = taille;
  do {
    ctx.font = `${gras ? 'bold ' : ''}${t}px ${famille}`;
    if (ctx.measureText(texte).width <= largeurMax || t <= 12) break;
    t -= 1;
  } while (true);
  return t;
}

function dessinerEtiquette(eleve, classe) {
  const canvas = createCanvas(LARGEUR, HAUTEUR);
  const ctx = canvas.getContext('2d');
  const pad = 14 * ECHELLE;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, LARGEUR, HAUTEUR);
  ctx.strokeStyle = '#bbbbbb';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, LARGEUR - 3, HAUTEUR - 3);

  const rayonIcone = 9 * ECHELLE;
  dessinerEngrenage(ctx, LARGEUR - pad - rayonIcone, pad + rayonIcone, rayonIcone, '#c9c9c9');
  const largeurEntete = LARGEUR - 2 * pad - (rayonIcone * 2 + 8 * ECHELLE);

  ctx.textBaseline = 'top';
  let y = pad;

  const entete = classe ? `${eleve.nom} ${eleve.prenom} — ${classe}` : `${eleve.nom} ${eleve.prenom}`;
  const tailleEntete = ajusterPolice(ctx, entete, true, POLICE_TEXTE, 13 * ECHELLE, largeurEntete);
  ctx.fillStyle = '#000000';
  ctx.fillText(entete, pad, y);
  y += tailleEntete * 1.35 + 6 * ECHELLE;

  ctx.font = `${9 * ECHELLE}px ${POLICE_TEXTE}`;
  ctx.fillStyle = '#555555';
  ctx.fillText(ADRESSE_SITE, pad, y);
  y += 24 * ECHELLE;

  const ligne = (etiquette, valeur) => {
    const taille = 11 * ECHELLE;
    ctx.font = `bold ${taille}px ${POLICE_TEXTE}`;
    ctx.fillStyle = '#000000';
    ctx.fillText(etiquette, pad, y);
    const decalage = ctx.measureText(etiquette).width;
    ajusterPolice(ctx, valeur, false, POLICE_CODE, taille * 1.05, LARGEUR - 2 * pad - decalage);
    ctx.fillText(valeur, pad + decalage, y);
    y += taille * 2.3;
  };
  ligne('Identifiant : ', eleve.identifiant);
  ligne('Mot de passe : ', eleve.motDePasse);

  return canvas.toBuffer('image/png');
}

// Nom de fichier lisible et sans caractere interdit sous Windows ; jamais de mot de passe dedans.
function nomFichier(eleve, dejaPris) {
  const base = `${eleve.nom} ${eleve.prenom}`.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
  let nom = base; let n = 2;
  while (dejaPris.has(nom.toLowerCase())) nom = `${base} (${n++})`;
  dejaPris.add(nom.toLowerCase());
  return nom + '.png';
}

function main() {
  const [, , cheminCsv, classe] = process.argv;
  if (!cheminCsv || !classe) {
    console.error('Usage : node generer-etiquettes-individuelles.js <comptes-crees-XXX.csv> <classe>');
    process.exit(1);
  }
  if (!fs.existsSync(cheminCsv)) { console.error(`Fichier introuvable : ${cheminCsv}`); process.exit(1); }

  const eleves = lireCsvComptes(cheminCsv);
  const dossier = path.join(__dirname, 'individuelles', classe.trim().replace(/[\\/:*?"<>|]/g, ''));
  fs.mkdirSync(dossier, { recursive: true });
  const pris = new Set();
  for (const eleve of eleves) fs.writeFileSync(path.join(dossier, nomFichier(eleve, pris)), dessinerEtiquette(eleve, classe));
  console.log(`${eleves.length} etiquette(s) PNG -> ${dossier}`);
  console.log('Contient les mots de passe en clair : a supprimer une fois envoye.');
}

main();
