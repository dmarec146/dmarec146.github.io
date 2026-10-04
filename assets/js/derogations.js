// Dérogations individuelles d'un devoir (04/10/2026, demande de David) : pour
// certains élèves d'une classe, une ÉCHÉANCE et/ou un NOMBRE D'ESSAIS différents
// de ceux du devoir, sans créer un second devoir (leurs tentatives restent dans
// les mêmes résultats). Stockées sur le devoir :
//
//   derogations: { <uid>: { echeance: Timestamp, nbEssaisMax: number } }
//
// Module partagé par le suivi élève (suivi.js), le classement de /mes-devoirs/
// (devoirs-eleve.js) et le tableau de bord enseignant (devoirs.js) : une seule
// définition de « l'échéance et les essais qui comptent pour CET élève ».

// Copie du devoir où échéance et nbEssaisMax sont ceux de l'élève s'il a une
// dérogation ; le devoir lui-même s'il n'en a pas (aucune copie, aucun risque).
export function appliquerDerogation(devoir, uid) {
  const d = devoir && devoir.derogations && uid ? devoir.derogations[uid] : null;
  if (!d) return devoir;
  return {
    ...devoir,
    echeance: d.echeance ?? devoir.echeance,
    nbEssaisMax: d.nbEssaisMax ?? devoir.nbEssaisMax,
    derogation: true,
  };
}

// Échéance la plus lointaine parmi celle du devoir et celles des dérogations
// (millisecondes) : un devoir dont la date de classe est passée mais dont un
// élève a encore du temps reste « en cours » pour l'enseignant.
export function echeanceMaxMillis(devoir) {
  const ms = (t) => (t && t.toMillis ? t.toMillis() : 0);
  let max = ms(devoir.echeance);
  for (const d of Object.values(devoir.derogations || {})) max = Math.max(max, ms(d && d.echeance));
  return max;
}

export function nbDerogations(devoir) {
  return Object.keys(devoir.derogations || {}).length;
}
