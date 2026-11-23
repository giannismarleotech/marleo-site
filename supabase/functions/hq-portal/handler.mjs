import {OWNER,PORTAL_URL,email,text,serviceInput,customerView,invitationMail} from './schema.mjs';
const languageOf=value=>value==='en'?'en':'nl';
const GENERIC='Als dit e-mailadres toegang heeft, ontvang je een inloglink. Controleer ook je spammap.';
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(n=>n.toString(16).padStart(2,'0')).join('');
async function body(req){let size=0;const chunks=[];const reader=req.body?.getReader();if(!reader)throw new Error('Lege aanvraag.');while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>22000){await reader.cancel();throw new Error('Aanvraag te groot.');}chunks.push(value);}const all=new Uint8Array(size);let pos=0;for(const c of chunks){all.set(c,pos);pos+=c.length;}try{return JSON.parse(new TextDecoder().decode(all));}catch{throw new Error('Ongeldige aanvraag.');}}
export function makeHandler({url,key,mailKey,fetcher=fetch}){
 const origins=new Set(['https://marleo.tech','https://www.marleo.tech','https://giannismarleotech.github.io']);
 return async req=>{
  const origin=req.headers.get('origin');const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Origin':origins.has(origin)?origin:'https://marleo.tech','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};
  const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
  if(origin&&!origins.has(origin))return reply({error:'Oorsprong niet toegestaan.'},403);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return reply({error:'Gebruik POST.'},405);
  if(!url||!key)return reply({error:'Portaal tijdelijk niet beschikbaar.'},503);
  const dbHeaders={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
  let actor=null,session=null;
  async function gate(action,payload={}){
   const r=await fetcher(url+'/rest/v1/rpc/hq_portal_gate',{method:'POST',headers:dbHeaders,body:JSON.stringify({p_actor:actor,p_session:session,p_action:action,p_payload:payload}),signal:AbortSignal.timeout(10000)});
   if(!r.ok){const e=await r.json().catch(()=>({}));throw Object.assign(new Error(e.code==='42501'?'Geen actieve toegang. Log opnieuw in of neem contact op met Marleo.':e.code==='P0001'?String(e.message).slice(0,250):'De portaalgegevens konden niet worden verwerkt.'),{status:e.code==='42501'?403:400});}
   return r.json();
  }
  async function crm(){
   const r=await fetcher(url+'/rest/v1/crm_state?user_id=eq.'+OWNER+'&collection=in.(customers,invoices,settings)&select=collection,data',{headers:dbHeaders,signal:AbortSignal.timeout(10000)});
   if(!r.ok)throw new Error('Het klantdossier kon niet worden geladen.');const rows=await r.json();return Object.fromEntries(rows.map(r=>[r.collection,r.data]));
  }
  async function generateLink(address){
   const r=await fetcher(url+'/auth/v1/admin/generate_link',{method:'POST',headers:dbHeaders,body:JSON.stringify({type:'magiclink',email:address,redirect_to:PORTAL_URL}),signal:AbortSignal.timeout(10000)});
   if(!r.ok)throw new Error('De inloglink kon niet worden gemaakt. Probeer het later opnieuw.');
   const data=await r.json();const generatedUser=data.user||data;if(!generatedUser.id||!data.hashed_token)throw new Error('De inloglink kon niet worden gecontroleerd.');
   if(generatedUser.id===OWNER)throw new Error('Gebruik voor een klantaccount een ander adres dan het Marleo-beheerdersadres.');
   return {userId:generatedUser.id,link:PORTAL_URL+'#token_hash='+encodeURIComponent(data.hashed_token)+'&type=email'};
  }
  async function send(address,mail,id){
   if(!mailKey)throw new Error('E-mailverzending is nog niet ingesteld.');
   const r=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+mailKey,'Content-Type':'application/json','Idempotency-Key':id},body:JSON.stringify({from:'Marleo <info@marleo.tech>',to:[address],reply_to:'info@marleo.tech',subject:mail.subject,html:mail.html,text:mail.text}),signal:AbortSignal.timeout(12000)});
   if(!r.ok)throw new Error('De e-mailprovider heeft de uitnodiging niet bevestigd.');
   const result=await r.json();if(!result.id)throw new Error('Geen verzendbevestiging ontvangen.');return result.id;
  }
  try{
   const b=await body(req);const requestedLanguage=languageOf(b.language);const generic=requestedLanguage==='en'?'If this email address has access, you will receive a login link. Please also check your spam folder.':GENERIC;
   if(b.action==='login'){
    try{
     const address=email(b.email);if(address==='giannis@marleo.tech')return reply({ok:true,message:generic});
     const account=await gate('login_claim',{email:address,email_hash:await hash(address),ip_hash:await hash(req.headers.get('cf-connecting-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown')});
     if(account.id&&mailKey){const generated=await generateLink(address);if(generated.userId===account.user_id)await send(address,invitationMail(account.display_name,requestedLanguage==='en'?'Marleo portal':'Marleo-portaal',generated.link,false,b.language?requestedLanguage:languageOf(account.language)),'portal-login-'+crypto.randomUUID());}
    }catch{/* Do not expose whether an email has an account, a rate limit or a delivery problem. */}
    return reply({ok:true,message:generic});
   }
   const auth=req.headers.get('authorization');if(!auth?.startsWith('Bearer '))return reply({error:'Log eerst in.'},401);
   const r=await fetcher(url+'/auth/v1/user',{headers:{apikey:key,Authorization:auth},signal:AbortSignal.timeout(8000)});
   if(!r.ok)return reply({error:'Je sessie is verlopen. Log opnieuw in.'},401);
   const user=await r.json();actor=user.id;
   try{session=JSON.parse(atob(auth.slice(7).split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).session_id;}catch{}
   if(!/^[a-f0-9-]{36}$/.test(session||''))return reply({error:'Log opnieuw in.'},401);
   await gate('rate');
   const adminActions=['admin_data','invite','resend','account_toggle','account_update','service_save','ticket_reply','preview','email_preview'];
   if(adminActions.includes(b.action)&&actor!==OWNER)return reply({error:'Alleen Marleo kan deze actie uitvoeren.'},403);
   if(b.action==='admin_data')return reply({ok:true,...await gate('admin_data'),mailReady:!!mailKey,portalUrl:PORTAL_URL});
   if(b.action==='email_preview')return reply({ok:true,...invitationMail(text(b.name,160)||'klant',text(b.company,200)||'Jouw bedrijf',PORTAL_URL,true,requestedLanguage)});
   if(b.action==='invite'||b.action==='resend'){
    if(!mailKey)return reply({error:'E-mailverzending is nog niet ingesteld.'},503);
    let address,customerId,name,invoices,services,language=requestedLanguage;
    if(b.action==='resend'){
     const data=await gate('admin_data'),existing=data.accounts.find(a=>a.id===b.id&&a.active);if(!existing)return reply({error:'Geen actief account gevonden.'},404);
     ({email:address,customer_id:customerId,display_name:name,invoices,services,language}=existing);
    }else{address=email(b.email);customerId=text(b.customer_id,120,true);name=text(b.display_name,160,true);invoices=b.invoices!==false;services=b.services!==false;}
    if(address==='giannis@marleo.tech')return reply({error:'Dit is het Marleo-beheerdersadres. Kies het e-mailadres van de klant.'},400);
    const collections=await crm(),customer=(collections.customers||[]).find(c=>c.id===customerId);
    if(!customer)return reply({error:'Klant niet gevonden. Synchroniseer HQ en probeer opnieuw.'},404);
    const current=await gate('admin_data');const duplicate=current.accounts.find(a=>a.email===address);
    if(duplicate&&duplicate.customer_id!==customerId)return reply({error:'Dit e-mailadres heeft al toegang tot een andere klant.'},409);
    const generated=await generateLink(address);
    const result=await gate('account_save',{user_id:generated.userId,customer_id:customerId,email:address,display_name:name,invoices,services,language:languageOf(language)});
    let sent=false;
    try{
     const requestId=/^[a-f0-9-]{36}$/.test(b.request_id||'')?b.request_id:crypto.randomUUID();
     await send(address,invitationMail(name,customer.name,generated.link,true,languageOf(language)),'portal-invite-'+requestId);sent=true;
    }catch{return reply({ok:true,accountCreated:true,sent:false,id:result.id,message:'Account aangemaakt, maar de e-mail is niet bevestigd. Controleer het adres en gebruik Uitnodiging opnieuw sturen.'});}
    if(sent)try{await gate('invited',{id:result.id});}catch{}
    return reply({ok:true,accountCreated:true,sent:true,id:result.id,message:'Account aangemaakt en uitnodiging verstuurd.'});
   }
   if(b.action==='account_update'){if(typeof b.invoices!=='boolean'||typeof b.services!=='boolean')throw new Error('Controleer de accountrechten.');await gate('account_update',{id:text(b.id,40,true),display_name:text(b.display_name,160,true),invoices:b.invoices,services:b.services,language:requestedLanguage});return reply({ok:true});}
   if(b.action==='account_toggle'){if(typeof b.active!=='boolean')throw new Error('Ongeldige accountstatus.');await gate('account_toggle',{id:text(b.id,40,true),active:b.active});return reply({ok:true});}
   if(b.action==='service_save'){await gate('service_save',serviceInput(b));return reply({ok:true});}
   if(b.action==='ticket_reply'){
    if(!['open','in_progress','closed'].includes(b.status))throw new Error('Ongeldige status.');await gate('ticket_reply',{id:text(b.id,40,true),reply:text(b.reply,5000),status:b.status});return reply({ok:true});
   }
   if(b.action==='set_language'){await gate('set_language',{language:requestedLanguage});return reply({ok:true,language:requestedLanguage});}
   if(!['summary','invoice','ticket_create','preview'].includes(b.action))return reply({error:'Onbekende actie.'},400);
   const scope=await gate('scope',actor===OWNER?{customer_id:text(b.customer_id,120,true)}:{});
   const collections=await crm();const view=customerView(collections,scope);
   if(b.action==='invoice'){
    const invoice=view.invoices.find(iv=>iv.id===b.id);if(!invoice)return reply({error:'Factuur niet gevonden of niet beschikbaar.'},404);
    return reply({ok:true,customer:view.customer,company:view.company,invoice});
   }
   if(b.action==='ticket_create'){
    if(actor===OWNER)return reply({error:'Vragen aanmaken kan alleen vanuit een klantaccount.'},400);
    await gate('ticket_create',{subject:text(b.subject,160,true),message:text(b.message,5000,true)});return reply({ok:true});
   }
   let services=[],tickets=[];
   if(actor===OWNER){const all=await gate('admin_data');services=all.services.filter(s=>s.customer_id===scope.customer_id&&s.visible);tickets=all.tickets.filter(t=>t.customer_id===scope.customer_id);}
   else{services=await gate('client_services');tickets=await gate('client_tickets');}
   return reply({ok:true,...view,services,tickets,language:languageOf(scope.language),displayName:scope.display_name||view.customer.name,preview:actor===OWNER});
  }catch(error){return reply({error:error.message||'Portaal tijdelijk niet beschikbaar.'},error.status||400);}
 };
}
