import { ArrowRight, Menu } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand";
import { Button, ButtonLink } from "@/features/platform/design-system";
import { captureLeadAction } from "../actions/lead.actions";
import { MarketingCurrencyProvider } from "../currency/CurrencyDisplay";

const navigation = [
  { label: "Product", href: "/product" },
  { label: "AI Employees", href: "/ai-workforce" },
  { label: "Solutions", href: "/solutions" },
  { label: "Customers", href: "/customers" },
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "/resources" },
  { label: "Developers", href: "/developers" },
] as const;
export const realEstateSolutions = [
  "Residential Sales",
  "Commercial Real Estate",
  "Property Developers",
  "Real Estate Brokerages",
  "Luxury Real Estate",
  "Property Management",
  "Channel Partners",
  "Builder Sales",
  "Pre-Sales Teams",
  "CRM Automation",
  "AI Employees",
  "Lead Qualification",
  "Property Intelligence",
] as const;
const solutionHref = (label: string) =>
  `/solutions#${label.toLowerCase().replaceAll(" ", "-")}`;

export function MarketingShell({ children }: { readonly children: ReactNode }) {
  return (
    <MarketingCurrencyProvider><div className="vayon-premium-canvas vayon-marketing min-h-screen text-vds-foreground">
      <a
        href="#marketing-content"
        className="vds-focus sr-only z-50 rounded-lg bg-vds-surface px-4 py-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-vds-border bg-vds-background/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-18 max-w-[90rem] items-center gap-5 px-5 sm:px-8">
          <Link
            href="/"
            aria-label="Vayon home"
            className="vds-focus flex shrink-0 items-center rounded-lg"
          >
            <BrandLogo size="sm" priority />
          </Link>
          <nav
            aria-label="Primary"
            className="hidden flex-1 items-center justify-center gap-0.5 xl:flex"
          >
            {navigation.map((item) =>
              item.label === "Solutions" ? (
                <details className="group relative" key={item.href}>
                  <summary className="vds-focus cursor-pointer list-none rounded-lg px-2.5 py-2 text-sm text-vds-muted hover:bg-vds-hover hover:text-vds-foreground">
                    Solutions
                  </summary>
                  <div className="absolute left-1/2 top-11 grid w-[38rem] -translate-x-1/2 grid-cols-2 gap-1 rounded-2xl border border-vds-border bg-vds-surface p-3 shadow-xl">
                    {realEstateSolutions.map((solution) => (
                      <Link
                        key={solution}
                        href={solutionHref(solution)}
                        className="vds-focus rounded-lg px-3 py-2 text-sm text-vds-muted hover:bg-vds-hover hover:text-vds-foreground"
                      >
                        {solution}
                      </Link>
                    ))}
                  </div>
                </details>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="vds-focus rounded-lg px-2.5 py-2 text-sm text-vds-muted hover:bg-vds-hover hover:text-vds-foreground"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <Link
              href="/login"
              className="vds-focus rounded-xl px-4 py-2 text-sm font-medium text-vds-muted hover:text-vds-foreground"
            >
              Login
            </Link>
            <ButtonLink href="/signup" size="sm">
              Start Free Trial <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          </div>
          <details className="relative ml-auto xl:hidden">
            <summary
              aria-label="Open navigation"
              className="vds-focus grid size-11 list-none place-items-center rounded-xl border border-vds-border"
            >
              <Menu className="size-5" aria-hidden="true" />
            </summary>
            <nav
              aria-label="Mobile"
              className="absolute right-0 top-13 grid max-h-[75vh] w-72 gap-1 overflow-y-auto rounded-2xl border border-vds-border bg-vds-surface p-3 shadow-xl"
            >
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="vds-focus rounded-lg px-3 py-2.5 text-sm hover:bg-vds-hover"
                >
                  {item.label}
                </Link>
              ))}
              <span className="px-3 pt-2 text-xs font-semibold uppercase tracking-wider text-vds-subtle">
                Real estate solutions
              </span>
              {realEstateSolutions.map((solution) => (
                <Link
                  key={solution}
                  href={solutionHref(solution)}
                  className="vds-focus rounded-lg px-3 py-2.5 text-sm hover:bg-vds-hover"
                >
                  {solution}
                </Link>
              ))}
              <Link
                href="/login"
                className="vds-focus rounded-lg px-3 py-2.5 text-sm"
              >
                Login
              </Link>
              <ButtonLink href="/signup" size="sm" fullWidth>
                Start Free Trial
              </ButtonLink>
            </nav>
          </details>
        </div>
      </header>
      <div id="marketing-content">{children}</div>
      <MarketingFooter />
    </div></MarketingCurrencyProvider>
  );
}

