import { NextResponse } from "next/server";

/*
 * Digital Asset Links: proves to Android that the Island Connect app in Google Play and
 * islandconnect.cc belong together, so the app opens full screen with no browser bar.
 * Set in Netlify:
 *   ANDROID_PACKAGE_NAME       e.g. cc.islandconnect.app (the package name you choose in PWABuilder)
 *   ANDROID_SHA256_FINGERPRINTS one or more SHA-256 certificate fingerprints, comma-separated
 *                               (Play Console → Test and release → App integrity → App signing)
 */
export const dynamic = "force-dynamic";

export function GET() {
  const pkg = process.env.ANDROID_PACKAGE_NAME || "cc.islandconnect.app";
  const prints = (process.env.ANDROID_SHA256_FINGERPRINTS ?? "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  const body = prints.length
    ? [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: pkg, sha256_cert_fingerprints: prints } }]
    : [];
  return NextResponse.json(body, { headers: { "cache-control": "public, max-age=300" } });
}
