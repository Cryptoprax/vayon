# User Experience Walkthrough

Phase 3 is a source-based walkthrough through three perspectives: solo broker, five-person agency, and 25-person agency owner. These are review personas, not recruited participants or authenticated test accounts. The current route audit covers 346 page files; the detailed daily route map remains in DAILY_WORKFLOW_AUDIT.md. No page was added.

## Three-second review

Each screen below identifies purpose and first action. Readability is a design assessment; no three-second comprehension timing is claimed.

| Screen | What is this? | What should I click first? | What would confuse each persona? | Improvement / remaining finding | Source |
|---|---|---|---|---|---|
| Landing | Run your real estate day from one workspace | Start Free Trial | Solo: whether this helps basic follow-up; 5-person: shared client ownership; 25-person: access and accountability | Removed timed/superlative hero and metadata claims; keep one primary signup entry. Other lower-page marketing claims need evidence review. | features/marketing/components/Homepage.tsx |
| Signup | Create an account | Create account or continue with Google | Solo: perceived setup effort; 5-person: existing invitation vs new workspace; 25-person: identity and admin access | Existing authentication reused. Google/email completion requires configured QA credentials; no signup was submitted. | app/signup/page.tsx |
| Workspace creation | Set up the business | Continue existing onboarding | Solo: team/industry choices feel excessive; 5-person: which colleague owns setup; 25-person: team structure and access choices | Recommend treating optional team setup as later work. Existing recovery and authorization remain unchanged. | features/onboarding/components/EnterpriseOnboardingWizard.tsx |
| Dashboard | Choose today's next action | Start today's work | Solo: empty figures; 5-person: own work vs team work; 25-person: priorities vs aggregate totals | Phase 2 hierarchy retained. Counts remain existing evidence, not a completion promise. | features/vayon/dashboard/components/DashboardShell.tsx |
| CRM | Follow up a client or update a property | Select the relevant record | Solo: CRM vocabulary; 5-person: repeated ownership selection; 25-person: cross-team visibility | Existing Sell & follow up navigation reused; common actions receive direct search entries. | features/vayon/product-shell/navigation.ts |
| Property | Prepare a property for sale | Complete core details and save | Solo: ten sections; 5-person: who supplies photos; 25-person: which details persist | Default navigation now visits four core sections then save. Optional sections remain. Photo previews explicitly do not upload or persist. | features/vayon/property/components/PropertyWizard.tsx |
| Lead | Record a contact and plan follow-up | Save lead, then choose next conversation | Solo: qualification before capture; 5-person: assignment; 25-person: duplicates and ownership | Default contact/requirements/review path; source, matching and assignment available under optional details. Save feedback brings existing next steps higher. | features/vayon/lead/components/LeadWizard.tsx |
| Deal | Move an opportunity forward | Update existing deal and choose next step | Solo: closing terminology; 5-person: hand-off; 25-person: agreement and approval responsibility | Existing next-step links brought near save feedback. Agreement opens existing document tooling; no guarantee it is generated. | app/vayon/deals/[dealId]/page.tsx |
| Marketing | Prepare material for a property | Create Campaign or Generate Brochure | Solo: many studios; 5-person: approval hand-off; 25-person: brand control | Commands now open existing campaign/document tools directly. Missing generation or upload capability is not simulated. | features/vayon/cross-module-intelligence/command-router.ts |
| Reports | Understand performance | Choose a report | Solo: sparse figures; 5-person: team comparisons; 25-person: export and reporting trust | Existing analytics kept. Existing executive CSV export is searchable; data completeness and download contents require destination QA. | features/vayon/analytics-platform/dashboard/AnalyticsRoute.tsx |
| Settings | Configure the business | Update business details or invite colleague | Solo: unnecessary team options; 5-person: invitation discoverability; 25-person: role consequences | Invite Team searchable; Reset Password exposed in existing profile menu; permissions unchanged. | features/vayon/product-shell/ShellMenus.tsx |

## Role and state boundaries

The solo broker can defer optional qualification and team work. A five-person team can still choose assignment and matching before saving. A 25-person owner retains the same role gates and approval requirements; no access was widened for convenience. Empty, populated, denied-access, expired-session and failed-save states need signed-in QA. Source review cannot certify the real behavior or timing of every composed page.
