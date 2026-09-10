export type UniversalSearchScope =
  | "projects"
  | "inventory"
  | "properties"
  | "leads"
  | "deals"
  | "contacts"
  | "companies"
  | "campaigns"
  | "creative-assets"
  | "reports"
  | "meetings"
  | "tasks"
  | "documents"
  | "communications"
  | "employees"
  | "workflows"
  | "analytics"
  | "pages"
  | "navigation"
  | "universal-objects"
  | "business-timeline"
  | "executive-home"
  | "growth"
  | "settings";
export type UniversalBarMode = "search" | "actions" | "ask";
export type UniversalIntentType =
  "search" | "open" | "create" | "navigate" | "recent" | "favorites";
export type UniversalPreviewType =
  | "property"
  | "lead"
  | "deal"
  | "company"
  | "contact"
  | "campaign"
  | "meeting"
  | "task"
  | "document"
  | "timeline-event";
export type UniversalHistoryKind =
  | "recently-viewed"
  | "recently-opened"
  | "recently-searched"
  | "pinned"
  | "favorites";

export interface UniversalIntent {
  readonly type: UniversalIntentType;
  readonly query: string;
  readonly raw: string;
}
export interface UniversalPreviewModel {
  readonly type: UniversalPreviewType;
  readonly title: string;
  readonly subtitle?: string;
  readonly fields: readonly {
    readonly label: string;
    readonly value: string;
  }[];
  readonly state: "available" | "awaiting-data";
}
export interface UniversalBarResult {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly href: string;
  readonly scope: UniversalSearchScope;
  readonly kind: "navigation" | "quick-create" | "record";
  readonly keywords: readonly string[];
  readonly preview?: UniversalPreviewModel;
}
export interface UniversalHistoryItem {
  readonly visits?: number;
  readonly id: string;
  readonly label: string;
  readonly href?: string;
  readonly query?: string;
  readonly kind: UniversalHistoryKind;
  readonly recordedAt: string;
}
export interface AdaptiveSuggestion {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly query?: string;
  readonly href?: string;
}
