import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { robinetCoupeSVG, objetSVG, dessinPiece, consequence, turbineSVG } from "../app/illustrations.js";

const temoin = readFileSync(new URL("./fixtures/robinet-turbine.svg", import.meta.url), "utf8");
const PIECES = { robinet: ["boitier-capteur", "support-robinet", "mousseur"], robot: ["coque-robot", "chassis-robot", "axe-robot", "jante-robot"] };
const nom = { le: "le boîtier", seul: "boîtier", pronom: "il", feminin: false };

test("robinet de la turbine : dessin inchangé", () => {
  assert.equal(robinetCoupeSVG(), temoin);
});

test("objets : chaque pièce est surlignée et repérée", () => {
  for (const [o, ids] of Object.entries(PIECES)) for (const id of ids) {
    const svg = objetSVG(o, { piece: id, peau: { couleur: "#123456" } });
    assert.match(svg, /class="piece-active"/, id);
    assert.match(svg, /--peau:#123456/, id);
    assert.match(svg, /class="repere"/, id);
    assert.match(svg, /etiquette-forte/, id);
  }
  assert.doesNotMatch(objetSVG("robinet", { piece: "boitier-capteur" }), /<circle r="34" class="repere" \/>/, "repère de la turbine retiré");
  assert.match(objetSVG("robot", { piece: "coque-robot", enMarche: true }), /class="robot objet en-marche"/);
});

test("dessinPiece : la turbine garde son dessin", () => {
  assert.equal(dessinPiece({ dessin: "turbine" }, { couleur: "#F2C230" }, "", "Turbine"), turbineSVG({ couleur: "#F2C230", classe: "" }, "Turbine"));
});

test("conséquences génériques : nom de la pièce, classe d'animation", () => {
  const S = { id: "boitier-capteur", objet: "robinet", nom };
  const metal = { famille: "metal", nom: { 4: "Acier" }, peau3D: { couleur: "#888888" } };
  const c = consequence("court-circuit", metal, S);
  assert.match(c.texte, /^Le boîtier conduit le courant/);
  assert.equal(c.classe, "c-court");
  assert.match(c.svg, /class="robinet objet c-court"/);
  assert.match(c.svg, /class="eclair"/);
  assert.equal(consequence("eau", metal, S).classe, "c-rouille");
  assert.match(consequence("eau", { ...metal, famille: "organique" }, { ...S, nom: { ...nom, le: "la coque", feminin: true, pronom: "elle" } }).texte, /s'est abîmée/);
});
