"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/* Re-loads the page's data every few seconds while it's open, so new chat messages appear. */
export function AutoRefresh({ seconds = 10 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === "visible" && router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
