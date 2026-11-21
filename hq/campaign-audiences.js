const normalize = value => String(value || '').trim().toLowerCase();
function addresses(value) {
  return [...new Set(String(value || '').split(/[;,\s]+/).map(normalize)
    .filter(email => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)))];
}

export function recipients(data, campaign, filters, extra = []) {
  const customerEmails = new Set((data.customers || []).flatMap(customer => addresses(customer.email)));
  const blocked = new Set((campaign.unsub || []).map(item => normalize(item.email)));
  const previous = new Set((campaign.rows || []).map(item => normalize(item.to_email)));
  const customers = (data.customers || []).map(customer => ({
    id:'',customerId:customer.id,naam:customer.name || '',contact:customer.contact || '',
    email:customer.email,plaats:customer.city || customer.address || '',cat:customer.cat || customer.sector || '',
    stage:'klant',audience:'customers'
  }));
  const prospects = [
    ...(data.deals || []).map(deal => ({...deal,audience:'prospects'})),
    ...(data.newco || []).map(company => ({
      id:'',naam:company.name || '',email:company.email,contact:company.contact || '',
      plaats:company.city || '',cat:company.sector || '',stage:'nieuw',audience:'prospects'
    }))
  ];
  const target = filters.audience || 'prospects';
  const source = target === 'customers' ? customers : prospects;
  const candidates = filters.stage === 'geen' && target === 'prospects' ? [] : source;
  const seen = new Set();
  const result = [];
  for (const item of [...candidates, ...extra.map(item=>({...item,audience:customerEmails.has(normalize(item.email))?'customers':'prospects'}))]) {
    for (const email of addresses(item.email)) {
      if (target === 'prospects' && (customerEmails.has(email) || item.audience==='customers')) continue;
      if (target === 'customers' && !customerEmails.has(email)) continue;
      if (blocked.has(email) || seen.has(email) || (!filters.again && previous.has(email))) continue;
      if (target === 'prospects') {
        if (['verloren','gewonnen'].includes(item.stage)) continue;
        if (filters.stage === 'opvolg' && !['gesprek','demo','offerte'].includes(item.stage)) continue;
        if (filters.stage && !['alle','geen','opvolg'].includes(filters.stage) && item.stage !== filters.stage) continue;
        if (filters.web && cpWebKind(item) !== filters.web) continue;
      }
      if (filters.cat && !String(item.cat || '').toLowerCase().includes(filters.cat.toLowerCase())) continue;
      if (filters.plaats && !String(item.plaats || '').toLowerCase().includes(filters.plaats.toLowerCase())) continue;
      if (filters.named && !String(item.contact || '').trim()) continue;
      seen.add(email);
      result.push({...item,email});
    }
  }
  return result;
}

const oldFilters = window.cpFilters;
window.cpFilters = function () {
  return {...oldFilters(),audience:document.getElementById('cp_audience')?.value || 'prospects'};
};
window.cpAudienceAll = filters => recipients(DATA, CAMP, filters, cpParseExtra());
window.cpAudience = filters => cpAudienceAll(filters).filter(item=>!CPEXC[item.email]);

window.cpPrev = function () {
  const counter = document.getElementById('cp_count');
  if (!counter) return;
  const filters = cpFilters();
  const all = cpAudienceAll(filters);
  const selected = cpAudience(filters);
  const label = filters.audience === 'customers' ? 'bestaande klanten' : 'potentiële klanten';
  const limit = Math.max(1, Number(document.getElementById('cp_lim')?.value) || 20);
  counter.innerHTML = '<b>'+selected.length+'</b> van '+all.length+' '+label+' geselecteerd · ongeveer '+Math.ceil(selected.length/limit)+' werkdagen';
  let list = document.getElementById('cp_list');
  if (!list) {list=document.createElement('div');list.id='cp_list';counter.after(list);}
  list.innerHTML = '<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><b>Ontvangers</b><span><button type="button" class="btn sm subtle" id="aud-all">Alles selecteren</button> <button type="button" class="btn sm subtle" id="aud-none">Alles uitvinken</button></span></div>'+
    '<div style="max-height:250px;overflow:auto;margin:10px 0;border:1px solid var(--line);border-radius:10px">'+
    (all.length ? all.map(item=>'<label style="display:flex;gap:10px;padding:10px;margin:0;border-bottom:1px solid var(--line);align-items:flex-start">'+
      '<input style="width:20px;flex:none" type="checkbox" data-aud-email="'+esc(item.email)+'"'+(!CPEXC[item.email]?' checked':'')+'>'+
      '<span style="min-width:0;overflow-wrap:anywhere"><b>'+esc(item.naam||item.email)+'</b><br>'+esc(item.email)+'<br><small>'+esc(item.audience==='customers'?'Bestaande klant':'Potentiële klant')+'</small></span></label>').join('') :
      '<p style="padding:12px">Geen ontvangers met deze filters.</p>')+'</div>'+
    '<p class="hint">Dubbele adressen worden samengevoegd. Afgemelde adressen zijn uitgesloten.</p>';
  list.querySelector('#aud-all').onclick = () => cpAllTog(true);
  list.querySelector('#aud-none').onclick = () => cpAllTog(false);
  list.querySelectorAll('[data-aud-email]').forEach(input=>input.onchange=()=>{CPEXC[input.dataset.audEmail]=!input.checked;cpPrev();});
  document.getElementById('cp_why')?.remove();
  const preview=document.getElementById('cp_pv');
  if(preview)preview.textContent=selected[0]?'Onderwerp: '+cpVars(selected[0],document.getElementById('cp_sub').value)+'\n\n'+cpVars(selected[0],document.getElementById('cp_body').value):'Selecteer ontvangers om een voorbeeld te zien.';
};

