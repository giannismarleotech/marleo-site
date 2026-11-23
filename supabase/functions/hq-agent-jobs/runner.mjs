import {ROLES,buildMessages,recordFingerprint} from '../hq-agent-run/agents-core.mjs';
export async function executeJob({job,store,provider,search,clock=()=>Date.now()}){
 const events=[],output={};let stage='Voorbereiden';const started=clock();
 async function update(status,extra={}){return store.update(job.id,{status,step:stage,events:[...events],output:{...output},updated_at:new Date(clock()).toISOString(),...extra});}
 async function step(name,status,message=''){if(await store.stopped(job.id)){const e=Error('Gestopt door jou.');e.code='JOB_STOPPED';throw e;}events.push({at:new Date(clock()).toISOString(),step:name,status,message});stage=name;await update('running');}
 try{await update('running',{started_at:new Date(clock()).toISOString()});
 if(job.kind==='search'){
  await step('Bedrijfswebsites zoeken','running');const found=await search.find(job.input.criteria);Object.assign(output,found);events.push({at:new Date(clock()).toISOString(),step:'Bedrijfswebsites zoeken',status:'completed',message:found.results.length+' bronnen gevonden.'});await step('Bronnen controleren','running');events.push({at:new Date(clock()).toISOString(),step:'Bronnen controleren',status:'completed',message:found.results.length+' unieke domeinen; bedrijfsidentiteit en geschiktheid nog nakijken.'});
 }else{
  const r=job.input.record,roles=job.kind==='workflow'?ROLES.map(x=>x.id):[job.kind];output.recordId=job.input.recordId||'';output.fingerprint=recordFingerprint(r);output.outputs={};
  for(const role of roles){if(clock()-started>100000)throw Error('De maximale uitvoertijd is bereikt. Eerder afgeronde concepten zijn bewaard; start ontbrekende stappen apart.');const name=ROLES.find(x=>x.id===role).title;await step(name,'running');const result=await provider.generate(buildMessages(role,r,r.language));if(await store.stopped(job.id))return;output.outputs[role]={text:result.text,model:result.model,usage:result.usage,created:clock(),origin:'cloud-ai',fingerprint:output.fingerprint,reviewedAt:null};if(role==='research'){r.outputs=r.outputs||{};r.outputs.research={text:result.text};}events.push({at:new Date(clock()).toISOString(),step:name,status:'completed',message:'Concept klaar om na te kijken.'});await update('running');}
 }
 stage='Afgerond';await update('completed',{finished_at:new Date(clock()).toISOString()});
 }catch(error){if(error.code==='JOB_STOPPED')return;const message=String(error.message||'De opdracht is gestopt. Probeer de ontbrekende stap apart.').slice(0,650);events.push({at:new Date(clock()).toISOString(),step:stage,status:'failed',message});await update('failed',{error:message,error_code:String(error.code||'JOB_FAILED').slice(0,100),finished_at:new Date(clock()).toISOString()});}
}
