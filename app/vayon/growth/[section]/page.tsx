import { notFound } from "next/navigation";
import { GrowthSectionPage } from "@/features/vayon/growth-intelligence/GrowthSectionPage";
import { growthSectionSlugs, type GrowthSectionSlug } from "@/features/vayon/growth-intelligence/catalog";

export function generateStaticParams() { return growthSectionSlugs.map((section) => ({ section })); }

export default async function GrowthIntelligenceSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!growthSectionSlugs.includes(section as GrowthSectionSlug)) notFound();
  return <GrowthSectionPage sectionSlug={section as GrowthSectionSlug} />;
}
