const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {JSDOM}=require(process.env.HQ_JSDOM_MODULE||'jsdom');
(async()=>{
 const dom=new JSDOM('<head></head><body><nav class="cc-quick-nav"></nav></body>',{runScripts:'outside-only',url:'https://marleo.tech/hq/'}),w=dom.window;
 w.CLOUD={uid:'77f6201e-8836-46b8-9c7a-0c118c4db61e'};w.SESSION={role:'admin'};w.VIEW='controlcenter';w.setInterval=()=>0;
 let calls=0,opened='',fail=false,report={enabled:true,checked_at:new Date().toISOString(),report:{counts:{sales:1,projects:0,tasks:0},sales:[{id:'d1',title:'<img src=x onerror=alert(1)>',reason:'Opvolgen',action:'Controleer reactie',emailAvailable:false}],projects:[],tasks:[],projectRecords:0}};
 w.DATA={deals:[{id:'d1'}],agentWorkspaces:[]};w.mDeal=id=>opened=id;w.go=()=>{};w.toast=()=>{};
 w.sb={from:()=>({select:()=>({eq:()=>({single:async()=>({data:report,error:fail?new Error('fail'):null})})}),update:patch=>({eq:async()=>{Object.assign(report,patch);return {};}})}),rpc:async()=>{calls++;return {};}};
 vm.runInContext(fs.readFileSync('hq/operations.js','utf8'),dom.getInternalVMContext());w.MarleoOperations.mount();await new Promise(r=>setTimeout(r,10));
 assert.equal(w.document.querySelectorAll('.ops-cards>div').length,3);assert.equal(w.document.querySelectorAll('.ops-item img').length,0);assert.match(w.document.body.textContent,/Geen geldig e-mailadres/);
 w.document.querySelector('[data-ops-id]').click();assert.equal(opened,'d1');w.document.querySelector('#ops-run').click();await new Promise(r=>setTimeout(r,10));assert.equal(calls,1);
 w.document.querySelector('#ops-toggle').click();await new Promise(r=>setTimeout(r,10));assert.equal(report.enabled,false);assert.equal(w.document.querySelector('#ops-run').disabled,true);
 const before=w.document.body.innerHTML;w.SESSION.role='client';w.MarleoOperations.mount();assert.equal(w.document.body.innerHTML,before);
 dom.window.close();console.log('Operations UI: cloud report, escaping, record navigation, refresh, pause and owner guard passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
