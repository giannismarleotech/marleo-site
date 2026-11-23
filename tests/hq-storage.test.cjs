const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const {IDBFactory} = require(process.env.HQ_IDB_MODULE || 'fake-indexeddb');
const source = fs.readFileSync('hq/storage-cache.js','utf8');
function setup({idb = new IDBFactory(), entries = new Map(), full = false} = {}) {
  const localStorage = {getItem:k=>entries.get(k)||null,removeItem:k=>entries.delete(k),setItem(k,v){if(full)throw new Error('QuotaExceededError');entries.set(k,v)}};
  const document = {getElementById:()=>null,createElement:()=>({setAttribute(){},style:{}})};
  const c = {indexedDB:idb,localStorage,document,console,JSON,Promise};c.window=c;
  vm.createContext(c);vm.runInContext(source,c);
  return {c,cache:c.HQCache,entries,idb};
}
test('full localStorage migrates a large legacy snapshot, releases only archived keys and survives reload',async()=>{
  const data={customers:[{id:'c1'}],invoices:[{id:'i1',pdf:'x'.repeat(6*1024*1024)}]};
  const entries=new Map([['marleo_hq_v1',JSON.stringify(data)],['sb-project-auth-token','untouched']]);
  const {cache,idb}=setup({entries,full:true});
  assert.deepEqual(await cache.prepare('owner-a'),data);
  assert.equal(entries.has('marleo_hq_v1'),false);assert.equal(entries.get('sb-project-auth-token'),'untouched');
  data.invoices[0].ref='updated';assert.equal(await cache.save(data),true);
  const reloaded=setup({idb,entries,full:true});assert.deepEqual(await reloaded.cache.prepare('owner-a'),data);
  assert.equal(await reloaded.cache.prepare('other-owner'),null);
});
test('failed IndexedDB migration retains the complete legacy data',async()=>{
  const raw=JSON.stringify({customers:[{id:'c1'}]});const entries=new Map([['marleo_hq_v1',raw]]);
  // Use a factory that fails before a transaction can commit.
  const failed=setup({idb:{open(){throw new Error('blocked')}},entries,full:true});
  assert.equal(await failed.cache.prepare('a'),null);assert.equal(entries.get('marleo_hq_v1'),raw);
  assert.equal(await failed.cache.save({customers:[]}),false);assert.equal(entries.get('marleo_hq_v1'),raw);
});
test('rapid saves preserve captured edits and the latest snapshot on reload',async()=>{
  const {cache,idb}=setup();await cache.prepare('a');
  const data={customers:[{id:'1',name:'first'}]};const one=cache.save(data);
  data.customers[0].name='second';const two=cache.save(data);data.customers[0].name='third';
  await Promise.all([one,two]);const reload=setup({idb});assert.equal((await reload.cache.prepare('a')).customers[0].name,'second');
});
test('cloud write and cross-device pull succeed even when both browser caches are unavailable',async()=>{
  const {c,cache}=setup({idb:{open(){throw new Error('blocked')}},full:true});await cache.prepare('a');
  let remote=[], writes=0,status='';
  Object.assign(c,{DATA:{customers:[{id:'c1',name:'new'}]},CLOUD:{uid:'a',hashes:{}},cloudCollections:()=>['customers'],cloudHash:JSON.stringify,
    cloudSetStatus:t=>{status=t},SESSION:null,VIEW:null,LS_KEY:'marleo_hq_v1',go(){},invSub(){},invStatus(){},invTot(){},
    sb:{from(){let mode='read',row;const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:remote.find(x=>x.collection==='customers')||null}),
      insert(value){mode='insert';row=value;return q},update(value){mode='update';row=value;return q},
      then(resolve){if(mode!=='read'){writes++;remote=[row];resolve({data:[row]})}else resolve({data:remote})}};return q}}
  });
  let sync=fs.readFileSync('hq/sync-dashboard.js','utf8');sync=sync.slice(sync.indexOf('const copy'),sync.indexOf('export function monthlyTotals')).replace('export function mergeRecords','function mergeRecords');
  vm.runInContext(sync,c);await c.cloudPushChanged();assert.equal(writes,1);assert.equal(status,'Opgeslagen in de cloud');
  remote=[{collection:'customers',data:[{id:'c1',name:'other device'}],updated_at:'2026-11-23T22:00:00Z'}];
  await c.cloudPull(false);assert.equal(c.DATA.customers[0].name,'other device');assert.match(status,/Gesynchroniseerd/);
});

test('a fallback written after an older IDB snapshot is restored and then migrated safely',async()=>{
  const entries=new Map();const first=setup({entries});await first.cache.prepare('a');await first.cache.save({customers:[{id:'1',name:'old'}]});
  entries.set('marleo_hq_v1',JSON.stringify({customers:[{id:'1',name:'new fallback'}]}));
  const reload=setup({idb:first.idb,entries});const restored=await reload.cache.prepare('a');assert.equal(restored.customers[0].name,'new fallback');
  const again=setup({idb:first.idb,entries});assert.equal((await again.cache.prepare('a')).customers[0].name,'new fallback');
});
