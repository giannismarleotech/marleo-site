/* Real cloud schedule and execution state. No simulated staff activity. */
(function(){
const OWNER='77f6201e-8836-46b8-9c7a-0c118c4db61e',allowed=()=>window.CLOUD?.uid===OWNER&&window.SESSION?.role==='admin';
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const when=s=>s?new Date(s).toLocaleString('nl-BE',{timeZone:'Europe/Brussels',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'Nog niet gestart';
let cfg=null,jobs=[],busy=false,error='',loading=false,last=0;
async function api(body){const r=await sb.functions.invoke('hq-autopilot',{body});if(r.error||!r.data?.ok)throw Error(r.data?.error||'Planning kon niet worden geladen.');return r.data;}
async function load(){if(loading||!allowed())return;loading=true;try{cfg=await api({action:'status'});error='';last=Date.now();}catch(err){error=err.message;}finally{loading=false;paint();}}
const team=[
 {name:'Lead Scout',steps:['Bedrijven zoeken'],desc:'Zoekt echte bedrijven in België en Europa.',auto:true},
 {name:'Research',steps:['Bedrijfswebsites lezen','Bedrijfsonderzoek','Brononderzoek'],desc:'Leest websites en bewaart controleerbare bronnen.',auto:true},
 {name:'Quality',steps:['Bedrijven selecteren'],desc:'Controleert bedrijfsgegevens en verwijdert dubbele resultaten.',auto:true},
 {name:'Strategist',steps:['AI- & CRM-kansen','Gezamenlijke AI-voorbereiding'],desc:'Bereidt AI- en CRM-kansen voor op dossieropdracht.'},
 {name:'Copywriter',steps:['Contactvoorbereiding'],desc:'Schrijft mailconcepten op dossieropdracht. Versturen blijft apart.'},
 {name:'Follow-up',steps:['Opvolging'],desc:'Bereidt opvolging voor op basis van echte contactnotities.'}
];
const labels={working:'Aan het werk',done:'Afgerond',waiting:'Beschikbaar',unknown:'Update ontbreekt',failed:'Aandacht nodig'};
function station(t){
 const active=jobs.find(j=>['queued','running'].includes(j.status)&&t.steps.includes(j.step));
 const previous=jobs.find(j=>t.steps.includes(j.step)||j.events?.some(v=>t.steps.includes(v.step)));
 const job=active||previous,ev=job?.events?.filter(v=>t.steps.includes(v.step)).at(-1);
 const stale=active&&(!Date.parse(active.updated_at)||Date.now()-Date.parse(active.updated_at)>180000);
 const state=error?'unknown':stale?'unknown':active?'working':job?.status==='failed'&&t.steps.includes(job.step)?'failed':ev?.status==='completed'?'done':'waiting';
 return {...t,job,state,message:active?active.title:ev?.message||t.desc};
}
let scene=null,sceneHost=null,sceneLoading=false,sceneError='',sceneRows=[];
function office(){return '<div class="ap-floor ap-floor-real"><div class="ap-floor-label"><span>MARLEO / LIVE OFFICE</span><span id="ap-live-count"></span></div><div class="ap-3d-host" id="ap-3d-host"><p class="ap-3d-loading">Werkvloer laden…</p></div><div class="ap-3d-tools"><span>Slepen om rond te kijken</span><div><button type="button" id="ap-motion">Animatie pauzeren</button><button type="button" id="ap-turn-left" aria-label="Draai werkvloer naar links">Links draaien</button><button type="button" id="ap-reset-view">Herstel beeld</button><button type="button" id="ap-turn-right" aria-label="Draai werkvloer naar rechts">Rechts draaien</button></div></div><div class="ap-legend"><span><i></i> Typen = echte opdracht · rustige beweging = beschikbaar</span><span>Beschikbaar = geen lopende opdracht</span></div></div>';}
async function mountScene(stations,el){sceneRows=stations;const slot=el.querySelector('#ap-3d-host');if(sceneHost&&sceneHost!==slot){slot.replaceWith(sceneHost);}else sceneHost=slot;
 el.querySelector('#ap-live-count').textContent=stations.filter(s=>s.state==='working').length+' AGENTS ACTIEF';
 el.querySelector('#ap-motion').onclick=event=>{const moving=scene?.toggleMotion();event.currentTarget.textContent=moving?'Animatie pauzeren':'Animatie hervatten';};
 el.querySelector('#ap-turn-left').onclick=()=>scene?.rotate(-.2);el.querySelector('#ap-turn-right').onclick=()=>scene?.rotate(.2);el.querySelector('#ap-reset-view').onclick=()=>scene?.reset();
 if(scene){scene.update(stations);el.querySelector('#ap-motion').textContent=scene.isAnimating()?'Animatie pauzeren':'Animatie hervatten';return;}if(sceneLoading)return;
 if(!window.WebGLRenderingContext){sceneHost.innerHTML='<p class="ap-3d-loading">3D is niet beschikbaar in deze browser. Alle opdrachten en statussen staan hieronder.</p>';return;}
 if(sceneError){sceneHost.textContent=sceneError;return;}sceneLoading=true;
 try{const module=await import('./office-scene.js?v=20261125-office3d2');sceneHost.replaceChildren();scene=module.createOffice(sceneHost,id=>window.MarleoControl?.openJob(id));scene.update(sceneRows);}catch(err){sceneError='De 3D-weergave kon niet laden. Je opdrachten werken verder; bekijk de statussen hieronder.';sceneHost.textContent=sceneError;console.warn('Marleo office renderer unavailable',err.message);}finally{sceneLoading=false;}
}
function paint(){const el=document.getElementById('hq-autopilot-office');if(!el||!allowed())return;
const focused=document.activeElement?.closest('#hq-autopilot-office')?document.activeElement:null,focusId=focused?.id,focusStation=focused?.dataset?.station;
const running=jobs.find(j=>['queued','running'].includes(j.status)),stale=running&&Date.now()-Date.parse(running.updated_at)>180000;
const stations=team.map(station);
const latest=jobs.find(j=>j.title?.startsWith('Automatische zoekronde'));
if(sceneHost?.isConnected)sceneHost.remove();
el.innerHTML='<div class="ap-heading"><div><p class="cc-kicker">MARLEO / DIGITAAL KANTOOR</p><h2>Jouw digitale werkvloer</h2><p>België en Europa · verschillende sectoren · één ronde per uur</p></div><button class="btn '+(cfg?.enabled?'subtle':'')+'" id="ap-toggle" '+(!cfg||busy?'disabled':'')+'>'+(busy?'Opslaan…':cfg?.enabled?'Automatisering pauzeren':'Automatisering starten')+'</button></div>'+
'<div class="ap-schedule"><span><b>'+(!cfg?'Status onbekend':cfg.enabled?'Planning actief':'Planning gepauzeerd')+'</b><small>'+(error?e(error):e(cfg?.note||'Planning laden…'))+'</small></span><span><b>'+e(cfg?.enabled?when(cfg.nextRun):'Geen geplande uitvoering')+'</b><small>Volgende ronde · Belgische tijd</small></span><span><b>'+e(cfg?cfg.attempts+' / '+cfg.monthlyLimit:'—')+'</b><small>Automatische pogingen deze maand</small></span></div>'+
office(stations)+'<div class="ap-desks">'+stations.map((t,i)=>'<button type="button" class="ap-desk '+t.state+'" data-station="'+i+'"><small>'+String(i+1).padStart(2,'0')+' / '+(t.auto?'AUTOMATISCHE ZOEKRONDE':'OP DOSSIEROPDRACHT')+'</small><h3>'+e(t.name)+'</h3><strong class="ap-status">'+labels[t.state]+'</strong><p>'+e(t.message)+'</p><span class="ap-detail">'+(t.job?'Bekijk opdracht en bronnen':'Nog geen opdracht')+'</span></button>').join('')+'</div>'+
'<div class="ap-bottom"><div><h3>Wat gebeurt er nu?</h3><p>'+e(stale?'De cloudwerker heeft te lang geen update gemeld. Deze uitvoering wordt gecontroleerd.':running?running.step+' · '+running.title:cfg?.enabled?'Wacht op de volgende geplande ronde. Je mag HQ sluiten.':'De automatische zoekrondes staan stil.')+'</p>'+(running?.events?.length?'<ol>'+running.events.slice(-3).map(v=>'<li><time>'+when(v.at)+'</time> '+e(v.step)+' — '+e(v.message||v.status)+'</li>').join('')+'</ol>':'')+'</div><div><h3>Laatste automatische ronde</h3><p>'+e(latest?latest.title:'Nog geen automatische ronde geregistreerd.')+'</p>'+(latest?'<button class="btn subtle sm" id="ap-result">Resultaten en bronbewijs bekijken</button>':'')+'</div></div>'+
'<p class="hint">Maximaal 600 automatische zoekaanvragen per kalendermaand. Handmatige zoekopdrachten gebruiken daarnaast providerquota. Geen automatische e-mails of betaalde upgrade. Fouten en lege resultaten blijven zichtbaar; een kandidaat is nog geen geïnteresseerde klant.</p>';
el.querySelector('#ap-toggle').onclick=async()=>{if(busy||!cfg)return;busy=true;paint();try{cfg=await api({action:'configure',enabled:!cfg.enabled});error='';}catch(err){error=err.message;}finally{busy=false;paint();}};
el.querySelectorAll('[data-station]').forEach(button=>{const t=stations[Number(button.dataset.station)];button.disabled=!t.job;button.onclick=()=>window.MarleoControl?.openJob(t.job.id);});
el.querySelector('#ap-result')?.addEventListener('click',()=>window.MarleoControl?.openJob(latest.id));
mountScene(stations,el);
if(focusId)el.querySelector('#'+focusId)?.focus({preventScroll:true});else if(focusStation!==undefined)el.querySelector('[data-station="'+focusStation+'"]')?.focus({preventScroll:true});
}
function mount(){if(!allowed()||window.VIEW!=='controlcenter')return;let el=document.getElementById('hq-autopilot-office');if(!el){const anchor=document.querySelector('.cc-quick-nav');if(!anchor)return;el=document.createElement('section');el.id='hq-autopilot-office';el.className='cc-panel ap-office';anchor.after(el);}paint();if(Date.now()-last>30000)load();}
const style=document.createElement('link');style.rel='stylesheet';style.href='autopilot.css?v=20261125-office3d2';document.head.append(style);
window.MarleoAutopilot={mount,progress:rows=>{jobs=rows;mount();paint();}};
setInterval(()=>{if(allowed()&&window.VIEW==='controlcenter'&&!document.hidden)load();else if(!allowed()){cfg=null;jobs=[];last=0;}},30000);
})();
