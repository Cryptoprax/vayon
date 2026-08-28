import type { IntegrationDefinition } from "./contracts";
const provider = (
  code: string,
  name: string,
  category: IntegrationDefinition["category"],
  options: Partial<
    Omit<IntegrationDefinition, "code" | "name" | "category">
  > = {},
): IntegrationDefinition =>
  Object.freeze({
    code,
    name,
    category,
    version: "1.0",
    featureFlag: null,
    requiredScopes: [],
    settingsHref: null,
    available: false,
    incrementalAuthorization: true,
    ...options,
  });
export const integrationCenterRegistry = Object.freeze([
  provider("google_identity", "Google Identity", "identity", {
    featureFlag: "google_identity",
    requiredScopes: ["openid", "email", "profile"],
    settingsHref: "/vayon/settings/integrations/google",
    available: true,
  }),
  provider("gmail", "Gmail", "communication", {
    featureFlag: "gmail",
    requiredScopes: [
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.send",
    ],
    settingsHref: "/vayon/email",
    available: true,
  }),
  provider("google_calendar", "Google Calendar", "calendar", {
    featureFlag: "google_calendar",
    requiredScopes: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
    ],
    settingsHref: "/vayon/calendar",
    available: true,
  }),
  provider("google_drive", "Google Drive", "storage", {
    featureFlag: "google_drive",
    requiredScopes: ["https://www.googleapis.com/auth/drive"],
    settingsHref: "/vayon/documents/drive",
    available: true,
  }),
  provider("google_contacts", "Google Contacts", "productivity", {
    featureFlag: "google_contacts",
    requiredScopes: [
      "https://www.googleapis.com/auth/contacts.readonly",
      "https://www.googleapis.com/auth/directory.readonly",
    ],
    settingsHref: "/vayon/contacts/google",
    available: true,
  }),
  provider("google_meet", "Google Meet", "communication"),
  provider("microsoft_identity", "Microsoft Identity (Entra ID)", "identity", {
    featureFlag: "microsoft_identity",
    requiredScopes: [
      "openid",
      "profile",
      "email",
      "offline_access",
      "User.Read",
    ],
    settingsHref: "/vayon/settings/integrations/microsoft",
    available: true,
  }),
  provider("outlook", "Outlook Mail", "communication", {
    featureFlag: "microsoft_identity",
    requiredScopes: ["Mail.ReadWrite", "Mail.Send"],
    settingsHref: "/vayon/communications/outlook",
    available: true,
  }),
  provider("microsoft_calendar", "Microsoft Calendar (Outlook)", "calendar", {
    featureFlag: "microsoft_identity",
    requiredScopes: ["Calendars.ReadWrite"],
    settingsHref: "/vayon/calendar/outlook",
    available: true,
  }),
  provider("onedrive", "OneDrive", "storage", {
    featureFlag: "microsoft_identity",
    requiredScopes: ["Files.ReadWrite"],
    settingsHref: "/vayon/documents/onedrive",
    available: true,
  }),
  provider("microsoft_people", "Microsoft People", "productivity", {
    featureFlag: "microsoft_identity",
    requiredScopes: ["Contacts.Read", "People.Read", "User.ReadBasic.All"],
    settingsHref: "/vayon/contacts/microsoft",
    available: true,
  }),
  provider("teams", "Microsoft Teams", "communication", {
    featureFlag: "microsoft_identity",
    requiredScopes: [
      "Chat.Read",
      "Channel.ReadBasic.All",
      "ChannelMessage.Read.All",
      "Presence.Read.All",
      "Calendars.Read",
    ],
    settingsHref: "/vayon/communications/teams",
    available: true,
  }),
  provider("whatsapp_business", "WhatsApp Business", "communication", {
    featureFlag: "whatsapp",
    settingsHref: "/vayon/communications",
    available: true,
  }),
  provider("facebook", "Facebook", "social"),
  provider("instagram", "Instagram", "social"),
  provider("linkedin", "LinkedIn", "social"),
  provider("telegram", "Telegram", "communication"),
  provider("slack", "Slack", "communication"),
  provider("zoom", "Zoom", "communication"),
  provider("stripe", "Stripe", "payments", {
    featureFlag: "stripe",
    settingsHref: "/vayon/settings/billing",
    available: true,
  }),
  provider("paddle", "Paddle Billing", "payments", {
    settingsHref: "/vayon/settings/billing/provider-health",
    available: true,
  }),
  provider("transactional_email", "Transactional Email", "communication", {
    settingsHref: "/vayon/settings/email",
    available: true,
  }),
  provider("razorpay", "Razorpay", "payments", {
    featureFlag: "stripe",
    settingsHref: "/vayon/settings/billing",
    available: true,
  }),
  provider("microsoft_365", "Microsoft 365", "productivity", {
    featureFlag: "microsoft_identity",
    requiredScopes: ["Mail.ReadWrite", "Calendars.ReadWrite", "Contacts.Read", "People.Read"],
    settingsHref: "/vayon/settings/integrations/microsoft",
    available: true,
  }),
  provider("dropbox", "Dropbox", "storage"),
  provider("box", "Box", "storage"),
  provider("openai", "OpenAI", "ai", {
    featureFlag: "ai",
    settingsHref: "/vayon/runtime",
    available: true,
  }),
  provider("anthropic", "Anthropic", "ai"),
  provider("google_ads", "Google Ads", "social"),
  provider("google_analytics_4", "Google Analytics 4", "productivity"),
  provider("google_search_console", "Google Search Console", "productivity"),
  provider("google_business_profile", "Google Business Profile", "social"),
  provider("meta_ads", "Meta Ads", "social"),
  provider("linkedin_ads", "LinkedIn Ads", "social"),
  provider("microsoft_graph", "Microsoft Graph", "productivity"),
  provider("outlook_calendar", "Outlook Calendar", "calendar"),
  provider("twilio", "Twilio", "communication"),
  provider("resend", "Resend", "communication"),
  provider("sendgrid", "SendGrid", "communication"),
  provider("microsoft_teams", "Microsoft Teams", "communication"),
  provider("gemini", "Gemini", "ai"),
  provider("openrouter", "OpenRouter", "ai"),
  provider("hubspot", "HubSpot", "crm"),
  provider("salesforce", "Salesforce", "crm"),
  provider("workflow_engine", "Workflow Engine", "productivity", {
    settingsHref: "/vayon/workflows",
    available: true,
    incrementalAuthorization: false,
  }),
  provider("workflow_runtime", "Workflow Runtime", "productivity", {featureFlag:"workflow_runtime",settingsHref:"/vayon/workflows/runtime",available:true,incrementalAuthorization:false}),
  provider("future_provider", "Future providers", "future"),
] as const);
export function searchIntegrationDefinitions(query: string, category?: string) {
  const term = query.trim().toLowerCase();
  return integrationCenterRegistry.filter(
    (item) =>
      (!category || category === "all" || item.category === category) &&
      (!term ||
        [item.name, item.code, item.category].some((value) =>
          value.toLowerCase().includes(term),
        )),
  );
}
