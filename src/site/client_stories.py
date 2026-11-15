"""Case-study copy and project photography for Air Masters and AB Firestop."""

STORIES = {
    'airmasters': {
        'nl': ('Van ventilatieproject tot werfdossier',
               'Voor Air Masters bouwden we een drietalige website die bezoekers vanaf de homepage naar residentiële of industriële oplossingen leidt. Diensten als luchtkanalen, ventilatie, airco en onderhoud krijgen een eigen pagina. Werffoto’s laten zien hoe de installaties eruitzien, en kandidaten vinden aparte vacatures voor projectleiders en techniekers.',
               'Het CRM brengt de opvolging van de werf samen met het werk op kantoor. Een projectdossier bundelt foto’s, documenten en verslagen. De planning koppelt de ploeg en bedrijfswagen aan de werf, zodat uren, kilometers en updates per project kunnen worden opgevolgd.',
               'Realisaties op de website', ('Luchtkanalen en technische installaties op de campus.', 'Luchtkanalen en aansluitingen in een industriële omgeving.', 'Technische installaties, luchtkanalen en plafondmontage.')),
        'en': ('From ventilation projects to site operations',
               'We built a trilingual website that routes visitors to residential or industrial solutions from the home page. Ductwork, ventilation, air conditioning and maintenance each have a dedicated page. Site photography showcases the installations, and careers pages cover roles for project managers and technicians.',
               'The CRM brings site and office work into the same project file. Teams can track photos, documents and reports, schedule crew and vehicle assignments and record hours, mileage and updates against the project.',
               'Projects featured on the website', ('Ductwork and technical installations on campus.', 'Ductwork and connections in an industrial setting.', 'Technical installations, ductwork and ceiling assembly.')),
        'fr': ('Des installations de ventilation au suivi de chantier',
               'Nous avons créé un site trilingue qui oriente les visiteurs vers les solutions résidentielles ou industrielles dès l’accueil. Les gaines, la ventilation, la climatisation et l’entretien ont chacun leur page. Les photos montrent les installations et les offres d’emploi s’adressent aux chefs de projet et aux techniciens.',
               'Le CRM réunit le suivi du chantier et le travail du bureau dans un même dossier. Il rassemble les photos, documents et rapports, associe une équipe et un véhicule au chantier et permet de suivre les heures, les kilomètres et les mises à jour.',
               'Réalisations présentées sur le site', ('Gaines et installations techniques sur le campus.', 'Gaines et raccordements en milieu industriel.', 'Installations techniques, gaines et montage au plafond.')),
    },
    'ab-firestop': {
        'nl': ('Passieve brandbescherming, uitgelegd met werk vanop de werf',
               'Voor AB Firestop bouwden we een website in het Nederlands, Frans en Engels. Van brandwerende dichtingen en voegen tot compartimentering, omkastingen en inspectie krijgt elke dienst een eigen pagina. Projectgalerijen tonen de aansluitingen rond leidingen, kabelgoten en ventilatiekanalen van dichtbij.',
               'Via het beveiligde dashboard kan het team teksten en foto’s per taal aanpassen, werfbeelden toevoegen en eerdere paginaversies terugzetten. Het dashboard toont ook paginaweergaven over de laatste 30 dagen. Voor SEO zijn er aparte dienst- en projectpagina’s met beschrijvende paginatitels.',
               'Realisaties op de website', ('Aansluitingen rond leidingen en technische installaties.', 'Afwerking rond kabelgoten, leidingen en ventilatiekanalen.', 'Details van leidingdoorvoeringen en aansluitingen op de constructie.')),
        'en': ('Passive fire protection shown through site work',
               'We built a Dutch, French and English website for AB Firestop. Firestopping, fire-resistant joints, compartmentation, enclosures and inspection each have a dedicated service page. Project galleries show the work around pipes, cable trays and ventilation ducts up close.',
               'The secured dashboard lets the team edit copy and photos in each language, add site images and restore earlier page versions. It also shows page views for the past 30 days. Dedicated project and service pages use descriptive titles for search.',
               'Projects featured on the website', ('Connections around pipes and technical installations.', 'Finishing around cable trays, pipes and ventilation ducts.', 'Pipe penetrations and connections to the structure.')),
        'fr': ('La protection incendie passive illustrée sur le terrain',
               'Nous avons créé un site en néerlandais, en français et en anglais pour AB Firestop. Le calfeutrement coupe-feu, les joints, le compartimentage, les habillages et les inspections ont chacun leur page. Les galeries montrent les raccords autour des tuyaux, chemins de câbles et gaines de ventilation.',
               'Le tableau de bord sécurisé permet à l’équipe de modifier les textes et les photos par langue, d’ajouter des images de chantier et de restaurer des versions précédentes. Il affiche les pages vues sur les 30 derniers jours. Les pages des services et des réalisations ont des titres descriptifs pour le référencement.',
               'Réalisations présentées sur le site', ('Raccords autour des tuyaux et des installations techniques.', 'Finitions autour des chemins de câbles, tuyaux et gaines.', 'Traversées de tuyaux et raccords à la structure.')),
    },
}
PROJECT_IMAGES = {
    'airmasters': (('Howest Brugge', 'howest'), ('Belcolade', 'belcolade'), ('Infrabel', 'infrabel')),
    'ab-firestop': (('Interbad Brugge', 'interbad'), ('Q8 Gent', 'q8'), ('Aquafin Gent', 'aquafin')),
}


def story(lang, slug, g):
    e = g['E']
    title, website, software, heading, captions = STORIES[slug][lang]
    crm = 'CRM' if slug == 'airmasters' else {'nl': 'Websitebeheer', 'en': 'Website management', 'fr': 'Gestion du site'}[lang]
    cards = []
    for (name, image), caption in zip(PROJECT_IMAGES[slug], captions):
        cards.append(f'''<article class="case-reference"><img src="/assets/work/{slug}-{image}.webp"
            alt="{e(name)}" width="720" height="540" loading="lazy" decoding="async">
            <div><h3>{e(name)}</h3><p>{e(caption)}</p></div></article>''')
    return f'''<section class="sec case-story" style="padding-top:0"><div class="wrap">
      <h2>{e(title)}</h2><div class="case-columns">
      <article><h3>Website</h3><p>{e(website)}</p></article>
      <article><h3>{e(crm)}</h3><p>{e(software)}</p></article></div>
      <h2>{e(heading)}</h2><div class="case-gallery">{''.join(cards)}</div>
    </div></section>'''
