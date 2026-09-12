"use server";

import { revalidatePath } from "next/cache";
import { EnterpriseOnboardingService } from "@/features/onboarding/services/enterprise-onboarding.service";

export async function completeCustomerSuccessTaskAction(step: number) {
  const service = new EnterpriseOnboardingService(),
    session = await service.session();
  if (!session) throw new Error("Onboarding session unavailable.");
  const completed = [...new Set([...session.completed_steps, step])];
  await service.save(
    Math.max(session.current_step, step),
    session.configuration,
    completed,
    session.demo_mode,
  );
  revalidatePath("/vayon/customer-success");
}

export async function configureCustomerAIAction(employees: readonly string[]) {
  const allowed = new Set([
      "Marketing AI",
      "Sales AI",
      "Customer Success AI",
      "Creative AI",
      "Knowledge AI",
    ]),
    selected = employees.filter((item) => allowed.has(item));
  if (!selected.length) throw new Error("Select at least one AI employee.");
  const service = new EnterpriseOnboardingService(),
    session = await service.session();
  if (!session) throw new Error("Onboarding session unavailable.");
  await service.save(
    Math.max(session.current_step, 8),
    { ...session.configuration, aiEmployees: selected },
    [...new Set([...session.completed_steps, 8])],
    session.demo_mode,
  );
  revalidatePath("/vayon/customer-success");
}
