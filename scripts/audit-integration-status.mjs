import { readFileSync } from "node:fs";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const ui = read("features/platform/integrations/center/IntegrationCenter.tsx");
const service = read("features/platform/integrations/center/service.ts");
const contracts = read("features/platform/integrations/center/contracts.ts");
const whatsapp = read("features/platform/integrations/whatsapp/WhatsAppConnectCard.tsx");
const failures = [];
const requireText = (source, pattern, message) => { if (!pattern.test(source)) failures.push(message); };
for (const status of ["Connected", "Syncing", "Needs Attention", "Not Connected", "Coming Soon"]) requireText(contracts + ui, new RegExp(status), `Missing user-facing status: ${status}`);
for (const label of ["System Health", "Connected account", "Connected email", "Last authentication", "Sync status", "Selected calendar", "Test connection", "Configured model", "Credit availability", "Recent request", "Webhook health", "Customer portal", "Configured provider", "Delivery health", "Last successful send"]) requireText(ui, new RegExp(label, "i"), `Missing operational field: ${label}`);
requireText(service, /integration_health/, "Integration health evidence must remain workspace scoped.");
requireText(service, /organization_id.*workspace_id/s, "Integration evidence must preserve tenant isolation.");
requireText(whatsapp, /Registration Pending.*Coming Soon.*Join Early Access/s, "WhatsApp must use a registration-pending experience.");
if (/accessToken|phoneNumberId|businessAccountId/.test(whatsapp)) failures.push("WhatsApp must not expose manual credential fields.");
if (/\>Unknown\<|\"Unknown\"/.test(ui)) failures.push("The Integration Center must not render Unknown as a user-facing value.");
if (failures.length) { console.error(failures.map((failure) => `FAIL: ${failure}`).join("\n")); process.exit(1); }
console.log("Integration status audit passed: operational states, provider evidence, system health, and safe WhatsApp readiness are present.");
