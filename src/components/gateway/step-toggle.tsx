"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleStepAction } from "@/app/gateway-actions";

/* Tick a step done. Signed-out people are asked to sign in so progress is saved. */
export function StepToggle({ country, journey, step, done, signedIn, index }: { country: string; journey: string; step: string; done: boolean; signedIn: boolean; index: number }) {
  const [on, setOn] = useState(done);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button type="button" aria-pressed={on} aria-label={on ? `Step ${index} done. Tap to undo` : `Mark step ${index} done`} disabled={pending}
      onClick={() => {
        if (!signedIn) { router.push(`/join?mode=sign-in&next=${encodeURIComponent(`/${country}/gateway/${journey}`)}`); return; }
        const next = !on; setOn(next);
        start(async () => { const r = await toggleStepAction({ country, journey, step, done: next }); if (r.error) setOn(!next); });
      }}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition ${on ? "border-success bg-success text-white" : "border-line bg-raised text-ink"}`}>
      {on ? <Check className="h-5 w-5" aria-hidden="true" /> : index}
    </button>
  );
}
