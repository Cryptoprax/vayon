import Link from "next/link";
import { Bot, BriefcaseBusiness, FileImage, FileText, Megaphone, Rocket, UserPlus, Video } from "lucide-react";
const actions=[
  {label:"Create Contact",meta:"Build the customer pipeline",href:"/vayon/leads/new",icon:UserPlus,color:"text-vds-primary bg-vds-primary/[0.08]"},
  {label:"Create Deal",meta:"Open a revenue opportunity",href:"/vayon/deals/new",icon:BriefcaseBusiness,color:"text-vds-success bg-vds-success/[0.08]"},
  {label:"Create Campaign",meta:"Plan with Creative Director",href:"/vayon/creative/campaigns",icon:Megaphone,color:"text-vds-warning bg-vds-warning/[0.08]"},
  {label:"Generate Proposal",meta:"Create a governed document",href:"/vayon/creative/documents",icon:FileText,color:"text-vds-info bg-vds-info-soft"},
  {label:"Generate Image",meta:"Open AI Image Studio",href:"/vayon/creative/images",icon:FileImage,color:"text-vds-accent bg-vds-accent/[0.08]"},
  {label:"Generate Video",meta:"Open AI Video Studio",href:"/vayon/creative/videos",icon:Video,color:"text-vds-danger bg-vds-danger/[0.08]"},
  {label:"Create AI Employee",meta:"Configure a governed role",href:"/onboarding/ai-workforce",icon:Bot,color:"text-vds-accent bg-vds-accent-soft"},
  {label:"Launch Business",meta:"Open guided business launch",href:"/onboarding/business-launch",icon:Rocket,color:"text-vds-primary bg-vds-primary-soft"},
]as const;
export function QuickActions(){return <section aria-labelledby="quick-actions-heading"><div className="flex items-end justify-between"><div><p className="text-xs font-medium uppercase tracking-[.18em] text-vds-primary">Move faster</p><h2 id="quick-actions-heading" className="mt-2 text-xl font-semibold">Quick Action Center</h2></div><span className="text-xs text-vds-subtle">One click to begin</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{actions.map(({label,meta,href,icon:Icon,color})=><Link key={label} href={href} className="group focus-ring min-h-32 rounded-2xl border border-vds-border/[0.07] bg-vds-surface/[0.025] p-4 transition motion-reduce:transition-none hover:-translate-y-1 hover:border-vds-accent-border hover:bg-vds-surface/[0.045] motion-reduce:transform-none"><span className={`grid size-10 place-items-center rounded-2xl ${color} transition group-hover:scale-105 motion-reduce:transform-none`}><Icon className="size-5" aria-hidden="true"/></span><span className="mt-5 block text-sm font-medium text-vds-secondary group-hover:text-vds-foreground">{label}</span><span className="mt-1 block text-[11px] text-vds-subtle">{meta}</span></Link>)}</div></section>}
