// Chargement du référentiel (data/*.json).
import { avecCatalogue } from "./moteur.js";

const FICHIERS = ["familles", "proprietes", "materiaux", "procedes", "composants", "glossaire", "essais", "criteres"];

export async function chargerDonnees(base = "data/") {
  const entrees = await Promise.all(
    FICHIERS.map(async (nom) => {
      const r = await fetch(`${base}${nom}.json`);
      if (!r.ok) throw new Error(`Impossible de lire ${nom}.json (${r.status})`);
      return [nom, await r.json()];
    })
  );
  const d = Object.fromEntries(entrees);
  d.composants = avecCatalogue(d.composants, d.criteres);
  return d;
}
