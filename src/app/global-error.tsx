"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/* Last-resort error page: reports the problem and offers a way back. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "48px 24px", maxWidth: 520, margin: "0 auto", color: "#172B32" }}>
        <h1 style={{ fontSize: 28 }}>Something went wrong</h1>
        <p>We’ve been told about it and are looking into it. Please try again.</p>
        <p style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button onClick={reset} style={{ height: 44, padding: "0 20px", borderRadius: 999, border: 0, background: "#07565A", color: "#fff", fontWeight: 600 }}>Try again</button>
          {/* A plain link on purpose: after a crash, a full page load is the safest way home. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/?choose=1" style={{ height: 44, display: "inline-flex", alignItems: "center", padding: "0 20px", borderRadius: 999, border: "1px solid #ccd", color: "#172B32", fontWeight: 600, textDecoration: "none" }}>Home</a>
        </p>
      </body>
    </html>
  );
}
