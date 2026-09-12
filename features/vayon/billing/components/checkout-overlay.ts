type CheckoutEvent = { name: string };
type PaddleClient = {
  Environment: { set(value: "sandbox"): void };
  Initialize(options: { token: string; eventCallback(event: CheckoutEvent): void }): void;
  Update(options: { eventCallback(event: CheckoutEvent): void }): void;
  Checkout: { open(options: { transactionId: string; settings: { displayMode: "overlay" } }): void; close(): void };
};
declare global { interface Window { Paddle?: PaddleClient } }
let loading: Promise<PaddleClient> | undefined;
let initialized = false;
function load(): Promise<PaddleClient> {
  if (window.Paddle) return Promise.resolve(window.Paddle);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => fail(), 15000);
    function fail() { window.clearTimeout(timeout); script.remove(); loading = undefined; reject(new Error("Secure checkout could not load. Please try again.")); }
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onerror = fail;
    script.onload = () => { window.clearTimeout(timeout); if (window.Paddle) resolve(window.Paddle); else fail(); };
    document.head.append(script);
  });
  return loading;
}
/** Payment completion refreshes server state; it never grants entitlements in the browser. */
export async function openCheckoutOverlay(transactionId: string, token: string, environment: "sandbox" | "live", completed: () => void, closed: () => void) {
  const paddle = await load();
  const eventCallback = (event: CheckoutEvent) => {
    if (event.name === "checkout.completed") { paddle.Checkout.close(); completed(); }
    if (event.name === "checkout.closed") closed();
  };
  if (!initialized) {
    if (environment === "sandbox") paddle.Environment.set("sandbox");
    paddle.Initialize({ token, eventCallback });
    initialized = true;
  } else paddle.Update({ eventCallback });
  paddle.Checkout.open({ transactionId, settings: { displayMode: "overlay" } });
}
