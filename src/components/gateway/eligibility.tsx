"use client";

import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

type Rules = { minYears: number; nationalOf: string; goods: string; vehicle: string; window: string; keep: string; service: string };

/* Returning-national concessions: answer three questions, see what you qualify for. */
export function EligibilityChecker({ country, rules }: { country: string; rules: Rules }) {
  const [national, setNational] = useState<"" | "yes" | "no">("");
  const [years, setYears] = useState("");
  const [permanent, setPermanent] = useState<"" | "yes" | "no">("");
  const y = Number(years);
  const answered = national && years !== "" && permanent;
  const ok = national === "yes" && y >= rules.minYears && permanent === "yes";
  const btn = (on: boolean) => `h-10 flex-1 rounded-full text-sm font-semibold ${on ? "bg-deep text-white" : "bg-sunken text-ink"}`;
  return (
    <div className="mt-3 rounded-xl bg-sunken p-4">
      <p className="text-sm font-semibold text-ink">Are you a national of {rules.nationalOf}?</p>
      <div className="mt-2 flex gap-2"><button type="button" className={btn(national === "yes")} onClick={() => setNational("yes")}>Yes</button><button type="button" className={btn(national === "no")} onClick={() => setNational("no")}>No</button></div>
      <label className="mt-4 block text-sm font-semibold text-ink">How many years have you lived abroad{country === "gd" ? " continuously" : ""}?
        <input type="number" min={0} max={80} inputMode="numeric" value={years} onChange={(e) => setYears(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-line bg-raised px-3 text-base" /></label>
      <p className="mt-4 text-sm font-semibold text-ink">Are you returning to live here permanently?</p>
      <div className="mt-2 flex gap-2"><button type="button" className={btn(permanent === "yes")} onClick={() => setPermanent("yes")}>Yes</button><button type="button" className={btn(permanent === "no")} onClick={() => setPermanent("no")}>No</button></div>
      {answered && (
        ok ? (
          <div className="mt-4 rounded-xl bg-success/10 p-4">
            <p className="flex items-center gap-2 font-semibold text-success"><CheckCircle2 className="h-5 w-5" aria-hidden="true" />You appear to qualify</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
              <li>{rules.goods}</li><li>{rules.vehicle}</li><li>{rules.window}</li><li>{rules.keep}</li>
            </ul>
            <Link href={`/${country}/gateway/apply/${rules.service}`} className="mt-3 inline-flex h-11 items-center rounded-full bg-primary px-5 font-semibold text-primary-ink">Apply now</Link>
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-raised p-4 ring-1 ring-line/60">
            <p className="flex items-center gap-2 font-semibold text-ink"><XCircle className="h-5 w-5 text-danger" aria-hidden="true" />You may not qualify for the concessions</p>
            <p className="mt-1 text-sm">
              {national === "no" ? `The programme is for nationals of ${rules.nationalOf}.` : y < rules.minYears ? `It needs at least ${rules.minYears} years abroad.` : "It is for people returning to live permanently."}
              {" "}You can still use the rest of this journey, and ask the agency if your situation is unusual.
            </p>
          </div>
        )
      )}
      <p className="mt-3 text-xs">A guide only. The agency makes the decision on your application.</p>
    </div>
  );
}
