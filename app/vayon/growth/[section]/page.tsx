import { notFound } from "next/navigation";
import { GrowthSectionPage } from "@/features/vayon/growth-intelligence/GrowthSectionPage";
import { allGrowthSections, growthSectionSlugs, type GrowthSectionSlug } from "@/features/vayon/growth-intelligence/catalog";
import { PlatformVisibilityService } from "@/features/platform/visibility/service";
import { canViewPath } from "@/features/platform/visibility/policy";
import { CreativeStudioService } from "@/features/vayon/creative-studio/service";

export function generateStaticParams() { return growthSectionSlugs.map((section) => ({ section })); }

export default async function GrowthIntelligenceSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!growthSectionSlugs.includes(section as GrowthSectionSlug)) notFound();
  const actionHref = allGrowthSections[section as GrowthSectionSlug].actionHref;
  const visibility = await new PlatformVisibilityService().context();
  const actionAvailable = canViewPath(visibility, actionHref) && (!actionHref.startsWith("/vayon/creative") || Boolean(await CreativeStudioService.production().catch(() => null)));
  return <GrowthSectionPage sectionSlug={section as GrowthSectionSlug} actionAvailable={actionAvailable} />;
}
