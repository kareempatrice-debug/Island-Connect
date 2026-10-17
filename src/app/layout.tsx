import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";

/*
 * Bricolage Grotesque for headlines: a contemporary grotesque with enough
 * character to carry the brand. Figtree for everything else: clean, open
 * letterforms that stay readable at small sizes on phones.
 */
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const body = Figtree({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Island Connect", template: "%s · Island Connect" },
  description: "Find and contact local businesses, services and experiences in Grenada and St. Vincent and the Grenadines.",
  applicationName: "Island Connect",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#064F56",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
