import type { SkillDef, LukDef, StatusDef } from "./types";

export const STORAGE_KEY = "ce-logboek-v3";

export const PROJ_COLORS = [
  "#E50056",
  "#f97316",
  "#7c3aed",
  "#0ea5e9",
  "#22c55e",
];

export const STATUS: StatusDef[] = [
  { key: "not_started", label: "Idee", cls: "chip-idea" },
  { key: "in_progress", label: "Bezig", cls: "chip-busy" },
];

export const LUK_DEFS: LukDef[] = [
  {
    id: "luk1",
    name: "Business Innovation Strategy",
    dp: "Project 1",
    desc: "Je analyseert en combineert relevante trends en ontwikkelingen, onder begeleiding, op basis waarvan je een duurzaam concurrentievoordeel beschrijft.",
    criteria: [
      { id: "c1", title: "1A – Innovatiestrategie formuleren", desc: "Je komt tot onderbouwde formulering van een innovatiestrategie voor een vraagstuk met meerdere betrokkenen en belangen." },
      { id: "c2", title: "1B – Vraagstuk in kaart brengen", desc: "Hiertoe breng je het vraagstuk helder in kaart met behulp van passende onderzoeksmethode(n)." },
      { id: "c3", title: "1C – Procesmethoden selecteren", desc: "Je brengt relevante procesmethoden in kaart en maakt een onderbouwde keuze voor de meest geschikte aanpak." },
    ],
  },
  {
    id: "luk2",
    name: "Value Proposition",
    dp: "Project 2",
    desc: "Je doet voorstellen voor meervoudige waarde optimalisatie voor zowel de klant als de organisatie.",
    criteria: [
      { id: "c1", title: "2A – Doelgroep- en stakeholdersonderzoek", desc: "Op basis van een innovatievraagstuk voer je een doelgroep- en stakeholdersonderzoek uit en brengt behoeften, problemen, belangen en trends in kaart." },
      { id: "c2", title: "2B – Vertalen naar waardepropositie", desc: "Op basis van een afgewogen keuze vertaal je deze behoeften naar een propositie gericht op meervoudige (duurzame) waardecreatie." },
    ],
  },
  {
    id: "luk3",
    name: "Business Concept Validation",
    dp: "Project 3",
    desc: "Je ontwerpt een nieuw product/dienst/proces waarmee je de duurzame relatie tussen afnemer en organisatie verstevigt.",
    criteria: [
      { id: "c1", title: "3A – Prototype(s) ontwikkelen, testen en evalueren", desc: "Je ontwikkelt overwogen en onderbouwde prototype(s) en/of innovatieconcept(en), test, valideert en evalueert de haalbaarheid." },
      { id: "c2", title: "3B – Inzichten vertalen naar modellen", desc: "Je ontwikkelt bruikbare inzichten vanuit de testresultaten en vertaalt deze naar relevante modellen." },
      { id: "c3", title: "3C – Samenwerking met stakeholders", desc: "Je organiseert samenwerking met stakeholders om tot bruikbare businessmodellen rondom meervoudige waardecreatie te komen." },
    ],
  },
  {
    id: "luk4",
    name: "Implementation",
    dp: "Project 4",
    desc: "Je voert onder begeleiding en in samenwerking met anderen marketing en/of sales werkzaamheden uit voor een organisatie.",
    criteria: [
      { id: "c1", title: "4A – Projectmanagement & innovatieproces", desc: "Je implementeert op basis van een passend projectmanagementmodel een innovatieproces." },
      { id: "c2", title: "4B – Organiseren, motiveren en activeren", desc: "Je organiseert, motiveert en activeert betrokkenen." },
      { id: "c3", title: "4C – Monitoren en evalueren", desc: "Je monitort en evalueert tijdig en regelmatig de tussentijdse resultaten en lost ontstane problemen op." },
      { id: "c4", title: "4D – Doorzettingsvermogen en verantwoordelijkheid", desc: "Je laat doorzettingsvermogen zien en neemt aantoonbaar verantwoordelijkheid voor de uitvoering van het plan." },
    ],
  },
];

