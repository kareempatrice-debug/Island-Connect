import type { ReactNode } from "react";

export interface ChatMessage { id: number | string; mine: boolean; body: string; at: string }

/* A booked trip's conversation between the customer and the operator. */
export function TripChat({ title, subtitle, back, messages, form, notice }: {
  title: string; subtitle: string; back: ReactNode; messages: ChatMessage[]; form: ReactNode; notice?: ReactNode;
}) {
  return (
    <div className="flex flex-col">
      {back}
      <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm">{subtitle}</p>
      {notice}
      <ol className="mt-5 space-y-2" aria-label="Messages">
        {!messages.length && <li className="rounded-2xl border border-dashed border-line p-5 text-center text-sm">No messages yet. Say hello and confirm the pickup details.</li>}
        {messages.map((m, i) => (
          <li key={m.id} id={i === messages.length - 1 ? "latest" : undefined} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${m.mine ? "rounded-br-md bg-primary text-primary-ink" : "rounded-bl-md bg-raised text-ink ring-1 ring-line/60"}`}>
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              <p className={`mt-1 text-[0.7rem] ${m.mine ? "text-white/75" : "text-muted"}`}>{new Date(m.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Grenada" })}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="sticky bottom-24 mt-5 lg:bottom-4">{form}</div>
    </div>
  );
}
