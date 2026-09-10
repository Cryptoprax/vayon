"use client";
import { Button } from "@/features/platform/design-system";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FloatingSurface } from "../floating-layout/FloatingLayoutManager";
import type { PlatformVisibilityContext } from "@/features/platform/visibility/domain";
import { shellNavigation } from "./navigation";
import { filterNavigationForRole } from "@/features/platform/permissions/runtime/navigation";
import type { WorkspaceRoleCode } from "@/features/platform/organization/config/workspace-role-catalog";
import { quickCreateActions } from "../universal-bar/config/quick-create";
import { filterVisibleItems } from "@/features/platform/visibility/policy";
const actions = quickCreateActions.filter(item => item.kind === "quick-create").map(item => ({ ...item, icon: Plus }));
export function QuickCreate({visibility,role="guest"}:{readonly visibility:PlatformVisibilityContext;readonly role?:WorkspaceRoleCode}){const path=usePathname();const[open,setOpen]=useState(false),button=useRef<HTMLButtonElement>(null),allowedLinks=filterNavigationForRole(shellNavigation,role,visibility).flatMap(group=>group.items),visibleActions=filterVisibleItems(visibility,actions).filter(action => action.scope !== "analytics" || path.includes("/analytics")).filter(action => !action.href.includes("/creative") || path.includes("/creative") || path.includes("/properties/")).filter(action=>allowedLinks.some(item=>item.href&&(action.href===item.href||action.href.startsWith(item.href+"/")))).filter((action,index,items)=>items.findIndex(item=>item.href===action.href)===index);useEffect(()=>{if(!open)return;const close=(event:KeyboardEvent)=>{if(event.key==="Escape"){setOpen(false);button.current?.focus()}};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close)},[open]);return <FloatingSurface id="quick-create" kind="action" priority={50}><div className="flex flex-col items-end gap-3">{open&&<div role="menu" aria-label="Create something" className="vds-dropdown-enter max-h-[min(32rem,70dvh)] w-56 overflow-y-auto rounded-2xl border border-vds-border bg-vds-elevated p-2 shadow-xl shadow-vds-shadow">{visibleActions.map(({label,href,icon:Icon})=><Link role="menuitem" key={label} href={href} onClick={()=>setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-vds-muted hover:bg-vds-hover hover:text-vds-foreground"><Icon className="size-4 text-vds-primary"/>{label}</Link>)}</div>}<Button variant="secondary" ref={button} type="button" onClick={()=>setOpen(v=>!v)} aria-label={open?"Close Create menu":"Open Create menu"} aria-haspopup="menu" aria-expanded={open} className="rounded-2xl px-4 py-3 text-vds-foreground shadow-xl shadow-vds-shadow hover:-translate-y-0.5">{open?<X className="size-5"/>:<><SparkleIcon/>Create</>}</Button></div></FloatingSurface>}
function SparkleIcon(){return <span aria-hidden="true">✨</span>}
