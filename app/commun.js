// Outils d'affichage partagés par les niveaux.
export const $ = (s, r = document) => r.querySelector(s);
export const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
export const minuscule = (t) => t.charAt(0).toLowerCase() + t.slice(1);
export const majuscule = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const VOYELLE = /^[aeiouyhéèêàâîôûAEIOUYHÉÈÊ]/;
export const le = (n) => (VOYELLE.test(n) ? `l'${n}` : `le ${n}`);
export const du = (n) => (VOYELLE.test(n) ? `de l'${n}` : `du ${n}`);
export const au = (n) => (VOYELLE.test(n) ? `à l'${n}` : `au ${n}`);

// Ordre tiré au sort une fois, gardé ensuite ; jamais plus de 2 « vraies » dans les 3 premières.
export function ordreAuSort(contraintes, ordreActuel) {
  const ids = contraintes.map((c) => c.id);
  if (ordreActuel && ordreActuel.length === ids.length && ids.every((id) => ordreActuel.includes(id))) return ordreActuel;
  const vraie = (id) => contraintes.find((c) => c.id === id).vraie;
  let o;
  do {
    o = [...ids];
    for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
  } while (o.length > 3 && o.slice(0, 3).filter(vraie).length > 2);
  return o;
}

// ---------- Identification pour l'impression (seul ou en binôme) ----------
export const formaterNom = (v) => v.toLocaleUpperCase("fr-FR");
// Première lettre en majuscule, y compris après un trait d'union ou une espace : « jean-pierre » → « Jean-Pierre »
export const formaterPrenom = (v) => v.toLocaleLowerCase("fr-FR").replace(/(^|[\s-])(\p{L})/gu, (_, a, b) => a + b.toLocaleUpperCase("fr-FR"));
export const formaterIdent = (cle, v) => (cle.startsWith("nom") ? formaterNom(v) : cle.startsWith("prenom") ? formaterPrenom(v) : v);

const rempli = (v) => !!(v && v.trim());
export const identiteComplete = (i) => rempli(i.prenom) && rempli(i.nom) && rempli(i.classe)
  && (!i.binome || (rempli(i.prenom2) && rempli(i.nom2)));

export function texteIdentite(i) {
  const e1 = `${formaterPrenom(i.prenom || "")} ${formaterNom(i.nom || "")}`.trim();
  const e2 = i.binome ? `${formaterPrenom(i.prenom2 || "")} ${formaterNom(i.nom2 || "")}`.trim() : "";
  return `${e2 ? `${e1} et ${e2}` : e1} · ${i.classe || ""} · ${new Date().toLocaleDateString("fr-FR")}`;
}

// attr : nom de l'attribut de données qui porte la clé (« data-ident » en 4e, « data-c5-ident » en 5e)
export function identiteHTML(i, attr) {
  const champ = (cle, libelle, place) => `<label>${libelle}<input type="text" ${attr}="${cle}" value="${esc(formaterIdent(cle, i[cle] || ""))}" autocomplete="off" maxlength="40" placeholder="${place}"></label>`;
  return `<fieldset class="identite ecran-seul"><legend>Pour imprimer la fiche</legend>
    ${champ("prenom", "Prénom", "Léa")}${champ("nom", "Nom", "MARTIN")}${champ("classe", "Classe", "4e B")}
    <label class="case binome"><input type="checkbox" ${attr}="binome" ${i.binome ? "checked" : ""}><span>Nous travaillons en binôme</span></label>
    ${i.binome ? `${champ("prenom2", "Prénom (élève 2)", "Tom")}${champ("nom2", "Nom (élève 2)", "DUPONT")}` : ""}
    <p class="aide">Ces informations restent sur cet ordinateur et s'effacent avec « Recommencer ».</p>
  </fieldset>`;
}

// ---------- Enregistrement en PDF (sans passer par l'impression) ----------
const HTML2PDF = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
function chargerScript(src) {
  if (window.html2pdf) return Promise.resolve();
  return new Promise((ok, ko) => {
    const s = document.createElement("script");
    s.src = src; s.onload = ok; s.onerror = () => ko(new Error("bibliothèque PDF indisponible"));
    document.head.appendChild(s);
  });
}

