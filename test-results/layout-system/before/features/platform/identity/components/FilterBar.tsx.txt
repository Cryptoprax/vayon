import { SlidersHorizontal } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string;
}

export interface ToolbarFilter {
  id: string;
  label: string;
  options: FilterOption[];
}

export interface FilterBarProps {
  filters: ToolbarFilter[];
}

export function FilterBar({ filters }: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none]">
      <SlidersHorizontal
        className="size-3.5 shrink-0 text-vds-subtle"
        aria-hidden="true"
      />
      {filters.map((filter) => (
        <label key={filter.id} className="shrink-0">
          <span className="sr-only">{filter.label}</span>
          <select
            defaultValue=""
            className="h-9 appearance-none rounded-xl border border-vds-border/[0.07] bg-[var(--vds-color-surface)] px-3 text-xs text-vds-muted outline-none transition hover:border-vds-border/[0.13] focus:border-vds-accent-border focus:ring-2 focus:ring-vds-focus"
            aria-label={filter.label}
          >
            <option value="">{filter.label}</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
