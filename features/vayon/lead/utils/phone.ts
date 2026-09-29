/**
 * Deterministic, dependency-free phone normalization.
 *
 * Two distinct entry points, because they carry different trust/ambiguity
 * guarantees and must not be confused:
 *
 * - normalizeWhatsAppSenderId(): the phone came from Meta's own webhook
 *   `messages[].from` / `contacts[].wa_id` field. WhatsApp always sends this
 *   as a full international MSISDN (digits only, no leading "+"), because
 *   Meta itself has already resolved which country the number belongs to --
 *   there is no ambiguity to guess here, only formatting.
 *
 * - normalizePhoneForMatching(): the phone came from an arbitrary source
 *   (an existing leads.phone/leads.whatsapp value typed by a human, a form
 *   field, etc). These MAY lack country information entirely (e.g. a bare
 *   local number). This function never guesses a country -- an ambiguous
 *   input returns null ("unresolved") rather than being silently assigned
 *   one, per the explicit instruction not to invent a default country.
 *
 * No phone-parsing library is used: neither entry point needs one. The
 * trusted-MSISDN case only needs format validation (Meta has already done
 * the hard part), and the ambiguous case is intentionally NOT resolved here
 * rather than resolved via a library's heuristic (and therefore sometimes
 * wrong) country-guessing default.
 */

const MIN_E164_DIGITS = 8;
const MAX_E164_DIGITS = 15;

function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

/**
 * Normalizes a WhatsApp sender id (Meta's `wa_id`/`from` field) into E.164
 * ("+<digits>"). Returns null if the input is not a plausible MSISDN --
 * this function never fabricates or reinterprets the value.
 */
export function normalizeWhatsAppSenderId(waId: string): string | null {
  if (typeof waId !== "string") return null;
  const trimmed = waId.trim();
  if (!trimmed || trimmed.length > 32) return null;
  const digits = digitsOnly(trimmed);
  if (digits.length < MIN_E164_DIGITS || digits.length > MAX_E164_DIGITS) return null;
  if (digits !== trimmed.replace(/^\+/, "")) return null; // reject anything with non-digit noise beyond an optional leading '+'
  return `+${digits}`;
}

/**
 * Normalizes an arbitrary, possibly-ambiguous phone string for matching
 * against stored CRM values. Whitespace and formatting punctuation
 * (spaces, hyphens, parentheses, dots) are ignored. A value that already
 * carries a country code (a leading "+", or a recognized "00" international
 * prefix) is normalized to E.164. A bare local-looking number with no
 * country signal returns null ("unresolved") rather than being assigned a
 * guessed country -- callers must treat null as "cannot safely normalize",
 * not as an error to surface to the customer.
 */
export function normalizePhoneForMatching(raw: string): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 32) return null;
  const cleaned = trimmed.replace(/[\s\-().]/g, "");
  if (!cleaned) return null;

  let candidate = cleaned;
  if (candidate.startsWith("00")) candidate = `+${candidate.slice(2)}`;

  if (candidate.startsWith("+")) {
    const digits = digitsOnly(candidate.slice(1));
    if (digits.length < MIN_E164_DIGITS || digits.length > MAX_E164_DIGITS) return null;
    if (digits !== candidate.slice(1)) return null; // reject stray non-digit characters
    return `+${digits}`;
  }

  // No country signal present -- do not guess. Preserve as unresolved.
  return null;
}
