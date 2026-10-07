// Parcours « Je choisis un matériau » : 5 étapes, niveau 4e en I2.
import { chargerDonnees } from "./donnees.js";
import {
  evaluer, verifierChoix, procedesCompatibles, criteresDuNiveau, materiauxVisibles, testerRegle, formaterValeur, usageRequis,
  verifierClassement, verifierCoherence, verdictFinal,
} from "./moteur.js";
import { fondPastille, turbineSVG, robinetCoupeSVG, consequence, schemaProcede, casseroleSVG } from "./illustrations.js";
import {
  $, esc, minuscule, majuscule, le, du, au, ordreAuSort, lexique as lexiqueCommun,
  identiteHTML, identiteComplete, texteIdentite, formaterIdent,
} from "./commun.js";
import { creerCinquieme } from "./cinquieme.js";

// Un enregistrement par niveau : changer de niveau ne perd pas le travail de l'autre.
const CLES = { 4: "materiautheque-i2", 5: "materiautheque-5e" };
const CLE_NIVEAU = "materiautheque-niveau";
const ETAPES = ["J'observe", "Je définis mes critères", "Je trie", "Je choisis le procédé", "Je justifie"];
const STATUTS = [["indispensable", "Indispensable"], ["souhaitable", "Souhaitable"], ["sans", "Sans importance"]];
const NIVEAUX_ACTIFS = [5, 4];
const NOMS_NIVEAUX = { 5: "5e · débutant", 4: "4e · confirmé", 3: "3e · approfondi" };
const GESTES = { ajout: "ajout de matière", enlevement: "enlèvement de matière", "mise-en-forme": "mise en forme", assemblage: "assemblage" };

let D, S; // données, scénario
let etat = nouvelEtat();
let robinetOuvert = false;
let C5; // niveau 5e

function nouvelEtat(niveau = 4) {
  return { niveau, etape: 0, max: 0, contraintes: {}, contraintesVues: false, ordre: null, classement: {}, criteresVus: false, justif: {},
    actifs: [], comparer: [], choix: null, essais: 0, serie: null, proto: null, texte: {},
    familleRep: null, sousFamilleRep: null, ident: {} };
}

// Ordre des contraintes tiré au sort une fois par élève, gardé ensuite (les vraies ne doivent pas venir en tête).
function ordreContraintes() {
  const o = ordreAuSort(S.contraintes, etat.ordre);
  if (o !== etat.ordre) { etat.ordre = o; sauver(); }
  return etat.ordre.map((id) => S.contraintes.find((c) => c.id === id));
}

const lexique = (termes) => lexiqueCommun(D.glossaire, etat.niveau, termes);

function changerChoix(id) {
  etat.choix = etat.choix === id ? null : id;
  etat.serie = null;
  etat.proto = null;
  etat.max = Math.min(etat.max, 3);
  sauver();
}

const mat = (id) => D.materiaux.find((m) => m.id === id);
const nomM = (m) => m.nom[etat.niveau];
const famille = (m) => D.familles.find((f) => f.id === m.famille);
const criteres = () => criteresDuNiveau(S, etat.niveau);
const critere = (id) => S.criteres.find((c) => c.id === id);

function sauver() {
  try { localStorage.setItem(CLES[etat.niveau], JSON.stringify(etat)); localStorage.setItem(CLE_NIVEAU, String(etat.niveau)); }
  catch { /* stockage indisponible */ }
}
function charger(niveau) {
  try { const e = JSON.parse(localStorage.getItem(CLES[niveau])); if (e && e.niveau === niveau) return { ...nouvelEtat(niveau), ...e }; }
  catch { /* stockage indisponible */ }
  return nouvelEtat(niveau);
}
function restaurer() {
  let n = 4;
  try { n = Number(localStorage.getItem(CLE_NIVEAU)) || 4; } catch { /* stockage indisponible */ }
  etat = charger(NIVEAUX_ACTIFS.includes(n) ? n : 4);
}
const scenarioDuNiveau = (n) => D.composants.find((s) => (s.niveaux || [5, 4, 3]).includes(n) && (n === 5 ? s.id === "casserole" : s.id === "turbine-p11"));
function changerNiveau(n) {
  sauver();
  etat = charger(n);
  S = scenarioDuNiveau(n);
  sauver();
  rendre();
}

function aller(etape) {
  etat.etape = etape;
  etat.max = Math.max(etat.max, etape);
  sauver();
  rendre();
  $("#scene").focus();
  window.scrollTo({ top: 0 });
}

// ---------- En-tête ----------
function rendreEntete() {
  $("#piece").textContent = etat.etape ? `${S.systeme} · ${S.piece}` : "";
  const n = $("#niveau");
  n.hidden = !etat.etape;
  n.textContent = NOMS_NIVEAUX[etat.niveau];
  $("#etapes").innerHTML = (etat.niveau === 5 ? C5.titres : ETAPES).map((t, i) => {
    const k = i + 1;
    const courant = etat.etape === k ? ' aria-current="step"' : "";
    return `<li><button type="button" data-aller="${k}"${courant} ${k > etat.max ? "disabled" : ""}>
      <span class="etape-num">${k}</span><span class="etape-nom">${t}</span></button></li>`;
  }).join("");
}

