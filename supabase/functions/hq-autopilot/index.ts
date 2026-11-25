import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from 'npm:@supabase/supabase-js@2.108.2';
import {createSearch} from '../hq-agent-jobs/search.mjs';
import {readCompanyPage} from '../hq-agent-jobs/qualification.mjs';
import {executeJob} from '../hq-agent-jobs/runner.mjs';
import {criteriaFor,deduplicate} from './rotation.mjs';
const OWNER='77f6201e-8836-46b8-9c7a-0c118c4db61e';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const search=createSearch({key:Deno.env.get('TAVILY_API_KEY')});
const resolve=async(host:string)=>{const r=await Promise.allSettled([Deno.resolveDns(host,'A'),Deno.resolveDns(host,'AAAA')]);return r.flatMap(v=>v.status==='fulfilled'?v.value:[]);};
const reader=(url:string)=>readCompanyPage(url,{resolve});
function checked(r:any){if(r.error)throw Error('Cloudopslag niet beschikbaar.');return r.data;}
const safe=(c:any)=>({enabled:c.enabled,nextRun:c.next_run,lastTick:c.last_tick,lastRun:c.last_run,attempts:c.month_key===new Date().toISOString().slice(0,7)?c.attempts:0,monthlyLimit:c.monthly_limit,note:c.note,nextCriteria:criteriaFor(c.rotation),searchConfigured:search.configured});
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin');const headers={'Access-Control-Allow-Origin':origin==='https://www.marleo.tech'?origin:'https://marleo.tech','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Cache-Control':'no-store'};
 const reply=(data:any,status=200)=>Response.json(data,{status,headers});
 if(origin&&!['https://marleo.tech','https://www.marleo.tech'].includes(origin))return reply({error:'Niet toegestaan'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});if(req.method!=='POST')return reply({error:'Gebruik POST'},405);
 try{
  const scheduler=req.headers.get('x-hq-schedule-token');
  let isTick=false;
  if(scheduler){if(scheduler.length!==64)return reply({error:'Niet toegestaan'},401);const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(scheduler)))).map(b=>b.toString(16).padStart(2,'0')).join('');const cfg=checked(await db.from('hq_autopilot').select('token_hash').eq('user_id',OWNER).single());if(hash!==cfg.token_hash)return reply({error:'Niet toegestaan'},401);isTick=true;}
  else{const {data,error}=await db.auth.getUser((req.headers.get('authorization')||'').replace(/^Bearer /i,''));if(error||data?.user?.id!==OWNER)return reply({error:'Log in als Marleo-beheerder'},401);}
  const raw=await req.text();if(raw.length>2000)return reply({error:'Te groot'},413);const body=JSON.parse(raw||'{}');
  if(!isTick){if(body.action==='configure'){if(typeof body.enabled!=='boolean')return reply({error:'Ongeldige instelling'},400);checked(await db.from('hq_autopilot').update({enabled:body.enabled,note:body.enabled?'Planning actief':'Gepauzeerd door jou'}).eq('user_id',OWNER));}else if(body.action!=='status')return reply({error:'Onbekende actie'},400);return reply({ok:true,...safe(checked(await db.from('hq_autopilot').select('*').eq('user_id',OWNER).single()))});}
  // Maintenance is independent of opening HQ. Never leave abandoned workers marked active.
  checked(await db.from('hq_agent_jobs').update({status:'failed',error:'Cloudwerker onderbroken. Afgeronde resultaten zijn bewaard.',error_code:'STALE_JOB',step:'Onderbroken',updated_at:new Date().toISOString(),finished_at:new Date().toISOString()}).eq('user_id',OWNER).in('status',['queued','running']).lt('updated_at',new Date(Date.now()-180000).toISOString()));
  if(!search.configured){checked(await db.from('hq_autopilot').update({last_tick:new Date().toISOString(),note:'TAVILY_API_KEY ontbreekt'}).eq('user_id',OWNER));return reply({ok:true,skipped:'missing_key'});}
  const claim=checked(await db.rpc('hq_autopilot_claim'))?.[0];if(!claim)return reply({ok:true,skipped:true});
  const criteria=criteriaFor(claim.rotation-1);
  const inserted=await db.from('hq_agent_jobs').insert({user_id:OWNER,client_request_id:crypto.randomUUID(),kind:'search',title:('Automatische zoekronde · '+criteria.sector+' · '+criteria.region).slice(0,250),input:{criteria,automatic:true},status:'queued'}).select().single();
  if(inserted.error?.code==='23505')return reply({ok:true,skipped:'active_job'});const job=checked(inserted);
  const task=async()=>{
   const history=checked(await db.from('hq_agent_jobs').select('output').eq('user_id',OWNER).eq('kind','search').eq('status','completed').order('created_at',{ascending:false}).limit(600));
   const seen=history.flatMap((j:any)=>(j.output?.results||[]).map((r:any)=>r.domain));
   const store={stopped:async(id:string)=>{const [j,c]=await Promise.all([db.from('hq_agent_jobs').select('status').eq('id',id).eq('user_id',OWNER).single(),db.from('hq_autopilot').select('enabled').eq('user_id',OWNER).single()]);return checked(j).status==='stopped'||!checked(c).enabled;},update:async(id:string,v:any)=>{if(v.status==='completed'){Object.assign(v.output,deduplicate(v.output.results,seen));v.output.automatic=true;}checked(await db.from('hq_agent_jobs').update(v).eq('id',id).eq('user_id',OWNER).neq('status','stopped'));}};
   await executeJob({job,store,provider:null,search,reader});
   const done=checked(await db.from('hq_agent_jobs').select('status,output,error_code').eq('id',job.id).single());
   if(done.status==='running'){checked(await db.from('hq_agent_jobs').update({status:'stopped',step:'Automatisering gepauzeerd',finished_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',job.id).eq('user_id',OWNER));}
   const quota=['SEARCH_QUOTA','SEARCH_KEY','SEARCH_KEY_MISSING'].includes(done.error_code);
   checked(await db.from('hq_autopilot').update({note:done.status==='completed'?(done.output.results?.length||0)+' nieuwe bedrijfskandidaten; '+(done.output.duplicateDomains?.length||0)+' dubbele websites overgeslagen':done.status==='failed'?'Zoekronde mislukt — bekijk de opdracht':'Zoekronde gestopt',...(quota?{enabled:false}: {})}).eq('user_id',OWNER));
  };
  EdgeRuntime.waitUntil(task().catch(async()=>{await db.from('hq_agent_jobs').update({status:'failed',error:'De automatische zoekronde is onderbroken.',error_code:'AUTOPILOT_ERROR',finished_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',job.id).eq('user_id',OWNER);}));return reply({ok:true,jobId:job.id},202);
 }catch{return reply({error:'Automatisering niet beschikbaar. Controleer de cloudkoppeling.'},500);}
});
