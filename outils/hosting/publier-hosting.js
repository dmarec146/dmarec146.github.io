#!/usr/bin/env node
'use strict';

// Publie le site sur Firebase Hosting (cahiers-interactifs.fr) a partir du DERNIER COMMIT
// de master, jamais a partir du dossier de travail. Aucune dependance (Node seul).
// Appele par "Publier le site.bat" apres le git push ; peut aussi se lancer a la main :
//
//   node outils/hosting/publier-hosting.js              publication en direct
//   node outils/hosting/publier-hosting.js --construire construit et controle publication/, ne publie rien
//   node outils/hosting/publier-hosting.js --canal=essai publie sur un canal de test (adresse temporaire, 7 jours)
//   node outils/hosting/publier-hosting.js --parite     compare aussi TOUS les fichiers avec GitHub Pages
//
// Pourquoi une liste blanche : Hosting publie le contenu d'un dossier, pas les fichiers suivis par Git.
// Une liste d'exclusion avait laisse partir le dossier .git (26/10/2026). Ici seuls les fichiers du
// commit situes dans les dossiers ci-dessous sont copies dans publication/, puis controles.
// Voir SUIVI-FIREBASE.md (§6, migration vers Hosting) pour le contexte et la regle de publication.

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---- Reglages ---------------------------------------------------------------------------------
const PROJET = 'cahiers-interactifs';
const VERSION_FIREBASE_TOOLS = '15.34.1';
const LISTE_BLANCHE = ['index.html', 'LICENSE', 'robots.txt', 'sitemap.xml', 'assets', 'automatismes', 'cahiers', 'connexion', 'mes-devoirs', 'qcm-bac', 'tableau-de-bord'];
const ADRESSES_EN_LIGNE = ['https://cahiers-interactifs.fr'];
const ADRESSE_GITHUB_PAGES = 'https://dmarec146.github.io';
// Tant que cette valeur est false, le site envoie "noindex, nofollow" : les moteurs de recherche ne
// l'indexent pas. A passer a true le jour de l'annonce aux eleves (etape 2.2 de la feuille de route).
const INDEXATION_AUTORISEE = false;

const RACINE = path.resolve(__dirname, '..', '..');
const DOSSIER = path.join(RACINE, 'publication');
const EXTENSIONS_INTERDITES = ['.md', '.csv', '.rules', '.bat', '.pem', '.key', '.p12', '.env', '.log'];

function fail(message) {
  console.error('\nERREUR : ' + message);
  process.exit(1);
}

