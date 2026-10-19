import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./supabase/env";

/*
 * Phone notifications (Web Push) for people who installed Island Connect on their
 * home screen and switched notifications on. Server-only. Needs:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY   public, shared with browsers
 *   VAPID_PRIVATE_KEY              secret
 *   SUPABASE_SECRET_KEY            secret, to look up other people's devices
 * Missing keys simply mean no notifications; email alerts carry on as before.
 */
export function pushConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.SUPABASE_SECRET_KEY && SUPABASE_URL);
}

export async function pushToUsers(userIds: string[], message: { title: string; body: string; url: string; tag?: string }) {
  if (!pushConfigured() || !userIds.length) return;
  try {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:hello@islandconnect.cc", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
    const db = createClient(SUPABASE_URL, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: subs } = await db.from("push_subscriptions").select("id, endpoint, p256dh, auth").in("user_id", [...new Set(userIds)]);
    const payload = JSON.stringify(message);
    await Promise.all(
      (subs ?? []).map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 24 });
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) await db.from("push_subscriptions").delete().eq("id", s.id); // device gone
          else console.error("Push failed:", code);
        }
      }),
    );
  } catch (e) {
    console.error("Push error:", e);
  }
}
