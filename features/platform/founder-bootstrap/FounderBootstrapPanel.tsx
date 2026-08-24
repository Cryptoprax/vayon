import { Button } from "@/features/platform/design-system";

import { grantFounderAction, revokeFounderAction } from "./actions";
import type { FounderAccountStatus } from "./types";

export function FounderBootstrapPanel({
  accounts,
  message,
  error,
}: {
  accounts: readonly FounderAccountStatus[];
  message?: string;
  error?: string;
}) {
  return <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
    <header><p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">Founder Portal</p><h1 className="mt-2 text-3xl font-semibold">Founder access</h1><p className="mt-2 max-w-3xl text-sm text-vds-muted">Provision allowlisted, existing accounts through trusted Supabase Auth application metadata. Every mutation is re-authorized on the server.</p></header>
    {message ? <p role="status" className="rounded-xl border border-vds-success/30 bg-vds-success/10 p-3 text-sm text-vds-success">{message}</p> : null}
    {error ? <p role="alert" className="rounded-xl border border-vds-danger/30 bg-vds-danger/10 p-3 text-sm text-vds-danger">{error}</p> : null}
    <section className="overflow-hidden rounded-3xl border border-vds-border bg-vds-surface/70">
      <div className="overflow-x-auto"><table className="w-full min-w-[48rem] text-left text-sm"><thead><tr className="border-b border-vds-border text-xs uppercase tracking-wider text-vds-subtle"><th className="px-5 py-4">Account</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Access</th><th className="px-5 py-4">Provisioning</th><th className="px-5 py-4">Action</th></tr></thead><tbody>{accounts.map((account) => <tr className="border-b border-vds-border/60 last:border-0" key={account.id}><td className="px-5 py-4 font-medium">{account.email}</td><td className="px-5 py-4 text-vds-muted">{account.role ?? "No platform role"}</td><td className="px-5 py-4">{account.founderAccess ? "Founder" : "Denied"}</td><td className="px-5 py-4 text-vds-muted">{account.bootstrapManaged ? `Managed · ${account.grantedAt ? new Date(account.grantedAt).toLocaleString() : "active"}` : "Not bootstrap-managed"}</td><td className="px-5 py-4">{account.founderAccess ? <RoleForm account={account} action={revokeFounderAction} label="Revoke Founder" disabled={!account.bootstrapManaged}/> : <RoleForm account={account} action={grantFounderAction} label="Grant Founder"/>}</td></tr>)}</tbody></table></div>
      {!accounts.length ? <p className="p-8 text-center text-sm text-vds-muted">No allowlisted email currently has an authenticated account.</p> : null}
    </section>
  </main>;
}

function RoleForm({ account, action, label, disabled = false }: { account: FounderAccountStatus; action: (form: FormData) => Promise<void>; label: string; disabled?: boolean }) {
  return <form action={action} className="flex min-w-80 items-end gap-2"><input type="hidden" name="email" value={account.email}/><label className="flex-1 text-xs text-vds-muted">Reason<input required minLength={8} maxLength={500} name="reason" className="mt-1 h-10 w-full rounded-xl border border-vds-border bg-vds-elevated px-3 text-sm text-vds-foreground" placeholder="Required audit reason"/></label><Button disabled={disabled} className="h-10 rounded-xl px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40" type="submit" variant="outline">{label}</Button></form>;
}
