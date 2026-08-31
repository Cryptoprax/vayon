import { notFound, redirect } from "next/navigation";

const studioRoutes: Record<string, string> = {
  assets: "/vayon/creative-studio/assets",
  templates: "/vayon/creative-studio/templates",
  calendar: "/vayon/creative-studio/calendar",
  presentations: "/vayon/creative/documents",
  "landing-pages": "/vayon/creative-studio/wizard",
  social: "/vayon/creative/campaigns",
  email: "/vayon/creative/campaigns",
  copy: "/vayon/creative/documents",
  projects: "/vayon/creative-studio/packs",
  publishing: "/vayon/creative-studio/calendar",
};

export function generateStaticParams() {
  return Object.keys(studioRoutes).map((studio) => ({ studio }));
}

export default async function CreativeStudioCompatibilityPage({ params }: { params: Promise<{ studio: string }> }) {
  const destination = studioRoutes[(await params).studio];
  if (!destination) notFound();
  redirect(destination);
}
