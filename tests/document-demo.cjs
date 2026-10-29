const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/project-tools.js'),'utf8'),{window,document:{querySelectorAll:()=>[]}});const extract=window.MarleoDocumentDemo.extract;
test('Extracts supported order fields and totals',()=>{const r=extract('Order: PO-1\nCustomer: C-2\nDelivery: 2026-11-12\n2 x Support @ 85.00\n1 x Setup @ 240.00');assert.equal(r.order,'PO-1');assert.equal(r.total,410);assert.equal(r.lines.length,2);assert.equal(r.date,'2026-11-12')});
test('Accepts decimal comma and rejects invalid dates',()=>{const r=extract('Livraison: 2026-02-30\n1,5 x Service @ 10,50');assert.equal(r.date,null);assert.equal(r.total,15.75)});
test('Missing fields are not invented',()=>{const r=extract('unstructured text');assert.equal(r.order,null);assert.equal(r.lines.length,0);assert.equal(r.date,null)});
test('Ignores negative or unbounded line values',()=>{assert.equal(extract('-2 x Service @ 5.00\n100001 x Item @ 10').lines.length,0)});
