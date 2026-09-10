import { MessageCircleMore } from "lucide-react";
import Link from "next/link";
import type { WhatsAppConversation } from "../types";

export function WhatsAppConversations({
  conversations,
}: {
  readonly conversations: readonly WhatsAppConversation[];
}) {
  return (
    <section
      className="rounded-3xl border border-vds-border bg-vds-surface p-5 sm:p-6"
      aria-labelledby="whatsapp-heading"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[.18em] text-vds-success">
            Communications
          </p>
          <h2 id="whatsapp-heading" className="mt-2 text-xl font-semibold">
            Recent WhatsApp
          </h2>
        </div>
        <Link
          href="/vayon/communications"
          className="focus-ring rounded-lg text-xs text-vds-muted hover:text-vds-primary"
        >
          Open inbox →
        </Link>
      </div>
      {conversations.length ? (
        <ol className="mt-5 divide-y divide-vds-divider">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <div
                className="focus-ring flex items-center gap-3 rounded-xl py-3 hover:bg-vds-hover sm:px-2"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-vds-success-soft text-vds-success">
                  <MessageCircleMore className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <strong className="truncate text-sm font-medium text-vds-secondary">
                      {conversation.customer}
                    </strong>
                    {conversation.unread && (
                      <span
                        className="size-2 rounded-full bg-vds-primary"
                        aria-label="Unread"
                      />
                    )}
                  </span>
                  <span className="mt-1 block truncate text-xs text-vds-muted">
                    {conversation.message}
                  </span>
                </span>
                <time className="shrink-0 text-[11px] text-vds-subtle">
                  {new Intl.DateTimeFormat("en", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(conversation.occurredAt))}
                </time>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="py-12 text-center">
          <MessageCircleMore className="mx-auto size-6 text-vds-subtle" />
          <p className="mt-3 text-sm font-medium">No WhatsApp conversations</p>
          <p className="mt-1 text-xs text-vds-muted">
            Connected workspace conversations will appear here.
          </p>
        </div>
      )}
    </section>
  );
}
