import { SignupForm } from "@/features/authentication/components/SignupForm";
import { isPaddleBillingPeriod, isPaddlePlanCode } from "@/features/vayon/billing/providers/paddle/paddle-catalog";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; plan?: string; period?: string }> }) {
  const { error, plan, period } = await searchParams;
  // Selected-plan intent is optional and must fail closed to generic signup, never an error.
  const validPlan = typeof plan === "string" && isPaddlePlanCode(plan) ? plan : undefined;
  const validPeriod = typeof period === "string" && isPaddleBillingPeriod(period) ? period : undefined;
  return <SignupForm initialError={error} plan={validPlan} period={validPeriod} />;
}
