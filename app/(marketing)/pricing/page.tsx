import {
  MarketingPage,
  marketingMetadata,
  marketingPages,
} from "@/features/marketing";
import { connection } from "next/server";
import { foundingAvailability } from "@/features/vayon/billing/services/founding-member.service";
export const metadata = marketingMetadata("pricing");
export default async function Page() {
  await connection();
  const offer = await foundingAvailability();
  return <MarketingPage content={marketingPages.pricing} foundingAvailable={offer.eligible} />;
}