// ---------- Accueil ----------
function accueil() {
  const cinq = etat.niveau === 5;
  const bouton = (n, sous) => NIVEAUX_ACTIFS.includes(n)
    ? `<button type="button" data-niveau="${n}" class="${etat.niveau === n ? "actif" : ""}" aria-pressed="${etat.niveau === n}">${NOMS_NIVEAUX[n]} <small>${sous}</small></button>`
    : `<button type="button" disabled>${NOMS_NIVEAUX[n]} <small>à venir</small></button>`;
  return `<section class="accueil">
    <div class="accueil-texte">
      <p class="surtitre">${esc(S.sequence)}</p>
      <h1>${cinq ? "Quels matériaux pour la <em>cuve</em> et la <em>poignée</em> d'une casserole&nbsp;?" : "Quel matériau pour la <em>turbine</em> du robinet automatique&nbsp;?"}</h1>
      <p class="chapeau">${esc(S.presentation)}</p>
      <p>${cinq ? "Tu vas tester des échantillons comme au laboratoire, écarter ceux qui ne conviennent pas, puis justifier tes choix." : "Tu ne vas pas deviner : tu vas partir de ce que subit la pièce, écarter ce qui ne convient pas, puis justifier ton choix."}</p>
      <fieldset class="choix-niveau">
        <legend>Mon niveau</legend>
        ${bouton(5, "la casserole")}${bouton(4, "la turbine")}${bouton(3, "")}
      </fieldset>
      <div class="actions">
        <button type="button" class="bouton" data-aller="1">Observer la pièce</button>
        ${etat.max ? `<button type="button" class="bouton-discret" data-action="recommencer">Recommencer depuis le début</button>` : ""}
      </div>
    </div>
    <div class="accueil-visuel">${cinq ? casseroleSVG({ cuve: "#F2C230", poignee: "#18222E", allumee: true }, "Casserole") : turbineSVG({ couleur: "#F2C230" }, "Turbine")}</div>
  </section>`;
}

