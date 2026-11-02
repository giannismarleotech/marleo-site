export const GROUPS = ['Bedrijfsgegevens', 'Doelen en prioriteiten', 'Doelgroep en werkgebied', 'Zoekwoorden en zoekvragen', 'Concurrenten en uitstraling', 'Inhoud en bestaande website', 'Toegang en opvolging'];
export const QUESTIONS = [
  ['company',0,'Wat is je bedrijfsnaam en websiteadres?','Bedrijfsnaam en https://…',true],
  ['contact',0,'Wie is onze contactpersoon voor dit project?','Naam, e-mailadres en telefoonnummer',true],
  ['description',0,'Wat doet jouw bedrijf en wat onderscheidt je van concurrenten?','Vertel het in je eigen woorden.'],
  ['goals',1,'Wat wil je vooral bereiken met SEO?','Bijvoorbeeld offerteaanvragen, telefoontjes, afspraken, webshopverkopen of bezoekers in je zaak.',true],
  ['services',1,'Welke drie diensten of productgroepen hebben prioriteit?','Zet de belangrijkste bovenaan.'],
  ['commercial',1,'Welke opdrachten of producten zijn commercieel het interessantst?','Denk aan rendabiliteit, beschikbare capaciteit en gewenste groei.'],
  ['unwanted',1,'Welke aanvragen wil je minder of helemaal niet ontvangen?','Bijvoorbeeld bepaalde diensten, regio’s of soorten opdrachten.'],
  ['success',1,'Wanneer zou dit SEO-traject voor jou geslaagd zijn?','Huidige resultaten, gewenste verbetering en eventuele deadlines.'],
  ['audience',2,'Wie is jouw ideale klant?','Particulieren of bedrijven, sector, bedrijfsgrootte, functie en behoeften.'],
  ['regions',2,'In welke steden, regio’s of landen wil je klanten aantrekken?','Zet ze in volgorde van belang.'],
  ['locations',2,'Heb je vestigingen of bezoek je klanten op locatie?','Vermeld de adressen en je werkgebied.'],
  ['languages',2,'In welke talen wil je gevonden worden?','Vermeld de talen waarin je klanten daadwerkelijk kunt helpen.'],
  ['keywords',3,'Welke zoekwoorden zouden klanten volgens jou gebruiken?','Vermeld vijf tot tien voorbeelden, liefst één per regel.'],
  ['synonyms',3,'Welke andere benamingen gebruiken klanten voor je diensten?','Denk aan spreektaal, merken, materialen en specifieke toepassingen.'],
  ['questions',3,'Welke vragen stellen klanten voordat ze bestellen of contact opnemen?','Schrijf enkele veelgestelde vragen op.'],
  ['problems',3,'Welke problemen willen klanten oplossen wanneer ze bij jou terechtkomen?','Wat is de aanleiding om jouw hulp te zoeken?'],
  ['excluded',3,'Met welke zoekwoorden of onderwerpen wil je niet geassocieerd worden?','Vermeld ook diensten die je niet aanbiedt.'],
  ['seasonal',3,'Zijn bepaalde diensten seizoensgebonden?','Belangrijke maanden, evenementen of periodes.'],
  ['competitors',4,'Welke drie bedrijven zijn je belangrijkste concurrenten?','Voeg hun website toe en vertel kort waarom.'],
  ['examples',4,'Welke websites vind je goed en waarom?','Wat spreekt je aan in de inhoud, uitstraling of uitleg?'],
  ['tone',4,'Welke toon moet de website gebruiken?','Bijvoorbeeld zakelijk, toegankelijk, technisch, luxueus of persoonlijk. Welke woorden of claims vermijden we?'],
  ['pages',5,'Welke pagina’s moeten verbeterd worden en wat moet behouden blijven?','Vermeld indien mogelijk de pagina-adressen.'],
  ['materials',5,'Welk materiaal kunnen we gebruiken?','Eigen foto’s, projecten, beoordelingen, certificaten, productinformatie en veelgestelde vragen. Je hoeft hier geen bestanden te uploaden.'],
  ['approval',5,'Mogen we nieuwe teksten of pagina’s voorstellen en wie keurt die goed?','Denk aan dienstpagina’s, regiopagina’s en kennisartikelen.'],
  ['changes',5,'Zijn er recente wijzigingen of problemen met de website?','Bijvoorbeeld een nieuwe domeinnaam, vernieuwde site, verdwenen pagina’s of minder aanvragen.'],
  ['systems',6,'Welke systemen en websitebeheerder gebruik je?','Websiteplatform, webshop, boekingssysteem en contactpersoon indien bekend.'],
  ['access',6,'Tot welke accounts heb je toegang?','Antwoord met ja, nee of onbekend: websitebeheer, Google Search Console, Google Analytics, Google Bedrijfsprofiel en Google Tag Manager. Stuur geen wachtwoorden of API-sleutels.'],
  ['measurement',6,'Welke resultaten moeten we opvolgen en hoe ontvang je aanvragen?','Bijvoorbeeld contactformulier, telefoon, WhatsApp, boekingssysteem of webshop.'],
  ['notes',6,'Zijn er aanvullende wensen, afspraken of beperkingen?','Denk aan budget voor extra inhoud, publicatiegoedkeuring en geplande wijzigingen.']
].map(([id,group,label,hint,required=false],index)=>({id,group,label,hint,required,number:index+1}));
export function validateAnswers(input, final=false) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Ongeldige antwoorden.');
  const answers = Object.create(null);
  for (const q of QUESTIONS) {
    const value = input[q.id] ?? '';
    if (typeof value !== 'string' || value.length > 3000) throw new Error('Antwoord '+q.number+' mag maximaal 3000 tekens bevatten.');
    answers[q.id] = value.trim();
    if (final && q.required && !answers[q.id]) throw new Error('Vul vraag '+q.number+' in: '+q.label);
  }
  return answers;
}
export function answeredCount(answers={}) { return QUESTIONS.filter(q=>typeof answers[q.id]==='string' && answers[q.id].trim()).length; }
export function seoBrief(row) {
  return '# SEO-briefing — '+row.customer_name+'\n\n'+QUESTIONS.map(q=>'## '+q.number+'. '+q.label+'\n'+((row.answers||{})[q.id]||'Nog niet ingevuld')+'\n').join('\n')+
    '\n## Interne SEO-notities\n'+(row.seo_notes||'')+'\n\n## Gekozen prioritaire zoekwoorden\n'+(row.priority_keywords||'')+'\n';
}
