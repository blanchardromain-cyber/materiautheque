// Contrôle du référentiel : node outils/controle-donnees.mjs [dossier-data]
// Code de sortie 1 et liste des erreurs si une règle n'est pas respectée.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { scenarioPiece } from "../app/moteur.js";
import { fileURLToPath } from "node:url";

const dossier = process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const lire = (f) => JSON.parse(readFileSync(join(dossier, f), "utf8"));
const erreurs = [];
const err = (m) => erreurs.push(m);
const champ = (obj, chemin) => chemin.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
const entier = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

const familles = lire("familles.json");
const proprietes = lire("proprietes.json");
const materiaux = lire("materiaux.json");
const procedes = lire("procedes.json");
const composants = lire("composants.json");
lire("glossaire.json");

const NIVEAUX = ["5", "4", "3"];
const idsFamilles = new Set(familles.map((f) => f.id));
for (const f of familles) {
  for (const k of ["couleur", "origine", "explication"]) if (!f[k]?.trim?.()) err(`famille ${f.id} : ${k} manquant`);
  for (const n of NIVEAUX) if (!f.nom?.[n]) err(`famille ${f.id} : nom ${n}e manquant`);
  if (f.sousFamilles["4"].length > 1 && !f.questionSousFamille?.["4"]) err(`famille ${f.id} : questionSousFamille 4e manquante`);
}
const idsProcedes = new Set(procedes.map((p) => p.id));
const idsMateriaux = new Set(materiaux.map((m) => m.id));

if (materiaux.length !== 19) err(`19 matériaux attendus, ${materiaux.length} trouvés`);
if (idsMateriaux.size !== materiaux.length) err("identifiants de matériaux en double");
if (procedes.length !== 11) err(`11 procédés attendus, ${procedes.length} trouvés`);
if (idsProcedes.size !== procedes.length) err("identifiants de procédés en double");

for (const p of procedes) {
  if (!p.principe) err(`${p.id} : principe manquant`);
  if (p.tempsPiece !== undefined && !(p.tempsPiece > 0)) err(`${p.id} : tempsPiece invalide`);
  if (p.machineCollege && !p.lieu.includes("labo")) err(`${p.id} : machine du collège mais lieu sans « labo »`);
  if (!p.lieu.every((l) => ["labo", "industrie"].includes(l))) err(`${p.id} : lieu inconnu`);
  if (!p.serie.every((s) => ["unitaire", "petite", "grande"].includes(s))) err(`${p.id} : série inconnue`);
}

for (const m of materiaux) {
  const q = `matériau ${m.id}`;
  for (const n of NIVEAUX) if (!m.nom?.[n]) err(`${q} : nom ${n}e manquant`);
  if (!idsFamilles.has(m.famille)) err(`${q} : famille ${m.famille} inconnue`);
  else if (!familles.find((f) => f.id === m.famille).sousFamilles["4"].includes(m.sousFamille?.["4"]))
    err(`${q} : sous-famille 4e « ${m.sousFamille?.["4"]} » absente de la famille ${m.famille}`);
  if (!m.noteFamille?.trim()) err(`${q} : noteFamille manquante (étape « Je classe »)`);
  if (!(m.masseVolumique > 0)) err(`${q} : masse volumique invalide`);
  for (const k of ["rigidite", "chocs", "usure", "eau", "corrosion"])
    if (!entier(m.notes?.[k], 1, 5)) err(`${q} : note ${k} hors 1-5`);
  if (!entier(m.cout, 1, 3)) err(`${q} : coût hors 1-3`);
  if (!entier(m.recyclage?.note, 1, 5)) err(`${q} : recyclabilité hors 1-5`);
  if (!["conducteur", "isolant"].includes(m.elec)) err(`${q} : elec invalide`);
  if (!["conducteur", "isolant"].includes(m.therm)) err(`${q} : therm invalide`);
  if (typeof m.magnetique !== "boolean") err(`${q} : magnetique doit être vrai ou faux`);
  if (!["minerai", "fossile", "renouvelable", "mixte"].includes(m.origine)) err(`${q} : origine invalide`);
  if (m.tempMax !== null && !(m.tempMax > 0)) err(`${q} : tempMax invalide`);
  if (m.absorptionEau !== null && !(m.absorptionEau >= 0)) err(`${q} : absorptionEau invalide`);
  for (const p of m.procedes) if (!idsProcedes.has(p)) err(`${q} : procédé ${p} inconnu`);
  if (m.procedes.length === 0 && !m.noteProcedes) err(`${q} : aucun procédé et pas de noteProcedes`);
  for (const a of m.aValider || []) if (champ(m, a) === undefined) err(`${q} : aValider « ${a} » ne désigne aucun champ`);
}

for (const m of materiaux) if (!(m.energieGrise > 0)) err(`matériau ${m.id} : energieGrise manquante`);

