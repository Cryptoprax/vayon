const defaultAuthenticatedPath = "/vayon/dashboard";
const legacyAuthenticatedPaths = new Map([["/vayon/home", "/vayon/dashboard"]]);

export function safeAuthenticatedPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return defaultAuthenticatedPath;
  try {
    const parsed = new URL(value, "https://vayon.invalid");
    if (parsed.origin !== "https://vayon.invalid") return defaultAuthenticatedPath;
    const pathname = legacyAuthenticatedPaths.get(parsed.pathname) ?? parsed.pathname;
    return `${pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return defaultAuthenticatedPath;
  }
}

export function trustedApplicationOrigin(value: string) {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (!configured) return value;
  const origin = new URL(value).origin;
  return origin === new URL(configured).origin ? origin : new URL(configured).origin;
}

