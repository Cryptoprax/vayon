# UX Copy Guide

Write for a broker deciding what to accomplish now. Be professional, friendly and direct. Explain the business outcome before the tool that enables it.

## Page structure

1. Name one job: follow up a lead, prepare a property, plan a campaign, close a deal or understand performance.
2. Explain why it matters in one short sentence.
3. Give one primary action supported by the current screen. Keep alternatives secondary or disclose them when needed.

Primary means the main action in the active page or modal state, not every link in the application. A reporting page may use focused report controls rather than an invented action button. A save action must not claim to publish, sell or convert unless that operation actually occurs.

## Shared vocabulary

| Job | Use | Avoid |
|---|---|---|
| Add a record | Create Property, Create Lead, Create Deal, Create Campaign | New transaction, Capture lead, Ingest inventory |
| Continue work | Start today's work; Review deals; Plan your next task | Executive command center, Work queue |
| Market a listing | Market this property; Create marketing assets | Manage assets, Creative orchestration |
| Review assistance | AI Assistant; Today's AI Tasks | Workforce topology, Agent orchestration |
| Review results | Understand performance; Marketing Performance | Deterministic intelligence, Growth Center |
| Change business setup | Configure workspace; Update business details | Enterprise administration platform |
| Explain missing figures | No figures yet, followed by a specific next step | Unavailable without guidance |

Use short sentence-case prose and section headings. Keep shared creation action names consistent across search, buttons and empty states. Keep the existing names of customer records unchanged.

## Empty, loading, error and success states

- Empty: state what is missing, why it matters, and the next supported action. Example: No deals yet. Create a deal when a buyer is ready to make an offer.
- Filtered empty: distinguish no matches from no records. Suggest clearing filters before implying the workspace is empty.
- Loading: say what is loading; use the existing live status and reduced-motion skeletons.
- Error: describe the failed operation and a real recovery action. Never promise data was saved or untouched unless the application knows that.
- Success: name the completed action only after the existing success result. Example: Property saved. Avoid unverified promises about publication or AI execution.
- AI: offer assistance only when the current record or workflow supplies useful context. Do not append generic AI promotions to every empty state.
- Advanced evidence: keep sources and calculation details accessible behind disclosure. Never replace unknown figures with invented values or imply that configuration guarantees an unavailable service will work.

## Accessibility and accuracy

Use descriptive link names and existing button semantics. Keep one h1/job heading per page where the composition supports it. Do not rely on color alone for status. Avoid vague Open/Continue labels when the destination would be unclear. Keep role restrictions truthful; copy changes must not bypass authorization.

This guide defines the target tone. Runtime messages, user-generated content and translations require separate review; no wholesale replacement of service errors or database values occurred in this phase.
