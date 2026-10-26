import type { Metadata } from "next";
import { revalidatePath, revalidateTag } from "next/cache";
import { Star } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { supabaseForRequest } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Reviews" };
export const dynamic = "force-dynamic";

async function setStatus(form: FormData) {
  "use server";
  await requireAdmin();
  const supabase = await supabaseForRequest();
  await supabase.rpc("admin_set_review_status", { p_review: String(form.get("id")), p_status: form.get("status") === "hidden" ? "hidden" : "published" });
  revalidateTag("listings");
  revalidatePath("/admin/reviews");
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function Reviews() {
  await requireAdmin();
  const supabase = await supabaseForRequest();
  const { data } = await supabase.from("reviews").select("id, rating, comment, kind, status, created_at, businesses ( name )").order("created_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as any[];
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold">Reviews</h1>
        <p className="mt-1 text-sm">Every review comes from a real customer of that business. Hide any that break the rules (abuse, personal details, spam); hidden reviews stop counting towards the star rating.</p>
      </div>
      {!rows.length ? <p className="text-sm">No reviews yet.</p> : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className={`rounded-2xl bg-raised p-4 ring-1 ring-line/60 ${r.status === "hidden" ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1 font-semibold text-ink">
                  {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-gold text-gold" : "text-line"}`} aria-hidden="true" />)}
                  <span className="ml-2">{r.businesses?.name}</span>
                  <span className="ml-2 text-sm font-normal text-muted">{r.kind === "trip" ? "Ride" : "Service"} · {new Date(r.created_at).toLocaleDateString("en-GB")}</span>
                </p>
                <form action={setStatus}>
                  <input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value={r.status === "hidden" ? "published" : "hidden"} />
                  <button className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-ink">{r.status === "hidden" ? "Show again" : "Hide"}</button>
                </form>
              </div>
              {r.comment && <p className="mt-2 text-ink">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
