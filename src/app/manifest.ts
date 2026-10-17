import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Island Connect",
    short_name: "Island Connect",
    description: "People, places and services in Grenada and St. Vincent and the Grenadines.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F4EF",
    theme_color: "#064F56",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
