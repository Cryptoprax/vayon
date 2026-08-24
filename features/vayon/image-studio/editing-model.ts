import type { AiEditOperation, EditTool } from "./types";
export interface ImageEditCommand {
  readonly id: string;
  readonly assetId: string;
  readonly kind: "manual" | "ai";
  readonly operation: EditTool | AiEditOperation;
  readonly createdAt: string;
  readonly actorId: string;
  readonly state: "draft" | "waiting_approval" | "approved" | "rejected";
  readonly version: number;
}
export interface ImageLayer {
  readonly id: string;
  readonly name: string;
  readonly visible: boolean;
  readonly locked: boolean;
  readonly opacity: number;
  readonly order: number;
}
export interface ImageEditSession {
  readonly assetId: string;
  readonly layers: readonly ImageLayer[];
  readonly history: readonly ImageEditCommand[];
  readonly cursor: number;
  readonly dirty: boolean;
  readonly autosave: "prepared";
}
