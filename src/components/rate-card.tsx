"use client";

import { Loader2, Star } from "lucide-react";
import { useState } from "react";
import { submitReviewAction } from "@/app/review-actions";

const WORDS = ["", "Poor", "Not great", "OK", "Good", "Excellent"];

/*
 * "How was your trip?": tap the stars, add a comment if you like, submit. No tipping.
 * Used after a ride, after a business has helped you, and in the pop-up on any page.
 */
export function RateCard({ kind, refId, title, subtitle, initial, onDone, onSkip, existing }: {
  kind: "trip" | "service"; refId: string; title: string; subtitle?: string; initial?: string;
  onDone?: () => void; onSkip?: () => void; existing?: { rating: number; comment: string | null } | null;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true); setError(null);
    const res = await submitReviewAction({ kind, ref: refId, rating, comment: comment.trim() || undefined });
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    setDone(true);
    setTimeout(() => onDone?.(), 1200);
  }

  if (done) {
    return <div className="py-6 text-center"><p className="text-lg font-semibold text-ink">Thank you</p><p className="text-sm">Your rating helps others choose well.</p></div>;
  }
  return (
    <div className="text-center">
      {initial && <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-deep text-2xl font-bold text-white" aria-hidden="true">{initial}</span>}
      <p className="text-xl font-bold text-ink">{title}</p>
      {subtitle && <p className="mt-1 text-sm">{subtitle}</p>}
      <div className="mt-4 flex justify-center gap-2" role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className="p-1">
            <Star className={`h-10 w-10 transition ${n <= rating ? "fill-gold text-gold" : "text-ink/25"}`} strokeWidth={1.5} aria-hidden="true" />
          </button>
        ))}
      </div>
      <p className="mt-1 h-5 text-sm font-semibold text-ink">{WORDS[rating]}</p>
      {rating > 0 && (
        <textarea value={comment} onChange={(e) => setComment(e.target.value.slice(0, 1000))} rows={3}
          placeholder={rating >= 4 ? "What went well? (optional)" : "What could have been better? (optional)"}
          className="mt-3 w-full rounded-xl border border-line bg-raised p-3 text-left text-ink" aria-label="Comment (optional)" />
      )}
      {error && <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{error}</p>}
      <button type="button" onClick={submit} disabled={!rating || busy}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-ink disabled:bg-sunken disabled:text-muted">
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{existing ? "Update rating" : "Submit"}
      </button>
      {onSkip && <button type="button" onClick={onSkip} className="mt-2 h-10 w-full text-sm font-semibold text-muted">Skip</button>}
    </div>
  );
}
