"""Rebuild the English company profile with ReportLab."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
pdfmetrics.registerFont(TTFont("Brand","/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("Brand-Bold","/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import simpleSplit
root=Path(__file__).resolve().parents[2]
W,H=595.28,841.89
out=root/'assets/marleo-company-profile.pdf'
c=canvas.Canvas(str(out),pagesize=(W,H));c.setTitle('Marleo | Company profile');c.setAuthor('Marleo')
bg='#120D12';ink='#F7F2F8';muted='#BDB2C3';orange='#FF8A2B';pink='#FF2A86'
def text(txt,x,y,size=11,color=ink,font='Brand',width=490):
 c.setFont(font,size);c.setFillColor(HexColor(color))
 for line in simpleSplit(txt,font,size,width):c.drawString(x,y,line);y-=size*1.5
 return y

def base(num):
 c.setFillColor(HexColor(bg));c.rect(0,0,W,H,fill=1,stroke=0)
 for i in range(100):
  c.setFillColorRGB(1,.54-(.375*i/99),.17+(.355*i/99));c.rect(i*W/100,H-5,W/100+1,5,fill=1,stroke=0)
 text('MARLEO / COMPANY PROFILE',44,H-38,8,muted,'Brand-Bold')
 c.setStrokeColor(HexColor('#3D2D3A'));c.line(44,54,W-44,54)
 text('marleo.tech  |  info@marleo.tech',44,35,8,muted)
 text(f'{num:02d}',W-60,35,8,muted)
 c.linkURL('https://marleo.tech',(44,28,190,45),relative=0)
def heading(label,y):return text(label.upper(),44,y,9,orange,'Brand-Bold')-12
base(1)
x=42
for i,ch in enumerate('MARLEO'):
 c.setFont('Brand-Bold',76);c.setFillColorRGB(1,.54-(.375*i/5),.17+(.355*i/5));c.drawString(x,H-146,ch);x+=c.stringWidth(ch,'Brand-Bold',76)-2
text('AI systems. Built to operate.',44,625,27,ink,'Brand-Bold')
text('Designed for your next stage.',44,585,23,pink,'Brand-Bold')
text('Marleo connects AI, custom software and existing tools into practical business workflows. We build the digital foundation around them: managed IT, cloud, security, websites and commerce.',44,535,12,width=485)
y=heading('Core capabilities',423)
for title,body in [('AI systems & automation','Document processing, knowledge access, assisted customer support and connected operational workflows.'),('Custom software & integrations','Internal tools, customer portals and integrations shaped around existing business systems.'),('IT & digital platforms','Managed IT, cloud and security, alongside websites, online stores, games and brand identity.')]:
 y=text(title,44,y,13,ink,'Brand-Bold')-6;y=text(body,44,y,10.5,muted)-24
text('Start with one process. Build a system you can evaluate.',44,100,12,ink,'Brand-Bold')
c.showPage();base(2)
y=text('From scope to operation.',44,760,27,ink,'Brand-Bold')-24
for n,title,body in [('01','Discovery','Map the workflow, data, integrations and responsibilities. Agree a scope and budget.'),('02','Pilot','Build one application and evaluate it against representative examples and acceptance criteria.'),('03','Implementation','Complete access controls, error handling, documentation and a phased handover.'),('04','Operation','Agree monitoring, support, usage costs and future improvements.')]:
 text(n,44,y,10,pink,'Brand-Bold');y=text(title,78,y,12,ink,'Brand-Bold')-3;y=text(body,78,y,10,muted,width=465)-18
c.setStrokeColor(HexColor('#3D2D3A'));c.line(44,y+6,W-44,y+6)
y=heading('Selected delivered work',y-20)
for title,body in [('TrustTap','Brand and online store, with custom CRM tooling for customers, orders and NFC configuration.'),('Pain du Mie','Website with online table reservations and a management dashboard.')]:
 y=text(title,44,y,12,ink,'Brand-Bold')-3;y=text(body,44,y,10,muted)-16
y=text('These are web and software references. No AI performance results are claimed.',44,y,9,muted)-26
y=heading('Project principles',y)
y=text('Define permissions and approval points before connecting systems. Agree data processing, hosting and third-party providers. Set ownership, documentation and support responsibilities in writing.',44,y,10.5,muted)-24
text('Discuss your project',44,y,16,ink,'Brand-Bold');text('marleo.tech/en/project-intake/',44,y-27,11,pink)
c.linkURL('https://marleo.tech/en/project-intake/',(44,y-35,365,y+8),relative=0)
c.save();print(out)
