const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const jspdf=require(process.env.MARLEO_JSPDF_MODULE||'jspdf');
const context={window:{jspdf}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'assets/pdf-documents.js'),'utf8'),context);
const pdf=context.window.MarleoPDF;
assert.deepEqual(Buffer.from(pdf.wordmark.split(',')[1],'base64'),fs.readFileSync(path.join(root,'assets/marleo-email-wordmark.png')));
const destination=process.env.MARLEO_PDF_TEST_OUTPUT;
if(destination)fs.mkdirSync(destination,{recursive:true});
const company={name:'Marleo',legal:'Marleo - documentvoorbeeld',address:'Voorbeeldstraat 1',zip:'9000',city:'Gent',vat:'BE0000000000',email:'demo@example.invalid',phone:'+32 000 00 00 00',website:'marleo.tech',iban:'BE00 0000 0000 0000',bic:'TESTBIC'};
const customer={name:'Voorbeeldklant',address:'Voorbeeldadres',vat:'BE0000000001'};
const longNote=('Resultaatgarantie: de echte aanvragen worden gemeten tegenover de afgesproken nulmeting. Dit is een documentvoorbeeld, geen klantgegevens.\n\n').repeat(34)+'€800 SEA-advertentietegoed inbegrepen. EINDE-VOLLEDIGE-VOORWAARDEN';
const cases=[
 ['offerte',{type:'offerte',lang:'nl',lines:[{d:'Compleet marketingpakket\nFacebook, Instagram, Google Ads, SEO, GEO/AEO, tracking en dashboard.',q:1,p:235},{d:'€800 SEA-advertentietegoed inbegrepen',q:1,p:0}],note:longNote},235,49.35,284.35],
 ['factuur',{type:'factuur',lang:'nl',lines:[{d:'Website op maat',q:1,p:279}],note:''},279,58.59,337.59],
 ['voorschot',{type:'voorschot',lang:'fr',lines:[{d:'Acompte site web',q:1,p:139.5}],note:''},139.5,29.3,168.8],
 ['eindfactuur',{type:'eindfactuur',lang:'en',lines:[{d:'Final balance',q:1,p:139.5}],note:'Remaining balance after advance.'},139.5,29.3,168.8],
 ['creditnota',{type:'creditnota',lang:'nl',lines:[{d:'Correctie',q:1,p:-50}],note:''},-50,-10.5,-60.5],
 ['lange-factuur',{type:'factuur',lang:'nl',lines:Array.from({length:65},(_,i)=>({d:'Dienst '+(i+1)+'\nUitgebreide omschrijving van de uitgevoerde werkzaamheden.',q:1,p:10})),note:'LAATSTE-NOTITIE'},650,136.5,786.5],
 ['ondertekende-offerte',{type:'offerte',lang:'nl',lines:[{d:'Ondertekende testofferte',q:1,p:235}],note:'Alle afspraken zichtbaar.'},235,49.35,284.35],
];
for(const [name,data,subtotal,vat,total] of cases){
 const iv={ref:'TEST-'+name,date:'2026-11-24',due:'2026-12-24',...data};
 const doc=pdf.invoice(iv,{company,customer,title:name.toUpperCase(),subtotal,vat,total,signed:name==='ondertekende-offerte'?{name:'Testondertekenaar',at:'24 nov 2026'}:null});
 assert.ok(doc.getNumberOfPages()>=1);
 if(name==='offerte'||name==='lange-factuur')assert.ok(doc.getNumberOfPages()>1);
 const buffer=Buffer.from(doc.output('arraybuffer'));assert.ok(buffer.length>20000);
 if(destination)fs.writeFileSync(path.join(destination,name+'.pdf'),buffer);
}
// Exercise the actual HQ and online-offer entry points, not just the renderer.
const html=fs.readFileSync(path.join(root,'hq/index.html'),'utf8');
const start=html.indexOf('function buildInvPdf('),end=html.indexOf('/* ============ UITGAVEN',start);
Object.assign(context,{MarleoPDF:pdf,window:context.window,DATA:{invoices:[]},coCfg:()=>company,customer:()=>customer,invSub:iv=>iv.lines.reduce((s,l)=>s+l.q*l.p,0),invVat:iv=>Math.round(iv.lines.reduce((s,l)=>s+l.q*l.p,0)*21)/100,invTot:iv=>Math.round(iv.lines.reduce((s,l)=>s+l.q*l.p,0)*121)/100});
vm.runInContext(html.slice(start,end),context);
const attachment=context.buildInvPdf({ref:'TEST-ATTACHMENT',type:'offerte',date:'2026-11-24',due:'2026-12-24',customerId:'test',lang:'nl',lines:[{d:'Mailbijlage',q:1,p:235}],note:longNote},true);
assert.ok(attachment.name.endsWith('.pdf'));assert.ok(Buffer.from(attachment.b64,'base64').subarray(0,5).equals(Buffer.from('%PDF-')));
if(destination)fs.writeFileSync(path.join(destination,'hq-mailbijlage.pdf'),Buffer.from(attachment.b64,'base64'));
Object.assign(context,{SCAN:{naam:'Voorbeeldbedrijf',url:'https://example.invalid',items:Array.from({length:18},(_,i)=>({ok:i%2===0,label:'Controle '+(i+1),detail:'Leesbare toelichting bij deze controle, inclusief concrete bevindingen.'}))},loadJsPDF:cb=>cb(),gxDomain:()=> 'example.invalid'});
const scanStart=html.indexOf('function scanPdfDoc('),scanEnd=html.indexOf('function scanPdf(){',scanStart);
vm.runInContext(html.slice(scanStart,scanEnd),context);
context.scanPdfDoc(doc=>{assert.ok(doc.getNumberOfPages()>1);if(destination)fs.writeFileSync(path.join(destination,'website-scan.pdf'),Buffer.from(doc.output('arraybuffer')));});
const offer=fs.readFileSync(path.join(root,'offerte/index.html'),'utf8'),offerStart=offer.indexOf('function pdf(){'),offerEnd=offer.indexOf('\nload();',offerStart);
let captured=null;const original=pdf.invoice;pdf.invoice=(iv,options)=>{const doc=original(iv,options);doc.save=()=>{captured=doc;};return doc;};
Object.assign(context,{S:{data:{company,customer,ref:'TEST-ONLINE',date:'2026-11-24',valid:'2026-12-24',lines:[{d:'Online offerte',q:1,p:235}],sub:235,vat:49.35,tot:284.35,note:longNote,terms:'EINDE-ONLINE-VOORWAARDEN'},status:'getekend',signed_name:'Testondertekenaar',signed_at:'2026-11-24'},fmtDT:()=> '24 nov 2026'});
vm.runInContext(offer.slice(offerStart,offerEnd),context);context.pdf();assert.ok(captured);if(destination)fs.writeFileSync(path.join(destination,'online-offerte.pdf'),Buffer.from(captured.output('arraybuffer')));
let brochure='';Object.assign(context,{esc:value=>String(value??''),logAct:()=>{},window:{jspdf,open:()=>({document:{write:value=>{brochure=value;},close:()=>{}}})}});
const catalogueStart=html.indexOf('var MARLEO_DIENSTEN='),catalogueEnd=html.indexOf('function rNotes(){',catalogueStart);
vm.runInContext(html.slice(catalogueStart,catalogueEnd),context);context.dienstPdf('alles');assert.ok(brochure.includes(pdf.wordmark));assert.ok(!brochure.includes('<text x="20"'));
if(destination)fs.writeFileSync(path.join(destination,'brochure.html'),brochure);
console.log('PDF checks passed: original logo bytes, all document types, long notes, multi-page items, signed online quote, scan, brochures and real HQ email attachment. No records changed or emails sent.');
