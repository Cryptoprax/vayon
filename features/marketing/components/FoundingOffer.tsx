"use client";
import { useEffect, useState } from "react";

export function usePublicFoundingOffer(initial = false) {
  const [available, setAvailable] = useState(initial);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/billing/paddle/founding/availability", { cache: "no-store" });
        const result = response.ok ? await response.json() : null;
        if (active) setAvailable(result?.available === true);
      } catch { if (active) setAvailable(false); }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  return available;
}

export function FoundingOffer() {
  const available = usePublicFoundingOffer();
  if (!available) return null;
  return <div className="mt-7 max-w-2xl rounded-2xl border border-vds-accent-border bg-vds-primary-soft p-4">
    <p className="text-sm font-semibold text-vds-primary">Founding Member pricing</p>
    <p className="mt-1 text-sm leading-6 text-vds-secondary">Available for the first 20 eligible agencies: Professional at $79/month for 12 successful monthly billing periods, then $149/month. Eligibility is confirmed at checkout.</p>
  </div>;
}