function git(args, binaire) {
  const r = spawnSync('git', args, { cwd: RACINE, encoding: binaire ? null : 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (r.error) fail('git est introuvable ou a echoue : ' + r.error.message);
  return r;
}

const options = process.argv.slice(2);
const construireSeulement = options.includes('--construire');
const parite = options.includes('--parite');
const canalOption = options.find((o) => o.startsWith('--canal='));
const canal = canalOption ? canalOption.slice('--canal='.length) : null;

// ---- 1. Etat du depot ----------------------------------------------------------------------------
const branche = git(['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim();
if (branche !== 'master') fail(`la branche courante est "${branche}", pas master : rien n'est publie.`);

const fetch1 = git(['fetch']);
if (fetch1.status !== 0) console.warn('Avertissement : git fetch a echoue (reseau ?). Controle des commits non pousses ignore.');
else {
  const nonPousses = parseInt(git(['rev-list', '--count', 'origin/master..HEAD']).stdout.trim(), 10);
  if (nonPousses > 0 && !canal && !construireSeulement) {
    fail(`${nonPousses} commit(s) ne sont pas encore pousses sur GitHub. Fais d'abord git push : les deux adresses doivent publier le meme contenu.`);
  }
}
const modifies = git(['status', '--porcelain', '--', ...LISTE_BLANCHE]).stdout.trim();
if (modifies) {
  console.warn('Avertissement : fichiers du site modifies mais pas commites. Ils ne sont PAS publies (seul le dernier commit l\'est) :\n' + modifies);
}
const commit = git(['rev-parse', '--short', 'HEAD']).stdout.trim();
console.log(`Commit publie : ${commit}`);

// ---- 2. Construction de publication/ depuis le commit ---------------------------------------------
const liste = git(['ls-tree', '-r', '-z', '--name-only', 'HEAD', '--', ...LISTE_BLANCHE]).stdout.split('\0').filter(Boolean);
if (liste.length < 100 || liste.length > 400) fail(`${liste.length} fichiers dans le commit pour la liste blanche : attendu entre 100 et 400. Rien n'est publie.`);

fs.rmSync(DOSSIER, { recursive: true, force: true });
const empreintes = new Map();
for (const f of liste) {
  const contenu = git(['cat-file', 'blob', 'HEAD:' + f], true);
  if (contenu.status !== 0) fail('lecture impossible dans le commit : ' + f);
  const cible = path.join(DOSSIER, f);
  fs.mkdirSync(path.dirname(cible), { recursive: true });
  fs.writeFileSync(cible, contenu.stdout);
  empreintes.set(f, crypto.createHash('sha256').update(contenu.stdout).digest('hex'));
}

// ---- 3. Controle de securite -----------------------------------------------------------------------
const suspects = liste.filter((f) => {
  const morceaux = f.split('/');
  const nom = morceaux[morceaux.length - 1].toLowerCase();
  return morceaux.some((m) => m.startsWith('.') || m.toLowerCase() === 'node_modules')
    || EXTENSIONS_INTERDITES.some((e) => nom.endsWith(e))
    || /service-account|comptes-crees|secret|password|motdepasse/.test(f.toLowerCase());
});
if (suspects.length) fail('fichiers qui ne doivent pas etre publies, trouves dans la liste blanche :\n  ' + suspects.join('\n  '));
console.log(`publication/ construit : ${liste.length} fichiers, aucun fichier suspect.`);

// ---- 4. Configuration Hosting (regeneree a chaque fois, identique sur les deux PC) --------------------
const entetes = [{ key: 'Cache-Control', value: 'public, max-age=600' }];
if (!INDEXATION_AUTORISEE) entetes.push({ key: 'X-Robots-Tag', value: 'noindex, nofollow' });
const firebaseJson = {
  hosting: {
    public: 'publication',
    cleanUrls: false,
    trailingSlash: true,
    ignore: ['**/.*', '**/.*/**', '**/node_modules/**'],
    headers: [{ source: '**', headers: entetes }]
  }
};
fs.writeFileSync(path.join(RACINE, 'firebase.json'), JSON.stringify(firebaseJson, null, 2) + '\n');
fs.writeFileSync(path.join(RACINE, '.firebaserc'), JSON.stringify({ projects: { default: PROJET } }, null, 2) + '\n');

if (construireSeulement) {
  console.log('Option --construire : rien n\'est publie.');
  process.exit(0);
}

// ---- 5. Publication ----------------------------------------------------------------------------------
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const base = `${npx} --yes firebase-tools@${VERSION_FIREBASE_TOOLS}`;
const commande = canal
  ? `${base} hosting:channel:deploy ${canal} --expires 7d --project ${PROJET}`
  : `${base} deploy --only hosting --project ${PROJET}`;
console.log(`\nPublication ${canal ? `sur le canal de test "${canal}"` : 'en direct'} ...`);
const deploiement = spawnSync(commande, { cwd: RACINE, shell: true, stdio: 'inherit' });
if (deploiement.status !== 0) {
  fail('la publication a echoue. Si Firebase demande de se connecter : npx firebase-tools@' + VERSION_FIREBASE_TOOLS + ' login');
}
if (canal) { console.log('\nCanal de test publie (voir l\'adresse temporaire ci-dessus).'); process.exit(0); }

// ---- 6. Verification apres publication -----------------------------------------------------------------
async function sha(url) {
  const r = await fetch(url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now(), { headers: { 'Cache-Control': 'no-cache' } });
  if (r.status !== 200) return 'HTTP ' + r.status;
  return crypto.createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex');
}
async function code(url) {
  try { return (await fetch(url, { redirect: 'manual' })).status; } catch (e) { return 'erreur'; }
}

(async () => {
  let ok = true;
  const fichiers = [...empreintes.keys()];
  const echantillon = ['index.html', ...fichiers.filter((_, i) => i % Math.ceil(fichiers.length / 7) === 0)];
  const uniques = [...new Set(echantillon)];
  console.log('\nVerification apres publication (attente de 5 s) ...');
  await new Promise((r) => setTimeout(r, 5000));
  for (const adresse of ADRESSES_EN_LIGNE) {
    let diff = 0;
    for (const f of uniques) {
      const vu = await sha(`${adresse}/${f}`);
      if (vu !== empreintes.get(f)) { diff++; console.warn(`  DIFFERENT sur ${adresse} : ${f} (${vu})`); }
    }
    for (const interdit of ['.git/config', 'outils/', 'SUIVI-FIREBASE.md', 'outils/creer-comptes/service-account.json']) {
      const c = await code(`${adresse}/${interdit}`);
      if (c !== 404) { ok = false; console.error(`  ALERTE : ${adresse}/${interdit} repond ${c} (attendu 404)`); }
    }
    console.log(`  ${adresse} : ${uniques.length - diff}/${uniques.length} fichiers temoins identiques au commit.`);
    if (diff) ok = false;
  }
  // Parite avec GitHub Pages (peut retarder d'1 a 2 minutes apres un push)
  const aComparer = parite ? fichiers : uniques;
  let ecarts = 0;
  for (const f of aComparer) {
    const gh = await sha(`${ADRESSE_GITHUB_PAGES}/${f}`);
    if (gh !== empreintes.get(f)) ecarts++;
  }
  if (ecarts) console.warn(`  GitHub Pages differe sur ${ecarts}/${aComparer.length} fichiers : normal dans les 1-2 minutes qui suivent un push, sinon a verifier.`);
  else console.log(`  GitHub Pages : ${aComparer.length}/${aComparer.length} fichiers identiques (les deux adresses servent le meme site).`);
  console.log(ok ? '\nPublication terminee et verifiee.' : '\nPublication faite, MAIS des controles ont echoue : voir ci-dessus.');
  process.exit(ok ? 0 : 2);
})();
