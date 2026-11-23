-- Synthetic records only; this transaction rolls back every insert and update. No email is queued for sending.
begin;
do $$
declare campaign uuid:=gen_random_uuid(); queue uuid:=gen_random_uuid(); provider text:='test-provider-'||gen_random_uuid(); event_prefix text:='test-event-'||gen_random_uuid(); r public.mail_queue%rowtype;
begin
 insert into public.campaigns(id,name,subject,body,daily_limit,status) values(campaign,'Rollback tracking','Synthetic test','Test',1,'gepland');
 insert into public.mail_queue(id,to_email,subject,html,body_text,kind,campaign_id,status,send_at,sent_at,resend_id) values(queue,'tracking@example.invalid','Synthetic test','<p>Test</p>','Test','campaign',campaign,'sent',now(),now(),provider);
 perform public.hq_mail_event(event_prefix||'-open',provider,'email.opened','2026-11-23T10:00:00Z',null);
 perform public.hq_mail_event(event_prefix||'-open',provider,'email.opened','2026-11-23T10:00:00Z',null);
 perform public.hq_mail_event(event_prefix||'-early',provider,'email.opened','2026-11-23T09:00:00Z',null);
 perform public.hq_mail_event(event_prefix||'-click',provider,'email.clicked','2026-11-23T11:00:00Z','https://example.invalid/info');
 select * into r from public.mail_queue where id=queue;
 if r.opens<>2 or r.clicks<>1 or r.opened_at<>'2026-11-23T09:00:00Z'::timestamptz or r.last_opened_at<>'2026-11-23T10:00:00Z'::timestamptz then raise exception 'Deduplication or first/last timing failed';end if;
 -- A webhook may arrive before the send response is associated with its queue row.
 perform public.hq_mail_event(event_prefix||'-orphan',provider||'-early','email.delivered','2026-11-23T08:00:00Z',null);
 update public.mail_queue set resend_id=provider||'-early' where id=queue;
 perform public.hq_mail_reconcile(provider||'-early');
 if (select delivered_at from public.mail_queue where id=queue)<>'2026-11-23T08:00:00Z'::timestamptz then raise exception 'Early delivery event was lost';end if;
 if has_function_privilege('authenticated','public.hq_mail_event(text,text,text,timestamptz,text)','EXECUTE') then raise exception 'Client can forge events';end if;
 if has_table_privilege('anon','public.hq_mail_events','SELECT') then raise exception 'Events are public';end if;
 if has_table_privilege('authenticated','public.mail_cfg','SELECT') then raise exception 'Webhook credentials exposed';end if;
end $$;
select 'Event deduplication, out-of-order timestamps, early webhook reconciliation and browser permissions passed. All fixtures rolled back.' as verification;
rollback;
