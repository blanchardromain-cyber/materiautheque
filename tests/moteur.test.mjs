import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  testerRegle, evaluer, verifierChoix, procedesCompatibles, classementReference, formaterValeur,
  verifierClassement, verifierCoherence, verdictFinal,
} from "../app/moteur.js";

const lire = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
const materiaux = lire("materiaux.json");
const procedes = lire("procedes.json");
const turbine = lire("composants.json").find((s) => s.id === "turbine-p11");
const mat = (id) => materiaux.find((m) => m.id === id);
const parId = (res) => Object.fromEntries(res.map((r) => [r.id, r]));
const ref = (n) => classementReference(turbine, n);

test("testerRegle : opérateurs, chemins pointés, valeur absente", () => {
  assert.deepEqual(testerRegle(mat("pom"), { champ: "notes.eau", op: ">=", valeur: 3 }), { ok: true, v: 4 });
  assert.equal(testerRegle(mat("laiton"), { champ: "masseVolumique", op: "<=", valeur: 2 }).ok, false);
  assert.equal(testerRegle(mat("acier"), { champ: "magnetique", op: "==", valeur: false }).ok, false);
  assert.equal(testerRegle(mat("pom"), { champ: "procedes", op: "contient", valeur: "injection" }).ok, true);
  assert.equal(testerRegle(mat("pla"), { champ: "procedes", op: "contient", valeur: "injection" }).ok, false);
  assert.equal(testerRegle(mat("bois"), { champ: "tempMax", op: ">=", valeur: 200 }).ok, false, "null ne satisfait rien");
  assert.equal(testerRegle(mat("bois"), { champ: "absorptionEau", op: "<=", valeur: 1 }).ok, false);
});

test("formaterValeur : virgule décimale", () => {
  assert.equal(formaterValeur(8.5), "8,5");
  assert.equal(formaterValeur(1.39), "1,39");
  assert.equal(formaterValeur(4), "4");
});

test("4e, classement de référence : POM en tête, éliminations argumentées", () => {
  const res = evaluer(turbine, materiaux, 4, ref(4));
  const r = parId(res);
  assert.equal(res.length, 12);
  assert.equal(res[0].id, "pom");
  assert.deepEqual(res.filter((x) => x.verdict === "reference").map((x) => x.id), ["pom"]);
  for (const id of ["acier", "inox", "alu", "cuivre", "laiton", "pa6"]) assert.equal(r[id].verdict, "elimine", id);
  assert.match(r.laiton.raisons[0].texte, /trop lourd \(8,5 g\/cm³\)/);
  assert.equal(r.pa6.raisons[0].critere, "eau");
  assert.match(r.acier.raisons.map((x) => x.texte).join(" "), /s'abîme dans l'eau/);
  assert.equal(r.abs.verdict, "acceptable");
  assert.ok(r.abs.pertes.some((p) => p.critere === "usure"), "l'ABS perd l'usure");
  for (const x of res) if (x.elimine) assert.ok(x.raisons.length > 0, `${x.id} éliminé sans raison`);
  assert.ok(res.findIndex((x) => x.elimine) > res.findLastIndex((x) => !x.elimine), "éliminés en fin de liste");
});

test("5e : les trois plastiques restent, les métaux tombent", () => {
  const res = evaluer(turbine, materiaux, 5, ref(5));
  assert.equal(res.length, 6);
  assert.deepEqual(res.filter((x) => x.verdict === "reference").map((x) => x.id).sort(), ["abs", "pom", "pp"]);
});

test("3e : POM de référence, PA 6 compromis qui perd l'absorption, PP éliminé car souple", () => {
  const res = evaluer(turbine, materiaux, 3, ref(3), turbine.poids["3"]);
  const r = parId(res);
  assert.equal(res.length, 19);
  assert.equal(res[0].id, "pom");
  assert.equal(r.pa6.verdict, "acceptable");
  assert.deepEqual(r.pa6.pertes.map((p) => p.critere), ["absorption"]);
  assert.equal(r.pp.verdict, "elimine");
  assert.equal(r.acier.raisons.some((x) => x.critere === "amagnetique"), true);
});

test("oracle : réponses attendues et éliminations du scénario, sur les 3 niveaux", () => {
  for (const n of [5, 4, 3]) {
    const r = parId(evaluer(turbine, materiaux, n, ref(n), turbine.poids[String(n)]));
    const refs = Object.values(r).filter((x) => x.verdict === "reference").map((x) => x.id);
    for (const id of refs) assert.ok(turbine.reponsesAttendues[n].includes(id), `${n}e : ${id} pas attendu`);
    for (const id of turbine.reponsesAttendues[n]) assert.notEqual(r[id].verdict, "elimine", `${n}e : ${id} éliminé`);
    for (const id of turbine.elimineAttendus[n]) assert.equal(r[id].verdict, "elimine", `${n}e : ${id} non éliminé`);
  }
});

