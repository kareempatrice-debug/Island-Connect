"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/app/auth-actions";
import { getViewer } from "@/lib/auth";
import { supabaseForRequest } from "@/lib/supabase/server";

const start = z.object({
  country: z.string().regex(/^[a-z]{2}$/),
  businessId: z.string().uuid(),
  subject: z.string().trim().min(2, "Add a short subject").max(120),
  serviceId: z.union([z.string().uuid(), z.literal("")]),
  preferredDate: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")]),
  body: z.string().trim().min(10, "Tell the business a little more about what you need").max(4000),
});

export async function startEnquiryAction(_: FormState, form: FormData): Promise<FormState> {
  if (!(await getViewer())) return { error: "Please sign in again." };
  const parsed = start.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const supabase = await supabaseForRequest();
  const { data, error } = await supabase.rpc("start_enquiry", {
    p_business: d.businessId,
    p_subject: d.subject,
    p_body: d.body,
    p_service: d.serviceId || null,
    p_date: d.preferredDate || null,
  });
  if (error) return { error: error.message };
  redirect(`/${d.country}/messages/${data}`);
}

const reply = z.object({ enquiryId: z.string().uuid(), country: z.string().regex(/^[a-z]{2}$/), body: z.string().trim().min(1).max(4000) });

export async function replyAction(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Please sign in again." };
  const parsed = reply.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Write a message first." };
  const supabase = await supabaseForRequest();
  const { error } = await supabase.from("enquiry_messages").insert({ enquiry_id: parsed.data.enquiryId, sender_id: viewer.id, body: parsed.data.body });
  if (error) return { error: "Your message couldn’t be sent." };
  revalidatePath(`/${parsed.data.country}/messages/${parsed.data.enquiryId}`);
  return { message: "sent" };
}

export async function setEnquiryStatusAction(form: FormData) {
  const d = z.object({ enquiryId: z.string().uuid(), country: z.string(), status: z.enum(["open", "closed"]) }).parse(Object.fromEntries(form));
  const supabase = await supabaseForRequest();
  await supabase.from("enquiries").update({ status: d.status }).eq("id", d.enquiryId);
  revalidatePath(`/${d.country}/messages/${d.enquiryId}`);
}
