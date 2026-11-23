create table public.hq_agent_jobs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 client_request_id uuid not null,
 kind text not null check (kind in ('search','research','opportunity','contact','followup','workflow')),
 title text not null check (length(title)<=250),
 status text not null default 'queued' check (status in ('queued','running','completed','failed','stopped')),
 step text not null default 'In wachtrij',
 input jsonb not null default '{}' check (octet_length(input::text)<90000),
 output jsonb not null default '{}',
 events jsonb not null default '[]',
 error text,
 error_code text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 started_at timestamptz,
 finished_at timestamptz,
 unique (user_id,client_request_id)
);
create unique index hq_agent_one_active_job on public.hq_agent_jobs(user_id) where status in ('queued','running');
create index hq_agent_jobs_owner_created on public.hq_agent_jobs(user_id,created_at desc);
alter table public.hq_agent_jobs enable row level security;
revoke all on public.hq_agent_jobs from anon, authenticated;
grant select,insert,update on public.hq_agent_jobs to authenticated;
create policy "Read own agent jobs" on public.hq_agent_jobs for select to authenticated using ((select auth.uid())=user_id);
create policy "Create own agent jobs" on public.hq_agent_jobs for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Update own agent jobs" on public.hq_agent_jobs for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
