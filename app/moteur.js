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

// Usage de fabrication exigé à l'étape 5 : procédés du labo en 5e ; ensuite la quantité décide.
// Un scénario peut l'imposer (« tout » : n'importe quel procédé compatible, ex. la casserole en 5e).
export const SEUIL_GRANDE_SERIE = 5000; // « des milliers de pièces » : 1 200 jantes restent une petite série
export const usageRequis = (niveau, scenario) =>
  scenario?.usageFabrication || (Number(niveau) === 5 ? "prototype"
    : (scenario?.quantiteSerie ?? SEUIL_GRANDE_SERIE) < SEUIL_GRANDE_SERIE ? "petite" : "serie");

// Un procédé compatible convient-il à l'usage exigé ? En petite série, un procédé de grande série
// seulement (moule, outillage) est refusé : trop coûteux pour si peu de pièces.
export const convientA = (p, usage) => p.compatible && (usage === "tout" || (usage === "petite" ? p.petite : p.usage === usage));

// Une pièce d'un scénario à plusieurs pièces, vue comme un scénario autonome.
export function scenarioPiece(scenario, idPiece) {
  const piece = scenario.pieces.find((p) => p.id === idPiece);
  const { pieces, ...commun } = scenario;
  return { ...commun, ...piece, contraintes: (scenario.contraintes || []).filter((c) => c.piece === idPiece) };
}

// Banc d'essai : la première lecture dont la règle est satisfaite (la dernière n'a pas de règle).
export function lireEssai(essai, materiau) {
  const l = essai.lectures.find((x) => !x.regle || testerRegle(materiau, x.regle).ok);
  const v = essai.champValeur ? formaterValeur(lireChamp(materiau, essai.champValeur)) : "";
  return { classe: l.classe, texte: l.texte.replace("{v}", v) };
}

// Contrôle du choix final contre le classement de RÉFÉRENCE du scénario,
// puis « le matériau ne va jamais sans son procédé » : il faut un procédé compatible pour l'usage exigé.
export function verifierChoix(scenario, materiaux, niveau, idMateriau, procedes) {
  const m = materiaux.find((x) => x.id === idMateriau);
  const ref = classementReference(scenario, niveau);
  const violations = criteresDuNiveau(scenario, niveau)
    .filter((c) => ref[c.id] === "indispensable")
    .map((c) => ({ c, ...testerRegle(m, c.regle) }))
    .filter((t) => !t.ok)
    .map(({ c, v }) => ({ ...motif(c, v), consequence: c.consequence || null, question: c.questionRetour || "" }));
  const usage = usageRequis(niveau, scenario);
  const fabricable = procedesCompatibles(m, procedes, scenario, niveau)
    .some((p) => convientA(p, usage));
  if (!fabricable)
    violations.push({ critere: "procede", texte: scenario.sansProcede.nonParceQue,
      consequence: "fabrication", question: scenario.sansProcede.question });
  return { ok: violations.length === 0, violations };
}

// Rendez-vous 1 (fin d'étape 2) : les critères indispensables de référence doivent être indispensables,
// les pièges (« sans » en référence) sans importance ; les souhaitables de référence restent libres.
export function verifierClassement(scenario, niveau, classement) {
  const ref = classementReference(scenario, niveau);
  return criteresDuNiveau(scenario, niveau)
    .filter((c) => ref[c.id] !== "souhaitable" && classement[c.id] !== ref[c.id])
    .map((c) => ({ critere: c.id, question: c.questionClassement || c.questionRetour || "" }));
}

// Rendez-vous 2 (validation, étape 3) : le choix doit respecter TOUS les critères indispensables de l'élève.
export function verifierCoherence(scenario, materiaux, niveau, classement, idMateriau) {
  const m = materiaux.find((x) => x.id === idMateriau);
  return criteresDuNiveau(scenario, niveau)
    .filter((c) => classement[c.id] === "indispensable")
    .map((c) => ({ c, ...testerRegle(m, c.regle) }))
    .filter((t) => !t.ok)
    .map(({ c, v }) => ({ ...motif(c, v), consequence: c.consequence || null, question: c.questionRetour || "" }));
}

