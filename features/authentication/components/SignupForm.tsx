"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button, ButtonLink } from "@/features/platform/design-system";
import { googleLoginAction, signUpAction, type SignUpResult } from "../actions/auth.actions";
import { AuthFields, AuthShell, FormNotice } from "./AuthForm";

export function SignupForm({ initialError }: { initialError?: string }) {
  const [state, submit, pending] = useActionState<SignUpResult | null, FormData>(async (_previous, form) => {
    try { return await signUpAction(form); }
    catch { return { status: "error", message: "We couldn't complete signup. Check your connection and try again." }; }
  }, null);
  const confirmation = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state?.status === "confirmation") confirmation.current?.focus();
  }, [state]);

  if (state?.status === "confirmation") return (
    <AuthShell title="Check your email" description="One more step to get started with VAYON.">
      <div ref={confirmation} tabIndex={-1} role="status" className="rounded-2xl outline-none">
        <span className="mb-5 inline-flex rounded-2xl bg-vds-primary-soft p-3 text-vds-primary"><MailCheck className="size-7" aria-hidden="true" /></span>
        <p className="text-sm leading-7 text-vds-secondary">
          Your account has been created successfully. We&apos;ve sent a verification link to{" "}
          <strong className="break-all font-semibold text-vds-foreground">{state.email}</strong>.
          {" "}Please confirm your email before signing in.
        </p>
        <p className="mt-4 text-xs leading-6 text-vds-muted">Check your spam folder if it hasn&apos;t arrived. Open the link in the same browser where you signed up.</p>
      </div>
      <ButtonLink href="/login" fullWidth className="mt-6">OK, go to Sign In</ButtonLink>
    </AuthShell>
  );

  return (
    <AuthShell title="Create your account" description="Bring your properties, leads, and daily work into one place.">
      <div role="alert"><FormNotice error={state?.status === "error" ? state.message : initialError} /></div>
      <form action={googleLoginAction}><Button type="submit" disabled={pending} variant="control" className="mb-4 w-full rounded-xl border border-vds-border-strong bg-vds-surface px-4 py-3 text-sm font-semibold text-vds-foreground">Continue with Google</Button></form>
      <div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-widest text-vds-subtle"><span className="h-px flex-1 bg-vds-hover" />or<span className="h-px flex-1 bg-vds-hover" /></div>
      <form action={submit} aria-busy={pending} onSubmit={(event) => { if (pending) event.preventDefault(); }}>
        <fieldset disabled={pending} className="min-w-0 disabled:opacity-60"><AuthFields kind="signup" /></fieldset>
        {pending && <p role="status" className="mt-3 text-sm text-vds-muted">Creating your account…</p>}
      </form>
      <p className="mt-5 text-center text-sm text-vds-muted">Already registered? <Link href="/login" className="text-vds-primary">Sign in</Link></p>
    </AuthShell>
  );
}
