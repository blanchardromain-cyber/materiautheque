// Capture du rendu de la turbine, étape par étape, pour vérifier qu'il ne change pas.
// Dans le navigateur, sur le site servi : const { capturer } = await import("/outils/capture-turbine.js"); await capturer();
const IDS = ["acier", "inox", "alu", "cuivre", "laiton", "pla", "abs", "pehd", "pp", "pmma", "pa6", "pom"];
const ETAT = {
  schema: 2, niveau: 4, etape: 0, max: 6,
  contraintes: { immersion: true, rotation: true, forme: true, aimant: true, potable: true }, contraintesVues: true,
  ordre: ["immersion", "chaleur", "rotation", "courant", "forme", "marteau", "aimant", "potable"],
  classement: { eau: "indispensable", leger: "indispensable", rigide: "souhaitable", usure: "souhaitable", forme: "souhaitable", cout: "souhaitable", elec: "sans", chaleur: "sans" },
  criteresVus: true, justif: { eau: "elle baigne dans l'eau" }, actifs: ["eau", "leger", "rigide", "usure", "forme", "cout"], comparer: ["pom", "abs"],
  choix: "pom", essais: 1, serie: "injection", proto: "impression-3d", texte: { parceQue: "Parce que la turbine doit résister à l'eau." },
  familleRep: "organique", sousFamilleRep: "Synthétiques (plastiques, caoutchoucs)", ident: { prenom: "Test", nom: "ESSAI", classe: "4A" },
  classe: { phase: "bilan", boites: Object.fromEntries(IDS.map((id, i) => [id, i < 5 ? 0 : 1])), noms: ["métaux", "plastiques", "", ""],
    familles: {}, sous: {}, essaisF: 1, essaisS: 1, vusF: true, vusS: true },
};
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

async function empreinte(texte) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texte));
  return { lg: texte.length, h: [...new Uint8Array(h)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("") };
}

async function ouvrir(etat, avant) {
  localStorage.clear();
  localStorage.setItem("materiautheque-i2", JSON.stringify(etat));
  localStorage.setItem("materiautheque-niveau", "4");
  const f = document.createElement("iframe");
  f.style.cssText = "position:absolute;left:-9999px;width:1200px;height:900px";
  f.src = "/";
  document.body.append(f);
  await new Promise((r) => f.addEventListener("load", r, { once: true }));
  for (let k = 0; k < 40 && /Chargement/.test(f.contentDocument.querySelector("#scene")?.innerHTML || "Chargement"); k++) await attendre(100);
  if (avant) { avant(f.contentDocument); await attendre(200); }
  return f;
}

export async function capturer({ html = false } = {}) {
  const sortie = {};
  for (let k = 0; k <= 6; k++) {
    const f = await ouvrir({ ...ETAT, etape: k });
    const t = f.contentDocument.querySelector("#scene").innerHTML;
    sortie[k] = html ? t : await empreinte(t);
    f.remove();
  }
  const f = await ouvrir({ ...ETAT, etape: 4, choix: "laiton" }, (d) => d.querySelector('[data-action="valider-choix"]').click());
  const t = f.contentDocument.querySelector("#consequence").innerHTML;
  sortie.consequence = html ? t : await empreinte(t);
  f.remove();
  localStorage.clear();
  return sortie;
}
