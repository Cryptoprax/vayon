import { Button } from "@/features/platform/design-system";
import { Download, Layers3, Plus } from "lucide-react";

import { FilterBar, type ToolbarFilter } from "./FilterBar";
import { SearchInput } from "./SearchInput";

export interface TableToolbarProps {
  searchLabel: string;
  searchPlaceholder: string;
  filters: ToolbarFilter[];
  primaryAction: string;
  exportLabel?: string;
  bulkActionLabel?: string;
  onPrimaryAction?: () => void;
  onExport?: () => void;
  onBulkAction?: () => void;
}

export function TableToolbar({
  searchLabel,
  searchPlaceholder,
  filters,
  primaryAction,
  exportLabel = "Export",
  bulkActionLabel = "Bulk actions",
  onPrimaryAction,onExport,onBulkAction,
}: TableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-vds-border/[0.07] p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          label={searchLabel}
          placeholder={searchPlaceholder}
          className="w-full sm:w-72"
        />
        <FilterBar filters={filters} />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="control"
          type="button"
          onClick={onBulkAction} disabled={!onBulkAction} title={onBulkAction?undefined:"No bulk action is available"}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-vds-border/[0.07] px-3 text-xs font-medium text-vds-muted transition hover:bg-vds-surface/[0.05] hover:text-vds-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vds-focus"
        >
          <Layers3 className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{bulkActionLabel}</span>
        </Button>
        <Button variant="control"
          type="button"
          onClick={onExport} disabled={!onExport} title={onExport?undefined:"Export is not available"}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-vds-border/[0.07] px-3 text-xs font-medium text-vds-muted transition hover:bg-vds-surface/[0.05] hover:text-vds-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vds-focus"
        >
          <Download className="size-3.5" aria-hidden="true" />
          {exportLabel}
        </Button>
        <Button variant="primary"
          type="button"
          onClick={onPrimaryAction} disabled={!onPrimaryAction} title={onPrimaryAction?undefined:"This action is not configured"}
          className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          {primaryAction}
        </Button>
      </div>
    </div>
  );
}