// ---------- Étape 1 ----------
function etape1() {
  const items = ordreContraintes().map((c) => {
    const coche = !!etat.contraintes[c.id];
    const juste = coche === c.vraie;
    const retour = etat.contraintesVues
      ? `<span class="retour ${juste ? "ok" : "ko"}"><strong>${juste ? "Bien vu." : "À revoir."}</strong> ${esc(c.explication)}</span>` : "";
    return `<li><label class="case"><input type="checkbox" data-contrainte="${c.id}" ${coche ? "checked" : ""}>
      <span>${esc(c.texte)}</span></label>${retour}</li>`;
  }).join("");
  return `<section class="deux-colonnes">
    <div>
      <h2 tabindex="-1">1. J'observe la pièce</h2>
      <p class="consigne">Approche les mains du capteur et regarde où se trouve la turbine. Coche ce qu'elle subit vraiment.</p>
      <figure class="cadre">${robinetCoupeSVG().replace('class="robinet"', `class="robinet${robinetOuvert ? " en-marche" : ""}"`)}
        <figcaption><button type="button" class="bouton-discret" data-action="eau" aria-pressed="${robinetOuvert}">${robinetOuvert ? "Retirer les mains" : "Approcher les mains du capteur"}</button></figcaption>
      </figure>
      <p class="aide">Le capteur détecte les mains : l'électrovanne s'ouvre et l'eau coule. La turbine tourne alors et fait tourner l'aimant du générateur, fixé sur le même axe : c'est ce qui produit l'électricité du robinet. Mains retirées, l'eau s'arrête aussitôt.</p>
      ${lexique(["aube", "générateur", "rotor", "bobine"])}
    </div>
    <div>
      <h3>Ce que subit la turbine</h3>
      <ul class="liste-cases">${items}</ul>
      <div class="actions">
        <button type="button" class="bouton-discret" data-action="verifier-contraintes">Vérifier mes réponses</button>
        <button type="button" class="bouton" data-aller="2" ${etat.contraintesVues ? "" : "disabled"}>Définir mes critères</button>
      </div>
      ${etat.contraintesVues ? "" : `<p class="aide">Vérifie tes réponses pour passer à l'étape suivante.</p>`}
    </div>
  </section>`;
}

// ---------- Étape 2 ----------
function carteCritere(c) {
  const statut = etat.classement[c.id];
  const radios = STATUTS.map(([v, t]) => `<label class="segment"><input type="radio" name="cl-${c.id}" value="${v}"
    data-classer="${c.id}" ${statut === v ? "checked" : ""}><span>${t}</span></label>`).join("");
  const pourquoi = statut && statut !== "sans"
    ? `<label class="pourquoi"><span>Pourquoi ?</span><input type="text" data-justif="${c.id}" value="${esc(etat.justif[c.id])}"
       placeholder="Parce que la turbine…" maxlength="140"></label>` : "";
  const aRevoir = etat.criteresVus && verifierClassement(S, etat.niveau, etat.classement).find((x) => x.critere === c.id);
  const retour = aRevoir ? `<p class="retour ko"><strong>À revoir.</strong> ${esc(aRevoir.question)}</p>` : "";
  return `<li class="carte-critere ${aRevoir ? "a-revoir" : ""}" draggable="true" data-carte="${c.id}">
    <p class="carte-critere-texte">${esc(c.carte[etat.niveau])}</p>
    <div class="segments" role="radiogroup" aria-label="Importance : ${esc(c.carte[etat.niveau])}">${radios}</div>${pourquoi}${retour}</li>`;
}

function etape2() {
  const cs = criteres();
  const pile = cs.filter((c) => !etat.classement[c.id]);
  const zone = (v, t, aide) => `<div class="zone zone-${v}" data-zone="${v}"><h3>${t}</h3><p class="aide">${aide}</p>
    <ul>${cs.filter((c) => etat.classement[c.id] === v).map(carteCritere).join("")}</ul></div>`;
  const range = pile.length === 0;
  const erreurs = verifierClassement(S, etat.niveau, etat.classement);
  const juste = etat.criteresVus && erreurs.length === 0;
  const bilan = !etat.criteresVus ? "" : juste
    ? `<p class="retour ok"><strong>Tes critères tiennent compte de ce que subit la turbine.</strong> Tu peux trier les matériaux.</p>`
    : `<p class="retour ko"><strong>${erreurs.length} carte${erreurs.length > 1 ? "s" : ""} à revoir.</strong> Lis la question sous chaque carte marquée, puis vérifie à nouveau.</p>`;
  return `<section>
    <h2 tabindex="-1">2. Je définis mes critères</h2>
    <p class="consigne">Range chaque carte selon ce que tu as observé. Un critère <strong>indispensable</strong> élimine tout matériau qui ne le respecte pas ; un critère <strong>souhaitable</strong> départage ceux qui restent.</p>
    ${pile.length ? `<div class="pile"><h3>À ranger (${pile.length})</h3><ul>${pile.map(carteCritere).join("")}</ul></div>` : ""}
    <div class="zones">
      ${zone("indispensable", "Indispensable", "Sinon, le matériau est éliminé.")}
      ${zone("souhaitable", "Souhaitable", "Un plus, qui départage.")}
      ${zone("sans", "Sans importance", "Ne concerne pas cette pièce.")}
    </div>
    ${bilan}
    <div class="actions">
      <button type="button" class="bouton-discret" data-action="verifier-criteres" ${range ? "" : "disabled"}>Vérifier mes critères</button>
      <button type="button" class="bouton" data-aller="3" ${juste ? "" : "disabled"}>Trier les matériaux</button>
    </div>
    ${range ? (juste ? "" : `<p class="aide">Vérifie tes critères pour passer au tri.</p>`) : `<p class="aide">Range toutes les cartes, puis vérifie tes critères.</p>`}
  </section>`;
}

// ---------- Étape 3 ----------
const classementActif = () => Object.fromEntries(criteres().map((c) =>
  [c.id, etat.actifs.includes(c.id) ? etat.classement[c.id] || "sans" : "sans"]));

const PROPS_CARTE = [["masseVolumique", "Masse volumique"], ["notes.rigidite", "Rigidité"], ["notes.usure", "Résistance à l'usure"], ["notes.eau", "Résistance à l'eau"], ["cout", "Coût"]];

function valeur(m, champ) {
  const v = champ.split(".").reduce((o, k) => o?.[k], m);
  if (champ === "masseVolumique") return `${m.masseVolumiqueTexte || formaterValeur(v)} g/cm³`;
  if (champ === "cout") return "€".repeat(v);
  if (champ.startsWith("notes.")) return `<span class="jauge" style="--n:${v}" aria-label="${v} sur 5"></span>`;
  return esc(formaterValeur(v ?? "—"));
}

function carteMateriau(r) {
  const m = mat(r.id), f = famille(m);
  const choisi = etat.choix === m.id;
  const compare = etat.comparer.includes(m.id);
  const nbSouhaitables = etat.actifs.filter((id) => etat.classement[id] === "souhaitable").length;
  const bande = r.elimine ? `<div class="bande"><p>Non, parce qu'il :</p><ul>${r.raisons.map((x) => `<li>${esc(x.texte)}</li>`).join("")}</ul></div>` : "";
  const points = !r.elimine && nbSouhaitables
    ? `<p class="points" title="Critères souhaitables respectés" aria-label="${r.score} critère(s) souhaitable(s) respecté(s) sur ${nbSouhaitables}">${"●".repeat(r.score)}${"○".repeat(nbSouhaitables - r.score)}</p>` : "";
  const courant = m.nom["5"] !== nomM(m) ? `<span class="echantillon-courant">${esc(minuscule(m.nom["5"]))}</span>` : "";
  return `<li class="echantillon ${r.elimine ? "elimine" : ""} ${choisi ? "choisi" : ""}" style="--famille:${f.couleur}">
    <div class="echantillon-tete">
      <span class="pastille" style="background:${fondPastille(m.peau3D)}"></span>
      <div><p class="echantillon-nom">${esc(nomM(m))}</p>${courant}</div>
    </div>
    <dl class="proprietes">${PROPS_CARTE.map(([c, t]) => `<div><dt>${t}</dt><dd>${valeur(m, c)}</dd></div>`).join("")}</dl>
    ${points}${bande}
    <div class="echantillon-actions">
      <label class="case petite"><input type="checkbox" data-comparer="${m.id}" ${compare ? "checked" : ""}><span>Comparer</span></label>
      <button type="button" class="bouton-choix" data-choisir="${m.id}" aria-pressed="${choisi}">${choisi ? "✓ Mon choix · retirer" : "Je choisis"}</button>
    </div>
  </li>`;
}

