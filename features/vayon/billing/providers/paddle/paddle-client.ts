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
  let body: (PaddleResponse<T> & { error?: { detail?: string } }) | null = null;
  if (text) {
    try {
      body = JSON.parse(text) as PaddleResponse<T> & {
        error?: { detail?: string };
      };
    } catch {
      throw new Error(`Paddle API returned invalid JSON (${response.status}).`);
    }
  }
  if (!response.ok) {
    const error = new Error(body?.error?.detail ?? `Paddle API failed (${response.status}).`);
    Object.assign(error, { status: response.status });
    throw error;
  }
  if (!body || !("data" in body))
    throw new Error(`Paddle API returned an empty response (${response.status}).`);
  return body.data;
}
