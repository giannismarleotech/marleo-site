const TYPES=new Set(['email.sent','email.delivered','email.opened','email.clicked','email.bounced','email.complained','email.failed','email.delivery_delayed','email.suppressed']);
export async function verifySignature(raw,headers,secret,now=Date.now()){
 const id=headers.get('svix-id'),timestamp=headers.get('svix-timestamp'),signature=headers.get('svix-signature');
 if(!id||!/^\d+$/.test(timestamp||'')||Math.abs(now/1000-Number(timestamp))>300||!signature||!secret?.startsWith('whsec_'))return false;
 try{const bytes=Uint8Array.from(atob(secret.slice(6)),c=>c.charCodeAt(0));const key=await crypto.subtle.importKey('raw',bytes,{name:'HMAC',hash:'SHA-256'},false,['verify']);
  const payload=new TextEncoder().encode(id+'.'+timestamp+'.'+raw);
  for(const part of signature.split(' ')){if(!part.startsWith('v1,'))continue;const sig=Uint8Array.from(atob(part.slice(3)),c=>c.charCodeAt(0));if(await crypto.subtle.verify('HMAC',key,sig,payload))return true;}
 }catch{}return false;
}
export function makeHandler({db,now=()=>Date.now()}){return async req=>{
 if(req.method!=='POST')return new Response('POST required',{status:405});
 try{
  if(Number(req.headers.get('content-length'))>65536)return new Response('Too large',{status:413});
  const raw=await req.text();if(raw.length>65536)return new Response('Too large',{status:413});
  const {data:cfg,error:cfgError}=await db.from('mail_cfg').select('value').eq('key','tracking_webhook_secret').maybeSingle();
  if(cfgError)return new Response('Webhook verification unavailable',{status:503});
  if(cfg?.value){if(!await verifySignature(raw,req.headers,cfg.value,now()))return new Response('Invalid signature',{status:401});}
  else{
   // Preserve the existing authenticated Resend endpoint while management permissions are unavailable.
   // Once a signing secret is installed, this legacy bearer path is permanently bypassed.
   const {data:legacy,error}=await db.from('mail_cfg').select('value').eq('key','hook_key').maybeSingle();
   const token=new URL(req.url).searchParams.get('k');
   if(error)return new Response('Webhook verification unavailable',{status:503});
   if(!legacy?.value||!token||token!==legacy.value||!req.headers.get('svix-id'))return new Response('Invalid webhook token',{status:401});
  }
  let event;try{event=JSON.parse(raw);}catch{return new Response('Invalid JSON',{status:400});}
  if(!TYPES.has(event.type))return new Response('ok');
  const id=String(event.data?.email_id||''),at=event.created_at;
  if(!id||id.length>120||!at||!Number.isFinite(Date.parse(at)))return new Response('Invalid event',{status:400});
  let link=null;try{const u=new URL(event.data?.click?.link);if(['https:','http:'].includes(u.protocol))link=u.href;}catch{}
  const {error}=await db.rpc('hq_mail_event',{p_id:req.headers.get('svix-id'),p_provider:id,p_type:event.type,p_at:new Date(at).toISOString(),p_link:link});
  if(error)return new Response('Storage unavailable',{status:503});
  return new Response('ok');
 }catch{return new Response('Temporarily unavailable',{status:503});}
};}
