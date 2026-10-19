import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteServiceAction } from "./actions";
import { NeedsDatabase } from "@/components/demo-notice";
import { AddServiceForm, HoursForm, ProfileForm } from "@/components/forms/dashboard-forms";
import { PushSetup } from "@/components/push-setup";
import { PhotosManager } from "@/components/forms/photos-manager";
import { TripsTab } from "./trips-tab";
import { Container } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/data";
import { formatPhone, priceLabel } from "@/lib/format";
import { supabaseForRequest } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Business dashboard", robots: { index: false } };

const TABS = [["overview", "Overview"], ["enquiries", "Enquiries"], ["profile", "Profile"], ["photos", "Photos"], ["trips", "Trips"], ["services", "Services"], ["hours", "Hours"]] as const;
const CHANNELS: Record<string, string> = { whatsapp: "WhatsApp", phone: "Calls", email: "Emails", website: "Website visits", booking: "Booking page", maps: "Directions" };

export default async function Dashboard({
  params,
  searchParams,
}: {
  params: Promise<{ country: string; slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [{ country, slug }, sp] = await Promise.all([params, searchParams]);
  if (!isSupabaseConfigured) return <Container className="max-w-xl py-12"><NeedsDatabase feature="The business dashboard" /></Container>;
  const viewer = await requireViewer(`/${country}/dashboard/${slug}`, country);
  const supabase = await supabaseForRequest();
  const { data: b } = await supabase
    .from("businesses")
    .select("id, slug, name, tagline, description, phone_e164, whatsapp_e164, email, website, cancellation_policy, contact_preference, external_booking_url, payment_methods, listing_status, review_note, logo_path, cover_path, gallery_paths, business_members!inner ( user_id, role )")
    .eq("slug", slug)
    .eq("business_members.user_id", viewer.id)
    .maybeSingle();
  if (!b) notFound();
  const tab = TABS.some(([t]) => t === sp.tab) ? sp.tab! : "overview";
  const ids = { country, businessId: b.id as string, slug };
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [{ data: clicks }, { data: enquiries }, { data: services }, { data: hours }] = await Promise.all([
    supabase.from("contact_clicks").select("channel").eq("business_id", b.id).gte("created_at", since),
    supabase.from("enquiries").select("id, subject, status, last_message_at, created_at").eq("business_id", b.id).order("last_message_at", { ascending: false }).limit(50),
    supabase.from("services").select("id, name, description, price_min, price_max, currency_code, price_unit, duration_minutes").eq("business_id", b.id).order("sort_order"),
    supabase.from("opening_hours").select("weekday, opens, closes").eq("business_id", b.id),
  ]);
  const byChannel = (clicks ?? []).reduce<Record<string, number>>((a, c) => ((a[c.channel] = (a[c.channel] ?? 0) + 1), a), {});
  const newEnquiries = (enquiries ?? []).filter((e) => e.status === "new").length;
  const card = "rounded-2xl bg-raised p-5 ring-1 ring-line/60";

  return (
    <Container className="max-w-4xl py-8 sm:py-12">
      <Link href={`/${country}/account`} className="text-sm font-semibold text-link hover:underline">Your account</Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-semibold sm:text-4xl">{b.name}</h1>
        {b.listing_status === "published" && <Link href={`/${country}/business/${slug}`} className="font-semibold text-link hover:underline">View your listing</Link>}
      </div>
      {b.listing_status === "pending_review" && <p className="mt-3 rounded-xl bg-gold/15 px-4 py-3 text-sm text-ink">Your listing is awaiting review. You can set it up now; it goes live once approved.</p>}
      {b.listing_status === "draft" && <p className="mt-3 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">Not approved{b.review_note ? `: ${b.review_note}` : "."}</p>}

      <nav aria-label="Dashboard" className="rail -mx-5 mt-6 flex gap-1 overflow-x-auto border-b border-line px-5 sm:mx-0 sm:px-0">
        {TABS.map(([t, l]) => (
          <Link key={t} href={`?tab=${t}`} aria-current={tab === t ? "page" : undefined}
            className={`shrink-0 border-b-2 px-3 py-3 text-[0.95rem] font-medium ${tab === t ? "border-gold text-ink" : "border-transparent text-muted hover:text-ink"}`}>
            {l}{t === "enquiries" && newEnquiries > 0 && <span className="ml-1.5 rounded-full bg-coral px-1.5 text-xs text-white">{newEnquiries}</span>}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        {tab === "enquiries" && <div className="mb-6"><PushSetup what="new enquiries" /></div>}
        {tab === "trips" && (
          <TripsTab ids={{ businessId: b.id as string, country, slug }} sp={sp}
            isOwner={(b as { business_members: { role: string }[] }).business_members.some((m) => m.role === "owner")} />
        )}
        {tab === "photos" && (
          (b as { business_members: { role: string }[] }).business_members.some((m) => m.role === "owner") ? (
            <PhotosManager country={country} slug={slug} businessId={b.id as string} logoPath={(b.logo_path as string) ?? null}
              coverPath={(b.cover_path as string) ?? null} gallery={((b.gallery_paths as string[]) ?? [])} />
          ) : (
            <p className="rounded-xl bg-sunken px-4 py-3">Only the business’s owner can change its photos.</p>
          )
        )}
        {tab === "overview" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Customers sent to you in the last 30 days</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className={card}><p className="text-sm">Enquiries</p><p className="font-display text-3xl font-semibold text-ink">{(enquiries ?? []).filter((e) => e.created_at >= since).length}</p></div>
              {Object.entries(CHANNELS).map(([k, l]) => (
                <div key={k} className={card}><p className="text-sm">{l}</p><p className="font-display text-3xl font-semibold text-ink">{byChannel[k] ?? 0}</p></div>
              ))}
            </div>
            <p className="text-sm">Counts are taps on your contact buttons on Island Connect. No personal details are recorded.</p>
          </div>
        )}

        {tab === "enquiries" && (
          enquiries?.length ? (
            <ul className="divide-y divide-line rounded-panel bg-raised ring-1 ring-line/60">
              {enquiries.map((e) => (
                <li key={e.id}>
                  <Link href={`/${country}/messages/${e.id}`} className="flex items-center justify-between gap-4 p-5 hover:bg-sunken/50">
                    <span className="font-semibold text-ink">{e.subject}</span>
                    <span className="flex shrink-0 items-center gap-3 text-sm">
                      {e.status === "new" && <span className="rounded-full bg-coral px-2 py-0.5 text-xs font-semibold text-white">New</span>}
                      {e.status === "closed" && <span>Done</span>}
                      {new Date(e.last_message_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="rounded-panel border border-dashed border-line p-6 text-center">No enquiries yet. They appear here when customers message you through your listing.</p>
        )}

        {tab === "profile" && (
          <ProfileForm ids={ids} values={{
            tagline: b.tagline ?? "", description: b.description ?? "", phone: b.phone_e164 ? formatPhone(b.phone_e164) : "",
            whatsapp: b.whatsapp_e164 ? formatPhone(b.whatsapp_e164) : "", email: b.email ?? "", website: b.website ?? "",
            cancellationPolicy: b.cancellation_policy ?? "", contactPreference: b.contact_preference, externalBookingUrl: b.external_booking_url ?? "",
            paymentMethods: b.payment_methods ?? [],
          }} />
        )}

        {tab === "services" && (
          <div className="space-y-4">
            {services?.length ? (
              <ul className="divide-y divide-line rounded-panel bg-raised ring-1 ring-line/60">
                {services.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-4 p-4">
                    <span>
                      <span className="block font-semibold text-ink">{s.name}</span>
                      <span className="block text-sm">{priceLabel({ priceMin: s.price_min == null ? null : Number(s.price_min), priceMax: s.price_max == null ? null : Number(s.price_max), currency: s.currency_code, priceUnit: s.price_unit })}{s.duration_minutes ? ` · ${s.duration_minutes} min` : ""}</span>
                    </span>
                    <form action={deleteServiceAction}>
                      <input type="hidden" name="country" value={country} /><input type="hidden" name="businessId" value={b.id} />
                      <input type="hidden" name="slug" value={slug} /><input type="hidden" name="serviceId" value={s.id} />
                      <button className="text-sm font-semibold text-danger hover:underline">Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : <p>No services yet. Add what you offer and, if you like, a starting price.</p>}
            <AddServiceForm ids={ids} />
          </div>
        )}

        {tab === "hours" && <HoursForm ids={ids} hours={(hours ?? []).map((h) => ({ weekday: h.weekday, opens: h.opens.slice(0, 5), closes: h.closes.slice(0, 5) }))} />}
      </div>
    </Container>
  );
}
