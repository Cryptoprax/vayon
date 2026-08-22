const groups = Object.freeze({
  application: ["APP_ENV", "NEXT_PUBLIC_APP_URL", "APP_VERSION"],
  supabase: [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "EXPECTED_DATABASE_VERSION",
  ],
  openai: ["OPENAI_API_KEY", "OPENAI_MODEL"],
  stripe: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
  razorpay: [
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
  ],
  google_workspace: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  email: ["EMAIL_PROVIDER", "EMAIL_FROM_ADDRESS"],
  whatsapp: [
    "WHATSAPP_APP_SECRET",
    "WHATSAPP_VERIFY_TOKEN",
    "WHATSAPP_GRAPH_VERSION",
  ],
  monitoring: ["SENTRY_DSN", "NEXT_PUBLIC_POSTHOG_KEY"],
});
const status = Object.fromEntries(
  Object.entries(groups).map(([group, names]) => [
    group,
    {
      configured: names.filter((name) => Boolean(process.env[name]?.trim()))
        .length,
      required: names.length,
      missing: names.filter((name) => !process.env[name]?.trim()),
    },
  ]),
);
console.log(
  "Production environment readiness (variable names only; values are never displayed):",
);
for (const [group, item] of Object.entries(status))
  console.log(
    `${group}: ${item.configured}/${item.required} configured${item.missing.length ? `; missing ${item.missing.join(", ")}` : ""}`,
  );
console.log(
  "External verification still required for DNS, TLS, billing mode, OAuth consent, webhook delivery, email authentication, backups, alerts, and provider quotas.",
);
export { groups, status };
