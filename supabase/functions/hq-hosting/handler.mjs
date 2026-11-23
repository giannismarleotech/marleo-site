export const HOST='https://web0175.zxcs.nl:2222';
export const OWNER='77f6201e-8836-46b8-9c7a-0c118c4db61e';
export function validateDomains(rows){
 if(!Array.isArray(rows)||!rows.length||rows.length>100)throw new Error('Voeg minstens één domein toe (maximaal 100).');
 const seen=new Set();return rows.map(row=>{
  const domain=String(row.domain||'').trim().toLowerCase();
  if(domain.length>253||! /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)||seen.has(domain))throw new Error('Controleer de domeinnamen: geen URL’s, poorten of dubbels.');
  seen.add(domain);return {domain,customerId:String(row.customerId||'').slice(0,120),label:String(row.label||domain).slice(0,160)};
 });
}
export function mailboxName(value){
 if(typeof value!=='string'||!/^[a-z0-9][a-z0-9._-]{0,63}$/.test(value))throw new Error('Gebruik een mailboxnaam met letters, cijfers, punt, streepje of underscore.');return value;
}
export function validatePassword(value){
 if(typeof value!=='string'||value.length<14||value.length>128||/[^\x20-\x7e]/.test(value))throw new Error('Gebruik een wachtwoord van 14 tot 128 tekens, zonder regeleinden of bijzondere lettertekens.');return value;
}
function nested(v){
 if(v&&typeof v==='object')return v;
 return Object.fromEntries(new URLSearchParams(String(v||'')));
}
export function parseMailboxes(raw,domain){
 if(typeof raw==='string'&&raw.trim().startsWith('<'))throw new Error('Vimexx stuurde een inlogpagina in plaats van mailboxgegevens. Controleer je gebruikersnaam en Login Key.');
 const data=typeof raw==='string'?Object.fromEntries(new URLSearchParams(raw)):raw;
 if(!data||typeof data!=='object'||String(data.error)==='1')throw new Error('DirectAdmin heeft de aanvraag geweigerd. Controleer de sleutel, rechten en IP-beperking.');
 const rows=[];
 for(const [name,value] of Object.entries(data)){
  if(!/^[a-z0-9][a-z0-9._-]{0,63}$/.test(name)||['error','text','details','domain','action','list','debug'].includes(name))continue;
  const item=nested(value);
  if(!('quota'in item||'usage'in item||'usage_bytes'in item||'limit'in item))continue;
  const quota=Number(item.quota);
  if(!Number.isFinite(quota)||quota<0)throw new Error('De mailboxlimiet kon niet betrouwbaar worden gelezen.');
  rows.push({name,email:name+'@'+domain,quotaMB:quota,usageMB:Number(item.usage)||0,suspended:item.suspended==='yes',limit:String(item.limit??'')});
 }
 if(!rows.length&&Object.keys(data).length&&!('error' in data)&&!Object.keys(data).some(k=>k.startsWith('list')))throw new Error('Onverwachte mailboxgegevens ontvangen van Vimexx.');
 return rows.sort((a,b)=>a.name.localeCompare(b.name));
}
async function bounded(req,max){
 const reader=req.body?.getReader();if(!reader)throw new Error('Lege aanvraag.');let len=0;const chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;len+=value.length;if(len>max){await reader.cancel();throw new Error('Aanvraag is te groot.');}chunks.push(value);}
 const bytes=new Uint8Array(len);let offset=0;for(const value of chunks){bytes.set(value,offset);offset+=value.length;}
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new Error('Ongeldige aanvraag.');}
}
export function makeHandler({url,key,fetcher=fetch}){
 const origins=new Set(['https://marleo.tech','https://www.marleo.tech','https://giannismarleotech.github.io']);
 return async req=>{
  const origin=req.headers.get('origin');
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Pragma':'no-cache','Vary':'Origin',
   'Access-Control-Allow-Origin':origins.has(origin)?origin:'https://marleo.tech','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};
  const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
  if(origin&&!origins.has(origin))return reply({error:'Oorsprong niet toegestaan.'},403);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return reply({error:'Gebruik POST.'},405);
  if(!url||!key)return reply({error:'Serverconfiguratie ontbreekt.'},503);
  const auth=req.headers.get('authorization');if(!auth?.startsWith('Bearer '))return reply({error:'Log opnieuw in op HQ.'},401);
  let user,session;
  try{
   const r=await fetcher(url+'/auth/v1/user',{headers:{apikey:key,Authorization:auth},signal:AbortSignal.timeout(8000)});
   if(!r.ok)return reply({error:'Log opnieuw in op HQ.'},401);user=await r.json();
   if(user.id!==OWNER)return reply({error:'Alleen de eigenaar van Marleo HQ heeft toegang tot hostingbeheer.'},403);
   const payload=JSON.parse(atob(auth.slice(7).split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));session=payload.session_id;
   if(typeof session!=='string'||!/^[0-9a-f-]{36}$/.test(session))return reply({error:'Log opnieuw in op HQ.'},401);
  }catch{return reply({error:'Je sessie kon niet worden gecontroleerd. Log opnieuw in.'},401);}
  const dbHeaders={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
  async function gate(action,payload={}){
   const r=await fetcher(url+'/rest/v1/rpc/hq_hosting_gate',{method:'POST',headers:dbHeaders,body:JSON.stringify({p_actor:user.id,p_session:session,p_action:action,p_payload:payload}),signal:AbortSignal.timeout(10000)});
   if(!r.ok){const error=await r.json().catch(()=>({}));if(error.code==='42501')throw Object.assign(new Error('Je sessie is verlopen. Log opnieuw in.'),{status:401});if(String(error.message||'').startsWith('Er wordt al een wijziging'))throw Object.assign(new Error(error.message),{status:409});if(error.message==='Rate limit')throw Object.assign(new Error('Te veel aanvragen. Wacht één minuut.'),{status:429});throw new Error('Beveiligde opslag is niet beschikbaar.');}
   return r.json();
  }
  async function da(config,params,mutate=false){
   // The destination and command are fixed. Browser input can never select a host, path or action.
   let r;try{r=await fetcher(HOST+'/CMD_API_POP'+(!mutate?'?'+new URLSearchParams(params):''),{method:mutate?'POST':'GET',redirect:'error',headers:{Authorization:'Basic '+btoa(config.username+':'+config.key),...(mutate?{'Content-Type':'application/x-www-form-urlencoded'}:{})},...(mutate?{body:new URLSearchParams(params).toString()}:{}),signal:AbortSignal.timeout(12000)});}catch{
    throw Object.assign(new Error(mutate?'Geen bevestiging van Vimexx ontvangen. De wijziging kan al uitgevoerd zijn. Controleer de mailbox voordat je opnieuw probeert.':'Vimexx is niet bereikbaar. Controleer de servertoegang en IP-beperking.'),{uncertain:mutate});
   }
   if(!r.ok)throw Object.assign(new Error(mutate&&r.status>=500?'Vimexx gaf geen betrouwbare bevestiging. Controleer de mailbox voordat je opnieuw probeert.':'Vimexx weigert de verbinding. Controleer de gebruikersnaam, sleutel, CMD_API_POP en Allowed IPs.'),{uncertain:mutate&&r.status>=500});
   const raw=await r.text();if(raw.length>500000)throw new Error('Onverwacht antwoord van Vimexx.');
   let data;try{data=JSON.parse(raw);}catch{data=Object.fromEntries(new URLSearchParams(raw));}
   if(String(data.error)==='1')throw new Error('DirectAdmin heeft de aanvraag geweigerd. Controleer de gegevens en mailboxinstellingen.');
   if(mutate&&String(data.error)!=='0')throw Object.assign(new Error('Geen betrouwbare bevestiging van de wijziging ontvangen. Controleer de mailbox voordat je opnieuw probeert.'),{uncertain:true});
   return data;
  }
  const audit=(action,domain,mailbox)=>gate('audit',{action,domain,mailbox});
  let lock=null,keepLock=false;
  try{
   await gate('rate');
   const b=await bounded(req,32000);
   if(!b||typeof b!=='object')return reply({error:'Ongeldige aanvraag.'},400);
   const allowed=['status','connect','list','change_password','create_mailbox','reveal','audit'];
   if(!allowed.includes(b.action))return reply({error:'Onbekende actie.'},400);
   const config=await gate('config_get');
   if(b.action==='status')return reply({ok:true,connected:!!config.key,server:HOST,username:config.username||'',domains:config.domains||[]});
   if(b.action==='audit')return reply({ok:true,rows:await gate('audit_list')});
   if(b.action==='connect'){
    const domains=validateDomains(b.domains),username=String(b.username||'').trim();
    if(!/^[a-zA-Z0-9_]{1,64}$/.test(username))return reply({error:'Vul je DirectAdmin-gebruikersnaam in, niet de naam van de sleutel.'},400);
    const apiKey=b.key||(username===config.username?config.key:'');
    if(typeof apiKey!=='string'||apiKey.length<20||apiKey.length>256||/[^\x21-\x7e]/.test(apiKey))return reply({error:'Vul een geldige gegenereerde Login Key in (minimaal 20 tekens).'},400);
    const next={username,key:apiKey,domains};
    // Read-only test, never creates/modifies a mailbox during connection setup.
    parseMailboxes(await da(next,{action:'full_list',domain:domains[0].domain}),domains[0].domain);
    await gate('config_save',next);await audit('connected');return reply({ok:true,connected:true,message:'Verbinding getest en sleutel versleuteld opgeslagen.'});
   }
   if(!config.key)return reply({error:'Verbind eerst met Vimexx.'},409);
   const domain=String(b.domain||'').toLowerCase();
   if(!config.domains.some(d=>d.domain===domain))return reply({error:'Dit domein is niet gekoppeld aan hostingbeheer.'},403);
   if(b.action==='list'){
    const rows=parseMailboxes(await da(config,{action:'full_list',domain}),domain),stored=await gate('password_index',{domain});
    await audit('listed',domain);
    return reply({ok:true,rows:rows.map(row=>({...row,savedAt:stored.find(item=>item.mailbox===row.name)?.updated_at||null}))});
   }
   const mailbox=mailboxName(b.mailbox);
   if(b.action==='reveal'){
    // Confirm the mailbox still exists before returning a previously stored password.
    const rows=parseMailboxes(await da(config,{action:'full_list',domain}),domain);
    if(!rows.some(row=>row.name===mailbox))return reply({error:'Deze mailbox bestaat niet meer bij Vimexx.'},404);
    await audit('password_viewed',domain,mailbox);const secret=await gate('password_get',{domain,mailbox});
    if(!secret.password)return reply({error:'Geen wachtwoord in de kluis. Bestaande wachtwoorden zijn niet uit Vimexx uit te lezen.'},404);
    return reply({ok:true,...secret});
   }
   if(b.confirm!==true)return reply({error:'Bevestig de wijziging eerst.'},400);
   const password=validatePassword(b.password);
   lock={domain,mailbox,token:crypto.randomUUID()};await gate('lock',lock);
   const rows=parseMailboxes(await da(config,{action:'full_list',domain}),domain);
   const existing=rows.find(row=>row.name===mailbox);
   if(b.action==='change_password'&&!existing)return reply({error:'Mailbox niet gevonden. Vernieuw het overzicht.'},404);
   if(b.action==='create_mailbox'&&existing)return reply({error:'Deze mailbox bestaat al.'},409);
   let params;
   if(b.action==='change_password'){
    // Preserve the existing quota and send limit when changing only the password.
    params={action:'modify',domain,user:mailbox,passwd:password,passwd2:password,quota:existing.quotaMB===0?'0':existing.quotaMB+'MB'};
    if(existing.limit!=='')params.limit=existing.limit;
    await audit('change_started',domain,mailbox);
   }else{
    if(!Number.isInteger(b.quotaMB)||b.quotaMB<1||b.quotaMB>100000)return reply({error:'Kies een mailboxlimiet tussen 1 en 100000 MB.'},400);
    params={action:'create',domain,user:mailbox,passwd:password,passwd2:password,quota:String(b.quotaMB)};await audit('create_started',domain,mailbox);
   }
   await da(config,params,true);
   let stored=true;try{await gate('password_save',{domain,mailbox,password});}catch{stored=false;}
   try{await audit(b.action==='change_password'?'password_changed':'mailbox_created',domain,mailbox);}catch{/* A successful provider change must never be reported as a failed change. */}
   return reply({ok:true,changed:true,stored,message:b.action==='change_password'?'Wachtwoord gewijzigd bij Vimexx.':'Mailbox aangemaakt bij Vimexx.',...(!stored?{warning:'De wijziging bij Vimexx is geslaagd, maar opslaan in de kluis is mislukt. Bewaar het nieuwe wachtwoord zelf.'}:{})});
  }catch(error){keepLock=!!error.uncertain;return reply({error:error.message||'Aanvraag mislukt.',...(error.uncertain?{uncertain:true}:{})},error.status||(error.uncertain?502:400));}
  finally{if(lock&&!keepLock)try{await gate('unlock',lock);}catch{}}
 };
}
