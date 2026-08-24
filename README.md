# CE-Innovation Logboek

Desktop-app (macOS + Windows) om skills en leeruitkomsten bij te houden tijdens je stage/project. Gebouwd met Electron + React.

## Voor jou, Jibbe: hoe krijg je dit op GitHub als downloadbare app?

Dit is een gewoon Electron-project (geen Glaze meer). Dat betekent: geen speciale tool nodig om te bouwen — GitHub bouwt de Mac- en Windows-installers voor je, automatisch, elke keer dat je een nieuwe versie wilt uitbrengen.

### Stap 1 — GitHub-account en repository aanmaken

1. Ga naar [github.com](https://github.com) en maak een gratis account als je die nog niet hebt.
2. Klik rechtsboven op de **+** en kies **New repository**.
3. Geef 'm een naam, bijvoorbeeld `ce-innovation-logboek`.
4. Zet 'm op **Private** als je niet wilt dat iedereen de broncode kan zien (de gedownloade app werkt straks sowieso hetzelfde, privé of publiek maakt daarvoor niets uit).
5. Klik **Create repository**. Laat de repo verder leeg (geen README/gitignore aanvinken, dat hebben we al).

### Stap 2 — De code naar GitHub pushen

Dit project staat al klaar, als een zip-bestand dat je van mij hebt gekregen
(`ce-innovation-logboek-electron.zip`, waarschijnlijk in je Downloads-map).

1. **Pak de zip uit.** Dubbelklikken volstaat op zowel Mac als Windows — je krijgt een
   gewone map (bijv. `ce-innovation-logboek-electron` of `logboek-app`, afhankelijk van
   hoe de zip genoemd is).
2. **Zet die map ergens waar je 'm wilt laten staan**, bijvoorbeeld in je Documenten-map.
   Het maakt niet uit waar precies — zolang je straks het pad naar die map kent.
3. **Open een terminal** (op Mac: Terminal.app via Spotlight; op Windows: PowerShell) en
   navigeer naar die map. Bijvoorbeeld, als je 'm in Documenten hebt gezet:
   ```bash
   cd ~/Documents/ce-innovation-logboek-electron
   ```
   (Tip: sleep de map vanuit Finder/Verkenner het terminalvenster in na `cd `, dan vult
   hij het pad automatisch in.)
4. Voer vanuit die map deze commando's uit (vervang `JOUW-GEBRUIKERSNAAM` door je
   GitHub-gebruikersnaam):

```bash
git init
git add .
git commit -m "Eerste versie van de app"
git branch -M main
git remote add origin https://github.com/JOUW-GEBRUIKERSNAAM/ce-innovation-logboek.git
git push -u origin main
```

GitHub vraagt de eerste keer om in te loggen — volg de instructies die in je terminal verschijnen.

Als je dit niet zelf wilt doen: vraag het mij (Claude) in een volgend bericht en ik doe dit voor je, als je me een lege GitHub-repository-link geeft.

### Stap 3 — Een release maken (dit bouwt automatisch de Mac- en Windows-app)

Zodra de code op GitHub staat, staat er ook een workflow klaar (`.github/workflows/build.yml`) die automatisch een `.dmg` (Mac) en `.exe` (Windows) bouwt zodra je een **versie-tag** pusht. Zo doe je dat:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Ga daarna naar je repository op GitHub → tabblad **Actions**. Je ziet daar een workflow draaien ("Build & Release"), dit duurt meestal 5–10 minuten. Als hij klaar is (groen vinkje), ga naar het tabblad **Releases** (rechts op de hoofdpagina van je repo, of via `github.com/JOUW-GEBRUIKERSNAAM/ce-innovation-logboek/releases`) — daar staat een nieuwe release met deze downloadbare bestanden:

- **`CE-Innovation Logboek Installer (Apple Silicon).zip`** → **stuur dit door aan Mac-gebruikers** (nieuwere Macs, vanaf eind 2020, met een M1/M2/M3/M4-chip — de meeste studenten).
- `CE-Innovation Logboek Installer (Intel).zip` → voor Mac-gebruikers met een oudere Intel-Mac.
- `CE-Innovation Logboek Setup 1.0.0.exe` → voor Windows-gebruikers.
- `CE-Innovation Logboek-1.0.0.dmg` / `-arm64.dmg` → alternatieve Mac-installatiemethode (zie hieronder waarom de zip-bestanden hierboven de aanbevolen route zijn).

Iedereen met die link kan die bestanden downloaden en installeren, ook zonder GitHub-account.

**Hoe installeert een Mac-gebruiker de zip?** Downloaden → uitpakken (dubbelklikken) → in de uitgepakte map dubbelklikken op **Installeer.command**. Er opent even een Terminal-venster dat vanzelf de app installeert en opent — geen verdere handelingen nodig. De eerste keer kan macOS nog een milde "onbekende ontwikkelaar"-waarschuwing tonen bij het openen van dat installatiescript zelf; zie de uitleg hieronder.

