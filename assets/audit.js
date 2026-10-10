(function(){
var A=window.__AUD||{},API='https://ufzwdhbrmycjtlewstaw.supabase.co/functions/v1/',f=document.getElementById('audform'),res=document.getElementById('audres'),msg=document.getElementById('audmsg');if(!f)return;
var CATS=['perf','seo','sec','mob'],LAST=null;
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function grade(n){return n>=85?'g':n>=60?'w':'b'}
function ring(n,label,big){var r=big?54:34,c=2*Math.PI*r,s=big?132:84;return '<div class="ring '+grade(n)+(big?' big':'')+'" style="--c:'+c+'"><svg viewBox="0 0 '+s+' '+s+'" width="'+s+'" height="'+s+'"><circle cx="'+s/2+'" cy="'+s/2+'" r="'+r+'" class="tr"/><circle cx="'+s/2+'" cy="'+s/2+'" r="'+r+'" class="fg" stroke-dasharray="'+c+'" stroke-dashoffset="'+c+'" data-off="'+(c*(1-n/100))+'"/></svg><b data-n="'+n+'">0</b><span>'+esc(label)+'</span></div>'}
function animate(){res.querySelectorAll('.ring .fg').forEach(function(el){requestAnimationFrame(function(){el.style.strokeDashoffset=el.getAttribute('data-off')})});
 res.querySelectorAll('.ring b').forEach(function(b){var n=+b.getAttribute('data-n'),t0=performance.now();(function st(t){var k=Math.min(1,(t-t0)/900);b.textContent=Math.round(n*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(st)})(t0)})}
function progress(){var i=0;res.innerHTML='<div class="audprog"><div class="bar"><i></i></div><ol>'+A.steps.map(function(s){return '<li>'+esc(s)+'</li>'}).join('')+'</ol></div>';var li=res.querySelectorAll('.audprog li');var tm=setInterval(function(){if(i<li.length){li[i].classList.add('on');if(i)li[i-1].classList.add('ok');i++}},1600);li[0].classList.add('on');i=1;return function(){clearInterval(tm)}}
function render(d){LAST=d;var issues=d.checks.filter(function(c){return c.ok<2}).sort(function(a,b){return a.ok-b.ok||b.w-a.w});
 var h='<div class="audtop rv in"><div class="audtotal">'+ring(d.total,A.total,true)+'<div><div class="audhost">'+esc(d.host)+'</div><div class="audmeta">'+esc(d.title||'')+'</div></div></div><div class="audcats">'+CATS.map(function(c){return ring(d.scores[c],A.cats[c])}).join('')+'</div></div>';
 h+='<div class="audgrid">'+CATS.map(function(c){var list=d.checks.filter(function(x){return x.cat===c}),bad=list.filter(function(x){return x.ok<2}).sort(function(a,b){return a.ok-b.ok||b.w-a.w}),good=list.filter(function(x){return x.ok===2});
  return '<div class="audcat card rv in"><div class="audch"><h3>'+esc(A.cats[c])+'</h3><span class="sc '+grade(d.scores[c])+'">'+d.scores[c]+'</span></div>'+
   (bad.length?bad.map(function(x){var t=A.chk[x.id]||[x.id,''];return '<div class="audi '+(x.ok?'w':'b')+'"><i></i><div><b>'+esc(t[0])+'</b><span class="tag">'+(x.ok?A.warn:A.bad)+'</span><p>'+esc(t[1])+'</p></div></div>'}).join(''):'<p class="muted">'+esc(A.none)+'</p>')+
   (good.length?'<details><summary>'+esc(A.passed)+' ('+good.length+')</summary>'+good.map(function(x){return '<div class="audi g"><i></i><div><b>'+esc((A.chk[x.id]||[x.id])[0])+'</b></div></div>'}).join('')+'</details>':'')+'</div>'}).join('')+'</div>';
 h+='<div class="band audcta rv in"><div><h2>'+esc(A.ctaT)+'</h2><p>'+esc(A.ctaB)+'</p></div><div class="acts"><a class="btn btn-p" href="'+A.book+'">'+esc(A.ctaBtn)+'</a><button class="btn btn-g" type="button" id="audmailbtn">'+esc(A.ctaMail)+'</button></div></div>'+
  '<form id="audmail" class="audmail card" hidden><h3>'+esc(A.mailT)+'</h3><div class="row"><input name="naam" placeholder="'+esc(A.mailName)+'" required><input name="email" type="email" placeholder="'+esc(A.mailEmail)+'" required><input name="website_url" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px"><button class="btn btn-p" type="submit">'+esc(A.mailSend)+'</button></div><p class="fmsg" aria-live="polite"></p></form>'+
  '<p class="audnote">'+esc(A.note)+'</p>';
 res.innerHTML=h;animate();
 document.getElementById('audmailbtn').onclick=function(){var m=document.getElementById('audmail');m.hidden=false;m.querySelector('input').focus()};
 document.getElementById('audmail').onsubmit=async function(e){e.preventDefault();var fm=e.target,g=function(n){return (fm.elements[n]||{}).value||''},m=fm.querySelector('.fmsg');if(!g('naam').trim()||!/@/.test(g('email'))){m.textContent=A.errUrl;return}
  var sum='Website-audit voor '+d.host+' – totaal '+d.total+'/100 (snelheid '+d.scores.perf+', SEO '+d.scores.seo+', beveiliging '+d.scores.sec+', gsm '+d.scores.mob+').\nAandachtspunten: '+issues.slice(0,8).map(function(x){return ((A.chk[x.id]||[x.id])[0])}).join(', ')+'.';
  var b=fm.querySelector('button');b.disabled=true;try{var r=await fetch(API+'aanvraag',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({naam:g('naam'),email:g('email').trim().toLowerCase(),telefoon:'',bedrijf:d.host,bericht:sum,bron:'website-audit',website_url:g('website_url')})});var j=await r.json();if(!j.ok)throw 0;fm.innerHTML='<p class="ok">'+esc(A.mailOk)+'</p>'}catch(x){b.disabled=false;m.textContent=A.errReach}};
}
f.addEventListener('submit',async function(e){e.preventDefault();var v=(f.elements.url.value||'').trim();msg.textContent='';
 if(!/^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(v)){msg.textContent=A.errUrl;return}
 var b=f.querySelector('button'),o=b.innerHTML;b.disabled=true;b.textContent=A.busy;var stop=progress();
 try{var r=await fetch(API+'audit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:v})});var d=await r.json();stop();
  if(r.status===429||d.error==='limit'){res.innerHTML='';msg.textContent=A.errLimit}else if(!d.ok){res.innerHTML='';msg.textContent=d.error==='url'?A.errUrl:A.errReach}else{render(d);var y=res.getBoundingClientRect().top+scrollY-90;scrollTo({top:y,behavior:'smooth'});try{history.replaceState(null,'','?url='+encodeURIComponent(d.host))}catch(x){}}}
 catch(x){stop();res.innerHTML='';msg.textContent=A.errReach}
 b.disabled=false;b.innerHTML=o});
var q=new URLSearchParams(location.search).get('url');if(q){f.elements.url.value=q;f.requestSubmit?f.requestSubmit():f.dispatchEvent(new Event('submit'))}
})();
