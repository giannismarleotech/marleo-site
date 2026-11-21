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
  if(preview)preview.textContent=selected[0]?cpVars(selected[0],document.getElementById('cp_body').value):'Selecteer ontvangers om een voorbeeld te zien.';
};

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
    cpPrev();
  }
  document.getElementById('cp_audience').onchange=()=>{
    again.checked=document.getElementById('cp_audience').value==='customers';
    targetChanged();
  };
  document.getElementById('cp_body').value='{aanhef}\n\nWe houden je graag op de hoogte van wat Marleo voor je bedrijf kan betekenen.\n\n[Schrijf hier je bericht]\n\nMet vriendelijke groeten';
  targetChanged();
};

const oldEmails=window.rEmails;
window.rEmails=function(){
  const result=oldEmails.apply(this,arguments);
  const top=main().querySelector('.topbar');
  if(top&&!top.querySelector('[data-open-campaigns]')){
    const button=document.createElement('button');button.className='btn';button.textContent='Mailcampagnes';button.dataset.openCampaigns='';
    button.onclick=()=>go('campagnes');top.append(button);
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
