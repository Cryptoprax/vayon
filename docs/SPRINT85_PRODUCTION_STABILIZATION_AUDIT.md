# Sprint 85 production stabilization audit

## Founder acceptance journey

Static route, service, and build verification covers Homepage → Book Demo / Contact Sales → Signup → Login → Organization → Projects → Inventory → CRM → Property Matching → Site Visits → Communications → Marketing Studio → Growth Studio → Billing → Reports / Analytics. Contact persistence and optional telemetry now have timeout, retry, degradation, correlation, and migration repair coverage.

## Defects corrected

- Corrected the public canonical, sitemap, and robots fallback from the obsolete `vayon.app` host to `www.vayon.online`, while retaining `NEXT_PUBLIC_APP_URL` as the deployment authority.
- Added a branded, accessible root 404 instead of the framework default.
- Added a secret-safe global recovery boundary with a retry action.
- Added the Cookie, Refund, and Support policy routes already required by the launch checklist, and linked them from the existing footer without changing its layout.
- Retained the Sprint 84.2 contact and marketing-event reliability forward fix.

## Certification evidence

TypeScript, ESLint, the full regression suite, production build, theme, UX, CTA, product certification, production readiness, and Sprint 85 security/performance/accessibility/SEO/journey/legal static audits are release gates.

## Runtime evidence still required

These checks cannot be truthfully certified by source inspection: production database migration application, managed backup restore, real Stripe/Razorpay transaction lifecycle, live provider credentials, alert delivery, authenticated founder-journey execution, real iPhone/Android/tablet interaction, Safari/Firefox/Edge rendering, screen-reader sessions, and measured Core Web Vitals. They remain launch-environment sign-off items rather than claimed passes.
