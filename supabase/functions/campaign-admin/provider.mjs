export const EVENTS=['email.sent','email.delivered','email.opened','email.clicked','email.bounced','email.complained','email.failed','email.delivery_delayed','email.suppressed'];
export async function inspectProvider({db,apiKey,url,fetcher=fetch,configure=false}){
 const report={mailReady:!!apiKey,openTracking:null,clickTracking:null,webhookReady:false,verified:false,checkedAt:new Date().toISOString()};
 async function api(path,method='GET',body){const r=await fetcher('https://api.resend.com'+path,{method,headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json','User-Agent':'Marleo-HQ/1.0'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(12000)});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(r.status===401||r.status===403?'De Resend-sleutel heeft geen toegang tot de trackinginstellingen.':r.status===429?'De maildienst vraagt even te wachten. Probeer later opnieuw.':'Trackinginstellingen zijn tijdelijk niet bereikbaar ('+r.status+').');return data;}
 try{
  if(!apiKey)throw new Error('E-mailverzending is nog niet ingesteld.');
  const domains=await api('/domains');const domain=(domains.data||[]).find(d=>d.name==='marleo.tech');if(!domain)throw new Error('Het verzenddomein marleo.tech is niet gevonden bij de maildienst.');
  let details=await api('/domains/'+encodeURIComponent(domain.id));
  report.domainVerified=details.status==='verified';report.openTracking=details.open_tracking===true;report.clickTracking=details.click_tracking===true;
  if(configure&&(!report.openTracking||!report.clickTracking)){await api('/domains/'+encodeURIComponent(domain.id),'PATCH',{open_tracking:true,click_tracking:true});details=await api('/domains/'+encodeURIComponent(domain.id));report.openTracking=details.open_tracking===true;report.clickTracking=details.click_tracking===true;}
  const hooks=await api('/webhooks');
  const base=url+'/functions/v1/mailhook';const matching=(hooks.data||[]).filter(h=>{try{const u=new URL(h.endpoint);return u.origin+u.pathname===base;}catch{return false;}});
  let hook=matching.find(h=>h.status==='enabled')||matching[0];
  if(!hook&&configure)hook=await api('/webhooks','POST',{endpoint:base,events:EVENTS});
  if(hook){const details=await api('/webhooks/'+encodeURIComponent(hook.id));const secret=details.signing_secret||hook.signing_secret;
   if(configure&&secret){const {error}=await db.from('mail_cfg').upsert({key:'tracking_webhook_secret',value:secret});if(error)throw new Error('De verificatie van de trackingkoppeling kon niet worden opgeslagen.');}
   if(configure&&(details.status!=='enabled'||!EVENTS.every(e=>(details.events||[]).includes(e))))await api('/webhooks/'+encodeURIComponent(hook.id),'PATCH',{status:'enabled',events:EVENTS});
   const final=configure?await api('/webhooks/'+encodeURIComponent(hook.id)):details;
   const {data:stored}=await db.from('mail_cfg').select('value').eq('key','tracking_webhook_secret').maybeSingle();
   report.webhookReady=final.status==='enabled'&&EVENTS.every(e=>(final.events||[]).includes(e))&&!!stored?.value;
  }
  report.verified=true;
  report.ready=report.domainVerified&&report.openTracking&&report.clickTracking&&report.webhookReady;
  if(!report.ready)report.message='Tracking is nog niet volledig actief. Controleer open- en kliktracking en de webhook bij de maildienst.';
 }catch(error){report.ready=false;report.message=error.message;}
 const {error}=await db.from('hq_campaign_health').upsert({id:true,report,checked_at:report.checkedAt});if(error)throw new Error('De status van de mailkoppeling kon niet worden opgeslagen.');
 return report;
}
// Only a database administrator can request this fixed one-time configuration. It never sends mail.
export async function runRequestedMaintenance(options){
 const {db}=options;
 const {data,error}=await db.from('mail_cfg').update({value:'running'}).eq('key','tracking_setup_requested').eq('value','pending').select('key');
 if(error||!data?.length)return;
 try{const report=await inspectProvider({...options,configure:true});await db.from('mail_cfg').update({value:report.ready?'complete':'needs_attention'}).eq('key','tracking_setup_requested');}
 catch{await db.from('mail_cfg').update({value:'needs_attention'}).eq('key','tracking_setup_requested');}
}
