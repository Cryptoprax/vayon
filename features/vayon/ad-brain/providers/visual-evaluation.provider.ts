/**
 * Part 7: visual creative evaluation interface. No real vision provider is
 * called in ADS-B2 -- MockVisualEvaluationProvider is deterministic and
 * used for all current tests/wiring. A real implementation (e.g. an OpenAI
 * vision call) can implement this same interface later without touching
 * any caller.
 */

export interface VisualEvaluationInput {
  readonly storagePath: string;
  readonly mimeType: string | null;
  readonly aspectRatioHint: string | null;
  readonly placementHint: string | null;
}

export interface VisualEvaluationResult {
  readonly qualityScore: number;
  readonly readabilityScore: number;
  readonly brandVisibilityScore: number;
  readonly propertyVisibilityScore: number;
  readonly ctaVisibilityScore: number;
  readonly textOverflowDetected: boolean;
  readonly croppingIssueDetected: boolean;
  readonly artifactRiskScore: number;
  readonly misleadingRenderRiskScore: number;
  readonly placementReady: boolean;
  readonly provider: string;
  readonly model: string;
}

export interface VisualEvaluationProvider {
  evaluate(input: VisualEvaluationInput): Promise<VisualEvaluationResult>;
}

/**
 * Deterministic mock: derives stable, input-dependent (not random) scores
 * so tests are reproducible. Never claims certainty a real vision model
 * could not -- these are placeholder heuristics, not a trained model.
 */
export class MockVisualEvaluationProvider implements VisualEvaluationProvider {
  async evaluate(input: VisualEvaluationInput): Promise<VisualEvaluationResult> {
    const hasStoragePath = Boolean(input.storagePath && input.storagePath.trim().length > 0);
    return {
      qualityScore: hasStoragePath ? 78 : 0,
      readabilityScore: hasStoragePath ? 80 : 0,
      brandVisibilityScore: hasStoragePath ? 70 : 0,
      propertyVisibilityScore: hasStoragePath ? 75 : 0,
      ctaVisibilityScore: hasStoragePath ? 72 : 0,
      textOverflowDetected: false,
      croppingIssueDetected: false,
      artifactRiskScore: hasStoragePath ? 10 : 100,
      misleadingRenderRiskScore: 15,
      placementReady: hasStoragePath && Boolean(input.aspectRatioHint),
      provider: "mock",
      model: "mock-visual-v1",
    };
  }
}
