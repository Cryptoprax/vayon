import { Button } from "@/features/platform/design-system";
import { captureLeadAction } from "../actions/lead.actions";

export function LeadCapture({ submitted = false, error = false }: { submitted?: boolean; error?: boolean }) {
  return <main className="mx-auto max-w-3xl px-5 py-24 sm:px-8">
    <p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">Contact Vayon</p>
    <h1 className="mt-4 text-5xl font-semibold">Book a demo or talk to sales.</h1>
    <p className="mt-5 text-vds-muted">Tell us about your organization. We’ll use these details only to respond to your request.</p>
    {submitted && <p className="mt-6 rounded-xl border border-vds-success p-4" role="status">Thank you.<br />Our team has received your request.<br />We will contact you shortly.</p>}
    {error && <p className="mt-6 rounded-xl border border-vds-danger p-4" role="alert">Please review your details.</p>}
    <form action={captureLeadAction} className="mt-8 grid gap-4">
      <select name="kind" className="h-12 rounded-xl border border-vds-border bg-vds-input px-4"><option value="demo">Book Demo</option><option value="trial">Start Free Trial</option><option value="sales">Contact Sales</option><option value="enterprise">Enterprise inquiry</option><option value="newsletter">Newsletter</option><option value="waitlist">Join waitlist</option></select>
      <input name="name" maxLength={100} placeholder="Name" className="h-12 rounded-xl border border-vds-border bg-vds-input px-4" />
      <input name="email" type="email" required maxLength={254} placeholder="Business email" className="h-12 rounded-xl border border-vds-border bg-vds-input px-4" />
      <input name="company" maxLength={160} placeholder="Company" className="h-12 rounded-xl border border-vds-border bg-vds-input px-4" />
      <textarea name="message" maxLength={2000} placeholder="How can we help?" className="min-h-32 rounded-xl border border-vds-border bg-vds-input p-4" />
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <Button type="submit" className="h-12 rounded-xl bg-vds-primary font-semibold text-vds-on-accent">Submit request</Button>
    </form>
  </main>;
}
