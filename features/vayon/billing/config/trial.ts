/** Workspace trial presentation uses only persisted subscription entitlement dates. */
export const WORKSPACE_TRIAL_DAYS = 3;
export const workspaceTrialLimits = { properties: 1, leads: 2, companies: 1, members: 1 } as const;

export function trialState(status: string | undefined, endsAt: string | undefined | null, now = Date.now(), redeemedAt?: string | null) {
  if (status !== "trialing") return { trial: false, expired: false, daysRemaining: null, day: null, totalDays: null };
  const end = Date.parse(endsAt ?? "");
  if (!Number.isFinite(end)) return { trial: false, expired: false, daysRemaining: null, day: null, totalDays: null };
  const expired = end <= now;
  const daysRemaining = Math.max(0, Math.ceil((end - now) / 86_400_000));
  const start = Date.parse(redeemedAt ?? "");
  const totalDays = Number.isFinite(start) ? Math.max(1, Math.ceil((end - start) / 86_400_000)) : null;
  const day = totalDays === null ? null : Math.min(totalDays, Math.max(1, totalDays - daysRemaining + 1));
  return { trial: !expired, expired, daysRemaining, day, totalDays };
}
