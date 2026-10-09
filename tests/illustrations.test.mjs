import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { robinetCoupeSVG } from "../app/illustrations.js";

const temoin = readFileSync(new URL("./fixtures/robinet-turbine.svg", import.meta.url), "utf8");

test("robinet de la turbine : dessin inchangé", () => {
  assert.equal(robinetCoupeSVG(), temoin);
});