export const customerTemplates = [
  {id:'klant-ai',name:'AI voor repetitief werk',subject:'Welke taak bij {bedrijf} kost onnodig veel tijd?',
   body:'{aanhef}\n\nWe werken al samen en ik wil je graag laten weten dat je bij Marleo ook terechtkunt voor AI-systemen op maat.\n\nDenk aan bestelgegevens uit e-mails halen, documenten samenvatten of een conceptantwoord voorbereiden. We bekijken hoe dit aansluit op de software die jullie gebruiken en waar jullie zelf controle willen houden.\n\nIs er bij {bedrijf} een terugkerende taak die veel tijd vraagt? Antwoord gerust met een voorbeeld. Dan bekijken we samen wat haalbaar is.'},
  {id:'klant-bestelmail',name:'Bestelmails verwerken met AI',subject:'Bestellingen voor {bedrijf} sneller verwerken',
   body:'{aanhef}\n\nKomen bestellingen bij jullie binnen via e-mail en worden de gegevens daarna overgetypt?\n\nWe kunnen een toepassing bouwen die klantgegevens, artikelen en aantallen uit een bestelmail haalt en een conceptorder in jullie software klaarzet. Een medewerker controleert de gegevens en keurt de bestelling goed.\n\nWe beginnen met een concreet voorbeeld en bekijken samen welke koppeling nodig is.\n\nWil je weten of dit bij {bedrijf} kan werken? Stuur me gerust hoe jullie bestellingen vandaag verwerken.'},
  {id:'klant-offerte',name:'Offertes en opvolging automatiseren',subject:'Minder handwerk rond offertes bij {bedrijf}',
   body:'{aanhef}\n\nNaast onze bestaande samenwerking kunnen we ook helpen met jullie offerteproces.\n\nBijvoorbeeld door informatie uit een aanvraag te verzamelen, een conceptofferte klaar te zetten en een opvolgtaak te maken. Jullie controleren de inhoud en bepalen wanneer een bericht naar de klant vertrekt.\n\nWe kunnen dit afstemmen op jullie bestaande werkwijze en software.\n\nWaar loopt de opvolging bij {bedrijf} vandaag het vaakst vast? Laat het me weten, dan bekijken we een passende oplossing.'},
  {id:'klant-crm',name:'CRM, planning en documenten',subject:'Klanten, planning en documenten van {bedrijf} samenbrengen',
   body:'{aanhef}\n\nStaan jullie klantgegevens, planning en documenten verspreid over Excel, e-mail en verschillende mappen?\n\nMarleo bouwt CRM-systemen en interne tools op maat. We kunnen bijvoorbeeld klantendossiers, taken, projectdocumenten en planning samenbrengen in één omgeving die ook op de telefoon werkt.\n\nWe stemmen de functies af op wat jullie team nodig heeft.\n\nWil je eens bekijken welke informatie bij {bedrijf} beter samen kan? Antwoord gerust op deze mail.'},
  {id:'klant-website',name:'Website uitbreiden',subject:'Een volgende stap voor de website van {bedrijf}?',
   body:'{aanhef}\n\nZijn er sinds onze samenwerking nieuwe diensten, projecten of ideeën bij {bedrijf} bijgekomen?\n\nWe helpen graag om jullie website verder te laten aansluiten op de zaak. Denk aan nieuwe projectfoto’s, extra pagina’s, een bijkomende taal of een module voor afspraken of aanvragen.\n\nHeb je iets dat je wilt toevoegen of verbeteren? Stuur het gerust door. Dan bekijken we de mogelijkheden en bezorgen we vooraf een prijsvoorstel.'},
  {id:'klant-it',name:'IT-beheer en ondersteuning',subject:'Ook voor de IT van {bedrijf} kun je bij Marleo terecht',
   body:'{aanhef}\n\nJe kent ons al van onze samenwerking. Wist je dat Marleo ook ondersteuning biedt voor computers, professionele e-mail, Microsoft 365 en het dagelijkse IT-beheer?\n\nWe kunnen helpen bij het instellen van werkplekken, toegangen en gedeelde bestanden, en bij het oplossen van technische problemen.\n\nWil je weten wat dit voor {bedrijf} kan betekenen? Laat me weten hoeveel mensen er met jullie systemen werken en waar jullie hulp bij zoeken.'},
  {id:'klant-backup',name:'Back-ups en e-mailbeveiliging',subject:'Hoe zijn de gegevens en e-mails van {bedrijf} beschermd?',
   body:'{aanhef}\n\nIk wil je graag wijzen op twee diensten waarmee we bestaande klanten kunnen helpen: back-ups en e-mailbeveiliging.\n\nWe bekijken hoe bestanden kunnen worden hersteld bij een probleem en controleren de instellingen van jullie e-maildomein. Op basis daarvan maken we een overzicht van mogelijke verbeteringen.\n\nWil je dat we dit voor {bedrijf} bespreken? Antwoord gerust, dan stemmen we af welke omgeving we mogen nakijken en wat de opdracht omvat.'},
  {id:'klant-overzicht',name:'Overzicht van onze diensten',subject:'Wat Marleo nog meer voor {bedrijf} kan betekenen',
   body:'{aanhef}\n\nBedankt voor het vertrouwen in Marleo. Ik geef je graag een kort overzicht van wat we naast onze huidige samenwerking kunnen doen.\n\n• Websites uitbreiden en webshops bouwen\n• CRM, planning en interne tools op maat\n• AI voor het verwerken van e-mails en documenten\n• Koppelingen tussen bedrijfssoftware\n• IT-ondersteuning, professionele e-mail en back-ups\n\nHeb je bij {bedrijf} een idee of een taak die eenvoudiger zou kunnen? Stuur het gerust door. Dan bekijken we samen een concrete volgende stap en het bijbehorende budget.'}
];
for (const template of customerTemplates) {
  CPT[template.id]={n:template.name,sub:template.subject,body:template.body,cat:'',bul:[],end:'',cta:'',customerTemplate:true};
}
const oldRich=window.cpRich;
window.cpRich=function(key,text,preview){
  if(!CPT[key]?.customerTemplate)return oldRich.apply(this,arguments);
  return '<!doctype html><html><body style="margin:0;background:#f4f4f8;font:15px Arial,sans-serif"><div style="max-width:600px;margin:24px auto;background:white;border-radius:14px;overflow:hidden">'+
    '<div style="padding:24px;background:#08080e;color:white;font-size:23px;font-weight:700">marleo<span style="color:#f4546e">.tech</span></div>'+
    '<div style="height:4px;background:linear-gradient(90deg,#f97c1f,#e91e7b)"></div><div style="padding:26px;color:#252532;line-height:1.7">'+
    String(text).split(/\n\s*\n/).map(paragraph=>'<p style="margin:0 0 16px">'+esc(paragraph).replace(/\n/g,'<br>')+'</p>').join('')+
    '<div style="margin-top:24px">'+SIG_HTML+'</div></div></div></body></html>';
};
function applyCustomerTemplate(id){
  const template=customerTemplates.find(template=>template.id===id);
  if(!template)return;
  CPTPL=id;
  document.getElementById('cp_tpl').value=id;
  document.getElementById('cp_sub').value=template.subject;
  document.getElementById('cp_body').value=template.body;
  document.getElementById('cp_name').value=template.name;
  cpPrev();
}
function renderTemplateChoices(){
  const select=document.getElementById('cp_tpl');
  if(!select)return;
  const existing=document.getElementById('cp_audience').value==='customers';
  const selected=select.value;
  select.replaceChildren();
  const own=document.createElement('option');own.value='';own.textContent='Eigen tekst schrijven';select.append(own);
  const group=document.createElement('optgroup');group.label=existing?'Voor bestaande klanten':'Voor potentiële klanten';
  for(const [id,template] of Object.entries(CPT)){
    if(!!template.customerTemplate!==existing)continue;
    const option=document.createElement('option');option.value=id;option.textContent=template.n;group.append(option);
  }
  select.append(group);
  select.value=[...select.options].some(option=>option.value===selected)?selected:'';
  CPTPL=select.value;
  select.closest('.fgroup').querySelector('label').textContent='Kies een voorbeeldmail';
  let help=document.getElementById('customer-template-help');
  if(!help){help=document.createElement('p');help.id='customer-template-help';help.className='hint';select.after(help);}
  help.textContent=existing?'Kant-en-klare mails voor klanten die Marleo al kennen. Pas onderwerp en tekst hieronder aan.':'Voorbeelden voor een eerste kennismaking met Marleo.';
  select.onchange=()=>{if(CPT[select.value]?.customerTemplate)applyCustomerTemplate(select.value);else{CPTPL=select.value;if(select.value)cpPickTpl(select.value);cpPrev();}};
}

