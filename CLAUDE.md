# Cahiers interactifs

Avant toute action sur ce projet, lire **`SUIVI-FIREBASE.md`** à la racine
du dépôt — état des lieux, procédure de reprise sur une autre machine,
pièges déjà rencontrés. Ce fichier est à jour et se met à jour lui-même ;
ne pas partir de suppositions sans l'avoir lu.

## À l'ouverture de toute session

Après avoir lu `SUIVI-FIREBASE.md`, vérifier l'état réel du dépôt (`git
status`, `git log origin/master..HEAD --oneline`, `git branch -a`), puis
écrire un court message à l'utilisateur confirmant explicitement :
`SUIVI-FIREBASE.md` lu, dépôt à jour avec `origin/master` (ou le nombre de
commits d'écart si ce n'est pas le cas), rien d'inhabituel (fichiers non
suivis, branches inattendues, conflits). **Ce message doit refléter l'état
réel constaté**, pas une formule automatique — si quelque chose ne va pas,
le dire clairement plutôt que de rassurer à tort.
