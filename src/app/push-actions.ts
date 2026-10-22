"use server";

import { z } from "zod";
import { getViewer } from "@/lib/auth";
import { supabaseForRequest } from "@/lib/supabase/server";

const sub = z.object({ endpoint: z.string().url().startsWith("https://").max(1000), keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }) });

export async function savePushSubscriptionAction(input: unknown): Promise<{ ok?: boolean; error?: string }> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Sign in first." };
  const parsed = sub.safeParse(input);
  if (!parsed.success) return { error: "This device couldn’t be registered." };
  const supabase = await supabaseForRequest();
  // A device belongs to whoever is signed in on it now.
  await supabase.from("push_subscriptions").delete().eq("endpoint", parsed.data.endpoint);
  const { error } = await supabase.from("push_subscriptions").insert({ user_id: viewer.id, endpoint: parsed.data.endpoint, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth });
  return error ? { error: "This device couldn’t be registered." } : { ok: true };
}

export async function removePushSubscriptionAction(endpoint: string): Promise<void> {
  if (!(await getViewer())) return;
  const supabase = await supabaseForRequest();
  await supabase.from("push_subscriptions").delete().eq("endpoint", String(endpoint).slice(0, 1000));
}

/* Sends a test notification to all of this person's devices, so they can see it working. */
export async function sendTestPushAction(): Promise<{ ok?: boolean; error?: string }> {
  const { getViewer } = await import("@/lib/auth");
  const { pushConfigured, pushToUsers } = await import("@/lib/push");
  const viewer = await getViewer();
  if (!viewer) return { error: "Please sign in again." };
  if (!pushConfigured()) return { error: "Notifications aren’t switched on for the site yet." };
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  await pushToUsers([viewer.id], { title: "Notifications are working", body: "Ride updates, offers and messages will appear like this.", url: `${site}/?choose=1`, tag: "test" });
  return { ok: true };
}
