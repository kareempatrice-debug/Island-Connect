import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Island Connect",
    short_name: "Island Connect",
    description: "People, places and services in St. Vincent and the Grenadines and Grenada.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // Android's opening screen: the icon on white, matching the iOS icon.
    background_color: "#FFFFFF",
    theme_color: "#063E44",
    // The full logo on white, the same as on iPhone. "maskable" versions have extra space so
    // Android can crop them to its own icon shape without cutting into the logo.
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
