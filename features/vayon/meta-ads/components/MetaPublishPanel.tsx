"use client";
import { requestMetaCampaignPublishAction } from "../actions";
import type { MetaCampaignPublishExecution, MetaProviderObject } from "../meta-ads.types";
import { Button } from "@/features/platform/design-system";

const card = "rounded-2xl border border-vds-border bg-vds-surface p-5";
const statusBadge = (status: string) => {
  const tone =
    status === "succeeded"
      ? "bg-vds-primary-soft text-vds-primary"
      : status === "failed" || status === "partial_failure" || status === "uncertain"
        ? "bg-vds-warning-soft text-vds-warning"
        : "bg-vds-elevated text-vds-muted";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${tone}`}>{status.replace(/_/g, " ")}</span>;
};

/**
 * ADS-B3 minimum UI foundation. No button here sends a real request to
 * Meta directly -- this panel only lets a human REQUEST a publish attempt
 * (which still requires the write flag to be enabled, which it never is
 * in this phase) and shows the resulting work-order state. No provider
 * credentials are ever rendered here.
 */
export function MetaPublishPanel({
  campaignId,
  channelExecutionId,
  execution,
  providerObjects,
}: {
  readonly campaignId: string;
  readonly channelExecutionId: string;
  readonly execution: MetaCampaignPublishExecution | null;
  readonly providerObjects: readonly MetaProviderObject[];
}) {
  return (
    <div className={`${card} space-y-3`}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase text-vds-muted">Meta publish</h4>
        {execution ? statusBadge(execution.status) : statusBadge("pending")}
      </div>

      {!execution && (
        <form action={requestMetaCampaignPublishAction}>
          <input type="hidden" name="campaignId" value={campaignId} />
          <input type="hidden" name="channelExecutionId" value={channelExecutionId} />
          <input type="hidden" name="objective" value="lead_generation" />
          <Button type="submit" variant="secondary">Request Meta publish</Button>
        </form>
      )}

      {execution?.lastErrorMessage && (
        <p className="text-sm text-vds-warning">{execution.lastErrorMessage}</p>
      )}

      {providerObjects.length > 0 && (
        <ul className="space-y-1 text-sm">
          {providerObjects.map((obj) => (
            <li key={obj.id} className="flex items-center justify-between">
              <span>{obj.objectType}</span>
              {statusBadge(obj.status)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
