"use client";

import { useEffect, useState, useTransition } from "react";
import { BarChart3, Bot, Building2, Check, ChevronLeft, ChevronRight, CircleCheck, Construction, GraduationCap, HeartPulse, LoaderCircle, Megaphone, MessageCircle, ShoppingBag, Sparkles, Users, Workflow } from "lucide-react";
import { Button } from "@/features/platform/design-system";
import { completeOnboardingAction } from "../actions/onboarding.actions";
import { launchOnboardingAction, saveOnboardingProgressAction } from "../actions/enterprise-onboarding.actions";

type Session = { current_step: number; completed_steps: number[]; configuration: Record<string, unknown>; demo_mode: boolean; completed_at: string | null } | null;
const businesses = [["Real Estate", Building2], ["Marketing Agency", Megaphone], ["Consulting", Users], ["Construction", Construction], ["Healthcare", HeartPulse], ["Education", GraduationCap], ["Retail", ShoppingBag], ["Other", Sparkles]] as const;
const goals = [["Generate Leads", Sparkles], ["Manage Customers", Users], ["AI Employees", Bot], ["Marketing", Megaphone], ["Automation", Workflow], ["Operations", Construction], ["Analytics", BarChart3]] as const;
const connections = ["Google", "Microsoft", "WhatsApp"] as const;
const setupItems = ["CRM", "AI", "Analytics", "Automation", "Knowledge"];

