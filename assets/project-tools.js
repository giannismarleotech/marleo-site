(function(){
'use strict';
function extract(text){
 var value=function(re){var m=text.match(re);return m?m[1].trim():null};
 var order=value(/^(?:Order|PO|Bestelling|Commande)\s*:\s*([^\n\r]+)/im);
 var customer=value(/^(?:Customer|Klant|Client)\s*:\s*([^\n\r]+)/im);
 var date=value(/^(?:Delivery|Leverdatum|Livraison)\s*:\s*(\d{4}-\d{2}-\d{2})\s*$/im);
 if(date){var d=new Date(date+'T00:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==date)date=null}
 var lines=[];
 text.split(/\r?\n/).forEach(function(line){
  var m=line.match(/^\s*(\d+(?:[.,]\d{1,3})?)\s*x\s+(.+?)\s*@\s*(?:€\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:EUR)?\s*$/i);
  if(!m)return;
  var qty=Number(m[1].replace(',','.')),price=Number(m[3].replace(',','.'));
  if(qty>0&&qty<=100000&&price<=100000000)lines.push({quantity:qty,description:m[2].trim(),unitPrice:price,total:Math.round(qty*price*100)/100});
 });
 return {order:order,customer:customer,date:date,lines:lines,total:Math.round(lines.reduce(function(s,l){return s+l.total},0)*100)/100};
}
window.MarleoDocumentDemo={extract:extract};
document.querySelectorAll('[data-document-demo]').forEach(function(root){
 var config=JSON.parse(root.dataset.config),input=root.querySelector('textarea'),output=root.querySelector('[data-extraction-result]'),sample=input.value;
 root.querySelector('[data-sample]').addEventListener('click',function(){input.value=sample;output.replaceChildren();var p=document.createElement('p');p.textContent=config.empty;output.append(p);input.focus()});
 root.querySelector('[data-extract]').addEventListener('click',function(){
  var result=extract(input.value),dl=document.createElement('dl');
  var lineText=result.lines.map(function(l){return l.quantity+' × '+l.description+' @ '+l.unitPrice.toFixed(2)+' EUR'}).join('\n');
  var values=[result.order,result.customer,result.date,lineText||config.noLines,result.lines.length?result.total.toFixed(2)+' EUR':null,config.review];
  config.fields.forEach(function(label,i){var dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=values[i]||config.missing;dl.append(dt,dd)});
  output.replaceChildren(dl);
 });
});
document.querySelectorAll('[data-project-form]').forEach(function(form){
 var ui=JSON.parse(form.dataset.config),busy=false,status=form.querySelector('[data-project-status]'),button=form.querySelector('button[type=submit]');
 form.addEventListener('submit',async function(event){
  event.preventDefault();if(busy)return;
  var get=function(name){return form.elements[name].value.trim()};
  if(!form.checkValidity()){status.textContent=ui.required;form.reportValidity();return}
  if(!get('naam')||!get('bedrijf')||!get('process')||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(get('email'))){status.textContent=ui.required;return}
  var description=['PROJECT BRIEF','Project: '+get('project'),'Existing tools: '+get('tools'),'Timing: '+get('timing'),'Budget: '+get('budget'),'Process: '+get('process')].join('\n');
  var payload={naam:get('naam'),bedrijf:get('bedrijf'),email:get('email').toLowerCase(),telefoon:get('telefoon'),bericht:description,bron:'project-intake',website_url:get('website_url')};
  var original=button.textContent;busy=true;button.disabled=true;button.textContent=ui.sending;status.textContent=ui.sending;
  try{
   var response=await fetch('https://ufzwdhbrmycjtlewstaw.supabase.co/functions/v1/aanvraag',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   var data=await response.json();if(!response.ok||!data.ok)throw Error('Request failed');
   form.reset();status.textContent=ui.success;
  }catch(e){status.textContent=ui.error}
  finally{busy=false;button.disabled=false;button.textContent=original}
 });
});
})();
