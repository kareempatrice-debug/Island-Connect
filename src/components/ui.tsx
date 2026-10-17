import Link from "next/link";
import { ChevronRight } from "lucide-react";

/* Shared layout and control primitives. Keep page files free of one-off styling. */

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-content px-5 sm:px-8 ${className}`}>{children}</div>;
}

export function Section({
  id,
  title,
  intro,
  action,
  children,
  className = "",
}: {
  id: string;
  title: string;
  intro?: React.ReactNode;
  action?: { href: string; label: string };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className={`pt-14 sm:pt-20 ${className}`}>
      <Container>
        <div className="flex items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h2 id={`${id}-heading`} className="text-[1.6rem] font-semibold leading-tight sm:text-[2rem]">
              {title}
            </h2>
            {intro && <p className="mt-2 text-[1.0625rem]">{intro}</p>}
          </div>
          {action && (
            <Link href={action.href} className="hidden shrink-0 items-center gap-1 font-semibold text-link hover:underline sm:inline-flex">
              {action.label}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
        <div className="mt-6 sm:mt-8">{children}</div>
        {action && (
          <Link href={action.href} className="mt-5 inline-flex items-center gap-1 font-semibold text-link sm:hidden">
            {action.label}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </Container>
    </section>
  );
}

export const btn = {
  primary:
    "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-ink shadow-sm transition hover:brightness-110 active:scale-[0.98]",
  secondary:
    "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-raised px-6 font-semibold text-ink transition hover:border-ink/30 active:scale-[0.98]",
  gold: "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gold px-6 font-semibold text-[#1E2933] transition hover:brightness-105 active:scale-[0.98]",
  ghostOnDark:
    "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/30 px-6 font-semibold text-white transition hover:bg-white/10",
};

export const input =
  "h-12 w-full rounded-xl border border-line bg-raised px-4 text-ink placeholder:text-muted/70 transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15";

export function Chip({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-[0.95rem] font-medium transition ${
        active ? "border-deep bg-deep text-white" : "border-line bg-raised text-ink hover:border-ink/30"
      }`}
    >
      {children}
    </Link>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold text-link">{children}</p>;
}
