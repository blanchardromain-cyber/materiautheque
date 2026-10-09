// Génère RELECTURE.md à partir des données : node outils/genere-relecture.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { evaluer, classementReference, criteresDuNiveau, lireChamp, formaterValeur, scenarioPiece, avecCatalogue, usageRequis, verifierChoix } from "../app/moteur.js";

const racine = new URL("../", import.meta.url);
const lire = (f) => JSON.parse(readFileSync(new URL(`data/${f}`, racine), "utf8"));
const materiaux = lire("materiaux.json");
const procedes = lire("procedes.json");
const scenarios = avecCatalogue(lire("composants.json"), lire("criteres.json"));
const familles = Object.fromEntries(lire("familles.json").map((f) => [f.id, f]));
const nomProcede = Object.fromEntries(procedes.map((p) => [p.id, p.nom.split(" (")[0]]));

const cellule = (m, chemin, texte) => {
  const t = texte ?? formaterValeur(lireChamp(m, chemin) ?? "—");
  return (m.aValider || []).includes(chemin) ? `**${t}** ✱` : t;
};

const L = [];
L.push("# Matériauthèque — fiche de relecture du référentiel (I0)", "");
L.push("Fichier généré par `outils/genere-relecture.mjs` : ne pas modifier à la main, corriger `data/*.json` puis relancer.", "");
L.push("**Ce qu'on vous demande** : vérifier les valeurs marquées **en gras ✱** (ordres de grandeur proposés, absents du document de cadrage), puis les verdicts du scénario. Notez vos corrections dans la colonne de droite ou en marge.", "");
L.push("Notes de 1 (faible) à 5 (fort) ; coût de 1 (€) à 3 (€€€).", "");

L.push("## 1. Matériaux", "");
L.push("| Matériau (4e) | Famille | Masse vol. (g/cm³) | Rigidité | Chocs | Usure | Eau | Corrosion | Absorption eau (%) | Temp. max (°C) | Coût | Recyclage | Origine | Magnétique | Procédés | Correction |");
L.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const m of materiaux) {
  const procs = m.procedes.length ? m.procedes.map((p) => nomProcede[p]).join(" ; ") : (m.noteProcedes || "—");
  L.push(`| ${m.nom["4"]} | ${familles[m.famille].nom["4"]} | ${m.masseVolumiqueTexte || formaterValeur(m.masseVolumique)} | ` +
    ["notes.rigidite", "notes.chocs", "notes.usure", "notes.eau", "notes.corrosion", "absorptionEau"].map((c) => cellule(m, c)).join(" | ") +
    ` | ${m.tempMaxTexte} | ${cellule(m, "cout")} | ${cellule(m, "recyclage.note")} (${cellule(m, "recyclage.code", m.recyclage.code)}) | ${cellule(m, "origine")} | ${cellule(m, "magnetique", m.magnetique ? "oui" : "non")} | ${cellule(m, "procedes", procs)} |  |`);
}
L.push("");

const libelle = { indispensable: "Indispensable", souhaitable: "Souhaitable", sans: "Sans importance (piège)" };
const verdictTexte = { reference: "Choix de référence", acceptable: "Acceptable", elimine: "Éliminé" };
const unites = scenarios.flatMap((sc) => sc.pieces ? sc.pieces.map((p) => ({ ...scenarioPiece(sc, p.id), titre: `${sc.piece} — ${p.piece}` })) : [{ ...sc, titre: sc.piece }]);
for (const s of unites) {
  L.push(`## 2. Scénario « ${s.titre} » (${s.systeme})`, "", s.avertissement ? `> ${s.avertissement}` : "", "");
  if (s.objet && s.id !== "turbine-p11") {
    L.push(`Quantité : ${s.quantiteSerie} (${usageRequis(4, s) === "petite" ? "petite" : "grande"} série). Forme : ${s.forme}.`, "");
    L.push("| Étape 1 : affirmation | Vraie ? | Explication | Correction |", "|---|---|---|---|");
    for (const c of s.contraintes) L.push(`| ${c.texte} | ${c.vraie ? "vraie" : "fausse (piège)"} | ${c.explication} |  |`);
    L.push("", "| Critère | Pourquoi | Question si mal classé | Question si choix refusé | Correction |", "|---|---|---|---|---|");
    for (const c of s.criteres) L.push(`| ${c.carte["4"]} | ${c.pourquoi || ""} | ${c.questionClassement || ""} | ${c.questionRetour || ""} |  |`);
    L.push("");
  }
  for (const n of (s.niveaux || [4, 5, 3])) {
    const ref = classementReference(s, n);
    L.push(`### Niveau ${n}e`, "", "| Critère (carte élève) | Statut de référence | Règle | Poids |", "|---|---|---|---|");
    for (const c of criteresDuNiveau(s, n))
      L.push(`| ${c.carte[n]} | ${libelle[ref[c.id]]} | \`${c.regle.champ} ${c.regle.op} ${JSON.stringify(c.regle.valeur)}\` | ${s.poids?.[n]?.[c.id] ?? (ref[c.id] === "souhaitable" ? 1 : "")} |`);
    // Score = critères souhaitables respectés, sur le nombre de critères souhaitables (pondérés en 3e).
    const poids = s.poids?.[n] || {};
    const total = criteresDuNiveau(s, n).filter((c) => ref[c.id] === "souhaitable").reduce((t, c) => t + (poids[c.id] || 1), 0);
    L.push("", "| Matériau | Verdict calculé | Critères souhaitables respectés | Raison (éliminé) ou ce que l'on perd | D'accord ? |", "|---|---|---|---|---|");
    const res = evaluer(s, materiaux, n, ref, poids);
    const enLice = res.filter((r) => !r.elimine);
    const refs = res.filter((r) => r.verdict === "reference");
    for (const r of res) {
      const m = materiaux.find((x) => x.id === r.id);
      const motifs = (r.elimine ? r.raisons : r.pertes).map((x) => x.texte).join(" ; ") || "—";
      const verdict = r.verdict !== "reference" ? verdictTexte[r.verdict]
        : enLice.length === 1 ? "Seul matériau en lice" : refs.length > 1 ? "Choix de référence (à égalité)" : verdictTexte.reference;
      const score = r.elimine ? "" : total ? `${r.score} / ${total}` : "— (aucun critère souhaitable)";
      const fab = r.elimine || verifierChoix(s, materiaux, n, r.id, procedes).ok ? "" : " — refusé : pas de procédé possible";
      L.push(`| ${m.nom[n]} | ${verdict}${fab} | ${score} | ${motifs} |  |`);
    }
    L.push("");
  }
}

L.push("## 3. Questions pour le relecteur", "");
L.push("1. Les notes ✱ vous semblent-elles justes en ordre de grandeur pour des élèves de collège ?");
L.push("2. Le seuil « léger = 2 g/cm³ au plus » est-il défendable devant une classe ?");
L.push("3. En 4e, PE-HD et PP restent « acceptables » (souples mais légers et étanches) : faut-il rendre la rigidité indispensable dès la 4e ?");
L.push("4. Faut-il un matériau supplémentaire (PET, PC, PS, PVC, EPDM…) pour les composants du tableau 4.2 ?");
L.push("");
writeFileSync(new URL("RELECTURE.md", racine), L.join("\n"), "utf8");
console.log("RELECTURE.md écrit");
