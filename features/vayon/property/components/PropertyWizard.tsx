"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Cloud, ShieldCheck } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/features/platform/design-system";
import { Input } from "@/components/ui/Input";
import { AddressAutocomplete, CitySelect, CountrySelect, CurrencySelect, StateSelect } from "@/features/location/components";
import { locationData } from "@/features/location/services/location-data.service";
import { MediaManager } from "@/features/vayon/property-intelligence/components/MediaManager";
import { listingTypes, propertyStatuses, propertyTypes } from "../config/catalogs";
import type { PropertyRecord } from "../types";

const sections = ["Basic", "Location", "Pricing", "Pricing Details", "Media", "Amenities", "Ownership", "Documents", "Review", "Publish"];

function Submit({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving…" : editing ? "Save changes" : "Create property"}</Button>;
}

export function PropertyWizard({ action, property, error }: { action: (form: FormData) => void | Promise<void>; property?: PropertyRecord; error?: string }) {
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState(property?.address.countryCode ?? "US");
  const [region, setRegion] = useState(property?.address.region ?? "");
  const [city, setCity] = useState(property?.address.city ?? "");
  const [currency, setCurrency] = useState(property?.salePrice?.currency ?? property?.rentalPrice?.currency ?? locationData.country(property?.address.countryCode ?? "US")?.currency ?? "USD");
  const [savedAt, setSavedAt] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const draftKey = `vayon:property-draft:${property?.id ?? "new"}`;

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function saveLocalDraft() {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!formRef.current) return;
      const values = Object.fromEntries([...new FormData(formRef.current).entries()].filter(([, value]) => typeof value === "string"));
      localStorage.setItem(draftKey, JSON.stringify({ values, savedAt: new Date().toISOString() }));
      setSavedAt(new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date()));
    }, 600);
  }

  return <form ref={formRef} action={action} onInput={saveLocalDraft} className="rounded-3xl border border-vds-border/[0.08] bg-[var(--vds-color-surface)] p-5 shadow-2xl shadow-vds-shadow sm:p-8">
    {property && <input type="hidden" name="version" value={property.version} />}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs uppercase tracking-widest text-vds-primary">Section {step} of {sections.length}</p><h2 className="mt-1 text-xl font-semibold">{sections[step - 1]}</h2></div>
      <p aria-live="polite" className="flex items-center gap-2 text-xs text-vds-muted"><Cloud className="size-4 text-vds-success" />{savedAt ? `Draft saved locally at ${savedAt}` : "Changes auto-save locally"}</p>
    </div>
    <nav className="mt-5 overflow-x-auto overscroll-x-contain pb-2" aria-label="Property form sections">
      <ol className="flex min-w-max snap-x snap-mandatory gap-3">
        {sections.map((section, index) => {
          const number = index + 1;
          const active = number === step;
          return (
            <li key={section} className="shrink-0 snap-start">
              <Button
                variant="control"
                type="button"
                aria-label={`Step ${number} of ${sections.length}, ${section}`}
                aria-current={active ? "step" : undefined}
                onClick={() => setStep(number)}
                className={`focus-ring flex min-h-12 min-w-[140px] items-center justify-start gap-2.5 whitespace-nowrap rounded-xl border px-5 py-3 text-sm transition-colors ${active ? "border-vds-success bg-vds-success font-bold text-vds-on-accent" : "border-vds-border bg-vds-elevated text-vds-muted hover:bg-vds-hover hover:text-vds-foreground"}`}
              >
                <span aria-hidden="true" className="font-semibold">{number}</span>
                <span>{section}</span>
              </Button>
            </li>
          );
        })}
      </ol>
    </nav>
    {error && <p role="alert" className="mt-4 rounded-xl bg-vds-danger-soft p-3 text-sm text-vds-danger">{error}</p>}

    <Section show={step === 1}><Input id="title" name="title" label="Property name" defaultValue={property?.title} required /><Input id="reference" name="reference" label="Property code" defaultValue={property?.reference} required /><Select name="propertyType" label="Property type" items={propertyTypes} value={property?.propertyType} /><Select name="listingType" label="Listing type" items={listingTypes} value={property?.listingType} /><Select name="status" label="Status" items={propertyStatuses} value={property?.status ?? "available"} /><TextArea name="description" label="Description" value={property?.description} wide /></Section>
    <Section show={step === 2}><CountrySelect name="countryCode" value={country} onChange={(value) => { setCountry(value); setRegion(""); setCity(""); setCurrency(locationData.country(value)?.currency ?? currency); }} required /><StateSelect countryCode={country} value={region} onChange={(value) => { setRegion(value); setCity(""); }} /><CitySelect countryCode={country} state={region} value={city} onChange={setCity} required /><Input id="locality" name="locality" label="Area / Locality" defaultValue={property?.address.locality} /><div className="sm:col-span-2"><AddressAutocomplete id="address" name="address" label="Address" defaultValue={property?.address.lines[0]} required /></div><Placeholder text="Map pin and geocoding extension point" /></Section>
    <Section show={step === 3}><Input id="salePrice" name="salePrice" type="number" label="Sale price" defaultValue={property?.salePrice?.amount} /><Input id="rentalPrice" name="rentalPrice" type="number" label="Rental price" defaultValue={property?.rentalPrice?.amount} /><CurrencySelect countryCode={country} value={currency} onChange={setCurrency} required /><Input id="commission" name="commission" type="number" label="Commission %" defaultValue={property?.commission} /></Section>
    <Section show={step === 4}>{[["bedrooms", "Bedrooms"], ["bathrooms", "Bathrooms"], ["area", "Area"], ["parking", "Parking"], ["floor", "Floor"]].map(([id, label]) => <Input key={id} id={id} name={id} type="number" label={label} defaultValue={id === "floor" ? property?.floor : property?.specification[id as keyof typeof property.specification] as number | undefined} />)}<Input id="areaUnit" name="areaUnit" label="Area unit" defaultValue={property?.specification.areaUnit ?? "sqft"} required /><Input id="amenities" name="amenities" label="Amenities" hint="Comma-separated" defaultValue={property?.specification.amenities.join(", ")} /></Section>
    <section hidden={step !== 5} className="mt-7"><MediaManager /></section>
    <Section show={step === 6}><Input id="ownerName" name="ownerName" label="Owner name" hint="Saved in this browser draft until ownership fields are enabled" /><Input id="ownerContact" name="ownerContact" label="Owner contact" hint="Workspace draft only" /><Placeholder text="Ownership verification extension point" /></Section>
    <Section show={step === 7}><Input id="availabilityDate" name="availabilityDate" type="date" label="Available from" hint="Workspace draft only" /><Input id="viewingInstructions" name="viewingInstructions" label="Viewing instructions" hint="Workspace draft only" /><Placeholder text="Calendar and availability sync extension point" /></Section>
    <Section show={step === 8}><Input id="legalReference" name="legalReference" label="Legal reference" hint="Workspace draft only" /><Input id="permitNumber" name="permitNumber" label="Permit number" hint="Workspace draft only" /><Placeholder text="Document verification pipeline extension point" /></Section>
    <Section show={step === 9}><Input id="seoTitle" name="seoTitle" label="SEO title" hint="Workspace draft only" /><Input id="seoKeywords" name="seoKeywords" label="SEO keywords" hint="Workspace draft only" /><Placeholder text="AI SEO and description generation extension point" /></Section>
    <section hidden={step !== 10} className="mt-7"><TextArea name="internalNotes" label="Internal notes" wide /><div className="mt-4 flex items-start gap-3 rounded-2xl border border-vds-success bg-vds-success/[0.04] p-4 text-sm text-vds-muted"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-vds-success" />Core fields are saved through the existing governed property workflow. Future metadata remains in the local auto-save draft until its schema fields are available.</div></section>

    <div className="mt-8 flex justify-between border-t border-vds-border/[0.07] pt-5"><Button type="button" variant="ghost" disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))}>Back</Button>{step < sections.length ? <Button type="button" onClick={() => setStep((current) => Math.min(sections.length, current + 1))}>Continue</Button> : <Submit editing={Boolean(property)} />}</div>
  </form>;
}

