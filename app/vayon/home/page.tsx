import { redirect } from "next/navigation";

type LegacyHomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyHomeCompatibilityPage({ searchParams }: LegacyHomePageProps) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) query.append(key, item);
    } else if (value !== undefined) {
      query.set(key, value);
    }
  }

  const suffix = query.size ? `?${query.toString()}` : "";
  const destination = suffix ? `/vayon/dashboard${suffix}` : "/vayon/dashboard";
  redirect(destination);
}
