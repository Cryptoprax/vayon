"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/features/platform/design-system";
import { Input } from "@/components/ui/Input";
import { CurrencySelect, LanguageSelect, PhoneCodeSelect } from "@/features/location/components";
import { leadPriorities, leadSources, leadStatuses } from "../config/catalogs";
import type { LeadRecord } from "../types";

function Submit({ edit }: { edit: boolean }) { const { pending } = useFormStatus(); return <Button type="submit" disabled={pending}>{pending ? "Saving…" : edit ? "Save changes" : "Create lead"}</Button>; }
export function LeadWizard({ action, lead, error }: { action: (form: FormData) => void | Promise<void>; lead?: LeadRecord; error?: string }) {
  const [step, setStep] = useState(1);
  const [purpose,setPurpose]=useState(lead?.buyingPurpose??""),[propertyType,setPropertyType]=useState(lead?.propertyType??""),[draft,setDraft]=useState<Record<string,string>>({name:lead?.name??"",phone:lead?.phone??"",email:lead?.email??"",budget:String(lead?.budgetAmount?.amount??""),preferredLocations:lead?.preferredLocations.join(", ")??"",timeline:lead?.timeline??"",priority:lead?.priority??"medium",source:lead?.source??"manual",expectedClosing:lead?.expectedClosing??""});
  const score=Math.min(100,(Number(draft.budget)>0?20:0)+(({Immediate:30,"1 Month":25,"3 Months":20,"6 Months":15,"12 Months":10,Flexible:5} as Record<string,number>)[draft.timeline]??0)+(propertyType?20:0)+(purpose?15:0)+(["referral","website","google_ads"].includes(draft.source)?15:8));
  const interest=propertyType||purpose||"General property enquiry";
  return <form action={action} onChange={(event)=>{const target=event.target;if(!(target instanceof HTMLInputElement||target instanceof HTMLSelectElement)||!target.name)return;setDraft((current)=>({...current,[target.name]:target.value}))}} className="rounded-3xl border border-vds-border/[0.08] bg-[var(--vds-color-surface)] p-6 sm:p-8">
    {lead && <input type="hidden" name="version" value={lead.version} />}
    <p className="text-xs uppercase tracking-widest text-vds-primary">Step {step} of 6</p>
    {error && <p role="alert" className="mt-4 rounded-xl bg-vds-danger-soft p-3 text-sm text-vds-danger">{error}</p>}
    <div className={step === 1 ? "mt-7 grid gap-4 sm:grid-cols-2" : "hidden"}>
      <Input id="name" name="name" label="Name" defaultValue={lead?.name} required />
      <PhoneCodeSelect defaultValue="+1" required />
      <Input id="phone" name="phone" label="Phone number" defaultValue={lead?.phone} required />
      <Input id="email" name="email" type="email" label="Email" defaultValue={lead?.email} />
      <Input id="whatsapp" name="whatsapp" label="WhatsApp number" defaultValue={lead?.whatsapp} />
      <LanguageSelect name="preferredLanguage" label="Preferred language" defaultValue={lead?.preferredLanguage ?? "en"} />
    </div>
    <div className={step === 2 ? "mt-7" : "hidden"}><Select name="source" label="Lead source" items={leadSources} value={lead?.source ?? "manual"} /></div>
    <div className={step === 3 ? "mt-7 grid gap-4 sm:grid-cols-2" : "hidden"}>
      <Input id="budget" name="budget" type="number" label="Budget" defaultValue={lead?.budgetAmount?.amount} />
      <CurrencySelect defaultValue={lead?.budgetAmount?.currency ?? "USD"} required />
      <SmartSelect name="buyingPurpose" label="Buying Purpose" value={purpose} onChange={setPurpose} items={["To Live","Investment","Rental","Commercial","Vacation Home","Other"]}/>{purpose==="Other"&&<Input id="buyingPurposeOther" name="buyingPurposeOther" label="Other Buying Purpose"/>}
      <SmartSelect name="propertyType" label="Property Type" value={propertyType} onChange={setPropertyType} items={["Apartment","Villa","House","Commercial","Warehouse","Office","Farm","Land","Studio","Penthouse","Other"]}/>{propertyType==="Other"&&<Input id="propertyTypeOther" name="propertyTypeOther" label="Other Property Type"/>}
      <Input id="preferredLocations" name="preferredLocations" label="Preferred locations" defaultValue={lead?.preferredLocations.join(", ")} hint="Comma-separated locations; structured coverage follows property geography." />
      <Input id="bedrooms" name="bedrooms" type="number" label="Bedrooms" defaultValue={lead?.bedrooms} />
      <SmartSelect name="timeline" label="Timeline" value={draft.timeline||"Flexible"} onChange={(value)=>setDraft((current)=>({...current,timeline:value}))} items={["Immediate","1 Month","3 Months","6 Months","12 Months","Flexible"]}/>
      <Input id="financing" name="financing" label="Financing" defaultValue={lead?.financing} />
    </div>
    <div className={step === 4 ? "mt-7" : "hidden"}><label className="text-sm" htmlFor="property-search">Search Property</label><input id="property-search" type="search" placeholder="Search by property name or location" className="mt-2 h-11 w-full rounded-xl border border-vds-border bg-vds-surface px-3"/><div className="mt-4 rounded-2xl border border-dashed border-vds-border p-10 text-center"><h2 className="font-semibold">Suggested Matches</h2><p className="mt-2 text-sm text-vds-muted">No properties available.</p><Link className="mt-4 inline-block text-sm font-medium text-vds-primary" href="/vayon/properties/new">Create Property</Link><input type="hidden" name="propertyInterestIds" value="" /></div></div>
    <div className={step === 5 ? "mt-7 grid gap-4 sm:grid-cols-2" : "hidden"}><label className="text-sm">Assigned Agent<select name="agentSelection" defaultValue="auto" className="mt-2 h-11 w-full rounded-xl border border-vds-border bg-vds-surface px-3"><option value="auto">Auto Assign AI</option>{["Emma","Alex","David","Olivia"].map((name)=><option disabled key={name}>{name} · available after employee assignment</option>)}</select><input type="hidden" name="assignedAgentId" value={lead?.assignedEmployeeId??""}/></label><Select name="priority" label="Priority" items={leadPriorities} value={lead?.priority ?? "medium"} /><Input id="tags" name="tags" label="Tags" defaultValue={lead?.tags.join(", ")} hint="Comma-separated" /><Select name="status" label="Status" items={leadStatuses} value={lead?.status ?? "new"} /><Input id="expectedClosing" name="expectedClosing" type="date" label="Expected Closing" defaultValue={lead?.expectedClosing} /></div>
    <div className={step === 6 ? "mt-7" : "hidden"}><h2 className="text-2xl font-semibold">Review Lead</h2><p className="mt-2 text-sm text-vds-muted">Review the information before creating this intelligent lead workspace.</p><dl className="mt-6 grid gap-4 sm:grid-cols-2">{[["Customer",draft.name||"Not provided"],["Phone",draft.phone||"Not provided"],["Email",draft.email||"Not provided"],["Budget",draft.budget||"Not provided"],["Buying Purpose",purpose||"Not provided"],["Property Type",propertyType||"Not provided"],["Timeline",draft.timeline||"Flexible"],["Locations",draft.preferredLocations||"Not provided"],["Suggested Properties","No properties selected"],["Assigned Agent","Auto Assign AI"],["Priority",draft.priority||"Medium"],["Lead Source",draft.source||"Manual"],["Expected Closing",draft.expectedClosing||"Not provided"],["Estimated Commission","Calculated after a deal is created"],["Lead Score",`${score}/100`],["Interest",interest]].map(([label,value])=><div className="rounded-xl bg-vds-elevated p-4" key={label}><dt className="text-xs text-vds-muted">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>)}</dl></div>
    <div className="mt-8 flex justify-between border-t border-vds-border/[0.07] pt-5"><Button type="button" variant="ghost" disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))}>Back</Button>{step < 6 ? <Button type="button" onClick={() => setStep((current) => Math.min(6, current + 1))}>Continue</Button> : <Submit edit={Boolean(lead)} />}</div>
  </form>;
}
function Select({ name, label, items, value }: { name: string; label: string; items: readonly { code: string; label: { default: string } }[]; value: string }) { return <label className="text-sm">{label}<select name={name} defaultValue={value} className="mt-2 h-11 w-full rounded-xl border border-vds-border bg-[var(--vds-color-surface)] px-3">{items.map((item) => <option key={item.code} value={item.code}>{item.label.default}</option>)}</select></label>; }
function SmartSelect({name,label,items,value,onChange}:{name:string;label:string;items:readonly string[];value:string;onChange?:(value:string)=>void}){return <label className="text-sm">{label}<select name={name} value={value} onChange={(event)=>onChange?.(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-vds-border bg-vds-surface px-3"><option value="">Select {label}</option>{items.map((item)=><option key={item} value={item}>{item}</option>)}</select></label>}
