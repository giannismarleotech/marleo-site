# -*- coding: utf-8 -*-
"""Bouwt marleo.tech als statische pagina's (NL op /, EN op /en/, FR op /fr/).
Gebruik: python3 src/site/build.py   (vanuit de repo-root)"""
import json, os, html, sys, datetime
sys.path.insert(0, os.path.dirname(__file__))
from extra import UI, DEEP, PORTFOLIO

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
C = json.load(open(os.path.join(os.path.dirname(__file__), 'content.json'), encoding='utf-8'))
COPY = C['COPY']; KEYS = C['SERVICE_KEYS']
LANGS = ['nl', 'en', 'fr']
SITE = 'https://marleo.tech'
V = datetime.datetime.utcnow().strftime('%Y%m%d%H%M')
E = lambda s: html.escape(str(s), quote=True)

PAGES = ['diensten', 'managed-it', 'cloud', 'security', 'ai-infrastructuur', 'development', 'games',
         'websites', 'webshop', 'branding', 'domeincheck', 'projecten', 'prijzen', 'over-ons', 'contact']

def url(lang, slug=''):
    p = '/' if lang == 'nl' else '/%s/' % lang
    return p + (slug + '/' if slug else '')

LOGO = ('<svg viewBox="0 0 28 32" fill="none" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">'
        '<stop offset="0" stop-color="#ff8a2b"/><stop offset="1" stop-color="#ff2a86"/></linearGradient></defs>'
        '<path d="M14 1.5 26 8.25v15.5L14 30.5 2 23.75V8.25z" stroke="url(#lg)" stroke-width="2"/>'
        '<path d="M11 12l-3 4 3 4M17 12l3 4-3 4M15.5 11l-3 10" stroke="url(#lg)" stroke-width="1.8" stroke-linecap="round"/></svg>')
FAV = ("data:image/svg+xml," + "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23ff8a2b'/%3E%3Cstop offset='1' stop-color='%23ff2a86'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M14 1.5 26 8.25v15.5L14 30.5 2 23.75V8.25z' fill='%23120d12' stroke='url(%23g)' stroke-width='2'/%3E%3Cpath d='M11 12l-3 4 3 4M17 12l3 4-3 4M15.5 11l-3 10' stroke='url(%23g)' stroke-width='1.8' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")
ARROW = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
EXT = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="12" height="12"><path d="M5 11 11 5M6 5h5v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
ICONS = {  # simpele lijn-iconen per dienst
 'managed-it': '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
 'cloud': '<path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 8.5a4.75 4.75 0 0 1-.5 9.5z"/>',
 'security': '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
 'ai-infrastructuur': '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
 'development': '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12"/>',
 'webshop': '<path d="M4 5h2l2 10h10l2-7H7"/><circle cx="10" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
 'websites': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/>',
 'games': '<rect x="2.5" y="7" width="19" height="10" rx="5"/><path d="M7 12h4M9 10v4M15.5 11h.01M17.5 13h.01"/>',
 'branding': '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17M3.5 12h17"/><circle cx="12" cy="12" r="3"/>',
 'domeincheck': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
}
def icon(k):
    return ('<span class="svc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="url(#ig)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'
            '<defs><linearGradient id="ig" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8a2b"/><stop offset="1" stop-color="#ff2a86"/></linearGradient></defs>'
            + ICONS.get(k, ICONS['websites']) + '</svg></span>')

