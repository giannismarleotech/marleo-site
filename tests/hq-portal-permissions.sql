-- This transaction leaves no account, session, service, event, or CRM changes behind.
begin;
do $$
declare test_user uuid:=gen_random_uuid(); test_session uuid:=gen_random_uuid(); owner_user uuid; owner_session uuid; cust text; result jsonb; service_id uuid:=gen_random_uuid();
begin
 select owner_id into owner_user from public.hq_hosting_config where id=true;
 select id into owner_session from auth.sessions where user_id=owner_user and (not_after is null or not_after>now()) limit 1;
 select x->>'id' into cust from public.crm_state c cross join lateral jsonb_array_elements(c.data) x where c.user_id=owner_user and c.collection='customers' limit 1;
 if cust is null or owner_session is null then raise exception 'Test requires a CRM customer and owner session';end if;
 insert into auth.users(id,email) values(test_user,'portal-rollback-'||test_user::text||'@example.invalid');
 insert into auth.sessions(id,user_id) values(test_session,test_user);
 insert into public.hq_portal_accounts(user_id,customer_id,email,display_name) values(test_user,cust,'portal-rollback-'||test_user::text||'@example.invalid','Rollback test');
 result:=public.hq_portal_gate(test_user,test_session,'scope','{"customer_id":"another-customer"}');
 if result->>'customer_id'<>cust then raise exception 'Client scope could be changed';end if;
 begin
  perform public.hq_portal_gate(test_user,test_session,'admin_data');
  raise exception 'Client accessed admin data';
 exception when insufficient_privilege then null;end;
 perform public.hq_portal_gate(owner_user,owner_session,'service_save',jsonb_build_object('id',service_id,'customer_id',cust,'title','Rollback service','category','website','status','active','description','Test','url','','amount',null,'period','none','renewal_date','','visible',true));
 result:=public.hq_portal_gate(test_user,test_session,'client_services');
 if not exists(select 1 from jsonb_array_elements(result) r where r->>'id'=service_id::text) then raise exception 'Own service missing';end if;
 update public.hq_portal_accounts set services=false,invoices=false where user_id=test_user;
 if public.hq_portal_gate(test_user,test_session,'client_services')<>'[]'::jsonb then raise exception 'Service permission ignored';end if;
 result:=public.hq_portal_gate(test_user,test_session,'scope');
 if (result->>'invoices')::boolean then raise exception 'Invoice permission ignored';end if;
 update public.hq_portal_accounts set active=false where user_id=test_user;
 begin
  perform public.hq_portal_gate(test_user,test_session,'scope');
  raise exception 'Revoked account still accessed scope';
 exception when insufficient_privilege then null;end;
end $$;
select 'Owner/client scopes, service permissions and immediate account revocation passed; all test data rolled back.' as verification;
rollback;
