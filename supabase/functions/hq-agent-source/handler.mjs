const OWNER='77f6201e-8836-46b8-9c7a-0c118c4db61e';
export function publicAddress(ip){
 if(ip.includes(':')){const x=ip.toLowerCase();return /^2[0-9a-f]{3}:/.test(x)&&!x.startsWith('2001:db8:')&&!x.startsWith('2001:0:')&&!x.startsWith('2002:');}
 const p=ip.split('.').map(Number);if(p.length!==4||p.some(n=>!Number.isInteger(n)||n<0||n>255))return false;
 const [a,b]=p;return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&(b===168||b===0||b===2)||a===100&&b>=64&&b<=127||a===198&&(b===18||b===19||b===51)||a===203&&b===0);
}
export function validateUrl(raw){let u;try{u=new URL(raw);}catch{throw Error('Gebruik een volledige https:// bron-URL.');}const h=u.hostname.toLowerCase();if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443'||!h.includes('.')||h.includes(':')||/^\d+(\.\d+)*$/.test(h)||/(^|\.)(localhost|local|internal|test|invalid)$/.test(h))throw Error('Gebruik een publiek bereikbare https:// bedrijfswebsite.');u.hash='';return u;}
export function plainText(html){return html.replace(/<(script|style|noscript|svg|nav|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<!--[\s\S]*?-->/g,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/\s+/g,' ').trim().slice(0,6000);}
export function makeHandler({db,resolve,fetcher=fetch,clock=()=>Date.now()}){const hits=new Map();return async req=>{
 const origin=req.headers.get('origin'),allowed=['https://marleo.tech','https://www.marleo.tech'];const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':allowed.includes(origin)?origin:allowed[0],'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};const reply=(body,status=200)=>Response.json(body,{status,headers});
 if(origin&&!allowed.includes(origin))return reply({error:'Niet toegestaan.'},403);if(req.method==='OPTIONS')return new Response(null,{status:204,headers});if(req.method!=='POST')return reply({error:'Gebruik POST.'},405);
 try{
 const {data,error}=await db.auth.getUser((req.headers.get('authorization')||'').replace(/^Bearer /i,''));if(error||data?.user?.id!==OWNER)return reply({error:'Alleen de Marleo-beheerder kan bronnen ophalen.'},401);
 const minute=Math.floor(clock()/60000),count=hits.get(minute)||0;if(count>=15)return reply({error:'Je hebt veel bronnen opgehaald. Probeer over een minuut opnieuw.'},429);hits.clear();hits.set(minute,count+1);
 const raw=await req.text();if(raw.length>4000)return reply({error:'Aanvraag te groot.'},413);const body=JSON.parse(raw);if(typeof body.url!=='string'||body.url.length>2000)return reply({error:'Ongeldige bron-URL.'},400);
 let u=validateUrl(body.url);for(let attempt=0;attempt<4;attempt++){
  const addresses=await resolve(u.hostname);if(!addresses.length||addresses.some(ip=>!publicAddress(ip)))throw Error('Deze bron kan niet veilig worden opgehaald. Plak de openbare tekst handmatig.');
  const response=await fetcher(u.href,{redirect:'manual',signal:AbortSignal.timeout(10000),headers:{'User-Agent':'Marleo-SourceReader/1.0','Accept':'text/html,text/plain'}});
  if([301,302,303,307,308].includes(response.status)){const location=response.headers.get('location');response.body?.cancel();if(!location)throw Error('De website geeft een ongeldige doorverwijzing.');u=validateUrl(new URL(location,u).href);continue;}
  if(!response.ok)throw Error('De website kon niet worden gelezen ('+response.status+'). Plak de openbare tekst handmatig.');
  const type=response.headers.get('content-type')||'';if(!/text\/(html|plain)|application\/xhtml\+xml/i.test(type))throw Error('Gebruik een gewone webpagina met tekst.');
  const reader=response.body.getReader(),chunks=[];let size=0;for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>350000){await reader.cancel();throw Error('Deze pagina is te groot. Plak het relevante tekstdeel handmatig.');}chunks.push(value);}
  const all=new Uint8Array(size);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length;}const text=plainText(new TextDecoder().decode(all));if(text.length<80)throw Error('Deze pagina bevat te weinig leesbare tekst. Plak de relevante tekst handmatig.');
  return reply({ok:true,url:u.href,text,retrievedAt:new Date(clock()).toISOString(),method:'fetch'});
 }
 throw Error('Te veel doorverwijzingen. Plak de openbare tekst handmatig.');
 }catch(error){return reply({error:error.message||'Bron tijdelijk niet beschikbaar.'},400);}
};}
