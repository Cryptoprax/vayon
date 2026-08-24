import type { BrandConsistencyResult, BrandRecord } from "./types";

export function evaluateBrandConsistency(
  brand: BrandRecord,
): BrandConsistencyResult {
  const missing: string[] = [];
  if (!brand.kit.logoPath) missing.push("Primary logo");
  if (!brand.kit.secondaryLogoPath) missing.push("Secondary logo");
  if (brand.kit.colors.length < 3) missing.push("Complete colour system");
  if (!brand.kit.typography.length && !brand.kit.fonts.length)
    missing.push("Typography system");
  if (!brand.kit.icons.length) missing.push("Icon library");
  if (!brand.kit.emailSignature) missing.push("Email signature");
  const outdated = brand.kit.version < 1 ? ["Brand kit version"] : [];
  const recommendations = [
    ...missing.map(
      (item) => `Add ${item.toLowerCase()} to improve creative consistency.`,
    ),
    ...outdated.map((item) => `Review ${item.toLowerCase()}.`),
  ];
  return {
    score: Math.max(0, 100 - missing.length * 12 - outdated.length * 10),
    missingAssets: missing,
    outdatedAssets: outdated,
    recommendations,
  };
}
