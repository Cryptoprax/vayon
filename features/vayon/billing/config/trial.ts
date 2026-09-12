/** Workspace trial policy. Paid-plan entitlements remain in the existing catalog. */
export const WORKSPACE_TRIAL_DAYS = 3;
export const workspaceTrialLimits = { properties: 1, leads: 2, companies: 1, members: 1 } as const;
export function trialState(status: string | undefined, endsAt: string | undefined | null, now = Date.now()) {
  if (status !== "trialing") return { trial: false, expired: false, daysRemaining: null, day: null };
  const end = Date.parse(endsAt ?? "");
  if (!Number.isFinite(end)) return { trial: true, expired: false, daysRemaining: null, day: null };
  const daysRemaining = Math.max(0, Math.ceil((end - now) / 86_400_000));
  return { trial: true, expired: end <= now, daysRemaining, day: Math.min(3, Math.max(1, 4 - daysRemaining)) };
}