function MarketingFooter() {
  const groups = [
    [
      "Platform",
      [
        ["Features", "/features"],
        ["AI Workforce", "/ai-workforce"],
        ["CRM", "/crm"],
        ["Workflows", "/workflows"],
        ["Integrations", "/integrations"],
      ],
    ],
    [
      "Resources",
      [
        ["Documentation", "/docs"],
        ["Blog", "/blog"],
        ["ROI Calculator", "/roi-calculator"],
        ["Demo Workspace", "/demo"],
        ["Customers", "/customers"],
        ["Status", "/trust-center"],
      ],
    ],
    [
      "Developers",
      [
        ["Developer Portal", "/developers"],
        ["API Reference", "/docs/api-reference"],
        ["Architecture", "/docs/architecture-overview"],
        ["Release Notes", "/docs/release-notes"],
      ],
    ],
    [
      "Real Estate",
      [
        ["Security", "/security"],
        ["Trust Center", "/trust-center"],
        ["Pricing", "/pricing"],
        ["Contact Sales", "/contact"],
      ],
    ],
    [
      "Company",
      [
        ["About", "/about"],
        ["Careers", "/careers"],
        ["Media Kit", "/media-kit"],
        ["Investors", "/investors"],
      ],
    ],
    [
      "Legal",
      [
        ["Privacy", "/privacy"],
        ["Terms", "/terms"],
        ["Cookies", "/cookie-policy"],
        ["Refunds", "/refund-policy"],
        ["Support", "/support-policy"],
      ],
    ],
    [
      "Social",
      [
        ["LinkedIn", "/contact?intent=social&channel=linkedin"],
        ["X", "/contact?intent=social&channel=x"],
      ],
    ],
  ] as const;
  return (
    <footer className="border-t border-vds-border bg-vds-surface/30">
      <div className="mx-auto grid max-w-[90rem] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.2fr_3fr]">
        <div>
          <BrandLogo size="md" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-vds-muted">
            The AI operating system for modern real estate companies.
          </p>
          <p className="mt-6 text-xs text-vds-subtle">
            Built with governance at the core.
          </p>
          <form action={captureLeadAction} className="mt-8 max-w-sm">
            <input type="hidden" name="kind" value="newsletter" />
            <label className="text-sm font-semibold" htmlFor="footer-email">
              Real estate product notes
            </label>
            <div className="mt-3 flex gap-2">
              <input
                id="footer-email"
                name="email"
                type="email"
                required
                maxLength={254}
                placeholder="Business email"
                className="min-w-0 flex-1 rounded-xl border border-vds-border bg-vds-input px-3 text-sm"
              />
              <Button type="submit" size="sm">
                Subscribe
              </Button>
            </div>
            <p className="mt-2 text-xs text-vds-subtle">
              Product updates. No unsolicited messages.
            </p>
          </form>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 xl:grid-cols-7">
          {groups.map(([title, links]) => (
            <nav key={title} aria-label={title}>
              <h2 className="text-sm font-semibold">{title}</h2>
              <ul className="mt-4 space-y-3">
                {links.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="vds-focus rounded text-sm text-vds-muted hover:text-vds-foreground"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-vds-border px-5 py-5 text-center text-xs text-vds-subtle">
        © {new Date().getUTCFullYear()} Vayon. Real estate AI, under human
        control.
      </div>
    </footer>
  );
}
