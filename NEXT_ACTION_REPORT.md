# Next action review

| Existing evidence | Visible suggestion | Existing destination |
| --- | --- | --- |
| Property description empty | Complete property details | Property edit |
| Property description recorded | Prepare property marketing | Creative documents |
| Lead lacks phone and email | Add contact details | Lead edit |
| Lead has contact details | Review follow-up tasks | Tasks |
| Deal completed stage or won status | Prepare closing paperwork | Creative documents |
| Other deal state | Review deal tasks | Tasks |
| Client linked to lead | Review linked lead | Exact lead record |
| Client has no linked lead | Record client requirements | Create lead |
| No evidence supplied | Explain that no prepared work is confirmed | Optional existing actions only |

All four main entity pages pass existing record evidence to the same component, including success-return states. No extra data load occurs. Record IDs are URL encoded. Query context does not guarantee the destination prefills or filters; users must verify the selected record. Creating a lead does not automatically link the client.

Property image relations are absent from the loaded property contract. The UI does not infer missing photos. A description is sufficient to suggest reviewing the marketing tool, not sufficient to declare a brochure ready. Brochure/message readiness and approval status are not inferred from entity completeness.

Existing entity tabs for documents/marketing/tasks can be placeholders; suggestions use existing working tools instead. No new completion capability was implemented.
