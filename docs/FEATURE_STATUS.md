# RC1 feature status

| Flag | Classification | RC1 activation decision |
| --- | --- | --- |
| vayon_intelligence | Production Ready | Enabled by default; explicit false is the emergency kill switch. |
| ai | Production Ready / dependency-bound | Enable only with healthy OpenAI billing and provider validation. |
| gmail | Production Ready / dependency-bound | Enable only with Google credentials and incremental consent. |
| whatsapp | Production Ready / dependency-bound | Enable only with Meta credentials and verified webhook. |
| stripe | Production Ready / dependency-bound | Enable only with live credentials, prices, and webhook verification. |
| google_identity | Production Ready / dependency-bound | Explicit configuration required. |
| google_calendar | Production Ready / dependency-bound | Explicit configuration and consent required. |
| google_drive | Production Ready / dependency-bound | Explicit configuration and consent required. |
| google_contacts | Production Ready / dependency-bound | Explicit configuration and consent required. |
| microsoft_identity | Production Ready / dependency-bound | Explicit Entra configuration required. |
| workflow_runtime | Production Ready / database-bound | Keep disabled until workflow schema patch and post-deploy verification pass. |
| beta | Experimental | Disabled unless deliberately enabled in a non-production experiment. |

Marketing Studio is plan-licensed and has no beta flag. Referrals, affiliates, autonomous AI, live social publishing, and video rendering remain unactivated. No credential-dependent flag was changed without proven infrastructure.
