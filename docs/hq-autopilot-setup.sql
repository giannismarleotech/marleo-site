-- Cloud scheduler: only its fixed token can tick; only the verified owner can manage settings.
create table public.hq_autopilot (
 user_id uuid primary key references auth.users(id),
 enabled boolean not null default false,
 token_hash text not null,
 next_run timestamptz not null default now(),
 last_tick timestamptz,
 last_run timestamptz,
 month_key text not null default to_char(now() at time zone 'UTC','YYYY-MM'),
 attempts integer not null default 0,
 monthly_limit integer not null default 600 check(monthly_limit between 1 and 600),
 rotation integer not null default 0,
 note text not null default 'Nog niet gestart'
);
alter table public.hq_autopilot enable row level security;
revoke all on public.hq_autopilot from anon,authenticated;
grant all on public.hq_autopilot to service_role;
create function public.hq_autopilot_claim() returns setof public.hq_autopilot language plpgsql security invoker set search_path='' as $$
declare cfg public.hq_autopilot; m text:=to_char(now() at time zone 'UTC','YYYY-MM');
begin
 select * into cfg from public.hq_autopilot for update skip locked;
 if not found then return; end if;
 update public.hq_autopilot set last_tick=now() where user_id=cfg.user_id;
 if not cfg.enabled or cfg.next_run>now() then return; end if;
 if cfg.month_key<>m then cfg.attempts:=0; end if;
 if cfg.attempts>=cfg.monthly_limit then
  update public.hq_autopilot set note='Maandlimiet bereikt; geen extra zoekrondes', next_run=date_trunc('month',now() at time zone 'UTC') at time zone 'UTC'+interval '1 month' where user_id=cfg.user_id; return;
 end if;
 if exists(select 1 from public.hq_agent_jobs where user_id=cfg.user_id and status in ('queued','running')) then
  update public.hq_autopilot set note='Wacht op lopende opdracht',next_run=now()+interval '5 minutes' where user_id=cfg.user_id; return;
 end if;
 return query update public.hq_autopilot set attempts=cfg.attempts+1,month_key=m,rotation=cfg.rotation+1,last_run=now(),next_run=now()+interval '1 hour',note='Zoekronde gereserveerd' where user_id=cfg.user_id returning *;
end $$;
revoke all on function public.hq_autopilot_claim() from public,anon,authenticated;
grant execute on function public.hq_autopilot_claim() to service_role;
do $$ declare secret text:=encode(extensions.gen_random_bytes(32),'hex'); owner_id uuid;
begin
 select id into owner_id from auth.users where id='77f6201e-8836-46b8-9c7a-0c118c4db61e';
 if owner_id is null then raise exception 'HQ owner missing'; end if;
 perform vault.create_secret(secret,'hq-autopilot-tick');
 insert into public.hq_autopilot(user_id,token_hash) values(owner_id,encode(extensions.digest(secret,'sha256'),'hex'));
end $$;
select cron.schedule('hq-autopilot-tick','*/5 * * * *',$cron$
 select net.http_post(
 url:='https://ufzwdhbrmycjtlewstaw.supabase.co/functions/v1/hq-autopilot',
 headers:=jsonb_build_object('Content-Type','application/json','x-hq-schedule-token',(select decrypted_secret from vault.decrypted_secrets where name='hq-autopilot-tick')),
 body:='{"action":"tick"}'::jsonb,timeout_milliseconds:=5000);
$cron$);
