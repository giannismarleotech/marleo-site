import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2.108.2";
import {createProvider} from '../hq-agent-run/provider.mjs';
import {createSearch} from './search.mjs';
import {makeHandler} from './handler.mjs';
const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!;
const client=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
const scoped=(token:string)=>createClient(url,anon,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false,autoRefreshToken:false}});
const search=createSearch({key:Deno.env.get('TAVILY_API_KEY')});
// Providers are constructed only for an explicitly started, owner-authorized job. No startup inference.
const providerFactory=()=>{const budget=AbortSignal.timeout(110000);return createProvider({key:Deno.env.get('GEMINI_API_KEY'),model:Deno.env.get('MARLEO_AGENT_MODEL')||undefined,fetcher:(url,options)=>fetch(url,{...options,signal:AbortSignal.any([budget,options.signal])})});};
Deno.serve(makeHandler({auth:client.auth,scoped,providerFactory,search,waitUntil:(promise:Promise<unknown>)=>EdgeRuntime.waitUntil(promise)}));
