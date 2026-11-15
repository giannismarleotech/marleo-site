"""Recent client websites and the Airmasters platform project scope."""
LABELS = {
'en': ('Recent work', 'Websites and business platforms', 'Explore the project', 'Project scope', 'Visit website', 'Back to work'),
'nl': ('Recent werk', 'Websites en bedrijfsplatformen', 'Ontdek het project', 'Projectomvang', 'Bekijk de website', 'Terug naar projecten'),
'fr': ('Projets récents', 'Sites web et plateformes métier', 'Découvrir le projet', 'Périmètre du projet', 'Voir le site', 'Tous les projets')}
PROJECTS = [
{'slug':'airmasters','name':'Airmasters','url':'https://airmasters.be','tag':'WEBSITE / CRM / OPERATIONS',
'en':'An industrial website and a custom CRM project covering the office, project management and teams on site.',
'nl':'Een industriële website en een CRM-project op maat voor de administratie, projectopvolging en medewerkers op de werf.',
'fr':'Un site industriel et un projet CRM sur mesure pour l’administration, les projets et les équipes sur chantier.'},
{'slug':'ab-firestop','name':'AB Firestop','url':'https://abfirestop.be','tag':'WEBSITE / SEO / DASHBOARD',
'en':'A multilingual website for passive fire protection, with SEO and a dashboard for editing content and viewing website statistics.',
'nl':'Een meertalige website voor passieve brandbescherming, met SEO en een dashboard om inhoud aan te passen en websitestatistieken te bekijken.',
'fr':'Un site multilingue consacré à la protection incendie passive, avec SEO et tableau de bord pour modifier les contenus et consulter les statistiques.'},
{'slug':'ovh-construct','name':'OVH Construct','url':'https://ovhconstruct.be','tag':'WEBSITE / DESIGN / MOBILE',
'en':'A custom website showcasing welding, metalwork and completed projects, with a clear route to a project enquiry.',
'nl':'Een website op maat voor laswerken en metaalbewerking, met realisaties in beeld en een duidelijke weg naar een projectaanvraag.',
'fr':'Un site sur mesure présentant la soudure, le travail du métal et les réalisations, avec un accès clair aux demandes de projet.'}]
SCOPE = {
'en': [
('Website & visibility','Industrial visual identity, services, project portfolio, recruitment, multilingual content and SEO. Website statistics and incoming enquiries are part of the platform scope.'),
('Customers & sales','Customer records, leads, follow-up, quotes and digital signing. Keep commercial information connected to the relevant customer and project.'),
('Projects & site reports','Project files, photo reports, notes with images, work reports and assigned employees. Mobile access to project information and site updates.'),
('Planning & people','Employee and vehicle planning, user accounts and permissions, clocking in and out, timesheets, mileage and driver registration. Absence reporting with document uploads.'),
('Finance & reporting','Invoices, credit notes, purchase orders, delivery notes, reminders and expenses. Project budgets bring together labour costs and purchases; reporting includes projects, finance, hours, mileage and regional filters.'),
('Documents & communication','A shared document workspace with folders, files and project access. Email, email marketing, social content and publication workflows belong to the same project scope.'),
('Integration & AI scope','Peppol and banking integrations, plus an AI assistant for support and drafting quotes, invoices and social content. This scope describes the integration and automation requirements of the platform; it is not a claim of live transaction processing.')],
'nl': [
('Website & zichtbaarheid','Industriële uitstraling, diensten, realisaties, vacatures, meertalige inhoud en SEO. Ook websitestatistieken en binnenkomende aanvragen maken deel uit van de platformscope.'),
('Klanten & verkoop','Klantendossiers, leads, opvolging, offertes en digitaal ondertekenen. Commerciële informatie verbonden met de juiste klant en het juiste project.'),
('Projecten & werfverslagen','Projectdossiers, fotoverslagen, notities met afbeeldingen, werkrapporten en toegewezen medewerkers. Mobiele toegang tot projectinformatie en updates vanop de werf.'),
('Planning & medewerkers','Planning van medewerkers en bedrijfswagens, accounts en rechten, in- en uitklokken, urenstaten, kilometers en registratie van de chauffeur. Afwezigheden melden met upload van documenten.'),
('Financiën & rapportage','Facturen, creditnota’s, bestelbonnen, leveringsbonnen, herinneringen en uitgaven. Projectbudgetten met loonkosten en aankopen; rapporten over projecten, financiën, uren en kilometers, met regionale filters.'),
('Documenten & communicatie','Een gedeelde documentomgeving met mappen, bestanden en toegang per project. E-mail, e-mailmarketing, sociale content en publicatieworkflows behoren tot dezelfde projectomvang.'),
('Koppelingen & AI','Peppol- en bankkoppelingen, aangevuld met een AI-assistent voor ondersteuning en het opstellen van offertes, facturen en sociale content. Deze scope beschrijft de integratie- en automatiseringsvereisten van het platform.')],
'fr': [
('Site & visibilité','Identité industrielle, services, réalisations, recrutement, contenu multilingue et SEO. Les statistiques du site et les demandes entrantes font partie du périmètre.'),
('Clients & ventes','Dossiers clients, prospects, suivi commercial, devis et signature numérique, reliés aux clients et aux projets concernés.'),
('Projets & rapports de chantier','Dossiers de projet, rapports photo, notes illustrées, rapports de travaux et attribution des équipes. Accès mobile aux informations et mises à jour sur chantier.'),
('Planning & personnel','Planification des équipes et véhicules, comptes et droits, pointage, feuilles de temps, kilomètres et conducteurs. Déclaration des absences avec dépôt de documents.'),
('Finances & rapports','Factures, notes de crédit, bons de commande et de livraison, rappels et dépenses. Budgets par projet avec coûts de personnel et achats; rapports financiers, projets, heures et kilomètres avec filtres régionaux.'),
('Documents & communication','Espace documentaire partagé avec dossiers, fichiers et accès par projet. E-mail, campagnes e-mail, contenus sociaux et processus de publication dans le même périmètre.'),
('Intégrations & IA','Intégrations Peppol et bancaires, avec un assistant IA pour l’aide et la rédaction de devis, factures et contenus sociaux. Ce périmètre décrit les besoins d’intégration et d’automatisation de la plateforme.')]
}
# Describe scope consistently rather than claiming unverified operational readiness.
SCOPE['en'][-1] = ('Integration & AI scope','Peppol and banking integrations, plus an AI assistant for support and drafting quotes, invoices and social content. The scope covers the platform’s integration and automation requirements.')

