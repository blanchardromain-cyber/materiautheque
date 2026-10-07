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

export function lexique(glossaire, niveau, termes) {
  const defs = termes.map((t) => glossaire.find((g) => g.terme === t && g.niveaux.includes(niveau))).filter(Boolean);
  if (!defs.length) return "";
  return `<details class="lexique"><summary>Mots utiles</summary><dl>${defs.map((g) =>
    `<div><dt>${esc(g.terme)}</dt><dd>${esc(g.definition)}</dd></div>`).join("")}</dl></details>`;
}