DOM_UI = {
 'nl': dict(placeholder="bv. mijnbedrijf of mijnbedrijf.be", button="Check", checking="Bezig…", invalid="Vul een geldige naam in, bijvoorbeeld mijnbedrijf.be", hint="Alleen een naam? Dan checken we .be, .nl, .com en .eu tegelijk.", disclaimer="Live DNS-controle. Een vrije uitslag is een sterke indicatie, geen garantie, wij bevestigen bij de registrar.", cta="Laat ons deze naam registreren", st=dict(free="Waarschijnlijk vrij", taken="In gebruik", checking="Bezig…", unknown="Onduidelijk", error="Check mislukt")),
 'en': dict(placeholder="e.g. mycompany or mycompany.be", button="Check", checking="Checking…", invalid="Enter a valid name, for example mycompany.be", hint="Just a name? We check .be, .nl, .com and .eu at once.", disclaimer="Live DNS check. An available result is a strong indication, not a guarantee, we confirm with the registrar.", cta="Have us register this name", st=dict(free="Likely available", taken="In use", checking="Checking…", unknown="Unclear", error="Check failed")),
 'fr': dict(placeholder="ex. masociete ou masociete.be", button="Vérifier", checking="Vérification…", invalid="Entrez un nom valide, par exemple masociete.be", hint="Juste un nom ? Nous vérifions .be, .nl, .com et .eu d'un coup.", disclaimer="Vérification DNS en direct. Un résultat libre est une forte indication, pas une garantie, nous confirmons auprès du registrar.", cta="Faites enregistrer ce nom", st=dict(free="Probablement libre", taken="Utilisé", checking="Vérification…", unknown="Incertain", error="Échec")),
}
SUB = {'privacy': '/privacy/', 'voorwaarden': '/voorwaarden/', 'nis2': '/nis2/'}

# ---------------------------------------------------------------- layout
def head(lang, slug, title, desc):
    alts = ''.join('<link rel="alternate" hreflang="%s" href="%s%s">' % (l, SITE, url(l, slug)) for l in LANGS)
    alts += '<link rel="alternate" hreflang="x-default" href="%s%s">' % (SITE, url('nl', slug))
    ui = dict(UI[lang]); ui['dom'] = dict(DOM_UI[lang]); ui['dom']['ctaHref'] = url(lang, 'contact')
    keep = {k: ui[k] for k in ('sent', 'sending', 'err', 'required', 'dom')}
    return ('<!DOCTYPE html><html lang="%s"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
            '<title>%s</title><meta name="description" content="%s">'
            '<link rel="canonical" href="%s%s">%s'
            '<meta property="og:type" content="website"><meta property="og:title" content="%s"><meta property="og:description" content="%s">'
            '<meta property="og:url" content="%s%s"><meta property="og:image" content="%s/assets/og.jpg"><meta name="twitter:card" content="summary_large_image">'
            '<meta name="theme-color" content="#120d12"><link rel="icon" href="%s">'
            '<link rel="preload" href="/assets/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>'
            '<link rel="stylesheet" href="/assets/site.css?v=%s">'
            '<script>document.documentElement.classList.add("js");window.__UI=%s</script>'
            '<script defer src="/assets/site.js?v=%s"></script><script defer src="https://ufzwdhbrmycjtlewstaw.supabase.co/functions/v1/track?k=mk_e05fe1cf06a17017dd"></script>'
            '</head><body>') % (lang, E(title), E(desc), SITE, url(lang, slug), alts, E(title), E(desc), SITE, url(lang, slug), SITE, FAV, V,
                                 json.dumps(keep, ensure_ascii=False), V)

