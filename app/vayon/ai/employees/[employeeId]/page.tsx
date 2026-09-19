import { notFound, redirect } from "next/navigation";
import type { AIEmployeeCode } from "@/features/platform/openai/domain/models";
import { AIService } from "@/features/vayon/ai-workforce/services/ai.service";
import { requireEntitlement, FeatureNotEntitledError } from "@/features/vayon/billing/services/require-entitlement";
import { EntitlementUpgradeRequired } from "@/features/vayon/billing/components/EntitlementUpgradeRequired";

const employeeMap: Record<string, AIEmployeeCode> = {
  ai_ceo: "executive-ai",
  ai_sales_director: "sales-ai",
  ai_property_expert: "crm-ai",
  ai_deal_coach: "finance-ai",
  ai_operations_manager: "operations-ai",
  ai_marketing_advisor: "marketing-ai",
  ai_support_assistant: "whatsapp-ai",
};

export default async function Page({ params }: { params: Promise<{ employeeId: string }> }) {
  try {
    await requireEntitlement("ai_workforce");
  } catch (error) {
    if (error instanceof FeatureNotEntitledError) return <EntitlementUpgradeRequired feature="ai_workforce" label="AI Workforce" />;
    throw error;
  }
  const { employeeId } = await params;
  if (employeeId in employeeMap) redirect(`/vayon/ai/workforce/${employeeMap[employeeId]}`);
  const employee = (await new AIService().employees()).find((item) => item.id === employeeId);
  if (!employee) notFound();
  redirect(`/vayon/ai/workforce/${employeeMap[employee.code] ?? "executive-ai"}`);
}