const oldCamp = window.mCamp;
window.mCamp = function () {
  oldCamp.apply(this,arguments);
  const body=document.getElementById('mBody');
  body.insertAdjacentHTML('afterbegin','<div class="fgroup"><label for="cp_audience">Doelgroep</label><select id="cp_audience"><option value="customers">Bestaande klanten</option><option value="prospects">Potentiële klanten</option></select></div>');
  const stage=document.getElementById('cp_stage');
  stage.value='alle';
  const stageLabel=stage.closest('.fgroup').querySelector('label');
  stageLabel.textContent='Fase van potentiële klant';
  const again=document.getElementById('cp_again');
  again.parentNode.lastChild.textContent=' Ook contacten die al in een eerdere campagne zaten';
  again.checked=true;
  function targetChanged() {
    const existing=document.getElementById('cp_audience').value==='customers';
    stage.closest('.fgroup').hidden=existing;
    document.getElementById('cp_web')?.closest('.fgroup').toggleAttribute('hidden',existing);
    CPEXC={};
    renderTemplateChoices();
    cpPrev();
  }
  document.getElementById('cp_audience').onchange=()=>{
    again.checked=document.getElementById('cp_audience').value==='customers';
    targetChanged();
  };
  document.getElementById('cp_body').value='{aanhef}\n\nWe houden je graag op de hoogte van wat Marleo voor je bedrijf kan betekenen.\n\n[Schrijf hier je bericht]\n\nMet vriendelijke groeten';
  targetChanged();
  applyCustomerTemplate('klant-ai');
};

