/* Direct template composer. Delivery uses the existing Marleo mail service. */
(function(){
  const originalVals=utVals, deliver=utSend;
  const valid=email=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email||'').trim());
  const ready=()=>Boolean(MXSRV.ready||gConnected());
  let sending=false;
  function refresh(id){
    const r=originalVals(id);
    document.getElementById('tm-subject').value=r.subject;
    document.getElementById('tm-body').value=r.body;
    const ok=valid(r.v.email), connected=ready();
    document.getElementById('tm-status').textContent=!ok?'Kies een klant of prospect met een geldig e-mailadres. Voeg een ontbrekend adres eerst toe aan de klantfiche.':!connected?'Mailverbinding niet beschikbaar. Controleer de e-mailkoppeling bij Instellingen.':'Aan: '+r.v.email+' · Verstuurd in de huisstijl van Marleo, met handtekening.';
    document.getElementById('tm-send').disabled=!ok||!connected;
  }
  useTemplate=function(id){
    const t=DATA.emailtemplates.find(x=>x.id===id);if(!t)return;
    let options='<option value="">Kies een ontvanger</option>';
    for(const [kind,rows,label] of [['c',DATA.customers||[],'Klant'],['d',(DATA.deals||[]).filter(d=>d.stage!=='verloren'),'Prospect']]){
      options+='<optgroup label="'+label+'">'+rows.map(o=>'<option value="'+esc(kind+':'+o.id)+'"'+(valid(o.email)?'':' disabled')+'>'+esc((o.name||o.naam||'Onbekend')+' — '+(valid(o.email)?o.email:'geen geldig e-mailadres'))+'</option>').join('')+'</optgroup>';
    }
    openM('E-mail versturen · '+t.name,
      '<div class="fgroup"><label>Ontvanger uit HQ</label><select id="ut_who">'+options+'</select></div><p id="tm-status" class="hint" role="status"></p><div class="fgroup"><label>Onderwerp</label><input id="tm-subject"></div><div class="fgroup"><label>Bericht — pas aan voor deze ontvanger</label><textarea id="tm-body" style="min-height:260px"></textarea></div><p class="hint">Vul alle {velden} in en controleer de inhoud. Er wordt pas verstuurd wanneer je op Nu versturen klikt.</p>',
      '<button class="btn subtle" id="tm-preview">Voorbeeld bekijken</button><button class="btn" id="tm-send" disabled>Nu versturen</button>',true);
    document.getElementById('ut_who').onchange=()=>refresh(id);
    document.getElementById('tm-preview').onclick=()=>utPreviewHtml(id);
    document.getElementById('tm-send').onclick=()=>utSend(id);
    refresh(id);
  };
  utVals=function(id){const r=originalVals(id),s=document.getElementById('tm-subject'),b=document.getElementById('tm-body');if(s&&b){r.subject=s.value.trim();r.body=b.value;}return r;};
  utSend=async function(id){
    if(sending)return;
    const r=utVals(id);
    if(!valid(r.v.email)){toast('Geen geldig e-mailadres bij deze ontvanger',true);return;}
    if(!ready()){toast('Controleer de e-mailkoppeling bij Instellingen',true);return;}
    if(!r.subject||!r.body.trim()){toast('Vul onderwerp en bericht in',true);return;}
    if(/\{\w+\}/.test(r.subject+r.body)){toast('Vul eerst alle {velden} in het bericht in',true);return;}
    sending=true;const button=document.getElementById('tm-send');if(button){button.disabled=true;button.textContent='Versturen…';}
    try{await deliver(id);}finally{sending=false;if(button?.isConnected){button.disabled=false;button.textContent='Nu versturen';}}
  };
})();
