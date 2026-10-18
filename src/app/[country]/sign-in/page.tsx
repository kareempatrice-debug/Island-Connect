import { redirect } from "next/navigation";

/* Joining and signing in now live at /join, reached from the welcome page. */
export default async function SignIn({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  redirect(`/join?mode=sign-in${sp.next ? `&next=${encodeURIComponent(sp.next)}` : ""}`);
}
