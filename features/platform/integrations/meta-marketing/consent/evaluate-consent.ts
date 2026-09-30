/**
 * Phase M6: pure, deterministic evaluation of a Meta Lead Form's preserved
 * custom answers against an admin-configured consent rule. No I/O, no Meta
 * call, no AI/LLM, no fuzzy or name-based inference (Part 8) -- exact
 * (trimmed, case-insensitive) field-name and value matching only. A rule is
 * always required as input: this function never decides "is there even a
 * rule" -- that is the caller's job (Part 5's "no automatic inference"
 * discipline lives one level up, in the processor that looks up the rule).
 */
export interface ConsentCustomAnswer {
  readonly fieldName: string;
  readonly values: readonly string[];
}

export interface MetaConsentRule {
  readonly id: string;
  readonly consentFieldName: string;
  readonly acceptedValues: readonly string[];
  readonly consentStatement: string;
  readonly version: number;
}

export type ConsentEvaluationOutcome = "granted" | "not_granted" | "unverifiable";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Returns "unverifiable" when the configured field is absent or empty in
 * this submission (Part 8: "if field absent: not granted / unverifiable
 * according to model" -- this model chooses unverifiable, since an absent
 * field is a different situation from an explicit negative answer).
 * Returns "granted" only on an exact match (after trim+lowercase) against
 * one of the rule's accepted values; any other present value is
 * "not_granted".
 */
export function evaluateMetaLeadConsent(input: {
  readonly customAnswers: readonly ConsentCustomAnswer[];
  readonly rule: MetaConsentRule;
}): ConsentEvaluationOutcome {
  const targetField = normalize(input.rule.consentFieldName);
  const field = input.customAnswers.find((answer) => normalize(answer.fieldName) === targetField);
  const value = field?.values[0];
  if (!field || !value || value.trim().length === 0) return "unverifiable";

  const accepted = input.rule.acceptedValues.map(normalize);
  return accepted.includes(normalize(value)) ? "granted" : "not_granted";
}
