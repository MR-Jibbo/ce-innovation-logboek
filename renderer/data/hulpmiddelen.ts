// De 18 hulpmiddelen-PDF's (procesmodellen/handleidingen) die studenten kunnen
// bekijken of downloaden vanuit de Hulpmiddelen-pagina. Losse data-array —
// geen weergavelogica hierin — zodat er later eenvoudig een 19e item bij kan
// zonder de tegel-grid zelf te hoeven aanpassen. `bestandsnaam` moet exact
// overeenkomen met een bestand in resources/hulpmiddelen/ (zie
// package.json's build.extraResources en main/services/hulpmiddelen-store.ts).
//
// De beschrijvingen zijn overgenomen (verbatim) van de officiële
// materialenpagina van de minor: https://fabianb88.github.io/minor-ce-studentenhandleiding/materialen.html

export interface Hulpmiddel {
  id: string;
  titel: string;
  beschrijving: string;
  bestandsnaam: string;
}

export const HULPMIDDELEN: Hulpmiddel[] = [
  { id: "design-thinking", titel: "Design thinking", beschrijving: "Plaats je project in de Double Diamond en zie per fase welke vraag centraal staat en welk hulpmiddel je nodig hebt.", bestandsnaam: "01_Design-thinking.pdf" },
  { id: "deconstructie", titel: "Deconstructie", beschrijving: "Redeneer terug vanaf je einddoel naar de stappen, kennis en keuzes die nu nodig zijn.", bestandsnaam: "02_Deconstructie.pdf" },
  { id: "aanpakplan", titel: "Aanpakplan", beschrijving: "Leg je richting vast zonder alles dicht te timmeren. Werk het plan elke coachingcyclus bij.", bestandsnaam: "03_Aanpakplan.pdf" },
  { id: "scrum", titel: "Scrum & kanban", beschrijving: "Maak het werk klein en zichtbaar met sprints, taken en een praktisch bord voor jullie duo.", bestandsnaam: "04_Scrum.pdf" },
  { id: "onderbouwen", titel: "Onderbouwen", beschrijving: "Maak keuzes, claims en cijfers navolgbaar in je beroepsproduct en onderbouwingslogboek.", bestandsnaam: "05_Onderbouwen.pdf" },
  { id: "slim-ai-gebruiken", titel: "Slim AI gebruiken", beschrijving: "Werk met AI zonder je eigen denken kwijt te raken: eerst denken, dan schetsen, dan prompten.", bestandsnaam: "06_Slim-AI-gebruiken.pdf" },
  { id: "reflectie", titel: "Reflectie", beschrijving: "Gebruik STARR om je leerproces zichtbaar te maken voor coaching en portfolio.", bestandsnaam: "07_Reflectie.pdf" },
  { id: "stakeholderanalyse", titel: "Stakeholderanalyse", beschrijving: "Breng in kaart wie belang heeft bij je project, wie invloed heeft en wie je actief moet betrekken.", bestandsnaam: "08_Stakeholderanalyse.pdf" },
  { id: "opdrachtgever-afspraken", titel: "Opdrachtgever-afspraken", beschrijving: "Gebruik dit voor intake, verwachtingen, contactritme en tussentijdse afstemming met je opdrachtgever.", bestandsnaam: "09_Opdrachtgever-afspraken.pdf" },
  { id: "ketenschets", titel: "Ketenschets", beschrijving: "Breng in beeld waar materiaal, geld en informatie langsgaan, en markeer de plekken waar waarde weglekt.", bestandsnaam: "10_Ketenschets.pdf" },
  { id: "probleemdefinitie", titel: "Probleemdefinitie", beschrijving: "Ga van de gevraagde oplossing naar het echte probleem en formuleer een scherpe kansvraag.", bestandsnaam: "11_Probleemdefinitie.pdf" },
  { id: "ce-modellen", titel: "CE-modellen", beschrijving: "Pas de R-ladder, het vlinderdiagram en de value hill toe op je eigen project, met een werkblad per model.", bestandsnaam: "12_CE-modellen.pdf" },
  { id: "brainstorm", titel: "Brainstorm", beschrijving: "Gebruik technieken om eerst breed te denken en daarna bewust naar kansrijke richtingen te gaan.", bestandsnaam: "13_Brainstorm.pdf" },
  { id: "prioriteren", titel: "Prioriteren", beschrijving: "Kies waar je tijd en energie naartoe gaan met MoSCoW en de impact/inspanning-matrix.", bestandsnaam: "14_Prioriteren.pdf" },
  { id: "ai-naar-website", titel: "AI naar website", beschrijving: "Bouw stap voor stap een werkende pagina met AI, van schets en briefing tot verfijnen, controleren en delen.", bestandsnaam: "15_AI-naar-website.pdf" },
  { id: "testen-en-valideren", titel: "Testen en valideren", beschrijving: "Toets je aannames voordat je ze uitwerkt, met de goedkoopste test die je ongelijk kan geven.", bestandsnaam: "16_Testen-en-valideren.pdf" },
  { id: "projectpaper", titel: "Projectpaper", beschrijving: "Bouw je projectverhaal op rond waarom het ertoe doet, hoe je werkt en wat je oplevert.", bestandsnaam: "17_Projectpaper.pdf" },
  { id: "opleveren-en-presenteren", titel: "Opleveren en presenteren", beschrijving: "Draag je beroepsproduct zo over dat er ook zonder jou mee verder gewerkt wordt.", bestandsnaam: "18_Opleveren-en-presenteren.pdf" },
];
