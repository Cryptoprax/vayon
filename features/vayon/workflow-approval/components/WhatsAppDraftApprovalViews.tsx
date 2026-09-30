import { Button } from "@/features/platform/design-system";
import Link from "next/link";
import type { ApprovalEvent, ApprovalRecord } from "../domain/approval";
import { approveWhatsAppDraftAction, rejectWhatsAppDraftAction } from "../actions/whatsapp-approval.actions";
import type { PersistedSourceRef } from "@/features/platform/openai/runtime/models";

const card = "rounded-2xl border border-vds-border bg-vds-surface p-5";

/**
 * Phase E4's minimal review surface -- deliberately separate from
 * GovernanceViews.tsx's ApprovalRequestList/ApprovalRequestDetail, whose
 * forms post to approveApprovalAction/rejectApprovalAction (gated by
 * the commercial Approval Workflows entitlement, Business+). Reusing those components here
 * would either wrongly gate WhatsApp draft review behind the Business+
 * commercial entitlement, or require modifying GovernanceViews.tsx's forms
 * to accept the action as a prop -- a bigger, riskier change to an existing
 * D1 file than this phase needs. This file only renders whatsapp_ai_draft
 * approvals; it never lists or links to a general approval.
 */
export function WhatsAppDraftApprovalList({ items }: { items: readonly ApprovalRecord[] }) {
  return (
    <div className="space-y-3">
      {items.length ? (
        items.map((item) => (
          <Link href={`/vayon/whatsapp/approvals/${item.id}`} key={item.id} className={`${card} block`}>
            <div className="flex justify-between">
              <h2 className="font-medium">AI draft reply</h2>
              <span className="text-xs capitalize">{item.status}</span>
            </div>
            <p className="mt-2 text-sm text-vds-muted">{String(item.payload.previewText ?? "")}</p>
            <p className="mt-3 text-xs text-vds-muted">Requested {new Date(item.requestedAt).toLocaleString()}</p>
          </Link>
        ))
      ) : (
        <p className="text-sm text-vds-muted">No WhatsApp AI drafts are waiting for review.</p>
      )}
    </div>
  );
}

export type WhatsAppDraftSendState = "not_applicable" | "eligible" | "failed_retryable" | "claimed" | "uncertain" | "sent";

const sourceTypeLabel: Record<PersistedSourceRef["type"], string> = { property: "Property record", price_revision: "Approved price revision", property_document: "Document" };
function sourceHref(ref: PersistedSourceRef) {
  const base = `/vayon/properties/${encodeURIComponent(ref.propertyId)}`;
  return ref.type === "property_document" ? `${base}/documents/${encodeURIComponent(ref.id)}` : `${base}?tab=pricing`;
}
/**
 * K6 completion (Part 3): read-only, tenant-safe source list for a grounded
 * WhatsApp draft, reusing K5's chat-panel source pattern (id-based links,
 * generic type labels, no storage path or signed URL ever rendered). Purely
 * informational -- it changes no approval or send behavior.
 */
function DraftSources({ refs }: { refs: readonly PersistedSourceRef[] }) {
  if (!refs.length) return null;
  return (
    <div className="mt-4 text-xs">
      <p className="font-semibold text-vds-primary">Sources</p>
      <ul className="mt-1 space-y-1">
        {refs.map((ref) => (
          <li key={ref.citation}><Link href={sourceHref(ref)} className="underline">{ref.title}</Link> <span className="text-vds-muted">· {sourceTypeLabel[ref.type] ?? "Source"}</span></li>
        ))}
      </ul>
    </div>
  );
}

export function WhatsAppDraftApprovalDetail({
  item,
  events,
  canDecide,
  sendState,
  sourceRefs = [],
}: {
  item: ApprovalRecord;
  events: readonly ApprovalEvent[];
  canDecide: boolean;
  sendState: WhatsAppDraftSendState;
  sourceRefs?: readonly PersistedSourceRef[];
}) {
  const sent = sendState === "sent";
  return (
    <div className="space-y-5">
      <section className={card}>
        <h2 className="font-semibold">{sent ? "AI-generated WhatsApp reply (sent)" : "AI-generated WhatsApp reply (not sent)"}</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm">{String(item.payload.previewText ?? "")}</p>
        <p className="mt-4 text-xs text-vds-muted">
          Status: {sent ? "sent" : item.status} · Requested {new Date(item.requestedAt).toLocaleString()}
          {item.decidedAt ? ` · Decided ${new Date(item.decidedAt).toLocaleString()}` : ""}
        </p>
        {item.reason ? <p className="mt-2 text-xs text-vds-muted">Reason: {item.reason}</p> : null}
        <DraftSources refs={sourceRefs} />
        {!sent && (
          <p className="mt-4 text-xs text-vds-muted">
            This reply has not been sent to WhatsApp. Approving it only marks it eligible for a future, separate send step.
          </p>
        )}
        {item.status === "pending" && canDecide && (
          <div className="mt-5 flex flex-wrap gap-2">
            <form action={approveWhatsAppDraftAction}>
              <input type="hidden" name="approvalId" value={item.id} />
              <input type="hidden" name="version" value={item.version} />
              <Button type="submit" variant="primary">Approve</Button>
            </form>
            <form action={rejectWhatsAppDraftAction}>
              <input type="hidden" name="approvalId" value={item.id} />
              <input type="hidden" name="version" value={item.version} />
              <Button type="submit" variant="ghost" className="text-vds-danger">Reject</Button>
            </form>
          </div>
        )}
        {item.status === "approved" && sendState === "failed_retryable" && (
          <p className="mt-5 text-sm text-vds-muted">The previous delivery attempt failed. A send retry is not available on this review surface yet.</p>
        )}
        {item.status === "approved" && sendState === "claimed" && (
          <p className="mt-5 text-sm text-vds-muted">Sending…</p>
        )}
        {item.status === "approved" && sendState === "uncertain" && (
          <p className="mt-5 rounded-xl border border-vds-danger bg-vds-danger-soft p-3 text-sm font-medium text-vds-danger">
            Delivery status could not be confirmed. Do not resend until the conversation is checked.
          </p>
        )}
        {item.status === "approved" && sent && (
          <p className="mt-5 text-sm font-medium text-vds-primary">Sent to WhatsApp.</p>
        )}
      </section>
      <section>
        <h2 className="mb-3 font-semibold">History</h2>
        <div className="space-y-3">
          {events.length ? (
            events.map((event) => (
              <article key={event.id} className={`${card} border-l-2 border-l-vds-primary`}>
                <p className="font-medium">{event.event}</p>
                <p className="mt-1 text-xs text-vds-muted">{new Date(event.occurredAt).toLocaleString()}</p>
              </article>
            ))
          ) : (
            <p className="text-sm text-vds-muted">No history has been recorded.</p>
          )}
        </div>
      </section>
    </div>
  );
}
