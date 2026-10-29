(function(){'use strict';document.querySelectorAll('[data-system-showcase]').forEach(function(root){
var tabs=Array.from(root.querySelectorAll('[role=tab]')),panels=Array.from(root.querySelectorAll('[role=tabpanel]'));
function select(index,focus){tabs.forEach(function(tab,i){tab.setAttribute('aria-selected',String(index===i));tab.tabIndex=index===i?0:-1;panels[i].hidden=index!==i});if(focus)tabs[index].focus()}
tabs.forEach(function(tab,i){tab.addEventListener('click',function(){select(i,false)});tab.addEventListener('keydown',function(event){var index=i;if(event.key==='ArrowRight')index=(i+1)%tabs.length;else if(event.key==='ArrowLeft')index=(i+tabs.length-1)%tabs.length;else if(event.key==='Home')index=0;else if(event.key==='End')index=tabs.length-1;else return;event.preventDefault();select(index,true)})});
})})();
