import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { supabaseForRequest } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Agencies" };
export const dynamic = "force-dynamic";

async function saveAgency(form: FormData) {
  "use server";
  await requireAdmin();
  const supabase = await supabaseForRequest();
  const v = (k: string) => String(form.get(k) ?? "").trim().slice(0, 300) || null;
  const { error } = await supabase.from("agencies").update({ email: v("email"), phone: v("phone"), website: v("website"), address: v("address"), active: form.get("active") === "on" }).eq("id", String(form.get("id")));
  revalidatePath("/admin/agencies");
  redirect(`/admin/agencies?${error ? `error=${encodeURIComponent(error.message)}` : "done=1"}`);
}

async function staff(form: FormData) {
  "use server";
  await requireAdmin();
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("admin_set_agency_member", { p_agency: String(form.get("id")), p_email: String(form.get("email") ?? ""), p_add: form.get("op") !== "remove" });
  revalidatePath("/admin/agencies");
  redirect(`/admin/agencies?${error ? `error=${encodeURIComponent(error.message)}` : "done=1"}`);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function Agencies({ searchParams }: { searchParams: Promise<{ error?: string; done?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const supabase = await supabaseForRequest();
  const [{ data: agencies }, { data: open }] = await Promise.all([
    supabase.from("agencies").select("id, country_code, slug, name, email, phone, website, address, active, agency_members ( user_id )").order("country_code", { ascending: false }).order("name"),
    supabase.from("gateway_requests").select("agency_id").not("status", "in", "(approved,declined,closed)"),
  ]);
  const openCount = new Map<string, number>();
  for (const r of open ?? []) openCount.set(r.agency_id, (openCount.get(r.agency_id) ?? 0) + 1);
  const input = "h-10 rounded-lg border border-line bg-raised px-2 text-sm";
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold">Agencies</h1>
        <p className="mt-1 text-sm">Gateway requests go to each agency’s staff and contact email. Agencies with neither come to you: open them in the <Link href="/agency" className="font-semibold text-link underline">agency portal</Link> to pass them on or reply on their behalf.</p>
      </div>
      {sp.error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{sp.error}</p>}
      {sp.done && <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm font-semibold text-success">Saved.</p>}
      <ul className="space-y-3">
        {(agencies ?? []).map((a: any) => (
          <li key={a.id} className="rounded-2xl bg-raised p-4 ring-1 ring-line/60">
            <p className="font-semibold text-ink">{a.country_code === "vc" ? "SVG" : "Grenada"} · {a.name}
              <span className="ml-2 text-sm font-normal text-muted">{a.agency_members?.length ?? 0} staff · {openCount.get(a.id) ?? 0} open requests{!a.email && !(a.agency_members?.length) ? " · requests come to you" : ""}</span></p>
            <form action={saveAgency} className="mt-3 grid gap-2 sm:grid-cols-2">
              <input type="hidden" name="id" value={a.id} />
              <input name="email" type="email" defaultValue={a.email ?? ""} placeholder="Contact email for requests" className={input} />
              <input name="phone" defaultValue={a.phone ?? ""} placeholder="Phone" className={input} />
              <input name="website" defaultValue={a.website ?? ""} placeholder="Website" className={input} />
              <input name="address" defaultValue={a.address ?? ""} placeholder="Address" className={input} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={a.active} className="h-4 w-4" />Shown in Gateway</label>
              <button className="h-10 rounded-full bg-primary px-4 text-sm font-semibold text-primary-ink sm:justify-self-end">Save</button>
            </form>
            <form action={staff} className="mt-2 flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={a.id} />
              <input name="email" type="email" required placeholder="Staff member’s Island Connect email" className={`${input} min-w-0 flex-1`} />
              <button name="op" value="add" className="h-10 rounded-full border border-line px-4 text-sm font-semibold text-ink">Add staff</button>
              <button name="op" value="remove" className="h-10 rounded-full border border-line px-4 text-sm font-semibold text-danger">Remove</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
