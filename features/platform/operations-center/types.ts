import type{ObservabilitySnapshot}from"@/features/platform/observability-center/types";
export type OperatorStatus="Healthy"|"Warning"|"Unavailable"|"Configuration Required";
export interface ApplicationHealth{readonly status:OperatorStatus;readonly uptimeSeconds:number;readonly version:string;readonly environment:string;readonly buildNumber:string;readonly deploymentTime:string|null}
export interface ProviderHealth{readonly name:string;readonly status:OperatorStatus;readonly checkedAt:string|null;readonly latencyMs:number|null;readonly diagnostic:string}
export interface DeliveryRow{readonly event:string;readonly direction:string;readonly status:string;readonly attempts:number;readonly receivedAt:string;readonly latencyMs:number|null}
export interface AuditRow{readonly action:string;readonly title:string;readonly occurredAt:string}
export interface ErrorGroup{readonly component:string;readonly severity:"Critical"|"Warning";readonly firstSeen:string;readonly lastSeen:string;readonly occurrences:number;readonly recovery:"Open"|"Recovered"}
export interface SlowOperation{readonly label:string;readonly durationMs:number;readonly kind:"Page"|"API"|"Synchronization"}
export interface OperationsSnapshot{readonly application:ApplicationHealth;readonly platform:ObservabilitySnapshot;readonly providers:readonly ProviderHealth[];readonly webhooks:readonly DeliveryRow[];readonly audit:readonly AuditRow[];readonly errors:readonly ErrorGroup[];readonly slowOperations:readonly SlowOperation[];readonly averageJobDurationMs:number|null;readonly averageResponseTimeMs:number|null;readonly averageSyncTimeMs:number|null;readonly generatedAt:string}
