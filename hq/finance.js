const round = n => Math.round((Number(n) || 0) * 100) / 100;
const posted = invoice => invoice.type !== 'offerte' && invoice.status !== 'concept';
const net = invoice => invoice.type === 'creditnota' ? -Math.abs(invSub(invoice)) : invSub(invoice);
const gross = invoice => invoice.type === 'creditnota' ? -Math.abs(invTot(invoice)) : invTot(invoice);
// Shared totals feed the invoice page and dashboard as well.
window.totals = function () {
  const value={inv:0,paid:0,open:0,overdue:0,cntOpen:0,cntOverdue:0,exp:0};
  for (const invoice of DATA.invoices.filter(posted)) {
    const amount=gross(invoice),status=invStatus(invoice);
    value.inv+=amount;
    if(status==='betaald')value.paid+=amount;
    else {
      value.open+=amount;value.cntOpen++;
      if(status==='vervallen'){value.overdue+=amount;value.cntOverdue++;}
    }
  }
  value.exp=DATA.expenses.reduce((sum,expense)=>sum+Number(expense.amount||0),0);
  return value;
};
const convertQuote=window.quoteToInvoice;
window.quoteToInvoice=function(id){
  const before=new Set(DATA.invoices.map(invoice=>invoice.id));
  const result=convertQuote.apply(this,arguments);
  const invoice=DATA.invoices.find(item=>!before.has(item.id)&&item.type!=='offerte');
  if(invoice){
    invoice.quoteId=id;
    const quote=DATA.invoices.find(item=>item.id===id);
    if(quote)quote.convertedInvoiceId=invoice.id;
    saveData();
  }
  return result;
};


export function linkedFinal(advance, invoices) {
  return invoices.find(invoice => invoice.type === 'eindfactuur' && invoice.customerId === advance.customerId &&
    (invoice.id === advance.finalId || invoice.advanceId === advance.id)) || null;
}
export function projectPlan(invoices) {
  const advances = invoices.filter(invoice => invoice.type === 'voorschot' && invoice.status !== 'concept');
  const drafts = invoices.filter(invoice => invoice.type === 'eindfactuur' && invoice.status === 'concept');
  const rows = [];
  for (const advance of advances) {
    const final = linkedFinal(advance, invoices);
    if (final) continue;
    const configured = Number(advance.project?.total);
    const total = configured > 0 ? configured : advTotal(advance);
    const balance = round(total - advPart(advance));
    if (balance <= 0) continue;
    rows.push({invoice:advance, balance, estimated:!(configured > 0),
      review:drafts.some(draft => draft.customerId === advance.customerId && !draft.advanceId),
      ignored:!!advance.financePlanIgnored});
  }
  for (const draft of drafts) {
    const linked = advances.find(advance => linkedFinal(advance, invoices)?.id === draft.id);
    rows.push({invoice:draft, balance:round(invSub(draft)), estimated:false,
      review:!linked && advances.some(advance => advance.customerId === draft.customerId && !linkedFinal(advance, invoices)),
      ignored:!!draft.financePlanIgnored});
  }
  return rows;
}
window.advFinal = advance => linkedFinal(advance, DATA.invoices);
window.plannedFinals = () => projectPlan(DATA.invoices)
  .filter(row => !row.ignored && !row.review)
  .map(row => ({adv:row.invoice.type === 'voorschot' ? row.invoice : undefined,
    fin:row.invoice.type === 'eindfactuur' ? row.invoice : undefined,
    cid:row.invoice.customerId,saldo:row.balance}));
window.plannedSum = () => plannedFinals().reduce((sum,row)=>sum+row.saldo,0);