def header(lang, slug):
    t = COPY[lang]; u = UI[lang]
    items = []
    for gi, g in enumerate(t['navGroups']):
        if 'keys' in g:
            on = ' on' if slug in g['keys'] else ''
            menu = ''.join('<a href="%s" data-slug="%s"%s><b>%s</b><span>%s</span></a>' % (
                url(lang, k), k, ' class="on"' if k == slug else '', E(t['labels'][k]), E(t['navDesc'].get(k, ''))) for k in g['keys'])
            menu += '<a href="%s" data-slug="diensten"><b>%s →</b><span>%s</span></a>' % (url(lang, 'diensten'), E(t['allServices']), E(t['labels']['diensten']))
            items.append('<div class="it dd"><button type="button" class="%s" aria-expanded="false">%s</button><div class="menu">%s</div></div>' % (on.strip(), E(g['label']), menu))
        else:
            k = g['key']
            items.append('<div class="it"><a class="lk%s%s" href="%s" data-slug="%s">%s</a></div>' % (' on' if k == slug else '', ' opt' if k == 'over-ons' else '', url(lang, k), k, E(g['label'])))
    items.append('<div class="it"><a class="lk%s" href="%s" data-slug="projecten">%s</a></div>' % (' on' if slug == 'projecten' else '', url(lang, 'projecten'), E(u['work'])))
    langs = '<div class="langs">' + ''.join('<a href="%s" hreflang="%s"%s>%s</a>' % (url(l, slug), l, ' class="on" aria-current="true"' if l == lang else '', l.upper()) for l in LANGS) + '</div>'
    book = '/afspraak/'
    # mobiel menu
    sheet = ''
    for g in t['navGroups']:
        if 'keys' in g:
            sheet += '<details%s><summary>%s</summary>%s<a href="%s">%s →</a></details>' % (' open' if slug in g['keys'] else '', E(g['label']), ''.join(
                '<a href="%s">%s<small>%s</small></a>' % (url(lang, k), E(t['labels'][k]), E(t['navDesc'].get(k, ''))) for k in g['keys']), url(lang, 'diensten'), E(t['allServices']))
        else:
            sheet += '<a class="sl" href="%s">%s</a>' % (url(lang, g['key']), E(g['label']))
    sheet += '<a class="sl" href="%s">%s</a><a class="sl" href="%s">%s</a>' % (url(lang, 'projecten'), E(u['work']), url(lang, 'contact'), E(t['labels']['contact']))
    return ('<a class="skip" href="#main">%s</a><div class="prog" aria-hidden="true"></div>'
            '<header class="hdr"><div class="wrap"><a class="logo" href="%s" aria-label="marleo.tech home">%s<span>marleo<span class="gt">.tech</span></span></a>'
            '<nav class="nav" aria-label="Hoofdmenu">%s</nav>'
            '<div style="display:flex;align-items:center;gap:14px">%s<a class="btn btn-p" href="%s">%s</a>'
            '<button class="burger" type="button" aria-label="%s"><i></i></button></div></div></header>'
            '<div class="sheet" aria-hidden="true"><div class="sheet-top"><a class="logo" href="%s">%s<span>marleo<span class="gt">.tech</span></span></a><button class="x" type="button" aria-label="%s">×</button></div>'
            '%s<div class="sb">%s<a class="btn btn-p" href="%s">%s</a><a class="btn btn-g" href="tel:+32456920025">0456 92 00 25</a></div></div>') % (
            E(u['skip']), url(lang), LOGO, ''.join(items), langs, book, E(t['navCta']), E(u['menu']),
            url(lang), LOGO, E(u['close']), sheet, langs, book, E(t['navCta']))