test("classement de l'élève : « conduire l'électricité » indispensable élimine tous les plastiques", () => {
  const cl = { ...ref(4), elec: "indispensable" };
  const r = parId(evaluer(turbine, materiaux, 4, cl));
  for (const id of ["pla", "abs", "pehd", "pp", "pmma", "pom"]) assert.equal(r[id].verdict, "elimine", id);
  assert.match(r.pom.raisons.find((x) => x.critere === "elec").texte, /isolant/);
});

test("classement de l'élève : critère « sans importance » ignoré, aucun indispensable → personne d'éliminé", () => {
  const cl = Object.fromEntries(Object.keys(ref(4)).map((k) => [k, "sans"]));
  const res = evaluer(turbine, materiaux, 4, cl);
  assert.equal(res.filter((x) => x.elimine).length, 0);
  assert.equal(res.filter((x) => x.verdict === "reference").length, 12, "tous à égalité");
});

test("verifierChoix contre la référence, quel que soit le classement de l'élève", () => {
  const laiton = verifierChoix(turbine, materiaux, 4, "laiton", procedes);
  assert.equal(laiton.ok, false);
  const leger = laiton.violations.find((v) => v.critere === "leger");
  assert.equal(leger.consequence, "demarrage-lent");
  assert.ok(leger.question.length > 10);
  assert.equal(verifierChoix(turbine, materiaux, 4, "pom", procedes).ok, true);
  assert.equal(verifierChoix(turbine, materiaux, 4, "abs", procedes).ok, true, "acceptable = pas d'erreur");
  assert.equal(verifierChoix(turbine, materiaux, 4, "pa6", procedes).violations[0].consequence, "eau");
  assert.equal(verifierChoix(turbine, materiaux, 3, "acier", procedes).violations.some((v) => v.consequence === "freinage-aimant"), true);
});

test("PLA : éliminé dès le tri parce qu'il vieillit dans l'eau (4e et 3e)", () => {
  assert.equal(parId(evaluer(turbine, materiaux, 4, ref(4))).pla.verdict, "elimine");
  assert.equal(parId(evaluer(turbine, materiaux, 4, ref(4))).pla.raisons[0].critere, "eau");
  assert.equal(parId(evaluer(turbine, materiaux, 3, ref(3), turbine.poids["3"])).pla.verdict, "elimine");
});

test("verifierChoix refuse un matériau sans procédé de grande série (composite en 3e)", () => {
  const v = verifierChoix(turbine, materiaux, 3, "composite-verre", procedes);
  assert.equal(v.ok, false);
  const p = v.violations.find((x) => x.critere === "procede");
  assert.equal(p.consequence, "fabrication");
  assert.ok(p.question.length > 10);
});

test("aucune impasse : tout matériau validé a un procédé compatible pour l'usage exigé, à chaque niveau", () => {
  for (const n of [5, 4, 3]) {
    const usage = n === 5 ? "prototype" : "serie";
    for (const m of materiaux) {
      if (!verifierChoix(turbine, materiaux, n, m.id, procedes).ok) continue;
      const ok = procedesCompatibles(m, procedes, turbine, n).some((p) => p.compatible && p.usage === usage);
      assert.ok(ok, `${n}e : ${m.id} validé mais aucun procédé « ${usage} »`);
    }
  }
});

test("procedesCompatibles : POM injecté en série, pas imprimable ; PLA imprimé en prototype", () => {
  const pom = parId(procedesCompatibles(mat("pom"), procedes, turbine, 4));
  assert.equal(pom.injection.compatible, true);
  assert.equal(pom.injection.usage, "serie");
  assert.equal(pom["impression-3d"].compatible, false);
  assert.match(pom["impression-3d"].raison, /POM/);
  assert.equal(pom.usinage.compatible, false);
  assert.match(pom.usinage.raison, /forme/i);
  const pla = parId(procedesCompatibles(mat("pla"), procedes, turbine, 4));
  assert.equal(pla["impression-3d"].compatible, true);
  assert.equal(pla["impression-3d"].usage, "prototype");
  const cinq = procedesCompatibles(mat("abs"), procedes, turbine, 5);
  assert.ok(cinq.every((p) => procedes.find((q) => q.id === p.id).lieu.includes("labo")), "5e : procédés du labo seulement");
});

