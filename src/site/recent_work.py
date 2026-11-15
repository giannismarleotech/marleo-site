"""Recent client websites and the Airmasters platform project scope."""
from client_stories import STORIES, story

LABELS = {
'en': ('Recent work', 'Websites and business platforms', 'Explore the project', 'Project scope', 'Visit website', 'Back to work'),
'nl': ('Recent werk', 'Websites en bedrijfsplatformen', 'Ontdek het project', 'Projectomvang', 'Bekijk de website', 'Terug naar projecten'),
'fr': ('Projets récents', 'Sites web et plateformes métier', 'Découvrir le projet', 'Périmètre du projet', 'Voir le site', 'Tous les projets')}
PROJECTS = [
{'slug':'airmasters','name':'Air Masters','url':'https://airmasters.be','tag':'WEBSITE / CRM / OPERATIONS',
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
WEBSITE_SECTORS = {
    'airmasters': {'en': 'Ventilation & HVAC', 'nl': 'Ventilatie & HVAC', 'fr': 'Ventilation & HVAC'},
    'ab-firestop': {'en': 'Passive fire protection', 'nl': 'Passieve brandbescherming', 'fr': 'Protection incendie passive'},
}
WEBSITE_CARDS = [
    {**p, 'img': p['slug'],
     **{lang: (sector, p[lang]) for lang, sector in WEBSITE_SECTORS[p['slug']].items()}}
    for p in PROJECTS if p['slug'] in WEBSITE_SECTORS
]

CRM = {
    'nl': ('Wat we bouwden voor het Air Masters CRM',
           'Het CRM volgt een project van de eerste aanvraag tot het werfverslag en de administratie. Medewerkers op de werf en collega’s op kantoor werken vanuit hetzelfde dossier.',
           [
            ('Klanten, leads en offertes', 'Het klantendossier verzamelt contactgegevens, aanvragen en opvolging. Offertes blijven gekoppeld aan de klant en het project, met digitaal ondertekenen in de verkoopflow.'),
            ('Projectdossiers en werfverslagen', 'Per werf is er een dossier met taken, notities, documenten, mappen en foto’s. Techniekers kunnen onderweg uren, foto’s en updates toevoegen voor kantoor.'),
            ('Planning, ploegen en voertuigen', 'De planning koppelt medewerkers en bedrijfswagens aan een werf. Uren, in- en uitklokken, kilometers en chauffeur worden per opdracht geregistreerd. Medewerkers hebben een eigen account en kunnen afwezigheden melden.'),
            ('Facturatie, kosten en rapportage', 'De administratieve flow omvat facturen, creditnota’s, bestelbonnen, leveringsbonnen, herinneringen en uitgaven. In het projectbudget komen loonkosten en aankopen samen. Rapporten geven zicht op projecten, uren, kilometers en kosten.'),
            ('Documenten en communicatie', 'Een gedeelde documentomgeving houdt bestanden bij het juiste dossier. Ook websiteaanvragen, e-mailopvolging, e-mailmarketing en sociale publicaties zijn opgenomen in de projectopzet.'),
            ('Koppelingen en AI', 'Voor de integraties omvat de projectopzet Peppol, bankgegevens en een AI-assistent die helpt bij vragen en het opstellen van offertes en andere documenten.'),
           ]),
    'en': ('What we built for the Air Masters CRM',
           'The CRM follows work from the initial enquiry through site reporting and administration. Field teams and office staff work from the same project file.',
           [
            ('Customers, leads and quotes', 'Customer records collect contact details, enquiries and follow-up. Quotes stay linked to the customer and project, with digital signing in the sales workflow.'),
            ('Project files and site reports', 'Each site has a project file with tasks, notes, documents, folders and photos. Technicians can add hours, photos and progress updates on the go.'),
            ('Scheduling, teams and vehicles', 'Scheduling assigns staff and company vehicles to each site. The workflow records working hours, clock-ins and clock-outs, mileage and drivers. Employees have their own accounts and can report absences.'),
            ('Invoicing, costs and reporting', 'The administrative workflow covers invoices, credit notes, purchase orders, delivery notes, reminders and expenses. Project budgets bring together labour and purchasing costs. Reports cover projects, hours, mileage and costs.'),
            ('Documents and communication', 'A shared document workspace keeps files linked to the right project. Website enquiries, email follow-up, email marketing and social publishing are also part of the project design.'),
            ('Integrations and AI', 'The integration scope covers Peppol, banking data and an AI assistant for questions and drafting quotes and other documents.'),
           ]),
    'fr': ('Ce que nous avons conçu pour le CRM Air Masters',
           'Le CRM suit les projets depuis la première demande jusqu’au rapport de chantier et à la gestion administrative. Les équipes sur le terrain et au bureau travaillent à partir du même dossier.',
           [
            ('Clients, prospects et devis', 'Le dossier client rassemble coordonnées, demandes et suivi. Les devis restent liés au client et au chantier, avec une étape de signature électronique.'),
            ('Dossiers et rapports de chantier', 'Chaque chantier dispose d’un dossier avec tâches, notes, documents, dossiers et photos. Les techniciens peuvent ajouter leurs heures, des photos et des mises à jour depuis le terrain.'),
            ('Planning, équipes et véhicules', 'Le planning affecte les équipes et les véhicules aux chantiers. Il permet de suivre les heures, le pointage, les kilomètres et les conducteurs. Chaque collaborateur dispose de son compte et peut déclarer ses absences.'),
            ('Facturation, coûts et rapports', 'La gestion administrative couvre les factures, notes de crédit, bons de commande, bons de livraison, rappels et dépenses. Le budget réunit les coûts de personnel et les achats. Les rapports suivent les projets, les heures, les kilomètres et les coûts.'),
            ('Documents et communication', 'Un espace partagé relie les documents aux dossiers concernés. Les demandes du site, le suivi par e-mail, les campagnes et les publications sociales font aussi partie de la conception.'),
            ('Intégrations et IA', 'Le périmètre des intégrations comprend Peppol, les données bancaires et un assistant IA pour répondre aux questions et préparer des devis et autres documents.'),
           ]),
}

STYLE = """<style>
.recent-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}.recent-card{display:flex;flex-direction:column;border:1px solid #ffffff20;border-radius:18px;overflow:hidden;background:#101015;color:inherit;text-decoration:none;transition:transform .2s,border-color .2s}.recent-card:hover{transform:translateY(-4px);border-color:#ff7147}.recent-card:focus-visible{outline:3px solid #ff7147;outline-offset:5px}.recent-image{width:100%;height:260px;object-fit:cover;display:block}.recent-copy{padding:25px}.recent-copy h3{font-size:28px;margin:14px 0}.recent-copy p{color:#b9b9c6;line-height:1.65}.recent-copy .more{display:block;margin-top:24px;color:#ff8757}.project-visual{margin:0 0 40px;border-radius:18px;overflow:hidden;border:1px solid #ffffff20}.project-visual img{width:100%;max-height:600px;object-fit:cover;display:block}.project-visual figcaption{padding:16px 24px;color:#b9b9c6;background:#101015}.work-example{padding:28px;border:1px solid #ffffff20;border-radius:16px;background:linear-gradient(125deg,#ff76120a,#f0147d08)}.work-example summary{cursor:pointer;font-size:20px;font-weight:650;line-height:1.5}.work-example p{line-height:1.7;color:#b9b9c6;margin-top:18px}.work-example summary::marker{color:#ff7147}.example-step{display:block;color:#ff8757;font-size:12px;letter-spacing:.15em;margin-bottom:12px}.example-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}@media(max-width:900px){.recent-grid{grid-template-columns:1fr}.recent-image{height:300px}.recent-copy{padding:22px}}@media(max-width:600px){.example-grid{grid-template-columns:1fr}.recent-image{height:230px}.project-visual img{max-height:360px}.work-example{padding:22px}}
</style>"""
EXAMPLES={
'en':('Workflow examples', [('An enquiry becomes a customer file','A request for a ventilation installation is recorded with contact details, site information and documents. The sales team can follow up from one customer file.'),('From quote to planned work','The quote and project information stay together. Planning assigns the team and vehicle, so the office and site crew work from the same project context.'),('Site updates become project information','Employees record time, add photos and prepare a site report. The office can use these inputs for project follow-up and budget monitoring.'),('From project costs to invoicing','Hours and purchases provide context for costs, reporting and invoice preparation. Documents remain linked to the relevant project.')]),
'nl':('Voorbeelden van de werking',[('Een aanvraag wordt een klantendossier','Een aanvraag voor een ventilatie-installatie wordt geregistreerd met contactgegevens, werfinformatie en documenten. De verkoop volgt alles vanuit één klantendossier op.'),('Van offerte naar ingepland werk','Offerte en projectinformatie blijven samen. De planning koppelt een ploeg en bedrijfswagen, zodat kantoor en werf vanuit dezelfde projectinformatie werken.'),('Werfupdates worden projectinformatie','Medewerkers registreren uren, voegen foto’s toe en maken een werfverslag. Het kantoor gebruikt deze informatie voor projectopvolging en budgetcontrole.'),('Van projectkosten naar facturatie','Uren en aankopen vormen de basis voor kostenopvolging, rapportage en het voorbereiden van facturen. Documenten blijven gekoppeld aan het juiste project.')]),
'fr':('Exemples de fonctionnement',[('Une demande devient un dossier client','Une demande de ventilation rassemble les coordonnées, les informations du chantier et les documents dans un dossier client commun.'),('Du devis au planning','Le devis reste lié au projet. Le planning attribue une équipe et un véhicule pour partager le même contexte entre le bureau et le chantier.'),('Les mises à jour enrichissent le projet','Les équipes enregistrent les heures, ajoutent des photos et préparent un rapport de chantier pour le suivi des travaux et du budget.'),('Des coûts à la facturation','Les heures et les achats alimentent le suivi des coûts, les rapports et la préparation des factures. Les documents restent liés au projet.')])}

def listing(lang, g, include_websites=True):
    E = g['E']; u = g['url']; labels = LABELS[lang]
    p = PROJECTS[-1]
    card = ('<a class="recent-card" href="%s"><img class="recent-image" src="/assets/work/%s-project.webp" alt="%s" width="1440" height="1080" loading="lazy" decoding="async">'
            '<div class="recent-copy"><span class="ab">%s</span><h3>%s</h3><p>%s</p><span class="more">%s →</span></div></a>') % (
        u(lang, 'projecten/' + p['slug']), p['slug'], E(p['name']), E(p['tag']), E(p['name']), E(p[lang]), E(labels[2]))
    websites = g['work_cards'](lang, WEBSITE_CARDS) if include_websites else ''
    return (STYLE + '<section class="sec" style="padding-top:0"><div class="wrap">'
            + g['sec_head'](labels[0], labels[1]) + websites
            + '<div class="recent-grid">' + card + '</div></div></section>')


def detail(lang,p,g):
    E=g['E']; labels=LABELS[lang]; slug='projecten/'+p['slug']
    out=STYLE+g['phero'](lang,slug,labels[0],p['name'],p[lang],acts=False)
    caption={'en':'Project imagery from the website','nl':'Projectbeeld uit de website','fr':'Visuel du projet issu du site'}[lang]
    out += '<section class="sec" style="padding-top:0"><div class="wrap"><figure class="project-visual"><img src="/assets/work/%s-project.webp" alt="%s" width="1440" height="1080" fetchpriority="high"><figcaption>%s · %s</figcaption></figure><div class="acts"><a class="btn btn-p" href="%s" target="_blank" rel="noopener">%s</a><a class="btn btn-g" href="%s">%s</a></div></div></section>' % (p['slug'], E(p['name']), E(p['name']), caption, p['url'], E(labels[4]), g['url'](lang,'projecten'), E(labels[5]))
    return g['page'](lang,slug,p['name']+' · Marleo',p[lang],out+g['band'](lang))


def website_case_content(lang, p, g):
    slug = p.get('slug')
    if slug not in STORIES:
        return ''
    E = g['E']
    out = '<link rel="stylesheet" href="/assets/client-stories.css">' + story(lang, slug, g)
    if slug == 'airmasters':
        heading, intro, modules = CRM[lang]
        cards = ''.join('<article class="card"><h3>%s</h3><p>%s</p></article>' % (E(title), E(body))
                        for title, body in modules)
        out += '<section class="sec" style="padding-top:0"><div class="wrap">%s<div class="grid g2">%s</div></div></section>' % (
            g['sec_head'](None, heading, intro), cards)
        heading, examples = EXAMPLES[lang]
        out += STYLE + '<section class="sec" style="padding-top:0"><div class="wrap">' + g['sec_head'](None, heading) + '<div class="example-grid">' + ''.join(
            '<details class="work-example" open><summary>%s</summary><p>%s</p></details>' % (E(title), E(body))
            for title, body in examples) + '</div></div></section>'
    return out
