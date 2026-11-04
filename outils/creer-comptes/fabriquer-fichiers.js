'use strict';

// Fabrique les fichiers a remettre a un enseignant (04/11/2026, extrait de comptes-et-etiquettes.js pour etre partage avec
// reinitialiser-etiquettes.js) : dans UN dossier <racine>\<email de l'enseignant>\<AAAA-MM-JJ_HHhMM>\, par classe, le fichier
// comptes-<classe>.csv (identifiants et mots de passe), le PDF d'etiquettes a decouper et une image PNG par eleve.
// CES FICHIERS CONTIENNENT DES MOTS DE PASSE EN CLAIR : les remettre, puis les supprimer.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const DOSSIER_ETIQUETTES = path.join(__dirname, '..', 'etiquettes');
const SITE_PAR_DEFAUT = 'cahiers-interactifs.fr';

const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
const nettoyer = (s) => String(s).trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-') || 'sans-classe';
const deuxChiffres = (n) => String(n).padStart(2, '0');

function etiquettesInstallees() {
  return fs.existsSync(path.join(DOSSIER_ETIQUETTES, 'node_modules'));
}

// resultats : [{ classe, pseudo, motDePasse, prenom, nom }] ; options : adresseEnseignant, racine, site, intitule (texte du LISEZ-MOI).
// Renvoie le dossier cree.
function fabriquerFichiers(resultats, { adresseEnseignant, racine, site, intitule }) {
  const dossierRacine = racine || path.join(os.homedir(), 'Documents', 'comptes-enseignants');
  const maintenant = new Date();
  const horodatage = `${maintenant.getFullYear()}-${deuxChiffres(maintenant.getMonth() + 1)}-${deuxChiffres(maintenant.getDate())}`
    + `_${deuxChiffres(maintenant.getHours())}h${deuxChiffres(maintenant.getMinutes())}`;
  const dossier = path.join(dossierRacine, adresseEnseignant, horodatage);
  fs.mkdirSync(dossier, { recursive: true });

  const parClasse = new Map();
  for (const r of resultats) {
    const cle = r.classe || '';
    if (!parClasse.has(cle)) parClasse.set(cle, []);
    parClasse.get(cle).push(r);
  }
  const env = { ...process.env, DOSSIER_SORTIE_ETIQUETTES: dossier, ADRESSE_SITE_ETIQUETTES: site || SITE_PAR_DEFAUT };
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
    `${intitule} le ${maintenant.toLocaleString('fr-FR')} pour l'enseignant ${adresseEnseignant}.\r\n\r\n` +
    `- comptes-<classe>.csv : identifiants et mots de passe (a ouvrir dans Excel)\r\n` +
    `- etiquettes-<classe>-<date>.pdf : a imprimer et decouper\r\n` +
    `- individuelles\\<classe>\\ : une image par eleve, a envoyer par message\r\n\r\n` +
    `ATTENTION : ces fichiers contiennent des mots de passe en clair et des noms d'eleves.\r\n` +
    `Les envoyer a l'enseignant, puis les supprimer, ainsi que la liste recue.\r\n`, 'utf8');
  return dossier;
}

module.exports = { fabriquerFichiers, etiquettesInstallees, DOSSIER_ETIQUETTES };
