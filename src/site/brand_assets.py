"""Render the existing Marleo code-hexagon mark as crawlable browser icons."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps, ImageFont
import io
ROOT=Path(__file__).resolve().parents[2]
svg='''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ff8a2b"/><stop offset="1" stop-color="#ff2a86"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="#09090f"/><g transform="translate(10 7) scale(1.55)" fill="none" stroke="url(#g)" stroke-linejoin="round"><path d="M14 1.5 26 8.25v15.5L14 30.5 2 23.75V8.25z" stroke-width="2"/><path d="M11 12l-3 4 3 4M17 12l3 4-3 4M15.5 11l-3 10" stroke-width="1.8" stroke-linecap="round"/></g></svg>'''
(ROOT/'favicon.svg').write_text(svg)
size=1024; factor=size/64
mask=Image.new('L',(size,size));draw=ImageDraw.Draw(mask)
def pts(coords):return [((x*1.55+10)*factor,(y*1.55+7)*factor) for x,y in coords]
for coords,width in [([(14,1.5),(26,8.25),(26,23.75),(14,30.5),(2,23.75),(2,8.25),(14,1.5)],2), ([(11,12),(8,16),(11,20)],1.8), ([(17,12),(20,16),(17,20)],1.8), ([(15.5,11),(12.5,21)],1.8)]:
 draw.line(pts(coords),fill=255,width=round(width*1.55*factor),joint='curve')
 for x,y in pts(coords):r=width*1.55*factor/2;draw.ellipse((x-r,y-r,x+r,y+r),fill=255)
gradient=ImageOps.colorize(Image.linear_gradient('L').resize((size,size)), '#ff8a2b','#ff2a86')
image=Image.new('RGB',(size,size),'#09090f');image.paste(gradient,(0,0),mask)
for name,n in [('assets/marleo-icon-512.png',512),('assets/marleo-icon-192.png',192),('apple-touch-icon.png',180)]:image.resize((n,n),Image.Resampling.LANCZOS).save(ROOT/name)
image.resize((64,64),Image.Resampling.LANCZOS).save(ROOT/'favicon.ico',format='ICO',sizes=[(16,16),(32,32),(48,48),(64,64)])
# A first-party sharing image, independent of customer portfolio images.
og=Image.new('RGB',(1200,630),'#09090f');d=ImageDraw.Draw(og)
for x in range(0,1200,60):d.line((x,0,x,630),fill='#14131d')
for y in range(0,630,60):d.line((0,y,1200,y),fill='#14131d')
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
d.text((125,48),'marleo.tech',font=ImageFont.truetype(bold,30),fill='white');og.paste(image.resize((58,58)),(54,36))
d.text((60,144),'AI systems.',font=ImageFont.truetype(bold,84),fill='white')
d.text((60,248),'Custom CRM.',font=ImageFont.truetype(bold,84),fill='#ff7144')
d.text((60,352),'Connected IT.',font=ImageFont.truetype(bold,84),fill='#ff2a86')
d.text((64,532),'SYSTEMS ENGINEERING FOR EUROPEAN ORGANISATIONS',font=ImageFont.truetype(font,22),fill='#c2bacb')
og.save(ROOT/'assets/og.jpg',quality=92,optimize=True)
