import "server-only";

export type PaddleEnvironment = "sandbox" | "live";
export function paddleEnvironment(): PaddleEnvironment {
  const value = process.env.PADDLE_ENVIRONMENT;
  if (value !== "sandbox" && value !== "live")
    throw new Error("PADDLE_ENVIRONMENT must be explicitly set to sandbox or live.");
  return value;
}
const apiBase = () => paddleEnvironment() === "sandbox" ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";

function paddleApiKey() {
  const key = process.env.PADDLE_API_KEY;
  if (!key) throw new Error("PADDLE_API_KEY is required.");
  const environment = paddleEnvironment();
  if (environment === "live" && key.includes("_sdbx_")) throw new Error("Paddle live mode cannot use a sandbox API key.");
  if (environment === "sandbox" && key.includes("_live_")) throw new Error("Paddle sandbox mode cannot use a live API key.");
  return key;
}

export interface PaddleResponse<T> {
  readonly data: T;
}

type PaddleError = {
  readonly code?: unknown;
  readonly type?: unknown;
  readonly field?: unknown;
  readonly errors?: readonly { readonly field?: unknown }[];
};

type PaddleErrorResponse = {
  readonly error?: PaddleError;
};

function safeDiagnosticToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const token = value.trim();
  return /^[A-Za-z0-9_.\-[\]]{1,120}$/.test(token) ? token : null;
}

export class PaddleApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly paddleErrorType: string | null;
  readonly validationField: string | null;

  constructor(status: number, error?: PaddleError) {
    super(`Paddle API failed (${status}).`);
    this.name = "PaddleApiError";
    this.status = status;
    this.code = safeDiagnosticToken(error?.code);
    this.paddleErrorType = safeDiagnosticToken(error?.type);
    this.validationField = safeDiagnosticToken(error?.field)
      ?? safeDiagnosticToken(error?.errors?.[0]?.field);
  }
}

export async function paddleRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const key = paddleApiKey();
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "Paddle-Version": process.env.PADDLE_API_VERSION ?? "1",
      ...init.headers,
    },
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(Number(process.env.PADDLE_TIMEOUT_MS ?? 15_000)),
  });
  const text = await response.text();
  let body: (PaddleResponse<T> & PaddleErrorResponse) | null = null;
  if (text) {
    try {
      body = JSON.parse(text) as PaddleResponse<T> & PaddleErrorResponse;
    } catch {
      throw new Error(`Paddle API returned invalid JSON (${response.status}).`);
    }
  }
  if (!response.ok) {
    throw new PaddleApiError(response.status, body?.error);
  }
  if (!body || !("data" in body))
    throw new Error(`Paddle API returned an empty response (${response.status}).`);
  return body.data;
}
