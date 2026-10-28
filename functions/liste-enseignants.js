'use strict';

// Liste des collegues invites (28/10/2026), separee de index.js pour etre testee sur les emulateurs sans deployer.
// `auth` est un objet Auth et `db` un Firestore de firebase-admin (pouvoirs du serveur : ils ignorent les regles
// Firestore, qui interdisent a l'administrateur de lire les eleves des collegues). La fonction ne renvoie que des
// TOTAUX -- jamais un nom, un prenom ni un pseudo d'eleve.

function enIso(texte) {
  const instant = Date.parse(texte);
  return Number.isFinite(instant) ? new Date(instant).toISOString() : null;
}

// Un compte cree par le serveur peut porter une « derniere connexion » egale a sa creation (ou ne pas en avoir) :
// tant que les deux sont a moins de 5 secondes l'un de l'autre, personne ne s'est connecte (le mot de passe de depart
// est aleatoire et inconnu, une connexion dans la seconde de la creation est impossible).
const ECART_CREATION_MS = 5000;

async function listerEnseignants(auth, db) {
  const comptes = [];
  let page = await auth.listUsers(1000);
  for (;;) {
    for (const utilisateur of page.users) {
      const droits = utilisateur.customClaims || {};
      if (droits.enseignant === true && droits.admin !== true) comptes.push(utilisateur);
    }
    if (!page.pageToken) break;
    page = await auth.listUsers(1000, page.pageToken);
  }

  const enseignants = await Promise.all(comptes.map(async (utilisateur) => {
    // Une lecture facturee par eleve de cet enseignant (champ « classe » seulement) ; la liste n'est demandee que
    // quand l'administrateur ouvre la page Inviter.
    const eleves = await db.collection('eleves').where('enseignant', '==', utilisateur.uid).select('classe').get();
    const classes = new Set();
    eleves.forEach((profil) => {
      const classe = profil.get('classe');
      if (typeof classe === 'string' && classe.trim()) classes.add(classe.trim());
    });
    const creeLe = enIso(utilisateur.metadata.creationTime);
    let derniereConnexion = enIso(utilisateur.metadata.lastSignInTime);
    if (derniereConnexion && creeLe && Math.abs(Date.parse(derniereConnexion) - Date.parse(creeLe)) < ECART_CREATION_MS) derniereConnexion = null;
    return { adresse: utilisateur.email || '', creeLe, derniereConnexion, eleves: eleves.size, classes: classes.size };
  }));

  enseignants.sort((a, b) => String(b.creeLe).localeCompare(String(a.creeLe)));
  return { enseignants };
}

module.exports = { listerEnseignants };
