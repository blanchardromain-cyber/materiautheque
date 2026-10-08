// Niveau 5e « Je teste et je reconnais » : la casserole, deux pièces (cuve, poignée).
import {
  evaluer, verifierChoix, verifierClassement, verifierCoherence, verdictFinal, procedesCompatibles,
  materiauxVisibles, scenarioPiece, lireEssai, criteresDuNiveau,
} from "./moteur.js";
import { fondPastille, casseroleSVG, consequenceCasserole, essaiSVG, schemaProcede } from "./illustrations.js";
import { ETAPE, $, esc, le, ordreAuSort, lexique, identiteHTML, identiteComplete, texteIdentite, formaterIdent, enregistrerPDF, copieStatique, nomFichierPDF } from "./commun.js";

const NIVEAU = 5;
const TITRES = ["J'observe", "Je classe", "Je définis mes critères", "Je teste et je trie", "Comment est-elle fabriquée ?", "Je justifie"];
const PIECES = [["cuve", "La cuve"], ["poignee", "La poignée"]];
const STATUTS = [["indispensable", "Indispensable"], ["sans", "Sans importance"]];

export function creerCinquieme(ctx) {
  const D = () => ctx.D(), S = () => ctx.S();
  const mat = (id) => D().materiaux.find((m) => m.id === id);
  const nom = (m) => m.nom[NIVEAU];
  const sc = (piece) => scenarioPiece(S(), piece);
  const nomPiece = (p) => PIECES.find((x) => x[0] === p)[1];

  // État propre à la 5e, rangé dans etat.c5
  function e5() {
    const e = ctx.etat();
    e.c5 ||= { piece: "cuve", contraintes: {}, contraintesVues: false, ordre: {}, classement: { cuve: {}, poignee: {} },
      criteresVus: false, actifs: { cuve: [], poignee: [] }, testes: {}, dernierEssai: null,
      choix: { cuve: null, poignee: null }, valide: { cuve: false, poignee: false },
      usine: { cuve: null, poignee: null }, familleRep: { cuve: null, poignee: null }, texte: { cuve: "", poignee: "" } };
    return e.c5;
  }
  const sauver = () => ctx.sauver();
  const limiter = (etape) => { const e = ctx.etat(); e.max = Math.min(e.max, etape); };

  const onglets = (aide = "") => `<div class="onglets" role="group" aria-label="Pièce de la casserole">${PIECES.map(([id, t]) =>
    `<button type="button" class="onglet" data-c5-piece="${id}" aria-pressed="${e5().piece === id}">${t}${aide ? aide(id) : ""}</button>`).join("")}</div>`;

  // ---------- Étape 1 ----------
  function etape1() {
    const c = e5();
    const allumee = !!c.plaque;
    const groupe = ([piece, titre]) => {
      const cs = sc(piece).contraintes;
      c.ordre[piece] = ordreAuSort(cs, c.ordre[piece]);
      const items = c.ordre[piece].map((id) => cs.find((x) => x.id === id)).map((x) => {
        const coche = !!c.contraintes[x.id];
        const retour = c.contraintesVues
          ? `<span class="retour ${coche === x.vraie ? "ok" : "ko"}"><strong>${coche === x.vraie ? "Bien vu." : "À revoir."}</strong> ${esc(x.explication)}</span>` : "";
        return `<li><label class="case"><input type="checkbox" data-c5-contrainte="${x.id}" ${coche ? "checked" : ""}><span>${esc(x.texte)}</span></label>${retour}</li>`;
      }).join("");
      return `<h3>${titre}</h3><ul class="liste-cases">${items}</ul>`;
    };
    return `<section class="deux-colonnes">
      <div>
        <h2 tabindex="-1">${ETAPE.observer}. J'observe la casserole</h2>
        <p class="consigne">Allume la plaque et regarde comment la chaleur se déplace. Coche ce que subit vraiment chaque pièce.</p>
        <figure class="cadre">${casseroleSVG({ allumee }, "Casserole sur une plaque de cuisson")}
          <figcaption><button type="button" class="bouton-discret" data-c5="plaque" aria-pressed="${allumee}">${allumee ? "Éteindre la plaque" : "Allumer la plaque"}</button></figcaption></figure>
        ${lexique(D().glossaire, NIVEAU, ["conducteur", "isolant"])}
      </div>
      <div>
        ${PIECES.map(groupe).join("")}
        <div class="actions">
          <button type="button" class="bouton-discret" data-c5="verifier-contraintes">Vérifier mes réponses</button>
          <button type="button" class="bouton" data-aller="${ETAPE.classer}" ${c.contraintesVues ? "" : "disabled"}>Classer les échantillons</button>
        </div>
        ${c.contraintesVues ? "" : `<p class="aide">Vérifie tes réponses pour passer à l'étape suivante.</p>`}
      </div>
    </section>`;
  }

  // ---------- Étape 2 ----------
  function erreursCriteres(piece) { return verifierClassement(sc(piece), NIVEAU, e5().classement[piece]); }
  function etape2() {
    const c = e5();
    const s = sc(c.piece);
    const cartes = criteresDuNiveau(s, NIVEAU).map((cr) => {
      const statut = c.classement[c.piece][cr.id];
      const aRevoir = c.criteresVus && erreursCriteres(c.piece).find((x) => x.critere === cr.id);
      return `<li class="carte-critere ${aRevoir ? "a-revoir" : ""}">
        <p class="carte-critere-texte">${esc(cr.carte[NIVEAU])}</p>
        <div class="segments" role="radiogroup" aria-label="Importance : ${esc(cr.carte[NIVEAU])}">${STATUTS.map(([v, t]) =>
          `<label class="segment"><input type="radio" name="c5-${c.piece}-${cr.id}" value="${v}" data-c5-classer="${cr.id}" ${statut === v ? "checked" : ""}><span>${t}</span></label>`).join("")}</div>
        ${aRevoir ? `<p class="retour ko"><strong>À revoir.</strong> ${esc(aRevoir.question)}</p>` : ""}
      </li>`;
    }).join("");
    const tousRanges = PIECES.every(([p]) => criteresDuNiveau(sc(p), NIVEAU).every((cr) => c.classement[p][cr.id]));
    const nbErreurs = PIECES.reduce((n, [p]) => n + erreursCriteres(p).length, 0);
    const juste = c.criteresVus && nbErreurs === 0;
    const marque = (p) => (c.criteresVus ? (erreursCriteres(p).length ? " ✗" : " ✓") : "");
    return `<section>
      <h2 tabindex="-1">${ETAPE.criteres}. Je définis mes critères</h2>
      <p class="consigne">Pour chaque pièce, range les cartes. Un critère <strong>indispensable</strong> éliminera tout échantillon qui ne le respecte pas.</p>
      ${onglets(marque)}
      <ul class="cartes-5e">${cartes}</ul>
      ${c.criteresVus ? (juste
        ? `<p class="retour ok"><strong>Tes critères tiennent compte de ce que subit chaque pièce.</strong> Passe aux essais.</p>`
        : `<p class="retour ko"><strong>${nbErreurs} carte${nbErreurs > 1 ? "s" : ""} à revoir</strong> (regarde les deux pièces).</p>`) : ""}
      <div class="actions">
        <button type="button" class="bouton-discret" data-c5="verifier-criteres" ${tousRanges ? "" : "disabled"}>Vérifier mes critères</button>
        <button type="button" class="bouton" data-aller="${ETAPE.trier}" ${juste ? "" : "disabled"}>Tester les échantillons</button>
      </div>
      ${tousRanges ? "" : `<p class="aide">Range toutes les cartes des deux pièces (onglets ci-dessus).</p>`}
    </section>`;
  }

  // ---------- Étape 3 : le banc d'essai ----------
  // Résultat abrégé pour le tableau : « léger (0,6 g) », « conducteur d'électricité »…
  const court = (e, m) => { const l = lireEssai(e, m); const [tete, suite] = l.texte.split(" : "); return e.champValeur ? `${tete} (${suite.replace("le cube pèse ", "")})` : tete; };
  const essaiFait = (idMat, idEssai) => !!e5().testes[idMat]?.[idEssai];
  function resultatsTri(piece) {
    const c = e5();
    const s = sc(piece);
    const actif = Object.fromEntries(criteresDuNiveau(s, NIVEAU).map((cr) =>
      [cr.id, c.actifs[piece].includes(cr.id) ? c.classement[piece][cr.id] || "sans" : "sans"]));
    // Un critère n'élimine qu'un échantillon déjà passé à l'essai correspondant.
    return evaluer(s, D().materiaux, NIVEAU, actif).map((r) => {
      const raisons = r.raisons.filter((x) => essaiFait(r.id, s.criteres.find((cr) => cr.id === x.critere).essai));
      return { ...r, raisons, elimine: raisons.length > 0 };
    });
  }

  function etape3() {
    const c = e5();
    const s = sc(c.piece);
    const essais = D().essais;
    const res = Object.fromEntries(resultatsTri(c.piece).map((r) => [r.id, r]));
    const visibles = materiauxVisibles(s, D().materiaux, NIVEAU);
    const indisp = criteresDuNiveau(s, NIVEAU).filter((cr) => c.classement[c.piece][cr.id] === "indispensable");
    const der = c.dernierEssai;
    const scene = der
      ? (() => { const m = mat(der.mat), e = essais.find((x) => x.id === der.essai), l = lireEssai(e, m);
          return `<figure class="scene-essai">${essaiSVG(e.id, m, l.classe, `${e.nom} — ${nom(m)} : ${l.texte}`)}
            <figcaption><strong>${esc(e.nom)} · ${esc(nom(m))}</strong> — ${esc(l.texte)}<br><small>${esc(e.protocole)}</small></figcaption></figure>`; })()
      : `<p class="aide scene-vide">Clique sur un « ? » du tableau pour faire un essai.</p>`;
    const lignes = visibles.map((m) => {
      const r = res[m.id];
      const choisi = c.choix[c.piece] === m.id;
      const cellules = essais.map((e) => essaiFait(m.id, e.id)
        ? `<td class="fait issue-${lireEssai(e, m).classe}">${esc(court(e, m))}</td>`
        : `<td><button type="button" class="bouton-essai" data-c5-essai="${e.id}" data-c5-mat="${m.id}" aria-label="${esc(e.question)} (${esc(nom(m))})">?</button></td>`).join("");
      const statut = r.elimine
        ? `<span class="bande-courte">Non, parce qu'il ${esc(r.raisons.map((x) => x.texte).join(" ; "))}</span>`
        : `<button type="button" class="bouton-choix" data-c5-choisir="${m.id}" aria-pressed="${choisi}">${choisi ? `✓ ${nomPiece(c.piece)} · retirer` : `Pour ${nomPiece(c.piece).toLowerCase()}`}</button>`;
      return `<tr class="${r.elimine ? "elimine" : ""} ${choisi ? "choisi" : ""}">
        <th scope="row"><span class="pastille petite" style="background:${fondPastille(m.peau3D)}"></span>${esc(nom(m))}</th>${cellules}<td>${statut}</td></tr>`;
    }).join("");
    const etatPiece = (p) => c.valide[p] ? `✓ ${nom(mat(c.choix[p]))}` : c.choix[p] ? `${nom(mat(c.choix[p]))} (à valider)` : "à choisir";
    const toutValide = c.valide.cuve && c.valide.poignee;
    return `<section class="tri5">
      <h2 tabindex="-1">${ETAPE.trier}. Je teste et je trie</h2>
      <p class="consigne">Fais passer les échantillons sur le banc d'essai : chaque « ? » est un essai. Active ensuite tes critères : un échantillon n'est écarté que si tu l'as testé.</p>
      ${onglets()}
      <div class="banc">
        <div class="banc-scene" aria-live="polite">${scene}</div>
        <div class="banc-criteres"><h3>Mes critères indispensables pour ${nomPiece(c.piece).toLowerCase()}</h3>
          <ul class="interrupteurs">${indisp.map((cr) => `<li><button type="button" class="interrupteur indispensable" data-c5-activer="${cr.id}" aria-pressed="${c.actifs[c.piece].includes(cr.id)}"><span class="voyant"></span><span>${esc(cr.carte[NIVEAU])}</span><small>essai : ${esc(essais.find((x) => x.id === cr.essai).nom.toLowerCase())}</small></button></li>`).join("")}</ul>
        </div>
      </div>
      <div class="tableau-defile"><table class="tableau-essais"><caption>Mon tableau de résultats</caption>
        <thead><tr><th scope="col">Échantillon</th>${essais.map((e) => `<th scope="col">${esc(e.nom)}</th>`).join("")}<th scope="col">${esc(nomPiece(c.piece))}</th></tr></thead>
        <tbody>${lignes}</tbody></table></div>
      ${lexique(D().glossaire, NIVEAU, ["conducteur", "isolant", "rigide", "léger"])}
      <div class="barre-choix barre-procedes">
        <p><span>Cuve : <strong>${esc(etatPiece("cuve"))}</strong></span><span>Poignée : <strong>${esc(etatPiece("poignee"))}</strong></span></p>
        ${c.choix[c.piece] && !c.valide[c.piece] ? `<button type="button" class="bouton" data-c5="valider">Valider ${esc(nomPiece(c.piece).toLowerCase())}</button>` : ""}
        <button type="button" class="${toutValide ? "bouton" : "bouton-discret"}" data-aller="${ETAPE.procede}" ${toutValide ? "" : "disabled"}>Continuer</button>
      </div>
    </section>`;
  }

  function valider() {
    const c = e5();
    const piece = c.piece, s = sc(piece), id = c.choix[piece];
    const propres = verifierCoherence(s, D().materiaux, NIVEAU, c.classement[piece], id);
    const ref = verifierChoix(s, D().materiaux, NIVEAU, id, D().procedes).violations.filter((x) => !propres.some((p) => p.critere === x.critere));
    const violations = [...propres, ...ref];
    if (!violations.length) {
      c.valide[piece] = true;
      const autre = piece === "cuve" ? "poignee" : "cuve";
      if (!c.valide[autre]) c.piece = autre;
      sauver();
      return ctx.rendreGarderFocus(`[data-c5="valider"], [data-aller="${ETAPE.procede}"]`);
    }
    const v = violations.find((x) => x.consequence) || violations[0];
    const r = consequenceCasserole(v.consequence || "fabrication", piece, mat(id));
    const dlg = $("#consequence");
    dlg.innerHTML = `<div class="consequence ${r.classe}">
      <div class="consequence-scene">${r.svg}</div>
      <div class="consequence-texte"><p class="surtitre">${esc(nomPiece(piece))} en ${esc(nom(mat(id)))}</p>
        <h2 id="consequence-titre">${esc(r.titre)}</h2><p>${esc(r.texte)}</p>
        <p class="question"><strong>À toi :</strong> ${esc(v.question || "Fais les essais qui manquent et choisis un échantillon encore en lice.")}</p>
        <button type="button" class="bouton" data-c5="fermer">Retourner aux essais</button></div></div>`;
    dlg.showModal();
  }

  // ---------- Étape 4 ----------
  function etape4() {
    const c = e5();
    const bloc = ([piece, titre]) => {
      const m = mat(c.choix[piece]);
      const liste = procedesCompatibles(m, D().procedes, sc(piece), NIVEAU).filter((p) => p.id !== "assemblage");
      const choisi = liste.find((p) => p.id === c.usine[piece]);
      const fiches = liste.map((p) => {
        const q = D().procedes.find((x) => x.id === p.id);
        const sel = c.usine[piece] === p.id;
        return `<li class="fiche-procede petite ${sel ? (p.compatible ? "retenu ok" : "retenu ko") : ""}">
          <figure class="fiche-media">${schemaProcede(q.id, q.nom)}</figure>
          <div class="fiche-corps"><h4>${esc(q.nom)}</h4><p>${esc(q.principe)}</p>
            <button type="button" class="bouton-choix" data-c5-usine="${p.id}" data-c5-pour="${piece}" aria-pressed="${sel}">${sel ? "✓ Choisi · retirer" : "C'est celui-ci"}</button></div></li>`;
      }).join("");
      const retour = !choisi ? "" : choisi.compatible
        ? `<p class="retour ok" role="status"><strong>Oui.</strong> ${esc(choisi.raison)}</p>`
        : `<p class="retour ko" role="status"><strong>Non.</strong> ${esc(choisi.raison)}</p>`;
      return `<h3 class="question-procede"><span>${piece === "cuve" ? 1 : 2}</span> ${titre} en ${esc(nom(m))} : comment la fabrique-t-on à l'usine ?</h3>
        ${retour}<ul class="galerie-procedes">${fiches}</ul>`;
    };
    const ok = (p) => procedesCompatibles(mat(c.choix[p]), D().procedes, sc(p), NIVEAU).find((x) => x.id === c.usine[p])?.compatible;
    const pret = ok("cuve") && ok("poignee");
    return `<section class="etape-procedes">
      <h2 tabindex="-1">${ETAPE.procede}. Comment est-elle fabriquée ?</h2>
      <p class="consigne">À l'usine, chaque pièce est mise en forme par un procédé. Retrouve celui de la cuve et celui de la poignée.</p>
      ${PIECES.map(bloc).join("")}
      <aside class="encart-college">${schemaProcede("impression-3d", "Impression 3D")}<p><strong>Et au collège ?</strong> ${esc(S().prototype)}</p></aside>
      <div class="actions"><button type="button" class="bouton" data-aller="${ETAPE.justifier}" ${pret ? "" : "disabled"}>Je justifie mes choix</button></div>
    </section>`;
  }

  // ---------- Étape 5 ----------
  const pretAImprimer = () => {
    const c = e5(), i = ctx.etat().ident;
    return PIECES.every(([p]) => c.familleRep[p]) && identiteComplete(i);
  };
  async function enregistrer(bouton) {
    const texte = bouton.textContent;
    bouton.disabled = true; bouton.textContent = "Préparation du PDF…";
    try {
      const e = ctx.etat();
      await enregistrerPDF({ entete: S().entete, ident: e.ident, contenu: copieStatique($(".justification")), fichier: nomFichierPDF(NIVEAU, e.ident) });
    } catch (err) {
      alert(`Le PDF n'a pas pu être créé (${err.message}). Vérifie la connexion internet lors du premier enregistrement.`);
    } finally { bouton.textContent = texte; bouton.disabled = !pretAImprimer(); }
  }
  function majImpression() {
    const b = $('[data-c5="imprimer"]');
    if (b) b.disabled = !pretAImprimer();
    const t = $(".entete-impression");
    if (t) t.textContent = texteIdentite(ctx.etat().ident);
  }

  function etape5() {
    const c = e5();
    const i = ctx.etat().ident;
    const phrase = ([piece, titre]) => {
      const m = mat(c.choix[piece]);
      const f = D().familles.find((x) => x.id === m.famille);
      const rep = c.familleRep[piece];
      const retour = !rep ? "" : rep === f.id ? `<p class="retour ok"><strong>Exact.</strong></p>`
        : `<p class="retour ko"><strong>À revoir.</strong> Retourne à l'étape « Je classe » : d'où vient la matière ?</p>`;
      const v = verdictFinal(sc(piece), D().materiaux, NIVEAU, m.id);
      return `<div class="fixe phrase-famille">
        <p>${titre} est en <strong>${esc(nom(m))}</strong>, un matériau de la famille des
        <select data-c5-famille="${piece}" aria-label="Famille du matériau de ${titre.toLowerCase()}"><option value="">— choisis —</option>${D().familles.map((x) =>
          `<option value="${x.id}" ${rep === x.id ? "selected" : ""}>${esc(x.nom[NIVEAU].toLowerCase())}</option>`).join("")}</select>.</p>
        ${retour}
        <label class="redaction"><span>…parce que ${titre.toLowerCase()} doit</span>
          <textarea data-c5-texte="${piece}" rows="2" placeholder="Utilise tes critères indispensables.">${esc(c.texte[piece])}</textarea></label>
        ${v.niveau === "meilleur" ? `<p class="verdict meilleur"><strong>Bon choix :</strong> ${esc(le(nom(m)))} respecte tous les critères indispensables de ${titre.toLowerCase()}.</p>` : ""}
      </div>`;
    };
    const essais = D().essais;
    const tableau = `<div class="tableau-defile"><table class="tableau-essais"><caption>Mes résultats d'essais</caption>
      <thead><tr><th scope="col">Échantillon</th>${essais.map((e) => `<th scope="col">${esc(e.nom)}</th>`).join("")}</tr></thead>
      <tbody>${materiauxVisibles(S(), D().materiaux, NIVEAU).map((m) => `<tr><th scope="row">${esc(nom(m))}</th>${essais.map((e) =>
        `<td>${essaiFait(m.id, e.id) ? esc(court(e, m)) : "—"}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    return `<section class="justification">
      <div class="justif-visuel"><figure class="cadre">${casseroleSVG({ cuve: mat(c.choix.cuve).peau3D.couleur, poignee: mat(c.choix.poignee).peau3D.couleur }, "Ma casserole")}
        <figcaption>Cuve en <strong>${esc(nom(mat(c.choix.cuve)))}</strong>, poignée en <strong>${esc(nom(mat(c.choix.poignee)))}</strong></figcaption></figure></div>
      <div class="justif-texte">
        <h2 tabindex="-1">${ETAPE.justifier}. Je justifie mes choix</h2>
        <p class="impression-seule entete-impression">${esc(texteIdentite(i))}</p>
        ${PIECES.map(phrase).join("")}
        ${tableau}
        ${identiteHTML(i, "data-c5-ident")}
        <div class="actions ecran-seul">
          <button type="button" class="bouton" data-c5="imprimer" ${pretAImprimer() ? "" : "disabled"}>Enregistrer ma fiche en PDF</button>
          <button type="button" class="bouton-discret" data-c5="recommencer">Recommencer</button>
        </div>
      </div>
    </section>`;
  }

  // ---------- Commandes ----------
  function brancher() {
    document.addEventListener("click", (ev) => {
      if (ctx.etat().niveau !== NIVEAU) return;
      const b = ev.target.closest("button");
      if (!b) return;
      const c = e5(), d = b.dataset;
      if (d.c5Piece) { c.piece = d.c5Piece; c.dernierEssai = null; sauver(); return ctx.rendreGarderFocus(`[data-c5-piece="${d.c5Piece}"]`); }
      if (d.c5Essai) {
        (c.testes[d.c5Mat] ||= {})[d.c5Essai] = true;
        c.dernierEssai = { mat: d.c5Mat, essai: d.c5Essai };
        sauver(); return ctx.rendreGarderFocus(".banc-scene");
      }
      if (d.c5Activer) {
        const a = c.actifs[c.piece];
        c.actifs[c.piece] = a.includes(d.c5Activer) ? a.filter((x) => x !== d.c5Activer) : [...a, d.c5Activer];
        sauver(); return ctx.rendreGarderFocus(`[data-c5-activer="${d.c5Activer}"]`);
      }
      if (d.c5Choisir) {
        c.choix[c.piece] = c.choix[c.piece] === d.c5Choisir ? null : d.c5Choisir;
        c.valide[c.piece] = false; c.usine[c.piece] = null; limiter(ETAPE.trier);
        sauver(); return ctx.rendreGarderFocus(`[data-c5-choisir="${d.c5Choisir}"]`);
      }
      if (d.c5Usine) {
        c.usine[d.c5Pour] = c.usine[d.c5Pour] === d.c5Usine ? null : d.c5Usine; limiter(ETAPE.procede);
        sauver(); return ctx.rendreGarderFocus(`[data-c5-usine="${d.c5Usine}"][data-c5-pour="${d.c5Pour}"]`);
      }
      const a = d.c5;
      if (a === "plaque") { c.plaque = !c.plaque; sauver(); ctx.rendreGarderFocus('[data-c5="plaque"]'); }
      if (a === "verifier-contraintes") { c.contraintesVues = true; sauver(); ctx.rendreGarderFocus('[data-c5="verifier-contraintes"]'); }
      if (a === "verifier-criteres") { c.criteresVus = true; sauver(); ctx.rendreGarderFocus('[data-c5="verifier-criteres"]'); }
      if (a === "valider") valider();
      if (a === "fermer") $("#consequence").close();
      if (a === "imprimer") enregistrer(b);
      if (a === "recommencer" && confirm("Effacer ton travail et recommencer ?")) { ctx.nouvelEtat(); sauver(); ctx.aller(0); }
    });
    document.addEventListener("change", (ev) => {
      if (ctx.etat().niveau !== NIVEAU) return;
      const t = ev.target, d = t.dataset, c = e5();
      if (d.c5Contrainte) {
        c.contraintes[d.c5Contrainte] = t.checked;
        const avait = c.contraintesVues; c.contraintesVues = false; sauver();
        if (avait) ctx.rendreGarderFocus(`[data-c5-contrainte="${d.c5Contrainte}"]`);
      }
      if (d.c5Classer) {
        c.classement[c.piece][d.c5Classer] = t.value; c.criteresVus = false;
        c.actifs[c.piece] = c.actifs[c.piece].filter((x) => x !== d.c5Classer); limiter(ETAPE.criteres);
        sauver(); ctx.rendreGarderFocus(`[data-c5-classer="${d.c5Classer}"][value="${t.value}"]`);
      }
      if (d.c5Ident === "binome") { const e = ctx.etat(); e.ident = { ...e.ident, binome: t.checked }; sauver(); ctx.rendreGarderFocus('[data-c5-ident="binome"]'); }
      if (d.c5Famille) { c.familleRep[d.c5Famille] = t.value || null; sauver(); ctx.rendreGarderFocus(`[data-c5-famille="${d.c5Famille}"]`); }
    });
    document.addEventListener("input", (ev) => {
      if (ctx.etat().niveau !== NIVEAU) return;
      const t = ev.target, d = t.dataset, c = e5();
      if (d.c5Texte) { c.texte[d.c5Texte] = t.value; sauver(); }
      if (d.c5Ident && t.type === "text") {
        t.value = formaterIdent(d.c5Ident, t.value);
        const e = ctx.etat(); e.ident = { ...e.ident, [d.c5Ident]: t.value }; sauver(); majImpression();
      }
    });
  }

  return { titres: TITRES, etapes: [etape1, ctx.etapeClasser, etape2, etape3, etape4, etape5], brancher };
}
