import Link from "next/link";
import { Activity, Cable, KeyRound, ShieldCheck, Wrench } from "lucide-react";
import {
  Badge,
  ButtonLink,
  Card,
  Page,
  PageHeader,
  Section,
} from "@/features/platform/design-system";
import type { ProviderDiagnosticModel } from "../domain/contracts";
import { ConnectionWizard } from "./ConnectionWizard";

const connectionTone = (
  state: ProviderDiagnosticModel["connection"]["state"],
): "success" | "warning" | "danger" | "neutral" =>
  state === "connected"
    ? "success"
    : state === "expired" || state === "validation-failed"
      ? "danger"
      : state === "pending"
        ? "warning"
        : "neutral";

export function ProviderInventory({
  models,
}: {
  readonly models: readonly ProviderDiagnosticModel[];
}) {
  return (
    <Page>
      <PageHeader
        eyebrow="Integration governance"
        title="Live providers"
        description="Prepare provider authorization, capability discovery, sandbox validation, and diagnostics without enabling business operations."
        actions={<Badge tone="info">Foundation only</Badge>}
      />
      <Section className="mt-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {models.map((model) => (
            <Card key={model.definition.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-vds-primary-soft text-vds-primary">
                  <Cable className="size-5" aria-hidden="true" />
                </span>
                <Badge tone={connectionTone(model.connection.state)}>
                  {model.connection.state}
                </Badge>
              </div>
              <h2 className="mt-5 text-lg font-semibold">
                {model.definition.name}
              </h2>
              <p className="mt-2 text-sm text-vds-muted">
                OAuth 2.0 · {model.definition.capabilities.length} discoverable
                capabilities · v{model.definition.version}
              </p>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-vds-subtle">Authorization</dt>
                  <dd className="mt-1">{model.connection.authorization}</dd>
                </div>
                <div>
                  <dt className="text-vds-subtle">Health</dt>
                  <dd className="mt-1">{model.health.state}</dd>
                </div>
                <div>
                  <dt className="text-vds-subtle">Latency</dt>
                  <dd className="mt-1">Not measured</dd>
                </div>
                <div>
                  <dt className="text-vds-subtle">Last validation</dt>
                  <dd className="mt-1">
                    {model.health.lastValidation ?? "Never"}
                  </dd>
                </div>
              </dl>
              <ButtonLink
                href={`/vayon/providers/${model.definition.id}`}
                variant="outline"
                className="mt-6"
              >
                Review provider
              </ButtonLink>
            </Card>
          ))}
        </div>
      </Section>
      <Card className="mt-6">
        <h2 className="font-semibold">Safety boundary</h2>
        <p className="mt-2 text-sm leading-6 text-vds-muted">
          This surface does not launch OAuth, store credentials, contact
          providers, inspect production mail, mutate calendars, send messages,
          or dispatch workflows.
        </p>
      </Card>
    </Page>
  );
}

export function ProviderDetail({
  model,
}: {
  readonly model: ProviderDiagnosticModel;
}) {
  const { definition, connection, health, validation } = model;
  return (
    <Page>
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-vds-muted">
        <Link
          href="/vayon/providers"
          className="vds-focus rounded-md hover:text-vds-primary"
        >
          Live providers
        </Link>
        <span aria-hidden="true" className="px-2">
          /
        </span>
        <span aria-current="page">{definition.name}</span>
      </nav>
      <PageHeader
        eyebrow="Provider readiness"
        title={definition.name}
        description="Connection, authorization, capability, health, and diagnostics contracts. Business operations remain disabled."
        actions={
          <Badge tone={connectionTone(connection.state)}>
            {connection.state}
          </Badge>
        }
      />
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <ConnectionWizard model={model} />
        <div className="grid gap-4">
          <Card>
            <Heading icon={Activity} title="Health" />
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Datum label="State" value={health.state} />
              <Datum
                label="Latency"
                value={
                  health.latencyMs === null
                    ? "Not measured"
                    : `${health.latencyMs} ms`
                }
              />
              <Datum label="Authorization" value={health.authorization} />
              <Datum
                label="Last validation"
                value={health.lastValidation ?? "Never"}
              />
            </dl>
            <p className="mt-4 text-sm text-vds-muted">{health.message}</p>
          </Card>
          <Card>
            <Heading icon={KeyRound} title="Authorization" />
            <p className="mt-3 text-sm text-vds-muted">
              Credential reference:{" "}
              {connection.credential?.maskedLabel ?? "Unavailable"}. Secret
              values are never returned to this view.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {definition.requiredScopes.map((scope) => (
                <li
                  key={scope}
                  className="rounded-lg bg-vds-elevated px-3 py-2 font-mono text-xs"
                >
                  {scope}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <Heading icon={ShieldCheck} title="Capabilities" />
          <ul className="mt-4 space-y-3">
            {definition.capabilities.map((capability) => (
              <li
                key={capability.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-vds-border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{capability.label}</p>
                  <p className="mt-1 text-xs text-vds-subtle">
                    {capability.access} · {capability.reason}
                  </p>
                </div>
                <Badge>Disabled</Badge>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <Heading icon={Wrench} title="Diagnostics" />
          <dl className="mt-4 grid gap-3 text-sm">
            <Datum
              label="Sandbox validation"
              value={validation.valid ? "Passed" : "Not available"}
            />
            <Datum label="External request" value="No" />
            <Datum label="Provider version" value={definition.version} />
            <Datum
              label="Validation issues"
              value={validation.issues.join(" ") || "None"}
            />
          </dl>
          <ButtonLink
            href="/vayon/settings/integrations"
            variant="outline"
            className="mt-5"
          >
            Open Connected Apps
          </ButtonLink>
        </Card>
      </div>
    </Page>
  );
}

function Heading({
  icon: Icon,
  title,
}: {
  readonly icon: typeof Activity;
  readonly title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-5 text-vds-primary" aria-hidden="true" />
      <h2 className="font-semibold">{title}</h2>
    </div>
  );
}
function Datum({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-vds-border pb-2 last:border-0">
      <dt className="text-vds-subtle">{label}</dt>
      <dd className="max-w-[65%] text-right font-medium">{value}</dd>
    </div>
  );
}
