# HCP-kalkulator

Enkel, statisk nettside som beregner "HCP spilt til" i golf basert på brutto antall slag,
valgt bane/utslagssted og antall hull spilt. Ren HTML/CSS/JavaScript — ingen backend,
ingen build-steg. Kan publiseres direkte på GitHub Pages.

## Filer

| Fil | Beskrivelse |
|---|---|
| `index.html` | Selve siden med skjema og resultatvisning |
| `style.css` | Utseende/design |
| `script.js` | Logikk: fyller dropdowns, validerer input, beregner HCP spilt til |
| `data.json` | Datakilde (Kjønn, Bane, Layout, CR, Slope) — generert fra `Slopetabell.xlsx` |
| `Slopetabell.xlsx` | Excel-fila med rådata (kilden for `data.json`) |
| `convert-xlsx-to-json.ps1` | PowerShell-skript som regenererer `data.json` fra Excel-fila |

## Oppdatere data.json fra en ny Excel-fil

1. Oppdater `Slopetabell.xlsx` (legg til/endre rader). Filen må ha kolonnene
   **Kjønn**, **Bane**, **Layout**, **CR** og **Slope** i header-raden, i valgfri rekkefølge.
   CR og Slope skal alltid gjelde for **18 hull**.
2. Kjør konverteringsskriptet fra prosjektmappen (krever at Microsoft Excel er
   installert på maskinen, siden skriptet bruker Excel sin COM-automasjon):

   ```powershell
   .\convert-xlsx-to-json.ps1
   ```

   Skriptet leser første ark i `Slopetabell.xlsx` og skriver `data.json` på nytt.
   Du kan også peke på andre filer:

   ```powershell
   .\convert-xlsx-to-json.ps1 -InputFile "C:\sti\Ny-slopetabell.xlsx" -OutputFile "C:\sti\data.json"
   ```

3. Sjekk at `data.json` ser riktig ut, og commit/push endringen (se under).
   Nettsiden trenger ingen kodeendringer — nye baner/utslagssteder/kjønn i
   `data.json` dukker automatisk opp i dropdownene.

> Har du ikke Excel installert, men har Python med `openpyxl`/`pandas` tilgjengelig,
> kan du skrive et tilsvarende lite script som leser samme kolonner og skriver
> samme JSON-struktur (se format under).

### Forventet format på data.json

```json
[
  { "kjonn": "Mann", "bane": "Askim GK", "layout": "Gul 48", "cr": 65.5, "slope": 124 },
  { "kjonn": "Dame", "bane": "Askim GK", "layout": "Gul 48", "cr": 69.4, "slope": 131 }
]
```

## Justere HCP-formelen

All beregningslogikk ligger samlet i funksjonen `beregnHcpSpiltTil(slagBrutto, cr, slope, antallHull)`
i [`script.js`](script.js). Formelen for 9 hull er markert som en forenkling i en
kommentar over funksjonen — juster den der hvis den ikke stemmer med NGFs offisielle
regler.

## Teste lokalt

Siden bruker `fetch()` for å laste `data.json`, så den må åpnes via en lokal
webserver (ikke som `file://`). Enkleste måte i PowerShell:

```powershell
# Hvis du har Python installert:
python -m http.server 8000

# Eller med Node.js (npx):
npx serve .
```

Åpne deretter `http://localhost:8000` i nettleseren.

## Publisere på GitHub Pages

### 1. Opprett et nytt repo på GitHub

1. Gå til [github.com/new](https://github.com/new).
2. Gi repoet et navn, f.eks. `hcp-kalkulator`.
3. Velg **Public** (kreves for gratis GitHub Pages på personlige kontoer, med mindre
   du har GitHub Pro/Team/Enterprise).
4. Ikke kryss av for "Add a README" (vi har allerede en lokal en) — opprett et tomt repo.
5. Klikk **Create repository**.

### 2. Push koden dit

Fra prosjektmappen (dette repoet er allerede initialisert lokalt med git):

```bash
git remote add origin https://github.com/<ditt-brukernavn>/hcp-kalkulator.git
git branch -M main
git push -u origin main
```

### 3. Aktiver GitHub Pages

1. Gå til repoet på GitHub → **Settings** → **Pages** (i venstre meny).
2. Under **Build and deployment** → **Source**, velg **Deploy from a branch**.
3. Under **Branch**, velg `main` og mappen `/ (root)`.
4. Klikk **Save**.
5. Vent ca. 1 minutt, last siden på nytt — GitHub viser da URL-en, typisk:

   ```
   https://<ditt-brukernavn>.github.io/hcp-kalkulator/
   ```

Siden oppdateres automatisk hver gang du pusher endringer til `main`-branchen,
inkludert etter at du har oppdatert `data.json`.
