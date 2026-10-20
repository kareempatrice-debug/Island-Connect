"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

/*
 * Counts a page view for the admin dashboard: just the page address and the day.
 * No cookies, no identifiers, nothing about the visitor. Skips admin pages and automated browsers.
 */
export function PageViewTracker({ enabled }: { enabled: boolean }) {
  const path = usePathname();
  useEffect(() => {
    if (!enabled || !path || path.startsWith("/admin") || (navigator as Navigator & { webdriver?: boolean }).webdriver) return;
    supabaseBrowser().rpc("record_view", { p_path: path }).then(() => undefined, () => undefined);
  }, [enabled, path]);
  return null;
}
