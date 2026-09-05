"use client";

import { RouteError } from "@/features/vayon/components/RouteStates";

export default function Error({ reset }: { reset: () => void }) {
  return <RouteError reset={reset} title="The Approval Center could not load" />;
}
