import { Button, ButtonLink } from "@/features/platform/design-system";
import { disconnectWhatsAppAction } from "./actions";

export function WhatsAppConnectCard({ connected = false }: { connected?: boolean }) {
  return <section className="rounded-2xl border border-vds-border bg-vds-surface p-5">
    <p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">WhatsApp Business</p>
    <h2 className="mt-2 text-xl font-semibold">{connected ? "Connected" : "Registration Pending"}</h2>
    <p className="mt-2 text-sm text-vds-muted">{connected ? "Your approved WhatsApp Business connection is available for workspace communications." : "WhatsApp Business onboarding will become available after VAYON’s Meta registration is complete. No technical IDs or access tokens are required from you now."}</p>
    <div className="mt-5 flex flex-wrap gap-3">{connected ? <form action={disconnectWhatsAppAction}><Button variant="danger">Disconnect</Button></form> : <><span className="inline-flex h-11 items-center rounded-xl border border-vds-border px-4 text-sm font-medium">Coming Soon</span><ButtonLink href="/contact?intent=whatsapp-early-access" variant="outline">Join Early Access</ButtonLink></>}</div>
  </section>;
}
