import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { fareTables } from "@/data/fares";
import { getCountry } from "@/lib/data";

export const metadata: Metadata = { title: "Official taxi fares" };

export default async function Fares({ params }: { params: Promise<{ country: string }> }) {
  const { country: code } = await params;
  const country = (await getCountry(code))!;
  const tables = fareTables.filter((t) => t.country === code);
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
            <h2 id={`${t.id}-h`} className="text-2xl font-semibold">From {t.origin}</h2>
            <p className="mt-1 text-sm">{t.basis}.{t.note ? ` ${t.note}` : ""}</p>
            <div className="mt-4 overflow-x-auto rounded-2xl ring-1 ring-line/60">
              <table className="w-full min-w-[30rem] bg-raised text-left text-[0.95rem]">
                <thead className="bg-sunken text-sm text-ink">
                  <tr><th className="px-4 py-2.5 font-semibold">To</th><th className="px-4 py-2.5 text-right font-semibold">EC$</th><th className="px-4 py-2.5 text-right font-semibold">US$</th>{t.rows.some((r) => r.afterXcd) && <th className="px-4 py-2.5 text-right font-semibold">After hours EC$</th>}</tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {t.rows.map((r) => (
                    <tr key={r.places}>
                      <td className="px-4 py-2.5 text-ink">{r.places}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-ink">{r.xcd}</td>
                      <td className="px-4 py-2.5 text-right">{r.usd}</td>
                      {t.rows.some((x) => x.afterXcd) && <td className="px-4 py-2.5 text-right">{r.afterXcd ?? ""}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
