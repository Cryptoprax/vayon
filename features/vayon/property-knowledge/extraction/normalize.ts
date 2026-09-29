/**
 * Deterministic, conservative normalization of extracted text. It never
 * rewrites numbers, currency, units, punctuation, addresses or names, and
 * never spell-corrects: only line endings, unsafe control characters and
 * pathological whitespace are touched.
 */
export function normalizeExtractedText(input: string): string {
  return input
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
