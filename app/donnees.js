// Chargement du référentiel (data/*.json).
const FICHIERS = ["familles", "proprietes", "materiaux", "procedes", "composants", "glossaire"];

export async function chargerDonnees(base = "data/") {
  const entrees = await Promise.all(
    FICHIERS.map(async (nom) => {
      const r = await fetch(`${base}${nom}.json`);
      if (!r.ok) throw new Error(`Impossible de lire ${nom}.json (${r.status})`);
      return [nom, await r.json()];
    })
  );
  return Object.fromEntries(entrees);
}
