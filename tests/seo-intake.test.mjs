import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {QUESTIONS,GROUPS,validateAnswers,answeredCount,seoBrief} from '../assets/seo-schema.mjs';
import {makeHandler} from '../supabase/functions/seo-intake/handler.mjs';
const token='a'.repeat(64), version='2026-11-02T10:00:00.000000+00:00';
const base=()=>({id:'test-id',customer_name:'QA bedrijf',title:'SEO',status:'open',answers:{company:'QA'},updated_at:version,expires_at:'2099-01-01T00:00:00Z',seo_notes:'NEVER PUBLIC',priority_keywords:'PRIVATE',access_token:token,user_id:'owner',customer_id:'customer'});
function setup(row=base()){
  const writes=[];
  const handle=makeHandler({url:'https://example.supabase.co',key:'server-only',fetcher:async(url,opts)=>{
    if(opts.method==='PATCH'){
      writes.push({url,patch:JSON.parse(opts.body)});
      if(!row)return Response.json([]);
      Object.assign(row,writes.at(-1).patch);row.updated_at='2026-11-02T10:01:00.000000+00:00';
    }
    return Response.json(row?[row]:[]);
  }});
  const request=(action,extra={})=>handle(new Request('https://edge.test',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://marleo.tech'},body:JSON.stringify({token,action,...extra})}));
  return {request,handle,writes,row};
}
test('All 29 stable fields exist across seven sections and backend schema matches frontend',()=>{
  assert.equal(QUESTIONS.length,29);assert.equal(GROUPS.length,7);assert.equal(new Set(QUESTIONS.map(q=>q.id)).size,29);
  assert.equal(readFileSync(new URL('../assets/seo-schema.mjs',import.meta.url),'utf8'),readFileSync(new URL('../supabase/functions/seo-intake/schema.mjs',import.meta.url),'utf8'));
});
test('Customer keyword field and internal priority keywords have distinct identifiers',()=>{
  const source=readFileSync(new URL('../hq/seo.mjs',import.meta.url),'utf8');
  const fixedIds=[...source.matchAll(/id="(seo_[a-z_]+)"/g)].map(m=>m[1]);
  const dynamicIds=QUESTIONS.map(q=>'seo_'+q.id);
  assert.equal(fixedIds.includes('seo_priority_keywords'),true);
  for(const id of dynamicIds)assert.equal(fixedIds.includes(id),false,'Duplicate input id '+id);
});
test('Validation allows optional unknowns, rejects malformed/oversized values and strips privileged fields',()=>{
  const result=validateAnswers({company:' QA ',seo_notes:'injected',status:'submitted'});assert.equal(result.company,'QA');assert.equal(result.seo_notes,undefined);assert.equal(result.status,undefined);
  assert.equal(answeredCount(result),1);assert.throws(()=>validateAnswers({},true));
  assert.throws(()=>validateAnswers({company:['a']}));assert.throws(()=>validateAnswers({company:'x'.repeat(3001)}));
  assert.equal(validateAnswers({company:'QA',contact:'Jane',goals:'Meer aanvragen'},true).goals,'Meer aanvragen');
});
test('Read returns only customer-visible data; private CRM fields and tokens never leave server',async()=>{
  const {request}=setup();const response=await request('read');assert.equal(response.status,200);const payload=await response.json();
  assert.deepEqual(Object.keys(payload.questionnaire).sort(),['customer_name','title','status','answers','submitted_at','updated_at'].filter(k=>k!=='submitted_at').sort());
  assert.doesNotMatch(JSON.stringify(payload),/NEVER PUBLIC|PRIVATE|server-only|access_token|customer_id|user_id/);
});
test('Draft saves safely and submit locks the questionnaire; replay cannot overwrite answers',async()=>{
  const {request,writes,row}=setup();const draft=await request('save',{version,answers:{company:'QA',keywords:'kunststofprofielen'}});assert.equal(draft.status,200);assert.equal(writes[0].patch.status,undefined);
  const submit=await request('submit',{version:row.updated_at,answers:{company:'QA',contact:'Contactpersoon',goals:'Meer aanvragen'}});assert.equal(submit.status,200);assert.equal(row.status,'submitted');
  const replay=await request('save',{version:row.updated_at,answers:{company:'Changed'}});assert.equal(replay.status,409);assert.equal(row.answers.company,'QA');assert.equal(writes.length,2);
});
test('Missing, expired, revoked, malformed and draft links cannot read or write',async()=>{
  for(const row of [null,{...base(),status:'draft'},{...base(),expires_at:'2000-01-01'},{...base(),expires_at:null}]){
    const {request,writes}=setup(row);assert.equal((await request('read')).status,404);assert.equal((await request('save',{answers:{}})).status,404);assert.equal(writes.length,0);
  }
  const {request}=setup();assert.equal((await request('read',{token:'bad'})).status,404);
});
test('Optimistic concurrency and final required fields are enforced before writes',async()=>{
  const {request,writes}=setup();assert.equal((await request('save',{version:'stale',answers:{company:'x'}})).status,409);
  assert.equal((await request('submit',{version,answers:{company:'x'}})).status,400);assert.equal(writes.length,0);
});
test('CORS, methods and body size are constrained',async()=>{
  const {handle}=setup();assert.equal((await handle(new Request('https://edge.test',{method:'GET'}))).status,405);
  assert.equal((await handle(new Request('https://edge.test',{method:'POST',headers:{Origin:'https://untrusted.example'},body:'{}'}))).status,403);
  assert.equal((await handle(new Request('https://edge.test',{method:'POST',body:'x'.repeat(160001)}))).status,413);
});
test('Export includes all answers and internal SEO preparation in a readable briefing',()=>{
  const result=seoBrief({...base(),seo_notes:'Analyse',priority_keywords:'SEO Gent'});assert.match(result,/SEO-briefing/);assert.match(result,/29\./);assert.match(result,/SEO Gent/);assert.match(result,/Analyse/);
});