SOC = {
 'Instagram': ('https://instagram.com/marleo.tech', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/></svg>'),
 'E-mail': ('mailto:info@marleo.tech', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>'),
 'Telefoon': ('tel:+32456920025', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>'),
}
def footer(lang):
    t = COPY[lang]; u = UI[lang]
    cols = ''
    for col in t['footer']:
        links = []
        for k in col['keys']:
            if k in ('status', 'sla'):
                continue
            href = SUB.get(k) or url(lang, 'contact' if k == 'support' else k)
            links.append('<li><a href="%s">%s</a></li>' % (href, E(t['labels'].get(k, k))))
        cols += '<div><h4>%s</h4><ul>%s</ul></div>' % (E(col['head']), ''.join(links))
    soc = ''.join('<a href="%s" aria-label="%s">%s</a>' % (h, n, s) for n, (h, s) in SOC.items())
    return ('<footer class="ftr"><div class="wrap"><div class="top"><div><a class="logo" href="%s">%s<span>marleo<span class="gt">.tech</span></span></a>'
            '<p class="claim">%s</p><div class="soc">%s</div></div>%s</div>'
            '<div class="bot"><span>%s</span><span>%s</span></div></div></footer></body></html>') % (
            url(lang), LOGO, E(t['claim']), soc, cols, E(t['legal']), E(u['footerMade']))

def page(lang, slug, title, desc, body):
    return head(lang, slug, title, desc) + header(lang, slug) + '<main id="main">' + body + '</main>' + footer(lang)

# ---------------------------------------------------------------- blokken
def sec_head(eyebrow, title, lead=None, cls='rv'):
    return '<div class="sec-h %s">%s<h2>%s</h2>%s</div>' % (cls, '<span class="eyebrow">%s</span>' % E(eyebrow) if eyebrow else '', E(title), '<p class="lead">%s</p>' % E(lead) if lead else '')

def blocks(bl, cols='g4'):
    return '<div class="grid %s">%s</div>' % (cols, ''.join(
        '<div class="card rv d%d"><span class="ab">%s</span><h3>%s</h3><p>%s</p></div>' % (i % 4, E(b.get('abbr', '')), E(b['title']), E(b['body'])) for i, b in enumerate(bl)))

def steps(st):
    return '<div class="grid g4 steps">%s</div>' % ''.join(
        '<div class="card rv d%d"><span class="num">%s</span><h3>%s</h3><p>%s</p></div>' % (i % 4, E(s['n']), E(s['title']), E(s['body'])) for i, s in enumerate(st))

def faq(items):
    return '<div class="faq rv">%s</div>' % ''.join('<details><summary>%s</summary><p>%s</p></details>' % (E(q['q']), E(q['a'])) for q in items)

def svc_cards(lang, keys, cols='g3'):
    t = COPY[lang]; u = UI[lang]
    return '<div class="grid %s">%s</div>' % (cols, ''.join(
        '<a class="card rv d%d" href="%s">%s<h3>%s</h3><p>%s</p><span class="more">%s →</span></a>' % (
            i % 3, url(lang, k), icon(k), E(t['labels'][k]), E(t['navDesc'].get(k, '')), E(t['more'])) for i, k in enumerate(keys)))

def work_cards(lang, items, eager=0):
    out = []
    for i, p in enumerate(items):
        sub, body = p[lang]
        ld = 'eager' if i < eager else 'lazy'
        out.append(
            '<a class="wk rv d%d" href="%s" target="_blank" rel="noopener">'
            '<div class="shot"><img src="/assets/work/%s-720.webp" srcset="/assets/work/%s-720.webp 720w, /assets/work/%s-1440.webp 1440w" sizes="(max-width:700px) 92vw, 46vw" width="1440" height="900" alt="%s" loading="%s" decoding="async">'
            '<div class="ph"><img src="/assets/work/%s-m.webp" width="390" height="800" alt="" loading="lazy" decoding="async"></div></div>'
            '<div class="meta"><div><div class="sub">%s</div><h3>%s</h3><p>%s</p></div><span class="go">%s %s</span></div></a>' % (
                i % 2, E(p['url']), p['img'], p['img'], p['img'], E(p['name'] + ' website'), ld, p['img'], E(sub), E(p['name']), E(body), E(UI[lang]['visit']), EXT))
    return '<div class="work">%s</div>' % ''.join(out)

def band(lang, title=None, body=None):
    t = COPY[lang]; u = UI[lang]
    return ('<section class="sec" style="padding-top:0"><div class="wrap"><div class="band rv"><div><h2>%s</h2><p>%s</p></div>'
            '<div class="acts"><a class="btn btn-p" href="/afspraak/">%s %s</a><a class="btn btn-g" href="%s">%s</a></div></div></div></section>') % (
            E(title or t['ctaBand']), E(body or t['ctaBandBody']), E(u['book']), ARROW, url(lang, 'contact'), E(t['labels']['contact']))

def phero(lang, slug, crumb, title, lead, acts=True):
    t = COPY[lang]; u = UI[lang]
    a = ('<div class="acts rise d3"><a class="btn btn-p" href="/afspraak/">%s %s</a><a class="btn btn-g" href="%s">%s</a></div>' % (
        E(u['book']), ARROW, url(lang, 'contact'), E(t['labels']['contact']))) if acts else ''
    return ('<section class="phero"><div class="grid-bg"></div><div class="wrap"><nav class="crumb rise" aria-label="breadcrumb"><a href="%s">%s</a><i></i><span>%s</span></nav>'
            '<h1 class="rise d1">%s</h1><p class="lead rise d2">%s</p>%s</div></section>') % (url(lang), E(u['home']), E(crumb), E(title), E(lead), a)

# ---------------------------------------------------------------- pagina's
def home(lang):
    t = COPY[lang]; u = UI[lang]
    plus = ''.join('<span class="plus" style="left:%s%%;top:%s%%" data-depth="%d">+</span>' % (x, y, 8 + i * 3) for i, (x, y) in enumerate(C['CROSS_POS'][:6]))
    orb = ('<div class="orb rise d2" aria-hidden="true"><div class="glow"></div><div class="ring"></div><div class="ring r2"></div><div class="ball"></div>'
           '<div class="hex"><svg viewBox="0 0 100 100" fill="none"><path d="M50 6 88 28v44L50 94 12 72V28z" stroke="rgba(255,255,255,.75)" stroke-width="1"/>'
           '<path d="M50 6v88M12 28l76 44M88 28 12 72" stroke="rgba(255,255,255,.3)" stroke-width=".7"/></svg></div>'
           '<span class="dot" style="--rr:calc(min(42vw,210px))"></span></div>')
    hero = ('<section class="hero"><div class="grid-bg"></div>%s<div class="wrap">'
            '<div class="word rise" aria-hidden="true">MARLEO</div><p class="tag rise d1">IT · CLOUD · SECURITY · AI</p>'
            '<div class="hero-row"><div class="hero-l rise d2" data-depth="10"><h2>%s</h2><span class="eyebrow">%s</span><p>%s</p><a class="textlink" href="%s">%s →</a></div>'
            '%s'
            '<div class="hero-r rise d3" data-depth="14"><h1><span class="gt">%s</span><br>%s</h1><p>%s</p>'
            '<a class="cta-card" href="%s"><span>%s</span><i>%s</i></a></div></div></div></section>') % (
            plus, E(t['kicker']), E(t['kickerMeta']), E(t['leftBody']), url(lang, 'ai-infrastructuur'), E(t['leftLink']),
            orb, E(t['claimA']), E(t['claimB']), E(t['claimBody']), url(lang, 'contact'), E(t['offerCta']), ARROW)
    metrics = '<section><div class="wrap"><div class="metrics rv">%s</div></div></section>' % ''.join(
        '<div class="metric"><b class="gt">%s</b><span>%s</span></div>' % (E(m['value']), E(m['label'])) for m in t['metrics'])
    svc = ('<section class="sec"><div class="wrap">%s%s<div style="margin-top:28px" class="rv"><a class="btn btn-g" href="%s">%s %s</a></div></div></section>') % (
        sec_head(t['labels']['diensten'], t['servicesTitle'], t['servicesIntro']), svc_cards(lang, KEYS), url(lang, 'diensten'), E(t['allServices']), ARROW)
    wt = {'nl': 'Bekijk de websites die we bouwden', 'en': 'See the websites we built', 'fr': 'Voir les sites que nous avons créés'}[lang]
    work = ('<section class="sec" style="padding-top:0;padding-bottom:18px"><div class="wrap"><a class="card rv" href="%s" style="grid-template-columns:auto 1fr auto;align-items:center;gap:20px">%s'
            '<h3 style="font-size:clamp(1.1rem,2vw,1.5rem)">%s</h3><span class="more" style="margin:0;padding:0">%s →</span></a></div></section>') % (
        url(lang, 'websites') + '#werk', icon('websites'), E(wt), E(u['workCta']))
    dom = ('<section class="sec" style="padding-top:0"><div class="wrap"><a class="card rv" href="%s" style="grid-template-columns:auto 1fr auto;align-items:center;gap:20px">%s'
           '<h3 style="font-size:clamp(1.1rem,2vw,1.5rem)">%s</h3><span class="more" style="margin:0;padding:0">%s →</span></a></div></section>') % (
        url(lang, 'domeincheck'), icon('domeincheck'), E(t['domainTeaser']), E(t['domainTeaserCta']))
    title = 'Marleo · ' + {'nl': 'Managed IT, cloud, security, AI & websites', 'en': 'Managed IT, cloud, security, AI & websites', 'fr': 'IT managé, cloud, sécurité, IA & sites web'}[lang]
    return page(lang, '', title, UI[lang]['metaHome'], hero + metrics + svc + work + dom + band(lang))

def service(lang, k):
    t = COPY[lang]; u = UI[lang]; p = t['pages'][k]; dp = DEEP.get(k, {}); dl = dp.get(lang, {})
    out = phero(lang, k, p['crumb'], p['title'], p['lead'])
    if dl:
        out += ('<section class="sec"><div class="wrap split"><div>%s</div><ul class="who rv">%s</ul></div></section>') % (
            sec_head(None, u['forWho']), ''.join('<li>%s</li>' % E(x) for x in dl['forWho']))
    if p.get('blocks'):
        out += '<section class="sec" style="padding-top:0"><div class="wrap">%s%s</div></section>' % (sec_head(None, p['blocksTitle']), blocks(p['blocks'], 'g4' if len(p['blocks']) % 4 == 0 else 'g3'))
    if dl:
        out += '<section class="sec" style="padding-top:0"><div class="wrap split"><div>%s</div><ul class="checks rv">%s</ul></div></section>' % (
            sec_head(None, u['included']), ''.join('<li>%s</li>' % E(x) for x in dl['included']))
    if k == 'websites':
        out += '<section class="sec" id="werk" style="padding-top:0"><div class="wrap">%s%s</div></section>' % (sec_head(u['work'], u['allWork'], u['allWorkLead']), work_cards(lang, PORTFOLIO, eager=2))
    if dl:
        out += '<section class="sec" style="padding-top:0"><div class="wrap">%s<div class="grid g3">%s</div></div></section>' % (
            sec_head(None, u['outcomes']), ''.join('<div class="card rv d%d"><h3 class="gt" style="font-size:1.3rem">%s</h3><p>%s</p></div>' % (i, E(a), E(b)) for i, (a, b) in enumerate(dl['outcomes'])))
    if p.get('steps'):
        out += '<section class="sec" style="padding-top:0"><div class="wrap">%s%s</div></section>' % (sec_head(None, p['stepsTitle']), steps(p['steps']))
    if k == 'domeincheck':
        D = DOM_UI[lang]
        out = out.replace('</section>', '', 1) if False else out
        out += ('<section class="sec" style="padding-top:0"><div class="wrap"><form id="domform" class="form rv" style="max-width:820px" autocomplete="off">'
                '<div class="dom"><input name="q" aria-label="domein" placeholder="%s" inputmode="url" autocapitalize="off" spellcheck="false"><button class="btn btn-p" type="submit">%s</button></div>'
                '<p class="muted" style="font-size:.88rem">%s</p><div id="domres" class="domres" aria-live="polite"></div><p class="muted" style="font-size:.8rem">%s</p></form></div></section>') % (
                E(D['placeholder']), E(D['button']), E(D['hint']), E(D['disclaimer']))
    if p.get('faq'):
        out += '<section class="sec" style="padding-top:0"><div class="wrap split"><div>%s</div>%s</div></section>' % (sec_head(None, p['faqTitle']), faq(p['faq']))
    rel = [r for r in dp.get('related', []) if r in KEYS or r == 'domeincheck']
    if rel:
        out += '<section class="sec" style="padding-top:0"><div class="wrap">%s%s</div></section>' % (sec_head(None, u['related']), svc_cards(lang, rel))
    out += band(lang, u['next'], u['nextBody'])
    return page(lang, k, '%s · Marleo' % p['title'], p['lead'][:158], out)

def diensten(lang):
    t = COPY[lang]; p = t['pages']['diensten']
    out = phero(lang, 'diensten', p['crumb'], p['title'], p['lead'])
    out += '<section class="sec" style="padding-top:0"><div class="wrap">%s%s</div></section>' % (sec_head(None, p['serviceGridTitle']), svc_cards(lang, KEYS + ['domeincheck']))
    out += '<section class="sec" style="padding-top:0"><div class="wrap">%s%s</div></section>' % (sec_head(None, p['stepsTitle']), steps(p['steps']))
    out += '<section class="sec" style="padding-top:0"><div class="wrap split"><div>%s</div>%s</div></section>' % (sec_head(None, p['faqTitle']), faq(p['faq']))
    return page(lang, 'diensten', '%s · Marleo' % p['title'], p['lead'][:158], out + band(lang))

def projecten(lang):
    t = COPY[lang]; u = UI[lang]; p = t['pages']['projecten']
    out = phero(lang, 'projecten', p['crumb'], p['title'], p['lead'])
    out += '<section class="sec" style="padding-top:0"><div class="wrap">%s%s</div></section>' % (sec_head(u['work'], u['allWork'], u['allWorkLead']), work_cards(lang, PORTFOLIO, eager=2))
    names = {x['name'].lower() for x in PORTFOLIO}
    other = [x for x in p['projects'] if x['title'].lower() not in names and not x['title'].lower().startswith('terraclean')]
    if other:
        out += '<section class="sec" style="padding-top:0"><div class="wrap">%s<div class="grid g3">%s</div></div></section>' % (sec_head(None, p['projectsTitle']), ''.join(
            '<a class="card rv d%d" href="%s" target="_blank" rel="noopener"><span class="ab">%s</span><h3>%s</h3><p>%s</p><span class="more">%s →</span></a>' % (
                i % 3, E(x['href']), E(x['tag']), E(x['title']), E(x['body']), E(u['visit'])) for i, x in enumerate(other)))
    out += ('<section class="sec" style="padding-top:0"><div class="wrap"><div class="card rv" style="max-width:820px"><span class="ab">%s</span><h3 style="font-size:1.6rem">%s</h3><p>%s</p></div></div></section>') % (
        E(p['credLabel']), E(p['credValue']), E(p['credNote']))
    if p.get('faq'):
        out += '<section class="sec" style="padding-top:0"><div class="wrap split"><div>%s</div>%s</div></section>' % (sec_head(None, p['faqTitle']), faq(p['faq']))
    return page(lang, 'projecten', '%s · Marleo' % p['title'], p['lead'][:158], out + band(lang))

def prijzen(lang):
    t = COPY[lang]; p = t['pages']['prijzen']
    out = phero(lang, 'prijzen', p['crumb'], p['title'], p['lead'], acts=False)
    out += '<section class="sec" style="padding-top:0"><div class="wrap"><div class="plans">%s</div></div></section>' % ''.join(
        '<div class="plan%s rv d%d"><div><h3>%s</h3><span class="muted">%s</span></div><div class="pr">%s<small>%s</small></div><ul>%s</ul><a class="btn %s" href="%s">%s</a></div>' % (
            ' ft' if pl.get('featured') else '', i, E(pl['name']), E(pl['for']), E(pl['price']), E(p['priceUnit']), ''.join('<li>%s</li>' % E(x) for x in pl['items']),
            'btn-p' if pl.get('featured') else 'btn-g', url(lang, 'contact'), E(p['planCta'])) for i, pl in enumerate(p['plans']))
    out += '<section class="sec" style="padding-top:0"><div class="wrap split"><div>%s</div>%s</div></section>' % (sec_head(None, p['faqTitle']), faq(p['faq']))
    return page(lang, 'prijzen', '%s · Marleo' % p['title'], p['lead'][:158], out + band(lang))

def overons(lang):
    t = COPY[lang]; p = t['pages']['over-ons']
    out = phero(lang, 'over-ons', p['crumb'], p['title'], p['lead'])
    out += '<section class="sec" style="padding-top:0"><div class="wrap">%s%s</div></section>' % (sec_head(None, p['blocksTitle']), blocks(p['blocks'], 'g3'))
    out += '<section class="sec" style="padding-top:0"><div class="wrap">%s<div class="metrics rv">%s</div></div></section>' % (sec_head(None, p['stepsTitle']), ''.join(
        '<div class="metric"><b class="gt">%s</b><span><strong style="color:#fff;font-weight:600">%s</strong> · %s</span></div>' % (E(s['n']), E(s['title']), E(s['body'])) for s in p['steps']))
    out += '<section class="sec" style="padding-top:0"><div class="wrap split"><div>%s</div>%s</div></section>' % (sec_head(None, p['faqTitle']), faq(p['faq']))
    return page(lang, 'over-ons', '%s · Marleo' % p['title'], p['lead'][:158], out + band(lang))

def contact(lang):
    t = COPY[lang]; u = UI[lang]; p = t['pages']['contact']
    names = ['naam', 'bedrijf', 'email', 'telefoon']; types = ['text', 'text', 'email', 'tel']; ac = ['name', 'organization', 'email', 'tel']
    fields = ''.join('<div class="fld"><label for="f_%s">%s</label><input id="f_%s" name="%s" type="%s" autocomplete="%s"></div>' % (n, E(l), n, n, ty, a) for n, l, ty, a in zip(names, p['fields'], types, ac))
    form = ('<form id="cform" class="form rv" novalidate><h2 style="font-size:1.4rem">%s</h2>%s<div class="fld"><label for="f_b">%s</label><textarea id="f_b" name="bericht"></textarea></div>'
            '<input type="text" name="website_url" tabindex="-1" autocomplete="off" style="position:absolute;left:-5000px" aria-hidden="true">'
            '<label class="chk"><input type="checkbox" name="waopt"> %s</label><button class="btn btn-p" type="submit">%s</button><p class="fmsg" aria-live="polite"></p></form>') % (
            E(p['formTitle']), fields, E(p['messageLabel']), E(u['waOpt']), E(p['submit']))
    rows = ''.join('<a class="crow rv" href="%s"><span class="l">%s</span><span class="v">%s</span><span class="n">%s</span></a>' % (
        E(r['href']), E(r['label']), E(r['value']), E(r['note'])) for r in p['contactRows'])
    out = phero(lang, 'contact', p['crumb'], p['title'], p['lead'], acts=False)
    out += '<section class="sec" style="padding-top:0"><div class="wrap split split-c">%s<div class="grid" style="align-content:start">%s</div></div></section>' % (form, rows)
    out += '<section class="sec" style="padding-top:0"><div class="wrap split"><div>%s</div>%s</div></section>' % (sec_head(None, p['faqTitle']), faq(p['faq']))
    return page(lang, 'contact', '%s · Marleo' % p['title'], p['lead'][:158], out)

# ---------------------------------------------------------------- schrijven
def write(path, s):
    full = os.path.join(ROOT, path.lstrip('/'), 'index.html')
    os.makedirs(os.path.dirname(full), exist_ok=True)
    open(full, 'w', encoding='utf-8').write(s)

def main():
    urls = []
    for lang in LANGS:
        write(url(lang), home(lang)); urls.append(url(lang))
        for k in PAGES:
            if k == 'diensten': s = diensten(lang)
            elif k == 'projecten': s = projecten(lang)
            elif k == 'prijzen': s = prijzen(lang)
            elif k == 'over-ons': s = overons(lang)
            elif k == 'contact': s = contact(lang)
            else: s = service(lang, k)
            write(url(lang, k), s); urls.append(url(lang, k))
    today = datetime.date.today().isoformat()
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(
        '<url><loc>%s%s</loc><lastmod>%s</lastmod></url>\n' % (SITE, u, today) for u in urls + ['/afspraak/', '/privacy/', '/voorwaarden/', '/nis2/']) + '</urlset>\n'
    open(os.path.join(ROOT, 'sitemap.xml'), 'w').write(sm)
    open(os.path.join(ROOT, 'robots.txt'), 'w').write('User-agent: *\nDisallow: /hq/\nDisallow: /intake/\nDisallow: /uitschrijven/\nDisallow: /offerte/\nDisallow: /src/\nDisallow: /social/\nSitemap: %s/sitemap.xml\n' % SITE)
    print('pagina\'s:', len(urls))

if __name__ == '__main__':
    main()
