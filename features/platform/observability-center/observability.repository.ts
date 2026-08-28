import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
type Row=Record<string,unknown>;
export interface EvidenceRows{readonly rows:readonly Row[];readonly available:boolean}
export class ObservabilityRepository{
  constructor(private readonly client:SupabaseClient){}
  private async safe(query:PromiseLike<{data:unknown;error:unknown}>):Promise<EvidenceRows>{try{const{data,error}=await query;if(error||!Array.isArray(data))return{rows:[],available:false};return{rows:data as Row[],available:true}}catch{return{rows:[],available:false}}}
  metrics(){return this.safe(this.client.from("platform_metrics").select("metric,value,unit,recorded_at").order("recorded_at",{ascending:false}).limit(500))}
  alerts(){return this.safe(this.client.from("system_alerts").select("id,severity,source,title,description,status,acknowledged_by,resolved_at,created_at,updated_at").is("deleted_at",null).order("created_at",{ascending:false}).limit(100))}
  integrationHealth(){return this.safe(this.client.from("integration_health").select("status,latency_ms,failure_rate,retry_count,last_success_at,last_failure_at,checked_at,integration_providers(code,name)").order("checked_at",{ascending:false}).limit(200))}
  integrationLogs(){return this.safe(this.client.from("integration_logs").select("level,event,duration_ms,occurred_at").is("deleted_at",null).order("occurred_at",{ascending:false}).limit(500))}
  integrationWebhooks(){return this.safe(this.client.from("integration_webhooks").select("status,attempts,received_at,processed_at").is("deleted_at",null).order("received_at",{ascending:false}).limit(500))}
  retryQueue(){return this.safe(this.client.from("integration_retry_queue").select("status,attempts,created_at,updated_at").order("created_at",{ascending:false}).limit(500))}
  billingEvents(){return this.safe(this.client.from("billing_events").select("event_type,status,created_at,processed_at").order("created_at",{ascending:false}).limit(500))}
  invoices(){return this.safe(this.client.from("invoices").select("status,created_at,paid_at").is("deleted_at",null).order("created_at",{ascending:false}).limit(500))}
  aiEmployees(){return this.safe(this.client.from("ai_employees").select("id,name,status,updated_at").is("deleted_at",null).order("name").limit(250))}
  aiTasks(){return this.safe(this.client.from("ai_tasks").select("employee_id,status,updated_at").is("deleted_at",null).order("updated_at",{ascending:false}).limit(1000))}
  aiOutputs(){return this.safe(this.client.from("ai_runtime_outputs").select("employee_id,latency_ms,created_at").order("created_at",{ascending:false}).limit(1000))}
  learningJobs(){return this.safe(this.client.from("continuous_learning_jobs").select("status,latency_ms,started_at,completed_at").order("started_at",{ascending:false}).limit(500))}
  notificationQueue(){return this.safe(this.client.from("notification_queue").select("status,attempts,created_at,updated_at").order("created_at",{ascending:false}).limit(500))}
  auditTimeline(){return this.safe(this.client.from("activity_events").select("event_type,title,occurred_at").order("occurred_at",{ascending:false}).limit(100))}
  operationalLogs(){return this.safe(this.client.from("integration_logs").select("level,event,duration_ms,occurred_at").is("deleted_at",null).order("occurred_at",{ascending:false}).limit(1000))}
  webhookDeliveries(){return this.safe(this.client.from("integration_webhooks").select("direction,event_type,status,attempts,received_at,processed_at").is("deleted_at",null).order("received_at",{ascending:false}).limit(250))}
  synchronizationHistory(){return this.safe(this.client.from("integration_sync_history").select("entity_type,status,started_at,completed_at,duration_ms,records_processed").order("started_at",{ascending:false}).limit(250))}
  performanceEvents(){return this.safe(this.client.from("workspace_analytics_events").select("event_name,duration_ms,metadata,occurred_at").order("occurred_at",{ascending:false}).limit(1000))}
}
