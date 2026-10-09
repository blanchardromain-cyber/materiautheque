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
    <desc id="robinet-desc">Quand des mains s'approchent du capteur, l'électrovanne s'ouvre : l'eau monte par le tuyau, traverse la turbine qui fait tourner l'aimant du générateur, puis sort par le bec. Quand les mains s'éloignent, l'eau s'arrête aussitôt.</desc>
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
    <g class="ondes"><path d="M310 164 q8 8 16 0" /><path d="M304 170 q14 14 28 0" /><path d="M298 176 q20 20 40 0" /></g>
    <g class="mains" aria-hidden="true">
      <rect x="320" y="246" width="36" height="30" rx="9" /><rect x="320" y="226" width="7" height="26" rx="3.5" />
      <rect x="329" y="222" width="7" height="30" rx="3.5" /><rect x="338" y="223" width="7" height="29" rx="3.5" />
      <rect x="347" y="228" width="7" height="24" rx="3.5" /><rect x="306" y="252" width="18" height="8" rx="4" transform="rotate(-35 315 256)" />
    </g>
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
  // Imprimante 3D à plateau mobile (type Bambu Lab A1) : bobine, bras, tête, pièce en couches
  "impression-3d": `<rect x="24" y="134" width="192" height="12" rx="3" class="s-bati"/><rect x="34" y="26" width="12" height="108" class="s-outil"/>
    <rect x="34" y="52" width="160" height="9" rx="2" class="s-outil"/><rect x="70" y="124" width="124" height="7" rx="2" class="s-outil"/>
    <rect x="104" y="112" width="44" height="6" class="s-matiere"/><rect x="108" y="106" width="36" height="6" class="s-matiere"/><rect x="112" y="100" width="28" height="6" class="s-matiere"/>
    <rect x="114" y="61" width="24" height="26" rx="3" class="s-bati"/><path d="M121 87 h10 l-5 9 z" class="s-chaud"/>
    <circle cx="66" cy="20" r="13" class="s-bobine"/><circle cx="66" cy="20" r="4" class="s-bati"/><path d="M78 24 C 100 30, 118 40, 126 61" class="s-fil"/>`,
  // Découpeuse laser fermée (type xTool) : caisson, capot teinté, tête, faisceau sur la plaque
  "decoupe-laser": `<rect x="22" y="80" width="196" height="58" rx="8" class="s-caisson"/><path d="M22 86 L40 46 H200 L218 86 Z" class="s-capot"/>
    <rect x="58" y="66" width="128" height="6" class="s-outil"/><rect x="106" y="58" width="26" height="18" rx="3" class="s-bati"/>
    <path d="M119 76 V100" class="s-laser"/><rect x="50" y="100" width="140" height="8" class="s-matiere"/>
    <circle cx="200" cy="116" r="7" class="s-arret"/><path d="M40 124 H150" class="s-trait"/>`,
  // Fraiseuse à commande numérique sous capot arrondi (type Charlyrobot) : broche, fraise, plaque, poignée
  usinage: `<rect x="30" y="112" width="180" height="36" rx="6" class="s-caisson"/><rect x="34" y="106" width="172" height="8" rx="4" class="s-poignee"/>
    <path d="M36 106 V44 Q36 20 70 20 H170 Q204 20 204 44 V106" class="s-capot-arche"/>
    <rect x="62" y="34" width="22" height="70" class="s-outil"/><rect x="84" y="40" width="20" height="26" rx="3" class="s-bati"/><path d="M90 66 h8 v14 h-8 z" class="s-outil"/><path d="M92 80 h4 l-2 8 z" class="s-bati"/>
    <rect x="70" y="92" width="110" height="10" class="s-matiere-r"/><path d="M104 88 l8 -6 M110 92 l10 -2" class="s-trait"/>
    <circle cx="160" cy="132" r="6" class="s-marche"/><circle cx="182" cy="132" r="7" class="s-arret"/>`,
  // Thermoplieuse : bâti, fil chauffant, plaque pliée le long du fil
  "pliage-chaud": `<rect x="30" y="112" width="180" height="16" rx="3" class="s-caisson"/><rect x="30" y="128" width="16" height="16" class="s-bati"/><rect x="194" y="128" width="16" height="16" class="s-bati"/>
    <path d="M40 108 H200" class="s-chaud-l"/><path d="M40 104 H120 L162 62" class="s-plaque"/>
    <path d="M150 50 a22 22 0 0 1 22 22" class="s-trait"/><path d="M168 66 l4 8 l6 -6" class="s-trait"/>`,
  // Plieuse : tablier, outil qui serre, tôle relevée le long de la ligne de pliage
  "pliage-tole": `<rect x="30" y="112" width="180" height="16" rx="3" class="s-caisson"/><rect x="96" y="70" width="48" height="36" class="s-outil"/>
    <path d="M40 108 H120 L170 66" class="s-plaque"/><path d="M150 54 a22 22 0 0 1 22 22" class="s-trait"/><path d="M168 70 l4 8 l6 -6" class="s-trait"/>`,
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

// ---------- Niveau 5e : la casserole et le banc d'essai ----------

