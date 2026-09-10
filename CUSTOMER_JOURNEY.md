# Customer Journey

## Intended journey and actual implementation

| Stage | Existing destination | Primary job | Verification / limitation |
|---|---|---|---|
| Discover | / | Understand the real estate product | Existing landing page retained |
| Sign up | /signup | Create account | Existing authentication untouched; external email and tenant lifecycle not exercised |
| Workspace | /onboarding | Set up workspace | Existing onboarding/bootstrap reused |
| Dashboard | /vayon/dashboard | See business priorities | Duplicate prompt bar, work queue, secondary briefing and AI entry grids removed |
| Getting Started | /vayon/dashboard#getting-started-title | Choose next setup step | Existing checklist extended; property then lead then first task highlighted |
| Add property | /vayon/properties/new | Create property | Existing form/mutation unchanged |
| Add lead | /vayon/leads/new | Capture lead | Existing form/mutation unchanged |
| Invite team | /vayon/settings/members | Invite collaborators | Existing role restrictions apply |
| Plan campaign | /vayon/growth | Plan acquisition work | Checklist entry currently opens existing Growth; generation requires Creative access |
| Generate campaign | /vayon/creative/campaigns | Prepare campaign draft | Founder visibility/access gate blocks ordinary customer completion |
| First task | /vayon/tasks | Complete a concrete follow-up | Existing task flow reused; no synthetic completion |
| Daily usage | CRM records ? contextual AI ? approval ? Reports | Follow up, market and close | Existing Sprint 218 router carries record IDs and prompts |

## Evidence rules

The checklist uses existing KPI and recent-activity evidence only. Missing team/task/campaign events are not proof the steps were never completed. The current projection cannot certify completion of this entire journey, so a fully guided end-to-end customer flow is still a beta blocker. No account was created and no outbound invitation or campaign was sent.

## Required signed-in acceptance run

Use an approved QA workspace and each supported customer role. Complete signup/email verification, create a property and lead, invite a team member, prepare a campaign, review approval and complete a task. Verify visible next steps, back navigation, search result opening, role restrictions and persisted state. Test keyboard-only at 320/375/768/1024/1440/1920px, 200% zoom and reduced motion. Confirm that permission denial has a useful return path. This run has not been performed.
