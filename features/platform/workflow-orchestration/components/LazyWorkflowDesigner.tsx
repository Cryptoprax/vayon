"use client";
import dynamic from "next/dynamic";
import type { WorkflowDefinition } from "@/features/platform/workflows/domain/contracts";
const WorkflowDesigner=dynamic(()=>import("@/features/platform/workflows/components/WorkflowDesigner").then(module=>module.WorkflowDesigner),{loading:()=> <div className="h-[42rem] animate-pulse rounded-3xl bg-vds-elevated" aria-label="Loading workflow designer"/>});
export function LazyWorkflowDesigner({definition}:{definition?:WorkflowDefinition}){return <WorkflowDesigner definition={definition}/>}
