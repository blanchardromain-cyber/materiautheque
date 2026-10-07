import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  testerRegle, evaluer, verifierChoix, procedesCompatibles, classementReference, formaterValeur,
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
  assert.equal(res.length, 18);
  assert.equal(res[0].id, "pom");
  assert.equal(r.pa6.verdict, "acceptable");
  assert.equal(res[1].id, "pa6");
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
  const laiton = verifierChoix(turbine, materiaux, 4, "laiton");
  assert.equal(laiton.ok, false);
  const leger = laiton.violations.find((v) => v.critere === "leger");
  assert.equal(leger.consequence, "demarrage-lent");
  assert.ok(leger.question.length > 10);
  assert.equal(verifierChoix(turbine, materiaux, 4, "pom").ok, true);
  assert.equal(verifierChoix(turbine, materiaux, 4, "abs").ok, true, "acceptable = pas d'erreur");
  assert.equal(verifierChoix(turbine, materiaux, 4, "pa6").violations[0].consequence, "eau");
  assert.equal(verifierChoix(turbine, materiaux, 3, "acier").violations.some((v) => v.consequence === "freinage-aimant"), true);
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
