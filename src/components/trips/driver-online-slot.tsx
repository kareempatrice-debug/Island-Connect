import { DriverOnline } from "./driver-online";
import { getViewer } from "@/lib/auth";
import { supabaseForRequest } from "@/lib/supabase/server";

/* Shows the Online switch only to approved taxi, airport and minivan drivers. */
export async function DriverOnlineSlot() {
  const viewer = await getViewer();
  if (!viewer) return null;
  const supabase = await supabaseForRequest();
  const { data } = await supabase.from("business_members").select("business_id, businesses ( operator_profiles ( status, kinds ) )").eq("user_id", viewer.id);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const mine = (data ?? []).find((m: any) => {
    const p = m.businesses?.operator_profiles; const op = Array.isArray(p) ? p[0] : p;
    return op?.status === "approved" && (op.kinds ?? []).some((k: string) => ["taxi", "airport", "group"].includes(k));
  });
  return mine ? <DriverOnline businessId={mine.business_id} /> : null;
}