window.plannedPanel = function () {
  const rows = projectPlan(DATA.invoices);
  if (!rows.length) return '';
  const total = rows.filter(row=>!row.ignored && !row.review).reduce((sum,row)=>sum+row.balance,0);
  return '<section id="plannedBox" class="panelbox"><h3>Nog te factureren <span class="pill normaal">'+eur(total)+' verwacht</span></h3>'+
    '<p class="hint">Bedragen excl. btw. Vermoedelijke dubbels tellen pas mee nadat je de koppeling hebt gecontroleerd. Dit is verwachte facturatie.</p>'+
    '<div style="overflow-x:auto"><table><thead><tr><th>Klant</th><th>Document</th><th>Saldo excl. btw</th><th>Controle</th><th>Acties</th></tr></thead><tbody>'+
    rows.map(row=>{
      const invoice=row.invoice;
      return '<tr><td>'+esc(custName(invoice.customerId))+'</td><td>'+esc(invoice.ref)+'</td><td>'+eur(row.balance)+'</td><td>'+
        (row.ignored?'Uitgesloten':row.review?'Mogelijk dubbel · koppel controleren':row.estimated?'Projecttotaal controleren':'In planning')+
        '</td><td><div class="rowactions"><button class="btn sm subtle" data-plan-edit="'+esc(invoice.id)+'">Aanpassen</button>'+
        '<button class="btn sm subtle" data-invoice-edit="'+esc(invoice.id)+'">Factuur bewerken</button>'+
        (invoice.type==='voorschot'&&!row.ignored&&!row.review?'<button class="btn sm" data-final-create="'+esc(invoice.id)+'">Eindfactuur maken</button>':'')+
        '</div></td></tr>';
    }).join('')+'</tbody></table></div></section>';
};

function editPlan(id) {
  const invoice = DATA.invoices.find(item=>item.id===id);
  if (!invoice) return;
  const advance = invoice.type === 'voorschot';
  const candidates = DATA.invoices.filter(item=>item.customerId===invoice.customerId &&
    item.type===(advance?'eindfactuur':'voorschot'));
  const selected = advance ? advFinal(invoice)?.id : invoice.advanceId;
  openM('Facturatieplanning · '+invoice.ref,
    '<p class="hint">Koppel alleen documenten van dezelfde opdracht. Een klant kan meerdere opdrachten hebben.</p>'+
    (advance?'<div class="fgroup"><label for="plan-total">Afgesproken projecttotaal excl. btw</label><input id="plan-total" type="number" min="0" step="0.01" value="'+advTotal(invoice)+'"><p class="hint">Voorschot excl. btw: '+eur(advPart(invoice))+'</p></div>':'')+
    '<div class="fgroup"><label for="plan-link">'+(advance?'Bijbehorende eindfactuur':'Bijbehorend voorschot')+'</label><select id="plan-link"><option value="">Geen koppeling</option>'+
    candidates.map(item=>'<option value="'+esc(item.id)+'"'+(item.id===selected?' selected':'')+'>'+esc(item.ref)+' · '+eur(invSub(item))+' · '+esc(item.status)+'</option>').join('')+'</select></div>'+
    '<label style="display:flex;align-items:center;gap:10px"><input type="checkbox" id="plan-ignore" style="width:20px"'+(invoice.financePlanIgnored?' checked':'')+'> Uitsluiten uit verwachte facturatie</label>'+
    '<p class="hint">Deze instelling bepaalt of dit bedrag meetelt in de planning.</p>',
    '<button class="btn subtle" onclick="closeM()">Annuleren</button><button class="btn" id="plan-save">Opslaan</button>');
  document.getElementById('plan-save').onclick = () => {
    const value = document.getElementById('plan-total')?.value;
    const total = Number(value);
    if (advance && (!value || !Number.isFinite(total) || total < advPart(invoice))) {
      toast('Het projecttotaal moet minstens het voorschotbedrag zijn.',true);return;
    }
    const linkId = document.getElementById('plan-link').value;
    const other = candidates.find(item=>item.id===linkId);
    // Check conflicts before making any changes.
    if (other) {
      const a=advance?invoice:other, f=advance?other:invoice;
      if ((f.advanceId&&f.advanceId!==a.id)||(a.finalId&&a.finalId!==f.id)) {
        toast('Dit document is al aan een andere opdracht gekoppeld. Maak eerst die koppeling los.',true);return;
      }
    }
    if (advance) invoice.project={...invoice.project,total:round(total)};
    for (const item of DATA.invoices) {
      if (advance && item.advanceId===id) delete item.advanceId;
      if (!advance && item.finalId===id) delete item.finalId;
    }
    if (advance) delete invoice.finalId; else delete invoice.advanceId;
    if (other) {
      const a=advance?invoice:other, f=advance?other:invoice;
      a.finalId=f.id;f.advanceId=a.id;
    }
    invoice.financePlanIgnored=document.getElementById('plan-ignore').checked;
    saveData();closeM();go(VIEW);toast('Facturatieplanning opgeslagen');
  };
}
document.addEventListener('click',event=>{
  const edit=event.target.closest('[data-plan-edit]');
  if(edit) editPlan(edit.dataset.planEdit);
  const original=event.target.closest('[data-invoice-edit]');
  if(original) mInvoice(original.dataset.invoiceEdit);
  const final=event.target.closest('[data-final-create]');
  if(final) {
    const invoice=DATA.invoices.find(item=>item.id===final.dataset.finalCreate);
    if(invoice)mFinal(invoice.customerId,invoice.id);
  }
});

