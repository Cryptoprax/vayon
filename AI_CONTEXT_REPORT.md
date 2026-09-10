# AI Context Report

| Existing surface | Does work begin in CRM? | Does it leave the record? | Recommendation / phase outcome |
|---|---|---|---|
| Property ContextualAIActions | Yes: property ID and label | Yes: existing creative/workforce destination | Keep contextual launch; checklist now says Promote a Property and opens Properties. Verify destination consumes the property ID before promising one-step generation |
| Lead ContextualAIActions | Yes: lead ID and label | Yes: sales assistant/workflow | Keep three visible suggestions and More actions; no new AI page |
| Client / company ContextualAIActions | Yes | Yes | Retain account context; avoid pretending client cards have confidence or matching data |
| Deal ContextualAIActions | Yes: deal ID and label | Yes | Reuse proposal, task and performance commands; no new deal AI runtime |
| Universal Bar | Sometimes: query text, not always a selected record | Yes | Rank actionable matches; preserve review and permission gates |
| Executive dashboard | Existing workspace projection | Recommendation links navigate | Existing V3 duplicate-surface removals retained; no new assistant entry |
| Creative Center / Campaign Studio | Often an isolated page | Wizard asks for project/brand context | Prefer starting from a property. Inline execution or automatically populating missing context would require separately reviewed work |
| Workforce / AI work / approvals | Operational follow-up, not initial CRM capture | Dedicated existing workspaces | Contextual navigation retained; founder-only visibility and process-local approval data are gaps |
| Client directory | No authoritative AI scores in current projection | Profile link only | Removed unavailable confidence/property-match tiles; display actual relationship data |

## Rules applied

No AI system, page, prompt engine or command router was added. No model output or scoring was invented. Approval-required context remains in existing commands. Launching AI from a record is contextual placement, but it does not prove the destination maintains that context end-to-end; this still needs an authenticated walkthrough.

## Recommended follow-up

Audit destination handling of propertyId, leadId, clientId, companyId and dealId, return-to-record behavior and role-denied actions. Prefer returning results to the record rather than adding more standalone AI pages. Keep proposals/drafts separate from sending or publication.

