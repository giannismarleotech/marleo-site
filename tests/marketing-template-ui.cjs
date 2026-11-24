/* Customer email design checks; no accounts, sends or provider calls. */
const {JSDOM}=require(process.env.HQ_JSDOM_MODULE||'jsdom');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),dom=new JSDOM('<main id="mainArea"></main>',{url:'https://marleo.tech/hq/',runScripts:'outside-only'}),w=dom.window;
w.esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));w.CPT={};w.cpRich=()=>'<p>Legacy prospect template</p>';w.cpFilters=()=>({});w.mCamp=()=>{};w.rEmails=()=>{};w.rCampagnes=()=>{};
vm.runInContext(fs.readFileSync(path.join(root,'hq/campaign-audiences.js'),'utf8').replace(/export /g,''),dom.getInternalVMContext());
const templates=vm.runInContext('customerTemplates',dom.getInternalVMContext());
assert.equal(templates.length,8);
for(const template of templates){
 const html=w.cpRich(template.id,template.body);const doc=new JSDOM(html).window.document;
 assert.equal(doc.querySelector('h1').textContent,template.body.split('\n\n')[0]);
 assert.match(doc.querySelector('img').src,/assets\/marleo-email-wordmark\.png$/);
 assert.ok(!html.includes('marleo-logo-mail-dark.png'));
 assert.ok(!html.includes('radial-gradient'));
 assert.ok(!html.includes('#ffffff;border-radius:18px'));
 assert.ok(doc.querySelectorAll('.mail-row').length>=3);
 assert.ok(doc.body.textContent.includes(template.body.split('\n\n').at(-1)));
 assert.ok(doc.querySelector('a[href="https://marleo.tech/afspraak/?lang=nl"]'));
}
const edited=w.cpRich('klant-ai','Edited title\n\nEdited introduction\n\nA section\n<script>alert(1)</script>\n\nEdited conclusion');
assert.match(edited,/Edited title/);assert.match(edited,/Edited conclusion/);assert.ok(!edited.includes('<script>'));assert.match(edited,/&lt;script&gt;/);
assert.equal(w.cpRich('prospect','text'),'<p>Legacy prospect template</p>');
console.log('Eight marketing templates passed: editable content, escaping, dark email layout, transparent brand asset and unchanged prospect fallback. No mail sent.');
if(process.env.MARLEO_EMAIL_PREVIEW){fs.mkdirSync(process.env.MARLEO_EMAIL_PREVIEW,{recursive:true});fs.writeFileSync(path.join(process.env.MARLEO_EMAIL_PREVIEW,'email-ai.html'),w.cpRich('klant-ai',templates[0].body));}
