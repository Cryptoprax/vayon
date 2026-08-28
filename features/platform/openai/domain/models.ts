export type OpenAIModelId="gpt-5"|"gpt-5.5"|(string&{});export type AIEmployeeCode="sales-ai"|"crm-ai"|"marketing-ai"|"whatsapp-ai"|"voice-ai"|"operations-ai"|"finance-ai"|"executive-ai";
export interface OpenAIRequest{readonly system:string;readonly prompt:string;readonly workspaceId:string;readonly employee:AIEmployeeCode;readonly model?:OpenAIModelId;readonly maxOutputTokens?:number;readonly signal?:AbortSignal}
export interface TokenUsage{readonly promptTokens:number;readonly completionTokens:number;readonly totalTokens:number;readonly estimated:boolean}
export interface CostEstimate{readonly model:string;readonly inputUsd:number;readonly outputUsd:number;readonly totalUsd:number;readonly estimated:true;readonly pricingVersion:string}
export interface OpenAIResult<T=string>{readonly output:T;readonly provider:"openai";readonly model:string;readonly latencyMs:number;readonly usage:TokenUsage;readonly cost:CostEstimate;readonly recommendationOnly:true;readonly executionAllowed:false}
export interface ModerationResult{readonly flagged:boolean;readonly categories:readonly string[]}
export type OpenAIHealthDiagnostic="connected"|"missing_api_key"|"invalid_api_key"|"authentication_failed"|"billing_required"|"insufficient_quota"|"rate_limited"|"model_unavailable"|"network_error"|"timeout"|"provider_unavailable"|"provider_exception";
export interface OpenAIHealth{readonly state:"healthy"|"unavailable"|"degraded";readonly connected:boolean;readonly model:string;readonly latencyMs:number|null;readonly quota:"available"|"limited"|"unknown";readonly version:string;readonly diagnostic:OpenAIHealthDiagnostic;readonly reason?:string}
export interface OpenAITelemetry{readonly requests:number;readonly successes:number;readonly failures:number;readonly successRate:number|null;readonly promptTokens:number;readonly completionTokens:number;readonly estimatedSpend:number;readonly averageLatencyMs:number|null;readonly lastCall:string|null}
export interface ProviderAssignment{readonly employee:AIEmployeeCode;readonly provider:"deterministic"|"openai";readonly model:string|null;readonly source:"workspace-configuration"|"default"}
export interface OpenAICapability{readonly id:"chat"|"responses"|"embeddings"|"summarize"|"recommend"|"classify"|"extract"|"moderate"|"countTokens"|"estimateCost"|"streaming";readonly available:boolean}
export interface AIRecommendationOutput{readonly title:string;readonly rationale:string;readonly action:"review";readonly recommendationOnly:true;readonly executionAllowed:false;readonly approvalRequired:true}
export interface ClassifiedOutput{readonly label:string;readonly confidence:number}
export interface ExtractedOutput{readonly values:Readonly<Record<string,string|number|boolean|null>>}
