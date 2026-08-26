"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Button, ButtonLink } from "@/features/platform/design-system";

export function ContextualSetupState({
  title,
  description,
  estimatedTime,
  href,
  recommendations = [],
}: {
  title: string;
  description: string;
  estimatedTime: string;
  href: string;
  recommendations?: readonly string[];
}) {
  const [later, setLater] = useState(false);
  if (later) return null;
  return (
    <section className="rounded-3xl border border-vds-accent-border bg-gradient-to-br from-vds-primary-soft to-vds-surface p-8 text-center">
      <Sparkles className="mx-auto size-8 text-vds-primary" aria-hidden="true" />
      <h2 className="mt-5 text-2xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-vds-muted">
        {description}
      </p>
      <p className="mt-5 text-xs uppercase tracking-[.16em] text-vds-subtle">
        Estimated setup time: {estimatedTime}
      </p>
      {recommendations.length > 0 && (
        <div className="mx-auto mt-6 grid max-w-2xl gap-2 sm:grid-cols-3">
          {recommendations.map((recommendation) => (
            <ButtonLink
              href={href}
              variant="secondary"
              className="h-auto rounded-2xl border border-vds-border bg-vds-elevated p-4 text-left text-sm hover:border-vds-border-strong"
              key={recommendation}
            >
              {recommendation}
            </ButtonLink>
          ))}
        </div>
      )}
      <div className="mt-6 flex justify-center gap-3">
        <ButtonLink href={href}>
          Configure AI Workforce
        </ButtonLink>
        <Button onClick={() => setLater(true)} variant="ghost">
          Later
        </Button>
      </div>
    </section>
  );
}
