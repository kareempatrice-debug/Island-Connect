"use client";

import { useEffect } from "react";

/** Remembers the last country viewed so returning visitors skip the picker. */
export function RememberCountry({ code }: { code: string }) {
  useEffect(() => {
    document.cookie = `ic_country=${code}; path=/; max-age=31536000; samesite=lax`;
  }, [code]);
  return null;
}
