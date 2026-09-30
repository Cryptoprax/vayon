"use client";
import { Button } from "@/features/platform/design-system";
import {
  selectCampaignChannelAction,
  advanceCampaignChannelStatusAction,
  saveCampaignBudgetIntentAction,
  acceptCampaignBudgetIntentAction,
  saveCampaignTargetingIntentAction,
} from "../actions";
import type { CampaignBudgetIntent, CampaignChannelExecution, CampaignTargetingIntent, ChannelProvider } from "../campaign-channels.types";

const card = "rounded-2xl border border-vds-border bg-vds-surface p-5";
const statusBadge = (status: string) => {
  const tone =
    status === "active" || status === "completed"
      ? "bg-vds-primary-soft text-vds-primary"
      : status === "failed" || status === "uncertain"
        ? "bg-vds-warning-soft text-vds-warning"
        : "bg-vds-elevated text-vds-muted";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${tone}`}>{status.replace(/_/g, " ")}</span>;
};

const CHANNELS: readonly ChannelProvider[] = ["meta", "google"];

/**
 * ADS-B1 minimum UI foundation (Part 13). This is not the final campaign
 * wizard, and no button here publishes anything -- Meta/Google adapters are
 * absent by design (Part 12). "Ready for review" only records a
 * provider-neutral status; approval and any real publish transition happen
 * through D1's own approval flow and a future C7 worker, never from this
 * panel.
 */
export function CampaignChannelPanel({
  campaignId,
  publishingStatus,
  executions,
  budgetIntents,
  targetingIntent,
}: {
  readonly campaignId: string;
  readonly publishingStatus: string;
  readonly executions: readonly CampaignChannelExecution[];
  readonly budgetIntents: readonly CampaignBudgetIntent[];
  readonly targetingIntent: CampaignTargetingIntent | null;
}) {
  const selectedProviders = new Set(executions.map((e) => e.provider));
  const activeBudget = budgetIntents.find((b) => b.status === "approved") ?? budgetIntents[0] ?? null;

  return (
    <div className="space-y-5">
      <div className={`${card} flex items-center justify-between`}>
        <h3 className="font-semibold">Campaign</h3>
        {statusBadge(publishingStatus)}
      </div>

      <div className={card}>
        <h4 className="text-xs font-semibold uppercase text-vds-muted">Channel selection</h4>
        <div className="mt-2 flex gap-2">
          {CHANNELS.map((provider) => (
            <form key={provider} action={selectCampaignChannelAction}>
              <input type="hidden" name="campaignId" value={campaignId} />
              <input type="hidden" name="provider" value={provider} />
              <Button type="submit" variant={selectedProviders.has(provider) ? "control" : "secondary"} disabled={selectedProviders.has(provider)}>
                {selectedProviders.has(provider) ? `${provider} selected` : `Select ${provider}`}
              </Button>
            </form>
          ))}
        </div>

        <ul className="mt-4 space-y-2">
          {executions.map((execution) => (
            <li key={execution.id} className="flex items-center justify-between rounded-xl border border-vds-border p-3">
              <div>
                <p className="text-sm font-medium">{execution.provider}</p>
                <p className="text-xs text-vds-muted">
                  {execution.providerCampaignId ? `Provider campaign: ${execution.providerCampaignId}` : "Not yet published"}
                  {execution.publishAttemptCount > 0 ? ` · ${execution.publishAttemptCount} attempt(s)` : ""}
                </p>
                {execution.lastErrorMessage && <p className="text-xs text-vds-warning">{execution.lastErrorMessage}</p>}
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(execution.status)}
                {execution.status === "draft" && (
                  <form action={advanceCampaignChannelStatusAction}>
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <input type="hidden" name="executionId" value={execution.id} />
                    <input type="hidden" name="status" value="ready_for_review" />
                    <Button type="submit" variant="secondary">Mark ready for review</Button>
                  </form>
                )}
              </div>
            </li>
          ))}
          {executions.length === 0 && <p className="text-sm text-vds-muted">No channel selected yet.</p>}
        </ul>
      </div>

      <div className={card}>
        <h4 className="text-xs font-semibold uppercase text-vds-muted">Budget intent</h4>
        {activeBudget && (
          <p className="mt-1 text-sm">
            {activeBudget.status === "approved" ? "Approved: " : "Draft: "}
            {activeBudget.dailyBudget ? `${activeBudget.dailyBudget} ${activeBudget.currency}/day` : `${activeBudget.lifetimeBudget} ${activeBudget.currency} lifetime`}
          </p>
        )}
        <form action={saveCampaignBudgetIntentAction} className="mt-3 grid grid-cols-2 gap-2">
          <input type="hidden" name="campaignId" value={campaignId} />
          <input name="currency" placeholder="Currency (e.g. INR)" className="rounded-lg border border-vds-border px-3 py-2 text-sm" required />
          <input name="dailyBudget" placeholder="Daily budget" className="rounded-lg border border-vds-border px-3 py-2 text-sm" />
          <input name="lifetimeBudget" placeholder="Lifetime budget" className="rounded-lg border border-vds-border px-3 py-2 text-sm" />
          <input name="startAt" type="date" className="rounded-lg border border-vds-border px-3 py-2 text-sm" />
          <input name="endAt" type="date" className="rounded-lg border border-vds-border px-3 py-2 text-sm" />
          <Button type="submit" variant="secondary" className="col-span-2">Save budget draft</Button>
        </form>
        {activeBudget && activeBudget.status === "draft" && (
          <form action={acceptCampaignBudgetIntentAction} className="mt-2">
            <input type="hidden" name="campaignId" value={campaignId} />
            <input type="hidden" name="intentId" value={activeBudget.id} />
            <Button type="submit" variant="control">Approve budget (requires D1 approval)</Button>
          </form>
        )}
      </div>

      <div className={card}>
        <h4 className="text-xs font-semibold uppercase text-vds-muted">Targeting intent</h4>
        {targetingIntent && (
          <p className="mt-1 text-sm text-vds-muted">
            {[targetingIntent.city, targetingIntent.region, targetingIntent.country].filter(Boolean).join(", ") || "No geography set"} ·{" "}
            {targetingIntent.objective ?? "No objective set"}
          </p>
        )}
        <form action={saveCampaignTargetingIntentAction} className="mt-3 grid grid-cols-2 gap-2">
          <input type="hidden" name="campaignId" value={campaignId} />
          <input name="country" placeholder="Country" defaultValue={targetingIntent?.country ?? ""} className="rounded-lg border border-vds-border px-3 py-2 text-sm" />
          <input name="region" placeholder="Region" defaultValue={targetingIntent?.region ?? ""} className="rounded-lg border border-vds-border px-3 py-2 text-sm" />
          <input name="city" placeholder="City" defaultValue={targetingIntent?.city ?? ""} className="rounded-lg border border-vds-border px-3 py-2 text-sm" />
          <input name="language" placeholder="Language" defaultValue={targetingIntent?.language ?? ""} className="rounded-lg border border-vds-border px-3 py-2 text-sm" />
          <input name="buyerPersona" placeholder="Buyer persona" defaultValue={targetingIntent?.buyerPersona ?? ""} className="rounded-lg border border-vds-border px-3 py-2 text-sm" />
          <input name="propertyType" placeholder="Property type" defaultValue={targetingIntent?.propertyType ?? ""} className="rounded-lg border border-vds-border px-3 py-2 text-sm" />
          <input name="budgetRangeLow" placeholder="Audience budget low" defaultValue={targetingIntent?.budgetRangeLow ?? ""} className="rounded-lg border border-vds-border px-3 py-2 text-sm" />
          <input name="budgetRangeHigh" placeholder="Audience budget high" defaultValue={targetingIntent?.budgetRangeHigh ?? ""} className="rounded-lg border border-vds-border px-3 py-2 text-sm" />
          <input name="objective" placeholder="Objective" defaultValue={targetingIntent?.objective ?? ""} className="col-span-2 rounded-lg border border-vds-border px-3 py-2 text-sm" />
          <Button type="submit" variant="secondary" className="col-span-2">Save targeting intent</Button>
        </form>
      </div>
    </div>
  );
}