// Le mini-tableur « énergie grise » de P11 recopie ces valeurs : elles doivent rester identiques.
const tableur = join(dossier, "..", "..", "techno-p11-eau", "energie-grise.html");
if (existsSync(tableur)) {
  const html = readFileSync(tableur, "utf8");
  for (const [, id, rho, eg] of html.matchAll(/(\w+):\{nom:"[^"]+", rho:([\d.]+), eg:(\d+)\}/g)) {
    const m = materiaux.find((x) => x.id === id);
    if (!m) err(`tableur énergie grise : matériau ${id} inconnu`);
    else if (m.masseVolumique !== Number(rho) || m.energieGrise !== Number(eg)) err(`tableur énergie grise : ${id} diffère du référentiel`);
  }
  const laiton = html.match(/LAITON = \{rho:([\d.]+), eg:(\d+)\}/);
  const ml = materiaux.find((x) => x.id === "laiton");
  if (!laiton || ml.masseVolumique !== Number(laiton[1]) || ml.energieGrise !== Number(laiton[2])) err("tableur énergie grise : laiton diffère du référentiel");
}

for (const p of proprietes)
  if (champ(materiaux[0], p.champ) === undefined) err(`propriété ${p.id} : champ ${p.champ} absent des matériaux`);

const OPS = [">=", "<=", "==", "contient"];
const CONSEQUENCES = ["eau", "corrosion", "demarrage-lent", "deformation", "usure", "freinage-aimant", "cuisson-lente", "fond", "brulure", "poignee-molle"];
const essais = lire("essais.json");
const idsEssais = new Set(essais.map((e) => e.id));
for (const e of essais) {
  if (!e.lectures?.length || e.lectures.at(-1).regle) err(`essai ${e.id} : la dernière lecture doit être sans règle`);
  if (e.lectures.slice(0, -1).some((l) => !l.regle)) err(`essai ${e.id} : seule la dernière lecture peut être sans règle`);
}
const unites = composants.flatMap((sc) => sc.pieces ? sc.pieces.map((p) => scenarioPiece(sc, p.id)) : [sc]);
for (const s of unites) {
  const q = `scénario ${s.id}`;
  const NIVEAUX_S = (s.niveaux || [5, 4, 3]).map(String);
  const crit = new Map(s.criteres.map((c) => [c.id, c]));
  if (crit.size !== s.criteres.length) err(`${q} : critères en double`);
  for (const c of s.criteres) {
    if (!OPS.includes(c.regle.op)) err(`${q}/${c.id} : opérateur ${c.regle.op} inconnu`);
    if (materiaux.every((m) => champ(m, c.regle.champ) === undefined)) err(`${q}/${c.id} : champ ${c.regle.champ} inconnu`);
    if (c.consequence && !CONSEQUENCES.includes(c.consequence)) err(`${q}/${c.id} : conséquence ${c.consequence} inconnue`);
    if (c.essai && !idsEssais.has(c.essai)) err(`${q}/${c.id} : essai ${c.essai} inconnu`);
    for (const n of c.niveaux) if (!c.carte[String(n)]) err(`${q}/${c.id} : carte ${n}e manquante`);
  }
  for (const n of NIVEAUX_S) {
    const ref = s.reference[n] || {};
    for (const [id, statut] of Object.entries(ref)) {
      if (!crit.has(id)) { err(`${q} : référence ${n}e cite ${id} inconnu`); continue; }
      if (!crit.get(id).niveaux.includes(Number(n))) err(`${q} : ${id} absent du niveau ${n}e`);
      if (!["indispensable", "souhaitable", "sans"].includes(statut)) err(`${q} : statut ${statut} invalide`);
    }
    for (const c of s.criteres) if (c.niveaux.includes(Number(n)) && !ref[c.id]) err(`${q} : ${c.id} sans statut de référence en ${n}e`);
    for (const c of s.criteres)
      if (c.niveaux.includes(Number(n)) && ["indispensable", "sans"].includes(ref[c.id]) && !c.questionClassement)
        err(`${q} : ${c.id} (${ref[c.id]} en ${n}e) sans questionClassement`);
    const vis = s.materiauxVisibles[n];
    if (vis !== "tous") for (const id of vis) if (!idsMateriaux.has(id)) err(`${q} : matériau visible ${id} inconnu`);
    for (const id of [...s.reponsesAttendues[n], ...(s.elimineAttendus?.[n] || [])])
      if (!idsMateriaux.has(id)) err(`${q} : réponse ${id} inconnue`);
    for (const id of Object.keys(s.poids?.[n] || {}))
      if (ref[id] !== "souhaitable") err(`${q} : poids ${n}e sur ${id}, qui n'est pas souhaitable`);
  }
  for (const v of Object.values(s.formeProcedes || {})) if (!idsProcedes.has(v)) err(`${q} : procédé ${v} inconnu`);
  if (!s.sansProcede?.nonParceQue || !s.sansProcede?.question) err(`${q} : textes sansProcede manquants`);
  if (s.contraintes.filter((c) => c.vraie).length < 2 || s.contraintes.every((c) => c.vraie)) err(`${q} : il faut des contraintes vraies et fausses`);
  if (s.materiauPrototype && !idsMateriaux.has(s.materiauPrototype)) err(`${q} : matériau de prototype inconnu`);
}

if (erreurs.length) {
  console.error(`${erreurs.length} erreur(s) :\n- ` + erreurs.join("\n- "));
  process.exit(1);
}
console.log(`OK : ${materiaux.length} matériaux, ${procedes.length} procédés, ${composants.length} scénario(s)`);
