import { redirect } from "next/navigation";
export default async function Page({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) { const query = await searchParams; redirect(query.welcome === "1" ? "/vayon/home?welcome=1" : "/vayon/home") }
