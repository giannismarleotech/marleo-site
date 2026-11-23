begin;
alter table public.mail_queue add column if not exists last_opened_at timestamptz, add column if not exists last_clicked_at timestamptz;
create table public.hq_mail_events (
 event_id text primary key, provider_id text not null, event_type text not null,
 occurred_at timestamptz not null, received_at timestamptz not null default now(),
 link text, queue_id uuid references public.mail_queue(id) on delete set null, processed boolean not null default false,
 check(event_type in ('email.sent','email.delivered','email.opened','email.clicked','email.bounced','email.complained','email.failed','email.delivery_delayed','email.suppressed'))
);
create index hq_mail_events_provider on public.hq_mail_events(provider_id,processed);
create index hq_mail_events_queue on public.hq_mail_events(queue_id,occurred_at desc);
create index if not exists mail_queue_resend_id on public.mail_queue(resend_id) where resend_id is not null;
alter table public.hq_mail_events enable row level security;
revoke all on public.hq_mail_events from public,anon,authenticated;
grant select on public.hq_mail_events to authenticated;
grant select,insert,update on public.hq_mail_events to service_role;
create policy hq_mail_events_owner on public.hq_mail_events for select to authenticated using(auth.uid()='77f6201e-8836-46b8-9c7a-0c118c4db61e'::uuid);
create table public.hq_campaign_health(id boolean primary key default true check(id), report jsonb not null default '{}', checked_at timestamptz not null default now());
alter table public.hq_campaign_health enable row level security;
revoke all on public.hq_campaign_health from public,anon,authenticated;
grant select on public.hq_campaign_health to authenticated;
grant select,insert,update on public.hq_campaign_health to service_role;
create policy hq_campaign_health_owner on public.hq_campaign_health for select to authenticated using(auth.uid()='77f6201e-8836-46b8-9c7a-0c118c4db61e'::uuid);
-- Credentials and the one-time operator request remain inaccessible to browsers.
alter table public.mail_cfg enable row level security;
revoke all on public.mail_cfg from public,anon,authenticated;
create function public.hq_mail_reconcile(p_provider text) returns integer language plpgsql security invoker set search_path='' as $$
declare q public.mail_queue%rowtype; e public.hq_mail_events%rowtype; n integer:=0;
begin
 select * into q from public.mail_queue where resend_id=p_provider for update;
 if q.id is null then return 0;end if;
 for e in select * from public.hq_mail_events where provider_id=p_provider and not processed order by occurred_at,event_id for update loop
  update public.mail_queue set
   delivered_at=case when e.event_type='email.delivered' then least(delivered_at,e.occurred_at) else delivered_at end,
   opened_at=case when e.event_type='email.opened' then least(opened_at,e.occurred_at) else opened_at end,
   last_opened_at=case when e.event_type='email.opened' then greatest(last_opened_at,opened_at,e.occurred_at) else last_opened_at end,
   clicked_at=case when e.event_type='email.clicked' then least(clicked_at,e.occurred_at) else clicked_at end,
   last_clicked_at=case when e.event_type='email.clicked' then greatest(last_clicked_at,clicked_at,e.occurred_at) else last_clicked_at end,
   opens=coalesce(opens,0)+case when e.event_type='email.opened' then 1 else 0 end,
   clicks=coalesce(clicks,0)+case when e.event_type='email.clicked' then 1 else 0 end,
   bounced=coalesce(bounced,false) or e.event_type='email.bounced',
   complained=coalesce(complained,false) or e.event_type='email.complained',
   status=case when e.event_type in ('email.failed','email.suppressed') then 'failed' else status end,
   error=case when e.event_type in ('email.failed','email.suppressed') then e.event_type else error end
  where id=q.id;
  update public.hq_mail_events set queue_id=q.id,processed=true where event_id=e.event_id;n:=n+1;
  if e.event_type in ('email.bounced','email.complained') then
   insert into public.mail_unsub(email,source) values(lower(trim(q.to_email)),case when e.event_type='email.bounced' then 'bounce' else 'spam-klacht' end) on conflict(email) do nothing;
  end if;
 end loop;
 return n;
end $$;
create function public.hq_mail_event(p_id text,p_provider text,p_type text,p_at timestamptz,p_link text default null) returns integer language plpgsql security invoker set search_path='' as $$
begin
 if length(p_id)>200 or length(p_provider)>120 or p_id='' or p_provider='' then raise exception 'Invalid event';end if;
 -- Serialize events for one provider message, including events that arrive before send acknowledgement.
 perform pg_advisory_xact_lock(hashtextextended(p_provider,428));
 insert into public.hq_mail_events(event_id,provider_id,event_type,occurred_at,link) values(p_id,p_provider,p_type,p_at,left(p_link,2000)) on conflict(event_id) do nothing;
 return public.hq_mail_reconcile(p_provider);
end $$;
revoke all on function public.hq_mail_reconcile(text),public.hq_mail_event(text,text,text,timestamptz,text) from public,anon,authenticated;
grant execute on function public.hq_mail_reconcile(text),public.hq_mail_event(text,text,text,timestamptz,text) to service_role;
-- Explicit deployment-time maintenance request: only this fixed tracking setup is run; no email is sent.
insert into public.mail_cfg(key,value) values('tracking_setup_requested','pending') on conflict(key) do update set value='pending';
commit;
