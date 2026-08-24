import type { PermissionDecision } from "./types";
export class WorkspacePermissionError extends Error{readonly status=403;constructor(readonly decision:PermissionDecision){super("You do not have permission to perform this action.");this.name="WorkspacePermissionError"}}