export function EnterpriseOnboardingWizard({ session, provisioned }: { session: Session; provisioned: boolean; initialStep?: number }) {
  const saved = session?.configuration ?? {};
  const [step, setStep] = useState(1);
  const [business, setBusiness] = useState(String(saved.businessType ?? "Real Estate"));
  const [goal, setGoal] = useState(String(saved.firstGoal ?? "Generate Leads"));
  const [selectedConnections, setSelectedConnections] = useState<string[]>(Array.isArray(saved.connections) ? saved.connections.map(String) : []);
  const [pending, startTransition] = useTransition();
  const [locale, setLocale] = useState({ country: String(saved.country ?? "US"), currency: String(saved.currency ?? "USD"), timezone: String(saved.timezone ?? "UTC"), language: String(saved.language ?? "en") });

  useEffect(() => {
    let active = true;
    const browserLocale = navigator.language || "en-US";
    const region = new Intl.Locale(browserLocale).region ?? "US";
    const currencies: Record<string, string> = { AU: "AUD", CA: "CAD", GB: "GBP", IN: "INR", JP: "JPY", SG: "SGD", US: "USD" };
    queueMicrotask(() => {
      if (!active) return;
      setLocale({ country: region, currency: currencies[region] ?? "USD", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", language: browserLocale.split("-")[0]?.toLowerCase() || "en" });
    });
    return () => { active = false; };
  }, []);

  const configuration = { ...saved, businessType: business, industry: business, firstGoal: goal, connections: selectedConnections, ...locale };
  function move(next: number) {
    const target = Math.max(1, Math.min(4, next));
    setStep(target);
    startTransition(() => saveOnboardingProgressAction({ step: target, configuration, completed: Array.from({ length: target - 1 }, (_, index) => index + 1), demoMode: false }));
  }
  function toggleConnection(connection: string) {
    setSelectedConnections((current) => current.includes(connection) ? current.filter((item) => item !== connection) : [...current, connection]);
  }

  return <section className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-vds-border bg-vds-surface shadow-vds-lg">
    <header className="border-b border-vds-border px-6 py-5 sm:px-10"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">Welcome to VAYON</p><p className="mt-1 text-sm text-vds-muted">Your business workspace, ready in under a minute.</p></div><p className="text-sm text-vds-muted">{step} of 4</p></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-vds-elevated" aria-label={`Setup ${step} of 4`}><div className="h-full rounded-full bg-vds-primary transition-[width] motion-reduce:transition-none" style={{ width: `${step * 25}%` }} /></div></header>
    <div className="min-h-[34rem] p-6 sm:p-10">
      {step === 1 && <ChoiceScreen title="What business are you?" copy="Choose the closest match. VAYON will tailor the workspace for you.">{businesses.map(([label, Icon]) => <ChoiceCard key={label} label={label} selected={business === label} onClick={() => setBusiness(label)} icon={<Icon className="size-5" />} />)}</ChoiceScreen>}
      {step === 2 && <ChoiceScreen title="What should VAYON do first?" copy="We’ll put this outcome at the center of your new workspace.">{goals.map(([label, Icon]) => <ChoiceCard key={label} label={label} selected={goal === label} onClick={() => setGoal(label)} icon={<Icon className="size-5" />} recommended={label === "Generate Leads"} />)}</ChoiceScreen>}
      {step === 3 && <div className="mx-auto max-w-3xl"><h1 className="text-3xl font-semibold tracking-tight">Connect your everyday tools</h1><p className="mt-3 text-sm text-vds-muted">Optional. You can connect them later from Settings.</p><div className="mt-8 grid gap-4 sm:grid-cols-3">{connections.map((connection) => <ChoiceCard key={connection} label={connection} selected={selectedConnections.includes(connection)} onClick={() => toggleConnection(connection)} icon={connection === "WhatsApp" ? <MessageCircle className="size-5" /> : <CircleCheck className="size-5" />} />)}</div><Button className="mt-6" variant="ghost" onClick={() => setSelectedConnections([])}>Skip for now</Button></div>}
      {step === 4 && <div className="mx-auto max-w-xl text-center"><span className="mx-auto grid size-16 place-items-center rounded-3xl bg-vds-primary-soft text-vds-primary"><Sparkles className="size-7" /></span><h1 className="mt-6 text-3xl font-semibold tracking-tight">Your workspace is ready to create</h1><p className="mt-3 text-sm text-vds-muted">VAYON will configure the essentials around {business.toLowerCase()} and your goal to {goal.toLowerCase()}.</p><div className="mx-auto mt-8 grid max-w-sm gap-3 text-left">{setupItems.map((item) => <div className="flex items-center gap-3 rounded-xl bg-vds-elevated px-4 py-3 text-sm" key={item}><Check className="size-4 text-vds-primary" />{item}</div>)}</div><div className="mt-8">{provisioned ? <form action={launchOnboardingAction}><Button size="lg" type="submit">Open my workspace</Button></form> : <ProvisionForm business={business} locale={locale} />}</div></div>}
    </div>
    <footer className="flex items-center justify-between border-t border-vds-border px-6 py-5 sm:px-10"><Button variant="ghost" disabled={step === 1 || pending} onClick={() => move(step - 1)}><ChevronLeft className="size-4" />Back</Button>{step < 4 && <Button disabled={pending} onClick={() => move(step + 1)}>{pending && <LoaderCircle className="size-4 animate-spin" />}{step === 3 ? "Continue" : "Next"}<ChevronRight className="size-4" /></Button>}</footer>
  </section>;
}

function ProvisionForm({ business, locale }: { business: string; locale: { country: string; currency: string; timezone: string; language: string } }) {
  return <form action={completeOnboardingAction}><input type="hidden" name="organizationName" value="My Organization" /><input type="hidden" name="workspaceName" value="Main Workspace" /><input type="hidden" name="businessType" value={business} /><input type="hidden" name="industry" value={business} /><input type="hidden" name="phone" value="0000000" /><input type="hidden" name="website" value="" /><input type="hidden" name="country" value={locale.country} /><input type="hidden" name="currency" value={locale.currency} /><input type="hidden" name="timezone" value={locale.timezone} /><input type="hidden" name="language" value={locale.language} /><input type="hidden" name="companySize" value="1-10" /><Button size="lg" type="submit">Create recommended workspace</Button></form>;
}
function ChoiceScreen({ title, copy, children }: { title: string; copy: string; children: React.ReactNode }) { return <div className="mx-auto max-w-3xl"><h1 className="text-3xl font-semibold tracking-tight">{title}</h1><p className="mt-3 text-sm text-vds-muted">{copy}</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div></div>; }
function ChoiceCard({ label, icon, selected, recommended, onClick }: { label: string; icon: React.ReactNode; selected: boolean; recommended?: boolean; onClick: () => void }) { return <Button type="button" variant="control" aria-pressed={selected} onClick={onClick} className={`relative h-32 flex-col items-start justify-between rounded-2xl border p-5 text-left ${selected ? "border-vds-accent-border bg-vds-primary-soft" : "border-vds-border bg-vds-surface hover:bg-vds-elevated"}`}><span className="text-vds-primary">{icon}</span><span className="font-medium">{label}</span>{recommended && <span className="absolute right-3 top-3 text-[10px] font-semibold uppercase tracking-wider text-vds-primary">Recommended</span>}</Button>; }
