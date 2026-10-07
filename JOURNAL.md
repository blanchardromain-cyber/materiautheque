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

## Backlog (itérations suivantes)

- Remplacer les images fabricant (Bambu Lab A1, xTool) par des photos du collège avant toute publication. Photos non utilisées : cisaille guillotine, plieuse, poinçonneuse (procédés hors référentiel ; à ajouter en I6 si utile).

- I3 : scène 3D (model-viewer) turbine + robinet en coupe ; question ouverte : CAO du support P11 ou remodélisation.
- I4 : niveaux 5e et 3e à l'écran (moteur et données prêts), glossaire au survol, graphique masse volumique × rigidité, police Luciole.
- I5 : modes Explorer, Défi (code de réponse ; si un corrigé s'affiche, la note doit être figée avant), Professeur, liens profonds `?niveau=&composant=&mode=&embed=1`.
- I6 : composants du tableau 4.2 ; matériaux manquants (PET, PC, PS, PVC, EPDM, EPS, fonte).
- Questions ouvertes : matériau réel de la turbine du labo ; statut au BO du programme aménagé (aucun libellé officiel affiché d'ici là).
