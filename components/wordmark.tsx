import Image from "next/image";

/*
 * Uses the approved Island Connect mark, cut out of the supplied artwork.
 * A production SVG is still needed (see PROGRESS.md); swap the file in
 * public/brand/ when it arrives.
 */
export function Wordmark({ onDark = false, compact = false }: { onDark?: boolean; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="flex h-10 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
        <Image src="/brand/ic-mark.png" alt="" width={40} height={23} className="h-auto w-9" priority />
      </span>
      <span className={`leading-none ${compact ? "hidden sm:block" : ""}`}>
        <span className={`block font-display text-[1.15rem] font-semibold tracking-tight ${onDark ? "text-white" : "text-ink"}`}>
          Island Connect
        </span>
        <span className={`mt-1 block text-[0.62rem] font-medium tracking-[0.18em] ${onDark ? "text-white/70" : "text-muted"}`}>
          PEOPLE · PLACES · SERVICES
        </span>
      </span>
    </span>
  );
}
