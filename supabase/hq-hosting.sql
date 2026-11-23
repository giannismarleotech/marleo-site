begin;
create table public.hq_hosting_config (
 id boolean primary key default true check(id),
 owner_id uuid not null references auth.users(id),
 secret_id uuid references vault.secrets(id),
 updated_at timestamptz not null default now()
);
insert into public.hq_hosting_config(id,owner_id)
select true,id from auth.users where lower(email)='giannis@marleo.tech';
create table public.hq_hosting_passwords (
 domain text not null, mailbox text not null,
 secret_id uuid not null references vault.secrets(id),
 updated_at timestamptz not null default now(),
 primary key(domain,mailbox)
);
create table public.hq_hosting_audit (
 id bigint generated always as identity primary key,
 actor_id uuid not null references auth.users(id),
 action text not null, domain text, mailbox text,
 created_at timestamptz not null default now()
);
create table public.hq_hosting_locks (domain text not null, mailbox text not null, token uuid not null, expires_at timestamptz not null, primary key(domain,mailbox));
alter table public.hq_hosting_locks enable row level security;
revoke all on public.hq_hosting_locks from public,anon,authenticated;
grant select,insert,update,delete on public.hq_hosting_locks to service_role;
create index hq_hosting_audit_actor_time on public.hq_hosting_audit(actor_id,created_at desc);
alter table public.hq_hosting_config enable row level security;
alter table public.hq_hosting_passwords enable row level security;
alter table public.hq_hosting_audit enable row level security;
revoke all on public.hq_hosting_config,public.hq_hosting_passwords,public.hq_hosting_audit from public,anon,authenticated;
grant select,insert,update on public.hq_hosting_config,public.hq_hosting_passwords,public.hq_hosting_audit to service_role;
grant usage,select on sequence public.hq_hosting_audit_id_seq to service_role;
grant select(id,user_id,not_after) on auth.sessions to service_role;
grant usage on schema vault to service_role;
grant select on vault.decrypted_secrets to service_role;
grant execute on function vault.create_secret(text,text,text,uuid),vault.update_secret(uuid,text,text,text,uuid) to service_role;

-- INVOKER only. Browser roles cannot execute this RPC or access the backing tables.
-- The Edge Function verifies the JWT and provides its verified user and session IDs.
create function public.hq_hosting_gate(p_actor uuid,p_session uuid,p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare c public.hq_hosting_config%rowtype; sid uuid; result jsonb;
begin
 select * into c from public.hq_hosting_config where id=true;
 if c.owner_id is distinct from p_actor or not exists(
  select 1 from auth.sessions s where s.id=p_session and s.user_id=p_actor and (s.not_after is null or s.not_after>now())
 ) then raise exception 'Hosting access denied' using errcode='42501'; end if;
 if p_action='rate' then
  perform pg_advisory_xact_lock(hashtext('hq-hosting-rate'));
  if (select count(*) from public.hq_hosting_audit where actor_id=p_actor and action='request' and created_at>now()-interval '1 minute')>=30
  then raise exception 'Rate limit' using errcode='P0001'; end if;
  insert into public.hq_hosting_audit(actor_id,action) values(p_actor,'request'); return '{}'::jsonb;
 elsif p_action='config_get' then
  select decrypted_secret::jsonb into result from vault.decrypted_secrets where id=c.secret_id;
  return coalesce(result,'{}'::jsonb);
 elsif p_action='config_save' then
  select * into c from public.hq_hosting_config where id=true for update;
  if c.secret_id is null then
   sid:=vault.create_secret(p_payload::text,'hq-directadmin-connection','Marleo HQ DirectAdmin connection');
   update public.hq_hosting_config set secret_id=sid,updated_at=now() where id=true;
  else
   perform vault.update_secret(c.secret_id,p_payload::text);
   update public.hq_hosting_config set updated_at=now() where id=true;
  end if;
  return '{}'::jsonb;
 elsif p_action='password_save' then
  perform pg_advisory_xact_lock(hashtext('hq-hosting-password:'||(p_payload->>'domain')||':'||(p_payload->>'mailbox')));
  select secret_id into sid from public.hq_hosting_passwords where domain=p_payload->>'domain' and mailbox=p_payload->>'mailbox';
  if sid is null then
   sid:=vault.create_secret(p_payload->>'password');
   insert into public.hq_hosting_passwords(domain,mailbox,secret_id) values(p_payload->>'domain',p_payload->>'mailbox',sid);
  else
   perform vault.update_secret(sid,p_payload->>'password');
   update public.hq_hosting_passwords set updated_at=now() where domain=p_payload->>'domain' and mailbox=p_payload->>'mailbox';
  end if;
  return '{}'::jsonb;
 elsif p_action='password_get' then
  select jsonb_build_object('password',v.decrypted_secret,'updated_at',p.updated_at) into result
  from public.hq_hosting_passwords p join vault.decrypted_secrets v on v.id=p.secret_id
  where p.domain=p_payload->>'domain' and p.mailbox=p_payload->>'mailbox';
  return coalesce(result,'{}'::jsonb);
 elsif p_action='password_index' then
  select coalesce(jsonb_agg(jsonb_build_object('mailbox',mailbox,'updated_at',updated_at)),'[]'::jsonb) into result
  from public.hq_hosting_passwords where domain=p_payload->>'domain'; return result;
 elsif p_action='lock' then
  insert into public.hq_hosting_locks(domain,mailbox,token,expires_at)
  values(p_payload->>'domain',p_payload->>'mailbox',(p_payload->>'token')::uuid,now()+interval '90 seconds')
  on conflict(domain,mailbox) do update set token=excluded.token,expires_at=excluded.expires_at
  where public.hq_hosting_locks.expires_at<now();
  if not found then raise exception 'Er wordt al een wijziging voor deze mailbox verwerkt. Wacht 90 seconden.'; end if;
  return '{}'::jsonb;
 elsif p_action='unlock' then
  delete from public.hq_hosting_locks where domain=p_payload->>'domain' and mailbox=p_payload->>'mailbox' and token=(p_payload->>'token')::uuid;
  return '{}'::jsonb;
 elsif p_action='audit' then
  if p_payload->>'action' not in ('connected','listed','password_changed','password_viewed','mailbox_created','change_started','create_started') then
   raise exception 'Invalid audit action'; end if;
  insert into public.hq_hosting_audit(actor_id,action,domain,mailbox)
  values(p_actor,p_payload->>'action',p_payload->>'domain',p_payload->>'mailbox');
  return '{}'::jsonb;
 elsif p_action='audit_list' then
  select coalesce(jsonb_agg(r),'[]'::jsonb) into result from
   (select action,domain,mailbox,created_at from public.hq_hosting_audit where action<>'request' order by created_at desc limit 20) r;
  return result;
 end if;
 raise exception 'Invalid action';
end $$;
revoke all on function public.hq_hosting_gate(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.hq_hosting_gate(uuid,uuid,text,jsonb) to service_role;
commit;
