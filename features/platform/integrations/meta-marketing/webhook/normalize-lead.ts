import { normalizePhoneForMatching } from "@/features/vayon/lead/utils/phone";

/**
 * Phase M4: Graph lead-detail response validation + field normalization.
 * Pure functions only -- no I/O, no Meta call. The Graph response is treated
 * as untrusted external data (Part 5): nothing here blindly spreads Graph
 * JSON into a database row.
 */
export interface GraphFieldDatum {
  readonly name: string;
  readonly values: readonly string[];
}
export interface CustomAnswer {
  readonly fieldName: string;
  readonly values: readonly string[];
}
export interface NormalizedFields {
  readonly fullName: string | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly email: string | null;
  readonly phoneRaw: string | null;
  readonly phone: string | null;
  readonly city: string | null;
  readonly customAnswers: readonly CustomAnswer[];
}

export const maxFieldCount = 50;
export const maxFieldNameLength = 200;
export const maxValueLength = 500;
export const maxValuesPerField = 10;
export const maxCustomAnswers = 30;

export class InvalidLeadResponseError extends Error {
  constructor(readonly code: "RESPONSE_ID_MISMATCH" | "MALFORMED_RESPONSE") {
    super(code);
    this.name = "InvalidLeadResponseError";
  }
}

/**
 * Validates the shape of a raw Graph lead response and returns bounded,
 * string-only field_data. Rejects (throws MALFORMED_RESPONSE) anything that
 * isn't array-like field_data with string names and array-of-string values,
 * and anything pathologically oversized (Part 5). If Meta returns an `id`
 * that doesn't match the leadgen_id we requested, that is rejected as
 * RESPONSE_ID_MISMATCH rather than trusted.
 */
export function validateGraphLeadResponse(response: unknown, requestedLeadgenId: string): readonly GraphFieldDatum[] {
  if (!response || typeof response !== "object") throw new InvalidLeadResponseError("MALFORMED_RESPONSE");
  const record = response as Record<string, unknown>;

  if (typeof record.id === "string" && record.id.length > 0 && record.id !== requestedLeadgenId) {
    throw new InvalidLeadResponseError("RESPONSE_ID_MISMATCH");
  }

  const raw = record.field_data;
  if (!Array.isArray(raw)) throw new InvalidLeadResponseError("MALFORMED_RESPONSE");
  if (raw.length > maxFieldCount) throw new InvalidLeadResponseError("MALFORMED_RESPONSE");

  const fields: GraphFieldDatum[] = [];
  for (const entry of raw) {
    const item = entry as Record<string, unknown>;
    if (!item || typeof item.name !== "string" || item.name.length === 0 || item.name.length > maxFieldNameLength) {
      throw new InvalidLeadResponseError("MALFORMED_RESPONSE");
    }
    if (!Array.isArray(item.values)) throw new InvalidLeadResponseError("MALFORMED_RESPONSE");
    const values: string[] = [];
    for (const value of item.values.slice(0, maxValuesPerField)) {
      if (typeof value !== "string") throw new InvalidLeadResponseError("MALFORMED_RESPONSE");
      values.push(value.slice(0, maxValueLength).replace(/[\x00-\x1f\x7f]/g, ""));
    }
    fields.push({ name: item.name, values });
  }
  return fields;
}

const standardFieldKeys = new Set(["full_name", "first_name", "last_name", "email", "phone_number", "city"]);

function findField(fields: readonly GraphFieldDatum[], key: string): string | null {
  const field = fields.find((item) => item.name.trim().toLowerCase() === key);
  const value = field?.values[0]?.trim();
  return value ? value : null;
}

function normalizeEmail(raw: string | null): string | null {
  if (!raw) return null;
  const candidate = raw.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) ? candidate : null;
}

/**
 * Recognizes Meta's standard Lead Ads field keys case-insensitively. Never
 * fabricates a value: fullName is only composed from first+last when Meta
 * did not itself send full_name, and an ambiguous/invalid value (bad email,
 * uncertain-country phone) becomes null rather than a guess.
 */
export function normalizeLeadFields(fields: readonly GraphFieldDatum[]): NormalizedFields {
  const fullNameField = findField(fields, "full_name");
  const firstName = findField(fields, "first_name");
  const lastName = findField(fields, "last_name");
  const phoneRaw = findField(fields, "phone_number");

  const customAnswers: CustomAnswer[] = [];
  for (const field of fields) {
    if (standardFieldKeys.has(field.name.trim().toLowerCase())) continue;
    if (customAnswers.length >= maxCustomAnswers) break;
    customAnswers.push({ fieldName: field.name, values: field.values });
  }

  return {
    fullName: fullNameField ?? ([firstName, lastName].filter((part): part is string => Boolean(part)).join(" ") || null),
    firstName,
    lastName,
    email: normalizeEmail(findField(fields, "email")),
    phoneRaw,
    phone: phoneRaw ? normalizePhoneForMatching(phoneRaw) : null,
    city: findField(fields, "city"),
    customAnswers,
  };
}
