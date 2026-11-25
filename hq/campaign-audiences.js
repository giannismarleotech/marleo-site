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
  const limit = Math.max(1, Math.min(100, Number(document.getElementById('cp_lim')?.value) || 20));
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
  refreshMarketingPreview();
  let schedule=document.getElementById('cp-schedule-preview');
  if(!schedule){schedule=document.createElement('div');schedule.id='cp-schedule-preview';schedule.className='ct-planning';counter.after(schedule);}
  const slots=window.cpSlots?.(selected.length,Math.max(1,Math.min(100,limit)))||[];
  const when=value=>window.cpScheduleStamp?.(value?.toISOString())||value?.toLocaleString('nl-BE')||'Nog niet gepland';
  schedule.innerHTML=slots.length?'<span><b>Eerste verzending</b><strong>'+esc(when(slots[0]))+'</strong></span><span><b>Laatste verzending</b><strong>'+esc(when(slots.at(-1)))+'</strong></span><small>Deze planning geldt voor Inplannen. Nu versturen start direct via de wachtrij.<br>Belgische tijd · op werkdagen gespreid, maximaal '+Math.min(100,limit)+' per dag. Bij bevestiging ziet u de definitieve planning.</small>':'<p>Selecteer ontvangers om de verzendplanning te zien.</p>';
  if(preview)preview.textContent=selected[0]?'Onderwerp: '+cpVars(selected[0],document.getElementById('cp_sub').value)+'\n\n'+cpVars(selected[0],document.getElementById('cp_body').value):'Selecteer ontvangers om een voorbeeld te zien.';
};

