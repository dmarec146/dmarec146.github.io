# Répartition par thème des affirmations et QCM des sujets de bac 2024 à 2026

**18/10/2026.** Sert à choisir l'ordre des thèmes à traiter dans le bloc « QCM Bac ». Ordre de grandeur, pas un décompte
exact (méthode et limites en bas).

## Résultat

195 affirmations ou questions de QCM, dans 43 exercices (12 en 2024, 19 en 2025, 11 en 2026 ; le QCM de Polynésie J2 2024
compte pour 5 questions).

| Thème | Nombre | Part | 2024 | 2025 | 2026 | Exercices | Banque |
|---|---:|---:|---:|---:|---:|---:|---|
| Géométrie dans l'espace | 70 | 36 % | 16 | 44 | 10 | 20 | **pilote fait** |
| Suites | 42 | 22 % | 24 | 8 | 10 | 17 | **pilote fait** |
| Équations différentielles et primitives | 18 | 9 % | 3 | 6 | 9 | 14 | à faire |
| Probabilités | 13 | 7 % | 0 | 7 | 6 | 6 | à faire |
| Dénombrement | 12 | 6 % | 2 | 5 | 5 | 8 | à faire |
| Exponentielle et logarithme | 11 | 6 % | 6 | 3 | 2 | 8 | à faire |
| Dérivation et convexité | 7 | 4 % | 0 | 5 | 2 | 6 | à faire |
| Limites et continuité | 5 | 3 % | 4 | 1 | 0 | 4 | à faire |
| Trigonométrie | 5 | 3 % | 0 | 2 | 3 | 4 | à faire |
| QCM mixte (Polynésie J2 2024) | 5 | 3 % | 5 | 0 | 0 | 1 | à ventiler |
| Calcul intégral | 4 | 2 % | 1 | 2 | 1 | 4 | à faire |
| Algorithmique (Python) | 3 | 2 % | 1 | 0 | 2 | 2 | à faire |

Les deux thèmes du pilote portent **58 %** des affirmations et des QCM. Les QCM proprement dits (quatre questions à choix) sont
presque tous de géométrie dans l'espace (Amérique du Nord J1 2024, Centres étrangers J1 2025, Amérique du Sud J2 2025).

## Ordre conseillé pour la suite

1. Équations différentielles et primitives (9 %), souvent associées aux fonctions exponentielles.
2. Probabilités et dénombrement ensemble (13 %) : ils apparaissent dans les mêmes exercices.
3. Exponentielle et logarithme, avec dérivation et convexité, limites et continuité (environ 15 % à eux trois : ce sont les
   mêmes fonctions étudiées sous plusieurs angles).
4. Trigonométrie, calcul intégral, algorithmique : peu fréquents, à traiter en dernier ou à intégrer aux thèmes voisins
   (primitives avec cos et sin, intégrales avec exponentielle, seuils en Python avec les suites).

## Méthode et limites

- Sources : `outils/qcm-bac/index-exercices.md` (sujets 2024, 2025, 2026 de l'APMEP en LaTeX). Les sujets de 2025 sont
  plus nombreux (19) que ceux de 2026 (14), et ceux de 2024 sont 17 : la comparaison entre années est biaisée.
- Chaque affirmation est rattachée à un thème par **mots-clés** (son énoncé compte triple, le contexte qui la précède
  compte simple). Une affirmation qui mêle deux thèmes (une fonction exponentielle et sa dérivée) n'est comptée que dans
  l'un des deux.
- Les exercices de type QCM ont été classés à la main, question par question.
- Une trentaine d'affirmations non classées par les mots-clés (géométrie surtout) ont été reprises en deuxième passe ; une douzaine ont été placées à la main d'après leur énoncé.
- Les exercices rédigés dont seules une ou deux questions sont des affirmations ne sont pas comptés.


## Mise à jour du 18/10/2026 : avec les sujets de 2022 et 2023

2022 et 2023 ajoutent 149 questions (130 questions de QCM et 19 affirmations), soit **344 questions** sur 2022 à 2026.
Leur profil diffère : ce sont des QCM qui balaient tout le programme, avec beaucoup d'exponentielle et de logarithme (primitives,
dérivées, limites, équations) et de probabilités.

| Thème | 2022-2023 | 2024-2026 | Total | Part |
|---|---:|---:|---:|---:|
| Géométrie dans l'espace | 16 | 70 | 86 | 25 % |
| Suites | 28 | 42 | 70 | 20 % |
| Exponentielle et logarithme | 43 | 11 | 54 | 16 % |
| Probabilités | 27 | 13 | 40 | 12 % |
| Dérivation et convexité | 19 | 7 | 26 | 8 % |
| Équations différentielles et primitives | 3 | 18 | 21 | 6 % |
| Dénombrement | 1 | 12 | 13 | 4 % |
| Algorithmique (Python) | 8 | 3 | 11 | 3 % |
| Limites et continuité | 4 | 5 | 9 | 3 % |
| Trigonométrie | 0 | 5 | 5 | 1 % |
| Calcul intégral | 0 | 4 | 4 | 1 % |
| QCM mixte (Polynésie J2 2024) | 0 | 5 | 5 | 1 % |

Remarques :
- Le classement est par mots-clés : les questions de **primitives** et de **dérivées** de fonctions faisant intervenir `e^x` ou
  `ln` (très nombreuses en 2022 et 2023, environ une dizaine) sont comptées dans « exponentielle et logarithme ». En les
  regroupant, « fonctions : exponentielle, logarithme, primitives, dérivation, convexité, limites » pèse environ **35 %**.
- Ordre conseillé révisé : (1) **exponentielle, logarithme, dérivation et primitives** (un seul gros thème « fonctions »,
  réparti en plusieurs banques : calcul de dérivées et de primitives, équations et inéquations avec `ln` et `e`, limites,
  convexité sur courbe, équations différentielles) ; (2) **probabilités** (arbres, loi binomiale, espérance) avec le
  dénombrement ; (3) algorithmique en complément des suites ; (4) trigonométrie et intégrale à la fin.
