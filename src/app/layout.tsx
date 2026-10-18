import type { Metadata, Viewport } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import "./globals.css";

/*
 * Manrope for headings: confident and geometric. DM Sans for interface and body
 * text: clear at small sizes on phones.
 */
const display = Manrope({ subsets: ["latin"], variable: "--font-display", weight: ["600", "700", "800"] });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700"] });

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
