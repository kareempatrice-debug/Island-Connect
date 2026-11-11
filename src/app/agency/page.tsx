import Link from "next/link";
import { FileText } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { serviceBySlug } from "@/data/gateway";
import { STATUS_LABEL } from "@/lib/gateway-notify";
import { supabaseForRequest } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function AgencyHome({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const sp = await searchParams;
  const viewer = (await getViewer())!;
  const supabase = await supabaseForRequest();
  const { data: mine } = await supabase.from("agency_members").select("agency_id, agencies ( name )").eq("user_id", viewer.id);
  const ids = (mine ?? []).map((m) => m.agency_id);
  let q = supabase.from("gateway_requests").select("id, reference, service_slug, kind, status, details, created_at, updated_at, agencies ( name )").order("updated_at", { ascending: false }).limit(100);
  if (ids.length) q = q.in("agency_id", ids);
  const open = sp.show !== "all";
  if (open) q = q.not("status", "in", "(approved,declined,closed)");
  const { data } = await q;
  const rows = (data ?? []) as any[];
  const names = (mine ?? []).map((m: any) => m.agencies?.name).filter(Boolean);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold">Requests</h1>
        <p className="mt-1 text-sm">{names.length ? names.join(" · ") : "All agencies (Island Connect team view)"}. Requests from people at home and abroad, sent through Island Connect’s Gateway.</p>
      </div>
      <div className="flex gap-2 text-sm font-semibold">
        <Link href="/agency" className={`rounded-full px-4 py-2 ${open ? "bg-deep text-white" : "bg-sunken text-ink"}`}>Open</Link>
        <Link href="/agency?show=all" className={`rounded-full px-4 py-2 ${!open ? "bg-deep text-white" : "bg-sunken text-ink"}`}>All</Link>
      </div>
      {!rows.length ? <p className="rounded-2xl bg-raised p-5 ring-1 ring-line/60">No {open ? "open " : ""}requests.</p> : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-raised ring-1 ring-line/60">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/agency/requests/${r.id}`} className="flex items-center gap-3 px-4 py-3">
                <FileText className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{serviceBySlug(r.service_slug)?.title ?? r.service_slug}</span>
                  <span className="block text-sm">{r.reference} · {r.details?.full_name ?? ""}{!ids.length ? ` · ${r.agencies?.name}` : ""}</span>
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${r.status === "submitted" ? "bg-gold/25 text-ink" : "bg-sunken text-ink"}`}>{r.status === "submitted" ? "New" : STATUS_LABEL[r.status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
