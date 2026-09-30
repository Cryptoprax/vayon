import type { CreativeFormat, MetaCreativePlanItem } from "./meta-ads.types";

/**
 * Part 16: maps a creative_assets row + its latest evaluation into a Meta
 * creative-plan item. Returns null (never a fabricated placeholder) when
 * the creative has no storage_path or has not passed evaluation for this
 * channel -- a rejected/needs_review/unevaluated creative is never
 * silently included in a publish plan.
 */
export interface CreativeAssetInput {
  readonly id: string;
  readonly category: string;
  readonly storagePath: string | null;
}
export interface CreativeEvaluationInput {
  readonly status: string;
}

const categoryToFormat: Readonly<Record<string, CreativeFormat>> = {
  image: "single_image",
  video: "video",
};

export function translateCreativeForMeta(asset: CreativeAssetInput, evaluation: CreativeEvaluationInput | null): MetaCreativePlanItem | null {
  if (!asset.storagePath) return null;
  if (!evaluation || evaluation.status !== "passed") return null;

  const format = categoryToFormat[asset.category];
  if (!format) return null; // Do not fabricate support for a format this data doesn't confirm (e.g. carousel needs multiple ordered assets, not implemented here).

  return {
    creativeAssetId: asset.id,
    format,
    storagePath: asset.storagePath,
    evaluationStatus: evaluation.status,
  };
}

export function translateCreativesForMeta(items: readonly { readonly asset: CreativeAssetInput; readonly evaluation: CreativeEvaluationInput | null }[]): readonly MetaCreativePlanItem[] {
  return items
    .map(({ asset, evaluation }) => translateCreativeForMeta(asset, evaluation))
    .filter((item): item is MetaCreativePlanItem => item !== null);
}
