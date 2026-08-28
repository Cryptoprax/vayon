-- Sprint 180: secure Gmail metadata synchronization. No tables or columns are added.
create or replace function public.update_gmail_permissions(p_workspace_id uuid,p_permissions jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare v_org uuid;v_provider uuid;
begin
  if not public.can_manage_integrations(p_workspace_id) then raise exception 'insufficient integration permission'; end if;
  if not (p_permissions ?& array['readEmail','sendEmail','draftReplies','crmSynchronization','threadSummaries']) then raise exception 'invalid Gmail permissions'; end if;
  select organization_id into v_org from public.workspaces where id=p_workspace_id;
  select id into v_provider from public.integration_providers where code='gmail' and active;
  update public.integration_connections set configuration=jsonb_set(configuration,'{permissions}',p_permissions,true),updated_by=auth.uid(),updated_at=now(),version=version+1
  where workspace_id=p_workspace_id and organization_id=v_org and provider_id=v_provider and deleted_at is null;
  insert into public.integration_logs(organization_id,workspace_id,provider_id,actor_id,level,event,message,audit_event)
  values(v_org,p_workspace_id,v_provider,auth.uid(),'audit','gmail.permissions.updated','Gmail permissions updated',true);
end$$;

create or replace function public.sync_gmail_metadata(p_workspace_id uuid,p_messages jsonb,p_labels jsonb default '[]')
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_org uuid;v_provider uuid;v_actor uuid:=auth.uid();v_message jsonb;v_thread uuid;v_lead uuid;v_imported int:=0;v_duplicates int:=0;v_linked int:=0;v_started timestamptz:=clock_timestamp();v_participants text[];
begin
  select organization_id into v_org from public.workspace_members where workspace_id=p_workspace_id and user_id=v_actor and status='active';
  if v_org is null or not public.can_use_communications(p_workspace_id) then raise exception 'insufficient communication permission'; end if;
  select id into v_provider from public.integration_providers where code='gmail' and active;
  if v_provider is null then raise exception 'Gmail provider is unavailable'; end if;
  if jsonb_typeof(p_messages)<>'array' or jsonb_array_length(p_messages)>100 then raise exception 'invalid Gmail metadata batch'; end if;
  for v_message in select value from jsonb_array_elements(p_messages) loop
    if coalesce(v_message->>'externalId','')='' or coalesce(v_message->>'threadId','')='' then continue; end if;
    if exists(select 1 from public.communications where organization_id=v_org and channel='email' and external_id=v_message->>'externalId') then v_duplicates:=v_duplicates+1;continue;end if;
    select coalesce(array_agg(lower(value)),array[]::text[]) into v_participants from jsonb_array_elements_text(coalesce(v_message->'participants','[]'));
    select id into v_lead from public.leads where organization_id=v_org and workspace_id=p_workspace_id and deleted_at is null and lower(email)=any(v_participants) order by updated_at desc limit 1;
    select id into v_thread from public.communication_threads where organization_id=v_org and workspace_id=p_workspace_id and metadata->>'gmail_thread_id'=v_message->>'threadId' and deleted_at is null limit 1;
    if v_thread is null then
      insert into public.communication_threads(organization_id,workspace_id,subject,related_type,related_id,status,unread_count,last_activity_at,created_by,updated_by,metadata)
      values(v_org,p_workspace_id,left(coalesce(nullif(v_message->>'subject',''),'Email conversation'),500),case when v_lead is null then 'organization' else 'lead' end,coalesce(v_lead,v_org),'open',case when coalesce((v_message->>'unread')::boolean,false) then 1 else 0 end,coalesce((v_message->>'timestamp')::timestamptz,now()),v_actor,v_actor,jsonb_build_object('gmail_thread_id',v_message->>'threadId','participants',v_message->'participants','labels',v_message->'labels')) returning id into v_thread;
    end if;
    insert into public.communications(organization_id,workspace_id,thread_id,channel,direction,status,body,user_id,external_id,metadata,occurred_at)
    values(v_org,p_workspace_id,v_thread,'email',case when v_message->>'direction'='outbound' then 'outbound' else 'inbound' end,case when v_message->>'direction'='outbound' then 'sent' else 'received' end,'',v_actor,v_message->>'externalId',jsonb_build_object('gmail_thread_id',v_message->>'threadId','subject',v_message->>'subject','participants',v_message->'participants','labels',v_message->'labels','has_attachments',coalesce((v_message->>'hasAttachments')::boolean,false),'content_stored',false,'lead_id',v_lead,'deal_ids',coalesce((select jsonb_agg(id) from public.deals where organization_id=v_org and workspace_id=p_workspace_id and lead_id=v_lead and deleted_at is null),'[]'::jsonb),'property_ids',coalesce((select jsonb_agg(property_id) from public.deals where organization_id=v_org and workspace_id=p_workspace_id and lead_id=v_lead and property_id is not null and deleted_at is null),'[]'::jsonb)),coalesce((v_message->>'timestamp')::timestamptz,now()));
    update public.communication_threads set last_activity_at=greatest(last_activity_at,coalesce((v_message->>'timestamp')::timestamptz,now())),unread_count=unread_count+case when coalesce((v_message->>'unread')::boolean,false) then 1 else 0 end,updated_at=now(),updated_by=v_actor,version=version+1 where id=v_thread;
    v_imported:=v_imported+1;if v_lead is not null then v_linked:=v_linked+1;end if;
  end loop;
  update public.integration_connections set status='connected',last_sync_at=now(),configuration=jsonb_set(configuration,'{gmailLabels}',coalesce(p_labels,'[]'),true),updated_by=v_actor,updated_at=now(),version=version+1 where workspace_id=p_workspace_id and provider_id=v_provider and deleted_at is null;
  update public.integration_health set status='healthy',last_success_at=now(),last_failure_at=null,checked_at=now(),details=jsonb_build_object('metadata_only',true,'records_processed',v_imported+v_duplicates) where workspace_id=p_workspace_id and provider_id=v_provider;
  insert into public.integration_sync_history(organization_id,workspace_id,provider_id,entity_type,direction,started_at,completed_at,duration_ms,status,records_processed) values(v_org,p_workspace_id,v_provider,'email_metadata','bidirectional',v_started,clock_timestamp(),extract(milliseconds from clock_timestamp()-v_started)::int,'completed',v_imported);
  return jsonb_build_object('imported',v_imported,'duplicates',v_duplicates,'linked',v_linked);
end$$;

create or replace function public.record_gmail_sync_failure(p_workspace_id uuid,p_reason text)
returns void language plpgsql security definer set search_path=public as $$
declare v_org uuid;v_provider uuid;
begin
  if not public.can_use_communications(p_workspace_id) then raise exception 'insufficient communication permission';end if;
  select organization_id into v_org from public.workspaces where id=p_workspace_id;select id into v_provider from public.integration_providers where code='gmail';
  update public.integration_health set status='degraded',last_failure_at=now(),checked_at=now(),retry_count=retry_count+1,details=jsonb_build_object('recovery','Reconnect Gmail or retry synchronization.','reason',left(p_reason,240)) where workspace_id=p_workspace_id and provider_id=v_provider;
  insert into public.integration_logs(organization_id,workspace_id,provider_id,actor_id,level,event,message,audit_event) values(v_org,p_workspace_id,v_provider,auth.uid(),'error','gmail.sync.failed','Gmail synchronization needs attention',false);
end$$;

revoke all on function public.update_gmail_permissions(uuid,jsonb),public.sync_gmail_metadata(uuid,jsonb,jsonb),public.record_gmail_sync_failure(uuid,text) from public;
grant execute on function public.update_gmail_permissions(uuid,jsonb),public.sync_gmail_metadata(uuid,jsonb,jsonb),public.record_gmail_sync_failure(uuid,text) to authenticated;
