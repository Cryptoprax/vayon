export const videoOutputs = [
  "15 Second Advertisement",
  "30 Second Advertisement",
  "60 Second Commercial",
  "Product Demonstration",
  "Website Hero Video",
  "Corporate Introduction",
  "Investor Video",
  "Instagram Reel",
  "Facebook Video",
  "LinkedIn Video",
  "YouTube Short",
] as const;
export type VideoOutput = (typeof videoOutputs)[number];
export const videoEditOperations = [
  "Scene replacement",
  "Voice replacement",
  "Subtitle editing",
  "Music replacement",
  "Timeline trimming",
  "Duration adjustment",
  "Brand updates",
] as const;
export type VideoEditOperation = (typeof videoEditOperations)[number];
export interface VideoWizardInput {
  readonly prompt: string;
  readonly company: string;
  readonly industry: string;
  readonly audience: string;
  readonly language: string;
  readonly brandId: string | null;
  readonly campaignId: string | null;
  readonly projectId: string | null;
  readonly duration: 15 | 30 | 60;
  readonly aspectRatio: "Landscape" | "Portrait" | "Square";
  readonly platform: string;
  readonly tone: string;
  readonly musicStyle: string;
  readonly voiceStyle: string;
  readonly callToAction: string;
  readonly output: VideoOutput;
}
export interface VideoStudioSnapshot {
  readonly videos: readonly {
    id: string;
    name: string;
    projectId: string;
    campaignId: string;
    version: number;
    createdAt: string;
  }[];
  readonly projects: readonly { id: string; name: string }[];
  readonly campaigns: readonly { id: string; name: string }[];
  readonly brand: {
    readonly id: string;
    readonly name: string;
    readonly colours: readonly string[];
    readonly typography: readonly string[];
    readonly logo: string | null;
    readonly visualIdentity: string;
    readonly motionStyle: string;
    readonly voice: string;
  } | null;
  readonly providerState: "available" | "unavailable";
  readonly providerReason: string;
  readonly outputs: typeof videoOutputs;
  readonly edits: typeof videoEditOperations;
  readonly exports: readonly [
    "MP4",
    "MOV",
    "WEBM",
    "GIF Preview",
    "Storyboard PDF",
    "Subtitle SRT",
  ];
  readonly pipeline: readonly string[];
}
export interface VideoSubmission {
  readonly status:
    | "WaitingProvider"
    | "WaitingApproval"
    | "Completed"
    | "Failed"
    | "Cancelled";
  readonly assetId: string | null;
  readonly provider: string | null;
  readonly latencyMs: number | null;
  readonly estimatedCost: number | null;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}
