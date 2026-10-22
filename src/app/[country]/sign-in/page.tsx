import { redirect } from "next/navigation";

// Personal or search-driven: always built fresh for each visitor, never shared.
export const dynamic = "force-dynamic";


/* Joining and signing in now live at /join, reached from the welcome page. */
export default async function SignIn({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  redirect(`/join?mode=sign-in${sp.next ? `&next=${encodeURIComponent(sp.next)}` : ""}`);
}