**Volgende versie uitbrengen?** Herhaal stap 3 gewoon met een nieuw versienummer (`v1.0.1`, `v1.1.0`, etc.) nadat je nieuwe code hebt gepusht.

### Belangrijk om te weten: geen "app store"-goedkeuring

Omdat de app niet gesigneerd is met een betaald Apple Developer-account (€99/jaar) of
Windows-certificaat, tonen macOS en Windows een waarschuwing bij de eerste keer openen.
Dit is normaal voor kleine, niet-commerciële apps en geen teken dat er iets mis is.

**Voor Mac-gebruikers lost het installatiescript (`.zip` → `Installeer.command`) dit
automatisch op** — daarom is dat de aanbevolen downloadoptie in Releases, niet de losse
`.dmg`. Studenten hoeven dus geen Terminal-commando's te kennen of uit te voeren: gewoon
uitpakken en op **Installeer.command** dubbelklikken. Bij het openen van dát ene bestand
kan macOS nog een milde melding tonen ("kan niet worden geopend omdat de ontwikkelaar
niet geverifieerd kan worden") — dat is anders dan de ernstigere "is beschadigd"-melding
die de kale `.dmg`-route soms geeft, en heeft altijd een simpele bypass: rechtsklik (of
ctrl-klik) op **Installeer.command** → **Open** → **Open** bevestigen. Daarna doet het
script de rest vanzelf (app naar Programma's kopiëren, beveiligingsvlag verwijderen, app
openen).

**Wil je of iemand anders toch de kale `.dmg` gebruiken** (bijvoorbeeld omdat je het
installatiescript liever niet vertrouwt, snap ik) **en zie je "is beschadigd en kan niet
worden geopend"**: dit is geen echt beschadigd bestand, gewoon macOS' strengere
Gatekeeper-gedrag voor apps zonder betaald certificaat. Op te lossen via Terminal:
```bash
xattr -cr "/Applications/CE-Innovation Logboek.app"
```

**Windows**: Windows SmartScreen kan een waarschuwing tonen ("Windows heeft je pc
beschermd"). Klik op **Meer info** → **Toch uitvoeren**. Ook dit is eenmalig per
installatie, en heeft (anders dan de macOS "is beschadigd"-melding) altijd een
werkende bypass-knop.

Wil je dit risico voor Mac-gebruikers volledig wegnemen (zelfs de milde
"onbekende ontwikkelaar"-melding bij het installatiescript)? Dat kan alleen door de app
te laten *notariseren* door Apple, wat een betaald Apple Developer-account vereist. Zeg
het me als je dat ooit overweegt, dan help ik de configuratie daarvoor aan te passen.

## Hoe pas je de app later nog aan?

Je kunt dit project niet meer met Glaze-prompts bewerken (Glaze heeft zijn eigen aparte systeem). Vanaf nu werkt aanpassen zo: je vraagt het gewoon aan mij (Claude), net zoals je dat met Glaze deed — "voeg een knop toe om...", "maak het lettertype groter", enzovoort. Ik pas dan de broncode in dit project aan. Zodra je tevreden bent, zet je een nieuwe versie-tag (stap 3 hierboven) en heb je een nieuwe downloadbare versie voor Mac én Windows.

## Waar wordt mijn data opgeslagen?

Bij de allereerste keer openen vraagt de app je een map te kiezen (bijvoorbeeld in je
Documenten-map, of een gesynchroniseerde cloudmap zoals OneDrive/Google Drive/iCloud
Drive). Al je projecten, ontwikkelmomenten en bewijsstukken worden daar opgeslagen in
één bestand: `logbook-data.json`.

- Je kunt deze map later altijd wijzigen via **Instellingen → Opslaglocatie**. Je
  bestaande data wordt dan automatisch meeverhuisd naar de nieuwe map.
- Als de gekozen map bij het opstarten niet meer bereikbaar is (bijv. een externe schijf
  die niet is aangesloten, of een cloudmap die nog niet gesynchroniseerd is), toont de
  app opnieuw het opstartscherm zodat je een (nieuwe) map kunt kiezen.
- De app zelf onthoudt alleen *waar* die map staat, in een klein verwijsbestandje op je
  systeem (`data-location.json`, in de standaard, verborgen app-gegevensmap van
  Electron) — je eigenlijke logboekdata staat altijd in de map die jij hebt gekozen.

## Technische info (voor de volledigheid)

- **Stack**: Electron 33, React 19, TypeScript, Vite, Tailwind CSS 4
- **Data**: JSON-bestand (`logbook-data.json`) in een door de gebruiker gekozen map (zie hierboven); alleen een klein pointer-bestand staat vast in de Electron `userData`-map
- **Export**: PDF (via Electron's ingebouwde printToPDF) en Word (via de `docx`-library)
- Lokaal bouwen kan met `npm install` gevolgd door `npm run dist:mac` of `npm run dist:win` (Windows-installers bouwen werkt het betrouwbaarst vanaf een Windows-machine of via de GitHub Actions-workflow, niet vanaf een Mac)
