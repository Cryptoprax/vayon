import { readFileSync } from "node:fs";
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const ui = read("features/platform/integrations/center/IntegrationCenter.tsx");
const page = read("app/vayon/settings/integrations/page.tsx");
const registry = read("features/platform/integrations/center/registry.ts");
const navigation = read("features/vayon/product-shell/navigation.ts");
const failures = [];
const requireText = (source, pattern, message) => { if (!pattern.test(source)) failures.push(message); };
requireText(navigation, /label: "Connected Apps"/, "Product navigation must use Connected Apps.");
requireText(ui, /Manage every connected service, AI permission and synchronization from one place/, "Connected Apps header is incomplete.");
for (const tab of ["Overview", "Connected Apps", "Permissions", "Activity", "Marketplace", "Advanced"]) requireText(ui, new RegExp(tab), `Missing tab: ${tab}`);
for (const card of ["Connected Apps", "Needs Attention", "Available Apps", "AI Services", "Last Successful Sync", "Overall System Health"]) requireText(ui, new RegExp(card), `Missing summary card: ${card}`);
for (const permission of ["AI Read", "AI Draft", "AI Execute", "AI Schedule", "AI Send", "AI Create CRM Records", "AI Book Meetings", "AI Generate Replies"]) requireText(ui, new RegExp(permission), `Missing permission: ${permission}`);
for (const provider of ["Google", "Gmail", "Google Calendar", "OpenAI", "WhatsApp Business", "Paddle", "Transactional Email", "Microsoft 365", "Slack", "Zapier", "Twilio", "Stripe", "Zoom", "DocuSign", "HubSpot", "LinkedIn", "Instagram", "TikTok", "YouTube"]) requireText(registry, new RegExp(provider), `Missing provider: ${provider}`);
requireText(ui, /Secrets, tokens, and passwords are never exposed/, "Advanced safety disclosure is missing.");
if (/IntegrationPlatformService|ProviderStatusDashboard/.test(page)) failures.push("Connected Apps must not duplicate provider dashboard calls.");
if (/\>Unknown\<|"Unknown"/.test(ui)) failures.push("Connected Apps must not display Unknown.");
if (failures.length) { console.error(failures.map((failure) => `FAIL: ${failure}`).join("\n")); process.exit(1); }
console.log("Connected Apps audit passed: control-center tabs, providers, permissions, evidence safety, and single-model rendering are present.");
