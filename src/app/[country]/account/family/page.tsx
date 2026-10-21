import type { Metadata } from "next";
import Link from "next/link";
import { CirclePlus, ShieldCheck, UserRound } from "lucide-react";
import { addFamilyMemberAction, addTrustedContactAction, removeFamilyItemAction } from "@/app/family-actions";
import { NeedsDatabase } from "@/components/demo-notice";
import { Container } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/data";
import { CALLING_CODES } from "@/lib/phone";
import { supabaseForRequest } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Family and safety", robots: { index: false } };

const KIND: Record<string, string> = { adult: "Adult", senior: "Senior", teen: "Teenager" };
const field = "h-11 w-full min-w-0 rounded-xl border border-line bg-raised px-3 text-ink";

export default async function Family({ params, searchParams }: { params: Promise<{ country: string }>; searchParams: Promise<{ error?: string; done?: string; add?: string }> }) {
  const [{ country }, sp] = await Promise.all([params, searchParams]);
  if (!isSupabaseConfigured) return <Container className="max-w-xl py-12"><NeedsDatabase feature="Family profile" /></Container>;
  const viewer = await requireViewer(`/${country}/account/family`, country);
  const supabase = await supabaseForRequest();
  const [{ data: members }, { data: contacts }] = await Promise.all([
    supabase.from("family_members").select("id, name, kind, phone_e164").order("created_at"),
    supabase.from("trusted_contacts").select("id, name, phone_e164").order("created_at"),
  ]);
  const code = country === "vc" ? "+1784" : "+1473";
  const remove = (id: string, table: string) => (
    <form action={removeFamilyItemAction}><input type="hidden" name="id" value={id} /><input type="hidden" name="table" value={table} /><input type="hidden" name="country" value={country} />
      <button className="text-sm font-semibold text-muted underline">Remove</button></form>
  );
  const phoneFields = (
    <div className="flex gap-2">
      <select name="code" defaultValue={code} className={`${field} w-32 shrink-0`} aria-label="Country code">{CALLING_CODES.map((c) => <option key={c.code} value={c.code}>{c.code === "other" ? "Other" : c.code}</option>)}</select>
      <input name="phone" inputMode="tel" placeholder="Phone number" className={field} aria-label="Phone number" />
    </div>
  );
  return (
    <Container className="max-w-xl py-8">
      <Link href={`/${country}/ride`} className="text-sm font-semibold text-link">Ride</Link>
      <h1 className="mt-2 text-4xl font-bold">Family profile</h1>
      {sp.error && <p role="alert" className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{sp.error}</p>}

      <section className="mt-8" aria-labelledby="members-h">
        <h2 id="members-h" className="text-2xl font-bold">Members</h2>
        <p className="mt-1 text-sm">People you book rides for. Choose them under “For someone else” when you book, and their details fill in for you.</p>
        <ul className="mt-3 divide-y divide-line">
          <li className="py-3">
            <details open={sp.add === "member"}>
              <summary className="flex cursor-pointer list-none items-center gap-4">
                <CirclePlus className="h-6 w-6 text-ink" strokeWidth={1.6} aria-hidden="true" />
                <span><span className="block font-semibold text-ink">Add new member</span><span className="block text-sm">Teenagers, adults or seniors</span></span>
              </summary>
              <form action={addFamilyMemberAction} className="mt-4 space-y-3 pl-10">
                <input type="hidden" name="country" value={country} />
                <input name="name" required maxLength={80} placeholder="Their name" className={field} />
                <select name="kind" className={field} defaultValue="adult">
                  <option value="adult">Adult</option><option value="senior">Senior</option><option value="teen">Teenager (13 to 17)</option>
                </select>
                {phoneFields}
                <button className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-ink">Add member</button>
              </form>
            </details>
          </li>
          {(members ?? []).map((m) => (
            <li key={m.id} className="flex items-center gap-4 py-3">
              <UserRound className="h-6 w-6 text-ink" strokeWidth={1.6} aria-hidden="true" />
              <span className="flex-1"><span className="block font-semibold text-ink">{m.name}</span><span className="block text-sm">{KIND[m.kind]}</span></span>
              {remove(m.id, "family_members")}
            </li>
          ))}
          <li className="flex items-center gap-4 py-3">
            <UserRound className="h-6 w-6 text-ink" strokeWidth={1.6} aria-hidden="true" />
            <span><span className="block font-semibold text-ink">{viewer.name ?? "You"}</span><span className="block text-sm">Family organiser</span></span>
          </li>
        </ul>
        <p className="mt-3 rounded-xl bg-sunken px-4 py-3 text-sm">Teenagers ride on your account: you book, you get the updates, and the driver must confirm pick-up with the trip’s 4-digit PIN.</p>
      </section>

      <section id="trusted" className="mt-10 scroll-mt-24" aria-labelledby="trusted-h">
        <h2 id="trusted-h" className="text-2xl font-bold">Share trip location</h2>
        <p className="mt-1 text-sm">People you trust. From any booked trip, one tap sends them a private link to follow it.</p>
        {(contacts ?? []).length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center">
            <ShieldCheck className="h-10 w-10 text-primary" strokeWidth={1.4} aria-hidden="true" />
            <p className="font-semibold text-ink">You’re not sharing with any contacts yet</p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {(contacts ?? []).map((c) => (
              <li key={c.id} className="flex items-center gap-4 py-3">
                <ShieldCheck className="h-6 w-6 text-primary" strokeWidth={1.6} aria-hidden="true" />
                <span className="flex-1"><span className="block font-semibold text-ink">{c.name}</span><span className="block text-sm">{c.phone_e164}</span></span>
                {remove(c.id, "trusted_contacts")}
              </li>
            ))}
          </ul>
        )}
        <details className="mt-2" open={sp.add === "contact"}>
          <summary className="flex h-12 cursor-pointer list-none items-center justify-center rounded-2xl bg-deep font-semibold text-white">Add contact</summary>
          <form action={addTrustedContactAction} className="mt-4 space-y-3">
            <input type="hidden" name="country" value={country} />
            <input name="name" required maxLength={80} placeholder="Their name" className={field} />
            {phoneFields}
            <button className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-ink">Save contact</button>
          </form>
        </details>
      </section>
    </Container>
  );
}
