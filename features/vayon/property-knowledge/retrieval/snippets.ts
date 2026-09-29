import { maxSnippetCharacters } from "./types";

/**
 * The database returns a bounded ts_headline fragment (a few dozen words)
 * with the sentinel highlight markers below. This strips the markers and
 * caps length at a whitespace boundary so a number or currency amount is not
 * cut in half. Snippets are literal document text (plain text, never
 * generated, never rendered as HTML) -- instruction-looking text is kept.
 */
const highlightMarkers = /@@\/?HL@@/g;

export function cleanSnippet(raw: string | null | undefined, max = maxSnippetCharacters): string {
  const text = String(raw ?? "").replace(highlightMarkers, "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const bounded = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${bounded.trimEnd()} ...`;
}
