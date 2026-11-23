import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "jsr:@supabase/supabase-js@2";
import {runRequestedMaintenance} from './provider.mjs';
import {makeHandler} from './handler.mjs';
const url=Deno.env.get('SUPABASE_URL')!;
const options={url,db:createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!),apiKey:Deno.env.get('RESEND_API_KEY')};
// The one-time job is requested by the deployment migration, never by request parameters.
await runRequestedMaintenance(options);
Deno.serve(makeHandler(options));