// Rendez-vous 3 (étape 5) : verdict selon la référence, sans nommer le meilleur compromis.
// seul : aucun autre matériau ne passe (ni, si procedes est fourni, ne peut être fabriqué) ;
// exAequo : un autre matériau possible fait aussi bien ; nbSouhaitables : critères souhaitables de référence.
export function verdictFinal(scenario, materiaux, niveau, idMateriau, procedes) {
  const ref = classementReference(scenario, niveau);
  const res = evaluer(scenario, materiaux, niveau, ref, scenario.poids?.[String(niveau)] || {});
  const r = res.find((x) => x.id === idMateriau);
  const meilleur = res[0];
  const niveauVerdict = r.verdict === "reference" ? "meilleur" : r.verdict;
  const perdus = new Set(r.pertes.map((p) => p.critere));
  const tenusParMeilleur = new Set(meilleur.pertes.map((p) => p.critere));
  const mieux = [...perdus].filter((id) => !tenusParMeilleur.has(id));
  const possibles = res.filter((x) => !x.elimine && (!procedes || x.id === idMateriau || verifierChoix(scenario, materiaux, niveau, x.id, procedes).ok));
  const seul = possibles.length === 1 && possibles[0].id === idMateriau;
  const exAequo = niveauVerdict === "meilleur" && possibles.some((x) => x.id !== idMateriau && x.verdict === "reference");
  const nbSouhaitables = criteresDuNiveau(scenario, niveau).filter((c) => ref[c.id] === "souhaitable").length;
  return { niveau: niveauVerdict, pertes: r.pertes, mieux, raisons: r.raisons, seul, exAequo, nbSouhaitables };
}

export function procedesCompatibles(materiau, procedes, scenario, niveau) {
  const nom = materiau.nom[String(niveau)];
  return procedes
    .filter((p) => Number(niveau) !== 5 || scenario.lieuProcedes === "tous" || p.lieu.includes("labo"))
    .map((p) => {
      if (!materiau.procedes.includes(p.id))
        return { id: p.id, compatible: false, usage: null, raison: `Le matériau « ${nom} » ne s'obtient pas par ce procédé.` };
      if (!p.formes.includes(scenario.forme))
        return { id: p.id, compatible: false, usage: null, raison: `Ce procédé ne donne pas cette forme. ${p.regleForme}` };
      const usage = p.serie.includes("grande") ? "serie" : "prototype";
      return { id: p.id, compatible: true, usage, petite: p.serie.includes("petite"), raison: p.regleForme };
    });
}

// ---------- Étape « Je classe » : la famille se reconnaît à l'origine de la matière ----------
const parId = (materiaux, id) => materiaux.find((m) => m.id === id);

// reponses : { idMateriau: idFamille } → { idMateriau: juste ? }
export function verifierFamilles(materiaux, reponses) {
  return Object.fromEntries(Object.entries(reponses).map(([id, f]) => [id, parId(materiaux, id).famille === f]));
}

// reponses : { idMateriau: libellé de sous-famille du niveau } → { idMateriau: juste ? }
export function verifierSousFamilles(materiaux, reponses, niveau) {
  return Object.fromEntries(Object.entries(reponses).map(([id, sf]) => [id, parId(materiaux, id).sousFamille?.[String(niveau)] === sf]));
}

// Tri libre de l'élève (boîtes numérotées) croisé avec les vraies familles : { boîte: { famille: nombre } }
export function croiserGroupes(materiaux, groupes) {
  const x = {};
  for (const [id, boite] of Object.entries(groupes)) {
    const f = parId(materiaux, id).famille;
    (x[boite] ||= {})[f] = (x[boite][f] || 0) + 1;
  }
  return x;
}

// ---------- Catalogue de critères (bibliothèque de pièces) ----------
// Entrée de fiche { ref, seuil?, ...textes propres } → critère complet ; une entrée sans ref est gardée telle quelle.
export function resoudreCriteres(fiche, catalogue) {
  const criteres = fiche.criteres.map((e) => {
    if (!e.ref) return e;
    const { ref, seuil, ...propre } = e;
    const base = catalogue.find((c) => c.id === ref);
    if (!base) throw new Error(`critère inconnu : ${ref}`);
    const regle = seuil === undefined ? base.regle : { ...base.regle, valeur: seuil };
    const carte = Object.fromEntries(Object.entries(base.carte).map(([n, t]) => [n, t.replace("{s}", formaterValeur(regle.valeur))]));
    return { ...base, id: ref, carte, regle, ...propre };
  });
  return { ...fiche, criteres };
}

export const avecCatalogue = (composants, catalogue) =>
  composants.map((f) => (f.criteres ? resoudreCriteres(f, catalogue) : f));
