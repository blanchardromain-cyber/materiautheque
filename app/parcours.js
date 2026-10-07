// Parcours « Je choisis un matériau » : 5 étapes, niveau 4e en I2.
import { chargerDonnees } from "./donnees.js";
import {
  evaluer, verifierChoix, procedesCompatibles, criteresDuNiveau, materiauxVisibles, testerRegle, formaterValeur,
} from "./moteur.js";
import { fondPastille, turbineSVG, robinetCoupeSVG, consequence } from "./illustrations.js";

const CLE = "materiautheque-i2";
const ETAPES = ["J'observe", "Je définis mes critères", "Je trie", "Je choisis le procédé", "Je justifie"];
const STATUTS = [["indispensable", "Indispensable"], ["souhaitable", "Souhaitable"], ["sans", "Sans importance"]];
const NIVEAUX_ACTIFS = [4];
const GESTES = { ajout: "ajout de matière", enlevement: "enlèvement de matière", "mise-en-forme": "mise en forme", assemblage: "assemblage" };
const minuscule = (t) => t.charAt(0).toLowerCase() + t.slice(1);

let D, S; // données, scénario
let etat = nouvelEtat();
let robinetOuvert = false;

function nouvelEtat() {
  return { niveau: 4, etape: 0, max: 0, contraintes: {}, contraintesVues: false, classement: {}, justif: {},
    actifs: [], comparer: [], choix: null, essais: 0, serie: null, proto: null, texte: {} };
}

const $ = (s, r = document) => r.querySelector(s);
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const mat = (id) => D.materiaux.find((m) => m.id === id);
const nomM = (m) => m.nom[etat.niveau];
const famille = (m) => D.familles.find((f) => f.id === m.famille);
const criteres = () => criteresDuNiveau(S, etat.niveau);
const critere = (id) => S.criteres.find((c) => c.id === id);

function sauver() { try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch { /* stockage indisponible */ } }
function restaurer() {
  try { const e = JSON.parse(localStorage.getItem(CLE)); if (e && NIVEAUX_ACTIFS.includes(e.niveau)) etat = { ...nouvelEtat(), ...e }; }
  catch { /* stockage indisponible */ }
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
  n.textContent = `${etat.niveau}e · confirmé`;
  $("#etapes").innerHTML = ETAPES.map((t, i) => {
    const k = i + 1;
    const courant = etat.etape === k ? ' aria-current="step"' : "";
    return `<li><button type="button" data-aller="${k}"${courant} ${k > etat.max ? "disabled" : ""}>
      <span class="etape-num">${k}</span><span class="etape-nom">${t}</span></button></li>`;
  }).join("");
}

// ---------- Accueil ----------
function accueil() {
  return `<section class="accueil">
    <div class="accueil-texte">
      <p class="surtitre">${esc(S.sequence)}</p>
      <h1>Quel matériau pour la <em>turbine</em> du robinet automatique&nbsp;?</h1>
      <p class="chapeau">${esc(S.presentation)}</p>
      <p>Tu ne vas pas deviner : tu vas partir de ce que subit la pièce, écarter ce qui ne convient pas, puis justifier ton choix.</p>
      <fieldset class="choix-niveau">
        <legend>Mon niveau</legend>
        <button type="button" disabled>5e · débutant <small>à venir</small></button>
        <button type="button" class="actif" aria-pressed="true">4e · confirmé</button>
        <button type="button" disabled>3e · approfondi <small>à venir</small></button>
      </fieldset>
      <div class="actions">
        <button type="button" class="bouton" data-aller="1">Observer la pièce</button>
        ${etat.max ? `<button type="button" class="bouton-discret" data-action="recommencer">Recommencer depuis le début</button>` : ""}
      </div>
    </div>
    <div class="accueil-visuel">${turbineSVG({ couleur: "#F2C230" }, "Turbine")}</div>
  </section>`;
}

