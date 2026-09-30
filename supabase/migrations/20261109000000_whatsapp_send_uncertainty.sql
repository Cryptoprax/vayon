-- Phase E6: classify (never resolve) WhatsApp sends whose outcome could not
-- be confirmed. No Meta call, no send, no retry, no mark-sent/mark-failed
-- happens anywhere in this migration -- this is state classification only.
--
-- WHY A NEW 'uncertain' STATUS VALUE (not reusing 'failed'):
-- Phase E5's claim_whatsapp_draft_send() already treats a 'failed' row as
-- deliberately retry-eligible (Part 7: "failed: retry allowed deliberately").
-- If a stale 'claimed' row were reclassified as 'failed', it would silently
-- become retry-eligible too -- exactly the auto-resend-of-an-unknown-outcome
-- this phase exists to prevent (Meta may have already accepted and even
-- delivered the original send). 'uncertain' is a new, distinct terminal-ish
-- value that claim_whatsapp_draft_send()'s existing retry branch (`where
-- ... and status = 'failed'`) does NOT match -- so an uncertain execution is
-- already correctly blocked from retry by Phase E5's existing code, with no
-- change needed there at all. No large state machine was added: this is one
-- additive value on top of the three Phase E5 already had.
--
-- WHY THE STALENESS THRESHOLD IS A CALLER-SUPPLIED PARAMETER, NOT A SQL
-- CONSTANT: Part 2 asks for "a documented constant in application logic
-- rather than hardcoding SQL magic." flag_stale_whatsapp_send_executions()
-- takes p_stale_before as a parameter; the actual 5-minute threshold is
-- defined once, in TypeScript, as WHATSAPP_SEND_UNCERTAIN_AFTER_MS
-- (features/platform/integrations/whatsapp/whatsapp-send-reconciliation.service.ts),
-- justified there by Vercel serverless execution duration, not by an
-- existing WhatsApp-specific timeout convention (none was found).

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

alter table public.whatsapp_ai_send_executions
  drop constraint if exists whatsapp_ai_send_executions_status_check;
alter table public.whatsapp_ai_send_executions
  add constraint whatsapp_ai_send_executions_status_check check (status in ('claimed', 'sent', 'failed', 'uncertain'));

-- ============================================================================
-- flag_stale_whatsapp_send_executions: the ONLY thing this migration does
-- besides the constraint above. Atomically reclassifies every execution
-- still 'claimed' older than p_stale_before as 'uncertain', and records one
-- activity_events row per flagged execution (actor_id left null -- this is
-- an automated classification, not a human action; activity_events.actor_id
-- is nullable and related_type/related_id are unconstrained free text/uuid,
-- so no new table or schema change was needed to represent this event).
-- Returns the ids it flagged so the caller can report a count without a
-- second query. service_role-only: intended to be invoked by a scheduled/
-- cron-triggered route (see app/api/whatsapp/send-executions/reconcile/route.ts),
-- mirroring the existing app/api/billing/paddle/founding/reconcile pattern,
-- not a new scheduler.
-- ============================================================================
create or replace function public.flag_stale_whatsapp_send_executions(p_stale_before timestamptz)
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  for r in
    update whatsapp_ai_send_executions
       set status = 'uncertain'
     where status = 'claimed' and claimed_at < p_stale_before
    returning id, organization_id, workspace_id, draft_message_id
  loop
    insert into activity_events (organization_id, workspace_id, event_type, title, related_type, related_id, metadata)
    values (r.organization_id, r.workspace_id, 'whatsapp.send.uncertain', 'WhatsApp send outcome could not be confirmed', 'whatsapp_send_execution', r.id, jsonb_build_object('draftMessageId', r.draft_message_id));
    return next r.id;
  end loop;

  return;
end;
$$;

revoke all on function public.flag_stale_whatsapp_send_executions(timestamptz) from public;
grant execute on function public.flag_stale_whatsapp_send_executions(timestamptz) to service_role;

commit;