export const ALL_SKILLS: SkillDef[] = [
  { id: "s01", name: "Samenwerken", color: "#3b82f6", desc: "Bijdragen aan een gezamenlijk resultaat ook wanneer de samenwerking een onderwerp betreft dat niet direct van persoonlijk belang is.", ind: ["Ik kom met ideeën en geef mijn mening als er groepsbesluiten genomen moeten worden.", "Ik doe mijn deel van het werk en zorg steeds dat het tijdig af is.", "Ik deel alle bruikbare en relevante informatie tijdig met de groep.", "Ik geef uit mezelf en openlijk complimenten aan de groep.", "Ik benoem uit mezelf en openlijk verbeterpunten voor de groep.", "Ik toon respect voor anderen in woord en daad.", "Ik reageer constructief en actief op feedback en ideeën van anderen.", "Ik betrek anderen actief bij het gesprek/overleg/discussie."] },
  { id: "s02", name: "Initiatief", color: "#f97316", desc: "Kansen en problemen signaleren en ernaar handelen, liever uit zichzelf beginnen dan passief afwachten.", ind: ["Ik benoem en benut tijdig kansen die zich voordoen om een doelstelling te bereiken.", "Ik benoem mogelijke problemen en haal barrières weg om tot een oplossing te komen.", "Ik overzie de situatie en onderneem tijdig acties uit mezelf.", "Ik handel snel in geval van actuele kansen of problemen.", "Ik denk vooruit en benoem kansen en problemen in de nabije toekomst.", "Ik onderneem acties om toekomstige kansen te benutten of problemen te voorkomen."] },
  { id: "s03", name: "Aanpassingsvermogen", color: "#22c55e", desc: "Doelmatig blijven handelen indien zich onverwachte omstandigheden voordoen.", ind: ["Ik accepteer de behoefte aan aanpassing en begrijp de standpunten van anderen.", "Ik toon me bereid tot verandering in taken en verantwoordelijkheden.", "Ik pas op verzoek de manier van werken aan.", "Ik laat het oude gemakkelijk los en ben nieuwsgierig naar nieuwe manieren van werken.", "Ik heb korte tijd nodig om effectief te gaan werken als omstandigheden zijn veranderd.", "Ik onderneem acties om me zo snel mogelijk aan te passen aan nieuwe omstandigheden."] },
  { id: "s04", name: "Creativiteit", color: "#a855f7", desc: "Met oorspronkelijke oplossingen of ideeën komen voor werkwijzen, problemen of kansen.", ind: ["Ik reageer enthousiast op nieuwe en/of ongebruikelijke ideeën.", "Ik ga in op een nieuwe zienswijze of ideeën van een ander.", "Ik heb bij problemen meerdere suggesties voor een aanpak.", "Ik associeer gemakkelijk en leg snel relaties vanuit een gegeven naar een ander.", "Ik stel aannames ter discussie om nieuwe ideeën te kunnen genereren.", "Ik bekijk zaken vanuit ongebruikelijke invalshoeken.", "Ik combineer bestaande oplossingen of ideeën tot een oplossing die uniek is.", "Ik experimenteer met ongebruikelijke oplossingen."] },
  { id: "s05", name: "Persoonlijk leiderschap", color: "#E50056", desc: "Richting en sturing geven aan een groep, of individu, samenwerking stimuleren en tot stand brengen.", ind: ["Ik zit een bijeenkomst voor en stel de agenda op.", "Ik deel taken toe, vraag naar ideeën en geef instructies waar nodig.", "Ik maak afspraken over gewenste resultaten en noteer deze.", "Ik leg uit waarom een verandering in de werkwijze is ingezet.", "Ik ben in staat om draagvlak te verkrijgen bij de groep.", "Ik werk aan het tot stand komen van goede onderlinge betrekkingen."] },
  { id: "s06", name: "Commercieel bewustzijn", color: "#14b8a6", desc: "Het onderzoeken en kennen van de wensen en behoeften van de klant en ernaar handelen.", ind: ["Ik inventariseer wensen en behoeften van klanten.", "Ik toon interesse in het vakgebied en de markt.", "Ik ken de trends en ontwikkelingen op het eigen vakgebied.", "Ik ken de propositie van de belangrijkste concurrenten.", "Ik los problemen van de klant zo snel mogelijk op.", "Ik presenteer voorstellen aan de klant om commerciële mogelijkheden te benutten."] },
  { id: "s07", name: "Verantwoordelijkheidsbesef", color: "#ef4444", desc: "Zorgt ervoor dat opdrachten of werkzaamheden van jezelf en anderen tijdig en naar behoren worden uitgevoerd.", ind: ["Ik voer opgedragen taken naar behoren uit binnen de afgesproken tijd.", "Ik benoem welke taken er uitgevoerd moeten worden en maak een passende planning.", "Ik maak me de noodzakelijke kennis eigen en vraag waar nodig om advies.", "Ik voer opdrachten zelfstandig uit zonder toezicht.", "Ik benoem hierbij zelf de kwaliteitseisen.", "Ik bewaak de kwaliteit en spreek anderen aan op hun aandeel."] },
  { id: "s08", name: "Kritisch denken", color: "#f59e0b", desc: "Verdiept zich in een vraagstuk en komt zelfstandig tot weloverwogen en beargumenteerde afwegingen.", ind: ["Ik stel voornamelijk open vragen.", "Ik vraag door op containerbegrippen en algemeenheden.", "Ik onderzoek en geef gemotiveerd aan of bronnen betrouwbaar zijn.", "Ik raadpleeg meerdere bronnen alvorens tot een oordeel te komen.", "Ik stel vragen in de breedte en diepte.", "Ik scheid feiten van meningen en interpretaties."] },
  { id: "s09", name: "Probleemoplossend vermogen", color: "#0ea5e9", desc: "Herkent en erkent problemen en maakt een plan om tot een oplossing te komen.", ind: ["Ik herken en signaleer welke problemen voorkomen.", "Ik stel gericht vragen om problemen helder in kaart te brengen.", "Ik definieer problemen en maak een scheiding tussen hoofd- en bijzaken.", "Ik stel oorzaak en gevolg vast.", "Ik deel problemen op en bekijk ze vanuit diverse invalshoeken.", "Ik maak een weloverwogen keuze en kom met een uitgewerkt plan."] },
  { id: "s10", name: "Doorzettingsvermogen", color: "#f97316", desc: "Realiseert doelen die hij of zij zichzelf stelt. Laat zich niet door tegenslagen weerhouden.", ind: ["Ik formuleer concrete en uitdagende doelen.", "Ik benoem manieren om die doelen te bereiken.", "Ik kies een manier en zet deze weg in een realistische tijdsplanning.", "Ik volhard intensief totdat het beoogde doel is bereikt.", "Ik reflecteer op de eigen werkwijze en ben kritisch op mezelf.", "Ik bewaak de balans tussen tijdsinvestering en te behalen resultaat."] },
  { id: "s11", name: "Nieuwsgierigheid", color: "#22c55e", desc: "Gedrag dat getuigt van de drang om iets te kunnen, te leren of te weten te komen.", ind: ["Ik stel vragen, neem geen genoegen met een eerste antwoord en vraag door.", "Ik raadpleeg aangereikte relevante bronnen.", "Ik raadpleeg zelfstandig niet-aangereikte bronnen.", "Ik voer onderzoek uit.", "Ik deel opgedane kennis met anderen.", "Ik bedenk een experiment en probeer een nieuwe werkwijze uit."] },
  { id: "s12", name: "Communicatie", color: "#a855f7", desc: "Ideeën, boodschappen, feiten en meningen begrijpelijk en op heldere wijze aan anderen duidelijk maken.", ind: ["Ik spreek en schrijf in goed lopende zinnen, met correcte grammatica.", "Ik vat het besproken stuk helder samen.", "Ik verhelder de eigen boodschap met aansprekende vergelijkingen.", "Ik weet hoofd- en bijzaken goed te scheiden.", "Ik maak gebruik van beelden en digitale mogelijkheden.", "Ik leg complexe zaken stapsgewijs en in simpele bewoordingen uit."] },
];

