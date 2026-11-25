-- Deterministic HQ operations: no outbound messages, no model/search credits.
create table if not exists public.hq_operations (
 user_id uuid primary key references auth.users(id),
 enabled boolean not null default true,
 report jsonb not null default '{}'::jsonb,
 checked_at timestamptz,
 next_run timestamptz not null default now(),
 source_updated_at timestamptz
);
alter table public.hq_operations enable row level security;
revoke all on public.hq_operations from anon;
grant select,insert,update on public.hq_operations to authenticated;
grant all on public.hq_operations to service_role;
create policy hq_operations_owner on public.hq_operations for all to authenticated
using (user_id=(select auth.uid()) and user_id='77f6201e-8836-46b8-9c7a-0c118c4db61e')
with check (user_id=(select auth.uid()) and user_id='77f6201e-8836-46b8-9c7a-0c118c4db61e');

create or replace function public.hq_operations_analyze(snapshot jsonb, day_key text)
returns jsonb language plpgsql immutable security invoker set search_path='' as $$
declare sales jsonb; projects jsonb; tasks jsonb; due_count integer; missing_count integer;
begin
 select coalesce(jsonb_agg(item order by priority,due,id),'[]'::jsonb) into sales from (
 select d->>'id' id, coalesce(nullif(d->>'follow',''),'9999') due,
 case when coalesce(d->>'follow','')<>'' and d->>'follow'<=day_key then 0 else 1 end priority,
 jsonb_build_object('id',d->>'id','title',coalesce(nullif(d->>'naam',''),'Naam ontbreekt'),
 'reason',case when coalesce(d->>'follow','')='' then 'Geen opvolgdatum vastgelegd' else 'Opvolging gepland op '||(d->>'follow') end,
 'due',d->>'follow','emailAvailable',coalesce(d->>'email','') ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$',
 'action',case when coalesce(d->>'follow','')='' then 'Leg een volgende stap en datum vast' else 'Controleer de laatste reactie en bereid opvolging voor' end) item
 from jsonb_array_elements(case when jsonb_typeof(snapshot->'deals')='array' then snapshot->'deals' else '[]'::jsonb end) d
 where coalesce(d->>'id','')<>'' and coalesce(d->>'stage','') not in ('gewonnen','verloren')
 and (coalesce(d->>'follow','')='' or d->>'follow'<=day_key)
 ) s;
 select coalesce(jsonb_agg(item order by priority,due,id),'[]'::jsonb) into projects from (
 select p->>'id' id,coalesce(nullif(p->>'nextDate',''),'9999') due,
 case when coalesce(p->>'nextDate','')<>'' and p->>'nextDate'<=day_key then 0 else 1 end priority,
 jsonb_build_object('id',p->>'id','title',coalesce(p->>'company','')||' · '||coalesce(p->>'title','Project'),
 'due',p->>'nextDate','reason',case when coalesce(p->>'nextAction','')='' then 'Volgende actie ontbreekt' when coalesce(p->>'nextDate','')='' then 'Opvolgdatum ontbreekt' else 'Opvolgdatum bereikt: '||(p->>'nextDate') end,
 'action',coalesce(nullif(p->>'nextAction',''),'Bepaal de volgende projectstap')) item
 from jsonb_array_elements(case when jsonb_typeof(snapshot->'enterpriseProjects')='array' then snapshot->'enterpriseProjects' else '[]'::jsonb end) p
 where coalesce(p->>'id','')<>'' and coalesce(p->>'phase','')<>'Afgesloten'
 and (coalesce(p->>'nextAction','')='' or coalesce(p->>'nextDate','')='' or p->>'nextDate'<=day_key)
 ) s;
 select coalesce(jsonb_agg(item order by due,id),'[]'::jsonb) into tasks from (
 select t->>'id' id,t->>'due' due,jsonb_build_object('id',t->>'id','title',coalesce(t->>'title','Taak'),'due',t->>'due','action','Werk de taak af of pas de planning aan') item
 from jsonb_array_elements(case when jsonb_typeof(snapshot->'tasks')='array' then snapshot->'tasks' else '[]'::jsonb end) t
 where coalesce(t->>'id','')<>'' and coalesce(t->>'done','false')<>'true' and coalesce(t->>'status','')<>'klaar'
 and coalesce(t->>'due','')<>'' and t->>'due'<=day_key
 ) s;
 select count(*) into missing_count from jsonb_array_elements(sales) s where coalesce(s->>'due','')='';
 return jsonb_build_object('date',day_key,'sales',sales,'projects',projects,'tasks',tasks,
 'counts',jsonb_build_object('sales',jsonb_array_length(sales),'projects',jsonb_array_length(projects),'tasks',jsonb_array_length(tasks),'missingFollowDate',missing_count),
 'projectRecords',case when jsonb_typeof(snapshot->'enterpriseProjects')='array' then jsonb_array_length(snapshot->'enterpriseProjects') else 0 end,
 'method','Vaste controles op opgeslagen HQ-gegevens; geen AI-modelaanvraag.');
end $$;
revoke all on function public.hq_operations_analyze(jsonb,text) from public,anon;
grant execute on function public.hq_operations_analyze(jsonb,text) to authenticated,service_role;

create or replace function public.hq_operations_run() returns jsonb language plpgsql security invoker set search_path='' as $$
declare owner_id uuid:='77f6201e-8836-46b8-9c7a-0c118c4db61e'; snapshot jsonb; newest timestamptz; report_value jsonb; config public.hq_operations;
begin
 if current_user not in ('postgres','service_role') and auth.uid() is distinct from owner_id then raise exception 'Niet toegestaan' using errcode='42501'; end if;
 select * into config from public.hq_operations where user_id=owner_id for update;
 if not found then raise exception 'Bedrijfscontrole niet ingesteld'; end if;
 if not config.enabled then return jsonb_build_object('paused',true); end if;
 -- Debounce manual clicks; cron never loops or uses external credits.
 if config.checked_at>now()-interval '1 minute' then return jsonb_build_object('cached',true); end if;
 select coalesce(jsonb_object_agg(collection,data),'{}'::jsonb),max(updated_at) into snapshot,newest
 from public.crm_state where user_id=owner_id and collection in ('deals','tasks','enterpriseProjects');
 if snapshot='{}'::jsonb then raise exception 'Geen cloudgegevens beschikbaar'; end if;
 report_value:=public.hq_operations_analyze(snapshot,to_char(now() at time zone 'Europe/Brussels','YYYY-MM-DD'));
 update public.hq_operations set report=report_value,checked_at=now(),source_updated_at=newest,next_run=now()+interval '1 hour' where user_id=owner_id;
 return jsonb_build_object('ok',true,'checkedAt',now());
end $$;
revoke all on function public.hq_operations_run() from public,anon;
grant execute on function public.hq_operations_run() to authenticated,service_role;
insert into public.hq_operations(user_id) values('77f6201e-8836-46b8-9c7a-0c118c4db61e') on conflict do nothing;
select cron.schedule('hq-operations-hourly','17 * * * *','select public.hq_operations_run();');
