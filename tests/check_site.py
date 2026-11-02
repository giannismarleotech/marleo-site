"""Static release checks; does not submit forms or read customer data."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import subprocess, json, tempfile
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self):
        super().__init__();self.links=[];self.ids=set();self.h1=0;self.lang='';self.scripts=[];self.collect=False;self.script='';self.config=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='html':self.lang=a.get('lang','')
        if tag=='h1':self.h1+=1
        if 'id' in a:self.ids.add(a['id'])
        if 'data-config' in a:self.config.append(json.loads(a['data-config']))
        if tag=='script':self.collect='src' not in a and a.get('type','')!='application/ld+json';self.script=''
        for key in ('src','href'):
            u=a.get(key,'')
            if u and not urlsplit(u).scheme and not u.startswith('//'):self.links.append(u)
    def handle_data(self,d):
        if self.collect:self.script+=d
    def handle_endtag(self,tag):
        if tag=='script' and self.collect:self.scripts.append(self.script);self.collect=False
pages={}
for path in ROOT.rglob('*.html'):
    rel=path.relative_to(ROOT)
    if rel.parts[0] in ('src','social','docs'):continue
    page=Page();page.feed(path.read_text());pages[path]=page
errors=[]
for path,page in pages.items():
    if 'hq' not in path.relative_to(ROOT).parts:
        assert not any(urlsplit(u).path.startswith('/hq') for u in page.links),str(path)
    for link in page.links:
        u=urlsplit(link)
        dest=ROOT/unquote(u.path).lstrip('/') if u.path.startswith('/') else path.parent/unquote(u.path)
        if not u.path:dest=path
        if dest.is_dir():dest=dest/'index.html'
        if not dest.exists():errors.append((str(path.relative_to(ROOT)),link))
        if u.fragment and dest in pages and u.fragment not in pages[dest].ids:
            # HQ uses hashes as app routes, not element IDs.
            if 'hq' not in dest.parts:errors.append((str(path.relative_to(ROOT)),'anchor '+link))
assert not errors,errors
for p,lang in [('index.html','en'),('nl/index.html','nl'),('fr/index.html','fr')]:
    data=pages[ROOT/p];assert data.lang==lang and data.h1==1
    s=(ROOT/p).read_text();assert 'class="word"' in s and 'ai-brand-hero' in s and 'ai-light' not in s
    for service in ('websites','webshop','branding','games','managed-it','cloud','security','development','ai-infrastructuur'):
        assert '/'+service+'/' in s,(p,service)
    assert 'href="/hq/"' not in s
for source in ('hq/index.html','hq/sw.js','hq/manifest.json'):
    old=subprocess.check_output(['git','show','main:'+source],cwd=ROOT)
    current=(ROOT/source).read_bytes()
    if source=='hq/index.html':current=current.replace(b'<link rel="stylesheet" href="enterprise.css">\n',b'').replace(b'<script src="enterprise.js"></script>\n',b'').replace(b'<script src="bank-manual.js"></script>\n',b'').replace(b'<link rel="stylesheet" href="seo.css">\n',b'').replace(b'<script type="module" src="seo.mjs"></script>\n',b'')
    if source=='hq/sw.js':current=current.replace(b'marleo-hq-seo-v1',b'marleo-hq-v3')
    assert current==old,source+' has changes outside the isolated enterprise extension'
for p in ROOT.glob('assets/*.js'):subprocess.run(['node','--check',str(p)],check=True,capture_output=True)
with tempfile.TemporaryDirectory() as tmp:
    for i,(p,data) in enumerate(pages.items()):
        js=Path(tmp)/f'{i}.js';js.write_text('\n'.join(data.scripts))
        result=subprocess.run(['node','--check',str(js)],capture_output=True,text=True)
        assert result.returncode==0,(str(p),result.stderr)
print(f'{len(pages)} public/HQ pages checked: local destinations, anchors, scripts, languages, services and isolated HQ extension')
