import type { ReactNode } from "react";
import { GrowthShell } from "@/features/vayon/growth-intelligence/GrowthShell";

export default function GrowthLayout({ children }: { children: ReactNode }) {
  return <GrowthShell>{children}</GrowthShell>;
}