function Section({ show, children }: { show: boolean; children: React.ReactNode }) { return <section hidden={!show} className="mt-7 grid gap-4 sm:grid-cols-2">{children}</section>; }
function Select({ name, label, items, value }: { name: string; label: string; items: readonly { code: string; label: { default: string } }[]; value?: string }) { return <label className="text-sm">{label}<select name={name} defaultValue={value} className="focus-ring mt-2 h-11 w-full rounded-xl border border-vds-border bg-[var(--vds-color-surface)] px-3">{items.map((item) => <option key={item.code} value={item.code}>{item.label.default}</option>)}</select></label>; }
function TextArea({ name, label, value, wide }: { name: string; label: string; value?: string; wide?: boolean }) { return <label className={`text-sm ${wide ? "sm:col-span-2" : ""}`}>{label}<textarea name={name} defaultValue={value} className="focus-ring mt-2 min-h-28 w-full rounded-xl border border-vds-border bg-vds-surface/[0.04] p-3" /></label>; }
function Placeholder({ text }: { text: string }) { return <div className="grid min-h-24 place-items-center rounded-2xl border border-dashed border-vds-border px-4 text-center text-xs text-vds-subtle sm:col-span-2"><Check className="mb-2 size-4 text-vds-primary" />{text}</div>; }
