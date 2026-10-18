import type { Metadata } from "next";
import Link from "next/link";
import { photos } from "@/data/photos";

export const metadata: Metadata = { title: "Photo credits" };

export default function Credits() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <Link href="/?choose=1" className="text-sm font-semibold text-link hover:underline">
        Island Connect
      </Link>
      <h1 className="mt-3 text-4xl font-semibold">Photo credits</h1>
      <p className="mt-3 text-lg">
        Destination photographs are supplied by Island Connect or used under Creative Commons licences. They show places, not the businesses listed on
        Island Connect.
      </p>
      <ul className="mt-8 divide-y divide-line rounded-panel bg-raised ring-1 ring-line/60">
        {Object.values(photos).map((p) => (
          <li key={p.key} className="p-5">
            <p className="font-semibold text-ink">{p.place}</p>
            {p.licenseUrl ? (
              <p className="mt-1 text-sm">
                Photo by {p.author}, licensed under{" "}
                <a href={p.licenseUrl} className="text-link underline" target="_blank" rel="noopener noreferrer">
                  {p.license}
                </a>
                . Resized and cropped.{" "}
                {p.source && (
                  <a href={p.source} className="text-link underline" target="_blank" rel="noopener noreferrer">
                    Original on Wikimedia Commons
                  </a>
                )}
              </p>
            ) : (
              <p className="mt-1 text-sm">{p.license}.</p>
            )}
          </li>
        ))}
      </ul>
      <h2 className="mt-12 text-2xl font-semibold">Map data</h2>
      <p className="mt-2">
        Island outlines on the ride map are simplified from{" "}
        <a href="https://www.openstreetmap.org/copyright" className="text-link underline" target="_blank" rel="noopener noreferrer">
          OpenStreetMap
        </a>{" "}
        data, © OpenStreetMap contributors, available under the Open Database Licence.
      </p>
    </main>
  );
}
