import "server-only";

const initialFounderAllowlist = Object.freeze([
  "prakyathaiagent@gmail.com",
  "vpprakyath@gmail.com",
  "vsukanya1969@gmail.com",
  "prakyathvp@gmail.com",
]);

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function founderAllowlist(
  configured = process.env.FOUNDER_EMAIL_ALLOWLIST,
): ReadonlySet<string> {
  const values = configured === undefined
    ? initialFounderAllowlist
    : configured.split(",");
  return new Set(values.map(normalizeEmail).filter(Boolean));
}

export function isAllowlistedFounderEmail(email: string): boolean {
  return founderAllowlist().has(normalizeEmail(email));
}
