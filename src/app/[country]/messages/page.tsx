import type { Metadata } from "next";
import Link from "next/link";
import { NeedsDatabase } from "@/components/demo-notice";
import { Container } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/data";
import { supabaseForRequest } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Messages", robots: { index: false } };

export default async function Messages({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  if (!isSupabaseConfigured) return <Container className="max-w-xl py-12"><NeedsDatabase feature="Messages" /></Container>;
  const viewer = await requireViewer(`/${country}/messages`, country);
  const supabase = await supabaseForRequest();
  const { data: rows } = await supabase
    .from("enquiries")
    .select("id, subject, status, last_message_at, businesses ( name )")
    .eq("customer_id", viewer.id)
    .order("last_message_at", { ascending: false });
  return (
    <Container className="max-w-2xl py-10 sm:py-14">
      <h1 className="text-4xl font-semibold">Messages</h1>
      <p className="mt-2">Your conversations with businesses. Businesses reply from their dashboard.</p>
      {rows?.length ? (
        <ul className="mt-8 divide-y divide-line rounded-panel bg-raised ring-1 ring-line/60">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {rows.map((r: any) => (
            <li key={r.id}>
              <Link href={`/${country}/messages/${r.id}`} className="flex items-center justify-between gap-4 p-5 hover:bg-sunken/50">
                <span><span className="block font-semibold text-ink">{r.businesses?.name}</span><span className="block text-sm">{r.subject}</span></span>
                <span className="shrink-0 text-sm">{new Date(r.last_message_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded-panel border border-dashed border-line p-6 text-center">No messages yet. Tap “Message in the app” on any business page.</p>
      )}
    </Container>
  );
}
