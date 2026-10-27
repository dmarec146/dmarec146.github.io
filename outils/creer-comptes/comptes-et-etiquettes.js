#!/usr/bin/env node
'use strict';

// Tout-en-un pour les eleves d'un enseignant (27/10/2026) : cree les comptes, puis fabrique les etiquettes (PDF a decouper
// pour chaque classe, et une image PNG par eleve) et range le tout dans UN dossier portant l'adresse e-mail de l'enseignant.
//
//   node comptes-et-etiquettes.js <liste.csv> --enseignant=<email> [--racine=<dossier>] [--site=<adresse>]
//
// <liste.csv> : colonnes classe;prenom;nom (voir README.md). Seuls les eleves NOUVEAUX recoivent un compte et une etiquette :
// relancer sur la meme liste n'ajoute rien. Dossier produit :
//   <racine>\<email de l'enseignant>\<AAAA-MM-JJ_HHhMM>\
//       comptes-<classe>.csv            identifiants et mots de passe (tableur)
//       etiquettes-<classe>-<date>.pdf  etiquettes a imprimer et decouper
//       individuelles\<classe>\*.png    une etiquette par eleve, a envoyer par message
//       LISEZ-MOI.txt
// <racine> par defaut : Documents\comptes-enseignants (hors du depot et hors de Google Drive). L'adresse affichee sur les
// etiquettes est celle du site (cahiers-interactifs.fr par defaut). CES FICHIERS CONTIENNENT DES MOTS DE PASSE EN CLAIR ET
// DES NOMS D'ELEVES : les envoyer a l'enseignant, puis les supprimer (et supprimer aussi la liste recue).

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { initialiserAdmin, creerComptesEleves } = require('./creer-comptes.js');

const DOSSIER_ETIQUETTES = path.join(__dirname, '..', 'etiquettes');
const SITE_PAR_DEFAUT = 'cahiers-interactifs.fr';

const args = process.argv.slice(2);
const valeur = (nom) => { const a = args.find((x) => x.startsWith(nom + '=')); return a ? a.slice(nom.length + 1) : null; };
const cheminListe = args.find((a) => !a.startsWith('--'));
const email = valeur('--enseignant');

if (!cheminListe || !email) {
  console.error('Usage : node comptes-et-etiquettes.js <liste.csv> --enseignant=<email> [--racine=<dossier>] [--site=<adresse>]');
  process.exit(1);
}
if (!fs.existsSync(path.join(DOSSIER_ETIQUETTES, 'node_modules'))) {
  console.error(`Les etiquettes ne sont pas installees : lancer \`npm install\` dans ${DOSSIER_ETIQUETTES}`);
  process.exit(1);
}

const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
const nettoyer = (s) => String(s).trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-') || 'sans-classe';
const deuxChiffres = (n) => String(n).padStart(2, '0');

async function main() {
  initialiserAdmin();
  // 1. Comptes (sans le fichier habituel comptes-crees-*.csv : on produit les notres, rangees par classe).
  const resultats = await creerComptesEleves(cheminListe, email, { ecrireCsv: false });
  if (!resultats || resultats.length === 0) return;

  // 2. Dossier de cette fabrication.
  const racine = valeur('--racine') || path.join(os.homedir(), 'Documents', 'comptes-enseignants');
  const maintenant = new Date();
  const horodatage = `${maintenant.getFullYear()}-${deuxChiffres(maintenant.getMonth() + 1)}-${deuxChiffres(maintenant.getDate())}`
    + `_${deuxChiffres(maintenant.getHours())}h${deuxChiffres(maintenant.getMinutes())}`;
  const dossier = path.join(racine, email.trim().toLowerCase(), horodatage);
  fs.mkdirSync(dossier, { recursive: true });

  // 3. Par classe : CSV, PDF a decouper, PNG individuels.
  const parClasse = new Map();
  for (const r of resultats) {
    const cle = r.classe || '';
    if (!parClasse.has(cle)) parClasse.set(cle, []);
    parClasse.get(cle).push(r);
  }
  const env = { ...process.env, DOSSIER_SORTIE_ETIQUETTES: dossier, ADRESSE_SITE_ETIQUETTES: valeur('--site') || SITE_PAR_DEFAUT };
  for (const [classe, eleves] of parClasse) {
    const nomClasse = classe || 'sans-classe';
    const cheminCsv = path.join(dossier, `comptes-${nettoyer(nomClasse)}.csv`);
    const avecIdentite = eleves.every((e) => e.nom && e.prenom);
    const lignes = avecIdentite
      ? [[q('Nom'), q('Prenom'), q('Identifiant'), q('MotDePasse')].join(';')]
          .concat(eleves.map((e) => [q(e.nom), q(e.prenom), q(e.pseudo), q(e.motDePasse)].join(';')))
      : [[q('Classe'), q('Identifiant'), q('MotDePasse')].join(';')]
          .concat(eleves.map((e) => [q(e.classe), q(e.pseudo), q(e.motDePasse)].join(';')));
    fs.writeFileSync(cheminCsv, lignes.join('\n'), 'utf8');
    if (!avecIdentite) { console.log(`Classe ${nomClasse} : sans nom ni prenom, etiquettes non generees (seulement ${path.basename(cheminCsv)}).`); continue; }
    for (const script of ['generer-etiquettes.js', 'generer-etiquettes-individuelles.js']) {
      execFileSync(process.execPath, [path.join(DOSSIER_ETIQUETTES, script), cheminCsv, nomClasse], { env, stdio: 'inherit' });
    }
  }

  fs.writeFileSync(path.join(dossier, 'LISEZ-MOI.txt'),
    `Comptes eleves crees le ${maintenant.toLocaleString('fr-FR')} pour l'enseignant ${email}.\r\n\r\n` +
    `- comptes-<classe>.csv : identifiants et mots de passe (a ouvrir dans Excel)\r\n` +
    `- etiquettes-<classe>-<date>.pdf : a imprimer et decouper\r\n` +
    `- individuelles\\<classe>\\ : une image par eleve, a envoyer par message\r\n\r\n` +
    `ATTENTION : ces fichiers contiennent des mots de passe en clair et des noms d'eleves.\r\n` +
    `Les envoyer a l'enseignant, puis les supprimer, ainsi que la liste recue.\r\n`, 'utf8');

  console.log(`\n${resultats.length} compte(s) cree(s) pour ${email}.\nFichiers dans : ${dossier}`);
}

main().catch((erreur) => { console.error(erreur); process.exit(1); });
