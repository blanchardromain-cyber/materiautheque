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

## Backlog (itérations suivantes)

- I3 : scène 3D (model-viewer) turbine + robinet en coupe ; question ouverte : CAO du support P11 ou remodélisation.
- I4 : niveaux 5e et 3e à l'écran (moteur et données prêts), glossaire au survol, graphique masse volumique × rigidité, police Luciole.
- I5 : modes Explorer, Défi (code de réponse ; si un corrigé s'affiche, la note doit être figée avant), Professeur, liens profonds `?niveau=&composant=&mode=&embed=1`.
- I6 : composants du tableau 4.2 ; matériaux manquants (PET, PC, PS, PVC, EPDM, EPS, fonte).
- Questions ouvertes : matériau réel de la turbine du labo ; statut au BO du programme aménagé (aucun libellé officiel affiché d'ici là).
