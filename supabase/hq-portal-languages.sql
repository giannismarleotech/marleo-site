begin;
alter table public.hq_portal_accounts add column language text not null default 'nl' check(language in ('nl','en'));
create or replace function public.hq_portal_gate(p_actor uuid,p_session uuid,p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare owner_id uuid; account public.hq_portal_accounts%rowtype; result jsonb; cust text; record_id uuid;
begin
 select c.owner_id into owner_id from public.hq_hosting_config c where c.id=true;
 -- Only the server role can invoke this function. Public login is tightly scoped and throttled.
 if p_action='login_claim' then
  perform pg_advisory_xact_lock(hashtext('hq-portal-login'));
  if (select count(*) from public.hq_portal_events e where e.action='login_request' and e.created_at>now()-interval '1 hour' and e.email_hash=p_payload->>'email_hash')>=5
   or (select count(*) from public.hq_portal_events e where e.action='login_request' and e.created_at>now()-interval '1 minute' and e.email_hash=p_payload->>'email_hash')>=1
   or (select count(*) from public.hq_portal_events e where e.action='login_request' and e.created_at>now()-interval '1 hour' and e.ip_hash=p_payload->>'ip_hash')>=20
   or (select count(*) from public.hq_portal_events e where e.action='login_request' and e.created_at>now()-interval '1 hour')>=100
  then return '{}'::jsonb; end if;
  insert into public.hq_portal_events(action,email_hash,ip_hash) values('login_request',p_payload->>'email_hash',p_payload->>'ip_hash');
  select * into account from public.hq_portal_accounts a where a.email=p_payload->>'email' and a.active=true;
  if account.id is null then return '{}'::jsonb; end if;
  return to_jsonb(account);
 end if;
 if p_actor is null or not exists(select 1 from auth.sessions s where s.id=p_session and s.user_id=p_actor and (s.not_after is null or s.not_after>now()))
 then raise exception 'Niet ingelogd' using errcode='42501'; end if;
 if p_action='rate' then
  perform pg_advisory_xact_lock(hashtext('hq-portal-rate:'||p_actor::text));
  if (select count(*) from public.hq_portal_events e where e.actor_id=p_actor and e.action='request' and e.created_at>now()-interval '1 minute')>=60 then raise exception 'Te veel aanvragen. Wacht één minuut.'; end if;
  insert into public.hq_portal_events(actor_id,action) values(p_actor,'request'); return '{}'::jsonb;
 end if;
 if p_actor=owner_id then
  if p_action='admin_data' then
   return jsonb_build_object('accounts',(select coalesce(jsonb_agg(a order by a.created_at desc),'[]') from public.hq_portal_accounts a),
    'services',(select coalesce(jsonb_agg(s order by s.updated_at desc),'[]') from public.hq_portal_services s),
    'tickets',(select coalesce(jsonb_agg(t),'[]') from (select * from public.hq_portal_tickets order by updated_at desc limit 100) t));
  elsif p_action='account_save' then
   cust:=p_payload->>'customer_id';
   if not exists(select 1 from public.crm_state c cross join lateral jsonb_array_elements(c.data) x where c.user_id=owner_id and c.collection='customers' and x->>'id'=cust) then raise exception 'Klant niet gevonden. Synchroniseer HQ eerst.'; end if;
   if (p_payload->>'user_id')::uuid=owner_id then raise exception 'Het beheerdersaccount kan geen klantaccount worden.'; end if;
   select * into account from public.hq_portal_accounts where user_id=(p_payload->>'user_id')::uuid or email=p_payload->>'email';
   if account.id is not null and account.customer_id<>cust then raise exception 'Dit e-mailadres is al aan een andere klant gekoppeld.'; end if;
   insert into public.hq_portal_accounts(user_id,customer_id,email,display_name,invoices,services,language)
   values((p_payload->>'user_id')::uuid,cust,p_payload->>'email',p_payload->>'display_name',(p_payload->>'invoices')::boolean,(p_payload->>'services')::boolean,coalesce(p_payload->>'language','nl'))
   on conflict(user_id) do update set active=true,display_name=excluded.display_name,invoices=excluded.invoices,services=excluded.services,language=excluded.language
   returning id into record_id;
   return jsonb_build_object('id',record_id);
  elsif p_action='account_update' then
   update public.hq_portal_accounts set language=coalesce(p_payload->>'language','nl'),display_name=p_payload->>'display_name',invoices=(p_payload->>'invoices')::boolean,services=(p_payload->>'services')::boolean where id=(p_payload->>'id')::uuid returning id into record_id;
   if record_id is null then raise exception 'Account niet gevonden.'; end if;return '{}'::jsonb;
  elsif p_action='account_toggle' then
   update public.hq_portal_accounts set active=(p_payload->>'active')::boolean where id=(p_payload->>'id')::uuid returning id into record_id;
   if record_id is null then raise exception 'Account niet gevonden.'; end if;return '{}'::jsonb;
  elsif p_action='invited' then
   update public.hq_portal_accounts set invited_at=now() where id=(p_payload->>'id')::uuid;return '{}'::jsonb;
  elsif p_action='service_save' then
   cust:=p_payload->>'customer_id';
   if not exists(select 1 from public.crm_state c cross join lateral jsonb_array_elements(c.data) x where c.user_id=owner_id and c.collection='customers' and x->>'id'=cust) then raise exception 'Klant niet gevonden.'; end if;
   record_id:=coalesce(nullif(p_payload->>'id','')::uuid,gen_random_uuid());
   if exists(select 1 from public.hq_portal_services where id=record_id and customer_id<>cust)then raise exception 'Dienst hoort bij een andere klant.';end if;
   insert into public.hq_portal_services(id,customer_id,title,category,status,description,url,amount,period,renewal_date,visible)
   values(record_id,cust,p_payload->>'title',p_payload->>'category',p_payload->>'status',p_payload->>'description',p_payload->>'url',nullif(p_payload->>'amount','')::numeric,p_payload->>'period',nullif(p_payload->>'renewal_date','')::date,(p_payload->>'visible')::boolean)
   on conflict(id) do update set title=excluded.title,category=excluded.category,status=excluded.status,description=excluded.description,url=excluded.url,amount=excluded.amount,period=excluded.period,renewal_date=excluded.renewal_date,visible=excluded.visible,updated_at=now();
   return jsonb_build_object('id',record_id);
  elsif p_action='ticket_reply' then
   update public.hq_portal_tickets set reply=p_payload->>'reply',status=p_payload->>'status',updated_at=now() where id=(p_payload->>'id')::uuid returning id into record_id;
   if record_id is null then raise exception 'Vraag niet gevonden.'; end if;return '{}'::jsonb;
  elsif p_action='scope' then
   cust:=p_payload->>'customer_id';
   if coalesce(cust,'')='' then raise exception 'Selecteer een klant.'; end if;
   return jsonb_build_object('customer_id',cust,'invoices',true,'services',true,'owner_preview',true);
  end if;
  raise exception 'Onbekende beheeractie.';
 end if;
 select * into account from public.hq_portal_accounts a where a.user_id=p_actor and a.active;
 if account.id is null then raise exception 'Geen actieve portaaltoegang' using errcode='42501'; end if;
 if p_action='scope' then
  update public.hq_portal_accounts set last_seen_at=now() where id=account.id;
  return jsonb_build_object('customer_id',account.customer_id,'invoices',account.invoices,'services',account.services,'display_name',account.display_name,'language',account.language);
 elsif p_action='set_language' then
  if p_payload->>'language' not in ('nl','en') then raise exception 'Ongeldige taal.';end if;
  update public.hq_portal_accounts set language=p_payload->>'language' where id=account.id;return '{}'::jsonb;
 elsif p_action='client_services' then
  if not account.services then return '[]'::jsonb;end if;
  return (select coalesce(jsonb_agg(s order by s.updated_at desc),'[]') from public.hq_portal_services s where s.customer_id=account.customer_id and s.visible);
 elsif p_action='client_tickets' then
  return (select coalesce(jsonb_agg(t order by t.updated_at desc),'[]') from public.hq_portal_tickets t where t.customer_id=account.customer_id);
 elsif p_action='ticket_create' then
  if (select count(*) from public.hq_portal_tickets t where t.user_id=p_actor and t.created_at>now()-interval '1 hour')>=5 then raise exception 'Je hebt al vijf vragen verstuurd. Probeer het later opnieuw.';end if;
  insert into public.hq_portal_tickets(customer_id,user_id,subject,message) values(account.customer_id,p_actor,p_payload->>'subject',p_payload->>'message') returning id into record_id;
  return jsonb_build_object('id',record_id);
 end if;
 raise exception 'Actie niet toegestaan' using errcode='42501';
end $$;
commit;