export const customerTemplates = [
  {id:'klant-ai',name:'AI & automatisering',category:'AI SYSTEMS',subject:'AI laten aansluiten op uw CRM en werkprocessen',cta:'Bespreek uw werkproces',
   body:'Uw informatie. Beter verbonden.\n\nVerbind uw CRM, documenten en aanvragen in één systeem. AI bereidt informatie en antwoorden voor; uw team houdt de controle.\n\nEen aanvraag komt binnen\nHet systeem haalt de relevante klantgegevens en goedgekeurde bedrijfsinformatie erbij.\n\nEen concept staat klaar\nDenk aan een antwoord, een bijgewerkt dossier of een volgende taak. We bepalen samen welke stappen zinvol zijn.\n\nUw team beslist\nBelangrijke wijzigingen en berichten blijven ter goedkeuring bij uw medewerkers.\n\nWe bekijken samen één werkproces: welke informatie nodig is, wat automatisch kan en waar uw team controleert.'},
  {id:'klant-bestelmail',name:'Slimme orderverwerking',category:'SMART OPERATIONS',subject:'Van bestelmail naar conceptorder. Zonder dubbel werk.',cta:'Bespreek uw orderproces',
   body:'Van inbox naar overzicht.\n\nBestellingen verwerken hoeft geen eindeloze reeks kopieer- en plakacties te zijn. Breng structuur in inkomende orders met een oplossing op maat.\n\nGegevens verzamelen\nHaal artikelen, aantallen en klantgegevens uit inkomende e-mails en bijlagen.\n\nConceptorders klaarzetten\nLaat gegevens voorbereiden voor uw bedrijfssoftware, afgestemd op de beschikbare koppelingen.\n\nGoedkeuren met overzicht\nLaat uw team de gegevens controleren voordat een order definitief wordt verwerkt.\n\nEen efficiënter orderproces begint met inzicht in uw huidige werkwijze. Ontdek de mogelijkheden.'},
  {id:'klant-offerte',name:'Offertes & opvolging',category:'BUSINESS AUTOMATION',subject:'Meer structuur in aanvragen, offertes en opvolging.',cta:'Ontdek slimmere opvolging',
   body:'Elke aanvraag verdient opvolging.\n\nBreng meer rust in uw verkoopproces. Met slimme tools op maat worden aanvragen, conceptoffertes en opvolgtaken overzichtelijk samengebracht.\n\nAanvragen op één plek\nVerzamel de informatie die uw team nodig heeft om een offerte voor te bereiden.\n\nMinder herhaalwerk\nWerk met herbruikbare gegevens en conceptdocumenten die uw team zelf controleert.\n\nDuidelijke volgende stappen\nHoud zicht op openstaande aanvragen en plan de juiste opvolging.\n\nMaak van losse acties een duidelijk proces. Bespreek met Marleo hoe uw offerteflow eenvoudiger kan.'},
  {id:'klant-crm',name:'CRM & interne tools',category:'CUSTOM SOFTWARE',subject:'Klanten, projecten en planning. Eén duidelijk overzicht.',cta:'Bespreek uw CRM',
   body:'Uw bedrijf. Eén overzicht.\n\nKlantgegevens in Excel, documenten in mappen en planning in losse berichten? Breng uw dagelijkse werking samen in een CRM of interne tool op maat.\n\nKlantendossiers centraal\nBundel contactgegevens, documenten en opvolging in een overzichtelijke omgeving.\n\nGrip op projecten\nHoud taken, planning en belangrijke informatie binnen bereik van uw team.\n\nOok onderweg\nWerk met een interface die aansluit op desktop, tablet en telefoon.\n\nGebouwd rond uw werkwijze en de functies die uw team nodig heeft. Ontdek wat een systeem op maat kan betekenen.'},
  {id:'klant-website',name:'Website & digitale groei',category:'WEB EXPERIENCES',subject:'Een website die meegroeit met uw bedrijf.',cta:'Bespreek uw website',
   body:'Klaar voor uw volgende stap.\n\nNieuwe diensten, sterke projecten of een uitgebreider aanbod verdienen een plaats op uw website. Houd uw digitale uitstraling in lijn met de groei van uw bedrijf.\n\nSterke eerste indruk\nPresenteer uw diensten en projecten met een heldere structuur en een verzorgde vormgeving.\n\nMeer mogelijkheden\nBreid uit met extra talen, aanvraagformulieren of een passende afsprakenmodule.\n\nPrettig op elk scherm\nMaak informatie toegankelijk voor bezoekers op mobiel en desktop.\n\nVan gerichte uitbreiding tot een nieuwe digitale ervaring. Marleo helpt uw volgende stap vorm te geven.'},
  {id:'klant-it',name:'IT-beheer & ondersteuning',category:'MANAGED IT',subject:'Een sterke werkdag begint met IT die werkt.',cta:'Bespreek uw IT-omgeving',
   body:'Sterke IT. Meer werkcomfort.\n\nUw team moet kunnen rekenen op de digitale werkplek. Marleo ondersteunt bedrijven met professionele e-mail, Microsoft 365, werkplekken en dagelijks IT-beheer.\n\nGoed ingerichte werkplekken\nZorg voor een praktische inrichting van computers, accounts en gedeelde bestanden.\n\nOverzicht in toegangen\nStem rechten en instellingen af op de rollen binnen uw team.\n\nOndersteuning wanneer nodig\nKrijg hulp bij technische vragen en verbeteringen aan uw IT-omgeving.\n\nBreng uw huidige situatie en ondersteuningsbehoeften in kaart. Samen bepalen we een passende aanpak.'},
  {id:'klant-backup',name:'Back-ups & e-mailbeveiliging',category:'CYBERSECURITY',subject:'Hoe goed zijn uw bedrijfsgegevens beschermd?',cta:'Bespreek uw beveiliging',
   body:'Bescherm wat uw bedrijf draaiende houdt.\n\nBestanden en e-mail zijn onmisbaar in de dagelijkse werking. Breng mogelijke kwetsbaarheden in kaart en zet gerichte stappen naar een beter beschermde omgeving.\n\nHerstelbaarheid bekijken\nControleer hoe belangrijke bestanden worden bewaard en hersteld bij een incident.\n\nE-mailinstellingen nakijken\nLaat de instellingen van uw domein en e-mailomgeving beoordelen.\n\nDuidelijke verbeterpunten\nOntvang een praktisch overzicht als basis voor verdere maatregelen.\n\nMeer inzicht begint met een afgebakende opdracht. Bespreek welke omgeving u wilt laten nakijken.'},
  {id:'klant-overzicht',name:'Het aanbod van Marleo',category:'YOUR DIGITAL PARTNER',subject:'Van sterke website tot slimme bedrijfssoftware.',cta:'Ontdek wat mogelijk is',
   body:'Een volgende stap voor uw bedrijf.\n\nEen sterke digitale werking vraagt om oplossingen die bij elkaar passen. Marleo combineert websites, bedrijfssoftware en IT-ondersteuning rond de behoeften van uw organisatie.\n\nWebsites & digitale ervaringen\nPresenteer uw aanbod helder met een website, webshop of gerichte uitbreiding.\n\nAI & software op maat\nVereenvoudig processen met automatisering, CRM-systemen en koppelingen.\n\nIT & bescherming\nOndersteun uw team met professionele e-mail, werkplekbeheer en back-ups.\n\nEen concreet project of een proces dat eenvoudiger kan? Ontdek samen met Marleo welke oplossing past.'}
];
for (const template of customerTemplates) {
  CPT[template.id]={n:template.name,sub:template.subject,body:template.body,cat:'',bul:[],end:'',cta:template.cta,customerTemplate:true};
}
const oldRich=window.cpRich;
window.cpRich=function(key,text,preview){
  if(!CPT[key]?.customerTemplate)return oldRich.apply(this,arguments);
  const template=customerTemplates.find(item=>item.id===key);
  const sections=String(text).split(/\n\s*\n/).map(part=>part.trim()).filter(Boolean);
  // Every visible content block comes from the editable message, including the headline.
  const headline=sections.shift()||template.name;
  const intro=sections.shift()||'';
  const closing=sections.length?sections.pop():'';
  const format=value=>esc(value).replace(/\n/g,'<br>');
  const rows=sections.map(section=>{
    const [title,...lines]=section.split('\n');
    return '<tr><td class="mail-row" style="padding:19px 0;border-top:1px solid #302a35"><p style="margin:0 0 7px;font-size:16px;line-height:1.4;font-weight:600;color:#f6f1f8">'+esc(title)+'</p><p style="margin:0;font-size:14px;line-height:1.8;color:#b9b1c2">'+format(lines.join('\n'))+'</p></td></tr>';
  }).join('');
  return '<!doctype html><html lang="nl"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"><style>@media(max-width:480px){.mail-pad{padding-left:22px!important;padding-right:22px!important}.mail-title{font-size:27px!important}.mail-outer{padding:0!important}}</style></head><body style="margin:0;padding:0;background:#09090f;color:#f6f1f8;font-family:Arial,Helvetica,sans-serif">'+
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px">'+esc(intro)+'</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#09090f"><tr><td class="mail-outer" align="center" style="padding:20px 10px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="#100e16" style="width:100%;max-width:600px;background:#100e16">'+
    '<tr><td class="mail-pad" style="padding:28px 32px 0"><a href="https://marleo.tech/" style="text-decoration:none"><img src="https://marleo.tech/assets/marleo-email-wordmark.png" width="176" alt="marleo.tech" style="display:block;border:0;width:176px;max-width:100%;height:auto"></a></td></tr>'+
    '<tr><td class="mail-pad" style="padding:25px 32px 22px"><p style="margin:0 0 12px;font-size:10px;line-height:1.5;letter-spacing:1.8px;color:#db9b80">'+esc(template.category)+'</p><h1 class="mail-title" style="margin:0;font-size:30px;line-height:1.18;letter-spacing:-.8px;font-weight:500;color:#ffffff">'+format(headline)+'</h1><p style="margin:16px 0 0;font-size:15px;line-height:1.75;color:#c0b8c9">'+format(intro)+'</p></td></tr>'+
    '<tr><td class="mail-pad" style="padding:0 32px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">'+rows+'</table></td></tr>'+
    '<tr><td class="mail-pad" style="padding:18px 32px 28px"><p style="margin:0 0 21px;font-size:14px;line-height:1.8;color:#c0b8c9">'+format(closing)+'</p><table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#f77935" style="background:#f77935;border-radius:5px"><a href="https://marleo.tech/afspraak/?lang=nl" style="display:inline-block;padding:12px 19px;color:#100e16;text-decoration:none;font-size:13px;font-weight:bold;line-height:1.5">'+esc(template.cta)+'</a></td></tr></table></td></tr>'+
    '<tr><td class="mail-pad" style="padding:0 32px 25px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding-top:19px;border-top:1px solid #302a35;font-size:11px;line-height:1.9;color:#908697"><a href="https://marleo.tech/" style="color:#d1c6d9;text-decoration:none">marleo.tech</a> &nbsp; / &nbsp; AI · CRM · IT<br><a href="mailto:info@marleo.tech" style="color:#a89daf;text-decoration:none">info@marleo.tech</a></td></tr></table></td></tr>'+
    '</table></td></tr></table></body></html>';

};
function refreshMarketingPreview(){
  const host=document.getElementById('cp_pv');
  if(!host)return;
  let frame=document.getElementById('cp_design_preview');
  const active=!!CPT[CPTPL]?.customerTemplate;
  if(!frame&&active){
    frame=document.createElement('iframe');frame.id='cp_design_preview';frame.title='Ontwerp van de marketingmail';frame.setAttribute('sandbox','allow-same-origin');
    frame.style.cssText='display:block;width:100%;height:570px;border:1px solid var(--line);border-radius:12px;margin-top:12px;background:#100e16';host.after(frame);
  }
  if(frame){frame.hidden=!active;frame.style.display=active?'block':'none';if(active)frame.srcdoc=cpRich(CPTPL,document.getElementById('cp_body').value);}
}
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
  help.textContent=existing?'Marketingmails in de Marleo-huisstijl, met titel, voordelen en actieknop. Pas onderwerp en alle tekstblokken hieronder aan. Het ontwerp staat onder de editor.':'Voorbeelden voor een eerste kennismaking met Marleo.';
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
    const button=document.createElement('button');button.className='btn';button.textContent='Planning & resultaten';button.dataset.openCampaigns='';
    button.onclick=()=>go('campagnes');top.append(button);
  }
  if(!document.getElementById('customer-template-library')){
    const section=document.createElement('section');section.id='customer-template-library';section.className='panelbox';
    section.innerHTML='<h3>Marketingmails in Marleo-stijl</h3><p class="hint">Acht rustige mailontwerpen in de stijl van onze website, met duidelijke tekst en één actieknop. Bekijk het ontwerp, kies ontvangers en verstuur direct of plan de mail in.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">'+
      customerTemplates.map(template=>'<article style="border:1px solid var(--line);border-radius:12px;padding:16px"><h4>'+esc(template.name)+'</h4><p class="hint">'+esc(template.subject)+'</p><details><summary>Ontwerp bekijken</summary><iframe sandbox="allow-same-origin" loading="lazy" title="'+esc(template.name)+'" style="width:100%;height:480px;border:0;margin:12px 0;background:#100e16;border-radius:8px" srcdoc="'+esc(cpRich(template.id,template.body))+'"></iframe></details><button class="btn sm" data-customer-template="'+template.id+'">E-mail versturen</button></article>').join('')+'</div>';
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
