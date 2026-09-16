function safeFields(fields: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(fields).filter(([key]) => {
    const presenceFlag = /(present|configured)$/i.test(key);
    return presenceFlag || !/(secret|token|password|key)/i.test(key);
  }));
}
function envelope(level: "info" | "error", event: string, fields: Record<string, unknown>) {
  const safe = safeFields(fields);
  return JSON.stringify({ level, event, correlationId: safe.correlationId ?? crypto.randomUUID(), timestamp: new Date().toISOString(), ...safe });
}
export function log(event: string, fields: Record<string, unknown> = {}) { console.info(envelope("info", event, fields)); }
export function logError(event: string, fields: Record<string, unknown> = {}) { console.error(envelope("error", event, fields)); }
export function captureException(error: unknown, context: Record<string, unknown> = {}) { const message = error instanceof Error ? error.message : "Unknown error"; console.error(JSON.stringify({ level: "error", event: "exception", message, correlationId: context.correlationId ?? crypto.randomUUID(), timestamp: new Date().toISOString() })); }
