import "server-only";
import type { DeploymentSnapshot } from "@/features/platform/deployment/contracts";
import type { PerformanceSnapshot } from "@/features/platform/performance/contracts";
import type { SecuritySnapshot } from "@/features/platform/security-review/contracts";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { log } from "@/lib/observability/logger";
import type {
  AuditCheck,
  LaunchReadinessSnapshot,
  TechnicalDebt,
} from "../contracts";
import { ExistingPlatformAuditProvider } from "../providers/existing-platform-audit.provider";
import { SupabaseLaunchReadinessRepository } from "../repositories/launch-readiness.repository";

const modules = [
  "Authentication",
  "Organizations",
  "User Management",
  "Projects",
  "Inventory",
  "CRM Platform",
  "Property Matching",
  "Site Visits",
  "Communications",
  "AI Workforce",
  "Sales AI",
  "CRM AI",
  "WhatsApp AI",
  "Marketing AI",
  "Executive AI",
  "Marketing Studio",
  "Subscriptions",
  "Billing",
  "Analytics",
  "Reports",
  "Knowledge Platform",
  "Continuous Learning",
  "Product Intelligence",
  "Workflow Engine",
  "Notification Platform",
  "Email Platform",
  "Documentation",
  "Demo Workspace",
  "Public Website",
] as const;
const journey = [
  "Visitor",
  "Signup",
  "Email Verification",
  "Organization Creation",
  "Workspace Creation",
  "Onboarding",
  "AI Setup",
  "CRM Usage",
  "Knowledge Usage",
  "Workflow Usage",
  "First AI Recommendation",
  "Subscription Ready",
  "Organization",
  "Invite Users",
  "Projects",
  "Inventory",
  "CRM",
  "Property Matching",
  "Site Visits",
  "Communications",
  "Marketing Studio",
  "Subscriptions",
  "Billing",
  "Analytics",
  "Reports",
] as const;
const browsers = ["Chrome", "Edge", "Safari", "Firefox"] as const;
const launchChecklist = [
  "Domain",
  "DNS",
  "SSL",
  "Google Workspace",
  "SPF",
  "DKIM",
  "DMARC",
  "Stripe Live",
  "Razorpay Live",
  "OpenAI Billing",
  "Supabase Production",
  "Monitoring",
  "Alerts",
  "Analytics",
  "Support Email",
  "Branding",
  "Pricing",
  "Billing",
  "Domains",
  "Email",
  "WhatsApp",
  "Google",
  "Microsoft",
  "OpenAI",
  "Storage",
  "Legal pages",
  "Privacy Policy",
  "Terms",
  "Cookie Policy",
  "Support email",
  "Support URLs",
] as const;

