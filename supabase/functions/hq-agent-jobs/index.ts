import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2.108.2";
import {createProvider} from '../hq-agent-run/provider.mjs';
import {createSearch} from './search.mjs';
import {readCompanyPage} from './qualification.mjs';
import {makeHandler} from './handler.mjs';
const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!;
const client=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
const scoped=(token:string)=>createClient(url,anon,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false,autoRefreshToken:false}});
const search=createSearch({key:Deno.env.get('TAVILY_API_KEY')});
// Providers are constructed only for an explicitly started, owner-authorized job. No startup inference.
const providerFactory=()=>{const budget=AbortSignal.timeout(125000);return createProvider({key:Deno.env.get('GEMINI_API_KEY'),model:Deno.env.get('MARLEO_AGENT_MODEL')||undefined,fetcher:(url,options)=>fetch(url,{...options,signal:AbortSignal.any([budget,options.signal])})});};
const resolve=async(host:string)=>{const results=await Promise.allSettled([Deno.resolveDns(host,'A'),Deno.resolveDns(host,'AAAA')]);return results.flatMap(r=>r.status==='fulfilled'?r.value:[]);};
const reader=(url:string)=>readCompanyPage(url,{resolve});
Deno.serve(makeHandler({auth:client.auth,scoped,providerFactory,search,reader,waitUntil:(promise:Promise<unknown>)=>EdgeRuntime.waitUntil(promise)}));