const oldEmails=window.rEmails;
window.rEmails=function(){
  const result=oldEmails.apply(this,arguments);
  const top=main().querySelector('.topbar');
  if(top&&!top.querySelector('[data-open-campaigns]')){
    const button=document.createElement('button');button.className='btn';button.textContent='Mailcampagnes';button.dataset.openCampaigns='';
    button.onclick=()=>go('campagnes');top.append(button);
  }
  if(!document.getElementById('customer-template-library')){
    const section=document.createElement('section');section.id='customer-template-library';section.className='panelbox';
    section.innerHTML='<h3>Voorbeeldmails voor bestaande klanten</h3><p class="hint">Kies een mail, controleer de ontvangers en pas de inhoud aan.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">'+
      customerTemplates.map(template=>'<article style="border:1px solid var(--line);border-radius:12px;padding:16px"><h4>'+esc(template.name)+'</h4><p class="hint">'+esc(template.subject)+'</p><details><summary>Voorbeeld lezen</summary><p style="white-space:pre-wrap;font-size:.85rem">'+esc(template.body)+'</p></details><button class="btn sm" data-customer-template="'+template.id+'">Deze mail gebruiken</button></article>').join('')+'</div>';
    main().querySelector('.topbar').after(section);
    section.addEventListener('click',event=>{
      const id=event.target.closest('[data-customer-template]')?.dataset.customerTemplate;
      if(id){mCamp();applyCustomerTemplate(id);}
    });
  }
  return result;
};
const oldCampaigns=window.rCampagnes;
window.rCampagnes=async function(){
  const result=await oldCampaigns.apply(this,arguments);
  const subtitle=main().querySelector('.topbar .sub');
  if(subtitle)subtitle.textContent='Mailcampagnes voor bestaande klanten en potentiële klanten, met afzonderlijke ontvangerslijsten.';
  return result;
};
