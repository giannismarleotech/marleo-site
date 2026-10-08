(function(){
var d=document,h=d.documentElement,L=h.lang||'nl',UI=window.__UI||{};
function $(s,r){return (r||d).querySelector(s)}function $$(s,r){return [].slice.call((r||d).querySelectorAll(s))}

/* oude #/pagina-links doorsturen */
var hs=location.hash.replace(/^#\/?/,'');if(hs&&/^[a-z0-9-]+$/.test(hs)&&$('a[data-slug="'+hs+'"]')){location.replace($('a[data-slug="'+hs+'"]').getAttribute('href'));return}

/* taalkeuze onthouden */
$$('.langs a').forEach(function(a){a.addEventListener('click',function(){try{localStorage.setItem('mlang',a.getAttribute('hreflang'))}catch(e){}})});
try{localStorage.setItem('mlang',L)}catch(e){}
/* subpagina's (afspraak, privacy...) in dezelfde taal openen */
$$('a[href^="/afspraak"],a[href^="/privacy"],a[href^="/voorwaarden"],a[href^="/nis2"]').forEach(function(a){var u=a.getAttribute('href');if(u.indexOf('lang=')<0)a.setAttribute('href',u+(u.indexOf('?')<0?'?':'&')+'lang='+L)});

/* header + voortgangsbalk */
var hdr=$('.hdr'),pg=$('.prog'),tick=false;
function onScroll(){tick=false;var y=window.scrollY||0;if(hdr)hdr.classList.toggle('sc',y>8);if(pg){var m=h.scrollHeight-innerHeight;pg.style.transform='scaleX('+(m>0?Math.min(1,y/m):0)+')'}}
addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(onScroll)}},{passive:true});onScroll();

/* dropdowns (klik/touch) */
$$('.dd>button').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();var p=b.parentNode,o=!p.classList.contains('open');$$('.dd.open').forEach(function(x){x.classList.remove('open')});p.classList.toggle('open',o);b.setAttribute('aria-expanded',o)})});
d.addEventListener('click',function(){$$('.dd.open').forEach(function(x){x.classList.remove('open')})});
d.addEventListener('keydown',function(e){if(e.key==='Escape'){$$('.dd.open').forEach(function(x){x.classList.remove('open')});closeSheet()}});

/* mobiel menu */
var sh=$('.sheet');
function openSheet(){if(!sh)return;sh.classList.add('open');sh.setAttribute('aria-hidden','false');h.style.overflow='hidden';var x=$('.x',sh);x&&x.focus()}
function closeSheet(){if(!sh||!sh.classList.contains('open'))return;sh.classList.remove('open');sh.setAttribute('aria-hidden','true');h.style.overflow=''}
$$('.burger').forEach(function(b){b.addEventListener('click',openSheet)});
$$('.sheet .x, .sheet a').forEach(function(b){b.addEventListener('click',closeSheet)});

/* reveal bij scrollen */
if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
 var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.05});
 $$('.rv').forEach(function(el){io.observe(el)});
}else $$('.rv').forEach(function(el){el.classList.add('in')});

/* parallax in de hero (alleen muis) */
var orb=$('.orb');
if(orb&&matchMedia('(pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
 var tx=0,ty=0,cx=0,cy=0,run=false;
 addEventListener('pointermove',function(e){tx=(e.clientX/innerWidth-.5);ty=(e.clientY/innerHeight-.5);if(!run){run=true;requestAnimationFrame(loop)}},{passive:true});
 function loop(){cx+=(tx-cx)*.08;cy+=(ty-cy)*.08;orb.style.transform='rotateY('+(cx*14)+'deg) rotateX('+(-cy*10)+'deg)';$$('[data-depth]').forEach(function(el){var k=+el.getAttribute('data-depth');el.style.transform='translate3d('+(-cx*k)+'px,'+(-cy*k*.6)+'px,0)'});if(Math.abs(tx-cx)>.001||Math.abs(ty-cy)>.001)requestAnimationFrame(loop);else run=false}
}

/* contactformulier -> aanvraag (+ WhatsApp-bevestiging na opt-in) */
var API='https://ufzwdhbrmycjtlewstaw.supabase.co/functions/v1/';
var f=$('#cform');
if(f)f.addEventListener('submit',async function(e){e.preventDefault();var m=$('.fmsg',f),b=$('button[type=submit]',f),g=function(n){return (f.elements[n]||{}).value||''};
 var data={naam:g('naam'),bedrijf:g('bedrijf'),email:g('email').trim().toLowerCase(),telefoon:g('telefoon'),bericht:g('bericht'),bron:'marleo.tech',website_url:g('website_url')};
 if(!data.naam.trim()||(!data.email&&!data.telefoon.trim())){m.textContent=UI.required;return}
 var o=b.textContent;b.disabled=true;b.textContent=UI.sending;
 try{var r=await fetch(API+'aanvraag',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});var j=await r.json();if(!j.ok)throw 0;
  var wa=f.elements.waopt;if(wa&&wa.checked&&data.telefoon.trim())fetch(API+'whatsapp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({optin:'lead',email:data.email,telefoon:data.telefoon})}).catch(function(){});
  f.reset();m.textContent=UI.sent}catch(x){m.textContent=UI.err}
 b.disabled=false;b.textContent=o});

/* domeincheck */
var df=$('#domform');
if(df)df.addEventListener('submit',async function(e){e.preventDefault();var out=$('#domres'),inp=df.elements.q,b=$('button',df),U=UI.dom||{};
 var raw=(inp.value||'').trim().toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/.*$/,'');
 if(!raw||!/^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)*$/.test(raw)){out.innerHTML='<p class="muted">'+U.invalid+'</p>';return}
 var names=raw.indexOf('.')>=0?[raw]:['be','nl','com','eu'].map(function(t){return raw+'.'+t});
 b.disabled=true;b.textContent=U.checking;out.innerHTML=names.map(function(n){return '<div><b>'+n+'</b><em>'+U.st.checking+'</em></div>'}).join('');
 var res=await Promise.all(names.map(async function(n){try{var r=await fetch('https://dns.google/resolve?name='+encodeURIComponent(n)+'&type=NS'),j=await r.json();if(j.Status===3)return[n,'free'];if(j.Status===0&&j.Answer)return[n,'taken'];var r2=await fetch('https://dns.google/resolve?name='+encodeURIComponent(n)+'&type=A'),j2=await r2.json();if(j2.Status===3)return[n,'free'];return[n,j2.Answer?'taken':'unknown']}catch(x){return[n,'error']}}));
 var col={free:'#22c27a',taken:'#ff2a86'};
 out.innerHTML=res.map(function(r){return '<div class="'+(r[1]==='free'?'free':'')+'"><b>'+r[0]+'</b><em style="color:'+(col[r[1]]||'#8f8b93')+'">'+U.st[r[1]]+'</em></div>'}).join('')+(res.some(function(r){return r[1]==='free'})?'<a class="btn btn-p" href="'+U.ctaHref+'">'+U.cta+'</a>':'');
 b.disabled=false;b.textContent=U.button});
})();
