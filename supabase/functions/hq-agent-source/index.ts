import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2.108.2";
import {makeHandler} from './handler.mjs';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!);
const resolve=async(host:string)=>{const results=await Promise.allSettled([Deno.resolveDns(host,'A'),Deno.resolveDns(host,'AAAA')]);return results.flatMap(r=>r.status==='fulfilled'?r.value:[]);};
Deno.serve(makeHandler({db,resolve}));
