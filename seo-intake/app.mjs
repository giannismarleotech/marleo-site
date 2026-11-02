import {GROUPS,QUESTIONS,validateAnswers,answeredCount} from '../assets/seo-schema.mjs';
const endpoint='https://ufzwdhbrmycjtlewstaw.supabase.co/functions/v1/seo-intake';
const app=document.getElementById('app');
const token=new URLSearchParams(location.hash.slice(1)).get('t')||'';
let row=null,step=0,dirty=false,busy=false;
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(action,extra={}){
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,token,...extra})});
  let result;try{result=await response.json();}catch{throw new Error('Geen geldig antwoord ontvangen. Probeer het opnieuw.');}
  if(!response.ok||!result.ok)throw new Error(result.error||'Opslaan mislukt. Probeer opnieuw.');return result.questionnaire;
}
function status(text,error=false){const node=document.getElementById('status');if(node){node.textContent=text;node.className='status'+(error?' error':'');}}
function showStep(){
  document.querySelectorAll('[data-step]').forEach(node=>{node.hidden=Number(node.dataset.step)!==step;});
  document.getElementById('step_name').textContent='Stap '+(step+1)+' van '+GROUPS.length+' · '+GROUPS[step];
  document.getElementById('progress').value=step+1;
  document.getElementById('previous').hidden=step===0;
  document.getElementById('next').hidden=step===GROUPS.length-1;
  document.getElementById('submit').hidden=step!==GROUPS.length-1;
  status('');
}
function answers(){return Object.fromEntries(QUESTIONS.map(q=>[q.id,document.getElementById('answer_'+q.id).value]));}
function render(){
  if(row.status==='submitted'){
    dirty=false;app.innerHTML='<div class="panel done"><p class="eyebrow">Goed ontvangen</p><h2>Bedankt, je antwoorden zijn verzonden.</h2><p>Marleo bekijkt je wensen en gebruikt deze als basis voor het zoekwoordenonderzoek en de SEO-aanpak.</p><p class="hint">Wil je iets aanvullen? Neem contact op via info@marleo.tech.</p></div>';return;
  }
  app.innerHTML='<div class="panel"><p class="meta">Voor '+escape(row.customer_name)+'</p><p class="notice">Weet je iets niet? Laat het gerust open. De drie basisvragen met * zijn nodig om te verzenden. Bewaar je antwoorden per stap; je kunt later via dezelfde persoonlijke link verdergaan. Stuur geen wachtwoorden mee.</p><p class="meta" id="step_name"></p><progress id="progress" max="7" value="1" aria-label="Voortgang"></progress><form id="questionnaire" novalidate>'+GROUPS.map((group,index)=>'<section data-step="'+index+'" '+(index?'hidden':'')+'><h2>'+escape(group)+'</h2>'+QUESTIONS.filter(q=>q.group===index).map(q=>'<div class="field"><label for="answer_'+q.id+'">'+q.number+'. '+escape(q.label)+(q.required?' *':'')+'</label><p class="hint" id="hint_'+q.id+'">'+escape(q.hint)+'</p><textarea id="answer_'+q.id+'" name="'+q.id+'" maxlength="3000" rows="4" aria-describedby="hint_'+q.id+'" '+(q.required?'aria-required="true"':'')+'>'+escape(row.answers?.[q.id]||'')+'</textarea></div>').join('')+'</section>').join('')+
    '<p id="status" class="status" role="status" aria-live="polite"></p><div class="actions"><button type="button" class="secondary" id="previous">Vorige stap</button><button type="button" class="secondary" id="save">Bewaren voor later</button><button type="button" id="next">Bewaren en verder</button><button type="submit" id="submit" hidden>Antwoorden verzenden</button></div><p class="saved" id="saved_at">'+savedLabel()+'</p></form></div>';
  document.getElementById('questionnaire').addEventListener('input',()=>{dirty=true;document.getElementById('saved_at').textContent='Er zijn nog niet opgeslagen wijzigingen.';});
  document.getElementById('questionnaire').addEventListener('submit',e=>{e.preventDefault();save('submit');});
  document.getElementById('previous').onclick=()=>{if(busy)return;step--;showStep();};
  document.getElementById('next').onclick=async()=>{if(await save('save')){step++;showStep();document.getElementById('step_name').scrollIntoView({block:'start'});}};
  document.getElementById('save').onclick=()=>save('save');showStep();
}
function savedLabel(){return answeredCount(row.answers)+' van '+QUESTIONS.length+' vragen ingevuld · laatst bewaard '+new Date(row.updated_at).toLocaleString('nl-BE');}
async function save(action){
  if(busy)return false;
  const values=answers();
  try{validateAnswers(values,action==='submit');}catch(e){
    const missing=QUESTIONS.find(q=>q.required&&!values[q.id].trim());
    if(missing){step=missing.group;showStep();document.getElementById('answer_'+missing.id).focus();}
    status(e.message,true);return false;
  }
  busy=true;document.querySelectorAll('button,textarea').forEach(n=>n.disabled=true);status('Bezig met opslaan…');
  try{row=await api(action,{answers:values,version:row.updated_at});dirty=false;
    if(action==='submit'){render();app.scrollIntoView({block:'start'});}else{status('Je antwoorden zijn bewaard. Je kunt later via dezelfde link verdergaan.');document.getElementById('saved_at').textContent=savedLabel();}
    return true;
  }catch(e){status(e.message,true);return false;}finally{busy=false;document.querySelectorAll('button,textarea').forEach(n=>n.disabled=false);}
}
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
if(!/^[0-9a-f]{64}$/.test(token)){app.innerHTML='<div class="panel"><h2>Persoonlijke link nodig</h2><p>Open de volledige link die je van Marleo hebt ontvangen, inclusief het gedeelte na het #-teken.</p></div>';}else{
  try{row=await api('read');render();}catch(e){app.innerHTML='<div class="panel"><h2>Vragenlijst niet beschikbaar</h2><p>'+escape(e.message)+'</p><p class="hint">Controleer je verbinding of vraag Marleo om een nieuwe link.</p></div>';}
}