export const DEFAULT_PROJ_NAMES = [
  "Project 1", "Project 2", "Project 3", "Project 4", "Vrije Ruimte",
  "Project 1", "Project 2", "Project 3", "Project 4",
];

export const YEAR_GROUPS = [
  { id: "jaar1" as const, label: "Jaar 1", indices: [0, 1, 2, 3, 4] },
  { id: "jaar2" as const, label: "Jaar 2", indices: [5, 6, 7, 8] },
];

export function uid(prefix: string): string {
  return prefix + "_" + Math.random().toString(36).slice(2, 9);
}

// ─── Tip van vandaag ────────────────────────────────────────────────────────
// A different tip each day (deterministic by day-of-year, local midnight —
// i.e. the tip rolls over at 24:00/00:00), no data needed.
export const DAILY_TIPS: string[] = [
  "Begin een project altijd met het scherp krijgen van het échte vraagstuk.",
  "Vraag bij een probleem altijd: “Waarom is dit eigenlijk een probleem?”",
  "Zoek naar de vraag achter de vraag.",
  "Neem niet zomaar de probleemstelling van een opdrachtgever over.",
  "Maak onderscheid tussen symptomen en de daadwerkelijke oorzaak.",
  "Formuleer eerst wat je wilt weten voordat je een onderzoeksmethode kiest.",
  "Kies een onderzoeksmethode omdat deze bij je vraagstuk past, niet omdat je hem toevallig kent.",
  "Onderbouw waarom je voor een bepaalde methode kiest.",
  "Gebruik meerdere bronnen voordat je een belangrijke conclusie trekt.",
  "Controleer of een bron daadwerkelijk betrouwbaar is.",
  "Scheid feiten, meningen en interpretaties van elkaar.",
  "Stel tijdens interviews vooral open vragen.",
  "Vraag door wanneer iemand een containerbegrip gebruikt.",
  "Neem niet genoegen met het eerste antwoord.",
  "Zoek actief naar tegenstrijdige informatie.",
  "Kijk niet alleen naar wat mensen zeggen, maar ook naar wat ze daadwerkelijk doen.",
  "Houd trends en ontwikkelingen binnen je speelveld bij.",
  "Kijk zowel naar je opdrachtgever als naar de bredere markt.",
  "Breng relevante stakeholders vroegtijdig in kaart.",
  "Maak je onderzoek zo concreet dat iemand anders jouw redenering kan volgen.",
  "Denk niet alleen vanuit wat de organisatie wil.",
  "Onderzoek wat de klant daadwerkelijk nodig heeft.",
  "Onderzoek ook wat andere stakeholders nodig hebben.",
  "Breng behoeften, problemen én belangen in kaart.",
  "Kijk verder dan alleen financiële waarde.",
  "Denk na over sociale, ecologische en organisatorische waarde.",
  "Vraag jezelf af: “Voor wie creëren we waarde?”",
  "Vraag vervolgens: “Welke waarde creëren we precies?”",
  "Maak je waardepropositie gebaseerd op onderzoeksresultaten.",
  "Kies niet automatisch de oplossing die het leukste klinkt.",
  "Vergelijk meerdere mogelijke oplossingen.",
  "Maak je keuze expliciet.",
  "Onderbouw waarom je een bepaalde richting kiest.",
  "Controleer of je oplossing daadwerkelijk aansluit bij een behoefte.",
  "Test aannames voordat je ze als waarheid presenteert.",
  "Gebruik inzichten van stakeholders om je concept aan te scherpen.",
  "Denk na over de lange termijn.",
  "Kijk naar duurzaamheid als onderdeel van de waardecreatie.",
  "Zoek naar mogelijkheden om verschillende belangen met elkaar te verbinden.",
  "Zorg dat je propositie meer is dan een mooie slogan.",
  "Maak ideeën zo snel mogelijk tastbaar.",
  "Bouw liever een simpel prototype dan een perfect concept op papier.",
  "Test je aannames zo vroeg mogelijk.",
  "Bedenk vooraf wat je met een test wilt leren.",
  "Test niet alleen of mensen je idee leuk vinden.",
  "Test of mensen er daadwerkelijk iets mee zouden doen.",
  "Vraag door op positieve én negatieve feedback.",
  "Zoek bewust naar kritiek.",
  "Zie een mislukte test als informatie.",
  "Pas je concept aan op basis van wat je leert.",
  "Leg vast wat je vóór een test dacht.",
  "Leg daarna vast wat de test daadwerkelijk heeft laten zien.",
  "Trek concrete conclusies uit testresultaten.",
  "Vertaal testresultaten naar verbeterpunten.",
  "Test opnieuw nadat je iets hebt aangepast.",
  "Gebruik relevante modellen om je inzichten te structureren.",
  "Denk vanaf het begin na over haalbaarheid.",
  "Kijk naar technische, organisatorische én commerciële haalbaarheid.",
  "Betrek stakeholders bij het ontwikkelen van je businessmodel.",
  "Zorg dat je businessmodel logisch aansluit op je waardepropositie.",
  "Een goed idee is pas waardevol als je het kunt realiseren.",
  "Maak duidelijk wie waarvoor verantwoordelijk is.",
  "Gebruik een passend projectmanagementmodel.",
  "Maak een planning die daadwerkelijk uitvoerbaar is.",
  "Plan niet alleen het eindresultaat, maar ook tussenstappen.",
  "Houd deadlines vanaf dag één bij.",
  "Werk niet pas vlak voor de deadline aan je portfolio.",
  "Houd gedurende het project bewijsstukken bij.",
  "Noteer belangrijke beslissingen en waarom je ze hebt genomen.",
  "Monitor regelmatig of je nog op koers ligt.",
  "Stel je planning bij wanneer omstandigheden veranderen.",
  "Signaleer problemen voordat ze deadlines bedreigen.",
  "Kom bij een probleem meteen met mogelijke oplossingen.",
  "Wacht niet tot een docent je vertelt wat er moet gebeuren.",
  "Neem eigenaarschap over je eigen deel van het project.",
  "Spreek teamleden aan wanneer afspraken niet worden nagekomen.",
  "Communiceer wijzigingen direct met betrokkenen.",
  "Vier kleine mijlpalen om momentum te houden.",
  "Blijf doorgaan wanneer een eerste aanpak niet werkt.",
  "Neem verantwoordelijkheid voor het eindresultaat.",
  "Maak aan het begin duidelijke afspraken met je team.",
  "Spreek af wie welke verantwoordelijkheid heeft.",
  "Deel relevante informatie actief met groepsleden.",
  "Wacht niet totdat iemand om informatie vraagt.",
  "Kom voorbereid naar overleg.",
  "Geef je mening wanneer groepsbesluiten worden genomen.",
  "Luister actief naar andere perspectieven.",
  "Betrek stille groepsleden bij gesprekken.",
  "Geef complimenten wanneer iemand goed werk levert.",
  "Geef verbeterpunten open en respectvol.",
  "Zie feedback niet als persoonlijke kritiek.",
  "Vraag zelf om feedback voordat iemand anders het geeft.",
  "Maak afspraken concreet: wie, wat, wanneer?",
  "Spreek elkaar aan op gemaakte afspraken.",
  "Denk vanuit het gezamenlijke resultaat in plaats van alleen je eigen taak.",
  "Wacht niet op instructies voordat je begint.",
  "Houd je eigen ontwikkeling actief bij.",
  "Gebruik feedback om je volgende stap te bepalen.",
  "Vraag jezelf regelmatig: “Welk bewijs heb ik dat ik deze LUK beheers?”",
  "Werk vanuit de beoordelingscriteria terug naar je aanpak.",
];

// Deterministic by calendar day (local time) — so the tip changes exactly
// at local midnight (00:00 / "24:00" the night before) and stays the same
// all day, without needing to store or fetch anything.
export function tipOfTheDay(): string {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = Date.now() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}
