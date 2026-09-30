import type { DimensionScores, EvaluationTerminalStatus, FactualDimension, Issue, PolicyFlag, QualityDimension } from "./ad-brain.types";
import { FACTUAL_DIMENSIONS } from "./ad-brain.types";

/**
 * Part 11's central invariant: no single overall numeric score may override
 * a factual/policy blocker. A "conflict" factual check, a blocking-severity
 * issue, or a blocking-severity policy flag always forces the outcome to
 * 'rejected' (severity handled at the caller/policy-rule level -- this
 * function itself never receives a reason to downgrade a blocker to a
 * warning). "unknown"/"unverified" facts and warning-level issues can only
 * ever produce 'needs_review' at worst, never 'rejected' on their own --
 * uncertainty is not itself a policy violation. A clean result (no
 * conflicts, no blocking issues, no blocking policy flags, no warnings)
 * is 'passed'.
 */
export function computeOverallStatus(input: {
  readonly dimensionScores: DimensionScores;
  readonly blockingIssues: readonly Issue[];
  readonly warnings: readonly Issue[];
  readonly policyFlags: readonly PolicyFlag[];
}): EvaluationTerminalStatus {
  const hasFactualConflict = FACTUAL_DIMENSIONS.some((dim) => input.dimensionScores[dim]?.state === "conflict");
  const hasBlockingPolicyFlag = input.policyFlags.some((f) => f.severity === "blocking");
  const hasBlockingIssue = input.blockingIssues.length > 0;

  if (hasFactualConflict || hasBlockingPolicyFlag || hasBlockingIssue) {
    return "rejected";
  }

  const hasUnverifiedOrUnknownFact = FACTUAL_DIMENSIONS.some((dim) => {
    const state = input.dimensionScores[dim]?.state;
    return state === "unknown" || state === "unverified";
  });
  const hasWarning = input.warnings.length > 0;
  const hasReviewPolicyFlag = input.policyFlags.some((f) => f.requiresManualReview);

  if (hasUnverifiedOrUnknownFact || hasWarning || hasReviewPolicyFlag) {
    return "needs_review";
  }

  return "passed";
}

export function dimensionLabel(dimension: FactualDimension | QualityDimension): string {
  return dimension
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
