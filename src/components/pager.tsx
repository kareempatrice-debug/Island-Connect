import Link from "next/link";

export const PAGE_SIZE = 24;

/** "Show more" for long result lists. Keeps every other search parameter in the URL. */
export function ShowMore({ basePath, params, page, shown, hasMore }: { basePath: string; params: Record<string, string | undefined>; page: number; shown: number; hasMore: boolean }) {
  if (!hasMore) return null;
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && k !== "page" && q.set(k, v));
  q.set("page", String(page + 1));
  return (
    <div className="mt-8 flex flex-col items-center gap-2">
      <Link href={`${basePath}?${q.toString()}`} scroll={false} className="inline-flex h-12 items-center rounded-full border border-line bg-raised px-6 font-semibold text-ink hover:border-ink/30">
        Show more
      </Link>
      <p className="text-sm">Showing {shown}</p>
    </div>
  );
}

export function pageFrom(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n >= 1 && n <= 20 ? n : 1;
}
