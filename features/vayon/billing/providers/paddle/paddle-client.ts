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
  const body = (await response.json()) as PaddleResponse<T> & {
    error?: { detail?: string };
  };
  if (!response.ok)
    throw new Error(body.error?.detail ?? `Paddle API failed (${response.status}).`);
  return body.data;
}
