"use client";
import { requestCreativeEvaluationAction } from "../actions";
import { dimensionLabel } from "../scoring";
import type { CreativeEvaluation } from "../ad-brain.types";
import { Button } from "@/features/platform/design-system";

const card = "rounded-2xl border border-vds-border bg-vds-surface p-5";
const statusBadge = (status: string) => {
  const tone =
    status === "passed"
      ? "bg-vds-primary-soft text-vds-primary"
      : status === "rejected" || status === "failed"
        ? "bg-vds-warning-soft text-vds-warning"
        : "bg-vds-elevated text-vds-muted";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${tone}`}>{status.replace(/_/g, " ")}</span>;
};

/**
 * ADS-B2 minimum UI foundation (Part 20). This card only DISPLAYS an
 * evaluation and lets a human request a new one -- it has no provider
 * publish control of any kind, and a "passed" badge here never itself
 * authorizes spend (Part 13: Ad Brain PASS is not a Campaign/Budget
 * approval or a provider publish).
 */
export function CreativeEvaluationPanel({
  campaignId,
  creativeAssetId,
  channelExecutionId,
  evaluation,
}: {
  readonly campaignId: string;
  readonly creativeAssetId: string;
  readonly channelExecutionId: string | null;
  readonly evaluation: CreativeEvaluation | null;
}) {
  return (
    <div className={`${card} space-y-3`}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase text-vds-muted">Creative evaluation</h4>
        {evaluation ? statusBadge(evaluation.status) : statusBadge("pending")}
      </div>

      {!evaluation && (
        <form action={requestCreativeEvaluationAction}>
          <input type="hidden" name="campaignId" value={campaignId} />
          <input type="hidden" name="creativeAssetId" value={creativeAssetId} />
          <input type="hidden" name="channelExecutionId" value={channelExecutionId ?? ""} />
          <Button type="submit" variant="secondary">Request evaluation</Button>
        </form>
      )}

      {evaluation && (
        <>
          {evaluation.blockingIssues.length > 0 && (
            <section className="rounded-xl border border-vds-warning/40 bg-vds-warning-soft p-3">
              <h5 className="text-xs font-semibold uppercase text-vds-warning">Blocking issues</h5>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {evaluation.blockingIssues.map((issue, i) => <li key={i}>{issue.message}</li>)}
              </ul>
            </section>
          )}

          {evaluation.warnings.length > 0 && (
            <section>
              <h5 className="text-xs font-semibold uppercase text-vds-muted">Warnings</h5>
              <ul className="mt-1 list-disc pl-5 text-sm text-vds-muted">
                {evaluation.warnings.map((issue, i) => <li key={i}>{issue.message}</li>)}
              </ul>
            </section>
          )}

          <section>
            <h5 className="text-xs font-semibold uppercase text-vds-muted">Dimensions</h5>
            <ul className="mt-1 space-y-1 text-sm">
              {Object.entries(evaluation.dimensionScores).map(([dimension, value]) => (
                <li key={dimension} className="flex items-center justify-between">
                  <span>{dimensionLabel(dimension as never)}</span>
                  <span className="text-vds-muted">
                    {"state" in value ? value.state : `${value.score}`}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {evaluation.policyFlags.length > 0 && (
            <section>
              <h5 className="text-xs font-semibold uppercase text-vds-muted">Policy flags</h5>
              <ul className="mt-1 list-disc pl-5 text-sm text-vds-muted">
                {evaluation.policyFlags.map((flag, i) => <li key={i}>{flag.message}</li>)}
              </ul>
            </section>
          )}

          {evaluation.recommendations.length > 0 && (
            <section>
              <h5 className="text-xs font-semibold uppercase text-vds-muted">Recommendations</h5>
              <ul className="mt-1 list-disc pl-5 text-sm text-vds-muted">
                {evaluation.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
              </ul>
            </section>
          )}

          {(evaluation.status === "rejected" || evaluation.status === "failed") && (
            <form action={requestCreativeEvaluationAction}>
              <input type="hidden" name="campaignId" value={campaignId} />
              <input type="hidden" name="creativeAssetId" value={creativeAssetId} />
              <input type="hidden" name="channelExecutionId" value={channelExecutionId ?? ""} />
              <Button type="submit" variant="secondary">Re-request evaluation</Button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
