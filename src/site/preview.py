"""Build a self-contained English homepage for review without deployment."""
from pathlib import Path
import re
import base64

root = Path(__file__).resolve().parents[2]
s = (root / 'index.html').read_text()
css = (root / 'assets/site.css').read_text() + '\n' + (root / 'assets/ai-positioning.css').read_text()
font = base64.b64encode((root / 'assets/fonts/inter.woff2').read_bytes()).decode()
css = css.replace('/assets/fonts/inter.woff2', 'data:font/woff2;base64,' + font)
s = re.sub(r'<link rel="(?:stylesheet|preload)"[^>]+>', '', s)
s = re.sub(r'<script defer src="[^"]+"></script>', '', s)
s = s.replace('</head>', '<style>' + css + '</style></head>')
s = s.replace('document.documentElement.classList.add("js");', '')
s = s.replace('</body>', '<script>' + '\n'.join((root / name).read_text() for name in ('assets/site.js','assets/ai-demo.js','assets/brand-header.js','assets/systems.js')) + '</script></body>')
s = re.sub(r' srcset="[^"]*"', '', s)
def inline(match):
    path = root / match[1].lstrip('/')
    return 'src="data:image/webp;base64,' + base64.b64encode(path.read_bytes()).decode() + '"' if path.exists() else match[0]
s = re.sub(r'src="(/assets/work/[^"]+)"', inline, s)
s = s.replace('<body>', '<body><div style="padding:10px 20px;background:#291b24;color:#e8c8d8;font:12px Inter,sans-serif;text-align:center">PREVIEW · Website changes have not been published</div>')
(root / 'docs/ai-preview.html').write_text(s)
