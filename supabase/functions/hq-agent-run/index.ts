import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2.108.2";
import {makeHandler} from './handler.mjs';
import {createCloudProvider} from './cloud-provider.mjs';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const provider=createCloudProvider({groqKey:Deno.env.get('GROQ_API_KEY'),geminiKey:Deno.env.get('GEMINI_API_KEY'),geminiModel:Deno.env.get('MARLEO_AGENT_MODEL')});
Deno.serve(makeHandler({db,provider}));
