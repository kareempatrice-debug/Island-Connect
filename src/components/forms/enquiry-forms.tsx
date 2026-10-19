"use client";

import { useActionState, useEffect, useRef } from "react";
import { replyAction, startEnquiryAction } from "@/app/enquiry-actions";
import { btn, input } from "@/components/ui";

const label = "mb-1.5 block text-sm font-semibold text-ink";

export function StartEnquiryForm({ country, businessId, services, subject = "", body = "" }: { country: string; businessId: string; services: { id: string; name: string }[]; subject?: string; body?: string }) {
  const [state, action, pending] = useActionState(startEnquiryAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="country" value={country} />
      <input type="hidden" name="businessId" value={businessId} />
      <label className="block"><span className={label}>Subject</span><input name="subject" required maxLength={120} defaultValue={subject} placeholder="e.g. Airport pick-up on Friday" className={input} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        {services.length > 0 && (
          <label className="block"><span className={label}>Service (optional)</span>
            <select name="serviceId" className={input}><option value="">Not sure</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        )}
        <label className="block"><span className={label}>Preferred date (optional)</span><input name="preferredDate" type="date" className={input} /></label>
      </div>
      <label className="block"><span className={label}>Message</span>
        <textarea name="body" required rows={5} maxLength={4000} defaultValue={body} className={`${input} h-auto py-3`} placeholder="What you need, where, and when." /></label>
      {state.error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 font-medium text-danger">{state.error}</p>}
      <button disabled={pending} className={`${btn.primary} w-full disabled:opacity-60`}>{pending ? "Sending…" : "Send enquiry"}</button>
    </form>
  );
}

export function ReplyForm({ enquiryId, country }: { enquiryId: string; country: string }) {
  const [state, action, pending] = useActionState(replyAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.message === "sent") ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="flex items-end gap-2">
      <input type="hidden" name="enquiryId" value={enquiryId} />
      <input type="hidden" name="country" value={country} />
      <label className="flex-1"><span className="sr-only">Your reply</span>
        <textarea name="body" required rows={2} maxLength={4000} placeholder="Write a reply" className={`${input} h-auto py-3`} /></label>
      <button disabled={pending} className={`${btn.primary} disabled:opacity-60`}>{pending ? "…" : "Send"}</button>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
