import {sourceUrl,normalizeSources} from '../hq-agent-run/agents-core.mjs';
// Public pages only. The injected reader enforces DNS, redirect and size restrictions.
export async function researchCompany(record,{search,reader,progress=async()=>{},stopped=async()=>false}){
 const website=sourceUrl(record.website),host=new URL(website).hostname.replace(/^www\./,'');
 const own=url=>{try{return new URL(url).hostname.replace(/^www\./,'')===host;}catch{return false;}};
 const sources=[],failures=[];let found={results:[],credits:0,warnings:0};
 await progress('Internet en openbare LinkedIn-vermeldingen zoeken');
 try{found=await search.research(record);}catch(error){failures.push('Zoeken niet beschikbaar: '+String(error.message).slice(0,160));}
 if(await stopped())throw Object.assign(Error('Gestopt door jou.'),{code:'JOB_STOPPED'});
 await progress('Bedrijfswebsite, diensten en projecten lezen');
 let home;try{home=await reader(website);if(!own(home.url))throw Error('Website verwijst naar een ander bedrijf/domein.');}catch{home=null;failures.push('De opgegeven bedrijfswebsite kon niet worden gelezen.');}
 const put=(url,text,method)=>{if(!text?.trim()||sources.some(s=>s.url===url))return;sources.push({id:'research-'+sources.length,url,text:text.slice(0,6000),method,retrievedAt:new Date().toISOString()});};
 if(home)put(home.url,home.text,'fetch');
 const links=[...new Set([...(home?.links||[]),...found.results.filter(r=>own(r.url)).map(r=>r.url)])].filter(u=>u!==home?.url&&own(u)).slice(0,4);
 await Promise.all(links.map(async url=>{if(await stopped())return;try{const page=await reader(url);if(own(page.url))put(page.url,page.text,'fetch');}catch{failures.push('Pagina niet leesbaar: '+url);}}));
 // Search excerpts are never represented as fully read or identity-confirmed pages.
 for(const result of found.results.filter(r=>!own(r.url)).slice(0,3))put(result.url,'ONBEVESTIGD ZOEKFRAGMENT. Controleer of dit over hetzelfde bedrijf gaat. '+result.title+' — '+result.excerpt,'search');
 const merged=new Map((record.sources||[]).map(s=>[s.url,s]));for(const s of sources)merged.set(s.url,s);
 return {sources:normalizeSources([...merged.values()].slice(-8)),credits:found.credits,warnings:[...failures,...(found.warnings?['Een of meer zoekopdrachten zijn mislukt; onderzoek is onvolledig.']:[])],readPages:sources.filter(s=>s.method==='fetch').length,searchedAt:new Date().toISOString()};
}
