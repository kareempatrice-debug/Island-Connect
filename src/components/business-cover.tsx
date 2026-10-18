import Image from "next/image";
import { categoryArt } from "@/data/category-art";
import type { Business } from "@/lib/types";
import { categoryVisual, coverStyle, groupOf } from "./visuals";

/*
 * A business's own cover photo, or its category group's placeholder illustration.
 * We never show stock photography on a business's behalf.
 */
export function BusinessCover({ business, sizes, priority, large }: { business: Business; sizes: string; priority?: boolean; large?: boolean }) {
  const primary = business.categories.find((c) => c.isPrimary) ?? business.categories[0];
  if (business.coverUrl) {
    return <Image src={business.coverUrl} alt="" fill sizes={sizes} priority={priority} className="object-cover" />;
  }
  const art = categoryArt[groupOf(primary?.slug ?? "")];
  if (art) {
    return (
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${art.from}, ${art.to})` }} aria-hidden="true">
        <svg
          viewBox="0 0 320 200"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
          dangerouslySetInnerHTML={{ __html: `<circle cx="268" cy="44" r="60" fill="#fff" opacity=".05"/>${art.svg}` }}
        />
      </div>
    );
  }
  // Fallback for any future group without artwork yet.
  const { Icon, tone } = categoryVisual(primary?.slug ?? "");
  return (
    <div className="absolute inset-0" style={coverStyle(tone)} aria-hidden="true">
      <Icon className={`absolute text-white/15 ${large ? "-right-6 -top-10 h-72 w-72" : "-bottom-6 -right-4 h-36 w-36"}`} strokeWidth={1.25} />
    </div>
  );
}

export function BusinessLogo({ business, className = "" }: { business: Business; className?: string }) {
  const initials = business.name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0]).join("");
  if (business.logoUrl) {
    return (
      <span className={`relative block overflow-hidden bg-white ${className}`}>
        <Image src={business.logoUrl} alt={`${business.name} logo`} fill sizes="96px" className="object-contain p-1.5" />
      </span>
    );
  }
  return (
    <span className={`flex items-center justify-center bg-raised font-display font-semibold text-deep dark:text-link ${className}`} aria-hidden="true">
      {initials}
    </span>
  );
}
