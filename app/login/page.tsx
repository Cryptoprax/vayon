import { Button } from "@/features/platform/design-system";
import Link from"next/link";import{AuthFields,AuthShell,FormNotice}from"@/features/authentication/components/AuthForm";import{googleLoginAction,loginAction}from"@/features/authentication/actions/auth.actions";export default async function Page({searchParams}:{searchParams:Promise<{error?:string;success?:string;next?:string}>}){const q=await searchParams;return <AuthShell title="Welcome back" description="Sign in to manage your properties, leads, and daily work."><FormNotice {...q}/><form action={googleLoginAction}><input type="hidden" name="next" value={q.next ?? "/vayon"}/><Button
    type="submit"
    variant="control"
    className="mb-4 w-full rounded-xl border border-vds-border-strong bg-vds-surface px-4 py-3 text-sm font-semibold text-vds-foreground"
>
    Continue with Google
</Button></form><div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-widest text-vds-subtle"><span className="h-px flex-1 bg-vds-hover"/>or<span className="h-px flex-1 bg-vds-hover"/></div><form action={loginAction}><input type="hidden" name="next" value={q.next ?? "/vayon"}/><AuthFields kind="login"/></form><div className="mt-5 flex justify-between text-sm"><Link href="/forgot-password" className="text-vds-primary">Forgot password?</Link><Link href="/signup" className="text-vds-muted">Create account</Link></div></AuthShell>}