test("rendez-vous 1 : verifierClassement exige les critères vitaux et écarte les pièges, sans imposer les souhaitables", () => {
  assert.deepEqual(verifierClassement(turbine, 4, ref(4)), []);
  const libre = { ...ref(4), usure: "indispensable", cout: "sans", rigide: "sans" };
  assert.deepEqual(verifierClassement(turbine, 4, libre), [], "les souhaitables de référence sont libres");
  const capture = { ...ref(4), elec: "indispensable", eau: "souhaitable" };
  const r = verifierClassement(turbine, 4, capture);
  assert.deepEqual(r.map((x) => x.critere).sort(), ["eau", "elec"]);
  for (const x of r) assert.ok(x.question.length > 10 && !/indispensable|sans importance/i.test(x.question), "question sans la réponse");
  assert.equal(verifierClassement(turbine, 4, {}).length, 4, "cartes non rangées = à revoir");
});

test("rendez-vous 2 : verifierCoherence refuse un matériau éliminé par les critères de l'élève", () => {
  const cl = { ...ref(4), usure: "indispensable" };
  const v = verifierCoherence(turbine, materiaux, 4, cl, "abs");
  assert.equal(v.length, 1);
  assert.equal(v[0].critere, "usure");
  assert.deepEqual(verifierCoherence(turbine, materiaux, 4, cl, "pom"), []);
  assert.equal(verifierCoherence(turbine, materiaux, 4, ref(4), "laiton")[0].consequence, "demarrage-lent");
});

test("rendez-vous 3 : verdict final explicite, sans nommer le meilleur compromis", () => {
  assert.equal(verdictFinal(turbine, materiaux, 4, "pom").niveau, "meilleur");
  const abs = verdictFinal(turbine, materiaux, 4, "abs");
  assert.equal(abs.niveau, "acceptable");
  assert.deepEqual(abs.pertes.map((p) => p.critere), ["usure"]);
  assert.deepEqual(abs.mieux, ["usure"], "un autre matériau fait mieux sur l'usure");
  const pehd = verdictFinal(turbine, materiaux, 4, "pehd");
  assert.deepEqual(pehd.pertes.map((p) => p.critere).sort(), ["rigide", "usure"]);
});

// ---------- 5e : la casserole, deux pièces ----------
import { scenarioPiece, lireEssai } from "../app/moteur.js";
const casserole = lire("composants.json").find((s) => s.id === "casserole");
const essais = lire("essais.json");

test("5e casserole : oracle par pièce avec le classement de référence", () => {
  for (const piece of ["cuve", "poignee"]) {
    const sc = scenarioPiece(casserole, piece);
    const r = parId(evaluer(sc, materiaux, 5, classementReference(sc, 5)));
    assert.equal(Object.keys(r).length, 6);
    assert.deepEqual(Object.values(r).filter((x) => x.verdict === "reference").map((x) => x.id).sort(), [...sc.reponsesAttendues["5"]].sort(), piece);
    for (const id of sc.elimineAttendus["5"]) assert.equal(r[id].verdict, "elimine", `${piece} : ${id}`);
  }
});

test("5e casserole : aucune impasse, procédés d'usine permis", () => {
  for (const piece of ["cuve", "poignee"]) {
    const sc = scenarioPiece(casserole, piece);
    for (const id of sc.reponsesAttendues["5"]) {
      const v = verifierChoix(sc, materiaux, 5, id, procedes);
      assert.ok(v.ok, `${piece} : ${id} refusé (${v.violations.map((x) => x.critere)})`);
    }
    assert.equal(verifierChoix(sc, materiaux, 5, "pp", procedes).ok, false);
  }
  const cuve = parId(procedesCompatibles(mat("inox"), procedes, scenarioPiece(casserole, "cuve"), 5));
  assert.equal(cuve.emboutissage.compatible, true, "l'emboutissage est proposé en 5e pour la casserole");
});

test("5e casserole : contraintes et vérification des critères par pièce", () => {
  const cuve = scenarioPiece(casserole, "cuve");
  assert.ok(cuve.contraintes.every((c) => c.piece === "cuve") && cuve.contraintes.length === 4);
  assert.equal(verifierClassement(cuve, 5, { "conduire-chaleur": "indispensable", "supporter-feu": "indispensable", electricite: "indispensable" }).length, 1);
  assert.equal(verdictFinal(cuve, materiaux, 5, "alu").niveau, "meilleur");
});

test("banc d'essai : lecture en mots, première règle satisfaite", () => {
  const e = (id) => essais.find((x) => x.id === id);
  assert.equal(lireEssai(e("aimant"), mat("alu")).classe, "non", "l'aluminium n'est pas attiré");
  assert.equal(lireEssai(e("aimant"), mat("acier")).classe, "oui");
  assert.equal(lireEssai(e("balance"), mat("cuivre")).texte, "lourd : le cube pèse 8,96 g");
  assert.equal(lireEssai(e("plaque"), mat("bois")).classe, "moyen");
  assert.equal(lireEssai(e("plaque"), mat("pp")).classe, "faible");
  assert.equal(lireEssai(e("flexion"), mat("cuivre")).classe, "moyen", "lourd ne veut pas dire le plus rigide");
});