STYLE = """<style>
.recent-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}.recent-card{display:flex;flex-direction:column;border:1px solid #ffffff20;border-radius:18px;overflow:hidden;background:#101015;color:inherit;text-decoration:none;transition:transform .2s,border-color .2s}.recent-card:hover{transform:translateY(-4px);border-color:#ff7147}.recent-card:focus-visible{outline:3px solid #ff7147;outline-offset:5px}.recent-image{width:100%;height:260px;object-fit:cover;display:block}.recent-copy{padding:25px}.recent-copy h3{font-size:28px;margin:14px 0}.recent-copy p{color:#b9b9c6;line-height:1.65}.recent-copy .more{display:block;margin-top:24px;color:#ff8757}.project-visual{margin:0 0 40px;border-radius:18px;overflow:hidden;border:1px solid #ffffff20}.project-visual img{width:100%;max-height:600px;object-fit:cover;display:block}.project-visual figcaption{padding:16px 24px;color:#b9b9c6;background:#101015}.work-example{padding:28px;border:1px solid #ffffff20;border-radius:16px;background:linear-gradient(125deg,#ff76120a,#f0147d08)}.work-example summary{cursor:pointer;font-size:20px;font-weight:650;line-height:1.5}.work-example p{line-height:1.7;color:#b9b9c6;margin-top:18px}.work-example summary::marker{color:#ff7147}.example-step{display:block;color:#ff8757;font-size:12px;letter-spacing:.15em;margin-bottom:12px}.example-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}@media(max-width:900px){.recent-grid{grid-template-columns:1fr}.recent-image{height:300px}.recent-copy{padding:22px}}@media(max-width:600px){.example-grid{grid-template-columns:1fr}.recent-image{height:230px}.project-visual img{max-height:360px}.work-example{padding:22px}}
</style>"""
EXAMPLES={
'en':('Workflow examples', [('An enquiry becomes a customer file','A request for a ventilation installation is recorded with contact details, site information and documents. The sales team can follow up from one customer file.'),('From quote to planned work','The quote and project information stay together. Planning assigns the team and vehicle, so the office and site crew work from the same project context.'),('Site updates become project information','Employees record time, add photos and prepare a site report. The office can use these inputs for project follow-up and budget monitoring.'),('From project costs to invoicing','Hours and purchases provide context for costs, reporting and invoice preparation. Documents remain linked to the relevant project.')]),
'nl':('Voorbeelden van de werking',[('Een aanvraag wordt een klantendossier','Een aanvraag voor een ventilatie-installatie wordt geregistreerd met contactgegevens, werfinformatie en documenten. De verkoop volgt alles vanuit één klantendossier op.'),('Van offerte naar ingepland werk','Offerte en projectinformatie blijven samen. De planning koppelt een ploeg en bedrijfswagen, zodat kantoor en werf vanuit dezelfde projectinformatie werken.'),('Werfupdates worden projectinformatie','Medewerkers registreren uren, voegen foto’s toe en maken een werfverslag. Het kantoor gebruikt deze informatie voor projectopvolging en budgetcontrole.'),('Van projectkosten naar facturatie','Uren en aankopen vormen de basis voor kostenopvolging, rapportage en het voorbereiden van facturen. Documenten blijven gekoppeld aan het juiste project.')]),
'fr':('Exemples de fonctionnement',[('Une demande devient un dossier client','Une demande de ventilation rassemble les coordonnées, les informations du chantier et les documents dans un dossier client commun.'),('Du devis au planning','Le devis reste lié au projet. Le planning attribue une équipe et un véhicule pour partager le même contexte entre le bureau et le chantier.'),('Les mises à jour enrichissent le projet','Les équipes enregistrent les heures, ajoutent des photos et préparent un rapport de chantier pour le suivi des travaux et du budget.'),('Des coûts à la facturation','Les heures et les achats alimentent le suivi des coûts, les rapports et la préparation des factures. Les documents restent liés au projet.')])}

