"use client";
import { RouteError } from "@/features/vayon/components/RouteStates";
export default function Error({ reset }: { reset: () => void }) {
  return <RouteError reset={reset} title="VAYON could not load this page" />;
}
