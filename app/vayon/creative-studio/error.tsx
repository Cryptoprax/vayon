"use client";
import { Button, ButtonLink } from "@/features/platform/design-system";
export default function ErrorState({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main role="alert" className="mx-auto max-w-2xl px-4 py-16 text-center">
      <p className="text-xs font-semibold uppercase text-vds-warning">
        Marketing Studio unavailable
      </p>
      <h1 className="mt-3 text-2xl font-semibold">Your drafts remain safe</h1>
      <p className="mt-3 text-sm text-vds-muted">
        Campaign data could not be loaded. No publishing or provider action was
        attempted.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={reset}>Retry</Button>
        <ButtonLink href="/vayon/creative/assets" variant="outline">
          Open asset library
        </ButtonLink>
      </div>
    </main>
  );
}
