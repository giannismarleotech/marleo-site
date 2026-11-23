/* Hosting credentials live only in the server vault, never DATA/localStorage/exports. */
const style=document.createElement('style');style.textContent=`
.hq-hosting{max-width:1200px;margin:0 auto}.hq-hosting .host-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:16px}.hq-hosting .host-card{padding:22px;border:1px solid var(--line);border-radius:16px;background:var(--bg2)}.hq-hosting h3{margin:0 0 12px}.hq-hosting p{line-height:1.65}.hq-hosting label,.host-form label{display:block;font-size:1rem;margin:16px 0 8px}.hq-hosting input,.hq-hosting select,.host-form input{width:100%;box-sizing:border-box;min-height:46px;font-size:1rem}.host-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.host-mail{overflow-wrap:anywhere}.host-banner{padding:16px;border:1px solid var(--line);border-radius:12px;margin-bottom:20px;line-height:1.6}.host-error{color:#ff9f9f;white-space:pre-wrap}.host-domain-row{display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:center;margin:10px 0}.host-code{font-family:monospace;word-break:break-all;font-size:1rem;padding:16px;border:1px solid var(--line);border-radius:10px}.host-form p{line-height:1.65}.host-form .host-actions{margin-bottom:12px}.host-status{font-size:1rem;color:var(--muted)}.host-audit{padding:10px 0;border-bottom:1px solid var(--line);overflow-wrap:anywhere}@media(max-width:640px){.host-domain-row{grid-template-columns:1fr auto}.host-domain-row select{grid-column:1/-1;grid-row:2}.hq-hosting .host-card{padding:18px}.host-actions .btn{flex:1}.hq-hosting .topbar{align-items:flex-start}}
`;document.head.append(style);
let state={connected:false,username:'',domains:[]},selected='',seq=0;
const defaults=['abfirestop.be','airmasters.be','axo-group.eu','ferconstruction.be','frietkazerneonwheels.be'];
const html=window.esc;
function errorText(el,error){el.textContent=error.message||'Aanvraag mislukt.';el.setAttribute('role','alert');}
async function api(action,payload={}){
 if(!sb)throw new Error('De cloudverbinding is niet beschikbaar.');
 const {data:auth}=await sb.auth.getSession();if(!auth.session)throw new Error('Log opnieuw in met je Marleo-beheerdersaccount.');
 const {data,error}=await sb.functions.invoke('hq-hosting',{body:{action,...payload}});
 if(error){let body;try{body=await error.context?.json();}catch{}
  const failure=new Error(body?.error||'Hostingbeheer kon niet worden geladen. Controleer je verbinding.');failure.uncertain=!!body?.uncertain||(!body&&['change_password','create_mailbox'].includes(action));throw failure;}
 if(!data?.ok)throw new Error(data?.error||'Onverwacht antwoord van hostingbeheer.');return data;
}
const isAdmin=()=>SESSION?.role==='admin';
function customerOptions(selectedId=''){
 return '<option value="">Geen klant gekoppeld</option>'+(DATA.customers||[]).map(c=>'<option value="'+html(c.id)+'"'+(c.id===selectedId?' selected':'')+'>'+html(c.name)+'</option>').join('');
}
function addDomainRow(container,domain='',customerId=''){
 const row=document.createElement('div');row.className='host-domain-row';
 row.innerHTML='<input data-host-domain aria-label="Domeinnaam" placeholder="voorbeeld.be" value="'+html(domain)+'"><select data-host-customer aria-label="Bijbehorende klant">'+customerOptions(customerId)+'</select><button type="button" class="btn subtle sm" aria-label="Domein uit koppeling halen">Weglaten</button>';
 row.querySelector('button').onclick=()=>row.remove();container.append(row);
}
function connectForm(){
 openM('Vimexx verbinden','<form id="host-connect" class="host-form"><p>Verbind met <b>web0175.zxcs.nl</b>. De Login Key wordt versleuteld op de server opgeslagen. HQ leest eerst de mailboxen van het eerste domein om de verbinding te testen.</p>'+
  '<label for="host-user">DirectAdmin-gebruikersnaam</label><input id="host-user" name="directadmin_username" required autocomplete="off" value="'+html(state.username)+'" placeholder="Je DirectAdmin-gebruikersnaam, niet MarleoHQ">'+
  '<label for="host-key">Login Key'+(state.connected?' (leeg laten om de huidige te behouden)':'')+'</label><input id="host-key" name="directadmin_login_key" type="password" autocomplete="new-password" '+(state.connected?'':'required')+' placeholder="Plak hier de gegenereerde sleutel">'+
  '<p class="hint">De sleutel krijgt alleen Allow: CMD_API_POP. Allow HTM blijft uit. Gebruik je DirectAdmin-hoofdwachtwoord uitsluitend in DirectAdmin bij het aanmaken van de sleutel.</p>'+
  '<label>Toegestane domeinen en klanten</label><div id="host-domains"></div><button type="button" class="btn subtle sm" id="host-add-domain">Domein toevoegen</button>'+
  '<p class="hint">Klantkoppelingen zijn voor jouw overzicht. Dit geeft klanten nog geen toegang. Laat uitsluitend de domeinen staan die je wilt beheren.</p>'+
  '<p class="host-banner">Deze serverkoppeling gebruikt dynamische uitgaande IP-adressen. Laat Allowed IPs bij de Login Key leeg om hiermee te verbinden. Een vaste IP-beperking vereist een aparte vaste gateway.</p>'+
  '<p id="host-connect-error" class="host-error" aria-live="polite"></p><button class="btn" type="submit" id="host-connect-save">Verbinding testen en opslaan</button></form>','<button type="button" class="btn subtle" onclick="closeM()">Sluiten</button>',true);
 const form=document.getElementById('host-connect'),rows=form.querySelector('#host-domains');
 (state.domains.length?state.domains:defaults.map(domain=>({domain}))).forEach(d=>addDomainRow(rows,d.domain,d.customerId));
 form.querySelector('#host-add-domain').onclick=()=>addDomainRow(rows);
 form.onsubmit=async event=>{
  event.preventDefault();const button=form.querySelector('#host-connect-save'),err=form.querySelector('#host-connect-error');err.textContent='';button.disabled=true;button.textContent='Verbinding controleren…';
  const domains=[...rows.children].map(row=>{const select=row.querySelector('select');return {domain:row.querySelector('input').value,customerId:select.value,label:select.value?select.selectedOptions[0]?.textContent:row.querySelector('input').value};});
  try{await api('connect',{username:form.querySelector('#host-user').value,key:form.querySelector('#host-key').value,domains});form.querySelector('#host-key').value='';closeM();toast('Verbonden met Vimexx');if(VIEW==='hosting')render();}
  catch(error){errorText(err,error);}finally{button.disabled=false;button.textContent='Verbinding testen en opslaan';}
 };
}
async function reveal(domain,mailbox){
 openM('Opgeslagen wachtwoord','<div class="host-form"><p><b>'+html(mailbox+'@'+domain)+'</b></p><p>Dit is het laatst via HQ opgeslagen wachtwoord. Een wijziging buiten HQ wordt niet automatisch in deze kluis bijgewerkt.</p><div id="host-secret" class="host-code">Wachtwoord ophalen…</div><p id="host-reveal-note" class="hint"></p><p class="host-error" id="host-reveal-error"></p><div class="host-actions"><button type="button" class="btn subtle" id="host-copy" disabled>Kopiëren</button></div><p class="hint">Het wachtwoord wordt na 30 seconden verborgen.</p></div>','<button class="btn subtle" onclick="closeM()">Sluiten</button>');
 const target=document.getElementById('host-secret'),button=document.getElementById('host-copy');let secret='';
 try{const result=await api('reveal',{domain,mailbox});if(!target.isConnected)return;secret=result.password;target.textContent=secret;button.disabled=false;document.getElementById('host-reveal-note').textContent='Opgeslagen op '+new Date(result.updated_at).toLocaleString('nl-BE');
  button.onclick=async()=>{try{await navigator.clipboard.writeText(secret);toast('Wachtwoord gekopieerd');}catch{toast('Kopiëren is niet gelukt. Je kunt het wachtwoord selecteren.',true);}};
  setTimeout(()=>{secret='';if(target.isConnected){target.textContent='Verborgen. Open opnieuw om te bekijken.';button.disabled=true;}},30000);
 }catch(error){target.textContent='';if(document.getElementById('host-reveal-error'))errorText(document.getElementById('host-reveal-error'),error);}
}
function mailboxForm(domain,mailbox=''){
 const create=!mailbox;
 openM(create?'Mailbox aanmaken':'Mailboxwachtwoord wijzigen','<form id="host-mailbox" class="host-form">'+
  (create?'<label for="host-mailname">Mailboxnaam</label><input id="host-mailname" required pattern="[a-z0-9][a-z0-9._-]{0,63}" placeholder="info"><p class="hint">@'+html(domain)+'</p><label for="host-quota">Mailboxlimiet in MB</label><input id="host-quota" type="number" min="1" max="100000" step="1" value="1024" required>':'<p><b>'+html(mailbox+'@'+domain)+'</b></p>')+
  '<label for="host-pass">Nieuw wachtwoord</label><input id="host-pass" type="password" minlength="14" maxlength="128" autocomplete="new-password" required><div class="host-actions"><button type="button" class="btn subtle sm" id="host-generate-pass">Sterk wachtwoord maken</button><button type="button" class="btn subtle sm" id="host-toggle-pass">Tonen</button></div>'+
  '<label for="host-pass-repeat">Herhaal wachtwoord</label><input id="host-pass-repeat" type="password" autocomplete="new-password" required>'+
  '<p class="hint">Bewaar het wachtwoord ook in je wachtwoordbeheerder. Het wordt na bevestiging door Vimexx versleuteld in HQ opgeslagen.</p>'+
  (!create?'<p class="host-banner">Dit wijzigt het echte mailboxwachtwoord. Daarna moet het nieuwe wachtwoord ook in Outlook, op telefoons en andere mailapps worden ingesteld.</p>':'')+
  '<label style="display:flex;gap:12px;align-items:flex-start"><input id="host-confirm" type="checkbox" required style="width:22px;min-height:22px;flex:none">'+(create?'Ik wil deze mailbox bij Vimexx aanmaken.':'Ik wil het wachtwoord van deze mailbox bij Vimexx wijzigen.')+'</label>'+
  '<p class="host-error" id="host-mutation-error" aria-live="assertive"></p><button type="submit" class="btn" id="host-mutation-submit">'+(create?'Mailbox aanmaken':'Wijzigen bij Vimexx')+'</button></form>','<button class="btn subtle" onclick="closeM()">Sluiten</button>');
 const form=document.getElementById('host-mailbox'),password=form.querySelector('#host-pass'),repeat=form.querySelector('#host-pass-repeat');
 form.querySelector('#host-generate-pass').onclick=()=>{const bytes=crypto.getRandomValues(new Uint8Array(24));const chars='abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#%_-';password.value=repeat.value=[...bytes].map(n=>chars[n%chars.length]).join('');};
 form.querySelector('#host-toggle-pass').onclick=event=>{password.type=repeat.type=password.type==='password'?'text':'password';event.target.textContent=password.type==='password'?'Tonen':'Verbergen';};
 form.onsubmit=async event=>{
  event.preventDefault();const err=form.querySelector('#host-mutation-error'),button=form.querySelector('#host-mutation-submit');err.textContent='';
  if(password.value!==repeat.value){err.textContent='De wachtwoorden komen niet overeen.';return;}
  button.disabled=true;button.textContent='Vimexx verwerkt de wijziging…';let uncertain=false;
  try{const result=await api(create?'create_mailbox':'change_password',{domain,mailbox:create?form.querySelector('#host-mailname').value:mailbox,password:password.value,confirm:form.querySelector('#host-confirm').checked,...(create?{quotaMB:Number(form.querySelector('#host-quota').value)}:{})});
   if(result.stored){password.value=repeat.value='';closeM();toast(result.message);loadDomain(domain);}
   else{err.textContent=result.message+' '+result.warning;button.hidden=true;}
  }catch(error){errorText(err,error);uncertain=error.uncertain;if(uncertain){button.hidden=true;err.textContent+=' Sluit dit venster en controleer de mailbox via webmail.';}}
  finally{if(!uncertain){button.disabled=false;button.textContent=create?'Mailbox aanmaken':'Wijzigen bij Vimexx';}}
 };
}
async function loadDomain(domain){
 selected=domain;const tick=++seq,host=document.getElementById('host-mailboxes');if(!host)return;
 host.innerHTML='<p class="host-status" role="status">Mailboxen ophalen bij Vimexx…</p>';
 try{const result=await api('list',{domain});if(tick!==seq||!host.isConnected)return;
  host.innerHTML='<div class="host-actions" style="margin:0 0 20px"><button class="btn" id="host-new-mailbox">Mailbox aanmaken</button><button class="btn subtle" id="host-refresh">Vernieuwen</button></div><div class="host-grid">'+
   (result.rows.length?result.rows.map(row=>'<article class="host-card"><h3 class="host-mail">'+html(row.email)+'</h3><p class="hint">Gebruik: '+html(row.usageMB.toFixed(1))+' MB · Limiet: '+(row.quotaMB===0?'Onbeperkt':html(row.quotaMB)+' MB')+(row.suspended?' · Geschorst':'')+'</p><p>'+ (row.savedAt?'Wachtwoord in kluis sinds '+new Date(row.savedAt).toLocaleDateString('nl-BE'):'Geen wachtwoord opgeslagen. Bestaande wachtwoorden zijn niet uit Vimexx uit te lezen.')+'</p><div class="host-actions"><button type="button" class="btn subtle sm" data-host-password="'+html(row.name)+'">Wachtwoord wijzigen</button>'+(row.savedAt?'<button type="button" class="btn subtle sm" data-host-reveal="'+html(row.name)+'">Bekijken</button>':'')+'</div></article>').join(''):'<p>Geen mailboxen gevonden voor dit domein.</p>')+'</div>';
  host.querySelector('#host-new-mailbox').onclick=()=>mailboxForm(domain);host.querySelector('#host-refresh').onclick=()=>loadDomain(domain);
  host.querySelectorAll('[data-host-password]').forEach(b=>b.onclick=()=>mailboxForm(domain,b.dataset.hostPassword));host.querySelectorAll('[data-host-reveal]').forEach(b=>b.onclick=()=>reveal(domain,b.dataset.hostReveal));
 }catch(error){if(tick===seq&&host.isConnected){host.innerHTML='<p class="host-error" role="alert"></p><button class="btn subtle">Opnieuw ophalen</button>';errorText(host.querySelector('p'),error);host.querySelector('button').onclick=()=>loadDomain(domain);}}
}
async function render(){
 if(!isAdmin())return;
 const tick=++seq;main().innerHTML='<div class="hq-hosting"><div class="topbar"><div><h2>Hosting & toegangen</h2><p class="sub">Mailboxbeheer bij Vimexx en beveiligde wachtwoordopslag.</p></div></div><p role="status">Beveiligde verbinding controleren…</p></div>';
 try{
  const result=await api('status');if(tick!==seq||VIEW!=='hosting')return;state=result;
  const root=main().querySelector('.hq-hosting');root.innerHTML='<div class="topbar"><div><h2>Hosting & toegangen</h2><p class="sub">Vimexx · web0175.zxcs.nl</p></div><button class="btn" id="host-connection">'+(state.connected?'Koppeling beheren':'Vimexx verbinden')+'</button></div>'+
   (!state.connected?'<section class="host-card"><h3>Verbind jouw hosting met HQ</h3><p>Bekijk de mailboxen per klant en voer wachtwoordwijzigingen rechtstreeks bij Vimexx uit. Voeg je DirectAdmin-gebruikersnaam en beperkte Login Key toe via Vimexx verbinden.</p><p>De sleutel staat uitsluitend versleuteld op de server. Hij komt niet in CRM-exports of lokale opslag terecht.</p><p class="hint">Vereiste rechten: alleen CMD_API_POP. Klanttoegang is in deze eerste versie nog uitgeschakeld.</p></section>':
    '<div class="host-banner">Verbonden. Alleen jij als Marleo-eigenaar hebt toegang. Wijzigingen hieronder worden bij Vimexx uitgevoerd. Een wachtwoord dat buiten HQ verandert, moet opnieuw in de kluis worden bijgewerkt.</div><label for="host-domain-select">Klant / domein</label><select id="host-domain-select">'+state.domains.map(d=>'<option value="'+html(d.domain)+'">'+html((DATA.customers||[]).find(c=>c.id===d.customerId)?.name||d.label||d.domain)+' · '+html(d.domain)+'</option>').join('')+'</select><section id="host-mailboxes" style="margin-top:24px"></section><details style="margin-top:28px"><summary>Laatste beheeracties</summary><div id="host-audit"></div></details>');
  root.querySelector('#host-connection').onclick=connectForm;
  if(state.connected){const select=root.querySelector('#host-domain-select');if(state.domains.some(d=>d.domain===selected))select.value=selected;select.onchange=()=>loadDomain(select.value);loadDomain(select.value);
   const audit=root.querySelector('details');audit.addEventListener('toggle',async()=>{if(!audit.open)return;const target=root.querySelector('#host-audit');target.textContent='Acties ophalen…';try{const data=await api('audit');const names={connected:'Koppeling getest en opgeslagen',listed:'Mailboxen bekeken',password_changed:'Wachtwoord gewijzigd',password_viewed:'Wachtwoord bekeken',mailbox_created:'Mailbox aangemaakt',change_started:'Wachtwoordwijziging gestart',create_started:'Mailboxaanmaak gestart'};target.innerHTML=data.rows.length?data.rows.map(row=>'<div class="host-audit">'+html(names[row.action]||row.action)+' · '+html(row.mailbox?row.mailbox+'@'+row.domain:row.domain||'')+'<br><small>'+html(new Date(row.created_at).toLocaleString('nl-BE'))+'</small></div>').join(''):'Nog geen beheeracties.';}catch(error){errorText(target,error);}});
  }
 }catch(error){if(tick!==seq||VIEW!=='hosting')return;const root=main().querySelector('.hq-hosting');root.innerHTML='<h2>Hosting & toegangen</h2><p class="host-error" role="alert"></p><button class="btn subtle">Opnieuw controleren</button>';errorText(root.querySelector('p'),error);root.querySelector('button').onclick=render;}
}
if(!MENU_ADMIN.some(item=>item[0]==='hosting'))MENU_ADMIN.splice(MENU_ADMIN.findIndex(item=>item[0]==='settings'),0,['hosting','Hosting & toegangen',IC.set]);
const previousGo=window.go;
window.go=function(view){if(view!=='hosting'){seq++;return previousGo.apply(this,arguments);}if(!isAdmin())return previousGo('cportal');VIEW=view;document.querySelectorAll('#navmenu button').forEach(b=>b.classList.toggle('active',b.dataset.v===view));render();window.scrollTo(0,0);};
const previousCustomer=window.rCustPage;
window.rCustPage=function(){const result=previousCustomer.apply(this,arguments);if(isAdmin()){const top=main().querySelector('.topbar');if(top){const button=document.createElement('button');button.type='button';button.className='btn subtle';button.textContent='Hosting & toegangen';button.onclick=()=>{selected=state.domains.find(d=>d.customerId===CUSTVIEW)?.domain||'';go('hosting');};top.append(button);}}return result;};
if(isAdmin())buildMenu();
