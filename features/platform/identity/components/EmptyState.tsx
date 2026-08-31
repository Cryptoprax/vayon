import { Button } from "@/features/platform/design-system";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="flex size-11 items-center justify-center rounded-2xl border border-vds-border/[0.08] bg-vds-surface/[0.03] text-vds-subtle">
        <Inbox className="size-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-vds-secondary">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs leading-5 text-vds-subtle">
        {description}
      </p>
      {actionLabel ? (
        <Button variant="control"
          type="button"
          onClick={onAction}
          disabled={!onAction}
          title={onAction?undefined:"This action is not configured"}
          className="mt-5 rounded-xl border border-vds-border/[0.08] px-4 py-2 text-xs font-medium text-vds-muted transition hover:bg-vds-surface/[0.05] hover:text-vds-foreground"
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
