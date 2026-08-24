import type { VideoStudioSnapshot, VideoWizardInput } from "./types";
export function buildVideoPrompt(
  input: VideoWizardInput,
  brand: VideoStudioSnapshot["brand"],
  campaign: string | null,
  storyboard: string | null,
) {
  const line = (
    label: string,
    value: string | readonly string[] | number | null,
  ) =>
    `${label}: ${Array.isArray(value) ? value.join(", ") : value || "Not supplied"}`;
  return [
    input.prompt,
    line("Company", input.company),
    line("Industry", input.industry),
    line("Audience", input.audience),
    line("Language", input.language),
    line("Campaign context", campaign),
    line("Duration", `${input.duration} seconds`),
    line("Aspect ratio", input.aspectRatio),
    line("Platform", input.platform),
    line("Tone", input.tone),
    line("Music style", input.musicStyle),
    line("Voice style", input.voiceStyle),
    line("Call to action", input.callToAction),
    line("Brand", brand?.name ?? null),
    line("Brand colours", brand?.colours ?? []),
    line("Typography", brand?.typography ?? []),
    line("Logo reference", brand?.logo ?? null),
    line("Visual identity", brand?.visualIdentity ?? null),
    line("Motion style", brand?.motionStyle ?? null),
    line("Brand voice", brand?.voice ?? null),
    line("Approved script and storyboard", storyboard),
    "Never invent products, claims, people, locations, credentials, or legal facts.",
    "Render a private draft for Brand Reviewer approval.",
  ].join("\n");
}
