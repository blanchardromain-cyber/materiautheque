# Matériauthèque

Application web autonome pour **choisir un matériau en le justifiant par un cahier des charges** (Technologie, cycle 4). Premier scénario : la turbine du générateur du robinet automatique (séquence P11), niveau 4e.

État : itérations I0 (référentiel) et I2 (moteur + application sans 3D). Voir `JOURNAL.md`.

## Ouvrir l'application

En ligne : **https://blanchardromain-cyber.github.io/materiautheque/** (`?niveau=4` pour la turbine, `?niveau=5` pour la casserole). Publiée par GitHub Pages depuis la branche `main` du dépôt `blanchardromain-cyber/materiautheque` ; changer `VERSION` dans `sw.js` à chaque mise en ligne.

Elle s'ouvre **par une adresse web**, pas par double-clic sur `index.html` (les modules JavaScript et la lecture des données sont bloqués en `file://`).

En local, depuis ce dossier :

```
python -m http.server 8820
```

puis ouvrir <http://localhost:8820>. Une fois chargée, elle fonctionne hors connexion.

Paramètre : `?composant=turbine-p11` (seul scénario pour l'instant).

## Les niveaux

| Niveau | Pièce | Ce qui change |
|---|---|---|
| 5e · débutant | Casserole : cuve et poignée (onglets) | Banc d'essai : 6 essais animés (aimant, circuit, chaleur, plaque chauffante, balance, flexion) qui révèlent les propriétés en mots ; un critère n'écarte qu'un échantillon testé. Étape 4 : « Comment est-elle fabriquée ? » (procédé d'usine) + encart prototype au collège. |
| 4e · confirmé | Turbine du robinet automatique | Critères indispensables et souhaitables, 12 matériaux, procédés en série et prototype au collège. |
| 3e · approfondi | à venir | Pondération, carte d'Ashby, cycle de vie. |

Le niveau se choisit à l'accueil ou par l'adresse : `?niveau=5`. Chaque niveau garde son propre travail en cours.

## Méthode : quand l'élève sait-il s'il a juste ?

Trois rendez-vous, sans jamais donner la réponse avant que l'élève l'ait cherchée.

| Moment | Ce qui est vérifié | Retour à l'élève |
|---|---|---|
| Étape 1 « Vérifier mes réponses » | Ce que subit la pièce | « Bien vu » / « À revoir » + explication, contrainte par contrainte |
| Étape 2 « Je classe » | La famille (d'où vient la matière ?), puis la sous-famille en 4e | « Exact » / « À revoir » ; l'explication propre au matériau n'apparaît qu'au 2e essai |
| Étape 3 « Vérifier mes critères » | Les critères vitaux (eau, légèreté) sont indispensables ; les pièges (électricité, 200 °C) sont sans importance. Les autres cartes sont libres. | « À revoir » + une question qui renvoie à l'étape 1. Pas de tri tant que ce n'est pas juste. |
| Étape 4 « Valider ce matériau » | Le matériau respecte **tous** les critères indispensables de l'élève, et un procédé de série permet de le fabriquer | Animation de la conséquence (rouille, démarrage lent…) ou « ce matériau n'est plus en lice », puis retour au tri |
| Étape 6 (verdict) | Comparaison avec le cahier des charges de référence | « Meilleur compromis » ou « Choix acceptable : il …, un autre matériau en lice fait mieux sur … » (sans nommer ce matériau) |

**Matériaux possibles pour la turbine (4e)** : le **POM** est le meilleur compromis (léger, résistant à l'eau et à l'usure, rigide, injectable). **ABS, PMMA, PE-HD et PP** sont des choix acceptables : ils respectent les critères indispensables mais perdent sur l'usure (et la rigidité pour PE-HD et PP). Plusieurs élèves peuvent donc rendre des matériaux différents ; la note porte sur la justification du compromis (grille 7.3), pas sur le seul nom du matériau. La correction collective peut faire émerger le POM à partir des choix acceptables.

## Étape « Je classe » (5e et 4e)

Placée après « J'observe », en trois temps :

1. **Mon tri** : l'élève range les échantillons dans 4 groupes (A à D) avec ses propres critères et nomme chaque groupe. Rien n'est noté.
2. **D'où vient la matière ?** : une seule question par échantillon (minerai, être vivant ou pétrole, roche/sable/argile, assemblage). Pièges voulus : alu et cuivre ne sont pas attirés par l'aimant mais sont des métaux. En 4e, la sous-famille suit (« Contient-il du fer ? » : l'inox est ferreux).
3. **Le bilan** : ses groupes face aux familles (groupe mélangé, famille éclatée, famille réunie), puis l'arbre de classification. La couleur de chaque famille se retrouve sur le bord des cartes jusqu'à la fin.

Les textes viennent de `data/familles.json` (`origine`, `explication`, `questionSousFamille`) et de `noteFamille` dans `data/materiaux.json`. Un parcours enregistré avant cette étape est recalé automatiquement.

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
| `app/parcours.js` | les 6 étapes de l'élève (4e) et l'aiguillage des niveaux |
| `app/cinquieme.js` | les étapes propres à la 5e (casserole, banc d'essai) |
| `app/classer.js` | l'étape « Je classe », commune aux niveaux |
| `app/illustrations.js` | SVG : robinet en coupe, turbine, conséquences d'un mauvais choix |
| `sw.js` | hors ligne |
| `RELECTURE.md` | fiche de relecture pour un 2e enseignant (générée) |
| `PROTOCOLE-TEST-ELEVES.md` | test « penser à voix haute » (3 élèves de 4e) |
