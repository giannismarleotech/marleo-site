import test from 'node:test';
import assert from 'node:assert/strict';
import {makeHandler,OWNER,HOST,parseMailboxes,validateDomains,validatePassword} from '../supabase/functions/hq-hosting/handler.mjs';
const SESSION='11111111-1111-4111-8111-111111111111';
const token='x.'+btoa(JSON.stringify({session_id:SESSION}))+'.x';
const domain='ferconstruction.be';
const encoded=new URLSearchParams({info:new URLSearchParams({quota:'1024',usage:'4.5',limit:'200'}).toString()}).toString();
function setup(options={}){
 const calls=[];const state={config:options.disconnected?{}:{username:'u123',key:'not-a-real-login-key-for-test',domains:[{domain}]},saved:[],audits:[]};
 const fetcher=async(input,init={})=>{
  const url=String(input);calls.push({url,init});
  if(url.endsWith('/auth/v1/user'))return Response.json({id:options.otherUser?'other':OWNER});
  if(url.endsWith('/rpc/hq_hosting_gate')){
   const b=JSON.parse(init.body);assert.equal(b.p_actor,OWNER);assert.equal(b.p_session,SESSION);
   if(options.revoked)return Response.json({code:'42501'},{status:403});
   if(b.p_action==='config_get')return Response.json(state.config);
   if(b.p_action==='config_save'){state.config=b.p_payload;return Response.json({});}
   if(b.p_action==='password_index')return Response.json([]);
   if(b.p_action==='password_save'){if(options.vaultFailure)return Response.json({code:'XX000'},{status:500});state.saved.push(b.p_payload);}
   if(b.p_action==='password_get')return Response.json({password:'stored-password-test',updated_at:'2026-11-23'});
   if(b.p_action==='audit')state.audits.push(b.p_payload.action);
   return Response.json({});
  }
  assert.ok(url.startsWith(HOST+'/CMD_API_POP'));assert.equal(init.redirect,'error');
  if(init.method==='POST'){
   if(options.timeout)throw Error('network');
   return new Response(options.reject?'error=1&text=secret-value-must-not-leak':'error=0&text=OK');
  }
  return new Response(options.html?'<html>login</html>':encoded);
 };
 const handler=makeHandler({url:'https://test.supabase.co',key:'server-only-test',fetcher});
 const request=async(body,extra={})=>{const r=await handler(new Request('https://api.test',{method:'POST',headers:{Authorization:'Bearer '+token,Origin:'https://marleo.tech','Content-Type':'application/json',...extra},body:JSON.stringify(body)}));return {status:r.status,body:await r.json(),headers:r.headers};};
 return {request,calls,state};
}
test('parse mailbox quotas and reject login HTML and unrecognised response',()=>{assert.equal(parseMailboxes(encoded,domain)[0].quotaMB,1024);assert.throws(()=>parseMailboxes('<html>login</html>',domain));assert.throws(()=>parseMailboxes({unexpected:'data'},domain));assert.deepEqual(parseMailboxes('',domain),[]);});
test('input validation rejects URL injection, duplicate domains and weak passwords',()=>{assert.throws(()=>validateDomains([{domain:'127.0.0.1:2222'}]));assert.throws(()=>validateDomains([{domain},{domain}]));assert.throws(()=>validatePassword('short'));assert.throws(()=>validatePassword('a'.repeat(15)+'\n'));});
test('status never exposes provider key',async()=>{const {request}=setup();const r=await request({action:'status'});assert.equal(r.status,200);assert.equal(r.body.connected,true);assert.ok(!JSON.stringify(r.body).includes('not-a-real'));assert.equal(r.headers.get('cache-control'),'no-store');});
test('reject other users, revoked sessions and cross-origin calls before provider access',async()=>{for(const o of [{otherUser:true},{revoked:true},{}]){const {request,calls}=setup(o);const r=await request({action:'list',domain},Object.keys(o).length?{}:{Origin:'https://evil.test'});assert.ok([401,403].includes(r.status));assert.ok(!calls.some(c=>c.url.startsWith(HOST)));}});
test('deny unconfigured domain and unknown action without provider requests',async()=>{const {request,calls}=setup();assert.equal((await request({action:'list',domain:'other.be'})).status,403);assert.equal((await request({action:'delete',domain})).status,400);assert.ok(!calls.some(c=>c.url.startsWith(HOST)));});
test('connect is read-only, stores key server-side only after successful provider test',async()=>{const {request,calls,state}=setup({disconnected:true});const r=await request({action:'connect',username:'u123',key:'test-only-key-1234567890123',domains:[{domain}]});assert.equal(r.status,200);assert.ok(state.config.key);assert.ok(calls.filter(c=>c.url.startsWith(HOST)).every(c=>c.init.method==='GET'));assert.ok(!JSON.stringify(r.body).includes(state.config.key));});
test('failed connection does not save credentials',async()=>{const {request,state}=setup({disconnected:true,html:true});assert.equal((await request({action:'connect',username:'u123',key:'test-only-key-1234567890123',domains:[{domain}]})).status,400);assert.deepEqual(state.config,{});});
test('password change preserves quota, requires confirmation and stores after provider success',async()=>{const {request,calls,state}=setup();const b={action:'change_password',domain,mailbox:'info',password:'A-test-password-123!',confirm:true};assert.equal((await request({...b,confirm:false})).status,400);const r=await request(b);assert.equal(r.body.changed,true);assert.equal(state.saved.length,1);const change=calls.find(c=>c.url.startsWith(HOST)&&c.init.method==='POST');const p=new URLSearchParams(change.init.body);assert.equal(p.get('quota'),'1024MB');assert.equal(p.get('limit'),'200');assert.ok(state.audits.includes('password_changed'));assert.ok(!JSON.stringify(r.body).includes(b.password));const actions=calls.filter(c=>c.url.endsWith('hq_hosting_gate')).map(c=>JSON.parse(c.init.body).p_action);assert.ok(actions.indexOf('lock')<actions.indexOf('password_save'));assert.equal(actions.at(-1),'unlock');});
test('provider rejection never stores new password or leaks provider response',async()=>{const {request,state}=setup({reject:true});const r=await request({action:'change_password',domain,mailbox:'info',password:'A-test-password-123!',confirm:true});assert.equal(r.status,400);assert.equal(state.saved.length,0);assert.ok(!JSON.stringify(r.body).includes('secret-value'));});
test('provider success with vault failure is accurately reported as changed, not retryable failure',async()=>{const {request}=setup({vaultFailure:true});const r=await request({action:'change_password',domain,mailbox:'info',password:'A-test-password-123!',confirm:true});assert.equal(r.status,200);assert.equal(r.body.changed,true);assert.equal(r.body.stored,false);assert.ok(r.body.warning);});
test('ambiguous network error retains the lock and reports uncertain result',async()=>{const {request,calls,state}=setup({timeout:true});const r=await request({action:'change_password',domain,mailbox:'info',password:'A-test-password-123!',confirm:true});assert.equal(r.body.uncertain,true);assert.equal(state.saved.length,0);assert.ok(!calls.some(c=>c.url.endsWith('hq_hosting_gate')&&JSON.parse(c.init.body).p_action==='unlock'));});
test('create cannot overwrite existing mailbox and no password revealed for deleted mailbox',async()=>{const {request,calls}=setup();assert.equal((await request({action:'create_mailbox',domain,mailbox:'info',password:'A-test-password-123!',confirm:true,quotaMB:1024})).status,409);assert.equal((await request({action:'reveal',domain,mailbox:'deleted'})).status,404);assert.ok(!calls.some(c=>c.url.startsWith(HOST)&&c.init.method==='POST'));});
test('create validates quota and invokes only the allowed create operation',async()=>{const {request,calls,state}=setup();const b={action:'create_mailbox',domain,mailbox:'new',password:'A-test-password-123!',confirm:true,quotaMB:500};assert.equal((await request({...b,quotaMB:0})).status,400);const r=await request(b);assert.equal(r.body.changed,true);const p=new URLSearchParams(calls.find(c=>c.url.startsWith(HOST)&&c.init.method==='POST').init.body);assert.equal(p.get('action'),'create');assert.equal(p.get('quota'),'500');assert.equal(state.saved[0].mailbox,'new');});
