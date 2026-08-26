export const ttfvMilestones = ["workspace_created", "first_ai_employee", "first_crm_contact", "first_campaign", "first_proposal", "first_upgrade", "first_property", "first_project", "first_appointment", "first_product_import"] as const;
export type TtfvMilestone = (typeof ttfvMilestones)[number];
export type TtfvEvent = { milestone: TtfvMilestone; occurredAt: string; path: string };
export const ttfvStorageKey = "vayon.ttfv.events.v1";
export const ttfvEventName = "vayon:ttfv:recorded";

export function readTtfvEvents(): TtfvEvent[] {
  try { return JSON.parse(localStorage.getItem(ttfvStorageKey) ?? "[]") as TtfvEvent[]; } catch { return []; }
}

export function recordTtfvMilestone(milestone: TtfvMilestone, path: string) {
  const current = readTtfvEvents();
  if (current.some((item) => item.milestone === milestone)) return;
  const next = [...current, { milestone, occurredAt: new Date().toISOString(), path }];
  try { localStorage.setItem(ttfvStorageKey, JSON.stringify(next)); } catch { /* Measurement remains optional. */ }
  window.dispatchEvent(new CustomEvent(ttfvEventName, { detail: next.at(-1) }));
}
