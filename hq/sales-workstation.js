(function(){
 const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const emails=v=>String(v||'').split(/[;,\s]+/).filter(x=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x));
 function pipelineCampaign(personalized=false){
   mCamp();const audience=document.getElementById('cp_audience');if(!audience)return;
   audience.value='prospects';audience.onchange();document.getElementById('cp_stage').value='alle';
   document.getElementById('cp_name').value='Marleo · potentiële klanten uit pipeline';
   document.getElementById('cp_sub').value='Een passende oplossing voor {bedrijf}';
   document.getElementById('cp_body').value='{aanhef}\n\nBij Marleo bouwen we websites, CRM-systemen en AI-oplossingen op maat. We bekijken graag welk proces bij {bedrijf} eenvoudiger kan: aanvragen opvolgen, klantgegevens bundelen of terugkerende administratie voorbereiden.\n\nWelke van die taken kost jullie team vandaag het meeste tijd? Op basis daarvan kunnen we een passend voorstel maken.\n\nMet vriendelijke groeten';
   CPTPL='';document.getElementById('cp_tpl').value='';cpAudienceAll(cpFilters()).forEach(d=>{CPEXC[d.email]=!d.id;});
   if(personalized){document.getElementById('cp_name').value='Marleo · persoonlijke AI-voorstellen';document.getElementById('cp_sub').value='{persoonlijk_onderwerp}';document.getElementById('cp_body').value='{persoonlijk_voorstel}';cpAudienceAll(cpFilters()).forEach(d=>{CPEXC[d.email]=!proposal(d);});}
   cpPrev();
 }
 function mount(){
   if(VIEW!=='controlcenter'||document.getElementById('sales-workstation'))return;
   const records=DATA.agentWorkspaces||[],deals=(DATA.deals||[]).filter(d=>!['gewonnen','verloren'].includes(d.stage));
   const section=document.createElement('section');section.id='sales-workstation';section.className='cc-panel sw-panel';
   section.innerHTML='<div class="cc-section-head"><div><p class="cc-kicker">VAN PROSPECT NAAR GESPREK</p><h2>Verkoopwerkstation</h2><p>Onderzoek, voorstellen en opvolging. Je opdrachten blijven in de cloud; mails vertrekken na jouw bevestiging.</p></div></div><div class="sw-actions"><button class="btn" id="sw-search">Bedrijven zoeken</button><button class="btn" id="sw-campaign">Mail naar mijn pipeline</button><button class="btn subtle" id="sw-personal">Campagne met AI-voorstellen</button><button class="btn subtle" id="sw-results">Verzendingen & resultaten</button><button class="btn subtle" id="sw-dossiers">Alle bedrijfsdossiers</button></div><div class="sw-counts"><span><b>'+deals.length+'</b> potentiële klanten</span><span><b>'+deals.filter(d=>emails(d.email).length).length+'</b> met e-mailadres</span><span><b>'+records.filter(r=>r.outputs?.contact?.text).length+'</b> dossiers met mailvoorstel</span></div><p class="hint">Pipelinecampagnes nemen bekende adressen automatisch over. Dubbele, afgemelde en ongeldige adressen worden uitgesloten. Controleer de ontvangers en de tekst. De AI-campagne selecteert alleen prospects met een nagekeken AI-mailvoorstel. Per ontvanger wordt het eerste voorstel uit zijn eigen dossier gebruikt. Ontbrekende voorstellen worden uitgesloten. Open het dossier om voorstellen na te kijken.</p><label class="sw-brief">Mijn verkoopbriefing<textarea id="sw-brief" rows="3" maxlength="4000" placeholder="Bijvoorbeeld: productiebedrijven rond Gent, focus op orderverwerking en CRM. Wat wil je deze week bereiken?">'+e(DATA.salesBrief||'')+'</textarea></label><p class="hint" id="sw-saved">Bewaard in HQ. Gebruik deze briefing bij het starten van een zoekronde of dossieropdracht.</p><label>Zoek een bedrijf<input id="sw-filter" type="search" placeholder="Bedrijfsnaam"></label><div id="sw-list"></div>';
   document.querySelector('.cc-quick-nav')?.after(section);
   section.querySelector('#sw-search').onclick=()=>window.MarleoControl.showSearch();
   section.querySelector('#sw-campaign').onclick=()=>pipelineCampaign();section.querySelector('#sw-personal').onclick=()=>pipelineCampaign(true);
   section.querySelector('#sw-results').onclick=()=>go('campagnes');
   section.querySelector('#sw-dossiers').onclick=()=>go('agents');
   let timer;section.querySelector('#sw-brief').oninput=event=>{DATA.salesBrief=event.target.value;section.querySelector('#sw-saved').textContent='Wijziging wordt bewaard…';clearTimeout(timer);timer=setTimeout(()=>{saveData();section.querySelector('#sw-saved').textContent='Briefing lokaal bijgewerkt; de cloudstatus staat in de zijbalk.';},500);};
   function list(){const q=section.querySelector('#sw-filter').value.toLowerCase();const rows=records.filter(r=>r.company.toLowerCase().includes(q));section.querySelector('#sw-list').innerHTML=rows.length?rows.map(r=>{const d=deals.find(d=>d.id===r.dealId),c=(DATA.customers||[]).find(c=>c.id===r.customerId),address=emails(c?.email||d?.email||r.email);return '<article class="sw-company"><div><b>'+e(r.company)+'</b><p>'+e(address.join(', ')||'E-mailadres ontbreekt')+'</p><small>'+e(r.nextAction||'Volgende actie nog bepalen')+(r.nextDate?' · '+e(r.nextDate):'')+'</small></div><span>'+((r.sources||[]).length)+' bronnen · '+(r.outputs?.contact?.text?'Mailvoorstel klaar':'Nog geen mailvoorstel')+'</span><div class="sw-row-actions"><button class="btn sm" data-sw-run="'+e(r.id)+'">Agenten starten</button><button class="btn subtle sm" data-sw-open="'+e(r.id)+'">Onderzoek & mailvoorstel</button></div></article>';}).join(''):'<p class="hint">Nog geen passend dossier. Start een zoekronde of open Alle bedrijfsdossiers.</p>';section.querySelectorAll('[data-sw-run]').forEach(b=>b.onclick=async()=>{const r=(DATA.agentWorkspaces||[]).find(r=>r.id===b.dataset.swRun);if(!r?.website){toast('Vul eerst de officiële website in het dossier in.',true);window.MarleoAgents.open(r.id);return;}b.disabled=true;b.textContent='Starten…';try{const job=await window.MarleoControl.startDossier(r,['research','opportunity','contact','followup'],{webResearch:true});if(job)await window.MarleoControl.openJob(job.id);}catch(error){toast(error.message,true);}finally{if(b.isConnected){b.disabled=false;b.textContent='Agenten starten';}}});section.querySelectorAll('[data-sw-open]').forEach(b=>b.onclick=()=>window.MarleoAgents.open(b.dataset.swOpen));}
   section.querySelector('#sw-filter').oninput=list;list();
 }
 function proposal(deal){
   const r=(DATA.agentWorkspaces||[]).find(r=>r.dealId===deal.id&&deal.id),out=r?.outputs?.contact;
   if(!out?.reviewedAt||!window.MarleoAgents?.isCurrent(r))return null;
   const first=String(out.text||'').split(/===\s*EMAIL\s+\d+\s*===/i)[1];
   const subject=first?.match(/^SUBJECT:\s*(.+)$/mi)?.[1]?.trim(),body=first?.match(/^BODY:\s*([\s\S]+)$/mi)?.[1]?.trim();
   return subject&&body?{subject,body}:null;
 }
 const originalVars=window.cpVars;
 window.cpVars=function(deal,text){const p=proposal(deal);let value=String(text||'');if(p)value=value.replaceAll('{persoonlijk_onderwerp}',p.subject).replaceAll('{persoonlijk_voorstel}',p.body);return originalVars(deal,value);};
 window.MarleoWorkstation={mount,pipelineCampaign};
})();
