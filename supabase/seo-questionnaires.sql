-- Additive schema; existing customer data, website intakes and CRM collections are untouched.
create table public.seo_questionnaires (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  customer_id text not null check (length(customer_id) between 1 and 160),
  customer_name text not null check (length(customer_name) between 1 and 300),
  title text not null default 'SEO-vragenlijst' check (length(title) between 1 and 300),
  status text not null default 'draft' check (status in ('draft','open','submitted')),
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers)='object' and octet_length(answers::text)<150000),
  seo_notes text not null default '' check (length(seo_notes)<=15000),
  priority_keywords text not null default '' check (length(priority_keywords)<=10000),
  access_token text unique check (access_token is null or access_token ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.seo_questionnaires enable row level security;
revoke all on public.seo_questionnaires from anon, authenticated;
grant select,insert,update on public.seo_questionnaires to authenticated;
grant all on public.seo_questionnaires to service_role;
create policy "Owner can read SEO questionnaires" on public.seo_questionnaires for select to authenticated using ((select auth.uid())=user_id);
create policy "Owner can create SEO questionnaires" on public.seo_questionnaires for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Owner can update SEO questionnaires" on public.seo_questionnaires for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create index seo_questionnaires_owner_customer on public.seo_questionnaires(user_id,customer_id,created_at desc);
create function public.seo_questionnaire_touch() returns trigger language plpgsql security invoker set search_path='' as $$
begin new.updated_at=clock_timestamp(); return new; end;
$$;
revoke all on function public.seo_questionnaire_touch() from public;
create trigger seo_questionnaire_updated before update on public.seo_questionnaires for each row execute function public.seo_questionnaire_touch();
