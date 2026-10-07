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

export function lexique(glossaire, niveau, termes) {
  const defs = termes.map((t) => glossaire.find((g) => g.terme === t && g.niveaux.includes(niveau))).filter(Boolean);
  if (!defs.length) return "";
  return `<details class="lexique"><summary>Mots utiles</summary><dl>${defs.map((g) =>
    `<div><dt>${esc(g.terme)}</dt><dd>${esc(g.definition)}</dd></div>`).join("")}</dl></details>`;
}
