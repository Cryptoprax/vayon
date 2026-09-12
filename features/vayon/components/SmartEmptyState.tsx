"use client";

import { WorkspaceEmptyState } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import {
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
  aiSuggestion,
}: SmartEmptyStateProps) {
  return <WorkspaceEmptyState title={title} description={description} nextStep={aiSuggestion} action={primaryHref ? { label: primaryLabel, href: primaryHref } : onPrimary ? { label: primaryLabel, onClick: onPrimary } : undefined} className={className}>{secondaryActions.length > 0 && <div className="mt-3 flex flex-wrap gap-3">{secondaryActions.map(action => <ButtonLink key={action.label} href={action.href} variant="secondary">{action.label}</ButtonLink>)}</div>}</WorkspaceEmptyState>;
}
