import {GROUPS,QUESTIONS,validateAnswers,answeredCount,seoBrief} from '../assets/seo-schema.mjs';
const S={rows:[],row:null,customer:'',dirty:false,busy:false,load:0};
const admin=()=>window.SESSION?.role==='admin';
const ready=()=>admin() && window.sb && window.CLOUD?.uid;
const el=id=>document.getElementById(id);
const h=value=>window.esc(String(value??''));
const fmt=value=>value?new Date(value).toLocaleString('nl-BE'):'—';
const label={draft:'Concept',open:'Klant kan invullen',submitted:'Ingevuld'};
function note(text,error=false){const node=el('seo_notice');if(node){node.textContent=text;node.style.color=error?'#F87171':'var(--muted)';}if(error)toast(text,true);}
function canLeave(){return !S.dirty || confirm('Je hebt nog niet opgeslagen antwoorden. Wil je deze pagina verlaten?');}
function current(){return S.row && ready();}
function formAnswers(){return validateAnswers(Object.fromEntries(QUESTIONS.map(q=>[q.id,el('seo_'+q.id)?.value||''])));}
function count(){const n=el('seo_count');if(n)n.textContent=answeredCount(formAnswers())+' van '+QUESTIONS.length+' vragen ingevuld';}
async function fetchRows(){
  if(!ready())throw new Error('Log in op je HQ om SEO-vragenlijsten te gebruiken.');
  const r=await sb.from('seo_questionnaires').select('id,customer_id,customer_name,title,status,created_at,updated_at,submitted_at,access_token,expires_at').eq('user_id',CLOUD.uid).order('created_at',{ascending:false});
  if(r.error)throw new Error('SEO-vragenlijsten konden niet worden geladen. Probeer opnieuw.');
  S.rows=r.data||[];return S.rows;
}
function header(title,subtitle,buttons=''){
  return '<div class="topbar"><div><h2>'+h(title)+'</h2><div class="sub">'+h(subtitle)+'</div></div><div class="seo_actions">'+buttons+'</div></div><p id="seo_notice" role="status" aria-live="polite"></p>';
}
async function render(){
  if(!admin())return;
  const request=++S.load;S.row=null;S.dirty=false;
  main().innerHTML=header('SEO-vragenlijsten','29 vragen. Eén persoonlijke invullink per klant.','<button class="btn" onclick="SeoHQ.create()">Nieuwe vragenlijst</button>')+'<p class="hint">Laden…</p>';
  try{await fetchRows();if(request!==S.load||VIEW!=='seo')return;list();}catch(e){if(VIEW==='seo')note(e.message,true);}
}
function list(){
  const rows=S.rows.filter(r=>!S.customer||r.customer_id===S.customer);
  main().innerHTML=header('SEO-vragenlijsten','Klanten vullen in zonder account. Antwoorden worden in je CRM bewaard.',
    '<button class="btn subtle" onclick="SeoHQ.refresh()">Verversen</button><button class="btn" onclick="SeoHQ.create()">Nieuwe vragenlijst</button>')+
    '<div class="panelbox"><label for="seo_customer_filter">Filter op klant</label><select id="seo_customer_filter"><option value="">Alle klanten</option>'+DATA.customers.map(c=>'<option value="'+h(c.id)+'" '+(c.id===S.customer?'selected':'')+'>'+h(c.name)+'</option>').join('')+'</select></div>'+
    '<div class="seo_cards">'+(rows.length?rows.map(r=>'<article class="panelbox seo_card"><div><span class="pill '+(r.status==='submitted'?'betaald':'open')+'">'+h(label[r.status])+'</span><h3>'+h(r.customer_name)+'</h3><p>'+h(r.title)+'</p><p class="hint">'+(r.submitted_at?'Verzonden: '+h(fmt(r.submitted_at)):'Bijgewerkt: '+h(fmt(r.updated_at)))+'</p></div><button class="btn" onclick="SeoHQ.open(\''+r.id+'\')">'+(r.status==='submitted'?'Antwoorden bekijken':'Openen en delen')+'</button></article>').join(''):
      '<div class="panelbox"><h3>Nog geen SEO-vragenlijst</h3><p class="hint">Maak een vragenlijst voor een bestaande klant. Daarna kun je de persoonlijke link kopiëren.</p><button class="btn" onclick="SeoHQ.create()">Vragenlijst maken</button></div>')+'</div>';
  el('seo_customer_filter').addEventListener('change',e=>{S.customer=e.target.value;list();});
}
async function create(){
  if(!ready()){toast('Log eerst in op je HQ.',true);return;}
  if(!canLeave())return;
  if(!DATA.customers.length){toast('Voeg eerst een klant toe bij Klanten.',true);return;}
  openM('SEO-vragenlijst maken','<div class="fgroup"><label for="seo_new_customer">Klant</label><select id="seo_new_customer">'+DATA.customers.map(c=>'<option value="'+h(c.id)+'" '+(c.id===S.customer?'selected':'')+'>'+h(c.name)+'</option>').join('')+'</select></div><p class="hint">Er wordt nog niets naar de klant verstuurd. Je maakt straks zelf een deelbare link.</p>','<button class="btn" id="seo_new_confirm">Vragenlijst maken</button>');
  el('seo_new_confirm').addEventListener('click',async e=>{
    e.target.disabled=true;
    try {
    const c=customer(el('seo_new_customer').value);if(!c){e.target.disabled=false;return;}
    const r=await sb.from('seo_questionnaires').insert({user_id:CLOUD.uid,customer_id:c.id,customer_name:c.name,
      title:'SEO — '+c.name,answers:{company:[c.name,c.website||c.info?.domein||''].filter(Boolean).join('\n'),contact:[c.contact,c.email,c.phone].filter(Boolean).join('\n')}}).select('*').single();
    if(r.error){toast('Vragenlijst maken mislukt. Probeer opnieuw.',true);e.target.disabled=false;return;}
    closeM();S.dirty=false;S.customer=c.id;S.row=r.data;showEditor();
    }catch{toast('Vragenlijst maken mislukt. Controleer je verbinding en probeer opnieuw.',true);e.target.disabled=false;}
  });
}
async function open(id){
  if(!ready()||!canLeave())return;
  const request=++S.load;
  const r=await sb.from('seo_questionnaires').select('*').eq('id',id).eq('user_id',CLOUD.uid).single();
  if(request!==S.load||!admin())return;
  if(r.error){toast('Vragenlijst niet gevonden of geen toegang.',true);return;}
  S.row=r.data;S.dirty=false;VIEW='seo';showEditor();
}
function showEditor(){
  if(!current())return;
  VIEW='seo';const row=S.row;
  document.querySelectorAll('#navmenu button').forEach(b=>b.classList.toggle('active',b.dataset.v==='seo'));
  main().innerHTML=header(row.customer_name,'SEO-vragenlijst · '+label[row.status],
    '<button class="btn subtle" onclick="SeoHQ.back()">Overzicht</button><button class="btn subtle" onclick="SeoHQ.export()">SEO-brief downloaden</button><button class="btn" onclick="SeoHQ.share()">Klantlink</button>')+
    '<div class="panelbox"><div class="frow"><div class="fgroup"><label for="seo_title">Titel</label><input id="seo_title" maxlength="300" value="'+h(row.title)+'"></div><div><p id="seo_count" class="hint"></p><p class="hint">'+(row.submitted_at?'Ingestuurd door de klant op '+h(fmt(row.submitted_at))+'.':'Sla je wijzigingen op voordat je de link deelt.')+'</p></div></div></div>'+
    '<form id="seo_editor">'+GROUPS.map((name,index)=>'<details class="panelbox seo_group" '+(index===0?'open':'')+'><summary>'+h(name)+'</summary>'+QUESTIONS.filter(q=>q.group===index).map(q=>'<div class="fgroup"><label for="seo_'+q.id+'">'+q.number+'. '+h(q.label)+'</label><div class="hint" id="seo_hint_'+q.id+'">'+h(q.hint)+'</div><textarea id="seo_'+q.id+'" maxlength="3000" rows="3" aria-describedby="seo_hint_'+q.id+'">'+h(row.answers?.[q.id]||'')+'</textarea></div>').join('')+'</details>').join('')+
    '<section class="panelbox"><h3>Interne SEO-voorbereiding</h3><p class="hint">Alleen zichtbaar in HQ. Deze velden worden niet met de klant gedeeld.</p><div class="fgroup"><label for="seo_priority_keywords">Gekozen prioritaire zoekwoorden</label><textarea id="seo_priority_keywords" maxlength="10000" rows="4">'+h(row.priority_keywords)+'</textarea></div><div class="fgroup"><label for="seo_internal_notes">Analyse, pagina’s en volgende stappen</label><textarea id="seo_internal_notes" maxlength="15000" rows="5">'+h(row.seo_notes)+'</textarea></div></section>'+
    '<div class="seo_savebar"><span class="hint" id="seo_save_status">Opgeslagen '+h(fmt(row.updated_at))+'</span><button class="btn" type="submit">Wijzigingen opslaan</button></div></form>';
  const changed=()=>{S.dirty=true;el('seo_save_status').textContent='Nog niet opgeslagen';count();};
  el('seo_editor').addEventListener('input',changed);el('seo_title').addEventListener('input',changed);
  el('seo_editor').addEventListener('submit',e=>{e.preventDefault();save();});count();
}
async function patch(changes){
  if(!current()||S.busy)return null;S.busy=true;
  try{
    const r=await sb.from('seo_questionnaires').update(changes).eq('id',S.row.id).eq('user_id',CLOUD.uid).eq('updated_at',S.row.updated_at).select('*').maybeSingle();
    if(r.error)throw new Error('Opslaan mislukt. Probeer opnieuw; je tekst blijft op het scherm.');
    if(!r.data)throw new Error('Deze vragenlijst is elders gewijzigd. Kopieer je wijzigingen en open de vragenlijst opnieuw.');
    S.row=r.data;return r.data;
  }catch(e){note(e.message,true);return null;}finally{S.busy=false;}
}
async function save(){
  if(!current())return false;
  let answers;try{answers=formAnswers();}catch(e){note(e.message,true);return false;}
  const title=el('seo_title').value.trim();if(!title){note('Vul een titel in.',true);return false;}
  const row=await patch({answers,title,seo_notes:el('seo_internal_notes').value,priority_keywords:el('seo_priority_keywords').value});
  if(!row)return false;S.dirty=false;el('seo_save_status').textContent='Opgeslagen '+fmt(row.updated_at);note('Wijzigingen opgeslagen.');return true;
}
function link(row){return 'https://marleo.tech/seo-intake/#t='+row.access_token;}
async function share(){
  if(!current()||S.busy)return;if(S.dirty&&!await save())return;
  let row=S.row;
  if(!row.access_token||!row.expires_at||new Date(row.expires_at)<=new Date()){
    if(row.status==='submitted'){toast('Deze vragenlijst is al ingestuurd. Maak een nieuwe vragenlijst als je de klant opnieuw wilt laten invullen.',true);return;}
    const bytes=crypto.getRandomValues(new Uint8Array(32)),token=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
    row=await patch({access_token:token,expires_at:new Date(Date.now()+60*86400000).toISOString(),status:'open'});if(!row)return;
    el('seo_save_status').textContent='Opgeslagen '+fmt(row.updated_at);
  }
  showEditor();
  const url=link(row),c=customer(row.customer_id)||{};
  const message='Dag'+(c.contact?' '+c.contact:'')+',\n\nOm de SEO van je website goed af te stemmen, vragen we je deze vragenlijst in te vullen:\n'+url+'\n\nJe hebt geen account nodig. Bewaar je antwoorden per stap; je kunt later via dezelfde link verdergaan. Onbekende vragen mag je openlaten. Stuur geen wachtwoorden mee.\n\nBedankt!\nGiannis — Marleo Tech';
  openM('SEO-vragenlijst delen','<p class="hint">Persoonlijke link voor '+h(row.customer_name)+'. Iedereen met deze link kan de vragenlijst bekijken. Geldig tot '+h(fmt(row.expires_at))+'.</p><div class="fgroup"><label for="seo_share_link">Klantlink</label><input id="seo_share_link" readonly value="'+h(url)+'"></div><div class="fgroup"><label for="seo_share_message">Bericht om zelf te versturen</label><textarea id="seo_share_message" readonly rows="9">'+h(message)+'</textarea></div><p id="seo_copy_status" role="status"></p>',
    '<button class="btn subtle" id="seo_copy_message">Bericht kopiëren</button><button class="btn" id="seo_copy_link">Link kopiëren</button><button class="btn subtle" id="seo_revoke">Link intrekken</button>',true);
  function copy(id){return async()=>{const input=el(id);try{await navigator.clipboard.writeText(input.value);el('seo_copy_status').textContent='Gekopieerd.';}catch{input.focus();input.select();el('seo_copy_status').textContent='Selectie klaar. Kopieer de tekst handmatig.';}};}
  el('seo_copy_link').onclick=copy('seo_share_link');el('seo_copy_message').onclick=copy('seo_share_message');
  el('seo_revoke').onclick=async()=>{if(!confirm('Deze invullink intrekken? De opgeslagen antwoorden blijven bewaard.'))return;
    if(await patch({access_token:null,expires_at:null})){closeM();showEditor();toast('Link ingetrokken.');}};
}
async function exportBrief(){
  if(!current())return;if(S.dirty&&!await save())return;
  const url=URL.createObjectURL(new Blob([seoBrief(S.row)],{type:'text/markdown;charset=utf-8'})),a=document.createElement('a');
  a.href=url;a.download='seo-brief-'+S.row.customer_name.replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
window.SeoHQ={create,open,share,export:exportBrief,refresh:render,back:()=>{if(canLeave()){S.dirty=false;render();}},
  forCustomer:id=>{if(!canLeave())return;S.customer=id;S.dirty=false;go('seo');}};
window.addEventListener('beforeunload',e=>{if(S.dirty){e.preventDefault();e.returnValue='';}});
const previousGo=window.go;
window.go=function(view){
  if(VIEW==='seo'&&view!=='seo'&&!canLeave())return;
  if(view!=='seo'){++S.load;S.dirty=false;return previousGo.apply(this,arguments);}
  if(!admin())return previousGo('cportal');
  if(!canLeave())return;VIEW='seo';document.querySelectorAll('#navmenu button').forEach(b=>b.classList.toggle('active',b.dataset.v==='seo'));render();window.scrollTo(0,0);
};
const previousCustomer=window.rCustPage;
window.rCustPage=function(){
  previousCustomer.apply(this,arguments);if(!admin()||VIEW!=='custpage')return;
  const id=CUSTVIEW,box=document.createElement('section');box.className='panelbox';
  box.innerHTML='<h3>SEO-vragenlijst</h3><p class="hint">Stuur deze klant een persoonlijke invullink en bekijk de antwoorden hier.</p><button class="btn">SEO-vragenlijsten van deze klant</button>';
  box.querySelector('button').onclick=()=>window.SeoHQ.forCustomer(id);main().append(box);
};
if(!MENU_ADMIN.some(m=>m[0]==='seo')){const i=MENU_ADMIN.findIndex(m=>m[0]==='customers');MENU_ADMIN.splice(i<0?MENU_ADMIN.length:i+1,0,['seo','SEO-vragenlijsten',IC.doc]);}
if(admin()&&el('navmenu')?.children.length)buildMenu();