const sansAccents = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9-]+/g, "-").replace(/^-|-$/g, "");
export function nomFichierPDF(niveau, i) {
  const eleves = [[i.nom, i.prenom], i.binome ? [i.nom2, i.prenom2] : null].filter(Boolean)
    .map(([n, p]) => `${formaterNom(n || "")}-${formaterPrenom(p || "")}`).join("_");
  return `Materiautheque-${niveau}e-${sansAccents(eleves) || "eleve"}.pdf`;
}

// Copie statique de l'écran : saisies → texte, boutons et éléments « écran seul » retirés.
export function copieStatique(racine) {
  const c = racine.cloneNode(true);
  const vraies = racine.querySelectorAll("textarea, select, input");
  c.querySelectorAll("textarea, select, input").forEach((el, k) => {
    const src = vraies[k];
    let html = "";
    if (src.tagName === "TEXTAREA") html = `<p class="pdf-saisie">${esc(src.value.trim() || "—")}</p>`;
    else if (src.tagName === "SELECT") html = `<strong class="pdf-choix">${esc(src.selectedOptions[0]?.value ? src.selectedOptions[0].textContent : "…")}</strong>`;
    else if (src.type === "text") html = `<strong>${esc(src.value)}</strong>`;
    el.outerHTML = html;
  });
  c.querySelectorAll(".ecran-seul, .impression-seule, button, .lexique").forEach((el) => el.remove());
  // Les dessins SVG passent en images : l'outil de capture les rend mal tels quels.
  const svgs = racine.querySelectorAll("svg");
  c.querySelectorAll("svg").forEach((svg, k) => {
    const r = svgs[k].getBoundingClientRect();
    const img = document.createElement("img");
    // Les couleurs viennent de la feuille de style : on les recopie dans le dessin, sinon tout sort en noir.
    const copie = svgs[k].cloneNode(true);
    const orig = [svgs[k], ...svgs[k].querySelectorAll("*")], dest = [copie, ...copie.querySelectorAll("*")];
    orig.forEach((o, n) => {
      const st = getComputedStyle(o);
      dest[n].setAttribute("style", ["fill", "stroke", "stroke-width", "opacity", "fill-opacity", "stroke-dasharray", "font-size", "font-weight", "font-family"]
        .map((p) => `${p}:${st.getPropertyValue(p)}`).join(";"));
    });
    let code = new XMLSerializer().serializeToString(copie);
    if (!code.includes("xmlns=")) code = code.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
    code = code.replace("<svg ", `<svg width="${Math.round(r.width)}" height="${Math.round(r.height)}" `);
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(code);
    img.alt = svg.getAttribute("aria-label") || "";
    img.style.width = `${Math.round(r.width)}px`;
    img.style.maxWidth = "100%";
    svg.replaceWith(img);
  });
  return c;
}

export async function enregistrerPDF({ entete, ident, contenu, fichier }) {
  await chargerScript(HTML2PDF);
  const page = document.createElement("div");
  page.className = "pdf-page";
  page.innerHTML = `<header class="pdf-entete">
      <p class="pdf-bandeau"><b>TECHNOLOGIE · Cycle 4 · ${esc(entete.classe)}</b> <span class="pdf-sep">|</span> <span class="pdf-sequence">${esc(entete.sequence)}</span></p>
      <h1>${esc(entete.titre)}</h1>${entete.sousTitre ? `<p class="pdf-sous">${esc(entete.sousTitre)}</p>` : ""}
      <p class="pdf-ident">${esc(texteIdentite(ident))}</p>
    </header>`;
  page.appendChild(contenu);
  const hote = document.createElement("div");
  hote.className = "pdf-hote";
  hote.appendChild(page);
  document.body.appendChild(hote);
  try {
    await window.html2pdf().set({
      margin: [10, 10, 12, 10], filename: fichier,
      image: { type: "jpeg", quality: 0.92 },
      html2canvas: { scale: 2, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"], avoid: ["tr", ".verdict", ".fixe", "figure", "li"] },
    }).from(page).save();
  } finally {
    hote.remove();
  }
}

export function lexique(glossaire, niveau, termes) {
  const defs = termes.map((t) => glossaire.find((g) => g.terme === t && g.niveaux.includes(niveau))).filter(Boolean);
  if (!defs.length) return "";
  return `<details class="lexique"><summary>Mots utiles</summary><dl>${defs.map((g) =>
    `<div><dt>${esc(g.terme)}</dt><dd>${esc(g.definition)}</dd></div>`).join("")}</dl></details>`;
}