export function periodFigures(invoices,expenses,year,month='') {
  const prefix=String(year)+(month?'-'+month:'');
  const list=invoices.filter(invoice=>posted(invoice)&&invoice.date?.startsWith(prefix));
  const quotes=invoices.filter(invoice=>invoice.type==='offerte'&&invoice.date?.startsWith(prefix)&&
    !['geweigerd','afgewezen','vervallen','geannuleerd'].includes(invoice.status)&&!invoice.convertedInvoiceId&&
    !invoices.some(item=>item.quoteId===invoice.id));
  const potential=round(quotes.reduce((sum,invoice)=>sum+invSub(invoice),0));
  const costs=expenses.filter(expense=>expense.date?.startsWith(prefix));
  const turnover=round(list.reduce((sum,invoice)=>sum+net(invoice),0));
  const cost=round(costs.reduce((sum,expense)=>sum+Number(expense.amount||0),0));
  return {potential,turnover,cost,result:round(turnover-cost),count:list.length,
    paid:round(list.filter(invoice=>invStatus(invoice)==='betaald').reduce((sum,invoice)=>sum+gross(invoice),0)),
    open:round(list.filter(invoice=>invStatus(invoice)!=='betaald').reduce((sum,invoice)=>sum+gross(invoice),0))};
}
let year=new Date().getFullYear(), month='';
function metric(label,value,note) {
  return '<div class="stat"><div class="label">'+label+'</div><div class="val">'+eur(value)+'</div><div class="hint">'+note+'</div></div>';
}
window.renderFinance = function () {
  if (SESSION?.role!=='admin'||!['dashboard','stats','reports'].includes(VIEW))return;
  document.getElementById('monthlyInvoices')?.remove();
  document.getElementById('financeOverview')?.remove();
  document.getElementById('zekerRow')?.remove();
  document.getElementById('dashZeker')?.remove();
  // Replace the legacy revenue cards on the start screen.
  if(VIEW==='dashboard') main().querySelector('.stats')?.remove();
  const years=[...new Set([new Date().getFullYear(),year,...DATA.invoices.map(i=>Number(i.date?.slice(0,4))),...DATA.expenses.map(e=>Number(e.date?.slice(0,4)))].filter(Boolean))].sort((a,b)=>b-a);
  const f=periodFigures(DATA.invoices,DATA.expenses,year,month);
  const node=document.createElement('section');node.id='financeOverview';
  node.innerHTML='<div class="topbar"><div><h3>Financieel overzicht</h3><p class="hint">Op basis van factuurdatum en geregistreerde uitgaven.</p></div><div style="display:flex;gap:10px;flex-wrap:wrap"><label>Jaar<select id="finance-year">'+years.map(y=>'<option'+(y===year?' selected':'')+'>'+y+'</option>').join('')+'</select></label><label>Periode<select id="finance-month"><option value="">Heel jaar</option>'+
    Array.from({length:12},(_,i)=>{const m=String(i+1).padStart(2,'0');return '<option value="'+m+'"'+(m===month?' selected':'')+'>'+new Date(2000,i,1).toLocaleDateString('nl-BE',{month:'long'})+'</option>';}).join('')+'</select></label></div></div>'+
    '<div class="stats">'+metric('Omzet excl. btw',f.turnover,'Gefactureerd, met aftrek van creditnota’s')+
    metric('Kosten excl. btw',f.cost,'Geregistreerde uitgaven in deze periode')+
    metric('Resultaat vóór belastingen',f.result,'Omzet min geregistreerde kosten')+
    metric('Openstaand incl. btw',f.open,'Nog te betalen voor deze factuurperiode')+'</div>'+
    '<div class="panelbox"><h3>Potentiële omzet uit offertes · '+eur(f.potential)+' excl. btw</h3><p class="hint">Afzonderlijke offertewaarde in de geselecteerde periode. Telt pas als omzet zodra er een factuur is. Reeds gekoppelde, afgewezen, geannuleerde en als vervallen gemarkeerde offertes zijn uitgesloten.</p></div>'+
    '<p class="hint">Resultaat is een indicatie op basis van de ingevoerde gegevens. Ontbrekende kosten en boekhoudkundige correcties zijn niet verwerkt. Ontvangen bedragen worden hier op factuurmaand gegroepeerd.</p>'+
    '<div class="panelbox" style="margin-top:18px"><h3>Omzet, kosten en resultaat per maand</h3><div style="overflow-x:auto"><table><thead><tr><th>Maand</th><th>Facturen</th><th>Omzet excl.</th><th>Kosten excl.</th><th>Resultaat</th><th>Betaald incl.</th><th>Open incl.</th><th>Details</th></tr></thead><tbody>'+
    Array.from({length:12},(_,i)=>{
      const m=String(i+1).padStart(2,'0'),f=periodFigures(DATA.invoices,DATA.expenses,year,m);
      return '<tr><td>'+new Date(year,i,1).toLocaleDateString('nl-BE',{month:'long'})+'</td><td>'+f.count+'</td><td>'+eur(f.turnover)+'</td><td>'+eur(f.cost)+'</td><td>'+eur(f.result)+'</td><td>'+eur(f.paid)+'</td><td>'+eur(f.open)+'</td><td><button class="btn sm subtle" data-finance-month="'+m+'">Bekijken</button></td></tr>';
    }).join('')+'</tbody></table></div></div>'+plannedPanel();
  const bar=main().querySelector('.topbar');
  if(bar)bar.after(node);else main().prepend(node);
  node.querySelector('#finance-year').onchange=e=>{year=Number(e.target.value);renderFinance();};
  node.querySelector('#finance-month').onchange=e=>{month=e.target.value;renderFinance();};
  node.addEventListener('click',event=>{
    const m=event.target.closest('[data-finance-month]')?.dataset.financeMonth;
    if(!m)return;
    const prefix=year+'-'+m;
    const invoices=DATA.invoices.filter(i=>posted(i)&&i.date?.startsWith(prefix));
    const expenses=DATA.expenses.filter(e=>e.date?.startsWith(prefix));
    openM('Financiële details · '+prefix,'<h3>Facturen</h3>'+invTable(invoices)+
      '<h3 style="margin-top:20px">Uitgaven excl. btw</h3>'+expenses.map(e=>'<p>'+esc(e.date)+' · '+esc(e.supplier)+' · '+eur(e.amount)+'</p>').join(''),'',true);
  });
};
window.rReports=window.rStats=function(){
  main().innerHTML='<div class="topbar"><div><h2>Omzet & resultaat</h2><p class="sub">Facturen, uitgaven en planning</p></div></div>';
};
