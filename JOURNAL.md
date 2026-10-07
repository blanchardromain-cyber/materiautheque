# Journal des versions — Matériauthèque

Chaque itération suit la boucle : spécifier → construire → vérifier techniquement → vérifier pédagogiquement → mesurer → ajuster.

## I0 + I2 — 2026-10-07 (non publiée)

**Spécifier** : `docs/superpowers/specs/2026-10-07-materiautheque-design.md` (dépôt ClaudeConfig).

**Construire** : référentiel `data/` (18 matériaux, 10 procédés, scénario turbine P11) ; moteur `app/moteur.js` ; application 4e sans 3D.

**Décisions prises sur le document de cadrage**
- Verdicts calculés (indispensable = élimine, souhaitable = classe) ; `reponsesAttendues` sert d'oracle de test.
- PA 6 : note eau = 2 en 4e (éliminé) ; en 3e, critère scindé en « se dégrader dans l'eau » (indispensable) + « absorption ≤ 1 % » (souhaitable) → compromis.
- Aluminium éliminé à tous les niveaux par la masse (« discuté en 3e » retiré).
- Champ `magnetique` ajouté ; critère « rigide » ajouté (souhaitable en 4e, indispensable en 3e) pour écarter le silicone et les aubes molles.
- « Laiton 7 fois plus lourd que le POM » → 6 fois (8,5 / 1,39).
- Critère 3e « se dégrader dans l'eau » plutôt que « se corroder » : le bois pourrit, il ne se corrode pas.

