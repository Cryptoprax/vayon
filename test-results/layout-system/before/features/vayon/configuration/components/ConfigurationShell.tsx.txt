"use client";
import { Button } from "@/features/platform/design-system";
import type { ReactNode } from "react";
const tabs=["pipelines","fields","forms","workflows","permissions","preferences"] as const;
export type ConfigurationTab=typeof tabs[number];
export function ConfigurationShell({active,onChange,children}:{active:ConfigurationTab;onChange:(tab:ConfigurationTab)=>void;children:ReactNode}){return <div><nav aria-label="Configuration sections" className="flex gap-2 overflow-x-auto rounded-2xl border border-vds-border/[.07] bg-vds-surface/[.025] p-2">{tabs.map(tab=><Button variant="control" key={tab} type="button" onClick={()=>onChange(tab)} aria-current={active===tab?"page":undefined} className={`focus-ring whitespace-nowrap rounded-xl px-4 py-2.5 text-sm capitalize ${active===tab?"bg-vds-primary-soft text-vds-primary":"text-vds-muted hover:bg-vds-surface/[.05]"}`}>{tab}</Button>)}</nav><div className="mt-6">{children}</div></div>}