function comparateur() {
  const vider = etat.comparer.length ? `<button type="button" class="bouton-discret" data-action="vider-comparaison">Vider la comparaison</button>` : "";
  if (etat.comparer.length < 2) return `<p class="aide">Coche « Comparer » sur 2 ou 3 matériaux pour les voir côte à côte (au-delà de 3, le plus ancien est retiré).</p>${vider}`;
  const ms = etat.comparer.map(mat);
  const lignes = [["masseVolumique", "Masse volumique"], ["notes.rigidite", "Rigidité"], ["notes.chocs", "Chocs"],
    ["notes.usure", "Usure"], ["notes.eau", "Résistance à l'eau"], ["tempMax", "Temp. max (°C)"], ["cout", "Coût"],
    ["recyclage.note", "Recyclabilité"]];
  return `<div class="tableau-defile"><table class="comparateur"><caption>Comparaison</caption>
    <thead><tr><th scope="col">Propriété</th>${ms.map((m) => `<th scope="col">${esc(nomM(m))}</th>`).join("")}</tr></thead>
    <tbody>${lignes.map(([c, t]) => `<tr><th scope="row">${t}</th>${ms.map((m) =>
      `<td>${c === "tempMax" ? esc(m.tempMaxTexte) : c === "recyclage.note" ? `<span class="jauge" style="--n:${m.recyclage.note}"></span>` : valeur(m, c)}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>${vider}`;
}

function etape3() {
  const res = evaluer(S, D.materiaux, etat.niveau, classementActif());
  const parId = Object.fromEntries(res.map((r) => [r.id, r]));
  const ordre = materiauxVisibles(S, D.materiaux, etat.niveau).map((m) => parId[m.id]);
  const mesCriteres = criteres().filter((c) => ["indispensable", "souhaitable"].includes(etat.classement[c.id]))
    .sort((a, b) => (etat.classement[a.id] === "indispensable" ? 0 : 1) - (etat.classement[b.id] === "indispensable" ? 0 : 1));
  const restants = res.filter((r) => !r.elimine).length;
  return `<section class="tri">
    <div class="tri-criteres">
      <h2 tabindex="-1">3. Je trie</h2>
      <p class="consigne">Active tes critères un par un et regarde quels matériaux tombent.</p>
      <ul class="interrupteurs">${mesCriteres.map((c) => `<li><button type="button" class="interrupteur ${etat.classement[c.id]}"
        data-activer="${c.id}" aria-pressed="${etat.actifs.includes(c.id)}"><span class="voyant"></span>
        <span>${esc(c.carte[etat.niveau])}</span><small>${etat.classement[c.id]}</small></button></li>`).join("")}</ul>
      <p class="compteur" aria-live="polite"><strong>${restants}</strong> matériau${restants > 1 ? "x" : ""} sur ${res.length} encore en lice</p>
      ${restants === 0 ? `<p class="retour neutre">Plus aucun matériau ne passe. Un de tes critères indispensables l'est-il vraiment ? Relis ce que subit la turbine, puis reviens à l'étape 2 si besoin.</p>` : ""}
      <p class="aide">● = un critère souhaitable respecté ; ○ = un critère souhaitable manqué.</p>
      ${lexique(["masse volumique", "rigide", "usure", "critère indispensable", "critère souhaitable"])}
    </div>
    <div class="tri-grille">
      <ul class="echantillons">${ordre.map(carteMateriau).join("")}</ul>
      ${comparateur()}
    </div>
    <div class="barre-choix">
      <p>${etat.choix ? `Mon choix : <strong>${esc(nomM(mat(etat.choix)))}</strong>` : "Choisis un matériau avec « Je choisis »."}</p>
      ${etat.choix ? `<button type="button" class="bouton-discret" data-choisir="${etat.choix}">Retirer</button>` : ""}
      <button type="button" class="bouton" data-action="valider-choix" ${etat.choix ? "" : "disabled"}>Valider ce matériau</button>
    </div>
  </section>`;
}

function validerChoix() {
  // Rendez-vous 2 : le choix doit respecter tous les critères indispensables de l'élève, puis la référence et la fabrication.
  const propres = verifierCoherence(S, D.materiaux, etat.niveau, etat.classement, etat.choix);
  const ref = verifierChoix(S, D.materiaux, etat.niveau, etat.choix, D.procedes).violations
    .filter((x) => !propres.some((p) => p.critere === x.critere));
  const violations = [...propres, ...ref];
  etat.essais += 1;
  sauver();
  if (!violations.length) return aller(4);
  const m = mat(etat.choix);
  const premiere = violations.find((x) => x.consequence) || violations[0];
  const dlg = $("#consequence");
  if (premiere.consequence) {
    const c = consequence(premiere.consequence, m);
    dlg.innerHTML = `<div class="consequence ${c.classe}">
      <div class="consequence-scene">${c.svg}</div>
      <div class="consequence-texte">
        <p class="surtitre">Turbine en ${esc(nomM(m))}</p>
        <h2 id="consequence-titre">${esc(c.titre)}</h2>
        <p>${esc(c.texte)}</p>
        <p class="question"><strong>À toi :</strong> ${esc(premiere.question)}</p>
        <button type="button" class="bouton" data-action="fermer-consequence">Retourner au tri</button>
      </div></div>`;
  } else {
    const carte = critere(premiere.critere)?.carte[etat.niveau] || "";
    dlg.innerHTML = `<div class="consequence">
      <div class="consequence-scene">${turbineSVG(m.peau3D, `Turbine en ${nomM(m)}`)}</div>
      <div class="consequence-texte">
        <p class="surtitre">Turbine en ${esc(nomM(m))}</p>
        <h2 id="consequence-titre">Ce matériau n'est plus en lice</h2>
        <p>Il ne respecte pas ton critère indispensable « ${esc(carte)} » : il ${esc(premiere.texte)}.</p>
        <p class="question"><strong>À toi :</strong> active tous tes critères et choisis un matériau encore en lice.</p>
        <button type="button" class="bouton" data-action="fermer-consequence">Retourner au tri</button>
      </div></div>`;
  }
  dlg.showModal();
}

// ---------- Étape 4 ----------
// Durée de fabrication de toute la série, en mots d'élève.
function dureeTexte(secondes) {
  const h = secondes / 3600, j = h / 24;
  if (h < 48) return `environ ${Math.max(1, Math.round(h))} heure${Math.round(h) > 1 ? "s" : ""}`;
  if (j < 60) return `environ ${Math.round(j)} jours sans arrêt`;
  return `environ ${Math.round(j / 30)} mois sans arrêt`;
}

const PICTO_GESTE = { ajout: "＋", enlevement: "－", "mise-en-forme": "↻", assemblage: "⧉" };

function puces(q) {
  const lieux = q.lieu.map((l) => l === "labo"
    ? `<span class="puce puce-college">au collège</span>`
    : `<span class="puce puce-industrie">dans l'industrie</span>`).join("");
  return `<p class="puces">${lieux}<span class="puce puce-geste">${PICTO_GESTE[q.geste]} ${GESTES[q.geste]}</span></p>`;
}

function etape4() {
  const m = mat(etat.choix);
  const proc = (id) => D.procedes.find((p) => p.id === id);
  const N = S.quantiteSerie || 10000;
  const nombre = N.toLocaleString("fr-FR");
  const liste = procedesCompatibles(m, D.procedes, S, etat.niveau).filter((p) => p.id !== "assemblage");
  const proto = mat(S.materiauPrototype);
  const protoListe = procedesCompatibles(proto, D.procedes, S, etat.niveau);
  const fabricable = liste.some((p) => p.compatible && p.usage === usageRequis(etat.niveau));

  // Question 1 : la série
  const retourSerie = (p) => {
    const q = proc(p.id);
    const duree = q.tempsPiece ? ` Environ ${q.tempsPiece < 120 ? `${q.tempsPiece} secondes` : `${Math.round(q.tempsPiece / 60)} minutes`} par pièce : ${nombre} turbines en ${dureeTexte(q.tempsPiece * N)}.` : "";
    if (p.compatible && p.usage === "serie") return { ok: true, html: `<strong>Oui.</strong> ${esc(p.raison)}${esc(duree)}` };
    if (p.compatible) return { ok: false, html: `<strong>Pas pour ${nombre} pièces.</strong> On peut obtenir une turbine en ${esc(nomM(m))} ainsi, mais une pièce à la fois.${esc(duree)} ${q.lieu.includes("industrie") ? "Dans l'industrie, ce procédé sert surtout aux prototypes et aux petites séries." : ""}` };
    return { ok: false, html: `<strong>Non.</strong> ${esc(p.raison)}` };
  };
  const s = liste.find((p) => p.id === etat.serie);
  const serieOk = !!s && retourSerie(s).ok;

  // Question 2 : le prototype au collège, dans le matériau choisi ou dans le matériau de prototype du scénario
  const retourProto = (id) => {
    const directe = liste.find((p) => p.id === id);
    const via = protoListe.find((p) => p.id === id);
    if (directe?.compatible) return { ok: true, html: `<strong>Oui.</strong> La turbine d'essai peut être faite directement en ${esc(nomM(m))}.` };
    if (via?.compatible) return { ok: true, html: `<strong>Oui, avec une adaptation.</strong> Au collège, on ne peut pas travailler ${esc(le(nomM(m)))} ainsi : la turbine d'essai se fait en ${esc(nomM(proto))}. Elle sert à tester la forme des aubes, pas à durer dans l'eau.` };
    return { ok: false, html: `<strong>Non.</strong> ${esc(directe?.raison || via?.raison || "")}` };
  };
  const protoOk = !!etat.proto && retourProto(etat.proto).ok;

  const fiche = (p, groupe) => {
    const q = proc(p.id);
    const choisi = etat[groupe] === p.id;
    const r = choisi ? (groupe === "serie" ? retourSerie(p) : retourProto(p.id)) : null;
    const libelle = groupe === "serie" ? `Pour les ${nombre} turbines` : "Pour la turbine d'essai";
    return `<li class="fiche-procede ${choisi ? (r.ok ? "retenu ok" : "retenu ko") : ""}">
      <figure class="fiche-media">${schemaProcede(q.id, q.nom)}${q.machineCollege && groupe === "proto" ? `<figcaption>${esc(majuscule(q.machineCollege))}</figcaption>` : ""}</figure>
      <div class="fiche-corps">
        <h3>${esc(q.nom)}</h3>
        <p>${esc(q.principe)}</p>
        ${puces(q)}
        <div class="fiche-actions">
          <button type="button" class="bouton-choix" data-procede="${groupe}" data-valeur="${p.id}" aria-pressed="${choisi}">${choisi ? `✓ ${libelle} · retirer` : libelle}</button>
        </div>
        ${r ? `<p class="retour ${r.ok ? "ok" : "ko"}" role="status">${r.html}</p>` : ""}
      </div>
    </li>`;
  };

  const machines = liste.filter((p) => proc(p.id).machineCollege);
  const impasse = fabricable ? "" : `<div class="retour ko"><strong>Aucun procédé de grande série ne convient ${esc(au(nomM(m)))} pour des aubes fines.</strong> C'est un indice : retourne au tri et choisis un autre matériau.
      <div class="actions"><button type="button" class="bouton" data-aller="3">Retourner au tri</button></div></div>`;
  const etat1 = !etat.serie ? "à choisir" : serieOk ? `✓ ${minuscule(proc(etat.serie).nom)}` : "✗ à revoir";
  const etat2 = !etat.proto ? "à choisir" : protoOk ? `✓ ${proc(etat.proto).machineCollege}` : "✗ à revoir";

  return `<section class="etape-procedes">
    <h2 tabindex="-1">4. Je choisis le procédé</h2>
    <p class="consigne">Un matériau ne va jamais sans son procédé. La turbine a des aubes fines, de forme complexe. Réponds à deux questions : comment en fabriquer <strong>${nombre}</strong> pour les vendre, et comment en fabriquer <strong>une seule</strong> au collège pour l'essayer.</p>
    ${impasse}
    <h3 class="question-procede"><span>1</span> Fabriquer ${nombre} turbines en ${esc(nomM(m))} : quel procédé ?</h3>
    <ul class="galerie-procedes">${liste.map((p) => fiche(p, "serie")).join("")}</ul>
    <h3 class="question-procede"><span>2</span> Fabriquer une turbine d'essai au collège : quelle machine ?</h3>
    <ul class="galerie-procedes">${machines.map((p) => fiche(p, "proto")).join("")}</ul>
    <div class="barre-choix barre-procedes">
      <p><span>Série : <strong class="${serieOk ? "ok" : etat.serie ? "ko" : ""}">${esc(etat1)}</strong></span>
         <span>Essai au collège : <strong class="${protoOk ? "ok" : etat.proto ? "ko" : ""}">${esc(etat2)}</strong></span></p>
      <button type="button" class="bouton-discret" data-aller="3">Revenir au tri</button>
      <button type="button" class="bouton" data-aller="5" ${serieOk && protoOk ? "" : "disabled"}>Justifier mon choix</button>
    </div>
  </section>`;
}

// ---------- Étape 5 ----------
// Identification de la famille par l'élève (grille 7.3 : « nomme le matériau et sa famille »)
function retourFamille(m, f) {
  if (!etat.familleRep || !etat.sousFamilleRep) return "";
  const bonneFamille = etat.familleRep === f.id;
  const bonneSous = etat.sousFamilleRep === m.sousFamille[etat.niveau];
  if (bonneFamille && bonneSous) return `<p class="retour ok"><strong>Exact.</strong></p>`;
  if (!bonneFamille) return `<p class="retour ko"><strong>À revoir.</strong> Pense aux objets faits dans ce matériau : ${esc(m.exemples.join(", "))}. Est-ce un métal, un bois, un plastique, un verre, un mélange de matériaux ?</p>`;
  return `<p class="retour ko"><strong>Bonne famille, sous-famille à revoir.</strong> Ce matériau existe-t-il tel quel dans la nature, ou est-il fabriqué ?</p>`;
}

const pretAImprimer = () => !!(etat.familleRep && etat.sousFamilleRep && identiteComplete(etat.ident));
const AIDE_IMPRESSION = "Pour imprimer : choisis la famille et la sous-famille, puis écris le prénom, le nom (et ceux de l'élève 2 en binôme) et la classe.";

function majImpression() {
  const b = $('[data-action="imprimer"]');
  if (b) b.disabled = !pretAImprimer();
  const a = $("#aide-impression");
  if (a) a.textContent = pretAImprimer() ? "" : AIDE_IMPRESSION;
  const e = $(".entete-impression");
  if (e) e.textContent = texteIdentite(etat.ident);
}

function etape5() {
  const m = mat(etat.choix), f = famille(m);
  const mesCriteres = criteres().filter((c) => ["indispensable", "souhaitable"].includes(etat.classement[c.id]));
  const res = evaluer(S, D.materiaux, etat.niveau, etat.classement);
  const autres = etat.comparer.filter((id) => id !== m.id);
  const candidats = [m.id, ...(autres.length ? autres : res.filter((r) => !r.elimine && r.id !== m.id).map((r) => r.id))].slice(0, 3).map(mat);
  const elimines = res.filter((r) => r.elimine && r.id !== m.id);
  // Rendez-vous 3 : verdict selon la référence, sans nommer le meilleur compromis.
  const v = verdictFinal(S, D.materiaux, etat.niveau, m.id);
  const cartes = (ids) => ids.map((id) => `« ${esc(critere(id).carte[etat.niveau])} »`).join(", ");
  const verdict = v.niveau === "meilleur"
    ? `<div class="verdict meilleur"><p><strong>Meilleur compromis.</strong> ${esc(majuscule(le(nomM(m))))} respecte tous les critères indispensables et satisfait le plus de critères souhaitables. À toi de le justifier.</p></div>`
    : `<div class="verdict acceptable"><p><strong>Choix acceptable.</strong> ${esc(majuscule(le(nomM(m))))} respecte tous les critères indispensables, mais il ${v.pertes.map((p) => esc(p.texte)).join(" ; il ")}.</p>
        ${v.mieux.length ? `<p>Un autre matériau encore en lice fait mieux sur ${cartes(v.mieux)}. Explique pourquoi tu acceptes ce compromis, ou retourne au tri pour le trouver.</p>` : ""}
        <div class="actions ecran-seul"><button type="button" class="bouton-discret" data-aller="3">Retourner au tri</button></div></div>`;
  const nomProc = (id) => D.procedes.find((p) => p.id === id).nom;
  const protoDirect = procedesCompatibles(m, D.procedes, S, etat.niveau).find((p) => p.id === etat.proto)?.compatible;
  const matProto = protoDirect ? m : mat(S.materiauPrototype);
  const zone = (cle, etiquette, aide) => `<label class="redaction"><span>${etiquette}</span>
    <textarea data-texte="${cle}" rows="3" placeholder="${esc(aide)}">${esc(etat.texte[cle])}</textarea></label>`;
  return `<section class="justification">
    <div class="justif-visuel">
      <figure class="cadre">${turbineSVG(m.peau3D, `Turbine en ${nomM(m)}`)}<figcaption>La turbine en <strong>${esc(nomM(m))}</strong></figcaption></figure>
    </div>
    <div class="justif-texte">
      <h2 tabindex="-1">5. Je justifie mon choix</h2>
      ${verdict}
      <p class="impression-seule entete-impression">${esc(texteIdentite(etat.ident))}</p>
      <div class="tableau-defile"><table class="tableau-choix"><caption>Mon tableau de choix</caption>
        <thead><tr><th scope="col">Critère</th>${candidats.map((c) => `<th scope="col">${esc(nomM(c))}</th>`).join("")}</tr></thead>
        <tbody>${mesCriteres.map((c) => `<tr><th scope="row">${esc(c.carte[etat.niveau])}<small>${etat.classement[c.id]}</small></th>${candidats.map((x) => {
          const t = testerRegle(x, c.regle);
          return `<td class="${t.ok ? "ok" : "ko"}">${t.ok ? "oui" : "non"}</td>`;
        }).join("")}</tr>`).join("")}</tbody>
      </table></div>
      ${elimines.length ? `<h3>Matériaux écartés par mes critères indispensables</h3><ul class="elimines">${elimines.map((r) =>
        `<li><strong>${esc(nomM(mat(r.id)))}</strong> : ${r.raisons.map((x) => esc(x.texte)).join(" ; ")}</li>`).join("")}</ul>` : ""}
      <h3>Mon argumentaire</h3>
      <div class="fixe phrase-famille">Je choisis <strong>${esc(le(nomM(m)))}</strong>, un matériau de la famille des
        <select data-reponse="famille" aria-label="Famille du matériau"><option value="">— choisis —</option>${D.familles.map((x) =>
          `<option value="${x.id}" ${etat.familleRep === x.id ? "selected" : ""}>${esc(x.nom[etat.niveau].toLowerCase())}</option>`).join("")}</select>,
        sous-famille : <select data-reponse="sousFamille" aria-label="Sous-famille du matériau" ${etat.familleRep ? "" : "disabled"}><option value="">— choisis —</option>${
          (D.familles.find((x) => x.id === etat.familleRep)?.sousFamilles[etat.niveau] || []).map((sf) =>
          `<option ${etat.sousFamilleRep === sf ? "selected" : ""}>${esc(sf)}</option>`).join("")}</select>.
        ${retourFamille(m, f)}</div>
      ${zone("parceQue", "Parce que la turbine doit…", "Cite au moins deux critères et relie-les à ce que subit la pièce.")}
      ${zone("elimination", "J'écarte… parce que…", "Explique au moins une élimination.")}
      <p class="fixe">Fabrication : <strong>${esc(minuscule(nomProc(etat.serie)))}</strong> pour la série ; prototype au collège par <strong>${esc(minuscule(nomProc(etat.proto)))}</strong>, en ${esc(nomM(matProto))}.</p>
      ${zone("recyclage", "En fin de vie, ce matériau…", "Recyclable ou non ? Pense au code de recyclage.")}
      ${identiteHTML(etat.ident, "data-ident")}
      <div class="actions ecran-seul">
        <button type="button" class="bouton" data-action="imprimer" ${pretAImprimer() ? "" : "disabled"}>Imprimer ou enregistrer en PDF</button>
        <button type="button" class="bouton-discret" data-action="recommencer">Recommencer</button>
      </div>
      <p class="aide ecran-seul" id="aide-impression">${pretAImprimer() ? "" : AIDE_IMPRESSION}</p>
    </div>
  </section>`;
}

// ---------- Rendu et événements ----------
function rendre() {
  rendreEntete();
  const vues = etat.niveau === 5 ? [accueil, ...C5.etapes] : [accueil, etape1, etape2, etape3, etape4, etape5];
  $("#scene").innerHTML = vues[etat.etape]();
}

function brancher() {
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.aller !== undefined) return aller(Number(b.dataset.aller));
    if (b.dataset.niveau) return changerNiveau(Number(b.dataset.niveau));
    if (b.id === "theme") return basculerTheme();
    if (etat.niveau === 5) return; // les commandes de la 5e sont gérées par cinquieme.js
    if (b.dataset.activer) {
      const id = b.dataset.activer;
      etat.actifs = etat.actifs.includes(id) ? etat.actifs.filter((x) => x !== id) : [...etat.actifs, id];
      sauver(); return rendreGarderFocus(`[data-activer="${id}"]`);
    }
    if (b.dataset.choisir) { const id = b.dataset.choisir; changerChoix(id); return rendreGarderFocus(`.echantillon [data-choisir="${id}"]`); }
    if (b.dataset.procede) {
      const g = b.dataset.procede, v = b.dataset.valeur;
      etat[g] = etat[g] === v ? null : v;
      etat.max = Math.min(etat.max, 4);
      sauver(); return rendreGarderFocus(`[data-procede="${g}"][data-valeur="${v}"]`);
    }
    const action = b.dataset.action;
    if (action === "eau") { robinetOuvert = !robinetOuvert; rendreGarderFocus('[data-action="eau"]'); }
    if (action === "verifier-criteres") { etat.criteresVus = true; sauver(); rendreGarderFocus('[data-action="verifier-criteres"]'); }
    if (action === "vider-comparaison") { etat.comparer = []; sauver(); rendreGarderFocus(".tri-grille"); }
    if (action === "verifier-contraintes") { etat.contraintesVues = true; sauver(); rendreGarderFocus('[data-action="verifier-contraintes"]'); }
    if (action === "valider-choix") validerChoix();
    if (action === "fermer-consequence") $("#consequence").close();
    if (action === "imprimer") window.print();
    if (action === "recommencer" && confirm("Effacer ton travail et recommencer ?")) { etat = nouvelEtat(etat.niveau); sauver(); aller(0); }
  });

  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.contrainte) {
      etat.contraintes[t.dataset.contrainte] = t.checked;
      const avait = etat.contraintesVues;
      etat.contraintesVues = false;
      sauver();
      if (avait) rendreGarderFocus(`[data-contrainte="${t.dataset.contrainte}"]`);
    }
    if (t.dataset.classer) classer(t.dataset.classer, t.value);
    if (t.dataset.ident === "binome") { etat.ident = { ...etat.ident, binome: t.checked }; sauver(); rendreGarderFocus('[data-ident="binome"]'); }
    if (t.dataset.reponse) {
      if (t.dataset.reponse === "famille") { etat.familleRep = t.value || null; etat.sousFamilleRep = null; }
      else etat.sousFamilleRep = t.value || null;
      sauver(); rendreGarderFocus(`[data-reponse="${t.dataset.reponse}"]`);
    }
    if (t.dataset.comparer) {
      const id = t.dataset.comparer;
      etat.comparer = t.checked ? [...etat.comparer, id].slice(-3) : etat.comparer.filter((x) => x !== id);
      sauver(); rendreGarderFocus(`[data-comparer="${id}"]`);
    }
  });

  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.justif) { etat.justif[t.dataset.justif] = t.value; sauver(); }
    if (t.dataset.texte) { etat.texte[t.dataset.texte] = t.value; sauver(); }
    if (t.dataset.ident && t.type === "text") {
      t.value = formaterIdent(t.dataset.ident, t.value);
      etat.ident = { ...etat.ident, [t.dataset.ident]: t.value }; sauver(); majImpression();
    }
  });

  // Glisser-déposer (souris) : complément des boutons, qui restent la voie principale.
  document.addEventListener("dragstart", (e) => {
    const c = e.target.closest?.("[data-carte]");
    if (c) e.dataTransfer.setData("text/plain", c.dataset.carte);
  });
  document.addEventListener("dragover", (e) => { if (e.target.closest?.("[data-zone]")) e.preventDefault(); });
  document.addEventListener("drop", (e) => {
    const z = e.target.closest?.("[data-zone]");
    if (!z) return;
    e.preventDefault();
    classer(e.dataTransfer.getData("text/plain"), z.dataset.zone);
  });
}

