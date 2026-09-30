/**
 * Phase M8: pure, deterministic detection of an explicit WhatsApp marketing
 * opt-out. No I/O, no AI/LLM, no fuzzy or substring matching -- the entire
 * trimmed, normalized message must exactly equal one of a small, explicit
 * keyword/phrase set (Part 2/3). "don't stop sending the brochure", "when
 * does the offer end?", and "quit claim deed" all correctly do NOT match,
 * because STOP/END/QUIT appear only as a substring of a longer message, not
 * as the whole message.
 *
 * No existing keyword/opt-out policy was found anywhere in the repository
 * (confirmed during Phase M6's own consent-model audit) -- this is a new,
 * deliberately small V1 list, not a codification of a pre-existing product
 * convention.
 */
export const whatsappOptOutKeywords = ["stop", "unsubscribe", "cancel", "end", "quit"] as const;

/**
 * A small set of common explicit phrases beyond single keywords (Part 3).
 * Still whole-message exact matching only -- no fuzzy intent classification.
 * Kept conservative and short: this is a judgment call, not a codified
 * product policy, since none existed to defer to.
 */
export const whatsappOptOutPhrases = ["stop messages", "do not contact me", "don't contact me", "unsubscribe me"] as const;

/** Trims, lowercases, and strips at most one trailing sentence-ending punctuation mark (e.g. "Stop." / "STOP!") -- never strips interior punctuation, never fuzzy-normalizes. */
function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/[.!?]+$/, "");
}

export function isExplicitWhatsAppOptOut(text: unknown): boolean {
  if (typeof text !== "string") return false;
  const normalized = normalize(text);
  if (!normalized) return false;
  return (whatsappOptOutKeywords as readonly string[]).includes(normalized) || (whatsappOptOutPhrases as readonly string[]).includes(normalized);
}
