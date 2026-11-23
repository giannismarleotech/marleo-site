const {JSDOM}=require(process.env.HQ_JSDOM_MODULE||'jsdom');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const dom=new JSDOM('<div id="navmenu"></div><div id="mainArea"></div><div id="mBackdrop"><h2 id="mTitle"></h2><div id="mBody"></div><div id="mFoot"></div></div>',{url:'https://marleo.tech/hq/',runScripts:'outside-only'});
const w=dom.window,calls=[],timeouts=[];let connected=false,config={username:'',domains:[]},saved=false;
w.scrollTo=()=>{};w.setTimeout=(fn,ms)=>{if(ms===30000)timeouts.push(fn);return 1;};
w.SESSION={role:'admin'};w.VIEW='dashboard';w.DATA={customers:[{id:'c1',name:'Test customer'}]};w.IC={set:'<path/>'};w.MENU_ADMIN=[['settings','Instellingen','']];
w.esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
w.main=()=>w.document.getElementById('mainArea');w.go=view=>{w.VIEW=view;};w.buildMenu=()=>{};w.toast=()=>{};w.rCustPage=()=>{};
w.openM=(title,body,foot)=>{w.document.getElementById('mTitle').textContent=title;w.document.getElementById('mBody').innerHTML=body;w.document.getElementById('mFoot').innerHTML=foot;w.document.getElementById('mBackdrop').classList.add('open');};
w.closeM=()=>w.document.getElementById('mBackdrop').classList.remove('open');
w.sb={auth:{getSession:async()=>({data:{session:{access_token:'fixture'}}})},functions:{invoke:async(name,{body})=>{
 assert.equal(name,'hq-hosting');calls.push(body);
 let data={ok:true};if(body.action==='status')data={...data,connected,...config};
 if(body.action==='connect'){connected=true;config={username:body.username,domains:body.domains};}
 if(body.action==='list')data.rows=[{name:'info',email:'info@test.be',usageMB:1.2,quotaMB:1024,savedAt:saved?'2026-11-23':null}];
 if(body.action==='change_password'){saved=true;data={ok:true,stored:true,message:'Changed'};}
 if(body.action==='reveal')data={ok:true,password:'fixture-secret-123',updated_at:'2026-11-23'};
 return {data,error:null};
}}};
const settle=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
const click=selector=>{const el=w.document.querySelector(selector);assert.ok(el,selector);el.click();};
const fill=(id,value)=>{w.document.getElementById(id).value=value;};
const submit=id=>w.document.getElementById(id).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
(async()=>{
 vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../hq/hosting.js'),'utf8'),dom.getInternalVMContext());
 w.go('hosting');await settle();assert.ok(w.main().textContent.includes('Verbind jouw hosting'));
 click('#host-connection');assert.equal(w.document.querySelectorAll('[data-host-domain]').length,5);
 fill('host-user','demo');fill('host-key','fixture-login-key-not-real');
 submit('host-connect');await settle();assert.equal(calls.filter(c=>c.action==='connect').length,1);assert.equal(w.document.querySelector('#host-key').value,'');
 assert.ok(w.document.querySelector('[data-host-password]'));assert.equal(JSON.stringify(w.DATA),''+JSON.stringify({customers:[{id:'c1',name:'Test customer'}]}));assert.equal(w.localStorage.length,0);
 click('[data-host-password]');fill('host-pass','A-test-password-123!');fill('host-pass-repeat','wrong');submit('host-mailbox');await settle();assert.equal(calls.filter(c=>c.action==='change_password').length,0);
 fill('host-pass-repeat','A-test-password-123!');w.document.getElementById('host-confirm').checked=true;submit('host-mailbox');await settle();assert.equal(calls.filter(c=>c.action==='change_password').length,1);assert.equal(w.document.querySelector('#host-pass').value,'');
 click('[data-host-reveal]');await settle();assert.equal(w.document.getElementById('host-secret').textContent,'fixture-secret-123');timeouts.forEach(fn=>fn());assert.ok(!w.document.getElementById('host-secret').textContent.includes('fixture-secret'));assert.ok(w.document.getElementById('host-copy').disabled);
 assert.equal(w.localStorage.length,0);assert.ok(!JSON.stringify(w.DATA).includes('password'));
 w.SESSION={role:'client'};w.go('hosting');assert.equal(w.VIEW,'cportal');
 console.log('UI passed: setup, domain mapping, provider mutation confirmation, mismatch rejection, password clearing, timed hiding, no local credential storage and client rejection.');
})().catch(e=>{console.error(e);process.exitCode=1;});
