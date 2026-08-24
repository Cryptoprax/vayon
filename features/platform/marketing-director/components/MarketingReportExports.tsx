import { FounderReportExports } from "@/features/platform/founder/components/FounderReportExports";
import type { MarketingDirectorSnapshot } from "../types";

// FounderReportExports preserves the window.print PDF flow and application/vnd.ms-powerpoint export contract.
export function MarketingReportExports({ data }: { data: MarketingDirectorSnapshot }) {
  return <FounderReportExports title="AI Marketing Director" generatedAt={data.generatedAt} kpis={data.kpis} reports={data.reports}/>;
}
