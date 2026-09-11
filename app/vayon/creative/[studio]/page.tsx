import { notFound, redirect } from "next/navigation";

const studioRoutes: Record<string, string> = {
  assets: "/vayon/creative/assets",
  templates: "/vayon/creative/templates",
  calendar: "/vayon/creative/calendar",
  presentations: "/vayon/creative/documents",
  "landing-pages": "/vayon/creative/campaigns",
  social: "/vayon/creative/campaigns",
  email: "/vayon/creative/campaigns",
  copy: "/vayon/creative/documents",
  projects: "/vayon/creative/campaigns",
  publishing: "/vayon/creative/calendar",
};

export function generateStaticParams() {
  return Object.keys(studioRoutes).map((studio) => ({ studio }));
}

export default async function CreativeStudioCompatibilityPage({ params }: { params: Promise<{ studio: string }> }) {
  const destination = studioRoutes[(await params).studio];
  if (!destination) notFound();
  redirect(destination);
}
