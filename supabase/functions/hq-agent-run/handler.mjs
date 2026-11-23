import {OWNER,ROLES,buildMessages,normalizeSources} from './agents-core.mjs';
import {AgentError} from './provider.mjs';
import {cleanRecord} from './record.mjs';
export {cleanRecord} from './record.mjs';
export function makeHandler({db,provider,clock=()=>Date.now()}){
 const hits=new Map();let busy=false;
 return async req=>{
 const origin=req.headers.get('origin'),allowed=['https://marleo.tech','https://www.marleo.tech'];const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':allowed.includes(origin)?origin:allowed[0],'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};const reply=(body,status=200)=>Response.json(body,{status,headers});
 if(origin&&!allowed.includes(origin))return reply({error:'Niet toegestaan.'},403);if(req.method==='OPTIONS')return new Response(null,{status:204,headers});if(req.method!=='POST')return reply({error:'Gebruik POST.'},405);
 try{const {data,error}=await db.auth.getUser((req.headers.get('authorization')||'').replace(/^Bearer /i,''));if(error||data?.user?.id!==OWNER)return reply({error:'Alleen de Marleo-beheerder kan de cloudagents gebruiken.'},401);
 const raw=await req.text();if(raw.length>80000)return reply({error:'Het dossier is te groot.'},413);let body;try{body=JSON.parse(raw);}catch{throw new AgentError('Ongeldige aanvraag.');}
 if(body.action==='status'){const status=await provider.inspect();return reply({ok:true,...status});}
 if(body.action!=='run'||!ROLES.some(r=>r.id===body.role))throw new AgentError('Kies een geldige assistent.');
 const record=cleanRecord(body.record),messages=buildMessages(body.role,record,record.language);if(busy)throw new AgentError('Er loopt al een cloudverzoek. Wacht even voor je opnieuw start.',429,'BUSY');
 const minute=Math.floor(clock()/60000),count=hits.get(minute)||0;if(count>=8)throw new AgentError('Maximaal acht assistentuitvoeringen per minuut. Probeer straks opnieuw.',429,'RATE_LIMIT');hits.clear();hits.set(minute,count+1);busy=true;
 try{const result=await provider.generate(messages);return reply({ok:true,...result});}finally{busy=false;}
 }catch(error){if(error instanceof AgentError)console.warn(JSON.stringify({event:'hq-agent-request-error',code:error.code,status:error.status}));return reply({ok:false,error:error instanceof AgentError?error.message:error instanceof SyntaxError?'Ongeldige aanvraag.':'De agent kon niet starten. Controleer de dossierinformatie en bron-URL’s.',code:error.code||'AGENT_ERROR'},error.status||400);}
 };
}
