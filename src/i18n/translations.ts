export type Locale = "fi" | "en";

export const translations = {
  // AppLayout
  "app.title": { en: "Product Idea Research & Scoring Platform", fi: "Product Idea Research & Scoring Platform" },

  // Auth
  "auth.tagline": { en: "Evaluate product ideas with a needs-based approach", fi: "Arvioi tuoteideoita tarvelähtöisellä menetelmällä" },
  "auth.signIn": { en: "Sign In", fi: "Kirjaudu" },
  "auth.signUp": { en: "Sign Up", fi: "Rekisteröidy" },
  "auth.email": { en: "Email", fi: "Sähköposti" },
  "auth.password": { en: "Password", fi: "Salasana" },
  "auth.fullName": { en: "Full Name", fi: "Koko nimi" },
  "auth.signingIn": { en: "Signing in…", fi: "Kirjaudutaan…" },
  "auth.creatingAccount": { en: "Creating account…", fi: "Luodaan tiliä…" },
  "auth.createAccount": { en: "Create Account", fi: "Luo tili" },
  "auth.checkEmail": { en: "Check your email to confirm your account!", fi: "Tarkista sähköpostisi vahvistaaksesi tilisi!" },
  "auth.or": { en: "or", fi: "tai" },
  "auth.googleSignIn": { en: "Continue with Google", fi: "Jatka Googlella" },

  // Dashboard
  "dashboard.title": { en: "Dashboard", fi: "Hallintapaneeli" },
  "dashboard.subtitle": { en: "Your idea validation projects", fi: "Ideavalidointiprojektisi" },
  "dashboard.newIdea": { en: "New Idea", fi: "Uusi idea" },
  "dashboard.noIdeas": { en: "No ideas yet", fi: "Ei vielä ideoita" },
  "dashboard.noIdeasDesc": { en: "Start by creating a new product idea to analyze with a needs-based approach.", fi: "Aloita luomalla uusi tuoteidea tarvelähtöisesti analysoitavaksi." },
  "dashboard.createFirst": { en: "Create Your First Idea", fi: "Luo ensimmäinen ideasi" },
  "dashboard.failedLoad": { en: "Failed to load ideas", fi: "Ideoiden lataus epäonnistui" },

  // Status labels
  "status.draft": { en: "Draft", fi: "Luonnos" },
  "status.framework_ready": { en: "Framework Ready", fi: "Kehys valmis" },
  "status.data_collection": { en: "Data Collection", fi: "Tiedonkeruu" },
  "status.analyzed": { en: "Analyzed", fi: "Analysoitu" },
  "status.clarifying": { en: "Clarifying", fi: "Tarkennetaan" },

  // Clarifying questions
  "clarifying.title": { en: "A few more questions before we begin", fi: "Muutama tarkentava kysymys ennen aloitusta" },
  "clarifying.desc": { en: "Your answers help the AI generate a more accurate and relevant research framework.", fi: "Vastauksesi auttavat tekoälyä luomaan tarkemman ja osuvamman tutkimuskehyksen." },
  "clarifying.why": { en: "Why this matters", fi: "Miksi tämä on tärkeää" },
  "clarifying.continue": { en: "Generate Framework", fi: "Luo kehys" },
  "clarifying.loading": { en: "Analyzing your idea…", fi: "Analysoidaan ideaasi…" },
  "clarifying.skip": { en: "Skip & generate directly", fi: "Ohita ja luo suoraan" },

  // NewIdea
  "newIdea.back": { en: "Back", fi: "Takaisin" },
  "newIdea.title": { en: "New Product Idea", fi: "Uusi tuoteidea" },
  "newIdea.desc": { en: "Describe your product idea. AI will generate a needs-based analysis framework.", fi: "Kuvaile tuoteideasi. Tekoäly luo tarvelähtöisen analyysikehyksen." },
  "newIdea.name": { en: "Idea Name", fi: "Idean nimi" },
  "newIdea.namePlaceholder": { en: "e.g., Smart Home Energy Monitor", fi: "esim. Älykäs kodin energiamonitori" },
  "newIdea.description": { en: "Description", fi: "Kuvaus" },
  "newIdea.descPlaceholder": { en: "Describe the product idea, what problem it solves, and who it's for...", fi: "Kuvaile tuoteideaa, mitä ongelmaa se ratkaisee ja kenelle se on suunnattu..." },
  "newIdea.industry": { en: "Industry", fi: "Toimiala" },
  "newIdea.industryPlaceholder": { en: "e.g., Energy Tech", fi: "esim. Energiateknologia" },
  "newIdea.targetAudience": { en: "Target Audience", fi: "Kohderyhmä" },
  "newIdea.audiencePlaceholder": { en: "e.g., Homeowners, small businesses, freelancers", fi: "esim. Asunnonomistajat, pienyritykset, freelancerit" },
  "newIdea.budget": { en: "Budget Estimate", fi: "Budjettiarvio" },
  "newIdea.budgetPlaceholder": { en: "e.g., €50k–€200k", fi: "esim. 50k–200k €" },
  "newIdea.aiLanguage": { en: "AI Output Language", fi: "Tekoälyn kieli" },
  "newIdea.prefilled": { en: "Pre-filled from your profile. Feel free to edit.", fi: "Esitäytetty profiilistasi. Voit muokata vapaasti." },
  "newIdea.cancel": { en: "Cancel", fi: "Peruuta" },
  "newIdea.create": { en: "Create Idea", fi: "Luo idea" },
  "newIdea.creating": { en: "Creating…", fi: "Luodaan…" },
  "newIdea.created": { en: "Idea created!", fi: "Idea luotu!" },
  "newIdea.failed": { en: "Failed to create idea", fi: "Idean luonti epäonnistui" },

  // IdeaDetail
  "idea.dashboard": { en: "Dashboard", fi: "Hallintapaneeli" },
  "idea.delete": { en: "Delete", fi: "Poista" },
  "idea.deleteConfirm": { en: "Delete this idea and all associated data?", fi: "Poista tämä idea ja kaikki siihen liittyvä data?" },
  "idea.deleteFailed": { en: "Failed to delete", fi: "Poistaminen epäonnistui" },
  "idea.deleted": { en: "Idea deleted", fi: "Idea poistettu" },
  "idea.industry": { en: "Industry", fi: "Toimiala" },
  "idea.audience": { en: "Audience", fi: "Kohderyhmä" },
  "idea.budget": { en: "Budget", fi: "Budjetti" },
  "idea.aiLanguage": { en: "AI Language", fi: "Tekoälyn kieli" },
  "idea.notFound": { en: "Idea not found", fi: "Ideaa ei löytynyt" },
  "idea.showMore": { en: "Show more", fi: "Näytä kokonaan" },
  "idea.showLess": { en: "Show less", fi: "Näytä vähemmän" },

  // Steps
  "step.createIdea": { en: "1. Create Idea", fi: "1. Luo idea" },
  "step.aiFramework": { en: "2. AI Framework", fi: "2. Tekoälykehys" },
  "step.researchData": { en: "3. Research Data", fi: "3. Tutkimusdata" },
  "step.analysis": { en: "4. Analysis", fi: "4. Analyysi" },

  // Framework generation
  "framework.generateTitle": { en: "Generate Analysis Framework", fi: "Luo analyysikehys" },
  "framework.generateDesc": { en: "AI will analyze your idea and generate a complete needs-based framework including process steps, desired outcomes, interview questions, and survey template.", fi: "Tekoäly analysoi ideasi ja luo kattavan tarvelähtöisen kehyksen, joka sisältää prosessivaiheet, tavoitellut tulokset, haastattelukysymykset ja kyselymallin." },
  "framework.generating": { en: "Generating… (this may take 30-60s)", fi: "Luodaan… (tämä voi kestää 30-60s)" },
  "framework.generateBtn": { en: "Generate Framework with AI", fi: "Luo kehys tekoälyllä" },
  "framework.generated": { en: "Analysis framework generated!", fi: "Analyysikehys luotu!" },
  "framework.genFailed": { en: "Generation failed", fi: "Luonti epäonnistui" },
  "framework.failedGenerate": { en: "Failed to generate framework", fi: "Kehyksen luonti epäonnistui" },

  // Tabs
  "tab.jobMap": { en: "Process Steps", fi: "Prosessivaiheet" },
  "tab.outcomes": { en: "Desired Outcomes", fi: "Tavoitellut tulokset" },
  "tab.interview": { en: "Interview", fi: "Haastattelu" },
  "tab.survey": { en: "Survey", fi: "Kysely" },

  // Process Steps (was Job Map)
  "jobMap.title": { en: "Process Steps", fi: "Prosessivaiheet" },
  "jobMap.executor": { en: "Primary Actor", fi: "Ensisijainen toimija" },
  "jobMap.altRoles": { en: "Other Roles", fi: "Muut roolit" },

  // Process Steps revamp
  "steps.contextInfo": { en: "These steps describe what your target customer does today — their current workflow, frustrations, and workarounds. You can click any step to edit it, use Fix to flag steps for AI regeneration, delete steps, or add new ones.", fi: "Nämä vaiheet kuvaavat, mitä kohdeasiakkaasi tekee tänään — heidän nykyinen työtapansa, turhautumisensa ja kiertotiensä. Voit klikata mitä tahansa vaihetta muokataksesi sitä, käyttää Korjaa-nappia merkitäksesi vaiheita tekoälyn uudelleenluontia varten, poistaa vaiheita tai lisätä uusia." },
  "steps.ok": { en: "OK", fi: "OK" },
  "steps.fix": { en: "Fix", fi: "Korjaa" },
  "steps.flag": { en: "Flag", fi: "Merkitse" },
  "steps.flagPlaceholder": { en: "What's wrong with this step? (optional)", fi: "Mikä tässä vaiheessa on pielessä? (vapaaehtoinen)" },
  "steps.clickToEdit": { en: "Click to edit", fi: "Klikkaa muokataksesi" },
  "steps.addStep": { en: "Add step", fi: "Lisää vaihe" },
  "steps.addPlaceholder": { en: "Describe a step the customer takes today…", fi: "Kuvaile vaihe, jonka asiakas tekee tänään…" },
  "steps.flaggedCount": { en: "{count} step(s) flagged for AI review", fi: "{count} vaihetta merkitty AI-tarkistettavaksi" },
  "steps.regenerateBtn": { en: "Fix flagged steps with AI", fi: "Korjaa merkityt vaiheet tekoälyllä" },
  "steps.regenerateSuccess": { en: "Steps updated!", fi: "Vaiheet päivitetty!" },
  "steps.regenerateFailed": { en: "Failed to regenerate steps", fi: "Vaiheiden uudelleenluonti epäonnistui" },
  "steps.reviewed": { en: "reviewed", fi: "tarkistettu" },

  // Outcomes → Desired Outcomes
  "outcomes.title": { en: "Desired Outcomes", fi: "Tavoitellut tulokset" },
  "outcomes.generated": { en: "desired outcomes generated", fi: "tavoiteltua tulosta luotu" },
  "outcomes.addPlaceholder": { en: "Add desired outcome…", fi: "Lisää tavoiteltu tulos…" },
  "outcomes.functional": { en: "Functional", fi: "Toiminnallinen" },
  "outcomes.emotional": { en: "Emotional", fi: "Tunneperäinen" },
  "outcomes.social": { en: "Social", fi: "Sosiaalinen" },
  "outcomes.addFailed": { en: "Failed to add outcome", fi: "Tuloksen lisäys epäonnistui" },
  "outcomes.deleteFailed": { en: "Failed to delete", fi: "Poistaminen epäonnistui" },

  // Process step phases (generic, no JTBD phases)
  "phase.step": { en: "Step", fi: "Vaihe" },

  // Priority labels
  "priority.high": { en: "high", fi: "korkea" },
  "priority.medium": { en: "medium", fi: "keskitaso" },
  "priority.low": { en: "low", fi: "matala" },

  // Score label
  "label.score": { en: "Score", fi: "Pisteet" },
  "label.unmetIndex": { en: "Unmet Needs Index", fi: "Täyttämättömien tarpeiden indeksi" },
  "label.importance": { en: "How important?", fi: "Kuinka tärkeää?" },
  "label.satisfaction": { en: "How well solved?", fi: "Kuinka hyvin ratkaistu?" },
  "label.gap": { en: "Gap", fi: "Erotus" },
  "label.statement": { en: "Statement", fi: "Väittämä" },
  "label.type": { en: "Type", fi: "Tyyppi" },
  "label.respondent": { en: "Respondent", fi: "Vastaaja" },
  "label.exampleRespondent": { en: "Respondent 1", fi: "Vastaaja 1" },
  "label.fileFormats": { en: "Excel, Word, CSV, TXT", fi: "Excel, Word, CSV, TXT" },

  // Interview
  "interview.title": { en: "Interview Questions", fi: "Haastattelukysymykset" },
  "interview.desc": { en: "Use these questions for customer discovery interviews.", fi: "Käytä näitä kysymyksiä asiakashaastatteluissa." },
  "interview.topLevel": { en: "Top-Level Questions", fi: "Ylätason kysymykset" },
  "interview.topLevelDesc": { en: "Start with these broad questions to understand the context.", fi: "Aloita näillä laajoilla kysymyksillä kontekstin ymmärtämiseksi." },
  "interview.deep": { en: "Deep-Dive Questions", fi: "Syventävät kysymykset" },
  "interview.deepDesc": { en: "Dig deeper into specific needs and pain points.", fi: "Syvenny tarkempiin tarpeisiin ja kipupisteisiin." },
  "interview.clarifying": { en: "Clarifying Questions", fi: "Tarkentavat kysymykset" },
  "interview.clarifyingDesc": { en: "Use these to clarify and validate specific details.", fi: "Käytä näitä tarkentamaan ja vahvistamaan yksityiskohtia." },
  "interview.estimatedTime": { en: "Est. ~{min} min", fi: "Arvio ~{min} min" },
  "interview.totalTime": { en: "Total interview time: ~{min} min", fi: "Haastattelun kokonaiskesto: ~{min} min" },

  // Survey
  "survey.title": { en: "Survey Template", fi: "Kyselymalli" },
  "survey.desc": { en: "Importance/Satisfaction survey for customer research.", fi: "Tärkeys/Tyytyväisyys-kysely asiakastutkimukseen." },
  "survey.importance": { en: "Importance", fi: "Tärkeys" },
  "survey.satisfaction": { en: "Satisfaction", fi: "Tyytyväisyys" },

  // Approve
  "approve.btn": { en: "Continue to Data Collection", fi: "Jatka tiedonkeruuseen" },
  "approve.failed": { en: "Failed to update status", fi: "Tilan päivitys epäonnistui" },
  "approve.success": { en: "Moving to data collection.", fi: "Siirrytään tiedonkeruuseen." },

  // DataCollection
  "data.title": { en: "Research Data Collection", fi: "Tutkimusdatan keruu" },
  "data.desc": { en: "Rate importance and satisfaction for each desired outcome (1-10 scale).", fi: "Arvioi tärkeys ja tyytyväisyys jokaiselle tavoitellulle tulokselle (asteikolla 1-10)." },
  "data.scored": { en: "scored", fi: "arvioitu" },
  "data.importCSV": { en: "Import CSV", fi: "Tuo CSV" },
  "data.saveProgress": { en: "Save Progress", fi: "Tallenna" },
  "data.saving": { en: "Saving…", fi: "Tallennetaan…" },
  "data.saved": { en: "Data saved!", fi: "Data tallennettu!" },
  "data.saveFailed": { en: "Failed to save data", fi: "Datan tallennus epäonnistui" },
  "data.csvImported": { en: "CSV data imported!", fi: "CSV-data tuotu!" },
  "data.importance": { en: "Importance", fi: "Tärkeys" },
  "data.satisfaction": { en: "Satisfaction", fi: "Tyytyväisyys" },
  "analyzing.progress": { en: "AI is analyzing your research data…", fi: "Tekoäly analysoi tutkimusdataasi…" },
  "analyzing.progressDesc": { en: "This typically takes 30–60 seconds", fi: "Tämä kestää tyypillisesti 30–60 sekuntia" },
  "data.marketTitle": { en: "Market Information", fi: "Markkinatieto" },
  "data.marketDesc": { en: "Optional: Add market context for the analysis.", fi: "Valinnainen: Lisää markkinakonteksti analyysiin." },
  "data.marketSize": { en: "Target Market Size", fi: "Kohdemarkkinan koko" },
  "data.marketPlaceholder": { en: "e.g., €500M, 2M users", fi: "esim. 500M €, 2M käyttäjää" },
  "data.competitors": { en: "Competitors (comma-separated)", fi: "Kilpailijat (pilkulla erotettuina)" },
  "data.competitorsPlaceholder": { en: "e.g., Competitor A, Competitor B", fi: "esim. Kilpailija A, Kilpailija B" },
  "data.completeBtn": { en: "Complete Data Collection & Analyze", fi: "Viimeistele tiedonkeruu ja analysoi" },

  // Analyzing
  "analyzing.text": { en: "Analyzing results with AI… (this may take 30-60s)", fi: "Analysoidaan tuloksia tekoälyllä… (tämä voi kestää 30-60s)" },
  "analyzing.failed": { en: "Analysis failed", fi: "Analysointi epäonnistui" },
  "analyzing.failedGeneral": { en: "Failed to analyze", fi: "Analysointi epäonnistui" },
  "analyzing.complete": { en: "Analysis complete!", fi: "Analyysi valmis!" },

  // AnalysisView
  "analysis.results": { en: "Analysis Results", fi: "Analyysin tulokset" },
  "analysis.aiGenerated": { en: "AI-generated strategic analysis based on your research data", fi: "Tekoälyn tuottama strateginen analyysi tutkimusdatasi perusteella" },
  "analysis.exportCSV": { en: "Export CSV", fi: "Vie CSV" },
  "analysis.exportPDF": { en: "Export PDF Report", fi: "Vie PDF-raportti" },
  "analysis.pending": { en: "Pending", fi: "Odottaa" },
  "analysis.opportunityLandscape": { en: "Needs Landscape", fi: "Tarvekartta" },
  "analysis.landscapeDesc": { en: "Importance vs. Satisfaction — top-left quadrant reveals unmet needs with the highest potential.", fi: "Tärkeys vs. Tyytyväisyys — vasen yläkulma paljastaa täyttämättömät tarpeet suurimmalla potentiaalilla." },
  "analysis.landscapeEmptyTitle": { en: "Needs Landscape will appear after scoring", fi: "Tarvekartta näkyy, kun pisteytyksiä on lisätty" },
  "analysis.landscapeEmptyDesc": { en: "Add at least one interview respondent score (importance + satisfaction 1-10) in Research Data.", fi: "Lisää vähintään yhden haastateltavan pisteet (tärkeys + tyytyväisyys 1-10) Research Data -vaiheessa." },
  "analysis.topOpportunities": { en: "Top Unmet Needs", fi: "Suurimmat täyttämättömät tarpeet" },
  "analysis.unmetNeeds": { en: "Unmet needs", fi: "Täyttämättömät tarpeet" },
  "analysis.metNeeds": { en: "Met needs", fi: "Tyydytetyt tarpeet" },
  "analysis.topOpportunitiesDesc": { en: "Highest Unmet Needs Index — prioritize these for product improvement", fi: "Korkeimmat Täyttämättömien tarpeiden indeksit — priorisoi nämä tuotekehityksessä" },
  "analysis.recommendations": { en: "Recommendations & Action Plan", fi: "Suositukset ja toimintasuunnitelma" },
  "analysis.marketPotential": { en: "Market Potential", fi: "Markkinapotentiaali" },
  "analysis.recommendation": { en: "Recommendation", fi: "Suositus" },
  "analysis.outcomesAnalyzed": { en: "Outcomes analyzed", fi: "Analysoituja tuloksia" },
  "analysis.typeDistribution": { en: "Outcome Type Distribution", fi: "Tulostyyppijakauma" },
  "analysis.typeDistributionDesc": { en: "Balance between functional, emotional and social outcomes", fi: "Funktionaalisten, emotionaalisten ja sosiaalisten tulosten tasapaino" },
  "analysis.count": { en: "Count", fi: "Määrä" },
  "analysis.varianceTitle": { en: "Respondent Consensus", fi: "Vastaajien yksimielisyys" },
  "analysis.varianceDesc": { en: "Score spread across respondents — wide range = disagreement", fi: "Pisteiden hajonta vastaajien välillä — laaja = erimielisyys" },
  "analysis.average": { en: "average", fi: "keskiarvo" },
  "analysis.range": { en: "range", fi: "hajonta" },
  "analysis.goNoGo": { en: "Go/No-Go Recommendation", fi: "Go/No-Go -suositus" },

  // NotFound
  "notFound.title": { en: "Oops! Page not found", fi: "Sivua ei löytynyt" },
  "notFound.back": { en: "Return to Home", fi: "Palaa etusivulle" },

  // Language switcher
  "lang.fi": { en: "Suomi", fi: "Suomi" },
  "lang.en": { en: "English", fi: "English" },

  // Interview Data Bank
  "dataBank.title": { en: "Interview Data Bank", fi: "Haastatteludatapankki" },
  "dataBank.desc": { en: "Import interview notes from Excel or Word files, or add manually. This data is used as qualitative context in the AI analysis.", fi: "Tuo haastattelumuistiinpanoja Excel- tai Word-tiedostoista tai lisää manuaalisesti. Tämä data käytetään laadullisena kontekstina tekoälyanalyysissä." },
  "dataBank.entries": { en: "entries", fi: "merkintää" },
  "dataBank.importFiles": { en: "Import Files", fi: "Tuo tiedostoja" },
  "dataBank.respondent": { en: "Respondent", fi: "Haastateltava" },
  "dataBank.respondentPlaceholder": { en: "Enter interviewee name or identifier…", fi: "Anna haastateltavan nimi tai tunniste…" },
  "dataBank.contentPlaceholder": { en: "Interview notes, key findings, quotes…", fi: "Haastattelumuistiinpanot, löydökset, sitaatit…" },
  "dataBank.addNote": { en: "Add Note", fi: "Lisää merkintä" },
  "dataBank.saveFailed": { en: "Failed to save note", fi: "Merkinnän tallennus epäonnistui" },
  "dataBank.imported": { en: "Imported", fi: "Tuotu" },
  "dataBank.importFailed": { en: "Import failed", fi: "Tuonti epäonnistui" },
  "dataBank.unsupportedFormat": { en: "Unsupported format", fi: "Tiedostomuotoa ei tueta" },

  // Positioning
  "positioning.title": { en: "Positioning Strategy", fi: "Positioning-strategia" },
  "positioning.desc": { en: "AI-generated positioning based on your needs analysis data", fi: "Tekoälyn luoma asemointi tarveanalyysin perusteella" },
  "positioning.statement": { en: "Positioning Statement", fi: "Asemointilause" },
  "positioning.generate": { en: "Generate Positioning", fi: "Generoi positioning" },
  "positioning.generating": { en: "Generating positioning…", fi: "Generoidaan positioningia…" },
  "positioning.generated": { en: "Positioning generated!", fi: "Positioning generoitu!" },
  "positioning.failed": { en: "Failed to generate positioning", fi: "Positioningin generointi epäonnistui" },
  "positioning.regenerate": { en: "Regenerate", fi: "Generoi uudelleen" },
  "positioning.coreValue": { en: "Core Promise", fi: "Ydinlupaus" },
  "positioning.supportingValues": { en: "Supporting Promises", fi: "Tukevat lupaukset" },
  "positioning.emotionalValues": { en: "Emotional Benefits", fi: "Tunnepohjaiset hyödyt" },
  "positioning.socialValues": { en: "Social Benefits", fi: "Sosiaaliset hyödyt" },
  "positioning.valueHierarchy": { en: "Value Hierarchy", fi: "Arvolupaus-hierarkia" },
  "positioning.competitive": { en: "Competitive Positioning", fi: "Kilpailullinen positiointi" },
  "positioning.competitiveDesc": { en: "Where current solutions fail", fi: "Missä nykyiset ratkaisut epäonnistuvat" },
  "positioning.alternativeAngles": { en: "Alternative Angles", fi: "Vaihtoehtoiset näkökulmat" },
  "positioning.focus": { en: "Focus", fi: "Painotus" },
  "positioning.bestFor": { en: "Best for", fi: "Sopii parhaiten" },

  // Sales Messages
  "sales.title": { en: "Sales Messages", fi: "Myyntiviestit" },
  "sales.desc": { en: "AI-generated sales messages based on your positioning strategy", fi: "Tekoälyn luomat myyntiviestit positioning-strategian perusteella" },
  "sales.generate": { en: "Generate Sales Messages", fi: "Generoi myyntiviestit" },
  "sales.generating": { en: "Generating sales messages…", fi: "Generoidaan myyntiviestejä…" },
  "sales.generated": { en: "Sales messages generated!", fi: "Myyntiviestit generoitu!" },
  "sales.failed": { en: "Failed to generate sales messages", fi: "Myyntiviestien generointi epäonnistui" },
  "sales.regenerate": { en: "Regenerate", fi: "Generoi uudelleen" },
  "sales.elevatorPitch": { en: "Elevator Pitch (30s)", fi: "Hissipuhe (30s)" },
  "sales.coldEmail": { en: "Cold Email", fi: "Sähköpostiviesti" },
  "sales.subjectLine": { en: "Subject", fi: "Otsikko" },
  "sales.cta": { en: "Call to Action", fi: "Toimintakehotus" },
  "sales.basedOn": { en: "Based on", fi: "Perustuu" },
  "sales.copy": { en: "Copy", fi: "Kopioi" },
  "sales.copied": { en: "Copied!", fi: "Kopioitu!" },
  "sales.needPositioning": { en: "Generate positioning strategy first", fi: "Generoi ensin positioning-strategia" },

  // Onboarding
  "onboarding.welcomeTitle": { en: "Welcome to Product Idea Platform!", fi: "Tervetuloa Product Idea -alustalle!" },
  "onboarding.welcomeDesc": { en: "This tool helps you evaluate product ideas using a needs-based research approach. Let's set up your profile so AI can better assist you.", fi: "Tämä työkalu auttaa arvioimaan tuoteideoita tarvelähtöisellä tutkimusmenetelmällä. Täytetään profiilisi, jotta tekoäly voi palvella sinua paremmin." },
  "onboarding.getStarted": { en: "Get Started", fi: "Aloitetaan" },
  "onboarding.profileTitle": { en: "Your Profile", fi: "Profiilisi" },
  "onboarding.profileDesc": { en: "Tell us about yourself so we can personalize your experience.", fi: "Kerro itsestäsi, jotta voimme räätälöidä kokemuksen sinulle." },
  "onboarding.namePlaceholder": { en: "Your full name", fi: "Koko nimesi" },
  "onboarding.company": { en: "Company", fi: "Yritys" },
  "onboarding.companyPlaceholder": { en: "e.g., Acme Corp", fi: "esim. Acme Oy" },
  "onboarding.role": { en: "Role", fi: "Rooli" },
  "onboarding.rolePlaceholder": { en: "e.g., Product Manager", fi: "esim. Tuotepäällikkö" },
  "onboarding.contextTitle": { en: "Your Business Context", fi: "Liiketoimintakonteksti" },
  "onboarding.contextDesc": { en: "These defaults will be used for new ideas. You can always override them per idea.", fi: "Nämä oletukset käytetään uusille ideoille. Voit aina muuttaa ne ideakohtaisesti." },
  "onboarding.contextHint": { en: "These fields are optional — you can fill them in later or per idea.", fi: "Nämä kentät ovat valinnaisia — voit täyttää ne myöhemmin tai ideakohtaisesti." },
  "onboarding.next": { en: "Next", fi: "Seuraava" },
  "onboarding.finish": { en: "Complete Setup", fi: "Viimeistele" },
  "onboarding.saving": { en: "Saving…", fi: "Tallennetaan…" },
  "onboarding.complete": { en: "Profile saved! Welcome aboard.", fi: "Profiili tallennettu! Tervetuloa." },
  "onboarding.saveFailed": { en: "Failed to save profile", fi: "Profiilin tallennus epäonnistui" },
  "onboarding.needNameOrCompany": { en: "Please enter at least your name or company", fi: "Syötä vähintään nimesi tai yrityksesi" },

  // Scoring (per-respondent)
  "scoring.needScores": { en: "Please fill in at least one outcome score", fi: "Täytä vähintään yhden tuloksen pisteet" },
  "scoring.added": { en: "Respondent scores added!", fi: "Haastateltavan pisteet lisätty!" },
  "scoring.respondents": { en: "Respondent Scores", fi: "Haastateltavien pisteet" },
  "scoring.respondentsDesc": { en: "Per-respondent importance and satisfaction scores from interviews", fi: "Haastateltavakohtaiset tärkeys- ja tyytyväisyyspisteet" },
  "scoring.scores": { en: "scores", fi: "pisteytystä" },
  "scoring.addTitle": { en: "Add Interview Results", fi: "Lisää haastattelutulokset" },
  "scoring.addDesc": { en: "For each need below, rate: How important is this to the interviewee? And how well do current solutions handle it? (1 = not at all, 10 = perfectly)", fi: "Arvioi jokainen tarve alla: Kuinka tärkeä tämä on haastateltavalle? Ja kuinka hyvin nykyiset ratkaisut hoitavat sen? (1 = ei lainkaan, 10 = täydellisesti)" },
  "scoring.howTo": { en: "How to add results: 1) Name the respondent → 2) Adjust sliders for each need → 3) Click 'Save Results'. Repeat for each interview.", fi: "Näin lisäät tulokset: 1) Nimeä haastateltava → 2) Säädä liukusäätimet jokaiselle tarpeelle → 3) Paina 'Tallenna tulokset'. Toista jokaiselle haastattelulle." },
  "scoring.outcomesToScore": { en: "Needs to evaluate", fi: "Arvioitavat tarpeet" },
  "scoring.addRespondent": { en: "Save Results", fi: "Tallenna tulokset" },
  "scoring.importTitle": { en: "Import Scores from File", fi: "Tuo pisteet tiedostosta" },
  "scoring.importDesc": { en: "Import outcome scores from a CSV or Excel file. Format: each row has respondent name, importance (1-10), and satisfaction (1-10) for each scored outcome.", fi: "Tuo tulospisteet CSV- tai Excel-tiedostosta. Muoto: jokaisella rivillä haastateltavan nimi, tärkeys (1-10) ja tyytyväisyys (1-10) jokaiselle arvioitavalle tarpeelle." },
  "scoring.importBtn": { en: "Import Scores", fi: "Tuo pisteet" },
  "scoring.downloadTemplate": { en: "Download Template", fi: "Lataa pohja" },
  "scoring.importPreview": { en: "Preview import data", fi: "Esikatsele tuotavaa dataa" },
  "scoring.importConfirm": { en: "Import {count} respondents", fi: "Tuo {count} haastateltavaa" },
  "scoring.importSuccess": { en: "Scores imported successfully!", fi: "Pisteet tuotu onnistuneesti!" },
  "scoring.importFailed": { en: "Import failed", fi: "Tuonti epäonnistui" },
  "scoring.importInvalidFormat": { en: "Invalid file format. Please use the template.", fi: "Virheellinen tiedostomuoto. Käytä pohjaa." },

  // Interview guide (themed)
  "interviewGuide.title": { en: "Interview Guide", fi: "Haastattelurunko" },
  "interviewGuide.desc": { en: "Themed interview guide combining qualitative questions and outcome scoring", fi: "Teemoittainen haastattelurunko, joka yhdistää avoimet kysymykset ja tulosten pisteytyksen" },
  "interviewGuide.recommendedInterviews": { en: "Recommended interviews", fi: "Suositeltu haastattelumäärä" },
  "interviewGuide.theme": { en: "Theme", fi: "Teema" },
  "interviewGuide.openQuestions": { en: "Open questions", fi: "Avoimet kysymykset" },
  "interviewGuide.scoredOutcomes": { en: "Rate these needs (1-10): How important? How well solved today?", fi: "Arvioi nämä tarpeet (1-10): Kuinka tärkeää? Kuinka hyvin ratkaistu tällä hetkellä?" },
  "interviewGuide.closingQuestions": { en: "Closing questions", fi: "Loppukysymykset" },
  "interviewGuide.relatedSteps": { en: "Related steps", fi: "Liittyvät vaiheet" },
  "interviewGuide.regenerated": { en: "Interview guide updated to match your changes!", fi: "Haastattelurunko päivitetty vastaamaan muutoksiasi!" },
  "interviewGuide.regenerateFailed": { en: "Failed to update interview guide", fi: "Haastattelurungon päivitys epäonnistui" },
  "interviewGuide.regenerating": { en: "Updating interview guide to reflect your changes…", fi: "Päivitetään haastattelurunkoa muutostesi mukaiseksi…" },

  // Analysis scorecard
  "analysis.scorecard": { en: "Analysis Scorecard", fi: "Analyysin tuloskortti" },
  "analysis.topInsights": { en: "Key Insights", fi: "Keskeiset havainnot" },
  "analysis.actionItems": { en: "Action Items", fi: "Toimenpiteet" },

  // Sub-step navigation
  "substep.back": { en: "Back", fi: "Takaisin" },
  "substep.next": { en: "Next", fi: "Seuraava" },
  "substep.jobMap": { en: "Process Steps", fi: "Prosessivaiheet" },
  "substep.outcomes": { en: "Desired Outcomes", fi: "Tavoitellut tulokset" },
  "substep.interview": { en: "Interview Guide", fi: "Haastattelurunko" },
  "substep.approveAndProceed": { en: "Continue to Data Collection", fi: "Jatka tiedonkeruuseen" },
  "substep.indicator": { en: "{current}/{total} — {name}", fi: "{current}/{total} — {name}" },

  // Guided tour
  "tour.next": { en: "Next", fi: "Seuraava" },
  "tour.back": { en: "Back", fi: "Takaisin" },
  "tour.done": { en: "Got it!", fi: "Selvä!" },
  "tour.btn": { en: "Info Tour", fi: "Opastus" },

  // Framework tour
  "tour.fw.intro": {
    en: "Welcome to the AI Framework! This section maps out how your target customer currently performs the activity your product aims to improve — their work process, desired outcomes, and an interview guide to validate assumptions with real conversations.",
    fi: "Tervetuloa AI-kehykseen! Tämä osio kartoittaa, miten kohdeasiakkaasi tällä hetkellä suorittaa sen työn tai aktiviteetin, jota tuotteesi pyrkii parantamaan — heidän työvaiheensa, tavoitellut tulokset ja haastattelurunko oletusten validoimiseksi oikeilla keskusteluilla."
  },
  "tour.fw.jobmap": {
    en: "<strong>Process Steps</strong> map out what your target customer does <em>today, before your product exists</em>. These are their current habits, frustrations, and workarounds — NOT how they would use or set up your product. Your product should aim to improve one or more of these steps.",
    fi: "<strong>Prosessivaiheet</strong> kartoittavat, mitä kohdeasiakkaasi tekee <em>tänään, ennen kuin tuotettasi on olemassa</em>. Nämä ovat heidän nykyiset tapansa, turhautumisensa ja kiertotiensä — EIVÄT sitä, miten he käyttäisivät tai ottaisivat käyttöön tuotteesi. Tuotteesi tavoitteena on parantaa yhtä tai useampaa näistä vaiheista."
  },
  "tour.fw.outcomes": {
    en: "<strong>Desired Outcomes</strong> are the measurable results the job executor wants to achieve at each step. They're categorized as functional, emotional, or social needs. You'll later score these with real interview data to find unmet needs — the biggest opportunities for your product.",
    fi: "<strong>Tavoitellut tulokset</strong> ovat mitattavia tuloksia, joita työn suorittaja haluaa saavuttaa kussakin vaiheessa. Ne on luokiteltu toiminnallisiin, emotionaalisiin ja sosiaalisiin tarpeisiin. Myöhemmin pisteytät nämä oikealla haastatteludatalla löytääksesi tyydyttämättömät tarpeet — suurimmat mahdollisuudet tuotteellesi."
  },
  "tour.fw.interview": {
    en: "<strong>Interview Guide</strong> combines open-ended questions with outcome scoring into themed sections. Use this when interviewing your target customers to understand how they currently work and where the biggest pain points are. The goal is to learn, not to sell.",
    fi: "<strong>Haastattelurunko</strong> yhdistää avoimet kysymykset ja tulosten pisteytyksen teemoittaisiin osioihin. Käytä tätä haastatellessasi kohdeasiakkaitasi ymmärtääksesi, miten he työskentelevät tällä hetkellä ja missä suurimmat kipupisteet ovat. Tavoitteena on oppia, ei myydä."
  },
  "tour.fw.navigation": {
    en: "Use the <strong>Next</strong> and <strong>Back</strong> buttons at the bottom to navigate between Process Steps, Desired Outcomes, and Interview Guide. When you've reviewed everything, click <strong>Continue to Data Collection</strong> to proceed.",
    fi: "Käytä <strong>Seuraava</strong>- ja <strong>Takaisin</strong>-painikkeita alhaalla navigoidaksesi prosessivaiheiden, tavoiteltujen tulosten ja haastattelurungon välillä. Kun olet tarkistanut kaiken, klikkaa <strong>Jatka tiedonkeruuseen</strong> edetäksesi."
  },

  // Data Collection tour
  "tour.dc.intro": {
    en: "Welcome to <strong>Data Collection</strong>! This is where you record and organize your interview results. Let's walk through each section.",
    fi: "Tervetuloa <strong>tiedonkeruuseen</strong>! Täällä tallennat ja järjestät haastattelutuloksesi. Käydään läpi jokainen osio."
  },
  "tour.dc.databank": {
    en: "The <strong>Interview Data Bank</strong> stores your raw interview notes. Upload documents or paste notes from each interview — this is your qualitative data archive that you can refer back to anytime.",
    fi: "<strong>Haastattelumuistiinpanopankki</strong> tallentaa raakahaastattelumuistiinpanosi. Lataa dokumentteja tai liitä muistiinpanot jokaisesta haastattelusta — tämä on laadullinen data-arkistosi, johon voit palata milloin tahansa."
  },
  "tour.dc.respondents": {
    en: "<strong>Respondent Scores</strong> shows all previously saved interview results organized by interviewee. You can review each person's importance and satisfaction ratings at a glance.",
    fi: "<strong>Vastaajien pisteet</strong> näyttää kaikki aiemmin tallennetut haastattelutulokset haastateltavan mukaan järjestettyinä. Voit tarkastella kunkin henkilön tärkeys- ja tyytyväisyysarvioita yhdellä silmäyksellä."
  },
  "tour.dc.scoring": {
    en: "<strong>Add Interview Results</strong> — for each interviewee: 1) Enter their name, 2) Adjust importance & satisfaction sliders for every outcome, 3) Click Add. More respondents = more reliable analysis.",
    fi: "<strong>Lisää haastattelutulokset</strong> — jokaiselle haastateltavalle: 1) Syötä nimi, 2) Säädä tärkeys- ja tyytyväisyysliukusäätimet jokaiselle tarpeelle, 3) Klikkaa Lisää. Enemmän vastaajia = luotettavampi analyysi."
  },
  "tour.dc.import": {
    en: "<strong>Import Scores from File</strong> — if you have lots of data, download the Excel/CSV template, fill it in, and upload it here. This is much faster than entering scores one by one.",
    fi: "<strong>Tuo pisteet tiedostosta</strong> — jos sinulla on paljon dataa, lataa Excel/CSV-pohja, täytä se ja lataa se tänne. Tämä on paljon nopeampaa kuin pisteiden syöttäminen yksitellen."
  },
  "tour.dc.market": {
    en: "<strong>Market Information</strong> lets you add optional context about market size and competitors. This enriches the AI analysis with broader market perspective.",
    fi: "<strong>Markkinatiedot</strong> antaa sinun lisätä valinnaista kontekstia markkinan koosta ja kilpailijoista. Tämä rikastaa tekoälyanalyysiä laajemmalla markkinanäkökulmalla."
  },
  "tour.dc.complete": {
    en: "When you've entered enough interview data, click <strong>Complete Data Collection & Analyze</strong>. The AI will analyze your results, generate positioning strategy, and create sales messages — all automatically!",
    fi: "Kun olet syöttänyt tarpeeksi haastatteludataa, klikkaa <strong>Viimeistele tiedonkeruu ja analysoi</strong>. Tekoäly analysoi tuloksesi, generoi positiointistrategian ja luo myyntiviestit — kaikki automaattisesti!"
  },

  // Analysis tour
  "tour.an.intro": {
    en: "Welcome to the <strong>Analysis</strong> view! Here you'll find AI-generated insights from your collected data — unmet needs, recommendations, positioning, and sales materials.",
    fi: "Tervetuloa <strong>Analyysi</strong>-näkymään! Täältä löydät tekoälyn generoima oivalluksia keräämästäsi datasta — tyydyttämättömät tarpeet, suositukset, positioinnin ja myyntimateriaalit."
  },
  "tour.an.summary": {
    en: "The <strong>Executive Summary</strong> gives you a high-level AI overview of your findings — the key takeaway from all your interview and scoring data.",
    fi: "<strong>Yhteenveto</strong> antaa sinulle tekoälyn korkean tason yleiskuvan tuloksistasi — keskeiset oivallukset kaikesta haastattelu- ja pisteytydatastasi."
  },
  "tour.an.unmet": {
    en: "The <strong>Unmet Needs</strong> table ranks outcomes by opportunity score (high importance + low satisfaction = big opportunity). Focus your product development on the top-ranked needs.",
    fi: "<strong>Tyydyttämättömät tarpeet</strong> -taulukko asettaa tulokset järjestykseen mahdollisuuspisteen mukaan (korkea tärkeys + matala tyytyväisyys = suuri mahdollisuus). Kohdista tuotekehityksesi korkeimmin sijoittuneisiin tarpeisiin."
  },
  "tour.an.gonogo": {
    en: "The <strong>GO / NO-GO</strong> scorecard is AI's verdict: should you proceed with this idea based on the data? It considers the strength and count of unmet needs.",
    fi: "<strong>GO / NO-GO</strong> -tuloskortti on tekoälyn arvio: pitäisikö sinun jatkaa tätä ideaa datan perusteella? Se huomioi tyydyttämättömien tarpeiden vahvuuden ja määrän."
  },
  "tour.an.charts": {
    en: "These <strong>charts</strong> visualize opportunity landscape (importance vs. satisfaction scatter plot) and respondent variance — helping you spot patterns and disagreements in the data.",
    fi: "Nämä <strong>kaaviot</strong> visualisoivat mahdollisuuskenttää (tärkeys vs. tyytyväisyys -hajontakaavio) ja vastaajien varianssia — auttaen sinua havaitsemaan kuvioita ja eroavaisuuksia datassa."
  },
  "tour.an.recommendations": {
    en: "<strong>Recommendations</strong> are prioritized action items generated by AI. Each one is linked to specific unmet needs and includes a priority level.",
    fi: "<strong>Suositukset</strong> ovat priorisoituja toimenpide-ehdotuksia tekoälyltä. Jokainen on linkitetty tiettyihin tyydyttämättömiin tarpeisiin ja sisältää prioriteettitason."
  },
  "tour.an.positioning": {
    en: "The <strong>Positioning Strategy</strong> section generates a positioning statement, value hierarchy, and competitive analysis based on your strongest opportunities. You can regenerate it anytime.",
    fi: "<strong>Positiointistrategia</strong> generoi positiointilauseen, arvohierarkian ja kilpailuanalyysin vahvimpien mahdollisuuksiesi perusteella. Voit generoida sen uudelleen milloin tahansa."
  },
  "tour.an.sales": {
    en: "<strong>Sales Messages</strong> include an elevator pitch and cold email template — ready-to-use materials based on your positioning. Copy them directly or regenerate for a fresh version.",
    fi: "<strong>Myyntiviestit</strong> sisältävät hissipuheen ja kylmäsähköpostipohjan — käyttövalmiit materiaalit positiointisi perusteella. Kopioi ne suoraan tai generoi uudelleen."
  },

  // Landing page
  "landing.heroTitle": {
    en: "Validate Product Ideas with Data, Not Guesswork",
    fi: "Validoi tuoteideat datalla, älä arvailulla"
  },
  "landing.heroSubtitle": {
    en: "An open-source platform that guides you through needs-based research — from idea to positioning strategy, powered by AI.",
    fi: "Avoimen lähdekoodin alusta, joka ohjaa sinut tarvelähtöisen tutkimuksen läpi — ideasta positiointistrategiaan, tekoälyn avulla."
  },
  "landing.getStarted": { en: "Get Started Free", fi: "Aloita ilmaiseksi" },
  "landing.goToDashboard": { en: "Go to Dashboard", fi: "Siirry hallintapaneeliin" },
  "landing.viewOnGithub": { en: "View on GitHub", fi: "Katso GitHubissa" },
  "landing.videoTitle": { en: "Watch a 30-Second Overview", fi: "Katso 30 sekunnin yleiskatsaus" },
  "landing.videoSubtitle": {
    en: "See what the platform delivers — from customer research to a Go/No-Go decision.",
    fi: "Katso mitä työkalu tarjoaa — asiakastutkimuksesta Go/No-Go-päätökseen."
  },
  "landing.videoPlaceholder": { en: "Demo video coming soon", fi: "Demovideo tulossa pian" },
  "landing.howTitle": { en: "How It Works", fi: "Näin se toimii" },
  "landing.howSubtitle": {
    en: "Four steps from raw idea to actionable market insight.",
    fi: "Neljä askelta raakasta ideasta toimintakelpoiseen markkinaoivallukseen."
  },
  "landing.step1Title": { en: "Describe Your Idea", fi: "Kuvaile ideasi" },
  "landing.step1Desc": {
    en: "Enter your product concept, target audience, and industry. AI generates a research framework with a process map, success criteria, and interview guide.",
    fi: "Syötä tuotekonseptisi, kohdeyleisö ja toimiala. Tekoäly generoi tutkimuskehyksen, jossa on prosessikartta, onnistumiskriteerit ja haastattelurunko."
  },
  "landing.step2Title": { en: "Collect Data", fi: "Kerää dataa" },
  "landing.step2Desc": {
    en: "Interview potential customers using the AI-generated guide. Score outcomes on importance and satisfaction. Import notes or enter them manually.",
    fi: "Haastattele potentiaalisia asiakkaita tekoälyn generoimalla rungolla. Pisteytä tulokset tärkeyden ja tyytyväisyyden mukaan. Tuo muistiinpanot tai syötä ne manuaalisesti."
  },
  "landing.step3Title": { en: "Analyze Results", fi: "Analysoi tulokset" },
  "landing.step3Desc": {
    en: "AI identifies unmet needs, calculates need-gap scores, and delivers a GO/NO-GO recommendation with prioritized action items.",
    fi: "Tekoäly tunnistaa tyydyttämättömät tarpeet, laskee tarvekuilupisteet ja antaa GO/NO-GO-suosituksen priorisoiduilla toimenpiteillä."
  },
  "landing.step4Title": { en: "Position & Sell", fi: "Positioi ja myy" },
  "landing.step4Desc": {
    en: "Get an AI-generated go-to-market strategy, value hierarchy, elevator pitch, and cold email — all based on your strongest opportunities.",
    fi: "Saat tekoälyn generoiman markkinoillenostrategian, arvohierarkian, hissipuheen ja kylmäsähköpostin — kaikki perustuen vahvimpiin mahdollisuuksiisi."
  },
  "landing.ossTitle": { en: "Open Source", fi: "Avoin lähdekoodi" },
  "landing.ossDesc": {
    en: "This platform is fully open source. Explore the code, contribute features, report bugs, or fork it and make it your own. Built with React, TypeScript, and Supabase.",
    fi: "Tämä alusta on täysin avointa lähdekoodia. Tutki koodia, kontribuoi ominaisuuksia, raportoi bugeja tai forkkaa ja tee siitä omasi. Rakennettu Reactilla, TypeScriptillä ja Supabasella."
  },
  "landing.contribute": { en: "Contribute", fi: "Kontribuoi" },
  "landing.footerOss": { en: "Open Source Project", fi: "Avoimen lähdekoodin projekti" },
} as const;

export type TranslationKey = keyof typeof translations;