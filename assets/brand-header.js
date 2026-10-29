(function(){
 'use strict';
 var hero=document.querySelector('.ai-brand-hero');
 if(!hero)return;
 var fine=window.matchMedia('(pointer:fine)'),reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 var tx=0,ty=0,x=0,y=0,frame=0;
 function paint(){
  frame=0;x+=(tx-x)*.1;y+=(ty-y)*.1;
  hero.style.setProperty('--brand-x',(x*4).toFixed(2)+'px');
  hero.style.setProperty('--brand-y',(y*2).toFixed(2)+'px');
  hero.style.setProperty('--tilt-x',(-y*8).toFixed(2)+'deg');
  hero.style.setProperty('--tilt-y',(x*12).toFixed(2)+'deg');
  if(Math.abs(tx-x)>.002||Math.abs(ty-y)>.002)frame=requestAnimationFrame(paint);
 }
 function reset(){tx=ty=x=y=0;if(frame)cancelAnimationFrame(frame);frame=0;['--brand-x','--brand-y','--tilt-x','--tilt-y','--mx','--my'].forEach(function(k){hero.style.removeProperty(k)})}
 hero.addEventListener('pointermove',function(e){
  if(!fine.matches||reduced.matches||e.pointerType==='touch')return;
  var rect=hero.getBoundingClientRect();
  var px=Math.min(1,Math.max(0,(e.clientX-rect.left)/rect.width)),py=Math.min(1,Math.max(0,(e.clientY-rect.top)/rect.height));
  tx=px-.5;ty=py-.5;
  hero.style.setProperty('--mx',(px*100).toFixed(1)+'%');hero.style.setProperty('--my',(py*100).toFixed(1)+'%');
  if(!frame)frame=requestAnimationFrame(paint);
 },{passive:true});
 hero.addEventListener('pointerleave',function(){tx=ty=0;if(!frame&&!reduced.matches)frame=requestAnimationFrame(paint)});
 document.addEventListener('visibilitychange',function(){if(document.hidden)reset()});
 reduced.addEventListener('change',reset);fine.addEventListener('change',reset);
})();
