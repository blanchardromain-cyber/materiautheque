// Étape « Je classe » (4e et 5e) : tri libre, puis classification par l'origine de la matière, puis bilan.
import { verifierFamilles, verifierSousFamilles, croiserGroupes } from "./moteur.js";
import { objetQuotidienSVG } from "./illustrations.js";
import { ETAPE, esc, lexique } from "./commun.js";

const BOITES = ["A", "B", "C", "D"];
// Six échantillons du quotidien, les mêmes pour toutes les pièces : trois familles, et les pièges de l'aimant
// (inox ferreux non aimanté, alu non ferreux). Les noms techniques restent réservés au tri.
const ECHANTILLONS = [
  { id: "acier", nom: "Acier", objet: "une boîte de conserve" },
  { id: "inox", nom: "Inox", objet: "une cuillère" },
  { id: "alu", nom: "Aluminium", objet: "une canette" },
  { id: "bois", nom: "Bois", objet: "un crayon" },
  { id: "pehd", nom: "Plastique (PE-HD)", objet: "un bidon de lait" },
  { id: "verre", nom: "Verre", objet: "une bouteille" },
];
const IDS = ECHANTILLONS.map((x) => x.id);

export function creerClasser(ctx) {
  const D = () => ctx.D(), N = () => ctx.etat().niveau;
  const fam = (id) => D().familles.find((f) => f.id === id);
  const echantillons = () => IDS.map((id) => D().materiaux.find((m) => m.id === id));
  const nomE = (m) => ECHANTILLONS.find((x) => x.id === m.id).nom;
  const avecSous = () => N() === 4;

  function cl() {
    const e = ctx.etat();
    // Tri commencé avec l'ancienne liste d'échantillons : on repart d'un tri vide.
    if (e.classe && Object.keys(e.classe.boites).some((id) => !IDS.includes(id))) e.classe = null;
    e.classe ||= { phase: "tri", boites: {}, noms: ["", "", "", ""], familles: {}, sous: {}, essaisF: 0, essaisS: 0, vusF: false, vusS: false };
    return e.classe;
  }

  const pastille = (m) => `<span class="picto-objet" aria-hidden="true">${objetQuotidienSVG(m.id, m.peau3D)}</span>`;
  const etiquette = (m) => `<span class="ligne-nom">${esc(nomE(m))} <small>${esc(ECHANTILLONS.find((x) => x.id === m.id).objet)}</small></span>`;

  // ---------- 1. Tri libre ----------
  function tri() {
    const c = cl(), ms = echantillons();
    const utilisees = new Set(Object.values(c.boites));
    const pret = ms.every((m) => c.boites[m.id] !== undefined) && [...utilisees].every((b) => c.noms[b].trim());
    const boites = BOITES.map((l, b) => `<div class="boite-tri">
        <label><span class="boite-lettre">${l}</span><input type="text" data-cl-nom="${b}" value="${esc(c.noms[b])}" maxlength="30" placeholder="Nom du groupe ${l}" aria-label="Nom du groupe ${l}"></label>
        <ul>${ms.filter((m) => c.boites[m.id] === b).map((m) => `<li>${pastille(m)}${esc(nomE(m))}</li>`).join("") || `<li class="vide">vide</li>`}</ul>
      </div>`).join("");
    const lignes = ms.map((m) => `<li class="ligne-tri">${pastille(m)}${etiquette(m)}
        <span class="segments segments-boites" role="radiogroup" aria-label="Groupe de ${esc(nomE(m))}">${BOITES.map((l, b) =>
          `<label class="segment"><input type="radio" name="cl-${m.id}" value="${b}" data-cl-boite="${m.id}" ${c.boites[m.id] === b ? "checked" : ""}><span>${l}</span></label>`).join("")}</span></li>`).join("");
    return `<p class="consigne">Range les échantillons en groupes, avec <strong>tes propres critères</strong> (ce que tu vois, ce que tu sais). Donne un nom à chaque groupe utilisé. Il n'y a pas de mauvaise réponse ici.</p>
      <div class="boites-tri">${boites}</div>
      <ul class="lignes-tri">${lignes}</ul>
      <div class="actions"><button type="button" class="bouton" data-cl="fin-tri" ${pret ? "" : "disabled"}>J'ai fini mon tri</button></div>
      ${pret ? "" : `<p class="aide">Range tous les échantillons et nomme chaque groupe utilisé.</p>`}`;
  }

  // ---------- 2. D'où vient la matière ? ----------
  function origines() {
    const c = cl(), ms = echantillons();
    const vf = c.vusF ? verifierFamilles(D().materiaux, Object.fromEntries(ms.map((m) => [m.id, c.familles[m.id] || ""]))) : {};
    const famillesJustes = c.vusF && ms.every((m) => vf[m.id]);
    const ligne = (m) => {
      const ok = vf[m.id];
      const retour = !c.vusF ? "" : ok ? `<span class="retour ok"><strong>Exact.</strong></span>`
        : `<span class="retour ko"><strong>À revoir.</strong> ${c.essaisF >= 2 ? esc(m.noteFamille) : "Pense à la matière première, pas à l'aspect ni à l'aimant."}</span>`;
      return `<li class="ligne-origine">${pastille(m)}${etiquette(m)}
        <select data-cl-famille="${m.id}" aria-label="Origine de ${esc(nomE(m))}"><option value="">— d'où vient la matière ? —</option>${D().familles.map((f) =>
          `<option value="${f.id}" ${c.familles[m.id] === f.id ? "selected" : ""}>Elle vient ${esc(f.origine)}</option>`).join("")}</select>${retour}</li>`;
    };
    let html = `<p class="consigne">Les scientifiques classent les matériaux d'après <strong>une seule question : d'où vient la matière ?</strong> Pour chaque échantillon, choisis son origine.</p>
      <ul class="lignes-tri">${ms.map(ligne).join("")}</ul>
      <div class="actions"><button type="button" class="bouton-discret" data-cl="verifier-familles" ${ms.every((m) => c.familles[m.id]) ? "" : "disabled"}>Vérifier</button></div>`;
    if (!famillesJustes) return html;
    if (!avecSous()) return html + `<div class="actions"><button type="button" class="bouton" data-cl="bilan">Voir la classification</button></div>`;
    // 4e : les sous-familles, une fois les familles justes
    const vs = c.vusS ? verifierSousFamilles(D().materiaux, Object.fromEntries(ms.map((m) => [m.id, c.sous[m.id] || ""])), 4) : {};
    const sousJustes = c.vusS && ms.every((m) => vs[m.id]);
    const groupes = D().familles.filter((f) => ms.some((m) => m.famille === f.id)).map((f) => `<div class="groupe-sous" style="--famille:${f.couleur}">
        <h4>${esc(f.nom[4])}</h4><p class="aide">${esc(f.questionSousFamille?.["4"] || "")}</p>
        <ul class="lignes-tri">${ms.filter((m) => m.famille === f.id).map((m) => {
          const retour = !c.vusS ? "" : vs[m.id] ? `<span class="retour ok"><strong>Exact.</strong></span>`
            : `<span class="retour ko"><strong>À revoir.</strong> ${c.essaisS >= 2 ? esc(m.noteFamille) : "Relis la question de la famille."}</span>`;
          return `<li class="ligne-origine">${pastille(m)}${etiquette(m)}
            <select data-cl-sous="${m.id}" aria-label="Sous-famille de ${esc(nomE(m))}"><option value="">— sous-famille —</option>${f.sousFamilles["4"].map((sf) =>
              `<option ${c.sous[m.id] === sf ? "selected" : ""}>${esc(sf)}</option>`).join("")}</select>${retour}</li>`;
        }).join("")}</ul></div>`).join("");
    html += `<p class="retour ok"><strong>Toutes les familles sont justes.</strong> Précise maintenant la sous-famille de chaque échantillon.</p>
      <div class="groupes-sous">${groupes}</div>
      <div class="actions"><button type="button" class="bouton-discret" data-cl="verifier-sous" ${ms.every((m) => c.sous[m.id]) ? "" : "disabled"}>Vérifier les sous-familles</button>
      ${sousJustes ? `<button type="button" class="bouton" data-cl="bilan">Voir la classification</button>` : ""}</div>`;
    return html;
  }

  // ---------- 3. Bilan : mes groupes face à la classification ----------
  function bilan() {
    const c = cl(), ms = echantillons(), n = N();
    const x = croiserGroupes(D().materiaux, c.boites);
    const comparaison = Object.keys(x).sort().map((b) => {
      const fs = Object.entries(x[b]);
      const total = fs.reduce((s, [, k]) => s + k, 0);
      const ailleurs = fs.length === 1 && Object.keys(x).some((a) => a !== b && x[a][fs[0][0]]);
      const verdict = fs.length > 1 ? "plusieurs familles mélangées : ton critère n'était pas l'origine de la matière"
        : ailleurs ? `une seule famille, mais d'autres « ${esc(fam(fs[0][0]).nom[n])} » sont rangés dans un autre groupe`
        : `✓ toute la famille « ${esc(fam(fs[0][0]).nom[n])} » est réunie ici`;
      return `<tr><th scope="row">${BOITES[b]} · ${esc(c.noms[b])}</th><td>${fs.map(([f, k]) =>
        `<span class="puce-famille" style="--famille:${fam(f).couleur}">${esc(fam(f).nom[n])} × ${k}</span>`).join(" ")}</td><td>${total > 0 ? verdict : ""}</td></tr>`;
    }).join("");
    const arbre = D().familles.map((f) => {
      const ici = ms.filter((m) => m.famille === f.id);
      const contenu = n === 4
        ? f.sousFamilles["4"].map((sf) => `<li><strong>${esc(sf)}</strong> : ${ici.filter((m) => m.sousFamille["4"] === sf).map((m) => esc(nomE(m))).join(", ") || "<em>aucun échantillon ici</em>"}</li>`).join("")
        : `<li>${ici.map((m) => esc(nomE(m))).join(", ") || "<em>aucun échantillon ici</em>"}</li>`;
      return `<div class="branche" style="--famille:${f.couleur}"><h4>${esc(f.nom[n])}</h4><p class="aide">La matière vient ${esc(f.origine)}.</p><ul>${contenu}</ul></div>`;
    }).join("");
    return `<p class="consigne">Compare ton tri à la classification : as-tu groupé les échantillons selon leur origine, ou selon autre chose (couleur, poids, aspect) ?</p>
      <div class="tableau-defile"><table class="tableau-comparaison"><caption>Mes groupes face aux familles</caption><tbody>${comparaison}</tbody></table></div>
      <h3>La classification des matériaux</h3>
      <div class="arbre-familles">${arbre}</div>
      <p class="aide">Chaque famille garde sa couleur dans la suite : regarde le bord des cartes.</p>
      <div class="actions"><button type="button" class="bouton" data-aller="${ETAPE.criteres}">Définir mes critères</button></div>`;
  }

  function etape() {
    const c = cl();
    const corps = c.phase === "bilan" ? bilan() : c.phase === "origine" ? origines() : tri();
    const etapes = [["tri", "1. Mon tri"], ["origine", "2. D'où vient la matière ?"], ["bilan", "3. Le bilan"]];
    return `<section class="etape-classer">
      <h2 tabindex="-1">${ETAPE.classer}. Je classe les échantillons</h2>
      <ol class="sous-etapes">${etapes.map(([p, t]) => `<li class="${c.phase === p ? "courante" : ""}">${t}</li>`).join("")}</ol>
      ${corps}
      ${lexique(D().glossaire, N(), ["conducteur", "isolant"])}
    </section>`;
  }

  // ---------- Commandes ----------
  function brancher() {
    document.addEventListener("click", (ev) => {
      const b = ev.target.closest("button[data-cl]");
      if (!b) return;
      const c = cl(), a = b.dataset.cl;
      if (a === "fin-tri") c.phase = "origine";
      if (a === "verifier-familles") { c.vusF = true; c.essaisF++; }
      if (a === "verifier-sous") { c.vusS = true; c.essaisS++; }
      if (a === "bilan") c.phase = "bilan";
      ctx.sauver();
      ctx.rendreGarderFocus(`[data-cl="${a}"], .etape-classer h2`);
    });
    document.addEventListener("change", (ev) => {
      const t = ev.target, d = t.dataset;
      if (!(d.clBoite || d.clFamille || d.clSous)) return;
      const c = cl();
      if (d.clBoite) c.boites[d.clBoite] = Number(t.value);
      if (d.clFamille) { c.familles[d.clFamille] = t.value; c.vusF = false; }
      if (d.clSous) { c.sous[d.clSous] = t.value; c.vusS = false; }
      ctx.sauver();
      const sel = d.clBoite ? `[data-cl-boite="${d.clBoite}"][value="${t.value}"]` : d.clFamille ? `[data-cl-famille="${d.clFamille}"]` : `[data-cl-sous="${d.clSous}"]`;
      ctx.rendreGarderFocus(sel);
    });
    document.addEventListener("input", (ev) => {
      const d = ev.target.dataset;
      if (d.clNom === undefined) return;
      cl().noms[Number(d.clNom)] = ev.target.value;
      ctx.sauver();
      // pas de nouveau rendu à la frappe : on met seulement à jour le bouton
      const c = cl(), ms = echantillons(), utilisees = new Set(Object.values(c.boites));
      const pret = ms.every((m) => c.boites[m.id] !== undefined) && [...utilisees].every((x) => c.noms[x].trim());
      const btn = document.querySelector('[data-cl="fin-tri"]');
      if (btn) btn.disabled = !pret;
    });
  }

  return { etape, brancher };
}
