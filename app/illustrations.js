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
    <rect x="112" y="174" width="108" height="80" rx="8" class="boitier" />
    <line x1="96" y1="214" x2="166" y2="214" class="axe" />
    <rect x="146" y="178" width="40" height="12" rx="3" class="bobine" />
    <rect x="146" y="238" width="40" height="12" rx="3" class="bobine" />
    <g transform="translate(166 214)"><g class="turbine-rotor">
      <rect x="-9" y="-20" width="18" height="20" fill="#C0392B" /><rect x="-9" y="0" width="18" height="20" fill="#2C5D9E" />
      <text y="-6" text-anchor="middle" class="pole">N</text><text y="15" text-anchor="middle" class="pole">S</text>
    </g></g>
    <rect x="200" y="54" width="44" height="32" rx="4" class="boitier" />
    <rect x="300" y="140" width="34" height="18" rx="4" class="capteur" />
    <g class="etiquettes">
      <text x="166" y="272" text-anchor="middle" class="etiquette-forte">générateur</text>
      <text x="222" y="44" text-anchor="middle">électrovanne</text>
      <text x="296" y="153" text-anchor="end">capteur</text>
      <text x="118" y="140" class="etiquette-forte">turbine</text>
      <path d="M 116 136 L 98 196" class="fleche" />
      <text x="228" y="188">bobines</text>
      <path d="M 226 185 L 188 184" class="fleche" />
      <text x="228" y="222">aimant qui tourne</text>
      <text x="228" y="238">(le rotor)</text>
      <path d="M 226 218 L 178 214" class="fleche" />
    </g>
  </svg>`;
}

const RECITS = {
  eau: (m) => m.famille === "metal"
    ? { titre: "Six mois plus tard…", texte: "La turbine a rouillé : des écailles se détachent et bloquent les aubes.", classe: "c-rouille" }
    : { titre: "Six mois plus tard…", texte: "La turbine s'est abîmée dans l'eau : elle a gonflé ou s'est dégradée, ses aubes frottent et se bloquent.", classe: "c-gonfle" },
  corrosion: (m) => m.famille === "metal"
    ? { titre: "Six mois plus tard…", texte: "La turbine a rouillé : des écailles se détachent et bloquent les aubes.", classe: "c-rouille" }
    : { titre: "Six mois plus tard…", texte: "La turbine s'est dégradée dans l'eau : elle se ramollit et se fend.", classe: "c-gonfle" },
  "demarrage-lent": () => ({ titre: "On ouvre le robinet…", texte: "Le filet d'eau ne suffit pas à lancer une turbine aussi lourde : elle hésite, puis s'arrête. La pile ne se recharge plus.", classe: "c-lent" }),
  deformation: () => ({ titre: "Sous la poussée de l'eau…", texte: "Les aubes se tordent : la turbine tourne de travers et frotte contre le carter.", classe: "c-tordu" }),
  usure: () => ({ titre: "Un an plus tard…", texte: "L'axe et les aubes se sont usés : la turbine prend du jeu et vibre.", classe: "c-use" }),
  "freinage-aimant": () => ({ titre: "Près de l'aimant du générateur…", texte: "Le matériau est attiré par l'aimant qui tourne (le rotor) : la turbine est freinée, puis bloquée.", classe: "c-aimant" }),
  fabrication: () => ({ titre: "À l'usine, on lance la production…", texte: "Aucun procédé de grande série ne donne des aubes fines dans ce matériau : la turbine ne peut pas être fabriquée en grand nombre.", classe: "c-fabrication" }),
};

// Schémas de principe des procédés (repli quand il n'y a pas de photo).
const SCHEMAS = {
  "impression-3d": `<rect x="40" y="128" width="160" height="10" class="s-outil"/><rect x="90" y="112" width="60" height="8" class="s-matiere"/><rect x="94" y="104" width="52" height="8" class="s-matiere"/><rect x="98" y="96" width="44" height="8" class="s-matiere"/><path d="M120 40 v40" class="s-fil"/><path d="M108 70 h24 l-8 18 h-8 z" class="s-chaud"/><path d="M60 30 h120" class="s-trait"/>`,
  "decoupe-laser": `<rect x="30" y="110" width="180" height="14" class="s-matiere"/><rect x="100" y="30" width="40" height="24" class="s-outil"/><path d="M120 54 V110" class="s-laser"/><path d="M60 110 v14 M150 110 v14" class="s-coupe"/>`,
  usinage: `<rect x="50" y="96" width="140" height="40" class="s-matiere"/><path d="M50 96 h50 v14 h40 v-14" class="s-coupe"/><rect x="112" y="30" width="16" height="44" class="s-outil"/><path d="M114 74 h12 l-2 24 h-8 z" class="s-outil"/><path d="M146 88 l10 -8 M150 96 l14 -4 M96 86 l-10 -8" class="s-trait"/>`,
  "pliage-chaud": `<path d="M30 112 H120 L170 62" class="s-plaque"/><circle cx="120" cy="120" r="5" class="s-chaud"/><path d="M60 130 H180" class="s-trait"/>`,
  thermoformage: `<rect x="80" y="96" width="80" height="34" rx="12" class="s-outil"/><path d="M40 92 H74 C76 88 78 92 80 96 Q120 70 160 96 C162 92 164 88 166 92 H200" class="s-plaque"/><path d="M100 140 v12 M120 140 v12 M140 140 v12" class="s-trait"/><path d="M60 40 h120" class="s-chaud-l"/>`,
  injection: `<rect x="20" y="70" width="110" height="30" class="s-outil"/><path d="M30 85 h90" class="s-vis"/><rect x="130" y="50" width="34" height="70" class="s-outil"/><rect x="168" y="50" width="34" height="70" class="s-outil"/><path d="M152 74 h24 v22 h-24 z" class="s-matiere"/><path d="M60 50 l10 20 h-20 z" class="s-matiere"/>`,
  fonderie: `<rect x="110" y="90" width="100" height="50" class="s-outil"/><path d="M140 90 v-6 h40 v6" class="s-outil"/><path d="M40 40 l50 0 l-6 24 l-38 0 z" class="s-outil"/><path d="M88 56 Q130 60 158 88" class="s-chaud-l"/><rect x="138" y="104" width="44" height="22" class="s-chaud"/>`,
  emboutissage: `<rect x="96" y="24" width="48" height="50" class="s-outil"/><path d="M40 92 H96 V112 H144 V92 H200" class="s-plaque"/><path d="M40 98 H90 V120 H150 V98 H200 V140 H40 Z" class="s-outil"/><path d="M120 6 v14" class="s-trait"/>`,
  extrusion: `<rect x="20" y="64" width="90" height="44" class="s-outil"/><rect x="26" y="70" width="20" height="32" class="s-trait-r"/><rect x="46" y="72" width="60" height="28" class="s-matiere"/><rect x="110" y="56" width="14" height="60" class="s-outil"/><rect x="124" y="78" width="100" height="16" class="s-matiere"/>`,
  assemblage: `<rect x="40" y="70" width="110" height="20" class="s-matiere"/><rect x="100" y="86" width="110" height="20" class="s-plaque-r"/><path d="M125 50 v60" class="s-vis"/><rect x="115" y="44" width="20" height="8" class="s-outil"/>`,
};

export function schemaProcede(id, nom) {
  return `<svg class="schema" viewBox="0 0 240 160" role="img" aria-label="Schéma de principe : ${nom}"><title>${nom}</title>${SCHEMAS[id] || ""}</svg>`;
}

export function consequence(type, materiau) {
  const r = (RECITS[type] || RECITS.deformation)(materiau);
  const svg = turbineSVG({ ...materiau.peau3D, classe: r.classe }, `Turbine en ${materiau.nom["4"]} : ${r.texte}`)
    .replace("</svg>", `${r.classe === "c-rouille" ? taches() : ""}${r.classe === "c-aimant" ? aimant() : ""}</svg>`);
  return { ...r, svg };
}

const taches = () => `<g class="taches">${[[-40, -30, 14], [35, -50, 10], [50, 30, 16], [-20, 55, 12], [0, -70, 8], [-60, 20, 9]]
  .map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" style="animation-delay:${0.3 + i * 0.25}s" />`).join("")}</g>`;
const aimant = () => `<g class="aimant" transform="translate(70 -70)"><rect x="-14" y="-24" width="28" height="24" fill="#c0392b"/><rect x="-14" y="0" width="28" height="24" fill="#2c5d9e"/><text y="-7" text-anchor="middle">N</text><text y="17" text-anchor="middle">S</text></g>`;
