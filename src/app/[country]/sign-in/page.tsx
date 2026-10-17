import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NeedsDatabase } from "@/components/demo-notice";
import { AuthForm } from "@/components/forms/auth-form";
import { Container } from "@/components/ui";
import { getViewer, safeNext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/data";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function SignIn({
  params,
  searchParams,
}: {
  params: Promise<{ country: string }>;
  searchParams: Promise<{ next?: string; mode?: string; error?: string }>;
}) {
  const [{ country }, sp] = await Promise.all([params, searchParams]);
  const next = safeNext(sp.next, `/${country}/account`);
  if (await getViewer()) redirect(next);
  return (
    <Container className="max-w-md py-12">
      <h1 className="text-4xl font-semibold">Welcome</h1>
      <p className="mt-2">Sign in or create an account to register a business, claim a listing or book.</p>
      {sp.error === "link" && <p role="alert" className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">That link has expired or was already used. Request a new one.</p>}
      <div className="mt-8">{isSupabaseConfigured ? <AuthForm next={next} initial={sp.mode === "sign-up" ? "sign-up" : "sign-in"} /> : <NeedsDatabase feature="Signing in" />}</div>
    </Container>
  );
}
