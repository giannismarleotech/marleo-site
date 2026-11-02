import {validateAnswers} from './schema.mjs';

// Possession of the 256-bit, revocable, expiring link is this endpoint's authentication.
// Database access for the owner uses normal Supabase Auth/RLS instead.
export function makeHandler({url, key, fetcher=fetch, now=()=>new Date()}) {
  const allowed = new Set(['https://marleo.tech','https://www.marleo.tech','https://giannismarleotech.github.io']);
  return async function handle(req) {
    const origin = req.headers.get('origin');
    const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
      'Access-Control-Allow-Origin': origin && allowed.has(origin) ? origin : 'https://marleo.tech',
      'Access-Control-Allow-Headers':'content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
    const reply = (data,status=200)=>new Response(JSON.stringify(data),{status,headers});
    if (origin && !allowed.has(origin)) return reply({error:'Deze oorsprong is niet toegestaan.'},403);
    if (req.method==='OPTIONS') return new Response(null,{status:204,headers});
    if (req.method!=='POST') return reply({error:'Gebruik POST.'},405);
    if (!url || !key) return reply({error:'Het formulier is tijdelijk niet beschikbaar.'},503);
    try {
      // Bound the streamed body, including requests without a Content-Length header.
      const reader=req.body?.getReader(); let size=0; const chunks=[];
      if (!reader) return reply({error:'Lege aanvraag.'},400);
      while(true) { const {value,done}=await reader.read(); if(done)break; size+=value.length;
        if(size>160000){await reader.cancel();return reply({error:'Je antwoorden zijn te groot.'},413);} chunks.push(value); }
      const bytes=new Uint8Array(size); let offset=0; for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
      let body; try {body=JSON.parse(new TextDecoder().decode(bytes));}catch{return reply({error:'Ongeldige aanvraag.'},400);}
      if (!body || !/^[0-9a-f]{64}$/.test(body.token||'') || !['read','save','submit'].includes(body.action)) return reply({error:'Deze link is niet geldig.'},404);
      const dbHeaders={'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json'};
      const root=url+'/rest/v1/seo_questionnaires';
      const select='id,customer_name,title,status,answers,expires_at,submitted_at,updated_at';
      const lookup=await fetcher(root+'?access_token=eq.'+body.token+'&select='+select+'&limit=1',{headers:dbHeaders});
      if(!lookup.ok) return reply({error:'Ophalen mislukt. Probeer het later opnieuw.'},503);
      const rows=await lookup.json(), row=rows[0];
      if(!row || row.status==='draft' || !row.expires_at || new Date(row.expires_at)<=now()) return reply({error:'Deze link is verlopen of ingetrokken. Vraag Marleo om een nieuwe link.'},404);
      const safe=r=>({customer_name:r.customer_name,title:r.title,status:r.status,answers:r.answers,
        submitted_at:r.submitted_at,updated_at:r.updated_at});
      if(body.action==='read') return reply({ok:true,questionnaire:safe(row)});
      if(row.status==='submitted') return reply({error:'Deze vragenlijst is al verzonden. Je antwoorden zijn veilig ontvangen.'},409);
      if(typeof body.version!=='string' || body.version!==row.updated_at) return reply({error:'Dit formulier is elders gewijzigd. Kopieer je nieuwe antwoorden en herlaad daarna de pagina.'},409);
      let answers;try{answers=validateAnswers(body.answers,body.action==='submit');}catch(e){return reply({error:e.message},400);}
      const update={answers};if(body.action==='submit'){update.status='submitted';update.submitted_at=now().toISOString();}
      const query='?id=eq.'+encodeURIComponent(row.id)+'&access_token=eq.'+body.token+'&status=eq.open&updated_at=eq.'+encodeURIComponent(row.updated_at)+'&expires_at=gt.'+encodeURIComponent(now().toISOString())+'&select='+select;
      const saved=await fetcher(root+query,{method:'PATCH',headers:{...dbHeaders,'Prefer':'return=representation'},body:JSON.stringify(update)});
      if(!saved.ok)return reply({error:'Opslaan is niet gelukt. Je antwoorden blijven op het scherm; probeer opnieuw.'},503);
      const changed=await saved.json();if(!changed.length)return reply({error:'Deze link of vragenlijst is ondertussen gewijzigd. Kopieer je antwoorden en herlaad de pagina.'},409);
      return reply({ok:true,questionnaire:safe(changed[0])});
    } catch { return reply({error:'Verbinding onderbroken. Probeer opnieuw; sluit deze pagina nog niet.'},503); }
  };
}
