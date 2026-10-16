/* Barème du sujet blanc d'automatismes (Première).
   Validé par David le 16/10/2026 : chaque question vaut 0,5, 0,75 ou 1 point selon sa famille et le niveau.
   Clé : « banque/famille » ; valeur : [points au niveau 1, au niveau 2, au niveau 3], null si la famille n'existe pas à ce niveau.
   Le total d'un sujet de 12 questions dépend du tirage (de 6 à 12 points) et n'est jamais ramené sur 6.
   Une famille ajoutée à une banque doit recevoir sa ligne ici : sans elle, le moteur compte 0,5 point et le signale dans la console
   (outils/automatismes-controle : Controle.verifierBareme()). */
window.BAREME_SUJET_BLANC = {
  // Pourcentages et évolutions
  'pourcentages/pourcentage-valeur': [0.5, 0.5, 0.75],   // pourcentage d’une valeur
  'pourcentages/taux-vers-coef': [null, 0.5, 0.75],   // du taux au coefficient
  'pourcentages/coef-vers-taux': [null, 0.5, 0.75],   // du coefficient au taux
  'pourcentages/appliquer-taux': [0.5, 0.5, 0.75],   // appliquer une évolution
  'pourcentages/taux-evolution': [0.5, 0.75, 1],   // calculer un taux d’évolution
  'pourcentages/valeur-initiale': [0.75, 0.75, 1],   // retrouver la valeur initiale
  'pourcentages/evolutions-successives': [0.75, 0.75, 1],   // évolutions successives
  'pourcentages/formule-evolution': [0.5, 0.75, 0.75],   // choisir le calcul d’une évolution
  'pourcentages/reciproque': [null, 1, 1],   // coefficient réciproque
  'pourcentages/evolution-manquante': [null, 1, 1],   // évolution manquante
  'pourcentages/aire-volume': [null, 1, 1],   // aires et volumes
  // Proportions et ordres de grandeur
  'proportions/conversions': [0.5, 0.75, 1],   // conversions d’unités
  'proportions/ordre-grandeur': [0.5, 0.75, 0.75],   // ordre de grandeur
  'proportions/proportionnalite': [0.5, 0.75, 1],   // proportionnalité (dont débits et vitesses)
  'proportions/retrouver-total': [0.75, 0.75, 1],   // retrouver le total
  'proportions/comparer-parts': [null, null, 1],   // comparer des parts
  'proportions/partage-ratio': [0.5, 0.75, 0.75],   // partage dans un rapport
  'proportions/melange-pourcentage': [0.5, 0.75, 0.75],   // pourcentage dans un mélange
  // Calcul numérique
  'calcul-numerique/priorites': [0.5, 0.5, 0.75],   // priorités opératoires
  'calcul-numerique/fractions': [0.5, 0.5, 0.75],   // fractions
  'calcul-numerique/puissances': [0.5, 0.75, 1],   // puissances
  'calcul-numerique/racines': [null, 0.5, 0.75],   // racines carrées
  'calcul-numerique/valeur-expression': [0.5, 0.5, 0.75],   // valeur d’une expression littérale
  'calcul-numerique/comparaison': [0.5, 0.5, 0.75],   // comparer des nombres
  'calcul-numerique/egalite-puissances': [0.75, 0.75, 1],   // égalités de puissances
  'calcul-numerique/racines-operations': [null, 0.75, 1],   // opérations sur les racines carrées
  // Développer et factoriser
  'developper-factoriser/developper-identite': [0.5, 0.5, 0.75],   // développer une identité remarquable
  'developper-factoriser/developper-produit': [0.5, 0.5, 0.75],   // développer et réduire
  'developper-factoriser/developper-simple': [0.5, 0.5, null],   // développer k(ax+b)
  'developper-factoriser/factoriser-commun': [0.5, 0.5, 0.75],   // factoriser (facteur commun)
  'developper-factoriser/factoriser-identite': [null, 0.5, 0.75],   // factoriser (identité remarquable)
  'developper-factoriser/reduire-oppose': [0.5, 0.5, 0.75],   // réduire avec l’opposé d’une parenthèse
  'developper-factoriser/expression-egale': [0.75, 0.75, 1],   // laquelle n’est pas égale à…
  'developper-factoriser/factoriser-fraction': [null, 0.75, 1],   // factoriser avec des fractions
  // Équations et inéquations
  'equations/equation-1er-degre': [0.5, 0.5, 0.75],   // équation du premier degré
  'equations/produit-nul': [0.5, 0.5, 0.75],   // équation produit nul
  'equations/inequation': [0.5, 0.5, 0.75],   // inéquation
  'equations/carre-egal': [null, 0.5, 0.75],   // équation du type x² = a
  'equations/isoler-variable': [0.5, 0.5, 1],   // isoler une variable dans une formule
  'equations/signe-produit': [null, 0.75, 1],   // signe d’un produit
  'equations/formule-valeurs': [0.5, 1, 1],   // relation et valeurs données
  'equations/tableau-vers-expression': [1, 1, 1],   // du tableau de signes à l’expression
  // Droites et repères
  'droites/equation-lue': [0.5, 0.5, 0.75],   // lire l’équation d’une droite
  'droites/lecture-coefficient': [0.5, 0.5, 0.75],   // lire le coefficient directeur
  'droites/appartenance': [null, 0.5, 0.75],   // point appartenant à une droite
  'droites/coefficient-deux-points': [0.5, 0.5, 0.75],   // coefficient directeur par deux points
  'droites/droite-deux-points': [0.75, 0.75, 1],   // droite passant par deux points
  'droites/reconnaitre-graphique': [0.5, 0.5, 0.75],   // reconnaître le graphique
  'droites/affirmation-droites': [0.75, 1, 1],   // affirmation vraie sur des droites tracées
  'droites/positions-relatives': [null, null, 1],   // positions relatives
  'droites/triangle-rectangle': [null, null, 1],   // nature d’un triangle
  // Lectures graphiques
  'lectures-graphiques/lecture-image': [0.5, 0.5, 0.75],   // lire une image, un antécédent
  'lectures-graphiques/nombre-solutions': [0.5, 0.5, 0.75],   // nombre de solutions de f(x) = k
  'lectures-graphiques/point-sur-courbe': [0.5, 0.5, 0.75],   // point appartenant à une courbe
  'lectures-graphiques/inequation-graphique': [0.5, 0.5, 1],   // inéquation résolue graphiquement
  'lectures-graphiques/variations-extremum': [0.5, 0.5, 1],   // variations et extremum
  'lectures-graphiques/signe-quotient-images': [0.5, 0.75, 1],   // signe d’un produit ou d’un quotient d’images
  'lectures-graphiques/comparer-courbes': [null, 0.75, 1],   // comparer deux courbes
  'lectures-graphiques/reconnaitre-courbe': [null, 1, 1],   // reconnaître la courbe d’une fonction
  'lectures-graphiques/signe-produit-x': [null, null, 1],   // signe de x × f(x)
  'lectures-graphiques/intersection': [null, null, 1],   // intersection d’une parabole et d’une droite
  // Probabilités et statistiques
  'probabilites/denombrement': [0.5, 0.5, 0.75],   // probabilité par dénombrement
  'probabilites/tableau-proba': [0.5, 0.5, 0.75],   // probabilité dans un tableau croisé
  'probabilites/arbre-intersection': [0.5, 0.5, 0.75],   // intersection sur un arbre pondéré
  'probabilites/mediane': [0.5, 0.5, 0.75],   // médiane d’une série
  'probabilites/evenement-contraire': [0.5, 0.75, 1],   // événement contraire et « au moins un »
  'probabilites/moyenne-simple': [0.5, 0.75, 0.75],   // moyenne d’une liste de valeurs
  'probabilites/arbre-totale': [null, 1, 1],   // probabilités totales
  'probabilites/tableau-incomplet': [null, 0.75, 1],   // tableau croisé à compléter
  'probabilites/reunion': [null, 0.75, 1],   // réunion de deux événements
  'probabilites/moyenne': [null, 0.75, 0.75],   // moyenne pondérée
  'probabilites/moyenne-inconnue': [null, 1, 1],   // retrouver une case connaissant la moyenne
  'probabilites/boite': [null, 0.75, 0.75],   // diagramme en boîte
  'probabilites/arbre-manquante': [null, null, 1]   // retrouver une branche manquante
};
