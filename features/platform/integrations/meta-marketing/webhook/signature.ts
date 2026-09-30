import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Meta App webhook signature verification (X-Hub-Signature-256, HMAC-SHA256
 * over the raw request body, sha256=<hex>), fails closed on a missing secret
 * or missing/malformed header. This is a deliberate copy of the same proven
 * algorithm WhatsAppService.verifySignature() already uses -- Phase M0/M3's
 * own instruction was to mirror the proven pattern "without destabilizing
 * WhatsApp", so this is a new, standalone function rather than a refactor of
 * the existing, already-tested whatsapp.service.ts. Both webhook domains
 * verify signatures identically because both are subscriptions on the same
 * kind of Meta App infrastructure; they are still kept as two call sites so
 * a future change to one can never silently affect the other.
 */
export function verifyMetaSignature(raw: string, signatureHeader: string, secret: string | undefined): boolean {
  if (!secret || !signatureHeader.startsWith("sha256=")) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(raw).digest("hex"));
  const actual = Buffer.from(signatureHeader.slice(7));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
