import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  testerRegle, evaluer, verifierChoix, procedesCompatibles, classementReference, formaterValeur,
  verifierClassement, verifierCoherence, verdictFinal, usageRequis, convientA, resoudreCriteres, avecCatalogue,
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

// ---------- Étape « Je classe » ----------
import { verifierFamilles, verifierSousFamilles, croiserGroupes } from "../app/moteur.js";
const familles = lire("familles.json");

test("je classe : la famille dépend de l'origine, pas de l'aimant (alu, cuivre = métaux)", () => {
  const v = verifierFamilles(materiaux, { alu: "metal", cuivre: "organique", bois: "organique", "cp-mdf": "organique" });
  assert.deepEqual(v, { alu: true, cuivre: false, bois: true, "cp-mdf": false }, "le contreplaqué est un composite");
});

test("je classe : sous-familles 4e, l'inox est ferreux même non aimanté", () => {
  const v = verifierSousFamilles(materiaux, { inox: "Ferreux", alu: "Ferreux", pla: "Synthétiques (plastiques, caoutchoucs)" }, 4);
  assert.deepEqual(v, { inox: true, alu: false, pla: true });
  assert.equal(mat("inox").magnetique, false, "piège voulu : ferreux mais non attiré par l'aimant");
});

test("je classe : croisement tri libre × familles", () => {
  const x = croiserGroupes(materiaux, { acier: 0, alu: 0, pom: 0, bois: 1 });
  assert.deepEqual(x, { 0: { metal: 2, organique: 1 }, 1: { organique: 1 } });
});

test("je classe : chaque famille a une origine, chaque matériau une note de famille", () => {
  for (const f of familles) assert.ok(f.origine && f.explication, f.id);
  for (const m of materiaux) assert.ok(m.noteFamille && m.noteFamille.length > 20, m.id);
});

test("série selon la quantité : grande à partir de 5 000 pièces, petite en dessous", () => {
  assert.equal(usageRequis(4, turbine), "serie");
  assert.equal(usageRequis(4, { ...turbine, quantiteSerie: 300 }), "petite");
  assert.equal(usageRequis(4, { ...turbine, quantiteSerie: 1200 }), "petite", "1 200 jantes : petite série");
  assert.equal(usageRequis(5, turbine), "prototype");
  assert.equal(usageRequis(5, { usageFabrication: "tout" }), "tout");
});

test("petite série : usinage et pliage de tôle oui, injection non (outillage trop coûteux)", () => {
  const sc = { ...turbine, forme: "pliee", quantiteSerie: 300 };
  const alu = parId(procedesCompatibles(mat("alu"), procedes, sc, 4));
  assert.equal(alu["pliage-tole"].compatible, true);
  assert.equal(convientA(alu["pliage-tole"], "petite"), true);
  assert.equal(convientA(alu.emboutissage, "petite"), false, "emboutissage : grande série seulement");
  assert.equal(convientA(alu.emboutissage, "serie"), true);
  const pom = parId(procedesCompatibles(mat("pom"), procedes, { ...turbine, forme: "volume-simple", quantiteSerie: 300 }, 4));
  assert.equal(convientA(pom.usinage, "petite"), true);
  assert.equal(convientA(pom.injection, "petite"), false);
});

test("PE-HD : thermoformé en coque", () => {
  const p = parId(procedesCompatibles(mat("pehd"), procedes, { ...turbine, forme: "coque", quantiteSerie: 300 }, 4));
  assert.equal(convientA(p.thermoformage, "petite"), true);
});

test("verifierChoix en petite série : POM refusé pour une tôle pliée, aluminium accepté", () => {
  const sc = { ...turbine, forme: "pliee", quantiteSerie: 300, reference: { 4: {} } };
  assert.equal(verifierChoix(sc, materiaux, 4, "pom", procedes).violations.some((v) => v.critere === "procede"), true);
  assert.equal(verifierChoix(sc, materiaux, 4, "alu", procedes).ok, true);
});

const catalogue = lire("criteres.json");

test("catalogue : une entrée sans ref est gardée telle quelle (turbine inchangée)", () => {
  assert.deepEqual(resoudreCriteres(turbine, catalogue).criteres, turbine.criteres);
});

test("catalogue : ref complétée, seuil reporté dans la règle et la carte, textes propres prioritaires", () => {
  const fiche = { criteres: [{ ref: "leger", seuil: 3, pourquoi: "Il est fixé sur la carte." }, { ref: "rigide", seuil: 5, carte: { 4: "Être très rigide (5/5)" } }] };
  const [leger, rigide] = resoudreCriteres(fiche, catalogue).criteres;
  assert.equal(leger.id, "leger");
  assert.equal(leger.regle.valeur, 3);
  assert.equal(leger.carte["4"], "Être léger (3 g/cm³ au plus)");
  assert.equal(leger.pourquoi, "Il est fixé sur la carte.");
  assert.equal(catalogue.find((c) => c.id === "leger").regle.valeur, 2, "le catalogue n'est pas modifié");
  assert.equal(rigide.regle.valeur, 5);
  assert.equal(rigide.carte["4"], "Être très rigide (5/5)");
  assert.throws(() => resoudreCriteres({ criteres: [{ ref: "inconnu" }] }, catalogue), /inconnu/);
});

test("catalogue : la casserole (critères par pièce) traverse avecCatalogue sans changement", () => {
  const cs = lire("composants.json");
  const cass = cs.find((s) => s.id === "casserole");
  assert.deepEqual(avecCatalogue(cs, catalogue).find((s) => s.id === "casserole"), cass);
});

