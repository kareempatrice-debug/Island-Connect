import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { PageViewTracker } from "@/components/page-view-tracker";
import { isSupabaseConfigured } from "@/lib/data";
import "./globals.css";

/*
 * Manrope for headings: confident and geometric. DM Sans for interface and body
 * text: clear at small sizes on phones.
 */
// Fonts are bundled with the site (variable fonts, SIL Open Font Licence) so builds never
// depend on reaching Google Fonts, which is what made a Netlify deploy fail.
const display = localFont({ src: "../fonts/manrope-latin.woff2", variable: "--font-display", weight: "200 800", display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Arial", "sans-serif"] });
const body = localFont({ src: "../fonts/dm-sans-latin.woff2", variable: "--font-body", weight: "100 1000", display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Arial", "sans-serif"] });

// A mistyped site address must never take the whole site down, so fall back safely.
function safeSiteUrl(): URL {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: safeSiteUrl(),
  title: { default: "Island Connect", template: "%s · Island Connect" },
  description: "Find and contact local businesses, services and experiences in St. Vincent and the Grenadines and Grenada.",
  applicationName: "Island Connect",
  icons: { icon: [{ url: "/favicon-48.png", sizes: "48x48", type: "image/png" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }], apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // The bar colour follows the phone's light or dark setting.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#063E44" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1A1E" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <PageViewTracker enabled={isSupabaseConfigured} />
        {children}
      </body>
    </html>
  );
}