// Casserole vue de côté sur sa plaque ; chaque pièce prend la couleur de son matériau.
export function casseroleSVG({ cuve = "#C9CDD2", poignee = "#3B2A22", classe = "", allumee = false } = {}, titre = "Casserole sur une plaque") {
  return `<svg class="casserole ${classe} ${allumee ? "allumee" : ""}" viewBox="0 0 320 200" role="img" aria-label="${titre}">
    <title>${titre}</title>
    <rect x="30" y="168" width="200" height="16" rx="4" class="plaque-cuisson" />
    <g class="vagues"><path d="M80 160 q6 -8 0 -16 q-6 -8 0 -16" /><path d="M130 160 q6 -8 0 -16 q-6 -8 0 -16" /><path d="M180 160 q6 -8 0 -16 q-6 -8 0 -16" /></g>
    <g class="cuve"><path d="M50 70 H210 L202 160 H58 Z" fill="${cuve}" stroke="#3b4652" stroke-width="3" stroke-linejoin="round" />
      <path d="M58 92 H202" class="eau-niveau" /><g class="bulles"><circle cx="90" cy="120" r="4" /><circle cx="130" cy="135" r="5" /><circle cx="170" cy="115" r="4" /></g></g>
    <g class="poignee"><rect x="210" y="76" width="96" height="16" rx="8" fill="${poignee}" stroke="#3b4652" stroke-width="3" /></g>
    <g class="main-chaude"><text x="262" y="66" text-anchor="middle">Aïe !</text></g>
  </svg>`;
}

const RECITS_5E = {
  "cuisson-lente": { titre: "On allume la plaque…", texte: "La chaleur passe mal à travers la cuve : au bout de vingt minutes, l'eau n'est toujours pas chaude.", classe: "c-lente" },
  fond: { titre: "Sur la plaque très chaude…", texte: "Le fond de la cuve ramollit et se déforme : la casserole est fichue.", classe: "c-fond" },
  brulure: { titre: "Pendant la cuisson…", texte: "La chaleur remonte jusqu'à la poignée : impossible de la tenir sans se brûler.", classe: "c-brulure" },
  "poignee-molle": { titre: "Près de la cuve chaude…", texte: "La poignée ramollit et plie : la casserole risque de tomber.", classe: "c-molle" },
  fabrication: { titre: "À l'usine…", texte: "Aucun procédé ne permet de donner cette forme à ce matériau.", classe: "c-fabrication" },
};

export function consequenceCasserole(type, piece, materiau) {
  const r = RECITS_5E[type] || RECITS_5E.fabrication;
  const peaux = piece === "cuve" ? { cuve: materiau.peau3D.couleur } : { poignee: materiau.peau3D.couleur };
  return { ...r, svg: casseroleSVG({ ...peaux, classe: r.classe, allumee: true }, `Casserole : ${r.texte}`) };
}

// Scènes du banc d'essai : l'issue (classe) pilote l'animation.
export function essaiSVG(idEssai, materiau, classe, texte) {
  const c = materiau.peau3D.couleur;
  const scenes = {
    aimant: `<rect x="40" y="70" width="44" height="30" rx="4" fill="${c}" class="echantillon-svg" />
      <g transform="translate(176 60)"><path d="M0 0 h20 v30 a10 10 0 0 0 20 0 v-30 h20 v30 a30 30 0 0 1 -60 0 z" fill="#C0392B" /><rect x="0" y="0" width="20" height="10" fill="#E8ECF0"/><rect x="40" y="0" width="20" height="10" fill="#E8ECF0"/></g>`,
    circuit: `<rect x="20" y="96" width="34" height="20" rx="3" fill="#4A5664" /><text x="37" y="110" text-anchor="middle" class="t-blanc">+ −</text>
      <path d="M54 106 H90 M150 106 H190 V60 H54 V96" class="fil" /><rect x="90" y="96" width="60" height="20" rx="3" fill="${c}" />
      <circle cx="190" cy="44" r="16" class="lampe" /><path d="M184 58 h12" class="fil" />`,
    bougie: `<rect x="30" y="70" width="170" height="14" rx="4" fill="${c}" /><rect x="30" y="70" width="170" height="14" rx="4" class="chaleur-qui-monte" />
      <path d="M44 120 q-8 -16 0 -30 q8 14 0 30 z" class="flamme" /><rect x="40" y="120" width="8" height="14" fill="#E9E3D2" />
      <rect x="204" y="40" width="10" height="70" rx="5" class="thermo" /><rect x="206" y="80" width="6" height="28" rx="3" class="thermo-niveau" />`,
    plaque: `<rect x="40" y="104" width="160" height="16" rx="4" class="plaque-cuisson" /><rect x="90" y="74" width="60" height="30" rx="4" fill="${c}" class="echantillon-svg" />`,
    balance: `<rect x="70" y="96" width="100" height="30" rx="6" fill="#9AA5B1" /><rect x="96" y="70" width="48" height="8" fill="#4A5664" />
      <rect x="108" y="46" width="24" height="24" fill="${c}" stroke="#3b4652" /><circle cx="120" cy="111" r="10" fill="#fff" /><path d="M120 111 L120 103" class="aiguille" />`,
    flexion: `<rect x="20" y="40" width="16" height="70" fill="#4A5664" /><g class="baguette"><rect x="36" y="66" width="170" height="10" rx="3" fill="${c}" /></g>
      <path d="M200 30 v24" class="fleche-force" /><path d="M194 48 l6 8 l6 -8" class="fleche-force" />`,
  };
  return `<svg class="essai-svg essai-${idEssai} issue-${classe}" viewBox="0 0 240 140" role="img" aria-label="${texte}"><title>${texte}</title>${scenes[idEssai] || ""}</svg>`;
}
