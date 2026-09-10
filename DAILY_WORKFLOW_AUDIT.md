# Daily Workflow Audit

Phase 2 reviews the current 346 page source files, including public, redirected, specialist and administrator routes. Visibility still depends on existing authentication/RBAC; this is not a claim that all pages are visible to a broker. The earlier inventory contained 345 files; this fresh scan contains 346. No page was added in this phase.

## Daily routine

| Routine | Intended outcome | Existing entry | Change / finding |
|---|---|---|---|
| Morning | Decide what needs attention | Dashboard / Tasks | One Start today's work primary action targets existing Getting Started or agenda; advanced AI review is collapsed |
| Lead follow-up | Move a conversation forward | Leads / Communications | One Create Lead entry; inactive quick-filter buttons removed; working form filters retained |
| Property work | Prepare a property for sale | Properties / record | Duplicate creation and command bars removed; property heading explains the next job |
| Client meetings | Prepare the next conversation | Clients / Calendar | Agenda rows retain information; one full-calendar destination replaces repeated list links |
| Marketing | Promote a property | Campaigns / Creative | One campaign creation action per populated/empty state; templates disclosed in context |
| Negotiation | Advance an offer or decision | Deals / Approvals | Clear Create Deal primary, qualified-lead review secondary; existing decision services unchanged |
| Closing | Complete the next requirement | Deal record / payment and registration views | Shared record action area consolidated; incomplete record panels remain a gap |
| Reporting | Decide where performance needs attention | Analytics / Marketing Performance | Plain guidance, wrapped report navigation, measurement details and connection health collapsed |

## Reconsideration

Setup, billing, permissions and security belong to occasional workspace configuration, not the broker's daily queue. Public acquisition/authentication pages precede the daily routine. Platform administration stays behind its existing role gates. AI workspaces remain existing destinations; proactive global AI navigation is hidden outside those workflows. General AI Ask mode is contextual, and record-level AI is retained.

Pages with placeholder panels or services lacking durable authoritative data cannot become complete operational workflows through wording changes. They are listed as unresolved, without new services or simulated behavior.

## Coverage

| Classification | Page sources |
|---|---|
| Occasional setup / administration | 115 |
| Reconsider / public entry | 84 |
| Morning | 24 |
| Lead follow-up | 25 |
| Client meetings | 27 |
| Marketing | 28 |
| Negotiation | 12 |
| Reporting | 15 |
| Property work | 16 |

## Page-by-page purpose map

Each source was scanned for JSX text and direct primary-button declarations. Workflow and primary-job assignments below are recommendations derived from source/routes. Counts include conditional branches and exclude composed child actions, so they do not prove simultaneous rendered primary-action counts. Shared record/dashboard behavior has separate rendered-fixture tests. Every composed or dynamic page still needs signed-in validation of its actual state.

