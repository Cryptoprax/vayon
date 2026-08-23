"use client";

import dynamic from "next/dynamic";

import type { FounderChart } from "../types";

const FounderCharts = dynamic(() => import("./FounderCharts"), { ssr: false, loading: () => <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3" aria-label="Loading executive charts">{Array.from({ length: 6 }, (_, index) => <div className="h-64 animate-pulse rounded-3xl bg-vds-surface" key={index}/>)}</div> });

export function LazyFounderCharts({ charts }: { charts: readonly FounderChart[] }) { return <FounderCharts charts={charts}/>; }