const composants = avecCatalogue(lire("composants.json"), catalogue);
const bibliotheque = composants.filter((s) => s.objet && s.id !== "turbine-p11");

test("bibliothèque : 7 pièces, 3 du robinet et 4 du robot", () => {
  assert.deepEqual(bibliotheque.map((s) => s.id), ["boitier-capteur", "support-robinet", "mousseur", "coque-robot", "chassis-robot", "axe-robot", "jante-robot"]);
  assert.equal(bibliotheque.filter((s) => s.objet === "robot").every((s) => usageRequis(4, s) === "petite"), true);
  assert.equal(bibliotheque.filter((s) => s.objet === "robinet").every((s) => usageRequis(4, s) === "serie"), true);
});

test("bibliothèque : réponse attendue, éliminés, aucune impasse", () => {
  for (const s of bibliotheque) {
    const res = evaluer(s, materiaux, 4, classementReference(s, 4));
    const r = parId(res);
    for (const id of s.elimineAttendus["4"]) assert.equal(r[id].verdict, "elimine", `${s.id} : ${id} non éliminé`);
    for (const id of s.reponsesAttendues["4"]) {
      assert.equal(verifierChoix(s, materiaux, 4, id, procedes).ok, true, `${s.id} : ${id} refusé`);
      assert.equal(verdictFinal(s, materiaux, 4, id).niveau, "meilleur", `${s.id} : ${id} pas meilleur`);
    }
    const valides = res.filter((x) => verifierChoix(s, materiaux, 4, x.id, procedes).ok);
    assert.ok(valides.length > 0, `${s.id} : impasse`);
    for (const x of valides) if (x.verdict === "reference") assert.ok(s.reponsesAttendues["4"].includes(x.id), `${s.id} : ${x.id} meilleur non prévu`);
    for (const q of verifierClassement(s, 4, {})) assert.ok(q.question.length > 10, `${s.id}/${q.critere} : question manquante`);
  }
});

test("châssis : le POM passe les critères mais ne se plie pas en tôle", () => {
  const ch = composants.find((s) => s.id === "chassis-robot");
  assert.notEqual(parId(evaluer(ch, materiaux, 4, classementReference(ch, 4))).pom.verdict, "elimine");
  assert.equal(verifierChoix(ch, materiaux, 4, "pom", procedes).violations[0].critere, "procede");
});

test("coque : l'ABS tombe à 80 °C, le PP aux chocs", () => {
  const c = composants.find((s) => s.id === "coque-robot");
  const r = parId(evaluer(c, materiaux, 4, classementReference(c, 4)));
  assert.deepEqual(r.abs.raisons.map((x) => x.critere), ["tient80"]);
  assert.equal(r.pp.raisons[0].critere, "chocs");
});

test("verdict : seul matériau en lice, égalité, critères souhaitables manqués", () => {
  const sc = { ...turbine, criteres: turbine.criteres, reference: { 4: { eau: "indispensable", leger: "indispensable", rigide: "souhaitable", usure: "souhaitable", forme: "souhaitable", cout: "souhaitable", elec: "sans", chaleur: "sans" } } };
  const pom = verdictFinal(sc, materiaux, 4, "pom");
  assert.equal(pom.seul, false);
  assert.equal(pom.exAequo, false);
  assert.equal(pom.nbSouhaitables, 4);
  const seul = verdictFinal({ ...sc, reference: { 4: { ...sc.reference["4"], usure: "indispensable" } } }, materiaux, 4, "pom");
  assert.equal(seul.seul, true, "le POM seul passe eau + léger + usure");
  const cinq = verdictFinal(turbine, materiaux, 5, "abs");
  assert.equal(cinq.exAequo, true);
  assert.equal(cinq.nbSouhaitables, 0);
});

test("support mural et axe : vrais compromis, deux réponses à égalité", () => {
  const support = composants.find((s) => s.id === "support-robinet");
  const axe = composants.find((s) => s.id === "axe-robot");
  for (const [s, ids] of [[support, ["inox", "alu"]], [axe, ["inox", "pom"]]]) {
    assert.deepEqual([...s.reponsesAttendues["4"]].sort(), [...ids].sort());
    for (const id of ids) {
      const v = verdictFinal(s, materiaux, 4, id);
      assert.equal(v.niveau, "meilleur", `${s.id} : ${id}`);
      assert.equal(v.exAequo, true, `${s.id} : ${id} à égalité`);
      assert.ok(v.pertes.length > 0, `${s.id} : ${id} perd au moins un critère souhaitable`);
    }
  }
});

test("mousseur et jante : compromis à égalité (POM/ABS, POM/PA 6), inox refusé faute de procédé pour le mousseur", () => {
  const mousseur = composants.find((s) => s.id === "mousseur");
  const jante = composants.find((s) => s.id === "jante-robot");
  for (const [s, ids] of [[mousseur, ["pom", "abs"]], [jante, ["pom", "pa6"]]])
    for (const id of ids) {
      const v = verdictFinal(s, materiaux, 4, id, procedes);
      assert.equal(v.niveau, "meilleur", `${s.id} : ${id}`);
      assert.equal(v.exAequo, true, `${s.id} : ${id} à égalité`);
    }
  assert.equal(verifierChoix(mousseur, materiaux, 4, "inox", procedes).violations[0].critere, "procede");
  assert.equal(verifierChoix(mousseur, materiaux, 4, "laiton", procedes).ok, true, "laiton acceptable");
});
