// Illustrations SVG : repli 2D de la scène 3D prévue en I3.

// Aspect d'un échantillon à partir de peau3D (même donnée que la future 3D).
export function fondPastille({ couleur, metal = 0, rugosite = 0.5, transparence = 0 }) {
  const reflet = metal
    ? `linear-gradient(135deg, rgba(255,255,255,.75) 0%, rgba(255,255,255,0) 38%, rgba(0,0,0,.28) 62%, rgba(255,255,255,.35) 85%, rgba(0,0,0,.15) 100%)`
    : `radial-gradient(circle at 32% 28%, rgba(255,255,255,${(0.75 - rugosite * 0.6).toFixed(2)}) 0%, rgba(255,255,255,0) 45%)`;
  const ombre = `radial-gradient(circle at 70% 78%, rgba(0,0,0,${metal ? 0.25 : 0.18}) 0%, rgba(0,0,0,0) 55%)`;
  const teinte = transparence
    ? `linear-gradient(${hexRgba(couleur, 1 - transparence)}, ${hexRgba(couleur, 1 - transparence)}), repeating-conic-gradient(#c8cdd3 0% 25%, #f4f6f8 0% 50%) 0 0 / 12px 12px`
    : couleur;
  return `${reflet}, ${ombre}, ${teinte}`;
}

function hexRgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a.toFixed(2)})`;
}

const PALE = "M 4 -20 C 30 -36, 40 -62, 22 -88 L 8 -89 C 20 -64, 14 -40, -8 -21 Z";

// Turbine vue de face ; « peau » colore les aubes.
export function turbineSVG({ couleur = "#F2F0EA", metal = 0, classe = "" } = {}, titre = "Turbine du générateur") {
  const aubes = Array.from({ length: 8 }, (_, i) =>
    `<path d="${PALE}" transform="rotate(${i * 45})" />`).join("");
  const trait = metal ? "#3b4652" : "#55606b";
  return `<svg class="turbine ${classe}" viewBox="-100 -100 200 200" role="img" aria-label="${titre}">
    <title>${titre}</title>
    <circle r="96" class="turbine-carter" />
    <g class="turbine-rotor">
      <g class="turbine-aubes" fill="${couleur}" stroke="${trait}" stroke-width="2.5" stroke-linejoin="round">${aubes}</g>
      <circle r="22" fill="${couleur}" stroke="${trait}" stroke-width="3" />
      <circle r="6" fill="${trait}" />
    </g>
  </svg>`;
}

// Robinet automatique en coupe, turbine mise en évidence.
export function robinetCoupeSVG() {
  return `<svg class="robinet" viewBox="0 0 400 300" role="img" aria-labelledby="robinet-titre robinet-desc">
    <title id="robinet-titre">Robinet automatique en coupe</title>
    <desc id="robinet-desc">L'eau monte par le tuyau, traverse la turbine qui entraîne le générateur, passe l'électrovanne et sort par le bec, sous le capteur.</desc>
    <rect x="0" y="0" width="34" height="300" class="mur" />
    <path d="M 70 300 L 70 120 Q 70 70 120 70 L 300 70 Q 340 70 340 110 L 340 130" class="tuyau-ext" />
    <path d="M 70 300 L 70 120 Q 70 70 120 70 L 300 70 Q 340 70 340 110 L 340 130" class="tuyau-int" />
    <path d="M 70 300 L 70 120 Q 70 70 120 70 L 300 70 Q 340 70 340 110 L 340 130" class="eau-flux" />
    <path d="M 340 138 L 340 220" class="eau-chute" />
    <g transform="translate(70 214)">
      <circle r="34" class="repere" />
      <g transform="scale(.27)">${turbineSVG({}, "Turbine").replace(/<svg[^>]*>|<\/svg>/g, "")}</g>
    </g>
    <rect x="108" y="190" width="70" height="48" rx="6" class="boitier" />
    <line x1="96" y1="214" x2="108" y2="214" class="axe" />
    <rect x="200" y="54" width="44" height="32" rx="4" class="boitier" />
    <rect x="300" y="140" width="34" height="18" rx="4" class="capteur" />
    <g class="etiquettes">
      <text x="143" y="256" text-anchor="middle">générateur</text>
      <text x="222" y="44" text-anchor="middle">électrovanne</text>
      <text x="300" y="176" text-anchor="end">capteur</text>
      <text x="118" y="140" class="etiquette-forte">turbine</text>
      <path d="M 116 136 L 98 196" class="fleche" />
    </g>
  </svg>`;
}

const RECITS = {
  eau: (m) => m.famille === "metal"
    ? { titre: "Six mois plus tard…", texte: "La turbine a rouillé : des écailles se détachent et bloquent les aubes.", classe: "c-rouille" }
    : { titre: "Six mois plus tard…", texte: "La turbine a bu l'eau : elle a gonflé, ses aubes frottent et se bloquent.", classe: "c-gonfle" },
  corrosion: (m) => m.famille === "metal"
    ? { titre: "Six mois plus tard…", texte: "La turbine a rouillé : des écailles se détachent et bloquent les aubes.", classe: "c-rouille" }
    : { titre: "Six mois plus tard…", texte: "La turbine s'est dégradée dans l'eau : elle se ramollit et se fend.", classe: "c-gonfle" },
  "demarrage-lent": () => ({ titre: "On ouvre le robinet…", texte: "Le filet d'eau ne suffit pas à lancer une turbine aussi lourde : elle hésite, puis s'arrête. La pile ne se recharge plus.", classe: "c-lent" }),
  deformation: () => ({ titre: "Sous la poussée de l'eau…", texte: "Les aubes se tordent : la turbine tourne de travers et frotte contre le carter.", classe: "c-tordu" }),
  usure: () => ({ titre: "Un an plus tard…", texte: "L'axe et les aubes se sont usés : la turbine prend du jeu et vibre.", classe: "c-use" }),
  "freinage-aimant": () => ({ titre: "Près du rotor aimanté…", texte: "Le matériau est attiré par l'aimant du générateur : la turbine est freinée, puis bloquée.", classe: "c-aimant" }),
};

export function consequence(type, materiau) {
  const r = (RECITS[type] || RECITS.deformation)(materiau);
  const svg = turbineSVG({ ...materiau.peau3D, classe: r.classe }, `Turbine en ${materiau.nom["4"]} : ${r.texte}`)
    .replace("</svg>", `${r.classe === "c-rouille" ? taches() : ""}${r.classe === "c-aimant" ? aimant() : ""}</svg>`);
  return { ...r, svg };
}

const taches = () => `<g class="taches">${[[-40, -30, 14], [35, -50, 10], [50, 30, 16], [-20, 55, 12], [0, -70, 8], [-60, 20, 9]]
  .map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" style="animation-delay:${0.3 + i * 0.25}s" />`).join("")}</g>`;
const aimant = () => `<g class="aimant" transform="translate(70 -70)"><rect x="-14" y="-24" width="28" height="24" fill="#c0392b"/><rect x="-14" y="0" width="28" height="24" fill="#2c5d9e"/><text y="-7" text-anchor="middle">N</text><text y="17" text-anchor="middle">S</text></g>`;
