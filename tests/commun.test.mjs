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
