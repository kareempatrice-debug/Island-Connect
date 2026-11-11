"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getViewer } from "@/lib/auth";
import { supabaseForRequest } from "@/lib/supabase/server";
import { journeyBySlug, serviceBySlug } from "@/data/gateway";
import { notifyAgencyOfRequest, notifyRequestUpdate } from "@/lib/gateway-notify";

/* Tick a journey step done (or not). */
export async function toggleStepAction(input: { country: string; journey: string; step: string; done: boolean }) {
  const viewer = await getViewer();
  if (!viewer) return { error: "Sign in to save your progress." };
  const j = journeyBySlug(input.country, input.journey);
  if (!j || !j.steps.some((s) => s.id === input.step)) return { error: "Unknown step." };
  const supabase = await supabaseForRequest();
  const { error } = input.done
    ? await supabase.from("journey_progress").upsert({ user_id: viewer.id, country_code: input.country, journey: input.journey, step: input.step, done: true, updated_at: new Date().toISOString() })
    : await supabase.from("journey_progress").delete().match({ user_id: viewer.id, country_code: input.country, journey: input.journey, step: input.step });
  if (error) return { error: error.message };
  revalidatePath(`/${input.country}/gateway`, "layout");
  return { ok: true };
}

/* Send an application, appointment request or question to an agency. */
export async function submitGatewayRequestAction(_: unknown, form: FormData): Promise<{ error?: string }> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Please sign in first." };
  const svc = serviceBySlug(String(form.get("service")));
  if (!svc) return { error: "Unknown service." };
  const details: Record<string, string> = {};
  for (const f of svc.fields) {
    const v = String(form.get(f.name) ?? "").trim().slice(0, f.type === "textarea" ? 2000 : 200);
    if (f.required && !v) return { error: `Please fill in “${f.label}”.` };
    if (v) details[f.name] = v;
  }
  let documents: string[] = [];
  try { documents = (JSON.parse(String(form.get("documents") ?? "[]")) as string[]).filter((p) => typeof p === "string" && p.startsWith(`${viewer.id}/`)).slice(0, 12); } catch { documents = []; }
  if (svc.kind === "application" && svc.documents.length && !documents.length) return { error: "Please add your documents before sending." };
  const supabase = await supabaseForRequest();
  const { data, error } = await supabase.rpc("submit_gateway_request", { p: { agency: svc.agency, service: svc.slug, kind: svc.kind, details, documents } });
  if (error) return { error: error.message };
  const id = (data as { id: string }).id;
  after(() => notifyAgencyOfRequest(id).catch((e) => console.error(e)));
  redirect(`/${svc.country}/gateway/requests/${id}?sent=1`);
}

/* A message on a request, from the person or the agency. */
export async function gatewayMessageAction(input: { requestId: string; body: string; documents?: string[]; fromAgency: boolean }) {
  const d = z.object({ requestId: z.string().uuid(), body: z.string().trim().min(1).max(4000), documents: z.array(z.string().max(300)).max(10).optional(), fromAgency: z.boolean() }).safeParse(input);
  if (!d.success) return { error: "Write a message first." };
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("add_gateway_message", { p_request: d.data.requestId, p_body: d.data.body, p_documents: d.data.documents ?? [] });
  if (error) return { error: error.message };
  after(() => notifyRequestUpdate(d.data.requestId, d.data.fromAgency, d.data.body).catch((e) => console.error(e)));
  revalidatePath("/[country]/gateway/requests/[id]", "page");
  revalidatePath("/agency/requests/[id]", "page");
  return { ok: true };
}

/* The agency changes the status, and can confirm an appointment time. */
export async function agencyStatusAction(form: FormData) {
  const id = String(form.get("id"));
  const status = String(form.get("status"));
  const at = String(form.get("appointment") ?? "");
  const supabase = await supabaseForRequest();
  const appointment = at ? new Date(`${at}:00-04:00`).toISOString() : null;
  const { error } = await supabase.rpc("agency_update_request", { p_request: id, p_status: status, p_appointment: appointment });
  if (!error) {
    const labels: Record<string, string> = { received: "Your request has been received.", in_review: "Your request is being reviewed.", needs_info: "The agency needs more information. Please see the messages.", approved: "Your request has been approved.", declined: "Your request has been declined. Please see the messages.", closed: "Your request has been closed." };
    const text = appointment ? `Your appointment is confirmed for ${new Date(appointment).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "America/Grenada" })}.` : labels[status] ?? "Your request has been updated.";
    after(() => notifyRequestUpdate(id, true, text).catch((e) => console.error(e)));
  }
  revalidatePath(`/agency/requests/${id}`);
  redirect(`/agency/requests/${id}${error ? `?error=${encodeURIComponent(error.message)}` : "?done=1"}`);
}
