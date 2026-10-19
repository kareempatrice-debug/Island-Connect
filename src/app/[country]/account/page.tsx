import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3, ShieldCheck, Store, XCircle } from "lucide-react";
import { signOutAction } from "@/app/auth-actions";
import { NeedsDatabase } from "@/components/demo-notice";
import { DeleteAccountForm } from "@/components/forms/account-forms";
import { Container, btn } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/data";
import { supabaseForRequest } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

const STATUS: Record<string, { label: string; Icon: typeof Clock3; cls: string }> = {
  pending_review: { label: "Awaiting review", Icon: Clock3, cls: "text-[#8A5A00] dark:text-gold" },
  published: { label: "Live", Icon: CheckCircle2, cls: "text-success" },
  draft: { label: "Not approved", Icon: XCircle, cls: "text-danger" },
  suspended: { label: "Suspended", Icon: XCircle, cls: "text-danger" },
  pending: { label: "Awaiting review", Icon: Clock3, cls: "text-[#8A5A00] dark:text-gold" },
  approved: { label: "Approved", Icon: CheckCircle2, cls: "text-success" },
  rejected: { label: "Not approved", Icon: XCircle, cls: "text-danger" },
};

export default async function Account({
  params,
  searchParams,
}: {
  params: Promise<{ country: string }>;
  searchParams: Promise<{ registered?: string; claimed?: string }>;
}) {
  const [{ country }, sp] = await Promise.all([params, searchParams]);
  if (!isSupabaseConfigured) return <Container className="max-w-2xl py-12"><NeedsDatabase feature="Accounts" /></Container>;
  const viewer = await requireViewer(`/${country}/account`, country);
  const supabase = await supabaseForRequest();
  const [{ data: memberships }, { data: claims }] = await Promise.all([
    supabase.from("business_members").select("role, businesses ( slug, name, listing_status, review_note )").eq("user_id", viewer.id),
    supabase.from("business_claims").select("id, status, review_note, created_at, businesses ( slug, name )").eq("user_id", viewer.id).order("created_at", { ascending: false }),
  ]);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const businesses = (memberships ?? []).map((m: any) => ({ role: m.role, ...m.businesses })).filter((b: any) => b.slug);
  const myClaims = (claims ?? []).map((c: any) => ({ ...c, business: c.businesses }));
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return (
    <Container className="max-w-3xl py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">Hello{viewer.name ? `, ${viewer.name.split(" ")[0]}` : ""}</h1>
          <p className="mt-1">{viewer.email}</p>
        </div>
        <form action={signOutAction}>
          <input type="hidden" name="next" value={`/${country}`} />
          <button className={btn.secondary}>Sign out</button>
        </form>
      </div>

      {sp.registered && <p role="status" className="mt-6 rounded-xl bg-success/10 px-4 py-3 font-medium text-success">Thanks. Your business has been sent for review; we’ll email you when it’s live.</p>}
      {sp.claimed && <p role="status" className="mt-6 rounded-xl bg-success/10 px-4 py-3 font-medium text-success">Thanks. We’ll contact you to confirm your claim.</p>}

      <Link href={`/${country}/trips`} className="mt-8 flex items-center justify-between rounded-2xl bg-raised p-4 font-semibold text-ink ring-1 ring-line/60 hover:ring-primary/40">
        Your trips and quotes <span aria-hidden="true">→</span>
      </Link>
      <Link href={`/${country}/messages`} className="mt-3 flex items-center justify-between rounded-2xl bg-raised p-4 font-semibold text-ink ring-1 ring-line/60 hover:ring-primary/40">
        Your messages to businesses <span aria-hidden="true">→</span>
      </Link>
      {viewer.role === "admin" && (
        <Link href="/admin" className="mt-3 flex items-center gap-3 rounded-2xl bg-deep p-4 font-semibold text-white">
          <ShieldCheck className="h-5 w-5 text-gold" aria-hidden="true" /> Open the admin panel
        </Link>
      )}

      <section className="mt-10" aria-labelledby="biz-heading">
        <div className="flex items-center justify-between gap-4">
          <h2 id="biz-heading" className="text-2xl font-semibold">Your businesses</h2>
          <Link href={`/${country}/for-business/register`} className="font-semibold text-link hover:underline">Register a business</Link>
        </div>
        {businesses.length ? (
          <ul className="mt-4 divide-y divide-line rounded-panel bg-raised ring-1 ring-line/60">
            {businesses.map((b) => {
              const s = STATUS[b.listing_status] ?? STATUS.pending_review;
              return (
                <li key={b.slug} className="flex flex-wrap items-center gap-3 p-5">
                  <Store className="h-5 w-5 text-muted" aria-hidden="true" />
                  <span className="flex-1">
                    <Link href={`/${country}/dashboard/${b.slug}`} className="font-semibold text-ink hover:underline">{b.name}</Link>
                    {b.review_note && <span className="mt-1 block text-sm">Note from Island Connect: {b.review_note}</span>}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${s.cls}`}><s.Icon className="h-4 w-4" aria-hidden="true" />{s.label}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3">You haven’t registered a business yet.</p>
        )}
      </section>

      {myClaims.length > 0 && (
        <section className="mt-10" aria-labelledby="claims-heading">
          <h2 id="claims-heading" className="text-2xl font-semibold">Your claims</h2>
          <ul className="mt-4 divide-y divide-line rounded-panel bg-raised ring-1 ring-line/60">
            {myClaims.map((c) => {
              const s = STATUS[c.status];
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-3 p-5">
                  <span className="flex-1 font-semibold text-ink">{c.business?.name}</span>
                  <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${s.cls}`}><s.Icon className="h-4 w-4" aria-hidden="true" />{s.label}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-12" aria-labelledby="settings-heading">
        <h2 id="settings-heading" className="text-2xl font-semibold">Account settings</h2>
        <div className="mt-4 space-y-3">
          <Link href="/join?mode=reset" className="flex items-center justify-between rounded-2xl bg-raised p-4 font-semibold text-ink ring-1 ring-line/60">Change my password <span aria-hidden="true">→</span></Link>
          <DeleteAccountForm />
        </div>
      </section>
    </Container>
  );
}
