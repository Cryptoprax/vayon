"use client";

import { Sparkles } from "lucide-react";
import {
  Button,
  ButtonLink,
} from "@/features/platform/design-system";

interface SmartEmptyStateProps {
  readonly title: string;
  readonly description: string;
  readonly primaryLabel: string;
  readonly primaryHref?: string;
  readonly onPrimary?: () => void;
  readonly secondaryActions?: readonly {
    readonly label: string;
    readonly href: string;
  }[];
  readonly className?: string;
  readonly aiSuggestion?: string;
}

export function SmartEmptyState({
  title,
  description,
  primaryLabel,
  primaryHref,
  onPrimary,
  secondaryActions = [],
  className = "",
  aiSuggestion = "Ask the Real Estate Assistant to recommend the best next step.",
}: SmartEmptyStateProps) {
  return (
    <section
      className={`vds-card-motion rounded-3xl border border-dashed border-vds-accent-border bg-gradient-to-br from-vds-primary-soft via-vds-surface to-vds-accent-soft p-8 text-center motion-reduce:transition-none ${className}`}
    >
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-vds-elevated text-vds-primary shadow-sm">
        <Sparkles className="size-5" aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-xl font-semibold tracking-[-.02em]">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-vds-muted">
        {description}
      </p>
      <p className="mx-auto mt-3 max-w-lg text-xs font-medium text-vds-primary">
        AI suggestion: {aiSuggestion}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {primaryHref ? (
          <ButtonLink href={primaryHref}>{primaryLabel}</ButtonLink>
        ) : (
          <Button onClick={onPrimary}>{primaryLabel}</Button>
        )}
        {secondaryActions.map((action) => (
          <ButtonLink key={action.label} href={action.href} variant="secondary">
            {action.label}
          </ButtonLink>
        ))}
      </div>
    </section>
  );
}
