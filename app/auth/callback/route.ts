import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth";
import { supabaseForRequest } from "@/lib/supabase/server";

/* Completes email-link sign-in and confirmation, then returns the visitor to where they were. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNext(request.nextUrl.searchParams.get("next"), "/");
  if (code) {
    const supabase = await supabaseForRequest();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }
  return NextResponse.redirect(new URL("/gd/sign-in?error=link", request.url));
}
