/**
 * Part 8: copy creative evaluation interface. Character-limit checks are
 * driven by an INJECTED config, never a hardcoded provider constant -- no
 * current Meta/Google character-limit value exists anywhere in this
 * repository (confirmed by Part 1's audit), so inventing one here would be
 * exactly the "fake scientific certainty" Part 4 forbids. Callers that
 * need real limits must supply them; absent a config, length checks are
 * skipped and the result says EXTERNAL POLICY VERIFICATION REQUIRED rather
 * than silently passing.
 */

export interface CopyLengthLimits {
  readonly headline: number | null;
  readonly primaryText: number | null;
  readonly description: number | null;
  readonly cta: number | null;
}

export interface CopyEvaluationInput {
  readonly headline: string | null;
  readonly primaryText: string | null;
  readonly description: string | null;
  readonly cta: string | null;
  readonly limits?: CopyLengthLimits;
}

export interface CopyEvaluationResult {
  readonly lengthViolations: readonly { readonly field: string; readonly length: number; readonly limit: number }[];
  readonly lengthCheckSkipped: boolean;
  readonly clarityScore: number;
  readonly duplicationDetected: boolean;
  readonly tone: "professional" | "casual" | "urgent" | "unknown";
  readonly ctaPresent: boolean;
  readonly policyRiskMarkers: readonly string[];
  readonly provider: string;
  readonly model: string;
}

export interface CopyEvaluationProvider {
  evaluate(input: CopyEvaluationInput): Promise<CopyEvaluationResult>;
}

const riskWords = ["guaranteed", "risk-free", "no risk", "best in the world", "sold out fast"];

export class MockCopyEvaluationProvider implements CopyEvaluationProvider {
  async evaluate(input: CopyEvaluationInput): Promise<CopyEvaluationResult> {
    const fields: readonly { readonly field: string; readonly text: string | null; readonly limit: number | null }[] = [
      { field: "headline", text: input.headline, limit: input.limits?.headline ?? null },
      { field: "primaryText", text: input.primaryText, limit: input.limits?.primaryText ?? null },
      { field: "description", text: input.description, limit: input.limits?.description ?? null },
      { field: "cta", text: input.cta, limit: input.limits?.cta ?? null },
    ];

    const lengthCheckSkipped = !input.limits;
    const lengthViolations = lengthCheckSkipped
      ? []
      : fields
          .filter((f) => f.text && f.limit !== null && f.text.length > f.limit)
          .map((f) => ({ field: f.field, length: f.text!.length, limit: f.limit! }));

    const allText = [input.headline, input.primaryText, input.description].filter(Boolean).join(" ").toLowerCase();
    const policyRiskMarkers = riskWords.filter((w) => allText.includes(w));

    return {
      lengthViolations,
      lengthCheckSkipped,
      clarityScore: allText.length > 0 ? 75 : 0,
      duplicationDetected: Boolean(input.headline && input.primaryText && input.headline.trim() === input.primaryText.trim()),
      tone: allText.length > 0 ? "professional" : "unknown",
      ctaPresent: Boolean(input.cta && input.cta.trim().length > 0),
      policyRiskMarkers,
      provider: "mock",
      model: "mock-copy-v1",
    };
  }
}
