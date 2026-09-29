import type { AIEmployeeCode, CostEstimate, OpenAIHealth, TokenUsage } from "../domain/models";

export type EmployeeRuntimeStatus = "online" | "processing" | "idle" | "error";
export interface WorkforceConversation { readonly id: string; readonly employee: AIEmployeeCode; readonly title: string; readonly createdAt: string; readonly updatedAt: string; }
/** Stable, non-sensitive source reference persisted with an AI answer (never document text or storage paths). */
export interface PersistedSourceRef { readonly type: "property" | "price_revision" | "property_document"; readonly id: string; readonly citation: string; readonly title: string; readonly propertyId: string; readonly documentType?: string; readonly version?: number; }
export interface WorkforceMessage { readonly id: string; readonly conversationId: string; readonly role: "user" | "assistant"; readonly content: string; readonly model: string | null; readonly usage: TokenUsage | null; readonly cost: CostEstimate | null; readonly latencyMs: number | null; readonly createdAt: string; readonly recommendationOnly: true; readonly sourceRefs?: readonly PersistedSourceRef[]; }
export interface ConversationSnapshot { readonly conversations: readonly WorkforceConversation[]; readonly messages: readonly WorkforceMessage[]; }
export interface RuntimeChatInput { readonly employee: AIEmployeeCode; readonly conversationId?: string; readonly message: string; readonly contextRefs?: readonly { type: "crm" | "gmail" | "calendar" | "whatsapp" | "deal" | "task"; id: string }[]; readonly propertyId?: string; readonly leadId?: string; }
export interface RuntimeUsageSummary { readonly estimatedCost: number; readonly lastResponse: string | null; readonly latencyMs: number | null; readonly model: string | null; }
export interface WorkforceRuntimeObservability extends RuntimeUsageSummary { readonly provider: "openai" | "deterministic"; readonly health: OpenAIHealth; }
