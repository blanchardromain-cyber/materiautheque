import { test } from "node:test";
import assert from "node:assert/strict";
import { formaterNom, formaterPrenom, identiteComplete, texteIdentite } from "../app/commun.js";

test("nom en majuscules, accents compris", () => {
  assert.equal(formaterNom("le bihan-hérault"), "LE BIHAN-HÉRAULT");
});

test("prénom : première lettre en majuscule, prénoms composés compris", () => {
  assert.equal(formaterPrenom("léa"), "Léa");
  assert.equal(formaterPrenom("JEAN-PIERRE"), "Jean-Pierre");
  assert.equal(formaterPrenom("marie anne"), "Marie Anne");
  assert.equal(formaterPrenom("élodie"), "Élodie");
});

test("identification complète, seul ou en binôme", () => {
  const seul = { prenom: "Léa", nom: "MARTIN", classe: "4e B" };
  assert.equal(identiteComplete(seul), true);
  assert.equal(identiteComplete({ ...seul, binome: true }), false, "en binôme, l'élève 2 est obligatoire");
  assert.equal(identiteComplete({ ...seul, binome: true, prenom2: "Tom", nom2: "DUPONT" }), true);
  assert.match(texteIdentite({ ...seul, binome: true, prenom2: "Tom", nom2: "DUPONT" }), /^Léa MARTIN et Tom DUPONT · 4e B · /);
  assert.match(texteIdentite(seul), /^Léa MARTIN · 4e B · /);
});

test("une saisie ancienne non formatée est mise en forme à l'impression", () => {
  assert.match(texteIdentite({ prenom: "léa", nom: "Martin", classe: "5e A" }), /^Léa MARTIN · 5e A/);
});

import { choisirMiseEnPage, REDUCTION_MINI } from "../app/commun.js";
test("mise en page PDF : une page si possible sans descendre sous 9 pt, sinon recto verso", () => {
  assert.deepEqual(choisirMiseEnPage(900), { pages: 1, echelle: 1 });
  const juste = choisirMiseEnPage(1100);
  assert.equal(juste.pages, 1);
  assert.ok(juste.echelle >= REDUCTION_MINI && juste.echelle < 1);
  assert.deepEqual(choisirMiseEnPage(1600), { pages: 2, echelle: 1 }, "trop long : on garde deux pages lisibles");
  assert.ok(14 * REDUCTION_MINI * 0.75 >= 9, "texte courant (14 px) au moins à 9 pt une fois réduit");
});

import { nomFichierPDF } from "../app/commun.js";

test("nom du fichier PDF : la pièce après le niveau, sans accent", () => {
  assert.equal(nomFichierPDF(4, { nom: "Durand", prenom: "léa" }, "châssis"), "Materiautheque-4e-chassis-DURAND-Lea.pdf");
  assert.equal(nomFichierPDF(4, { nom: "Durand", prenom: "léa" }), "Materiautheque-4e-DURAND-Lea.pdf");
});