def listing(lang,g):
    E=g['E']; u=g['url']; labels=LABELS[lang]
    cards=''.join('<a class="recent-card" href="%s"><img class="recent-image" src="/assets/work/%s-project.webp" alt="%s" width="1440" height="1080" loading="lazy" decoding="async"><div class="recent-copy"><span class="ab">%s</span><h3>%s</h3><p>%s</p><span class="more">%s →</span></div></a>'%(u(lang,'projecten/'+p['slug']),p['slug'],E(p['name']),E(p['tag']),E(p['name']),E(p[lang]),E(labels[2])) for p in PROJECTS)
    return STYLE+'<section class="sec" style="padding-top:0"><div class="wrap">'+g['sec_head'](labels[0],labels[1])+'<div class="recent-grid">'+cards+'</div></div></section>'

def detail(lang,p,g):
    E=g['E']; labels=LABELS[lang]; slug='projecten/'+p['slug']
    out=STYLE+g['phero'](lang,slug,labels[0],p['name'],p[lang],acts=False)
    caption={'en':'Project imagery from the website','nl':'Projectbeeld uit de website','fr':'Visuel du projet issu du site'}[lang]
    out+='<section class="sec" style="padding-top:0"><div class="wrap"><figure class="project-visual"><img src="/assets/work/%s-project.webp" alt="%s" width="1440" height="1080" fetchpriority="high"><figcaption>%s · %s</figcaption></figure><div class="acts"><a class="btn btn-p" href="%s" target="_blank" rel="noopener">%s</a><a class="btn btn-g" href="%s">%s</a></div></div></section>'%(p['slug'],E(p['name']),E(p['name']),caption,p['url'],E(labels[4]),g['url'](lang,'projecten'),E(labels[5]))
    if p['slug']=='airmasters':
        heading,examples=EXAMPLES[lang]
        out+='<section class="sec" style="padding-top:0"><div class="wrap">'+g['sec_head'](None,heading)+'<div class="example-grid">'+''.join('<details class="work-example" open><summary><span class="example-step">0%s</span>%s</summary><p>%s</p></details>'%(i+1,E(t),E(b)) for i,(t,b) in enumerate(examples))+'</div></div></section>'
        cards=''.join('<article class="card"><h3>%s</h3><p>%s</p></article>'%(E(t),E(b)) for t,b in SCOPE[lang])
        out+='<section class="sec" style="padding-top:0"><div class="wrap">'+g['sec_head'](None,labels[3])+'<div class="grid g2">'+cards+'</div></div></section>'
    return g['page'](lang,slug,p['name']+' · Marleo',p[lang],out+g['band'](lang))
