// Moteur de choix : aucune dépendance au DOM, testé par tests/moteur.test.mjs.
// Les règles sont des données { champ, op, valeur } ; un champ absent ou null ne satisfait aucune règle.

export const lireChamp = (obj, chemin) =>
  chemin.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

export const formaterValeur = (v) =>
  typeof v === "number" ? String(v).replace(".", ",") : String(v);

export function testerRegle(materiau, { champ, op, valeur }) {
  const v = lireChamp(materiau, champ);
  if (v == null) return { ok: false, v };
  const ok =
    op === ">=" ? v >= valeur :
    op === "<=" ? v <= valeur :
    op === "==" ? v === valeur :
    op === "contient" ? Array.isArray(v) && v.includes(valeur) :
    false;
  return { ok, v };
}

export const criteresDuNiveau = (scenario, niveau) =>
  scenario.criteres.filter((c) => c.niveaux.includes(Number(niveau)));

export const classementReference = (scenario, niveau) => ({ ...scenario.reference[String(niveau)] });

export function materiauxVisibles(scenario, materiaux, niveau) {
  const liste = scenario.materiauxVisibles[String(niveau)];
  return liste === "tous" ? materiaux : liste.map((id) => materiaux.find((m) => m.id === id));
}

const motif = (critere, v) => ({
  critere: critere.id,
  texte: critere.nonParceQue.replace("{v}", formaterValeur(v)),
});

// classement : { idCritere: "indispensable" | "souhaitable" | "sans" } ; poids : { idCritere: 1..3 } (3e)
export function evaluer(scenario, materiaux, niveau, classement, poids = {}) {
  const criteres = criteresDuNiveau(scenario, niveau);
  const resultats = materiauxVisibles(scenario, materiaux, niveau).map((m, rang) => {
    const raisons = [], pertes = [];
    let score = 0;
    for (const c of criteres) {
      const statut = classement[c.id] || "sans";
      if (statut === "sans") continue;
      const { ok, v } = testerRegle(m, c.regle);
      if (statut === "indispensable" && !ok) raisons.push(motif(c, v));
      if (statut === "souhaitable") ok ? (score += poids[c.id] || 1) : pertes.push(motif(c, v));
    }
    return { id: m.id, elimine: raisons.length > 0, raisons, score, pertes, rang };
  });
  const survivants = resultats.filter((r) => !r.elimine).sort((a, b) => b.score - a.score || a.rang - b.rang);
  const elimines = resultats.filter((r) => r.elimine);
  const meilleur = survivants.length ? survivants[0].score : null;
  for (const r of survivants) r.verdict = r.score === meilleur ? "reference" : "acceptable";
  for (const r of elimines) r.verdict = "elimine";
  return [...survivants, ...elimines].map(({ rang, ...r }) => r);
}

// Contrôle du choix final contre le classement de RÉFÉRENCE du scénario.
export function verifierChoix(scenario, materiaux, niveau, idMateriau) {
  const m = materiaux.find((x) => x.id === idMateriau);
  const ref = classementReference(scenario, niveau);
  const violations = criteresDuNiveau(scenario, niveau)
    .filter((c) => ref[c.id] === "indispensable")
    .map((c) => ({ c, ...testerRegle(m, c.regle) }))
    .filter((t) => !t.ok)
    .map(({ c, v }) => ({ ...motif(c, v), consequence: c.consequence || null, question: c.questionRetour || "" }));
  return { ok: violations.length === 0, violations };
}

export function procedesCompatibles(materiau, procedes, scenario, niveau) {
  const nom = materiau.nom[String(niveau)];
  return procedes
    .filter((p) => Number(niveau) !== 5 || p.lieu.includes("labo"))
    .map((p) => {
      if (!materiau.procedes.includes(p.id))
        return { id: p.id, compatible: false, usage: null, raison: `Le matériau « ${nom} » ne s'obtient pas par ce procédé.` };
      if (!p.formes.includes(scenario.forme))
        return { id: p.id, compatible: false, usage: null, raison: `Ce procédé ne donne pas cette forme. ${p.regleForme}` };
      const usage = p.serie.includes("grande") ? "serie" : "prototype";
      return { id: p.id, compatible: true, usage, raison: p.regleForme };
    });
}
