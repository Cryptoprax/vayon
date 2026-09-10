import { Eye } from "lucide-react";
import type { UniversalPreviewModel } from "../domain/contracts";
export function UniversalPreviewCard({
  preview,
}: {
  readonly preview?: UniversalPreviewModel;
}) {
  return (
    <aside
      aria-label="Universal preview"
      className="hidden border-l border-vds-border/[.07] p-5 lg:block"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-[.16em] text-vds-accent">
        <Eye className="size-4" aria-hidden="true" />
        Preview
      </div>
      {!preview || preview.state === "awaiting-data" ? (
        <div className="mt-5 rounded-2xl border border-dashed border-vds-border p-6 text-center">
          <p className="text-sm text-vds-muted">
            Choose a record to see its details.
          </p>
          <p className="mt-2 text-xs leading-5 text-vds-subtle">
            Use the arrow keys to select a result. Press Enter to open it; some details are only available on the record page.
          </p>
        </div>
      ) : (
        <div className="mt-5">
          <p className="text-lg font-semibold">{preview.title}</p>
          <p className="mt-1 text-xs text-vds-subtle">{preview.subtitle}</p>
          <dl className="mt-5 space-y-3">
            {preview.fields.map((field) => (
              <div key={field.label}>
                <dt className="text-[10px] uppercase tracking-wider text-vds-subtle">
                  {field.label}
                </dt>
                <dd className="mt-1 text-sm text-vds-muted">{field.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </aside>
  );
}
