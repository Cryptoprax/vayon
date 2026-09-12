import Link from "next/link";
import type { ReactNode } from "react";
const navigation = [
  ["Inventory", "/vayon/properties"],
  ["Grid", "/vayon/properties/grid"],
  ["Map", "/vayon/properties/map"],
  ["Availability", "/vayon/properties/availability"],
  ["Documents", "/vayon/properties/documents"],
  ["Analytics", "/vayon/properties/analytics"],
] as const;
export function PropertyShell({ children }: { children: ReactNode }) {
  return (
    <div>
      <nav
        aria-label="Property platform"
        className="mx-auto flex max-w-[100rem] gap-2 overflow-x-auto px-4 pt-6 sm:px-5"
      >
        {navigation.map(([label, href]) => (
          <Link
            className="shrink-0 rounded-full border border-vds-border bg-vds-surface px-4 py-2 text-sm text-vds-muted transition hover:text-vds-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-vds-focus"
            href={href}
            key={href}
          >
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
