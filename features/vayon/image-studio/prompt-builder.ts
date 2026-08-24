import type { ImageGenerationRequest, ImageStudioSnapshot } from "./types";
export function buildImagePrompt(
  input: ImageGenerationRequest,
  brand: ImageStudioSnapshot["brand"],
  campaign: string | null,
) {
  const line = (label: string, value: string | readonly string[] | null) =>
    `${label}: ${Array.isArray(value) ? value.join(", ") : value || "Not supplied"}`;
  return [
    input.prompt,
    line("Image type", input.type),
    line("Visual style", input.style),
    line("Campaign context", campaign),
    line("Brand", brand?.name ?? null),
    line("Brand colours", brand?.colors ?? []),
    line("Logo reference", brand?.logoPath ?? null),
    line("Typography guidance", brand?.typography ?? []),
    line("Brand style", brand?.tone ?? null),
    "Visual identity policy: apply supplied brand guidance without inventing logos, claims, products, people, or locations.",
    "Output: a polished editable draft for human brand review.",
  ].join("\n");
}
