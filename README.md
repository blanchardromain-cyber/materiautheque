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

## Méthode : quand l'élève sait-il s'il a juste ?

Trois rendez-vous, sans jamais donner la réponse avant que l'élève l'ait cherchée.

| Moment | Ce qui est vérifié | Retour à l'élève |
|---|---|---|
| Étape 1 « Vérifier mes réponses » | Ce que subit la pièce | « Bien vu » / « À revoir » + explication, contrainte par contrainte |
| Étape 2 « Vérifier mes critères » | Les critères vitaux (eau, légèreté) sont indispensables ; les pièges (électricité, 200 °C) sont sans importance. Les autres cartes sont libres. | « À revoir » + une question qui renvoie à l'étape 1. Pas de tri tant que ce n'est pas juste. |
| Étape 3 « Valider ce matériau » | Le matériau respecte **tous** les critères indispensables de l'élève, et un procédé de série permet de le fabriquer | Animation de la conséquence (rouille, démarrage lent…) ou « ce matériau n'est plus en lice », puis retour au tri |
| Étape 5 (verdict) | Comparaison avec le cahier des charges de référence | « Meilleur compromis » ou « Choix acceptable : il …, un autre matériau en lice fait mieux sur … » (sans nommer ce matériau) |

**Matériaux possibles pour la turbine (4e)** : le **POM** est le meilleur compromis (léger, résistant à l'eau et à l'usure, rigide, injectable). **ABS, PMMA, PE-HD et PP** sont des choix acceptables : ils respectent les critères indispensables mais perdent sur l'usure (et la rigidité pour PE-HD et PP). Plusieurs élèves peuvent donc rendre des matériaux différents ; la note porte sur la justification du compromis (grille 7.3), pas sur le seul nom du matériau. La correction collective peut faire émerger le POM à partir des choix acceptables.

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
