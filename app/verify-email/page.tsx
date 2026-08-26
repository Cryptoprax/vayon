import { AuthShell } from "@/features/authentication/components/AuthForm";
import { ButtonLink } from "@/features/platform/design-system";
export default function Page() {
  return <AuthShell title="Verify your email" description="Open the verification link sent to your email. After verification, VAYON will securely prepare your workspace and continue to your dashboard."><div role="status" className="rounded-2xl border border-vds-accent-border bg-vds-primary-soft p-4 text-sm leading-6 text-vds-secondary"><p>You can safely close this page after confirming your email.</p><p className="mt-2 text-vds-muted">Already verified? Sign in to continue. If the email has not arrived, check spam before requesting another signup email.</p></div><ButtonLink href="/login" className="mt-4" fullWidth>Continue to sign in</ButtonLink></AuthShell>;
}
