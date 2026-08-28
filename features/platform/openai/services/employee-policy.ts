import type { AIEmployeeCode } from "../domain/models";

const policies: Partial<Record<AIEmployeeCode, { name: string; responsibilities: readonly string[] }>> = Object.freeze({
  "sales-ai": { name: "Sarah", responsibilities: ["lead qualification", "follow-up drafting", "sales summaries", "deal recommendations"] },
  "crm-ai": { name: "Emma", responsibilities: ["property matching", "property explanations", "market summaries", "buyer recommendations"] },
  "marketing-ai": { name: "Alex", responsibilities: ["marketing copy", "campaign ideas", "creative briefs", "SEO content"] },
  "operations-ai": { name: "David", responsibilities: ["operational planning", "task summaries", "workflow recommendations", "scheduling assistance"] },
  "whatsapp-ai": { name: "Olivia", responsibilities: ["support reply drafts", "customer summaries", "retention recommendations"] },
});

export function employeePolicy(employee: AIEmployeeCode) {
  const policy = policies[employee];
  return policy ? `${policy.name}'s approved responsibilities are ${policy.responsibilities.join(", ")}.` : "Operate only within the assigned VAYON department.";
}
