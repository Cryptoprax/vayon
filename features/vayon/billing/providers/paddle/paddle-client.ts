import "server-only";

const apiBase = () =>
  process.env.PADDLE_ENVIRONMENT === "sandbox"
    ? "https://sandbox-api.paddle.com"
    : "https://api.paddle.com";

export interface PaddleResponse<T> {
  readonly data: T;
}

export async function paddleRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const key = process.env.PADDLE_API_KEY;
  if (!key) throw new Error("PADDLE_API_KEY is required.");
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
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
  if (!response.ok)
    throw new Error(body?.error?.detail ?? `Paddle API failed (${response.status}).`);
  if (!body || !("data" in body))
    throw new Error(`Paddle API returned an empty response (${response.status}).`);
  return body.data;
}
