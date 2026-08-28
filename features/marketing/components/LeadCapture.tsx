import type { ReactNode } from "react";
import { Button } from "@/features/platform/design-system";
import { captureLeadAction } from "../actions/lead.actions";
const channels = [
  ["General", "hello@vayon.online"],
  ["Sales & Enterprise", "sales@vayon.online"],
  ["Billing", "billing@vayon.online"],
  ["Legal", "legal@vayon.online"],
  ["Privacy", "privacy@vayon.online"],
  ["Security", "security@vayon.online"],
  ["Support", "hello@vayon.online"],
  ["Partnerships", "hello@vayon.online"],
] as const;
export function LeadCapture({
  submitted = false,
  error = false,
}: {
  submitted?: boolean;
  error?: boolean;
}) {
  return (
    <main className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <p className="eyebrow">Contact VAYON</p>
      <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-[-.05em]">
        Start a serious real estate growth conversation.
      </h1>
      <p className="mt-5 max-w-3xl text-vds-muted">
        Choose the most relevant request. We use submitted details only to
        respond and support the requested commercial conversation.
      </p>
      <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {channels.map(([name, email]) => (
          <article
            className="rounded-2xl border border-vds-border bg-vds-surface p-4"
            key={name}
          >
            <h2 className="font-semibold">{name}</h2>
            <p className="mt-2 break-all text-xs text-vds-muted">{email}</p>
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs text-vds-subtle">
        Business hours: Monday–Friday, 09:00–18:00 India Standard Time.
        Mailboxes are published contact placeholders until operational
        configuration is independently verified.
      </p>
      {submitted && (
        <p
          className="mt-6 rounded-xl border border-vds-success p-4"
          role="status"
        >
          Thank you.
          <br />
          Our team has received your request.
          <br />
          We will contact you shortly.
        </p>
      )}
      {error && (
        <p
          className="mt-6 rounded-xl border border-vds-danger p-4"
          role="alert"
        >
          Please review your details.
        </p>
      )}
      <form
        action={captureLeadAction}
        className="mt-10 grid gap-5 rounded-3xl border border-vds-border bg-vds-surface p-6 sm:grid-cols-2"
      >
        <Field label="Request type" id="contact-kind">
          <select
            id="contact-kind"
            name="kind"
            className="h-12 w-full rounded-xl border border-vds-border bg-vds-input px-4"
          >
            <option value="demo">Book Demo</option>
            <option value="trial">Start Free</option>
            <option value="sales">Contact Sales</option>
            <option value="enterprise">Enterprise inquiry</option>
            <option value="newsletter">Newsletter</option>
            <option value="waitlist">General enquiry</option>
          </select>
        </Field>
        <Field label="Name" id="contact-name">
          <input
            id="contact-name"
            name="name"
            maxLength={120}
            autoComplete="name"
            className="h-12 w-full rounded-xl border border-vds-border bg-vds-input px-4"
          />
        </Field>
        <Field label="Business email" id="contact-email">
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            className="h-12 w-full rounded-xl border border-vds-border bg-vds-input px-4"
          />
        </Field>
        <Field label="Company" id="contact-company">
          <input
            id="contact-company"
            name="company"
            maxLength={160}
            autoComplete="organization"
            className="h-12 w-full rounded-xl border border-vds-border bg-vds-input px-4"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="How can we help?" id="contact-message">
            <textarea
              id="contact-message"
              name="message"
              maxLength={2000}
              className="min-h-32 w-full rounded-xl border border-vds-border bg-vds-input p-4"
            />
          </Field>
        </div>
        <input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />
        <Button type="submit" className="h-12 sm:col-span-2">
          Submit request
        </Button>
      </form>
    </main>
  );
}
function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold" htmlFor={id}>
      {label}
      {children}
    </label>
  );
}
