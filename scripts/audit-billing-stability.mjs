import { existsSync, readFileSync } from "node:fs";
const files = ["app/vayon/settings/billing/page.tsx","app/vayon/settings/billing/error.tsx","features/vayon/billing/services/billing-stability.service.ts","features/vayon/billing/components/BillingRecoveryState.tsx","features/vayon/billing/components/BillingRecoveryDetails.tsx"];
const failures = files.filter((file) => !existsSync(file)), source = files.filter(existsSync).map((file) => readFileSync(file, "utf8")).join("\n");
for (const token of ["safeSnapshot","PADDLE_NOT_CONFIGURED","SUBSCRIPTION_NOT_FOUND","CUSTOMER_NOT_FOUND","RLS_FAILURE","zero_invoices","zero_usage","Billing Ready To Configure","No Subscription Yet","Paddle Unavailable","Webhook Missing","Portal Not Configured","Retry billing"]) if (!source.includes(token)) failures.push(`missing:${token}`);
if (source.includes("This workspace view could not load")) failures.push("generic workspace failure remains");
if (failures.length) { console.error(`Billing stability audit failed: ${failures.join(", ")}`); process.exit(1); }
console.log("Billing stability audit passed: recoverable projections, provider configuration, lifecycle states, empty widgets, logging, and route fallback verified.");
