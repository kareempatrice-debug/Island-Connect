import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
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
  description: "Find and contact local businesses, services and experiences in Grenada and St. Vincent and the Grenadines.",
  applicationName: "Island Connect",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#063E44",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
