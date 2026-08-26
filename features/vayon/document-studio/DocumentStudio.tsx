"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  BookOpen,
  ChevronRight,
  Clock3,
  FilePlus2,
  History,
  MessageSquare,
  Redo2,
  Sparkles,
  Undo2,
} from "lucide-react";
import { Button } from "@/features/platform/design-system";
import { SmartEmptyState } from "@/features/vayon/components/SmartEmptyState";
import { editDocumentBlock, generateDocument } from "./actions";
import {
  documentTypes,
  type DocumentStudioSnapshot,
  type DocumentType,
  type DocumentWizardInput,
  type EditableDocumentModel,
} from "./types";
const card =
  "rounded-3xl border border-vds-border bg-vds-surface/80 shadow-xl shadow-vds-shadow/10 backdrop-blur-xl";
const input =
  "w-full rounded-xl border border-vds-border bg-vds-elevated px-3 py-2 text-sm outline-none focus:border-vds-primary";
const initial: DocumentWizardInput = {
  prompt: "",
  company: "",
  industry: "",
  audience: "",
  language: "English",
  brandId: null,
  campaignId: null,
  projectId: null,
  purpose: "",
  tone: "Professional",
  length: "Standard",
  documentType: "Company Profile",
};
export function DocumentStudio({
  snapshot,
}: {
  readonly snapshot: DocumentStudioSnapshot;
}) {
  const [wizard, setWizard] = useState(false),
    [step, setStep] = useState(1),
    [form, setForm] = useState(initial),
    [notice, setNotice] = useState<string | null>(null),
    [document, setDocument] = useState<EditableDocumentModel | null>(null),
    [history, setHistory] = useState<readonly EditableDocumentModel[]>([]),
    [pending, startTransition] = useTransition();
  const update = <K extends keyof DocumentWizardInput>(
    key: K,
    value: DocumentWizardInput[K],
  ) => setForm((current) => ({ ...current, [key]: value }));
  const submit = () =>
    startTransition(async () => {
      const submission = await generateDocument(form);
      if (submission.document) {
        setDocument(submission.document);
        setHistory([]);
      }
      setNotice(
        submission.result.status === "WaitingProvider"
          ? "No compatible document provider is configured. Your request is safely paused in WaitingProvider; no content was fabricated."
          : `Execution ${submission.result.status}.`,
      );
      setWizard(false);
    });
  const updateBlock = (sectionId: string, blockId: string, content: string) => {
    if (!document) return;
    setHistory((items) => [...items, document]);
    setDocument({
      ...document,
      version: document.version + 1,
      updatedAt: new Date().toISOString(),
      sections: document.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              blocks: section.blocks.map((block) =>
                block.id === blockId ? { ...block, content } : block,
              ),
            }
          : section,
      ),
    });
  };
  const aiEdit = (operation: string, content: string) =>
    startTransition(async () => {
      const submission = await editDocumentBlock(form, content, operation);
      if (submission.document && document) {
        setHistory((items) => [...items, document]);
        const replacement = submission.document.sections.flatMap(
          (section) => section.blocks,
        )[0]?.content;
        if (replacement)
          setDocument({
            ...document,
            version: document.version + 1,
            updatedAt: new Date().toISOString(),
            sections: document.sections.map((section, index) =>
              index
                ? section
                : {
                    ...section,
                    blocks: section.blocks.map((block, blockIndex) =>
                      blockIndex ? block : { ...block, content: replacement },
                    ),
                  },
            ),
          });
      }
      setNotice(
        submission.result.status === "WaitingProvider"
          ? "Provider unavailable. The original block remains unchanged."
          : `${operation} completed as a new editable version.`,
      );
    });
  return (
    <main className="mx-auto w-full max-w-[120rem] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className={`${card} relative overflow-hidden p-6 sm:p-8`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,var(--vds-color-primary-soft),transparent_40%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <Link
              href="/vayon/creative"
              className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary"
            >
              Creative Cloud
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">
              AI Document Studio
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-vds-muted">
              Create brand-governed, editable business documents through the
              Creative Runtime and approval pipeline.
            </p>
          </div>
          <Button onClick={() => setWizard(true)}>
            <FilePlus2 className="size-4" />
            Create document
          </Button>
        </div>
      </header>
      {notice && (
        <div
          role="status"
          className={`${card} flex items-start gap-3 border-vds-warning p-4 text-sm`}
        >
          <Clock3 className="mt-0.5 size-5 shrink-0 text-vds-warning" />
          <span>{notice}</span>
        </div>
      )}
      <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <article className={`${card} p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-vds-muted">
                Documents
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                Production workspace
              </h2>
            </div>
            <span className="rounded-full bg-vds-warning-soft px-3 py-1 text-xs text-vds-warning">
              {snapshot.executionStatus}
            </span>
          </div>
          {document ? (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{document.title}</h3>
                  <p className="text-xs text-vds-muted">
                    Version {document.version} · {document.approval}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    disabled={!history.length}
                    onClick={() => {
                      const previous = history.at(-1);
                      if (previous) {
                        setDocument(previous);
                        setHistory((items) => items.slice(0, -1));
                      }
                    }}
                  >
                    <Undo2 className="size-4" />
                    Undo
                  </Button>
                  <Button variant="secondary" disabled>
                    <Redo2 className="size-4" />
                    Redo
                  </Button>
                </div>
              </div>
              {document.sections.map((section) => (
                <section
                  key={section.id}
                  className="rounded-2xl bg-vds-elevated p-4"
                >
                  <input
                    aria-label="Section title"
                    className={`${input} font-semibold`}
                    value={section.title}
                    onChange={(event) => {
                      if (!document) return;
                      setHistory((items) => [...items, document]);
                      setDocument({
                        ...document,
                        version: document.version + 1,
                        sections: document.sections.map((item) =>
                          item.id === section.id
                            ? { ...item, title: event.target.value }
                            : item,
                        ),
                      });
                    }}
                  />
                  {section.blocks.map((block) => (
                    <div className="mt-3" key={block.id}>
                      <textarea
                        aria-label={`${section.title} content`}
                        className={`${input} min-h-32 leading-6`}
                        value={block.content}
                        onChange={(event) =>
                          updateBlock(section.id, block.id, event.target.value)
                        }
                      />
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {snapshot.aiEdits.map((operation) => (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={pending}
                            key={operation}
                            onClick={() => aiEdit(operation, block.content)}
                          >
                            {operation}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              ))}
            </div>
          ) : (
            <SmartEmptyState
              className="mt-8"
              title="Generate your first proposal."
              description="Start with a natural-language brief and move through the governed Creative Runtime."
              primaryLabel="Generate with AI"
              onPrimary={() => setWizard(true)}
            />
          )}
        </article>
        <aside className={`${card} p-5`}>
          <h2 className="font-semibold">Creative Director pipeline</h2>
          <ol className="mt-4 space-y-2">
            {snapshot.pipeline.map((item, index) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-xl bg-vds-elevated p-3 text-sm"
              >
                <span className="grid size-7 place-items-center rounded-full bg-vds-primary-soft text-xs text-vds-primary">
                  {index + 1}
                </span>
                {item}
                {index < snapshot.pipeline.length - 1 && (
                  <ChevronRight className="ml-auto size-4 text-vds-muted" />
                )}
              </li>
            ))}
          </ol>
        </aside>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <article className={`${card} p-5`}>
          <BookOpen className="size-5 text-vds-primary" />
          <h3 className="mt-4 font-semibold">Editable model</h3>
          <p className="mt-2 text-sm text-vds-muted">
            Sections and blocks support direct editing with structured document
            semantics.
          </p>
          <div className="mt-4 flex gap-2 text-xs text-vds-muted">
            <Undo2 className="size-4" />
            Undo <Redo2 className="ml-2 size-4" />
            Redo <History className="ml-2 size-4" />
            Versions
          </div>
        </article>
        <article className={`${card} p-5`}>
          <Sparkles className="size-5 text-vds-primary" />
          <h3 className="mt-4 font-semibold">AI editing</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {snapshot.aiEdits.map((x) => (
              <span
                key={x}
                className="rounded-full bg-vds-elevated px-2.5 py-1 text-xs"
              >
                {x}
              </span>
            ))}
          </div>
        </article>
        <article className={`${card} p-5`}>
          <MessageSquare className="size-5 text-vds-primary" />
          <h3 className="mt-4 font-semibold">Review & export</h3>
          <p className="mt-2 text-sm text-vds-muted">
            Comments, version history and approval precede every governed
            export.
          </p>
          <p className="mt-3 text-xs text-vds-muted">
            {snapshot.exports.join(" · ")}
          </p>
        </article>
      </section>
      {wizard && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-vds-overlay p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="document-wizard-title"
        >
          <section
            className={`${card} max-h-[90vh] w-full max-w-3xl overflow-auto p-6`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-vds-muted">Step {step} of 2</p>
                <h2
                  id="document-wizard-title"
                  className="text-xl font-semibold"
                >
                  Create with Creative Director
                </h2>
              </div>
              <Button variant="ghost" onClick={() => setWizard(false)}>
                Close
              </Button>
            </div>
            {step === 1 ? (
              <div className="mt-6 space-y-4">
                <label className="block text-sm font-medium">
                  What should VAYON create?
                  <textarea
                    autoFocus
                    className={`${input} mt-2 min-h-28`}
                    value={form.prompt}
                    onChange={(e) => update("prompt", e.target.value)}
                    placeholder="Create a premium solar company profile."
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Company"
                    value={form.company}
                    onChange={(v) => update("company", v)}
                  />
                  <Field
                    label="Industry"
                    value={form.industry}
                    onChange={(v) => update("industry", v)}
                  />
                  <Field
                    label="Audience"
                    value={form.audience}
                    onChange={(v) => update("audience", v)}
                  />
                  <Field
                    label="Purpose"
                    value={form.purpose}
                    onChange={(v) => update("purpose", v)}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Select
                  label="Document type"
                  value={form.documentType}
                  options={documentTypes}
                  onChange={(v) => update("documentType", v as DocumentType)}
                />
                <Field
                  label="Language"
                  value={form.language}
                  onChange={(v) => update("language", v)}
                />
                <Select
                  label="Tone"
                  value={form.tone}
                  options={["Professional", "Luxury", "Corporate", "Modern"]}
                  onChange={(v) => update("tone", v)}
                />
                <Select
                  label="Length"
                  value={form.length}
                  options={["Short", "Standard", "Detailed"]}
                  onChange={(v) =>
                    update("length", v as DocumentWizardInput["length"])
                  }
                />
                <Select
                  label="Brand"
                  value={form.brandId ?? ""}
                  options={snapshot.brands.map((x) => x.id)}
                  labels={Object.fromEntries(
                    snapshot.brands.map((x) => [x.id, x.name]),
                  )}
                  onChange={(v) => update("brandId", v || null)}
                />
                <Select
                  label="Campaign"
                  value={form.campaignId ?? ""}
                  options={snapshot.campaigns.map((x) => x.id)}
                  labels={Object.fromEntries(
                    snapshot.campaigns.map((x) => [x.id, x.name]),
                  )}
                  onChange={(v) => update("campaignId", v || null)}
                />
                <Select
                  label="Project"
                  value={form.projectId ?? ""}
                  options={snapshot.projects.map((x) => x.id)}
                  labels={Object.fromEntries(
                    snapshot.projects.map((x) => [x.id, x.name]),
                  )}
                  onChange={(v) => update("projectId", v || null)}
                />
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              {step === 2 && (
                <Button variant="secondary" onClick={() => setStep(1)}>
                  Back
                </Button>
              )}
              {step === 1 ? (
                <Button
                  disabled={!form.prompt.trim()}
                  onClick={() => setStep(2)}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  disabled={pending || !form.company.trim()}
                  onClick={submit}
                >
                  {pending ? "Planning…" : "Run through Creative Runtime"}
                </Button>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        className={`${input} mt-2`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function Select({
  label,
  value,
  options,
  labels = {},
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  labels?: Readonly<Record<string, string>>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <select
        className={`${input} mt-2`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Not selected</option>
        {options.map((x) => (
          <option key={x} value={x}>
            {labels[x] ?? x}
          </option>
        ))}
      </select>
    </label>
  );
}
