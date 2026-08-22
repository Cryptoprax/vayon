"use client";
import type {
  DocumentationEvent,
  DocumentationProvider,
} from "../contracts/documentation";
export class DocumentationObservabilityProvider {
  async record(event: DocumentationEvent) {
    await fetch("/api/documentation/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(event),
      keepalive: true,
    }).catch(() => undefined);
  }
}
export type { DocumentationProvider };
