"use client";

import { Check } from "lucide-react";

const steps=["Organization","Workspace","Team","Review"];

export function ProgressStepper({current}:{current:number}){
  return <nav aria-label="Onboarding progress">
    <div className="relative"><div className="absolute left-0 right-0 top-4 h-px bg-vds-hover"/><div className="absolute left-0 top-4 h-px bg-gradient-to-r from-vds-primary to-vds-accent transition-[width] duration-500 ease-out" style={{width:`${((current-1)/(steps.length-1))*100}%`}}/>
      <ol className="relative flex justify-between">{steps.map((label,index)=>{const position=index+1,complete=position<current,active=position===current;return <li key={label} className="flex max-w-20 flex-col items-center gap-2 text-center"><span aria-current={active?"step":undefined} className={`grid size-8 place-items-center rounded-full border text-xs font-semibold transition-all duration-300 ${complete?"border-vds-primary bg-vds-primary text-vds-on-accent":active?"border-vds-primary bg-[var(--vds-color-surface)] text-vds-primary shadow-[0_0_20px_var(--vds-color-accent-border)]":"border-vds-border bg-[var(--vds-color-surface)] text-vds-subtle"}`}>{complete?<Check className="size-4"/>:<span className="size-2 rounded-full bg-current"/>}</span><span className={`hidden text-[11px] font-medium sm:block ${active||complete?"text-vds-secondary":"text-vds-subtle"}`}>{label}</span></li>})}</ol>
    </div>
  </nav>;
}
