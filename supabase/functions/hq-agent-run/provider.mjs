// Both choices expose standard text generation on Google's Free tier (checked 2026-11-23).
// No billing activation, paid-only model, search grounding, priority tier or external tools.
export const DEFAULT_MODEL='gemini-3.8-flash';
export const FALLBACK_MODEL='gemini-3.5-flash-lite';
const ALLOWED_MODELS=new Set([DEFAULT_MODEL,FALLBACK_MODEL,'gemini-3.1-flash-lite']);
export class AgentError extends Error{constructor(message,status=400,code='AGENT_ERROR'){super(message);this.status=status;this.code=code;}}
function providerError(status,reason='',detail=''){if(status===503&&/high demand|overload|capacity/i.test(detail))return new AgentError('Google meldt drukte bij dit AI-model. Je sleutel is bereikbaar, maar deze uitvoering kon niet starten. Probeer de opdracht later opnieuw; er wordt niets betaald bijgeboekt.',503,'MODEL_BUSY');if(status===400&&!reason.includes('API_KEY'))return new AgentError('Gemini weigert de uitvoering (HTTP 400): '+(detail||reason||'ongeldige modelaanvraag')+'. De sleutel kan wel bereikbaar zijn.',502,'PROVIDER_REQUEST');if(status===402)return new AgentError('Google meldt onvoldoende beschikbaar tegoed of quotum (402 RESOURCE_EXHAUSTED). Controleer het Free Tier-project en de limieten in Google AI Studio. Activeer geen betaalde billing om dit automatisch op te lossen.',503,'PROJECT_QUOTA');if(status===400&&reason.includes('API_KEY'))return new AgentError('De Gemini-sleutel is ongeldig. Kopieer de volledige sleutel opnieuw naar GEMINI_API_KEY, zonder spaties of aanhalingstekens.',503,reason);if(status===429)return new AgentError('De gratis Gemini-limiet is bereikt. Probeer later opnieuw; er wordt niet naar een ander model overgeschakeld.',429,'QUOTA');if(status===401||status===403)return new AgentError('Gemini weigert de sleutel. Controleer GEMINI_API_KEY en de projectrechten in Google AI Studio.',503,'KEY_ACCESS');if(status===404)return new AgentError('Dit Gemini-model is niet beschikbaar voor je project. Controleer de cloudinstellingen.',503,'MODEL_UNAVAILABLE');return new AgentError('Gemini kon de uitvoering niet verwerken (HTTP '+status+'). '+(detail||'Probeer later opnieuw.'),503,'PROVIDER_HTTP_'+status+(reason?'_'+reason:''));}
export function createProvider({key,model=DEFAULT_MODEL,fetcher=fetch,clock=()=>Date.now(),sleep=ms=>new Promise(r=>setTimeout(r,ms)),random=Math.random}){
 let checkedAt=0,preferred=model,recoveryUntil=0;
 const validate=()=>{if(!key?.trim())throw new AgentError('Voeg GEMINI_API_KEY toe bij de Secrets van het Marleo HQ-project in Supabase.',503,'KEY_MISSING');if(!ALLOWED_MODELS.has(model))throw new AgentError('Het ingestelde model is niet toegestaan. Alleen modellen met een gratis tekstlaag zijn toegelaten.',503,'MODEL_CONFIG');};
 const request=async(url,options={})=>{
  validate();let response;
  try{response=await fetcher(url,{...options,headers:{'Content-Type':'application/json','x-goog-api-key':key},signal:AbortSignal.timeout(25000)});}catch{throw new AgentError('De verbinding met Gemini duurde te lang.',504,'PROVIDER_TIMEOUT');}
  if(!response.ok){let reason='',detail='';try{const e=await response.json();detail=String(e.error?.message||'').replaceAll(key,'[sleutel verborgen]').replace(/AIza[A-Za-z0-9_-]{20,}/g,'[sleutel verborgen]').slice(0,500);reason=String(e.error?.details?.find(d=>d.reason)?.reason||e.error?.status||'').replace(/[^A-Z_0-9]/g,'').slice(0,80);}catch{}throw providerError(response.status,reason,detail);}
  try{return await response.json();}catch{throw new AgentError('Gemini gaf een onleesbaar antwoord.',502,'PROVIDER_RESPONSE');}
 };
 return {model,async inspect(){validate();if(clock()-checkedAt>300000||!checkedAt){const data=await request('https://generativelanguage.googleapis.com/v1beta/models/'+model);if(data.name!=='models/'+model||!data.supportedGenerationMethods?.includes('generateContent'))throw new AgentError('Dit model ondersteunt geen tekstconcepten voor je project.',503,'MODEL_UNAVAILABLE');checkedAt=clock();}return {configured:true,model,generationTested:false};},async generate(messages,{json=false,maxOutputTokens=2048,onRecovery}={}){
  validate();const first=clock()<recoveryUntil?preferred:model;const models=[first,first===DEFAULT_MODEL?FALLBACK_MODEL:DEFAULT_MODEL];const attempts=[];
  for(let i=0;i<models.length;i++){
   const selected=models[i];
   try{
    const config={maxOutputTokens:Math.max(32,Math.min(4096,maxOutputTokens)),...(json?{responseMimeType:'application/json'}:{})};
    if(selected===DEFAULT_MODEL)config.thinkingConfig={thinkingLevel:'low'};
    else Object.assign(config,{temperature:0.2,candidateCount:1});
    const data=await request('https://generativelanguage.googleapis.com/v1beta/models/'+selected+':generateContent',{method:'POST',body:JSON.stringify({systemInstruction:{parts:[{text:messages[0].content}]},contents:[{role:'user',parts:[{text:messages[1].content}]}],generationConfig:config})});
    const candidate=data.candidates?.[0];if(candidate?.finishReason!=='STOP')throw new AgentError(candidate?.finishReason==='MAX_TOKENS'?'Het concept kon niet volledig worden afgerond. Gebruik kortere bronnen en probeer opnieuw.':'Gemini kon geen volledig concept maken. Pas de broninformatie aan en probeer opnieuw.',502,'INCOMPLETE_OUTPUT');
    const text=candidate.content?.parts?.filter(p=>!p.thought&&typeof p.text==='string').map(p=>p.text).join('').trim();if(!text)throw new AgentError('Gemini gaf geen bruikbaar concept.',502,'EMPTY_OUTPUT');
    if(selected!==model){preferred=selected;recoveryUntil=clock()+300000;}
    return {text:text.slice(0,10000),model:selected,recovered:i>0,attempts:[...attempts,{model:selected,status:'completed'}],usage:{input:Number(data.usageMetadata?.promptTokenCount)||0,output:Number(data.usageMetadata?.candidatesTokenCount)||0}};
   }catch(error){
    attempts.push({model:selected,code:error.code||'PROVIDER_ERROR'});
    // Never evade key, billing, quota, payload or safety failures by trying other models.
    const transient=error.code==='MODEL_BUSY'||error.code==='PROVIDER_TIMEOUT'||error.code?.startsWith('PROVIDER_HTTP_503');
    if(i||!transient){error.attempts=attempts;if(i&&transient)error.message='Beide toegelaten AI-modellen konden nu geen antwoord leveren (drukte of timeout). Je opdracht blijft bewaard; er volgen geen verdere automatische pogingen.';throw error;}
    const delayMs=2000+Math.floor(random()*500);
    if(onRecovery)await onRecovery({from:selected,to:models[1],reason:error.code,delayMs});
    await sleep(delayMs);
   }
  }
 }};
}
