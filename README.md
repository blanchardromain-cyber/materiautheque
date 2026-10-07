# Matériauthèque

Application web autonome pour **choisir un matériau en le justifiant par un cahier des charges** (Technologie, cycle 4). Premier scénario : la turbine du générateur du robinet automatique (séquence P11), niveau 4e.

État : itérations I0 (référentiel) et I2 (moteur + application sans 3D). Voir `JOURNAL.md`.

## Ouvrir l'application

Elle s'ouvre **par une adresse web**, pas par double-clic sur `index.html` (les modules JavaScript et la lecture des données sont bloqués en `file://`).

En local, depuis ce dossier :

```
python -m http.server 8820
```

puis ouvrir <http://localhost:8820>. Une fois chargée, elle fonctionne hors connexion.

Paramètre : `?composant=turbine-p11` (seul scénario pour l'instant).

## Ajouter ou corriger un matériau

Tout le contenu est dans `data/` ; on n'a pas à toucher au code.

1. Modifier `data/materiaux.json` (notes de 1 à 5, coût de 1 à 3). Toute valeur non vérifiée se liste dans `aValider`.
2. Vérifier : `node outils/controle-donnees.mjs` (doit afficher `OK`).
3. Vérifier que les verdicts restent justes : `node --test tests/moteur.test.mjs`.
4. Régénérer la fiche de relecture : `node outils/genere-relecture.mjs`.
5. Avant de publier : changer `VERSION` dans `sw.js`, sinon les postes garderont l'ancienne version en cache hors ligne.

Node.js du poste : `ClaudeConfig/nodejs/node-v24.18.0-win-x64/node.exe`.

## Fichiers

| Fichier | Rôle |
|---|---|
| `data/*.json` | familles, propriétés, 18 matériaux, 10 procédés, scénarios, glossaire |
| `app/moteur.js` | tri : élimination argumentée, classement, contrôle du choix, procédés compatibles (sans DOM, testé) |
| `app/parcours.js` | les 5 étapes de l'élève |
| `app/illustrations.js` | SVG : robinet en coupe, turbine, conséquences d'un mauvais choix |
| `sw.js` | hors ligne |
| `RELECTURE.md` | fiche de relecture pour un 2e enseignant (générée) |
| `PROTOCOLE-TEST-ELEVES.md` | test « penser à voix haute » (3 élèves de 4e) |
