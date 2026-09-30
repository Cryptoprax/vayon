/**
 * ADS-B4B (Part 16): pure helper only -- no API call. Given the ad-account
 * fields ADS-B4A2 confirmed (account_status, user_tasks), determines whether
 * a connection is publish-ready. Not wired into M1/M2's existing connection
 * flow in this phase.
 */
export interface AdAccountPublishReadinessInput {
  readonly accountStatus: number;
  readonly userTasks: readonly string[];
}

const ACCOUNT_STATUS_ACTIVE = 1;

export function isAdAccountPublishReady(input: AdAccountPublishReadinessInput): boolean {
  return input.accountStatus === ACCOUNT_STATUS_ACTIVE && input.userTasks.includes("MANAGE");
}