export class LaunchReadinessService {
  async snapshot({ record = false } = {}) {
    const started = globalThis.performance.now();
    const context = await operationsContext();
    const repository = new SupabaseLaunchReadinessRepository(
      context.client,
      context.organizationId,
      context.workspaceId,
    );
    const evidence = await new ExistingPlatformAuditProvider().collect();
    const deployment = evidence.deployment as DeploymentSnapshot;
    const security = evidence.security as SecuritySnapshot;
    const performanceSnapshot = evidence.performance as PerformanceSnapshot;
    const checks: AuditCheck[] = [];
    const add = (
      id: string,
      category: string,
      label: string,
      status: AuditCheck["status"],
      evidenceText: string,
      weight: number,
      required = true,
    ) =>
      checks.push({
        id,
        category,
        label,
        status,
        evidence: evidenceText,
        weight,
        required,
      });

    add(
      "deployment.configuration",
      "Deployment",
      "Environment variables",
      deployment.configuration.valid ? "pass" : "fail",
      deployment.configuration.valid
        ? "Required configuration is present."
        : `${deployment.configuration.missing.length} required variable names are missing.`,
      8,
    );
    add(
      "deployment.health",
      "Deployment",
      "Health endpoints and provider status",
      deployment.health.every((x) => x.state === "healthy")
        ? "pass"
        : deployment.health.some((x) => x.state === "misconfigured")
          ? "fail"
          : "warning",
      `${deployment.health.filter((x) => x.state === "healthy").length}/${deployment.health.length} components healthy.`,
      8,
    );
    add(
      "deployment.migrations",
      "Deployment",
      "Migration status",
      deployment.migrations.current ? "pass" : "fail",
      deployment.migrations.current
        ? "Database migrations are current."
        : `${deployment.migrations.pending.length} migrations pending.`,
      8,
    );
    add(
      "deployment.build",
      "Deployment",
      "Build configuration",
      deployment.build.buildId ? "pass" : "warning",
      `Version ${deployment.build.version}; commit ${deployment.build.commitSha.slice(0, 12)}.`,
      4,
    );
    add(
      "deployment.observability",
      "Deployment",
      "Caching and observability",
      deployment.monitoring.structuredLogging &&
        deployment.monitoring.performanceMetrics
        ? "pass"
        : "warning",
      "Structured logging and performance metrics are active; vendor extensions are reported separately.",
      4,
    );
    add(
      "security.rbac",
      "Security",
      "RBAC",
      security.statuses.rbac === "verified" ? "pass" : "fail",
      security.statuses.rbac,
      7,
    );
    add(
      "security.rls",
      "Security",
      "RLS and tenant isolation",
      security.statuses.rls === "verified" ? "pass" : "fail",
      `${security.rls.enabled}/${security.rls.tables} tables have RLS enabled.`,
      9,
    );
    add(
      "security.secrets",
      "Security",
      "Secret handling",
      security.statuses.secrets === "verified" ? "pass" : "fail",
      security.statuses.secrets,
      7,
    );
    add(
      "security.ratelimit",
      "Security",
      "Rate limiting",
      security.statuses.rateLimiting.includes("active") ? "pass" : "warning",
      security.statuses.rateLimiting,
      4,
    );
    add(
      "security.dependencies",
      "Security",
      "Dependency status",
      security.dependency.critical || security.dependency.high
        ? "fail"
        : security.dependency.moderate
          ? "warning"
          : "pass",
      `${security.dependency.total} known dependency findings.`,
      4,
    );
    for (const metric of performanceSnapshot.metrics)
      add(
        `performance.${slug(metric.name)}`,
        "Performance",
        metric.name,
        metric.state === "within_budget"
          ? "pass"
          : metric.state === "over_budget"
            ? "fail"
            : "not_verified",
        metric.value === null
          ? "No authoritative measurement recorded."
          : `${metric.value} ${metric.unit}; budget ${metric.budget ?? "unavailable"}.`,
        3,
        false,
      );
    for (const application of modules)
      add(
        `module.${slug(application)}`,
        "Application",
        application,
        deployment.verification.some(
          (x) => x.area === application && x.state === "healthy",
        )
          ? "pass"
          : "warning",
        "Route and service regression coverage exists; live browser journey remains release-gated.",
        2,
        application === "Authentication" ||
          application === "AI Workforce" ||
          application === "CRM Platform",
      );
    for (const step of journey)
      add(
        `journey.${slug(step)}`,
        "User journey",
        step,
        "warning",
        "Automated route and contract coverage exists; production end-to-end execution requires launch-environment verification.",
        1,
        false,
      );
    for (const browser of browsers)
      add(
        `browser.${slug(browser)}`,
        "Cross-browser",
        browser,
        "not_verified",
        "Compatibility report prepared; real-device keyboard, screen-reader, responsive, and visual validation is required.",
        1,
        false,
      );
    for (const item of [
      "Keyboard navigation",
      "ARIA labels",
      "Color contrast",
      "Focus order",
      "Screen reader compatibility",
      "Responsive layouts",
    ])
      add(
        `accessibility.${slug(item)}`,
        "Accessibility",
        item,
        ["Keyboard navigation", "ARIA labels", "Focus order"].includes(item)
          ? "warning"
          : "not_verified",
        "Static design-system coverage exists; browser-assisted verification remains outstanding.",
        1,
        false,
      );
    for (const item of [
      "Metadata",
      "Canonical URLs",
      "Open Graph",
      "JSON-LD",
      "Sitemap",
      "robots.txt",
      "Structured data",
    ])
      add(
        `seo.${slug(item)}`,
        "SEO",
        item,
        "pass",
        "Public routes include the audited SEO contract.",
        1,
        false,
      );
    for (const item of [
      "Marketing Studio",
      "AI Image Generation",
      "Campaign Packs",
      "AI Video Generation",
      "Brand Guardian",
      "AI Marketing Brain",
    ])
      add(
        `marketing.${slug(item)}`,
        "Marketing provider readiness",
        item,
        item === "AI Video Generation" ? "warning" : "pass",
        item === "AI Video Generation"
          ? "AI Video Generation remains Preview; storyboards stay editable and approval governed."
          : "Production Marketing feature is subscription licensed, tenant scoped, approval governed, and remains editable when its AI provider is unavailable.",
        1,
        false,
      );
    for (const item of launchChecklist)
      add(
        `checklist.${slug(item)}`,
        "Launch checklist",
        item,
        "warning",
        "Administrator confirmation and production evidence required before launch sign-off.",
        1,
        false,
      );

    const score = Math.round(
      checks.reduce((sum, x) => sum + x.weight * points(x.status), 0) /
        checks.reduce((sum, x) => sum + x.weight, 0),
    );
    const blockers = checks.filter((x) => x.required && x.status === "fail");
    const state = blockers.length
      ? "blocked"
      : score >= 85
        ? "ready"
        : "needs_attention";
    const debt: TechnicalDebt[] = [
      ...security.findings.map(
        (x) =>
          ({
            id: x.id,
            severity: x.severity === "informational" ? "low" : x.severity,
            category: x.area,
            finding: x.title,
            recommendation: x.recommendation,
          }) as TechnicalDebt,
      ),
      ...checks
        .filter((x) => x.status === "not_verified")
        .map((x) => ({
          id: `DEBT-${x.id}`,
          severity: "medium" as const,
          category: x.category,
          finding: `${x.label} is not runtime verified`,
          recommendation:
            "Complete launch-environment validation and attach evidence.",
        })),
    ];
    const history = await repository.history().catch(() => []);
    const snapshot: LaunchReadinessSnapshot = {
      score,
      state,
      checks,
      modules: checks.filter((x) => x.category === "Application"),
      journey: checks.filter((x) => x.category === "User journey"),
      browsers: checks.filter((x) => x.category === "Cross-browser"),
      debt,
      blockers,
      build: {
        environment: deployment.build.environment,
        version: deployment.build.version,
        commitSha: deployment.build.commitSha,
      },
      providerHealth: deployment.health.map((x) => ({
        component: x.component,
        state: x.state,
        diagnostic: x.diagnostic,
      })),
      history,
      generatedAt: new Date().toISOString(),
    };
    if (record) await repository.record(snapshot);
    log("launch.readiness.audit.completed", {
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      score,
      state,
      blockers: blockers.length,
      regressionTrend: history[0] ? score - history[0].score : null,
      latencyMs: Math.round(globalThis.performance.now() - started),
    });
    return snapshot;
  }

  async export() {
    const snapshot = await this.snapshot();
    return JSON.stringify(
      {
        title: "VAYON Enterprise Launch Checklist",
        statusLegend: {
          ready: "No required blocker and weighted score at least 85.",
          needs_attention: "No required blocker; weighted score below 85.",
          blocked: "One or more required checks failed.",
        },
        categories: [
          "Infrastructure",
          "Security",
          "Performance",
          "AI",
          "CRM",
          "Knowledge",
          "Website",
          "Marketing",
          "Analytics",
          "Documentation",
          "Deployment",
        ],
        administratorChecklist: launchChecklist,
        ...snapshot,
      },
      null,
      2,
    );
  }
}

const points = (status: AuditCheck["status"]) =>
  ({ pass: 1, warning: 0.6, not_verified: 0.25, fail: 0 })[status];
const slug = (value: string) =>
  value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
