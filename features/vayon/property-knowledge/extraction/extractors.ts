import { normalizeExtractedText } from "./normalize";
import {
  maxExtractedTextCharacters,
  minExtractedTextCharacters,
  type PropertyKnowledgeExtractionErrorCode,
} from "../domain/types";

export class ExtractionError extends Error {
  constructor(readonly code: PropertyKnowledgeExtractionErrorCode) {
    super(code);
    this.name = "ExtractionError";
  }
}

const pdfMime = "application/pdf";
const docxMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const textMimes = ["text/plain", "text/markdown"];
const maxSourceBytes = 20 * 1024 * 1024;
const maxDocxUncompressedBytes = 100 * 1024 * 1024;

export const extractableMimeTypes: readonly string[] = [pdfMime, docxMime, ...textMimes];

/** Sums declared uncompressed entry sizes from the zip central directory so a zip bomb is rejected before any decompression. */
function declaredZipUncompressedSize(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65_557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new ExtractionError("CORRUPT_DOCUMENT");
  const entries = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  let total = 0;
  for (let n = 0; n < entries; n++) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) throw new ExtractionError("CORRUPT_DOCUMENT");
    total += view.getUint32(offset + 24, true);
    offset += 46 + view.getUint16(offset + 28, true) + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true);
  }
  return total;
}

async function extractPdf(bytes: Uint8Array): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  try {
    const options = { isEvalSupported: false, useSystemFonts: false, disableFontFace: true };
    const pdf = await getDocumentProxy(bytes, options as unknown as Parameters<typeof getDocumentProxy>[1]);
    const result = await extractText(pdf, { mergePages: true });
    return Array.isArray(result.text) ? result.text.join("\n\n") : result.text;
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "PasswordException") throw new ExtractionError("PASSWORD_PROTECTED");
    if (name === "InvalidPDFException" || name === "FormatError" || name === "MissingPDFException") throw new ExtractionError("CORRUPT_DOCUMENT");
    throw new ExtractionError("EXTRACTION_FAILED");
  }
}

async function extractDocx(bytes: Uint8Array): Promise<string> {
  if (declaredZipUncompressedSize(bytes) > maxDocxUncompressedBytes) throw new ExtractionError("CORRUPT_DOCUMENT");
  const imported = await import("mammoth");
  const mammoth = ((imported as unknown as { default?: typeof imported }).default ?? imported) as typeof imported;
  try {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return result.value;
  } catch {
    throw new ExtractionError("CORRUPT_DOCUMENT");
  }
}

function extractPlainText(bytes: Uint8Array): string {
  if (bytes.includes(0)) throw new ExtractionError("CORRUPT_DOCUMENT");
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^\uFEFF/, "");
  } catch {
    throw new ExtractionError("CORRUPT_DOCUMENT");
  }
}

/**
 * Extracts inert text from a document, dispatching only on the MIME type
 * stored on the document's own K1 row. Text only: no scripts run, no links
 * are followed, no remote resources load. The returned string is untrusted
 * source content and is never interpreted.
 */
export async function extractDocumentText(mimeType: string, bytes: Uint8Array): Promise<string> {
  if (!extractableMimeTypes.includes(mimeType)) throw new ExtractionError("UNSUPPORTED_TYPE");
  if (bytes.byteLength === 0 || bytes.byteLength > maxSourceBytes) throw new ExtractionError("CORRUPT_DOCUMENT");

  const raw = mimeType === pdfMime ? await extractPdf(bytes) : mimeType === docxMime ? await extractDocx(bytes) : extractPlainText(bytes);
  const text = normalizeExtractedText(raw);

  if (text.replace(/\s/g, "").length < minExtractedTextCharacters) throw new ExtractionError("NO_EXTRACTABLE_TEXT");
  if (text.length > maxExtractedTextCharacters) throw new ExtractionError("EXTRACTED_TEXT_TOO_LARGE");
  return text;
}
