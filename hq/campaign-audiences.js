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
  refreshMarketingPreview();
  if(preview)preview.textContent=selected[0]?'Onderwerp: '+cpVars(selected[0],document.getElementById('cp_sub').value)+'\n\n'+cpVars(selected[0],document.getElementById('cp_body').value):'Selecteer ontvangers om een voorbeeld te zien.';
};

export const customerTemplates = [
  {id:'klant-ai',name:'AI & automatisering',category:'AI SYSTEMS',subject:'Meer tijd voor werk dat telt. Ontdek AI op maat.',cta:'Ontdek de mogelijkheden',
   body:'Meer gedaan. Minder handwerk.\n\nGeef terugkerende taken een slimmere aanpak. Marleo ontwikkelt AI-systemen die aansluiten op de processen en software van uw bedrijf.\n\nVan e-mail naar actie\nLaat informatie uit aanvragen en documenten verzamelen en conceptantwoorden voorbereiden.\n\nSoftware die samenwerkt\nVerbind uw bestaande tools en beperk het overtypen van dezelfde gegevens.\n\nControle bij uw team\nBepaal welke stappen automatisch verlopen en waar een medewerker controleert of goedkeurt.\n\nOntdek waar automatisering binnen uw bedrijf het verschil kan maken. Plan een kennismaking met Marleo.'},
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
  const cards=sections.map(section=>{
    const [title,...lines]=section.split('\n');
    return '<tr><td style="padding:0 0 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e9e6ed;border-radius:12px;background:#faf9fc"><tr><td width="4" bgcolor="#ef4056" style="width:4px;background:linear-gradient(180deg,#f97c1f,#e91e7b)"></td><td style="padding:18px 20px"><p style="margin:0 0 6px;color:#17131d;font-size:17px;font-weight:bold">'+esc(title)+'</p><p style="margin:0;font-size:15px;line-height:1.65;color:#605a69">'+format(lines.join('\n'))+'</p></td></tr></table></td></tr>';
  }).join('');
  return '<!doctype html><html lang="nl"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head><body style="margin:0;padding:0;background:#eeeaf0;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#eeeaf0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden">'+
    '<tr><td bgcolor="#08080e" style="padding:32px 28px;background:#08080e;background-image:radial-gradient(ellipse at top left,#58270f 0%,transparent 65%),radial-gradient(ellipse at bottom right,#4a092b 0%,transparent 65%)">'+
    '<a href="https://marleo.tech/" style="text-decoration:none"><img src="https://marleo.tech/marleo-logo-mail-dark.png" width="168" alt="marleo.tech" style="display:block;border:0;width:168px;max-width:100%;height:auto;color:#ffffff;font-size:24px"></a>'+
    '<p style="margin:38px 0 14px;font-size:11px;line-height:1.5;letter-spacing:3px;font-weight:bold;color:#ff9a4a">'+esc(template.category)+'</p>'+
    '<h1 style="margin:0;font-size:36px;line-height:1.12;letter-spacing:-1px;font-weight:800;color:#ffffff">'+format(headline)+'</h1>'+
    '<p style="margin:22px 0 4px;font-size:16px;line-height:1.7;color:#ddd4df">'+format(intro)+'</p></td></tr>'+
    '<tr><td height="4" bgcolor="#ef4056" style="height:4px;line-height:4px;font-size:0;background:linear-gradient(90deg,#f97c1f,#ef4056,#e91e7b)">&nbsp;</td></tr>'+
    '<tr><td style="padding:28px 24px 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">'+cards+'</table></td></tr>'+
    '<tr><td style="padding:8px 28px 32px"><p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#514b59">'+format(closing)+'</p>'+
    '<table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#ed405f" style="border-radius:8px;background:linear-gradient(100deg,#f97c1f,#e91e7b)"><a href="https://marleo.tech/afspraak/" style="display:inline-block;padding:16px 24px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none">'+esc(template.cta)+'</a></td></tr></table></td></tr>'+
    '<tr><td bgcolor="#08080e" style="padding:26px 28px;color:#aaa2b1;font-size:12px;line-height:1.8"><p style="margin:0 0 8px;color:#ffffff;font-size:16px;font-weight:bold">marleo.tech</p><p style="margin:0;letter-spacing:1px">WEBSITES / AI SYSTEMS / IT</p><p style="margin:14px 0 0"><a href="mailto:info@marleo.tech" style="color:#d8cddd;text-decoration:none">info@marleo.tech</a></p></td></tr>'+
    '</table></td></tr></table></body></html>';
};
function refreshMarketingPreview(){
  const host=document.getElementById('cp_pv');
  if(!host)return;
  let frame=document.getElementById('cp_design_preview');
  const active=!!CPT[CPTPL]?.customerTemplate;
  if(!frame&&active){
    frame=document.createElement('iframe');frame.id='cp_design_preview';frame.title='Ontwerp van de marketingmail';frame.setAttribute('sandbox','allow-same-origin');
    frame.style.cssText='display:block;width:100%;height:570px;border:1px solid var(--line);border-radius:12px;margin-top:12px;background:#eeeaf0';host.after(frame);
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
    const button=document.createElement('button');button.className='btn';button.textContent='Mailcampagnes';button.dataset.openCampaigns='';
    button.onclick=()=>go('campagnes');top.append(button);
  }
  if(!document.getElementById('customer-template-library')){
    const section=document.createElement('section');section.id='customer-template-library';section.className='panelbox';
    section.innerHTML='<h3>Marketingmails in Marleo-stijl</h3><p class="hint">Acht complete campagnes met een uitgesproken header, voordeelblokken en een actieknop. Bekijk het ontwerp en bewerk de tekst voordat u inplant.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">'+
      customerTemplates.map(template=>'<article style="border:1px solid var(--line);border-radius:12px;padding:16px"><h4>'+esc(template.name)+'</h4><p class="hint">'+esc(template.subject)+'</p><details><summary>Ontwerp bekijken</summary><iframe sandbox="allow-same-origin" loading="lazy" title="'+esc(template.name)+'" style="width:100%;height:480px;border:0;margin:12px 0;background:#eeeaf0;border-radius:8px" srcdoc="'+esc(cpRich(template.id,template.body))+'"></iframe></details><button class="btn sm" data-customer-template="'+template.id+'">Deze mail gebruiken</button></article>').join('')+'</div>';
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
