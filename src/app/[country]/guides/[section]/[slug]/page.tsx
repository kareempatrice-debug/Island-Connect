import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { data, getCountry } from "@/lib/data";
import { getGuideSection } from "@/lib/guides";

// Served ready-made from Netlify and refreshed at most every 5 minutes (or straight away when a listing changes).
export const revalidate = 300;
// Prepared the first time someone visits, then served ready-made.
export function generateStaticParams() { return []; }


type Props = { params: Promise<{ country: string; section: string; slug: string }> };

const longDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, section, slug } = await params;
  const s = getGuideSection(section);
  const a = s ? await data.getArticle(country, s.slug, slug) : null;
  return { title: a?.title ?? "Guide", description: a?.summary ?? undefined };
}

export default async function ArticlePage({ params }: Props) {
  const { country: code, section: sectionSlug, slug } = await params;
  const section = getGuideSection(sectionSlug);
  if (!section) notFound();
  const [country, article] = await Promise.all([getCountry(code), data.getArticle(code, section.slug, slug)]);
  if (!article) notFound();
  const overdue = article.nextReviewAt ? new Date(article.nextReviewAt) < new Date() : false;

  return (
    <main className="mx-auto max-w-3xl px-5 pt-10 sm:px-8">
      <Link href={`/${code}/guides/${section.slug}`} className="text-sm font-semibold text-link hover:underline">
        {section.title}
      </Link>
      <h1 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">{article.title}</h1>
      <p className="mt-3 text-sm">
        Applies to {country!.name}.
        {article.verifiedAt && ` Checked against official sources on ${longDate(article.verifiedAt)}.`}
      </p>
      {overdue && (
        <p className="mt-4 rounded-xl border border-gold bg-gold/15 px-4 py-3 text-sm text-ink">
          This guide is due for review and some details may have changed. Check the official sources below before acting on it.
        </p>
      )}
      <div className="mt-8 space-y-4 text-[1.0625rem] leading-relaxed text-ink/90">
        {article.body.split(/\n{2,}/).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      {article.sources.length > 0 && (
        <section className="mt-10 rounded-panel bg-raised p-6 shadow-card ring-1 ring-line/60" aria-labelledby="sources-heading">
          <h2 id="sources-heading" className="text-lg font-semibold">Official sources</h2>
          <ul className="mt-3 space-y-2">
            {article.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-link underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs">
            This guide is general information, not legal, tax or immigration advice, and it does not decide whether a programme
            applies to you.
          </p>
        </section>
      )}
    </main>
  );
}
