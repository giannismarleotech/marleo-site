import {inspectProvider} from './provider.mjs';
const OWNER='77f6201e-8836-46b8-9c7a-0c118c4db61e';
export function makeHandler(options){const {db}=options;return async req=>{
 const origin=req.headers.get('origin'),allowed=['https://marleo.tech','https://www.marleo.tech'];const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':allowed.includes(origin)?origin:allowed[0],'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};const reply=(b,status=200)=>Response.json(b,{status,headers});
 if(origin&&!allowed.includes(origin))return reply({error:'Niet toegestaan.'},403);if(req.method==='OPTIONS')return new Response(null,{status:204,headers});if(req.method!=='POST')return reply({error:'Gebruik POST.'},405);
 const token=(req.headers.get('authorization')||'').replace(/^Bearer /i,'');const {data,error}=await db.auth.getUser(token);if(error||data?.user?.id!==OWNER)return reply({error:'Alleen Marleo kan deze instellingen controleren.'},401);
 try{const body=await req.json();if(body.action!=='inspect')return reply({error:'Onbekende actie.'},400);return reply({ok:true,report:await inspectProvider(options)});}catch{return reply({error:'Controle tijdelijk niet beschikbaar.'},503);}
};}
