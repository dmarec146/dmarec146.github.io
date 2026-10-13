# Audit de la validation des réponses

Contrôle automatique, **sans crédits** (un script Node qui pilote le Chrome déjà installé), de ce que
les fiches de calcul acceptent et refusent, **en prenant le corrigé comme référence**.

## Ce qu'il contrôle

| Motif | Gravité | Sens |
|---|---|---|
| `corrige-refuse` | avertissement | le corrigé affiché, retapé dans le champ mathématique, n'est pas accepté |
| `enonce-accepte` | erreur | l'énoncé recopié tel quel (à simplifier, développer…) est accepté |
| `nombre-calcule-accepte` | erreur | le nombre calculé est accepté pour une question « une seule puissance » |
| `corrige-decimale` | erreur | le corrigé contient une valeur décimale approchée (hors réponses « approchées ») |
| `corrige-fraction-reductible` | erreur | fraction non irréductible dans le corrigé |
| `corrige-plus-moins`, `corrige-terme-nul`, `corrige-exposant-1`, `corrige-invalide` | erreur | « +-3 », « +0x », « ^1 », « NaN / undefined » |
| `corrige-signe-au-numerateur`, `corrige-multiplication-apres-fraction` | style | −a/b écrit (−a)/b ; « 3/4 × x » |
| `erreur-de-page` | erreur | une erreur JavaScript à l'ouverture de la fiche |

**Il ne vérifie pas que le corrigé est mathématiquement juste** (recalcul indépendant à faire fiche par fiche),
ni toutes les mauvaises réponses possibles : seulement celles qu'il essaie (énoncé recopié, nombre calculé).

## Utilisation

```bash
cd outils/audit-reponses && npm install        # une seule fois par machine (playwright-core, ~2 Mo)
node outils/audit-reponses/audit.js            # fiches modifiées depuis la dernière publication
node outils/audit-reponses/audit.js --toutes   # les 50 fiches
node outils/audit-reponses/audit.js cahiers/seconde/cahier-1/fiche-02.html
```

- Sans argument : les fiches modifiées par rapport à `origin/master` (commits non poussés + fichiers modifiés ou nouveaux).
  Si du **code partagé** a changé (`assets/js/…`, `automatismes/assets/…`, ce script), toutes les fiches sont auditées.
- Chaque fiche est régénérée plusieurs fois : 10 tirages saisis (30 pour une fiche modifiée ou nommée) et 100 tirages de
  corrigé ; `--tirages-saisie N` et `--tirages-corrige N` pour changer.
- **Prérequis** : Node.js et **Google Chrome** installés (aucun navigateur à télécharger). Si Chrome est absent, le script le dit.
- Rapport complet : `rapport.txt` (ignoré par Git). Code de sortie 1 s'il y a des anomalies **nouvelles** de gravité « erreur ».

## `connues.json` : la liste de travail

Les anomalies déjà présentes quand l'outil a été créé (12/10/2026) sont enregistrées dans `connues.json`
(clé `fiche|calcul|motif`). Par défaut le script n'affiche et ne sanctionne que les **nouvelles** anomalies ;
`--tout-afficher` montre aussi les connues. **`connues.json` n'est pas une liste d'exceptions acceptées mais le travail restant** :
chaque correction retire des lignes (relancer avec `--enregistrer-connues` après avoir corrigé ne retire rien ;
supprimer à la main les lignes traitées, puis relancer pour vérifier qu'elles ne reviennent pas).

## Quand le relancer

- après toute modification d'une fiche (automatique par défaut) ;
- après toute modification du moteur de validation, des claviers ou d'un script partagé (toutes les fiches) ;
- de temps en temps en complet (changement de MathLive, de navigateur, gros chantier).
