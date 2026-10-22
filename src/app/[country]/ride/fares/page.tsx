import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { fareTables } from "@/data/fares";
import { getCountry } from "@/lib/data";

// Served ready-made from Netlify and refreshed at most every 5 minutes (or straight away when a listing changes).
export const revalidate = 300;


export const metadata: Metadata = { title: "Official taxi fares" };

export default async function Fares({ params }: { params: Promise<{ country: string }> }) {
  const { country: code } = await params;
  const country = (await getCountry(code))!;
  // Main island first, then Carriacou.
  const tables = fareTables.filter((t) => t.country === code).sort((a, b) => Number(Boolean(a.island)) - Number(Boolean(b.island)));
  return (
    <main>
      <section className="bg-deep">
        <Container className="pb-8 pt-6 sm:pb-10">
          <Link href={`/${code}/ride`} className="text-sm font-semibold text-white/80 hover:text-white hover:underline">Ride and delivery</Link>
          <h1 className="mt-3 text-[2rem] font-bold leading-tight text-white sm:text-5xl">Official taxi fares</h1>
          <p className="mt-2 max-w-2xl text-white/85">Published rates for common taxi journeys in {country.name}. Confirm the fare with your driver before you set off.</p>
        </Container>
      </section>
      <Container className="max-w-3xl space-y-10 py-8">
        {tables.map((t) => (
          <section key={t.id} aria-labelledby={`${t.id}-h`}>
            <h2 id={`${t.id}-h`} className="text-2xl font-semibold">{t.island ? "Carriacou: " : ""}From {t.origin}</h2>
            <p className="mt-1 text-sm">{t.basis}.{t.note ? ` ${t.note}` : ""}</p>
            {/* A list, not a wide table: the destination and its price are always on screen together. */}
            <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl bg-raised ring-1 ring-line/60">
              {t.rows.map((r) => (
                <li key={r.places} className="flex items-start gap-4 px-4 py-3">
                  <span className="min-w-0 flex-1 text-ink">{r.places}</span>
                  <span className="shrink-0 text-right">
                    <span className="block text-lg font-bold text-ink">EC${r.xcd}{r.maxXcd ? `–${r.maxXcd}` : ""}</span>
                    {(r.usd != null || r.afterXcd) && <span className="block text-xs">{r.usd != null ? `US$${r.usd}` : ""}{r.afterXcd ? ` · after hours EC$${r.afterXcd}` : ""}</span>}
                    {r.note && <span className="block max-w-[9rem] text-xs">{r.note}</span>}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs">
              Source: {t.sourceUrl ? <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-link underline">{t.source}</a> : t.source}, {t.sourceDate}.
            </p>
          </section>
        ))}
        {!tables.length && <p>No official fares are published here yet.</p>}
      </Container>
    </main>
  );
}
