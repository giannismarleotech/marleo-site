export const OWNER='77f6201e-8836-46b8-9c7a-0c118c4db61e';
export const PORTAL_URL='https://marleo.tech/portaal/';
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money=n=>Math.round((Number(n)||0)*100)/100;
const s=(v,n=200)=>String(v??'').slice(0,n);
export function email(value){const e=s(value,254).trim().toLowerCase();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))throw new Error('Vul een geldig e-mailadres in.');return e;}
export function text(value,max,required=false){const v=s(value,max+1).trim();if(v.length>max||(required&&!v))throw new Error('Controleer de verplichte velden en tekstlengte.');return v;}
export function serviceInput(b){
 const row={id:s(b.id,40),customer_id:text(b.customer_id,120,true),title:text(b.title,160,true),category:s(b.category),status:s(b.status),description:text(b.description,2000),url:text(b.url,500),period:s(b.period),visible:b.visible!==false,renewal_date:s(b.renewal_date,10),amount:b.amount===''||b.amount==null?null:Number(b.amount)};
 if(!['website','hosting','email','ai','it','other'].includes(row.category)||!['active','in_progress','paused','ended'].includes(row.status)||!['once','month','year','none'].includes(row.period))throw new Error('Kies een geldig type, status en facturatieperiode.');
 if(row.id&&!/^[a-f0-9-]{36}$/.test(row.id))throw new Error('Ongeldige dienst.');
 if(row.amount!==null&&(!Number.isFinite(row.amount)||row.amount<0||row.amount>1000000))throw new Error('Vul een geldig bedrag in.');
 if(row.url){let u;try{u=new URL(row.url);}catch{throw new Error('Gebruik een volledige https:// website-link.');}if(u.protocol!=='https:'||u.username||u.password)throw new Error('Gebruik een veilige https:// website-link.');}
 if(row.renewal_date&&(!/^\d{4}-\d{2}-\d{2}$/.test(row.renewal_date)||Number.isNaN(Date.parse(row.renewal_date))))throw new Error('Controleer de verlengdatum.');
 return row;
}
export function projectInvoice(iv,now=new Date()){
 const lines=Array.isArray(iv.lines)?iv.lines.map(l=>({d:s(l.d,2000),q:Number(l.q)||0,p:Number(l.p)||0})):[];
 const sub=money(lines.reduce((sum,l)=>sum+money(l.q*l.p),0)),vat=money(sub*.21),total=money(sub+vat);
 const type=['factuur','voorschot','eindfactuur','creditnota'].includes(iv.type)?iv.type:'factuur';
 const sign=type==='creditnota'?-1:1;
 const status=iv.status==='betaald'?'betaald':iv.due&&iv.due<now.toISOString().slice(0,10)?'vervallen':'openstaand';
 return {id:s(iv.id,120),ref:s(iv.ref,100),date:s(iv.date,10),due:s(iv.due,10),paidDate:s(iv.paidDate,10),type,status,lines,subtotal:sign*Math.abs(sub),vat:sign*Math.abs(vat),total:sign*Math.abs(total)};
}
export function projectCustomer(c){return {id:s(c.id,120),name:s(c.name,200),address:s(c.address,400),vat:s(c.vat,80),email:s(c.email,254),phone:s(c.phone,80)};}
export function projectCompany(c={}){return Object.fromEntries(['name','legal','vat','address','zip','city','email','phone','iban','bic','terms'].map(k=>[k,s(c[k],k==='terms'?2000:400)]));}
export function customerView(collections,scope,now=new Date()){
 const customer=(collections.customers||[]).find(c=>c.id===scope.customer_id);if(!customer)throw Object.assign(new Error('Klantdossier niet gevonden. Neem contact op met Marleo.'),{status:403});
 const invoices=scope.invoices?(collections.invoices||[]).filter(iv=>iv.customerId===customer.id&&iv.status!=='concept'&&iv.type!=='offerte'&&iv.type!=='quote').map(iv=>projectInvoice(iv,now)).sort((a,b)=>b.date.localeCompare(a.date)):[];
 const balance=money(invoices.filter(iv=>iv.status!=='betaald').reduce((sum,iv)=>sum+iv.total,0));
 return {customer:projectCustomer(customer),company:projectCompany(collections.settings?.company),invoices,balance,permissions:{invoices:!!scope.invoices,services:!!scope.services}};
}
export function invitationMail(name,company,link,invitation=false){
 const title=invitation?'Welkom in je Marleo-portaal':'Je inloglink voor Marleo';
 const body=invitation?'Je eigen klantomgeving staat klaar. Bekijk je facturen, volg je diensten en stel je vragen rechtstreeks aan Marleo.':'Met de knop hieronder open je veilig je klantomgeving.';
 return {subject:title+' — '+company,text:`Hallo ${name},\n\n${body}\n\nOpen je portaal: ${link}\n\nDeze persoonlijke inloglink is tijdelijk geldig en één keer te gebruiken. Vraag via ${PORTAL_URL} een nieuwe link aan als hij verlopen is.\n\nMarleo · info@marleo.tech`,
 html:'<!doctype html><html lang="nl"><body style="margin:0;background:#eeeaf0;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="600" style="width:100%;max-width:600px;background:white;border-radius:16px;overflow:hidden" cellpadding="0" cellspacing="0"><tr><td style="background:#12131c;padding:28px"><img src="https://marleo.tech/marleo-logo-mail-dark.png" alt="marleo.tech" width="180" style="display:block;max-width:100%;height:auto"></td></tr><tr><td style="height:4px;background:linear-gradient(90deg,#f97c1f,#e91e7b)"></td></tr><tr><td style="padding:32px 28px;color:#241e2a"><p style="font-size:12px;letter-spacing:2px;color:#a64e38">JOUW KLANTOMGEVING</p><h1 style="font-size:29px">'+esc(title)+'</h1><p style="font-size:16px;line-height:1.7">Hallo '+esc(name)+',</p><p style="font-size:16px;line-height:1.7">'+esc(body)+'</p><p style="font-size:16px;line-height:1.7"><b>'+esc(company)+'</b></p><p style="margin:28px 0"><a href="'+esc(link)+'" style="display:inline-block;background:#ed405f;color:white;text-decoration:none;padding:16px 24px;border-radius:8px;font-weight:bold">Open mijn portaal</a></p><p style="font-size:13px;line-height:1.6;color:#716575">Deze persoonlijke link is tijdelijk geldig en één keer te gebruiken. Verlopen? Vraag een nieuwe link aan op <a href="'+PORTAL_URL+'">marleo.tech/portaal</a>.</p><p style="font-size:13px;line-height:1.6;color:#716575">Heb je dit niet aangevraagd? Dan kun je deze e-mail negeren.</p></td></tr><tr><td style="background:#12131c;color:#c6b9cc;padding:24px 28px;font-size:13px">Marleo · <a href="mailto:info@marleo.tech" style="color:#f8a06e">info@marleo.tech</a></td></tr></table></td></tr></table></body></html>'};
}
