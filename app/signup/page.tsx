import { SignupForm } from "@/features/authentication/components/SignupForm";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <SignupForm initialError={error} />;
}
