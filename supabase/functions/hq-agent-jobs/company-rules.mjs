/* Conservative source checks, without generative AI or inferred buying intent. */
const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const decode=s=>String(s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&nbsp;/g,' ');
const plain=s=>decode(String(s||'').replace(/<(script|style|noscript|svg|nav|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
const host=u=>{try{return new URL(u).hostname.replace(/^www\./,'')}catch{return ''}};
export function companyMetadata(html,url){
 const domain=host(url),title=plain(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'');
 const metas=[...html.matchAll(/<meta\b[^>]+>/gi)];
 const meta=key=>{for(const m of metas){const attrs=Object.fromEntries([...m[0].matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(x=>[x[1].toLowerCase(),decode(x[2])]));if((attrs.property||attrs.name)?.toLowerCase()===key)return attrs.content||''}return ''};
 const nodes=[];function visit(x){if(Array.isArray(x))return x.forEach(visit);if(x&&typeof x==='object'){nodes.push(x);if(x['@graph'])visit(x['@graph']);}}
 for(const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{visit(JSON.parse(m[1]))}catch{}}
 const types=x=>[].concat(x?.['@type']||[]).join(' ');
 const article=/article|news|blog/i.test(meta('og:type'))||nodes.some(x=>/NewsArticle|BlogPosting/.test(types(x)));
 const org=nodes.find(x=>/Organization|LocalBusiness|Corporation|Business|Store|Contractor|Manufacturer|Restaurant/.test(types(x))&&!/Government|Educational|NGO|NewsMedia/.test(types(x))&&x.name&&host(x.url||x['@id'])===domain);
 const address=org?.address;const addressText=typeof address==='string'?address:[address?.streetAddress,address?.postalCode,address?.addressLocality,address?.addressRegion,typeof address?.addressCountry==='string'?address.addressCountry:address?.addressCountry?.name].filter(Boolean).join(', ');
 const candidates=[org?.name,meta('og:site_name'),...title.split(/\s[|–—-]\s|\s\|\s/)];
 const stem=norm(domain.split('.')[0]);
 const name=candidates.find(n=>n&&n.length>=2&&n.length<=100&&(n===org?.name||(' '+norm(n)+' ').includes(' '+stem+' ')||stem.length>=4&&norm(n).replace(/ /g,'')===stem))||'';
 const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||html;
 const activity=(plain(org?.description||meta('description'))+' '+plain(main)).split(/latest news|laatste nieuws|recent nieuws|onze klanten|our customers|customer stories|case studies|nieuwsberichten/i)[0].slice(0,7000);
 const contactForm=[...html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)].some(m=>{if(!/<input\b[^>]*(?:type=["']email["']|name=["'](?:email|email_from)["'])/i.test(m[2]))return false;try{return new URL(m[1].match(/action=["']([^"']*)["']/i)?.[1]||url,url).origin===new URL(url).origin}catch{return false}});
 return {name,title,address:addressText,telephone:String(org?.telephone||org?.contactPoint?.telephone||''),email:String(org?.email||org?.contactPoint?.email||''),contactForm,organization:!!org,article,activity,readVersion:2};
}
export function regionAliases(region){return String(region||'').split(/[,;]|\s+(?:en|of|or)\s+/i).map(norm).map(s=>s.replace(/^(rond|regio|omgeving|in de buurt van|in) /,'')).filter(s=>s.length>=3).flatMap(s=>/^(brussel|brussels|bruxelles)$/.test(s)?['brussel','brussels','bruxelles']:/^(gent|ghent)$/.test(s)?['gent','ghent']:/^(belgie|belgium|belgique)$/.test(s)?['belgie','belgium','belgique']:[s]);}
const inRegion=(text,region)=>regionAliases(region).some(s=>(' '+norm(text)+' ').includes(' '+s+' '));
export function sectorPattern(sector){const s=norm(sector);if(/machinebouw|machine builder|mechanical engineering/.test(s))return /machinebouw\w*|machine builders?|mechanical engineering|construction de machines|fabrication de machines|custom[\w\s-]{0,30}machines|machines op maat|cnc[\w\s-]{0,12}machines/i;if(/metaal|metal/.test(s))return /metaal\w*|metal\w*|steel fabrication|staal\w*|lassen|welding/i;if(/productie|manufactur|fabriek|fabrikant|industrie/.test(s))return /productie\w*|manufactur\w*|fabriek\w*|fabrikant\w*|fabrication|produi(?:t|sons|re)|we produc\w*/i;if(/bouw|construct/.test(s))return /bouwbedrijf|aannemer\w*|construction|renovatie\w*|renovation\w*/i;if(/logistiek|logistic|transport/.test(s))return /logistiek\w*|logistics|transport\w*|warehous\w*/i;const words=s.split(' ').filter(w=>w.length>=4&&!['bedrijven','bedrijf','sector'].includes(w));return words.length?new RegExp('\\b(?:'+words.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')\\w*','i'):null;}
function activityEvidence(text,sector){const pattern=sectorPattern(sector),match=pattern&&text.match(pattern);if(!match)return '';const at=match.index;return text.slice(Math.max(0,at-70),Math.min(text.length,at+match[0].length+130)).trim();}
function addressEvidence(s,region){
 for(const e of s.evidence||[]){if(e.identity?.address&&inRegion(e.identity.address,region))return {text:e.identity.address,url:e.url};}
 // An address must contain a postal code and occur on the official home/contact page.
 // A city mentioned in an article, testimonial or project is insufficient.
 for(const e of s.evidence||[]){const u=new URL(e.url);if(!/^\/(?:[a-z]{2}\/?)?(?:contact(?:eer-ons)?\/?|about\/?|over-ons\/?)?$/i.test(u.pathname))continue;for(const m of e.text.matchAll(/\b\d{4,5}\s+[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ ,'-]{1,75}/g)){if(inRegion(m[0],region))return {text:e.text.slice(Math.max(0,m.index-70),m.index+m[0].length+40),url:e.url};}}
 return null;
}
export function selectCompanies(sources,criteria,isCompanySource){
 const results=[],rejected=[],seen=new Set();
 for(const s of sources){let reason='';const id=s.identity||s.evidence?.[0]?.identity;const all=(s.evidence||[]).map(e=>e.text).join(' ');
  if(!s.pageRead)reason='Bedrijfswebsite kon niet worden gelezen.';
  else if(!isCompanySource(s)||id?.article||/\b(vereniging|federatie|bedrijvengids|brancheorganisatie|association|chamber of commerce|members directory)\b/i.test((id?.activity||'').slice(0,2000)))reason='Artikel, gids, vereniging of andere ongeschikte bron.';
  else if(!id?.name)reason='Geen voldoende duidelijke eigen bedrijfsidentiteit op de website.';
  const activity=activityEvidence(id?.activity||'',criteria.sector),address=addressEvidence(s,criteria.region);
  if(!reason&&!activity)reason='Gevraagde activiteit niet bevestigd op de eigen bedrijfspagina.';
  if(!reason&&!address)reason='Geen eigen vestigingsadres in de gevraagde regio aangetroffen.';
  const domain=s.domain||host(s.url),ownEmail=new RegExp('[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\\.)*'+domain.replace(/\./g,'\\.')+'\\b','i').test(all);
  const contactPage=(s.evidence||[]).find(e=>e.identity?.contactForm&&/contact/i.test(new URL(e.url).pathname));
  if(!reason&&!ownEmail&&!id.telephone&&!contactPage)reason='Geen eigen zakelijk contactgegeven bevestigd.';
  if(!reason&&/CRM software|AI solutions|IT services|IT consultancy|webdesign|software development/i.test((id.activity||'').slice(0,1600)))reason='Aanbieder van vergelijkbare IT-diensten; geen passende eindklant.';
  if(reason){rejected.push({domain,reason});continue;}if(seen.has(domain))continue;seen.add(domain);
  results.push({...s,title:id.name,name:id.name,status:'company_candidate',excerpt:activity,fitReason:'Eigen bedrijfspagina vermeldt '+criteria.sector+'; een eigen vestigingsadres past bij '+criteria.region+'.',activityQuote:activity,activitySource:s.url,regionQuote:address.text,regionSource:address.url,opportunity:'Nog te onderzoeken: '+(criteria.need||'welk administratief of operationeel proces tijd kost')+'. Geen bevestigde behoefte of koopintentie.',questions:['Hoe wordt dit proces vandaag opgevolgd?','Waar ontstaan handwerk, fouten of vertragingen?'],contactUrl:contactPage?.url||'',selectionMethod:'website-evidence-rules',verification:'Bedrijfswebsite gecontroleerd; geen registercontrole of bevestigde interesse.'});
 }
 return {results:results.slice(0,Math.min(4,criteria.limit||4)),rejected,selectionMethod:'website-evidence-rules',model:null,summary:'Selectie op eigen bedrijfsidentiteit, activiteit, vestigingsadres en contactgegeven. Geen AI-aanvraag nodig.'};
}
