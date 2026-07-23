// Datagrunnlaget lastes fra data.json, generert fra Slopetabell.xlsx.
// Se README.md for hvordan data.json oppdateres.
let slopeData = [];

const kjonnSelect = document.getElementById("kjonn");
const baneSelect = document.getElementById("bane");
const layoutSelect = document.getElementById("layout");
const antallHullInput = document.getElementById("antallHull");
const hullToggleKnapper = document.querySelectorAll(".toggle-btn[data-hull]");
const slagBruttoInput = document.getElementById("slagBrutto");
const form = document.getElementById("hcp-form");

const resultatVerdi = document.getElementById("resultatVerdi");
const resultatMeta = document.getElementById("resultatMeta");
const metaBrutto = document.getElementById("metaBrutto");
const metaHull = document.getElementById("metaHull");
const feilmelding = document.getElementById("feilmelding");

init();

async function init() {
  try {
    const respons = await fetch("data.json");
    if (!respons.ok) {
      throw new Error("Kunne ikke laste data.json (status " + respons.status + ")");
    }
    slopeData = await respons.json();
    fyllKjonnDropdown();
  } catch (feil) {
    visFeil("Klarte ikke å laste inn banedata: " + feil.message);
  }
}

function fyllKjonnDropdown() {
  const kjonnListe = unikeVerdier(slopeData.map((rad) => rad.kjonn));
  fyllSelect(kjonnSelect, kjonnListe, "Velg kjønn");
  kjonnSelect.disabled = false;
}

function fyllBaneDropdown(valgtKjonn) {
  const baner = unikeVerdier(
    slopeData.filter((rad) => rad.kjonn === valgtKjonn).map((rad) => rad.bane)
  );
  fyllSelect(baneSelect, baner, "Velg bane");
  baneSelect.disabled = false;

  tilbakestillSelect(layoutSelect, "Velg bane først");
  layoutSelect.disabled = true;
}

function fyllLayoutDropdown(valgtKjonn, valgtBane) {
  const layouts = unikeVerdier(
    slopeData
      .filter((rad) => rad.kjonn === valgtKjonn && rad.bane === valgtBane)
      .map((rad) => rad.layout)
  );
  fyllSelect(layoutSelect, layouts, "Velg utslagssted");
  layoutSelect.disabled = false;
}

kjonnSelect.addEventListener("change", () => {
  skjulResultat();
  fyllBaneDropdown(kjonnSelect.value);
});

baneSelect.addEventListener("change", () => {
  skjulResultat();
  fyllLayoutDropdown(kjonnSelect.value, baneSelect.value);
});

layoutSelect.addEventListener("change", skjulResultat);
slagBruttoInput.addEventListener("input", skjulResultat);

hullToggleKnapper.forEach((knapp) => {
  knapp.addEventListener("click", () => {
    hullToggleKnapper.forEach((k) => k.classList.remove("is-active"));
    knapp.classList.add("is-active");
    antallHullInput.value = knapp.dataset.hull;
    skjulResultat();
  });
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  skjulFeil();

  const valgtKjonn = kjonnSelect.value;
  const valgtBane = baneSelect.value;
  const valgtLayout = layoutSelect.value;
  const antallHull = parseInt(antallHullInput.value, 10);
  const slagBrutto = parseInt(slagBruttoInput.value, 10);

  if (!valgtKjonn || !valgtBane || !valgtLayout) {
    visFeil("Velg kjønn, bane og utslagssted før du beregner.");
    return;
  }
  if (!Number.isFinite(slagBrutto) || slagBrutto <= 0) {
    visFeil("Skriv inn et gyldig antall slag brutto.");
    return;
  }

  const rad = slopeData.find(
    (r) => r.kjonn === valgtKjonn && r.bane === valgtBane && r.layout === valgtLayout
  );
  if (!rad) {
    visFeil("Fant ikke CR/Slope for valgt kombinasjon.");
    return;
  }

  const hcp = beregnHcpSpiltTil(slagBrutto, rad.cr, rad.slope, antallHull);
  visResultat(hcp, rad, antallHull, slagBrutto);
});

/*
 * Beregner "HCP spilt til" ut fra brutto antall slag, Course Rating (CR) og Slope.
 * CR og Slope i datagrunnlaget gjelder alltid for 18 hull.
 *
 * 18 hull: standard formel
 *   HCP spilt til = (slag brutto − CR) × 113 / Slope
 *
 * 9 hull: CR halveres (siden CR-verdien i data.json gjelder 18 hull), og resultatet
 * ganges med 2 for å skalere opp til samme skala som en 18-hulls HCP-verdi:
 *   HCP spilt til = ((slag brutto − CR / 2) × 113 / Slope) × 2
 *
 * Juster denne funksjonen her dersom 9-hulls-formelen ikke stemmer med NGFs
 * offisielle regler.
 */
function beregnHcpSpiltTil(slagBrutto, cr, slope, antallHull) {
  let hcp;
  if (antallHull === 18) {
    hcp = ((slagBrutto - cr) * 113) / slope;
  } else if (antallHull === 9) {
    hcp = (((slagBrutto - cr / 2) * 113) / slope) * 2;
  } else {
    throw new Error("Ukjent antall hull: " + antallHull);
  }
  return Math.round(hcp);
}

function visResultat(hcp, rad, antallHull, slagBrutto) {
  resultatVerdi.textContent = hcp.toLocaleString("nb-NO");
  metaBrutto.textContent = "brutto " + slagBrutto;
  metaHull.textContent = antallHull + " hull";
  resultatMeta.hidden = false;
}

function skjulResultat() {
  resultatVerdi.textContent = "–";
  resultatMeta.hidden = true;
}

function visFeil(melding) {
  feilmelding.textContent = melding;
  feilmelding.hidden = false;
}

function skjulFeil() {
  feilmelding.hidden = true;
}

function unikeVerdier(liste) {
  return [...new Set(liste)];
}

function fyllSelect(selectElement, verdier, placeholderTekst) {
  selectElement.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = placeholderTekst;
  placeholder.disabled = true;
  placeholder.selected = true;
  selectElement.appendChild(placeholder);

  verdier.forEach((verdi) => {
    const option = document.createElement("option");
    option.value = verdi;
    option.textContent = verdi;
    selectElement.appendChild(option);
  });
}

function tilbakestillSelect(selectElement, placeholderTekst) {
  fyllSelect(selectElement, [], placeholderTekst);
}
