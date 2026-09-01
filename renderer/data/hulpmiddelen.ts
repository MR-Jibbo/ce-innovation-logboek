// De 18 hulpmiddelen-PDF's (procesmodellen/handleidingen) die studenten kunnen
// bekijken of downloaden vanuit de Hulpmiddelen-pagina. Losse data-array —
// geen weergavelogica hierin — zodat er later eenvoudig een 19e item bij kan
// zonder de tegel-grid zelf te hoeven aanpassen. `bestandsnaam` moet exact
// overeenkomen met een bestand in resources/hulpmiddelen/ (zie
// package.json's build.extraResources en main/services/hulpmiddelen-store.ts).

export interface Hulpmiddel {
  id: string;
  titel: string;
  beschrijving: string;
  bestandsnaam: string;
}

export const HULPMIDDELEN: Hulpmiddel[] = [
  { id: "design-thinking", titel: "Design thinking", beschrijving: "Het Double Diamond als procesmodel voor je project", bestandsnaam: "01_Design-thinking.pdf" },
  { id: "deconstructie", titel: "Deconstructie", beschrijving: "Vanaf je einddoel terugredeneren naar je concrete stappen voor nu", bestandsnaam: "02_Deconstructie.pdf" },
  { id: "aanpakplan", titel: "Aanpakplan", beschrijving: "Richting kiezen en in beweging blijven, in plaats van alles vooraf dichttimmeren", bestandsnaam: "03_Aanpakplan.pdf" },
  { id: "scrum", titel: "Scrum & kanban", beschrijving: "Ritme, kleine stappen en overzicht voor jullie duo", bestandsnaam: "04_Scrum.pdf" },
  { id: "onderbouwen", titel: "Onderbouwen", beschrijving: "Je keuzes navolgbaar maken in het beroepsproduct zelf", bestandsnaam: "05_Onderbouwen.pdf" },
  { id: "slim-ai-gebruiken", titel: "Slim AI gebruiken", beschrijving: "Eerst denken, dan schetsen, dan prompten", bestandsnaam: "06_Slim-AI-gebruiken.pdf" },
  { id: "reflectie", titel: "Reflectie", beschrijving: "Je leerproces zichtbaar maken met STARR", bestandsnaam: "07_Reflectie.pdf" },
  { id: "stakeholderanalyse", titel: "Stakeholderanalyse", beschrijving: "In kaart brengen wie belang heeft bij je project en wie er invloed op heeft", bestandsnaam: "08_Stakeholderanalyse.pdf" },
  { id: "opdrachtgever-afspraken", titel: "Opdrachtgever-afspraken", beschrijving: "De opdracht scherp krijgen, afspraken maken en een ritme voor goed contact", bestandsnaam: "09_Opdrachtgever-afspraken.pdf" },
  { id: "ketenschets", titel: "Ketenschets", beschrijving: "In beeld brengen waar materiaal, geld en waarde langsgaan", bestandsnaam: "10_Ketenschets.pdf" },
  { id: "probleemdefinitie", titel: "Probleemdefinitie", beschrijving: "Van de gevraagde oplossing naar het echte probleem", bestandsnaam: "11_Probleemdefinitie.pdf" },
  { id: "ce-modellen", titel: "CE-modellen", beschrijving: "Denkmodellen om je project circulair te maken", bestandsnaam: "12_CE-modellen.pdf" },
  { id: "brainstorm", titel: "Brainstorm", beschrijving: "Eerst breed denken, dan kiezen", bestandsnaam: "13_Brainstorm.pdf" },
  { id: "prioriteren", titel: "Prioriteren", beschrijving: "Kiezen waar je je tijd en energie op zet", bestandsnaam: "14_Prioriteren.pdf" },
  { id: "ai-naar-website", titel: "AI naar website", beschrijving: "Van een schets naar een werkende pagina, zonder te coderen", bestandsnaam: "15_AI-naar-website.pdf" },
  { id: "testen-en-valideren", titel: "Testen en valideren", beschrijving: "Je aannames toetsen voordat je ze uitwerkt", bestandsnaam: "16_Testen-en-valideren.pdf" },
  { id: "projectpaper", titel: "Projectpaper", beschrijving: "Je projectverhaal opbouwen rond why, how en what", bestandsnaam: "17_Projectpaper.pdf" },
  { id: "opleveren-en-presenteren", titel: "Opleveren en presenteren", beschrijving: "Je beroepsproduct zo overdragen dat er ook zonder jou mee verder gewerkt wordt", bestandsnaam: "18_Opleveren-en-presenteren.pdf" },
];
