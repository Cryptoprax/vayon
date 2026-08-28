import { ArrowRight, Menu } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand";
import { Button, ButtonLink } from "@/features/platform/design-system";
import { captureLeadAction } from "../actions/lead.actions";
import { MarketingCurrencyProvider } from "../currency/CurrencyDisplay";

const navigation = [
  { label: "Platform", href: "/product" },
  { label: "Solutions", href: "/solutions" },
  { label: "AI Employees", href: "/ai-workforce" },
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "/resources" },
] as const;

export function MarketingShell({ children }: { readonly children: ReactNode }) {
  return (
    <MarketingCurrencyProvider>
      <div className="vayon-premium-canvas vayon-marketing min-h-screen text-vds-foreground">
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
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="vds-focus rounded-lg px-2.5 py-2 text-sm text-vds-muted hover:bg-vds-hover hover:text-vds-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="vds-focus rounded-xl px-4 py-2 text-sm font-medium text-vds-muted hover:text-vds-foreground"
              >
                Sign In
              </Link>
              <ButtonLink
                href="/contact?intent=demo"
                size="sm"
                variant="outline"
              >
                Book Demo
              </ButtonLink>
              <ButtonLink href="/signup" size="sm">
                Start Free <ArrowRight className="size-4" aria-hidden="true" />
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
                <Link
                  href="/login"
                  className="vds-focus rounded-lg px-3 py-2.5 text-sm"
                >
                  Sign In
                </Link>
                <ButtonLink
                  href="/contact?intent=demo"
                  size="sm"
                  variant="outline"
                  fullWidth
                >
                  Book Demo
                </ButtonLink>
                <ButtonLink href="/signup" size="sm" fullWidth>
                  Start Free
                </ButtonLink>
              </nav>
            </details>
          </div>
        </header>
        <div id="marketing-content">{children}</div>
        <ConversionCta />
        <MarketingFooter />
      </div>
    </MarketingCurrencyProvider>
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
        ["Status", "/status"],
      ],
    ],
    [
      "Solutions for",
      [
        ["AI Sales Employees", "/solutions/ai-sales-employees"],
        ["Real Estate CRM", "/solutions/real-estate-crm"],
        ["Property Management", "/solutions/property-management"],
        ["WhatsApp Automation", "/solutions/whatsapp-automation"],
        ["Growth Intelligence", "/solutions/growth-intelligence"],
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
      "Trust",
      [
        ["Security", "/security"],
        ["Trust Center", "/trust-center"],
        ["Status", "/status"],
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
        ["Partners", "/partners"],
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
        ["Acceptable Use", "/acceptable-use-policy"],
        ["AI Usage", "/ai-usage-policy"],
        ["Data Processing", "/data-processing-addendum"],
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
            The AI Operating System built for modern real estate companies.
          </p>
          <p className="mt-6 text-xs text-vds-subtle">
            Built with governance at the core.
          </p>
          <form action={captureLeadAction} className="mt-8 max-w-sm">
            <input type="hidden" name="kind" value="newsletter" />
            <label className="text-sm font-semibold" htmlFor="footer-email">
              VAYON product notes
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
          <form action="/search" className="mt-6 max-w-sm">
            <label className="text-sm font-semibold" htmlFor="footer-search">
              Global Search
            </label>
            <div className="mt-3 flex gap-2">
              <input
                id="footer-search"
                name="q"
                maxLength={100}
                placeholder="Search VAYON"
                className="min-w-0 flex-1 rounded-xl border border-vds-border bg-vds-input px-3 text-sm"
              />
              <Button type="submit" size="sm" variant="outline">
                Search
              </Button>
            </div>
          </form>
          <address className="mt-6 text-xs not-italic leading-6 text-vds-subtle">
            VAYON · India · Monday–Friday, 09:00–18:00 IST
            <br />
            hello@vayon.online · sales@vayon.online
          </address>
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
        © {new Date().getUTCFullYear()} Vayon. Real estate operations powered by
        AI, under human control.
      </div>
    </footer>
  );
}

function ConversionCta() {
  return (
    <section
      aria-labelledby="public-conversion-heading"
      className="border-t border-vds-border px-5 py-20 sm:px-8"
    >
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-vds-accent-border bg-vds-surface px-6 py-14 text-center shadow-2xl sm:px-12">
        <p className="eyebrow">Move your real estate business forward</p>
        <h2
          id="public-conversion-heading"
          className="mt-4 text-3xl font-semibold tracking-[-.04em] sm:text-5xl"
        >
          See how VAYON turns property enquiries into closed deals.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-vds-muted">
          Start a workspace, explore the product, or plan a live walkthrough for
          your agents and leadership team.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/signup" size="lg">
            Start Free Trial
          </ButtonLink>
          <ButtonLink href="/contact?intent=demo" size="lg" variant="outline">
            Book Live Demo
          </ButtonLink>
          <ButtonLink href="/demo" size="lg" variant="ghost">
            Watch 2-Minute Demo
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
