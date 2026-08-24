import type { Metadata } from "next";
import { DemoExperience } from "@/features/vayon/demo-experience/components/DemoExperience";
import { DemoExperienceService } from "@/features/vayon/demo-experience/services/demo-experience.service";
import { MarketingAnalytics } from "@/features/marketing/components/MarketingAnalytics";
import { ConsentManager } from "@/features/platform/conversion-analytics/components/ConsentManager";
import { MarketingCurrencyProvider } from "@/features/marketing/currency/CurrencyDisplay";
import type { DemoMode } from "@/features/vayon/demo-experience/domain/contracts";

export const metadata: Metadata = {
  title: "Vayon OS Demo — Aurora Realty Group",
  description:
    "Explore the isolated, read-only Aurora Realty Group enterprise demo workspace.",
};
const modes: readonly DemoMode[] = ["visitor", "sales", "investor", "founder", "enterprise"];
export default async function DemoPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const requested = (await searchParams).mode, initialMode = modes.includes(requested as DemoMode) ? requested as DemoMode : "visitor";
  return <MarketingCurrencyProvider><MarketingAnalytics /><ConsentManager /><DemoExperience model={new DemoExperienceService().load()} initialMode={initialMode} /></MarketingCurrencyProvider>;
}
