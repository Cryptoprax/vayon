"use client";
import { Button } from "@/features/platform/design-system";

import { AppWindow, ChevronRight, Layers3 } from "lucide-react";
import { useState } from "react";

import type {
  ApplicationCategory,
  PlatformApplication,
} from "../types/application";

export interface ApplicationSidebarProps {
  applications: PlatformApplication[];
}

export function ApplicationSidebar({
  applications,
}: ApplicationSidebarProps) {
  const [selectedId, setSelectedId] = useState(applications[0]?.id ?? "");
  const categories = Array.from(
    new Set(applications.map((application) => application.category)),
  ) as ApplicationCategory[];

  return (
    <aside className="border-b border-vds-border/[0.07] lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-3 px-5 py-5 lg:px-6">
        <span className="flex size-9 items-center justify-center rounded-xl border border-vds-border/[0.08] bg-vds-surface/[0.04] text-vds-muted">
          <Layers3 className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-vds-secondary">Applications</p>
          <p className="text-[10px] text-vds-subtle">AtlasOS catalog</p>
        </div>
      </div>

      <nav
        className="flex gap-1 overflow-x-auto px-3 pb-4 [scrollbar-width:none] lg:block lg:max-h-[calc(100dvh-15rem)] lg:space-y-5 lg:overflow-y-auto lg:px-3"
        aria-label="Application catalog"
      >
        {categories.map((category) => {
          const categoryApplications = applications.filter(
            (application) => application.category === category,
          );

          return (
            <div key={category} className="shrink-0 lg:shrink">
              <p className="mb-1 hidden px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-vds-subtle lg:block">
                {category}
              </p>
              <div className="flex gap-1 lg:block lg:space-y-0.5">
                {categoryApplications.map((application) => {
                  const isSelected = application.id === selectedId;

                  return (
                    <Button variant="control"
                      key={application.id}
                      type="button"
                      onClick={() => setSelectedId(application.id)}
                      className={`group flex h-10 min-w-40 items-center gap-2.5 rounded-xl px-3 text-left text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vds-focus lg:w-full lg:min-w-0 ${
                        isSelected
                          ? "bg-vds-surface/[0.065] text-vds-foreground"
                          : "text-vds-muted hover:bg-vds-surface/[0.035] hover:text-vds-secondary"
                      }`}
                      aria-pressed={isSelected}
                    >
                      <span
                        className={`flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${application.theme.gradient} text-[8px] font-bold text-vds-foreground opacity-80`}
                      >
                        {application.logo}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {application.name}
                      </span>
                      {isSelected ? (
                        <ChevronRight
                          className="hidden size-3 text-vds-subtle lg:block"
                          aria-hidden="true"
                        />
                      ) : application.installed ? null : (
                        <AppWindow
                          className="hidden size-3 text-vds-subtle lg:block"
                          aria-hidden="true"
                        />
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