function classer(id, statut) {
  if (!critere(id)) return;
  etat.classement[id] = statut;
  etat.criteresVus = false;
  etat.actifs = etat.actifs.filter((x) => x !== id);
  etat.max = Math.min(etat.max, 2);
  sauver();
  rendreGarderFocus(`[data-classer="${id}"][value="${statut}"]`);
}

function rendreGarderFocus(selecteur) {
  rendre();
  $(selecteur)?.focus();
}

function basculerTheme() {
  const r = document.documentElement;
  const sombre = !(r.dataset.theme === "dark" || (!r.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches));
  r.dataset.theme = sombre ? "dark" : "light";
  try { localStorage.setItem("materiautheque-theme", r.dataset.theme); } catch { /* stockage indisponible */ }
  majBoutonTheme();
}
function majBoutonTheme() {
  const r = document.documentElement;
  const sombre = r.dataset.theme === "dark" || (!r.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
  $("#theme").setAttribute("aria-pressed", sombre);
  $("#theme").textContent = sombre ? "Thème clair" : "Thème sombre";
}

async function demarrer() {
  try { const t = localStorage.getItem("materiautheque-theme"); if (t) document.documentElement.dataset.theme = t; } catch { /* rien */ }
  majBoutonTheme();
  try {
    D = await chargerDonnees();
  } catch (err) {
    $("#scene").innerHTML = `<p class="retour ko">Les données n'ont pas pu être chargées : ${esc(err.message)}. Ouvre l'application par son adresse web, pas en double-cliquant sur le fichier.</p>`;
    return;
  }
  restaurer();
  const n = Number(new URLSearchParams(location.search).get("niveau"));
  if (NIVEAUX_ACTIFS.includes(n) && n !== etat.niveau) etat = charger(n);
  S = scenarioDuNiveau(etat.niveau);
  C5 = creerCinquieme({
    etat: () => etat, D: () => D, S: () => S, sauver, aller, rendre, rendreGarderFocus,
    nouvelEtat: () => { etat = nouvelEtat(5); return etat; },
  });
  brancher();
  C5.brancher();
  rendre();
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) navigator.serviceWorker.register("sw.js").catch(() => {});
}

demarrer();