// ---------- Étape 1 ----------
function etape1() {
  const items = S.contraintes.map((c) => {
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
      <p class="consigne">Ouvre le robinet et regarde où se trouve la turbine. Coche ce qu'elle subit vraiment.</p>
      <figure class="cadre">${robinetCoupeSVG().replace('class="robinet"', `class="robinet${robinetOuvert ? " en-marche" : ""}"`)}
        <figcaption><button type="button" class="bouton-discret" data-action="eau" aria-pressed="${robinetOuvert}">${robinetOuvert ? "Fermer le robinet" : "Ouvrir le robinet"}</button></figcaption>
      </figure>
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
  return `<li class="carte-critere" draggable="true" data-carte="${c.id}">
    <p class="carte-critere-texte">${esc(c.carte[etat.niveau])}</p>
    <div class="segments" role="radiogroup" aria-label="Importance : ${esc(c.carte[etat.niveau])}">${radios}</div>${pourquoi}</li>`;
}

function etape2() {
  const cs = criteres();
  const pile = cs.filter((c) => !etat.classement[c.id]);
  const zone = (v, t, aide) => `<div class="zone zone-${v}" data-zone="${v}"><h3>${t}</h3><p class="aide">${aide}</p>
    <ul>${cs.filter((c) => etat.classement[c.id] === v).map(carteCritere).join("")}</ul></div>`;
  const pret = pile.length === 0 && cs.some((c) => etat.classement[c.id] === "indispensable");
  return `<section>
    <h2 tabindex="-1">2. Je définis mes critères</h2>
    <p class="consigne">Range chaque carte selon ce que tu as observé. Un critère <strong>indispensable</strong> élimine tout matériau qui ne le respecte pas ; un critère <strong>souhaitable</strong> départage ceux qui restent.</p>
    ${pile.length ? `<div class="pile"><h3>À ranger (${pile.length})</h3><ul>${pile.map(carteCritere).join("")}</ul></div>` : ""}
    <div class="zones">
      ${zone("indispensable", "Indispensable", "Sinon, le matériau est éliminé.")}
      ${zone("souhaitable", "Souhaitable", "Un plus, qui départage.")}
      ${zone("sans", "Sans importance", "Ne concerne pas cette pièce.")}
    </div>
    <div class="actions">
      <button type="button" class="bouton" data-aller="3" ${pret ? "" : "disabled"}>Trier les matériaux</button>
    </div>
    ${pret ? "" : `<p class="aide">Range toutes les cartes, dont au moins une indispensable.</p>`}
  </section>`;
}

// ---------- Étape 3 ----------
const classementActif = () => Object.fromEntries(criteres().map((c) =>
  [c.id, etat.actifs.includes(c.id) ? etat.classement[c.id] || "sans" : "sans"]));

const PROPS_CARTE = [["masseVolumique", "Masse vol."], ["notes.rigidite", "Rigidité"], ["notes.usure", "Usure"], ["notes.eau", "Eau"], ["cout", "Coût"]];

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
  const bande = r.elimine ? `<p class="bande"><span>Non, parce qu'il ${esc(r.raisons[0].texte)}</span>${r.raisons.length > 1 ? `<small>+ ${r.raisons.length - 1} autre${r.raisons.length > 2 ? "s" : ""} raison${r.raisons.length > 2 ? "s" : ""}</small>` : ""}</p>` : "";
  const points = !r.elimine && nbSouhaitables
    ? `<p class="points" aria-label="${r.score} critère(s) souhaitable(s) sur ${nbSouhaitables}">${"●".repeat(r.score)}${"○".repeat(nbSouhaitables - r.score)}</p>` : "";
  return `<li class="echantillon ${r.elimine ? "elimine" : ""} ${choisi ? "choisi" : ""}" style="--famille:${f.couleur}">
    <div class="echantillon-tete">
      <span class="pastille" style="background:${fondPastille(m.peau3D)}"></span>
      <div><p class="echantillon-nom">${esc(nomM(m))}</p><p class="echantillon-famille">${esc(m.sousFamille[etat.niveau] || f.nom[etat.niveau])}</p></div>
    </div>
    <dl class="proprietes">${PROPS_CARTE.map(([c, t]) => `<div><dt>${t}</dt><dd>${valeur(m, c)}</dd></div>`).join("")}</dl>
    ${points}${bande}
    <div class="echantillon-actions">
      <label class="case petite"><input type="checkbox" data-comparer="${m.id}" ${compare ? "checked" : ""}
        ${!compare && etat.comparer.length >= 3 ? "disabled" : ""}><span>Comparer</span></label>
      <button type="button" class="bouton-choix" data-choisir="${m.id}" aria-pressed="${choisi}">${choisi ? "Mon choix" : "Je choisis"}</button>
    </div>
  </li>`;
}

function comparateur() {
  if (etat.comparer.length < 2) return `<p class="aide">Coche « Comparer » sur 2 ou 3 matériaux pour les voir côte à côte.</p>`;
  const ms = etat.comparer.map(mat);
  const lignes = [["masseVolumique", "Masse volumique"], ["notes.rigidite", "Rigidité"], ["notes.chocs", "Chocs"],
    ["notes.usure", "Usure"], ["notes.eau", "Résistance à l'eau"], ["tempMax", "Temp. max (°C)"], ["cout", "Coût"],
    ["recyclage.note", "Recyclabilité"]];
  return `<div class="tableau-defile"><table class="comparateur"><caption>Comparaison</caption>
    <thead><tr><th scope="col">Propriété</th>${ms.map((m) => `<th scope="col">${esc(nomM(m))}</th>`).join("")}</tr></thead>
    <tbody>${lignes.map(([c, t]) => `<tr><th scope="row">${t}</th>${ms.map((m) =>
      `<td>${c === "tempMax" ? esc(m.tempMaxTexte) : c === "recyclage.note" ? `<span class="jauge" style="--n:${m.recyclage.note}"></span>` : valeur(m, c)}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
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
    </div>
    <div class="tri-grille">
      <ul class="echantillons">${ordre.map(carteMateriau).join("")}</ul>
      ${comparateur()}
    </div>
    <div class="barre-choix">
      <p>${etat.choix ? `Mon choix : <strong>${esc(nomM(mat(etat.choix)))}</strong>` : "Choisis un matériau avec « Je choisis »."}</p>
      <button type="button" class="bouton" data-action="valider-choix" ${etat.choix ? "" : "disabled"}>Valider ce matériau</button>
    </div>
  </section>`;
}

function validerChoix() {
  const v = verifierChoix(S, D.materiaux, etat.niveau, etat.choix);
  etat.essais += 1;
  sauver();
  if (v.ok) return aller(4);
  const m = mat(etat.choix);
  const premiere = v.violations[0];
  const c = consequence(premiere.consequence, m);
  const dlg = $("#consequence");
  dlg.innerHTML = `<div class="consequence ${c.classe}">
    <div class="consequence-scene">${c.svg}</div>
    <div class="consequence-texte">
      <p class="surtitre">Turbine en ${esc(nomM(m))}</p>
      <h2 id="consequence-titre">${esc(c.titre)}</h2>
      <p>${esc(c.texte)}</p>
      <p class="question"><strong>À toi :</strong> ${esc(premiere.question)}</p>
      <button type="button" class="bouton" data-action="fermer-consequence">Retourner au tri</button>
    </div></div>`;
  dlg.showModal();
}

// ---------- Étape 4 ----------
function etape4() {
  const m = mat(etat.choix);
  const liste = procedesCompatibles(m, D.procedes, S, etat.niveau);
  const proc = (id) => D.procedes.find((p) => p.id === id);
  const serieChoisie = liste.find((p) => p.id === etat.serie);
  const proto = mat(S.materiauPrototype);
  const protoListe = procedesCompatibles(proto, D.procedes, S, etat.niveau);
  const labo = liste.filter((p) => proc(p.id).lieu.includes("labo"));
  const protoChoisi = etat.proto && (labo.find((p) => p.id === etat.proto && p.compatible) || protoListe.find((p) => p.id === etat.proto && p.compatible));
  const carte = (p, groupe) => {
    const q = proc(p.id);
    const coche = etat[groupe] === p.id;
    return `<li><label class="procede ${coche ? (p.compatible || (groupe === "proto" && protoListe.find((x) => x.id === p.id)?.compatible) ? "ok" : "ko") : ""}">
      <input type="radio" name="${groupe}" data-procede="${groupe}" value="${p.id}" ${coche ? "checked" : ""}>
      <span class="procede-nom">${esc(q.nom)}</span>
      <span class="badges">${q.lieu.map((l) => `<span class="badge">${l}</span>`).join("")}<span class="badge geste">${GESTES[q.geste]}</span></span>
    </label></li>`;
  };
  let retourSerie = "";
  if (serieChoisie) retourSerie = serieChoisie.compatible
    ? `<p class="retour ok">Oui : ${esc(serieChoisie.raison)} ${serieChoisie.usage === "serie" ? "Il convient à une grande série." : "Mais il convient mal à une grande série : cherche un procédé industriel."}</p>`
    : `<p class="retour ko">Non : ${esc(serieChoisie.raison)}</p>`;
  const serieOk = serieChoisie?.compatible && serieChoisie.usage === "serie";
  let retourProto = "";
  if (etat.proto) {
    const directe = labo.find((p) => p.id === etat.proto);
    const viaProto = protoListe.find((p) => p.id === etat.proto);
    retourProto = directe?.compatible
      ? `<p class="retour ok">Oui : le prototype peut être fait directement en ${esc(nomM(m))}.</p>`
      : viaProto?.compatible
        ? `<p class="retour ok">Bonne idée, avec une adaptation : le ${esc(nomM(m))} ne se travaille pas ainsi au collège. Le prototype se fait en ${esc(nomM(proto))} (${esc(minuscule(proc(etat.proto).nom))}). Il sert à tester la forme des aubes, pas à durer dans l'eau.</p>`
        : `<p class="retour ko">Non : ${esc(directe?.raison || viaProto?.raison || "")}</p>`;
  }
  return `<section>
    <h2 tabindex="-1">4. Je choisis le procédé</h2>
    <p class="consigne">Un matériau ne va jamais sans son procédé. La turbine a des aubes fines, de forme complexe, et sera fabriquée en grande série.</p>
    <div class="deux-colonnes">
      <fieldset class="groupe-procedes"><legend>Fabrication en grande série du ${esc(nomM(m))}</legend>
        <ul>${liste.filter((p) => p.id !== "assemblage").map((p) => carte(p, "serie")).join("")}</ul>${retourSerie}</fieldset>
      <fieldset class="groupe-procedes"><legend>Prototype au labo du collège</legend>
        <ul>${labo.filter((p) => p.id !== "assemblage").map((p) => carte(p, "proto")).join("")}</ul>${retourProto}</fieldset>
    </div>
    <div class="actions">
      <button type="button" class="bouton" data-aller="5" ${serieOk && protoChoisi ? "" : "disabled"}>Justifier mon choix</button>
    </div>
  </section>`;
}

// ---------- Étape 5 ----------
function etape5() {
  const m = mat(etat.choix), f = famille(m);
  const mesCriteres = criteres().filter((c) => ["indispensable", "souhaitable"].includes(etat.classement[c.id]));
  const res = evaluer(S, D.materiaux, etat.niveau, etat.classement);
  const autres = etat.comparer.filter((id) => id !== m.id);
  const candidats = [m.id, ...(autres.length ? autres : res.filter((r) => !r.elimine && r.id !== m.id).map((r) => r.id))].slice(0, 3).map(mat);
  const elimines = res.filter((r) => r.elimine);
  const ref = evaluer(S, D.materiaux, etat.niveau, S.reference[etat.niveau]).find((r) => r.id === m.id);
  const nomProc = (id) => D.procedes.find((p) => p.id === id).nom;
  const zone = (cle, etiquette, aide) => `<label class="redaction"><span>${etiquette}</span>
    <textarea data-texte="${cle}" rows="3" placeholder="${esc(aide)}">${esc(etat.texte[cle])}</textarea></label>`;
  return `<section class="justification">
    <div class="justif-visuel">
      <figure class="cadre">${turbineSVG(m.peau3D, `Turbine en ${nomM(m)}`)}<figcaption>La turbine en <strong>${esc(nomM(m))}</strong></figcaption></figure>
      ${ref.verdict === "acceptable" ? `<p class="retour neutre">Choix possible. Ce que l'on perd avec le ${esc(nomM(m))} : ${ref.pertes.map((p) => esc(p.texte)).join(" ; ")}.</p>` : ""}
    </div>
    <div class="justif-texte">
      <h2 tabindex="-1">5. Je justifie mon choix</h2>
      <p class="impression-seule">Nom : ............................................ Classe : ........ Date : ............</p>
      <div class="tableau-defile"><table class="tableau-choix"><caption>Mon tableau de choix</caption>
        <thead><tr><th scope="col">Critère</th>${candidats.map((c) => `<th scope="col">${esc(nomM(c))}</th>`).join("")}</tr></thead>
        <tbody>${mesCriteres.map((c) => `<tr><th scope="row">${esc(c.carte[etat.niveau])}<small>${etat.classement[c.id]}</small></th>${candidats.map((x) => {
          const t = testerRegle(x, c.regle);
          return `<td class="${t.ok ? "ok" : "ko"}">${t.ok ? "oui" : "non"}</td>`;
        }).join("")}</tr>`).join("")}</tbody>
      </table></div>
      ${elimines.length ? `<h3>Matériaux éliminés</h3><ul class="elimines">${elimines.map((r) =>
        `<li><strong>${esc(nomM(mat(r.id)))}</strong> : ${r.raisons.map((x) => esc(x.texte)).join(" ; ")}</li>`).join("")}</ul>` : ""}
      <h3>Mon argumentaire</h3>
      <p class="fixe">Je choisis le <strong>${esc(nomM(m))}</strong>, un matériau de la famille des ${esc(f.nom[etat.niveau].toLowerCase())}, sous-famille : ${esc(m.sousFamille[etat.niveau].toLowerCase())}.</p>
      ${zone("parceQue", "Parce que la turbine doit…", "Cite au moins deux critères et relie-les à ce que subit la pièce.")}
      ${zone("elimination", "J'écarte… parce que…", "Explique au moins une élimination.")}
      <p class="fixe">Fabrication : <strong>${esc(minuscule(nomProc(etat.serie)))}</strong> pour la série ; prototype au labo par <strong>${esc(minuscule(nomProc(etat.proto)))}</strong>.</p>
      ${zone("recyclage", "En fin de vie, ce matériau…", "Recyclable ou non ? Pense au code de recyclage.")}
      <div class="actions ecran-seul">
        <button type="button" class="bouton" data-action="imprimer">Imprimer ou enregistrer en PDF</button>
        <button type="button" class="bouton-discret" data-action="recommencer">Recommencer</button>
      </div>
    </div>
  </section>`;
}

// ---------- Rendu et événements ----------
function rendre() {
  rendreEntete();
  const vues = [accueil, etape1, etape2, etape3, etape4, etape5];
  $("#scene").innerHTML = vues[etat.etape]();
}

function brancher() {
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.aller) return aller(Number(b.dataset.aller));
    if (b.dataset.activer) {
      const id = b.dataset.activer;
      etat.actifs = etat.actifs.includes(id) ? etat.actifs.filter((x) => x !== id) : [...etat.actifs, id];
      sauver(); return rendreGarderFocus(`[data-activer="${id}"]`);
    }
    if (b.dataset.choisir) { etat.choix = b.dataset.choisir; sauver(); return rendreGarderFocus(`[data-choisir="${etat.choix}"]`); }
    const action = b.dataset.action;
    if (action === "eau") { robinetOuvert = !robinetOuvert; rendreGarderFocus('[data-action="eau"]'); }
    if (action === "verifier-contraintes") { etat.contraintesVues = true; sauver(); rendreGarderFocus('[data-action="verifier-contraintes"]'); }
    if (action === "valider-choix") validerChoix();
    if (action === "fermer-consequence") $("#consequence").close();
    if (action === "imprimer") window.print();
    if (action === "recommencer" && confirm("Effacer ton travail et recommencer ?")) { etat = nouvelEtat(); sauver(); aller(0); }
    if (b.id === "theme") basculerTheme();
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
    if (t.dataset.comparer) {
      const id = t.dataset.comparer;
      etat.comparer = t.checked ? [...etat.comparer, id].slice(0, 3) : etat.comparer.filter((x) => x !== id);
      sauver(); rendreGarderFocus(`[data-comparer="${id}"]`);
    }
    if (t.dataset.procede) { etat[t.dataset.procede] = t.value; sauver(); rendreGarderFocus(`[name="${t.dataset.procede}"][value="${t.value}"]`); }
  });

  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.justif) { etat.justif[t.dataset.justif] = t.value; sauver(); }
    if (t.dataset.texte) { etat.texte[t.dataset.texte] = t.value; sauver(); }
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

  $("#consequence").addEventListener("close", () => { aller(3); });
}

function classer(id, statut) {
  if (!critere(id)) return;
  etat.classement[id] = statut;
  etat.actifs = etat.actifs.filter((x) => x !== id);
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
  const params = new URLSearchParams(location.search);
  S = D.composants.find((s) => s.id === (params.get("composant") || "turbine-p11")) || D.composants[0];
  restaurer();
  brancher();
  rendre();
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) navigator.serviceWorker.register("sw.js").catch(() => {});
}

demarrer();
