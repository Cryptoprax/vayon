import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Olivia exposes an evidence-safe customer success brief", async () => {
  const source = await read("features/vayon/operational-workforce/components/OliviaCustomerSuccessManagerDashboard.tsx");
  for (const label of ["Today&apos;s Customer Success Brief", "Upcoming Follow-ups", "Pending Customer Check-ins", "Closed Transactions Requiring Follow-up", "Referral Opportunities", "Customer Satisfaction Indicators", "Renewal Opportunities", "Customer Success Risks"])
    assert.match(source, new RegExp(label));
  assert.match(source, /Evidence:/);
  assert.match(source, /Unavailable — supporting customer-success evidence is not connected/);
});

test("Olivia covers post-sale referrals health follow-ups retention and summaries", async () => {
  const source = await read("features/vayon/operational-workforce/components/OliviaCustomerSuccessManagerDashboard.tsx");
  for (const label of ["Post-Sale Journey", "Referral Intelligence", "Customer Health", "Healthy", "Needs Attention", "At Risk", "Unknown", "Follow-up Assistant", "Retention Opportunities", "Customer Success Summary", "Expected Outcome", "Confidence"])
    assert.match(source, new RegExp(label));
  for (const action of ["Welcome Message", "Thank You Message", "Registration Congratulations", "Anniversary Message", "Referral Request", "Review Request", "Property Maintenance Reminder", "Schedule Follow-up", "Book Customer Meeting", "Assign Relationship Manager"])
    assert.match(source, new RegExp(action));
  assert.match(source, /\/vayon\/approvals\?intent=/);
  assert.doesNotMatch(source, /onClick|setInterval|fetch\(/);
});

test("Olivia reuses one CRM and one WhatsApp projection with server-loaded approvals", async () => {
  const page = await read("app/vayon/ai/workforce/[employeeId]/page.tsx");
  assert.match(page, /employee === "crm-ai" \|\| employee === "whatsapp-ai"/);
  assert.match(page, /OliviaCustomerSuccessManagerDashboard crm=\{crmDashboard\} whatsapp=\{whatsappDashboard\} tasks=\{result\.tasks\} recommendations=\{employeeRecommendations\}/);
  assert.equal((page.match(/CRMAIService\.production\(\)/g) ?? []).length, 1);
  assert.equal((page.match(/WhatsAppAIService\.production\(\)/g) ?? []).length, 1);
});