**Vérifier techniquement — fait**
- `node outils/controle-donnees.mjs` : OK ; refuse une copie volontairement cassée (note hors bornes, procédé inconnu).
- `node --test tests/moteur.test.mjs` : 10/10 (3 niveaux, oracle, raisons, procédés).
- Navigateur (Chromium intégré) : parcours complet POM ; erreur laiton → animation « démarrage lent » + question → retour au tri ; 0 matériau restant → message d'aide ; clavier seul à l'étape 2 ; largeur 375 px sans défilement horizontal sur les 6 écrans ; thème sombre ; console sans erreur ; hors ligne (serveur arrêté → l'application se recharge depuis le cache).

**Vérifier techniquement — non fait**
- Firefox, tablette réelle, poste de la salle De Vinci (chargement < 3 s).
- Lighthouse (outil absent du poste).
- Rendu de l'impression PDF (vérifié seulement par la feuille de style).

**Vérifier pédagogiquement — à faire (portes humaines)**
- Relecture du référentiel par un 2e enseignant : `RELECTURE.md`.
- Test « penser à voix haute » avec 3 élèves de 4e : `PROTOCOLE-TEST-ELEVES.md`.

**Mesurer / Ajuster** : à remplir après les deux portes ci-dessus.

## I2.1 — 2026-10-07 (remédiations après relecture du professeur, non publiée)

**Retours du professeur**
1. Étape 1 : réponses dans l'ordre (les vraies en tête) → ordre tiré au sort une fois par élève, jamais plus de 2 vraies dans les 3 premières.
2. Étape 1 : « rotor » inconnu → contrainte reformulée (« elle fait tourner un aimant placé dans le générateur »), explication du mot rotor, générateur dessiné en coupe (aimant N/S qui tourne avec la turbine, bobines), encadré « Mots utiles ».
3. Étape 3 : un choix ne se retirait pas → « Je choisis » bascule (« ✓ Mon choix · retirer ») + bouton « Retirer » dans la barre.
4. Étape 4 : photos des machines du collège (Charlyrobot, Ultimaker 2+, perceuse à colonne, thermoplieuse ; Bambu Lab A1 et xTool en images fabricant, à remplacer avant publication) ; schémas de principe pour les procédés sans photo ; principe de chaque procédé en une phrase.
5. Étape 4 : impasse avec le PLA. **Cause** : le moteur validait un matériau sur ses seuls critères indispensables, sans vérifier qu'un procédé de série permet de le fabriquer ; même impasse pour le composite en 3e et pour tous les matériaux en 5e. **Corrections** : `verifierChoix` exige un procédé compatible pour l'usage du niveau (série en 4e/3e, labo en 5e), sinon animation « impossible à fabriquer » + retour au tri ; test « aucune impasse » sur les 3 niveaux ; PLA note eau 3 → 2 (vieillit dans l'eau, décision du professeur) ; l'étape 4 garde une sortie « Retourner au tri ».
6. Étape 4 : impossible de désélectionner → boutons à bascule « Pour la série » / « Pour le prototype ».

**Relecture complète du contenu (en plus)**
- Articles : « le ABS », « du ABS », « le Inox » → « l'ABS », « de l'ABS », « l'Inox ».
- Cartes 4e : sigle + nom courant (« POM / polyacétal », « Cu / cuivre ») ; libellés complets (« Masse volumique », « Résistance à l'eau ») ; légende des points ●○ ; toutes les raisons d'élimination affichées sur la bande.
- Texte de conséquence « eau » d'un plastique : « s'est abîmée : a gonflé ou s'est dégradée » (le PLA ne gonfle pas).
- Changer de matériau après validation referme les étapes 4 et 5 et efface les procédés choisis.
- Le titre « Matériauthèque » ramène à l'accueil (aucun retour possible auparavant).
- Étape 5 : le prototype mentionne son matériau réel (« en PLA »).

**Défaut trouvé pendant la vérification** : la fermeture du dialogue de conséquence rappelait `aller(3)` sur l'événement `close`, qui est asynchrone ; il pouvait renvoyer à l'étape 3 un élève déjà passé à l'étape 4. Rappel supprimé.

**Vérifié** : 13 tests du moteur, contrôle des données (photos comprises), parcours complet POM et erreur PLA dans le navigateur, bascules de l'étape 3 et 4, 375 px sur les 5 étapes, console sans erreur.

## I2.2 — 2026-10-07 (deuxième relecture du professeur, non publiée)

**Retours**
1. Étape 1 : le robinet se déclenche par la présence des mains (bouton « Approcher les mains du capteur »), ondes du capteur, arrêt immédiat quand on retire les mains.
2. Étape 3 : comparaison « figée » sur PLA, acier, laiton. **Cause** : au-delà de 3, les autres cases étaient grisées sans explication, et la sélection est gardée d'une séance à l'autre. **Correction** : la 4e case retire la plus ancienne ; bouton « Vider la comparaison ».
3. Étape 4 : plus de photos (choix du professeur, par cohérence) ; machines du collège dessinées (imprimante 3D Bambu Lab A1, découpeuse laser xTool, fraiseuse Charlyrobot, thermoplieuse), nom de la machine sous le dessin. Images supprimées du dépôt.
4. Étape 5 : méthode clarifiée, « 3 rendez-vous » (décision du professeur) — voir README, section « Méthode ». **Cause du bilan contradictoire** : un élève pouvait mettre « conduire l'électricité » en indispensable, voir tous les plastiques éliminés, choisir quand même le PE-HD (accepté car conforme à la référence) ; le bilan mélangeait ses critères et ceux de référence. **Corrections** : vérification des critères à l'étape 2 (`verifierClassement`) ; la validation exige le respect de tous les critères de l'élève (`verifierCoherence`) ; verdict explicite à l'étape 5 (`verdictFinal`) ; bilan « matériaux écartés par mes critères indispensables », sans le matériau choisi.

**Vérifié** : 16 tests, contrôle des données (questions obligatoires pour les critères vitaux et pièges), le cas de la capture rejoué (4 cartes à revoir, puis PE-HD → « choix acceptable », absent des écartés), animation laiton, comparaison au-delà de 3, mains, dessins des machines.

## I2.3 — 2026-10-07 (troisième relecture du professeur, non publiée)

**Étape 4**
- L'impression 3D, la découpe laser et le pliage à chaud existent aussi dans l'industrie : lieux corrigés. Le thermoformage passe en « industrie » seulement, faute de thermoformeuse au collège (à rétablir sinon).
- Deux questions posées en quantités : « fabriquer 10 000 turbines » (tous les procédés) et « fabriquer une turbine d'essai au collège » (les 4 machines du collège).
- Avis demandé (procédé présent au collège et dans l'industrie, pour la série) : ce n'est pas le lieu qui compte, c'est la cadence. Le retour le montre en heures : impression 3D ≈ 1 h par pièce, soit environ 14 mois pour 10 000 turbines ; injection ≈ 20 s, soit environ 2 jours. Temps par pièce en ordre de grandeur, marqués `aValider`.
- Le retour s'affiche dans la fiche choisie, et un bandeau fixe en bas résume les deux choix avec le bouton « Justifier mon choix ».
- Étiquettes : police du texte, en gras, couleurs pleines (« au collège » jaune, « dans l'industrie » bleu acier) et pictogramme du geste.

**Étape 5**
- La famille et la sous-famille ne sont plus écrites : l'élève les choisit (listes), avec un retour « Exact » ou « À revoir » et un indice tiré des objets du quotidien. Elles ont été retirées des cartes de l'étape 3, qui donnaient la réponse. Les sous-familles 4e des matériaux sont alignées sur celles des familles (contrôle ajouté).
- Identification (prénom, nom, classe) en fin de parcours, imprimée en tête de la fiche ; impression possible seulement quand la famille et l'identité sont renseignées. Données gardées dans le navigateur et effacées par « Recommencer ».

**Vérifié** : 16 tests, contrôle des données, parcours ABS (impression 3D refusée pour la série avec la durée) puis POM, famille fausse puis juste, impression activée après l'identité, 375 px sans débordement, console sans erreur.

## I4a — 2026-10-07 : niveau 5e « Je teste et je reconnais » (non publiée)

**Spécifier** : `docs/superpowers/specs/2026-10-07-materiautheque-5e-design.md` (dépôt ClaudeConfig), validée par le professeur.

**Construire**
- Données : bakélite (19e matériau, valeurs à valider), bois 150 °C, cuivre embouti ; `essais.json` (6 essais, lectures en mots) ; scénario `casserole` à deux pièces.
- Moteur : `scenarioPiece`, `lireEssai`, procédés d'usine permis en 5e quand le scénario le demande (`lieuProcedes`, `usageFabrication`).
- Interface : module `app/cinquieme.js` séparé du parcours 4e ; fonctions partagées dans `app/commun.js` ; choix du niveau à l'accueil, un enregistrement par niveau.

**Vérifier techniquement — fait** : 20 tests (oracle cuve/poignée, aucune impasse, lecture des essais dont « l'aluminium n'est pas attiré » et « le cuivre, lourd, n'est pas le plus rigide ») ; contrôle des données ; parcours 5e complet dans le navigateur (carte électricité à revoir, PP refusé avec animation, essais, éliminations seulement après essai, choix et validation par pièce, procédés d'usine, familles, impression) ; 4e inchangée ; 375 px sur les 5 étapes après correction d'un débordement du tableau ; console vide.

**Vérifier pédagogiquement — à faire** : relecture des essais et des seuils (180 °C pour la cuve, 120 °C pour la poignée) ; test avec 3 élèves de 5e (adapter `PROTOCOLE-TEST-ELEVES.md`).

## I4a.1 — 2026-10-07 : travail en binôme (non publiée)

- Étape « Je justifie » (4e et 5e) : case « Nous travaillons en binôme » qui ajoute prénom et nom de l'élève 2 ; nom en majuscules et prénom avec majuscule initiale (prénoms composés compris), à la frappe comme à l'impression ; impression possible seulement si l'identification est complète. Bloc partagé dans , testé ().

## I4a.2 — 2026-10-07 : fiche en PDF sans impression (non publiée)

- « Enregistrer ma fiche en PDF » (4e et 5e) remplace l'impression : le PDF est fabriqué dans la page (html2pdf.js 0.10.1, chargé depuis cdnjs au premier clic, puis gardé en cache hors ligne) et téléchargé directement, nommé `Materiautheque-4e-NOM-Prenom[_NOM2-Prenom2].pdf`.
- En-tête du PDF sur le modèle des fiches P11 (bandeau « TECHNOLOGIE · Cycle 4 · Classe de 4ᵉ | P11 — L'eau, ressource essentielle », titre de l'activité, élèves, classe, date) ; en-tête propre à chaque scénario (`entete` dans `composants.json`).
- Le PDF recopie l'écran « Je justifie » : saisies converties en texte, boutons retirés, dessins SVG convertis en images avec leurs couleurs (sinon vides puis noirs à la capture).
- Étape 5 (4e) : encadré « Masses volumiques » (matériau choisi et laiton) pour le mini-tableur énergie grise ; l'aide du tableur y renvoie.
- Vérifié : PDF 4e (≈ 480 Ko, 2 pages) et 5e (≈ 370 Ko, 2 pages) générés et relus page à page ; premier essai vide (page capturée hors écran) puis dessin noir, tous deux corrigés.
- Limite : le tout premier enregistrement sur un poste demande internet (chargement de la bibliothèque).

## I4a.3 — 2026-10-07 : fiche PDF sur une seule page quand c'est lisible

- Règle (demande du professeur) : une seule page A4 si le contenu y tient tel quel ou réduit de 14 % au plus (texte courant ≥ 9 pt) ; sinon recto verso sans réduction. Décision à chaque enregistrement, car la longueur des réponses varie (, testée).
- Mise en page propre au PDF : bande du haut (dessin, verdict, masses volumiques), titre redondant retiré, tableau resserré, matériaux écartés sur deux colonnes. Hauteur 4e : 1 602 px → environ 1 060 px (une page à 97 %).
- Vérifié : 4e et 5e sur une page (relues page à page) ; réponses très longues → deux pages.

## Backlog (itérations suivantes)

- Procédés présents au collège mais hors référentiel : cisaillage (cisaille guillotine), pliage de tôle (plieuse), poinçonnage (poinçonneuse) ; à ajouter en I6 si utile.

- I3 : scène 3D (model-viewer) turbine + robinet en coupe ; question ouverte : CAO du support P11 ou remodélisation.
- I4 : niveaux 5e et 3e à l'écran (moteur et données prêts), glossaire au survol, graphique masse volumique × rigidité, police Luciole.
- I5 : modes Explorer, Défi (code de réponse ; si un corrigé s'affiche, la note doit être figée avant), Professeur, liens profonds `?niveau=&composant=&mode=&embed=1`.
- I6 : composants du tableau 4.2 ; matériaux manquants (PET, PC, PS, PVC, EPDM, EPS, fonte).
- Questions ouvertes : matériau réel de la turbine du labo ; statut au BO du programme aménagé (aucun libellé officiel affiché d'ici là).
