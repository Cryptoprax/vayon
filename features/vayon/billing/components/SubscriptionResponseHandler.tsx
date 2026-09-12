"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { subscriptionCenterHref, type SubscriptionWriteDecision } from "../services/subscription-write-contract";

export function announceSubscriptionBlock(value: unknown) {
  if (!value || typeof value !== "object" || !("code" in value) || !["TRIAL_LIMIT_REACHED", "TRIAL_EXPIRED", "SUBSCRIPTION_UNVERIFIED"].includes(String(value.code))) return false;
  const resource = "resource" in value && ["properties", "leads", "companies", "members"].includes(String(value.resource)) ? value.resource : "write";
  window.dispatchEvent(new CustomEvent("vayon:subscription-required", { detail: { allowed: false, code: value.code, resource } }));
  return true;
}
export async function handleSubscriptionResponse(response: Response) {
  if (response.status !== 402) return false;
  const value: unknown = await response.clone().json().catch(() => null);
  return announceSubscriptionBlock(value);
}
export function SubscriptionResponseHandler() {
  const router = useRouter();
  useEffect(() => {
    const open = (event: Event) => router.push(subscriptionCenterHref((event as CustomEvent<SubscriptionWriteDecision>).detail));
    window.addEventListener("vayon:subscription-required", open);
    return () => window.removeEventListener("vayon:subscription-required", open);
  }, [router]);
  return null;
}