| Route | Daily workflow | One primary job | Direct primary declarations | Review status | Source |
|---|---|---|---|---|---|
| /verify-email | Occasional setup / administration | Configure the selected workspace setting | 1 | Composed: verify signed-in state | app/verify-email/page.tsx |
| /demo | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/demo/page.tsx |
| /onboarding/[setup] | Occasional setup / administration | Configure the selected workspace setting | 0 | Redirect: retain one canonical home | app/onboarding/[setup]/page.tsx |
| /onboarding | Occasional setup / administration | Configure the selected workspace setting | 0 | Redirect: retain one canonical home | app/onboarding/page.tsx |
| /onboarding/business-launch | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/onboarding/business-launch/page.tsx |
| /accept-invitation | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 1 | Composed: verify signed-in state | app/accept-invitation/page.tsx |
| /vayon/follow-ups | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/vayon/follow-ups/page.tsx |
| /forgot-password | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/forgot-password/page.tsx |
| /vayon/executions | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/vayon/executions/page.tsx |
| /login | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/login/page.tsx |
| /compare/[slug] | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/(marketing)/compare/[slug]/page.tsx |
| /compare | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/(marketing)/compare/page.tsx |
| /vayon/events | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/vayon/events/page.tsx |
| /workflows | Morning | Choose and start the next task | 0 | Composed: verify signed-in state | app/(marketing)/workflows/page.tsx |
| /communications | Lead follow-up | Open the lead or conversation requiring follow-up | 0 | Composed: verify signed-in state | app/(marketing)/communications/page.tsx |
| /careers | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/careers/page.tsx |
| /vayon/events/history | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/vayon/events/history/page.tsx |
| /calendar | Client meetings | Prepare the next client conversation | 0 | Composed: verify signed-in state | app/(marketing)/calendar/page.tsx |
| /brand-assets | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/(marketing)/brand-assets/page.tsx |
| /vayon/events/catalog | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/vayon/events/catalog/page.tsx |
| /blog/[slug] | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/(marketing)/blog/[slug]/page.tsx |
| /blog | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/(marketing)/blog/page.tsx |
| /api | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/api/page.tsx |
| /ai-workforce | Morning | Choose and start the next task | 0 | Composed: verify signed-in state | app/(marketing)/ai-workforce/page.tsx |
| /ai-usage-policy | Morning | Choose and start the next task | 0 | Composed: verify signed-in state | app/(marketing)/ai-usage-policy/page.tsx |
| /acceptable-use-policy | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/acceptable-use-policy/page.tsx |
| /vayon/email/[messageId] | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/vayon/email/[messageId]/page.tsx |
| /about | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/about/page.tsx |
| /vayon/email/trash | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/vayon/email/trash/page.tsx |
| /partners | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/partners/page.tsx |
| /vayon/email/spam | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/vayon/email/spam/page.tsx |
| /media-kit | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/(marketing)/media-kit/page.tsx |
| /vayon/email/sent | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/vayon/email/sent/page.tsx |
| /vayon/email | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/vayon/email/page.tsx |
| /investors | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/(marketing)/investors/page.tsx |
| /vayon/email/inbox | Lead follow-up | Open the lead or conversation requiring follow-up | 0 | Composed: verify signed-in state | app/vayon/email/inbox/page.tsx |
| /integrations | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/integrations/page.tsx |
| /vayon/email/drafts | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/vayon/email/drafts/page.tsx |
| /vayon/cognitive | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/vayon/cognitive/page.tsx |
| /vayon/email/archive | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/vayon/email/archive/page.tsx |
| /industries/[slug] | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/industries/[slug]/page.tsx |
| /industries | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/industries/page.tsx |
| /help | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/help/page.tsx |
| /vayon/crm | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 1 | Composed: verify signed-in state | app/vayon/crm/page.tsx |
| /vayon/documents/onedrive | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 2 | Direct source review; runtime state unverified | app/vayon/documents/onedrive/page.tsx |
| /features/[slug] | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/features/[slug]/page.tsx |
| /features | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/features/page.tsx |
| /vayon/documents/drive | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/vayon/documents/drive/page.tsx |
| /enterprise | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/enterprise/page.tsx |
| /vayon/developers | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/vayon/developers/page.tsx |
| /vayon/calendar/week | Client meetings | Prepare the next client conversation | 0 | Composed: verify signed-in state | app/vayon/calendar/week/page.tsx |
| /docs/[slug] | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/(marketing)/docs/[slug]/page.tsx |
| /docs | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/(marketing)/docs/page.tsx |
| /vayon/calendar/tasks | Client meetings | Prepare the next client conversation | 0 | Composed: verify signed-in state | app/vayon/calendar/tasks/page.tsx |
| /vayon/deals/[dealId] | Negotiation | Move the selected deal or decision forward | 0 | Composed: verify signed-in state | app/vayon/deals/[dealId]/page.tsx |
| /vayon/calendar/site-visits | Client meetings | Prepare the next client conversation | 0 | Composed: verify signed-in state | app/vayon/calendar/site-visits/page.tsx |
| /vayon/deals/[dealId]/edit | Negotiation | Move the selected deal or decision forward | 0 | Direct source review; runtime state unverified | app/vayon/deals/[dealId]/edit/page.tsx |
| /developers | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/(marketing)/developers/page.tsx |
| /deals | Negotiation | Move the selected deal or decision forward | 0 | Composed: verify signed-in state | app/(marketing)/deals/page.tsx |
| /vayon/deals/contracts | Negotiation | Move the selected deal or decision forward | 0 | Composed: verify signed-in state | app/vayon/deals/contracts/page.tsx |
| /vayon/deals/pipeline | Negotiation | Move the selected deal or decision forward | 1 | Composed: verify signed-in state | app/vayon/deals/pipeline/page.tsx |
| /vayon/deals | Negotiation | Move the selected deal or decision forward | 1 | Composed: verify signed-in state | app/vayon/deals/page.tsx |
| /vayon/crm/leads/[leadId] | Lead follow-up | Open the lead or conversation requiring follow-up | 0 | Composed: verify signed-in state | app/vayon/crm/leads/[leadId]/page.tsx |
| /vayon/crm/leads | Lead follow-up | Open the lead or conversation requiring follow-up | 2 | Composed: verify signed-in state | app/vayon/crm/leads/page.tsx |
| /data-processing-addendum | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/data-processing-addendum/page.tsx |
| /vayon/deals/offers | Negotiation | Move the selected deal or decision forward | 0 | Composed: verify signed-in state | app/vayon/deals/offers/page.tsx |
| /vayon/deals/checklists | Negotiation | Move the selected deal or decision forward | 0 | Composed: verify signed-in state | app/vayon/deals/checklists/page.tsx |
| /vayon/deals/new | Negotiation | Move the selected deal or decision forward | 0 | Direct source review; runtime state unverified | app/vayon/deals/new/page.tsx |
| /data-ownership | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/data-ownership/page.tsx |
| /vayon/platform/launch-readiness | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/platform/launch-readiness/page.tsx |
| /vayon | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Redirect: retain one canonical home | app/vayon/page.tsx |
| /vayon/deals/analytics | Reporting | Understand performance | 0 | Composed: verify signed-in state | app/vayon/deals/analytics/page.tsx |
| /vayon/crm/customers | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/vayon/crm/customers/page.tsx |
| /vayon/operations | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/vayon/operations/page.tsx |
| /vayon/objects | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/vayon/objects/page.tsx |
| /vayon/dashboard | Morning | Choose and start the next task | 0 | Composed: verify signed-in state | app/vayon/dashboard/page.tsx |
| /customers/[slug] | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/(marketing)/customers/[slug]/page.tsx |
| /customers | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/(marketing)/customers/page.tsx |
| /vayon/notifications/preferences | Lead follow-up | Open the lead or conversation requiring follow-up | 0 | Direct source review; runtime state unverified | app/vayon/notifications/preferences/page.tsx |
| /vayon/notifications | Lead follow-up | Open the lead or conversation requiring follow-up | 0 | Direct source review; runtime state unverified | app/vayon/notifications/page.tsx |
| /vayon/crm/contacts/[contactId] | Client meetings | Prepare the next client conversation | 0 | Composed: verify signed-in state | app/vayon/crm/contacts/[contactId]/page.tsx |
| /vayon/crm/contacts | Client meetings | Prepare the next client conversation | 0 | Composed: verify signed-in state | app/vayon/crm/contacts/page.tsx |
| /vayon/notifications/inbox | Lead follow-up | Open the lead or conversation requiring follow-up | 0 | Redirect: retain one canonical home | app/vayon/notifications/inbox/page.tsx |
| /crm | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/crm/page.tsx |
| /vayon/calendar/reminders | Client meetings | Prepare the next client conversation | 0 | Composed: verify signed-in state | app/vayon/calendar/reminders/page.tsx |
| /vayon/notifications/history | Lead follow-up | Open the lead or conversation requiring follow-up | 0 | Redirect: retain one canonical home | app/vayon/notifications/history/page.tsx |
| /copyright-policy | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/copyright-policy/page.tsx |
| /vayon/calendar | Client meetings | Prepare the next client conversation | 0 | Direct source review; runtime state unverified | app/vayon/calendar/page.tsx |
| /vayon/context | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/vayon/context/page.tsx |
| /vayon/crm/companies/[companyId] | Client meetings | Prepare the next client conversation | 0 | Composed: verify signed-in state | app/vayon/crm/companies/[companyId]/page.tsx |
| /cookie-policy | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/cookie-policy/page.tsx |
| /vayon/messages | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/vayon/messages/page.tsx |
| /vayon/calendar/outlook | Client meetings | Prepare the next client conversation | 1 | Direct source review; runtime state unverified | app/vayon/calendar/outlook/page.tsx |
| /vayon/crm/companies/[companyId]/edit | Client meetings | Prepare the next client conversation | 0 | Composed: verify signed-in state | app/vayon/crm/companies/[companyId]/edit/page.tsx |
| /contact | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/(marketing)/contact/page.tsx |
| /vayon/contacts/microsoft | Client meetings | Prepare the next client conversation | 1 | Direct source review; runtime state unverified | app/vayon/contacts/microsoft/page.tsx |
| /vayon/meetings | Client meetings | Prepare the next client conversation | 0 | Direct source review; runtime state unverified | app/vayon/meetings/page.tsx |
| /roi-calculator | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/(marketing)/roi-calculator/page.tsx |
| /vayon/calendar/month | Client meetings | Prepare the next client conversation | 0 | Composed: verify signed-in state | app/vayon/calendar/month/page.tsx |
| /vayon/contacts/google | Client meetings | Prepare the next client conversation | 0 | Direct source review; runtime state unverified | app/vayon/contacts/google/page.tsx |
| /vayon/crm/companies | Client meetings | Prepare the next client conversation | 1 | Composed: verify signed-in state | app/vayon/crm/companies/page.tsx |
| /resources | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/resources/page.tsx |
| /vayon/crm/companies/new | Client meetings | Prepare the next client conversation | 0 | Composed: verify signed-in state | app/vayon/crm/companies/new/page.tsx |
| /vayon/leads/[leadId] | Lead follow-up | Open the lead or conversation requiring follow-up | 0 | Composed: verify signed-in state | app/vayon/leads/[leadId]/page.tsx |
| /release-notes | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/release-notes/page.tsx |
| /vayon/leads/[leadId]/edit | Lead follow-up | Open the lead or conversation requiring follow-up | 0 | Direct source review; runtime state unverified | app/vayon/leads/[leadId]/edit/page.tsx |
| /vayon/crm/activities | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/vayon/crm/activities/page.tsx |
| /vayon/leads | Lead follow-up | Open the lead or conversation requiring follow-up | 0 | Composed: verify signed-in state | app/vayon/leads/page.tsx |
| /refund-policy | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/refund-policy/page.tsx |
| /vayon/calendar/meetings | Client meetings | Prepare the next client conversation | 0 | Composed: verify signed-in state | app/vayon/calendar/meetings/page.tsx |
| /properties | Property work | Select a property to update or sell | 0 | Composed: verify signed-in state | app/(marketing)/properties/page.tsx |
| /trust-center | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/(marketing)/trust-center/page.tsx |
| /vayon/leads/new | Lead follow-up | Open the lead or conversation requiring follow-up | 0 | Redirect: retain one canonical home | app/vayon/leads/new/page.tsx |
| /trademark-policy | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/trademark-policy/page.tsx |
| /vayon/knowledge | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/knowledge/page.tsx |
| /vayon/communications/templates | Lead follow-up | Open the lead or conversation requiring follow-up | 0 | Composed: verify signed-in state | app/vayon/communications/templates/page.tsx |
| /vayon/creative-studio/wizard | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/creative-studio/wizard/page.tsx |
| /vayon/knowledge/help | Occasional setup / administration | Configure the selected workspace setting | 1 | Composed: verify signed-in state | app/vayon/knowledge/help/page.tsx |
| /product | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/product/page.tsx |
| /vayon/communications/teams | Lead follow-up | Open the lead or conversation requiring follow-up | 1 | Direct source review; runtime state unverified | app/vayon/communications/teams/page.tsx |
| /vayon/creative-studio/templates | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/creative-studio/templates/page.tsx |
| /vayon/creative-studio | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/creative-studio/page.tsx |
| /vayon/intelligence | Morning | Choose and start the next task | 0 | Direct source review; runtime state unverified | app/vayon/intelligence/page.tsx |
| /privacy | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/privacy/page.tsx |
| /terms | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/terms/page.tsx |
| /vayon/home | Morning | Choose and start the next task | 0 | Redirect: retain one canonical home | app/vayon/home/page.tsx |
| /pricing | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/pricing/page.tsx |
| /support-policy | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/support-policy/page.tsx |
| /vayon/calendar/google/settings | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/vayon/calendar/google/settings/page.tsx |
| /vayon/calendar/google | Client meetings | Prepare the next client conversation | 0 | Direct source review; runtime state unverified | app/vayon/calendar/google/page.tsx |
| /press-kit | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/press-kit/page.tsx |
| /subprocessors | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/subprocessors/page.tsx |
| /vayon/calendar/google/free-busy | Client meetings | Prepare the next client conversation | 0 | Direct source review; runtime state unverified | app/vayon/calendar/google/free-busy/page.tsx |
| /vayon/growth/[section] | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/growth/[section]/page.tsx |
| /vayon/growth | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/growth/page.tsx |
| /security | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/security/page.tsx |
| /status | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/status/page.tsx |
| /vayon/calendar/google/events | Client meetings | Prepare the next client conversation | 0 | Direct source review; runtime state unverified | app/vayon/calendar/google/events/page.tsx |
| /search | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 1 | Composed: verify signed-in state | app/(marketing)/search/page.tsx |
| /vayon/calendar/google/calendars | Client meetings | Prepare the next client conversation | 0 | Direct source review; runtime state unverified | app/vayon/calendar/google/calendars/page.tsx |
| /vayon/workforce | Morning | Choose and start the next task | 0 | Direct source review; runtime state unverified | app/vayon/workforce/page.tsx |
| /vayon/founder/approvals | Negotiation | Move the selected deal or decision forward | 0 | Direct source review; runtime state unverified | app/vayon/founder/approvals/page.tsx |
| /solutions/[slug] | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/solutions/[slug]/page.tsx |
| /solutions | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/(marketing)/solutions/page.tsx |
| /vayon/calendar/day | Client meetings | Prepare the next client conversation | 0 | Composed: verify signed-in state | app/vayon/calendar/day/page.tsx |
| /vayon/storage | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/vayon/storage/page.tsx |
| /vayon/calendar/agenda | Client meetings | Prepare the next client conversation | 0 | Composed: verify signed-in state | app/vayon/calendar/agenda/page.tsx |
| /vayon/workflows/[workflowId] | Morning | Choose and start the next task | 0 | Composed: verify signed-in state | app/vayon/workflows/[workflowId]/page.tsx |
| /vayon/brain | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/vayon/brain/page.tsx |
| /vayon/site-visits/[visitId] | Client meetings | Prepare the next client conversation | 0 | Direct source review; runtime state unverified | app/vayon/site-visits/[visitId]/page.tsx |
| /vayon/workflows/runtime | Morning | Choose and start the next task | 0 | Direct source review; runtime state unverified | app/vayon/workflows/runtime/page.tsx |
| /vayon/workflows | Morning | Choose and start the next task | 0 | Composed: verify signed-in state | app/vayon/workflows/page.tsx |
| /vayon/communications/reports | Reporting | Understand performance | 0 | Composed: verify signed-in state | app/vayon/communications/reports/page.tsx |
| /vayon/communications | Lead follow-up | Open the lead or conversation requiring follow-up | 0 | Composed: verify signed-in state | app/vayon/communications/page.tsx |
| /vayon/site-visits/reports | Reporting | Understand performance | 0 | Direct source review; runtime state unverified | app/vayon/site-visits/reports/page.tsx |
| /vayon/site-visits | Client meetings | Prepare the next client conversation | 0 | Direct source review; runtime state unverified | app/vayon/site-visits/page.tsx |
| /vayon/approvals/[approvalId] | Negotiation | Move the selected deal or decision forward | 0 | Composed: verify signed-in state | app/vayon/approvals/[approvalId]/page.tsx |
| /vayon/approvals | Negotiation | Move the selected deal or decision forward | 0 | Composed: verify signed-in state | app/vayon/approvals/page.tsx |
| /vayon/creative-studio/packs | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/creative-studio/packs/page.tsx |
| /vayon/site-visits/calendar | Client meetings | Prepare the next client conversation | 0 | Direct source review; runtime state unverified | app/vayon/site-visits/calendar/page.tsx |
| /vayon/creative-studio/growth | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/creative-studio/growth/page.tsx |
| /sales-assets/[slug] | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/(marketing)/sales-assets/[slug]/page.tsx |
| /sales-assets | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Direct source review; runtime state unverified | app/(marketing)/sales-assets/page.tsx |
| /vayon/analytics/workforce | Reporting | Understand performance | 0 | Composed: verify signed-in state | app/vayon/analytics/workforce/page.tsx |
| /vayon/whatsapp/templates | Lead follow-up | Open the lead or conversation requiring follow-up | 0 | Direct source review; runtime state unverified | app/vayon/whatsapp/templates/page.tsx |
| /vayon/analytics/sales | Reporting | Understand performance | 0 | Composed: verify signed-in state | app/vayon/analytics/sales/page.tsx |
| /vayon/creative-studio/editor/[assetId] | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/creative-studio/editor/[assetId]/page.tsx |
| /vayon/settings/workspace | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/vayon/settings/workspace/page.tsx |
| /vayon/creative-studio/calendar | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/creative-studio/calendar/page.tsx |
| /vayon/whatsapp/settings | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/vayon/whatsapp/settings/page.tsx |
| /vayon/settings/users | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/settings/users/page.tsx |
| /vayon/whatsapp | Lead follow-up | Open the lead or conversation requiring follow-up | 0 | Direct source review; runtime state unverified | app/vayon/whatsapp/page.tsx |
| /vayon/settings/usage | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/vayon/settings/usage/page.tsx |
| /vayon/settings/teams | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/settings/teams/page.tsx |
| /vayon/whatsapp/inbox | Lead follow-up | Open the lead or conversation requiring follow-up | 0 | Direct source review; runtime state unverified | app/vayon/whatsapp/inbox/page.tsx |
| /vayon/settings/subscription | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/settings/subscription/page.tsx |
| /vayon/communications/outlook | Lead follow-up | Open the lead or conversation requiring follow-up | 2 | Composed: verify signed-in state | app/vayon/communications/outlook/page.tsx |
| /vayon/settings/security | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/settings/security/page.tsx |
| /vayon/analytics/properties | Reporting | Understand performance | 0 | Composed: verify signed-in state | app/vayon/analytics/properties/page.tsx |
| /vayon/analytics | Reporting | Understand performance | 0 | Composed: verify signed-in state | app/vayon/analytics/page.tsx |
| /vayon/whatsapp/conversations | Lead follow-up | Open the lead or conversation requiring follow-up | 0 | Direct source review; runtime state unverified | app/vayon/whatsapp/conversations/page.tsx |
| /vayon/communications/notifications | Lead follow-up | Open the lead or conversation requiring follow-up | 0 | Composed: verify signed-in state | app/vayon/communications/notifications/page.tsx |
| /vayon/analytics/executive | Reporting | Understand performance | 0 | Composed: verify signed-in state | app/vayon/analytics/executive/page.tsx |
| /vayon/settings/roles | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/settings/roles/page.tsx |
| /vayon/timeline | Morning | Choose and start the next task | 0 | Direct source review; runtime state unverified | app/vayon/timeline/page.tsx |
| /vayon/communications/inbox | Lead follow-up | Open the lead or conversation requiring follow-up | 1 | Composed: verify signed-in state | app/vayon/communications/inbox/page.tsx |
| /vayon/analytics/deals | Reporting | Understand performance | 0 | Composed: verify signed-in state | app/vayon/analytics/deals/page.tsx |
| /vayon/settings/profile | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/vayon/settings/profile/page.tsx |
| /vayon/analytics/crm | Reporting | Understand performance | 0 | Composed: verify signed-in state | app/vayon/analytics/crm/page.tsx |
| /vayon/team | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Redirect: retain one canonical home | app/vayon/team/page.tsx |
| /vayon/settings/product-intelligence | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/settings/product-intelligence/page.tsx |
| /vayon/communications/conversations/[conversationId] | Lead follow-up | Open the lead or conversation requiring follow-up | 0 | Composed: verify signed-in state | app/vayon/communications/conversations/[conversationId]/page.tsx |
| /vayon/communications/conversations | Lead follow-up | Open the lead or conversation requiring follow-up | 0 | Composed: verify signed-in state | app/vayon/communications/conversations/page.tsx |
| /vayon/creative-studio/brand-kits | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/creative-studio/brand-kits/page.tsx |
| /vayon/settings/plans | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/settings/plans/page.tsx |
| /vayon/creative-studio/assistant | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/creative-studio/assistant/page.tsx |
| /vayon/settings/permissions | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/settings/permissions/page.tsx |
| /vayon/communications/connectors | Lead follow-up | Open the lead or conversation requiring follow-up | 0 | Composed: verify signed-in state | app/vayon/communications/connectors/page.tsx |
| /vayon/creative-studio/assets | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/creative-studio/assets/page.tsx |
| /vayon/settings/payment-methods | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/settings/payment-methods/page.tsx |
| /vayon/settings | Occasional setup / administration | Configure the selected workspace setting | 1 | Composed: verify signed-in state | app/vayon/settings/page.tsx |
| /vayon/creative-studio/analytics | Reporting | Understand performance | 0 | Composed: verify signed-in state | app/vayon/creative-studio/analytics/page.tsx |
| /vayon/settings/organization | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/settings/organization/page.tsx |
| /vayon/communications/campaigns | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/communications/campaigns/page.tsx |
| /vayon/tasks | Morning | Choose and start the next task | 0 | Direct source review; runtime state unverified | app/vayon/tasks/page.tsx |
| /vayon/creative/[studio] | Marketing | Prepare marketing for a property | 0 | Redirect: retain one canonical home | app/vayon/creative/[studio]/page.tsx |
| /vayon/creative/videos | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/creative/videos/page.tsx |
| /vayon/system | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/system/page.tsx |
| /vayon/creative/templates | Marketing | Prepare marketing for a property | 0 | Direct source review; runtime state unverified | app/vayon/creative/templates/page.tsx |
| /vayon/analytics/conversion | Reporting | Understand performance | 0 | Direct source review; runtime state unverified | app/vayon/analytics/conversion/page.tsx |
| /vayon/settings/notifications | Occasional setup / administration | Configure the selected workspace setting | 1 | Direct source review; runtime state unverified | app/vayon/settings/notifications/page.tsx |
| /vayon/analytics/communications | Reporting | Understand performance | 0 | Composed: verify signed-in state | app/vayon/analytics/communications/page.tsx |
| /vayon/settings/members | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/settings/members/page.tsx |
| /vayon/settings/invoices/[invoiceId] | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/settings/invoices/[invoiceId]/page.tsx |
| /vayon/settings/invoices | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/settings/invoices/page.tsx |
| /vayon/settings/integrations | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/settings/integrations/page.tsx |
| /vayon/settings/billing/provider-health | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/settings/billing/provider-health/page.tsx |
| /vayon/settings/billing | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/settings/billing/page.tsx |
| /vayon/ai/workforce/[employeeId] | Morning | Choose and start the next task | 0 | Composed: verify signed-in state | app/vayon/ai/workforce/[employeeId]/page.tsx |
| /vayon/ai/workforce | Morning | Choose and start the next task | 0 | Composed: verify signed-in state | app/vayon/ai/workforce/page.tsx |
| /vayon/settings/appearance | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/settings/appearance/page.tsx |
| /vayon/success-center | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/vayon/success-center/page.tsx |
| /vayon/ai/work-queue | Morning | Choose and start the next task | 0 | Composed: verify signed-in state | app/vayon/ai/work-queue/page.tsx |
| /vayon/ai/tasks | Morning | Choose and start the next task | 0 | Composed: verify signed-in state | app/vayon/ai/tasks/page.tsx |
| /vayon/settings/integrations/microsoft | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/vayon/settings/integrations/microsoft/page.tsx |
| /vayon/creative/runtime | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/creative/runtime/page.tsx |
| /vayon/settings/ai/openai | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/vayon/settings/ai/openai/page.tsx |
| /vayon/ai/playground | Morning | Choose and start the next task | 0 | Composed: verify signed-in state | app/vayon/ai/playground/page.tsx |
| /vayon/ai | Morning | Choose and start the next task | 0 | Composed: verify signed-in state | app/vayon/ai/page.tsx |
| /vayon/settings/integrations/google | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/settings/integrations/google/page.tsx |
| /vayon/creative/runtime/execution | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/creative/runtime/execution/page.tsx |
| /vayon/settings/activity | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/settings/activity/page.tsx |
| /vayon/ai/knowledge | Occasional setup / administration | Configure the selected workspace setting | 0 | Redirect: retain one canonical home | app/vayon/ai/knowledge/page.tsx |
| /vayon/settings/integrations/data-import | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/settings/integrations/data-import/page.tsx |
| /vayon/creative/pipelines | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/creative/pipelines/page.tsx |
| /vayon/creative | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/creative/page.tsx |
| /vayon/runtime | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/vayon/runtime/page.tsx |
| /vayon/ai/history | Morning | Choose and start the next task | 0 | Composed: verify signed-in state | app/vayon/ai/history/page.tsx |
| /vayon/settings/google | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/vayon/settings/google/page.tsx |
| /vayon/creative/images | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/creative/images/page.tsx |
| /vayon/ai/goals | Morning | Choose and start the next task | 0 | Composed: verify signed-in state | app/vayon/ai/goals/page.tsx |
| /vayon/providers/[provider] | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/vayon/providers/[provider]/page.tsx |
| /vayon/providers | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/vayon/providers/page.tsx |
| /vayon/settings/email/templates | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/vayon/settings/email/templates/page.tsx |
| /vayon/ai/employees/[employeeId] | Morning | Choose and start the next task | 0 | Redirect: retain one canonical home | app/vayon/ai/employees/[employeeId]/page.tsx |
| /vayon/settings/email/queue | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/vayon/settings/email/queue/page.tsx |
| /vayon/settings/email | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/vayon/settings/email/page.tsx |
| /vayon/property-matching/reports | Reporting | Understand performance | 0 | Direct source review; runtime state unverified | app/vayon/property-matching/reports/page.tsx |
| /vayon/property-matching | Property work | Select a property to update or sell | 0 | Direct source review; runtime state unverified | app/vayon/property-matching/page.tsx |
| /vayon/settings/email/history | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/vayon/settings/email/history/page.tsx |
| /vayon/property-matching/compare | Property work | Select a property to update or sell | 0 | Direct source review; runtime state unverified | app/vayon/property-matching/compare/page.tsx |
| /vayon/settings/departments | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/settings/departments/page.tsx |
| /vayon/settings/configuration | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/settings/configuration/page.tsx |
| /vayon/creative/documents | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/creative/documents/page.tsx |
| /vayon/ai/employees | Morning | Choose and start the next task | 0 | Composed: verify signed-in state | app/vayon/ai/employees/page.tsx |
| /vayon/creative/cloud | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/creative/cloud/page.tsx |
| /vayon/properties/[propertyId] | Property work | Select a property to update or sell | 0 | Composed: verify signed-in state | app/vayon/properties/[propertyId]/page.tsx |
| /vayon/creative/campaigns | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/creative/campaigns/page.tsx |
| /vayon/ai/collaboration | Morning | Choose and start the next task | 0 | Composed: verify signed-in state | app/vayon/ai/collaboration/page.tsx |
| /vayon/creative/calendar | Marketing | Prepare marketing for a property | 0 | Direct source review; runtime state unverified | app/vayon/creative/calendar/page.tsx |
| /vayon/properties/[propertyId]/edit | Property work | Select a property to update or sell | 0 | Direct source review; runtime state unverified | app/vayon/properties/[propertyId]/edit/page.tsx |
| /vayon/ai/automations | Morning | Choose and start the next task | 0 | Composed: verify signed-in state | app/vayon/ai/automations/page.tsx |
| /vayon/admin/workspaces | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/admin/workspaces/page.tsx |
| /vayon/admin/users | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/admin/users/page.tsx |
| /vayon/admin/teams | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/admin/teams/page.tsx |
| /vayon/admin/roles | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/admin/roles/page.tsx |
| /vayon/admin/permissions | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/admin/permissions/page.tsx |
| /vayon/admin | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/admin/page.tsx |
| /vayon/properties/projects/[projectId] | Property work | Select a property to update or sell | 0 | Composed: verify signed-in state | app/vayon/properties/projects/[projectId]/page.tsx |
| /vayon/properties/projects | Property work | Select a property to update or sell | 0 | Composed: verify signed-in state | app/vayon/properties/projects/page.tsx |
| /vayon/properties/price-lists | Property work | Select a property to update or sell | 0 | Composed: verify signed-in state | app/vayon/properties/price-lists/page.tsx |
| /vayon/properties | Property work | Select a property to update or sell | 1 | Composed: verify signed-in state | app/vayon/properties/page.tsx |
| /vayon/admin/organizations | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/admin/organizations/page.tsx |
| /vayon/admin/departments | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/admin/departments/page.tsx |
| /vayon/admin/audit | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/vayon/admin/audit/page.tsx |
| /signup | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/signup/page.tsx |
| /reset-password | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/reset-password/page.tsx |
| /page.tsx | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Composed: verify signed-in state | app/page.tsx |
| /vayon/properties/grid | Property work | Select a property to update or sell | 0 | Composed: verify signed-in state | app/vayon/properties/grid/page.tsx |
| /vayon/properties/media | Property work | Select a property to update or sell | 0 | Composed: verify signed-in state | app/vayon/properties/media/page.tsx |
| /vayon/properties/inventory | Property work | Select a property to update or sell | 0 | Composed: verify signed-in state | app/vayon/properties/inventory/page.tsx |
| /vayon/properties/documents | Property work | Select a property to update or sell | 0 | Composed: verify signed-in state | app/vayon/properties/documents/page.tsx |
| /platform/operations | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/operations/page.tsx |
| /platform/workspaces | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/workspaces/page.tsx |
| /vayon/properties/availability | Property work | Select a property to update or sell | 0 | Composed: verify signed-in state | app/vayon/properties/availability/page.tsx |
| /platform/users | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/users/page.tsx |
| /platform/founder/workflows | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/founder/workflows/page.tsx |
| /platform/themes | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/themes/page.tsx |
| /platform/founder/tenants | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/founder/tenants/page.tsx |
| /platform/notifications | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/notifications/page.tsx |
| /vayon/properties/analytics | Reporting | Understand performance | 0 | Composed: verify signed-in state | app/vayon/properties/analytics/page.tsx |
| /platform/system-analytics | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/system-analytics/page.tsx |
| /platform/founder/sales | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/founder/sales/page.tsx |
| /platform/founder | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/founder/page.tsx |
| /platform/founder/access | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/founder/access/page.tsx |
| /platform/founder/operations | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/founder/operations/page.tsx |
| /platform/support | Occasional setup / administration | Configure the selected workspace setting | 1 | Composed: verify signed-in state | app/platform/support/page.tsx |
| /platform/launch-readiness | Occasional setup / administration | Configure the selected workspace setting | 0 | Redirect: retain one canonical home | app/platform/launch-readiness/page.tsx |
| /platform/settings | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/settings/page.tsx |
| /platform/founder/observability | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/founder/observability/page.tsx |
| /platform/feature-flags | Occasional setup / administration | Configure the selected workspace setting | 1 | Composed: verify signed-in state | app/platform/feature-flags/page.tsx |
| /vayon/properties/new | Property work | Select a property to update or sell | 0 | Redirect: retain one canonical home | app/vayon/properties/new/page.tsx |
| /vayon/creative/brand | Marketing | Prepare marketing for a property | 0 | Composed: verify signed-in state | app/vayon/creative/brand/page.tsx |
| /platform/integrations/webhooks | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/integrations/webhooks/page.tsx |
| /platform/deployment | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/deployment/page.tsx |
| /platform/integrations/secrets | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/integrations/secrets/page.tsx |
| /vayon/creative/assets | Marketing | Prepare marketing for a property | 0 | Direct source review; runtime state unverified | app/vayon/creative/assets/page.tsx |
| /platform/integrations/providers | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/integrations/providers/page.tsx |
| /platform/integrations | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/integrations/page.tsx |
| /platform/customers/[organizationId] | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/customers/[organizationId]/page.tsx |
| /platform/customers | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/customers/page.tsx |
| /platform/security-review | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/security-review/page.tsx |
| /platform/search | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/search/page.tsx |
| /platform/customer-success | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/customer-success/page.tsx |
| /platform/roles | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/roles/page.tsx |
| /platform/releases | Occasional setup / administration | Configure the selected workspace setting | 1 | Composed: verify signed-in state | app/platform/releases/page.tsx |
| /platform/permissions | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/permissions/page.tsx |
| /platform/audit | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/audit/page.tsx |
| /platform/region-management | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/region-management/page.tsx |
| /platform/country-management | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/country-management/page.tsx |
| /platform/platform-health | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/platform-health/page.tsx |
| /platform/applications | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/applications/page.tsx |
| /platform/command-center | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/command-center/page.tsx |
| /platform/activity | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/activity/page.tsx |
| /platform/founder/integrations | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/founder/integrations/page.tsx |
| /platform/founder/memory | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/founder/memory/page.tsx |
| /vayon/properties/map | Property work | Select a property to update or sell | 0 | Composed: verify signed-in state | app/vayon/properties/map/page.tsx |
| /platform/founder/command-center | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/founder/command-center/page.tsx |
| /platform/founder/customer-success | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/founder/customer-success/page.tsx |
| /platform/builder/settings | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/builder/settings/page.tsx |
| /platform/builder | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/builder/page.tsx |
| /platform/organizations | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/organizations/page.tsx |
| /platform | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/page.tsx |
| /platform/founder/marketing | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/founder/marketing/page.tsx |
| /platform/builder/features | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/builder/features/page.tsx |
| /platform/founder/ai | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/founder/ai/page.tsx |
| /platform/builder/navigation | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/builder/navigation/page.tsx |
| /platform/builder/applications | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/builder/applications/page.tsx |
| /platform/founder/intelligence | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/founder/intelligence/page.tsx |
| /platform/identity | Occasional setup / administration | Configure the selected workspace setting | 0 | Composed: verify signed-in state | app/platform/identity/page.tsx |
| /platform/builder/branding | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/builder/branding/page.tsx |
| /platform/integrations/logs | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/integrations/logs/page.tsx |
| /vayon/customer-success | Reconsider / public entry | Confirm a broker task or retain as a public / specialist entry | 0 | Redirect: retain one canonical home | app/vayon/customer-success/page.tsx |
| /platform/integrations/health | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/integrations/health/page.tsx |
| /platform/performance | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/performance/page.tsx |
| /platform/builder/modules | Occasional setup / administration | Configure the selected workspace setting | 0 | Direct source review; runtime state unverified | app/platform/builder/modules/page.tsx |
