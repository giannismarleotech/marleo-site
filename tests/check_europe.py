"""SEO and content checks for the European Marleo release. No network or forms."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
import xml.etree.ElementTree as ET
import json
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
class SEO(HTMLParser):
 def __init__(self):super().__init__();self.meta={};self.links=[];self.h1=0;self.lang='';self.collect=False;self.buf='';self.json=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='html':self.lang=a.get('lang')
  if tag=='h1':self.h1+=1
  if tag=='meta':self.meta[a.get('name') or a.get('property')]=a.get('content')
  if tag=='link':self.links.append(a)
  if tag=='script' and a.get('type')=='application/ld+json':self.collect=True;self.buf=''
 def handle_data(self,s):
  if self.collect:self.buf+=s
 def handle_endtag(self,tag):
  if tag=='script' and self.collect:self.json.append(json.loads(self.buf));self.collect=False
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
locations=[x.text for x in ET.parse(ROOT/'sitemap.xml').findall('.//s:loc',ns)]
assert len(locations)==len(set(locations))
assert 'https://marleo.tech/en/' not in locations
for location in locations:
 path=ROOT/urlparse(location).path.lstrip('/')/'index.html'
 assert path.exists(),location
 if '/hq/' in location or '/portaal/' in location:raise AssertionError(location)
for prefix,lang in [('', 'en'),('nl/','nl'),('fr/','fr')]:
 raw=(ROOT/prefix/'index.html').read_text();p=SEO();p.feed(raw)
 assert p.lang==lang and p.h1==1
 assert len(p.meta['description'])<=180
 assert p.meta['og:site_name']=='Marleo'
 alts={a['hreflang']:a['href'] for a in p.links if 'hreflang' in a}
 assert alts=={'en':'https://marleo.tech/','nl':'https://marleo.tech/nl/','fr':'https://marleo.tech/fr/','x-default':'https://marleo.tech/'}
 assert next(a['href'] for a in p.links if a.get('rel')=='canonical')=='https://marleo.tech/'+prefix
 assert any(a.get('href')=='/favicon.svg' for a in p.links)
 graph=[node for data in p.json for node in data.get('@graph',[])]
 org=next(n for n in graph if n['@type']=='ProfessionalService')
 assert org['areaServed']['name']=='Europe' and 'aggregateRating' not in org
 assert any(n['@type']=='WebSite' for n in graph)
 assert not any(token in raw for token in ['/assets/work/','Foamoré','Hair Creations','AB Firestop','Air Masters','OVH Construct'])
 assert 'solutions/custom-crm/' in raw
 assert 'eu-brand-signature' in raw and 'eu-wordmark word' in raw and '>MARLEO</div>' in raw
 assert 'class="sec eu-scope"' in raw
 assert 'background:#eeecef' not in (ROOT/'assets/europe.css').read_text()
for prefix in ['en/','','fr/']:
 p=SEO();p.feed((ROOT/prefix/'solutions/custom-crm/index.html').read_text());assert p.h1==1
 assert any(n['@type']=='Service' for data in p.json for n in data.get('@graph',[]))
 assert 'id="website-work"' in (ROOT/prefix/'projecten/index.html').read_text()
 assert '/assets/work/' in (ROOT/prefix/'projecten/index.html').read_text()
for name,size in [('assets/marleo-icon-512.png',512),('assets/marleo-icon-192.png',192),('apple-touch-icon.png',180)]:assert Image.open(ROOT/name).size==(size,size)
assert Image.open(ROOT/'assets/og.jpg').size==(1200,630)
assert (48,48) in Image.open(ROOT/'favicon.ico').ico.sizes()
print('European release checks passed: multilingual canonicals/hreflang, structured data, CRM pages, portfolio separation, sitemap and favicon sizes.')
